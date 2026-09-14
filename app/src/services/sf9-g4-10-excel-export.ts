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

export function parseBirthDateParts(birthday?: string): { year: number; month: number; day: number } | null {
  if (!birthday) return null;
  const trimmed = String(birthday).trim();
  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    return { year: parseInt(ymdMatch[1], 10), month: parseInt(ymdMatch[2], 10), day: parseInt(ymdMatch[3], 10) };
  }
  const mdyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (mdyMatch) {
    return { year: parseInt(mdyMatch[3], 10), month: parseInt(mdyMatch[1], 10), day: parseInt(mdyMatch[2], 10) };
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }
  return null;
}

export function birthDateToExcelSerial(birthday?: string): number | null {
  const parts = parseBirthDateParts(birthday);
  if (!parts) return null;
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return Math.round((utcDate.getTime() - epoch.getTime()) / (24 * 60 * 60 * 1000));
}

export function parseAge(val: unknown, birthday?: string): number | '' {
  if (val !== undefined && val !== null && (val as unknown) !== '') {
    const s = String(val).trim();
    if (!s.includes('#')) {
      const num = Number(s);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  if (birthday) {
    const parts = parseBirthDateParts(birthday);
    if (parts) {
      const today = new Date();
      let age = today.getFullYear() - parts.year;
      const m = today.getMonth() + 1 - parts.month;
      if (m < 0 || (m === 0 && today.getDate() < parts.day)) {
        age--;
      }
      return age > 0 ? age : '';
    }
  }
  return '';
}


export function cleanScore(val: unknown): number | '' {
  if (val === undefined || val === null || (val as unknown as string) === '') return '';
  const num = Number(val);
  return !isNaN(num) && num > 0 ? num : '';
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
        cleanScore(g[0]),
        cleanScore(g[1]),
        cleanScore(g[2]),
      ];
    }
    const obj = (g || {}) as { q1?: number | string; q2?: number | string; q3?: number | string };
    return [
      cleanScore(obj.q1),
      cleanScore(obj.q2),
      cleanScore(obj.q3)
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
      const m = cleanScore(mScores[i]);
      const a = cleanScore(aScores[i]);
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
      const pe = cleanScore(peScores[i]);
      const h = cleanScore(hScores[i]);
      if (typeof pe === 'number' && typeof h === 'number') return Math.round((pe + h) / 2);
      if (typeof pe === 'number') return pe;
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
  if (value === undefined || value === null) return sheetXml;
  const hasValue = value !== '';
  const isNum = typeof value === 'number' && !isNaN(value);

  const selfClosingRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)\\/>`);
  if (selfClosingRegex.test(sheetXml)) {
    return sheetXml.replace(selfClosingRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleAttr = styleMatch ? ` s="${styleMatch[1]}"` : '';
      if (!hasValue) {
        return `<c r="${cellRef}"${styleAttr}/>`;
      }
      if (isNum) {
        return `<c r="${cellRef}"${styleAttr}><v>${value}</v></c>`;
      }
      return `<c r="${cellRef}"${styleAttr} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
    });
  }

  const fullCellRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)>((?:(?!<c[\\s>]|<\\/row>|<row[\\s>])([\\s\\S]))*?)<\\/c>`);
  if (fullCellRegex.test(sheetXml)) {
    return sheetXml.replace(fullCellRegex, (_match, attrs, body) => {
      const cleanAttrs = attrs.replace(/\s+t="[^"]*"/g, '');
      const fMatch = body.match(/<f[^>]*>[\s\S]*?<\/f>|<f[^>]*\/>/);
      const fTag = fMatch ? fMatch[0] : '';
      if (!hasValue) {
        if (fTag) {
          return `<c r="${cellRef}"${cleanAttrs}>${fTag}</c>`;
        }
        return `<c r="${cellRef}"${cleanAttrs}/>`;
      }
      if (isNum) {
        return `<c r="${cellRef}"${cleanAttrs}>${fTag}<v>${value}</v></c>`;
      }
      if (fTag) {
        return `<c r="${cellRef}"${cleanAttrs} t="str">${fTag}<v>${escapeXml(value)}</v></c>`;
      }
      return `<c r="${cellRef}"${cleanAttrs} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
    });
  }

  return sheetXml;
}

