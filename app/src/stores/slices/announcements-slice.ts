import type { Announcement } from '../../types';
import { db } from '../../services/database';
import { announcementSync } from '../../services/announcement-sync';

export interface AnnouncementsSlice {
  announcements: Announcement[];
  setAnnouncements: (announcements: Announcement[]) => void;
  addAnnouncement: (announcement: Announcement) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  deleteAnnouncementFromCloud: (cloudId: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAnnouncementsSlice(set: (state: any) => void, get: () => any): AnnouncementsSlice {
  return {
    // ==================== ANNOUNCEMENTS ====================
    announcements: [],
    setAnnouncements: (announcements) => set({ announcements }),
    addAnnouncement: async (announcement) => {
      try {
        set((state: { announcements: Announcement[] }) => ({ announcements: [...state.announcements, announcement] }));
        await db.putRecord('announcements', announcement);
        get().showNotification('Announcement posted', 'success');

        const state = get();
        const authorId = (localStorage.getItem('auth_user_uid') as string | null) || 'anonymous';
        if (state.cloudSyncEnabled && state.schoolProfile.school_id && !announcement.is_cloud) {
          try {
            await announcementSync.publishToCloud(announcement, state.schoolProfile.school_id, authorId);
          } catch (err) {
            console.error('Failed to sync announcement to cloud:', err);
          }
        }
      } catch (error) {
        console.error('Error adding announcement:', error);
        get().showNotification('Failed to post announcement', 'error');
        set((state: { announcements: Announcement[] }) => ({ announcements: state.announcements.filter((a) => a.id !== announcement.id) }));
        throw error;
      }
    },
    deleteAnnouncement: async (id) => {
      const previousAnnouncements = get().announcements as Announcement[];
      const target = previousAnnouncements.find((a) => a.id === id);
      try {
        set((state: { announcements: Announcement[] }) => ({ announcements: state.announcements.filter((a) => a.id !== id) }));
        await db.deleteRecord('announcements', id);
        if (target && target.is_cloud && get().cloudSyncEnabled) {
          await announcementSync.deleteFromCloud(id);
        }
        get().showNotification('Announcement deleted', 'success');
      } catch (error) {
        console.error('Error deleting announcement:', error);
        set({ announcements: previousAnnouncements });
        get().showNotification('Failed to delete announcement', 'error');
        throw error;
      }
    },
    deleteAnnouncementFromCloud: async (cloudId) => {
      try {
        await announcementSync.deleteFromCloud(cloudId);
        set((state: { announcements: Announcement[] }) => ({ announcements: state.announcements.filter((a) => a.id !== cloudId) }));
        await db.deleteRecord('announcements', cloudId);
      } catch (err) {
        console.error('Cloud delete failed:', err);
        throw err;
      }
    },
  };
}
