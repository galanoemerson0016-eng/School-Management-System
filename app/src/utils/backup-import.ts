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
            // Orphaned temporary IDs (TEMP-*) from pre-LRN encoding are automatically purged during restore
            const isOrphanedTemp = record.student_lrn && record.student_lrn.startsWith('TEMP-') && !studentSet.has(record.student_lrn);
            if (isOrphanedTemp) return null;

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
    const studentSet = new Set((backup.payload.students || []).map((s) => s.lrn));

    return {
        students: (backup.payload.students || []).map((s) => stripUndefinedValues(s)),
        sections: (backup.payload.sections || []).map((s) => stripUndefinedValues(s)),
        subjects: (backup.payload.subjects || []).map((s) => stripUndefinedValues(s)),
        enrollments: (backup.payload.enrollments || []).map((e) => stripUndefinedValues(e)),
        classRecords: (backup.payload.classRecords || [])
            .filter((r) => !(r.student_lrn && r.student_lrn.startsWith('TEMP-') && !studentSet.has(r.student_lrn)))
            .map((r) => stripUndefinedValues(r)),
        gradingSheetRecords: (backup.payload.gradingSheetRecords || [])
            .filter((r) => !(r.student_lrn && r.student_lrn.startsWith('TEMP-') && !studentSet.has(r.student_lrn)))
            .map((r) => stripUndefinedValues(r)),
        observedValues: (backup.payload.observedValues || []).map((v) => stripUndefinedValues(v)),
        attendanceRecords: (backup.payload.attendanceRecords || []).map((r) => stripUndefinedValues(r)),
        sf2Sheets: (backup.payload.sf2Sheets || []).map((s) => stripUndefinedValues(s)),
        hpsRecords: (backup.payload.hpsRecords || []).map((h) => stripUndefinedValues(h)),
    };
}

async function restoreStoreData<T extends object>(
    storeName: string,
    items: T[],
    keyField: string,
    strategy: RestoreStrategy
): Promise<{ created: number; updated: number; skipped: number }> {
    if (items.length === 0) return { created: 0, updated: 0, skipped: 0 };

    if (strategy === 'replace') {
        await db.clearStore(storeName);
        await db.putRecordsBulk(storeName, items);
        return { created: items.length, updated: 0, skipped: 0 };
    }

    if (strategy === 'skip_existing') {
        const existingRecords = await db.getAllRecords<Record<string, unknown>>(storeName);
        const existingKeys = new Set(existingRecords.map(r => String(r[keyField] ?? '')));
        const newItems = items.filter(item => !existingKeys.has(String((item as Record<string, unknown>)[keyField] ?? '')));
        const skipped = items.length - newItems.length;
        if (newItems.length > 0) {
            await db.putRecordsBulk(storeName, newItems);
        }
        return { created: newItems.length, updated: 0, skipped };
    }

    // strategy === 'merge' (default)
    await db.putRecordsBulk(storeName, items);
    return { created: 0, updated: items.length, skipped: 0 };
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
    const strategy = options.strategy;

    try {
        if (selected.has('schoolProfile') && backup.payload.schoolProfile) {
            const profile = stripUndefinedValues(backup.payload.schoolProfile);
            if (strategy === 'replace') {
                await db.clearStore('schoolProfile');
                await db.putRecord('schoolProfile', profile);
                result.created += 1;
            } else if (strategy === 'skip_existing') {
                const existing = await db.getAllRecords('schoolProfile');
                if (existing.length === 0) {
                    await db.putRecord('schoolProfile', profile);
                    result.created += 1;
                } else {
                    result.skipped += 1;
                }
            } else {
                await db.putRecord('schoolProfile', profile);
                result.updated += 1;
            }
        }

        if (selected.has('students')) {
            const res = await restoreStoreData('students', prepared.students, 'lrn', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }

        if (selected.has('sections')) {
            const res = await restoreStoreData('sections', prepared.sections, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }

        if (selected.has('subjects')) {
            const res = await restoreStoreData('subjects', prepared.subjects, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }

        if (selected.has('enrollments')) {
            const res = await restoreStoreData('enrollments', prepared.enrollments, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }

        if (selected.has('classRecords')) {
            const res = await restoreStoreData('classRecords', prepared.classRecords, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }

        if (selected.has('gradingSheetRecords')) {
            const res = await restoreStoreData('gradingSheetRecords', prepared.gradingSheetRecords, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }

        if (selected.has('observedValues')) {
            const res = await restoreStoreData('observedValues', prepared.observedValues, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }

        if (selected.has('announcements')) {
            const items = (backup.payload.announcements || []).map(item => stripUndefinedValues(item));
            const res = await restoreStoreData('announcements', items, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }

        if (selected.has('attendanceRecords')) {
            const res = await restoreStoreData('attendanceRecords', prepared.attendanceRecords, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }

        if (selected.has('sf2Sheets')) {
            const res = await restoreStoreData('sf2Sheets', prepared.sf2Sheets, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }

        if (selected.has('hpsRecords')) {
            const res = await restoreStoreData('hpsRecords', prepared.hpsRecords, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }

        // Restore users if present and selected
        if (selected.has('users') && Array.isArray(backup.payload.users)) {
            const users = backup.payload.users.map(u => stripUndefinedValues(u));
            const res = await restoreStoreData('users', users, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }

        // Restore activity log entries if present in comprehensive payload
        if (Array.isArray(backup.payload.activityLog)) {
            const entries = backup.payload.activityLog.filter(
                (entry): entry is { id: string } & Record<string, unknown> =>
                    Boolean(entry && typeof entry === 'object' && 'id' in entry)
            );
            const res = await restoreStoreData('activityLog', entries, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }

        // Restore localStorage items if present in comprehensive payload
        if (backup.payload.localStorageData && (!selected || selected.size === 0 || selected.has('localStorageData'))) {
            restoreBackupLocalStorage(backup.payload.localStorageData);
        }

        // Align active school year and clear stale selected section
        const restoredSchoolYear = backup.payload.activeSchoolYear || backup.summary?.activeSchoolYear;
        if (restoredSchoolYear) {
            localStorage.setItem('activeSchoolYear', restoredSchoolYear);
            localStorage.setItem('formease_active_school_year', restoredSchoolYear);
        }
        localStorage.removeItem('formease-selected-section');
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.issues.push(message);
    }

    return result;
}
