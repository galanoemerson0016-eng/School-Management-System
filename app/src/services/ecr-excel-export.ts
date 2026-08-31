/**
 * Official DepEd Grades 2-10 3-Term Electronic Class Record (ECR) Excel Export Service
 * 
 * Direct OpenXML SpreadsheetML Population Engine:
 * - Supports official separated DepEd templates:
 *   1. Academic (Science, Math, English, Filipino, GMRC-VE, Araling Panlipunan, Makabansa)
 *   2. EPP / TLE (EPP/TLE for Grades 4-6, TLE for Grades 7-10)
 *   3. MAPEH (9-sheet composite workbook with Music & Arts and PE & Health)
 * - Modifies raw value cells in sheet1.xml (INPUT DATA) and grading sheets.
 * - Leaves 100% of OpenXML formula nodes (<f>...</f>), drawing relationships,
 *   styles, print properties, and summary sheets in their original authentic state.
 * - Full calculation on open (calcPr fullCalcOnLoad="1").
 */

import JSZip from 'jszip';
import type { SchoolProfile, Student, Section, Subject, ClassRecord, HPSRecord } from '../types';
import { formatLearnerName } from '../utils/student-name';

const WW_COUNT = 5;
const PT_COUNT = 3;
const ST_COUNT = 3;
const MAX_STUDENTS_PER_GENDER = 50;

export const TEMPLATE_ACADEMIC = '[Grades 2-10] 3Term E-Class Record (for Science, Math, English, Filipino, Araling Panlipunan).xlsx';
export const TEMPLATE_GMRC_VE = '[Grades 2-10] 3Term E-Class Record (for GMRC - Values Education).xlsx';
export const TEMPLATE_EPP_TLE = '[Grades 2-10] 3Term E-Class Record (for EPP-TLE).xlsx';
export const TEMPLATE_MAPEH = '[Grades 2-10] 3Term E-Class Record (for Music and Arts, P.E. and Health).xlsx';

export type ECRTemplateType = 'academic' | 'gmrc_ve' | 'epp_tle' | 'mapeh';

export interface ECRExcelExportOptions {
  schoolProfile: SchoolProfile | null;
  schoolYear: string;
  section: Section;
  subject: Subject;
  allSubjects?: Subject[];
  teacherName?: string;
  students: Student[];
  classRecords: ClassRecord[];
  hpsRecords: HPSRecord[];
}

/**
 * Helper to determine if a grade level is within the official Grades 2-10 range.
 * Excludes Kindergarten, Grade 1 (which uses PACE), and Senior High (Grade 11 & Grade 12).
 */
export function isGrade2To10(gradeLevel?: string): boolean {
  if (!gradeLevel) return false;
  const match = String(gradeLevel).match(/\d+/);
  if (!match) return false;
  const num = parseInt(match[0], 10);
  return num >= 2 && num <= 10;
}

export function isGmrcVeSubject(subjectName: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return (
    norm.includes('gmrc') ||
    norm.includes('valueseducation') ||
    norm.includes('values') ||
    norm.includes('goodmanners') ||
    norm.includes('goodmoral') ||
    norm.includes('edukasyonsapagpapakatao') ||
    norm === 'esp' ||
    norm.includes('pagpapakatao')
  );
}

export function isMapehSubject(subjectName: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return (
    norm.includes('mapeh') ||
    norm.includes('music') ||
    norm.includes('art') ||
    norm.includes('physicaleducation') ||
    norm.includes('peandhealth') ||
    norm.includes('pehealth') ||
    (norm.includes('pe') && norm.includes('health')) ||
    norm.includes('health')
  );
}

export function isEppTleSubject(subjectName: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return (
    norm.includes('epp') ||
    norm.includes('tle') ||
    norm.includes('technologyandlivelihood') ||
    norm.includes('edukasyongpantahanan') ||
    norm.includes('tvl') ||
    norm.includes('specialization')
  );
}

export function getECRTemplateType(subjectName: string, _gradeLevel?: string): ECRTemplateType {
  if (isGmrcVeSubject(subjectName)) return 'gmrc_ve';
  if (isMapehSubject(subjectName)) return 'mapeh';
  if (isEppTleSubject(subjectName)) return 'epp_tle';
  return 'academic';
}

