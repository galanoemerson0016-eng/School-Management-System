import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { db, PRODUCTION_DB_NAME } from './database';

describe('audit: database failure atomicity', () => {
  beforeEach(async () => {
    await db.resetConnection();
    localStorage.clear();
    db.releaseInstallWriteBarrier();
    db.setDatabaseEncryptionKey(null);
    globalThis.indexedDB = new IDBFactory();
    globalThis.IDBKeyRange = IDBKeyRange;
  });

  afterEach(async () => { await db.resetConnection(); });

  it('rolls back earlier puts when a later record has no primary key', async () => {
    await db.putRecord('students', { lrn: 'SYNTHETIC-EXISTING', first_name: 'Original' });
    await expect(db.putRecordsBulk('students', [
      { lrn: 'SYNTHETIC-EXISTING', first_name: 'Overwritten' },
      { first_name: 'Invalid' },
    ])).rejects.toThrow();
    expect(await db.getAllRecords('students')).toEqual([
      { lrn: 'SYNTHETIC-EXISTING', first_name: 'Original' },
    ]);
  });

  it('rolls back earlier deletes when a later key is invalid', async () => {
    await db.putRecord('students', { lrn: 'SYNTHETIC-EXISTING' });
    await expect(db.deleteRecordsBulk('students', ['SYNTHETIC-EXISTING', undefined as unknown as string])).rejects.toThrow();
    expect(await db.getStoreCount('students')).toBe(1);
  });

  it('rolls back replacement clears when a later restore row cannot be cloned', async () => {
    await db.putRecord('students', { lrn: 'SYNTHETIC-EXISTING' });
    await expect(db.applyRestoreBatch([
      { store: 'students', records: [], replace: true },
      { store: 'sections', records: [{ id: 'SYNTHETIC-BAD', invalid: () => undefined }], replace: true },
    ])).rejects.toThrow();
    expect(await db.getStoreCount('students')).toBe(1);
  });

  it('aborts a legacy key migration if two learners share an LRN', async () => {
    const legacy = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(PRODUCTION_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore('students', { keyPath: 'id' });
        store.put({ id: 'A', lrn: 'SYNTHETIC-DUPLICATE', first_name: 'One' });
        store.put({ id: 'B', lrn: 'SYNTHETIC-DUPLICATE', first_name: 'Two' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    legacy.close();
    await expect(db.getAllRecords('students')).rejects.toThrow();
    await db.resetConnection();
    const preserved = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(PRODUCTION_DB_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    expect(preserved.version).toBe(1);
    expect(preserved.transaction('students').objectStore('students').keyPath).toBe('id');
    const records = await new Promise<unknown[]>((resolve, reject) => {
      const request = preserved.transaction('students').objectStore('students').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    expect(records).toHaveLength(2);
    preserved.close();
  });
});
