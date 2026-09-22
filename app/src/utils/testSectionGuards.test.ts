import { describe, expect, it } from 'vitest';
import { isTestClassRecord, isTestSection, isTestStudent, isTestSubject } from './testSectionGuards';

describe('test section guards', () => {
  it('requires the explicit internal marker and never infers test data from user values', () => {
    expect(isTestSection({ id: 'test-sec-1', section_name: '[TEST] Einstein', section_grade_level: 'Grade 7' })).toBe(false);
    expect(isTestStudent({
      lrn: '999900000001', first_name: '[TEST] ADA', last_name: 'LOVELACE', gender: 'Female',
      birthday: '2012-01-01', age: 14, address: 'Example', student_section: 'test-sec-1', grade_level: 'Grade 7',
    })).toBe(false);
    expect(isTestSubject({ id: 'test-subj-1', subject_name: '[TEST] Mathematics', grade_level: 'Grade 7' })).toBe(false);
    expect(isTestClassRecord({
      id: 'test-cr-1', student_lrn: '999900000001', section_id: 'test-sec-1', subject_id: 'test-subj-1',
      school_year: '2026-2027', quarter: 1, written_works: [], performance_tasks: [], quarterly_exam: 0,
    })).toBe(false);
  });

  it('recognizes the explicit developer marker', () => {
    expect(isTestSection({ id: 'section-1', section_name: 'Example', section_grade_level: 'Grade 7', is_test_data: true })).toBe(true);
  });
});
