import { describe, expect, it } from 'vitest';
import {
  calculateCompositeTermGrade,
  calculateQuarterlyFinalGrade,
  calculateWeightedGradeAverage,
  countMissingGradeValues,
  countMissingOfferedGradeValues,
  calculateSf9FinalGrade,
  calculateSf9GeneralAverage,
  areSf9TermsComplete,
} from './grade-calculation';

describe('composite learning-area term grade', () => {
  it('averages component groups equally and marks a full term complete', () => {
    expect(calculateCompositeTermGrade([[90, 80], [70]])).toEqual({
      value: 78,
      componentAverages: [85, 70],
      complete: true,
    });
  });

  it('retains the existing partial numeric grade while marking the term incomplete', () => {
    expect(calculateCompositeTermGrade([[88], []])).toEqual({
      value: 88,
      componentAverages: [88, null],
      complete: false,
    });
  });

  it('returns no grade when all component groups are missing', () => {
    expect(calculateCompositeTermGrade([[], []])).toEqual({
      value: null,
      componentAverages: [null, null],
      complete: false,
    });
  });
});

describe('Grade Management quarterly final', () => {
  it('preserves the existing mean while marking incomplete terms provisional', () => {
    expect(calculateQuarterlyFinalGrade([80, 90, null])).toEqual({
      value: 85, status: 'provisional', gradedTerms: 2, requiredTerms: 3,
    });
  });

  it('marks a complete final and leaves a fully missing subject empty', () => {
    expect(calculateQuarterlyFinalGrade([80, 90, 100])).toEqual({
      value: 90, status: 'complete', gradedTerms: 3, requiredTerms: 3,
    });
    expect(calculateQuarterlyFinalGrade([null, 0, undefined])).toEqual({
      value: 0, status: 'missing', gradedTerms: 0, requiredTerms: 3,
    });
  });

  it('supports both three-term and four-quarter historical SF10 records', () => {
    expect(calculateQuarterlyFinalGrade([90, 0, 80, 70], [1, 2, 3])).toMatchObject({
      value: 85, status: 'provisional', gradedTerms: 2, requiredTerms: 3,
    });
    expect(calculateQuarterlyFinalGrade([90, 80, 70, 100], [1, 2, 3, 4])).toMatchObject({
      value: 85, status: 'complete', gradedTerms: 4, requiredTerms: 4,
    });
  });

  it('marks a scheduled single-term elective complete without requiring unoffered terms', () => {
    expect(calculateQuarterlyFinalGrade([92, null, null], [1, 2, 3], [1])).toEqual({
      value: 92, status: 'complete', gradedTerms: 1, requiredTerms: 1,
    });
    expect(calculateQuarterlyFinalGrade([92, null, null], [1, 2, 3], [1, 2, 3]).status).toBe('provisional');
    expect(calculateQuarterlyFinalGrade([92, 65, 75], [1], [1])).toEqual({
      value: 92, status: 'complete', gradedTerms: 1, requiredTerms: 1,
    });
  });
});

describe('Grade Management average weighting', () => {
  it('uses the same unit-weighted average for SHS and equal-weight average otherwise', () => {
    expect(calculateWeightedGradeAverage([{ grade: 80, weight: 2 }, { grade: 90, weight: 1 }])).toBeCloseTo(83.3333);
    expect(calculateWeightedGradeAverage([{ grade: 80, weight: 1 }, { grade: 90, weight: 1 }])).toBe(85);
  });

  it('returns no average when there are no valid weighted entries', () => {
    expect(calculateWeightedGradeAverage([])).toBeNull();
    expect(calculateWeightedGradeAverage([{ grade: 80, weight: 0 }])).toBeNull();
  });
});

describe('offered-term completeness', () => {
  it('counts only missing values in offered terms and treats zero as an encoded value', () => {
    expect(countMissingOfferedGradeValues([
      { term: 1, values: [undefined] },
      { term: 2, values: [0] },
      { term: 3, values: [null] },
    ], [2])).toBe(0);
  });

  it('counts absent MAPEH or EC/MK component-group values across offered terms', () => {
    expect(countMissingGradeValues([88, null])).toBe(1);
    expect(countMissingOfferedGradeValues([
      { term: 1, values: [90, null] },
      { term: 2, values: [0, 85] },
      { term: 3, values: [undefined, undefined] },
    ], [1, 2])).toBe(1);
  });
});
import type { SF9SubjectItem } from './grade-calculation';
import type { Subject } from '../types';

describe('SF9 grade calculations', () => {
  it('calculates a final only when the required three terms are present', () => {
    expect(calculateSf9FinalGrade([90, 80, 70])).toBe(80);
    expect(calculateSf9FinalGrade([90, 0, 70])).toBe(0);
    expect(calculateSf9FinalGrade([90, 80, 70], 2)).toBe(80);
    expect(calculateSf9FinalGrade([90, 0, 80], undefined, 'Academic Elective 1')).toBe(85);
    expect(calculateSf9FinalGrade([90, 80, 0], undefined, 'Academic Elective 3')).toBe(0);
    expect(calculateSf9FinalGrade([90, 80, 70], 'none')).toBe(0);
  });

  it('uses only included learning areas and honors explicit subject policy', () => {
    const subjects: SF9SubjectItem[] = [
      { id: 'english', name: 'English' },
      { id: 'math', name: 'Mathematics' },
      { id: 'arabic', name: '*Arabic Language' },
      { name: 'Core Subjects', isHeader: true },
    ];
    const databaseSubjects = [
      { id: 'english', subject_name: 'English', term: 'all' },
      { id: 'math', subject_name: 'Mathematics', term: 'all' },
      { id: 'arabic', subject_name: '*Arabic Language', term: 'all' },
    ] as Subject[];
    const grades = {
      English: [90, 90, 90],
      Mathematics: [80, 80, 80],
      '*Arabic Language': [100, 100, 100],
      'Core Subjects': [100, 100, 100],
    };
    expect(calculateSf9GeneralAverage(grades, subjects, 'Grade 7', databaseSubjects)).toBe(85);
    expect(areSf9TermsComplete(grades, subjects, 'Grade 7', databaseSubjects)).toBe(true);
    expect(areSf9TermsComplete({ ...grades, Mathematics: [80, 0, 80] }, subjects, 'Grade 7', databaseSubjects)).toBe(false);
  });

  it('weights SHS general average by offered-term units', () => {
    const subjects: SF9SubjectItem[] = [
      { id: 'core', name: 'English', term: 'all', units: 3 },
      { id: 'elective', name: 'Creative Elective', term: 1, units: 2 },
    ];
    const databaseSubjects = [
      { id: 'core', subject_name: 'English', term: 'all', units: 3 },
      { id: 'elective', subject_name: 'Creative Elective', term: 1, units: 2 },
    ] as Subject[];
    expect(calculateSf9GeneralAverage({ English: [90, 90, 90], 'Creative Elective': [100, 0, 0] }, subjects, 'Grade 11', databaseSubjects)).toBe(92);
  });
});
