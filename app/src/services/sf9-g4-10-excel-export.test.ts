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

  it('populates official Grade 4-10 template with 8 subjects + MAPEH components and preserves all 8 worksheets', async () => {
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

    // Verify all 8 worksheets exist
    for (let i = 1; i <= 8; i++) {
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

    // Sheet 3: TERM 1 SUMMARY (Grades 4-10 on rows 15-64 male, 66-115 female)
    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
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

    // Sheet 4: TERM 2 SUMMARY (Ensures template dummy values like 91 in Q16:Q17 are cleared)
    const sheet4Xml = await zip.file('xl/worksheets/sheet4.xml')!.async('text');
    expect(sheet4Xml).toContain('r="Q15"'); // Male 1 EPP/TLE (has grade 87)
    expect(sheet4Xml).not.toContain('r="Q16" s="84"><v>91</v>'); // Male 2 without grade must NOT retain dummy 91
    expect(sheet4Xml).not.toContain('r="Q17" s="84"><v>91</v>'); // Male 3 without grade must NOT retain dummy 91

    // Sheet 5: TERM 3 SUMMARY
    const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
    expect(sheet5Xml).toContain('r="Q15"'); // Male 1 EPP/TLE (has grade 89)
    expect(sheet5Xml).not.toContain('r="Q16" s="84"><v>91</v>'); // Male 2 without grade must NOT retain dummy 91
    expect(sheet5Xml).not.toContain('r="Q17" s="84"><v>91</v>'); // Male 3 without grade must NOT retain dummy 91

    // Sheet 6: FINAL GRADES
    const sheet6Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');
    expect(sheet6Xml).toContain('JUAN DELA CRUZ');

    // Sheet 7: ATTENDANCE RECORD SUMMARY
    const sheet7Xml = await zip.file('xl/worksheets/sheet7.xml')!.async('text');
    expect(sheet7Xml).toContain('JUAN DELA CRUZ');
    expect(sheet7Xml).toContain('CLARA, MARIA');
    expect(sheet7Xml).toContain('r="F14"'); // Male 1 attendance on Row 14
    expect(sheet7Xml).toContain('r="F65"'); // Female 1 attendance on Row 65

    // Sheet 8: SF9 - GRADE 4-10
    const sheet8Xml = await zip.file('xl/worksheets/sheet8.xml')!.async('text');
    expect(sheet8Xml).toContain('DELA CRUZ, JUAN JR.');
    expect(sheet8Xml).toContain('BACARRA CENTRAL ELEMENTARY SCHOOL'); // B12
    expect(sheet8Xml).toContain('REGION I'); // B7
    expect(sheet8Xml).toContain('100123'); // B10
    expect(sheet8Xml).toContain('MARIA SANTOS, PhD'); // B27, Q41, Q49
    expect(sheet8Xml).toContain('r="K17"'); // Sex on Card
    expect(sheet8Xml).toContain('r="I17"'); // Age on Card
    expect(sheet8Xml).toContain('r="R5" s="566"><v>20</v>'); // Single-row school days
    expect(sheet8Xml).not.toContain('r="R6" s="567"><v>20</v>'); // No duplicated row 6
    expect(sheet8Xml).not.toContain('<f>#REF!</f>');
    expect(sheet8Xml).not.toContain('<v>#REF!</v>');
  }, 15000);

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
    expect(extracted.esp).toEqual([90, 91, 92]);
  });
});
