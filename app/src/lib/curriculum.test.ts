import { describe, it, expect } from 'vitest';
import { getShsSubjectUnitInfo, SSHS_ACADEMIC_CLUSTERS, SSHS_TECHPRO_CLUSTERS } from './curriculum';
import { mapStudentToShsSf9Data } from '../utils/shsSf9Mapper';
import type { Student, SchoolProfile, Section, Subject, ClassRecord } from '../types';

describe('DepEd Order No. 017, s. 2026 - Unit Weights & Clusters', () => {
  it('correctly provides unit weights for Grade 11 Core subjects (2 units/term, 6 units/yr)', () => {
    const cores = [
      'General Mathematics',
      'General Science',
      'Effective Communication',
      'Mabisang Komunikasyon',
      'Life and Career Skills',
      'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
    ];

    cores.forEach(subj => {
      const info = getShsSubjectUnitInfo(subj, 'Grade 11');
      expect(info.category).toBe('core');
      expect(info.unitsPerTerm).toBe(2);
      expect(info.yearUnits).toBe(6);
    });
  });

  it('correctly provides unit weights for Grade 11 80-hour Academic Electives (3 units/term, 3 units/yr)', () => {
    const academicElectives = [
      'Philippine Politics and Governance',
      'General Biology 1',
      'Business Mathematics',
      'Creative Writing'
    ];

    academicElectives.forEach(subj => {
      const info = getShsSubjectUnitInfo(subj, 'Grade 11');
      expect(info.category).toBe('academic_elective');
      expect(info.unitsPerTerm).toBe(3);
      expect(info.yearUnits).toBe(3);
    });
  });

  it('correctly provides unit weights for Grade 11 320-hour Tech-Pro Electives (4 units/term, 12 units/yr)', () => {
    const techProElectives = [
      'Hotel Operations',
      'Beauty Care Services',
      'Carpentry',
      'Aquaculture'
    ];

    techProElectives.forEach(subj => {
      const info = getShsSubjectUnitInfo(subj, 'Grade 11');
      expect(info.category).toBe('techpro_elective');
      expect(info.unitsPerTerm).toBe(4);
      expect(info.yearUnits).toBe(12);
    });
  });

  it('contains all 5 SSHS Academic Clusters and 10 Tech-Pro Clusters', () => {
    expect(Object.keys(SSHS_ACADEMIC_CLUSTERS).length).toBe(5);
    expect(Object.keys(SSHS_TECHPRO_CLUSTERS).length).toBe(10);
  });
});

describe('mapStudentToShsSf9Data with DO 017 Annex E Unit Weighting', () => {
  const dummyStudent = {
    lrn: '123456789012',
    last_name: 'Dela Cruz',
    first_name: 'Juan',
    middle_name: 'Protacio',
    gender: 'Male',
    student_section: 'Grade 11 - Sapphire',
    track: 'Academic',
    strand: 'STEM',
    grade_level: 'Grade 11',
  } as unknown as Student;

  const dummySection = {
    id: 'sec-1',
    section_name: 'Grade 11 - Sapphire',
    section_grade_level: 'Grade 11',
    track: 'Academic',
    strand: 'STEM',
    school_year: '2026-2027',
  } as unknown as Section;

  const dummyProfile = {
    name: 'FormEase Integrated High School',
    school_id: '300123',
    division: 'City Schools Division',
    region: 'Region IV-A',
    district: 'West District',
    head_name: 'Principal Name',
    head_position: 'Principal IV',
    grade_levels_offered: ['Grade 11'],
  } as unknown as SchoolProfile;

  const dummySubjects = [
    { id: 'subj-1', subject_name: 'General Mathematics', grade_level: 'Grade 11', term: 'all' },
    { id: 'subj-2', subject_name: 'General Science', grade_level: 'Grade 11', term: 'all' },
    { id: 'subj-3', subject_name: 'Philippine Politics and Governance', grade_level: 'Grade 11', term: 1 },
  ] as unknown as Subject[];

  const dummyRecords = [
    // General Math: 90 across all terms
    { id: 'r-1', student_lrn: '123456789012', subject_id: 'subj-1', section_id: 'sec-1', quarter: 1, school_year: '2026-2027', final_grade: 90, written_works: [], performance_tasks: [], quarterly_exam: 0 },
    { id: 'r-2', student_lrn: '123456789012', subject_id: 'subj-1', section_id: 'sec-1', quarter: 2, school_year: '2026-2027', final_grade: 90, written_works: [], performance_tasks: [], quarterly_exam: 0 },
    { id: 'r-3', student_lrn: '123456789012', subject_id: 'subj-1', section_id: 'sec-1', quarter: 3, school_year: '2026-2027', final_grade: 90, written_works: [], performance_tasks: [], quarterly_exam: 0 },
    // General Science: 80 across all terms
    { id: 'r-4', student_lrn: '123456789012', subject_id: 'subj-2', section_id: 'sec-1', quarter: 1, school_year: '2026-2027', final_grade: 80, written_works: [], performance_tasks: [], quarterly_exam: 0 },
    { id: 'r-5', student_lrn: '123456789012', subject_id: 'subj-2', section_id: 'sec-1', quarter: 2, school_year: '2026-2027', final_grade: 80, written_works: [], performance_tasks: [], quarterly_exam: 0 },
    { id: 'r-6', student_lrn: '123456789012', subject_id: 'subj-2', section_id: 'sec-1', quarter: 3, school_year: '2026-2027', final_grade: 80, written_works: [], performance_tasks: [], quarterly_exam: 0 },
    // PPG (Term 1 elective, 3 units): 85 in Term 1
    { id: 'r-7', student_lrn: '123456789012', subject_id: 'subj-3', section_id: 'sec-1', quarter: 1, school_year: '2026-2027', final_grade: 85, written_works: [], performance_tasks: [], quarterly_exam: 0 },
  ] as unknown as ClassRecord[];

  it('correctly maps student info, track inheritance, and unit-weighted averages', () => {
    const result = mapStudentToShsSf9Data({
      student: dummyStudent,
      profile: dummyProfile,
      schoolYear: '2026-2027',
      sectionObj: dummySection,
      subjects: dummySubjects,
      gradingSheetRecords: dummyRecords,
    });

    expect(result.student.track).toBe('Academic');
    expect(result.student.strand).toContain('Science, Technology, Engineering, and Mathematics');

    // Term 1 Units: Gen Math (2u) * 90 + Gen Sci (2u) * 80 + PPG (3u) * 85 = 180 + 160 + 255 = 595.
    // Total T1 Units = 2 + 2 + 3 = 7 units.
    // T1 Average = 595 / 7 = 85.00 -> 85
    expect(result.generalAverage.t1).toBe(85);

    // Final Year Units: Gen Math (6u) * 90 + Gen Sci (6u) * 80 + PPG (3u) * 85 = 540 + 480 + 255 = 1275.
    // Total Year Units = 6 + 6 + 3 = 15 units.
    // GWA = 1275 / 15 = 85.00 -> 85
    expect(result.generalAverage.final).toBe(85);
  });
});
