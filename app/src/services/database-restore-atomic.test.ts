import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb';
import { db } from './database';
import { exportFullDatabaseBackup } from '../utils/backup-restore';
import { restoreBackupToFirestore } from '../utils/backup-import';

describe('backup replacement safety', () => {
  beforeEach(async () => {
    await db.resetConnection();
    db.setDatabaseEncryptionKey(null);
    (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
    (globalThis as unknown as { IDBKeyRange: typeof IDBKeyRange }).IDBKeyRange = IDBKeyRange;
    localStorage.clear();
  });
  afterEach(() => vi.restoreAllMocks());

  it('rejects a malformed backup before changing the existing school', async () => {
    await db.putRecord('students', { lrn: 'SYNTHETIC-OLD', first_name: 'Before' });
    await expect(db.importFromBackup({ payload: { students: 'not an array' } } as never)).rejects.toThrow();
    expect(await db.getAllRecords('students')).toEqual([{ lrn: 'SYNTHETIC-OLD', first_name: 'Before' }]);
  });

  it('rejects repeated learner identifiers before changing any collection', async () => {
    await db.putRecord('students', { lrn: 'SYNTHETIC-OLD', first_name: 'Before' });
    await expect(db.importFromBackup({ payload: {
      students: [{ lrn: 'SYNTHETIC-DUP' }, { lrn: 'SYNTHETIC-DUP' }],
      sections: [{ id: 'SYNTHETIC-NEW-SECTION' }],
    } })).rejects.toThrow('repeated lrn');
    expect(await db.getAllRecords('students')).toEqual([{ lrn: 'SYNTHETIC-OLD', first_name: 'Before' }]);
    expect(await db.getAllRecords('sections')).toEqual([]);
  });

  it('rolls back every table when a later store write aborts', async () => {
    await db.putRecord('students', { lrn: 'SYNTHETIC-OLD', first_name: 'Before' });
    await db.putRecord('sections', { id: 'SYNTHETIC-OLD-SECTION', section_name: 'Before' });

    const originalPut = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
      const request = originalPut.apply(this, args);
      if (this.name === 'sections') request.addEventListener('success', () => this.transaction.abort());
      return request;
    });

    await expect(db.importFromBackup({ payload: {
      students: [{ lrn: 'SYNTHETIC-NEW', first_name: 'After' }],
      sections: [{ id: 'SYNTHETIC-NEW-SECTION', section_name: 'After' }],
    } })).rejects.toThrow();
    expect(await db.getAllRecords('students')).toEqual([{ lrn: 'SYNTHETIC-OLD', first_name: 'Before' }]);
    expect(await db.getAllRecords('sections')).toEqual([{ id: 'SYNTHETIC-OLD-SECTION', section_name: 'Before' }]);
  });

  it('clears an explicitly empty collection while preserving an omitted collection', async () => {
    await db.putRecord('students', { lrn: 'SYNTHETIC-OLD', first_name: 'Before' });
    await db.putRecord('sections', { id: 'SYNTHETIC-SECTION', section_name: 'Before' });
    await db.importFromBackup({ payload: { students: [] } });
    expect(await db.getAllRecords('students')).toEqual([]);
    expect(await db.getAllRecords('sections')).toEqual([{ id: 'SYNTHETIC-SECTION', section_name: 'Before' }]);
  });

  it('restores school settings without replacing destination encryption and account state', async () => {
    localStorage.setItem('formease-db-salt-v1', 'SYNTHETIC-DESTINATION-SALT');
    localStorage.setItem('formease-db-key-envelope-v1', 'SYNTHETIC-DESTINATION-WRAPPER');
    await db.importFromBackup({ payload: {
      students: [{ lrn: 'SYNTHETIC-NEW', first_name: 'After' }],
      localStorageData: {
        'formease-db-salt-v1': 'SYNTHETIC-FOREIGN-SALT',
        'formease-db-key-envelope-v1': 'SYNTHETIC-FOREIGN-WRAPPER',
        activeSchoolYear: '2027-2028',
      },
    } });

    expect(localStorage.getItem('formease-db-salt-v1')).toBe('SYNTHETIC-DESTINATION-SALT');
    expect(localStorage.getItem('formease-db-key-envelope-v1')).toBe('SYNTHETIC-DESTINATION-WRAPPER');
    expect(localStorage.getItem('activeSchoolYear')).toBe('2027-2028');
    expect(await db.getAllRecords('students')).toEqual(expect.arrayContaining([expect.objectContaining({ lrn: 'SYNTHETIC-NEW' })]));
  });

  it('keeps the complete backed-up school-year list during a full restore', async () => {
    const years = [{ id: '2026-2027', name: '2026-2027' }, { id: '2027-2028', name: '2027-2028' }];
    await db.importFromBackup({ payload: {
      students: [{ lrn: 'SYNTHETIC-NEW' }],
      schoolYears: years,
      activeSchoolYear: '2027-2028',
    } } as never);
    expect(JSON.parse(localStorage.getItem('formease_school_years') || '[]')).toEqual(years);
    expect(localStorage.getItem('activeSchoolYear')).toBe('2027-2028');
  });

  it('finishes academic settings after an interruption following database commit', async () => {
    localStorage.setItem('formease-db-salt-v1', 'SYNTHETIC-DESTINATION-SALT');
    const nativeSetItem = Storage.prototype.setItem;
    const setter = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === 'activeSchoolYear') throw new Error('synthetic storage interruption');
      return nativeSetItem.call(this, key, value);
    });
    await expect(db.importFromBackup({ payload: {
      students: [{ lrn: 'SYNTHETIC-JOURNAL-LEARNER' }],
      activeSchoolYear: '2027-2028',
    } })).rejects.toThrow();
    expect(await db.getAllRecords('students')).toEqual([expect.objectContaining({ lrn: 'SYNTHETIC-JOURNAL-LEARNER' })]);
    expect(await db.getBackups()).toEqual([]);
    setter.mockRestore();

    await expect(db.resumePendingRestoreSettings()).resolves.toBe(true);
    expect(localStorage.getItem('activeSchoolYear')).toBe('2027-2028');
    expect(localStorage.getItem('formease-db-salt-v1')).toBe('SYNTHETIC-DESTINATION-SALT');
    await expect(db.resumePendingRestoreSettings()).resolves.toBe(false);
  });

  it('also keeps all current records when a selected multi-table restore aborts', async () => {
    await db.putRecord('students', { lrn: 'SYNTHETIC-OLD', first_name: 'Backup' });
    await db.putRecord('sections', { id: 'SYNTHETIC-OLD-SECTION', section_name: 'Backup' });
    const backup = await exportFullDatabaseBackup('synthetic source');

    await db.clearStore('students');
    await db.clearStore('sections');
    await db.putRecord('students', { lrn: 'SYNTHETIC-CURRENT', first_name: 'Current' });
    await db.putRecord('sections', { id: 'SYNTHETIC-CURRENT-SECTION', section_name: 'Current' });

    const originalPut = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
      const request = originalPut.apply(this, args);
      if (this.name === 'sections') request.addEventListener('success', () => this.transaction.abort());
      return request;
    });
    await expect(restoreBackupToFirestore(backup, {
      strategy: 'replace', selectedItems: new Set(['students', 'sections']),
    })).rejects.toThrow();
    expect(await db.getAllRecords('students')).toEqual([{ lrn: 'SYNTHETIC-CURRENT', first_name: 'Current' }]);
    expect(await db.getAllRecords('sections')).toEqual([{ id: 'SYNTHETIC-CURRENT-SECTION', section_name: 'Current' }]);
  });
});