export function getECRTemplateFilename(subjectName: string, gradeLevel?: string): string {
  if (gradeLevel && !isGrade2To10(gradeLevel)) {
    throw new Error(`Official DepEd 3-Term E-Class Record templates are only available for Grades 2 to 10 (received "${gradeLevel}").`);
  }
  const type = getECRTemplateType(subjectName, gradeLevel);
  if (type === 'gmrc_ve') return TEMPLATE_GMRC_VE;
  if (type === 'mapeh') return TEMPLATE_MAPEH;
  if (type === 'epp_tle') return TEMPLATE_EPP_TLE;
  return TEMPLATE_ACADEMIC;
}

export async function fetchECRTemplateBuffer(templateFilename: string): Promise<ArrayBuffer> {
  const baseUrl = import.meta.env.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const timestamp = Date.now();

  let aliasFilename = 'ECR_Template_Academic_G2_G10.xlsx';
  if (templateFilename.includes('GMRC') || templateFilename.includes('Values Education') || templateFilename.includes('GMRC_VE')) {
    aliasFilename = 'ECR_Template_GMRC_VE_G2_G10.xlsx';
  } else if (templateFilename.includes('EPP-TLE') || templateFilename.includes('EPP_TLE')) {
    aliasFilename = 'ECR_Template_EPP_TLE_G2_G10.xlsx';
  } else if (templateFilename.includes('Music and Arts') || templateFilename.includes('MAPEH')) {
    aliasFilename = 'ECR_Template_MAPEH_G2_G10.xlsx';
  }

  const candidateUrls: string[] = [
    `${cleanBase}templates/${aliasFilename}?t=${timestamp}`,
    `/templates/${aliasFilename}?t=${timestamp}`,
    `templates/${aliasFilename}?t=${timestamp}`,
    `${cleanBase}templates/${encodeURI(templateFilename)}?t=${timestamp}`,
    `/templates/${encodeURI(templateFilename)}?t=${timestamp}`,
    `templates/${encodeURI(templateFilename)}?t=${timestamp}`,
    `${cleanBase}templates/${templateFilename}?t=${timestamp}`,
    `/templates/${templateFilename}?t=${timestamp}`,
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        // Ensure the response is an actual Excel/ZIP archive (PK\x03\x04), not an HTML SPA fallback
        if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
          return buffer;
        }
      }
    } catch {
      // Try next candidate path
    }
  }

  throw new Error(`Could not load official DepEd Excel template binary for "${templateFilename}". Please ensure template files exist in public/templates.`);
}

/**
 * Updates or sets a cell in a Worksheet XML string cleanly, preserving cell styles.
 */
function updateCellInXml(sheetXml: string, cellRef: string, value: string | number | null | undefined, type: 'string' | 'number' = 'number'): string {
  const cellRegex = new RegExp(`(<c\\s+r="${cellRef}"[^>]*?)(?:/>|>(.*?)</c>)`, 's');
  const match = sheetXml.match(cellRegex);

  if (value === null || value === undefined || value === '') {
    if (match) {
      const sMatch = match[1].match(/\s+s="\d+"/);
      const styleAttr = sMatch ? sMatch[0] : '';
      return sheetXml.replace(cellRegex, `<c r="${cellRef}"${styleAttr}/>`);
    }
    return sheetXml;
  }

  const sMatch = match ? match[1].match(/\s+s="\d+"/) : null;
  const styleAttr = sMatch ? sMatch[0] : '';

  let newCellXml = '';
  if (type === 'string') {
    const escaped = String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    newCellXml = `<c r="${cellRef}"${styleAttr} t="inlineStr"><is><t>${escaped}</t></is></c>`;
  } else {
    const num = Number(value);
    newCellXml = `<c r="${cellRef}"${styleAttr}><v>${isNaN(num) ? 0 : num}</v></c>`;
  }

  if (match) {
    return sheetXml.replace(cellRegex, newCellXml);
  } else {
    const rowNum = parseInt(cellRef.replace(/\D/g, ''), 10);
    const rowRegex = new RegExp(`(<row\\s+r="${rowNum}"[^>]*>)(.*?)(</row>)`, 's');
    if (sheetXml.match(rowRegex)) {
      return sheetXml.replace(rowRegex, `$1$2${newCellXml}$3`);
    }
    return sheetXml;
  }
}

