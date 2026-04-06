import { useMemo, useState } from 'react';
import { useAppStore } from '../stores';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Users, AlertCircle, Layers, Award, Calendar, RefreshCcw, Bell, Info } from 'lucide-react';

export function Dashboard() {
    const {
        students,
        sections,
        subjects,
        activeSchoolYear,
        announcements,
        classRecords,
        setCurrentView,
        setSelectedSection,
        setSelectedSubject
    } = useAppStore();

    const [selectedMetric, setSelectedMetric] = useState<'at-risk' | 'top' | null>(null);

    // Filter Students to only those belonging to existing sections (resolves "ghost data")
    const validSections = useMemo(() => new Set(sections.map(s => s.section_name)), [sections]);

    // Unified data scope
    const dashboardData = useMemo(() => {
        const filteredStudents = students.filter(s => s.student_section && validSections.has(s.student_section));
        return {
            students: filteredStudents,
            sections: sections,
            records: classRecords
        };
    }, [students, sections, classRecords, validSections]);

    const validStudentLrns = useMemo(() => new Set(dashboardData.students.map(s => s.lrn)), [dashboardData.students]);

    // Derived Lists for Drill-down
    const failingStudentList = useMemo(() => {
        const failingRecords = dashboardData.records.filter(r => {
            const hasScores =
                (r.written_works?.some(s => s > 0) || false) ||
                (r.performance_tasks?.some(s => s > 0) || false) ||
                (r.quarterly_exam > 0);

            return validStudentLrns.has(r.student_lrn) &&
                hasScores &&
                (r.final_grade ?? 0) > 0 && (r.final_grade ?? 0) < 75;
        });

        return failingRecords.map(r => {
            const student = dashboardData.students.find(s => s.lrn === r.student_lrn);
            const subject = subjects.find(sub => sub.id === r.subject_id);
            const section = sections.find(sec => sec.id === subject?.section_id);

            return {
                ...student!,
                subject_name: subject?.subject_name || 'Unknown',
                subject_id: r.subject_id,
                section_id: section?.id || '',
                section_name: section?.section_name || 'Unknown'
            };
        });
    }, [dashboardData.records, validStudentLrns, dashboardData.students, sections, subjects]);

    const topStudentList = useMemo(() => {
        const highRecords = dashboardData.records.filter(r => {
            const hasScores =
                (r.written_works?.some(s => s > 0) || false) ||
                (r.performance_tasks?.some(s => s > 0) || false) ||
                (r.quarterly_exam > 0);

            return validStudentLrns.has(r.student_lrn) &&
                hasScores &&
                (r.final_grade ?? 0) >= 90;
        });

        return highRecords.map(r => {
            const student = dashboardData.students.find(s => s.lrn === r.student_lrn);
            const subject = subjects.find(sub => sub.id === r.subject_id);
            const section = sections.find(sec => sec.id === subject?.section_id);

            return {
                ...student!,
                subject_name: subject?.subject_name || 'Unknown',
                subject_id: r.subject_id,
                section_id: section?.id || '',
                section_name: section?.section_name || 'Unknown'
            };
        });
    }, [dashboardData.records, validStudentLrns, dashboardData.students, sections, subjects]);

    const handleViewRecord = (sectionName: string, subjectId: string) => {
        if (!sectionName || !subjectId) return;
        setSelectedSection(sectionName);
        setSelectedSubject(subjectId);
        setCurrentView('eclass');
    };

    const enrollmentData = useMemo(() => {
        const gradeLevels = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
        return gradeLevels.map(grade => {
            const gradeStudents = dashboardData.students.filter(s => s.grade_level === grade);
            return {
                grade: grade.replace('Grade ', 'G'),
                male: gradeStudents.filter(s => s.gender === 'Male').length,
                female: gradeStudents.filter(s => s.gender === 'Female').length,
                total: gradeStudents.length,
            };
        });
    }, [dashboardData.students]);

    const atRiskCount = failingStudentList.length;
    const topPerformersCount = topStudentList.length;

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

    return (
        <motion.div
            className="space-y-8 pb-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <motion.div variants={itemVariants}>
                    <h2 className="text-3xl font-extrabold text-deped-blue tracking-tight">System Dashboard</h2>
                    <p className="text-gray-500 font-medium">Academic Overview • S.Y. {activeSchoolYear}</p>
                </motion.div>
                <motion.div
                    variants={itemVariants}
                    className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl shadow-sm border border-white/20 text-sm font-bold text-deped-blue"
                >
                    <Calendar className="w-4 h-4 text-deped-blue" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Enrollees', value: dashboardData.students.length, sub: 'Learners', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
                    {
                        label: 'At-Risk Learners',
                        value: atRiskCount,
                        sub: 'Below 75',
                        icon: AlertCircle,
                        color: 'text-rose-600',
                        bg: 'bg-rose-100',
                        border: 'border-rose-200',
                        onClick: () => setSelectedMetric('at-risk'),
                        info: 'Only students with saved grades are counted.'
                    },
                    { label: 'Total Sections', value: dashboardData.sections.length, sub: 'Active Classes', icon: Layers, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
                    {
                        label: 'Top Performers',
                        value: topPerformersCount,
                        sub: '90% and Above',
                        icon: Award,
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-100',
                        border: 'border-emerald-200',
                        onClick: () => setSelectedMetric('top')
                    }
                ].map((stat) => (
                    <motion.div
                        key={stat.label}
                        variants={itemVariants}
                        whileHover={{ y: -5, scale: 1.02 }}
                        onClick={stat.onClick}
                        className={`bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-sm border ${stat.border} flex items-center justify-between group transition-all duration-300 hover:shadow-xl hover:bg-white ${stat.onClick ? 'cursor-pointer' : ''}`}
                    >
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                {stat.info && (
                                    <div className="group/info relative">
                                        <Info className="w-3 h-3 text-gray-300" />
                                        <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-[10px] rounded-lg opacity-0 group-hover/info:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-white/10">
                                            {stat.info}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-4xl font-black text-gray-800 tracking-tighter">{stat.value}</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">{stat.sub}</p>
                        </div>
                        <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                            <stat.icon className="w-8 h-8" />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <motion.div
                        variants={itemVariants}
                        className="bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/20"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-deped-blue flex items-center gap-2">
                                <div className="p-2 bg-blue-100 rounded-lg"><Layers className="w-5 h-5 text-blue-600" /></div>
                                Enrollment Distribution
                            </h3>
                            <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-deped-blue rounded-full" /> Male</span>
                                <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-pink-500 rounded-full" /> Female</span>
                            </div>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={enrollmentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc', radius: 10 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px' }} />
                                    <Bar dataKey="male" fill="#003f87" name="Male" radius={[6, 6, 0, 0]} barSize={24} />
                                    <Bar dataKey="female" fill="#ec4899" name="Female" radius={[6, 6, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            { label: 'Male Learners', value: dashboardData.students.filter(s => s.gender === 'Male').length, total: dashboardData.students.length, icon: '♂️', bg: 'bg-blue-50', text: 'text-blue-600' },
                            { label: 'Female Learners', value: dashboardData.students.filter(s => s.gender === 'Female').length, total: dashboardData.students.length, icon: '♀️', bg: 'bg-pink-50', text: 'text-pink-600' }
                        ].map((gender) => (
                            <motion.div
                                key={gender.label}
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                className={`${gender.bg} p-6 rounded-3xl flex items-center border border-white/50 shadow-sm transition-all duration-300 hover:shadow-md`}
                            >
                                <div className="p-4 bg-white rounded-2xl text-2xl mr-5 shadow-sm">{gender.icon}</div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{gender.label}</p>
                                    <p className={`text-2xl font-black ${gender.text}`}>
                                        {gender.value}
                                        <span className="text-sm text-gray-400 font-bold ml-2">
                                            ({gender.total > 0 ? Math.round((gender.value / gender.total) * 100) : 0}%)
                                        </span>
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <motion.div
                    variants={itemVariants}
                    className="bg-white/70 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white/20 flex flex-col h-full"
                >
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-deped-blue flex items-center gap-2">
                            <div className="p-2 bg-indigo-100 rounded-lg"><Bell className="w-5 h-5 text-indigo-600" /></div>
                            Recent Updates
                        </h3>
                        <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors group" onClick={() => window.location.reload()} title="Refresh">
                            <RefreshCcw className="w-4 h-4 text-gray-400 group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {announcements.length > 0 ? (
                            announcements.slice(0, 5).map((announcement, idx) => {
                                const typeColors: Record<string, string> = {
                                    general: 'bg-slate-50 border-slate-200 text-slate-700 ico-bg-slate-100',
                                    urgent: 'bg-rose-50 border-rose-100 text-rose-700 ico-bg-rose-100',
                                    event: 'bg-emerald-50 border-emerald-100 text-emerald-700 ico-bg-emerald-100',
                                };
                                const colors = typeColors[announcement.announcement_type] || typeColors.general;
                                return (
                                    <motion.div
                                        key={announcement.id}
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 + idx * 0.05 }}
                                        className={`p-5 rounded-2xl border ${colors.split(' ')[1]} ${colors.split(' ')[0]} hover:bg-white transition-colors cursor-pointer group shadow-sm hover:shadow-md`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-sm text-gray-800 group-hover:text-deped-blue transition-colors line-clamp-1">{announcement.announcement_title}</p>
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-current opacity-70">{announcement.announcement_type}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 italic">"{announcement.announcement_content}"</p>
                                        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                            <Calendar className="w-3 h-3" />
                                            {announcement.announcement_date}
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><RefreshCcw className="w-6 h-6 text-gray-300" /></div>
                                <p className="text-sm font-bold text-gray-400 italic">No recent updates</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

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
                                (selectedMetric === 'at-risk' ? failingStudentList : topStudentList).map((item, idx) => (
                                    <div key={`${item.lrn}-${item.subject_id}-${idx}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border border-gray-100 group">
                                        <div>
                                            <p className="font-bold text-gray-800 uppercase">{item.last_name}, {item.first_name}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                                                <span className="text-deped-blue">{item.subject_name}</span> • {item.section_name}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                handleViewRecord(item.section_name, item.subject_id);
                                                setSelectedMetric(null);
                                            }}
                                            className={`px-4 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 ${selectedMetric === 'at-risk' ? 'bg-rose-100 text-rose-700 group-hover:bg-rose-700 group-hover:text-white' : 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white'}`}
                                        >
                                            VIEW RECORD
                                        </button>
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
        </motion.div>
    );
}
