import { useMemo, useState, Fragment } from 'react';
import { useAppStore } from '../stores';
import { isDescriptiveGrading } from '../lib/grading';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calendar, Bell, Trophy, AlertTriangle, ChevronLeft, ChevronRight, Clock, ListChecks, Search, Plus, Activity, HelpCircle, Layers, X } from 'lucide-react';
import type { CalendarEvent, Student } from '../types';
import { OFFICIAL_CALENDAR_2026_2027 } from '../data/calendar-events';




const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const toTitleCase = (str: string): string => {
    if (!str) return '';
    return str
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
};

const addDays = (date: Date, offset: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + offset);
    return next;
};

const DASHBOARD_EVENT_TYPES: Record<string, { label: string; text: string; bg: string; border: string; bgBadge: string; borderBadge: string; textBadge: string; dotColor: string }> = {
    holiday: {
        label: 'Holiday',
        text: 'text-rose-700 dark:text-rose-300 group-hover:text-white',
        bg: 'from-rose-50 to-rose-100/60 dark:from-rose-950/70 dark:to-rose-900/50 group-hover:from-rose-600 group-hover:to-rose-700 group-hover:text-white',
        border: 'border-rose-200/60 dark:border-rose-800/60 group-hover:border-rose-600',
        bgBadge: 'bg-rose-50/80 dark:bg-rose-950/60',
        borderBadge: 'border-rose-200/60 dark:border-rose-800/60',
        textBadge: 'text-rose-700 dark:text-rose-300',
        dotColor: 'bg-rose-500'
    },
    suspension: {
        label: 'Class Suspension / Weather',
        text: 'text-amber-800 dark:text-amber-300 group-hover:text-white',
        bg: 'from-amber-50 to-amber-100/60 dark:from-amber-950/70 dark:to-amber-900/50 group-hover:from-amber-600 group-hover:to-amber-700 group-hover:text-white',
        border: 'border-amber-200/60 dark:border-amber-800/60 group-hover:border-amber-600',
        bgBadge: 'bg-amber-50/80 dark:bg-amber-950/60',
        borderBadge: 'border-amber-200/60 dark:border-amber-800/60',
        textBadge: 'text-amber-800 dark:text-amber-300',
        dotColor: 'bg-amber-600'
    },
    exam: {
        label: 'Assessment & Exams',
        text: 'text-blue-700 dark:text-blue-300 group-hover:text-white',
        bg: 'from-blue-50 to-blue-100/60 dark:from-blue-950/70 dark:to-blue-900/50 group-hover:from-blue-600 group-hover:to-blue-700 group-hover:text-white',
        border: 'border-blue-200/60 dark:border-blue-800/60 group-hover:border-blue-600',
        bgBadge: 'bg-blue-50/80 dark:bg-blue-950/60',
        borderBadge: 'border-blue-200/60 dark:border-blue-800/60',
        textBadge: 'text-blue-700 dark:text-blue-300',
        dotColor: 'bg-blue-500'
    },
    event: {
        label: 'School Programs',
        text: 'text-emerald-700 dark:text-emerald-300 group-hover:text-white',
        bg: 'from-emerald-50 to-emerald-100/60 dark:from-emerald-950/70 dark:to-emerald-900/50 group-hover:from-emerald-600 group-hover:to-emerald-700 group-hover:text-white',
        border: 'border-emerald-200/60 dark:border-emerald-800/60 group-hover:border-emerald-600',
        bgBadge: 'bg-emerald-50/80 dark:bg-emerald-950/60',
        borderBadge: 'border-emerald-200/60 dark:border-emerald-800/60',
        textBadge: 'text-emerald-700 dark:text-emerald-300',
        dotColor: 'bg-emerald-500'
    },
    deadline: {
        label: 'Admin Deadlines',
        text: 'text-amber-800 dark:text-amber-300 group-hover:text-white',
        bg: 'from-amber-50 to-amber-100/60 dark:from-amber-950/70 dark:to-amber-900/50 group-hover:from-amber-600 group-hover:to-amber-700 group-hover:text-white',
        border: 'border-amber-200/60 dark:border-amber-800/60 group-hover:border-amber-600',
        bgBadge: 'bg-amber-50/80 dark:bg-amber-950/60',
        borderBadge: 'border-amber-200/60 dark:border-amber-800/60',
        textBadge: 'text-amber-800 dark:text-amber-300',
        dotColor: 'bg-amber-500'
    },
    meeting: {
        label: 'Professional Dev',
        text: 'text-purple-700 dark:text-purple-300 group-hover:text-white',
        bg: 'from-purple-50 to-purple-100/60 dark:from-purple-950/70 dark:to-purple-900/50 group-hover:from-purple-600 group-hover:to-purple-700 group-hover:text-white',
        border: 'border-purple-200/60 dark:border-purple-800/60 group-hover:border-purple-600',
        bgBadge: 'bg-purple-50/80 dark:bg-purple-950/60',
        borderBadge: 'border-purple-200/60 dark:border-purple-800/60',
        textBadge: 'text-purple-700 dark:text-purple-300',
        dotColor: 'bg-purple-500'
    },
    break: {
        label: 'Wellness & Breaks',
        text: 'text-cyan-700 dark:text-cyan-300 group-hover:text-white',
        bg: 'from-cyan-50 to-cyan-100/60 dark:from-cyan-950/70 dark:to-cyan-900/50 group-hover:from-cyan-600 group-hover:to-cyan-700 group-hover:text-white',
        border: 'border-cyan-200/60 dark:border-cyan-800/60 group-hover:border-cyan-600',
        bgBadge: 'bg-cyan-50/80 dark:bg-cyan-950/60',
        borderBadge: 'border-cyan-200/60 dark:border-cyan-800/60',
        textBadge: 'text-cyan-700 dark:text-cyan-300',
        dotColor: 'bg-cyan-500'
    },
    national: {
        label: 'National / Regional',
        text: 'text-indigo-700 dark:text-indigo-300 group-hover:text-white',
        bg: 'from-indigo-50 to-indigo-100/60 dark:from-indigo-950/70 dark:to-indigo-900/50 group-hover:from-indigo-600 group-hover:to-indigo-700 group-hover:text-white',
        border: 'border-indigo-200/60 dark:border-indigo-800/60 group-hover:border-indigo-600',
        bgBadge: 'bg-indigo-50/80 dark:bg-indigo-950/60',
        borderBadge: 'border-indigo-200/60 dark:border-indigo-800/60',
        textBadge: 'text-indigo-700 dark:text-indigo-300',
        dotColor: 'bg-indigo-500'
    }
};

const getCalendarEventsForDate = (dateISO: string): CalendarEvent[] => {
    try {
        const stored = localStorage.getItem('school_calendar_events');
        const existingEvents: CalendarEvent[] = stored ? JSON.parse(stored) : [];
        
        // Merge logic: Ensure ALL official events are present
        const officialIds = new Set(OFFICIAL_CALENDAR_2026_2027.map(e => e.id));
        const userEvents = existingEvents.filter(e => !officialIds.has(e.id));
        const allEvents = [...OFFICIAL_CALENDAR_2026_2027, ...userEvents];

        return allEvents
            .filter(e => {
                if (e.date === dateISO) return true;
                if (e.end_date && dateISO >= e.date && dateISO <= e.end_date) return true;
                return false;
            })
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 6);
    } catch {
        return [];
    }
};

