/**
 * Local Database Service
 * Uses IndexedDB (via browser API) for persistent, offline-first storage.
 * All data is stored locally on the user's machine.
 * 
 * Structures:
 * - schoolProfile: School metadata
 * - students: Student records
 * - sections: Class sections
 * - subjects: Learning areas/subjects
 * - classRecords: Grades and assessment data
 * - enrollments: Student enrollments
 * - announcements: School announcements
 * - attendanceRecords: Daily attendance
 * - backups: Backup metadata
 */

import type {
  SchoolProfile,
  Student,
  Section,
  Subject,
  ClassRecord,
  Enrollment,
  Announcement,
  AttendanceRecord,
  ObservedValues,
  SF2Sheet,
  HPSRecord,
} from '../types';
import { encryptPayload, decryptPayload } from '../utils/db-crypto';
import { collectBackupLocalStorage, restoreBackupLocalStorage, selectRestorableBackupSettings, resolveBestSchoolProfile } from '../utils/backup-restore';

let dbKey: CryptoKey | null = null;
// During a resumable v3.5.18 migration, records may be encrypted by either
// the new DEK or the legacy password-derived key. The legacy key is only kept
// in memory for the authenticated migration session and is never persisted.
let fallbackDbKeys: CryptoKey[] = [];

export function setDatabaseEncryptionKey(
  key: CryptoKey | null,
  fallbackKeys: CryptoKey[] = [],
  runIndexingMigration = true,
) {
  dbKey = key;
  fallbackDbKeys = key ? fallbackKeys.filter(fallback => fallback !== key) : [];
  if (key && runIndexingMigration) {
    void migrateDatabaseForIndexing();
  }
}

export const ENCRYPTED_STORE_NAMES = [
  'students',
  'classRecords',
  'enrollments',
  'attendanceRecords',
  'sf2Sheets',
  'gradingSheetRecords',
  'observedValues',
  'automated_backups'
] as const;
const ENCRYPTED_STORES = new Set<string>(ENCRYPTED_STORE_NAMES);

interface EncryptedEnvelope {
  lrn?: string;
  id?: string;
  iv: string;
  ciphertext: string;
  is_encrypted: boolean;
  // Projected index fields for indexing
  student_lrn?: string;
  subject_id?: string;
  school_year?: string;
}

export function isEncryptedDatabaseEnvelope(record: unknown): boolean {
  const candidate = record as Record<string, unknown> | null;
  return Boolean(candidate?.is_encrypted && candidate.iv && candidate.ciphertext);
}

export interface QuarantinedRecord {
  id: string;
  storeName: string;
  key?: string;
  timestamp: number;
  error: string;
  rawEnvelope: unknown;
}

const quarantinedRecords: QuarantinedRecord[] = [];

export function getQuarantinedRecords(): QuarantinedRecord[] {
  return [...quarantinedRecords];
}

export function clearQuarantinedRecords(): void {
  quarantinedRecords.length = 0;
}

export function getQuarantineStats(): { total: number; byStore: Record<string, number> } {
  const byStore: Record<string, number> = {};
  for (const q of quarantinedRecords) {
    byStore[q.storeName] = (byStore[q.storeName] || 0) + 1;
  }
  return { total: quarantinedRecords.length, byStore };
}

