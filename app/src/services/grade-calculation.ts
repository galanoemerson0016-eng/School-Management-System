import type { Subject } from '../types';
import { getDefaultTermForSubject, getShsSubjectUnitInfo, resolveSubjectOfferedTerms } from '../lib/curriculum';
import { normalizeSubjectName } from '../lib/subjectConfig';

export interface SF9SubjectItem {
  name: string;
  id?: string;
  term?: Subject['term'];
  units?: number;
  isHeader?: boolean;
  isComponent?: boolean;
  isReserved?: boolean;
}

export type GradeCompletionStatus = 'complete' | 'provisional' | 'missing';

export interface QuarterlyFinalGrade {
  value: number;
  status: GradeCompletionStatus;
  gradedTerms: number;
  requiredTerms: number;
}

export interface CompositeTermGrade {
  value: number | null;
  componentAverages: Array<number | null>;
  complete: boolean;
}

/** Averages component groups equally, retaining a partial numeric result when a group is missing. */
export function calculateCompositeTermGrade(componentGroups: number[][]): CompositeTermGrade {
  const componentAverages = componentGroups.map(values => {
    const grades = values.filter(value => Number.isFinite(value) && value > 0);
    return grades.length ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length) : null;
  });
  const presentAverages = componentAverages.filter((grade): grade is number => grade !== null);
  return {
    value: presentAverages.length
      ? Math.round(presentAverages.reduce((sum, grade) => sum + grade, 0) / presentAverages.length)
      : null,
    componentAverages,
    complete: componentAverages.length > 0 && componentAverages.every(grade => grade !== null),
  };
}

export function calculateWeightedGradeAverage(
  entries: Array<{ grade: number; weight: number }>,
): number | null {
  const validEntries = entries.filter(entry => Number.isFinite(entry.grade) && Number.isFinite(entry.weight) && entry.weight > 0);
  const totalWeight = validEntries.reduce((sum, entry) => sum + entry.weight, 0);
  if (!totalWeight) return null;
  return validEntries.reduce((sum, entry) => sum + entry.grade * entry.weight, 0) / totalWeight;
}

/** Counts absent grade fields while treating an encoded zero as present. */
export function countMissingGradeValues(values: unknown[]): number {
  return values.filter(value => value === undefined || value === null || value === '').length;
}

export function countMissingOfferedGradeValues(
  terms: Array<{ term: number; values: unknown[] }>,
  offeredTerms: number[],
): number {
  return terms
    .filter(entry => offeredTerms.includes(entry.term))
    .reduce((missing, entry) => missing + countMissingGradeValues(entry.values), 0);
}

/** Preserves Grade Management's existing first-three-term mean while making partial data explicit. */
export function calculateQuarterlyFinalGrade(
  grades: Array<number | null | undefined>,
  averagingTerms: number[] = [1, 2, 3],
  requiredTerms: number[] = averagingTerms,
  completenessGrades: Array<number | null | undefined> = grades,
): QuarterlyFinalGrade {
  const values = averagingTerms
    .map(term => Number(grades[term - 1]))
    .filter(value => Number.isFinite(value) && value > 0);
  if (!values.length) return { value: 0, status: 'missing', gradedTerms: 0, requiredTerms: requiredTerms.length };
  const gradedTerms = requiredTerms.filter(term => {
    const value = Number(completenessGrades[term - 1]);
    return Number.isFinite(value) && value > 0;
  }).length;
  return {
    value: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
    status: requiredTerms.length === 0 || gradedTerms === requiredTerms.length ? 'complete' : 'provisional',
    gradedTerms,
    requiredTerms: requiredTerms.length,
  };
}

const NON_LEARNING_AREA_HEADERS = new Set(['Core Subjects', 'Electives', 'Elective Subjects', 'Applied Subjects', 'Specialized Subjects']);

function isExcludedFromAverage(key: string, subject?: SF9SubjectItem): boolean {
  const normalized = normalizeSubjectName(key);
  const isComponent = normalized.includes('musicandarts') || normalized.includes('musicarts') ||
    normalized.includes('physicaleducationandhealth') || normalized.includes('peandhealth') ||
    normalized.includes('pehealth') || subject?.isComponent;
  const isExcluded = key.startsWith('*') || key.toLowerCase().includes('arabic language') ||
    key.toLowerCase().includes('islamic values');
  return Boolean(key.startsWith('reserved_extra') || subject?.isReserved || isComponent || isExcluded ||
    (subject?.isHeader && NON_LEARNING_AREA_HEADERS.has(subject.name)));
}

/** Computes an SF9 subject final using the existing three-term and SHS-elective rules. */
export function calculateSf9FinalGrade(
  quarterGrades: number[],
  term?: 1 | 2 | 3 | 'all' | 'none',
  subjectName?: string,
): number {
  if (term === 'none') return 0;
  if (subjectName) {
    const normalized = normalizeSubjectName(subjectName);
    if (normalized === 'academicelective1') return quarterGrades[0] > 0 && quarterGrades[2] > 0
      ? Math.round((quarterGrades[0] + quarterGrades[2]) / 2) : quarterGrades[0] || quarterGrades[2] || 0;
    if (normalized === 'academicelective2') return quarterGrades[1] > 0 && quarterGrades[2] > 0
      ? Math.round((quarterGrades[1] + quarterGrades[2]) / 2) : quarterGrades[1] || quarterGrades[2] || 0;
    if (normalized === 'academicelective3') return quarterGrades[2] || 0;
    if (normalized === 'techproelective1') {
      const grades = quarterGrades.slice(0, 3).filter(grade => grade > 0);
      return grades.length ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length) : 0;
    }
  }
  if (term === 1 || Number(term) === 1) return quarterGrades[0] || 0;
  if (term === 2 || Number(term) === 2) return quarterGrades[1] || 0;
  if (term === 3 || Number(term) === 3) return quarterGrades[2] || 0;
  if (quarterGrades.length !== 3 || !quarterGrades.every(grade => grade > 0)) return 0;
  return Math.round(quarterGrades.reduce((sum, grade) => sum + grade, 0) / 3);
}

