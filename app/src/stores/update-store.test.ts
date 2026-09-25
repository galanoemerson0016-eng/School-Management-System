import { describe, expect, it, vi } from 'vitest';
import { embedChecksum } from '../utils/backup-integrity';
import { findVerifiedV3517RecoveryBackup } from './update-store';

describe('v3.5.17 recovery backup discovery', () => {
  async function legacyBackup() {
    const payload = {
      students: [{ lrn: 'SYNTHETIC-1', first_name: 'Before' }],
      sections: [], subjects: [], classRecords: [], gradingSheetRecords: [],
      enrollments: [], attendanceRecords: [],
    };
    const hash = async (data: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
      return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    };
    const metadata = { payloadHash: await hash(JSON.stringify(payload)) };
    const old = { metadata, payload };
    return { ...old, _checksum: await hash(JSON.stringify(old, Object.keys(old).sort())) };
  }

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

  it('accepts a legacy checksum only when its full payload hash still matches', async () => {
    const original = await legacyBackup();
    const filename = 'SMS_Backup_Comprehensive_preupdate_3.5.17_synthetic.json';
    const api = {
      listFsBackups: vi.fn().mockResolvedValue([{ filename }]),
      readFsBackupContent: vi.fn().mockResolvedValue(original),
    };
    await expect(findVerifiedV3517RecoveryBackup(api)).resolves.toMatchObject({ filename });

    const tampered = structuredClone(original);
    tampered.payload.students[0].first_name = 'After';
    api.readFsBackupContent.mockResolvedValue(tampered);
    await expect(findVerifiedV3517RecoveryBackup(api)).resolves.toBeNull();
  });

  it('continues to an older candidate after a corrupt candidate cannot be read', async () => {
    const backup = await embedChecksum({ payload: {
      students: [], sections: [], subjects: [], classRecords: [], gradingSheetRecords: [],
      enrollments: [], attendanceRecords: [],
    } });
    const filenames = [
      'SMS_Backup_Comprehensive_preupdate_3.5.17_newer.json',
      'SMS_Backup_Comprehensive_preupdate_3.5.17_older.json',
    ];
    const api = {
      listFsBackups: vi.fn().mockResolvedValue(filenames.map(filename => ({ filename }))),
      readFsBackupContent: vi.fn().mockRejectedValueOnce(new Error('Unreadable')).mockResolvedValue(backup),
    };
    await expect(findVerifiedV3517RecoveryBackup(api)).resolves.toMatchObject({ filename: filenames[1] });
  });
});
