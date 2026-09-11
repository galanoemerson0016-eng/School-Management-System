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
}

export function collectBackupLocalStorage(): Record<string, string> {
    const localStorageData: Record<string, string> = {};
    if (typeof localStorage === 'undefined') return localStorageData;

    const EXCLUDED_KEYS = new Set([
        'formease-auth-token',
        'formease-auth-user',
        'formease-remember-password',
        'formease-remember-id',
        'formease_gdrive_token',
        'formease_gdrive_onboarding_dismissed',
        'formease-license-offline-limit',
        'formease-license-reset-detected',
        'formease-browser-id'
    ]);

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || EXCLUDED_KEYS.has(key) || key.startsWith('formease-license-')) continue;

            const isWhitelisted =
                key === 'sf10-storage' ||
                key === 'activeSchoolYear' ||
                key === 'formease_subjects_autoloaded' ||
                key === 'formease_shs_subjects_migrated_v2' ||
                key === 'formease_last_app_version' ||
                key.startsWith('formease_sf') ||
                key.startsWith('formease_pace_') ||
                key.startsWith('g1_remarks_') ||
                key.startsWith('formease_sms_') ||
                key.startsWith('formease_certificate_') ||
                key.startsWith('formease_id_card_') ||
                key === 'school_calendar_events' ||
                key === 'system_login_announcement' ||
                key === 'announcement_cloud_sync' ||
                key === 'sms_config' ||
                key === 'sms_broadcast_history' ||
                key === 'formease_auto_cleanup_enabled' ||
                key === 'formease_cloud_backup_schedule' ||
                key === 'formease_maintenance_log' ||
                key === 'formease_backup_history' ||
                key === 'formease_db_salt' ||
                key === 'formease-db-salt-key' ||
                key === 'disable-animations';

            if (isWhitelisted) {
                const value = localStorage.getItem(key);
                if (value !== null) {
                    localStorageData[key] = value;
                }
            }
        }
    } catch (e) {
        console.warn('Failed to collect localStorage for backup:', e);
    }
    return localStorageData;
}

export function restoreBackupLocalStorage(data?: Record<string, string>): void {
    if (!data || typeof localStorage === 'undefined') return;
    try {
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                localStorage.setItem(key, value);
            }
        });

        // Instantly rehydrate Zustand SF10 store so in-memory React state is up-to-date
        if (data['sf10-storage']) {
            try {
                useSF10Store.persist?.rehydrate?.();
                console.log('✅ Rehydrated SF10 store from restored backup data.');
            } catch (rehydrateErr) {
                console.warn('Could not rehydrate SF10 store immediately:', rehydrateErr);
            }
        }

        console.log(`✅ Restored ${Object.keys(data).length} configuration and assessment settings to localStorage.`);
    } catch (e) {
        console.warn('⚠️ Failed to restore localStorage data:', e);
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
): Promise<ComprehensiveBackup> {
    const users = await db.getAllRecords<BackupUser>('users').catch(() => []);
    const activityLog = await db.getAllRecords<unknown>('activityLog').catch(() => []);
    const localStorageData = collectBackupLocalStorage();

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
            adviserAssignments: sections.filter((s) => !!s.adviser_id).length,
            gradingConfiguration: 1,
            attendanceRecords: attendanceRecords.length,
            activityLog: activityLog.length,
            sf10Records,
        },
        payload: {
            schoolProfile,
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
            systemSettings: {
                loginAnnouncement: localStorage.getItem('system_login_announcement') || '',
            },
            adviserAssignments: [],
            gradingConfiguration: {},
            localStorageData,
            activityLog,
        },
    };

    backup.metadata.payloadHash = await hashPayload(backup.payload);
    return backup;
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
