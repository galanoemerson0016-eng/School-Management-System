import { describe, it, expect } from 'vitest';
import { isMatchingSubject, isSameSubject } from '../utils/grading-helpers';
import type { ClassRecord } from '../types';

describe('E-Class Record Subject Persistence Workflow', () => {
  it('prevents raw score loss when navigating between GMRC, Values Education, and Makabansa', () => {
    const studentLrn = '109876543210';
    const schoolYear = '2026-2027';
    const quarter = 1;

    // In-memory store simulating useAppStore.getState().classRecords
    let storeClassRecords: ClassRecord[] = [];

    const saveScore = (
      subjectId: string,
      subjectName: string,
      type: 'ww' | 'pt' | 'qa',
      index: number,
      score: number
    ) => {
      // Logic matching EClassRecord.tsx updateGrade
      const existingRecord = storeClassRecords.find(r =>
        r.student_lrn === studentLrn &&
        (r.subject_id === subjectId || isSameSubject(r.subject_id, r.subject_name, subjectId, subjectName)) &&
        Number(r.quarter) === quarter &&
        (!schoolYear || !r.school_year || r.school_year === schoolYear || r.school_year.includes(schoolYear))
      );

      const isGMRC = subjectName.toLowerCase().includes('gmrc') || subjectName.toLowerCase().includes('values');
      const activeWwCount = isGMRC ? 10 : 5;
      const activePtCount = isGMRC ? 9 : 3;

      const record: ClassRecord = existingRecord ? {
        ...existingRecord,
        subject_id: subjectId,
        subject_name: subjectName || existingRecord.subject_name
      } : {
        id: `grade_${studentLrn}_${subjectId}_Q${quarter}`,
        student_lrn: studentLrn,
        section_id: 'sec-1',
        subject_id: subjectId,
        subject_name: subjectName,
        school_year: schoolYear,
        quarter: quarter as 1 | 2 | 3 | 4,
        written_works: Array(activeWwCount).fill(''),
        performance_tasks: Array(activePtCount).fill(''),
        quarterly_exam: '',
        final_grade: 90
      };

      if (type === 'ww') {
        const newWW = [...record.written_works];
        newWW[index] = score;
        record.written_works = newWW;
      } else if (type === 'pt') {
        const newPT = [...record.performance_tasks];
        newPT[index] = score;
        record.performance_tasks = newPT;
      }

      if (existingRecord && existingRecord.id !== record.id) {
        storeClassRecords = storeClassRecords.filter(r => r.id !== existingRecord.id);
      }

      const recIdx = storeClassRecords.findIndex(r => r.id === record.id);
      if (recIdx >= 0) {
        storeClassRecords[recIdx] = record;
      } else {
        storeClassRecords.push(record);
      }
    };

    // Step 1: Teacher inputs raw scores in GMRC
    saveScore('sub-gmrc', 'GMRC', 'ww', 0, 10);
    saveScore('sub-gmrc', 'GMRC', 'ww', 9, 9);
    saveScore('sub-gmrc', 'GMRC', 'pt', 0, 20);
    saveScore('sub-gmrc', 'GMRC', 'pt', 8, 30);

    expect(storeClassRecords).toHaveLength(1);
    expect(storeClassRecords[0].subject_id).toBe('sub-gmrc');
    expect(storeClassRecords[0].written_works[0]).toBe(10);
    expect(storeClassRecords[0].written_works[9]).toBe(9);

    // Step 2: Teacher changes to Makabansa page and inputs raw scores
    saveScore('sub-makabansa', 'Makabansa', 'ww', 0, 25);
    saveScore('sub-makabansa', 'Makabansa', 'ww', 4, 24);
    saveScore('sub-makabansa', 'Makabansa', 'pt', 0, 50);

    // Both records must exist independently!
    expect(storeClassRecords).toHaveLength(2);

    // Step 3: Teacher changes to Values Education page and inputs raw scores
    saveScore('sub-values', 'Values Education', 'ww', 0, 8);
    saveScore('sub-values', 'Values Education', 'ww', 9, 7);
    saveScore('sub-values', 'Values Education', 'pt', 0, 18);

    expect(storeClassRecords).toHaveLength(3);

    // Step 4: Teacher returns to GMRC page — verify GMRC raw scores are completely intact!
    const retrievedGMRC = storeClassRecords.find(r =>
      r.student_lrn === studentLrn &&
      (r.subject_id === 'sub-gmrc' || isSameSubject(r.subject_id, r.subject_name, 'sub-gmrc', 'GMRC')) &&
      Number(r.quarter) === quarter
    );
    expect(retrievedGMRC).toBeDefined();
    expect(retrievedGMRC?.subject_id).toBe('sub-gmrc');
    expect(retrievedGMRC?.written_works[0]).toBe(10);
    expect(retrievedGMRC?.written_works[9]).toBe(9);
    expect(retrievedGMRC?.performance_tasks[0]).toBe(20);
    expect(retrievedGMRC?.performance_tasks[8]).toBe(30);

    // Step 5: Teacher returns to Makabansa page — verify Makabansa raw scores are completely intact!
    const retrievedMakabansa = storeClassRecords.find(r =>
      r.student_lrn === studentLrn &&
      (r.subject_id === 'sub-makabansa' || isSameSubject(r.subject_id, r.subject_name, 'sub-makabansa', 'Makabansa')) &&
      Number(r.quarter) === quarter
    );
    expect(retrievedMakabansa).toBeDefined();
    expect(retrievedMakabansa?.subject_id).toBe('sub-makabansa');
    expect(retrievedMakabansa?.written_works[0]).toBe(25);
    expect(retrievedMakabansa?.written_works[4]).toBe(24);
    expect(retrievedMakabansa?.performance_tasks[0]).toBe(50);

    // Step 6: Teacher returns to Values Education page — verify Values Education raw scores are completely intact!
    const retrievedValues = storeClassRecords.find(r =>
      r.student_lrn === studentLrn &&
      (r.subject_id === 'sub-values' || isSameSubject(r.subject_id, r.subject_name, 'sub-values', 'Values Education')) &&
      Number(r.quarter) === quarter
    );
    expect(retrievedValues).toBeDefined();
    expect(retrievedValues?.subject_id).toBe('sub-values');
    expect(retrievedValues?.written_works[0]).toBe(8);
    expect(retrievedValues?.written_works[9]).toBe(7);
  });

  it('prevents raw score loss when navigating between Grade 1 Language and Reading & Literacy', () => {
    expect(isMatchingSubject('Language', undefined, 'Reading and Literacy')).toBe(false);
    expect(isMatchingSubject('Reading and Literacy', undefined, 'Language')).toBe(false);
    expect(isSameSubject('sub-lang', 'Language', 'sub-read', 'Reading and Literacy')).toBe(false);
  });

  it('prevents raw score loss when navigating between EPP and TLE', () => {
    expect(isMatchingSubject('EPP', undefined, 'TLE')).toBe(false);
    expect(isMatchingSubject('TLE', undefined, 'EPP')).toBe(false);
    expect(isSameSubject('sub-epp', 'EPP', 'sub-tle', 'TLE')).toBe(false);
  });
});
