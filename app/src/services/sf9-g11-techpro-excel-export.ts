/**
 * SF9 Grade 11 Technical-Professional (Tech-Pro) Excel Export Service
 * Populates the official DepEd Grade 11 Tech-Pro SF9 template
 * (G11 TechPro School Form 9 (SY 26-27).xlsx)
 * preserving all 8 worksheets, OpenXML styles, formulas, drawing relationships,
 * and calculations for Core subjects + Tech-Pro Elective across Term 1, 2, and 3.
 */

import JSZip from 'jszip';
import type { Student, SchoolProfile, Subject } from '../types';
import { formatLearnerName } from '../utils/student-name';
import { parseBirthDateParts, birthDateToExcelSerial } from './sf9-g11-academic-excel-export';

export interface SF9Grade11TechProExportOptions {
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
  id?: string;
  grades?: Record<string, { q1?: number | string; q2?: number | string; q3?: number | string; final?: number | string }>;
  attendance?: {
    months?: string[];
    schoolDays?: number[];
    daysPresent?: (number | string)[];
    daysAbsent?: (number | string)[];
  };
}

export function isGrade11TechPro(gradeLevel: string | undefined | null, track?: string | undefined | null): boolean {
  if (!gradeLevel) return false;
  const s = gradeLevel.trim().toLowerCase();

  // Must be Grade 11 (exclude Grade 12, 1, 2, 3, etc.)
  const isG11 = /\b(?:grade\s*11|g11|11)\b/i.test(s) && !/\b(?:grade\s*12|g12|12)\b/i.test(s);
  if (!isG11) return false;

  if (!track) return false;
  const t = track.trim().toLowerCase();
  return (
    t.includes('tech') ||
    t.includes('tvet') ||
    t.includes('pro') ||
    t.includes('tvl') ||
    t.includes('vocational')
  );
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

export async function fetchGrade11TechProTemplateBuffer(): Promise<ArrayBuffer> {
  const cleanBase = (import.meta.env.BASE_URL || '/').endsWith('/')
    ? (import.meta.env.BASE_URL || '/')
    : `${import.meta.env.BASE_URL}/`;
  const timestamp = Date.now();

  const candidateUrls = [
    `${cleanBase}templates/G11 TechPro School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `/templates/G11 TechPro School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `templates/G11 TechPro School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `${cleanBase}templates/G11%20TechPro%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
    `/templates/G11%20TechPro%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
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

  throw new Error('Official DepEd Grade 11 TechPro School Form 9 template not found in public/templates.');
}

function getGradeFromEntry(entry: unknown, quarterIndex: number): number | '' {
  if (entry === undefined || entry === null) return '';
  if (Array.isArray(entry)) {
    const val = entry[quarterIndex];
    if (val === undefined || val === null || val === '') return '';
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return !isNaN(num) && num > 0 ? num : '';
  }
  if (typeof entry === 'object') {
    const obj = entry as Record<string, unknown>;
    const qKey = `q${quarterIndex + 1}`;
    const termKey = `t${quarterIndex + 1}`;
    const quarterKey = `quarter${quarterIndex + 1}`;
    const fullTermKey = `term${quarterIndex + 1}`;
    const numKey = String(quarterIndex + 1);
    const ordinals = ['first', 'second', 'third', 'fourth'];
    const ordKey = ordinals[quarterIndex];

    const val =
      obj[qKey] ??
      obj[termKey] ??
      obj[quarterKey] ??
      obj[fullTermKey] ??
      obj[numKey] ??
      (ordKey ? obj[ordKey] : undefined) ??
      (ordKey ? obj[`${ordKey}Term`] : undefined) ??
      (ordKey ? obj[`${ordKey}Quarter`] : undefined) ??
      (quarterIndex === 0 ? (obj['final'] ?? obj['final_grade'] ?? obj['finalGrade'] ?? obj['grade'] ?? obj['score']) : undefined);

    if (val === undefined || val === null || val === '') return '';
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return !isNaN(num) && num > 0 ? num : '';
  }
  if (quarterIndex === 0) {
    const num = typeof entry === 'number' ? entry : parseFloat(String(entry));
    return !isNaN(num) && num > 0 ? num : '';
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

/**
 * Extracts scores and names for Grade 11 Tech-Pro:
 * 6 Core Subjects:
 *   1. Effective Communication
 *   2. Mabisang Komunikasyon
 *   3. General Mathematics
 *   4. General Science
 *   5. Life and Career Skills
 *   6. Pag-aaral ng Kasaysayan at Lipunang Pilipino (PKLP)
 * 1 Tech-Pro Elective:
 *   1. TechPro Elective 1 (320-hour specialization across Terms 1, 2, and 3)
 */
export function extractGrade11TechProSubjectGrades(
  gradesRecord: Record<string, unknown> = {},
  subjectsList: Subject[] = []
): {
  effectiveComm: (number | string)[];
  mabisangKom: (number | string)[];
  genMath: (number | string)[];
  genSci: (number | string)[];
  lifeCareer: (number | string)[];
  pklp: (number | string)[];
  techProElective1: (number | string)[];
  elective1Name: string;
} {
  const matchedCoreKeys = new Set<string>();

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
        matchedCoreKeys.add(key);
        if (subObj?.id) matchedCoreKeys.add(subObj.id);
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
          matchedCoreKeys.add(subObj.id);
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
      normName.includes('effectivecommunication') ||
      normName.includes('effectivecomm') ||
      normName === 'effectivecom' ||
      code === 'ec' ||
      normName.includes('oralcommunication') ||
      normName.includes('english')
    );
  });

  // 2. Mabisang Komunikasyon
  const mabisangKomInfo = getSubjectInfo((_name, code, normName) => {
    return (
      normName.includes('mabisangkomunikasyon') ||
      normName.includes('mabisangkom') ||
      normName.includes('mabiskom') ||
      code === 'mk' ||
      normName.includes('komunikasyon') ||
      normName.includes('filipino')
    );
  });

  // 3. General Mathematics
  const genMathInfo = getSubjectInfo((_name, code, normName) => {
    return (
      normName.includes('generalmathematics') ||
      normName.includes('genmath') ||
      normName === 'mathematics' ||
      normName === 'math' ||
      code === 'gm'
    );
  });

  // 4. General Science
  const genSciInfo = getSubjectInfo((_name, code, normName) => {
    return (
      normName.includes('generalscience') ||
      normName.includes('gensci') ||
      normName === 'science' ||
      normName.includes('earthandspace') ||
      code === 'gs'
    );
  });

  // 5. Life and Career Skills
  const lifeCareerInfo = getSubjectInfo((_name, code, normName) => {
    return (
      normName.includes('lifeandcareerskills') ||
      normName.includes('lifeandcareer') ||
      normName.includes('lifecareer') ||
      normName.includes('careerskills') ||
      code === 'lcs' ||
      code === 'ls'
    );
  });

  // 6. PKLP
  const pklpInfo = getSubjectInfo((_name, code, normName) => {
    return (
      normName.includes('kasaysayan') ||
      normName.includes('lipunangpilipino') ||
      normName.includes('pklp') ||
      code === 'pklp'
    );
  });

  // 7. Tech-Pro Elective 1
  let electiveScores: [number | '', number | '', number | ''] = ['', '', ''];
  let electiveName = '';

  const isCoreSubjectText = (text: string) => {
    const n = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      n.includes('effective') ||
      n.includes('mabisang') ||
      n.includes('math') ||
      n.includes('science') ||
      n.includes('career') ||
      n.includes('lipunan') ||
      n.includes('kasaysayan') ||
      n === 'ec' ||
      n === 'mk' ||
      n === 'gm' ||
      n === 'gs' ||
      n === 'lcs' ||
      n === 'pklp'
    );
  };

  // Find candidate non-core subjects from gradesRecord
  for (const key of Object.keys(gradesRecord)) {
    if (matchedCoreKeys.has(key)) continue;
    const subObj = subjectsList.find(s => s.id === key || s.subject_name?.toLowerCase() === key.toLowerCase());
    const subName = subObj ? (subObj.subject_name || (subObj as unknown as { name?: string }).name || key) : key;
    if (isCoreSubjectText(key) || isCoreSubjectText(subName)) continue;

    const entry = gradesRecord[key];
    const s0 = getGradeFromEntry(entry, 0);
    const s1 = getGradeFromEntry(entry, 1);
    const s2 = getGradeFromEntry(entry, 2);

    if (s0 !== '' || s1 !== '' || s2 !== '') {
      electiveScores = [s0, s1, s2];
      electiveName = subName;
      break;
    }
  }

  // If still empty, check subjectsList for any non-core subject
  if (electiveScores[0] === '' && electiveScores[1] === '' && electiveScores[2] === '') {
    for (const sub of subjectsList) {
      if (matchedCoreKeys.has(sub.id)) continue;
      const sName = sub.subject_name || (sub as unknown as { name?: string }).name || '';
      if (isCoreSubjectText(sName)) continue;

      const entry = gradesRecord[sub.id] || gradesRecord[sName];
      if (entry) {
        const s0 = getGradeFromEntry(entry, 0);
        const s1 = getGradeFromEntry(entry, 1);
        const s2 = getGradeFromEntry(entry, 2);
        if (s0 !== '' || s1 !== '' || s2 !== '') {
          electiveScores = [s0, s1, s2];
          electiveName = sName;
          break;
        }
      }
    }
  }

  return {
    effectiveComm: effectiveCommInfo.scores,
    mabisangKom: mabisangKomInfo.scores,
    genMath: genMathInfo.scores,
    genSci: genSciInfo.scores,
    lifeCareer: lifeCareerInfo.scores,
    pklp: pklpInfo.scores,
    techProElective1: electiveScores,
    elective1Name: electiveName || 'TechPro Elective 1',
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
  if (value === undefined || value === null) return sheetXml;
  const formattedVal = escapeXml(value);
  const isNum = typeof value === 'number' && !isNaN(value);
  const isEmpty = value === '';

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

interface SheetInfo {
  name: string;
  sheetId: string;
  relId: string;
  path: string;
}

async function getWorkbookSheetMap(zip: JSZip): Promise<{
  sheetsByName: Map<string, SheetInfo>;
  sheetList: SheetInfo[];
}> {
  const sheetsByName = new Map<string, SheetInfo>();
  const sheetList: SheetInfo[] = [];

  const wbFile = zip.file('xl/workbook.xml');
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (!wbFile || !relsFile) return { sheetsByName, sheetList };

  const wbXml = await wbFile.async('text');
  const relsXml = await relsFile.async('text');

  // Build rId -> target map
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
  const style12Id = '146';

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

  // Fix style 244 (I43 / I42 General Average) alignment
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
  updatedStyles = updatedStyles.replace(/name val="Bookman Old Style&apos;"/g, 'name val="Bookman Old Style"');
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

function getGenAvgRemarks(avg: number | '' | string, learningAreas: (number | string)[]) {
  if (typeof avg !== 'number' || avg <= 0) return '';
  if (avg >= 75) {
    const validGrades = learningAreas.filter((g): g is number => typeof g === 'number' && g > 0);
    const hasBelow80 = validGrades.some(g => g < 80);
    if (avg >= 90 && validGrades.length > 0 && !hasBelow80) {
      return 'Promoted with Academic Excellence Award';
    }
    return 'Promoted';
  }
  return 'Retained';
}

/**
 * Populate the Grade 11 Tech-Pro SF9 Template buffer with learner data and compute all 8 sheets
 */
export async function populateGrade11TechProTemplateBuffer(
  templateBuffer: ArrayBuffer | Uint8Array | ArrayLike<number> | Buffer,
  opts: SF9Grade11TechProExportOptions
): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(templateBuffer as Parameters<typeof JSZip.loadAsync>[0]);

  const {
    student,
    schoolProfile,
    schoolYear,
    section,
    adviser,
    principal,
    principalTitle: _principalTitle,
    track,
    attendance,
    learners,
    grades,
    subjects
  } = opts;

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

  // 2. Separate male and female learners and sort alphabetically (Lastname, Firstname Middlename)
  const allLearners: StudentWithGrades[] = (learners && learners.length > 0)
    ? [...learners]
    : [student];

  const compareNames = (a: Student, b: Student) => {
    const nameA = formatLearnerName(a).toUpperCase();
    const nameB = formatLearnerName(b).toUpperCase();
    return nameA.localeCompare(nameB);
  };

  const maleStudents = allLearners
    .filter(l => (l.gender || '').trim().toLowerCase() === 'male' || (l.gender || '').trim().toLowerCase() === 'm')
    .sort(compareNames);

  const femaleStudents = allLearners
    .filter(l => (l.gender || '').trim().toLowerCase() === 'female' || (l.gender || '').trim().toLowerCase() === 'f')
    .sort(compareNames);

  const isMale = (student.gender || '').trim().toLowerCase() === 'male' || (student.gender || '').trim().toLowerCase() === 'm';
  const currentStudentName = formatLearnerName(student);

  // Extract selected student's grades
  const currentGrades = extractGrade11TechProSubjectGrades(grades, subjects);
  const elective1Title = currentGrades.elective1Name || 'TechPro Elective 1';

  // Cleaned profile fields
  const cleanRegion = schoolProfile?.region ? `${schoolProfile.region}` : 'Region III';
  const cleanDivision = (schoolProfile?.division ? `${schoolProfile.division.replace(/^Schools Division of\s*/i, '')}` : 'TARLAC PROVINCE').toUpperCase();
  const cleanDistrict = (schoolProfile?.district || schoolProfile?.city || 'VICTORIA EAST DISTRICT').toUpperCase();
  const cleanSchoolId = schoolProfile?.school_id || '307014';
  const cleanSchoolName = schoolProfile?.name || 'CALIBUNGAN HIGH SCHOOL';
  const cleanSy = schoolYear || '2026-2027';
  const cleanPrincipal = principal || schoolProfile?.head_name || '';
  const cleanAdviser = adviser || '';
  const cleanSection = section || '';
  const cleanTrack = (track && track.trim().toUpperCase().includes('TECH'))
    ? track.trim().toUpperCase()
    : (track && track.trim() ? track.trim().toUpperCase() : 'TECHPRO TRACK');

  // Ensure 10pt and 12pt wrapped remarks styles in xl/styles.xml
  const stylesFile = zip.file('xl/styles.xml');
  let style10Id = '146';
  let style12Id = '146';
  if (stylesFile) {
    const stylesXml = await stylesFile.async('text');
    const res = ensureRemarksStyles(stylesXml);
    style10Id = res.style10Id;
    style12Id = res.style12Id;
    zip.file('xl/styles.xml', res.stylesXml);
  }

  // 3. Resolve workbook sheets map dynamically
  const { sheetsByName, sheetList } = await getWorkbookSheetMap(zip);
  const sf9Info = sheetsByName.get('SF9 - GRADE 11 TECHPRO') ||
                  sheetsByName.get('SF9 - GRADE 11 TechPro') ||
                  sheetList.find(s => s.name.toUpperCase().includes('SF9') || s.name.toUpperCase().includes('TECHPRO'));
  const sf9Index = sheetList.findIndex(s => s.name.toUpperCase().includes('SF9') || s.name.toUpperCase().includes('TECHPRO'));
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

  const attInfo = sheetsByName.get('ATTENDANCE RECORD SUMMARY') || sheetList.find(s => s.name.toUpperCase().includes('ATTENDANCE'));
  const attPath = attInfo?.path || 'xl/worksheets/sheet7.xml';

  const finalGradesInfo = sheetsByName.get('FINAL GRADES') || sheetsByName.get('FINAL GRADE SUMMARY');
  const finalGradesPath = finalGradesInfo && finalGradesInfo.path !== sf9SheetPath ? finalGradesInfo.path : null;

  // Force full calculation on load and set active tab in xl/workbook.xml
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

  // =========================================================================
  // SHEET 2: INPUT DATA
  // =========================================================================
  const sheet2File = zip.file(inputSheetPath);
  if (sheet2File) {
    let sheet2Xml = await sheet2File.async('text');

    const inputDataCells: Record<string, string | number> = {
      'F10': cleanRegion,
      'F11': cleanDivision,
      'F12': (schoolProfile?.city || schoolProfile?.municipality || 'VICTORIA').toUpperCase(),
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

    // Male learners: rows 11 to 60 (L: Name, M: LRN, N: Birthdate)
    // NOTE: Do NOT force styles — preserve the template's native styles (14=name, 133=LRN, 134=birthdate)
    for (let i = 0; i < 50; i++) {
      const row = 11 + i;
      const s = maleStudents[i];
      inputDataCells[`L${row}`] = s ? formatLearnerName(s) : '';
      inputDataCells[`M${row}`] = s ? (s.lrn || '') : '';
      if (s && s.birthday) {
        const parts = parseBirthDateParts(s.birthday);
        const serial = birthDateToExcelSerial(s.birthday);
        if (parts && serial !== null) {
          birthdateFormulas.push({
            cellRef: `N${row}`,
            formula: `DATE(${parts.year},${parts.month},${parts.day})`,
            serial
          });
        } else {
          inputDataCells[`N${row}`] = formatDateToMMDDYYYY(s.birthday);
        }
      } else {
        inputDataCells[`N${row}`] = '';
      }
    }

    // Female learners: rows 11 to 60 (Q: Name, R: LRN, S: Birthdate)
    // NOTE: Do NOT force styles — preserve the template's native styles (14=name, 133=LRN, 134=birthdate)
    for (let i = 0; i < 50; i++) {
      const row = 11 + i;
      const s = femaleStudents[i];
      inputDataCells[`Q${row}`] = s ? formatLearnerName(s) : '';
      inputDataCells[`R${row}`] = s ? (s.lrn || '') : '';
      if (s && s.birthday) {
        const parts = parseBirthDateParts(s.birthday);
        const serial = birthDateToExcelSerial(s.birthday);
        if (parts && serial !== null) {
          birthdateFormulas.push({
            cellRef: `S${row}`,
            formula: `DATE(${parts.year},${parts.month},${parts.day})`,
            serial
          });
        } else {
          inputDataCells[`S${row}`] = formatDateToMMDDYYYY(s.birthday);
        }
      } else {
        inputDataCells[`S${row}`] = '';
      }
    }

    sheet2Xml = updateCellsBatch(sheet2Xml, inputDataCells, inputStyles);
    for (const bf of birthdateFormulas) {
      sheet2Xml = updateFormulaCellExplicit(sheet2Xml, bf.cellRef, bf.formula, bf.serial, bf.style);
    }
    zip.file(inputSheetPath, sheet2Xml);
  }

  // Precompute term averages and ranks for all learners across terms 1, 2, 3
  const getLearnerGrades = (st: Student | undefined) => {
    if (!st) return null;
    if (st.lrn === student.lrn) return currentGrades;
    const studentGradesRecord = (st as unknown as StudentWithGrades)?.grades || {};
    return extractGrade11TechProSubjectGrades(studentGradesRecord, subjects);
  };

  const termAveragesMap = new Map<number, { males: (number | '')[]; females: (number | '')[] }>();

  for (let termIdx = 0; termIdx < 3; termIdx++) {
    const maleAverages: (number | '')[] = [];
    for (let idx = 0; idx < 50; idx++) {
      const m = maleStudents[idx];
      const g = getLearnerGrades(m);
      if (!g) {
        maleAverages.push('');
        continue;
      }
      const s1 = g.effectiveComm[termIdx];
      const s2 = g.mabisangKom[termIdx];
      const s3 = g.genMath[termIdx];
      const s4 = g.genSci[termIdx];
      const s5 = g.lifeCareer[termIdx];
      const s6 = g.pklp[termIdx];
      const s7 = g.techProElective1[termIdx];

      const numA = typeof s1 === 'number' ? s1 : parseFloat(String(s1));
      const numB = typeof s2 === 'number' ? s2 : parseFloat(String(s2));
      const comb = !isNaN(numA) && !isNaN(numB)
        ? Math.round((numA + numB) / 2)
        : (!isNaN(numA) ? numA : (!isNaN(numB) ? numB : null));

      const numScores = [comb, s3, s4, s5, s6, s7]
        .map(v => typeof v === 'number' ? v : parseFloat(String(v)))
        .filter((v): v is number => !isNaN(v) && v > 0);

      if (numScores.length === 6) {
        // Full weighted average: 6 units each for core (30), 12 units for elective = 42 total units
        const weightedPoints = (comb as number) * 6 + Number(s3) * 6 + Number(s4) * 6 + Number(s5) * 6 + Number(s6) * 6 + Number(s7) * 12;
        maleAverages.push(Math.round(weightedPoints / 42));
      } else if (numScores.length > 0) {
        maleAverages.push(Math.round(numScores.reduce((a, b) => a + b, 0) / numScores.length));
      } else {
        maleAverages.push('');
      }
    }

    const femaleAverages: (number | '')[] = [];
    for (let idx = 0; idx < 50; idx++) {
      const f = femaleStudents[idx];
      const g = getLearnerGrades(f);
      if (!g) {
        femaleAverages.push('');
        continue;
      }
      const s1 = g.effectiveComm[termIdx];
      const s2 = g.mabisangKom[termIdx];
      const s3 = g.genMath[termIdx];
      const s4 = g.genSci[termIdx];
      const s5 = g.lifeCareer[termIdx];
      const s6 = g.pklp[termIdx];
      const s7 = g.techProElective1[termIdx];

      const numA = typeof s1 === 'number' ? s1 : parseFloat(String(s1));
      const numB = typeof s2 === 'number' ? s2 : parseFloat(String(s2));
      const comb = !isNaN(numA) && !isNaN(numB)
        ? Math.round((numA + numB) / 2)
        : (!isNaN(numA) ? numA : (!isNaN(numB) ? numB : null));

      const numScores = [comb, s3, s4, s5, s6, s7]
        .map(v => typeof v === 'number' ? v : parseFloat(String(v)))
        .filter((v): v is number => !isNaN(v) && v > 0);

      if (numScores.length === 6) {
        const weightedPoints = (comb as number) * 6 + Number(s3) * 6 + Number(s4) * 6 + Number(s5) * 6 + Number(s6) * 6 + Number(s7) * 12;
        femaleAverages.push(Math.round(weightedPoints / 42));
      } else if (numScores.length > 0) {
        femaleAverages.push(Math.round(numScores.reduce((a, b) => a + b, 0) / numScores.length));
      } else {
        femaleAverages.push('');
      }
    }

    termAveragesMap.set(termIdx, { males: maleAverages, females: femaleAverages });
  }

  // =========================================================================
  // SHEETS 3, 4, 5: TERM 1 SUMMARY, TERM 2 SUMMARY, TERM 3 SUMMARY
  // =========================================================================
  const termSheetConfigs = [
    { termIdx: 0, path: term1Path },
    { termIdx: 1, path: term2Path },
    { termIdx: 2, path: term3Path },
  ];

  for (const { termIdx, path: sPath } of termSheetConfigs) {
    const sFile = zip.file(sPath);
    if (!sFile) continue;
    let sXml = await sFile.async('text');

    const isModernRow16 = sXml.includes('r="C16"') && sXml.includes('r="B16"') && (sXml.includes('L11') || sXml.includes('M11'));
    const maleStartRow = isModernRow16 ? 16 : 15;
    const femaleStartRow = isModernRow16 ? 67 : 66;

    // Ensure summary formula dynamically averages only graded subjects
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

    // Adjust column 17 width and row 13 height so Q13/R13 fits and wraps nicely
    sXml = sXml.replace(
      /<col min="16" max="17" width="9.44140625" style="232" customWidth="1"\/>/g,
      '<col min="16" max="16" width="9.44140625" style="232" customWidth="1"/><col min="17" max="17" width="13.5" style="232" customWidth="1"/>'
    );
    sXml = sXml.replace(
      /(<row\s+r="13"[^>]*?\s+ht=")[^"]*(")/,
      '$128.5$2'
    );

    const termCells: Record<string, string | number> = {};
    const termFormulaResults: Record<string, string | number> = {};

    // Clear orphan cells Q6 and R6 (present in Term 2 / Term 3) so school year doesn't appear there
    sXml = updateFormulaCellExplicit(sXml, 'Q6', '', '');
    sXml = updateFormulaCellExplicit(sXml, 'R6', '', '');

    // Header updates on Summary sheets
    termFormulaResults['E5'] = cleanRegion;
    termFormulaResults['J5'] = cleanDivision;
    termFormulaResults['E6'] = cleanSchoolName;
    termFormulaResults['J6'] = cleanSchoolId;
    termFormulaResults['O6'] = cleanSy;
    termFormulaResults['G9'] = 'Grade 11';
    termFormulaResults['N9'] = cleanSection;
    termFormulaResults['M9'] = cleanSection;
    termFormulaResults['G10'] = cleanTrack;
    termFormulaResults['N10'] = cleanAdviser;
    termFormulaResults['M10'] = cleanAdviser;

    const termAvgs = termAveragesMap.get(termIdx)!;
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

    // Helper to populate learner row in Term sheet
    const populateLearnerTermRow = (s: StudentWithGrades | undefined, row: number, isMaleRow: boolean, studentIdx: number) => {
      if (!s) {
        termFormulaResults[`C${row}`] = '';
        termFormulaResults[`D${row}`] = '';
        termFormulaResults[`F${row}`] = '';
        termFormulaResults[`G${row}`] = '';
        termFormulaResults[`H${row}`] = '';
        termFormulaResults[`I${row}`] = '';
        termFormulaResults[`J${row}`] = '';
        termFormulaResults[`K${row}`] = '';
        termFormulaResults[`L${row}`] = '';
        termFormulaResults[`M${row}`] = '';
        termFormulaResults[`N${row}`] = '';
        termFormulaResults[`O${row}`] = '';
        termFormulaResults[`P${row}`] = '';
        termFormulaResults[`Q${row}`] = '';
        termFormulaResults[`R${row}`] = '';
        termFormulaResults[`S${row}`] = '';
        termFormulaResults[`T${row}`] = '';
        return;
      }

      const learnerGrades = s.lrn === student.lrn
        ? currentGrades
        : extractGrade11TechProSubjectGrades(s.grades || {}, subjects);

      termFormulaResults[`C${row}`] = formatLearnerName(s);
      termFormulaResults[`J${row}`] = isMaleRow ? 'M' : 'F';

      const s1 = learnerGrades.effectiveComm[termIdx] ?? '';
      const s2 = learnerGrades.mabisangKom[termIdx] ?? '';
      const s3 = learnerGrades.genMath[termIdx] ?? '';
      const s4 = learnerGrades.genSci[termIdx] ?? '';
      const s5 = learnerGrades.lifeCareer[termIdx] ?? '';
      const s6 = learnerGrades.pklp[termIdx] ?? '';
      const s7 = learnerGrades.techProElective1[termIdx] ?? '';

      const numA = typeof s1 === 'number' ? s1 : parseFloat(String(s1));
      const numB = typeof s2 === 'number' ? s2 : parseFloat(String(s2));
      const comb = !isNaN(numA) && !isNaN(numB)
        ? Math.round((numA + numB) / 2)
        : (!isNaN(numA) ? numA : (!isNaN(numB) ? numB : ''));

      const studentAvg = isMaleRow ? termAvgs.males[studentIdx] : termAvgs.females[studentIdx];
      const rankVal = studentAvg !== '' ? getRank(studentAvg) : '';

      const lrnInputCol = isMaleRow ? 'M' : 'R';
      const bdayInputCol = isMaleRow ? 'N' : 'S';

      if (isModernRow16) {
        // Modern Layout (Row 16 start for males, Row 67 for females):
        // Col C: Name (merged C:E), Col F: LRN (merged F:G), Col H: Birthday, Col I: Age, Col J: Sex
        // Col K: Combined Term Grade
        // Col L: Effective Communication
        // Col M: Mabisang Komunikasyon
        // Col N: General Mathematics
        // Col O: General Science
        // Col P: Life and Career Skills
        // Col Q: PKLP
        // Col R: TechPro Elective 1
        // Col S: General Average
        // Col T: Rank
        const serial = s?.birthday ? birthDateToExcelSerial(s.birthday) : null;
        termFormulaResults[`F${row}`] = s.lrn || '';
        termFormulaResults[`H${row}`] = serial !== null ? serial : (s ? formatDateToMMDDYYYY(s.birthday) : '');
        termFormulaResults[`I${row}`] = parseAge(s.age, s.birthday);

        if (comb !== '') termCells[`K${row}`] = Number(comb);
        if (s1 !== '') termCells[`L${row}`] = Number(s1);
        if (s2 !== '') termCells[`M${row}`] = Number(s2);
        if (s3 !== '') termCells[`N${row}`] = Number(s3);
        if (s4 !== '') termCells[`O${row}`] = Number(s4);
        if (s5 !== '') termCells[`P${row}`] = Number(s5);
        if (s6 !== '') termCells[`Q${row}`] = Number(s6);
        if (s7 !== '') termCells[`R${row}`] = Number(s7);

        if (studentAvg !== '') {
          termFormulaResults[`S${row}`] = studentAvg;
          termFormulaResults[`T${row}`] = rankVal;
        }

        sXml = updateFormulaCellExplicit(
          sXml,
          `F${row}`,
          `IF('INPUT DATA'!${lrnInputCol}${11 + studentIdx}="","",'INPUT DATA'!${lrnInputCol}${11 + studentIdx})`,
          s.lrn || ''
        );
        sXml = updateFormulaCellExplicit(
          sXml,
          `H${row}`,
          `IF('INPUT DATA'!${bdayInputCol}${11 + studentIdx}="","",'INPUT DATA'!${bdayInputCol}${11 + studentIdx})`,
          serial !== null ? serial : (s ? formatDateToMMDDYYYY(s.birthday) : '')
        );
        sXml = updateFormulaCellExplicit(
          sXml,
          `I${row}`,
          `IF(H${row}="","",DATEDIF(H${row},TODAY(),"Y"))`,
          parseAge(s.age, s.birthday)
        );
      } else {
        // Legacy Layout (Row 15 start for males, Row 66 for females):
        // Col C: Name, Col F: LRN, Col H: Birthday, Col I: Age, Col J: Sex
        // Col K: Effective Communication
        // Col L: Mabisang Komunikasyon
        // Col M: General Mathematics
        // Col N: General Science
        // Col O: Life and Career Skills
        // Col P: PKLP
        // Col Q: TechPro Elective 1
        // Col R: General Average
        // Col S: Rank
        termFormulaResults[`F${row}`] = s.lrn || '';
        termFormulaResults[`H${row}`] = formatDateToMMDDYYYY(s.birthday);
        termFormulaResults[`I${row}`] = parseAge(s.age, s.birthday);

        if (s1 !== '') termCells[`K${row}`] = Number(s1);
        if (s2 !== '') termCells[`L${row}`] = Number(s2);
        if (s3 !== '') termCells[`M${row}`] = Number(s3);
        if (s4 !== '') termCells[`N${row}`] = Number(s4);
        if (s5 !== '') termCells[`O${row}`] = Number(s5);
        if (s6 !== '') termCells[`P${row}`] = Number(s6);
        if (s7 !== '') termCells[`Q${row}`] = Number(s7);

        if (studentAvg !== '') {
          termFormulaResults[`R${row}`] = studentAvg;
          termFormulaResults[`S${row}`] = rankVal;
        }

        sXml = updateFormulaCellExplicit(
          sXml,
          `F${row}`,
          `IF('INPUT DATA'!${lrnInputCol}${11 + studentIdx}="","",'INPUT DATA'!${lrnInputCol}${11 + studentIdx})`,
          s.lrn || ''
        );
        sXml = updateFormulaCellExplicit(
          sXml,
          `H${row}`,
          `IF('INPUT DATA'!${bdayInputCol}${11 + studentIdx}="","",'INPUT DATA'!${bdayInputCol}${11 + studentIdx})`,
          formatDateToMMDDYYYY(s.birthday)
        );
        sXml = updateFormulaCellExplicit(
          sXml,
          `I${row}`,
          `IF(H${row}="","",DATEDIF(H${row},TODAY(),"Y"))`,
          parseAge(s.age, s.birthday)
        );
      }
    };

    // Populate male learners (50 rows)
    for (let idx = 0; idx < 50; idx++) {
      populateLearnerTermRow(maleStudents[idx], maleStartRow + idx, true, idx);
    }

    // Populate female learners (50 rows)
    for (let idx = 0; idx < 50; idx++) {
      populateLearnerTermRow(femaleStudents[idx], femaleStartRow + idx, false, idx);
    }

    sXml = updateFormulaValuesBatch(sXml, termFormulaResults);
    sXml = updateCellsBatch(sXml, termCells);
    zip.file(sPath, sXml);
  }

  // =========================================================================
  // OPTIONAL: FINAL GRADE SUMMARY (Only if present and not the SF9 sheet)
  // =========================================================================
  if (finalGradesPath) {
    const s6File = zip.file(finalGradesPath);
    if (s6File) {
      let s6Xml = await s6File.async('text');
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

      s6Xml = updateCellInSheetXml(s6Xml, 'O10', cleanAdviser);
      s6Xml = updateCellInSheetXml(s6Xml, 'P10', cleanAdviser);

      const maleFinalGAs: (number | '')[] = [];
      for (let idx = 0; idx < 50; idx++) {
        const t1 = termAveragesMap.get(0)!.males[idx];
        const t2 = termAveragesMap.get(1)!.males[idx];
        const t3 = termAveragesMap.get(2)!.males[idx];
        const valid = [t1, t2, t3].filter((v): v is number => typeof v === 'number' && v > 0);
        maleFinalGAs.push(valid.length === 3 ? Math.round(valid.reduce((a, b) => a + b, 0) / 3) : '');
      }

      const femaleFinalGAs: (number | '')[] = [];
      for (let idx = 0; idx < 50; idx++) {
        const t1 = termAveragesMap.get(0)!.females[idx];
        const t2 = termAveragesMap.get(1)!.females[idx];
        const t3 = termAveragesMap.get(2)!.females[idx];
        const valid = [t1, t2, t3].filter((v): v is number => typeof v === 'number' && v > 0);
        femaleFinalGAs.push(valid.length === 3 ? Math.round(valid.reduce((a, b) => a + b, 0) / 3) : '');
      }

      const allFinalGAs = [
        ...maleFinalGAs.filter((v): v is number => typeof v === 'number' && v > 0),
        ...femaleFinalGAs.filter((v): v is number => typeof v === 'number' && v > 0)
      ].sort((a, b) => b - a);

      const getFinalRank = (avg: number | '') => {
        if (typeof avg !== 'number' || avg <= 0) return '';
        const matching = allFinalGAs.filter(s => s === avg);
        const higherCount = allFinalGAs.filter(s => s > avg).length;
        return higherCount + 1 + (matching.length - 1) / 2;
      };

      for (let idx = 0; idx < 50; idx++) {
        const row = 15 + idx;
        const m = maleStudents[idx];
        s6FormulaResults[`C${row}`] = m ? formatLearnerName(m) : '';
        const t1 = termAveragesMap.get(0)!.males[idx];
        const t2 = termAveragesMap.get(1)!.males[idx];
        const t3 = termAveragesMap.get(2)!.males[idx];
        const finalGA = maleFinalGAs[idx];
        s6FormulaResults[`F${row}`] = t1 !== '' ? t1 : '';
        s6FormulaResults[`J${row}`] = t2 !== '' ? t2 : '';
        s6FormulaResults[`M${row}`] = t3 !== '' ? t3 : '';
        s6FormulaResults[`P${row}`] = finalGA !== '' ? finalGA : '';
        s6FormulaResults[`S${row}`] = finalGA !== '' ? getFinalRank(finalGA) : '';
      }

      for (let idx = 0; idx < 50; idx++) {
        const row = 66 + idx;
        const f = femaleStudents[idx];
        s6FormulaResults[`C${row}`] = f ? formatLearnerName(f) : '';
        const t1 = termAveragesMap.get(0)!.females[idx];
        const t2 = termAveragesMap.get(1)!.females[idx];
        const t3 = termAveragesMap.get(2)!.females[idx];
        const finalGA = femaleFinalGAs[idx];
        s6FormulaResults[`F${row}`] = t1 !== '' ? t1 : '';
        s6FormulaResults[`J${row}`] = t2 !== '' ? t2 : '';
        s6FormulaResults[`M${row}`] = t3 !== '' ? t3 : '';
        s6FormulaResults[`P${row}`] = finalGA !== '' ? finalGA : '';
        s6FormulaResults[`S${row}`] = finalGA !== '' ? getFinalRank(finalGA) : '';
      }

      s6Xml = updateFormulaValuesBatch(s6Xml, s6FormulaResults);
      zip.file(finalGradesPath, s6Xml);
    }
  }

  // =========================================================================
  // SHEET 7: ATTENDANCE RECORD SUMMARY
  // =========================================================================
  const sheet7File = zip.file(attPath);
  if (sheet7File) {
    let sheet7Xml = await sheet7File.async('text');

    const sheet7Cells: Record<string, string | number> = {};
    const sheet7FormulaResults: Record<string, string | number> = {};

    sheet7FormulaResults['E5'] = cleanRegion;
    sheet7FormulaResults['I5'] = cleanDivision;
    sheet7FormulaResults['E7'] = cleanSchoolName;
    sheet7FormulaResults['I7'] = cleanSchoolId;
    sheet7FormulaResults['M7'] = cleanSy;
    sheet7FormulaResults['G10'] = 'Grade 11';
    sheet7FormulaResults['L10'] = cleanAdviser;
    sheet7FormulaResults['G11'] = cleanSection || cleanTrack;

    const monthCols = ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P']; // Jun to Apr (11 months)

    if (attendance?.schoolDays && attendance.schoolDays.length > 0) {
      attendance.schoolDays.forEach((sd, idx) => {
        if (idx < monthCols.length && sd !== undefined && sd !== null && sd > 0) {
          sheet7Cells[`${monthCols[idx]}13`] = Number(sd);
          sheet7Cells[`${monthCols[idx]}117`] = Number(sd);
        }
      });
      const totalDays = attendance.schoolDays.reduce((a, b) => a + (Number(b) || 0), 0);
      sheet7FormulaResults['A117'] = totalDays;
    }

    const populateAttendanceRow = (s: StudentWithGrades | undefined, row: number) => {
      if (!s) {
        sheet7FormulaResults[`C${row}`] = '';
        monthCols.forEach(col => { sheet7Cells[`${col}${row}`] = ''; });
        return;
      }
      sheet7FormulaResults[`C${row}`] = formatLearnerName(s);
      const studentAtt = (s.lrn === student.lrn ? attendance : s.attendance);
      if (studentAtt?.daysPresent && studentAtt.daysPresent.length > 0) {
        studentAtt.daysPresent.forEach((dp: number | string, idx: number) => {
          if (idx < monthCols.length && dp !== undefined && dp !== null && dp !== ('' as unknown as number)) {
            sheet7Cells[`${monthCols[idx]}${row}`] = Number(dp);
          }
        });
      }
    };

    for (let idx = 0; idx < 50; idx++) {
      populateAttendanceRow(maleStudents[idx], 14 + idx);
    }

    for (let idx = 0; idx < 50; idx++) {
      populateAttendanceRow(femaleStudents[idx], 65 + idx);
    }

    sheet7Xml = updateFormulaValuesBatch(sheet7Xml, sheet7FormulaResults);
    sheet7Xml = updateCellsBatch(sheet7Xml, sheet7Cells);
    zip.file(attPath, sheet7Xml);
  }

  // =========================================================================
  // SF9 SHEET (sheet6.xml in updated template, sheet8.xml in legacy)
  // =========================================================================
  const sf9File = zip.file(sf9SheetPath);
  if (sf9File) {
    let sf9Xml = await sf9File.async('text');

    const isModernLayout = sf9Xml.includes('r="L33"') || sf9SheetPath.includes('sheet6') || zip.file('xl/drawings/drawing6.xml') !== null;

    // Calculated Age
    const calculatedAge = parseAge(student.age, student.birthday);

    // 1. Header & Student Info
    const sf9Cells: Record<string, string | number> = {
      'C17': currentStudentName,
      'B41': elective1Title,
    };

    const sf9FormulaResults: Record<string, string | number> = {
      'C18': student.lrn || '',
      'I17': calculatedAge,
      'K17': isMale ? 'M' : 'F',
      'I18': 11,
      'K18': cleanSection,
      'E19': cleanTrack,
    };

    // Header updates & #REF! elimination
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B7', "'INPUT DATA'!F10", cleanRegion);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B8', "'INPUT DATA'!F11", cleanDivision);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B9', "'INPUT DATA'!F13", cleanDistrict);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B10', "'INPUT DATA'!F15", cleanSchoolId);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B12', "'INPUT DATA'!F16", cleanSchoolName);
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B15', `School Year ${cleanSy}`);
    sf9Xml = updateCellInSheetXml(sf9Xml, 'A12', '');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'A15', '');

    sf9Xml = updateCellInSheetXml(sf9Xml, 'C17', currentStudentName);
    sf9Xml = updateFormulaCellExplicit(
      sf9Xml,
      'C18',
      "IF(C17=\"\",\"\",VLOOKUP(C17,'TERM 1 SUMMARY'!C16:R116,4,0))",
      student.lrn || ''
    );
    sf9Xml = updateFormulaCellExplicit(
      sf9Xml,
      'I17',
      "IF(C17=\"\",\"\",VLOOKUP(C17,'TERM 1 SUMMARY'!C16:R116,7,0))",
      calculatedAge
    );
    sf9Xml = updateFormulaCellExplicit(
      sf9Xml,
      'K17',
      "IF(C17=\"\",\"\",VLOOKUP(C17,'TERM 1 SUMMARY'!C16:R116,8,0))",
      isMale ? 'M' : 'F'
    );
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I18', "IF('INPUT DATA'!F27=\"\",\"\",'INPUT DATA'!F27)", 11);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K18', "IF('INPUT DATA'!F29=\"\",\"\",'INPUT DATA'!F29)", cleanSection);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'E19', "IF('INPUT DATA'!F28=\"\",\"\",'INPUT DATA'!F28)", cleanTrack);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'C19', '', '');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'C19', '');

    // Signatures
    sf9FormulaResults['B27'] = cleanPrincipal;
    sf9FormulaResults['H27'] = cleanAdviser;
    sf9FormulaResults['X39'] = cleanAdviser;
    sf9FormulaResults['Q41'] = cleanPrincipal;
    sf9FormulaResults['J50'] = cleanPrincipal;
    sf9FormulaResults['Q50'] = cleanPrincipal;
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'A27', '', '');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'A27', '');
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'B27', "IF('INPUT DATA'!F19=\"\",\"\",'INPUT DATA'!F19)", cleanPrincipal);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'H27', "IF('INPUT DATA'!F26=\"\",\"\",'INPUT DATA'!F26)", cleanAdviser);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'X39', "IF('INPUT DATA'!F26=\"\",\"\",'INPUT DATA'!F26)", cleanAdviser);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'Q41', "IF('INPUT DATA'!F19=\"\",\"\",'INPUT DATA'!F19)", cleanPrincipal);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J50', "IF('INPUT DATA'!F19=\"\",\"\",'INPUT DATA'!F19)", cleanPrincipal);
    sf9Xml = updateFormulaCellExplicit(sf9Xml, 'Q50', "IF('INPUT DATA'!F19=\"\",\"\",'INPUT DATA'!F19)", cleanPrincipal);

    // Pre-evaluate quarterly subject grades
    const t1_s1 = currentGrades.effectiveComm[0] ?? '';
    const t2_s1 = currentGrades.effectiveComm[1] ?? '';
    const t3_s1 = currentGrades.effectiveComm[2] ?? '';

    const t1_s2 = currentGrades.mabisangKom[0] ?? '';
    const t2_s2 = currentGrades.mabisangKom[1] ?? '';
    const t3_s2 = currentGrades.mabisangKom[2] ?? '';

    const t1_s3 = currentGrades.genMath[0] ?? '';
    const t2_s3 = currentGrades.genMath[1] ?? '';
    const t3_s3 = currentGrades.genMath[2] ?? '';

    const t1_s4 = currentGrades.genSci[0] ?? '';
    const t2_s4 = currentGrades.genSci[1] ?? '';
    const t3_s4 = currentGrades.genSci[2] ?? '';

    const t1_s5 = currentGrades.lifeCareer[0] ?? '';
    const t2_s5 = currentGrades.lifeCareer[1] ?? '';
    const t3_s5 = currentGrades.lifeCareer[2] ?? '';

    const t1_s6 = currentGrades.pklp[0] ?? '';
    const t2_s6 = currentGrades.pklp[1] ?? '';
    const t3_s6 = currentGrades.pklp[2] ?? '';

    const t1_s7 = currentGrades.techProElective1[0] ?? '';
    const t2_s7 = currentGrades.techProElective1[1] ?? '';
    const t3_s7 = currentGrades.techProElective1[2] ?? '';

    const computeTermComb = (a: number | string, b: number | string) => {
      const numA = typeof a === 'number' ? a : parseFloat(String(a));
      const numB = typeof b === 'number' ? b : parseFloat(String(b));
      if (!isNaN(numA) && !isNaN(numB)) return Math.round((numA + numB) / 2);
      return '';
    };

    const t1_comb = computeTermComb(t1_s1, t1_s2);
    const t2_comb = computeTermComb(t2_s1, t2_s2);
    const t3_comb = computeTermComb(t3_s1, t3_s2);

    const calcFinalGrade = (terms: (number | string)[]) => {
      const valid = terms.map(v => typeof v === 'number' ? v : parseFloat(String(v))).filter(v => !isNaN(v) && v > 0);
      return valid.length === 3 ? Math.round(valid.reduce((a, b) => a + b, 0) / 3) : '';
    };

    const commFinal = calcFinalGrade([t1_comb, t2_comb, t3_comb]);
    const mathFinal = calcFinalGrade([t1_s3, t2_s3, t3_s3]);
    const sciFinal = calcFinalGrade([t1_s4, t2_s4, t3_s4]);
    const lcsFinal = calcFinalGrade([t1_s5, t2_s5, t3_s5]);
    const pklpFinal = calcFinalGrade([t1_s6, t2_s6, t3_s6]);
    const electiveFinal = calcFinalGrade([t1_s7, t2_s7, t3_s7]);

    const numOrEmpty = (v: unknown): number | '' => {
      if (v === undefined || v === null || v === '') return '';
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      return !isNaN(n) && n > 0 ? n : '';
    };
    const getRemarks = (v: number | '') => (typeof v === 'number' && v > 0 ? (v >= 75 ? 'Passed' : 'Failed') : '');

    if (isModernLayout) {
      // Modern DepEd Layout (8-sheet, Sheet 6 = SF9):
      // - Columns F, G, H: Term 1, Term 2, Term 3
      // - Column I: Units (6 for core, 12 for TechPro Specialization, 42 total in row 42)
      // - Column J: Final Grade (Row 33 combined, Rows 36-39 core, Row 41 elective, Row 42 Gen Avg)
      // - Column K: Remarks ("Passed" / "Failed" / "Promoted with Academic Excellence Award")
      // - Column L: Weighted Points (J * I guarded against #VALUE!)
      // - Row 34 & 35: English & Filipino sub-rows, J:L remain empty

      // Pre-evaluate term grades in Columns F, G, H
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'F33', t1_comb);
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'G33', t2_comb);
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'H33', t3_comb);

      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'F34', numOrEmpty(t1_s1));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'G34', numOrEmpty(t2_s1));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'H34', numOrEmpty(t3_s1));

      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'F35', numOrEmpty(t1_s2));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'G35', numOrEmpty(t2_s2));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'H35', numOrEmpty(t3_s2));

      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'F36', numOrEmpty(t1_s3));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'G36', numOrEmpty(t2_s3));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'H36', numOrEmpty(t3_s3));

      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'F37', numOrEmpty(t1_s4));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'G37', numOrEmpty(t2_s4));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'H37', numOrEmpty(t3_s4));

      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'F38', numOrEmpty(t1_s5));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'G38', numOrEmpty(t2_s5));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'H38', numOrEmpty(t3_s5));

      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'F39', numOrEmpty(t1_s6));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'G39', numOrEmpty(t2_s6));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'H39', numOrEmpty(t3_s6));

      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'F41', numOrEmpty(t1_s7));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'G41', numOrEmpty(t2_s7));
      sf9Xml = updateFormulaValueInSheetXml(sf9Xml, 'H41', numOrEmpty(t3_s7));

      // Final Grades (Column J) - shown ONLY if all 3 terms are complete
      sf9Xml = updateFormulaCellExplicit(
        sf9Xml,
        'J33',
        'IF(SUM(F33:H33)=0, "", ROUND((F33+H33+G33)*(I33/3)/I33,0))',
        commFinal !== '' ? commFinal : ''
      );
      sf9Xml = updateFormulaCellExplicit(
        sf9Xml,
        'J36',
        'IF(SUM(F36:H36)=0, "", ROUND((F36+H36+G36)*(I36/3)/I36,0))',
        mathFinal !== '' ? mathFinal : ''
      );
      sf9Xml = updateFormulaCellExplicit(
        sf9Xml,
        'J37',
        'IF(SUM(F37:H37)=0, "", ROUND((F37+H37+G37)*(I37/3)/I37,0))',
        sciFinal !== '' ? sciFinal : ''
      );
      sf9Xml = updateFormulaCellExplicit(
        sf9Xml,
        'J38',
        'IF(SUM(F38:H38)=0, "", ROUND((F38+H38+G38)*(I38/3)/I38,0))',
        lcsFinal !== '' ? lcsFinal : ''
      );
      sf9Xml = updateFormulaCellExplicit(
        sf9Xml,
        'J39',
        'IF(SUM(F39:H39)=0, "", ROUND((F39+H39+G39)*(I39/3)/I39,0))',
        pklpFinal !== '' ? pklpFinal : ''
      );
      sf9Xml = updateFormulaCellExplicit(
        sf9Xml,
        'J41',
        'IF(SUM(F41:H41)=0, "", ROUND((F41+H41+G41)*(I41/3)/I41,0))',
        electiveFinal !== '' ? electiveFinal : ''
      );

      // Rows 34 & 35 have empty final grade, remarks, and points
      sf9Xml = updateCellInSheetXml(sf9Xml, 'J34', '');
      sf9Xml = updateCellInSheetXml(sf9Xml, 'K34', '');
      sf9Xml = updateCellInSheetXml(sf9Xml, 'L34', '');
      sf9Xml = updateCellInSheetXml(sf9Xml, 'J35', '');
      sf9Xml = updateCellInSheetXml(sf9Xml, 'K35', '');
      sf9Xml = updateCellInSheetXml(sf9Xml, 'L35', '');

      // Remarks (Column K)
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K33', 'IF(J33="", "", IF(J33>=75, "Passed", "Failed"))', getRemarks(commFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K36', 'IF(J36="", "", IF(J36>=75, "Passed", "Failed"))', getRemarks(mathFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K37', 'IF(J37="", "", IF(J37>=75, "Passed", "Failed"))', getRemarks(sciFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K38', 'IF(J38="", "", IF(J38>=75, "Passed", "Failed"))', getRemarks(lcsFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K39', 'IF(J39="", "", IF(J39>=75, "Passed", "Failed"))', getRemarks(pklpFinal));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'K41', 'IF(J41="", "", IF(J41>=75, "Passed", "Failed"))', getRemarks(electiveFinal));

      // Weighted Points (Column L = J * I) - safely guarded against empty strings to eliminate #VALUE!
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L33', 'IF(J33="","",J33*I33)', commFinal !== '' ? commFinal * 6 : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L36', 'IF(J36="","",J36*I36)', mathFinal !== '' ? mathFinal * 6 : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L37', 'IF(J37="","",J37*I37)', sciFinal !== '' ? sciFinal * 6 : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L38', 'IF(J38="","",J38*I38)', lcsFinal !== '' ? lcsFinal * 6 : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L39', 'IF(J39="","",J39*I39)', pklpFinal !== '' ? pklpFinal * 6 : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L41', 'IF(J41="","",J41*I41)', electiveFinal !== '' ? electiveFinal * 12 : '');

      // General Average (Row 42 across all 6 learning areas weighted by 42 total units)
      const modernLearningAreas = [commFinal, mathFinal, sciFinal, lcsFinal, pklpFinal, electiveFinal];
      const validPoints = [
        commFinal !== '' ? commFinal * 6 : null,
        mathFinal !== '' ? mathFinal * 6 : null,
        sciFinal !== '' ? sciFinal * 6 : null,
        lcsFinal !== '' ? lcsFinal * 6 : null,
        pklpFinal !== '' ? pklpFinal * 6 : null,
        electiveFinal !== '' ? electiveFinal * 12 : null,
      ].filter((p): p is number => p !== null && p > 0);

      const totalWeightedPoints = validPoints.length === 6 ? validPoints.reduce((a, b) => a + b, 0) : '';
      const modernGenAvg = totalWeightedPoints !== '' ? Math.round(totalWeightedPoints / 42) : '';
      const modernGenAvgRemarks = getGenAvgRemarks(modernGenAvg, modernLearningAreas);
      const isAcademicExcellence = modernGenAvgRemarks.includes('Academic Excellence');
      const k42Style = isAcademicExcellence ? style10Id : style12Id;

      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I42', 'SUM(I33:I39,I41)', 42);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'L42', 'SUM(L33:L41)', totalWeightedPoints !== '' ? totalWeightedPoints : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J42', 'IF(COUNT(J33,J36:J39,J41)<6,"",ROUND(L42/I42,0))', modernGenAvg !== '' ? modernGenAvg : '');
      sf9Xml = updateFormulaCellExplicit(
        sf9Xml,
        'K42',
        'IF(J42="","",IF(J42>=75,IF(AND(J42>=90,MIN(J33,J36:J39,J41)>=80),"Promoted with Academic Excellence Award","Promoted"),"Retained"))',
        modernGenAvgRemarks,
        k42Style
      );
      sf9Xml = sf9Xml.replace(
        /(<row\s+r="42"[^>]*?\s+ht=")[^"]*(")/,
        '$136$2'
      );

      // Attendance in SF9
      const sf9MonthCols = ['R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB']; // Jun to Apr (11 columns)
      if (attendance?.schoolDays && attendance.schoolDays.length > 0) {
        attendance.schoolDays.forEach((sd, idx) => {
          if (idx < sf9MonthCols.length && sd !== undefined && sd !== null && sd > 0) {
            sf9Xml = updateCellInSheetXml(sf9Xml, `${sf9MonthCols[idx]}5`, Number(sd));
          }
        });
        const totalClassDays = attendance.schoolDays.reduce((a, b) => a + (Number(b) || 0), 0);
        sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC5', 'SUM(R5:AB6)', totalClassDays > 0 ? totalClassDays : '');
      } else {
        sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC5', 'SUM(R5:AB6)', '');
      }

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
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC7', 'SUM(R7:AB8)', (totalPresent !== '' && totalPresent > 0) ? totalPresent : (totalPresent === 0 ? 0 : ''));

      sf9MonthCols.forEach((col, idx) => {
        const classDays = (attendance?.schoolDays && attendance.schoolDays[idx]) ? Number(attendance.schoolDays[idx]) : 0;
        const dpVal = (attendance?.daysPresent && attendance.daysPresent[idx] !== undefined && attendance.daysPresent[idx] !== null && attendance.daysPresent[idx] !== ('' as unknown as number))
          ? Number(attendance.daysPresent[idx])
          : null;
        const cachedAbsent = (dpVal !== null && classDays > 0)
          ? Math.max(0, classDays - dpVal)
          : '';
        sf9Xml = updateFormulaCellExplicit(sf9Xml, `${col}9`, `IF(${col}7="","",ABS(${col}5-${col}7))`, cachedAbsent);
      });
      const totalSchoolDaysNum = (attendance?.schoolDays && attendance.schoolDays.length > 0)
        ? attendance.schoolDays.reduce((a, b) => a + (Number(b) || 0), 0)
        : 0;
      const totalAbsent = attendance?.daysAbsent
        ? attendance.daysAbsent.reduce((a, b) => a + (Number(b) || 0), 0)
        : (totalSchoolDaysNum > 0 && typeof totalPresent === 'number' ? Math.max(0, totalSchoolDaysNum - totalPresent) : '');
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'AC9', 'ABS(AC5-AC7)', totalAbsent !== '' ? totalAbsent : '');
    } else {
      // Legacy Layout (Sheet 8 fallback where Final Grade is in Column I and General Average is in Row 43)
      const s8FormulaResults: Record<string, string | number> = {
        'F34': numOrEmpty(t1_s1),
        'G34': numOrEmpty(t2_s1),
        'H34': numOrEmpty(t3_s1),

        'F35': numOrEmpty(t1_s2),
        'G35': numOrEmpty(t2_s2),
        'H35': numOrEmpty(t3_s2),

        'F36': numOrEmpty(t1_s3),
        'G36': numOrEmpty(t2_s3),
        'H36': numOrEmpty(t3_s3),

        'F37': numOrEmpty(t1_s4),
        'G37': numOrEmpty(t2_s4),
        'H37': numOrEmpty(t3_s4),

        'F38': numOrEmpty(t1_s5),
        'G38': numOrEmpty(t2_s5),
        'H38': numOrEmpty(t3_s5),

        'F39': numOrEmpty(t1_s6),
        'G39': numOrEmpty(t2_s6),
        'H39': numOrEmpty(t3_s6),

        'F41': numOrEmpty(t1_s7),
        'G41': numOrEmpty(t2_s7),
        'H41': numOrEmpty(t3_s7),
      };

      // Parent Subject: Effective Communication / Mabisang Komunikasyon (Row 33)
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'F33', 'IF(COUNT(F34:F35)<2,"",ROUND(AVERAGE(F34:F35),0))', t1_comb);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'G33', 'IF(COUNT(G34:G35)<2,"",ROUND(AVERAGE(G34:G35),0))', t2_comb);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'H33', 'IF(COUNT(H34:H35)<2,"",ROUND(AVERAGE(H34:H35),0))', t3_comb);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I33', 'IF(COUNT(F33:H33)<3,"",ROUND(AVERAGE(F33:H33),0))', commFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J33', 'IF(I33="","",IF(I33>=75,"Passed","Failed"))', getRemarks(commFinal));

      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I34', 'IF(COUNT(F34:H34)<3,"",ROUND(AVERAGE(F34:H34),0))', calcFinalGrade([t1_s1, t2_s1, t3_s1]));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J34', 'IF(I34="","",IF(I34>=75,"Passed","Failed"))', getRemarks(calcFinalGrade([t1_s1, t2_s1, t3_s1])));

      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I35', 'IF(COUNT(F35:H35)<3,"",ROUND(AVERAGE(F35:H35),0))', calcFinalGrade([t1_s2, t2_s2, t3_s2]));
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J35', 'IF(I35="","",IF(I35>=75,"Passed","Failed"))', getRemarks(calcFinalGrade([t1_s2, t2_s2, t3_s2])));

      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I36', 'IF(COUNT(F36:H36)<3,"",ROUND(AVERAGE(F36:H36),0))', mathFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J36', 'IF(I36="","",IF(I36>=75,"Passed","Failed"))', getRemarks(mathFinal));

      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I37', 'IF(COUNT(F37:H37)<3,"",ROUND(AVERAGE(F37:H37),0))', sciFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J37', 'IF(I37="","",IF(I37>=75,"Passed","Failed"))', getRemarks(sciFinal));

      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I38', 'IF(COUNT(F38:H38)<3,"",ROUND(AVERAGE(F38:H38),0))', lcsFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J38', 'IF(I38="","",IF(I38>=75,"Passed","Failed"))', getRemarks(lcsFinal));

      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I39', 'IF(COUNT(F39:H39)<3,"",ROUND(AVERAGE(F39:H39),0))', pklpFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J39', 'IF(I39="","",IF(I39>=75,"Passed","Failed"))', getRemarks(pklpFinal));

      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'I41', 'IF(COUNT(F41:H41)<3,"",ROUND(AVERAGE(F41:H41),0))', electiveFinal);
      sf9Xml = updateFormulaCellExplicit(sf9Xml, 'J41', 'IF(I41="","",IF(I41>=75,"Passed","Failed"))', getRemarks(electiveFinal));

      const legacyLearningAreas = [commFinal, mathFinal, sciFinal, lcsFinal, pklpFinal, electiveFinal].filter((v): v is number => typeof v === 'number' && v > 0);
      const legacyGenAvg = legacyLearningAreas.length === 6 ? Math.round(legacyLearningAreas.reduce((a, b) => a + b, 0) / 6) : '';
      const legacyGenAvgRemarks = getGenAvgRemarks(legacyGenAvg, legacyLearningAreas);
      const isAcademicExcellence = legacyGenAvgRemarks.includes('Academic Excellence');
      const remarksStyleId = isAcademicExcellence ? style10Id : style12Id;

      sf9Xml = updateFormulaCellExplicit(
        sf9Xml,
        'I43',
        'IF(COUNT(I33,I36:I39,I41)<6,"",ROUND(AVERAGE(I33,I36:I39,I41),0))',
        legacyGenAvg !== '' ? legacyGenAvg : ''
      );
      sf9Xml = updateFormulaCellExplicit(
        sf9Xml,
        'J43',
        'IF(I43="","",IF(I43>=75,IF(AND(I43>=90,MIN(I33,I36:I39,I41)>=80),"Promoted with Academic Excellence Award","Promoted"),"Retained"))',
        legacyGenAvgRemarks,
        remarksStyleId
      );
      sf9Xml = updateCellInSheetXml(sf9Xml, 'K43', '', remarksStyleId);

      sf9Xml = sf9Xml.replace(
        /(<row\s+r="43"[^>]*?\s+ht=")[^"]*(")/,
        '$136$2'
      );

      // Attendance on legacy Sheet 8
      const sf9MonthCols = ['R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB'];
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

      sf9Xml = updateFormulaValuesBatch(sf9Xml, s8FormulaResults);
    }

    sf9Xml = updateFormulaValuesBatch(sf9Xml, sf9FormulaResults);
    sf9Xml = updateCellsBatch(sf9Xml, sf9Cells);

    zip.file(sf9SheetPath, sf9Xml);
  }

  // =========================================================================
  // EMBED OFFICIAL SCHOOL LOGO
  // Dynamically resolve drawing path from worksheet rels
  // =========================================================================
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

  await injectSchoolLogoIntoDrawing(
    zip,
    sf9DrawingPath,
    sf9DrawingRelsPath,
    schoolProfile?.logo_url
  );

  return await zip.generateAsync({ type: 'arraybuffer' });
}

/**
 * Export a section-wide Master Grade 11 Tech-Pro Workbook with all 8 sheets
 */
export async function exportSF9Grade11TechProSectionMasterToExcel(
  opts: Omit<SF9Grade11TechProExportOptions, 'student'> & { learners: StudentWithGrades[] }
): Promise<void> {
  const templateBuffer = await fetchGrade11TechProTemplateBuffer();
  const firstStudent = opts.learners[0] || {
    id: 'default-student',
    lrn: '',
    first_name: 'LEARNER',
    last_name: 'MASTER',
    grade_level: 'Grade 11',
    gender: 'Male',
  };

  const studentGrades = firstStudent.grades || opts.grades || {};

  const masterBuffer = await populateGrade11TechProTemplateBuffer(templateBuffer, {
    ...opts,
    student: firstStudent,
    grades: studentGrades,
    learners: opts.learners,
  });

  const blob = new Blob([masterBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeSection = (opts.section || 'SECTION').replace(/[^a-z0-9]/gi, '_');
  const safeSY = (opts.schoolYear || '2026-2027').replace(/[^a-z0-9]/gi, '_');
  a.download = `SF9_Grade11_TechPro_${safeSection}_SY_${safeSY}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
