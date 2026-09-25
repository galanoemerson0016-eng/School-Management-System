/**
 * SF9 Grade 12 Academic with Cross-Specialization Excel Export Service
 * Populates the official DepEd Grade 12 Academic with Cross SF9 template
 * (G12 Academic with Cross School Form 9 (SY 26-27).xlsx)
 * preserving all 6 worksheets, OpenXML styles, formulas, drawing relationships,
 * and calculations for 8 Academic Electives (3 units each) + 1 TechPro Elective (12 units)
 * totaling 36 units and General Average on Row 41.
 */

import JSZip from 'jszip';
import type { Student, SchoolProfile, Subject } from '../types';
import { formatLearnerName } from '../utils/student-name';
import { calculateWeightedGradeAverage } from './grade-calculation';

export interface SF9Grade12AcademicCrossExportOptions {
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

export function isGrade12AcademicCross(gradeLevel: string | undefined | null, track?: string | undefined | null): boolean {
  if (!gradeLevel) return false;
  const s = gradeLevel.trim().toLowerCase();

  // Must be Grade 12
  const isG12 = /\b(?:grade\s*12|g12|12)\b/i.test(s);
  if (!isG12) return false;

  // Track check: default to Academic if not specified or contains academic
  if (!track) return true;
  const t = track.trim().toLowerCase();
  if (
    (t.includes('tech') || t.includes('tvet') || t.includes('tvl')) &&
    !t.includes('acad')
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

export async function fetchGrade12AcademicCrossTemplateBuffer(): Promise<ArrayBuffer> {
  const cleanBase = (import.meta.env.BASE_URL || '/').endsWith('/')
    ? (import.meta.env.BASE_URL || '/')
    : `${import.meta.env.BASE_URL}/`;
  const timestamp = Date.now();

  const candidateUrls = [
    `${cleanBase}templates/G12 Academic with Cross School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `/templates/G12 Academic with Cross School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `templates/G12 Academic with Cross School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `${cleanBase}templates/G12%20Academic%20with%20Cross%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
    `/templates/G12%20Academic%20with%20Cross%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
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

  throw new Error('Official DepEd Grade 12 Academic with Cross School Form 9 template not found in public/templates.');
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

export interface Grade12AcademicCrossGrades {
  // Term 1 Electives (3 units each)
  ae4: number | '';
  ae4Name: string;
  ae5: number | '';
  ae5Name: string;
  ae6: number | '';
  ae6Name: string;
  ae7: number | '';
  ae7Name: string;

  // Term 2 Electives (3 units each)
  ae8: number | '';
  ae8Name: string;
  ae9: number | '';
  ae9Name: string;
  ae10: number | '';
  ae10Name: string;
  ae11: number | '';
  ae11Name: string;

  // Term 3 TechPro Elective 1 (12 units)
  tp1: number | '';
  tp1Name: string;

  // General Average & Honors
  generalAverage: number | '';
  remarks: string;
  honors: string;
}

/**
 * Extracts scores and names for Grade 12 Academic with Cross-Specialization:
 * 8 Academic Electives:
 *   Term 1: AE 4, AE 5, AE 6, AE 7 (3 units each)
 *   Term 2: AE 8, AE 9, AE 10, AE 11 (3 units each)
 * 1 TechPro Elective:
 *   Term 3: TechPro Elective 1 (12 units)
 */
export function extractGrade12AcademicCrossGrades(
  gradesRecord: Record<string, unknown> = {},
  subjectsList: Subject[] = []
): Grade12AcademicCrossGrades {
  const getSubjectInfo = (predicate: (name: string, code: string, normName: string) => boolean) => {
    let matchedName = '';
    const scores: (number | '')[] = ['', '', ''];

    for (const [key, entry] of Object.entries(gradesRecord)) {
      const sub = subjectsList.find(s => s.id === key || (s.subject_name || '').toLowerCase() === key.toLowerCase());
      const rawName = sub ? sub.subject_name : key;
      const code = sub?.subject_code || '';
      const norm = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (predicate(rawName, code, norm)) {
        matchedName = rawName;
        scores[0] = getGradeFromEntry(entry, 0);
        scores[1] = getGradeFromEntry(entry, 1);
        scores[2] = getGradeFromEntry(entry, 2);
        break;
      }
    }
    return { matchedName, scores };
  };

  // 1. Explicit Academic Electives (AE4 to AE11)
  const ae4Info = getSubjectInfo((_n, _c, norm) => norm === 'academicelective4' || norm === 'ae4' || norm.includes('elective4'));
  const ae5Info = getSubjectInfo((_n, _c, norm) => norm === 'academicelective5' || norm === 'ae5' || norm.includes('elective5'));
  const ae6Info = getSubjectInfo((_n, _c, norm) => norm === 'academicelective6' || norm === 'ae6' || norm.includes('elective6'));
  const ae7Info = getSubjectInfo((_n, _c, norm) => norm === 'academicelective7' || norm === 'ae7' || norm.includes('elective7'));

  const ae8Info = getSubjectInfo((_n, _c, norm) => norm === 'academicelective8' || norm === 'ae8' || norm.includes('elective8'));
  const ae9Info = getSubjectInfo((_n, _c, norm) => norm === 'academicelective9' || norm === 'ae9' || norm.includes('elective9'));
  const ae10Info = getSubjectInfo((_n, _c, norm) => norm === 'academicelective10' || norm === 'ae10' || norm.includes('elective10'));
  const ae11Info = getSubjectInfo((_n, _c, norm) => norm === 'academicelective11' || norm === 'ae11' || norm.includes('elective11'));

  // 2. TechPro Elective 1
  const tp1Info = getSubjectInfo((_n, _c, norm) =>
    norm === 'techproelective1' ||
    norm === 'tp1' ||
    norm === 'techpro1' ||
    norm.includes('techpro') ||
    norm.includes('workimmersion') ||
    norm.includes('immersion') ||
    norm.includes('specialization')
  );

  let ae4: number | '' = ae4Info.scores[0];
  let ae5: number | '' = ae5Info.scores[0];
  let ae6: number | '' = ae6Info.scores[0];
  let ae7: number | '' = ae7Info.scores[0];

  let ae8: number | '' = ae8Info.scores[1];
  let ae9: number | '' = ae9Info.scores[1];
  let ae10: number | '' = ae10Info.scores[1];
  let ae11: number | '' = ae11Info.scores[1];

  let tp1: number | '' = tp1Info.scores[2] || tp1Info.scores[0];

  let ae4Name = ae4Info.matchedName;
  let ae5Name = ae5Info.matchedName;
  let ae6Name = ae6Info.matchedName;
  let ae7Name = ae7Info.matchedName;

  let ae8Name = ae8Info.matchedName;
  let ae9Name = ae9Info.matchedName;
  let ae10Name = ae10Info.matchedName;
  let ae11Name = ae11Info.matchedName;

  let tp1Name = tp1Info.matchedName;

  // Fallback: If electives are arbitrary subject names, group by term or sequence
  const matchedKeys = new Set([
    ae4Name, ae5Name, ae6Name, ae7Name,
    ae8Name, ae9Name, ae10Name, ae11Name,
    tp1Name
  ].filter(Boolean).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '')));

  const remainingKeys: string[] = [];
  for (const key of Object.keys(gradesRecord)) {
    const norm = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!matchedKeys.has(norm)) {
      remainingKeys.push(key);
    }
  }

  const getDisplayName = (key: string) => {
    const sub = subjectsList.find(s => s.id === key || (s.subject_name || '').toLowerCase() === key.toLowerCase());
    return sub ? (sub.subject_name || key) : key;
  };

  // Check if any remaining is TechPro / Immersion
  if (tp1 === '') {
    const tpKey = remainingKeys.find(k => {
      const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return norm.includes('tech') || norm.includes('immersion') || norm.includes('tvl') || norm.includes('drafting');
    });
    if (tpKey) {
      const entry = gradesRecord[tpKey];
      tp1 = getGradeFromEntry(entry, 2) || getGradeFromEntry(entry, 0);
      tp1Name = getDisplayName(tpKey);
      const idx = remainingKeys.indexOf(tpKey);
      if (idx !== -1) remainingKeys.splice(idx, 1);
    }
  }

  // Fill remaining slots in Term 1 (slots 1..4) and Term 2 (slots 5..8)
  const fillSlot = (currentVal: number | '', currentName: string, slotQuarter: number) => {
    if (currentVal !== '') return { val: currentVal, name: currentName };
    if (remainingKeys.length === 0) return { val: '' as const, name: currentName };
    const nextKey = remainingKeys.shift()!;
    const entry = gradesRecord[nextKey];
    const score = getGradeFromEntry(entry, slotQuarter) || getGradeFromEntry(entry, 0);
    const numScore = typeof score === 'number' ? score : (score ? Number(score) : '');
    const validScore: number | '' = typeof numScore === 'number' && !isNaN(numScore) ? numScore : '';
    return { val: validScore, name: getDisplayName(nextKey) };
  };

  const s4 = fillSlot(ae4, ae4Name, 0); ae4 = s4.val; ae4Name = s4.name;
  const s5 = fillSlot(ae5, ae5Name, 0); ae5 = s5.val; ae5Name = s5.name;
  const s6 = fillSlot(ae6, ae6Name, 0); ae6 = s6.val; ae6Name = s6.name;
  const s7 = fillSlot(ae7, ae7Name, 0); ae7 = s7.val; ae7Name = s7.name;

  const s8 = fillSlot(ae8, ae8Name, 1); ae8 = s8.val; ae8Name = s8.name;
  const s9 = fillSlot(ae9, ae9Name, 1); ae9 = s9.val; ae9Name = s9.name;
  const s10 = fillSlot(ae10, ae10Name, 1); ae10 = s10.val; ae10Name = s10.name;
  const s11 = fillSlot(ae11, ae11Name, 1); ae11 = s11.val; ae11Name = s11.name;

  if (tp1 === '' && remainingKeys.length > 0) {
    const sTp = fillSlot(tp1, tp1Name, 2);
    tp1 = sTp.val;
    tp1Name = sTp.name;
  }

  // Calculate General Average based on 36 Total Units
  // 8 Academic Electives * 3 units = 24 units
  // 1 TechPro Elective * 12 units = 12 units
  // Total = 36 units
  const items: { grade: number | ''; units: number }[] = [
    { grade: ae4, units: 3 },
    { grade: ae5, units: 3 },
    { grade: ae6, units: 3 },
    { grade: ae7, units: 3 },
    { grade: ae8, units: 3 },
    { grade: ae9, units: 3 },
    { grade: ae10, units: 3 },
    { grade: ae11, units: 3 },
    { grade: tp1, units: 12 }
  ];

  const averageEntries: Array<{ grade: number; weight: number }> = [];
  let hasAnyGrade = false;
  let allPassed = true;
  let minGrade = 100;

  for (const it of items) {
    if (typeof it.grade === 'number' && it.grade > 0) {
      hasAnyGrade = true;
      averageEntries.push({ grade: it.grade, weight: it.units });
      if (it.grade < 75) allPassed = false;
      if (it.grade < minGrade) minGrade = it.grade;
    }
  }

  let generalAverage: number | '' = '';
  let remarks = '';
  let honors = '';

  const weightedAverage = calculateWeightedGradeAverage(averageEntries);
  if (hasAnyGrade && weightedAverage !== null) {
    generalAverage = Math.round(weightedAverage);
    remarks = generalAverage >= 75 && allPassed ? 'Passed' : (generalAverage < 75 ? 'Failed' : 'Passed');

    // DO 15, s. 2026 Academic Excellence criteria
    if (generalAverage >= 90 && minGrade >= 80) {
      if (generalAverage >= 98) honors = 'With Highest Honors';
      else if (generalAverage >= 95) honors = 'With High Honors';
      else honors = 'With Honors';
    }
  }

  return {
    ae4, ae4Name: ae4Name || 'Academic Elective 4',
    ae5, ae5Name: ae5Name || 'Academic Elective 5',
    ae6, ae6Name: ae6Name || 'Academic Elective 6',
    ae7, ae7Name: ae7Name || 'Academic Elective 7',
    ae8, ae8Name: ae8Name || 'Academic Elective 8',
    ae9, ae9Name: ae9Name || 'Academic Elective 9',
    ae10, ae10Name: ae10Name || 'Academic Elective 10',
    ae11, ae11Name: ae11Name || 'Academic Elective 11',
    tp1, tp1Name: tp1Name || 'TechPro Elective 1',
    generalAverage,
    remarks,
    honors
  };
}

export interface SheetInfo {
  name: string;
  sheetId: string;
  rId: string;
  path: string;
}

export async function getWorkbookSheetMap(zip: JSZip): Promise<SheetInfo[]> {
  const wbFile = zip.file('xl/workbook.xml');
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (!wbFile || !relsFile) return [];

  const wbXml = await wbFile.async('text');
  const relsXml = await relsFile.async('text');

  const sheets: SheetInfo[] = [];
  const sheetMatches = wbXml.matchAll(/<sheet [^>]*name="([^"]+)"[^>]*sheetId="([^"]+)"[^>]*r:id="([^"]+)"/g);
  for (const m of sheetMatches) {
    const name = m[1];
    const sheetId = m[2];
    const rId = m[3];
    const relMatch = relsXml.match(new RegExp(`Id="${rId}"[^>]*Target="([^"]+)"`));
    const target = relMatch ? relMatch[1] : `worksheets/sheet${sheetId}.xml`;
    const cleanTarget = target.startsWith('/') ? target.substring(1) : target.startsWith('xl/') ? target : `xl/${target}`;
    sheets.push({ name, sheetId, rId, path: cleanTarget });
  }
  return sheets;
}

function updateCellInSheetXml(
  sheetXml: string,
  cellRef: string,
  newVal: unknown,
  formula?: string,
  explicitStyle?: string
): string {
  const cellRegex = new RegExp(`(<c\\b[^>]*?\\br="${cellRef}"[^>]*?)(?:/>|>(.*?)</c>)`, 's');
  const match = sheetXml.match(cellRegex);

  const isFormula = formula !== undefined && formula !== null && formula !== '';
  const isNumber = typeof newVal === 'number' && !isNaN(newVal);
  const isBlank = newVal === '' || newVal === undefined || newVal === null;
  const strVal = isBlank ? '' : String(newVal);

  let typeAttr = '';
  let valXml = '';

  if (isFormula) {
    if (isBlank) {
      typeAttr = ' t="str"';
      valXml = `<f>${formula}</f><v/>`;
    } else if (isNumber) {
      valXml = `<f>${formula}</f><v>${newVal}</v>`;
    } else {
      typeAttr = ' t="str"';
      valXml = `<f>${formula}</f><v>${escapeXml(strVal)}</v>`;
    }
  } else if (isBlank) {
    valXml = '';
  } else if (isNumber) {
    valXml = `<v>${newVal}</v>`;
  } else {
    typeAttr = ' t="inlineStr"';
    valXml = `<is><t>${escapeXml(strVal)}</t></is>`;
  }

  if (match) {
    let startTag = match[1];
    startTag = startTag.replace(/\s+t="[^"]*"/g, '');
    if (explicitStyle) {
      if (/s="\d+"/.test(startTag)) {
        startTag = startTag.replace(/s="\d+"/, `s="${explicitStyle}"`);
      } else {
        startTag += ` s="${explicitStyle}"`;
      }
    }
    const newCell = valXml ? `${startTag}${typeAttr}>${valXml}</c>` : `${startTag}/>`;
    return sheetXml.replace(match[0], () => newCell);
  } else {
    const rowMatch = cellRef.match(/^([A-Z]+)(\d+)$/);
    if (!rowMatch) return sheetXml;
    const rNum = rowMatch[2];
    const rowRegex = new RegExp(`(<row\\b[^>]*?\\br="${rNum}"[^>]*?>)(.*?)(</row>)`, 's');
    const rm = sheetXml.match(rowRegex);
    const styleAttr = explicitStyle ? ` s="${explicitStyle}"` : '';
    const newCell = valXml
      ? `<c r="${cellRef}"${styleAttr}${typeAttr}>${valXml}</c>`
      : `<c r="${cellRef}"${styleAttr}/>`;

    if (rm) {
      return sheetXml.replace(rowRegex, `$1$2${newCell}$3`);
    } else {
      const newRow = `<row r="${rNum}" spans="1:30">${newCell}</row>`;
      const sdMatch = sheetXml.match(/<\/sheetData>/);
      if (sdMatch) {
        return sheetXml.replace('</sheetData>', `${newRow}</sheetData>`);
      }
    }
  }
  return sheetXml;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}


/**
 * Populates the entire Grade 12 Academic with Cross template buffer
 */
export async function populateGrade12AcademicCrossTemplateBuffer(
  templateBuffer: ArrayBuffer | Uint8Array | ArrayLike<number> | Buffer,
  options: SF9Grade12AcademicCrossExportOptions
): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(templateBuffer as Parameters<typeof JSZip.loadAsync>[0]);
  const sheets = await getWorkbookSheetMap(zip);

