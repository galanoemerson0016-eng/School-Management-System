/**
 * SnapshotPreviewService
 * Manages the live sandbox preview of automated, disk, or uploaded backups.
 * 
 * Key Principles:
 * 1. ZERO RISK TO PRODUCTION DATA: All preview operations occur exclusively in
 *    an isolated IndexedDB database ('FormEaseDB_Preview'). 'FormEaseDB' remains untouched.
 * 2. FULL FIDELITY: The entire application (Dashboard, Students, Sections, Subjects,
 *    Class Records, SF9, SF10, Attendance, etc.) displays the snapshot's data authentically.
 * 3. INSTANT CLEAN EXIT: Closing preview mode discards the preview database, restores
 *    the active school year and UI pointers, and returns immediately to current live data.
 * 4. ONE-CLICK COMMIT: If the user verifies the data in preview and decides to restore,
 *    it takes a safety backup of production and applies the restore permanently.
 */

import { db, type BackupImportPayload } from './database';
import { exportFullDatabaseBackup, savePreRestoreSafetySnapshot } from '../utils/backup-restore';
import { useAppStore } from '../stores/app-store';

export interface SnapshotPreviewMetadata {
  id?: string;
  filename?: string;
  sourceType: 'auto' | 'fs' | 'cloud' | 'file';
  title: string;
  timestamp: number;
  schoolYear: string;
  studentsCount: number;
  sectionsCount: number;
  gradesCount: number;
  attendanceCount?: number;
  subjectsCount?: number;
  gradingSheetsCount?: number;
}

export interface SavedPrePreviewState {
  activeSchoolYear: string | null;
  formease_active_school_year: string | null;
  formease_selected_section: string | null;
  selectedSection: string | null;
  currentView: string;
}

const PREVIEW_ACTIVE_KEY = 'formease_preview_mode_active';
const PREVIEW_METADATA_KEY = 'formease_preview_metadata';
const PREVIEW_SAVED_STATE_KEY = 'formease_preview_saved_state';

