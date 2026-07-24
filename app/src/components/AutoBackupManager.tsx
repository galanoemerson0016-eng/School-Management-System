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
          console.log('✅ Auto-backup saved silently to:', result.path);
        } else {
          console.error('❌ Auto-backup failed:', result.error);
        }
      }
    } catch (error) {
      console.error('Failed to perform silent auto-backup:', error);
    }
  }, []);

  const handleConfirmClose = useCallback(async () => {
    setShowConfirm(false);
    const electronAPI = window.electronAPI;
    if (electronAPI) {
      try {
        // Enforce max 2.5s timeout for exit backup so closing is fast and responsive
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2500));
        await Promise.race([
          performSilentBackup(),
          timeoutPromise
        ]);
      } catch (error) {
        console.error('Error in silent exit auto-backup:', error);
      } finally {
        electronAPI.closeApp(true);
      }
    }
  }, [performSilentBackup]);

  const handleCancelClose = useCallback(() => {
    setShowConfirm(false);
  }, []);

  useEffect(() => {
    // A. Silent Auto-Backup on Mount (App Opening)
    const startupTimer = setTimeout(() => {
      void performSilentBackup();
    }, 5000);

    // B. Show Exit Confirmation on Window Close
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
      title="Exit FormEase Pro"
      message="Are you sure you want to exit FormEase Pro?"
      intent="danger"
      confirmLabel="Yes, Exit App"
      cancelLabel="Cancel"
      onConfirm={handleConfirmClose}
      onCancel={handleCancelClose}
    />
  );
}