  // Identify worksheets
  const inputSheet = sheets.find(s => s.name.toUpperCase().includes('INPUT')) || { path: 'xl/worksheets/sheet2.xml' };
  const summarySheet = sheets.find(s => s.name.toUpperCase() === 'SUMMARY') || { path: 'xl/worksheets/sheet3.xml' };
  const sf9Sheet = sheets.find(s => s.name.toUpperCase().includes('SF9') || s.name.toUpperCase().includes('GRADE 12') || s.name.toUpperCase().includes('G12')) || { path: 'xl/worksheets/sheet4.xml' };
  const attendanceSheet = sheets.find(s => s.name.toUpperCase().includes('ATTENDANCE')) || { path: 'xl/worksheets/sheet5.xml' };

  // Set active tab to SF9 sheet in xl/workbook.xml
  const wbEntry = zip.file('xl/workbook.xml');
  if (wbEntry) {
    let wbXml = await wbEntry.async('text');
    const sf9Index = sheets.findIndex(s => s.path === sf9Sheet.path);
    const activeTabIdx = sf9Index >= 0 ? sf9Index : 3;
    if (wbXml.includes('<workbookView')) {
      wbXml = wbXml.replace(/<workbookView([^>]*?)activeTab="\d+"([^>]*?)\/>/g, `<workbookView$1activeTab="${activeTabIdx}"$2/>`);
      if (!wbXml.includes('activeTab=')) {
        wbXml = wbXml.replace(/<workbookView\b([^>]*?)\/>/g, `<workbookView activeTab="${activeTabIdx}"$1/>`);
      }
    } else if (wbXml.includes('<bookViews>')) {
      wbXml = wbXml.replace('<bookViews>', `<bookViews><workbookView activeTab="${activeTabIdx}"/>`);
    }
    zip.file('xl/workbook.xml', wbXml);
  }

