import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/database', () => ({
    isEncryptedDatabaseEnvelope: (r: unknown) => Boolean(r && typeof r === 'object' && 'is_encrypted' in r && 'iv' in r && 'ciphertext' in r),
    db: {
        getAllRecords: vi.fn(),
        putRecord: vi.fn().mockResolvedValue('id'),
        putRecordsBulk: vi.fn().mockResolvedValue(undefined),
        clearStore: vi.fn().mockResolvedValue(undefined),
        applyRestoreBatch: vi.fn().mockResolvedValue(undefined),
        resumePendingRestoreSettings: vi.fn().mockResolvedValue(false),
        _decryptRecord: vi.fn().mockImplementation((_store, r) => Promise.resolve(r)),
    },
}));

import { db } from '../services/database';
import { restoreBackupToFirestore, getInvalidGradeReferences, resolveBestSchoolProfile, prepareDataForRestore } from './backup-import';
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
        vi.mocked(db.resumePendingRestoreSettings).mockImplementation(async () => {
            const settings = vi.mocked(db.applyRestoreBatch).mock.lastCall?.[1] as Record<string, string> | undefined;
            for (const [key, value] of Object.entries(settings || {})) localStorage.setItem(key, value);
            return !!settings;
        });
    });

    it('stages selected replace collections for one database transaction', async () => {
        const backup = createMockBackup();
        const result = await restoreBackupToFirestore(backup, {
            strategy: 'replace',
            selectedItems: new Set(['schoolProfile', 'students', 'sections']),
        });

        expect(db.applyRestoreBatch).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ store: 'schoolProfile', replace: true }),
            expect.objectContaining({ store: 'students', replace: true, records: expect.any(Array) }),
            expect.objectContaining({ store: 'sections', replace: true, records: expect.any(Array) }),
        ]), expect.any(Object));
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
        expect(db.applyRestoreBatch).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ store: 'students', replace: false }),
            expect.objectContaining({ store: 'sections', replace: false }),
        ]), expect.any(Object));
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
        expect(db.applyRestoreBatch).toHaveBeenCalledWith([
            expect.objectContaining({ store: 'students', replace: false, records: [expect.objectContaining({ lrn: '120120170002' })] }),
        ], expect.any(Object));
        expect(result.created).toBe(1);
        expect(result.skipped).toBe(1);
    });

    it('clears every selected collection when Replace receives an empty backup collection', async () => {
        const backup = createMockBackup();
        backup.payload.students = [];
        backup.payload.sections = [];
        backup.payload.subjects = [];
        backup.payload.enrollments = [];
        backup.payload.classRecords = [];
        backup.payload.gradingSheetRecords = [];
        backup.payload.attendanceRecords = [];
        backup.payload.sf2Sheets = [];
        backup.payload.hpsRecords = [];
        backup.payload.observedValues = [];

        await restoreBackupToFirestore(backup, {
            strategy: 'replace',
            selectedItems: new Set([
                'students', 'sections', 'subjects', 'enrollments', 'classRecords',
                'gradingSheetRecords', 'attendanceRecords', 'sf2Sheets', 'hpsRecords', 'observedValues',
            ]),
        });

        for (const storeName of [
            'students', 'sections', 'subjects', 'enrollments', 'classRecords',
            'gradingSheetRecords', 'attendanceRecords', 'sf2Sheets', 'hpsRecords', 'observedValues',
        ]) {
            expect(db.applyRestoreBatch).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({ store: storeName, replace: true, records: [] }),
            ]), expect.any(Object));
        }
    });

    it('does not treat missing or placeholder school profiles as restorable data', async () => {
        expect(resolveBestSchoolProfile(undefined)).toBeNull();
        expect(resolveBestSchoolProfile({})).toBeNull();
        expect(resolveBestSchoolProfile({ name: 'School Name' })).toBeNull();
        expect(resolveBestSchoolProfile({ school_id: '300001' })).toBeNull();

        expect(resolveBestSchoolProfile([
            { name: 'School Name', school_id: '300001' },
            { school_name: 'FORMEASE TEST INTEGRATED SCHOOL', school_id: '999999', division: 'Test Division' },
        ])).toMatchObject({ school_id: '999999' });
    });

    it('leaves the current school profile untouched when Replace has no valid source profile', async () => {
        const backup = createMockBackup();
        backup.payload.schoolProfile = {} as never;

        await expect(restoreBackupToFirestore(backup, {
            strategy: 'replace',
            selectedItems: new Set(['schoolProfile']),
        })).rejects.toThrow('no restorable data');

        expect(db.clearStore).not.toHaveBeenCalledWith('schoolProfile');
        expect(db.putRecord).not.toHaveBeenCalledWith('schoolProfile', expect.anything());
    });

    it('preserves and reports orphaned TEMP-* grades alongside other missing references', () => {
        const backup = createMockBackup();
        // Temporary identifiers can still belong to genuine teacher grades.
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
        expect(invalid).toHaveLength(2);
        expect(invalid.map(ref => ref.studentLrn)).toEqual(['TEMP-1782282357421-316-12', '999999999999']);
        expect(invalid.every(ref => ref.missingStudent && !ref.missingSubject)).toBe(true);
        expect(prepareDataForRestore(backup).classRecords.map(record => record.id)).toContain('grade_temp');
    });
});
