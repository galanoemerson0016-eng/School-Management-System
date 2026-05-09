import { useMemo, useState } from 'react';
import { useAppStore } from '../stores';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import type { Student } from '../types';
import { motion } from 'framer-motion';
import { Users, Layers, Calendar, RefreshCcw, Bell, Info, ShieldCheck, Download, FileSpreadsheet } from 'lucide-react';
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
                totalSubjects: students.reduce((sum, s) => sum + s.details.length, 0),
                averageGrade: students.length > 0 ? 
                    Math.round(students.reduce((sum, s) => sum + Math.min(...s.details.map(d => d.grade)), 0) / students.length * 10) / 10 : 0
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
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                {/* Modern Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
                >
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard</h1>
                        <p className="text-slate-600 font-medium">Welcome back • School Year {activeSchoolYear}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Modern Action Buttons */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleStudentExport}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm transition-all"
                        >
                            <Download className="w-4 h-4" />
                            Export Data
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.location.reload()}
                            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 shadow-sm transition-all"
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </motion.button>

                        {/* Modern Date Display */}
                        <div className="px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm">
                            <p className="text-sm font-semibold text-slate-700">
                                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </motion.div>
                
                {/* Key Metrics Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {/* Total Students */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Total Students</p>
                                <p className="text-3xl font-black text-slate-800">{totalStudents}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <p className="text-xs text-slate-500">Active enrollment</p>
                        </div>
                    </div>

                    {/* Grading Progress */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Grading Progress</p>
                                <p className="text-3xl font-black text-slate-800">{gradingProgress}%</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <RefreshCcw className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${gradingProgress}%` }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                    className="bg-emerald-500 h-2 rounded-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Attendance Rate */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">Attendance Rate</p>
                                <p className="text-3xl font-black text-slate-800">
                                    {totalStudents > 0 ? Math.round(((totalStudents - attendanceInsights.averageDailyAbsences) / totalStudents) * 100) : 100}%
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <p className="text-xs text-slate-500">{attendanceInsights.averageDailyAbsences} avg absences/day</p>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 mb-1">System Status</p>
                                <p className="text-lg font-black text-slate-800">Online</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                lastBackupTime && (Date.now() - lastBackupTime < 86400000)
                                    ? 'bg-green-100'
                                    : 'bg-amber-100'
                            }`}>
                                <ShieldCheck className={`w-6 h-6 ${
                                    lastBackupTime && (Date.now() - lastBackupTime < 86400000)
                                        ? 'text-green-600'
                                        : 'text-amber-600'
                                }`} />
                            </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                    lastBackupTime && (Date.now() - lastBackupTime < 86400000)
                                        ? 'bg-green-500'
                                        : 'bg-amber-500'
                                }`}></div>
                                <p className="text-xs text-slate-500">Last backup: {formatTimeAgo(lastBackupTime)}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Charts Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {/* Level-wise Enrollment Chart */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Level-wise Enrollment</h3>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100">PRO ANALYTICS</span>
                        </div>
                        <div className="h-48 w-full flex items-center justify-center relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryEnrollmentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryEnrollmentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xl font-black text-slate-800">{totalStudents}</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {categoryEnrollmentData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-700 leading-none">{entry.name}</span>
                                        <span className="text-[8px] font-bold text-slate-400">{entry.value} students</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Attendance Trend Chart */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">14-Day Absence Trend</h3>
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100">AUDIT TOOL</span>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={attendanceStats}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 800, color: '#1e293b' }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center italic">Total absences tracked across official sections</p>
                    </motion.div>

                    {/* Gender Distribution Chart */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Gender Distribution</h3>
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#003f87]" />
                                <div className="w-2 h-2 rounded-full bg-[#ec4899]" />
                            </div>
                        </div>
                        <div className="h-48 w-full flex items-center justify-center relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={genderPieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {genderPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-xs font-black text-slate-400 uppercase">Total</span>
                                <span className="text-2xl font-black text-slate-900 leading-none">{totalStudents}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Attendance Insights Card */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Attendance Insights</h3>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100">ANALYTICS</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Total Absences</p>
                                    <p className="text-lg font-black text-slate-900">{attendanceInsights.totalAbsences}</p>
                                </div>
                                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                                    <Users className="w-4 h-4 text-slate-600" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                                <div>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Daily Average</p>
                                    <p className="text-lg font-black text-blue-900">{attendanceInsights.averageDailyAbsences}</p>
                                </div>
                                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-rose-50 rounded-xl">
                                <div>
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Peak Day</p>
                                    <p className="text-sm font-black text-rose-900">{attendanceInsights.peakDay}</p>
                                    <p className="text-[10px] font-bold text-rose-700">{attendanceInsights.peakCount} absences</p>
                                </div>
                                <div className="w-8 h-8 bg-rose-200 rounded-full flex items-center justify-center">
                                    <Bell className="w-4 h-4 text-rose-600" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>


                {/* Recent Updates Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Recent Updates</h3>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setShowCreateAnnouncement(true)}
                                className="p-2 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                                title="Create New Announcement"
                            >
                                <Bell className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                            </button>
                            <Bell className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>

                    {/* Create Announcement Modal */}
                    {showCreateAnnouncement && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Announcement Title"
                                    value={newAnnouncement.title}
                                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <textarea
                                    placeholder="Announcement Content"
                                    value={newAnnouncement.content}
                                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleCreateAnnouncement}
                                        disabled={!newAnnouncement.title.trim() || !newAnnouncement.content.trim()}
                                        className="px-4 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Post
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setShowCreateAnnouncement(false);
                                            setNewAnnouncement({ title: '', content: '' });
                                        }}
                                        className="px-4 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                        {announcements.length > 0 ? (
                            announcements.slice(0, 3).map((announcement, idx) => (
                                <motion.div
                                    key={announcement.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="border-l-2 border-slate-200 pl-4 py-2 hover:bg-slate-50/50 rounded-r-lg transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <p className="text-xs font-black text-slate-800 uppercase line-clamp-1">{announcement.announcement_title}</p>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase ml-2 flex-shrink-0">
                                            {announcement.announcement_date}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 leading-relaxed line-clamp-2">{announcement.announcement_content}</p>
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                                    <Bell className="w-5 h-5 text-slate-400" />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">No recent bulletins</p>
                                <p className="text-[9px] text-slate-300 font-bold uppercase mt-1">Click the + to create your first announcement</p>
                            </div>
                        )}
                    </div>

                    {announcements.length > 3 && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                            <button 
                                onClick={() => setCurrentView('announcements')}
                                className="w-full text-center text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-700 transition-colors"
                            >
                                View All Announcements →
                            </button>
                        </div>
                    )}
                </motion.div>

            {/* Drill-down Modal */}
            {selectedMetric && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                    >
                        <div className={`p-6 border-b flex justify-between items-center ${selectedMetric === 'at-risk' ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                            <div>
                                <h3 className={`text-xl font-black ${selectedMetric === 'at-risk' ? 'text-rose-700' : 'text-emerald-700'}`}>
                                    {selectedMetric === 'at-risk' ? 'At-Risk Learners' : 'Top Performers'}
                                </h3>
                                <p className="text-xs font-bold text-gray-500 tracking-wide uppercase">
                                    {selectedMetric === 'at-risk' ? 'Students with Grades < 75' : 'Students with Grades >= 90'}
                                </p>
                            </div>
                            <button onClick={() => setSelectedMetric(null)} className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center text-2xl transition-colors text-gray-500">×</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            {(selectedMetric === 'at-risk' ? failingStudentList : topStudentList).length > 0 ? (
                                (selectedMetric === 'at-risk' ? failingStudentList : topStudentList).map((student) => (
                                    <div key={student.lrn} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-gray-800 uppercase">{student.last_name}, {student.first_name}</p>
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{student.details.length} subject{student.details.length > 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {student.details.map((detail, idx) => (
                                                <div key={`${detail.subject_id}-${idx}`} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                                                            <span className="text-deped-blue line-clamp-1">{detail.subject_name}</span> 
                                                            {detail.section_name} • <span className={selectedMetric === 'at-risk' ? 'text-rose-600' : 'text-emerald-600'}>{getTermLabel(detail.quarter)} (Grade: {detail.grade})</span>
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            handleViewRecord(detail.section_name, detail.subject_id);
                                                            setSelectedMetric(null);
                                                        }}
                                                        className={`ml-2 px-3 py-1 rounded-lg font-black text-[9px] transition-all active:scale-95 ${selectedMetric === 'at-risk' ? 'bg-rose-100 text-rose-700 hover:bg-rose-700 hover:text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-700 hover:text-white'}`}
                                                    >
                                                        VIEW
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-400 italic font-medium">No students found in this category yet.</div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-end">
                            <button onClick={() => setSelectedMetric(null)} className="px-6 py-2 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition-all shadow-md">Close</button>
                        </div>
                    </motion.div>
                </div>
            )}
            </div>
        </div>
    );
}
