export {};

type SafeAny = Parameters<typeof console.log>[number];

declare global {
  interface Window {
    // Present only in the Electron desktop build; undefined in the web build
    electronAPI?: {
      platform: string;
      version: string;
      getMachineId: () => Promise<string>;
      getLocalIp: () => Promise<string>;
      getAllLocalIps: () => Promise<Array<{ name: string; address: string }>>;
      checkForUpdates: () => void;
      onUpdateMessage: (callback: (message: SafeAny) => void) => void;
      saveAutoBackup: (data: unknown, filename: string, retentionLimit?: number) => Promise<{ success: boolean; path?: string; error?: string }>;
      logError: (payload: { kind: string; message: string; stack?: string }) => void;
      licenseStatus: () => Promise<{
        activated: boolean;
        reason?: 'none' | 'expired' | 'offline_limit';
        serial?: string;
        registeredTo?: string;
        activatedAt?: string;
        expiresAt?: string;
      }>;
      licenseActivate: (payload: { serial: string; fullName?: string; platform?: 'windows' | 'mac' }) => Promise<{
        success: boolean;
        error?: string;
        offline?: boolean;
        activated?: boolean;
        serial?: string;
        registeredTo?: string;
        activatedAt?: string;
        expiresAt?: string;
      }>;
      licenseVerifyOnline?: () => Promise<{
        revoked: boolean;
        offline?: boolean;
        error?: string;
      }>;
      onLicenseRevoked: (callback: () => void) => void;
      closeApp: (force?: boolean) => void;
      onCloseRequested: (callback: () => void) => void;
      minimizeApp: () => void;
      maximizeApp: () => void;
      printToPDF: (options: { defaultFilename?: string; autoSave?: boolean; landscape?: boolean; pageSize?: SafeAny }) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      verifyDiskSpace: () => Promise<{ success: boolean; freeBytes?: number; error?: string }>;
      writePreUpdateState: (state: SafeAny) => Promise<{ success: boolean; error?: string }>;
      readPreUpdateState: () => Promise<SafeAny>;
      clearPreUpdateState: () => Promise<{ success: boolean; error?: string }>;
      listFsBackups: () => Promise<SafeAny>;
      readFsBackupContent: (filename: string) => Promise<SafeAny>;
      deleteFsBackup: (filename: string) => Promise<{ success: boolean; error?: string }>;
      downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
      quitAndInstall: () => void;
      gdriveAuthStart: (payload: { clientId: string; clientSecret: string }) => Promise<{ success: boolean; email?: string }>;
      gdriveStatus: () => Promise<{ connected: boolean; email: string | null }>;
      gdriveDisconnect: () => Promise<{ success: boolean }>;
      gdriveUploadBackup: (payload: { backupJsonStr: string; filename: string }) => Promise<{ success: boolean; fileId?: string }>;
      gdriveListBackups: () => Promise<SafeAny>;
      gdriveDownloadBackup: (fileId: string) => Promise<string>;
      exportHtmlPdf: (payload: {
        html: string;
        defaultFilename: string;
        paperSize: 'letter' | 'a4' | 'folio' | 'cr80';
        pageWidthPx?: number;
        pageHeightPx?: number;
        postLoadScript?: string;
        landscape?: boolean;
      }) => Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }>;
      sendSmsHttpRequest?: (options: {
        url: string;
        method?: string;
        headers?: Record<string, string>;
        body?: unknown;
      }) => Promise<{ success: boolean; statusCode?: number; data?: string; error?: string }>;
      pushAttendanceSession?: (sessionData: unknown) => Promise<{ success: boolean; error?: string }>;
      startAttendancePairing?: () => Promise<{ token: string; expiresAt: number; error?: string }>;
      revokeAttendancePairing?: (token: string) => Promise<{ success: boolean; error?: string }>;
      pushAttendanceUpdate?: (syncEvent: unknown) => Promise<{ success: boolean; error?: string }>;
      getAttendanceUpdates?: (sinceTimestamp: number) => Promise<{ events: Array<{ record: unknown; studentName?: string; timestamp: number; sourceDevice?: string }>; lastUpdated: number }>;
    };
  }
  const __APP_VERSION__: string;
}
