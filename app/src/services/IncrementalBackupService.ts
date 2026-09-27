import { db } from './database';
import { AutoBackupManager } from './AutoBackupManager';

let isDirty = false;
let timerId: ReturnType<typeof setInterval> | null = null;
let unsubscribe: (() => void) | null = null;
const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export const IncrementalBackupService = {
  init(): void {
    if (timerId) return;

    console.log('⏰ Initializing Background Incremental Backup Scheduler...');
    
    // Listen to all database modifications
    unsubscribe = db.onDatabaseChange((storeName) => {
      // Avoid tracking logs or automated backups themselves
      if (storeName !== 'activityLog' && storeName !== 'automated_backups' && storeName !== 'backups') {
        isDirty = true;
      }
    });

    // Start background interval
    timerId = setInterval(async () => {
      if (isDirty) {
        await this.triggerIncrementalBackup();
      }
    }, INTERVAL_MS);
  },

  stop(): void {
    if (timerId) clearInterval(timerId);
    timerId = null;
    unsubscribe?.();
    unsubscribe = null;
  },

  async triggerIncrementalBackup(): Promise<void> {
    if (db.isPreviewMode()) {
      return;
    }
    try {
      console.log('📦 Background scheduler: changes detected. Creating a paired recovery snapshot...');
      const generation = db.getWriteGeneration();
      await AutoBackupManager.triggerBackup();
      // A save during an in-flight snapshot still needs the next backup.
      isDirty = db.getWriteGeneration() !== generation;
    } catch (error) {
      console.error('❌ Background incremental backup failed:', error);
    }
  },

  async cleanupOldIncrementals(): Promise<void> {
    if (!window.electronAPI?.listFsBackups || !window.electronAPI?.deleteFsBackup) return;

    try {
      const backups = await window.electronAPI.listFsBackups();
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      for (const entry of backups) {
        if (entry.filename.startsWith('incremental_backup_') || entry.filename.startsWith('SMS_Backup_Comprehensive_incremental_')) {
          const fileAge = now - entry.mtime;
          if (fileAge > ONE_DAY_MS) {
            console.log(`🧹 Cleaning up old incremental backup file: ${entry.filename}`);
            await window.electronAPI.deleteFsBackup(entry.filename);
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Failed to clean up old incremental backups:', err);
    }
  }
};
