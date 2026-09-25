import { db } from '../services/database';
import { useSF10Store } from '../stores/sf10-store';
import type {
    SchoolProfile,
    Student,
    Section,
    Subject,
    Announcement,
    ClassRecord,
    ObservedValues,
    HPSRecord,
    SF2Sheet,
    SchoolYear,
    Enrollment,
    AttendanceRecord,
} from '../types';

export interface BackupMetadata {
    exportDate: string;
    version: string;
    exportedBy: string;
    note: string;
    warning: string;
    payloadHash?: string; // SHA-256 hex of JSON.stringify(payload) — used to detect corruption/tampering
    snapshotId?: string;
}

async function hashPayload(payload: ComprehensiveBackup['payload']): Promise<string> {
    const encoded = new TextEncoder().encode(JSON.stringify(payload));
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export interface BackupSummary {
    activeSchoolYear: string;
    students: number;
    studentProfiles: number;
    sections: number;
    subjects: number;
    grades: number;
    gradingSheetRecords: number;
    observedValues: number;
    hpsRecords: number;
    sf2Sheets: number;
    announcements: number;
    schoolYears: number;
    enrollments: number;
    users: number;
    systemSettings: number;
    adviserAssignments: number;
    gradingConfiguration: number;
    attendanceRecords: number;
    activityLog?: number;
    sf10Records?: number;
}

export interface BackupUser {
    uid: string;
    username: string;
    email: string;
    displayName: string;
    roles: string[];
    primaryRole: string;
    adviserSectionId: string;
    adviserSectionName?: string;
    createdAt?: string;
}

export interface ComprehensiveBackup {
    metadata: BackupMetadata;
    summary: BackupSummary;
    payload: {
        schoolProfile: SchoolProfile;
        schoolYears: SchoolYear[];
        activeSchoolYear: string;
        enrollments: Enrollment[];
        students: Student[];
        studentProfiles: Student[];
        sections: Section[];
        subjects: Subject[];
        classRecords: ClassRecord[];
        gradingSheetRecords: ClassRecord[];
        observedValues: ObservedValues[];
        hpsRecords: HPSRecord[];
        sf2Sheets: SF2Sheet[];
        announcements: Announcement[];
        attendanceRecords: AttendanceRecord[];
        users: BackupUser[];
        systemSettings: Record<string, unknown>;
        adviserAssignments: Array<{
            userId: string;
            username: string;
            displayName: string;
            sectionId: string;
            sectionName: string;
            gradeLevel: string;
        }>;
        gradingConfiguration: Record<string, unknown>;
        localStorageData?: Record<string, string>;
        activityLog?: unknown[];
    };
    _checksum?: string;
    _checksumVersion?: 2;
}

const PLACEHOLDER_SCHOOL_NAMES = new Set(['', 'school name', 'unknown school', 'n/a']);
const PLACEHOLDER_SCHOOL_IDS = new Set(['', 'school id', 'unknown', 'n/a']);

export function isValidBackupSchoolProfile(candidate: unknown): candidate is Record<string, unknown> {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false;
    const profile = candidate as Record<string, unknown>;
    const name = String(profile.name || profile.school_name || '').trim();
    const schoolId = String(profile.school_id || profile.id || '').trim();
    return !PLACEHOLDER_SCHOOL_NAMES.has(name.toLowerCase())
        && !PLACEHOLDER_SCHOOL_IDS.has(schoolId.toLowerCase());
}

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
            // High priority score weighting for digital seals and specimen signatures
            if (p.logo_url) score += 15;
            if (p.head_signature_url) score += 15;
            if (p.adviser_signature_url) score += 15;
            if (p.adviser_image_url) score += 5;
            if (p.head_name || (p as Record<string, unknown>).principal_name) score += 5;
            if (p.head_position || (p as Record<string, unknown>).principal_position) score += 3;
            if (p.district) score += 2;
            if (p.municipality || p.city) score += 2;
            if (p.province) score += 2;
            if (p.grade_levels_offered) score += 2;
            if (p.id_card_config) score += 5;
            if (p.curriculum || p.sf10_curriculum) score += 5;
            return { profile: p, score };
        });

        scored.sort((a, b) => b.score - a.score);
        const best = scored[0]?.profile;
        if (!best) return null;

        const school_id = String(best.school_id || best.id || '').trim();
        const name = String(best.name || best.school_name || '').trim();
        const head_name = String(best.head_name || (best as Record<string, unknown>).principal_name || '').trim();
        const head_position = String(best.head_position || (best as Record<string, unknown>).principal_position || '').trim();
        return {
            ...best,
            school_id,
            ...(name ? { name } : {}),
            ...(head_name ? { head_name } : {}),
            ...(head_position ? { head_position } : {}),
        } as unknown as SchoolProfile;
    }

    if (isValidBackupSchoolProfile(rawProfile)) {
        const p = rawProfile as Record<string, unknown>;
        const school_id = String(p.school_id || p.id || '').trim();
        const name = String(p.name || p.school_name || '').trim();
        const head_name = String(p.head_name || p.principal_name || '').trim();
        const head_position = String(p.head_position || p.principal_position || '').trim();
        return {
            ...p,
            school_id,
            ...(name ? { name } : {}),
            ...(head_name ? { head_name } : {}),
            ...(head_position ? { head_position } : {}),
        } as unknown as SchoolProfile;
    }

    return null;
}

