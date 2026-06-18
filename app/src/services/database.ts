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

let dbKey: CryptoKey | null = null;

export function setDatabaseEncryptionKey(key: CryptoKey | null) {
  dbKey = key;
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
}

async function encryptRecordIfNeeded<T>(storeName: string, record: T): Promise<T | EncryptedEnvelope> {
  if (!dbKey || !ENCRYPTED_STORES.has(storeName)) {
    return record;
  }
  
  const keyField = storeName === 'students' ? 'lrn' : 'id';
  const keyValue = (record as Record<string, unknown>)[keyField];
  
  if (!keyValue) {
    return record;
  }
  
  const { ciphertext, iv } = await encryptPayload(record, dbKey);
  
  const envelope: EncryptedEnvelope = {
    [keyField]: keyValue,
    iv,
    ciphertext,
    is_encrypted: true
  } as unknown as EncryptedEnvelope;
  
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
const DB_VERSION = 9;

interface BackupMetadata {
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
  };
}

let dbInstance: IDBDatabase | null = null;

let activeWrites = 0;
const writeListeners = new Set<(activeCount: number) => void>();

export function onDatabaseWriteChange(listener: (activeCount: number) => void): () => void {
  writeListeners.add(listener);
  // Call immediately with the current count
  listener(activeWrites);
  return () => {
    writeListeners.delete(listener);
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
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(encrypted);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string);
    });
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
  } finally {
    notifyWriteChange(-1);
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
    observedValues
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
  ]);

  const localStorageData: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('formease_sf8_signatories_') ||
        key === 'school_calendar_events'
      )) {
        const value = localStorage.getItem(key);
        if (value) {
          localStorageData[key] = value;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to export localStorage for backup:', e);
  }

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
    localStorageData,
  };
}

/**
 * Import data from backup JSON
 */
async function importFromBackup(backupData: {
  schoolProfile: SchoolProfile[];
  students: Student[];
  sections: Section[];
  subjects: Subject[];
  classRecords: ClassRecord[];
  enrollments: Enrollment[];
  announcements: Announcement[];
  attendanceRecords: AttendanceRecord[];
  sf2Sheets: SF2Sheet[];
  hpsRecords: HPSRecord[];
  gradingSheetRecords?: ClassRecord[];
  observedValues?: ObservedValues[];
  localStorageData?: Record<string, string>;
}) {
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
  ];

  for (const store of stores) {
    await clearStore(store);
  }

  // Import new data
  if (backupData.schoolProfile) {
    await putRecordsBulk('schoolProfile', backupData.schoolProfile);
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
  if (backupData.classRecords) {
    await putRecordsBulk('classRecords', backupData.classRecords);
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

  // Restore localStorage items if present
  if (backupData.localStorageData) {
    try {
      Object.entries(backupData.localStorageData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      console.log('✅ LocalStorage data restored');
    } catch (e) {
      console.warn('⚠️ Failed to restore localStorage data:', e);
    }
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

export const db = {
  setDatabaseEncryptionKey,
  getAllRecords,
  getRecord,
  putRecord,
  putRecordsBulk,
  deleteRecord,
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
