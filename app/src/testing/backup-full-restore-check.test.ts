import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { db, PRODUCTION_DB_NAME } from '../services/database';
import { exportFullDatabaseBackup, savePreRestoreSafetySnapshot, validateBackup, resolveBestSchoolProfile } from '../utils/backup-restore';
import { restoreBackupToFirestore } from '../utils/backup-import';
import type { SchoolProfile } from '../types';
import { encryptPayload } from '../utils/db-crypto';
import { restoreFromBackupFile } from '../services/backup';

describe('Full Backup Restore Diagnostic & Failure Analysis', () => {
  beforeEach(async () => {
    await db.resetConnection();
    db.setDatabaseEncryptionKey(null);
    (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
    (globalThis as unknown as { IDBKeyRange: typeof IDBKeyRange }).IDBKeyRange = IDBKeyRange;
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Scenario 1: Full export -> BackupRestoreModal preserved payload -> restoreBackupToFirestore', async () => {
    // 1. Seed complete school data
    await db.putRecord('schoolProfile', {
      school_id: '300001',
      name: 'Central High School',
      region: 'Region I',
      division: 'Division of Laoag',
    });
    await db.putRecord('students', {
      lrn: '105563160023',
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      gender: 'Male',
      grade_level: 'Grade 10',
      student_section: 'Section A',
    });
    await db.putRecord('sections', {
      id: 'sec_1',
      section_name: 'Section A',
      section_grade_level: 'Grade 10',
    });
    await db.putRecord('subjects', {
      id: 'sub_1',
      subject_name: 'Mathematics',
      grade_level: 'Grade 10',
    });
    await db.putRecord('classRecords', {
      id: 'cr_1',
      student_lrn: '105563160023',
      section_id: 'sec_1',
      subject_id: 'sub_1',
      school_year: '2026-2027',
      quarter: 1,
      written_works: [90],
      performance_tasks: [88],
      quarterly_exam: 85,
      final_grade: 88,
    });
    await db.putRecord('gradingSheetRecords', {
      id: 'gs_1',
      student_lrn: '105563160023',
      section_id: 'sec_1',
      subject_id: 'sub_1',
      school_year: '2026-2027',
      quarter: 1,
      written_works: [],
      performance_tasks: [],
      quarterly_exam: 0,
      final_grade: 88,
    });

    // 2. Export full backup
    const exportedBackup = await exportFullDatabaseBackup('Full Backup Test');
    expect(exportedBackup.metadata.payloadHash).toBeTruthy();
    expect(exportedBackup._checksum).toBeTruthy();

    // 3. Clear database (simulate new installation or data loss)
    await db.clearStore('students');
    await db.clearStore('sections');
    await db.clearStore('subjects');
    await db.clearStore('classRecords');
    await db.clearStore('gradingSheetRecords');

    // 4. Simulate what BackupRestoreModal does when user selects this file
    const rawData = JSON.parse(JSON.stringify(exportedBackup));
    let backupToRestore: typeof exportedBackup;

    if (
      rawData &&
      typeof rawData === 'object' &&
      rawData.metadata &&
      typeof rawData.metadata === 'object' &&
      rawData.payload &&
      typeof rawData.payload === 'object'
    ) {
      // Preserved intact without breaking SHA-256 payloadHash or embedded checksum
      backupToRestore = rawData;
    } else {
      backupToRestore = rawData;
    }

    const validation = await validateBackup(backupToRestore as never);
    expect(validation.isValid).toBe(true);

    let restoreError: string | null = null;
    try {
      await savePreRestoreSafetySnapshot();
      await restoreBackupToFirestore(backupToRestore as never, {
        strategy: 'replace',
        selectedItems: new Set(['schoolProfile', 'students', 'sections', 'subjects', 'classRecords', 'gradingSheetRecords']),
      });
    } catch (err: unknown) {
      restoreError = err instanceof Error ? err.message : String(err);
      console.log('restoreBackupToFirestore failed with:', restoreError);
    }

    expect(restoreError).toBeNull();

    // Verify records restored in database
    const restoredStudents = await db.getAllRecords('students');
    expect(restoredStudents).toHaveLength(1);
    expect(restoredStudents[0]).toMatchObject({ lrn: '105563160023' });

    const restoredGrades = await db.getAllRecords('classRecords');
    expect(restoredGrades).toHaveLength(1);
    expect(restoredGrades[0]).toMatchObject({ student_lrn: '105563160023', quarter: 1 });
  });

  it('Scenario 2: Full export -> db.importFromBackup (Direct full restore)', async () => {
    // 1. Seed complete school data
    await db.putRecord('schoolProfile', {
      school_id: '300001',
      name: 'Central High School',
      region: 'Region I',
      division: 'Division of Laoag',
    });
    await db.putRecord('students', {
      lrn: '105563160023',
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      gender: 'Male',
      grade_level: 'Grade 10',
      student_section: 'Section A',
    });
    await db.putRecord('sections', {
      id: 'sec_1',
      section_name: 'Section A',
      section_grade_level: 'Grade 10',
    });

    const exportedBackup = await exportFullDatabaseBackup('Full Backup Direct Test');

    // 2. Clear database
    await db.clearStore('students');
    await db.clearStore('sections');

    // 3. Import directly via importFromBackup
    await savePreRestoreSafetySnapshot();
    await db.importFromBackup(exportedBackup as never);

    const restoredStudents = await db.getAllRecords('students');
    expect(restoredStudents).toHaveLength(1);
    expect(restoredStudents[0]).toMatchObject({ lrn: '105563160023' });
  });

  it('Scenario 3: Restoring a backup with numeric LRN or ID in db.importFromBackup', async () => {
    const rawBackupWithNumericKeys = {
      payload: {
        schoolProfile: { school_id: 300001, name: 'Numeric School' },
        students: [{ lrn: 105563160023, first_name: 'Numeric LRN' }],
        sections: [{ id: 101, section_name: 'Numeric Section' }],
        subjects: [{ id: 201, subject_name: 'Numeric Subject' }],
        classRecords: [{ id: 301, student_lrn: 105563160023, subject_id: 201, quarter: 1 }],
      }
    };

    let importError: string | null = null;
    try {
      await db.importFromBackup(rawBackupWithNumericKeys as never);
    } catch (err: unknown) {
      importError = err instanceof Error ? err.message : String(err);
      console.log('Numeric keys import failed with:', importError);
    }

    expect(importError).toBeNull();
  });

  it('Scenario 4: Restoring a backup with classRecords missing ID in db.importFromBackup', async () => {
    const backupWithMissingIds = {
      payload: {
        students: [{ lrn: '1001', first_name: 'A' }],
        classRecords: [
          // No id provided, same student and subject across different school years or terms
          { student_lrn: '1001', subject_id: 'sub_math', quarter: 1, school_year: '2025-2026' },
          { student_lrn: '1001', subject_id: 'sub_math', quarter: 1, school_year: '2026-2027' },
        ],
        gradingSheetRecords: [
          { student_lrn: '1001', subject_id: 'sub_math', quarter: 1, school_year: '2025-2026' },
          { student_lrn: '1001', subject_id: 'sub_math', quarter: 1, school_year: '2026-2027' },
        ]
      }
    };

    let importError: string | null = null;
    try {
      await db.importFromBackup(backupWithMissingIds as never);
    } catch (err: unknown) {
      importError = err instanceof Error ? err.message : String(err);
      console.log('Missing IDs import failed with:', importError);
    }

    expect(importError).toBeNull();
  });

  it('Scenario 5: Restoring a File object via restoreFromBackupFile', async () => {
    await db.putRecord('students', { lrn: '1001', first_name: 'Test' });
    const exportedBackup = await exportFullDatabaseBackup('File Test');

    const json = JSON.stringify(exportedBackup);
    const file = new File([json], 'SMS_Backup_Comprehensive_2026-09-24.json', { type: 'application/json' });

    let restoreError: string | null = null;
    try {
      await restoreFromBackupFile(file);
    } catch (err: unknown) {
      restoreError = err instanceof Error ? err.message : String(err);
      console.log('restoreFromBackupFile failed with:', restoreError);
    }

    expect(restoreError).toBeNull();
  });

  it('Scenario 6: restoreBackupToFirestore with missing classRecord IDs', async () => {
    const backup = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '2.0.0-local',
        exportedBy: 'Test',
      },
      summary: { activeSchoolYear: '2026-2027', students: 1, sections: 1, subjects: 1, grades: 1 },
      payload: {
        schoolProfile: { school_id: '300001', name: 'School' },
        students: [{ lrn: '1001', first_name: 'A' }],
        sections: [{ id: 'sec_1', section_name: 'A' }],
        subjects: [{ id: 'sub_1', subject_name: 'Math' }],
        classRecords: [
          // No id provided!
          { student_lrn: '1001', subject_id: 'sub_1', quarter: 1, final_grade: 85 },
        ],
      }
    };

    let restoreError: string | null = null;
    try {
      await savePreRestoreSafetySnapshot();
      await restoreBackupToFirestore(backup as never, {
        strategy: 'replace',
        selectedItems: new Set(['students', 'sections', 'subjects', 'classRecords']),
      });
    } catch (err: unknown) {
      restoreError = err instanceof Error ? err.message : String(err);
      console.log('Scenario 6 failed with:', restoreError);
    }

    expect(restoreError).toBeNull();
  });

  it('Scenario 7: refuses replacement when existing encrypted records cannot be preserved', async () => {
    // 1. Setup old encryption key and encrypt a record in the database
    const oldKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    db.setDatabaseEncryptionKey(oldKey);
    await db.putRecord('students', { lrn: '1001', first_name: 'Old Learner' });

    // 2. Simulate password reset: new key is generated and active
    const newKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    db.setDatabaseEncryptionKey(newKey);

    // 3. User has a valid backup file to restore
    const backup = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '2.0.0-local',
        exportedBy: 'Admin',
      },
      summary: { activeSchoolYear: '2026-2027', students: 1, sections: 1, subjects: 1, grades: 0 },
      payload: {
        schoolProfile: { school_id: '300001', name: 'School' },
        students: [{ lrn: '1002', first_name: 'Restored Learner' }],
        sections: [{ id: 'sec_1', section_name: 'A' }],
        subjects: [{ id: 'sub_1', subject_name: 'Math' }],
        classRecords: [],
      }
    };

    let restoreError: string | null = null;
    try {
      // User attempts to restore their backup (via importFromBackup or restoreBackupToFirestore)
      await savePreRestoreSafetySnapshot();
      await db.importFromBackup(backup as never);
    } catch (err: unknown) {
      restoreError = err instanceof Error ? err.message : String(err);
      console.log('Scenario 7 restore failed with:', restoreError);
    }

    expect(restoreError).toContain('existing records could not be preserved');
    // The old key must still open the original record. No fabricated empty
    // checkpoint or replacement learner may have been written.
    db.setDatabaseEncryptionKey(oldKey, [], false);
    const restoredStudents = await db.getAllRecords('students');
    expect(restoredStudents).toHaveLength(1);
    expect(restoredStudents[0]).toMatchObject({ lrn: '1001', first_name: 'Old Learner' });
    expect(await db.getAllRecords('automated_backups')).toEqual([]);
  });

  it('Scenario 8: Restoring backup containing encrypted envelopes via restoreBackupToFirestore (unseals and re-encrypts under active DEK)', async () => {
    // 1. Setup active DEK and legacy fallback key
    const activeKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const legacyKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    db.setDatabaseEncryptionKey(activeKey, [legacyKey], false);

    // 2. Encrypt records with legacyKey into envelopes
    const studentData = {
      lrn: '105563160099',
      first_name: 'Encrypted',
      last_name: 'Learner',
      gender: 'Female',
      grade_level: 'Grade 10',
      student_section: 'Section Gold',
    };
    const { ciphertext: studentCiphertext, iv: studentIv } = await encryptPayload(studentData, legacyKey);
    const encryptedStudentEnvelope = {
      lrn: '105563160099',
      ciphertext: studentCiphertext,
      iv: studentIv,
      is_encrypted: true,
    };

    const classRecordData = {
      id: 'cr_enc_1',
      student_lrn: '105563160099',
      section_id: 'sec_1',
      subject_id: 'sub_1',
      school_year: '2026-2027',
      quarter: 1,
      written_works: [95],
      performance_tasks: [92],
      quarterly_exam: 90,
      final_grade: 93,
    };
    const { ciphertext: crCiphertext, iv: crIv } = await encryptPayload(classRecordData, legacyKey);
    const encryptedCrEnvelope = {
      id: 'cr_enc_1',
      ciphertext: crCiphertext,
      iv: crIv,
      is_encrypted: true,
    };

    const backup = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '2.0.0-local',
        exportedBy: 'Admin',
      },
      summary: { activeSchoolYear: '2026-2027', students: 1, sections: 1, subjects: 1, grades: 1 },
      payload: {
        schoolProfile: { school_id: '300001', name: 'Mabini NHS' },
        students: [encryptedStudentEnvelope],
        sections: [{ id: 'sec_1', section_name: 'Section Gold' }],
        subjects: [{ id: 'sub_1', subject_name: 'Science' }],
        classRecords: [encryptedCrEnvelope],
      }
    };

    // 3. User restores backup via restoreBackupToFirestore
    await savePreRestoreSafetySnapshot();
    const result = await restoreBackupToFirestore(backup as never, {
      strategy: 'replace',
      selectedItems: new Set(['students', 'sections', 'subjects', 'classRecords']),
    });

    expect(result.created).toBeGreaterThan(0);

    // 4. Verify data was unsealed and accessible via db.getAllRecords
    const restoredStudents = await db.getAllRecords<typeof studentData>('students');
    expect(restoredStudents).toHaveLength(1);
    expect(restoredStudents[0].first_name).toBe('Encrypted');
    expect(restoredStudents[0].last_name).toBe('Learner');
    expect(restoredStudents[0].student_section).toBe('Section Gold');

    const restoredClassRecords = await db.getAllRecords<typeof classRecordData>('classRecords');
    expect(restoredClassRecords).toHaveLength(1);
    expect(restoredClassRecords[0].final_grade).toBe(93);

    // 5. Verify data is re-encrypted in IndexedDB under activeKey
    // By clearing fallback keys, activeKey alone can read the stored record!
    db.setDatabaseEncryptionKey(activeKey, [], false);
    const reVerifiedStudents = await db.getAllRecords<typeof studentData>('students');
    expect(reVerifiedStudents[0].first_name).toBe('Encrypted');
  });

  it('Scenario 9: Restoring backup containing encrypted envelopes via db.importFromBackup', async () => {
    const activeKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const legacyKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    db.setDatabaseEncryptionKey(activeKey, [legacyKey], false);

    const studentData = {
      lrn: '105563160088',
      first_name: 'Direct',
      last_name: 'Import',
      gender: 'Male',
      grade_level: 'Grade 7',
      student_section: 'Section Silver',
    };
    const { ciphertext, iv } = await encryptPayload(studentData, legacyKey);
    const encryptedStudentEnvelope = {
      lrn: '105563160088',
      ciphertext,
      iv,
      is_encrypted: true,
    };

    const backup = {
      payload: {
        schoolProfile: { school_id: '300001', name: 'Mabini NHS' },
        students: [encryptedStudentEnvelope],
        sections: [{ id: 'sec_1', section_name: 'Section Silver' }],
        subjects: [{ id: 'sub_1', subject_name: 'English' }],
        classRecords: [],
      }
    };

    // User restores via importFromBackup
    await db.importFromBackup(backup as never);

    const restoredStudents = await db.getAllRecords<typeof studentData>('students');
    expect(restoredStudents).toHaveLength(1);
    expect(restoredStudents[0].first_name).toBe('Direct');
    expect(restoredStudents[0].student_section).toBe('Section Silver');
  });

  it('Scenario 10: Encrypted envelopes that cannot be decrypted fail safely with clear error', async () => {
    const activeKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const unknownKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    // User is logged in with activeKey, NOT unknownKey
    db.setDatabaseEncryptionKey(activeKey, [], false);

    // Record is encrypted with an unknown key
    const { ciphertext, iv } = await encryptPayload({ lrn: '9999', first_name: 'Stranger' }, unknownKey);
    const undecryptableEnvelope = {
      lrn: '9999',
      ciphertext,
      iv,
      is_encrypted: true,
    };

    const backup = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '2.0.0-local',
        exportedBy: 'Other User',
      },
      payload: {
        students: [undecryptableEnvelope],
        sections: [],
        subjects: [],
        classRecords: [],
      }
    };

    await expect(db.importFromBackup(backup as never)).rejects.toThrow(
      'Backup students contains encrypted records that could not be decrypted with your current account key.'
    );

    await expect(
      restoreBackupToFirestore(backup as never, {
        strategy: 'replace',
        selectedItems: new Set(['students']),
      })
    ).rejects.toThrow(
      'Backup students contains encrypted records that could not be decrypted with your current account key.'
    );
  });

  it('Scenario 10: Auto-healing missing "users" store when restoring on legacy/outdated database schema', async () => {
    // Simulate legacy DB without 'users' store
    await db.resetConnection();
    
    // Create an older database without 'users'
    await new Promise<void>((resolve, reject) => {
      const delReq = indexedDB.deleteDatabase(PRODUCTION_DB_NAME);
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject(delReq.error);
    });

    // Manually open at version 12 without 'users' store
    await new Promise<void>((resolve, reject) => {
      const openReq = indexedDB.open(PRODUCTION_DB_NAME, 12);
      openReq.onupgradeneeded = (e) => {
        const idb = (e.target as IDBOpenDBRequest).result;
        idb.createObjectStore('schoolProfile', { keyPath: 'school_id' });
        idb.createObjectStore('students', { keyPath: 'lrn' });
        idb.createObjectStore('sections', { keyPath: 'id' });
        idb.createObjectStore('subjects', { keyPath: 'id' });
        idb.createObjectStore('classRecords', { keyPath: 'id' });
        idb.createObjectStore('enrollments', { keyPath: 'id' });
        idb.createObjectStore('announcements', { keyPath: 'id' });
        idb.createObjectStore('attendanceRecords', { keyPath: 'id' });
        idb.createObjectStore('sf2Sheets', { keyPath: 'id' });
        idb.createObjectStore('hpsRecords', { keyPath: 'id' });
        idb.createObjectStore('gradingSheetRecords', { keyPath: 'id' });
        idb.createObjectStore('observedValues', { keyPath: 'id' });
        idb.createObjectStore('backups', { keyPath: 'id' });
        // NOTE: 'users' store intentionally omitted to simulate user's environment!
      };
      openReq.onsuccess = () => {
        openReq.result.close();
        resolve();
      };
      openReq.onerror = () => reject(openReq.error);
    });

    // Now restore a backup that contains users
    const backupWithUsers = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '3.5.18',
        exportedBy: 'Admin',
      },
      payload: {
        students: [{ lrn: '112233445566', first_name: 'Healed', last_name: 'Student' }],
        sections: [],
        subjects: [],
        classRecords: [],
        users: [
          { uid: 'usr-999', username: 'recovered_teacher', displayName: 'Recovered Teacher' }
        ],
      }
    };

    // This must NOT throw 'Required database store "users" is unavailable.'
    await expect(db.importFromBackup(backupWithUsers as never)).resolves.not.toThrow();

    const restoredUsers = await db.getAllRecords<{ id: string; username: string }>('users');
    expect(restoredUsers).toHaveLength(1);
    expect(restoredUsers[0].id).toBe('usr-999');
    expect(restoredUsers[0].username).toBe('recovered_teacher');

    const restoredStudents = await db.getAllRecords<{ lrn: string }>('students');
    expect(restoredStudents).toHaveLength(1);
    expect(restoredStudents[0].lrn).toBe('112233445566');
  });

  it('Scenario 12: School Profile with institutional information, official seal, and specimen signatures is fully preserved in backups and snapshots', async () => {
    // Exact data matching user's Institutional Details & Specimen Signatures
    const profile: SchoolProfile = {
      school_id: '307014',
      name: 'Calibungan High School',
      region: 'Region III',
      division: 'Tarlac Province',
      district: 'Victoria East District',
      municipality: 'Victoria',
      province: 'Tarlac',
      grade_levels_offered: 'Grade 7-10; Grade 11-12',
      head_name: 'Agapito S. Gonzaga',
      head_position: 'OIC-School Head, HT-VI',
      adviser_name: 'Emerson M. Galano',
      section: 'Grade 12 • Paciolo',
      grade_level: 'Grade 12',
      logo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAA==',
      head_signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgA==',
      adviser_signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQA==',
      adviser_image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAA==',
      id_card_config: {
        template: 'standard',
        primaryColor: '#1e40af',
        accentColor: '#3b82f6',
        show: {
          qr: true,
          barcode: false,
          gradeSection: true,
          signature: true,
          address: true,
        },
      },
      school_year: '2026-2027',
    };

    await db.putRecord('schoolProfile', profile);
    await db.putRecord('students', { lrn: '123456789012', first_name: 'Ana', last_name: 'Santos' });
    await db.putRecord('sections', { id: 'sec-paciolo', section_name: 'Paciolo', section_grade_level: 'Grade 12' });

    // 1. Verify exportFullDatabaseBackup preserves all institutional fields, seals, and signatures
    const exportedBackup = await exportFullDatabaseBackup('Snapshot and Backup Integrity Test');
    const exportedProfile = exportedBackup.payload.schoolProfile as SchoolProfile;
    expect(exportedProfile).toBeTruthy();
    expect(exportedProfile.name).toBe('Calibungan High School');
    expect(exportedProfile.school_id).toBe('307014');
    expect(exportedProfile.region).toBe('Region III');
    expect(exportedProfile.division).toBe('Tarlac Province');
    expect(exportedProfile.district).toBe('Victoria East District');
    expect(exportedProfile.municipality).toBe('Victoria');
    expect(exportedProfile.province).toBe('Tarlac');
    expect(exportedProfile.grade_levels_offered).toBe('Grade 7-10; Grade 11-12');
    expect(exportedProfile.head_name).toBe('Agapito S. Gonzaga');
    expect(exportedProfile.head_position).toBe('OIC-School Head, HT-VI');
    expect(exportedProfile.adviser_name).toBe('Emerson M. Galano');
    expect(exportedProfile.section).toBe('Grade 12 • Paciolo');
    expect(exportedProfile.logo_url).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAA==');
    expect(exportedProfile.head_signature_url).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgA==');
    expect(exportedProfile.adviser_signature_url).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQA==');
    expect(exportedProfile.adviser_image_url).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAA==');
    expect(exportedProfile.id_card_config).toMatchObject({ template: 'standard' });

    // 2. Verify pre-restore safety snapshot records the exact full profile
    const snapshotInfo = await savePreRestoreSafetySnapshot();
    const storedSnapshot = await db.getRecord<{ data: typeof exportedBackup }>('automated_backups', snapshotInfo.id);
    expect(storedSnapshot?.data?.payload?.schoolProfile).toMatchObject({
      name: 'Calibungan High School',
      school_id: '307014',
      logo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAA==',
      head_signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgA==',
      adviser_signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQA==',
      head_position: 'OIC-School Head, HT-VI',
      adviser_name: 'Emerson M. Galano',
    });

    // 3. Clear database and test restoreBackupToFirestore
    await db.clearStore('schoolProfile');
    await db.clearStore('students');
    expect(await db.getAllRecords('schoolProfile')).toHaveLength(0);

    await restoreBackupToFirestore(exportedBackup as never, {
      strategy: 'replace',
      selectedItems: new Set(['schoolProfile', 'students']),
    });

    const restoredViaFirestore = await db.getAllRecords<SchoolProfile>('schoolProfile');
    expect(restoredViaFirestore).toHaveLength(1);
    expect(restoredViaFirestore[0]).toMatchObject({
      name: 'Calibungan High School',
      school_id: '307014',
      region: 'Region III',
      division: 'Tarlac Province',
      district: 'Victoria East District',
      municipality: 'Victoria',
      province: 'Tarlac',
      grade_levels_offered: 'Grade 7-10; Grade 11-12',
      head_name: 'Agapito S. Gonzaga',
      head_position: 'OIC-School Head, HT-VI',
      adviser_name: 'Emerson M. Galano',
      section: 'Grade 12 • Paciolo',
      logo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAA==',
      head_signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgA==',
      adviser_signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQA==',
    });

    // 4. Test direct db.importFromBackup
    await db.clearStore('schoolProfile');
    await db.importFromBackup(exportedBackup as never);
    const restoredViaDirect = await db.getAllRecords<SchoolProfile>('schoolProfile');
    expect(restoredViaDirect).toHaveLength(1);
    expect(restoredViaDirect[0]).toMatchObject({
      name: 'Calibungan High School',
      school_id: '307014',
      head_name: 'Agapito S. Gonzaga',
      head_position: 'OIC-School Head, HT-VI',
      logo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAA==',
      head_signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgA==',
      adviser_signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQA==',
    });
  });

  it('Scenario 13: resolveBestSchoolProfile prioritizes profile with seal and specimen signatures over empty/partial candidates', () => {
    const defaultCandidate = {
      school_id: '307014',
      name: 'Calibungan High School',
      region: 'Region III',
      division: 'Tarlac Province',
    };

    const richCandidateWithSignatures = {
      school_id: '307014',
      name: 'Calibungan High School',
      region: 'Region III',
      division: 'Tarlac Province',
      district: 'Victoria East District',
      municipality: 'Victoria',
      province: 'Tarlac',
      head_name: 'Agapito S. Gonzaga',
      head_position: 'OIC-School Head, HT-VI',
      adviser_name: 'Emerson M. Galano',
      section: 'Grade 12 • Paciolo',
      logo_url: 'data:image/png;base64,SEAL_DATA',
      head_signature_url: 'data:image/png;base64,PRINCIPAL_SIG_DATA',
      adviser_signature_url: 'data:image/png;base64,ADVISER_SIG_DATA',
    };

    const resolved = resolveBestSchoolProfile([defaultCandidate, richCandidateWithSignatures]);
    expect(resolved).toBeTruthy();
    expect(resolved?.logo_url).toBe('data:image/png;base64,SEAL_DATA');
    expect(resolved?.head_signature_url).toBe('data:image/png;base64,PRINCIPAL_SIG_DATA');
    expect(resolved?.adviser_signature_url).toBe('data:image/png;base64,ADVISER_SIG_DATA');
    expect(resolved?.head_position).toBe('OIC-School Head, HT-VI');
  });
});


