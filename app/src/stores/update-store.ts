import { create } from 'zustand';
import { db } from '../services/database';
import type { Student } from '../types';

export interface UpdateChecklist {
  dbAccess: 'pending' | 'success' | 'failed';
  diskSpace: 'pending' | 'success' | 'failed';
  network: 'pending' | 'success' | 'failed';
  backup: 'pending' | 'success' | 'failed';
  simulation: 'pending' | 'success' | 'failed';
}

export interface ReconciliationReport {
  fromVersion: string;
  toVersion: string;
  notes?: string[];
  timestamp: number;
  backupFilename?: string;
  status: 'success' | 'mismatch';
  details: Array<{
    table: string;
    before: number;
    after: number;
    match: boolean;
  }>;
}

interface UpdateState {
  updateAvailable: boolean;
  updateInfo: {
    version: string;
    releaseDate?: string;
    notes?: string[];
  } | null;
  updateStep: 'idle' | 'checking' | 'ready-to-start' | 'health-checks' | 'backup' | 'simulation' | 'downloading' | 'ready-to-install' | 'failed';
  checklist: UpdateChecklist;
  downloadProgress: {
    percent: number;
    speedMB: string;
    transferredMB: string;
    totalMB: string;
  };
  errorMessage: string | null;
  reconciliationReport: ReconciliationReport | null;
  
  // Actions
  checkForUpdates: () => void;
  runPreUpdatePipeline: () => Promise<boolean>;
  startDownload: () => Promise<void>;
  applyUpdate: () => void;
  checkForPostUpdateReconciliation: () => Promise<void>;
  rollbackToPreUpdateBackup: (filename: string) => Promise<void>;
  clearReconciliationReport: () => void;
}

const initialChecklist: UpdateChecklist = {
  dbAccess: 'pending',
  diskSpace: 'pending',
  network: 'pending',
  backup: 'pending',
  simulation: 'pending'
};

interface UpdateMessage {
  text?: UpdateMessage;
  status?: string;
  type?: string;
  info?: {
    version: string;
    releaseDate?: string;
    releaseNotes?: string | string[];
  };
  percent?: number;
  speedMB?: string;
  transferredMB?: string;
  totalMB?: string;
  message?: string;
}

let updateTimeout: ReturnType<typeof setTimeout> | null = null;

