import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {
  populateGrade11AcademicTemplateBuffer,
} from './sf9-g11-academic-excel-export';
import {
  populateGrade11TechProTemplateBuffer,
} from './sf9-g11-techpro-excel-export';
import type { Student, SchoolProfile } from '../types';

function colToNum(colStr: string): number {
  let num = 0;
  for (let i = 0; i < colStr.length; i++) {
    num = num * 26 + (colStr.charCodeAt(i) - 64);
  }
  return num;
}

function validateSheetXml(sheetXml: string, _sheetName: string) {
  const issues: string[] = [];

  // 1. Check all rows for cell order and duplicate cells
  const rowRegex = /<row\s+r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let match;
  while ((match = rowRegex.exec(sheetXml)) !== null) {
    const rowNum = match[1];
    const rowContent = match[2];

    const cellRegex = /<c\s+r="([A-Z]+)(\d+)"/g;
    let cellMatch;
    const seenCols = new Set<string>();
    let lastColNum = 0;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const colLetters = cellMatch[1];
      const cellRow = cellMatch[2];
      const fullRef = `${colLetters}${cellRow}`;
      const colNumber = colToNum(colLetters);

      if (cellRow !== rowNum) {
        issues.push(`Row ${rowNum}: Cell ${fullRef} has mismatched row number!`);
      }

      if (seenCols.has(colLetters)) {
        issues.push(`Row ${rowNum}: DUPLICATE cell ${fullRef}!`);
      }
      seenCols.add(colLetters);

      if (colNumber < lastColNum) {
        issues.push(`Row ${rowNum}: OUT OF ORDER cell ${fullRef} after column number ${lastColNum}!`);
      }
      lastColNum = colNumber;
    }
  }

  // 2. Check for invalid formula / value tags
  // In OpenXML: <f>...</f> cannot be followed by invalid content
  // Also check unclosed tags
  const openCTags = (sheetXml.match(/<c[\s>]/g) || []).length;
  const closeCTags = (sheetXml.match(/<\/c>/g) || []).length;
  const selfClosingCTags = (sheetXml.match(/<c\s+[^>]*?\/>/g) || []).length;
  if (openCTags !== closeCTags + selfClosingCTags) {
    issues.push(`Cell tag mismatch: <c>=${openCTags}, </c>=${closeCTags}, self-closing=${selfClosingCTags}`);
  }

  // 3. Check for invalid type t="str" on empty or numeric cells
  // Look for cells like <c r="..." ... t="str"><f>...</f><v></v></c>
  const emptyStrValInFormula = sheetXml.match(/<c\s+r="[^"]+"[^>]*?t="str"[^>]*><f>[^<]+<\/f><v><\/v><\/c>/g);
  if (emptyStrValInFormula) {
    issues.push(`Found ${emptyStrValInFormula.length} formula cells with t="str" and empty <v></v>: ${emptyStrValInFormula.slice(0, 3).join(', ')}`);
  }

  // Look for <v></v> in general
  const emptyV = sheetXml.match(/<v><\/v>/g);
  if (emptyV) {
    issues.push(`Found ${emptyV.length} empty <v></v> tags`);
  }

  // 4. Check for unescaped ampersands in formulas or text
  const unescapedAmp = sheetXml.match(/<f>[^<]*&(?!(amp|lt|gt|quot|apos);)[^<]*<\/f>/g);
  if (unescapedAmp) {
    issues.push(`Found unescaped ampersands in formula: ${unescapedAmp.join(', ')}`);
  }

  // 5. Check styles: ensure all s="..." reference existing styles
  return issues;
}

