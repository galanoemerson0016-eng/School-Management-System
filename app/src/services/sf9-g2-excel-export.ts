/**
 * Grade 2 SF9 Excel Export Service
 * Populates the official DepEd Grade 2 School Form 9 template
 * (G2 School Form 9 (SY 26-27).xlsx)
 * using direct OpenXML package manipulation to guarantee 100% fidelity,
 * preserving all formulas, dynamic VLOOKUPs, ranking, merged ranges, and print setups.
 */

import JSZip from 'jszip';
import { formatLearnerName } from '../utils/student-name';
import type { SF9ExcelExportOptions } from './sf9-excel-export';

/**
 * Helper to check if a grade level string corresponds to Grade 2
 */
export function isGrade2(gradeLevel?: string): boolean {
  if (!gradeLevel) return false;
  const g = gradeLevel.toString().trim().toLowerCase();
  const digits = g.replace(/\D/g, '');
  if (digits === '12' || digits === '20') return false;
  return digits === '2' || g === 'g2' || /^grade\s*2(\D|$)/i.test(g);
}

/**
 * Helper to format any date string into DepEd MM/DD/YYYY format
 */
export function formatDateToMMDDYYYY(dateStr?: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;

  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${m}/${d}/${y}`;
  }

  const mdyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (mdyMatch) {
    const m = mdyMatch[1].padStart(2, '0');
    const d = mdyMatch[2].padStart(2, '0');
    const y = mdyMatch[3];
    return `${m}/${d}/${y}`;
  }

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  return trimmed;
}

/**
 * Fetch the official Grade 2 SF9 template buffer
 */
export async function fetchGrade2TemplateBuffer(): Promise<ArrayBuffer> {
  const cleanBase = (import.meta.env.BASE_URL || '/').endsWith('/') 
    ? (import.meta.env.BASE_URL || '/') 
    : `${import.meta.env.BASE_URL}/`;
  const timestamp = Date.now();
  
  const templateUrls = [
    `${cleanBase}templates/G2%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
    `/templates/G2%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
    `templates/G2%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
    `${cleanBase}templates/G2_School_Form_9_(SY_26-27).xlsx?t=${timestamp}`,
    `/templates/G2_School_Form_9_(SY_26-27).xlsx?t=${timestamp}`
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
      // Continue to fallback
    }
  }

  throw new Error('Failed to fetch valid Grade 2 School Form 9 template.');
}

/**
 * XML string escaping helper
 */
function escapeXml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Update or insert a cell value in an OpenXML worksheet string while preserving existing styles.
 */
