import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { db, ENCRYPTED_STORE_NAMES, PRODUCTION_DB_NAME, isEncryptedDatabaseEnvelope } from './database';
import { deriveDbKey, generateDataEncryptionKey, getDbSalt } from '../utils/db-crypto';
import { migrateLegacyEncryptedDatabase, prepareLegacyDekMigration, type MigrationHooks, type WrappedDekMetadata } from '../utils/encryption-migration';
import { hashSecret } from '../utils/password-crypto';
import { useAuthStore } from '../stores/auth-store';

const PASSWORD = 'LegacyPassword123!';
const CHANGED_PASSWORD = 'ChangedPassword456!';
const RECOVERED_PASSWORD = 'RecoveredPassword789!';
const ENVELOPE_KEY = 'formease-db-key-envelope-v1';

const synthetic = {
  schoolProfile: [{ school_id: '999999', school_name: 'FORMEASE MIGRATION TEST SCHOOL', principal_name: 'Synthetic Principal' }],
  sections: [{ id: 'section-synthetic-1', section_name: 'Synthetic Section', school_year: '2026-2027' }],
  subjects: [{ id: 'subject-synthetic-1', subject_name: 'Synthetic Mathematics', school_year: '2026-2027' }],
  hpsRecords: [{ id: 'hps-synthetic-1', section_id: 'section-synthetic-1', subject_id: 'subject-synthetic-1', quarter: 'Q1', value: 50 }],
  students: [
    { lrn: '999999000001', first_name: 'Aster', last_name: 'Synthetic', section_id: 'section-synthetic-1' },
    { lrn: '999999000002', first_name: 'Beryl', last_name: 'Synthetic', section_id: 'section-synthetic-1' },
  ],
  enrollments: [{ id: 'enrollment-synthetic-1', student_lrn: '999999000001', section_id: 'section-synthetic-1', school_year: '2026-2027' }],
  classRecords: [{ id: 'class-synthetic-1', student_lrn: '999999000001', subject_id: 'subject-synthetic-1', school_year: '2026-2027', quarter: 'Q1', final_grade: 91 }],
  gradingSheetRecords: [{ id: 'grading-synthetic-1', student_lrn: '999999000001', subject_id: 'subject-synthetic-1', school_year: '2026-2027', quarter: 'Q1', final_grade: 91 }],
  attendanceRecords: [{ id: 'attendance-synthetic-1', student_lrn: '999999000001', date: '2026-06-02', status: 'present', section_id: 'section-synthetic-1' }],
  sf2Sheets: [{ id: 'sf2-synthetic-1', section_id: 'section-synthetic-1', school_year: '2026-2027', month: 'June', attendance: { '999999000001': ['P'] } }],
  observedValues: [{ id: 'values-synthetic-1', student_lrn: '999999000001', subject_id: 'subject-synthetic-1', quarter: 'Q1', values: { makatao: 4 } }],
  automated_backups: [{ id: 'auto-synthetic-1', createdAt: '2026-06-02T00:00:00.000Z', summary: 'synthetic only' }],
} as const;

function base64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function metadata(): WrappedDekMetadata {
  return JSON.parse(localStorage.getItem(ENVELOPE_KEY) || 'null') as WrappedDekMetadata;
}

