/**
 * Auth Store (Offline-First Single User)
 *
 * Credentials are stored locally with the password PBKDF2-hashed — never in
 * plaintext. There are NO factory-default credentials: a fresh install (or a
 * legacy install still on the old 'admin/formease' defaults) must create an
 * account on first run.
 *
 * Legacy migration: installs that personalized the old plaintext credential
 * record are migrated transparently — the plaintext password is hashed once
 * and the legacy record deleted.
 */

import { create } from 'zustand';
import type { User } from '../types';
import { auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { hashSecret, verifySecret } from '../utils/password-crypto';
import { deriveDbKey, exportDataEncryptionKey, generateDataEncryptionKey, getDataEncryptionKeyFingerprint, getDbSalt, importDataEncryptionKey, unwrapDataEncryptionKey, wrapDataEncryptionKey } from '../utils/db-crypto';
import { db, ENCRYPTED_STORE_NAMES } from '../services/database';
import { getMachineId } from '../utils/machine-id';
import { migrateLegacyEncryptedDatabase, prepareLegacyDekMigration, type WrappedDekMetadata } from '../utils/encryption-migration';

const CREDS_KEY = 'formease-credentials-v2';
const LEGACY_CREDS_KEY = 'formease-credentials';
const SESSION_KEY = 'formease-session';
const RECOVERY_ATTEMPTS_KEY = 'formease-recovery-attempts';
const DB_KEY_ENVELOPE_KEY = 'formease-db-key-envelope-v1';
const CREDENTIAL_TRANSACTION_KEY = 'formease-credential-key-transaction-v1';

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
const MIN_PASSWORD_LENGTH = 8;
const MAX_RECOVERY_ATTEMPTS = 5;
const RECOVERY_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// The old factory default password. Used ONLY to detect never-personalized
// legacy installs during migration — those must create a real account.
const LEGACY_FACTORY_PASSWORD = 'formease';

interface StoredAuthV2 {
  version: 2;
  username: string;
  passwordHash: string;
  email?: string;
  role: 'admin' | 'teacher';
  securityQuestion?: string;
  securityAnswerHash?: string;
}

interface LegacyStoredAuth {
  username?: string;
  password?: string;
  email?: string;
  role?: 'admin' | 'teacher';
  securityQuestion?: string;
  securityAnswer?: string;
}

export interface AccountSetupInput {
  username: string;
  password: string;
  email?: string;
  securityQuestion?: string;
  securityAnswer?: string;
}

export interface CredentialChangeInput {
  currentPassword: string;
  username?: string;
  newPassword?: string;
  email?: string;
  securityQuestion?: string;
  securityAnswer?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsAccountSetup: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  createAccount: (input: AccountSetupInput) => Promise<boolean>;
  changeCredentials: (input: CredentialChangeInput) => Promise<void>;
  getAccountInfo: () => { username: string; email?: string; securityQuestion?: string; hasRecovery: boolean } | null;
  getSecurityQuestion: () => string | null;
  resetPasswordWithSecurityAnswer: (answer: string, newPassword: string) => Promise<{ username: string }>;
}

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

function loadCredentials(): StoredAuthV2 | null {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthV2;
    if (!parsed.username || !parsed.passwordHash) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCredentials(creds: StoredAuthV2): void {
  localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
}

function loadWrappedDekMetadata(): WrappedDekMetadata | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(DB_KEY_ENVELOPE_KEY) || 'null') as WrappedDekMetadata | null;
    return parsed?.version === 1
      && parsed.encryptionSchemaVersion === 'dek-v1'
      && typeof parsed.state === 'string'
      && parsed.passwordWrappedDek
      && typeof parsed.dekFingerprint === 'string'
      ? parsed
      : null;
  } catch { return null; }
}

function saveWrappedDekMetadata(metadata: WrappedDekMetadata): void {
  localStorage.setItem(DB_KEY_ENVELOPE_KEY, JSON.stringify(metadata));
}

interface CredentialKeyTransaction {
  version: 1;
  previousCredentials: StoredAuthV2;
  nextCredentials: StoredAuthV2;
  previousMetadata: WrappedDekMetadata;
  nextMetadata: WrappedDekMetadata;
}

