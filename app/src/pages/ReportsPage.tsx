import { useState, useMemo } from 'react';
import { useAppStore } from '../stores';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, FileSpreadsheet, ArrowRight, ArrowLeft, Award, AlertTriangle, Download, Users, AlertCircle } from 'lucide-react';
import { getMPSPerSubject, generateHonorRoll, getAtRiskStudents } from '../utils/grading-helpers';
import { exportToCSV } from '../utils/csv-export';

const COLORS = ['#003f87', '#ec4899', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];

export function ReportsPage() {
    const { students, sections, subjects, classRecords, setCurrentView, setSelectedSection, setSelectedSubject } = useAppStore();
    const [activeReport, setActiveReport] = useState<string | null>(null);
    const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(1);
    const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
    const [selectedDetailMetric, setSelectedDetailMetric] = useState<'total' | 'at-risk' | null>(null);

    // Filter subjects by section
    const filteredSubjects = useMemo(() => {
        if (selectedSectionFilter === 'all') return subjects;
        return subjects.filter(s => s.section_id === selectedSectionFilter);
    }, [subjects, selectedSectionFilter]);

    // Active Students ONLY (No Ghosts!)
    const validStudents = useMemo(() => {
        const validSections = new Set(sections.map(s => s.section_name));
        return students.filter(s => s.student_section && validSections.has(s.student_section));
    }, [students, sections]);

    const filteredRecords = useMemo(() => {
        // First, limit to records belonging to VALID students (no ghosts)
        const validLrns = new Set(validStudents.map(s => s.lrn));
        
        // LIMIT TO VALID SUBJECTS (exclude orphaned grades for deleted subjects)
        const validSubjectIds = new Set(subjects.map(s => s.id));

        const baseRecords = classRecords.filter(r => {
            const hasValidRefs = validLrns.has(r.student_lrn) && validSubjectIds.has(r.subject_id);
            if (!hasValidRefs) return false;

            const wwHasScores = r.written_works?.some(s => (Number(s) || 0) > 0) || false;
            const ptHasScores = r.performance_tasks?.some(s => (Number(s) || 0) > 0) || false;
            const qaHasScore = (Number(r.quarterly_exam) || 0) > 0;
            return wwHasScores || ptHasScores || qaHasScore;
        });

        // AUTO-CONSOLIDATE: Group by student/subject/quarter to eliminate ghost duplicates
        const consolidatedMap = new Map<string, typeof classRecords[0]>();
        
        baseRecords.forEach(r => {
            const key = `${r.student_lrn}_${r.subject_id}_${r.quarter}`;
            const existing = consolidatedMap.get(key);
            
            if (!existing) {
                consolidatedMap.set(key, r);
            } else {
                const isNew = r.id.startsWith('grade_');
                const isExistingNew = existing.id.startsWith('grade_');

                if (isNew && !isExistingNew) {
                    // Current is deterministic, existing is ghost. ALWAYS overwrite.
                    consolidatedMap.set(key, r);
                } else if (!isNew && isExistingNew) {
                    // Current is ghost, existing is deterministic. NEVER overwrite.
                    return;
                } else {
                    // Both are same type (either both 'grade_' or both 'rec-')
                    // Pick the one with more content or higher grade as a fallback
                    if (Number(r.final_grade || 0) > Number(existing.final_grade || 0)) {
                        consolidatedMap.set(key, r);
                    }
                }
            }
        });

        const recordsForValidStudents = Array.from(consolidatedMap.values());

        if (selectedSectionFilter === 'all') return recordsForValidStudents;
        
        // Then filter by section subjects
        const sectionSubjectIds = new Set(filteredSubjects.map(s => s.id));
        return recordsForValidStudents.filter(r => sectionSubjectIds.has(r.subject_id));
    }, [classRecords, validStudents, filteredSubjects, selectedSectionFilter, subjects]);

    // MPS Data
    const mpsData = useMemo(() =>
        getMPSPerSubject(filteredRecords, filteredSubjects, selectedQuarter),
        [filteredRecords, filteredSubjects, selectedQuarter]
    );

    // Honor Roll
    const honorRoll = useMemo(() =>
        generateHonorRoll(validStudents, filteredRecords, filteredSubjects, sections, selectedQuarter),
        [validStudents, filteredRecords, filteredSubjects, sections, selectedQuarter]
    );

    // At-Risk
    const atRiskStudents = useMemo(() =>
        getAtRiskStudents(validStudents, filteredRecords, filteredSubjects, selectedQuarter),
        [validStudents, filteredRecords, filteredSubjects, selectedQuarter]
    );

    // Grade Distribution
    const gradeDistribution = useMemo(() => {
        const ranges = [
            { range: '90-100', min: 90, max: 100, color: '#22c55e' },
            { range: '85-89', min: 85, max: 89, color: '#84cc16' },
            { range: '80-84', min: 80, max: 84, color: '#f59e0b' },
            { range: '75-79', min: 75, max: 79, color: '#f97316' },
            { range: 'Below 75', min: 0, max: 74, color: '#ef4444' },
        ];

        return ranges.map(r => {
            const count = filteredRecords.filter(rec => {
                const grade = Number(rec.final_grade) || 0;
                return rec.quarter === selectedQuarter &&
                    grade > 0 &&
                    grade >= r.min &&
                    grade <= r.max;
            }).length;
            return { ...r, count };
        });
    }, [filteredRecords, selectedQuarter]);

    // Subject radar data
    const radarData = useMemo(() => {
        return mpsData.slice(0, 8).map(d => ({
            subject: d.subjectName.length > 12 ? d.subjectName.substring(0, 12) + '...' : d.subjectName,
            mps: d.mps,
            passRate: d.passRate,
        }));
    }, [mpsData]);

    // Learner progress (per quarter)
    const progressData = useMemo(() => {
        const quarters: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
        return quarters.map(q => {
            const qRecords = filteredRecords.filter(r => r.quarter === q && (Number(r.final_grade) || 0) > 0);
            const avg = qRecords.length > 0
                ? Math.round((qRecords.reduce((sum, r) => sum + (Number(r.final_grade) || 0), 0) / qRecords.length) * 100) / 100
                : 0;
            const passing = qRecords.filter(r => (Number(r.final_grade) || 0) >= 75).length;
            const passRate = qRecords.length > 0 ? Math.round((passing / qRecords.length) * 100) : 0;
            return { quarter: `Q${q}`, average: avg, passRate, totalRecords: qRecords.length };
        });
    }, [filteredRecords]);

    const handleExportMPS = () => {
        exportToCSV(mpsData.map(d => ({
            'Subject': d.subjectName,
            'MPS': d.mps,
            'Pass Rate (%)': d.passRate,
            'Total Students': d.totalStudents,
        })), `MPS_Report_Q${selectedQuarter}`);
    };

    const handleExportHonorRoll = () => {
        exportToCSV(honorRoll.map(h => ({
            'Name': `${h.student.last_name}, ${h.student.first_name}`,
            'Section': h.sectionName,
            'General Average': h.generalAverage,
            'Honor Type': h.honorType,
        })), `Honor_Roll_Q${selectedQuarter}`);
    };

    const handleExportAtRisk = () => {
        exportToCSV(atRiskStudents.map(a => ({
            'Name': `${a.student.last_name}, ${a.student.first_name}`,
            'Subject': a.subjectName,
            'Grade': a.grade,
            'Section': a.student.student_section || '',
        })), `At_Risk_Students_Q${selectedQuarter}`);
    };

    const QuarterSelector = () => (
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Quarter:</span>
            {([1, 2, 3, 4] as const).map(q => (
                <button
                    key={q}
                    onClick={() => setSelectedQuarter(q)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedQuarter === q
                        ? 'bg-deped-blue text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Q{q}
                </button>
            ))}
        </div>
    );

    const SectionFilter = () => (
        <select
            value={selectedSectionFilter}
            onChange={(e) => setSelectedSectionFilter(e.target.value)}
            className="text-xs font-bold border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-deped-blue/20"
        >
            <option value="all">All Sections</option>
            {sections.map(s => (
                <option key={s.id} value={s.id}>{s.section_name}</option>
            ))}
        </select>
    );
    
    // NEW: Record Details Modal
    const RecordDetailsModal = () => {
        if (!selectedDetailMetric) return null;

        const records = selectedDetailMetric === 'total' 
            ? filteredRecords.filter(r => r.quarter === selectedQuarter && (Number(r.final_grade) || 0) > 0)
            : filteredRecords.filter(r => {
                const grade = Number(r.final_grade) || 0;
                return r.quarter === selectedQuarter && grade > 0 && grade < 75;
            });

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deped-blue/20 backdrop-blur-md">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-2xl border border-white/40 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="text-xl font-extrabold text-deped-blue">
                                {selectedDetailMetric === 'total' ? 'Graded Records Log' : 'At-Risk Students List'}
                            </h3>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                                Quarter {selectedQuarter} • {records.length} {records.length === 1 ? 'Record' : 'Records'} Found
                            </p>
                        </div>
                        <button 
                            onClick={() => setSelectedDetailMetric(null)}
                            className="p-2 hover:bg-gray-200 rounded-xl transition-all"
                        >
                            <AlertCircle className="w-6 h-6 text-gray-400 rotate-45" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-400 uppercase text-[10px] font-black tracking-widest">
                                    <th className="pb-4 px-2">#</th>
                                    <th className="pb-4 px-2">Student Name</th>
                                    <th className="pb-4 px-2">Section</th>
                                    <th className="pb-4 px-2">Subject</th>
                                    <th className="pb-4 px-2 text-center">Grade</th>
                                    <th className="pb-4 px-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {records.map((r, idx) => {
                                    const student = students.find(s => s.lrn === r.student_lrn);
                                    const subject = subjects.find(s => s.id === r.subject_id);
                                    
                                    return (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="py-3 px-2 font-bold text-gray-400">{idx + 1}</td>
                                            <td className="py-3 px-2 font-black text-gray-800 uppercase">
                                                {student ? `${student.last_name}, ${student.first_name}` : 'Unknown Student'}
                                            </td>
                                            <td className="py-3 px-2">
                                                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-bold text-gray-600">
                                                    {student?.student_section || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 font-bold text-gray-600">{subject?.subject_name || 'Deleted Subject'}</td>
                                            <td className="py-3 px-2 text-center">
                                                <span className={`font-black ${Number(r.final_grade) < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {r.final_grade}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <button 
                                                    onClick={() => {
                                                        if (subject && student?.student_section) {
                                                            setSelectedSection(student.student_section);
                                                            setSelectedSubject(subject.id);
                                                            setCurrentView('eclass');
                                                            setSelectedDetailMetric(null);
                                                        }
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-deped-blue hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {records.length === 0 && (
                            <div className="py-20 text-center text-gray-400 italic">No records to display for this metric.</div>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    };

    if (activeReport) {
        return (
            <div className="space-y-6 pb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-4 justify-between items-center"
                >
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setActiveReport(null)}
                            className="p-2 rounded-xl bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-extrabold text-deped-blue">
                                {activeReport === 'quarterly' && 'Quarterly Summary Report'}
                                {activeReport === 'subject' && 'Subject Performance'}
                                {activeReport === 'progress' && 'Learner Progress Tracker'}
                                {activeReport === 'at-risk' && 'At-Risk Students Report'}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <SectionFilter />
                        <QuarterSelector />
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    <RecordDetailsModal />
                    {/* QUARTERLY SUMMARY */}
                    {activeReport === 'quarterly' && (
                        <motion.div
                            key="quarterly"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Records', value: filteredRecords.filter(r => r.quarter === selectedQuarter && (Number(r.final_grade) || 0) > 0).length, color: 'blue', onClick: () => setSelectedDetailMetric('total') },
                                    { label: 'Average Grade', value: progressData[selectedQuarter - 1]?.average || 0, color: 'green' },
                                    { label: 'Pass Rate', value: `${progressData[selectedQuarter - 1]?.passRate || 0}%`, color: 'yellow' },
                                    { label: 'At-Risk', value: new Set(atRiskStudents.map(a => a.student.lrn)).size, color: 'red', onClick: () => setSelectedDetailMetric('at-risk') },
                                ].map((stat) => (
                                    <div 
                                        key={stat.label} 
                                        className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 ${stat.onClick ? 'cursor-pointer hover:border-deped-blue/30 hover:bg-blue-50/10 transition-all' : ''}`}
                                        onClick={stat.onClick}
                                    >
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                        <p className="text-3xl font-black text-gray-800 mt-1">{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* MPS Chart */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-gray-800">Mean Percentage Score (MPS)</h3>
                                        <button onClick={handleExportMPS} className="text-xs flex items-center gap-1 text-deped-blue hover:underline font-bold">
                                            <Download className="w-3 h-3" /> Export CSV
                                        </button>
                                    </div>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={mpsData} layout="vertical" margin={{ left: 20 }}>
                                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                                                <YAxis dataKey="subjectName" type="category" tick={{ fontSize: 10 }} width={120} />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                                                <Bar dataKey="mps" fill="#003f87" radius={[0, 6, 6, 0]} barSize={18} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Grade Distribution Pie */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4">Grade Distribution</h3>
                                    <div className="h-72 flex items-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={gradeDistribution.filter(d => d.count > 0)}
                                                    dataKey="count"
                                                    nameKey="range"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    label={({ index }: any) => {
                                                        const entry = gradeDistribution.filter(d => d.count > 0)[index];
                                                        return entry ? `${entry.range}: ${entry.count}` : '';
                                                    }}
                                                >
                                                    {gradeDistribution.map((entry, idx) => (
                                                        <Cell key={idx} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2 justify-center">
                                        {gradeDistribution.map(d => (
                                            <span key={d.range} className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                                {d.range}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* MPS Table */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2 overflow-x-auto">
                                    <h3 className="font-bold text-gray-800 mb-4">Detailed MPS per Subject</h3>
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 text-left">
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Subject</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">MPS</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Pass Rate</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Students</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {mpsData.map((row) => (
                                                <tr key={row.subjectName} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-bold text-sm text-gray-800">{row.subjectName}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-black ${row.mps >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {row.mps}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-sm font-bold text-gray-600">{row.passRate}%</td>
                                                    <td className="px-4 py-3 text-center text-sm text-gray-500">{row.totalStudents}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-xs font-bold ${row.mps >= 85 ? 'text-green-600' : row.mps >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                            {row.mps >= 85 ? '✅ Excellent' : row.mps >= 75 ? '⚠️ Satisfactory' : '❌ Needs Improvement'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {mpsData.length === 0 && (
                                        <p className="text-center py-8 text-gray-400 italic">No graded records for Quarter {selectedQuarter}</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* SUBJECT PERFORMANCE */}
                    {activeReport === 'subject' && (
                        <motion.div
                            key="subject"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Radar Chart */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4">Subject Comparison Radar</h3>
                                    <div className="h-80">
                                        {radarData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart data={radarData}>
                                                    <PolarGrid strokeDasharray="3 3" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                                                    <Radar name="MPS" dataKey="mps" stroke="#003f87" fill="#003f87" fillOpacity={0.3} />
                                                    <Radar name="Pass Rate" dataKey="passRate" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                                                    <Legend />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 italic">No data available</div>
                                        )}
                                    </div>
                                </div>

                                {/* Bar Comparison */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4">Pass Rate by Subject</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={mpsData} margin={{ bottom: 60 }}>
                                                <XAxis 
                                                    dataKey="subjectName" 
                                                    tick={(props: any) => {
                                                        const { x, y, payload } = props;
                                                        return (
                                                            <g transform={`translate(${x},${y})`}>
                                                                <text x={0} y={0} dy={16} textAnchor="end" fill="#666" fontSize={9} transform="rotate(-45)">
                                                                    {payload.value}
                                                                </text>
                                                            </g>
                                                        );
                                                    }} 
                                                />
                                                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                                <Tooltip />
                                                <Bar dataKey="passRate" name="Pass Rate %" radius={[6, 6, 0, 0]} barSize={24}>
                                                    {mpsData.map((_, idx) => (
                                                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* LEARNER PROGRESS */}
                    {activeReport === 'progress' && (
                        <motion.div
                            key="progress"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4">Academic Progress Across Quarters</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={progressData}>
                                            <XAxis dataKey="quarter" />
                                            <YAxis domain={[0, 100]} />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="average" name="Average Grade" stroke="#003f87" strokeWidth={3} dot={{ r: 6 }} />
                                            <Line type="monotone" dataKey="passRate" name="Pass Rate %" stroke="#22c55e" strokeWidth={3} dot={{ r: 6 }} strokeDasharray="5 5" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4">Quarter-by-Quarter Stats</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    {progressData.map(p => (
                                        <div key={p.quarter} className={`p-4 rounded-xl border-2 transition-all ${p.quarter === `Q${selectedQuarter}` ? 'border-deped-blue bg-blue-50' : 'border-gray-100'}`}>
                                            <p className="text-lg font-black text-deped-blue">{p.quarter}</p>
                                            <p className="text-2xl font-black text-gray-800">{p.average || '—'}</p>
                                            <p className="text-xs text-gray-500 font-bold">Avg Grade</p>
                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                                <p className="text-sm font-bold text-green-600">{p.passRate}% Pass</p>
                                                <p className="text-[10px] text-gray-400">{p.totalRecords} records</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* AT-RISK STUDENTS */}
                    {activeReport === 'at-risk' && (
                        <motion.div
                            key="at-risk"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center">
                                <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                                    <span className="text-sm font-bold text-red-700">{new Set(atRiskStudents.map(a => a.student.lrn)).size} at-risk learners found in Quarter {selectedQuarter}</span>
                                </div>
                                <button onClick={handleExportAtRisk} className="text-xs flex items-center gap-1 text-deped-blue hover:underline font-bold px-3 py-2 bg-white rounded-lg shadow-sm border">
                                    <Download className="w-3 h-3" /> Export CSV
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-red-600 to-rose-500 text-white">
                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase">#</th>
                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase">Student Name</th>
                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase">Section</th>
                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase">Subject</th>
                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase">Quarter</th>
                                            <th className="px-5 py-4 text-center text-xs font-bold uppercase">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {atRiskStudents.map((item, idx) => (
                                            <tr key={`${item.student.lrn}-${item.subjectName}-${idx}`} className="hover:bg-red-50/50">
                                                <td className="px-5 py-3 text-sm text-gray-400 font-bold">{idx + 1}</td>
                                                <td 
                                                    className="px-5 py-3 font-bold text-sm text-deped-blue hover:text-blue-700 underline cursor-pointer uppercase transition-colors"
                                                    onClick={() => {
                                                        const secObj = sections.find(s => s.section_name === item.student.student_section);
                                                        const subObj = subjects.find(s => s.subject_name === item.subjectName && s.section_id === secObj?.id);
                                                        if (subObj && secObj) {
                                                            setSelectedSection(secObj.section_name);
                                                            setSelectedSubject(subObj.id);
                                                            setCurrentView('eclass');
                                                        }
                                                    }}
                                                    title={`View ${item.subjectName} Class Record`}
                                                >
                                                    {item.student.last_name}, {item.student.first_name}
                                                </td>
                                                <td className="px-5 py-3 text-sm text-gray-600">{item.student.student_section}</td>
                                                <td className="px-5 py-3 text-sm text-gray-600">{item.subjectName}</td>
                                                <td className="px-5 py-3 text-center text-sm font-bold text-gray-700">Q{selectedQuarter}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-black">
                                                        {item.grade}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {atRiskStudents.length === 0 && (
                                    <div className="text-center py-12 text-gray-400 italic">
                                        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        No at-risk students found for Quarter {selectedQuarter}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ==== LANDING PAGE (Report Cards) ====
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-deped-blue">Reports & Analytics</h2>
                <p className="text-gray-600 mt-2">Generate insights and view consolidated performance data.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Honor Students', value: honorRoll.length, icon: Award, color: 'emerald', action: () => setActiveReport('quarterly') },
                    { label: 'At-Risk Learners', value: new Set(atRiskStudents.map(a => a.student.lrn)).size, icon: AlertTriangle, color: 'red', action: () => setActiveReport('at-risk') },
                    { label: 'Total Subjects', value: subjects.length, icon: BarChart3, color: 'blue', action: () => setActiveReport('subject') },
                    { label: 'Total Enrollees', value: validStudents.length, icon: Users, color: 'purple', action: null },
                ].map((stat) => (
                    <div 
                        key={stat.label} 
                        onClick={stat.action ? stat.action : undefined}
                        className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all ${stat.action ? 'cursor-pointer' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : stat.color === 'red' ? 'bg-red-100 text-red-600' : stat.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-black text-gray-800">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Consolidated Grades Card */}
                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-600 transition-colors duration-300">
                            <FileSpreadsheet className="w-8 h-8 text-deped-blue group-hover:text-white" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Consolidated Grade Sheet</h3>
                    <p className="text-gray-600 mb-6 text-sm line-clamp-2">
                        View and print the Master Sheet of Grades (Final Grades and General Average) per section.
                    </p>
                    <button
                        onClick={() => setCurrentView('consolidated-grades')}
                        className="w-full flex items-center justify-center gap-2 bg-deped-blue text-white py-3 rounded-lg hover:bg-blue-700 transition-all font-medium group-hover:shadow-md"
                    >
                        View Master Sheet <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Quarterly Summaries */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => setActiveReport('quarterly')}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-600 transition-colors duration-300">
                            <BarChart3 className="w-8 h-8 text-green-600 group-hover:text-white" />
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">Working</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Quarterly Summaries</h3>
                    <p className="text-gray-600 mb-6 text-sm">
                        View Mean Percentage Scores (MPS), Grade Distribution, and Pass/Fail rates.
                    </p>
                    <button className="w-full py-3 rounded-lg border border-gray-200 text-gray-600 hover:border-green-600 hover:text-green-600 transition-colors font-medium flex items-center justify-center gap-2">
                        Generate Report <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Subject Performance */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => setActiveReport('subject')}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-600 transition-colors duration-300">
                            <PieChartIcon className="w-8 h-8 text-purple-600 group-hover:text-white" />
                        </div>
                        <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">Working</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Subject Performance</h3>
                    <p className="text-gray-600 mb-6 text-sm">
                        Compare performance statistics across different learning areas.
                    </p>
                    <button className="w-full py-3 rounded-lg border border-gray-200 text-gray-600 hover:border-purple-600 hover:text-purple-600 transition-colors font-medium flex items-center justify-center gap-2">
                        View Comparison <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Learner Progress */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => setActiveReport('progress')}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-600 transition-colors duration-300">
                            <TrendingUp className="w-8 h-8 text-orange-600 group-hover:text-white" />
                        </div>
                        <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded">Working</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Learner Progress</h3>
                    <p className="text-gray-600 mb-6 text-sm">
                        Track academic growth and milestones over time across all quarters.
                    </p>
                    <button className="w-full py-3 rounded-lg border border-gray-200 text-gray-600 hover:border-orange-600 hover:text-orange-600 transition-colors font-medium flex items-center justify-center gap-2">
                        Track Progress <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* At-Risk Students */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => setActiveReport('at-risk')}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-600 transition-colors duration-300">
                            <AlertTriangle className="w-8 h-8 text-red-600 group-hover:text-white" />
                        </div>
                        <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">Working</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">At-Risk Students</h3>
                    <p className="text-gray-600 mb-6 text-sm">
                        Identify and export students with grades below 75 for intervention tracking.
                    </p>
                    <button className="w-full py-3 rounded-lg border border-gray-200 text-gray-600 hover:border-red-600 hover:text-red-600 transition-colors font-medium flex items-center justify-center gap-2">
                        View Report <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Honor Roll */}
                <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-xl shadow border border-amber-100 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-amber-100 rounded-lg group-hover:bg-amber-500 transition-colors duration-300">
                            <Award className="w-8 h-8 text-amber-600 group-hover:text-white" />
                        </div>
                        <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded">Working</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Honor Roll</h3>
                    <p className="text-gray-600 mb-6 text-sm">
                        Auto-generated honor roll: Highest Honors (98+), High Honors (95+), Honors (90+).
                    </p>
                    <div className="space-y-2 mb-4">
                        {honorRoll.length > 0 ? (
                            honorRoll.slice(0, 3).map(h => (
                                <div key={h.student.lrn} className="flex items-center justify-between text-sm bg-amber-50/50 p-2 rounded-lg">
                                    <span className="font-bold text-gray-700 uppercase text-xs">{h.student.last_name}, {h.student.first_name}</span>
                                    <span className="text-xs font-black text-amber-700">{h.generalAverage}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 italic text-center py-2">No honor students for Q{selectedQuarter}</p>
                        )}
                    </div>
                    <button
                        onClick={handleExportHonorRoll}
                        className="w-full py-3 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all font-medium flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Export Honor Roll
                    </button>
                </div>
            </div>
        </div>
    );
}
