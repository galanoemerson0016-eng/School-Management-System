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
import { collectBackupLocalStorage, restoreBackupLocalStorage } from '../utils/backup-restore';

let dbKey: CryptoKey | null = null;

export function setDatabaseEncryptionKey(key: CryptoKey | null) {
  dbKey = key;
  if (key) {
    void migrateDatabaseForIndexing();
  }
}

const ENCRYPTED_STORES = new Set([
  'students',
  'classRecords',
  'enrollments',
  'attendanceRecords',
  'sf2Sheets',
  'gradingSheetRecords',
  'observedValues',
  'automated_backups'
]);

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
  if (rawRecord.is_encrypted && rawRecord.iv && rawRecord.ciphertext) {
    try {
      const decrypted = await decryptPayload<T>(rawRecord.ciphertext as string, rawRecord.iv as string, dbKey);
      finalRecord = decrypted;
      keyValue = (finalRecord as Record<string, unknown>)[keyField] || keyValue;
    } catch (err) {
      console.warn(`[Database] Record in store ${storeName} is already encrypted, but failed to decrypt with current key. Saving as-is.`, err);
      return record;
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
  if (!dbKey || !rawRecord.is_encrypted || !rawRecord.iv || !rawRecord.ciphertext) {
    return record as T;
  }
  
  try {
    return await decryptPayload<T>(rawRecord.ciphertext as string, rawRecord.iv as string, dbKey);
  } catch (error) {
    console.error(`Failed to decrypt record in store ${storeName}:`, error);
    return record as T;
  }
}

// IndexedDB database name and stores
const DB_NAME = 'FormEaseDB';
const DB_VERSION = 11;

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
function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction;

      // Special check for students store keyPath mismatch
      if (db.objectStoreNames.contains('students')) {
          const studentStore = transaction?.objectStore('students');
          if (studentStore && studentStore.keyPath !== 'lrn') {
              console.warn('Student store keyPath mismatch detected. Recreating store...');
              db.deleteObjectStore('students');
          }
      }

      // Create object stores if they don't exist
      const storeConfigs: Array<[string, string]> = [
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
      ];

      for (const [store, keyPath] of storeConfigs) {
        if (!db.objectStoreNames.contains(store)) {
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
    };
  });
}

/**
 * Get all records from a store
 */
async function getAllRecords<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  const rawList = await new Promise<unknown[]>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  return Promise.all(rawList.map(raw => decryptRecordIfNeeded<T>(storeName, raw)));
}

/**
 * Get a single record by key
 */
async function getRecord<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDatabase();
  const raw = await new Promise<unknown>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  return decryptRecordIfNeeded<T>(storeName, raw);
}

/**
 * Add or update a record
 */