  // 1. POPULATE INPUT DATA (sheet2.xml)
  const inputEntry = zip.file(inputSheet.path);
  if (inputEntry) {
    let inputXml = await inputEntry.async('text');
    const prof = options.schoolProfile;

    if (prof?.region) inputXml = updateCellInSheetXml(inputXml, 'F10', prof.region.toUpperCase());
    if (prof?.division) inputXml = updateCellInSheetXml(inputXml, 'F11', prof.division.toUpperCase());
    if (prof?.district) inputXml = updateCellInSheetXml(inputXml, 'F13', prof.district.toUpperCase());
    if (prof?.school_id) inputXml = updateCellInSheetXml(inputXml, 'F15', String(prof.school_id));
    if (prof?.name) inputXml = updateCellInSheetXml(inputXml, 'F16', prof.name.toUpperCase());
    if (options.schoolYear) inputXml = updateCellInSheetXml(inputXml, 'F18', options.schoolYear);

    const principal = options.principal || prof?.head_name || '';
    if (principal) inputXml = updateCellInSheetXml(inputXml, 'F19', principal.toUpperCase());

    const adviser = options.adviser || prof?.adviser_name || '';
    if (adviser) inputXml = updateCellInSheetXml(inputXml, 'F26', adviser.toUpperCase());

    const gradeLevelStr = options.gradeLevel || options.student.grade_level || 'GRADE 12';
    inputXml = updateCellInSheetXml(inputXml, 'F27', gradeLevelStr.toUpperCase());
    inputXml = updateCellInSheetXml(inputXml, 'F28', 'ACADEMIC');
    if (options.section) inputXml = updateCellInSheetXml(inputXml, 'F29', options.section.toUpperCase());

    // Learners in INPUT DATA: Males Rows 11–60, Females Rows 11–60
    const rawLearners: StudentWithGrades[] = options.learners && options.learners.length > 0
      ? options.learners
      : [options.student];

    const males = rawLearners.filter(s => {
      const g = (s.gender || '').toUpperCase();
      return g === 'M' || g === 'MALE';
    });
    const females = rawLearners.filter(s => {
      const g = (s.gender || '').toUpperCase();
      return g === 'F' || g === 'FEMALE';
    });

    // Populate Males in INPUT DATA (L#, M#, N#)
    males.slice(0, 50).forEach((st, idx) => {
      const r = 11 + idx;
      const name = formatLearnerName(st).toUpperCase();
      const lrn = st.lrn || '';
      const bday = formatDateToMMDDYYYY(st.birthday);
      inputXml = updateCellInSheetXml(inputXml, `L${r}`, name, undefined, '14');
      inputXml = updateCellInSheetXml(inputXml, `M${r}`, lrn, undefined, '114');
      inputXml = updateCellInSheetXml(inputXml, `N${r}`, bday, undefined, '115');
    });

    // Populate Females in INPUT DATA (Q#, R# & T#, S#)
    females.slice(0, 50).forEach((st, idx) => {
      const r = 11 + idx;
      const name = formatLearnerName(st).toUpperCase();
      const lrn = st.lrn || '';
      const bday = formatDateToMMDDYYYY(st.birthday);
      inputXml = updateCellInSheetXml(inputXml, `Q${r}`, name, undefined, '14');
      inputXml = updateCellInSheetXml(inputXml, `R${r}`, lrn, undefined, '114');
      inputXml = updateCellInSheetXml(inputXml, `T${r}`, lrn, undefined, '4');
      inputXml = updateCellInSheetXml(inputXml, `S${r}`, bday, undefined, '115');
    });

    zip.file(inputSheet.path, inputXml);
  }

