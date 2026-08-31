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

    // Verify all 8 worksheets exist
    for (let i = 1; i <= 8; i++) {
      expect(zip.file(`xl/worksheets/sheet${i}.xml`)).not.toBeNull();
    }

    // Verify Sheet 2 (INPUT DATA)
    const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
    expect(sheet2Xml).toContain('CALIBUNGAN HIGH SCHOOL');
    expect(sheet2Xml).toContain('307014');
    expect(sheet2Xml).toContain('DELA CRUZ, JUAN SANTOS');

    // Verify Sheet 3 (TERM 1 SUMMARY)
    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
    expect(sheet3Xml).toContain('r="K15" s="207"><v>88</v>'); // Effective Communication T1
    expect(sheet3Xml).toContain('r="L15" s="79"><v>87</v>'); // Mabisang Komunikasyon T1
    expect(sheet3Xml).toContain('r="Q15" s="79"><v>91</v>'); // TechPro Elective 1 T1

    // Verify Sheet 8 (SF9 FRONT & BACK)
    const sheet8Xml = await zip.file('xl/worksheets/sheet8.xml')!.async('text');
    expect(sheet8Xml).toContain('DELA CRUZ, JUAN SANTOS');
    expect(sheet8Xml).toContain('100000000001');
    expect(sheet8Xml).toContain('Kitchen Operations'); // Elective 1 name on Row 41

    // Header clean & no #REF!
    expect(sheet8Xml).not.toContain('#REF!');

    // Learning Area 1 (Effective Comm / Mabisang Kom) formulas
    expect(sheet8Xml).toContain('IF(COUNT(F34:F35)=0,"",ROUND(AVERAGE(F34:F35),0))');
    expect(sheet8Xml).toContain('IF(COUNT(G34:G35)=0,"",ROUND(AVERAGE(G34:G35),0))');
    expect(sheet8Xml).toContain('IF(COUNT(H34:H35)=0,"",ROUND(AVERAGE(H34:H35),0))');
    expect(sheet8Xml).toContain('IF(COUNT(F33:H33)=0,"",ROUND(AVERAGE(F33:H33),0))');

    // General Average formula & Remarks
    expect(sheet8Xml).toContain('IF(COUNT(I33,I36:I39,I41)=0,"",ROUND(AVERAGE(I33,I36:I39,I41),0))');
    expect(sheet8Xml).toContain('MIN(I33,I36:I39,I41)>=85'); // DO 15, s. 2026 check
    expect(sheet8Xml).toContain('Promoted with Academic Excellence Award');
    expect(sheet8Xml).toContain('>Passed<');
    expect(sheet8Xml).toContain('r="J41" s="577"'); // Non-bold style 577 for Elective 1 Remarks

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