/** Only portable school data/preferences may cross from another profile. */
export function isRestorableBackupSettingKey(key: string): boolean {
    return key === 'sf10-storage' ||
        key === 'activeSchoolYear' ||
        key === 'formease_active_school_year' ||
        key === 'formease_school_years' ||
        key === 'schoolYears' ||
        key === 'formease_subjects_autoloaded' ||
        key === 'formease_shs_subjects_migrated_v2' ||
        key.startsWith('formease_sf') ||
        key.startsWith('formease-sf') ||
        key.startsWith('formease_pace_') ||
        key.startsWith('g1_remarks_') ||
        key.startsWith('formease_certificate_') ||
        key.startsWith('formease_id_card_') ||
        key === 'school_calendar_events' ||
        key === 'system_login_announcement' ||
        key === 'disable-animations' ||
        key === 'formease-theme' ||
        key === 'sms_broadcast_history' ||
        key === 'formease_sms_gateway_config' ||
        key === 'formease_sms_delivery_logs' ||
        key === 'formease_backup_history' ||
        key === 'formease_snapshot_retention_limit';
}

export function selectRestorableBackupSettings(data: unknown): Record<string, string> {
    if (data === undefined || data === null) return {};
    if (typeof data !== 'object' || Array.isArray(data)) throw new Error('Backup settings are invalid.');
    const selected: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
        if (!isRestorableBackupSettingKey(key)) continue;
        if (typeof value !== 'string') throw new Error(`Backup setting "${key}" is invalid.`);
        if (key === 'sf10-storage') JSON.parse(value);
        selected[key] = value;
    }
    return selected;
}

export function collectBackupLocalStorage(): Record<string, string> {
    const localStorageData: Record<string, string> = {};
    if (typeof localStorage === 'undefined') return localStorageData;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !isRestorableBackupSettingKey(key)) continue;
        const value = localStorage.getItem(key);
        if (value !== null) {
            localStorageData[key] = value;
        }
    }
    return localStorageData;
}

export function restoreBackupLocalStorage(data?: Record<string, string>): void {
    if (!data || typeof localStorage === 'undefined') return;
    const selected = selectRestorableBackupSettings(data);
    const before = new Map(Object.keys(selected).map(key => [key, localStorage.getItem(key)]));
    try {
        Object.entries(selected).forEach(([key, value]) => localStorage.setItem(key, value));
        for (const [key, value] of Object.entries(selected)) {
            if (localStorage.getItem(key) !== value) throw new Error(`Academic setting "${key}" failed readback verification.`);
        }

        // Instantly rehydrate Zustand SF10 store so in-memory React state is up-to-date
        if (selected['sf10-storage']) {
            try {
                useSF10Store.persist?.rehydrate?.();
                console.log('✅ Rehydrated SF10 store from restored backup data.');
            } catch (rehydrateErr) {
                console.warn('Could not rehydrate SF10 store immediately:', rehydrateErr);
            }
        }

        console.log(`✅ Restored ${Object.keys(selected).length} academic settings to localStorage.`);
    } catch (e) {
        for (const [key, value] of before) {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
        }
        throw new Error('Academic settings could not be restored; the database recovery needs review.', { cause: e });
    }
}

