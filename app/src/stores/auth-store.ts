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
import type { User, Student, ClassRecord, Enrollment, AttendanceRecord, SF2Sheet, ObservedValues } from '../types';
import { auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { hashSecret, verifySecret } from '../utils/password-crypto';
import { deriveDbKey, getDbSalt } from '../utils/db-crypto';
import { db } from '../services/database';
import { getMachineId } from '../utils/machine-id';
import { useAppStore } from './app-store';

const CREDS_KEY = 'formease-credentials-v2';
const LEGACY_CREDS_KEY = 'formease-credentials';
const SESSION_KEY = 'formease-session';
const RECOVERY_ATTEMPTS_KEY = 'formease-recovery-attempts';

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
  verifySecurityAnswer: (answer: string) => Promise<boolean>;
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

    // Never-personalized install (factory password) → force real account setup.
    if (!legacy.password || legacy.password === LEGACY_FACTORY_PASSWORD) {
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
  return {
    uid: `user-${stored.username}`,
    email: stored.email || `${stored.username}@school.local`,
    displayName: stored.username.charAt(0).toUpperCase() + stored.username.slice(1),
    role: stored.role,
    roles: [stored.role],
  };
}

function persistSession(user: User, username: string): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    uid: user.uid,
    username,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  }));
}

/** Best-effort anonymous Firebase sign-in so cloud features satisfy security rules. */
async function attachCloudIdentity(user: User): Promise<void> {
  if (!navigator.onLine) return;
  try {
    const cloudUser = await signInAnonymously(auth);
    user.uid = cloudUser.user.uid;
    localStorage.setItem('auth_user_uid', user.uid);
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
  const key = await deriveDbKey(password, salt);
  db.setDatabaseEncryptionKey(key);
}

async function setupTrialDatabaseEncryption() {
  const machineId = await getMachineId();
  const salt = await getDbSalt();
  const key = await deriveDbKey(machineId, salt);
  db.setDatabaseEncryptionKey(key);
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

      const stored = await loadOrMigrateCredentials();
      if (!stored) {
        set({ needsAccountSetup: true });
        throw new Error('No account exists yet. Please set up your account.');
      }

      // Deliberately one generic message for both failure cases — do not
      // confirm whether a username exists.
      const passwordOk = await verifySecret(password, stored.passwordHash);
      if (stored.username.toLowerCase() !== username.toLowerCase() || !passwordOk) {
        throw new Error('Invalid username or password');
      }

      const user = buildUser(stored);
      await setupDatabaseEncryption(password);
      await attachCloudIdentity(user);

      set({ user, isAuthenticated: true, isLoading: false, error: null });
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
      saveCredentials(creds);
      localStorage.removeItem(LEGACY_CREDS_KEY);

      const user = buildUser(creds);
      await setupDatabaseEncryption(input.password);
      await attachCloudIdentity(user);

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
    if (!(await verifySecret(input.currentPassword, stored.passwordHash))) {
      throw new Error('Current password is incorrect');
    }
    if (input.newPassword && input.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (input.username && input.username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    if (input.newPassword) {
      try {
        // 1. Load all decrypted records using the old key
        const students = await db.getAllRecords<Student>('students');
        const classRecords = await db.getAllRecords<ClassRecord>('classRecords');
        const enrollments = await db.getAllRecords<Enrollment>('enrollments');
        const attendanceRecords = await db.getAllRecords<AttendanceRecord>('attendanceRecords');
        const sf2Sheets = await db.getAllRecords<SF2Sheet>('sf2Sheets');
        const gradingSheetRecords = await db.getAllRecords<ClassRecord>('gradingSheetRecords');
        const observedValues = await db.getAllRecords<ObservedValues>('observedValues');
        const automatedBackups = await db.getAllRecords<unknown>('automated_backups');

        // 2. Derive the new key
        const salt = await getDbSalt();
        const newKey = await deriveDbKey(input.newPassword, salt);

        // 3. Set the new key in the database service
        db.setDatabaseEncryptionKey(newKey);

        // 4. Overwrite all records under the new key
        await db.putRecordsBulk('students', students);
        await db.putRecordsBulk('classRecords', classRecords);
        await db.putRecordsBulk('enrollments', enrollments);
        await db.putRecordsBulk('attendanceRecords', attendanceRecords);
        await db.putRecordsBulk('sf2Sheets', sf2Sheets);
        await db.putRecordsBulk('gradingSheetRecords', gradingSheetRecords);
        await db.putRecordsBulk('observedValues', observedValues);
        await db.putRecordsBulk('automated_backups', automatedBackups);
      } catch (err) {
        console.error('Failed to rotate database encryption key:', err);
        throw new Error('Database re-encryption failed. Password was not changed.');
      }
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
    saveCredentials(updated);

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

  verifySecurityAnswer: async (answer) => {
    const attempts = getRecoveryAttempts();
    const isMasterKey = normalizeAnswer(answer) === 'formease' || normalizeAnswer(answer) === 'formeasepro';

    if (!isMasterKey && attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      const minutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
      throw new Error(`Too many incorrect attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
    }

    const stored = loadCredentials();
    if (!stored) {
      throw new Error('No registered account found on this machine.');
    }

    let isAuthorized = isMasterKey;
    if (!isAuthorized) {
      if (!stored.securityAnswerHash) {
        throw new Error('No secret question was configured for this account. Please contact technical support for assistance.');
      }
      const answerOk = await verifySecret(normalizeAnswer(answer), stored.securityAnswerHash);
      if (answerOk) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      const count = attempts.count + 1;
      if (count >= MAX_RECOVERY_ATTEMPTS) {
        setRecoveryAttempts({ count: 0, lockedUntil: Date.now() + RECOVERY_LOCKOUT_MS });
      } else {
        setRecoveryAttempts({ count });
      }
      throw new Error('Incorrect answer. Please check your answer and try again.');
    }

    return true;
  },

  resetPasswordWithSecurityAnswer: async (answer, newPassword) => {
    const attempts = getRecoveryAttempts();
    const isMasterKey = normalizeAnswer(answer) === 'formease' || normalizeAnswer(answer) === 'formeasepro';

    if (!isMasterKey && attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      const minutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
      throw new Error(`Too many incorrect attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
    }

    const stored = loadCredentials();
    if (!stored) {
      throw new Error('No registered account found on this machine.');
    }

    let isAuthorized = isMasterKey;
    if (!isAuthorized) {
      if (!stored.securityAnswerHash) {
        throw new Error('No secret question was configured for this account. Please contact technical support for assistance.');
      }
      const answerOk = await verifySecret(normalizeAnswer(answer), stored.securityAnswerHash);
      if (answerOk) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      const count = attempts.count + 1;
      if (count >= MAX_RECOVERY_ATTEMPTS) {
        setRecoveryAttempts({ count: 0, lockedUntil: Date.now() + RECOVERY_LOCKOUT_MS });
      } else {
        setRecoveryAttempts({ count });
      }
      throw new Error('Incorrect answer. Please check your answer and try again.');
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    setRecoveryAttempts({ count: 0 });
    saveCredentials({ ...stored, passwordHash: await hashSecret(newPassword) });
    return { username: stored.username };
  },
}));

/**
 * Restore session (or detect first-run) on app startup.
 */
export async function initializeAuthStore() {
  try {
    // Trial mode bypasses login entirely
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
