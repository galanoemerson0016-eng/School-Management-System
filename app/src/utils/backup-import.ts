import { db, type RestoreStoreChange } from '../services/database';
import { type ComprehensiveBackup, selectRestorableBackupSettings, validateBackup, isValidBackupSchoolProfile, resolveBestSchoolProfile } from './backup-restore';
export { isValidBackupSchoolProfile, resolveBestSchoolProfile };
import { hasValidPayloadHash, validateEmbeddedChecksum } from './backup-integrity';
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

const stripUndefinedValues = <T extends object>(data: T) => {
    return Object.fromEntries(
        Object.entries(data as Record<string, unknown>).filter(([, value]) => value !== undefined)
    ) as unknown as T;
};

export function isEncryptedDatabaseEnvelope(record: unknown): boolean {
    const candidate = record as Record<string, unknown> | null;
    return Boolean(candidate?.is_encrypted && candidate.iv && candidate.ciphertext);
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
            if (isEncryptedDatabaseEnvelope(record) && !record.student_lrn && !record.subject_id) {
                return null;
            }
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
    const seenSecIds = new Set<string>();
    const seenSubIds = new Set<string>();
    const seenEnrIds = new Set<string>();
    const seenCrIds = new Set<string>();
    const seenGsIds = new Set<string>();
    const seenObsIds = new Set<string>();
    const seenAttIds = new Set<string>();
    const seenSf2Ids = new Set<string>();
    const seenHpsIds = new Set<string>();

    return {
        students: (backup.payload.students || []).map((s, idx) => {
            const stripped = stripUndefinedValues(s);
            const sRecord = s as unknown as Record<string, unknown>;
            const rawLrn = stripped.lrn ?? sRecord.student_lrn ?? sRecord.LRN ?? sRecord.id ?? `TEMP-RESTORE-${idx}`;
            return {
                ...stripped,
                lrn: String(rawLrn).trim() || `TEMP-RESTORE-${idx}`,
            };
        }),
        sections: (backup.payload.sections || []).map((s, idx) => {
            const stripped = stripUndefinedValues(s);
            const secRecord = s as unknown as Record<string, unknown>;
            const rawId = String(stripped.id ?? secRecord.section_id ?? `sec-${idx}`).trim() || `sec-${idx}`;
            let finalId = rawId;
            let counter = 1;
            while (seenSecIds.has(finalId)) {
                finalId = `${rawId}_${counter++}`;
            }
            seenSecIds.add(finalId);
            return {
                ...stripped,
                id: finalId,
            };
        }),
        subjects: (backup.payload.subjects || []).map((s, idx) => {
            const stripped = stripUndefinedValues(s);
            const subRecord = s as unknown as Record<string, unknown>;
            const rawId = String(stripped.id ?? subRecord.subject_id ?? `sub-${idx}`).trim() || `sub-${idx}`;
            let finalId = rawId;
            let counter = 1;
            while (seenSubIds.has(finalId)) {
                finalId = `${rawId}_${counter++}`;
            }
            seenSubIds.add(finalId);
            return {
                ...stripped,
                id: finalId,
            };
        }),
        enrollments: (backup.payload.enrollments || []).map((e, idx) => {
            const stripped = stripUndefinedValues(e);
            const rawId = String(stripped.id ?? `enr-${idx}`).trim() || `enr-${idx}`;
            let finalId = rawId;
            let counter = 1;
            while (seenEnrIds.has(finalId)) {
                finalId = `${rawId}_${counter++}`;
            }
            seenEnrIds.add(finalId);
            return {
                ...stripped,
                id: finalId,
            };
        }),
        classRecords: (backup.payload.classRecords || []).map((r, idx) => {
            const stripped = stripUndefinedValues(r);
            const rRecord = r as unknown as Record<string, unknown>;
            const lrn = String(stripped.student_lrn ?? rRecord.lrn ?? '').trim();
            const subId = String(stripped.subject_id ?? '').trim();
            const q = stripped.quarter ?? 1;
            const sy = String(stripped.school_year ?? rRecord.schoolYear ?? '').trim();
            const sec = String(stripped.section_id ?? rRecord.sectionId ?? '').trim();
            let baseId = String(stripped.id ?? rRecord.class_record_id ?? '').trim();
            if (!baseId) {
                const parts = ['grade', lrn, subId, sec, sy, `Q${q}`].filter(Boolean);
                baseId = parts.length > 1 ? parts.join('_') : `cr_${idx}`;
            }
            let finalId = baseId;
            let counter = 1;
            while (seenCrIds.has(finalId)) {
                finalId = `${baseId}_${counter++}`;
            }
            seenCrIds.add(finalId);
            return {
                ...stripped,
                id: finalId,
            };
        }),
        gradingSheetRecords: (backup.payload.gradingSheetRecords || []).map((r, idx) => {
            const stripped = stripUndefinedValues(r);
            const rRecord = r as unknown as Record<string, unknown>;
            const lrn = String(stripped.student_lrn ?? rRecord.lrn ?? '').trim();
            const subId = String(stripped.subject_id ?? '').trim();
            const q = stripped.quarter ?? 1;
            const sy = String(stripped.school_year ?? rRecord.schoolYear ?? '').trim();
            const sec = String(stripped.section_id ?? rRecord.sectionId ?? '').trim();
            let baseId = String(stripped.id ?? '').trim();
            if (!baseId) {
                const parts = ['gs', lrn, subId, sec, sy, `Q${q}`].filter(Boolean);
                baseId = parts.length > 1 ? parts.join('_') : `gs_${idx}`;
            }
            let finalId = baseId;
            let counter = 1;
            while (seenGsIds.has(finalId)) {
                finalId = `${baseId}_${counter++}`;
            }
            seenGsIds.add(finalId);
            return {
                ...stripped,
                id: finalId,
            };
        }),
        observedValues: (backup.payload.observedValues || []).map((v, idx) => {
            const stripped = stripUndefinedValues(v);
            const rawId = String(stripped.id ?? `obs-${idx}`).trim() || `obs-${idx}`;
            let finalId = rawId;
            let counter = 1;
            while (seenObsIds.has(finalId)) {
                finalId = `${rawId}_${counter++}`;
            }
            seenObsIds.add(finalId);
            return {
                ...stripped,
                id: finalId,
            };
        }),
        attendanceRecords: (backup.payload.attendanceRecords || []).map((r, idx) => {
            const stripped = stripUndefinedValues(r);
            const rawId = String(stripped.id ?? `att-${idx}`).trim() || `att-${idx}`;
            let finalId = rawId;
            let counter = 1;
            while (seenAttIds.has(finalId)) {
                finalId = `${rawId}_${counter++}`;
            }
            seenAttIds.add(finalId);
            return {
                ...stripped,
                id: finalId,
            };
        }),
        sf2Sheets: (backup.payload.sf2Sheets || []).map((s, idx) => {
            const stripped = stripUndefinedValues(s);
            const rawId = String(stripped.id ?? `sf2-${idx}`).trim() || `sf2-${idx}`;
            let finalId = rawId;
            let counter = 1;
            while (seenSf2Ids.has(finalId)) {
                finalId = `${rawId}_${counter++}`;
            }
            seenSf2Ids.add(finalId);
            return {
                ...stripped,
                id: finalId,
            };
        }),
        hpsRecords: (backup.payload.hpsRecords || []).map((h, idx) => {
            const stripped = stripUndefinedValues(h);
            const rawId = String(stripped.id ?? `hps-${idx}`).trim() || `hps-${idx}`;
            let finalId = rawId;
            let counter = 1;
            while (seenHpsIds.has(finalId)) {
                finalId = `${rawId}_${counter++}`;
            }
            seenHpsIds.add(finalId);
            return {
                ...stripped,
                id: finalId,
            };
        }),
    };
}

