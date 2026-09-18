/**
 * Calendar & Announcements — combines the School Calendar and Announcements
 * pages under one sidebar entry with a segmented tab switcher. The `calendar`
 * and `announcements` view ids both land here (Dashboard shortcuts pick the
 * matching tab).
 */
import { useState } from 'react';
import { useAppStore } from '../stores/app-store';
import { Calendar, Megaphone } from 'lucide-react';
import { CalendarPage } from './CalendarPage';
import { AnnouncementsPage } from './AnnouncementsPage';

type Tab = 'calendar' | 'announcements';

export function CalendarAnnouncementsPage() {
    const currentView = useAppStore((s) => s.currentView);
    // Remember the user's tab pick per view so navigating from a Dashboard
    // shortcut (which sets the view) still lands on the intended tab.
    const [choice, setChoice] = useState<{ view: string; tab: Tab } | null>(null);
    const tab: Tab = choice && choice.view === currentView
        ? choice.tab
        : currentView === 'announcements' ? 'announcements' : 'calendar';

    const tabs: Array<{ id: Tab; label: string; icon: typeof Calendar }> = [
        { id: 'calendar', label: 'School Calendar', icon: Calendar },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
    ];

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-4 lg:px-6 pt-4 shrink-0">
                <div className="inline-flex p-1 gap-1 rounded-2xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setChoice({ view: currentView, tab: id })}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                tab === id
                                    ? 'bg-white dark:bg-[#1e293b] text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 min-h-0">
                {tab === 'calendar' ? <CalendarPage /> : <AnnouncementsPage />}
            </div>
        </div>
    );
}
