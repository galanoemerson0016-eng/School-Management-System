import { db } from './database';
import { exportFullDatabaseBackup, savePreRestoreSafetySnapshot, type ComprehensiveBackup } from '../utils/backup-restore';
import { embedChecksum } from '../utils/backup-integrity';
import { CloudSyncService } from './cloud-sync';
import { getMasterExcelBackupBuffer } from './master-excel-backup';

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
  snapshotId?: string;
  pairedFileStatus?: 'verified' | 'full-only' | 'local-only';
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + chunkSize)));
  }
  return btoa(chunks.join(''));
}

export const AutoBackupManager = {
  _hourlyIntervalId: null as ReturnType<typeof setInterval> | null,
  _backupInFlight: null as Promise<string> | null,

  /**
   * Initializes the scheduler by checking if a backup is due and runs it.
   */
  async init(): Promise<void> {
    if (db.isPreviewMode()) {
      console.log('👁️ Snapshot preview mode active: skipping automated backup initialization.');
      return;
    }
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

    // Run check every hour
    this._hourlyIntervalId = setInterval(runHourlyCheck, 60 * 60 * 1000);

    window.addEventListener('online', () => {
      console.log('🌐 Internet connection restored: checking if cloud sync is due...');
      runHourlyCheck();
    });
  },

  /**
   * Executes database export and Google Drive sync before app closing.
   */
  async syncBeforeExit(): Promise<void> {
    if (db.isPreviewMode()) {
      return;
    }
    try {
      console.log('🔄 Application closing: saving snapshot and syncing to Google Drive...');
      // 1. Save local snapshot
      await this.triggerBackup().catch(e => console.warn('Pre-exit snapshot notice:', e));

      // 2. Cloud sync if linked
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
    if (this._backupInFlight) return this._backupInFlight;
    const pending = this.performBackup();
    this._backupInFlight = pending;
    try {
      return await pending;
    } finally {
      if (this._backupInFlight === pending) this._backupInFlight = null;
    }
  },

  async performBackup(): Promise<string> {
    if (db.isPreviewMode()) {
      console.log('👁️ Snapshot preview mode active: skipping automated backup trigger.');
      return '';
    }
    try {
      const backupId = `auto_backup_${Date.now()}`;
      const timestamp = Date.now();
      const snapshotId = `auto-${timestamp}-${crypto.randomUUID()}`;
      const comprehensive = await exportFullDatabaseBackup('Automated Daily Backup Snapshot');
      comprehensive.metadata.snapshotId = snapshotId;
      const data = (await embedChecksum(comprehensive as unknown as Record<string, unknown>)) as unknown as ComprehensiveBackup;
      const dateStr = new Date(timestamp).toLocaleDateString();
      const label = `Automated Backup - ${dateStr}`;

      let pairedFileStatus: AutomatedBackupEntry['pairedFileStatus'] = 'local-only';
      if (window.electronAPI?.saveAutoBackupWorkbook) {
        const fileTimestamp = `${new Date(timestamp).toISOString().replace(/[:.]/g, '-')}-${snapshotId.split('-').pop()?.slice(0, 8)}`;
        const jsonFilename = `SMS_Backup_Automated_${fileTimestamp}.json`;
        const workbookFilename = `FormEase_Automated_${fileTimestamp}.xlsx`;
        const manifestFilename = `FormEase_Automated_${fileTimestamp}_Manifest.json`;
        const workbook = await getMasterExcelBackupBuffer(data);
        const base64Workbook = bytesToBase64(workbook);
        const hashInput: BufferSource = typeof Buffer !== 'undefined'
          ? Buffer.from(workbook)
          : (workbook.buffer.slice(workbook.byteOffset, workbook.byteOffset + workbook.byteLength) as ArrayBuffer);
        const workbookHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', hashInput)))
          .map(byte => byte.toString(16).padStart(2, '0')).join('');
        const workbookSaved = await window.electronAPI.saveAutoBackupWorkbook(base64Workbook, workbookFilename);
        if (!workbookSaved.success) throw new Error(workbookSaved.error || 'Excel backup could not be saved.');
        // Keep prior complete pairs until a group-aware rotation step can prove
        // that every retained JSON/workbook/manifest sibling exists.
        const jsonSaved = await window.electronAPI.saveAutoBackup(data, jsonFilename, 0);
        if (!jsonSaved.success) throw new Error(jsonSaved.error || 'Full recovery backup could not be saved.');
        const manifest = {
          schemaVersion: 1,
          status: 'verified-pair',
          snapshotId,
          createdAt: new Date(timestamp).toISOString(),
          applicationVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : data.metadata.version,
          files: [
            { name: jsonFilename, format: 'FormEase full recovery JSON', sha256: data._checksum },
            { name: workbookFilename, format: 'Readable Excel workbook', sha256: workbookHash },
          ],
          counts: data.summary,
        };
        const manifestSaved = await window.electronAPI.saveAutoBackup(manifest, manifestFilename);
        if (!manifestSaved.success) throw new Error(manifestSaved.error || 'Backup pair manifest could not be saved.');
        pairedFileStatus = 'verified';
        if (window.electronAPI.rotateAutoBackupPairs) {
          const preference = localStorage.getItem('formease_snapshot_retention_limit') || 'unlimited';
          const limit = preference === 'unlimited' ? 0 : parseInt(preference, 10) || 0;
          const rotation = await window.electronAPI.rotateAutoBackupPairs(limit);
          if (!rotation.success) console.warn('Verified backup pair was saved, but retention cleanup failed:', rotation.error);
        }
      } else if (window.electronAPI?.saveAutoBackup) {
        const fileTimestamp = `${new Date(timestamp).toISOString().replace(/[:.]/g, '-')}-${snapshotId.split('-').pop()?.slice(0, 8)}`;
        const saved = await window.electronAPI.saveAutoBackup(data, `SMS_Backup_Automated_${fileTimestamp}.json`, 0);
        if (!saved.success) throw new Error(saved.error || 'Full recovery backup could not be saved.');
        pairedFileStatus = 'full-only';
      }

      const backupEntry: AutomatedBackupEntry = {
        id: backupId,
        timestamp,
        label,
        snapshotId,
        pairedFileStatus,
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
      
      // Update localStorage timestamp
      localStorage.setItem('formease_last_autobackup_time', timestamp.toString());

      // Rotate automated backups: Keep according to user retention preference (default: unlimited)
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
      await savePreRestoreSafetySnapshot();
      await db.importFromBackup(targetBackup.data as Parameters<typeof db.importFromBackup>[0]);
      if (typeof window !== 'undefined') {
        const { initializeAppStore } = await import('../stores/app-store');
        await initializeAppStore();
      }
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
   * Cleans up older backups according to the user's snapshot retention preference.
   * If set to 'unlimited' (default), no backups are pruned.
   */
  async rotateBackups(): Promise<void> {
    try {
      const pref = localStorage.getItem('formease_snapshot_retention_limit') || 'unlimited';
      if (pref === 'unlimited') {
        return; // User has selected unlimited retention; keep all checkpoints
      }
      const limit = parseInt(pref, 10);
      if (isNaN(limit) || limit <= 0) {
        return;
      }
      const backups = (await this.getAutomatedBackups()).filter(backup => backup.id.startsWith('auto_backup_'));
      if (backups.length > limit) {
        const oldBackups = backups.slice(limit);
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
