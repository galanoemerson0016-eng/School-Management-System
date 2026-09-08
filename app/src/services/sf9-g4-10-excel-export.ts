import JSZip from 'jszip';
import type { Student, SchoolProfile, Subject } from '../types';

export interface SF9Grade4to10ExportOptions {
  student: Student;
  schoolProfile?: SchoolProfile;
  schoolYear: string;
  section: string;
  adviser?: string;
  principal?: string;
  principalTitle?: string;
  grades: Record<string, { q1?: number | string; q2?: number | string; q3?: number | string; final?: number | string }>;
  subjects: Subject[];
  attendance?: {
    months: string[];
    schoolDays: number[];
    daysPresent: number[];
    daysAbsent: number[];
  };
  gradeLevel?: string;
  learners?: (Student & {
    grades?: Record<string, { q1?: number | string; q2?: number | string; q3?: number | string; final?: number | string }>;
    attendance?: { daysPresent?: number[] };
  })[];
}

interface StudentWithGrades extends Student {
  grades?: Record<string, { q1?: number | string; q2?: number | string; q3?: number | string; final?: number | string }>;
}

export function isGrade4to10(gradeLevel: string | undefined | null): boolean {
  if (!gradeLevel) return false;
  const s = gradeLevel.trim().toLowerCase();

  // Exclude Grade 11, 12, 1, 2, 3 explicitly if ambiguous
  if (/\b(?:grade\s*11|grade\s*12|grade\s*1|grade\s*2|grade\s*3|g11|g12|g1|g2|g3|kinder|kindergarten|shs)\b/i.test(s)) {
    return false;
  }

  // Match Grade 4 to 10 in various forms
  if (/\b(?:grade\s*(?:4|5|6|7|8|9|10)|g(?:4|5|6|7|8|9|10)|grade\s*(?:iv|v|vi|vii|viii|ix|x)|(?:four|five|six|seven|eight|nine|ten))\b/i.test(s)) {
    return true;
  }

  // Exact numbers 4, 5, 6, 7, 8, 9, 10
  if (/^(?:4|5|6|7|8|9|10)$/.test(s)) {
    return true;
  }

  return false;
}

export function extractGrade4to10GradeNumber(gradeLevel: string | undefined | null): number {
  if (!gradeLevel) return 4;
  const s = gradeLevel.trim().toLowerCase();
  const m = s.match(/\b(10|[4-9])\b/);
  if (m) return parseInt(m[1], 10);
  if (s.includes('iv') || s.includes('four')) return 4;
  if (s.includes('viii') || s.includes('eight')) return 8;
  if (s.includes('vii') || s.includes('seven')) return 7;
  if (s.includes('vi') || s.includes('six')) return 6;
  if (s.includes('v') || s.includes('five')) return 5;
  if (s.includes('ix') || s.includes('nine')) return 9;
  if (s.includes('x') || s.includes('ten')) return 10;
  return 4;
}

