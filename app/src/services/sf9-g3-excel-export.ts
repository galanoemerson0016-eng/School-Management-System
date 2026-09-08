/**
 * SF9 Grade 3 Excel Export Service
 * Populates the official DepEd Grade 3 SF9 template (G3 School Form 9 (SY 26-27).xlsx)
 * preserving all 8 worksheets, OpenXML styles, formulas, drawing relationships,
 * and dynamic calculations for Filipino, English, Math, Science, GMRC, and Makabansa.
 */

import JSZip from 'jszip';
import type { SF9ExcelExportOptions } from './sf9-excel-export';
import { formatLearnerName } from '../utils/student-name';

/**
 * Check if the grade level corresponds to Grade 3
 */
export function isGrade3(gradeLevel?: string | number): boolean {
  if (!gradeLevel) return false;
  const normalized = String(gradeLevel).toLowerCase().trim();
  return (
    normalized === '3' ||
    normalized === 'grade 3' ||
    normalized === 'grade3' ||
    normalized === 'g3' ||
    normalized === 'three' ||
    normalized.startsWith('grade 3') ||
    normalized.startsWith('g3') ||
    normalized.startsWith('3 -') ||
    normalized.startsWith('3-')
  );
}

/**
 * Fetch the raw Grade 3 template buffer from public/templates
 */
export async function fetchGrade3TemplateBuffer(): Promise<ArrayBuffer> {
  const cleanBase = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL)
    ? (import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`)
    : '/';
  const timestamp = Date.now();

  const templateUrls = [
    `${cleanBase}templates/G3%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
    `/templates/G3%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
    `templates/G3%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
    `${cleanBase}templates/G3%20School%20Form%209%20(SY%2026-27).xlsx`,
    `/templates/G3%20School%20Form%209%20(SY%2026-27).xlsx`,
    `templates/G3%20School%20Form%209%20(SY%2026-27).xlsx`,
    `${cleanBase}templates/G3_School_Form_9_(SY_26-27).xlsx?t=${timestamp}`,
    `/templates/G3_School_Form_9_(SY_26-27).xlsx?t=${timestamp}`,
    '/templates/G3 School Form 9 (SY 26-27).xlsx',
    'templates/G3 School Form 9 (SY 26-27).xlsx'
  ];

  for (const url of templateUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        // Ensure the response is an actual Excel/ZIP archive (PK\x03\x04)
        if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
          return buffer;
        }
      }
    } catch {
      // Continue to next URL
    }
  }

  // Node / test environment fallback
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const diskPath = path.resolve(process.cwd(), 'public/templates/G3 School Form 9 (SY 26-27).xlsx');
      if (fs.existsSync(diskPath)) {
        const buffer = fs.readFileSync(diskPath);
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      }
    } catch {
      // ignore
    }
  }

  throw new Error('Failed to fetch valid Grade 3 School Form 9 template.');
}

/**
 * XML Escape helper
 */
function escapeXml(str: string | number | undefined | null): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Replace or insert a cell value in a worksheet XML string with strict cell boundaries
 */
function updateCellInSheetXml(
  sheetXml: string,
  cellRef: string,
  value: string | number | undefined | null,
  isNumeric = false,
  forceStyle?: string
): string {
  const formattedVal = escapeXml(value);
  const isEmpty = value === '' || value === undefined || value === null;
  const isNum = (isNumeric || typeof value === 'number') && !isNaN(Number(value)) && typeof value !== 'string';

  // 1. Check self-closing cell first: <c r="D15" s="163"/>
  const selfClosingRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)\\/>`);
  if (selfClosingRegex.test(sheetXml)) {
    return sheetXml.replace(selfClosingRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleId = forceStyle || (styleMatch ? styleMatch[1] : '');
      const styleAttr = styleId ? ` s="${styleId}"` : '';
      if (isEmpty) {
        return `<c r="${cellRef}"${styleAttr}/>`;
      }
      if (isNum) {
        return `<c r="${cellRef}"${styleAttr}><v>${value}</v></c>`;
      }
      return `<c r="${cellRef}"${styleAttr} t="inlineStr"><is><t xml:space="preserve">${formattedVal}</t></is></c>`;
    });
  }

  // 2. Check full cell: <c r="C5" ...>...</c> (strictly bounded without crossing any other <c or </row>)
  const fullCellRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)>((?:(?!<c[\\s>]|<\\/row>|<row[\\s>])([\\s\\S]))*?)<\\/c>`);
  if (fullCellRegex.test(sheetXml)) {
    return sheetXml.replace(fullCellRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleId = forceStyle || (styleMatch ? styleMatch[1] : '');
      const styleAttr = styleId ? ` s="${styleId}"` : '';
      if (isEmpty) {
        return `<c r="${cellRef}"${styleAttr}/>`;
      }
      if (isNum) {
        return `<c r="${cellRef}"${styleAttr}><v>${value}</v></c>`;
      }
      return `<c r="${cellRef}"${styleAttr} t="inlineStr"><is><t xml:space="preserve">${formattedVal}</t></is></c>`;
    });
  }

  return sheetXml;
}

