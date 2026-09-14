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
    // Verify template native styles/outlines are preserved (styles 25, 26, 27 are NOT forced)
    expect(sheet2Xml).toContain('r="L11"');
    expect(sheet2Xml).toContain('r="M11"');
    expect(sheet2Xml).toContain('r="N11"');
    expect(sheet2Xml).toContain('r="Q11"');
    expect(sheet2Xml).toContain('r="R11"');
    expect(sheet2Xml).toContain('r="S11"');
    expect(sheet2Xml).not.toContain('r="L11" s="25"');
    expect(sheet2Xml).not.toContain('r="M11" s="26"');
    expect(sheet2Xml).not.toContain('r="N11" s="27"');
    expect(sheet2Xml).not.toContain('r="Q11" s="25"');
    expect(sheet2Xml).not.toContain('r="R11" s="26"');
    expect(sheet2Xml).not.toContain('r="S11" s="27"');
    // Verify female LRN is in column R and not duplicated to column T
    expect(sheet2Xml).toContain('100000000002');
    const r11Match = sheet2Xml.match(/<row[^>]*r="11"[^>]*>[\s\S]*?<\/row>/);
    expect(r11Match?.[0]).toContain('r="R11"');
    expect(r11Match?.[0]).not.toMatch(/<c\s+r="T11"[^>]*>[\s\S]*?100000000002/);
    // Verify birthdate is written as native DATE formula and serial value (prevents Age ##### / DATEDIF #VALUE!)
    expect(sheet2Xml).toMatch(/<c\s+r="N11"[^>]*><f>DATE\(\d+,\d+,\d+\)<\/f><v>\d+<\/v><\/c>/);
    expect(sheet2Xml).toMatch(/<c\s+r="S11"[^>]*><f>DATE\(\d+,\d+,\d+\)<\/f><v>\d+<\/v><\/c>/);

    // Sheet 3: TERM 1 SUMMARY
    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
    expect(sheet3Xml).not.toContain('t="shared"');
    expect(sheet3Xml).toContain('r="F16"'); // Male 1 LRN
    expect(sheet3Xml).toContain('r="H16"'); // Male 1 Birthday
    expect(sheet3Xml).toContain('r="J16"'); // Male 1 Sex ('M')
    expect(sheet3Xml).toContain('r="K16"'); // Male 1 Term Grade (Combined Effective Comm & Mabisang Kom)
    expect(sheet3Xml).toContain('r="L16"'); // Male 1 Effective Communication
    expect(sheet3Xml).toContain('r="M16"'); // Male 1 Mabisang Komunikasyon
    expect(sheet3Xml).toContain('r="N16"'); // Male 1 General Mathematics
    expect(sheet3Xml).toContain('r="O16"'); // Male 1 General Science
    expect(sheet3Xml).toContain('r="P16"'); // Male 1 Life and Career Skills
    expect(sheet3Xml).toContain('r="Q16"'); // Male 1 PKLP
    expect(sheet3Xml).toContain('r="R16"'); // Male 1 Academic Elective 1
    expect(sheet3Xml).toContain('r="F67"'); // Female 1 LRN
    expect(sheet3Xml).toContain('r="J67"'); // Female 1 Sex ('F')
    expect(sheet3Xml).toContain('r="R67"'); // Female 1 Academic Elective 1

    // Sheet 4: TERM 2 SUMMARY
    const sheet4Xml = await zip.file('xl/worksheets/sheet4.xml')!.async('text');
    expect(sheet4Xml).not.toContain('t="shared"');
    expect(sheet4Xml).toContain('r="K16"');
    expect(sheet4Xml).toContain('r="R16"'); // Male 1 Academic Elective 2
    // Verify Q6 and R6 do NOT contain school year
    expect(sheet4Xml).not.toMatch(/<c\s+r="Q6"[^>]*>[\s\S]*?2026-2027/);
    expect(sheet4Xml).not.toMatch(/<c\s+r="R6"[^>]*>[\s\S]*?2026-2027/);

    // Sheet 5: TERM 3 SUMMARY
    const sheet5Xml = await zip.file('xl/worksheets/sheet5.xml')!.async('text');
    expect(sheet5Xml).not.toContain('t="shared"');
    expect(sheet5Xml).toContain('r="K16"');
    expect(sheet5Xml).toContain('r="R16"'); // Male 1 Academic Elective 3
    // Verify Q6 and R6 do NOT contain school year or rogue F18 formula
    expect(sheet5Xml).not.toMatch(/<c\s+r="Q6"[^>]*>[\s\S]*?2026-2027/);
    expect(sheet5Xml).not.toMatch(/<c\s+r="R6"[^>]*>[\s\S]*?2026-2027/);
    expect(sheet5Xml).not.toMatch(/<c\s+r="R6"[^>]*><f>[^<]*F18/);

    // Workbook active tab is set to SF9 (index 5)
    const wbXml = await zip.file('xl/workbook.xml')!.async('text');
    expect(wbXml).toContain('activeTab="5"');

    // Sheet 6: SF9 - GRADE 11 ACADEMIC (DepEd updated template places SF9 on Sheet 6)
    const sheet6Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');
    // Ensure #REF! and #VALUE! cells are eliminated
    expect(sheet6Xml).not.toContain('<f>#REF!</f>');
    expect(sheet6Xml).not.toContain('<v>#REF!</v>');
    expect(sheet6Xml).not.toContain('#VALUE!');

    // Learner information
    expect(sheet6Xml).toContain('DELA CRUZ');
    expect(sheet6Xml).toContain('JUAN');
    expect(sheet6Xml).toContain('100000000001');
    expect(sheet6Xml).toMatch(/<c\s+r="I17"[^>]*><f>[^<]+<\/f><v>\d+<\/v><\/c>/);
    expect(sheet6Xml).not.toContain('#####');

    // School Profile
    expect(sheet6Xml).toContain('BACARRA NATIONAL COMPREHENSIVE HIGH SCHOOL');
    expect(sheet6Xml).toContain('r="B9"'); // District in B9
    expect(sheet6Xml).toContain('r="B12"'); // School Name in B12
    expect(sheet6Xml).toContain('r="B15"'); // School Year in B15
    expect(sheet6Xml).toMatch(/<c\s+r="A12"[^>]*\/>/); // A12 is empty
    expect(sheet6Xml).toMatch(/<c\s+r="A15"[^>]*\/>/); // A15 is empty
    expect(sheet6Xml).toContain('r="E19"'); // Track in E19
    expect(sheet6Xml).toContain('Pag-aaral ng Kasaysayan at Lipunang Pilipino'); // Fixed typo in B39

    // Learning area grades populated in formula results
    expect(sheet6Xml).toContain('r="F34"'); // T1 Effective Communication
    expect(sheet6Xml).toContain('r="F36"'); // T1 Gen Math

    // Modern Column Layout: Column I Units, Column J Final Grades, Column K Remarks, Column L Weighted Points
    expect(sheet6Xml).toContain('r="I33"'); // Combined Comm Units (6)
    expect(sheet6Xml).toContain('r="I36"'); // Gen Math Units (6)
    expect(sheet6Xml).toContain('r="I41"'); // Elective 1 Units (3)
    expect(sheet6Xml).toContain('r="I44"'); // Total Units (39)

    // Final Grades formulas in Column J
    expect(sheet6Xml).toContain('ROUND((F33+H33+G33)*(I33/3)/I33,0)'); // Combined Communication formula in Row 33
    expect(sheet6Xml).toContain('ROUND((F36+H36+G36)*(I36/3)/I36,0)'); // Core Final Grade formula in Row 36
    expect(sheet6Xml).toContain('ROUND((F41+H41+G41)*I41/I41,0)'); // Elective 1 Final Grade formula in Row 41
    expect(sheet6Xml).toContain('ROUND(L44/I44,0)'); // General Average Final Grade formula in Row 44

    // Remarks formulas and cached results in Column K
    expect(sheet6Xml).toContain('IF(J36&gt;=75, &quot;Passed&quot;, &quot;Failed&quot;)'); // Core Subject Remarks formula
    expect(sheet6Xml).toContain('MIN(J33,J36:J39,J41:J43)&gt;=85'); // Academic Excellence no grade below 85 check
    expect(sheet6Xml).toContain('Promoted with Academic Excellence Award'); // General Average Academic Excellence Remarks formula
    expect(sheet6Xml).toContain('>Promoted with Academic Excellence Award<'); // General Average cached remarks
    expect(sheet6Xml).toContain('>Passed<'); // Core Subject cached remarks
    expect(sheet6Xml).toContain('r="K41" s="86"'); // Elective 1 Remarks formatted with valid template style 86

    // Weighted Points formulas in Column L
    expect(sheet6Xml).toContain('SUM(L33:L43)'); // Total Weighted Points formula in Row 44
    expect(sheet6Xml).toContain('r="L33"');
    expect(sheet6Xml).toContain('r="L44"');

    // Attendance dynamic lookup formulas in Sheet 6
    expect(sheet6Xml).toContain("VLOOKUP(C17,'ATTENDANCE RECORD SUMMARY'!$C$14:$P$114,4,0)");
    expect(sheet6Xml).toContain('SUM(R5:AB6)'); // Attendance sum for Class Days
    expect(sheet6Xml).toContain('SUM(R7:AB8)'); // Attendance sum for Days Present
    expect(sheet6Xml).toContain('ABS(AC5-AC7)'); // Attendance sum for Days Absent
    expect(sheet6Xml).toContain('IF(R7=&quot;&quot;,&quot;&quot;,ABS(R5-R7))'); // Repaired Absent formula in R9

    // Sheet 7: ATTENDANCE RECORD SUMMARY
    const sheet7Xml = await zip.file('xl/worksheets/sheet7.xml')!.async('text');
    expect(sheet7Xml).toContain('DELA CRUZ');
    expect(sheet7Xml).toContain('CLARA, MARIA');
    expect(sheet7Xml).toContain('r="F117"'); // June school days row 117
    expect(sheet7Xml).toContain('r="P117"'); // April school days row 117
    expect(sheet7Xml).toContain('r="F14"'); // Male 1 June attendance
    expect(sheet7Xml).toContain('r="P14"'); // Male 1 April attendance
    expect(sheet7Xml).toContain('r="F65"'); // Female 1 June attendance
    expect(sheet7Xml).toContain('r="P65"'); // Female 1 April attendance

    // Sheet 8: HELPER
    const sheet8Xml = await zip.file('xl/worksheets/sheet8.xml')!.async('text');
    expect(sheet8Xml).toBeDefined();

    // Styles: General Average centered & Bookman Old Style font without quotes
    const stylesXml = await zip.file('xl/styles.xml')!.async('text');
    expect(stylesXml).toContain('<alignment horizontal="center" vertical="center" wrapText="1"/>');
    expect(stylesXml).not.toContain("val=\"'Bookman Old Style'\"");
    expect(stylesXml).not.toContain("val=\"Bookman Old Style'\"");
    expect(stylesXml).toContain('val="Bookman Old Style"');

    // Drawing: Shape 4 placeholder in drawing6.xml replaced with official School Logo pic
    const drawing6Xml = await zip.file('xl/drawings/drawing6.xml')!.async('text');
    expect(drawing6Xml).toContain('name="School Logo"');
    expect(drawing6Xml).not.toContain('name="Shape 4"');
    expect(drawing6Xml).not.toContain('Insert School Logo');
    expect(zip.file('xl/media/school_logo.png')).not.toBeNull();
  }, 30000);

  it('keeps final grades, remarks, and general average blank when term grades are incomplete in G11 Academic', async () => {
    const templatePath = path.resolve(__dirname, '../../public/templates/G11 Academic School Form 9 (SY 26-27).xlsx');
    const templateBuf = fs.readFileSync(templatePath);

    const student: Student = {
      lrn: '100000000001',
      first_name: 'JUAN',
      middle_name: 'SANTOS',
      last_name: 'DELA CRUZ',
      gender: 'Male',
      birthday: '2009-05-15',
      age: 17,
      address: 'Victoria, Tarlac',
      grade_level: 'Grade 11',
      student_section: 'Emerald'
    };

    // Only Term 1 has grades, Term 2 and Term 3 are empty
    const partialGrades: Record<string, { q1?: number; q2?: number; q3?: number; final?: number }> = {
      'Effective Communication': { q1: 88 },
      'Mabisang Komunikasyon': { q1: 87 },
      'General Mathematics': { q1: 85 }
    };

    const subjects: Subject[] = [
      { id: '1', subject_name: 'Effective Communication', grade_level: '11' },
      { id: '2', subject_name: 'Mabisang Komunikasyon', grade_level: '11' },
      { id: '3', subject_name: 'General Mathematics', grade_level: '11' },
    ];

    const opts: SF9Grade11AcademicExportOptions = {
      student,
      schoolYear: '2026-2027',
      section: 'Emerald',
      adviser: 'JUAN DELA CRUZ',
      grades: partialGrades,
      subjects,
      gradeLevel: 'Grade 11',
      learners: [student]
    };

    const resultBuffer = await populateGrade11AcademicTemplateBuffer(templateBuf, opts);
    const zip = await JSZip.loadAsync(resultBuffer);
    const sheet6Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');

    // Term 1 is filled
    expect(sheet6Xml).toContain('r="F34"');
    // Guarded formulas exist
    expect(sheet6Xml).toContain('ROUND((F33+H33+G33)*(I33/3)/I33,0)');
    expect(sheet6Xml).toContain('ROUND(L44/I44,0)');

    // Incomplete final grades and general average should NOT be cached as passed or promoted
    expect(sheet6Xml).not.toContain('>Passed<');
    expect(sheet6Xml).not.toContain('>Promoted<');
    expect(sheet6Xml).not.toContain('>Failed<');
    expect(sheet6Xml).not.toMatch(/<c\s+r="J44"[^>]*><f[^>]*>[^<]+<\/f><v>\d+<\/v><\/c>/);
  });
});
