import { describe, expect, it, vi } from 'vitest';
import { embedChecksum } from '../utils/backup-integrity';
import { findVerifiedV3517RecoveryBackup } from './update-store';

describe('v3.5.17 recovery backup discovery', () => {
  it('offers only a checksum-verified v3.5.17 pre-update backup with its actual record counts', async () => {
    const backup = await embedChecksum({
      payload: {
        students: [{ lrn: '999900000001' }],
        sections: [{ id: 'section-real-einstein' }],
        subjects: [{ id: 'subject-1' }],
        classRecords: [{ id: 'record-1' }],
        gradingSheetRecords: [{ id: 'grading-1' }],
        enrollments: [],
        attendanceRecords: [],
      },
    });
    const filename = 'SMS_Backup_Comprehensive_preupdate_3.5.17_2026-09-22T00-00-00-000Z.json';
    const api = {
      listFsBackups: vi.fn().mockResolvedValue([{ filename }]),
      readFsBackupContent: vi.fn().mockResolvedValue(backup),
    };

    await expect(findVerifiedV3517RecoveryBackup(api)).resolves.toEqual({
      filename,
      counts: {
        students: 1,
        sections: 1,
        subjects: 1,
        classRecords: 1,
        enrollments: 0,
        attendanceRecords: 0,
        gradingSheetRecords: 1,
      },
    });
  });

  it('does not offer a corrupt or differently-versioned backup for recovery', async () => {
    const api = {
      listFsBackups: vi.fn().mockResolvedValue([
        { filename: 'SMS_Backup_Comprehensive_preupdate_3.5.17_bad.json' },
        { filename: 'SMS_Backup_Comprehensive_preupdate_3.5.16_valid.json' },
      ]),
      readFsBackupContent: vi.fn().mockResolvedValue({ _checksum: 'not-valid', payload: { students: [{}] } }),
    };

    await expect(findVerifiedV3517RecoveryBackup(api)).resolves.toBeNull();
  });
});
