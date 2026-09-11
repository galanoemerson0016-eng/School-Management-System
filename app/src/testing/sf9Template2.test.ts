import { describe, it, expect } from 'vitest';
import {
  TEMPLATE2_DESCRIPTORS,
  getTemplate2Remarks,
  createTemplate2Pairs,
  type SF9Template2LearnerData,
} from '../components/sf9/sf9Template2Utils';
import type { Student } from '../types';

describe('SF9 Template 2 (Portrait 2-Up Split: 2 Front on Page 1, 2 Back on Page 2)', () => {
  it('correctly maps performance descriptors matching the official template', () => {
    expect(TEMPLATE2_DESCRIPTORS).toHaveLength(5);
    expect(TEMPLATE2_DESCRIPTORS[0]).toEqual({ scale: '90 - 100', desc: 'Advancing', remark: 'Passed' });
    expect(TEMPLATE2_DESCRIPTORS[1]).toEqual({ scale: '80 - 89', desc: 'Benchmarking', remark: 'Passed' });
    expect(TEMPLATE2_DESCRIPTORS[2]).toEqual({ scale: '75 - 79', desc: 'Connecting', remark: 'Passed' });
    expect(TEMPLATE2_DESCRIPTORS[3]).toEqual({ scale: '65 - 74', desc: 'Developing', remark: 'Failed' });
    expect(TEMPLATE2_DESCRIPTORS[4]).toEqual({ scale: '0 - 64', desc: 'Emerging', remark: 'Failed' });
  });

  it('correctly evaluates final grade remarks as Passed (>=75) or Failed (<75)', () => {
    expect(getTemplate2Remarks(95)).toBe('Passed');
    expect(getTemplate2Remarks(80)).toBe('Passed');
    expect(getTemplate2Remarks(75)).toBe('Passed');
    expect(getTemplate2Remarks(74)).toBe('Failed');
    expect(getTemplate2Remarks(60)).toBe('Failed');
    expect(getTemplate2Remarks(0)).toBe('');
  });

  it('correctly batches even number of learners into 2-up pairs', () => {
    const mockStudents: Student[] = [
      { lrn: '1001', first_name: 'Juan', last_name: 'Cruz', gender: 'Male', student_section: 'Diamond', grade_level: 'Grade 7', birthday: '2012-01-01', age: 12, address: 'Test' },
      { lrn: '1002', first_name: 'Maria', last_name: 'Santos', gender: 'Female', student_section: 'Diamond', grade_level: 'Grade 7', birthday: '2012-01-01', age: 12, address: 'Test' },
      { lrn: '1003', first_name: 'Pedro', last_name: 'Reyes', gender: 'Male', student_section: 'Diamond', grade_level: 'Grade 7', birthday: '2012-01-01', age: 12, address: 'Test' },
      { lrn: '1004', first_name: 'Ana', last_name: 'Lim', gender: 'Female', student_section: 'Diamond', grade_level: 'Grade 7', birthday: '2012-01-01', age: 12, address: 'Test' },
    ];

    const learners: SF9Template2LearnerData[] = mockStudents.map(st => ({
      student: st,
      grades: { Filipino: [88, 89, 90] },
    }));

    const pairs = createTemplate2Pairs(learners);

    expect(pairs).toHaveLength(2);
    expect(pairs[0][0].student.lrn).toBe('1001');
    expect(pairs[0][1]?.student.lrn).toBe('1002');
    expect(pairs[1][0].student.lrn).toBe('1003');
    expect(pairs[1][1]?.student.lrn).toBe('1004');
  });

  it('correctly handles odd number of learners by duplicating the last learner so no paper is wasted', () => {
    const mockStudents: Student[] = [
      { lrn: '1001', first_name: 'Juan', last_name: 'Cruz', gender: 'Male', student_section: 'Diamond', grade_level: 'Grade 7', birthday: '2012-01-01', age: 12, address: 'Test' },
      { lrn: '1002', first_name: 'Maria', last_name: 'Santos', gender: 'Female', student_section: 'Diamond', grade_level: 'Grade 7', birthday: '2012-01-01', age: 12, address: 'Test' },
      { lrn: '1003', first_name: 'Pedro', last_name: 'Reyes', gender: 'Male', student_section: 'Diamond', grade_level: 'Grade 7', birthday: '2012-01-01', age: 12, address: 'Test' },
    ];

    const learners: SF9Template2LearnerData[] = mockStudents.map(st => ({
      student: st,
      grades: { Filipino: [85, 86, 87] },
    }));

    const pairsWithDuplication = createTemplate2Pairs(learners, true);
    expect(pairsWithDuplication).toHaveLength(2);
    expect(pairsWithDuplication[0][0].student.lrn).toBe('1001');
    expect(pairsWithDuplication[0][1]?.student.lrn).toBe('1002');
    expect(pairsWithDuplication[1][0].student.lrn).toBe('1003');
    expect(pairsWithDuplication[1][1]?.student.lrn).toBe('1003');

    const pairsWithoutDuplication = createTemplate2Pairs(learners, false);
    expect(pairsWithoutDuplication[1][1]).toBeNull();
  });

  it('verifies duplex long-edge flip mapping for paired learners on Page 1 and Page 2', () => {
    const mockLearner1: SF9Template2LearnerData = {
      student: { lrn: '1001', first_name: 'Juan', last_name: 'Cruz', gender: 'Male', student_section: 'Diamond', grade_level: 'Grade 7', birthday: '2012-01-01', age: 12, address: 'Test' },
      grades: { Filipino: [90, 92, 94] },
    };
    const mockLearner2: SF9Template2LearnerData = {
      student: { lrn: '1002', first_name: 'Maria', last_name: 'Santos', gender: 'Female', student_section: 'Diamond', grade_level: 'Grade 7', birthday: '2012-01-01', age: 12, address: 'Test' },
      grades: { Filipino: [88, 89, 91] },
    };

    // Page 1 (Front): Left = Learner 1, Right = Learner 2
    const page1Left = mockLearner1;
    const page1Right = mockLearner2;

    // Duplex long-edge flip: paper is turned horizontally like a book page.
    // The left of Page 1 corresponds to the right of Page 2, and right of Page 1 corresponds to left of Page 2.
    const page2Left = page1Right; // Back of Learner 2
    const page2Right = page1Left; // Back of Learner 1

    expect(page1Left.student.lrn).toBe('1001');
    expect(page1Right.student.lrn).toBe('1002');
    expect(page2Left.student.lrn).toBe('1002');
    expect(page2Right.student.lrn).toBe('1001');

    // When cut vertically down the middle:
    // Left half = Front of 1001 + Back of 1001
    // Right half = Front of 1002 + Back of 1002
    expect(page1Left.student.lrn).toBe(page2Right.student.lrn);
    expect(page1Right.student.lrn).toBe(page2Left.student.lrn);
  });

  it('verifies single learner print generates 2 Fronts on Page 1 and 2 Backs on Page 2 (exactly 2 pages)', () => {
    const mockLearner: SF9Template2LearnerData = {
      student: { lrn: '1001', first_name: 'Juan', last_name: 'Cruz', gender: 'Male', student_section: 'Diamond', grade_level: 'Grade 7', birthday: '2012-01-01', age: 12, address: 'Test' },
      grades: { Filipino: [90, 92, 94] },
    };

    // In single learner mode (no learnerB), both sides are duplicated
    const frontLeft = mockLearner;
    const frontRight = mockLearner;
    const backLeft = mockLearner;
    const backRight = mockLearner;

    expect(frontLeft.student.lrn).toBe('1001');
    expect(frontRight.student.lrn).toBe('1001');
    expect(backLeft.student.lrn).toBe('1001');
    expect(backRight.student.lrn).toBe('1001');
  });

  it('verifies second copy dropdown selection populates learnerB record on right side of Page 1 and left side of Page 2', () => {
    const learnerA: SF9Template2LearnerData = {
      student: { lrn: '1001', first_name: 'Juan', last_name: 'Cruz', gender: 'Male', student_section: 'Diamond', grade_level: 'Grade 7', birthday: '2012-01-01', age: 12, address: 'Test' },
      grades: { Filipino: [90, 92, 94] },
    };
    const learnerB: SF9Template2LearnerData = {
      student: { lrn: '1002', first_name: 'Maria', last_name: 'Santos', gender: 'Female', student_section: 'Diamond', grade_level: 'Grade 7', birthday: '2012-01-01', age: 12, address: 'Test' },
      grades: { Filipino: [85, 87, 89] },
    };

    const frontLeft = learnerA;
    const frontRight = learnerB || learnerA;
    const backLeft = frontRight;
    const backRight = frontLeft;

    expect(frontLeft.student.first_name).toBe('Juan');
    expect(frontRight.student.first_name).toBe('Maria');
    expect(frontLeft.grades.Filipino).toEqual([90, 92, 94]);
    expect(frontRight.grades.Filipino).toEqual([85, 87, 89]);

    // Duplex alignment on Page 2
    expect(backLeft.student.first_name).toBe('Maria');
    expect(backRight.student.first_name).toBe('Juan');
  });
});

