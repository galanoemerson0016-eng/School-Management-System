import { db } from '../services/database';
import { type ComprehensiveBackup, restoreBackupLocalStorage } from './backup-restore';
import type { RestoreStrategy } from './restore-options';
import type { Student, Section, Subject, Enrollment, ClassRecord, ObservedValues, AttendanceRecord, SF2Sheet, HPSRecord, SchoolProfile } from '../types';


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

const PLACEHOLDER_SCHOOL_NAMES = new Set(['', 'school name', 'unknown school', 'n/a']);
const PLACEHOLDER_SCHOOL_IDS = new Set(['', 'school id', 'unknown', 'n/a']);

/**
 * A backup may contain an object-shaped placeholder for a profile.  Treating
 * that as a profile would replace a real institution's details during a
 * restore, so a source profile must identify a real school before it can be
 * selected for restoration.
 */
export function isValidBackupSchoolProfile(candidate: unknown): candidate is Record<string, unknown> {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false;
    const profile = candidate as Record<string, unknown>;
    const name = String(profile.name || profile.school_name || '').trim();
    const schoolId = String(profile.school_id || profile.id || '').trim();
    return !PLACEHOLDER_SCHOOL_NAMES.has(name.toLowerCase())
        && !PLACEHOLDER_SCHOOL_IDS.has(schoolId.toLowerCase());
}

const stripUndefinedValues = <T extends object>(data: T) => {
    return Object.fromEntries(
        Object.entries(data as Record<string, unknown>).filter(([, value]) => value !== undefined)
    ) as unknown as T;
};

/**
 * Resolves the primary/best school profile from backup data.
 * When an array is provided (e.g. legacy or multi-entry snapshots),
 * this scores each candidate to choose the actual profile over blank dummy records.
 */
export function resolveBestSchoolProfile(rawProfile: unknown): SchoolProfile | null {
    if (!rawProfile) return null;
    if (Array.isArray(rawProfile)) {
        if (rawProfile.length === 0) return null;
        const validObjects = rawProfile.filter(isValidBackupSchoolProfile);
        if (validObjects.length === 0) return null;

        const scored = validObjects.map(p => {
            let score = 0;
            const name = String(p.name || p.school_name || '').trim();
            const schoolId = String(p.school_id || p.id || '').trim();
            const section = String(p.section || '').trim();
            const adviser = String(p.adviser_name || '').trim();

            if (name && name.toLowerCase() !== 'school name') score += 10;
            if (schoolId && schoolId !== '300001' && schoolId !== '') score += 10;
            if (section) score += 5;
            if (adviser && adviser.toLowerCase() !== 'admin') score += 5;
            if (p.division) score += 2;
            if (p.region) score += 2;
            return { profile: p, score };
        });

        scored.sort((a, b) => b.score - a.score);
        const best = scored[0]?.profile;
        if (!best) return null;

        const school_id = String(best.school_id || best.id).trim();
        return { ...best, school_id } as unknown as SchoolProfile;
    }

    if (isValidBackupSchoolProfile(rawProfile)) {
        const p = rawProfile as Record<string, unknown>;
        const school_id = String(p.school_id || p.id).trim();
        return { ...p, school_id } as unknown as SchoolProfile;
    }

    return null;
}

/**
 * Robustly detects active school year from backup data, filenames, or records.
 * Ensures 'Unknown' is never assigned as the active school year.
 */
