import { 
    collection, 
    query, 
    where, 
    onSnapshot, 
    addDoc, 
    Timestamp, 
    getDocs,
    limit 
} from 'firebase/firestore';
import { db as firestore } from '../lib/firebase';
import { db as localDb } from './database';
import type { Announcement } from '../types';

export interface CloudAnnouncement {
    id: string;
    announcement_title?: string;
    announcement_content?: string;
    announcement_date?: string;
    announcement_type?: string;
    is_pinned?: boolean;
    category?: string;
    author_id?: string;
    published_at?: Timestamp;
}

export const mapAnnouncementType = (type?: string): 'general' | 'urgent' | 'event' => {
    if (!type) return 'general';
    const normalized = type.toLowerCase();
    if (normalized === 'urgent' || normalized === 'emergency') return 'urgent';
    if (normalized === 'event') return 'event';
    return 'general';
};

const COLLECTION_NAME = 'shared_announcements';

export const announcementSync = {
    /**
     * Publish an announcement to the cloud for the entire school
     */
    async publishToCloud(announcement: Announcement, schoolId: string, authorId: string) {
        if (!schoolId) throw new Error('School ID is required for cloud sync');

        const cloudData = {
            ...announcement,
            school_id: schoolId,
            author_id: authorId,
            published_at: Timestamp.now(),
            is_cloud: true
        };

        return addDoc(collection(firestore, COLLECTION_NAME), cloudData);
    },

    /**
     * Delete an announcement from the cloud
     */
    async deleteFromCloud(cloudId: string) {
        if (!cloudId) return;
        const { doc, deleteDoc } = await import('firebase/firestore');
        const docRef = doc(firestore, COLLECTION_NAME, cloudId);
        return deleteDoc(docRef);
    },

    /**
     * Subscribe to real-time updates for a specific school
     * NOTE: No orderBy to avoid requiring a composite index.
     * Sorting is done client-side instead.
     */
    subscribeToSchool(schoolId: string, onUpdate: (announcements: CloudAnnouncement[]) => void) {
        if (!schoolId) return () => {};

        const q = query(
            collection(firestore, COLLECTION_NAME),
            where('school_id', '==', schoolId),
            limit(50)
        );

        return onSnapshot(q, (snapshot) => {
            const announcements = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort client-side by published_at descending
            announcements.sort((a: CloudAnnouncement, b: CloudAnnouncement) => {
                const aTime = a.published_at?.toMillis?.() || 0;
                const bTime = b.published_at?.toMillis?.() || 0;
                return bTime - aTime;
            });
            onUpdate(announcements);
        }, (error) => {
            console.error('Cloud sync listener error:', error);
        });
    },

    /**
     * One-time sync from cloud to local database
     * NOTE: No orderBy to avoid requiring a composite index.
     */
    async syncFromCloud(schoolId: string) {
        if (!schoolId) return;

        const q = query(
            collection(firestore, COLLECTION_NAME),
            where('school_id', '==', schoolId),
            limit(50)
        );

        const snapshot = await getDocs(q);
        const cloudAnnouncements = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as CloudAnnouncement[];

        // Sort client-side
        cloudAnnouncements.sort((a: CloudAnnouncement, b: CloudAnnouncement) => {
            const aTime = a.published_at?.toMillis?.() || 0;
            const bTime = b.published_at?.toMillis?.() || 0;
            return bTime - aTime;
        });

        // Merge with local IndexedDB
        for (const ann of cloudAnnouncements) {
            const localAnn: Announcement = {
                id: ann.id,
                announcement_title: ann.announcement_title || '',
                announcement_content: ann.announcement_content || '',
                announcement_date: ann.announcement_date || new Date().toISOString().split('T')[0],
                announcement_type: mapAnnouncementType(ann.announcement_type),
                is_pinned: ann.is_pinned || false,
                category: ann.category,
                author_id: ann.author_id,
            };
            await localDb.putRecord('announcements', localAnn);
        }

        return cloudAnnouncements;
    }
};
