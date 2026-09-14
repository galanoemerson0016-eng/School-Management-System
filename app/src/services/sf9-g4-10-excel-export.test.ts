import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {
  isGrade4to10,
  extractGrade4to10GradeNumber,
  formatDateToMMDDYYYY,
  formatLearnerName,
  extractGrade4to10SubjectGrades,
  populateGrade4to10TemplateBuffer,
  type SF9Grade4to10ExportOptions,
} from './sf9-g4-10-excel-export';
import type { Student, SchoolProfile, Subject } from '../types';

describe('Grade 4-10 SF9 Excel Export Service', () => {
  it('correctly detects Grades 4 through 10 and rejects other grades', () => {
    // Valid Grade 4-10 forms
    expect(isGrade4to10('Grade 4')).toBe(true);
    expect(isGrade4to10('Grade 5')).toBe(true);
    expect(isGrade4to10('Grade 6')).toBe(true);
    expect(isGrade4to10('Grade 7')).toBe(true);
    expect(isGrade4to10('Grade 8')).toBe(true);
    expect(isGrade4to10('Grade 9')).toBe(true);
    expect(isGrade4to10('Grade 10')).toBe(true);
    expect(isGrade4to10('GRADE 4 - SAMPAGUITA')).toBe(true);
    expect(isGrade4to10('Grade 7 - Diamond')).toBe(true);
    expect(isGrade4to10('Grade 10 - Rizal')).toBe(true);
    expect(isGrade4to10('G4')).toBe(true);
    expect(isGrade4to10('G7')).toBe(true);
    expect(isGrade4to10('G10')).toBe(true);
    expect(isGrade4to10('4')).toBe(true);
    expect(isGrade4to10('7')).toBe(true);
    expect(isGrade4to10('10')).toBe(true);
    expect(isGrade4to10('Grade IV')).toBe(true);
    expect(isGrade4to10('Grade VII')).toBe(true);
    expect(isGrade4to10('Grade X')).toBe(true);

    // Invalid / other grades
    expect(isGrade4to10('Grade 1')).toBe(false);
    expect(isGrade4to10('Grade 2')).toBe(false);
    expect(isGrade4to10('Grade 3')).toBe(false);
    expect(isGrade4to10('Grade 11')).toBe(false);
    expect(isGrade4to10('Grade 12')).toBe(false);
    expect(isGrade4to10('Kindergarten')).toBe(false);
    expect(isGrade4to10('')).toBe(false);
    expect(isGrade4to10(null)).toBe(false);
    expect(isGrade4to10(undefined)).toBe(false);
  });

  it('correctly extracts numeric grade number for Grades 4-10', () => {
    expect(extractGrade4to10GradeNumber('Grade 4')).toBe(4);
    expect(extractGrade4to10GradeNumber('Grade 7 - Emerald')).toBe(7);
    expect(extractGrade4to10GradeNumber('Grade 10 - Newton')).toBe(10);
    expect(extractGrade4to10GradeNumber('Grade IV')).toBe(4);
    expect(extractGrade4to10GradeNumber('Grade X')).toBe(10);
  });

  it('correctly formats dates to MM/DD/YYYY', () => {
    expect(formatDateToMMDDYYYY('2015-06-15')).toBe('06/15/2015');
    expect(formatDateToMMDDYYYY('2014-11-03')).toBe('11/03/2014');
    expect(formatDateToMMDDYYYY('')).toBe('');
    expect(formatDateToMMDDYYYY(null)).toBe('');
  });

  it('correctly cleans placeholder middle names like hyphens, NA, NONE in formatLearnerName', () => {
    const studentWithHyphen: Student = {
      lrn: '109396180047',
      first_name: 'FRANCE UNO',
      last_name: 'PUMARAS',
      middle_name: '-',
      gender: 'Male',
      birthday: '2013-05-26',
      age: 12,
      address: 'Victoria, Tarlac',
      student_section: 'DADA',
      grade_level: 'Grade 4'
    };
    expect(formatLearnerName(studentWithHyphen)).toBe('PUMARAS, FRANCE UNO');

    const femaleWithHyphen: Student = {
      lrn: '420077180064',
      first_name: 'SHEICY LEE',
      last_name: 'RAFAL',
      middle_name: '-',
      gender: 'Female',
      birthday: '2013-04-20',
      age: 12,
      address: 'Victoria, Tarlac',
      student_section: 'DADA',
      grade_level: 'Grade 4'
    };
    expect(formatLearnerName(femaleWithHyphen)).toBe('RAFAL, SHEICY LEE');
  });

  it('populates official Grade 4-10 template with 8 subjects + MAPEH components and preserves all worksheets', async () => {
    const templatePath = path.resolve(process.cwd(), 'public/templates/G4-10  School Form 9 (SY 26-27).xlsx');
    const templateBuf = fs.readFileSync(templatePath);

    const student: Student = {
      lrn: '100000000001',
      first_name: 'JUAN',
      last_name: 'DELA CRUZ',
      middle_name: 'MENDOZA',
      name_extension: 'JR.',
      gender: 'Male',
      birthday: '2015-05-20',
      age: 10,
      address: 'Bacarra, Ilocos Norte',
      student_section: 'Rizal',
      grade_level: 'Grade 4'
    };

    const femaleStudent: Student = {
      lrn: '100000000002',
      first_name: 'MARIA',
      last_name: 'CLARA',
      middle_name: 'SANTOS',
      gender: 'Female',
      birthday: '2015-08-14',
      age: 10,
      address: 'Bacarra, Ilocos Norte',
      student_section: 'Rizal',
      grade_level: 'Grade 4'
    };

    const schoolProfile: SchoolProfile = {
      name: 'BACARRA CENTRAL ELEMENTARY SCHOOL',
      school_id: '100123',
      division: 'Schools Division of Ilocos Norte',
      region: 'REGION I',
      district: 'Bacarra District',
      city: 'Bacarra',
      head_name: 'MARIA SANTOS, PhD',
      head_position: 'Principal II',
      grade_levels_offered: 'Elementary, JHS'
    };

    const subjects: Subject[] = [
      { id: 'sub-fil', subject_name: 'Filipino', subject_code: 'FIL', grade_level: 'Grade 4' },
      { id: 'sub-eng', subject_name: 'English', subject_code: 'ENG', grade_level: 'Grade 4' },
      { id: 'sub-math', subject_name: 'Mathematics', subject_code: 'MATH', grade_level: 'Grade 4' },
      { id: 'sub-sci', subject_name: 'Science', subject_code: 'SCI', grade_level: 'Grade 4' },
      { id: 'sub-ap', subject_name: 'Araling Panlipunan', subject_code: 'AP', grade_level: 'Grade 4' },
      { id: 'sub-esp', subject_name: 'GMRC / Values Education', subject_code: 'GMRC', grade_level: 'Grade 4' },
      { id: 'sub-epp', subject_name: 'EPP/TLE', subject_code: 'EPP', grade_level: 'Grade 4' },
      { id: 'sub-ma', subject_name: 'Music and Arts', subject_code: 'MA', grade_level: 'Grade 4' },
      { id: 'sub-peh', subject_name: 'Physical Education and Health', subject_code: 'PEH', grade_level: 'Grade 4' }
    ];

    const grades: SF9Grade4to10ExportOptions['grades'] = {
      'sub-fil': { q1: 88, q2: 90, q3: 92, final: 90 },
      'sub-eng': { q1: 87, q2: 89, q3: 91, final: 89 },
      'sub-math': { q1: 91, q2: 93, q3: 95, final: 93 },
      'sub-sci': { q1: 86, q2: 88, q3: 90, final: 88 },
      'sub-ap': { q1: 89, q2: 91, q3: 93, final: 91 },
      'sub-esp': { q1: 94, q2: 95, q3: 96, final: 95 },
      'sub-epp': { q1: 85, q2: 87, q3: 89, final: 87 },
      'sub-ma': { q1: 90, q2: 92, q3: 94, final: 92 },
      'sub-peh': { q1: 92, q2: 94, q3: 96, final: 94 }
    };

    const attendance = {
      months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
      schoolDays: [20, 23, 18, 22, 22, 19, 12, 20, 19, 20, 5],
      daysPresent: [20, 23, 18, 22, 22, 19, 12, 20, 19, 20, 5],
      daysAbsent: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };

    const opts: SF9Grade4to10ExportOptions = {
      student,
      schoolProfile,
      schoolYear: '2026-2027',
      section: 'Rizal',
      adviser: 'JUAN DELA CRUZ',
      principal: 'MARIA SANTOS, PhD',
      principalTitle: 'Principal II',
      grades,
      subjects,
      attendance,
      gradeLevel: 'Grade 4',
      learners: [student, { ...femaleStudent, attendance }]
    };

    const resultBuffer = await populateGrade4to10TemplateBuffer(templateBuf, opts);
    expect(resultBuffer).toBeDefined();
    expect(resultBuffer.byteLength).toBeGreaterThan(100000);

    const zip = await JSZip.loadAsync(resultBuffer);

    // Verify all worksheets exist (official updated DepEd template has 7 worksheets)
    for (let i = 1; i <= 7; i++) {
      expect(zip.file(`xl/worksheets/sheet${i}.xml`)).not.toBeNull();
    }

    // Verify calcChain.xml removed
    expect(zip.file('xl/calcChain.xml')).toBeNull();
    const relsXml = await zip.file('xl/_rels/workbook.xml.rels')!.async('text');
    expect(relsXml).not.toContain('calcChain.xml');
    const ctXml = await zip.file('[Content_Types].xml')!.async('text');
    expect(ctXml).not.toContain('calcChain.xml');

    const wbXml = await zip.file('xl/workbook.xml')!.async('text');
    expect(wbXml).toContain('fullCalcOnLoad="1"');
    expect(wbXml).toContain('forceFullCalc="1"');

    // Sheet 2: INPUT DATA
    const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
    expect(sheet2Xml).toContain('BACARRA CENTRAL ELEMENTARY SCHOOL');
    expect(sheet2Xml).toContain('100000000001');
    expect(sheet2Xml).toContain('r="L11"'); // Male 1 Name
    expect(sheet2Xml).toContain('r="Q11"'); // Female 1 Name
    expect(sheet2Xml).not.toContain('r="T11" s="27"'); // Column T must not have LRN style or duplicate data
    expect(sheet2Xml).not.toContain('r="T11"><v>'); // Column T must not have values
    // Native styles and outlines preserved (not overridden by borderless styles 26, 27, 28)
    expect(sheet2Xml).not.toContain('r="L11" s="26"');
    expect(sheet2Xml).not.toContain('r="M11" s="27"');
    expect(sheet2Xml).not.toContain('r="N11" s="28"');
    expect(sheet2Xml).not.toContain('r="Q11" s="26"');
    expect(sheet2Xml).not.toContain('r="R11" s="27"');
    expect(sheet2Xml).not.toContain('r="S11" s="28"');
    expect(sheet2Xml).toContain('<f>DATE(2015,5,20)</f>');
    expect(sheet2Xml).toContain('<f>DATE(2015,8,14)</f>');

    // Sheet 3: TERM 1 SUMMARY (Grades 4-10 on rows 15-64 male, 66-115 female)
    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
    expect(sheet3Xml).toContain('r="H15"'); // Male 1 Birthday
    expect(sheet3Xml).toContain('r="I15"'); // Male 1 Age
    expect(sheet3Xml).toContain('r="H66"'); // Female 1 Birthday
    expect(sheet3Xml).toContain('r="I66"'); // Female 1 Age
    expect(sheet3Xml).toMatch(/r="I15"[^>]*><f t="shared"[^>]*>[\s\S]*?<\/f><v>10<\/v><\/c>/); // Male 1 Age = 10
    expect(sheet3Xml).toMatch(/r="I66"[^>]*><f t="shared"[^>]*>[\s\S]*?<\/f><v>10<\/v><\/c>/); // Female 1 Age = 10
    expect(sheet3Xml).toContain('r="J15"'); // Male 1 Sex on Row 15
    expect(sheet3Xml).toContain('M');
    expect(sheet3Xml).toContain('r="J66"'); // Female 1 Sex on Row 66
    expect(sheet3Xml).toContain('F');
    expect(sheet3Xml).toContain('r="K15"'); // Male 1 Filipino
    expect(sheet3Xml).toContain('r="L15"'); // Male 1 English
    expect(sheet3Xml).toContain('r="M15"'); // Male 1 Math
    expect(sheet3Xml).toContain('r="N15"'); // Male 1 Science
    expect(sheet3Xml).toContain('r="O15"'); // Male 1 AP
    expect(sheet3Xml).toContain('r="P15"'); // Male 1 GMRC/EsP
    expect(sheet3Xml).toContain('r="Q15"'); // Male 1 EPP/TLE
    expect(sheet3Xml).toContain('r="R15"'); // Male 1 Music & Arts
    expect(sheet3Xml).toContain('r="S15"'); // Male 1 PE & Health
    expect(sheet3Xml).toContain('BACARRA CENTRAL ELEMENTARY SCHOOL');
    // Term 1 MAPEH (T15 = round((90+92)/2) = 91) and General Average
    expect(sheet3Xml).toMatch(/r="T15"[^>]*><f[^>]*>[\s\S]*?<\/f><v>91<\/v><\/c>/);
    expect(sheet3Xml).toMatch(/r="U15"[^>]*><f[^>]*>[\s\S]*?<\/f><v>\d+<\/v><\/c>/);

    // Sheet 4: TERM 2 SUMMARY
    const sheet4Xml = await zip.file('xl/worksheets/sheet4.xml')!.async('text');
    expect(sheet4Xml).toContain('r="Q15"'); // Male 1 EPP/TLE (has grade 87)
    expect(sheet4Xml).not.toContain('r="Q16" s="84"><v>91</v>'); // Male 2 without grade must NOT retain dummy 91
    expect(sheet4Xml).not.toContain('r="Q17" s="84"><v>91</v>'); // Male 3 without grade must NOT retain dummy 91
    const t15Actual = sheet4Xml.match(/<c[^>]*r="T15"[^>]*>[\s\S]*?<\/c>|<c[^>]*r="T15"[^>]*\/>/)?.[0];
    expect(t15Actual).toBe('<c r="T15" s="96"><f>IF(COUNT($R15:$S15)=0,&quot;&quot;,ROUND(AVERAGE(R15:S15),0))</f><v>93</v></c>');
    // General Average in U15 must be present and evaluated
    expect(sheet4Xml).toMatch(/r="U15"[^>]*><f[^>]*>[\s\S]*?<\/f><v>\d+<\/v><\/c>/);
    // Female 1 Term 2 MAPEH formula in T66
    expect(sheet4Xml).toMatch(/r="T66"[^>]*><f[^>]*>[\s\S]*?<\/f>/);

    // Sheet 5: TERM 3 SUMMARY
    const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
    expect(sheet5Xml).toContain('r="Q15"'); // Male 1 EPP/TLE (has grade 89)
    expect(sheet5Xml).not.toContain('r="Q16" s="84"><v>91</v>'); // Male 2 without grade must NOT retain dummy 91
    expect(sheet5Xml).not.toContain('r="Q17" s="84"><v>91</v>'); // Male 3 without grade must NOT retain dummy 91
    // Term 3 MAPEH (T15 = round((94+96)/2) = 95)
    expect(sheet5Xml).toMatch(/r="T15"[^>]*><f[^>]*>[\s\S]*?<\/f><v>95<\/v><\/c>/);

    // Sheet 6: SF9 - GRADE 4-10 (Sheet 6 in updated template)
    const sf9Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');
    // MAPEH grades across Term 1 (F39), Term 2 (G39), Term 3 (H39)
    expect(sf9Xml).toMatch(/r="F39"[^>]*><f>IF\(C17=&quot;&quot;,&quot;&quot;,IFERROR\(IF\(VLOOKUP\(C17,'TERM 1 SUMMARY'!\$C\$15:\$U\$115,18,0\)=0,&quot;&quot;,VLOOKUP\(C17,'TERM 1 SUMMARY'!\$C\$15:\$U\$115,18,0\)\),&quot;&quot;\)\)<\/f><v>91<\/v><\/c>/);
    expect(sf9Xml).toMatch(/r="G39"[^>]*><f>IF\(C17=&quot;&quot;,&quot;&quot;,IFERROR\(IF\(VLOOKUP\(C17,'TERM 2 SUMMARY'!\$C\$15:\$U\$115,18,0\)=0,&quot;&quot;,VLOOKUP\(C17,'TERM 2 SUMMARY'!\$C\$15:\$U\$115,18,0\)\),&quot;&quot;\)\)<\/f><v>93<\/v><\/c>/);
    expect(sf9Xml).toMatch(/r="H39"[^>]*><f>IF\(C17=&quot;&quot;,&quot;&quot;,IFERROR\(IF\(VLOOKUP\(C17,'TERM 3 SUMMARY'!\$C\$15:\$U\$115,18,0\)=0,&quot;&quot;,VLOOKUP\(C17,'TERM 3 SUMMARY'!\$C\$15:\$U\$115,18,0\)\),&quot;&quot;\)\)<\/f><v>95<\/v><\/c>/);
    expect(sf9Xml).toContain('DELA CRUZ, JUAN JR.');
    expect(sf9Xml).toContain('BACARRA CENTRAL ELEMENTARY SCHOOL'); // B12
    expect(sf9Xml).toContain('REGION I'); // B7
    expect(sf9Xml).toContain('100123'); // B10
    expect(sf9Xml).toContain('MARIA SANTOS, PhD'); // B27, Q41, Q49
    expect(sf9Xml).toContain('r="K17"'); // Sex on Card
    expect(sf9Xml).toContain('r="I17"'); // Age on Card
    expect(sf9Xml).toMatch(/r="R5"[^>]*><v>20<\/v>/); // Single-row school days
    expect(sf9Xml).not.toMatch(/r="R6"[^>]*><v>20<\/v>/); // No duplicated row 6
    expect(sf9Xml).not.toContain('<f>#REF!</f>');
    expect(sf9Xml).not.toContain('<v>#REF!</v>');
    expect(sf9Xml).toContain('r="J32"'); // Remarks Column J
    expect(sf9Xml).toContain('Passed');
    expect(sf9Xml).toContain('r="I42"'); // General Average

    // Sheet 7: ATTENDANCE RECORD SUMMARY
    const sheet7Xml = await zip.file('xl/worksheets/sheet7.xml')!.async('text');
    expect(sheet7Xml).toContain('JUAN DELA CRUZ');
    expect(sheet7Xml).toContain('CLARA, MARIA');
    expect(sheet7Xml).toContain('r="F14"'); // Male 1 attendance on Row 14
    expect(sheet7Xml).toContain('r="F65"'); // Female 1 attendance on Row 65

    // Drawings: Drawing 6 exists for SF9 School Logo
    expect(zip.file('xl/drawings/drawing6.xml')).not.toBeNull();
  }, 60000);

  it('correctly matches E.P.P. (with periods) and T.L.E. in extractGrade4to10SubjectGrades', () => {
    const customSubjects: Subject[] = [
      { id: 'sub-1', subject_name: 'E.P.P.', subject_code: '', grade_level: 'Grade 4' },
      { id: 'sub-2', subject_name: 'GMRC (Good Manners and Right Conduct)', subject_code: '', grade_level: 'Grade 4' },
    ];
    const customGrades = {
      'sub-1': { q1: 95, q2: 96, q3: 97, final: 96 },
      'sub-2': { q1: 90, q2: 91, q3: 92, final: 91 },
    };
    const extracted = extractGrade4to10SubjectGrades(customGrades, customSubjects);
    expect(extracted.epp_tle).toEqual([95, 96, 97]);
  });

  it('leaves cells blank without 0 or premature Failed remarks when grades are not yet recorded', async () => {
    const templatePath = path.resolve(process.cwd(), 'public/templates/G4-10  School Form 9 (SY 26-27).xlsx');
    const templateBuffer = fs.readFileSync(templatePath);

    const testStudent: Student = {
      lrn: '100000000001',
      first_name: 'JUAN',
      last_name: 'DELA CRUZ',
      middle_name: 'MENDOZA',
      name_extension: 'JR.',
      gender: 'Male',
      birthday: '2015-05-20',
      age: 10,
      address: 'Bacarra, Ilocos Norte',
      student_section: 'Rizal',
      grade_level: 'Grade 4'
    };

    const testSchoolProfile: SchoolProfile = {
      name: 'BACARRA CENTRAL ELEMENTARY SCHOOL',
      school_id: '100123',
      division: 'Schools Division of Ilocos Norte',
      region: 'REGION I',
      district: 'Bacarra District',
      city: 'Bacarra',
      head_name: 'MARIA SANTOS, PhD',
      head_position: 'Principal II',
      grade_levels_offered: 'Elementary, JHS'
    };

    const testSubjects: Subject[] = [
      { id: 'sub-1', subject_name: 'Filipino', subject_code: 'FIL', grade_level: 'Grade 4' },
      { id: 'sub-2', subject_name: 'English', subject_code: 'ENG', grade_level: 'Grade 4' },
      { id: 'sub-3', subject_name: 'Mathematics', subject_code: 'MATH', grade_level: 'Grade 4' },
      { id: 'sub-4', subject_name: 'Science', subject_code: 'SCI', grade_level: 'Grade 4' },
      { id: 'sub-5', subject_name: 'Araling Panlipunan', subject_code: 'AP', grade_level: 'Grade 4' },
      { id: 'sub-6', subject_name: 'Edukasyon sa Pagpapakatao', subject_code: 'ESP', grade_level: 'Grade 4' },
      { id: 'sub-7', subject_name: 'EPP / TLE', subject_code: 'EPP', grade_level: 'Grade 4' },
      { id: 'sub-8', subject_name: 'Music & Arts', subject_code: 'MA', grade_level: 'Grade 4' },
      { id: 'sub-9', subject_name: 'PE & Health', subject_code: 'PEH', grade_level: 'Grade 4' },
    ];

    // Only Term 1 grades, no Term 2 or 3
    const partialGrades: Record<string, { q1?: number; q2?: number; q3?: number }> = {
      'sub-1': { q1: 88 },
      'sub-2': { q1: 89 },
      'sub-3': { q1: 90 },
      'sub-4': { q1: 85 },
      'sub-5': { q1: 86 },
      'sub-6': { q1: 87 },
      'sub-7': { q1: 91 },
      'sub-8': { q1: 92 },
      'sub-9': { q1: 94 },
    };

    const outBuffer = await populateGrade4to10TemplateBuffer(templateBuffer, {
      student: testStudent,
      schoolProfile: testSchoolProfile,
      gradeLevel: 'Grade 4',
      section: 'Diamond',
      schoolYear: '2026-2027',
      adviser: 'JUANITA DELA CRUZ',
      principal: 'MARIA SANTOS, PhD',
      principalTitle: 'Principal IV',
      grades: partialGrades,
      subjects: testSubjects,
      attendance: {
        months: ['Jun'],
        schoolDays: [20],
        daysPresent: [20],
        daysAbsent: [0],
      },
      learners: [
        testStudent,
        { lrn: '123456789012', first_name: 'PEDRO', last_name: 'PENDUKO', gender: 'Male', birthday: '2015-05-20', age: 10, address: 'Bacarra, Ilocos Norte', grade_level: 'Grade 4' },
      ],
    });

    const zip = await JSZip.loadAsync(outBuffer);
    const sf9Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');

    // Term 1 has grade 88 on F32
    expect(sf9Xml).toMatch(/r="F32"[^>]*><f>[^<]*<\/f><v>88<\/v><\/c>/);
    // Term 2 (G32) and Term 3 (H32) must NOT have <v>0</v>; they must have no value
    expect(sf9Xml).not.toMatch(/r="G32"[^>]*><f>[^<]*<\/f><v>0<\/v><\/c>/);
    expect(sf9Xml).not.toMatch(/r="H32"[^>]*><f>[^<]*<\/f><v>0<\/v><\/c>/);
    expect(sf9Xml).toMatch(/r="G32"[^>]*><f>[^<]*<\/f><\/c>/);
    expect(sf9Xml).toMatch(/r="H32"[^>]*><f>[^<]*<\/f><\/c>/);

    // Final Grade (I32) must be blank, not 29 or 0
    expect(sf9Xml).not.toMatch(/r="I32"[^>]*><f>[^<]*<\/f><v>\d+<\/v><\/c>/);
    expect(sf9Xml).toMatch(/r="I32"[^>]*><f>[^<]*<\/f><\/c>/);

    // Remarks (J32) must be blank, not Failed
    expect(sf9Xml).not.toMatch(/r="J32"[^>]*><f>[^<]*<\/f><v>Failed<\/v><\/c>/);
    expect(sf9Xml).toMatch(/r="J32"[^>]*><f>[^<]*<\/f><\/c>/);

    // General Average (I42) must be blank
    expect(sf9Xml).not.toMatch(/r="I42"[^>]*><f>[^<]*<\/f><v>\d+<\/v><\/c>/);
    expect(sf9Xml).toMatch(/r="I42"[^>]*><f>[^<]*<\/f><\/c>/);

    // Sheet 4 (TERM 2 SUMMARY): Male 1 (Row 15) must not have 0 for MAPEH or Gen Avg
    const sheet4Xml = await zip.file('xl/worksheets/sheet4.xml')!.async('text');
    expect(sheet4Xml).not.toMatch(/r="T15"[^>]*><v>0<\/v>/);
    expect(sheet4Xml).not.toMatch(/r="U15"[^>]*><v>0<\/v>/);

    // Empty student rows (e.g. Male 3 = Row 17) must not have 0 in summary sheet
    expect(sheet4Xml).not.toMatch(/r="K17"[^>]*><v>0<\/v>/);
    expect(sheet4Xml).not.toMatch(/r="U17"[^>]*><v>0<\/v>/);
  });
});
