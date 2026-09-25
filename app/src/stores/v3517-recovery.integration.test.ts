import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { db } from '../services/database';
import { exportFullDatabaseBackup } from '../utils/backup-restore';
import { embedChecksum } from '../utils/backup-integrity';
import { initializeAppStore, initializePublicAppProfile, useAppStore } from './app-store';
import { findVerifiedV3517RecoveryBackup } from './update-store';

const profile = {
  school_id: 'recovery-school', name: 'RECOVERY TEST SCHOOL', section: 'Einstein', school_year: '2026-2027',
};
const section = { id: 'section-real-einstein', section_name: 'Einstein', section_grade_level: 'Grade 7', is_advisory: true };
const student = {
  lrn: '999900000001', first_name: 'ADA', last_name: 'LOVELACE', gender: 'Female' as const,
  birthday: '2012-01-01', age: 14, address: 'Synthetic', student_section: 'Einstein', grade_level: 'Grade 7',
};
const subject = { id: 'subject-math', subject_name: 'Mathematics', grade_level: 'Grade 7', section_id: section.id };
const grade = {
  id: 'grade-ada', student_lrn: student.lrn, section_id: section.id, subject_id: subject.id,
  school_year: '2026-2027', quarter: 1 as const, written_works: [20], performance_tasks: [40], quarterly_exam: 30,
};
const temporaryGrade = {
  id: 'grade-temp', student_lrn: 'TEMP-RECOVERY-1', section_id: section.id, subject_id: subject.id,
  school_year: '2026-2027', quarter: 1 as const, written_works: [18], performance_tasks: [36], quarterly_exam: 27,
};

describe('v3.5.17 recovery journey', () => {
  beforeEach(async () => {
    await db.resetConnection();
    db.setDatabaseEncryptionKey(null);
    (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
    (globalThis as unknown as { IDBKeyRange: typeof IDBKeyRange }).IDBKeyRange = IDBKeyRange;
    localStorage.clear();
    sessionStorage.clear();
    window.electronAPI = undefined;
  });

  it('restores verified v3.5.17 data and retains it through the production startup path', async () => {
    await db.putRecordsBulk('schoolProfile', [profile]);
    await db.putRecordsBulk('sections', [section]);
    await db.putRecordsBulk('subjects', [subject]);
    await db.putRecordsBulk('students', [student]);
    await db.putRecordsBulk('classRecords', [grade, temporaryGrade]);
    await db.putRecordsBulk('gradingSheetRecords', [grade, temporaryGrade]);
    const exportedBackup = await exportFullDatabaseBackup('Pre-Update Safety Backup - v3.5.17');
    const preUpdateBackup = await embedChecksum(exportedBackup as unknown as Record<string, unknown>);
    const filename = 'SMS_Backup_Comprehensive_preupdate_3.5.17_2026-09-22T00-00-00-000Z.json';

    await db.importFromBackup({ payload: { students: [], sections: [], subjects: [], classRecords: [], gradingSheetRecords: [] } });
    expect(await db.getStoreCount('students')).toBe(0);

    const recoveryApi = {
      listFsBackups: vi.fn().mockResolvedValue([{ filename }]),
      readFsBackupContent: vi.fn().mockResolvedValue(preUpdateBackup),
    };
    await expect(findVerifiedV3517RecoveryBackup(recoveryApi)).resolves.toMatchObject({ filename, counts: { students: 1, classRecords: 2 } });

    await db.importFromBackup(preUpdateBackup as unknown as Record<string, unknown>);
    await initializeAppStore();

    expect(await db.getAllRecords('students')).toEqual(expect.arrayContaining([expect.objectContaining({ lrn: student.lrn })]));
    expect(await db.getAllRecords('sections')).toEqual(expect.arrayContaining([expect.objectContaining({ id: section.id, section_name: 'Einstein' })]));
    expect(await db.getAllRecords('classRecords')).toEqual(expect.arrayContaining([
      expect.objectContaining({ student_lrn: student.lrn }),
      expect.objectContaining({ student_lrn: 'TEMP-RECOVERY-1' }),
    ]));
    expect(useAppStore.getState().students).toEqual(expect.arrayContaining([expect.objectContaining({ lrn: student.lrn })]));
    expect(useAppStore.getState().classRecords).toEqual(expect.arrayContaining([
      expect.objectContaining({ student_lrn: student.lrn }),
      expect.objectContaining({ student_lrn: 'TEMP-RECOVERY-1' }),
    ]));
  });

  it('does not rewrite a real Archimedes section or its adviser on startup', async () => {
    const teacherSection = {
      id: 'section-real-archimedes', section_name: 'Archimedes', section_grade_level: 'Grade 7',
      adviser_name: 'Maria L. Santos', adviser_id: 'adv-real-1', is_advisory: false,
      taught_subjects: ['Specialization'], teaching_subjects: ['Specialization'],
    };
    await db.putRecordsBulk('schoolProfile', [{ ...profile, section: 'Archimedes', adviser_name: 'Another Teacher' }]);
    await db.putRecordsBulk('sections', [teacherSection]);
    const teacherSubject = { id: 'subject-real-specialization', subject_name: 'Specialization', grade_level: 'Grade 7' };
    await db.putRecordsBulk('subjects', [subject, teacherSubject]);
    const writes = vi.spyOn(db, 'putRecordsBulk');

    await initializeAppStore();

    expect(await db.getAllRecords('sections')).toEqual([teacherSection]);
    expect(useAppStore.getState().sections).toEqual([teacherSection]);
    expect(writes.mock.calls.filter(([store]) => store === 'sections')).toHaveLength(0);
    expect(await db.getAllRecords('subjects')).toEqual(expect.arrayContaining([teacherSubject]));
    expect(useAppStore.getState().subjects).toEqual(expect.arrayContaining([expect.objectContaining(teacherSubject)]));
    writes.mockRestore();
  });

  it('signals a failed database read instead of displaying empty records', async () => {
    useAppStore.setState({ isSyncReady: true });
    const read = vi.spyOn(db, 'getAllRecords').mockRejectedValueOnce(new Error('synthetic unreadable store'));
    await expect(initializeAppStore()).rejects.toThrow('synthetic unreadable store');
    expect(useAppStore.getState().isSyncReady).toBe(false);
    read.mockRestore();
  });

  it('opens the public profile before login and protected records only after key unlock', async () => {
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    db.setDatabaseEncryptionKey(key, [], false);
    await db.putRecord('schoolProfile', profile);
    await db.putRecord('students', student);
    db.setDatabaseEncryptionKey(null);
    await db.resetConnection();

    await expect(initializePublicAppProfile()).resolves.toBeUndefined();
    expect(useAppStore.getState().schoolProfile.name).toBe('RECOVERY TEST SCHOOL');
    await expect(initializeAppStore()).rejects.toThrow('database key');

    db.setDatabaseEncryptionKey(key, [], false);
    await expect(initializeAppStore()).resolves.toBeUndefined();
    expect(useAppStore.getState().students).toEqual(expect.arrayContaining([expect.objectContaining({ lrn: student.lrn })]));
  });
});