export function exportQuarantineArtifact(): string {
  const payload = {
    exportedAt: new Date().toISOString(),
    totalQuarantined: quarantinedRecords.length,
    records: quarantinedRecords.map(q => ({
      id: q.id,
      storeName: q.storeName,
      key: q.key,
      timestamp: q.timestamp,
      error: q.error,
      rawEnvelope: q.rawEnvelope,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

function recordQuarantinedEntry(storeName: string, raw: unknown, error: unknown): void {
  const id = `quarantine-${crypto.randomUUID()}`;
  let key: string | undefined;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const k = obj.lrn ?? obj.id ?? obj.school_id;
    if (k !== undefined) key = String(k);
  }
  quarantinedRecords.push({
    id,
    storeName,
    key,
    timestamp: Date.now(),
    error: error instanceof Error ? error.message : String(error),
    rawEnvelope: raw,
  });
}

async function decryptWithAvailableKeys<T>(ciphertext: string, iv: string): Promise<T> {
  if (!dbKey) throw new Error('Database encryption key is unavailable.');
  let lastError: unknown;
  for (const key of [dbKey, ...fallbackDbKeys]) {
    try {
      return await decryptPayload<T>(ciphertext, iv, key);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Database record could not be decrypted.');
}

async function encryptRecordIfNeeded<T>(storeName: string, record: T): Promise<T | EncryptedEnvelope> {
  if (!dbKey || !ENCRYPTED_STORES.has(storeName)) {
    return record;
  }
  
  const keyField = storeName === 'students' ? 'lrn' : 'id';
  let keyValue = (record as Record<string, unknown>)[keyField];
  
  if (!keyValue) {
    return record;
  }

  let finalRecord = record;
  const rawRecord = record as Record<string, unknown>;
  if (isEncryptedDatabaseEnvelope(rawRecord)) {
    try {
      const decrypted = await decryptWithAvailableKeys<T>(rawRecord.ciphertext as string, rawRecord.iv as string);
      finalRecord = decrypted;
      keyValue = (finalRecord as Record<string, unknown>)[keyField] || keyValue;
    } catch (err) {
      throw new Error(`Encrypted ${storeName} record could not be opened for saving.`, { cause: err });
    }
  }
  
  const { ciphertext, iv } = await encryptPayload(finalRecord, dbKey);
  
  const envelope: EncryptedEnvelope = {
    [keyField]: keyValue,
    iv,
    ciphertext,
    is_encrypted: true
  } as unknown as EncryptedEnvelope;

  // Project selected index fields in plain text on the envelope
  const rec = finalRecord as Record<string, unknown>;
  if (rec.student_lrn) envelope.student_lrn = rec.student_lrn as string;
  if (rec.subject_id) envelope.subject_id = rec.subject_id as string;
  if (rec.school_year) envelope.school_year = rec.school_year as string;
  
  return envelope;
}

async function decryptRecordIfNeeded<T>(storeName: string, record: unknown): Promise<T> {
  if (!record) return record as T;
  const rawRecord = record as Record<string, unknown>;
  if (!isEncryptedDatabaseEnvelope(rawRecord)) {
    return record as T;
  }
  if (!dbKey) {
    throw new Error(`Encrypted ${storeName} record cannot be opened without the database key.`);
  }
  
  try {
    return await decryptWithAvailableKeys<T>(rawRecord.ciphertext as string, rawRecord.iv as string);
  } catch (error) {
    throw new Error(`Encrypted ${storeName} record could not be decrypted. Its stored data was not changed.`, { cause: error });
  }
}

// IndexedDB database name and stores
export const PRODUCTION_DB_NAME = 'FormEaseDB';
export const PREVIEW_DB_NAME = 'FormEaseDB_Preview';
export const DB_VERSION = 13;

export function isPreviewMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('formease_preview_mode_active') === 'true';
  } catch {
    return false;
  }
}

export function getActiveDbName(): string {
  return isPreviewMode() ? PREVIEW_DB_NAME : PRODUCTION_DB_NAME;
}

export interface BackupMetadata {
  id: string;
  timestamp: number;
  label: string;
  fileSize: number;
  recordCounts: {
    students: number;
    sections: number;
    subjects: number;
    classRecords: number;
    enrollments: number;
    announcements: number;
    attendanceRecords: number;
    gradingSheetRecords?: number;
    observedValues?: number;
  };
}

let dbInstance: IDBDatabase | null = null;

let activeWrites = 0;
let writeGeneration = 0;
let installWriteBarrier = false;
const writeListeners = new Set<(activeCount: number) => void>();
const changeListeners = new Set<(storeName: string, type: 'put' | 'delete') => void>();

export function onDatabaseWriteChange(listener: (activeCount: number) => void): () => void {
  writeListeners.add(listener);
  // Call immediately with the current count
  listener(activeWrites);
  return () => {
    writeListeners.delete(listener);
  };
}

export function onDatabaseChange(listener: (storeName: string, type: 'put' | 'delete') => void): () => void {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
}

function notifyWriteChange(change: number) {
  // Count both starts and completions: a write already in flight when a
  // safety snapshot begins must invalidate that snapshot when it finishes.
  if (change !== 0) writeGeneration++;
  activeWrites += change;
  writeListeners.forEach(listener => {
    try {
      listener(activeWrites);
    } catch (e) {
      console.error('Error in database write listener:', e);
    }
  });
}

function notifyChange(storeName: string, type: 'put' | 'delete') {
  changeListeners.forEach(listener => {
    try {
      listener(storeName, type);
    } catch (e) {
      console.error('Error in database change listener:', e);
    }
  });
}

/**
 * Open IndexedDB database with all required object stores
 */
export const STORE_CONFIGS: Array<[string, string]> = [
  ['schoolProfile', 'school_id'],
  ['students', 'lrn'],
  ['sections', 'id'],
  ['subjects', 'id'],
  ['classRecords', 'id'],
  ['enrollments', 'id'],
  ['announcements', 'id'],
  ['attendanceRecords', 'id'],
  ['sf2Sheets', 'id'],
  ['hpsRecords', 'id'],
  ['gradingSheetRecords', 'id'],
  ['observedValues', 'id'],
  ['backups', 'id'],
  ['automated_backups', 'id'],
  ['activityLog', 'id'],
  ['users', 'id'],
];

export function applyDatabaseSchema(
  db: IDBDatabase,
  transaction: IDBTransaction | null,
  extraStores: string[] = []
): void {
  // A keyPath cannot be changed in place. Never delete a store before
  // copying its contents: an update must either preserve every learner or
  // abort without changing the user's existing database.
  if (db.objectStoreNames.contains('students')) {
    const studentStore = transaction?.objectStore('students');
    if (studentStore && studentStore.keyPath !== 'lrn') {
      console.warn('Student store keyPath mismatch detected. Migrating learner records to the lrn keyPath...');
      const readLegacyStudents = studentStore.getAll();

      readLegacyStudents.onerror = () => {
        console.error('Unable to read legacy learner records. Aborting migration to protect existing data.', readLegacyStudents.error);
        transaction?.abort();
      };

      readLegacyStudents.onsuccess = () => {
        const legacyStudents = Array.isArray(readLegacyStudents.result) ? readLegacyStudents.result : [];
        const invalidRecords = legacyStudents.filter(record => {
          const lrn = (record as Record<string, unknown>)?.lrn;
          return typeof lrn !== 'string' || lrn.trim() === '';
        });

        // A record without an LRN cannot be mapped safely into the
        // corrected store. Abort the schema upgrade so IndexedDB
        // rolls back and the client can recover from a backup.
        if (invalidRecords.length > 0) {
          console.error(`Found ${invalidRecords.length} legacy learner record(s) without an LRN. Aborting migration to prevent data loss.`);
          transaction?.abort();
          return;
        }

        // The old store was keyed by id, so distinct learners may share an
        // LRN. A put into the replacement store would silently overwrite one.
        const lrns = legacyStudents.map(record => String(record.lrn).trim());
        if (new Set(lrns).size !== lrns.length) {
          console.error('Legacy learner records contain duplicate LRNs. Aborting migration to preserve every record.');
          transaction?.abort();
          return;
        }

        db.deleteObjectStore('students');
        const correctedStore = db.createObjectStore('students', { keyPath: 'lrn' });
        for (const record of legacyStudents) {
          correctedStore.add(record);
        }
        console.info(`Migrated ${legacyStudents.length} learner record(s) to the corrected students store.`);
      };
    }
  }

  // Create object stores if they don't exist
  for (const [store, keyPath] of STORE_CONFIGS) {
    if (!db.objectStoreNames.contains(store)) {
      db.createObjectStore(store, { keyPath });
    }
  }

  for (const store of extraStores) {
    if (!db.objectStoreNames.contains(store)) {
      const cfg = STORE_CONFIGS.find(([s]) => s === store);
      const keyPath = cfg ? cfg[1] : (store === 'schoolProfile' ? 'school_id' : store === 'students' ? 'lrn' : 'id');
      db.createObjectStore(store, { keyPath });
    }
  }

  // Create compound indexes if version is upgraded
  if (db.objectStoreNames.contains('classRecords') && transaction) {
    const classRecordsStore = transaction.objectStore('classRecords');
    if (!classRecordsStore.indexNames.contains('by-student-subject-sy')) {
      classRecordsStore.createIndex('by-student-subject-sy', ['student_lrn', 'subject_id', 'school_year'], { unique: false });
    }
    if (!classRecordsStore.indexNames.contains('by-student-sy')) {
      classRecordsStore.createIndex('by-student-sy', ['student_lrn', 'school_year'], { unique: false });
    }
  }

  if (db.objectStoreNames.contains('gradingSheetRecords') && transaction) {
    const gradingSheetRecordsStore = transaction.objectStore('gradingSheetRecords');
    if (!gradingSheetRecordsStore.indexNames.contains('by-student-subject-sy')) {
      gradingSheetRecordsStore.createIndex('by-student-subject-sy', ['student_lrn', 'subject_id', 'school_year'], { unique: false });
    }
  }

  // Create student_lrn indexes for cascading updates
  const storesWithLrn = ['classRecords', 'gradingSheetRecords', 'enrollments', 'attendanceRecords', 'observedValues'];
  for (const storeName of storesWithLrn) {
    if (db.objectStoreNames.contains(storeName) && transaction) {
      const store = transaction.objectStore(storeName);
      if (!store.indexNames.contains('by-student-lrn')) {
        store.createIndex('by-student-lrn', 'student_lrn', { unique: false });
      }
    }
  }
}

function openWithUpgrade(
  targetDbName: string,
  version: number,
  extraStores: string[] = []
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(targetDbName, version);
    req.onerror = () => reject(req.error);
    req.onblocked = () => {
      console.warn('[database] Database upgrade blocked by another active connection.');
    };
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction;
      applyDatabaseSchema(db, transaction, extraStores);
    };
    req.onsuccess = () => resolve(req.result);
  });
}

/**
 * Ensures that all specified stores exist in the database, automatically
 * triggering a schema upgrade if any store is missing.
 */
export async function ensureDatabaseStores(storeNames: string[]): Promise<IDBDatabase> {
  let db = await openDatabase();
  const missing = storeNames.filter(store => !db.objectStoreNames.contains(store));
  if (missing.length === 0) {
    return db;
  }
  console.info(`[database] Auto-creating missing database stores: ${missing.join(', ')}`);
  const targetDbName = db.name;
  const nextVersion = Math.max(DB_VERSION, db.version + 1);
  db.close();
  if (dbInstance === db) {
    dbInstance = null;
  }

  db = await openWithUpgrade(targetDbName, nextVersion, missing);
  dbInstance = db;
  return db;
}

/**
 * Open IndexedDB database with all required object stores
 */
function openDatabase(): Promise<IDBDatabase> {
  const targetDbName = getActiveDbName();
  if (dbInstance && dbInstance.name === targetDbName) {
    return Promise.resolve(dbInstance);
  }
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (_e) {
      // ignore
    }
    dbInstance = null;
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(targetDbName, DB_VERSION);

    request.onerror = () => {
      // If version error (database on disk has higher version than DB_VERSION), open with current version
      if (
        request.error &&
        (request.error.name === 'VersionError' ||
          String(request.error.message).toLowerCase().includes('version'))
      ) {
        const fallbackReq = indexedDB.open(targetDbName);
        fallbackReq.onerror = () => reject(fallbackReq.error);
        fallbackReq.onsuccess = async () => {
          let fbDb = fallbackReq.result;
          const missing = STORE_CONFIGS.filter(([s]) => !fbDb.objectStoreNames.contains(s));
          if (missing.length > 0) {
            try {
              const upgradeVer = fbDb.version + 1;
              fbDb.close();
              fbDb = await openWithUpgrade(targetDbName, upgradeVer);
            } catch (err) {
              console.error('[database] Schema heal fallback failed:', err);
            }
          }
          dbInstance = fbDb;
          resolve(fbDb);
        };
        return;
      }
      reject(request.error);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction;
      applyDatabaseSchema(db, transaction);
    };

    request.onsuccess = async () => {
      let db = request.result;
      const missing = STORE_CONFIGS.filter(([s]) => !db.objectStoreNames.contains(s));
      if (missing.length > 0) {
        console.warn(`[database] Auto-healing missing stores: ${missing.map(m => m[0]).join(', ')}`);
        try {
          const upgradeVer = Math.max(DB_VERSION, db.version + 1);
          db.close();
          db = await openWithUpgrade(targetDbName, upgradeVer);
        } catch (err) {
          console.error('[database] Automatic schema upgrade failed:', err);
        }
      }
      dbInstance = db;
      resolve(db);
    };
  });
}


