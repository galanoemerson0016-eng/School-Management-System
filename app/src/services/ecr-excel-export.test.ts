import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
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
  TEMPLATE_EPP_TLE_COMPONENTS,
  TEMPLATE_MAPEH,
  TEMPLATE_SPFL,
  TEMPLATE_SPJ,
  TEMPLATE_SPA,
  TEMPLATE_SPS,
  TEMPLATE_SPTVE,
  TEMPLATE_SSES_SPSTEM,
  isSpflSubject,
  isSpjSubject,
  isSpaSubject,
  isSpsSubject,
  isSptveSubject,
  isSsesSpstemSubject,
  SPFL_SUBJECTS,
  SPTVE_SUBJECTS,
  SSES_SPSTEM_SUBJECTS,
  isIctComponent,
  isAfaComponent,
  isFcsComponent,
  isIaComponent,
  isEppTleComponent
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

      // Special Program in Foreign Language (SPFL)
      expect(isSpflSubject('Special Program in Foreign Language - Spanish')).toBe(true);
      expect(isSpflSubject('Special Program in Foreign Language - Japanese')).toBe(true);
      expect(isSpflSubject('Special Program in Foreign Language - French')).toBe(true);
      expect(isSpflSubject('Special Program in Foreign Language - German')).toBe(true);
      expect(isSpflSubject('Special Program in Foreign Language - Chinese')).toBe(true);
      expect(isSpflSubject('Special Program in Foreign Language - Korean')).toBe(true);
      expect(isSpflSubject('SPFL - Spanish')).toBe(true);
      expect(isSpflSubject('SPFL - Japanese (Nihongo)')).toBe(true);
      expect(isSpflSubject('SPFL - Mandarin Chinese')).toBe(true);

      expect(getECRTemplateType('Special Program in Foreign Language - Spanish', 'Grade 7')).toBe('spfl');
      expect(getECRTemplateType('Special Program in Foreign Language - Japanese', 'Grade 8')).toBe('spfl');
      expect(getECRTemplateType('Special Program in Foreign Language - French', 'Grade 9')).toBe('spfl');
      expect(getECRTemplateType('Special Program in Foreign Language - German', 'Grade 10')).toBe('spfl');
      expect(getECRTemplateType('Special Program in Foreign Language - Chinese', 'Grade 7')).toBe('spfl');
      expect(getECRTemplateType('Special Program in Foreign Language - Korean', 'Grade 8')).toBe('spfl');
      expect(getECRTemplateType('SPFL - Spanish', 'Grade 7')).toBe('spfl');

      // Special Program in Journalism (SPJ)
      expect(isSpjSubject('Special Program in Journalism (Journalism)')).toBe(true);
      expect(isSpjSubject('Special Program in Journalism (Pamamahayag)')).toBe(true);
      expect(isSpjSubject('SPJ - Journalism 7')).toBe(true);
      expect(isSpjSubject('Pamamahayag 8')).toBe(true);

      expect(getECRTemplateType('Special Program in Journalism (Journalism)', 'Grade 7')).toBe('spj');
      expect(getECRTemplateType('Special Program in Journalism (Pamamahayag)', 'Grade 8')).toBe('spj');
      expect(getECRTemplateType('SPJ', 'Grade 9')).toBe('spj');
      expect(getECRTemplateType('Journalism I', 'Grade 7')).toBe('spj');

      // Special Program in the Arts (SPA)
      expect(isSpaSubject('Special Program in the Arts (SPA)')).toBe(true);
      expect(isSpaSubject('Special Program in the Arts')).toBe(true);
      expect(isSpaSubject('SPA - Visual Arts')).toBe(true);
      expect(isSpaSubject('SPA - Music (Vocal)')).toBe(true);
      expect(isSpaSubject('SPA - Music (Instrumental)')).toBe(true);
      expect(isSpaSubject('SPA - Dance (Folk & Contemporary)')).toBe(true);
      expect(isSpaSubject('SPA - Theater Arts')).toBe(true);
      expect(isSpaSubject('SPA - Creative Writing (Malikhaing Pagsulat)')).toBe(true);
      expect(isSpaSubject('SPA - Media Arts')).toBe(true);
      expect(isSpaSubject('SPA')).toBe(true);
      expect(isSpaSubject('Visual Arts')).toBe(true);
      expect(isSpaSubject('Theater Arts')).toBe(true);
      expect(isSpaSubject('Media Arts')).toBe(true);
      expect(isSpaSubject('Malikhaing Pagsulat')).toBe(true);
      expect(isSpaSubject('Creative Writing')).toBe(true);

      expect(getECRTemplateType('Special Program in the Arts (SPA)', 'Grade 7')).toBe('spa');
      expect(getECRTemplateType('SPA - Visual Arts', 'Grade 8')).toBe('spa');
      expect(getECRTemplateType('SPA', 'Grade 9')).toBe('spa');

      // Special Program in Sports (SPS)
      expect(isSpsSubject('Special Program in Sports (SPS)')).toBe(true);
      expect(isSpsSubject('Special Program in Sports')).toBe(true);
      expect(isSpsSubject('SPS - Foundations of Sports & Individual/Dual Sports')).toBe(true);
      expect(isSpsSubject('SPS - Team Sports & Biomechanics')).toBe(true);
      expect(isSpsSubject('SPS - Sports Science, Physiology & Nutrition')).toBe(true);
      expect(isSpsSubject('SPS - Sports Officiating & Sports Management')).toBe(true);
      expect(isSpsSubject('SPS')).toBe(true);
      expect(isSpsSubject('Sports Officiating')).toBe(true);
      expect(isSpsSubject('Sports Management')).toBe(true);
      expect(isSpsSubject('Sports Science')).toBe(true);
      expect(isSpsSubject('Biomechanics')).toBe(true);

      expect(getECRTemplateType('Special Program in Sports (SPS)', 'Grade 7')).toBe('sps');
      expect(getECRTemplateType('SPS - Team Sports', 'Grade 8')).toBe('sps');
      expect(getECRTemplateType('SPS', 'Grade 9')).toBe('sps');

      // Special Program in Technical-Vocational Education (SPTVE)
      expect(isSptveSubject('Special Program in Technical-Vocational Education (SPTVE)')).toBe(true);
      expect(isSptveSubject('Special Program in Technical-Vocational Education')).toBe(true);
      expect(isSptveSubject('SPTVE')).toBe(true);
      expect(isSptveSubject('Applied Technical Drawing')).toBe(true);
      expect(isSptveSubject('Applied Entrepreneurship')).toBe(true);
      expect(isSptveSubject('TVE Specialization')).toBe(true);
      expect(isSptveSubject('TVE - Electrical Installation')).toBe(true);
      expect(isSptveSubject('Technical-Vocational Education')).toBe(true);

      expect(getECRTemplateType('Special Program in Technical-Vocational Education (SPTVE)', 'Grade 7')).toBe('sptve');
      expect(getECRTemplateType('Applied Technical Drawing', 'Grade 7')).toBe('sptve');
      expect(getECRTemplateType('Applied Entrepreneurship', 'Grade 8')).toBe('sptve');
      expect(getECRTemplateType('TVE Specialization', 'Grade 9')).toBe('sptve');
      expect(getECRTemplateType('SPTVE', 'Grade 10')).toBe('sptve');

      // Special Science Elementary Schools & Special Program in STEM (SSES / SPSTEM)
      expect(isSsesSpstemSubject('Special Science Elementary Schools (SSES)')).toBe(true);
      expect(isSsesSpstemSubject('Special Program in STEM (SPSTEM)')).toBe(true);
      expect(isSsesSpstemSubject('SSES')).toBe(true);
      expect(isSsesSpstemSubject('SPSTEM')).toBe(true);
      expect(isSsesSpstemSubject('Enhanced Science')).toBe(true);
      expect(isSsesSpstemSubject('Enhanced Mathematics')).toBe(true);
      expect(isSsesSpstemSubject('Creative Technology')).toBe(true);
      expect(isSsesSpstemSubject('Research MIM/SIP')).toBe(true);

      expect(getECRTemplateType('Special Science Elementary Schools (SSES)', 'Grade 4')).toBe('sses_spstem');
      expect(getECRTemplateType('Special Program in STEM (SPSTEM)', 'Grade 7')).toBe('sses_spstem');
      expect(getECRTemplateType('Enhanced Science', 'Grade 7')).toBe('sses_spstem');
      expect(getECRTemplateType('Enhanced Mathematics', 'Grade 8')).toBe('sses_spstem');
      expect(getECRTemplateType('Creative Technology', 'Grade 9')).toBe('sses_spstem');
      expect(getECRTemplateType('Research MIM/SIP', 'Grade 10')).toBe('sses_spstem');
    });

    it('returns official template filenames per subject category', () => {
      expect(getECRTemplateFilename('Science', 'Grade 7')).toBe(TEMPLATE_ACADEMIC);
      expect(getECRTemplateFilename('GMRC', 'Grade 4')).toBe(TEMPLATE_GMRC_VE);
      expect(getECRTemplateFilename('Values Education', 'Grade 8')).toBe(TEMPLATE_GMRC_VE);
      expect(getECRTemplateFilename('EPP', 'Grade 5')).toBe(TEMPLATE_EPP_TLE);
      expect(getECRTemplateFilename('TLE', 'Grade 8')).toBe(TEMPLATE_EPP_TLE);
      expect(getECRTemplateFilename('Music and Arts', 'Grade 7')).toBe(TEMPLATE_MAPEH);
      expect(getECRTemplateFilename('MAPEH', 'Grade 7')).toBe(TEMPLATE_MAPEH);
      expect(getECRTemplateFilename('Special Program in Foreign Language - Spanish', 'Grade 7')).toBe(TEMPLATE_SPFL);
      expect(getECRTemplateFilename('SPFL - Japanese', 'Grade 8')).toBe(TEMPLATE_SPFL);
      expect(getECRTemplateFilename('Special Program in Journalism (Journalism)', 'Grade 7')).toBe(TEMPLATE_SPJ);
      expect(getECRTemplateFilename('SPJ - Pamamahayag', 'Grade 8')).toBe(TEMPLATE_SPJ);
      expect(getECRTemplateFilename('Special Program in the Arts (SPA)', 'Grade 7')).toBe(TEMPLATE_SPA);
      expect(getECRTemplateFilename('SPA - Visual Arts', 'Grade 8')).toBe(TEMPLATE_SPA);
      expect(getECRTemplateFilename('Special Program in Sports (SPS)', 'Grade 7')).toBe(TEMPLATE_SPS);
      expect(getECRTemplateFilename('SPS - Team Sports & Biomechanics', 'Grade 8')).toBe(TEMPLATE_SPS);
      expect(getECRTemplateFilename('Special Program in Technical-Vocational Education (SPTVE)', 'Grade 7')).toBe(TEMPLATE_SPTVE);
      expect(getECRTemplateFilename('Applied Technical Drawing', 'Grade 8')).toBe(TEMPLATE_SPTVE);
      expect(getECRTemplateFilename('Applied Entrepreneurship', 'Grade 9')).toBe(TEMPLATE_SPTVE);
      expect(getECRTemplateFilename('TVE Specialization', 'Grade 10')).toBe(TEMPLATE_SPTVE);
      expect(getECRTemplateFilename('Special Science Elementary Schools (SSES)', 'Grade 4')).toBe(TEMPLATE_SSES_SPSTEM);
      expect(getECRTemplateFilename('Special Program in STEM (SPSTEM)', 'Grade 7')).toBe(TEMPLATE_SSES_SPSTEM);
      expect(getECRTemplateFilename('Enhanced Science', 'Grade 7')).toBe(TEMPLATE_SSES_SPSTEM);
      expect(getECRTemplateFilename('Enhanced Mathematics', 'Grade 8')).toBe(TEMPLATE_SSES_SPSTEM);
      expect(getECRTemplateFilename('Creative Technology', 'Grade 9')).toBe(TEMPLATE_SSES_SPSTEM);
      expect(getECRTemplateFilename('Research MIM/SIP', 'Grade 10')).toBe(TEMPLATE_SSES_SPSTEM);
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

    it('normalizes SPFL subjects to match official $Q$1:$Q$6 dropdown list', () => {
      expect(normalizeSubjectForECR('SPFL - Spanish', 'spfl', 'Grade 7')).toBe('Special Program in Foreign Language - Spanish');
      expect(normalizeSubjectForECR('Spanish 7', 'spfl', 'Grade 7')).toBe('Special Program in Foreign Language - Spanish');
      expect(normalizeSubjectForECR('Japanese (Nihongo)', 'spfl', 'Grade 8')).toBe('Special Program in Foreign Language - Japanese');
      expect(normalizeSubjectForECR('French', 'spfl', 'Grade 9')).toBe('Special Program in Foreign Language - French');
      expect(normalizeSubjectForECR('German', 'spfl', 'Grade 10')).toBe('Special Program in Foreign Language - German');
      expect(normalizeSubjectForECR('Mandarin Chinese', 'spfl', 'Grade 7')).toBe('Special Program in Foreign Language - Chinese');
      expect(normalizeSubjectForECR('Korean', 'spfl', 'Grade 8')).toBe('Special Program in Foreign Language - Korean');
      expect(SPFL_SUBJECTS).toHaveLength(6);
    });

    it('normalizes SPJ subjects to match official dropdown list', () => {
      expect(normalizeSubjectForECR('SPJ - Journalism 7', 'spj', 'Grade 7')).toBe('Special Program in Journalism (Journalism)');
      expect(normalizeSubjectForECR('Pamamahayag 8', 'spj', 'Grade 8')).toBe('Special Program in Journalism (Pamamahayag)');
    });

    it('normalizes SPA subjects to match official dropdown (Special Program in the Arts (SPA))', () => {
      expect(normalizeSubjectForECR('SPA - Visual Arts', 'spa', 'Grade 7')).toBe('Special Program in the Arts (SPA)');
      expect(normalizeSubjectForECR('SPA - Music (Vocal)', 'spa', 'Grade 8')).toBe('Special Program in the Arts (SPA)');
      expect(normalizeSubjectForECR('SPA', 'spa', 'Grade 9')).toBe('Special Program in the Arts (SPA)');
      expect(normalizeSubjectForECR('Theater Arts', 'spa', 'Grade 7')).toBe('Special Program in the Arts (SPA)');
    });

    it('normalizes SPS subjects to match official dropdown (Special Program in Sports (SPS))', () => {
      expect(normalizeSubjectForECR('SPS - Team Sports & Biomechanics', 'sps', 'Grade 7')).toBe('Special Program in Sports (SPS)');
      expect(normalizeSubjectForECR('SPS - Sports Science', 'sps', 'Grade 8')).toBe('Special Program in Sports (SPS)');
      expect(normalizeSubjectForECR('SPS', 'sps', 'Grade 9')).toBe('Special Program in Sports (SPS)');
      expect(normalizeSubjectForECR('Sports Officiating', 'sps', 'Grade 10')).toBe('Special Program in Sports (SPS)');
    });

    it('normalizes SPTVE subjects to match official dropdown (Applied Technical Drawing, Applied Entrepreneurship, TVE Specialization)', () => {
      expect(normalizeSubjectForECR('Applied Technical Drawing 7', 'sptve', 'Grade 7')).toBe('Applied Technical Drawing');
      expect(normalizeSubjectForECR('Technical Drafting (SPTVE)', 'sptve', 'Grade 8')).toBe('Applied Technical Drawing');
      expect(normalizeSubjectForECR('Applied Entrepreneurship', 'sptve', 'Grade 9')).toBe('Applied Entrepreneurship');
      expect(normalizeSubjectForECR('Entrep 10', 'sptve', 'Grade 10')).toBe('Applied Entrepreneurship');
      expect(normalizeSubjectForECR('Special Program in Technical-Vocational Education (SPTVE)', 'sptve', 'Grade 7')).toBe('TVE Specialization');
      expect(normalizeSubjectForECR('TVE Specialization', 'sptve', 'Grade 8')).toBe('TVE Specialization');
      expect(normalizeSubjectForECR('SPTVE', 'sptve', 'Grade 9')).toBe('TVE Specialization');
      expect(SPTVE_SUBJECTS).toHaveLength(5);
    });

    it('normalizes SSES and SPSTEM subjects to match official dropdown (Enhanced Science, Enhanced Mathematics, Creative Technology, Research MIM/SIP)', () => {
      expect(normalizeSubjectForECR('Enhanced Science 7', 'sses_spstem', 'Grade 7')).toBe('Enhanced Science');
      expect(normalizeSubjectForECR('Special Science Elementary Schools (SSES)', 'sses_spstem', 'Grade 4')).toBe('Enhanced Science');
      expect(normalizeSubjectForECR('SPSTEM', 'sses_spstem', 'Grade 7')).toBe('Enhanced Science');
      expect(normalizeSubjectForECR('Enhanced Mathematics', 'sses_spstem', 'Grade 8')).toBe('Enhanced Mathematics');
      expect(normalizeSubjectForECR('Math (SSES)', 'sses_spstem', 'Grade 5')).toBe('Enhanced Mathematics');
      expect(normalizeSubjectForECR('Creative Technology', 'sses_spstem', 'Grade 9')).toBe('Creative Technology');
      expect(normalizeSubjectForECR('Robotics and Creative Tech', 'sses_spstem', 'Grade 9')).toBe('Creative Technology');
      expect(normalizeSubjectForECR('Research MIM/SIP', 'sses_spstem', 'Grade 10')).toBe('Research MIM/SIP');
      expect(normalizeSubjectForECR('Science Investigatory Project (SIP)', 'sses_spstem', 'Grade 10')).toBe('Research MIM/SIP');
      expect(SSES_SPSTEM_SUBJECTS).toHaveLength(7);
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

    it('populates official Academic template with preserved final grade formulas and zero _xlfn.XLOOKUP', async () => {
      const templatePath = path.join(templatesDir, TEMPLATE_ACADEMIC);
      if (!fs.existsSync(templatePath)) return;

      const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));
      const scienceSubject: Subject = { id: 'sub-sci', subject_name: 'Science', grade_level: 'Grade 7' };

      const mockClassRecords: ClassRecord[] = [
        {
          id: 'cr-sci-1',
          student_lrn: '100000000001',
          subject_id: 'sub-sci',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [18, 19, 20, 18, 19],
          performance_tasks: [48, 49, 50],
          quarterly_exam: 45
        }
      ];

      const mockHpsRecords: HPSRecord[] = [
        {
          id: 'hps-sci-1',
          subject_id: 'sub-sci',
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
        subject: scienceSubject,
        students: mockStudents,
        classRecords: mockClassRecords,
        hpsRecords: mockHpsRecords
      });

      // 1. INPUT DATA
      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')!.async('text');
      expect(sheet1Xml).toContain('Science');
      expect(sheet1Xml).toContain('DELA CRUZ, JUAN');
      expect(sheet1Xml).toContain('CLARA, MARIA');

      // 2. TERM 1 (sheet2.xml)
      const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
      expect(sheet2Xml).toContain('r="F15"');
      expect(sheet2Xml).toContain('r="F18"');

      // 3. FINAL GRADES (sheet5.xml)
      const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
      expect(sheet5Xml).toContain(`IF('TERM 1'!AC18="","",'TERM 1'!AC18)`);
      expect(sheet5Xml).toContain(`IF(COUNT(F14,G14,H14)&lt;3,"",ROUND(AVERAGE(F14,G14,H14),0))`);
      expect(sheet5Xml).not.toContain('_xlfn.XLOOKUP');

      // 4. Workbook calculation property
      const wbXml = await zip.file('xl/workbook.xml')!.async('text');
      expect(wbXml).toContain('fullCalcOnLoad="1"');
    });

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

    it('populates SPFL template with valid OpenXML structure and calculations', async () => {
      const templatePath = path.join(templatesDir, TEMPLATE_SPFL);
      if (!fs.existsSync(templatePath)) return;

      const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));
      const spflSubject: Subject = {
        id: 'sub-spfl-span',
        subject_name: 'Special Program in Foreign Language - Spanish',
        grade_level: 'Grade 7'
      };

      const mockClassRecords: ClassRecord[] = [
        {
          id: 'cr-spfl-1',
          student_lrn: '100000000001',
          subject_id: 'sub-spfl-span',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 18, 19, 20, 20],
          performance_tasks: [48, 50, 47],
          quarterly_exam: 45
        },
        {
          id: 'cr-spfl-2',
          student_lrn: '100000000003',
          subject_id: 'sub-spfl-span',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [19, 17, 20, 18, 19],
          performance_tasks: [46, 48, 49],
          quarterly_exam: 42
        }
      ];

      const mockHpsRecords: HPSRecord[] = [
        {
          id: 'hps-spfl-1',
          subject_id: 'sub-spfl-span',
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
        subject: spflSubject,
        students: mockStudents,
        classRecords: mockClassRecords,
        hpsRecords: mockHpsRecords
      });

      // 1. INPUT DATA (sheet1.xml)
      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')!.async('text');
      expect(sheet1Xml).toContain('Special Program in Foreign Language - Spanish');
      expect(sheet1Xml).toContain('DELA CRUZ, JUAN');
      expect(sheet1Xml).toContain('CLARA, MARIA');

      // 2. TERM 1 (sheet2.xml)
      const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
      expect(sheet2Xml).toContain('r="F15"');
      expect(sheet2Xml).toContain('r="F18"');
      // Verify male score populated
      expect(sheet2Xml).toContain('r="F18"');
      // Verify female score populated in row 69
      expect(sheet2Xml).toContain('r="F69"');

      // 3. FINAL GRADES (sheet5.xml)
      const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
      expect(sheet5Xml).toContain(`'TERM 1'!AC18`);
      expect(sheet5Xml).toContain(`'TERM 1'!AC69`);

      // 4. Workbook calculation property
      const wbXml = await zip.file('xl/workbook.xml')!.async('text');
      expect(wbXml).toContain('fullCalcOnLoad="1"');
    });

    it('populates SPJ template with valid OpenXML structure and calculations', async () => {
      const templatePath = path.join(templatesDir, TEMPLATE_SPJ);
      if (!fs.existsSync(templatePath)) return;

      const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));
      const spjSubject: Subject = {
        id: 'sub-spj-jour',
        subject_name: 'Special Program in Journalism (Journalism)',
        grade_level: 'Grade 7'
      };

      const mockClassRecords: ClassRecord[] = [
        {
          id: 'cr-spj-1',
          student_lrn: '100000000001',
          subject_id: 'sub-spj-jour',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 18, 19, 20, 20],
          performance_tasks: [48, 50, 47],
          quarterly_exam: 45
        },
        {
          id: 'cr-spj-2',
          student_lrn: '100000000003',
          subject_id: 'sub-spj-jour',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [19, 17, 20, 18, 19],
          performance_tasks: [46, 48, 49],
          quarterly_exam: 42
        }
      ];

      const mockHpsRecords: HPSRecord[] = [
        {
          id: 'hps-spj-1',
          subject_id: 'sub-spj-jour',
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
        subject: spjSubject,
        students: mockStudents,
        classRecords: mockClassRecords,
        hpsRecords: mockHpsRecords
      });

      // 1. INPUT DATA (sheet1.xml)
      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')!.async('text');
      expect(sheet1Xml).toContain('Special Program in Journalism (Journalism)');
      expect(sheet1Xml).toContain('DELA CRUZ, JUAN');
      expect(sheet1Xml).toContain('CLARA, MARIA');

      // 2. TERM 1 (sheet2.xml)
      const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
      expect(sheet2Xml).toContain('r="F15"');
      expect(sheet2Xml).toContain('r="F18"');
      expect(sheet2Xml).toContain('r="F69"');

      // 3. FINAL GRADES (sheet5.xml)
      const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
      expect(sheet5Xml).toContain(`IF('TERM 1'!AC18="","",'TERM 1'!AC18)`);
      expect(sheet5Xml).toContain(`IF('TERM 1'!AC69="","",'TERM 1'!AC69)`);

      // 4. Workbook calculation property
      const wbXml = await zip.file('xl/workbook.xml')!.async('text');
      expect(wbXml).toContain('fullCalcOnLoad="1"');
    });

    it('populates SPA template with valid OpenXML structure and calculations', async () => {
      const templatePath = path.join(templatesDir, TEMPLATE_SPA);
      if (!fs.existsSync(templatePath)) return;

      const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));
      const spaSubject: Subject = {
        id: 'sub-spa-va',
        subject_name: 'SPA - Visual Arts',
        grade_level: 'Grade 7'
      };

      const mockClassRecords: ClassRecord[] = [
        {
          id: 'cr-spa-1',
          student_lrn: '100000000001',
          subject_id: 'sub-spa-va',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 19, 18, 20, 20],
          performance_tasks: [49, 50, 48],
          quarterly_exam: 46
        },
        {
          id: 'cr-spa-2',
          student_lrn: '100000000003',
          subject_id: 'sub-spa-va',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [18, 19, 20, 17, 19],
          performance_tasks: [47, 49, 50],
          quarterly_exam: 44
        }
      ];

      const mockHpsRecords: HPSRecord[] = [
        {
          id: 'hps-spa-1',
          subject_id: 'sub-spa-va',
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
        subject: spaSubject,
        students: mockStudents,
        classRecords: mockClassRecords,
        hpsRecords: mockHpsRecords
      });

      // 1. INPUT DATA (sheet1.xml)
      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')!.async('text');
      expect(sheet1Xml).toContain('Special Program in the Arts (SPA)');
      expect(sheet1Xml).toContain('DELA CRUZ, JUAN');
      expect(sheet1Xml).toContain('CLARA, MARIA');

      // 2. TERM 1 (sheet2.xml)
      const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
      expect(sheet2Xml).toContain('r="F15"');
      expect(sheet2Xml).toContain('r="F18"');
      expect(sheet2Xml).toContain('r="F69"');

      // 3. FINAL GRADES (sheet5.xml)
      const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
      expect(sheet5Xml).toContain(`IF('TERM 1'!AC18="","",'TERM 1'!AC18)`);
      expect(sheet5Xml).toContain(`IF('TERM 1'!AC69="","",'TERM 1'!AC69)`);

      // 4. Workbook calculation property
      const wbXml = await zip.file('xl/workbook.xml')!.async('text');
      expect(wbXml).toContain('fullCalcOnLoad="1"');
    });

    it('populates SPS template with valid OpenXML structure and calculations', async () => {
      const templatePath = path.join(templatesDir, TEMPLATE_SPS);
      if (!fs.existsSync(templatePath)) return;

      const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));
      const spsSubject: Subject = {
        id: 'sub-sps-1',
        subject_name: 'SPS - Team Sports & Biomechanics',
        grade_level: 'Grade 8'
      };

      const mockClassRecords: ClassRecord[] = [
        {
          id: 'cr-sps-1',
          student_lrn: '100000000001',
          subject_id: 'sub-sps-1',
          section_id: 'sec-8a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 18, 19, 20, 20],
          performance_tasks: [48, 50, 49],
          quarterly_exam: 45
        },
        {
          id: 'cr-sps-2',
          student_lrn: '100000000003',
          subject_id: 'sub-sps-1',
          section_id: 'sec-8a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [19, 17, 20, 18, 19],
          performance_tasks: [49, 47, 50],
          quarterly_exam: 46
        }
      ];

      const mockHpsRecords: HPSRecord[] = [
        {
          id: 'hps-sps-1',
          subject_id: 'sub-sps-1',
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
        subject: spsSubject,
        students: mockStudents,
        classRecords: mockClassRecords,
        hpsRecords: mockHpsRecords
      });

      // 1. INPUT DATA (sheet1.xml)
      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')!.async('text');
      expect(sheet1Xml).toContain('Special Program in Sports (SPS)');
      expect(sheet1Xml).toContain('DELA CRUZ, JUAN');
      expect(sheet1Xml).toContain('CLARA, MARIA');

      // 2. TERM 1 (sheet2.xml)
      const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
      expect(sheet2Xml).toContain('r="F15"');
      expect(sheet2Xml).toContain('r="F18"');
      expect(sheet2Xml).toContain('r="F69"');

      // 3. FINAL GRADES (sheet5.xml)
      const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
      expect(sheet5Xml).toContain(`'TERM 1'!AC18`);
      expect(sheet5Xml).toContain(`'TERM 1'!AC69`);

      // 4. Workbook calculation property
      const wbXml = await zip.file('xl/workbook.xml')!.async('text');
      expect(wbXml).toContain('fullCalcOnLoad="1"');
    });

    it('populates SPTVE template with valid OpenXML structure and calculations', async () => {
      const templatePath = path.join(templatesDir, TEMPLATE_SPTVE);
      if (!fs.existsSync(templatePath)) return;

      const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));
      const sptveSubject: Subject = {
        id: 'sub-sptve-1',
        subject_name: 'Applied Technical Drawing',
        grade_level: 'Grade 7'
      };

      const mockClassRecords: ClassRecord[] = [
        {
          id: 'cr-sptve-1',
          student_lrn: '100000000001',
          subject_id: 'sub-sptve-1',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 18, 19, 20, 20],
          performance_tasks: [48, 50, 49],
          quarterly_exam: 45
        },
        {
          id: 'cr-sptve-2',
          student_lrn: '100000000003',
          subject_id: 'sub-sptve-1',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [19, 17, 20, 18, 19],
          performance_tasks: [49, 47, 50],
          quarterly_exam: 46
        }
      ];

      const mockHpsRecords: HPSRecord[] = [
        {
          id: 'hps-sptve-1',
          subject_id: 'sub-sptve-1',
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
        subject: sptveSubject,
        students: mockStudents,
        classRecords: mockClassRecords,
        hpsRecords: mockHpsRecords
      });

      // 1. INPUT DATA (sheet1.xml)
      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')!.async('text');
      expect(sheet1Xml).toContain('Applied Technical Drawing');
      expect(sheet1Xml).toContain('DELA CRUZ, JUAN');
      expect(sheet1Xml).toContain('CLARA, MARIA');

      // 2. TERM 1 (sheet2.xml)
      const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
      expect(sheet2Xml).toContain('r="F15"');
      expect(sheet2Xml).toContain('r="F18"');
      expect(sheet2Xml).toContain('r="F69"');

      // 3. FINAL GRADES (sheet5.xml)
      const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
      expect(sheet5Xml).toContain(`'TERM 1'!AC18`);
      expect(sheet5Xml).toContain(`'TERM 1'!AC69`);

      // 4. Workbook calculation property
      const wbXml = await zip.file('xl/workbook.xml')!.async('text');
      expect(wbXml).toContain('fullCalcOnLoad="1"');
    });

    it('populates SSES and SPSTEM template with valid OpenXML structure and calculations', async () => {
      const templatePath = path.join(templatesDir, TEMPLATE_SSES_SPSTEM);
      if (!fs.existsSync(templatePath)) return;

      const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));
      const ssesSubject: Subject = {
        id: 'sub-sses-1',
        subject_name: 'Enhanced Science',
        grade_level: 'Grade 7'
      };

      const mockClassRecords: ClassRecord[] = [
        {
          id: 'cr-sses-1',
          student_lrn: '100000000001',
          subject_id: 'sub-sses-1',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 18, 19, 20, 20],
          performance_tasks: [48, 50, 49],
          quarterly_exam: 45
        },
        {
          id: 'cr-sses-2',
          student_lrn: '100000000003',
          subject_id: 'sub-sses-1',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [19, 17, 20, 18, 19],
          performance_tasks: [49, 47, 50],
          quarterly_exam: 46
        }
      ];

      const mockHpsRecords: HPSRecord[] = [
        {
          id: 'hps-sses-1',
          subject_id: 'sub-sses-1',
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
        subject: ssesSubject,
        students: mockStudents,
        classRecords: mockClassRecords,
        hpsRecords: mockHpsRecords
      });

      // 1. INPUT DATA (sheet1.xml)
      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')!.async('text');
      expect(sheet1Xml).toContain('Enhanced Science');
      expect(sheet1Xml).toContain('DELA CRUZ, JUAN');
      expect(sheet1Xml).toContain('CLARA, MARIA');

      // 2. TERM 1 (sheet2.xml)
      const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
      expect(sheet2Xml).toContain('r="F15"');
      expect(sheet2Xml).toContain('r="F18"');
      expect(sheet2Xml).toContain('r="F69"');

      // 3. FINAL GRADES (sheet5.xml)
      const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
      expect(sheet5Xml).toContain(`'TERM 1'!AC18`);
      expect(sheet5Xml).toContain(`'TERM 1'!AC69`);

      // 4. Workbook calculation property
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

      // Sheet 8: Final Grades preserved formulas and zero _xlfn.XLOOKUP
      const sheet8Xml = await zip.file('xl/worksheets/sheet8.xml')!.async('text');
      expect(sheet8Xml).toContain(`IF('TERM 1 M and A'!AC18="","",'TERM 1 M and A'!AC18)`);
      expect(sheet8Xml).toContain(`IF('TERM 1 PE and H'!AC18="","",'TERM 1 PE and H'!AC18)`);
      expect(sheet8Xml).toContain(`IF(COUNT(H15,K15,N15)&lt;3,"",ROUND(AVERAGE(H15,K15,N15),0))`);
      expect(sheet8Xml).not.toContain('_xlfn.XLOOKUP');

      // Workbook properties: updated sheet names & calculation on load
      const wbXml = await zip.file('xl/workbook.xml')!.async('text');
      expect(wbXml).toContain('name="TERM 1 M and A"');
      expect(wbXml).toContain('name="TERM 1 PE and H"');
      expect(wbXml).toContain('fullCalcOnLoad="1"');
    });

    it('correctly exports MAPEH for Grade 9 section when allSubjects contains subjects from other grade levels', async () => {
      const templatePath = path.join(templatesDir, TEMPLATE_MAPEH);
      if (!fs.existsSync(templatePath)) return;

      const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));

      const g9Section: Section = {
        id: 'sec-g9-matalino',
        section_name: 'Matalino',
        section_grade_level: 'Grade 9',
        adviser_name: 'Mr. Emerson Galano'
      };

      const g9Students: Student[] = [
        {
          lrn: '123456789001',
          first_name: 'Aaron',
          last_name: 'Asuncion',
          gender: 'Male',
          student_section: 'sec-g9-matalino',
          birthday: '2008-01-01',
          age: 18,
          address: 'Tarlac',
          grade_level: 'Grade 9'
        }
      ];

      // Subjects from Grade 7, Grade 8, and Grade 9 in the school
      const allSchoolSubjects: Subject[] = [
        { id: 'sub-g7-ma', subject_name: 'Music and Arts', grade_level: 'Grade 7', section_id: 'sec-g7-a' },
        { id: 'sub-g7-pe', subject_name: 'Physical Education and Health', grade_level: 'Grade 7', section_id: 'sec-g7-a' },
        { id: 'sub-g8-ma', subject_name: 'Music and Arts', grade_level: 'Grade 8', section_id: 'sec-g8-a' },
        { id: 'sub-g8-pe', subject_name: 'Physical Education and Health', grade_level: 'Grade 8', section_id: 'sec-g8-a' },
        { id: 'sub-g9-ma', subject_name: 'Music and Arts', grade_level: 'Grade 9', section_id: 'sec-g9-matalino' },
        { id: 'sub-g9-pe', subject_name: 'Physical Education and Health', grade_level: 'Grade 9', section_id: 'sec-g9-matalino' }
      ];

      const mockG9ClassRecords: ClassRecord[] = [
        {
          id: 'cr-g9-ma-1',
          student_lrn: '123456789001',
          subject_id: 'sub-g9-ma',
          section_id: 'sec-g9-matalino',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [19, 18, 20, 19, 20],
          performance_tasks: [48, 49, 50],
          quarterly_exam: 45
        },
        {
          id: 'cr-g9-pe-1',
          student_lrn: '123456789001',
          subject_id: 'sub-g9-pe',
          section_id: 'sec-g9-matalino',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20, 20, 18, 19],
          performance_tasks: [50, 50, 48],
          quarterly_exam: 47
        }
      ];

      const mockG9HpsRecords: HPSRecord[] = [
        {
          id: 'hps-g9-ma-1',
          subject_id: 'sub-g9-ma',
          section_id: 'sec-g9-matalino',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20, 20, 20, 20],
          performance_tasks: [50, 50, 50],
          quarterly_exam: 50
        },
        {
          id: 'hps-g9-pe-1',
          subject_id: 'sub-g9-pe',
          section_id: 'sec-g9-matalino',
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
        section: g9Section,
        subject: { id: 'virtual_mapeh', subject_name: 'MAPEH', grade_level: 'Grade 9' } as Subject,
        allSubjects: allSchoolSubjects,
        students: g9Students,
        classRecords: mockG9ClassRecords,
        hpsRecords: mockG9HpsRecords
      });

      // Sheet 1: Input Data
      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')!.async('text');
      expect(sheet1Xml).toContain('MAPEH');
      expect(sheet1Xml).toContain('ASUNCION, AARON');
      expect(sheet1Xml).toContain('MATALINO');

      // Sheet 2: Term 1 Music and Arts (HPS in F15=20, Student WW1 in F18=19)
      const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
      expect(sheet2Xml).toContain('r="F15"');
      expect(sheet2Xml).toContain('r="F18"');
      expect(sheet2Xml).toContain('<v>19</v>');

      // Sheet 3: Term 1 PE and Health (HPS in F15=20, Student WW1 in F18=20, Exam in T18/V18=47)
      const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
      expect(sheet3Xml).toContain('r="F15"');
      expect(sheet3Xml).toContain('r="F18"');
      expect(sheet3Xml).toContain('<v>20</v>');
      expect(sheet3Xml).toContain('<v>47</v>');
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

      // Verify no _xlfn.XLOOKUP in Term 1 and FINAL GRADES, and check updated formulas
      expect(sheet2Xml).not.toContain('_xlfn.XLOOKUP');
      const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
      expect(sheet5Xml).not.toContain('_xlfn.XLOOKUP');
      expect(sheet5Xml).toContain(`IF('TERM 1'!AW19="","",'TERM 1'!AW19)`);
      expect(sheet5Xml).toContain(`IF(COUNT(F14:H14)&lt;3,"",ROUND(AVERAGE(F14:H14),0))`);
    });

    it('successfully populates official EPP-TLE per-component template with separate component sheets and preserved final grade formulas', async () => {
      const templatePath = path.resolve(__dirname, '../../public/templates', TEMPLATE_EPP_TLE_COMPONENTS);
      expect(fs.existsSync(templatePath)).toBe(true);

      const templateBuffer = fs.readFileSync(templatePath);

      const eppSubject: Subject = {
        id: 'sub-epp',
        subject_name: 'EPP/TLE',
        grade_level: 'Grade 6',
        section_id: 'sec-7a'
      };

      const ictSubject: Subject = {
        id: 'sub-ict',
        subject_name: 'ICT',
        grade_level: 'Grade 6',
        section_id: 'sec-7a'
      };

      const afaSubject: Subject = {
        id: 'sub-afa',
        subject_name: 'Agri-Fishery Arts',
        grade_level: 'Grade 6',
        section_id: 'sec-7a'
      };

      const fcsSubject: Subject = {
        id: 'sub-fcs',
        subject_name: 'Home Economics (FCS)',
        grade_level: 'Grade 6',
        section_id: 'sec-7a'
      };

      const iaSubject: Subject = {
        id: 'sub-ia',
        subject_name: 'Industrial Arts',
        grade_level: 'Grade 6',
        section_id: 'sec-7a'
      };

      const allSubs = [eppSubject, ictSubject, afaSubject, fcsSubject, iaSubject];

      const mockClassRecords: ClassRecord[] = [
        // Term 1 ICT
        {
          id: 'cr-ict-t1',
          student_lrn: '100000000001',
          subject_id: 'sub-ict',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [18, 19, 20, 18, 19],
          performance_tasks: [48, 49, 50],
          quarterly_exam: 45
        },
        // Term 1 AFA
        {
          id: 'cr-afa-t1',
          student_lrn: '100000000001',
          subject_id: 'sub-afa',
          section_id: 'sec-7a',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [17, 18, 19, 17, 18],
          performance_tasks: [47, 48, 49],
          quarterly_exam: 44
        },
        // Term 2 FCS
        {
          id: 'cr-fcs-t2',
          student_lrn: '100000000001',
          subject_id: 'sub-fcs',
          section_id: 'sec-7a',
          quarter: 2,
          school_year: '2026-2027',
          written_works: [19, 20, 20, 19, 20],
          performance_tasks: [50, 50, 49],
          quarterly_exam: 48
        },
        // Term 3 IA
        {
          id: 'cr-ia-t3',
          student_lrn: '100000000001',
          subject_id: 'sub-ia',
          section_id: 'sec-7a',
          quarter: 3,
          school_year: '2026-2027',
          written_works: [20, 20, 19, 20, 20],
          performance_tasks: [49, 50, 50],
          quarterly_exam: 50
        }
      ];

      const mockHpsRecords: HPSRecord[] = [
        {
          id: 'hps-ict-t1',
          subject_id: 'sub-ict',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20, 20, 20, 20],
          performance_tasks: [50, 50, 50],
          quarterly_exam: 50
        },
        {
          id: 'hps-afa-t1',
          subject_id: 'sub-afa',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20, 20, 20, 20],
          performance_tasks: [50, 50, 50],
          quarterly_exam: 50
        },
        {
          id: 'hps-fcs-t2',
          subject_id: 'sub-fcs',
          quarter: 2,
          school_year: '2026-2027',
          written_works: [20, 20, 20, 20, 20],
          performance_tasks: [50, 50, 50],
          quarterly_exam: 50
        },
        {
          id: 'hps-ia-t3',
          subject_id: 'sub-ia',
          quarter: 3,
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
        subject: eppSubject,
        allSubjects: allSubs,
        students: mockStudents,
        classRecords: mockClassRecords,
        hpsRecords: mockHpsRecords,
        templateOverride: 'epp_tle_components'
      });

      // 1. INPUT DATA
      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')!.async('text');
      expect(sheet1Xml).toContain('EPP/TLE');
      expect(sheet1Xml).toContain('DELA CRUZ, JUAN');
      expect(sheet1Xml).toContain('CLARA, MARIA');

      // 2. TERM 1 ICT (sheet2.xml)
      const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
      expect(sheet2Xml).toContain('r="F15"'); // HPS WW1
      expect(sheet2Xml).toContain('r="F18"'); // Student 1 WW1 score

      // 3. TERM 1 AFA (sheet3.xml)
      const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
      expect(sheet3Xml).toContain('r="F15"');
      expect(sheet3Xml).toContain('r="F18"');

      // 4. TERM 2 FCS (sheet5.xml)
      const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
      expect(sheet5Xml).toContain('r="F15"');
      expect(sheet5Xml).toContain('r="F18"');

      // 5. TERM 3 IA (sheet7.xml)
      const sheet7Xml = await zip.file('xl/worksheets/sheet7.xml')!.async('text');
      expect(sheet7Xml).toContain('r="F15"');
      expect(sheet7Xml).toContain('r="F18"');

      // 6. FINAL GRADES (sheet8.xml) - Check formulas preserved
      const sheet8Xml = await zip.file('xl/worksheets/sheet8.xml')!.async('text');
      expect(sheet8Xml).toContain(`IF('TERM 1 ICT'!AC18="","",'TERM 1 ICT'!AC18)`);
      expect(sheet8Xml).toContain(`IF('TERM 1 AFA'!AC18="","",'TERM 1 AFA'!AC18)`);
      expect(sheet8Xml).toContain(`IF(COUNT(F15:G15)=0,"",ROUND((F15*0.25)+(G15*0.75),0))`);
      expect(sheet8Xml).toContain(`IF(COUNT(H15,K15,N15)&lt;3,"",ROUND(AVERAGE(H15,K15,N15),0))`);

      // 7. Full calculation on load enabled
      const wbXml = await zip.file('xl/workbook.xml')!.async('text');
      expect(wbXml).toContain('fullCalcOnLoad="1"');
    });
  });

  describe('Component Classifier Helpers', () => {
    it('correctly classifies ICT components', () => {
      expect(isIctComponent('ICT')).toBe(true);
      expect(isIctComponent('Information and Communications Technology')).toBe(true);
      expect(isIctComponent('Computer Systems Servicing')).toBe(true);
      expect(isIctComponent('Animation')).toBe(true);
      expect(isIctComponent('Technical Drafting')).toBe(true);
      expect(isIctComponent('Science')).toBe(false);
    });

    it('correctly classifies AFA components', () => {
      expect(isAfaComponent('AFA')).toBe(true);
      expect(isAfaComponent('Agri-Fishery Arts')).toBe(true);
      expect(isAfaComponent('Agriculture and Fishery Arts')).toBe(true);
      expect(isAfaComponent('Horticulture')).toBe(true);
      expect(isAfaComponent('Organic Agriculture')).toBe(true);
      expect(isAfaComponent('Mathematics')).toBe(false);
    });

    it('correctly classifies FCS components', () => {
      expect(isFcsComponent('FCS')).toBe(true);
      expect(isFcsComponent('Home Economics')).toBe(true);
      expect(isFcsComponent('HE')).toBe(true);
      expect(isFcsComponent('Cookery')).toBe(true);
      expect(isFcsComponent('Bread and Pastry')).toBe(true);
      expect(isFcsComponent('Dressmaking')).toBe(true);
      expect(isFcsComponent('Music')).toBe(false);
    });

    it('correctly classifies IA components', () => {
      expect(isIaComponent('IA')).toBe(true);
      expect(isIaComponent('Industrial Arts')).toBe(true);
      expect(isIaComponent('Carpentry')).toBe(true);
      expect(isIaComponent('Electrical Installation')).toBe(true);
      expect(isIaComponent('Welding (SMAW)')).toBe(true);
      expect(isIaComponent('English')).toBe(false);
    });

    it('correctly identifies generic EPP/TLE component subjects', () => {
      expect(isEppTleComponent('ICT')).toBe(true);
      expect(isEppTleComponent('Agri-Fishery Arts')).toBe(true);
      expect(isEppTleComponent('Cookery')).toBe(true);
      expect(isEppTleComponent('Carpentry')).toBe(true);
      expect(isEppTleComponent('Araling Panlipunan')).toBe(false);
    });

    it('resolves template filename with override', () => {
      expect(getECRTemplateFilename('EPP/TLE', 'Grade 6', 'epp_tle_components')).toBe(TEMPLATE_EPP_TLE_COMPONENTS);
      expect(getECRTemplateFilename('EPP/TLE', 'Grade 6')).toBe(TEMPLATE_EPP_TLE);
    });
  });
});