function updateCellInSheetXml(
  sheetXml: string, 
  cellRef: string, 
  value: string | number, 
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
 * Update a cell's computed <v> value while preserving its existing <f> formula tag and styles.
 */
function updateFormulaValueInSheetXml(
  sheetXml: string,
  cellRef: string,
  value: string | number
): string {
  const formattedVal = escapeXml(value);

  // 1. Self-closing cell: cannot have formula, but if updated with value:
  const selfClosingRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)\\/>`);
  if (selfClosingRegex.test(sheetXml)) {
    return sheetXml.replace(selfClosingRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleAttr = styleMatch ? ` s="${styleMatch[1]}"` : '';
      const isNum = typeof value === 'number' && !isNaN(value);
      const typeAttr = isNum ? '' : ' t="str"';
      return `<c r="${cellRef}"${styleAttr}${typeAttr}><v>${formattedVal}</v></c>`;
    });
  }

  // 2. Full cell: strictly bounded without crossing any other <c or </row>
  const fullCellRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)>((?:(?!<c[\\s>]|<\\/row>|<row[\\s>])([\\s\\S]))*?)<\\/c>`);
  if (fullCellRegex.test(sheetXml)) {
    return sheetXml.replace(fullCellRegex, (_match, attrs, content) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleAttr = styleMatch ? ` s="${styleMatch[1]}"` : '';
      const formulaMatch = content ? content.match(/<f[^>]*?>[\s\S]*?<\/f>/) : null;
      const fTag = formulaMatch ? formulaMatch[0] : '';
      const isNum = typeof value === 'number' && !isNaN(value);
      const typeAttr = isNum ? '' : ' t="str"';
      const vTag = `<v>${formattedVal}</v>`;
      return `<c r="${cellRef}"${styleAttr}${typeAttr}>${fTag}${vTag}</c>`;
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
  let result = sheetXml;
  for (const [cellRef, val] of Object.entries(formulaValues)) {
    if (val !== undefined && val !== null) {
      result = updateFormulaValueInSheetXml(result, cellRef, val);
    }
  }
  return result;
}

/**
 * Batch update multiple cells in a worksheet XML string
 */
function updateCellsBatch(
  sheetXml: string, 
  cells: Record<string, string | number | undefined | null>,
  styles?: Record<string, string>
): string {
  let result = sheetXml;
  for (const [cellRef, val] of Object.entries(cells)) {
    if (val !== undefined && val !== null) {
      const isNumeric = typeof val === 'number';
      const forceStyle = styles?.[cellRef];
      result = updateCellInSheetXml(result, cellRef, val, isNumeric, forceStyle);
    }
  }
  return result;
}

/**
 * Extract subject grades for a student into Grade 2 learning areas:
 * [Filipino, English, Mathematics, GMRC, Makabansa]
 */
function extractG2SubjectGrades(
  grades: Record<string, number[]>,
  subjects: { name: string; id?: string }[]
): {
  filipino: (number | '')[];
  english: (number | '')[];
  math: (number | '')[];
  gmrc: (number | '')[];
  makabansa: (number | '')[];
} {
  const result = {
    filipino: ['', '', ''] as (number | '')[],
    english: ['', '', ''] as (number | '')[],
    math: ['', '', ''] as (number | '')[],
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

interface SheetInfo {
  name: string;
  sheetId: string;
  relId: string;
  path: string;
}

/**
 * Dynamically parse workbook.xml and workbook.xml.rels to map sheet names to their internal worksheet XML paths.
 */
async function getWorkbookSheetMap(zip: JSZip): Promise<{ sheetsByName: Map<string, SheetInfo>; sheetList: SheetInfo[] }> {
  const wbFile = zip.file('xl/workbook.xml');
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  const sheetsByName = new Map<string, SheetInfo>();
  const sheetList: SheetInfo[] = [];

  if (!wbFile || !relsFile) return { sheetsByName, sheetList };

  const wbXml = await wbFile.async('text');
  const relsXml = await relsFile.async('text');

  // Parse rels
  const relMap = new Map<string, string>();
  const relRegex = /<Relationship\s+[^>]*?Id="([^"]+)"[^>]*?Target="([^"]+)"/g;
  let relMatch;
  while ((relMatch = relRegex.exec(relsXml)) !== null) {
    const id = relMatch[1];
    let target = relMatch[2];
    if (!target.startsWith('xl/')) {
      target = `xl/${target.replace(/^\.?\//, '')}`;
    }
    relMap.set(id, target);
  }

  // Parse sheets
  const sheetRegex = /<sheet\s+[^>]*?name="([^"]+)"[^>]*?sheetId="([^"]+)"[^>]*?r:id="([^"]+)"[^>]*?\/>/g;
  let sheetMatch;
  while ((sheetMatch = sheetRegex.exec(wbXml)) !== null) {
    const name = sheetMatch[1];
    const sheetId = sheetMatch[2];
    const relId = sheetMatch[3];
    const path = relMap.get(relId) || `xl/worksheets/sheet${sheetId}.xml`;
    const info: SheetInfo = { name, sheetId, relId, path };
    sheetsByName.set(name, info);
    sheetList.push(info);
  }

  return { sheetsByName, sheetList };
}

/**
 * Dynamically resolve the drawing XML path and drawing rels path for a worksheet.
 */
async function getSheetDrawingInfo(
  zip: JSZip,
  sheetPath: string
): Promise<{ drawingPath: string; drawingRelsPath: string } | null> {
  const parts = sheetPath.split('/');
  const fileName = parts.pop();
  if (!fileName) return null;
  const dir = parts.join('/');
  const sheetRelsPath = `${dir}/_rels/${fileName}.rels`;

  const relsFile = zip.file(sheetRelsPath);
  if (!relsFile) return null;

  const relsXml = await relsFile.async('text');
  const drawingMatch = relsXml.match(/<Relationship\s+[^>]*?Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/drawing"[^>]*?Target="([^"]+)"/);
  if (!drawingMatch) return null;

  let target = drawingMatch[1];
  if (target.startsWith('../')) {
    target = `xl/${target.substring(3)}`;
  } else if (!target.startsWith('xl/')) {
    target = `xl/${target}`;
  }

  const dParts = target.split('/');
  const dFile = dParts.pop();
  const dDir = dParts.join('/');
  const drawingRelsPath = `${dDir}/_rels/${dFile}.rels`;

  return { drawingPath: target, drawingRelsPath };
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

    // Replace Shape 3, Shape 4, or placeholder containing "Insert School Logo" with <xdr:pic>
    const shapeRegex = /<xdr:oneCellAnchor>[\s\S]*?(?:<xdr:cNvPr[^>]*?name="Shape [34]"|Insert School Logo)[\s\S]*?<\/xdr:oneCellAnchor>/;
    if (shapeRegex.test(dXml)) {
      const replacementPic = `<xdr:oneCellAnchor><xdr:from><xdr:col>9</xdr:col><xdr:colOff>447675</xdr:colOff><xdr:row>2</xdr:row><xdr:rowOff>200025</xdr:rowOff></xdr:from><xdr:ext cx="1276350" cy="1314450"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="4" name="School Logo" title="School Logo"><a:extLst><a:ext uri="{FF2B5EF4-FFF2-40B4-BE49-F238E27FC236}"><a16:creationId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" id="{00000000-0008-0000-0800-000004000000}"/></a:ext></a:extLst></xdr:cNvPr><xdr:cNvPicPr preferRelativeResize="0"/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${relId}" cstate="print"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="4418450" y="3081025"/><a:ext cx="1276350" cy="1314450"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></xdr:spPr></xdr:pic><xdr:clientData fLocksWithSheet="0"/></xdr:oneCellAnchor>`;
      dXml = dXml.replace(shapeRegex, replacementPic);
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
    // If no logo data could be found at all, remove placeholder shape so "Insert School Logo" doesn't appear
    dXml = dXml.replace(/<xdr:oneCellAnchor>[\s\S]*?(?:<xdr:cNvPr[^>]*?name="Shape [34]"|Insert School Logo)[\s\S]*?<\/xdr:oneCellAnchor>/g, '');
    zip.file(drawingPath, dXml);
  }
}

/**
 * Populate the official DepEd Grade 2 School Form 9 template buffer
 */
export async function populateGrade2TemplateBuffer(
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

  // 2. Resolve workbook sheet map and force Full Calculation on Load in workbook.xml
  const { sheetsByName, sheetList } = await getWorkbookSheetMap(zip);
  const sf9Info = sheetsByName.get('SF9 - GRADE 2') || sheetList.find(s => s.name.toUpperCase().includes('SF9'));
  const sf9Index = sheetList.findIndex(s => s.name.toUpperCase().includes('SF9'));
  const activeTabIndex = sf9Index >= 0 ? sf9Index : 5;

  const wbFile = zip.file('xl/workbook.xml');
  if (wbFile) {
    let wbXml = await wbFile.async('text');
    if (wbXml.includes('<calcPr')) {
      wbXml = wbXml.replace(/<calcPr[^>]*?\/>/, '<calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/>');
    } else {
      wbXml = wbXml.replace('</workbook>', '<calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>');
    }
    // Set active tab dynamically to the SF9 - GRADE 2 sheet index
    if (wbXml.includes('activeTab=')) {
      wbXml = wbXml.replace(/activeTab="\d+"/, `activeTab="${activeTabIndex}"`);
    } else if (wbXml.includes('<workbookView')) {
      wbXml = wbXml.replace(/<workbookView\b([^>]*?)\/>/, `<workbookView$1 activeTab="${activeTabIndex}"/>`);
    } else if (wbXml.includes('<bookViews>')) {
      wbXml = wbXml.replace('<bookViews>', `<bookViews><workbookView activeTab="${activeTabIndex}"/>`);
    } else if (wbXml.includes('<sheets>')) {
      wbXml = wbXml.replace('<sheets>', `<bookViews><workbookView activeTab="${activeTabIndex}"/></bookViews><sheets>`);
    }
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
  const currentStudentName = formatLearnerName(student);
  const cleanDivision = (schoolProfile?.division || '').replace(/schools division office of/i, '').replace(/schools division of/i, '').trim().toUpperCase();
  const cleanRegion = schoolProfile?.region || '';
  const cleanSchoolName = schoolProfile?.name || '';
  const cleanSchoolId = schoolProfile?.school_id || '';
  const cleanSy = schoolYear || '2026-2027';
  const cleanSection = (section || '').toUpperCase();
  const cleanAdviser = adviser || '';
  const cleanHead = schoolProfile?.head_name || '';

  let cleanMuniCity = (schoolProfile?.municipality || schoolProfile?.city || '').trim();
  if (!cleanMuniCity && schoolProfile?.district) {
    const extracted = schoolProfile.district.replace(/\b(east|west|north|south|central|district|dist\.|cluster|zone)\b/gi, '').trim();
    if (extracted) cleanMuniCity = extracted;
  }
  if (!cleanMuniCity && schoolProfile?.province) {
    cleanMuniCity = schoolProfile.province.trim();
  }
  cleanMuniCity = (cleanMuniCity || 'VICTORIA').toUpperCase();

  // -------------------------------------------------------------------------
  // 3. Sheet: INPUT DATA
  // -------------------------------------------------------------------------
  const inputDataInfo = sheetsByName.get('INPUT DATA');
  const inputDataPath = inputDataInfo?.path || 'xl/worksheets/sheet2.xml';
  const sheet2File = zip.file(inputDataPath);
  if (sheet2File) {
    let sheet2Xml = await sheet2File.async('text');

    const inputCells: Record<string, string | number> = {
      'F10': cleanRegion,
      'F11': cleanDivision,
      'F12': cleanMuniCity,
      'F13': schoolProfile?.district || '',
      'F15': cleanSchoolId,
      'F16': cleanSchoolName,
      'F18': cleanSy,
      'F19': cleanHead,
      'F26': cleanAdviser,
      'F27': 2,
      'F28': cleanSection,
    };

    const inputStyles: Record<string, string> = {};

    // Populate Male Roster in L, M, N (Rows 11 to 60)
    for (let idx = 0; idx < 50; idx++) {
      const r = 11 + idx;
      const m = males[idx];
      if (m) {
        inputCells[`L${r}`] = formatLearnerName(m);
        inputCells[`M${r}`] = m.lrn || '';
        inputCells[`N${r}`] = formatDateToMMDDYYYY(m.birthday);
      } else {
        inputCells[`L${r}`] = '';
        inputCells[`M${r}`] = '';
        inputCells[`N${r}`] = '';
      }
      inputStyles[`L${r}`] = '23';  // Name with borders
      inputStyles[`M${r}`] = '24';  // LRN with borders & center alignment
      inputStyles[`N${r}`] = '248'; // Birthdate with borders & date alignment
    }

    // Populate Female Roster in Q, R, S (Rows 11 to 60)
    for (let idx = 0; idx < 50; idx++) {
      const r = 11 + idx;
      const f = females[idx];
      if (f) {
        inputCells[`Q${r}`] = formatLearnerName(f);
        inputCells[`R${r}`] = f.lrn || '';
        inputCells[`S${r}`] = formatDateToMMDDYYYY(f.birthday);
      } else {
        inputCells[`Q${r}`] = '';
        inputCells[`R${r}`] = '';
        inputCells[`S${r}`] = '';
      }
      inputStyles[`Q${r}`] = '23';  // Female Name with borders
      inputStyles[`R${r}`] = '24';  // Female LRN with borders & center alignment
      inputStyles[`S${r}`] = '248'; // Female Birthdate with borders & date alignment
    }

    sheet2Xml = updateCellsBatch(sheet2Xml, inputCells, inputStyles);
    zip.file(inputDataPath, sheet2Xml);
  }

  // -------------------------------------------------------------------------
  // 4. Extract Grades per student and update TERM 1, 2, 3 SUMMARIES
  // -------------------------------------------------------------------------
  const summarySheets = [
    { name: 'TERM 1 SUMMARY', defaultPath: 'xl/worksheets/sheet3.xml', termIndex: 0 },
    { name: 'TERM 2 SUMMARY', defaultPath: 'xl/worksheets/sheet4.xml', termIndex: 1 },
    { name: 'TERM 3 SUMMARY', defaultPath: 'xl/worksheets/sheet5.xml', termIndex: 2 },
  ];

  type StudentWithGrades = { grades?: Record<string, number[]> };
  const currentGrades = extractG2SubjectGrades(grades, subjects);

  for (const { name, defaultPath, termIndex } of summarySheets) {
    const sPath = sheetsByName.get(name)?.path || defaultPath;
    const sFile = zip.file(sPath);
    if (!sFile) continue;

    let sXml = await sFile.async('text');
    const termCells: Record<string, string | number> = {};
    const formulaResults: Record<string, string | number> = {
      'E5': cleanRegion,
      'K5': cleanDivision,
      'E6': cleanSchoolName,
      'K6': cleanSchoolId,
      'P6': cleanSy,
      'G9': 2,
      'N9': cleanAdviser,
      'G10': cleanSection,
    };

    // Males: Rows 14 to 63 (50 rows)
    for (let idx = 0; idx < 50; idx++) {
      const r = 14 + idx;
      const m = males[idx];
      if (m) {
        formulaResults[`C${r}`] = formatLearnerName(m);
        formulaResults[`F${r}`] = m.lrn || '';
        formulaResults[`H${r}`] = formatDateToMMDDYYYY(m.birthday);

        const studentGradesRecord = (m as unknown as StudentWithGrades).grades || {};
        const g = (m.lrn === student.lrn) ? currentGrades : extractG2SubjectGrades(studentGradesRecord, subjects);
        termCells[`J${r}`] = 'M';
        if (g.filipino[termIndex] !== '') termCells[`K${r}`] = Number(g.filipino[termIndex]);
        if (g.english[termIndex] !== '')  termCells[`L${r}`] = Number(g.english[termIndex]);
        if (g.math[termIndex] !== '')     termCells[`M${r}`] = Number(g.math[termIndex]);
        if (g.gmrc[termIndex] !== '')     termCells[`N${r}`] = Number(g.gmrc[termIndex]);
        if (g.makabansa[termIndex] !== '') termCells[`O${r}`] = Number(g.makabansa[termIndex]);
      } else {
        formulaResults[`C${r}`] = '';
        formulaResults[`F${r}`] = '';
        formulaResults[`H${r}`] = '';
        termCells[`J${r}`] = '';
        termCells[`K${r}`] = '';
        termCells[`L${r}`] = '';
        termCells[`M${r}`] = '';
        termCells[`N${r}`] = '';
        termCells[`O${r}`] = '';
      }
    }

    // Females: Rows 65 to 114 (50 rows, starting at Row 65!)
    for (let idx = 0; idx < 50; idx++) {
      const r = 65 + idx;
      const f = females[idx];
      if (f) {
        formulaResults[`C${r}`] = formatLearnerName(f);
        formulaResults[`F${r}`] = f.lrn || '';
        formulaResults[`H${r}`] = formatDateToMMDDYYYY(f.birthday);

        const studentGradesRecord = (f as unknown as StudentWithGrades).grades || {};
        const g = (f.lrn === student.lrn) ? currentGrades : extractG2SubjectGrades(studentGradesRecord, subjects);
        termCells[`J${r}`] = 'F';
        if (g.filipino[termIndex] !== '') termCells[`K${r}`] = Number(g.filipino[termIndex]);
        if (g.english[termIndex] !== '')  termCells[`L${r}`] = Number(g.english[termIndex]);
        if (g.math[termIndex] !== '')     termCells[`M${r}`] = Number(g.math[termIndex]);
        if (g.gmrc[termIndex] !== '')     termCells[`N${r}`] = Number(g.gmrc[termIndex]);
        if (g.makabansa[termIndex] !== '') termCells[`O${r}`] = Number(g.makabansa[termIndex]);
      } else {
        formulaResults[`C${r}`] = '';
        formulaResults[`F${r}`] = '';
        formulaResults[`H${r}`] = '';
        termCells[`J${r}`] = '';
        termCells[`K${r}`] = '';
        termCells[`L${r}`] = '';
        termCells[`M${r}`] = '';
        termCells[`N${r}`] = '';
        termCells[`O${r}`] = '';
      }
    }

    sXml = updateFormulaValuesBatch(sXml, formulaResults);
    sXml = updateCellsBatch(sXml, termCells);
    zip.file(sPath, sXml);
  }

  // -------------------------------------------------------------------------
  // 5. Sheet: FINAL GRADES (Only if present in workbook)
  // -------------------------------------------------------------------------
  const finalGradesInfo = sheetsByName.get('FINAL GRADES');
  if (finalGradesInfo) {
    const sheet6File = zip.file(finalGradesInfo.path);
    if (sheet6File) {
      let sheet6Xml = await sheet6File.async('text');
      // Overwrite template's hardcoded adviser in P10:T11 merged range
      const adviserCells = ['P10', 'Q10', 'R10', 'S10', 'T10', 'P11', 'Q11', 'R11', 'S11', 'T11'];
      adviserCells.forEach(cell => {
        sheet6Xml = updateCellInSheetXml(sheet6Xml, cell, cleanAdviser);
      });

      const fgResults: Record<string, string | number> = {
        'E6': cleanRegion,
        'L6': cleanDivision,
        'E7': cleanSchoolName,
        'L7': cleanSchoolId,
        'R7': cleanSy,
        'H10': 2,
        'H11': cleanSection,
      };

      for (let idx = 0; idx < 50; idx++) {
        const r = 15 + idx;
        const m = males[idx];
        fgResults[`C${r}`] = m ? formatLearnerName(m) : '';
      }
      for (let idx = 0; idx < 50; idx++) {
        const r = 66 + idx;
        const f = females[idx];
        fgResults[`C${r}`] = f ? formatLearnerName(f) : '';
      }

      sheet6Xml = updateFormulaValuesBatch(sheet6Xml, fgResults);
      zip.file(finalGradesInfo.path, sheet6Xml);
    }
  }

  // -------------------------------------------------------------------------
  // 6. Sheet: ATTENDANCE RECORD SUMMARY
  // -------------------------------------------------------------------------
  const attInfo = sheetsByName.get('ATTENDANCE RECORD SUMMARY');
  const attPath = attInfo?.path || 'xl/worksheets/sheet7.xml';
  const sheet7File = zip.file(attPath);
  if (sheet7File) {
    let sheet7Xml = await sheet7File.async('text');
    const attCells: Record<string, string | number> = {};
    const attFormulaResults: Record<string, string | number> = {
      'E5': cleanRegion,
      'I5': cleanDivision,
      'E7': cleanSchoolName,
      'I7': cleanSchoolId,
      'N7': cleanSy,
      'G10': 2,
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

    // Clear any template dummy data in rows 14-63 and 65-114
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
    zip.file(attPath, sheet7Xml);
  }

  // -------------------------------------------------------------------------
  // 7. Sheet: SF9 - GRADE 2
  // -------------------------------------------------------------------------
  const sf9Path = sf9Info?.path || 'xl/worksheets/sheet6.xml';
  const sf9File = zip.file(sf9Path);
  if (sf9File) {
    let sf9Xml = await sf9File.async('text');

    // 1. Fix School Profile header lines (replaces broken template #REF! and dummy text)
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B7', "'INPUT DATA'!F10", cleanRegion);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B8', "'INPUT DATA'!F11", cleanDivision);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B9', "'INPUT DATA'!F13", schoolProfile?.district ? `${schoolProfile.district} District` : (schoolProfile?.city || schoolProfile?.municipality || ''));
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B10', "'INPUT DATA'!F15", cleanSchoolId ? `School ID: ${cleanSchoolId}` : '');
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B12', "'INPUT DATA'!F16", cleanSchoolName);
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B15', `School Year ${cleanSy}`);
    sf9Xml = updateCellInSheetXml(sf9Xml, 'F39', '');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'F40', '');
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B27', "'INPUT DATA'!F19", cleanHead);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'H27', "'INPUT DATA'!F26", cleanAdviser);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'X40', "'INPUT DATA'!F26", cleanAdviser);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'Q41', "'INPUT DATA'!F19", cleanHead);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'Q49', "'INPUT DATA'!F19", cleanHead);

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

    // Pre-populate and cache Term Grades on F33:H37
    if (currentGrades.filipino[0] !== '') sf9FormulaResults['F33'] = currentGrades.filipino[0];
    if (currentGrades.filipino[1] !== '') sf9FormulaResults['G33'] = currentGrades.filipino[1];
    if (currentGrades.filipino[2] !== '') sf9FormulaResults['H33'] = currentGrades.filipino[2];

    if (currentGrades.english[0] !== '') sf9FormulaResults['F34'] = currentGrades.english[0];
    if (currentGrades.english[1] !== '') sf9FormulaResults['G34'] = currentGrades.english[1];
    if (currentGrades.english[2] !== '') sf9FormulaResults['H34'] = currentGrades.english[2];

    if (currentGrades.math[0] !== '') sf9FormulaResults['F35'] = currentGrades.math[0];
    if (currentGrades.math[1] !== '') sf9FormulaResults['G35'] = currentGrades.math[1];
    if (currentGrades.math[2] !== '') sf9FormulaResults['H35'] = currentGrades.math[2];

    if (currentGrades.gmrc[0] !== '') sf9FormulaResults['F36'] = currentGrades.gmrc[0];
    if (currentGrades.gmrc[1] !== '') sf9FormulaResults['G36'] = currentGrades.gmrc[1];
    if (currentGrades.gmrc[2] !== '') sf9FormulaResults['H36'] = currentGrades.gmrc[2];

    if (currentGrades.makabansa[0] !== '') sf9FormulaResults['F37'] = currentGrades.makabansa[0];
    if (currentGrades.makabansa[1] !== '') sf9FormulaResults['G37'] = currentGrades.makabansa[1];
    if (currentGrades.makabansa[2] !== '') sf9FormulaResults['H37'] = currentGrades.makabansa[2];

    // Pre-compute and cache Final Grades (Column I) and Official DepEd Remarks (Column J)
    const calcFinalAndRemark = (termGrades: (number | '')[]) => {
      const nums = termGrades.filter((g): g is number => typeof g === 'number' && !isNaN(g));
      if (nums.length === 0) return { finalGrade: '', remark: '' };
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      const rounded = Math.round(avg);
      return {
        finalGrade: rounded,
        remark: rounded >= 75 ? 'Passed' : 'Failed'
      };
    };

    const filFinal = calcFinalAndRemark(currentGrades.filipino);
    const engFinal = calcFinalAndRemark(currentGrades.english);
    const mathFinal = calcFinalAndRemark(currentGrades.math);
    const gmrcFinal = calcFinalAndRemark(currentGrades.gmrc);
    const makFinal = calcFinalAndRemark(currentGrades.makabansa);

    if (filFinal.finalGrade !== '') sf9FormulaResults['I33'] = filFinal.finalGrade;
    if (filFinal.remark !== '') sf9FormulaResults['J33'] = filFinal.remark;

    if (engFinal.finalGrade !== '') sf9FormulaResults['I34'] = engFinal.finalGrade;
    if (engFinal.remark !== '') sf9FormulaResults['J34'] = engFinal.remark;

    if (mathFinal.finalGrade !== '') sf9FormulaResults['I35'] = mathFinal.finalGrade;
    if (mathFinal.remark !== '') sf9FormulaResults['J35'] = mathFinal.remark;

    if (gmrcFinal.finalGrade !== '') sf9FormulaResults['I36'] = gmrcFinal.finalGrade;
    if (gmrcFinal.remark !== '') sf9FormulaResults['J36'] = gmrcFinal.remark;

    if (makFinal.finalGrade !== '') sf9FormulaResults['I37'] = makFinal.finalGrade;
    if (makFinal.remark !== '') sf9FormulaResults['J37'] = makFinal.remark;

    const allFinals = [filFinal.finalGrade, engFinal.finalGrade, mathFinal.finalGrade, gmrcFinal.finalGrade, makFinal.finalGrade]
      .filter((g): g is number => typeof g === 'number' && !isNaN(g));

    if (allFinals.length > 0) {
      const genAvg = Math.round(allFinals.reduce((a, b) => a + b, 0) / allFinals.length);
      sf9FormulaResults['I38'] = genAvg;
      sf9FormulaResults['J38'] = genAvg >= 75 ? 'Passed' : 'Failed';
    }

    const sf9MonthCols = ['R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB']; // Jun to Apr (11 columns)

    // Row 5: No. of Class Days
    if (attendance?.schoolDays && attendance.schoolDays.length > 0) {
      attendance.schoolDays.forEach((sd, idx) => {
        if (idx < sf9MonthCols.length && sd !== undefined && sd !== null && sd > 0) {
          sf9Xml = updateCellInSheetXml(sf9Xml, `${sf9MonthCols[idx]}5`, Number(sd));
        }
      });
      const totalClassDays = attendance.schoolDays.reduce((a, b) => a + (Number(b) || 0), 0);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC5', 'SUM(R5:AB5)', totalClassDays > 0 ? totalClassDays : '');
    } else {
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC5', 'SUM(R5:AB5)', '');
    }

    // Row 7: No. of Days Present (Dynamic VLOOKUP formulas referencing C17 and ATTENDANCE RECORD SUMMARY)
    sf9MonthCols.forEach((col, idx) => {
      const vlookupCol = 4 + idx;
      const formula = `IF('ATTENDANCE RECORD SUMMARY'!F14="","",IFERROR(VLOOKUP(C17,'ATTENDANCE RECORD SUMMARY'!$C$14:$P$114,${vlookupCol},0),""))`;
      const cachedVal = (attendance?.daysPresent && attendance.daysPresent[idx] !== undefined && attendance.daysPresent[idx] !== null && attendance.daysPresent[idx] !== ('' as unknown as number))
        ? Number(attendance.daysPresent[idx])
        : '';
      sf9Xml = updateFormulaCellExplicit(sf9Xml, `${col}7`, formula, cachedVal);
    });
    const totalPresent = (attendance?.daysPresent && attendance.daysPresent.length > 0)
      ? attendance.daysPresent.reduce((a, b) => a + (Number(b) || 0), 0)
      : '';
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC7', 'SUM(R7:AB7)', (totalPresent !== '' && totalPresent > 0) ? totalPresent : (totalPresent === 0 ? 0 : ''));

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
      sf9Xml = updateFormulaCellExplicit(sf9Xml, `${col}9`, formula, cachedAbsent);
    });
    const totalSchoolDaysNum = (attendance?.schoolDays && attendance.schoolDays.length > 0)
      ? attendance.schoolDays.reduce((a, b) => a + (Number(b) || 0), 0)
      : 0;
    const totalAbsent = attendance?.daysAbsent
      ? attendance.daysAbsent.reduce((a, b) => a + (Number(b) || 0), 0)
      : (totalSchoolDaysNum > 0 && typeof totalPresent === 'number' ? Math.max(0, totalSchoolDaysNum - totalPresent) : '');
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC9', 'SUM(R9:AB9)', totalAbsent !== '' ? totalAbsent : '');

    sf9Xml = updateFormulaValuesBatch(sf9Xml, sf9FormulaResults);
    sf9Xml = updateCellsBatch(sf9Xml, sf9Cells);

    zip.file(sf9Path, sf9Xml);
  }

  // Dynamically resolve SF9 drawing path and replace placeholder Shape with School Logo
  const sf9Drawing = await getSheetDrawingInfo(zip, sf9Path);
  if (sf9Drawing) {
    await injectSchoolLogoIntoDrawing(
      zip,
      sf9Drawing.drawingPath,
      sf9Drawing.drawingRelsPath,
      schoolProfile?.logo_url
    );
  } else {
    const fallbackDrawing = zip.file('xl/drawings/drawing6.xml') ? 'xl/drawings/drawing6.xml' : 'xl/drawings/drawing8.xml';
    const fallbackRels = zip.file('xl/drawings/drawing6.xml') ? 'xl/drawings/_rels/drawing6.xml.rels' : 'xl/drawings/_rels/drawing8.xml.rels';
    await injectSchoolLogoIntoDrawing(
      zip,
      fallbackDrawing,
      fallbackRels,
      schoolProfile?.logo_url
    );
  }

  return await zip.generateAsync({ type: 'arraybuffer' });
}