/** Complete or roll back a two-record localStorage credential update before login. */
function recoverCredentialKeyTransaction(stored: StoredAuthV2): StoredAuthV2 {
  try {
    const transaction = JSON.parse(localStorage.getItem(CREDENTIAL_TRANSACTION_KEY) || 'null') as CredentialKeyTransaction | null;
    if (!transaction || transaction.version !== 1) return stored;
    if (stored.passwordHash === transaction.nextCredentials.passwordHash) {
      saveWrappedDekMetadata(transaction.nextMetadata);
      localStorage.removeItem(CREDENTIAL_TRANSACTION_KEY);
      return transaction.nextCredentials;
    }
    if (stored.passwordHash === transaction.previousCredentials.passwordHash) {
      saveWrappedDekMetadata(transaction.previousMetadata);
      localStorage.removeItem(CREDENTIAL_TRANSACTION_KEY);
      return transaction.previousCredentials;
    }
    throw new Error('Credential update recovery could not determine a safe state.');
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Credential update recovery metadata is invalid.');
  }
}

function commitCredentialsAndWrapper(
  previousCredentials: StoredAuthV2,
  nextCredentials: StoredAuthV2,
  previousMetadata: WrappedDekMetadata,
  nextMetadata: WrappedDekMetadata,
): void {
  const transaction: CredentialKeyTransaction = {
    version: 1, previousCredentials, nextCredentials, previousMetadata, nextMetadata,
  };
  localStorage.setItem(CREDENTIAL_TRANSACTION_KEY, JSON.stringify(transaction));
  // Credential hash first means a restart deterministically finishes the new
  // wrapper; a pre-write crash deterministically restores the old wrapper.
  saveCredentials(nextCredentials);
  saveWrappedDekMetadata(nextMetadata);
  localStorage.removeItem(CREDENTIAL_TRANSACTION_KEY);
}

/**
 * Returns stored credentials, migrating a personalized legacy plaintext
 * record on first call. Returns null when no usable account exists (fresh
 * install, or legacy install still on factory defaults) — the caller must
 * route the user to account setup.
 */
async function loadOrMigrateCredentials(): Promise<StoredAuthV2 | null> {
  const existing = loadCredentials();
  if (existing) return existing;

  const legacyRaw = localStorage.getItem(LEGACY_CREDS_KEY);
  if (!legacyRaw) return null;

  try {
    const legacy = JSON.parse(legacyRaw) as LegacyStoredAuth;

    // Never preserve the former factory credential. It is public knowledge and
    // cannot safely authenticate an administrator. Treat these installs like a
    // fresh setup and require the owner to choose new credentials.
    if (!legacy.password || legacy.password.toLowerCase() === LEGACY_FACTORY_PASSWORD) {
      localStorage.removeItem(LEGACY_CREDS_KEY);
      return null;
    }

    const migrated: StoredAuthV2 = {
      version: 2,
      username: legacy.username || 'admin',
      passwordHash: await hashSecret(legacy.password),
      email: legacy.email,
      role: legacy.role === 'teacher' ? 'teacher' : 'admin',
      securityQuestion: legacy.securityQuestion,
      securityAnswerHash:
        legacy.securityAnswer && legacy.securityAnswer !== LEGACY_FACTORY_PASSWORD
          ? await hashSecret(normalizeAnswer(legacy.securityAnswer))
          : undefined,
    };
    saveCredentials(migrated);
    localStorage.removeItem(LEGACY_CREDS_KEY);
    console.log('🔐 Legacy credentials migrated to hashed storage');
    return migrated;
  } catch {
    localStorage.removeItem(LEGACY_CREDS_KEY);
    return null;
  }
}

function buildUser(stored: StoredAuthV2): User {
  const localUserId = `user-${stored.username}`;
  return {
    // Keep uid as the legacy local identifier for compatibility with existing
    // adviser assignments. Cloud authentication is stored separately.
    uid: localUserId,
    localUserId,
    email: stored.email || `${stored.username}@school.local`,
    displayName: stored.username.charAt(0).toUpperCase() + stored.username.slice(1),
    role: stored.role,
    roles: [stored.role],
  };
}

