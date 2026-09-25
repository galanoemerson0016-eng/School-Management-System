import { describe, expect, it } from 'vitest';
import type { ClassRecord, Student, Subject } from '../types';
import { computeSectionConsolidatedData } from './consolidated-export-service';

describe('consolidated export averages', () => {
  it('averages counted subjects equally and preserves encoded zero grades', () => {
    const students = [{
      id: 'student-1', lrn: 'lrn-1', gender: 'Male', first_name: 'Ari', last_name: 'Learner',
    }] as Student[];
    const subjects = [
      { id: 'math', subject_name: 'Mathematics', counts_in_general_average: true },
      { id: 'english', subject_name: 'English', counts_in_general_average: true },
      { id: 'conduct', subject_name: 'Conduct', counts_in_general_average: false },
    ] as Subject[];
    const classRecords = [
      { student_lrn: 'lrn-1', subject_id: 'math', school_year: '2025-2026', quarter: 1, final_grade: 80 },
      { student_lrn: 'lrn-1', subject_id: 'english', school_year: '2025-2026', quarter: 1, final_grade: 0 },
      { student_lrn: 'lrn-1', subject_id: 'conduct', school_year: '2025-2026', quarter: 1, final_grade: 100 },
    ] as ClassRecord[];

    const result = computeSectionConsolidatedData(students, subjects, classRecords, '2025-2026', 'all');
    expect(result.males[0].generalAverage).toBe(40);
    expect(result.males[0].grades).toEqual({ math: 80, english: 0, conduct: 100 });
  });
});