export const normalizeScores = (scores: (number | string)[] | undefined, count: number): (number | string)[] => {
  const src = Array.isArray(scores) ? scores : [];
  return Array.from({ length: count }, (_, i) => src[i] ?? '');
};

export const parseNumericScore = (val: number | string | null | undefined): number | null => {
  if (val === '' || val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
};

const OFFICIAL_REGIONS = [
  'Select Region', 'CAR', 'NCR', 'Region I', 'Region II', 'Region III', 'Region IV-A', 'MIMAROPA',
  'Region V', 'Region VI', 'Region VII', 'Region VIII', 'NIR', 'Region IX', 'Region X', 'Region XI',
  'Region XII', 'CARAGA', 'BARMM'
];

/**
 * Normalizes input region string to match the exact official DepEd dropdown value in E10.
 */
export function normalizeRegionForECR(raw?: string): string {
  if (!raw) return 'Select Region';
  const clean = String(raw).trim();
  const directMatch = OFFICIAL_REGIONS.find(r => r.toLowerCase() === clean.toLowerCase());
  if (directMatch) return directMatch;

  const upper = clean.toUpperCase();
  if (upper.includes('IV-A') || upper.includes('4-A') || upper.includes('4A') || upper.includes('CALABARZON')) return 'Region IV-A';
  if (upper.includes('IV-B') || upper.includes('4-B') || upper.includes('4B') || upper.includes('MIMAROPA')) return 'MIMAROPA';
  if (upper.includes('CARAGA') || upper.includes('XIII') || upper.includes(' 13') || upper.includes('REGION 13')) return 'CARAGA';
  if (upper.includes('BARMM') || upper.includes('BANGSAMORO') || upper.includes('ARMM')) return 'BARMM';
  if (upper.includes('CAR') || upper.includes('CORDILLERA')) return 'CAR';
  if (upper.includes('NCR') || upper.includes('NATIONAL CAPITAL')) return 'NCR';
  if (upper.includes('NIR') || upper.includes('NEGROS')) return 'NIR';

  // Check from highest to lowest index to prevent single-digit prefix collisions
  if (upper.includes('XII') || upper.includes(' 12') || upper.includes('REGION 12') || upper.includes('SOCCSKSARGEN')) return 'Region XII';
  if (upper.includes('XI') || upper.includes(' 11') || upper.includes('REGION 11') || upper.includes('DAVAO')) return 'Region XI';
  if (upper.includes('X') || upper.includes(' 10') || upper.includes('REGION 10') || upper.includes('NORTHERN MINDANAO')) return 'Region X';
  if (upper.includes('IX') || upper.includes(' 9') || upper.includes('REGION 9') || upper.includes('ZAMBOANGA')) return 'Region IX';
  if (upper.includes('VIII') || upper.includes(' 8') || upper.includes('REGION 8') || upper.includes('EASTERN VISAYAS')) return 'Region VIII';
  if (upper.includes('VII') || upper.includes(' 7') || upper.includes('REGION 7') || upper.includes('CENTRAL VISAYAS')) return 'Region VII';
  if (upper.includes('VI') || upper.includes(' 6') || upper.includes('REGION 6') || upper.includes('WESTERN VISAYAS')) return 'Region VI';
  if (upper.includes('V') || upper.includes(' 5') || upper.includes('REGION 5') || upper.includes('BICOL')) return 'Region V';
  if (upper.includes('III') || upper.includes(' 3') || upper.includes('REGION 3') || upper.includes('CENTRAL LUZON')) return 'Region III';
  if (upper.includes('II') || upper.includes(' 2') || upper.includes('REGION 2') || upper.includes('CAGAYAN')) return 'Region II';
  if (upper.includes(' I') || upper.includes(' 1') || upper.includes('REGION 1') || upper.includes('ILOCOS')) return 'Region I';

  return clean;
}

/**
 * Normalizes input grade level string to match the exact official DepEd numeric dropdown value (2, 3, 4, 5, 6, 7, 8, 9, 10) in E25.
 */
export function normalizeGradeLevelForECR(raw?: string): string {
  if (!raw) return '2';
  const match = String(raw).match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num >= 2 && num <= 10) {
      return String(num);
    }
  }
  return String(raw).trim();
}

