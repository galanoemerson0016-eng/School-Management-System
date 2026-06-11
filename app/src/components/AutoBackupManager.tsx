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
    const electronAPI = window.electronAPI;
    if (electronAPI && electronAPI.onCloseRequested) {
      electronAPI.onCloseRequested(async () => {
        try {
          const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 5000));
          await Promise.race([
            performSilentBackup(),
            timeoutPromise
          ]);
        } catch (error) {
          console.error('Error in close-intercept auto-backup:', error);
        } finally {
          electronAPI.closeApp(true);
        }
      });
    }

    return () => {
      clearTimeout(startupTimer);
    };
  }, [performSilentBackup]);

  // This component doesn't render anything
  return null;
}