  // 2. POPULATE SUMMARY (sheet3.xml)
  const summaryEntry = zip.file(summarySheet.path);
  if (summaryEntry) {
    let summaryXml = await summaryEntry.async('text');
    const rawLearners: StudentWithGrades[] = options.learners && options.learners.length > 0
      ? options.learners
      : [options.student];

    const males = rawLearners.filter(s => {
      const g = (s.gender || '').toUpperCase();
      return g === 'M' || g === 'MALE';
    });
    const females = rawLearners.filter(s => {
      const g = (s.gender || '').toUpperCase();
      return g === 'F' || g === 'FEMALE';
    });

    // Helper to populate learner row in SUMMARY
    const populateSummaryLearner = (st: StudentWithGrades, r: number, isFemale: boolean) => {
      const name = formatLearnerName(st).toUpperCase();
      const lrn = st.lrn || '';
      const bday = formatDateToMMDDYYYY(st.birthday);
      const age = parseAge(st.age, st.birthday);
      const sex = isFemale ? 'F' : 'M';
      const inputRow = (r >= 67 ? r - 67 : r - 16) + 11;

      const nameFormula = isFemale
        ? `IF('INPUT DATA'!Q${inputRow}="","",'INPUT DATA'!Q${inputRow})`
        : `IF('INPUT DATA'!L${inputRow}="","",'INPUT DATA'!L${inputRow})`;
      const lrnFormula = isFemale
        ? `IF('INPUT DATA'!T${inputRow}="","",'INPUT DATA'!T${inputRow})`
        : `IF('INPUT DATA'!M${inputRow}="","",'INPUT DATA'!M${inputRow})`;
      const bdayFormula = isFemale
        ? `IF('INPUT DATA'!S${inputRow}="","",'INPUT DATA'!S${inputRow})`
        : `IF('INPUT DATA'!N${inputRow}="","",'INPUT DATA'!N${inputRow})`;

      summaryXml = updateCellInSheetXml(summaryXml, `C${r}`, name, nameFormula, isFemale ? '478' : '462');
      summaryXml = updateCellInSheetXml(summaryXml, `F${r}`, lrn, lrnFormula, isFemale ? '481' : '465');
      summaryXml = updateCellInSheetXml(summaryXml, `H${r}`, bday, bdayFormula, isFemale ? '483' : '467');
      summaryXml = updateCellInSheetXml(summaryXml, `I${r}`, age, `IF(H${r}="","",DATEDIF(H${r},TODAY(),"Y"))`, '468');
      summaryXml = updateCellInSheetXml(summaryXml, `J${r}`, sex, undefined, isFemale ? '194' : '232');

      // Subject grades K to S
      const lg = extractGrade12AcademicCrossGrades(st.grades || options.grades, options.subjects);
      const styleBase = isFemale ? '239' : '231';
      const styleFirst = isFemale ? '238' : '230';
      const styleLast = isFemale ? '240' : '231';

      summaryXml = updateCellInSheetXml(summaryXml, `K${r}`, lg.ae4, undefined, styleFirst);
      summaryXml = updateCellInSheetXml(summaryXml, `L${r}`, lg.ae5, undefined, styleBase);
      summaryXml = updateCellInSheetXml(summaryXml, `M${r}`, lg.ae6, undefined, styleBase);
      summaryXml = updateCellInSheetXml(summaryXml, `N${r}`, lg.ae7, undefined, styleBase);
      summaryXml = updateCellInSheetXml(summaryXml, `O${r}`, lg.ae8, undefined, styleBase);
      summaryXml = updateCellInSheetXml(summaryXml, `P${r}`, lg.ae9, undefined, styleBase);
      summaryXml = updateCellInSheetXml(summaryXml, `Q${r}`, lg.ae10, undefined, styleBase);
      summaryXml = updateCellInSheetXml(summaryXml, `R${r}`, lg.ae11, undefined, styleBase);
      summaryXml = updateCellInSheetXml(summaryXml, `S${r}`, lg.tp1, undefined, styleLast);
    };

    males.slice(0, 50).forEach((st, idx) => populateSummaryLearner(st, 16 + idx, false));
    females.slice(0, 50).forEach((st, idx) => populateSummaryLearner(st, 67 + idx, true));

    zip.file(summarySheet.path, summaryXml);
  }

