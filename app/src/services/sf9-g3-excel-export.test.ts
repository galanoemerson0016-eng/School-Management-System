import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {
  isGrade3,
  fetchGrade3TemplateBuffer,
  populateGrade3TemplateBuffer
} from './sf9-g3-excel-export';
import type { SF9ExcelExportOptions } from './sf9-excel-export';

describe('Grade 3 SF9 Excel Export Service', () => {
  it('identifies Grade 3 variants correctly', () => {
    expect(isGrade3('Grade 3')).toBe(true);
    expect(isGrade3('Grade3')).toBe(true);
    expect(isGrade3('3')).toBe(true);
    expect(isGrade3('G3')).toBe(true);
    expect(isGrade3('Three')).toBe(true);
    expect(isGrade3('Grade 3 - Mabini')).toBe(true);
    expect(isGrade3('Grade 2')).toBe(false);
    expect(isGrade3('Grade 1')).toBe(false);
    expect(isGrade3('Grade 4')).toBe(false);
  });

  it('loads the Grade 3 template buffer from disk in test environment', async () => {
    const buffer = await fetchGrade3TemplateBuffer();
    expect(buffer).toBeDefined();
    expect(buffer.byteLength).toBeGreaterThan(10000);
  });

  it('populates official Grade 3 template with 6 subjects (including Science), pre-computed remarks, and logo injection', async () => {
    const templatePath = path.resolve(process.cwd(), 'public/templates/G3 School Form 9 (SY 26-27).xlsx');
    const nodeBuf = fs.readFileSync(templatePath);

    const mockOpts: SF9ExcelExportOptions = {
      student: {
        id: 's1',
        lrn: '100000000001',
        first_name: 'JUAN JR.',
        last_name: 'DELA CRUZ',
        middle_name: 'A.',
        gender: 'Male',
        birthday: '2018-05-12',
        student_section: 'sec1',
        grade_level: 'Grade 3'
      } as unknown as SF9ExcelExportOptions['student'],
      schoolProfile: {
        name: 'BACARRA CENTRAL ELEMENTARY SCHOOL',
        school_id: '100123',
        district: 'Bakarra District',
        division: 'ILOCOS NORTE',
        region: 'REGION I',
        head_name: 'MARIA SANTOS, PhD',
        head_position: 'Principal IV',
        logo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      } as unknown as SF9ExcelExportOptions['schoolProfile'],
      schoolYear: '2026-2027',
      section: 'ROSE',
      adviser: 'JUAN DELA CRUZ',
      principal: 'MARIA SANTOS, PhD',
      principalTitle: 'Principal IV',
      grades: {
        'Filipino': [88, 90, 92],
        'English': [85, 87, 89],
        'Mathematics': [90, 92, 94],
        'Science': [89, 91, 93],
        'GMRC': [92, 93, 95],
        'Makabansa': [91, 92, 94]
      },
      subjects: [
        { name: 'Filipino' },
        { name: 'English' },
        { name: 'Mathematics' },
        { name: 'Science' },
        { name: 'GMRC' },
        { name: 'Makabansa' }
      ],
      observedValues: {},
      comments: ['Good', 'Very Good', 'Excellent'],
      attendance: {
        months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
        schoolDays: [20, 22, 21, 20, 22, 20, 15, 21, 20, 22, 10],
        daysPresent: [20, 22, 21, 20, 22, 20, 15, 21, 20, 22, 10],
        daysAbsent: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      },
      gradeLevel: 'Grade 3',
      sectionStudents: [
        {
          id: 's1',
          lrn: '100000000001',
          first_name: 'JUAN JR.',
          last_name: 'DELA CRUZ',
          middle_name: 'A.',
          gender: 'Male',
          birthday: '2018-05-12',
          student_section: 'sec1',
          grade_level: 'Grade 3',
          grades: {
            'Filipino': [88, 90, 92],
            'English': [85, 87, 89],
            'Mathematics': [90, 92, 94],
            'Science': [89, 91, 93],
            'GMRC': [92, 93, 95],
            'Makabansa': [91, 92, 94]
          },
          attendance: {
            daysPresent: [20, 22, 21, 20, 22, 20, 15, 21, 20, 22, 10]
          }
        },
        {
          id: 's2',
          lrn: '100000000002',
          first_name: 'MARIA CLARA',
          last_name: 'SANTOS',
          middle_name: 'C.',
          gender: 'Female',
          birthday: '2018-03-15',
          student_section: 'sec1',
          grade_level: 'Grade 3',
          grades: {
            'Filipino': [90, 92, 94],
            'English': [88, 90, 92],
            'Mathematics': [92, 94, 96],
            'Science': [91, 93, 95],
            'GMRC': [94, 95, 96],
            'Makabansa': [93, 94, 95]
          },
          attendance: {
            daysPresent: [18, 20, 19, 21, 20, 19, 14, 20, 19, 21, 9]
          }
        }
      ] as unknown as NonNullable<SF9ExcelExportOptions['sectionStudents']>
    };

    const outBuffer = await populateGrade3TemplateBuffer(nodeBuf, mockOpts);
    expect(outBuffer).toBeDefined();
    expect(outBuffer.byteLength).toBeGreaterThan(10000);

    // Verify zip structure and contents
    const zip = await JSZip.loadAsync(outBuffer);
    expect(zip.file('xl/calcChain.xml')).toBeNull();
    expect(zip.file('xl/workbook.xml')).toBeDefined();
    expect(zip.file('xl/worksheets/sheet2.xml')).toBeDefined(); // INPUT DATA
    expect(zip.file('xl/worksheets/sheet3.xml')).toBeDefined(); // TERM 1
    expect(zip.file('xl/worksheets/sheet6.xml')).toBeDefined(); // SF9 - GRADE 3
    expect(zip.file('xl/worksheets/sheet7.xml')).toBeDefined(); // ATTENDANCE RECORD SUMMARY
    expect(zip.file('xl/worksheets/sheet8.xml')).toBeNull(); // FINAL GRADES removed in updated template

    const relsXml = await zip.file('xl/_rels/workbook.xml.rels')!.async('text');
    expect(relsXml).not.toContain('calcChain.xml');

    const ctXml = await zip.file('[Content_Types].xml')!.async('text');
    expect(ctXml).not.toContain('calcChain.xml');

    const wbXml = await zip.file('xl/workbook.xml')!.async('text');
    expect(wbXml).toContain('fullCalcOnLoad="1"');
    expect(wbXml).toContain('forceFullCalc="1"');
    expect(wbXml).toContain('activeTab="5"');

    const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');
    expect(sheet2Xml).toContain('BACARRA CENTRAL ELEMENTARY SCHOOL');
    expect(sheet2Xml).toContain('100000000001');
    expect(sheet2Xml).toContain('r="L11"'); // Male 1 Name
    expect(sheet2Xml).toContain('r="Q11"'); // Female 1 Name

    // Term 1 summary checks (Sex in column J, Science in column N)
    const sheet3Xml = await zip.file('xl/worksheets/sheet3.xml')!.async('text');
    expect(sheet3Xml).toContain('r="J14"'); // Male 1 Sex on Row 14
    expect(sheet3Xml).toContain('M');
    expect(sheet3Xml).toContain('r="J65"'); // Female 1 Sex on Row 65
    expect(sheet3Xml).toContain('F');
    expect(sheet3Xml).toContain('r="K14"'); // Male 1 Filipino on Row 14
    expect(sheet3Xml).toContain('r="N14"'); // Male 1 Science on Row 14
    expect(sheet3Xml).toContain('r="K65"'); // Female 1 Filipino on Row 65
    expect(sheet3Xml).toContain('r="N65"'); // Female 1 Science on Row 65
    expect(sheet3Xml).toContain('BACARRA CENTRAL ELEMENTARY SCHOOL');

    // Attendance sheet checks (sheet7.xml in updated template)
    const sheet7Xml = await zip.file('xl/worksheets/sheet7.xml')!.async('text');
    expect(sheet7Xml).toContain('JUAN DELA CRUZ'); // Adviser in L10/L11
    expect(sheet7Xml).toMatch(/r="F14"[^>]*><v>20<\/v>/); // Male 1 attendance
    expect(sheet7Xml).toMatch(/r="F65"[^>]*><v>18<\/v>/); // Female 1 attendance
    expect(sheet7Xml).not.toContain('<is><t xml:space="preserve"></t></is>'); // No malformed empty inlineStr

    // SF9 sheet checks (sheet6.xml in updated template)
    const sheet6Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');
    expect(sheet6Xml).toContain('DELA CRUZ, JUAN JR.');
    expect(sheet6Xml).toContain('BACARRA CENTRAL ELEMENTARY SCHOOL'); // B12
    expect(sheet6Xml).toContain('REGION I'); // B7
    expect(sheet6Xml).toContain('100123'); // B10
    expect(sheet6Xml).toContain('MARIA SANTOS, PhD'); // B27, Q41, Q49
    expect(sheet6Xml).toContain('r="K17"'); // Sex on Card
    expect(sheet6Xml).toContain('r="I17"'); // Age on Card
    expect(sheet6Xml).toContain('r="S7"'); // July Days Present
    expect(sheet6Xml).toContain("VLOOKUP(C17,'ATTENDANCE RECORD SUMMARY'!$C$14:$P$114,5,0)"); // July formula repaired
    expect(sheet6Xml).toContain('r="R5"'); // School days
    expect(sheet6Xml).toContain('IF(COUNT(I33:I38)=0,"",AVERAGE((I33:I38)))'); // Repaired General Average formula
    expect(sheet6Xml).not.toContain('<f>#REF!</f>');
    expect(sheet6Xml).not.toContain('<v>#REF!</v>');

    // Check cached grades and Remarks (Column J rows 33-39)
    expect(sheet6Xml).toContain('r="J33"'); // Filipino remark
    expect(sheet6Xml).toContain('r="J34"'); // English remark
    expect(sheet6Xml).toContain('r="J35"'); // Math remark
    expect(sheet6Xml).toContain('r="J36"'); // Science remark
    expect(sheet6Xml).toContain('r="J37"'); // GMRC remark
    expect(sheet6Xml).toContain('r="J38"'); // Makabansa remark
    expect(sheet6Xml).toContain('r="J39"'); // General Average remark
    expect(sheet6Xml).toContain('Passed');

    // Check School Logo injection in drawing6.xml
    expect(zip.file('xl/media/school_logo.png')).toBeDefined();
    const d6Xml = await zip.file('xl/drawings/drawing6.xml')!.async('text');
    expect(d6Xml).toContain('name="School Logo"');
    expect(d6Xml).not.toContain('name="Shape 3"');
  });
});
