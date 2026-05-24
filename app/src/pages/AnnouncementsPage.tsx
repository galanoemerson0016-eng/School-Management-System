import { useState, type FormEvent, useEffect } from 'react';
import { useAppStore, useSystemStore, useAuthStore } from '../stores';
import type { Announcement } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, PinOff, Trash2, Plus, Search, Cloud, CloudOff, RefreshCw, Globe } from 'lucide-react';
import { canManagePublicPosts } from '../lib/rbac';
import { announcementSync } from '../services/announcement-sync';

export function AnnouncementsPage() {
    const { 
        announcements, 
        addAnnouncement, 
        deleteAnnouncement,
        cloudSyncEnabled,
        setCloudSyncEnabled,
        schoolProfile,
        showNotification 
    } = useAppStore();
    const { loginAnnouncement, updateLoginAnnouncement, fetchSystemSettings } = useSystemStore();
    const { user } = useAuthStore();
    const canManageAnnouncements = canManagePublicPosts(user);

    // Login Announcement Local State
    const [loginAnnouncementText, setLoginAnnouncementText] = useState(loginAnnouncement);
    const [isEditingLoginAnnouncement, setIsEditingLoginAnnouncement] = useState(false);
    const [isSavingSystem, setIsSavingSystem] = useState(false);

    // Search and filter
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    useEffect(() => {
        fetchSystemSettings();
    }, [fetchSystemSettings]);

    useEffect(() => {
        setLoginAnnouncementText(loginAnnouncement);
    }, [loginAnnouncement]);

    // Cloud Sync Logic
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (cloudSyncEnabled && schoolProfile.school_id) {
            const unsubscribe = announcementSync.subscribeToSchool(schoolProfile.school_id, (cloudAnns) => {
                cloudAnns.forEach(async (ann) => {
                    const exists = announcements.find(a => a.id === ann.id);
                    if (!exists) {
                        const localAnn: Announcement = {
                            id: ann.id,
                            announcement_title: ann.announcement_title,
                            announcement_content: ann.announcement_content,
                            announcement_date: ann.announcement_date,
                            announcement_type: ann.announcement_type,
                            is_pinned: ann.is_pinned || false,
                            category: ann.category,
                            author_id: ann.author_id,
                            is_cloud: true,
                        };
                        await addAnnouncement(localAnn);
                    }
                });
            });
            return () => unsubscribe();
        }
    }, [cloudSyncEnabled, schoolProfile.school_id, announcements, addAnnouncement]);

    const handleManualSync = async () => {
        if (!schoolProfile.school_id) {
            showNotification('Please set your School ID in Institute Profile first', 'error');
            return;
        }
        setIsSyncing(true);
        try {
            const cloudAnns = await announcementSync.syncFromCloud(schoolProfile.school_id);
            if (cloudAnns && cloudAnns.length > 0) {
                // Update local store with newly synced announcements
                cloudAnns.forEach((ann: Announcement) => {
                    const exists = announcements.find(a => a.id === ann.id);
                    if (!exists) {
                        const localAnn: Announcement = {
                            id: ann.id,
                            announcement_title: ann.announcement_title,
                            announcement_content: ann.announcement_content,
                            announcement_date: ann.announcement_date,
                            announcement_type: ann.announcement_type,
                            is_pinned: ann.is_pinned || false,
                            category: ann.category,
                            author_id: ann.author_id,
                            is_cloud: true,
                        };
                        addAnnouncement(localAnn);
                    }
                });
            }
            showNotification('Cloud announcements synced', 'success');
        } catch (err) {
            console.error('Sync error:', err);
            showNotification(`Sync failed: ${(err as Error).message}`, 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleUpdateLoginAnnouncement = async () => {
        setIsSavingSystem(true);
        try {
            await updateLoginAnnouncement(loginAnnouncementText);
            setIsEditingLoginAnnouncement(false);
            alert("Login Page Announcement Updated Successfully!");
        } catch {
            alert("Failed to update login announcement.");
        } finally {
            setIsSavingSystem(false);
        }
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        announcement_title: '',
        announcement_content: '',
        announcement_type: 'general' as 'general' | 'urgent' | 'event',
        category: '',
        is_pinned: false,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const newAnnouncement: Announcement = {
            id: `announcement-${Date.now()}`,
            announcement_title: formData.announcement_title,
            announcement_content: formData.announcement_content,
            announcement_type: formData.announcement_type,
            announcement_date: new Date().toLocaleDateString('en-PH', {
                year: 'numeric', month: 'long', day: 'numeric'
            }),
            is_pinned: formData.is_pinned,
            category: formData.category || undefined,
            author_id: user?.uid, // Track current user as author
        };
        addAnnouncement(newAnnouncement);
        setFormData({ announcement_title: '', announcement_content: '', announcement_type: 'general', category: '', is_pinned: false });
        setIsModalOpen(false);
    };

    const handleTogglePin = (announcement: Announcement) => {
        // Update locally (since we don't have an updateAnnouncement function, we'll do delete + add)
        const updated: Announcement = { ...announcement, is_pinned: !announcement.is_pinned };
        deleteAnnouncement(announcement.id);
        addAnnouncement(updated);
    };

    // Filter and sort announcements
    const filteredAnnouncements = announcements
        .filter(a => {
            if (typeFilter !== 'all' && a.announcement_type !== typeFilter) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return a.announcement_title.toLowerCase().includes(q) ||
                    a.announcement_content.toLowerCase().includes(q);
            }
            return true;
        })
        .sort((a, b) => {
            // Pinned first
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return 0;
        });

    const typeStyles = {
        general: 'border-l-deped-blue bg-blue-50',
        urgent: 'border-l-deped-red bg-red-50',
        event: 'border-l-deped-green bg-green-50',
    };

    const typeBadges = {
        general: 'bg-deped-blue',
        urgent: 'bg-deped-red',
        event: 'bg-green-600',
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-4 justify-between items-center"
            >
                <div>
                    <h2 className="text-3xl font-extrabold text-deped-blue tracking-tight">Announcements</h2>
                    <p className="text-gray-500 font-medium mt-1">{announcements.length} total announcements</p>
                </div>
                {canManageAnnouncements && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-5 py-2.5 bg-deped-blue text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New Announcement
                    </button>
                )}
            </motion.div>

            {/* Login Page Announcement Editor */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
                <div className="px-6 py-4 bg-linear-to-r from-emerald-600 to-green-500 text-white flex justify-between items-center">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        📢 Login Page Banner
                    </h3>
                    {canManageAnnouncements && !isEditingLoginAnnouncement && (
                        <button
                            onClick={() => setIsEditingLoginAnnouncement(true)}
                            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-white font-bold transition-colors"
                        >
                            Edit
                        </button>
                    )}
                </div>
                <div className="p-5">
                    {isEditingLoginAnnouncement ? (
                        <div className="space-y-3">
                            <textarea
                                value={loginAnnouncementText}
                                onChange={(e) => setLoginAnnouncementText(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                                placeholder="Enter the announcement for the login page..."
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => { setIsEditingLoginAnnouncement(false); setLoginAnnouncementText(loginAnnouncement); }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 text-sm hover:bg-gray-50 font-medium"
                                    disabled={isSavingSystem}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateLoginAnnouncement}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm"
                                    disabled={isSavingSystem}
                                >
                                    {isSavingSystem ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                            {loginAnnouncement || <span className="text-gray-400 italic">No active announcement set.</span>}
                        </p>
                    )}
                </div>
            </div>

            {/* Cloud Sync Hub */}
            <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${cloudSyncEnabled ? 'border-blue-200' : 'border-gray-100'}`}>
                <div className={`px-6 py-3 flex justify-between items-center ${cloudSyncEnabled ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <div className="flex items-center gap-2">
                        {cloudSyncEnabled ? <Globe className="w-4 h-4 animate-pulse" /> : <CloudOff className="w-4 h-4" />}
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                            School-Wide Cloud Hub
                        </h3>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={cloudSyncEnabled}
                            onChange={(e) => setCloudSyncEnabled(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white/20"></div>
                    </label>
                </div>
                <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">
                            {cloudSyncEnabled ? 'Interconnected Mode Active' : 'Offline Mode Only'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {cloudSyncEnabled 
                                ? `Connected to School ID: ${schoolProfile.school_id || 'Not Set'}. Everyone in your school sees your posts.`
                                : 'Announcements are only saved on this computer.'}
                        </p>
                    </div>
                    {cloudSyncEnabled && (
                        <button
                            onClick={handleManualSync}
                            disabled={isSyncing}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync Now
                        </button>
                    )}
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search announcements..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-deped-blue/20 focus:border-deped-blue"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'general', 'urgent', 'event'].map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all capitalize ${typeFilter === type
                                ? 'bg-deped-blue text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {type === 'all' ? 'All' : type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Announcements List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-linear-to-r from-deped-blue to-blue-600 text-white">
                    <h3 className="font-bold">Announcements ({filteredAnnouncements.length})</h3>
                </div>
                {filteredAnnouncements.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-4">📢</div>
                        <p className="text-gray-500 font-medium">No announcements found</p>
                        {canManageAnnouncements && (
                            <button onClick={() => setIsModalOpen(true)} className="mt-4 px-4 py-2 bg-deped-blue text-white rounded-xl font-bold text-sm">
                                Create First Announcement
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        <AnimatePresence>
                            {filteredAnnouncements.map((announcement) => (
                                <motion.div
                                    key={announcement.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`p-4 border-l-4 rounded-xl ${typeStyles[announcement.announcement_type]} ${announcement.is_pinned ? 'ring-2 ring-amber-300 ring-offset-1' : ''}`}
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                {announcement.is_pinned && (
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] rounded-full font-black uppercase flex items-center gap-1">
                                                        <Pin className="w-2.5 h-2.5" /> Pinned
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 ${typeBadges[announcement.announcement_type]} text-white text-[9px] rounded-full uppercase font-black`}>
                                                    {announcement.announcement_type}
                                                </span>
                                                {announcement.is_cloud && (
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] rounded-full font-black uppercase flex items-center gap-1">
                                                        <Cloud className="w-2.5 h-2.5" /> Cloud
                                                    </span>
                                                )}
                                                {announcement.category && (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] rounded-full font-bold">
                                                        {announcement.category}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-gray-400 font-bold">{announcement.announcement_date}</span>
                                            </div>
                                            <h4 className="text-base font-bold text-gray-800">{announcement.announcement_title}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{announcement.announcement_content}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {canManageAnnouncements && (
                                                <>
                                                    <button
                                                        onClick={() => handleTogglePin(announcement)}
                                                        className={`p-2 rounded-lg transition-colors ${announcement.is_pinned ? 'hover:bg-amber-100 text-amber-500' : 'hover:bg-gray-100 text-gray-400'}`}
                                                        title={announcement.is_pinned ? 'Unpin' : 'Pin'}
                                                    >
                                                        {announcement.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                                    </button>
                                                    {(!announcement.is_cloud || announcement.author_id === user?.uid) && (
                                                        <button
                                                            onClick={() => deleteAnnouncement(announcement.id)}
                                                            className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Add Announcement Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-deped-blue text-white px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-bold">New Announcement</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-white text-2xl hover:bg-white/20 rounded-lg p-1">×</button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                        <select
                                            value={formData.announcement_type}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                announcement_type: e.target.value as Announcement['announcement_type']
                                            })}
                                            className="form-input text-sm"
                                        >
                                            <option value="general">General</option>
                                            <option value="urgent">Urgent</option>
                                            <option value="event">Event</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                        <input
                                            type="text"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            placeholder="e.g., Academic, Sports"
                                            className="form-input text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={formData.announcement_title}
                                        onChange={(e) => setFormData({ ...formData, announcement_title: e.target.value })}
                                        required
                                        placeholder="Enter announcement title"
                                        className="form-input text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Content *</label>
                                    <textarea
                                        value={formData.announcement_content}
                                        onChange={(e) => setFormData({ ...formData, announcement_content: e.target.value })}
                                        required
                                        rows={4}
                                        placeholder="Enter announcement content"
                                        className="form-input text-sm"
                                    />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_pinned}
                                        onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-deped-blue focus:ring-deped-blue"
                                    />
                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                        <Pin className="w-3.5 h-3.5 text-amber-500" /> Pin this announcement
                                    </span>
                                </label>
                                <div className="flex justify-end space-x-3 pt-2">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-6 py-2 bg-deped-blue text-white rounded-lg font-bold hover:bg-blue-700 shadow-md">
                                        Publish
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