  // 3. POPULATE SF9 - GRADE 12 ACADEMIC (sheet4.xml)
  const sf9Entry = zip.file(sf9Sheet.path);
  if (sf9Entry) {
    let sf9Xml = await sf9Entry.async('text');
    const prof = options.schoolProfile;
    const st = options.student;

    const studentFullName = formatLearnerName(st).toUpperCase();
    const studentLrn = st.lrn || '';
    const studentAge = parseAge(st.age, st.birthday);
    const rawGender = (st.gender || '').toUpperCase();
    const studentSex = rawGender === 'F' || rawGender === 'FEMALE' ? 'Female' : 'Male';

    // School Profile Header
    if (prof?.region) sf9Xml = updateCellInSheetXml(sf9Xml, 'A5', prof.region.toUpperCase());
    if (prof?.division) sf9Xml = updateCellInSheetXml(sf9Xml, 'A6', `SCHOOLS DIVISION OF ${prof.division.toUpperCase()}`);
    if (prof?.district) sf9Xml = updateCellInSheetXml(sf9Xml, 'A7', prof.district.toUpperCase());
    if (prof?.name) sf9Xml = updateCellInSheetXml(sf9Xml, 'A10', prof.name.toUpperCase());
    if (options.schoolYear) sf9Xml = updateCellInSheetXml(sf9Xml, 'A13', `School Year ${options.schoolYear}`);

    // Student Profile
    sf9Xml = updateCellInSheetXml(sf9Xml, 'C15', studentFullName, undefined, '350');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I15', studentAge, 'IF(C15="","",VLOOKUP(C15,SUMMARY!C16:S116,7,0))', '249');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'K15', studentSex, 'IF(C15="","",VLOOKUP(C15,SUMMARY!C16:S116,8,0))', '249');

    sf9Xml = updateCellInSheetXml(sf9Xml, 'C16', studentLrn, 'IF(C15="","",VLOOKUP(C15,SUMMARY!C16:S116,4,0))', '349');
    const gradeLevelDisplay = options.gradeLevel || st.grade_level || 'Grade 12';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I16', gradeLevelDisplay, 'IF(\'INPUT DATA\'!F27="","",\'INPUT DATA\'!F27)', '249');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'K16', options.section.toUpperCase(), 'IF(\'INPUT DATA\'!F29="","",\'INPUT DATA\'!F29)', '249');