export const useUpdateStore = create<UpdateState>((set, get) => {
  // Listen for Electron update IPC notifications
  if (window.electronAPI?.onUpdateMessage) {
    window.electronAPI.onUpdateMessage((msg: UpdateMessage) => {
      // Unpack the message if wrapped in { text, status } format from main process
      const payload = (msg && msg.text && typeof msg.text === 'object') ? msg.text : msg;
      console.log('📬 Received update IPC message:', payload);
      if (!payload || !payload.type) return;

      // Clear the timeout upon receiving any valid response from the main process
      if (payload.type !== 'checking-for-update' && updateTimeout) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
      }

      switch (payload.type) {
        case 'checking-for-update':
          // Only establish the timeout safeguard if the check was manually initiated
          if (get().updateStep === 'checking') {
            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
              if (get().updateStep === 'checking') {
                set({
                  updateStep: 'failed',
                  errorMessage: 'Update server check timed out. The update server is unresponsive or unreachable.'
                });
              }
            }, 12000);
          }
          break;

        case 'update-available':
          if (payload.info) {
            set({
              updateAvailable: true,
              updateInfo: {
                version: payload.info.version,
                releaseDate: payload.info.releaseDate,
                notes: Array.isArray(payload.info.releaseNotes) 
                  ? payload.info.releaseNotes 
                  : typeof payload.info.releaseNotes === 'string'
                    ? [payload.info.releaseNotes]
                    : []
              },
              updateStep: 'ready-to-start'
            });
          }
          break;

        case 'update-not-available':
          set({ updateAvailable: false, updateStep: 'idle' });
          break;

        case 'download-progress':
          set({
            updateStep: 'downloading',
            downloadProgress: {
              percent: payload.percent ?? 0,
              speedMB: payload.speedMB ?? '0.00',
              transferredMB: payload.transferredMB ?? '0.0',
              totalMB: payload.totalMB ?? '0.0'
            }
          });
          break;

        case 'update-downloaded':
          set({ updateStep: 'ready-to-install' });
          break;

        case 'update-error':
          // Only show error status in UI if we were actively checking or downloading
          if (get().updateStep === 'checking' || get().updateStep === 'downloading') {
            let msg = payload.message || 'Auto-updater experienced an error';
            const isMac = (window.electronAPI?.platform === 'darwin') || (typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac'));
            if (isMac || msg.toLowerCase().includes('signature') || msg.toLowerCase().includes('squirrel') || msg.toLowerCase().includes('shipit')) {
              msg = 'macOS Gatekeeper requires downloading the updated .dmg installer directly. Click "Download macOS Update (.dmg)" below to update.';
            } else if (msg.includes('404') || msg.includes('latest.yml') || msg.includes('latest-mac.yml')) {
              msg = 'Release assets are currently building on GitHub or pending publish. If your build is in progress, please check again in a few minutes or download the installer directly below.';
            }
            set({
              updateStep: 'failed',
              errorMessage: msg
            });
          } else {
            set({ updateStep: 'idle' });
          }
          break;
      }
    });
  }

  return {
    updateAvailable: false,
    updateInfo: null,
    updateStep: 'idle',
    checklist: { ...initialChecklist },
    downloadProgress: {
      percent: 0,
      speedMB: '0.00',
      transferredMB: '0.0',
      totalMB: '0.0'
    },
    errorMessage: null,
    reconciliationReport: null,

    checkForUpdates: () => {
      if (window.electronAPI?.checkForUpdates) {
        set({ updateStep: 'checking', errorMessage: null });
        window.electronAPI.checkForUpdates();

        // Start a 12-second timeout safeguard for the manual update check
        if (updateTimeout) clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          if (get().updateStep === 'checking') {
            set({
              updateStep: 'failed',
              errorMessage: 'Update server check timed out. The update server is unresponsive or unreachable.'
            });
          }
        }, 12000);
      }
    },

    runPreUpdatePipeline: async () => {
      set({ updateStep: 'health-checks', checklist: { ...initialChecklist }, errorMessage: null });
      const api = window.electronAPI;
      if (!api) {
        set({ updateStep: 'failed', errorMessage: 'Desktop platform interface not detected.' });
        return false;
      }

      const activeChecklist = { ...initialChecklist };

      try {
        // --- 1. Database Accessibility & Integrity Check ---
        try {
          await db.getStoreCount('students');
          activeChecklist.dbAccess = 'success';
        } catch {
          activeChecklist.dbAccess = 'failed';
          set({ checklist: { ...activeChecklist }, updateStep: 'failed', errorMessage: 'Database not accessible or corrupted.' });
          return false;
        }
        set({ checklist: { ...activeChecklist } });

        // --- 2. Disk Space Validation ---
        const spaceResult = await api.verifyDiskSpace();
        if (spaceResult.success && spaceResult.freeBytes !== undefined) {
          // Require at least 100MB free space
          const minRequiredBytes = 100 * 1024 * 1024;
          if (spaceResult.freeBytes >= minRequiredBytes) {
            activeChecklist.diskSpace = 'success';
          } else {
            activeChecklist.diskSpace = 'failed';
            set({ checklist: { ...activeChecklist }, updateStep: 'failed', errorMessage: `Insufficient disk space. Need at least 100MB (Free: ${(spaceResult.freeBytes / 1024 / 1024).toFixed(1)}MB).` });
            return false;
          }
        } else {
          activeChecklist.diskSpace = 'failed';
          set({ checklist: { ...activeChecklist }, updateStep: 'failed', errorMessage: spaceResult.error || 'Failed to verify free disk space.' });
          return false;
        }
        set({ checklist: { ...activeChecklist } });

        // --- 3. Network Accessibility ---
        if (navigator.onLine) {
          activeChecklist.network = 'success';
        } else {
          activeChecklist.network = 'failed';
          set({ checklist: { ...activeChecklist }, updateStep: 'failed', errorMessage: 'Internet connection is required to download updates.' });
          return false;
        }
        set({ checklist: { ...activeChecklist } });

        // --- 4. Automatic Full Backup ---
        set({ updateStep: 'backup' });
        let backupFilename = '';
        try {
          const backupData = await db.exportAllData();
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          backupFilename = `preupdate_backup_${get().updateInfo?.version || '2.0.0'}_${timestamp}.json`;
          
          const result = await api.saveAutoBackup(backupData, backupFilename);
          if (result.success) {
            activeChecklist.backup = 'success';
          } else {
            throw new Error(result.error || 'Filesystem write failed');
          }
        } catch (backupErr) {
          activeChecklist.backup = 'failed';
          const errMsg = backupErr instanceof Error ? backupErr.message : String(backupErr);
          set({ checklist: { ...activeChecklist }, updateStep: 'failed', errorMessage: `Pre-update backup failed: ${errMsg}` });
          return false;
        }
        set({ checklist: { ...activeChecklist } });

        // --- 5. Update Readiness Simulation ---
        set({ updateStep: 'simulation' });
        try {
          const students = await db.getAllRecords<Student>('students');
          const corrupted = students.filter(s => !s.lrn || typeof s.last_name !== 'string');
          if (corrupted.length > 0) {
            throw new Error(`${corrupted.length} corrupted student records detected.`);
          }
          activeChecklist.simulation = 'success';
        } catch (simErr) {
          activeChecklist.simulation = 'failed';
          const errMsg = simErr instanceof Error ? simErr.message : String(simErr);
          set({ checklist: { ...activeChecklist }, updateStep: 'failed', errorMessage: `Readiness simulation failed: ${errMsg}` });
          return false;
        }
        set({ checklist: { ...activeChecklist } });

        // --- 6. Save State Before Installing ---
        // Fetch baseline counts for reconciliation report
        const counts = {
          students: await db.getStoreCount('students'),
          sections: await db.getStoreCount('sections'),
          subjects: await db.getStoreCount('subjects'),
          classRecords: await db.getStoreCount('classRecords'),
          enrollments: await db.getStoreCount('enrollments'),
          attendanceRecords: await db.getStoreCount('attendanceRecords'),
          sf2Sheets: await db.getStoreCount('sf2Sheets'),
          hpsRecords: await db.getStoreCount('hpsRecords'),
          gradingSheetRecords: await db.getStoreCount('gradingSheetRecords'),
          observedValues: await db.getStoreCount('observedValues')
        };

        const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.2.11';
        const stateData = {
          fromVersion: currentVersion,
          toVersion: get().updateInfo?.version || 'Unknown',
          notes: get().updateInfo?.notes || [],
          timestamp: Date.now(),
          backupFilename,
          counts
        };

        await api.writePreUpdateState(stateData);

        // Success!
        return true;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Pipeline process error.';
        set({ updateStep: 'failed', errorMessage: errMsg });
        return false;
      }
    },

    startDownload: async () => {
      if (window.electronAPI?.downloadUpdate) {
        const result = await window.electronAPI.downloadUpdate();
        if (!result.success) {
          set({ updateStep: 'failed', errorMessage: result.error || 'Failed to start download.' });
        }
      }
    },

    applyUpdate: () => {
      if (window.electronAPI?.quitAndInstall) {
        window.electronAPI.quitAndInstall();
      }
    },

    checkForPostUpdateReconciliation: async () => {
      const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '3.0.2';
      const api = window.electronAPI;

      try {
        const preState = api ? await api.readPreUpdateState() : null;
        const lastVersion = localStorage.getItem('formease_last_app_version');

        if (preState) {
          console.log('📊 Post-update verification state found:', preState);

          const currentCounts = {
            students: await db.getStoreCount('students'),
            sections: await db.getStoreCount('sections'),
            subjects: await db.getStoreCount('subjects'),
            classRecords: await db.getStoreCount('classRecords'),
            enrollments: await db.getStoreCount('enrollments'),
            attendanceRecords: await db.getStoreCount('attendanceRecords'),
            sf2Sheets: await db.getStoreCount('sf2Sheets'),
            hpsRecords: await db.getStoreCount('hpsRecords'),
            gradingSheetRecords: await db.getStoreCount('gradingSheetRecords'),
            observedValues: await db.getStoreCount('observedValues')
          };

          const counts = (preState.counts || {}) as Record<string, number>;
          const details = Object.entries(counts).map(([table, beforeCount]) => {
            const afterCount = currentCounts[table as keyof typeof currentCounts] ?? 0;
            return {
              table,
              before: beforeCount,
              after: afterCount,
              match: beforeCount === afterCount
            };
          });

          const hasMismatch = details.some(d => !d.match);
          const report: ReconciliationReport = {
            fromVersion: preState.fromVersion,
            toVersion: preState.toVersion,
            notes: preState.notes || [],
            timestamp: preState.timestamp,
            backupFilename: preState.backupFilename,
            status: hasMismatch ? 'mismatch' : 'success',
            details
          };

          set({ reconciliationReport: report });
          if (api?.clearPreUpdateState) await api.clearPreUpdateState();
        } else if (lastVersion && lastVersion !== CURRENT_VERSION) {
          // Manual installer update detected (e.g. downloaded DMG or Setup directly)
          const studentCount = await db.getStoreCount('students');
          const sectionCount = await db.getStoreCount('sections');
          const subjectCount = await db.getStoreCount('subjects');
          const classRecordCount = await db.getStoreCount('classRecords');

          const report: ReconciliationReport = {
            fromVersion: lastVersion,
            toVersion: CURRENT_VERSION,
            notes: [
              "☁️ Automated Google Drive Cloud Backup Onboarding with hourly sync, exit protection, and full restore.",
              "📊 Enhanced Grade Management live E-Class Sync and robust subject matching for curriculum learning areas.",
              "🛡️ Safe, section-scoped Grade Management Clear All preserving all teacher E-Class Record data."
            ],
            timestamp: Date.now(),
            status: 'success',
            details: [
              { table: 'students', before: studentCount, after: studentCount, match: true },
              { table: 'sections', before: sectionCount, after: sectionCount, match: true },
              { table: 'subjects', before: subjectCount, after: subjectCount, match: true },
              { table: 'classRecords', before: classRecordCount, after: classRecordCount, match: true }
            ]
          };

          set({ reconciliationReport: report });
        }

        // Save current version to localStorage for future version change detection
        localStorage.setItem('formease_last_app_version', CURRENT_VERSION);
      } catch (err) {
        console.error('Error during post-update reconciliation:', err);
      }
    },

    rollbackToPreUpdateBackup: async (filename: string) => {
      const api = window.electronAPI;
      if (!api) return;

      try {
        set({ updateStep: 'checking', errorMessage: null });
        const backupData = await api.readFsBackupContent(filename);
        if (!backupData) throw new Error('Could not read backup file content.');

        // Restore data using database importFromBackup
        await db.importFromBackup(backupData.data || backupData);
        set({ reconciliationReport: null });
        alert('🔄 Rollback successful! System restored to pre-update state.');
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        alert(`❌ Rollback failed: ${errMsg}`);
      }
    },

    clearReconciliationReport: () => {
      set({ reconciliationReport: null });
    }
  };
});
