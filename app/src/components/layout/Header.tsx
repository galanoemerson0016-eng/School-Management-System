import { useState } from 'react';
import { useAppStore, useAuthStore } from '../../stores';
import { Bell, X } from 'lucide-react';
import { canEditClassesAndSubjects } from '../../lib/rbac';

const viewTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    students: 'Student Information',
    institute: 'Institute Profile',
    subjects: 'Subjects',
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

const BASELINE_SCHOOL_YEAR = '2026-2027';

const parseSchoolYearStart = (label: string) => {
    const match = label.match(/^(\d{4})-(\d{4})$/);
    if (!match) return -1;
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end !== start + 1) return -1;
    return start;
};

export function Header() {
    const {
        currentView,
        schoolProfile,
        activeSchoolYear,
        announcements,
        schoolYears,
        setActiveSchoolYear,
        createSchoolYear,
    } = useAppStore();
    const { user } = useAuthStore();
    const [showNotifications, setShowNotifications] = useState(false);
    const canManageSchoolYears = canEditClassesAndSubjects(user);

    // Use announcements as notification source
    const recentNotifications = announcements.slice(0, 5);
    const unreadCount = recentNotifications.length;

    const buildSelectableSchoolYears = () => {
        const fromCatalog = schoolYears.map((year) => year.label).filter(Boolean);
        const unique = new Set<string>(
            fromCatalog.filter((label) => parseSchoolYearStart(label) >= 2026)
        );

        unique.add(BASELINE_SCHOOL_YEAR);

        if (activeSchoolYear && parseSchoolYearStart(activeSchoolYear) >= 2026) {
            unique.add(activeSchoolYear);
        }

        return Array.from(unique).sort((a, b) => b.localeCompare(a));
    };

    const selectableSchoolYears = buildSelectableSchoolYears();

    const handleCreateSchoolYear = async () => {
        const baseYear = Number(activeSchoolYear.split('-')[0]);
        const suggested = Number.isFinite(baseYear)
            ? `${baseYear + 1}-${baseYear + 2}`
            : '';

        const input = window.prompt('Enter new school year in YYYY-YYYY format:', suggested);
        if (!input) return;
        await createSchoolYear(input);
    };

    return (
        <header className="px-5 lg:px-8 py-2.5 border-b border-slate-200/50 dark:border-white/5 bg-white/30 dark:bg-black/10 backdrop-blur-md z-30 relative no-print shrink-0">
            <div className="flex justify-between items-center">
                
                {/* Title Area */}
                <div className="min-w-0 flex-1 flex items-center gap-3">
                    <div className="w-1.5 h-7 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.8)] hidden sm:block" />
                    <div>
                        <h2 className="text-lg lg:text-xl font-black text-slate-800 dark:text-white truncate tracking-tight">
                            {viewTitles[currentView] || 'Dashboard'}
                        </h2>
                        <p className="text-[10px] lg:text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors hidden sm:block mt-0.5">
                            {schoolProfile.name} <span className="mx-1.5 text-emerald-500/50">•</span> S.Y. {activeSchoolYear}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">S.Y.</label>
                        <select
                            value={activeSchoolYear}
                            onChange={(e) => setActiveSchoolYear(e.target.value, true)}
                            className="h-9 min-w-[120px] px-3 rounded-xl bg-white/60 dark:bg-black/30 border border-white/70 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                        >
                            {selectableSchoolYears.map((label) => (
                                <option key={label} value={label}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        {canManageSchoolYears && (
                            <button
                                onClick={() => {
                                    void handleCreateSchoolYear();
                                }}
                                className="h-9 px-3 rounded-xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-600 transition-colors"
                                title="Create and activate a new school year"
                            >
                                + New
                            </button>
                        )}
                    </div>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-2xl bg-white/50 dark:bg-black/40 border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 shadow-sm"
                        >
                            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(52,211,153,0.8)] border-2 border-white dark:border-[#0a0e1a]">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                <div className="absolute right-0 top-full mt-3 w-80 lg:w-96 bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[24px] shadow-[0_15px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-white/60 dark:border-white/10 z-50 overflow-hidden">
                                    <div className="p-5 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-white/5">
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm tracking-wide">Notifications</h4>
                                        <button onClick={() => setShowNotifications(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors">
                                            <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                        </button>
                                    </div>
                                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2">
                                        {recentNotifications.length > 0 ? (
                                            recentNotifications.map((n) => (
                                                <div key={n.id} className="p-3 mb-1 hover:bg-slate-100/80 dark:hover:bg-white/5 rounded-2xl cursor-pointer transition-all">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-2.5 h-2.5 mt-1 rounded-full flex-shrink-0 shadow-sm ${n.announcement_type === 'urgent' ? 'bg-red-500 shadow-red-500/40' : n.announcement_type === 'event' ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-blue-500 shadow-blue-500/40'}`} />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{n.announcement_title}</p>
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
                    <div className="w-[1px] h-8 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>

                    {/* User Info */}
                    <div className="hidden sm:flex items-center gap-2.5 bg-white/50 dark:bg-black/20 pl-2 pr-3 py-1 rounded-full border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/5 transition-all">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_2px_10px_rgba(52,211,153,0.3)] border-2 border-white dark:border-[#1a1f2e]">
                            {(user?.displayName || 'U')[0].toUpperCase()}
                        </div>
                        <div className="text-left hidden md:block w-28">
                            <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate">
                                {user?.displayName || 'User'}
                            </p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mt-0.5 truncate">
                                {user?.role || 'Guest'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