export async function createComprehensiveBackup(
    schoolProfile: SchoolProfile,
    schoolYears: SchoolYear[],
    activeSchoolYear: string,
    enrollments: Enrollment[],
    students: Student[],
    studentProfiles: Student[],
    sections: Section[],
    subjects: Subject[],
    classRecords: ClassRecord[],
    gradingSheetRecords: ClassRecord[],
    observedValues: ObservedValues[],
    hpsRecords: HPSRecord[],
    sf2Sheets: SF2Sheet[],
    announcements: Announcement[],
    attendanceRecords: AttendanceRecord[],
    exportedBy: string = 'local-user',
    backupSidecars?: { users: BackupUser[]; activityLog: unknown[]; localStorageData: Record<string, string>; schoolProfiles?: SchoolProfile[] },
): Promise<ComprehensiveBackup> {
    const users = backupSidecars?.users ?? await db.getAllRecords<BackupUser>('users');
    const activityLog = backupSidecars?.activityLog ?? await db.getAllRecords<unknown>('activityLog');
    const localStorageData = backupSidecars?.localStorageData ?? collectBackupLocalStorage();

    // Ensure we don't package an empty placeholder profile if a real one exists in IndexedDB,
    // and merge to guarantee that all specimen signatures, seals, and location details are preserved.
    let effectiveSchoolProfile = schoolProfile;
    {
        const dbProfiles = backupSidecars?.schoolProfiles ?? await db.getAllRecords<SchoolProfile>('schoolProfile');
        const best = resolveBestSchoolProfile(dbProfiles);
        if (best) {
            if (!isValidBackupSchoolProfile(effectiveSchoolProfile)) {
                effectiveSchoolProfile = best;
            } else {
                effectiveSchoolProfile = {
                    ...best,
                    ...effectiveSchoolProfile,
                    logo_url: effectiveSchoolProfile.logo_url || best.logo_url,
                    head_signature_url: effectiveSchoolProfile.head_signature_url || best.head_signature_url,
                    adviser_signature_url: effectiveSchoolProfile.adviser_signature_url || best.adviser_signature_url,
                    adviser_image_url: effectiveSchoolProfile.adviser_image_url || best.adviser_image_url,
                };
            }
        }
    }

    // Calculate count of learners with SF10 overrides/customizations
    let sf10Records = 0;
    if (localStorageData['sf10-storage']) {
        try {
            const parsed = JSON.parse(localStorageData['sf10-storage']);
            const overrides = parsed?.state?.overrides || parsed?.overrides || {};
            sf10Records = Object.keys(overrides).length;
        } catch {
            sf10Records = 0;
        }
    }

    const adviserAssignments = sections
        .filter((s) => Boolean(s.adviser_id || s.adviser_name))
        .map((s) => {
            const matchedUser = users.find((u) => u.uid === s.adviser_id || (u as unknown as Record<string, unknown>).id === s.adviser_id);
            return {
                userId: s.adviser_id || '',
                username: matchedUser?.username || '',
                displayName: s.adviser_name || matchedUser?.displayName || '',
                sectionId: s.id,
                sectionName: s.section_name,
                gradeLevel: s.section_grade_level || (s as unknown as Record<string, string>).grade_level || '',
            };
        });

    const gradingConfiguration = {
        curriculumStandard: 'DepEd Order No. 8, s. 2015 / DepEd MATATAG Curriculum',
        clusters: {
            languages_ap_esp_math_sci: { written_works: 0.20, performance_tasks: 0.50, quarterly_exam: 0.30 },
            mapeh_epp_tle: { written_works: 0.20, performance_tasks: 0.60, quarterly_exam: 0.20 },
            shs_research: { written_works: 0.40, performance_tasks: 0.60, quarterly_exam: 0.00 },
        },
    };

    const systemSettings = {
        loginAnnouncement: (typeof localStorage !== 'undefined' ? localStorage.getItem('system_login_announcement') : '') || '',
        theme: (typeof localStorage !== 'undefined' ? localStorage.getItem('formease-theme') : '') || 'system',
        sf9Template: (typeof localStorage !== 'undefined' ? localStorage.getItem('formease-sf9-template') : '') || 'template1',
        disableAnimations: (typeof localStorage !== 'undefined' ? localStorage.getItem('disable-animations') === 'true' : false),
    };

    const backup: ComprehensiveBackup = {
        metadata: {
            exportDate: new Date().toISOString(),
            version: '2.0.0-local',
            exportedBy,
            note: 'Offline local backup',
            warning: 'Contains local-only data snapshot',
        },
        summary: {
            activeSchoolYear,
            students: students.length,
            studentProfiles: studentProfiles.length,
            sections: sections.length,
            subjects: subjects.length,
            grades: classRecords.length,
            gradingSheetRecords: gradingSheetRecords.length,
            observedValues: observedValues.length,
            hpsRecords: hpsRecords.length,
            sf2Sheets: sf2Sheets.length,
            announcements: announcements.length,
            schoolYears: schoolYears.length,
            enrollments: enrollments.length,
            users: users.length,
            systemSettings: 1,
            adviserAssignments: adviserAssignments.length,
            gradingConfiguration: 1,
            attendanceRecords: attendanceRecords.length,
            activityLog: activityLog.length,
            sf10Records,
        },
        payload: {
            schoolProfile: effectiveSchoolProfile,
            schoolYears,
            activeSchoolYear,
            enrollments,
            students,
            studentProfiles,
            sections,
            subjects,
            classRecords,
            gradingSheetRecords,
            observedValues,
            hpsRecords,
            sf2Sheets,
            announcements,
            attendanceRecords,
            users,
            systemSettings,
            adviserAssignments,
            gradingConfiguration,
            localStorageData,
            activityLog,
        },
    };

    backup.metadata.payloadHash = await hashPayload(backup.payload);
    return backup;
}

