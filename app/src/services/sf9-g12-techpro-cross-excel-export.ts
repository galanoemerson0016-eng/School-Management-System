/**
 * SF9 Grade 12 TechPro with Cross-Specialization Excel Export Service
 * Populates the official DepEd Grade 12 Technical-Professional with Cross SF9 template
 * (G12 TechPro with Cross School Form 9 (SY 26-27).xlsx)
 *
 * Official Structure:
 * - 6 Sheets:
 *   1. Home (sheet1.xml)
 *   2. INPUT DATA (sheet2.xml)
 *   3. SUMMARY (sheet3.xml)
 *   4. SF9 - GRADE 12 TechPro (sheet4.xml, activeTab: 3)
 *   5. ATTENDANCE RECORD SUMMARY (sheet5.xml)
 *   6. HELPER (sheet6.xml)
 *
 * Subject Architecture:
 * - 6 Subjects across 36 Total Weighted Units:
 *   Term 1: TechPro Elective 2 (12 units, Row 31, SUMMARY Col K)
 *   Term 2: Academic Elective 1, 2, 3, 4 (3 units each = 12 units, Rows 32-35, SUMMARY Cols L, M, N, O)
 *   Term 3: Work Immersion for TechPro Track (12 units, Row 36, SUMMARY Col P)
 *   General Average (Row 38): Units = 36 (=SUM(I27:I37)), Gen Avg = =IF(COUNT(J27:J33,J35:J37)=0,"",ROUND(L38/I38,0)), Points = =SUM(L31:L36)
 *
 * Formula Health:
 * - Un-guarded Column L formulas (=J#*I#) are replaced with guarded =IF(J#="","",J#*I#)
 *   to eliminate #VALUE! errors when grades are incomplete or terms are pending.
 * - Dynamic School Logo insertion replacing Shape 4 in drawing4.xml with school logo.
 */

import JSZip from 'jszip';
import type { SchoolProfile, Student, Subject } from '../types';
import { calculateWeightedGradeAverage } from './grade-calculation';

export interface StudentWithGrades extends Omit<Partial<Student>, 'gender' | 'age'> {
  id?: string;
  lrn?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  gender?: 'Male' | 'Female' | string;
  grade_level?: string;
  birthday?: string;
  age?: number | string;
  address?: string;
  grades?: Record<string, unknown>;
  student_section?: string;
  strand?: string;
  track?: string;
}

export interface SF9Grade12TechProCrossExportOptions {
  student: StudentWithGrades;
  schoolProfile: SchoolProfile;
  section: string;
  gradeLevel: string;
  schoolYear?: string;
  track?: string;
  strand?: string;
  adviser?: string;
  principal?: string;
  sectionStudents?: StudentWithGrades[];
  learners?: StudentWithGrades[];
  grades?: Record<string, unknown>;
  subjects?: Subject[];
  attendance?: {
    months?: string[];
    schoolDays?: number[];
    daysPresent?: (number | string)[];
    daysAbsent?: (number | string)[];
  };
}

/**
 * Accurately detects Grade 12 Technical-Professional with Cross-Specialization
 */
export function isGrade12TechProWithCross(
  gradeLevel: string | undefined | null,
  track?: string | undefined | null,
  subjects?: Array<{ name?: string; subject_name?: string }>
): boolean {
  if (!gradeLevel) return false;
  const s = gradeLevel.trim().toLowerCase();

  // Must be Grade 12
  const isG12 = /\b(?:grade\s*12|g12|12)\b/i.test(s);
  if (!isG12) return false;

  const t = (track || '').trim().toLowerCase();

  // Track mentions both Tech/TVL/Pro and Cross
  const isTech = t.includes('tech') || t.includes('tvl') || t.includes('tvet') || t.includes('pro');
  const isCross = t.includes('cross');

  if (isTech && isCross) return true;

  // If subjects are passed, check if there is TP2, Academic Elective(s), and Work Immersion
  if (subjects && subjects.length > 0) {
    const hasTP2 = subjects.some(sub => {
      const norm = (sub.subject_name || sub.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return norm.includes('techpro') || norm.includes('tp2') || norm.includes('tvl');
    });
    const hasAcadElective = subjects.some(sub => {
      const norm = (sub.subject_name || sub.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        norm.includes('academicelective') ||
        norm.includes('ae1') ||
        norm.includes('ae2') ||
        norm.includes('ae3') ||
        norm.includes('ae4')
      );
    });
    const hasWorkImmersion = subjects.some(sub => {
      const norm = (sub.subject_name || sub.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return norm.includes('immersion') || norm.includes('workimmersion');
    });
    if (hasTP2 && hasAcadElective && hasWorkImmersion) return true;
  }

  return false;
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

export function formatLearnerName(student: StudentWithGrades): string {
  const last = (student.last_name || '').trim();
  const first = (student.first_name || '').trim();
  const mid = (student.middle_name || '').trim();
  const ext = ((student as { extension_name?: string }).extension_name || '').trim();

  let name = last;
  if (first) name += `, ${first}`;
  if (mid) name += ` ${mid.charAt(0)}.`;
  if (ext) name += ` ${ext}`;
  return name.trim();
}

/**
 * Loads the official DepEd Grade 12 TechPro with Cross SF9 template
 */
export async function fetchGrade12TechProCrossTemplateBuffer(): Promise<ArrayBuffer> {
  const cleanBase = (import.meta.env.BASE_URL || '/').endsWith('/')
    ? (import.meta.env.BASE_URL || '/')
    : `${import.meta.env.BASE_URL}/`;
  const timestamp = Date.now();

  const candidateUrls = [
    `${cleanBase}templates/G12 TechPro with Cross School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `/templates/G12 TechPro with Cross School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `templates/G12 TechPro with Cross School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `${cleanBase}templates/G12%20TechPro%20with%20Cross%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
    `/templates/G12%20TechPro%20with%20Cross%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
    `templates/G12%20TechPro%20with%20Cross%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
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
      // try next
    }
  }

  throw new Error('Official DepEd Grade 12 TechPro with Cross School Form 9 template not found in public/templates.');
}

function getGradeFromEntry(entry: unknown, quarterIndex: number): number | '' {
  if (!entry) return '';
  if (typeof entry === 'number') return isNaN(entry) ? '' : entry;
  if (typeof entry === 'string') {
    const num = Number(entry);
    return isNaN(num) ? '' : num;
  }
  if (typeof entry === 'object' && entry !== null) {
    const obj = entry as Record<string, unknown>;
    const keys = [`q${quarterIndex + 1}`, `term${quarterIndex + 1}`, `t${quarterIndex + 1}`, `quarter${quarterIndex + 1}`];
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
        const num = Number(obj[k]);
        if (!isNaN(num)) return num;
      }
    }
    if (obj.final !== undefined && obj.final !== null && obj.final !== '') {
      const num = Number(obj.final);
      if (!isNaN(num)) return num;
    }
  }
  return '';
}

