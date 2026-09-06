import { describe, it, expect } from 'vitest';
import { getShsSubjectUnitInfo, getCurriculumTemplatesForSection, SSHS_ACADEMIC_CLUSTERS, SSHS_TECHPRO_CLUSTERS, STANDARD_SUBJECTS, SPECIAL_SUBJECTS } from './curriculum';
import { isThreeTermSchoolYear } from './terms';
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

describe('DepEd School Calendar Term System (3 Terms vs 4 Quarters)', () => {
  it('identifies SY 2026-2027 onwards as 3-Term system', () => {
    expect(isThreeTermSchoolYear('2026-2027')).toBe(true);
    expect(isThreeTermSchoolYear('2027-2028')).toBe(true);
    expect(isThreeTermSchoolYear('2030-2031')).toBe(true);
    expect(isThreeTermSchoolYear()).toBe(true); // default to current
  });

  it('identifies SY 2025-2026 and prior historical years as 4-Quarter system', () => {
    expect(isThreeTermSchoolYear('2025-2026')).toBe(false);
    expect(isThreeTermSchoolYear('2024-2025')).toBe(false);
    expect(isThreeTermSchoolYear('2023-2024')).toBe(false);
    expect(isThreeTermSchoolYear('2020-2021')).toBe(false);
  });
});

describe('Special Curricular Programs (Grade 1 - 10)', () => {
  it('generates STE program subjects for Grade 7', () => {
    const templates = getCurriculumTemplatesForSection('Grade 7', 'STE');
    const steOnly = templates.filter(t => t.isSpecialProgram);
    expect(steOnly.length).toBeGreaterThanOrEqual(2);
    const names = steOnly.map(t => t.name);
    expect(names.some(n => n.includes('Research') || n.includes('Scientific'))).toBe(true);
    expect(names.some(n => n.includes('Environmental'))).toBe(true);
    expect(steOnly.every(t => t.isSpecialProgram === true)).toBe(true);
  });

  it('generates SPA program subjects with selected disciplines/majors', () => {
    const templates = getCurriculumTemplatesForSection('Grade 7', 'SPA', ['Visual Arts', 'Dance']);
    const names = templates.map(t => t.name);
    expect(names.some(n => n.includes('Visual Arts'))).toBe(true);
    expect(names.some(n => n.includes('Dance'))).toBe(true);
    expect(names.some(n => n.includes('Theater Arts'))).toBe(false);
  });

  it('generates SPJ program subjects for Grade 8', () => {
    const templates = getCurriculumTemplatesForSection('Grade 8', 'SPJ');
    const names = templates.map(t => t.name);
    expect(names.some(n => n.includes('Journalism'))).toBe(true);
  });

  it('generates SPS program subjects for Grade 9', () => {
    const templates = getCurriculumTemplatesForSection('Grade 9', 'SPS');
    const names = templates.map(t => t.name);
    expect(names.some(n => n.includes('Sports'))).toBe(true);
  });

  it('generates ALIVE program subjects for elementary (K-6) with countsInGeneralAverage = false and excludes from JHS (G7-10)', () => {
    const elementaryTemplates = getCurriculumTemplatesForSection('Grade 4', 'ALIVE');
    const aliveOnly = elementaryTemplates.filter(t => t.program === 'ALIVE');
    expect(aliveOnly.length).toBe(2);
    aliveOnly.forEach(t => {
      expect(t.countsInGeneralAverage).toBe(false);
    });

    const jhsTemplates = getCurriculumTemplatesForSection('Grade 7', 'ALIVE');
    const jhsAlive = jhsTemplates.filter(t => t.program === 'ALIVE');
    expect(jhsAlive.length).toBe(0);
  });

  it('generates SSES program subjects for elementary science', () => {
    const templates = getCurriculumTemplatesForSection('Grade 3', 'SSES');
    const ssesOnly = templates.filter(t => t.program === 'SSES');
    expect(ssesOnly.length).toBeGreaterThan(0);
    expect(ssesOnly.some(t => t.name.includes('Science'))).toBe(true);
  });

  it('strictly excludes ALIVE subjects from standard curriculum across all grades and from JHS special offerings', () => {
    // Check all grades in STANDARD_SUBJECTS: no Arabic or Islamic
    Object.entries(STANDARD_SUBJECTS).forEach(([, subjects]) => {
      const names = subjects.map(s => s.name.toLowerCase());
      expect(names.some(n => n.includes('arabic'))).toBe(false);
      expect(names.some(n => n.includes('islamic'))).toBe(false);
    });

    // Check Grade 7-10 in SPECIAL_SUBJECTS: no Arabic or Islamic
    ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].forEach(grade => {
      const specialList = SPECIAL_SUBJECTS[grade] || [];
      const names = specialList.map(s => s.name.toLowerCase());
      expect(names.some(n => n.includes('arabic'))).toBe(false);
      expect(names.some(n => n.includes('islamic'))).toBe(false);
    });
  });
});