function escapeFormula(formula: string): string {
  if (!formula) return '';
  return formula
    .replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateFormulaCellExplicit(
  sheetXml: string,
  cellRef: string,
  formula: string,
  value: string | number | undefined | null,
  forceStyle?: string
): string {
  const hasValue = value !== undefined && value !== null && value !== '';
  const isNum = typeof value === 'number' && !isNaN(value);
  const fTag = formula ? `<f>${escapeFormula(formula)}</f>` : '';

  let typeAttr = '';
  let valTag = '';
  if (hasValue) {
    if (isNum) {
      valTag = `<v>${value}</v>`;
    } else {
      typeAttr = ' t="str"';
      valTag = `<v>${escapeXml(value)}</v>`;
    }
  }

  const selfClosingRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)\\/>`);
  if (selfClosingRegex.test(sheetXml)) {
    return sheetXml.replace(selfClosingRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleId = forceStyle || (styleMatch ? styleMatch[1] : '');
      const styleAttr = styleId ? ` s="${styleId}"` : '';
      if (!fTag && !valTag) {
        return `<c r="${cellRef}"${styleAttr}/>`;
      }
      return `<c r="${cellRef}"${styleAttr}${typeAttr}>${fTag}${valTag}</c>`;
    });
  }

  const fullCellRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)>((?:(?!<c[\\s>]|<\\/row>|<row[\\s>])([\\s\\S]))*?)<\\/c>`);
  if (fullCellRegex.test(sheetXml)) {
    return sheetXml.replace(fullCellRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleId = forceStyle || (styleMatch ? styleMatch[1] : '');
      const styleAttr = styleId ? ` s="${styleId}"` : '';
      if (!fTag && !valTag) {
        return `<c r="${cellRef}"${styleAttr}/>`;
      }
      return `<c r="${cellRef}"${styleAttr}${typeAttr}>${fTag}${valTag}</c>`;
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

  // Parse sheets (attribute-order agnostic)
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

  // 2. Resolve workbook sheet map and force Full Calculation on Load in workbook.xml
  const { sheetsByName, sheetList } = await getWorkbookSheetMap(zip);
  const sf9Info = sheetsByName.get('SF9 - GRADE 4-10') || sheetList.find(s => s.name.toUpperCase().includes('SF9'));
  const sf9Index = sheetList.findIndex(s => s.name.toUpperCase().includes('SF9'));
  const activeTabIndex = sf9Index >= 0 ? sf9Index : 5;

  const sf9SheetPath = sf9Info?.path || (zip.file('xl/worksheets/sheet6.xml') ? 'xl/worksheets/sheet6.xml' : 'xl/worksheets/sheet8.xml');

  const inputSheetInfo = sheetsByName.get('INPUT DATA') || sheetList.find(s => s.name.toUpperCase().includes('INPUT'));
  const inputSheetPath = inputSheetInfo?.path || 'xl/worksheets/sheet2.xml';

  const term1Info = sheetsByName.get('TERM 1 SUMMARY') || sheetList.find(s => s.name.toUpperCase().includes('TERM 1'));
  const term1Path = term1Info?.path || 'xl/worksheets/sheet3.xml';

  const term2Info = sheetsByName.get('TERM 2 SUMMARY') || sheetList.find(s => s.name.toUpperCase().includes('TERM 2'));
  const term2Path = term2Info?.path || 'xl/worksheets/sheet4.xml';

  const term3Info = sheetsByName.get('TERM 3 SUMMARY') || sheetList.find(s => s.name.toUpperCase().includes('TERM 3'));
  const term3Path = term3Info?.path || 'xl/worksheets/sheet5.xml';

  const finalGradesInfo = sheetsByName.get('FINAL GRADES') || sheetList.find(s => s.name.toUpperCase().includes('FINAL GRADES'));
  const finalGradesPath = finalGradesInfo?.path || (zip.file('xl/worksheets/sheet6.xml') && sf9SheetPath !== 'xl/worksheets/sheet6.xml' ? 'xl/worksheets/sheet6.xml' : null);

  const attInfo = sheetsByName.get('ATTENDANCE RECORD SUMMARY') || sheetList.find(s => s.name.toUpperCase().includes('ATTENDANCE'));
  const attPath = attInfo?.path || 'xl/worksheets/sheet7.xml';

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
    wbXml = wbXml.replace(/<workbookView[^>]*?\/>/gi, `<workbookView activeTab="${activeTabIndex}"/>`);
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
  // 3. Sheet 2: INPUT DATA (inputSheetPath)
  // -------------------------------------------------------------------------
    const sheet2File = zip.file(inputSheetPath);
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
    const birthdateFormulas: { cellRef: string; formula: string; serial: number }[] = [];

    // Males: L11:L60 (Name), M11:M60 (LRN), N11:N60 (Birthdate)
    // NOTE: Preserve native template styles (63=name, 64=LRN, 65=birthdate) - DO NOT force arbitrary styles!
    for (let idx = 0; idx < 50; idx++) {
      const r = 11 + idx;
      const m = males[idx];
      inputCells[`L${r}`] = m ? formatLearnerName(m) : '';
      inputCells[`M${r}`] = m ? (m.lrn || '') : '';
      if (m && m.birthday) {
        const parts = parseBirthDateParts(m.birthday);
        const serial = birthDateToExcelSerial(m.birthday);
        if (parts && serial !== null) {
          birthdateFormulas.push({
            cellRef: `N${r}`,
            formula: `DATE(${parts.year},${parts.month},${parts.day})`,
            serial
          });
        } else {
          inputCells[`N${r}`] = formatDateToMMDDYYYY(m.birthday);
        }
      } else {
        inputCells[`N${r}`] = '';
      }
    }

    // Females: Q11:Q60 (Name), R11:R60 (LRN), S11:S60 (Birthdate)
    // NOTE: Preserve native template styles (67=name, 69=LRN, 70=birthdate) - DO NOT force arbitrary styles!
    for (let idx = 0; idx < 50; idx++) {
      const r = 11 + idx;
      const f = females[idx];
      inputCells[`Q${r}`] = f ? formatLearnerName(f) : '';
      inputCells[`R${r}`] = f ? (f.lrn || '') : '';
      if (f && f.birthday) {
        const parts = parseBirthDateParts(f.birthday);
        const serial = birthDateToExcelSerial(f.birthday);
        if (parts && serial !== null) {
          birthdateFormulas.push({
            cellRef: `S${r}`,
            formula: `DATE(${parts.year},${parts.month},${parts.day})`,
            serial
          });
        } else {
          inputCells[`S${r}`] = formatDateToMMDDYYYY(f.birthday);
        }
      } else {
        inputCells[`S${r}`] = '';
      }
    }

    sheet2Xml = updateCellsBatch(sheet2Xml, inputCells);
    for (const bf of birthdateFormulas) {
      sheet2Xml = updateFormulaCellExplicit(sheet2Xml, bf.cellRef, bf.formula, bf.serial);
    }
    zip.file(inputSheetPath, sheet2Xml);
  }

  // -------------------------------------------------------------------------
  // 4. Sheets 3, 4, 5: TERM 1, 2, 3 SUMMARIES
  // -------------------------------------------------------------------------
  const summaryFiles = [
    { file: term1Path, termIndex: 0 },
    { file: term2Path, termIndex: 1 },
    { file: term3Path, termIndex: 2 },
  ];

  const currentGrades = extractGrade4to10SubjectGrades(grades, subjects);

  for (const { file, termIndex } of summaryFiles) {
    const sFile = zip.file(file);
    if (!sFile) continue;

    let sXml = await sFile.async('text');
    sXml = sXml.replace(/'INPUT DATA'!F155/g, "'INPUT DATA'!F15");

    const formulaResults: Record<string, string | number> = {
      'E5': cleanRegion,
      'K5': cleanDivision,
      'E6': cleanSchoolName,
      'K6': cleanSchoolId,
      'U6': cleanSy,
      'G9': cleanGradeNum,
      'N9': cleanAdviser,
      'G10': cleanSection,
    };

    const termCells: Record<string, string | number> = {};

    // Males: Rows 15 to 64 (50 rows)
    for (let idx = 0; idx < 50; idx++) {
      const r = 15 + idx;
      const m = males[idx];
      const mSerial = m?.birthday ? birthDateToExcelSerial(m.birthday) : null;
      if (m) {
        formulaResults[`C${r}`] = formatLearnerName(m);
        formulaResults[`F${r}`] = m.lrn || '';
        formulaResults[`H${r}`] = mSerial !== null ? mSerial : formatDateToMMDDYYYY(m.birthday);
        formulaResults[`I${r}`] = parseAge(m.age, m.birthday);

        const studentGradesRecord = (m as unknown as StudentWithGrades).grades || {};
        const g = (m.lrn === student.lrn) ? currentGrades : extractGrade4to10SubjectGrades(studentGradesRecord, subjects);
        termCells[`J${r}`] = 'M';
        termCells[`K${r}`] = cleanScore(g.filipino[termIndex]);
        termCells[`L${r}`] = cleanScore(g.english[termIndex]);
        termCells[`M${r}`] = cleanScore(g.math[termIndex]);
        termCells[`N${r}`] = cleanScore(g.science[termIndex]);
        termCells[`O${r}`] = cleanScore(g.ap[termIndex]);
        termCells[`P${r}`] = cleanScore(g.esp[termIndex]);
        termCells[`Q${r}`] = cleanScore(g.epp_tle[termIndex]);
        termCells[`R${r}`] = cleanScore(g.music_arts[termIndex]);
        termCells[`S${r}`] = cleanScore(g.pe_health[termIndex]);

        // Precompute MAPEH (Column T) and General Average (Column U) for summary sheet
        const maVal = cleanScore(g.music_arts[termIndex]);
        const pehVal = cleanScore(g.pe_health[termIndex]);
        const hasMa = typeof maVal === 'number' && maVal > 0;
        const hasPeh = typeof pehVal === 'number' && pehVal > 0;
        let mapehVal: number | '' = '';
        if (hasMa && hasPeh) {
          mapehVal = Math.round((Number(maVal) + Number(pehVal)) / 2);
        } else if (hasMa) {
          mapehVal = Number(maVal);
        } else if (hasPeh) {
          mapehVal = Number(pehVal);
        }

        const termSubjectNums = [
          cleanScore(g.filipino[termIndex]),
          cleanScore(g.english[termIndex]),
          cleanScore(g.math[termIndex]),
          cleanScore(g.science[termIndex]),
          cleanScore(g.ap[termIndex]),
          cleanScore(g.esp[termIndex]),
          cleanScore(g.epp_tle[termIndex]),
          mapehVal
        ].filter(v => typeof v === 'number' && v > 0) as number[];

        let termGenAvg: number | '' = '';
        if (termSubjectNums.length > 0) {
          termGenAvg = Math.round(termSubjectNums.reduce((a, b) => a + b, 0) / termSubjectNums.length);
        }

        formulaResults[`T${r}`] = mapehVal;
        formulaResults[`U${r}`] = termGenAvg;
      } else {
        formulaResults[`C${r}`] = '';
        formulaResults[`F${r}`] = '';
        formulaResults[`H${r}`] = '';
        formulaResults[`I${r}`] = '';
        formulaResults[`T${r}`] = '';
        formulaResults[`U${r}`] = '';
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
      const fSerial = f?.birthday ? birthDateToExcelSerial(f.birthday) : null;
      if (f) {
        formulaResults[`C${r}`] = formatLearnerName(f);
        formulaResults[`F${r}`] = f.lrn || '';
        formulaResults[`H${r}`] = fSerial !== null ? fSerial : formatDateToMMDDYYYY(f.birthday);
        formulaResults[`I${r}`] = parseAge(f.age, f.birthday);

        const studentGradesRecord = (f as unknown as StudentWithGrades).grades || {};
        const g = (f.lrn === student.lrn) ? currentGrades : extractGrade4to10SubjectGrades(studentGradesRecord, subjects);
        termCells[`J${r}`] = 'F';
        termCells[`K${r}`] = cleanScore(g.filipino[termIndex]);
        termCells[`L${r}`] = cleanScore(g.english[termIndex]);
        termCells[`M${r}`] = cleanScore(g.math[termIndex]);
        termCells[`N${r}`] = cleanScore(g.science[termIndex]);
        termCells[`O${r}`] = cleanScore(g.ap[termIndex]);
        termCells[`P${r}`] = cleanScore(g.esp[termIndex]);
        termCells[`Q${r}`] = cleanScore(g.epp_tle[termIndex]);
        termCells[`R${r}`] = cleanScore(g.music_arts[termIndex]);
        termCells[`S${r}`] = cleanScore(g.pe_health[termIndex]);

        // Precompute MAPEH (Column T) and General Average (Column U) for summary sheet
        const maVal = cleanScore(g.music_arts[termIndex]);
        const pehVal = cleanScore(g.pe_health[termIndex]);
        const hasMa = typeof maVal === 'number' && maVal > 0;
        const hasPeh = typeof pehVal === 'number' && pehVal > 0;
        let mapehVal: number | '' = '';
        if (hasMa && hasPeh) {
          mapehVal = Math.round((Number(maVal) + Number(pehVal)) / 2);
        } else if (hasMa) {
          mapehVal = Number(maVal);
        } else if (hasPeh) {
          mapehVal = Number(pehVal);
        }

        const termSubjectNums = [
          cleanScore(g.filipino[termIndex]),
          cleanScore(g.english[termIndex]),
          cleanScore(g.math[termIndex]),
          cleanScore(g.science[termIndex]),
          cleanScore(g.ap[termIndex]),
          cleanScore(g.esp[termIndex]),
          cleanScore(g.epp_tle[termIndex]),
          mapehVal
        ].filter(v => typeof v === 'number' && v > 0) as number[];

        let termGenAvg: number | '' = '';
        if (termSubjectNums.length > 0) {
          termGenAvg = Math.round(termSubjectNums.reduce((a, b) => a + b, 0) / termSubjectNums.length);
        }

        formulaResults[`T${r}`] = mapehVal;
        formulaResults[`U${r}`] = termGenAvg;
      } else {
        formulaResults[`C${r}`] = '';
        formulaResults[`F${r}`] = '';
        formulaResults[`H${r}`] = '';
        formulaResults[`I${r}`] = '';
        formulaResults[`T${r}`] = '';
        formulaResults[`U${r}`] = '';
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

    // Ensure cell T15 in Sheet 4 (TERM 2 SUMMARY) has its formula restored and computed value set
    if (termIndex === 1) {
      const firstMaleMapeh = formulaResults['T15'];
      sXml = updateFormulaCellExplicit(
        sXml,
        'T15',
        'IF(COUNT($R15:$S15)=0,"",ROUND(AVERAGE(R15:S15),0))',
        cleanScore(firstMaleMapeh),
        '96'
      );
    }

    sXml = updateFormulaValuesBatch(sXml, formulaResults);
    sXml = updateCellsBatch(sXml, termCells, undefined, true);
    zip.file(file, sXml);
  }

  // -------------------------------------------------------------------------
  // 5. Sheet: FINAL GRADES (optional in 7-sheet template)
  // -------------------------------------------------------------------------
  if (finalGradesPath && zip.file(finalGradesPath)) {
    let sheet6Xml = await zip.file(finalGradesPath)!.async('text');

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
    zip.file(finalGradesPath, sheet6Xml);
  }

  // -------------------------------------------------------------------------
  // 6. ATTENDANCE RECORD SUMMARY (attPath)
  // -------------------------------------------------------------------------
  const attFile = zip.file(attPath);
  if (attFile) {
    let attXml = await attFile.async('text');

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

    // Populate Row 13: School Days in Attendance Summary
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

    attXml = updateFormulaValuesBatch(attXml, attFormulaResults);
    attXml = updateCellsBatch(attXml, attCells, undefined, true);
    zip.file(attPath, attXml);
  }

  // -------------------------------------------------------------------------
  // 7. SF9 - GRADE 4-10 (sf9SheetPath)
  // -------------------------------------------------------------------------
  const sf9File = zip.file(sf9SheetPath);
  if (sf9File) {
    let sf9Xml = await sf9File.async('text');

    // School Profile header lines (replaces broken template #REF!)
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B7', "'INPUT DATA'!F10", cleanRegion);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B8', "'INPUT DATA'!F11", cleanDivision);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B9', "'INPUT DATA'!F13", schoolProfile?.district ? `${schoolProfile.district} District` : (schoolProfile?.city || schoolProfile?.municipality || ''));
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B10', "'INPUT DATA'!F15", cleanSchoolId ? `School ID: ${cleanSchoolId}` : '');
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B12', "'INPUT DATA'!F16", cleanSchoolName);
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B15', `School Year ${cleanSy}`);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B27', "'INPUT DATA'!F19", cleanHead);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'H27', "'INPUT DATA'!F26", cleanAdviser);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'X40', "'INPUT DATA'!F26", cleanAdviser);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'Q41', "'INPUT DATA'!F19", cleanHead);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'Q49', "'INPUT DATA'!F19", cleanHead);

    const calculatedAge = parseAge(student.age, student.birthday);

    const sf9Cells: Record<string, string | number> = {
      'C17': currentStudentName
    };
    const sf9FormulaResults: Record<string, string | number> = {
      'C18': student.lrn || '',
      'I17': calculatedAge,
      'K17': isMale ? 'M' : 'F',
    };

    // Precompute Subject Grades, Final Grades, and Remarks for SF9
    // Learning areas: Filipino (Row 32), English (Row 33), Math (Row 34), Science (Row 35),
    // AP (Row 36), ESP (Row 37), EPP/TLE (Row 38), MAPEH (Row 39)
    // Components: Music & Arts (Row 40), PE & Health (Row 41)
    // General Average: Row 42

    const calcFinalGrade = (qList: (string | number)[]): number | '' => {
      const nums = qList.map(cleanScore).filter(v => typeof v === 'number') as number[];
      if (nums.length === 3) {
        return Math.round(nums.reduce((a, b) => a + b, 0) / 3);
      }
      return '';
    };

    const calcRemarks = (fg: number | ''): string => {
      if (typeof fg === 'number' && fg > 0) {
        return fg >= 75 ? 'Passed' : 'Failed';
      }
      return '';
    };

    const fFil = calcFinalGrade(currentGrades.filipino);
    const fEng = calcFinalGrade(currentGrades.english);
    const fMat = calcFinalGrade(currentGrades.math);
    const fSci = calcFinalGrade(currentGrades.science);
    const fAp = calcFinalGrade(currentGrades.ap);
    const fEsp = calcFinalGrade(currentGrades.esp);
    const fEpp = calcFinalGrade(currentGrades.epp_tle);
    const fMa = calcFinalGrade(currentGrades.music_arts);
    const fPeh = calcFinalGrade(currentGrades.pe_health);

    // MAPEH per term
    const mapehTerms = [0, 1, 2].map(i => {
      const ma = cleanScore(currentGrades.music_arts[i]);
      const peh = cleanScore(currentGrades.pe_health[i]);
      const hasMa = typeof ma === 'number' && ma > 0;
      const hasPeh = typeof peh === 'number' && peh > 0;
      if (hasMa && hasPeh) {
        return Math.round((Number(ma) + Number(peh)) / 2);
      } else if (hasMa) {
        return Number(ma);
      } else if (hasPeh) {
        return Number(peh);
      }
      return '';
    });
    const fMapeh = calcFinalGrade(mapehTerms);

    // General Average: Only when all 8 learning areas have valid final grades
    const learningAreaFinals = [fFil, fEng, fMat, fSci, fAp, fEsp, fEpp, fMapeh];
    const genAvg = learningAreaFinals.every(g => typeof g === 'number' && g > 0)
      ? Math.round((learningAreaFinals as number[]).reduce((a, b) => a + b, 0) / 8)
      : '';
    const genAvgRemarks = calcRemarks(genAvg);

    // Subject row mapping with summary column numbers
    const subjectRowData = [
      { r: 32, col: 9, terms: currentGrades.filipino, final: fFil, remarks: calcRemarks(fFil) },
      { r: 33, col: 10, terms: currentGrades.english, final: fEng, remarks: calcRemarks(fEng) },
      { r: 34, col: 11, terms: currentGrades.math, final: fMat, remarks: calcRemarks(fMat) },
      { r: 35, col: 12, terms: currentGrades.science, final: fSci, remarks: calcRemarks(fSci) },
      { r: 36, col: 13, terms: currentGrades.ap, final: fAp, remarks: calcRemarks(fAp) },
      { r: 37, col: 14, terms: currentGrades.esp, final: fEsp, remarks: calcRemarks(fEsp) },
      { r: 38, col: 15, terms: currentGrades.epp_tle, final: fEpp, remarks: calcRemarks(fEpp) },
      { r: 39, col: 18, terms: mapehTerms, final: fMapeh, remarks: calcRemarks(fMapeh) },
      { r: 40, col: 16, terms: currentGrades.music_arts, final: fMa, remarks: '' },
      { r: 41, col: 17, terms: currentGrades.pe_health, final: fPeh, remarks: '' },
    ];

    for (const sub of subjectRowData) {
      const term1Val = cleanScore(sub.terms[0]);
      const term2Val = cleanScore(sub.terms[1]);
      const term3Val = cleanScore(sub.terms[2]);
      const finalVal = cleanScore(sub.final);
      const remarksVal = sub.remarks || '';

      // Update formulas to explicitly prevent Excel VLOOKUP from displaying 0 when cell is blank
      const fFormula = `IF(C17="","",IFERROR(IF(VLOOKUP(C17,'TERM 1 SUMMARY'!$C$15:$U$115,${sub.col},0)=0,"",VLOOKUP(C17,'TERM 1 SUMMARY'!$C$15:$U$115,${sub.col},0)),""))`;
      const gFormula = `IF(C17="","",IFERROR(IF(VLOOKUP(C17,'TERM 2 SUMMARY'!$C$15:$U$115,${sub.col},0)=0,"",VLOOKUP(C17,'TERM 2 SUMMARY'!$C$15:$U$115,${sub.col},0)),""))`;
      const hFormula = `IF(C17="","",IFERROR(IF(VLOOKUP(C17,'TERM 3 SUMMARY'!$C$15:$U$115,${sub.col},0)=0,"",VLOOKUP(C17,'TERM 3 SUMMARY'!$C$15:$U$115,${sub.col},0)),""))`;

      sf9Xml = updateFormulaCellExplicit(sf9Xml, `F${sub.r}`, fFormula, term1Val);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, `G${sub.r}`, gFormula, term2Val);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, `H${sub.r}`, hFormula, term3Val);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, `I${sub.r}`, `IF(COUNT(F${sub.r}:H${sub.r})<3,"",ROUND(AVERAGE(F${sub.r}:H${sub.r}),0))`, finalVal);
      if (sub.r <= 39) {
        sf9Xml = updateFormulaCellExplicit(sf9Xml, `J${sub.r}`, `IF(I${sub.r}="","",IF(I${sub.r}>=75,"Passed","Failed"))`, remarksVal);
      }
    }

    // Ensure General Average formula is blank when fewer than 8 learning areas are complete
    sf9Xml = updateFormulaCellExplicit(
      sf9Xml,
      'I42',
      'IF(COUNT(I32:I39)<8,"",ROUND(AVERAGE(I32:I39),0))',
      cleanScore(genAvg)
    );
    sf9Xml = updateFormulaCellExplicit(
      sf9Xml,
      'J42',
      'IF(I42="","",IF(I42>=75,"Passed","Failed"))',
      genAvgRemarks
    );

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

    zip.file(sf9SheetPath, sf9Xml);
  }

  // Resolve drawing for SF9 sheet dynamically from its rels file
  let sf9DrawingPath = 'xl/drawings/drawing6.xml';
  let sf9DrawingRelsPath = 'xl/drawings/_rels/drawing6.xml.rels';

  const sf9RelsPath = sf9SheetPath.replace('worksheets/', 'worksheets/_rels/').concat('.rels');
  const sf9RelsFile = zip.file(sf9RelsPath);
  if (sf9RelsFile) {
    const sRelsXml = await sf9RelsFile.async('text');
    const dMatch = sRelsXml.match(/Type="[^"]*drawing"\s+Target="([^"]+)"/);
    if (dMatch) {
      let target = dMatch[1];
      if (target.startsWith('../')) {
        target = `xl/${target.replace(/^\.\.\//, '')}`;
      } else if (!target.startsWith('xl/')) {
        target = `xl/drawings/${target.replace(/^\.?\//, '')}`;
      }
      sf9DrawingPath = target;
      const dDir = target.substring(0, target.lastIndexOf('/'));
      const dName = target.substring(target.lastIndexOf('/') + 1);
      sf9DrawingRelsPath = `${dDir}/_rels/${dName}.rels`;
    }
  } else if (zip.file('xl/drawings/drawing8.xml') && sf9SheetPath.includes('sheet8')) {
    sf9DrawingPath = 'xl/drawings/drawing8.xml';
    sf9DrawingRelsPath = 'xl/drawings/_rels/drawing8.xml.rels';
  }

  // Replace placeholder Shape 3 or Shape 4 with School Logo if available
  await injectSchoolLogoIntoDrawing(
    zip,
    sf9DrawingPath,
    sf9DrawingRelsPath,
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
