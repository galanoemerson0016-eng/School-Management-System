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
} from '../types';

export interface BackupMetadata {
    exportDate: string;
    version: string;
    exportedBy: string;
    note: string;
    warning: string;
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
        users: Array<{
            uid: string;
            username: string;
            email: string;
            displayName: string;
            roles: string[];
            primaryRole: string;
            adviserSectionId: string;
            adviserSectionName?: string;
            createdAt?: string;
        }>;
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
    exportedBy: string = 'local-user',
): Promise<ComprehensiveBackup> {
    const users = await db.getAllRecords<any>('users').catch(() => []);

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
            users,
            systemSettings: {
                loginAnnouncement: localStorage.getItem('system_login_announcement') || '',
            },
            adviserAssignments: [],
            gradingConfiguration: {},
        },
    };

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
    ].join('\n');
}

export function validateBackup(backup: ComprehensiveBackup): { isValid: boolean; issues: string[] } {
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

    return {
        isValid: issues.length === 0,
        issues,
    };
}
