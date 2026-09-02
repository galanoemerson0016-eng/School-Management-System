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
  value: string | number | undefined | null,
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
  const style12Id = '563';

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

  let style10Id = '563';
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

    if (style10Id === '563') {
      style10Id = String(xfItems.length);
      const newXf = `<xf numFmtId="3" fontId="${font10Index}" fillId="0" borderId="97" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>`;
      xfCount++;
      updatedStyles = updatedStyles.replace(
        cellXfsMatch[0],
        `<cellXfs count="${xfCount}"${xfsAttrs}>${xfsBody}${newXf}</cellXfs>`
      );
    }
  }

  // Fix style 244 (I43 General Average) alignment
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
 * Populate the Grade 11 Tech-Pro SF9 Template buffer with learner data and compute all 8 sheets
 */
export async function populateGrade11TechProTemplateBuffer(
  templateBuffer: ArrayBuffer | Uint8Array | ArrayLike<number>,
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
    relsXml = relsXml.replace(/<Relationship[^>]*?Target="calcChain\.xml"[^>]*?\/>/g, '');
    zip.file('xl/_rels/workbook.xml.rels', relsXml);
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
  const cleanDivision = schoolProfile?.division ? `${schoolProfile.division.replace(/^Schools Division of\s*/i, '')}` : 'Tarlac Province';
  const cleanDistrict = schoolProfile?.district || schoolProfile?.city || 'Victoria East District';
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
  let style10Id = '563';
  let style12Id = '563';
  if (stylesFile) {
    const stylesXml = await stylesFile.async('text');
    const res = ensureRemarksStyles(stylesXml);
    style10Id = res.style10Id;
    style12Id = res.style12Id;
    zip.file('xl/styles.xml', res.stylesXml);
  }

  // =========================================================================
  // SHEET 2: INPUT DATA
  // =========================================================================
  const sheet2File = zip.file('xl/worksheets/sheet2.xml');
  if (sheet2File) {
    let sheet2Xml = await sheet2File.async('text');

    const inputDataCells: Record<string, string | number> = {
      'F10': cleanRegion,
      'F11': cleanDivision,
      'F12': schoolProfile?.city || schoolProfile?.municipality || 'Victoria',
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

    // Male learners: rows 11 to 60 (L: Name, M: LRN, N: Birthdate)
    for (let i = 0; i < 50; i++) {
      const row = 11 + i;
      const s = maleStudents[i];
      inputDataCells[`L${row}`] = s ? formatLearnerName(s) : '';
      inputDataCells[`M${row}`] = s ? (s.lrn || '') : '';
      inputDataCells[`N${row}`] = s ? formatDateToMMDDYYYY(s.birthday) : '';
      inputStyles[`L${row}`] = '25';
      inputStyles[`M${row}`] = '26';
      inputStyles[`N${row}`] = '27';
    }

    // Female learners: rows 11 to 60 (Q: Name, R: LRN, S: Birthdate)
    for (let i = 0; i < 50; i++) {
      const row = 11 + i;
      const s = femaleStudents[i];
      inputDataCells[`Q${row}`] = s ? formatLearnerName(s) : '';
      inputDataCells[`R${row}`] = s ? (s.lrn || '') : '';
      inputDataCells[`S${row}`] = s ? formatDateToMMDDYYYY(s.birthday) : '';
      inputStyles[`Q${row}`] = '25';
      inputStyles[`R${row}`] = '26';
      inputStyles[`S${row}`] = '27';
    }

    sheet2Xml = updateCellsBatch(sheet2Xml, inputDataCells, inputStyles);
    zip.file('xl/worksheets/sheet2.xml', sheet2Xml);
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

      const numScores = [s1, s2, s3, s4, s5, s6, s7]
        .map(v => typeof v === 'number' ? v : parseFloat(String(v)))
        .filter(v => !isNaN(v) && v > 0);

      const rowAvg = numScores.length > 0
        ? Math.round(numScores.reduce((a, b) => a + b, 0) / numScores.length)
        : '';
      maleAverages.push(rowAvg);
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

      const numScores = [s1, s2, s3, s4, s5, s6, s7]
        .map(v => typeof v === 'number' ? v : parseFloat(String(v)))
        .filter(v => !isNaN(v) && v > 0);

      const rowAvg = numScores.length > 0
        ? Math.round(numScores.reduce((a, b) => a + b, 0) / numScores.length)
        : '';
      femaleAverages.push(rowAvg);
    }

    termAveragesMap.set(termIdx, { males: maleAverages, females: femaleAverages });
  }

  // =========================================================================
  // SHEETS 3, 4, 5: TERM 1 SUMMARY, TERM 2 SUMMARY, TERM 3 SUMMARY
  // Subject Column Mapping:
  //   Col K (Col 11): Effective Communication
  //   Col L (Col 12): Mabisang Komunikasyon
  //   Col M (Col 13): General Mathematics
  //   Col N (Col 14): General Science
  //   Col O (Col 15): Life and Career Skills
  //   Col P (Col 16): PKLP
  //   Col Q (Col 17): TechPro Elective 1 (AE 1)
  //   Col R (Col 18): General Average (lookup target)
  //   Col S (Col 19): Rank
  //
  // Row Mapping:
  //   Male:   rows 15 to 64
  //   Female: rows 66 to 115
  // =========================================================================
  const termSheetConfigs = [
    { sheetNum: 3, termIdx: 0, path: 'xl/worksheets/sheet3.xml' },
    { sheetNum: 4, termIdx: 1, path: 'xl/worksheets/sheet4.xml' },
    { sheetNum: 5, termIdx: 2, path: 'xl/worksheets/sheet5.xml' },
  ];

  for (const { termIdx, path } of termSheetConfigs) {
    const sFile = zip.file(path);
    if (!sFile) continue;
    let sXml = await sFile.async('text');

    // Adjust column 17 width and row 13 height so Q13 ("AE 1") fits and wraps nicely
    sXml = sXml.replace(
      /<col min="16" max="17" width="9.44140625" style="232" customWidth="1"\/>/g,
      '<col min="16" max="16" width="9.44140625" style="232" customWidth="1"/><col min="17" max="17" width="13.5" style="232" customWidth="1"/>'
    );
    sXml = sXml.replace(
      /(<row\s+r="13"[^>]*?\s+ht=")[^"]*(")/,
      '$128.5$2'
    );

    const termCells: Record<string, string | number> = {
      'Q13': 'AE 1',
    };
    const termFormulaResults: Record<string, string | number> = {};

    // Header updates on Summary sheets
    termFormulaResults['E5'] = cleanRegion;
    termFormulaResults['J5'] = cleanDivision;
    termFormulaResults['E6'] = cleanSchoolName;
    termFormulaResults['J6'] = cleanSchoolId;
    termFormulaResults['Q6'] = cleanSy;
    termFormulaResults['P6'] = cleanSy;
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
        termFormulaResults[`F${row}`] = '';
        termFormulaResults[`H${row}`] = '';
        termFormulaResults[`I${row}`] = '';
        termFormulaResults[`J${row}`] = '';
        termFormulaResults[`R${row}`] = '';
        termFormulaResults[`S${row}`] = '';
        return;
      }

      const learnerGrades = s.lrn === student.lrn
        ? currentGrades
        : extractGrade11TechProSubjectGrades(s.grades || {}, subjects);

      termFormulaResults[`C${row}`] = formatLearnerName(s);
      termFormulaResults[`F${row}`] = s.lrn || '';
      termFormulaResults[`H${row}`] = formatDateToMMDDYYYY(s.birthday);
      termFormulaResults[`I${row}`] = parseAge(s.age, s.birthday);
      termCells[`J${row}`] = isMaleRow ? 'M' : 'F';

      const s1 = learnerGrades.effectiveComm[termIdx] ?? '';
      const s2 = learnerGrades.mabisangKom[termIdx] ?? '';
      const s3 = learnerGrades.genMath[termIdx] ?? '';
      const s4 = learnerGrades.genSci[termIdx] ?? '';
      const s5 = learnerGrades.lifeCareer[termIdx] ?? '';
      const s6 = learnerGrades.pklp[termIdx] ?? '';
      const s7 = learnerGrades.techProElective1[termIdx] ?? '';

      if (s1 !== '') termCells[`K${row}`] = Number(s1);
      if (s2 !== '') termCells[`L${row}`] = Number(s2);
      if (s3 !== '') termCells[`M${row}`] = Number(s3);
      if (s4 !== '') termCells[`N${row}`] = Number(s4);
      if (s5 !== '') termCells[`O${row}`] = Number(s5);
      if (s6 !== '') termCells[`P${row}`] = Number(s6);
      if (s7 !== '') termCells[`Q${row}`] = Number(s7);

      const studentAvg = isMaleRow ? termAvgs.males[studentIdx] : termAvgs.females[studentIdx];
      if (studentAvg !== '') {
        termFormulaResults[`R${row}`] = studentAvg;
        termFormulaResults[`S${row}`] = getRank(studentAvg);
      }

      const lrnInputCol = isMaleRow ? 'M' : 'R';
      const bdayInputCol = isMaleRow ? 'N' : 'S';

      sXml = updateFormulaCellExplicit(
        sXml,
        `F${row}`,
        `IF('INPUT DATA'!${lrnInputCol}${11 + studentIdx}="","",'INPUT DATA'!${lrnInputCol}${11 + studentIdx})`,
        s ? (s.lrn || '') : ''
      );
      sXml = updateFormulaCellExplicit(
        sXml,
        `H${row}`,
        `IF('INPUT DATA'!${bdayInputCol}${11 + studentIdx}="","",'INPUT DATA'!${bdayInputCol}${11 + studentIdx})`,
        s ? formatDateToMMDDYYYY(s.birthday) : ''
      );
      sXml = updateFormulaCellExplicit(
        sXml,
        `I${row}`,
        `IF(H${row}="","",DATEDIF(H${row},TODAY(),"Y"))`,
        s ? parseAge(s.age, s.birthday) : ''
      );
    };

    // Populate male learners (rows 15 to 64)
    for (let idx = 0; idx < 50; idx++) {
      populateLearnerTermRow(maleStudents[idx], 15 + idx, true, idx);
    }

    // Populate female learners (rows 66 to 115)
    for (let idx = 0; idx < 50; idx++) {
      populateLearnerTermRow(femaleStudents[idx], 66 + idx, false, idx);
    }

    sXml = updateFormulaValuesBatch(sXml, termFormulaResults);
    sXml = updateCellsBatch(sXml, termCells);
    zip.file(path, sXml);
  }

  // =========================================================================
  // SHEET 6: FINAL GRADE SUMMARY
  // Populates final grades for all 3 terms, Final General Average, and Final Rank
  // =========================================================================
  const sheet6File = zip.file('xl/worksheets/sheet6.xml');
  if (sheet6File) {
    let sheet6Xml = await sheet6File.async('text');

    const sheet6FormulaResults: Record<string, string | number> = {
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

    // Populate male learners (rows 15 to 64)
    for (let idx = 0; idx < 50; idx++) {
      const row = 15 + idx;
      const m = maleStudents[idx];
      sheet6FormulaResults[`C${row}`] = m ? formatLearnerName(m) : '';
      const t1 = termAveragesMap.get(0)!.males[idx];
      const t2 = termAveragesMap.get(1)!.males[idx];
      const t3 = termAveragesMap.get(2)!.males[idx];
      const finalGA = maleFinalGAs[idx];
      sheet6FormulaResults[`F${row}`] = t1 !== '' ? t1 : '';
      sheet6FormulaResults[`J${row}`] = t2 !== '' ? t2 : '';
      sheet6FormulaResults[`M${row}`] = t3 !== '' ? t3 : '';
      sheet6FormulaResults[`P${row}`] = finalGA !== '' ? finalGA : '';
      sheet6FormulaResults[`S${row}`] = finalGA !== '' ? getFinalRank(finalGA) : '';

      sheet6Xml = updateFormulaCellExplicit(
        sheet6Xml,
        `F${row}`,
        `IF(TRIM(C${row})="","",IFERROR(_xlfn.XLOOKUP(TRIM(C${row}),'TERM 1 SUMMARY'!$C$15:$C$115,'TERM 1 SUMMARY'!$R$15:$R$115),""))`,
        t1 !== '' ? t1 : ''
      );
      sheet6Xml = updateFormulaCellExplicit(
        sheet6Xml,
        `J${row}`,
        `IF(TRIM(C${row})="","",IFERROR(_xlfn.XLOOKUP(TRIM(C${row}),'TERM 2 SUMMARY'!$C$15:$C$115,'TERM 2 SUMMARY'!$R$15:$R$115),""))`,
        t2 !== '' ? t2 : ''
      );
      sheet6Xml = updateFormulaCellExplicit(
        sheet6Xml,
        `M${row}`,
        `IF(TRIM(C${row})="","",IFERROR(_xlfn.XLOOKUP(TRIM(C${row}),'TERM 3 SUMMARY'!$C$15:$C$115,'TERM 3 SUMMARY'!$R$15:$R$115),""))`,
        t3 !== '' ? t3 : ''
      );
      sheet6Xml = updateFormulaCellExplicit(
        sheet6Xml,
        `P${row}`,
        `IF(C${row}="","",IF(COUNT(F${row},J${row},M${row})<3,"",ROUND(AVERAGE(F${row},J${row},M${row}),0)))`,
        finalGA !== '' ? finalGA : ''
      );
      sheet6Xml = updateFormulaCellExplicit(
        sheet6Xml,
        `S${row}`,
        `IF(P${row}="","",_xlfn.RANK.AVG(P${row},$P$15:$P$115))`,
        finalGA !== '' ? getFinalRank(finalGA) : ''
      );
    }

    // Populate female learners (rows 66 to 115)
    for (let idx = 0; idx < 50; idx++) {
      const row = 66 + idx;
      const f = femaleStudents[idx];
      sheet6FormulaResults[`C${row}`] = f ? formatLearnerName(f) : '';
      const t1 = termAveragesMap.get(0)!.females[idx];
      const t2 = termAveragesMap.get(1)!.females[idx];
      const t3 = termAveragesMap.get(2)!.females[idx];
      const finalGA = femaleFinalGAs[idx];
      sheet6FormulaResults[`F${row}`] = t1 !== '' ? t1 : '';
      sheet6FormulaResults[`J${row}`] = t2 !== '' ? t2 : '';
      sheet6FormulaResults[`M${row}`] = t3 !== '' ? t3 : '';
      sheet6FormulaResults[`P${row}`] = finalGA !== '' ? finalGA : '';
      sheet6FormulaResults[`S${row}`] = finalGA !== '' ? getFinalRank(finalGA) : '';

      sheet6Xml = updateFormulaCellExplicit(
        sheet6Xml,
        `F${row}`,
        `IF(TRIM(C${row})="","",IFERROR(_xlfn.XLOOKUP(TRIM(C${row}),'TERM 1 SUMMARY'!$C$15:$C$115,'TERM 1 SUMMARY'!$R$15:$R$115),""))`,
        t1 !== '' ? t1 : ''
      );
      sheet6Xml = updateFormulaCellExplicit(
        sheet6Xml,
        `J${row}`,
        `IF(TRIM(C${row})="","",IFERROR(_xlfn.XLOOKUP(TRIM(C${row}),'TERM 2 SUMMARY'!$C$15:$C$115,'TERM 2 SUMMARY'!$R$15:$R$115),""))`,
        t2 !== '' ? t2 : ''
      );
      sheet6Xml = updateFormulaCellExplicit(
        sheet6Xml,
        `M${row}`,
        `IF(TRIM(C${row})="","",IFERROR(_xlfn.XLOOKUP(TRIM(C${row}),'TERM 3 SUMMARY'!$C$15:$C$115,'TERM 3 SUMMARY'!$R$15:$R$115),""))`,
        t3 !== '' ? t3 : ''
      );
      sheet6Xml = updateFormulaCellExplicit(
        sheet6Xml,
        `P${row}`,
        `IF(C${row}="","",IF(COUNT(F${row},J${row},M${row})<3,"",ROUND(AVERAGE(F${row},J${row},M${row}),0)))`,
        finalGA !== '' ? finalGA : ''
      );
      sheet6Xml = updateFormulaCellExplicit(
        sheet6Xml,
        `S${row}`,
        `IF(P${row}="","",_xlfn.RANK.AVG(P${row},$P$15:$P$115))`,
        finalGA !== '' ? getFinalRank(finalGA) : ''
      );
    }

    // Populate female learners (rows 66 to 115)
    for (let idx = 0; idx < 50; idx++) {
      const row = 66 + idx;
      const f = femaleStudents[idx];
      sheet6FormulaResults[`C${row}`] = f ? formatLearnerName(f) : '';
      const t1 = termAveragesMap.get(0)!.females[idx];
      const t2 = termAveragesMap.get(1)!.females[idx];
      const t3 = termAveragesMap.get(2)!.females[idx];
      const finalGA = femaleFinalGAs[idx];
      sheet6FormulaResults[`D${row}`] = t1 !== '' ? t1 : '';
      sheet6FormulaResults[`G${row}`] = t2 !== '' ? t2 : '';
      sheet6FormulaResults[`K${row}`] = t3 !== '' ? t3 : '';
      sheet6FormulaResults[`N${row}`] = finalGA !== '' ? finalGA : '';
      sheet6FormulaResults[`Q${row}`] = finalGA !== '' ? getFinalRank(finalGA) : '';
    }

    sheet6Xml = updateFormulaValuesBatch(sheet6Xml, sheet6FormulaResults);
    zip.file('xl/worksheets/sheet6.xml', sheet6Xml);
  }

  // =========================================================================
  // SHEET 7: ATTENDANCE
  // Monthly class days, days present, and days absent for male & female students
  // =========================================================================
  const sheet7File = zip.file('xl/worksheets/sheet7.xml');
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
        }
      });
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
    zip.file('xl/worksheets/sheet7.xml', sheet7Xml);
  }

  // =========================================================================
  // SHEET 8: SF9 FRONT & BACK (Learner's Performance Report Card)
  //
  // Row Mapping:
  //   Row 33: Effective Communication / Mabisang Komunikasyon
  //   Row 34: Effective Communication
  //   Row 35: Mabisang Komunikasyon
  //   Row 36: General Mathematics
  //   Row 37: General Science
  //   Row 38: Life and Career Skills
  //   Row 39: Pag-aaral ng Kasaysayan at Lipunang Pilipino (PKLP)
  //   Row 40: Header: Elective Subjects
  //   Row 41: TechPro Elective 1 (Elective title)
  //   Row 42: Spacer
  //   Row 43: General Average
  //
  // Columns:
  //   F = Term 1, G = Term 2, H = Term 3, I = Final Grade, J:K = Remarks
  // =========================================================================
  const sheet8File = zip.file('xl/worksheets/sheet8.xml');
  if (sheet8File) {
    let sheet8Xml = await sheet8File.async('text');

    // Calculated Age
    const calculatedAge = student.age || (() => {
      if (!student.birthday) return '';
      const b = new Date(student.birthday);
      if (isNaN(b.getTime())) return '';
      const now = new Date();
      let diff = now.getFullYear() - b.getFullYear();
      const m = now.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < b.getDate())) diff--;
      return diff >= 0 ? diff : '';
    })();

    // 1. Header & Student Info
    const sf8Cells: Record<string, string | number> = {
      'C17': currentStudentName,
      'B41': elective1Title, // Update Elective 1 subject title on report card in B41
    };

    const sf8FormulaResults: Record<string, string | number> = {
      'C18': student.lrn || '',
      'I17': calculatedAge,
      'K17': isMale ? 'M' : 'F',
      'I18': 11,
      'K18': section || '',
    };

    // Replace #REF! cells with valid formulas and values in Sheet 8 Header
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B7', "'INPUT DATA'!F10", cleanRegion);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B8', "'INPUT DATA'!F11", cleanDivision);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B9', "'INPUT DATA'!F13", cleanDistrict);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B10', "'INPUT DATA'!F15", cleanSchoolId);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B12', "'INPUT DATA'!F16", cleanSchoolName);
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'B15', `School Year ${cleanSy}`);
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'A12', '');
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'A15', '');
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'K18', "'TERM 1 SUMMARY'!N9", cleanSection);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'C19', '', '');
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'C19', '');
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'E19', "'INPUT DATA'!F28", cleanTrack);
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'A41', '');
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'B41', elective1Title);

    // Signatures: A27 is an empty margin cell with NO formula.
    // School Head is in B27 (merged B27:F27), Adviser is in H27 (merged H27:K27).
    sf8FormulaResults['B27'] = cleanPrincipal;
    sf8FormulaResults['H27'] = cleanAdviser;
    sf8FormulaResults['X39'] = cleanAdviser;
    sf8FormulaResults['Q41'] = cleanPrincipal;
    sf8FormulaResults['J50'] = cleanPrincipal;
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'A27', '', '');
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'A27', '');
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'B27', "'INPUT DATA'!F19", cleanPrincipal);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'H27', "'INPUT DATA'!F26", cleanAdviser);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'X39', "'INPUT DATA'!F26", cleanAdviser);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'Q41', "'INPUT DATA'!F19", cleanPrincipal);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'J50', "'INPUT DATA'!F19", cleanPrincipal);

    // Pre-evaluate subject quarterly grades
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

    // Cache quarterly cell results
    const setTermCellResult = (cell: string, val: number | string) => {
      if (val !== '') {
        const num = Number(val);
        sf8FormulaResults[cell] = !isNaN(num) ? num : val;
      } else {
        sf8FormulaResults[cell] = '';
      }
    };

    setTermCellResult('F34', t1_s1);
    setTermCellResult('G34', t2_s1);
    setTermCellResult('H34', t3_s1);

    setTermCellResult('F35', t1_s2);
    setTermCellResult('G35', t2_s2);
    setTermCellResult('H35', t3_s2);

    setTermCellResult('F36', t1_s3);
    setTermCellResult('G36', t2_s3);
    setTermCellResult('H36', t3_s3);

    setTermCellResult('F37', t1_s4);
    setTermCellResult('G37', t2_s4);
    setTermCellResult('H37', t3_s4);

    setTermCellResult('F38', t1_s5);
    setTermCellResult('G38', t2_s5);
    setTermCellResult('H38', t3_s5);

    setTermCellResult('F39', t1_s6);
    setTermCellResult('G39', t2_s6);
    setTermCellResult('H39', t3_s6);

    setTermCellResult('F41', t1_s7);
    setTermCellResult('G41', t2_s7);
    setTermCellResult('H41', t3_s7);

    // Compute Term Averages for Combined Learning Area 1 (Effective Comm / Mabisang Kom) on Row 33
    const computeTermComb = (a: number | string, b: number | string) => {
      const numA = typeof a === 'number' ? a : parseFloat(String(a));
      const numB = typeof b === 'number' ? b : parseFloat(String(b));
      if (!isNaN(numA) && !isNaN(numB)) return Math.round((numA + numB) / 2);
      return '';
    };

    const t1_comb = computeTermComb(t1_s1, t1_s2);
    const t2_comb = computeTermComb(t2_s1, t2_s2);
    const t3_comb = computeTermComb(t3_s1, t3_s2);

    // Write Explicit Formulas for Combined Learning Area 1 (Row 33)
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'F33', 'IF(COUNT(F34:F35)<2,"",ROUND(AVERAGE(F34:F35),0))', t1_comb);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'G33', 'IF(COUNT(G34:G35)<2,"",ROUND(AVERAGE(G34:G35),0))', t2_comb);
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'H33', 'IF(COUNT(H34:H35)<2,"",ROUND(AVERAGE(H34:H35),0))', t3_comb);

    // Compute Final Grade & Remarks for each learning area (shown ONLY if ALL 3 term grades are complete)
    const computeFinalAndRemarks = (
      fCell: string,
      jCell: string,
      terms: (number | string)[],
      termsRange: string
    ): { finalGrade: number | ''; remarks: string } => {
      const nums = terms.map(v => typeof v === 'number' ? v : parseFloat(String(v))).filter(v => !isNaN(v));
      const formula = `IF(COUNT(${termsRange})<3,"",ROUND(AVERAGE(${termsRange}),0))`;
      const remFormula = `IF(${fCell}="","",IF(${fCell}>=75,"Passed","Failed"))`;
      if (nums.length < 3) {
        sheet8Xml = updateFormulaCellExplicit(sheet8Xml, fCell, formula, '');
        sheet8Xml = updateFormulaCellExplicit(sheet8Xml, jCell, remFormula, '');
        return { finalGrade: '', remarks: '' };
      }
      const finalVal = Math.round(nums.reduce((a, b) => a + b, 0) / 3);
      const rem = finalVal >= 75 ? 'Passed' : 'Failed';
      sheet8Xml = updateFormulaCellExplicit(sheet8Xml, fCell, formula, finalVal);
      sheet8Xml = updateFormulaCellExplicit(sheet8Xml, jCell, remFormula, rem);
      return { finalGrade: finalVal, remarks: rem };
    };

    const res_comb = computeFinalAndRemarks('I33', 'J33', [t1_comb, t2_comb, t3_comb], 'F33:H33');
    computeFinalAndRemarks('I34', 'J34', [t1_s1, t2_s1, t3_s1], 'F34:H34');
    computeFinalAndRemarks('I35', 'J35', [t1_s2, t2_s2, t3_s2], 'F35:H35');
    const res_s3 = computeFinalAndRemarks('I36', 'J36', [t1_s3, t2_s3, t3_s3], 'F36:H36');
    const res_s4 = computeFinalAndRemarks('I37', 'J37', [t1_s4, t2_s4, t3_s4], 'F37:H37');
    const res_s5 = computeFinalAndRemarks('I38', 'J38', [t1_s5, t2_s5, t3_s5], 'F38:H38');
    const res_s6 = computeFinalAndRemarks('I39', 'J39', [t1_s6, t2_s6, t3_s6], 'F39:H39');
    const res_s7 = computeFinalAndRemarks('I41', 'J41', [t1_s7, t2_s7, t3_s7], 'F41:H41');

    // Compute General Average across the 6 Learning Areas ONLY if ALL 6 are complete:
    // Rows 33 (Combined EffComm/MabKom), 36 (GenMath), 37 (GenSci), 38 (LifeCareer), 39 (PKLP), 41 (TechPro Elective 1)
    const learningAreaFinals = [
      res_comb.finalGrade,
      res_s3.finalGrade,
      res_s4.finalGrade,
      res_s5.finalGrade,
      res_s6.finalGrade,
      res_s7.finalGrade
    ].filter((v): v is number => typeof v === 'number');

    let generalAverageVal: number | '' = '';
    let generalRemarksVal = '';
    let isAcademicExcellence = false;

    if (learningAreaFinals.length === 6) {
      generalAverageVal = Math.round(learningAreaFinals.reduce((a, b) => a + b, 0) / 6);
      const minGrade = Math.min(...learningAreaFinals);

      // DepEd Order No. 15, s. 2026 Academic Excellence criteria
      if (generalAverageVal >= 75) {
        if (generalAverageVal >= 90 && minGrade >= 85) {
          generalRemarksVal = 'Promoted with Academic Excellence Award';
          isAcademicExcellence = true;
        } else {
          generalRemarksVal = 'Promoted';
        }
      } else {
        generalRemarksVal = 'Retained';
      }
    }

    // Set General Average Formula and Remarks on Row 43 (shown ONLY if ALL 6 learning areas are complete)
    const gaFormula = 'IF(COUNT(I33,I36:I39,I41)<6,"",ROUND(AVERAGE(I33,I36:I39,I41),0))';
    const gaRemarksFormula = 'IF(I43="","",IF(I43>=75,IF(AND(I43>=90,MIN(I33,I36:I39,I41)>=85),"Promoted with Academic Excellence Award","Promoted"),"Retained"))';

    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'I43', gaFormula, generalAverageVal);

    // Style 12pt (style12Id): 12pt centered for Promoted/Retained.
    // Style 10pt (style10Id): 10pt centered for Promoted with Academic Excellence Award with wrapText=1.
    const remarksStyleId = isAcademicExcellence ? style10Id : style12Id;
    sheet8Xml = updateFormulaCellExplicit(sheet8Xml, 'J43', gaRemarksFormula, generalRemarksVal, remarksStyleId);
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'K43', '', remarksStyleId);

    // Set row 43 height to 36 so wrapped text fits comfortably and borders are never clipped
    sheet8Xml = sheet8Xml.replace(
      /(<row\s+r="43"[^>]*?\s+ht=")[^"]*(")/,
      '$136$2'
    );

    // TechPro Elective 1 Remarks (J41 & K41) non-bold style 577 while preserving formula
    sheet8Xml = updateFormulaCellExplicit(
      sheet8Xml,
      'J41',
      'IF(I41="","",IF(I41>=75,"Passed","Failed"))',
      res_s7.remarks,
      '577'
    );
    sheet8Xml = updateCellInSheetXml(sheet8Xml, 'K41', '', '577');

    // Sheet 8 Attendance Table
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

    sheet8Xml = updateFormulaValuesBatch(sheet8Xml, sf8FormulaResults);
    sheet8Xml = updateCellsBatch(sheet8Xml, sf8Cells);

    zip.file('xl/worksheets/sheet8.xml', sheet8Xml);
  }

  // =========================================================================
  // EMBED OFFICIAL SCHOOL LOGO
  // Replace placeholder Shape 4 in drawing8.xml
  // =========================================================================
  await injectSchoolLogoIntoDrawing(
    zip,
    'xl/drawings/drawing8.xml',
    'xl/drawings/_rels/drawing8.xml.rels',
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