/** Pure SF9 general-average calculation. All curriculum inputs are explicit. */
export function calculateSf9GeneralAverage(
  grades: Record<string, number[]>,
  currentSubjects: SF9SubjectItem[] = [],
  gradeLevel = '',
  databaseSubjects: Subject[] = [],
): number {
  const gradeNumber = Number(gradeLevel.replace(/\D/g, ''));
  const isShs = gradeNumber === 11 || gradeNumber === 12;
  let total = 0;
  let count = 0;
  let totalWeighted = 0;
  let totalUnits = 0;
  for (const key of Object.keys(grades)) {
    const subject = currentSubjects.find(item => item.name === key);
    if (isExcludedFromAverage(key, subject)) continue;
    const dbSubject = subject?.id
      ? databaseSubjects.find(item => item.id === subject.id)
      : databaseSubjects.find(item => item.subject_name.toLowerCase().trim() === key.toLowerCase().trim());
    if (dbSubject?.counts_in_general_average === false || dbSubject?.is_component) continue;
    const term = subject?.term ?? dbSubject?.term ?? getDefaultTermForSubject(key, gradeLevel || 'Grade 11');
    if (term === 'none') continue;
    const finalGrade = calculateSf9FinalGrade(grades[key] || [0, 0, 0], term, key);
    if (finalGrade <= 0) continue;
    if (isShs) {
      const unitInfo = getShsSubjectUnitInfo(key, gradeLevel || 'Grade 11');
      const explicitUnits = Number(subject?.units ?? dbSubject?.units);
      const unitsPerTerm = Number.isFinite(explicitUnits) && explicitUnits > 0 ? explicitUnits : unitInfo.unitsPerTerm;
      const offeredTerms = resolveSubjectOfferedTerms({ subject_name: key, term }, { section_grade_level: gradeLevel || 'Grade 11' }).length;
      const yearUnits = unitsPerTerm * Math.max(1, offeredTerms);
      totalWeighted += finalGrade * yearUnits;
      totalUnits += yearUnits;
    } else {
      total += finalGrade;
      count++;
    }
  }
  return isShs ? (totalUnits > 0 ? Math.round(totalWeighted / totalUnits) : 0) : (count > 0 ? Math.round(total / count) : 0);
}

/** Returns true only when each required learning area has every offered term. */
export function areSf9TermsComplete(
  grades: Record<string, number[]>,
  currentSubjects: SF9SubjectItem[],
  gradeLevel: string,
  databaseSubjects: Subject[] = [],
): boolean {
  const required = currentSubjects.filter(subject => !isExcludedFromAverage(subject.name, subject));
  if (required.length === 0) return false;
  return required.every(subject => {
    const dbSubject = subject.id
      ? databaseSubjects.find(candidate => candidate.id === subject.id)
      : databaseSubjects.find(candidate => normalizeSubjectName(candidate.subject_name) === normalizeSubjectName(subject.name));
    const term = subject.term ?? dbSubject?.term ?? getDefaultTermForSubject(subject.name, gradeLevel);
    const offered = resolveSubjectOfferedTerms({ subject_name: subject.name, term }, { section_grade_level: gradeLevel });
    const row = grades[subject.name] || [0, 0, 0];
    return offered.length > 0 && offered.every(termNumber => Number(row[termNumber - 1]) > 0);
  });
}

export function calculateSf9TotalUnits(
  currentSubjects: SF9SubjectItem[],
  gradeLevel: string,
  databaseSubjects: Subject[] = [],
): number {
  return currentSubjects.reduce((total, subject) => {
    if (isExcludedFromAverage(subject.name, subject)) return total;
    const dbSubject = subject.id
      ? databaseSubjects.find(candidate => candidate.id === subject.id)
      : databaseSubjects.find(candidate => normalizeSubjectName(candidate.subject_name) === normalizeSubjectName(subject.name));
    if (dbSubject?.counts_in_general_average === false || dbSubject?.is_component) return total;
    const unitInfo = getShsSubjectUnitInfo(subject.name, gradeLevel);
    const explicitUnits = Number(subject.units ?? dbSubject?.units);
    const unitsPerTerm = Number.isFinite(explicitUnits) && explicitUnits > 0 ? explicitUnits : unitInfo.unitsPerTerm;
    const term = subject.term ?? dbSubject?.term ?? getDefaultTermForSubject(subject.name, gradeLevel);
    const offeredCount = resolveSubjectOfferedTerms({ subject_name: subject.name, term }, { section_grade_level: gradeLevel }).length;
    return total + unitsPerTerm * Math.max(1, offeredCount);
  }, 0);
}
