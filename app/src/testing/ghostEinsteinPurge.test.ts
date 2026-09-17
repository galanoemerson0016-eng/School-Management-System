import { describe, it, expect, vi } from 'vitest';
import {
  GHOST_EINSTEIN_LRNS,
  isGhostEinsteinSection,
  isGhostEinsteinStudent,
  purgeGhostEinsteinData,
} from '../utils/ghost-data-purge';
import type { Section, Student, ClassRecord, SF2Sheet } from '../types';

describe('Ghost Einstein Purge Utility', () => {
  it('contains the 32 historical Einstein mock LRNs including Melissa Joy Castro', () => {
    expect(GHOST_EINSTEIN_LRNS.has('126844180044')).toBe(true); // Melissa Joy Castro
    expect(GHOST_EINSTEIN_LRNS.has('104528180011')).toBe(true);
    expect(GHOST_EINSTEIN_LRNS.size).toBeGreaterThanOrEqual(32);
  });

  describe('isGhostEinsteinSection', () => {
    it('identifies ghost section by id section_1777547467815', () => {
      expect(isGhostEinsteinSection({ id: 'section_1777547467815', section_name: 'Custom' })).toBe(true);
    });

    it('identifies ghost section by name Einstein (case-insensitive)', () => {
      expect(isGhostEinsteinSection({ id: 'sec-1', section_name: 'Einstein' })).toBe(true);
      expect(isGhostEinsteinSection({ id: 'sec-2', section_name: 'einstein' })).toBe(true);
      expect(isGhostEinsteinSection({ id: 'sec-3', section_name: ' EINSTEIN ' })).toBe(true);
    });

    it('identifies Grade 7 Einstein sections', () => {
      expect(
        isGhostEinsteinSection({
          id: 'sec-ghost-g7',
          section_name: 'Grade 7 - Einstein',
          section_grade_level: 'Grade 7',
        })
      ).toBe(true);
    });

    it('does NOT misclassify SHS STEM Einstein sections', () => {
      expect(
        isGhostEinsteinSection({
          id: 'sec-g12-stem-einstein',
          section_name: 'STEM - Einstein',
          section_grade_level: 'Grade 12',
        })
      ).toBe(false);
      expect(
        isGhostEinsteinSection({
          id: 'sec-g11-stem-einstein',
          section_name: 'Grade 11 - STEM Einstein',
          section_grade_level: 'Grade 11',
        })
      ).toBe(false);
    });

    it('does NOT misclassify other normal sections', () => {
      expect(isGhostEinsteinSection({ id: 'sec-diam', section_name: 'Diamond', section_grade_level: 'Grade 7' })).toBe(false);
      expect(isGhostEinsteinSection({ id: 'sec-plato', section_name: 'Plato', section_grade_level: 'Grade 11' })).toBe(false);
    });
  });

  describe('isGhostEinsteinStudent', () => {
    it('identifies Melissa Joy Castro (LRN 126844180044) in section Einstein', () => {
      const student = {
        lrn: '126844180044',
        student_section: 'Einstein',
        grade_level: 'Grade 7',
      };
      expect(isGhostEinsteinStudent(student)).toBe(true);
    });

    it('identifies any student assigned to section Einstein or section_1777547467815', () => {
      expect(isGhostEinsteinStudent({ lrn: '999999999999', student_section: 'Einstein' })).toBe(true);
      expect(isGhostEinsteinStudent({ lrn: '888888888888', student_section: 'section_1777547467815' })).toBe(true);
      expect(isGhostEinsteinStudent({ lrn: '777777777777', student_section: ' einstein ' })).toBe(true);
    });

    it('identifies ghost LRNs when unassigned or assigned to deleted/unknown section', () => {
      const knownSections: Section[] = [
        {
          id: 'sec-diamond',
          section_name: 'Diamond',
          section_grade_level: 'Grade 7',
          adviser_name: 'Teacher Rose',
          is_advisory: true,
          track: 'Academic',
          cluster: 'Core',
          adviser_id: 't-1',
        },
      ];

      // Melissa Joy Castro with no section or deleted section
      expect(isGhostEinsteinStudent({ lrn: '126844180044', student_section: '' }, knownSections)).toBe(true);
      expect(isGhostEinsteinStudent({ lrn: '126844180044', student_section: 'NonExistentSection' }, knownSections)).toBe(true);
    });

    it('does NOT misclassify a real student in a valid non-Einstein section', () => {
      const knownSections: Section[] = [
        {
          id: 'sec-diamond',
          section_name: 'Diamond',
          section_grade_level: 'Grade 7',
          adviser_name: 'Teacher Rose',
          is_advisory: true,
          track: 'Academic',
          cluster: 'Core',
          adviser_id: 't-1',
        },
      ];

      // A student enrolled in Diamond is NOT a ghost student
      expect(
        isGhostEinsteinStudent(
          { lrn: '123456789012', student_section: 'Diamond', grade_level: 'Grade 7' },
          knownSections
        )
      ).toBe(false);
    });
  });

  describe('purgeGhostEinsteinData', () => {
    it('unconditionally purges ghost section, ghost learners, and their associated records', async () => {
      const mockDb = {
        deleteRecord: vi.fn().mockResolvedValue(undefined),
        deleteRecordsBulk: vi.fn().mockResolvedValue(undefined),
      };

      const sections: Section[] = [
        {
          id: 'section_1777547467815',
          section_name: 'Einstein',
          section_grade_level: 'Grade 7',
          adviser_name: 'Emerson M. Galano',
          is_advisory: true,
          track: 'Academic',
          cluster: 'Core',
          adviser_id: 't-1',
        },
        {
          id: 'sec-diamond',
          section_name: 'Diamond',
          section_grade_level: 'Grade 7',
          adviser_name: 'Teacher Sarah',
          is_advisory: true,
          track: 'Academic',
          cluster: 'Core',
          adviser_id: 't-2',
        },
      ];

      const students: Student[] = [
        {
          lrn: '126844180044',
          first_name: 'MELISSA JOY',
          last_name: 'CASTRO',
          gender: 'Female',
          birthday: '2012-01-12',
          age: 13,
          address: 'Tarlac',
          grade_level: 'Grade 7',
          student_section: 'Einstein',
        },
        {
          lrn: '104528180011',
          first_name: 'MARK',
          last_name: 'RAMOS',
          gender: 'Male',
          birthday: '2012-05-05',
          age: 13,
          address: 'Tarlac',
          grade_level: 'Grade 7',
          student_section: 'Einstein',
        },
        {
          lrn: '111122223333',
          first_name: 'JUAN',
          last_name: 'DELA CRUZ',
          gender: 'Male',
          birthday: '2012-03-10',
          age: 13,
          address: 'Manila',
          grade_level: 'Grade 7',
          student_section: 'Diamond',
        },
      ];

      const classRecords: ClassRecord[] = [
        {
          id: 'cr-ghost-1',
          student_lrn: '126844180044',
          subject_id: 'sub-math',
          section_id: 'section_1777547467815',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [80],
          performance_tasks: [80],
          quarterly_exam: 80,
          final_grade: 85,
        },
        {
          id: 'cr-real-1',
          student_lrn: '111122223333',
          subject_id: 'sub-math',
          section_id: 'sec-diamond',
          quarter: 1,
          school_year: '2026-2027',
          written_works: [90],
          performance_tasks: [90],
          quarterly_exam: 90,
          final_grade: 92,
        },
      ];

      const sf2Sheets: SF2Sheet[] = [
        {
          id: 'section_1777547467815_2026-2027_OCTOBER',
          section_id: 'section_1777547467815',
          month: 'OCTOBER',
          school_year: '2026-2027',
          date_labels: {},
          attendance: {},
          remarks: {},
          updated_at: '2026-10-01',
        },
        {
          id: 'sec-diamond_2026-2027_OCTOBER',
          section_id: 'sec-diamond',
          month: 'OCTOBER',
          school_year: '2026-2027',
          date_labels: {},
          attendance: {},
          remarks: {},
          updated_at: '2026-10-01',
        },
      ];

      const result = await purgeGhostEinsteinData(mockDb, {
        sections,
        students,
        classRecords,
        sf2Sheets,
      });

      // Verification: Einstein section is removed, Diamond is preserved
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].section_name).toBe('Diamond');

      // Verification: Ghost students are removed, Juan Dela Cruz is preserved
      expect(result.students).toHaveLength(1);
      expect(result.students[0].lrn).toBe('111122223333');
      expect(result.purgedStudentCount).toBe(2);

      // Verification: Ghost class record removed, real student class record preserved
      expect(result.classRecords).toHaveLength(1);
      expect(result.classRecords[0].id).toBe('cr-real-1');

      // Verification: Ghost SF2 sheet removed, Diamond SF2 sheet preserved
      expect(result.sf2Sheets).toHaveLength(1);
      expect(result.sf2Sheets[0].section_id).toBe('sec-diamond');

      // Verification: Database deletion calls were executed
      expect(mockDb.deleteRecordsBulk).toHaveBeenCalledWith('sections', expect.arrayContaining(['section_1777547467815']));
      expect(mockDb.deleteRecordsBulk).toHaveBeenCalledWith('students', expect.arrayContaining(['126844180044', '104528180011']));
    });
  });
});
