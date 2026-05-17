import { useMemo, useState } from 'react';
import { useAppStore } from '../stores';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Layers, Calendar, RefreshCcw, Bell, Info, ShieldCheck, Download, FileSpreadsheet, Trophy, AlertTriangle, Zap, GraduationCap, ChevronRight, Star, Clock, ListChecks, Cake, Search, Plus, Activity } from 'lucide-react';
import type { CalendarEvent, Student } from '../types';
import { getTermLabel } from '../lib/terms';
import { exportStudentsToExcel, exportGradesToExcel, exportMasterDataToExcel } from '../services/excel-export';

const formatTimeAgo = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
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

interface ActivityEntry {
    id: string;
    type: 'sf9' | 'sf10' | 'sf8' | 'sf6' | 'sf5' | 'attendance';
    action: string;
    detail: string;
    timestamp: number;
    user_id: string;
}

const ACTIVITY_KEY = 'school_forms_activity_log';

function getActivityLog(): ActivityEntry[] {
    try {
        const raw = localStorage.getItem(ACTIVITY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

export function Dashboard() {
    // Optimized selectors to prevent unnecessary re-renders
    const students = useAppStore((s) => s.students);
    const sections = useAppStore((s) => s.sections);
    const subjects = useAppStore((s) => s.subjects);
    const activeSchoolYear = useAppStore((s) => s.activeSchoolYear);
    const announcements = useAppStore((s) => s.announcements);
    const gradingSheetRecords = useAppStore((s) => s.gradingSheetRecords);
    const setCurrentView = useAppStore((s) => s.setCurrentView);
    const setSelectedSection = useAppStore((s) => s.setSelectedSection);
    const setSelectedSubject = useAppStore((s) => s.setSelectedSubject);
    const isSyncReady = useAppStore((s) => s.isSyncReady);
    const lastBackupTime = useAppStore((s) => s.lastBackupTime);
    const createBackup = useAppStore((s) => s.createBackup);
    const attendanceRecords = useAppStore((s) => s.attendanceRecords);
    const classRecords = useAppStore((s) => s.classRecords);

    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
    const [selectedMetric, setSelectedMetric] = useState<'at-risk' | 'top' | null>(null);
    const [failingViewMode, setFailingViewMode] = useState<'grouped' | 'detailed'>('grouped');

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

    const handleBulkExport = () => {
        exportMasterDataToExcel(
            students,
            sections,
            subjects,
            gradingSheetRecords,
            useAppStore.getState().enrollments
        );
    };

    const handleStudentExport = () => {
        exportStudentsToExcel(students, sections);
    };

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

    // Group failing students by section for better organization
    const groupedFailingStudents = useMemo(() => {
        const sectionGroups: Record<string, GroupedStudentMetric[]> = {};
        
        failingStudentList.forEach(student => {
            const sectionName = sections.find(s => s.id === student.student_section || s.section_name === student.student_section)?.section_name || student.student_section;
            if (!sectionGroups[sectionName as string]) {
                sectionGroups[sectionName as string] = [];
            }
            sectionGroups[sectionName as string].push(student);
        });

        return Object.entries(sectionGroups)
            .map(([sectionName, students]) => ({
                sectionName,
                students,
                totalFailing: students.length,
                totalSubjects: students.reduce((sum: number, s: GroupedStudentMetric) => sum + s.details.length, 0),
                averageGrade: students.length > 0 ? 
                    Math.round(students.reduce((sum: number, s: GroupedStudentMetric) => sum + Math.min(...s.details.map((d: SubjectDetail) => d.grade)), 0) / students.length * 10) / 10 : 0
            }))
            .sort((a, b) => b.totalFailing - a.totalFailing);
    }, [failingStudentList, sections]);

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

    // --- NEW: Setup Health Checks ---
    const schoolProfile = useAppStore(s => s.schoolProfile);
    const setupIncomplete = useMemo(() => {
        return !schoolProfile.name || !schoolProfile.school_id || !schoolProfile.region || !schoolProfile.adviser_name;
    }, [schoolProfile]);

    // Optimized Enrollment Data (Single pass)
    const enrollmentData = useMemo(() => {
        const gradeLevelCounts: Record<string, { male: number; female: number }> = {};
        const sectionCounts: Record<string, { male: number; female: number }> = {};

        for (const s of filteredStudents) {
            if (!gradeLevelCounts[s.grade_level]) gradeLevelCounts[s.grade_level] = { male: 0, female: 0 };
            
            // Resolve section label (ID to Name if necessary)
            let sectionLabel = s.student_section || 'Unassigned';
            const resolved = sections.find(sec => sec.id === sectionLabel || sec.section_name === sectionLabel);
            if (resolved) sectionLabel = resolved.section_name;

            if (!sectionCounts[sectionLabel]) sectionCounts[sectionLabel] = { male: 0, female: 0 };
            
            if (s.gender === 'Male') {
                gradeLevelCounts[s.grade_level].male++;
                sectionCounts[sectionLabel].male++;
            } else if (s.gender === 'Female') {
                gradeLevelCounts[s.grade_level].female++;
                sectionCounts[sectionLabel].female++;
            }
        }

        const activeGrades = Object.entries(gradeLevelCounts).filter(([, d]) => (d.male + d.female) > 0);

        // If only one grade level is present, show breakdown by section for better detail
        if (activeGrades.length === 1) {
            return Object.entries(sectionCounts)
                .map(([section, data]) => ({
                    label: section,
                    male: data.male,
                    female: data.female,
                    total: data.male + data.female
                }))
                .sort((a, b) => a.label.localeCompare(b.label));
        }

        const fixedGrades = [
            'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
            'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
        ];
        return fixedGrades
            .map(grade => ({
                label: grade.replace('Grade ', 'G'),
                male: gradeLevelCounts[grade]?.male || 0,
                female: gradeLevelCounts[grade]?.female || 0,
                total: (gradeLevelCounts[grade]?.male || 0) + (gradeLevelCounts[grade]?.female || 0)
            }))
            .filter(item => item.total > 0);
    }, [filteredStudents, sections]);
    const categoryEnrollmentData = useMemo(() => {
        const categories: Record<string, number> = {
            'ELEMENTARY': 0,
            'JUNIOR HIGH SCHOOL': 0,
            'SENIOR HIGH SCHOOL': 0
        };
        
        filteredStudents.forEach(s => {
            const gl = (s.grade_level || '').toLowerCase();
            const num = parseInt(gl.replace(/\D/g, '')) || 0;
            
            if (gl.includes('kinder') || (num >= 1 && num <= 6)) {
                categories['ELEMENTARY']++;
            } else if (num >= 7 && num <= 10) {
                categories['JUNIOR HIGH SCHOOL']++;
            } else if (num >= 11 && num <= 12) {
                categories['SENIOR HIGH SCHOOL']++;
            }
        });
        
        return Object.entries(categories)
            .filter(([_, count]) => count > 0)
            .map(([name, value]) => ({ name, value }));
    }, [filteredStudents]);

    const COLORS = ['#3b82f6', '#10b981', '#a855f7', '#94a3b8'];


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
        const subjectTotals: Record<string, { sum: number, count: number, name: string }> = {};
        
        consolidatedRecords.forEach(r => {
            const grade = Number(r.final_grade);
            if (grade > 0) {
                const subject = subjectMap.get(r.subject_id);
                if (subject) {
                    if (!subjectTotals[subject.id]) {
                        subjectTotals[subject.id] = { sum: 0, count: 0, name: subject.subject_name };
                    }
                    subjectTotals[subject.id].sum += grade;
                    subjectTotals[subject.id].count++;
                }
            }
        });

        return Object.values(subjectTotals)
            .map(s => ({
                name: s.name,
                avg: Math.round((s.sum / s.count) * 10) / 10
            }))
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 5); // Show top 5 subjects
    }, [consolidatedRecords, subjectMap]);

    // Upcoming events from calendar
    const upcomingEvents = useMemo(() => {
        try {
            const stored = localStorage.getItem('school_calendar_events');
            if (!stored) return [];
            const allEvents: CalendarEvent[] = JSON.parse(stored);
            const today = new Date().toISOString().split('T')[0];
            
            return allEvents
                .filter(e => e.date >= today)
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 4);
        } catch (e) {
            return [];
        }
    }, []);

    // Form Readiness Metrics
    const formReadiness = useMemo(() => {
        if (totalStudents === 0 || subjects.length === 0) return { sf9: 0, sf10: 0 };
        
        // SF9 Progress (Total grades encoded / Total expected)
        const uniqueRecords = new Set(gradingSheetRecords.map(r => `${r.student_lrn}_${r.subject_id}_${r.quarter}`));
        const totalExpectedSF9 = totalStudents * subjects.length * 3;
        const sf9 = totalExpectedSF9 > 0 ? Math.min(100, Math.round((uniqueRecords.size / totalExpectedSF9) * 100)) : 0;

        // SF10 Readiness (Students with complete records for the year)
        const studentGradesCount: Record<string, number> = {};
        gradingSheetRecords.forEach(r => {
            if (Number(r.final_grade) > 0) {
                studentGradesCount[r.student_lrn] = (studentGradesCount[r.student_lrn] || 0) + 1;
            }
        });
        const requiredCount = subjects.length * 3;
        const readyStudents = Object.values(studentGradesCount).filter(count => count >= requiredCount).length;
        const sf10 = totalStudents > 0 ? Math.min(100, Math.round((readyStudents / totalStudents) * 100)) : 0;

        return { sf9, sf10 };
    }, [gradingSheetRecords, totalStudents, subjects]);

    // Digital Audit (Activity Logs)
    const recentActivity = useMemo(() => getActivityLog().slice(0, 4), []);

    // Birthdays
    const todayBirthdays = useMemo(() => {
        const today = new Date();
        const m = today.getMonth() + 1;
        const d = today.getDate();
        return filteredStudents.filter(s => {
            if (!s.birthday) return false;
            const b = new Date(s.birthday);
            return (b.getMonth() + 1) === m && b.getDate() === d;
        });
    }, [filteredStudents]);

    const handleViewRecord = (sectionName: string, subjectId: string) => {
        if (!sectionName || !subjectId) return;
        setSelectedSection(sectionName);
        setSelectedSubject(subjectId);
        setCurrentView('eclass');
    };

    const handleCreateAnnouncement = () => {
        if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;
        
        const announcement = {
            id: `announcement_${Date.now()}`,
            announcement_title: newAnnouncement.title,
            announcement_content: newAnnouncement.content,
            announcement_date: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }),
            announcement_type: 'general' as const
        };
        
        // Add to store (assuming announcements are managed in store)
        useAppStore.getState().setAnnouncements([...announcements, announcement]);
        
        setNewAnnouncement({ title: '', content: '' });
        setShowCreateAnnouncement(false);
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
    }    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-[20%] -left-[5%] w-[30%] h-[30%] bg-indigo-400/10 rounded-full blur-[100px]" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-[-10%] right-[20%] w-[35%] h-[35%] bg-emerald-400/10 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '4s' }} />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto p-6 lg:p-10 space-y-10">
                {/* 1. Glass Header with Quick Actions */}
                <motion.header 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/40 backdrop-blur-xl border border-white/60 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40"
                >
                    <div className="flex items-center gap-6">
                        <motion.div 
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200 ring-4 ring-white/80"
                        >
                            <GraduationCap className="w-10 h-10 text-white" />
                        </motion.div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{schoolProfile.name || 'Calibungan High School'}</h1>
                                <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-blue-200">PRO</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-slate-500">
                                <p className="flex items-center gap-2 text-sm font-bold bg-slate-100 px-3 py-1 rounded-lg">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    {activeSchoolYear}
                                </p>
                                <p className="flex items-center gap-2 text-sm font-bold bg-slate-100 px-3 py-1 rounded-lg">
                                    <Layers className="w-4 h-4 text-indigo-500" />
                                    {schoolProfile.division || 'Tarlac Province'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden xl:flex flex-col items-end mr-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Current Date</p>
                            <p className="text-lg font-black text-slate-800">
                                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleBulkExport}
                                className="group flex items-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800"
                            >
                                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                Export Masterlist
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => window.location.reload()}
                                className="p-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl shadow-lg hover:shadow-slate-200 transition-all"
                            >
                                <RefreshCcw className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </div>
                </motion.header>

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
                            textColor: 'text-blue-600'
                        },
                        { 
                            label: 'Grading Progress', 
                            value: `${gradingProgress}%`, 
                            sub: `${gradingProgress === 100 ? 'Fully completed' : 'Term 1 encoding'}`, 
                            icon: ListChecks, 
                            color: 'emerald', 
                            bg: 'bg-emerald-500', 
                            light: 'bg-emerald-50',
                            textColor: 'text-emerald-600'
                        },
                        { 
                            label: 'Attendance Rate', 
                            value: `${totalStudents > 0 ? Math.round(((totalStudents - attendanceInsights.averageDailyAbsences) / totalStudents) * 100) : 100}%`, 
                            sub: `${attendanceInsights.averageDailyAbsences} avg absences`, 
                            icon: Calendar, 
                            color: 'indigo', 
                            bg: 'bg-indigo-500', 
                            light: 'bg-indigo-50',
                            textColor: 'text-indigo-600'
                        },
                        { 
                            label: 'Academic Health', 
                            value: `${academicHealthScore}%`, 
                            sub: academicHealthScore >= 75 ? 'Healthy environment' : 'Action required', 
                            icon: Zap, 
                            color: academicHealthScore >= 90 ? 'emerald' : academicHealthScore >= 75 ? 'blue' : 'rose', 
                            bg: academicHealthScore >= 90 ? 'bg-emerald-500' : academicHealthScore >= 75 ? 'bg-blue-500' : 'bg-rose-500', 
                            light: academicHealthScore >= 90 ? 'bg-emerald-50' : academicHealthScore >= 75 ? 'bg-blue-50' : 'bg-rose-50',
                            textColor: academicHealthScore >= 90 ? 'text-emerald-600' : academicHealthScore >= 75 ? 'text-blue-600' : 'text-rose-600'
                        }
                    ].map((metric, i) => (
                        <motion.div 
                            key={metric.label}
                            variants={itemVariants}
                            whileHover={{ y: -8 }}
                            className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group transition-all hover:shadow-2xl hover:shadow-slate-200"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 ${metric.light} rounded-full blur-[60px] translate-x-10 -translate-y-10 transition-transform group-hover:scale-150`} />
                            
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`p-4 ${metric.light} rounded-2xl ${metric.textColor}`}>
                                        <metric.icon className="w-8 h-8" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{metric.label}</p>
                                        <h3 className="text-4xl font-black text-slate-900 tracking-tight">{metric.value}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-auto">
                                    <div className={`h-1.5 flex-1 ${metric.light} rounded-full overflow-hidden`}>
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: typeof metric.value === 'string' ? metric.value : '100%' }}
                                            transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                            className={`h-full ${metric.bg} rounded-full`}
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase italic">{metric.sub}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* 3. Performance Insights & Quick Drill-down */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Performance Cards (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <motion.button
                            whileHover={{ x: 8 }}
                            onClick={() => setSelectedMetric('top')}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 p-8 rounded-[2rem] text-white flex justify-between items-center group shadow-xl shadow-emerald-900/10 transition-all hover:shadow-emerald-900/20"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                    <Trophy className="w-8 h-8" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-2xl font-black tracking-tight">Top Performers</h4>
                                    <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-1">GPA ≥ 90%</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-black block">{metricsResult.topPerformersCount}</span>
                                <span className="text-[9px] font-bold uppercase opacity-60">Learners</span>
                            </div>
                        </motion.button>

                        <motion.button
                            whileHover={{ x: 8 }}
                            onClick={() => setSelectedMetric('at-risk')}
                            className="w-full bg-gradient-to-r from-rose-600 to-pink-700 p-8 rounded-[2rem] text-white flex justify-between items-center group shadow-xl shadow-rose-900/10 transition-all hover:shadow-rose-900/20"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-2xl font-black tracking-tight">At-Risk Learners</h4>
                                    <p className="text-rose-100 text-[10px] font-bold uppercase tracking-widest mt-1">GPA &lt; 75%</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-black block">{metricsResult.atRiskCount}</span>
                                <span className="text-[9px] font-bold uppercase opacity-60">Learners</span>
                            </div>
                        </motion.button>

                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-xl ${lastBackupTime && (Date.now() - lastBackupTime < 86400000) ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">System Integrity</h4>
                                    <p className="text-[10px] font-bold text-slate-400">Last Sync: {formatTimeAgo(lastBackupTime)}</p>
                                </div>
                            </div>
                            <div className={`p-4 rounded-2xl text-center border-2 border-dashed ${lastBackupTime && (Date.now() - lastBackupTime < 86400000) ? 'bg-blue-50/50 border-blue-200' : 'bg-amber-50/50 border-amber-200'}`}>
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${lastBackupTime && (Date.now() - lastBackupTime < 86400000) ? 'text-blue-600' : 'text-amber-600'}`}>
                                    {lastBackupTime && (Date.now() - lastBackupTime < 86400000) ? 'Database Secure' : 'Backup Recommended'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Middle: Data Visualization (8 cols) */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Gender Mix */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Gender Distribution</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrollment Diversity</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#003f87]" /><span className="text-[9px] font-black text-slate-500 uppercase">M</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ec4899]" /><span className="text-[9px] font-black text-slate-500 uppercase">F</span></div>
                                </div>
                            </div>
                            <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={genderPieData}
                                            innerRadius={70}
                                            outerRadius={95}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {genderPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                                    <span className="text-4xl font-black text-slate-900 tabular-nums">{totalStudents}</span>
                                </div>
                            </div>
                        </div>

                        {/* Subject Performance */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Academic Performance</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top Average Scores</p>
                                </div>
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex-1 min-h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={subjectAverages} layout="vertical" margin={{ left: 10, right: 30 }}>
                                        <XAxis type="number" domain={[0, 100]} hide />
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            width={80} 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                                        />
                                        <Tooltip 
                                            cursor={{ fill: '#f1f5f9', radius: 8 }}
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="avg" radius={[0, 6, 6, 0]} barSize={16}>
                                            {subjectAverages.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={entry.avg >= 90 ? '#10b981' : entry.avg >= 85 ? '#3b82f6' : '#a855f7'} 
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-50 flex justify-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic text-center leading-relaxed">
                                    Computed across all verified official sections
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Operation Center - Complex Bottom Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Bulletins Section */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[450px]">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                    <Bell className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Announcements</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{announcements.length} active bulletins</p>
                                </div>
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowCreateAnnouncement(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                New Post
                            </motion.button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                            {announcements.length > 0 ? (
                                announcements.slice(0, 5).map((announcement) => {
                                    const colors = announcement.announcement_type === 'urgent' 
                                        ? 'bg-rose-50 border-rose-100 text-rose-700' 
                                        : announcement.announcement_type === 'event' 
                                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                            : 'bg-blue-50 border-blue-100 text-blue-700';
                                    return (
                                        <div key={announcement.id} className={`p-5 rounded-2xl border ${colors} transition-transform hover:scale-[1.02] cursor-pointer`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="text-sm font-black tracking-tight line-clamp-1">{announcement.announcement_title}</h5>
                                                {(announcement as any).is_cloud && (
                                                    <div className="p-1 bg-white/60 rounded-lg"><Activity className="w-3 h-3" /></div>
                                                )}
                                            </div>
                                            <p className="text-[11px] font-medium leading-relaxed opacity-80 line-clamp-2 mb-3">{announcement.announcement_content}</p>
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
                        
                        <button onClick={() => setCurrentView('announcements')} className="mt-6 pt-6 border-t border-slate-50 text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] hover:text-blue-700 transition-colors flex items-center justify-center gap-2">
                            Access Bulletin Board <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                    {/* School Calendar */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-[450px]">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Calendar</h3>
                            <div className="p-2 bg-slate-100 text-slate-500 rounded-xl">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                            {upcomingEvents.length > 0 ? (
                                upcomingEvents.map((event) => (
                                    <motion.div 
                                        key={event.id} 
                                        whileHover={{ x: 5 }}
                                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group"
                                        onClick={() => setCurrentView('calendar')}
                                    >
                                        <div className="w-12 h-14 bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl border border-blue-200 flex flex-col items-center justify-center flex-shrink-0 group-hover:from-blue-600 group-hover:to-blue-700 group-hover:text-white transition-colors">
                                            <span className="text-[9px] font-black uppercase leading-none mb-1 opacity-60 group-hover:opacity-100">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                            <span className="text-xl font-black leading-none">{new Date(event.date).getDate()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-800 uppercase truncate mb-1">{event.title}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{event.type}</p>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-40">
                                    <Clock className="w-10 h-10 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">No Events</p>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setCurrentView('calendar')} className="mt-6 pt-6 border-t border-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors text-center">
                            Full Schedule →
                        </button>
                    </div>

                    {/* Readiness & Audit */}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/40 flex flex-col h-[450px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full translate-x-10 -translate-y-10" />
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <h3 className="text-lg font-black text-white tracking-tight mb-8">Form Readiness</h3>
                            
                            <div className="space-y-8 flex-1">
                                {[
                                    { label: 'SF9 Report Cards', val: formReadiness.sf9, color: 'bg-emerald-500' },
                                    { label: 'SF10 Permanent Records', val: formReadiness.sf10, color: 'bg-blue-500' }
                                ].map(form => (
                                    <div key={form.label} className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{form.label}</span>
                                            <span className="text-sm font-black text-white tabular-nums">{form.val}%</span>
                                        </div>
                                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${form.val}%` }}
                                                className={`h-full ${form.color} rounded-full`}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {todayBirthdays.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mt-4 p-5 bg-gradient-to-br from-rose-500/20 to-pink-600/20 border border-white/10 rounded-[1.5rem] flex items-center gap-4"
                                    >
                                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-rose-400">
                                            <Cake className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-rose-300 uppercase leading-none mb-1.5">Birthday Celebrant</p>
                                            <p className="text-sm font-bold text-white truncate">
                                                {todayBirthdays[0].first_name} {todayBirthdays[0].last_name}
                                                {todayBirthdays.length > 1 && <span className="ml-1 opacity-60">+{todayBirthdays.length - 1} more</span>}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-auto pt-8 border-t border-white/5">
                                <button onClick={() => setCurrentView('students')} className="group p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all flex flex-col items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-[9px] font-black text-slate-300 uppercase">Enroll</span>
                                </button>
                                <button onClick={() => setCurrentView('reports')} className="group p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all flex flex-col items-center gap-2">
                                    <Star className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-[9px] font-black text-slate-300 uppercase">Stats</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Drill-down Modal (Styled as premium dialog) */}
                <AnimatePresence>
                    {selectedMetric && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-900/60">
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
                                            <div key={student.lrn} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
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

function X(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}

function BarChart3(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
        </svg>
    )
}
