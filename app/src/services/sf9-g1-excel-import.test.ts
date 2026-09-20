import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { populateGrade1TemplateBuffer, type SF9Grade1ExcelExportOptions } from './sf9-g1-excel-export';
import { parseGrade1MasterWorkbook, applyGrade1MasterImport } from './sf9-g1-excel-import';
import type { Student } from '../types';

describe('Grade 1 Master Excel Import Service (Two-Way Sync)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should parse an exported workbook, detect edits, compute diffs, and apply them', async () => {
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

    const opts: SF9Grade1ExcelExportOptions = {
      student: student1,
      schoolProfile: {
        name: 'Victoria Elementary School',
        school_id: '106777',
        division: 'TARLAC',
        district: 'VICTORIA DISTRICT',
        region: 'Region III',
        head_name: 'JUAN A. DELA CRUZ',
        head_position: 'School Principal I',
        adviser_name: 'CHARLIETTA M. GOZON',
        grade_levels_offered: 'Grade 1'
      },
      schoolYear: '2026-2027',
      section: 'MASIPAG',
      gradeLevel: 'Grade 1',
      adviser: 'CHARLIETTA M. GOZON',
      principal: 'JUAN A. DELA CRUZ',
      principalTitle: 'School Principal I',
      attendance: { months: [], schoolDays: [], daysPresent: [], daysAbsent: [] },
      g1Remarks: {
        term1CanDo: 'Recognizes letters',
        term1ToImprove: 'Needs blending practice'
      },
      paceRatings: {
        reading: { '1_listening': { t1: 'A' } },
        language: {},
        math: {},
        gmrcMakabansa: {}
      },
      sectionStudents: [student1, student2],
      getStudentRemarks: (lrn?: string) => {
        if (lrn === student1.lrn) {
          return {
            term1CanDo: 'Recognizes letters',
            term1ToImprove: 'Needs blending practice'
          };
        }
        return undefined;
      },
      getStudentPaceRatings: (lrn?: string) => {
        if (lrn === student1.lrn) {
          return {
            reading: { '1_listening': { t1: 'A' } },
            language: {},
            math: {},
            gmrcMakabansa: {}
          };
        }
        return undefined;
      }
    };

    // 1. Generate master workbook
    const exportedBuffer = await populateGrade1TemplateBuffer(templateBuffer.buffer, opts);

    // 2. Simulate offline editing by a teacher:
    // - Modify JOSHUA's Term 1 Reading '1_listening' from 'A' to 'B' (K15)
    // - Add JOSHUA's Term 2 Reading '6_listening' as 'A' (U15)
    // - Add JOSHUA's Term 1 Math 'm1_1' as 'C' (K16)
    // - Add JOSHUA's Term 1 CanDo remarks: 'Advanced reading comprehension'
    // - Add RHENS's Term 1 CanDo remarks: 'Participates actively in class'
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(exportedBuffer);

    // In 'TERM 1 READING & LITERACY', JOSHUA is Male #1 -> Row 15, Col K is 1_listening t1
    const reading1 = wb.getWorksheet('TERM 1 READING & LITERACY')!;
    reading1.getCell('K15').value = 'B';

    // In 'TERM 2 READING & LITERACY', Col U is 6_listening t2 (Row 30 left)
    const reading2 = wb.getWorksheet('TERM 2 READING & LITERACY')!;
    reading2.getCell('U15').value = 'A';

    // In 'TERM 1-3 MATHEMATICS', Col K is m1_1 t1 (Row 16 for Male #1)
    const mathSheet = wb.getWorksheet('TERM 1-3 MATHEMATICS')!;
    mathSheet.getCell('K16').value = 'C';

    // In 'TERM 1 SUMMARY', Col N is CanDo
    const term1Sum = wb.getWorksheet('TERM 1 SUMMARY')!;
    term1Sum.getCell('N14').value = 'Advanced reading comprehension';
    term1Sum.getCell('N15').value = 'Participates actively in class';

    const editedBuffer = await wb.xlsx.writeBuffer();

    // 3. Current database state in FormEase
    const currentData = {
      schoolYear: '2026-2027',
      remarks: {
        '123804160001': {
          term1CanDo: 'Recognizes letters',
          term1ToImprove: 'Needs blending practice'
        }
      },
      paceRatings: {
        reading: {
          '123804160001': {
            ratings: {
              '1_listening': { t1: 'A' }
            }
          }
        },
        language: {},
        math: {},
        gmrcMakabansa: {}
      }
    };

    // 4. Parse workbook and compute diff
    const result = await parseGrade1MasterWorkbook(editedBuffer as ArrayBuffer, currentData);
    console.log('Test Diffs:', result.diffs);

    expect(result.parsed.sectionName).toBe('MASIPAG');
    expect(result.parsed.schoolYear).toBe('2026-2027');
    expect(result.parsed.learners.length).toBe(2);

    // Diffs check:
    // 1. Reading 1_listening t1 modified: 'A' -> 'B'
    const readingT1Diff = result.diffs.find(d => d.studentLrn === '123804160001' && d.field.includes('1_listening (T1)'));
    expect(readingT1Diff).toBeDefined();
    expect(readingT1Diff?.oldValue).toBe('A');
    expect(readingT1Diff?.newValue).toBe('B');
    expect(readingT1Diff?.changeType).toBe('modified');

    // 2. Reading 6_listening t2 added: '' -> 'A'
    const readingT2Diff = result.diffs.find(d => d.studentLrn === '123804160001' && d.field.includes('6_listening (T2)'));
    expect(readingT2Diff).toBeDefined();
    expect(readingT2Diff?.oldValue).toBe('');
    expect(readingT2Diff?.newValue).toBe('A');
    expect(readingT2Diff?.changeType).toBe('added');

    // 3. Math m1_1 t1 added: '' -> 'C'
    const mathT1Diff = result.diffs.find(d => d.studentLrn === '123804160001' && d.field.includes('m1_1 (T1)'));
    expect(mathT1Diff).toBeDefined();
    expect(mathT1Diff?.oldValue).toBe('');
    expect(mathT1Diff?.newValue).toBe('C');
    expect(mathT1Diff?.changeType).toBe('added');

    // 4. JOSHUA Term 1 remarks modified: 'Recognizes letters' -> 'Advanced reading comprehension'
    const joshuaRemDiff = result.diffs.find(d => d.studentLrn === '123804160001' && d.category === 'remarks');
    expect(joshuaRemDiff).toBeDefined();
    expect(joshuaRemDiff?.oldValue).toBe('Recognizes letters');
    expect(joshuaRemDiff?.newValue).toBe('Advanced reading comprehension');
    expect(joshuaRemDiff?.changeType).toBe('modified');

    // 5. RHENS Term 1 remarks added: '' -> 'Participates actively in class'
    const rhensRemDiff = result.diffs.find(d => d.studentLrn === '106777160001' && d.category === 'remarks');
    expect(rhensRemDiff).toBeDefined();
    expect(rhensRemDiff?.oldValue).toBe('');
    expect(rhensRemDiff?.newValue).toBe('Participates actively in class');
    expect(rhensRemDiff?.changeType).toBe('added');

    // 6. Apply the import (Smart Merge)
    const applyRes = await applyGrade1MasterImport(result, 'merge');
    expect(applyRes.updatedRemarksCount).toBeGreaterThanOrEqual(2);
    expect(applyRes.updatedPaceCount).toBeGreaterThanOrEqual(3);

    // Verify localStorage has been populated
    const savedJoshuaRem = JSON.parse(localStorage.getItem('g1_remarks_123804160001_2026-2027') || '{}');
    expect(savedJoshuaRem.term1CanDo).toBe('Advanced reading comprehension');
    expect(savedJoshuaRem.term1ToImprove).toBe('Needs blending practice');

    const savedRhensRem = JSON.parse(localStorage.getItem('g1_remarks_106777160001_2026-2027') || '{}');
    expect(savedRhensRem.term1CanDo).toBe('Participates actively in class');

    const savedReading = JSON.parse(localStorage.getItem('formease_pace_reading_ratings') || '{}');
    expect(savedReading['123804160001']?.ratings?.['1_listening']?.t1).toBe('B');
    expect(savedReading['123804160001']?.ratings?.['6_listening']?.t2).toBe('A');

    const savedMath = JSON.parse(localStorage.getItem('formease_pace_math_ratings') || '{}');
    expect(savedMath['123804160001']?.ratings?.['m1_1']?.t1).toBe('C');
  });
});
