import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { isGrade2, formatDateToMMDDYYYY, populateGrade2TemplateBuffer } from './sf9-g2-excel-export';
import type { SF9ExcelExportOptions } from './sf9-excel-export';

describe('Grade 2 SF9 Excel Export Service', () => {
  it('correctly detects Grade 2 strings', () => {
    expect(isGrade2('Grade 2')).toBe(true);
    expect(isGrade2('grade 2')).toBe(true);
    expect(isGrade2('G2')).toBe(true);
    expect(isGrade2('2')).toBe(true);
    expect(isGrade2('Grade 1')).toBe(false);
    expect(isGrade2('Grade 12')).toBe(false);
    expect(isGrade2('Grade 3')).toBe(false);
  });

  it('correctly formats dates to MM/DD/YYYY', () => {
    expect(formatDateToMMDDYYYY('2019-05-12')).toBe('05/12/2019');
    expect(formatDateToMMDDYYYY('05/12/2019')).toBe('05/12/2019');
    expect(formatDateToMMDDYYYY('2019/3/5')).toBe('03/05/2019');
  });

  it('populates official Grade 2 template and preserves all worksheets, formulas, and school logo', async () => {
    const templatePath = path.resolve(process.cwd(), 'public/templates/G2 School Form 9 (SY 26-27).xlsx');
    if (!fs.existsSync(templatePath)) {
      console.warn('Template not found at:', templatePath);
      return;
    }

    const nodeBuf = fs.readFileSync(templatePath);

    const mockOpts: SF9ExcelExportOptions = {
      student: {
        id: 's1',
        lrn: '100000000001',
        first_name: 'JUAN JR.',
        last_name: 'DELA CRUZ',
        middle_name: 'A.',
        gender: 'Male',
        birthday: '2019-05-12',
        student_section: 'sec1',
        grade_level: 'Grade 2'
      } as unknown as SF9ExcelExportOptions['student'],
      schoolProfile: {
        region: 'REGION I',
        division: 'ILOCOS NORTE',
        city: 'LAOAG CITY',
        district: 'DISTRICT I',
        school_id: '100123',
        name: 'BACARRA CENTRAL ELEMENTARY SCHOOL',
        head_name: 'MARIA SANTOS, PhD',
        head_position: 'Principal IV',
        logo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      } as unknown as SF9ExcelExportOptions['schoolProfile'],
      schoolYear: '2026-2027',
      section: 'DIAMOND',
      adviser: 'JUAN DELA CRUZ',
      principal: 'MARIA SANTOS, PhD',
      principalTitle: 'Principal IV',
      grades: {
        'Filipino': [88, 89, 90],
        'English': [87, 88, 89],
        'Mathematics': [92, 93, 94],
        'GMRC / Values Education': [90, 91, 92],
        'Makabansa': [89, 90, 91]
      },
      subjects: [
        { name: 'Filipino' },
        { name: 'English' },
        { name: 'Mathematics' },
        { name: 'GMRC / Values Education' },
        { name: 'Makabansa' }
      ],
      observedValues: {},
      comments: [],
      attendance: {
        months: ['JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR'],
        schoolDays: [20, 22, 21, 20, 22, 20, 15, 21, 20, 22, 10],
        daysPresent: [20, 22, 21, 20, 22, 20, 15, 21, 20, 22, 10],
        daysAbsent: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      },
      gradeLevel: 'Grade 2',
      sectionStudents: [
        {
          id: 's1',
          lrn: '100000000001',
          first_name: 'JUAN JR.',
          last_name: 'DELA CRUZ',
          middle_name: 'A.',
          gender: 'Male',
          birthday: '2019-05-12',
          student_section: 'sec1',
          grade_level: 'Grade 2'
        },
        {
          id: 's2',
          lrn: '100000000002',
          first_name: 'MARIA CLARA',
          last_name: 'SANTOS',
          middle_name: 'C.',
          gender: 'Female',
          birthday: '2019-03-15',
          student_section: 'sec1',
          grade_level: 'Grade 2',
          attendance: {
            daysPresent: [18, 20, 19, 21, 20, 19, 14, 20, 19, 21, 9]
          }
        }
      ] as unknown as NonNullable<SF9ExcelExportOptions['sectionStudents']>
    };

    const outBuffer = await populateGrade2TemplateBuffer(nodeBuf, mockOpts);
    expect(outBuffer).toBeDefined();
    expect(outBuffer.byteLength).toBeGreaterThan(10000);

    // Verify zip structure and contents
    const zip = await JSZip.loadAsync(outBuffer);
    expect(zip.file('xl/calcChain.xml')).toBeNull();
    expect(zip.file('xl/workbook.xml')).toBeDefined();
    expect(zip.file('xl/worksheets/sheet2.xml')).toBeDefined(); // INPUT DATA
    expect(zip.file('xl/worksheets/sheet3.xml')).toBeDefined(); // TERM 1
    expect(zip.file('xl/worksheets/sheet6.xml')).toBeDefined(); // SF9 - GRADE 2 (in updated 7-sheet template)
    expect(zip.file('xl/worksheets/sheet7.xml')).toBeDefined(); // ATTENDANCE RECORD SUMMARY
    expect(zip.file('xl/worksheets/sheet8.xml')).toBeNull(); // Sheet 8 removed in updated template

    const relsXml = await zip.file('xl/_rels/workbook.xml.rels')!.async('text');
    expect(relsXml).not.toContain('calcChain.xml');

    const ctXml = await zip.file('[Content_Types].xml')!.async('text');
    expect(ctXml).not.toContain('calcChain.xml');

    const wbXml = await zip.file('xl/workbook.xml')!.async('text');
    expect(wbXml).toContain('fullCalcOnLoad="1"');
    expect(wbXml).toContain('forceFullCalc="1"');
    expect(wbXml).toContain('activeTab="5"'); // 6th sheet (0-indexed 5: SF9 - GRADE 2)

    const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
    expect(sheet2Xml).toContain('BACARRA CENTRAL ELEMENTARY SCHOOL');
    expect(sheet2Xml).toContain('100000000001');
    expect(sheet2Xml).toContain('r="L11"'); // Male 1 Name
    expect(sheet2Xml).toContain('r="Q11"'); // Female 1 Name
    expect(sheet2Xml).not.toContain('r="L11" s="23"');
    expect(sheet2Xml).not.toContain('r="M11" s="24"');
    expect(sheet2Xml).not.toContain('r="N11" s="248"');
    expect(sheet2Xml).toContain('DATE(2019,5,12)');

    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
    expect(sheet3Xml).toContain('r="K14"'); // Male 1 Filipino on Row 14
    expect(sheet3Xml).toContain('r="K65"'); // Female 1 Filipino on Row 65
    expect(sheet3Xml).toContain('BACARRA CENTRAL ELEMENTARY SCHOOL'); // Populated E6 header result
    expect(sheet3Xml).toMatch(/<c\s+r="I14"[^>]*>(?:<f[^>]*>[\s\S]*?<\/f>)?<v>7<\/v><\/c>/);
    expect(sheet3Xml).toMatch(/<c\s+r="I65"[^>]*>(?:<f[^>]*>[\s\S]*?<\/f>)?<v>7<\/v><\/c>/);

    const sheet7Xml = await zip.file('xl/worksheets/sheet7.xml')!.async('text');
    expect(sheet7Xml).toContain('JUAN DELA CRUZ'); // Adviser in L10/L11
    expect(sheet7Xml).toContain('r="F14"'); // Male 1 attendance
    expect(sheet7Xml).toContain('r="F65"'); // Female 1 attendance
    expect(sheet7Xml).not.toContain('<is><t xml:space="preserve"></t></is>'); // No malformed empty inlineStr

    // Sheet 6 is SF9 - GRADE 2 in the updated template
    const sheetSf9Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');
    expect(sheetSf9Xml).toContain('DELA CRUZ, JUAN JR.');
    expect(sheetSf9Xml).toContain('BACARRA CENTRAL ELEMENTARY SCHOOL'); // B12
    expect(sheetSf9Xml).toContain('REGION I'); // B7
    expect(sheetSf9Xml).toContain('100123'); // B10
    expect(sheetSf9Xml).toContain('MARIA SANTOS, PhD'); // B27, Q41, Q49
    expect(sheetSf9Xml).toContain('r="R5"'); // Single-row school days
    expect(sheetSf9Xml).not.toContain('r="R6" s="630"><v>20</v>'); // No duplicated row 6
    expect(sheetSf9Xml).not.toContain('<f>#REF!</f>');
    expect(sheetSf9Xml).not.toContain('<v>#REF!</v>');

    // Check pre-computed remarks in Column J
    expect(sheetSf9Xml).toContain('r="J33"'); // Filipino Remark (Passed)
    expect(sheetSf9Xml).toContain('Passed');
    expect(sheetSf9Xml).toContain('IF(I33=&quot;&quot;, &quot;&quot;, IF(I33&gt;=75, &quot;Passed&quot;, &quot;Failed&quot;))');

    // Check School Logo injection in drawing6.xml
    expect(zip.file('xl/media/school_logo.png')).toBeDefined();
    const d6Xml = await zip.file('xl/drawings/drawing6.xml')!.async('text');
    expect(d6Xml).toContain('name="School Logo"');
    expect(d6Xml).not.toContain('name="Shape 3"');
  });

  it('renders blank cells for missing/unentered grades and avoids 0 or premature Failed', async () => {
    const templatePath = path.resolve(process.cwd(), 'public/templates/G2 School Form 9 (SY 26-27).xlsx');
    if (!fs.existsSync(templatePath)) return;

    const nodeBuf = fs.readFileSync(templatePath);
    const mockOpts: SF9ExcelExportOptions = {
      student: {
        id: 's1',
        lrn: '100000000001',
        first_name: 'JUAN JR.',
        last_name: 'DELA CRUZ',
        gender: 'Male',
        student_section: 'sec1',
        grade_level: 'Grade 2'
      } as unknown as SF9ExcelExportOptions['student'],
      schoolProfile: {
        school_id: '100123',
        name: 'TEST ELEM'
      } as unknown as SF9ExcelExportOptions['schoolProfile'],
      schoolYear: '2026-2027',
      section: 'DIAMOND',
      adviser: 'JUAN DELA CRUZ',
      principal: 'MARIA SANTOS, PhD',
      principalTitle: 'Principal IV',
      grades: {
        'Filipino': [85, 0, 0], // Only Term 1 has grade
        'English': [0, 0, 0],    // No grades yet
        'Mathematics': [0, 0, 0],
      },
      subjects: [{ name: 'Filipino' }, { name: 'English' }, { name: 'Mathematics' }],
      observedValues: {},
      comments: [],
      attendance: {
        months: [],
        schoolDays: [],
        daysPresent: [],
        daysAbsent: []
      },
      gradeLevel: 'Grade 2'
    };

    const outBuffer = await populateGrade2TemplateBuffer(nodeBuf, mockOpts);
    const zip = await JSZip.loadAsync(outBuffer);
    const s6Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');

    // Term 2 & 3 for Filipino should NOT have <v>0</v>
    expect(s6Xml).not.toMatch(/<c\s+r="G33"[^>]*><f>[^<]*<\/f><v>0<\/v><\/c>/);
    expect(s6Xml).not.toMatch(/<c\s+r="H33"[^>]*><f>[^<]*<\/f><v>0<\/v><\/c>/);

    // Final Grade (I33) and Remark (J33) must NOT show 0 or "Failed" when terms are incomplete
    expect(s6Xml).not.toMatch(/<c\s+r="I33"[^>]*><f>[^<]*<\/f><v>0<\/v><\/c>/);
    expect(s6Xml).not.toMatch(/<c\s+r="I33"[^>]*><f>[^<]*<\/f><v>28<\/v><\/c>/);
    expect(s6Xml).not.toMatch(/<c\s+r="J33"[^>]*><f>[^<]*<\/f><v>Failed<\/v><\/c>/);

    // English (Row 34) should be blank across all terms
    expect(s6Xml).not.toMatch(/<c\s+r="F34"[^>]*><f>[^<]*<\/f><v>0<\/v><\/c>/);
    expect(s6Xml).not.toMatch(/<c\s+r="I34"[^>]*><f>[^<]*<\/f><v>0<\/v><\/c>/);
    expect(s6Xml).not.toMatch(/<c\s+r="J34"[^>]*><f>[^<]*<\/f><v>Failed<\/v><\/c>/);

    // General Average (I38) must not be 0 or Failed
    expect(s6Xml).not.toMatch(/<c\s+r="I38"[^>]*><f>[^<]*<\/f><v>0<\/v><\/c>/);
    expect(s6Xml).not.toMatch(/<c\s+r="J38"[^>]*><f>[^<]*<\/f><v>Failed<\/v><\/c>/);
  });
});

