import { describe, expect, it, vi } from 'vitest';
import {
  LEGACY_DEMO_SECTION_ID,
  isGhostEinsteinSection,
  isGhostEinsteinStudent,
  purgeGhostEinsteinData,
} from '../utils/ghost-data-purge';
import type { ClassRecord, Section, Student } from '../types';

describe('legacy demo-data diagnostics', () => {
  it('recognizes only the exact historical demo identifier', () => {
    expect(isGhostEinsteinSection({ id: LEGACY_DEMO_SECTION_ID })).toBe(true);
    expect(isGhostEinsteinSection({ id: 'section-real-einstein', section_name: 'Einstein' })).toBe(false);
    expect(isGhostEinsteinStudent({ student_section: LEGACY_DEMO_SECTION_ID })).toBe(true);
    expect(isGhostEinsteinStudent({ student_section: 'Einstein' })).toBe(false);
  });

  it('preserves legacy-looking sections, learners, and grades without database deletion', async () => {
    const db = { deleteRecord: vi.fn(), deleteRecordsBulk: vi.fn() };
    const sections: Section[] = [{ id: 'section-real-einstein', section_name: 'Einstein', section_grade_level: 'Grade 7' }];
    const students: Student[] = [{
      lrn: '999900000001', first_name: 'ADA', last_name: 'LOVELACE', gender: 'Female',
      birthday: '2012-01-01', age: 14, address: 'Example', student_section: 'Einstein', grade_level: 'Grade 7',
    }];
    const classRecords: ClassRecord[] = [{
      id: 'record-1', student_lrn: '999900000001', section_id: 'section-real-einstein', subject_id: 'math',
      school_year: '2026-2027', quarter: 1, written_works: [20], performance_tasks: [40], quarterly_exam: 30,
    }];

    const result = await purgeGhostEinsteinData(db, { sections, students, classRecords });

    expect(result.sections).toBe(sections);
    expect(result.students).toBe(students);
    expect(result.classRecords).toBe(classRecords);
    expect(result.purgedSectionCount).toBe(0);
    expect(result.purgedStudentCount).toBe(0);
    expect(db.deleteRecord).not.toHaveBeenCalled();
    expect(db.deleteRecordsBulk).not.toHaveBeenCalled();
  });
});
