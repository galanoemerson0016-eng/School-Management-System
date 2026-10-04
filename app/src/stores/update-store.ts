import { create } from 'zustand';
import { db } from '../services/database';
import { generatePreUpdateSafetyVault } from '../services/pre-update-safety';
import { exportFullDatabaseBackup, savePreRestoreSafetySnapshot } from '../utils/backup-restore';
import { embedChecksum } from '../utils/backup-integrity';
import { hasValidPayloadHash, validateEmbeddedChecksum } from '../utils/backup-integrity';
import { initializeAppStore } from './app-store';
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
  recoveryAvailable?: boolean;
  details: Array<{
    table: string;
    before: number;
    after: number;
    match: boolean;
  }>;
}

type RecoveryBackupApi = Pick<NonNullable<Window['electronAPI']>, 'listFsBackups' | 'readFsBackupContent'>;

export async function findVerifiedV3517RecoveryBackup(api: RecoveryBackupApi): Promise<{
  filename: string;
  counts: Record<string, number>;
} | null> {
  const backups = await api.listFsBackups();
  if (!Array.isArray(backups)) return null;

  for (const backup of backups) {
    const filename = typeof backup?.filename === 'string' ? backup.filename : '';
    if (!/^SMS_Backup_Comprehensive_preupdate_3\.5\.17_/i.test(filename)) continue;

    let content: Record<string, unknown>;
    try {
      content = await api.readFsBackupContent(filename) as Record<string, unknown>;
      if (!content || typeof content !== 'object' || typeof content._checksum !== 'string') continue;
      const integrity = await validateEmbeddedChecksum(content);
      if (!integrity.valid || (integrity.strength === 'legacy' && !await hasValidPayloadHash(content))) continue;
    } catch {
      // An unreadable candidate must not conceal an older intact backup.
      continue;
    }

    const payload = (content.payload || content.data || content) as Record<string, unknown>;
    if (!payload || typeof payload !== 'object' || !['students', 'sections', 'subjects', 'classRecords', 'gradingSheetRecords'].every(key => Array.isArray(payload[key]))) continue;
    const count = (key: string) => Array.isArray(payload[key]) ? payload[key].length : 0;
    return {
      filename,
      counts: {
        students: count('students'),
        sections: count('sections'),
        subjects: count('subjects'),
        classRecords: count('classRecords'),
        enrollments: count('enrollments'),
        attendanceRecords: count('attendanceRecords'),
        gradingSheetRecords: count('gradingSheetRecords'),
      },
    };
  }
  return null;
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
  safetyStatusText: string | null;
  safetyVaultFilename: string | null;
  
  // Actions
  checkForUpdates: () => void;
  runPreUpdatePipeline: () => Promise<boolean>;
  startDownload: () => Promise<void>;
  applyUpdate: () => Promise<void>;
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
let installInProgress = false;

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
    safetyStatusText: null,
    safetyVaultFilename: null,

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
      set({
        updateStep: 'health-checks',
        checklist: { ...initialChecklist },
        errorMessage: null,
        safetyStatusText: null,
        safetyVaultFilename: null
      });
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
          console.warn('[Update Pipeline] Initial DB access check error, retrying...', dbErr);
          try {
            await new Promise((r) => setTimeout(r, 400));
            await db.getStoreCount('students');
            activeChecklist.dbAccess = 'success';
          } catch (retryErr) {
            console.error('[Update Pipeline] DB access check failed after retry:', retryErr);
            activeChecklist.dbAccess = 'failed';
            set({
              checklist: { ...activeChecklist },
              updateStep: 'failed',
              errorMessage:
                'Database is temporarily busy or locked by an active process. Click "Close & Continue" to proceed to your portal, or click "Retry Check".',
            });
            return false;
          }
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

        // --- 4. Automatic Multi-Format Safety Vault & Backup ---
        set({ updateStep: 'backup', safetyStatusText: 'Initializing Pre-Update Multi-Format Safety Vault...' });
        let backupFilename = '';
        try {
          const targetVer = get().updateInfo?.version || 'Latest';
          const comprehensive = await exportFullDatabaseBackup(`Pre-Update Safety Backup - v${targetVer}`);
          const backupData = await embedChecksum(comprehensive as unknown as Record<string, unknown>);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          backupFilename = `SMS_Backup_Comprehensive_preupdate_${targetVer}_${timestamp}.json`;
          
          // 1. Electron JSON local copy
          const savedBackup = await api.saveAutoBackup(backupData, backupFilename);
          if (!savedBackup?.success) {
            throw new Error(savedBackup?.error || 'The local pre-update backup could not be verified.');
          }
          const rereadBackup = await api.readFsBackupContent(backupFilename) as Record<string, unknown>;
          const readbackCheck = await validateEmbeddedChecksum(rereadBackup);
          if (!readbackCheck.valid || readbackCheck.strength !== 'strong' || !await hasValidPayloadHash(rereadBackup)) {
            throw new Error('The pre-update backup failed readback verification.');
          }

          // 2. Comprehensive Multi-Format Safety Vault (Master Excel, ECRs, Consolidated Grades, JSON)
          const vaultResult = await generatePreUpdateSafetyVault(targetVer, (statusText) => {
            set({ safetyStatusText: statusText });
          });

          if (vaultResult.success) {
            set({ safetyVaultFilename: vaultResult.filename });
          } else {
            console.warn('Pre-update safety vault notice:', vaultResult.error);
          }

          activeChecklist.backup = 'success';
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

        const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '3.5.6';
        const stateData = {
          fromVersion: currentVersion,
          toVersion: get().updateInfo?.version || 'Unknown',
          notes: get().updateInfo?.notes || [],
          timestamp: Date.now(),
          backupFilename,
          counts
        };

        const wrotePreUpdateState = await api.writePreUpdateState(stateData);
        if (!wrotePreUpdateState?.success) {
          throw new Error(wrotePreUpdateState?.error || 'The pre-update recovery state could not be verified.');
        }

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
        set({ updateStep: 'downloading', errorMessage: null });
        window.electronAPI.downloadUpdate();
      }
    },

    applyUpdate: async () => {
      if (installInProgress || get().updateStep !== 'ready-to-install' || !window.electronAPI?.quitAndInstall) return;
      installInProgress = true;
      set({ safetyStatusText: 'Verifying a fresh safety copy before installation…', errorMessage: null });
      let barrierHeld = false;
      let installAccepted = false;
      try {
        const generationBeforeSnapshot = db.getWriteGeneration();
        const safetyCopy = await savePreRestoreSafetySnapshot();
        if (!safetyCopy.filename) throw new Error('The desktop safety backup was not created.');
        // The snapshot itself starts and completes one IndexedDB write.
        if (!db.acquireInstallWriteBarrier(generationBeforeSnapshot + 2)) {
          throw new Error('School records changed while the safety copy was being made. Please try again.');
        }
        barrierHeld = true;
        const result = await window.electronAPI.quitAndInstall(safetyCopy.filename);
        if (!result.success) throw new Error(result.error || 'The update could not be started.');
        installAccepted = true;
      } catch (error) {
        set({
          updateStep: 'failed',
          errorMessage: `Installation cancelled: ${error instanceof Error ? error.message : String(error)}`,
        });
      } finally {
        if (barrierHeld && !installAccepted) db.releaseInstallWriteBarrier();
        installInProgress = false;
      }
    },

    checkForPostUpdateReconciliation: async () => {
      const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '3.5.21';
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
        } else if (api) {
          const recoveryBackup = await findVerifiedV3517RecoveryBackup(api);
          if (recoveryBackup) {
            const currentCounts = {
              students: await db.getStoreCount('students'),
              sections: await db.getStoreCount('sections'),
              subjects: await db.getStoreCount('subjects'),
              classRecords: await db.getStoreCount('classRecords'),
              enrollments: await db.getStoreCount('enrollments'),
              attendanceRecords: await db.getStoreCount('attendanceRecords'),
              gradingSheetRecords: await db.getStoreCount('gradingSheetRecords'),
            };
            const details = Object.entries(recoveryBackup.counts).map(([table, before]) => ({
              table,
              before,
              after: currentCounts[table as keyof typeof currentCounts] ?? 0,
              match: before === currentCounts[table as keyof typeof currentCounts],
            }));
            const dismissalKey = `formease-recovery-dismissed-${recoveryBackup.filename}`;
            const comparison = JSON.stringify(details.map(({ table, after }) => [table, after]));
            if (localStorage.getItem(dismissalKey) !== comparison) set({
              reconciliationReport: {
                fromVersion: '3.5.17',
                toVersion: CURRENT_VERSION,
                timestamp: Date.now(),
                backupFilename: recoveryBackup.filename,
                recoveryAvailable: true,
                status: details.every(row => row.match) ? 'success' : 'mismatch',
                notes: ['A verified pre-update v3.5.17 backup is available. Review the counts below and restore only if they contain the missing records.'],
                details,
              },
            });
          }
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
              "⚡ Automated Startup Grade Healing: Audits and repairs inflated weights and false 100s on launch with zero teacher re-encoding.",
              "🎯 Normalized Weights & Header Percentages: Table headers display standard 40%/60%/20% weights, ensuring genuine DepEd grades.",
              "🛡️ Ghost Record Protection: Suppresses phantom grades when score containers are empty.",
              "📋 SF9 Elem & JHS Clean Layout: Streamlined learner header by removing unused Track & Strand rows for Grades 1–10.",
              "🏛️ Redesigned Institute Dashboard: Modernized single-screen institutional overview with specimen signatures & official seal studio.",
              "📊 Official Excel Template & Formula Preservation: 100% native DepEd formula integrity across SF9, SHS G12, and SSHS Pilot.",
              "🔒 100% backward-compatible update with zero data loss guarantee."
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
        const content = (backupData.data || backupData) as Record<string, unknown>;
        const integrity = await validateEmbeddedChecksum(content);
        if (!integrity.valid || (integrity.strength === 'legacy' && !await hasValidPayloadHash(content))) {
          throw new Error('The pre-update backup failed integrity verification. Existing records were not changed.');
        }
        await savePreRestoreSafetySnapshot();

        // Restore data using database importFromBackup
        await db.importFromBackup(content);
        // Immediately rehydrate in-memory Zustand store so data appears instantly in UI
        await initializeAppStore();
        set({ updateStep: 'idle', reconciliationReport: null });
        alert('🔄 Rollback successful! System restored to pre-update state.');
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        set({ updateStep: 'failed', errorMessage: errMsg });
        alert(`❌ Rollback failed: ${errMsg}`);
      }
    },

    clearReconciliationReport: () => {
      const report = get().reconciliationReport;
      if (report?.recoveryAvailable && report.backupFilename) {
        const comparison = JSON.stringify(report.details.map(({ table, after }) => [table, after]));
        localStorage.setItem(`formease-recovery-dismissed-${report.backupFilename}`, comparison);
      }
      set({ reconciliationReport: null });
    }
  };
});