/**
 * Get all records from a store
 */
async function getAllRecords<T>(storeName: string, options: { strict?: boolean } = {}): Promise<T[]> {
  const db = await openDatabase();
  if (!db.objectStoreNames.contains(storeName)) {
    return [];
  }
  const rawList = await new Promise<unknown[]>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  if (!options.strict && ENCRYPTED_STORES.has(storeName)) {
    const results: T[] = [];
    let lastError: unknown;
    for (const raw of rawList) {
      try {
        const decrypted = await decryptRecordIfNeeded<T>(storeName, raw);
        results.push(decrypted);
      } catch (err) {
        lastError = err;
        recordQuarantinedEntry(storeName, raw, err);
        console.warn(`[FormEase Pro] Unreadable ${storeName} entry could not be decrypted with available keys; quarantined entry.`, err);
      }
    }
    if (rawList.length > 0 && results.length === 0) {
      if (storeName === 'automated_backups' || storeName === 'gradingSheetRecords' || storeName === 'observedValues') {
        return [];
      }
      throw lastError instanceof Error
        ? lastError
        : new Error(`Encrypted ${storeName} record could not be decrypted. Its stored data was not changed.`);
    }
    return results;
  }
  return Promise.all(rawList.map(raw => decryptRecordIfNeeded<T>(storeName, raw)));
}

/**
 * Get a single record by key
 */
async function getRecord<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDatabase();
  if (!db.objectStoreNames.contains(storeName)) {
    return undefined;
  }
  const raw = await new Promise<unknown>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  if (!raw) return undefined;
  if (ENCRYPTED_STORES.has(storeName)) {
    try {
      return await decryptRecordIfNeeded<T>(storeName, raw);
    } catch (err) {
      recordQuarantinedEntry(storeName, raw, err);
      return undefined;
    }
  }
  return decryptRecordIfNeeded<T>(storeName, raw);
}

/**
 * Add or update a record
 */
export interface AtomicRecordChange {
  store: string;
  puts?: object[];
  deletes?: IDBValidKey[];
}

/** Commit related edits together. Encryption must finish before the transaction starts. */
async function commitRecordChanges(changes: AtomicRecordChange[], settings: Record<string, string> = {}): Promise<void> {
  const pendingSettings = selectRestorableBackupSettings(settings);
  const active = changes.filter(change => change.puts?.length || change.deletes?.length);
  if (!active.length && !Object.keys(pendingSettings).length) return;
  assertWritesAllowed();
  await resumePendingRestoreSettings();
  notifyWriteChange(1);
  try {
    const prepared = await Promise.all(active.map(async change => ({
      ...change,
      puts: await Promise.all((change.puts || []).map(record => encryptRecordIfNeeded(change.store, record))),
    })));
    const database = await openDatabase();
    const stores = [...new Set(prepared.map(change => change.store))];
    if (Object.keys(pendingSettings).length && !stores.includes('backups')) stores.push('backups');
    for (const store of stores) {
      if (!database.objectStoreNames.contains(store)) throw new Error(`Database store "${store}" is unavailable; changes were not saved.`);
    }
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(stores, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Related record changes were aborted.'));
      try {
        for (const change of prepared) {
          const store = transaction.objectStore(change.store);
          for (const key of change.deletes || []) store.delete(key);
          for (const record of change.puts) store.put(record);
        }
        if (Object.keys(pendingSettings).length) {
          transaction.objectStore('backups').put({
            id: RESTORE_SETTINGS_JOURNAL_ID,
            kind: 'restore-settings-v1',
            settings: pendingSettings,
          } satisfies RestoreSettingsJournal);
        }
      } catch (error) {
        transaction.abort();
        reject(error);
      }
    });
    for (const change of active) notifyChange(change.store, change.puts?.length ? 'put' : 'delete');
  } finally {
    notifyWriteChange(-1);
  }
  if (Object.keys(pendingSettings).length) await resumePendingRestoreSettings();
}

async function putRecord<T>(
  storeName: string,
  record: T
): Promise<string> {
  assertWritesAllowed();
  notifyWriteChange(1);
  try {
    const encrypted = await encryptRecordIfNeeded(storeName, record);
    const db = await openDatabase();
    if (!db.objectStoreNames.contains(storeName)) {
      throw new Error(`Database store "${storeName}" is unavailable; record was not saved.`);
    }
    const result = await new Promise<string>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(encrypted);
      let savedKey = '';
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { savedKey = String(request.result); };
      transaction.oncomplete = () => resolve(savedKey);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Database write was aborted.'));
    });
    notifyChange(storeName, 'put');
    return result;
  } finally {
    notifyWriteChange(-1);
  }
}

/**
 * Add or update multiple records in a single transaction (Bulk write)
 */
async function putRecordsBulk<T>(
  storeName: string,
  records: T[]
): Promise<void> {
  if (records.length === 0) return;
  assertWritesAllowed();
  notifyWriteChange(1);
  try {
    const encryptedRecords = await Promise.all(
      records.map(record => encryptRecordIfNeeded(storeName, record))
    );
    const db = await openDatabase();
    if (!db.objectStoreNames.contains(storeName)) {
      throw new Error(`Database store "${storeName}" is unavailable; records were not saved.`);
    }
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Database bulk write was aborted.'));

      try {
        for (const record of encryptedRecords) {
          store.put(record);
        }
      } catch (error) {
        // A synchronous DataError/DataCloneError does not abort IndexedDB
        // automatically. Roll back earlier queued writes before rejecting.
        transaction.abort();
        reject(error);
      }
    });
    notifyChange(storeName, 'put');
  } finally {
    notifyWriteChange(-1);
  }
}

/**
 * Delete a record
 */
async function deleteRecord(storeName: string, key: string): Promise<void> {
  assertWritesAllowed();
  notifyWriteChange(1);
  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains(storeName)) {
      throw new Error(`Database store "${storeName}" is unavailable; record was not deleted.`);
    }
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Database delete was aborted.'));
    });
    notifyChange(storeName, 'delete');
  } finally {
    notifyWriteChange(-1);
  }
}

/**
 * Delete multiple records in a single transaction
 */
async function deleteRecordsBulk(storeName: string, keys: string[]): Promise<void> {
  if (!keys || keys.length === 0) return;
  assertWritesAllowed();
  notifyWriteChange(keys.length);
  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains(storeName)) {
      throw new Error(`Database store "${storeName}" is unavailable; records were not deleted.`);
    }
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Database bulk delete was aborted.'));

      try {
        for (const key of keys) {
          store.delete(key);
        }
      } catch (error) {
        transaction.abort();
        reject(error);
      }
    });
    notifyChange(storeName, 'delete');
  } finally {
    notifyWriteChange(-keys.length);
  }
}

/**
 * Clear all records from a store
 */
async function clearStore(storeName: string): Promise<void> {
  assertWritesAllowed();
  notifyWriteChange(1);
  try {
    const db = await openDatabase();
    if (!db.objectStoreNames.contains(storeName)) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Database clear was aborted.'));
    });
  } finally {
    notifyWriteChange(-1);
  }
}

/**
 * Get total record count in a store
 */
async function getStoreCount(storeName: string): Promise<number> {
  const db = await openDatabase();
  if (!db.objectStoreNames.contains(storeName)) {
    return 0;
  }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}


/**
 * Export all data as JSON for backup
 */