export function detectSchoolYearFromBackup(
    data?: Record<string, unknown> | null,
    fileName?: string,
    fallback?: string
): string {
    const isValidSy = (sy: unknown): sy is string => {
        if (!sy || typeof sy !== 'string') return false;
        const s = sy.trim();
        return s.length >= 7 && s.toLowerCase() !== 'unknown' && /(?:20\d{2}-20\d{2})/.test(s);
    };

    if (!data) {
        if (fileName) {
            const fileMatch = fileName.match(/(20\d{2}-20\d{2})/);
            if (fileMatch) return fileMatch[1];
        }
        return fallback && isValidSy(fallback) ? fallback.trim() : '2026-2027';
    }

    const payload = (data.payload && typeof data.payload === 'object') ? (data.payload as Record<string, unknown>) : undefined;
    const summary = (data.summary && typeof data.summary === 'object') ? (data.summary as Record<string, unknown>) : undefined;

    // 1. Check explicit activeSchoolYear fields
    if (isValidSy(data.activeSchoolYear)) return data.activeSchoolYear.trim();
    if (isValidSy(payload?.activeSchoolYear)) return (payload.activeSchoolYear as string).trim();
    if (isValidSy(summary?.activeSchoolYear)) return (summary.activeSchoolYear as string).trim();

    // 2. Extract from filename if available
    if (fileName) {
        const fileMatch = fileName.match(/(20\d{2}-20\d{2})/);
        if (fileMatch) return fileMatch[1];
    }

    // 3. Extract from records arrays
    const findInArray = (arr: unknown) => {
        if (!Array.isArray(arr)) return null;
        for (const item of arr) {
            const sy = (item as { school_year?: unknown } | null | undefined)?.school_year;
            if (isValidSy(sy)) return sy.trim();
        }
        return null;
    };

    const syFromRecords = findInArray(data.classRecords || payload?.classRecords || data.grades)
        || findInArray(data.gradingSheetRecords || payload?.gradingSheetRecords)
        || findInArray(data.sf2Sheets || payload?.sf2Sheets)
        || findInArray(data.attendanceRecords || payload?.attendanceRecords);
    if (syFromRecords) return syFromRecords;

    // 4. Extract from schoolProfile
    const profile = Array.isArray(data.schoolProfile) 
        ? data.schoolProfile.find((p: unknown) => isValidSy((p as { school_year?: unknown } | null | undefined)?.school_year)) as { school_year?: unknown } | undefined
        : (data.schoolProfile as { school_year?: unknown } | undefined);
    if (profile && isValidSy(profile.school_year)) return profile.school_year.trim();

    // 5. Extract from schoolYears array
    const syArr = data.schoolYears || payload?.schoolYears;
    if (Array.isArray(syArr)) {
        for (const item of syArr) {
            const yr = (item as { year?: unknown; school_year?: unknown } | null | undefined)?.year 
                || (item as { year?: unknown; school_year?: unknown } | null | undefined)?.school_year;
            if (isValidSy(yr)) return yr.trim();
        }
    }

    // 6. Extract from localStorageData
    const local = (data.localStorageData || payload?.localStorageData) as Record<string, unknown> | undefined;
    if (local) {
        if (isValidSy(local.activeSchoolYear)) return (local.activeSchoolYear as string).trim();
        if (isValidSy(local.formease_active_school_year)) return (local.formease_active_school_year as string).trim();
    }

    // 7. Fallback or localStorage check
    if (fallback && isValidSy(fallback)) return fallback.trim();

    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('activeSchoolYear');
        if (isValidSy(stored)) return stored.trim();
    }

    return '2026-2027';
}

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
    if (strategy === 'replace') {
        await db.clearStore(storeName);
        if (items.length > 0) {
            await db.putRecordsBulk(storeName, items);
        }
        return { created: items.length, updated: 0, skipped: 0 };
    }

    if (items.length === 0) return { created: 0, updated: 0, skipped: 0 };

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

    const runRestoreStep = async (stepName: string, fn: () => Promise<void>) => {
        try {
            await fn();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`[Restore] Error restoring ${stepName}:`, error);
            result.issues.push(`Failed to restore ${stepName}: ${message}`);
        }
    };

    // 1. School Profile
    await runRestoreStep('schoolProfile', async () => {
        const bestProfile = resolveBestSchoolProfile(backup.payload.schoolProfile);
        if (selected.has('schoolProfile') && bestProfile) {
            const profile = stripUndefinedValues(bestProfile);
            if (strategy === 'skip_existing') {
                const existing = await db.getAllRecords<SchoolProfile>('schoolProfile');
                const hasRealProfile = existing.some(p => p && p.name && p.name.trim() !== 'School Name');
                if (!hasRealProfile) {
                    await db.clearStore('schoolProfile');
                    await db.putRecord('schoolProfile', profile);
                    result.created += 1;
                } else {
                    result.skipped += 1;
                }
            } else {
                await db.clearStore('schoolProfile');
                await db.putRecord('schoolProfile', profile);
                result.updated += 1;
            }
        }
    });

    // 2. Students
    await runRestoreStep('students', async () => {
        if (selected.has('students')) {
            const res = await restoreStoreData('students', prepared.students, 'lrn', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 3. Sections
    await runRestoreStep('sections', async () => {
        if (selected.has('sections')) {
            const res = await restoreStoreData('sections', prepared.sections, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 4. Subjects
    await runRestoreStep('subjects', async () => {
        if (selected.has('subjects')) {
            const res = await restoreStoreData('subjects', prepared.subjects, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 5. Enrollments
    await runRestoreStep('enrollments', async () => {
        if (selected.has('enrollments')) {
            const res = await restoreStoreData('enrollments', prepared.enrollments, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 6. Class Records
    await runRestoreStep('classRecords', async () => {
        if (selected.has('classRecords')) {
            const res = await restoreStoreData('classRecords', prepared.classRecords, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 7. Grading Sheet Records
    await runRestoreStep('gradingSheetRecords', async () => {
        if (selected.has('gradingSheetRecords')) {
            const res = await restoreStoreData('gradingSheetRecords', prepared.gradingSheetRecords, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 8. Observed Values
    await runRestoreStep('observedValues', async () => {
        if (selected.has('observedValues')) {
            const res = await restoreStoreData('observedValues', prepared.observedValues, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 9. Announcements
    await runRestoreStep('announcements', async () => {
        if (selected.has('announcements')) {
            const items = (backup.payload.announcements || []).map(item => stripUndefinedValues(item));
            const res = await restoreStoreData('announcements', items, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 10. Attendance Records
    await runRestoreStep('attendanceRecords', async () => {
        if (selected.has('attendanceRecords')) {
            const res = await restoreStoreData('attendanceRecords', prepared.attendanceRecords, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 11. SF2 Sheets
    await runRestoreStep('sf2Sheets', async () => {
        if (selected.has('sf2Sheets')) {
            const res = await restoreStoreData('sf2Sheets', prepared.sf2Sheets, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 12. HPS Records
    await runRestoreStep('hpsRecords', async () => {
        if (selected.has('hpsRecords')) {
            const res = await restoreStoreData('hpsRecords', prepared.hpsRecords, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 13. Users
    await runRestoreStep('users', async () => {
        if (selected.has('users') && Array.isArray(backup.payload.users)) {
            const users = backup.payload.users.map(u => stripUndefinedValues(u));
            const res = await restoreStoreData('users', users, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 14. Activity Log
    await runRestoreStep('activityLog', async () => {
        if (selected.has('activityLog') && Array.isArray(backup.payload.activityLog)) {
            const entries = backup.payload.activityLog.filter(
                (entry): entry is { id: string } & Record<string, unknown> =>
                    Boolean(entry && typeof entry === 'object' && 'id' in entry)
            );
            const res = await restoreStoreData('activityLog', entries, 'id', strategy);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 15. LocalStorage Data
    await runRestoreStep('localStorageData', async () => {
        if (backup.payload.localStorageData && (!selected || selected.size === 0 || selected.has('localStorageData'))) {
            restoreBackupLocalStorage(backup.payload.localStorageData);
        }
    });

    // 16. School Year Alignment & Section Clearing
    await runRestoreStep('schoolYearAlignment', async () => {
        const detectedSy = detectSchoolYearFromBackup(backup.payload, undefined, backup.summary?.activeSchoolYear);
        if (detectedSy && detectedSy.toLowerCase() !== 'unknown') {
            localStorage.setItem('activeSchoolYear', detectedSy);
            localStorage.setItem('formease_active_school_year', detectedSy);
        }
        localStorage.removeItem('formease-selected-section');
    });

    return result;
}