/**
 * Update the cached formula result <v>...</v> inside an existing formula cell
 */
function updateFormulaValueInSheetXml(
  sheetXml: string,
  cellRef: string,
  value: string | number | undefined | null
): string {
  const formattedVal = escapeXml(value);
  const isNum = typeof value === 'number' && !isNaN(value);
  const typeAttr = isNum ? '' : ' t="str"';

  // 1. Check self-closing cell: <c r="L11" s="555"/>
  const selfClosingRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)\\/>`);
  if (selfClosingRegex.test(sheetXml)) {
    return sheetXml.replace(selfClosingRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleAttr = styleMatch ? ` s="${styleMatch[1]}"` : '';
      return `<c r="${cellRef}"${styleAttr}${typeAttr}><v>${formattedVal}</v></c>`;
    });
  }

  // 2. Check full cell: <c r="C5" ...>...</c> (strictly bounded)
  const fullCellRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)>((?:(?!<c[\\s>]|<\\/row>|<row[\\s>])([\\s\\S]))*?)<\\/c>`);
  if (fullCellRegex.test(sheetXml)) {
    return sheetXml.replace(fullCellRegex, (_match, attrs, body) => {
      const cleanAttrs = attrs.replace(/\s+t="[^"]*"/g, '');
      const fMatch = body.match(/<f[^>]*>[\s\S]*?<\/f>/);
      const fTag = fMatch ? fMatch[0] : '';
      return `<c r="${cellRef}"${cleanAttrs}${typeAttr}>${fTag}<v>${formattedVal}</v></c>`;
    });
  }

  return sheetXml;
}

function escapeFormula(formula: string): string {
  if (!formula) return '';
  return formula
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Set an explicit formula and its computed value on a cell (replacing broken #REF! formulas).
 */
function updateFormulaCellExplicit(
  sheetXml: string,
  cellRef: string,
  formula: string,
  value: string | number
): string {
  const formattedVal = escapeXml(value);
  const isNum = typeof value === 'number' && !isNaN(value);
  const typeAttr = isNum ? '' : ' t="str"';
  const fTag = formula ? `<f>${escapeFormula(formula)}</f>` : '';
  const vTag = `<v>${formattedVal}</v>`;

  // 1. Self closing
  const selfClosingRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)\\/>`);
  if (selfClosingRegex.test(sheetXml)) {
    return sheetXml.replace(selfClosingRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleAttr = styleMatch ? ` s="${styleMatch[1]}"` : '';
      return `<c r="${cellRef}"${styleAttr}${typeAttr}>${fTag}${vTag}</c>`;
    });
  }

  // 2. Full cell
  const fullCellRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)>((?:(?!<c[\\s>]|<\\/row>|<row[\\s>])([\\s\\S]))*?)<\\/c>`);
  if (fullCellRegex.test(sheetXml)) {
    return sheetXml.replace(fullCellRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleAttr = styleMatch ? ` s="${styleMatch[1]}"` : '';
      return `<c r="${cellRef}"${styleAttr}${typeAttr}>${fTag}${vTag}</c>`;
    });
  }

  return sheetXml;
}

/**
 * Batch update formula results in a worksheet XML string
 */
function updateFormulaValuesBatch(
  sheetXml: string,
  formulaValues: Record<string, string | number | undefined | null>
): string {
  let xml = sheetXml;
  for (const [cellRef, val] of Object.entries(formulaValues)) {
    xml = updateFormulaValueInSheetXml(xml, cellRef, val);
  }
  return xml;
}

/**
 * Format date string to MM/DD/YYYY format for DepEd standard
 */
