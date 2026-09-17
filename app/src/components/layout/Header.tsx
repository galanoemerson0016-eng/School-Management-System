import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore, useAuthStore } from '../../stores';
import { Bell, X, Database, HelpCircle, Cloud, CloudUpload, Loader2, ChevronDown, HardDriveDownload, Bug, Shield } from 'lucide-react';
import { UpdateStatus } from '../ui/UpdateStatus';
import { CloudSyncService } from '../../services/cloud-sync';
import { createComprehensiveBackup, validateBackup } from '../../utils/backup-restore';
import { onDatabaseWriteChange } from '../../services/database';

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
    'consolidated-grades': 'Grade Management',
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
    const [dbWritePendingCount, setDbWritePendingCount] = useState(0);
    const showNotification = useAppStore(state => state.showNotification);
    const sections = useAppStore(state => state.sections);
    const selectedSection = useAppStore(state => state.selectedSection);
    const setSelectedSection = useAppStore(state => state.setSelectedSection);
    const { user } = useAuthStore();
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        return onDatabaseWriteChange((count) => {
            setDbWritePendingCount(count);
        });
    }, []);

    const advisorySections = useMemo(() => {
        return (sections || []).filter(s => s.is_advisory).sort((a, b) => {
            const getNum = (g: string) => parseInt(g.match(/\d+/)?.[0] || '999');
            const gA = getNum(a.section_grade_level);
            const gB = getNum(b.section_grade_level);
            return gA !== gB ? gA - gB : a.section_name.localeCompare(b.section_name);
        });
    }, [sections]);

    const activeAdvisory = useMemo(() => {
        if (!advisorySections || advisorySections.length === 0) return null;
        return advisorySections.find(s => s.id === selectedSection || s.section_name === selectedSection) || advisorySections[0];
    }, [advisorySections, selectedSection]);

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
        <header className="px-4 lg:px-6 h-14 flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] z-30 relative no-print shrink-0">
            <div className="flex items-center justify-between w-full max-w-screen-2xl mx-auto relative h-full">
                
                {/* Left Area: Title */}
                <div className="flex items-center gap-3 min-w-0 shrink max-w-xs sm:max-w-sm lg:max-w-md">
                    <div className="w-1 h-5.5 rounded-sm bg-deped-blue dark:bg-blue-500 shrink-0 hidden sm:block" />
                    <div className="min-w-0 flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none truncate whitespace-nowrap" title={viewTitles[currentView] || 'Dashboard'}>
                            {viewTitles[currentView] || 'Dashboard'}
                        </h2>
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md xl:hidden shrink-0 whitespace-nowrap">S.Y. {activeSchoolYear}</span>
                    </div>
                </div>

                {/* Center Area: Advisory Class Switcher & S.Y. */}
                <div className="hidden md:flex items-center gap-2 shrink-0 mx-2 min-w-0">
                    {advisorySections.length > 0 && (
                        <div className="flex items-center gap-1.5 h-7.5 px-2.5 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/60 rounded-md shadow-2xs max-w-42.5 lg:max-w-55">
                            <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <select
                                value={activeAdvisory ? activeAdvisory.id : ''}
                                onChange={(e) => {
                                    const sec = advisorySections.find(s => s.id === e.target.value);
                                    if (sec) {
                                        setSelectedSection(sec.section_name);
                                        const gradeNum = sec.section_grade_level.replace(/\D/g, '') || sec.section_grade_level;
                                        showNotification(`Active Advisory switched to ${gradeNum}-${sec.section_name}`, 'info');
                                    }
                                }}
                                className="bg-transparent text-indigo-950 dark:text-indigo-100 font-bold text-xs outline-none cursor-pointer pr-1 truncate min-w-0 flex-1"
                                title="Switch Active Advisory Class (Controls Grade Management, SF9, SF10, & Grade Slips)"
                            >
                                {advisorySections.map(s => {
                                    const gradeNum = s.section_grade_level.replace(/\D/g, '') || s.section_grade_level;
                                    return (
                                        <option key={s.id} value={s.id} className="bg-white dark:bg-[#0d1322] text-slate-800 dark:text-slate-100">
                                            {gradeNum}-{s.section_name}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}
                    <div 
                        data-tour="school-year"
                        className="hidden xl:flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/80 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs cursor-default select-none"
                        title="Current Active School Year"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-deped-blue dark:bg-blue-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">S.Y.</span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-white tabular-nums tracking-wide">{activeSchoolYear}</span>
                    </div>
                </div>

                {/* Right Area: Utilities & Profile */}
                <div className="flex-1 flex items-center justify-end gap-1.5 lg:gap-2 shrink-0 pl-2">
                    {/* Database Sync Status Indicator */}
                    <div 
                        className={`flex items-center gap-1.5 h-7.5 px-2.5 rounded-md border text-[11px] font-medium select-none cursor-default transition-colors ${
                            dbWritePendingCount > 0 
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' 
                                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                        title={dbWritePendingCount > 0 ? `${dbWritePendingCount} changes saving to local database` : 'All database records saved locally'}
                    >
                        <Database className={`w-3.5 h-3.5 ${dbWritePendingCount > 0 ? 'text-amber-500 animate-spin' : 'text-slate-400 dark:text-slate-400'}`} />
                        <span>
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
                            className={`flex items-center gap-1.5 h-7.5 px-2.5 rounded-md border text-[11px] font-medium transition-colors cursor-pointer disabled:pointer-events-none ${
                                isCloudSyncing || isExporting
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-deped-blue dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                    : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                            title={backupTitle}
                        >
                            {isCloudSyncing || isExporting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-deped-blue" />
                            ) : isGDriveLinked ? (
                                <CloudUpload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <Cloud className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span className="hidden xl:inline">
                                {isCloudSyncing ? 'Syncing...' : isExporting ? 'Exporting...' : isGDriveLinked ? 'Google Drive' : 'Link Drive'}
                            </span>
                            {isGDriveLinked && !isCloudSyncing && !isExporting && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            )}
                            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showBackupMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showBackupMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowBackupMenu(false)} />
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
                                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                        <h4 className="font-semibold text-slate-900 dark:text-white text-xs tracking-wider uppercase">Backup Options</h4>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => {
                                                setShowBackupMenu(false);
                                                void handleCloudBackup();
                                            }}
                                            className="w-full flex items-start gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-md transition-colors text-left cursor-pointer"
                                        >
                                            <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/40 shrink-0">
                                                {isGDriveLinked ? (
                                                    <CloudUpload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                ) : (
                                                    <Cloud className="w-4 h-4 text-deped-blue dark:text-blue-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-900 dark:text-white">
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
                                            className="w-full flex items-start gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-md transition-colors text-left cursor-pointer"
                                        >
                                            <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/40 shrink-0">
                                                <HardDriveDownload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-900 dark:text-white">Full Database Export (Local)</p>
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

                    <div className="w-px h-4 bg-slate-200 dark:border-slate-800 hidden lg:block mx-1"></div>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
                        >
                            <Bell className="w-4 h-4" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-slate-900"></span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                <div className="absolute right-0 top-full mt-2 w-80 lg:w-96 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
                                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                        <h4 className="font-semibold text-slate-900 dark:text-white text-xs tracking-wide">Notifications</h4>
                                        <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer">
                                            <X className="w-4 h-4 text-slate-500" />
                                        </button>
                                    </div>
                                    <div className="max-h-87.5 overflow-y-auto custom-scrollbar p-1.5">
                                        {recentNotifications.length > 0 ? (
                                            recentNotifications.map((n) => (
                                                <div key={n.id} className="p-2.5 mb-1 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-md cursor-pointer transition-colors">
                                                    <div className="flex items-start gap-2.5">
                                                        <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.announcement_type === 'urgent' ? 'bg-rose-500' : n.announcement_type === 'event' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{n.announcement_title}</p>
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{n.announcement_content}</p>
                                                            <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">{n.announcement_date}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-slate-400 text-xs font-medium">No recent notifications</div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Grade Sync Debugger / Inspector Button */}
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('formease-open-grade-debugger'));
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition-colors cursor-pointer"
                        title="Grade Sync Inspector & Live Diagnostics"
                    >
                        <Bug className="w-4 h-4" />
                    </button>

                    {/* Help / Replay Onboarding Button */}
                    <button
                        onClick={() => {
                            const event = new CustomEvent('formease-trigger-onboarding');
                            window.dispatchEvent(event);
                        }}
                        data-tour="help-button"
                        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
                        title="Replay Welcome Tour"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>

                    {/* Divider */}
                    <div className="w-px h-4 bg-slate-200 dark:border-slate-800 hidden sm:block mx-1"></div>

                    <div 
                        data-tour="user-profile"
                        className="hidden sm:flex items-center gap-2.5 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">
                                {user?.displayName || 'User'}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide leading-tight">
                                {user?.role || 'Guest'}
                            </p>
                        </div>
                        {schoolProfile?.adviser_image_url ? (
                            <img 
                                src={schoolProfile.adviser_image_url} 
                                alt={user?.displayName || 'User'} 
                                className="w-7 h-7 rounded-md object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-md bg-deped-blue dark:bg-blue-600 flex items-center justify-center text-white font-semibold text-xs shadow-2xs">
                                {(user?.displayName || 'U')[0].toUpperCase()}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </header>
    );
}
