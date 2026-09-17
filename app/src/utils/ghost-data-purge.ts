import type { Section, Student, ClassRecord, AttendanceRecord, SF2Sheet, Enrollment } from '../types';

/**
 * The 32 mock/recovered student LRNs from the historical Einstein dataset.
 */
export const GHOST_EINSTEIN_LRNS = new Set<string>([
  '104528180011',
  '105407140001',
  '105488180039',
  '105942180027',
  '106777180005',
  '106777180009',
  '106777180018',
  '106777180022',
  '106777180029',
  '106778180004',
  '106788180030', // variant protection
  '106778180030',
  '106778180031',
  '106778180044',
  '106780180006',
  '106780180017',
  '106780180024',
  '106780180038',
  '106780180052',
  '106780180054',
  '106780180057',
  '106780180062',
  '106781160032',
  '106781180020',
  '106781180033',
  '106781180034',
  '106781180035',
  '106797180023',
  '107959180099',
  '112610180018',
  '126844180044', // MELISSA JOY CASTRO
  '500368180132',
  '501213180002',
]);

/**
 * Checks if a section is the ghost "Einstein" section.
 * Specifically targets the legacy injected Einstein section while safely ignoring
 * legitimately created SHS STEM tracks or test fixture sections (e.g. 'STEM - Einstein').
 */
