import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {
  isGrade2To10,
  getECRTemplateType,
  getECRTemplateFilename,
  normalizeSubjectForECR,
  normalizeRegionForECR,
  normalizeGradeLevelForECR,
  populateECRWorkbookZip,
  TEMPLATE_ACADEMIC,
  TEMPLATE_GMRC_VE,
  TEMPLATE_EPP_TLE,
  TEMPLATE_MAPEH
} from './ecr-excel-export';
import type { Section, Subject, Student, SchoolProfile, ClassRecord, HPSRecord } from '../types';

describe('ECR Excel Export Service', () => {
  describe('Grade Level & Classifier Helpers', () => {
    it('correctly identifies valid Grades 2-10', () => {
      expect(isGrade2To10('Grade 2')).toBe(true);
      expect(isGrade2To10('Grade 7')).toBe(true);
      expect(isGrade2To10('Grade 10')).toBe(true);
      expect(isGrade2To10('7')).toBe(true);

      expect(isGrade2To10('Kindergarten')).toBe(false);
      expect(isGrade2To10('Grade 1')).toBe(false);
      expect(isGrade2To10('Grade 11')).toBe(false);
      expect(isGrade2To10('Grade 12')).toBe(false);
      expect(isGrade2To10('')).toBe(false);
    });

    it('classifies subjects into academic, gmrc_ve, epp_tle, and mapeh', () => {
      // Academic
      expect(getECRTemplateType('Science', 'Grade 7')).toBe('academic');
      expect(getECRTemplateType('Mathematics', 'Grade 4')).toBe('academic');
      expect(getECRTemplateType('English', 'Grade 8')).toBe('academic');
      expect(getECRTemplateType('Filipino', 'Grade 9')).toBe('academic');
      expect(getECRTemplateType('Araling Panlipunan', 'Grade 10')).toBe('academic');

      // GMRC & Values Education
      expect(getECRTemplateType('GMRC', 'Grade 4')).toBe('gmrc_ve');
      expect(getECRTemplateType('Values Education', 'Grade 7')).toBe('gmrc_ve');
      expect(getECRTemplateType('Edukasyon sa Pagpapakatao', 'Grade 8')).toBe('gmrc_ve');
      expect(getECRTemplateType('EsP', 'Grade 9')).toBe('gmrc_ve');

      // EPP / TLE
      expect(getECRTemplateType('EPP', 'Grade 4')).toBe('epp_tle');
      expect(getECRTemplateType('TLE', 'Grade 7')).toBe('epp_tle');
      expect(getECRTemplateType('Technology and Livelihood Education', 'Grade 8')).toBe('epp_tle');

      // MAPEH
      expect(getECRTemplateType('MAPEH', 'Grade 7')).toBe('mapeh');
      expect(getECRTemplateType('Music and Arts', 'Grade 7')).toBe('mapeh');
      expect(getECRTemplateType('Physical Education and Health', 'Grade 7')).toBe('mapeh');
      expect(getECRTemplateType('PE and Health', 'Grade 4')).toBe('mapeh');
    });

    it('returns official template filenames per subject category', () => {
      expect(getECRTemplateFilename('Science', 'Grade 7')).toBe(TEMPLATE_ACADEMIC);
      expect(getECRTemplateFilename('GMRC', 'Grade 4')).toBe(TEMPLATE_GMRC_VE);
      expect(getECRTemplateFilename('Values Education', 'Grade 8')).toBe(TEMPLATE_GMRC_VE);
      expect(getECRTemplateFilename('EPP', 'Grade 5')).toBe(TEMPLATE_EPP_TLE);
      expect(getECRTemplateFilename('TLE', 'Grade 8')).toBe(TEMPLATE_EPP_TLE);
      expect(getECRTemplateFilename('Music and Arts', 'Grade 7')).toBe(TEMPLATE_MAPEH);
      expect(getECRTemplateFilename('MAPEH', 'Grade 7')).toBe(TEMPLATE_MAPEH);
    });
  });

  describe('Subject Normalization for E24 Data Validation', () => {
    it('normalizes academic subjects to match official dropdown options', () => {
      expect(normalizeSubjectForECR('Science 7', 'academic', 'Grade 7')).toBe('Science');
      expect(normalizeSubjectForECR('Math', 'academic', 'Grade 4')).toBe('Mathematics');
      expect(normalizeSubjectForECR('AP', 'academic', 'Grade 8')).toBe('Araling Panlipunan');
      expect(normalizeSubjectForECR('Filipino 9', 'academic', 'Grade 9')).toBe('Filipino');
    });

    it('normalizes GMRC and Values Education dropdown options (E24: GMRC, Values Education)', () => {
      expect(normalizeSubjectForECR('GMRC', 'gmrc_ve', 'Grade 4')).toBe('GMRC');
      expect(normalizeSubjectForECR('Values Education', 'gmrc_ve', 'Grade 7')).toBe('Values Education');
      expect(normalizeSubjectForECR('Good Manners and Right Conduct', 'gmrc_ve', 'Grade 5')).toBe('GMRC');
      expect(normalizeSubjectForECR('EsP', 'gmrc_ve', 'Grade 8')).toBe('Values Education');
    });

    it('normalizes EPP and TLE dropdown values', () => {
      expect(normalizeSubjectForECR('EPP', 'epp_tle', 'Grade 5')).toBe('EPP/TLE');
      expect(normalizeSubjectForECR('TLE', 'epp_tle', 'Grade 7')).toBe('TLE');
      expect(normalizeSubjectForECR('Technology and Livelihood Education', 'epp_tle', 'Grade 8')).toBe('TLE');
    });

    it('normalizes MAPEH subject name to MAPEH', () => {
      expect(normalizeSubjectForECR('Music and Arts', 'mapeh', 'Grade 7')).toBe('MAPEH');
      expect(normalizeSubjectForECR('Physical Education and Health', 'mapeh', 'Grade 7')).toBe('MAPEH');
      expect(normalizeSubjectForECR('MAPEH', 'mapeh', 'Grade 7')).toBe('MAPEH');
    });

    it('normalizes regions and grade levels correctly', () => {
      expect(normalizeRegionForECR('Region 4A')).toBe('Region IV-A');
      expect(normalizeRegionForECR('NCR')).toBe('NCR');
      expect(normalizeGradeLevelForECR('Grade 7')).toBe('7');
      expect(normalizeGradeLevelForECR('Grade 4')).toBe('4');
    });
  });

  describe('Template Population and OpenXML Integrity', () => {
    const templatesDir = path.join(__dirname, '../../public/templates');

    const mockSchoolProfile: SchoolProfile = {
      school_id: '123456',
      name: 'Mabini National High School',
      region: 'Region IV-A',
      division: 'Cavite',
      district: 'District 1',
      head_name: 'Dr. Maria Santos',
      head_position: 'Principal IV',
      grade_levels_offered: 'Grades 7-10',
      adviser_name: 'Mr. Juan Dela Cruz'
    };

    const mockSection: Section = {
      id: 'sec-7a',
      section_name: 'Diamond',
      section_grade_level: 'Grade 7',
      adviser_name: 'Mr. Juan Dela Cruz'
    };

    const mockStudents: Student[] = [
      {
        lrn: '100000000001',
        first_name: 'Juan',
        last_name: 'Dela Cruz',
        gender: 'Male',
        student_section: 'sec-7a',
        birthday: '2010-01-01',
        age: 16,
        address: 'Cavite',
        grade_level: 'Grade 7'
      },
      {
        lrn: '100000000002',
        first_name: 'Maria',
        last_name: 'Clara',
        gender: 'Female',
        student_section: 'sec-7a',
        birthday: '2010-02-02',
        age: 16,
        address: 'Cavite',
        grade_level: 'Grade 7'
      }
    ];

    it('populates EPP/TLE template with valid OpenXML structure', async () => {
      const templatePath = path.join(templatesDir, TEMPLATE_EPP_TLE);
      if (!fs.existsSync(templatePath)) return;

      const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));
      const tleSubject: Subject = { id: 'sub-tle', subject_name: 'TLE', grade_level: 'Grade 7' };

      const mockClassRecords: ClassRecord[] = [
        {
          id: 'cr-1',
          student_lrn: '100000000001',
          subject_id: 'sub-tle',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20, 20, 20, 20],
          performance_tasks: [50, 50, 50],
          quarterly_exam: 40
        }
      ];

      const mockHpsRecords: HPSRecord[] = [
        {
          id: 'hps-1',
          subject_id: 'sub-tle',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [25, 25, 25, 25, 25],
          performance_tasks: [50, 50, 50],
          quarterly_exam: 50
        }
      ];

      const zip = await populateECRWorkbookZip(templateBuffer, {
        schoolProfile: mockSchoolProfile,
        schoolYear: '2026-2027',
        section: mockSection,
        subject: tleSubject,
        students: mockStudents,
        classRecords: mockClassRecords,
        hpsRecords: mockHpsRecords
      });

      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')!.async('text');
      expect(sheet1Xml).toContain('MABINI NATIONAL HIGH SCHOOL');
      expect(sheet1Xml).toContain('TLE');
      expect(sheet1Xml).toContain('DELA CRUZ, JUAN');
      expect(sheet1Xml).toContain('CLARA, MARIA');

      const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
      // Verify HPS scores populated in row 15
      expect(sheet2Xml).toContain('r="F15"');
      expect(sheet2Xml).toContain('<v>25</v>');

      // Verify calculation property enabled
      const wbXml = await zip.file('xl/workbook.xml')!.async('text');
      expect(wbXml).toContain('fullCalcOnLoad="1"');
    });

    it('populates MAPEH 9-sheet template with dual components', async () => {
      const templatePath = path.join(templatesDir, TEMPLATE_MAPEH);
      if (!fs.existsSync(templatePath)) return;

      const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));
      const mapehSubject: Subject = { id: 'sub-mapeh', subject_name: 'MAPEH', grade_level: 'Grade 7' };
      const maSubject: Subject = { id: 'sub-ma', subject_name: 'Music and Arts', grade_level: 'Grade 7' };
      const peSubject: Subject = { id: 'sub-pe', subject_name: 'Physical Education and Health', grade_level: 'Grade 7' };

      const mockClassRecords: ClassRecord[] = [
        {
          id: 'cr-ma-1',
          student_lrn: '100000000001',
          subject_id: 'sub-ma',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [18, 19, 20, 18, 19],
          performance_tasks: [45, 48, 47],
          quarterly_exam: 42
        },
        {
          id: 'cr-pe-1',
          student_lrn: '100000000001',
          subject_id: 'sub-pe',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20, 20, 20, 20],
          performance_tasks: [50, 50, 50],
          quarterly_exam: 45
        }
      ];

      const mockHpsRecords: HPSRecord[] = [
        {
          id: 'hps-ma-1',
          subject_id: 'sub-ma',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20, 20, 20, 20],
          performance_tasks: [50, 50, 50],
          quarterly_exam: 50
        },
        {
          id: 'hps-pe-1',
          subject_id: 'sub-pe',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20, 20, 20, 20],
          performance_tasks: [50, 50, 50],
          quarterly_exam: 50
        }
      ];

      const zip = await populateECRWorkbookZip(templateBuffer, {
        schoolProfile: mockSchoolProfile,
        schoolYear: '2026-2027',
        section: mockSection,
        subject: mapehSubject,
        allSubjects: [maSubject, peSubject],
        students: mockStudents,
        classRecords: mockClassRecords,
        hpsRecords: mockHpsRecords
      });

      // Sheet 1: Input Data
      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')!.async('text');
      expect(sheet1Xml).toContain('MAPEH');

      // Sheet 2: Term 1 Music and Arts
      const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
      expect(sheet2Xml).toContain('<v>18</v>');

      // Sheet 3: Term 1 PE and Health
      const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
      expect(sheet3Xml).toContain('<v>50</v>');

      // Check that all 9 sheets are preserved in workbook
      expect(zip.file('xl/worksheets/sheet8.xml')).not.toBeNull();
      expect(zip.file('xl/worksheets/sheet9.xml')).not.toBeNull();
    });

    it('populates GMRC & Values Education template with 10 WWs, 9 PTs, and Examinations', async () => {
      const templatePath = path.join(templatesDir, TEMPLATE_GMRC_VE);
      if (!fs.existsSync(templatePath)) return;

      const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));
      const gmrcSubject: Subject = { id: 'sub-gmrc', subject_name: 'Values Education', grade_level: 'Grade 7' };

      const mockClassRecords: ClassRecord[] = [
        {
          id: 'cr-gmrc-1',
          student_lrn: '100000000001',
          subject_id: 'sub-gmrc',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [10, 10, 10, '', '', 10, 10, 10, '', ''], // 5 Cog + 5 Aff
          performance_tasks: [30, 30, 30, 30, 30, 30, 30, 30, 30], // 3 Cog + 3 Aff + 3 Beh
          quarterly_exam: 50
        }
      ];

      const mockHpsRecords: HPSRecord[] = [
        {
          id: 'hps-gmrc-1',
          subject_id: 'sub-gmrc',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [10, 10, 10, '', '', 10, 10, 10, '', ''],
          performance_tasks: [50, 50, 50, 50, 50, 50, 50, 50, 50],
          quarterly_exam: 50
        }
      ];

      const zip = await populateECRWorkbookZip(templateBuffer, {
        schoolProfile: mockSchoolProfile,
        schoolYear: '2026-2027',
        section: mockSection,
        subject: gmrcSubject,
        students: mockStudents,
        classRecords: mockClassRecords,
        hpsRecords: mockHpsRecords
      });

      // Sheet 1: Input Data
      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')!.async('text');
      expect(sheet1Xml).toContain('Values Education');

      // Sheet 2: Term 1
      const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
      // HPS in row 16: WW Cog F16=10, WW Aff N16=10, PT Cog V16=50, PT Aff AB16=50, PT Beh AH16=50, ST1 AN16=25
      expect(sheet2Xml).toContain('r="F16"');
      expect(sheet2Xml).toContain('r="N16"');
      expect(sheet2Xml).toContain('r="V16"');
      expect(sheet2Xml).toContain('r="AB16"');
      expect(sheet2Xml).toContain('r="AH16"');
      expect(sheet2Xml).toContain('r="AN16"');

      // Student 1 in row 19:
      expect(sheet2Xml).toContain('r="F19"');
      expect(sheet2Xml).toContain('r="N19"');
      expect(sheet2Xml).toContain('r="V19"');
      expect(sheet2Xml).toContain('r="AB19"');
      expect(sheet2Xml).toContain('r="AH19"');
      expect(sheet2Xml).toContain('r="AN19"');
    });
  });
});
