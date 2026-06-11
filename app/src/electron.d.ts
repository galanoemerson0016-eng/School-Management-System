export {};

declare global {
  interface Window {
    electronAPI: {
      platform: string;
      version: string;
      getMachineId: () => Promise<string>;
      checkForUpdates: () => void;
      onUpdateMessage: (callback: (message: string) => void) => void;
      saveAutoBackup: (data: unknown, filename: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      closeApp: (force?: boolean) => void;
      onCloseRequested: (callback: () => void) => void;
      minimizeApp: () => void;
      maximizeApp: () => void;
      printToPDF: (options: { defaultFilename?: string; autoSave?: boolean }) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    };
  }
  const __APP_VERSION__: string;
}
