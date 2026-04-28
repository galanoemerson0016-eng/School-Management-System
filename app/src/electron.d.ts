export {};

declare global {
  interface Window {
    electronAPI: {
      platform: string;
      version: string;
      getMachineId: () => Promise<string>;
      checkForUpdates: () => void;
      onUpdateMessage: (callback: (message: string) => void) => void;
      saveAutoBackup: (data: any, filename: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    };
  }
  const __APP_VERSION__: string;
}
