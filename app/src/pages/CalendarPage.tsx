import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X, Trash2, Pencil, RotateCcw } from 'lucide-react';
import type { CalendarEvent } from '../types';
import { canManageCalendarEvents } from '../lib/rbac';
import { useAuthStore } from '../stores';
import { OFFICIAL_CALENDAR_2026_2027 } from '../data/calendar-events';

const EVENT_TYPES = {
    holiday: { label: 'Holiday', color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    exam: { label: 'Assessment & Exams', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    event: { label: 'School Programs', color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    deadline: { label: 'Admin Deadlines', color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    meeting: { label: 'Professional Dev', color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    break: { label: 'Wellness & Breaks', color: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    national: { label: 'National / Regional', color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
};

export function CalendarPage() {
    const { user } = useAuthStore();
    const canManageEvents = canManageCalendarEvents(user);
    const [currentDate, setCurrentDate] = useState(new Date());
    const storageKey = 'school_calendar_events';
    
    // Initialize events from localStorage (persistent) or seed defaults once
    const [events, setEvents] = useState<CalendarEvent[]>(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored !== null) {
                return JSON.parse(stored);
            }
            // Seed official calendar defaults on first load
            localStorage.setItem(storageKey, JSON.stringify(OFFICIAL_CALENDAR_2026_2027));
            return OFFICIAL_CALENDAR_2026_2027;
        } catch (e) {
            console.warn('Failed to load events from localStorage', e);
            return OFFICIAL_CALENDAR_2026_2027;
        }
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<CalendarEvent>>({ type: 'event' });

    // Persist events to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(events));
        } catch (e) {
            console.warn('Failed to persist events to localStorage', e);
        }
    }, [events]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const calendarDays = useMemo(() => {
        const days: { date: number; isCurrentMonth: boolean; dateStr: string }[] = [];

        // Previous month days
        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const d = prevMonthDays - i;
            const m = month === 0 ? 12 : month;
            const y = month === 0 ? year - 1 : year;
            days.push({ date: d, isCurrentMonth: false, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            days.push({
                date: d,
                isCurrentMonth: true,
                dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            });
        }

        // Next month fill
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            const m = month + 2 > 12 ? 1 : month + 2;
            const y = month + 2 > 12 ? year + 1 : year;
            days.push({ date: d, isCurrentMonth: false, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
        }

        return days;
    }, [year, month, daysInMonth, firstDayOfMonth]);

    const getEventsForDate = (dateStr: string) => {
        return events.filter(e => {
            if (e.date === dateStr) return true;
            if (e.end_date && e.date <= dateStr && e.end_date >= dateStr) return true;
            return false;
        });
    };

    const todayStr = new Date().toISOString().split('T')[0];

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const handleDayClick = (dateStr: string) => {
        setSelectedDate(dateStr);
    };

    const handleSaveEvent = () => {
        if (!formData.title || !formData.date) return;

        if (formData.id) {
            // Edit existing event
            setEvents(prev => prev.map(e => e.id === formData.id ? {
                ...e,
                title: formData.title!,
                date: formData.date!,
                end_date: formData.end_date || undefined,
                type: (formData.type as CalendarEvent['type']) || 'event',
                description: formData.description,
            } : e));
        } else {
            // Create new event
            const newEvent: CalendarEvent = {
                id: `event-${Date.now()}`,
                title: formData.title!,
                date: formData.date!,
                end_date: formData.end_date || undefined,
                type: (formData.type as CalendarEvent['type']) || 'event',
                description: formData.description,
            };
            setEvents(prev => [...prev, newEvent]);
        }

        setIsModalOpen(false);
        setFormData({ type: 'event' });
    };

    const handleEditEvent = (evt: CalendarEvent) => {
        setFormData({ ...evt });
        setIsModalOpen(true);
    };

    const handleDeleteEvent = (id: string) => {
        if (window.confirm('Are you sure you want to delete this event from the calendar?')) {
            setEvents(prev => prev.filter(e => e.id !== id));
        }
    };

    const handleResetDefaults = () => {
        if (window.confirm('Reset calendar events to the official SY 2026-2027 defaults? This will restore deleted holidays and remove custom events.')) {
            setEvents(OFFICIAL_CALENDAR_2026_2027);
            localStorage.setItem(storageKey, JSON.stringify(OFFICIAL_CALENDAR_2026_2027));
        }
    };

    const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
    
    // Filter events based on the month currently being viewed
    const monthActivities = useMemo(() => {
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        
        return events
            .filter(e => {
                const startsInMonth = e.date.startsWith(monthPrefix);
                const spansMonth = e.end_date && e.date <= `${monthPrefix}-31` && e.end_date >= `${monthPrefix}-01`;
                return startsInMonth || spansMonth;
            })
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [events, currentDate]);

    return (
        <div className="space-y-3 md:space-y-4 pb-3 md:pb-4 h-full min-h-0 flex flex-col overflow-hidden pr-1 lg:pr-2">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2 justify-between items-center"
            >
                <div>
                    <h2 className="text-xl font-extrabold text-deped-blue dark:text-white tracking-tight flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-deped-blue dark:text-blue-400" />
                        School Calendar
                    </h2>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium -mt-0.5">SY 2026-2027 Events & Holidays</p>
                </div>
                {canManageEvents && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleResetDefaults}
                            className="px-3.5 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Reset to official calendar defaults"
                        >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Reset Defaults
                        </button>
                        <button
                            onClick={() => { setIsModalOpen(true); setFormData({ type: 'event', date: selectedDate || todayStr }); }}
                            className="px-4 py-2 bg-deped-blue dark:bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> Add Event
                        </button>
                    </div>
                )}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4 flex-1 min-h-0 items-stretch">
                {/* Calendar Grid */}
                <div className="lg:col-span-4 bg-white dark:bg-[#0d1225] rounded-2xl shadow-xs border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col min-h-0">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-100 dark:border-white/10 bg-linear-to-r from-deped-blue to-blue-600 dark:from-indigo-950 dark:to-blue-900">
                        <button onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white cursor-pointer">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg md:text-xl font-black text-white tracking-wide">{monthName}</h3>
                        <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white cursor-pointer">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="px-1.5 md:px-2 py-1.5 md:py-2 text-center text-[10px] md:text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0">
                        {calendarDays.map((day, idx) => {
                            const dayEvents = getEventsForDate(day.dateStr);
                            const isToday = day.dateStr === todayStr;
                            const isSelected = day.dateStr === selectedDate;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleDayClick(day.dateStr)}
                                    className={`min-h-0 h-full p-1 md:p-1.5 border-b border-r border-gray-50 dark:border-white/5 cursor-pointer transition-all hover:bg-blue-50/50 dark:hover:bg-white/5 ${!day.isCurrentMonth ? 'bg-gray-50/50 dark:bg-white/2' : ''
                                        } ${isSelected ? 'bg-blue-50 dark:bg-blue-950/40 ring-2 ring-deped-blue dark:ring-blue-400 ring-inset' : ''}`}
                                >
                                    <div className={`text-[11px] md:text-xs font-bold mb-0.5 md:mb-1 w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-deped-blue dark:bg-blue-600 text-white' : !day.isCurrentMonth ? 'text-gray-300 dark:text-slate-600' : 'text-gray-600 dark:text-slate-200'
                                        }`}>
                                        {day.date}
                                    </div>
                                    <div className="space-y-0.5 overflow-hidden">
                                        {dayEvents.slice(0, 2).map(evt => (
                                            <div key={evt.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${EVENT_TYPES[evt.type]?.color} text-white`}>
                                                {evt.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-[9px] text-gray-400 dark:text-slate-400 font-bold pl-1">+{dayEvents.length - 2} more</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="flex flex-col gap-3 md:gap-4 h-full min-h-0">
                    {/* Selected Date Events */}
                    {selectedDate && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-[#0d1225] rounded-2xl shadow-xs border border-gray-100 dark:border-white/10 overflow-hidden"
                        >
                            <div className="p-3 md:p-4 bg-deped-blue dark:bg-indigo-950 text-white flex justify-between items-center">
                                <h4 className="font-bold text-xs lg:text-sm">
                                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                                </h4>
                                {canManageEvents && (
                                    <button
                                        onClick={() => { setIsModalOpen(true); setFormData({ type: 'event', date: selectedDate }); }}
                                        className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded-md text-[10px] font-bold text-white transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus className="w-3 h-3" /> Add Event
                                    </button>
                                )}
                            </div>
                            <div className="p-3 md:p-4 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                {selectedDateEvents.length > 0 ? (
                                    selectedDateEvents.map(evt => (
                                        <div key={evt.id} className={`p-3 rounded-xl border ${EVENT_TYPES[evt.type]?.border} ${EVENT_TYPES[evt.type]?.bg} dark:bg-white/5 dark:border-white/10`}>
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <span className={`text-[9px] font-black uppercase ${EVENT_TYPES[evt.type]?.text} dark:text-blue-400`}>
                                                        {EVENT_TYPES[evt.type]?.label}
                                                    </span>
                                                    <p className="font-bold text-xs text-gray-800 dark:text-white wrap-break-word">{evt.title}</p>
                                                    {evt.description && <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{evt.description}</p>}
                                                </div>
                                                {canManageEvents && (
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleEditEvent(evt); }} 
                                                            className="p-1 hover:bg-blue-100 dark:hover:bg-white/10 rounded text-blue-500 dark:text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
                                                            title="Edit Event"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt.id); }} 
                                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                                            title="Delete Event"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 dark:text-slate-500 italic text-center py-4">No events on this date</p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Monthly Activities */}
                    <div className="bg-white dark:bg-[#0d1225] rounded-2xl shadow-xs border border-gray-100 dark:border-white/10 overflow-hidden">
                        <div className="p-3 md:p-4 border-b border-gray-100 dark:border-white/10">
                            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <CalendarIcon className="w-3.5 h-3.5 text-deped-blue dark:text-blue-400" />
                                {currentDate.toLocaleString('default', { month: 'long' })} Activities
                            </h4>
                        </div>
                        <div className="p-2 space-y-1.5 max-h-56 md:max-h-64 overflow-y-auto custom-scrollbar">
                            {monthActivities.length > 0 ? (
                                monthActivities.map(evt => (
                                    <div
                                        key={evt.id}
                                        onClick={() => { setSelectedDate(evt.date); setCurrentDate(new Date(evt.date + 'T00:00:00')); }}
                                        className="group flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className={`w-2 h-8 rounded-full ${EVENT_TYPES[evt.type]?.color} shrink-0`} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate">{evt.title}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold">
                                                    {new Date(evt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        {canManageEvents && (
                                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleEditEvent(evt); }}
                                                    className="p-1 hover:bg-blue-100 dark:hover:bg-white/10 rounded text-blue-500 dark:text-blue-400 hover:text-blue-700 transition-colors"
                                                    title="Edit Event"
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt.id); }}
                                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded text-red-400 hover:text-red-600 transition-colors"
                                                    title="Delete Event"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 dark:text-slate-500 italic text-center py-4">No activities this month</p>
                            )}
                        </div>
                    </div>

                    {/* Event Type Legend */}
                    <div className="bg-white dark:bg-[#0d1225] rounded-2xl shadow-xs border border-gray-100 dark:border-white/10 p-4 mt-auto">
                        <h4 className="font-bold text-gray-800 dark:text-slate-300 text-xs mb-3 uppercase tracking-wider">Legend</h4>
                        <div className="space-y-2">
                            {Object.entries(EVENT_TYPES).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${val.color}`} />
                                    <span className="text-xs font-bold text-gray-600 dark:text-slate-300">{val.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add / Edit Event Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-[#0d1225] rounded-2xl shadow-2xl border dark:border-white/10 max-w-md w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-deped-blue dark:bg-indigo-950 text-white px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-bold">{formData.id ? 'Edit Event' : 'Add Event'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/20 rounded-lg cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Event Title *</label>
                                    <input
                                        type="text"
                                        value={formData.title || ''}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg outline-none"
                                        placeholder="e.g., Midterm Exam"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Start Date *</label>
                                        <input
                                            type="date"
                                            value={formData.date || ''}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={formData.end_date || ''}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(EVENT_TYPES).map(([key, val]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: key as CalendarEvent['type'] })}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${formData.type === key
                                                        ? `${val.color} text-white border-transparent`
                                                        : `border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-white/5`
                                                    }`}
                                            >
                                                {val.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Description</label>
                                    <textarea
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg outline-none"
                                        rows={2}
                                        placeholder="Optional description..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-white/10 cursor-pointer">
                                        Cancel
                                    </button>
                                    <button onClick={handleSaveEvent} className="px-6 py-2 bg-deped-blue dark:bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-xs cursor-pointer">
                                        {formData.id ? 'Save Changes' : 'Add Event'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
