import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from './database';
import { AutoBackupManager } from './AutoBackupManager';
import * as backupRestore from '../utils/backup-restore';
import * as masterExcel from './master-excel-backup';
import type { ComprehensiveBackup } from '../utils/backup-restore';

vi.mock('../utils/backup-restore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/backup-restore')>();
  return { ...actual, exportFullDatabaseBackup: vi.fn() };
});

describe('automated paired backups', () => {
  const backup = {
    metadata: { exportDate: '2026-09-25T00:00:00.000Z', version: '2.0.0-local', exportedBy: 'test', note: '', warning: '' },
    summary: { activeSchoolYear: '2026-2027', students: 1, studentProfiles: 1, sections: 1, subjects: 1, grades: 1,
      gradingSheetRecords: 1, observedValues: 0, hpsRecords: 0, sf2Sheets: 0, announcements: 0, schoolYears: 1,
      enrollments: 1, users: 0, systemSettings: 1, adviserAssignments: 0, gradingConfiguration: 1, attendanceRecords: 0 },
    payload: { schoolProfile: { school_id: 'S1', name: 'Synthetic School' }, schoolYears: [], activeSchoolYear: '2026-2027',
      enrollments: [], students: [], studentProfiles: [], sections: [], subjects: [], classRecords: [], gradingSheetRecords: [],
      observedValues: [], hpsRecords: [], sf2Sheets: [], announcements: [], attendanceRecords: [], users: [],
      systemSettings: {}, adviserAssignments: [], gradingConfiguration: {}, localStorageData: {} },
  } as unknown as ComprehensiveBackup;
  let savedJson: Array<{ data: unknown; filename: string }>;
  let savedWorkbook: Array<{ data: string; filename: string }>;

  beforeEach(() => {
    vi.clearAllMocks();
    savedJson = [];
    savedWorkbook = [];
    AutoBackupManager._backupInFlight = null;
    localStorage.clear();
    vi.spyOn(db, 'isPreviewMode').mockReturnValue(false);
    vi.spyOn(db, 'putRecord').mockResolvedValue('synthetic-backup');
    vi.spyOn(AutoBackupManager, 'rotateBackups').mockResolvedValue();
    vi.mocked(backupRestore.exportFullDatabaseBackup).mockResolvedValue(structuredClone(backup));
    vi.spyOn(masterExcel, 'getMasterExcelBackupBuffer').mockResolvedValue(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]));
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: {
        saveAutoBackup: vi.fn(async (data: unknown, filename: string) => {
          savedJson.push({ data, filename });
          return { success: true, path: filename };
        }),
        saveAutoBackupWorkbook: vi.fn(async (data: string, filename: string) => {
          savedWorkbook.push({ data, filename });
          return { success: true, path: filename };
        }),
      },
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('writes one matched JSON, Excel, and manifest set for one snapshot ID', async () => {
    await AutoBackupManager.triggerBackup();

    expect(savedWorkbook).toHaveLength(1);
    expect(savedJson).toHaveLength(2);
    const jsonBackup = savedJson.find(entry => entry.filename.endsWith('.json') && entry.filename.includes('SMS_Backup_Automated'))?.data as ComprehensiveBackup;
    const manifest = savedJson.find(entry => entry.filename.endsWith('_Manifest.json'))?.data as { status: string; snapshotId: string; files: Array<{ sha256: string }> };
    expect(jsonBackup.metadata.snapshotId).toBe(manifest.snapshotId);
    expect(manifest.status).toBe('verified-pair');
    expect(manifest.files).toHaveLength(2);
    expect(vi.mocked(db.putRecord)).toHaveBeenCalledWith('automated_backups', expect.objectContaining({
      snapshotId: manifest.snapshotId,
      pairedFileStatus: 'verified',
    }));
  });

  it('does not report a successful pair or advance the backup time if one file fails', async () => {
    const api = window.electronAPI!;
    api.saveAutoBackupWorkbook = vi.fn().mockResolvedValue({ success: false, error: 'synthetic disk full' });

    await expect(AutoBackupManager.triggerBackup()).rejects.toThrow('synthetic disk full');
    expect(localStorage.getItem('formease_last_autobackup_time')).toBeNull();
    expect(db.putRecord).not.toHaveBeenCalled();
  });
});