function persistSession(user: User, username: string): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    uid: user.localUserId || user.uid,
    username,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  }));
}

/** Best-effort anonymous Firebase sign-in so cloud features satisfy security rules. */
async function attachCloudIdentity(user: User): Promise<void> {
  if (!navigator.onLine) return;
  try {
    const cloudUser = await signInAnonymously(auth);
    user.cloudUid = cloudUser.user.uid;
    // Existing local data consumers read this key. Keep it bound to the
    // durable local identity rather than a transient anonymous Firebase UID.
    localStorage.setItem('auth_user_uid', user.localUserId || user.uid);
    localStorage.setItem('auth_cloud_uid', user.cloudUid);
  } catch (cloudErr) {
    console.warn('Cloud connection failed (Offline mode active):', cloudErr);
  }
}

interface RecoveryAttempts {
  count: number;
  lockedUntil?: number;
}

function getRecoveryAttempts(): RecoveryAttempts {
  try {
    return JSON.parse(localStorage.getItem(RECOVERY_ATTEMPTS_KEY) || '{"count":0}');
  } catch {
    return { count: 0 };
  }
}

function setRecoveryAttempts(attempts: RecoveryAttempts): void {
  localStorage.setItem(RECOVERY_ATTEMPTS_KEY, JSON.stringify(attempts));
}

async function setupDatabaseEncryption(password: string) {
  const salt = await getDbSalt();
  const passwordKek = await deriveDbKey(password, salt);
  const rawMetadata = localStorage.getItem(DB_KEY_ENVELOPE_KEY);
  const metadata = loadWrappedDekMetadata();
  if (rawMetadata && !metadata) {
    throw new Error('Database encryption migration metadata is invalid. Your local records were not changed.');
  }
  if (metadata) {
    const dek = await unwrapDataEncryptionKey(metadata.passwordWrappedDek, passwordKek);
    if (await getDataEncryptionKeyFingerprint(dek) !== metadata.dekFingerprint) {
      throw new Error('Database encryption metadata does not match this account. Your local records were not changed.');
    }
    // Trial sessions and older setups can use stable per-device keys or the
    // default emergency master password ('formease'). Keep all known same-profile
    // legacy keys as migration fallbacks until every store verifies under the new DEK;
    // never use them as the active record key.
    const fallbackKeys = await getMigrationFallbackKeys(salt);
    const sessionFallbackKeys = [passwordKek, ...fallbackKeys];
    if (metadata.state === 'migrated') {
      db.setDatabaseEncryptionKey(dek, sessionFallbackKeys, false);
      return;
    }
    await migrateLegacyEncryptedDatabase({
      database: db,
      stores: ENCRYPTED_STORE_NAMES,
      legacyKey: passwordKek,
      legacyFallbackKeys: fallbackKeys,
      dek,
      metadata,
      saveMetadata: saveWrappedDekMetadata,
    });
    db.setDatabaseEncryptionKey(dek, sessionFallbackKeys, false);
    return;
  }

  // Legacy v3.5.17 data is migrated only after the password has authenticated
  // and every encrypted store can still be read with the legacy key.
  const api = window.electronAPI;
  const recoveryAvailable = Boolean(await api?.recoveryProtectorAvailable?.());
  let dek: CryptoKey;
  let prepared: WrappedDekMetadata;
  try {
    ({ dek, metadata: prepared } = await prepareLegacyDekMigration({
      passwordKek,
      recoveryProtectorAvailable: recoveryAvailable,
      protectRecoveryDek: api?.protectRecoveryDek,
    }));
  } catch {
    throw new Error('Secure recovery protection could not be initialized. Your legacy local records were not changed.');
  }
  const fallbackKeys = await getMigrationFallbackKeys(salt);
  saveWrappedDekMetadata(prepared);
  await migrateLegacyEncryptedDatabase({
    database: db,
    stores: ENCRYPTED_STORE_NAMES,
    legacyKey: passwordKek,
    legacyFallbackKeys: fallbackKeys,
    dek,
    metadata: prepared,
    saveMetadata: saveWrappedDekMetadata,
  });
  db.setDatabaseEncryptionKey(dek, [passwordKek, ...fallbackKeys], false);
}

