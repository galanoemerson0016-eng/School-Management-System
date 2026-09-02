import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {
  isGrade11Academic,
  extractGrade11AcademicSubjectGrades,
  populateGrade11AcademicTemplateBuffer,
  type SF9Grade11AcademicExportOptions,
} from './sf9-g11-academic-excel-export';
import type { Student, SchoolProfile, Subject } from '../types';

describe('SF9 Grade 11 Academic Excel Export Service', () => {
  it('identifies Grade 11 Academic grade level formats correctly', () => {
    expect(isGrade11Academic('Grade 11')).toBe(true);
    expect(isGrade11Academic('grade 11')).toBe(true);
    expect(isGrade11Academic('G11')).toBe(true);
    expect(isGrade11Academic('11')).toBe(true);
    expect(isGrade11Academic('Grade 11 - Emerald', 'Academic')).toBe(true);
    expect(isGrade11Academic('Grade 11', 'ACADEMIC TRACK')).toBe(true);
    expect(isGrade11Academic('Grade 11', 'SSHS - ACADEMIC')).toBe(true);

    // Other tracks/grades must return false
    expect(isGrade11Academic('Grade 11', 'Technical-Professional')).toBe(false);
    expect(isGrade11Academic('Grade 11', 'TVET')).toBe(false);
    expect(isGrade11Academic('Grade 12')).toBe(false);
    expect(isGrade11Academic('Grade 4')).toBe(false);
    expect(isGrade11Academic('Grade 10')).toBe(false);
  });

  it('extracts Grade 11 Academic subjects accurately (Core + Academic Electives)', () => {
    const mockGradesRecord: Record<string, unknown> = {
      'Effective Communication': [88, 90, 92],
      'Mabisang Komunikasyon': [87, 89, 91],
      'General Mathematics': [85, 88, 90],
      'General Science': [89, 91, 93],
      'Life and Career Skills': [92, 94, 95],
      'Pag-aaral ng Kasaysayan at Lipunang Pilipino': [86, 88, 90],
      'Academic Elective 1': [90, '', ''],
      'Academic Elective 2': ['', 92, ''],
      'Academic Elective 3': ['', '', 94],
    };

    const extracted = extractGrade11AcademicSubjectGrades(mockGradesRecord);
    expect(extracted.effectiveComm).toEqual([88, 90, 92]);
    expect(extracted.mabisangKom).toEqual([87, 89, 91]);
    expect(extracted.genMath).toEqual([85, 88, 90]);
    expect(extracted.genSci).toEqual([89, 91, 93]);
    expect(extracted.lifeCareer).toEqual([92, 94, 95]);
    expect(extracted.pklp).toEqual([86, 88, 90]);
    expect(extracted.academicElective1).toBe(90);
    expect(extracted.academicElective2).toBe(92);
    expect(extracted.academicElective3).toBe(94);
  });

  it('populates official Grade 11 Academic template and preserves all 8 worksheets and formulas', async () => {
    const templatePath = path.resolve(
      __dirname,
      '../../public/templates/G11 Academic School Form 9 (SY 26-27).xlsx'
    );
    expect(fs.existsSync(templatePath)).toBe(true);

    const templateBuf = fs.readFileSync(templatePath);

    const student: Student = {
      lrn: '100000000001',
      first_name: 'JUAN',
      last_name: 'DELA CRUZ',
      middle_name: 'MENDOZA',
      name_extension: 'JR.',
      gender: 'Male',
      birthday: '2008-05-12',
      age: 16,
      address: 'Bacarra, Ilocos Norte',
      student_section: 'Emerald',
      grade_level: 'Grade 11'
    };

    const femaleStudent: Student = {
      lrn: '100000000002',
      first_name: 'MARIA',
      last_name: 'CLARA',
      middle_name: 'SANTOS',
      gender: 'Female',
      birthday: '2008-08-14',
      age: 16,
      address: 'Bacarra, Ilocos Norte',
      student_section: 'Emerald',
      grade_level: 'Grade 11'
    };

    const schoolProfile: SchoolProfile = {
      name: 'BACARRA NATIONAL COMPREHENSIVE HIGH SCHOOL',
      school_id: '300123',
      division: 'Schools Division of Ilocos Norte',
      region: 'REGION I',
      district: 'Bacarra District',
      city: 'Bacarra',
      head_name: 'MARIA SANTOS, PhD',
      head_position: 'Principal IV',
      grade_levels_offered: 'Grade 11',
      logo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    };

    const grades: Record<string, { q1?: number; q2?: number; q3?: number; final?: number }> = {
      'Effective Communication': { q1: 88, q2: 90, q3: 92, final: 90 },
      'Mabisang Komunikasyon': { q1: 87, q2: 89, q3: 91, final: 89 },
      'General Mathematics': { q1: 85, q2: 88, q3: 90, final: 88 },
      'General Science': { q1: 89, q2: 91, q3: 93, final: 91 },
      'Life and Career Skills': { q1: 92, q2: 94, q3: 95, final: 94 },
      'Pag-aaral ng Kasaysayan at Lipunang Pilipino': { q1: 86, q2: 88, q3: 90, final: 88 },
      'Academic Elective 1': { q1: 91, q2: 0, q3: 0, final: 91 },
      'Academic Elective 2': { q1: 0, q2: 93, q3: 0, final: 93 },
      'Academic Elective 3': { q1: 0, q2: 0, q3: 95, final: 95 },
    };

    const subjects: Subject[] = [
      { id: '1', subject_name: 'Effective Communication', grade_level: '11' },
      { id: '2', subject_name: 'Mabisang Komunikasyon', grade_level: '11' },
      { id: '3', subject_name: 'General Mathematics', grade_level: '11' },
      { id: '4', subject_name: 'General Science', grade_level: '11' },
      { id: '5', subject_name: 'Life and Career Skills', grade_level: '11' },
      { id: '6', subject_name: 'Pag-aaral ng Kasaysayan at Lipunang Pilipino', grade_level: '11' },
      { id: '7', subject_name: 'Academic Elective 1', grade_level: '11' },
      { id: '8', subject_name: 'Academic Elective 2', grade_level: '11' },
      { id: '9', subject_name: 'Academic Elective 3', grade_level: '11' },
    ];

    const attendance = {
      months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
      schoolDays: [10, 10, 21, 20, 22, 21, 15, 20, 19, 21, 5],
      daysPresent: [10, 10, 20, 20, 22, 21, 14, 20, 19, 20, 5],
      daysAbsent: [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0]
    };

    const opts: SF9Grade11AcademicExportOptions = {
      student,
      schoolProfile,
      schoolYear: '2026-2027',
      section: 'Emerald',
      adviser: 'JUAN DELA CRUZ',
      principal: 'MARIA SANTOS, PhD',
      principalTitle: 'Principal IV',
      track: 'ACADEMIC TRACK',
      grades,
      subjects,
      attendance,
      gradeLevel: 'Grade 11',
      learners: [student, { ...femaleStudent, attendance }]
    };

    const resultBuffer = await populateGrade11AcademicTemplateBuffer(templateBuf, opts);
    expect(resultBuffer).toBeDefined();
    expect(resultBuffer.byteLength).toBeGreaterThan(100000);

    const zip = await JSZip.loadAsync(resultBuffer);

    // Verify calcChain.xml removed
    expect(zip.file('xl/calcChain.xml')).toBeNull();
    const relsXml = await zip.file('xl/_rels/workbook.xml.rels')!.async('text');
    expect(relsXml).not.toContain('calcChain.xml');
    const ctXml = await zip.file('[Content_Types].xml')!.async('text');
    expect(ctXml).not.toContain('calcChain.xml');

    // Verify all 8 worksheets exist and are free from OpenXML syntax corruptions
    for (let i = 1; i <= 8; i++) {
      const sheetFile = zip.file(`xl/worksheets/sheet${i}.xml`);
      expect(sheetFile).not.toBeNull();
      const txt = await sheetFile!.async('text');
      
      // No duplicate <v> or self-closing cells followed by child tags
      expect(txt).not.toMatch(/<v[^>]*>[\s\S]*?<\/v>\s*<v\/>/);
      expect(txt).not.toMatch(/<v\/>\s*<v[^>]*>/);
      expect(txt).not.toMatch(/<c[^>]*\/>\s*<[fvit]>/);
    }

    // Sheet 2: INPUT DATA
    const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
    expect(sheet2Xml).toContain('BACARRA NATIONAL COMPREHENSIVE HIGH SCHOOL');
    expect(sheet2Xml).toContain('JUAN DELA CRUZ');
    expect(sheet2Xml).toContain('CLARA, MARIA');
    // Verify rows 11-14 have standardized clean styles (25 left-aligned, 26 center, 27 center)
    expect(sheet2Xml).toContain('r="L11" s="25"');
    expect(sheet2Xml).toContain('r="M11" s="26"');
    expect(sheet2Xml).toContain('r="N11" s="27"');
    expect(sheet2Xml).toContain('r="Q11" s="25"');
    expect(sheet2Xml).toContain('r="R11" s="26"');
    expect(sheet2Xml).toContain('r="S11" s="27"');

    // Sheet 3: TERM 1 SUMMARY
    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
    expect(sheet3Xml).toContain('r="D15"'); // Male 1 LRN
    expect(sheet3Xml).toContain('r="G15"'); // Male 1 Birthday
    expect(sheet3Xml).toContain('r="J15"'); // Male 1 Sex ('M')
    expect(sheet3Xml).toContain('r="K15"'); // Male 1 Effective Communication
    expect(sheet3Xml).toContain('r="Q15"'); // Male 1 Academic Elective 1
    expect(sheet3Xml).toContain('r="D66"'); // Female 1 LRN
    expect(sheet3Xml).toContain('r="J66"'); // Female 1 Sex ('F')

    // Sheet 4: TERM 2 SUMMARY
    const sheet4Xml = await zip.file('xl/worksheets/sheet4.xml')!.async('text');
    expect(sheet4Xml).toContain('r="K15"');
    expect(sheet4Xml).toContain('r="Q15"'); // Male 1 Academic Elective 2

    // Sheet 5: TERM 3 SUMMARY
    const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
    expect(sheet5Xml).toContain('r="K15"');
    expect(sheet5Xml).toContain('r="Q15"'); // Male 1 Academic Elective 3

    // Sheet 6: FINAL GRADES
    const sheet6Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');
    expect(sheet6Xml).toContain('DELA CRUZ');
    expect(sheet6Xml).toContain('CLARA, MARIA');

    // Sheet 7: ATTENDANCE RECORD SUMMARY
    const sheet7Xml = await zip.file('xl/worksheets/sheet7.xml')!.async('text');
    expect(sheet7Xml).toContain('DELA CRUZ');
    expect(sheet7Xml).toContain('CLARA, MARIA');
    expect(sheet7Xml).toContain('r="F13"'); // June school days row 13
    expect(sheet7Xml).toContain('r="P13"'); // April school days row 13
    expect(sheet7Xml).toContain('r="F14"'); // Male 1 June attendance
    expect(sheet7Xml).toContain('r="P14"'); // Male 1 April attendance
    expect(sheet7Xml).toContain('r="F65"'); // Female 1 June attendance
    expect(sheet7Xml).toContain('r="P65"'); // Female 1 April attendance

    // Sheet 8: SF9 - GRADE 11 ACADEMIC
    const sheet8Xml = await zip.file('xl/worksheets/sheet8.xml')!.async('text');
    // Ensure #REF! cells are eliminated
    expect(sheet8Xml).not.toContain('<f>#REF!</f>');
    expect(sheet8Xml).not.toContain('<v>#REF!</v>');
    // Ensure learning area grades are populated in formula results
    expect(sheet8Xml).toContain('r="F34"'); // T1 Effective Communication
    expect(sheet8Xml).toContain('r="F36"'); // T1 Gen Math
    expect(sheet8Xml).toContain('BACARRA NATIONAL COMPREHENSIVE HIGH SCHOOL');
    expect(sheet8Xml).toContain('r="B9"'); // District in B9
    expect(sheet8Xml).toContain('r="B12"'); // School Name in B12
    expect(sheet8Xml).toContain('r="B15"'); // School Year in B15
    expect(sheet8Xml).toMatch(/<c\s+r="A12"[^>]*\/>/); // A12 is empty
    expect(sheet8Xml).toMatch(/<c\s+r="A15"[^>]*\/>/); // A15 is empty
    expect(sheet8Xml).toContain('r="E19"'); // Track in E19

    // Attendance dynamic lookup formulas in Sheet 8
    expect(sheet8Xml).toContain("VLOOKUP(C17,'ATTENDANCE RECORD SUMMARY'!$C$14:$P$114,4,0)");
    expect(sheet8Xml).toContain('IF(OR(R5="",R7=""),"",IF(R5&gt;=R7,R5-R7,0))');
    expect(sheet8Xml).toContain('SUM(R5:AB5)'); // 1D attendance sum for Class Days
    expect(sheet8Xml).toContain('SUM(R7:AB7)'); // 1D attendance sum for Days Present
    expect(sheet8Xml).toContain('SUM(R9:AB9)'); // 1D attendance sum for Days Absent

    // Final Grades & Remarks formulas
    expect(sheet8Xml).toContain('ROUND(AVERAGE(F34:F35),0)'); // Combined Communication formula in Row 33
    expect(sheet8Xml).toContain('ROUND(AVERAGE(F34:H34),0)'); // Core Final Grade formula
    expect(sheet8Xml).toContain('IF(F41="","",F41)'); // Elective 1 Final Grade formula
    expect(sheet8Xml).toContain('ROUND(AVERAGE(I33,I36:I39,I41:I43),0)'); // General Average Final Grade formula
    expect(sheet8Xml).toContain('IF(I34&gt;=75,"Passed","Failed")'); // Core Subject Remarks formula
    expect(sheet8Xml).toContain('MIN(I33,I36:I39,I41:I43)&gt;=85'); // Academic Excellence no grade below 85 check
    expect(sheet8Xml).toContain('Promoted with Academic Excellence Award'); // General Average Academic Excellence Remarks formula
    expect(sheet8Xml).toContain('>Promoted with Academic Excellence Award<'); // General Average cached remarks
    expect(sheet8Xml).toContain('>Passed<'); // Core Subject cached remarks
    expect(sheet8Xml).toContain('r="J41" s="569"'); // Elective 1 Remarks formatted with non-bold style 569

    // Styles: General Average centered & Bookman Old Style font without quotes
    const stylesXml = await zip.file('xl/styles.xml')!.async('text');
    expect(stylesXml).toContain('<alignment horizontal="center" vertical="center" wrapText="1"/>');
    expect(stylesXml).not.toContain("val=\"'Bookman Old Style'\"");
    expect(stylesXml).not.toContain("val=\"Bookman Old Style'\"");
    expect(stylesXml).toContain('val="Bookman Old Style"');

    // Drawing: Shape 4 placeholder replaced with official School Logo pic
    const drawing8Xml = await zip.file('xl/drawings/drawing8.xml')!.async('text');
    expect(drawing8Xml).toContain('name="School Logo"');
    expect(drawing8Xml).not.toContain('name="Shape 4"');
    expect(drawing8Xml).not.toContain('Insert School Logo');
    expect(zip.file('xl/media/school_logo.png')).not.toBeNull();
  }, 30000);
});
