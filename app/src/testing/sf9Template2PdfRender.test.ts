import { describe, it, expect } from 'vitest';
import React from 'react';
import { pdf, type DocumentProps } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';
import { SF9Template2Document, SF9Template2BatchDocument } from '../components/sf9/SF9Template2Document';
import type { SF9Template2LearnerData } from '../components/sf9/sf9Template2Utils';
import type { SchoolProfile } from '../types';

const mockSchool = {
  name: 'NEW CORELLA NATIONAL HIGH SCHOOL',
  region: 'Region XI',
  division: 'DAVAO DEL NORTE',
  district: 'NEW CORELLA',
  province: 'DAVAO DEL NORTE',
  head_name: 'PEDRO P. SANTOS',
  head_position: 'Secondary School Principal IV',
};

const mockLearner1: SF9Template2LearnerData = {
  student: {
    lrn: '100123456789',
    first_name: 'Juan',
    last_name: 'Dela Cruz',
    gender: 'Male',
    student_section: 'Diamond',
    grade_level: 'Grade 7',
    birthday: '2012-05-15',
    age: 12,
    address: 'New Corella, Davao del Norte',
  },
  grades: {
    'FILIPINO': [88, 89, 90],
    'ENGLISH': [87, 88, 89],
    'MATHEMATICS': [85, 86, 88],
    'SCIENCE': [86, 87, 89],
    'ARALING PANLIPUNAN (AP)': [89, 90, 91],
    'EDUKASYON SA PAGPAPAKATAO (EsP)': [90, 91, 92],
    'TECHNOLOGY AND LIVELIHOOD EDUCATION (TLE)': [88, 89, 90],
    'MAPEH': [88, 89, 90],
    'MUSIC': [87, 88, 89],
    'ARTS': [88, 89, 90],
    'PE': [89, 90, 91],
    'HEALTH': [88, 89, 90],
  },
  comments: ['Shows commendable effort in all areas.', 'Maintains active participation.', 'Consistent academic achievement.'],
  attendance: {
    months: ['JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR'],
    schoolDays: [21, 22, 21, 22, 21, 20, 16, 21, 20, 22, 10],
    daysPresent: [21, 22, 21, 22, 21, 20, 16, 21, 20, 22, 10],
    daysAbsent: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
};

const mockLearner2: SF9Template2LearnerData = {
  ...mockLearner1,
  student: {
    ...mockLearner1.student,
    lrn: '100123456790',
    first_name: 'Maria',
    last_name: 'Santos',
    gender: 'Female',
  },
};

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

describe('SF9 Template 2 PDF Page Count Verification', () => {
  it('renders strictly 2 pages for a single learner on A4 portrait', async () => {
    const doc = React.createElement(SF9Template2Document, {
      learnerA: mockLearner1,
      schoolProfile: mockSchool as unknown as SchoolProfile,
      schoolYear: '2026 - 2027',
      section: 'Diamond',
      gradeLevel: 'Grade 7',
      adviser: 'Maria Teresa Cruz',
      principal: 'Pedro P. Santos',
      pageSize: 'A4',
    });
    const blob = await pdf(doc as unknown as React.ReactElement<DocumentProps>).toBlob();
    const arrayBuffer = await blobToArrayBuffer(blob);
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    expect(pdfDoc.getPageCount()).toBe(2);
    const [frontPage] = pdfDoc.getPages();
    expect(frontPage.getWidth()).toBeCloseTo(595.28, 1);
    expect(frontPage.getHeight()).toBeCloseTo(841.89, 1);
  }, 60000);

  it('renders strictly 2 pages for a single learner on Letter portrait', async () => {
    const doc = React.createElement(SF9Template2Document, {
      learnerA: mockLearner1,
      schoolProfile: mockSchool as unknown as SchoolProfile,
      schoolYear: '2026 - 2027',
      section: 'Diamond',
      gradeLevel: 'Grade 7',
      adviser: 'Maria Teresa Cruz',
      principal: 'Pedro P. Santos',
      pageSize: 'LETTER',
    });
    const blob = await pdf(doc as unknown as React.ReactElement<DocumentProps>).toBlob();
    const arrayBuffer = await blobToArrayBuffer(blob);
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    expect(pdfDoc.getPageCount()).toBe(2);
  }, 60000);

  it('renders strictly 2 pages for a 2-learner batch on A4 portrait', async () => {
    const doc = React.createElement(SF9Template2BatchDocument, {
      learners: [mockLearner1, mockLearner2],
      schoolProfile: mockSchool as unknown as SchoolProfile,
      schoolYear: '2026 - 2027',
      section: 'Diamond',
      gradeLevel: 'Grade 7',
      adviser: 'Maria Teresa Cruz',
      principal: 'Pedro P. Santos',
      pageSize: 'A4',
    });
    const blob = await pdf(doc as unknown as React.ReactElement<DocumentProps>).toBlob();
    const arrayBuffer = await blobToArrayBuffer(blob);
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    expect(pdfDoc.getPageCount()).toBe(2);
  }, 60000);
});
