import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb';
import { db } from './database';
import { useAppStore } from '../stores/app-store';
import type { Student } from '../types';

const learner = { lrn: 'SYNTHETIC-OLD', first_name: 'Test', last_name: 'Learner', student_section: 'A' } as Student;

describe('learner identity and cascade persistence', () => {
  beforeEach(async () => {
    await db.resetConnection();
    db.releaseInstallWriteBarrier();
    db.setDatabaseEncryptionKey(null);
    globalThis.indexedDB = new IDBFactory();
    globalThis.IDBKeyRange = IDBKeyRange;
    localStorage.clear();
    useAppStore.setState({ students: [learner], studentProfiles: [learner], classRecords: [], gradingSheetRecords: [], enrollments: [], attendanceRecords: [], observedValues: [], activeSF2Sheet: null });
    await db.putRecord('students', learner);
    for (const store of ['enrollments', 'classRecords', 'gradingSheetRecords', 'attendanceRecords', 'observedValues']) {
      await db.putRecord(store, { id: `record_${learner.lrn}`, student_lrn: learner.lrn });
    }
    await db.putRecord('sf2Sheets', { id: 'sheet', attendance: { [learner.lrn]: { 1: 'P' } }, remarks: { [learner.lrn]: '' } });
  });
  afterEach(async () => { vi.restoreAllMocks(); await db.resetConnection(); });

  it('renames database relationships and SF10 history together', async () => {
    localStorage.setItem('sf10-storage', JSON.stringify({ state: { overrides: { [`${learner.lrn}_sheet`]: { A1: 'History' } }, history: {} }, version: 0 }));
    localStorage.setItem('formease_pace_reading_ratings', JSON.stringify({ [learner.lrn]: { lrn: learner.lrn, ratings: { test: 'A' } } }));
    localStorage.setItem(`g1_remarks_${learner.lrn}_2026-2027`, JSON.stringify({ first: 'Good progress' }));
    await useAppStore.getState().updateStudent(learner.lrn, { lrn: 'SYNTHETIC-NEW' });
    expect(await db.getRecord('students', learner.lrn)).toBeUndefined();
    expect(await db.getRecord('students', 'SYNTHETIC-NEW')).toBeDefined();
    for (const store of ['enrollments', 'classRecords', 'gradingSheetRecords', 'attendanceRecords', 'observedValues']) {
      expect(await db.getAllRecords(store)).toEqual([{ id: 'record_SYNTHETIC-NEW', student_lrn: 'SYNTHETIC-NEW' }]);
    }
    expect(await db.getRecord('sf2Sheets', 'sheet')).toMatchObject({ attendance: { 'SYNTHETIC-NEW': { 1: 'P' } }, remarks: { 'SYNTHETIC-NEW': '' } });
    expect(JSON.parse(localStorage.getItem('sf10-storage')!).state.overrides).toEqual({ 'SYNTHETIC-NEW_sheet': { A1: 'History' } });
    expect(JSON.parse(localStorage.getItem('formease_pace_reading_ratings')!)).toEqual({ 'SYNTHETIC-NEW': { lrn: 'SYNTHETIC-NEW', ratings: { test: 'A' } } });
    expect(JSON.parse(localStorage.getItem('g1_remarks_SYNTHETIC-NEW_2026-2027')!)).toEqual({ first: 'Good progress' });
  });

  it('preserves the learner and every relationship if rename aborts', async () => {
    const original = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
      const request = original.apply(this, args);
      if (this.name === 'sf2Sheets') request.addEventListener('success', () => this.transaction.abort());
      return request;
    });
    await expect(useAppStore.getState().updateStudent(learner.lrn, { lrn: 'SYNTHETIC-NEW' })).rejects.toThrow();
    expect(await db.getRecord('students', learner.lrn)).toEqual(learner);
    expect(await db.getRecord('students', 'SYNTHETIC-NEW')).toBeUndefined();
    expect(await db.getRecord('enrollments', `record_${learner.lrn}`)).toBeDefined();
    expect(useAppStore.getState().students).toEqual([learner]);
  });

  it('rejects a rename onto another learner', async () => {
    await db.putRecord('students', { ...learner, lrn: 'SYNTHETIC-NEW' });
    await expect(useAppStore.getState().updateStudent(learner.lrn, { lrn: 'SYNTHETIC-NEW' })).rejects.toThrow('already exists');
    expect(await db.getStoreCount('students')).toBe(2);
  });

  it('does not publish a failed ordinary profile save', async () => {
    vi.spyOn(db, 'putRecord').mockRejectedValueOnce(new Error('synthetic disk failure'));
    await expect(useAppStore.getState().updateStudent(learner.lrn, { first_name: 'Not saved' })).rejects.toThrow();
    expect(useAppStore.getState().students).toEqual([learner]);
  });

  it('deletes unloaded historical relationships and clears SF2 rows', async () => {
    await useAppStore.getState().deleteStudent(learner.lrn);
    for (const store of ['students', 'enrollments', 'classRecords', 'gradingSheetRecords', 'attendanceRecords', 'observedValues']) {
      expect(await db.getStoreCount(store)).toBe(0);
    }
    expect(await db.getRecord('sf2Sheets', 'sheet')).toEqual({ id: 'sheet', attendance: {}, remarks: {} });
    expect(useAppStore.getState().studentProfiles).toEqual([]);
  });

  it('preserves all records if cascade deletion aborts', async () => {
    const original = IDBObjectStore.prototype.delete;
    vi.spyOn(IDBObjectStore.prototype, 'delete').mockImplementation(function (this: IDBObjectStore, ...args) {
      const request = original.apply(this, args);
      if (this.name === 'observedValues') request.addEventListener('success', () => this.transaction.abort());
      return request;
    });
    await expect(useAppStore.getState().deleteStudent(learner.lrn)).rejects.toThrow();
    expect(await db.getRecord('students', learner.lrn)).toEqual(learner);
    expect(await db.getStoreCount('classRecords')).toBe(1);
    expect(useAppStore.getState().students).toEqual([learner]);
  });

  it('serializes duplicate additions and retains the original learner', async () => {
    const results = await Promise.allSettled([useAppStore.getState().addStudent(learner), useAppStore.getState().addStudent(learner)]);
    expect(results.every(result => result.status === 'rejected')).toBe(true);
    expect(useAppStore.getState().students).toEqual([learner]);
    expect(await db.getStoreCount('students')).toBe(1);
  });
});
