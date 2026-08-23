import { useState, useEffect, useCallback } from 'react';
import { useAppStore, useAuthStore } from '../../stores';
import { Bell, X, Database, HelpCircle, Cloud, CloudUpload, Loader2, ChevronDown, HardDriveDownload } from 'lucide-react';
import { UpdateStatus } from '../ui/UpdateStatus';
import { CloudSyncService } from '../../services/cloud-sync';
import { createComprehensiveBackup, validateBackup } from '../../utils/backup-restore';

const viewTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    students: 'Student Information',
    institute: 'Institute Profile',
    subjects: 'Subjects',
    sections: 'Classes & Sections',
    enrollment: 'Enrollment Center',
    eclass: 'E-Class Record',
    'class-record': 'E-Class Record',
    sf9: 'SF9 Report Card',
    sf10: 'SF10 Learner Permanent Record',
    sf5: 'SF5 Report on Promotion',
    sf6: 'SF6 Summarized Promotion Report',
    sf8: 'SF8 Health & Nutrition Report',
    attendance: 'SF2 Daily Attendance',
    'daily-attendance': 'Daily Attendance',
    'school-forms': 'Official School Forms Hub',
    calendar: 'Calendar & Announcements',
    announcements: 'Calendar & Announcements',
    reports: 'Reports & Analytics',
    'consolidated-grades': 'Consolidated Grades',
    users: 'User Management',
    settings: 'Settings',
    'name-tags': 'Name Tag Generator',
    lir: "Learner's Individual Record",
    tgs: 'Temporary Grade Slip',
};

