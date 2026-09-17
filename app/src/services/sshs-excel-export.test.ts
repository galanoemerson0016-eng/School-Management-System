/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  TEMPLATE_SSHS_G11,
  getSSHSCategory,
  getSSHSCluster,
  resolveSSHSMetadata,
  resolveSSHSTerms,
  populateSSHSWorkbookZip
} from './sshs-excel-export';
import type { Section, Subject, Student, SchoolProfile, ClassRecord, HPSRecord } from '../types';

function validateXmlWellFormedness(xmlStr: string, sheetName: string): boolean {
  const tagRegex = /<(\/?[a-zA-Z0-9_:]+)([^>]*?)(\/?)>/g;
  const stack: { name: string; index: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(xmlStr)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    const isSelfClosing = match[3] === '/' || fullTag.endsWith('/>');

    if (tagName.startsWith('?')) continue;
    if (tagName.startsWith('!--')) continue;

    if (tagName.startsWith('/')) {
      const closeName = tagName.slice(1);
      if (stack.length === 0) {
        throw new Error(`[${sheetName}] Unexpected closing tag </${closeName}> at index ${match.index}`);
      }
      const top = stack.pop()!;
      if (top.name !== closeName) {
        throw new Error(`[${sheetName}] Mismatched tag at index ${match.index}: expected </${top.name}>, got </${closeName}>.`);
      }
    } else if (!isSelfClosing) {
      stack.push({ name: tagName, index: match.index });
    }
  }

  if (stack.length > 0) {
    const unclosed = stack.map(s => s.name).join(' -> ');
    throw new Error(`[${sheetName}] Unclosed tags: ${unclosed}`);
  }
  return true;
}

