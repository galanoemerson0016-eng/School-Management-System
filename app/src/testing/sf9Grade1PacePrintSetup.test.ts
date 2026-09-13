import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import type { Student, SchoolProfile } from '../types';
import { populateGrade1TemplateBuffer, type SF9Grade1ExcelExportOptions } from '../services/sf9-g1-excel-export';

describe('Grade 1 Master ECR, PACE, and SF9 Export - PACE Form Print Setup', () => {
  const templatePath = path.resolve(
    __dirname,
    '../../public/templates/UPDATED [Grade 1] ECR, PACE Form, and SF9.xlsx'
  );

  const mockStudent: Student = {
    lrn: '123456789012',
    first_name: 'JUAN',
    last_name: 'DELA CRUZ',
    middle_name: 'A',
    gender: 'Male',
    age: 7,
    birthday: '2019-01-01',
    address: 'Test Address',
    grade_level: 'Grade 1',
    student_section: 'MATATAG'
  };

  const mockProfile: SchoolProfile = {
    school_id: '123456',
    name: 'Test Elementary School',
    region: 'Region I',
    division: 'Division of Test',
    district: 'District 1',
    head_name: 'Principal Test',
    head_position: 'Principal I',
    grade_levels_offered: 'Grade 1-6'
  };

  const mockOpts: SF9Grade1ExcelExportOptions = {
    schoolProfile: mockProfile,
    schoolYear: '2026-2027',
    gradeLevel: 'Grade 1',
    section: 'MATATAG',
    adviser: 'Teacher Test',
    principal: 'Principal Test',
    principalTitle: 'Principal I',
    student: mockStudent,
    sectionStudents: [mockStudent],
    attendance: {
      months: ['Aug', 'Sep', 'Oct'],
      schoolDays: [20, 20, 20],
      daysPresent: [20, 20, 20],
      daysAbsent: [0, 0, 0]
    }
  };

  it('populates the 17-sheet master workbook and sets strictly 4-page print configuration for PACE - GRADE 1', async () => {
    const templateBuffer = fs.readFileSync(templatePath);
    const arrayBuffer = templateBuffer.buffer.slice(
      templateBuffer.byteOffset,
      templateBuffer.byteOffset + templateBuffer.byteLength
    );
    const outBuffer = await populateGrade1TemplateBuffer(arrayBuffer, mockOpts);

    expect(outBuffer.byteLength).toBeGreaterThan(1000);
    const zip = await JSZip.loadAsync(outBuffer);

    // 1. Verify xl/workbook.xml contains _xlnm.Print_Area for PACE - GRADE 1 (localSheetId=6)
    const wbXml = await zip.file('xl/workbook.xml')!.async('string');
    expect(wbXml).toContain('<definedName name="_xlnm.Print_Area" localSheetId="6">\'PACE - GRADE 1\'!$A$1:$T$311</definedName>');

    // 2. Verify sheet7.xml has correct print configuration
    const paceXml = await zip.file('xl/worksheets/sheet7.xml')!.async('string');

    // Dimension must end at row 311
    expect(paceXml).toContain('<dimension ref="A1:T311"/>');

    // sheetPr must contain fitToPage="0" so Excel scales explicitly at 53%
    expect(paceXml).toContain('fitToPage="0"');

    // pageMargins must reserve bottom="0.55" for Epson hardware margins
    expect(paceXml).toContain('bottom="0.55"');

    // pageSetup must use paperSize="9" (A4), scale="53"
    expect(paceXml).toContain('<pageSetup paperSize="9" scale="53" orientation="portrait"');

    // rowBreaks must contain exact manual breaks after rows 86, 163, and 245
    expect(paceXml).toContain('<rowBreaks count="3" manualBreakCount="3">');
    expect(paceXml).toContain('<brk id="86" max="19" man="1"/>');
    expect(paceXml).toContain('<brk id="163" max="19" man="1"/>');
    expect(paceXml).toContain('<brk id="245" max="19" man="1"/>');

    // printOptions must be centered
    expect(paceXml).toContain('<printOptions horizontalCentered="1" verticalCentered="1"/>');

    // Must not have rows beyond 311
    const row312Match = paceXml.match(/<row\s+r="(\d+)"/g);
    if (row312Match) {
      for (const rm of row312Match) {
        const rNum = parseInt(rm.replace(/[^0-9]/g, ''), 10);
        expect(rNum).toBeLessThanOrEqual(311);
      }
    }
  });

  it('handles single-subject PACE form isolation correctly (1 page)', async () => {
    const templateBuffer = fs.readFileSync(templatePath);
    const arrayBuffer = templateBuffer.buffer.slice(
      templateBuffer.byteOffset,
      templateBuffer.byteOffset + templateBuffer.byteLength
    );
    const outBuffer = await populateGrade1TemplateBuffer(arrayBuffer, {
      ...mockOpts,
      paceSubjectFilter: 'math'
    });

    const zip = await JSZip.loadAsync(outBuffer);
    const wbXml = await zip.file('xl/workbook.xml')!.async('string');
    expect(wbXml).toContain('\'PACE - GRADE 1\'!$A$164:$T$245');

    const paceXml = await zip.file('xl/worksheets/sheet7.xml')!.async('string');
    expect(paceXml).not.toContain('<rowBreaks');
  });
});
