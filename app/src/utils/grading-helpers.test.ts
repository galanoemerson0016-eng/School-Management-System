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
  resolveStudentQuarterGrade,
} from './grading-helpers';
import { filterSubjectsForSection } from '../lib/rbac';
import { normalizeSubjectName } from '../lib/subjectConfig';
import type { ClassRecord, Student, Subject, Section, AttendanceRecord, SF2Sheet, HPSRecord, User } from '../types';

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

  describe('resolveStudentQuarterGrade Custom Weights & Section HPS', () => {
    it('applies custom subject weights when subjects array is passed', () => {
      const classRecords: ClassRecord[] = [
        {
          id: 'cr-1',
          student_lrn: '100000000001',
          section_id: 'sec-1',
          subject_id: 'sub-pe',
          subject_name: 'Physical Education and Health',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [50],
          performance_tasks: [100],
          quarterly_exam: 100
        }
      ] as unknown as ClassRecord[];

      const hpsRecords: HPSRecord[] = [
        {
          id: 'hps-1',
          subject_id: 'sub-pe',
          section_id: 'sec-1',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [50],
          performance_tasks: [100],
          quarterly_exam: 100
        }
      ] as unknown as HPSRecord[];

      const customSubjects: Subject[] = [
        {
          id: 'sub-pe',
          subject_name: 'Physical Education and Health',
          grade_level: 'Grade 7',
          written_weight: 0.10,
          performance_weight: 0.70,
          exam_weight: 0.20
        }
      ] as unknown as Subject[];

      // With custom weights (10/70/20):
      // WW: 100% * 0.10 = 10
      // PT: 100% * 0.70 = 70
      // QA: 100% * 0.20 = 20
      // Total Initial = 100 => Transmuted = 100
      const grade = resolveStudentQuarterGrade(
        '100000000001',
        'sub-pe',
        1,
        '2026-2027',
        classRecords,
        [],
        hpsRecords,
        'Grade 7',
        undefined,
        customSubjects,
        'sec-1'
      );
      expect(grade).toBe(100);
    });

    it('matches section-specific HPS when multiple sections have different HPS', () => {
      const classRecords: ClassRecord[] = [
        {
          id: 'cr-sec2',
          student_lrn: '100000000002',
          section_id: 'sec-2',
          subject_id: 'sub-math',
          subject_name: 'Mathematics',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [40],
          performance_tasks: [80],
          quarterly_exam: 40
        }
      ] as unknown as ClassRecord[];

      const hpsRecords: HPSRecord[] = [
        {
          id: 'hps-sec1',
          subject_id: 'sub-math',
          section_id: 'sec-1',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [100],
          performance_tasks: [100],
          quarterly_exam: 100
        },
        {
          id: 'hps-sec2',
          subject_id: 'sub-math',
          section_id: 'sec-2',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [40],
          performance_tasks: [80],
          quarterly_exam: 40
        }
      ] as unknown as HPSRecord[];

      const grade = resolveStudentQuarterGrade(
        '100000000002',
        'sub-math',
        1,
        '2026-2027',
        classRecords,
        [],
        hpsRecords,
        'Grade 7',
        undefined,
        undefined,
        'sec-2'
      );
      // Perfect scores against sec-2 HPS (40/40, 80/80, 40/40) -> 100% -> Transmuted = 100
      expect(grade).toBe(100);
    });

    it('matches grades recorded under "Filipino 10" when querying official subject "Filipino"', () => {
      const classRecords: ClassRecord[] = [
        {
          id: 'cr-fil10',
          student_lrn: '100000000003',
          section_id: 'sec-10',
          subject_id: 'sub-custom-fil10',
          subject_name: 'Filipino 10',
          quarter: 1,
          school_year: '2026-2027',
          final_grade: 92
        }
      ] as unknown as ClassRecord[];

      const standardSubjects: Subject[] = [
        {
          id: 'sub-std-fil',
          subject_name: 'Filipino',
          grade_level: 'Grade 10'
        }
      ] as unknown as Subject[];

      const grade = resolveStudentQuarterGrade(
        '100000000003',
        'sub-std-fil',
        1,
        '2026-2027',
        classRecords,
        [],
        [],
        'Grade 10',
        undefined,
        standardSubjects,
        'sec-10'
      );
      expect(grade).toBe(92);
    });

    it('matches Grade 8 Science client data: Abiera Angelo (80), Calisa Jade (72), Cubil Hance (84)', () => {
      const scienceSubj: Subject = {
        id: 'subj-science-g8',
        subject_name: 'Science',
        grade_level: 'Grade 8'
      } as unknown as Subject;

      const hpsRec: HPSRecord = {
        id: 'hps_science_emerald_q1',
        subject_id: 'subj-science-g8',
        subject_name: 'Science',
        section_id: 'Emerald', // Note: section name stored on HPS
        quarter: 1,
        school_year: '2026-2027',
        written_works: [50, 20, 129, '', ''],
        performance_tasks: [50, 10, '', ''],
        summative_tests: [25, 25, ''],
        quarterly_exam: ''
      } as unknown as HPSRecord;

      const classRecords: ClassRecord[] = [
        // 1. Abiera, Angelo
        {
          id: 'cr-abiera',
          student_lrn: '132866180001',
          section_id: 'sec-emerald-uuid', // Note: section UUID stored on class record
          subject_id: 'subj-science-g8',
          subject_name: 'Science',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [22, 20, 74, '', ''],
          performance_tasks: [40, 10, '', ''],
          summative_tests: [15, 23, '']
        },
        // 2. Calisa, Jade
        {
          id: 'cr-calisa',
          student_lrn: '132866180002',
          section_id: 'sec-emerald-uuid',
          subject_id: 'subj-science-g8',
          subject_name: 'Science',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [6, '', 36, '', ''],
          performance_tasks: [40, '', '', ''],
          summative_tests: [13, 21, '']
        },
        // 3. Cubil, Hance Owen
        {
          id: 'cr-cubil',
          student_lrn: '132866180004',
          section_id: 'sec-emerald-uuid',
          subject_id: 'subj-science-g8',
          subject_name: 'Science',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [33, 20, 81, '', ''],
          performance_tasks: [40, 10, '', ''],
          summative_tests: [19, 25, '']
        }
      ] as unknown as ClassRecord[];

      // Query as SF10 or Consolidated Grades does:
      const abieraGrade = resolveStudentQuarterGrade(
        '132866180001',
        'subj-science-g8',
        1,
        '2026-2027',
        classRecords,
        [],
        [hpsRec],
        'Grade 8',
        undefined,
        [scienceSubj],
        'sec-emerald-uuid'
      );
      expect(abieraGrade).toBe(80); // Exact match with E-Class Record 80

      const calisaGrade = resolveStudentQuarterGrade(
        '132866180002',
        'subj-science-g8',
        1,
        '2026-2027',
        classRecords,
        [],
        [hpsRec],
        'Grade 8',
        undefined,
        [scienceSubj],
        'sec-emerald-uuid'
      );
      expect(calisaGrade).toBe(72); // Exact match with E-Class Record 72

      const cubilGrade = resolveStudentQuarterGrade(
        '132866180004',
        'subj-science-g8',
        1,
        '2026-2027',
        classRecords,
        [],
        [hpsRec],
        'Grade 8',
        undefined,
        [scienceSubj],
        'sec-emerald-uuid'
      );
      expect(cubilGrade).toBe(84); // Exact match with E-Class Record 84
    });

    it('preserves and aliases Research 1 and Research 2 in normalizeSubjectName without collision', () => {
      expect(normalizeSubjectName('Research 1')).toBe('practicalresearch1');
      expect(normalizeSubjectName('Research 2')).toBe('practicalresearch2');
      expect(normalizeSubjectName('Research I')).toBe('practicalresearch1');
      expect(normalizeSubjectName('Research II')).toBe('practicalresearch2');
      expect(normalizeSubjectName('Practical Research 1')).toBe('practicalresearch1');
      expect(normalizeSubjectName('Practical Research 2')).toBe('practicalresearch2');
      expect(normalizeSubjectName('General Biology 1')).toBe('generalbiology1');
      expect(normalizeSubjectName('General Biology 2')).toBe('generalbiology2');
      expect(normalizeSubjectName('Filipino 10')).toBe('filipino');
    });

    it('filterSubjectsForSection synthesizes and includes custom typed subjects like "Research 2"', () => {
      const mockUser: User = { uid: 'teacher-1', email: 'teacher@school.ph', role: 'teacher' } as User;
      const g12Section: Section = {
        id: 'sec-g12-louis-pasteur',
        section_name: 'LOUIS PASTEUR',
        section_grade_level: 'Grade 12',
        adviser_id: 'teacher-1',
        is_teaching_load: true,
        taught_subjects: ['Research 2']
      };

      const result = filterSubjectsForSection(mockUser, g12Section, []);
      expect(result.length).toBe(1);
      expect(result[0].subject_name).toBe('Research 2');
      expect(result[0].term).toBe('all');
      expect(result[0].grade_level).toBe('Grade 12');
    });

    it('resolveStudentQuarterGrade computes grades for custom typed "Research 2" subject', () => {
      const researchRecord: ClassRecord = {
        id: 'cr-research-1',
        student_lrn: '123456789012',
        subject_id: 'custom_sec_research2',
        subject_name: 'Research 2',
        quarter: 1,
        school_year: '2026-2027',
        section_id: 'sec-g12-pasteur',
        written_works: [20, 20],
        performance_tasks: [40, 40],
        quarterly_exam: 50
      };

      const researchHps: HPSRecord = {
        id: 'hps-research-1',
        subject_id: 'custom_sec_research2',
        subject_name: 'Research 2',
        quarter: 1,
        school_year: '2026-2027',
        section_id: 'sec-g12-pasteur',
        written_works: [20, 20],
        performance_tasks: [40, 40],
        quarterly_exam: 50
      };

      const customSubj: Subject = {
        id: 'custom_sec_research2',
        subject_name: 'Research 2',
        grade_level: 'Grade 12',
        term: 'all'
      };

      const grade = resolveStudentQuarterGrade(
        '123456789012',
        'custom_sec_research2',
        1,
        '2026-2027',
        [researchRecord],
        [],
        [researchHps],
        'Grade 12',
        'TVL',
        [customSubj],
        'sec-g12-pasteur'
      );

      expect(grade).toBe(100);
    });
  });
});
