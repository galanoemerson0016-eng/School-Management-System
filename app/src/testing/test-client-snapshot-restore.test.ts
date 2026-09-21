import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { reconcileOrphanedGradesAndSubjects } from '../utils/grade-reconciliation';
import {
    detectSchoolYearFromBackup,
    resolveBestSchoolProfile,
    validateRestoreBackup,
    prepareDataForRestore,
} from '../utils/backup-import';
import type { ComprehensiveBackup } from '../utils/backup-restore';

const filePath = 'C:/Users/Emerson/Downloads/FormEase_Snapshot_2026-2027_Automated_Backup_-_9_21_2026_2026-09-20 (1).json';
const fileName = 'FormEase_Snapshot_2026-2027_Automated_Backup_-_9_21_2026_2026-09-20 (1).json';
const hasSnapshot = fs.existsSync(filePath);

describe.skipIf(!hasSnapshot)('Client Snapshot Restore & Reconciliation Verification', () => {

    it('should verify the snapshot file exists and contains valid raw data', () => {
        expect(fs.existsSync(filePath)).toBe(true);

        const rawText = fs.readFileSync(filePath, 'utf8');
        const rawData = JSON.parse(rawText);

        expect(Array.isArray(rawData.students)).toBe(true);
        expect(rawData.students.length).toBe(145);
        expect(Array.isArray(rawData.sections)).toBe(true);
        expect(rawData.sections.length).toBe(4);
        expect(Array.isArray(rawData.subjects)).toBe(true);
        expect(rawData.subjects.length).toBe(231);
        expect(Array.isArray(rawData.classRecords)).toBe(true);
        expect(rawData.classRecords.length).toBe(183);
        expect(Array.isArray(rawData.gradingSheetRecords)).toBe(true);
        expect(rawData.gradingSheetRecords.length).toBe(183);
        expect(Array.isArray(rawData.schoolProfile)).toBe(true);
        expect(rawData.schoolProfile.length).toBe(2);
    });

    it('should correctly detect active school year from filename and records', () => {
        const rawText = fs.readFileSync(filePath, 'utf8');
        const rawData = JSON.parse(rawText);

        // 1. With filename
        const detectedWithFile = detectSchoolYearFromBackup(rawData, fileName);
        expect(detectedWithFile).toBe('2026-2027');

        // 2. Without filename (pure data inspection of classRecords/gradingSheetRecords)
        const detectedWithoutFile = detectSchoolYearFromBackup(rawData);
        expect(detectedWithoutFile).toBe('2026-2027');

        // 3. When activeSchoolYear is explicitly 'Unknown', it must ignore it and detect 2026-2027
        const corruptedData = { ...rawData, activeSchoolYear: 'Unknown' };
        const detectedFromCorrupted = detectSchoolYearFromBackup(corruptedData);
        expect(detectedFromCorrupted).toBe('2026-2027');
    });

    it('should accurately resolve the populated school profile over the blank dummy profile', () => {
        const rawText = fs.readFileSync(filePath, 'utf8');
        const rawData = JSON.parse(rawText);

        const best = resolveBestSchoolProfile(rawData.schoolProfile);
        expect(best).not.toBeNull();
        expect(best?.name).toBe('BELMONTE INTEGRATED SCHOOL');
        expect(best?.school_id).toBe('501368');
        expect(best?.section).toBe('Duterte');
        expect(best?.adviser_name).toBe('CHERRYLYN L. GUBATON');
        expect(best?.division).toBe('DAVAO DE ORO');
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
        expect(prepared.students).toHaveLength(145);
        expect(prepared.sections).toHaveLength(4);
        expect(prepared.subjects).toHaveLength(231);
        expect(prepared.classRecords).toHaveLength(183);
        expect(prepared.gradingSheetRecords).toHaveLength(183);
    });

    it('should reconcile orphaned grades and subjects preserving all 183 client grades', () => {
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
        expect(result.classRecords.length).toBe(183);
        expect(result.gradingSheetRecords.length).toBe(183);
        expect(result.deletedClassRecordIds || []).toHaveLength(0);
        expect(result.deletedGradingSheetRecordIds || []).toHaveLength(0);
    });
});