async function getMigrationFallbackKeys(salt: Uint8Array): Promise<CryptoKey[]> {
  const secrets = new Set<string>();

  // 1. Device machine ID (trial session key)
  try {
    const machineId = await getMachineId();
    if (machineId) secrets.add(machineId);
  } catch (e) {
    console.warn('Failed to retrieve machine ID for migration fallback:', e);
  }

  // 2. Browser ID fallback if different
  try {
    const browserId = localStorage.getItem('formease-browser-id');
    if (browserId) secrets.add(browserId);
  } catch {
    // Ignore environments where localStorage is restricted
  }

  // 3. Default / Emergency master passwords
  secrets.add('formease');
  secrets.add('Formease');
  secrets.add('FORMEASE');

  // 4. Remembered password / credentials if present
  try {
    const remembered = localStorage.getItem('formease-remember-password');
    if (remembered) secrets.add(remembered);
    const legacyCreds = localStorage.getItem('formease-credentials');
    if (legacyCreds) {
      const parsed = JSON.parse(legacyCreds);
      if (parsed.password) secrets.add(parsed.password);
    }
    const rememberedId = localStorage.getItem('formease-remember-id');
    if (rememberedId) secrets.add(rememberedId);
  } catch {
    // Ignore in non-browser environments
  }

  // 5. Common fallback admin passwords used in previous versions
  secrets.add('admin');
  secrets.add('Admin');
  secrets.add('ADMIN');

  return Promise.all(
    Array.from(secrets).map(secret => deriveDbKey(secret, salt))
  );
}

async function setupNewDatabaseEncryption(password: string): Promise<void> {
  const salt = await getDbSalt();
  const passwordKek = await deriveDbKey(password, salt);
  const dek = await generateDataEncryptionKey();
  const api = window.electronAPI;
  const recoveryAvailable = Boolean(await api?.recoveryProtectorAvailable?.());
  if (recoveryAvailable) {
    const protectedOk = await api?.protectRecoveryDek?.(await exportDataEncryptionKey(dek));
    if (!protectedOk) throw new Error('Secure recovery protection could not be initialized.');
  }
  const passwordWrappedDek = await wrapDataEncryptionKey(dek, passwordKek);
  // Verify before making the new architecture authoritative.
  await unwrapDataEncryptionKey(passwordWrappedDek, passwordKek);
  saveWrappedDekMetadata({
    version: 1,
    encryptionSchemaVersion: 'dek-v1',
    state: 'migrated',
    passwordWrappedDek,
    dekFingerprint: await getDataEncryptionKeyFingerprint(dek),
    recoveryProtector: recoveryAvailable ? 'electron-safe-storage-v1' : 'unavailable',
  });
  const fallbackKeys = await getMigrationFallbackKeys(salt);
  db.setDatabaseEncryptionKey(dek, [passwordKek, ...fallbackKeys], false);
}