/**
 * Normalizes input subject name to match the exact official DepEd dropdown value in E24.
 * Template 1 (Academic): Science, Mathematics, GMRC, Values Education, Filipino, English, Araling Panlipunan, Makabansa
 * Template 2 (EPP/TLE): EPP/TLE, TLE
 * Template 3 (MAPEH): MAPEH
 */
export function normalizeSubjectForECR(
  subjectName: string,
  templateType?: ECRTemplateType,
  gradeLevel?: string
): string {
  const actualType = templateType || getECRTemplateType(subjectName, gradeLevel);
  const norm = String(subjectName || '').trim().toLowerCase();
  const gradeNum = parseInt(normalizeGradeLevelForECR(gradeLevel), 10) || 0;

  if (actualType === 'mapeh') {
    return 'MAPEH';
  }

  if (templateType === 'gmrc_ve') {
    // Data validation dropdown in E24: "GMRC, Values Education"
    return gradeNum >= 7 ? 'Values Education' : 'GMRC';
  }

  if (templateType === 'epp_tle') {
    if (norm.includes('epp') && !norm.includes('tle')) return 'EPP/TLE';
    if (norm.includes('tle') || norm.includes('tvl') || norm.includes('technol')) {
      return gradeNum <= 6 ? 'EPP/TLE' : 'TLE';
    }
    return gradeNum <= 6 ? 'EPP/TLE' : 'TLE';
  }

  // Academic subjects
  if (norm.includes('sci')) return 'Science';
  if (norm.includes('math')) return 'Mathematics';
  if (norm.includes('eng')) return 'English';
  if (norm.includes('fil')) return 'Filipino';
  if (norm.includes('makabansa')) return 'Makabansa';
  if (norm.includes('aral') || norm === 'ap' || norm.includes('panlipunan') || norm.includes('social')) return 'Araling Panlipunan';

  const acList = ['Science', 'Mathematics', 'Filipino', 'English', 'Araling Panlipunan', 'Makabansa'];
  const exact = acList.find(x => x.toLowerCase() === norm);
  if (exact) return exact;

  return subjectName.trim() || 'Science';
}

/**
 * Internal helper to populate a single term's score sheet (WWs, PTs, STs, Exam).
 */
