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

function parseAge(val: unknown, birthday?: string): number | '' {
  if (val !== undefined && val !== null && (val as unknown) !== '') {
    const num = Number(val);
    if (!isNaN(num) && num > 0) return num;
  }
  if (birthday) {
    const birthDate = new Date(birthday);
    if (!isNaN(birthDate.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
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
      normName.includes('elective1') ||
      normName.includes('chemistry1') ||
      normName.includes('genchem1') ||
      normName.includes('precalculus')
    );
  });

  const ae2Info = getSubjectInfo((_name, _code, normName) => {
    return (
      normName === 'academicelective2' ||
      normName === 'ae2' ||
      normName.includes('elective2') ||
      normName.includes('chemistry2') ||
      normName.includes('genchem2') ||
      normName.includes('basiccalculus')
    );
  });

  const ae3Info = getSubjectInfo((_name, _code, normName) => {
    return (
      normName === 'academicelective3' ||
      normName === 'ae3' ||
      normName.includes('elective3') ||
      normName.includes('chemistry3') ||
      normName.includes('genchem3') ||
      normName.includes('generalphysics')
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
    const sub = subjectsList.find(s => s.id === key || (s.subject_name || '').toLowerCase() === key.toLowerCase());
    return sub ? (sub.subject_name || key) : key;
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
    const sName = (s.subject_name || (s as unknown as { name?: string }).name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
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
  value: string | number,
  forceStyle?: string
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
      const styleId = forceStyle || (styleMatch ? styleMatch[1] : '');
      const styleAttr = styleId ? ` s="${styleId}"` : '';
      return `<c r="${cellRef}"${styleAttr}${typeAttr}>${fTag}${vTag}</c>`;
    });
  }

  const fullCellRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)>((?:(?!<c[\\s>]|<\\/row>|<row[\\s>])([\\s\\S]))*?)<\\/c>`);
  if (fullCellRegex.test(sheetXml)) {
    return sheetXml.replace(fullCellRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleId = forceStyle || (styleMatch ? styleMatch[1] : '');
      const styleAttr = styleId ? ` s="${styleId}"` : '';
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
  styles?: Record<string, string>
): string {
  let xml = sheetXml;
  for (const [cellRef, val] of Object.entries(cells)) {
    const style = styles ? styles[cellRef] : undefined;
    xml = updateCellInSheetXml(xml, cellRef, val, style);
  }
  return xml;
}

function ensureRemarksStyles(stylesXml: string): { stylesXml: string; style10Id: string; style12Id: string } {
  let updatedStyles = stylesXml;
  const style12Id = '557';

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

  let style10Id = '557';
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

    if (style10Id === '557') {
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

  let academicStyle10Id = '557';
  let academicStyle12Id = '557';
  const stylesFile = zip.file('xl/styles.xml');
  if (stylesFile) {
    const stylesXml = await stylesFile.async('text');
    const res = ensureRemarksStyles(stylesXml);
    academicStyle10Id = res.style10Id;
    academicStyle12Id = res.style12Id;
    zip.file('xl/styles.xml', res.stylesXml);
  }

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
  // 1. Sheet 2: INPUT DATA (xl/worksheets/sheet2.xml)
  // -------------------------------------------------------------------------
  const sheet2File = zip.file('xl/worksheets/sheet2.xml');
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

    // Males (1-50): Name in L11:L60, LRN in M11:M60, Birthdate in N11:N60
    for (let idx = 0; idx < 50; idx++) {
      const r = 11 + idx;
      const m = males[idx];
      inputDataCells[`L${r}`] = m ? formatLearnerName(m) : '';
      inputDataCells[`M${r}`] = m ? (m.lrn || '') : '';
      inputDataCells[`N${r}`] = m ? formatDateToMMDDYYYY(m.birthday) : '';
      inputStyles[`L${r}`] = '25';
      inputStyles[`M${r}`] = '26';
      inputStyles[`N${r}`] = '27';
    }

    // Females (1-50): Name in Q11:Q60, LRN in R11:R60, Birthdate in S11:S60
    for (let idx = 0; idx < 50; idx++) {
      const r = 11 + idx;
      const f = females[idx];
      inputDataCells[`Q${r}`] = f ? formatLearnerName(f) : '';
      inputDataCells[`R${r}`] = f ? (f.lrn || '') : '';
      inputDataCells[`S${r}`] = f ? formatDateToMMDDYYYY(f.birthday) : '';
      inputStyles[`Q${r}`] = '25';
      inputStyles[`R${r}`] = '26';
      inputStyles[`S${r}`] = '27';
    }

    sheet2Xml = updateCellsBatch(sheet2Xml, inputDataCells, inputStyles);
    zip.file('xl/worksheets/sheet2.xml', sheet2Xml);
  }

  // Precompute term averages and rank for all students across terms 1, 2, 3
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
      const math = g.genMath[termIdx];
      const sci = g.genSci[termIdx];
      const lcs = g.lifeCareer[termIdx];
      const pklpVal = g.pklp[termIdx];
      const aeVal = termIdx === 0 ? g.academicElective1 : termIdx === 1 ? g.academicElective2 : g.academicElective3;
      const scores = [ec, mk, math, sci, lcs, pklpVal, aeVal].filter((v): v is number => typeof v === 'number' && v > 0);
      if (scores.length === 7) {
        maleAverages.push(Math.round(scores.reduce((a, b) => a + b, 0) / 7));
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
      const math = g.genMath[termIdx];
      const sci = g.genSci[termIdx];
      const lcs = g.lifeCareer[termIdx];
      const pklpVal = g.pklp[termIdx];
      const aeVal = termIdx === 0 ? g.academicElective1 : termIdx === 1 ? g.academicElective2 : g.academicElective3;
      const scores = [ec, mk, math, sci, lcs, pklpVal, aeVal].filter((v): v is number => typeof v === 'number' && v > 0);
      if (scores.length === 7) {
        femaleAverages.push(Math.round(scores.reduce((a, b) => a + b, 0) / 7));
      } else if (scores.length > 0) {
        femaleAverages.push(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
      } else {
        femaleAverages.push('');
      }
    }

    termAveragesMap.set(termIdx, { males: maleAverages, females: femaleAverages });
  }

  // -------------------------------------------------------------------------
  // 2. Sheets 3, 4, 5: TERM 1, 2, 3 SUMMARY (sheet3.xml, sheet4.xml, sheet5.xml)
  // -------------------------------------------------------------------------
  const summaryFiles = [
    { file: 'sheet3.xml', termIndex: 0 },
    { file: 'sheet4.xml', termIndex: 1 },
    { file: 'sheet5.xml', termIndex: 2 }
  ];

  for (const { file, termIndex } of summaryFiles) {
    const sFile = zip.file(`xl/worksheets/${file}`);
    if (!sFile) continue;

    let sXml = await sFile.async('text');

    // Ensure summary formula dynamically averages only graded subjects (averages non-blank cells instead of hardcoded division by 7)
    sXml = sXml.replace(
      /ROUND\(\([A-Z0-9+]+?\)\/7,0\)/g,
      (match) => {
        const rowMatch = match.match(/[A-Z](\d+)/);
        if (rowMatch) {
          const r = rowMatch[1];
          return `ROUND(AVERAGE(K${r}:Q${r}),0)`;
        }
        return match;
      }
    );

    // Adjust column 17 width and row 13 height so Q13 ("AE 1") fits and wraps nicely
    sXml = sXml.replace(
      /<col min="16" max="17" width="9.44140625" style="232" customWidth="1"\/>/g,
      '<col min="16" max="16" width="9.44140625" style="232" customWidth="1"/><col min="17" max="17" width="13.5" style="232" customWidth="1"/>'
    );
    sXml = sXml.replace(
      /(<row\s+r="13"[^>]*?\s+ht=")[^"]*(")/,
      '$128.5$2'
    );

    const formulaResults: Record<string, string | number> = {
      'E5': cleanRegion,
      'J5': cleanDivision,
      'E6': cleanSchoolName,
      'J6': cleanSchoolId,
      'Q6': cleanSy,
      'P6': cleanSy,
      'G9': 'Grade 11',
      'N9': cleanSection,
      'M9': cleanSection,
      'G10': cleanTrack,
      'N10': cleanAdviser,
      'M10': cleanAdviser,
    };

    const termCells: Record<string, string | number> = {
      'Q13': 'AE 1',
    };
    const termAvgs = termAveragesMap.get(termIndex)!;

    // Collect all valid scores to calculate ranking across both males and females
    const allNumericScores: number[] = [
      ...termAvgs.males.filter((v): v is number => typeof v === 'number' && v > 0),
      ...termAvgs.females.filter((v): v is number => typeof v === 'number' && v > 0)
    ].sort((a, b) => b - a);

    const getRank = (avg: number | '') => {
      if (typeof avg !== 'number' || avg <= 0) return '';
      const matching = allNumericScores.filter(s => s === avg);
      const higherCount = allNumericScores.filter(s => s > avg).length;
      return higherCount + 1 + (matching.length - 1) / 2;
    };

    // Males (Rows 15 to 64)
    for (let idx = 0; idx < 50; idx++) {
      const r = 15 + idx;
      const m = males[idx];
      const mName = m ? formatLearnerName(m) : '';
      formulaResults[`C${r}`] = mName;
      formulaResults[`F${r}`] = m ? (m.lrn || '') : '';
      formulaResults[`H${r}`] = m ? formatDateToMMDDYYYY(m.birthday) : '';
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
        m ? formatDateToMMDDYYYY(m.birthday) : ''
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

      termCells[`K${r}`] = typeof ec === 'number' && ec > 0 ? ec : '';
      termCells[`L${r}`] = typeof mk === 'number' && mk > 0 ? mk : '';
      termCells[`M${r}`] = typeof math === 'number' && math > 0 ? math : '';
      termCells[`N${r}`] = typeof sci === 'number' && sci > 0 ? sci : '';
      termCells[`O${r}`] = typeof lcs === 'number' && lcs > 0 ? lcs : '';
      termCells[`P${r}`] = typeof pklpVal === 'number' && pklpVal > 0 ? pklpVal : '';
      termCells[`Q${r}`] = typeof aeVal === 'number' && aeVal > 0 ? aeVal : '';

      const studentAvg = termAvgs.males[idx];
      formulaResults[`R${r}`] = studentAvg !== '' ? studentAvg : '';
      formulaResults[`S${r}`] = studentAvg !== '' ? getRank(studentAvg) : '';
    }

    // Females (Rows 66 to 115)
    for (let idx = 0; idx < 50; idx++) {
      const r = 66 + idx;
      const f = females[idx];
      const fName = f ? formatLearnerName(f) : '';
      formulaResults[`C${r}`] = fName;
      formulaResults[`F${r}`] = f ? (f.lrn || '') : '';
      formulaResults[`H${r}`] = f ? formatDateToMMDDYYYY(f.birthday) : '';
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
        f ? formatDateToMMDDYYYY(f.birthday) : ''
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

      termCells[`K${r}`] = typeof ec === 'number' && ec > 0 ? ec : '';
      termCells[`L${r}`] = typeof mk === 'number' && mk > 0 ? mk : '';
      termCells[`M${r}`] = typeof math === 'number' && math > 0 ? math : '';
      termCells[`N${r}`] = typeof sci === 'number' && sci > 0 ? sci : '';
      termCells[`O${r}`] = typeof lcs === 'number' && lcs > 0 ? lcs : '';
      termCells[`P${r}`] = typeof pklpVal === 'number' && pklpVal > 0 ? pklpVal : '';
      termCells[`Q${r}`] = typeof aeVal === 'number' && aeVal > 0 ? aeVal : '';

      const studentAvg = termAvgs.females[idx];
      formulaResults[`R${r}`] = studentAvg !== '' ? studentAvg : '';
      formulaResults[`S${r}`] = studentAvg !== '' ? getRank(studentAvg) : '';
    }

    sXml = updateFormulaValuesBatch(sXml, formulaResults);
    sXml = updateCellsBatch(sXml, termCells);
    zip.file(`xl/worksheets/${file}`, sXml);
  }

  // -------------------------------------------------------------------------
  // 3. Sheet 6: FINAL GRADES (xl/worksheets/sheet6.xml)
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
      'H10': 'Grade 11',
      'H11': cleanSection || cleanTrack,
      'P10': cleanAdviser,
      'O10': cleanAdviser,
    };

    // Replace hardcoded "EUNICE FERNANDEZ" in sheet6Xml with cleanAdviser
    sheet6Xml = updateCellInSheetXml(sheet6Xml, 'O10', cleanAdviser);
    sheet6Xml = updateCellInSheetXml(sheet6Xml, 'P10', cleanAdviser);

    const t1Avgs = termAveragesMap.get(0)!;
    const t2Avgs = termAveragesMap.get(1)!;
    const t3Avgs = termAveragesMap.get(2)!;

    // Calculate General Averages for ranking across all 3 terms
    const maleGenAvgs: (number | '')[] = [];
    for (let idx = 0; idx < 50; idx++) {
      const terms = [t1Avgs.males[idx], t2Avgs.males[idx], t3Avgs.males[idx]].filter(
        (v): v is number => typeof v === 'number' && v > 0
      );
      maleGenAvgs.push(terms.length > 0 ? Math.round(terms.reduce((a, b) => a + b, 0) / terms.length) : '');
    }

    const femaleGenAvgs: (number | '')[] = [];
    for (let idx = 0; idx < 50; idx++) {
      const terms = [t1Avgs.females[idx], t2Avgs.females[idx], t3Avgs.females[idx]].filter(
        (v): v is number => typeof v === 'number' && v > 0
      );
      femaleGenAvgs.push(terms.length > 0 ? Math.round(terms.reduce((a, b) => a + b, 0) / terms.length) : '');
    }

    const allGenScores: number[] = [
      ...maleGenAvgs.filter((v): v is number => typeof v === 'number' && v > 0),
      ...femaleGenAvgs.filter((v): v is number => typeof v === 'number' && v > 0)
    ].sort((a, b) => b - a);

    const getGenRank = (avg: number | '') => {
      if (typeof avg !== 'number' || avg <= 0) return '';
      const matching = allGenScores.filter(s => s === avg);
      const higherCount = allGenScores.filter(s => s > avg).length;
      return higherCount + 1 + (matching.length - 1) / 2;
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
    zip.file('xl/worksheets/sheet6.xml', sheet6Xml);
  }

  // -------------------------------------------------------------------------
  // 4. Sheet 7: ATTENDANCE RECORD SUMMARY (xl/worksheets/sheet7.xml)
  // -------------------------------------------------------------------------
  const sheet7File = zip.file('xl/worksheets/sheet7.xml');
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

    // Populate Row 13: School Days in Sheet 7
    if (attendance?.schoolDays && attendance.schoolDays.length > 0) {
      attendance.schoolDays.forEach((sd, idx) => {
        if (idx < monthCols.length && sd !== undefined && sd !== null && sd > 0) {
          attCells[`${monthCols[idx]}13`] = Number(sd);
        }
      });
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
  // 5. Sheet 8: SF9 - GRADE 11 ACADEMIC (xl/worksheets/sheet8.xml)
  // -------------------------------------------------------------------------
  const sheet8File = zip.file('xl/worksheets/sheet8.xml');
  if (sheet8File) {
    let sheet8Xml = await sheet8File.async('text');

    // Replace #REF! cells with valid formulas and values
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B7', "'INPUT DATA'!F10", cleanRegion);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B8', "'INPUT DATA'!F11", cleanDivision);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B9', "'INPUT DATA'!F13", cleanDistrict);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B10', "'INPUT DATA'!F15", cleanSchoolId);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B12', "'INPUT DATA'!F16", cleanSchoolName);
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'B15', `School Year ${cleanSy}`);
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'A12', '');
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'A15', '');
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'K18', "'TERM 1 SUMMARY'!N9", cleanSection);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'E19', "'INPUT DATA'!F28", cleanTrack);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'A27', '', '');
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'A27', '');
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B27', "'INPUT DATA'!F19", cleanPrincipal);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'H27', "'INPUT DATA'!F26", cleanAdviser);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'X39', "'INPUT DATA'!F26", cleanAdviser);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'Q41', "'INPUT DATA'!F19", cleanPrincipal);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'J50', "'INPUT DATA'!F19", cleanPrincipal);

    const calcFinal = (t1: number | '', t2: number | '', t3: number | '') => {
      const arr = [t1, t2, t3].filter((n): n is number => typeof n === 'number' && n > 0);
      return arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : '';
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

    const commT1 = calcCombined(currentGrades.effectiveComm[0], currentGrades.mabisangKom[0]);
    const commT2 = calcCombined(currentGrades.effectiveComm[1], currentGrades.mabisangKom[1]);
    const commT3 = calcCombined(currentGrades.effectiveComm[2], currentGrades.mabisangKom[2]);
    const commFinal = calcCombined(ecFinal, mkFinal);

    const ae1Final = numOrEmpty(currentGrades.academicElective1);
    const ae2Final = numOrEmpty(currentGrades.academicElective2);
    const ae3Final = numOrEmpty(currentGrades.academicElective3);

    // 8 Learning Areas for General Average calculation under DepEd guidelines:
    // 1. Effective Communication / Mabisang Komunikasyon (Row 33)
    // 2. General Mathematics (Row 36)
    // 3. General Science (Row 37)
    // 4. Life and Career Skills (Row 38)
    // 5. PKLP (Row 39)
    // 6. Academic Elective 1 (Row 41)
    // 7. Academic Elective 2 (Row 42)
    // 8. Academic Elective 3 (Row 43)
    const s8LearningAreas: (number | '')[] = [
      commFinal, mathFinal, sciFinal, lcsFinal, pklpFinal,
      ae1Final, ae2Final, ae3Final
    ];
    const validS8LearningAreas = s8LearningAreas.filter((n): n is number => typeof n === 'number' && n > 0);
    const s8GenAvg = validS8LearningAreas.length > 0 ? Math.round(validS8LearningAreas.reduce((a, b) => a + b, 0) / validS8LearningAreas.length) : '';

    const s8FormulaResults: Record<string, string | number> = {
      'B7': cleanRegion,
      'B8': cleanDivision,
      'B9': cleanDistrict,
      'B10': cleanSchoolId,
      'I17': parseAge(student.age),
      'K17': isMale ? 'M' : 'F',
      'C18': student.lrn || '',
      'I18': 11,
      'K18': cleanSection,
      'E19': cleanTrack,
      'B27': cleanPrincipal,
      'H27': cleanAdviser,
      'X39': cleanAdviser,
      'Q41': cleanPrincipal,
      'Q50': cleanPrincipal,

      // Pre-evaluated learning area grades on Report Card (Columns F=T1, G=T2, H=T3)
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

    // Remarks helper
    const getRemarks = (v: number | '') => (typeof v === 'number' && v > 0 ? (v >= 75 ? 'Passed' : 'Failed') : '');

    // Parent Subject: Effective Communication / Mabisang Komunikasyon (Row 33)
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'F33', 'IF(COUNT(F34:F35)=0,"",ROUND(AVERAGE(F34:F35),0))', commT1);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'G33', 'IF(COUNT(G34:G35)=0,"",ROUND(AVERAGE(G34:G35),0))', commT2);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'H33', 'IF(COUNT(H34:H35)=0,"",ROUND(AVERAGE(H34:H35),0))', commT3);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'I33', 'IF(COUNT(I34:I35)=0,"",ROUND(AVERAGE(I34:I35),0))', commFinal);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'J33', 'IF(I33="","",IF(I33>=75,"Passed","Failed"))', getRemarks(commFinal));

    // Core Component & Subject Final Grade formulas (Column I, Rows 34-39)
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'I34', 'IF(COUNT(F34:H34)=0,"",ROUND(AVERAGE(F34:H34),0))', ecFinal);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'I35', 'IF(COUNT(F35:H35)=0,"",ROUND(AVERAGE(F35:H35),0))', mkFinal);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'I36', 'IF(COUNT(F36:H36)=0,"",ROUND(AVERAGE(F36:H36),0))', mathFinal);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'I37', 'IF(COUNT(F37:H37)=0,"",ROUND(AVERAGE(F37:H37),0))', sciFinal);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'I38', 'IF(COUNT(F38:H38)=0,"",ROUND(AVERAGE(F38:H38),0))', lcsFinal);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'I39', 'IF(COUNT(F39:H39)=0,"",ROUND(AVERAGE(F39:H39),0))', pklpFinal);

    // Elective Final Grade formulas (Rows 41-43)
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'I41', 'IF(F41="","",F41)', ae1Final);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'I42', 'IF(G42="","",G42)', ae2Final);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'I43', 'IF(H43="","",H43)', ae3Final);

    // General Average formula (Row 44, across the 8 learning areas: I33, I36, I37, I38, I39, I41, I42, I43)
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'I44', 'IF(COUNT(I33,I36:I39,I41:I43)=0,"",ROUND(AVERAGE(I33,I36:I39,I41:I43),0))', s8GenAvg);

    // Remarks formulas (Column J, Rows 34-39, 41-44)
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'J34', 'IF(I34="","",IF(I34>=75,"Passed","Failed"))', getRemarks(ecFinal));
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'J35', 'IF(I35="","",IF(I35>=75,"Passed","Failed"))', getRemarks(mkFinal));
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'J36', 'IF(I36="","",IF(I36>=75,"Passed","Failed"))', getRemarks(mathFinal));
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'J37', 'IF(I37="","",IF(I37>=75,"Passed","Failed"))', getRemarks(sciFinal));
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'J38', 'IF(I38="","",IF(I38>=75,"Passed","Failed"))', getRemarks(lcsFinal));
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'J39', 'IF(I39="","",IF(I39>=75,"Passed","Failed"))', getRemarks(pklpFinal));
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'J41', 'IF(I41="","",IF(I41>=75,"Passed","Failed"))', getRemarks(ae1Final), '569');
    sheet8Xml = sheet8Xml.replace(/(<c\s+r="K41"[^>]*?\s+s=")(\d+)(")/, '$1569$3');
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'J42', 'IF(I42="","",IF(I42>=75,"Passed","Failed"))', getRemarks(ae2Final));
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'J43', 'IF(I43="","",IF(I43>=75,"Passed","Failed"))', getRemarks(ae3Final));

    // General Average Final Remarks (Row 44: Promoted with Academic Excellence Award / Promoted / Retained per DO 15, s. 2026)
    const getGenAvgRemarks = (avg: number | '', learningAreas: (number | '')[]) => {
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

    const genAvgRemarks = getGenAvgRemarks(s8GenAvg, s8LearningAreas);
    const j44Style = genAvgRemarks.includes('Academic Excellence') ? academicStyle10Id : academicStyle12Id;

    sheet8Xml = updateFormulaCellExplicit(
      sheet8Xml,
      'J44',
      'IF(I44="","",IF(I44>=75,IF(AND(I44>=90,MIN(I33,I36:I39,I41:I43)>=85),"Promoted with Academic Excellence Award","Promoted"),"Retained"))',
      genAvgRemarks,
      j44Style
    );
    // Update merged companion cell K44 style as well
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'K44', '', j44Style);

    // Set row 44 height to 36 so wrapped text fits comfortably and borders are never clipped
    sheet8Xml = sheet8Xml.replace(
      /(<row\s+r="44"[^>]*?\s+ht=")[^"]*(")/,
      '$136$2'
    );

    const s8StaticCells: Record<string, string | number> = {
      'C17': formatLearnerName(student),
      'B41': currentGrades.ae1Name || 'Academic Elective 1',
      'B42': currentGrades.ae2Name || 'Academic Elective 2',
      'B43': currentGrades.ae3Name || 'Academic Elective 3',
    };

    // Attendance row mapping on Sheet 8
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
      const vlookupCol = 4 + idx; // Column 4 is F (Jun), Column 14 is P (Apr/Total)
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

    sheet8Xml = updateFormulaValuesBatch(sheet8Xml, s8FormulaResults);
    sheet8Xml = updateCellsBatch(sheet8Xml, s8StaticCells);

    zip.file('xl/worksheets/sheet8.xml', sheet8Xml);
  }

  // 5. Replace placeholder Shape 4 with School Logo if available
  await injectSchoolLogoIntoDrawing(
    zip,
    'xl/drawings/drawing8.xml',
    'xl/drawings/_rels/drawing8.xml.rels',
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
