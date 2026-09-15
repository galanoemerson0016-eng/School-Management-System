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

  it('generates individual E-Class Record vector PDF (.pdf) format', async () => {
    const { generateECRPDFBuffer } = await import('../services/ecr-pdf-export-service');
    const pdfBuffer = await generateECRPDFBuffer({
      section: mockSections[0],
      subject: mockSubjects[0],
      students: mockStudents,
      classRecords: mockClassRecords,
      schoolYear: '2026-2027',
      schoolProfile: mockBackup.payload.schoolProfile as any,
      quarter: 1
    });

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.byteLength).toBeGreaterThan(500);
    const headerStr = String.fromCharCode(...new Uint8Array(pdfBuffer).slice(0, 5));
    expect(headerStr).toBe('%PDF-');
  });

  it('generates school forms (SF2, SF5, SF6, SF9) in Excel and PDF formats', async () => {
    const {
      generateSF2PDFBuffer,
      generateSF2ExcelBuffer,
      generateSF5PDFBuffer,
      generateSF5ExcelBuffer,
      generateSF6PDFBuffer,
      generateSF6ExcelBuffer,
      generateSF9SectionMasterExcelBuffer,
      generateSF9SectionMasterPDFBuffer
    } = await import('../services/school-forms-vault-service');

    // SF2
    const sf2Pdf = await generateSF2PDFBuffer({
      section: mockSections[0],
      students: mockStudents,
      schoolYear: '2026-2027',
      month: 'August',
      schoolProfile: mockBackup.payload.schoolProfile as any
    });
    expect(sf2Pdf).toBeDefined();
    expect(String.fromCharCode(...new Uint8Array(sf2Pdf).slice(0, 5))).toBe('%PDF-');

    const sf2Xlsx = await generateSF2ExcelBuffer({
      section: mockSections[0],
      students: mockStudents,
      schoolYear: '2026-2027',
      month: 'August',
      schoolProfile: mockBackup.payload.schoolProfile as any
    });
    expect(sf2Xlsx).toBeDefined();
    expect(sf2Xlsx.byteLength).toBeGreaterThan(500);

    // SF5
    const sf5Pdf = await generateSF5PDFBuffer({
      section: mockSections[0],
      students: mockStudents,
      subjects: mockSubjects,
      classRecords: mockClassRecords,
      schoolYear: '2026-2027',
      schoolProfile: mockBackup.payload.schoolProfile as any
    });
    expect(sf5Pdf).toBeDefined();
    expect(String.fromCharCode(...new Uint8Array(sf5Pdf).slice(0, 5))).toBe('%PDF-');

    const sf5Xlsx = await generateSF5ExcelBuffer({
      section: mockSections[0],
      students: mockStudents,
      subjects: mockSubjects,
      classRecords: mockClassRecords,
      schoolYear: '2026-2027',
      schoolProfile: mockBackup.payload.schoolProfile as any
    });
    expect(sf5Xlsx).toBeDefined();
    expect(sf5Xlsx.byteLength).toBeGreaterThan(500);

    // SF6
    const sf6Pdf = await generateSF6PDFBuffer({
      sections: mockSections,
      students: mockStudents,
      subjects: mockSubjects,
      classRecords: mockClassRecords,
      schoolYear: '2026-2027',
      schoolProfile: mockBackup.payload.schoolProfile as any
    });
    expect(sf6Pdf).toBeDefined();
    expect(String.fromCharCode(...new Uint8Array(sf6Pdf).slice(0, 5))).toBe('%PDF-');

    const sf6Xlsx = await generateSF6ExcelBuffer({
      sections: mockSections,
      students: mockStudents,
      subjects: mockSubjects,
      classRecords: mockClassRecords,
      schoolYear: '2026-2027',
      schoolProfile: mockBackup.payload.schoolProfile as any
    });
    expect(sf6Xlsx).toBeDefined();
    expect(sf6Xlsx.byteLength).toBeGreaterThan(500);

    // SF9
    const sf9Xlsx = await generateSF9SectionMasterExcelBuffer({
      section: mockSections[0],
      students: mockStudents,
      subjects: mockSubjects,
      classRecords: mockClassRecords,
      schoolYear: '2026-2027',
      schoolProfile: mockBackup.payload.schoolProfile as any
    });
    expect(sf9Xlsx).toBeDefined();
    expect(sf9Xlsx.byteLength).toBeGreaterThan(500);

    const sf9Pdf = await generateSF9SectionMasterPDFBuffer({
      section: mockSections[0],
      students: mockStudents,
      subjects: mockSubjects,
      classRecords: mockClassRecords,
      schoolYear: '2026-2027',
      schoolProfile: mockBackup.payload.schoolProfile as any
    });
    expect(sf9Pdf).toBeDefined();
    expect(String.fromCharCode(...new Uint8Array(sf9Pdf).slice(0, 5))).toBe('%PDF-');
  });

  it('orchestrates complete Pre-Update Safety Vault packaging into ZIP archive', async () => {
    const progressUpdates: string[] = [];
    const result = await generatePreUpdateSafetyVault({
      targetVersion: '1.2.0',
      customBackup: mockBackup,
      onProgress: (status) => progressUpdates.push(status),
    });

    expect(result.success).toBe(true);
    expect(result.zipFilename).toContain('FormEase_Safety_Vault_v1.2.0');
    expect(result.zipBuffer).toBeDefined();
    expect(result.zipBuffer!.byteLength).toBeGreaterThan(2000);
    expect(progressUpdates.length).toBeGreaterThan(5);

    // Unpack ZIP and verify required archive structure
    const zip = await JSZip.loadAsync(result.zipBuffer!);
    const filenames = Object.keys(zip.files);

    // 1. Must include Manifest
    expect(filenames).toContain('SAFETY_BACKUP_MANIFEST.txt');

    // 0. Must include Official DepEd Blank Templates in 00_Official_DepEd_Blank_Templates/
    const hasBlankTemplatesFolder = filenames.some(f => f.includes('00_Official_DepEd_Blank_Templates'));
    const hasEcrBlankTemplates = filenames.some(f => f.includes('01_E_Class_Record_Templates') && f.endsWith('.xlsx'));
    const hasSf2BlankTemplates = filenames.some(f => f.includes('02_School_Forms_SF2_Templates') && f.endsWith('.xlsx'));
    const hasSf9BlankTemplates = filenames.some(f => f.includes('03_School_Forms_SF9_Templates') && f.endsWith('.xlsx'));
    const hasPaceBlankTemplates = filenames.some(f => f.includes('04_PACE_Form_Templates') && f.endsWith('.xlsx'));
    const hasGmBlankTemplates = filenames.some(f => f.includes('05_Grade_Management_Templates') && f.endsWith('.xlsx'));

    expect(hasBlankTemplatesFolder).toBe(true);
    expect(hasEcrBlankTemplates).toBe(true);
    expect(hasSf2BlankTemplates).toBe(true);
    expect(hasSf9BlankTemplates).toBe(true);
    expect(hasPaceBlankTemplates).toBe(true);
    expect(hasGmBlankTemplates).toBe(true);

    // 2. Must include System Restore JSON in 01_Full_System_Restore_JSON/
    const hasJsonBackup = filenames.some(f => f.includes('01_Full_System_Restore_JSON') && f.endsWith('.json'));
    expect(hasJsonBackup).toBe(true);

    // 3. Must include Master Excel Backup in 02_Master_Excel_Database/
    const hasMasterExcel = filenames.some(f => f.includes('02_Master_Excel_Database') && f.endsWith('.xlsx'));
    expect(hasMasterExcel).toBe(true);

    // 4. Must include Individual E-Class Records Excel in 03_E_Class_Records_Excel/
    const hasEcrExcel = filenames.some(f => f.includes('03_E_Class_Records_Excel') && f.includes('ECR_') && f.endsWith('.xlsx'));
    expect(hasEcrExcel).toBe(true);

    // 5. Must include Individual E-Class Records PDF in 04_E_Class_Records_PDF/
    const hasEcrPdf = filenames.some(f => f.includes('04_E_Class_Records_PDF') && f.includes('ECR_') && f.endsWith('.pdf'));
    expect(hasEcrPdf).toBe(true);

    // 6. Must include Grade Management Excel for all terms in 05_Grade_Management_Excel/
    const hasGmExcelTerm1 = filenames.some(f => f.includes('05_Grade_Management_Excel') && f.includes('Term_1') && f.endsWith('.xlsx'));
    const hasGmExcelTerm2 = filenames.some(f => f.includes('05_Grade_Management_Excel') && f.includes('Term_2') && f.endsWith('.xlsx'));
    const hasGmExcelTerm3 = filenames.some(f => f.includes('05_Grade_Management_Excel') && f.includes('Term_3') && f.endsWith('.xlsx'));
    const hasGmExcelFinal = filenames.some(f => f.includes('05_Grade_Management_Excel') && f.includes('Final_Summary') && f.endsWith('.xlsx'));
    const hasGmGradingTemplate = filenames.some(f => f.includes('05_Grade_Management_Excel') && f.includes('Grading_Template_') && f.endsWith('.xlsx'));
    expect(hasGmExcelTerm1).toBe(true);
    expect(hasGmExcelTerm2).toBe(true);
    expect(hasGmExcelTerm3).toBe(true);
    expect(hasGmExcelFinal).toBe(true);
    expect(hasGmGradingTemplate).toBe(true);

    // 7. Must include Grade Management PDF for all terms in 06_Grade_Management_PDF/
    const hasGmPdfTerm1 = filenames.some(f => f.includes('06_Grade_Management_PDF') && f.includes('Term_1') && f.endsWith('.pdf'));
    const hasGmPdfTerm2 = filenames.some(f => f.includes('06_Grade_Management_PDF') && f.includes('Term_2') && f.endsWith('.pdf'));
    const hasGmPdfTerm3 = filenames.some(f => f.includes('06_Grade_Management_PDF') && f.includes('Term_3') && f.endsWith('.pdf'));
    const hasGmPdfFinal = filenames.some(f => f.includes('06_Grade_Management_PDF') && f.includes('Final_Summary') && f.endsWith('.pdf'));
    expect(hasGmPdfTerm1).toBe(true);
    expect(hasGmPdfTerm2).toBe(true);
    expect(hasGmPdfTerm3).toBe(true);
    expect(hasGmPdfFinal).toBe(true);

    // 8. Must include SF2 Attendance (Excel & PDF) in 07_School_Forms_SF2_Attendance/
    const hasSf2Pdf = filenames.some(f => f.includes('07_School_Forms_SF2_Attendance') && f.endsWith('.pdf'));
    const hasSf2Xlsx = filenames.some(f => f.includes('07_School_Forms_SF2_Attendance') && f.endsWith('.xlsx'));
    expect(hasSf2Pdf).toBe(true);
    expect(hasSf2Xlsx).toBe(true);

    // 9. Must include SF5 Promotion (Excel & PDF) in 08_School_Forms_SF5_Promotion/
    const hasSf5Pdf = filenames.some(f => f.includes('08_School_Forms_SF5_Promotion') && f.endsWith('.pdf'));
    const hasSf5Xlsx = filenames.some(f => f.includes('08_School_Forms_SF5_Promotion') && f.endsWith('.xlsx'));
    expect(hasSf5Pdf).toBe(true);
    expect(hasSf5Xlsx).toBe(true);

    // 10. Must include SF6 Summary (Excel & PDF) in 09_School_Forms_SF6_Summary/
    const hasSf6Pdf = filenames.some(f => f.includes('09_School_Forms_SF6_Summary') && f.endsWith('.pdf'));
    const hasSf6Xlsx = filenames.some(f => f.includes('09_School_Forms_SF6_Summary') && f.endsWith('.xlsx'));
    expect(hasSf6Pdf).toBe(true);
    expect(hasSf6Xlsx).toBe(true);

    // 11. Must include SF9 Report Cards (Excel & PDF) in 10_School_Forms_SF9_Report_Cards/
    const hasSf9Pdf = filenames.some(f => f.includes('10_School_Forms_SF9_Report_Cards') && f.endsWith('.pdf'));
    const hasSf9Xlsx = filenames.some(f => f.includes('10_School_Forms_SF9_Report_Cards') && f.endsWith('.xlsx'));
    expect(hasSf9Pdf).toBe(true);
    expect(hasSf9Xlsx).toBe(true);

    // Inspect manifest text
    const manifestFile = zip.file('SAFETY_BACKUP_MANIFEST.txt');
    const manifestText = await manifestFile?.async('string');
    expect(manifestText).toContain('FORMEASE PRO');
    expect(manifestText).toContain('SAFETY VAULT MANIFEST');
    expect(manifestText).toContain('Official Blank Templates:');
    expect(manifestText).toContain('Enrolled Learners: 2');
    expect(manifestText).toContain('Class Sections: 1');
    expect(manifestText).toContain('Curriculum Subjects: 2');
    expect(manifestText).toContain('00_Official_DepEd_Blank_Templates');
    expect(manifestText).toContain('01_Full_System_Restore_JSON');
    expect(manifestText).toContain('02_Master_Excel_Database');
    expect(manifestText).toContain('03_E_Class_Records_Excel');
    expect(manifestText).toContain('04_E_Class_Records_PDF');
    expect(manifestText).toContain('05_Grade_Management_Excel');
    expect(manifestText).toContain('06_Grade_Management_PDF');
    expect(manifestText).toContain('07_School_Forms_SF2_Attendance');
    expect(manifestText).toContain('08_School_Forms_SF5_Promotion');
    expect(manifestText).toContain('09_School_Forms_SF6_Summary');
    expect(manifestText).toContain('10_School_Forms_SF9_Report_Cards');
  });
});
