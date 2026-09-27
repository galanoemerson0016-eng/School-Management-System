import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import * as XLSX from 'xlsx';
import { db } from './database';
import {
    getLiveDatabaseRecordCounts,
    exportDirectDatabaseToExcel,
    exportDirectDatabaseStoreToCSV,
    generateSafeExcelSheetName
} from './database-rescue-export';

vi.mock('xlsx', async () => {
    const actual = await vi.importActual<typeof import('xlsx')>('xlsx');
    return {
        ...actual,
        writeFile: vi.fn(),
    };
});

describe('Database Rescue & Direct Export Service', () => {
    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        await db.resetConnection();
        db.setDatabaseEncryptionKey(null);
        globalThis.indexedDB = new IDBFactory();
    });
    afterEach(async () => { vi.restoreAllMocks(); await db.resetConnection(); });

    it('rejects an incomplete rescue export when any source table cannot be read', async () => {
        vi.spyOn(db, 'getAllRecords').mockRejectedValue(new Error('synthetic database failure'));
        await expect(exportDirectDatabaseToExcel()).rejects.toThrow('synthetic database failure');
        expect(XLSX.writeFile).not.toHaveBeenCalled();
    });

    describe('generateSafeExcelSheetName', () => {
        it('should format standard grade, section, and subject into clean sheet name', () => {
            const existing = new Set<string>();
            const name = generateSafeExcelSheetName('Grade 7', 'Sampaguita', 'English', existing);
            expect(name).toBe('G7-Sampaguita_English');
            expect(name.length).toBeLessThanOrEqual(31);
        });

        it('should strictly limit length to <= 31 characters for long section and subject names', () => {
            const existing = new Set<string>();
            const name = generateSafeExcelSheetName(
                'Grade 11',
                'TechnicalVocationalLivelihoodTrackA',
                'Empowerment Technologies',
                existing
            );
            expect(name.length).toBeLessThanOrEqual(31);
            expect(name).toContain('G11');
        });

        it('should sanitize forbidden Excel characters: \\ / ? * [ ] :', () => {
            const existing = new Set<string>();
            const name = generateSafeExcelSheetName(
                'Grade 8',
                'Rizal [Section / 1] *Special*',
                'Music & Arts?',
                existing
            );
            expect(name.length).toBeLessThanOrEqual(31);
            expect(name).not.toMatch(/[/\\?*[\]:]/);
        });

        it('should resolve collisions with _2, _3 while never exceeding 31 characters', () => {
            const existing = new Set<string>();
            const name1 = generateSafeExcelSheetName('Grade 10', 'VeryLongSectionName2026', 'Mathematics', existing);
            const name2 = generateSafeExcelSheetName('Grade 10', 'VeryLongSectionName2026', 'Mathematics', existing);
            const name3 = generateSafeExcelSheetName('Grade 10', 'VeryLongSectionName2026', 'Mathematics', existing);

            expect(name1.length).toBeLessThanOrEqual(31);
            expect(name2.length).toBeLessThanOrEqual(31);
            expect(name3.length).toBeLessThanOrEqual(31);
            expect(name1).not.toBe(name2);
            expect(name2).not.toBe(name3);
            expect(name2.endsWith('_2')).toBe(true);
            expect(name3.endsWith('_3')).toBe(true);
        });

        it('should append quarter suffix if quarter > 1', () => {
            const existing = new Set<string>();
            const name = generateSafeExcelSheetName('Grade 9', 'Mabini', 'Science', existing, 2);
            expect(name).toBe('G9-Mabini_Science_Q2');
            expect(name.length).toBeLessThanOrEqual(31);
        });
    });

    it('should return live record counts directly from IndexedDB stores', async () => {
        const counts = await getLiveDatabaseRecordCounts();
        expect(counts).toBeDefined();
        expect(typeof counts.students).toBe('number');
        expect(typeof counts.sections).toBe('number');
        expect(typeof counts.subjects).toBe('number');
        expect(typeof counts.classRecords).toBe('number');
        expect(typeof counts.totalRecords).toBe('number');
        expect(typeof counts.hasData).toBe('boolean');
    });

    it('should package all available stores into multi-sheet Excel file', async () => {
        const result = await exportDirectDatabaseToExcel();
        expect(result.success).toBe(true);
        expect(typeof result.totalRecords).toBe('number');
        expect(result.breakdown).toBeDefined();
        expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should generate separate sheets per class and directory EVEN WHEN 0 grades are entered', async () => {
        // Mock sections, subjects, students present, but 0 class records
        const fakeSections = [{ id: 'sec-1', section_name: 'Sampaguita', section_grade_level: 'Grade 7' }];
        const fakeSubjects = [{ id: 'sub-1', subject_name: 'English', grade_level: 'Grade 7' }];
        const fakeStudents = [
            { lrn: '123456789001', last_name: 'Dela Cruz', first_name: 'Juan', gender: 'Male', student_section: 'sec-1' },
            { lrn: '123456789002', last_name: 'Santos', first_name: 'Maria', gender: 'Female', student_section: 'sec-1' }
        ];

        vi.spyOn(db, 'getAllRecords').mockImplementation(async (storeName: string) => {
            if (storeName === 'sections') return fakeSections as unknown as never;
            if (storeName === 'subjects') return fakeSubjects as unknown as never;
            if (storeName === 'students') return fakeStudents as unknown as never;
            if (storeName === 'classRecords' || storeName === 'gradingSheetRecords') return [];
            return [];
        });

        const result = await exportDirectDatabaseToExcel();
        expect(result.success).toBe(true);
        expect(result.breakdown['ECR_Classes_Directory']).toBe(1);
        expect(result.breakdown['G7-Sampaguita_English']).toBe(2);
        expect(result.breakdown['DepEd_EClass_Records']).toBeGreaterThan(0);
        expect(result.breakdown['Consolidated_Term_Grades']).toBeGreaterThan(0);
        expect(result.breakdown['SF2_Monthly_Totals_Summary']).toBeGreaterThan(0);
        expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should include Teacher Remarks from SF2 and Student Profiles in Teacher_Remarks_Masterlist', async () => {
        const fakeStudents = [
            { lrn: '123456789001', last_name: 'Reyes', first_name: 'Pedro', gender: 'Male', student_section: 'sec-1', remarks: 'Requires special seating near front.' }
        ];
        const fakeSf2Sheets = [
            {
                id: 'sec-1_2026-2027_JUNE',
                section_id: 'sec-1',
                month: 'JUNE',
                school_year: '2026-2027',
                date_labels: { 1: '2', 2: '3' },
                attendance: { '123456789001': { 1: 'absent' } },
                remarks: { '123456789001': 'Illness - Fever' }
            }
        ];

        vi.spyOn(db, 'getAllRecords').mockImplementation(async (storeName: string) => {
            if (storeName === 'students') return fakeStudents as unknown as never;
            if (storeName === 'sf2Sheets') return fakeSf2Sheets as unknown as never;
            if (storeName === 'sections') return [{ id: 'sec-1', section_name: 'Rizal', section_grade_level: 'Grade 8' }] as unknown as never;
            return [];
        });

        const result = await exportDirectDatabaseToExcel();
        expect(result.success).toBe(true);
        expect(result.breakdown['Teacher_Remarks_Masterlist']).toBeGreaterThanOrEqual(2);
    });

    it('should handle CSV export without throwing on empty or populated table', async () => {
        const count = await exportDirectDatabaseStoreToCSV('students');
        expect(typeof count).toBe('number');
    });

    it('should export announcements and users to CSV', async () => {
        const fakeAnnouncements = [
            { id: 'ann-1', announcement_title: 'School Assembly', announcement_content: 'General assembly at 8 AM', announcement_date: '2026-09-01' }
        ];
        const fakeUsers = [
            { uid: 'u-1', username: 'teacher1', displayName: 'Jane Teacher', email: 'jane@deped.gov.ph', primaryRole: 'Teacher' }
        ];

        vi.spyOn(db, 'getAllRecords').mockImplementation(async (storeName: string) => {
            if (storeName === 'announcements') return fakeAnnouncements as unknown as never;
            if (storeName === 'users') return fakeUsers as unknown as never;
            return [];
        });

        const annCount = await exportDirectDatabaseStoreToCSV('announcements');
        const userCount = await exportDirectDatabaseStoreToCSV('users');
        expect(annCount).toBe(1);
        expect(userCount).toBe(1);
    });

    it('should NEVER export activation_key, is_activated, or licensing fields in schoolProfile CSV', async () => {
        const fakeProfile = {
            school_id: '123456',
            name: 'Test School',
            region: 'Region III',
            division: 'Tarlac',
            district: 'Victoria',
            head_name: 'Principal',
            head_position: 'Principal I',
            activation_key: 'SECRET-KEY-1234-5678',
            is_activated: true,
            activated_at: '2026-01-01',
            subscription_end_date: '2027-01-01',
            is_trial: false
        };

        vi.spyOn(db, 'getAllRecords').mockResolvedValueOnce([fakeProfile] as unknown as never);

        let exportedCsv = '';
        const originalBlob = globalThis.Blob;
        globalThis.Blob = class MockBlob extends originalBlob {
            constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
                super(blobParts, options);
                if (blobParts && blobParts[0]) {
                    exportedCsv = String(blobParts[0]);
                }
            }
        };

        const count = await exportDirectDatabaseStoreToCSV('schoolProfile');
        expect(count).toBe(1);
        expect(exportedCsv).not.toContain('activation_key');
        expect(exportedCsv).not.toContain('SECRET-KEY-1234-5678');
        expect(exportedCsv).not.toContain('is_activated');
        expect(exportedCsv).not.toContain('subscription_end_date');
        expect(exportedCsv).toContain('School ID');
        expect(exportedCsv).toContain('Test School');

        globalThis.Blob = originalBlob;
    });

    it('should rescue orphaned HPS and student scores when subject IDs differ from active subjects (e.g. after re-templating)', async () => {
        // Active subject has a brand new ID
        const fakeSections = [{ id: 'sec-g7', section_name: 'Sampaguita', section_grade_level: 'Grade 7' }];
        const fakeSubjects = [{ id: 'subject-new-music-arts', subject_name: 'Music and Arts', grade_level: 'Grade 7' }];
        const fakeStudents = [
            { lrn: '123456789001', last_name: 'Dela Cruz', first_name: 'Juan', gender: 'Male', student_section: 'sec-g7' }
        ];

        // HPS and ClassRecord were saved under an old/deleted subject ID
        const fakeHps = [
            {
                id: 'hps_old_1',
                subject_id: 'subject-1725000000000-Grade-7-0-abcde',
                quarter: 1,
                section_id: 'sec-g7',
                written_works: [20, 20],
                performance_tasks: [30, 30]
            }
        ];
        const fakeClassRecords = [
            {
                id: 'cr_old_1',
                student_lrn: '123456789001',
                subject_id: 'subject-1725000000000-Grade-7-0-abcde',
                subject_name: 'Music and Arts',
                quarter: 1,
                section_id: 'sec-g7',
                written_works: [18, 19],
                performance_tasks: [28, 29],
                final_grade: 92
            }
        ];

        vi.spyOn(db, 'getAllRecords').mockImplementation(async (storeName: string) => {
            if (storeName === 'sections') return fakeSections as unknown as never;
            if (storeName === 'subjects') return fakeSubjects as unknown as never;
            if (storeName === 'students') return fakeStudents as unknown as never;
            if (storeName === 'hpsRecords') return fakeHps as unknown as never;
            if (storeName === 'classRecords') return fakeClassRecords as unknown as never;
            return [];
        });

        let capturedWorkbook: XLSX.WorkBook | null = null;
        vi.spyOn(XLSX, 'writeFile').mockImplementation(((wb: XLSX.WorkBook) => {
            capturedWorkbook = wb;
        }) as unknown as typeof XLSX.writeFile);

        const result = await exportDirectDatabaseToExcel();
        expect(result.success).toBe(true);
        expect(capturedWorkbook).toBeDefined();
        const wb = capturedWorkbook!;

        // Check the generated class sheet:
        // HPS should be found and student score should be populated
        const sheetName = Object.keys(wb.Sheets).find(k => k.includes('Music') || k.includes('G7'));
        expect(sheetName).toBeDefined();
        const sheet = wb.Sheets[sheetName!];
        expect(sheet).toBeDefined();

        // Verify sheet content has HPS and student score
        const csvContent = XLSX.utils.sheet_to_csv(sheet);
        expect(csvContent).toContain('HIGHEST POSSIBLE SCORE');
        expect(csvContent).toContain('20');
        expect(csvContent).toContain('DELA CRUZ, JUAN');
        expect(csvContent).toContain('92');
    });
});
