import { useAppStore, useAuthStore } from '../../stores';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { exportFullDatabaseBackup } from '../../utils/backup-restore';
import { embedChecksum } from '../../utils/backup-integrity';
import {
    LayoutDashboard,
    Users,
    School,
    GraduationCap,
    FileSpreadsheet,
    Settings,
    LogOut,
    BarChart3,
    Calendar,
    Megaphone,
    Menu,
    X,
    ChevronLeft,
    ClipboardList,
    ClipboardCheck,
    Layers,
    Gamepad2,
    IdCard,
    BookOpen
} from 'lucide-react';

import { canAccessView, type AppView } from '../../lib/rbac';

interface NavGroup {
    title: string;
    items: Array<{
        id: AppView;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
    }>;
}

export function Sidebar() {
    const currentView = useAppStore(state => state.currentView);
    const setCurrentView = useAppStore(state => state.setCurrentView);
    const schoolProfile = useAppStore(state => state.schoolProfile);
    const { logout, user } = useAuthStore();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            // Perform silent comprehensive backup before signing out
            if (window.electronAPI && window.electronAPI.saveAutoBackup) {
                const comprehensive = await exportFullDatabaseBackup('Logout Backup');
                const data = await embedChecksum(comprehensive as unknown as Record<string, unknown>);
                const now = new Date();
                const timestamp = now.toISOString().replace(/[:.]/g, '-');
                const filename = `SMS_Backup_Comprehensive_logout_${timestamp}.json`;
                await window.electronAPI.saveAutoBackup(data, filename);
            }
        } catch (error) {
            console.error('Backup during sign out failed:', error);
        } finally {
            setIsLoggingOut(false);
            setShowLogoutConfirm(false);
            logout();
        }
    };

    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved ? JSON.parse(saved) : false;
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem('sidebar-width');
        return saved ? parseInt(saved) : 236;
    });
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
    }, [isCollapsed]);

    useEffect(() => {
        localStorage.setItem('sidebar-width', sidebarWidth.toString());
    }, [sidebarWidth]);

    const startResizing = useCallback((e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
        document.body.style.cursor = 'col-resize';
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = '';
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = e.clientX - 12; 
            if (newWidth >= 200 && newWidth <= 460) {
                setSidebarWidth(newWidth);
                if (isCollapsed) setIsCollapsed(false);
            } else if (newWidth < 120) {
                setIsCollapsed(true);
            }
        }
    }, [isResizing, isCollapsed]);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    const navGroups: NavGroup[] = [
        {
            title: 'Overview',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            ],
        },
        {
            title: 'Academic Management',
            items: [
                { id: 'eclass', label: 'E-Class Record', icon: FileSpreadsheet },
                { id: 'consolidated-grades', label: 'Grade Management', icon: BarChart3 },
                { id: 'sections', label: 'Classes & Sections', icon: Layers },
                { id: 'subjects', label: 'Subjects', icon: GraduationCap },
            ],
        },
        {
            title: 'Learner Records & Forms',
            items: [
                { id: 'students', label: 'Student Information', icon: Users },
                { id: 'daily-attendance', label: 'Daily Attendance', icon: ClipboardCheck },
                { id: 'school-forms', label: 'School Forms Hub', icon: ClipboardList },
            ],
        },
        {
            title: 'Institution & Planning',
            items: [
                { id: 'institute', label: 'Institute Profile', icon: School },
                { id: 'calendar', label: 'School Calendar', icon: Calendar },
                { id: 'announcements', label: 'Announcements', icon: Megaphone },
                { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
            ],
        },
        {
            title: 'Tools & Utilities',
            items: [
                { id: 'student-id-generator', label: 'Student ID Generator', icon: IdCard },
                { id: 'online-generators', label: 'DLL Generators', icon: BookOpen },
                { id: 'games-tools', label: 'Games & Tools', icon: Gamepad2 },
            ],
        },
    ];

    const handleNavClick = (id: string) => {
        setCurrentView(id);
        setIsMobileOpen(false);
    };

    const sidebarContent = (
        <>
            <div className={`p-3 pb-2.5 flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''} border-b border-slate-200/60 dark:border-slate-800/60`}>
                <div className="w-8.5 h-8.5 bg-deped-blue dark:bg-blue-600 rounded-lg flex items-center justify-center shadow-xs shrink-0 border border-blue-400/20 relative overflow-hidden">
                    <img src={`${import.meta.env.BASE_URL}app-logo.png`} alt="App Logo" className="w-5.5 h-5.5 object-contain" />
                </div>
                {!isCollapsed && (
                    <div className="min-w-0">
                        <h1 
                            className="font-semibold text-xs leading-tight tracking-tight text-slate-900 dark:text-white truncate"
                            title={schoolProfile.name}
                        >
                            {schoolProfile.name}
                        </h1>
                        <p className="text-[9px] uppercase font-bold tracking-wider text-deped-blue dark:text-blue-400 mt-0.5">Management Portal</p>
                    </div>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 space-y-3">
                {navGroups.map((group, groupIdx) => {
                    const accessibleItems = group.items.filter((item) => canAccessView(user, item.id));
                    if (accessibleItems.length === 0) return null;

                    return (
                        <div key={group.title} className="space-y-0.5">
                            {!isCollapsed ? (
                                <div className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 select-none">
                                    {group.title}
                                </div>
                            ) : (
                                groupIdx > 0 && <div className="border-t border-slate-200 dark:border-slate-800 my-2 mx-1" />
                            )}
                            <div className="space-y-0.5">
                                {accessibleItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = currentView === item.id;

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleNavClick(item.id)}
                                            data-tour={`sidebar-${item.id}`}
                                            title={isCollapsed ? item.label : undefined}
                                            className={`w-full flex items-center gap-2.5 ${isCollapsed ? 'justify-center px-0 h-9' : 'px-2.5 py-1.5'} rounded-md text-xs font-medium transition-colors relative group select-none cursor-pointer ${
                                                isActive
                                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-deped-blue dark:text-blue-300 font-semibold border border-blue-200/70 dark:border-blue-800/40 shadow-2xs'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-white/5 border border-transparent'
                                            }`}
                                        >
                                            {isActive && !isCollapsed && (
                                                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-deped-blue dark:bg-blue-400 rounded-r" />
                                            )}
                                            <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                                                isActive 
                                                    ? 'text-deped-blue dark:text-blue-400' 
                                                    : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                                            }`} />
                                            {!isCollapsed && (
                                                <span className="truncate">{item.label}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Settings */}
                {canAccessView(user, 'settings') && (
                    <div className="pt-1">
                        <button
                            onClick={() => handleNavClick('settings')}
                            data-tour="sidebar-settings"
                            title={isCollapsed ? 'Settings' : undefined}
                            className={`w-full flex items-center gap-2.5 ${isCollapsed ? 'justify-center px-0 h-9' : 'px-2.5 py-1.5'} rounded-md text-xs font-medium transition-colors relative group select-none cursor-pointer ${
                                currentView === 'settings'
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-deped-blue dark:text-blue-300 font-semibold border border-blue-200/70 dark:border-blue-800/40 shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            {currentView === 'settings' && !isCollapsed && (
                                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-deped-blue dark:bg-blue-400 rounded-r" />
                            )}
                            <Settings className={`w-4 h-4 shrink-0 transition-colors ${
                                currentView === 'settings' 
                                    ? 'text-deped-blue dark:text-blue-400' 
                                    : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                            }`} />
                            {!isCollapsed && <span className="truncate">Settings</span>}
                        </button>
                    </div>
                )}
            </nav>

            <div className="p-2 space-y-1">
                <div className={`border-t border-slate-200 dark:border-slate-800 mb-2 ${isCollapsed ? 'mx-0' : 'mx-1'}`} />
                {/* Collapse toggle (desktop) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:flex w-full items-center justify-center gap-2 h-8.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium border border-transparent cursor-pointer"
                >
                    <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                    {!isCollapsed && <span className="text-xs font-medium">Collapse Menu</span>}
                </button>

                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 h-8.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-medium border border-transparent cursor-pointer"
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="text-xs font-medium">Sign Out</span>}
                </button>

                <div className="pt-1.5 text-center">
                    <span className={`text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-400 select-none ${isCollapsed ? 'block' : ''}`}>
                        {isCollapsed ? `v${__APP_VERSION__.split('.').slice(0, 2).join('.')}` : `Version ${__APP_VERSION__}`}
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
                className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-lg shadow-sm no-print"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 flex flex-col shadow-xl border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 no-print ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md text-slate-500 transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>
                {sidebarContent}
            </div>

            {/* Desktop sidebar */}
            <div 
                ref={sidebarRef}
                style={{ width: isCollapsed ? '72px' : `${sidebarWidth}px` }}
                data-tour="sidebar"
                className={`hidden lg:flex flex-col h-full z-20 no-print relative bg-white dark:bg-[#0d1322] border-r border-slate-200 dark:border-slate-800 shadow-none group/sidebar ${isResizing ? '' : 'transition-[width] duration-300'}`}
            >
                {sidebarContent}
                
                {/* Resize Handle */}
                {!isCollapsed && (
                    <div
                        onMouseDown={startResizing}
                        className="absolute -right-2 top-0 w-4 h-full cursor-col-resize z-40 group-hover/sidebar:bg-blue-500/5 transition-colors flex items-center justify-center group/handle"
                    >
                        <div className="w-1 h-10 bg-slate-300 dark:bg-slate-700 rounded-full opacity-0 group-hover/sidebar:opacity-100 group-hover/handle:bg-deped-blue transition-all" />
                    </div>
                )}
            </div>

            <ConfirmationModal
                open={showLogoutConfirm}
                title="Sign Out"
                message="Are you sure you want to sign out of FormEase Pro? A full backup of your current database will be saved automatically."
                confirmLabel={isLoggingOut ? "Signing Out..." : "Yes, Sign Out"}
                cancelLabel="Cancel"
                intent="info"
                onConfirm={handleLogout}
                onCancel={() => !isLoggingOut && setShowLogoutConfirm(false)}
            />
        </>
    );
}