function populateTermGradingXml(
  sheetXml: string,
  targetSubjectId: string,
  term: 1 | 2 | 3,
  schoolYear: string,
  section: Section,
  maleStudents: Student[],
  femaleStudents: Student[],
  classRecords: ClassRecord[],
  hpsRecords: HPSRecord[],
  templateType: ECRTemplateType = 'academic'
): string {
  const isGmrc = templateType === 'gmrc_ve';
  const wwCount = isGmrc ? 10 : WW_COUNT;
  const ptCount = isGmrc ? 9 : PT_COUNT;
  const hpsRow = isGmrc ? 16 : 15;
  const maleStartRow = isGmrc ? 19 : 18;
  const femaleStartRow = isGmrc ? 70 : 69;

  const hpsRecord = hpsRecords.find(
    r =>
      r.subject_id === targetSubjectId &&
      r.school_year === schoolYear &&
      Number(r.quarter) === term &&
      (r.section_id === section.id || r.section_id === section.section_name)
  ) || hpsRecords.find(
    r =>
      r.subject_id === targetSubjectId &&
      r.school_year === schoolYear &&
      Number(r.quarter) === term &&
      !r.section_id
  );

  const rawQaHps = (hpsRecord as (HPSRecord & { summative_tests?: (number | string)[] }) | undefined)?.summative_tests;
  const hps_ww = normalizeScores(hpsRecord?.written_works, wwCount);
  const hps_pt = normalizeScores(hpsRecord?.performance_tasks, ptCount);
  const hps_qa = normalizeScores(rawQaHps, ST_COUNT);
  if (hps_qa[2] === '' && hpsRecord?.quarterly_exam !== '' && hpsRecord?.quarterly_exam !== undefined) {
    hps_qa[2] = hpsRecord.quarterly_exam;
  }

  if (isGmrc) {
    // GMRC & Values Education template
    // WW Cognitive (indices 0..4)
    ['F', 'G', 'H', 'I', 'J'].forEach((col, idx) => {
      sheetXml = updateCellInXml(sheetXml, `${col}${hpsRow}`, parseNumericScore(hps_ww[idx]), 'number');
    });
    // WW Affective (indices 5..9)
    ['N', 'O', 'P', 'Q', 'R'].forEach((col, idx) => {
      sheetXml = updateCellInXml(sheetXml, `${col}${hpsRow}`, parseNumericScore(hps_ww[5 + idx]), 'number');
    });
    // PT Cognitive (indices 0..2)
    ['V', 'W', 'X'].forEach((col, idx) => {
      sheetXml = updateCellInXml(sheetXml, `${col}${hpsRow}`, parseNumericScore(hps_pt[idx]), 'number');
    });
    // PT Affective (indices 3..5)
    ['AB', 'AC', 'AD'].forEach((col, idx) => {
      sheetXml = updateCellInXml(sheetXml, `${col}${hpsRow}`, parseNumericScore(hps_pt[3 + idx]), 'number');
    });
    // PT Behavioral (indices 6..8)
    ['AH', 'AI', 'AJ'].forEach((col, idx) => {
      sheetXml = updateCellInXml(sheetXml, `${col}${hpsRow}`, parseNumericScore(hps_pt[6 + idx]), 'number');
    });
    sheetXml = updateCellInXml(sheetXml, `AN${hpsRow}`, parseNumericScore(hps_qa[0]), 'number');
    sheetXml = updateCellInXml(sheetXml, `AO${hpsRow}`, parseNumericScore(hps_qa[1]), 'number');
    sheetXml = updateCellInXml(sheetXml, `AP${hpsRow}`, parseNumericScore(hps_qa[2]), 'number');

    // Subweights (30 / 30 / 40)
    sheetXml = updateCellInXml(sheetXml, `AQ${hpsRow}`, 30, 'number');
    sheetXml = updateCellInXml(sheetXml, `AR${hpsRow}`, 30, 'number');
    sheetXml = updateCellInXml(sheetXml, `AS${hpsRow}`, 40, 'number');
  } else {
    // Academic, EPP/TLE & MAPEH
    const wwCols = ['F', 'G', 'H', 'I', 'J'];
    const ptCols = ['N', 'O', 'P'];

    wwCols.forEach((col, idx) => {
      sheetXml = updateCellInXml(sheetXml, `${col}15`, parseNumericScore(hps_ww[idx]), 'number');
    });
    ptCols.forEach((col, idx) => {
      sheetXml = updateCellInXml(sheetXml, `${col}15`, parseNumericScore(hps_pt[idx]), 'number');
    });
    sheetXml = updateCellInXml(sheetXml, 'T15', parseNumericScore(hps_qa[0]), 'number');
    sheetXml = updateCellInXml(sheetXml, 'U15', parseNumericScore(hps_qa[1]), 'number');
    sheetXml = updateCellInXml(sheetXml, 'V15', parseNumericScore(hps_qa[2]), 'number');

    // Subweights (30 / 30 / 40)
    sheetXml = updateCellInXml(sheetXml, 'W15', 30, 'number');
    sheetXml = updateCellInXml(sheetXml, 'X15', 30, 'number');
    sheetXml = updateCellInXml(sheetXml, 'Y15', 40, 'number');
  }

  // Populate student scores
  const populateRosterScores = (list: Student[], startRow: number) => {
    for (let i = 0; i < MAX_STUDENTS_PER_GENDER; i++) {
      const row = startRow + i;
      if (i < list.length) {
        const st = list[i];
        const rec = classRecords.find(
          r =>
            r.student_lrn === st.lrn &&
            r.subject_id === targetSubjectId &&
            Number(r.quarter) === term &&
            r.school_year === schoolYear
        );
        const rawQa = (rec as (ClassRecord & { summative_tests?: (number | string)[] }) | undefined)?.summative_tests;
        const ww = normalizeScores(rec?.written_works, wwCount);
        const pt = normalizeScores(rec?.performance_tasks, ptCount);
        const qa = normalizeScores(rawQa, ST_COUNT);
        if (qa[2] === '' && rec?.quarterly_exam !== '' && rec?.quarterly_exam !== undefined) {
          qa[2] = rec.quarterly_exam;
        }

        if (isGmrc) {
          // WW Cognitive (indices 0..4)
          ['F', 'G', 'H', 'I', 'J'].forEach((col, cIdx) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, parseNumericScore(ww[cIdx]), 'number');
          });
          // WW Affective (indices 5..9)
          ['N', 'O', 'P', 'Q', 'R'].forEach((col, cIdx) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, parseNumericScore(ww[5 + cIdx]), 'number');
          });
          // PT Cognitive (indices 0..2)
          ['V', 'W', 'X'].forEach((col, cIdx) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, parseNumericScore(pt[cIdx]), 'number');
          });
          // PT Affective (indices 3..5)
          ['AB', 'AC', 'AD'].forEach((col, cIdx) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, parseNumericScore(pt[3 + cIdx]), 'number');
          });
          // PT Behavioral (indices 6..8)
          ['AH', 'AI', 'AJ'].forEach((col, cIdx) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, parseNumericScore(pt[6 + cIdx]), 'number');
          });
          sheetXml = updateCellInXml(sheetXml, `AN${row}`, parseNumericScore(qa[0]), 'number');
          sheetXml = updateCellInXml(sheetXml, `AO${row}`, parseNumericScore(qa[1]), 'number');
          sheetXml = updateCellInXml(sheetXml, `AP${row}`, parseNumericScore(qa[2]), 'number');
        } else {
          const wwCols = ['F', 'G', 'H', 'I', 'J'];
          const ptCols = ['N', 'O', 'P'];
          wwCols.forEach((col, cIdx) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, parseNumericScore(ww[cIdx]), 'number');
          });
          ptCols.forEach((col, cIdx) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, parseNumericScore(pt[cIdx]), 'number');
          });
          sheetXml = updateCellInXml(sheetXml, `T${row}`, parseNumericScore(qa[0]), 'number');
          sheetXml = updateCellInXml(sheetXml, `U${row}`, parseNumericScore(qa[1]), 'number');
          sheetXml = updateCellInXml(sheetXml, `V${row}`, parseNumericScore(qa[2]), 'number');
        }
      } else {
        // Clear row scores
        if (isGmrc) {
          ['F', 'G', 'H', 'I', 'J', 'N', 'O', 'P', 'Q', 'R', 'V', 'W', 'X', 'AB', 'AC', 'AD', 'AH', 'AI', 'AJ', 'AN', 'AO', 'AP'].forEach((col) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, null, 'number');
          });
        } else {
          ['F', 'G', 'H', 'I', 'J', 'N', 'O', 'P', 'T', 'U', 'V'].forEach((col) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, null, 'number');
          });
        }
      }
    }
  };

  populateRosterScores(maleStudents, maleStartRow);
  populateRosterScores(femaleStudents, femaleStartRow);

  return sheetXml;
}