export function formatDateToMMDDYYYY(dateVal: string | Date | undefined | null): string {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export function formatLearnerName(s: Student): string {
  const last = (s.last_name || '').trim().toUpperCase();
  const first = (s.first_name || '').trim().toUpperCase();
  const rawExt = (s.name_extension || '').trim().toUpperCase();
  const rawMid = (s.middle_name || '').trim().toUpperCase();

  const cleanExtLetters = rawExt.replace(/[^A-Z0-9]/g, '');
  const isPlaceholderExt = !cleanExtLetters || ['NA', 'NONE', 'NULL', 'NO', '-'].includes(cleanExtLetters);
  const ext = isPlaceholderExt ? '' : rawExt;

  const cleanMidLetters = rawMid.replace(/[^A-Z]/g, '');
  const isPlaceholderMid = !cleanMidLetters || ['NA', 'NONE', 'NULL', '-'].includes(cleanMidLetters);
  const midInitial = isPlaceholderMid ? '' : `${cleanMidLetters.charAt(0)}.`;

  const firstWithExt = ext ? `${first} ${ext}` : first;
  if (last && firstWithExt) {
    return midInitial ? `${last}, ${firstWithExt} ${midInitial}` : `${last}, ${firstWithExt}`;
  }
  return last || firstWithExt || '';
}

export function extractGrade4to10SubjectGrades(
  gradesRecord: Record<string, { q1?: number | string; q2?: number | string; q3?: number | string; final?: number | string }> = {},
  subjectsList: Subject[] = []
): {
  filipino: (string | number)[];
  english: (string | number)[];
  math: (string | number)[];
  science: (string | number)[];
  ap: (string | number)[];
  esp: (string | number)[];
  epp_tle: (string | number)[];
  music_arts: (string | number)[];
  pe_health: (string | number)[];
} {
  const getSubjectScores = (matchFn: (name: string, code: string, normName: string, normCode: string) => boolean): (string | number)[] => {
    let matchedKey: string | null = null;

    for (const [key] of Object.entries(gradesRecord)) {
      const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const subObj = subjectsList.find(s => {
        const sName = s.subject_name || (s as unknown as { name?: string }).name || '';
        const sCode = s.subject_code || (s as unknown as { code?: string }).code || '';
        const normSName = sName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normSCode = sCode.toLowerCase().replace(/[^a-z0-9]/g, '');
        return s.id === key || sName.toLowerCase() === key.toLowerCase() || (sCode && sCode.toLowerCase() === key.toLowerCase()) || (normSName && normSName === normKey) || (normSCode && normSCode === normKey);
      });
      const subName = subObj ? (subObj.subject_name || (subObj as unknown as { name?: string }).name || key) : key;
      const subCode = subObj ? (subObj.subject_code || (subObj as unknown as { code?: string }).code || '') : '';
      const normName = subName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normCode = subCode.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (matchFn(subName.toLowerCase(), subCode.toLowerCase(), normName, normCode)) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      return ['', '', ''];
    }

    const g = gradesRecord[matchedKey];
    if (Array.isArray(g)) {
      return [
        g[0] !== undefined && g[0] !== null && (g[0] as unknown as string) !== '' ? Number(g[0]) : '',
        g[1] !== undefined && g[1] !== null && (g[1] as unknown as string) !== '' ? Number(g[1]) : '',
        g[2] !== undefined && g[2] !== null && (g[2] as unknown as string) !== '' ? Number(g[2]) : '',
      ];
    }
    const obj = (g || {}) as { q1?: number | string; q2?: number | string; q3?: number | string };
    return [
      obj.q1 !== undefined && obj.q1 !== null && obj.q1 !== '' ? Number(obj.q1) : '',
      obj.q2 !== undefined && obj.q2 !== null && obj.q2 !== '' ? Number(obj.q2) : '',
      obj.q3 !== undefined && obj.q3 !== null && obj.q3 !== '' ? Number(obj.q3) : ''
    ];
  };

  const filipino = getSubjectScores((_n, _c, norm) => norm.includes('filipino') || norm.includes('fil') || norm.includes('wika'));
  const english = getSubjectScores((_n, _c, norm) => norm.includes('english') || norm.includes('eng'));
  const math = getSubjectScores((_n, _c, norm) => norm.includes('mathematics') || norm.includes('math') || norm.includes('mth'));
  const science = getSubjectScores((_n, _c, norm) => norm.includes('science') || norm.includes('sci') || norm.includes('agham'));
  const ap = getSubjectScores((_n, _c, norm) => norm.includes('aralingpanlipunan') || norm.includes('ap') || norm.includes('socialstudies') || norm.includes('kasaysayan') || norm.includes('makabayan'));
  const esp = getSubjectScores((_n, _c, norm) => norm.includes('edukasyonsapagpapakatao') || norm.includes('esp') || norm.includes('gmrc') || norm.includes('values') || norm.includes('moral') || norm.includes('goodmanners'));
  const epp_tle = getSubjectScores((name, _c, norm) =>
    norm.includes('epp') || norm.includes('tle') || norm.includes('tvl') ||
    norm.includes('edukasyongpantahanan') || norm.includes('technology') ||
    norm.includes('livelihood') || norm.includes('agri') || norm.includes('industrial') ||
    norm.includes('ict') || norm.includes('homeeconomics') ||
    name.includes('e.p.p') || name.includes('t.l.e')
  );

  // MAPEH Component 1: Music & Arts
  let music_arts = getSubjectScores((_n, _c, norm) => (norm.includes('music') && norm.includes('art')) || norm.includes('musicandart') || norm === 'ma' || norm === 'mapeh');
  if (music_arts.every(v => v === '')) {
    const mScores = getSubjectScores((_n, _c, norm) => norm.includes('music') && !norm.includes('art'));
    const aScores = getSubjectScores((_n, _c, norm) => norm.includes('art') && !norm.includes('music'));
    music_arts = [0, 1, 2].map(i => {
      const m = mScores[i];
      const a = aScores[i];
      if (typeof m === 'number' && typeof a === 'number') return Math.round((m + a) / 2);
      if (typeof m === 'number') return m;
      if (typeof a === 'number') return a;
      return '';
    });
  }

  // MAPEH Component 2: Physical Education & Health
  let pe_health = getSubjectScores((_n, _c, norm) => (norm.includes('physical') || norm.includes('pe') || norm.includes('phys')) && (norm.includes('health') || norm.includes('peh')));
  if (pe_health.every(v => v === '')) {
    const peScores = getSubjectScores((_n, _c, norm) => (norm.includes('physical') || norm.includes('pe') || norm.includes('phys')) && !norm.includes('health'));
    const hScores = getSubjectScores((_n, _c, norm) => norm.includes('health') && !norm.includes('phys') && !norm.includes('pe'));
    pe_health = [0, 1, 2].map(i => {
      const p = peScores[i];
      const h = hScores[i];
      if (typeof p === 'number' && typeof h === 'number') return Math.round((p + h) / 2);
      if (typeof p === 'number') return p;
      if (typeof h === 'number') return h;
      return '';
    });
  }

  return { filipino, english, math, science, ap, esp, epp_tle, music_arts, pe_health };
}

// ---------------------------------------------------------------------------
// XML Helpers
// ---------------------------------------------------------------------------

function escapeXml(unsafe: string | number | undefined | null): string {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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

function updateFormulaValueInSheetXml(
  sheetXml: string,
  cellRef: string,
  value: string | number | undefined | null
): string {
  const formattedVal = escapeXml(value);
  const isNum = typeof value === 'number' && !isNaN(value);
  const typeAttr = isNum ? '' : ' t="str"';

  const selfClosingRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)\\/>`);
  if (selfClosingRegex.test(sheetXml)) {
    return sheetXml.replace(selfClosingRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleAttr = styleMatch ? ` s="${styleMatch[1]}"` : '';
      return `<c r="${cellRef}"${styleAttr}${typeAttr}><v>${formattedVal}</v></c>`;
    });
  }

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

  const selfClosingRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)\\/>`);
  if (selfClosingRegex.test(sheetXml)) {
    return sheetXml.replace(selfClosingRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleAttr = styleMatch ? ` s="${styleMatch[1]}"` : '';
      return `<c r="${cellRef}"${styleAttr}${typeAttr}>${fTag}${vTag}</c>`;
    });
  }

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