async function exportAllData() {
  const [
    schoolProfile,
    students,
    sections,
    subjects,
    classRecords,
    enrollments,
    announcements,
    attendanceRecords,
    sf2Sheets,
    hpsRecords,
    gradingSheetRecords,
    observedValues,
    users,
    activityLog
  ] = await Promise.all([
    getAllRecords<SchoolProfile>('schoolProfile'),
    getAllRecords<Student>('students'),
    getAllRecords<Section>('sections'),
    getAllRecords<Subject>('subjects'),
    getAllRecords<ClassRecord>('classRecords'),
    getAllRecords<Enrollment>('enrollments'),
    getAllRecords<Announcement>('announcements'),
    getAllRecords<AttendanceRecord>('attendanceRecords'),
    getAllRecords<SF2Sheet>('sf2Sheets'),
    getAllRecords<HPSRecord>('hpsRecords'),
    getAllRecords<ClassRecord>('gradingSheetRecords'),
    getAllRecords<ObservedValues>('observedValues'),
    getAllRecords<unknown>('users'),
    getAllRecords<unknown>('activityLog'),
  ]);

  const localStorageData = collectBackupLocalStorage();

  return {
    schoolProfile,
    students,
    sections,
    subjects,
    classRecords,
    enrollments,
    announcements,
    attendanceRecords,
    sf2Sheets,
    hpsRecords,
    gradingSheetRecords,
    observedValues,
    users,
    activityLog,
    localStorageData,
  };
}

/** Read every restorable store under one IndexedDB snapshot. Any failure rejects. */
async function readBackupSnapshot(): Promise<Awaited<ReturnType<typeof exportAllData>>> {
  const stores = [
    'schoolProfile', 'students', 'sections', 'subjects', 'classRecords', 'enrollments',
    'announcements', 'attendanceRecords', 'sf2Sheets', 'hpsRecords', 'gradingSheetRecords',
    'observedValues', 'users', 'activityLog',
  ];
  const database = await openDatabase();
  const missing = stores.filter(store => !database.objectStoreNames.contains(store));
  if (missing.length) throw new Error(`Required backup stores are unavailable: ${missing.join(', ')}.`);
  const rawSnapshot = await new Promise<Record<string, unknown[]>>((resolve, reject) => {
    const transaction = database.transaction(stores, 'readonly');
    const snapshot: Record<string, unknown[]> = {};
    transaction.onerror = () => reject(transaction.error || new Error('Backup snapshot read failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('Backup snapshot read was aborted.'));
    transaction.oncomplete = () => resolve(snapshot);
    for (const name of stores) {
      const request = transaction.objectStore(name).getAll();
      request.onerror = () => reject(request.error || new Error(`Backup read failed for ${name}.`));
      request.onsuccess = () => { snapshot[name] = request.result; };
    }
  });
  const records = await Promise.all(stores.map(async store => [
    store,
    await Promise.all(rawSnapshot[store].map(item => decryptRecordIfNeeded(store, item))),
  ] as const));
  return Object.fromEntries(records) as unknown as Awaited<ReturnType<typeof exportAllData>>;
}

export interface BackupImportPayload {
  schoolProfile?: SchoolProfile[] | SchoolProfile | Record<string, unknown>;
  students?: unknown[];
  studentProfiles?: unknown[];
  learners?: unknown[];
  sections?: unknown[];
  classes?: unknown[];
  subjects?: unknown[];
  learningAreas?: unknown[];
  classRecords?: unknown[];
  grades?: unknown[];
  class_records?: unknown[];
  enrollments?: unknown[];
  announcements?: unknown[];
  attendanceRecords?: unknown[];
  attendance?: unknown[];
  sf2Sheets?: unknown[];
  sf2?: unknown[];
  hpsRecords?: unknown[];
  hps?: unknown[];
  gradingSheetRecords?: unknown[];
  grading_sheets?: unknown[];
  consolidatedGrades?: unknown[];
  observedValues?: unknown[];
  coreValues?: unknown[];
  users?: unknown[];
  activityLog?: unknown[];
  localStorageData?: Record<string, string>;
  payload?: BackupImportPayload;
  data?: BackupImportPayload;
  [key: string]: unknown;
}

function assertWritesAllowed(): void {
  if (installWriteBarrier) throw new Error('Database changes are paused while a verified update is installing.');
}

function getWriteGeneration(): number { return writeGeneration; }

function acquireInstallWriteBarrier(expectedGeneration: number): boolean {
  if (installWriteBarrier || activeWrites !== 0 || writeGeneration !== expectedGeneration) return false;
  installWriteBarrier = true;
  return true;
}

function releaseInstallWriteBarrier(): void { installWriteBarrier = false; }

export interface RestoreStoreChange {
  store: string;
  records: unknown[];
  replace: boolean;
}

const RESTORE_SETTINGS_JOURNAL_ID = 'formease-restore-settings-pending-v1';
interface RestoreSettingsJournal {
  id: typeof RESTORE_SETTINGS_JOURNAL_ID;
  kind: 'restore-settings-v1';
  settings: Record<string, string>;
}

/** Complete academic settings after a committed restore, including after restart. */
async function resumePendingRestoreSettings(): Promise<boolean> {
  const journal = await getRecord<RestoreSettingsJournal>('backups', RESTORE_SETTINGS_JOURNAL_ID);
  if (!journal) return false;
  if (journal.kind !== 'restore-settings-v1') throw new Error('A pending restore journal is invalid. No further writes are safe.');
  restoreBackupLocalStorage(journal.settings);
  await deleteRecord('backups', RESTORE_SETTINGS_JOURNAL_ID);
  return true;
}

/** Encrypt first; commit all selected tables in one IndexedDB transaction. */
async function unsealRecord<T = unknown>(storeName: string, record: unknown): Promise<T> {
  if (!isEncryptedDatabaseEnvelope(record)) {
    return record as T;
  }
  const envelope = record as Record<string, unknown>;
  try {
    return await decryptWithAvailableKeys<T>(envelope.ciphertext as string, envelope.iv as string);
  } catch {
    throw new Error(`Backup ${storeName} contains encrypted records that could not be decrypted with your current account key. Existing records were not changed.`);
  }
}

async function applyRestoreBatch(changes: RestoreStoreChange[], settings: Record<string, string> = {}): Promise<void> {
  assertWritesAllowed();
  await resumePendingRestoreSettings();
  const pendingSettings = selectRestorableBackupSettings(settings);
  if (changes.length === 0 && Object.keys(pendingSettings).length === 0) return;
  if (new Set(changes.map(change => change.store)).size !== changes.length) {
    throw new Error('A backup restore cannot update the same collection twice.');
  }
  const unsealedChanges = await Promise.all(changes.map(async change => ({
    ...change,
    records: await Promise.all(change.records.map(record => unsealRecord(change.store, record))),
  })));
  for (const change of unsealedChanges) {
    const keyField = change.store === 'students' ? 'lrn' : change.store === 'schoolProfile' ? 'school_id' : 'id';
    const seenKeys = new Set<string>();
    for (const record of change.records) {
      const rawKey = record && typeof record === 'object' ? (record as Record<string, unknown>)[keyField] : undefined;
      const key = (typeof rawKey === 'string' || typeof rawKey === 'number') ? String(rawKey).trim() : '';
      if (!key || seenKeys.has(key)) {
        throw new Error(`Backup ${change.store} has a missing or repeated ${keyField}. Existing records were not changed.`);
      }
      seenKeys.add(key);
      if (record && typeof record === 'object' && typeof rawKey === 'number') {
        (record as Record<string, unknown>)[keyField] = key;
      }
    }
  }
  const encryptedPlan = await Promise.all(unsealedChanges.map(async change => ({
    ...change,
    records: await Promise.all(change.records.map(record => encryptRecordIfNeeded(change.store, record))),
  })));
  let database = await openDatabase();

  // Ensure all stores in encryptedPlan and backups exist before opening transaction
  const requiredStores = [...encryptedPlan.map(change => change.store)];
  if (Object.keys(pendingSettings).length > 0 && !requiredStores.includes('backups')) {
    requiredStores.push('backups');
  }
  const missingStores = requiredStores.filter(store => !database.objectStoreNames.contains(store));
  if (missingStores.length > 0) {
    try {
      database = await ensureDatabaseStores(missingStores);
    } catch (ensureErr) {
      console.warn('[database] Failed to auto-create missing stores:', ensureErr);
    }
  }

  // Filter executable changes; if an unavailable store has 0 records, skip it safely
  const executableChanges: typeof encryptedPlan = [];
  for (const change of encryptedPlan) {
    if (!database.objectStoreNames.contains(change.store)) {
      if (change.records.length === 0) {
        console.warn(`[database] Skipping empty change for unavailable store "${change.store}".`);
        continue;
      }
      throw new Error(`Required database store "${change.store}" is unavailable. Existing records were not changed.`);
    }
    executableChanges.push(change);
  }

  if (Object.keys(pendingSettings).length > 0 && !database.objectStoreNames.contains('backups')) {
    throw new Error('The restore journal store is unavailable. Existing records were not changed.');
  }

  // The journal commits with the records; a crash after commit leaves a
  // deterministic settings step that startup must finish before showing data.
  const storeNames = [...new Set(executableChanges.map(change => change.store))];
  if (Object.keys(pendingSettings).length > 0 && !storeNames.includes('backups')) storeNames.push('backups');
  notifyWriteChange(1);
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeNames, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Backup restore was aborted.'));
      try {
        for (const change of executableChanges) {
          const objectStore = transaction.objectStore(change.store);
          if (change.replace) objectStore.clear();
          for (const row of change.records) objectStore.put(row);
        }
        if (Object.keys(pendingSettings).length > 0) {
          transaction.objectStore('backups').put({
            id: RESTORE_SETTINGS_JOURNAL_ID,
            kind: 'restore-settings-v1',
            settings: pendingSettings,
          } satisfies RestoreSettingsJournal);
        }
      } catch (error) {
        transaction.abort();
        reject(error);
      }
    });
  } finally {
    notifyWriteChange(-1);
  }
  for (const change of executableChanges) notifyChange(change.store, 'put');
}

