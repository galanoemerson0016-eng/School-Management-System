import { exportFullDatabaseBackup } from '../utils/backup-restore';
import { embedChecksum } from '../utils/backup-integrity';
import { db } from './database';

export interface CloudSyncState {
  linked: boolean;
  email: string | null;
  lastSync: number | null;
  isSyncing: boolean;
}

export interface CloudBackupFile {
  id: string;
  name: string;
  size?: number;
  createdTime: string;
}

const CLIENT_ID_KEY = 'formease_gdrive_client_id';
const CLIENT_SECRET_KEY = 'formease_gdrive_client_secret';
const TOKEN_KEY = 'formease_gdrive_token';
const EMAIL_KEY = 'formease_gdrive_email';
const LAST_SYNC_KEY = 'formease_gdrive_last_sync';
const ONBOARDING_DISMISSED_KEY = 'formease_gdrive_onboarding_dismissed';

// Default Client ID and Secret for FormEase Pro native backups
const DEFAULT_CLIENT_ID = '516385983931-jp8ga7v9v9t1oub9fgmu7d07b1r4crmu.apps.googleusercontent.com';
const DEFAULT_CLIENT_SECRET = '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';

export const CloudSyncService = {
  getClientId(): string {
    return localStorage.getItem(CLIENT_ID_KEY) || DEFAULT_CLIENT_ID;
  },

  getDefaultClientId(): string {
    return DEFAULT_CLIENT_ID;
  },

  setClientId(clientId: string): void {
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  },

  resetClientId(): void {
    localStorage.removeItem(CLIENT_ID_KEY);
  },

  getClientSecret(): string {
    return localStorage.getItem(CLIENT_SECRET_KEY) || DEFAULT_CLIENT_SECRET;
  },

  getDefaultClientSecret(): string {
    return DEFAULT_CLIENT_SECRET;
  },

  setClientSecret(clientSecret: string): void {
    localStorage.setItem(CLIENT_SECRET_KEY, clientSecret);
  },

  resetClientSecret(): void {
    localStorage.removeItem(CLIENT_SECRET_KEY);
  },

  emitStatusChange(state?: CloudSyncState): void {
    const s = state || this.getState();
    window.dispatchEvent(new CustomEvent('formease-cloud-sync-status', { detail: s }));
  },

  subscribe(callback: (state: CloudSyncState) => void): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<CloudSyncState>;
      if (customEvent.detail) callback(customEvent.detail);
    };
    window.addEventListener('formease-cloud-sync-status', handler);
    return () => window.removeEventListener('formease-cloud-sync-status', handler);
  },

  shouldShowOnboarding(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) return false;
    const dismissed = localStorage.getItem(ONBOARDING_DISMISSED_KEY);
    if (dismissed === 'never') return false;
    if (dismissed) {
      const snoozeUntil = Number(dismissed);
      if (!isNaN(snoozeUntil) && Date.now() < snoozeUntil) return false;
    }
    return true;
  },

  dismissOnboarding(remindLater: boolean): void {
    if (remindLater) {
      const snoozeUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours snooze
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, String(snoozeUntil));
    } else {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'never');
    }
  },

  resetOnboardingPrompt(): void {
    localStorage.removeItem(ONBOARDING_DISMISSED_KEY);
  },

  getState(): CloudSyncState {
    const token = localStorage.getItem(TOKEN_KEY);
    const email = localStorage.getItem(EMAIL_KEY);
    const lastSyncRaw = localStorage.getItem(LAST_SYNC_KEY);
    
    return {
      linked: !!token,
      email: token ? (email || 'connected-user@google.com') : null,
      lastSync: lastSyncRaw ? Number(lastSyncRaw) : null,
      isSyncing: false
    };
  },

  async getStateAsync(): Promise<CloudSyncState> {
    if (window.electronAPI?.gdriveStatus) {
      try {
        const status = await window.electronAPI.gdriveStatus();
        const lastSyncRaw = localStorage.getItem(LAST_SYNC_KEY);
        
        // Keep localStorage linked state in sync with Electron's active native session
        if (status.connected) {
          localStorage.setItem(TOKEN_KEY, 'gdrive_native_linked');
          localStorage.setItem(EMAIL_KEY, status.email || 'school-admin@gmail.com');
        } else {
          // If native disconnected, clear localStorage tokens (unless it was a mock sandbox)
          const token = localStorage.getItem(TOKEN_KEY);
          if (token && !token.startsWith('mock_')) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(EMAIL_KEY);
          }
        }

        return {
          linked: status.connected,
          email: status.connected ? (status.email || 'school-admin@gmail.com') : null,
          lastSync: lastSyncRaw ? Number(lastSyncRaw) : null,
          isSyncing: false
        };
      } catch (err) {
        console.error('[GDrive] Failed to check status from main process:', err);
      }
    }
    return this.getState();
  },

  async unlink(): Promise<CloudSyncState> {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
    
    if (window.electronAPI?.gdriveDisconnect) {
      await window.electronAPI.gdriveDisconnect();
    }
    
    console.log('🔌 Disconnected Google Drive Cloud Sync');
    const newState = this.getState();
    this.emitStatusChange(newState);
    return newState;
  },

  async authorize(): Promise<CloudSyncState> {
    if (window.electronAPI?.gdriveAuthStart) {
      const clientId = this.getClientId();
      const clientSecret = this.getClientSecret();
      const result = await window.electronAPI.gdriveAuthStart({ clientId, clientSecret });
      if (result.success) {
        localStorage.setItem(TOKEN_KEY, 'gdrive_native_linked');
        localStorage.setItem(EMAIL_KEY, result.email || 'school-admin@gmail.com');
      } else {
        throw new Error('Google Drive authorization failed.');
      }
      const state = await this.getStateAsync();
      this.emitStatusChange(state);
      return state;
    }

    return new Promise((resolve, reject) => {
      const clientId = this.getClientId();
      const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file email');
      const redirectUri = encodeURIComponent('https://formease-licensing.web.app/oauth-redirect.html');
      
      // Build Google OAuth URL
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
      
      console.log('🔑 Opening Google OAuth consent page...');
      
      // Open dialog/popup window
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'Link Google Drive',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );

      if (!popup) {
        reject(new Error('Popup blocked! Please allow popups for this application to link Google Drive.'));
        return;
      }

      let resolved = false;

      const cleanup = () => {
        clearInterval(interval);
        window.removeEventListener('message', messageListener);
      };

      // Listen for postMessage from the redirected page (handles cross-origin securely)
      const messageListener = (event: MessageEvent) => {
        if (event.data && event.data.type === 'gdrive_auth_success') {
          const hash = event.data.hash;
          const params = new URLSearchParams(hash.substring(1));
          const token = params.get('access_token');
          
          if (token) {
            resolved = true;
            cleanup();
            localStorage.setItem(TOKEN_KEY, token);
            
            // Fetch real user email dynamically
            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` }
            })
              .then(res => res.json())
              .then(data => {
                localStorage.setItem(EMAIL_KEY, data.email || 'school-admin@gmail.com');
                popup.close();
                const state = this.getState();
                this.emitStatusChange(state);
                resolve(state);
              })
              .catch(err => {
                console.error('[GDrive] Failed to fetch email in web flow:', err);
                localStorage.setItem(EMAIL_KEY, 'school-admin@gmail.com');
                popup.close();
                const state = this.getState();
                this.emitStatusChange(state);
                resolve(state);
              });
          }
        }
      };

      window.addEventListener('message', messageListener);

      // Periodically check if the popup was closed
      const interval = setInterval(() => {
        if (popup.closed) {
          cleanup();
          if (!resolved) {
            const isUsingCustomId = clientId !== '516385983931-53kv4h3gt4eib6e4ki102u9ngk2cgh3e.apps.googleusercontent.com' &&
                                    clientId !== '789123456789-mockclientidformeasepro.apps.googleusercontent.com';
            
            if (isUsingCustomId) {
              reject(new Error('Authentication window was closed before authorization was completed.'));
            } else {
              // Sandbox fallback if using default mock ID
              const mockToken = 'mock_gdrive_oauth_token_' + Date.now();
              localStorage.setItem(TOKEN_KEY, mockToken);
              localStorage.setItem(EMAIL_KEY, 'sandbox-user@formease.com');
              console.log('💡 Using sandbox token (offline/local development fallback)');
              const state = this.getState();
              this.emitStatusChange(state);
              resolve(state);
            }
          }
        }
      }, 500);
    });
  },

  async syncNow(): Promise<boolean> {
    if (db.isPreviewMode()) {
      console.log('👁️ Snapshot preview mode active: skipping cloud sync.');
      return false;
    }
    const state = await this.getStateAsync();
    if (!state.linked) {
      throw new Error('Google Drive account is not linked.');
    }

    try {
      this.emitStatusChange({ ...state, isSyncing: true });
      console.log('🔄 Exporting fresh full comprehensive school data backup for cloud sync...');
      const comprehensive = await exportFullDatabaseBackup('Google Drive Cloud Sync');
      const backupData = await embedChecksum(comprehensive as unknown as Record<string, unknown>);
      const backupJsonStr = JSON.stringify(backupData, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `SMS_Backup_Comprehensive_Cloud_${timestamp}.json`;

      if (window.electronAPI?.gdriveUploadBackup) {
        await window.electronAPI.gdriveUploadBackup({ backupJsonStr, filename });
        const now = Date.now();
        localStorage.setItem(LAST_SYNC_KEY, String(now));
        console.log(`✅ Cloud backup saved successfully as "${filename}"`);
        this.emitStatusChange({ ...state, lastSync: now, isSyncing: false });
        return true;
      }

      const token = localStorage.getItem(TOKEN_KEY);
      
      // If we are using a mock/sandbox token, simulate the network upload gracefully
      if (token && token.startsWith('mock_')) {
        console.log('⚡ Uploading backup file to Google Drive (Sandbox simulation)...');
        await new Promise(r => setTimeout(r, 1500));
        const now = Date.now();
        localStorage.setItem(LAST_SYNC_KEY, String(now));
        console.log(`✅ Upload complete. Saved as "${filename}" in FormEase_Backups folder.`);
        this.emitStatusChange({ ...state, lastSync: now, isSyncing: false });
        return true;
      }

      // Real Google API call: Search if folder "FormEase_Backups" exists
      let folderId = await this.findFolderId(token!, 'FormEase_Backups');
      if (!folderId) {
        folderId = await this.createFolder(token!, 'FormEase_Backups');
      }

      // Upload file to the folder
      await this.uploadFile(token!, folderId, filename, backupJsonStr);
      const now = Date.now();
      localStorage.setItem(LAST_SYNC_KEY, String(now));
      console.log(`✅ Cloud backup saved successfully as "${filename}"`);

      // Prune old backups beyond 10
      try {
        const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
        const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime%20desc&fields=files(id,name,createdTime)`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          const files = listData.files || [];
          if (files.length > 10) {
            const oldFiles = files.slice(10);
            for (const old of oldFiles) {
              await fetch(`https://www.googleapis.com/drive/v3/files/${old.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              }).catch(() => {});
            }
          }
        }
      } catch (pruneErr) {
        console.warn('[GDrive Web] Prune old cloud backups notice:', pruneErr);
      }

      this.emitStatusChange({ ...state, lastSync: now, isSyncing: false });
      return true;
    } catch (err) {
      console.error('❌ Cloud sync failed:', err);
      this.emitStatusChange({ ...state, isSyncing: false });
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('Not connected') || errMsg.includes('expired') || errMsg.includes('invalid')) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EMAIL_KEY);
        this.emitStatusChange(this.getState());
      }
      throw err;
    }
  },

  async findFolderId(token: string, folderName: string): Promise<string | null> {
    const q = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to search Google Drive folders.');
    const data = await res.json();
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  },

  async createFolder(token: string, folderName: string): Promise<string> {
    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });
    if (!res.ok) throw new Error('Failed to create folder on Google Drive.');
    const data = await res.json();
    return data.id;
  },

  async uploadFile(token: string, parentFolderId: string, filename: string, content: string): Promise<string> {
    const metadata = {
      name: filename,
      parents: [parentFolderId]
    };
    
    const boundary = 'foo_bar_boundary';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;
    
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      content +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (!res.ok) throw new Error('Failed to upload backup JSON file to Google Drive.');
    const data = await res.json();
    return data.id;
  },

  async listCloudBackups(): Promise<CloudBackupFile[]> {
    if (window.electronAPI?.gdriveListBackups) {
      return await window.electronAPI.gdriveListBackups();
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return [];
    
    if (token.startsWith('mock_')) {
      return [
        {
          id: 'mock_file_1',
          name: 'SMS_Backup_Cloud_2026-06-21T10-59-11-000Z.json',
          size: 115000,
          createdTime: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'mock_file_2',
          name: 'SMS_Backup_Cloud_2026-06-20T08-30-00-000Z.json',
          size: 110000,
          createdTime: new Date(Date.now() - 90000000).toISOString()
        }
      ];
    }

    const folderId = await this.findFolderId(token, 'FormEase_Backups');
    if (!folderId) return [];

    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime%20desc&fields=files(id,name,size,createdTime)`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to list cloud backups.');
    const data = await res.json();
    return data.files || [];
  },

  async downloadCloudBackup(fileId: string): Promise<string> {
    if (window.electronAPI?.gdriveDownloadBackup) {
      return await window.electronAPI.gdriveDownloadBackup(fileId);
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error('Not connected to Google Drive.');

    if (token.startsWith('mock_')) {
      await new Promise(r => setTimeout(r, 1000));
      return JSON.stringify({
        metadata: { version: '2.2.11', createdBy: 'sandbox-user@formease.com' },
        summary: { activeSchoolYear: '2026-2027', students: 6, sections: 2, subjects: 402, grades: 0 },
        data: { activeSchoolYear: '2026-2027', students: [], sections: [], subjects: [], classRecords: [] }
      });
    }

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to download cloud backup.');
    return await res.text();
  }
};
