import { describe, it, expect, vi } from 'vitest';
import { generateMasterExcelWorkbook, getMasterExcelBackupBuffer } from '../services/master-excel-backup';
import { computeSectionConsolidatedData, generateConsolidatedExcelBuffer, generateConsolidatedPDFBuffer } from '../services/consolidated-export-service';
import { generatePreUpdateSafetyVault } from '../services/pre-update-safety';
import type { ComprehensiveBackup } from '../utils/backup-restore';
import type { Student, Section, Subject, ClassRecord } from '../types';
import JSZip from 'jszip';

describe('Pre-Update Safety Vault & Master Excel Backup System', () => {
  const mockStudents: Student[] = [
    {
      id: 'student-1',
      lrn: '123456789012',
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      middle_name: 'Protacio',
      gender: 'Male',
      grade_level: '7',
      student_section: 'Rizal',
      status: 'Active',
      birthday: '2012-05-15',
      age: 14,
      address: 'Pangasinan'
    },
    {
      id: 'student-2',
      lrn: '123456789013',
      first_name: 'Maria',
      last_name: 'Clara',
      gender: 'Female',
      grade_level: '7',
      student_section: 'Rizal',
      status: 'Active',
      birthday: '2012-08-20',
      age: 14,
      address: 'Pangasinan'
    },
  ] as unknown as Student[];

  const mockSections: Section[] = [
    {
      id: 'sec-1',
      section_name: 'Rizal',
      name: 'Rizal',
      section_grade_level: '7',
      gradeLevel: '7',
      program: 'STE',
      room: 'Room 101',
      adviser_name: 'Teacher Juan',
      school_year: '2026-2027',
    },
  ] as unknown as Section[];

  const mockSubjects: Subject[] = [
    {
      id: 'subj-1',
      subject_name: 'Environmental Science & Research I',
      name: 'Environmental Science & Research I',
      subject_code: 'ENVSCI7',
      code: 'ENVSCI7',
      grade_level: '7',
      department: 'Science',
    },
    {
      id: 'subj-2',
      subject_name: 'Mathematics 7',
      name: 'Mathematics 7',
      subject_code: 'MATH7',
      code: 'MATH7',
      grade_level: '7',
      department: 'Mathematics',
    },
  ] as unknown as Subject[];

  const mockClassRecords: ClassRecord[] = [
    {
      id: 'cr-1',
      section_id: 'sec-1',
      subject_id: 'subj-1',
      quarter: 1,
      school_year: '2026-2027',
      grades: {
        'student-1': {
          quarterlyGrade: 89,
        },
        'student-2': {
          quarterlyGrade: 94,
        },
      },
    },
  ] as unknown as ClassRecord[];

  const mockBackup: ComprehensiveBackup = {
    metadata: {
      version: '1.2.0',
      timestamp: new Date().toISOString(),
      source: 'FormEase Portal Local Database',
      user: 'admin@school.deped.gov.ph',
    },
    summary: {
      activeSchoolYear: '2026-2027',
      students: 2,
      sections: 1,
      subjects: 2,
      enrollments: 2,
      grades: 1,
      gradingSheetRecords: 0,
      observedValues: 0,
      attendanceRecords: 0,
      sf2Sheets: 0,
      hpsRecords: 0,
      announcements: 0,
      schoolYears: 1,
      users: 1,
    },
    payload: {
      schoolProfile: {
        id: 'sch-1',
        name: 'National High School - STE Campus',
        schoolId: '300123',
        division: 'Pangasinan II',
        region: 'Region I',
        district: 'Binalonan',
        address: 'Binalonan, Pangasinan',
      },
      schoolYears: [{ id: 'sy-1', year: '2026-2027', isCurrent: true, semester: 1 }],
      activeSchoolYear: '2026-2027',
      enrollments: [],
      students: mockStudents,
      studentProfiles: mockStudents,
      sections: mockSections,
      subjects: mockSubjects,
      classRecords: mockClassRecords,
      gradingSheetRecords: [],
      observedValues: [],
      hpsRecords: [],
      sf2Sheets: [],
      announcements: [],
      attendanceRecords: [],
    },
  } as unknown as ComprehensiveBackup;

  it('generates a multi-tab Master Excel backup with DepEd styling', async () => {
    const workbook = await generateMasterExcelWorkbook(mockBackup);
    expect(workbook).toBeDefined();

    const expectedSheets = [
      'Overview & Summary',
      'Learners Directory',
      'Sections & Programs',
      'Subjects Directory',
      'Subject Class Records',
      'SF10 Overrides & Remarks',
      'Attendance Summary',
      'Observed Values',
    ];

    expectedSheets.forEach((sheetName) => {
      const sheet = workbook.getWorksheet(sheetName);
      expect(sheet, `Expected worksheet "${sheetName}" to exist in workbook`).toBeDefined();
    });

    const overviewSheet = workbook.getWorksheet('Overview & Summary');
    expect(overviewSheet?.rowCount).toBeGreaterThan(5);

    const buffer = await getMasterExcelBackupBuffer(mockBackup);
    expect(buffer).toBeDefined();
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it('computes section consolidated grades with Male/Female groups and General Average', () => {
    const data = computeSectionConsolidatedData(
      mockStudents,
      mockSubjects,
      mockClassRecords,
      '2026-2027'
    );

    expect(data.maleLearners.length).toBe(1);
    expect(data.femaleLearners.length).toBe(1);
    expect(data.maleLearners[0].student.last_name || (data.maleLearners[0].student as { lastName?: string }).lastName).toBe('Dela Cruz');
    expect(data.femaleLearners[0].student.last_name || (data.femaleLearners[0].student as { lastName?: string }).lastName).toBe('Clara');

    // Subject grades check
    const maleGrade = data.maleLearners[0].grades['subj-1'];
    expect(maleGrade).toBe(89);

    const femaleGrade = data.femaleLearners[0].grades['subj-1'];
    expect(femaleGrade).toBe(94);
  });

  it('generates consolidated grade sheets in Excel (.xlsx) format', async () => {
    const buffer = await generateConsolidatedExcelBuffer({
      section: mockSections[0],
      students: mockStudents,
      subjects: mockSubjects,
      classRecords: mockClassRecords,
      schoolYear: '2026-2027',
      schoolProfile: mockBackup.payload.schoolProfile,
    });

    expect(buffer).toBeDefined();
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it('generates consolidated grade sheets in Vector PDF (.pdf) format', async () => {
    const pdfBuffer = await generateConsolidatedPDFBuffer({
      section: mockSections[0],
      students: mockStudents,
      subjects: mockSubjects,
      classRecords: mockClassRecords,
      schoolYear: '2026-2027',
      schoolProfile: mockBackup.payload.schoolProfile,
    });

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.byteLength).toBeGreaterThan(500);

    // Verify PDF header magic bytes "%PDF-"
    const bytes = new Uint8Array(pdfBuffer);
    const headerStr = String.fromCharCode(...bytes.slice(0, 5));
    expect(headerStr).toBe('%PDF-');
  });

  it('orchestrates complete Pre-Update Safety Vault packaging into ZIP archive', async () => {
    const result = await generatePreUpdateSafetyVault({
      targetVersion: '1.2.0',
      customBackup: mockBackup,
      onProgress: vi.fn(),
    });

    expect(result.success).toBe(true);
    expect(result.zipFilename).toContain('FormEase_Safety_Vault_v1.2.0');
    expect(result.zipBuffer).toBeDefined();
    expect(result.zipBuffer!.byteLength).toBeGreaterThan(2000);

    // Unpack ZIP and verify required archive structure
    const zip = await JSZip.loadAsync(result.zipBuffer!);
    const filenames = Object.keys(zip.files);

    // 1. Must include Manifest
    expect(filenames).toContain('SAFETY_BACKUP_MANIFEST.txt');

    // 2. Must include System Restore JSON
    const hasJsonBackup = filenames.some(f => f.includes('FormEase_System_Restore') && f.endsWith('.json'));
    expect(hasJsonBackup).toBe(true);

    // 3. Must include Master Excel Backup
    const hasMasterExcel = filenames.some(f => f.includes('FormEase_Master_Database_Backup') && f.endsWith('.xlsx'));
    expect(hasMasterExcel).toBe(true);

    // 4. Must include Consolidated Grade PDF & Excel files
    const hasConsolidatedPdf = filenames.some(f => f.includes('Consolidated_Grades') && f.endsWith('.pdf'));
    const hasConsolidatedXlsx = filenames.some(f => f.includes('Consolidated_Grades') && f.endsWith('.xlsx'));
    expect(hasConsolidatedPdf).toBe(true);
    expect(hasConsolidatedXlsx).toBe(true);

    // 5. Must include E-Class Records directory index
    const hasEcrFolder = filenames.some(f => f.includes('04_E_Class_Records'));
    expect(hasEcrFolder).toBe(true);

    // Inspect manifest text
    const manifestFile = zip.file('SAFETY_BACKUP_MANIFEST.txt');
    const manifestText = await manifestFile?.async('string');
    expect(manifestText).toContain('FORMEASE PRO');
    expect(manifestText).toContain('SAFETY VAULT MANIFEST');
    expect(manifestText).toContain('Enrolled Learners: 2');
    expect(manifestText).toContain('Class Sections: 1');
  });
});
