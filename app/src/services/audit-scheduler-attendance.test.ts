import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb';
import { db } from './database';
import { useAppStore } from '../stores/app-store';
import { AutoBackupManager } from './AutoBackupManager';
import { IncrementalBackupService } from './IncrementalBackupService';
import { collectBackupLocalStorage } from '../utils/backup-restore';
import type { AttendanceRecord } from '../types';

describe('audit: background work and attendance atomicity', () => {
  beforeEach(async () => {
    await db.resetConnection();
    db.releaseInstallWriteBarrier();
    db.setDatabaseEncryptionKey(null);
    globalThis.indexedDB = new IDBFactory();
    globalThis.IDBKeyRange = IDBKeyRange;
    localStorage.clear();
    useAppStore.setState({ activeSchoolYear: '2026-2027', sections: [], attendanceRecords: [], sf2Sheets: [], activeSF2Sheet: null });
  });
  afterEach(async () => {
    AutoBackupManager.stop(); IncrementalBackupService.stop();
    vi.restoreAllMocks(); vi.useRealTimers(); await db.resetConnection();
  });
  const record: AttendanceRecord = { id: 'SYNTHETIC-1_2026-09-27', student_lrn: 'SYNTHETIC-1', date: '2026-09-27', section_id: 'A', status: 'present' };

  it('rolls back attendance when the SF2 update fails', async () => {
    const original = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
      const request = original.apply(this, args);
      if (this.name === 'sf2Sheets') request.addEventListener('success', () => this.transaction.abort());
      return request;
    });
    await expect(useAppStore.getState().upsertAttendanceRecords([record])).rejects.toThrow();
    expect(await db.getStoreCount('attendanceRecords')).toBe(0);
    expect(useAppStore.getState().attendanceRecords).toEqual([]);
  });
  it('retains both learners when attendance updates arrive together', async () => {
    await Promise.all([
      useAppStore.getState().upsertAttendanceRecords([record]),
      useAppStore.getState().upsertAttendanceRecords([{ ...record, id: 'SYNTHETIC-2_2026-09-27', student_lrn: 'SYNTHETIC-2' }]),
    ]);
    expect(await db.getStoreCount('attendanceRecords')).toBe(2);
    const sheets = await db.getAllRecords<{ attendance: object }>('sf2Sheets');
    expect(Object.keys(sheets[0].attendance)).toHaveLength(2);
  });
  it('stops all scheduled timers and detaches database listeners', () => {
    vi.useFakeTimers();
    const unsubscribe = vi.fn();
    vi.spyOn(db, 'onDatabaseChange').mockReturnValue(unsubscribe);
    AutoBackupManager.startHourlyScheduler();
    IncrementalBackupService.init();
    expect(vi.getTimerCount()).toBe(3);
    AutoBackupManager.stop(); IncrementalBackupService.stop();
    expect(vi.getTimerCount()).toBe(0);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
  it('excludes SMS credentials from portable backups', () => {
    localStorage.setItem('formease_sms_gateway_config', JSON.stringify({ password: 'synthetic-secret' }));
    localStorage.setItem('formease-theme', 'dark');
    expect(collectBackupLocalStorage()).toEqual({ 'formease-theme': 'dark' });
  });
});