export interface Grade12TechProCrossGrades {
  tp2: number | '';
  ae1: number | '';
  ae2: number | '';
  ae3: number | '';
  ae4: number | '';
  wi: number | '';
  tp2Name: string;
  ae1Name: string;
  ae2Name: string;
  ae3Name: string;
  ae4Name: string;
  wiName: string;
  generalAverage: number | '';
  generalAverageRemarks: string;
  honors: string;
}

/**
 * Extracts scores and names for Grade 12 TechPro with Cross-Specialization:
 * - Term 1: TechPro Elective 2 (12 units)
 * - Term 2: Academic Electives 1, 2, 3, 4 (3 units each = 12 units)
 * - Term 3: Work Immersion for TechPro Track (12 units)
 * Total Units: 36 units
 */
export function extractGrade12TechProCrossGrades(
  gradesRecord: Record<string, unknown> = {},
  subjectsList: Subject[] = []
): Grade12TechProCrossGrades {
  const getSubjectInfo = (predicate: (name: string, code: string, normName: string, sub?: Subject) => boolean) => {
    let matchedName = '';
    const scores: (number | '')[] = ['', '', ''];

    for (const [key, entry] of Object.entries(gradesRecord)) {
      const sub = subjectsList.find(s => s.id === key || (s.subject_name || '').toLowerCase() === key.toLowerCase());
      const rawName = sub ? sub.subject_name : key;
      const code = sub?.subject_code || '';
      const norm = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (predicate(rawName, code, norm, sub)) {
        matchedName = rawName;
        scores[0] = getGradeFromEntry(entry, 0);
        scores[1] = getGradeFromEntry(entry, 1);
        scores[2] = getGradeFromEntry(entry, 2);
        break;
      }
    }
    return { matchedName, scores };
  };

  // 1. TechPro Elective 2 (Term 1)
  const tp2Info = getSubjectInfo((_n, _c, norm, sub) =>
    !norm.includes('acad') &&
    (norm === 'techproelective2' ||
      norm === 'tp2' ||
      norm === 'techpro2' ||
      (norm.includes('tech') && norm.includes('elective2')) ||
      norm === 'elective2' ||
      (sub?.term === 1 && !norm.includes('immersion') && !norm.includes('apprenticeship')))
  );

  // 2. Explicit Academic Electives (AE1 to AE4, Term 2)
  const ae1Info = getSubjectInfo((_n, _c, norm) =>
    norm === 'academicelective1' ||
    norm === 'ae1' ||
    (norm.includes('acad') && norm.includes('elective1')) ||
    norm === 'elective1'
  );
  const ae2Info = getSubjectInfo((_n, _c, norm) =>
    norm === 'academicelective2' ||
    norm === 'ae2' ||
    (norm.includes('acad') && norm.includes('elective2'))
  );
  const ae3Info = getSubjectInfo((_n, _c, norm) =>
    norm === 'academicelective3' ||
    norm === 'ae3' ||
    (norm.includes('acad') && norm.includes('elective3')) ||
    norm === 'elective3'
  );
  const ae4Info = getSubjectInfo((_n, _c, norm) =>
    norm === 'academicelective4' ||
    norm === 'ae4' ||
    (norm.includes('acad') && norm.includes('elective4')) ||
    norm === 'elective4'
  );

  // 3. Work Immersion for TechPro Track (Term 3)
  const wiInfo = getSubjectInfo((_n, _c, norm, sub) =>
    norm.includes('workimmersion') ||
    norm.includes('immersion') ||
    norm.includes('culminating') ||
    norm.includes('apprenticeship') ||
    norm.includes('ojt') ||
    sub?.term === 3
  );

  let tp2: number | '' = tp2Info.scores[0];
  let ae1: number | '' = ae1Info.scores[1] || ae1Info.scores[0];
  let ae2: number | '' = ae2Info.scores[1] || ae2Info.scores[0];
  let ae3: number | '' = ae3Info.scores[1] || ae3Info.scores[0];
  let ae4: number | '' = ae4Info.scores[1] || ae4Info.scores[0];
  let wi: number | '' = wiInfo.scores[2] || wiInfo.scores[0];

  let tp2Name = tp2Info.matchedName;
  let ae1Name = ae1Info.matchedName;
  let ae2Name = ae2Info.matchedName;
  let ae3Name = ae3Info.matchedName;
  let ae4Name = ae4Info.matchedName;
  let wiName = wiInfo.matchedName;

  // Collect unassigned subjects to fill remaining slots
  const matchedNames = new Set(
    [tp2Name, ae1Name, ae2Name, ae3Name, ae4Name, wiName]
      .filter(Boolean)
      .map(s => s.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );

  const remainingKeys: string[] = [];
  for (const key of Object.keys(gradesRecord)) {
    const norm = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!matchedNames.has(norm)) {
      remainingKeys.push(key);
    }
  }

  const getDisplayName = (key: string) => {
    const sub = subjectsList.find(s => s.id === key || (s.subject_name || '').toLowerCase() === key.toLowerCase());
    return sub ? (sub.subject_name || key) : key;
  };

  // If TP2 is missing, check if any remaining key matches tech/tvl
  if (tp2 === '') {
    const tpKey = remainingKeys.find(k => {
      const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return norm.includes('tech') || norm.includes('tvl') || norm.includes('pro');
    });
    if (tpKey) {
      const entry = gradesRecord[tpKey];
      tp2 = getGradeFromEntry(entry, 0);
      tp2Name = getDisplayName(tpKey);
      const idx = remainingKeys.indexOf(tpKey);
      if (idx !== -1) remainingKeys.splice(idx, 1);
    }
  }

  // If Work Immersion is missing, check remaining for immersion
  if (wi === '') {
    const wiKey = remainingKeys.find(k => {
      const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return norm.includes('immersion') || norm.includes('work') || norm.includes('ojt');
    });
    if (wiKey) {
      const entry = gradesRecord[wiKey];
      wi = getGradeFromEntry(entry, 2) || getGradeFromEntry(entry, 0);
      wiName = getDisplayName(wiKey);
      const idx = remainingKeys.indexOf(wiKey);
      if (idx !== -1) remainingKeys.splice(idx, 1);
    }
  }

  // Fill remaining Academic Elective slots (Term 2)
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

  const s1 = fillSlot(ae1, ae1Name, 1); ae1 = s1.val; ae1Name = s1.name;
  const s2 = fillSlot(ae2, ae2Name, 1); ae2 = s2.val; ae2Name = s2.name;
  const s3 = fillSlot(ae3, ae3Name, 1); ae3 = s3.val; ae3Name = s3.name;
  const s4 = fillSlot(ae4, ae4Name, 1); ae4 = s4.val; ae4Name = s4.name;

  // Calculate General Average based on 36 Total Units
  // TechPro Elective 2: 12 units
  // Academic Electives 1-4: 3 units each = 12 units
  // Work Immersion: 12 units
  // Total: 36 units
  const items: { grade: number | ''; units: number }[] = [
    { grade: tp2, units: 12 },
    { grade: ae1, units: 3 },
    { grade: ae2, units: 3 },
    { grade: ae3, units: 3 },
    { grade: ae4, units: 3 },
    { grade: wi, units: 12 },
  ];

  const averageEntries: Array<{ grade: number; weight: number }> = [];
  let allCompleted = true;

  for (const item of items) {
    if (typeof item.grade === 'number' && !isNaN(item.grade)) {
      averageEntries.push({ grade: item.grade, weight: item.units });
    } else {
      allCompleted = false;
    }
  }

  let generalAverage: number | '' = '';
  let generalAverageRemarks = '';
  let honors = '';

  const weightedAverage = calculateWeightedGradeAverage(averageEntries);
  if (weightedAverage !== null) {
    generalAverage = Math.round(weightedAverage);
    generalAverageRemarks = generalAverage >= 75 ? 'Passed' : 'Failed';
  }

  // Check DepEd Academic Excellence criteria: GA 90-100 and no grade below 80
  if (allCompleted && typeof generalAverage === 'number' && generalAverage >= 90) {
    const gradesList = items.map(i => i.grade as number);
    const minGrade = Math.min(...gradesList);
    if (minGrade >= 80) {
      honors = 'Academic Excellence Award';
    }
  }

  return {
    tp2,
    ae1,
    ae2,
    ae3,
    ae4,
    wi,
    tp2Name: tp2Name || 'TechPro Elective 2',
    ae1Name: ae1Name || 'Academic Elective 1',
    ae2Name: ae2Name || 'Academic Elective 2',
    ae3Name: ae3Name || 'Academic Elective 3',
    ae4Name: ae4Name || 'Academic Elective 4',
    wiName: wiName || 'Work Immersion for TechPro Track',
    generalAverage,
    generalAverageRemarks,
    honors,
  };
}

