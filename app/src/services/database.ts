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
const DB_VERSION = 12;

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

      // A keyPath cannot be changed in place.  Never delete a store before
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

                  db.deleteObjectStore('students');
                  const correctedStore = db.createObjectStore('students', { keyPath: 'lrn' });
                  for (const record of legacyStudents) {
                      correctedStore.put(record);
                  }
                  console.info(`Migrated ${legacyStudents.length} learner record(s) to the corrected students store.`);
              };
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

/**
 * Extract true payload from arbitrary nested backup structures
 * (handles ComprehensiveBackup, AutomatedBackupEntry, raw dumps, etc.)
 */
export function extractBackupPayload(rawBackupData: unknown): Record<string, unknown> | null {
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
  if (!payload) return;

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

  // 1. School Profile
  const rawProfile = payload.schoolProfile || payload.school_profile || payload.school || payload.profile;
  let profileRecord: SchoolProfile | undefined;
  if (rawProfile) {
    const rawObj = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
    if (rawObj && typeof rawObj === 'object') {
      const p = rawObj as Record<string, unknown>;
      const school_id = String(p.school_id || p.id || '300001').trim() || '300001';
      profileRecord = { ...p, school_id } as unknown as SchoolProfile;
      await putRecordsBulk('schoolProfile', [profileRecord]);
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
      await putRecordsBulk('students', sanitizedStudents);
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
      await putRecordsBulk('sections', sanitizedSections);
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
      await putRecordsBulk('subjects', sanitizedSubjects);
    }
  }

  // 5. Class Records (support classRecords, grades, class_records)
  const rawClassRecords = (payload.classRecords || payload.grades || payload.class_records) as unknown[] | undefined;
  let importedClassRecords: ClassRecord[] = [];
  if (Array.isArray(rawClassRecords) && rawClassRecords.length > 0) {
    importedClassRecords = rawClassRecords
      .filter((cr): cr is Record<string, unknown> => !!cr && typeof cr === 'object')
      .map((cr, idx) => {
        const lrn = String(cr.student_lrn ?? cr.lrn ?? '').trim();
        const subId = String(cr.subject_id ?? '').trim();
        const q = cr.quarter ?? 1;
        const rawId = cr.id ?? cr.class_record_id ?? (lrn && subId ? `grade_${lrn}_${subId}_Q${q}` : `cr_${Date.now()}_${idx}`);
        return {
          ...cr,
          id: String(rawId).trim(),
          student_lrn: lrn || (cr.student_lrn as string),
          subject_id: subId || (cr.subject_id as string),
        } as unknown as ClassRecord;
      });
    if (importedClassRecords.length > 0) {
      await putRecordsBulk('classRecords', importedClassRecords);
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
    await putRecordsBulk('enrollments', sanitized);
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
    await putRecordsBulk('announcements', sanitized);
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
    await putRecordsBulk('attendanceRecords', sanitized);
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
    await putRecordsBulk('sf2Sheets', sanitized);
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
    await putRecordsBulk('hpsRecords', sanitized);
  }

  // 11. Grading Sheet Records (support gradingSheetRecords, consolidatedGrades, grading_sheets)
  const rawGradingSheets = (payload.gradingSheetRecords || payload.consolidatedGrades || payload.grading_sheets) as unknown[] | undefined;
  if (Array.isArray(rawGradingSheets) && rawGradingSheets.length > 0) {
    const sanitized = rawGradingSheets
      .filter((g): g is Record<string, unknown> => !!g && typeof g === 'object')
      .map((g, idx) => {
        const lrn = String(g.student_lrn ?? g.lrn ?? '').trim();
        const subId = String(g.subject_id ?? '').trim();
        const q = g.quarter ?? 1;
        const rawId = g.id || (lrn && subId ? `gs_${lrn}_${subId}_Q${q}` : `gs_${idx}`);
        return {
          ...g,
          id: String(rawId).trim(),
        } as unknown as ClassRecord;
      });
    await putRecordsBulk('gradingSheetRecords', sanitized);
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
    await putRecordsBulk('observedValues', sanitized);
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
      await putRecordsBulk('users', sanitized);
    }
  }

  // 14. Activity Log
  const rawActivity = payload.activityLog as unknown[] | undefined;
  if (Array.isArray(rawActivity) && rawActivity.length > 0) {
    const sanitized = rawActivity
      .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object' && 'id' in a);
    if (sanitized.length > 0) {
      await putRecordsBulk('activityLog', sanitized);
    }
  }

  // 15. Restore localStorage items if present
  const localData = (payload.localStorageData || (rawBackupData as Record<string, unknown>).localStorageData) as Record<string, string> | undefined;
  if (localData) {
    restoreBackupLocalStorage(localData);
  }

  // 16. School Year Resynchronization
  // Automatically detect active school year from payload, schoolProfile, or records
  const detectedSchoolYear = (
    (typeof payload.activeSchoolYear === 'string' && payload.activeSchoolYear.trim()) ||
    (localData && typeof localData.activeSchoolYear === 'string' && localData.activeSchoolYear.trim()) ||
    (profileRecord && typeof profileRecord.school_year === 'string' && profileRecord.school_year.trim()) ||
    (importedClassRecords.find(r => r.school_year && typeof r.school_year === 'string')?.school_year) ||
    undefined
  );

  if (detectedSchoolYear && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('activeSchoolYear', detectedSchoolYear);
      localStorage.setItem('formease_active_school_year', detectedSchoolYear);
    } catch (_e) {
      // Ignore in non-browser environments
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
  extractBackupPayload,
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
