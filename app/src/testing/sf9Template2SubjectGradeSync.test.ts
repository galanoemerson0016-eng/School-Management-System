import { describe, it, expect } from 'vitest';
import React from 'react';
import { pdf, type DocumentProps } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';
import { SF9Template2Document } from '../components/sf9/SF9Template2Document';
import type { SF9Template2LearnerData } from '../components/sf9/sf9Template2Utils';
import type { SchoolProfile } from '../types';

const mockSchool = {
  name: 'MATATAG NATIONAL HIGH SCHOOL',
  region: 'Region III',
  division: 'TARLAC PROVINCE',
  district: 'CENTRAL DISTRICT',
  province: 'TARLAC',
  head_name: 'DR. MARIA SANTOS',
  head_position: 'School Principal IV',
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

describe('SF9 Template 2 Subject and Grade Synchronization', () => {
  it('synchronizes Grade 1 MATATAG subjects and grades in Template 2', async () => {
    const grade1Learner: SF9Template2LearnerData = {
      student: {
        lrn: '123456789012',
        first_name: 'Ana',
        last_name: 'Batumbakal',
        gender: 'Female',
        student_section: 'Mabini',
        grade_level: 'Grade 1',
        birthday: '2019-03-10',
        age: 6,
        address: 'Tarlac City',
      },
      grades: {
        'Language': [88, 90, 92],
        'Reading and Literacy': [87, 89, 91],
        'Mathematics': [90, 92, 94],
        'Makabansa': [89, 91, 93],
        'Good Moral and Right Conduct (GMRC)': [92, 94, 95],
      },
      subjects: [
        { name: 'Language' },
        { name: 'Reading and Literacy' },
        { name: 'Mathematics' },
        { name: 'Makabansa' },
        { name: 'Good Moral and Right Conduct (GMRC)' },
      ],
      attendance: {
        months: ['JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR'],
        schoolDays: [20, 21, 20, 22, 20, 18, 15, 20, 19, 21, 10],
        daysPresent: [20, 21, 20, 22, 20, 18, 15, 20, 19, 21, 10],
        daysAbsent: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    };

    const doc = React.createElement(SF9Template2Document, {
      learnerA: grade1Learner,
      learnerB: null,
      schoolProfile: mockSchool as unknown as SchoolProfile,
      schoolYear: '2026-2027',
      section: 'Mabini',
      gradeLevel: 'Grade 1',
      adviser: 'CLARA M. SANTOS',
      pageSize: 'A4',
    });

    const blob = await pdf(doc as unknown as React.ReactElement<DocumentProps>).toBlob();
    const arrayBuffer = await blobToArrayBuffer(blob);
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    expect(pdfDoc.getPageCount()).toBe(2);
  });

  it('synchronizes Senior High School Grade 11 subjects and grades in Template 2', async () => {
    const shsLearner: SF9Template2LearnerData = {
      student: {
        lrn: '112233445566',
        first_name: 'Gabriel',
        last_name: 'Alviento',
        gender: 'Male',
        student_section: 'Plato',
        grade_level: 'Grade 11',
        birthday: '2009-08-20',
        age: 17,
        address: 'Tarlac Province',
      },
      grades: {
        'Effective Communication / Mabisang Komunikasyon': [90, 0, 0],
        'General Mathematics': [95, 0, 0],
        'General Science': [92, 0, 0],
        'Life and Career Skills': [91, 0, 0],
        'Pag-aaral ng Kasaysayan at Lipunang Pilipino': [94, 0, 0],
      },
      subjects: [
        { name: 'Core Subjects', isHeader: true },
        { name: 'Effective Communication / Mabisang Komunikasyon' },
        { name: 'General Mathematics' },
        { name: 'General Science' },
        { name: 'Life and Career Skills' },
        { name: 'Pag-aaral ng Kasaysayan at Lipunang Pilipino' },
      ],
      attendance: {
        months: ['JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR'],
        schoolDays: [20, 21, 20, 22, 20, 18, 15, 20, 19, 21, 10],
        daysPresent: [20, 21, 20, 22, 20, 18, 15, 20, 19, 21, 10],
        daysAbsent: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    };

    const doc = React.createElement(SF9Template2Document, {
      learnerA: shsLearner,
      learnerB: null,
      schoolProfile: mockSchool as unknown as SchoolProfile,
      schoolYear: '2026-2027',
      section: 'Plato',
      gradeLevel: 'Grade 11',
      adviser: 'EMERSON GALANO',
      pageSize: 'A4',
    });

    const blob = await pdf(doc as unknown as React.ReactElement<DocumentProps>).toBlob();
    const arrayBuffer = await blobToArrayBuffer(blob);
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    expect(pdfDoc.getPageCount()).toBe(2);
  });
});
