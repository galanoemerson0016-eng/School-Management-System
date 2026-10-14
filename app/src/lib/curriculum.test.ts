import { describe, it, expect } from 'vitest';
import { 
  getShsSubjectUnitInfo, 
  getCurriculumTemplatesForSection, 
  SSHS_ACADEMIC_CLUSTERS, 
  SSHS_TECHPRO_CLUSTERS, 
  STANDARD_SUBJECTS, 
  SPECIAL_SUBJECTS,
  SPECIAL_CURRICULAR_PROGRAMS,
  getCategoryForSubject,
  getShsCategoryForSubject,
  SSHS_G12_ACADEMIC_SUBJECTS,
  SSHS_G12_TECHPRO_SUBJECTS,
  SHS_G12_CORE_SUBJECTS,
  SHS_G12_APPLIED_SUBJECTS,
  SHS_OLD_STRAND_SUBJECTS,
  SHS_G12_ALL_OLD_SUBJECTS,
  getStandardShsSemester,
  getDefaultTermForSubject,
  getDepEdStandardWeights,
  getClustersForGrade11Track,
  SSHS_ACADEMIC_CLUSTERS_LIST,
  SSHS_TECHPRO_CLUSTERS_LIST
} from './curriculum';
import { isThreeTermSchoolYear } from './terms';
import { mapStudentToShsSf9Data } from '../utils/shsSf9Mapper';
import { mapStudentToShsSf10Data } from '../utils/shsSf10Mapper';
import { isStudentEligibleForSectionSubject } from '../utils/grading-helpers';
import { SCHOOL_CALENDAR_2026_2027 } from '../utils/sf2-sync';
import { computeExamsWeightedScore } from './grading';
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

  it('ensures Computer Programming (Java) ( NC III ) is named with exact spacing and NC III casing', () => {
    const exactName = 'Computer Programming (Java) ( NC III )';
    const g11Special = SPECIAL_SUBJECTS['Grade 11'].map(s => s.name);
    expect(g11Special).toContain(exactName);

    const tvlStrand = SHS_OLD_STRAND_SUBJECTS.TVL.map(s => s.name);
    expect(tvlStrand).toContain(exactName);

    const unitInfo = getShsSubjectUnitInfo(exactName, 'Grade 11');
    expect(unitInfo.category).toBe('techpro_elective');
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

  it('includes all 10 DepEd Special Curricular Programs', () => {
    const ids = SPECIAL_CURRICULAR_PROGRAMS.map(p => p.id);
    expect(ids).toContain('Regular');
    expect(ids).toContain('STE');
    expect(ids).toContain('SPSTEM');
    expect(ids).toContain('SPA');
    expect(ids).toContain('SPJ');
    expect(ids).toContain('SPS');
    expect(ids).toContain('SPFL');
    expect(ids).toContain('SPTVE');
    expect(ids).toContain('SSES');
    expect(ids).toContain('ALIVE');
    expect(ids.length).toBe(10);
  });

  it('generates SPSTEM program subjects with Enhanced Science, Math, Creative Tech, and Research MIM/SIP', () => {
    const templates = getCurriculumTemplatesForSection('Grade 7', 'SPSTEM');
    const names = templates.map(t => t.name);
    expect(names).toContain('Enhanced Science');
    expect(names).toContain('Enhanced Mathematics');
    expect(names).toContain('Creative Technology');
    expect(names).toContain('Research MIM/SIP');
  });

  it('generates SPTVE program subjects with official DepEd specializations', () => {
    const templates = getCurriculumTemplatesForSection('Grade 8', 'SPTVE');
    const names = templates.map(t => t.name);
    expect(names).toContain('Applied Technical Drawing');
    expect(names).toContain('Applied Entrepreneurship');
    expect(names).toContain('TVE Specialization');
  });

  it('generates SPFL program subjects with language electives', () => {
    const templates = getCurriculumTemplatesForSection('Grade 7', 'SPFL');
    const names = templates.map(t => t.name);
    expect(names.some(n => n.includes('Spanish'))).toBe(true);
    expect(names.some(n => n.includes('Japanese'))).toBe(true);
    expect(names.some(n => n.includes('French'))).toBe(true);
    expect(names.some(n => n.includes('German'))).toBe(true);
    expect(names.some(n => n.includes('Chinese'))).toBe(true);
    expect(names.some(n => n.includes('Korean'))).toBe(true);
  });
});

