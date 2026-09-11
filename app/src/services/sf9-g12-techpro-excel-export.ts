/**
 * SF9 Grade 12 Technical-Professional (TechPro / SSHS) Excel Export Service
 * Populates the official DepEd Grade 12 TechPro SF9 template
 * (G12 TechPro School Form 9 (SY 26-27).xlsx)
 * preserving all 6 worksheets, OpenXML styles, formulas, drawing relationships,
 * and calculations for:
 *   - Row 31: TechPro Elective 2 (Term 1, 12 units)
 *   - Row 32: TechPro Elective 3 (Term 2, 12 units)
 *   - Row 33: Work Immersion for TechPro Track (Term 3, 12 units)
 * totaling 36 units and General Average on Row 36.
 */

import JSZip from 'jszip';
import type { Student, SchoolProfile, Subject } from '../types';
import { formatLearnerName } from '../utils/student-name';

export interface SF9Grade12TechProExportOptions {
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

/**
 * Accurately detects Grade 12 Technical-Professional (TechPro / TVL / SSHS TechPro)
 */
export function isGrade12TechPro(
  gradeLevel: string | undefined | null,
  track?: string | undefined | null
): boolean {
  if (!gradeLevel) return false;
  const s = gradeLevel.trim().toLowerCase();

  // Must be Grade 12
  const isG12 = /\b(?:grade\s*12|g12|12)\b/i.test(s);
  if (!isG12) return false;

  if (!track) return false;
  const t = track.trim().toLowerCase();

  // Exclude Academic with Cross-Specialization
  if (t.includes('cross') || t.includes('academic with cross')) return false;

  return (
    t.includes('tech') ||
    t.includes('tvet') ||
    t.includes('tvl') ||
    t.includes('vocational') ||
    t.includes('technical-professional') ||
    t.includes('tech-pro') ||
    t.includes('techpro') ||
    (t.includes('sshs') && !t.includes('acad'))
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

export async function fetchGrade12TechProTemplateBuffer(): Promise<ArrayBuffer> {
  const cleanBase = (import.meta.env.BASE_URL || '/').endsWith('/')
    ? (import.meta.env.BASE_URL || '/')
    : `${import.meta.env.BASE_URL}/`;
  const timestamp = Date.now();

  const candidateUrls = [
    `${cleanBase}templates/G12 TechPro School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `/templates/G12 TechPro School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `templates/G12 TechPro School Form 9 (SY 26-27).xlsx?t=${timestamp}`,
    `${cleanBase}templates/G12%20TechPro%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
    `/templates/G12%20TechPro%20School%20Form%209%20(SY%2026-27).xlsx?t=${timestamp}`,
  ];

  for (const url of candidateUrls) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        return await resp.arrayBuffer();
      }
    } catch {
      // try next
    }
  }

  // Node environment fallback for tests
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const localPaths = [
        path.resolve(process.cwd(), 'app/public/templates/G12 TechPro School Form 9 (SY 26-27).xlsx'),
        path.resolve(process.cwd(), 'public/templates/G12 TechPro School Form 9 (SY 26-27).xlsx'),
        path.resolve(__dirname, '../../public/templates/G12 TechPro School Form 9 (SY 26-27).xlsx'),
      ];
      for (const lp of localPaths) {
        if (fs.existsSync(lp)) {
          const buf = fs.readFileSync(lp);
          return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        }
      }
    } catch {
      // ignore
    }
  }

  throw new Error('Failed to load Grade 12 TechPro template buffer: G12 TechPro School Form 9 (SY 26-27).xlsx');
}

export interface Grade12TechProGrades {
  tp2: number | '';
  tp2Name: string;
  tp3: number | '';
  tp3Name: string;
  wi: number | '';
  wiName: string;
  generalAverage: number | '';
  remarks: string;
  honors: string;
}

function getGradeFromEntry(entry: unknown, quarterIdx: number): number | '' {
  if (entry === undefined || entry === null) return '';
  if (typeof entry === 'number') return isNaN(entry) ? '' : entry;
  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    if (trimmed === '') return '';
    const num = Number(trimmed);
    return isNaN(num) ? '' : num;
  }
  if (Array.isArray(entry)) {
    const val = entry[quarterIdx];
    if (val === undefined || val === null || val === '') return '';
    const num = Number(val);
    return isNaN(num) ? '' : num;
  }
  if (typeof entry === 'object') {
    const obj = entry as Record<string, unknown>;
    const keys = quarterIdx === 0
      ? ['q1', 't1', 'term1', 'first', 'quarter1']
      : quarterIdx === 1
      ? ['q2', 't2', 'term2', 'second', 'quarter2']
      : ['q3', 't3', 'term3', 'third', 'quarter3'];

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

/**
 * Extracts scores and names for Grade 12 TechPro:
 * 3 Subjects (12 units each = 36 units total):
 *   Term 1: TechPro Elective 2 (12 units)
 *   Term 2: TechPro Elective 3 (12 units)
 *   Term 3: Work Immersion for TechPro Track (12 units)
 */
export function extractGrade12TechProGrades(
  gradesRecord: Record<string, unknown> = {},
  subjectsList: Subject[] = []
): Grade12TechProGrades {
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
    norm === 'techproelective2' ||
    norm === 'tp2' ||
    norm === 'techpro2' ||
    norm.includes('elective2') ||
    (sub?.term === 1 && !norm.includes('immersion') && !norm.includes('apprenticeship'))
  );

  // 2. TechPro Elective 3 (Term 2)
  const tp3Info = getSubjectInfo((_n, _c, norm, sub) =>
    norm === 'techproelective3' ||
    norm === 'tp3' ||
    norm === 'techpro3' ||
    norm.includes('elective3') ||
    (sub?.term === 2 && !norm.includes('immersion') && !norm.includes('apprenticeship'))
  );

  // 3. Work Immersion for TechPro Track (Term 3)
  const wiInfo = getSubjectInfo((_n, _c, norm, sub) =>
    norm.includes('workimmersion') ||
    norm.includes('immersion') ||
    norm.includes('apprenticeship') ||
    norm === 'techproelective4' ||
    norm === 'tp4' ||
    sub?.term === 3
  );

  let tp2: number | '' = tp2Info.scores[0];
  let tp3: number | '' = tp3Info.scores[1];
  let wi: number | '' = wiInfo.scores[2] || wiInfo.scores[0];

  let tp2Name = tp2Info.matchedName;
  let tp3Name = tp3Info.matchedName;
  let wiName = wiInfo.matchedName;

  // Fallback: If not matched by explicit keys, assign from sorted available subjects
  const unassignedKeys = Object.keys(gradesRecord).filter(
    k => k !== tp2Info.matchedName && k !== tp3Info.matchedName && k !== wiInfo.matchedName
  );
  if (tp2 === '' && unassignedKeys.length > 0) {
    const k = unassignedKeys.shift()!;
    tp2Name = k;
    tp2 = getGradeFromEntry(gradesRecord[k], 0);
  }
  if (tp3 === '' && unassignedKeys.length > 0) {
    const k = unassignedKeys.shift()!;
    tp3Name = k;
    tp3 = getGradeFromEntry(gradesRecord[k], 1);
  }
  if (wi === '' && unassignedKeys.length > 0) {
    const k = unassignedKeys.shift()!;
    wiName = k;
    wi = getGradeFromEntry(gradesRecord[k], 2);
  }

  // Weighting: 12 units each = 36 units total
  let totalWeighted = 0;
  let totalUnitsWithGrades = 0;
  let allPassed = true;
  let minGrade = 100;
  let hasAnyGrade = false;

  const checkGrade = (g: number | '', units: number) => {
    if (typeof g === 'number' && !isNaN(g) && g > 0) {
      hasAnyGrade = true;
      totalWeighted += g * units;
      totalUnitsWithGrades += units;
      if (g < 75) allPassed = false;
      if (g < minGrade) minGrade = g;
    }
  };

  checkGrade(tp2, 12);
  checkGrade(tp3, 12);
  checkGrade(wi, 12);

  let generalAverage: number | '' = '';
  let remarks = '';
  let honors = '';

  if (hasAnyGrade && totalUnitsWithGrades > 0) {
    generalAverage = Math.round(totalWeighted / (totalUnitsWithGrades === 36 ? 36 : totalUnitsWithGrades));
    remarks = generalAverage >= 75 && allPassed ? 'Passed' : (generalAverage < 75 ? 'Failed' : 'Passed');

    // DO 15, s. 2026 Academic Excellence criteria
    if (generalAverage >= 90 && minGrade >= 85) {
      if (generalAverage >= 98) honors = 'With Highest Honors';
      else if (generalAverage >= 95) honors = 'With High Honors';
      else honors = 'With Honors';
    }
  }

  return {
    tp2, tp2Name: tp2Name || 'TechPro Elective 2',
    tp3, tp3Name: tp3Name || 'TechPro Elective 3',
    wi, wiName: wiName || 'Work Immersion for TechPro Track',
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
    if (relMatch) {
      let target = relMatch[1];
      if (target.startsWith('/')) target = target.substring(1);
      if (!target.startsWith('xl/')) target = `xl/${target}`;
      sheets.push({ name, sheetId, rId, path: target });
    }
  }
  return sheets;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function updateCellInSheetXml(
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
    const rowNum = parseInt(rowMatch[2], 10);
    const rowRegex = new RegExp(`(<row\\b[^>]*?\\br="${rowNum}"[^>]*?>)(.*?)(</row>)`, 's');
    const rMatch = sheetXml.match(rowRegex);
    const sAttr = explicitStyle ? ` s="${explicitStyle}"` : '';
    const newCell = valXml
      ? `<c r="${cellRef}"${sAttr}${typeAttr}>${valXml}</c>`
      : `<c r="${cellRef}"${sAttr}/>`;

    if (rMatch) {
      return sheetXml.replace(rowRegex, `${rMatch[1]}${rMatch[2]}${newCell}${rMatch[3]}`);
    } else {
      const newRow = `<row r="${rowNum}">${newCell}</row>`;
      return sheetXml.replace('</sheetData>', `${newRow}</sheetData>`);
    }
  }
}

/**
 * Populates the entire Grade 12 TechPro template buffer
 */
export async function populateGrade12TechProTemplateBuffer(
  templateBuffer: ArrayBuffer | Uint8Array | ArrayLike<number> | Buffer,
  options: SF9Grade12TechProExportOptions
): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(templateBuffer as Parameters<typeof JSZip.loadAsync>[0]);
  const sheets = await getWorkbookSheetMap(zip);

  // Identify worksheets
  const inputSheet = sheets.find(s => s.name.toUpperCase().includes('INPUT')) || { path: 'xl/worksheets/sheet2.xml' };
  const summarySheet = sheets.find(s => s.name.toUpperCase() === 'SUMMARY') || { path: 'xl/worksheets/sheet3.xml' };
  const sf9Sheet = sheets.find(
    s => s.name.toUpperCase().includes('SF9') ||
         s.name.toUpperCase().includes('GRADE 12') ||
         s.name.toUpperCase().includes('TECHPRO')
  ) || { path: 'xl/worksheets/sheet4.xml' };
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
    inputXml = updateCellInSheetXml(inputXml, 'F28', 'TECHNICAL-PROFESSIONAL');
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

    const populateSummaryLearner = (st: StudentWithGrades, r: number, isFemale: boolean) => {
      const name = formatLearnerName(st).toUpperCase();
      const lrn = st.lrn || '';
      const bday = formatDateToMMDDYYYY(st.birthday);
      const inputRow = (isFemale ? r - 67 : r - 16) + 11;
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

      // Populate learner grades: Col K (TP2), Col L (TP3), Col M (WI)
      const stGrades = st.grades || (st.lrn === options.student.lrn ? options.grades : undefined);
      if (stGrades) {
        const extracted = extractGrade12TechProGrades(stGrades, options.subjects);
        summaryXml = updateCellInSheetXml(summaryXml, `K${r}`, extracted.tp2);
        summaryXml = updateCellInSheetXml(summaryXml, `L${r}`, extracted.tp3);
        summaryXml = updateCellInSheetXml(summaryXml, `M${r}`, extracted.wi);
      }
    };

    males.slice(0, 50).forEach((st, idx) => populateSummaryLearner(st, 16 + idx, false));
    females.slice(0, 50).forEach((st, idx) => populateSummaryLearner(st, 67 + idx, true));

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

    sf9Xml = updateCellInSheetXml(sf9Xml, 'C15', studentFullName, undefined, '350');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I15', studentAge, 'IF(C15="","",VLOOKUP(C15,SUMMARY!C16:M116,7,0))', '249');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'K15', studentSex, 'IF(C15="","",VLOOKUP(C15,SUMMARY!C16:M116,8,0))', '249');

    sf9Xml = updateCellInSheetXml(sf9Xml, 'C16', studentLrn, 'IF(C15="","",VLOOKUP(C15,SUMMARY!C16:M116,4,0))', '349');
    const gradeLevelDisplay = options.gradeLevel || st.grade_level || 'Grade 12';
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I16', gradeLevelDisplay, 'IF(\'INPUT DATA\'!F27="","",\'INPUT DATA\'!F27)', '249');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'K16', options.section.toUpperCase(), 'IF(\'INPUT DATA\'!F29="","",\'INPUT DATA\'!F29)', '249');

    sf9Xml = updateCellInSheetXml(sf9Xml, 'E17', 'TECHNICAL-PROFESSIONAL', 'IF(\'INPUT DATA\'!F28="","",\'INPUT DATA\'!F28)', '381');

    // Signatures
    const principal = options.principal || prof?.head_name || '';
    if (principal) sf9Xml = updateCellInSheetXml(sf9Xml, 'B25', principal.toUpperCase(), 'IF(\'INPUT DATA\'!F19="","",\'INPUT DATA\'!F19)');
    const adviser = options.adviser || prof?.adviser_name || '';
    if (adviser) sf9Xml = updateCellInSheetXml(sf9Xml, 'H25', adviser.toUpperCase(), 'IF(\'INPUT DATA\'!F26="","",\'INPUT DATA\'!F26)');

    // Subject Grades & Names
    const currentGrades = extractGrade12TechProGrades(options.grades, options.subjects);

    // Subject Names
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B31', currentGrades.tp2Name, undefined, '400');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B32', currentGrades.tp3Name, undefined, '400');
    sf9Xml = updateCellInSheetXml(sf9Xml, 'B33', currentGrades.wiName, undefined, '400');

    // Row 31: TechPro Elective 2 (Term 1, 12 units)
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'F31',
      currentGrades.tp2,
      'IF(SUMMARY!K16="","",VLOOKUP(C15,SUMMARY!C16:M116,9,0))',
      '40'
    );
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I31', 12, undefined, '170');
    const tp2Final = currentGrades.tp2 !== '' ? currentGrades.tp2 : '';
    const tp2Pts = typeof currentGrades.tp2 === 'number' ? currentGrades.tp2 * 12 : '';
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'J31',
      tp2Final,
      'IF(SUM(F31:H31)=0, "", ROUND((F31+H31+G31)*(I31)/I31,0))',
      '40'
    );
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'K31',
      typeof tp2Final === 'number' ? (tp2Final >= 75 ? 'Passed' : 'Failed') : '',
      'IF(J31="", "", IF(J31>=75, "Passed", "Failed"))',
      '40'
    );
    sf9Xml = updateCellInSheetXml(sf9Xml, 'L31', tp2Pts, 'IF(J31="","",J31*I31)', '171');

    // Row 32: TechPro Elective 3 (Term 2, 12 units)
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'G32',
      currentGrades.tp3,
      'IF(SUMMARY!K16="","",VLOOKUP(C15,SUMMARY!C16:M116,10,0))',
      '251'
    );
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I32', 12, undefined, '170');
    const tp3Final = currentGrades.tp3 !== '' ? currentGrades.tp3 : '';
    const tp3Pts = typeof currentGrades.tp3 === 'number' ? currentGrades.tp3 * 12 : '';
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'J32',
      tp3Final,
      'IF(SUM(F32:H32)=0, "", ROUND((F32+H32+G32)*(I32)/I32,0))',
      '40'
    );
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'K32',
      typeof tp3Final === 'number' ? (tp3Final >= 75 ? 'Passed' : 'Failed') : '',
      'IF(J32="", "", IF(J32>=75, "Passed", "Failed"))',
      '40'
    );
    sf9Xml = updateCellInSheetXml(sf9Xml, 'L32', tp3Pts, 'IF(J32="","",J32*I32)', '171');

    // Row 33: Work Immersion for TechPro Track (Term 3, 12 units)
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'H33',
      currentGrades.wi,
      'IF(SUMMARY!K16="","",VLOOKUP(C15,SUMMARY!C16:M116,11,0))',
      '251'
    );
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I33', 12, undefined, '170');
    const wiFinal = currentGrades.wi !== '' ? currentGrades.wi : '';
    const wiPts = typeof currentGrades.wi === 'number' ? currentGrades.wi * 12 : '';
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'J33',
      wiFinal,
      'IF(SUM(F33:H33)=0, "", ROUND((F33+H33+G33)*(I33)/I33,0))',
      '40'
    );
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'K33',
      typeof wiFinal === 'number' ? (wiFinal >= 75 ? 'Passed' : 'Failed') : '',
      'IF(J33="", "", IF(J33>=75, "Passed", "Failed"))',
      '40'
    );
    sf9Xml = updateCellInSheetXml(sf9Xml, 'L33', wiPts, 'IF(J33="","",J33*I33)', '171');

    // Row 36: General Average (36 Total Units)
    const sumPts = (typeof tp2Pts === 'number' ? tp2Pts : 0) +
                   (typeof tp3Pts === 'number' ? tp3Pts : 0) +
                   (typeof wiPts === 'number' ? wiPts : 0);
    sf9Xml = updateCellInSheetXml(sf9Xml, 'I36', 36, 'SUM(I25:I35)', '236');
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'J36',
      currentGrades.generalAverage,
      'IF(COUNT(J25:J31,J33:J35)=0,"",ROUND(L36/I36,0))',
      '236'
    );
    sf9Xml = updateCellInSheetXml(
      sf9Xml,
      'K36',
      currentGrades.remarks,
      'IF(J36="", "", IF(J36>=75, "Passed", "Failed"))',
      '237'
    );
    sf9Xml = updateCellInSheetXml(sf9Xml, 'L36', sumPts > 0 ? sumPts : '', 'SUM(L25:L35)', '171');

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
    sf9Xml = sf9Xml.replace(/<f t="shared" ref="L31:L33" si="4">J31\*I31<\/f>/g, '<f>IF(J31="","",J31*I31)</f>');
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
        const mediaFileName = 'school_logo_g12_techpro.png';
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
      console.warn('Could not replace school logo in Grade 12 TechPro drawing:', err);
    }
  }

  return zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}

/**
 * Export the complete Grade 12 TechPro Section Master SF9 Workbook containing all learners
 */
export async function exportSF9Grade12TechProSectionMasterToExcel(
  opts: SF9Grade12TechProExportOptions,
  sectionName: string,
  schoolYear: string
): Promise<void> {
  const buffer = await fetchGrade12TechProTemplateBuffer();
  const outBuffer = await populateGrade12TechProTemplateBuffer(buffer, opts);

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
