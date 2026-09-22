import type { AttendanceRecord, ClassRecord, Enrollment, Section, SF2Sheet, Student } from '../types';

/**
 * Historical data once identified a seeded demo section by this exact ID.
 * It is retained solely for diagnostics and must never trigger automatic deletion.
 */
export const LEGACY_DEMO_SECTION_ID = 'section_1777547467815';

export function isGhostEinsteinSection(section: { id?: string; section_name?: string }): boolean {
  return section?.id === LEGACY_DEMO_SECTION_ID;
}

export function isGhostEinsteinStudent(student: { student_section?: string }): boolean {
  return student?.student_section === LEGACY_DEMO_SECTION_ID;
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
 * Compatibility wrapper for older callers. Automatic cleanup was removed because
 * section names and learner identifiers are user data, not safe deletion criteria.
 */
export async function purgeGhostEinsteinData(
  _db: unknown,
  data: PurgeGhostDataPayload,
): Promise<PurgeGhostDataResult> {
  return {
    sections: data.sections,
    students: data.students,
    classRecords: data.classRecords || [],
    gradingSheetRecords: data.gradingSheetRecords || [],
    attendanceRecords: data.attendanceRecords || [],
    sf2Sheets: data.sf2Sheets || [],
    enrollments: data.enrollments || [],
    purgedSectionCount: 0,
    purgedStudentCount: 0,
  };
}
