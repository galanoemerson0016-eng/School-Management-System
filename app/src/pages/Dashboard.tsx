import { useMemo, useState } from 'react';
import type { SVGProps } from 'react';
import { useAppStore } from '../stores';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calendar, Bell, Trophy, AlertTriangle, Zap, ChevronLeft, ChevronRight, Clock, ListChecks, Search, Plus, Activity } from 'lucide-react';
import type { CalendarEvent, Student } from '../types';




const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const addDays = (date: Date, offset: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + offset);
    return next;
};

const getCalendarEventsForDate = (dateISO: string): CalendarEvent[] => {
    try {
        const stored = localStorage.getItem('school_calendar_events');
        if (!stored) return [];
        const allEvents: CalendarEvent[] = JSON.parse(stored);
        return allEvents
            .filter(e => e.date === dateISO)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 6);
    } catch {
        return [];
    }
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
    const setSelectedSubject = useAppStore((s) => s.setSelectedSubject);
    const isSyncReady = useAppStore((s) => s.isSyncReady);
    const attendanceRecords = useAppStore((s) => s.attendanceRecords);

    const [selectedMetric, setSelectedMetric] = useState<'at-risk' | 'top' | null>(null);
    const [calendarDayOffset, setCalendarDayOffset] = useState(0);

    const attendanceStats = useMemo(() => {
        const last14Days = Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (13 - i));
            return d.toISOString().split('T')[0];
        });

        return last14Days.map(date => {
            const count = attendanceRecords.filter(r => r.date === date && r.status === 'absent').length;
            return { date: date.split('-').slice(1).join('/'), count };
        });
    }, [attendanceRecords]);

    // Attendance insights
    const attendanceInsights = useMemo(() => {
        const totalAbsences = attendanceStats.reduce((sum: number, day: {count: number}) => sum + day.count, 0);
        const averageDailyAbsences = attendanceStats.length > 0 ? Math.round((totalAbsences / attendanceStats.length) * 10) / 10 : 0;
        const peakDay = attendanceStats.reduce((max: {date: string, count: number}, day: {date: string, count: number}) => day.count > max.count ? day : max, attendanceStats[0] || { date: '', count: 0 });
        
        return {
            totalAbsences,
            averageDailyAbsences,
            peakDay: peakDay?.date || 'N/A',
            peakCount: peakDay?.count || 0
        };
    }, [attendanceStats]);





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

    const { failingStudentList, topStudentList } = metricsResult;

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

        // Current quarter (heuristic: use latest quarter found in records or default to 1)
        const currentQtr = consolidatedRecords.length > 0 ? Math.max(...consolidatedRecords.map(r => r.quarter)) : 1;
        
        const filledSlots = consolidatedRecords.filter(r => r.quarter === currentQtr).length;
        return Math.min(100, Math.round((filledSlots / totalSlots) * 100));
    }, [officialSections, officialSubjects, filteredStudents, consolidatedRecords]);



    const totalStudents = filteredStudents.length;
    const maleCount = filteredStudents.filter(s => s.gender === 'Male').length;
    const femaleCount = totalStudents - maleCount;

    const genderPieData = [
        { name: 'Male', value: maleCount, color: '#003f87' },
        { name: 'Female', value: femaleCount, color: '#ec4899' }
    ];

    // Academic Health Score calculation
    const academicHealthScore = useMemo(() => {
        if (totalStudents === 0) return 100;
        
        const failingRate = (failingStudentList.length / totalStudents) * 100;
        const completionRate = gradingProgress;
        
        // Health score: weighted average of completion rate and inverse failing rate
        const healthScore = Math.round((completionRate * 0.6) + ((100 - failingRate) * 0.4));
        
        return Math.max(0, Math.min(100, healthScore));
    }, [totalStudents, failingStudentList.length, gradingProgress]);

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



    const handleViewRecord = (sectionName: string, subjectId: string) => {
        if (!sectionName || !subjectId) return;
        setSelectedSection(sectionName);
        setSelectedSubject(subjectId);
        setCurrentView('eclass');
    };



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
                <div className="max-w-xl w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">📭</div>
                    <h3 className="text-2xl font-black text-slate-900">No records yet</h3>
                    <p className="mt-2 text-sm text-slate-500">
                        The dashboard has finished syncing. Your school year currently has no student or grade records.
                    </p>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-app-bg text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Background Decorative Elements - Ambient Light Canvas */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-slate-50/30">
                <div className="absolute -top-[15%] -right-[10%] w-[50%] h-[50%] bg-blue-500/15 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[25%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/15 rounded-full blur-[120px]" style={{ animationDelay: '2s', animationDuration: '10s' }} />
                <div className="absolute bottom-[-15%] right-[15%] w-[45%] h-[45%] bg-emerald-500/12 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '4s', animationDuration: '12s' }} />
                <div className="absolute top-[50%] right-[40%] w-[30%] h-[30%] bg-violet-500/10 rounded-full blur-[110px]" style={{ animationDelay: '6s', animationDuration: '14s' }} />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto p-6 lg:p-10 space-y-10">

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
                            light: 'bg-blue-50',
                            textColor: 'text-blue-600',
                            gradient: 'from-blue-400/20 to-indigo-500/20'
                        },
                        { 
                            label: 'Grading Progress', 
                            value: `${gradingProgress}%`, 
                            sub: `${gradingProgress === 100 ? 'Fully completed' : 'Term 1 encoding'}`, 
                            icon: ListChecks, 
                            color: 'emerald', 
                            bg: 'bg-emerald-500', 
                            light: 'bg-emerald-50',
                            textColor: 'text-emerald-600',
                            gradient: 'from-emerald-400/20 to-teal-500/20'
                        },
                        { 
                            label: 'Attendance Rate', 
                            value: `${totalStudents > 0 ? Math.round(((totalStudents - attendanceInsights.averageDailyAbsences) / totalStudents) * 100) : 100}%`, 
                            sub: `${attendanceInsights.averageDailyAbsences} avg absences`, 
                            icon: Calendar, 
                            color: 'indigo', 
                            bg: 'bg-indigo-500', 
                            light: 'bg-indigo-50',
                            textColor: 'text-indigo-600',
                            gradient: 'from-indigo-400/20 to-purple-500/20'
                        },
                        { 
                            label: 'Academic Health', 
                            value: `${academicHealthScore}%`, 
                            sub: academicHealthScore >= 75 ? 'Healthy environment' : 'Action required', 
                            icon: Zap, 
                            color: academicHealthScore >= 90 ? 'emerald' : academicHealthScore >= 75 ? 'blue' : 'rose', 
                            bg: academicHealthScore >= 90 ? 'bg-emerald-500' : academicHealthScore >= 75 ? 'bg-blue-500' : 'bg-rose-500', 
                            light: academicHealthScore >= 90 ? 'bg-emerald-50' : academicHealthScore >= 75 ? 'bg-blue-50' : 'bg-rose-50',
                            textColor: academicHealthScore >= 90 ? 'text-emerald-600' : academicHealthScore >= 75 ? 'text-blue-600' : 'text-rose-600',
                            gradient: academicHealthScore >= 90 ? 'from-emerald-400/20 to-teal-500/20' : academicHealthScore >= 75 ? 'from-blue-400/20 to-indigo-500/20' : 'from-rose-400/20 to-pink-500/20'
                        }
                    ].map((metric, i) => (
                        <motion.div 
                            key={metric.label}
                            variants={itemVariants}
                            whileHover={{ y: -6 }}
                            className="bg-white/70 backdrop-blur-xl p-8 rounded-4xl shadow-[0_20px_40px_-16px_rgba(0,0,0,0.02)] border border-white/80 relative overflow-hidden group transition-all duration-300 hover:shadow-[0_32px_64px_-20px_rgba(15,23,42,0.08)]"
                        >
                            <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-[60px] translate-x-8 -translate-y-8 transition-all duration-500 opacity-60 group-hover:opacity-100 group-hover:scale-150 bg-linear-to-br ${metric.gradient}`} />
                            
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`p-4 ${metric.light} rounded-2xl ${metric.textColor} shadow-inner`}>
                                        <metric.icon className="w-7 h-7" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{metric.label}</p>
                                        <h3 className="text-4xl font-black text-slate-800 tracking-tight tabular-nums">{metric.value}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-auto">
                                    <div className={`h-1.5 flex-1 ${metric.light} rounded-full overflow-hidden relative border border-slate-100/50`}>
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: typeof metric.value === 'string' ? metric.value : '100%' }}
                                            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 + (i * 0.1) }}
                                            className={`h-full ${metric.bg} rounded-full relative`}
                                        >
                                            <span className="absolute right-0 top-0 bottom-0 w-2 bg-white/60 blur-[1px] animate-pulse" />
                                        </motion.div>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight italic">{metric.sub}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* ═══ 3. Insight Pillars ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch lg:h-[220px]">
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
                                    <h4 className="text-[15px] font-black tracking-tight leading-tight">Top Performers</h4>
                                    <p className="text-emerald-100/80 text-[8px] font-bold uppercase tracking-[0.2em] mt-0.5">GPA ≥ 90%</p>
                                </div>
                            </div>
                            <div className="relative z-10 flex flex-col items-center justify-center shrink-0">
                                <span className="text-3xl font-black block tabular-nums drop-shadow-md leading-none mb-0.5">{metricsResult.topPerformersCount}</span>
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
                    <div className="bg-white/70 backdrop-blur-xl p-4 lg:p-4.5 rounded-2xl border border-white/80 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.03)] flex flex-col h-full group hover:shadow-[0_28px_56px_-20px_rgba(15,23,42,0.08)] transition-all duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight">Gender Distribution</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Enrollment Diversity</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#003f87] ring-2 ring-blue-100" /><span className="text-[7.5px] font-black text-slate-500 uppercase">M</span></div>
                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#ec4899] ring-2 ring-pink-100" /><span className="text-[7.5px] font-black text-slate-500 uppercase">F</span></div>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center relative min-h-[105px] h-[105px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={genderPieData}
                                        innerRadius={34}
                                        outerRadius={48}
                                        paddingAngle={5}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {genderPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 12px 24px -4px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 900 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total</span>
                                <span className="text-2xl font-black text-slate-900 tabular-nums">{totalStudents}</span>
                            </div>
                        </div>
                    </div>
                    {/* Right — Academic Performance */}
                    <div className="bg-white/70 backdrop-blur-xl p-4 lg:p-4.5 rounded-2xl border border-white/80 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.03)] flex flex-col h-full group hover:shadow-[0_28px_56px_-20px_rgba(15,23,42,0.08)] transition-all duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight">Academic Performance</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Top Average Scores</p>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-[7px] font-black uppercase text-slate-500">Top Subject:</span>
                                    <span className="px-2 py-0.5 bg-indigo-100 rounded-full text-indigo-600 text-[7px] font-bold">{subjectAverages[0]?.name ?? 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[7px] font-black uppercase text-slate-500">Score:</span>
                                    <span className="text-green-600 text-[7px] font-black">{subjectAverages[0]?.avg ?? 'N/A'}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[7px] font-black uppercase text-slate-500">Pass Rate:</span>
                                    <span className="text-blue-600 text-[7px] font-black">{totalStudents === 0 ? 'N/A' : Math.round(((totalStudents - failingStudentList.length) / totalStudents) * 100)}%</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-between min-h-[105px] h-[105px] py-1">
                            {subjectAverages.map((item, index) => {
                                const score = item.avg;
                                const colorClass = score >= 95
                                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-500/10'
                                    : score >= 90
                                        ? 'bg-gradient-to-r from-blue-400 to-indigo-500 shadow-blue-500/10'
                                        : 'bg-gradient-to-r from-violet-400 to-purple-500 shadow-violet-500/10';

                                return (
                                    <div key={index} className="flex flex-col space-y-0.5">
                                        <div className="flex justify-between items-center text-[8.5px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                                            <span className="truncate max-w-[130px]">{item.name}</span>
                                            <span className="tabular-nums bg-slate-100 dark:bg-white/10 px-1.5 py-0.2 rounded text-[7.5px] font-bold text-slate-700 dark:text-slate-200">{item.avg}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden border border-slate-100/50 dark:border-white/5 relative">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.avg}%` }}
                                                transition={{ duration: 1.2, ease: "easeOut", delay: index * 0.08 }}
                                                className={`h-full ${colorClass} rounded-full`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100/60 flex justify-center">
                            <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-[0.12em] italic text-center">
                                Computed across all verified official sections
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. Operation Center - Complex Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* Bulletins Section */}
                    <div className="lg:col-span-7 bg-white p-6 lg:p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[380px]">
                        <div className="flex justify-between items-center mb-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                    <Bell className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Announcements</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{announcements.length} bulletins</p>
                                </div>
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCurrentView('announcements')}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                New Post
                            </motion.button>
                        </div>

                        <div className="flex-1 space-y-3 overflow-hidden pr-1">
                            {announcements.length > 0 ? (
                                announcements.slice(0, 3).map((announcement) => {
                                    const colors = announcement.announcement_type === 'urgent' 
                                        ? 'bg-rose-50 border-rose-100 text-rose-700' 
                                        : announcement.announcement_type === 'event' 
                                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                            : 'bg-blue-50 border-blue-100 text-blue-700';
                                    return (
                                        <div key={announcement.id} className={`p-4 rounded-2xl border ${colors} transition-transform hover:scale-[1.02] cursor-pointer`}>
                                            <div className="flex justify-between items-start mb-1.5">
                                                <h5 className="text-sm font-black tracking-tight line-clamp-1">{announcement.announcement_title}</h5>
                                                {announcement.is_cloud && (
                                                    <div className="p-1 bg-white/60 rounded-lg"><Activity className="w-3 h-3" /></div>
                                                )}
                                            </div>
                                            <p className="text-[11px] font-medium leading-relaxed opacity-80 line-clamp-2 mb-2.5">{announcement.announcement_content}</p>
                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{announcement.announcement_date}</span>
                                                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-white/50 rounded-md tracking-tighter">{announcement.announcement_type}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-40">
                                    <Search className="w-12 h-12" />
                                    <p className="text-xs font-black uppercase tracking-widest">No bulletins found</p>
                                </div>
                            )}
                        </div>
                        
                        <button onClick={() => setCurrentView('announcements')} className="mt-4 pt-4 border-t border-slate-50 text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] hover:text-blue-700 transition-colors flex items-center justify-center gap-2">
                            Access Bulletin Board <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                    {/* School Calendar */}
                    <div className="lg:col-span-5 bg-white p-6 lg:p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[380px]">
                        <div className="flex justify-between items-center mb-5 gap-3">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Calendar</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{calendarDayLabel}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCalendarDayOffset((v) => v - 1)}
                                    className="p-2 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors"
                                    aria-label="Previous day"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalendarDayOffset(0)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${calendarDayOffset === 0 ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                                >
                                    Today
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalendarDayOffset((v) => v + 1)}
                                    className="p-2 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors"
                                    aria-label="Next day"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <div className="p-2 bg-slate-100 text-slate-500 rounded-xl">
                                    <Calendar className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-hidden pr-1">
                            {calendarEvents.length > 0 ? (
                                calendarEvents.map((event) => (
                                    <motion.div 
                                        key={event.id} 
                                        whileHover={{ x: 5 }}
                                        className="grid grid-cols-[56px,1fr] gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group items-start"
                                        onClick={() => setCurrentView('calendar')}
                                    >
                                        <div className="w-14 h-14 bg-linear-to-b from-blue-50 to-blue-100 rounded-xl border border-blue-200 flex flex-col items-center justify-center shrink-0 group-hover:from-blue-600 group-hover:to-blue-700 group-hover:text-white transition-colors">
                                            <span className="text-[9px] font-black uppercase leading-none mb-1 opacity-60 group-hover:opacity-100">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                            <span className="text-lg font-black leading-none">{new Date(event.date).getDate()}</span>
                                        </div>
                                        <div className="min-w-0 pt-0.5">
                                            <p className="text-sm font-black text-slate-800 line-clamp-3 leading-tight wrap-break-word group-hover:text-blue-600 transition-colors mb-1">{event.title}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.22em]">{event.type}</p>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-40 text-center px-4">
                                    <Clock className="w-10 h-10 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">No events for this day</p>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setCurrentView('calendar')} className="mt-4 pt-4 border-t border-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors text-center">
                            Full Schedule →
                        </button>
                    </div>

                </div>

                {/* 5. Drill-down Modal (Styled as premium dialog) */}
                <AnimatePresence>
                    {selectedMetric && (
                        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-900/60">
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-white rounded-[3rem] shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-200"
                            >
                                <div className={`p-8 border-b flex justify-between items-center ${selectedMetric === 'at-risk' ? 'bg-rose-50/50' : 'bg-emerald-50/50'}`}>
                                    <div className="flex items-center gap-6">
                                        <div className={`p-4 rounded-2xl ${selectedMetric === 'at-risk' ? 'bg-rose-500 text-white shadow-xl shadow-rose-200' : 'bg-emerald-500 text-white shadow-xl shadow-emerald-200'}`}>
                                            {selectedMetric === 'at-risk' ? <AlertTriangle className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
                                        </div>
                                        <div>
                                            <h3 className={`text-3xl font-black ${selectedMetric === 'at-risk' ? 'text-rose-900' : 'text-emerald-900'}`}>
                                                {selectedMetric === 'at-risk' ? 'Academic Intervention' : 'Top Performers'}
                                            </h3>
                                            <p className="text-[11px] font-black text-slate-400 tracking-widest uppercase mt-1">
                                                {selectedMetric === 'at-risk' ? 'Students requiring immediate support' : 'Exceptional student performance'}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedMetric(null)} 
                                        className="w-12 h-12 rounded-2xl hover:bg-slate-100 flex items-center justify-center text-2xl transition-colors text-slate-400"
                                    >
                                        <X />
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar bg-slate-50/30">
                                    {(selectedMetric === 'at-risk' ? failingStudentList : topStudentList).length > 0 ? (
                                        (selectedMetric === 'at-risk' ? failingStudentList : topStudentList).map((student: GroupedStudentMetric) => (
                                            <div key={student.lrn} className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl">
                                                        {student.gender === 'Male' ? '👨‍🎓' : '👩‍🎓'}
                                                    </div>
                                                    <div>
                                                        <h5 className="text-xl font-black text-slate-900 uppercase">{student.last_name}, {student.first_name}</h5>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LRN: {student.lrn} • {student.student_section}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {student.details.map((detail: SubjectDetail, idx: number) => (
                                                        <div key={`${detail.subject_id}-${idx}`} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-slate-600 uppercase">{detail.subject_name}</span>
                                                            <div className={`w-px h-3 bg-slate-200`} />
                                                            <span className={`text-xs font-black ${selectedMetric === 'at-risk' ? 'text-rose-600' : 'text-emerald-600'}`}>{detail.grade}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        handleViewRecord(student.student_section || '', student.details[0].subject_id);
                                                        setSelectedMetric(null);
                                                    }}
                                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-900/20"
                                                >
                                                    View Profile
                                                </motion.button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-24 text-slate-300 font-black uppercase tracking-[0.3em] text-sm italic">
                                            No data records found
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-6 bg-white border-t flex justify-end">
                                    <button 
                                        onClick={() => setSelectedMetric(null)} 
                                        className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 text-xs uppercase tracking-widest"
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

// Added modern styles to tailwind config or global css usually, 
// but using standard tailwind classes here for maximum compatibility.

function X(props: SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}