/**
 * Populates official data directly into the OpenXML template archive.
 */
export async function populateECRWorkbookZip(
  templateBuffer: ArrayBuffer | Uint8Array,
  opts: ECRExcelExportOptions
): Promise<JSZip> {
  const {
    schoolProfile,
    schoolYear,
    section,
    subject,
    allSubjects,
    teacherName,
    students,
    classRecords,
    hpsRecords
  } = opts;

  const zip = await JSZip.loadAsync(templateBuffer);
  const templateType = getECRTemplateType(subject.subject_name, section.section_grade_level);

  // Filter students for section & subject
  let sectionStudents = students.filter(
    s => s.student_section === section.id || s.student_section === section.section_name
  );

  if (subject.enrolled_student_lrns && subject.enrolled_student_lrns.length > 0) {
    sectionStudents = sectionStudents.filter(s => subject.enrolled_student_lrns?.includes(s.lrn));
  }

  const maleStudents = sectionStudents
    .filter(s => s.gender === 'Male')
    .sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`))
    .slice(0, MAX_STUDENTS_PER_GENDER);

  const femaleStudents = sectionStudents
    .filter(s => s.gender === 'Female')
    .sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`))
    .slice(0, MAX_STUDENTS_PER_GENDER);

  // 1. Populate INPUT DATA (sheet1.xml)
  const sheet1File = zip.file('xl/worksheets/sheet1.xml');
  if (sheet1File) {
    let sheet1Xml = await sheet1File.async('text');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E10', normalizeRegionForECR(schoolProfile?.region), 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E11', (schoolProfile?.division || '').toUpperCase(), 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E13', schoolProfile?.school_id || '', 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E14', (schoolProfile?.name || '').toUpperCase(), 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E15', schoolYear || '', 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E16', (schoolProfile?.head_name || '').toUpperCase(), 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E23', (teacherName || section.adviser_name || schoolProfile?.adviser_name || '').toUpperCase(), 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E24', normalizeSubjectForECR(subject.subject_name, templateType, section.section_grade_level), 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E25', normalizeGradeLevelForECR(section.section_grade_level), 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E26', section.section_name.toUpperCase(), 'string');

    // Male Learner Names (K11..K60)
    for (let i = 0; i < MAX_STUDENTS_PER_GENDER; i++) {
      const nameVal = i < maleStudents.length ? formatLearnerName(maleStudents[i]).toUpperCase() : null;
      sheet1Xml = updateCellInXml(sheet1Xml, `K${11 + i}`, nameVal, 'string');
    }

    // Female Learner Names (N11..N60)
    for (let i = 0; i < MAX_STUDENTS_PER_GENDER; i++) {
      const nameVal = i < femaleStudents.length ? formatLearnerName(femaleStudents[i]).toUpperCase() : null;
      sheet1Xml = updateCellInXml(sheet1Xml, `N${11 + i}`, nameVal, 'string');
    }

    zip.file('xl/worksheets/sheet1.xml', sheet1Xml);
  }

  // 2. Populate Grading Sheets
  if (templateType === 'mapeh') {
    // MAPEH Template has 6 grading sheets:
    // sheet2.xml: TERM 1 Music and Arts, sheet3.xml: TERM 1 PE and Health
    // sheet4.xml: TERM 2 Music and Arts, sheet5.xml: TERM 2 PE and Health
    // sheet6.xml: TERM 3 Music and Arts, sheet7.xml: TERM 3 PE and Health

    const pool = allSubjects && allSubjects.length > 0 ? allSubjects : [subject];

    const maSubject = pool.find(s => {
      const n = s.subject_name.toLowerCase();
      return (n.includes('music') && n.includes('art')) || n === 'music' || n === 'arts';
    }) || subject;

    const peSubject = pool.find(s => {
      const n = s.subject_name.toLowerCase();
      return (n.includes('pe') && n.includes('health')) || n.includes('physical education') || n === 'pe' || n === 'health';
    }) || subject;

    const terms: Array<1 | 2 | 3> = [1, 2, 3];
    for (const term of terms) {
      const maSheetPath = `xl/worksheets/sheet${(term - 1) * 2 + 2}.xml`;
      const peSheetPath = `xl/worksheets/sheet${(term - 1) * 2 + 3}.xml`;

      const maFile = zip.file(maSheetPath);
      if (maFile) {
        let xml = await maFile.async('text');
        xml = populateTermGradingXml(xml, maSubject.id, term, schoolYear, section, maleStudents, femaleStudents, classRecords, hpsRecords, templateType);
        zip.file(maSheetPath, xml);
      }

      const peFile = zip.file(peSheetPath);
      if (peFile) {
        let xml = await peFile.async('text');
        xml = populateTermGradingXml(xml, peSubject.id, term, schoolYear, section, maleStudents, femaleStudents, classRecords, hpsRecords, templateType);
        zip.file(peSheetPath, xml);
      }
    }
  } else {
    // Academic, GMRC/VE & EPP/TLE Templates:
    // sheet2.xml: TERM 1, sheet3.xml: TERM 2, sheet4.xml: TERM 3
    const terms: Array<1 | 2 | 3> = [1, 2, 3];
    for (const term of terms) {
      const sheetPath = `xl/worksheets/sheet${term + 1}.xml`;
      const sheetFile = zip.file(sheetPath);
      if (!sheetFile) continue;

      let sheetXml = await sheetFile.async('text');
      sheetXml = populateTermGradingXml(sheetXml, subject.id, term, schoolYear, section, maleStudents, femaleStudents, classRecords, hpsRecords, templateType);
      zip.file(sheetPath, sheetXml);
    }
  }

  // 3. Ensure full calculation on open (calcPr fullCalcOnLoad="1")
  const wbFile = zip.file('xl/workbook.xml');
  if (wbFile) {
    let wbXml = await wbFile.async('text');
    if (wbXml.includes('<calcPr')) {
      wbXml = wbXml.replace(/<calcPr([^>]*?)(?:\/>|>.*?<\/calcPr>)/, '<calcPr$1 fullCalcOnLoad="1"/>');
    } else {
      wbXml = wbXml.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>');
    }
    zip.file('xl/workbook.xml', wbXml);
  }

  return zip;
}

