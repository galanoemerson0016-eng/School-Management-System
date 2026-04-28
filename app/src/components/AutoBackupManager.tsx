import { useEffect, useCallback } from 'react';
import { db } from '../services/database';

export function AutoBackupManager() {
  const performSilentBackup = useCallback(async () => {
    try {
      // 1. Export all data from IndexedDB
      const data = await db.exportAllData();
      
      // 2. Prepare filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const filename = `autobackup_${timestamp}.json`;

      // 3. Call Electron IPC to save silently
      if (window.electronAPI && window.electronAPI.saveAutoBackup) {
        const result = await window.electronAPI.saveAutoBackup(data, filename);
        if (result.success) {
          console.log('✅ Auto-backup saved to:', result.path);
        } else {
          console.error('❌ Auto-backup failed:', result.error);
        }
      }
    } catch (error) {
      console.error('Failed to perform auto-backup:', error);
    }
  }, []);

  useEffect(() => {
    // A. Backup on Mount (App Start)
    // We wait 5 seconds to not slow down the initial boot
    const startupTimer = setTimeout(() => {
      void performSilentBackup();
    }, 5000);

    // B. Backup on Window Close (Exit)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Note: Modern browsers/Electron might not wait for async 
      // calls in beforeunload, but Electron usually handles 
      // IPC calls if they are fast.
      void performSilentBackup();
      
      // Standard behavior: don't block the close unless there's unsaved work
      // but here we just want to fire and forget the backup.
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(startupTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [performSilentBackup]);

  // This component doesn't render anything
  return null;
}
