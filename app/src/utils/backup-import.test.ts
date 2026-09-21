import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/database', () => ({
    db: {
        getAllRecords: vi.fn(),
        putRecord: vi.fn().mockResolvedValue('id'),
        putRecordsBulk: vi.fn().mockResolvedValue(undefined),
        clearStore: vi.fn().mockResolvedValue(undefined),
    },
}));

import { db } from '../services/database';
import { restoreBackupToFirestore, getInvalidGradeReferences } from './backup-import';
import type { ComprehensiveBackup } from './backup-restore';
import type { Student, ClassRecord } from '../types';

function createMockBackup(overrides: Partial<ComprehensiveBackup> = {}): ComprehensiveBackup {
    return {
        metadata: {
            exportDate: '2026-09-19T13:57:24.348Z',
            version: '2.0.0-local',
            exportedBy: 'Test',
            note: '',
            warning: '',
        },
        summary: {
            activeSchoolYear: '2026-2027',
            students: 2,
            studentProfiles: 2,
            sections: 1,
            subjects: 1,
            grades: 1,
            gradingSheetRecords: 0,
            observedValues: 0,
            hpsRecords: 0,
            sf2Sheets: 0,
            announcements: 0,
            schoolYears: 0,
            enrollments: 0,
            users: 0,
            systemSettings: 0,
            adviserAssignments: 0,
            gradingConfiguration: 0,
            attendanceRecords: 0,
            sf10Records: 0,
        },
        payload: {
            schoolProfile: {
                school_id: '300001',
                name: 'Test Academy',
                adviser_name: 'Teacher One',
                section: 'Alexandrite',
            },
            students: [
                { lrn: '105563160023', first_name: 'Mark', last_name: 'Tabelin' },
                { lrn: '120120170002', first_name: 'Jeffrey', last_name: 'Sta Ana' },
            ],
            sections: [
                { id: 'sec_1', section_name: 'Alexandrite', section_grade_level: 'Grade 10' },
            ],
            subjects: [
                { id: 'subj_1', subject_name: 'TLE', grade_level: 'Grade 10' },
            ],
            classRecords: [
                { id: 'grade_1', student_lrn: '105563160023', subject_id: 'subj_1', quarter: 1, final_grade: 85 },
            ],
            gradingSheetRecords: [],
            observedValues: [],
            hpsRecords: [],
            sf2Sheets: [],
            announcements: [],
            schoolYears: [],
            enrollments: [],
            attendanceRecords: [],
            users: [],
            systemSettings: {},
            adviserAssignments: [],
            gradingConfiguration: {},
            localStorageData: {
                'custom-setting': 'true',
            },
            activeSchoolYear: '2026-2027',
        },
        ...overrides,
    } as unknown as ComprehensiveBackup;
}

describe('restoreBackupToFirestore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('executes bulk replace strategy by clearing stores and calling putRecordsBulk', async () => {
        const backup = createMockBackup();
        const result = await restoreBackupToFirestore(backup, {
            strategy: 'replace',
            selectedItems: new Set(['schoolProfile', 'students', 'sections']),
        });

        expect(db.clearStore).toHaveBeenCalledWith('schoolProfile');
        expect(db.clearStore).toHaveBeenCalledWith('students');
        expect(db.clearStore).toHaveBeenCalledWith('sections');
        expect(db.putRecordsBulk).toHaveBeenCalledWith('students', expect.any(Array));
        expect(db.putRecordsBulk).toHaveBeenCalledWith('sections', expect.any(Array));
        expect(result.created).toBe(3); // 2 students + 1 section
        expect(result.updated).toBe(1); // 1 profile updated
        expect(result.issues).toHaveLength(0);
        expect(localStorage.getItem('activeSchoolYear')).toBe('2026-2027');
    });

    it('executes merge strategy without clearing stores', async () => {
        const backup = createMockBackup();
        const result = await restoreBackupToFirestore(backup, {
            strategy: 'merge',
            selectedItems: new Set(['students', 'sections']),
        });

        expect(db.clearStore).not.toHaveBeenCalled();
        expect(db.putRecordsBulk).toHaveBeenCalledWith('students', expect.any(Array));
        expect(db.putRecordsBulk).toHaveBeenCalledWith('sections', expect.any(Array));
        expect(result.updated).toBe(3); // 2 students + 1 section
        expect(result.issues).toHaveLength(0);
    });

    it('executes skip_existing strategy by filtering out existing keys', async () => {
        // Mock existing student '105563160023' already in DB
        vi.mocked(db.getAllRecords).mockImplementation(async (storeName) => {
            if (storeName === 'students') {
                return [{ lrn: '105563160023', first_name: 'Existing' }] as unknown as Student[];
            }
            return [];
        });

        const backup = createMockBackup();
        const result = await restoreBackupToFirestore(backup, {
            strategy: 'skip_existing',
            selectedItems: new Set(['students']),
        });

        expect(db.clearStore).not.toHaveBeenCalled();
        // Only 1 student should be inserted
        expect(db.putRecordsBulk).toHaveBeenCalledWith('students', [
            expect.objectContaining({ lrn: '120120170002' }),
        ]);
        expect(result.created).toBe(1);
        expect(result.skipped).toBe(1);
    });

    it('automatically ignores orphaned TEMP-* records but detects real missing student/subject references', () => {
        const backup = createMockBackup();
        // Add an orphaned temporary LRN (should be ignored/purged)
        // and a real missing 12-digit LRN (should trigger invalid reference)
        backup.payload.classRecords = [
            ...backup.payload.classRecords,
            {
                id: 'grade_temp',
                student_lrn: 'TEMP-1782282357421-316-12',
                subject_id: 'subj_1',
                school_year: '2026-2027',
                quarter: 1,
            } as unknown as ClassRecord,
            {
                id: 'grade_real_missing',
                student_lrn: '999999999999',
                subject_id: 'subj_1',
                school_year: '2026-2027',
                quarter: 1,
            } as unknown as ClassRecord,
        ];

        const invalid = getInvalidGradeReferences(backup);
        expect(invalid).toHaveLength(1);
        expect(invalid[0].studentLrn).toBe('999999999999');
        expect(invalid[0].missingStudent).toBe(true);
        expect(invalid[0].missingSubject).toBe(false);
    });
});
