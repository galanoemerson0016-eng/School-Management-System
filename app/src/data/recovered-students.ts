import type { Student, Section } from '../types';
import recoveredData from './recovered-einstein-students.json';

export const EINSTEIN_SECTION: Section = {
  id: 'section_1777547467815',
  section_name: 'Einstein',
  section_grade_level: 'Grade 7',
  adviser_id: 'user-admin',
  adviser_name: 'Emerson M. Galano',
  is_advisory: true,
  is_teaching_load: true,
  program: 'Regular',
  curriculum_type: 'MATATAG',
  taught_subjects: [
    'Filipino',
    'English',
    'Mathematics',
    'Science',
    'Araling Panlipunan (AP)',
    'Values Education',
    'Technology and Livelihood Education (TLE)',
    'MAPEH',
    'Music and Arts',
    'Physical Education and Health'
  ],
  teaching_subjects: [
    'Filipino',
    'English',
    'Mathematics',
    'Science',
    'Araling Panlipunan (AP)',
    'Values Education',
    'Technology and Livelihood Education (TLE)',
    'MAPEH'
  ]
};

export const RECOVERED_EINSTEIN_STUDENTS: Student[] = recoveredData as Student[];