/**
 * Exports a single Subject's official 3-Term E-Class Record to Excel (.xlsx).
 * Available only for Grades 2 to 10.
 */
export async function exportECRToExcel(opts: ECRExcelExportOptions): Promise<void> {
  const gradeLevel = opts.section.section_grade_level;
  if (!isGrade2To10(gradeLevel)) {
    throw new Error(`Official DepEd 3-Term E-Class Record export is only available for Grades 2 to 10. Grade Level "${gradeLevel || 'unknown'}" is not supported.`);
  }

  const templateName = getECRTemplateFilename(opts.subject.subject_name, opts.section.section_grade_level);
  const templateBuffer = await fetchECRTemplateBuffer(templateName);
  const zip = await populateECRWorkbookZip(templateBuffer, opts);

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const isMapeh = isMapehSubject(opts.subject.subject_name);
  const cleanGrade = (opts.section.section_grade_level || 'Grade').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanSection = (opts.section.section_name || 'Section').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanSubject = isMapeh ? 'MAPEH' : (opts.subject.subject_name || 'Subject').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanSY = (opts.schoolYear || '').replace(/[^a-zA-Z0-9-]/g, '_');

  const filename = `ECR_${cleanGrade}_${cleanSection}_${cleanSubject}_${cleanSY}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Batch export all subjects for a section into a ZIP archive containing individual ECR workbooks.
 * Automatically consolidates MAPEH component subjects into a single official MAPEH workbook.
 * Available only for Grades 2 to 10.
 */
export async function exportECRBatchToZip(
  batchOpts: ECRExcelExportOptions[],
  zipFilename: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  const validBatchOpts = batchOpts.filter(o => isGrade2To10(o.section.section_grade_level));
  if (validBatchOpts.length === 0) {
    throw new Error('No valid Grade 2 to Grade 10 subjects to export in batch.');
  }

  const academicTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_ACADEMIC).catch(() => null);
  const gmrcVeTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_GMRC_VE).catch(() => null);
  const eppTleTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_EPP_TLE).catch(() => null);
  const mapehTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_MAPEH).catch(() => null);

  const mainZip = new JSZip();

  // Deduplicate and consolidate MAPEH into one workbook if multiple components exist
  const allSectionSubjects = validBatchOpts.map(o => o.subject);
  const finalExportList: ECRExcelExportOptions[] = [];
  let mapehProcessed = false;

  for (const opt of validBatchOpts) {
    const isMapeh = isMapehSubject(opt.subject.subject_name);
    if (isMapeh) {
      if (!mapehProcessed) {
        mapehProcessed = true;
        finalExportList.push({
          ...opt,
          subject: { id: opt.subject.id, subject_name: 'MAPEH' } as Subject,
          allSubjects: allSectionSubjects
        });
      }
    } else {
      finalExportList.push({
        ...opt,
        allSubjects: allSectionSubjects
      });
    }
  }

  const total = finalExportList.length;

  for (let i = 0; i < total; i++) {
    const opts = finalExportList[i];
    const templateType = getECRTemplateType(opts.subject.subject_name, opts.section.section_grade_level);
    
    let templateBuffer: ArrayBuffer | null = null;
    if (templateType === 'gmrc_ve') {
      templateBuffer = gmrcVeTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_GMRC_VE));
    } else if (templateType === 'mapeh') {
      templateBuffer = mapehTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_MAPEH));
    } else if (templateType === 'epp_tle') {
      templateBuffer = eppTleTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_EPP_TLE));
    } else {
      templateBuffer = academicTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_ACADEMIC));
    }

    const zip = await populateECRWorkbookZip(templateBuffer, opts);
    const outBuffer = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const isMapeh = templateType === 'mapeh';
    const cleanGrade = (opts.section.section_grade_level || 'Grade').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanSection = (opts.section.section_name || 'Section').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanSubject = isMapeh ? 'MAPEH' : (opts.subject.subject_name || 'Subject').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanSY = (opts.schoolYear || '').replace(/[^a-zA-Z0-9-]/g, '_');

    const fileName = `ECR_${cleanGrade}_${cleanSection}_${cleanSubject}_${cleanSY}.xlsx`;
    mainZip.file(fileName, outBuffer);

    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 90));
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  const zipContent = await mainZip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipContent);

  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (onProgress) {
    onProgress(100);
  }
}