export const SnapshotPreviewService = {
  /**
   * Check if Live Snapshot Preview Mode is active.
   */
  isPreviewActive(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(PREVIEW_ACTIVE_KEY) === 'true';
    } catch {
      return false;
    }
  },

  /**
   * Retrieve metadata about the currently previewed snapshot.
   */
  getPreviewMetadata(): SnapshotPreviewMetadata | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(PREVIEW_METADATA_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Enters Live Snapshot Preview Mode with the provided backup data.
   */
  async startPreview(rawBackupData: unknown, metadata: SnapshotPreviewMetadata): Promise<void> {
    if (!rawBackupData) {
      throw new Error('No backup data provided to preview.');
    }

    const payload = db.extractBackupPayload(rawBackupData);
    if (!payload || Object.keys(payload).length === 0) {
      throw new Error('Could not parse snapshot contents. The backup may be corrupted or invalid.');
    }

    // 1. Snapshot the pre-preview state so we can restore it when exiting
    const savedState: SavedPrePreviewState = {
      activeSchoolYear: typeof localStorage !== 'undefined' ? localStorage.getItem('activeSchoolYear') : null,
      formease_active_school_year: typeof localStorage !== 'undefined' ? localStorage.getItem('formease_active_school_year') : null,
      formease_selected_section: typeof localStorage !== 'undefined' ? localStorage.getItem('formease_selected_section') : null,
      selectedSection: typeof localStorage !== 'undefined' ? localStorage.getItem('selectedSection') : null,
      currentView: useAppStore.getState().currentView || 'dashboard',
    };

    const savedStateJson = JSON.stringify(savedState);
    localStorage.setItem(PREVIEW_SAVED_STATE_KEY, savedStateJson);

    // 2. Mark preview mode active in localStorage & mark session alive
    localStorage.setItem(PREVIEW_ACTIVE_KEY, 'true');
    localStorage.setItem(PREVIEW_METADATA_KEY, JSON.stringify(metadata));
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('formease_session_alive', 'true');
    }

    // 3. Reset existing connection and prepare fresh isolated preview database
    await db.resetConnection();
    await db.preparePreviewDatabase();

    // 4. Import the snapshot data into FormEaseDB_Preview
    await db.importFromBackup(rawBackupData as BackupImportPayload);

    // 5. Align school year in localStorage and Zustand so the UI immediately shows the snapshot's records
    const targetSY = metadata.schoolYear && metadata.schoolYear !== 'Active S.Y.' ? metadata.schoolYear : null;
    if (targetSY && typeof localStorage !== 'undefined') {
      localStorage.setItem('activeSchoolYear', targetSY);
      localStorage.setItem('formease_active_school_year', targetSY);
      useAppStore.setState({ activeSchoolYear: targetSY });
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('formease_selected_section');
      localStorage.removeItem('selectedSection');
    }

    // 6. Reset connection so subsequent queries open FormEaseDB_Preview cleanly
    await db.resetConnection();

    // 7. Load all preview data into memory reactively without reloading window
    const { initializeAppStore } = await import('../stores/app-store');
    await initializeAppStore();

    // 8. Navigate to dashboard
    useAppStore.setState({ currentView: 'dashboard' });

    // 9. Dispatch event so UI components (e.g. SnapshotPreviewBanner) update immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('formease_preview_changed', { detail: { active: true, metadata } }));
    }
  },

  /**
   * Exits Live Snapshot Preview Mode without restoring.
   * Cleans up the preview database and restores original pre-preview state.
   */
  async exitPreview(): Promise<void> {
    // 1. Revert saved state
    try {
      const raw = localStorage.getItem(PREVIEW_SAVED_STATE_KEY);
      if (raw && typeof localStorage !== 'undefined') {
        const saved: SavedPrePreviewState = JSON.parse(raw);
        if (saved.activeSchoolYear) {
          localStorage.setItem('activeSchoolYear', saved.activeSchoolYear);
          useAppStore.setState({ activeSchoolYear: saved.activeSchoolYear });
        } else {
          localStorage.removeItem('activeSchoolYear');
        }
        if (saved.formease_active_school_year) {
          localStorage.setItem('formease_active_school_year', saved.formease_active_school_year);
        } else {
          localStorage.removeItem('formease_active_school_year');
        }
        if (saved.formease_selected_section) {
          localStorage.setItem('formease_selected_section', saved.formease_selected_section);
        } else {
          localStorage.removeItem('formease_selected_section');
        }
        if (saved.selectedSection) {
          localStorage.setItem('selectedSection', saved.selectedSection);
        } else {
          localStorage.removeItem('selectedSection');
        }
      }
    } catch (err) {
      console.warn('Notice restoring pre-preview state:', err);
    }

    // 2. Clear flags
    localStorage.removeItem(PREVIEW_ACTIVE_KEY);
    localStorage.removeItem(PREVIEW_METADATA_KEY);
    localStorage.removeItem(PREVIEW_SAVED_STATE_KEY);

    // 3. Drop preview database & reset connection
    await db.cleanupPreviewDatabase();
    await db.resetConnection();

    // 4. Reload production stores cleanly in memory
    const { initializeAppStore } = await import('../stores/app-store');
    await initializeAppStore();

    // 5. Navigate to dashboard
    useAppStore.setState({ currentView: 'dashboard' });

    // 6. Notify UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('formease_preview_changed', { detail: { active: false, metadata: null } }));
    }
  },

  /**
   * Commits the currently previewed snapshot into the real production database (FormEaseDB).
   */
  async commitPreviewRestore(): Promise<void> {
    const metadata = this.getPreviewMetadata();

    // 1. Export verified data directly from FormEaseDB_Preview
    const verifiedBackup = await exportFullDatabaseBackup('Restored from Preview Sandbox');

    // 2. Clear preview flags so db switches back to FormEaseDB
    localStorage.removeItem(PREVIEW_ACTIVE_KEY);
    localStorage.removeItem(PREVIEW_METADATA_KEY);
    localStorage.removeItem(PREVIEW_SAVED_STATE_KEY);

    // 3. Close & cleanup preview database
    await db.cleanupPreviewDatabase();
    await db.resetConnection();

    // 4. We are now targeting FormEaseDB: Take a safety snapshot of production before overwriting
    await savePreRestoreSafetySnapshot();

    // 5. Import the verified backup into FormEaseDB
    await db.importFromBackup(verifiedBackup as unknown as BackupImportPayload);

    // 6. Resynchronize school year
    const finalSY = metadata?.schoolYear && metadata.schoolYear !== 'Active S.Y.' 
      ? metadata.schoolYear 
      : verifiedBackup.summary.activeSchoolYear;

    if (finalSY && typeof localStorage !== 'undefined') {
      localStorage.setItem('activeSchoolYear', finalSY);
      localStorage.setItem('formease_active_school_year', finalSY);
      useAppStore.setState({ activeSchoolYear: finalSY });
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('formease_selected_section');
      localStorage.removeItem('selectedSection');
    }

    // 7. Reload production stores in memory
    const { initializeAppStore } = await import('../stores/app-store');
    await initializeAppStore();

    // 8. Navigate to dashboard & notify UI
    useAppStore.setState({ currentView: 'dashboard' });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('formease_preview_changed', { detail: { active: false, metadata: null } }));
    }

    alert(`✅ Snapshot successfully restored into your active database!\n\n• School Year: S.Y. ${finalSY}\n• Enrolled Learners: ${verifiedBackup.summary.students}\n• Sections: ${verifiedBackup.summary.sections}\n• Recorded Grades: ${verifiedBackup.summary.grades}`);
  },

  /**
   * Detects and cleans any orphaned preview sessions if the app was closed or crashed
   * while in preview mode, ensuring production data and settings are immediately restored.
   */
  async checkAndCleanOrphanPreviewSession(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const isSessionAlive = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('formease_session_alive') === 'true';
      const isPreviewActive = localStorage.getItem(PREVIEW_ACTIVE_KEY) === 'true';
      const orphanSavedState = localStorage.getItem(PREVIEW_SAVED_STATE_KEY);

      if (!isSessionAlive && (isPreviewActive || orphanSavedState)) {
        console.log('🧹 Orphaned snapshot preview session detected on cold boot. Reverting to production data...');
        if (orphanSavedState) {
          const saved: SavedPrePreviewState = JSON.parse(orphanSavedState);
          if (saved.activeSchoolYear) {
            localStorage.setItem('activeSchoolYear', saved.activeSchoolYear);
          }
          if (saved.formease_active_school_year) {
            localStorage.setItem('formease_active_school_year', saved.formease_active_school_year);
          }
          if (saved.formease_selected_section) {
            localStorage.setItem('formease_selected_section', saved.formease_selected_section);
          }
          if (saved.selectedSection) {
            localStorage.setItem('selectedSection', saved.selectedSection);
          }
        }
        localStorage.removeItem(PREVIEW_ACTIVE_KEY);
        localStorage.removeItem(PREVIEW_METADATA_KEY);
        localStorage.removeItem(PREVIEW_SAVED_STATE_KEY);
        await db.cleanupPreviewDatabase();
        await db.resetConnection();
        console.log('✅ Production data pointers successfully restored.');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('formease_session_alive', 'true');
      }
    } catch (e) {
      console.warn('Orphan preview cleanup notice:', e);
    }
  }
};
