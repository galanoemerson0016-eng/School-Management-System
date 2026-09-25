import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb';
import { db } from './database';

describe('database write completion', () => {
  beforeEach(async () => {
    db.releaseInstallWriteBarrier();
    await db.resetConnection();
    db.setDatabaseEncryptionKey(null);
    (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
    (globalThis as unknown as { IDBKeyRange: typeof IDBKeyRange }).IDBKeyRange = IDBKeyRange;
  });

  afterEach(() => {
    db.releaseInstallWriteBarrier();
    vi.restoreAllMocks();
  });

  it('does not report a put as saved when its transaction aborts after request success', async () => {
    const originalPut = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
      const request = originalPut.apply(this, args);
      request.addEventListener('success', () => this.transaction.abort());
      return request;
    });

    await expect(db.putRecord('students', { lrn: 'SYNTHETIC-1', first_name: 'Test' })).rejects.toThrow();
    expect(await db.getStoreCount('students')).toBe(0);
  });

  it('blocks all new writes after an install barrier is acquired and releases on cancel', async () => {
    const generation = db.getWriteGeneration();
    expect(db.acquireInstallWriteBarrier(generation)).toBe(true);
    await expect(db.putRecord('students', { lrn: 'SYNTHETIC-BLOCKED' })).rejects.toThrow('paused');
    expect(await db.getStoreCount('students')).toBe(0);
    db.releaseInstallWriteBarrier();
    await db.putRecord('students', { lrn: 'SYNTHETIC-ALLOWED' });
    expect(db.getWriteGeneration()).toBe(generation + 2);
    expect(await db.getStoreCount('students')).toBe(1);
  });

  it('captures all restore stores in one read transaction and rejects a failed table', async () => {
    await db.putRecord('students', { lrn: 'SYNTHETIC-SNAPSHOT', first_name: 'Before' });
    const snapshot = await db.readBackupSnapshot();
    expect(snapshot.students).toEqual([{ lrn: 'SYNTHETIC-SNAPSHOT', first_name: 'Before' }]);
    expect(snapshot.classRecords).toEqual([]);
    const originalGetAll = IDBObjectStore.prototype.getAll;
    vi.spyOn(IDBObjectStore.prototype, 'getAll').mockImplementation(function (this: IDBObjectStore, ...args) {
      if (this.name === 'classRecords') throw new Error('synthetic snapshot table failure');
      return originalGetAll.apply(this, args);
    });
    await expect(db.readBackupSnapshot()).rejects.toThrow();
  });
});
