import { useEffect, useCallback, useState } from 'react';
import { db } from '../services/database';
import { ConfirmationModal } from './ui/ConfirmationModal';

export function AutoBackupManager() {
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handleConfirmClose = useCallback(async () => {
    setShowConfirm(false);
    const electronAPI = window.electronAPI;
    if (electronAPI) {
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
    }
  }, [performSilentBackup]);

  const handleCancelClose = useCallback(() => {
    setShowConfirm(false);
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
      electronAPI.onCloseRequested(() => {
        setShowConfirm(true);
      });
    }

    return () => {
      clearTimeout(startupTimer);
    };
  }, [performSilentBackup]);

  return (
    <ConfirmationModal
      open={showConfirm}
      title="Close Application"
      message="Are you sure you want to exit FormEase Pro? Make sure all your class records and advisory lists have been fully finalized."
      intent="danger"
      confirmLabel="Yes, Exit App"
      cancelLabel="Cancel"
      onConfirm={handleConfirmClose}
      onCancel={handleCancelClose}
    />
  );
}
