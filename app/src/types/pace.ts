/**
 * PACE Form Types (Performance Assessment in Reading and Literacy - Grade 1 Only)
 * DepEd MATATAG PACE Form 138-Reading
 */

export type PaceRatingDescriptor = 'A' | 'B' | 'C' | 'D' | 'E' | '' | null;

export type MacroSkillType = 'listening' | 'speaking' | 'reading' | 'writing';

export interface PaceSubRow {
  id: string;
  skill: MacroSkillType;
  label?: string;
}

export interface PaceSubItem {
  id: string;
  label: string;
  subRows: PaceSubRow[];
}

export interface PaceCompetencyItem {
  id: number;
  number: number;
  description: string;
  hasSubItems: boolean;
  subRows?: PaceSubRow[];
  subItems?: PaceSubItem[];
}

export interface PaceDomainGroup {
  id: string;
  title: string;
  subtitle: string;
  columnGroup: 'left' | 'right';
  competencies: PaceCompetencyItem[];
}

export type PaceDomain = PaceDomainGroup;

export interface PaceFormData {
  lrn: string;
  studentName: string;
  gradeLevel: string;
  section: string;
  schoolYear: string;
  teacherName: string;
  ratings: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
}

export interface PaceDescriptorInfo {
  code: PaceRatingDescriptor;
  title: string;
  description: string;
}
