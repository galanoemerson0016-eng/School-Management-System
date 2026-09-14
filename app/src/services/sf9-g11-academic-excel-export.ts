/**
 * SF9 Grade 11 Academic Excel Export Service
 * Populates the official DepEd Grade 11 Academic SF9 template
 * (G11 Academic School Form 9 (SY 26-27).xlsx)
 * preserving all 8 worksheets, OpenXML styles, formulas, drawing relationships,
 * and calculations for Core subjects + Academic Electives across Term 1, 2, and 3.
 */

import JSZip from 'jszip';
import type { Student, SchoolProfile, Subject } from '../types';
import { formatLearnerName } from '../utils/student-name';

export interface SF9Grade11AcademicExportOptions {
  student: Student;
  schoolProfile?: SchoolProfile;
  schoolYear: string;
  section: string;
  adviser?: string;
  principal?: string;
  principalTitle?: string;
  track?: string;
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

export function isGrade11Academic(gradeLevel: string | undefined | null, track?: string | undefined | null): boolean {
  if (!gradeLevel) return false;
  const s = gradeLevel.trim().toLowerCase();

  // Must be Grade 11 (exclude Grade 12, 1, 2, 3, etc.)
  const isG11 = /\b(?:grade\s*11|g11|11)\b/i.test(s) && !/\b(?:grade\s*12|g12|12)\b/i.test(s);
  if (!isG11) return false;

  // Track check: default to Academic if not specified or contains academic
  if (!track) return true;
  const t = track.trim().toLowerCase();
  if (
    t.includes('tech') ||
    t.includes('tvet') ||
    t.includes('pro') ||
    (t.includes('arts') && t.includes('design')) ||
    t.includes('sports')
  ) {
    return false;
  }
  return true;
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

export function formatDateToMMDDYYYY(dateVal: string | Date | undefined | null): string {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export async function fetchGrade11AcademicTemplateBuffer(): Promise<ArrayBuffer> {
  const cleanBase = (import.meta.env.BASE_URL || '/').endsWith('/')
    ? (import.meta.env.BASE_URL || '/')
    : `${import.meta.env.BASE_URL}/`;
  const timestamp = Date.now();

  const candidateUrls = [
    `${cleanBase}templates/G11 Academic School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `/templates/G11 Academic School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `templates/G11 Academic School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `${cleanBase}templates/G11%20Academic%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
    `/templates/G11%20Academic%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
          return buffer;
        }
      }
    } catch {
      // Continue searching next candidate URL
    }
  }

  throw new Error('Failed to load official Grade 11 Academic SF9 template (G11 Academic School Form 9 (SY 26-27).xlsx)');
}

export interface Grade11AcademicSubjectGrades {
  effectiveComm: [number | '', number | '', number | ''];
  mabisangKom: [number | '', number | '', number | ''];
  genMath: [number | '', number | '', number | ''];
  genSci: [number | '', number | '', number | ''];
  lifeCareer: [number | '', number | '', number | ''];
  pklp: [number | '', number | '', number | ''];
  academicElective1: number | ''; // Term 1
  academicElective2: number | ''; // Term 2
  academicElective3: number | ''; // Term 3
  ae1Name?: string;
  ae2Name?: string;
  ae3Name?: string;
}

function extractScoreNumber(val: unknown): number | '' {
  if (val === undefined || val === null || val === '') return '';
  const num = Number(val);
  return !isNaN(num) && num > 0 ? num : '';
}

function getGradeFromEntry(entry: unknown, termIdx: number): number | '' {
  if (!entry) return '';
  if (Array.isArray(entry)) {
    return extractScoreNumber(entry[termIdx]);
  }
  if (typeof entry === 'object') {
    const obj = entry as { q1?: unknown; q2?: unknown; q3?: unknown; q4?: unknown; final?: unknown };
    if (termIdx === 0) return extractScoreNumber(obj.q1 !== undefined && obj.q1 !== null && obj.q1 !== '' ? obj.q1 : obj.final);
    if (termIdx === 1) return extractScoreNumber(obj.q2 !== undefined && obj.q2 !== null && obj.q2 !== '' ? obj.q2 : obj.final);
    if (termIdx === 2) return extractScoreNumber(obj.q3 !== undefined && obj.q3 !== null && obj.q3 !== '' ? obj.q3 : obj.final);
  }
  if (typeof entry === 'number' || typeof entry === 'string') {
    return extractScoreNumber(entry);
  }
  return '';
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

export function extractGrade11AcademicSubjectGrades(
  gradesRecord: Record<string, unknown> = {},
  subjectsList: Subject[] = []
): Grade11AcademicSubjectGrades {
  function getSubjectInfo(
    matchFn: (name: string, code: string, normName: string, normCode: string) => boolean
  ): { scores: [number | '', number | '', number | '']; matchedName?: string } {
    let matchedKey: string | null = null;
    let matchedDisplayName: string | undefined = undefined;

    // 1. Try to match from gradesRecord keys
    for (const key of Object.keys(gradesRecord)) {
      const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const subObj = subjectsList.find(s => {
        const sName = s.subject_name || (s as unknown as { name?: string }).name || '';
        const sCode = s.subject_code || (s as unknown as { code?: string }).code || '';
        const normSName = sName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normSCode = sCode.toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          s.id === key ||
          sName.toLowerCase() === key.toLowerCase() ||
          (sCode && sCode.toLowerCase() === key.toLowerCase()) ||
          (normSName && normSName === normKey) ||
          (normSCode && normSCode === normKey)
        );
      });
      const subName = subObj ? (subObj.subject_name || (subObj as unknown as { name?: string }).name || key) : key;
      const subCode = subObj ? (subObj.subject_code || (subObj as unknown as { code?: string }).code || '') : '';
      const normName = subName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normCode = subCode.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (matchFn(subName.toLowerCase(), subCode.toLowerCase(), normName, normCode)) {
        matchedKey = key;
        matchedDisplayName = subName;
        break;
      }
    }

    // 2. If not found in gradesRecord keys, try finding matching subject in subjectsList
    if (!matchedDisplayName) {
      const subObj = subjectsList.find(s => {
        const sName = s.subject_name || (s as unknown as { name?: string }).name || '';
        const sCode = s.subject_code || (s as unknown as { code?: string }).code || '';
        const normSName = sName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normSCode = sCode.toLowerCase().replace(/[^a-z0-9]/g, '');
        return matchFn(sName.toLowerCase(), sCode.toLowerCase(), normSName, normSCode);
      });
      if (subObj) {
        matchedDisplayName = subObj.subject_name || (subObj as unknown as { name?: string }).name;
        if (!matchedKey) {
          matchedKey = subObj.id;
        }
      }
    }

    if (!matchedKey || !gradesRecord[matchedKey]) {
      return { scores: ['', '', ''], matchedName: matchedDisplayName };
    }
    const g = gradesRecord[matchedKey];
    return {
      scores: [
        getGradeFromEntry(g, 0),
        getGradeFromEntry(g, 1),
        getGradeFromEntry(g, 2),
      ],
      matchedName: matchedDisplayName
    };
  }

  // 1. Effective Communication
  const effectiveCommInfo = getSubjectInfo((_name, code, normName) => {
    return (
      (normName.includes('effective') && normName.includes('communication')) ||
      normName === 'effectivecommunication' ||
      code === 'ec'
    );
  });

  // 2. Mabisang Komunikasyon
  const mabisangKomInfo = getSubjectInfo((_name, code, normName) => {
    return (
      (normName.includes('mabisang') && normName.includes('komunikasyon')) ||
      normName === 'mabisangkomunikasyon' ||
      code === 'mk'
    );
  });

  // 3. General Mathematics
  const genMathInfo = getSubjectInfo((_name, _code, normName) => {
    return (
      normName.includes('generalmathematics') ||
      normName.includes('genmath') ||
      (normName.includes('math') && !normName.includes('advanced') && !normName.includes('finite'))
    );
  });

  // 4. General Science
  const genSciInfo = getSubjectInfo((_name, _code, normName) => {
    return (
      normName.includes('generalscience') ||
      normName.includes('gensci') ||
      (normName.includes('science') && !normName.includes('earth') && !normName.includes('space') && !normName.includes('computer'))
    );
  });

  // 5. Life and Career Skills
  const lifeCareerInfo = getSubjectInfo((_name, code, normName) => {
    return (
      normName.includes('lifeandcareerskills') ||
      normName.includes('lifecareer') ||
      (normName.includes('life') && normName.includes('career')) ||
      code === 'lcs'
    );
  });

  // 6. Pag-aaral ng Kasaysayan at Lipunang Pilipino (PKLP)
  const pklpInfo = getSubjectInfo((_name, code, normName) => {
    return (
      normName.includes('kasaysayan') ||
      normName.includes('kasanayan') ||
      normName.includes('lipunangpilipino') ||
      normName.includes('pklp') ||
      code === 'pklp'
    );
  });

  // 7. Academic Electives 1, 2, 3
  const ae1Info = getSubjectInfo((_name, _code, normName) => {
    return (
      normName === 'academicelective1' ||
      normName === 'ae1' ||
      normName.includes('academicelective1') ||
      normName.includes('elective1')
    );
  });

  const ae2Info = getSubjectInfo((_name, _code, normName) => {
    return (
      normName === 'academicelective2' ||
      normName === 'ae2' ||
      normName.includes('academicelective2') ||
      normName.includes('elective2')
    );
  });

  const ae3Info = getSubjectInfo((_name, _code, normName) => {
    return (
      normName === 'academicelective3' ||
      normName === 'ae3' ||
      normName.includes('academicelective3') ||
      normName.includes('elective3')
    );
  });

  const coreNormSet = new Set([
    'effectivecommunication', 'mabisangkomunikasyon', 'generalmathematics',
    'generalscience', 'lifeandcareerskills', 'pklp', 'paagngkasaysayanatlipunangpilipino',
    'pagaaralngkasaysayanatlipunangpilipino', 'pagaaralngkasanayanatlipunangpilipino'
  ]);

  let fallbackAe1: number | '' = ae1Info.scores[0];
  let fallbackAe2: number | '' = ae2Info.scores[1] || ae1Info.scores[1];
  let fallbackAe3: number | '' = ae3Info.scores[2] || ae1Info.scores[2];
  let ae1Name = ae1Info.matchedName;
  let ae2Name = ae2Info.matchedName;
  let ae3Name = ae3Info.matchedName;

  const candidateElectiveKeys: string[] = [];
  for (const key of Object.keys(gradesRecord)) {
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const subObj = subjectsList.find(s => s.id === key || (s.subject_name || (s as unknown as { name?: string }).name || '').toLowerCase() === key.toLowerCase());
    const isHdr = (subObj as unknown as { isHeader?: boolean; isReserved?: boolean })?.isHeader || (subObj as unknown as { isHeader?: boolean; isReserved?: boolean })?.isReserved;
    const isCategoryHeader = ['coresubjects', 'electivesubjects', 'appliedsubjects', 'specializedsubjects', 'core', 'applied', 'specialized'].includes(normKey);
    if (isHdr || isCategoryHeader) continue;
    if (
      !coreNormSet.has(normKey) &&
      !normKey.includes('effective') &&
      !normKey.includes('mabisang') &&
      !normKey.includes('math') &&
      !normKey.includes('science') &&
      !normKey.includes('career') &&
      !normKey.includes('lipunan')
    ) {
      candidateElectiveKeys.push(key);
    }
  }

  const getDisplayName = (key: string) => {
    const sub = subjectsList.find(s => s.id === key || (s.subject_name || (s as unknown as { name?: string }).name || '').toLowerCase() === key.toLowerCase());
    return sub ? (sub.subject_name || (sub as unknown as { name?: string }).name || key) : key;
  };

  if (candidateElectiveKeys.length > 0) {
    const k0 = candidateElectiveKeys[0];
    const firstEntry = gradesRecord[k0];
    if (fallbackAe1 === '') fallbackAe1 = getGradeFromEntry(firstEntry, 0);
    if (!ae1Name) ae1Name = getDisplayName(k0);

    if (fallbackAe2 === '' && candidateElectiveKeys.length === 1) fallbackAe2 = getGradeFromEntry(firstEntry, 1);
    if (fallbackAe3 === '' && candidateElectiveKeys.length === 1) fallbackAe3 = getGradeFromEntry(firstEntry, 2);
  }
  if (candidateElectiveKeys.length > 1) {
    const k1 = candidateElectiveKeys[1];
    const secondEntry = gradesRecord[k1];
    if (fallbackAe2 === '') fallbackAe2 = getGradeFromEntry(secondEntry, 1) || getGradeFromEntry(secondEntry, 0);
    if (!ae2Name) ae2Name = getDisplayName(k1);
  }
  if (candidateElectiveKeys.length > 2) {
    const k2 = candidateElectiveKeys[2];
    const thirdEntry = gradesRecord[k2];
    if (fallbackAe3 === '') fallbackAe3 = getGradeFromEntry(thirdEntry, 2) || getGradeFromEntry(thirdEntry, 0);
    if (!ae3Name) ae3Name = getDisplayName(k2);
  }

  // Also check non-core subjects from subjectsList if any elective name is still generic
  const nonCoreSubjects = subjectsList.filter(s => {
    const isHdr = (s as unknown as { isHeader?: boolean; isReserved?: boolean })?.isHeader || (s as unknown as { isHeader?: boolean; isReserved?: boolean })?.isReserved;
    if (isHdr) return false;
    const rawName = s.subject_name || (s as unknown as { name?: string }).name || '';
    const sName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isCategoryHeader = ['coresubjects', 'electivesubjects', 'appliedsubjects', 'specializedsubjects', 'core', 'applied', 'specialized'].includes(sName);
    if (isCategoryHeader) return false;
    return (
      !coreNormSet.has(sName) &&
      !sName.includes('effective') &&
      !sName.includes('mabisang') &&
      !sName.includes('generalmath') &&
      !sName.includes('generalscience') &&
      !sName.includes('lifeandcareer') &&
      !sName.includes('lipunangpilipino')
    );
  });

  if (!ae1Name && nonCoreSubjects.length > 0) {
    ae1Name = nonCoreSubjects[0].subject_name || (nonCoreSubjects[0] as unknown as { name?: string }).name;
  }
  if (!ae2Name && nonCoreSubjects.length > 1) {
    ae2Name = nonCoreSubjects[1].subject_name || (nonCoreSubjects[1] as unknown as { name?: string }).name;
  }
  if (!ae3Name && nonCoreSubjects.length > 2) {
    ae3Name = nonCoreSubjects[2].subject_name || (nonCoreSubjects[2] as unknown as { name?: string }).name;
  }

  return {
    effectiveComm: effectiveCommInfo.scores,
    mabisangKom: mabisangKomInfo.scores,
    genMath: genMathInfo.scores,
    genSci: genSciInfo.scores,
    lifeCareer: lifeCareerInfo.scores,
    pklp: pklpInfo.scores,
    academicElective1: fallbackAe1,
    academicElective2: fallbackAe2,
    academicElective3: fallbackAe3,
    ae1Name: ae1Name || 'Academic Elective 1',
    ae2Name: ae2Name || 'Academic Elective 2',
    ae3Name: ae3Name || 'Academic Elective 3',
  };
}

function escapeXml(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  return String(str)
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
  forceStyle?: string
): string {
  const isNum = typeof value === 'number' && !isNaN(value);
  const formattedVal = escapeXml(value);
  const isEmpty = value === undefined || value === null || value === '';

  // 1. Check self-closing cell: <c r="C5" s="123"/>
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

  // 2. Check full cell: <c r="C5" ...>...</c>
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
      const fMatch = body.match(/<f[^>]*>[\s\S]*?<\/f>/);
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
  styles?: Record<string, string>
): string {
  let xml = sheetXml;
  for (const [cellRef, val] of Object.entries(cells)) {
    const style = styles ? styles[cellRef] : undefined;
    xml = updateCellInSheetXml(xml, cellRef, val, style);
  }
  return xml;
}

function columnToNumber(column: string): number {
  let result = 0;
  for (const char of column) result = result * 26 + char.charCodeAt(0) - 64;
  return result;
}

function numberToColumn(number: number): string {
  let result = '';
  for (let value = number; value > 0; value = Math.floor((value - 1) / 26)) {
    result = String.fromCharCode(65 + ((value - 1) % 26)) + result;
  }
  return result;
}

function shiftFormulaReferences(formula: string, rowDelta: number, columnDelta: number): string {
  return formula.replace(/(\$?)([A-Z]{1,3})(\$?)(\d+)/g, (_match, columnAbsolute, column, rowAbsolute, row) => {
    const nextColumn = columnAbsolute ? column : numberToColumn(columnToNumber(column) + columnDelta);
    const nextRow = rowAbsolute ? row : String(Number(row) + rowDelta);
    return `${columnAbsolute}${nextColumn}${rowAbsolute}${nextRow}`;
  });
}

function expandSharedFormulas(sheetXml: string): string {
  const sharedMasters = new Map<string, { column: string; row: number; formula: string }>();
  const cellRegex = /<c\s+r="([A-Z]+)(\d+)"([^>]*)>([\s\S]*?)<\/c>/g;
  let match: RegExpExecArray | null;

  while ((match = cellRegex.exec(sheetXml)) !== null) {
    const formulaMatch = match[4].match(/<f\s+([^>]*?\bsi="([^"]+)"[^>]*)>([\s\S]*?)<\/f>/);
    if (formulaMatch && /\bref="/.test(formulaMatch[1])) {
      sharedMasters.set(formulaMatch[2], {
        column: match[1],
        row: Number(match[2]),
        formula: formulaMatch[3]
      });
    }
  }

  if (sharedMasters.size === 0) return sheetXml;

  return sheetXml.replace(cellRegex, (cell, column, rowText, attrs, body) => {
    const formulaMatch = body.match(/<f\s+([^>]*?\bsi="([^"]+)"[^>]*)>([\s\S]*?)<\/f>|<f\s+([^>]*?\bsi="([^"]+)"[^>]*)\/>/);
    if (!formulaMatch) return cell;

    const sharedId = formulaMatch[2] || formulaMatch[5];
    const master = sharedMasters.get(sharedId);
    if (!master) return cell;

    const formula = formulaMatch[3] || master.formula;
    const expandedFormula = shiftFormulaReferences(
      formula,
      Number(rowText) - master.row,
      columnToNumber(column) - columnToNumber(master.column)
    );
    return `<c r="${column}${rowText}"${attrs}>${body.replace(formulaMatch[0], `<f>${expandedFormula}</f>`)}</c>`;
  });
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

function ensureRemarksStyles(stylesXml: string): { stylesXml: string; style10Id: string; style12Id: string } {
  let updatedStyles = stylesXml;
  const style12Id = '234';

  let font10Index = -1;
  const fontsMatch = updatedStyles.match(/<fonts\s+count="(\d+)"([^>]*)>([\s\S]*?)<\/fonts>/);
  if (fontsMatch) {
    let fontCount = parseInt(fontsMatch[1], 10);
    const fontsAttrs = fontsMatch[2];
    const fontsBody = fontsMatch[3];
    const fontItems = fontsBody.match(/<font[\s\S]*?<\/font>/g) || [];

    for (let i = 0; i < fontItems.length; i++) {
      const f = fontItems[i];
      if (f.includes('val="10"') && f.includes('Bookman')) {
        font10Index = i;
        break;
      }
    }

    if (font10Index === -1) {
      font10Index = fontItems.length;
      const newFont = '<font><sz val="10"/><color rgb="FF000000"/><name val="Bookman Old Style"/><family val="1"/></font>';
      fontCount++;
      updatedStyles = updatedStyles.replace(
        fontsMatch[0],
        `<fonts count="${fontCount}"${fontsAttrs}>${fontsBody}${newFont}</fonts>`
      );
    }
  }

  let style10Id = style12Id;
  const cellXfsMatch = updatedStyles.match(/<cellXfs\s+count="(\d+)"([^>]*)>([\s\S]*?)<\/cellXfs>/);
  if (cellXfsMatch && font10Index !== -1) {
    let xfCount = parseInt(cellXfsMatch[1], 10);
    const xfsAttrs = cellXfsMatch[2];
    const xfsBody = cellXfsMatch[3];
    const xfItems = xfsBody.match(/<xf[\s\S]*?(?:\/>|<\/xf>)/g) || [];

    for (let i = 0; i < xfItems.length; i++) {
      const xf = xfItems[i];
      if (
        xf.includes(`fontId="${font10Index}"`) &&
        xf.includes('borderId="97"') &&
        xf.includes('wrapText="1"')
      ) {
        style10Id = String(i);
        break;
      }
    }

    if (style10Id === style12Id) {
      style10Id = String(xfItems.length);
      const newXf = `<xf numFmtId="3" fontId="${font10Index}" fillId="0" borderId="97" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>`;
      xfCount++;
      updatedStyles = updatedStyles.replace(
        cellXfsMatch[0],
        `<cellXfs count="${xfCount}"${xfsAttrs}>${xfsBody}${newXf}</cellXfs>`
      );
    }
  }

  // Fix style 244 (I44 General Average) alignment
  updatedStyles = updatedStyles.replace(
    /(<xf[^>]*?fontId="54"[^>]*?>\s*<alignment)([^>]*?)(\/>)/g,
    '$1 horizontal="center" vertical="center" wrapText="1"$3'
  );

  // Ensure Q13 style (fontId 63, borderId 45) has wrapText="1"
  updatedStyles = updatedStyles.replace(
    /<xf numFmtId="0" fontId="63" fillId="0" borderId="45" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1" applyProtection="1"><alignment horizontal="center" vertical="center"\/><protection hidden="1"\/><\/xf>/g,
    '<xf numFmtId="0" fontId="63" fillId="0" borderId="45" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1" applyProtection="1"><alignment horizontal="center" vertical="center" wrapText="1"/><protection hidden="1"/></xf>'
  );

  // Sanitize font names
  updatedStyles = updatedStyles.replace(/name val="&apos;Bookman Old Style&apos;"/g, 'name val="Bookman Old Style"');
  updatedStyles = updatedStyles.replace(/name val="&apos;Bookman Old Style"/g, 'name val="Bookman Old Style"');
  updatedStyles = updatedStyles.replace(/name val="&apos;Bookman Old Style&apos;"/g, 'name val="Bookman Old Style"');
  updatedStyles = updatedStyles.replace(/name val="'Bookman Old Style'"/g, 'name val="Bookman Old Style"');
  updatedStyles = updatedStyles.replace(/name val="'Bookman Old Style"/g, 'name val="Bookman Old Style"');
  updatedStyles = updatedStyles.replace(/name val="Bookman Old Style'"/g, 'name val="Bookman Old Style"');

  return { stylesXml: updatedStyles, style10Id, style12Id };
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

export async function populateGrade11AcademicTemplateBuffer(
  templateBuffer: ArrayBuffer | Uint8Array | ArrayLike<number> | Buffer,
  options: SF9Grade11AcademicExportOptions
): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(templateBuffer as Parameters<typeof JSZip.loadAsync>[0]);

  // 1. Remove stale calcChain.xml and its references so Excel dynamically rebuilds calculation dependencies without recovery errors
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

  let academicStyle10Id = '234';
  let academicStyle12Id = '234';
  const stylesFile = zip.file('xl/styles.xml');
  if (stylesFile) {
    const stylesXml = await stylesFile.async('text');
    const res = ensureRemarksStyles(stylesXml);
    academicStyle10Id = res.style10Id;
    academicStyle12Id = res.style12Id;
    zip.file('xl/styles.xml', res.stylesXml);
  }

  // 2. Resolve workbook sheet map and set dynamic activeTab
  const { sheetsByName, sheetList } = await getWorkbookSheetMap(zip);
  const sf9Info = sheetsByName.get('SF9 - GRADE 11 ACADEMIC') || sheetList.find(s => s.name.toUpperCase().includes('SF9'));
  const sf9Index = sheetList.findIndex(s => s.name.toUpperCase().includes('SF9'));
  const activeTabIndex = sf9Index >= 0 ? sf9Index : (zip.file('xl/worksheets/sheet6.xml') ? 5 : 7);

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

  // Force full calculation on load so all formulas evaluate automatically on opening
  const wbFile = zip.file('xl/workbook.xml');
  if (wbFile) {
    let wbXml = await wbFile.async('text');
    if (wbXml.includes('<calcPr')) {
      wbXml = wbXml.replace(/<calcPr([^>]*?)\/>/gi, (_m, p1) => {
        const clean = p1.replace(/\s+fullCalcOnLoad="[^"]*"/gi, '').replace(/\s+forceFullCalc="[^"]*"/gi, '');
        return `<calcPr${clean} fullCalcOnLoad="1" forceFullCalc="1"/>`;
      });
    } else {
      wbXml = wbXml.replace('</workbook>', '<calcPr fullCalcOnLoad="1" forceFullCalc="1"/></workbook>');
    }
    wbXml = wbXml.replace(/<workbookView[^>]*?\/>/gi, `<workbookView activeTab="${activeTabIndex}"/>`);
    zip.file('xl/workbook.xml', wbXml);
  }

  const {
    student,
    schoolProfile,
    schoolYear,
    section,
    adviser,
    principal,
    track,
    grades,
    subjects = [],
    attendance,
    learners = []
  } = options;

  const cleanSchoolName = (schoolProfile?.name || '').trim().toUpperCase();
  const cleanSchoolId = (schoolProfile?.school_id || '').trim();
  const cleanDivision = (schoolProfile?.division || '').trim();
  const cleanRegion = (schoolProfile?.region || '').trim();
  const cleanDistrict = schoolProfile?.district
    ? (schoolProfile.district.toLowerCase().includes('district') ? schoolProfile.district : `${schoolProfile.district} District`)
    : (schoolProfile?.city || schoolProfile?.municipality || '').trim();
  const cleanPrincipal = (principal || schoolProfile?.head_name || '').trim();
  const cleanAdviser = (adviser || '').trim();
  const cleanSection = (section || '').trim();
  const cleanSy = (schoolYear || '').trim();
  const cleanTrack = (track || 'ACADEMIC TRACK').trim().toUpperCase();

  const sectionStudents = (learners.length > 0 ? learners : [student]).map(st => ({
    ...st,
    grades: (st as unknown as StudentWithGrades).grades || (st.lrn === student.lrn ? grades : {}),
    attendance: (st as unknown as { attendance?: { daysPresent?: number[] } }).attendance || (st.lrn === student.lrn ? attendance : undefined)
  }));

  const males = sectionStudents.filter(s => (s.gender || '').toLowerCase() === 'male');
  const females = sectionStudents.filter(s => (s.gender || '').toLowerCase() === 'female');
  const isMale = (student.gender || '').toLowerCase() !== 'female';

  const currentGrades = extractGrade11AcademicSubjectGrades(grades, subjects);

  // Helper to calculate student grades for any student in section
  const getLearnerGrades = (st: Student | undefined) => {
    if (!st) return null;
    if (st.lrn === student.lrn) return currentGrades;
    const studentGradesRecord = (st as unknown as StudentWithGrades)?.grades || {};
    return extractGrade11AcademicSubjectGrades(studentGradesRecord, subjects);
  };

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
  // 1. Sheet 2: INPUT DATA
  // -------------------------------------------------------------------------
  const sheet2File = zip.file(inputSheetPath);
  if (sheet2File) {
    let sheet2Xml = await sheet2File.async('text');

    const inputDataCells: Record<string, string | number> = {
      'F10': cleanRegion,
      'F11': cleanDivision,
      'F12': cleanMuniCity,
      'F13': cleanDistrict,
      'F15': cleanSchoolId,
      'F16': cleanSchoolName,
      'F18': cleanSy,
      'F19': cleanPrincipal,
      'F26': cleanAdviser,
      'F27': 11,
      'F28': cleanTrack,
      'F29': cleanSection,
    };

    const inputStyles: Record<string, string> = {};
    const birthdateFormulas: { cellRef: string; formula: string; serial: number; style?: string }[] = [];

    // Males (1-50): Name in L11:L60, LRN in M11:M60, Birthdate in N11:N60
    // NOTE: Do NOT force styles — preserve the template's native styles (19=name, 224=LRN, 225=birthdate)
    for (let idx = 0; idx < 50; idx++) {
      const r = 11 + idx;
      const m = males[idx];
      inputDataCells[`L${r}`] = m ? formatLearnerName(m) : '';
      inputDataCells[`M${r}`] = m ? (m.lrn || '') : '';
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
          inputDataCells[`N${r}`] = formatDateToMMDDYYYY(m.birthday);
        }
      } else {
        inputDataCells[`N${r}`] = '';
      }
    }

    // Females (1-50): Name in Q11:Q60, LRN in R11:R60, Birthdate in S11:S60
    // NOTE: Do NOT force styles — preserve the template's native styles (19=name, 224=LRN, 225=birthdate)
    // NOTE: Do NOT duplicate LRN to column T — the LRN column for females is R only
    for (let idx = 0; idx < 50; idx++) {
      const r = 11 + idx;
      const f = females[idx];
      inputDataCells[`Q${r}`] = f ? formatLearnerName(f) : '';
      inputDataCells[`R${r}`] = f ? (f.lrn || '') : '';
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
          inputDataCells[`S${r}`] = formatDateToMMDDYYYY(f.birthday);
        }
      } else {
        inputDataCells[`S${r}`] = '';
      }
    }

    sheet2Xml = updateCellsBatch(sheet2Xml, inputDataCells, inputStyles);
    for (const bf of birthdateFormulas) {
      sheet2Xml = updateFormulaCellExplicit(sheet2Xml, bf.cellRef, bf.formula, bf.serial, bf.style);
    }
    zip.file(inputSheetPath, sheet2Xml);
  }

  const calcCombined = (g1: number | '', g2: number | '') => {
    const arr = [g1, g2].filter((n): n is number => typeof n === 'number' && n > 0);
    return arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : '';
  };

  // Precompute term averages across the 6 learning areas (Combined Comm, Math, Sci, LCS, PKLP, AE)
  const termAveragesMap = new Map<number, { males: (number | '')[]; females: (number | '')[] }>();

  for (let termIdx = 0; termIdx < 3; termIdx++) {
    const maleAverages: (number | '')[] = [];
    for (let idx = 0; idx < 50; idx++) {
      const m = males[idx];
      const g = getLearnerGrades(m);
      if (!g) {
        maleAverages.push('');
        continue;
      }
      const ec = g.effectiveComm[termIdx];
      const mk = g.mabisangKom[termIdx];
      const comm = calcCombined(ec, mk);
      const math = g.genMath[termIdx];
      const sci = g.genSci[termIdx];
      const lcs = g.lifeCareer[termIdx];
      const pklpVal = g.pklp[termIdx];
      const aeVal = termIdx === 0 ? g.academicElective1 : termIdx === 1 ? g.academicElective2 : g.academicElective3;
      const scores = [comm, math, sci, lcs, pklpVal, aeVal].filter((v): v is number => typeof v === 'number' && v > 0);
      if (scores.length === 6) {
        maleAverages.push(Math.round(scores.reduce((a, b) => a + b, 0) / 6));
      } else if (scores.length > 0) {
        maleAverages.push(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
      } else {
        maleAverages.push('');
      }
    }

    const femaleAverages: (number | '')[] = [];
    for (let idx = 0; idx < 50; idx++) {
      const f = females[idx];
      const g = getLearnerGrades(f);
      if (!g) {
        femaleAverages.push('');
        continue;
      }
      const ec = g.effectiveComm[termIdx];
      const mk = g.mabisangKom[termIdx];
      const comm = calcCombined(ec, mk);
      const math = g.genMath[termIdx];
      const sci = g.genSci[termIdx];
      const lcs = g.lifeCareer[termIdx];
      const pklpVal = g.pklp[termIdx];
      const aeVal = termIdx === 0 ? g.academicElective1 : termIdx === 1 ? g.academicElective2 : g.academicElective3;
      const scores = [comm, math, sci, lcs, pklpVal, aeVal].filter((v): v is number => typeof v === 'number' && v > 0);
      if (scores.length === 6) {
        femaleAverages.push(Math.round(scores.reduce((a, b) => a + b, 0) / 6));
      } else if (scores.length > 0) {
        femaleAverages.push(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
      } else {
        femaleAverages.push('');
      }
    }

    termAveragesMap.set(termIdx, { males: maleAverages, females: femaleAverages });
  }

  // -------------------------------------------------------------------------
  // 2. Sheets 3, 4, 5: TERM 1, 2, 3 SUMMARY
  // -------------------------------------------------------------------------
  const summaryFiles = [
    { path: term1Path, termIndex: 0 },
    { path: term2Path, termIndex: 1 },
    { path: term3Path, termIndex: 2 }
  ];

  for (const { path: sPath, termIndex } of summaryFiles) {
    const sFile = zip.file(sPath);
    if (!sFile) continue;

    let sXml = await sFile.async('text');

    // Expand template shared formulas before replacing cells within their ranges.
    sXml = expandSharedFormulas(sXml);

    // Clear orphan cells Q6 and R6 (present in Term 2 / Term 3) so school year doesn't appear there
    sXml = updateFormulaCellExplicit(sXml, 'Q6', '', '');
    sXml = updateFormulaCellExplicit(sXml, 'R6', '', '');

    // NOTE: School year is in O6 (merged O6:P6) via formula =IF('INPUT DATA'!F18="","",'INPUT DATA'!F18)
    const formulaResults: Record<string, string | number> = {
      'E5': cleanRegion,
      'J5': cleanDivision,
      'E6': cleanSchoolName,
      'J6': cleanSchoolId,
      'O6': cleanSy,
      'G9': 'Grade 11',
      'N9': cleanSection,
      'M9': cleanSection,
      'G10': cleanTrack,
      'N10': cleanAdviser,
      'M10': cleanAdviser,
    };

    const termCells: Record<string, string | number> = {};

    // Males (Rows 16 to 65: Row 15 is section header "MALE")
    for (let idx = 0; idx < 50; idx++) {
      const r = 16 + idx;
      const m = males[idx];
      const mName = m ? formatLearnerName(m) : '';
      const mSerial = m?.birthday ? birthDateToExcelSerial(m.birthday) : null;
      formulaResults[`C${r}`] = mName;
      formulaResults[`F${r}`] = m ? (m.lrn || '') : '';
      formulaResults[`H${r}`] = mSerial !== null ? mSerial : (m ? formatDateToMMDDYYYY(m.birthday) : '');
      formulaResults[`I${r}`] = m ? parseAge(m.age, m.birthday) : '';
      termCells[`J${r}`] = m ? 'M' : '';

      sXml = updateFormulaCellExplicit(
        sXml,
        `F${r}`,
        `IF('INPUT DATA'!M${11 + idx}="","",'INPUT DATA'!M${11 + idx})`,
        m ? (m.lrn || '') : ''
      );
      sXml = updateFormulaCellExplicit(
        sXml,
        `H${r}`,
        `IF('INPUT DATA'!N${11 + idx}="","",'INPUT DATA'!N${11 + idx})`,
        mSerial !== null ? mSerial : (m ? formatDateToMMDDYYYY(m.birthday) : '')
      );
      sXml = updateFormulaCellExplicit(
        sXml,
        `I${r}`,
        `IF(H${r}="","",DATEDIF(H${r},TODAY(),"Y"))`,
        m ? parseAge(m.age, m.birthday) : ''
      );

      const g = getLearnerGrades(m);
      const ec = g ? g.effectiveComm[termIndex] : '';
      const mk = g ? g.mabisangKom[termIndex] : '';
      const math = g ? g.genMath[termIndex] : '';
      const sci = g ? g.genSci[termIndex] : '';
      const lcs = g ? g.lifeCareer[termIndex] : '';
      const pklpVal = g ? g.pklp[termIndex] : '';
      const aeVal = g
        ? (termIndex === 0 ? g.academicElective1 : termIndex === 1 ? g.academicElective2 : g.academicElective3)
        : '';
      const commCombined = calcCombined(ec, mk);

      termCells[`K${r}`] = typeof commCombined === 'number' && commCombined > 0 ? commCombined : '';
      termCells[`L${r}`] = typeof ec === 'number' && ec > 0 ? ec : '';
      termCells[`M${r}`] = typeof mk === 'number' && mk > 0 ? mk : '';
      termCells[`N${r}`] = typeof math === 'number' && math > 0 ? math : '';
      termCells[`O${r}`] = typeof sci === 'number' && sci > 0 ? sci : '';
      termCells[`P${r}`] = typeof lcs === 'number' && lcs > 0 ? lcs : '';
      termCells[`Q${r}`] = typeof pklpVal === 'number' && pklpVal > 0 ? pklpVal : '';
      termCells[`R${r}`] = typeof aeVal === 'number' && aeVal > 0 ? aeVal : '';
    }

    // Females (Rows 67 to 116: Row 66 is section header "FEMALE")
    for (let idx = 0; idx < 50; idx++) {
      const r = 67 + idx;
      const f = females[idx];
      const fName = f ? formatLearnerName(f) : '';
      const fSerial = f?.birthday ? birthDateToExcelSerial(f.birthday) : null;
      formulaResults[`C${r}`] = fName;
      formulaResults[`F${r}`] = f ? (f.lrn || '') : '';
      formulaResults[`H${r}`] = fSerial !== null ? fSerial : (f ? formatDateToMMDDYYYY(f.birthday) : '');
      formulaResults[`I${r}`] = f ? parseAge(f.age, f.birthday) : '';
      termCells[`J${r}`] = f ? 'F' : '';

      sXml = updateFormulaCellExplicit(
        sXml,
        `F${r}`,
        `IF('INPUT DATA'!R${11 + idx}="","",'INPUT DATA'!R${11 + idx})`,
        f ? (f.lrn || '') : ''
      );
      sXml = updateFormulaCellExplicit(
        sXml,
        `H${r}`,
        `IF('INPUT DATA'!S${11 + idx}="","",'INPUT DATA'!S${11 + idx})`,
        fSerial !== null ? fSerial : (f ? formatDateToMMDDYYYY(f.birthday) : '')
      );
      sXml = updateFormulaCellExplicit(
        sXml,
        `I${r}`,
        `IF(H${r}="","",DATEDIF(H${r},TODAY(),"Y"))`,
        f ? parseAge(f.age, f.birthday) : ''
      );

      const g = getLearnerGrades(f);
      const ec = g ? g.effectiveComm[termIndex] : '';
      const mk = g ? g.mabisangKom[termIndex] : '';
      const math = g ? g.genMath[termIndex] : '';
      const sci = g ? g.genSci[termIndex] : '';
      const lcs = g ? g.lifeCareer[termIndex] : '';
      const pklpVal = g ? g.pklp[termIndex] : '';
      const aeVal = g
        ? (termIndex === 0 ? g.academicElective1 : termIndex === 1 ? g.academicElective2 : g.academicElective3)
        : '';
      const commCombined = calcCombined(ec, mk);

      termCells[`K${r}`] = typeof commCombined === 'number' && commCombined > 0 ? commCombined : '';
      termCells[`L${r}`] = typeof ec === 'number' && ec > 0 ? ec : '';
      termCells[`M${r}`] = typeof mk === 'number' && mk > 0 ? mk : '';
      termCells[`N${r}`] = typeof math === 'number' && math > 0 ? math : '';
      termCells[`O${r}`] = typeof sci === 'number' && sci > 0 ? sci : '';
      termCells[`P${r}`] = typeof lcs === 'number' && lcs > 0 ? lcs : '';
      termCells[`Q${r}`] = typeof pklpVal === 'number' && pklpVal > 0 ? pklpVal : '';
      termCells[`R${r}`] = typeof aeVal === 'number' && aeVal > 0 ? aeVal : '';
    }

    sXml = updateFormulaValuesBatch(sXml, formulaResults);
    sXml = updateCellsBatch(sXml, termCells);
    zip.file(sPath, sXml);
  }

  // -------------------------------------------------------------------------
  // 3. Sheet 6: FINAL GRADES (optional, only in legacy 8-sheet templates)
  // -------------------------------------------------------------------------
  if (finalGradesPath && finalGradesPath !== sf9SheetPath) {
    const sheet6File = zip.file(finalGradesPath);
    if (sheet6File) {
      let sheet6Xml = await sheet6File.async('text');

      const s6FormulaResults: Record<string, string | number> = {
        'E6': cleanRegion,
        'L6': cleanDivision,
        'E7': cleanSchoolName,
        'L7': cleanSchoolId,
        'R7': cleanSy,
        'H10': 'Grade 11',
        'H11': cleanSection || cleanTrack,
        'P10': cleanAdviser,
        'O10': cleanAdviser,
      };

      // Replace hardcoded "EUNICE FERNANDEZ" in sheet6Xml with cleanAdviser
      sheet6Xml = sheet6Xml.replace(/EUNICE FERNANDEZ/g, cleanAdviser);

      const t1Avgs = termAveragesMap.get(0) || { males: [], females: [] };
      const t2Avgs = termAveragesMap.get(1) || { males: [], females: [] };
      const t3Avgs = termAveragesMap.get(2) || { males: [], females: [] };

      // Calculate final general average across terms for all males
      const maleGenAvgs: (number | '')[] = [];
      for (let idx = 0; idx < 50; idx++) {
        const t1 = t1Avgs.males[idx];
        const t2 = t2Avgs.males[idx];
        const t3 = t3Avgs.males[idx];
        const arr = [t1, t2, t3].filter((v): v is number => typeof v === 'number' && v > 0);
        if (arr.length === 3) {
          maleGenAvgs.push(Math.round(arr.reduce((a, b) => a + b, 0) / 3));
        } else if (arr.length > 0) {
          maleGenAvgs.push(Math.round(arr.reduce((a, b) => a + b, 0) / arr.length));
        } else {
          maleGenAvgs.push('');
        }
      }

      // Calculate final general average across terms for all females
      const femaleGenAvgs: (number | '')[] = [];
      for (let idx = 0; idx < 50; idx++) {
        const t1 = t1Avgs.females[idx];
        const t2 = t2Avgs.females[idx];
        const t3 = t3Avgs.females[idx];
        const arr = [t1, t2, t3].filter((v): v is number => typeof v === 'number' && v > 0);
        if (arr.length === 3) {
          femaleGenAvgs.push(Math.round(arr.reduce((a, b) => a + b, 0) / 3));
        } else if (arr.length > 0) {
          femaleGenAvgs.push(Math.round(arr.reduce((a, b) => a + b, 0) / arr.length));
        } else {
          femaleGenAvgs.push('');
        }
      }

      const allValidGenAvgs = [...maleGenAvgs, ...femaleGenAvgs].filter((v): v is number => typeof v === 'number' && v > 0);
      const getGenRank = (score: number | '') => {
        if (typeof score !== 'number' || score <= 0) return '';
        const strictlyGreater = allValidGenAvgs.filter(s => s > score).length;
        const equalCount = allValidGenAvgs.filter(s => s === score).length;
        return strictlyGreater + (equalCount + 1) / 2;
      };

      for (let idx = 0; idx < 50; idx++) {
        const r = 15 + idx;
        const m = males[idx];
        const t1 = t1Avgs.males[idx];
        const t2 = t2Avgs.males[idx];
        const t3 = t3Avgs.males[idx];
        const finalGA = maleGenAvgs[idx];
        s6FormulaResults[`C${r}`] = m ? formatLearnerName(m) : '';
        s6FormulaResults[`F${r}`] = t1 !== '' ? t1 : '';
        s6FormulaResults[`J${r}`] = t2 !== '' ? t2 : '';
        s6FormulaResults[`M${r}`] = t3 !== '' ? t3 : '';
        s6FormulaResults[`P${r}`] = finalGA !== '' ? finalGA : '';
        s6FormulaResults[`S${r}`] = finalGA !== '' ? getGenRank(finalGA) : '';

        sheet6Xml = updateFormulaCellExplicit(
          sheet6Xml,
          `F${r}`,
          `IF(TRIM(C${r})="","",IFERROR(_xlfn.XLOOKUP(TRIM(C${r}),'TERM 1 SUMMARY'!$C$15:$C$115,'TERM 1 SUMMARY'!$R$15:$R$115),""))`,
          t1 !== '' ? t1 : ''
        );
        sheet6Xml = updateFormulaCellExplicit(
          sheet6Xml,
          `J${r}`,
          `IF(TRIM(C${r})="","",IFERROR(_xlfn.XLOOKUP(TRIM(C${r}),'TERM 2 SUMMARY'!$C$15:$C$115,'TERM 2 SUMMARY'!$R$15:$R$115),""))`,
          t2 !== '' ? t2 : ''
        );
        sheet6Xml = updateFormulaCellExplicit(
          sheet6Xml,
          `M${r}`,
          `IF(TRIM(C${r})="","",IFERROR(_xlfn.XLOOKUP(TRIM(C${r}),'TERM 3 SUMMARY'!$C$15:$C$115,'TERM 3 SUMMARY'!$R$15:$R$115),""))`,
          t3 !== '' ? t3 : ''
        );
        sheet6Xml = updateFormulaCellExplicit(
          sheet6Xml,
          `P${r}`,
          `IF(C${r}="","",IF(COUNT(F${r},J${r},M${r})=0,"",ROUND(AVERAGE(F${r},J${r},M${r}),0)))`,
          finalGA !== '' ? finalGA : ''
        );
        sheet6Xml = updateFormulaCellExplicit(
          sheet6Xml,
          `S${r}`,
          `IF(P${r}="","",_xlfn.RANK.AVG(P${r},$P$15:$P$115))`,
          finalGA !== '' ? getGenRank(finalGA) : ''
        );
      }

      for (let idx = 0; idx < 50; idx++) {
        const r = 66 + idx;
        const f = females[idx];
        const t1 = t1Avgs.females[idx];
        const t2 = t2Avgs.females[idx];
        const t3 = t3Avgs.females[idx];
        const finalGA = femaleGenAvgs[idx];
        s6FormulaResults[`C${r}`] = f ? formatLearnerName(f) : '';
        s6FormulaResults[`F${r}`] = t1 !== '' ? t1 : '';
        s6FormulaResults[`J${r}`] = t2 !== '' ? t2 : '';
        s6FormulaResults[`M${r}`] = t3 !== '' ? t3 : '';
        s6FormulaResults[`P${r}`] = finalGA !== '' ? finalGA : '';
        s6FormulaResults[`S${r}`] = finalGA !== '' ? getGenRank(finalGA) : '';

        sheet6Xml = updateFormulaCellExplicit(
          sheet6Xml,
          `F${r}`,
          `IF(TRIM(C${r})="","",IFERROR(_xlfn.XLOOKUP(TRIM(C${r}),'TERM 1 SUMMARY'!$C$15:$C$115,'TERM 1 SUMMARY'!$R$15:$R$115),""))`,
          t1 !== '' ? t1 : ''
        );
        sheet6Xml = updateFormulaCellExplicit(
          sheet6Xml,
          `J${r}`,
          `IF(TRIM(C${r})="","",IFERROR(_xlfn.XLOOKUP(TRIM(C${r}),'TERM 2 SUMMARY'!$C$15:$C$115,'TERM 2 SUMMARY'!$R$15:$R$115),""))`,
          t2 !== '' ? t2 : ''
        );
        sheet6Xml = updateFormulaCellExplicit(
          sheet6Xml,
          `M${r}`,
          `IF(TRIM(C${r})="","",IFERROR(_xlfn.XLOOKUP(TRIM(C${r}),'TERM 3 SUMMARY'!$C$15:$C$115,'TERM 3 SUMMARY'!$R$15:$R$115),""))`,
          t3 !== '' ? t3 : ''
        );
        sheet6Xml = updateFormulaCellExplicit(
          sheet6Xml,
          `P${r}`,
          `IF(C${r}="","",IF(COUNT(F${r},J${r},M${r})=0,"",ROUND(AVERAGE(F${r},J${r},M${r}),0)))`,
          finalGA !== '' ? finalGA : ''
        );
        sheet6Xml = updateFormulaCellExplicit(
          sheet6Xml,
          `S${r}`,
          `IF(P${r}="","",_xlfn.RANK.AVG(P${r},$P$15:$P$115))`,
          finalGA !== '' ? getGenRank(finalGA) : ''
        );
      }

      sheet6Xml = updateFormulaValuesBatch(sheet6Xml, s6FormulaResults);
      zip.file(finalGradesPath, sheet6Xml);
    }
  }

  // -------------------------------------------------------------------------
  // 4. Sheet 7: ATTENDANCE RECORD SUMMARY
  // -------------------------------------------------------------------------
  const sheet7File = zip.file(attPath);
  if (sheet7File) {
    let sheet7Xml = await sheet7File.async('text');

    const attFormulaResults: Record<string, string | number> = {
      'E5': cleanRegion,
      'I5': cleanDivision,
      'E7': cleanSchoolName,
      'I7': cleanSchoolId,
      'M7': cleanSy,
      'G10': 'Grade 11',
      'L10': cleanAdviser,
      'G11': cleanSection || cleanTrack,
    };

    const attCells: Record<string, string | number> = {};
    const monthCols = ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P']; // Jun to Apr (11 months)

    // Populate Row 117: Total Number of School Days in Sheet 7 (Row 13 is section header "MALE")
    const cleanAttSchoolDays = (attendance?.schoolDays || []).slice(0, 11);
    if (cleanAttSchoolDays.length > 0) {
      cleanAttSchoolDays.forEach((sd, idx) => {
        if (idx < monthCols.length && sd !== undefined && sd !== null && Number(sd) > 0) {
          attCells[`${monthCols[idx]}117`] = Number(sd);
        }
      });
      const totalSchoolDays = cleanAttSchoolDays.reduce((a, b) => a + (Number(b) || 0), 0);
      attFormulaResults['E117'] = totalSchoolDays > 0 ? totalSchoolDays : '';
    }

    // Clear template placeholder numbers and set names
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
        const rawDp = (m.lrn === student.lrn && attendance?.daysPresent && attendance.daysPresent.length > 0)
          ? attendance.daysPresent
          : (studentAtt?.daysPresent || []);
        const dpList = rawDp.slice(0, 11);
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
        const rawDp = (f.lrn === student.lrn && attendance?.daysPresent && attendance.daysPresent.length > 0)
          ? attendance.daysPresent
          : (studentAtt?.daysPresent || []);
        const dpList = rawDp.slice(0, 11);
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
  // 5. SF9 - GRADE 11 ACADEMIC
  // -------------------------------------------------------------------------
  const sf9File = zip.file(sf9SheetPath);
  if (sf9File) {
    let sf9Xml = await sf9File.async('text');

    const isModernLayout = sf9Xml.includes('r="L33"') || sf9SheetPath.includes('sheet6') || zip.file('xl/drawings/drawing6.xml') !== null;

    // Replace school profile cells with valid values / formulas
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B7', "'INPUT DATA'!F10", cleanRegion);
    const divisionDisplay = cleanDivision ? `SCHOOLS DIVISION OF ${cleanDivision}` : 'SCHOOLS DIVISION OF _____';
    sf9Xml = updateFormulaCellExplicit(
      sf9Xml, 
      'B8', 
      "IF('INPUT DATA'!F11=\"\",\"SCHOOLS DIVISION OF _____\",\"SCHOOLS DIVISION OF \" & 'INPUT DATA'!F11)", 
      divisionDisplay
    );
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B9', "'INPUT DATA'!F13", cleanDistrict);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B10', "'INPUT DATA'!F15", cleanSchoolId);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B12', "'INPUT DATA'!F16", cleanSchoolName);
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B15', `School Year ${cleanSy}`);
    sf9Xml = updateCellInSheetXml(sf9Xml, 'A12', '');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'A15', '');

    sf9Xml = updateCellInSheetXml(sf9Xml, 'C17', formatLearnerName(student));
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'C18', "IF(C17=\"\",\"\",VLOOKUP(C17,'TERM 1 SUMMARY'!C16:R116,4,0))", student.lrn || '');
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I17', "IF(C17=\"\",\"\",VLOOKUP(C17,'TERM 1 SUMMARY'!C16:R116,7,0))", parseAge(student.age, student.birthday));
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K17', "IF(C17=\"\",\"\",VLOOKUP(C17,'TERM 1 SUMMARY'!C16:R116,8,0))", isMale ? 'M' : 'F');
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I18', "IF('INPUT DATA'!F27=\"\",\"\",'INPUT DATA'!F27)", 11);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K18', "IF('INPUT DATA'!F29=\"\",\"\",'INPUT DATA'!F29)", cleanSection);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'E19', "IF('INPUT DATA'!F28=\"\",\"\",'INPUT DATA'!F28)", cleanTrack);
    sf9Xml = updateCellInSheetXml(sf9Xml, 'A27', '');
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B27', "IF('INPUT DATA'!F19=\"\",\"\",'INPUT DATA'!F19)", cleanPrincipal);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'H27', "IF('INPUT DATA'!F26=\"\",\"\",'INPUT DATA'!F26)", cleanAdviser);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'X39', "IF('INPUT DATA'!F26=\"\",\"\",'INPUT DATA'!F26)", cleanAdviser);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'Q41', "IF('INPUT DATA'!F19=\"\",\"\",'INPUT DATA'!F19)", cleanPrincipal);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J50', "IF('INPUT DATA'!F19=\"\",\"\",'INPUT DATA'!F19)", cleanPrincipal);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'Q50', "IF('INPUT DATA'!F19=\"\",\"\",'INPUT DATA'!F19)", cleanPrincipal);

    const calcFinal = (t1: number | '', t2: number | '', t3: number | '') => {
      const arr = [t1, t2, t3].filter((n): n is number => typeof n === 'number' && n > 0);
      return arr.length === 3 ? Math.round(arr.reduce((a, b) => a + b, 0) / 3) : '';
    };

    const calcCombined = (g1: number | '', g2: number | '') => {
      const arr = [g1, g2].filter((n): n is number => typeof n === 'number' && n > 0);
      return arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : '';
    };

    const ecFinal = calcFinal(currentGrades.effectiveComm[0], currentGrades.effectiveComm[1], currentGrades.effectiveComm[2]);
    const mkFinal = calcFinal(currentGrades.mabisangKom[0], currentGrades.mabisangKom[1], currentGrades.mabisangKom[2]);
    const mathFinal = calcFinal(currentGrades.genMath[0], currentGrades.genMath[1], currentGrades.genMath[2]);
    const sciFinal = calcFinal(currentGrades.genSci[0], currentGrades.genSci[1], currentGrades.genSci[2]);
    const lcsFinal = calcFinal(currentGrades.lifeCareer[0], currentGrades.lifeCareer[1], currentGrades.lifeCareer[2]);
    const pklpFinal = calcFinal(currentGrades.pklp[0], currentGrades.pklp[1], currentGrades.pklp[2]);

    const numOrEmpty = (v: number | '') => (typeof v === 'number' && !isNaN(v) && v > 0 ? v : '');
    const getRemarks = (v: number | '') => (typeof v === 'number' && v > 0 ? (v >= 75 ? 'Passed' : 'Failed') : '');

    const commT1 = calcCombined(currentGrades.effectiveComm[0], currentGrades.mabisangKom[0]);
    const commT2 = calcCombined(currentGrades.effectiveComm[1], currentGrades.mabisangKom[1]);
    const commT3 = calcCombined(currentGrades.effectiveComm[2], currentGrades.mabisangKom[2]);
    const commFinal = (ecFinal !== '' && mkFinal !== '') ? Math.round((ecFinal + mkFinal) / 2) : '';

    const ae1Final = numOrEmpty(currentGrades.academicElective1);
    const ae2Final = numOrEmpty(currentGrades.academicElective2);
    const ae3Final = numOrEmpty(currentGrades.academicElective3);

    // Static elective subject display names
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B41', currentGrades.ae1Name || 'Academic Elective 1');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B42', currentGrades.ae2Name || 'Academic Elective 2');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B43', currentGrades.ae3Name || 'Academic Elective 3');
    // Fix typo in cell B39: Kasaysayan instead of Kasanayan
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B39', 'Pag-aaral ng Kasaysayan at Lipunang Pilipino');

    const getGenAvgRemarks = (avg: number | '' | string, learningAreas: (number | string)[]) => {
      if (typeof avg !== 'number' || avg <= 0) return '';
      if (avg >= 75) {
        const validGrades = learningAreas.filter((g): g is number => typeof g === 'number' && g > 0);
        const hasBelow85 = validGrades.some(g => g < 85);
        if (avg >= 90 && validGrades.length > 0 && !hasBelow85) {
          return 'Promoted with Academic Excellence Award';
        }
        return 'Promoted';
      }
      return 'Retained';
    };

    if (isModernLayout) {
      // Modern DepEd Layout (8-sheet with HELPER):
      // - Columns F, G, H: Term 1, Term 2, Term 3
      // - Column I: Units (6 for core, 3 for electives, 39 total in row 44)
      // - Column J: Final Grade (Row 33 combined, Rows 36-39 core, Rows 41-43 electives, Row 44 Gen Avg)
      // - Column K: Remarks ("Passed" / "Failed" / "Promoted with Academic Excellence Award")
      // - Column L: Weighted Points (J * I guarded against #VALUE!)

      // Term Grades in Columns F, G, H with accurate VLOOKUPs to TERM 1, 2, 3 SUMMARY
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'F33', "IF('TERM 1 SUMMARY'!K16=\"\",\"\",IFERROR(IF(VLOOKUP(C17,'TERM 1 SUMMARY'!C16:R116,9,0)=0,\"\",VLOOKUP(C17,'TERM 1 SUMMARY'!C16:R116,9,0)),\"\"))", commT1);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'G33', "IF('TERM 2 SUMMARY'!K16=\"\",\"\",IFERROR(IF(VLOOKUP(C17,'TERM 2 SUMMARY'!C16:R116,9,0)=0,\"\",VLOOKUP(C17,'TERM 2 SUMMARY'!C16:R116,9,0)),\"\"))", commT2);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'H33', "IF('TERM 3 SUMMARY'!K16=\"\",\"\",IFERROR(IF(VLOOKUP(C17,'TERM 3 SUMMARY'!C16:R116,9,0)=0,\"\",VLOOKUP(C17,'TERM 3 SUMMARY'!C16:R116,9,0)),\"\"))", commT3);

      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'F34', "IF('TERM 1 SUMMARY'!K16=\"\",\"\",IFERROR(IF(VLOOKUP(C17,'TERM 1 SUMMARY'!C16:R116,10,0)=0,\"\",VLOOKUP(C17,'TERM 1 SUMMARY'!C16:R116,10,0)),\"\"))", numOrEmpty(currentGrades.effectiveComm[0]));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'G34', "IF('TERM 2 SUMMARY'!K16=\"\",\"\",IFERROR(IF(VLOOKUP(C17,'TERM 2 SUMMARY'!C16:R116,10,0)=0,\"\",VLOOKUP(C17,'TERM 2 SUMMARY'!C16:R116,10,0)),\"\"))", numOrEmpty(currentGrades.effectiveComm[1]));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'H34', "IF('TERM 3 SUMMARY'!K16=\"\",\"\",IFERROR(IF(VLOOKUP(C17,'TERM 3 SUMMARY'!C16:R116,10,0)=0,\"\",VLOOKUP(C17,'TERM 3 SUMMARY'!C16:R116,10,0)),\"\"))", numOrEmpty(currentGrades.effectiveComm[2]));

      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'F35', "IF('TERM 1 SUMMARY'!K16=\"\",\"\",IFERROR(IF(VLOOKUP(C17,'TERM 1 SUMMARY'!C16:R116,11,0)=0,\"\",VLOOKUP(C17,'TERM 1 SUMMARY'!C16:R116,11,0)),\"\"))", numOrEmpty(currentGrades.mabisangKom[0]));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'G35', "IF('TERM 2 SUMMARY'!K16=\"\",\"\",IFERROR(IF(VLOOKUP(C17,'TERM 2 SUMMARY'!C16:R116,11,0)=0,\"\",VLOOKUP(C17,'TERM 2 SUMMARY'!C16:R116,11,0)),\"\"))", numOrEmpty(currentGrades.mabisangKom[1]));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'H35', "IF('TERM 3 SUMMARY'!K16=\"\",\"\",IFERROR(IF(VLOOKUP(C17,'TERM 3 SUMMARY'!C16:R116,11,0)=0,\"\",VLOOKUP(C17,'TERM 3 SUMMARY'!C16:R116,11,0)),\"\"))", numOrEmpty(currentGrades.mabisangKom[2]));

      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'F36', numOrEmpty(currentGrades.genMath[0]));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'G36', numOrEmpty(currentGrades.genMath[1]));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'H36', numOrEmpty(currentGrades.genMath[2]));

      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'F37', numOrEmpty(currentGrades.genSci[0]));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'G37', numOrEmpty(currentGrades.genSci[1]));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'H37', numOrEmpty(currentGrades.genSci[2]));

      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'F38', numOrEmpty(currentGrades.lifeCareer[0]));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'G38', numOrEmpty(currentGrades.lifeCareer[1]));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'H38', numOrEmpty(currentGrades.lifeCareer[2]));

      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'F39', numOrEmpty(currentGrades.pklp[0]));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'G39', numOrEmpty(currentGrades.pklp[1]));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'H39', numOrEmpty(currentGrades.pklp[2]));

      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'F41', ae1Final);
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'G42', ae2Final);
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'H43', ae3Final);

      // Final Grades (Column J)
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J33', 'IF(COUNT(F33:H33)<3, "", ROUND((F33+H33+G33)*(I33/3)/I33,0))', commFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J36', 'IF(COUNT(F36:H36)<3, "", ROUND((F36+H36+G36)*(I36/3)/I36,0))', mathFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J37', 'IF(COUNT(F37:H37)<3, "", ROUND((F37+H37+G37)*(I37/3)/I37,0))', sciFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J38', 'IF(COUNT(F38:H38)<3, "", ROUND((F38+H38+G38)*(I38/3)/I38,0))', lcsFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J39', 'IF(COUNT(F39:H39)<3, "", ROUND((F39+H39+G39)*(I39/3)/I39,0))', pklpFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J41', 'IF(F41="", "", ROUND((F41+H41+G41)*I41/I41,0))', ae1Final);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J42', 'IF(G42="", "", ROUND((F42+H42+G42)*I42/I42,0))', ae2Final);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J43', 'IF(H43="", "", ROUND((F43+H43+G43)*I43/I43,0))', ae3Final);

      // Remarks (Column K)
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K33', 'IF(J33="", "", IF(J33>=75, "Passed", "Failed"))', getRemarks(commFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K36', 'IF(J36="", "", IF(J36>=75, "Passed", "Failed"))', getRemarks(mathFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K37', 'IF(J37="", "", IF(J37>=75, "Passed", "Failed"))', getRemarks(sciFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K38', 'IF(J38="", "", IF(J38>=75, "Passed", "Failed"))', getRemarks(lcsFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K39', 'IF(J39="", "", IF(J39>=75, "Passed", "Failed"))', getRemarks(pklpFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K41', 'IF(J41="", "", IF(J41>=75, "Passed", "Failed"))', getRemarks(ae1Final));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K42', 'IF(J42="", "", IF(J42>=75, "Passed", "Failed"))', getRemarks(ae2Final));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K43', 'IF(J43="", "", IF(J43>=75, "Passed", "Failed"))', getRemarks(ae3Final));

      // Weighted Points (Column L = J * I) - safely guarded against empty strings to eliminate #VALUE!
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L33', 'IF(J33="","",J33*I33)', commFinal !== '' ? commFinal * 6 : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L36', 'IF(J36="","",J36*I36)', mathFinal !== '' ? mathFinal * 6 : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L37', 'IF(J37="","",J37*I37)', sciFinal !== '' ? sciFinal * 6 : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L38', 'IF(J38="","",J38*I38)', lcsFinal !== '' ? lcsFinal * 6 : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L39', 'IF(J39="","",J39*I39)', pklpFinal !== '' ? pklpFinal * 6 : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L41', 'IF(J41="","",J41*I41)', ae1Final !== '' ? ae1Final * 3 : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L42', 'IF(J42="","",J42*I42)', ae2Final !== '' ? ae2Final * 3 : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L43', 'IF(J43="","",J43*I43)', ae3Final !== '' ? ae3Final * 3 : '');

      // General Average (Row 44 across all 8 learning areas weighted by units)
      const modernLearningAreas = [commFinal, mathFinal, sciFinal, lcsFinal, pklpFinal, ae1Final, ae2Final, ae3Final];
      const validPoints = [
        commFinal !== '' ? commFinal * 6 : null,
        mathFinal !== '' ? mathFinal * 6 : null,
        sciFinal !== '' ? sciFinal * 6 : null,
        lcsFinal !== '' ? lcsFinal * 6 : null,
        pklpFinal !== '' ? pklpFinal * 6 : null,
        ae1Final !== '' ? ae1Final * 3 : null,
        ae2Final !== '' ? ae2Final * 3 : null,
        ae3Final !== '' ? ae3Final * 3 : null,
      ].filter((p): p is number => p !== null && p > 0);
      const totalWeightedPoints = validPoints.length === 8 ? validPoints.reduce((a, b) => a + b, 0) : '';
      const modernGenAvg = totalWeightedPoints !== '' ? Math.round(totalWeightedPoints / 39) : '';
      const modernGenAvgRemarks = getGenAvgRemarks(modernGenAvg, modernLearningAreas);
      const k44Style = modernGenAvgRemarks.includes('Academic Excellence') ? academicStyle10Id : academicStyle12Id;

      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I44', 'SUM(I33:I39,I41:I43)', 39);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L44', 'SUM(L33:L43)', totalWeightedPoints !== '' ? totalWeightedPoints : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J44', 'IF(COUNT(J33,J36:J39,J41:J43)<8,"",ROUND(L44/I44,0))', modernGenAvg !== '' ? modernGenAvg : '');
      sf9Xml = updateFormulaCellExplicit(
        sf9Xml,
        'K44',
        'IF(J44="","",IF(J44>=75,IF(AND(J44>=90,MIN(J33,J36:J39,J41:J43)>=85),"Promoted with Academic Excellence Award","Promoted"),"Retained"))',
        modernGenAvgRemarks,
        k44Style
      );
      sf9Xml = sf9Xml.replace(
        /(<row\s+r="44"[^>]*?\s+ht=")[^"]*(")/,
        '$136$2'
      );

      // Attendance in SF9
      const sf9MonthCols = ['R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB']; // Jun to Apr (11 columns)
      const attMonthCols = ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P']; // Jun to Apr in ATTENDANCE RECORD SUMMARY
      const cleanSchoolDays = (attendance?.schoolDays || []).slice(0, 11);
      const cleanDaysPresent = (attendance?.daysPresent || []).slice(0, 11);
      const cleanDaysAbsent = (attendance?.daysAbsent || []).slice(0, 11);

      if (cleanSchoolDays.length > 0) {
        sf9MonthCols.forEach((col, idx) => {
          const sd = cleanSchoolDays[idx];
          const val = (sd !== undefined && sd !== null && Number(sd) > 0) ? Number(sd) : '';
          sf9Xml = updateFormulaCellExplicit(
            sf9Xml,
            `${col}5`,
            `'ATTENDANCE RECORD SUMMARY'!${attMonthCols[idx]}117`,
            val
          );
        });
        const totalClassDays = cleanSchoolDays.reduce((a, b) => a + (Number(b) || 0), 0);
        sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC5', 'SUM(R5:AB6)', totalClassDays > 0 ? totalClassDays : '');
      } else {
        sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC5', 'SUM(R5:AB6)', '');
      }

      sf9MonthCols.forEach((col, idx) => {
        const vlookupCol = 4 + idx;
        const formula = `IF('ATTENDANCE RECORD SUMMARY'!F14="","",IFERROR(VLOOKUP(C17,'ATTENDANCE RECORD SUMMARY'!$C$14:$P$114,${vlookupCol},0),""))`;
        const cachedVal = (cleanDaysPresent[idx] !== undefined && cleanDaysPresent[idx] !== null && cleanDaysPresent[idx] !== ('' as unknown as number))
          ? Number(cleanDaysPresent[idx])
          : '';
        sf9Xml = updateFormulaCellExplicit(sf9Xml, `${col}7`, formula, cachedVal);
      });
      const totalPresent = cleanDaysPresent.length > 0
        ? cleanDaysPresent.reduce((a, b) => a + (Number(b) || 0), 0)
        : '';
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC7', 'SUM(R7:AB8)', (totalPresent !== '' && totalPresent > 0) ? totalPresent : (totalPresent === 0 ? 0 : ''));

      sf9MonthCols.forEach((col, idx) => {
        const classDays = cleanSchoolDays[idx] ? Number(cleanSchoolDays[idx]) : 0;
        const dpVal = (cleanDaysPresent[idx] !== undefined && cleanDaysPresent[idx] !== null && cleanDaysPresent[idx] !== ('' as unknown as number))
          ? Number(cleanDaysPresent[idx])
          : null;
        const cachedAbsent = (dpVal !== null && classDays > 0)
          ? Math.max(0, classDays - dpVal)
          : '';
        sf9Xml = updateFormulaCellExplicit(sf9Xml, `${col}9`, `IF(${col}7="","",ABS(${col}5-${col}7))`, cachedAbsent);
      });
      const totalSchoolDaysNum = cleanSchoolDays.length > 0
        ? cleanSchoolDays.reduce((a, b) => a + (Number(b) || 0), 0)
        : 0;
      const totalAbsent = cleanDaysAbsent.length > 0
        ? cleanDaysAbsent.reduce((a, b) => a + (Number(b) || 0), 0)
        : (totalSchoolDaysNum > 0 && typeof totalPresent === 'number' ? Math.max(0, totalSchoolDaysNum - totalPresent) : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC9', 'ABS(AC5-AC7)', totalAbsent !== '' ? totalAbsent : '');
    } else {
      // Legacy Layout (where Final Grade is in Column I and Remarks in Column J)
      const s8LearningAreas: (number | '')[] = [
        commFinal, mathFinal, sciFinal, lcsFinal, pklpFinal,
        ae1Final, ae2Final, ae3Final
      ];
      const validS8LearningAreas = s8LearningAreas.filter((n): n is number => typeof n === 'number' && n > 0);
      const s8GenAvg = validS8LearningAreas.length > 0 ? Math.round(validS8LearningAreas.reduce((a, b) => a + b, 0) / validS8LearningAreas.length) : '';

      const s8FormulaResults: Record<string, string | number> = {
        'F34': numOrEmpty(currentGrades.effectiveComm[0]),
        'G34': numOrEmpty(currentGrades.effectiveComm[1]),
        'H34': numOrEmpty(currentGrades.effectiveComm[2]),

        'F35': numOrEmpty(currentGrades.mabisangKom[0]),
        'G35': numOrEmpty(currentGrades.mabisangKom[1]),
        'H35': numOrEmpty(currentGrades.mabisangKom[2]),

        'F36': numOrEmpty(currentGrades.genMath[0]),
        'G36': numOrEmpty(currentGrades.genMath[1]),
        'H36': numOrEmpty(currentGrades.genMath[2]),

        'F37': numOrEmpty(currentGrades.genSci[0]),
        'G37': numOrEmpty(currentGrades.genSci[1]),
        'H37': numOrEmpty(currentGrades.genSci[2]),

        'F38': numOrEmpty(currentGrades.lifeCareer[0]),
        'G38': numOrEmpty(currentGrades.lifeCareer[1]),
        'H38': numOrEmpty(currentGrades.lifeCareer[2]),

        'F39': numOrEmpty(currentGrades.pklp[0]),
        'G39': numOrEmpty(currentGrades.pklp[1]),
        'H39': numOrEmpty(currentGrades.pklp[2]),

        'F41': numOrEmpty(currentGrades.academicElective1),
        'G42': numOrEmpty(currentGrades.academicElective2),
        'H43': numOrEmpty(currentGrades.academicElective3),
      };

      // Parent Subject: Effective Communication / Mabisang Komunikasyon (Row 33)
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'F33', 'IF(COUNT(F34:F35)=0,"",ROUND(AVERAGE(F34:F35),0))', commT1);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'G33', 'IF(COUNT(G34:G35)=0,"",ROUND(AVERAGE(G34:G35),0))', commT2);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'H33', 'IF(COUNT(H34:H35)=0,"",ROUND(AVERAGE(H34:H35),0))', commT3);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I33', 'IF(COUNT(I34:I35)=0,"",ROUND(AVERAGE(I34:I35),0))', commFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J33', 'IF(I33="","",IF(I33>=75,"Passed","Failed"))', getRemarks(commFinal));

      // Core Component & Subject Final Grade formulas (Column I, Rows 34-39)
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I34', 'IF(COUNT(F34:H34)=0,"",ROUND(AVERAGE(F34:H34),0))', ecFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I35', 'IF(COUNT(F35:H35)=0,"",ROUND(AVERAGE(F35:H35),0))', mkFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I36', 'IF(COUNT(F36:H36)=0,"",ROUND(AVERAGE(F36:H36),0))', mathFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I37', 'IF(COUNT(F37:H37)=0,"",ROUND(AVERAGE(F37:H37),0))', sciFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I38', 'IF(COUNT(F38:H38)=0,"",ROUND(AVERAGE(F38:H38),0))', lcsFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I39', 'IF(COUNT(F39:H39)=0,"",ROUND(AVERAGE(F39:H39),0))', pklpFinal);

      // Elective Final Grade formulas (Rows 41-43)
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I41', 'IF(F41="","",F41)', ae1Final);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I42', 'IF(G42="","",G42)', ae2Final);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I43', 'IF(H43="","",H43)', ae3Final);

      // General Average formula
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I44', 'IF(COUNT(I33,I36:I39,I41:I43)=0,"",ROUND(AVERAGE(I33,I36:I39,I41:I43),0))', s8GenAvg);

      // Remarks formulas (Column J)
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J34', 'IF(I34="","",IF(I34>=75,"Passed","Failed"))', getRemarks(ecFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J35', 'IF(I35="","",IF(I35>=75,"Passed","Failed"))', getRemarks(mkFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J36', 'IF(I36="","",IF(I36>=75,"Passed","Failed"))', getRemarks(mathFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J37', 'IF(I37="","",IF(I37>=75,"Passed","Failed"))', getRemarks(sciFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J38', 'IF(I38="","",IF(I38>=75,"Passed","Failed"))', getRemarks(lcsFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J39', 'IF(I39="","",IF(I39>=75,"Passed","Failed"))', getRemarks(pklpFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J41', 'IF(I41="","",IF(I41>=75,"Passed","Failed"))', getRemarks(ae1Final));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J42', 'IF(I42="","",IF(I42>=75,"Passed","Failed"))', getRemarks(ae2Final));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J43', 'IF(I43="","",IF(I43>=75,"Passed","Failed"))', getRemarks(ae3Final));

      const genAvgRemarks = getGenAvgRemarks(s8GenAvg, s8LearningAreas);
      const j44Style = genAvgRemarks.includes('Academic Excellence') ? academicStyle10Id : academicStyle12Id;

      sf9Xml = updateFormulaCellExplicit(
        sf9Xml,
        'J44',
        'IF(I44="","",IF(I44>=75,IF(AND(I44>=90,MIN(I33,I36:I39,I41:I43)>=85),"Promoted with Academic Excellence Award","Promoted"),"Retained"))',
        genAvgRemarks,
        j44Style
      );
      sf9Xml = updateCellInSheetXml(sf9Xml, 'K44', '', j44Style);

      sf9Xml = sf9Xml.replace(
        /(<row\s+r="44"[^>]*?\s+ht=")[^"]*(")/,
        '$136$2'
      );

      // Attendance on legacy Sheet 8
      const sf9MonthCols = ['R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB'];
      const cleanSchoolDays = (attendance?.schoolDays || []).slice(0, 11);
      const cleanDaysPresent = (attendance?.daysPresent || []).slice(0, 11);
      const cleanDaysAbsent = (attendance?.daysAbsent || []).slice(0, 11);

      if (cleanSchoolDays.length > 0) {
        sf9MonthCols.forEach((col, idx) => {
          const sd = cleanSchoolDays[idx];
          if (sd !== undefined && sd !== null && Number(sd) > 0) {
            sf9Xml = updateCellInSheetXml(sf9Xml, `${col}5`, Number(sd));
          }
        });
        const totalClassDays = cleanSchoolDays.reduce((a, b) => a + (Number(b) || 0), 0);
        sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC5', 'SUM(R5:AB5)', totalClassDays > 0 ? totalClassDays : '');
      } else {
        sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC5', 'SUM(R5:AB5)', '');
      }

      sf9MonthCols.forEach((col, idx) => {
        const vlookupCol = 4 + idx;
        const formula = `IF('ATTENDANCE RECORD SUMMARY'!F14="","",IFERROR(VLOOKUP(C17,'ATTENDANCE RECORD SUMMARY'!$C$14:$P$114,${vlookupCol},0),""))`;
        const cachedVal = (cleanDaysPresent[idx] !== undefined && cleanDaysPresent[idx] !== null && cleanDaysPresent[idx] !== ('' as unknown as number))
          ? Number(cleanDaysPresent[idx])
          : '';
        sf9Xml = updateFormulaCellExplicit(sf9Xml, `${col}7`, formula, cachedVal);
      });
      const totalPresent = cleanDaysPresent.length > 0
        ? cleanDaysPresent.reduce((a, b) => a + (Number(b) || 0), 0)
        : '';
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC7', 'SUM(R7:AB7)', (totalPresent !== '' && totalPresent > 0) ? totalPresent : (totalPresent === 0 ? 0 : ''));

      sf9MonthCols.forEach((col, idx) => {
        const formula = `IF(OR(${col}5="",${col}7=""),"",IF(${col}5>=${col}7,${col}5-${col}7,0))`;
        const classDays = cleanSchoolDays[idx] ? Number(cleanSchoolDays[idx]) : 0;
        const dpVal = (cleanDaysPresent[idx] !== undefined && cleanDaysPresent[idx] !== null && cleanDaysPresent[idx] !== ('' as unknown as number))
          ? Number(cleanDaysPresent[idx])
          : null;
        const cachedAbsent = (dpVal !== null && classDays > 0)
          ? Math.max(0, classDays - dpVal)
          : '';
        sf9Xml = updateFormulaCellExplicit(sf9Xml, `${col}9`, formula, cachedAbsent);
      });
      const totalSchoolDaysNum = cleanSchoolDays.length > 0
        ? cleanSchoolDays.reduce((a, b) => a + (Number(b) || 0), 0)
        : 0;
      const totalAbsent = cleanDaysAbsent.length > 0
        ? cleanDaysAbsent.reduce((a, b) => a + (Number(b) || 0), 0)
        : (totalSchoolDaysNum > 0 && typeof totalPresent === 'number' ? Math.max(0, totalSchoolDaysNum - totalPresent) : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC9', 'SUM(R9:AB9)', totalAbsent !== '' ? totalAbsent : '');

      sf9Xml = updateFormulaValuesBatch(sf9Xml, s8FormulaResults);
    }

    zip.file(sf9SheetPath, sf9Xml);
  }

  // 6. Dynamic drawing resolution for school logo
  let sf9DrawingPath = 'xl/drawings/drawing6.xml';
  let sf9DrawingRelsPath = 'xl/drawings/_rels/drawing6.xml.rels';

  const sf9RelPath = `xl/worksheets/_rels/${sf9SheetPath.split('/').pop()}.rels`;
  const sf9RelsFile = zip.file(sf9RelPath);
  if (sf9RelsFile) {
    const relsText = await sf9RelsFile.async('text');
    const drawMatch = relsText.match(/Type="[^"]*drawing"[^>]*?Target="([^"]+)"/i) ||
                      relsText.match(/Target="([^"]+)"[^>]*?Type="[^"]*drawing"/i);
    if (drawMatch) {
      let target = drawMatch[1].replace(/^\.\.\//, 'xl/');
      if (!target.startsWith('xl/')) target = `xl/${target}`;
      sf9DrawingPath = target;
      const dFileName = target.split('/').pop();
      sf9DrawingRelsPath = `xl/drawings/_rels/${dFileName}.rels`;
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

/**
 * Export the complete Grade 11 Academic Section Master SF9 Workbook containing all learners
 */
export async function exportSF9Grade11AcademicSectionMasterToExcel(
  opts: SF9Grade11AcademicExportOptions,
  sectionName: string,
  schoolYear: string
): Promise<void> {
  const buffer = await fetchGrade11AcademicTemplateBuffer();
  const outBuffer = await populateGrade11AcademicTemplateBuffer(buffer, opts);

  const blob = new Blob([outBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const safeSection = sectionName.replace(/[^a-z0-9]/gi, '_');
  a.download = `SF9_G11_ACADEMIC_${safeSection}_${schoolYear}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
