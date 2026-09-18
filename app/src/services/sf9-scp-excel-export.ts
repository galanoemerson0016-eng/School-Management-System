import JSZip from 'jszip';
import type { SchoolProfile, Student } from '../types';
import { formatLearnerName } from '../utils/student-name';
import { isZipTemplate, readNodeTemplateFallback } from '../utils/node-template-fallback';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SF9SCPSubjectItem {
  name: string;
  id?: string;
  isHeader?: boolean;
  isComponent?: boolean;
  isReserved?: boolean;
}

export type StudentWithGrades = Student & {
  grades?: Record<string, number[] | { q1?: number; q2?: number; q3?: number; q4?: number; final?: number }>;
  attendance?: {
    daysPresent?: number[];
    daysAbsent?: number[];
  };
};

export interface SF9SCPExportOptions {
  student: Student;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section: string;
  program?: string;
  adviser: string;
  principal: string;
  principalTitle: string;
  grades: Record<string, number[]>;
  subjects: SF9SCPSubjectItem[];
  observedValues?: Record<string, string[]>;
  comments?: string[];
  attendance?: {
    months: string[];
    schoolDays: number[];
    daysPresent: number[];
    daysAbsent: number[];
  };
  gradeLevel?: string;
  learners?: (Student | StudentWithGrades)[];
  pageSize?: 'A4' | 'Letter' | 'Legal' | 'LETTER';
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

// ---------------------------------------------------------------------------
// Program Detection & Template Name Mapping
// ---------------------------------------------------------------------------
// Program Detection & Template Name Mapping
// ---------------------------------------------------------------------------

export type SCPProgramCode = 'SPFL' | 'SPA' | 'SPJ' | 'SPS' | 'SPSTEM' | 'STE' | 'SPTVE' | 'SSES';

export function normalizeSCPProgram(program?: string): SCPProgramCode | null {
  if (!program) return null;
  const p = program.trim().toUpperCase();
  if (p === 'SPFL' || /\bSPFL\b/.test(p) || p.includes('FOREIGN LANGUAGE')) return 'SPFL';
  if (p === 'SPA' || /\bSPA\b/.test(p) || p.includes('THE ARTS') || p.includes('SPECIAL PROGRAM IN THE ARTS')) return 'SPA';
  if (p === 'SPJ' || /\bSPJ\b/.test(p) || p.includes('JOURNALISM')) return 'SPJ';
  if (p === 'SPS' || /\bSPS\b/.test(p) || p.includes('SPECIAL PROGRAM IN SPORTS')) return 'SPS';
  if (p === 'SPSTEM' || p === 'STE' || /\bSPSTEM\b/.test(p) || /\bSTE\b/.test(p) || p.includes('SCIENCE TECHNOLOGY') || p.includes('SCIENCE, TECHNOLOGY')) return 'SPSTEM';
  if (p === 'SPTVE' || /\bSPTVE\b/.test(p) || p.includes('TECHNICAL VOCATIONAL') || p.includes('TECH-VOC') || p.includes('TECHNICAL-VOCATIONAL')) return 'SPTVE';
  if (p === 'SSES' || /\bSSES\b/.test(p) || p.includes('SPECIAL SCIENCE ELEMENTARY')) return 'SSES';
  return null;
}

export function isSpecialCurricularProgram(program?: string): boolean {
  return normalizeSCPProgram(program) !== null;
}

export function getSCPTemplateFilename(program: string, gradeLevel: string): string {
  const norm = normalizeSCPProgram(program);
  const p = norm || program.trim().toUpperCase();
  const cleanGrade = (gradeLevel || '').replace(/\D/g, '');
  const gradeNum = parseInt(cleanGrade, 10) || 7;

  if (p === 'SPFL') {
    return 'UPDATED SPFL G7-10  School Form 9 (SY 26-27).xlsx';
  }
  if (p === 'SPA') {
    return 'UPDATED SPA G4-10  School Form 9 (SY 26-27).xlsx';
  }
  if (p === 'SPJ') {
    return 'UPDATED SPJ G4-10  School Form 9 (SY 26-27).xlsx';
  }
  if (p === 'SPS') {
    return 'UPDATED SPS G4-10  School Form 9 (SY 26-27).xlsx';
  }
  if (p === 'SPSTEM' || p === 'STE') {
    return 'UPDATED SPSTEM G7-10  School Form 9 (SY 26-27).xlsx';
  }
  if (p === 'SPTVE') {
    if (gradeNum <= 8) {
      return 'UPDATED SPTVE G7-8  School Form 9 (SY 26-27).xlsx';
    } else {
      return 'UPDATED SPTVE G9-10  School Form 9 (SY 26-27).xlsx';
    }
  }
  if (p === 'SSES') {
    return 'UPDATED SSES G4-6  School Form 9 (SY 26-27).xlsx';
  }
  return 'G4-10  School Form 9 (SY 26-27).xlsx';
}

export function getSCPTemplateAlias(program: string, gradeLevel: string): string {
  const norm = normalizeSCPProgram(program);
  const p = norm || program.trim().toUpperCase();
  const cleanGrade = (gradeLevel || '').replace(/\D/g, '');
  const gradeNum = parseInt(cleanGrade, 10) || 7;

  if (p === 'SPFL') return 'SF9_Template_SPFL_G7_G10.xlsx';
  if (p === 'SPA') return 'SF9_Template_SPA_G4_G10.xlsx';
  if (p === 'SPJ') return 'SF9_Template_SPJ_G4_G10.xlsx';
  if (p === 'SPS') return 'SF9_Template_SPS_G4_G10.xlsx';
  if (p === 'SPSTEM' || p === 'STE') return 'SF9_Template_SPSTEM_G7_G10.xlsx';
  if (p === 'SPTVE') {
    return gradeNum <= 8 ? 'SF9_Template_SPTVE_G7_G8.xlsx' : 'SF9_Template_SPTVE_G9_G10.xlsx';
  }
  if (p === 'SSES') return 'SF9_Template_SSES_G4_G6.xlsx';
  return 'G4-10  School Form 9 (SY 26-27).xlsx';
}

// ---------------------------------------------------------------------------
// Template Fetcher
// ---------------------------------------------------------------------------

export async function fetchSCPTemplateBuffer(program: string, gradeLevel: string): Promise<ArrayBuffer> {
  const filename = getSCPTemplateFilename(program, gradeLevel);
  const alias = getSCPTemplateAlias(program, gradeLevel);

  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  const candidatePaths = [
    `${cleanBaseUrl}templates/${encodeURIComponent(filename)}`,
    `${cleanBaseUrl}templates/${alias}`,
    `${cleanBaseUrl}templates/${filename}`,
    `/templates/${encodeURIComponent(filename)}`,
    `/templates/${alias}`,
    `/templates/${filename}`,
    `./templates/${encodeURIComponent(filename)}`,
    `./templates/${alias}`,
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

  const nodeBytes = await readNodeTemplateFallback([filename, alias], 1000);
  if (isZipTemplate(nodeBytes)) return nodeBytes.slice().buffer as ArrayBuffer;

  throw new Error(`Failed to load official ${program} SF9 Excel template (${filename}): ${lastError?.message || 'Template file not found'}`);
}

export function cleanScore(val: unknown): number | '' {
  if (val === undefined || val === null || (val as unknown as string) === '') return '';
  const num = Number(val);
  return !isNaN(num) && num > 0 ? num : '';
}

export interface SCPSubjectGrades {
  filipino: (string | number)[];
  english: (string | number)[];
  math: (string | number)[];
  science: (string | number)[];
  ap: (string | number)[];
  esp: (string | number)[];
  epp_tle: (string | number)[];
  music_arts: (string | number)[];
  pe_health: (string | number)[];
  specialization1: (string | number)[];
  specialization2: (string | number)[];
  specializationName1: string;
  specializationName2: string;
}

export function extractSCPSubjectGrades(
  grades: Record<string, number[] | { q1?: number; q2?: number; q3?: number; q4?: number; final?: number }>,
  subjects: SF9SCPSubjectItem[] = [],
  program = '',
  _gradeLevel = ''
): SCPSubjectGrades {
  const normProg = (program || '').trim().toUpperCase();

  const getSubjectScores = (
    predicate: (name: string, code: string, norm: string) => boolean
  ): { scores: (string | number)[]; name: string } => {
    for (const [key, val] of Object.entries(grades)) {
      const subjectObj = subjects.find(
        s => s.name === key || (s.id && s.id === key)
      );
      const name = subjectObj ? subjectObj.name || key : key;
      const code = subjectObj && (subjectObj as { subject_code?: string }).subject_code ? (subjectObj as { subject_code?: string }).subject_code! : '';
      const norm = name.toLowerCase().replace(/[\s\-_.]/g, '');

      if (predicate(name, code, norm)) {
        if (Array.isArray(val)) {
          return {
            scores: [
              cleanScore(val[0]),
              cleanScore(val[1]),
              cleanScore(val[2])
            ],
            name
          };
        } else if (typeof val === 'object' && val !== null) {
          const obj = val as { q1?: number; q2?: number; q3?: number };
          return {
            scores: [
              cleanScore(obj.q1),
              cleanScore(obj.q2),
              cleanScore(obj.q3)
            ],
            name
          };
        }
      }
    }
    return { scores: ['', '', ''], name: '' };
  };

  const filipino = getSubjectScores((_n, _c, norm) => norm.includes('filipino') || norm.includes('fil') || norm.includes('wika')).scores;
  const english = getSubjectScores((_n, _c, norm) => norm.includes('english') || norm.includes('eng')).scores;
  const math = getSubjectScores((_n, _c, norm) => norm.includes('mathematics') || norm.includes('math') || norm.includes('mth')).scores;
  const science = getSubjectScores((_n, _c, norm) => norm.includes('science') || norm.includes('sci') || norm.includes('agham')).scores;
  const ap = getSubjectScores((_n, _c, norm) => norm.includes('aralingpanlipunan') || norm.includes('ap') || norm.includes('socialstudies')).scores;
  const esp = getSubjectScores((_n, _c, norm) => norm.includes('edukasyonsapagpapakatao') || norm.includes('esp') || norm.includes('gmrc') || norm.includes('values')).scores;
  const epp_tle = getSubjectScores((name, _c, norm) =>
    norm.includes('epp') || norm.includes('tle') || norm.includes('tvl') ||
    norm.includes('edukasyongpantahanan') || norm.includes('technology') ||
    name.includes('e.p.p') || name.includes('t.l.e')
  ).scores;

  // MAPEH Components
  let music_arts = getSubjectScores((_n, _c, norm) => (norm.includes('music') && norm.includes('art')) || norm.includes('musicandart') || norm === 'ma' || norm === 'mapeh').scores;
  if (music_arts.every(v => v === '')) {
    const mScores = getSubjectScores((_n, _c, norm) => norm.includes('music') && !norm.includes('art')).scores;
    const aScores = getSubjectScores((_n, _c, norm) => norm.includes('art') && !norm.includes('music')).scores;
    music_arts = [0, 1, 2].map(i => {
      const m = mScores[i];
      const a = aScores[i];
      if (typeof m === 'number' && typeof a === 'number') return Math.round((m + a) / 2);
      if (typeof m === 'number') return m;
      if (typeof a === 'number') return a;
      return '';
    });
  }

  let pe_health = getSubjectScores((_n, _c, norm) => (norm.includes('physical') || norm.includes('pe') || norm.includes('phys')) && (norm.includes('health') || norm.includes('peh'))).scores;
  if (pe_health.every(v => v === '')) {
    const peScores = getSubjectScores((_n, _c, norm) => (norm.includes('physical') || norm.includes('pe') || norm.includes('phys')) && !norm.includes('health')).scores;
    const hScores = getSubjectScores((_n, _c, norm) => norm.includes('health') && !norm.includes('phys') && !norm.includes('pe')).scores;
    pe_health = [0, 1, 2].map(i => {
      const p = peScores[i];
      const h = hScores[i];
      if (typeof p === 'number' && typeof h === 'number') return Math.round((p + h) / 2);
      if (typeof p === 'number') return p;
      if (typeof h === 'number') return h;
      return '';
    });
  }

  // Program-specific specializations
  let specialization1: (string | number)[] = ['', '', ''];
  let specialization2: (string | number)[] = ['', '', ''];
  let specializationName1 = '';
  let specializationName2 = '';

  if (normProg === 'SPFL') {
    const res = getSubjectScores((_n, c, norm) =>
      norm.includes('spfl') || c.startsWith('SPFL') || norm.includes('spanish') ||
      norm.includes('japanese') || norm.includes('nihongo') || norm.includes('french') ||
      norm.includes('german') || norm.includes('chinese') || norm.includes('mandarin') ||
      norm.includes('korean') || norm.includes('foreignlanguage')
    );
    specialization1 = res.scores;
    specializationName1 = res.name || 'SPFL - Spanish';
  } else if (normProg === 'SPA') {
    const res = getSubjectScores((_n, c, norm) =>
      norm.includes('spa') || c.startsWith('SPA') || norm.includes('specialprograminthearts') ||
      norm.includes('visualarts') || norm.includes('creativewriting') || norm.includes('theater') ||
      norm.includes('mediaarts') || norm.includes('vocalmusic') || norm.includes('instrumental')
    );
    specialization1 = res.scores;
    specializationName1 = res.name || 'Special Program in the Arts';
  } else if (normProg === 'SPJ') {
    const res = getSubjectScores((_n, c, norm) =>
      norm.includes('spj') || c.startsWith('SPJ') || norm.includes('journalism') || norm.includes('pamamahayag')
    );
    specialization1 = res.scores;
    specializationName1 = res.name || 'SPJ - Journalism';
  } else if (normProg === 'SPS') {
    const res = getSubjectScores((_n, c, norm) =>
      norm.includes('sps') || c.startsWith('SPS') || norm.includes('specialprograminsports') || norm.includes('sports')
    );
    specialization1 = res.scores;
    specializationName1 = res.name || 'Special Program in Sports';
  } else if (normProg === 'SPSTEM' || normProg === 'STE') {
    // 1. Creative Tech
    const ctRes = getSubjectScores((_n, _c, norm) =>
      norm.includes('creative') || norm.includes('creativetechnology') || norm.includes('robotics') || norm.includes('biotech')
    );
    // 2. Research MIM/SIP
    const resRes = getSubjectScores((_n, _c, norm) =>
      norm.includes('research') || norm.includes('mim') || norm.includes('sip') || norm.includes('investigatory')
    );
    specialization1 = resRes.scores;
    specializationName1 = resRes.name || 'Research MIM/SIP';
    specialization2 = ctRes.scores;
    specializationName2 = ctRes.name || 'Creative Technology';
  } else if (normProg === 'SPTVE') {
    // 1. Technical Drawing or Entrepreneurship
    const tdRes = getSubjectScores((_n, _c, norm) =>
      norm.includes('drawing') || norm.includes('technicaldrawing') || norm.includes('drafting') ||
      norm.includes('entrepreneurship') || norm.includes('appliedentrepreneurship')
    );
    // 2. TVE Specialization
    const tveRes = getSubjectScores((_n, _c, norm) =>
      norm.includes('specialization') || norm.includes('tve') || norm.includes('tvl')
    );
    specialization1 = tdRes.scores;
    specializationName1 = tdRes.name || 'Applied Technical Drawing';
    specialization2 = tveRes.scores;
    specializationName2 = tveRes.name || 'TVE Specialization';
  }

  return {
    filipino,
    english,
    math,
    science,
    ap,
    esp,
    epp_tle,
    music_arts,
    pe_health,
    specialization1,
    specialization2,
    specializationName1,
    specializationName2
  };
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

  const selfClosingRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)\\/>`);
  if (selfClosingRegex.test(sheetXml)) {
    return sheetXml.replace(selfClosingRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleId = forceStyle || (styleMatch ? styleMatch[1] : '');
      const styleAttr = styleId ? ` s="${styleId}"` : '';
      if (isEmpty) return `<c r="${cellRef}"${styleAttr}/>`;
      if (isNum) return `<c r="${cellRef}"${styleAttr}><v>${value}</v></c>`;
      return `<c r="${cellRef}"${styleAttr} t="inlineStr"><is><t xml:space="preserve">${formattedVal}</t></is></c>`;
    });
  }

  const fullCellRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)>((?:(?!<c[\\s>]|<\\/row>|<row[\\s>])([\\s\\S]))*?)<\\/c>`);
  if (fullCellRegex.test(sheetXml)) {
    return sheetXml.replace(fullCellRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleId = forceStyle || (styleMatch ? styleMatch[1] : '');
      const styleAttr = styleId ? ` s="${styleId}"` : '';
      if (isEmpty) return `<c r="${cellRef}"${styleAttr}/>`;
      if (isNum) return `<c r="${cellRef}"${styleAttr}><v>${value}</v></c>`;
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
      return `<c r="${cellRef}"${cleanAttrs} t="str">${fTag}<v>${escapeXml(value)}</v></c>`;
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
    xml = updateCellInSheetXml(xml, cellRef, val, isNumeric, styles?.[cellRef]);
  }
  return xml;
}

// ---------------------------------------------------------------------------
// Main Populator for Special Curricular Programs
// ---------------------------------------------------------------------------

export async function populateSCPTemplateBuffer(
  templateBuffer: ArrayBuffer | Uint8Array | ArrayLike<number> | Buffer,
  opts: SF9SCPExportOptions
): Promise<ArrayBuffer> {
  let inputData: unknown = templateBuffer;
  if (typeof Buffer !== 'undefined' && Buffer.from && !Buffer.isBuffer(inputData)) {
    if (inputData instanceof ArrayBuffer) {
      inputData = Buffer.from(inputData);
    } else if (inputData && typeof inputData === 'object' && 'buffer' in inputData) {
      const typed = inputData as { buffer: ArrayBuffer; byteOffset?: number; byteLength?: number; length?: number };
      inputData = Buffer.from(typed.buffer, typed.byteOffset || 0, typed.byteLength || typed.length);
    }
  }
  const zip = await JSZip.loadAsync(inputData as Parameters<typeof JSZip.loadAsync>[0]);

  const {
    student,
    schoolProfile,
    schoolYear,
    section,
    program = 'SPFL',
    adviser,
    principal,
    grades,
    subjects = [],
    attendance,
    learners = [],
    gradeLevel = 'Grade 7'
  } = opts;

  const normProg = program.trim().toUpperCase();

  // 1. Clean calculation chain to prevent Excel recovery prompts
  zip.remove('xl/calcChain.xml');
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (relsFile) {
    let relsXml = await relsFile.async('text');
    relsXml = relsXml.replace(/<Relationship[^>]*Target="calcChain\.xml"[^>]*\/>/g, '');
    zip.file('xl/_rels/workbook.xml.rels', relsXml);
  }

  // 2. Resolve sheets
  const workbookFile = zip.file('xl/workbook.xml');
  if (!workbookFile) throw new Error('Invalid Excel file: missing xl/workbook.xml');
  const workbookXml = await workbookFile.async('text');

  const sheetMatches = [...workbookXml.matchAll(/<sheet[^>]*name="([^"]*)"[^>]*sheetId="(\d+)"[^>]*r:id="([^"]+)"/g)];
  const sheetRelsFile = zip.file('xl/_rels/workbook.xml.rels');
  const sheetRelsXml = sheetRelsFile ? await sheetRelsFile.async('text') : '';

  const getSheetPathByName = (nameMatch: (name: string) => boolean): string | null => {
    const s = sheetMatches.find(sm => nameMatch(sm[1]));
    if (!s) return null;
    const rId = s[3];
    const relMatch = sheetRelsXml.match(new RegExp(`<Relationship[^>]*Id="${rId}"[^>]*Target="([^"]+)"`));
    return relMatch ? `xl/${relMatch[1]}` : null;
  };

  const inputSheetPath = getSheetPathByName(n => n.toUpperCase().includes('INPUT')) || 'xl/worksheets/sheet2.xml';
  const term1Path = getSheetPathByName(n => n.toUpperCase().includes('TERM 1')) || 'xl/worksheets/sheet3.xml';
  const term2Path = getSheetPathByName(n => n.toUpperCase().includes('TERM 2')) || 'xl/worksheets/sheet4.xml';
  const term3Path = getSheetPathByName(n => n.toUpperCase().includes('TERM 3')) || 'xl/worksheets/sheet5.xml';
  const sf9SheetPath = getSheetPathByName(n => n.toUpperCase().includes('SF9')) || 'xl/worksheets/sheet6.xml';
  const attPath = getSheetPathByName(n => n.toUpperCase().includes('ATTENDANCE')) || 'xl/worksheets/sheet7.xml';

  const cleanHead = (principal || schoolProfile?.head_name || '').trim();
  const cleanAdviser = (adviser || '').trim();
  const cleanSchoolName = (schoolProfile?.name || '').trim();
  const cleanSchoolId = (schoolProfile?.school_id || '').trim();
  const cleanRegion = (schoolProfile?.region || '').trim();
  const cleanDivision = (schoolProfile?.division || '').trim();
  const cleanSy = (schoolYear || '').trim();
  const cleanSection = (section || '').trim();
  const cleanGradeNum = (gradeLevel || '').replace(/\D/g, '') || '7';

  // Build sorted student roster
  const allLearners = learners.length > 0 ? learners : [student];
  const isMaleLearner = (s: Student) => {
    const g = (s.gender || '').trim().toLowerCase();
    return g === 'm' || g === 'male';
  };
  const males = allLearners.filter(isMaleLearner);
  const females = allLearners.filter(s => !isMaleLearner(s));

  const formatDateToMMDDYYYY = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const y = d.getFullYear();
      return `${m}/${day}/${y}`;
    } catch {
      return '';
    }
  };

  // -------------------------------------------------------------------------
  // 3. Populate Sheet 2: INPUT DATA
  // -------------------------------------------------------------------------
  const inputFile = zip.file(inputSheetPath);
  if (inputFile) {
    let sheet2Xml = await inputFile.async('text');

    const inputCells: Record<string, string | number> = {
      'F10': cleanRegion,
      'F11': cleanDivision,
      'F12': schoolProfile?.city || schoolProfile?.municipality || '',
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

    // Males: L11:N60
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
            serial,
          });
        } else {
          inputCells[`N${r}`] = formatDateToMMDDYYYY(m.birthday);
        }
      } else {
        inputCells[`N${r}`] = '';
      }
    }

    // Females: Q11:S60
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
            serial,
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

  const currentGrades = extractSCPSubjectGrades(grades, subjects, normProg);

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

    const fillStudentRow = (r: number, s: Student, isMale: boolean) => {
      formulaResults[`C${r}`] = formatLearnerName(s);
      formulaResults[`F${r}`] = s.lrn || '';
      const bSerial = birthDateToExcelSerial(s.birthday);
      if (bSerial !== null) {
        formulaResults[`H${r}`] = bSerial;
      } else {
        formulaResults[`H${r}`] = formatDateToMMDDYYYY(s.birthday);
      }
      formulaResults[`I${r}`] = parseAge(s.age, s.birthday);

      const studentGradesRecord = (s as unknown as StudentWithGrades).grades || {};
      const g = (s.lrn === student.lrn) ? currentGrades : extractSCPSubjectGrades(studentGradesRecord, subjects, normProg);

      termCells[`J${r}`] = isMale ? 'M' : 'F';
      termCells[`K${r}`] = cleanScore(g.filipino[termIndex]);
      termCells[`L${r}`] = cleanScore(g.english[termIndex]);
      termCells[`M${r}`] = cleanScore(g.math[termIndex]);
      termCells[`N${r}`] = cleanScore(g.science[termIndex]);
      termCells[`O${r}`] = cleanScore(g.ap[termIndex]);
      termCells[`P${r}`] = cleanScore(g.esp[termIndex]);

      let mapehVal: number | '' = '';
      let termGenAvg: number | '' = '';

      if (normProg === 'SPTVE') {
        const ma = cleanScore(g.music_arts[termIndex]);
        const peh = cleanScore(g.pe_health[termIndex]);
        termCells[`Q${r}`] = ma;
        termCells[`R${r}`] = peh;
        if (typeof ma === 'number' && typeof peh === 'number') {
          mapehVal = Math.round((ma + peh) / 2);
        } else if (typeof ma === 'number') {
          mapehVal = ma;
        } else if (typeof peh === 'number') {
          mapehVal = peh;
        }
        const s1 = cleanScore(g.specialization1[termIndex]);
        const s2 = cleanScore(g.specialization2[termIndex]);
        termCells[`T${r}`] = s1;
        termCells[`U${r}`] = s2;

        const subNums = [
          cleanScore(g.filipino[termIndex]),
          cleanScore(g.english[termIndex]),
          cleanScore(g.math[termIndex]),
          cleanScore(g.science[termIndex]),
          cleanScore(g.ap[termIndex]),
          cleanScore(g.esp[termIndex]),
          mapehVal,
          s1,
          s2
        ].filter((v): v is number => typeof v === 'number' && v > 0);

        if (subNums.length > 0) {
          termGenAvg = Math.round(subNums.reduce((a, b) => a + b, 0) / subNums.length);
        }
        formulaResults[`S${r}`] = mapehVal;
        formulaResults[`V${r}`] = termGenAvg;
      } else if (normProg === 'SPSTEM' || normProg === 'STE') {
        const spec2 = cleanScore(g.specialization2[termIndex]); // Creative Tech
        const ma = cleanScore(g.music_arts[termIndex]);
        const peh = cleanScore(g.pe_health[termIndex]);
        const spec1 = cleanScore(g.specialization1[termIndex]); // Research
        termCells[`Q${r}`] = spec2;
        termCells[`R${r}`] = ma;
        termCells[`S${r}`] = peh;
        termCells[`U${r}`] = spec1;

        if (typeof ma === 'number' && typeof peh === 'number') {
          mapehVal = Math.round((ma + peh) / 2);
        } else if (typeof ma === 'number') {
          mapehVal = ma;
        } else if (typeof peh === 'number') {
          mapehVal = peh;
        }

        const subNums = [
          cleanScore(g.filipino[termIndex]),
          cleanScore(g.english[termIndex]),
          cleanScore(g.math[termIndex]),
          cleanScore(g.science[termIndex]),
          cleanScore(g.ap[termIndex]),
          cleanScore(g.esp[termIndex]),
          spec2,
          mapehVal,
          spec1
        ].filter((v): v is number => typeof v === 'number' && v > 0);

        if (subNums.length > 0) {
          termGenAvg = Math.round(subNums.reduce((a, b) => a + b, 0) / subNums.length);
        }
        formulaResults[`T${r}`] = mapehVal;
        formulaResults[`V${r}`] = termGenAvg;
      } else if (normProg === 'SSES') {
        const epp = cleanScore(g.epp_tle[termIndex]);
        const ma = cleanScore(g.music_arts[termIndex]);
        const peh = cleanScore(g.pe_health[termIndex]);
        termCells[`Q${r}`] = epp;
        termCells[`R${r}`] = ma;
        termCells[`S${r}`] = peh;

        if (typeof ma === 'number' && typeof peh === 'number') {
          mapehVal = Math.round((ma + peh) / 2);
        } else if (typeof ma === 'number') {
          mapehVal = ma;
        } else if (typeof peh === 'number') {
          mapehVal = peh;
        }

        const subNums = [
          cleanScore(g.filipino[termIndex]),
          cleanScore(g.english[termIndex]),
          cleanScore(g.math[termIndex]),
          cleanScore(g.science[termIndex]),
          cleanScore(g.ap[termIndex]),
          cleanScore(g.esp[termIndex]),
          epp,
          mapehVal
        ].filter((v): v is number => typeof v === 'number' && v > 0);

        if (subNums.length > 0) {
          termGenAvg = Math.round(subNums.reduce((a, b) => a + b, 0) / subNums.length);
        }
        formulaResults[`T${r}`] = mapehVal;
        formulaResults[`U${r}`] = termGenAvg;
      } else {
        // SPFL, SPA, SPJ, SPS
        const epp = cleanScore(g.epp_tle[termIndex]);
        const ma = cleanScore(g.music_arts[termIndex]);
        const peh = cleanScore(g.pe_health[termIndex]);
        const spec1 = cleanScore(g.specialization1[termIndex]);
        termCells[`Q${r}`] = epp;
        termCells[`R${r}`] = ma;
        termCells[`S${r}`] = peh;
        termCells[`U${r}`] = spec1;

        if (typeof ma === 'number' && typeof peh === 'number') {
          mapehVal = Math.round((ma + peh) / 2);
        } else if (typeof ma === 'number') {
          mapehVal = ma;
        } else if (typeof peh === 'number') {
          mapehVal = peh;
        }

        const subNums = [
          cleanScore(g.filipino[termIndex]),
          cleanScore(g.english[termIndex]),
          cleanScore(g.math[termIndex]),
          cleanScore(g.science[termIndex]),
          cleanScore(g.ap[termIndex]),
          cleanScore(g.esp[termIndex]),
          epp,
          mapehVal,
          spec1
        ].filter((v): v is number => typeof v === 'number' && v > 0);

        if (subNums.length > 0) {
          termGenAvg = Math.round(subNums.reduce((a, b) => a + b, 0) / subNums.length);
        }
        formulaResults[`T${r}`] = mapehVal;
        formulaResults[`V${r}`] = termGenAvg;
      }
    };

    const clearStudentRow = (r: number) => {
      formulaResults[`C${r}`] = '';
      formulaResults[`F${r}`] = '';
      formulaResults[`H${r}`] = '';
      formulaResults[`I${r}`] = '';
      formulaResults[`S${r}`] = '';
      formulaResults[`T${r}`] = '';
      formulaResults[`U${r}`] = '';
      formulaResults[`V${r}`] = '';
      ['J','K','L','M','N','O','P','Q','R','S','T','U','V'].forEach(col => {
        termCells[`${col}${r}`] = '';
      });
    };

    // Males: Rows 15 to 64
    for (let idx = 0; idx < 50; idx++) {
      const r = 15 + idx;
      const m = males[idx];
      if (m) fillStudentRow(r, m, true);
      else clearStudentRow(r);
    }

    // Females: Rows 66 to 115
    for (let idx = 0; idx < 50; idx++) {
      const r = 66 + idx;
      const f = females[idx];
      if (f) fillStudentRow(r, f, false);
      else clearStudentRow(r);
    }

    sXml = updateFormulaValuesBatch(sXml, formulaResults);
    sXml = updateCellsBatch(sXml, termCells, undefined, true);
    zip.file(file, sXml);
  }

  // -------------------------------------------------------------------------
  // 5. Sheet: ATTENDANCE RECORD SUMMARY
  // -------------------------------------------------------------------------
  const attFile = zip.file(attPath);
  if (attFile) {
    let attXml = await attFile.async('text');
    const attFormulaResults: Record<string, string | number> = {
      'G10': cleanGradeNum,
      'G11': cleanSection,
      'L10': cleanAdviser
    };
    const attCells: Record<string, string | number> = {};
    const monthCols = ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P']; // Jun to Apr

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
  // 6. Sheet: Printable SF9
  // -------------------------------------------------------------------------
  const sf9File = zip.file(sf9SheetPath);
  if (sf9File) {
    let sf9Xml = await sf9File.async('text');

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

    // School Head cancellation cell
    if (normProg === 'SSES') {
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'Q49', "'INPUT DATA'!F19", cleanHead);
    } else {
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'Q50', "'INPUT DATA'!F19", cleanHead);
    }

    const calculatedAge = parseAge(student.age, student.birthday);

    const currentStudentName = formatLearnerName(student);
    const isMale = isMaleLearner(student);

    sf9Xml = updateCellInSheetXml(sf9Xml, 'C17', currentStudentName);

    const sf9FormulaResults: Record<string, string | number> = {
      'C18': student.lrn || '',
      'I17': calculatedAge,
      'K17': isMale ? 'M' : 'F',
      'I18': cleanGradeNum,
      'K18': cleanSection
    };

    const calcFinalGrade = (qList: (string | number)[]): number | '' => {
      const nums = qList.map(v => cleanScore(v)).filter((v): v is number => typeof v === 'number');
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
    const fSpec1 = calcFinalGrade(currentGrades.specialization1);
    const fSpec2 = calcFinalGrade(currentGrades.specialization2);

    // Compute MAPEH
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

    // Program-specific General Average and Subject mapping
    let learningAreaFinals: (number | '')[] = [];
    let genAvgRow = 43;
    let genAvgFormula = '';
    const rangeCol = normProg === 'SSES' ? '$U' : '$V';

    type SubjectRowItem = {
      r: number;
      col: number;
      terms: (string | number)[];
      final: number | '';
      hasRemarks: boolean;
    };
    let subjectRowData: SubjectRowItem[] = [];

    if (normProg === 'SSES') {
      learningAreaFinals = [fFil, fEng, fMat, fSci, fAp, fEsp, fEpp, fMapeh];
      genAvgRow = 42;
      genAvgFormula = 'IF(COUNT(I32:I39)<8,"",ROUND(AVERAGE(I32:I39),0))';
      subjectRowData = [
        { r: 32, col: 9, terms: currentGrades.filipino, final: fFil, hasRemarks: true },
        { r: 33, col: 10, terms: currentGrades.english, final: fEng, hasRemarks: true },
        { r: 34, col: 11, terms: currentGrades.math, final: fMat, hasRemarks: true },
        { r: 35, col: 12, terms: currentGrades.science, final: fSci, hasRemarks: true },
        { r: 36, col: 13, terms: currentGrades.ap, final: fAp, hasRemarks: true },
        { r: 37, col: 14, terms: currentGrades.esp, final: fEsp, hasRemarks: true },
        { r: 38, col: 15, terms: currentGrades.epp_tle, final: fEpp, hasRemarks: true },
        { r: 39, col: 18, terms: mapehTerms, final: fMapeh, hasRemarks: true },
        { r: 40, col: 16, terms: currentGrades.music_arts, final: fMa, hasRemarks: false },
        { r: 41, col: 17, terms: currentGrades.pe_health, final: fPeh, hasRemarks: false },
      ];
    } else if (normProg === 'SPTVE') {
      learningAreaFinals = [fFil, fEng, fMat, fSci, fAp, fEsp, fMapeh, fSpec1, fSpec2];
      genAvgRow = 43;
      genAvgFormula = 'IF(COUNT(I32:I37,I38,I41,I42)<9,"",ROUND(AVERAGE(I32:I37,I38,I41,I42),0))';
      subjectRowData = [
        { r: 32, col: 9, terms: currentGrades.filipino, final: fFil, hasRemarks: true },
        { r: 33, col: 10, terms: currentGrades.english, final: fEng, hasRemarks: true },
        { r: 34, col: 11, terms: currentGrades.math, final: fMat, hasRemarks: true },
        { r: 35, col: 12, terms: currentGrades.science, final: fSci, hasRemarks: true },
        { r: 36, col: 13, terms: currentGrades.ap, final: fAp, hasRemarks: true },
        { r: 37, col: 14, terms: currentGrades.esp, final: fEsp, hasRemarks: true },
        { r: 38, col: 17, terms: mapehTerms, final: fMapeh, hasRemarks: true },
        { r: 39, col: 15, terms: currentGrades.music_arts, final: fMa, hasRemarks: false },
        { r: 40, col: 16, terms: currentGrades.pe_health, final: fPeh, hasRemarks: false },
        { r: 41, col: 18, terms: currentGrades.specialization1, final: fSpec1, hasRemarks: true },
        { r: 42, col: 19, terms: currentGrades.specialization2, final: fSpec2, hasRemarks: true },
      ];
    } else {
      // SPFL, SPA, SPJ, SPS, SPSTEM
      const isSpec2 = normProg === 'SPSTEM' || normProg === 'STE';
      learningAreaFinals = [fFil, fEng, fMat, fSci, fAp, fEsp, isSpec2 ? fSpec2 : fEpp, fMapeh, fSpec1];
      genAvgRow = 43;
      genAvgFormula = 'IF(COUNT(I32:I39,I42)<9,"",ROUND(AVERAGE(I32:I39,I42),0))';
      subjectRowData = [
        { r: 32, col: 9, terms: currentGrades.filipino, final: fFil, hasRemarks: true },
        { r: 33, col: 10, terms: currentGrades.english, final: fEng, hasRemarks: true },
        { r: 34, col: 11, terms: currentGrades.math, final: fMat, hasRemarks: true },
        { r: 35, col: 12, terms: currentGrades.science, final: fSci, hasRemarks: true },
        { r: 36, col: 13, terms: currentGrades.ap, final: fAp, hasRemarks: true },
        { r: 37, col: 14, terms: currentGrades.esp, final: fEsp, hasRemarks: true },
        { r: 38, col: 15, terms: isSpec2 ? currentGrades.specialization2 : currentGrades.epp_tle, final: isSpec2 ? fSpec2 : fEpp, hasRemarks: true },
        { r: 39, col: 18, terms: mapehTerms, final: fMapeh, hasRemarks: true },
        { r: 40, col: 16, terms: currentGrades.music_arts, final: fMa, hasRemarks: false },
        { r: 41, col: 17, terms: currentGrades.pe_health, final: fPeh, hasRemarks: false },
        { r: 42, col: 19, terms: currentGrades.specialization1, final: fSpec1, hasRemarks: true },
      ];
    }

    const genAvg = learningAreaFinals.every(g => typeof g === 'number' && g > 0)
      ? Math.round((learningAreaFinals as number[]).reduce((a, b) => a + b, 0) / learningAreaFinals.length)
      : '';
    const genAvgRemarks = calcRemarks(genAvg);

    for (const sub of subjectRowData) {
      const term1Val = cleanScore(sub.terms[0]);
      const term2Val = cleanScore(sub.terms[1]);
      const term3Val = cleanScore(sub.terms[2]);
      const finalVal = cleanScore(sub.final);
      const remarksVal = (sub.hasRemarks && typeof finalVal === 'number' && finalVal > 0) ? calcRemarks(finalVal) : '';

      const fFormula = `IF(C17="","",IFERROR(IF(VLOOKUP(C17,'TERM 1 SUMMARY'!$C$15:${rangeCol}$115,${sub.col},0)=0,"",VLOOKUP(C17,'TERM 1 SUMMARY'!$C$15:${rangeCol}$115,${sub.col},0)),""))`;
      const gFormula = `IF(C17="","",IFERROR(IF(VLOOKUP(C17,'TERM 2 SUMMARY'!$C$15:${rangeCol}$115,${sub.col},0)=0,"",VLOOKUP(C17,'TERM 2 SUMMARY'!$C$15:${rangeCol}$115,${sub.col},0)),""))`;
      const hFormula = `IF(C17="","",IFERROR(IF(VLOOKUP(C17,'TERM 3 SUMMARY'!$C$15:${rangeCol}$115,${sub.col},0)=0,"",VLOOKUP(C17,'TERM 3 SUMMARY'!$C$15:${rangeCol}$115,${sub.col},0)),""))`;

      sf9Xml = updateFormulaCellExplicit(sf9Xml, `F${sub.r}`, fFormula, term1Val);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, `G${sub.r}`, gFormula, term2Val);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, `H${sub.r}`, hFormula, term3Val);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, `I${sub.r}`, `IF(COUNT(F${sub.r}:H${sub.r})<3,"",ROUND(AVERAGE(F${sub.r}:H${sub.r}),0))`, finalVal);
      if (sub.hasRemarks) {
        sf9Xml = updateFormulaCellExplicit(sf9Xml, `J${sub.r}`, `IF(I${sub.r}="","",IF(I${sub.r}>=75,"Passed","Failed"))`, remarksVal);
      }
    }

    // Update specialization label in B42 if customized
    if (currentGrades.specializationName1 && normProg === 'SPFL') {
      sf9Xml = updateCellInSheetXml(sf9Xml, 'B42', currentGrades.specializationName1);
    }

    // General average cell
    sf9Xml = updateFormulaCellExplicit(sf9Xml, `I${genAvgRow}`, genAvgFormula, cleanScore(genAvg));
    sf9Xml = updateFormulaCellExplicit(sf9Xml, `J${genAvgRow}`, `IF(I${genAvgRow}="","",IF(I${genAvgRow}>=75,"Passed","Failed"))`, genAvgRemarks);

    // Attendance days
    const sf9MonthCols = ['R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB']; // Jun to Apr (11 columns)
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

    // Row 9: No. of Days Absent
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
    zip.file(sf9SheetPath, sf9Xml);
  }

  return await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}

// ---------------------------------------------------------------------------
// Section Master Batch Export
// ---------------------------------------------------------------------------

export async function exportSF9SCPSectionMasterToExcel(
  opts: SF9SCPExportOptions
): Promise<void> {
  const { program = 'SPFL', gradeLevel = 'Grade 7', section, schoolYear } = opts;
  const templateBuffer = await fetchSCPTemplateBuffer(program, gradeLevel);
  const outBuffer = await populateSCPTemplateBuffer(templateBuffer, opts);

  const cleanSec = (section || 'Master').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanSy = (schoolYear || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `SF9_${program}_${cleanSec}_SY${cleanSy}.xlsx`;

  if (typeof window !== 'undefined') {
    const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
