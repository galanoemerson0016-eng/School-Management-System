import { db } from './database';

let isDirty = false;
let timerId: ReturnType<typeof setInterval> | null = null;
const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export const IncrementalBackupService = {
  init(): void {
    if (timerId) return;

    console.log('⏰ Initializing Background Incremental Backup Scheduler...');
    
    // Listen to all database modifications
    db.onDatabaseChange((storeName) => {
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

  async triggerIncrementalBackup(): Promise<void> {
    try {
      console.log('📦 Background scheduler: modifications detected. Generating incremental backup...');
      const backupData = await db.exportAllData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `incremental_backup_${timestamp}.json`;

      if (window.electronAPI?.saveAutoBackup) {
        // Incremental backups are written using standard auto-backup filesystem logic
        const result = await window.electronAPI.saveAutoBackup(backupData, filename);
        if (result.success) {
          isDirty = false;
          console.log(`✅ Background incremental snapshot saved: ${filename}`);
          
          // Auto-cleanup: remove files older than 24 hours
          await this.cleanupOldIncrementals();
        } else {
          console.warn('⚠️ Background incremental backup failed to write to disk:', result.error);
        }
      } else {
        // Fallback for browser environment
        localStorage.setItem(`formease_incremental_${timestamp}`, JSON.stringify(backupData));
        isDirty = false;
        console.log(`✅ Sandbox incremental backup saved to localStorage: ${filename}`);
      }
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
        if (entry.filename.startsWith('incremental_backup_')) {
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