async function readRaw(storeName: string): Promise<unknown[]> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(PRODUCTION_DB_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise<unknown[]>((resolve, reject) => {
      const request = database.transaction(storeName, 'readonly').objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

async function verifySyntheticRecords(): Promise<void> {
  await expect(db.getAllRecords('schoolProfile')).resolves.toEqual(synthetic.schoolProfile);
  await expect(db.getAllRecords('sections')).resolves.toEqual(synthetic.sections);
  await expect(db.getAllRecords('subjects')).resolves.toEqual(synthetic.subjects);
  await expect(db.getAllRecords('hpsRecords')).resolves.toEqual(synthetic.hpsRecords);
  await expect(db.getAllRecords('students')).resolves.toEqual(synthetic.students);
  await expect(db.getAllRecords('enrollments')).resolves.toEqual(synthetic.enrollments);
  await expect(db.getAllRecords('classRecords')).resolves.toEqual(synthetic.classRecords);
  await expect(db.getAllRecords('gradingSheetRecords')).resolves.toEqual(synthetic.gradingSheetRecords);
  await expect(db.getAllRecords('attendanceRecords')).resolves.toEqual(synthetic.attendanceRecords);
  await expect(db.getAllRecords('sf2Sheets')).resolves.toEqual(synthetic.sf2Sheets);
  await expect(db.getAllRecords('observedValues')).resolves.toEqual(synthetic.observedValues);
  await expect(db.getAllRecords('automated_backups')).resolves.toEqual(synthetic.automated_backups);
}

async function createLegacyDatabase(): Promise<{ legacyKey: CryptoKey; passwordKek: CryptoKey }> {
  localStorage.setItem('formease-db-salt-v1', base64(new Uint8Array(32).fill(24)));
  const salt = await getDbSalt();
  const legacyKey = await deriveDbKey(PASSWORD, salt);
  db.setDatabaseEncryptionKey(legacyKey, [], false);
  for (const [store, records] of Object.entries(synthetic)) {
    await db.putRecordsBulk(store, [...records]);
  }
  expect(localStorage.getItem(ENVELOPE_KEY)).toBeNull();
  return { legacyKey, passwordKek: legacyKey };
}

async function prepareMigration(passwordKek: CryptoKey): Promise<{ dek: CryptoKey; metadata: WrappedDekMetadata }> {
  const prepared = await prepareLegacyDekMigration({
    passwordKek,
    recoveryProtectorAvailable: true,
    protectRecoveryDek: async rawDek => {
      protectedDek = rawDek;
      return true;
    },
  });
  localStorage.setItem(ENVELOPE_KEY, JSON.stringify(prepared.metadata));
  return prepared;
}

let protectedDek: string | null = null;

describe('DEK migration using production IndexedDB persistence', () => {
  beforeEach(async () => {
    await db.resetConnection();
    (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
    (globalThis as unknown as { IDBKeyRange: typeof IDBKeyRange }).IDBKeyRange = IDBKeyRange;
    localStorage.clear();
    sessionStorage.clear();
    protectedDek = null;
    window.electronAPI = {
      recoveryProtectorAvailable: async () => true,
      protectRecoveryDek: async rawDek => { protectedDek = rawDek; return true; },
      recoverProtectedDek: async () => protectedDek,
    } as Window['electronAPI'];
    useAuthStore.setState({ user: null, isLoading: false, isAuthenticated: false, needsAccountSetup: false, error: null });
  });

  it('migrates a genuine legacy database through production login and survives password change and recovery restart cycles', async () => {
    const { legacyKey } = await createLegacyDatabase();
    await verifySyntheticRecords();

    db.setDatabaseEncryptionKey(await deriveDbKey('wrong password', await getDbSalt()), [], false);
    await expect(db.getAllRecords('students')).rejects.toThrow('could not be decrypted');
    expect(isEncryptedDatabaseEnvelope((await readRaw('students'))[0])).toBe(true);
    db.setDatabaseEncryptionKey(legacyKey, [], false);

    localStorage.setItem('formease-credentials-v2', JSON.stringify({
      version: 2, username: 'migration.admin', passwordHash: await hashSecret(PASSWORD), role: 'admin',
      securityQuestion: 'Synthetic question?', securityAnswerHash: await hashSecret('synthetic answer'),
    }));
    expect(await useAuthStore.getState().login('migration.admin', PASSWORD)).toBe(true);
    expect(metadata().state).toBe('migrated');
    const fingerprint = metadata().dekFingerprint;
    await verifySyntheticRecords();

    await useAuthStore.getState().logout();
    await db.resetConnection();
    expect(await useAuthStore.getState().login('migration.admin', PASSWORD)).toBe(true);
    await verifySyntheticRecords();

    const rawBeforePasswordChange = await readRaw('students');
    await useAuthStore.getState().changeCredentials({ currentPassword: PASSWORD, newPassword: CHANGED_PASSWORD });
    expect(metadata().dekFingerprint).toBe(fingerprint);
    expect(await readRaw('students')).toEqual(rawBeforePasswordChange);
    await useAuthStore.getState().logout();
    await db.resetConnection();
    expect(await useAuthStore.getState().login('migration.admin', PASSWORD)).toBe(false);
    expect(await useAuthStore.getState().login('migration.admin', CHANGED_PASSWORD)).toBe(true);
    await verifySyntheticRecords();

    await useAuthStore.getState().resetPasswordWithSecurityAnswer('synthetic answer', RECOVERED_PASSWORD);
    expect(metadata().dekFingerprint).toBe(fingerprint);
    await useAuthStore.getState().logout();
    await db.resetConnection();
    expect(await useAuthStore.getState().login('migration.admin', RECOVERED_PASSWORD)).toBe(true);
    await verifySyntheticRecords();
  });

  it('migrates trial-key encrypted automated backups together with password-key legacy records', async () => {
    const browserMachineId = 'BROWSER-SYNTHETIC-TRIAL-KEY';
    localStorage.setItem('formease-browser-id', browserMachineId);
    const salt = await getDbSalt();
    const passwordKey = await deriveDbKey(PASSWORD, salt);
    const trialKey = await deriveDbKey(browserMachineId, salt);

    db.setDatabaseEncryptionKey(passwordKey, [], false);
    for (const [storeName, records] of Object.entries(synthetic)) {
      if (storeName === 'automated_backups') continue;
      await db.putRecordsBulk(storeName, [...records]);
    }

    // Trial mode used the browser's persistent machine ID as its legacy key.
    db.setDatabaseEncryptionKey(trialKey, [], false);
    await db.putRecordsBulk('automated_backups', [...synthetic.automated_backups]);
    expect(isEncryptedDatabaseEnvelope((await readRaw('automated_backups'))[0])).toBe(true);

    localStorage.setItem('formease-credentials-v2', JSON.stringify({
      version: 2, username: 'migration.admin', passwordHash: await hashSecret(PASSWORD), role: 'admin',
    }));

    expect(await useAuthStore.getState().login('migration.admin', PASSWORD)).toBe(true);
    expect(metadata().state).toBe('migrated');
    await verifySyntheticRecords();
    expect(isEncryptedDatabaseEnvelope((await readRaw('automated_backups'))[0])).toBe(true);
  });
  it('migrates automated backups encrypted with default "formease" key alongside password-key legacy records', async () => {
    const salt = await getDbSalt();
    const passwordKey = await deriveDbKey(PASSWORD, salt);
    const defaultKey = await deriveDbKey('formease', salt);

    db.setDatabaseEncryptionKey(passwordKey, [], false);
    for (const [storeName, records] of Object.entries(synthetic)) {
      if (storeName === 'automated_backups') continue;
      await db.putRecordsBulk(storeName, [...records]);
    }

    // Automated backup created while profile still used default master password.
    db.setDatabaseEncryptionKey(defaultKey, [], false);
    await db.putRecordsBulk('automated_backups', [...synthetic.automated_backups]);
    expect(isEncryptedDatabaseEnvelope((await readRaw('automated_backups'))[0])).toBe(true);

    localStorage.setItem('formease-credentials-v2', JSON.stringify({
      version: 2, username: 'migration.admin', passwordHash: await hashSecret(PASSWORD), role: 'admin',
    }));

    expect(await useAuthStore.getState().login('migration.admin', PASSWORD)).toBe(true);
    expect(metadata().state).toBe('migrated');
    await verifySyntheticRecords();
    expect(isEncryptedDatabaseEnvelope((await readRaw('automated_backups'))[0])).toBe(true);
  });

  it('allows login and preserves all school records when automated_backups contains an unreadable/stale legacy snapshot', async () => {
    const salt = await getDbSalt();
    const passwordKey = await deriveDbKey(PASSWORD, salt);
    const unreadableKey = await deriveDbKey('unknown-ancient-password-key', salt);

    db.setDatabaseEncryptionKey(passwordKey, [], false);
    for (const [storeName, records] of Object.entries(synthetic)) {
      if (storeName === 'automated_backups') continue;
      await db.putRecordsBulk(storeName, [...records]);
    }

    // Put a valid automated backup under passwordKey
    await db.putRecordsBulk('automated_backups', [...synthetic.automated_backups]);

    // Put an additional stale/unreadable backup under an unknown key
    db.setDatabaseEncryptionKey(unreadableKey, [], false);
    await db.putRecord('automated_backups', {
      id: 'auto-stale-unreadable-snapshot',
      createdAt: '2024-01-01T00:00:00.000Z',
      summary: 'unreadable legacy snapshot'
    });

    localStorage.setItem('formease-credentials-v2', JSON.stringify({
      version: 2, username: 'migration.admin', passwordHash: await hashSecret(PASSWORD), role: 'admin',
    }));

    // Must NOT fail with "Encrypted automated_backups record could not be decrypted"
    expect(await useAuthStore.getState().login('migration.admin', PASSWORD)).toBe(true);
    expect(metadata().state).toBe('migrated');

    // All school data must be intact and readable
    expect(await db.getAllRecords('students')).toHaveLength(synthetic.students.length);
    expect(await db.getAllRecords('classRecords')).toHaveLength(synthetic.classRecords.length);
    expect(await db.getAllRecords('attendanceRecords')).toHaveLength(synthetic.attendanceRecords.length);

    // The valid automated backup is preserved and readable under the new DEK
    const validBackups = await db.getAllRecords<{ id: string }>('automated_backups');
    expect(validBackups.some(b => b.id === 'auto-synthetic-1')).toBe(true);
  });

  it('allows login and preserves all school records when gradingSheetRecords contains an unreadable/stale legacy record', async () => {
    const salt = await getDbSalt();
    const passwordKey = await deriveDbKey(PASSWORD, salt);
    const unreadableKey = await deriveDbKey('unknown-ancient-password-key', salt);

    db.setDatabaseEncryptionKey(passwordKey, [], false);
    for (const [storeName, records] of Object.entries(synthetic)) {
      if (storeName === 'gradingSheetRecords') continue;
      await db.putRecordsBulk(storeName, [...records]);
    }

    // Put valid gradingSheetRecords under passwordKey
    await db.putRecordsBulk('gradingSheetRecords', [...synthetic.gradingSheetRecords]);

    // Put an additional stale/unreadable gradingSheetRecord under an unknown key
    db.setDatabaseEncryptionKey(unreadableKey, [], false);
    await db.putRecord('gradingSheetRecords', {
      id: 'gs-stale-unreadable-record',
      student_lrn: '999999999999',
      final_grade: 85,
    });

    localStorage.setItem('formease-credentials-v2', JSON.stringify({
      version: 2, username: 'jamesking482', passwordHash: await hashSecret(PASSWORD), role: 'admin',
    }));

    // Must NOT fail with "Encrypted gradingSheetRecords record could not be decrypted"
    expect(await useAuthStore.getState().login('jamesking482', PASSWORD)).toBe(true);
    expect(metadata().state).toBe('migrated');

    // All school data must be intact and readable
    expect(await db.getAllRecords('students')).toHaveLength(synthetic.students.length);
    expect(await db.getAllRecords('classRecords')).toHaveLength(synthetic.classRecords.length);
    expect(await db.getAllRecords('attendanceRecords')).toHaveLength(synthetic.attendanceRecords.length);

    // The valid grading sheet records are preserved and readable under the new DEK
    const validGradingSheets = await db.getAllRecords<{ id: string }>('gradingSheetRecords');
    expect(validGradingSheets.some(g => g.id === synthetic.gradingSheetRecords[0].id)).toBe(true);
  });

  it('allows login and preserves all school records when classRecords contains an unreadable/stale legacy record (Macasandig NHS fix)', async () => {
    const salt = await getDbSalt();
    const passwordKey = await deriveDbKey(PASSWORD, salt);
    const unreadableKey = await deriveDbKey('unknown-ancient-password-key', salt);

    db.setDatabaseEncryptionKey(passwordKey, [], false);
    for (const [storeName, records] of Object.entries(synthetic)) {
      if (storeName === 'classRecords') continue;
      await db.putRecordsBulk(storeName, [...records]);
    }

    // Put valid classRecords under passwordKey
    await db.putRecordsBulk('classRecords', [...synthetic.classRecords]);

    // Put an additional stale/unreadable classRecords record under an unknown key
    db.setDatabaseEncryptionKey(unreadableKey, [], false);
    await db.putRecord('classRecords', {
      id: 'cr-stale-unreadable-record',
      student_lrn: '999999999999',
      subject_id: 'sub-unknown',
      final_grade: 88,
    });

    localStorage.setItem('formease-credentials-v2', JSON.stringify({
      version: 2, username: 'jamesking482', passwordHash: await hashSecret(PASSWORD), role: 'admin',
    }));

    // Must NOT fail with "Encrypted classRecords record could not be decrypted"
    expect(await useAuthStore.getState().login('jamesking482', PASSWORD)).toBe(true);
    expect(metadata().state).toBe('migrated');

    // All valid school data must be intact and readable
    expect(await db.getAllRecords('students')).toHaveLength(synthetic.students.length);
    expect(await db.getAllRecords('classRecords')).toHaveLength(synthetic.classRecords.length);
  });

  it('allows login and migration when gradingSheetRecords has duplicate keys or variance (San Pedro NHS fix)', async () => {
    const salt = await getDbSalt();
    const passwordKey = await deriveDbKey(PASSWORD, salt);

    db.setDatabaseEncryptionKey(passwordKey, [], false);
    for (const [storeName, records] of Object.entries(synthetic)) {
      await db.putRecordsBulk(storeName, [...records]);
    }

    // Add multiple grading sheet records for the same student sharing an LRN but different subjects
    await db.putRecord('gradingSheetRecords', {
      id: 'gs-math-q1',
      student_lrn: '105563160001',
      lrn: '105563160001',
      subject_id: 'sub-math',
      quarter: 1,
      final_grade: 89,
    });
    await db.putRecord('gradingSheetRecords', {
      id: 'gs-eng-q1',
      student_lrn: '105563160001',
      lrn: '105563160001',
      subject_id: 'sub-eng',
      quarter: 1,
      final_grade: 92,
    });

    localStorage.setItem('formease-credentials-v2', JSON.stringify({
      version: 2, username: 'jamesking482', passwordHash: await hashSecret(PASSWORD), role: 'admin',
    }));

    // Must NOT fail with "Migration integrity check failed for gradingSheetRecords"
    expect(await useAuthStore.getState().login('jamesking482', PASSWORD)).toBe(true);
    expect(metadata().state).toBe('migrated');
  });

  it.each([
    'migration_in_progress',
    'after_first_store',
    'migration_verifying',
    'during_verification',
    'migrated',
  ] as const)('recovers real persisted IndexedDB data after interruption at %s', async (point) => {
    const { legacyKey, passwordKek } = await createLegacyDatabase();
    const prepared = await prepareMigration(passwordKek);
    let firstStoreSeen = false;
    const hooks: MigrationHooks = {
      afterStage: stage => {
        if (stage === point || (point === 'migrated' && stage === 'migrated')) throw new Error(`injected ${point}`);
      },
      afterStore: store => {
        if (!firstStoreSeen) {
          firstStoreSeen = true;
          if (point === 'after_first_store') throw new Error(`injected ${point}:${store}`);
        }
      },
      afterVerificationStore: store => {
        if (point === 'during_verification') throw new Error(`injected ${point}:${store}`);
      },
    };
    await expect(migrateLegacyEncryptedDatabase({ database: db, stores: ENCRYPTED_STORE_NAMES, legacyKey, dek: prepared.dek, metadata: prepared.metadata, saveMetadata: value => localStorage.setItem(ENVELOPE_KEY, JSON.stringify(value)), hooks }))
      .rejects.toThrow('injected');
    expect(metadata().state).toBe('migration_failed_recoverable');

    if (point === 'after_first_store') {
      db.setDatabaseEncryptionKey(prepared.dek, [], false);
      expect(isEncryptedDatabaseEnvelope((await db.getAllRecords('students'))[0])).toBe(false);
      await expect(db.getAllRecords('classRecords')).rejects.toThrow('could not be decrypted');
      expect(isEncryptedDatabaseEnvelope((await readRaw('classRecords'))[0])).toBe(true);
    }

    // A process restart removes both active and fallback keys. Resumption uses
    // persisted state and the caller-provided authenticated legacy key only.
    db.setDatabaseEncryptionKey(null);
    await db.resetConnection();
    const resumed = await migrateLegacyEncryptedDatabase({
      database: db, stores: ENCRYPTED_STORE_NAMES, legacyKey, dek: prepared.dek, metadata: metadata(),
      saveMetadata: value => localStorage.setItem(ENVELOPE_KEY, JSON.stringify(value)),
    });
    expect(resumed.state).toBe('migrated');
    db.setDatabaseEncryptionKey(prepared.dek, [], false);
    await verifySyntheticRecords();
  });

  it('keeps normal password access when recovery protection is unavailable or corrupt', async () => {
    await createLegacyDatabase();
    localStorage.setItem('formease-credentials-v2', JSON.stringify({
      version: 2, username: 'migration.admin', passwordHash: await hashSecret(PASSWORD), role: 'admin',
      securityQuestion: 'Synthetic question?', securityAnswerHash: await hashSecret('synthetic answer'),
    }));
    expect(await useAuthStore.getState().login('migration.admin', PASSWORD)).toBe(true);
    const originalMetadata = localStorage.getItem(ENVELOPE_KEY);
    protectedDek = 'not-a-dek';
    await expect(useAuthStore.getState().resetPasswordWithSecurityAnswer('synthetic answer', RECOVERED_PASSWORD)).rejects.toThrow('Password recovery is unavailable');
    expect(localStorage.getItem(ENVELOPE_KEY)).toBe(originalMetadata);
    await useAuthStore.getState().logout();
    await db.resetConnection();
    expect(await useAuthStore.getState().login('migration.admin', PASSWORD)).toBe(true);
    await verifySyntheticRecords();
  });

  it('uses recovery to repair a corrupt password wrapper without changing the encrypted database', async () => {
    await createLegacyDatabase();
    localStorage.setItem('formease-credentials-v2', JSON.stringify({
      version: 2, username: 'migration.admin', passwordHash: await hashSecret(PASSWORD), role: 'admin',
      securityQuestion: 'Synthetic question?', securityAnswerHash: await hashSecret('synthetic answer'),
    }));
    expect(await useAuthStore.getState().login('migration.admin', PASSWORD)).toBe(true);
    const originalRecords = await readRaw('students');
    const damaged = metadata();
    localStorage.setItem(ENVELOPE_KEY, JSON.stringify({ ...damaged, passwordWrappedDek: { ...damaged.passwordWrappedDek, ciphertext: 'invalid' } }));
    await useAuthStore.getState().logout();
    await db.resetConnection();
    expect(await useAuthStore.getState().login('migration.admin', PASSWORD)).toBe(false);
    await useAuthStore.getState().resetPasswordWithSecurityAnswer('synthetic answer', RECOVERED_PASSWORD);
    await db.resetConnection();
    expect(await useAuthStore.getState().login('migration.admin', RECOVERED_PASSWORD)).toBe(true);
    expect(await readRaw('students')).toEqual(originalRecords);
    await verifySyntheticRecords();
  });

  it('exports portable logical backup data without credentials, DEK metadata, or OS recovery material', async () => {
    await createLegacyDatabase();
    localStorage.setItem('formease-credentials-v2', JSON.stringify({
      version: 2, username: 'migration.admin', passwordHash: await hashSecret(PASSWORD), role: 'admin',
    }));
    expect(await useAuthStore.getState().login('migration.admin', PASSWORD)).toBe(true);
    const backup = await db.exportAllData();
    const serialized = JSON.stringify(backup);
    expect(serialized).toContain('999999000001');
    expect(serialized).not.toContain('formease-db-key-envelope-v1');
    expect(serialized).not.toContain('formease-credentials-v2');
    expect(serialized).not.toContain('formease-db-recovery-dek-v1.enc');

    await db.resetConnection();
    (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
    localStorage.clear();
    db.setDatabaseEncryptionKey(await generateDataEncryptionKey(), [], false);
    await db.importFromBackup(backup);
    // The supported importer may add compatibility defaults (currently an
    // empty student_section), so validate portable logical identity/content
    // rather than requiring byte-for-byte object identity.
    expect(await db.getAllRecords('students')).toEqual(expect.arrayContaining([
      expect.objectContaining({ lrn: '999999000001', first_name: 'Aster', last_name: 'Synthetic', section_id: 'section-synthetic-1' }),
      expect.objectContaining({ lrn: '999999000002', first_name: 'Beryl', last_name: 'Synthetic', section_id: 'section-synthetic-1' }),
    ]));
    expect(await db.getAllRecords('attendanceRecords')).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'attendance-synthetic-1', student_lrn: '999999000001', date: '2026-06-02', status: 'present' }),
    ]));
    expect(await db.getAllRecords('classRecords')).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'class-synthetic-1', student_lrn: '999999000001', subject_id: 'subject-synthetic-1', final_grade: 91 }),
    ]));
    expect(await db.getAllRecords('sf2Sheets')).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'sf2-synthetic-1', section_id: 'section-synthetic-1', school_year: '2026-2027', month: 'June' }),
    ]));
    // automated_backups is internal retention metadata, not part of the
    // supported portable logical-backup payload.
    await Promise.all(Object.entries(synthetic).filter(([store]) => store !== 'automated_backups').map(async ([store, records]) => {
      expect(await db.getAllRecords(store)).toHaveLength(records.length);
    }));
  });
});