    sf9Xml = updateCellInSheetXml(sf9Xml, 'E17', 'ACADEMIC', 'IF(\'INPUT DATA\'!F28="","",\'INPUT DATA\'!F28)', '381');

    // Signatures
    const principal = options.principal || prof?.head_name || '';
    if (principal) sf9Xml = updateCellInSheetXml(sf9Xml, 'A25', principal.toUpperCase(), 'IF(\'INPUT DATA\'!F19="","",\'INPUT DATA\'!F19)');
    const adviser = options.adviser || prof?.adviser_name || '';
    if (adviser) sf9Xml = updateCellInSheetXml(sf9Xml, 'C25', adviser.toUpperCase(), 'IF(\'INPUT DATA\'!F26="","",\'INPUT DATA\'!F26)');

    // Subject Grades & Names
    const currentGrades = extractGrade12AcademicCrossGrades(options.grades, options.subjects);

    // Subject Names
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B31', currentGrades.ae4Name, undefined, '355');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B32', currentGrades.ae5Name, undefined, '355');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B33', currentGrades.ae6Name, undefined, '355');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B34', currentGrades.ae7Name, undefined, '355');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B35', currentGrades.ae8Name, undefined, '355');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B36', currentGrades.ae9Name, undefined, '355');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B37', currentGrades.ae10Name, undefined, '355');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B38', currentGrades.ae11Name, undefined, '338');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B39', currentGrades.tp1Name, undefined, '338');

    // Term Grades (F for T1, G for T2, H for T3)
    sf9Xml = updateCellInSheetXml(sf9Xml, 'F31', currentGrades.ae4, 'IF(SUMMARY!K16="","",VLOOKUP(C15,SUMMARY!C16:S116,9,0))', '40');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'F32', currentGrades.ae5, 'IF(SUMMARY!K16="","",VLOOKUP(C15,SUMMARY!C16:S116,10,0))', '40');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'F33', currentGrades.ae6, 'IF(SUMMARY!K16="","",VLOOKUP(C15,SUMMARY!C16:S116,11,0))', '40');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'F34', currentGrades.ae7, 'IF(SUMMARY!K16="","",VLOOKUP(C15,SUMMARY!C16:S116,12,0))', '40');

    sf9Xml = updateCellInSheetXml(sf9Xml, 'G35', currentGrades.ae8, 'IF(SUMMARY!K16="","",VLOOKUP(C15,SUMMARY!C16:S116,13,0))', '40');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'G36', currentGrades.ae9, 'IF(SUMMARY!K16="","",VLOOKUP(C15,SUMMARY!C16:S116,14,0))', '111');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'G37', currentGrades.ae10, 'IF(SUMMARY!K16="","",VLOOKUP(C15,SUMMARY!C16:S116,15,0))', '41');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'G38', currentGrades.ae11, 'IF(SUMMARY!K16="","",VLOOKUP(C15,SUMMARY!C16:S116,16,0))', '112');

    sf9Xml = updateCellInSheetXml(sf9Xml, 'H39', currentGrades.tp1, 'IF(SUMMARY!K16="","",VLOOKUP(C15,SUMMARY!C16:S116,17,0))', '112');

    // Units
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I31', 3, undefined, '167');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I32', 3, undefined, '167');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I33', 3, undefined, '167');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I34', 3, undefined, '167');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I35', 3, undefined, '167');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I36', 3, undefined, '167');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I37', 3, undefined, '167');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I38', 3, undefined, '165');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I39', 12, undefined, '167');

    // Helper to evaluate final grade, remarks, points
    const formatElectiveRow = (rNum: number, gradeVal: number | '', units: number, fCol: string) => {
      const hasG = typeof gradeVal === 'number' && gradeVal > 0;
      const finalG = hasG ? gradeVal : '';
      const rem = hasG ? (gradeVal >= 75 ? 'Passed' : 'Failed') : '';
      const pts = hasG ? gradeVal * units : '';

      sf9Xml = updateCellInSheetXml(sf9Xml, `J${rNum}`, finalG, `IF(SUM(F${rNum}:H${rNum})=0, "", ROUND((${fCol}${rNum})*(I${rNum})/I${rNum},0))`, '40');
      sf9Xml = updateCellInSheetXml(sf9Xml, `K${rNum}`, rem, `IF(J${rNum}="", "", IF(J${rNum}>=75, "Passed", "Failed"))`, '40');
      sf9Xml = updateCellInSheetXml(sf9Xml, `L${rNum}`, pts, `IF(J${rNum}="","",J${rNum}*I${rNum})`, '169');
      return pts;
    };

    const p31 = formatElectiveRow(31, currentGrades.ae4, 3, 'F');
    const p32 = formatElectiveRow(32, currentGrades.ae5, 3, 'F');
    const p33 = formatElectiveRow(33, currentGrades.ae6, 3, 'F');
    const p34 = formatElectiveRow(34, currentGrades.ae7, 3, 'F');

    const p35 = formatElectiveRow(35, currentGrades.ae8, 3, 'G');
    const p36 = formatElectiveRow(36, currentGrades.ae9, 3, 'G');
    const p37 = formatElectiveRow(37, currentGrades.ae10, 3, 'G');
    const p38 = formatElectiveRow(38, currentGrades.ae11, 3, 'G');

    const p39 = formatElectiveRow(39, currentGrades.tp1, 12, 'H');

    // General Average Row 41
    const allPts = [p31, p32, p33, p34, p35, p36, p37, p38, p39].filter(p => typeof p === 'number') as number[];
    const sumPts = allPts.length > 0 ? allPts.reduce((a, b) => a + b, 0) : '';

    sf9Xml = updateCellInSheetXml(sf9Xml, 'I41', 36, 'SUM(I31:I40)', '166');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'J41',
      currentGrades.generalAverage,
      'IF(COUNT(J31:J37,J39:J40)=0,"",ROUND(L41/I41,0))',
      '166'
    );
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'K41',
      currentGrades.remarks,
      'IF(J41="","",IF(J41>=75,"Passed","Failed"))',
      '168'
    );
    sf9Xml = updateCellInSheetXml(sf9Xml, 'L41', sumPts, 'SUM(L31:L40)', '169');

    // Monthly Attendance in Rows 3, 5, 7
    const att = options.attendance;
    if (att && att.schoolDays && att.daysPresent) {
      const cols = ['R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB'];
      let totDays = 0;
      let totPres = 0;

      for (let i = 0; i < 11; i++) {
        const c = cols[i];
        const sDay = att.schoolDays[i] !== undefined ? Number(att.schoolDays[i]) : 20;
        const dPres = att.daysPresent[i] !== undefined ? Number(att.daysPresent[i]) : sDay;
        const dAbs = Math.max(0, sDay - dPres);

        totDays += sDay;
        totPres += dPres;

        sf9Xml = updateCellInSheetXml(sf9Xml, `${c}3`, sDay, `='ATTENDANCE RECORD SUMMARY'!${String.fromCharCode(70 + i)}117`);
        sf9Xml = updateCellInSheetXml(
          sf9Xml,
          `${c}5`,
          dPres,
          `IF('ATTENDANCE RECORD SUMMARY'!F14="","",IFERROR(VLOOKUP(C15,'ATTENDANCE RECORD SUMMARY'!$C$14:$P$114,${4 + i},0),""))`
        );
        sf9Xml = updateCellInSheetXml(sf9Xml, `${c}7`, dAbs, `IF(${c}5="","",ABS(${c}3-${c}5))`);
      }
      sf9Xml = updateCellInSheetXml(sf9Xml, 'AC3', totDays, 'SUM(R3:AB4)');
      sf9Xml = updateCellInSheetXml(sf9Xml, 'AC5', totPres, 'SUM(R5:AB6)');
      sf9Xml = updateCellInSheetXml(sf9Xml, 'AC7', Math.max(0, totDays - totPres), 'ABS(AC3-AC5)');
    }

    // Replace unguarded formulas in sheet4
    sf9Xml = sf9Xml.replace(/<f t="shared" ref="L31:L39" si="4">J31\*I31<\/f>/g, '<f>IF(J31="","",J31*I31)</f>');
    sf9Xml = sf9Xml.replace(/<f t="shared" si="4"\/>/g, '<f>IF(J31="","",J31*I31)</f>');

    zip.file(sf9Sheet.path, sf9Xml);
  }

  // 4. POPULATE ATTENDANCE RECORD SUMMARY (sheet5.xml)
  const attEntry = zip.file(attendanceSheet.path);
  if (attEntry) {
    let attXml = await attEntry.async('text');
    const att = options.attendance;

    // School days in Row 117 (F117:P117)
    if (att && att.schoolDays && att.schoolDays.length > 0) {
      let totSchoolDays = 0;
      for (let i = 0; i < 11; i++) {
        const colLetter = String.fromCharCode(70 + i); // F through P
        const val = att.schoolDays[i] !== undefined ? Number(att.schoolDays[i]) : 20;
        totSchoolDays += val;
        attXml = updateCellInSheetXml(attXml, `${colLetter}117`, val);
      }
      attXml = updateCellInSheetXml(attXml, 'E117', totSchoolDays, 'SUM(F117:P117)');
    }

    // Populate learners in ATTENDANCE RECORD SUMMARY (Males Rows 14–63, Females Rows 65–114)
    const rawLearners: StudentWithGrades[] = options.learners && options.learners.length > 0
      ? options.learners
      : [options.student];

    const males = rawLearners.filter(s => {
      const g = (s.gender || '').toUpperCase();
      return g === 'M' || g === 'MALE';
    });
    const females = rawLearners.filter(s => {
      const g = (s.gender || '').toUpperCase();
      return g === 'F' || g === 'FEMALE';
    });

    const populateAttLearner = (st: StudentWithGrades, r: number, isFemale: boolean) => {
      const name = formatLearnerName(st).toUpperCase();
      const inputRow = (isFemale ? r - 65 : r - 14) + 11;
      const inputCol = isFemale ? 'Q' : 'L';
      const nameFormula = `IF('INPUT DATA'!${inputCol}${inputRow}="","",'INPUT DATA'!${inputCol}${inputRow})`;

      attXml = updateCellInSheetXml(attXml, `C${r}`, name, nameFormula);

      // Student days present
      const presList = st.attendance?.daysPresent || (options.attendance ? options.attendance.daysPresent : undefined);
      if (presList && presList.length > 0) {
        for (let i = 0; i < 11; i++) {
          const colLetter = String.fromCharCode(70 + i);
          const val = presList[i] !== undefined ? Number(presList[i]) : '';
          attXml = updateCellInSheetXml(attXml, `${colLetter}${r}`, val);
        }
      }
    };

    males.slice(0, 50).forEach((st, idx) => populateAttLearner(st, 14 + idx, false));
    females.slice(0, 50).forEach((st, idx) => populateAttLearner(st, 65 + idx, true));

    zip.file(attendanceSheet.path, attXml);
  }

  // 5. SCHOOL LOGO INJECTION (drawing4.xml or dynamically resolved)
  const logoData = options.schoolProfile?.logo_url || (options.schoolProfile as unknown as { logo?: string })?.logo;
  if (logoData) {
    try {
      let drawingPath = 'xl/drawings/drawing4.xml';
      const sheetRelsPath = sf9Sheet.path.replace('worksheets/', 'worksheets/_rels/') + '.rels';
      const sheetRelsEntry = zip.file(sheetRelsPath);
      if (sheetRelsEntry) {
        const sheetRelsXml = await sheetRelsEntry.async('text');
        const drawingRelMatch = sheetRelsXml.match(/Type="[^"]*\/drawing"[^>]*Target="([^"]+)"/);
        if (drawingRelMatch) {
          const target = drawingRelMatch[1];
          drawingPath = target.startsWith('/')
            ? target.substring(1)
            : target.startsWith('../')
            ? `xl/${target.replace('../', '')}`
            : `xl/drawings/${target}`;
        }
      }

      const drawingEntry = zip.file(drawingPath);
      if (drawingEntry) {
        let drawingXml = await drawingEntry.async('text');
        const drawingRelsPath = drawingPath.replace('drawings/', 'drawings/_rels/') + '.rels';
        let drawingRelsXml = '';
        const drawingRelsEntry = zip.file(drawingRelsPath);
        if (drawingRelsEntry) {
          drawingRelsXml = await drawingRelsEntry.async('text');
        }

        // Add logo image into zip media
        const base64Data = logoData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const mediaFileName = 'school_logo_g12.png';
        zip.file(`xl/media/${mediaFileName}`, imageBuffer);

        // Find or create relationship in drawing rels
        let logoRelId = 'rId99';
        if (drawingRelsXml) {
          const relIds = [...drawingRelsXml.matchAll(/Id="rId(\d+)"/g)].map(m => parseInt(m[1], 10));
          const maxId = relIds.length > 0 ? Math.max(...relIds) : 10;
          logoRelId = `rId${maxId + 1}`;
          const newRel = `<Relationship Id="${logoRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${mediaFileName}"/>`;
          drawingRelsXml = drawingRelsXml.replace('</Relationships>', `${newRel}</Relationships>`);
          zip.file(drawingRelsPath, drawingRelsXml);
        }

        // Replace Shape 4 / Insert School Logo with pic anchor
        const shapeAnchorRegex = /<xdr:oneCellAnchor>[\s\S]*?<xdr:cNvPr[^>]*?name="Shape 4"[\s\S]*?<\/xdr:oneCellAnchor>/;
        if (shapeAnchorRegex.test(drawingXml)) {
          const picXml = `<xdr:oneCellAnchor><xdr:from><xdr:col>9</xdr:col><xdr:colOff>447675</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>200025</xdr:rowOff></xdr:from><xdr:ext cx="1276350" cy="1314450"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="99" name="SchoolLogo" title="School Logo"/><xdr:cNvPicPr preferRelativeResize="0"/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${logoRelId}" cstate="print"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="4418450" y="3081025"/><a:ext cx="1565400" cy="1585200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></xdr:spPr></xdr:pic><xdr:clientData fLocksWithSheet="0"/></xdr:oneCellAnchor>`;
          drawingXml = drawingXml.replace(shapeAnchorRegex, picXml);
          zip.file(drawingPath, drawingXml);
        }
      }
    } catch (err) {
      console.warn('Could not replace school logo in Grade 12 Academic with Cross drawing:', err);
    }
  }

  return zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}

/**
 * Export the complete Grade 12 Academic with Cross Section Master SF9 Workbook containing all learners
 */
export async function exportSF9Grade12AcademicCrossSectionMasterToExcel(
  opts: SF9Grade12AcademicCrossExportOptions,
  sectionName: string,
  schoolYear: string
): Promise<void> {
  const buffer = await fetchGrade12AcademicCrossTemplateBuffer();
  const outBuffer = await populateGrade12AcademicCrossTemplateBuffer(buffer, opts);

  const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const safeSection = sectionName.replace(/[^a-z0-9]/gi, '_');
  a.download = `SF9_SECTION_MASTER_${safeSection}_${schoolYear}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
