/**
 * Auth Store (Offline-First Single User)
 * 
 * Simple authentication for single-user offline app.
 * Credentials stored locally - no cloud auth service.
 */

import { create } from 'zustand';
import type { User } from '../types';
import { auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';

interface StoredAuth {
  username: string;
  password: string;
  email?: string;
  role: 'admin' | 'teacher';
  securityQuestion?: string;
  securityAnswer?: string;
}

const DEFAULT_CREDENTIALS: StoredAuth = {
  username: 'admin',
  password: 'formease',
  email: 'admin@school.local',
  role: 'admin',
  securityQuestion: 'What is the name of this software?',
  securityAnswer: 'formease'
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateCredentials: (newCreds: Partial<StoredAuth>) => void;
  recoverCredentials: (answer: string) => StoredAuth | null;
  getSecurityQuestion: () => string;
}

const DEFAULT_USER: User = {
  uid: 'local-user',
  email: 'admin@school.local',
  displayName: 'Administrator',
  role: 'admin',
  roles: ['admin'],
};

/**
 * Get stored credentials from localStorage with factory fallback
 */
function getStoredCredentials(): StoredAuth {
  try {
    const stored = localStorage.getItem('formease-credentials');
    if (stored) {
      return { ...DEFAULT_CREDENTIALS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error retrieving credentials:', error);
  }
  return DEFAULT_CREDENTIALS;
}

/**
 * Store credentials in localStorage
 */
function storeCredentials(creds: StoredAuth): void {
  try {
    localStorage.setItem('formease-credentials', JSON.stringify(creds));
  } catch (error) {
    console.error('Error storing credentials:', error);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      if (!username || !password) {
        throw new Error('Username and password required');
      }

      const stored = getStoredCredentials();
      
      if (stored.username.toLowerCase() !== username.toLowerCase()) {
        throw new Error('Invalid Username');
      }
      if (stored.password !== password) {
        throw new Error('Invalid Password');
      }

      // Create user object
      const user: User = {
        ...DEFAULT_USER,
        uid: `user-${username}`,
        displayName: username.charAt(0).toUpperCase() + username.slice(1),
        email: stored.email || `${username}@school.local`,
        role: stored.role || (username.toLowerCase() === 'admin' ? 'admin' : 'teacher')
      };

      // CLOUD AUTH: Sign in anonymously to satisfy Firebase Security Rules
      try {
        const cloudUser = await signInAnonymously(auth);
        user.uid = cloudUser.user.uid; // Use real Firebase UID
        localStorage.setItem('auth_user_uid', user.uid); // Save for other stores
      } catch (cloudErr) {
        console.warn('Cloud connection failed (Offline mode active):', cloudErr);
      }

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // PERSIST SESSION
      localStorage.setItem('formease-session', JSON.stringify({
        uid: user.uid,
        username: username,
        timestamp: Date.now()
      }));

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({
        isLoading: false,
        error: message,
      });
      return false;
    }
  },

  logout: async () => {
    localStorage.removeItem('formease-session');
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  updateCredentials: (newCreds) => {
    const current = getStoredCredentials();
    const updated = { ...current, ...newCreds };
    storeCredentials(updated);
    
    // Update local state if logged in
    const user = get().user;
    if (user) {
      set({ 
        user: { 
          ...user, 
          displayName: updated.username.charAt(0).toUpperCase() + updated.username.slice(1),
          email: updated.email || user.email,
          role: updated.role || user.role
        } 
      });
    }
  },

  getSecurityQuestion: () => {
    return getStoredCredentials().securityQuestion || DEFAULT_CREDENTIALS.securityQuestion!;
  },

  recoverCredentials: (answer) => {
    const stored = getStoredCredentials();
    if (stored.securityAnswer?.toLowerCase() === answer.toLowerCase().trim()) {
      return stored;
    }
    return null;
  }
}));

/**
 * Check for saved credentials on app startup
 */
export async function initializeAuthStore() {
  try {
    const sessionRaw = localStorage.getItem('formease-session');
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      const stored = getStoredCredentials();
      
      // Auto-login if session matches stored credentials
      if (session.username && stored.username.toLowerCase() === session.username.toLowerCase()) {
        const user: User = {
          ...DEFAULT_USER,
          uid: session.uid || `user-${session.username}`,
          displayName: session.username.charAt(0).toUpperCase() + session.username.slice(1),
          email: stored.email || `${session.username}@school.local`,
          role: stored.role || (session.username.toLowerCase() === 'admin' ? 'admin' : 'teacher')
        };

        // CLOUD AUTH: Restore Firebase session
        try {
          const cloudUser = await signInAnonymously(auth);
          user.uid = cloudUser.user.uid;
          localStorage.setItem('auth_user_uid', user.uid);
        } catch (cloudErr) {
          console.warn('Cloud session restoration failed:', cloudErr);
        }

        useAuthStore.setState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
        return;
      }
    }
    
    useAuthStore.setState({ isLoading: false });
  } catch (error) {
    console.error('Session restoration failed:', error);
    useAuthStore.setState({ isLoading: false });
  }
}
