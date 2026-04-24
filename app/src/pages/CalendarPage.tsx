import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X, Trash2 } from 'lucide-react';
import type { CalendarEvent } from '../types';
import { canManageCalendarEvents } from '../lib/rbac';
import { useAuthStore } from '../stores';

const EVENT_TYPES = {
    holiday: { label: 'Holiday', color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    exam: { label: 'Assessment & Exams', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    event: { label: 'School Programs', color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    deadline: { label: 'Admin Deadlines', color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    meeting: { label: 'Professional Dev', color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    break: { label: 'Wellness & Breaks', color: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    national: { label: 'National / Regional', color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
};

const OFFICIAL_CALENDAR_2026_2027: CalendarEvent[] = [
    // APRIL 2026
    { id: 'apr-1', title: "Start of Teachers' EOSY Break", date: '2026-04-01', type: 'break' },
    { id: 'apr-2', title: 'Maundy Thursday', date: '2026-04-02', type: 'holiday' },
    { id: 'apr-3', title: 'Good Friday', date: '2026-04-03', type: 'holiday' },
    { id: 'apr-4', title: 'Black Saturday', date: '2026-04-04', type: 'holiday' },
    { id: 'apr-9', title: 'The Day of Valor', date: '2026-04-09', type: 'holiday' },
    { id: 'apr-13', title: 'National Schools Press Conference', date: '2026-04-13', end_date: '2026-04-17', type: 'national' },
    { id: 'apr-18', title: 'National Festival of Talents', date: '2026-04-18', end_date: '2026-04-22', type: 'national' },
    { id: 'apr-25', title: '2026 Palarong Pambansa', date: '2026-04-25', end_date: '2026-04-30', type: 'national' },
    
    // MAY 2026
    { id: 'may-1', title: 'Labor Day / End of EOSY Break', date: '2026-05-01', type: 'break' },
    { id: 'may-4-int', title: 'EOSY Intervention Program', date: '2026-05-04', end_date: '2026-05-22', type: 'event' },
    { id: 'may-4-train', title: 'Teachers Training Window', date: '2026-05-04', end_date: '2026-05-29', type: 'meeting' },
    { id: 'may-bal', title: 'Oplan Balik Eskwela', date: '2026-05-25', end_date: '2026-05-29', type: 'event' },

    // JUNE 2026
    { id: 'jun-1', title: 'Brigada Eskwela & Enrollment', date: '2026-06-01', end_date: '2026-06-05', type: 'event' },
    { id: 'jun-8', title: 'Opening of Classes (Term 1)', date: '2026-06-08', type: 'event', description: 'Start of School Year 2026-2027' },
    { id: 'jun-8-orient', title: "Learners and Parents' Orientation", date: '2026-06-08', type: 'event' },
    { id: 'jun-8-health', title: "Start of Learners Health Assessment", date: '2026-06-08', type: 'event' },
    { id: 'jun-8-bosy', title: "Start of Testing Window for BOSY", date: '2026-06-08', type: 'deadline', description: 'CRLA, RMA, Phil-IRI, etc.' },
    { id: 'jun-8-data', title: "Submission of Enrollment Data", date: '2026-06-08', type: 'deadline' },
    { id: 'jun-12', title: 'Independence Day', date: '2026-06-12', type: 'holiday' },
    { id: 'jun-term1', title: 'Term 1 Duration', date: '2026-06-08', end_date: '2026-09-15', type: 'deadline', description: 'First Term Period' },
    { id: 'jun-22', title: 'Phil ECD Checklist for BOSY', date: '2026-06-22', end_date: '2026-06-26', type: 'deadline' },
    { id: 'jun-23', title: "DepEd Anniversary Ceremony", date: '2026-06-23', type: 'event' },
    { id: 'jun-24', title: "DepEd Anniversary Proper", date: '2026-06-24', type: 'event' },

    // JULY 2026
    { id: 'jul-3', title: 'End of Learners Health Assessment', date: '2026-07-03', type: 'deadline' },
    { id: 'jul-6', title: 'Term 1: First Summative Test', date: '2026-07-06', type: 'exam' },
    { id: 'jul-10', title: 'End of BOSY Testing Window', date: '2026-07-10', type: 'deadline' },
    { id: 'jul-mfat', title: 'MFAT', date: '2026-07-13', end_date: '2026-07-17', type: 'event' },
    { id: 'jul-election', title: 'SELG and SSLG Election', date: '2026-07-20', end_date: '2026-07-24', type: 'event' },
    { id: 'jul-28', title: 'Term 1: Second Summative Test', date: '2026-07-28', type: 'exam' },

    // AUGUST 2026
    { id: 'aug-21', title: 'Ninoy Aquino Day', date: '2026-08-21', type: 'holiday' },
    { id: 'aug-28', title: 'Term 1 Examination', date: '2026-08-28', type: 'exam' },
    { id: 'aug-31', title: 'National Heroes Day', date: '2026-08-31', type: 'holiday' },

    // SEPTEMBER 2026
    { id: 'sep-1', title: 'Term 1 Examination', date: '2026-09-01', type: 'exam' },
    { id: 'sep-5', title: 'Start of National Teachers Month', date: '2026-09-05', type: 'event' },
    { id: 'sep-end', title: 'Term 1 End Block', date: '2026-09-02', end_date: '2026-09-15', type: 'event' },
    { id: 'sep-aral', title: 'ARAL, Grading & School Forms', date: '2026-09-02', end_date: '2026-09-08', type: 'meeting', description: 'ARAL Program, Computation of Grades, Accomplishment of School Forms, & Activities' },
    { id: 'sep-pta', title: 'PTA Meeting & Report Cards', date: '2026-09-09', type: 'event' },
    { id: 'sep-inset', title: 'INSET', date: '2026-09-10', end_date: '2026-09-11', type: 'meeting' },
    { id: 'sep-wellness-l', title: 'Wellness Break (Learners)', date: '2026-09-10', end_date: '2026-09-15', type: 'break', description: 'Guided asynchronous learning experiences' },
    { id: 'sep-wellness-t', title: 'Wellness Break (Teachers)', date: '2026-09-14', end_date: '2026-09-15', type: 'break' },
    { id: 'sep-term-end', title: 'End of Term 1', date: '2026-09-15', type: 'deadline' },
    { id: 'sep-term2-start', title: 'Start of Term 2', date: '2026-09-16', type: 'event' },
    { id: 'sep-term2-dur', title: 'Term 2 Duration', date: '2026-09-16', end_date: '2026-12-18', type: 'deadline' },
    { id: 'sep-ncae', title: 'NCAE Testing Window (G10)', date: '2026-09-16', type: 'exam' },
    { id: 'sep-mosy-start', title: 'Start of MOSY Testing Window', date: '2026-09-21', end_date: '2026-09-25', type: 'deadline', description: 'CRLA, RMA, Phil-IRI, etc.' },

    // OCTOBER 2026
    { id: 'oct-5', title: 'World Teachers Day / Culmination', date: '2026-10-05', type: 'event' },
    { id: 'oct-nat', title: 'NAT for Grade 10', date: '2026-10-05', end_date: '2026-10-09', type: 'exam' },
    { id: 'oct-sum1', title: 'Term 2: First Summative Test', date: '2026-10-07', type: 'exam' },
    { id: 'oct-mosy-end', title: 'End of MOSY Testing Window', date: '2026-10-19', end_date: '2026-10-23', type: 'deadline' },
    { id: 'oct-sum2', title: 'Term 2: Second Summative Test', date: '2026-10-29', type: 'exam' },

    // NOVEMBER 2026
    { id: 'nov-1', title: "All Saints' Day", date: '2026-11-01', type: 'holiday' },
    { id: 'nov-2', title: "All Souls' Day", date: '2026-11-02', type: 'holiday' },
    { id: 'nov-pept', title: 'PEPT (Luzon & VisMin Clusters)', date: '2026-11-15', type: 'exam' },
    { id: 'nov-araw', title: 'Araw ng Pagbasa', date: '2026-11-27', type: 'event' },
    { id: 'nov-30', title: 'Bonifacio Day', date: '2026-11-30', type: 'holiday' },

    // DECEMBER 2026
    { id: 'dec-3', title: 'Term 2 Examination', date: '2026-12-03', end_date: '2026-12-04', type: 'exam' },
    { id: 'dec-ncae-end', title: 'End of NCAE Testing Window', date: '2026-12-04', type: 'deadline' },
    { id: 'dec-aral', title: 'ARAL, Grading & School Forms', date: '2026-12-07', end_date: '2026-12-14', type: 'meeting' },
    { id: 'dec-8', title: 'Feast of the Immaculate Conception', date: '2026-12-08', type: 'holiday' },
    { id: 'dec-pta', title: 'PTA Meeting & Report Cards', date: '2026-12-15', type: 'event' },
    { id: 'dec-year-end', title: 'Year-End Activity', date: '2026-12-16', type: 'event' },
    { id: 'dec-inset', title: 'INSET', date: '2026-12-17', end_date: '2026-12-18', type: 'meeting' },
    { id: 'dec-wellness', title: 'Wellness Break (Learners)', date: '2026-12-17', end_date: '2026-12-18', type: 'break' },
    { id: 'dec-18-end', title: 'End of Term 2', date: '2026-12-18', type: 'deadline' },
    { id: 'dec-break', title: 'Year-End / Christmas Break', date: '2026-12-19', end_date: '2026-12-31', type: 'break' },
    { id: 'dec-24', title: 'Christmas Eve', date: '2026-12-24', type: 'holiday' },
    { id: 'dec-25', title: 'Christmas Day', date: '2026-12-25', type: 'holiday' },
    { id: 'dec-30', title: 'Rizal Day', date: '2026-12-30', type: 'holiday' },
    { id: 'dec-31', title: 'Last Day of the Year', date: '2026-12-31', type: 'holiday' },

    // JANUARY 2027
    { id: 'jan-1', title: "New Year's Day", date: '2027-01-01', type: 'holiday' },
    { id: 'jan-term3', title: 'Start of Term 3', date: '2027-01-04', type: 'event' },
    { id: 'jan-term3-dur', title: 'Term 3 Duration', date: '2027-01-04', end_date: '2027-04-08', type: 'deadline' },
    { id: 'jan-sum1', title: 'Term 3: First Summative Test', date: '2027-01-25', type: 'exam' },
    { id: 'jan-early-reg', title: 'Early Registration Start', date: '2027-01-30', type: 'event', description: 'Incoming Kinder, G1, G7, G11, OSCYA, Transferees' },

    // FEBRUARY 2027
    { id: 'feb-eosy', title: 'EOSY Assessments Testing Window', date: '2027-02-01', end_date: '2027-02-05', type: 'deadline' },
    { id: 'feb-6', title: 'Chinese New Year', date: '2027-02-06', type: 'holiday' },
    { id: 'feb-nat12', title: 'NAT for Grade 12', date: '2027-02-15', end_date: '2027-02-19', type: 'exam' },
    { id: 'feb-sum2', title: 'Term 3: Second Summative Test', date: '2027-02-16', type: 'exam' },
    { id: 'feb-early-end', title: 'Early Registration End', date: '2027-02-26', type: 'deadline' },

    // MARCH 2027
    { id: 'mar-ellna', title: 'ELLNA for Grade 3', date: '2027-03-01', end_date: '2027-03-05', type: 'exam' },
    { id: 'mar-nat6', title: 'NAT for Grade 6', date: '2027-03-08', end_date: '2027-03-12', type: 'exam' },
    { id: 'mar-sum-end', title: 'End of Testing Window for EOSY', date: '2027-03-12', type: 'deadline' },
    { id: 'mar-ex-grad', title: 'Term 3 Exam (Graduating Learners)', date: '2027-03-15', end_date: '2027-03-16', type: 'exam' },
    { id: 'mar-ecd-eosy', title: 'Phil ECD Checklist for EOSY', date: '2027-03-15', end_date: '2027-03-19', type: 'deadline' },
    { id: 'mar-delib', title: 'Grading & Deliberation (Graduating)', date: '2027-03-17', end_date: '2027-03-23', type: 'meeting' },
    { id: 'mar-ex-oth', title: 'Term 3 Exam (Other Grades)', date: '2027-03-22', end_date: '2027-03-23', type: 'exam' },
    { id: 'mar-awards', title: 'Excellence Awards (Graduating)', date: '2027-03-24', type: 'event' },
    { id: 'mar-term-block', title: 'End-of-Term Block', date: '2027-03-24', end_date: '2027-03-31', type: 'event' },
    { id: 'mar-25', title: 'Maundy Thursday', date: '2027-03-25', type: 'holiday' },
    { id: 'mar-26', title: 'Good Friday', date: '2027-03-26', type: 'holiday' },
    { id: 'mar-27', title: 'Black Saturday', date: '2027-03-27', type: 'holiday' },

    // APRIL 2027
    { id: 'apr-1-block', title: 'End-of-Term Block', date: '2027-04-01', end_date: '2027-04-08', type: 'event' },
    { id: 'apr-inset', title: 'INSET', date: '2027-04-02', end_date: '2027-04-05', type: 'meeting' },
    { id: 'apr-rites', title: 'EOSY Rites (Graduation)', date: '2027-04-06', end_date: '2027-04-07', type: 'event' },
    { id: 'apr-pta', title: 'PTA Meeting & Report Cards', date: '2027-04-08', type: 'event' },
    { id: 'apr-end-sy', title: 'End of Term 3 / SY 2026-2027', date: '2027-04-08', type: 'deadline' },
    { id: 'apr-9', title: 'The Day of Valor', date: '2027-04-09', type: 'holiday' },
    { id: 'apr-eosy-break', title: "Start of Teachers' EOSY Break", date: '2027-04-09', type: 'break' },
    { id: 'apr-nspc', title: '2027 NSPC', date: '2027-04-19', end_date: '2027-04-23', type: 'national' },
    { id: 'apr-nfot', title: '2027 NFOT', date: '2027-04-26', end_date: '2027-04-30', type: 'national' },

    // MAY 2027
    { id: 'may-1', title: 'Labor Day', date: '2027-05-01', type: 'holiday' },
    { id: 'may-palaro', title: '2027 Palarong Pambansa', date: '2027-05-03', end_date: '2027-05-07', type: 'national' },
    { id: 'may-break-end', title: "End of Teachers' EOSY Break", date: '2027-05-09', type: 'break' },
    { id: 'may-interv', title: 'Start of EOSY Intervention Program', date: '2027-05-10', end_date: '2027-05-14', type: 'event' },
    { id: 'may-train', title: 'Teachers Training Window Start', date: '2027-05-10', end_date: '2027-05-14', type: 'meeting' },
    { id: 'may-oplan', title: 'Oplan Balik Eskwela Start', date: '2027-05-17', type: 'event' },

    // JUNE 2027
    { id: 'jun27-train-end', title: 'End of Training Window', date: '2027-06-01', end_date: '2027-06-04', type: 'deadline' },
    { id: 'jun27-oplan-end', title: 'End of Oplan Balik Eskwela', date: '2027-06-04', type: 'event' },
    { id: 'jun27-brigada', title: 'Brigada Eskwela & Enrollment', date: '2027-06-07', end_date: '2027-06-11', type: 'event' },
];

export function CalendarPage() {
    const { user } = useAuthStore();
    const canManageEvents = canManageCalendarEvents(user);
    const [currentDate, setCurrentDate] = useState(new Date());
    const storageKey = 'school_calendar_events';
    
    // Initialize events from localStorage or use defaults
    const [events, setEvents] = useState<CalendarEvent[]>(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            const existingEvents: CalendarEvent[] = stored ? JSON.parse(stored) : [];
            
            // Merge logic: Ensure ALL official events are present.
            // If they already exist (by ID), keep the official version to ensure updates propagate.
            const officialIds = new Set(OFFICIAL_CALENDAR_2026_2027.map(e => e.id));
            const userEvents = existingEvents.filter(e => !officialIds.has(e.id));
            
            return [...OFFICIAL_CALENDAR_2026_2027, ...userEvents];
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
        localStorage.setItem('school_calendar_events', JSON.stringify(events));
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

    const handleAddEvent = () => {
        if (!formData.title || !formData.date) return;
        const newEvent: CalendarEvent = {
            id: `event-${Date.now()}`,
            title: formData.title!,
            date: formData.date!,
            end_date: formData.end_date || undefined,
            type: formData.type as CalendarEvent['type'] || 'event',
            description: formData.description,
        };
        setEvents(prev => [...prev, newEvent]);
        setIsModalOpen(false);
        setFormData({ type: 'event' });
    };

    const handleDeleteEvent = (id: string) => {
        setEvents(prev => prev.filter(e => e.id !== id));
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
        <div className="space-y-4 pb-4 h-[calc(100vh-140px)] flex flex-col">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2 justify-between items-center"
            >
                <div>
                    <h2 className="text-xl font-extrabold text-deped-blue tracking-tight flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        School Calendar
                    </h2>
                    <p className="text-[10px] text-gray-500 font-medium -mt-0.5">SY 2026-2027 Events & Holidays</p>
                </div>
                {canManageEvents && (
                    <button
                        onClick={() => { setIsModalOpen(true); setFormData({ type: 'event', date: selectedDate || todayStr }); }}
                        className="px-5 py-2.5 bg-deped-blue text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Event
                    </button>
                )}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
                {/* Calendar Grid */}
                <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-deped-blue to-blue-600">
                        <button onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-black text-white tracking-wide">{monthName}</h3>
                        <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="px-2 py-3 text-center text-xs font-black text-gray-400 uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 flex-1 min-h-0">
                        {calendarDays.map((day, idx) => {
                            const dayEvents = getEventsForDate(day.dateStr);
                            const isToday = day.dateStr === todayStr;
                            const isSelected = day.dateStr === selectedDate;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleDayClick(day.dateStr)}
                                    className={`min-h-[95px] p-1.5 border-b border-r border-gray-50 cursor-pointer transition-all hover:bg-blue-50/50 ${!day.isCurrentMonth ? 'bg-gray-50/50' : ''
                                        } ${isSelected ? 'bg-blue-50 ring-2 ring-deped-blue ring-inset' : ''}`}
                                >
                                    <div className={`text-xs font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-deped-blue text-white' : !day.isCurrentMonth ? 'text-gray-300' : 'text-gray-600'
                                        }`}>
                                        {day.date}
                                    </div>
                                    <div className="space-y-0.5">
                                        {dayEvents.slice(0, 2).map(evt => (
                                            <div key={evt.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${EVENT_TYPES[evt.type]?.color} text-white`}>
                                                {evt.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-[9px] text-gray-400 font-bold pl-1">+{dayEvents.length - 2} more</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="flex flex-col gap-4 h-full">
                    {/* Selected Date Events */}
                    {selectedDate && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                            <div className="p-4 bg-deped-blue text-white">
                                <h4 className="font-bold text-sm">
                                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                </h4>
                            </div>
                            <div className="p-4 space-y-2">
                                {selectedDateEvents.length > 0 ? (
                                    selectedDateEvents.map(evt => (
                                        <div key={evt.id} className={`p-3 rounded-xl border ${EVENT_TYPES[evt.type]?.border} ${EVENT_TYPES[evt.type]?.bg}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className={`text-[9px] font-black uppercase ${EVENT_TYPES[evt.type]?.text}`}>
                                                        {EVENT_TYPES[evt.type]?.label}
                                                    </span>
                                                    <p className="font-bold text-sm text-gray-800">{evt.title}</p>
                                                    {evt.description && <p className="text-xs text-gray-500 mt-1">{evt.description}</p>}
                                                </div>
                                                {canManageEvents && (
                                                    <button onClick={() => handleDeleteEvent(evt.id)} className="p-1 hover:bg-red-100 rounded text-red-400 hover:text-red-600 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic text-center py-4">No events on this date</p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Monthly Activities */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                <CalendarIcon className="w-3 h-3 text-deped-blue" />
                                {currentDate.toLocaleString('default', { month: 'long' })} Activities
                            </h4>
                        </div>
                        <div className="p-2 space-y-1.5 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {monthActivities.length > 0 ? (
                                monthActivities.map(evt => (
                                    <div
                                        key={evt.id}
                                        onClick={() => { setSelectedDate(evt.date); setCurrentDate(new Date(evt.date + 'T00:00:00')); }}
                                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <div className={`w-2 h-8 rounded-full ${EVENT_TYPES[evt.type]?.color}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-800 truncate">{evt.title}</p>
                                            <p className="text-[10px] text-gray-400 font-bold">
                                                {new Date(evt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic text-center py-4">No activities this month</p>
                            )}
                        </div>
                    </div>

                    {/* Event Type Legend */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-auto">
                        <h4 className="font-bold text-gray-800 text-xs mb-3 uppercase tracking-wider">Legend</h4>
                        <div className="space-y-2">
                            {Object.entries(EVENT_TYPES).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${val.color}`} />
                                    <span className="text-xs font-bold text-gray-600">{val.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Event Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-deped-blue text-white px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-bold">Add Event</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/20 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Event Title *</label>
                                    <input
                                        type="text"
                                        value={formData.title || ''}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="form-input"
                                        placeholder="e.g., Midterm Exam"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date *</label>
                                        <input
                                            type="date"
                                            value={formData.date || ''}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="form-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={formData.end_date || ''}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(EVENT_TYPES).map(([key, val]) => (
                                            <button
                                                key={key}
                                                onClick={() => setFormData({ ...formData, type: key as CalendarEvent['type'] })}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.type === key
                                                        ? `${val.color} text-white border-transparent`
                                                        : `border-gray-200 text-gray-600 hover:border-gray-300`
                                                    }`}
                                            >
                                                {val.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                    <textarea
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="form-input"
                                        rows={2}
                                        placeholder="Optional description..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button onClick={handleAddEvent} className="px-6 py-2 bg-deped-blue text-white rounded-lg font-bold hover:bg-blue-700 shadow-md">
                                        Add Event
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