function formatDateToMMDDYYYY(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Batch update cell values in a worksheet XML string
 */
function updateCellsBatch(
  sheetXml: string,
  cells: Record<string, string | number | undefined | null>,
  styles?: Record<string, string>,
  isNumeric = false
): string {
  let xml = sheetXml;
  for (const [cellRef, val] of Object.entries(cells)) {
    const style = styles ? styles[cellRef] : undefined;
    xml = updateCellInSheetXml(xml, cellRef, val, isNumeric, style);
  }
  return xml;
}

/**
 * Map Grade 3 subjects into standard DepEd Grade 3 Learning Areas:
 * 1. Filipino
 * 2. English
 * 3. Mathematics
 * 4. Science
 * 5. GMRC / Values Education
 * 6. Makabansa
 */
function extractGrade3SubjectGrades(
  grades: Record<string, number[]>,
  subjects: { name: string; id?: string }[]
): {
  filipino: (number | '')[];
  english: (number | '')[];
  math: (number | '')[];
  science: (number | '')[];
  gmrc: (number | '')[];
  makabansa: (number | '')[];
} {
  const result = {
    filipino: ['', '', ''] as (number | '')[],
    english: ['', '', ''] as (number | '')[],
    math: ['', '', ''] as (number | '')[],
    science: ['', '', ''] as (number | '')[],
    gmrc: ['', '', ''] as (number | '')[],
    makabansa: ['', '', ''] as (number | '')[],
  };

  const getGradesFor = (keywords: string[]): number[] | null => {
    for (const [subjName, termGrades] of Object.entries(grades)) {
      const norm = subjName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (keywords.some(kw => norm.includes(kw.toLowerCase().replace(/[^a-z0-9]/g, '')))) {
        return termGrades;
      }
    }
    for (const subj of subjects) {
      const norm = subj.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (keywords.some(kw => norm.includes(kw.toLowerCase().replace(/[^a-z0-9]/g, '')))) {
        const found = grades[subj.name] || (subj.id ? grades[subj.id] : null);
        if (found) return found;
      }
    }
    return null;
  };

  const fil = getGradesFor(['filipino', 'wika']);
  if (fil) {
    result.filipino = [fil[0] || '', fil[1] || '', fil[2] || ''];
  }

  const eng = getGradesFor(['english']);
  if (eng) {
    result.english = [eng[0] || '', eng[1] || '', eng[2] || ''];
  }

  const mat = getGradesFor(['mathematics', 'math']);
  if (mat) {
    result.math = [mat[0] || '', mat[1] || '', mat[2] || ''];
  }

  const sci = getGradesFor(['science', 'agham']);
  if (sci) {
    result.science = [sci[0] || '', sci[1] || '', sci[2] || ''];
  }

  const gmr = getGradesFor(['gmrc', 'values', 'edukasyon sa pagpapakatao', 'esp']);
  if (gmr) {
    result.gmrc = [gmr[0] || '', gmr[1] || '', gmr[2] || ''];
  }

  const mak = getGradesFor(['makabansa', 'sibika', 'heka']);
  if (mak) {
    result.makabansa = [mak[0] || '', mak[1] || '', mak[2] || ''];
  }

  return result;
}

async function getLogoImageBytes(logoUrl: string | undefined): Promise<{ ext: string; data: Uint8Array } | null> {
  const trimmed = (logoUrl || '').trim();

  // 1. Base64 Data URL
  if (trimmed.startsWith('data:image/')) {
    const dataUrlMatch = trimmed.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (dataUrlMatch) {
      let ext = dataUrlMatch[1].toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
      if (typeof Buffer !== 'undefined') {
        const buf = Buffer.from(dataUrlMatch[2], 'base64');
        return { ext, data: buf };
      } else {
        const binaryString = atob(dataUrlMatch[2]);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return { ext, data: bytes };
      }
    }
  }

  // 2. Fetch fallback (custom url, base url + school-logo.png, /school-logo.png, school-logo.png)
  if (typeof fetch !== 'undefined') {
    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
    const urlsToTry = [
      trimmed,
      `${baseUrl}school-logo.png`,
      '/school-logo.png',
      'school-logo.png'
    ].filter(Boolean);

    for (const u of urlsToTry) {
      try {
        const res = await fetch(u);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const ext = u.includes('.jpg') || u.includes('.jpeg') ? 'jpg' : 'png';
          return { ext, data: new Uint8Array(ab) };
        }
      } catch {
        // try next
      }
    }
  }

  return null;
}

async function injectSchoolLogoIntoDrawing(
  zip: JSZip,
  drawingPath: string,
  drawingRelsPath: string,
  logoUrl?: string
) {
  const logoData = await getLogoImageBytes(logoUrl);
  const dFile = zip.file(drawingPath);
  if (!dFile) return;
  let dXml = await dFile.async('text');

  if (logoData) {
    const logoFileName = `school_logo.${logoData.ext}`;
    zip.file(`xl/media/${logoFileName}`, logoData.data);

    // Update drawing rels
    const relsFile = zip.file(drawingRelsPath);
    let relId = 'rId2';
    if (relsFile) {
      let relsXml = await relsFile.async('text');
      if (!relsXml.includes(logoFileName)) {
        const rIdMatches = relsXml.match(/Id="rId(\d+)"/g) || [];
        const ids = rIdMatches.map(m => parseInt(m.replace(/Id="rId(\d+)"/, '$1'), 10));
        const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 2;
        relId = `rId${nextId}`;

        relsXml = relsXml.replace(
          '</Relationships>',
          `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${logoFileName}"/></Relationships>`
        );
        zip.file(drawingRelsPath, relsXml);
      }
    }

    // Replace Shape 4 with <xdr:pic>
    const shape4Regex = /<xdr:oneCellAnchor>[\s\S]*?<xdr:cNvPr[^>]*?name="Shape 4"[\s\S]*?<\/xdr:oneCellAnchor>/;
    if (shape4Regex.test(dXml)) {
      const replacementPic = `<xdr:oneCellAnchor><xdr:from><xdr:col>9</xdr:col><xdr:colOff>447675</xdr:colOff><xdr:row>2</xdr:row><xdr:rowOff>200025</xdr:rowOff></xdr:from><xdr:ext cx="1276350" cy="1314450"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="4" name="School Logo" title="School Logo"><a:extLst><a:ext uri="{FF2B5EF4-FFF2-40B4-BE49-F238E27FC236}"><a16:creationId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" id="{00000000-0008-0000-0800-000004000000}"/></a:ext></a:extLst></xdr:cNvPr><xdr:cNvPicPr preferRelativeResize="0"/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${relId}" cstate="print"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="4418450" y="3081025"/><a:ext cx="1276350" cy="1314450"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></xdr:spPr></xdr:pic><xdr:clientData fLocksWithSheet="0"/></xdr:oneCellAnchor>`;
      dXml = dXml.replace(shape4Regex, replacementPic);
      zip.file(drawingPath, dXml);
    }

    // Ensure Content_Types has extension
    const ctFile = zip.file('[Content_Types].xml');
    if (ctFile) {
      let ctXml = await ctFile.async('text');
      const ext = logoData.ext;
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
      if (!ctXml.includes(`Extension="${ext}"`)) {
        ctXml = ctXml.replace(
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
          `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="${ext}" ContentType="${mime}"/>`
        );
        zip.file('[Content_Types].xml', ctXml);
      }
    }
  } else {
    // If no logo data could be found at all, remove Shape 4 so "Insert School Logo" placeholder doesn't appear
    dXml = dXml.replace(/<xdr:oneCellAnchor>[\s\S]*?<xdr:cNvPr[^>]*?name="Shape 4"[\s\S]*?<\/xdr:oneCellAnchor>/g, '');
    zip.file(drawingPath, dXml);
  }
}

