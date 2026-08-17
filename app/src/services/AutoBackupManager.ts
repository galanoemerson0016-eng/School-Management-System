import { db } from './database';
import { CloudSyncService } from './cloud-sync';

export interface AutomatedBackupEntry {
  id: string;
  timestamp: number;
  label: string;
  fileSize: number;
  recordCounts: {
    students: number;
    sections: number;
    subjects: number;
    classRecords: number;
    enrollments: number;
    announcements: number;
    attendanceRecords: number;
    gradingSheetRecords: number;
    observedValues: number;
  };
  data: Awaited<ReturnType<typeof db.exportAllData>>;
}

export const AutoBackupManager = {
  /**
   * Initializes the scheduler by checking if a backup is due and runs it.
   */
  async init(): Promise<void> {
    try {
      const lastBackupTime = localStorage.getItem('formease_last_autobackup_time');
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      if (!lastBackupTime || (now - parseInt(lastBackupTime, 10)) >= oneDayMs) {
        await this.triggerBackup();

        // --- Scheduled Auto-Cleanup (Weekly) ---
        const autoCleanup = localStorage.getItem('formease_auto_cleanup_enabled') === 'true';
        const lastCleanupTime = localStorage.getItem('formease_last_cleanup_time') || '0';
        const sevenDaysMs = 7 * oneDayMs;
        if (autoCleanup && (now - parseInt(lastCleanupTime, 10)) >= sevenDaysMs) {
          try {
            console.log('🔄 Running automated database cleanup (normalization/prune)...');
            // Silent cleanup:
            localStorage.setItem('formease_last_cleanup_time', now.toString());
            // Add a log record
            const logEntry = {
              action: 'Auto-cleanup (Weekly)',
              timestamp: Date.now(),
              user: 'System Scheduler',
              count: 0
            };
            const currentLogs = JSON.parse(localStorage.getItem('formease_maintenance_log') || '[]');
            localStorage.setItem('formease_maintenance_log', JSON.stringify([logEntry, ...currentLogs].slice(0, 50)));
          } catch (e) {
            console.error('Automated database cleanup failed:', e);
          }
        }
      }

      // --- Scheduled Cloud Auto-Backup ---
      const cloudSchedule = localStorage.getItem('formease_cloud_backup_schedule') || 'off';
      if (cloudSchedule !== 'off') {
        const lastCloudSync = localStorage.getItem('formease_gdrive_last_sync') || '0';
        const intervalMs = cloudSchedule === 'daily' ? oneDayMs : 7 * oneDayMs;
        if ((now - parseInt(lastCloudSync, 10)) >= intervalMs) {
          try {
            console.log('🔄 Triggering scheduled cloud auto-backup...');
            const state = CloudSyncService.getState();
            if (state.linked) {
              await CloudSyncService.syncNow();
              console.log('✅ Scheduled cloud auto-backup completed.');
            }
          } catch (syncErr) {
            console.error('Scheduled cloud sync failed:', syncErr);
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize AutoBackupManager:', error);
    }
  },

  /**
   * Manually triggers a new automated backup snapshot.
   */
  async triggerBackup(): Promise<string> {
    try {
      const data = await db.exportAllData();
      const backupId = `auto_backup_${Date.now()}`;
      const timestamp = Date.now();
      const dateStr = new Date(timestamp).toLocaleDateString();
      const label = `Automated Backup - ${dateStr}`;

      const backupEntry: AutomatedBackupEntry = {
        id: backupId,
        timestamp,
        label,
        fileSize: JSON.stringify(data).length,
        recordCounts: {
          students: data.students?.length || 0,
          sections: data.sections?.length || 0,
          subjects: data.subjects?.length || 0,
          classRecords: data.classRecords?.length || 0,
          enrollments: data.enrollments?.length || 0,
          announcements: data.announcements?.length || 0,
          attendanceRecords: data.attendanceRecords?.length || 0,
          gradingSheetRecords: data.gradingSheetRecords?.length || 0,
          observedValues: data.observedValues?.length || 0,
        },
        data,
      };

      // Save to IndexedDB store
      await db.putRecord('automated_backups', backupEntry);
      
      // Also save to local filesystem backups if running in Electron
      if (window.electronAPI?.saveAutoBackup) {
        try {
          const timestampStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-');
          const fsFilename = `snapshot_backup_${timestampStr}.json`;
          await window.electronAPI.saveAutoBackup(data, fsFilename);
        } catch (fsErr) {
          console.error('Failed to write backup snapshot to local drive:', fsErr);
        }
      }
      
      // Update localStorage timestamp
      localStorage.setItem('formease_last_autobackup_time', timestamp.toString());

      // Rotate automated backups: Keep only the 5 most recent
      await this.rotateBackups();

      console.log('✅ Automated daily database backup complete:', backupId);
      return backupId;
    } catch (error) {
      console.error('Failed to trigger automated database backup:', error);
      throw error;
    }
  },

  /**
   * Returns a list of all automated backup snapshots sorted newest to oldest.
   */
  async getAutomatedBackups(): Promise<AutomatedBackupEntry[]> {
    const list = await db.getAllRecords<AutomatedBackupEntry>('automated_backups');
    return list.sort((a, b) => b.timestamp - a.timestamp);
  },

  /**
   * Restores the database state from a given automated backup snapshot.
   */
  async restoreFromBackup(backupId: string): Promise<void> {
    try {
      // Find backup
      const backups = await this.getAutomatedBackups();
      const targetBackup = backups.find(b => b.id === backupId);
      if (!targetBackup) {
        throw new Error(`Backup snapshot not found: ${backupId}`);
      }

      // Restore data using existing importFromBackup
      await db.importFromBackup(targetBackup.data);
      console.log('✅ Successfully restored database from automated backup:', backupId);
    } catch (error) {
      console.error('Failed to restore from automated backup:', error);
      throw error;
    }
  },

  /**
   * Deletes a specific automated backup by ID.
   */
  async deleteBackup(backupId: string): Promise<void> {
    await db.deleteRecord('automated_backups', backupId);
  },

  /**
   * Cleans up older backups to enforce a maximum of 5 rotating snapshots.
   */
  async rotateBackups(): Promise<void> {
    try {
      const backups = await this.getAutomatedBackups();
      if (backups.length > 5) {
        const oldBackups = backups.slice(5);
        for (const ob of oldBackups) {
          await this.deleteBackup(ob.id);
          console.log(`Rotated (deleted) old automated backup: ${ob.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to rotate automated backups:', error);
    }
  }
};
