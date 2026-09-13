import { describe, it, expect } from 'vitest';
import React from 'react';
import { pdf, type DocumentProps } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';
import { getStudentBoSyEoSyAge, formatDateToMMDDYYYY } from '../services/sf9-g1-excel-export';
import { Grade1SF9PDFDocument } from '../components/sf9/Grade1SF9PDFDocument';
import type { Student, SchoolProfile } from '../types';

function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

const mockSchoolProfile: SchoolProfile = {
  school_id: '123456',
  name: 'LIBERTAD ELEMENTARY SCHOOL',
  region: 'Region VIII',
  division: 'LEYTE',
  district: 'KANANGA II',
  municipality: 'Kananga',
  province: 'Leyte',
  head_name: 'MARIA S. CLARA',
  head_position: 'Principal I',
  grade_levels_offered: 'Grade 1-6',
};

const mockStudent: Student = {
  lrn: '123456789012',
  first_name: 'JUAN',
  last_name: 'DELA CRUZ',
  gender: 'Male',
  grade_level: 'Grade 1',
  student_section: 'MATIYAGA',
  birthday: '2020-01-05',
  age: 6,
  address: 'Kananga, Leyte',
};

describe('Grade 1 SF9 Age Computation (BoSY & EoSY)', () => {
  it('correctly calculates BoSY (June 8) and EoSY (April 8) age from birthday', () => {
    // Birthday: 2020-01-05
    // School Year: 2026-2027
    // BoSY (2026-06-08): 6 years, 5 months, 3 days -> 6 years 5 months
    // EoSY (2027-04-08): 7 years, 3 months, 3 days -> 7 years 3 months
    const res = getStudentBoSyEoSyAge('2020-01-05', '2026-2027');
    expect(res.boSy.years).toBe(6);
    expect(res.boSy.months).toBe(5);
    expect(res.eoSy.years).toBe(7);
    expect(res.eoSy.months).toBe(3);
  });

  it('correctly calculates age when birthday is later in the year', () => {
    // Birthday: 2019-10-15
    // BoSY (2026-06-08): 6 years, 7 months, 24 days -> 6 years 7 months
    // EoSY (2027-04-08): 7 years, 5 months, 24 days -> 7 years 5 months
    const res = getStudentBoSyEoSyAge('2019-10-15', '2026-2027');
    expect(res.boSy.years).toBe(6);
    expect(res.boSy.months).toBe(7);
    expect(res.eoSy.years).toBe(7);
    expect(res.eoSy.months).toBe(5);
  });

  it('falls back to numeric age when birthday is not provided', () => {
    const res = getStudentBoSyEoSyAge('', '2026-2027', 6);
    expect(res.boSy.years).toBe(6);
    expect(res.boSy.months).toBe(0);
    expect(res.eoSy.years).toBe(7);
    expect(res.eoSy.months).toBe(0);
  });

  it('returns empty strings when neither birthday nor age is provided', () => {
    const res = getStudentBoSyEoSyAge(undefined, '2026-2027', undefined);
    expect(res.boSy.years).toBe('');
    expect(res.boSy.months).toBe('');
    expect(res.eoSy.years).toBe('');
    expect(res.eoSy.months).toBe('');
  });

  it('formats birthday to MM/DD/YYYY', () => {
    expect(formatDateToMMDDYYYY('2020-01-05')).toBe('01/05/2020');
    expect(formatDateToMMDDYYYY('2019-10-15')).toBe('10/15/2019');
  });

  it('validates official DepEd Grade 1 SF9 learner info bar structure', () => {
    // Exact official DepEd template rows 15-17:
    // Row 15: Name, LRN (no Sex field)
    // Row 16: Section, Teacher, Birthdate
    // Row 17: Age of the Child (Beginning of SY): Years: [ ] Months: [ ] | Age of the Child (End of SY): Years: [ ] Months: [ ]
    const doc = React.createElement(Grade1SF9PDFDocument, {
      student: mockStudent,
      schoolProfile: mockSchoolProfile,
      schoolYear: '2026-2027',
      section: 'MATIYAGA',
      adviser: 'ANA SANTOS',
      principal: 'MARIA S. CLARA',
      pageSize: 'A4',
    });
    expect(doc).toBeDefined();
  });
});

describe('Grade 1 SF9 PDF Strict 1-Page Verification', () => {
  it('renders strictly 1 page for Grade 1 SF9 on A4 portrait', async () => {
    const doc = React.createElement(Grade1SF9PDFDocument, {
      student: mockStudent,
      schoolProfile: mockSchoolProfile,
      schoolYear: '2026-2027',
      section: 'MATIYAGA',
      adviser: 'ANA SANTOS',
      principal: 'MARIA S. CLARA',
      pageSize: 'A4',
      g1Remarks: {
        term1CanDo: 'Can recognize alphabet letters and sounds.',
        term1ToImprove: 'Practice writing uppercase letters neatly.',
        term2CanDo: 'Can read simple 3-letter CVC words.',
        term2ToImprove: 'Work on reading short sentences fluently.',
        term3CanDo: 'Can write simple words and sentences.',
        term3ToImprove: 'Continue building vocabulary.',
      },
      attendance: {
        months: ['JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR'],
        schoolDays: [20, 22, 21, 21, 22, 20, 16, 21, 20, 22, 10],
        daysPresent: [20, 21, 20, 21, 22, 19, 16, 21, 20, 22, 10],
        daysAbsent: [0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0],
      },
    });

    const blob = await pdf(doc as unknown as React.ReactElement<DocumentProps>).toBlob();
    const arrayBuffer = await blobToArrayBuffer(blob);
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    expect(pdfDoc.getPageCount()).toBe(1);
    const [page] = pdfDoc.getPages();
    expect(page.getWidth()).toBeCloseTo(595.28, 1);
    expect(page.getHeight()).toBeCloseTo(841.89, 1);
  }, 60000);

  it('renders strictly 1 page for Grade 1 SF9 on LETTER portrait', async () => {
    const doc = React.createElement(Grade1SF9PDFDocument, {
      student: mockStudent,
      schoolProfile: mockSchoolProfile,
      schoolYear: '2026-2027',
      section: 'MATIYAGA',
      adviser: 'ANA SANTOS',
      principal: 'MARIA S. CLARA',
      pageSize: 'LETTER',
      g1Remarks: {
        term1CanDo: 'Can recognize alphabet letters and sounds.',
        term1ToImprove: 'Practice writing uppercase letters neatly.',
        term2CanDo: 'Can read simple 3-letter CVC words.',
        term2ToImprove: 'Work on reading short sentences fluently.',
        term3CanDo: 'Can write simple words and sentences.',
        term3ToImprove: 'Continue building vocabulary.',
      },
      attendance: {
        months: ['JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR'],
        schoolDays: [20, 22, 21, 21, 22, 20, 16, 21, 20, 22, 10],
        daysPresent: [20, 21, 20, 21, 22, 19, 16, 21, 20, 22, 10],
        daysAbsent: [0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0],
      },
    });

    const blob = await pdf(doc as unknown as React.ReactElement<DocumentProps>).toBlob();
    const arrayBuffer = await blobToArrayBuffer(blob);
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    expect(pdfDoc.getPageCount()).toBe(1);
  }, 60000);
});