describe('Diagnose Grade 11 SF9 Excel Repair Errors in sheet6.xml', () => {
  const student: Student = {
    lrn: '123456789012',
    first_name: 'JAMES',
    last_name: 'AMETHYST',
    gender: 'Male',
    grade_level: 'Grade 11',
    student_section: 'AMETHYST',
    birthday: '2010-01-01',
    age: 16,
    address: 'Cavite'
  };

  const schoolProfile: SchoolProfile = {
    school_id: '123456',
    name: 'AMETHYST HIGH SCHOOL',
    region: 'REGION IV-A',
    division: 'DIVISION OF CAVITE',
    district: 'DISTRICT I',
    head_name: 'PRINCIPAL NAME',
    head_position: 'Principal II',
    grade_levels_offered: '11-12',
  };

  it('checks G11 Academic template sheet6.xml for structural issues', async () => {
    const templatePath = path.resolve(__dirname, '../../public/templates/G11 Academic School Form 9 (SY 26-27).xlsx');
    const buffer = fs.readFileSync(templatePath);

    const rawZip = await JSZip.loadAsync(buffer);
    const rawSheet6Xml = await rawZip.file('xl/worksheets/sheet6.xml')!.async('text');
    const _rawAC5 = rawSheet6Xml.match(/<c r="AC5"[^>]*>[\s\S]*?<\/c>/);
    const _rawF34 = rawSheet6Xml.match(/<c r="F34"[^>]*>[\s\S]*?<\/c>/);
    const rawK41 = rawSheet6Xml.match(/<c r="K41"[^>]*>[\s\S]*?<\/c>/);
    const rawK44 = rawSheet6Xml.match(/<c r="K44"[^>]*>[\s\S]*?<\/c>/);
    console.log('--- RAW K41: ---', rawK41 ? rawK41[0] : 'not found');
    console.log('--- RAW K44: ---', rawK44 ? rawK44[0] : 'not found');

    // Test with empty/partial grades
    const populatedBuffer = await populateGrade11AcademicTemplateBuffer(buffer, {
      student,
      schoolProfile,
      schoolYear: '2026-2027',
      section: 'AMETHYST',
      adviser: 'Adviser Name',
      grades: {},
      subjects: [],
    });

    const zip = await JSZip.loadAsync(populatedBuffer);
    const stylesXml = await zip.file('xl/styles.xml')!.async('text');
    const cellXfsMatch = stylesXml.match(/<cellXfs\s+count="(\d+)"/);
    const maxStyle = cellXfsMatch ? parseInt(cellXfsMatch[1], 10) : 0;
    console.log('--- CellXfs count in Academic: ---', maxStyle);

    const sheet6Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');

    // Check if any cell in sheet6 has a style >= maxStyle
    const styleMatches = [...sheet6Xml.matchAll(/<c\s+[^>]*?s="(\d+)"/g)];
    const outOfBoundsStyles = styleMatches
      .map(m => parseInt(m[1], 10))
      .filter(s => s >= maxStyle);
    console.log('--- Out of bounds styles in Academic sheet6: ---', outOfBoundsStyles);

    const emptyFormulaCells = sheet6Xml.match(/<c\s+r="[^"]+"[^>]*><f>[^<]+<\/f><v><\/v><\/c>/g);
    expect(emptyFormulaCells).toBeNull();
    expect(outOfBoundsStyles).toEqual([]);

    const issues = validateSheetXml(sheet6Xml, 'sheet6.xml (Academic)');
    expect(issues).toEqual([]);
  });

  it('checks G11 Academic template sheet6.xml with full grades and Academic Excellence', async () => {
    const templatePath = path.resolve(__dirname, '../../public/templates/G11 Academic School Form 9 (SY 26-27).xlsx');
    const buffer = fs.readFileSync(templatePath);

    const populatedBuffer = await populateGrade11AcademicTemplateBuffer(buffer, {
      student,
      schoolProfile,
      schoolYear: '2026-2027',
      section: 'AMETHYST',
      adviser: 'Adviser Name',
      grades: {
        'Effective Communication': { q1: 95, q2: 96, q3: 94, final: 95 },
        'Mabisang Komunikasyon': { q1: 92, q2: 93, q3: 94, final: 93 },
        'General Mathematics': { q1: 94, q2: 95, q3: 96, final: 95 },
        'General Science': { q1: 91, q2: 92, q3: 93, final: 92 },
        'Life and Career Skills': { q1: 93, q2: 94, q3: 95, final: 94 },
        'Pampamayanang Paglilingkod': { q1: 96, q2: 97, q3: 95, final: 96 },
        'Academic Elective 1': { q1: 90, q2: 91, q3: 92, final: 91 },
        'Academic Elective 2': { q1: 93, q2: 94, q3: 95, final: 94 },
        'Academic Elective 3': { q1: 92, q2: 93, q3: 94, final: 93 },
      },
      subjects: [
        { id: '1', subject_name: 'Effective Communication', grade_level: 'Grade 11' },
        { id: '2', subject_name: 'Mabisang Komunikasyon', grade_level: 'Grade 11' },
        { id: '3', subject_name: 'General Mathematics', grade_level: 'Grade 11' },
        { id: '4', subject_name: 'General Science', grade_level: 'Grade 11' },
        { id: '5', subject_name: 'Life and Career Skills', grade_level: 'Grade 11' },
        { id: '6', subject_name: 'Pampamayanang Paglilingkod', grade_level: 'Grade 11' },
        { id: '7', subject_name: 'Academic Elective 1', grade_level: 'Grade 11' },
        { id: '8', subject_name: 'Academic Elective 2', grade_level: 'Grade 11' },
        { id: '9', subject_name: 'Academic Elective 3', grade_level: 'Grade 11' },
      ],
      attendance: {
        months: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        schoolDays: [20, 22, 21, 20, 15, 20, 19, 21, 20, 21, 10],
        daysPresent: [20, 22, 21, 20, 15, 20, 19, 21, 20, 21, 10],
        daysAbsent: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    });

    const zip = await JSZip.loadAsync(populatedBuffer);
    const stylesXml = await zip.file('xl/styles.xml')!.async('text');
    const cellXfsMatch = stylesXml.match(/<cellXfs\s+count="(\d+)"/);
    const maxStyle = cellXfsMatch ? parseInt(cellXfsMatch[1], 10) : 0;

    const sheet6Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');
    const styleMatches = [...sheet6Xml.matchAll(/<c\s+[^>]*?s="(\d+)"/g)];
    const outOfBoundsStyles = styleMatches
      .map(m => parseInt(m[1], 10))
      .filter(s => s >= maxStyle);
    expect(outOfBoundsStyles).toEqual([]);

    const emptyFormulaCells = sheet6Xml.match(/<c\s+r="[^"]+"[^>]*><f>[^<]+<\/f><v><\/v><\/c>/g);
    expect(emptyFormulaCells).toBeNull();

    const issues = validateSheetXml(sheet6Xml, 'sheet6.xml (Academic Full)');
    expect(issues).toEqual([]);
  });

  it('checks G11 TechPro template sheet6.xml for structural issues', async () => {
    const templatePath = path.resolve(__dirname, '../../public/templates/G11 TechPro School Form 9 (SY 26-27).xlsx');
    const buffer = fs.readFileSync(templatePath);

    const populatedBuffer = await populateGrade11TechProTemplateBuffer(buffer, {
      student,
      schoolProfile,
      schoolYear: '2026-2027',
      section: 'AMETHYST',
      adviser: 'Adviser Name',
      grades: {},
      subjects: [],
    });

    const zip = await JSZip.loadAsync(populatedBuffer);
    const stylesXml = await zip.file('xl/styles.xml')!.async('text');
    const cellXfsMatch = stylesXml.match(/<cellXfs\s+count="(\d+)"/);
    const maxStyle = cellXfsMatch ? parseInt(cellXfsMatch[1], 10) : 0;

    const sheet6Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');
    const styleMatches = [...sheet6Xml.matchAll(/<c\s+[^>]*?s="(\d+)"/g)];
    const outOfBoundsStyles = styleMatches
      .map(m => parseInt(m[1], 10))
      .filter(s => s >= maxStyle);
    expect(outOfBoundsStyles).toEqual([]);

    const emptyFormulaCells = sheet6Xml.match(/<c\s+r="[^"]+"[^>]*><f>[^<]+<\/f><v><\/v><\/c>/g);
    expect(emptyFormulaCells).toBeNull();

    const issues = validateSheetXml(sheet6Xml, 'sheet6.xml (TechPro)');
    expect(issues).toEqual([]);
  });

  it('checks G11 TechPro template sheet6.xml with full grades', async () => {
    const templatePath = path.resolve(__dirname, '../../public/templates/G11 TechPro School Form 9 (SY 26-27).xlsx');
    const buffer = fs.readFileSync(templatePath);

    const populatedBuffer = await populateGrade11TechProTemplateBuffer(buffer, {
      student,
      schoolProfile,
      schoolYear: '2026-2027',
      section: 'AMETHYST',
      adviser: 'Adviser Name',
      grades: {
        'Effective Communication': { q1: 88, q2: 89, q3: 90, final: 89 },
        'Mabisang Komunikasyon': { q1: 85, q2: 86, q3: 87, final: 86 },
        'General Mathematics': { q1: 84, q2: 85, q3: 86, final: 85 },
        'General Science': { q1: 86, q2: 87, q3: 88, final: 87 },
        'Life and Career Skills': { q1: 90, q2: 91, q3: 92, final: 91 },
        'Pampamayanang Paglilingkod': { q1: 92, q2: 93, q3: 94, final: 93 },
        'Specialized Technical Subject': { q1: 88, q2: 89, q3: 90, final: 89 },
      },
      subjects: [
        { id: '1', subject_name: 'Effective Communication', grade_level: 'Grade 11' },
        { id: '2', subject_name: 'Mabisang Komunikasyon', grade_level: 'Grade 11' },
        { id: '3', subject_name: 'General Mathematics', grade_level: 'Grade 11' },
        { id: '4', subject_name: 'General Science', grade_level: 'Grade 11' },
        { id: '5', subject_name: 'Life and Career Skills', grade_level: 'Grade 11' },
        { id: '6', subject_name: 'Pampamayanang Paglilingkod', grade_level: 'Grade 11' },
        { id: '7', subject_name: 'Specialized Technical Subject', grade_level: 'Grade 11' },
      ],
      attendance: {
        months: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        schoolDays: [20, 22, 21, 20, 15, 20, 19, 21, 20, 21, 10],
        daysPresent: [19, 21, 20, 19, 14, 19, 18, 20, 19, 20, 9],
        daysAbsent: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      },
    });

    const zip = await JSZip.loadAsync(populatedBuffer);
    const stylesXml = await zip.file('xl/styles.xml')!.async('text');
    const cellXfsMatch = stylesXml.match(/<cellXfs\s+count="(\d+)"/);
    const maxStyle = cellXfsMatch ? parseInt(cellXfsMatch[1], 10) : 0;

    const sheet6Xml = await zip.file('xl/worksheets/sheet6.xml')!.async('text');
    const styleMatches = [...sheet6Xml.matchAll(/<c\s+[^>]*?s="(\d+)"/g)];
    const outOfBoundsStyles = styleMatches
      .map(m => parseInt(m[1], 10))
      .filter(s => s >= maxStyle);
    expect(outOfBoundsStyles).toEqual([]);

    const emptyFormulaCells = sheet6Xml.match(/<c\s+r="[^"]+"[^>]*><f>[^<]+<\/f><v><\/v><\/c>/g);
    expect(emptyFormulaCells).toBeNull();

    const issues = validateSheetXml(sheet6Xml, 'sheet6.xml (TechPro Full)');
    expect(issues).toEqual([]);
  });
});
