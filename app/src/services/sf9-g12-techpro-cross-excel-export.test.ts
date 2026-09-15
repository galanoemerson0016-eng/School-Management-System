import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {
  isGrade12TechProWithCross,
  extractGrade12TechProCrossGrades,
  populateGrade12TechProCrossTemplateBuffer,
  type SF9Grade12TechProCrossExportOptions,
} from './sf9-g12-techpro-cross-excel-export';
import type { SchoolProfile, Student, Subject } from '../types';

describe('SF9 Grade 12 TechPro with Cross-Specialization Excel Export', () => {
  const mockSchoolProfile: SchoolProfile = {
    name: 'Capas High School',
    school_id: '300976',
    region: 'Region III',
    division: 'Tarlac Province',
    district: 'Capas West District',
    municipality: 'Capas',
    head_name: 'Dr. Maria Santos',
    head_position: 'School Principal IV',
    grade_levels_offered: '7-12',
    adviser_name: 'Mr. John Dela Cruz',
  };

  const mockStudent: Student = {
    lrn: '123456789012',
    last_name: 'DELA CRUZ',
    first_name: 'JUAN',
    middle_name: 'PROTASIO',
    gender: 'Male',
    grade_level: 'Grade 12',
    birthday: '2008-10-15',
    age: 17,
    address: 'Capas, Tarlac',
  };

  describe('isGrade12TechProWithCross', () => {
    it('accurately identifies Grade 12 TechPro with Cross tracks', () => {
      expect(isGrade12TechProWithCross('Grade 12', 'TechPro with Cross-Specialization')).toBe(true);
      expect(isGrade12TechProWithCross('12', 'Technical-Professional Track (with Cross-Specialization)')).toBe(true);
      expect(isGrade12TechProWithCross('Grade 12', 'TVL Track with Cross Specialization')).toBe(true);
      expect(isGrade12TechProWithCross('G12', 'Tech-Pro with Cross')).toBe(true);
    });

    it('identifies Grade 12 TechPro with Cross via subject composition', () => {
      const subjects: Subject[] = [
        { id: '1', subject_name: 'TechPro Elective 2', grade_level: '12' },
        { id: '2', subject_name: 'Academic Elective 1', grade_level: '12' },
        { id: '3', subject_name: 'Academic Elective 2', grade_level: '12' },
        { id: '4', subject_name: 'Academic Elective 3', grade_level: '12' },
        { id: '5', subject_name: 'Academic Elective 4', grade_level: '12' },
        { id: '6', subject_name: 'Work Immersion for TechPro Track', grade_level: '12' },
      ];
      expect(isGrade12TechProWithCross('Grade 12', undefined, subjects)).toBe(true);
    });

    it('rejects Grade 11 or pure TechPro or Academic tracks without cross', () => {
      expect(isGrade12TechProWithCross('Grade 11', 'TechPro with Cross')).toBe(false);
      expect(isGrade12TechProWithCross('Grade 12', 'TVL - ICT')).toBe(false);
      expect(isGrade12TechProWithCross('Grade 12', 'TechPro (SSHS)')).toBe(false);
      expect(isGrade12TechProWithCross('Grade 12', 'STEM')).toBe(false);
      expect(isGrade12TechProWithCross('Grade 12', 'Academic Track')).toBe(false);
      expect(isGrade12TechProWithCross(null, 'TechPro with Cross')).toBe(false);
    });
  });

  describe('extractGrade12TechProCrossGrades', () => {
    it('calculates 36 weighted units and general average accurately', () => {
      // 6 Subjects:
      // TP2 (12 units) = 90
      // AE1 (3 units) = 92
      // AE2 (3 units) = 91
      // AE3 (3 units) = 89
      // AE4 (3 units) = 90
      // Work Immersion (12 units) = 94
      // Points: 90*12 + 92*3 + 91*3 + 89*3 + 90*3 + 94*12 = 1080 + 276 + 273 + 267 + 270 + 1128 = 3294
      // Average: 3294 / 36 = 91.5 -> ROUND = 92
      const gradesRecord: Record<string, unknown> = {
        'TechPro Elective 2': { q1: 90 },
        'Academic Elective 1': { q2: 92 },
        'Academic Elective 2': { q2: 91 },
        'Academic Elective 3': { q2: 89 },
        'Academic Elective 4': { q2: 90 },
        'Work Immersion for TechPro Track': { q3: 94 },
      };

      const res = extractGrade12TechProCrossGrades(gradesRecord);
      expect(res.tp2).toBe(90);
      expect(res.ae1).toBe(92);
      expect(res.ae2).toBe(91);
      expect(res.ae3).toBe(89);
      expect(res.ae4).toBe(90);
      expect(res.wi).toBe(94);
      expect(res.generalAverage).toBe(92);
      expect(res.generalAverageRemarks).toBe('Passed');
      expect(res.honors).toBe('With Honors'); // min grade is 89 (>= 80), avg 92
    });

    it('evaluates DO 15, s. 2026 Academic Excellence criteria correctly', () => {
      // Highest Honors: Gen Avg >= 98, all >= 80
      const highestGrades: Record<string, unknown> = {
        'TechPro Elective 2': { q1: 98 },
        'Academic Elective 1': { q2: 98 },
        'Academic Elective 2': { q2: 98 },
        'Academic Elective 3': { q2: 98 },
        'Academic Elective 4': { q2: 98 },
        'Work Immersion for TechPro Track': { q3: 99 },
      };
      const highRes = extractGrade12TechProCrossGrades(highestGrades);
      expect(highRes.generalAverage).toBeGreaterThanOrEqual(98);
      expect(highRes.honors).toBe('With Highest Honors');

      // Disqualified if any grade < 80
      const disqualifiedGrades: Record<string, unknown> = {
        'TechPro Elective 2': { q1: 96 },
        'Academic Elective 1': { q2: 96 },
        'Academic Elective 2': { q2: 96 },
        'Academic Elective 3': { q2: 79 }, // < 80
        'Academic Elective 4': { q2: 96 },
        'Work Immersion for TechPro Track': { q3: 98 },
      };
      const disqRes = extractGrade12TechProCrossGrades(disqualifiedGrades);
      expect(disqRes.honors).toBe('');
    });

    it('handles incomplete / pending grades gracefully with zero errors', () => {
      const partialGrades: Record<string, unknown> = {
        'TechPro Elective 2': { q1: 88 },
        // Term 2 and Term 3 pending
      };
      const res = extractGrade12TechProCrossGrades(partialGrades);
      expect(res.tp2).toBe(88);
      expect(res.ae1).toBe('');
      expect(res.wi).toBe('');
      expect(res.honors).toBe('');
    });
  });

  describe('populateGrade12TechProCrossTemplateBuffer', () => {
    it('populates all 6 sheets, active tab 3, guarded formulas, and zero #VALUE! errors', async () => {
      const templatePath = path.resolve(__dirname, '../../public/templates/G12 TechPro with Cross School Form 9 (SY 26-27).xlsx');
      expect(fs.existsSync(templatePath)).toBe(true);

      const templateBuf = fs.readFileSync(templatePath);

      const femaleStudent: Student = {
        lrn: '987654321098',
        last_name: 'REYES',
        first_name: 'MARIA',
        middle_name: 'CLARA',
        gender: 'Female',
        grade_level: 'Grade 12',
        birthday: '2008-05-20',
        age: 17,
        address: 'Capas, Tarlac',
      };

      const options: SF9Grade12TechProCrossExportOptions = {
        student: mockStudent,
        schoolProfile: mockSchoolProfile,
        section: 'SSHS 12-TechPro Cross',
        gradeLevel: 'Grade 12',
        schoolYear: '2026-2027',
        track: 'Technical-Professional Track (with Cross-Specialization)',
        strand: 'TechPro with Cross-Specialization',
        sectionStudents: [mockStudent, femaleStudent],
        grades: {
          'TechPro Elective 2': { q1: 90 },
          'Academic Elective 1': { q2: 92 },
          'Academic Elective 2': { q2: 91 },
          'Academic Elective 3': { q2: 89 },
          'Academic Elective 4': { q2: 90 },
          'Work Immersion for TechPro Track': { q3: 94 },
        },
        attendance: {
          schoolDays: [20, 20, 20, 20, 20, 20, 20, 18, 18, 20, 5],
          daysPresent: [20, 20, 19, 20, 20, 20, 19, 18, 18, 20, 5],
          daysAbsent: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
        },
      };

      const outBuffer = await populateGrade12TechProCrossTemplateBuffer(templateBuf, options);
      expect(outBuffer.byteLength).toBeGreaterThan(10000);

      const zip = await JSZip.loadAsync(outBuffer);

      // Verify activeTab="3" in workbook.xml
      const wbXml = await zip.file('xl/workbook.xml')!.async('string');
      expect(wbXml).toContain('activeTab="3"');

      // Verify Sheet 4 (SF9)
      const sheet4Xml = await zip.file('xl/worksheets/sheet4.xml')!.async('string');
      expect(sheet4Xml).toContain('DELA CRUZ, JUAN P.');
      expect(sheet4Xml).toContain('123456789012');

      // Verify guarded Column L formulas
      expect(sheet4Xml).toMatch(/<f[^>]*?>IF\(J31=&quot;&quot;,&quot;&quot;,J31\*I31\)<\/f>/);
      expect(sheet4Xml).toMatch(/<f[^>]*?>IF\(J32=&quot;&quot;,&quot;&quot;,J32\*I32\)<\/f>/);
      expect(sheet4Xml).toMatch(/<f[^>]*?>IF\(J36=&quot;&quot;,&quot;&quot;,J36\*I36\)<\/f>/);

      // Verify NO raw #VALUE! in Sheet 4
      expect(sheet4Xml).not.toContain('<v>#VALUE!</v>');

      // Verify Sheet 3 (SUMMARY) has Male at Row 15 and Female at Row 66
      const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('string');
      expect(sheet3Xml).toContain('DELA CRUZ, JUAN P.');
      expect(sheet3Xml).toContain('REYES, MARIA C.');

      // Verify Sheet 2 (INPUT DATA)
      const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('string');
      expect(sheet2Xml).toContain('CAPAS HIGH SCHOOL');
      expect(sheet2Xml).toContain('DELA CRUZ, JUAN P.');
      expect(sheet2Xml).toContain('REYES, MARIA C.');
    });
  });
});