export function Header() {
    const currentView = useAppStore(state => state.currentView);
    const schoolProfile = useAppStore(state => state.schoolProfile);
    const activeSchoolYear = useAppStore(state => state.activeSchoolYear);
    const announcements = useAppStore(state => state.announcements);
    const dbWritePendingCount = useAppStore(state => state.dbWritePendingCount || 0);
    const showNotification = useAppStore(state => state.showNotification);
    const { user } = useAuthStore();
    const [showNotifications, setShowNotifications] = useState(false);

    // Google Drive cloud backup state
    const [isCloudSyncing, setIsCloudSyncing] = useState(false);
    const [isGDriveLinked, setIsGDriveLinked] = useState(false);
    const [gdriveEmail, setGdriveEmail] = useState<string | null>(null);
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

    // Backup dropdown / local export state
    const [showBackupMenu, setShowBackupMenu] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Check Google Drive link status on mount and subscribe to live sync state
    useEffect(() => {
        CloudSyncService.getStateAsync().then((state) => {
            setIsGDriveLinked(state.linked);
            setGdriveEmail(state.email);
            setLastSyncTime(state.lastSync);
            setIsCloudSyncing(state.isSyncing);
        });

        const unsubscribe = CloudSyncService.subscribe((state) => {
            setIsGDriveLinked(state.linked);
            setGdriveEmail(state.email);
            setLastSyncTime(state.lastSync);
            setIsCloudSyncing(state.isSyncing);
        });

        return () => unsubscribe();
    }, []);

    const getSyncTimeString = useCallback(() => {
        if (!lastSyncTime) return 'Not synced yet';
        const diffMins = Math.floor((Date.now() - lastSyncTime) / (60 * 1000));
        if (diffMins < 1) return 'Synced just now';
        if (diffMins < 60) return `Synced ${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Synced ${diffHours}h ago`;
        return `Synced ${new Date(lastSyncTime).toLocaleDateString()}`;
    }, [lastSyncTime]);

    const handleCloudBackup = useCallback(async () => {
        if (isCloudSyncing) return;
        setIsCloudSyncing(true);
        try {
            // If not linked, authorize first
            if (!isGDriveLinked) {
                const newState = await CloudSyncService.authorize();
                setIsGDriveLinked(newState.linked);
                setGdriveEmail(newState.email);
                if (!newState.linked) {
                    showNotification('Google Drive authorization failed', 'error');
                    return;
                }
                showNotification(`Google Drive linked as ${newState.email}`, 'success');
            }

            // Now sync (upload backup)
            await CloudSyncService.syncNow();
            const updatedState = CloudSyncService.getState();
            setLastSyncTime(updatedState.lastSync);
            showNotification('Backup uploaded to Google Drive successfully!', 'success');
        } catch (error) {
            console.error('Cloud backup failed:', error);
            showNotification(error instanceof Error ? error.message : 'Cloud backup failed', 'error');
        } finally {
            setIsCloudSyncing(false);
        }
    }, [isCloudSyncing, isGDriveLinked, showNotification]);

    // Full comprehensive local export (same backup pipeline as Settings > Data Management)
    const handleFullExport = useCallback(async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            const s = useAppStore.getState();
            const backup = await createComprehensiveBackup(
                s.schoolProfile,
                s.schoolYears,
                s.activeSchoolYear,
                s.enrollments,
                s.students,
                s.studentProfiles,
                s.sections,
                s.subjects,
                s.classRecords,
                s.gradingSheetRecords,
                s.observedValues,
                s.hpsRecords,
                s.sf2Sheets,
                s.announcements,
                s.attendanceRecords,
                user?.email || 'unknown',
            );

            const validation = await validateBackup(backup);
            if (!validation.isValid) {
                showNotification(`Backup validation failed: ${validation.issues[0] || 'unknown issue'}`, 'error');
                return;
            }

            const timestamp = new Date().toISOString().split('T')[0];
            const backupBlob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const backupUrl = URL.createObjectURL(backupBlob);
            const backupLink = document.createElement('a');
            backupLink.href = backupUrl;
            backupLink.download = `SMS_Backup_Comprehensive_${timestamp}.json`;
            document.body.appendChild(backupLink);
            backupLink.click();
            document.body.removeChild(backupLink);
            URL.revokeObjectURL(backupUrl);

            showNotification('Comprehensive backup exported successfully!', 'success');
        } catch (error) {
            console.error('Full export failed:', error);
            showNotification(error instanceof Error ? error.message : 'Full database export failed', 'error');
        } finally {
            setIsExporting(false);
        }
    }, [isExporting, user, showNotification]);

    // Use announcements as notification source
    const recentNotifications = announcements.slice(0, 5);
    const unreadCount = recentNotifications.length;

    const backupTitle = isGDriveLinked
        ? `Google Drive: ${gdriveEmail || 'Connected'}\n${getSyncTimeString()}`
        : 'Click to link Google Drive & backup online';

    return (
        <header className="px-6 lg:px-8 h-16 flex items-center border-b border-[#E5E7EB] dark:border-white/5 bg-white dark:bg-[#0B1121] z-30 relative no-print shrink-0">
            <div className="flex items-center justify-between w-full max-w-screen-2xl mx-auto relative h-full">
                
                {/* Left Area: Title */}
                <div className="flex-1 min-w-0 flex items-center gap-4 pr-4">
                    <div className="w-1.5 h-8 rounded-full bg-emerald-500 hidden sm:block" />
                    <div className="flex flex-col justify-center min-w-0">
                        <h2 className="text-[17px] sm:text-lg lg:text-xl font-black text-[#0f172a] dark:text-white tracking-tight leading-none mb-1.5 flex items-center gap-2" title={viewTitles[currentView] || 'Dashboard'}>
                            <span>{viewTitles[currentView] || 'Dashboard'}</span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 rounded-md tracking-wider uppercase xl:hidden shrink-0">S.Y. {activeSchoolYear}</span>
                        </h2>
                        <p className="text-[10px] lg:text-[11px] font-bold tracking-[0.15em] uppercase text-slate-500 dark:text-slate-400 leading-none truncate" title={schoolProfile.name}>
                            {schoolProfile.name}
                        </p>
                    </div>
                </div>

                {/* Center Area: S.Y. — shown only on xl screens to avoid overlap
                    on mid-sized laptops when the sidebar is expanded */}
                <div className="hidden xl:flex shrink-0 mx-2">
                    <div 
                        data-tour="school-year"
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-200/50 dark:border-white/10 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] cursor-default transition-all hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20"
                        title="Current Active School Year"
                    >
                        <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">S.Y.</span>
                        <span className="text-[12px] font-black text-[#0f172a] dark:text-white tracking-wide">{activeSchoolYear}</span>
                    </div>
                </div>

                {/* Right Area: Utilities & Profile */}
                <div className="flex-1 flex items-center justify-end gap-1 lg:gap-2 min-w-max pl-4">
                    {/* Database Sync Status Indicator */}
                    <div 
                        className={`flex items-center gap-1.5 h-8 px-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider select-none cursor-default transition-all duration-300 ${
                            dbWritePendingCount > 0 
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20' 
                                : 'bg-[#F0FDF4] dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-500/10'
                        }`}
                        title={dbWritePendingCount > 0 ? `${dbWritePendingCount} changes saving to local storage` : 'All database changes saved locally'}
                    >
                        <Database className={`w-3 h-3 ${dbWritePendingCount > 0 ? 'animate-bounce text-amber-500' : 'text-emerald-500'}`} />
                        <span className={dbWritePendingCount > 0 ? 'animate-pulse' : ''}>
                            {dbWritePendingCount > 0 ? 'Saving...' : 'Saved'}
                        </span>
                    </div>

                    <UpdateStatus />
                    
                    {/* Backup Dropdown: Google Drive Cloud Backup + Full Local Export */}
                    <div className="relative hidden lg:block">
                        <button
                            onClick={() => {
                                const next = !showBackupMenu;
                                setShowBackupMenu(next);
                                if (next) {
                                    CloudSyncService.getStateAsync().then(state => {
                                        setIsGDriveLinked(state.linked);
                                        setGdriveEmail(state.email);
                                        setLastSyncTime(state.lastSync);
                                    });
                                }
                            }}
                            disabled={isCloudSyncing || isExporting}
                            className={`flex items-center gap-1.5 h-9 px-3 rounded-md border transition-all font-bold text-[11px] uppercase tracking-widest active:scale-95 disabled:pointer-events-none ${
                                isCloudSyncing || isExporting
                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                                    : isGDriveLinked
                                        ? 'bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-500/20'
                                        : 'bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-blue-50 dark:hover:bg-blue-500/5 hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500/20'
                            }`}
                            title={backupTitle}
                        >
                            {isCloudSyncing || isExporting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isGDriveLinked ? (
                                <CloudUpload className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                                <Cloud className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span className="hidden xl:inline">
                                {isCloudSyncing ? 'Syncing...' : isExporting ? 'Exporting...' : isGDriveLinked ? 'Sync Drive' : 'Link Drive'}
                            </span>
                            {isGDriveLinked && !isCloudSyncing && !isExporting && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                            )}
                            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showBackupMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showBackupMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowBackupMenu(false)} />
                                <div className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-[#E5E7EB] dark:border-white/10 z-50 overflow-hidden">
                                    <div className="p-3 border-b border-[#E5E7EB] dark:border-white/5 bg-slate-50 dark:bg-white/5">
                                        <h4 className="font-bold text-[#0f172a] dark:text-white text-xs tracking-wider uppercase">Backup Options</h4>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => {
                                                setShowBackupMenu(false);
                                                void handleCloudBackup();
                                            }}
                                            className="w-full flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left cursor-pointer"
                                        >
                                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 shrink-0">
                                                {isGDriveLinked ? (
                                                    <CloudUpload className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                    <Cloud className="w-4 h-4 text-blue-500" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-bold text-[#0f172a] dark:text-white">
                                                    {isGDriveLinked ? 'Sync Full Backup to Google Drive' : 'Sync Full Backup to Google Drive (Authorize)'}
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                                                    {isGDriveLinked
                                                        ? `Upload a complete uncompressed (.json) database backup to ${gdriveEmail || 'Google Drive'}.`
                                                        : 'Authorize Google Drive and upload a complete uncompressed (.json) database backup.'}
                                                </p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowBackupMenu(false);
                                                void handleFullExport();
                                            }}
                                            className="w-full flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left cursor-pointer"
                                        >
                                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 shrink-0">
                                                <HardDriveDownload className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-bold text-[#0f172a] dark:text-white">Full Database Export (Local)</p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                                                    Download a complete standalone backup (.json) of all school records to this device.
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="w-px h-5 bg-[#E5E7EB] dark:bg-white/10 hidden lg:block mx-1"></div>


                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-300"
                        >
                            <Bell className="w-4 h-4" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-[#0B1121]"></span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                <div className="absolute right-0 top-full mt-3 w-80 lg:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-[#E5E7EB] dark:border-white/10 z-50 overflow-hidden">
                                    <div className="p-4 border-b border-[#E5E7EB] dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                                        <h4 className="font-bold text-[#0f172a] dark:text-white text-sm tracking-wide">Notifications</h4>
                                        <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md transition-colors">
                                            <X className="w-4 h-4 text-slate-500" />
                                        </button>
                                    </div>
                                    <div className="max-h-87.5 overflow-y-auto custom-scrollbar p-2">
                                        {recentNotifications.length > 0 ? (
                                            recentNotifications.map((n) => (
                                                <div key={n.id} className="p-3 mb-1 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.announcement_type === 'urgent' ? 'bg-red-500' : n.announcement_type === 'event' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                        <div className="min-w-0">
                                                            <p className="text-[13px] font-bold text-[#0f172a] dark:text-white truncate">{n.announcement_title}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{n.announcement_content}</p>
                                                            <p className="text-[10px] font-medium text-slate-400 mt-1.5 uppercase tracking-wider">{n.announcement_date}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-slate-400 text-sm font-medium">No recent notifications</div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Help / Replay Onboarding Button */}
                    <button
                        onClick={() => {
                            const event = new CustomEvent('formease-trigger-onboarding');
                            window.dispatchEvent(event);
                        }}
                        data-tour="help-button"
                        className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-300"
                        title="Replay Welcome Tour"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>

                    {/* Divider */}
                    <div className="w-px h-5 bg-[#E5E7EB] dark:bg-white/10 hidden sm:block mx-2"></div>

                    <div 
                        data-tour="user-profile"
                        className="hidden sm:flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-[13px] font-bold text-[#0f172a] dark:text-white truncate leading-none mb-1">
                                {user?.displayName || 'User'}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide leading-none">
                                {user?.role || 'Guest'}
                            </p>
                        </div>
                        {schoolProfile?.adviser_image_url ? (
                            <img 
                                src={schoolProfile.adviser_image_url} 
                                alt={user?.displayName || 'User'} 
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-white/10 shadow-sm"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                                {(user?.displayName || 'U')[0].toUpperCase()}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </header>
    );
}
