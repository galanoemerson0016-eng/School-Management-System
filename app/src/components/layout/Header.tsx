import { useState } from 'react';
import { useAppStore, useAuthStore } from '../../stores';
import { Bell, X, Database, Power } from 'lucide-react';
import { UpdateStatus } from '../ui/UpdateStatus';

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
    attendance: 'SF2 Daily Attendance',
    'school-forms': 'Official School Forms Hub',
    calendar: 'School Calendar',
    announcements: 'Announcements',
    reports: 'Reports & Analytics',
    'consolidated-grades': 'Consolidated Grades',
    users: 'User Management',
    settings: 'Settings',
};

export function Header() {
    const {
        currentView,
        schoolProfile,
        activeSchoolYear,
        announcements,
        createBackup,
        lastBackupTime,
    } = useAppStore();
    const { user } = useAuthStore();
    const [showNotifications, setShowNotifications] = useState(false);

    // Use announcements as notification source
    const recentNotifications = announcements.slice(0, 5);
    const unreadCount = recentNotifications.length;

    return (
        <header className="px-6 lg:px-8 h-[64px] flex items-center border-b border-[#E5E7EB] dark:border-white/5 bg-white dark:bg-[#0B1121] z-30 relative no-print shrink-0">
            <div className="flex items-center justify-between w-full max-w-screen-2xl mx-auto">
                
                {/* Left Area: Title */}
                <div className="flex-1 min-w-0 flex items-center gap-4">
                    <div className="w-1.5 h-8 rounded-full bg-emerald-500 hidden sm:block" />
                    <div className="flex flex-col justify-center">
                        <h2 className="text-xl lg:text-2xl font-black text-[#0f172a] dark:text-white truncate tracking-tight leading-none mb-1">
                            {viewTitles[currentView] || 'Dashboard'}
                        </h2>
                        <p className="text-[10px] lg:text-[11px] font-bold tracking-[0.15em] uppercase text-slate-500 dark:text-slate-400 leading-none">
                            {schoolProfile.name}
                        </p>
                    </div>
                </div>

                {/* Center Area: S.Y. */}
                <div className="hidden md:flex flex-1 justify-center shrink-0">
                    <div 
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
                <div className="flex-1 flex items-center justify-end gap-1 lg:gap-2 shrink-0">
                    <UpdateStatus />
                    
                    <button
                        onClick={() => void createBackup()}
                        className="hidden lg:flex items-center gap-1.5 h-9 px-3 rounded-md bg-white dark:bg-[#0B1121] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all font-bold text-[11px] uppercase tracking-widest active:scale-95"
                        title={lastBackupTime ? `Last backup: ${new Date(lastBackupTime).toLocaleString()}` : 'No backups recorded'}
                    >
                        <Database className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden xl:inline">Backup</span>
                    </button>

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
                                <div className="absolute right-0 top-full mt-3 w-80 lg:w-96 bg-white dark:bg-slate-900 rounded-[16px] shadow-lg border border-[#E5E7EB] dark:border-white/10 z-50 overflow-hidden">
                                    <div className="p-4 border-b border-[#E5E7EB] dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                                        <h4 className="font-bold text-[#0f172a] dark:text-white text-sm tracking-wide">Notifications</h4>
                                        <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md transition-colors">
                                            <X className="w-4 h-4 text-slate-500" />
                                        </button>
                                    </div>
                                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2">
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

                    {/* Divider */}
                    <div className="w-px h-5 bg-[#E5E7EB] dark:bg-white/10 hidden sm:block mx-2"></div>

                    {/* User Info */}
                    <div className="hidden sm:flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="text-right hidden md:block">
                            <p className="text-[13px] font-bold text-[#0f172a] dark:text-white truncate leading-none mb-1">
                                {user?.displayName || 'User'}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide leading-none">
                                {user?.role || 'Guest'}
                            </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                            {(user?.displayName || 'U')[0].toUpperCase()}
                        </div>
                    </div>

                    <div className="w-px h-5 bg-[#E5E7EB] dark:bg-white/10 hidden lg:block mx-1"></div>

                    {/* Close App Button */}
                    <button 
                        onClick={() => window.electronAPI?.closeApp()}
                        className="hidden lg:flex items-center justify-center w-9 h-9 rounded-full hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 text-slate-500 cursor-pointer transition-colors ml-1" 
                        title="Close Application"
                    >
                        <Power className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
