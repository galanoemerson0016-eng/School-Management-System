/**
 * Subject Configuration Utility
 * Handles both standard DepEd subjects and custom school curricula
 */

import type { CurriculumSubject, SchoolCurriculum } from '../types';

// Standard DepEd subjects for grades 7-10
const STANDARD_SUBJECTS = {
  Grade7: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'Values Education', code: '' },
    { name: 'Technology and Livelihood Education (TLE)', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music and Arts', code: 'MAPEH' },
    { name: 'Physical Education and Health', code: 'MAPEH' },
    { name: 'Specialization', code: '' }
  ] as CurriculumSubject[],
  Grade8: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'Values Education', code: '' },
    { name: 'Technology and Livelihood Education (TLE)', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music and Arts', code: 'MAPEH' },
    { name: 'Physical Education and Health', code: 'MAPEH' },
    { name: 'Specialization', code: '' }
  ] as CurriculumSubject[],
  Grade9: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'Values Education', code: '' },
    { name: 'Technology and Livelihood Education (TLE)', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music and Arts', code: 'MAPEH' },
    { name: 'Physical Education and Health', code: 'MAPEH' },
    { name: 'Specialization', code: '' }
  ] as CurriculumSubject[],
  Grade10: [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'Values Education', code: '' },
    { name: 'Technology and Livelihood Education (TLE)', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music and Arts', code: 'MAPEH' },
    { name: 'Physical Education and Health', code: 'MAPEH' },
    { name: 'Specialization', code: '' }
  ] as CurriculumSubject[]
};

/**
 * Get subjects for a specific grade level
 * Uses custom curriculum if available, otherwise returns standard subjects
 */
export function getSubjectsForGrade(gradeLevel: string | number, customCurriculum?: SchoolCurriculum): CurriculumSubject[] {
  const grade = String(gradeLevel).toLowerCase();
  
  // Check custom curriculum first
  if (customCurriculum) {
    if (grade.includes('7') && customCurriculum.grade_7_subjects?.length) {
      return customCurriculum.grade_7_subjects;
    }
    if (grade.includes('8') && customCurriculum.grade_8_subjects?.length) {
      return customCurriculum.grade_8_subjects;
    }
    if (grade.includes('9') && customCurriculum.grade_9_subjects?.length) {
      return customCurriculum.grade_9_subjects;
    }
    if (grade.includes('10') && customCurriculum.grade_10_subjects?.length) {
      return customCurriculum.grade_10_subjects;
    }
  }

  // Fall back to standard subjects
  if (grade.includes('7')) return STANDARD_SUBJECTS.Grade7;
  if (grade.includes('8')) return STANDARD_SUBJECTS.Grade8;
  if (grade.includes('9')) return STANDARD_SUBJECTS.Grade9;
  if (grade.includes('10')) return STANDARD_SUBJECTS.Grade10;

  return STANDARD_SUBJECTS.Grade7; // Default fallback
}

/**
 * Get SF10 subject rows with proper formatting.
 * Implements the core principle: MAPEH header -> Components -> Final Average
 */
export function getSF10RowsForGrade(gradeLevel: string | number, customCurriculum?: SchoolCurriculum) {
  const subjects = getSubjectsForGrade(gradeLevel, customCurriculum);
  const rows: any[] = [];

  const getStandardSf10Key = (subjectName: string, idx: number) => {
    const normalized = normalizeSubjectName(subjectName);
    if (normalized.includes('filipino')) return 'filipino';
    if (normalized.includes('english')) return 'english';
    if (normalized.includes('mathematics') || normalized.includes('math')) return 'mathematics';
    if (normalized.includes('science')) return 'science';
    if (normalized.includes('aralingpanlipunan') || normalized === 'ap') return 'ap';
    if (normalized.includes('valueseducation') || normalized.includes('values')) return 'valuesEducation';
    if (normalized.includes('edukasyon') || normalized === 'esp' || normalized.includes('pagpapakatao')) return 'esp';
    if (normalized.includes('technologyandlivelihood') || normalized.includes('tle')) return 'tle';
    if (normalized.includes('musicandarts') || normalized.includes('musicarts')) return 'musicAndArts';
    if (normalized.includes('physicaleducationandhealth') || normalized.includes('peandhealth') || normalized.includes('pehealth')) return 'peAndHealth';
    if (normalized.includes('mapeh')) return 'mapeh';
    if (normalized.includes('specialization')) return 'specialization';
    return `subject_${idx}`;
  };

  // Track MAPEH components to insert Final Average correctly
  const componentIndices: number[] = [];
  subjects.forEach((s, i) => {
    const norm = normalizeSubjectName(s.name);
    if (s.code === 'MAPEH' || norm.includes('musicandarts') || norm.includes('physicaleducationandhealth')) {
      componentIndices.push(i);
    }
  });

  subjects.forEach((subject, idx) => {
    const norm = normalizeSubjectName(subject.name);
    const isMapehHeader = norm === 'mapeh';
    const isComponent = componentIndices.includes(idx);
    
    rows.push({
      label: subject.name,
      key: getStandardSf10Key(subject.name, idx),
      indent: isComponent,
      isHeader: isMapehHeader
    });
  });

  // Add 3 mandatory extra reserved rows after the last subject
  for (let i = 1; i <= 3; i++) {
    rows.push({
      label: ' ',
      key: `extra_reserved_${i}`
    });
  }

  return rows;
}

/**
 * Get SF9 subject list for a specific grade
 */
export function getSF9SubjectsForGrade(gradeLevel: string | number, customCurriculum?: SchoolCurriculum) {
  const subjects = getSubjectsForGrade(gradeLevel, customCurriculum);
  const rows: { name: string; isHeader?: boolean; isComponent?: boolean; isComputed?: boolean; isReserved?: boolean }[] = [];
  
  // Normalized names for identification
  const mapehNorm = 'mapeh';
  const componentsNorms = ['musicandarts', 'musicarts', 'physicaleducationandhealth', 'peandhealth', 'pehealth'];

  // Identify components in the curriculum
  const componentIndices = subjects.map((s, i) => {
    const norm = normalizeSubjectName(s.name);
    return componentsNorms.some(c => norm.includes(c)) ? i : -1;
  }).filter(i => i !== -1);

  subjects.forEach((subj, idx) => {
    const norm = normalizeSubjectName(subj.name);
    const isMapeh = norm === mapehNorm;
    const isComponent = componentIndices.includes(idx);

    rows.push({
      name: subj.name,
      isHeader: isMapeh,
      isComponent: isComponent
    });
  });

  // Add 3 reserved rows for possible extra subjects
  for (let i = 1; i <= 3; i++) {
    rows.push({
      name: `extra_reserved_${i}`,
      isReserved: true
    });
  }

  return rows;
}

/**
 * Normalize subject name for matching/comparison
 */
export function normalizeSubjectName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Find a subject in the list by name (with fuzzy matching)
 */
export function findSubject(subjectName: string, subjects: CurriculumSubject[]): CurriculumSubject | undefined {
  const normalized = normalizeSubjectName(subjectName);
  return subjects.find(s => normalizeSubjectName(s.name) === normalized);
}