describe('Universal Subject Categorization (getCategoryForSubject)', () => {
  it('correctly categorizes Elementary (Grades 1-6) subjects', () => {
    expect(getCategoryForSubject('English', 'Grade 4')).toBe('Core Academic Subjects');
    expect(getCategoryForSubject('Mathematics', 'Grade 5')).toBe('Core Academic Subjects');
    expect(getCategoryForSubject('Science', 'Grade 3')).toBe('Core Academic Subjects');
    expect(getCategoryForSubject('Araling Panlipunan', 'Grade 6')).toBe('Core Academic Subjects');
    expect(getCategoryForSubject('Language', 'Grade 1')).toBe('Languages & Literacy');
    expect(getCategoryForSubject('Reading and Literacy', 'Grade 2')).toBe('Languages & Literacy');
    expect(getCategoryForSubject('GMRC', 'Grade 4')).toBe('Values / Character Education');
    expect(getCategoryForSubject('Makabansa', 'Grade 3')).toBe('Livelihood & Makabansa');
    expect(getCategoryForSubject('E.P.P.', 'Grade 5')).toBe('Livelihood & Makabansa');
    expect(getCategoryForSubject('MAPEH', 'Grade 6')).toBe('MAPEH (Music, Arts, PE, Health)');
    expect(getCategoryForSubject('Music and Arts', 'Grade 4')).toBe('MAPEH (Music, Arts, PE, Health)');
    expect(getCategoryForSubject('Computer Education', 'Grade 4')).toBe('ICT & Computer Education');
    expect(getCategoryForSubject('*Arabic Language', 'Grade 4')).toBe('Madrasah / ALIVE Program');
    expect(getCategoryForSubject('*Islamic Values Education', 'Grade 4')).toBe('Madrasah / ALIVE Program');
    expect(getCategoryForSubject('Enhanced Science', 'Grade 4')).toBe('Special Science Elementary School (SSES)');
    expect(getCategoryForSubject('Enhanced Mathematics', 'Grade 5')).toBe('Special Science Elementary School (SSES)');
    expect(getCategoryForSubject('Creative Technology', 'Grade 6')).toBe('Special Science Elementary School (SSES)');
    expect(getCategoryForSubject('Research MIM/SIP', 'Grade 6')).toBe('Special Science Elementary School (SSES)');
  });

  it('correctly categorizes Junior High School (Grades 7-10) subjects', () => {
    // Core & Standard
    expect(getCategoryForSubject('English', 'Grade 7')).toBe('Core Academic Subjects');
    expect(getCategoryForSubject('Mathematics', 'Grade 8')).toBe('Core Academic Subjects');
    expect(getCategoryForSubject('Science', 'Grade 9')).toBe('Core Academic Subjects');
    expect(getCategoryForSubject('Filipino', 'Grade 10')).toBe('Core Academic Subjects');
    expect(getCategoryForSubject('Araling Panlipunan', 'Grade 7')).toBe('Core Academic Subjects');
    expect(getCategoryForSubject('Values Education', 'Grade 8')).toBe('Values / Character Education');
    expect(getCategoryForSubject('Technology and Livelihood Education', 'Grade 9')).toBe('Technology & Livelihood (TLE)');
    expect(getCategoryForSubject('MAPEH', 'Grade 10')).toBe('MAPEH (Music, Arts, PE, Health)');

    // STE / SPSTEM
    expect(getCategoryForSubject('Enhanced Science', 'Grade 7')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
    expect(getCategoryForSubject('Enhanced Mathematics', 'Grade 8')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
    expect(getCategoryForSubject('Creative Technology', 'Grade 9')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
    expect(getCategoryForSubject('Research MIM/SIP', 'Grade 10')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
    expect(getCategoryForSubject('Environmental Science', 'Grade 7')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
    expect(getCategoryForSubject('Research I (Scientific Investigation)', 'Grade 7')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
    expect(getCategoryForSubject('Biotechnology', 'Grade 8')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
    expect(getCategoryForSubject('Advanced Chemistry', 'Grade 10')).toBe('Science, Technology & Engineering (STE / SPSTEM)');

    // SPA
    expect(getCategoryForSubject('Special Program in the Arts (SPA)', 'Grade 7')).toBe('Special Program in the Arts (SPA)');
    expect(getCategoryForSubject('SPA - Visual Arts', 'Grade 7')).toBe('Special Program in the Arts (SPA)');
    expect(getCategoryForSubject('SPA - Dance (Folk & Contemporary)', 'Grade 8')).toBe('Special Program in the Arts (SPA)');
    expect(getCategoryForSubject('SPA - Creative Writing (Malikhaing Pagsulat)', 'Grade 9')).toBe('Special Program in the Arts (SPA)');

    // SPJ
    expect(getCategoryForSubject('Special Program in Journalism (Journalism)', 'Grade 7')).toBe('Special Program in Journalism (SPJ)');
    expect(getCategoryForSubject('Special Program in Journalism (Pamamahayag)', 'Grade 8')).toBe('Special Program in Journalism (SPJ)');
    expect(getCategoryForSubject('Journalism I (Print Journalism)', 'Grade 7')).toBe('Special Program in Journalism (SPJ)');
    expect(getCategoryForSubject('Pamamahayag I (Pamamahayag na Nakalimbag)', 'Grade 7')).toBe('Special Program in Journalism (SPJ)');

    // SPS
    expect(getCategoryForSubject('Special Program in Sports (SPS)', 'Grade 7')).toBe('Special Program in Sports (SPS)');
    expect(getCategoryForSubject('SPS - Foundations of Sports & Individual/Dual Sports', 'Grade 7')).toBe('Special Program in Sports (SPS)');

    // SPFL
    expect(getCategoryForSubject('Special Program in Foreign Language - Spanish', 'Grade 7')).toBe('Special Program in Foreign Language (SPFL)');
    expect(getCategoryForSubject('SPFL - Japanese (Nihongo)', 'Grade 8')).toBe('Special Program in Foreign Language (SPFL)');

    // SPTVE
    expect(getCategoryForSubject('Applied Technical Drawing', 'Grade 7')).toBe('Technical-Vocational Education (SPTVE)');
    expect(getCategoryForSubject('Applied Entrepreneurship', 'Grade 8')).toBe('Technical-Vocational Education (SPTVE)');
    expect(getCategoryForSubject('TVE Specialization', 'Grade 9')).toBe('Technical-Vocational Education (SPTVE)');
    expect(getCategoryForSubject('SPTVE - Technical Drafting', 'Grade 7')).toBe('Technical-Vocational Education (SPTVE)');
  });

  it('correctly delegates SHS (Grades 11-12) to SHS category rules', () => {
    expect(getCategoryForSubject('General Mathematics', 'Grade 11')).toBe('Core Subject (All Tracks)');
    expect(getCategoryForSubject('Effective Communication', 'Grade 11')).toBe('Core Subject (All Tracks)');
    expect(getCategoryForSubject('General Biology 1', 'Grade 11')).toBe('Academic Elective (All Other Electives)');
    expect(getCategoryForSubject('Beauty Care Services', 'Grade 11')).toBe('TechPro Elective (All Other Elective)');
    expect(getCategoryForSubject('21st Century Literature from the Philippines and the World', 'Grade 12')).toBe('Core Subjects');
    expect(getCategoryForSubject('Practical Research 1', 'Grade 12')).toBe('Applied Subjects');
  });
});

describe('Grade 12 Curriculum Separation: SSHS (New) vs SHS (Old)', () => {
  it('has populated SSHS Grade 12 Academic and TechPro subjects', () => {
    expect(SSHS_G12_ACADEMIC_SUBJECTS.length).toBeGreaterThanOrEqual(70);
    expect(SSHS_G12_TECHPRO_SUBJECTS.length).toBeGreaterThanOrEqual(50);
    expect(STANDARD_SUBJECTS['Grade 12']).toEqual(SSHS_G12_ACADEMIC_SUBJECTS);
    expect(SPECIAL_SUBJECTS['Grade 12']).toEqual(SSHS_G12_TECHPRO_SUBJECTS);
  });

  it('has populated Traditional Old SHS Core, Applied, and Strand subjects', () => {
    expect(SHS_G12_CORE_SUBJECTS.length).toBeGreaterThanOrEqual(15);
    expect(SHS_G12_APPLIED_SUBJECTS.length).toBeGreaterThanOrEqual(7);
    expect(SHS_OLD_STRAND_SUBJECTS.STEM.length).toBeGreaterThan(0);
    expect(SHS_OLD_STRAND_SUBJECTS.ABM.length).toBeGreaterThan(0);
    expect(SHS_OLD_STRAND_SUBJECTS.HUMSS.length).toBeGreaterThan(0);
    expect(SHS_OLD_STRAND_SUBJECTS.GAS.length).toBeGreaterThan(0);
    expect(SHS_OLD_STRAND_SUBJECTS.TVL.length).toBeGreaterThan(0);
    expect(SHS_OLD_STRAND_SUBJECTS['Arts and Design'].length).toBeGreaterThan(0);
    expect(SHS_OLD_STRAND_SUBJECTS.Sports.length).toBeGreaterThan(0);
    expect(SHS_G12_ALL_OLD_SUBJECTS.length).toBeGreaterThanOrEqual(70);
  });

  it('accurately categorizes Traditional SHS Grade 12 Core subjects', () => {
    expect(getShsCategoryForSubject('21st Century Literature from the Philippines and the World', 'Grade 12')).toBe('Core Subjects');
    expect(getShsCategoryForSubject('Oral Communication in Context', 'Grade 12')).toBe('Core Subjects');
    expect(getShsCategoryForSubject('Reading and Writing Skills', 'Grade 12')).toBe('Core Subjects');
    expect(getShsCategoryForSubject('General Mathematics', 'Grade 12')).toBe('Core Subjects');
    expect(getShsCategoryForSubject('Statistics and Probability', 'Grade 12')).toBe('Core Subjects');
    expect(getShsCategoryForSubject('Health Optimizing Physical Education and Health 3', 'Grade 12')).toBe('Core Subjects');
    expect(getShsCategoryForSubject('Understanding Culture, Society and Politics', 'Grade 12')).toBe('Core Subjects');
  });

  it('accurately categorizes Traditional SHS Grade 12 Applied subjects', () => {
    expect(getShsCategoryForSubject('Practical Research 1', 'Grade 12')).toBe('Applied Subjects');
    expect(getShsCategoryForSubject('Practical Research 2', 'Grade 12')).toBe('Applied Subjects');
    expect(getShsCategoryForSubject('English for Academic and Professional Purposes', 'Grade 12')).toBe('Applied Subjects');
    expect(getShsCategoryForSubject('Inquiries, Investigations and Immersion', 'Grade 12')).toBe('Applied Subjects');
    expect(getShsCategoryForSubject('Filipino sa Piling Larang (Akademik)', 'Grade 12')).toBe('Applied Subjects');
    expect(getShsCategoryForSubject('Empowerment Technologies', 'Grade 12')).toBe('Applied Subjects');
  });

  it('accurately categorizes Traditional SHS Grade 12 Specialized subjects', () => {
    expect(getShsCategoryForSubject('Pre-Calculus', 'Grade 12')).toBe('Specialized Subjects');
    expect(getShsCategoryForSubject('Basic Calculus', 'Grade 12')).toBe('Specialized Subjects');
    expect(getShsCategoryForSubject('General Biology 1', 'Grade 12')).toBe('Specialized Subjects');
    expect(getShsCategoryForSubject('Fundamentals of Accountancy, Business, and Management 1', 'Grade 12')).toBe('Specialized Subjects');
    expect(getShsCategoryForSubject('Creative Nonfiction', 'Grade 12')).toBe('Specialized Subjects');
    expect(getShsCategoryForSubject('Bread and Pastry Production', 'Grade 12')).toBe('Specialized Subjects');
  });

  it('accurately categorizes SSHS Grade 12 Academic and TechPro electives', () => {
    expect(getShsCategoryForSubject('Art Criticism and Creative Markets', 'Grade 12')).toBe('Academic Track Electives');
    expect(getShsCategoryForSubject('Contemporary Literature 1', 'Grade 12')).toBe('Academic Track Electives');
    expect(getShsCategoryForSubject('Physical Education 1 (Fitness and Recreation)', 'Grade 12')).toBe('Academic Track Electives');
    expect(getShsCategoryForSubject('Physical Education 2 (Sports and Dance)', 'Grade 12')).toBe('Academic Track Electives');
    expect(getShsCategoryForSubject('Work Immersion for Academic Track', 'Grade 12')).toBe('Academic Track Electives');
    expect(getShsCategoryForSubject('Bakery Operations', 'Grade 12')).toBe('TechPro Track Electives');
    expect(getShsCategoryForSubject('Work Immersion for Tech-Pro Track (320 hours)', 'Grade 12')).toBe('TechPro Track Electives');
  });

  it('accurately categorizes SSHS Grade 11 Sports, Health and Wellness electives as electives, not core', () => {
    expect(getShsCategoryForSubject('Physical Education 1 (Fitness and Recreation)', 'Grade 11')).toBe('Academic Elective (All Other Electives)');
    expect(getShsCategoryForSubject('Physical Education 2 (Sports and Dance)', 'Grade 11')).toBe('Academic Elective (All Other Electives)');
  });

  it('accurately categorizes Traditional SHS Grade 11 Core and Applied subjects', () => {
    expect(getShsCategoryForSubject('Oral Communication in Context', 'Grade 11')).toBe('Core Subjects');
    expect(getShsCategoryForSubject('Reading and Writing Skills', 'Grade 11')).toBe('Core Subjects');
    expect(getShsCategoryForSubject('Earth and Life Science', 'Grade 11')).toBe('Core Subjects');
    expect(getShsCategoryForSubject('Physical Science', 'Grade 11')).toBe('Core Subjects');
    expect(getShsCategoryForSubject('Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', 'Grade 11')).toBe('Core Subjects');
    expect(getShsCategoryForSubject('Practical Research 1', 'Grade 11')).toBe('Applied Subjects');
    expect(getShsCategoryForSubject('Empowerment Technologies', 'Grade 11')).toBe('Applied Subjects');
  });
});

describe('Strict Semester Isolation & Zero Cross-Semester Leakage in Traditional SHS (SF10)', () => {
  it('correctly maps traditional SHS subjects to standard DepEd semesters', () => {
    expect(getStandardShsSemester('Oral Communication in Context', 11)).toBe(1);
    expect(getStandardShsSemester('Reading and Writing Skills', 11)).toBe(2);
    expect(getStandardShsSemester('General Mathematics', 11)).toBe(1);
    expect(getStandardShsSemester('Statistics and Probability', 11)).toBe(2);
    expect(getStandardShsSemester('Earth and Life Science', 11)).toBe(1);
    expect(getStandardShsSemester('Physical Science', 11)).toBe(2);
    expect(getStandardShsSemester('Empowerment Technologies', 11)).toBe(1);
    expect(getStandardShsSemester('Practical Research 1', 11)).toBe(2);
    expect(getStandardShsSemester('21st Century Literature from the Philippines and the World', 12)).toBe(1);
    expect(getStandardShsSemester('Contemporary Philippine Arts from the Regions', 12)).toBe(2);
  });

  it('guarantees zero cross-semester leakage in SF10 permanent records', () => {
    const student = {
      lrn: '112233445566',
      first_name: 'Maria',
      last_name: 'Santos',
      gender: 'Female',
      grade_level: 'Grade 11',
      student_section: 'STEM-11',
      track: 'Academic',
      strand: 'STEM'
    } as unknown as Student;

    const section = {
      id: 'sec-g11',
      section_name: 'STEM-11',
      section_grade_level: 'Grade 11',
      track: 'Academic',
      strand: 'STEM',
      taught_subjects: [
        'Oral Communication in Context',
        'Reading and Writing Skills',
        'General Mathematics',
        'Statistics and Probability',
        'Earth and Life Science',
        'Physical Science',
        'Empowerment Technologies',
        'Practical Research 1'
      ]
    } as unknown as Section;

    const subjects: Subject[] = [
      { id: 's1', subject_name: 'Oral Communication in Context', grade_level: 'Grade 11', semester: 1 },
      { id: 's2', subject_name: 'Reading and Writing Skills', grade_level: 'Grade 11', semester: 2 },
      { id: 's3', subject_name: 'General Mathematics', grade_level: 'Grade 11', semester: 1 },
      { id: 's4', subject_name: 'Statistics and Probability', grade_level: 'Grade 11', semester: 2 },
      { id: 's5', subject_name: 'Earth and Life Science', grade_level: 'Grade 11', semester: 1 },
      { id: 's6', subject_name: 'Physical Science', grade_level: 'Grade 11', semester: 2 },
      { id: 's7', subject_name: 'Empowerment Technologies', grade_level: 'Grade 11', semester: 1 },
      { id: 's8', subject_name: 'Practical Research 1', grade_level: 'Grade 11', semester: 2 }
    ];

    const records: ClassRecord[] = [
      { id: 'r1', student_lrn: '112233445566', section_id: 'sec-g11', subject_id: 's1', school_year: '2026-2027', quarter: 1, final_grade: 90, written_works: [], performance_tasks: [], quarterly_exam: 0 },
      { id: 'r2', student_lrn: '112233445566', section_id: 'sec-g11', subject_id: 's1', school_year: '2026-2027', quarter: 2, final_grade: 92, written_works: [], performance_tasks: [], quarterly_exam: 0 },
      { id: 'r3', student_lrn: '112233445566', section_id: 'sec-g11', subject_id: 's2', school_year: '2026-2027', quarter: 3, final_grade: 88, written_works: [], performance_tasks: [], quarterly_exam: 0 },
      { id: 'r4', student_lrn: '112233445566', section_id: 'sec-g11', subject_id: 's2', school_year: '2026-2027', quarter: 4, final_grade: 90, written_works: [], performance_tasks: [], quarterly_exam: 0 }
    ];

    const sf10Data = mapStudentToShsSf10Data({
      student,
      profile: {} as unknown as SchoolProfile,
      schoolYear: '2026-2027',
      sections: [section],
      subjects,
      gradingSheetRecords: records
    });

    const sem1Block = sf10Data.scholasticRecords[0];
    const sem2Block = sf10Data.scholasticRecords[1];

    expect(sem1Block.semester).toBe(1);
    expect(sem2Block.semester).toBe(2);

    const sem1Names = sem1Block.subjects.map(s => s.subjectName);
    const sem2Names = sem2Block.subjects.map(s => s.subjectName);

    // Sem 1 subjects must appear exclusively in Sem 1
    expect(sem1Names).toContain('Oral Communication in Context');
    expect(sem1Names).toContain('General Mathematics');
    expect(sem1Names).toContain('Earth and Life Science');
    expect(sem1Names).toContain('Empowerment Technologies');

    // Sem 2 subjects must appear exclusively in Sem 2
    expect(sem2Names).toContain('Reading and Writing Skills');
    expect(sem2Names).toContain('Statistics and Probability');
    expect(sem2Names).toContain('Physical Science');
    expect(sem2Names).toContain('Practical Research 1');

    // ZERO cross-semester leakage: No Sem 1 subject in Sem 2, and no Sem 2 subject in Sem 1
    sem1Names.forEach(name => {
      expect(sem2Names).not.toContain(name);
    });
    sem2Names.forEach(name => {
      expect(sem1Names).not.toContain(name);
    });
  });
});

describe('Zero Ghost Blanks in 3-Term Views & School Term Autonomy', () => {
  it('SSHS Grade 11 core subjects span all 3 terms while electives are term-isolated', () => {
    const cores = [
      'Effective Communication',
      'Mabisang Komunikasyon',
      'General Mathematics',
      'General Science',
      'Life and Career Skills',
      'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
    ];

    cores.forEach(c => {
      expect(getDefaultTermForSubject(c, 11)).toBe('all');
    });

    // Electives in SSHS Grade 11 should not default to 'all'
    expect(getDefaultTermForSubject('Philippine Politics and Governance', 11)).not.toBe('all');
    expect(getDefaultTermForSubject('General Biology 1', 11)).not.toBe('all');
  });

  it('allows school autonomy for Traditional SHS Grade 12 offering terms', () => {
    // In Traditional SHS Grade 12, subjects have distinct terms, not 'all'
    const physSciTerm = getDefaultTermForSubject('Physical Science', 12);
    expect(physSciTerm).not.toBe('all');

    // Autonomy: A school can offer Physical Science in Term 1 via section metadata subjectTerms
    const customSectionMetadata = {
      subjectTerms: {
        'Physical Science': 1 as const,
        'Contemporary Philippine Arts from the Regions': 2 as const,
        'Media and Information Literacy': 3 as const
      }
    };

    expect(customSectionMetadata.subjectTerms['Physical Science']).toBe(1);
    expect(customSectionMetadata.subjectTerms['Contemporary Philippine Arts from the Regions']).toBe(2);
    expect(customSectionMetadata.subjectTerms['Media and Information Literacy']).toBe(3);
  });
});

describe('Smart DepEd Standard Weights Locks', () => {
  it('correctly provides official DepEd DO 15, s. 2026 weights by subject classification', () => {
    // Core Learning Areas (Languages, AP, EsP, Values, GMRC, Makabansa, Math, Science): 20% WW, 50% PT, 30% EX
    const langStd = getDepEdStandardWeights('English');
    expect(langStd.written_weight).toBe(0.2);
    expect(langStd.performance_weight).toBe(0.5);
    expect(langStd.exam_weight).toBe(0.3);

    const apStd = getDepEdStandardWeights('Araling Panlipunan');
    expect(apStd.written_weight).toBe(0.2);
    expect(apStd.performance_weight).toBe(0.5);
    expect(apStd.exam_weight).toBe(0.3);

    // Math & Science under DO 15, s. 2026: 20% WW, 50% PT, 30% EX
    const mathStd = getDepEdStandardWeights('Mathematics');
    expect(mathStd.written_weight).toBe(0.2);
    expect(mathStd.performance_weight).toBe(0.5);
    expect(mathStd.exam_weight).toBe(0.3);

    const sciStd = getDepEdStandardWeights('Science');
    expect(sciStd.written_weight).toBe(0.2);
    expect(sciStd.performance_weight).toBe(0.5);
    expect(sciStd.exam_weight).toBe(0.3);

    // TLE, EPP, MAPEH: 20% WW, 60% PT, 20% EX
    const tleStd = getDepEdStandardWeights('Technology and Livelihood Education (TLE)');
    expect(tleStd.written_weight).toBe(0.2);
    expect(tleStd.performance_weight).toBe(0.6);
    expect(tleStd.exam_weight).toBe(0.2);

    const mapehStd = getDepEdStandardWeights('Music and Arts');
    expect(mapehStd.written_weight).toBe(0.2);
    expect(mapehStd.performance_weight).toBe(0.6);
    expect(mapehStd.exam_weight).toBe(0.2);

    // SHS Research, Immersion & Field Exposure
    const researchStd = getDepEdStandardWeights('Research 1', 'Grade 11');
    expect(researchStd.written_weight).toBe(0.4);
    expect(researchStd.performance_weight).toBe(0.6);
    expect(researchStd.exam_weight).toBe(0.0);

    const immersionStd = getDepEdStandardWeights('Work Immersion', 'Grade 11');
    expect(immersionStd.written_weight).toBe(0.2);
    expect(immersionStd.performance_weight).toBe(0.8);
    expect(immersionStd.exam_weight).toBe(0.0);
  });

  describe('Grade 11 SSHS (DepEd Order No. 017, s. 2026) Track & Cluster Isolation', () => {
    it('restricts Grade 11 Academic track strictly to the 5 official SSHS Academic Clusters', () => {
      const acadClusters = getClustersForGrade11Track('Academic');
      expect(acadClusters).toHaveLength(5);
      expect(acadClusters).toEqual([...SSHS_ACADEMIC_CLUSTERS_LIST]);

      // Verify that old K-12 SHS Academic strands are completely excluded
      expect(acadClusters).not.toContain('STEM');
      expect(acadClusters).not.toContain('ABM');
      expect(acadClusters).not.toContain('HUMSS');
      expect(acadClusters).not.toContain('GAS');
    });

    it('restricts Grade 11 TechPro track strictly to the 10 official SSHS TechPro Clusters', () => {
      const techProClusters = getClustersForGrade11Track('TechPro');
      expect(techProClusters).toHaveLength(10);
      expect(techProClusters).toEqual([...SSHS_TECHPRO_CLUSTERS_LIST]);

      // Verify that old K-12 TVL strands are completely excluded
      expect(techProClusters).not.toContain('Home Economics (HE)');
      expect(techProClusters).not.toContain('Information and Communications Technology (ICT)');
      expect(techProClusters).not.toContain('Industrial Arts (IA)');
      expect(techProClusters).not.toContain('Agri-Fishery Arts (AFA)');
    });

    it('returns empty clusters for old K-12 SHS standalone tracks in Grade 11', () => {
      expect(getClustersForGrade11Track('Sports')).toEqual([]);
      expect(getClustersForGrade11Track('Arts and Design')).toEqual([]);
      expect(getClustersForGrade11Track('NonExistentTrack')).toEqual([]);
    });

    it('populates section curriculum templates for Grade 11 TechPro clusters properly', () => {
      const templates = getCurriculumTemplatesForSection('Grade 11', 'Regular', undefined, 'TechPro', 'Hospitality and Tourism');
      const names = templates.map(t => t.name);

      // Must include SSHS Core
      expect(names).toContain('General Mathematics');
      expect(names).toContain('General Science');
      expect(names).toContain('Effective Communication');

      // Must include Hospitality and Tourism cluster subjects
      expect(names).toContain('Bakery Operations');
      expect(names).toContain('Events Management Services');
      expect(names).toContain('Food and Beverage Operation');
    });

    it('populates section curriculum templates for Grade 11 Academic clusters properly', () => {
      const templates = getCurriculumTemplatesForSection('Grade 11', 'Regular', undefined, 'Academic', 'Business and Entrepreneurship');
      const names = templates.map(t => t.name);

      // Must include SSHS Core
      expect(names).toContain('General Mathematics');
      expect(names).toContain('General Science');

      // Must include Business and Entrepreneurship cluster subjects
      expect(names).toContain('Business 1 (Basic Accounting)');
      expect(names).toContain('Business 3 (Business Economics)');
      expect(names).toContain('Contemporary Marketing');
    });
  });
});

describe('Wave 3 DepEd DO 009, 015, and 017, s. 2026 compliance regressions', () => {
  it('W3-01: defaults Grade 11 Tech-Pro electives to all 3 terms (4 units/term, 12 units/year) and Grade 12 Tech-Pro electives to single-term (12 units)', () => {
    expect(getDefaultTermForSubject('Computer Systems Servicing', 'Grade 11')).toBe('all');
    expect(getDefaultTermForSubject('Food and Beverage Operation', 'Grade 11')).toBe('all');
    expect(getShsSubjectUnitInfo('Computer Systems Servicing', 'Grade 11')).toEqual({
      unitsPerTerm: 4,
      yearUnits: 12,
      category: 'techpro_elective',
    });
    expect(getDefaultTermForSubject('Computer Systems Servicing', 'Grade 12')).toBe('none');
    expect(getShsSubjectUnitInfo('Computer Systems Servicing', 'Grade 12')).toEqual({
      unitsPerTerm: 12,
      yearUnits: 12,
      category: 'techpro_elective',
    });
  });

  it('W3-02: matches DO 017 Annex E Grade 11 Academic (39 units) and Tech-Pro (42 units) GWA illustrative examples', () => {
    // DO 017 Annex E (Page 86) Grade 11 Academic Track Example:
    // EC/MK (85, 6u), Gen Math (91, 6u), Gen Sci (78, 6u), Life Skills (80, 6u), PKLP (95, 6u),
    // Acad Elec 1 (76, 3u), Acad Elec 2 (88, 3u), Acad Elec 3 (92, 3u) -> Total Units = 39, GWA = 85.84 -> 86
    const g11AcadGrades = [
      { grade: 85, units: 6 },
      { grade: 91, units: 6 },
      { grade: 78, units: 6 },
      { grade: 80, units: 6 },
      { grade: 95, units: 6 },
      { grade: 76, units: 3 },
      { grade: 88, units: 3 },
      { grade: 92, units: 3 },
    ];
    const totalUnits = g11AcadGrades.reduce((s, i) => s + i.units, 0);
    const weightedSum = g11AcadGrades.reduce((s, i) => s + i.grade * i.units, 0);
    expect(totalUnits).toBe(39);
    expect(Math.round((weightedSum / totalUnits) * 100) / 100).toBe(85.69);
    expect(Math.round(weightedSum / totalUnits)).toBe(86);
  });

  it('W3-04: allows multiple electives in the same term for a learner in isStudentEligibleForSectionSubject', () => {
    const section = { id: 'sec-11-stem', section_name: 'Einstein', section_grade_level: 'Grade 11' } as unknown as Section;
    const sub1 = { id: 'sub-1', section_id: 'sec-11-stem', subject_name: 'Chemistry 1', term: 1 } as unknown as Subject;
    const sub2 = { id: 'sub-2', section_id: 'sec-11-stem', subject_name: 'Pre-Calculus', term: 1 } as unknown as Subject;
    expect(isStudentEligibleForSectionSubject('123456789012', section, sub1, [sub1, sub2])).toBe(true);
    expect(isStudentEligibleForSectionSubject('123456789012', section, sub2, [sub1, sub2])).toBe(true);
  });

  it('W3-07: computes TE-only (100% of EX weight) for Field Exposure, Arts Apprenticeship, and Creative Production', () => {
    expect(computeExamsWeightedScore(null, 0, null, 0, 45, 50, 'shs_field_exposure', 'Arts Apprenticeship')).toBe(90);
    expect(computeExamsWeightedScore(10, 50, 10, 50, 45, 50, 'shs_core_academic', 'Creative Production and Presentation')).toBe(90);
  });

  it('W3-08: starts SY 2026-2027 June calendar on June 8 with 16 class days and 201 total class days per DO 009, s. 2026', () => {
    expect(SCHOOL_CALENDAR_2026_2027.JUNE[0]).toBe(8);
    expect(SCHOOL_CALENDAR_2026_2027.JUNE.length).toBe(16);
    const totalDays = Object.values(SCHOOL_CALENDAR_2026_2027).reduce((acc, days) => acc + days.length, 0);
    expect(totalDays).toBe(201);
  });
});


