import type { ClassRecord } from '../types';
import { isSameSubject, isQuarterMatch } from './grading-helpers';

export interface GradeProvenanceMigrationResult {
  records: ClassRecord[];
  changed: boolean;
  classifiedAsEClass: number;
  classifiedAsSubjectTeacher: number;
  ambiguous: number;
}

/**
 * Labels legacy Grade Management records without deleting or changing a grade.
 *
 * A matching E-Class record with the same final grade is a synced copy. A grade
 * without an E-Class match belongs to a subject teacher/import and remains a
 * valid fallback. A different grade is retained but deliberately marked as a
 * legacy fallback, so a current E-Class calculation can no longer be masked by
 * an old duplicate.
 */
export function classifyLegacyGradingSheetRecords(
  gradingSheetRecords: ClassRecord[],
  classRecords: ClassRecord[],
): GradeProvenanceMigrationResult {
  let changed = false;
  let classifiedAsEClass = 0;
  let classifiedAsSubjectTeacher = 0;
  let ambiguous = 0;

  const records = gradingSheetRecords.map((record) => {
    if (record.grade_source) return record;

    const candidates = classRecords.filter((classRecord) =>
      String(classRecord.student_lrn).trim() === String(record.student_lrn).trim() &&
      isQuarterMatch(classRecord.quarter, Number(record.quarter)) &&
      (!record.school_year || !classRecord.school_year || classRecord.school_year === record.school_year) &&
      (!record.section_id || !classRecord.section_id || classRecord.section_id === record.section_id) &&
      isSameSubject(classRecord.subject_id, classRecord.subject_name, record.subject_id, record.subject_name),
    );

    changed = true;
    if (candidates.length === 0) {
      classifiedAsSubjectTeacher++;
      return { ...record, grade_source: 'subject_teacher' as const };
    }

    const sameCalculatedGrade = candidates.some((candidate) =>
      Number(candidate.final_grade) > 0 && Number(candidate.final_grade) === Number(record.final_grade),
    );
    if (sameCalculatedGrade) {
      classifiedAsEClass++;
      return { ...record, grade_source: 'eclass_sync' as const };
    }

    ambiguous++;
    return { ...record, grade_source: 'legacy_fallback' as const };
  });

  return { records, changed, classifiedAsEClass, classifiedAsSubjectTeacher, ambiguous };
}