async function putRecord<T>(
  storeName: string,
  record: T
): Promise<string> {
  notifyWriteChange(1);
  try {
    const encrypted = await encryptRecordIfNeeded(storeName, record);
    const db = await openDatabase();
    const result = await new Promise<string>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(encrypted);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string);
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
  notifyWriteChange(1);
  try {
    const encryptedRecords = await Promise.all(
      records.map(record => encryptRecordIfNeeded(storeName, record))
    );
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      for (const record of encryptedRecords) {
        store.put(record);
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
  notifyWriteChange(1);
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
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
  notifyWriteChange(keys.length);
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      for (const key of keys) {
        store.delete(key);
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
  notifyWriteChange(1);
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
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
    getAllRecords<unknown>('users').catch(() => []),
    getAllRecords<unknown>('activityLog').catch(() => []),
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

export interface BackupImportPayload {
  schoolProfile?: SchoolProfile[] | SchoolProfile;
  students?: Student[];
  studentProfiles?: Student[];
  sections?: Section[];
  subjects?: Subject[];
  classRecords?: ClassRecord[];
  grades?: ClassRecord[];
  enrollments?: Enrollment[];
  announcements?: Announcement[];
  attendanceRecords?: AttendanceRecord[];
  sf2Sheets?: SF2Sheet[];
  hpsRecords?: HPSRecord[];
  gradingSheetRecords?: ClassRecord[];
  observedValues?: ObservedValues[];
  users?: unknown[];
  activityLog?: unknown[];
  localStorageData?: Record<string, string>;
  payload?: BackupImportPayload;
  data?: BackupImportPayload;
  [key: string]: unknown;
}

/**
 * Import data from backup JSON
 */
async function importFromBackup(rawBackupData: BackupImportPayload) {
  const backupData = (rawBackupData?.payload || rawBackupData?.data || rawBackupData) as BackupImportPayload;
  if (!backupData) return;

  // Clear hard reset flag when restoring from a backup
  try {
    localStorage.removeItem('formease-hard-reset-executed');
  } catch (_e) {
    // Ignore in non-browser environments
  }

  // Clear existing data
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
    'users',
    'activityLog'
  ];

  for (const store of stores) {
    try {
      await clearStore(store);
    } catch (_e) {
      // Store might not exist in older schema versions
    }
  }

  // Import new data
  if (backupData.schoolProfile) {
    const profiles = Array.isArray(backupData.schoolProfile) ? backupData.schoolProfile : [backupData.schoolProfile];
    await putRecordsBulk('schoolProfile', profiles);
  }
  if (backupData.students) {
    await putRecordsBulk('students', backupData.students);
  }
  if (backupData.sections) {
    await putRecordsBulk('sections', backupData.sections);
  }
  if (backupData.subjects) {
    await putRecordsBulk('subjects', backupData.subjects);
  }
  const classRecordsToImport = backupData.classRecords || backupData.grades;
  if (classRecordsToImport) {
    await putRecordsBulk('classRecords', classRecordsToImport);
  }
  if (backupData.enrollments) {
    await putRecordsBulk('enrollments', backupData.enrollments);
  }
  if (backupData.announcements) {
    await putRecordsBulk('announcements', backupData.announcements);
  }
  if (backupData.attendanceRecords) {
    await putRecordsBulk('attendanceRecords', backupData.attendanceRecords);
  }
  if (backupData.sf2Sheets) {
    await putRecordsBulk('sf2Sheets', backupData.sf2Sheets);
  }
  if (backupData.hpsRecords) {
    await putRecordsBulk('hpsRecords', backupData.hpsRecords);
  }
  if (backupData.gradingSheetRecords) {
    await putRecordsBulk('gradingSheetRecords', backupData.gradingSheetRecords);
  }
  if (backupData.observedValues) {
    await putRecordsBulk('observedValues', backupData.observedValues);
  }
  if (backupData.users && backupData.users.length > 0) {
    await putRecordsBulk('users', backupData.users);
  }
  if (backupData.activityLog && backupData.activityLog.length > 0) {
    await putRecordsBulk('activityLog', backupData.activityLog);
  }

  // Restore localStorage items if present
  if (backupData.localStorageData) {
    restoreBackupLocalStorage(backupData.localStorageData);
  }
}

/**
 * Get backup metadata (list of all backups)
 */
async function getBackups(): Promise<BackupMetadata[]> {
  return getAllRecords<BackupMetadata>('backups');
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

export const db = {
  getStoreStats,
  setDatabaseEncryptionKey,
  onDatabaseChange,
  getAllRecords,
  getRecord,
  putRecord,
  putRecordsBulk,
  deleteRecord,
  deleteRecordsBulk,
  clearStore,
  getStoreCount,
  exportAllData,
  importFromBackup,
  getBackups,
  saveBackupMetadata,
  deleteBackup,
  getPaginatedRecords,
  getActivityLog,
  addActivityEntry,
  getRecordsByIndex,
  migrateDatabaseForIndexing,
  _encryptRecord: encryptRecordIfNeeded,
  _decryptRecord: decryptRecordIfNeeded,
  nukeDatabase: async (): Promise<void> => {
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
      'backups'
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