// ---------------------------------------------------------------------------
// Template Fetcher
// ---------------------------------------------------------------------------

export async function fetchGrade4to10TemplateBuffer(): Promise<ArrayBuffer> {
  const encodedFilename = encodeURIComponent('G4-10  School Form 9 (SY 26-27).xlsx');
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  const candidatePaths = [
    `${cleanBaseUrl}templates/${encodedFilename}`,
    `${cleanBaseUrl}templates/G4-10%20%20School%20Form%209%20(SY%2026-27).xlsx`,
    `${cleanBaseUrl}templates/G4-10  School Form 9 (SY 26-27).xlsx`,
    `/templates/${encodedFilename}`,
    `/templates/G4-10%20%20School%20Form%209%20(SY%2026-27).xlsx`,
    `/templates/G4-10  School Form 9 (SY 26-27).xlsx`,
    `./templates/${encodedFilename}`,
    `./templates/G4-10%20%20School%20Form%209%20(SY%2026-27).xlsx`,
  ];

  let lastError: Error | null = null;
  const isBrowser = typeof window !== 'undefined' && typeof window.fetch === 'function';

  for (const path of candidatePaths) {
    try {
      if (isBrowser) {
        const cacheBuster = `?t=${Date.now()}`;
        const res = await fetch(`${path}${cacheBuster}`);
        if (!res.ok) continue;
        const ab = await res.arrayBuffer();
        if (ab && ab.byteLength >= 1000) {
          const bytes = new Uint8Array(ab.slice(0, 4));
          if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
            return ab;
          }
        }
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  // Node environment fallback
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const fs = await import('fs');
      const nodePath = await import('path');
      const localPaths = [
        nodePath.resolve(process.cwd(), 'public/templates/G4-10  School Form 9 (SY 26-27).xlsx'),
        nodePath.resolve(process.cwd(), 'app/public/templates/G4-10  School Form 9 (SY 26-27).xlsx'),
      ];
      for (const lp of localPaths) {
        if (fs.existsSync(lp)) {
          const buf = fs.readFileSync(lp);
          if (buf.length >= 1000 && buf[0] === 0x50 && buf[1] === 0x4b) {
            return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
          }
        }
      }
    } catch (fsErr) {
      lastError = fsErr instanceof Error ? fsErr : new Error(String(fsErr));
    }
  }

  throw new Error(`Failed to load official Grade 4-10 SF9 Excel template: ${lastError?.message || 'Template file not found or corrupted'}`);
}

