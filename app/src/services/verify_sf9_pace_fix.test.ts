import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { populateGrade1TemplateBuffer, type SF9Grade1ExcelExportOptions } from './sf9-g1-excel-export';
import type { Student } from '../types';

describe('SF9 and PACE Export Verification', () => {
  it('should export SF9 remarks without 0 for blank remarks and populate PACE ratings correctly', async () => {
    const templatePath = path.resolve(__dirname, '../../public/templates/UPDATED [Grade 1] ECR, PACE Form, and SF9.xlsx');
    const templateBuffer = fs.readFileSync(templatePath);

    const student1: Student = {
      lrn: '123804160001',
      last_name: 'ABARQUEZ',
      first_name: 'JOSHUA',
      middle_name: 'BAMAN',
      gender: 'Male',
      birthday: '2019-03-30',
      age: 7,
      address: 'Victoria, Tarlac',
      grade_level: 'Grade 1',
      student_section: 'MASIPAG'
    };

    const student2: Student = {
      lrn: '106777160001',
      last_name: 'AGONOY',
      first_name: 'RHENS',
      middle_name: 'SALVADOR',
      gender: 'Male',
      birthday: '2019-05-20',
      age: 7,
      address: 'Victoria, Tarlac',
      grade_level: 'Grade 1',
      student_section: 'MASIPAG'
    };

    const opts = {
      student: student1,
      schoolProfile: {
        name: 'Victoria Elementary School',
        school_id: '106777',
        division: 'TARLAC',
        district: 'VICTORIA DISTRICT',
        region: 'Region III',
        head_name: 'JUAN A. DELA CRUZ',
        adviser_name: 'CHARLIETTA M. GOZON'
      },
      schoolYear: '2026-2027',
      section: 'MASIPAG',
      gradeLevel: 'Grade 1',
      adviser: 'CHARLIETTA M. GOZON',
      principal: 'JUAN A. DELA CRUZ',
      attendance: { months: [], totalDays: 0, totalPresent: 0, totalAbsent: 0 },
      g1Remarks: {
        term1CanDo: 'Able to recognize letter sounds',
        term1ToImprove: 'Needs help with blending'
        // term2 and term3 are blank!
      },
      paceRatings: {
        reading: {
          '1_listening': { t1: 'A' as const }
        },
        language: {},
        math: {
          'm1_1': { t1: 'B' as const }
        },
        gmrcMakabansa: {
          'maka1_1a': { t1: 'C' as const }
        }
      },
      sectionStudents: [student1, student2],
      getStudentRemarks: (lrn?: string) => {
        if (lrn === student1.lrn) {
          return {
            term1CanDo: 'Able to recognize letter sounds',
            term1ToImprove: 'Needs help with blending'
          };
        }
        return undefined;
      },
      getStudentPaceRatings: (lrn?: string) => {
        if (lrn === student1.lrn) {
          return {
            reading: { '1_listening': { t1: 'A' as const } },
            language: {},
            math: { 'm1_1': { t1: 'B' as const } },
            gmrcMakabansa: { 'maka1_1a': { t1: 'C' as const } }
          };
        }
        return undefined;
      }
    };

    const outBuffer = await populateGrade1TemplateBuffer(templateBuffer.buffer, opts as unknown as SF9Grade1ExcelExportOptions);
    expect(outBuffer.byteLength).toBeGreaterThan(10000);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(outBuffer);

    // 1. Check SF9 - GRADE 1
    const sf9 = wb.getWorksheet('SF9 - GRADE 1');
    expect(sf9).toBeDefined();

    // Term 1 CanDo (E23)
    const e23 = sf9!.getCell('E23');
    expect(e23.formula).toContain('IFERROR(IF(OR(');
    expect(e23.result).toBe('Able to recognize letter sounds');

    // Term 1 ToImprove (E31)
    const e31 = sf9!.getCell('E31');
    expect(e31.formula).toContain('IFERROR(IF(OR(');
    expect(e31.result).toBe('Needs help with blending');

    // Blank Remarks: E43, E51, E63, E71 MUST NOT be 0 or #N/A!
    for (const c of ['E43', 'E51', 'E63', 'E71']) {
      const cell = sf9!.getCell(c);
      expect(cell.formula).toContain('IFERROR(IF(OR(');
      expect(cell.result).not.toBe(0);
      expect(cell.result).not.toBe('0');
      expect(cell.result).not.toBe('#N/A');
    }

    // 2. Check PACE - GRADE 1
    const pace = wb.getWorksheet('PACE - GRADE 1');
    expect(pace).toBeDefined();

    // G19 (reading 1_listening t1 -> 'A')
    const g19 = pace!.getCell('G19');
    expect(g19.formula).toContain('IFERROR(IF(OR(');
    expect(g19.result).toBe('A');

    // G20 (reading 1_speaking t1 -> unrated)
    const g20 = pace!.getCell('G20');
    expect(g20.formula).toContain('IFERROR(IF(OR(');
    expect(g20.result).not.toBe(0);
    expect(g20.result).not.toBe('0');
    expect(g20.result).not.toBe('#N/A');

    // P176 (math m1_1 t1 -> 'B')
    const p176 = pace!.getCell('P176');
    expect(p176.formula).toContain('IFERROR(IF(OR(');
    expect(p176.result).toBe('B');

    // P177 (math m1_2 t1 -> unrated)
    const p177 = pace!.getCell('P177');
    expect(p177.formula).toContain('IFERROR(IF(OR(');
    expect(p177.result).not.toBe(0);
    expect(p177.result).not.toBe('0');
    expect(p177.result).not.toBe('#N/A');

    // P295 (makabansa maka1_1a -> 'C')
    const p295 = pace!.getCell('P295');
    expect(p295.formula).toContain('IFERROR(IF(OR(');
    expect(p295.result).toBe('C');

    // 3. Check TERM 1 SUMMARY
    const t1Sum = wb.getWorksheet('TERM 1 SUMMARY');
    expect(t1Sum!.getCell('N14').value).toBe('Able to recognize letter sounds');
    expect(t1Sum!.getCell('Q14').value).toBe('Needs help with blending');
    // Student 2 has blank remarks - should not be 0
    expect(t1Sum!.getCell('N15').value).not.toBe(0);
    expect(t1Sum!.getCell('N15').value).not.toBe('0');
    expect(t1Sum!.getCell('Q15').value).not.toBe(0);
    expect(t1Sum!.getCell('Q15').value).not.toBe('0');
  });
});
