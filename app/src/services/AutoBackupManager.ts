import { db } from './database';
import { exportFullDatabaseBackup, type ComprehensiveBackup } from '../utils/backup-restore';
import { embedChecksum } from '../utils/backup-integrity';

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
    sf2Sheets?: number;
    hpsRecords?: number;
    users?: number;
    activityLog?: number;
  };
  data: ComprehensiveBackup | Awaited<ReturnType<typeof db.exportAllData>>;
}

export const AutoBackupManager = {
  _hourlyIntervalId: null as ReturnType<typeof setInterval> | null,

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

      // Start the active background hourly sync scheduler
      this.startHourlyScheduler();
    } catch (error) {
      console.error('Failed to initialize AutoBackupManager:', error);
    }
  },

  /**
   * Starts background hourly cloud sync scheduler and network reconnect listener.
   */
  startHourlyScheduler(): void {
    if (this._hourlyIntervalId) return;

    const runHourlyCheck = async () => {
      try {
        const { CloudSyncService } = await import('./cloud-sync');
        const state = await CloudSyncService.getStateAsync();
        if (!state.linked || !navigator.onLine) return;

        const lastSync = state.lastSync || 0;
        const oneHourMs = 60 * 60 * 1000;
        if (Date.now() - lastSync >= oneHourMs) {
          console.log('🔄 Running hourly automated Google Drive cloud sync...');
          await CloudSyncService.syncNow();
          console.log('✅ Hourly Google Drive cloud sync finished.');
        }
      } catch (err) {
        console.warn('Hourly cloud sync check notice:', err);
      }
    };

    // Initial check after 10 seconds of app load
    setTimeout(runHourlyCheck, 10000);

    // Periodic check every 5 minutes
    this._hourlyIntervalId = setInterval(runHourlyCheck, 5 * 60 * 1000);

    // Listen for network reconnect
    window.addEventListener('online', () => {
      console.log('🌐 Internet connection restored: checking if cloud sync is due...');
      runHourlyCheck();
    });
  },

  /**
   * Executes database export and Google Drive sync before app closing.
   */
  async syncBeforeExit(): Promise<void> {
    try {
      console.log('🔄 Application closing: saving snapshot and syncing to Google Drive...');
      // 1. Save local snapshot
      await this.triggerBackup().catch(e => console.warn('Pre-exit snapshot notice:', e));

      // 2. Cloud sync if linked
      const { CloudSyncService } = await import('./cloud-sync');
      const state = await CloudSyncService.getStateAsync();
      if (state.linked && navigator.onLine) {
        // Race with 4-second safety timeout so close never hangs
        await Promise.race([
          CloudSyncService.syncNow(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud sync timeout before exit')), 4000))
        ]);
        console.log('✅ Pre-exit cloud sync complete');
      }
    } catch (err) {
      console.warn('Pre-exit sync notice:', err);
    }
  },

  /**
   * Manually triggers a new automated backup snapshot.
   */
  async triggerBackup(): Promise<string> {
    try {
      const comprehensive = await exportFullDatabaseBackup('Automated Daily Backup Snapshot');
      const data = (await embedChecksum(comprehensive as unknown as Record<string, unknown>)) as unknown as ComprehensiveBackup;
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
          students: data.summary.students,
          sections: data.summary.sections,
          subjects: data.summary.subjects,
          classRecords: data.summary.grades,
          enrollments: data.summary.enrollments,
          announcements: data.summary.announcements,
          attendanceRecords: data.summary.attendanceRecords ?? 0,
          gradingSheetRecords: data.summary.gradingSheetRecords ?? 0,
          observedValues: data.summary.observedValues ?? 0,
          sf2Sheets: data.summary.sf2Sheets ?? 0,
          hpsRecords: data.summary.hpsRecords ?? 0,
          users: data.summary.users ?? 0,
          activityLog: data.summary.activityLog ?? 0,
        },
        data,
      };

      // Save to IndexedDB store
      await db.putRecord('automated_backups', backupEntry);
      
      // Also save to local filesystem backups if running in Electron
      if (window.electronAPI?.saveAutoBackup) {
        try {
          const timestampStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-');
          const fsFilename = `SMS_Backup_Comprehensive_${timestampStr}.json`;
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
      await db.importFromBackup(targetBackup.data as any);
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
