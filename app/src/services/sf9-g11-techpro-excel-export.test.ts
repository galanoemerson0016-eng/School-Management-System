import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {
  isGrade11TechPro,
  extractGrade11TechProSubjectGrades,
  populateGrade11TechProTemplateBuffer,
  type SF9Grade11TechProExportOptions
} from './sf9-g11-techpro-excel-export';
import type { Student, SchoolProfile, Subject } from '../types';

describe('SF9 Grade 11 Technical-Professional (Tech-Pro) Excel Export Service', () => {
  it('identifies Grade 11 Tech-Pro / TVL track correctly', () => {
    expect(isGrade11TechPro('Grade 11', 'Technical-Professional')).toBe(true);
    expect(isGrade11TechPro('Grade 11', 'TECH-PRO')).toBe(true);
    expect(isGrade11TechPro('Grade 11', 'TVL')).toBe(true);
    expect(isGrade11TechPro('Grade 11', 'TVET')).toBe(true);
    expect(isGrade11TechPro('Grade 11', 'Vocational')).toBe(true);
    expect(isGrade11TechPro('Grade 11', 'SSHS - TECHPRO')).toBe(true);

    // Other tracks/grades must return false
    expect(isGrade11TechPro('Grade 11', 'Academic Track')).toBe(false);
    expect(isGrade11TechPro('Grade 11', 'ACADEMIC')).toBe(false);
    expect(isGrade11TechPro('Grade 12', 'Technical-Professional')).toBe(false);
    expect(isGrade11TechPro('Grade 4', 'Technical-Professional')).toBe(false);
    expect(isGrade11TechPro('Grade 10')).toBe(false);
  });

  it('extracts Grade 11 Tech-Pro subjects accurately (6 Core + 1 Tech-Pro Elective)', () => {
    const mockGradesRecord: Record<string, unknown> = {
      'Effective Communication': [88, 90, 92],
      'Mabisang Komunikasyon': [87, 89, 91],
      'General Mathematics': [85, 88, 90],
      'General Science': [89, 91, 93],
      'Life and Career Skills': [92, 94, 95],
      'Pag-aaral ng Kasaysayan at Lipunang Pilipino': [86, 88, 90],
      'Kitchen Operations': [90, 92, 94],
    };

    const extracted = extractGrade11TechProSubjectGrades(mockGradesRecord);
    expect(extracted.effectiveComm).toEqual([88, 90, 92]);
    expect(extracted.mabisangKom).toEqual([87, 89, 91]);
    expect(extracted.genMath).toEqual([85, 88, 90]);
    expect(extracted.genSci).toEqual([89, 91, 93]);
    expect(extracted.lifeCareer).toEqual([92, 94, 95]);
    expect(extracted.pklp).toEqual([86, 88, 90]);
    expect(extracted.techProElective1).toEqual([90, 92, 94]);
    expect(extracted.elective1Name).toBe('Kitchen Operations');
  });

  it('populates official Grade 11 Tech-Pro template and preserves all 8 worksheets and formulas', async () => {
    const templatePath = path.resolve(__dirname, '../../public/templates/G11 TechPro School Form 9 (SY 26-27).xlsx');
    expect(fs.existsSync(templatePath)).toBe(true);

    const templateBuf = fs.readFileSync(templatePath);

    const student: Student = {
      lrn: '100000000001',
      first_name: 'JUAN',
      last_name: 'DELA CRUZ',
      middle_name: 'SANTOS',
      gender: 'Male',
      birthday: '2009-05-15',
      age: 17,
      address: 'Victoria, Tarlac',
      student_section: 'Diamond',
      grade_level: 'Grade 11'
    };

    const femaleStudent: Student = {
      lrn: '100000000002',
      first_name: 'MARIA',
      last_name: 'CLARA',
      middle_name: 'SANTOS',
      gender: 'Female',
      birthday: '2008-08-14',
      age: 18,
      address: 'Victoria, Tarlac',
      student_section: 'Diamond',
      grade_level: 'Grade 11'
    };

    const schoolProfile: SchoolProfile = {
      name: 'CALIBUNGAN HIGH SCHOOL',
      school_id: '307014',
      division: 'Schools Division of Tarlac Province',
      region: 'REGION III',
      district: 'Victoria East District',
      city: 'Victoria',
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
      'Kitchen Operations': { q1: 91, q2: 93, q3: 95, final: 93 },
    };

    const subjects: Subject[] = [
      { id: 's1', subject_name: 'Effective Communication', grade_level: 'Grade 11' },
      { id: 's2', subject_name: 'Mabisang Komunikasyon', grade_level: 'Grade 11' },
      { id: 's3', subject_name: 'General Mathematics', grade_level: 'Grade 11' },
      { id: 's4', subject_name: 'General Science', grade_level: 'Grade 11' },
      { id: 's5', subject_name: 'Life and Career Skills', grade_level: 'Grade 11' },
      { id: 's6', subject_name: 'Pag-aaral ng Kasaysayan at Lipunang Pilipino', grade_level: 'Grade 11' },
      { id: 's7', subject_name: 'Kitchen Operations', grade_level: 'Grade 11' },
    ];

    const attendance = {
      months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
      schoolDays: [10, 10, 21, 20, 22, 21, 15, 20, 19, 21, 5],
      daysPresent: [10, 10, 20, 20, 22, 21, 14, 20, 19, 20, 5],
      daysAbsent: [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0]
    };

    const opts: SF9Grade11TechProExportOptions = {
      student,
      schoolProfile,
      schoolYear: '2026-2027',
      section: 'Diamond',
      adviser: 'JUAN DELA CRUZ',
      principal: 'MARIA SANTOS, PhD',
      principalTitle: 'Principal IV',
      track: 'Technical-Professional Track',
      grades,
      subjects,
      attendance,
      gradeLevel: 'Grade 11',
      learners: [student, { ...femaleStudent, attendance }]
    };

    const resultBuffer = await populateGrade11TechProTemplateBuffer(templateBuf, opts);
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
      expect(txt).not.toMatch(/<v[^>]*>[\s\S]*?<\/v>\s*<v\/>/);
      expect(txt).not.toMatch(/<v\/>\s*<v[^>]*>/);
      expect(txt).not.toMatch(/<c[^>]*\/>\s*<[fvit]>/);
    }

    // Verify Sheet 2 (INPUT DATA)
    const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
    expect(sheet2Xml).toContain('CALIBUNGAN HIGH SCHOOL');
    expect(sheet2Xml).toContain('307014');
    expect(sheet2Xml).toContain('DELA CRUZ, JUAN SANTOS');
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

    // Verify Sheet 3 (TERM 1 SUMMARY)
    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
    // Male 1 starts at Row 16 (Row 15 is the MALE header bar)
    expect(sheet3Xml).toContain('r="F16"'); // Male 1 LRN (merged F16:G16)
    expect(sheet3Xml).toContain('r="H16"'); // Male 1 Birthday
    expect(sheet3Xml).toContain('r="J16"'); // Male 1 Sex ('M')
    expect(sheet3Xml).toContain('r="K16"'); // Male 1 Combined Term Grade
    expect(sheet3Xml).toContain('r="L16"'); // Male 1 Effective Communication T1
    expect(sheet3Xml).toContain('r="M16"'); // Male 1 Mabisang Komunikasyon T1
    expect(sheet3Xml).toContain('r="R16"'); // Male 1 TechPro Elective 1 T1
    expect(sheet3Xml).toContain('r="F67"'); // Female 1 LRN (Row 66 is the FEMALE header bar, merged F67:G67)
    expect(sheet3Xml).toContain('r="J67"'); // Female 1 Sex ('F')

    // Workbook active tab is set to SF9 (index 5)
    const wbXml = await zip.file('xl/workbook.xml')!.async('text');
    expect(wbXml).toContain('activeTab="5"');

    // Verify Sheet 6 (SF9 - GRADE 11 TechPro)
    const sheet6Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');
    expect(sheet6Xml).not.toContain('<f>#REF!</f>');
    expect(sheet6Xml).not.toContain('<v>#REF!</v>');
    expect(sheet6Xml).not.toContain('#VALUE!');

    expect(sheet6Xml).toContain('DELA CRUZ');
    expect(sheet6Xml).toContain('JUAN');
    expect(sheet6Xml).toContain('100000000001');
    expect(sheet6Xml).toContain('Kitchen Operations'); // Elective 1 name on Row 41

    // Header & Profile
    expect(sheet6Xml).toContain('CALIBUNGAN HIGH SCHOOL');
    expect(sheet6Xml).toContain('r="B9"');
    expect(sheet6Xml).toContain('r="B12"');
    expect(sheet6Xml).toContain('r="B15"');
    expect(sheet6Xml).toMatch(/<c\s+r="A12"[^>]*\/>/);
    expect(sheet6Xml).toMatch(/<c\s+r="A15"[^>]*\/>/);
    expect(sheet6Xml).toContain('r="E19"');

    // Quarterly grades
    expect(sheet6Xml).toContain('r="F34"'); // T1 Effective Communication
    expect(sheet6Xml).toContain('r="F36"'); // T1 General Mathematics

    // Modern Column Layout: Column I Units, Column J Final Grades, Column K Remarks, Column L Weighted Points
    expect(sheet6Xml).toContain('r="I33"'); // Combined Comm Units (6)
    expect(sheet6Xml).toContain('r="I36"'); // Gen Math Units (6)
    expect(sheet6Xml).toContain('r="I41"'); // TechPro Elective 1 Units (12)
    expect(sheet6Xml).toContain('r="I42"'); // Total Units (42)

    // Final Grades formulas in Column J
    expect(sheet6Xml).toContain('ROUND((F33+H33+G33)*(I33/3)/I33,0)'); // Combined Comm Row 33
    expect(sheet6Xml).toContain('ROUND((F36+H36+G36)*(I36/3)/I36,0)'); // Core Subject Row 36
    expect(sheet6Xml).toContain('ROUND((F41+H41+G41)*(I41/3)/I41,0)'); // TechPro Specialization Row 41
    expect(sheet6Xml).toContain('ROUND(L42/I42,0)'); // General Average Final Grade in Row 42

    // Remarks formulas and results in Column K
    expect(sheet6Xml).toContain('IF(J36&gt;=75, &quot;Passed&quot;, &quot;Failed&quot;)');
    expect(sheet6Xml).toContain('MIN(J33,J36:J39,J41)&gt;=85'); // DO 15, s. 2026 check across the 6 learning areas
    expect(sheet6Xml).toContain('Promoted with Academic Excellence Award');
    expect(sheet6Xml).toContain('>Promoted with Academic Excellence Award<');
    expect(sheet6Xml).toContain('>Passed<');
    expect(sheet6Xml).toContain('r="K41" s="44"'); // Non-bold template style 44 for Elective 1 Remarks

    // Weighted Points formulas in Column L
    expect(sheet6Xml).toContain('SUM(L33:L41)'); // Total Weighted Points formula in Row 42
    expect(sheet6Xml).toContain('r="L33"');
    expect(sheet6Xml).toContain('r="L41"');
    expect(sheet6Xml).toContain('r="L42"');

    // Attendance dynamic lookup formulas in Sheet 6
    expect(sheet6Xml).toContain("VLOOKUP(C17,'ATTENDANCE RECORD SUMMARY'!$C$14:$P$114,4,0)");
    expect(sheet6Xml).toContain('SUM(R5:AB6)');
    expect(sheet6Xml).toContain('SUM(R7:AB8)');
    expect(sheet6Xml).toContain('ABS(AC5-AC7)');
    expect(sheet6Xml).toContain('IF(R7=&quot;&quot;,&quot;&quot;,ABS(R5-R7))');

    // Sheet 7 (ATTENDANCE RECORD SUMMARY)
    const sheet7Xml = await zip.file('xl/worksheets/sheet7.xml')!.async('text');
    expect(sheet7Xml).toContain('r="F13"'); // June school days row 13
    expect(sheet7Xml).toContain('r="F14"'); // Student 1 June days present row 14
    expect(sheet7Xml).toContain('r="P13"'); // April school days row 13
    expect(sheet7Xml).toContain('r="P14"'); // Student 1 April days present row 14
    expect(sheet7Xml).toContain('r="F117"'); // Row 117 school days
    expect(sheet7Xml).toContain('r="P117"');

    // Sheet 8 (HELPER)
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

  it('keeps final grades, remarks, general average, and final remarks blank when term grades are incomplete in TechPro', async () => {
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
      student_section: 'TechPro Section A'
    };

    // Only Term 1 grades filled, Term 2 and Term 3 are empty
    const partialGrades: Record<string, { q1?: number; q2?: number; q3?: number; final?: number }> = {
      'Effective Communication': {
        q1: 88
      },
      'Mabisang Komunikasyon': {
        q1: 87
      }
    };

    const subjects: Subject[] = [
      { id: 'effective-comm', subject_name: 'Effective Communication', grade_level: 'Grade 11' },
      { id: 'mabisang-kom', subject_name: 'Mabisang Komunikasyon', grade_level: 'Grade 11' }
    ];

    const opts: SF9Grade11TechProExportOptions = {
      schoolYear: '2026-2027',
      section: 'TechPro Section A',
      adviser: 'JUAN DELA CRUZ',
      student,
      track: 'Technical-Professional Track',
      grades: partialGrades,
      subjects,
      gradeLevel: 'Grade 11',
      learners: [student]
    };

    const templatePath = path.resolve(__dirname, '../../public/templates/G11 TechPro School Form 9 (SY 26-27).xlsx');
    const templateBuf = fs.readFileSync(templatePath);

    const resultBuffer = await populateGrade11TechProTemplateBuffer(templateBuf, opts);
    const zip = await JSZip.loadAsync(resultBuffer);
    const sheet6Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');

    // Term 1 is filled
    expect(sheet6Xml).toContain('r="F34"'); // T1 Effective Comm
    // Final grades (Col J) and points (Col L) are guarded
    expect(sheet6Xml).toContain('ROUND((F33+H33+G33)*(I33/3)/I33,0)');
    expect(sheet6Xml).toContain('ROUND(L42/I42,0)');
    // Cached remarks and final grades should not contain completed results
    expect(sheet6Xml).not.toContain('>Passed<');
    expect(sheet6Xml).not.toContain('>Promoted<');
    expect(sheet6Xml).not.toContain('>Retained<');
    expect(sheet6Xml).not.toMatch(/<c\s+r="J42"[^>]*><f[^>]*>[^<]+<\/f><v>\d+<\/v><\/c>/);
  }, 30000);

  it('preserves clean term summary calculation without unescaped /7 hardcoding', async () => {
    const student: Student = {
      lrn: '119282140004',
      first_name: 'John Michael',
      last_name: 'Malinac',
      gender: 'Male',
      birthday: '2009-10-02',
      age: 16,
      address: 'Tarlac',
      grade_level: 'Grade 11',
      student_section: 'Amethyst'
    };

    const singleSubjectGrade: SF9Grade11TechProExportOptions['grades'] = {
      'techpro-ae1': {
        q1: 67
      }
    };

    const subjects: Subject[] = [
      { id: 'techpro-ae1', subject_name: 'Kitchen Operations', grade_level: 'Grade 11' }
    ];

    const opts: SF9Grade11TechProExportOptions = {
      schoolYear: '2026-2027',
      section: 'Amethyst',
      adviser: 'JAMES KING ALAJID MONTERDE',
      student,
      track: 'TECHPRO',
      grades: singleSubjectGrade,
      subjects,
      gradeLevel: 'Grade 11',
      learners: [student]
    };

    const templatePath = path.resolve(__dirname, '../../public/templates/G11 TechPro School Form 9 (SY 26-27).xlsx');
    const templateBuf = fs.readFileSync(templatePath);

    const resultBuffer = await populateGrade11TechProTemplateBuffer(templateBuf, opts);
    const zip = await JSZip.loadAsync(resultBuffer);
    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');

    // Verify sheet3 does not contain /7 division corruptions
    expect(sheet3Xml).not.toContain('/7,0');
  }, 30000);
});