async function restoreStoreData<T extends object>(
    storeName: string,
    items: T[],
    keyField: string,
    strategy: RestoreStrategy,
    changes: RestoreStoreChange[],
): Promise<{ created: number; updated: number; skipped: number }> {
    if (strategy === 'replace') {
        changes.push({ store: storeName, records: items, replace: true });
        return { created: items.length, updated: 0, skipped: 0 };
    }

    if (items.length === 0) return { created: 0, updated: 0, skipped: 0 };

    if (strategy === 'skip_existing') {
        const existingRecords = await db.getAllRecords<Record<string, unknown>>(storeName);
        const existingKeys = new Set(existingRecords.map(r => String(r[keyField] ?? '')));
        const newItems = items.filter(item => !existingKeys.has(String((item as Record<string, unknown>)[keyField] ?? '')));
        const skipped = items.length - newItems.length;
        if (newItems.length > 0) {
            changes.push({ store: storeName, records: newItems, replace: false });
        }
        return { created: newItems.length, updated: 0, skipped };
    }

    // strategy === 'merge' (default)
    changes.push({ store: storeName, records: items, replace: false });
    return { created: 0, updated: items.length, skipped: 0 };
}

export async function unsealBackupPayload(backup: ComprehensiveBackup): Promise<ComprehensiveBackup> {
    const payload = backup.payload;
    if (!payload || typeof payload !== 'object') return backup;

    const unsealedPayload: Record<string, unknown> = { ...payload };
    for (const [storeName, items] of Object.entries(payload)) {
        if (!Array.isArray(items)) continue;
        const hasEncrypted = items.some(isEncryptedDatabaseEnvelope);
        if (!hasEncrypted) continue;

        const unsealedItems = await Promise.all(
            items.map(async (item) => {
                if (!isEncryptedDatabaseEnvelope(item)) return item;
                if (typeof db._decryptRecord !== 'function') return item;
                try {
                    return await db._decryptRecord(storeName, item);
                } catch {
                    throw new Error(`Backup ${storeName} contains encrypted records that could not be decrypted with your current account key. Existing records were not changed.`);
                }
            })
        );
        unsealedPayload[storeName] = unsealedItems;
    }

    return {
        ...backup,
        payload: unsealedPayload as ComprehensiveBackup['payload'],
    };
}

