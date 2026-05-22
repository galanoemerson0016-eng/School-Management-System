import { useAppStore, useAuthStore } from '../../stores';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    LayoutDashboard,
    Users,
    School,
    GraduationCap,
    FileSpreadsheet,
    Megaphone,
    Settings,
    Info,
    LogOut,
    BarChart3,
    Calendar,
    Menu,
    X,
    ChevronLeft,
    ClipboardList,
    Layers
} from 'lucide-react';
import { canAccessView, type AppView } from '../../lib/rbac';

export function Sidebar() {
    const { currentView, setCurrentView, schoolProfile } = useAppStore();
    const { logout, user } = useAuthStore();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved ? JSON.parse(saved) : false;
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem('sidebar-width');
        return saved ? parseInt(saved) : 224;
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
            // Account for the p-3 padding on the parent container (12px)
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

    const menuItems: Array<{ id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'sections', label: 'Classes & Sections', icon: Layers },
        { id: 'students', label: 'Student Information', icon: Users },
        { id: 'institute', label: 'Institute Profile', icon: School },
        { id: 'subjects', label: 'Subjects', icon: GraduationCap },
        { id: 'eclass', label: 'E-Class Record', icon: FileSpreadsheet },
        { id: 'consolidated-grades', label: 'Grade Management', icon: BarChart3 },
        { id: 'school-forms', label: 'School Forms', icon: ClipboardList },
        { id: 'calendar', label: 'School Calendar', icon: Calendar },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
    ];

    const handleNavClick = (id: string) => {
        setCurrentView(id);
        setIsMobileOpen(false);
    };

    const visibleMenuItems = menuItems.filter((item) => canAccessView(user, item.id));

    const sidebarContent = (
        <>
            <div className={`p-3 pb-2 flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="w-9 h-9 bg-linear-to-br from-emerald-400 to-deped-blue rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)] shrink-0 border border-white/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"></div>
                    <img src={`${import.meta.env.BASE_URL}app-logo.png`} alt="App Logo" className="w-6 h-6 object-contain relative z-10" />
                </div>
                {!isCollapsed && (
                    <div className="min-w-0">
                        <h1 
                            className="font-bold text-[11px] lg:text-[12px] leading-tight tracking-tighter text-slate-800 dark:text-white drop-shadow-sm truncate"
                            title={schoolProfile.name}
                        >
                            {schoolProfile.name}
                        </h1>
                        <p className="text-[8px] uppercase font-bold tracking-[0.15em] text-emerald-600 dark:text-emerald-400 mt-0.5">Portal</p>
                    </div>
                )}
            </div>

            <nav className="flex-1 overflow-hidden px-2.5 py-1.5 space-y-1">
                {visibleMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            title={isCollapsed ? item.label : undefined}
                            className={`w-full flex items-center gap-2.5 ${isCollapsed ? 'justify-center px-0' : 'px-2.5'} py-2 rounded-xl transition-all duration-300 relative group overflow-hidden ${isActive
                                ? 'bg-emerald-500/10 dark:bg-emerald-400/15 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.2)]'
                                : 'hover:bg-slate-500/5 dark:hover:bg-white/5'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-emerald-500 dark:bg-emerald-400 rounded-r-md shadow-[0_0_12px_rgba(52,211,153,1)]" />
                            )}
                            <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                            {!isCollapsed && <span className={`text-[12px] font-semibold tracking-wide truncate transition-colors ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'}`}>{item.label}</span>}
                        </button>
                    );
                })}


                {/* Settings */}
                {canAccessView(user, 'settings') && (
                    <button
                        onClick={() => handleNavClick('settings')}
                        title={isCollapsed ? 'Settings' : undefined}
                        className={`w-full flex items-center gap-2.5 ${isCollapsed ? 'justify-center px-0' : 'px-2.5'} py-2 rounded-xl transition-all duration-300 relative group overflow-hidden ${currentView === 'settings'
                            ? 'bg-emerald-500/10 dark:bg-emerald-400/15 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.2)]'
                            : 'hover:bg-slate-500/5 dark:hover:bg-white/5'
                            }`}
                    >
                        {currentView === 'settings' && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-emerald-500 dark:bg-emerald-400 rounded-r-md shadow-[0_0_12px_rgba(52,211,153,1)]" />
                        )}
                        <Settings className={`w-4.5 h-4.5 shrink-0 transition-colors ${currentView === 'settings' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                        {!isCollapsed && <span className={`text-[12px] font-semibold tracking-wide transition-colors ${currentView === 'settings' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'}`}>Settings</span>}
                    </button>
                )}
                {/* About */}
                <button
                    onClick={() => handleNavClick('about')}
                    title={isCollapsed ? 'About' : undefined}
                    className={`w-full flex items-center gap-2.5 ${isCollapsed ? 'justify-center px-0' : 'px-2.5'} py-2 rounded-xl transition-all duration-300 relative group overflow-hidden ${currentView === 'about'
                        ? 'bg-emerald-500/10 dark:bg-emerald-400/15 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.2)]'
                        : 'hover:bg-slate-500/5 dark:hover:bg-white/5'
                        }`}
                >
                    {currentView === 'about' && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-emerald-500 dark:bg-emerald-400 rounded-r-md shadow-[0_0_12px_rgba(52,211,153,1)]" />
                    )}
                    <Info className={`w-4.5 h-4.5 shrink-0 transition-colors ${currentView === 'about' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    {!isCollapsed && <span className={`text-[12px] font-semibold tracking-wide transition-colors ${currentView === 'about' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'}`}>About & Innovator</span>}
                </button>
            </nav>

            <div className={`p-2.5 space-y-1.5`}>
                <div className={`border-t border-slate-200 dark:border-white/10 mb-4 ${isCollapsed ? 'mx-0' : 'mx-2'}`} />
                {/* Collapse toggle (desktop) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`hidden lg:flex w-full items-center justify-center gap-2.5 h-9 rounded-xl text-slate-400 hover:bg-slate-500/10 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300 transition-all font-medium border border-transparent hover:border-slate-300/30 dark:hover:border-white/10`}
                >
                    <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                    {!isCollapsed && <span className="text-[12px] font-semibold tracking-wide">Collapse UI</span>}
                </button>

                <button
                    onClick={() => logout()}
                    className={`w-full flex items-center justify-center gap-2.5 h-9 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all font-medium border border-transparent hover:border-red-500/20`}
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="text-[12px] font-semibold tracking-wide">Sign Out</span>}
                </button>

                <div className="pt-2 text-center">
                    <span className={`text-[9px] uppercase font-bold tracking-widest text-slate-400/70 dark:text-slate-50/70 select-none ${isCollapsed ? 'block' : ''}`}>
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
            <div 
                ref={sidebarRef}
                style={{ width: isCollapsed ? '88px' : `${sidebarWidth}px` }}
                className={`hidden lg:flex flex-col h-full z-20 no-print relative bg-white/70 dark:bg-white/2 backdrop-blur-3xl rounded-[28px] border border-white/60 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] group/sidebar ${isResizing ? '' : 'transition-[width] duration-300'}`}
            >
                {sidebarContent}
                
                {/* Resize Handle */}
                {!isCollapsed && (
                    <div
                        onMouseDown={startResizing}
                        className="absolute -right-2 top-0 w-4 h-full cursor-col-resize z-40 group-hover/sidebar:bg-emerald-500/5 transition-colors flex items-center justify-center group/handle"
                    >
                        <div className="w-1 h-12 bg-emerald-500/20 rounded-full opacity-0 group-hover/sidebar:opacity-100 group-hover/handle:bg-emerald-500 transition-all shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                    </div>
                )}
            </div>
        </>
    );
}
