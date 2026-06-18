import { db } from '../services/database';
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
    };
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

    const localStorageData: Record<string, string> = {};
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith('formease_sf8_signatories_') ||
                key === 'school_calendar_events'
            )) {
                const value = localStorage.getItem(key);
                if (value) {
                    localStorageData[key] = value;
                }
            }
        }
    } catch (e) {
        console.warn('Failed to read localStorage for comprehensive backup:', e);
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
        `Core Values: ${backup.summary.observedValues}`,
        `Announcements: ${backup.summary.announcements}`,
        `Attendance Records: ${backup.summary.attendanceRecords ?? 0}`,
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