export async function restoreBackupToFirestore(
    backup: ComprehensiveBackup,
    options: RestoreExecutionOptions,
): Promise<RestoreExecutionResult> {
    const validation = await validateBackup(backup);
    if (!validation.isValid) throw new Error(validation.issues.join(' '));
    if (backup._checksum) {
        const integrity = await validateEmbeddedChecksum(backup as unknown as Record<string, unknown>);
        if (!integrity.valid || (integrity.strength === 'legacy' && !await hasValidPayloadHash(backup as unknown as Record<string, unknown>))) {
            throw new Error('Backup integrity verification failed. Existing records were not changed.');
        }
    }
    const result: RestoreExecutionResult = {
        created: 0,
        updated: 0,
        skipped: 0,
        issues: [],
    };

    const unsealedBackup = await unsealBackupPayload(backup);
    const prepared = prepareDataForRestore(unsealedBackup);
    const selected = options.selectedItems;
    const strategy = options.strategy;
    if (selected.size === 0) throw new Error('Select at least one item to restore.');
    const changes: RestoreStoreChange[] = [];
    const preparedByStore = prepared as unknown as Record<string, unknown>;
    for (const store of selected) {
        if (store in preparedByStore && !Array.isArray((backup.payload as unknown as Record<string, unknown>)[store])) {
            throw new Error(`Selected backup collection "${store}" is missing or invalid.`);
        }
    }
    const portableSettings = selected.has('localStorageData')
        ? selectRestorableBackupSettings(backup.payload.localStorageData)
        : {};
    if (selected.has('localStorageData') && Array.isArray(backup.payload.schoolYears)) {
        portableSettings.formease_school_years = JSON.stringify(backup.payload.schoolYears);
    }

    const runRestoreStep = async (stepName: string, fn: () => Promise<void>) => {
        try {
            await fn();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`[Restore] Error restoring ${stepName}:`, error);
            result.issues.push(`Failed to restore ${stepName}: ${message}`);
            throw error;
        }
    };

    // 1. School Profile
    await runRestoreStep('schoolProfile', async () => {
        const rawProfile = backup.payload.schoolProfile ||
            (backup.payload as Record<string, unknown>).school_profile ||
            (backup.payload as Record<string, unknown>).school ||
            (backup.payload as Record<string, unknown>).profile;
        const bestProfile = resolveBestSchoolProfile(rawProfile);
        if (selected.has('schoolProfile') && bestProfile) {
            const profile = stripUndefinedValues(bestProfile);
            if (strategy === 'skip_existing') {
                const existing = await db.getAllRecords<SchoolProfile>('schoolProfile');
                const hasRealProfile = existing.some(p => p && p.name && p.name.trim() !== 'School Name');
                if (!hasRealProfile) {
                    changes.push({ store: 'schoolProfile', records: [profile], replace: true });
                    result.created += 1;
                } else {
                    result.skipped += 1;
                }
            } else {
                changes.push({ store: 'schoolProfile', records: [profile], replace: true });
                result.updated += 1;
            }
        }
    });

    // 2. Students
    await runRestoreStep('students', async () => {
        if (selected.has('students')) {
            const res = await restoreStoreData('students', prepared.students, 'lrn', strategy, changes);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 3. Sections
    await runRestoreStep('sections', async () => {
        if (selected.has('sections')) {
            const res = await restoreStoreData('sections', prepared.sections, 'id', strategy, changes);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 4. Subjects
    await runRestoreStep('subjects', async () => {
        if (selected.has('subjects')) {
            const res = await restoreStoreData('subjects', prepared.subjects, 'id', strategy, changes);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 5. Enrollments
    await runRestoreStep('enrollments', async () => {
        if (selected.has('enrollments')) {
            const res = await restoreStoreData('enrollments', prepared.enrollments, 'id', strategy, changes);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 6. Class Records
    await runRestoreStep('classRecords', async () => {
        if (selected.has('classRecords')) {
            const res = await restoreStoreData('classRecords', prepared.classRecords, 'id', strategy, changes);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 7. Grading Sheet Records
    await runRestoreStep('gradingSheetRecords', async () => {
        if (selected.has('gradingSheetRecords')) {
            const res = await restoreStoreData('gradingSheetRecords', prepared.gradingSheetRecords, 'id', strategy, changes);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 8. Observed Values
    await runRestoreStep('observedValues', async () => {
        if (selected.has('observedValues')) {
            const res = await restoreStoreData('observedValues', prepared.observedValues, 'id', strategy, changes);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 9. Announcements
    await runRestoreStep('announcements', async () => {
        if (selected.has('announcements')) {
            const items = (backup.payload.announcements || []).map((item, idx) => ({ ...stripUndefinedValues(item), id: String(item.id || `anc_${idx}`).trim() }));
            const res = await restoreStoreData('announcements', items, 'id', strategy, changes);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 10. Attendance Records
    await runRestoreStep('attendanceRecords', async () => {
        if (selected.has('attendanceRecords')) {
            const res = await restoreStoreData('attendanceRecords', prepared.attendanceRecords, 'id', strategy, changes);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 11. SF2 Sheets
    await runRestoreStep('sf2Sheets', async () => {
        if (selected.has('sf2Sheets')) {
            const res = await restoreStoreData('sf2Sheets', prepared.sf2Sheets, 'id', strategy, changes);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 12. HPS Records
    await runRestoreStep('hpsRecords', async () => {
        if (selected.has('hpsRecords')) {
            const res = await restoreStoreData('hpsRecords', prepared.hpsRecords, 'id', strategy, changes);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    // 13. Users
    await runRestoreStep('users', async () => {
        if (selected.has('users') && Array.isArray(backup.payload.users)) {
            const users = backup.payload.users.map(u => ({ ...stripUndefinedValues(u), id: u.uid }));
            const res = await restoreStoreData('users', users, 'id', strategy, changes);
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
            const res = await restoreStoreData('activityLog', entries, 'id', strategy, changes);
            result.created += res.created;
            result.updated += res.updated;
            result.skipped += res.skipped;
        }
    });

    if (changes.length === 0 && Object.keys(portableSettings).length === 0) {
        throw new Error('The selected backup items contain no restorable data. Existing records were not changed.');
    }
    if (selected.has('schoolProfile') || selected.has('localStorageData') || selected.has('sections')) {
        const detectedSy = detectSchoolYearFromBackup(backup.payload, undefined, backup.summary?.activeSchoolYear);
        if (detectedSy && detectedSy.toLowerCase() !== 'unknown') {
            portableSettings.activeSchoolYear = detectedSy;
            portableSettings.formease_active_school_year = detectedSy;
        }
    }
    await runRestoreStep('database transaction', async () => {
        await db.applyRestoreBatch(changes, portableSettings);
    });
    await runRestoreStep('academic settings', async () => {
        await db.resumePendingRestoreSettings();
    });

    if (typeof window !== 'undefined' && selected.has('schoolProfile')) {
        const rawProfile = backup.payload.schoolProfile ||
            (backup.payload as Record<string, unknown>).school_profile ||
            (backup.payload as Record<string, unknown>).school ||
            (backup.payload as Record<string, unknown>).profile;
        const bestProfile = resolveBestSchoolProfile(rawProfile);
        if (bestProfile) {
            try {
                const { useAppStore } = await import('../stores/app-store');
                useAppStore.getState().setSchoolProfile(bestProfile);
            } catch {
                // Non-fatal if app store is not loaded
            }
        }
    }

    return result;
}