/**
 * Populate the Grade 3 SF9 Template buffer with learner data and compute all 8 sheets
 */
export async function populateGrade3TemplateBuffer(
  templateBuffer: ArrayBuffer | Uint8Array | ArrayLike<number>,
  opts: SF9ExcelExportOptions
): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(templateBuffer as Parameters<typeof JSZip.loadAsync>[0]);

  const {
    student,
    schoolProfile,
    schoolYear,
    section,
    adviser,
    attendance,
    sectionStudents,
    grades,
    subjects
  } = opts;

  // 1. Remove stale calcChain.xml and its references so Excel dynamically rebuilds calculation dependencies without recovery errors
  zip.remove('xl/calcChain.xml');
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (relsFile) {
    let relsXml = await relsFile.async('text');
    relsXml = relsXml.replace(/<Relationship[^>]*?Target="calcChain\.xml"[^>]*?\/>/g, '');
    zip.file('xl/_rels/workbook.xml.rels', relsXml);
  }
  const ctFile = zip.file('[Content_Types].xml');
  if (ctFile) {
    let ctXml = await ctFile.async('text');
    ctXml = ctXml.replace(/<Override[^>]*?PartName="\/xl\/calcChain\.xml"[^>]*?\/>/g, '');
    zip.file('[Content_Types].xml', ctXml);
  }

  // 2. Force Full Calculation on Load in workbook.xml
  const wbFile = zip.file('xl/workbook.xml');
  if (wbFile) {
    let wbXml = await wbFile.async('text');
    if (wbXml.includes('<calcPr')) {
      wbXml = wbXml.replace(/<calcPr[^>]*?\/>/, '<calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/>');
    } else {
      wbXml = wbXml.replace('</workbook>', '<calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>');
    }
    // Set active tab to SF9 - GRADE 3 (Sheet 8, tab index 7)
    wbXml = wbXml.replace(/activeTab="\d+"/, 'activeTab="7"');
    zip.file('xl/workbook.xml', wbXml);
  }

  // Sanitize font names in styles.xml (remove rogue single quotes around 'Bookman Old Style')
  const stylesFile = zip.file('xl/styles.xml');
  if (stylesFile) {
    let stylesXml = await stylesFile.async('text');
    stylesXml = stylesXml.replace(/<name val="['"]*Bookman Old Style['"]*"\/>/gi, '<name val="Bookman Old Style"/>');
    stylesXml = stylesXml.replace(/<name val="'([^']+)'"\/>/g, '<name val="$1"/>');
    stylesXml = stylesXml.replace(/<name val="([^']*)'"\/>/g, '<name val="$1"/>');
    stylesXml = stylesXml.replace(/<name val="'([^']*)"\/>/g, '<name val="$1"/>');
    zip.file('xl/styles.xml', stylesXml);
  }

  // 3. Sort all section learners into Males and Females (DepEd alphabetical format)
  const allStudents = (sectionStudents && sectionStudents.length > 0) ? sectionStudents : [student];
  
  const males = allStudents
    .filter(s => {
      const g = (s.gender || '').trim().toLowerCase();
      return g === 'male' || g === 'm';
    })
    .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));

  const females = allStudents
    .filter(s => {
      const g = (s.gender || '').trim().toLowerCase();
      return g === 'female' || g === 'f';
    })
    .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));

  // Ensure current student is present
  const isMale = (student.gender || '').trim().toLowerCase().startsWith('m');
  if (isMale && !males.some(m => m.lrn === student.lrn)) {
    males.unshift(student);
  } else if (!isMale && !females.some(f => f.lrn === student.lrn)) {
    females.unshift(student);
  }

  const currentStudentName = formatLearnerName(student);

  const cleanRegion = (schoolProfile?.region || 'Region III').trim();
  const rawDivision = (schoolProfile?.division || 'TARLAC PROVINCE').trim();
  const cleanDivision = rawDivision.toUpperCase().startsWith('DIVISION OF ')
    ? rawDivision.substring(12).trim()
    : rawDivision;
  let cleanCity = (schoolProfile?.city || schoolProfile?.municipality || '').trim();
  if (!cleanCity && schoolProfile?.district) {
    const extracted = schoolProfile.district.replace(/\b(east|west|north|south|central|district|dist\.|cluster|zone)\b/gi, '').trim();
    if (extracted) cleanCity = extracted;
  }
  if (!cleanCity && schoolProfile?.province) {
    cleanCity = schoolProfile.province.trim();
  }
  cleanCity = (cleanCity || 'VICTORIA').toUpperCase();
  const cleanDistrict = (schoolProfile?.district || '').trim();
  const cleanSchoolId = (schoolProfile?.school_id || '').trim();
  const cleanSchoolName = (schoolProfile?.name || '').trim();
  const cleanSy = (schoolYear || '2026-2027').trim();
  const cleanHead = (schoolProfile?.head_name || '').trim();
  const cleanAdviser = (adviser || '').trim();
  const cleanSection = (section || '').trim();

  // -------------------------------------------------------------------------
  // 4. Sheet 2: INPUT DATA (xl/worksheets/sheet2.xml)
  // -------------------------------------------------------------------------
  const sheet2File = zip.file('xl/worksheets/sheet2.xml');
  if (sheet2File) {
    let sheet2Xml = await sheet2File.async('text');

    const inputCells: Record<string, string | number> = {
      'F10': cleanRegion,
      'F11': cleanDivision,
      'F12': cleanCity,
      'F13': cleanDistrict,
      'F15': cleanSchoolId,
      'F16': cleanSchoolName,
      'F18': cleanSy,
      'F19': cleanHead,
      'F26': cleanAdviser,
      'F27': 3,
      'F28': cleanSection,
    };

    const inputStyles: Record<string, string> = {};

    // Males: L11:L60 (Names), M11:M60 (LRN), N11:N60 (Birthdate)
    for (let idx = 0; idx < 50; idx++) {
      const r = 11 + idx;
      const m = males[idx];
      inputCells[`L${r}`] = m ? formatLearnerName(m) : '';
      inputCells[`M${r}`] = m ? (m.lrn || '') : '';
      inputCells[`N${r}`] = m ? formatDateToMMDDYYYY(m.birthday) : '';
      inputStyles[`L${r}`] = '26';
      inputStyles[`M${r}`] = '27';
      inputStyles[`N${r}`] = '28';
    }

    // Females: Q11:Q60 (Names), R11:R60 (LRN), S11:S60 (Birthdate)
    for (let idx = 0; idx < 50; idx++) {
      const r = 11 + idx;
      const f = females[idx];
      inputCells[`Q${r}`] = f ? formatLearnerName(f) : '';
      inputCells[`R${r}`] = f ? (f.lrn || '') : '';
      inputCells[`S${r}`] = f ? formatDateToMMDDYYYY(f.birthday) : '';
      inputStyles[`Q${r}`] = '26';
      inputStyles[`R${r}`] = '27';
      inputStyles[`S${r}`] = '28';
    }

    sheet2Xml = updateCellsBatch(sheet2Xml, inputCells, inputStyles);
    zip.file('xl/worksheets/sheet2.xml', sheet2Xml);
  }

  // -------------------------------------------------------------------------
  // 5. Term Summaries: Sheets 3, 4, 5 (TERM 1, TERM 2, TERM 3)
  // -------------------------------------------------------------------------
  const termFiles = [
    { name: 'xl/worksheets/sheet3.xml', termIndex: 0 },
    { name: 'xl/worksheets/sheet4.xml', termIndex: 1 },
    { name: 'xl/worksheets/sheet5.xml', termIndex: 2 },
  ];

  for (const { name: termFile, termIndex } of termFiles) {
    const sFile = zip.file(termFile);
    if (!sFile) continue;

    let sXml = await sFile.async('text');
    const termCells: Record<string, string | number> = {};
    const termFormulaResults: Record<string, string | number> = {
      'E5': cleanRegion,
      'I5': cleanDivision,
      'E6': cleanSchoolName,
      'I6': cleanSchoolId,
      'N6': cleanSy,
      'G9': 3,
      'L9': cleanAdviser,
      'G10': cleanSection,
      'L10': cleanAdviser,
    };

    type StudentWithGrades = { grades?: Record<string, number[]> };

    // Males: Rows 14 to 63
    for (let idx = 0; idx < 50; idx++) {
      const r = 14 + idx;
      const m = males[idx];
      const mName = m ? formatLearnerName(m) : '';
      termFormulaResults[`C${r}`] = mName;
      termFormulaResults[`F${r}`] = m ? (m.lrn || '') : '';
      termFormulaResults[`H${r}`] = m ? formatDateToMMDDYYYY(m.birthday) : '';

      const stGrades = (m?.lrn === student.lrn) ? grades : ((m as unknown as StudentWithGrades)?.grades || {});
      const g3Grades = extractGrade3SubjectGrades(stGrades, subjects);

      termCells[`J${r}`] = m ? 'M' : '';
      termCells[`K${r}`] = g3Grades.filipino[termIndex];
      termCells[`L${r}`] = g3Grades.english[termIndex];
      termCells[`M${r}`] = g3Grades.math[termIndex];
      termCells[`N${r}`] = g3Grades.science[termIndex];
      termCells[`O${r}`] = g3Grades.gmrc[termIndex];
      termCells[`P${r}`] = g3Grades.makabansa[termIndex];
    }

    // Females: Rows 65 to 114
    for (let idx = 0; idx < 50; idx++) {
      const r = 65 + idx;
      const f = females[idx];
      const fName = f ? formatLearnerName(f) : '';
      termFormulaResults[`C${r}`] = fName;
      termFormulaResults[`F${r}`] = f ? (f.lrn || '') : '';
      termFormulaResults[`H${r}`] = f ? formatDateToMMDDYYYY(f.birthday) : '';

      const stGrades = (f?.lrn === student.lrn) ? grades : ((f as unknown as StudentWithGrades)?.grades || {});
      const g3Grades = extractGrade3SubjectGrades(stGrades, subjects);

      termCells[`J${r}`] = f ? 'F' : '';
      termCells[`K${r}`] = g3Grades.filipino[termIndex];
      termCells[`L${r}`] = g3Grades.english[termIndex];
      termCells[`M${r}`] = g3Grades.math[termIndex];
      termCells[`N${r}`] = g3Grades.science[termIndex];
      termCells[`O${r}`] = g3Grades.gmrc[termIndex];
      termCells[`P${r}`] = g3Grades.makabansa[termIndex];
    }

    sXml = updateFormulaValuesBatch(sXml, termFormulaResults);
    sXml = updateCellsBatch(sXml, termCells, undefined, true);
    zip.file(termFile, sXml);
  }

  // -------------------------------------------------------------------------
  // 6. Sheet 6: FINAL GRADES (xl/worksheets/sheet6.xml)
  // -------------------------------------------------------------------------
  const sheet6File = zip.file('xl/worksheets/sheet6.xml');
  if (sheet6File) {
    let sheet6Xml = await sheet6File.async('text');
    const fgFormulaResults: Record<string, string | number> = {
      'E5': cleanRegion,
      'I5': cleanDivision,
      'E7': cleanSchoolName,
      'I7': cleanSchoolId,
      'N7': cleanSy,
      'G10': 3,
      'L10': cleanAdviser,
      'G11': cleanSection,
      'L11': cleanAdviser,
      'P11': cleanAdviser,
    };

    // Males: rows 15-64
    for (let idx = 0; idx < 50; idx++) {
      const r = 15 + idx;
      const m = males[idx];
      fgFormulaResults[`C${r}`] = m ? formatLearnerName(m) : '';
    }
    // Females: rows 66-115
    for (let idx = 0; idx < 50; idx++) {
      const r = 66 + idx;
      const f = females[idx];
      fgFormulaResults[`C${r}`] = f ? formatLearnerName(f) : '';
    }

    // Overwrite template dummy text in merged adviser signature range P10:T11
    const adviserCells: Record<string, string | number> = {
      'P10': cleanAdviser,
      'Q10': cleanAdviser,
      'R10': cleanAdviser,
      'S10': cleanAdviser,
      'T10': cleanAdviser,
      'P11': cleanAdviser,
      'Q11': cleanAdviser,
      'R11': cleanAdviser,
      'S11': cleanAdviser,
      'T11': cleanAdviser,
    };

    sheet6Xml = updateFormulaValuesBatch(sheet6Xml, fgFormulaResults);
    sheet6Xml = updateCellsBatch(sheet6Xml, adviserCells);
    zip.file('xl/worksheets/sheet6.xml', sheet6Xml);
  }

  // -------------------------------------------------------------------------
  // 7. Sheet 7: ATTENDANCE RECORD SUMMARY (xl/worksheets/sheet7.xml)
  // -------------------------------------------------------------------------
  const sheet7File = zip.file('xl/worksheets/sheet7.xml');
  if (sheet7File) {
    let sheet7Xml = await sheet7File.async('text');
    const attCells: Record<string, string | number> = {};
    const attFormulaResults: Record<string, string | number> = {
      'E5': cleanRegion,
      'I5': cleanDivision,
      'E7': cleanSchoolName,
      'I7': cleanSchoolId,
      'N7': cleanSy,
      'G10': 3,
      'L10': cleanAdviser,
      'G11': cleanSection,
      'L11': cleanAdviser,
    };

    // Month columns: F=Jun, G=Jul, H=Aug, I=Sep, J=Oct, K=Nov, L=Dec, M=Jan, N=Feb, O=Mar, P=Apr
    const monthCols = ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P']; // Jun to Apr (11 months)

    // Populate Row 13: School Days in Sheet 7
    if (attendance?.schoolDays && attendance.schoolDays.length > 0) {
      attendance.schoolDays.forEach((sd, idx) => {
        if (idx < monthCols.length && sd !== undefined && sd !== null && sd > 0) {
          attCells[`${monthCols[idx]}13`] = Number(sd);
        }
      });
    }

    // Clear template dummy data in rows 14-63 and 65-114
    for (let idx = 0; idx < 50; idx++) {
      const r = 14 + idx;
      const m = males[idx];
      attFormulaResults[`C${r}`] = m ? formatLearnerName(m) : '';
      monthCols.forEach(col => { attCells[`${col}${r}`] = ''; });
    }
    for (let idx = 0; idx < 50; idx++) {
      const r = 65 + idx;
      const f = females[idx];
      attFormulaResults[`C${r}`] = f ? formatLearnerName(f) : '';
      monthCols.forEach(col => { attCells[`${col}${r}`] = ''; });
    }

    type StudentWithAtt = { attendance?: { daysPresent?: number[] } };

    // Populate all male students' attendance
    males.forEach((m, idx) => {
      if (idx < 50) {
        const r = 14 + idx;
        const studentAtt = (m as unknown as StudentWithAtt).attendance;
        const dpList = (m.lrn === student.lrn && attendance?.daysPresent && attendance.daysPresent.length > 0)
          ? attendance.daysPresent
          : (studentAtt?.daysPresent || []);
        dpList.forEach((dp, mIdx) => {
          if (mIdx < monthCols.length && dp !== undefined && dp !== null && dp !== ('' as unknown as number)) {
            attCells[`${monthCols[mIdx]}${r}`] = Number(dp);
          }
        });
      }
    });

    // Populate all female students' attendance
    females.forEach((f, idx) => {
      if (idx < 50) {
        const r = 65 + idx;
        const studentAtt = (f as unknown as StudentWithAtt).attendance;
        const dpList = (f.lrn === student.lrn && attendance?.daysPresent && attendance.daysPresent.length > 0)
          ? attendance.daysPresent
          : (studentAtt?.daysPresent || []);
        dpList.forEach((dp, mIdx) => {
          if (mIdx < monthCols.length && dp !== undefined && dp !== null && dp !== ('' as unknown as number)) {
            attCells[`${monthCols[mIdx]}${r}`] = Number(dp);
          }
        });
      }
    });

    sheet7Xml = updateFormulaValuesBatch(sheet7Xml, attFormulaResults);
    sheet7Xml = updateCellsBatch(sheet7Xml, attCells);
    zip.file('xl/worksheets/sheet7.xml', sheet7Xml);
  }

  // -------------------------------------------------------------------------
  // 8. Sheet 8: SF9 - GRADE 3 (xl/worksheets/sheet8.xml)
  // -------------------------------------------------------------------------
  const sheet8File = zip.file('xl/worksheets/sheet8.xml');
  if (sheet8File) {
    let sheet8Xml = await sheet8File.async('text');

    // 1. Fix School Profile header lines (replaces broken template #REF! and dummy text)
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B7', "'INPUT DATA'!F10", cleanRegion);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B8', "'INPUT DATA'!F11", cleanDivision);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B9', "'INPUT DATA'!F13", schoolProfile?.district ? `${schoolProfile.district} District` : (schoolProfile?.city || schoolProfile?.municipality || ''));
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B10', "'INPUT DATA'!F15", cleanSchoolId ? `School ID: ${cleanSchoolId}` : '');
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B12', "'INPUT DATA'!F16", cleanSchoolName);
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'B15', `School Year ${cleanSy}`);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'I39', "IF(COUNT(I33:I38)=0,\"\",AVERAGE((I33:I38)))", "");
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'F40', '');
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B27', "'INPUT DATA'!F19", cleanHead);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'H27', "'INPUT DATA'!F26", cleanAdviser);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'X40', "'INPUT DATA'!F26", cleanAdviser);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'Q41', "'INPUT DATA'!F19", cleanHead);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'Q49', "'INPUT DATA'!F19", cleanHead);

    // 2. Repair template missing formula for July in S7 (Row 7 only; Row 8 is lower merged cell)
    sheet8Xml = updateFormulaCellExplicit(
      sheet8Xml,
      'S7',
      "IF('ATTENDANCE RECORD SUMMARY'!F14=\"\",\"\",IFERROR(VLOOKUP(C17,'ATTENDANCE RECORD SUMMARY'!$C$14:$P$114,5,0),\"\"))",
      ""
    );
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'S8', '');

    const calculatedAge = (() => {
      if (!student.birthday) return '';
      const b = new Date(student.birthday);
      if (isNaN(b.getTime())) return '';
      const now = new Date();
      let diff = now.getFullYear() - b.getFullYear();
      const m = now.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < b.getDate())) diff--;
      return diff >= 0 ? diff : '';
    })();

    const sf9Cells: Record<string, string | number> = {
      'C17': currentStudentName
    };
    const sf9FormulaResults: Record<string, string | number> = {
      'C18': student.lrn || '',
      'I17': calculatedAge,
      'K17': isMale ? 'M' : 'F',
    };

    const sf9MonthCols = ['R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB']; // Jun to Apr (11 columns)

    // Row 5: No. of Class Days
    if (attendance?.schoolDays && attendance.schoolDays.length > 0) {
      attendance.schoolDays.forEach((sd, idx) => {
        if (idx < sf9MonthCols.length && sd !== undefined && sd !== null && sd > 0) {
          sheet8Xml = updateCellInSheetXml(sheet8Xml, `${sf9MonthCols[idx]}5`, Number(sd));
        }
      });
      const totalClassDays = attendance.schoolDays.reduce((a, b) => a + (Number(b) || 0), 0);
      sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'AC5', 'SUM(R5:AB5)', totalClassDays > 0 ? totalClassDays : '');
    } else {
      sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'AC5', 'SUM(R5:AB5)', '');
    }

    // Row 7: No. of Days Present (Dynamic VLOOKUP formulas referencing C17 and ATTENDANCE RECORD SUMMARY)
    sf9MonthCols.forEach((col, idx) => {
      const vlookupCol = 4 + idx;
      const formula = `IF('ATTENDANCE RECORD SUMMARY'!F14="","",IFERROR(VLOOKUP(C17,'ATTENDANCE RECORD SUMMARY'!$C$14:$P$114,${vlookupCol},0),""))`;
      const cachedVal = (attendance?.daysPresent && attendance.daysPresent[idx] !== undefined && attendance.daysPresent[idx] !== null && attendance.daysPresent[idx] !== ('' as unknown as number))
        ? Number(attendance.daysPresent[idx])
        : '';
      sheet8Xml = updateFormulaCellExplicit(sheet8Xml, `${col}7`, formula, cachedVal);
    });
    const totalPresent = (attendance?.daysPresent && attendance.daysPresent.length > 0)
      ? attendance.daysPresent.reduce((a, b) => a + (Number(b) || 0), 0)
      : '';
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'AC7', 'SUM(R7:AB7)', (totalPresent !== '' && totalPresent > 0) ? totalPresent : (totalPresent === 0 ? 0 : ''));

    // Row 9: No. of Days Absent (Dynamic difference formulas between Class Days and Days Present)
    sf9MonthCols.forEach((col, idx) => {
      const formula = `IF(OR(${col}5="",${col}7=""),"",IF(${col}5>=${col}7,${col}5-${col}7,0))`;
      const classDays = (attendance?.schoolDays && attendance.schoolDays[idx]) ? Number(attendance.schoolDays[idx]) : 0;
      const dpVal = (attendance?.daysPresent && attendance.daysPresent[idx] !== undefined && attendance.daysPresent[idx] !== null && attendance.daysPresent[idx] !== ('' as unknown as number))
        ? Number(attendance.daysPresent[idx])
        : null;
      const cachedAbsent = (dpVal !== null && classDays > 0)
        ? Math.max(0, classDays - dpVal)
        : '';
      sheet8Xml = updateFormulaCellExplicit(sheet8Xml, `${col}9`, formula, cachedAbsent);
    });
    const totalSchoolDaysNum = (attendance?.schoolDays && attendance.schoolDays.length > 0)
      ? attendance.schoolDays.reduce((a, b) => a + (Number(b) || 0), 0)
      : 0;
    const totalAbsent = attendance?.daysAbsent
      ? attendance.daysAbsent.reduce((a, b) => a + (Number(b) || 0), 0)
      : (totalSchoolDaysNum > 0 && typeof totalPresent === 'number' ? Math.max(0, totalSchoolDaysNum - totalPresent) : '');
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'AC9', 'SUM(R9:AB9)', totalAbsent !== '' ? totalAbsent : '');

    sheet8Xml = updateFormulaValuesBatch(sheet8Xml, sf9FormulaResults);
    sheet8Xml = updateCellsBatch(sheet8Xml, sf9Cells);

    zip.file('xl/worksheets/sheet8.xml', sheet8Xml);
  }

  // Replace placeholder Shape 4 with School Logo if available
  await injectSchoolLogoIntoDrawing(
    zip,
    'xl/drawings/drawing8.xml',
    'xl/drawings/_rels/drawing8.xml.rels',
    schoolProfile?.logo_url
  );

  return await zip.generateAsync({ type: 'arraybuffer' });
}