export function isGhostEinsteinSection(sec: {
  id?: string;
  section_name?: string;
  section_grade_level?: string;
}): boolean {
  if (!sec) return false;
  if (sec.id === 'section_1777547467815') return true;

  const name = (sec.section_name || '').trim().toLowerCase();
  if (name === 'einstein') return true;

  // Grade 7 Einstein ghost section
  if (
    sec.section_grade_level === 'Grade 7' &&
    name.includes('einstein') &&
    sec.id !== 'sec-g7-einstein' // exclude test fixtures
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a student is one of the ghost learners from the Einstein mock dataset.
 */
export function isGhostEinsteinStudent(
  student: {
    lrn?: string;
    student_section?: string;
    grade_level?: string;
  },
  knownSections?: Section[]
): boolean {
  if (!student) return false;
  const lrn = (student.lrn || '').trim();
  const secName = (student.student_section || '').trim().toLowerCase();

  // Directly assigned to ghost section
  if (secName === 'einstein' || student.student_section === 'section_1777547467815') {
    return true;
  }

  // Matches ghost LRN and either unassigned, in Einstein, or assigned to a non-existent section
  if (lrn && GHOST_EINSTEIN_LRNS.has(lrn)) {
    if (!secName || secName === 'einstein' || student.student_section === 'section_1777547467815') {
      return true;
    }
    if (
      knownSections &&
      !knownSections.some(
        (s) =>
          s.section_name.toLowerCase() === secName ||
          s.id.toLowerCase() === secName
      )
    ) {
      return true;
    }
  }

  return false;
}

interface DatabaseAdapter {
  deleteRecord: (storeName: string, key: string) => Promise<void>;
  deleteRecordsBulk?: (storeName: string, keys: string[]) => Promise<void>;
}

export interface PurgeGhostDataPayload {
  sections: Section[];
  students: Student[];
  classRecords?: ClassRecord[];
  gradingSheetRecords?: ClassRecord[];
  attendanceRecords?: AttendanceRecord[];
  sf2Sheets?: SF2Sheet[];
  enrollments?: Enrollment[];
}

export interface PurgeGhostDataResult {
  sections: Section[];
  students: Student[];
  classRecords: ClassRecord[];
  gradingSheetRecords: ClassRecord[];
  attendanceRecords: AttendanceRecord[];
  sf2Sheets: SF2Sheet[];
  enrollments: Enrollment[];
  purgedSectionCount: number;
  purgedStudentCount: number;
}

/**
 * Performs a comprehensive, unconditional purge of ghost Einstein sections,
 * ghost students, and their associated dangling records across all storage tables.
 */
export async function purgeGhostEinsteinData(
  db: DatabaseAdapter,
  data: PurgeGhostDataPayload
): Promise<PurgeGhostDataResult> {
  const ghostSections = data.sections.filter(isGhostEinsteinSection);
  const ghostSectionIds = new Set<string>(ghostSections.map((s) => s.id));
  const ghostSectionNames = new Set<string>(
    ghostSections.map((s) => s.section_name.trim().toLowerCase())
  );
  // Always include standard Einstein tokens
  ghostSectionIds.add('section_1777547467815');
  ghostSectionNames.add('einstein');

  const finalSections = data.sections.filter(
    (s) => !isGhostEinsteinSection(s) && !ghostSectionIds.has(s.id)
  );

  // Identify all ghost students
  const ghostStudents = data.students.filter((st) => {
    if (isGhostEinsteinStudent(st, finalSections)) return true;
    const sSec = (st.student_section || '').trim().toLowerCase();
    if (ghostSectionIds.has(st.student_section || '') || ghostSectionNames.has(sSec)) {
      return true;
    }
    return false;
  });

  const ghostStudentLrns = new Set<string>(ghostStudents.map((s) => s.lrn));

  const finalStudents = data.students.filter(
    (st) => !ghostStudentLrns.has(st.lrn)
  );

  // Identify associated ghost records
  const isGhostRecord = (record: { section_id?: string; student_lrn?: string }) => {
    if (record.section_id && ghostSectionIds.has(record.section_id)) return true;
    if (record.student_lrn && ghostStudentLrns.has(record.student_lrn)) return true;
    return false;
  };

  const finalClassRecords = (data.classRecords || []).filter((r) => !isGhostRecord(r));
  const ghostClassRecords = (data.classRecords || []).filter(isGhostRecord);

  const finalGradingSheetRecords = (data.gradingSheetRecords || []).filter(
    (r) => !isGhostRecord(r)
  );
  const ghostGradingSheetRecords = (data.gradingSheetRecords || []).filter(
    isGhostRecord
  );

  const finalAttendanceRecords = (data.attendanceRecords || []).filter(
    (r) => !isGhostRecord(r)
  );
  const ghostAttendanceRecords = (data.attendanceRecords || []).filter(
    isGhostRecord
  );

  const finalEnrollments = (data.enrollments || []).filter((e) => !isGhostRecord(e));
  const ghostEnrollments = (data.enrollments || []).filter(isGhostRecord);

  const finalSf2Sheets = (data.sf2Sheets || []).filter(
    (sf) =>
      !ghostSectionIds.has(sf.section_id) &&
      !ghostSectionNames.has(sf.section_id.toLowerCase()) &&
      !sf.id.toLowerCase().includes('einstein') &&
      !sf.id.includes('section_1777547467815')
  );
  const ghostSf2Sheets = (data.sf2Sheets || []).filter(
    (sf) =>
      ghostSectionIds.has(sf.section_id) ||
      ghostSectionNames.has(sf.section_id.toLowerCase()) ||
      sf.id.toLowerCase().includes('einstein') ||
      sf.id.includes('section_1777547467815')
  );

  // Asynchronously purge from persistent IndexedDB
  const deleteBatch = async (storeName: string, ids: string[]) => {
    if (ids.length === 0) return;
    if (db.deleteRecordsBulk) {
      try {
        await db.deleteRecordsBulk(storeName, ids);
        return;
      } catch {
        // Fallback to sequential deletion
      }
    }
    for (const id of ids) {
      try {
        await db.deleteRecord(storeName, id);
      } catch (err) {
        console.warn(`[FormEase Pro] Failed to delete ghost record ${id} from ${storeName}:`, err);
      }
    }
  };

  // Perform deletions in parallel across stores
  await Promise.all([
    deleteBatch('sections', Array.from(ghostSectionIds)),
    deleteBatch('students', Array.from(ghostStudentLrns)),
    deleteBatch('classRecords', ghostClassRecords.map((r) => r.id)),
    deleteBatch('gradingSheetRecords', ghostGradingSheetRecords.map((r) => r.id)),
    deleteBatch('attendanceRecords', ghostAttendanceRecords.map((r) => r.id)),
    deleteBatch('enrollments', ghostEnrollments.map((e) => e.id)),
    deleteBatch('sf2Sheets', ghostSf2Sheets.map((s) => s.id)),
  ]);

  // Clean localStorage if active selection points to Einstein
  try {
    const selectedSec = localStorage.getItem('formease-selected-section');
    if (
      selectedSec &&
      (ghostSectionIds.has(selectedSec) ||
        ghostSectionNames.has(selectedSec.trim().toLowerCase()))
    ) {
      localStorage.removeItem('formease-selected-section');
    }
  } catch {
    // Ignore environments where localStorage is unavailable
  }

  if (ghostSections.length > 0 || ghostStudents.length > 0) {
    console.log(
      `[FormEase Pro] Successfully purged ${ghostSections.length} ghost Einstein section(s) and ${ghostStudents.length} ghost learner(s).`
    );
  }

  return {
    sections: finalSections,
    students: finalStudents,
    classRecords: finalClassRecords,
    gradingSheetRecords: finalGradingSheetRecords,
    attendanceRecords: finalAttendanceRecords,
    sf2Sheets: finalSf2Sheets,
    enrollments: finalEnrollments,
    purgedSectionCount: ghostSections.length,
    purgedStudentCount: ghostStudents.length,
  };
}