/**
 * Gathers all records directly from the database and returns a complete ComprehensiveBackup (Full Database Export).
 */
export async function exportFullDatabaseBackup(exportedBy: string = 'local-user'): Promise<ComprehensiveBackup> {
    const generationBefore = db.getWriteGeneration();
    const settingsBefore = collectBackupLocalStorage();
    const snapshot = await db.readBackupSnapshot();
    if (db.getWriteGeneration() !== generationBefore) {
        throw new Error('Records changed during backup capture. Retry after saving edits.');
    }
    const settingsAfter = collectBackupLocalStorage();
    if (JSON.stringify(settingsBefore) !== JSON.stringify(settingsAfter)) {
        throw new Error('Settings changed during backup capture. Retry after saving edits.');
    }
    const {
        schoolProfile: dbProfiles,
        students: dbStudents,
        sections: dbSections,
        subjects: dbSubjects,
        classRecords: dbClassRecords,
        enrollments: dbEnrollments,
        announcements: dbAnnouncements,
        attendanceRecords: dbAttendance,
        sf2Sheets: dbSf2,
        hpsRecords: dbHps,
        gradingSheetRecords: dbGradingSheet,
        observedValues: dbObserved,
        users,
        activityLog,
    } = snapshot;

    let schoolYears: SchoolYear[] = [];
    try {
        if (typeof localStorage !== 'undefined') {
            const storedYears = localStorage.getItem('formease_school_years') || localStorage.getItem('schoolYears');
            if (storedYears) {
                schoolYears = JSON.parse(storedYears);
            }
        }
    } catch {
        schoolYears = [];
    }

    if (schoolYears.length === 0 && typeof window !== 'undefined') {
        try {
            const { useAppStore } = await import('../stores/app-store');
            const stateYears = useAppStore.getState()?.schoolYears;
            if (Array.isArray(stateYears) && stateYears.length > 0) {
                schoolYears = stateYears;
            }
        } catch {
            // fallback
        }
    }

    let activeSchoolYear = (typeof localStorage !== 'undefined' && (localStorage.getItem('formease_active_school_year') || localStorage.getItem('activeSchoolYear'))) || '';
    if (!activeSchoolYear && typeof window !== 'undefined') {
        try {
            const { useAppStore } = await import('../stores/app-store');
            activeSchoolYear = useAppStore.getState()?.activeSchoolYear || '';
        } catch {
            // fallback
        }
    }
    if (!activeSchoolYear || activeSchoolYear === 'Unknown') {
        activeSchoolYear = '2026-2027';
    }

    let schoolProfile = resolveBestSchoolProfile(dbProfiles);
    if (typeof window !== 'undefined') {
        try {
            const { useAppStore } = await import('../stores/app-store');
            const stateProfile = useAppStore.getState()?.schoolProfile;
            if (stateProfile && isValidBackupSchoolProfile(stateProfile)) {
                if (schoolProfile) {
                    schoolProfile = {
                        ...stateProfile,
                        ...schoolProfile,
                        logo_url: schoolProfile.logo_url || stateProfile.logo_url,
                        head_signature_url: schoolProfile.head_signature_url || stateProfile.head_signature_url,
                        adviser_signature_url: schoolProfile.adviser_signature_url || stateProfile.adviser_signature_url,
                        adviser_image_url: schoolProfile.adviser_image_url || stateProfile.adviser_image_url,
                    };
                } else {
                    schoolProfile = stateProfile;
                }
            }
        } catch {
            // fallback
        }
    }

    if (!schoolProfile) {
        schoolProfile = dbProfiles[0] || {
            school_id: '',
            name: 'School Name',
            region: '',
            division: '',
            district: '',
            head_name: '',
            head_position: '',
            grade_levels_offered: '',
        };
    }

    const backup = await createComprehensiveBackup(
        schoolProfile,
        schoolYears,
        activeSchoolYear,
        dbEnrollments,
        dbStudents,
        dbStudents,
        dbSections,
        dbSubjects,
        dbClassRecords,
        dbGradingSheet,
        dbObserved,
        dbHps,
        dbSf2,
        dbAnnouncements,
        dbAttendance,
        exportedBy,
        { users: users as BackupUser[], activityLog, localStorageData: settingsAfter, schoolProfiles: dbProfiles },
    );

    const { embedChecksum } = await import('./backup-integrity');
    const withChecksum = await embedChecksum(backup as unknown as Record<string, unknown>);
    return withChecksum as unknown as ComprehensiveBackup;
}

