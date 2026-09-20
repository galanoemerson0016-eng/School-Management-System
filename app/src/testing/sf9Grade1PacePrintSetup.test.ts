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

  it('populates the 17-sheet master workbook and preserves native 4-page print configuration for PACE - GRADE 1', async () => {
    const templateBuffer = fs.readFileSync(templatePath);
    const arrayBuffer = templateBuffer.buffer.slice(
      templateBuffer.byteOffset,
      templateBuffer.byteOffset + templateBuffer.byteLength
    );
    const outBuffer = await populateGrade1TemplateBuffer(arrayBuffer, mockOpts);

    expect(outBuffer.byteLength).toBeGreaterThan(1000);
    const zip = await JSZip.loadAsync(outBuffer);

    // 1. Verify xl/workbook.xml does NOT inject artificial Print_Area in full workbook export
    const wbXml = await zip.file('xl/workbook.xml')!.async('string');
    expect(wbXml).not.toContain('<definedName name="_xlnm.Print_Area" localSheetId="6">\'PACE - GRADE 1\'!$A$1:$T$311</definedName>');

    // 2. Verify sheet7.xml preserves official DepEd template print configuration (strictly 4 pages)
    const paceXml = await zip.file('xl/worksheets/sheet7.xml')!.async('string');

    // sheetPr must preserve fitToPage="1" so Excel fits width to 1 page
    expect(paceXml).toContain('fitToPage="1"');

    // pageMargins must preserve template margins (0.25" all around)
    expect(paceXml).toContain('<pageMargins left="0.25" right="0.25" top="0.25" bottom="0.25" header="0" footer="0"/>');

    // pageSetup must preserve paperSize="9" (A4), scale="62", fitToHeight="0"
    expect(paceXml).toContain('<pageSetup paperSize="9" scale="62" fitToHeight="0" orientation="portrait"');

    // printOptions must preserve horizontal centering
    expect(paceXml).toContain('<printOptions horizontalCentered="1"/>');

    // No manual rowBreaks (which fragment pages across printers)
    expect(paceXml).not.toContain('<rowBreaks');

    // 3. Verify SF9 (sheet3.xml) formulas and values are intact
    const sf9Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('string');
    expect(sf9Xml).toContain('<c r="D15"');
    expect(sf9Xml).toContain('DELA CRUZ, JUAN');
    expect(sf9Xml).toContain('VLOOKUP(D15,\'TERM 1 SUMMARY\'!C14:S114,4,0)');
    expect(sf9Xml).toContain('<pageSetup paperSize="9" scale="65" orientation="portrait"');

    // 4. Verify PACE rating formulas are guarded so unrated cells stay blank instead of resulting in 0
    expect(paceXml).toContain('IFERROR(IF(OR(VLOOKUP(G6,\'TERM 1 READING &amp; LITERACY\'!C15:DG115,9,0)=0,VLOOKUP(G6,\'TERM 1 READING &amp; LITERACY\'!C15:DG115,9,0)=""),"",VLOOKUP(G6,\'TERM 1 READING &amp; LITERACY\'!C15:DG115,9,0)),"")');
    expect(paceXml).not.toContain('<v>0</v>');

    // 5. Verify all rows across all sheets strictly preserve OpenXML alphabetical column ordering
    function colToNum(col: string): number {
      let n = 0;
      for (let i = 0; i < col.length; i++) {
        n = n * 26 + (col.charCodeAt(i) - 64);
      }
      return n;
    }

    const sheetFiles = Object.keys(zip.files).filter(k => k.startsWith('xl/worksheets/sheet') && k.endsWith('.xml'));
    expect(sheetFiles.length).toBeGreaterThan(0);

    for (const sf of sheetFiles) {
      const xml = await zip.file(sf)!.async('string');
      const rowRegex = /<row\s+r="(\d+)"[^>]*?>([\s\S]*?)<\/row>/g;
      let rM: RegExpExecArray | null;
      while ((rM = rowRegex.exec(xml)) !== null) {
        const rowNum = rM[1];
        const rowBody = rM[2];
        const cellRegex = /<c\s+r="([A-Z]+)\d+"/g;
        let cM: RegExpExecArray | null;
        let lastColNum = 0;
        let lastCol = '';
        while ((cM = cellRegex.exec(rowBody)) !== null) {
          const col = cM[1];
          const colNum = colToNum(col);
          if (colNum <= lastColNum) {
            throw new Error(`[${sf}] ROW ${rowNum} BROKEN: Column ${col} (${colNum}) appears AFTER ${lastCol} (${lastColNum})!`);
          }
          lastColNum = colNum;
          lastCol = col;
        }
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
