/**
 * Backup & Restore Service
 * Handles automatic daily comprehensive backups and manual restore/rollback functionality
 */

import { db, type BackupMetadata } from './database';
import {
  exportFullDatabaseBackup,
  savePreRestoreSafetySnapshot,
  type ComprehensiveBackup
} from '../utils/backup-restore';
import { embedChecksum } from '../utils/backup-integrity';

export interface LegacyBackupFile {
  version: 1;
  timestamp: number;
  label: string;
  data: Record<string, unknown>;
}

export type AnyBackupPayload = ComprehensiveBackup | LegacyBackupFile | Record<string, unknown>;

/**
 * Create a full database comprehensive backup of all current data
 * Saves metadata, downloads the comprehensive JSON file, and returns the backup ID
 */
export async function createBackup(label?: string): Promise<string> {
  try {
    const backupLabel = label || `Full Database Export - ${new Date().toLocaleString()}`;
    const comprehensive = await exportFullDatabaseBackup(backupLabel);
    const backupWithChecksum = (await embedChecksum(comprehensive as unknown as Record<string, unknown>)) as unknown as ComprehensiveBackup;

    const backupId = `backup_${Date.now()}`;
    const timestamp = Date.now();

    // Save backup metadata
    const metadata = {
      id: backupId,
      timestamp,
      label: backupLabel,
      fileSize: JSON.stringify(backupWithChecksum).length,
      recordCounts: {
        students: backupWithChecksum.summary.students,
        sections: backupWithChecksum.summary.sections,
        subjects: backupWithChecksum.summary.subjects,
        classRecords: backupWithChecksum.summary.grades,
        enrollments: backupWithChecksum.summary.enrollments,
        announcements: backupWithChecksum.summary.announcements,
        attendanceRecords: backupWithChecksum.summary.attendanceRecords ?? 0,
        gradingSheetRecords: backupWithChecksum.summary.gradingSheetRecords ?? 0,
        observedValues: backupWithChecksum.summary.observedValues ?? 0,
      },
    };

    await db.saveBackupMetadata(metadata as BackupMetadata);

    // Trigger user browser download of the comprehensive backup file
    await downloadBackupFile(backupWithChecksum, backupLabel);

    // If running in Electron, also save silent filesystem snapshot
    if (typeof window !== 'undefined' && window.electronAPI?.saveAutoBackup) {
      try {
        const timestampStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-');
        await window.electronAPI.saveAutoBackup(backupWithChecksum, `SMS_Backup_Comprehensive_${timestampStr}.json`);
      } catch (err) {
        console.warn('Silent fs auto-backup failed:', err);
      }
    }

    return backupId;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

/**
 * Download Comprehensive Backup as JSON file to user's Downloads folder
 */
export async function downloadBackupFile(
  data: ComprehensiveBackup | unknown,
  label?: string
): Promise<void> {
  try {
    let backupToSave: unknown = data;

    // Check if input is already a ComprehensiveBackup structure
    const isComprehensive =
      data &&
      typeof data === 'object' &&
      'metadata' in (data as Record<string, unknown>) &&
      'payload' in (data as Record<string, unknown>);

    if (!isComprehensive) {
      const comprehensive = await exportFullDatabaseBackup(label || 'Full Database Export');
      backupToSave = await embedChecksum(comprehensive as unknown as Record<string, unknown>);
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `SMS_Backup_Comprehensive_${timestamp}.json`;

    const json = JSON.stringify(backupToSave, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading backup:', error);
    throw error;
  }
}

/**
 * Restore data from a backup file (supports ComprehensiveBackup, legacy version 1, and raw dumps)
 */
export async function restoreFromBackupFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string) as Record<string, unknown>;

        // Restore data using db.importFromBackup (which supports comprehensive payload, legacy data, and raw objects)
        await savePreRestoreSafetySnapshot();
        await db.importFromBackup(raw);

        const metadataObj = raw.metadata as { note?: string } | undefined;
        const summaryObj = raw.summary as Record<string, number> | undefined;
        const dataObj = raw.data as Record<string, unknown[]> | undefined;
        const rootArrays = raw as Record<string, unknown[]>;

        // Derive label and record counts for metadata
        const label = metadataObj?.note || (raw.label as string | undefined) || file.name.replace(/\.json$/i, '');
        const recordCounts = {
          students: summaryObj?.students ?? dataObj?.students?.length ?? rootArrays.students?.length ?? 0,
          sections: summaryObj?.sections ?? dataObj?.sections?.length ?? rootArrays.sections?.length ?? 0,
          subjects: summaryObj?.subjects ?? dataObj?.subjects?.length ?? rootArrays.subjects?.length ?? 0,
          classRecords: summaryObj?.grades ?? dataObj?.classRecords?.length ?? rootArrays.classRecords?.length ?? 0,
          enrollments: summaryObj?.enrollments ?? dataObj?.enrollments?.length ?? rootArrays.enrollments?.length ?? 0,
          announcements: summaryObj?.announcements ?? dataObj?.announcements?.length ?? rootArrays.announcements?.length ?? 0,
          attendanceRecords: summaryObj?.attendanceRecords ?? dataObj?.attendanceRecords?.length ?? rootArrays.attendanceRecords?.length ?? 0,
          gradingSheetRecords: summaryObj?.gradingSheetRecords ?? dataObj?.gradingSheetRecords?.length ?? rootArrays.gradingSheetRecords?.length ?? 0,
          observedValues: summaryObj?.observedValues ?? dataObj?.observedValues?.length ?? rootArrays.observedValues?.length ?? 0,
        };

        const metadata = {
          id: `backup_${Date.now()}`,
          timestamp: Date.now(),
          label: `Restored: ${label}`,
          fileSize: file.size,
          recordCounts,
        };

        await db.saveBackupMetadata(metadata as BackupMetadata);
        resolve(`Restored from: ${label}`);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Restore data from a previous backup (by ID)
 */
export async function restoreFromBackup(backupId: string): Promise<void> {
  try {
    console.log(`Restoring from backup: ${backupId}`);
    throw new Error('Manual restore: Please upload the backup JSON file');
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
}

/**
 * Auto-backup trigger (called on app startup and daily)
 * Checks if a backup has been executed today; if not, generates the full comprehensive backup
 */
export async function checkAndCreateDailyBackup(): Promise<void> {
  try {
    const backups = await db.getBackups();
    const today = new Date().toDateString();

    // Check if backup exists for today
    const todayBackup = backups.find((b) => new Date(b.timestamp).toDateString() === today);

    if (!todayBackup) {
      // Create full database comprehensive backup and trigger download
      await createBackup(`Daily Full Database Export - ${today}`);
      console.log('✅ Daily comprehensive backup created');
    }
  } catch (error) {
    console.error('Error checking daily backup:', error);
  }
}

/**
 * Get all available backups
 */
export async function listBackups() {
  return db.getBackups();
}

/**
 * Delete a backup
 */
export async function deleteBackupById(backupId: string): Promise<void> {
  await db.deleteBackup(backupId);
}

/**
 * Get backup details
 */
export async function getBackupInfo(backupId: string) {
  const backups = await db.getBackups();
  return backups.find((b) => b.id === backupId);
}

export const backup = {
  createBackup,
  downloadBackupFile,
  restoreFromBackupFile,
  restoreFromBackup,
  checkAndCreateDailyBackup,
  listBackups,
  deleteBackupById,
  getBackupInfo,
};
