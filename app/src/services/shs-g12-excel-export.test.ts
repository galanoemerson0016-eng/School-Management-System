/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  TEMPLATE_SHS_G12,
  TEMPLATE_SHS_G12_UPDATED,
  resolveSHSG12Track,
  populateSHSG12WorkbookZip,
  getSHSG12Descriptor
} from './shs-g12-excel-export';
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

describe('SHS Grade 12 E-Class Record Export Service', () => {
  const templatesDir = path.resolve(__dirname, '../../public/templates');
  const templatePath = path.join(templatesDir, TEMPLATE_SHS_G12);

  const mockSchoolProfile: SchoolProfile = {
    school_id: '301051',
    name: 'Olongapo City National High School',
    region: 'Region III',
    division: 'Olongapo City',
    district: 'West',
    head_name: 'Dr. Principal',
    head_position: 'School Principal IV',
    grade_levels_offered: 'Grade 11, Grade 12'
  };

  const mockSection: Section = {
    id: 'sec-12-stem',
    section_name: 'STEM 12-A',
    section_grade_level: 'Grade 12',
    adviser_name: 'Emerson M. Galano',
    strand: 'STEM',
    track: 'Academic'
  };

  const mockSubject: Subject = {
    id: 'sub-pr2',
    subject_name: 'Practical Research 2',
    grade_level: 'Grade 12',
    category: 'APPLIED'
  } as any;

  const mockStudents: Student[] = [
    {
      lrn: '100000000001',
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      middle_name: 'Protacio',
      name_extension: 'Jr.',
      gender: 'Male',
      birthday: '2008-01-01',
      age: 18,
      address: 'Olongapo City',
      grade_level: 'Grade 12',
      student_section: 'sec-12-stem'
    },
    {
      lrn: '100000000002',
      first_name: 'Pedro',
      last_name: 'Penduko',
      middle_name: 'Santos',
      gender: 'Male',
      birthday: '2008-02-02',
      age: 18,
      address: 'Olongapo City',
      grade_level: 'Grade 12',
      student_section: 'sec-12-stem'
    },
    {
      lrn: '200000000001',
      first_name: 'Maria',
      last_name: 'Clara',
      middle_name: 'De Los Santos',
      gender: 'Female',
      birthday: '2008-03-03',
      age: 18,
      address: 'Olongapo City',
      grade_level: 'Grade 12',
      student_section: 'sec-12-stem'
    }
  ];

  const mockHpsRecords: HPSRecord[] = [
    {
      id: 'hps-t1',
      subject_id: 'sub-pr2',
      section_id: 'sec-12-stem',
      school_year: '2026-2027',
      quarter: 1,
      written_works: [20, 25, 20, 15, 20], // WW 1..5
      performance_tasks: [50, 40, 50, 30, 0, 0, 0, 0, 0, 0], // PT 1..10
      quarterly_exam: 50, // TE in AD
      summative_tests: [30, 35, 50] // ST1=30 (-> WW6), ST2=35 (-> WW7), TE=50
    } as any
  ];

  const mockClassRecords: ClassRecord[] = [
    {
      id: 'rec-m1-t1',
      student_lrn: '100000000001',
      section_id: 'sec-12-stem',
      subject_id: 'sub-pr2',
      school_year: '2026-2027',
      quarter: 1,
      written_works: [18, 22, 19, 14, 18], // WW 1..5
      performance_tasks: [45, 38, 46, 28, '', '', '', '', '', ''],
      quarterly_exam: 45, // TE
      summative_tests: [27, 32, 45] // ST1=27 (-> WW6), ST2=32 (-> WW7)
    } as any,
    {
      id: 'rec-f1-t1',
      student_lrn: '200000000001',
      section_id: 'sec-12-stem',
      subject_id: 'sub-pr2',
      school_year: '2026-2027',
      quarter: 1,
      written_works: [19, 24, 20, 15, 19], // WW 1..5
      performance_tasks: [48, 40, 49, 30, '', '', '', '', '', ''],
      quarterly_exam: 48, // TE
      summative_tests: [29, 34, 48] // ST1=29 (-> WW6), ST2=34 (-> WW7)
    } as any
  ];

  it('verifies that the official Grade 12 template exists and has valid size', () => {
    expect(fs.existsSync(templatePath)).toBe(true);
    const stats = fs.statSync(templatePath);
    expect(stats.size).toBeGreaterThan(400000);
  });

  it('accurately resolves Grade 12 track dropdown options', () => {
    // 1. Core Subject
    expect(resolveSHSG12Track('Academic', 'General Mathematics', 'CORE'))
      .toBe('CORE SUBJECT (ALL TRACKS)');

    // 2. Work Immersion / Culminating Activity
    expect(resolveSHSG12Track('Academic', 'Work Immersion', 'APPLIED'))
      .toBe('WORK IMMERSION/ CULMINATING ACTIVITY (FOR ACADEMIC TRACK)');
    expect(resolveSHSG12Track('Academic', 'Practical Research 2', 'APPLIED'))
      .toBe('WORK IMMERSION/ CULMINATING ACTIVITY (FOR ACADEMIC TRACK)');

    // 3. TVL Track
    expect(resolveSHSG12Track('TVL - ICT', 'Computer Systems Servicing', 'SPECIALIZED'))
      .toBe('TVL/ SPORTS/ ARTS AND DESIGN TRACK');

    // 4. Academic Track Other
    expect(resolveSHSG12Track('Academic', 'Basic Calculus', 'SPECIALIZED'))
      .toBe('ACADEMIC TRACK (EXCEPT IMMERSION)');
  });

  it('populates Grade 12 workbook zip with relocated ST1/ST2 as WW6/WW7 and single Term Exam', async () => {
    const templateBuffer = fs.readFileSync(templatePath);
    const populatedZip = await populateSHSG12WorkbookZip(templateBuffer, {
      schoolProfile: mockSchoolProfile,
      schoolYear: '2026-2027',
      section: mockSection,
      subject: mockSubject,
      students: mockStudents,
      classRecords: mockClassRecords,
      hpsRecords: mockHpsRecords,
      teacherName: 'Emerson M. Galano',
      numTerms: 3
    });

    // 1. Check INPUT DATA (sheet2.xml)
    const s2Xml = await populatedZip.file('xl/worksheets/sheet2.xml')!.async('string');
    expect(s2Xml).toContain('Region III');
    expect(s2Xml).toContain('OLONGAPO CITY');
    expect(s2Xml).toContain('301051');
    expect(s2Xml).toContain('OLONGAPO CITY NATIONAL HIGH SCHOOL');
    expect(s2Xml).toContain('<v>2026</v>');
    expect(s2Xml).toContain('EMERSON M. GALANO');
    expect(s2Xml).toContain('<v>12</v>');
    expect(s2Xml).toContain('STEM 12-A');
    expect(s2Xml).toContain('PRACTICAL RESEARCH 2');

    // Male student in row 11: DELA CRUZ, JUAN PROTACIO JR.
    expect(s2Xml).toContain('100000000001');
    expect(s2Xml).toContain('DELA CRUZ, JUAN PROTACIO JR.');

    // Female student in row 11: CLARA, MARIA DE LOS SANTOS
    expect(s2Xml).toContain('200000000001');
    expect(s2Xml).toContain('CLARA, MARIA DE LOS SANTOS');

    // 2. Check Term 1 (sheet3.xml)
    const s3Xml = await populatedZip.file('xl/worksheets/sheet3.xml')!.async('string');

    // Row 14: Highest Possible Scores
    // WW 1..5
    expect(s3Xml).toContain('<c r="D14"');
    expect(s3Xml).toContain('<c r="H14"');
    // WW 6 (ST1 HPS = 30)
    expect(s3Xml).toMatch(/<c r="I14"[^>]*><v>30<\/v><\/c>/);
    // WW 7 (ST2 HPS = 35)
    expect(s3Xml).toMatch(/<c r="J14"[^>]*><v>35<\/v><\/c>/);
    // PT 1 HPS = 50 (col Q)
    expect(s3Xml).toMatch(/<c r="Q14"[^>]*><v>50<\/v><\/c>/);
    // Term Exam HPS = 50 (col AD)
    expect(s3Xml).toMatch(/<c r="AD14"[^>]*><v>50<\/v><\/c>/);

    // Row 17: Male 1 scores
    // WW 1 = 18
    expect(s3Xml).toMatch(/<c r="D17"[^>]*><v>18<\/v><\/c>/);
    // WW 6 (ST1 score = 27)
    expect(s3Xml).toMatch(/<c r="I17"[^>]*><v>27<\/v><\/c>/);
    // WW 7 (ST2 score = 32)
    expect(s3Xml).toMatch(/<c r="J17"[^>]*><v>32<\/v><\/c>/);
    // PT 1 = 45 (col Q)
    expect(s3Xml).toMatch(/<c r="Q17"[^>]*><v>45<\/v><\/c>/);
    // Term Exam = 45 (col AD)
    expect(s3Xml).toMatch(/<c r="AD17"[^>]*><v>45<\/v><\/c>/);

    // Row 68: Female 1 scores
    // WW 1 = 19
    expect(s3Xml).toMatch(/<c r="D68"[^>]*><v>19<\/v><\/c>/);
    // WW 6 (ST1 score = 29)
    expect(s3Xml).toMatch(/<c r="I68"[^>]*><v>29<\/v><\/c>/);
    // WW 7 (ST2 score = 34)
    expect(s3Xml).toMatch(/<c r="J68"[^>]*><v>34<\/v><\/c>/);
    // Term Exam = 48 (col AD)
    expect(s3Xml).toMatch(/<c r="AD68"[^>]*><v>48<\/v><\/c>/);

    // 3. Verify calculated grades in Term 1 (sheet3.xml)
    // B8 is cleared of #VALUE!
    expect(s3Xml).not.toContain('#VALUE!');
    // WW HPS total in N14
    expect(s3Xml).toMatch(/<c r="N14"[^>]*><f>SUM\(D14:M14\)<\/f><v>\d+<\/v><\/c>/);
    // PT HPS total in AA14
    expect(s3Xml).toMatch(/<c r="AA14"[^>]*><f>SUM\(Q14:Z14\)<\/f><v>\d+<\/v><\/c>/);
    // Student 1 Initial Grade in AG17
    expect(s3Xml).toMatch(/<c r="AG17"[^>]*><f[^>]*>[\s\S]*?<\/f><v>\d+(\.\d+)?<\/v><\/c>/);
    // Student 1 Term Grade in AH17
    expect(s3Xml).toMatch(/<c r="AH17"[^>]*><f[^>]*>[\s\S]*?<\/f><v>\d+<\/v><\/c>/);

    // 4. Verify FINAL GRADES (sheet6.xml)
    const s6Xml = await populatedZip.file('xl/worksheets/sheet6.xml')!.async('string');
    expect(s6Xml).toContain('STEM 12-A');
    expect(s6Xml).toContain('EMERSON M. GALANO');
    // G13 has numTerms (3) and I13 has termDesc
    expect(s6Xml).toMatch(/<c r="G13"[^>]*><f>HELPER!G22<\/f><v>3<\/v><\/c>/);
    expect(s6Xml).toMatch(/<c r="I13"[^>]*><f[^>]*>[\s\S]*?<\/f><v>1ST, 2ND, 3RD<\/v><\/c>/);
    // E16, F16, G16 are all 1 for 3-term
    expect(s6Xml).toMatch(/<c r="E16"[^>]*><f[^>]*>[\s\S]*?<\/f><v>1<\/v><\/c>/);
    expect(s6Xml).toMatch(/<c r="F16"[^>]*><f[^>]*>[\s\S]*?<\/f><v>1<\/v><\/c>/);
    expect(s6Xml).toMatch(/<c r="G16"[^>]*><f[^>]*>[\s\S]*?<\/f><v>1<\/v><\/c>/);

    // 5. Verify clean calcChain and externalLinks removal
    expect(populatedZip.file('xl/calcChain.xml')).toBeNull();
    expect(populatedZip.file('xl/externalLinks/externalLink1.xml')).toBeNull();

    // 6. Verify fullCalcOnLoad="1" and forceFullCalc="1" in workbook.xml
    const wbXml = await populatedZip.file('xl/workbook.xml')!.async('string');
    expect(wbXml).toContain('fullCalcOnLoad="1"');
    expect(wbXml).toContain('forceFullCalc="1"');
    expect(wbXml).not.toContain('<externalReferences');
    expect(wbXml).not.toContain('<externalReference');
    expect(wbXml).not.toContain('#REF!');
    expect(wbXml).not.toContain('[1]');

    // 7. Verify XML well-formedness for all sheets and workbook
    for (const sheetName of ['sheet1.xml', 'sheet2.xml', 'sheet3.xml', 'sheet4.xml', 'sheet5.xml', 'sheet6.xml', 'sheet7.xml']) {
      const sheetContent = await populatedZip.file(`xl/worksheets/${sheetName}`)!.async('string');
      expect(() => validateXmlWellFormedness(sheetContent, sheetName)).not.toThrow();
    }
    expect(() => validateXmlWellFormedness(wbXml, 'workbook.xml')).not.toThrow();

    // 8. Verify no t="e" error attributes exist in sheet7.xml or sheet2.xml
    const s7Xml = await populatedZip.file('xl/worksheets/sheet7.xml')!.async('string');
    expect(s7Xml).not.toMatch(/<c r="F23"[^>]*t="e"/);
    expect(s2Xml).not.toMatch(/<c r="I34"[^>]*t="e"/);

    // 9. Verify AA17 and AB17 in sheet3, 4, 5 are well-formed and retain formula
    for (const sName of ['sheet3.xml', 'sheet4.xml', 'sheet5.xml']) {
      const sXml = await populatedZip.file(`xl/worksheets/${sName}`)!.async('string');
      expect(sXml).toMatch(/<c r="AA17"[^>]*><f[^>]*>IF\(COUNT\(Q17:Z17\)=0,"",SUM\(Q17:Z17\)\)<\/f>(<v\/>|<v>\d+<\/v>)<\/c>/);
      expect(sXml).toMatch(/<c r="AB17"[^>]*><f>IFERROR\(IF\(AA17="","",ROUND\(AA17\/AA\$14\*AB\$14,2\)\),""\)<\/f>/);
    }
  });

  it('populates the revised Grade 12 template with ST1/ST2/TE in the new columns', async () => {
    const revisedTemplatePath = path.join(templatesDir, TEMPLATE_SHS_G12_UPDATED);
    const templateBuffer = fs.readFileSync(revisedTemplatePath);
    const populatedZip = await populateSHSG12WorkbookZip(templateBuffer, {
      schoolProfile: mockSchoolProfile,
      schoolYear: '2026-2027',
      section: mockSection,
      subject: mockSubject,
      students: mockStudents,
      classRecords: mockClassRecords,
      hpsRecords: mockHpsRecords,
      teacherName: 'Emerson M. Galano',
      numTerms: 3
    });

    const termXml = await populatedZip.file('xl/worksheets/sheet3.xml')!.async('string');
    expect(termXml).toMatch(/<c r="AD17"[^>]*><v>27<\/v><\/c>/);
    expect(termXml).toMatch(/<c r="AE17"[^>]*><v>32<\/v><\/c>/);
    expect(termXml).toMatch(/<c r="AF17"[^>]*><v>45<\/v><\/c>/);
    expect(termXml).toMatch(/<c r="AL17"[^>]*><f[^>]*>[\s\S]*?<\/f><v>\d+(\.\d+)?<\/v><\/c>/);
    expect(termXml).toMatch(/<c r="AM17"[^>]*><f[^>]*>[\s\S]*?<\/f><v>\d+<\/v><\/c>/);
    expect(termXml).not.toMatch(/<c r="I17"[^>]*><v>27<\/v><\/c>/);
    expect(termXml).not.toMatch(/<c r="J17"[^>]*><v>32<\/v><\/c>/);
    expect(termXml).not.toContain('[2]');
  });

  it('correctly resolves terms and exports 1-term subject like HOPE 3 with dynamic term detection', async () => {
    const hopeSubject: Subject = {
      id: 'sub-hope-3',
      subject_name: 'Health Optimizing Physical Education and Health 3',
      grade_level: 'Grade 12',
      category: 'CORE'
    } as any;

    const hopeHps: HPSRecord[] = [
      {
        id: 'hps-hope-t1',
        subject_id: 'sub-hope-3',
        section_id: 'sec-12-stem',
        school_year: '2026-2027',
        quarter: 1,
        written_works: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        performance_tasks: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        quarterly_exam: 5
      } as any
    ];

    const hopeClassRecords: ClassRecord[] = [
      {
        id: 'rec-hope-m1',
        student_lrn: '100000000001',
        section_id: 'sec-12-stem',
        subject_id: 'sub-hope-3',
        school_year: '2026-2027',
        quarter: 1,
        written_works: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        performance_tasks: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
        quarterly_exam: 5
      } as any
    ];

    const templateBuffer = fs.readFileSync(templatePath);
    const populatedZip = await populateSHSG12WorkbookZip(templateBuffer, {
      schoolProfile: mockSchoolProfile,
      schoolYear: '2026-2027',
      section: mockSection,
      subject: hopeSubject,
      students: mockStudents,
      classRecords: hopeClassRecords,
      hpsRecords: hopeHps,
      teacherName: 'Emerson M. Galano'
    });

    // 1. INPUT DATA verifies numTerms is 1 and termBlock is FIRST TERM
    const s2Xml = await populatedZip.file('xl/worksheets/sheet2.xml')!.async('string');
    expect(s2Xml).toMatch(/<c r="F33"[^>]*><v>1<\/v><\/c>/);
    expect(s2Xml).toMatch(/<c r="H33"[^>]*t="inlineStr"><is><t>FIRST TERM<\/t><\/is><\/c>/);

    // 2. Term 1 verifies no #VALUE!, HPS totals, and student initial/term grade
    const s3Xml = await populatedZip.file('xl/worksheets/sheet3.xml')!.async('string');
    expect(s3Xml).not.toContain('#VALUE!');
    expect(s3Xml).toMatch(/<c r="N14"[^>]*><f>SUM\(D14:M14\)<\/f><v>50<\/v><\/c>/);
    expect(s3Xml).toMatch(/<c r="AA14"[^>]*><f>SUM\(Q14:Z14\)<\/f><v>50<\/v><\/c>/);
    // Student Initial Grade in AG17 is 100
    expect(s3Xml).toMatch(/<c r="AG17"[^>]*><f[^>]*>[\s\S]*?<\/f><v>100<\/v><\/c>/);
    // Student Term Grade in AH17 is 100
    expect(s3Xml).toMatch(/<c r="AH17"[^>]*><f[^>]*>[\s\S]*?<\/f><v>100<\/v><\/c>/);

    // 3. FINAL GRADES verifies NO. OF TERMS is 1, TERM BLOCKS is 1ST, and Final Grade is 100
    const s6Xml = await populatedZip.file('xl/worksheets/sheet6.xml')!.async('string');
    expect(s6Xml).toMatch(/<c r="G13"[^>]*><f>HELPER!G22<\/f><v>1<\/v><\/c>/);
    expect(s6Xml).toMatch(/<c r="I13"[^>]*><f[^>]*>[\s\S]*?<\/f><v>1ST<\/v><\/c>/);
    // E16 is 1, F16 and G16 are 0
    expect(s6Xml).toMatch(/<c r="E16"[^>]*><f[^>]*>[\s\S]*?<\/f><v>1<\/v><\/c>/);
    expect(s6Xml).toMatch(/<c r="F16"[^>]*><f[^>]*>[\s\S]*?<\/f><v>0<\/v><\/c>/);
    expect(s6Xml).toMatch(/<c r="G16"[^>]*><f[^>]*>[\s\S]*?<\/f><v>0<\/v><\/c>/);
    // Term 1 Grade in E17 is 100
    expect(s6Xml).toMatch(/<c r="E17"[^>]*><f[^>]*>[\s\S]*?<\/f><v>100<\/v><\/c>/);
    // Final Grade in H17 is 100
    expect(s6Xml).toMatch(/<c r="H17"[^>]*><f[^>]*>[\s\S]*?<\/f><v>100<\/v><\/c>/);
    // Descriptor is Advancing, Remark is PASSED
    expect(s6Xml).toMatch(/<c r="I17"[^>]*><f[^>]*>[\s\S]*?<\/f><v>Advancing<\/v><\/c>/);
    expect(s6Xml).toMatch(/<c r="J17"[^>]*><f[^>]*>[\s\S]*?<\/f><v>PASSED<\/v><\/c>/);

    // 4. Verify XML well-formedness for all sheets in 1-term HOPE 3 export
    for (const sheetName of ['sheet1.xml', 'sheet2.xml', 'sheet3.xml', 'sheet4.xml', 'sheet5.xml', 'sheet6.xml', 'sheet7.xml']) {
      const sheetContent = await populatedZip.file(`xl/worksheets/${sheetName}`)!.async('string');
      expect(() => validateXmlWellFormedness(sheetContent, sheetName)).not.toThrow();
    }

    // 5. Verify no t="e" error attributes exist in sheet7.xml F23 or sheet2.xml I34
    const s7Xml = await populatedZip.file('xl/worksheets/sheet7.xml')!.async('string');
    expect(s7Xml).not.toMatch(/<c r="F23"[^>]*t="e"/);
    expect(s2Xml).not.toMatch(/<c r="I34"[^>]*t="e"/);

    // 6. Verify AA17 and AB17 in Term 1 (sheet3.xml) are well-formed and valid
    expect(s3Xml).toMatch(/<c r="AA17"[^>]*><f[^>]*>IF\(COUNT\(Q17:Z17\)=0,"",SUM\(Q17:Z17\)\)<\/f><v>50<\/v><\/c>/);
    expect(s3Xml).toMatch(/<c r="AB17"[^>]*><f>IFERROR\(IF\(AA17="","",ROUND\(AA17\/AA\$14\*AB\$14,2\)\),""\)<\/f>/);
  });

  it('exports STEM Einstein HOPE 3 with multiple students and verifies 100% clean OpenXML structure', async () => {
    const stemSection: Section = {
      id: 'sec-einstein',
      section_name: 'STEM - Einstein',
      section_grade_level: 'Grade 12',
      adviser_name: 'Maria Santos',
      strand: 'STEM',
      track: 'Academic'
    };

    const hope3Subject: Subject = {
      id: 'sub-hope3-einstein',
      subject_name: 'Health Optimizing Physical Education and Health 3',
      grade_level: 'Grade 12',
      category: 'CORE'
    } as any;

    const tenStudents: Student[] = [
      { lrn: '123456789001', first_name: 'Albert', last_name: 'Einstein', gender: 'Male' },
      { lrn: '123456789002', first_name: 'Isaac', last_name: 'Newton', gender: 'Male' },
      { lrn: '123456789003', first_name: 'Galileo', last_name: 'Galilei', gender: 'Male' },
      { lrn: '123456789004', first_name: 'Nikola', last_name: 'Tesla', gender: 'Male' },
      { lrn: '123456789005', first_name: 'Niels', last_name: 'Bohr', gender: 'Male' },
      { lrn: '223456789001', first_name: 'Marie', last_name: 'Curie', gender: 'Female' },
      { lrn: '223456789002', first_name: 'Rosalind', last_name: 'Franklin', gender: 'Female' },
      { lrn: '223456789003', first_name: 'Ada', last_name: 'Lovelace', gender: 'Female' },
      { lrn: '223456789004', first_name: 'Lise', last_name: 'Meitner', gender: 'Female' },
      { lrn: '223456789005', first_name: 'Chien-Shiung', last_name: 'Wu', gender: 'Female' }
    ] as any;

    const hpsRecords: HPSRecord[] = [
      {
        id: 'hps-1',
        subject_id: 'sub-hope3-einstein',
        school_year: '2026-2027',
        quarter: 1,
        written_works: [20, 20, 20, 20, 20],
        performance_tasks: [25, 25, 25, 25],
        quarterly_exam: 50
      } as any
    ];

    const classRecords: ClassRecord[] = tenStudents.map((s, idx) => ({
      id: `cr-${s.lrn}`,
      student_lrn: s.lrn,
      subject_id: 'sub-hope3-einstein',
      school_year: '2026-2027',
      quarter: 1,
      written_works: [18 + (idx % 3), 19, 17, 18, 20],
      performance_tasks: [24, 23, 25, 22],
      quarterly_exam: 45 + (idx % 5)
    })) as any;

    const templateBuffer = fs.readFileSync(templatePath);
    const populatedZip = await populateSHSG12WorkbookZip(templateBuffer, {
      schoolProfile: mockSchoolProfile,
      schoolYear: '2026-2027',
      section: stemSection,
      subject: hope3Subject,
      students: tenStudents,
      classRecords,
      hpsRecords,
      teacherName: 'Maria Santos'
    });

    // 1. Validate well-formedness of all sheets
    for (let i = 1; i <= 7; i++) {
      const xml = await populatedZip.file(`xl/worksheets/sheet${i}.xml`)!.async('string');
      expect(() => validateXmlWellFormedness(xml, `sheet${i}.xml`)).not.toThrow();
    }
    const wbXml = await populatedZip.file('xl/workbook.xml')!.async('string');
    expect(() => validateXmlWellFormedness(wbXml, 'workbook.xml')).not.toThrow();

    // 2. Validate row 17 of Term 1, 2, 3 sheets
    for (let i = 3; i <= 5; i++) {
      const xml = await populatedZip.file(`xl/worksheets/sheet${i}.xml`)!.async('string');
      expect(xml).toMatch(/<c r="AA17"[^>]*><f[^>]*>IF\(COUNT\(Q17:Z17\)=0,"",SUM\(Q17:Z17\)\)<\/f>/);
      expect(xml).toMatch(/<c r="AB17"[^>]*><f>IFERROR\(IF\(AA17="","",ROUND\(AA17\/AA\$14\*AB\$14,2\)\),""\)<\/f>/);
    }

    // 3. Validate sheet7.xml has no t="e"
    const s7Xml = await populatedZip.file('xl/worksheets/sheet7.xml')!.async('string');
    expect(s7Xml).not.toContain('t="e"');

    // 4. Validate sheet2.xml has no t="e"
    const s2Xml = await populatedZip.file('xl/worksheets/sheet2.xml')!.async('string');
    expect(s2Xml).not.toContain('t="e"');

    // 5. Validate FINAL GRADES (sheet6.xml) has student grades
    const s6Xml = await populatedZip.file('xl/worksheets/sheet6.xml')!.async('string');
    // First male student (Einstein) should have Term 1 grade
    expect(s6Xml).toMatch(/<c r="E17"[^>]*><f[^>]*>[\s\S]*?<\/f><v>\d+<\/v><\/c>/);
    // Final grade in H17
    expect(s6Xml).toMatch(/<c r="H17"[^>]*><f[^>]*>[\s\S]*?<\/f><v>\d+<\/v><\/c>/);
    // Passed remark in J17
    expect(s6Xml).toMatch(/<c r="J17"[^>]*><f[^>]*>[\s\S]*?<\/f><v>PASSED<\/v><\/c>/);
    // First female student (Curie in row 68) should have Term 1 grade
    expect(s6Xml).toMatch(/<c r="E68"[^>]*><f[^>]*>[\s\S]*?<\/f><v>\d+<\/v><\/c>/);
    expect(s6Xml).toMatch(/<c r="H68"[^>]*><f[^>]*>[\s\S]*?<\/f><v>\d+<\/v><\/c>/);
    expect(s6Xml).toMatch(/<c r="J68"[^>]*><f[^>]*>[\s\S]*?<\/f><v>PASSED<\/v><\/c>/);
  });

  describe('getSHSG12Descriptor', () => {
    it('accurately maps grades to official DepEd qualitative descriptors', () => {
      expect(getSHSG12Descriptor(95)).toBe('Advancing');
      expect(getSHSG12Descriptor(90)).toBe('Advancing');
      expect(getSHSG12Descriptor(89)).toBe('Benchmarking');
      expect(getSHSG12Descriptor(82)).toBe('Benchmarking');
      expect(getSHSG12Descriptor(80)).toBe('Benchmarking');
      expect(getSHSG12Descriptor(79)).toBe('Connecting');
      expect(getSHSG12Descriptor(75)).toBe('Connecting');
      expect(getSHSG12Descriptor(74)).toBe('Developing');
      expect(getSHSG12Descriptor(70)).toBe('Developing');
      expect(getSHSG12Descriptor(65)).toBe('Developing');
      expect(getSHSG12Descriptor(64)).toBe('Emerging');
      expect(getSHSG12Descriptor(60)).toBe('Emerging');
      expect(getSHSG12Descriptor('')).toBe('');
    });
  });
});
