/**
 * Backup & Restore Service
 * Handles automatic daily backups and manual restore/rollback functionality
 */

import { db } from './database';
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
} from '../types';

interface BackupFile {
  version: 1;
  timestamp: number;
  label: string;
  data: {
    schoolProfile: SchoolProfile[];
    students: Student[];
    sections: Section[];
    subjects: Subject[];
    classRecords: ClassRecord[];
    enrollments: Enrollment[];
    announcements: Announcement[];
    attendanceRecords: AttendanceRecord[];
    sf2Sheets: any[];
    hpsRecords: any[];
    gradingSheetRecords?: ClassRecord[];
    observedValues?: ObservedValues[];
  };
}

/**
 * Create a backup of all current data
 * Returns the backup ID
 */
export async function createBackup(label?: string): Promise<string> {
  try {
    const data = await db.exportAllData();
    const backupId = `backup_${Date.now()}`;
    const timestamp = Date.now();
    const backupLabel = label || `Auto-backup ${new Date().toLocaleString()}`;

    // Save backup metadata
    const metadata = {
      id: backupId,
      timestamp,
      label: backupLabel,
      fileSize: JSON.stringify(data).length,
      recordCounts: {
        students: data.students.length,
        sections: data.sections.length,
        subjects: data.subjects.length,
        classRecords: data.classRecords.length,
        enrollments: data.enrollments.length,
        announcements: data.announcements.length,
        attendanceRecords: data.attendanceRecords.length,
        gradingSheetRecords: data.gradingSheetRecords?.length || 0,
        observedValues: data.observedValues?.length || 0,
      },
    };

    await db.saveBackupMetadata(metadata as any);
    await downloadBackupFile(data, backupLabel);

    return backupId;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

/**
 * Download backup as JSON file to user's Downloads folder
 */
export async function downloadBackupFile(
  data: Awaited<ReturnType<typeof db.exportAllData>>,
  label: string
): Promise<void> {
  try {
    const backup: BackupFile = {
      version: 1,
      timestamp: Date.now(),
      label,
      data,
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `FormEase_Backup_${new Date().toISOString().split('T')[0]}.json`;
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
 * Restore data from a backup file (user uploads)
 */
export async function restoreFromBackupFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string) as BackupFile;

        if (backup.version !== 1) {
          throw new Error('Invalid backup file version');
        }

        // Restore data
        await db.importFromBackup(backup.data);

        // Save restore metadata
        const metadata = {
          id: `backup_${Date.now()}`,
          timestamp: Date.now(),
          label: `Restored: ${backup.label}`,
          fileSize: file.size,
          recordCounts: {
            students: backup.data.students.length,
            sections: backup.data.sections.length,
            subjects: backup.data.subjects.length,
            classRecords: backup.data.classRecords.length,
            enrollments: backup.data.enrollments.length,
            announcements: backup.data.announcements.length,
            attendanceRecords: backup.data.attendanceRecords.length,
            gradingSheetRecords: backup.data.gradingSheetRecords?.length || 0,
            observedValues: backup.data.observedValues?.length || 0,
          },
        };

        await db.saveBackupMetadata(metadata as any);
        resolve(`Restored from: ${backup.label}`);
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
    // Get backup metadata to find the original data
    // Note: This assumes backup data is stored as JSON file, not in IndexedDB
    // For now, user would need to upload the backup file manually
    console.log(`Restoring from backup: ${backupId}`);
    throw new Error('Manual restore: Please upload the backup JSON file');
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
}

/**
 * Auto-backup trigger (call on app exit or daily)
 */
export async function checkAndCreateDailyBackup(): Promise<void> {
  try {
    const backups = await db.getBackups();
    const today = new Date().toDateString();

    // Check if backup exists for today
    const todayBackup = backups.find((b) => new Date(b.timestamp).toDateString() === today);

    if (!todayBackup) {
      // Create backup
      await createBackup(`Daily backup - ${today}`);
      console.log('✅ Daily backup created');
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
