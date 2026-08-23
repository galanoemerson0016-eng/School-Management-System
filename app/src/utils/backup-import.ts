import { db } from '../services/database';
import { type ComprehensiveBackup, restoreBackupLocalStorage } from './backup-restore';
import type { RestoreStrategy } from './restore-options';
import type { Student, Section, Subject, Enrollment, ClassRecord, ObservedValues, AttendanceRecord, SF2Sheet, HPSRecord } from '../types';


export interface RestoreValidation {
    isValid: boolean;
    canRestore: boolean;
    issues: string[];
    warnings: string[];
    dataIntegrity: {
        studentEnrollmentMatch: boolean;
        sectionConsistency: boolean;
        subjectAssignmentValid: boolean;
        gradeRecordsValid: boolean;
    };
}

export interface InvalidGradeReference {
    classRecordId: string;
    studentLrn: string;
    subjectId: string;
    schoolYear: string;
    quarter: number;
    missingStudent: boolean;
    missingSubject: boolean;
}

export interface RestoreExecutionOptions {
    strategy: RestoreStrategy;
    selectedItems: Set<string>;
}

export interface RestoreExecutionResult {
    created: number;
    updated: number;
    skipped: number;
    issues: string[];
}

const stripUndefinedValues = <T extends object>(data: T) => {
    return Object.fromEntries(
        Object.entries(data as Record<string, unknown>).filter(([, value]) => value !== undefined)
    ) as unknown as T;
};

export function getInvalidGradeReferences(backup: ComprehensiveBackup): InvalidGradeReference[] {
    const studentSet = new Set((backup.payload.students || []).map((s) => s.lrn));
    const subjectSet = new Set((backup.payload.subjects || []).map((s) => s.id));

    return (backup.payload.classRecords || [])
        .map((record) => {
            const missingStudent = !studentSet.has(record.student_lrn);
            const missingSubject = !subjectSet.has(record.subject_id);
            if (!missingStudent && !missingSubject) return null;
            return {
                classRecordId: record.id,
                studentLrn: record.student_lrn,
                subjectId: record.subject_id,
                schoolYear: record.school_year,
                quarter: Number(record.quarter),
                missingStudent,
                missingSubject,
            };
        })
        .filter((item): item is InvalidGradeReference => item !== null);
}

export function validateRestoreBackup(backup: ComprehensiveBackup): RestoreValidation {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!backup?.metadata?.version) issues.push('Backup version missing.');
    if (!Array.isArray(backup?.payload?.students)) issues.push('Students payload missing.');
    if (!Array.isArray(backup?.payload?.sections)) issues.push('Sections payload missing.');

    const invalidRefs = getInvalidGradeReferences(backup);
    if (invalidRefs.length > 0) {
        warnings.push(`${invalidRefs.length} grade records reference missing student/subject data.`);
    }

    return {
        isValid: issues.length === 0,
        canRestore: issues.length === 0,
        issues,
        warnings,
        dataIntegrity: {
            studentEnrollmentMatch: true,
            sectionConsistency: true,
            subjectAssignmentValid: invalidRefs.length === 0,
            gradeRecordsValid: invalidRefs.length === 0,
        },
    };
}

export function prepareDataForRestore(backup: ComprehensiveBackup): {
    students: Student[];
    sections: Section[];
    subjects: Subject[];
    enrollments: Enrollment[];
    classRecords: ClassRecord[];
    gradingSheetRecords: ClassRecord[];
    observedValues: ObservedValues[];
    attendanceRecords: AttendanceRecord[];
    sf2Sheets: SF2Sheet[];
    hpsRecords: HPSRecord[];
} {
    return {
        students: (backup.payload.students || []).map((s) => stripUndefinedValues(s)),
        sections: (backup.payload.sections || []).map((s) => stripUndefinedValues(s)),
        subjects: (backup.payload.subjects || []).map((s) => stripUndefinedValues(s)),
        enrollments: (backup.payload.enrollments || []).map((e) => stripUndefinedValues(e)),
        classRecords: (backup.payload.classRecords || []).map((r) => stripUndefinedValues(r)),
        gradingSheetRecords: (backup.payload.gradingSheetRecords || []).map((r) => stripUndefinedValues(r)),
        observedValues: (backup.payload.observedValues || []).map((v) => stripUndefinedValues(v)),
        attendanceRecords: (backup.payload.attendanceRecords || []).map((r) => stripUndefinedValues(r)),
        sf2Sheets: (backup.payload.sf2Sheets || []).map((s) => stripUndefinedValues(s)),
        hpsRecords: (backup.payload.hpsRecords || []).map((h) => stripUndefinedValues(h)),
    };
}

export async function restoreBackupToFirestore(
    backup: ComprehensiveBackup,
    options: RestoreExecutionOptions,
): Promise<RestoreExecutionResult> {
    const result: RestoreExecutionResult = {
        created: 0,
        updated: 0,
        skipped: 0,
        issues: [],
    };

    const prepared = prepareDataForRestore(backup);
    const selected = options.selectedItems;

    try {
        if (selected.has('schoolProfile')) {
            await db.putRecord('schoolProfile', stripUndefinedValues(backup.payload.schoolProfile));
            result.updated += 1;
        }

        if (selected.has('students')) {
            for (const item of prepared.students) {
                await db.putRecord('students', item);
                result.updated += 1;
            }
        }

        if (selected.has('sections')) {
            for (const item of prepared.sections) {
                await db.putRecord('sections', item);
                result.updated += 1;
            }
        }

        if (selected.has('subjects')) {
            for (const item of prepared.subjects) {
                await db.putRecord('subjects', item);
                result.updated += 1;
            }
        }

        if (selected.has('enrollments')) {
            for (const item of prepared.enrollments) {
                await db.putRecord('enrollments', item);
                result.updated += 1;
            }
        }

        if (selected.has('classRecords')) {
            for (const item of prepared.classRecords) {
                await db.putRecord('classRecords', item);
                result.updated += 1;
            }
        }

        if (selected.has('gradingSheetRecords')) {
            for (const item of prepared.gradingSheetRecords) {
                await db.putRecord('gradingSheetRecords', item);
                result.updated += 1;
            }
        }

        if (selected.has('observedValues')) {
            for (const item of prepared.observedValues) {
                await db.putRecord('observedValues', item);
                result.updated += 1;
            }
        }

        if (selected.has('announcements')) {
            for (const item of backup.payload.announcements) {
                await db.putRecord('announcements', stripUndefinedValues(item));
                result.updated += 1;
            }
        }

        if (selected.has('attendanceRecords')) {
            for (const item of prepared.attendanceRecords) {
                await db.putRecord('attendanceRecords', item);
                result.updated += 1;
            }
        }

        if (selected.has('sf2Sheets')) {
            for (const item of prepared.sf2Sheets) {
                await db.putRecord('sf2Sheets', item);
                result.updated += 1;
            }
        }

        if (selected.has('hpsRecords')) {
            for (const item of prepared.hpsRecords) {
                await db.putRecord('hpsRecords', item);
                result.updated += 1;
            }
        }

        // Restore activity log entries if present in comprehensive payload
        if (Array.isArray(backup.payload.activityLog)) {
            for (const entry of backup.payload.activityLog) {
                if (entry && typeof entry === 'object' && 'id' in entry) {
                    await db.putRecord('activityLog', entry);
                }
            }
        }

        // Restore localStorage items if present in comprehensive payload
        if (backup.payload.localStorageData) {
            restoreBackupLocalStorage(backup.payload.localStorageData);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.issues.push(message);
    }

    return result;
}
