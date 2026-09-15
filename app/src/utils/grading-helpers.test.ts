import { describe, it, expect, vi } from 'vitest';

// Mock app store to prevent importing browser-only APIs in Node.js
vi.mock('../stores', () => ({
  useAppStore: {
    getState: () => ({
      activeSchoolYear: '2026-2027',
      sections: [
        { id: 'sec-iris-7', section_name: 'Iris', section_grade_level: 'Grade 7' },
        { id: 'sec-rose-8', section_name: 'Rose', section_grade_level: 'Grade 8' },
      ],
    }),
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
  resolveStudentQuarterGrade,
  isMatchingSubject,
  isSameSubject,
  cleanSubjectQuery,
  normalizeGrade12PESubjectName,
  findHpsRecord,
  hasHpsScores,
} from './grading-helpers';
import type { ClassRecord, Student, Subject, Section, AttendanceRecord, SF2Sheet, HPSRecord } from '../types';

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

  describe('resolveStudentQuarterGrade', () => {
    it('returns 0 when student record has completely empty scores (never false 60)', () => {
      const classRecords: ClassRecord[] = [
        {
          id: 'c1',
          student_lrn: '123456789012',
          subject_id: 'sub-math',
          subject_name: 'Mathematics',
          quarter: 1,
          school_year: '2026-2027',
          written_works: ['', '', '', '', ''],
          performance_tasks: ['', '', '', '', ''],
          summative_tests: ['', '', ''],
          quarterly_exam: '',
          final_grade: 0,
        } as unknown as ClassRecord,
      ];

      const hpsRecords: HPSRecord[] = [
        {
          id: 'h1',
          subject_id: 'sub-math',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20, 20, 20, 20],
          performance_tasks: [50, 50, 50, 50, 50],
          summative_tests: [25, 25, 50],
          quarterly_exam: 50,
        } as unknown as HPSRecord,
      ];

      const grade = resolveStudentQuarterGrade(
        '123456789012',
        'sub-math',
        1,
        '2026-2027',
        classRecords,
        [],
        hpsRecords,
        'Grade 7'
      );

      expect(grade).toBe(0);
    });

    it('calculates live transmuted grade correctly from raw scores and HPS', () => {
      const classRecords: ClassRecord[] = [
        {
          id: 'c1',
          student_lrn: '123456789012',
          subject_id: 'sub-math',
          subject_name: 'Mathematics',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20], // 40/40 = 100% * 30% = 30
          performance_tasks: [50, 50], // 100/100 = 100% * 50% = 50
          summative_tests: [25, 25, 50], // 100% * 20% = 20
          quarterly_exam: 50,
        } as unknown as ClassRecord,
      ];

      const hpsRecords: HPSRecord[] = [
        {
          id: 'h1',
          subject_id: 'sub-math',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20],
          performance_tasks: [50, 50],
          summative_tests: [25, 25, 50],
          quarterly_exam: 50,
        } as unknown as HPSRecord,
      ];

      const grade = resolveStudentQuarterGrade(
        '123456789012',
        'sub-math',
        1,
        '2026-2027',
        classRecords,
        [],
        hpsRecords,
        'Grade 7'
      );

      // Initial grade = 100, transmuted = 100
      expect(grade).toBe(100);
    });

    it('correctly matches section HPS when section_id uses section name vs UUID, calculating 77 instead of 100', () => {
      // Student: Endmar Aba (Grade 7 - Iris, Science Term 1)
      const classRecords: ClassRecord[] = [
        {
          id: 'grade_1001_sub-science_Q1',
          student_lrn: '1001',
          section_id: 'sec-iris-7', // Saved as section UUID
          subject_id: 'sub-science',
          subject_name: 'Science',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [5, 3, 5],
          performance_tasks: [93, 98],
          summative_tests: [23, 5, ''],
          quarterly_exam: '',
        } as unknown as ClassRecord,
      ];

      const hpsRecords: HPSRecord[] = [
        {
          // Another section's HPS in the database with smaller scale
          id: 'hps_sub-science_Rose_Q1_2026-2027',
          subject_id: 'sub-science',
          section_id: 'sec-rose-8',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [10, 10, 10],
          performance_tasks: [10, 10], // Small PT HPS that would cause 955% if matched incorrectly!
          summative_tests: [20, 20, 40],
        } as unknown as HPSRecord,
        {
          // Iris HPS saved with section_name as section_id
          id: 'hps_sub-science_Iris_Q1_2026-2027',
          subject_id: 'sub-science',
          section_id: 'Iris',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [10, 10, 10], // 30 HPS (13 score -> 43.33% * 20% = 8.67%)
          performance_tasks: [100, 100], // 200 HPS (191 score -> 95.50% * 50% = 47.75%)
          summative_tests: [25, 25, 50], // ST1=23/25, ST2=5/25 -> 56% * 30% = 16.80%
          quarterly_exam: 50,
        } as unknown as HPSRecord,
      ];

      const grade = resolveStudentQuarterGrade(
        '1001',
        'sub-science',
        1,
        '2026-2027',
        classRecords,
        [],
        hpsRecords,
        'Grade 7'
      );

      // Initial Grade: 8.67 + 47.75 + 16.80 = 73.22 -> Transmuted: 77 (NOT 100!)
      expect(grade).toBe(77);
    });

    it('falls back to pre-stored final_grade if no raw scores exist', () => {
      const classRecords: ClassRecord[] = [
        {
          id: 'c1',
          student_lrn: '123456789012',
          subject_id: 'sub-math',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 88,
        } as unknown as ClassRecord,
      ];

      const grade = resolveStudentQuarterGrade(
        '123456789012',
        'sub-math',
        1,
        '2026-2027',
        classRecords,
        [],
        [],
        'Grade 7'
      );

      expect(grade).toBe(88);
    });

    it('resolves composite MAPEH grade from Music & Arts and PE & Health', () => {
      const classRecords: ClassRecord[] = [
        {
          id: 'c-ma',
          student_lrn: '123456789012',
          subject_id: 'sub-ma',
          subject_name: 'Music and Arts',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 90,
        } as unknown as ClassRecord,
        {
          id: 'c-pe',
          student_lrn: '123456789012',
          subject_id: 'sub-pe',
          subject_name: 'Physical Education and Health',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 86,
        } as unknown as ClassRecord,
      ];

      const mapehGrade = resolveStudentQuarterGrade(
        '123456789012',
        'MAPEH',
        1,
        '2026-2027',
        classRecords,
        [],
        [],
        'Grade 7'
      );

      // (90 + 86) / 2 = 88
      expect(mapehGrade).toBe(88);
    });

    it('resolves composite MAPEH grade from 4 separate components (Music, Arts, PE, Health)', () => {
      const classRecords: ClassRecord[] = [
        {
          id: 'c-m',
          student_lrn: '123456789012',
          subject_id: 'sub-m',
          subject_name: 'Music',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 92,
        } as unknown as ClassRecord,
        {
          id: 'c-a',
          student_lrn: '123456789012',
          subject_id: 'sub-a',
          subject_name: 'Arts',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 88,
        } as unknown as ClassRecord,
        {
          id: 'c-pe',
          student_lrn: '123456789012',
          subject_id: 'sub-pe',
          subject_name: 'Physical Education',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 90,
        } as unknown as ClassRecord,
        {
          id: 'c-h',
          student_lrn: '123456789012',
          subject_id: 'sub-h',
          subject_name: 'Health',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 86,
        } as unknown as ClassRecord,
      ];

      const mapehGrade = resolveStudentQuarterGrade(
        '123456789012',
        'MAPEH',
        1,
        '2026-2027',
        classRecords,
        [],
        [],
        'Grade 8'
      );

      // (92 + 88 + 90 + 86) / 4 = 89
      expect(mapehGrade).toBe(89);
    });

    it('resolves composite MAPEH grade from mixed components (Music and Arts + PE + Health)', () => {
      const classRecords: ClassRecord[] = [
        {
          id: 'c-ma',
          student_lrn: '123456789012',
          subject_id: 'sub-ma',
          subject_name: 'Music and Arts',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 90,
        } as unknown as ClassRecord,
        {
          id: 'c-pe',
          student_lrn: '123456789012',
          subject_id: 'sub-pe',
          subject_name: 'Physical Education',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 86,
        } as unknown as ClassRecord,
        {
          id: 'c-h',
          student_lrn: '123456789012',
          subject_id: 'sub-h',
          subject_name: 'Health',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 84,
        } as unknown as ClassRecord,
      ];

      const mapehGrade = resolveStudentQuarterGrade(
        '123456789012',
        'MAPEH',
        1,
        '2026-2027',
        classRecords,
        [],
        [],
        'Grade 7'
      );

      // ma = 90, pe = (86 + 84)/2 = 85 -> MAPEH = (90 + 85)/2 = 88
      expect(mapehGrade).toBe(88);
    });

    it('resolves MAPEH dynamically from Grade Management gradingSheetRecords without explicit MAPEH record', () => {
      const gradingSheetRecords: ClassRecord[] = [
        {
          id: 'gs-ma',
          student_lrn: '123456789012',
          subject_id: 'sub-ma',
          subject_name: 'Music and Arts',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 94,
        } as unknown as ClassRecord,
        {
          id: 'gs-pe',
          student_lrn: '123456789012',
          subject_id: 'sub-pe',
          subject_name: 'Physical Education and Health',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 92,
        } as unknown as ClassRecord,
      ];

      const mapehGrade = resolveStudentQuarterGrade(
        '123456789012',
        'virtual-mapeh-section1',
        1,
        '2026-2027',
        [], // No ECR records
        gradingSheetRecords, // Strictly from Grade Management
        [],
        'Grade 7'
      );

      // (94 + 92) / 2 = 93
      expect(mapehGrade).toBe(93);
    });

    it('correctly matches and resolves grades for virtual subject IDs (e.g. virtual-filipino-section123)', () => {
      const classRecords: ClassRecord[] = [
        {
          id: 'c-fil',
          student_lrn: '109876543210',
          subject_id: 'real-db-filipino-id-123',
          subject_name: 'Filipino',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 89,
        } as unknown as ClassRecord,
        {
          id: 'c-ap',
          student_lrn: '109876543210',
          subject_id: 'real-db-ap-id-456',
          subject_name: 'Araling Panlipunan (AP)',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 91,
        } as unknown as ClassRecord,
        {
          id: 'c-gmrc',
          student_lrn: '109876543210',
          subject_id: 'real-db-gmrc-id-789',
          subject_name: 'GMRC',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 95,
        } as unknown as ClassRecord,
      ];

      // Lookup using virtual subject IDs
      const filGrade = resolveStudentQuarterGrade(
        '109876543210',
        'virtual-filipino-section_abc',
        1,
        '2026-2027',
        classRecords,
        [],
        [],
        'Grade 4'
      );
      expect(filGrade).toBe(89);

      const apGrade = resolveStudentQuarterGrade(
        '109876543210',
        'virtual-aralingpanlipunanap-section_abc',
        1,
        '2026-2027',
        classRecords,
        [],
        [],
        'Grade 4'
      );
      expect(apGrade).toBe(91);

      const gmrcGrade = resolveStudentQuarterGrade(
        '109876543210',
        'virtual-edukasyonsapagpapakataogmrc-section_abc',
        1,
        '2026-2027',
        classRecords,
        [],
        [],
        'Grade 4'
      );
      expect(gmrcGrade).toBe(95);
    });

    it('prioritizes official consolidated gradingSheetRecords final_grade over teacher classRecords and raw scores', () => {
      const classRecords: ClassRecord[] = [
        {
          id: 'c1',
          student_lrn: '123456789012',
          subject_id: 'sub-eng',
          subject_name: 'English',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 85,
          written_works: [10, 10],
          performance_tasks: [20, 20],
        } as unknown as ClassRecord,
      ];

      const gradingSheetRecords: ClassRecord[] = [
        {
          id: 'g1',
          student_lrn: '123456789012',
          subject_id: 'sub-eng',
          subject_name: 'English',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 89, // Adviser edited to 89 in Grade Management
        } as unknown as ClassRecord,
      ];

      const grade = resolveStudentQuarterGrade(
        '123456789012',
        'sub-eng',
        1,
        '2026-2027',
        classRecords,
        gradingSheetRecords,
        [],
        'Grade 7'
      );

      // Should pull 89 from gradingSheetRecords
      expect(grade).toBe(89);
    });

    it('prioritizes stored teacher classRecords final_grade over raw score recalculation when gradingSheetRecord is absent', () => {
      const classRecords: ClassRecord[] = [
        {
          id: 'c1',
          student_lrn: '123456789012',
          subject_id: 'sub-math',
          subject_name: 'Mathematics',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 92, // Teacher transmuted and stored 92
          written_works: [15, 15],
          performance_tasks: [40, 40],
        } as unknown as ClassRecord,
      ];

      const hpsRecords: HPSRecord[] = [
        {
          id: 'h1',
          subject_id: 'sub-math',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20],
          performance_tasks: [50, 50],
          quarterly_exam: 50,
        } as unknown as HPSRecord,
      ];

      const grade = resolveStudentQuarterGrade(
        '123456789012',
        'sub-math',
        1,
        '2026-2027',
        classRecords,
        [],
        hpsRecords,
        'Grade 7'
      );

      // Should pull 92 directly from classRecords.final_grade, not recompute
      expect(grade).toBe(92);
    });

    it('uses exact GMRC 10/10/10/10/30/30 cognitive/affective/behavioral split when recalculating from raw scores', () => {
      // GMRC: WW Cog (10%), WW Aff (10%), PT Cog (10%), PT Aff (10%), PT Beh (30%), Exams (30%)
      const classRecords: ClassRecord[] = [
        {
          id: 'c1',
          student_lrn: '123456789012',
          subject_id: 'sub-gmrc',
          subject_name: 'Good Moral and Right Conduct (GMRC)',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [10, 10, 10, 10, 10, 5, 5, 5, 5, 5], // Cog: 50/50=100 (WS=10), Aff: 25/50=50 (WS=5)
          performance_tasks: [20, 20, 20, 10, 10, 10, 30, 30, 30], // PT Cog: 60/60=100 (WS=10), PT Aff: 30/60=50 (WS=5), PT Beh: 90/90=100 (WS=30)
          summative_tests: [30, 30, 40], // 100/100 (WS=30)
          final_grade: 0, // Force fallback calculation
        } as unknown as ClassRecord,
      ];

      const hpsRecords: HPSRecord[] = [
        {
          id: 'h1',
          subject_id: 'sub-gmrc',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10], // Cog: 50, Aff: 50
          performance_tasks: [20, 20, 20, 20, 20, 20, 30, 30, 30], // Cog: 60, Aff: 60, Beh: 90
          summative_tests: [30, 30, 40],
        } as unknown as HPSRecord,
      ];

      const grade = resolveStudentQuarterGrade(
        '123456789012',
        'sub-gmrc',
        1,
        '2026-2027',
        classRecords,
        [],
        hpsRecords,
        'Grade 4'
      );

      // Initial = 10 + 5 + 10 + 5 + 30 + 30 = 90
      // Under DepEd Order 15 s. 2026 Table 4 (SY 2026-2027), initial 90.00 transmutes to 91 (88.88 - 90.05)
      expect(grade).toBe(91);
    });
  });

  describe('isMatchingSubject — Physical Education & Health vs Health Optimizing Physical Education (HOPE)', () => {
    it('matches HOPE subjects with valid aliases', () => {
      expect(isMatchingSubject('Health Optimizing Physical Education and Health 1', undefined, 'HOPE 1')).toBe(true);
      expect(isMatchingSubject('Health Optimizing Physical Education 2', undefined, 'Health Optimizing Physical Education and Health 2')).toBe(true);
      expect(isMatchingSubject('HOPE 3', undefined, 'Health Optimizing Physical Education and Health 3')).toBe(true);
      expect(isMatchingSubject('HOPE 4', undefined, 'Health Optimizing Physical Education 4')).toBe(true);
    });

    it('matches Physical Education and Health numbered sequence with PE aliases', () => {
      expect(isMatchingSubject('Physical Education and Health 1', undefined, 'PE and Health 1')).toBe(true);
      expect(isMatchingSubject('Physical Education and Health 2', undefined, 'PE & Health 2')).toBe(true);
      expect(isMatchingSubject('Physical Education and Health 3', undefined, 'PE and Health 3')).toBe(true);
      expect(isMatchingSubject('Physical Education and Health 4', undefined, 'PE & Health 4')).toBe(true);
    });

    it('does NOT cross-match different semester sequence numbers', () => {
      expect(isMatchingSubject('Physical Education and Health 1', undefined, 'Physical Education and Health 2')).toBe(false);
      expect(isMatchingSubject('Health Optimizing Physical Education and Health 1', undefined, 'Health Optimizing Physical Education and Health 2')).toBe(false);
      expect(isMatchingSubject('HOPE 1', undefined, 'HOPE 3')).toBe(false);
    });

    it('safely matches semester sequence numbers across naming flavors to protect teacher records', () => {
      expect(isMatchingSubject('Health Optimizing Physical Education and Health 1', undefined, 'Physical Education and Health 1')).toBe(true);
      expect(isMatchingSubject('HOPE 2', undefined, 'Physical Education and Health 2')).toBe(true);
      expect(isMatchingSubject('Physical Education and Health 3', undefined, 'Health Optimizing Physical Education and Health 3')).toBe(true);
      expect(isMatchingSubject('Health Optimizing Physical Education 3', undefined, 'Health Optimizing Physical Education and Health 3')).toBe(true);
      expect(isMatchingSubject('Physical Education 3', undefined, 'Health Optimizing Physical Education and Health 3')).toBe(true);
      expect(isMatchingSubject('PE and Health 4', undefined, 'Health Optimizing Physical Education and Health 4')).toBe(true);
    });

    it('does NOT cross-match different semester sequences', () => {
      expect(isMatchingSubject('Health Optimizing Physical Education and Health 3', undefined, 'Physical Education 4')).toBe(false);
      expect(isMatchingSubject('Physical Education and Health 3', undefined, 'Physical Education 4')).toBe(false);
      expect(isMatchingSubject('PE and Health 3', undefined, 'HOPE 4')).toBe(false);
    });

    it('keeps specialized sports electives distinct from general physical education', () => {
      expect(isMatchingSubject('Physical Education 1 (Fitness and Recreation)', undefined, 'Health Optimizing Physical Education and Health 1')).toBe(false);
      expect(isMatchingSubject('Physical Education 1 (Fitness and Recreation)', undefined, 'Physical Education 1')).toBe(false);
      expect(isMatchingSubject('Physical Education 2 (Sports and Dance)', undefined, 'Health Optimizing Physical Education and Health 2')).toBe(false);
    });
  });

  describe('isMatchingSubject — Computer Programming (Java) ( NC III ) and Specializations', () => {
    it('seamlessly matches Computer Programming (Java) ( NC III ) across all naming flavors', () => {
      expect(isMatchingSubject('Computer Programming (Java) ( NC III )', undefined, 'Computer Programming (Java)')).toBe(true);
      expect(isMatchingSubject('Computer Programming (Java)', undefined, 'Computer Programming (Java) ( NC III )')).toBe(true);
      expect(isMatchingSubject('Specialized  Computer Programming (Java) ( NC III )', undefined, 'Computer Programming (Java) ( NC III )')).toBe(true);
      expect(isMatchingSubject('Specialized Computer Programming (Java) (NC III)', undefined, 'Computer Programming (Java)')).toBe(true);
      expect(isMatchingSubject('TVL: Computer Programming (Java) ( NC III )', undefined, 'Computer Programming (Java) ( NC III )')).toBe(true);
    });

    it('does NOT cross-match different programming tracks', () => {
      expect(isMatchingSubject('Computer Programming (Java) ( NC III )', undefined, 'Computer Programming (.Net Technology)')).toBe(false);
      expect(isMatchingSubject('Computer Programming (Java)', undefined, 'Computer Programming (Oracle Database)')).toBe(false);
    });
  });

  describe('normalizeGrade12PESubjectName', () => {
    it('normalizes Old K-12 PE variations to official Health Optimizing Physical Education and Health 1-4', () => {
      expect(normalizeGrade12PESubjectName('Physical Education and Health 3')).toBe('Health Optimizing Physical Education and Health 3');
      expect(normalizeGrade12PESubjectName('Health Optimizing Physical Education 3')).toBe('Health Optimizing Physical Education and Health 3');
      expect(normalizeGrade12PESubjectName('PE and Health 3')).toBe('Health Optimizing Physical Education and Health 3');
      expect(normalizeGrade12PESubjectName('HOPE 3')).toBe('Health Optimizing Physical Education and Health 3');
      expect(normalizeGrade12PESubjectName('Physical Education 3')).toBe('Health Optimizing Physical Education and Health 3');
      expect(normalizeGrade12PESubjectName('Physical Education and Health 1')).toBe('Health Optimizing Physical Education and Health 1');
      expect(normalizeGrade12PESubjectName('Health Optimizing Physical Education and Health 4')).toBe('Health Optimizing Physical Education and Health 4');
    });

    it('preserves SSHS specialized sports electives without alteration', () => {
      expect(normalizeGrade12PESubjectName('Physical Education 1 (Fitness and Recreation)')).toBe('Physical Education 1 (Fitness and Recreation)');
      expect(normalizeGrade12PESubjectName('Physical Education 2 (Sports and Dance)')).toBe('Physical Education 2 (Sports and Dance)');
    });

    it('correctly handles virtual_ and virtual- subject prefixes in cleanSubjectQuery and isMatchingSubject', () => {
      expect(cleanSubjectQuery('virtual_general_mathematics')).toBe('general_mathematics');
      expect(cleanSubjectQuery('virtual_pre_calculus')).toBe('pre_calculus');
      expect(cleanSubjectQuery('virtual-mapeh-section123')).toBe('mapeh');

      expect(isMatchingSubject('virtual_general_mathematics', 'sub-math-1', 'General Mathematics')).toBe(true);
      expect(isMatchingSubject('virtual_pre_calculus', 'sub-calc-1', 'Pre-Calculus')).toBe(true);
      expect(isMatchingSubject('virtual_general_science', 'sub-sci-1', 'General Science')).toBe(true);
      expect(isMatchingSubject('virtual_general_mathematics', 'sub-sci-1', 'General Science')).toBe(false);
    });
  });

  describe('DepEd Template Parity for GMRC & Values Education', () => {
    it('accurately computes GMRC/Values Education grades matching ECR_Template_GMRC_VE_G2_G10.xlsx', () => {
      const studentLrn = '123456789012';
      const gmrcSubjectName = 'Values Education';

      // HPS:
      // WW Cog (5 items): 20 each (total 100)
      // WW Aff (5 items): 20 each (total 100)
      // PT Cog (3 items): 30, 30, 40 (total 100)
      // PT Aff (3 items): 30, 30, 40 (total 100)
      // PT Beh (3 items): 30, 30, 40 (total 100)
      // ST1: 40, ST2: 40, TE: 50
      const mockHps: HPSRecord[] = [
        {
          id: 'hps-gmrc',
          subject_id: 'sub-gmrc',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
          performance_tasks: [30, 30, 40, 30, 30, 40, 30, 30, 40],
          summative_tests: [40, 40, 50],
          quarterly_exam: 50,
        } as unknown as HPSRecord
      ];

      // Student scores:
      // WW Cog: [18, 18, 18, 18, 18] -> 90 / 100 = 90% -> WS = 9.00
      // WW Aff: [19, 19, 19, 19, 19] -> 95 / 100 = 95% -> WS = 9.50
      // PT Cog: [27, 27, 36] -> 90 / 100 = 90% -> WS = 9.00
      // PT Aff: [28, 28, 38] -> 94 / 100 = 94% -> WS = 9.40
      // PT Beh: [27, 27, 36] -> 90 / 100 = 90% -> WS = 27.00
      // ST1: 36/40*30 = 27.00
      // ST2: 36/40*30 = 27.00
      // TE: 45/50*40 = 36.00
      // Exam PS: 27 + 27 + 36 = 90 -> Exam WS = 90 * 0.30 = 27.00
      // Initial Grade = 9.00 + 9.50 + 9.00 + 9.40 + 27.00 + 27.00 = 90.90
      // SY 2026-2027 Transmuted Grade for 90.90 is 92 (Row 16: 90.06 - 91.23 -> 92)
      const mockClassRecords: ClassRecord[] = [
        {
          id: 'cr-gmrc',
          student_lrn: studentLrn,
          subject_id: 'sub-gmrc',
          subject_name: gmrcSubjectName,
          quarter: 1,
          school_year: '2026-2027',
          written_works: [18, 18, 18, 18, 18, 19, 19, 19, 19, 19],
          performance_tasks: [27, 27, 36, 28, 28, 38, 27, 27, 36],
          summative_tests: [36, 36, 45],
          quarterly_exam: 45,
        } as unknown as ClassRecord
      ];

      const grade = resolveStudentQuarterGrade(
        studentLrn,
        gmrcSubjectName,
        1,
        '2026-2027',
        mockClassRecords,
        [],
        mockHps,
        'Grade 7'
      );

      expect(grade).toBe(92);
    });

    it('identifies GMRC variants (GMRC, Values Education, ESP) consistently', () => {
      const studentLrn = '123456789012';
      const mockHps: HPSRecord[] = [
        {
          id: 'hps-esp',
          subject_id: 'sub-esp',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
          performance_tasks: [50, 50, 50, 50, 50, 50, 50, 50, 50],
          summative_tests: [50, 50, 50],
          quarterly_exam: 50,
        } as unknown as HPSRecord
      ];

      const mockClassRecords: ClassRecord[] = [
        {
          id: 'cr-esp',
          student_lrn: studentLrn,
          subject_id: 'sub-esp',
          subject_name: 'Edukasyon sa Pagpapakatao',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
          performance_tasks: [50, 50, 50, 50, 50, 50, 50, 50, 50],
          summative_tests: [50, 50, 50],
          quarterly_exam: 50,
        } as unknown as ClassRecord
      ];

      const grade = resolveStudentQuarterGrade(
        studentLrn,
        'Edukasyon sa Pagpapakatao',
        1,
        '2026-2027',
        mockClassRecords,
        [],
        mockHps,
        'Grade 6'
      );

      // 100% score -> Transmuted Grade 100
      expect(grade).toBe(100);
    });
  });

  describe('Ghost and Headless Record Protection', () => {
    it('returns 0 when classRecord has final_grade: 100 but raw score arrays are completely empty', () => {
      const studentLrn = '100501202601'; // Angelo Gabriel Mendoza
      const ghostClassRecords: ClassRecord[] = [
        {
          id: 'ghost-fil-q1',
          student_lrn: studentLrn,
          subject_id: 'sub-fil',
          subject_name: 'Filipino',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [],
          performance_tasks: [],
          quarterly_exam: 0,
          final_grade: 100
        } as unknown as ClassRecord
      ];

      // E-Class Record sync passes gradingSheetRecords = []
      const resolved = resolveStudentQuarterGrade(
        studentLrn,
        'Filipino',
        1,
        '2026-2027',
        ghostClassRecords,
        [],
        [],
        'Grade 5'
      );

      // Must NOT return phantom grade 100!
      expect(resolved).toBe(0);
    });

    it('returns 0 when classRecord has final_grade: 100 but raw score arrays contain only empty strings', () => {
      const studentLrn = '100501202601';
      const ghostClassRecords: ClassRecord[] = [
        {
          id: 'ghost-eng-q1',
          student_lrn: studentLrn,
          subject_id: 'sub-eng',
          subject_name: 'English',
          quarter: 1,
          school_year: '2026-2027',
          written_works: ['', '', '', '', ''],
          performance_tasks: ['', '', '', ''],
          quarterly_exam: '',
          final_grade: 100
        } as unknown as ClassRecord
      ];

      const resolved = resolveStudentQuarterGrade(
        studentLrn,
        'English',
        1,
        '2026-2027',
        ghostClassRecords,
        [],
        [],
        'Grade 5'
      );

      expect(resolved).toBe(0);
    });

    it('returns transmuted grade when classRecord actually has encoded raw scores', () => {
      const studentLrn = '100501202601';
      const realClassRecords: ClassRecord[] = [
        {
          id: 'real-epp-q1',
          student_lrn: studentLrn,
          subject_id: 'sub-epp',
          subject_name: 'E.P.P.',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [25, 25],
          performance_tasks: [50, 50],
          quarterly_exam: 40,
          final_grade: 95
        } as unknown as ClassRecord
      ];

      const resolved = resolveStudentQuarterGrade(
        studentLrn,
        'E.P.P.',
        1,
        '2026-2027',
        realClassRecords,
        [],
        [],
        'Grade 5'
      );

      expect(resolved).toBe(95);
    });

    it('preserves manual grades from gradingSheetRecords even if classRecord is a ghost record', () => {
      const studentLrn = '100501202601';
      const ghostClassRecords: ClassRecord[] = [
        {
          id: 'ghost-math-q1',
          student_lrn: studentLrn,
          subject_id: 'sub-math',
          subject_name: 'Mathematics',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [],
          performance_tasks: [],
          quarterly_exam: 0,
          final_grade: 100 // phantom grade in ECR
        } as unknown as ClassRecord
      ];

      const manualGradingSheetRecords: ClassRecord[] = [
        {
          id: 'manual-math-q1',
          student_lrn: studentLrn,
          subject_id: 'sub-math',
          subject_name: 'Mathematics',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [],
          performance_tasks: [],
          quarterly_exam: 0,
          final_grade: 88 // teacher manually typed 88 in Grade Management
        } as unknown as ClassRecord
      ];

      // In Grade Management / SF9, both classRecords and gradingSheetRecords are passed
      const resolved = resolveStudentQuarterGrade(
        studentLrn,
        'Mathematics',
        1,
        '2026-2027',
        ghostClassRecords,
        manualGradingSheetRecords,
        [],
        'Grade 5'
      );

      // Priority 1 (manual Grade Management record) takes precedence!
      expect(resolved).toBe(88);
    });
  });

  describe('isSameSubject — Peer Subject Comparison and Subject Isolation', () => {
    it('matches exact subject names and IDs', () => {
      expect(isSameSubject('Filipino', 'Filipino', 'Filipino', 'Filipino')).toBe(true);
      expect(isSameSubject('sub-1', 'English', 'sub-1', 'English')).toBe(true);
      expect(isSameSubject('sub-1', undefined, 'sub-1', undefined)).toBe(true);
      expect(isSameSubject(undefined, 'Mathematics', undefined, 'mathematics')).toBe(true);
    });

    it('matches canonical variations and virtual prefix IDs for the same subject', () => {
      expect(isSameSubject('virtual-aralingpanlipunanap-sec-g5', 'Araling Panlipunan (AP)', 'sub-ap', 'Araling Panlipunan')).toBe(true);
      expect(isSameSubject('virtual-filipino-sec-g5', 'Filipino', 'sub-fil', 'Filipino')).toBe(true);
      expect(isSameSubject('virtual_general_mathematics', 'General Mathematics', 'sub-math-1', 'Gen Math')).toBe(true);
      expect(isSameSubject('virtual-science-sec-g5', 'Science', 'science', 'Science')).toBe(true);
    });

    it('strictly separates different subjects and NEVER cross-matches them', () => {
      const subjects = [
        { id: 'Filipino', name: 'Filipino' },
        { id: 'English', name: 'English' },
        { id: 'Mathematics', name: 'Mathematics' },
        { id: 'Science', name: 'Science' },
        { id: 'GMRC', name: 'GMRC (Good Manners and Right Conduct)' },
        { id: 'Araling Panlipunan', name: 'Araling Panlipunan (AP)' },
        { id: 'EPP', name: 'E.P.P.' },
        { id: 'Music & Arts', name: 'Music and Arts' },
        { id: 'PE & Health', name: 'Physical Education and Health' },
      ];

      for (let i = 0; i < subjects.length; i++) {
        for (let j = 0; j < subjects.length; j++) {
          const s1 = subjects[i];
          const s2 = subjects[j];
          const result = isSameSubject(s1.id, s1.name, s2.id, s2.name);
          if (i === j) {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          }
        }
      }
    });

    it('correctly returns false when inputs are empty or undefined', () => {
      expect(isSameSubject('', '', 'Filipino', 'Filipino')).toBe(false);
      expect(isSameSubject(undefined, undefined, 'English', 'English')).toBe(false);
      expect(isSameSubject('', '', '', '')).toBe(false);
      expect(isSameSubject(undefined, undefined, undefined, undefined)).toBe(false);
    });

    it('guarantees that updating Araling Panlipunan does not match or overwrite other subjects for the same student', () => {
      const studentLrn = '100501202601';
      const existingRecords: ClassRecord[] = [
        { id: `${studentLrn}_Filipino_1`, student_lrn: studentLrn, section_id: 'sec-1', subject_id: 'Filipino', subject_name: 'Filipino', quarter: 1, school_year: '2026-2027', final_grade: 95, written_works: [], performance_tasks: [], quarterly_exam: 0 },
        { id: `${studentLrn}_English_1`, student_lrn: studentLrn, section_id: 'sec-1', subject_id: 'English', subject_name: 'English', quarter: 1, school_year: '2026-2027', final_grade: 92, written_works: [], performance_tasks: [], quarterly_exam: 0 },
        { id: `${studentLrn}_Math_1`, student_lrn: studentLrn, section_id: 'sec-1', subject_id: 'Mathematics', subject_name: 'Mathematics', quarter: 1, school_year: '2026-2027', final_grade: 90, written_works: [], performance_tasks: [], quarterly_exam: 0 },
        { id: `${studentLrn}_Science_1`, student_lrn: studentLrn, section_id: 'sec-1', subject_id: 'Science', subject_name: 'Science', quarter: 1, school_year: '2026-2027', final_grade: 89, written_works: [], performance_tasks: [], quarterly_exam: 0 },
        { id: `${studentLrn}_GMRC_1`, student_lrn: studentLrn, section_id: 'sec-1', subject_id: 'GMRC', subject_name: 'GMRC', quarter: 1, school_year: '2026-2027', final_grade: 96, written_works: [], performance_tasks: [], quarterly_exam: 0 },
        { id: `${studentLrn}_AP_1`, student_lrn: studentLrn, section_id: 'sec-1', subject_id: 'Araling Panlipunan', subject_name: 'Araling Panlipunan', quarter: 1, school_year: '2026-2027', final_grade: 100, written_works: [], performance_tasks: [], quarterly_exam: 0 },
        { id: `${studentLrn}_EPP_1`, student_lrn: studentLrn, section_id: 'sec-1', subject_id: 'EPP', subject_name: 'EPP', quarter: 1, school_year: '2026-2027', final_grade: 94, written_works: [], performance_tasks: [], quarterly_exam: 0 },
      ];

      // Incoming update for Araling Panlipunan with grade 88
      const apUpdate: ClassRecord = {
        id: `${studentLrn}_AP_1`,
        student_lrn: studentLrn,
        section_id: 'sec-1',
        subject_id: 'Araling Panlipunan',
        subject_name: 'Araling Panlipunan',
        quarter: 1,
        school_year: '2026-2027',
        final_grade: 88,
        written_works: [],
        performance_tasks: [],
        quarterly_exam: 0,
      };

      // Simulate the isMatch logic in updateGradingSheetRecord using isSameSubject
      const isMatch = (r: ClassRecord) => {
        if (r.id === apUpdate.id) return true;
        const sameStudent = r.student_lrn === apUpdate.student_lrn || String(r.student_lrn).trim() === String(apUpdate.student_lrn).trim();
        const sameSubject = isSameSubject(r.subject_id, r.subject_name, apUpdate.subject_id, apUpdate.subject_name);
        const sameQuarter = Number(r.quarter) === Number(apUpdate.quarter);
        const sameSy = !r.school_year || !apUpdate.school_year || r.school_year === apUpdate.school_year;
        return sameStudent && sameSubject && sameQuarter && sameSy;
      };

      const matchingRecords = existingRecords.filter(isMatch);
      const remainingRecords = existingRecords.filter(r => !isMatch(r));

      // Only the Araling Panlipunan record must match!
      expect(matchingRecords).toHaveLength(1);
      expect(matchingRecords[0].subject_id).toBe('Araling Panlipunan');

      // All other subjects must remain untouched!
      expect(remainingRecords).toHaveLength(6);
      const remainingSubjectIds = remainingRecords.map(r => r.subject_id);
      expect(remainingSubjectIds).toEqual(['Filipino', 'English', 'Mathematics', 'Science', 'GMRC', 'EPP']);

      // State after update
      const updatedGradingSheetRecords = [...remainingRecords, apUpdate];
      expect(updatedGradingSheetRecords).toHaveLength(7);

      // Verify resolution for each subject
      expect(resolveStudentQuarterGrade(studentLrn, 'Filipino', 1, '2026-2027', [], updatedGradingSheetRecords, [], 'Grade 5')).toBe(95);
      expect(resolveStudentQuarterGrade(studentLrn, 'English', 1, '2026-2027', [], updatedGradingSheetRecords, [], 'Grade 5')).toBe(92);
      expect(resolveStudentQuarterGrade(studentLrn, 'Mathematics', 1, '2026-2027', [], updatedGradingSheetRecords, [], 'Grade 5')).toBe(90);
      expect(resolveStudentQuarterGrade(studentLrn, 'Science', 1, '2026-2027', [], updatedGradingSheetRecords, [], 'Grade 5')).toBe(89);
      expect(resolveStudentQuarterGrade(studentLrn, 'GMRC', 1, '2026-2027', [], updatedGradingSheetRecords, [], 'Grade 5')).toBe(96);
      expect(resolveStudentQuarterGrade(studentLrn, 'Araling Panlipunan', 1, '2026-2027', [], updatedGradingSheetRecords, [], 'Grade 5')).toBe(88);
      expect(resolveStudentQuarterGrade(studentLrn, 'EPP', 1, '2026-2027', [], updatedGradingSheetRecords, [], 'Grade 5')).toBe(94);
    });
  });

  describe('Subject Isolation: Preventing Cross-Contamination Across Subjects', () => {
    it('strictly isolates GMRC, Values Education, and Makabansa from matching each other', () => {
      // isMatchingSubject checks
      expect(isMatchingSubject('GMRC', undefined, 'Values Education')).toBe(false);
      expect(isMatchingSubject('GMRC', undefined, 'Makabansa')).toBe(false);
      expect(isMatchingSubject('Values Education', undefined, 'Makabansa')).toBe(false);
      expect(isMatchingSubject('Makabansa', undefined, 'GMRC')).toBe(false);
      expect(isMatchingSubject('Makabansa', undefined, 'Values Education')).toBe(false);
      expect(isMatchingSubject('Values Education', undefined, 'GMRC')).toBe(false);

      // isSameSubject checks
      expect(isSameSubject('sub-gmrc', 'GMRC', 'sub-ve', 'Values Education')).toBe(false);
      expect(isSameSubject('sub-gmrc', 'GMRC', 'sub-maka', 'Makabansa')).toBe(false);
      expect(isSameSubject('sub-ve', 'Values Education', 'sub-maka', 'Makabansa')).toBe(false);
      expect(isSameSubject('sub-maka', 'Makabansa', 'sub-gmrc', 'Good Moral and Right Conduct (GMRC)')).toBe(false);
      expect(isSameSubject('sub-maka', 'Makabansa', 'sub-ve', 'Edukasyon sa Pagpapakatao')).toBe(false);
    });

    it('strictly isolates Grade 1 Language, Reading & Literacy, and English from matching each other', () => {
      // isMatchingSubject checks
      expect(isMatchingSubject('Language', undefined, 'Reading and Literacy')).toBe(false);
      expect(isMatchingSubject('Reading and Literacy', undefined, 'Language')).toBe(false);
      expect(isMatchingSubject('Language', undefined, 'English')).toBe(false);
      expect(isMatchingSubject('English', undefined, 'Language')).toBe(false);
      expect(isMatchingSubject('Reading and Literacy', undefined, 'English')).toBe(false);
      expect(isMatchingSubject('English', undefined, 'Reading and Literacy')).toBe(false);

      // isSameSubject checks
      expect(isSameSubject('sub-lang', 'Language', 'sub-read', 'Reading and Literacy')).toBe(false);
      expect(isSameSubject('sub-lang', 'Language', 'sub-eng', 'English')).toBe(false);
      expect(isSameSubject('sub-read', 'Reading and Literacy', 'sub-eng', 'English')).toBe(false);
    });

    it('strictly isolates EPP, TLE, and TVL from matching each other', () => {
      expect(isMatchingSubject('EPP', undefined, 'TLE')).toBe(false);
      expect(isMatchingSubject('TLE', undefined, 'EPP')).toBe(false);
      expect(isMatchingSubject('EPP', undefined, 'TVL')).toBe(false);
      expect(isMatchingSubject('TLE', undefined, 'TVL')).toBe(false);

      expect(isSameSubject('sub-epp', 'EPP', 'sub-tle', 'TLE')).toBe(false);
      expect(isSameSubject('sub-epp', 'Edukasyong Pantahanan at Pangkabuhayan (EPP)', 'sub-tle', 'Technology and Livelihood Education (TLE)')).toBe(false);
      expect(isSameSubject('sub-tle', 'TLE', 'sub-tvl', 'TVL')).toBe(false);
    });

    it('strictly isolates Araling Panlipunan and Makabansa', () => {
      expect(isMatchingSubject('Araling Panlipunan', undefined, 'Makabansa')).toBe(false);
      expect(isMatchingSubject('Makabansa', undefined, 'Araling Panlipunan')).toBe(false);
      expect(isSameSubject('sub-ap', 'Araling Panlipunan', 'sub-maka', 'Makabansa')).toBe(false);
    });

    it('preserves raw scores independently for GMRC, Makabansa, and Values without overwriting or deleting', () => {
      const studentLrn = '109876543210';
      const sy = '2026-2027';

      // Simulating database state with records for all three subjects
      const gmrcRecord: ClassRecord = {
        id: `grade_${studentLrn}_sub-gmrc_Q1`,
        student_lrn: studentLrn,
        subject_id: 'sub-gmrc',
        subject_name: 'GMRC',
        quarter: 1,
        school_year: sy,
        written_works: [10, 10, 10, 10, 10, 9, 9, 9, 9, 9], // 10 WWs for GMRC
        performance_tasks: [20, 20, 20, 19, 19, 19, 30, 30, 30], // 9 PTs for GMRC
        quarterly_exam: 28,
        final_grade: 93
      } as unknown as ClassRecord;

      const makabansaRecord: ClassRecord = {
        id: `grade_${studentLrn}_sub-maka_Q1`,
        student_lrn: studentLrn,
        subject_id: 'sub-maka',
        subject_name: 'Makabansa',
        quarter: 1,
        school_year: sy,
        written_works: [25, 24, 23, 22, 25], // 5 WWs for Makabansa
        performance_tasks: [48, 47, 49], // 3 PTs for Makabansa
        quarterly_exam: 45,
        final_grade: 91
      } as unknown as ClassRecord;

      const valuesRecord: ClassRecord = {
        id: `grade_${studentLrn}_sub-ve_Q1`,
        student_lrn: studentLrn,
        subject_id: 'sub-ve',
        subject_name: 'Values Education',
        quarter: 1,
        school_year: sy,
        written_works: [8, 8, 8, 8, 8, 9, 9, 9, 9, 9],
        performance_tasks: [18, 18, 18, 19, 19, 19, 28, 28, 28],
        quarterly_exam: 25,
        final_grade: 89
      } as unknown as ClassRecord;

      const classRecords: ClassRecord[] = [gmrcRecord, makabansaRecord, valuesRecord];

      // Lookup on GMRC page
      const foundForGMRC = classRecords.find(r =>
        r.student_lrn === studentLrn &&
        (r.subject_id === 'sub-gmrc' || isSameSubject(r.subject_id, r.subject_name, 'sub-gmrc', 'GMRC')) &&
        Number(r.quarter) === 1 &&
        (!sy || !r.school_year || r.school_year === sy)
      );
      expect(foundForGMRC).toBeDefined();
      expect(foundForGMRC?.id).toBe(gmrcRecord.id);
      expect(foundForGMRC?.written_works).toHaveLength(10);
      expect(foundForGMRC?.performance_tasks).toHaveLength(9);

      // Lookup on Makabansa page
      const foundForMakabansa = classRecords.find(r =>
        r.student_lrn === studentLrn &&
        (r.subject_id === 'sub-maka' || isSameSubject(r.subject_id, r.subject_name, 'sub-maka', 'Makabansa')) &&
        Number(r.quarter) === 1 &&
        (!sy || !r.school_year || r.school_year === sy)
      );
      expect(foundForMakabansa).toBeDefined();
      expect(foundForMakabansa?.id).toBe(makabansaRecord.id);
      expect(foundForMakabansa?.written_works).toHaveLength(5);
      expect(foundForMakabansa?.performance_tasks).toHaveLength(3);

      // Lookup on Values Education page
      const foundForValues = classRecords.find(r =>
        r.student_lrn === studentLrn &&
        (r.subject_id === 'sub-ve' || isSameSubject(r.subject_id, r.subject_name, 'sub-ve', 'Values Education')) &&
        Number(r.quarter) === 1 &&
        (!sy || !r.school_year || r.school_year === sy)
      );
      expect(foundForValues).toBeDefined();
      expect(foundForValues?.id).toBe(valuesRecord.id);
      expect(foundForValues?.final_grade).toBe(89);
    });
  });

  describe('findHpsRecord and hasHpsScores', () => {
    it('accurately checks if an HPS record has scores', () => {
      expect(hasHpsScores(null)).toBe(false);
      expect(hasHpsScores(undefined)).toBe(false);
      expect(hasHpsScores({ written_works: ['', ''], performance_tasks: [], quarterly_exam: '' } as unknown as HPSRecord)).toBe(false);
      expect(hasHpsScores({ written_works: [25, ''], performance_tasks: [], quarterly_exam: '' } as unknown as HPSRecord)).toBe(true);
      expect(hasHpsScores({ written_works: [], performance_tasks: [50], quarterly_exam: '' } as unknown as HPSRecord)).toBe(true);
      expect(hasHpsScores({ written_works: [], performance_tasks: [], quarterly_exam: 30 } as unknown as HPSRecord)).toBe(true);
    });

    it('matches HPS with soft school year formatting (SY 2026-2027 vs 2026-2027)', () => {
      const records: HPSRecord[] = [
        {
          id: 'hps_sci_1',
          subject_id: 'sub-sci',
          school_year: 'SY 2026-2027',
          quarter: 1,
          section_id: 'sec-diamond',
          written_works: [25, 25],
          performance_tasks: [50],
          quarterly_exam: 30
        } as unknown as HPSRecord
      ];

      const found = findHpsRecord(records, {
        subjectId: 'sub-sci',
        subjectName: 'Science',
        sectionId: 'sec-diamond',
        quarter: 1,
        schoolYear: '2026-2027'
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe('hps_sci_1');
    });

    it('strictly isolates sections: does NOT leak Section Rizal HPS to Section Bonifacio', () => {
      // Teacher inputted HPS in Section Rizal (Grade 7)
      const records: HPSRecord[] = [
        {
          id: 'hps_sub-sci_sec-rizal_Q1_2026-2027',
          subject_id: 'sub-sci',
          subject_name: 'Science',
          school_year: '2026-2027',
          quarter: 1,
          section_id: 'sec-rizal',
          written_works: [30, 30],
          performance_tasks: [50, 50],
          quarterly_exam: 40
        } as unknown as HPSRecord
      ];

      // Teacher opens Section Bonifacio (also Grade 7, Science)
      const found = findHpsRecord(records, {
        subjectId: 'sub-sci',
        subjectName: 'Science',
        sectionId: 'sec-bonifacio',
        sectionName: 'Bonifacio',
        sectionGradeLevel: 'Grade 7',
        quarter: 1,
        schoolYear: '2026-2027'
      });

      // Must be undefined! Each section must have its own unique, isolated HPS!
      expect(found).toBeUndefined();
    });

    it('allows different sections to have their own unique, independent HPS records', () => {
      const records: HPSRecord[] = [
        {
          id: 'hps_sub-sci_sec-rizal_Q1_2026-2027',
          subject_id: 'sub-sci',
          subject_name: 'Science',
          school_year: '2026-2027',
          quarter: 1,
          section_id: 'sec-rizal',
          written_works: [25, 25],
          performance_tasks: [40, 40],
          quarterly_exam: 30
        } as unknown as HPSRecord,
        {
          id: 'hps_sub-sci_sec-bonifacio_Q1_2026-2027',
          subject_id: 'sub-sci',
          subject_name: 'Science',
          school_year: '2026-2027',
          quarter: 1,
          section_id: 'sec-bonifacio',
          written_works: [35, 40],
          performance_tasks: [60, 50],
          quarterly_exam: 50
        } as unknown as HPSRecord
      ];

      const rizalHps = findHpsRecord(records, {
        subjectId: 'sub-sci',
        subjectName: 'Science',
        sectionId: 'sec-rizal',
        quarter: 1,
        schoolYear: '2026-2027'
      });
      expect(rizalHps?.written_works).toEqual([25, 25]);

      const bonifacioHps = findHpsRecord(records, {
        subjectId: 'sub-sci',
        subjectName: 'Science',
        sectionId: 'sec-bonifacio',
        quarter: 1,
        schoolYear: '2026-2027'
      });
      expect(bonifacioHps?.written_works).toEqual([35, 40]);
    });

    it('finds HPS when subject ID changed but classRecords has the matching subject name', () => {
      const records: HPSRecord[] = [
        {
          id: 'hps_old-uuid_sec-1_Q1',
          subject_id: 'old-uuid-12345',
          school_year: '2026-2027',
          quarter: 1,
          section_id: 'sec-1',
          written_works: [20, 25],
          performance_tasks: [40, 45],
          quarterly_exam: 30
        } as unknown as HPSRecord
      ];

      const classRecords: ClassRecord[] = [
        {
          id: 'cr-1',
          student_lrn: '123',
          subject_id: 'old-uuid-12345',
          subject_name: 'Science',
          school_year: '2026-2027',
          quarter: 1
        } as unknown as ClassRecord
      ];

      const found = findHpsRecord(records, {
        subjectId: 'new-canonical-sci-id',
        subjectName: 'Science',
        sectionId: 'sec-1',
        quarter: 1,
        schoolYear: '2026-2027',
        classRecords
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe('hps_old-uuid_sec-1_Q1');
    });
  });
});


