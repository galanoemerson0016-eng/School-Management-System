import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db, isPreviewMode, getActiveDbName, PRODUCTION_DB_NAME, PREVIEW_DB_NAME } from './database';
import { SnapshotPreviewService, type SnapshotPreviewMetadata } from './SnapshotPreviewService';
import { AutoBackupManager } from './AutoBackupManager';
import { IncrementalBackupService } from './IncrementalBackupService';
import { CloudSyncService } from './cloud-sync';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';

describe('Snapshot Live Preview Mode', () => {
  beforeEach(async () => {
    await db.resetConnection();
    (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
    (globalThis as unknown as { IDBKeyRange: typeof IDBKeyRange }).IDBKeyRange = IDBKeyRange;
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('starts in normal production database mode', () => {
    expect(isPreviewMode()).toBe(false);
    expect(db.isPreviewMode()).toBe(false);
    expect(getActiveDbName()).toBe(PRODUCTION_DB_NAME);
    expect(SnapshotPreviewService.isPreviewActive()).toBe(false);
    expect(SnapshotPreviewService.getPreviewMetadata()).toBeNull();
  });

  it('correctly reports preview mode when localStorage flag is set', () => {
    localStorage.setItem('formease_preview_mode_active', 'true');
    expect(isPreviewMode()).toBe(true);
    expect(db.isPreviewMode()).toBe(true);
    expect(getActiveDbName()).toBe(PREVIEW_DB_NAME);
    expect(SnapshotPreviewService.isPreviewActive()).toBe(true);
  });

  it('throws error when starting preview with null or empty payload', async () => {
    const meta: SnapshotPreviewMetadata = {
      title: 'Invalid',
      timestamp: Date.now(),
      schoolYear: '2025-2026',
      studentsCount: 0,
      sectionsCount: 0,
      gradesCount: 0,
      sourceType: 'auto',
    };

    await expect(SnapshotPreviewService.startPreview(null, meta)).rejects.toThrow('No backup data provided');
    await expect(SnapshotPreviewService.startPreview({}, meta)).rejects.toThrow('Could not parse snapshot contents');
  });

  it('saves pre-preview state and sets up preview session on startPreview', async () => {
    localStorage.setItem('activeSchoolYear', '2026-2027');
    localStorage.setItem('formease_active_school_year', '2026-2027');
    localStorage.setItem('formease_selected_section', 'sec_current_123');

    const sampleBackup = {
      summary: {
        activeSchoolYear: '2025-2026',
        students: 25,
        sections: 2,
        grades: 50,
      },
      payload: {
        activeSchoolYear: '2025-2026',
        students: [
          { lrn: '111222333444', first_name: 'Juan', last_name: 'Dela Cruz' }
        ],
        sections: [
          { id: 'sec_preview_1', section_name: 'Rizal', section_grade_level: 'Grade 7' }
        ],
        classRecords: [],
      }
    };

    const meta: SnapshotPreviewMetadata = {
      id: 'snap_test_1',
      sourceType: 'auto',
      title: 'Snapshot Test S.Y. 2025-2026',
      timestamp: 1773000000000,
      schoolYear: '2025-2026',
      studentsCount: 25,
      sectionsCount: 2,
      gradesCount: 50,
    };

    // Spy on database calls
    const resetSpy = vi.spyOn(db, 'resetConnection').mockResolvedValue();
    const prepareSpy = vi.spyOn(db, 'preparePreviewDatabase').mockResolvedValue();
    const importSpy = vi.spyOn(db, 'importFromBackup').mockResolvedValue();

    await SnapshotPreviewService.startPreview(sampleBackup, meta);

    // 1. Pre-preview state was saved in localStorage
    const savedStateStr = localStorage.getItem('formease_preview_saved_state');
    expect(savedStateStr).toBeTruthy();
    const savedState = JSON.parse(savedStateStr!);
    expect(savedState.activeSchoolYear).toBe('2026-2027');
    expect(savedState.formease_selected_section).toBe('sec_current_123');

    // 2. Active school year was aligned to snapshot's school year
    expect(localStorage.getItem('activeSchoolYear')).toBe('2025-2026');
    expect(localStorage.getItem('formease_selected_section')).toBeNull();

    // 3. Flags and metadata were set in localStorage
    expect(localStorage.getItem('formease_preview_mode_active')).toBe('true');
    const storedMeta = SnapshotPreviewService.getPreviewMetadata();
    expect(storedMeta?.title).toBe('Snapshot Test S.Y. 2025-2026');
    expect(storedMeta?.schoolYear).toBe('2025-2026');

    // 4. Database prepared and imported
    expect(prepareSpy).toHaveBeenCalled();
    expect(importSpy).toHaveBeenCalled();
    expect(resetSpy).toHaveBeenCalled();
  });

  it('restores original pre-preview state and clears flags on exitPreview', async () => {
    // Setup pre-existing state
    const savedState = {
      activeSchoolYear: '2026-2027',
      formease_active_school_year: '2026-2027',
      formease_selected_section: 'sec_original',
      selectedSection: 'sec_original',
      currentView: 'dashboard',
    };
    localStorage.setItem('formease_preview_saved_state', JSON.stringify(savedState));
    localStorage.setItem('formease_preview_mode_active', 'true');
    localStorage.setItem('activeSchoolYear', '2024-2025'); // in preview

    const cleanupSpy = vi.spyOn(db, 'cleanupPreviewDatabase').mockResolvedValue({ success: true });
    const resetSpy = vi.spyOn(db, 'resetConnection').mockResolvedValue();

    await SnapshotPreviewService.exitPreview();

    // Reverted active school year to saved
    expect(localStorage.getItem('activeSchoolYear')).toBe('2026-2027');
    expect(localStorage.getItem('formease_selected_section')).toBe('sec_original');

    // Cleared flags
    expect(localStorage.getItem('formease_preview_mode_active')).toBeNull();
    expect(localStorage.getItem('formease_preview_metadata')).toBeNull();
    expect(localStorage.getItem('formease_preview_saved_state')).toBeNull();

    expect(cleanupSpy).toHaveBeenCalled();
    expect(resetSpy).toHaveBeenCalled();
  });

  it('cleans up orphaned preview session on boot when app closed during preview', async () => {
    // Simulate window was closed: sessionStorage is empty (cold boot), but localStorage still has saved state & preview flag
    const orphanState = {
      activeSchoolYear: '2026-2027',
      formease_active_school_year: '2026-2027',
      formease_selected_section: 'sec_rescued',
      selectedSection: 'sec_rescued',
      currentView: 'dashboard',
    };
    localStorage.setItem('formease_preview_saved_state', JSON.stringify(orphanState));
    localStorage.setItem('formease_preview_mode_active', 'true');
    localStorage.setItem('activeSchoolYear', '2023-2024'); // stale preview year

    const cleanupSpy = vi.spyOn(db, 'cleanupPreviewDatabase').mockResolvedValue({ success: true });

    await SnapshotPreviewService.checkAndCleanOrphanPreviewSession();

    // Must restore real school year and pointer
    expect(localStorage.getItem('activeSchoolYear')).toBe('2026-2027');
    expect(localStorage.getItem('formease_selected_section')).toBe('sec_rescued');
    expect(localStorage.getItem('formease_preview_saved_state')).toBeNull();
    expect(localStorage.getItem('formease_preview_mode_active')).toBeNull();
    expect(cleanupSpy).toHaveBeenCalled();
  });

  it('guards background services from running during preview mode', async () => {
    localStorage.setItem('formease_preview_mode_active', 'true');

    // AutoBackupManager.triggerBackup
    const autoBackupResult = await AutoBackupManager.triggerBackup();
    expect(autoBackupResult).toBe('');

    // IncrementalBackupService.triggerIncrementalBackup
    const exportSpy = vi.fn();
    await IncrementalBackupService.triggerIncrementalBackup();
    expect(exportSpy).not.toHaveBeenCalled();

    // CloudSyncService.syncNow
    const syncResult = await CloudSyncService.syncNow();
    expect(syncResult).toBe(false);
  });
});
