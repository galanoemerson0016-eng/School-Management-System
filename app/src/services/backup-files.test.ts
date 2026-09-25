import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { createHash } from 'crypto';
import { embedChecksum } from '../utils/backup-integrity';

const backupFiles = createRequire(import.meta.url)('../../electron/backup-files.cjs') as {
  saveBackupFile: (dir: string, name: string, data: unknown, retention?: number) => string;
  readBackupFile: (dir: string, name: string) => unknown;
  deleteBackupFile: (dir: string, name: string) => void;
  verifyStrongComprehensiveBackup: (data: unknown) => boolean;
  isInstallBackupReady: (downloaded: boolean, provided: string, saved: string | null, downloadedAt: number, savedAt: number, now: number) => boolean;
};

describe('isolated backup file storage', () => {
  let directory: string;
  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'formease-synthetic-backups-'));
  });
  afterEach(() => {
    if (directory.startsWith(path.join(os.tmpdir(), 'formease-synthetic-backups-'))) {
      fs.rmSync(directory, { recursive: true });
    }
  });

  it('publishes a complete backup without replacing a same-name file', () => {
    const name = 'SMS_Backup_Comprehensive_preupdate_3.5.17_synthetic.json';
    backupFiles.saveBackupFile(directory, name, { students: [{ lrn: 'SYNTHETIC-1' }] });
    expect(backupFiles.readBackupFile(directory, name)).toEqual({ students: [{ lrn: 'SYNTHETIC-1' }] });
    expect(() => backupFiles.saveBackupFile(directory, name, { students: [] })).toThrow('already exists');
    expect(backupFiles.readBackupFile(directory, name)).toEqual({ students: [{ lrn: 'SYNTHETIC-1' }] });
    expect(fs.readdirSync(directory)).toEqual([name]);
  });

  it('retains manual and pre-update files when routine retention is limited', () => {
    const pre = 'SMS_Backup_Comprehensive_preupdate_3.5.17_synthetic.json';
    const manual = 'SMS_Backup_Comprehensive_2026-09-23T00-00-00-000Z.json';
    const oldRoutine = 'SMS_Backup_Automated_2026-09-22T00-00-00-000Z.json';
    const newRoutine = 'SMS_Backup_Automated_2026-09-23T00-00-00-000Z.json';
    backupFiles.saveBackupFile(directory, pre, { type: 'protected' });
    backupFiles.saveBackupFile(directory, manual, { type: 'manual' });
    backupFiles.saveBackupFile(directory, oldRoutine, { type: 'old' }, 1);
    backupFiles.saveBackupFile(directory, newRoutine, { type: 'new' }, 1);
    expect(fs.readdirSync(directory).sort()).toEqual([pre, manual, newRoutine].sort());
  });

  it('rejects paths outside the backup directory for reads, writes and deletes', () => {
    for (const unsafe of ['../outside.json', '..\\outside.json', 'C:\\outside.json', '.hidden.json']) {
      expect(() => backupFiles.saveBackupFile(directory, unsafe, {})).toThrow('Invalid backup filename');
      expect(() => backupFiles.readBackupFile(directory, unsafe)).toThrow('Invalid backup filename');
      expect(() => backupFiles.deleteBackupFile(directory, unsafe)).toThrow('Invalid backup filename');
    }
    expect(fs.readdirSync(directory)).toEqual([]);
  });

  it('independently rejects nested changes to a pre-install safety backup', async () => {
    const payload = {
      students: [{ lrn: 'SYNTHETIC-1', first_name: 'Before' }],
      sections: [], subjects: [], classRecords: [], gradingSheetRecords: [],
    };
    const metadata = { payloadHash: createHash('sha256').update(JSON.stringify(payload)).digest('hex') };
    const backup = await embedChecksum({ metadata, payload });
    expect(backupFiles.verifyStrongComprehensiveBackup(backup)).toBe(true);
    const changed = structuredClone(backup);
    changed.payload.students[0].first_name = 'After';
    expect(backupFiles.verifyStrongComprehensiveBackup(changed)).toBe(false);
    expect(backupFiles.verifyStrongComprehensiveBackup({ payload })).toBe(false);
  });

  it('rejects direct, stale and mismatched install requests without a post-download backup', () => {
    const name = 'SMS_Backup_Comprehensive_prerestore_synthetic.json';
    const now = 1_000_000;
    expect(backupFiles.isInstallBackupReady(true, name, name, now - 60_000, now - 30_000, now)).toBe(true);
    expect(backupFiles.isInstallBackupReady(false, name, name, now - 60_000, now - 30_000, now)).toBe(false);
    expect(backupFiles.isInstallBackupReady(true, name, null, now - 60_000, 0, now)).toBe(false);
    expect(backupFiles.isInstallBackupReady(true, name, 'different.json', now - 60_000, now - 30_000, now)).toBe(false);
    expect(backupFiles.isInstallBackupReady(true, name, name, now - 60_000, now - 60_001, now)).toBe(false);
    expect(backupFiles.isInstallBackupReady(true, name, name, now - 400_000, now - 301_000, now)).toBe(false);
  });
});
