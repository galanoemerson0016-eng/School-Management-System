import type { Student, SchoolProfile, Subject } from '../../types';

export interface SF9Template2Attendance {
  months: string[];
  schoolDays: number[];
  daysPresent: number[];
  daysAbsent: number[];
}

export interface SF9Template2SubjectItem {
  id?: string;
  name: string;
  code?: string;
  isComponent?: boolean;
  isHeader?: boolean;
  isReserved?: boolean;
  subject_name?: string;
  term?: Subject['term'];
  offered_terms?: Subject['offered_terms'];
}

export interface SF9Template2LearnerData {
  student: Student;
  grades: Record<string, number[]>;
  subjects?: (SF9Template2SubjectItem | Subject)[];
  comments?: string[];
  attendance?: SF9Template2Attendance;
}

export interface SF9Template2DocumentProps {
  learnerA: SF9Template2LearnerData;
  learnerB?: SF9Template2LearnerData | null;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section: string;
  gradeLevel?: string;
  adviser: string;
  principal?: string;
  principalTitle?: string;
  pageSize?: 'A4' | 'LETTER';
  twoUp?: boolean;
  logoUrl?: string;
  duplexMode?: 'long-edge' | 'short-edge' | 'simplex';
}

export interface SF9Template2BatchDocumentProps {
  learners: SF9Template2LearnerData[];
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section: string;
  gradeLevel?: string;
  adviser: string;
  principal?: string;
  principalTitle?: string;
  pageSize?: 'A4' | 'LETTER';
  twoUp?: boolean;
  logoUrl?: string;
  duplexMode?: 'long-edge' | 'short-edge' | 'simplex';
}

// Performance Descriptors based on official Template 2
export const TEMPLATE2_DESCRIPTORS = [
  { scale: '90 - 100', desc: 'Advancing', remark: 'Passed' },
  { scale: '80 - 89', desc: 'Benchmarking', remark: 'Passed' },
  { scale: '75 - 79', desc: 'Connecting', remark: 'Passed' },
  { scale: '65 - 74', desc: 'Developing', remark: 'Failed' },
  { scale: '0 - 64', desc: 'Emerging', remark: 'Failed' },
];

export function getTemplate2Remarks(grade: number): string {
  if (!grade || grade <= 0) return '';
  return grade >= 75 ? 'Passed' : 'Failed';
}

/**
 * Group learners into pairs for 2-up portrait sheet printing (2 front on page 1, 2 back on page 2).
 * If there is an odd number of learners, duplicate the last learner so no paper space is wasted.
 */
export function createTemplate2Pairs(
  learners: SF9Template2LearnerData[],
  duplicateOddLast: boolean = true
): Array<[SF9Template2LearnerData, SF9Template2LearnerData | null]> {
  const pairs: Array<[SF9Template2LearnerData, SF9Template2LearnerData | null]> = [];
  for (let i = 0; i < learners.length; i += 2) {
    const first = learners[i];
    const second = learners[i + 1] || (duplicateOddLast ? first : null);
    pairs.push([first, second]);
  }
  return pairs;
}