async function setupTrialDatabaseEncryption() {
  const machineId = await getMachineId();
  const salt = await getDbSalt();
  const key = await deriveDbKey(machineId, salt);
  const emergencyKey = await deriveDbKey('formease', salt);
  db.setDatabaseEncryptionKey(key, [emergencyKey], false);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  needsAccountSetup: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      if (!username || !password) {
        throw new Error('Username and password required');
      }

      let stored = await loadOrMigrateCredentials();

      if (!stored) {
        set({ needsAccountSetup: true });
        throw new Error('No account exists yet. Please set up your account.');
      }
      stored = recoverCredentialKeyTransaction(stored);

      const passwordOk = await verifySecret(password, stored.passwordHash);
      const usernameMatch = stored.username.toLowerCase() === username.trim().toLowerCase();

      if (!usernameMatch || !passwordOk) {
        throw new Error('Invalid username or password');
      }

      const user = buildUser(stored);
      await setupDatabaseEncryption(password);
      await attachCloudIdentity(user);

      (await import('./app-store')).useAppStore.setState({ isSyncReady: false });
      set({ user, isAuthenticated: true, isLoading: false, needsAccountSetup: false, error: null });
      persistSession(user, stored.username);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  logout: async () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('formease-db-session-key');
    db.setDatabaseEncryptionKey(null);
    set({ user: null, isAuthenticated: false, error: null });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  createAccount: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const username = input.username.trim();
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      if (input.password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      }

      const hasRecovery = !!(input.securityQuestion?.trim() && input.securityAnswer?.trim());
      const creds: StoredAuthV2 = {
        version: 2,
        username,
        passwordHash: await hashSecret(input.password),
        email: input.email?.trim() || undefined,
        role: 'admin',
        securityQuestion: hasRecovery ? input.securityQuestion!.trim() : undefined,
        securityAnswerHash: hasRecovery ? await hashSecret(normalizeAnswer(input.securityAnswer!)) : undefined,
      };
      const user = buildUser(creds);
      await setupNewDatabaseEncryption(input.password);
      // The DEK architecture is established before credentials become usable.
      // If setup is interrupted, no account is authenticated against a partial key setup.
      saveCredentials(creds);
      localStorage.removeItem(LEGACY_CREDS_KEY);
      await attachCloudIdentity(user);

      (await import('./app-store')).useAppStore.setState({ isSyncReady: false });
      set({ user, isAuthenticated: true, isLoading: false, needsAccountSetup: false, error: null });
      persistSession(user, creds.username);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Account setup failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  changeCredentials: async (input) => {
    const stored = loadCredentials();
    if (!stored) {
      throw new Error('No account found');
    }
    const currentPasswordOk = await verifySecret(input.currentPassword, stored.passwordHash);
    if (!currentPasswordOk) {
      throw new Error('Current password is incorrect');
    }
    if (input.newPassword && input.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (input.username && input.username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    const updated: StoredAuthV2 = {
      ...stored,
      username: input.username?.trim() || stored.username,
      passwordHash: input.newPassword ? await hashSecret(input.newPassword) : stored.passwordHash,
      email: input.email?.trim() || stored.email,
      securityQuestion: input.securityQuestion?.trim() || stored.securityQuestion,
      securityAnswerHash: input.securityAnswer?.trim()
        ? await hashSecret(normalizeAnswer(input.securityAnswer))
        : stored.securityAnswerHash,
    };
    if (input.newPassword) {
      try {
        // Any legacy account is first brought through the verified migration.
        // Password change then only replaces the DEK wrapper, never record ciphertext.
        await setupDatabaseEncryption(input.currentPassword);
        const metadata = loadWrappedDekMetadata();
        if (!metadata || metadata.state !== 'migrated') {
          throw new Error('Database encryption migration did not complete.');
        }
        const salt = await getDbSalt();
        const currentKek = await deriveDbKey(input.currentPassword, salt);
        const dek = await unwrapDataEncryptionKey(metadata.passwordWrappedDek, currentKek);
        if (await getDataEncryptionKeyFingerprint(dek) !== metadata.dekFingerprint) {
          throw new Error('Database encryption metadata does not match this account.');
        }
        const newKek = await deriveDbKey(input.newPassword, salt);
        const passwordWrappedDek = await wrapDataEncryptionKey(dek, newKek);
        await unwrapDataEncryptionKey(passwordWrappedDek, newKek);
        const nextMetadata = { ...metadata, passwordWrappedDek };
        commitCredentialsAndWrapper(stored, updated, metadata, nextMetadata);
        const fallbackKeys = await getMigrationFallbackKeys(salt);
        db.setDatabaseEncryptionKey(dek, [newKek, ...fallbackKeys], false);
      } catch (err) {
        console.error('Failed to update database encryption wrapper:', err);
        throw new Error('Password was not changed because encrypted local data could not be verified.');
      }
    } else {
      saveCredentials(updated);
    }

    const user = get().user;
    if (user) {
      set({
        user: {
          ...user,
          displayName: updated.username.charAt(0).toUpperCase() + updated.username.slice(1),
          email: updated.email || user.email,
        },
      });
      persistSession({ ...user }, updated.username);
    }
  },

  getAccountInfo: () => {
    const stored = loadCredentials();
    if (!stored) return null;
    return {
      username: stored.username,
      email: stored.email,
      securityQuestion: stored.securityQuestion,
      hasRecovery: !!stored.securityAnswerHash,
    };
  },

  getSecurityQuestion: () => {
    return loadCredentials()?.securityQuestion ?? null;
  },

  resetPasswordWithSecurityAnswer: async (answer, newPassword) => {
    const attempts = getRecoveryAttempts();
    if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      const minutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
      throw new Error(`Too many incorrect attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
    }

    const stored = loadCredentials();
    if (!stored || !stored.securityAnswerHash) {
      throw new Error('Password recovery is not set up for this account.');
    }

    const answerOk = await verifySecret(normalizeAnswer(answer), stored.securityAnswerHash);
    if (!answerOk) {
      const count = attempts.count + 1;
      if (count >= MAX_RECOVERY_ATTEMPTS) {
        setRecoveryAttempts({ count: 0, lockedUntil: Date.now() + RECOVERY_LOCKOUT_MS });
      } else {
        setRecoveryAttempts({ count });
      }
      throw new Error('Incorrect answer. Please try again.');
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    const metadata = loadWrappedDekMetadata();
    if (!metadata || metadata.recoveryProtector !== 'electron-safe-storage-v1') {
      throw new Error('Password recovery cannot safely unlock this encrypted local data. Sign in with the current password or restore a verified backup.');
    }
    const rawDek = await window.electronAPI?.recoverProtectedDek?.();
    if (!rawDek || rawDek === 'DECRYPTION_FAILED') {
      throw new Error('Password recovery is unavailable for this device profile. Sign in with the current password or restore a verified backup.');
    }
    const salt = await getDbSalt();
    let dek: CryptoKey;
    try {
      dek = await importDataEncryptionKey(rawDek);
    } catch {
      throw new Error('Password recovery is unavailable for this device profile. Sign in with the current password or restore a verified backup.');
    }
    if (await getDataEncryptionKeyFingerprint(dek) !== metadata.dekFingerprint) {
      throw new Error('Password recovery is unavailable for this device profile. Sign in with the current password or restore a verified backup.');
    }
    const newKek = await deriveDbKey(newPassword, salt);
    const passwordWrappedDek = await wrapDataEncryptionKey(dek, newKek);
    await unwrapDataEncryptionKey(passwordWrappedDek, newKek);

    // A journal makes the two localStorage records restart-safe: login can
    // complete the exact old or new pair and never mixes a password hash with
    // the wrong DEK wrapper.
    commitCredentialsAndWrapper(
      stored,
      { ...stored, passwordHash: await hashSecret(newPassword) },
      metadata,
      { ...metadata, passwordWrappedDek },
    );
    const fallbackKeys = await getMigrationFallbackKeys(salt);
    db.setDatabaseEncryptionKey(dek, [newKek, ...fallbackKeys], false);
    setRecoveryAttempts({ count: 0 });
    return { username: stored.username };
  },
}));

/**
 * Restore session (or detect first-run) on app startup.
 */
export async function initializeAuthStore() {
  try {
    // Trial mode bypasses login entirely
    const { useAppStore } = await import('./app-store');
    const profile = useAppStore.getState().schoolProfile;
    if (profile && profile.is_activated && profile.is_trial) {
      await setupTrialDatabaseEncryption();
      const user: User = {
        uid: 'trial-user',
        email: 'trial@school.local',
        displayName: 'Trial User',
        role: 'admin',
        roles: ['admin'],
      };
      await attachCloudIdentity(user);
      useAppStore.setState({ isSyncReady: false });
      useAuthStore.setState({ user, isAuthenticated: true, isLoading: false });
      return;
    }

    const stored = await loadOrMigrateCredentials();
    if (!stored) {
      useAuthStore.setState({ isLoading: false, needsAccountSetup: true });
      return;
    }

    // DB key is not persisted across restarts (safeStorage migration removed the
    // session key from sessionStorage). Clear any stale session token so the
    // user is always prompted to re-authenticate on launch.
    localStorage.removeItem(SESSION_KEY);

    useAuthStore.setState({ isLoading: false });
  } catch (error) {
    console.error('Session restoration failed:', error);
    useAuthStore.setState({ isLoading: false });
  }
}