function updateCellInSheetXml(
  sheetXml: string,
  cellRef: string,
  value: string | number | undefined | null,
  formula?: string,
  styleId?: string
): string {
  const cellRegex = new RegExp(`(<c\\b[^>]*r="${cellRef}"[^>]*>)([\\s\\S]*?)(<\\/c>)`);
  const match = sheetXml.match(cellRegex);

  const valStr = value !== undefined && value !== null ? String(value) : '';
  const isNumber = typeof value === 'number' && !isNaN(value);

  let typeAttr = '';
  let valNode = '';
  if (valStr !== '') {
    if (isNumber) {
      typeAttr = '';
      valNode = `<v>${valStr}</v>`;
    } else {
      typeAttr = ' t="inlineStr"';
      valNode = `<is><t>${escapeXml(valStr)}</t></is>`;
    }
  }

  let formulaNode = '';
  if (formula) {
    formulaNode = `<f>${escapeXml(formula)}</f>`;
  }

  if (match) {
    let openTag = match[1];
    if (styleId) {
      if (openTag.includes(' s="')) {
        openTag = openTag.replace(/ s="[^"]*"/, ` s="${styleId}"`);
      } else {
        openTag = openTag.replace('<c', `<c s="${styleId}"`);
      }
    }
    if (typeAttr) {
      if (openTag.includes(' t="')) {
        openTag = openTag.replace(/ t="[^"]*"/, typeAttr);
      } else {
        openTag = openTag.replace('<c', `<c${typeAttr}`);
      }
    } else if (openTag.includes(' t="') && isNumber) {
      openTag = openTag.replace(/ t="[^"]*"/, '');
    }

    const newBody = `${formulaNode}${valNode}`;
    return sheetXml.replace(cellRegex, `${openTag}${newBody}</c>`);
  }

  // If cell doesn't exist, inject into corresponding row
  const rowNumMatch = cellRef.match(/\d+/);
  if (!rowNumMatch) return sheetXml;
  const rowNum = rowNumMatch[0];
  const rowRegex = new RegExp(`(<row\\b[^>]*r="${rowNum}"[^>]*>)([\\s\\S]*?)(<\\/row>)`);
  const rowMatch = sheetXml.match(rowRegex);

  const styleAttr = styleId ? ` s="${styleId}"` : '';
  const newCell = `<c r="${cellRef}"${styleAttr}${typeAttr}>${formulaNode}${valNode}</c>`;

  if (rowMatch) {
    return sheetXml.replace(rowRegex, `$1$2${newCell}$3`);
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
 * Populates the entire Grade 12 TechPro with Cross template buffer
 */
export async function populateGrade12TechProCrossTemplateBuffer(
  templateBuffer: ArrayBuffer | Uint8Array | Buffer,
  options: SF9Grade12TechProCrossExportOptions
): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(templateBuffer);

  const wbEntry = zip.file('xl/workbook.xml');
  if (wbEntry) {
    let wbXml = await wbEntry.async('text');
    // Set activeTab="3" to open directly on sheet 4 ("SF9 - GRADE 12 TechPro")
    wbXml = wbXml.replace(/activeTab="\d+"/, 'activeTab="3"');
    if (!wbXml.includes('activeTab=')) {
      wbXml = wbXml.replace('<workbookView', '<workbookView activeTab="3"');
    }
    // Remove external link references that may prompt users
    wbXml = wbXml
      .replace(/<externalLink[^>]*\/>/g, '')
      .replace(/<externalReferences>[\s\S]*?<\/externalReferences>/g, '');
    zip.file('xl/workbook.xml', wbXml);
  }

  // Remove externalLink rels if present
  const wbRelsEntry = zip.file('xl/_rels/workbook.xml.rels');
  if (wbRelsEntry) {
    let relsXml = await wbRelsEntry.async('text');
    relsXml = relsXml.replace(/<Relationship[^>]*Target="externalLinks\/externalLink\d+\.xml"[^>]*\/>/g, '');
    zip.file('xl/_rels/workbook.xml.rels', relsXml);
  }

  const sheetEntries = [
    { name: 'Home', path: 'xl/worksheets/sheet1.xml' },
    { name: 'INPUT DATA', path: 'xl/worksheets/sheet2.xml' },
    { name: 'SUMMARY', path: 'xl/worksheets/sheet3.xml' },
    { name: 'SF9 - GRADE 12 TechPro', path: 'xl/worksheets/sheet4.xml' },
    { name: 'ATTENDANCE RECORD SUMMARY', path: 'xl/worksheets/sheet5.xml' },
    { name: 'HELPER', path: 'xl/worksheets/sheet6.xml' },
  ];

  const homeSheet = sheetEntries[0];
  const inputSheet = sheetEntries[1];
  const summarySheet = sheetEntries[2];
  const sf9Sheet = sheetEntries[3];

  // 1. POPULATE INPUT DATA (sheet2.xml)
  const inputEntry = zip.file(inputSheet.path);
  if (inputEntry) {
    let inputXml = await inputEntry.async('text');
    const prof = options.schoolProfile;
    const sy = options.schoolYear || '2026-2027';

    if (prof?.region) inputXml = updateCellInSheetXml(inputXml, 'F10', prof.region.toUpperCase(), undefined, '34');
    if (prof?.division) inputXml = updateCellInSheetXml(inputXml, 'F11', prof.division.toUpperCase(), undefined, '34');
    if (prof?.municipality || prof?.city) inputXml = updateCellInSheetXml(inputXml, 'F12', (prof.municipality || prof.city || '').toUpperCase(), undefined, '34');
    if (prof?.district) inputXml = updateCellInSheetXml(inputXml, 'F13', prof.district.toUpperCase(), undefined, '34');
    if (prof?.school_id) inputXml = updateCellInSheetXml(inputXml, 'F15', String(prof.school_id), undefined, '34');
    if (prof?.name) inputXml = updateCellInSheetXml(inputXml, 'F16', prof.name.toUpperCase(), undefined, '34');
    inputXml = updateCellInSheetXml(inputXml, 'F17', sy, undefined, '34');

    const principal = options.principal || prof?.head_name || '';
    if (principal) inputXml = updateCellInSheetXml(inputXml, 'F19', principal, undefined, '34');
    if (prof?.head_position) inputXml = updateCellInSheetXml(inputXml, 'F20', prof.head_position, undefined, '34');

    const adviserName = (options.adviser || prof?.adviser_name || '').toUpperCase();
    inputXml = updateCellInSheetXml(inputXml, 'F26', adviserName, undefined, '34');
    inputXml = updateCellInSheetXml(inputXml, 'F27', 'Grade 12', undefined, '34');
    inputXml = updateCellInSheetXml(
      inputXml,
      'F28',
      (options.track || options.student.track || 'Technical-Professional Track (with Cross-Specialization)').toUpperCase(),
      undefined,
      '34'
    );
    inputXml = updateCellInSheetXml(
      inputXml,
      'F29',
      (options.strand || options.student.strand || 'TechPro with Cross-Specialization').toUpperCase(),
      undefined,
      '34'
    );
    inputXml = updateCellInSheetXml(inputXml, 'F30', options.section.toUpperCase(), undefined, '34');

    // Roster in INPUT DATA
    const rawLearners: StudentWithGrades[] = options.learners && options.learners.length > 0
      ? options.learners
      : (options.sectionStudents && options.sectionStudents.length > 0 ? options.sectionStudents : [options.student]);

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
      : (options.sectionStudents && options.sectionStudents.length > 0 ? options.sectionStudents : [options.student]);

    const males = rawLearners.filter(s => {
      const g = (s.gender || '').toUpperCase();
      return g === 'M' || g === 'MALE';
    });
    const females = rawLearners.filter(s => {
      const g = (s.gender || '').toUpperCase();
      return g === 'F' || g === 'FEMALE';
    });

    // In SUMMARY for G12 TechPro with Cross:
    // Male: Row 15 to 64 (50 slots)
    // Female: Row 66 to 115 (50 slots)
    // Lookup table: SUMMARY!C15:P115
    const populateSummaryLearner = (st: StudentWithGrades, r: number, isFemale: boolean) => {
      const name = formatLearnerName(st).toUpperCase();
      const lrn = st.lrn || '';
      const bday = formatDateToMMDDYYYY(st.birthday);
      const inputRow = (isFemale ? r - 66 : r - 15) + 11;
      const inputCol = isFemale ? 'Q' : 'L';
      const nameFormula = `IF('INPUT DATA'!${inputCol}${inputRow}="","",'INPUT DATA'!${inputCol}${inputRow})`;

      summaryXml = updateCellInSheetXml(summaryXml, `C${r}`, name, nameFormula);
      if (lrn) {
        summaryXml = updateCellInSheetXml(
          summaryXml,
          `F${r}`,
          lrn,
          `IF('INPUT DATA'!${isFemale ? 'T' : 'M'}${inputRow}="","",'INPUT DATA'!${isFemale ? 'T' : 'M'}${inputRow})`
        );
      }
      if (bday) {
        summaryXml = updateCellInSheetXml(
          summaryXml,
          `H${r}`,
          bday,
          `IF('INPUT DATA'!${isFemale ? 'S' : 'N'}${inputRow}="","",'INPUT DATA'!${isFemale ? 'S' : 'N'}${inputRow})`
        );
      }
      if (st.age !== undefined && st.age !== null) {
        summaryXml = updateCellInSheetXml(summaryXml, `I${r}`, st.age, `IF(H${r}="","",DATEDIF(H${r},TODAY(),"Y"))`);
      }
      summaryXml = updateCellInSheetXml(summaryXml, `J${r}`, isFemale ? 'F' : 'M');

      // Populate learner grades:
      // Col K: TechPro Elective 2
      // Col L: Academic Elective 1
      // Col M: Academic Elective 2
      // Col N: Academic Elective 3
      // Col O: Academic Elective 4
      // Col P: Work Immersion for TechPro Track
      const stGrades = st.grades || (st.lrn === options.student.lrn ? options.grades : undefined);
      if (stGrades) {
        const extracted = extractGrade12TechProCrossGrades(stGrades, options.subjects);
        summaryXml = updateCellInSheetXml(summaryXml, `K${r}`, extracted.tp2);
        summaryXml = updateCellInSheetXml(summaryXml, `L${r}`, extracted.ae1);
        summaryXml = updateCellInSheetXml(summaryXml, `M${r}`, extracted.ae2);
        summaryXml = updateCellInSheetXml(summaryXml, `N${r}`, extracted.ae3);
        summaryXml = updateCellInSheetXml(summaryXml, `O${r}`, extracted.ae4);
        summaryXml = updateCellInSheetXml(summaryXml, `P${r}`, extracted.wi);
      }
    };

    males.slice(0, 50).forEach((st, idx) => populateSummaryLearner(st, 15 + idx, false));
    females.slice(0, 50).forEach((st, idx) => populateSummaryLearner(st, 66 + idx, true));

    zip.file(summarySheet.path, summaryXml);
  }

  // 3. POPULATE SF9 - GRADE 12 TechPro (sheet4.xml)
  const sf9Entry = zip.file(sf9Sheet.path);
  if (sf9Entry) {
    let sf9Xml = await sf9Entry.async('text');
    const st = options.student;
    const prof = options.schoolProfile;

    const studentFullName = formatLearnerName(st).toUpperCase();
    const studentLrn = st.lrn || '';
    const studentAge = st.age !== undefined && st.age !== null ? st.age : '';
    const studentSex = ((st.gender || '').toUpperCase().startsWith('F') ? 'F' : 'M');

    // Header info:
    sf9Xml = updateCellInSheetXml(sf9Xml, 'C15', studentFullName, undefined, '350');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I15', studentAge, 'IF(C15="","",VLOOKUP(C15,SUMMARY!C15:P115,7,0))', '249');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'K15', studentSex, 'IF(C15="","",VLOOKUP(C15,SUMMARY!C15:P115,8,0))', '249');

    sf9Xml = updateCellInSheetXml(sf9Xml, 'C16', studentLrn, 'IF(C15="","",VLOOKUP(C15,SUMMARY!C15:P115,4,0))', '349');
    const gradeLevelDisplay = options.gradeLevel || st.grade_level || 'Grade 12';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I16', gradeLevelDisplay, 'IF(\'INPUT DATA\'!F27="","",' + '\'INPUT DATA\'!F27)', '249');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'K16', options.section.toUpperCase(), 'IF(\'INPUT DATA\'!F29="","",' + '\'INPUT DATA\'!F29)', '249');

    const trackName = (options.track || st.track || 'Technical-Professional Track (with Cross-Specialization)').toUpperCase();
    sf9Xml = updateCellInSheetXml(sf9Xml, 'C17', trackName, 'IF(\'INPUT DATA\'!F28="","",' + '\'INPUT DATA\'!F28)', '349');

    // Grades extraction:
    const grades = options.grades || st.grades || {};
    const extracted = extractGrade12TechProCrossGrades(grades, options.subjects);

    // Subject Rows in Sheet 4:
    // Row 31: TechPro Elective 2 (Term 1 in F31, Units in I31 = 12)
    // Row 32: Academic Elective 1 (Term 2 in G32, Units in I32 = 3)
    // Row 33: Academic Elective 2 (Term 2 in G33, Units in I33 = 3)
    // Row 34: Academic Elective 3 (Term 2 in G34, Units in I34 = 3)
    // Row 35: Academic Elective 4 (Term 2 in G35, Units in I35 = 3)
    // Row 36: Work Immersion for TechPro Track (Term 3 in H36, Units in I36 = 12)
    // Row 38: General Average (Units in I38 = 36, Gen Avg in J38, Remarks in K38, Total Points in L38)

    // Row 31: TechPro Elective 2
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B31', extracted.tp2Name, undefined, '372');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'F31',
      extracted.tp2,
      'IF(SUMMARY!K15="","",VLOOKUP(C15,SUMMARY!C15:P115,9,0))',
      '159'
    );
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I31', 12, undefined, '159');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'J31',
      extracted.tp2,
      'IF(SUM(F31:H31)=0, "", ROUND((F31+H31+G31)*(I31)/I31,0))',
      '159'
    );
    const tp2Remarks = extracted.tp2 !== '' ? (Number(extracted.tp2) >= 75 ? 'Passed' : 'Failed') : '';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'K31', tp2Remarks, 'IF(J31="", "", IF(J31>=75, "Passed", "Failed"))', '159');
    const tp2Points = extracted.tp2 !== '' ? Number(extracted.tp2) * 12 : '';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'L31', tp2Points, 'IF(J31="","",J31*I31)', '471');

    // Row 32: Academic Elective 1
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B32', extracted.ae1Name, undefined, '372');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'G32',
      extracted.ae1,
      'IF(SUMMARY!K15="","",VLOOKUP(C15,SUMMARY!C15:P115,10,0))',
      '228'
    );
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I32', 3, undefined, '159');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'J32',
      extracted.ae1,
      'IF(SUM(F32:H32)=0, "", ROUND((F32+H32+G32)*(I32)/I32,0))',
      '159'
    );
    const ae1Remarks = extracted.ae1 !== '' ? (Number(extracted.ae1) >= 75 ? 'Passed' : 'Failed') : '';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'K32', ae1Remarks, 'IF(J32="", "", IF(J32>=75, "Passed", "Failed"))', '159');
    const ae1Points = extracted.ae1 !== '' ? Number(extracted.ae1) * 3 : '';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'L32', ae1Points, 'IF(J32="","",J32*I32)', '471');

    // Row 33: Academic Elective 2
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B33', extracted.ae2Name, undefined, '372');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'G33',
      extracted.ae2,
      'IF(SUMMARY!K15="","",VLOOKUP(C15,SUMMARY!C15:P115,11,0))',
      '228'
    );
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I33', 3, undefined, '159');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'J33',
      extracted.ae2,
      'IF(SUM(F33:H33)=0, "", ROUND((F33+H33+G33)*(I33)/I33,0))',
      '159'
    );
    const ae2Remarks = extracted.ae2 !== '' ? (Number(extracted.ae2) >= 75 ? 'Passed' : 'Failed') : '';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'K33', ae2Remarks, 'IF(J33="", "", IF(J33>=75, "Passed", "Failed"))', '159');
    const ae2Points = extracted.ae2 !== '' ? Number(extracted.ae2) * 3 : '';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'L33', ae2Points, 'IF(J33="","",J33*I33)', '471');

    // Row 34: Academic Elective 3
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B34', extracted.ae3Name, undefined, '372');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'G34',
      extracted.ae3,
      'IF(SUMMARY!K15="","",VLOOKUP(C15,SUMMARY!C15:P115,12,0))',
      '228'
    );
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I34', 3, undefined, '159');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'J34',
      extracted.ae3,
      'IF(SUM(F34:H34)=0, "", ROUND((F34+H34+G34)*(I34)/I34,0))',
      '159'
    );
    const ae3Remarks = extracted.ae3 !== '' ? (Number(extracted.ae3) >= 75 ? 'Passed' : 'Failed') : '';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'K34', ae3Remarks, 'IF(J34="", "", IF(J34>=75, "Passed", "Failed"))', '159');
    const ae3Points = extracted.ae3 !== '' ? Number(extracted.ae3) * 3 : '';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'L34', ae3Points, 'IF(J34="","",J34*I34)', '471');

    // Row 35: Academic Elective 4
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B35', extracted.ae4Name, undefined, '372');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'G35',
      extracted.ae4,
      'IF(SUMMARY!K15="","",VLOOKUP(C15,SUMMARY!C15:P115,13,0))',
      '228'
    );
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I35', 3, undefined, '159');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'J35',
      extracted.ae4,
      'IF(SUM(F35:H35)=0, "", ROUND((F35+H35+G35)*(I35)/I35,0))',
      '159'
    );
    const ae4Remarks = extracted.ae4 !== '' ? (Number(extracted.ae4) >= 75 ? 'Passed' : 'Failed') : '';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'K35', ae4Remarks, 'IF(J35="", "", IF(J35>=75, "Passed", "Failed"))', '159');
    const ae4Points = extracted.ae4 !== '' ? Number(extracted.ae4) * 3 : '';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'L35', ae4Points, 'IF(J35="","",J35*I35)', '471');

    // Row 36: Work Immersion for TechPro Track
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B36', extracted.wiName, undefined, '372');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'H36',
      extracted.wi,
      'IF(SUMMARY!K15="","",VLOOKUP(C15,SUMMARY!C15:P115,14,0))',
      '230'
    );
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I36', 12, undefined, '472');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'J36',
      extracted.wi,
      'IF(SUM(F36:H36)=0, "", ROUND((F36+H36+G36)*(I36)/I36,0))',
      '159'
    );
    const wiRemarks = extracted.wi !== '' ? (Number(extracted.wi) >= 75 ? 'Passed' : 'Failed') : '';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'K36', wiRemarks, 'IF(J36="", "", IF(J36>=75, "Passed", "Failed"))', '473');
    const wiPoints = extracted.wi !== '' ? Number(extracted.wi) * 12 : '';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'L36', wiPoints, 'IF(J36="","",J36*I36)', '471');

    // Row 38: General Average
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I38', 36, 'SUM(I27:I37)', '474');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'J38',
      extracted.generalAverage,
      'IF(COUNT(J27:J33,J35:J37)=0,"",ROUND(L38/I38,0))',
      '474'
    );
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'K38',
      extracted.generalAverageRemarks,
      'IF(J38="", "", IF(J38>=75, "Passed", "Failed"))',
      '475'
    );
    const totalPointsSum =
      tp2Points !== '' || ae1Points !== '' || ae2Points !== '' || ae3Points !== '' || ae4Points !== '' || wiPoints !== ''
        ? (Number(tp2Points || 0) +
            Number(ae1Points || 0) +
            Number(ae2Points || 0) +
            Number(ae3Points || 0) +
            Number(ae4Points || 0) +
            Number(wiPoints || 0))
        : '';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'L38', totalPointsSum, 'SUM(L31:L36)', '471');

    // Attendance Records in Sheet 4:
    // Row 2: Months (R2..AB2)
    // Row 3: School Days (R3..AB3, AC3)
    // Row 5: Days Present (R5..AB5, AC5)
    // Row 7: Days Absent (R7..AB7, AC7)
    if (options.attendance) {
      const attCols = ['R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB'];
      const att = options.attendance;
      if (att.schoolDays) {
        let totalDays = 0;
        att.schoolDays.slice(0, 11).forEach((val, i) => {
          if (val !== undefined && val !== null) {
            sf9Xml = updateCellInSheetXml(sf9Xml, `${attCols[i]}3`, val);
            totalDays += Number(val) || 0;
          }
        });
        if (totalDays > 0) {
          sf9Xml = updateCellInSheetXml(sf9Xml, 'AC3', totalDays);
        }
      }
      if (att.daysPresent) {
        let totalPresent = 0;
        att.daysPresent.slice(0, 11).forEach((val, i) => {
          if (val !== undefined && val !== null && val !== '') {
            sf9Xml = updateCellInSheetXml(sf9Xml, `${attCols[i]}5`, val);
            totalPresent += Number(val) || 0;
          }
        });
        sf9Xml = updateCellInSheetXml(sf9Xml, 'AC5', totalPresent);
      }
      if (att.daysAbsent) {
        let totalAbsent = 0;
        att.daysAbsent.slice(0, 11).forEach((val, i) => {
          if (val !== undefined && val !== null && val !== '') {
            sf9Xml = updateCellInSheetXml(sf9Xml, `${attCols[i]}7`, val);
            totalAbsent += Number(val) || 0;
          }
        });
        sf9Xml = updateCellInSheetXml(sf9Xml, 'AC7', totalAbsent);
      }
    }

    // Certificate of Transfer (Row 37 / 39 / 41)
    const adviserVal = (options.adviser || prof?.adviser_name || '').toUpperCase();
    sf9Xml = updateCellInSheetXml(sf9Xml, 'X37', adviserVal, 'IF(\'INPUT DATA\'!F26="","",' + '\'INPUT DATA\'!F26)', '468');

    const principalVal = (options.principal || prof?.head_name || '');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'A39', principalVal, 'IF(\'INPUT DATA\'!F19="","",' + '\'INPUT DATA\'!F19)');

    // Sanitize any remaining un-guarded #VALUE! cells in sheet 4
    sf9Xml = sf9Xml.replace(/<v>#VALUE!<\/v>/g, '<v></v>');

    zip.file(sf9Sheet.path, sf9Xml);
  }

  // 4. POPULATE HOME (sheet1.xml)
  const homeEntry = zip.file(homeSheet.path);
  if (homeEntry) {
    let homeXml = await homeEntry.async('text');
    const prof = options.schoolProfile;
    const sy = options.schoolYear || '2026-2027';

    if (prof?.name) homeXml = updateCellInSheetXml(homeXml, 'A10', prof.name.toUpperCase());
    homeXml = updateCellInSheetXml(homeXml, 'A13', `School Year ${sy}`);
    if (prof?.school_id) homeXml = updateCellInSheetXml(homeXml, 'A15', String(prof.school_id));
    if (prof?.district) homeXml = updateCellInSheetXml(homeXml, 'A16', prof.district.toUpperCase());
    if (prof?.division) homeXml = updateCellInSheetXml(homeXml, 'A17', prof.division.toUpperCase());
    if (prof?.region) homeXml = updateCellInSheetXml(homeXml, 'A18', prof.region.toUpperCase());

    zip.file(homeSheet.path, homeXml);
  }

  // 5. DYNAMIC LOGO REPLACEMENT IN DRAWING4 (sheet 4 logo)
  const logoUrl = options.schoolProfile?.logo_url;
  if (logoUrl) {
    try {
      const resp = await fetch(logoUrl);
      if (resp.ok) {
        const logoBuffer = await resp.arrayBuffer();
        const drawingEntry = zip.file('xl/drawings/drawing4.xml');
        const drawingRelsEntry = zip.file('xl/drawings/_rels/drawing4.xml.rels');

        if (drawingEntry && drawingRelsEntry) {
          let dXml = await drawingEntry.async('text');
          let dRelsXml = await drawingRelsEntry.async('text');

          const imageFileName = 'school_logo.png';
          zip.file(`xl/media/${imageFileName}`, logoBuffer);

          let nextRId = 'rIdLogo1';
          const rIdMatches = [...dRelsXml.matchAll(/Id="([^"]+)"/g)].map(m => m[1]);
          let counter = 1;
          while (rIdMatches.includes(nextRId)) {
            counter++;
            nextRId = `rIdLogo${counter}`;
          }

          const newRel = `<Relationship Id="${nextRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${imageFileName}"/>`;
          dRelsXml = dRelsXml.replace('</Relationships>', `${newRel}</Relationships>`);
          zip.file('xl/drawings/_rels/drawing4.xml.rels', dRelsXml);

          // Replace placeholder Shape 4
          const sp4Match = dXml.match(/<xdr:sp\b[\s\S]*?<xdr:cNvPr[^>]*name="Shape 4"[\s\S]*?<\/xdr:sp>/);
          if (sp4Match) {
            const originalSp = sp4Match[0];
            const xfrmMatch = originalSp.match(/<a:xfrm>[\s\S]*?<\/a:xfrm>/);
            const xfrmContent = xfrmMatch
              ? xfrmMatch[0]
              : '<a:xfrm><a:off x="4418450" y="3081025"/><a:ext cx="1565400" cy="1585200"/></a:xfrm>';

            const picXml = `<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="4" name="School Logo"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${nextRId}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr>${xfrmContent}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic>`;

            dXml = dXml.replace(originalSp, picXml);
            zip.file('xl/drawings/drawing4.xml', dXml);
          }
        }
      }
    } catch {
      // Ignore logo fetch failure gracefully
    }
  }

  return await zip.generateAsync({ type: 'arraybuffer' });
}

/**
 * Exports Section Master Workbook containing all learners for Grade 12 TechPro with Cross
 */
export async function exportSF9Grade12TechProCrossSectionMasterToExcel(
  opts: SF9Grade12TechProCrossExportOptions,
  sectionName?: string,
  schoolYear?: string
): Promise<void> {
  const buffer = await fetchGrade12TechProCrossTemplateBuffer();
  const outBuffer = await populateGrade12TechProCrossTemplateBuffer(buffer, opts);

  const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const sec = (sectionName || opts.section || 'Grade 12').replace(/[^a-z0-9]/gi, '_');
  const sy = (schoolYear || opts.schoolYear || 'SY26-27').replace(/[^a-z0-9]/gi, '_');
  a.download = `SF9_SECTION_MASTER_${sec}_${sy}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
