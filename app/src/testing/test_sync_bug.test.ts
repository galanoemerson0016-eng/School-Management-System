import { describe, it, expect } from 'vitest';
import { resolveStudentQuarterGrade, cleanSubjectQuery, isMatchingSubject, isSameSubject } from '../utils/grading-helpers';
import type { ClassRecord } from '../types';

describe('Grade Sync Bug Fix — Opaque indexed IDs must NOT cross-match', () => {

  it('cleanSubjectQuery returns empty for opaque indexed IDs', () => {
    expect(cleanSubjectQuery('subj-sec-g5-rizal-1')).toBe('');
    expect(cleanSubjectQuery('subj-sec-g5-rizal-6')).toBe('');
    expect(cleanSubjectQuery('subj-sec-g5-rizal-10')).toBe('');
    // Non-opaque IDs should still work
    expect(cleanSubjectQuery('virtual-filipino-sec-g5-rizal')).not.toBe('');
    expect(cleanSubjectQuery('Filipino')).toBe('Filipino');
    expect(cleanSubjectQuery('subject-grade5-filipino')).toBe('subject-grade5-filipino');
  });

  it('isMatchingSubject returns FALSE for different opaque indexed IDs', () => {
    expect(isMatchingSubject('subj-sec-g5-rizal-1', 'subj-sec-g5-rizal-6', 'Araling Panlipunan (AP)')).toBe(false);
    expect(isMatchingSubject('subj-sec-g5-rizal-3', 'subj-sec-g5-rizal-6', 'Araling Panlipunan (AP)')).toBe(false);
  });

  it('isMatchingSubject returns TRUE for same opaque indexed ID', () => {
    expect(isMatchingSubject('subj-sec-g5-rizal-6', 'subj-sec-g5-rizal-6', 'Araling Panlipunan (AP)')).toBe(true);
  });

  it('isSameSubject returns FALSE for different opaque indexed IDs without names', () => {
    expect(isSameSubject('subj-sec-g5-rizal-1', '', 'subj-sec-g5-rizal-6', 'Araling Panlipunan (AP)')).toBe(false);
  });

  it('isMatchingSubject still works with subject names (non-opaque)', () => {
    // Name-based queries should still match correctly
    expect(isMatchingSubject('Filipino', 'subj-sec-g5-rizal-1', 'Filipino')).toBe(true);
    expect(isMatchingSubject('Araling Panlipunan (AP)', 'subj-sec-g5-rizal-6', 'Araling Panlipunan (AP)')).toBe(true);
    expect(isMatchingSubject('Filipino', 'subj-sec-g5-rizal-6', 'Araling Panlipunan (AP)')).toBe(false);
  });

  it('isMatchingSubject still works with virtual IDs', () => {
    expect(isMatchingSubject('virtual-aralingpanlipunanap-sec-g5-rizal', 'subj-sec-g5-rizal-6', 'Araling Panlipunan (AP)')).toBe(true);
    expect(isMatchingSubject('virtual-filipino-sec-g5-rizal', 'subj-sec-g5-rizal-6', 'Araling Panlipunan (AP)')).toBe(false);
  });

  it('resolveStudentQuarterGrade: opaque IDs only match their own classRecord', () => {
    const apClassRecord: ClassRecord = {
      id: 'grade_100501202601_subj-sec-g5-rizal-6_Q1',
      student_lrn: '100501202601',
      subject_id: 'subj-sec-g5-rizal-6',
      subject_name: 'Araling Panlipunan (AP)',
      section_id: 'sec-g5-rizal',
      quarter: 1,
      school_year: '2026-2027',
      final_grade: 88,
      written_works: [20, 20],
      performance_tasks: [40, 40],
      quarterly_exam: 40
    };

    const subjects = [
      { id: 'subj-sec-g5-rizal-1', name: 'Filipino' },
      { id: 'subj-sec-g5-rizal-2', name: 'English' },
      { id: 'subj-sec-g5-rizal-3', name: 'Mathematics' },
      { id: 'subj-sec-g5-rizal-4', name: 'Science' },
      { id: 'subj-sec-g5-rizal-5', name: 'GMRC (Good Manners and Right Conduct)' },
      { id: 'subj-sec-g5-rizal-6', name: 'Araling Panlipunan (AP)' },
      { id: 'subj-sec-g5-rizal-7', name: 'E.P.P.' },
    ];

    subjects.forEach(s => {
      const g = resolveStudentQuarterGrade(
        '100501202601',
        s.id,
        1,
        '2026-2027',
        [apClassRecord],
        [],
        [],
        'Grade 5',
        'Academic Track'
      );
      if (s.name === 'Araling Panlipunan (AP)') {
        expect(g).toBe(88);
      } else {
        expect(g).toBe(0);
      }
    });
  });

  it('resolveStudentQuarterGrade: subject names match correctly (sync flow fix)', () => {
    const apClassRecord: ClassRecord = {
      id: 'grade_100501202601_subj-sec-g5-rizal-6_Q1',
      student_lrn: '100501202601',
      subject_id: 'subj-sec-g5-rizal-6',
      subject_name: 'Araling Panlipunan (AP)',
      section_id: 'sec-g5-rizal',
      quarter: 1,
      school_year: '2026-2027',
      final_grade: 88,
      written_works: [20, 20],
      performance_tasks: [40, 40],
      quarterly_exam: 40
    };

    const filipinoClassRecord: ClassRecord = {
      id: 'grade_100501202601_subj-sec-g5-rizal-1_Q1',
      student_lrn: '100501202601',
      subject_id: 'subj-sec-g5-rizal-1',
      subject_name: 'Filipino',
      section_id: 'sec-g5-rizal',
      quarter: 1,
      school_year: '2026-2027',
      final_grade: 92,
      written_works: [25, 25],
      performance_tasks: [45, 45],
      quarterly_exam: 50
    };

    // Simulating the handleSyncFromEClass fix: pass subject_name instead of opaque ID
    const apGrade = resolveStudentQuarterGrade(
      '100501202601',
      'Araling Panlipunan (AP)',  // subject_name, not opaque ID
      1,
      '2026-2027',
      [apClassRecord, filipinoClassRecord],
      [],
      [],
      'Grade 5',
      'Academic Track'
    );
    expect(apGrade).toBe(88);

    const filipinoGrade = resolveStudentQuarterGrade(
      '100501202601',
      'Filipino',  // subject_name, not opaque ID
      1,
      '2026-2027',
      [apClassRecord, filipinoClassRecord],
      [],
      [],
      'Grade 5',
      'Academic Track'
    );
    expect(filipinoGrade).toBe(92);

    // Subject with no classRecord should return 0
    const englishGrade = resolveStudentQuarterGrade(
      '100501202601',
      'English',
      1,
      '2026-2027',
      [apClassRecord, filipinoClassRecord],
      [],
      [],
      'Grade 5',
      'Academic Track'
    );
    expect(englishGrade).toBe(0);
  });
});
