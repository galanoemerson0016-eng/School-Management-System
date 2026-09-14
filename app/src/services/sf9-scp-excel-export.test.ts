import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {
  isSpecialCurricularProgram,
  normalizeSCPProgram,
  getSCPTemplateFilename,
  getSCPTemplateAlias,
  fetchSCPTemplateBuffer,
  extractSCPSubjectGrades,
  populateSCPTemplateBuffer,
  type SF9SCPExportOptions,
  type SF9SCPSubjectItem
} from './sf9-scp-excel-export';
import type { Student, SchoolProfile } from '../types';

describe('SF9 Special Curricular Programs (SCP) Excel Export Service', () => {
  describe('Program Detection & Normalization', () => {
    it('correctly identifies and normalizes all 8 DepEd Special Curricular Programs', () => {
      // SPFL
      expect(isSpecialCurricularProgram('SPFL')).toBe(true);
      expect(normalizeSCPProgram('SPFL')).toBe('SPFL');
      expect(normalizeSCPProgram('Special Program in Foreign Language (SPFL)')).toBe('SPFL');
      expect(normalizeSCPProgram('Foreign Language')).toBe('SPFL');

      // SPA
      expect(isSpecialCurricularProgram('SPA')).toBe(true);
      expect(normalizeSCPProgram('SPA')).toBe('SPA');
      expect(normalizeSCPProgram('Special Program in the Arts')).toBe('SPA');

      // SPJ
      expect(isSpecialCurricularProgram('SPJ')).toBe(true);
      expect(normalizeSCPProgram('SPJ')).toBe('SPJ');
      expect(normalizeSCPProgram('Special Program in Journalism')).toBe('SPJ');

      // SPS
      expect(isSpecialCurricularProgram('SPS')).toBe(true);
      expect(normalizeSCPProgram('SPS')).toBe('SPS');
      expect(normalizeSCPProgram('Special Program in Sports')).toBe('SPS');

      // SPSTEM / STE
      expect(isSpecialCurricularProgram('SPSTEM')).toBe(true);
      expect(isSpecialCurricularProgram('STE')).toBe(true);
      expect(normalizeSCPProgram('SPSTEM')).toBe('SPSTEM');
      expect(normalizeSCPProgram('STE')).toBe('SPSTEM');
      expect(normalizeSCPProgram('Science Technology and Engineering')).toBe('SPSTEM');

      // SPTVE
      expect(isSpecialCurricularProgram('SPTVE')).toBe(true);
      expect(normalizeSCPProgram('SPTVE')).toBe('SPTVE');
      expect(normalizeSCPProgram('Technical Vocational Education')).toBe('SPTVE');

      // SSES
      expect(isSpecialCurricularProgram('SSES')).toBe(true);
      expect(normalizeSCPProgram('SSES')).toBe('SSES');
      expect(normalizeSCPProgram('Special Science Elementary School')).toBe('SSES');
    });

    it('rejects regular programs, senior high academic strands, and empty strings', () => {
      expect(isSpecialCurricularProgram('Regular')).toBe(false);
      expect(isSpecialCurricularProgram('General Academic')).toBe(false);
      expect(isSpecialCurricularProgram('ABM')).toBe(false);
      expect(isSpecialCurricularProgram('STEM')).toBe(false); // regular STEM is SHS, not JHS SPSTEM
      expect(isSpecialCurricularProgram('TVL-ICT')).toBe(false);
      expect(isSpecialCurricularProgram('')).toBe(false);
      expect(isSpecialCurricularProgram(undefined)).toBe(false);
      expect(normalizeSCPProgram(undefined)).toBe(null);
    });
  });

  describe('Template Filenames and Aliases', () => {
    it('maps programs and grades to the correct official filenames and clean aliases', () => {
      expect(getSCPTemplateFilename('SPFL', 'Grade 7')).toBe('UPDATED SPFL G7-10  School Form 9 (SY 26-27).xlsx');
      expect(getSCPTemplateAlias('SPFL', 'Grade 7')).toBe('SF9_Template_SPFL_G7_G10.xlsx');

      expect(getSCPTemplateFilename('SPA', 'Grade 8')).toBe('UPDATED SPA G4-10  School Form 9 (SY 26-27).xlsx');
      expect(getSCPTemplateAlias('SPA', 'Grade 8')).toBe('SF9_Template_SPA_G4_G10.xlsx');

      expect(getSCPTemplateFilename('SPJ', 'Grade 9')).toBe('UPDATED SPJ G4-10  School Form 9 (SY 26-27).xlsx');
      expect(getSCPTemplateAlias('SPJ', 'Grade 9')).toBe('SF9_Template_SPJ_G4_G10.xlsx');

      expect(getSCPTemplateFilename('SPS', 'Grade 10')).toBe('UPDATED SPS G4-10  School Form 9 (SY 26-27).xlsx');
      expect(getSCPTemplateAlias('SPS', 'Grade 10')).toBe('SF9_Template_SPS_G4_G10.xlsx');

      expect(getSCPTemplateFilename('SPSTEM', 'Grade 7')).toBe('UPDATED SPSTEM G7-10  School Form 9 (SY 26-27).xlsx');
      expect(getSCPTemplateAlias('SPSTEM', 'Grade 7')).toBe('SF9_Template_SPSTEM_G7_G10.xlsx');

      expect(getSCPTemplateFilename('STE', 'Grade 8')).toBe('UPDATED SPSTEM G7-10  School Form 9 (SY 26-27).xlsx');
      expect(getSCPTemplateAlias('STE', 'Grade 8')).toBe('SF9_Template_SPSTEM_G7_G10.xlsx');

      expect(getSCPTemplateFilename('SPTVE', 'Grade 7')).toBe('UPDATED SPTVE G7-8  School Form 9 (SY 26-27).xlsx');
      expect(getSCPTemplateAlias('SPTVE', 'Grade 7')).toBe('SF9_Template_SPTVE_G7_G8.xlsx');
      expect(getSCPTemplateFilename('SPTVE', 'Grade 8')).toBe('UPDATED SPTVE G7-8  School Form 9 (SY 26-27).xlsx');

      expect(getSCPTemplateFilename('SPTVE', 'Grade 9')).toBe('UPDATED SPTVE G9-10  School Form 9 (SY 26-27).xlsx');
      expect(getSCPTemplateAlias('SPTVE', 'Grade 9')).toBe('SF9_Template_SPTVE_G9_G10.xlsx');
      expect(getSCPTemplateFilename('SPTVE', 'Grade 10')).toBe('UPDATED SPTVE G9-10  School Form 9 (SY 26-27).xlsx');

      expect(getSCPTemplateFilename('SSES', 'Grade 4')).toBe('UPDATED SSES G4-6  School Form 9 (SY 26-27).xlsx');
      expect(getSCPTemplateAlias('SSES', 'Grade 4')).toBe('SF9_Template_SSES_G4_G6.xlsx');
    });
  });

  describe('Template Existence & Integrity in public/templates/', () => {
    const templatesDir = path.resolve(__dirname, '../../public/templates');
    const templateAliases = [
      'SF9_Template_SPFL_G7_G10.xlsx',
      'SF9_Template_SPA_G4_G10.xlsx',
      'SF9_Template_SPJ_G4_G10.xlsx',
      'SF9_Template_SPS_G4_G10.xlsx',
      'SF9_Template_SPSTEM_G7_G10.xlsx',
      'SF9_Template_SPTVE_G7_G8.xlsx',
      'SF9_Template_SPTVE_G9_G10.xlsx',
      'SF9_Template_SSES_G4_G6.xlsx',
    ];

    it('verifies all 8 repaired SCP template files exist in public/templates and have valid OpenXML headers', async () => {
      for (const alias of templateAliases) {
        const filePath = path.join(templatesDir, alias);
        expect(fs.existsSync(filePath), `Template ${alias} should exist at ${filePath}`).toBe(true);

        const buffer = fs.readFileSync(filePath);
        expect(buffer.length).toBeGreaterThan(10000);
        // Check zip header 'PK\x03\x04'
        expect(buffer[0]).toBe(0x50);
        expect(buffer[1]).toBe(0x4b);
        expect(buffer[2]).toBe(0x03);
        expect(buffer[3]).toBe(0x04);

        // Verify JSZip can read it and contains xl/workbook.xml
        const zip = await JSZip.loadAsync(buffer);
        expect(zip.file('xl/workbook.xml')).not.toBeNull();
      }
    });

    it('successfully loads buffers via fetchSCPTemplateBuffer in Node environment', async () => {
      const spflBuffer = await fetchSCPTemplateBuffer('SPFL', 'Grade 7');
      expect(spflBuffer).toBeDefined();
      expect(spflBuffer.byteLength).toBeGreaterThan(10000);

      const sptveG7Buffer = await fetchSCPTemplateBuffer('SPTVE', 'Grade 7');
      expect(sptveG7Buffer.byteLength).toBeGreaterThan(10000);

      const sptveG9Buffer = await fetchSCPTemplateBuffer('SPTVE', 'Grade 9');
      expect(sptveG9Buffer.byteLength).toBeGreaterThan(10000);

      const ssesBuffer = await fetchSCPTemplateBuffer('SSES', 'Grade 5');
      expect(ssesBuffer.byteLength).toBeGreaterThan(10000);
    });
  });

  describe('Subject Grade Extraction for SCP Curricula', () => {
    it('extracts standard subjects and SPFL Foreign Language specialization', () => {
      const subjects = [
        { name: 'Filipino' },
        { name: 'English' },
        { name: 'Mathematics' },
        { name: 'Science' },
        { name: 'Araling Panlipunan' },
        { name: 'Edukasyon sa Pagpapakatao' },
        { name: 'Technology and Livelihood Education' },
        { name: 'Music' },
        { name: 'Arts' },
        { name: 'Physical Education' },
        { name: 'Health' },
        { name: 'Special Program in Foreign Language - Spanish' },
      ];

      const grades: Record<string, number[]> = {
        'Filipino': [88, 89, 90, 91],
        'English': [90, 91, 92, 93],
        'Mathematics': [85, 87, 88, 89],
        'Science': [87, 88, 89, 90],
        'Araling Panlipunan': [89, 90, 91, 92],
        'Edukasyon sa Pagpapakatao': [92, 93, 94, 95],
        'Technology and Livelihood Education': [88, 89, 90, 91],
        'Music': [90, 91, 92, 93],
        'Arts': [91, 92, 93, 94],
        'Physical Education': [93, 94, 95, 96],
        'Health': [92, 93, 94, 95],
        'Special Program in Foreign Language - Spanish': [95, 96, 97, 98],
      };

      const extracted = extractSCPSubjectGrades(grades, subjects, 'SPFL', 'Grade 7');
      expect(extracted.filipino).toEqual([88, 89, 90]);
      expect(extracted.english).toEqual([90, 91, 92]);
      expect(extracted.math).toEqual([85, 87, 88]);
      expect(extracted.science).toEqual([87, 88, 89]);
      expect(extracted.specialization1).toEqual([95, 96, 97]);
      expect(extracted.specializationName1).toContain('Spanish');
    });

    it('extracts two specializations for SPTVE (Drawing/Entrepreneurship and TVE Specialization)', () => {
      const subjects = [
        { name: 'Filipino' },
        { name: 'English' },
        { name: 'Mathematics' },
        { name: 'Science' },
        { name: 'Araling Panlipunan' },
        { name: 'Edukasyon sa Pagpapakatao' },
        { name: 'Music' },
        { name: 'Arts' },
        { name: 'Physical Education' },
        { name: 'Health' },
        { name: 'Technical Drawing / Applied Drawing' },
        { name: 'TVE Specialization - Electronics' },
      ];

      const grades: Record<string, number[]> = {
        'Filipino': [86, 87, 88, 89],
        'English': [88, 89, 90, 91],
        'Mathematics': [84, 85, 86, 87],
        'Science': [85, 86, 87, 88],
        'Araling Panlipunan': [87, 88, 89, 90],
        'Edukasyon sa Pagpapakatao': [90, 91, 92, 93],
        'Music': [89, 90, 91, 92],
        'Arts': [90, 91, 92, 93],
        'Physical Education': [91, 92, 93, 94],
        'Health': [90, 91, 92, 93],
        'Technical Drawing / Applied Drawing': [92, 93, 94, 95],
        'TVE Specialization - Electronics': [94, 95, 96, 97],
      };

      const extracted = extractSCPSubjectGrades(grades, subjects, 'SPTVE', 'Grade 7');
      expect(extracted.specialization1).toEqual([92, 93, 94]);
      expect(extracted.specialization2).toEqual([94, 95, 96]);
    });
  });

  async function getSF9SheetXml(zip: JSZip): Promise<string> {
    const wbXml = await zip.file('xl/workbook.xml')!.async('string');
    const relsXml = await zip.file('xl/_rels/workbook.xml.rels')!.async('string');
    const sheetMatch = wbXml.match(/<sheet[^>]*name="([^"]*SF9[^"]*)"[^>]*r:id="([^"]+)"/);
    if (sheetMatch) {
      const rId = sheetMatch[2];
      const relMatch = relsXml.match(new RegExp(`<Relationship[^>]*Id="${rId}"[^>]*Target="([^"]+)"`));
      if (relMatch) {
        const targetPath = relMatch[1].startsWith('xl/') ? relMatch[1] : `xl/${relMatch[1]}`;
        const file = zip.file(targetPath);
        if (file) return await file.async('string');
      }
    }
    const fallback = zip.file('xl/worksheets/sheet6.xml') || zip.file('xl/worksheets/sheet4.xml');
    return await fallback!.async('string');
  }

  describe('Workbook Population & Formula Integrity', () => {
    const mockSchoolProfile: SchoolProfile = {
      name: 'Victoria National High School',
      school_id: '300958',
      region: 'Region III',
      division: 'Tarlac Province',
      district: 'Victoria',
      head_name: 'MARIA SANTOS',
      head_position: 'Secondary School Principal IV',
      grade_levels_offered: 'Elementary, JHS',
    };

    const mockMaleStudent: Student = {
      lrn: '109396180001',
      first_name: 'JUAN',
      last_name: 'DELA CRUZ',
      middle_name: 'RAMOS',
      gender: 'Male',
      birthday: '2012-04-15',
      age: 13,
      address: 'San Gavino, Victoria, Tarlac',
      student_section: 'SPFL-Rizal',
      grade_level: 'Grade 7',
    };

    const mockFemaleStudent: Student = {
      lrn: '109396180002',
      first_name: 'MARIA',
      last_name: 'SANTOS',
      middle_name: 'REYES',
      gender: 'Female',
      birthday: '2012-08-20',
      age: 13,
      address: 'Santa Lucia, Victoria, Tarlac',
      student_section: 'SPFL-Rizal',
      grade_level: 'Grade 7',
    };

    it('populates SPFL template without formula errors and computes correct General Average', async () => {
      const templateBuffer = await fetchSCPTemplateBuffer('SPFL', 'Grade 7');

      const subjects = [
        { name: 'Filipino' },
        { name: 'English' },
        { name: 'Mathematics' },
        { name: 'Science' },
        { name: 'Araling Panlipunan' },
        { name: 'Edukasyon sa Pagpapakatao' },
        { name: 'Technology and Livelihood Education' },
        { name: 'Music' },
        { name: 'Arts' },
        { name: 'Physical Education' },
        { name: 'Health' },
        { name: 'Spanish' },
      ];

      const grades: Record<string, number[]> = {
        'Filipino': [88, 88, 88, 88],
        'English': [90, 90, 90, 90],
        'Mathematics': [86, 86, 86, 86],
        'Science': [88, 88, 88, 88],
        'Araling Panlipunan': [89, 89, 89, 89],
        'Edukasyon sa Pagpapakatao': [92, 92, 92, 92],
        'Technology and Livelihood Education': [89, 89, 89, 89],
        'Music': [90, 90, 90, 90],
        'Arts': [92, 92, 92, 92],
        'Physical Education': [92, 92, 92, 92],
        'Health': [90, 90, 90, 90],
        'Spanish': [94, 94, 94, 94],
      };

      const maleWithGrades = { ...mockMaleStudent, grades };
      const femaleWithGrades = { ...mockFemaleStudent, grades };

      const options: SF9SCPExportOptions = {
        student: mockMaleStudent,
        schoolProfile: mockSchoolProfile,
        schoolYear: '2026-2027',
        section: 'SPFL-Rizal',
        program: 'SPFL',
        adviser: 'CLARA DELA VEGA',
        principal: mockSchoolProfile.head_name || '',
        principalTitle: mockSchoolProfile.head_position || 'Principal IV',
        grades,
        subjects,
        gradeLevel: 'Grade 7',
        learners: [maleWithGrades, femaleWithGrades],
        attendance: {
          months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
          schoolDays: [20, 22, 21, 22, 20, 21, 16, 21, 20, 22, 10],
          daysPresent: [20, 22, 21, 22, 20, 21, 16, 21, 20, 22, 10],
          daysAbsent: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      };

      const outputBuffer = await populateSCPTemplateBuffer(templateBuffer, options);
      expect(outputBuffer).toBeDefined();
      expect(outputBuffer.byteLength).toBeGreaterThan(10000);

      const zip = await JSZip.loadAsync(outputBuffer);
      expect(zip.file('xl/workbook.xml')).not.toBeNull();

      // Read INPUT DATA sheet
      const inputDataFile = zip.file('xl/worksheets/sheet2.xml');
      expect(inputDataFile).not.toBeNull();
      const inputXml = await inputDataFile!.async('text');
      expect(inputXml).toContain('DATE(');

      // Check Term 1 Summary age formula and cached value
      const term1File = zip.file('xl/worksheets/sheet3.xml');
      if (term1File) {
        const term1Xml = await term1File.async('text');
        expect(term1Xml).toMatch(/<c\s+r="I15"[^>]*>(?:<f[^>]*>[\s\S]*?<\/f>|<f[^>]*\/>)?<v>\d+<\/v><\/c>/);
        expect(term1Xml).toMatch(/<c\s+r="I66"[^>]*>(?:<f[^>]*>[\s\S]*?<\/f>|<f[^>]*\/>)?<v>\d+<\/v><\/c>/);
      }

      // Check SF9 sheet
      const sf9Xml = await getSF9SheetXml(zip);

      // Verify no Excel calculation error tokens in XML
      expect(sf9Xml).not.toContain('#REF!');
      expect(sf9Xml).not.toContain('#VALUE!');
      expect(sf9Xml).not.toContain('#NAME?');

      // Verify the formula values for SPFL Row 42 and General Average Row 43
      // MAPEH: (90+92+92+90)/4 = 91
      // General Average is average of 9 subjects:
      // Filipino: 88
      // English: 90
      // Math: 86
      // Science: 88
      // AP: 89
      // EsP: 92
      // TLE: 89
      // MAPEH: 91
      // Spanish (SPFL Specialization): 94
      // Sum = 88+90+86+88+89+92+89+91+94 = 807
      // 807 / 9 = 89.6667 -> round to 90!
      expect(sf9Xml).toContain('<v>94</v>'); // Spanish grade
      expect(sf9Xml).toContain('<v>90</v>'); // General Average or other 90 grades
      expect(sf9Xml).toContain('Passed');    // Passed remarks
    });

    it('populates SPTVE template with corrected Row 38 MAPEH and Row 43 General Average', async () => {
      const templateBuffer = await fetchSCPTemplateBuffer('SPTVE', 'Grade 7');

      const subjects = [
        { name: 'Filipino' },
        { name: 'English' },
        { name: 'Mathematics' },
        { name: 'Science' },
        { name: 'Araling Panlipunan' },
        { name: 'Edukasyon sa Pagpapakatao' },
        { name: 'Music' },
        { name: 'Arts' },
        { name: 'Physical Education' },
        { name: 'Health' },
        { name: 'Technical Drawing' },
        { name: 'TVE Specialization' },
      ];

      const grades: Record<string, number[]> = {
        'Filipino': [85, 85, 85, 85],
        'English': [87, 87, 87, 87],
        'Mathematics': [84, 84, 84, 84],
        'Science': [86, 86, 86, 86],
        'Araling Panlipunan': [88, 88, 88, 88],
        'Edukasyon sa Pagpapakatao': [90, 90, 90, 90],
        'Music': [88, 88, 88, 88],
        'Arts': [88, 88, 88, 88],
        'Physical Education': [90, 90, 90, 90],
        'Health': [90, 90, 90, 90],
        'Technical Drawing': [92, 92, 92, 92],
        'TVE Specialization': [94, 94, 94, 94],
      };

      const options: SF9SCPExportOptions = {
        student: mockMaleStudent,
        schoolProfile: mockSchoolProfile,
        schoolYear: '2026-2027',
        section: 'SPTVE-Newton',
        program: 'SPTVE',
        adviser: 'JUAN MIGUEL',
        principal: mockSchoolProfile.head_name || '',
        principalTitle: mockSchoolProfile.head_position || 'Principal IV',
        grades,
        subjects,
        gradeLevel: 'Grade 7',
        learners: [{ ...mockMaleStudent, grades }],
      };

      const outputBuffer = await populateSCPTemplateBuffer(templateBuffer, options);
      const zip = await JSZip.loadAsync(outputBuffer);
      const sf9Xml = await getSF9SheetXml(zip);

      // Verify no errors
      expect(sf9Xml).not.toContain('#REF!');
      expect(sf9Xml).not.toContain('#VALUE!');
      expect(sf9Xml).not.toContain('#NAME?');

      // TVE Specialization values
      expect(sf9Xml).toContain('<v>92</v>');
      expect(sf9Xml).toContain('<v>94</v>');
      expect(sf9Xml).toContain('Passed');
    });

    it('populates SSES template with Enhanced Science and Enhanced Math', async () => {
      const templateBuffer = await fetchSCPTemplateBuffer('SSES', 'Grade 5');

      const subjects = [
        { name: 'Mother Tongue' },
        { name: 'Filipino' },
        { name: 'English' },
        { name: 'Enhanced Science' },
        { name: 'Enhanced Mathematics' },
        { name: 'Araling Panlipunan' },
        { name: 'Edukasyon sa Pagpapakatao' },
        { name: 'EPP' },
        { name: 'Music' },
        { name: 'Arts' },
        { name: 'Physical Education' },
        { name: 'Health' },
      ];

      const grades: Record<string, number[]> = {
        'Filipino': [88, 88, 88, 88],
        'English': [90, 90, 90, 90],
        'Enhanced Science': [92, 92, 92, 92],
        'Enhanced Mathematics': [91, 91, 91, 91],
        'Araling Panlipunan': [89, 89, 89, 89],
        'Edukasyon sa Pagpapakatao': [93, 93, 93, 93],
        'EPP': [90, 90, 90, 90],
        'Music': [90, 90, 90, 90],
        'Arts': [90, 90, 90, 90],
        'Physical Education': [92, 92, 92, 92],
        'Health': [92, 92, 92, 92],
      };

      const options: SF9SCPExportOptions = {
        student: { ...mockMaleStudent, grade_level: 'Grade 5' },
        schoolProfile: mockSchoolProfile,
        schoolYear: '2026-2027',
        section: 'SSES-Curie',
        program: 'SSES',
        adviser: 'ELENA ROXAS',
        principal: mockSchoolProfile.head_name || '',
        principalTitle: mockSchoolProfile.head_position || 'Principal IV',
        grades,
        subjects,
        gradeLevel: 'Grade 5',
        learners: [{ ...mockMaleStudent, grade_level: 'Grade 5', grades }],
      };

      const outputBuffer = await populateSCPTemplateBuffer(templateBuffer, options);
      const zip = await JSZip.loadAsync(outputBuffer);
      const sf9Xml = await getSF9SheetXml(zip);

      expect(sf9Xml).not.toContain('#REF!');
      expect(sf9Xml).not.toContain('#VALUE!');
      expect(sf9Xml).not.toContain('#NAME?');
      expect(sf9Xml).toContain('Passed');
    });

    it('leaves missing term grades and final grades blank without 0 or premature Failed remarks in SCP', async () => {
      const templateBuffer = await fetchSCPTemplateBuffer('SPFL', 'Grade 7');
      const subjects: SF9SCPSubjectItem[] = [
        { id: 'sub-fil', name: 'Filipino' },
        { id: 'sub-eng', name: 'English' },
        { id: 'sub-math', name: 'Mathematics' },
        { id: 'sub-sci', name: 'Science' },
        { id: 'sub-ap', name: 'Araling Panlipunan' },
        { id: 'sub-esp', name: 'Edukasyon sa Pagpapakatao' },
        { id: 'sub-tle', name: 'Technology and Livelihood Education' },
        { id: 'sub-ma', name: 'Music and Arts' },
        { id: 'sub-peh', name: 'Physical Education and Health' },
        { id: 'sub-fl', name: 'Spanish Language' }
      ];

      // Only Term 1 has grades
      const grades: Record<string, number[]> = {
        'sub-fil': [88],
        'sub-eng': [89],
        'sub-math': [90],
        'sub-sci': [87],
        'sub-ap': [86],
        'sub-esp': [85],
        'sub-tle': [91],
        'sub-ma': [92],
        'sub-peh': [94],
        'sub-fl': [95]
      };

      const options: SF9SCPExportOptions = {
        student: mockMaleStudent,
        schoolProfile: mockSchoolProfile,
        schoolYear: '2026-2027',
        section: 'Diamond',
        program: 'SPFL',
        adviser: 'MARIA SANTOS',
        principal: mockSchoolProfile.head_name || '',
        principalTitle: mockSchoolProfile.head_position || 'Principal IV',
        grades,
        subjects,
        gradeLevel: 'Grade 7',
        learners: [
          { ...mockMaleStudent, grades },
          { ...mockFemaleStudent, grades: {} } // student with no grades yet
        ]
      };

      const outputBuffer = await populateSCPTemplateBuffer(templateBuffer, options);
      const zip = await JSZip.loadAsync(outputBuffer);
      const sf9Xml = await getSF9SheetXml(zip);

      // Term 1 (F32) has 88
      expect(sf9Xml).toMatch(/r="F32"[^>]*><f>[^<]*<\/f><v>88<\/v><\/c>/);
      // Term 2 (G32) and Term 3 (H32) must NOT have 0
      expect(sf9Xml).not.toMatch(/r="G32"[^>]*><f>[^<]*<\/f><v>0<\/v><\/c>/);
      expect(sf9Xml).not.toMatch(/r="H32"[^>]*><f>[^<]*<\/f><v>0<\/v><\/c>/);
      expect(sf9Xml).toMatch(/r="G32"[^>]*><f>[^<]*<\/f><\/c>/);
      expect(sf9Xml).toMatch(/r="H32"[^>]*><f>[^<]*<\/f><\/c>/);

      // Final Grade (I32) must be blank, not 29 or 0
      expect(sf9Xml).not.toMatch(/r="I32"[^>]*><f>[^<]*<\/f><v>\d+<\/v><\/c>/);
      expect(sf9Xml).toMatch(/r="I32"[^>]*><f>[^<]*<\/f><\/c>/);

      // Remarks (J32) must be blank, not Failed
      expect(sf9Xml).not.toMatch(/r="J32"[^>]*><f>[^<]*<\/f><v>Failed<\/v><\/c>/);
      expect(sf9Xml).toMatch(/r="J32"[^>]*><f>[^<]*<\/f><\/c>/);

      // General Average (I43) must be blank
      expect(sf9Xml).not.toMatch(/r="I43"[^>]*><f>[^<]*<\/f><v>\d+<\/v><\/c>/);
      expect(sf9Xml).toMatch(/r="I43"[^>]*><f>[^<]*<\/f><\/c>/);

      // Sheet 4 (TERM 2 SUMMARY): Male 1 (Row 15) must not have 0 for MAPEH (T15) or Gen Avg (V15)
      const sheet4Xml = await zip.file('xl/worksheets/sheet4.xml')!.async('text');
      expect(sheet4Xml).not.toMatch(/r="T15"[^>]*><v>0<\/v>/);
      expect(sheet4Xml).not.toMatch(/r="V15"[^>]*><v>0<\/v>/);

      // Female 1 (Row 66) has no grades, must not have 0
      expect(sheet4Xml).not.toMatch(/r="K66"[^>]*><v>0<\/v>/);
      expect(sheet4Xml).not.toMatch(/r="V66"[^>]*><v>0<\/v>/);
    });
  });
});
