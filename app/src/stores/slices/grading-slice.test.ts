/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGradingSlice } from './grading-slice';
import type { ClassRecord } from '../../types';

// Mock db
vi.mock('../../services/database', () => ({
  db: {
    deleteRecord: vi.fn().mockResolvedValue(undefined),
    clearStore: vi.fn().mockResolvedValue(undefined),
    putRecord: vi.fn().mockResolvedValue(undefined),
    putRecordsBulk: vi.fn().mockResolvedValue(undefined),
  },
  onDatabaseWriteChange: vi.fn(),
}));

interface MockStoreState {
  sections: { id: string; section_name: string; section_grade_level: string }[];
  students: { lrn: string; student_section: string; section_id: string }[];
  gradingSheetRecords: ClassRecord[];
  classRecords: ClassRecord[];
  showNotification: ReturnType<typeof vi.fn>;
}

describe('GradingSlice - clearGradingSheet', () => {
  let state: MockStoreState;
  const set = (updater: any) => {
    if (typeof updater === 'function') {
      const next = updater(state);
      state = { ...state, ...next };
    } else {
      state = { ...state, ...updater };
    }
  };
  const get = () => state;

  const initialClassRecords: ClassRecord[] = [
    {
      id: 'grade_1001_sub1_Q1',
      student_lrn: '1001',
      subject_id: 'sub1',
      section_id: 'sec_iris_7',
      quarter: 1,
      school_year: '2026-2027',
      final_grade: 85,
      written_works: [20],
      performance_tasks: [40],
      quarterly_exam: 18,
    },
    {
      id: 'grade_1001_sub1_Q2',
      student_lrn: '1001',
      subject_id: 'sub1',
      section_id: 'Iris',
      quarter: 2,
      school_year: '2026-2027',
      final_grade: 87,
      written_works: [22],
      performance_tasks: [42],
      quarterly_exam: 19,
    },
    {
      id: 'grade_2001_sub1_Q1',
      student_lrn: '2001',
      subject_id: 'sub1',
      section_id: 'sec_rose_8',
      quarter: 1,
      school_year: '2026-2027',
      final_grade: 92,
      written_works: [25],
      performance_tasks: [48],
      quarterly_exam: 20,
    },
  ];

  beforeEach(() => {
    state = {
      sections: [
        { id: 'sec_iris_7', section_name: 'Iris', section_grade_level: 'Grade 7' },
        { id: 'sec_rose_8', section_name: 'Rose', section_grade_level: 'Grade 8' },
      ],
      students: [
        { lrn: '1001', student_section: 'Iris', section_id: 'sec_iris_7' },
        { lrn: '1002', student_section: 'Iris', section_id: 'sec_iris_7' },
        { lrn: '2001', student_section: 'Rose', section_id: 'sec_rose_8' },
      ],
      gradingSheetRecords: [
        { id: '1001_sub1_1_2026-2027', student_lrn: '1001', subject_id: 'sub1', section_id: 'sec_iris_7', quarter: 1, school_year: '2026-2027', final_grade: 85, written_works: [], performance_tasks: [], quarterly_exam: 0 },
        { id: '1002_sub1_1_2026-2027', student_lrn: '1002', subject_id: 'sub1', section_id: 'Iris', quarter: 1, school_year: '2026-2027', final_grade: 88, written_works: [], performance_tasks: [], quarterly_exam: 0 },
        { id: '1001_sub2_1_2026-2027', student_lrn: '1001', subject_id: 'sub2', section_id: '', quarter: 1, school_year: '2026-2027', final_grade: 90, written_works: [], performance_tasks: [], quarterly_exam: 0 }, // missing/empty section_id
        { id: '1001_sub1_2_2026-2027', student_lrn: '1001', subject_id: 'sub1', section_id: 'sec_iris_7', quarter: 2, school_year: '2026-2027', final_grade: 87, written_works: [], performance_tasks: [], quarterly_exam: 0 },
        { id: '2001_sub1_1_2026-2027', student_lrn: '2001', subject_id: 'sub1', section_id: 'sec_rose_8', quarter: 1, school_year: '2026-2027', final_grade: 92, written_works: [], performance_tasks: [], quarterly_exam: 0 },
      ],
      classRecords: [...initialClassRecords],
      showNotification: vi.fn(),
    };
  });

  it('correctly clears only gradingSheetRecords for a specific section and quarter while preserving all teacher classRecords', async () => {
    const slice = createGradingSlice(set, get);

    // Clear Iris Term 1
    await slice.clearGradingSheet('sec_iris_7', 1, '2026-2027', ['1001', '1002']);

    // Should delete all 3 Iris Q1 gradingSheetRecords (even when section_id is name or missing)
    expect(state.gradingSheetRecords.find((r: ClassRecord) => r.id === '1001_sub1_1_2026-2027')).toBeUndefined();
    expect(state.gradingSheetRecords.find((r: ClassRecord) => r.id === '1002_sub1_1_2026-2027')).toBeUndefined();
    expect(state.gradingSheetRecords.find((r: ClassRecord) => r.id === '1001_sub2_1_2026-2027')).toBeUndefined();

    // Should PRESERVE Iris Q2 gradingSheetRecords
    expect(state.gradingSheetRecords.find((r: ClassRecord) => r.id === '1001_sub1_2_2026-2027')).toBeDefined();

    // Should PRESERVE other section (Rose) gradingSheetRecords
    expect(state.gradingSheetRecords.find((r: ClassRecord) => r.id === '2001_sub1_1_2026-2027')).toBeDefined();

    // CRITICAL: classRecords (teacher E-Class Record) MUST BE 100% UNTOUCHED!
    expect(state.classRecords).toEqual(initialClassRecords);
    expect(state.classRecords).toHaveLength(3);

    expect(state.showNotification).toHaveBeenCalledWith(
      expect.stringContaining('Successfully cleared 3 grade entries'),
      'success'
    );
  });

  it('correctly clears all quarters in gradingSheetRecords for a section when quarter is undefined (All Terms) while preserving all classRecords', async () => {
    const slice = createGradingSlice(set, get);

    // Clear Iris All Terms
    await slice.clearGradingSheet('sec_iris_7', undefined, '2026-2027', ['1001', '1002']);

    // All Iris records across Q1 and Q2 in gradingSheetRecords should be deleted
    expect(state.gradingSheetRecords.filter((r: ClassRecord) => r.student_lrn === '1001' || r.student_lrn === '1002')).toHaveLength(0);

    // Only Rose records should remain in gradingSheetRecords
    expect(state.gradingSheetRecords).toHaveLength(1);
    expect(state.gradingSheetRecords[0].student_lrn).toBe('2001');

    // CRITICAL: classRecords (teacher E-Class Record) MUST BE 100% UNTOUCHED!
    expect(state.classRecords).toEqual(initialClassRecords);
    expect(state.classRecords).toHaveLength(3);
  });
});

