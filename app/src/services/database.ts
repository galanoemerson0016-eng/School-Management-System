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
} from '../types';

// IndexedDB database name and stores
const DB_NAME = 'FormEaseDB';
const DB_VERSION = 5;

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

/**
 * Open IndexedDB database with all required object stores
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

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
        ['hpsRecords', 'id'],
        ['gradingSheetRecords', 'id'],
        ['backups', 'id'],
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
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Get a single record by key
 */
async function getRecord<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Add or update a record
 */
async function putRecord<T>(
  storeName: string,
  record: T
): Promise<string> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(record as any);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as string);
  });
}

/**
 * Delete a record
 */
async function deleteRecord(storeName: string, key: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Clear all records from a store
 */
async function clearStore(storeName: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
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
  const stores = {
    schoolProfile: await getAllRecords<SchoolProfile>('schoolProfile'),
    students: await getAllRecords<Student>('students'),
    sections: await getAllRecords<Section>('sections'),
    subjects: await getAllRecords<Subject>('subjects'),
    classRecords: await getAllRecords<ClassRecord>('classRecords'),
    enrollments: await getAllRecords<Enrollment>('enrollments'),
    announcements: await getAllRecords<Announcement>('announcements'),
    attendanceRecords: await getAllRecords<AttendanceRecord>('attendanceRecords'),
    hpsRecords: await getAllRecords<any>('hpsRecords'),
  };

  return stores;
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
  hpsRecords: any[];
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
    'hpsRecords',
  ];

  for (const store of stores) {
    await clearStore(store);
  }

  // Import new data
  if (backupData.schoolProfile) {
    for (const record of backupData.schoolProfile) {
      await putRecord('schoolProfile', record);
    }
  }
  if (backupData.students) {
    for (const record of backupData.students) {
      await putRecord('students', record);
    }
  }
  if (backupData.sections) {
    for (const record of backupData.sections) {
      await putRecord('sections', record);
    }
  }
  if (backupData.subjects) {
    for (const record of backupData.subjects) {
      await putRecord('subjects', record);
    }
  }
  if (backupData.classRecords) {
    for (const record of backupData.classRecords) {
      await putRecord('classRecords', record);
    }
  }
  if (backupData.enrollments) {
    for (const record of backupData.enrollments) {
      await putRecord('enrollments', record);
    }
  }
  if (backupData.announcements) {
    for (const record of backupData.announcements) {
      await putRecord('announcements', record);
    }
  }
  if (backupData.attendanceRecords) {
    for (const record of backupData.attendanceRecords) {
      await putRecord('attendanceRecords', record);
    }
  }
  if ((backupData as any).hpsRecords) {
    for (const record of (backupData as any).hpsRecords) {
      await putRecord('hpsRecords', record);
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

export const db = {
  getAllRecords,
  getRecord,
  putRecord,
  deleteRecord,
  clearStore,
  getStoreCount,
  exportAllData,
  importFromBackup,
  getBackups,
  saveBackupMetadata,
  deleteBackup,
};