// ---------------------------------------------------------------------------
// Template Populator
// ---------------------------------------------------------------------------

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

export async function populateGrade4to10TemplateBuffer(
  templateBuffer: ArrayBuffer | Uint8Array | ArrayLike<number> | Buffer,
  opts: SF9Grade4to10ExportOptions
): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(templateBuffer as Parameters<typeof JSZip.loadAsync>[0]);

  const {
    student,
    schoolProfile,
    schoolYear,
    section,
    adviser,
    grades,
    subjects = [],
    attendance,
    learners = [],
    gradeLevel = 'Grade 4'
  } = opts;

  // 1. Clean stale calculation chain to prevent recovery popups
  zip.remove('xl/calcChain.xml');

  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (relsFile) {
    let relsXml = await relsFile.async('text');
    relsXml = relsXml.replace(/<Relationship[^>]*?Target="calcChain\.xml"[^>]*?\/>/gi, '');
    relsXml = relsXml.replace(/<Relationship[^>]*?Type="[^"]*calcChain"[^>]*?\/>/gi, '');
    zip.file('xl/_rels/workbook.xml.rels', relsXml);
  }

  const ctFile = zip.file('[Content_Types].xml');
  if (ctFile) {
    let ctXml = await ctFile.async('text');
    ctXml = ctXml.replace(/<Override[^>]*?PartName="\/xl\/calcChain\.xml"[^>]*?\/>/gi, '');
    zip.file('[Content_Types].xml', ctXml);
  }

  // 2. Set workbook calculation flags and active tab to SF9 - GRADE 4-10 (tab index 7)
  const wbFile = zip.file('xl/workbook.xml');
  if (wbFile) {
    let wbXml = await wbFile.async('text');
    if (wbXml.includes('<calcPr')) {
      wbXml = wbXml.replace(/<calcPr([^>]*?)\/>/gi, (_m, p1) => {
        const clean = p1.replace(/\s*(fullCalcOnLoad|forceFullCalc|calcCompleted)="[^"]*"/gi, '');
        return `<calcPr${clean} fullCalcOnLoad="1" forceFullCalc="1"/>`;
      });
    } else {
      wbXml = wbXml.replace('</workbook>', '<calcPr fullCalcOnLoad="1" forceFullCalc="1"/></workbook>');
    }
    wbXml = wbXml.replace(/<workbookView[^>]*?\/>/gi, '<workbookView activeTab="7"/>');
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

  // Organize learners
  const allLearners = learners.length > 0 ? learners : [student];
  if (!allLearners.some(s => s.lrn === student.lrn)) {
    allLearners.push(student);
  }

  const males = allLearners
    .filter(s => {
      const g = (s.gender || '').trim().toLowerCase();
      return g === 'male' || g === 'm';
    })
    .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));

  const females = allLearners
    .filter(s => {
      const g = (s.gender || '').trim().toLowerCase();
      return g === 'female' || g === 'f';
    })
    .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));

  const isMale = (student.gender || '').trim().toLowerCase().startsWith('m');
  const currentStudentName = formatLearnerName(student);
  const cleanDivision = (schoolProfile?.division || '').replace(/schools division office of/i, '').replace(/schools division of/i, '').trim().toUpperCase();
  const cleanRegion = schoolProfile?.region || '';
  const cleanSchoolName = schoolProfile?.name || '';
  const cleanSchoolId = schoolProfile?.school_id || '';
  const cleanSy = schoolYear || '2026-2027';
  const cleanGradeNum = extractGrade4to10GradeNumber(gradeLevel);
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
  // 3. Sheet 2: INPUT DATA (xl/worksheets/sheet2.xml)
  // -------------------------------------------------------------------------
  const sheet2File = zip.file('xl/worksheets/sheet2.xml');
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
      'F27': cleanGradeNum,
      'F28': cleanSection,
    };
    const inputStyles: Record<string, string> = {};

    // Males: L11:L60 (Name), M11:M60 (LRN), N11:N60 (Birthdate)
    for (let idx = 0; idx < 50; idx++) {
      const r = 11 + idx;
      const m = males[idx];
      if (m) {
        inputCells[`L${r}`] = formatLearnerName(m);
        inputCells[`M${r}`] = m.lrn || '';
        inputCells[`N${r}`] = formatDateToMMDDYYYY(m.birthday);
        inputStyles[`L${r}`] = '26';
        inputStyles[`M${r}`] = '27';
        inputStyles[`N${r}`] = '28';
      } else {
        inputCells[`L${r}`] = '';
        inputCells[`M${r}`] = '';
        inputCells[`N${r}`] = '';
        inputStyles[`L${r}`] = '26';
        inputStyles[`M${r}`] = '27';
        inputStyles[`N${r}`] = '28';
      }
    }

    // Females: Q11:Q60 (Name), R11:R60 (LRN), S11:S60 (Birthdate)
    for (let idx = 0; idx < 50; idx++) {
      const r = 11 + idx;
      const f = females[idx];
      if (f) {
        inputCells[`Q${r}`] = formatLearnerName(f);
        inputCells[`R${r}`] = f.lrn || '';
        inputCells[`S${r}`] = formatDateToMMDDYYYY(f.birthday);
        inputStyles[`Q${r}`] = '26';
        inputStyles[`R${r}`] = '27';
        inputStyles[`S${r}`] = '28';
      } else {
        inputCells[`Q${r}`] = '';
        inputCells[`R${r}`] = '';
        inputCells[`S${r}`] = '';
        inputStyles[`Q${r}`] = '26';
        inputStyles[`R${r}`] = '27';
        inputStyles[`S${r}`] = '28';
      }
    }

    sheet2Xml = updateCellsBatch(sheet2Xml, inputCells, inputStyles);
    zip.file('xl/worksheets/sheet2.xml', sheet2Xml);
  }

  // -------------------------------------------------------------------------
  // 4. Sheets 3, 4, 5: TERM 1, 2, 3 SUMMARIES
  // -------------------------------------------------------------------------
  const summaryFiles = [
    { file: 'sheet3.xml', termIndex: 0 },
    { file: 'sheet4.xml', termIndex: 1 },
    { file: 'sheet5.xml', termIndex: 2 },
  ];

  const currentGrades = extractGrade4to10SubjectGrades(grades, subjects);

  for (const { file, termIndex } of summaryFiles) {
    const sFile = zip.file(`xl/worksheets/${file}`);
    if (!sFile) continue;

    let sXml = await sFile.async('text');

    const formulaResults: Record<string, string | number> = {
      'E5': cleanRegion,
      'I5': cleanDivision,
      'E7': cleanSchoolName,
      'I7': cleanSchoolId,
      'N7': cleanSy,
      'G9': cleanGradeNum,
      'G10': cleanSection,
      'L9': cleanAdviser,
      'L10': cleanAdviser,
    };

    const termCells: Record<string, string | number> = {};

    // Males: Rows 15 to 64 (50 rows)
    for (let idx = 0; idx < 50; idx++) {
      const r = 15 + idx;
      const m = males[idx];
      if (m) {
        formulaResults[`C${r}`] = formatLearnerName(m);
        formulaResults[`F${r}`] = m.lrn || '';
        formulaResults[`H${r}`] = formatDateToMMDDYYYY(m.birthday);

        const studentGradesRecord = (m as unknown as StudentWithGrades).grades || {};
        const g = (m.lrn === student.lrn) ? currentGrades : extractGrade4to10SubjectGrades(studentGradesRecord, subjects);
        termCells[`J${r}`] = 'M';
        termCells[`K${r}`] = g.filipino[termIndex] !== '' ? Number(g.filipino[termIndex]) : '';
        termCells[`L${r}`] = g.english[termIndex] !== '' ? Number(g.english[termIndex]) : '';
        termCells[`M${r}`] = g.math[termIndex] !== '' ? Number(g.math[termIndex]) : '';
        termCells[`N${r}`] = g.science[termIndex] !== '' ? Number(g.science[termIndex]) : '';
        termCells[`O${r}`] = g.ap[termIndex] !== '' ? Number(g.ap[termIndex]) : '';
        termCells[`P${r}`] = g.esp[termIndex] !== '' ? Number(g.esp[termIndex]) : '';
        termCells[`Q${r}`] = g.epp_tle[termIndex] !== '' ? Number(g.epp_tle[termIndex]) : '';
        termCells[`R${r}`] = g.music_arts[termIndex] !== '' ? Number(g.music_arts[termIndex]) : '';
        termCells[`S${r}`] = g.pe_health[termIndex] !== '' ? Number(g.pe_health[termIndex]) : '';
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
        termCells[`P${r}`] = '';
        termCells[`Q${r}`] = '';
        termCells[`R${r}`] = '';
        termCells[`S${r}`] = '';
      }
    }

    // Females: Rows 66 to 115 (50 rows)
    for (let idx = 0; idx < 50; idx++) {
      const r = 66 + idx;
      const f = females[idx];
      if (f) {
        formulaResults[`C${r}`] = formatLearnerName(f);
        formulaResults[`F${r}`] = f.lrn || '';
        formulaResults[`H${r}`] = formatDateToMMDDYYYY(f.birthday);

        const studentGradesRecord = (f as unknown as StudentWithGrades).grades || {};
        const g = (f.lrn === student.lrn) ? currentGrades : extractGrade4to10SubjectGrades(studentGradesRecord, subjects);
        termCells[`J${r}`] = 'F';
        termCells[`K${r}`] = g.filipino[termIndex] !== '' ? Number(g.filipino[termIndex]) : '';
        termCells[`L${r}`] = g.english[termIndex] !== '' ? Number(g.english[termIndex]) : '';
        termCells[`M${r}`] = g.math[termIndex] !== '' ? Number(g.math[termIndex]) : '';
        termCells[`N${r}`] = g.science[termIndex] !== '' ? Number(g.science[termIndex]) : '';
        termCells[`O${r}`] = g.ap[termIndex] !== '' ? Number(g.ap[termIndex]) : '';
        termCells[`P${r}`] = g.esp[termIndex] !== '' ? Number(g.esp[termIndex]) : '';
        termCells[`Q${r}`] = g.epp_tle[termIndex] !== '' ? Number(g.epp_tle[termIndex]) : '';
        termCells[`R${r}`] = g.music_arts[termIndex] !== '' ? Number(g.music_arts[termIndex]) : '';
        termCells[`S${r}`] = g.pe_health[termIndex] !== '' ? Number(g.pe_health[termIndex]) : '';
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
        termCells[`P${r}`] = '';
        termCells[`Q${r}`] = '';
        termCells[`R${r}`] = '';
        termCells[`S${r}`] = '';
      }
    }

    sXml = updateFormulaValuesBatch(sXml, formulaResults);
    sXml = updateCellsBatch(sXml, termCells, undefined, true);
    zip.file(`xl/worksheets/${file}`, sXml);
  }

  // -------------------------------------------------------------------------
  // 5. Sheet 6: FINAL GRADES (xl/worksheets/sheet6.xml)
  // -------------------------------------------------------------------------
  const sheet6File = zip.file('xl/worksheets/sheet6.xml');
  if (sheet6File) {
    let sheet6Xml = await sheet6File.async('text');

    const s6FormulaResults: Record<string, string | number> = {
      'E6': cleanRegion,
      'L6': cleanDivision,
      'E7': cleanSchoolName,
      'L7': cleanSchoolId,
      'R7': cleanSy,
      'H10': cleanGradeNum,
      'H11': cleanSection,
    };

    for (let idx = 0; idx < 50; idx++) {
      const r = 15 + idx;
      const m = males[idx];
      s6FormulaResults[`C${r}`] = m ? formatLearnerName(m) : '';
    }
    for (let idx = 0; idx < 50; idx++) {
      const r = 66 + idx;
      const f = females[idx];
      s6FormulaResults[`C${r}`] = f ? formatLearnerName(f) : '';
    }

    sheet6Xml = updateFormulaValuesBatch(sheet6Xml, s6FormulaResults);
    sheet6Xml = updateFormulaCellExplicit(sheet6Xml, 'P10', "'INPUT DATA'!F26", cleanAdviser);
    sheet6Xml = updateFormulaCellExplicit(sheet6Xml, 'P11', "'INPUT DATA'!F26", cleanAdviser);
    zip.file('xl/worksheets/sheet6.xml', sheet6Xml);
  }

  // -------------------------------------------------------------------------
  // 6. Sheet 7: ATTENDANCE RECORD SUMMARY (xl/worksheets/sheet7.xml)
  // -------------------------------------------------------------------------
  const sheet7File = zip.file('xl/worksheets/sheet7.xml');
  if (sheet7File) {
    let sheet7Xml = await sheet7File.async('text');

    const attFormulaResults: Record<string, string | number> = {
      'E5': cleanRegion,
      'I5': cleanDivision,
      'E7': cleanSchoolName,
      'I7': cleanSchoolId,
      'N7': cleanSy,
      'G10': cleanGradeNum,
      'G11': cleanSection,
      'L10': cleanAdviser,
      'L11': cleanAdviser,
    };

    const attCells: Record<string, string | number> = {};
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
    sheet7Xml = updateCellsBatch(sheet7Xml, attCells, undefined, true);
    zip.file('xl/worksheets/sheet7.xml', sheet7Xml);
  }

  // -------------------------------------------------------------------------
  // 7. Sheet 8: SF9 - GRADE 4-10 (xl/worksheets/sheet8.xml)
  // -------------------------------------------------------------------------
  const sheet8File = zip.file('xl/worksheets/sheet8.xml');
  if (sheet8File) {
    let sheet8Xml = await sheet8File.async('text');

    // School Profile header lines (replaces broken template #REF!)
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B7', "'INPUT DATA'!F10", cleanRegion);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B8', "'INPUT DATA'!F11", cleanDivision);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B9', "'INPUT DATA'!F13", schoolProfile?.district ? `${schoolProfile.district} District` : (schoolProfile?.city || schoolProfile?.municipality || ''));
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B10', "'INPUT DATA'!F15", cleanSchoolId ? `School ID: ${cleanSchoolId}` : '');
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B12', "'INPUT DATA'!F16", cleanSchoolName);
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'B15', `School Year ${cleanSy}`);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B27', "'INPUT DATA'!F19", cleanHead);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'H27', "'INPUT DATA'!F26", cleanAdviser);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'X40', "'INPUT DATA'!F26", cleanAdviser);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'Q41', "'INPUT DATA'!F19", cleanHead);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'Q49', "'INPUT DATA'!F19", cleanHead);

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

// ---------------------------------------------------------------------------
// Section Master Export
// ---------------------------------------------------------------------------

export async function exportSF9Grade4to10SectionMasterToExcel(
  opts: SF9Grade4to10ExportOptions,
  sectionName?: string,
  schoolYear?: string
): Promise<void> {
  const templateBuffer = await fetchGrade4to10TemplateBuffer();
  const populatedBuffer = await populateGrade4to10TemplateBuffer(templateBuffer, opts);

  const cleanGrade = (opts.gradeLevel || 'Grade 4').replace(/\s+/g, '_');
  const cleanSec = (sectionName || opts.section || 'Master').replace(/\s+/g, '_');
  const cleanSy = (schoolYear || opts.schoolYear || '2026-2027').replace(/\s+/g, '_');
  const fileName = `SF9_${cleanGrade}_${cleanSec}_${cleanSy}.xlsx`;

  const blob = new Blob([populatedBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
