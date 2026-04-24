import { create } from 'zustand';
import { useAuthStore } from './auth-store';
import { canManagePublicPosts } from '../lib/rbac';

interface SystemState {
    loginAnnouncement: string;
    isLoading: boolean;
    fetchSystemSettings: () => Promise<void>;
    updateLoginAnnouncement: (text: string) => Promise<void>;
}

export const useSystemStore = create<SystemState>((set) => ({
    loginAnnouncement: "Welcome to FormEase G7 Special. Please login with your credentials to continue.", // Default fallback
    isLoading: false,

    fetchSystemSettings: async () => {
        set({ isLoading: true });
        try {
            const saved = localStorage.getItem('system_login_announcement');
            if (saved && saved.trim()) {
                set({ loginAnnouncement: saved });
            }
        } catch (error) {
            console.error("Error fetching system settings:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    updateLoginAnnouncement: async (text: string) => {
        set({ isLoading: true });
        try {
            const user = useAuthStore.getState().user;
            if (!canManagePublicPosts(user)) {
                throw new Error('Access denied: you are not allowed to update login announcement.');
            }

            localStorage.setItem('system_login_announcement', text);
            set({ loginAnnouncement: text });
        } catch (error) {
            console.error("Error updating login announcement:", error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    }
}));
