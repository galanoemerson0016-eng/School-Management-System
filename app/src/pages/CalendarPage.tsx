import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X, Trash2, Pencil, RotateCcw, Printer, MessageSquare, Send } from 'lucide-react';
import type { CalendarEvent } from '../types';
import { canManageCalendarEvents } from '../lib/rbac';
import { useAuthStore, useAppStore } from '../stores';
import { OFFICIAL_CALENDAR_2026_2027 } from '../data/calendar-events';
import { broadcastParentSms, type SmsBroadcastProgress } from '../services/sms-gateway';
import { formatLearnerName } from '../utils/student-name';

const EVENT_TYPES = {
    holiday: { label: 'Holiday', color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    suspension: { label: 'Class Suspension / Weather', color: 'bg-amber-600', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    exam: { label: 'Assessment & Exams', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    event: { label: 'School Programs', color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    deadline: { label: 'Admin Deadlines', color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    meeting: { label: 'Professional Dev', color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    break: { label: 'Wellness & Breaks', color: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    national: { label: 'National / Regional', color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
};

export function CalendarPage() {
    const { user } = useAuthStore();
    const { students, schoolProfile, showNotification } = useAppStore();
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
    const [selectedDate, setSelectedDate] = useState<string | null>(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [formData, setFormData] = useState<Partial<CalendarEvent>>({ type: 'event' });

    // Category filter
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Event SMS Broadcast Modal State
    const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
    const [smsEventTemplate, setSmsEventTemplate] = useState('');
    const [isSendingSms, setIsSendingSms] = useState(false);
    const [smsProgress, setSmsProgress] = useState<SmsBroadcastProgress | null>(null);

    const handleOpenEventSmsModal = (evt: CalendarEvent) => {
        const dateStr = evt.date;
        setSmsEventTemplate(`Notice: ${evt.title} is scheduled at {school_name} on ${dateStr}. Please be guided accordingly.`);
        setIsSmsModalOpen(true);
    };

    const handleSendEventSmsBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!smsEventTemplate.trim()) {
            showNotification('Please enter SMS message text', 'error');
            return;
        }

        const targetStudents = students.filter(s => {
            const phone = s.parent_contact || s.parent_guardian_contact || s.contact_number;
            return !!phone && phone.trim().length >= 7;
        });

        if (targetStudents.length === 0) {
            showNotification('No learners found with parent contact numbers', 'error');
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
            const res = await broadcastParentSms(targets, smsEventTemplate, schoolName, (p) => setSmsProgress(p));
            showNotification(`📱 Broadcast Complete: ${res.sent} Parent SMS Sent (${res.failed} skipped)`, 'success');
            setIsSmsModalOpen(false);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'SMS Broadcast failed';
            showNotification(errorMessage, 'error');
        } finally {
            setIsSendingSms(false);
            setSmsProgress(null);
        }
    };

    const handlePrintCalendar = () => {
        window.print();
    };

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

    const getLocalDateString = (date: Date = new Date()) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const todayStr = getLocalDateString(new Date());

    const formatEventDateRange = (evt: CalendarEvent) => {
        const start = new Date(evt.date + 'T00:00:00');
        const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!evt.end_date) return startStr;
        const end = new Date(evt.end_date + 'T00:00:00');
        const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${startStr} – ${endStr}`;
    };

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
                const matchesMonth = startsInMonth || spansMonth;
                const matchesCategory = categoryFilter === 'all' || e.type === categoryFilter;
                return matchesMonth && matchesCategory;
            })
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [events, currentDate, categoryFilter]);

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
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrintCalendar}
                        className="px-3.5 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Print School Calendar"
                    >
                        <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Print
                    </button>
                    {canManageEvents && (
                        <>
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
                        </>
                    )}
                </div>
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
                                            <div key={evt.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${EVENT_TYPES[evt.type]?.color} text-white`} title={evt.description ? `${evt.title} - ${evt.description}` : evt.title}>
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
                <div className="flex flex-col gap-2.5 h-full min-h-0 overflow-y-auto custom-scrollbar pr-0.5">
                    {/* Selected Date Events */}
                    {selectedDate && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-[#0d1225] rounded-xl shadow-xs border border-gray-100 dark:border-white/10 overflow-hidden shrink-0"
                        >
                            <div className="px-3 py-2 bg-deped-blue dark:bg-indigo-950 text-white flex justify-between items-center">
                                <h4 className="font-bold text-xs">
                                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                                </h4>
                                {canManageEvents && (
                                    <button
                                        onClick={() => { setIsModalOpen(true); setFormData({ type: 'event', date: selectedDate }); }}
                                        className="px-1.5 py-0.5 bg-white/20 hover:bg-white/30 rounded-md text-[9px] font-bold text-white transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus className="w-3 h-3" /> Add Event
                                    </button>
                                )}
                            </div>
                            <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                                {selectedDateEvents.length > 0 ? (
                                    selectedDateEvents.map(evt => (
                                        <div key={evt.id} className={`p-2 rounded-lg border ${EVENT_TYPES[evt.type]?.border} ${EVENT_TYPES[evt.type]?.bg} dark:bg-white/5 dark:border-white/10`}>
                                            <div className="flex justify-between items-start gap-1.5">
                                                <div className="min-w-0 flex-1">
                                                     <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                                         <span className={`text-[8px] font-black uppercase ${EVENT_TYPES[evt.type]?.text} dark:text-blue-400`}>
                                                             {EVENT_TYPES[evt.type]?.label}
                                                         </span>
                                                         {evt.end_date && (
                                                             <span className="text-[8px] font-bold text-gray-400 dark:text-slate-400">
                                                                 ({formatEventDateRange(evt)})
                                                             </span>
                                                         )}
                                                     </div>
                                                     <p className="font-bold text-[11px] text-gray-800 dark:text-white leading-tight wrap-break-word">{evt.title}</p>
                                                     {evt.description && <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 leading-tight wrap-break-word">{evt.description}</p>}
                                                 </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenEventSmsModal(evt); }}
                                                        className="p-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded text-emerald-600 dark:text-emerald-400 font-bold transition-colors cursor-pointer"
                                                        title="Broadcast Event SMS to Parents"
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                    </button>
                                                    {canManageEvents && (
                                                        <>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleEditEvent(evt); }} 
                                                                className="p-0.5 hover:bg-blue-100 dark:hover:bg-white/10 rounded text-blue-500 dark:text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
                                                                title="Edit Event"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt.id); }} 
                                                                className="p-0.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                                                title="Delete Event"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[11px] text-gray-400 dark:text-slate-500 italic text-center py-2">No events on this date</p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Monthly Activities */}
                    <div className="bg-white dark:bg-[#0d1225] rounded-xl shadow-xs border border-gray-100 dark:border-white/10 overflow-hidden flex-1 min-h-0 flex flex-col">
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 shrink-0">
                            <h4 className="font-bold text-xs text-gray-800 dark:text-white flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5 text-deped-blue dark:text-blue-400" />
                                {currentDate.toLocaleString('default', { month: 'long' })} Activities
                            </h4>
                        </div>
                        <div className="p-1.5 space-y-1 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                            {monthActivities.length > 0 ? (
                                monthActivities.map(evt => (
                                    <div
                                        key={evt.id}
                                        onClick={() => { setSelectedDate(evt.date); setCurrentDate(new Date(evt.date + 'T00:00:00')); }}
                                        className="group flex items-center justify-between gap-1.5 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div className={`w-1.5 h-6 rounded-full ${EVENT_TYPES[evt.type]?.color} shrink-0`} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold text-gray-800 dark:text-slate-200 leading-snug wrap-break-word" title={evt.title}>{evt.title}</p>
                                                <p className="text-[9px] text-gray-400 dark:text-slate-400 font-medium mt-0.5">
                                                    {formatEventDateRange(evt)}
                                                </p>
                                            </div>
                                        </div>
                                        {canManageEvents && (
                                            <div className="opacity-80 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleEditEvent(evt); }}
                                                    className="p-0.5 hover:bg-blue-100 dark:hover:bg-white/10 rounded text-blue-500 dark:text-blue-400 hover:text-blue-700 transition-colors"
                                                    title="Edit Event"
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt.id); }}
                                                    className="p-0.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded text-red-400 hover:text-red-600 transition-colors"
                                                    title="Delete Event"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-[11px] text-gray-400 dark:text-slate-500 italic text-center py-2">No activities this month</p>
                            )}
                        </div>
                    </div>

                    {/* Category Quick Filter */}
                    <div className="bg-white dark:bg-[#0d1225] rounded-xl shadow-xs border border-gray-100 dark:border-white/10 p-2.5 shrink-0">
                        <h4 className="font-bold text-gray-800 dark:text-slate-300 text-[10px] mb-1.5 uppercase tracking-wider">Filter by Category</h4>
                        <div className="grid grid-cols-1 gap-1">
                            <button
                                onClick={() => setCategoryFilter('all')}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-left ${
                                    categoryFilter === 'all'
                                        ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                            >
                                All Categories
                            </button>
                            {Object.entries(EVENT_TYPES).map(([key, val]) => (
                                <button
                                    key={key}
                                    onClick={() => setCategoryFilter(categoryFilter === key ? 'all' : key)}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-left ${
                                        categoryFilter === key
                                            ? `${val.color} text-white shadow-xs`
                                            : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full ${categoryFilter === key ? 'bg-white/40' : val.color} shrink-0`} />
                                    {val.label}
                                </button>
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

            {/* Event SMS Broadcast Modal */}
            <AnimatePresence>
                {isSmsModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                        onClick={() => !isSendingSms && setIsSmsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-[#0d1225] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 max-w-lg w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-linear-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    <h3 className="text-sm font-black uppercase tracking-wider">Broadcast Event SMS to Parents</h3>
                                </div>
                                {!isSendingSms && (
                                    <button onClick={() => setIsSmsModalOpen(false)} className="text-white text-xl hover:bg-white/20 rounded-lg px-2 py-0.5 cursor-pointer">×</button>
                                )}
                            </div>

                            <form onSubmit={handleSendEventSmsBroadcast} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                        SMS Message Content *
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={smsEventTemplate}
                                        onChange={(e) => setSmsEventTemplate(e.target.value)}
                                        disabled={isSendingSms}
                                        required
                                        placeholder="Write SMS announcement text..."
                                        className="w-full p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden leading-relaxed"
                                    />
                                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono font-bold">{'{student_name}'}</span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono font-bold">{'{school_name}'}</span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono font-bold">{'{time}'}</span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono font-bold">{'{date}'}</span>
                                    </div>
                                </div>

                                {smsProgress && (
                                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
                                            <span>Sending: {smsProgress.sent + smsProgress.failed} / {smsProgress.total}</span>
                                            <span>{Math.round(((smsProgress.sent + smsProgress.failed) / smsProgress.total) * 100)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-emerald-200 dark:bg-emerald-900/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-200"
                                                style={{ width: `${((smsProgress.sent + smsProgress.failed) / smsProgress.total) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                            Current: {smsProgress.currentStudent}
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-2">
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
                                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        {isSendingSms ? 'Broadcasting...' : 'Send SMS to All Parents'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
