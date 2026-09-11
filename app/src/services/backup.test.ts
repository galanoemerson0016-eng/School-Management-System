import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, type BackupMetadata } from './database';
import { createBackup, checkAndCreateDailyBackup, downloadBackupFile, restoreFromBackupFile } from './backup';

vi.mock('./database', () => {
  const mockBackups: BackupMetadata[] = [];
  return {
    db: {
      getAllRecords: vi.fn().mockResolvedValue([]),
      getBackups: vi.fn().mockImplementation(async () => mockBackups),
      saveBackupMetadata: vi.fn().mockImplementation(async (meta: BackupMetadata) => {
        mockBackups.push(meta);
      }),
      deleteBackup: vi.fn().mockResolvedValue(undefined),
      importFromBackup: vi.fn().mockResolvedValue(undefined),
      exportAllData: vi.fn().mockResolvedValue({
        schoolProfile: [],
        students: [],
        sections: [],
        subjects: [],
        classRecords: [],
        enrollments: [],
        announcements: [],
        attendanceRecords: [],
        sf2Sheets: [],
        hpsRecords: [],
      }),
    },
  };
});

describe('Backup Service (Comprehensive Full Database Export)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createBackup generates a ComprehensiveBackup and triggers SMS_Backup_Comprehensive download', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    const backupId = await createBackup('Test Daily Startup Backup');
    expect(backupId).toMatch(/^backup_\d+$/);

    // Verify metadata was saved to db
    expect(db.saveBackupMetadata).toHaveBeenCalledTimes(1);
    const savedMeta = vi.mocked(db.saveBackupMetadata).mock.calls[0][0];
    expect(savedMeta.label).toBe('Test Daily Startup Backup');
    expect(savedMeta.recordCounts).toBeDefined();

    // Verify download was triggered with SMS_Backup_Comprehensive filename
    expect(appendSpy).toHaveBeenCalled();
    const link = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(link.download).toMatch(/^SMS_Backup_Comprehensive_\d{4}-\d{2}-\d{2}\.json$/);

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('checkAndCreateDailyBackup creates a full comprehensive backup if none exists today', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    vi.mocked(db.getBackups).mockResolvedValueOnce([]);

    await checkAndCreateDailyBackup();

    expect(db.saveBackupMetadata).toHaveBeenCalledTimes(1);
    const savedMeta = vi.mocked(db.saveBackupMetadata).mock.calls[0][0];
    expect(savedMeta.label).toContain('Daily Full Database Export');

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('restoreFromBackupFile imports ComprehensiveBackup correctly', async () => {
    const comprehensiveBackup = {
      metadata: {
        version: '2.0.0-local',
        exportDate: new Date().toISOString(),
        note: 'Comprehensive Test Backup',
      },
      summary: {
        students: 5,
        sections: 2,
        subjects: 4,
        grades: 10,
        enrollments: 5,
        announcements: 1,
        attendanceRecords: 20,
      },
      payload: {
        schoolProfile: { name: 'Test High School' },
        students: [{ id: '1', name: 'John Doe' }],
        sections: [{ id: 's1', name: 'Emerald' }],
      },
      _checksum: 'fakehash123',
    };

    const file = new File([JSON.stringify(comprehensiveBackup)], 'SMS_Backup_Comprehensive_2026-09-11.json', {
      type: 'application/json',
    });

    const result = await restoreFromBackupFile(file);
    expect(result).toContain('Restored from: Comprehensive Test Backup');
    expect(db.importFromBackup).toHaveBeenCalledWith(comprehensiveBackup);
    expect(db.saveBackupMetadata).toHaveBeenCalledTimes(1);
  });

  it('downloadBackupFile triggers download with SMS_Backup_Comprehensive filename', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    await downloadBackupFile({ metadata: { version: '2.0.0-local' }, payload: {} });

    expect(appendSpy).toHaveBeenCalled();
    const link = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(link.download).toMatch(/^SMS_Backup_Comprehensive_\d{4}-\d{2}-\d{2}\.json$/);

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
