/**
 * Auth Store (Offline-First Single User)
 * 
 * Simple authentication for single-user offline app.
 * Credentials stored locally - no cloud auth service.
 */

import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const DEFAULT_USER: User = {
  uid: 'local-user',
  email: 'teacher@school.local',
  displayName: 'Teacher',
  role: 'teacher',
  roles: ['teacher'],
};

/**
 * Get stored credentials from localStorage
 */
function getStoredCredentials(): { username: string; password: string } | null {
  try {
    const stored = localStorage.getItem('formease-credentials');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error retrieving credentials:', error);
  }
  return null;
}

/**
 * Store credentials in localStorage
 */
function storeCredentials(username: string, password: string): void {
  try {
    localStorage.setItem('formease-credentials', JSON.stringify({ username, password }));
  } catch (error) {
    console.error('Error storing credentials:', error);
  }
}

/**
 * Clear stored credentials
 */
function clearCredentials(): void {
  try {
    localStorage.removeItem('formease-credentials');
  } catch (error) {
    console.error('Error clearing credentials:', error);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      // Simple validation - in production, add proper password hashing
      if (!username || !password) {
        throw new Error('Username and password required');
      }

      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }

      // Store credentials for future sessions
      storeCredentials(username, password);

      // Create user object
      const user: User = {
        ...DEFAULT_USER,
        uid: `user-${username}`,
        displayName: username.charAt(0).toUpperCase() + username.slice(1),
        email: `${username}@school.local`,
      };

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      console.log('✅ Logged in as:', user.displayName);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({
        isLoading: false,
        error: message,
      });
      console.error('Login error:', error);
      return false;
    }
  },

  logout: async () => {
    try {
      clearCredentials();
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
      console.log('✅ Logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },
}));

/**
 * Check for saved credentials on app startup
 */
export async function initializeAuthStore() {
  try {
    const stored = getStoredCredentials();
    if (stored) {
      const { username, password } = stored;
      const success = await useAuthStore.getState().login(username, password);
      if (!success) {
        console.warn('⚠️  Saved credentials invalid - user must login again');
        clearCredentials();
      }
    } else {
      useAuthStore.setState({ isLoading: false });
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
    useAuthStore.setState({ isLoading: false });
  }
}
