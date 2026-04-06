import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { User, UserRole } from '../types';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    setUser: (user: User | null) => void;
}

// Helper to convert username to email
const DOMAIN = 'chs.307014'; // Configured domain
const toEmail = (username: string) => {
    if (username.includes('@')) return username; // Allow actual emails too
    return `${username}@${DOMAIN}`;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true, // Start loading to wait for auth check
    isAuthenticated: false,
    error: null,

    login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
            const email = toEmail(username);
            await signInWithEmailAndPassword(auth, email, password);
            // Listener will handle state update
            return true;
        } catch (error: any) {
            console.error("Login failed:", error);
            let message = "Login failed";
            if (error.code === 'auth/invalid-credential') message = "Invalid username or password";
            if (error.code === 'auth/too-many-requests') message = "Too many failed attempts. Try again later.";

            set({ isLoading: false, error: message });
            return false;
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
            set({ user: null, isAuthenticated: false });
        } catch (error) {
            console.error("Logout failed:", error);
        }
    },

    setUser: (user) => {
        set({ user, isAuthenticated: !!user, isLoading: false });
    },
}));

// Initialize Firebase Auth Listener
onAuthStateChanged(auth, async (firebaseUser) => {
    const store = useAuthStore.getState();

    if (firebaseUser) {
        let role: UserRole = 'teacher'; // Default role
        let isValidUser = false; // Must exist in Firestore (unless admin superuser)

        // Auto-assign admin if username starts with admin (Backdoor/Bootstrap)
        if (firebaseUser.email?.startsWith('admin')) {
            role = 'admin';
            isValidUser = true;
        }

        let userData: any = null; // Store fetched data
        try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
                userData = userDoc.data();
                if (userData.role) role = userData.role as UserRole;
                isValidUser = true;
            }
        } catch (e) {
            console.error("Failed to fetch user role", e);
        }

        if (!isValidUser) {
            console.warn("User authenticated but not found in database. Logging out.");
            await signOut(auth);
            store.setUser(null);
            return;
        }

        const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            // Prioritize Firestore displayName, then Auth displayName, then Email logic
            displayName: (userData?.displayName) || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: role,
        };
        store.setUser(user);
    } else {
        store.setUser(null);
    }
});
