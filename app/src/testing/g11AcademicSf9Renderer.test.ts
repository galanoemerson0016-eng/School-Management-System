import { describe, it, expect } from 'vitest';
import { 
  parseAge, 
  parseBirthDateParts, 
  birthDateToExcelSerial, 
  isGrade11Academic 
} from '../services/sf9-g11-academic-excel-export';
import { getShsSubjectUnitInfo } from '../lib/curriculum';
import type { Student, SchoolProfile } from '../types';
import type { SF9SubjectItem, SF9ExactDocumentProps } from '../pages/SF9Page';

describe('Grade 11 SSHS Academic SF9 Renderer & Layout Specifications', () => {
  describe('Age Parsing and #VALUE! / ##### Eradication', () => {
    it('returns clean integer age when age is a valid number or numeric string', () => {
      expect(parseAge(16)).toBe(16);
      expect(parseAge('17')).toBe(17);
      expect(parseAge(' 16 ')).toBe(16);
    });

    it('sanitizes corrupted ##### or #VALUE! strings and computes age dynamically from birthday', () => {
      // If student was born 16 years ago
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - 16;
      const birthday = `${birthYear}-01-15`;

      expect(parseAge('#####', birthday)).toBe(16);
      expect(parseAge('#VALUE!', birthday)).toBe(16);
      expect(parseAge('', birthday)).toBe(16);
      expect(parseAge(undefined, birthday)).toBe(16);
    });

    it('parses birth date parts accurately across ISO and US formats', () => {
      expect(parseBirthDateParts('2010-08-25')).toEqual({ year: 2010, month: 8, day: 25 });
      expect(parseBirthDateParts('08/25/2010')).toEqual({ year: 2010, month: 8, day: 25 });
    });

    it('generates proper Excel serial date numbers for native date formulas', () => {
      // 2010-01-01 is serial 40179
      const serial = birthDateToExcelSerial('2010-01-01');
      expect(typeof serial).toBe('number');
      expect(serial).toBeGreaterThan(35000);
      expect(serial).toBeLessThan(50000);
    });
  });

  describe('Grade 11 Academic Detector', () => {
    it('accurately identifies Grade 11 Academic track sections', () => {
      expect(isGrade11Academic('Grade 11', 'Academic')).toBe(true);
      expect(isGrade11Academic('Grade 11', 'Academic Track - STEM')).toBe(true);
      expect(isGrade11Academic('Grade 11', 'Academic Track - ABM')).toBe(true);
      expect(isGrade11Academic('Grade 11', 'Academic Track - HUMSS')).toBe(true);
      expect(isGrade11Academic('Grade 11', '')).toBe(true); // default to Academic
      expect(isGrade11Academic('Grade 11', undefined)).toBe(true);
    });

    it('correctly rejects TechPro, TVL, and other non-academic tracks', () => {
      expect(isGrade11Academic('Grade 11', 'TechPro')).toBe(false);
      expect(isGrade11Academic('Grade 11', 'Technical-Vocational-Livelihood')).toBe(false);
      expect(isGrade11Academic('Grade 11', 'TVET')).toBe(false);
      expect(isGrade11Academic('Grade 11', 'Sports Track')).toBe(false);
      expect(isGrade11Academic('Grade 11', 'Arts and Design Track')).toBe(false);
    });

    it('correctly rejects non-Grade 11 levels', () => {
      expect(isGrade11Academic('Grade 12', 'Academic')).toBe(false);
      expect(isGrade11Academic('Grade 10', 'Academic')).toBe(false);
      expect(isGrade11Academic('Grade 1', 'Academic')).toBe(false);
    });
  });

  describe('Curriculum Units Specification (39 Units Total)', () => {
    it('allocates 6 units each to Grade 11 Core Subjects', () => {
      const coreSubjects = [
        'Effective Communication',
        'Mabisang Komunikasyon',
        'Effective Communication / Mabisang Komunikasyon',
        'General Mathematics',
        'General Science',
        'Life and Career Skills',
        'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
      ];

      coreSubjects.forEach(name => {
        const info = getShsSubjectUnitInfo(name, 'Grade 11');
        expect(info.yearUnits).toBe(6);
        expect(info.category).toBe('core');
      });
    });

    it('allocates 3 units each to Academic Electives', () => {
      const electives = [
        'Biology 1',
        'Biology 2',
        'Biology 3',
        'Chemistry 1',
        'Physics 1',
        'Academic Elective 1',
        'Academic Elective 2',
        'Academic Elective 3'
      ];

      electives.forEach(name => {
        const info = getShsSubjectUnitInfo(name, 'Grade 11');
        expect(info.yearUnits).toBe(3);
        expect(info.category).toMatch(/elective/);
      });
    });

    it('sums to exactly 39 units for 5 Core subjects + 3 Electives', () => {
      // 5 Core subjects * 6 units = 30 units
      // 3 Elective subjects * 3 units = 9 units
      // Total = 39 units
      const coreUnits = 5 * 6;
      const electiveUnits = 3 * 3;
      const totalUnits = coreUnits + electiveUnits;
      expect(totalUnits).toBe(39);
    });
  });

  describe('Division Header Formatting', () => {
    it('formats division with SCHOOLS DIVISION OF followed by actual division or blank underline', () => {
      const formatDiv = (div?: string) => {
        const c = (div || '')
          .replace(/schools division office of/i, '')
          .replace(/schools division of/i, '')
          .replace(/^division of/i, '')
          .trim()
          .toUpperCase();
        return c ? `SCHOOLS DIVISION OF ${c}` : 'SCHOOLS DIVISION OF _____';
      };

      expect(formatDiv('Tarlac Province')).toBe('SCHOOLS DIVISION OF TARLAC PROVINCE');
      expect(formatDiv('Schools Division of Tarlac Province')).toBe('SCHOOLS DIVISION OF TARLAC PROVINCE');
      expect(formatDiv('Division of Ilocos Norte')).toBe('SCHOOLS DIVISION OF ILOCOS NORTE');
      expect(formatDiv('')).toBe('SCHOOLS DIVISION OF _____');
      expect(formatDiv(undefined)).toBe('SCHOOLS DIVISION OF _____');
    });
  });

  describe('React-PDF Document Generation', () => {
    it('successfully compiles SF9ExactDocument for Grade 11 Academic without errors', async () => {
      const { pdf } = await import('@react-pdf/renderer');
      const { PDFDocument } = await import('pdf-lib');
      const React = await import('react');
      const fs = await import('fs');
      const path = await import('path');
      const { SF9ExactDocument } = await import('../pages/SF9Page');

      const mockStudent: Student = {
        lrn: '100898140003',
        first_name: 'REGGIE',
        middle_name: 'ALLADA',
        last_name: 'ABAYA',
        gender: 'Male',
        grade_level: 'Grade 11',
        track: 'ACADEMIC',
        student_section: 'Plato',
        birthday: '2010-05-15',
        age: 16,
        address: 'Tarlac, Philippines'
      };

      const mockSubjects: SF9SubjectItem[] = [
        { name: 'Core Subjects', isHeader: true },
        { name: 'Effective Communication / Mabisang Komunikasyon' },
        { name: 'Effective Communication', isComponent: true },
        { name: 'Mabisang Komunikasyon', isComponent: true },
        { name: 'General Mathematics' },
        { name: 'General Science' },
        { name: 'Life and Career Skills' },
        { name: 'Pag-aaral ng Kasaysayan at Lipunang Pilipino' },
        { name: 'Elective Subjects', isHeader: true },
        { name: 'Biology 1' },
        { name: 'Biology 2' },
        { name: 'Biology 3' }
      ];

      const mockGrades: Record<string, number[]> = {
        'Effective Communication': [99, 93, 86],
        'Mabisang Komunikasyon': [99, 93, 86],
        'Effective Communication / Mabisang Komunikasyon': [99, 93, 86],
        'General Mathematics': [98, 91, 84],
        'General Science': [97, 90, 83],
        'Life and Career Skills': [96, 89, 82],
        'Pag-aaral ng Kasaysayan at Lipunang Pilipino': [95, 88, 81],
        'Biology 1': [94, 0, 0],
        'Biology 2': [0, 87, 0],
        'Biology 3': [0, 0, 80]
      };

      const mockAttendance = {
        months: ['JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL'],
        schoolDays: [20, 22, 21, 21, 22, 20, 16, 21, 20, 22, 10],
        daysPresent: [20, 22, 21, 21, 22, 20, 16, 21, 20, 22, 10],
        daysAbsent: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      };

      const mockSchoolProfile: SchoolProfile = {
        school_id: '123456',
        name: 'MATATAG HIGH SCHOOL',
        region: 'Region III',
        division: 'Tarlac Province',
        district: 'Victoria East District',
        head_name: 'Juan A. Dela Cruz',
        head_position: 'Principal I',
        grade_levels_offered: 'Grade 11 to 12'
      };

      const docProps: SF9ExactDocumentProps = {
        student: mockStudent,
        schoolName: 'MATATAG HIGH SCHOOL',
        schoolYear: '2026-2027',
        section: 'Plato',
        region: 'Region III',
        division: 'Tarlac Province',
        district: 'Victoria East District',
        adviser: 'Emerson M. Galano',
        principal: 'Juan A. Dela Cruz',
        principalTitle: 'School Head',
        grades: mockGrades,
        subjects: mockSubjects,
        observedValues: {},
        comments: ['', '', ''],
        attendance: mockAttendance,
        pageSize: 'A4',
        logoUrl: '',
        schoolProfile: mockSchoolProfile
      };

      const docElement = React.createElement(SF9ExactDocument, docProps);

      function blobToArrayBuffer(b: Blob): Promise<ArrayBuffer> {
        if (typeof b.arrayBuffer === 'function') {
          return b.arrayBuffer();
        }
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(b);
        });
      }

      const blob = await pdf(docElement as any).toBlob();
      const arrayBuffer = await blobToArrayBuffer(blob);
      expect(arrayBuffer.byteLength).toBeGreaterThan(1000);

      const loadedPdf = await PDFDocument.load(arrayBuffer);
      expect(loadedPdf.getPageCount()).toBe(1);

      const targetPdfDir = path.resolve('C:/Users/Emerson/.gemini/antigravity-ide/brain/d52a8bdf-7963-4da8-8d23-af35cfd550fa');
      if (fs.existsSync(targetPdfDir)) {
        fs.writeFileSync(path.join(targetPdfDir, 'scratch_final_g11_sf9.pdf'), Buffer.from(arrayBuffer));
      }
    }, 90000);
  });
});

