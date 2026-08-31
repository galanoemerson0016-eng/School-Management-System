/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  TEMPLATE_SSHS_G11,
  getSSHSCategory,
  getSSHSCluster,
  populateSSHSWorkbookZip
} from './sshs-excel-export';
import type { Section, Subject, Student, SchoolProfile, ClassRecord, HPSRecord } from '../types';

describe('SSHS Grade 11 E-Class Record Export Service', () => {
  const templatesDir = path.resolve(__dirname, '../../public/templates');
  const templatePath = path.join(templatesDir, TEMPLATE_SSHS_G11);

  const mockSchoolProfile: SchoolProfile = {
    school_id: '307014',
    name: 'Calibungan High School',
    region: 'Region III',
    division: 'Tarlac Province',
    district: 'Victoria',
    head_name: 'Dr. Principal',
    head_position: 'School Principal I',
    grade_levels_offered: 'Grade 11, Grade 12'
  };

  const mockSection: Section = {
    id: 'sec-11-stem',
    section_name: 'STEM 11-A',
    section_grade_level: 'Grade 11',
    adviser_name: 'Emerson M. Galano',
    strand: 'STEM',
    track: 'Academic'
  };

  const mockSubject: Subject = {
    id: 'sub-calculus',
    subject_name: 'Basic Calculus',
    grade_level: 'Grade 11',
    category: 'ACADEMIC',
    cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS'
  } as any;

  const mockStudents: Student[] = [
    {
      lrn: '100000000001',
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      middle_name: 'Protacio',
      name_extension: 'Jr.',
      gender: 'Male',
      birthday: '2009-01-01',
      age: 17,
      address: 'Victoria, Tarlac',
      grade_level: 'Grade 11',
      student_section: 'sec-11-stem'
    },
    {
      lrn: '100000000002',
      first_name: 'Maria',
      last_name: 'Clara',
      middle_name: 'De Los Santos',
      name_extension: '',
      gender: 'Female',
      birthday: '2009-02-02',
      age: 17,
      address: 'Victoria, Tarlac',
      grade_level: 'Grade 11',
      student_section: 'sec-11-stem'
    }
  ];

  it('correctly maps category and cluster for SSHS subjects', () => {
    expect(getSSHSCategory(mockSubject)).toBe('SSHS - ACADEMIC');
    expect(getSSHSCluster(mockSubject)).toBe('SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS');

    const coreSubject: Subject = {
      id: 'sub-oral-comm',
      subject_name: 'Effective Communication',
      grade_level: 'Grade 11',
      category: 'CORE'
    } as any;
    expect(getSSHSCategory(coreSubject)).toBe('SSHS - CORE');
    expect(getSSHSCluster(coreSubject)).toBe('CORE');

    const techProSubject: Subject = {
      id: 'sub-welding',
      subject_name: 'Manual Metal Arc Welding',
      grade_level: 'Grade 11',
      category: 'TECH-PRO'
    } as any;
    expect(getSSHSCategory(techProSubject)).toBe('SSHS - TECH-PRO');
  });

  it('populates SSHS Grade 11 template with valid OpenXML structure and student scores', async () => {
    if (!fs.existsSync(templatePath)) return;

    const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));

    const mockClassRecords: ClassRecord[] = [
      {
        id: 'cr-1',
        student_lrn: '100000000001',
        subject_id: 'sub-calculus',
        section_id: 'sec-11-stem',
        quarter: 1,
        school_year: '2026-2027',
        written_works: [18, 19, 20, 18, 19, 20, 18, 19, 20, 18],
        performance_tasks: [45, 48, 47, 49, 50, 48, 47, 49, 50, 48],
        quarterly_exam: 45,
        summative_tests: [28, 29, 45]
      } as any,
      {
        id: 'cr-2',
        student_lrn: '100000000002',
        subject_id: 'sub-calculus',
        section_id: 'sec-11-stem',
        quarter: 1,
        school_year: '2026-2027',
        written_works: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
        performance_tasks: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
        quarterly_exam: 48,
        summative_tests: [30, 30, 48]
      } as any
    ];

    const mockHpsRecords: HPSRecord[] = [
      {
        id: 'hps-1',
        subject_id: 'sub-calculus',
        quarter: 1,
        school_year: '2026-2027',
        written_works: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
        performance_tasks: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
        quarterly_exam: 50,
        summative_tests: [30, 30, 50]
      } as any
    ];

    const zip = await populateSSHSWorkbookZip(templateBuffer, {
      schoolProfile: mockSchoolProfile,
      schoolYear: '2026-2027',
      section: mockSection,
      subject: mockSubject,
      students: mockStudents,
      classRecords: mockClassRecords,
      hpsRecords: mockHpsRecords,
      teacherName: 'EMERSON M. GALANO',
      termBlock: '1ST, 2ND, 3RD',
      numTerms: 3
    });

    // 1. INPUT DATA (sheet2.xml)
    const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
    expect(sheet2Xml).toContain('CALIBUNGAN HIGH SCHOOL');
    expect(sheet2Xml).toContain('STEM 11-A');
    expect(sheet2Xml).toContain('DELA CRUZ, JUAN PROTACIO JR.');
    expect(sheet2Xml).toContain('CLARA, MARIA DE LOS SANTOS');

    // 2. Term 1 (sheet3.xml)
    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
    expect(sheet3Xml).toContain('r="D14"');
    expect(sheet3Xml).toContain('r="Q14"');
    expect(sheet3Xml).toContain('r="AD14"');
    expect(sheet3Xml).toContain('r="AF14"');

    // Student scores in row 17 (Juan Dela Cruz)
    expect(sheet3Xml).toContain('r="D17"');
    expect(sheet3Xml).toContain('r="Q17"');
    expect(sheet3Xml).toContain('r="AD17"');

    // Female student 1 in row 68:
    expect(sheet3Xml).toContain('r="D68"');
    expect(sheet3Xml).toContain('r="Q68"');
    expect(sheet3Xml).toContain('r="AD68"');

    // 3. Workbook calculation mode and clean definedNames
    const wbXml = await zip.file('xl/workbook.xml')!.async('text');
    expect(wbXml).toContain('fullCalcOnLoad="1"');
    expect(wbXml).not.toContain('#REF!');
    expect(wbXml).not.toContain('<externalReferences>');
  });

  it('correctly sorts male and female students alphabetically (Lastname, Firstname Middlename)', async () => {
    if (!fs.existsSync(templatePath)) return;
    const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));

    const unsortedStudents: Student[] = [
      { lrn: '101', first_name: 'Zack', last_name: 'Zulueta', gender: 'Male' } as any,
      { lrn: '102', first_name: 'Aaron', last_name: 'Abad', gender: 'Male' } as any,
      { lrn: '103', first_name: 'Ben', last_name: 'Bautista', middle_name: 'C', gender: 'Male' } as any,
      { lrn: '201', first_name: 'Zara', last_name: 'Zamora', gender: 'Female' } as any,
      { lrn: '202', first_name: 'Bea', last_name: 'Alvarez', gender: 'Female' } as any
    ];

    const zip = await populateSSHSWorkbookZip(templateBuffer, {
      schoolProfile: mockSchoolProfile,
      schoolYear: '2026-2027',
      section: mockSection,
      subject: mockSubject,
      students: unsortedStudents,
      classRecords: [],
      hpsRecords: [],
      teacherName: 'EMERSON M. GALANO'
    });

    const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
    // Row 11: ABAD, AARON
    // Row 12: BAUTISTA, BEN C
    // Row 13: ZULUETA, ZACK
    const posAbad = sheet2Xml.indexOf('ABAD, AARON');
    const posBautista = sheet2Xml.indexOf('BAUTISTA, BEN C');
    const posZulueta = sheet2Xml.indexOf('ZULUETA, ZACK');
    expect(posAbad).toBeGreaterThan(-1);
    expect(posBautista).toBeGreaterThan(posAbad);
    expect(posZulueta).toBeGreaterThan(posBautista);

    // Female: Row 11 -> ALVAREZ, BEA before ZAMORA, ZARA
    const posAlvarez = sheet2Xml.indexOf('ALVAREZ, BEA');
    const posZamora = sheet2Xml.indexOf('ZAMORA, ZARA');
    expect(posAlvarez).toBeGreaterThan(-1);
    expect(posZamora).toBeGreaterThan(posAlvarez);
  });
});