/** A restore may start only after the current state has a verified recovery copy. */
export async function savePreRestoreSafetySnapshot(): Promise<{ id: string; filename?: string }> {
    const { hasValidPayloadHash, validateEmbeddedChecksum } = await import('./backup-integrity');
    let backup: ComprehensiveBackup;
    try {
        backup = await exportFullDatabaseBackup('Before restoring another backup');
        const verified = await validateEmbeddedChecksum(backup as unknown as Record<string, unknown>);
        if (!verified.valid || verified.strength !== 'strong' || !await hasValidPayloadHash(backup as unknown as Record<string, unknown>)) {
            throw new Error('The current database snapshot could not be verified. Restore was cancelled.');
        }
    } catch (err: unknown) {
        // An empty replacement is not a preservation copy of unreadable data.
        // Keep the original records untouched until they can actually be saved.
        throw new Error(
            'Restore was cancelled because the existing records could not be preserved in a verified safety backup. Existing records were not changed.',
            { cause: err },
        );
    }
    const id = `prerestore-${crypto.randomUUID()}`;
    await db.putRecord('automated_backups', {
        id,
        timestamp: Date.now(),
        label: 'Before restore — protected safety copy',
        fileSize: JSON.stringify(backup).length,
        recordCounts: {
            students: backup.summary.students,
            sections: backup.summary.sections,
            subjects: backup.summary.subjects,
            classRecords: backup.summary.grades,
            enrollments: backup.summary.enrollments,
            announcements: backup.summary.announcements,
            attendanceRecords: backup.summary.attendanceRecords,
            gradingSheetRecords: backup.summary.gradingSheetRecords,
            observedValues: backup.summary.observedValues,
        },
        data: backup,
    });
    const stored = await db.getRecord<{ data: ComprehensiveBackup }>('automated_backups', id);
    if (!stored || !(await validateEmbeddedChecksum(stored.data as unknown as Record<string, unknown>)).valid) {
        throw new Error('The local recovery snapshot could not be read back. Restore was cancelled.');
    }

    const api = typeof window !== 'undefined' ? window.electronAPI : undefined;
    if (!api?.saveAutoBackup) return { id };
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `SMS_Backup_Comprehensive_prerestore_${timestamp}_${crypto.randomUUID()}.json`;
    const saved = await api.saveAutoBackup(backup, filename);
    if (!saved.success) throw new Error(saved.error || 'The pre-restore safety backup could not be saved.');
    const reread = await api.readFsBackupContent(filename) as Record<string, unknown>;
    const rereadCheck = await validateEmbeddedChecksum(reread);
    if (!rereadCheck.valid || rereadCheck.strength !== 'strong' || !await hasValidPayloadHash(reread)) {
        throw new Error('The pre-restore safety backup failed readback verification. Restore was cancelled.');
    }
    return { id, filename };
}

