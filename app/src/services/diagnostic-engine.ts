import { db } from './database';
import type { Student, ClassRecord, Enrollment, Subject } from '../types';

export interface DiagnosticIssue {
  id: string;
  category: 'orphan_grades' | 'duplicate_enrollments' | 'text_formatting';
  severity: 'warning' | 'error' | 'info';
  description: string;
  details: string;
  affectedIds: string[];
  repairAction: () => Promise<void>;
}

export const DiagnosticEngine = {
  async runDiagnostics(): Promise<DiagnosticIssue[]> {
    const issues: DiagnosticIssue[] = [];

    try {
      console.log('🩺 Starting Database Diagnostic Scan...');
      
      const students = await db.getAllRecords<Student>('students');
      const subjects = await db.getAllRecords<Subject>('subjects');
      const classRecords = await db.getAllRecords<ClassRecord>('classRecords');
      const gradingSheetRecords = await db.getAllRecords<ClassRecord>('gradingSheetRecords');
      const enrollments = await db.getAllRecords<Enrollment>('enrollments');

      const studentLrns = new Set(students.map(s => s.lrn));
      const subjectIds = new Set(subjects.map(s => s.id));

      // --- 1. Orphaned Class Records ---
      const orphanedClassRecordIds: string[] = [];
      for (const record of classRecords) {
        if (!studentLrns.has(record.student_lrn) || !subjectIds.has(record.subject_id)) {
          orphanedClassRecordIds.push(record.id);
        }
      }

      if (orphanedClassRecordIds.length > 0) {
        issues.push({
          id: 'orphan_class_records',
          category: 'orphan_grades',
          severity: 'warning',
          description: `${orphanedClassRecordIds.length} E-Class grade record(s) reference missing students or subjects.`,
          details: 'These grades cannot be viewed or updated because their associated learner profiles or learning areas do not exist in the database.',
          affectedIds: orphanedClassRecordIds,
          repairAction: async () => {
            for (const id of orphanedClassRecordIds) {
              await db.deleteRecord('classRecords', id);
            }
          }
        });
      }

      // --- 2. Orphaned Grading Sheet Records ---
      const orphanedGradingSheetIds: string[] = [];
      for (const record of gradingSheetRecords) {
        if (!studentLrns.has(record.student_lrn) || !subjectIds.has(record.subject_id)) {
          orphanedGradingSheetIds.push(record.id);
        }
      }

      if (orphanedGradingSheetIds.length > 0) {
        issues.push({
          id: 'orphan_gradingsheet_records',
          category: 'orphan_grades',
          severity: 'warning',
          description: `${orphanedGradingSheetIds.length} consolidated grading sheet record(s) reference missing students or subjects.`,
          details: 'These consolidated grade sheets are disconnected from valid learner files or learning areas.',
          affectedIds: orphanedGradingSheetIds,
          repairAction: async () => {
            for (const id of orphanedGradingSheetIds) {
              await db.deleteRecord('gradingSheetRecords', id);
            }
          }
        });
      }

      // --- 3. Duplicate Enrollments ---
      const duplicateEnrollmentKeys = new Map<string, string[]>();
      for (const enroll of enrollments) {
        const key = `${enroll.student_lrn}_${enroll.school_year}`;
        if (!duplicateEnrollmentKeys.has(key)) {
          duplicateEnrollmentKeys.set(key, []);
        }
        duplicateEnrollmentKeys.get(key)!.push(enroll.id);
      }

      const duplicateEnrollmentIds: string[] = [];
      duplicateEnrollmentKeys.forEach((ids) => {
        if (ids.length > 1) {
          // Keep the first one, collect the rest to delete
          duplicateEnrollmentIds.push(...ids.slice(1));
        }
      });

      if (duplicateEnrollmentIds.length > 0) {
        issues.push({
          id: 'duplicate_enrollments',
          category: 'duplicate_enrollments',
          severity: 'error',
          description: `${duplicateEnrollmentIds.length} duplicate enrollment record(s) detected.`,
          details: 'Students are enrolled multiple times in the same school year, causing duplication bugs in grade calculations.',
          affectedIds: duplicateEnrollmentIds,
          repairAction: async () => {
            for (const id of duplicateEnrollmentIds) {
              await db.deleteRecord('enrollments', id);
            }
          }
        });
      }

      // --- 4. Text Formatting & Case Inconsistencies ---
      const incorrectlyFormattedStudentLrns: string[] = [];
      const normalizeSpaces = (s?: string) => (s || '').replace(/\s+/g, ' ').trim();
      const normalizeName = (value?: string) => {
        const normalized = normalizeSpaces(value);
        if (!normalized) return '';
        return normalized
          .split(' ')
          .map((part) => {
            if (!part) return part;
            if (part.length <= 2 && part === part.toUpperCase()) return part;
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join(' ');
      };

      for (const student of students) {
        const needsNameFix =
          normalizeName(student.first_name) !== student.first_name ||
          normalizeName(student.middle_name) !== (student.middle_name || '') ||
          normalizeName(student.last_name) !== student.last_name ||
          normalizeSpaces(student.address) !== (student.address || '');
        
        if (needsNameFix) {
          incorrectlyFormattedStudentLrns.push(student.lrn);
        }
      }

      if (incorrectlyFormattedStudentLrns.length > 0) {
        issues.push({
          id: 'text_formatting_issues',
          category: 'text_formatting',
          severity: 'info',
          description: `${incorrectlyFormattedStudentLrns.length} student profile(s) contain irregular formatting or casing.`,
          details: 'These profiles have lowercase names, duplicate spacing, or unformatted home addresses.',
          affectedIds: incorrectlyFormattedStudentLrns,
          repairAction: async () => {
            for (const lrn of incorrectlyFormattedStudentLrns) {
              const student = students.find(s => s.lrn === lrn);
              if (student) {
                const updated = {
                  ...student,
                  first_name: normalizeName(student.first_name),
                  middle_name: normalizeName(student.middle_name) || undefined,
                  last_name: normalizeName(student.last_name),
                  name_extension: normalizeName(student.name_extension || '') || undefined,
                  address: normalizeSpaces(student.address || '') || undefined
                };
                await db.putRecord('students', updated);
              }
            }
          }
        });
      }

      // --- 5. Corrupted or Unreadable Student Records ---
      const corruptedStudentLrns: string[] = [];
      for (const student of students) {
        if (!student.lrn || typeof student.last_name !== 'string' || !student.first_name) {
          corruptedStudentLrns.push(student.lrn || 'missing-lrn');
        }
      }

      if (corruptedStudentLrns.length > 0) {
        issues.push({
          id: 'corrupted_student_records',
          category: 'orphan_grades',
          severity: 'error',
          description: `${corruptedStudentLrns.length} corrupted or unreadable student record(s) detected.`,
          details: 'These profiles have missing LRNs, non-string names, or could not be decrypted due to key mismatches. Deleting them will resolve update blocks.',
          affectedIds: corruptedStudentLrns,
          repairAction: async () => {
            for (const student of students) {
              if (!student.lrn || typeof student.last_name !== 'string' || !student.first_name) {
                const key = student.lrn || '';
                await db.deleteRecord('students', key);
              }
            }
          }
        });
      }

      console.log(`🩺 Diagnostics complete. Found ${issues.length} issue(s).`);
    } catch (err) {
      console.error('❌ Diagnostic engine scan aborted due to error:', err);
    }

    return issues;
  }
};
