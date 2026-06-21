import { create } from 'zustand';
import { db } from '../services/database';
import type { Student, Section, Subject, ClassRecord, Enrollment, AttendanceRecord, SF2Sheet, ObservedValues, HPSRecord } from '../types';

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

export const useUpdateStore = create<UpdateState>((set, get) => {
  // Listen for Electron update IPC notifications
  if (window.electronAPI?.onUpdateMessage) {
    window.electronAPI.onUpdateMessage((msg: any) => {
      console.log('📬 Received update IPC message:', msg);
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'update-available':
          set({
            updateAvailable: true,
            updateInfo: {
              version: msg.info.version,
              releaseDate: msg.info.releaseDate,
              notes: Array.isArray(msg.info.releaseNotes) 
                ? msg.info.releaseNotes 
                : typeof msg.info.releaseNotes === 'string'
                  ? [msg.info.releaseNotes]
                  : []
            },
            updateStep: 'ready-to-start'
          });
          break;

        case 'update-not-available':
          set({ updateAvailable: false, updateStep: 'idle' });
          break;

        case 'download-progress':
          set({
            updateStep: 'downloading',
            downloadProgress: {
              percent: msg.percent,
              speedMB: msg.speedMB,
              transferredMB: msg.transferredMB,
              totalMB: msg.totalMB
            }
          });
          break;

        case 'update-downloaded':
          set({ updateStep: 'ready-to-install' });
          break;

        case 'update-error':
          set({
            updateStep: 'failed',
            errorMessage: msg.message || 'Auto-updater experienced an error'
          });
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
        } catch (dbErr) {
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
        } catch (backupErr: any) {
          activeChecklist.backup = 'failed';
          set({ checklist: { ...activeChecklist }, updateStep: 'failed', errorMessage: `Pre-update backup failed: ${backupErr.message}` });
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
        } catch (simErr: any) {
          activeChecklist.simulation = 'failed';
          set({ checklist: { ...activeChecklist }, updateStep: 'failed', errorMessage: `Readiness simulation failed: ${simErr.message}` });
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
          timestamp: Date.now(),
          backupFilename,
          counts
        };

        await api.writePreUpdateState(stateData);

        // Success!
        return true;
      } catch (err: any) {
        set({ updateStep: 'failed', errorMessage: err.message || 'Pipeline process error.' });
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
      const api = window.electronAPI;
      if (!api) return;

      try {
        const preState = await api.readPreUpdateState();
        if (!preState) return; // No pending reconciliation check

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

        const details = Object.entries(preState.counts).map(([table, beforeCount]: [string, any]) => {
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
          timestamp: preState.timestamp,
          backupFilename: preState.backupFilename,
          status: hasMismatch ? 'mismatch' : 'success',
          details
        };

        set({ reconciliationReport: report });

        // Clean up pre-update state file on the disk
        await api.clearPreUpdateState();
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
      } catch (err: any) {
        alert(`❌ Rollback failed: ${err.message}`);
      }
    },

    clearReconciliationReport: () => {
      set({ reconciliationReport: null });
    }
  };
});
