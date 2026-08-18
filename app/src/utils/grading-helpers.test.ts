import { describe, it, expect, vi } from 'vitest';

// Mock app store to prevent importing browser-only APIs in Node.js
vi.mock('../stores', () => ({
  useAppStore: {
    getState: () => ({ activeSchoolYear: '2026-2027' }),
  },
}));

import {
  computeStudentAverage,
  isAcademicExcellenceAwardee,
  getHonorType,
  generateHonorRoll,
  getAtRiskStudents,
  getMPSPerSubject,
  getSubjectAwardees,
  getStudentAbsences,
} from './grading-helpers';
import type { ClassRecord, Student, Subject, Section, AttendanceRecord, SF2Sheet } from '../types';

describe('Grading Helpers', () => {
  // Mock data helpers
  const student1: Student = {
    lrn: '123456789012',
    first_name: 'John',
    last_name: 'Doe',
    gender: 'Male',
    grade_level: 'Grade 4',
    student_section: 'Einstein',
  } as unknown as Student;

  const student2: Student = {
    lrn: '987654321098',
    first_name: 'Alice',
    last_name: 'Adams',
    gender: 'Female',
    grade_level: 'Grade 4',
    student_section: 'Einstein',
  } as unknown as Student;

  const subject1: Subject = {
    id: 'sub-math',
    subject_name: 'Mathematics',
    grade_level: 'Grade 4',
    section_id: 'sec-einstein',
  } as unknown as Subject;

  const subject2: Subject = {
    id: 'sub-science',
    subject_name: 'Science',
    grade_level: 'Grade 4',
    section_id: 'sec-einstein',
  } as unknown as Subject;

  const section1: Section = {
    id: 'sec-einstein',
    section_name: 'Einstein',
    section_grade_level: 'Grade 4',
    adviser_name: 'Mrs. Davis',
  } as unknown as Section;

  describe('computeStudentAverage and computeYearlyAverage', () => {
    it('should calculate student average for a specific term correctly', () => {
      const classRecords: ClassRecord[] = [
        { id: '1', student_lrn: '123456789012', subject_id: 'sub-math', quarter: 1, final_grade: 90 },
        { id: '2', student_lrn: '123456789012', subject_id: 'sub-science', quarter: 1, final_grade: 85 },
      ] as unknown as ClassRecord[];

      const avg = computeStudentAverage('123456789012', 1, classRecords);
      expect(avg).toBe(87.5);
    });

    it('should compute overall yearly average correctly from terms', () => {
      const classRecords: ClassRecord[] = [
        { id: '1', student_lrn: '123456789012', subject_id: 'sub-math', quarter: 1, final_grade: 90 },
        { id: '2', student_lrn: '123456789012', subject_id: 'sub-science', quarter: 1, final_grade: 85 },
        { id: '3', student_lrn: '123456789012', subject_id: 'sub-math', quarter: 2, final_grade: 92 },
        { id: '4', student_lrn: '123456789012', subject_id: 'sub-science', quarter: 2, final_grade: 88 },
        { id: '5', student_lrn: '123456789012', subject_id: 'sub-math', quarter: 3, final_grade: 95 },
        { id: '6', student_lrn: '123456789012', subject_id: 'sub-science', quarter: 3, final_grade: 90 },
      ] as unknown as ClassRecord[];

      // Term 1 avg = 87.5
      // Term 2 avg = 90
      // Term 3 avg = 92.5
      // Yearly average = (87.5 + 90 + 92.5) / 3 = 90
      const avg = computeStudentAverage('123456789012', 'overall', classRecords);
      expect(avg).toBe(90);
    });
  });

  describe('isAcademicExcellenceAwardee and getHonorType', () => {
    it('identifies awardee correctly per DepEd Order (GA >= 90 and no subject FG < 80)', () => {
      expect(isAcademicExcellenceAwardee(90, [90, 85, 80])).toBe(true);
      expect(isAcademicExcellenceAwardee(89.5, [90, 85, 80])).toBe(false); // GA below 90
      expect(isAcademicExcellenceAwardee(92, [90, 79, 85])).toBe(false);  // has FG below 80
    });

    it('returns the Academic Excellence Award type when GA >= 90', () => {
      expect(getHonorType(90)).toBe('Academic Excellence Award');
      expect(getHonorType(89)).toBeNull();
    });
  });

  describe('generateHonorRoll', () => {
    it('generates alphabetically-sorted list of students qualifying for academic excellence', () => {
      const students = [student1, student2];
      const classRecords: ClassRecord[] = [
        // John Doe: Math = 90, Science = 92 -> GA = 91 (qualifies)
        { id: 'r1', student_lrn: '123456789012', subject_id: 'sub-math', quarter: 1, final_grade: 90 },
        { id: 'r2', student_lrn: '123456789012', subject_id: 'sub-science', quarter: 1, final_grade: 92 },
        // Alice Smith: Math = 95, Science = 93 -> GA = 94 (qualifies)
        { id: 'r3', student_lrn: '987654321098', subject_id: 'sub-math', quarter: 1, final_grade: 95 },
        { id: 'r4', student_lrn: '987654321098', subject_id: 'sub-science', quarter: 1, final_grade: 93 },
      ] as unknown as ClassRecord[];

      const honorRoll = generateHonorRoll(students, classRecords, [subject1, subject2], [section1], 1, '2026-2027');
      
      expect(honorRoll.length).toBe(2);
      // Alice Smith should come first alphabetically despite John Doe being first in the array
      expect(honorRoll[0].student.first_name).toBe('Alice');
      expect(honorRoll[1].student.first_name).toBe('John');
    });

    it('excludes students with subject grades below 80', () => {
      const students = [student1];
      const classRecords: ClassRecord[] = [
        // John Doe: Math = 98, Science = 79 -> GA = 88.5 (fails both GA and subject threshold)
        { id: 'r1', student_lrn: '123456789012', subject_id: 'sub-math', quarter: 1, final_grade: 98 },
        { id: 'r2', student_lrn: '123456789012', subject_id: 'sub-science', quarter: 1, final_grade: 79 },
      ] as unknown as ClassRecord[];

      const honorRoll = generateHonorRoll(students, classRecords, [subject1, subject2], [section1], 1, '2026-2027');
      expect(honorRoll.length).toBe(0);
    });
  });

  describe('getAtRiskStudents', () => {
    it('returns students with grades below 75', () => {
      const students = [student1, student2];
      const classRecords: ClassRecord[] = [
        { id: 'r1', student_lrn: '123456789012', subject_id: 'sub-math', quarter: 1, final_grade: 72 }, // at risk
        { id: 'r2', student_lrn: '987654321098', subject_id: 'sub-math', quarter: 1, final_grade: 78 },
      ] as unknown as ClassRecord[];

      const atRisk = getAtRiskStudents(students, classRecords, [subject1], 1);
      expect(atRisk.length).toBe(1);
      expect(atRisk[0].student.first_name).toBe('John');
      expect(atRisk[0].grade).toBe(72);
    });
  });

  describe('getMPSPerSubject', () => {
    it('calculates mean percentage score and passing rates', () => {
      const classRecords: ClassRecord[] = [
        { id: 'r1', student_lrn: '123456789012', subject_id: 'sub-math', quarter: 1, final_grade: 80 },
        { id: 'r2', student_lrn: '987654321098', subject_id: 'sub-math', quarter: 1, final_grade: 70 }, // fails (below 75)
      ] as unknown as ClassRecord[];

      const mpsResult = getMPSPerSubject(classRecords, [subject1], 1);
      expect(mpsResult.length).toBe(1);
      expect(mpsResult[0].subjectName).toBe('Mathematics');
      expect(mpsResult[0].mps).toBe(75);       // (80+70)/2 = 75
      expect(mpsResult[0].passRate).toBe(50);   // 1 out of 2 passing (>= 75)
      expect(mpsResult[0].totalStudents).toBe(2);
    });
  });

  describe('getSubjectAwardees', () => {
    it('gives specific learning area award to highest grade in section (>= 90)', () => {
      const students = [student1, student2];
      const classRecords: ClassRecord[] = [
        { id: 'r1', student_lrn: '123456789012', subject_id: 'sub-math', quarter: 1, final_grade: 92 },
        { id: 'r2', student_lrn: '987654321098', subject_id: 'sub-math', quarter: 1, final_grade: 95 }, // top student
      ] as unknown as ClassRecord[];

      const subjectAwardees = getSubjectAwardees(students, classRecords, [subject1], [section1], 1, '2026-2027');
      expect(subjectAwardees.length).toBe(1);
      expect(subjectAwardees[0].studentName).toBe('Adams, Alice');
      expect(subjectAwardees[0].grade).toBe(95);
    });
  });

  describe('getStudentAbsences', () => {
    it('counts absences from SF2Sheet', () => {
      const sf2Sheets: SF2Sheet[] = [
        {
          id: 'sec-einstein_2026-2027_june',
          section_id: 'sec-einstein',
          school_year: '2026-2027',
          month: 'june',
          attendance: {
            '123456789012': {
              '2026-06-01': 'present',
              '2026-06-02': 'absent',
              '2026-06-03': 'absent',
            }
          }
        }
      ] as unknown as SF2Sheet[];

      const count = getStudentAbsences('123456789012', 'sec-einstein', '2026-2027', 1, [], sf2Sheets);
      expect(count).toBe(2);
    });

    it('counts absences from attendanceRecords when SF2 count is 0', () => {
      const attendanceRecords: AttendanceRecord[] = [
        { id: 'a1', student_lrn: '123456789012', date: '2026-06-05', status: 'absent' },
        { id: 'a2', student_lrn: '123456789012', date: '2026-06-10', status: 'absent' },
      ] as unknown as AttendanceRecord[];

      const count = getStudentAbsences('123456789012', 'sec-einstein', '2026-2027', 1, attendanceRecords, []);
      expect(count).toBe(2);
    });

    it('returns -1 when no attendance data exists at all for the term', () => {
      // No SF2 sheets, no attendance records → should return -1 (no data)
      const count = getStudentAbsences('123456789012', 'sec-einstein', '2026-2027', 1, [], []);
      expect(count).toBe(-1);
    });

    it('returns -1 when attendance data exists but for a different term', () => {
      // SF2 sheet for Term 2 (september), but querying Term 1 → no data for Term 1
      const sf2Sheets: SF2Sheet[] = [
        {
          id: 'sec-einstein_2026-2027_september',
          section_id: 'sec-einstein',
          school_year: '2026-2027',
          month: 'september',
          attendance: {
            '123456789012': {
              '2026-09-01': 'present',
              '2026-09-02': 'absent',
            }
          }
        }
      ] as unknown as SF2Sheet[];

      const count = getStudentAbsences('123456789012', 'sec-einstein', '2026-2027', 1, [], sf2Sheets);
      expect(count).toBe(-1);
    });

    it('returns 0 when attendance data exists and student has no absences (confirmed perfect)', () => {
      const sf2Sheets: SF2Sheet[] = [
        {
          id: 'sec-einstein_2026-2027_june',
          section_id: 'sec-einstein',
          school_year: '2026-2027',
          month: 'june',
          attendance: {
            '123456789012': {
              '2026-06-01': 'present',
              '2026-06-02': 'present',
              '2026-06-03': 'present',
            }
          }
        }
      ] as unknown as SF2Sheet[];

      const count = getStudentAbsences('123456789012', 'sec-einstein', '2026-2027', 1, [], sf2Sheets);
      expect(count).toBe(0);
    });

    it('returns 0 for confirmed present from individual attendance records', () => {
      const attendanceRecords: AttendanceRecord[] = [
        { id: 'a1', student_lrn: '123456789012', date: '2026-06-05', status: 'present' },
        { id: 'a2', student_lrn: '123456789012', date: '2026-06-10', status: 'present' },
      ] as unknown as AttendanceRecord[];

      const count = getStudentAbsences('123456789012', 'sec-einstein', '2026-2027', 1, attendanceRecords, []);
      expect(count).toBe(0);
    });
  });
});