/**
 * Triggers a browser download of the ComprehensiveBackup as formatted JSON.
 */
export function downloadComprehensiveBackup(backup: ComprehensiveBackup, filename?: string): void {
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `SMS_Backup_Comprehensive_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function generateBackupReport(backup: ComprehensiveBackup): string {
    return [
        'COMPREHENSIVE BACKUP REPORT',
        `Export Date: ${backup.metadata.exportDate}`,
        `Version: ${backup.metadata.version}`,
        `School Year: ${backup.summary.activeSchoolYear}`,
        `Students: ${backup.summary.students}`,
        `Sections: ${backup.summary.sections}`,
        `Subjects: ${backup.summary.subjects}`,
        `Subject Grades: ${backup.summary.grades}`,
        `Consolidated Grades: ${backup.summary.gradingSheetRecords}`,
        `Teacher's Comments/Remarks: ${backup.summary.observedValues}`,
        `Announcements: ${backup.summary.announcements}`,
        `Attendance Records: ${backup.summary.attendanceRecords ?? 0}`,
        `SF10 Customizations & Remarks: ${backup.summary.sf10Records ?? (backup.payload.localStorageData?.['sf10-storage'] ? 'Included' : 0)} learner(s)`,
    ].join('\n');
}

export async function validateBackup(backup: ComprehensiveBackup): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (!backup?.metadata?.exportDate) {
        issues.push('Missing backup metadata timestamp');
    }
    if (!Array.isArray(backup?.payload?.students)) {
        issues.push('Students payload is invalid');
    }
    if (!Array.isArray(backup?.payload?.sections)) {
        issues.push('Sections payload is invalid');
    }

    // Verify SF10 storage integrity if present in payload
    if (backup?.payload?.localStorageData?.['sf10-storage']) {
        try {
            JSON.parse(backup.payload.localStorageData['sf10-storage']);
        } catch {
            issues.push('SF10 storage data is corrupted or invalid JSON');
        }
    }

    if (backup?.metadata?.payloadHash) {
        try {
            const recomputed = await hashPayload(backup.payload);
            if (recomputed !== backup.metadata.payloadHash) {
                issues.push('Backup integrity check failed — the file may be corrupted or tampered with.');
            }
        } catch {
            issues.push('Could not verify backup integrity hash.');
        }
    }

    return {
        isValid: issues.length === 0,
        issues,
    };
}