/**
 * Extract true payload from arbitrary nested backup structures
 * (handles ComprehensiveBackup, AutomatedBackupEntry, raw dumps, etc.)
 */
export function extractBackupPayload(rawBackupData: unknown): Record<string, unknown> | null {
  if (!rawBackupData) return null;

  if (typeof rawBackupData === 'string') {
    try {
      const parsed = JSON.parse(rawBackupData);
      if (parsed && typeof parsed === 'object') {
        rawBackupData = parsed;
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  if (!rawBackupData || typeof rawBackupData !== 'object') return null;

  let current: unknown = rawBackupData;
  for (let depth = 0; depth < 6; depth++) {
    if (!current || typeof current !== 'object') break;
    const obj = current as Record<string, unknown>;

    // Detect if current level holds direct table collections
    const hasPrimaryTables = (
      Array.isArray(obj.students) ||
      Array.isArray(obj.studentProfiles) ||
      Array.isArray(obj.learners) ||
      Array.isArray(obj.sections) ||
      Array.isArray(obj.classes) ||
      Array.isArray(obj.subjects) ||
      Array.isArray(obj.learningAreas) ||
      Array.isArray(obj.classRecords) ||
      Array.isArray(obj.grades) ||
      obj.schoolProfile !== undefined ||
      obj.school_profile !== undefined
    );

    if (hasPrimaryTables) {
      return obj;
    }

    if (obj.payload && typeof obj.payload === 'object' && !Array.isArray(obj.payload)) {
      current = obj.payload;
    } else if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      current = obj.data;
    } else if (obj.backup && typeof obj.backup === 'object' && !Array.isArray(obj.backup)) {
      current = obj.backup;
    } else {
      break;
    }
  }

  return (current && typeof current === 'object') ? (current as Record<string, unknown>) : null;
}

/**
 * Import data from backup JSON with 100% backward compatibility
 */
async function importFromBackup(rawBackupData: BackupImportPayload) {
  const payload = extractBackupPayload(rawBackupData);
  if (!payload) throw new Error('Backup does not contain readable school data.');

  const { validateBackupPayloadStructure } = await import('../utils/backup-restore');
  const structureCheck = validateBackupPayloadStructure(rawBackupData);
  if (!structureCheck.isValid) {
    throw new Error(structureCheck.issues.join(' '));
  }

  const source = rawBackupData as Record<string, unknown>;
  const checkedSource = source._checksum ? source : source.data as Record<string, unknown> | undefined;
  if (checkedSource?._checksum) {
    const { validateEmbeddedChecksum, hasValidPayloadHash } = await import('../utils/backup-integrity');
    const check = await validateEmbeddedChecksum(checkedSource);
    if (!check.valid || (check.strength === 'legacy' && !await hasValidPayloadHash(checkedSource))) {
      throw new Error('Backup integrity verification failed. Existing records were not changed.');
    }
  }

  // Unseal any encrypted envelopes found in backup collections before processing
  for (const [key, rows] of Object.entries(payload)) {
    if (Array.isArray(rows) && rows.some(isEncryptedDatabaseEnvelope)) {
      payload[key] = await Promise.all(rows.map(row => unsealRecord(key, row)));
    }
  }

  const collectionAliases: Record<string, string[]> = {
    students: ['students', 'studentProfiles', 'learners'],
    sections: ['sections', 'classes'],
    subjects: ['subjects', 'learningAreas'],
    classRecords: ['classRecords', 'grades', 'class_records'],
    enrollments: ['enrollments'],
    announcements: ['announcements'],
    attendanceRecords: ['attendanceRecords', 'attendance'],
    sf2Sheets: ['sf2Sheets', 'sf2'],
    hpsRecords: ['hpsRecords', 'hps'],
    gradingSheetRecords: ['gradingSheetRecords', 'consolidatedGrades', 'grading_sheets'],
    observedValues: ['observedValues', 'coreValues'],
    users: ['users'],
    activityLog: ['activityLog'],
  };
  const staged = new Map<string, unknown[]>();
  for (const [store, aliases] of Object.entries(collectionAliases)) {
    const present = aliases.find(alias => Object.prototype.hasOwnProperty.call(payload, alias));
    if (!present) continue;
    const rows = payload[present];
    if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
      throw new Error(`Backup ${present} collection is invalid. Existing records were not changed.`);
    }
    staged.set(store, []); // An explicitly empty collection means clear it.
  }
  const stageRows = (store: string, rows: unknown[]): void => {
    staged.set(store, rows);
  };

  // 1. School Profile
  const rawProfile = payload.schoolProfile || payload.school_profile || payload.school || payload.profile;
  let profileRecord: SchoolProfile | undefined;
  if (rawProfile) {
    const resolved = resolveBestSchoolProfile(rawProfile);
    if (resolved) {
      profileRecord = resolved;
      stageRows('schoolProfile', [profileRecord]);
    } else if (typeof rawProfile === 'object' && !Array.isArray(rawProfile)) {
      const p = rawProfile as Record<string, unknown>;
      const school_id = String(p.school_id || p.id || '').trim();
      const schoolName = String(p.name || p.school_name || '').trim();
      if (school_id && schoolName && schoolName.toLowerCase() !== 'school name') {
        profileRecord = {
          ...p,
          school_id,
          name: schoolName,
          ...(p.head_name || p.principal_name ? { head_name: String(p.head_name || p.principal_name).trim() } : {}),
          ...(p.head_position || p.principal_position ? { head_position: String(p.head_position || p.principal_position).trim() } : {}),
        } as unknown as SchoolProfile;
        stageRows('schoolProfile', [profileRecord]);
      }
    }
  }

  // 2. Students (support students, studentProfiles, learners)
  const rawStudents = (payload.students || payload.studentProfiles || payload.learners) as unknown[] | undefined;
  if (Array.isArray(rawStudents) && rawStudents.length > 0) {
    const sanitizedStudents: Student[] = rawStudents
      .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
      .map((s, idx) => {
        const rawLrn = s.lrn ?? s.student_lrn ?? s.LRN ?? s.id ?? `TEMP-RESTORE-${idx}`;
        const lrn = String(rawLrn).trim() || `TEMP-RESTORE-${idx}`;
        return {
          ...s,
          lrn,
          student_section: typeof s.student_section === 'string' ? s.student_section.trim() : (s.student_section || ''),
        } as unknown as Student;
      });
    if (sanitizedStudents.length > 0) {
      stageRows('students', sanitizedStudents);
    }
  }

  // 3. Sections (support sections, classes)
  const rawSections = (payload.sections || payload.classes) as unknown[] | undefined;
  if (Array.isArray(rawSections) && rawSections.length > 0) {
    const sanitizedSections: Section[] = rawSections
      .filter((sec): sec is Record<string, unknown> => !!sec && typeof sec === 'object')
      .map((sec, idx) => {
        const sectionName = String(sec.section_name ?? sec.name ?? `Section ${idx + 1}`).trim();
        const rawId = sec.id ?? sec.section_id ?? (sectionName ? `sec-${sectionName.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : `sec-${idx}`);
        const id = String(rawId).trim() || `sec-${idx}`;
        return {
          ...sec,
          id,
          section_name: sectionName,
        } as unknown as Section;
      });
    if (sanitizedSections.length > 0) {
      stageRows('sections', sanitizedSections);
    }
  }

  // 4. Subjects (support subjects, learningAreas)
  const rawSubjects = (payload.subjects || payload.learningAreas) as unknown[] | undefined;
  if (Array.isArray(rawSubjects) && rawSubjects.length > 0) {
    const sanitizedSubjects: Subject[] = rawSubjects
      .filter((sub): sub is Record<string, unknown> => !!sub && typeof sub === 'object')
      .map((sub, idx) => {
        const subjectName = String(sub.subject_name ?? sub.name ?? `Subject ${idx + 1}`).trim();
        const rawId = sub.id ?? sub.subject_id ?? `sub-${idx}`;
        return {
          ...sub,
          id: String(rawId).trim() || `sub-${idx}`,
          subject_name: subjectName,
        } as unknown as Subject;
      });
    if (sanitizedSubjects.length > 0) {
      stageRows('subjects', sanitizedSubjects);
    }
  }

  // 5. Class Records (support classRecords, grades, class_records)
  const rawClassRecords = (payload.classRecords || payload.grades || payload.class_records) as unknown[] | undefined;
  let importedClassRecords: ClassRecord[] = [];
  if (Array.isArray(rawClassRecords) && rawClassRecords.length > 0) {
    const seenClassRecordIds = new Set<string>();
    importedClassRecords = rawClassRecords
      .filter((cr): cr is Record<string, unknown> => !!cr && typeof cr === 'object')
      .map((cr, idx) => {
        const lrn = String(cr.student_lrn ?? cr.lrn ?? '').trim();
        const subId = String(cr.subject_id ?? '').trim();
        const q = cr.quarter ?? 1;
        const sy = String(cr.school_year ?? cr.schoolYear ?? '').trim();
        const sec = String(cr.section_id ?? cr.sectionId ?? '').trim();
        let baseId = String(cr.id ?? cr.class_record_id ?? '').trim();
        if (!baseId) {
          const parts = ['grade', lrn, subId, sec, sy, `Q${q}`].filter(Boolean);
          baseId = parts.length > 1 ? parts.join('_') : `cr_${idx}`;
        }
        let finalId = baseId;
        let counter = 1;
        while (seenClassRecordIds.has(finalId)) {
          finalId = `${baseId}_${counter++}`;
        }
        seenClassRecordIds.add(finalId);
        return {
          ...cr,
          id: finalId,
          student_lrn: lrn || (cr.student_lrn as string),
          subject_id: subId || (cr.subject_id as string),
        } as unknown as ClassRecord;
      });
    if (importedClassRecords.length > 0) {
      stageRows('classRecords', importedClassRecords);
    }
  }

  // 6. Enrollments
  const rawEnrollments = payload.enrollments as unknown[] | undefined;
  if (Array.isArray(rawEnrollments) && rawEnrollments.length > 0) {
    const sanitized = rawEnrollments
      .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
      .map((e, idx) => ({
        ...e,
        id: String(e.id || `enr_${idx}`).trim(),
      })) as unknown as Enrollment[];
    stageRows('enrollments', sanitized);
  }

  // 7. Announcements
  const rawAnnouncements = payload.announcements as unknown[] | undefined;
  if (Array.isArray(rawAnnouncements) && rawAnnouncements.length > 0) {
    const sanitized = rawAnnouncements
      .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object')
      .map((a, idx) => ({
        ...a,
        id: String(a.id || `anc_${idx}`).trim(),
      })) as unknown as Announcement[];
    stageRows('announcements', sanitized);
  }

  // 8. Attendance Records (support attendanceRecords, attendance)
  const rawAttendance = (payload.attendanceRecords || payload.attendance) as unknown[] | undefined;
  if (Array.isArray(rawAttendance) && rawAttendance.length > 0) {
    const sanitized = rawAttendance
      .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object')
      .map((a, idx) => ({
        ...a,
        id: String(a.id || `att_${idx}`).trim(),
      })) as unknown as AttendanceRecord[];
    stageRows('attendanceRecords', sanitized);
  }

  // 9. SF2 Sheets (support sf2Sheets, sf2)
  const rawSf2 = (payload.sf2Sheets || payload.sf2) as unknown[] | undefined;
  if (Array.isArray(rawSf2) && rawSf2.length > 0) {
    const sanitized = rawSf2
      .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
      .map((s, idx) => ({
        ...s,
        id: String(s.id || `sf2_${idx}`).trim(),
      })) as unknown as SF2Sheet[];
    stageRows('sf2Sheets', sanitized);
  }

  // 10. HPS Records (support hpsRecords, hps)
  const rawHps = (payload.hpsRecords || payload.hps) as unknown[] | undefined;
  if (Array.isArray(rawHps) && rawHps.length > 0) {
    const sanitized = rawHps
      .filter((h): h is Record<string, unknown> => !!h && typeof h === 'object')
      .map((h, idx) => ({
        ...h,
        id: String(h.id || `hps_${idx}`).trim(),
      })) as unknown as HPSRecord[];
    stageRows('hpsRecords', sanitized);
  }

  // 11. Grading Sheet Records (support gradingSheetRecords, consolidatedGrades, grading_sheets)
  const rawGradingSheets = (payload.gradingSheetRecords || payload.consolidatedGrades || payload.grading_sheets) as unknown[] | undefined;
  if (Array.isArray(rawGradingSheets) && rawGradingSheets.length > 0) {
    const seenGsIds = new Set<string>();
    const sanitized = rawGradingSheets
      .filter((g): g is Record<string, unknown> => !!g && typeof g === 'object')
      .map((g, idx) => {
        const lrn = String(g.student_lrn ?? g.lrn ?? '').trim();
        const subId = String(g.subject_id ?? '').trim();
        const q = g.quarter ?? 1;
        const sy = String(g.school_year ?? g.schoolYear ?? '').trim();
        const sec = String(g.section_id ?? g.sectionId ?? '').trim();
        let baseId = String(g.id ?? '').trim();
        if (!baseId) {
          const parts = ['gs', lrn, subId, sec, sy, `Q${q}`].filter(Boolean);
          baseId = parts.length > 1 ? parts.join('_') : `gs_${idx}`;
        }
        let finalId = baseId;
        let counter = 1;
        while (seenGsIds.has(finalId)) {
          finalId = `${baseId}_${counter++}`;
        }
        seenGsIds.add(finalId);
        return {
          ...g,
          id: finalId,
        } as unknown as ClassRecord;
      });
    stageRows('gradingSheetRecords', sanitized);
  }

  // 12. Observed Values (support observedValues, coreValues)
  const rawObserved = (payload.observedValues || payload.coreValues) as unknown[] | undefined;
  if (Array.isArray(rawObserved) && rawObserved.length > 0) {
    const sanitized = rawObserved
      .filter((o): o is Record<string, unknown> => !!o && typeof o === 'object')
      .map((o, idx) => ({
        ...o,
        id: String(o.id || `obs_${idx}`).trim(),
      })) as unknown as ObservedValues[];
    stageRows('observedValues', sanitized);
  }

  // 13. Users
  const rawUsers = payload.users as unknown[] | undefined;
  if (Array.isArray(rawUsers) && rawUsers.length > 0) {
    const sanitized = rawUsers
      .filter((u): u is Record<string, unknown> => !!u && typeof u === 'object' && ('id' in u || 'uid' in u))
      .map((u) => ({
        ...u,
        id: String(u.id || u.uid).trim(),
      }));
    if (sanitized.length > 0) {
      stageRows('users', sanitized);
    }
  }

  // 14. Activity Log
  const rawActivity = payload.activityLog as unknown[] | undefined;
  if (Array.isArray(rawActivity) && rawActivity.length > 0) {
    const sanitized = rawActivity
      .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object' && 'id' in a);
    if (sanitized.length > 0) {
      stageRows('activityLog', sanitized);
    }
  }

  if (staged.size === 0) {
    throw new Error('Backup contains no valid collections to restore. Existing records were not changed.');
  }

  const localData = (payload.localStorageData || (rawBackupData as Record<string, unknown>).localStorageData) as Record<string, string> | undefined;
  const portableSettings = selectRestorableBackupSettings(localData);
  if (Object.prototype.hasOwnProperty.call(payload, 'schoolYears')) {
    if (!Array.isArray(payload.schoolYears) || payload.schoolYears.some(year => !year || typeof year !== 'object' || Array.isArray(year))) {
      throw new Error('Backup school years are invalid. Existing records were not changed.');
    }
    portableSettings.formease_school_years = JSON.stringify(payload.schoolYears);
  }

  // Detect school-year settings before committing, so they share the journal.
  // Automatically detect active school year from payload, schoolProfile, or records
  const isValidSy = (sy: unknown): sy is string => {
    if (!sy || typeof sy !== 'string') return false;
    const s = sy.trim();
    return s.length >= 7 && s.toLowerCase() !== 'unknown' && /(?:20\d{2}-20\d{2})/.test(s);
  };

  const detectedSchoolYear = (
    (isValidSy(payload.activeSchoolYear) && payload.activeSchoolYear.trim()) ||
    (localData && isValidSy(localData.activeSchoolYear) && localData.activeSchoolYear.trim()) ||
    (localData && isValidSy(localData.formease_active_school_year) && localData.formease_active_school_year.trim()) ||
    (profileRecord && isValidSy(profileRecord.school_year) && profileRecord.school_year.trim()) ||
    (importedClassRecords.find(r => isValidSy(r.school_year))?.school_year) ||
    ((payload.gradingSheetRecords as Record<string, unknown>[] | undefined)?.find(r => isValidSy(r.school_year))?.school_year as string | undefined) ||
    ((payload.sf2Sheets as Record<string, unknown>[] | undefined)?.find(s => isValidSy(s.school_year))?.school_year as string | undefined) ||
    ((source.summary as Record<string, unknown> | undefined)?.activeSchoolYear as string | undefined) ||
    null
  );

  if (detectedSchoolYear) {
    portableSettings.activeSchoolYear = detectedSchoolYear;
    portableSettings.formease_active_school_year = detectedSchoolYear;
  }
  await applyRestoreBatch(Array.from(staged, ([store, records]) => ({ store, records, replace: true })), portableSettings);
  await resumePendingRestoreSettings();
}

/**
 * Get backup metadata (list of all backups)
 */
async function getBackups(): Promise<BackupMetadata[]> {
  return (await getAllRecords<BackupMetadata>('backups')).filter(record => record.id !== RESTORE_SETTINGS_JOURNAL_ID);
}

/**
 * Save backup metadata
 */
async function saveBackupMetadata(backup: BackupMetadata): Promise<void> {
  await putRecord('backups', backup);
}

/**
 * Delete a backup by ID
 */
async function deleteBackup(backupId: string): Promise<void> {
  await deleteRecord('backups', backupId);
}

async function getPaginatedRecords<T>(
  storeName: string,
  pageIndex: number,
  pageSize: number
): Promise<{ records: T[]; total: number }> {
  const db = await openDatabase();
  const total = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).count();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });

  const offset = pageIndex * pageSize;
  const rawRecords = await new Promise<unknown[]>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const results: unknown[] = [];
    let skipped = 0;
    const req = store.openCursor();
    req.onerror = () => reject(req.error);
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (!cursor || results.length >= pageSize) {
        resolve(results);
        return;
      }
      if (skipped < offset) {
        skipped++;
        cursor.continue();
      } else {
        results.push(cursor.value);
        cursor.continue();
      }
    };
  });

  const records = await Promise.all(
    rawRecords.map(raw => decryptRecordIfNeeded<T>(storeName, raw))
  );
  return { records, total };
}

async function getActivityLog<T>(): Promise<T[]> {
  const entries = await getAllRecords<T & { timestamp?: number }>('activityLog');
  return entries.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)).slice(0, 50) as T[];
}

async function addActivityEntry<T extends { id: string }>(entry: T): Promise<void> {
  await putRecord('activityLog', entry);
  const all = await getAllRecords<T & { timestamp?: number }>('activityLog');
  const sorted = all.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  for (const old of sorted.slice(50)) {
    await deleteRecord('activityLog', (old as { id: string }).id);
  }
}

async function getRecordsByIndex<T>(
  storeName: string,
  indexName: string,
  keyRangeValue: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  const db = await openDatabase();
  const rawList = await new Promise<unknown[]>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(keyRangeValue);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  if (ENCRYPTED_STORES.has(storeName)) {
    const results: T[] = [];
    for (const raw of rawList) {
      try {
        const decrypted = await decryptRecordIfNeeded<T>(storeName, raw);
        results.push(decrypted);
      } catch (err) {
        recordQuarantinedEntry(storeName, raw, err);
      }
    }
    return results;
  }
  return Promise.all(rawList.map(raw => decryptRecordIfNeeded<T>(storeName, raw)));
}

async function migrateDatabaseForIndexing(): Promise<void> {
  if (typeof indexedDB === 'undefined' || typeof window === 'undefined') return;
  const isMigrated = localStorage.getItem('formease_db_indexing_migrated_v11') === 'true';
  if (isMigrated) return;

  try {
    console.log('🔄 Running database indexing projection migration (v11)...');
    const classRecords = await getAllRecords<ClassRecord>('classRecords');
    if (classRecords.length > 0) {
      await putRecordsBulk('classRecords', classRecords);
    }

    const gradingSheetRecords = await getAllRecords<ClassRecord>('gradingSheetRecords');
    if (gradingSheetRecords.length > 0) {
      await putRecordsBulk('gradingSheetRecords', gradingSheetRecords);
    }

    const enrollments = await getAllRecords<Enrollment>('enrollments');
    if (enrollments.length > 0) {
      await putRecordsBulk('enrollments', enrollments);
    }

    const attendanceRecords = await getAllRecords<AttendanceRecord>('attendanceRecords');
    if (attendanceRecords.length > 0) {
      await putRecordsBulk('attendanceRecords', attendanceRecords);
    }

    const observedValues = await getAllRecords<ObservedValues>('observedValues');
    if (observedValues.length > 0) {
      await putRecordsBulk('observedValues', observedValues);
    }

    localStorage.setItem('formease_db_indexing_migrated_v11', 'true');
    console.log('✅ Database indexing migration complete.');
  } catch (err) {
    console.error('❌ Database indexing migration failed:', err);
  }
}

async function getStoreStats(): Promise<Record<string, { count: number; sizeBytes: number }>> {
  const stores = [
    'schoolProfile',
    'students',
    'sections',
    'subjects',
    'classRecords',
    'enrollments',
    'announcements',
    'attendanceRecords',
    'sf2Sheets',
    'hpsRecords',
    'gradingSheetRecords',
    'observedValues',
    'backups'
  ];
  const stats: Record<string, { count: number; sizeBytes: number }> = {};
  const encoder = new TextEncoder();
  for (const store of stores) {
    try {
      const records = await getAllRecords<unknown>(store);
      const count = records.length;
      const jsonStr = JSON.stringify(records);
      const sizeBytes = encoder.encode(jsonStr).length;
      stats[store] = { count, sizeBytes };
    } catch (_e) {
      stats[store] = { count: 0, sizeBytes: 0 };
    }
  }
  return stats;
}

async function resetConnection(): Promise<void> {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (_e) {
      // ignore
    }
    dbInstance = null;
  }
}

export interface PreviewCleanupResult {
  success: boolean;
  blocked?: boolean;
  error?: string;
}

async function cleanupPreviewDatabase(): Promise<PreviewCleanupResult> {
  if (dbInstance && dbInstance.name === PREVIEW_DB_NAME) {
    try {
      dbInstance.close();
    } catch (_e) {
      // ignore
    }
    dbInstance = null;
  }
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve({ success: true });
        return;
      }
      const req = indexedDB.deleteDatabase(PREVIEW_DB_NAME);
      req.onsuccess = () => resolve({ success: true });
      req.onerror = () => resolve({
        success: false,
        error: req.error ? req.error.message : 'Preview database deletion failed',
      });
      req.onblocked = () => resolve({
        success: false,
        blocked: true,
        error: 'Preview database deletion was blocked by an open connection. Please close other tabs and try again.',
      });
    } catch (err) {
      resolve({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

async function preparePreviewDatabase(): Promise<void> {
  const result = await db.cleanupPreviewDatabase();
  if (!result.success) {
    throw new Error(
      result.blocked
        ? 'Cannot prepare preview database: deletion was blocked by another open connection. Please close other preview tabs.'
        : `Cannot prepare preview database: ${result.error || 'Unknown deletion error'}`
    );
  }
}

export interface StoreHealthInfo {
  storeName: string;
  status: 'healthy' | 'partial' | 'unreadable' | 'unavailable';
  rawCount: number | null;
  readableCount: number | null;
  quarantinedCount: number;
  error?: string;
}

export interface DatabaseHealthReport {
  isAvailable: boolean;
  schemaVersion: number;
  stores: Record<string, StoreHealthInfo>;
  totalRawRecords: number | null;
  totalReadableRecords: number | null;
  totalQuarantinedRecords: number;
  hasUnreadableStores: boolean;
  hasQuarantinedRecords: boolean;
  pendingJournal: boolean;
  lastVerifiedBackup: { id: string; timestamp: number; label: string } | null;
  storageEstimate?: { usage?: number; quota?: number; quotaExceeded?: boolean };
}

async function inspectDatabaseHealth(): Promise<DatabaseHealthReport> {
  const coreStores = [
    'schoolProfile', 'students', 'sections', 'subjects', 'classRecords', 'enrollments',
    'announcements', 'attendanceRecords', 'sf2Sheets', 'hpsRecords', 'gradingSheetRecords',
    'observedValues', 'users', 'backups', 'automated_backups'
  ];
  let currentDb: IDBDatabase;
  try {
    currentDb = await openDatabase();
  } catch (_err) {
    return {
      isAvailable: false,
      schemaVersion: 0,
      stores: {},
      totalRawRecords: null,
      totalReadableRecords: null,
      totalQuarantinedRecords: quarantinedRecords.length,
      hasUnreadableStores: true,
      hasQuarantinedRecords: quarantinedRecords.length > 0,
      pendingJournal: false,
      lastVerifiedBackup: null,
    };
  }

  const storeReports: Record<string, StoreHealthInfo> = {};
  let totalRaw = 0;
  let totalReadable = 0;
  let hasUnreadable = false;

  for (const storeName of coreStores) {
    if (!currentDb.objectStoreNames.contains(storeName)) {
      storeReports[storeName] = {
        storeName,
        status: 'unavailable',
        rawCount: null,
        readableCount: null,
        quarantinedCount: 0,
        error: `Store "${storeName}" is not present in database schema.`,
      };
      hasUnreadable = true;
      continue;
    }

    try {
      const rawList = await new Promise<unknown[]>((resolve, reject) => {
        const tx = currentDb.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error || new Error(`Read failed for ${storeName}`));
      });

      const rawCount = rawList.length;
      totalRaw += rawCount;

      let readableCount = 0;
      let quarantinedCount = 0;

      for (const item of rawList) {
        try {
          await decryptRecordIfNeeded(storeName, item);
          readableCount++;
        } catch {
          quarantinedCount++;
        }
      }

      totalReadable += readableCount;

      let status: StoreHealthInfo['status'] = 'healthy';
      if (rawCount > 0 && readableCount === 0) {
        status = 'unreadable';
        hasUnreadable = true;
      } else if (quarantinedCount > 0) {
        status = 'partial';
      }

      storeReports[storeName] = {
        storeName,
        status,
        rawCount,
        readableCount,
        quarantinedCount,
      };
    } catch (err) {
      hasUnreadable = true;
      storeReports[storeName] = {
        storeName,
        status: 'unreadable',
        rawCount: null,
        readableCount: null,
        quarantinedCount: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // Check pending restore settings journal
  let pendingJournal = false;
  try {
    if (currentDb.objectStoreNames.contains('backups')) {
      const journal = await getRecord<RestoreSettingsJournal>('backups', RESTORE_SETTINGS_JOURNAL_ID);
      pendingJournal = Boolean(journal);
    }
  } catch {
    // Ignore journal lookup errors
  }

  // Check last verified backup
  let lastVerifiedBackup: { id: string; timestamp: number; label: string } | null = null;
  try {
    if (currentDb.objectStoreNames.contains('automated_backups')) {
      const backups = await getAllRecords<{ id: string; timestamp: number; label?: string }>('automated_backups');
      if (backups.length > 0) {
        const sorted = backups.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        lastVerifiedBackup = {
          id: sorted[0].id,
          timestamp: sorted[0].timestamp || 0,
          label: sorted[0].label || 'Automated safety backup',
        };
      }
    }
  } catch {
    // Ignore backup lookup errors
  }

  // Check storage estimate
  let storageEstimate: DatabaseHealthReport['storageEstimate'] | undefined;
  if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.estimate === 'function') {
    try {
      const est = await navigator.storage.estimate();
      storageEstimate = {
        usage: est.usage,
        quota: est.quota,
        quotaExceeded: Boolean(est.usage && est.quota && est.usage >= est.quota),
      };
    } catch {
      // Storage estimation not available in some environments
    }
  }

  return {
    isAvailable: true,
    schemaVersion: currentDb.version,
    stores: storeReports,
    totalRawRecords: hasUnreadable ? null : totalRaw,
    totalReadableRecords: totalReadable,
    totalQuarantinedRecords: quarantinedRecords.length,
    hasUnreadableStores: hasUnreadable,
    hasQuarantinedRecords: quarantinedRecords.length > 0,
    pendingJournal,
    lastVerifiedBackup,
    storageEstimate,
  };
}

export const db = {
  inspectDatabaseHealth,
  getQuarantinedRecords,
  clearQuarantinedRecords,
  getQuarantineStats,
  exportQuarantineArtifact,
  getStoreStats,
  setDatabaseEncryptionKey,
  onDatabaseChange,
  getAllRecords,
  getRecord,
  putRecord,
  putRecordsBulk,
  commitRecordChanges,
  deleteRecord,
  deleteRecordsBulk,
  clearStore,
  applyRestoreBatch,
  getWriteGeneration,
  acquireInstallWriteBarrier,
  releaseInstallWriteBarrier,
  resumePendingRestoreSettings,
  getStoreCount,
  exportAllData,
  readBackupSnapshot,
  importFromBackup,
  extractBackupPayload,
  getBackups,
  saveBackupMetadata,
  deleteBackup,
  getPaginatedRecords,
  getActivityLog,
  addActivityEntry,
  getRecordsByIndex,
  migrateDatabaseForIndexing,
  isPreviewMode,
  getActiveDbName,
  PRODUCTION_DB_NAME,
  PREVIEW_DB_NAME,
  resetConnection,
  cleanupPreviewDatabase,
  preparePreviewDatabase,
  ensureDatabaseStores,
  STORE_CONFIGS,
  _encryptRecord: encryptRecordIfNeeded,
  _decryptRecord: decryptRecordIfNeeded,
  nukeDatabase: async (): Promise<void> => {
    assertWritesAllowed();
    // Clear localStorage first
    localStorage.clear();
    
    const stores = [
      'schoolProfile',
      'students',
      'sections',
      'subjects',
      'classRecords',
      'enrollments',
      'announcements',
      'attendanceRecords',
      'sf2Sheets',
      'hpsRecords',
      'gradingSheetRecords',
      'observedValues',
      'backups',
      'automated_backups',
      'activityLog',
      'users',
    ];

    for (const store of stores) {
      try {
        await clearStore(store);
      } catch (e) {
        console.warn(`Failed to clear store ${store}:`, e);
      }
    }
  }
};


