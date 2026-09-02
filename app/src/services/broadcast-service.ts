import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SystemBroadcast {
  id: string;
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'urgent' | 'success';
  display_type: 'banner' | 'modal';
  action_label?: string;
  action_url?: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string | null;
  product?: string;
}

const DISMISSED_KEY = 'formease_dismissed_broadcasts';

export function getDismissedBroadcastIds(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function dismissBroadcast(id: string): void {
  try {
    const existing = getDismissedBroadcastIds();
    if (!existing.includes(id)) {
      existing.push(id);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(existing));
    }
  } catch (err) {
    console.error('Failed to save dismissed broadcast ID:', err);
  }
}

export const broadcastService = {
  /**
   * Fetch all currently active, non-expired broadcasts for FormEase Pro
   */
  async fetchActiveBroadcasts(): Promise<SystemBroadcast[]> {
    if (!navigator.onLine) return [];
    try {
      const q = query(
        collection(db, 'system_broadcasts'),
        where('is_active', '==', true)
      );

      const snapshot = await getDocs(q);
      const dismissed = getDismissedBroadcastIds();
      const now = Date.now();

      const items: SystemBroadcast[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;

        // Skip dismissed
        if (dismissed.includes(id)) return;

        // Check expiration
        if (data.expires_at) {
          const expTime = new Date(data.expires_at).getTime();
          if (expTime < now) return;
        }

        // Product filtering: accept 'all' or 'formease-pro'
        const prod = (data.product || 'formease-pro').toLowerCase();
        if (prod !== 'all' && prod !== 'formease-pro') return;

        items.push({
          id,
          title: data.title || '',
          content: data.content || '',
          severity: data.severity || 'info',
          display_type: data.display_type || 'banner',
          action_label: data.action_label || '',
          action_url: data.action_url || '',
          is_active: data.is_active !== false,
          created_at: data.created_at || new Date().toISOString(),
          expires_at: data.expires_at || null,
          product: data.product || 'formease-pro',
        });
      });

      // Sort newest first
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return items;
    } catch (err) {
      console.warn('Broadcast notice fetch skipped (offline or network notice):', err);
      return [];
    }
  },

  /**
   * Real-time subscription to active broadcasts
   */
  subscribeToBroadcasts(onUpdate: (broadcasts: SystemBroadcast[]) => void) {
    if (!navigator.onLine) return () => {};

    try {
      const q = query(
        collection(db, 'system_broadcasts'),
        where('is_active', '==', true)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const dismissed = getDismissedBroadcastIds();
          const now = Date.now();
          const items: SystemBroadcast[] = [];

          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;

            if (dismissed.includes(id)) return;
            if (data.expires_at) {
              const expTime = new Date(data.expires_at).getTime();
              if (expTime < now) return;
            }
            const prod = (data.product || 'formease-pro').toLowerCase();
            if (prod !== 'all' && prod !== 'formease-pro') return;

            items.push({
              id,
              title: data.title || '',
              content: data.content || '',
              severity: data.severity || 'info',
              display_type: data.display_type || 'banner',
              action_label: data.action_label || '',
              action_url: data.action_url || '',
              is_active: data.is_active !== false,
              created_at: data.created_at || new Date().toISOString(),
              expires_at: data.expires_at || null,
              product: data.product || 'formease-pro',
            });
          });

          items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          onUpdate(items);
        },
        (error) => {
          console.warn('Broadcast realtime listener notice:', error);
        }
      );
    } catch (err) {
      console.warn('Failed to initialize broadcast realtime listener:', err);
      return () => {};
    }
  },
};
