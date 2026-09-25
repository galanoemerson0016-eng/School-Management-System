import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb';
import { db } from './database';
import { commitEClassChanges, gradeRecordId } from './grade-record-service';
import { createGradingSlice, type GradingSlice } from '../stores/slices/grading-slice';
import { resolveStudentQuarterGrade } from '../utils/grading-helpers';
import type { ClassRecord } from '../types';

const raw = (extra: Partial<ClassRecord> = {}): ClassRecord => ({
  id: 'synthetic-raw', student_lrn: 'SYNTHETIC-LEARNER', section_id: 'section-a',
  subject_id: 'math', subject_name: 'Mathematics', school_year: '2026-2027', quarter: 1,
  written_works: [20], performance_tasks: [40], quarterly_exam: 20, final_grade: 90,
  ...extra,
});
const official = (extra: Partial<ClassRecord> = {}): ClassRecord => raw({
  id: 'synthetic-official', grade_source: 'eclass_sync', written_works: [], performance_tasks: [], quarterly_exam: '', ...extra,
});

describe('transactional E-Class grade saving', () => {
  beforeEach(async () => {
    db.releaseInstallWriteBarrier();
    await db.resetConnection();
    db.setDatabaseEncryptionKey(null);
    Object.assign(globalThis, { indexedDB: new IDBFactory(), IDBKeyRange });
  });
  afterEach(() => vi.restoreAllMocks());

  it('commits raw scores, official grade and HPS together and survives reopening', async () => {
    const input = raw();
    const hps = { id: 'hps', section_id: input.section_id, subject_id: input.subject_id, school_year: input.school_year,
      quarter: 1 as const, written_works: [20], performance_tasks: [40], quarterly_exam: 20 };
    await commitEClassChanges({ records: [input], hpsRecords: [hps] }, []);
    await db.resetConnection();
    expect(await db.getRecord('classRecords', input.id)).toEqual(input);
    expect(await db.getAllRecords('gradingSheetRecords')).toEqual([expect.objectContaining({ final_grade: 90, grade_source: 'eclass_sync' })]);
    expect(await db.getRecord('hpsRecords', hps.id)).toEqual(hps);
  });

  it('rolls back raw, official and HPS records when a later write aborts', async () => {
    const old = raw({ final_grade: 80 });
    const grade = official({ final_grade: 80 });
    await db.putRecord('classRecords', old);
    await db.putRecord('gradingSheetRecords', grade);
    const original = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
      const request = original.apply(this, args);
      if (this.name === 'gradingSheetRecords') request.addEventListener('success', () => this.transaction.abort());
      return request;
    });
    await expect(commitEClassChanges({ records: [raw()] }, [grade])).rejects.toThrow();
    expect(await db.getRecord('classRecords', old.id)).toEqual(old);
    expect(await db.getAllRecords('gradingSheetRecords')).toEqual([grade]);
  });

  it.each(['manual_override', 'subject_teacher', 'legacy_fallback', undefined] as const)(
    'preserves %s ownership when raw scores change or are removed', async source => {
      const grade = official({ grade_source: source, final_grade: 85 });
      await db.putRecord('gradingSheetRecords', grade);
      await commitEClassChanges({ records: [raw()] }, [grade]);
      await commitEClassChanges({ records: [], removedRecords: [raw()] }, [grade]);
      expect(await db.getAllRecords('gradingSheetRecords')).toEqual([grade]);
      expect(await db.getAllRecords('classRecords')).toEqual([]);
    },
  );

  it('removes only the derived grade in the same section and year', async () => {
    const grades = [official(), official({ id: 'other-section', section_id: 'section-b' }),
      official({ id: 'other-year', school_year: '2025-2026' })];
    await db.putRecordsBulk('gradingSheetRecords', grades);
    await commitEClassChanges({ records: [], removedRecords: [raw()] }, grades);
    expect(await db.getAllRecords('gradingSheetRecords')).toHaveLength(2);
    expect(gradeRecordId(raw())).not.toBe(gradeRecordId(raw({ section_id: 'section-b' })));
    expect(gradeRecordId(raw())).not.toBe(gradeRecordId(raw({ school_year: '2025-2026' })));
  });

  it('honors an explicit perfect grade even when legacy raw data suggests healing', () => {
    const corrupt = { ...raw(), initial_grade: 7000 };
    expect(resolveStudentQuarterGrade({ studentLrn: corrupt.student_lrn, subjectId: 'math',
      sectionId: 'section-a', schoolYear: corrupt.school_year, quarter: 1,
      classRecords: [corrupt], gradingSheetRecords: [official({ grade_source: 'manual_override', final_grade: 100 })],
    })).toBe(100);
  });

  it('keeps the latest rapid edit and rolls back a failed subsequent edit to committed data', async () => {
    let state: GradingSlice;
    const notify = vi.fn();
    state = createGradingSlice(update => {
      state = { ...state, ...(typeof update === 'function' ? update(state) : update) };
    }, () => ({ ...state, showNotification: notify }));
    const first = state.saveEClassChanges({ records: [raw({ final_grade: 81 })] });
    const second = state.saveEClassChanges({ records: [raw({ final_grade: 92 })] });
    await Promise.all([first, second]);
    expect(state.gradingSheetRecords[0].final_grade).toBe(92);
    vi.spyOn(db, 'commitRecordChanges').mockRejectedValueOnce(new Error('synthetic disk failure'));
    await expect(state.saveEClassChanges({ records: [raw({ final_grade: 99 })] })).rejects.toThrow();
    expect(state.classRecords[0].final_grade).toBe(92);
    expect(state.gradingSheetRecords[0].final_grade).toBe(92);
    expect((await db.getAllRecords<ClassRecord>('classRecords'))[0].final_grade).toBe(92);
  });
});