describe('GradingSlice - bulkUpdateGradingSheetRecords', () => {
  let state: MockStoreState;
  const set = (updater: any) => {
    if (typeof updater === 'function') {
      const next = updater(state);
      state = { ...state, ...next };
    } else {
      state = { ...state, ...updater };
    }
  };
  const get = () => state;

  beforeEach(() => {
    state = {
      sections: [],
      students: [],
      gradingSheetRecords: [
        { id: 'rec1', student_lrn: '1001', subject_id: 'sub1', section_id: 'sec1', quarter: 1, school_year: '2026-2027', final_grade: 80, written_works: [], performance_tasks: [], quarterly_exam: 0 },
        { id: 'rec2', student_lrn: '1002', subject_id: 'sub1', section_id: 'sec1', quarter: 1, school_year: '2026-2027', final_grade: 85, written_works: [], performance_tasks: [], quarterly_exam: 0 },
      ],
      classRecords: [],
      showNotification: vi.fn(),
    };
  });

  it('updates existing records and inserts new records in bulk in Zustand state and IndexedDB', async () => {
    const slice = createGradingSlice(set, get);

    const newRecords: ClassRecord[] = [
      { id: 'rec1', student_lrn: '1001', subject_id: 'sub1', section_id: 'sec1', quarter: 1, school_year: '2026-2027', final_grade: 95, written_works: [], performance_tasks: [], quarterly_exam: 0 },
      { id: 'rec3', student_lrn: '1003', subject_id: 'sub1', section_id: 'sec1', quarter: 1, school_year: '2026-2027', final_grade: 90, written_works: [], performance_tasks: [], quarterly_exam: 0 },
    ];

    await slice.bulkUpdateGradingSheetRecords(newRecords);

    // Should update rec1 to 95
    expect(state.gradingSheetRecords.find(r => r.id === 'rec1')?.final_grade).toBe(95);
    // Should preserve rec2
    expect(state.gradingSheetRecords.find(r => r.id === 'rec2')?.final_grade).toBe(85);
    // Should insert rec3
    expect(state.gradingSheetRecords.find(r => r.id === 'rec3')?.final_grade).toBe(90);
    expect(state.gradingSheetRecords).toHaveLength(3);
  });

  it('handles empty array without mutating state or calling db', async () => {
    const slice = createGradingSlice(set, get);
    await slice.bulkUpdateGradingSheetRecords([]);
    expect(state.gradingSheetRecords).toHaveLength(2);
  });
});