const getEventDateRangeString = (event: CalendarEvent) => {
    const start = new Date(event.date + 'T00:00:00');
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!event.end_date) return startStr;
    
    const end = new Date(event.end_date + 'T00:00:00');
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} – ${endStr}`;
};

interface SubjectDetail {
    subject_name: string;
    subject_id: string;
    section_id: string;
    section_name: string;
    grade: number;
    quarter: 1 | 2 | 3;
}

interface GroupedStudentMetric extends Student {
    details: SubjectDetail[];
}


export function Dashboard() {
    // Optimized selectors to prevent unnecessary re-renders
    const students = useAppStore((s) => s.students);
    const sections = useAppStore((s) => s.sections);
    const subjects = useAppStore((s) => s.subjects);

    const announcements = useAppStore((s) => s.announcements);
    const gradingSheetRecords = useAppStore((s) => s.gradingSheetRecords);
    const setCurrentView = useAppStore((s) => s.setCurrentView);
    const setSelectedSection = useAppStore((s) => s.setSelectedSection);
    const isSyncReady = useAppStore((s) => s.isSyncReady);
    const attendanceRecords = useAppStore((s) => s.attendanceRecords);
    const sf2Sheets = useAppStore((s) => s.sf2Sheets);
    const activeSchoolYear = useAppStore((s) => s.activeSchoolYear);
    const schoolYears = useAppStore((s) => s.schoolYears);

    const [selectedMetric, setSelectedMetric] = useState<'at-risk' | 'top' | null>(null);
    const [calendarDayOffset, setCalendarDayOffset] = useState(0);

    const [selectedSchoolYear, setSelectedSchoolYear] = useState(activeSchoolYear || '2026-2027');
    const [selectedQuarter, setSelectedQuarter] = useState<string>('overall'); // 'overall', '1', '2', '3'
    const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('all');
    const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
    const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
    const [hoveredDonutIndex, setHoveredDonutIndex] = useState<'Male' | 'Female' | null>(null);
    const [attendanceChartType, setAttendanceChartType] = useState<'calendar' | 'bar' | 'line'>('calendar');

    // Removed legacy attendance stats calculation from here





    const studentMap = useMemo(() => {
        const map = new Map<string, typeof students[number]>();
        for (const student of students) {
            map.set(student.lrn, student);
        }
        return map;
    }, [students]);

    const subjectMap = useMemo(() => {
        const map = new Map<string, typeof subjects[number]>();
        for (const subject of subjects) {
            map.set(subject.id, subject);
        }
        return map;
    }, [subjects]);

    const sectionMapById = useMemo(() => {
        const map = new Map<string, typeof sections[number]>();
        for (const section of sections) {
            map.set(section.id, section);
        }
        return map;
    }, [sections]);

    const officialSections = useMemo(() => sections.filter(s => !s.is_teaching_load || s.is_advisory), [sections]);
    const totalTeachingLoads = useMemo(() => {
        return sections.reduce((sum, s) => sum + (s.taught_subjects?.length || 0), 0);
    }, [sections]);

    const officialSubjects = useMemo(() => subjects.filter(s => {
        const section = sections.find(sec => sec.id === s.section_id);
        return !s.is_teaching_load || (section && section.is_advisory);
    }), [subjects, sections]);

    // Filtered Students and Section verification
    const filteredStudents = useMemo(() => {
        if (officialSections.length === 0) return [];
        const validSectionIds = new Set(officialSections.map(s => s.id));
        const validSectionNames = new Set(officialSections.map(s => s.section_name));
        return students.filter(s => 
            s.student_section && (validSectionIds.has(s.student_section) || validSectionNames.has(s.student_section))
        );
    }, [students, officialSections]);

    const advisoryStudents = useMemo(() => {
        const advisorySecs = sections.filter(s => s.is_advisory || (s as typeof sections[number] & { is_advisory_class?: boolean }).is_advisory_class);
        if (advisorySecs.length === 0) return [];
        const validSectionIds = new Set(advisorySecs.map(s => s.id));
        const validSectionNames = new Set(advisorySecs.map(s => s.section_name));
        return students.filter(s => 
            s.student_section && (validSectionIds.has(s.student_section) || validSectionNames.has(s.student_section))
        );
    }, [students, sections]);

    const attendanceStats = useMemo(() => {
        const today = new Date();
        const currentMonthIndex = today.getMonth();
        const currentYear = today.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();

        const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1;
            const d = new Date(currentYear, currentMonthIndex, dayNum);
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const localDateStr = `${year}-${month}-${day}`;
            
            return {
                localDateStr,
                d
            };
        });

        const MONTH_NAMES = [
            'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
        ];

        const monthName = MONTH_NAMES[currentMonthIndex];

        // Load Saturday preference and Calendar Events for holidays
        const includeSaturdays = localStorage.getItem('formease_sf2_include_saturdays') === 'true';
        let holidays: string[] = [];
        try {
            const storedEvents = localStorage.getItem('school_calendar_events');
            if (storedEvents) {
                const parsedEvents = JSON.parse(storedEvents);
                if (Array.isArray(parsedEvents)) {
                    holidays = parsedEvents
                        .filter((e: CalendarEvent) => e.type === 'holiday' || e.type === 'suspension')
                        .flatMap((e: CalendarEvent) => {
                            const dates: string[] = [];
                            try {
                                const curr = new Date(e.date + 'T00:00:00');
                                const end = e.end_date ? new Date(e.end_date + 'T00:00:00') : new Date(curr);
                                if (!isNaN(curr.getTime()) && !isNaN(end.getTime())) {
                                    while (curr <= end) {
                                        dates.push(curr.toISOString().split('T')[0]);
                                        curr.setDate(curr.getDate() + 1);
                                    }
                                }
                            } catch (err) {
                                console.error(err);
                            }
                            return dates;
                        });
                }
            }
        } catch (e) {
            console.error('Failed to load holidays for dashboard attendance stats', e);
        }

        const advisorySections = sections.filter(s => s.is_advisory || (s as typeof sections[number] & { is_advisory_class?: boolean }).is_advisory_class);
        const advisoryStudentLrns = new Set(advisoryStudents.map(s => s.lrn));
        const advisorySectionIds = new Set(advisorySections.map(s => s.id));
        const advisorySectionNames = new Set(advisorySections.map(s => s.section_name));

        return currentMonthDays.map(({ localDateStr, d }) => {
            const dayStr = d.getDate().toString();

            const dow = d.getDay();
            const isWeekend = dow === 0 || (dow === 6 && !includeSaturdays);
            const isHoliday = holidays.includes(localDateStr);
            const isSchoolDay = !isWeekend && !isHoliday;

            const absentStudentsForDay = new Set<string>();

            // 1. Check attendanceRecords table
            const recordsForDay = attendanceRecords.filter(r => r.date === localDateStr && r.status === 'absent');
            for (const record of recordsForDay) {
                if (advisoryStudentLrns.has(record.student_lrn)) {
                    absentStudentsForDay.add(record.student_lrn);
                }
            }

            // 2. Check sf2Sheets table
            const matchingSheets = sf2Sheets.filter(sheet => 
                sheet.school_year === activeSchoolYear &&
                sheet.month === monthName &&
                (advisorySectionIds.has(sheet.section_id) || advisorySectionNames.has(sheet.section_id))
            );

            for (const sheet of matchingSheets) {
                const colsWithDate = Object.keys(sheet.date_labels).filter(
                    colKey => sheet.date_labels[Number(colKey)]?.trim() === dayStr
                );
                for (const studentLrn of Object.keys(sheet.attendance)) {
                    const studentRecord = sheet.attendance[studentLrn];
                    if (!studentRecord) continue;
                    const isAbsent = studentRecord[`date_${dayStr}`] === 'absent' || 
                                     colsWithDate.some(col => studentRecord[col] === 'absent' || studentRecord[Number(col)] === 'absent');
                    if (isAbsent) {
                        absentStudentsForDay.add(studentLrn);
                    }
                }
            }

            const formattedDate = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
            return { date: formattedDate, count: absentStudentsForDay.size, isSchoolDay, d };
        });
    }, [attendanceRecords, sf2Sheets, sections, advisoryStudents, activeSchoolYear]);

    // Attendance insights
    const attendanceInsights = useMemo(() => {
        const schoolDays = attendanceStats.filter(day => day.isSchoolDay);
        const schoolDaysCount = schoolDays.length || 1; // avoid division by zero

        const totalAbsences = schoolDays.reduce((sum: number, day: {count: number}) => sum + day.count, 0);
        const averageDailyAbsences = Math.round((totalAbsences / schoolDaysCount) * 10) / 10;
        
        // Find peak day strictly from school days
        const peakDay = schoolDays.reduce(
            (max: {date: string, count: number}, day: {date: string, count: number}) => day.count > max.count ? day : max,
            schoolDays[0] || { date: '', count: 0 }
        );
        
        return {
            totalAbsences,
            averageDailyAbsences,
            peakDay: peakDay?.date || 'N/A',
            peakCount: peakDay?.count || 0
        };
    }, [attendanceStats]);

    const filteredStudentLrns = useMemo(() => {
        return new Set(filteredStudents.map(s => s.lrn));
    }, [filteredStudents]);

    // Optimize Grade Consolidation - The most expensive part
    const consolidatedRecords = useMemo(() => {
        if (gradingSheetRecords.length === 0) return [];
        
        const validSubjectIds = new Set(officialSubjects.map(s => s.id));
        const consolidatedMap = new Map<string, typeof gradingSheetRecords[0]>();
        
        for (const r of gradingSheetRecords) {
            // Early exit for invalid data
            if (!filteredStudentLrns.has(r.student_lrn) || !validSubjectIds.has(r.subject_id)) {
                continue;
            }

            const key = `${r.student_lrn}_${r.subject_id}_${r.quarter}`;
            const existing = consolidatedMap.get(key);
            
            if (!existing) {
                consolidatedMap.set(key, r);
            } else {
                // Heuristic to pick the "best" record (latest or non-ghost)
                const isNew = r.id.startsWith('grade_');
                const isExistingNew = existing.id.startsWith('grade_');

                if (isNew && !isExistingNew) {
                    consolidatedMap.set(key, r);
                } else if (isNew === isExistingNew) {
                    if (Number(r.final_grade || 0) > Number(existing.final_grade || 0)) {
                        consolidatedMap.set(key, r);
                    }
                }
            }
        }

        return Array.from(consolidatedMap.values());
    }, [gradingSheetRecords, filteredStudentLrns, officialSubjects]);


    // Single-pass processing for failing and top students
    const metricsResult = useMemo(() => {
        const failingMap = new Map<string, GroupedStudentMetric>();
        const topMap = new Map<string, GroupedStudentMetric>();
        const failingLrns = new Set<string>();
        const topLrns = new Set<string>();

        for (const r of consolidatedRecords) {
            const finalGrade = Number(r.final_grade) || 0;
            if (finalGrade === 0) continue;

            const hasScores = (r.final_grade !== '');
            
            if (!hasScores) continue;

            const student = studentMap.get(r.student_lrn);
            if (!student) continue;

            const subject = subjectMap.get(r.subject_id);
            const section = subject?.section_id ? sectionMapById.get(subject.section_id) : undefined;

            const detail: SubjectDetail = {
                subject_name: subject?.subject_name || 'Unknown',
                subject_id: r.subject_id,
                section_id: section?.id || '',
                section_name: section?.section_name || 'Unknown',
                grade: finalGrade,
                quarter: r.quarter as 1|2|3
            };

            if (finalGrade < 75) {
                if (!failingMap.has(student.lrn)) failingMap.set(student.lrn, { ...student, details: [] });
                failingMap.get(student.lrn)!.details.push(detail);
                failingLrns.add(r.student_lrn);
            } else if (finalGrade >= 90) {
                if (!topMap.has(student.lrn)) topMap.set(student.lrn, { ...student, details: [] });
                topMap.get(student.lrn)!.details.push(detail);
                topLrns.add(r.student_lrn);
            }
        }

        return { 
            failingStudentList: Array.from(failingMap.values()), 
            topStudentList: Array.from(topMap.values()),
            atRiskCount: failingLrns.size,
            topPerformersCount: topLrns.size
        };
    }, [consolidatedRecords, studentMap, subjectMap, sectionMapById]);

    const { failingStudentList } = metricsResult;

    // Current quarter (heuristic: use latest quarter found in records or default to 1)
    const currentQtr = useMemo(() => {
        return consolidatedRecords.length > 0 ? Math.max(...consolidatedRecords.map(r => r.quarter)) : 1;
    }, [consolidatedRecords]);

    // --- NEW: Grading Progress Pulse ---
    const gradingProgress = useMemo(() => {
        if (officialSections.length === 0 || officialSubjects.length === 0) return 0;
        
        // Count expected records for the current total official environment
        // Logic: Students x Subjects = Total Expected Grade Slots
        let totalSlots = 0;
        officialSections.forEach(sec => {
            const studentCount = filteredStudents.filter(s => s.student_section === sec.id || s.student_section === sec.section_name).length;
            const subjectCount = officialSubjects.filter(sub => sub.section_id === sec.id).length;
            totalSlots += (studentCount * subjectCount);
        });

        if (totalSlots === 0) return 0;
        
        const filledSlots = consolidatedRecords.filter(r => r.quarter === currentQtr).length;
        return Math.min(100, Math.round((filledSlots / totalSlots) * 100));
    }, [officialSections, officialSubjects, filteredStudents, consolidatedRecords, currentQtr]);

    const achieversCountForCard = useMemo(() => {
        const list = advisoryStudents.map(student => {
            if (isDescriptiveGrading(student.grade_level, activeSchoolYear)) return null;

            const records = consolidatedRecords.filter(r => 
                r.student_lrn === student.lrn && 
                r.school_year === activeSchoolYear &&
                r.quarter === currentQtr &&
                r.final_grade !== undefined && 
                r.final_grade !== null && 
                r.final_grade !== '' &&
                Number(r.final_grade) > 0
            );

            if (records.length === 0) return null;

            const hasGradeBelow80 = records.some(r => Number(r.final_grade) < 80);
            if (hasGradeBelow80) return null;

            const sum = records.reduce((sum, r) => sum + Number(r.final_grade), 0);
            const average = sum / records.length;
            return Math.round(average * 100) / 100;
        }).filter(avg => avg !== null && avg >= 90);

        return list.length;
    }, [advisoryStudents, consolidatedRecords, activeSchoolYear, currentQtr]);



    const { totalStudents, maleCount, femaleCount } = useMemo(() => {
        const total = filteredStudents.length;
        const male = filteredStudents.filter(s => s.gender === 'Male').length;
        return { totalStudents: total, maleCount: male, femaleCount: total - male };
    }, [filteredStudents]);

    // Subject performance averages
    const subjectAverages = useMemo(() => {
        const subjectTotals: Record<string, { sum: number, count: number }> = {};
        
        consolidatedRecords.forEach(r => {
            const grade = Number(r.final_grade);
            if (grade > 0) {
                const subject = subjectMap.get(r.subject_id);
                if (subject) {
                    const normName = subject.subject_name.trim();
                    if (!subjectTotals[normName]) {
                        subjectTotals[normName] = { sum: 0, count: 0 };
                    }
                    subjectTotals[normName].sum += grade;
                    subjectTotals[normName].count++;
                }
            }
        });

        return Object.entries(subjectTotals)
            .map(([name, s]) => ({
                name,
                avg: Math.round((s.sum / s.count) * 10) / 10
            }))
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 5); // Show top 5 subjects
    }, [consolidatedRecords, subjectMap]);

    // Upcoming events from calendar
    const selectedCalendarDate = useMemo(() => addDays(new Date(), calendarDayOffset), [calendarDayOffset]);
    const selectedCalendarDateISO = useMemo(() => getLocalDateString(selectedCalendarDate), [selectedCalendarDate]);
    const calendarEvents = useMemo(() => getCalendarEventsForDate(selectedCalendarDateISO), [selectedCalendarDateISO]);

    const calendarDayLabel = useMemo(() => {
        if (calendarDayOffset === 0) return 'Today';
        if (calendarDayOffset === 1) return 'Tomorrow';
        if (calendarDayOffset === -1) return 'Yesterday';
        return selectedCalendarDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }, [calendarDayOffset, selectedCalendarDate]);





    // --- Academic Achievers Data & Filter Memos ---
    const achieversList = useMemo(() => {
        const list = advisoryStudents.map(student => {
            if (isDescriptiveGrading(student.grade_level, selectedSchoolYear)) return null;

            const records = consolidatedRecords.filter(r => 
                r.student_lrn === student.lrn && 
                r.school_year === selectedSchoolYear &&
                (selectedQuarter === 'overall' ? true : r.quarter === Number(selectedQuarter)) &&
                r.final_grade !== undefined && 
                r.final_grade !== null && 
                r.final_grade !== '' &&
                Number(r.final_grade) > 0
            );

            if (records.length === 0) return null;

            let average = 0;
            let hasGradeBelow80 = false;

            if (selectedQuarter === 'overall') {
                const subjectIds = Array.from(new Set(records.map(r => r.subject_id)));
                if (subjectIds.length === 0) return null;

                let totalSubjectsYearlyGradeSum = 0;
                let validSubjectsCount = 0;

                for (const subId of subjectIds) {
                    const subRecords = records.filter(r => r.subject_id === subId);
                    const termGrades = [1, 2, 3].map(q => {
                        const rec = subRecords.find(r => r.quarter === q);
                        return rec ? Number(rec.final_grade) : 0;
                    }).filter(g => g > 0);

                    if (termGrades.length > 0) {
                        const yearlySubGrade = Math.round(termGrades.reduce((sum, g) => sum + g, 0) / termGrades.length);
                        if (yearlySubGrade < 80) {
                            hasGradeBelow80 = true;
                        }
                        totalSubjectsYearlyGradeSum += yearlySubGrade;
                        validSubjectsCount++;
                    }
                }

                if (validSubjectsCount === 0) return null;
                average = totalSubjectsYearlyGradeSum / validSubjectsCount;
            } else {
                hasGradeBelow80 = records.some(r => Number(r.final_grade) < 80);
                const sum = records.reduce((sum, r) => sum + Number(r.final_grade), 0);
                average = sum / records.length;
            }

            if (hasGradeBelow80) return null;

            const roundedAverage = Math.round(average * 100) / 100;

            return {
                student,
                average: roundedAverage
            };
        })
        .filter((item): item is { student: Student; average: number } => item !== null && item.average >= 90);

        return list.sort((a, b) => {
            if (b.average !== a.average) {
                return b.average - a.average;
            }
            const nameA = `${a.student.last_name}, ${a.student.first_name}`.toLowerCase();
            const nameB = `${b.student.last_name}, ${b.student.first_name}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [advisoryStudents, consolidatedRecords, selectedSchoolYear, selectedQuarter]);

    const filteredAchievers = useMemo(() => {
        return achieversList.filter(item => {
            const student = item.student;
            
            if (selectedGradeLevel !== 'all' && student.grade_level !== selectedGradeLevel) {
                return false;
            }

            if (selectedSectionFilter !== 'all') {
                const studentSec = student.student_section;
                const secObj = sections.find(sec => sec.id === studentSec || sec.section_name === studentSec);
                const filterSecObj = sections.find(sec => sec.id === selectedSectionFilter || sec.section_name === selectedSectionFilter);
                if (!secObj || !filterSecObj || secObj.section_name !== filterSecObj.section_name) {
                    return false;
                }
            }

            if (searchQuery.trim() !== '') {
                const search = searchQuery.toLowerCase();
                const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
                const lastFirst = `${student.last_name}, ${student.first_name}`.toLowerCase();
                const lrn = student.lrn.toLowerCase();
                if (!fullName.includes(search) && !lastFirst.includes(search) && !lrn.includes(search)) {
                    return false;
                }
            }

            return true;
        });
    }, [achieversList, selectedGradeLevel, selectedSectionFilter, searchQuery, sections]);

    const highestAverage = useMemo(() => {
        if (filteredAchievers.length === 0) return 0;
        return Math.max(...filteredAchievers.map(item => item.average));
    }, [filteredAchievers]);

    const lowestAverage = useMemo(() => {
        if (filteredAchievers.length === 0) return 0;
        return Math.min(...filteredAchievers.map(item => item.average));
    }, [filteredAchievers]);

    const gradeLevels = useMemo(() => {
        const grades = new Set<string>();
        advisoryStudents.forEach(s => {
            if (s.grade_level) grades.add(s.grade_level);
        });
        return Array.from(grades).sort((a, b) => {
            const numA = parseInt(a.replace(/^\D+/g, '')) || 0;
            const numB = parseInt(b.replace(/^\D+/g, '')) || 0;
            return numA - numB;
        });
    }, [advisoryStudents]);

    const sectionOptions = useMemo(() => {
        const sectionSet = new Set<string>();
        advisoryStudents.forEach(s => {
            if (s.student_section) {
                if (selectedGradeLevel === 'all' || s.grade_level === selectedGradeLevel) {
                    const secObj = sections.find(sec => sec.id === s.student_section || sec.section_name === s.student_section);
                    if (secObj) {
                        sectionSet.add(secObj.section_name);
                    } else {
                        sectionSet.add(s.student_section);
                    }
                }
            }
        });
        return Array.from(sectionSet).sort();
    }, [advisoryStudents, selectedGradeLevel, sections]);

    const schoolYearOptions = useMemo(() => {
        if (schoolYears.length === 0) {
            return [activeSchoolYear || '2026-2027'];
        }
        return schoolYears.map(sy => sy.label);
    }, [schoolYears, activeSchoolYear]);



    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (!isSyncReady) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-deped-blue border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing School Data...</p>
            </div>
        );
    }

    if (students.length === 0 && gradingSheetRecords.length === 0) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-xl w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm flex flex-col items-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">📭</div>
                    <h3 className="text-2xl font-black text-slate-900">No records yet</h3>
                    <p className="mt-2 mb-6 text-sm text-slate-500">
                        The dashboard has finished syncing. Your school year currently has no student or grade records.
                    </p>
                    <button
                        onClick={() => {
                            const event = new CustomEvent('formease-trigger-onboarding');
                            window.dispatchEvent(event);
                        }}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
                    >
                        <HelpCircle className="w-4 h-4" />
                        Start Onboarding Tour
                    </button>
                </div>
            </div>
        );
    }
    const renderDonutChart = () => {
        if (totalStudents === 0) {
            return (
                <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#e2e8f0"
                        strokeWidth="10"
                    />
                </svg>
            );
        }

        const radius = 38;
        const circumference = 2 * Math.PI * radius; // ~238.76
        const malePercent = maleCount / totalStudents;
        const femalePercent = femaleCount / totalStudents;

        const maleStrokeLength = malePercent * circumference;
        const femaleStrokeLength = femalePercent * circumference;

        return (
            <div className="relative flex items-center justify-center">
                <svg width="105" height="105" viewBox="0 0 100 100" className="transform -rotate-90">
                    {/* Male Segment */}
                    {maleCount > 0 && (
                        <motion.circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke="#003f87"
                            strokeWidth={hoveredDonutIndex === 'Male' ? 12 : 9}
                            strokeDasharray={`${maleStrokeLength} ${circumference}`}
                            strokeDashoffset={0}
                            strokeLinecap="round"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredDonutIndex('Male')}
                            onMouseLeave={() => setHoveredDonutIndex(null)}
                            initial={{ strokeDasharray: `0 ${circumference}` }}
                            animate={{ strokeDasharray: `${maleStrokeLength} ${circumference}` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    )}
                    {/* Female Segment */}
                    {femaleCount > 0 && (
                        <motion.circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke="#ec4899"
                            strokeWidth={hoveredDonutIndex === 'Female' ? 12 : 9}
                            strokeDasharray={`${femaleStrokeLength} ${circumference}`}
                            strokeDashoffset={-maleStrokeLength}
                            strokeLinecap="round"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredDonutIndex('Female')}
                            onMouseLeave={() => setHoveredDonutIndex(null)}
                            initial={{ strokeDasharray: `0 ${circumference}` }}
                            animate={{ strokeDasharray: `${femaleStrokeLength} ${circumference}` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                        />
                    )}
                </svg>
                {/* Center text overlay */}
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total</span>
                    <span className="text-xl font-black text-slate-900 tabular-nums">{totalStudents}</span>
                </div>
                {/* Tooltip on Hover */}
                {hoveredDonutIndex && (
                    <div className="absolute -bottom-8 bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg shadow-lg z-20 transition-all pointer-events-none text-center">
                        {hoveredDonutIndex}: {hoveredDonutIndex === 'Male' ? maleCount : femaleCount} ({hoveredDonutIndex === 'Male' ? Math.round(malePercent * 100) : Math.round(femalePercent * 100)}%)
                    </div>
                )}
            </div>
        );
    };

    const renderBarChart = () => {
        if (subjectAverages.length === 0) {
            return (
                <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
                    No grading records
                </div>
            );
        }

        const svgWidth = 240;
        const svgHeight = 100;
        const paddingBottom = 15;
        const paddingTop = 15;
        const paddingLeft = 15;
        const paddingRight = 15;
        
        const chartHeight = svgHeight - paddingTop - paddingBottom;
        const chartWidth = svgWidth - paddingLeft - paddingRight;
        
        const barWidth = 24;
        const numBars = subjectAverages.length;
        const gap = (chartWidth - (numBars * barWidth)) / (numBars - 1 || 1);
        const maxVal = 100;

        return (
            <div className="relative w-full h-full flex flex-col justify-end">
                <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="barGrad-0" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                        <linearGradient id="barGrad-1" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                        <linearGradient id="barGrad-2" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                        <linearGradient id="barGrad-3" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>
                        <linearGradient id="barGrad-4" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#f472b6" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 25, 50, 75, 100].map((tick) => {
                        const y = paddingTop + chartHeight - (tick / maxVal) * chartHeight;
                        return (
                            <line
                                key={tick}
                                x1={paddingLeft}
                                y1={y}
                                x2={svgWidth - paddingRight}
                                y2={y}
                                stroke="#f1f5f9"
                                strokeWidth="1"
                                strokeDasharray="2 2"
                            />
                        );
                    })}

                    {/* Bars */}
                    {subjectAverages.map((item, index) => {
                        const x = paddingLeft + index * (barWidth + gap);
                        const barHeight = (item.avg / maxVal) * chartHeight;
                        const y = paddingTop + chartHeight - barHeight;

                        const isHovered = hoveredBarIndex === index;

                        return (
                            <g 
                                key={index}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredBarIndex(index)}
                                onMouseLeave={() => setHoveredBarIndex(null)}
                            >
                                {/* Background bar area for easier hovering */}
                                <rect
                                    x={x - gap / 4}
                                    y={paddingTop}
                                    width={barWidth + gap / 2}
                                    height={chartHeight}
                                    fill="transparent"
                                />
                                
                                {/* Visible Animated Bar */}
                                <motion.rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    rx="4"
                                    ry="4"
                                    fill={`url(#barGrad-${index % 5})`}
                                    filter={isHovered ? "drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" : "none"}
                                    className="transition-all duration-200"
                                    initial={{ height: 0, y: paddingTop + chartHeight }}
                                    animate={{ height: barHeight, y: y }}
                                    transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
                                />

                                {/* Short Subject Abbreviation label at bottom */}
                                <text
                                    x={x + barWidth / 2}
                                    y={svgHeight - 2}
                                    textAnchor="middle"
                                    fontSize="7px"
                                    fontWeight="bold"
                                    fill="#64748b"
                                >
                                    {item.name.substring(0, 5).toUpperCase()}
                                </text>

                                {/* Floating Score above bar on Hover */}
                                {isHovered && (
                                    <text
                                        x={x + barWidth / 2}
                                        y={y - 4}
                                        textAnchor="middle"
                                        fontSize="8px"
                                        fontWeight="bold"
                                        fill="#1e293b"
                                    >
                                        {item.avg}%
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Custom Tooltip */}
                {hoveredBarIndex !== null && subjectAverages[hoveredBarIndex] && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg shadow-lg z-25 transition-all pointer-events-none text-center min-w-30">
                        <p className="line-clamp-1">{subjectAverages[hoveredBarIndex].name}</p>
                        <p className="text-emerald-400 mt-0.5">{subjectAverages[hoveredBarIndex].avg}% Average</p>
                    </div>
                )}
            </div>
        );
    };

    const renderAttendanceCalendarGrid = () => {
        const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        return (
            <div className="w-full flex flex-col space-y-2.5">
                {/* Active Hover Status Banner */}
                <div className="text-[9px] font-black uppercase tracking-wider text-center h-7 flex items-center justify-center bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-300 py-1.5 px-3">
                    {hoveredPointIndex !== null && attendanceStats[hoveredPointIndex] ? (
                        <span className="flex items-center gap-1.5">
                            <span className="text-slate-500 dark:text-slate-400">
                                Date: <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{attendanceStats[hoveredPointIndex].date} ({WEEKDAY_NAMES[attendanceStats[hoveredPointIndex].d.getDay()]})</strong>
                            </span>
                            <span className="text-slate-350 dark:text-slate-600">•</span>
                            <span>
                                Status: <strong className={
                                    !attendanceStats[hoveredPointIndex].isSchoolDay 
                                        ? "text-amber-600 dark:text-amber-400 font-extrabold" 
                                        : attendanceStats[hoveredPointIndex].count === 0 
                                            ? "text-emerald-600 dark:text-emerald-400 font-extrabold" 
                                            : "text-rose-600 dark:text-rose-400 font-extrabold"
                                }>
                                    {!attendanceStats[hoveredPointIndex].isSchoolDay 
                                        ? "Non-School Day (Off)" 
                                        : attendanceStats[hoveredPointIndex].count === 0 
                                            ? "Perfect Attendance" 
                                            : `${attendanceStats[hoveredPointIndex].count} ${attendanceStats[hoveredPointIndex].count === 1 ? 'Absence' : 'Absences'}`}
                                </strong>
                            </span>
                        </span>
                    ) : (
                        <span className="text-slate-350 dark:text-slate-500 animate-pulse font-bold">Hover over any day card to view details</span>
                    )}
                </div>

                {/* Horizontal scroll timeline */}
                <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <div className="flex justify-between items-center w-full gap-0.75 min-w-170 pb-1 pt-1">
                        {attendanceStats.map((stats, index) => {
                            const dayNum = index + 1;
                            const weekdayLetter = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][stats.d.getDay()];
                            const isSunday = stats.d.getDay() === 0;
                            const isSchoolDay = stats.isSchoolDay;
                            const hasAbsences = stats.count > 0;
                            const isToday = new Date().getDate() === dayNum && new Date().getMonth() === stats.d.getMonth() && new Date().getFullYear() === stats.d.getFullYear();

                            // Conditional Card Styling
                            let cardStyle = "bg-white dark:bg-slate-800/80 border-slate-150 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs";
                            if (!isSchoolDay) {
                                cardStyle = "bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/60 text-slate-400 dark:text-slate-500";
                            } else if (hasAbsences) {
                                cardStyle = "bg-rose-50/25 dark:bg-rose-950/30 border-rose-150 dark:border-rose-900/40 hover:border-rose-455 hover:shadow-[0_4px_8px_-2px_rgba(225,29,72,0.06)]";
                            } else {
                                cardStyle = "bg-emerald-50/15 dark:bg-emerald-950/30 border-emerald-100/70 dark:border-emerald-900/40 hover:border-emerald-350 hover:shadow-[0_4px_8px_-2px_rgba(16,185,129,0.06)]";
                            }

                            if (isToday) {
                                cardStyle += " ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900";
                            }

                            return (
                                <Fragment key={dayNum}>
                                    {isSunday && index > 0 && (
                                        <div className="w-[1.5px] bg-slate-200 dark:bg-slate-700 self-stretch my-1.5 mx-1 shrink-0 rounded-full" title="Week Divider" />
                                    )}
                                    <div 
                                        onMouseEnter={() => setHoveredPointIndex(index)}
                                        onMouseLeave={() => setHoveredPointIndex(null)}
                                        className={`flex-1 min-w-0 flex flex-col items-center justify-between py-1.5 rounded-lg border text-center transition-all duration-200 cursor-pointer select-none h-14 relative ${cardStyle}`}
                                    >
                                        {/* Top: Day number */}
                                        <span className={`text-[8.5px] font-black leading-none ${!isSchoolDay ? 'text-slate-400 dark:text-slate-500' : isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                            {dayNum}
                                        </span>

                                        {/* Middle: Status indicator */}
                                        <div className="flex items-center justify-center h-4">
                                            {isSchoolDay ? (
                                                hasAbsences ? (
                                                    <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 leading-none">
                                                        {stats.count}
                                                    </span>
                                                ) : (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                )
                                            ) : (
                                                <span className="text-[6.5px] font-bold text-slate-400 dark:text-slate-500 tracking-tighter uppercase leading-none">
                                                    Off
                                                </span>
                                            )}
                                        </div>

                                        {/* Bottom: Weekday letter */}
                                        <span className={`text-[6.5px] font-bold leading-none ${!isSchoolDay ? 'text-slate-400/80 dark:text-slate-500/80' : isToday ? 'text-indigo-600/80 dark:text-indigo-400/80' : 'text-slate-455 dark:text-slate-400'}`}>
                                            {weekdayLetter}
                                        </span>
                                    </div>
                                </Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderAttendanceTrendChart = () => {
        const svgWidth = 800;
        const svgHeight = 120;
        const paddingLeft = 30;
        const paddingRight = 20;
        const paddingTop = 15;
        const paddingBottom = 20;

        const chartWidth = svgWidth - paddingLeft - paddingRight;
        const chartHeight = svgHeight - paddingTop - paddingBottom;

        const counts = attendanceStats.map(d => d.count);
        const maxCount = Math.max(5, ...counts);

        const getYTicks = (max: number) => {
            if (max <= 5) {
                return Array.from({ length: max + 1 }, (_, i) => i);
            }
            const numTicks = 5;
            const rawStep = max / (numTicks - 1);
            const step = Math.ceil(rawStep);
            const ticks = [];
            for (let i = 0; i < numTicks; i++) {
                ticks.push(i * step);
            }
            return ticks;
        };

        const yTicks = getYTicks(maxCount);
        const maxTickVal = yTicks[yTicks.length - 1];

        const points = attendanceStats.map((d, i) => {
            const x = paddingLeft + (i / (attendanceStats.length - 1)) * chartWidth;
            const y = paddingTop + chartHeight - (maxTickVal > 0 ? (d.count / maxTickVal) * chartHeight : 0);
            return { x, y, date: d.date, count: d.count, isSchoolDay: d.isSchoolDay, d: d.d };
        });

        // Generate Path Data for line chart
        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const areaPath = points.length > 0
            ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
            : '';

        const barWidth = Math.max(8, Math.min(20, (chartWidth / attendanceStats.length) * 0.45));

        const MONTH_NAMES = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const currentMonthName = MONTH_NAMES[new Date().getMonth()];

        const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const schoolDays = attendanceStats.filter(day => day.isSchoolDay);
        const schoolDaysCount = schoolDays.length;
        const perfectAttendanceDaysCount = schoolDays.filter(day => day.count === 0).length;
        const peakDay = schoolDays.reduce(
            (max: {date: string, count: number}, day: {date: string, count: number}) => day.count > max.count ? day : max,
            schoolDays[0] || { date: '', count: 0 }
        );
        const peakDayLabel = peakDay && peakDay.count > 0 
            ? `${peakDay.date.split('/')[1]} (${peakDay.count} ${peakDay.count === 1 ? 'Abs' : 'Abs'})` 
            : 'None';

        const totalPossibleDays = (advisoryStudents.length || totalStudents || 1) * schoolDaysCount;
        const totalAbsences = schoolDays.reduce((sum: number, day: {count: number}) => sum + day.count, 0);
        const totalPresentDays = Math.max(0, totalPossibleDays - totalAbsences);
        const monthlyAttendanceRate = Math.round((totalPresentDays / totalPossibleDays) * 1000) / 10;

        return (
            <div className="bg-white dark:bg-slate-900/90 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-[0_28px_56px_-20px_rgba(15,23,42,0.08)] transition-all duration-300">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{currentMonthName} Attendance Absences Trend</h3>
                            <p className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Absence rates overview</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                        {/* Toggle Controls */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setAttendanceChartType('calendar')}
                                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${attendanceChartType === 'calendar' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                            >
                                Calendar
                            </button>
                            <button
                                onClick={() => setAttendanceChartType('bar')}
                                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${attendanceChartType === 'bar' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                            >
                                Bar
                            </button>
                            <button
                                onClick={() => setAttendanceChartType('line')}
                                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${attendanceChartType === 'line' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                            >
                                Line
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span>Daily Absences</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-150 dark:border-slate-700 dark:text-slate-300">
                            Average: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{attendanceInsights.averageDailyAbsences}</span>
                        </div>
                    </div>
                </div>

                {/* Dynamic Monthly Insights Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 mt-2">
                    <div className="bg-slate-50/60 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex flex-col justify-center">
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Active School Days</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{schoolDaysCount} Days</span>
                    </div>
                    <div className="bg-slate-50/60 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex flex-col justify-center">
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Monthly Attendance Rate</span>
                        <span className="text-sm font-black text-indigo-650 dark:text-indigo-400 mt-0.5">{monthlyAttendanceRate}%</span>
                    </div>
                    <div className="bg-slate-50/60 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex flex-col justify-center">
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Perfect Attendance Days</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{perfectAttendanceDaysCount} Days</span>
                    </div>
                    <div className="bg-slate-50/60 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl flex flex-col justify-center">
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Peak Absences Day</span>
                        <span className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5">{peakDayLabel}</span>
                    </div>
                </div>

                {attendanceChartType === 'calendar' ? (
                    renderAttendanceCalendarGrid()
                ) : (
                    <div className="relative h-30 w-full">
                        <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                                </linearGradient>
                                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4f46e5" />
                                    <stop offset="100%" stopColor="#818cf8" />
                                </linearGradient>
                                <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#a5b4fc" />
                                </linearGradient>
                            </defs>

                            {/* Non-School Days shading (Weekends & Holidays) */}
                            {points.map((p, i) => {
                                if (p.isSchoolDay) return null;
                                const rectX = p.x - (chartWidth / attendanceStats.length) / 2;
                                const colWidth = chartWidth / attendanceStats.length;
                                return (
                                    <rect
                                        key={`shade-${i}`}
                                        x={rectX}
                                        y={paddingTop}
                                        width={colWidth}
                                        height={chartHeight}
                                        fill="#f1f5f9"
                                        opacity={0.4}
                                    />
                                );
                            })}

                            {/* Horizontal Y-Gridlines */}
                            {yTicks.map((tickVal) => {
                                const y = paddingTop + chartHeight - (maxTickVal > 0 ? (tickVal / maxTickVal) * chartHeight : 0);
                                return (
                                    <g key={tickVal}>
                                        <line
                                            x1={paddingLeft}
                                            y1={y}
                                            x2={svgWidth - paddingRight}
                                            y2={y}
                                            stroke="#f8fafc"
                                            strokeWidth="1"
                                        />
                                        <text
                                            x={paddingLeft - 8}
                                            y={y + 3}
                                            textAnchor="end"
                                            fontSize="7px"
                                            fontWeight="bold"
                                            fill="#94a3b8"
                                        >
                                            {tickVal}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Bar Chart rendering */}
                            {attendanceChartType === 'bar' && points.map((p, i) => {
                                const isHovered = hoveredPointIndex === i;
                                const barHeight = paddingTop + chartHeight - p.y;
                                const rectX = p.x - barWidth / 2;
                                return (
                                    <g key={i}>
                                        <rect
                                            x={p.x - (chartWidth / attendanceStats.length) / 2}
                                            y={paddingTop}
                                            width={chartWidth / attendanceStats.length}
                                            height={chartHeight}
                                            fill="transparent"
                                            className="cursor-pointer"
                                            onMouseEnter={() => setHoveredPointIndex(i)}
                                            onMouseLeave={() => setHoveredPointIndex(null)}
                                        />
                                        <motion.rect
                                            x={rectX}
                                            y={p.y}
                                            width={barWidth}
                                            height={barHeight}
                                            rx={3}
                                            ry={3}
                                            fill={isHovered ? "url(#barGradHover)" : "url(#barGrad)"}
                                            initial={{ scaleY: 0, originY: 1 }}
                                            animate={{ scaleY: 1 }}
                                            transition={{ duration: 0.6, delay: i * 0.02, ease: "easeOut" }}
                                            style={{ transformOrigin: `${p.x}px ${paddingTop + chartHeight}px` }}
                                        />
                                        {isHovered && p.count > 0 && (
                                            <text
                                                x={p.x}
                                                y={p.y - 4}
                                                textAnchor="middle"
                                                fontSize="8px"
                                                fontWeight="bold"
                                                fill="#4f46e5"
                                            >
                                                {p.count}
                                            </text>
                                        )}
                                        {/* X-Axis Date label */}
                                        {i % 3 === 0 && (
                                            <text
                                                x={p.x}
                                                y={svgHeight - 2}
                                                textAnchor="middle"
                                                fontSize="7px"
                                                fontWeight="bold"
                                                fill="#94a3b8"
                                            >
                                                {p.date}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}

                            {/* Line Chart Area rendering */}
                            {attendanceChartType === 'line' && areaPath && (
                                <motion.path
                                    d={areaPath}
                                    fill="url(#areaGrad)"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.8 }}
                                />
                            )}

                            {/* Line Chart Path rendering */}
                            {attendanceChartType === 'line' && linePath && (
                                <motion.path
                                    d={linePath}
                                    fill="none"
                                    stroke="#6366f1"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                />
                            )}

                            {/* Line Chart Circles rendering */}
                            {attendanceChartType === 'line' && points.map((p, i) => {
                                const isHovered = hoveredPointIndex === i;
                                return (
                                    <g key={i}>
                                        <circle
                                            cx={p.x}
                                            cy={p.y}
                                            r="8"
                                            fill="transparent"
                                            className="cursor-pointer"
                                            onMouseEnter={() => setHoveredPointIndex(i)}
                                            onMouseLeave={() => setHoveredPointIndex(null)}
                                        />
                                        <circle
                                            cx={p.x}
                                            cy={p.y}
                                            r={isHovered ? "5.5" : "3.5"}
                                            fill={isHovered ? "#ffffff" : "#6366f1"}
                                            stroke="#6366f1"
                                            strokeWidth={isHovered ? "3" : "1.5"}
                                            className="transition-all duration-150 pointer-events-none"
                                        />
                                        {/* X-Axis Date label */}
                                        {i % 3 === 0 && (
                                            <text
                                                x={p.x}
                                                y={svgHeight - 2}
                                                textAnchor="middle"
                                                fontSize="7px"
                                                fontWeight="bold"
                                                fill="#94a3b8"
                                            >
                                                {p.date}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Floating Tooltip */}
                        {hoveredPointIndex !== null && points[hoveredPointIndex] && (
                            <div 
                                className="absolute bg-slate-955 text-white text-[9px] font-black uppercase tracking-wider py-2 px-3 rounded-xl shadow-xl z-25 pointer-events-none transition-all duration-75 text-center min-w-35 border border-slate-800"
                                style={{
                                    left: `${(points[hoveredPointIndex].x / svgWidth) * 100}%`,
                                    top: `${(points[hoveredPointIndex].y / svgHeight) * 100 - 36}%`,
                                    transform: 'translateX(-50%)',
                                }}
                            >
                                <div className="font-extrabold text-slate-400">{points[hoveredPointIndex].date} ({WEEKDAY_NAMES[points[hoveredPointIndex].d.getDay()]})</div>
                                {!points[hoveredPointIndex].isSchoolDay ? (
                                    <div className="text-amber-400 font-extrabold mt-1">Non-School Day</div>
                                ) : (
                                    <div className={points[hoveredPointIndex].count === 0 ? "text-emerald-400 font-extrabold mt-1" : "text-rose-400 font-extrabold mt-1"}>
                                        {points[hoveredPointIndex].count} {points[hoveredPointIndex].count === 1 ? 'Absence' : 'Absences'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-app-bg dark:bg-transparent text-slate-900 dark:text-slate-100 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Background Decorative Elements - Ambient Light Canvas */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-slate-50/30 dark:bg-transparent opacity-100 dark:opacity-30">
                <div className="absolute -top-[15%] -right-[10%] w-[50%] h-[50%] bg-blue-500/15 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[25%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/15 rounded-full blur-[120px]" style={{ animationDelay: '2s', animationDuration: '10s' }} />
                <div className="absolute bottom-[-15%] right-[15%] w-[45%] h-[45%] bg-emerald-500/12 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '4s', animationDuration: '12s' }} />
                <div className="absolute top-[50%] right-[40%] w-[30%] h-[30%] bg-violet-500/10 rounded-full blur-[110px]" style={{ animationDelay: '6s', animationDuration: '14s' }} />
            </div>

            <div className="relative z-10 max-w-400 mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">

                {/* Welcome & Tour Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl p-6 lg:p-8 rounded-4xl border border-white/80 dark:border-slate-800 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.02)] dark:shadow-none">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Welcome to FormEase Pro</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage classes, subjects, grades, and DepEd school forms in one unified workspace (School Year: {activeSchoolYear}).</p>
                    </div>
                    <button
                        onClick={() => {
                            const event = new CustomEvent('formease-trigger-onboarding');
                            window.dispatchEvent(event);
                        }}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0 cursor-pointer"
                    >
                        <HelpCircle className="w-4 h-4" />
                        Start Onboarding Tour
                    </button>
                </div>

                {/* 2. Key Metrics - High Impact Grid */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
                >
                    {[
                        { 
                            label: 'Student Population', 
                            value: totalStudents, 
                            sub: 'Active enrollment', 
                            icon: Users, 
                            color: 'blue', 
                            bg: 'bg-blue-500', 
                            light: 'bg-blue-50 dark:bg-blue-950/60',
                            textColor: 'text-blue-600 dark:text-blue-400',
                            gradient: 'from-blue-400/20 to-indigo-500/20'
                        },
                        { 
                            label: 'Grading Progress', 
                            value: `${gradingProgress}%`, 
                            sub: `${gradingProgress === 100 ? 'Fully completed' : 'Term 1 encoding'}`, 
                            icon: ListChecks, 
                            color: 'emerald', 
                            bg: 'bg-emerald-500', 
                            light: 'bg-emerald-50 dark:bg-emerald-950/60',
                            textColor: 'text-emerald-600 dark:text-emerald-400',
                            gradient: 'from-emerald-400/20 to-teal-500/20'
                        },
                        { 
                            label: 'Attendance Rate', 
                            value: `${advisoryStudents.length > 0 ? Math.round(((advisoryStudents.length - attendanceInsights.averageDailyAbsences) / advisoryStudents.length) * 100) : (totalStudents > 0 ? Math.round(((totalStudents - attendanceInsights.averageDailyAbsences) / totalStudents) * 100) : 100)}%`, 
                            sub: `${attendanceInsights.averageDailyAbsences} avg absences`, 
                            icon: Calendar, 
                            color: 'indigo', 
                            bg: 'bg-indigo-500', 
                            light: 'bg-indigo-50 dark:bg-indigo-950/60',
                            textColor: 'text-indigo-600 dark:text-indigo-400',
                            gradient: 'from-indigo-400/20 to-purple-500/20'
                        },
                        { 
                            label: 'Class Sections', 
                            value: sections.length, 
                            sub: `${totalTeachingLoads} teaching loads`, 
                            icon: Layers, 
                            color: 'indigo', 
                            bg: 'bg-indigo-500', 
                            light: 'bg-indigo-50 dark:bg-indigo-950/60',
                            textColor: 'text-indigo-600 dark:text-indigo-400',
                            gradient: 'from-indigo-400/20 to-purple-500/20'
                        }
                    ].map((metric, i) => (
                        <motion.div 
                            key={metric.label}
                            variants={itemVariants}
                            whileHover={{ y: -6 }}
                            className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-4xl shadow-[0_20px_40px_-16px_rgba(0,0,0,0.02)] dark:shadow-none border border-white/80 dark:border-slate-800 relative overflow-hidden group transition-all duration-300 hover:shadow-[0_32px_64px_-20px_rgba(15,23,42,0.08)]"
                        >
                            <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-[60px] translate-x-8 -translate-y-8 transition-all duration-500 opacity-60 group-hover:opacity-100 group-hover:scale-150 bg-linear-to-br ${metric.gradient}`} />
                            
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`p-4 ${metric.light} rounded-2xl ${metric.textColor} shadow-inner`}>
                                        <metric.icon className="w-7 h-7" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5">{metric.label}</p>
                                        <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight tabular-nums">{metric.value}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-auto">
                                    <div className={`h-1.5 flex-1 ${metric.light} rounded-full overflow-hidden relative border border-slate-100/50 dark:border-slate-800`}>
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: typeof metric.value === 'string' ? metric.value : '100%' }}
                                            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 + (i * 0.1) }}
                                            className={`h-full ${metric.bg} rounded-full relative`}
                                        >
                                            <span className="absolute right-0 top-0 bottom-0 w-2 bg-white/60 blur-[1px] animate-pulse" />
                                        </motion.div>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight italic">{metric.sub}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* 14-Day Attendance Absences Trend Chart */}
                {renderAttendanceTrendChart()}

                {/* ═══ 3. Insight Pillars ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch lg:h-55">
                    {/* Left — Action Cards */}
                    <div className="flex flex-col gap-3 h-full">
                        {/* Top Performers */}
                        <motion.button
                            variants={itemVariants}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedMetric('top')}
                            className="flex-1 w-full relative overflow-hidden bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-700 p-4 lg:p-4 rounded-2xl text-white flex justify-between items-center group shadow-xl shadow-emerald-600/15 transition-all duration-500 hover:shadow-emerald-500/25 border border-emerald-400/20"
                        >
                            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/8 rounded-full blur-2xl group-hover:scale-[1.8] transition-transform duration-700" />
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-black/15 to-transparent rounded-b-3xl" />
                            <div className="relative z-10 flex items-center gap-3">
                                <div className="w-9.5 h-9.5 bg-white/15 backdrop-blur-xl rounded-xl flex items-center justify-center ring-1 ring-white/20">
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-[15px] font-black tracking-tight leading-tight">Academic Achievers</h4>
                                    <p className="text-emerald-100/80 text-[8px] font-bold uppercase tracking-[0.2em] mt-0.5">GA ≥ 90%</p>
                                </div>
                            </div>
                            <div className="relative z-10 flex flex-col items-center justify-center shrink-0">
                                <span className="text-3xl font-black block tabular-nums drop-shadow-md leading-none mb-0.5">{achieversCountForCard}</span>
                                <span className="text-[7.5px] font-bold uppercase tracking-[0.15em] opacity-60 leading-none">Learners</span>
                            </div>
                        </motion.button>

                        {/* At-Risk Learners */}
                        <motion.button
                            variants={itemVariants}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedMetric('at-risk')}
                            className="flex-1 w-full relative overflow-hidden bg-linear-to-br from-rose-500 via-rose-600 to-pink-700 p-4 lg:p-4 rounded-2xl text-white flex justify-between items-center group shadow-xl shadow-rose-600/15 transition-all duration-500 hover:shadow-rose-500/25 border border-rose-400/20"
                        >
                            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/8 rounded-full blur-2xl group-hover:scale-[1.8] transition-transform duration-700" />
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-black/15 to-transparent rounded-b-3xl" />
                            <div className="relative z-10 flex items-center gap-3">
                                <div className="w-9.5 h-9.5 bg-white/15 backdrop-blur-xl rounded-xl flex items-center justify-center ring-1 ring-white/20">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-[15px] font-black tracking-tight leading-tight">At-Risk Learners</h4>
                                    <p className="text-rose-100/80 text-[8px] font-bold uppercase tracking-[0.2em] mt-0.5">GPA &lt; 75%</p>
                                </div>
                            </div>
                            <div className="relative z-10 flex flex-col items-center justify-center shrink-0">
                                <span className="text-3xl font-black block tabular-nums drop-shadow-md leading-none mb-0.5">{metricsResult.atRiskCount}</span>
                                <span className="text-[7.5px] font-bold uppercase tracking-[0.15em] opacity-60 leading-none">Learners</span>
                            </div>
                        </motion.button>
                    </div>

                    {/* Center — Gender Distribution */}
                    <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl p-4 lg:p-4.5 rounded-2xl border border-white/80 dark:border-slate-800 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col h-full group hover:shadow-[0_28px_56px_-20px_rgba(15,23,42,0.08)] transition-all duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Gender Distribution</h3>
                                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Enrollment Diversity</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#003f87] ring-2 ring-blue-100 dark:ring-blue-900" /><span className="text-[7.5px] font-black text-slate-500 dark:text-slate-400 uppercase">M</span></div>
                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#ec4899] ring-2 ring-pink-100 dark:ring-pink-900" /><span className="text-[7.5px] font-black text-slate-500 dark:text-slate-400 uppercase">F</span></div>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center relative min-h-26.25 h-26.25">
                            {renderDonutChart()}
                        </div>
                    </div>
                    {/* Right — Academic Performance */}
                    <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl p-4 lg:p-4.5 rounded-2xl border border-white/80 dark:border-slate-800 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col h-full group hover:shadow-[0_28px_56px_-20px_rgba(15,23,42,0.08)] transition-all duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Academic Performance</h3>
                                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Top Average Scores</p>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-[7px] font-black uppercase text-slate-500 dark:text-slate-400">Top Subject:</span>
                                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/80 rounded-full text-indigo-600 dark:text-indigo-300 text-[7px] font-bold">{subjectAverages[0]?.name ?? 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[7px] font-black uppercase text-slate-500 dark:text-slate-400">Score:</span>
                                    <span className="text-green-600 dark:text-green-400 text-[7px] font-black">{subjectAverages[0]?.avg ?? 'N/A'}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[7px] font-black uppercase text-slate-500 dark:text-slate-400">Pass Rate:</span>
                                    <span className="text-blue-600 dark:text-blue-400 text-[7px] font-black">{totalStudents === 0 ? 'N/A' : Math.round(((totalStudents - failingStudentList.length) / totalStudents) * 100)}%</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-between min-h-26.25 h-26.25 py-1">
                            {renderBarChart()}
                        </div>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100/60 dark:border-slate-800 flex justify-center">
                            <p className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] italic text-center">
                                Computed across all verified official sections
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. Operation Center - Complex Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* Bulletins Section */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 p-6 lg:p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-95">
                        <div className="flex justify-between items-center mb-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
                                    <Bell className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Announcements</h3>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest">{announcements.length} bulletins</p>
                                </div>
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCurrentView('announcements')}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 dark:shadow-none cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                New Post
                            </motion.button>
                        </div>

                        <div className="flex-1 space-y-3 overflow-hidden pr-1">
                            {announcements.length > 0 ? (
                                announcements.slice(0, 3).map((announcement) => {
                                    const colors = announcement.announcement_type === 'urgent' 
                                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-300' 
                                        : announcement.announcement_type === 'event' 
                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300' 
                                            : 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300';
                                    return (
                                        <div key={announcement.id} className={`p-4 rounded-2xl border ${colors} transition-transform hover:scale-[1.02] cursor-pointer`}>
                                            <div className="flex justify-between items-start mb-1.5">
                                                <h5 className="text-sm font-black tracking-tight line-clamp-1">{announcement.announcement_title}</h5>
                                                {announcement.is_cloud && (
                                                    <div className="p-1 bg-white/60 dark:bg-slate-800/60 rounded-lg"><Activity className="w-3 h-3" /></div>
                                                )}
                                            </div>
                                            <p className="text-[11px] font-medium leading-relaxed opacity-80 line-clamp-2 mb-2.5">{announcement.announcement_content}</p>
                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{announcement.announcement_date}</span>
                                                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-white/50 dark:bg-slate-800/50 rounded-md tracking-tighter">{announcement.announcement_type}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-4 opacity-40">
                                    <Search className="w-12 h-12" />
                                    <p className="text-xs font-black uppercase tracking-widest">No bulletins found</p>
                                </div>
                            )}
                        </div>
                        
                        <button onClick={() => setCurrentView('announcements')} className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                            Access Bulletin Board <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                    {/* School Calendar */}
                    <div className="lg:col-span-5 bg-white dark:bg-slate-900/90 p-6 lg:p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-95">
                        <div className="flex justify-between items-center mb-5 gap-3">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Calendar</h3>
                                <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">{calendarDayLabel}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCalendarDayOffset((v) => v - 1)}
                                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                    aria-label="Previous day"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalendarDayOffset(0)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors cursor-pointer ${calendarDayOffset === 0 ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                >
                                    Today
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalendarDayOffset((v) => v + 1)}
                                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                    aria-label="Next day"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl">
                                    <Calendar className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                            {calendarEvents.length > 0 ? (
                                calendarEvents.map((event) => {
                                    const typeStyle = DASHBOARD_EVENT_TYPES[event.type] || {
                                        label: toTitleCase(event.type),
                                        text: 'text-slate-600 group-hover:text-slate-600',
                                        bg: 'from-slate-50 to-slate-100/50 group-hover:from-slate-600 group-hover:to-slate-700 group-hover:text-white',
                                        border: 'border-slate-100 group-hover:border-slate-600',
                                        bgBadge: 'bg-slate-50/70',
                                        borderBadge: 'border-slate-200/50',
                                        textBadge: 'text-slate-700',
                                        dotColor: 'bg-slate-500'
                                    };

                                    return (
                                        <motion.div 
                                            key={event.id} 
                                            whileHover={{ y: -2 }}
                                            className="flex gap-4 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all duration-300 cursor-pointer group items-center"
                                            onClick={() => setCurrentView('calendar')}
                                        >
                                            <div className={`w-14 h-14 bg-linear-to-br ${typeStyle.bg} ${typeStyle.text} rounded-2xl border ${typeStyle.border} flex flex-col items-center justify-center shrink-0 transition-all duration-300`}>
                                                <span className="text-[9px] font-black uppercase leading-none mb-1 opacity-80 group-hover:opacity-100 group-hover:text-white transition-colors">
                                                    {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                                                </span>
                                                <span className="text-lg font-black leading-none group-hover:text-white transition-colors">
                                                    {new Date(event.date + 'T00:00:00').getDate()}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${typeStyle.bgBadge} ${typeStyle.borderBadge} ${typeStyle.textBadge}`}>
                                                        {typeStyle.label}
                                                    </span>
                                                    {event.end_date && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[8px] font-black uppercase tracking-wider">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                                                            Ongoing
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-black text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight mb-0.5">
                                                    {event.title}
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-400 font-bold">
                                                    <span>{getEventDateRangeString(event)}</span>
                                                    {event.description && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                                                            <span className="line-clamp-1 font-medium opacity-80">{event.description}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-8 text-center px-4 border border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                                    <Clock className="w-7 h-7 text-slate-300 dark:text-slate-600 mb-2 animate-pulse" />
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">No events scheduled</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold max-w-50">There are no official or user-created events for this day.</p>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setCurrentView('calendar')} className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center cursor-pointer">
                            Full Schedule →
                        </button>
                    </div>

                </div>

                {/* 5. Drill-down Modal (Styled as premium dialog) */}
                <AnimatePresence>
                    {selectedMetric === 'at-risk' && (
                        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-900/60">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
                            >
                                <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-rose-50/50 dark:bg-rose-950/30">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 rounded-2xl bg-rose-500 text-white shadow-xl shadow-rose-200 dark:shadow-none">
                                            <AlertTriangle className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-rose-900 dark:text-rose-200">Academic Intervention</h3>
                                            <p className="text-[11px] font-black text-slate-400 dark:text-slate-400 tracking-widest uppercase mt-1">Students requiring immediate support</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedMetric(null)} 
                                        className="w-12 h-12 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-2xl transition-colors text-slate-400 dark:text-slate-400 cursor-pointer"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20">
                                    {failingStudentList.length > 0 ? (
                                        failingStudentList.map((student: GroupedStudentMetric) => (
                                            <div key={student.lrn} className="bg-white dark:bg-slate-800 p-6 rounded-4xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-2xl">
                                                        {student.gender === 'Male' ? '👨‍🎓' : '👩‍🎓'}
                                                    </div>
                                                    <div>
                                                        <h5 className="text-xl font-black text-slate-900 dark:text-white">{toTitleCase(student.last_name)}, {toTitleCase(student.first_name)}</h5>
                                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">LRN: {student.lrn} • {student.student_section}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {student.details.map((detail: SubjectDetail, idx: number) => (
                                                        <div key={`${detail.subject_id}-${idx}`} className="px-4 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-100 dark:border-slate-600 rounded-xl flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase">{detail.subject_name}</span>
                                                            <div className="w-px h-3 bg-slate-200 dark:bg-slate-600" />
                                                            <span className="text-xs font-black text-rose-600 dark:text-rose-400">{detail.grade}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        const secObj = sections.find(sec => sec.id === student.student_section || sec.section_name === student.student_section);
                                                        setSelectedSection(secObj ? secObj.section_name : (student.student_section || ''));
                                                        setCurrentView('consolidated-grades');
                                                        setSelectedMetric(null);
                                                    }}
                                                    className="px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20 dark:shadow-none cursor-pointer"
                                                >
                                                    View Profile
                                                </motion.button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-24 text-slate-300 dark:text-slate-600 font-black uppercase tracking-[0.3em] text-sm italic">
                                            No data records found
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex justify-end">
                                    <button 
                                        onClick={() => setSelectedMetric(null)} 
                                        className="px-10 py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-xl shadow-slate-900/20 text-xs uppercase tracking-widest cursor-pointer"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {selectedMetric === 'top' && (
                        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-6 backdrop-blur-2xl bg-slate-900/60 overflow-hidden">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-app-bg dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-5xl w-full max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
                            >
                                {/* Sticky Header */}
                                <div className="p-6 md:p-8 border-b dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
                                    <div className="flex items-center gap-4 md:gap-6">
                                        <div className="p-3.5 md:p-4 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-200 dark:shadow-none">
                                            <Trophy className="w-6 h-6 md:w-8 md:h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                                Academic Achievers
                                            </h3>
                                            <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase mt-1">
                                                Students with a General Average of 90 and Above
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedMetric(null)} 
                                        className="w-10 h-10 md:w-12 md:h-12 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-2xl transition-colors text-slate-400 dark:text-slate-400 cursor-pointer"
                                        aria-label="Close"
                                    >
                                        <X className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>
                                </div>
                                
                                {/* Scrollable Container */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
                                    
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-150 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">Total Qualifiers</span>
                                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{filteredAchievers.length}</span>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-150 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">Highest Average</span>
                                            <span className="text-2xl font-black text-slate-800 dark:text-white mt-2">
                                                {highestAverage > 0 ? highestAverage.toFixed(2) : '0.00'}
                                            </span>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-150 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">Lowest Average</span>
                                            <span className="text-2xl font-black text-slate-800 dark:text-white mt-2">
                                                {lowestAverage > 0 ? lowestAverage.toFixed(2) : '0.00'}
                                            </span>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-150 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">School Year</span>
                                            <span className="text-sm font-black text-slate-700 dark:text-slate-200 mt-2 truncate">{selectedSchoolYear}</span>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-150 dark:border-slate-700 shadow-xs flex flex-col justify-between col-span-2 md:col-span-1">
                                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">Term</span>
                                            <span className="text-sm font-black text-slate-700 dark:text-slate-200 mt-2 truncate">
                                                {selectedQuarter === 'overall' ? 'End of School Year' : `Term ${selectedQuarter}`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Filters Controls Row */}
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-155 dark:border-slate-700 shadow-xs grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                                        
                                        {/* Search Student */}
                                        <div className="relative md:col-span-1">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="text" 
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search student..."
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100"
                                            />
                                        </div>

                                        {/* Grade Level */}
                                        <div>
                                            <select 
                                                value={selectedGradeLevel}
                                                onChange={(e) => {
                                                    setSelectedGradeLevel(e.target.value);
                                                    setSelectedSectionFilter('all');
                                                }}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                                            >
                                                <option value="all">All Grade Levels</option>
                                                {gradeLevels.map(grade => (
                                                    <option key={grade} value={grade}>{grade}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Section */}
                                        <div>
                                            <select 
                                                value={selectedSectionFilter}
                                                onChange={(e) => setSelectedSectionFilter(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                                            >
                                                <option value="all">All Sections</option>
                                                {sectionOptions.map(section => (
                                                    <option key={section} value={section}>{section}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* School Year */}
                                        <div>
                                            <select 
                                                value={selectedSchoolYear}
                                                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                                            >
                                                {schoolYearOptions.map(sy => (
                                                    <option key={sy} value={sy}>{sy}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Term */}
                                        <div>
                                            <select 
                                                value={selectedQuarter}
                                                onChange={(e) => setSelectedQuarter(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                                            >
                                                <option value="1">Term 1</option>
                                                <option value="2">Term 2</option>
                                                <option value="3">Term 3</option>
                                                <option value="overall">End of School Year</option>
                                            </select>
                                        </div>

                                    </div>

                                    {/* Student Card List */}
                                    <div className="space-y-4 max-h-[45vh] overflow-y-auto custom-scrollbar pr-1">
                                        {filteredAchievers.length > 0 ? (
                                            filteredAchievers.map((item, index) => {
                                                const student = item.student;
                                                const rank = index + 1;
                                                const average = item.average;
                                                
                                                // Honors details
                                                const honorsLabel = 'With Academic Excellence';
                                                const badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40';
                                                const cardAccent = 'hover:border-emerald-200 dark:hover:border-emerald-800/50';

                                                // Rank Badge styling
                                                let rankBadge = null;
                                                let avatarBg = 'bg-slate-50 dark:bg-slate-800';
                                                
                                                if (rank === 1) {
                                                    rankBadge = <span className="text-xl">🥇</span>;
                                                    avatarBg = 'bg-linear-to-tr from-yellow-100 via-amber-200 to-yellow-300 text-amber-900 dark:from-yellow-950 dark:to-amber-800';
                                                } else if (rank === 2) {
                                                    rankBadge = <span className="text-xl">🥈</span>;
                                                    avatarBg = 'bg-linear-to-tr from-slate-100 via-slate-200 to-slate-300 text-slate-900 dark:from-slate-900 dark:to-slate-700';
                                                } else if (rank === 3) {
                                                    rankBadge = <span className="text-xl">🥉</span>;
                                                    avatarBg = 'bg-linear-to-tr from-orange-100 via-orange-200 to-amber-300 text-orange-950 dark:from-orange-950 dark:to-amber-900';
                                                } else {
                                                    rankBadge = <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">#{rank}</span>;
                                                }

                                                return (
                                                    <div 
                                                        key={student.lrn} 
                                                        className={`bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-150 dark:border-slate-700 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 group ${cardAccent}`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            {/* Rank Badge */}
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                                                                {rankBadge}
                                                            </div>
                                                            
                                                            {/* Student Avatar */}
                                                            <div className={`w-12 h-12 ${avatarBg} rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform`}>
                                                                {student.gender === 'Male' ? '👨‍🎓' : '👩‍🎓'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h5 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight truncate">
                                                                        {toTitleCase(student.last_name)}, {toTitleCase(student.first_name)}{student.middle_name ? ' ' + toTitleCase(student.middle_name) : ''}
                                                                    </h5>
                                                                    <span className={`px-2 py-0.5 border text-[8px] font-bold uppercase rounded-md ${badgeStyles}`}>
                                                                        {honorsLabel}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                                                                    LRN: {student.lrn} <span className="mx-1.5 text-slate-300 dark:text-slate-700">•</span> {student.student_section || 'No Section'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700 w-full md:w-auto">
                                                            <div className="text-left md:text-right">
                                                                <span className="text-[8px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">General Average</span>
                                                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
                                                                    {average.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <motion.button
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => {
                                                                    const secObj = sections.find(sec => sec.id === student.student_section || sec.section_name === student.student_section);
                                                                    setSelectedSection(secObj ? secObj.section_name : (student.student_section || ''));
                                                                    setCurrentView('consolidated-grades');
                                                                    setSelectedMetric(null);
                                                                }}
                                                                className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm w-full md:w-auto text-center cursor-pointer"
                                                            >
                                                                View Profile
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-16 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 border-dashed rounded-3xl flex flex-col items-center justify-center p-6">
                                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-full flex items-center justify-center text-xl mb-3">
                                                    📭
                                                </div>
                                                <p className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider text-center max-w-md">
                                                    No students currently meet the General Average requirement of 90 and above.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                </div>
                                
                                {/* Bottom Action Footer */}
                                <div className="p-6 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex justify-end shrink-0">
                                    <button 
                                        onClick={() => setSelectedMetric(null)} 
                                        className="px-8 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-lg shadow-slate-900/15 text-xs uppercase tracking-widest cursor-pointer"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}


