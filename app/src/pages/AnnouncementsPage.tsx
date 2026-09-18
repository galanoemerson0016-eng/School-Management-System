import { useState, useMemo, type FormEvent, useEffect } from 'react';
import { useAppStore } from '../stores/app-store';
import { useSystemStore } from '../stores/system-store';
import { useAuthStore } from '../stores/auth-store';
import type { Announcement } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, PinOff, Trash2, Plus, Search, Cloud, CloudOff, RefreshCw, Globe, MessageSquare, Send, ChevronDown, ChevronUp, History, Users, Megaphone } from 'lucide-react';
import { canManagePublicPosts } from '../lib/rbac';
import { announcementSync, mapAnnouncementType, type CloudAnnouncement } from '../services/announcement-sync';
import { broadcastParentSms, type SmsBroadcastProgress } from '../services/sms-gateway';
import { formatLearnerName } from '../utils/student-name';

interface SmsBroadcastHistoryEntry {
    id: string;
    date: string;
    template: string;
    total: number;
    sent: number;
    failed: number;
    section: string;
}

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
    const [isLoginBannerOpen, setIsLoginBannerOpen] = useState(false);

    // Search and filter
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // SMS Broadcast History
    const [smsBroadcastHistory, setSmsBroadcastHistory] = useState<SmsBroadcastHistoryEntry[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('sms_broadcast_history') || '[]');
        } catch { return []; }
    });

    // Parent SMS Broadcast State
    const { students, sections } = useAppStore();
    const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
    const [smsTargetSection, setSmsTargetSection] = useState<string>('all');
    const [smsTemplate, setSmsTemplate] = useState<string>(
        'Notice: Classes at {school_name} are suspended today due to weather conditions. Stay safe!'
    );
    const [isSendingSms, setIsSendingSms] = useState(false);
    const [smsProgress, setSmsProgress] = useState<SmsBroadcastProgress | null>(null);
    const [smsPresetCategory, setSmsPresetCategory] = useState<string>('weather');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [studentSearchQuery, setStudentSearchQuery] = useState('');

    const handleSendSmsBroadcast = async (e: FormEvent) => {
        e.preventDefault();
        if (!smsTemplate.trim()) {
            showNotification('Please enter SMS announcement text', 'error');
            return;
        }

        // Filter target learners with parent phone numbers
        const targetStudents = students.filter(s => {
            if (smsTargetSection === 'specific') {
                if (!selectedStudentIds.has(s.lrn)) return false;
            } else if (smsTargetSection !== 'all' && s.student_section !== smsTargetSection && s.student_section !== sections.find(sec => sec.id === smsTargetSection)?.section_name) {
                return false;
            }
            const phone = s.parent_contact || s.parent_guardian_contact || s.contact_number;
            return !!phone && phone.trim().length >= 7;
        });

        if (targetStudents.length === 0) {
            showNotification('No learners found with parent contact numbers for selected audience', 'error');
            return;
        }

        const targets = targetStudents.map(s => ({
            studentName: formatLearnerName(s, { middleInitialOnly: true }),
            parentPhone: s.parent_contact || s.parent_guardian_contact || s.contact_number || '',
        }));

        setIsSendingSms(true);
        setSmsProgress({ total: targets.length, sent: 0, failed: 0, currentStudent: targets[0].studentName });

        try {
            const schoolName = schoolProfile?.name || 'Calibungan High School';
            const res = await broadcastParentSms(targets, smsTemplate, schoolName, (p) => setSmsProgress(p));
            showNotification(`📱 Broadcast Complete: ${res.sent} Parent SMS Sent (${res.failed} skipped)`, 'success');

            // Save to broadcast history
            const entry: SmsBroadcastHistoryEntry = {
                id: Date.now().toString(),
                date: new Date().toLocaleString(),
                template: smsTemplate.substring(0, 120) + (smsTemplate.length > 120 ? '...' : ''),
                total: targets.length,
                sent: res.sent,
                failed: res.failed,
                section: smsTargetSection === 'all' ? 'Entire School' : smsTargetSection === 'specific' ? `${selectedStudentIds.size} Selected` : smsTargetSection,
            };
            const updatedHistory = [entry, ...smsBroadcastHistory].slice(0, 10);
            setSmsBroadcastHistory(updatedHistory);
            localStorage.setItem('sms_broadcast_history', JSON.stringify(updatedHistory));

            setIsSmsModalOpen(false);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'SMS Broadcast failed';
            showNotification(errorMessage, 'error');
        } finally {
            setIsSendingSms(false);
            setSmsProgress(null);
        }
    };

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
                            announcement_title: ann.announcement_title || '',
                            announcement_content: ann.announcement_content || '',
                            announcement_date: ann.announcement_date || new Date().toISOString().split('T')[0],
                            announcement_type: mapAnnouncementType(ann.announcement_type),
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
                cloudAnns.forEach((ann: CloudAnnouncement) => {
                    const exists = announcements.find(a => a.id === ann.id);
                    if (!exists) {
                        const localAnn: Announcement = {
                            id: ann.id,
                            announcement_title: ann.announcement_title || '',
                            announcement_content: ann.announcement_content || '',
                            announcement_date: ann.announcement_date || new Date().toISOString().split('T')[0],
                            announcement_type: mapAnnouncementType(ann.announcement_type),
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
        general: 'border-l-deped-blue bg-blue-50 dark:bg-blue-950/30 dark:border-l-blue-500',
        urgent: 'border-l-deped-red bg-red-50 dark:bg-red-950/30 dark:border-l-red-500',
        event: 'border-l-deped-green bg-green-50 dark:bg-green-950/30 dark:border-l-green-500',
    };

    const typeBadges = {
        general: 'bg-deped-blue dark:bg-blue-600',
        urgent: 'bg-deped-red dark:bg-red-600',
        event: 'bg-green-600 dark:bg-green-600',
    };

    // Computed stats
    const parentsWithContact = useMemo(() => students.filter(s => {
        const phone = s.parent_contact || s.parent_guardian_contact || s.contact_number;
        return !!phone && phone.trim().length >= 7;
    }).length, [students]);

    return (
        <div className="space-y-5">

            {/* ===== Quick-Action Dashboard Cards ===== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* SMS Broadcast Center Card */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                    className="relative overflow-hidden bg-linear-to-br from-emerald-600 to-teal-600 dark:from-emerald-800 dark:to-teal-900 rounded-2xl shadow-lg p-4 text-white group"
                >
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                    <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/5 rounded-full" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-white/15 rounded-xl">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded-full">SMS</span>
                        </div>
                        <p className="text-2xl font-black">{parentsWithContact}</p>
                        <p className="text-[10px] font-bold text-white/70 mt-0.5">Parents with Contact Numbers</p>
                        {canManageAnnouncements && (
                            <button
                                onClick={() => setIsSmsModalOpen(true)}
                                className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                            >
                                <Send className="w-3 h-3" />
                                Send SMS Broadcast
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Announcements Card */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="relative overflow-hidden bg-linear-to-br from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-900 rounded-2xl shadow-lg p-4 text-white group"
                >
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                    <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/5 rounded-full" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-white/15 rounded-xl">
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded-full">{filteredAnnouncements.filter(a => a.announcement_type === 'urgent').length} Urgent</span>
                        </div>
                        <p className="text-2xl font-black">{announcements.length}</p>
                        <p className="text-[10px] font-bold text-white/70 mt-0.5">Total Announcements</p>
                        {canManageAnnouncements && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                            >
                                <Plus className="w-3 h-3" />
                                New Announcement
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Cloud Sync Status Card */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`relative overflow-hidden rounded-2xl shadow-lg p-4 text-white group ${
                        cloudSyncEnabled
                            ? 'bg-linear-to-br from-violet-600 to-purple-600 dark:from-violet-800 dark:to-purple-900'
                            : 'bg-linear-to-br from-slate-500 to-slate-600 dark:from-slate-700 dark:to-slate-800'
                    }`}
                >
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                    <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/5 rounded-full" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-white/15 rounded-xl">
                                {cloudSyncEnabled ? <Globe className="w-5 h-5 animate-pulse" /> : <CloudOff className="w-5 h-5" />}
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={cloudSyncEnabled} onChange={(e) => setCloudSyncEnabled(e.target.checked)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-white/30 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white/30" />
                            </label>
                        </div>
                        <p className="text-lg font-black">{cloudSyncEnabled ? 'Cloud Connected' : 'Offline Mode'}</p>
                        <p className="text-[10px] font-bold text-white/70 mt-0.5">
                            {cloudSyncEnabled ? `School ID: ${schoolProfile.school_id || 'Not Set'}` : 'Announcements saved locally'}
                        </p>
                        {cloudSyncEnabled && (
                            <button
                                onClick={handleManualSync}
                                disabled={isSyncing}
                                className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'Syncing...' : 'Sync Now'}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* ===== Collapsible Login Banner ===== */}
            <div className="bg-white dark:bg-[#0d1225] rounded-2xl shadow-xs border border-emerald-100 dark:border-emerald-500/20 overflow-hidden">
                <button
                    onClick={() => setIsLoginBannerOpen(!isLoginBannerOpen)}
                    className="w-full px-5 py-3 bg-linear-to-r from-emerald-600 to-green-500 dark:from-emerald-900 dark:to-green-900 text-white flex justify-between items-center cursor-pointer"
                >
                    <h3 className="text-xs font-bold flex items-center gap-2 uppercase tracking-wider">
                        📢 Login Page Banner
                    </h3>
                    <div className="flex items-center gap-2">
                        {!isLoginBannerOpen && loginAnnouncement && (
                            <span className="text-[10px] text-white/60 font-medium max-w-xs truncate hidden sm:inline">{loginAnnouncement.substring(0, 50)}...</span>
                        )}
                        {isLoginBannerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </button>
                <AnimatePresence>
                    {isLoginBannerOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4">
                                {isEditingLoginAnnouncement ? (
                                    <div className="space-y-3">
                                        <textarea
                                            value={loginAnnouncementText}
                                            onChange={(e) => setLoginAnnouncementText(e.target.value)}
                                            rows={2}
                                            className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-emerald-200 dark:border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-900 dark:text-white"
                                            placeholder="Enter the announcement for the login page..."
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => { setIsEditingLoginAnnouncement(false); setLoginAnnouncementText(loginAnnouncement); }}
                                                className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg text-gray-600 dark:text-slate-300 text-sm hover:bg-gray-50 dark:hover:bg-white/10 font-medium cursor-pointer"
                                                disabled={isSavingSystem}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdateLoginAnnouncement}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-xs cursor-pointer"
                                                disabled={isSavingSystem}
                                            >
                                                {isSavingSystem ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-gray-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/40 flex-1">
                                            {loginAnnouncement || <span className="text-gray-400 dark:text-emerald-500/60 italic">No active announcement set.</span>}
                                        </p>
                                        {canManageAnnouncements && (
                                            <button
                                                onClick={() => setIsEditingLoginAnnouncement(true)}
                                                className="text-xs bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-800/40 px-3 py-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 font-bold transition-colors cursor-pointer shrink-0"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ===== Compact Filter & Action Row ===== */}
            <div className="flex flex-wrap gap-3 items-center justify-between bg-white/70 dark:bg-[#0d1225]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-3 rounded-2xl shadow-2xs">
                <div className="flex flex-wrap gap-3 items-center flex-1">
                    <div className="relative flex-1 min-w-50 max-w-xs group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search announcements..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all"
                        />
                    </div>
                    <div className="flex gap-1.5">
                        {['all', 'general', 'urgent', 'event'].map(type => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all capitalize select-none cursor-pointer ${typeFilter === type
                                    ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'
                                    }`}
                            >
                                {type === 'all' ? 'All' : type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== Announcements List ===== */}
            <div className="bg-white dark:bg-[#0d1225] rounded-2xl shadow-xs border border-gray-100 dark:border-white/10 overflow-hidden">
                <div className="px-6 py-4 bg-linear-to-r from-deped-blue to-blue-600 dark:from-indigo-950 dark:to-blue-900 text-white">
                    <h3 className="font-bold">Announcements ({filteredAnnouncements.length})</h3>
                </div>
                {filteredAnnouncements.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/40 mb-4"
                        >
                            <Megaphone className="w-10 h-10 text-blue-400 dark:text-blue-500" />
                        </motion.div>
                        <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-1">No Announcements Yet</h4>
                        <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                            Post school announcements or send SMS alerts directly to parents — weather notices, PTC reminders, report cards, and more!
                        </p>
                        {canManageAnnouncements && (
                            <div className="flex flex-wrap justify-center gap-3">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-2 shadow-xs active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Announcement
                                </button>
                                <button
                                    onClick={() => setIsSmsModalOpen(true)}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-2 shadow-xs active:scale-95"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Send Parent SMS
                                </button>
                            </div>
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
                                    className={`p-4 border-l-4 rounded-xl ${typeStyles[announcement.announcement_type]} ${announcement.is_pinned ? 'ring-2 ring-amber-300 dark:ring-amber-500/50 ring-offset-1 dark:ring-offset-0' : ''}`}
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                {announcement.is_pinned && (
                                                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] rounded-full font-black uppercase flex items-center gap-1">
                                                        <Pin className="w-2.5 h-2.5" /> Pinned
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 ${typeBadges[announcement.announcement_type]} text-white text-[9px] rounded-full uppercase font-black`}>
                                                    {announcement.announcement_type}
                                                </span>
                                                {announcement.is_cloud && (
                                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[9px] rounded-full font-black uppercase flex items-center gap-1">
                                                        <Cloud className="w-2.5 h-2.5" /> Cloud
                                                    </span>
                                                )}
                                                {announcement.category && (
                                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-300 text-[9px] rounded-full font-bold">
                                                        {announcement.category}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-gray-400 dark:text-slate-400 font-bold">{announcement.announcement_date}</span>
                                            </div>
                                            <h4 className="text-base font-bold text-gray-800 dark:text-white">{announcement.announcement_title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">{announcement.announcement_content}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {canManageAnnouncements && (
                                                <>
                                                    <button
                                                        onClick={() => handleTogglePin(announcement)}
                                                        className={`p-2 rounded-lg transition-colors cursor-pointer ${announcement.is_pinned ? 'hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-500 dark:text-amber-400' : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-slate-400'}`}
                                                        title={announcement.is_pinned ? 'Unpin' : 'Pin'}
                                                    >
                                                        {announcement.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                                    </button>
                                                    {(!announcement.is_cloud || announcement.author_id === user?.uid) && (
                                                        <button
                                                            onClick={() => deleteAnnouncement(announcement.id)}
                                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
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

            {/* ===== SMS Broadcast History Log ===== */}
            {smsBroadcastHistory.length > 0 && (
                <div className="bg-white dark:bg-[#0d1225] rounded-2xl shadow-xs border border-gray-100 dark:border-white/10 overflow-hidden">
                    <div className="px-5 py-3 bg-linear-to-r from-emerald-600 to-teal-600 dark:from-emerald-900 dark:to-teal-900 text-white flex justify-between items-center">
                        <h3 className="text-xs font-bold flex items-center gap-2 uppercase tracking-wider">
                            <History className="w-4 h-4" />
                            Recent SMS Broadcasts
                        </h3>
                        <button
                            onClick={() => { setSmsBroadcastHistory([]); localStorage.removeItem('sms_broadcast_history'); }}
                            className="text-[9px] bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded-lg text-white font-bold transition-colors cursor-pointer"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {smsBroadcastHistory.slice(0, 5).map((entry) => (
                            <div key={entry.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl shrink-0">
                                    <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{entry.template}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-[9px] text-gray-400 dark:text-slate-500 font-medium">{entry.date}</span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold">
                                            <Users className="w-2.5 h-2.5 inline mr-0.5" />{entry.section}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{entry.sent}<span className="text-[9px] font-bold text-gray-400"> / {entry.total}</span></p>
                                    <p className="text-[9px] text-gray-400 dark:text-slate-500 font-medium">
                                        {entry.failed > 0 ? `${entry.failed} failed` : 'All delivered'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Announcement Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-[#0d1225] rounded-2xl shadow-2xl border dark:border-white/10 max-w-lg w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-deped-blue dark:bg-indigo-950 text-white px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-bold">New Announcement</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-white text-2xl hover:bg-white/20 rounded-lg p-1 cursor-pointer">×</button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Type</label>
                                        <select
                                            value={formData.announcement_type}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                announcement_type: e.target.value as Announcement['announcement_type']
                                            })}
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg outline-none"
                                        >
                                            <option value="general" className="dark:bg-[#0d1225]">General</option>
                                            <option value="urgent" className="dark:bg-[#0d1225]">Urgent</option>
                                            <option value="event" className="dark:bg-[#0d1225]">Event</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Category</label>
                                        <input
                                            type="text"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            placeholder="e.g., Academic, Sports"
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={formData.announcement_title}
                                        onChange={(e) => setFormData({ ...formData, announcement_title: e.target.value })}
                                        required
                                        placeholder="Enter announcement title"
                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Content *</label>
                                    <textarea
                                        value={formData.announcement_content}
                                        onChange={(e) => setFormData({ ...formData, announcement_content: e.target.value })}
                                        required
                                        rows={4}
                                        placeholder="Enter announcement content"
                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg outline-none"
                                    />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_pinned}
                                        onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-deped-blue focus:ring-deped-blue"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-1">
                                        <Pin className="w-3.5 h-3.5 text-amber-500" /> Pin this announcement
                                    </span>
                                </label>
                                <div className="flex justify-end space-x-3 pt-2">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer">
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-6 py-2 bg-deped-blue dark:bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-xs cursor-pointer">
                                        Publish
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Parent SMS Broadcast Center Modal — Redesigned */}
            <AnimatePresence>
                {isSmsModalOpen && (() => {
                    const SMS_CATEGORIES: Record<string, { icon: string; label: string; color: string; activeColor: string; templates: { label: string; msg: string }[] }> = {
                        weather: { icon: '🌧️', label: 'Weather', color: 'text-amber-600 dark:text-amber-400', activeColor: 'bg-amber-500 text-white', templates: [
                            { label: 'Suspension (Typhoon)', msg: 'Notice: Classes at {school_name} are SUSPENDED today due to Typhoon Signal. Stay safe and indoors!' },
                            { label: 'Suspension (Weather)', msg: 'Notice: Classes at {school_name} are suspended today due to weather conditions. Stay safe!' },
                            { label: 'Early Dismissal', msg: 'Notice: Due to worsening weather, {school_name} will dismiss all students early today at {time}. Please arrange pick-up.' },
                            { label: 'Earthquake Drill', msg: 'Reminder: {school_name} will conduct an Earthquake Drill on {date}. Please be guided accordingly.' },
                            { label: 'School Closure', msg: 'Notice: {school_name} is temporarily CLOSED until further notice due to an emergency. Updates will follow.' },
                            { label: 'Flooding Advisory', msg: 'Advisory: Classes at {school_name} are suspended due to flooding in the area. Ensure safety of your children.' },
                        ]},
                        ptc: { icon: '🏫', label: 'PTC', color: 'text-blue-600 dark:text-blue-400', activeColor: 'bg-blue-500 text-white', templates: [
                            { label: 'PTC Invitation', msg: 'Notice: Parent-Teacher Conference (PTC) for {student_name} will be held at {school_name} on {date}. Your presence is highly requested.' },
                            { label: 'PTC Reminder', msg: 'Reminder: The PTC for {student_name} at {school_name} is TOMORROW. Please attend to discuss your child\'s academic progress.' },
                            { label: 'PTC Schedule Change', msg: 'Notice: The PTC schedule for {student_name} at {school_name} has been MOVED to {date}. We apologize for the inconvenience.' },
                            { label: 'PTC Thank You', msg: 'Thank you for attending the PTC for {student_name} at {school_name}. Your involvement greatly supports your child\'s learning!' },
                        ]},
                        grades: { icon: '📝', label: 'Grades', color: 'text-emerald-600 dark:text-emerald-400', activeColor: 'bg-emerald-500 text-white', templates: [
                            { label: 'Report Card (Q1)', msg: 'Notice: The Q1 Report Card of {student_name} is now available at {school_name}. Please coordinate with the adviser.' },
                            { label: 'Report Card (Q2)', msg: 'Notice: The Q2 Report Card of {student_name} is now available at {school_name}. Please coordinate with the adviser.' },
                            { label: 'Report Card (Q3)', msg: 'Notice: The Q3 Report Card of {student_name} is now available at {school_name}. Please coordinate with the adviser.' },
                            { label: 'Report Card (Q4)', msg: 'Notice: The Q4/Final Report Card of {student_name} is now available at {school_name}. Please claim at the Registrar.' },
                            { label: 'Failing Warning', msg: 'Attention: {student_name} is at risk of failing subjects at {school_name}. Please schedule a meeting with the adviser immediately.' },
                            { label: 'Remedial Class', msg: 'Notice: {student_name} is enrolled in a Remedial Class at {school_name}. Classes start on {date}. Please ensure attendance.' },
                            { label: 'Grade Consultation', msg: 'Notice: Grade Consultation Day at {school_name} is on {date}. Parents of {student_name} may inquire about academic standing.' },
                        ]},
                        awards: { icon: '🏆', label: 'Awards', color: 'text-purple-600 dark:text-purple-400', activeColor: 'bg-purple-500 text-white', templates: [
                            { label: 'With Honors', msg: 'Congratulations! Your child {student_name} has achieved WITH HONORS at {school_name} for this Quarter! Keep up the great work!' },
                            { label: 'With High Honors', msg: 'Congratulations! Your child {student_name} has achieved WITH HIGH HONORS at {school_name} for this Quarter!' },
                            { label: 'Highest Honors', msg: 'Congratulations! Your child {student_name} has achieved WITH HIGHEST HONORS at {school_name} for this Quarter! Outstanding!' },
                            { label: 'Perfect Attendance', msg: 'Congratulations! {student_name} achieved PERFECT ATTENDANCE at {school_name} this Quarter. Thank you for your support!' },
                            { label: 'Best in Subject', msg: 'Congratulations! {student_name} was awarded BEST IN SUBJECT at {school_name} this Quarter. Well done!' },
                            { label: 'Leadership Award', msg: 'Congratulations! {student_name} received a LEADERSHIP AWARD at {school_name}. Keep inspiring others!' },
                        ]},
                        exams: { icon: '📚', label: 'Exams', color: 'text-cyan-600 dark:text-cyan-400', activeColor: 'bg-cyan-500 text-white', templates: [
                            { label: 'Periodical (Q1)', msg: 'Reminder: Q1 Periodical Examinations at {school_name} will start on {date}. Please ensure {student_name} reviews and prepares.' },
                            { label: 'Periodical (Q2)', msg: 'Reminder: Q2 Periodical Examinations at {school_name} will start on {date}. Please ensure {student_name} reviews.' },
                            { label: 'Periodical (Q3)', msg: 'Reminder: Q3 Periodical Examinations at {school_name} will start on {date}. Encourage your child to study.' },
                            { label: 'Final Exam', msg: 'Reminder: Final Examinations at {school_name} will start on {date}. Please ensure {student_name} is fully prepared.' },
                            { label: 'NAT / Achievement', msg: 'Reminder: The National Achievement Test (NAT) for {student_name} is on {date} at {school_name}. Please ensure attendance.' },
                            { label: 'Project Deadline', msg: 'Reminder: The deadline for project/activity submission of {student_name} at {school_name} is on {date}.' },
                            { label: 'Tutorial / Review', msg: 'Notice: Review/Tutorial sessions for {student_name} will be held at {school_name} starting {date}. Attendance is encouraged.' },
                        ]},
                        programs: { icon: '🗓️', label: 'Programs', color: 'text-sky-600 dark:text-sky-400', activeColor: 'bg-sky-500 text-white', templates: [
                            { label: 'School Event', msg: 'Reminder: {school_name} will hold an important school event on {date}. Please ensure {student_name}\'s attendance.' },
                            { label: 'Field Trip', msg: 'Reminder: The field trip for {student_name} from {school_name} is on {date}. Please sign the consent form and prepare the requirements.' },
                            { label: 'Intramurals', msg: 'Reminder: Intramurals / Sports Fest at {school_name} will be held on {date}. Students should wear PE uniforms.' },
                            { label: 'Foundation Day', msg: 'Reminder: {school_name} Foundation Day celebration is on {date}. All students are expected to attend!' },
                            { label: 'Nutrition Month', msg: 'Reminder: Nutrition Month activities at {school_name} will be held on {date}. Please prepare {student_name} accordingly.' },
                            { label: 'Science Month', msg: 'Reminder: Science and Math Month celebration at {school_name} is on {date}. Exciting activities await!' },
                            { label: 'Christmas Party', msg: 'Reminder: Christmas Party at {school_name} is scheduled on {date}. Students may bring exchange gifts and food for sharing.' },
                            { label: 'Year-End Program', msg: 'Notice: The Year-End Recognition Program at {school_name} is on {date}. Parents are invited to attend.' },
                        ]},
                        clearance: { icon: '⚠️', label: 'Clearance', color: 'text-rose-600 dark:text-rose-400', activeColor: 'bg-rose-500 text-white', templates: [
                            { label: 'Document Submission', msg: 'Reminder: Please submit required DepEd documents for {student_name} at {school_name} on or before {date}.' },
                            { label: 'Clearance', msg: 'Notice: {student_name} needs to complete school clearance at {school_name} before {date}. Please settle any requirements.' },
                            { label: 'Enrollment Req.', msg: 'Reminder: Please submit enrollment requirements for {student_name} at {school_name} before {date} to complete registration.' },
                            { label: 'School ID', msg: 'Notice: The School ID for {student_name} is ready for claiming at {school_name}. Please visit the registrar\'s office.' },
                            { label: 'Good Moral', msg: 'Notice: The Good Moral Certificate for {student_name} is available at {school_name}. Please claim at the guidance office.' },
                        ]},
                        graduation: { icon: '🎓', label: 'Graduation', color: 'text-indigo-600 dark:text-indigo-400', activeColor: 'bg-indigo-500 text-white', templates: [
                            { label: 'Moving Up', msg: 'Notice: The Moving Up Ceremony for {student_name} at {school_name} is scheduled on {date}. Parents are invited.' },
                            { label: 'Grad Rehearsal', msg: 'Notice: Graduation rehearsal for {student_name} is on {date} at {school_name}. Attendance is mandatory.' },
                            { label: 'Toga Fitting', msg: 'Reminder: Toga/Cap & Gown fitting for {student_name} at {school_name} is on {date}. Please attend on time.' },
                            { label: 'Graduation Day', msg: 'Notice: Graduation Day for {student_name} at {school_name} is on {date}. Congratulations and see you there!' },
                        ]},
                        attendance: { icon: '📋', label: 'Attendance', color: 'text-orange-600 dark:text-orange-400', activeColor: 'bg-orange-500 text-white', templates: [
                            { label: '3+ Day Absences', msg: 'Attention: {student_name} has been absent for 3+ consecutive days at {school_name}. Please contact the adviser immediately.' },
                            { label: 'Frequent Tardiness', msg: 'Notice: {student_name} has been frequently LATE at {school_name}. Please ensure your child arrives on time.' },
                            { label: 'Behavioral Concern', msg: 'Notice: {student_name} has a behavioral concern at {school_name}. Please schedule a meeting with the guidance counselor.' },
                            { label: 'Return to School', msg: 'Notice: {student_name} is cleared to return to school at {school_name} on {date}. Welcome back!' },
                            { label: 'Cutting Classes', msg: 'IMPORTANT: {student_name} was reported CUTTING CLASSES at {school_name} on {date}. Please address this matter urgently.' },
                        ]},
                        health: { icon: '🏥', label: 'Health', color: 'text-teal-600 dark:text-teal-400', activeColor: 'bg-teal-500 text-white', templates: [
                            { label: 'Medical Checkup', msg: 'Reminder: Medical/Dental checkup for {student_name} at {school_name} is on {date}. Please ensure attendance.' },
                            { label: 'Deworming Day', msg: 'Reminder: National Deworming Day at {school_name} is on {date}. Please send {student_name} with a signed consent.' },
                            { label: 'Vaccination', msg: 'Notice: Vaccination schedule for {student_name} at {school_name} is on {date}. Bring the immunization card.' },
                            { label: 'Health Advisory', msg: 'Advisory: There is a health concern in the area. Please monitor {student_name} for symptoms and contact {school_name} if needed.' },
                            { label: 'Feeding Program', msg: 'Notice: The School-Based Feeding Program (SBFP) for {student_name} at {school_name} starts on {date}.' },
                        ]},
                        general: { icon: '🔔', label: 'General', color: 'text-slate-600 dark:text-slate-400', activeColor: 'bg-slate-600 text-white', templates: [
                            { label: 'Uniform Reminder', msg: 'Reminder: Please ensure {student_name} wears the complete and proper school uniform at {school_name} every day.' },
                            { label: 'Bring Materials', msg: 'Reminder: {student_name} needs to bring the following materials to {school_name} on {date}. Please prepare accordingly.' },
                            { label: 'Half Day', msg: 'Notice: {school_name} will have HALF-DAY classes on {date}. Students will be dismissed at {time}.' },
                            { label: 'No Classes', msg: 'Reminder: NO CLASSES at {school_name} on {date} due to a national holiday. Enjoy the day with your family!' },
                            { label: 'Back to School', msg: 'Reminder: Classes at {school_name} will RESUME on {date}. Please prepare {student_name} for the new term!' },
                            { label: 'Custom Message', msg: 'Dear Parents, this is a message from {school_name} regarding {student_name}. ' },
                        ]},
                    };
                    const activeCategory = SMS_CATEGORIES[smsPresetCategory] || SMS_CATEGORIES.weather;
                    const charCount = smsTemplate.length;
                    const smsPages = Math.ceil(charCount / 160) || 1;

                    return (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                        onClick={() => !isSendingSms && setIsSmsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-[#0d1225] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-6 py-4 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/15 rounded-xl">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-wider">Parent SMS Broadcast</h3>
                                        <p className="text-[10px] text-white/60 font-medium">57 Templates • 11 Categories</p>
                                    </div>
                                </div>
                                {!isSendingSms && (
                                    <button onClick={() => setIsSmsModalOpen(false)} className="text-white/70 hover:text-white text-xl hover:bg-white/20 rounded-lg px-2.5 py-1 cursor-pointer transition-colors">×</button>
                                )}
                            </div>

                            <form onSubmit={handleSendSmsBroadcast} className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="p-5 space-y-4">

                                    {/* Target Audience — Compact Card */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg shrink-0">
                                                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Target Audience</label>
                                                <select
                                                    value={smsTargetSection}
                                                    onChange={(e) => { setSmsTargetSection(e.target.value); if (e.target.value !== 'specific') setSelectedStudentIds(new Set()); }}
                                                    disabled={isSendingSms}
                                                    className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                                                >
                                                    <option value="all" className="dark:bg-[#0d1225]">
                                                        🌐 Entire School ({students.filter(s => !!(s.parent_contact || s.parent_guardian_contact || s.contact_number)).length} Parents)
                                                    </option>
                                                    {sections.map(sec => {
                                                        const count = students.filter(s => (s.student_section === sec.section_name || s.student_section === sec.id) && !!(s.parent_contact || s.parent_guardian_contact || s.contact_number)).length;
                                                        return (
                                                            <option key={sec.id} value={sec.id} className="dark:bg-[#0d1225]">
                                                                🏫 {sec.section_name} ({count} Parents)
                                                            </option>
                                                        );
                                                    })}
                                                    <option value="specific" className="dark:bg-[#0d1225]">👤 Specific Students...</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Specific Student Picker */}
                                        {smsTargetSection === 'specific' && (
                                            <div className="rounded-xl border border-blue-200/60 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-950/20 overflow-hidden">
                                                <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-blue-200/40 dark:border-blue-800/20">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            value={studentSearchQuery}
                                                            onChange={(e) => setStudentSearchQuery(e.target.value)}
                                                            placeholder="Search student name..."
                                                            className="w-full pl-7 pr-2 py-1 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold text-slate-800 dark:text-white outline-none"
                                                        />
                                                    </div>
                                                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 shrink-0">
                                                        {selectedStudentIds.size} selected
                                                    </span>
                                                </div>
                                                <div className="max-h-36 overflow-y-auto custom-scrollbar">
                                                    {students
                                                        .filter(s => {
                                                            const phone = s.parent_contact || s.parent_guardian_contact || s.contact_number;
                                                            if (!phone || phone.trim().length < 7) return false;
                                                            if (studentSearchQuery) {
                                                                const q = studentSearchQuery.toLowerCase();
                                                                const name = formatLearnerName(s, { middleInitialOnly: true }).toLowerCase();
                                                                return name.includes(q);
                                                            }
                                                            return true;
                                                        })
                                                        .sort((a, b) => formatLearnerName(a, { middleInitialOnly: true }).localeCompare(formatLearnerName(b, { middleInitialOnly: true })))
                                                        .map(s => {
                                                            const name = formatLearnerName(s, { middleInitialOnly: true });
                                                            const isSelected = selectedStudentIds.has(s.lrn);
                                                            return (
                                                                <label
                                                                    key={s.lrn}
                                                                    className={`flex items-center gap-2.5 px-3 py-1.5 cursor-pointer transition-colors text-[10px] ${
                                                                        isSelected
                                                                            ? 'bg-blue-100/60 dark:bg-blue-900/30'
                                                                            : 'hover:bg-blue-100/30 dark:hover:bg-blue-900/20'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => {
                                                                            const next = new Set(selectedStudentIds);
                                                                            if (isSelected) next.delete(s.lrn); else next.add(s.lrn);
                                                                            setSelectedStudentIds(next);
                                                                        }}
                                                                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-white/20 text-blue-600 cursor-pointer"
                                                                    />
                                                                    <span className="font-bold text-slate-800 dark:text-white flex-1 truncate">{name}</span>
                                                                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium shrink-0">{s.student_section || '—'}</span>
                                                                </label>
                                                            );
                                                        })
                                                    }
                                                </div>
                                                {selectedStudentIds.size > 0 && (
                                                    <div className="px-3 py-1.5 border-t border-blue-200/40 dark:border-blue-800/20">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedStudentIds(new Set())}
                                                            className="text-[9px] font-bold text-red-500 hover:text-red-600 cursor-pointer"
                                                        >Clear selection</button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Category Tab Pills */}
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quick Templates</label>
                                        <div className="flex flex-wrap gap-1">
                                            {Object.entries(SMS_CATEGORIES).map(([key, cat]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setSmsPresetCategory(key)}
                                                    className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                                        smsPresetCategory === key
                                                            ? cat.activeColor + ' shadow-sm'
                                                            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                                                    }`}
                                                >
                                                    <span className="text-[10px]">{cat.icon}</span> {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Template Grid for Active Category */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                        {activeCategory.templates.map((t, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                disabled={isSendingSms}
                                                onClick={() => setSmsTemplate(t.msg)}
                                                className={`p-2 rounded-lg border text-left transition-all cursor-pointer group ${
                                                    smsTemplate === t.msg
                                                        ? 'border-emerald-400 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-400/50'
                                                        : 'border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                <p className={`text-[10px] font-bold leading-tight ${
                                                    smsTemplate === t.msg ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'
                                                }`}>
                                                    {t.label}
                                                </p>
                                                <p className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-2 leading-snug">{t.msg.substring(0, 60)}...</p>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Message Editor with Character Counter */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                SMS Message Content *
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-bold ${charCount > 320 ? 'text-red-500' : charCount > 160 ? 'text-amber-500' : 'text-slate-400'}`}>
                                                    {charCount} chars
                                                </span>
                                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                                                    smsPages === 1 ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                                    : smsPages === 2 ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                                                    : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                                                }`}>
                                                    {smsPages} SMS
                                                </span>
                                            </div>
                                        </div>
                                        <textarea
                                            rows={3}
                                            value={smsTemplate}
                                            onChange={(e) => setSmsTemplate(e.target.value)}
                                            disabled={isSendingSms}
                                            required
                                            placeholder="Write parent SMS announcement text..."
                                            className="w-full p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden leading-relaxed"
                                        />
                                        <div className="flex flex-wrap gap-1.5">
                                            {['{student_name}', '{school_name}', '{time}', '{date}'].map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => setSmsTemplate(prev => prev + ' ' + tag)}
                                                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono font-bold text-[9px] hover:bg-slate-200 dark:hover:bg-white/20 cursor-pointer transition-colors"
                                                >
                                                    + {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    {smsProgress && (
                                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 space-y-1.5">
                                            <div className="flex justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
                                                <span>Sending: {smsProgress.sent + smsProgress.failed} / {smsProgress.total}</span>
                                                <span>{Math.round(((smsProgress.sent + smsProgress.failed) / smsProgress.total) * 100)}%</span>
                                            </div>
                                            <div className="w-full h-2.5 bg-emerald-200 dark:bg-emerald-900/50 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${((smsProgress.sent + smsProgress.failed) / smsProgress.total) * 100}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                                                📱 Current: {smsProgress.currentStudent}
                                            </p>
                                        </div>
                                    )}

                                </div>

                                {/* Sticky Footer */}
                                <div className="sticky bottom-0 px-5 py-3 bg-white/95 dark:bg-[#0d1225]/95 backdrop-blur-md border-t border-slate-200/60 dark:border-white/10 flex justify-between items-center gap-3">
                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium hidden sm:block">
                                        Messages are sent via your configured SMS Gateway
                                    </p>
                                    <div className="flex gap-2 shrink-0 ml-auto">
                                        <button
                                            type="button"
                                            disabled={isSendingSms}
                                            onClick={() => setIsSmsModalOpen(false)}
                                            className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-white/10 cursor-pointer disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSendingSms}
                                            className="px-6 py-2 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 active:scale-95 transition-all"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            {isSendingSms ? 'Broadcasting...' : 'Send Broadcast'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
}
