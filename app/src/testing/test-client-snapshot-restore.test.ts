import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { reconcileOrphanedGradesAndSubjects } from '../utils/grade-reconciliation';
import {
    detectSchoolYearFromBackup,
    resolveBestSchoolProfile,
    validateRestoreBackup,
    prepareDataForRestore,
} from '../utils/backup-import';
import type { ComprehensiveBackup } from '../utils/backup-restore';

// This optional diagnostic is intentionally excluded from CI: it can inspect
// only a developer-supplied local export and must never name a client backup.
const filePath = process.env.FORMEASE_CLIENT_SNAPSHOT_PATH;
const hasSnapshot = Boolean(filePath && fs.existsSync(filePath));
const fileName = filePath ? path.basename(filePath) : '';

describe.skipIf(!hasSnapshot)('Client Snapshot Restore & Reconciliation Verification', () => {

    it('should verify the snapshot file exists and contains valid raw data', () => {
        expect(fs.existsSync(filePath)).toBe(true);

        const rawText = fs.readFileSync(filePath, 'utf8');
        const rawData = JSON.parse(rawText);

        expect(Array.isArray(rawData.students)).toBe(true);
        expect(rawData.students.length).toBeGreaterThan(0);
        expect(Array.isArray(rawData.sections)).toBe(true);
        expect(rawData.sections.length).toBeGreaterThan(0);
        expect(Array.isArray(rawData.subjects)).toBe(true);
        expect(rawData.subjects.length).toBeGreaterThan(0);
        expect(Array.isArray(rawData.classRecords)).toBe(true);
        expect(rawData.classRecords.length).toBeGreaterThan(0);
        expect(Array.isArray(rawData.gradingSheetRecords)).toBe(true);
        expect(rawData.gradingSheetRecords.length).toBeGreaterThan(0);
        expect(Array.isArray(rawData.schoolProfile)).toBe(true);
        expect(rawData.schoolProfile.length).toBeGreaterThan(0);
    });

    it('should correctly detect active school year from filename and records', () => {
        const rawText = fs.readFileSync(filePath, 'utf8');
        const rawData = JSON.parse(rawText);

        // 1. With filename when it carries a school-year hint.
        const detectedWithFile = detectSchoolYearFromBackup(rawData, fileName);
        expect(detectedWithFile).toMatch(/^\d{4}-\d{4}$|^Unknown$/);

        // 2. Without filename (pure data inspection of classRecords/gradingSheetRecords).
        const detectedWithoutFile = detectSchoolYearFromBackup(rawData);
        expect(detectedWithoutFile).toMatch(/^\d{4}-\d{4}$|^Unknown$/);
    });

    it('should accurately resolve the populated school profile over the blank dummy profile', () => {
        const rawText = fs.readFileSync(filePath, 'utf8');
        const rawData = JSON.parse(rawText);

        const best = resolveBestSchoolProfile(rawData.schoolProfile);
        expect(best).not.toBeNull();
        expect(best?.name.trim()).toBeTruthy();
        expect(best?.school_id.trim()).toBeTruthy();
    });

    it('should validate the constructed backup and report zero blocking issues', () => {
        const rawText = fs.readFileSync(filePath, 'utf8');
        const rawData = JSON.parse(rawText);

        const detectedSy = detectSchoolYearFromBackup(rawData, fileName);
        const bestProfile = resolveBestSchoolProfile(rawData.schoolProfile)!;

        const backup: ComprehensiveBackup = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: rawData.version || '2.0.0-auto-converted',
                exportedBy: 'Auto-detected',
                note: `Backup file: ${fileName}`,
                warning: '',
            },
            summary: {
                activeSchoolYear: detectedSy,
                students: rawData.students.length,
                studentProfiles: (rawData.studentProfiles || []).length,
                sections: rawData.sections.length,
                subjects: rawData.subjects.length,
                grades: rawData.classRecords.length,
                gradingSheetRecords: rawData.gradingSheetRecords.length,
                observedValues: (rawData.observedValues || []).length,
                hpsRecords: (rawData.hpsRecords || []).length,
                sf2Sheets: (rawData.sf2Sheets || []).length,
                announcements: (rawData.announcements || []).length,
                schoolYears: (rawData.schoolYears || []).length,
                enrollments: (rawData.enrollments || []).length,
                users: (rawData.users || []).length,
                systemSettings: 0,
                adviserAssignments: 0,
                gradingConfiguration: 0,
                attendanceRecords: (rawData.attendanceRecords || []).length,
                sf10Records: 0,
            },
            payload: {
                activeSchoolYear: detectedSy,
                schoolProfile: bestProfile,
                students: rawData.students,
                studentProfiles: rawData.studentProfiles || [],
                sections: rawData.sections,
                subjects: rawData.subjects,
                classRecords: rawData.classRecords,
                gradingSheetRecords: rawData.gradingSheetRecords,
                observedValues: rawData.observedValues || [],
                hpsRecords: rawData.hpsRecords || [],
                sf2Sheets: rawData.sf2Sheets || [],
                announcements: rawData.announcements || [],
                schoolYears: rawData.schoolYears || [],
                enrollments: rawData.enrollments || [],
                attendanceRecords: rawData.attendanceRecords || [],
                users: rawData.users || [],
                systemSettings: rawData.systemSettings || {},
                adviserAssignments: rawData.adviserAssignments || [],
                gradingConfiguration: rawData.gradingConfiguration || {},
                localStorageData: rawData.localStorageData || {},
                activityLog: rawData.activityLog || [],
            },
        };

        const validation = validateRestoreBackup(backup);
        expect(validation.isValid).toBe(true);
        expect(validation.canRestore).toBe(true);
        expect(validation.issues).toHaveLength(0);

        const prepared = prepareDataForRestore(backup);
        expect(prepared.students).toHaveLength(rawData.students.length);
        expect(prepared.sections).toHaveLength(rawData.sections.length);
        expect(prepared.subjects).toHaveLength(rawData.subjects.length);
        expect(prepared.classRecords).toHaveLength(rawData.classRecords.length);
        expect(prepared.gradingSheetRecords).toHaveLength(rawData.gradingSheetRecords.length);
    });

    it('reconciles grades and subjects without dropping records from the supplied snapshot', () => {
        const rawText = fs.readFileSync(filePath, 'utf8');
        const rawData = JSON.parse(rawText);

        const input = {
            subjects: rawData.subjects,
            sections: rawData.sections,
            students: rawData.students,
            classRecords: rawData.classRecords,
            hpsRecords: rawData.hpsRecords,
            gradingSheetRecords: rawData.gradingSheetRecords,
        };

        const result = reconcileOrphanedGradesAndSubjects(input);
        expect(result.classRecords.length).toBe(rawData.classRecords.length);
        expect(result.gradingSheetRecords.length).toBe(rawData.gradingSheetRecords.length);
        expect(result.deletedClassRecordIds || []).toHaveLength(0);
        expect(result.deletedGradingSheetRecordIds || []).toHaveLength(0);
    });
});
