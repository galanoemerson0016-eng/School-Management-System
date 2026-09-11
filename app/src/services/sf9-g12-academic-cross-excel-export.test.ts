import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {
  isGrade12AcademicCross,
  extractGrade12AcademicCrossGrades,
  populateGrade12AcademicCrossTemplateBuffer,
  type SF9Grade12AcademicCrossExportOptions
} from './sf9-g12-academic-cross-excel-export';
import type { Student, SchoolProfile, Subject } from '../types';

describe('SF9 Grade 12 Academic with Cross-Specialization Excel Export Service', () => {
  it('identifies Grade 12 Academic with Cross track correctly', () => {
    expect(isGrade12AcademicCross('Grade 12', 'Academic Track')).toBe(true);
    expect(isGrade12AcademicCross('Grade 12', 'ACADEMIC')).toBe(true);
    expect(isGrade12AcademicCross('Grade 12', 'STEM')).toBe(true);
    expect(isGrade12AcademicCross('Grade 12', 'ABM')).toBe(true);
    expect(isGrade12AcademicCross('Grade 12', 'HUMSS')).toBe(true);
    expect(isGrade12AcademicCross('Grade 12', 'GAS')).toBe(true);
    expect(isGrade12AcademicCross('Grade 12', 'Academic with Cross-Specialization')).toBe(true);
    expect(isGrade12AcademicCross('Grade 12')).toBe(true);

    // Other tracks/grades must return false
    expect(isGrade12AcademicCross('Grade 11', 'Academic Track')).toBe(false);
    expect(isGrade12AcademicCross('Grade 12', 'Technical-Professional')).toBe(false);
    expect(isGrade12AcademicCross('Grade 12', 'TVL')).toBe(false);
    expect(isGrade12AcademicCross('Grade 10')).toBe(false);
  });

  it('extracts Grade 12 Academic with Cross subjects accurately (8 Academic Electives + 1 TechPro Elective = 36 Units)', () => {
    const mockGradesRecord: Record<string, unknown> = {
      'Academic Elective 4': [88, '', ''],
      'Academic Elective 5': [90, '', ''],
      'Academic Elective 6': [89, '', ''],
      'Academic Elective 7': [91, '', ''],
      'Academic Elective 8': ['', 92, ''],
      'Academic Elective 9': ['', 90, ''],
      'Academic Elective 10': ['', 93, ''],
      'Academic Elective 11': ['', 91, ''],
      'TechPro Elective 1': ['', '', 94],
    };

    const extracted = extractGrade12AcademicCrossGrades(mockGradesRecord);
    expect(extracted.ae4).toBe(88);
    expect(extracted.ae5).toBe(90);
    expect(extracted.ae6).toBe(89);
    expect(extracted.ae7).toBe(91);

    expect(extracted.ae8).toBe(92);
    expect(extracted.ae9).toBe(90);
    expect(extracted.ae10).toBe(93);
    expect(extracted.ae11).toBe(91);

    expect(extracted.tp1).toBe(94);
    expect(extracted.remarks).toBe('Passed');
    expect(extracted.honors).toBe('With Honors');
    // Total weighted: 3*(88+90+89+91) + 3*(92+90+93+91) + 12*94 = 3*358 + 3*366 + 1128 = 1074 + 1098 + 1128 = 3300.
    // General Average: 3300 / 36 = 91.666 -> 92
    expect(extracted.generalAverage).toBe(92);
  });

  it('populates official Grade 12 Academic with Cross template and preserves all 6 worksheets, formulas, and 36 units', async () => {
    const templatePath = path.resolve(__dirname, '../../public/templates/G12 Academic with Cross School Form 9 (SY 26-27).xlsx');
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
      student_section: 'Rizal',
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
      student_section: 'Rizal',
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
      'Academic Elective 4': { q1: 88, final: 88 },
      'Academic Elective 5': { q1: 90, final: 90 },
      'Academic Elective 6': { q1: 89, final: 89 },
      'Academic Elective 7': { q1: 91, final: 91 },
      'Academic Elective 8': { q2: 92, final: 92 },
      'Academic Elective 9': { q2: 90, final: 90 },
      'Academic Elective 10': { q2: 93, final: 93 },
      'Academic Elective 11': { q2: 91, final: 91 },
      'TechPro Elective 1': { q3: 94, final: 94 },
    };

    const subjects: Subject[] = [
      { id: 's1', subject_name: 'Academic Elective 4', grade_level: 'Grade 12', term: 1 },
      { id: 's2', subject_name: 'Academic Elective 5', grade_level: 'Grade 12', term: 1 },
      { id: 's3', subject_name: 'Academic Elective 6', grade_level: 'Grade 12', term: 1 },
      { id: 's4', subject_name: 'Academic Elective 7', grade_level: 'Grade 12', term: 1 },
      { id: 's5', subject_name: 'Academic Elective 8', grade_level: 'Grade 12', term: 2 },
      { id: 's6', subject_name: 'Academic Elective 9', grade_level: 'Grade 12', term: 2 },
      { id: 's7', subject_name: 'Academic Elective 10', grade_level: 'Grade 12', term: 2 },
      { id: 's8', subject_name: 'Academic Elective 11', grade_level: 'Grade 12', term: 2 },
      { id: 's9', subject_name: 'TechPro Elective 1', grade_level: 'Grade 12', term: 3 },
    ];

    const attendance = {
      months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
      schoolDays: [20, 20, 20, 20, 20, 20, 20, 18, 18, 20, 5],
      daysPresent: [20, 19, 20, 20, 19, 20, 20, 18, 18, 20, 5],
      daysAbsent: [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0]
    };

    const opts: SF9Grade12AcademicCrossExportOptions = {
      student,
      schoolProfile,
      schoolYear: '2026-2027',
      section: 'Rizal',
      adviser: 'JUAN DELA CRUZ',
      principal: 'MARIA SANTOS, PhD',
      principalTitle: 'Principal IV',
      track: 'Academic Track',
      grades,
      subjects,
      attendance,
      gradeLevel: 'Grade 12',
      learners: [student, { ...femaleStudent, attendance }]
    };

    const resultBuffer = await populateGrade12AcademicCrossTemplateBuffer(templateBuf, opts);
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
    expect(sheet2Xml).toContain('ACADEMIC');
    expect(sheet2Xml).toContain('GRADE 12');
    expect(sheet2Xml).toContain('RIZAL');
    expect(sheet2Xml).toContain('DELA CRUZ, JUAN SANTOS');
    expect(sheet2Xml).toContain('CLARA, MARIA SANTOS');

    // 2. Verify Sheet 3: SUMMARY
    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
    // Male 1 in row 16
    expect(sheet3Xml).toContain('r="C16"');
    expect(sheet3Xml).toContain('DELA CRUZ, JUAN SANTOS');
    expect(sheet3Xml).toContain('r="K16"'); // AE4
    expect(sheet3Xml).toContain('r="S16"'); // TP1

    // Female 1 in row 67
    expect(sheet3Xml).toContain('r="C67"');
    expect(sheet3Xml).toContain('CLARA, MARIA SANTOS');
    expect(sheet3Xml).toContain('r="K67"');
    expect(sheet3Xml).toContain('r="S67"');

    // 3. Verify Sheet 4: SF9 - GRADE 12 ACADEMIC
    const sheet4Xml = await zip.file('xl/worksheets/sheet4.xml')!.async('text');
    expect(sheet4Xml).toContain('DELA CRUZ, JUAN SANTOS');
    expect(sheet4Xml).toContain('100000000001');

    // Verify 36 Total Units
    expect(sheet4Xml).toMatch(/<c\b[^>]*?\br="I31"[^>]*?>.*?<v>3<\/v>/);
    expect(sheet4Xml).toMatch(/<c\b[^>]*?\br="I35"[^>]*?>.*?<v>3<\/v>/);
    expect(sheet4Xml).toMatch(/<c\b[^>]*?\br="I39"[^>]*?>.*?<v>12<\/v>/);
    expect(sheet4Xml).toMatch(/<c\b[^>]*?\br="I41"[^>]*?>.*?<v>36<\/v>/);

    // Verify Row 41 General Average
    expect(sheet4Xml).toMatch(/<c\b[^>]*?\br="J41"[^>]*?>.*?<v>92<\/v>/);
    expect(sheet4Xml).toMatch(/<c\b[^>]*?\br="K41"[^>]*?>.*?<v>Passed<\/v>/);

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
    const templatePath = path.resolve(__dirname, '../../public/templates/G12 Academic with Cross School Form 9 (SY 26-27).xlsx');
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
      'Academic Elective 4': { q1: 85, final: 85 },
      'Academic Elective 5': { q1: 87, final: 87 },
      'Academic Elective 6': { q1: 86, final: 86 },
      'Academic Elective 7': { q1: 88, final: 88 },
    };

    const subjects: Subject[] = [
      { id: 's1', subject_name: 'Academic Elective 4', grade_level: 'Grade 12', term: 1 },
      { id: 's2', subject_name: 'Academic Elective 5', grade_level: 'Grade 12', term: 1 },
      { id: 's3', subject_name: 'Academic Elective 6', grade_level: 'Grade 12', term: 1 },
      { id: 's4', subject_name: 'Academic Elective 7', grade_level: 'Grade 12', term: 1 },
      { id: 's5', subject_name: 'Academic Elective 8', grade_level: 'Grade 12', term: 2 },
      { id: 's6', subject_name: 'Academic Elective 9', grade_level: 'Grade 12', term: 2 },
      { id: 's7', subject_name: 'Academic Elective 10', grade_level: 'Grade 12', term: 2 },
      { id: 's8', subject_name: 'Academic Elective 11', grade_level: 'Grade 12', term: 2 },
      { id: 's9', subject_name: 'TechPro Elective 1', grade_level: 'Grade 12', term: 3 },
    ];

    const opts: SF9Grade12AcademicCrossExportOptions = {
      student,
      schoolYear: '2026-2027',
      section: 'Rizal',
      track: 'Academic Track',
      grades: partialGrades,
      subjects,
      gradeLevel: 'Grade 12'
    };

    const resultBuffer = await populateGrade12AcademicCrossTemplateBuffer(templateBuf, opts);
    const zip = await JSZip.loadAsync(resultBuffer);
    const sf9Xml = await zip.file('xl/worksheets/sheet4.xml')!.async('text');

    // Zero #VALUE! errors
    expect(sf9Xml).not.toContain('#VALUE!');

    // Term 2 and Term 3 final grade cells are blank
    expect(sf9Xml).toMatch(/<c\b[^>]*?\br="J35"[^>]*?><f[^>]*?>.*?<\/f><v\/><\/c>/);
    expect(sf9Xml).toMatch(/<c\b[^>]*?\br="J39"[^>]*?><f[^>]*?>.*?<\/f><v\/><\/c>/);
  });
});