describe('SSHS Electronic Class Record Export Service (Grade 11 & Grade 12)', () => {
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

  const mockSectionG11: Section = {
    id: 'sec-11-stem',
    section_name: 'STEM 11-A',
    section_grade_level: 'Grade 11',
    adviser_name: 'Emerson M. Galano',
    strand: 'STEM',
    track: 'Academic'
  };

  const mockSectionG12: Section = {
    id: 'sec-12-humss',
    section_name: 'HUMSS 12-B',
    section_grade_level: 'Grade 12',
    adviser_name: 'Maria Santos',
    strand: 'HUMSS',
    track: 'Academic'
  };

  const mockSubjectG11: Subject = {
    id: 'sub-calculus',
    subject_name: 'Basic Calculus',
    grade_level: 'Grade 11',
    category: 'ACADEMIC',
    cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS'
  } as any;

  const mockSubjectG12: Subject = {
    id: 'sub-bio-4',
    subject_name: 'Biology 4',
    grade_level: 'Grade 12',
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

  it('correctly maps category, cluster, and terms for SSHS Grade 11 and Grade 12 subjects', () => {
    // Grade 11 Core
    const coreSubject: Subject = {
      id: 'sub-oral-comm',
      subject_name: 'Effective Communication',
      grade_level: 'Grade 11',
      category: 'CORE'
    } as any;
    const metaCore = resolveSSHSMetadata(coreSubject, 11);
    expect(metaCore.category).toBe('SSHS - CORE');
    expect(metaCore.cluster).toBe('CORE');
    expect(metaCore.terms).toBe(3);

    // Grade 11 Academic Elective
    expect(getSSHSCategory(mockSubjectG11, 11)).toBe('SSHS - ACADEMIC');
    expect(getSSHSCluster(mockSubjectG11, 11)).toBe('SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS');

    // Grade 12 Elective
    const metaG12 = resolveSSHSMetadata(mockSubjectG12, 12);
    expect(metaG12.category).toBe('SSHS - ACADEMIC');
    expect(metaG12.terms).toBe(1);

    // Tech-Pro Subject
    const techProSubject: Subject = {
      id: 'sub-caregiving',
      subject_name: 'Caregiving (Adult Care)',
      grade_level: 'Grade 11',
      category: 'TECH-PRO'
    } as any;
    expect(getSSHSCategory(techProSubject, 11)).toBe('SSHS - TECH-PRO');
  });

  it('populates SSHS Grade 11 template with valid OpenXML structure, pre-calculated score caches, and zero XML errors', async () => {
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
        quarterly_exam: 50,
        summative_tests: [30, 30, 50]
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
      section: mockSectionG11,
      subject: mockSubjectG11,
      students: mockStudents,
      classRecords: mockClassRecords,
      hpsRecords: mockHpsRecords,
      teacherName: 'EMERSON M. GALANO',
      termBlock: '1ST, 2ND, 3RD',
      numTerms: 3
    });

    // 1. Verify XML well-formedness of all 7 sheets
    const sheetFiles = [
      'xl/worksheets/sheet1.xml',
      'xl/worksheets/sheet2.xml',
      'xl/worksheets/sheet3.xml',
      'xl/worksheets/sheet4.xml',
      'xl/worksheets/sheet5.xml',
      'xl/worksheets/sheet6.xml',
      'xl/worksheets/sheet7.xml'
    ];

    for (const sheetPath of sheetFiles) {
      const xml = await zip.file(sheetPath)!.async('text');
      expect(validateXmlWellFormedness(xml, sheetPath)).toBe(true);
      expect(xml).not.toContain('t="e"');
      expect(xml).not.toContain('>#VALUE!<');
    }

    // 2. INPUT DATA (sheet2.xml)
    const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
    expect(sheet2Xml).toContain('CALIBUNGAN HIGH SCHOOL');
    expect(sheet2Xml).toContain('STEM 11-A');
    expect(sheet2Xml).toContain('DELA CRUZ, JUAN PROTACIO JR.');
    expect(sheet2Xml).toContain('CLARA, MARIA DE LOS SANTOS');

    // 3. Term 1 (sheet3.xml) scores and pre-computed values
    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
    expect(sheet3Xml).toContain('r="D14"');
    expect(sheet3Xml).toContain('r="Q14"');
    expect(sheet3Xml).toContain('r="AD14"');
    expect(sheet3Xml).toContain('r="AF14"');

    // Student scores in row 17 (Juan Dela Cruz)
    expect(sheet3Xml).toContain('r="D17"');
    expect(sheet3Xml).toContain('r="Q17"');
    expect(sheet3Xml).toContain('r="AD17"');

    // Formula cached values are populated: N17 (WW Total), O17 (WW PS), P17 (WW WS)
    expect(sheet3Xml).toMatch(/<c r="N17"[^>]*><f[^>]*>.*?<\/f><v>\d+<\/v><\/c>/);
    expect(sheet3Xml).toMatch(/<c r="AM17"[^>]*><f[^>]*>.*?<\/f><v>\d+<\/v><\/c>/);
    expect(sheet3Xml).toContain('HELPER!$B$7:$B$47');
    expect(sheet3Xml).toContain('HELPER!$C$7:$C$47');

    // B8 is cleared and never #VALUE!
    expect(sheet3Xml).not.toContain('>#VALUE!<');

    // 4. FINAL GRADES (sheet6.xml)
    const sheet6Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');
    expect(sheet6Xml).toContain('DELA CRUZ, JUAN PROTACIO JR.');
    expect(sheet6Xml).toContain('CLARA, MARIA DE LOS SANTOS');
    // Learner rows have pre-computed values in E (Term 1)
    expect(sheet6Xml).toMatch(/<c r="E17"[^>]*><f[^>]*>.*?<\/f><v>\d+<\/v><\/c>/);
    // Final grade formula reflects DepEd's updated ROUND(AVERAGE(E17:G17),0)
    expect(sheet6Xml).toContain('ROUND(AVERAGE(E17:G17),0)');

    // 5. Workbook calculation mode and clean definedNames
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
      section: mockSectionG11,
      subject: mockSubjectG11,
      students: unsortedStudents,
      classRecords: [],
      hpsRecords: [],
      teacherName: 'EMERSON M. GALANO'
    });

    const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
    const posAbad = sheet2Xml.indexOf('ABAD, AARON');
    const posBautista = sheet2Xml.indexOf('BAUTISTA, BEN C');
    const posZulueta = sheet2Xml.indexOf('ZULUETA, ZACK');
    expect(posAbad).toBeGreaterThan(-1);
    expect(posBautista).toBeGreaterThan(posAbad);
    expect(posZulueta).toBeGreaterThan(posBautista);

    const posAlvarez = sheet2Xml.indexOf('ALVAREZ, BEA');
    const posZamora = sheet2Xml.indexOf('ZAMORA, ZARA');
    expect(posAlvarez).toBeGreaterThan(-1);
    expect(posZamora).toBeGreaterThan(posAlvarez);
  });

  it('handles Grade 12 SSHS Elective and sets INCORRECT SHEET on inactive term sheets', async () => {
    if (!fs.existsSync(templatePath)) return;
    const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));

    // Biology 4 is a 1-term elective in Grade 12 (offered in Term 1)
    const zip = await populateSSHSWorkbookZip(templateBuffer, {
      schoolProfile: mockSchoolProfile,
      schoolYear: '2026-2027',
      section: mockSectionG12,
      subject: mockSubjectG12,
      students: mockStudents,
      classRecords: [],
      hpsRecords: [],
      teacherName: 'MARIA SANTOS',
      termBlock: 'FIRST TERM',
      numTerms: 1
    });

    // 1. INPUT DATA (sheet2.xml) reflects Grade 12
    const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
    expect(sheet2Xml).toMatch(/<c r="F24"[^>]*><v>12<\/v><\/c>/);
    expect(sheet2Xml).toContain('HUMSS 12-B');

    // 2. Term 1 (active) has empty B8 cached value
    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
    const b8InSheet3 = sheet3Xml.match(/<c r="B8"[^>]*>[\s\S]*?<\/c>/)?.[0] || '';
    expect(b8InSheet3).not.toContain('<v>INCORRECT SHEET');
    expect(b8InSheet3).toContain('<v/>');

    // 3. Term 2 & Term 3 (inactive) display official INCORRECT SHEET warning in B8 cached value
    const sheet4Xml = await zip.file('xl/worksheets/sheet4.xml')!.async('text');
    const b8InSheet4 = sheet4Xml.match(/<c r="B8"[^>]*>[\s\S]*?<\/c>/)?.[0] || '';
    expect(b8InSheet4).toContain('<v>INCORRECT SHEET. Do not use this sheet to input data.</v>');

    const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
    const b8InSheet5 = sheet5Xml.match(/<c r="B8"[^>]*>[\s\S]*?<\/c>/)?.[0] || '';
    expect(b8InSheet5).toContain('<v>INCORRECT SHEET. Do not use this sheet to input data.</v>');

    // 4. HELPER sheet has F7 set to 12
    const sheet7Xml = await zip.file('xl/worksheets/sheet7.xml')!.async('text');
    expect(sheet7Xml).toMatch(/<c r="F7"[^>]*><v>12<\/v><\/c>/);
    expect(sheet7Xml).not.toContain('t="e"');
  });

  it('inspects sheet6 rows when only 1 male and 1 female exist', async () => {
    if (!fs.existsSync(templatePath)) return;
    const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));
    const students: Student[] = [
      { lrn: '101101202601', first_name: 'DAVID ALEXANDER', last_name: 'LICAUCO', middle_name: 'L', gender: 'Male' } as any,
      { lrn: '101101202602', first_name: 'BARBARA', last_name: 'FORTEZA', middle_name: 'A', gender: 'Female' } as any
    ];

    const zip = await populateSSHSWorkbookZip(templateBuffer, {
      schoolProfile: null,
      schoolYear: '2026-2027',
      section: { id: '1', section_name: 'STEM - NEWTON', section_grade_level: 'Grade 11' } as any,
      subject: { id: '2', subject_name: 'Effective Communication', grade_level: 'Grade 11' } as any,
      students,
      classRecords: [],
      hpsRecords: [],
      teacherName: 'EMERSON M. GALANO',
      numTerms: 3
    });

    const s6 = await zip.file('xl/worksheets/sheet6.xml')!.async('text');
    
    // Male row 17 (individual formula)
    const r17 = s6.match(/<row[^>]*r="17"[^>]*>[\s\S]*?<\/row>/)?.[0] || '';
    expect(r17).toContain('ROUND(AVERAGE(E17:G17),0)');
    expect(r17).toContain('LICAUCO, DAVID ALEXANDER L');

    // Male row 18 (shared formula master)
    const r18 = s6.match(/<row[^>]*r="18"[^>]*>[\s\S]*?<\/row>/)?.[0] || '';
    expect(r18).toContain('si="0"');
    expect(r18).toContain('ROUND(AVERAGE(E18:G18),0)');

    // Male row 19 (shared formula slave - must retain si="0" and not be stripped)
    const r19 = s6.match(/<row[^>]*r="19"[^>]*>[\s\S]*?<\/row>/)?.[0] || '';
    expect(r19).toContain('<f t="shared" si="0"/>');

    // Female row 68 (individual formula)
    const r68 = s6.match(/<row[^>]*r="68"[^>]*>[\s\S]*?<\/row>/)?.[0] || '';
    expect(r68).toContain('ROUND(AVERAGE(E68:G68),0)');
    expect(r68).toContain('FORTEZA, BARBARA A');

    // Female row 69 (shared formula master)
    const r69 = s6.match(/<row[^>]*r="69"[^>]*>[\s\S]*?<\/row>/)?.[0] || '';
    expect(r69).toContain('si="2"');

    // Female row 70 (shared formula slave)
    const r70 = s6.match(/<row[^>]*r="70"[^>]*>[\s\S]*?<\/row>/)?.[0] || '';
    expect(r70).toContain('<f t="shared" si="2"/>');
  });

  it('verifies updated DepEd weights for Humanities and Social Sciences (20/50/30) vs Studio Arts (20/60/20)', () => {
    // Humanities & Social Sciences: 20/50/30
    const humssSubj = { subject_name: 'Citizenship and Civic Engagement' } as Subject;
    const humssMeta = resolveSSHSMetadata(humssSubj, 11);
    expect(humssMeta.weights.ww).toBe(20);
    expect(humssMeta.weights.pt).toBe(50);
    expect(humssMeta.weights.ex).toBe(30);

    const litSubj = { subject_name: 'Contemporary Literature 1' } as Subject;
    const litMeta = resolveSSHSMetadata(litSubj, 11);
    expect(litMeta.weights.pt).toBe(50);
    expect(litMeta.weights.ex).toBe(30);

    const filSubj = { subject_name: 'Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)' } as Subject;
    const filMeta = resolveSSHSMetadata(filSubj, 11);
    expect(filMeta.weights.pt).toBe(50);
    expect(filMeta.weights.ex).toBe(30);

    const philSubj = { subject_name: 'Introduction to the Philosophy of the Human Person' } as Subject;
    const philMeta = resolveSSHSMetadata(philSubj, 11);
    expect(philMeta.weights.pt).toBe(50);
    expect(philMeta.weights.ex).toBe(30);

    // Studio / Performance Arts: remain 20/60/20
    const artSubj = { subject_name: 'Art Criticism and Creative Markets' } as Subject;
    const artMeta = resolveSSHSMetadata(artSubj, 11);
    expect(artMeta.weights.ww).toBe(20);
    expect(artMeta.weights.pt).toBe(60);
    expect(artMeta.weights.ex).toBe(20);

    const danceSubj = { subject_name: 'Creative Industries - Dance' } as Subject;
    const danceMeta = resolveSSHSMetadata(danceSubj, 11);
    expect(danceMeta.weights.ww).toBe(20);
    expect(danceMeta.weights.pt).toBe(60);
    expect(danceMeta.weights.ex).toBe(20);
  });

  it('accurately resolves SSHS terms based on core status, section metadata, class records, and curriculum defaults', () => {
    // 1. Grade 11 Core subjects are ALWAYS 3 terms
    const coreSubj = { id: 'c1', subject_name: 'General Mathematics' } as Subject;
    expect(resolveSSHSTerms(coreSubj, undefined, undefined, undefined, '2026-2027')).toEqual({
      numTerms: 3,
      termBlock: '',
      termDesc: '1ST, 2ND, 3RD',
      code: 33
    });

    // 2. Section metadata subjectTerms takes precedence for electives
    const chemSubj = { id: 'chem-1', subject_name: 'Chemistry 1' } as Subject;
    const sectionWithMeta = {
      id: 'sec-acad-a',
      section_name: 'Academic A',
      section_grade_level: 'Grade 11',
      section_metadata: {
        subjectTerms: {
          'Chemistry 1': 1
        }
      }
    } as Section;
    expect(resolveSSHSTerms(chemSubj, sectionWithMeta, undefined, undefined, '2026-2027')).toEqual({
      numTerms: 1,
      termBlock: 'FIRST TERM',
      termDesc: '1ST',
      code: 11
    });

    // 3. Subject term field
    const chemWithTerm2 = { id: 'chem-2', subject_name: 'Chemistry 2', term: 2 } as Subject;
    expect(resolveSSHSTerms(chemWithTerm2, undefined, undefined, undefined, '2026-2027')).toEqual({
      numTerms: 1,
      termBlock: 'SECOND TERM',
      termDesc: '2ND',
      code: 12
    });

    // 4. Encoded grades in classRecords (e.g. quarter 1 has scores)
    const mockClassRecords: ClassRecord[] = [
      {
        id: 'cr-chem-1',
        student_lrn: '100000000001',
        subject_id: 'chem-1',
        quarter: 1,
        school_year: '2026-2027',
        written_works: [16, 12, 48]
      } as any
    ];
    expect(resolveSSHSTerms(chemSubj, undefined, mockClassRecords, undefined, '2026-2027')).toEqual({
      numTerms: 1,
      termBlock: 'FIRST TERM',
      termDesc: '1ST',
      code: 11
    });

    // 5. Default curriculum sequence (Chemistry 1 -> Term 1, Chemistry 2 -> Term 2)
    expect(resolveSSHSTerms({ subject_name: 'Chemistry 1' } as Subject, undefined, undefined, undefined, '2026-2027')).toEqual({
      numTerms: 1,
      termBlock: 'FIRST TERM',
      termDesc: '1ST',
      code: 11
    });
    expect(resolveSSHSTerms({ subject_name: 'Chemistry 2' } as Subject, undefined, undefined, undefined, '2026-2027')).toEqual({
      numTerms: 1,
      termBlock: 'SECOND TERM',
      termDesc: '2ND',
      code: 12
    });
  });

  it('correctly exports a 1-term Grade 11 subject (Chemistry 1 in First Term) with scores, active Term 1, and no INCORRECT SHEET on Term 1', async () => {
    if (!fs.existsSync(templatePath)) return;
    const templateBuffer = new Uint8Array(fs.readFileSync(templatePath));

    const chem1Subj: Subject = {
      id: 'sub-chem-1',
      subject_name: 'Chemistry 1',
      grade_level: 'Grade 11',
      term: 1
    } as any;

    const acadASection: Section = {
      id: 'sec-acad-a',
      section_name: 'Academic A',
      section_grade_level: 'Grade 11',
      section_metadata: {
        subjectTerms: {
          'Chemistry 1': 1
        }
      }
    } as any;

    const classRecords: ClassRecord[] = [
      {
        id: 'cr-chem-1',
        student_lrn: '100000000001',
        subject_id: 'sub-chem-1',
        quarter: 1,
        school_year: '2026-2027',
        written_works: [16, 12, 48, 8, 19],
        performance_tasks: [88],
        summative_tests: [17, 13, 46],
        quarterly_exam: 46,
        final_grade: 82
      } as any
    ];

    const hpsRecords: HPSRecord[] = [
      {
        id: 'hps-chem-1',
        subject_id: 'sub-chem-1',
        quarter: 1,
        school_year: '2026-2027',
        written_works: [20, 12, 55, 10, 30],
        performance_tasks: [100],
        summative_tests: [30, 30, 60],
        quarterly_exam: 50
      } as any
    ];

    const zip = await populateSSHSWorkbookZip(templateBuffer, {
      schoolProfile: mockSchoolProfile,
      schoolYear: '2026-2027',
      section: acadASection,
      subject: chem1Subj,
      students: mockStudents,
      classRecords,
      hpsRecords,
      teacherName: 'EMERSON M. GALANO'
    });

    // 1. INPUT DATA (sheet2.xml) H33 is 'FIRST TERM'
    const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
    expect(sheet2Xml).toContain('FIRST TERM');
    expect(sheet2Xml).not.toContain('>THIRD TERM<');

    // 2. HELPER (sheet7.xml) F23 is 11, G23 is '1ST'
    const sheet7Xml = await zip.file('xl/worksheets/sheet7.xml')!.async('text');
    expect(sheet7Xml).toMatch(/<c r="F23"[^>]*>[\s\S]*?<v>11<\/v><\/c>/);
    expect(sheet7Xml).toMatch(/<c r="G23"[^>]*>[\s\S]*?<v>1ST<\/v><\/c>/);

    // 3. Term 1 (sheet3.xml) is ACTIVE: B8 cached value is empty (<v/>), scores populated
    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
    const b8InSheet3 = sheet3Xml.match(/<c r="B8"[^>]*>[\s\S]*?<\/c>/)?.[0] || '';
    expect(b8InSheet3).not.toContain('<v>INCORRECT SHEET');
    expect(b8InSheet3).toContain('<v/>');
    expect(sheet3Xml).toContain('r="D14"'); // HPS WW1
    expect(sheet3Xml).toContain('r="D17"'); // Student WW1 (16)

    // 4. Term 2 & Term 3 (sheet4.xml, sheet5.xml) are INACTIVE: B8 warns INCORRECT SHEET
    const sheet4Xml = await zip.file('xl/worksheets/sheet4.xml')!.async('text');
    const b8InSheet4 = sheet4Xml.match(/<c r="B8"[^>]*>[\s\S]*?<\/c>/)?.[0] || '';
    expect(b8InSheet4).toContain('INCORRECT SHEET. Do not use this sheet to input data.');

    const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
    const b8InSheet5 = sheet5Xml.match(/<c r="B8"[^>]*>[\s\S]*?<\/c>/)?.[0] || '';
    expect(b8InSheet5).toContain('INCORRECT SHEET. Do not use this sheet to input data.');

    // 5. FINAL GRADES (sheet6.xml) has Term 1 grade pre-computed in column E
    const sheet6Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');
    expect(sheet6Xml).toMatch(/<c r="E17"[^>]*><f[^>]*>.*?<\/f><v>\d+<\/v><\/c>/);
  });
});


