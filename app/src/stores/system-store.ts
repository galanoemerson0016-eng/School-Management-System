import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SystemState {
    loginAnnouncement: string;
    isLoading: boolean;
    fetchSystemSettings: () => Promise<void>;
    updateLoginAnnouncement: (text: string) => Promise<void>;
}

export const useSystemStore = create<SystemState>((set) => ({
    loginAnnouncement: "Early Registration for SY 2026-2027: Jan 31 - Feb 27, 2026.", // Default fallback
    isLoading: false,

    fetchSystemSettings: async () => {
        set({ isLoading: true });
        try {
            const docRef = doc(db, "system_settings", "login_config");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.announcement) {
                    set({ loginAnnouncement: data.announcement });
                }
            } else {
                // Create default if not exists
                const defaultAnnouncement = "Early Registration for SY 2026-2027: Jan 31 - Feb 27, 2026.";
                await setDoc(docRef, { announcement: defaultAnnouncement });
                set({ loginAnnouncement: defaultAnnouncement });
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
            const docRef = doc(db, "system_settings", "login_config");
            await setDoc(docRef, { announcement: text }, { merge: true });
            set({ loginAnnouncement: text });
        } catch (error) {
            console.error("Error updating login announcement:", error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    }
}));
