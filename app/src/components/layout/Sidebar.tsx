import { useAppStore, useAuthStore } from '../../stores';
import { useState } from 'react';
import {
    LayoutDashboard,
    Users,
    School,
    BookOpen,
    GraduationCap,
    FileSpreadsheet,
    Files,
    FileText,
    Megaphone,
    Settings,
    LogOut,
    BarChart3,
    UserCog,
    CheckCircle2,
    Calendar,
    Menu,
    X,
    ChevronLeft
} from 'lucide-react';

export function Sidebar() {
    const { currentView, setCurrentView } = useAppStore();
    const { logout, user } = useAuthStore();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'students', label: 'Student Information', icon: Users },
        { id: 'institute', label: 'Institute Profile', icon: School },
        { id: 'classes', label: 'Classes/Sections', icon: BookOpen },
        { id: 'subjects', label: 'Subjects', icon: GraduationCap },
        { id: 'eclass', label: 'E-Class Record', icon: FileSpreadsheet },
        { id: 'sf9', label: 'SF9 Report Card', icon: Files },
        { id: 'sf10', label: 'SF10 Permanent Record', icon: FileText },
        { id: 'attendance', label: 'Attendance SF2', icon: CheckCircle2 },
        { id: 'calendar', label: 'School Calendar', icon: Calendar },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'parent-portal', label: 'Parent Portal', icon: Users },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
    ];

    const handleNavClick = (id: string) => {
        setCurrentView(id);
        setIsMobileOpen(false);
    };

    const sidebarContent = (
        <>
            <div className={`p-6 flex items-center gap-4 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-deped-blue rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)] flex-shrink-0 border border-white/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"></div>
                    <img src={`${import.meta.env.BASE_URL}school-logo.png`} alt="School Logo" className="w-7 h-7 object-contain relative z-10" />
                </div>
                {!isCollapsed && (
                    <div className="min-w-0">
                        <h1 className="font-bold text-lg leading-none tracking-wide text-slate-800 dark:text-white drop-shadow-sm">Calibungan HS</h1>
                        <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-emerald-600 dark:text-emerald-400 mt-1.5">Portal</p>
                    </div>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
                {menuItems.map((item) => {
                    if (item.id === 'parent-portal' && user?.role !== 'parent') return null;

                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            title={isCollapsed ? item.label : undefined}
                            className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${isActive
                                ? 'bg-emerald-500/10 dark:bg-emerald-400/15 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.2)]'
                                : 'hover:bg-slate-500/5 dark:hover:bg-white/5'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-emerald-500 dark:bg-emerald-400 rounded-r-md shadow-[0_0_12px_rgba(52,211,153,1)]" />
                            )}
                            <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                            {!isCollapsed && <span className={`text-sm font-semibold tracking-wide truncate transition-colors ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'}`}>{item.label}</span>}
                        </button>
                    );
                })}

                {/* Admin Only Items */}
                {user?.role === 'admin' && (
                    <>
                        <div className={`my-4 border-t border-slate-200 dark:border-white/10 ${isCollapsed ? 'mx-2' : 'mx-4'}`} />
                        <button
                            onClick={() => handleNavClick('users')}
                            title={isCollapsed ? 'User Management' : undefined}
                            className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${currentView === 'users'
                                ? 'bg-emerald-500/10 dark:bg-emerald-400/15 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.2)]'
                                : 'hover:bg-slate-500/5 dark:hover:bg-white/5'
                                }`}
                        >
                            {currentView === 'users' && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-emerald-500 dark:bg-emerald-400 rounded-r-md shadow-[0_0_12px_rgba(52,211,153,1)]" />
                            )}
                            <UserCog className={`w-5 h-5 flex-shrink-0 transition-colors ${currentView === 'users' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                            {!isCollapsed && <span className={`text-sm font-semibold tracking-wide transition-colors ${currentView === 'users' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'}`}>User Management</span>}
                        </button>
                    </>
                )}

                {/* Settings */}
                <button
                    onClick={() => handleNavClick('settings')}
                    title={isCollapsed ? 'Settings' : undefined}
                    className={`w-full flex items-center gap-3 ${isCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${currentView === 'settings'
                        ? 'bg-emerald-500/10 dark:bg-emerald-400/15 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.2)]'
                        : 'hover:bg-slate-500/5 dark:hover:bg-white/5'
                        }`}
                >
                    {currentView === 'settings' && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-emerald-500 dark:bg-emerald-400 rounded-r-md shadow-[0_0_12px_rgba(52,211,153,1)]" />
                    )}
                    <Settings className={`w-5 h-5 flex-shrink-0 transition-colors ${currentView === 'settings' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    {!isCollapsed && <span className={`text-sm font-semibold tracking-wide transition-colors ${currentView === 'settings' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'}`}>Settings</span>}
                </button>
            </nav>

            <div className={`p-4 space-y-2`}>
                <div className={`border-t border-slate-200 dark:border-white/10 mb-4 ${isCollapsed ? 'mx-0' : 'mx-2'}`} />
                {/* Collapse toggle (desktop) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`hidden lg:flex w-full items-center justify-center gap-3 h-10 rounded-xl text-slate-400 hover:bg-slate-500/10 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300 transition-all font-medium border border-transparent hover:border-slate-300/30 dark:hover:border-white/10`}
                >
                    <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                    {!isCollapsed && 'Collapse UI'}
                </button>

                <button
                    onClick={() => logout()}
                    className={`w-full flex items-center justify-center gap-3 h-10 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all font-medium border border-transparent hover:border-red-500/20`}
                >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && 'Sign Out'}
                </button>

                <div className="pt-2 text-center">
                    <span className={`text-[9px] uppercase font-bold tracking-widest text-slate-400/70 dark:text-slate-500/70 select-none ${isCollapsed ? 'block' : ''}`}>
                        {isCollapsed ? 'v1.0' : 'Version 1.0.1'}
                    </span>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-white/40 dark:border-white/10 text-slate-800 dark:text-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] no-print"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl flex flex-col shadow-2xl border-r border-white/50 dark:border-white/10 transform transition-transform duration-300 no-print ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="absolute top-6 right-6 p-1.5 hover:bg-slate-500/10 dark:hover:bg-white/10 rounded-lg text-slate-500 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                {sidebarContent}
            </div>

            {/* Desktop sidebar */}
            <div className={`hidden lg:flex ${isCollapsed ? 'w-[88px]' : 'w-72'} flex-col h-full z-20 no-print transition-all duration-300 relative bg-white/70 dark:bg-white/[0.02] backdrop-blur-3xl rounded-[28px] border border-white/60 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]`}>
                {sidebarContent}
            </div>
        </>
    );
}
