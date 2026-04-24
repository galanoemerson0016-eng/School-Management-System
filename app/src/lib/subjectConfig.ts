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
 * Get SF10 subject rows with proper formatting for Grades 7-9
 */
export function getSF10RowsForGrade(gradeLevel: string | number, customCurriculum?: SchoolCurriculum) {
  const subjects = getSubjectsForGrade(gradeLevel, customCurriculum);
  const rows: any[] = [];
  const useDynamicKeys = !!customCurriculum;

  const getStandardSf10Key = (subjectName: string, idx: number) => {
    const normalized = normalizeSubjectName(subjectName);
    if (normalized.includes('filipino')) return 'filipino';
    if (normalized.includes('english')) return 'english';
    if (normalized.includes('mathematics') || normalized.includes('math')) return 'mathematics';
    if (normalized.includes('science')) return 'science';
    if (normalized.includes('aralingpanlipunan') || normalized === 'ap') return 'ap';
    if (normalized.includes('valueseducation') || normalized.includes('values')) return 'valuesEducation';
    if (normalized.includes('technologyandlivelihoodeducation') || normalized.includes('tle')) return 'tle';
    if (normalized === 'mapeh') return 'mapeh';
    if (normalized.includes('musicandarts')) return 'musicAndArts';
    if (normalized.includes('physicaleducationandhealth')) return 'peAndHealth';
    if (normalized.includes('specialization')) return 'specialization';
    return `subject_${idx}`;
  };

  subjects.forEach((subject, idx) => {
    const isMapehComponent = subject.code === 'MAPEH';
    rows.push({
      label: subject.name,
      key: useDynamicKeys ? `subject_${idx}` : getStandardSf10Key(subject.name, idx),
      indent: isMapehComponent
    });
  });

  // Add blank rows for spacing if needed (especially for forms with fewer subjects)
  const minRows = 12; // Standard form expects at least 12 rows
  while (rows.length < minRows) {
    rows.push({
      label: '\u00A0',
      key: `blank_${rows.length}`
    });
  }

  return rows;
}

/**
 * Get SF9 subject list for a specific grade
 */
export function getSF9SubjectsForGrade(gradeLevel: string | number, customCurriculum?: SchoolCurriculum) {
  return getSubjectsForGrade(gradeLevel, customCurriculum).map(subj => ({
    name: subj.name,
    isComponent: subj.code === 'MAPEH'
  }));
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
