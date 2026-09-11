import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {
  isGrade12TechPro,
  extractGrade12TechProGrades,
  populateGrade12TechProTemplateBuffer,
  type SF9Grade12TechProExportOptions
} from './sf9-g12-techpro-excel-export';
import type { Student, SchoolProfile, Subject } from '../types';

describe('SF9 Grade 12 Technical-Professional (TechPro / SSHS) Excel Export Service', () => {
  it('identifies Grade 12 TechPro track correctly', () => {
    expect(isGrade12TechPro('Grade 12', 'Technical-Professional Track')).toBe(true);
    expect(isGrade12TechPro('Grade 12', 'TechPro')).toBe(true);
    expect(isGrade12TechPro('Grade 12', 'TVL')).toBe(true);
    expect(isGrade12TechPro('Grade 12', 'TVET')).toBe(true);
    expect(isGrade12TechPro('Grade 12', 'Vocational')).toBe(true);
    expect(isGrade12TechPro('Grade 12', 'SSHS - TECHPRO')).toBe(true);
    expect(isGrade12TechPro('Grade 12', 'SSHS - TechPro Specialization')).toBe(true);
    expect(isGrade12TechPro('Grade 12', 'Technical-Professional')).toBe(true);

    // Other tracks/grades must return false
    expect(isGrade12TechPro('Grade 12', 'Academic Track')).toBe(false);
    expect(isGrade12TechPro('Grade 12', 'STEM')).toBe(false);
    expect(isGrade12TechPro('Grade 12', 'Academic with Cross-Specialization')).toBe(false);
    expect(isGrade12TechPro('Grade 11', 'TechPro')).toBe(false);
    expect(isGrade12TechPro('Grade 10')).toBe(false);
  });

  it('extracts Grade 12 TechPro subjects accurately (TechPro Elective 2, TechPro Elective 3, Work Immersion = 36 Units)', () => {
    const mockGradesRecord: Record<string, unknown> = {
      'TechPro Elective 2': [90, '', ''],
      'TechPro Elective 3': ['', 92, ''],
      'Work Immersion for TechPro Track': ['', '', 94],
    };

    const extracted = extractGrade12TechProGrades(mockGradesRecord);
    expect(extracted.tp2).toBe(90);
    expect(extracted.tp3).toBe(92);
    expect(extracted.wi).toBe(94);
    expect(extracted.remarks).toBe('Passed');
    expect(extracted.honors).toBe('With Honors');
    // Total weighted: 12*90 + 12*92 + 12*94 = 1080 + 1104 + 1128 = 3312
    // General Average: 3312 / 36 = 92
    expect(extracted.generalAverage).toBe(92);
  });

  it('populates official Grade 12 TechPro template and preserves all 6 worksheets, formulas, and 36 units', async () => {
    const templatePath = path.resolve(__dirname, '../../public/templates/G12 TechPro School Form 9 (SY 26-27).xlsx');
    expect(fs.existsSync(templatePath)).toBe(true);

    const templateBuf = fs.readFileSync(templatePath);

    const student: Student = {
      lrn: '100000000001',
      first_name: 'JUAN',
      last_name: 'DELA CRUZ',
      middle_name: 'SANTOS',
      gender: 'Male',
      birthday: '2008-05-15',
      age: 18,
      address: 'Victoria, Tarlac',
      student_section: 'Diamond',
      grade_level: 'Grade 12'
    };

    const femaleStudent: Student = {
      lrn: '100000000002',
      first_name: 'MARIA',
      last_name: 'CLARA',
      middle_name: 'SANTOS',
      gender: 'Female',
      birthday: '2007-08-14',
      age: 19,
      address: 'Victoria, Tarlac',
      student_section: 'Diamond',
      grade_level: 'Grade 12'
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
      grade_levels_offered: 'Grade 12',
      logo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    };

    const grades: Record<string, { q1?: number; q2?: number; q3?: number; final?: number }> = {
      'TechPro Elective 2': { q1: 90, final: 90 },
      'TechPro Elective 3': { q2: 92, final: 92 },
      'Work Immersion for TechPro Track': { q3: 94, final: 94 },
    };

    const subjects: Subject[] = [
      { id: 's1', subject_name: 'TechPro Elective 2', grade_level: 'Grade 12', term: 1 },
      { id: 's2', subject_name: 'TechPro Elective 3', grade_level: 'Grade 12', term: 2 },
      { id: 's3', subject_name: 'Work Immersion for TechPro Track', grade_level: 'Grade 12', term: 3 },
    ];

    const attendance = {
      months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
      schoolDays: [20, 20, 20, 20, 20, 20, 20, 18, 18, 20, 5],
      daysPresent: [20, 19, 20, 20, 19, 20, 20, 18, 18, 20, 5],
      daysAbsent: [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0]
    };

    const opts: SF9Grade12TechProExportOptions = {
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
      gradeLevel: 'Grade 12',
      learners: [student, { ...femaleStudent, attendance }]
    };

    const resultBuffer = await populateGrade12TechProTemplateBuffer(templateBuf, opts);
    expect(resultBuffer).toBeDefined();
    expect(resultBuffer.byteLength).toBeGreaterThan(100000);

    const zip = await JSZip.loadAsync(resultBuffer);

    // Verify all 6 worksheets exist and are free from OpenXML syntax corruptions
    for (let i = 1; i <= 6; i++) {
      const sheetFile = zip.file(`xl/worksheets/sheet${i}.xml`);
      expect(sheetFile).not.toBeNull();
      const txt = await sheetFile!.async('text');
      expect(txt).not.toMatch(/<v[^>]*>[\s\S]*?<\/v>\s*<v\/>/);
      expect(txt).not.toMatch(/<v\/>\s*<v[^>]*>/);
      expect(txt).not.toMatch(/<c[^>]*\/>\s*<[fvit]>/);
    }

    // 1. Verify Sheet 2: INPUT DATA
    const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
    expect(sheet2Xml).toContain('CALIBUNGAN HIGH SCHOOL');
    expect(sheet2Xml).toContain('307014');
    expect(sheet2Xml).toContain('TECHNICAL-PROFESSIONAL');
    expect(sheet2Xml).toContain('GRADE 12');
    expect(sheet2Xml).toContain('DIAMOND');
    expect(sheet2Xml).toContain('DELA CRUZ, JUAN SANTOS');
    expect(sheet2Xml).toContain('CLARA, MARIA SANTOS');

    // 2. Verify Sheet 3: SUMMARY
    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
    // Male 1 in row 16
    expect(sheet3Xml).toContain('r="C16"');
    expect(sheet3Xml).toContain('DELA CRUZ, JUAN SANTOS');
    expect(sheet3Xml).toContain('r="K16"'); // TP2
    expect(sheet3Xml).toContain('r="L16"'); // TP3
    expect(sheet3Xml).toContain('r="M16"'); // WI

    // Female 1 in row 67
    expect(sheet3Xml).toContain('r="C67"');
    expect(sheet3Xml).toContain('CLARA, MARIA SANTOS');
    expect(sheet3Xml).toContain('r="K67"');
    expect(sheet3Xml).toContain('r="L67"');
    expect(sheet3Xml).toContain('r="M67"');

    // 3. Verify Sheet 4: SF9 - GRADE 12 TechPro
    const sheet4Xml = await zip.file('xl/worksheets/sheet4.xml')!.async('text');
    expect(sheet4Xml).toContain('DELA CRUZ, JUAN SANTOS');
    expect(sheet4Xml).toContain('100000000001');

    // Verify 36 Total Units
    expect(sheet4Xml).toMatch(/<c\b[^>]*?\br="I31"[^>]*?>.*?<v>12<\/v>/);
    expect(sheet4Xml).toMatch(/<c\b[^>]*?\br="I32"[^>]*?>.*?<v>12<\/v>/);
    expect(sheet4Xml).toMatch(/<c\b[^>]*?\br="I33"[^>]*?>.*?<v>12<\/v>/);
    expect(sheet4Xml).toMatch(/<c\b[^>]*?\br="I36"[^>]*?>.*?<v>36<\/v>/);

    // Verify Row 36 General Average
    expect(sheet4Xml).toMatch(/<c\b[^>]*?\br="J36"[^>]*?>.*?<v>92<\/v>/);
    expect(sheet4Xml).toMatch(/<c\b[^>]*?\br="K36"[^>]*?>.*?<v>Passed<\/v>/);

    // Verify Guarded Weighted Points in Column L (no unguarded J31*I31)
    expect(sheet4Xml).not.toMatch(/<f>J31\*I31<\/f>/);
    expect(sheet4Xml).not.toContain('#VALUE!');

    // 4. Verify Drawing & School Logo in drawing4.xml
    const drawing4Xml = await zip.file('xl/drawings/drawing4.xml')!.async('text');
    expect(drawing4Xml).toContain('<xdr:pic>');
    expect(drawing4Xml).toContain('SchoolLogo');
    expect(drawing4Xml).not.toContain('Insert School Logo');
  });

  it('handles partial / incomplete grades safely without #VALUE! errors', async () => {
    const templatePath = path.resolve(__dirname, '../../public/templates/G12 TechPro School Form 9 (SY 26-27).xlsx');
    const templateBuf = fs.readFileSync(templatePath);

    const student: Student = {
      lrn: '100000000001',
      first_name: 'JUAN',
      last_name: 'DELA CRUZ',
      gender: 'Male',
      birthday: '2008-05-15',
      age: 18,
      address: 'Victoria, Tarlac',
      grade_level: 'Grade 12'
    };

    // Only Term 1 grades entered; Term 2 and Term 3 blank
    const partialGrades: Record<string, { q1?: number; q2?: number; q3?: number; final?: number }> = {
      'TechPro Elective 2': { q1: 88, final: 88 }
    };

    const subjects: Subject[] = [
      { id: 's1', subject_name: 'TechPro Elective 2', grade_level: 'Grade 12', term: 1 },
      { id: 's2', subject_name: 'TechPro Elective 3', grade_level: 'Grade 12', term: 2 },
      { id: 's3', subject_name: 'Work Immersion for TechPro Track', grade_level: 'Grade 12', term: 3 },
    ];

    const opts: SF9Grade12TechProExportOptions = {
      student,
      schoolYear: '2026-2027',
      section: 'Diamond',
      track: 'Technical-Professional Track',
      grades: partialGrades,
      subjects,
      gradeLevel: 'Grade 12'
    };

    const resultBuffer = await populateGrade12TechProTemplateBuffer(templateBuf, opts);
    const zip = await JSZip.loadAsync(resultBuffer);
    const sf9Xml = await zip.file('xl/worksheets/sheet4.xml')!.async('text');

    // Zero #VALUE! errors
    expect(sf9Xml).not.toContain('#VALUE!');

    // Term 2 and Term 3 final grade cells are blank
    expect(sf9Xml).toMatch(/<c\b[^>]*?\br="J32"[^>]*?><f[^>]*?>.*?<\/f><v\/><\/c>/);
    expect(sf9Xml).toMatch(/<c\b[^>]*?\br="J33"[^>]*?><f[^>]*?>.*?<\/f><v\/><\/c>/);
  });
});
