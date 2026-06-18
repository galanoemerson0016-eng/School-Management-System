import { useState, useMemo, useEffect } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, ArrowRight, ArrowLeft, Award, AlertTriangle, Download, Users, AlertCircle, ChevronDown, Trophy, Medal, Sparkles, Target, ArrowUp, ArrowDown, Minus, Heart, Clock3, ClipboardList } from 'lucide-react';
import { getMPSPerSubject, generateHonorRoll, getAtRiskStudents, getSubjectAwardees, getStudentAbsences } from '../utils/grading-helpers';
import { isKeyStage1 } from '../lib/grading';
import { exportToCSV } from '../utils/csv-export';
import { canEditReport, canViewReport, filterOfficialSectionsForUser, filterOfficialRecords, type ReportType } from '../lib/rbac';
import type { Student, AwardEvaluation } from '../types';

const COLORS = ['#003f87', '#ec4899', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];

interface EvaluationFormState {
    motivational?: number;
    planning?: number;
    contribution?: number;
    position?: string;
    noDerogatory?: boolean;
    grade?: number;
    supervisorRating?: string;
    teacherRating?: string;
    isEndorsed?: boolean;
    projectTitle?: string;
    projectMembers?: string[];
    finalGrade?: number;
    significance?: number;
    rigor?: number;
    originality?: number;
    feasibility?: number;
    presentation?: number;
    characterTraitId?: string;
    characterTraitTitle?: string;
    characterTraitDescription?: string;
    gmrcCompetency?: string;
    specialRecognitionTitle?: string;
    specialRecognitionLevel?: string;
}

const isKinderOrG1 = (gradeLevel: string) => {
    const gl = (gradeLevel || '').toLowerCase().trim();
    return gl.includes('kinder') || gl === 'grade 1' || gl === 'g1' || gl === '1';
};

const getStudentRequirementStats = (student: Student) => {
    const isG1K = isKinderOrG1(student.grade_level);
    const requiredDocs = isG1K 
        ? ['req_birth_cert', 'req_beef', 'req_eccd'] 
        : ['req_report_card', 'req_birth_cert', 'req_sf10', 'req_good_moral', 'req_beef'];
    
    let submittedCount = 0;
    requiredDocs.forEach(doc => {
        if (student[doc as keyof Student]) submittedCount++;
    });

    const totalRequired = requiredDocs.length;
    const isComplete = submittedCount === totalRequired;
    const isTemporary = !!student.req_undertaking;

    return {
        submittedCount,
        totalRequired,
        isComplete,
        isTemporary,
        requiredDocs
    };
};

export function ReportsPage() {
    const { students, sections, subjects, gradingSheetRecords, setCurrentView, setSelectedSection, setSelectedSubject, activeSchoolYear } = useAppStore();
    const { user } = useAuthStore();
    const [activeReport, setActiveReport] = useState<string | null>(null);
    const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 'overall'>(1);
    const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
    const [selectedDetailMetric, setSelectedDetailMetric] = useState<'total' | 'at-risk' | null>(null);
    const [atRiskViewMode, setAtRiskViewMode] = useState<'grouped' | 'detailed'>('grouped');
    const [expandedSubjectAwards, setExpandedSubjectAwards] = useState<Record<string, boolean>>({});
    const [awardsTab, setAwardsTab] = useState<'academic' | 'classroom' | 'special'>('academic');
    const [selectedSectionForAwards, setSelectedSectionForAwards] = useState<string>('');
    const [evaluatingStudentLrn, setEvaluatingStudentLrn] = useState<string | null>(null);
    const [evaluatingAwardType, setEvaluatingAwardType] = useState<string | null>(null);
    const [evaluationForm, setEvaluationForm] = useState<EvaluationFormState>({});
    const [reqFilter, setReqFilter] = useState<'all' | 'complete' | 'pending'>('all');

    const reportKeyByActive: Record<string, ReportType> = {
        quarterly: 'quarterly-summaries',
        subject: 'subject-performance',
        progress: 'learner-progress',
        'at-risk': 'at-risk-students',
        'honor-roll': 'honor-roll',
        requirements: 'requirements-checklist',
    };

    const openReport = (key: keyof typeof reportKeyByActive) => {
        const reportType = reportKeyByActive[key];
        if (!canViewReport(user, reportType)) return;
        if (key !== 'honor-roll' && selectedQuarter === 'overall') {
            setSelectedQuarter(3);
        }
        setActiveReport(key);
    };

    const reportTypeForActive = activeReport ? reportKeyByActive[activeReport] : null;
    const safeActiveReport = reportTypeForActive && canViewReport(user, reportTypeForActive) ? activeReport : null;

    const officialSections = useMemo(() => filterOfficialSectionsForUser(user, sections), [user, sections]);
    const officialSubjects = useMemo(() => filterOfficialRecords(subjects).filter(s => s.term !== 'none'), [subjects]);

    const activeSectionName = useMemo(() => {
        if (selectedSectionFilter === 'all') return 'All Sections';
        const section = officialSections.find(s => s.id === selectedSectionFilter);
        return section ? `${section.section_grade_level} - ${section.section_name}` : 'Unknown Section';
    }, [officialSections, selectedSectionFilter]);

    const sortedSections = useMemo(() => {
        return [...officialSections].sort((a, b) => {
            const getGradeNum = (val: string) => {
                const num = val.match(/\d+/);
                return num ? parseInt(num[0]) : 0;
            };
            const gradeA = getGradeNum(a.section_grade_level);
            const gradeB = getGradeNum(b.section_grade_level);
            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [officialSections]);

    // Auto-select single section if it's the only one
    useEffect(() => {
        if (sortedSections.length === 1 && selectedSectionFilter === 'all') {
            const timer = setTimeout(() => {
                setSelectedSectionFilter(sortedSections[0].id);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [sortedSections, selectedSectionFilter]);

    // Filter subjects by section
    const filteredSubjects = useMemo(() => {
        if (selectedSectionFilter === 'all') return officialSubjects;
        return officialSubjects.filter(s => s.section_id === selectedSectionFilter);
    }, [officialSubjects, selectedSectionFilter]);

    // Active Students ONLY (No Ghosts!)
    const validStudents = useMemo(() => {
        const validSections = new Set([...officialSections.map(s => s.section_name), ...officialSections.map(s => s.id)]);
        return students.filter(s => s.student_section && validSections.has(s.student_section));
    }, [students, officialSections]);

    const consolidatedOfficialRecords = useMemo(() => {
        // First, limit to records belonging to VALID students (no ghosts)
        const validLrns = new Set(validStudents.map(s => s.lrn));
        
        // LIMIT TO VALID SUBJECTS (exclude orphaned grades for deleted subjects)
        const validSubjectIds = new Set(officialSubjects.map(s => s.id));

        const baseRecords = filterOfficialRecords(gradingSheetRecords).filter(r => {
            const hasValidRefs = validLrns.has(r.student_lrn) && validSubjectIds.has(r.subject_id);
            if (!hasValidRefs) return false;

            return (Number(r.final_grade) || 0) > 0;
        });

        // AUTO-CONSOLIDATE: Group by student/subject/quarter to eliminate ghost duplicates
        const consolidatedMap = new Map<string, typeof gradingSheetRecords[0]>();
        
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

        return Array.from(consolidatedMap.values());
    }, [gradingSheetRecords, validStudents, officialSubjects]);

    const filteredRecords = useMemo(() => {
        if (selectedSectionFilter === 'all') return consolidatedOfficialRecords;

        // Then filter by section subjects
        const sectionSubjectIds = new Set(filteredSubjects.map(s => s.id));
        return consolidatedOfficialRecords.filter(r => sectionSubjectIds.has(r.subject_id));
    }, [consolidatedOfficialRecords, filteredSubjects, selectedSectionFilter]);

    // MPS Data
    const mpsData = useMemo(() =>
        getMPSPerSubject(filteredRecords, filteredSubjects, selectedQuarter),
        [filteredRecords, filteredSubjects, selectedQuarter]
    );

    // Honor Roll
    const honorRoll = useMemo(() =>
        generateHonorRoll(validStudents, filteredRecords, filteredSubjects, sections, selectedQuarter, activeSchoolYear),
        [validStudents, filteredRecords, filteredSubjects, sections, selectedQuarter, activeSchoolYear]
    );

    // Subject Awardees
    const subjectAwardees = useMemo(() =>
        getSubjectAwardees(validStudents, filteredRecords, filteredSubjects, sections, selectedQuarter, activeSchoolYear),
        [validStudents, filteredRecords, filteredSubjects, sections, selectedQuarter, activeSchoolYear]
    );

    // Grouped Honor Data
    const groupedHonorData = useMemo(() => {
        const groups: Record<string, { honors: typeof honorRoll, awards: typeof subjectAwardees }> = {};
        
        sections.forEach(sec => {
            if (sec.is_teaching_load) return; // Skip in Honor Roll Report
            const gradeStr = sec.section_grade_level ? sec.section_grade_level.replace('Grade ', 'G') : 'U';
            const groupName = `${gradeStr} - ${sec.section_name}`;
            groups[groupName] = { honors: [], awards: [] };
        });

        honorRoll.forEach(item => {
            const gradeStr = item.student.grade_level ? item.student.grade_level.replace('Grade ', 'G') : 'U';
            const groupName = `${gradeStr} - ${item.sectionName}`;
            if (!groups[groupName]) groups[groupName] = { honors: [], awards: [] };
            groups[groupName].honors.push(item);
        });

        subjectAwardees.forEach(item => {
            const sec = sections.find(s => s.section_name === item.sectionName);
            const gradeStr = sec && sec.section_grade_level ? sec.section_grade_level.replace('Grade ', 'G') : 'U';
            const groupStr = `${gradeStr} - ${item.sectionName}`;
            if (!groups[groupStr]) groups[groupStr] = { honors: [], awards: [] };
            groups[groupStr].awards.push(item);
        });

        return Object.entries(groups)
            .filter(([, data]) => data.honors.length > 0 || data.awards.length > 0)
            .map(([groupName, data]) => ({ groupName, items: data.honors, awards: data.awards }))
            .sort((a, b) => {
                const gradeMatchA = a.groupName.match(/G(\d+)/i);
                const gradeMatchB = b.groupName.match(/G(\d+)/i);
                
                const gradeA = gradeMatchA ? parseInt(gradeMatchA[1], 10) : 0;
                const gradeB = gradeMatchB ? parseInt(gradeMatchB[1], 10) : 0;

                if (gradeA !== gradeB) {
                    return gradeA - gradeB; // Ascending: G7 before G8
                }
                return a.groupName.localeCompare(b.groupName);
            });
    }, [honorRoll, subjectAwardees, sections]);

    // At-Risk
    const atRiskStudents = useMemo(() =>
        getAtRiskStudents(validStudents, filteredRecords, filteredSubjects, selectedQuarter),
        [validStudents, filteredRecords, filteredSubjects, selectedQuarter]
    );

    // Grouped At-Risk Students (by student)
    const groupedAtRiskStudents = useMemo(() => {
        const grouped = new Map<string, { student: typeof validStudents[0], subjects: Array<{ subjectName: string, grade: number }> }>();

        atRiskStudents.forEach(item => {
            const key = item.student.lrn;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    student: item.student,
                    subjects: []
                });
            }
            grouped.get(key)!.subjects.push({
                subjectName: item.subjectName,
                grade: item.grade
            });
        });

        return Array.from(grouped.values()).sort((a, b) => {
            // Sort by number of failing subjects (most first), then by name
            if (b.subjects.length !== a.subjects.length) {
                return b.subjects.length - a.subjects.length;
            }
            return a.student.last_name.localeCompare(b.student.last_name);
        });
    }, [atRiskStudents]);

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
            subject: (d.subjectName?.length || 0) > 12 ? d.subjectName.substring(0, 12) + '...' : (d.subjectName || 'Unknown'),
            mps: d.mps,
            passRate: d.passRate,
        }));
    }, [mpsData]);

    const previousQuarterMPSData = useMemo(() => {
        if (typeof selectedQuarter !== 'number' || selectedQuarter <= 1) return [];
        const prevQuarter = (selectedQuarter - 1) as 1 | 2 | 3;
        return getMPSPerSubject(filteredRecords, filteredSubjects, prevQuarter);
    }, [filteredRecords, filteredSubjects, selectedQuarter]);

    const subjectPerformanceInsights = useMemo(() => {
        const sortedByMps = [...mpsData].sort((a, b) => b.mps - a.mps);
        const strongest = sortedByMps[0];
        const weakest = sortedByMps[sortedByMps.length - 1];

        const termRecords = filteredRecords.filter(
            r => r.quarter === selectedQuarter && (Number(r.final_grade) || 0) > 0
        );
        const passing = termRecords.filter(r => (Number(r.final_grade) || 0) >= 75).length;
        const overallPassRate = termRecords.length > 0 ? Math.round((passing / termRecords.length) * 100) : 0;
        const overallMps = mpsData.length > 0
            ? Math.round((mpsData.reduce((sum, row) => sum + row.mps, 0) / mpsData.length) * 100) / 100
            : 0;
        const belowTargetCount = mpsData.filter(row => row.mps < 75).length;

        return {
            strongest,
            weakest,
            overallPassRate,
            overallMps,
            belowTargetCount,
            subjectCount: mpsData.length,
        };
    }, [mpsData, filteredRecords, selectedQuarter]);

    const subjectComparisonRows = useMemo(() => {
        const prevMap = new Map(previousQuarterMPSData.map(row => [row.subjectName, row.mps]));

        return [...mpsData]
            .sort((a, b) => {
                if (b.mps !== a.mps) return b.mps - a.mps;
                return b.passRate - a.passRate;
            })
            .map((row, idx) => {
                const prevMps = prevMap.get(row.subjectName);
                const delta = typeof prevMps === 'number'
                    ? Math.round((row.mps - prevMps) * 100) / 100
                    : null;

                return {
                    rank: idx + 1,
                    ...row,
                    delta,
                };
            });
    }, [mpsData, previousQuarterMPSData]);

    const subjectInterventions = useMemo(() => {
        return [...subjectComparisonRows]
            .sort((a, b) => a.mps - b.mps)
            .slice(0, 3)
            .map((row) => {
                let priority: 'Urgent' | 'Remediation' | 'Monitor' = 'Monitor';
                let action = 'Track weekly classwork and continue guided review sessions.';

                if (row.mps < 70) {
                    priority = 'Urgent';
                    action = 'Set immediate intervention with parent conference and focused reteaching.';
                } else if (row.mps < 75) {
                    priority = 'Remediation';
                    action = 'Schedule remediation blocks and weekly competency recovery checks.';
                }

                return {
                    ...row,
                    priority,
                    action,
                };
            });
    }, [subjectComparisonRows]);

    // Learner progress (per term)
    const progressData = useMemo(() => {
        const terms: (1 | 2 | 3)[] = [1, 2, 3];
        return terms.map(q => {
            const qRecords = filteredRecords.filter(r => Number(r.quarter) === q && (Number(r.final_grade) || 0) > 0);
            const avg = qRecords.length > 0
                ? Math.round((qRecords.reduce((sum, r) => sum + (Number(r.final_grade) || 0), 0) / qRecords.length) * 100) / 100
                : 0;
            const passing = qRecords.filter(r => (Number(r.final_grade) || 0) >= 75).length;
            const passRate = qRecords.length > 0 ? Math.round((passing / qRecords.length) * 100) : 0;
            return { quarter: `T${q}`, average: avg, passRate, totalRecords: qRecords.length };
        });
    }, [filteredRecords]);

    const progressInsights = useMemo(() => {
        if (progressData.length < 3) return null;

        const t1 = progressData[0];
        const t3 = progressData[2];

        const gradeImprovement = t3.average - t1.average;
        const passImprovement = t3.passRate - t1.passRate;

        const overallTrend = gradeImprovement > 0 ? 'improving' : gradeImprovement < 0 ? 'declining' : 'stable';

        // Calculate subject progress without nested useMemo
        const terms: (1 | 2 | 3)[] = [1, 2, 3];
        const subjectMap = new Map<string, Array<{ term: number; average: number; count: number }>>();

        terms.forEach(q => {
            const qRecords = filteredRecords.filter(r => Number(r.quarter) === q && (Number(r.final_grade) || 0) > 0);
            const subjectGroups = qRecords.reduce((acc, r) => {
                const subj = subjects.find(s => s.id === r.subject_id)?.subject_name || 'Unknown';
                if (!acc[subj]) acc[subj] = [];
                acc[subj].push(Number(r.final_grade) || 0);
                return acc;
            }, {} as Record<string, number[]>);

            Object.entries(subjectGroups).forEach(([subj, grades]) => {
                const avg = grades.length > 0 ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100 : 0;
                if (!subjectMap.has(subj)) subjectMap.set(subj, []);
                subjectMap.get(subj)!.push({ term: q, average: avg, count: grades.length });
            });
        });

        const subjectProgress = Array.from(subjectMap.entries()).map(([subject, data]) => ({
            subject,
            data: data.sort((a, b) => a.term - b.term)
        }));

        return {
            gradeImprovement: Math.round(gradeImprovement * 100) / 100,
            passImprovement,
            overallTrend,
            subjectProgress
        };
    }, [progressData, filteredRecords, subjects]);

    const handleExportMPS = () => {
        if (!canEditReport(user, 'quarterly-summaries')) return;
        exportToCSV(mpsData.map(d => ({
            'Subject': d.subjectName,
            'MPS': d.mps,
            'Pass Rate (%)': d.passRate,
            'Total Students': d.totalStudents,
        })), `MPS_Report_T${selectedQuarter}`);
    };

    const handleExportHonorRoll = () => {
        if (!canEditReport(user, 'honor-roll')) return;
        exportToCSV(honorRoll.map(h => ({
            'Name': `${h.student.last_name}, ${h.student.first_name}`,
            'Section': h.sectionName,
            'General Average': h.generalAverage,
            'Honor Type': h.honorType,
        })), `Honor_Roll_T${selectedQuarter}`);
    };

    const handleExportAtRisk = () => {
        if (!canEditReport(user, 'at-risk-students')) return;
        exportToCSV(atRiskStudents.map(a => ({
            'Name': `${a.student.last_name}, ${a.student.first_name}`,
            'Subject': a.subjectName,
            'Grade': a.grade,
            'Section': a.student.student_section || '',
        })), `At_Risk_Students_T${selectedQuarter}`);
    };

    const renderQuarterSelector = () => (
        <div className="flex items-center p-1 bg-gray-100/80 rounded-xl w-fit">
            {([1, 2, 3] as const).map(q => (
                <button
                    key={q}
                    onClick={() => setSelectedQuarter(q)}
                    className={`px-5 py-2 rounded-lg text-xs font-black transition-all duration-300 ${selectedQuarter === q
                        ? 'bg-white text-green-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    T{q}
                </button>
            ))}
            {safeActiveReport === 'honor-roll' && (
                <button
                    onClick={() => setSelectedQuarter('overall')}
                    className={`px-5 py-2 rounded-lg text-xs font-black transition-all duration-300 ml-1 ${selectedQuarter === 'overall'
                        ? 'bg-green-700 text-white shadow-md'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    FINAL
                </button>
            )}
        </div>
    );

    const renderSectionFilter = () => {
        if (sortedSections.length <= 1) return null;
        return (
            <select
                value={selectedSectionFilter}
                onChange={(e) => setSelectedSectionFilter(e.target.value)}
                className="text-xs font-bold border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-deped-blue/20"
            >
                <option value="all">All Sections</option>
                {sortedSections.map(s => (
                    <option key={s.id} value={s.id}>{s.section_grade_level} - {s.section_name}</option>
                ))}
            </select>
        );
    };
    
    // NEW: Record Details Modal
    const renderRecordDetailsModal = () => {
        if (!selectedDetailMetric) return null;

        const records = selectedDetailMetric === 'total' 
            ? filteredRecords.filter(r => r.quarter === selectedQuarter && (Number(r.final_grade) || 0) > 0)
            : filteredRecords.filter(r => {
                const grade = Number(r.final_grade) || 0;
                return r.quarter === selectedQuarter && grade > 0 && grade < 75;
            });

        return (
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-deped-blue/20 backdrop-blur-md">
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
                                Term {selectedQuarter} • {records.length} {records.length === 1 ? 'Record' : 'Records'} Found
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
                                                    {sections.find(s => s.id === student?.student_section || s.section_name === student?.student_section)?.section_name || student?.student_section || 'N/A'}
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



    const sectionStudentsForRequirements = useMemo(() => {
        if (selectedSectionFilter === 'all') return validStudents;
        const section = officialSections.find(s => s.id === selectedSectionFilter);
        const nameOrId = section ? section.section_name : selectedSectionFilter;
        return validStudents.filter(s => s.student_section === nameOrId || s.student_section === selectedSectionFilter);
    }, [validStudents, selectedSectionFilter, officialSections]);

    const filteredStudentsForRequirements = useMemo(() => {
        return sectionStudentsForRequirements.filter(student => {
            const stats = getStudentRequirementStats(student);
            if (reqFilter === 'complete') return stats.isComplete;
            if (reqFilter === 'pending') return !stats.isComplete;
            return true;
        });
    }, [sectionStudentsForRequirements, reqFilter]);

    const handleToggleRequirement = async (
        student: Student,
        field: 'req_report_card' | 'req_birth_cert' | 'req_sf10' | 'req_good_moral' | 'req_beef' | 'req_eccd' | 'req_undertaking',
        value: boolean
    ) => {
        await useAppStore.getState().updateStudent(student.lrn, { [field]: value });
    };

    const handleExportRequirements = () => {
        const data = sectionStudentsForRequirements.map(s => {
            const stats = getStudentRequirementStats(s);
            const isG1K = isKinderOrG1(s.grade_level);
            return {
                'LRN': s.lrn,
                'Last Name': s.last_name,
                'First Name': s.first_name,
                'Middle Name': s.middle_name || '',
                'Gender': s.gender,
                'Grade Level': s.grade_level,
                'Section': s.student_section || '',
                'Report Card (SF9)': s.req_report_card ? 'Submitted' : (isG1K ? 'N/A' : 'Pending'),
                'Birth Certificate (PSA)': s.req_birth_cert ? 'Submitted' : 'Pending',
                'SF10 / Form 137': s.req_sf10 ? 'Submitted' : (isG1K ? 'N/A' : 'Pending'),
                'Good Moral': s.req_good_moral ? 'Submitted' : (isG1K ? 'N/A' : 'Pending'),
                'BEEF Form': s.req_beef ? 'Submitted' : 'Pending',
                'ECCD Checklist': s.req_eccd ? 'Submitted' : (isG1K ? 'Pending' : 'N/A'),
                'Affidavit of Undertaking': s.req_undertaking ? 'Submitted' : 'None',
                'Completion Status': stats.isComplete ? 'Complete' : (s.req_undertaking ? 'Temporary (Undertaking)' : 'Incomplete'),
                'Submitted Count': `${stats.submittedCount}/${stats.totalRequired}`
            };
        });
        exportToCSV(data, `Requirements_Checklist_${activeSectionName.replace(/\s+/g, '_')}_${activeSchoolYear}`);
    };

    const renderRequirementsChecklist = () => {
        const totalCount = sectionStudentsForRequirements.length;
        const completeCount = sectionStudentsForRequirements.filter(s => getStudentRequirementStats(s).isComplete).length;
        const pendingCount = totalCount - completeCount;
        const undertakingCount = sectionStudentsForRequirements.filter(s => s.req_undertaking).length;

        return (
            <motion.div
                key="requirements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
            >
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 shadow-xs">
                        <p className="text-sm font-bold text-blue-700">{totalCount} Students</p>
                        <p className="text-xs text-blue-600">Total in Section</p>
                    </div>
                    <div className="bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100 shadow-xs">
                        <p className="text-sm font-bold text-emerald-700">{completeCount} Complete</p>
                        <p className="text-xs text-emerald-600">All required documents submitted</p>
                    </div>
                    <div className="bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 shadow-xs">
                        <p className="text-sm font-bold text-rose-700">{pendingCount} Pending / Incomplete</p>
                        <p className="text-xs text-rose-600">Missing at least one requirement</p>
                    </div>
                    <div className="bg-amber-50 px-4 py-3 rounded-xl border border-amber-100 shadow-xs">
                        <p className="text-sm font-bold text-amber-700">{undertakingCount} Under Undertaking</p>
                        <p className="text-xs text-amber-600">Temporarily enrolled via Affidavit</p>
                    </div>
                </div>

                {/* Filter and Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-600">Filter Status:</span>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setReqFilter('all')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                    reqFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                All ({totalCount})
                            </button>
                            <button
                                onClick={() => setReqFilter('complete')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                    reqFilter === 'complete' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Complete ({completeCount})
                            </button>
                            <button
                                onClick={() => setReqFilter('pending')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                    reqFilter === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Pending ({pendingCount})
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={handleExportRequirements} 
                        disabled={totalCount === 0}
                        className="text-xs flex items-center gap-2 text-deped-blue hover:bg-blue-50 font-bold px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>

                {/* Checklist Table */}
                <div className="bg-white rounded-2xl shadow-xs border border-gray-150 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-linear-to-r from-deped-blue to-blue-700 text-white">
                                    <th className="px-4 py-3.5 text-left font-bold uppercase tracking-wider">Student Name</th>
                                    <th className="px-3 py-3.5 text-center font-bold uppercase tracking-wider text-wrap max-w-[80px]">Report Card (SF9)</th>
                                    <th className="px-3 py-3.5 text-center font-bold uppercase tracking-wider text-wrap max-w-[80px]">Birth Cert (PSA)</th>
                                    <th className="px-3 py-3.5 text-center font-bold uppercase tracking-wider text-wrap max-w-[80px]">SF10 / Form 137</th>
                                    <th className="px-3 py-3.5 text-center font-bold uppercase tracking-wider text-wrap max-w-[80px]">Good Moral</th>
                                    <th className="px-3 py-3.5 text-center font-bold uppercase tracking-wider text-wrap max-w-[80px]">BEEF Form</th>
                                    <th className="px-3 py-3.5 text-center font-bold uppercase tracking-wider text-wrap max-w-[80px]">ECCD Checklist</th>
                                    <th className="px-3 py-3.5 text-center font-bold uppercase tracking-wider text-wrap max-w-[80px]">Undertaking</th>
                                    <th className="px-4 py-3.5 text-center font-bold uppercase tracking-wider">Progress</th>
                                    <th className="px-4 py-3.5 text-right font-bold uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredStudentsForRequirements.map((student) => {
                                    const stats = getStudentRequirementStats(student);
                                    const isG1K = isKinderOrG1(student.grade_level);

                                    return (
                                        <tr key={student.lrn} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-gray-800">
                                                <div className="font-extrabold text-sm uppercase text-gray-800">
                                                    {student.last_name}, {student.first_name} {student.middle_name ? `${student.middle_name.charAt(0)}.` : ''}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-bold tracking-wider mt-0.5">
                                                    LRN: {student.lrn} | {student.grade_level}
                                                </div>
                                            </td>

                                            {/* Report Card */}
                                            <td className="px-3 py-3 text-center">
                                                {isG1K ? (
                                                    <span className="text-[10px] text-gray-300 font-bold italic">N/A</span>
                                                ) : (
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!student.req_report_card}
                                                        onChange={(e) => handleToggleRequirement(student, 'req_report_card', e.target.checked)}
                                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                    />
                                                )}
                                            </td>

                                            {/* Birth Cert */}
                                            <td className="px-3 py-3 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!student.req_birth_cert}
                                                    onChange={(e) => handleToggleRequirement(student, 'req_birth_cert', e.target.checked)}
                                                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                />
                                            </td>

                                            {/* SF10 */}
                                            <td className="px-3 py-3 text-center">
                                                {isG1K ? (
                                                    <span className="text-[10px] text-gray-300 font-bold italic">N/A</span>
                                                ) : (
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!student.req_sf10}
                                                        onChange={(e) => handleToggleRequirement(student, 'req_sf10', e.target.checked)}
                                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                    />
                                                )}
                                            </td>

                                            {/* Good Moral */}
                                            <td className="px-3 py-3 text-center">
                                                {isG1K ? (
                                                    <span className="text-[10px] text-gray-300 font-bold italic">N/A</span>
                                                ) : (
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!student.req_good_moral}
                                                        onChange={(e) => handleToggleRequirement(student, 'req_good_moral', e.target.checked)}
                                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                    />
                                                )}
                                            </td>

                                            {/* BEEF Form */}
                                            <td className="px-3 py-3 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!student.req_beef}
                                                    onChange={(e) => handleToggleRequirement(student, 'req_beef', e.target.checked)}
                                                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                />
                                            </td>

                                            {/* ECCD Checklist */}
                                            <td className="px-3 py-3 text-center">
                                                {isG1K ? (
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!student.req_eccd}
                                                        onChange={(e) => handleToggleRequirement(student, 'req_eccd', e.target.checked)}
                                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                    />
                                                ) : (
                                                    <span className="text-[10px] text-gray-300 font-bold italic">N/A</span>
                                                )}
                                            </td>

                                            {/* Affidavit of Undertaking */}
                                            <td className="px-3 py-3 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!student.req_undertaking}
                                                    onChange={(e) => handleToggleRequirement(student, 'req_undertaking', e.target.checked)}
                                                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                />
                                            </td>

                                            {/* Progress bar and text */}
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`text-[10px] font-black ${stats.isComplete ? 'text-emerald-600' : 'text-gray-500'}`}>
                                                        {stats.submittedCount} / {stats.totalRequired}
                                                    </span>
                                                    <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                        <div 
                                                            className={`h-full transition-all duration-350 ${stats.isComplete ? 'bg-emerald-500' : stats.isTemporary ? 'bg-amber-400' : 'bg-blue-500'}`} 
                                                            style={{ width: `${(stats.submittedCount / stats.totalRequired) * 100}%` }}
                                                        />
                                                    </div>
                                                    {stats.isComplete ? (
                                                        <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-emerald-100 mt-0.5">COMPLETE</span>
                                                    ) : stats.isTemporary ? (
                                                        <span className="bg-amber-50 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-100 mt-0.5">UNDERTAKING</span>
                                                    ) : (
                                                        <span className="bg-gray-50 text-gray-500 text-[8px] font-bold px-1.5 py-0.5 rounded border border-gray-200 mt-0.5">PENDING</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <button 
                                                        onClick={async () => {
                                                            const updates: Partial<Student> = {};
                                                            stats.requiredDocs.forEach(doc => {
                                                                const key = doc as 'req_report_card' | 'req_birth_cert' | 'req_sf10' | 'req_good_moral' | 'req_beef' | 'req_eccd' | 'req_undertaking';
                                                                updates[key] = true;
                                                            });
                                                            await useAppStore.getState().updateStudent(student.lrn, updates);
                                                        }}
                                                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-[9px] font-black rounded uppercase transition-colors"
                                                        title="Mark all required documents as submitted"
                                                    >
                                                        All
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            const updates: Partial<Student> = {};
                                                            stats.requiredDocs.forEach(doc => {
                                                                const key = doc as 'req_report_card' | 'req_birth_cert' | 'req_sf10' | 'req_good_moral' | 'req_beef' | 'req_eccd' | 'req_undertaking';
                                                                updates[key] = false;
                                                            });
                                                            updates.req_undertaking = false;
                                                            await useAppStore.getState().updateStudent(student.lrn, updates);
                                                        }}
                                                        className="px-2 py-1 bg-gray-50 hover:bg-gray-250 text-gray-500 text-[9px] font-black rounded uppercase transition-colors"
                                                        title="Reset all checkboxes"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredStudentsForRequirements.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-20 text-center text-gray-400 italic">
                                            {totalCount === 0 ? 'No students enrolled in this section.' : 'No students matching the selected status filter.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        );
    };

    if (safeActiveReport) {
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
                                {safeActiveReport === 'quarterly' && 'Term Summary Report'}
                                {safeActiveReport === 'subject' && 'Subject Performance'}
                                {safeActiveReport === 'progress' && 'Learner Progress Tracker'}
                                {safeActiveReport === 'at-risk' && 'At-Risk Students Report'}
                                {safeActiveReport === 'honor-roll' && 'Academic Excellence Awards Report'}
                                {safeActiveReport === 'requirements' && 'Checklist of Requirements'}
                            </h2>
                            {sortedSections.length === 1 && (
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                    Section: {activeSectionName}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {renderSectionFilter()}
                        {renderQuarterSelector()}
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {renderRecordDetailsModal()}
                    {/* TERM SUMMARY */}
                    {safeActiveReport === 'quarterly' && (
                        <motion.div
                            key="quarterly"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {(() => {
                                const quarterlyIdx = typeof selectedQuarter === 'number' ? selectedQuarter - 1 : 0;
                                return (
                                    <>
                                        {/* Stats */}
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Total Records', value: filteredRecords.filter(r => r.quarter === selectedQuarter && (Number(r.final_grade) || 0) > 0).length, color: 'blue', onClick: () => setSelectedDetailMetric('total') },
                                                { label: 'Average Grade', value: progressData[quarterlyIdx]?.average || 0, color: 'green' },
                                                { label: 'Pass Rate', value: `${progressData[quarterlyIdx]?.passRate || 0}%`, color: 'yellow' },
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
                                    </>
                                );
                            })()}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* MPS Chart */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-gray-800">Mean Percentage Score (MPS)</h3>
                                        <button onClick={handleExportMPS} disabled={!canEditReport(user, 'quarterly-summaries')} className="text-xs flex items-center gap-1 text-deped-blue hover:underline font-bold disabled:opacity-40 disabled:cursor-not-allowed">
                                            <Download className="w-3 h-3" /> Export CSV
                                        </button>
                                    </div>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
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
                                        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
                                            <PieChart>
                                                <Pie
                                                    data={gradeDistribution.filter(d => d.count > 0)}
                                                    dataKey="count"
                                                    nameKey="range"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    label={({ index }: { index?: number }) => {
                                                        const activeData = gradeDistribution.filter(d => d.count > 0);
                                                        const entry = typeof index === 'number' ? activeData[index] : undefined;
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
                                        <p className="text-center py-8 text-gray-400 italic">No graded records for Term {selectedQuarter}</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* SUBJECT PERFORMANCE */}
                    {safeActiveReport === 'subject' && (
                        <motion.div
                            key="subject"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall MPS</p>
                                    <p className="text-3xl font-black text-deped-blue mt-1">{subjectPerformanceInsights.overallMps}%</p>
                                    <p className="text-[11px] text-gray-500 mt-1">Across {subjectPerformanceInsights.subjectCount} subjects</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall Pass Rate</p>
                                    <p className="text-3xl font-black text-emerald-600 mt-1">{subjectPerformanceInsights.overallPassRate}%</p>
                                    <p className="text-[11px] text-gray-500 mt-1">Term {selectedQuarter} graded records</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Top Subject</p>
                                    <p className="text-lg font-black text-gray-800 mt-1 uppercase">
                                        {subjectPerformanceInsights.strongest?.subjectName || 'N/A'}
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-1">MPS: {subjectPerformanceInsights.strongest?.mps ?? 0}%</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Needs Support</p>
                                    <p className="text-lg font-black text-gray-800 mt-1 uppercase">
                                        {subjectPerformanceInsights.weakest?.subjectName || 'N/A'}
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        {subjectPerformanceInsights.belowTargetCount} subject(s) below 75 MPS
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Radar Chart */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4">Subject Comparison Radar</h3>
                                    <div className="h-80">
                                        {radarData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
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
                                        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
                                            <BarChart data={mpsData} margin={{ bottom: 60 }}>
                                                <XAxis
                                                    dataKey="subjectName"
                                                    tick={{ fontSize: 9 }}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    interval={0}
                                                    height={70}
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

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-800">Subject Performance Details</h3>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        Trend vs {typeof selectedQuarter === 'number' && selectedQuarter > 1 ? `T${selectedQuarter - 1}` : 'Previous Term'}
                                    </p>
                                </div>
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 text-left">
                                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Rank</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Subject</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">MPS</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Pass Rate</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Students</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {subjectComparisonRows.map((row) => (
                                            <tr key={row.subjectName} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-black text-gray-600">#{row.rank}</td>
                                                <td className="px-4 py-3 font-bold text-sm text-gray-800">{row.subjectName}</td>
                                                <td className="px-4 py-3 text-center text-sm font-black text-deped-blue">{row.mps}%</td>
                                                <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{row.passRate}%</td>
                                                <td className="px-4 py-3 text-center text-sm text-gray-500">{row.totalStudents}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {row.delta === null ? (
                                                        <span className="text-xs font-bold text-gray-400">N/A</span>
                                                    ) : row.delta > 0 ? (
                                                        <span className="text-xs font-black text-emerald-600">+{row.delta}</span>
                                                    ) : row.delta < 0 ? (
                                                        <span className="text-xs font-black text-red-600">{row.delta}</span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-gray-500">0.00</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {subjectComparisonRows.length === 0 && (
                                    <p className="text-center py-8 text-gray-400 italic">No graded records for Term {selectedQuarter}</p>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4">Intervention Insights</h3>
                                <div className="space-y-3">
                                    {subjectInterventions.map((item) => (
                                        <div key={item.subjectName} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-black text-gray-800 text-sm uppercase">{item.subjectName}</p>
                                                    <p className="text-xs font-bold text-gray-500 mt-0.5">MPS: {item.mps}% • Pass Rate: {item.passRate}%</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                                    item.priority === 'Urgent'
                                                        ? 'bg-red-100 text-red-700'
                                                        : item.priority === 'Remediation'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {item.priority}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-2 leading-relaxed">{item.action}</p>
                                        </div>
                                    ))}
                                    {subjectInterventions.length === 0 && (
                                        <p className="text-center py-6 text-gray-400 italic">No intervention insight available for this term.</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* LEARNER PROGRESS */}
                    {safeActiveReport === 'progress' && (
                        <motion.div
                            key="progress"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Progress Summary */}
                            {progressInsights && (
                                <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 rounded-xl">
                                            <TrendingUp className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">Academic Growth Summary</h3>
                                            <p className="text-sm text-gray-600">
                                                From T1 to T3: Grade improved by {progressInsights.gradeImprovement > 0 ? '+' : ''}{progressInsights.gradeImprovement} points,
                                                Pass Rate by {progressInsights.passImprovement > 0 ? '+' : ''}{progressInsights.passImprovement}%
                                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                                                    progressInsights.overallTrend === 'improving' ? 'bg-green-100 text-green-700' :
                                                    progressInsights.overallTrend === 'declining' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {progressInsights.overallTrend === 'improving' ? 'Improving' :
                                                     progressInsights.overallTrend === 'declining' ? 'Declining' : 'Stable'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4">Academic Progress Across Terms</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 100, height: 100 }}>
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
                                <h3 className="font-bold text-gray-800 mb-4">Term-by-Term Stats</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    {progressData.map((p, idx) => {
                                        const prev = idx > 0 ? progressData[idx - 1] : null;
                                        const gradeChange = prev ? p.average - prev.average : 0;

                                        return (
                                            <div key={p.quarter} className={`p-4 rounded-xl border-2 transition-all ${p.quarter === `T${selectedQuarter}` ? 'border-deped-blue bg-blue-50' : 'border-gray-100'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-lg font-black text-deped-blue">{p.quarter}</p>
                                                    {prev && (
                                                        <div className="flex items-center gap-1">
                                                            {gradeChange > 0 ? <ArrowUp className="w-3 h-3 text-green-600" /> :
                                                             gradeChange < 0 ? <ArrowDown className="w-3 h-3 text-red-600" /> :
                                                             <Minus className="w-3 h-3 text-gray-600" />}
                                                            <span className={`text-xs font-bold ${gradeChange > 0 ? 'text-green-600' : gradeChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                                                {gradeChange > 0 ? '+' : ''}{Math.round(gradeChange * 100) / 100}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-2xl font-black text-gray-800">{p.average || '—'}</p>
                                                <p className="text-xs text-gray-500 font-bold">Avg Grade</p>
                                                <div className="mt-2 pt-2 border-t border-gray-100">
                                                    <p className="text-sm font-bold text-green-600">{p.passRate}% Pass</p>
                                                    <p className="text-[10px] text-gray-400">{p.totalRecords} records</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Subject Progress Table */}
                            {progressInsights?.subjectProgress && progressInsights.subjectProgress.length > 0 && (
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                                    <h3 className="font-bold text-gray-800 mb-4">Subject Progress Details</h3>
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 text-left">
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Subject</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">T1 Avg</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">T2 Avg</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">T3 Avg</th>
                                                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Improvement</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {progressInsights.subjectProgress.map((subj) => {
                                                const t1 = subj.data.find((d) => d.term === 1)?.average || 0;
                                                const t3 = subj.data.find((d) => d.term === 3)?.average || 0;
                                                const improvement = t3 - t1;

                                                return (
                                                    <tr key={subj.subject} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-bold text-sm text-gray-800">{subj.subject}</td>
                                                        <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{t1 || '—'}</td>
                                                        <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{subj.data.find((d) => d.term === 2)?.average || '—'}</td>
                                                        <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{t3 || '—'}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            {improvement !== 0 ? (
                                                                <span className={`text-sm font-bold flex items-center justify-center gap-1 ${improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {improvement > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                                                    {improvement > 0 ? '+' : ''}{Math.round(improvement * 100) / 100}
                                                                </span>
                                                            ) : (
                                                                <span className="text-sm font-bold text-gray-500">0.00</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* AT-RISK STUDENTS */}
                    {safeActiveReport === 'at-risk' && (
                        <motion.div
                            key="at-risk"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                                    <p className="text-sm font-bold text-red-700">{groupedAtRiskStudents.length} at-risk learners</p>
                                    <p className="text-xs text-red-600">Unique students failing ≥1 subject</p>
                                </div>
                                <div className="bg-orange-50 px-4 py-3 rounded-xl border border-orange-100">
                                    <p className="text-sm font-bold text-orange-700">{atRiskStudents.length} total failing grades</p>
                                    <p className="text-xs text-orange-600">Individual subject failures</p>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                                    <p className="text-sm font-bold text-gray-700">
                                        {groupedAtRiskStudents.length > 0 ? Math.round((groupedAtRiskStudents.reduce((sum, s) => sum + s.subjects.length, 0) / groupedAtRiskStudents.length) * 10) / 10 : 0} avg subjects failed
                                    </p>
                                    <p className="text-xs text-gray-600">Per at-risk student</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-600">View Mode:</span>
                                    <div className="flex bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={() => setAtRiskViewMode('grouped')}
                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                                atRiskViewMode === 'grouped' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            Grouped ({groupedAtRiskStudents.length})
                                        </button>
                                        <button
                                            onClick={() => setAtRiskViewMode('detailed')}
                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                                atRiskViewMode === 'detailed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            Detailed ({atRiskStudents.length})
                                        </button>
                                    </div>
                                </div>
                                <button onClick={handleExportAtRisk} disabled={!canEditReport(user, 'at-risk-students')} className="text-xs flex items-center gap-1 text-deped-blue hover:underline font-bold px-3 py-2 bg-white rounded-lg shadow-sm border disabled:opacity-40 disabled:cursor-not-allowed">
                                    <Download className="w-3 h-3" /> Export CSV
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {atRiskViewMode === 'grouped' ? (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-linear-to-r from-red-600 to-rose-500 text-white">
                                                <th className="px-5 py-4 text-left text-xs font-bold uppercase">#</th>
                                                <th className="px-5 py-4 text-left text-xs font-bold uppercase">Student Name</th>
                                                <th className="px-5 py-4 text-left text-xs font-bold uppercase">Section</th>
                                                <th className="px-5 py-4 text-left text-xs font-bold uppercase">Failing Subjects</th>
                                                <th className="px-5 py-4 text-center text-xs font-bold uppercase">Count</th>
                                                <th className="px-5 py-4 text-center text-xs font-bold uppercase">Lowest Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {groupedAtRiskStudents.map((item, idx) => {
                                                const lowestGrade = Math.min(...item.subjects.map(s => s.grade));
                                                return (
                                                    <tr key={item.student.lrn} className="hover:bg-red-50/50">
                                                        <td className="px-5 py-3 text-sm text-gray-400 font-bold">{idx + 1}</td>
                                                        <td 
                                                            className="px-5 py-3 font-bold text-sm text-deped-blue hover:text-blue-700 underline cursor-pointer uppercase transition-colors"
                                                            onClick={() => {
                                                                const secObj = sections.find(s => s.section_name === item.student.student_section);
                                                                if (secObj) {
                                                                    setSelectedSection(secObj.section_name);
                                                                    setCurrentView('eclass');
                                                                }
                                                            }}
                                                            title="View student records"
                                                        >
                                                            {item.student.last_name}, {item.student.first_name}
                                                        </td>
                                                        <td className="px-5 py-3 text-sm text-gray-600">{sections.find(s => s.id === item.student.student_section || s.section_name === item.student.student_section)?.section_name || item.student.student_section}</td>
                                                        <td className="px-5 py-3 text-sm text-gray-600">
                                                            <div className="flex flex-wrap gap-1">
                                                                {item.subjects.slice(0, 3).map((subj, subjIdx) => (
                                                                    <span key={subjIdx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">
                                                                        {subj.subjectName}: {subj.grade}
                                                                    </span>
                                                                ))}
                                                                {item.subjects.length > 3 && (
                                                                    <span className="text-xs text-gray-500 font-medium">
                                                                        +{item.subjects.length - 3} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3 text-center">
                                                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-black">
                                                                {item.subjects.length}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-center">
                                                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-black">
                                                                {lowestGrade}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-linear-to-r from-red-600 to-rose-500 text-white">
                                                <th className="px-5 py-4 text-left text-xs font-bold uppercase">#</th>
                                                <th className="px-5 py-4 text-left text-xs font-bold uppercase">Student Name</th>
                                                <th className="px-5 py-4 text-left text-xs font-bold uppercase">Section</th>
                                                <th className="px-5 py-4 text-left text-xs font-bold uppercase">Subject</th>
                                                <th className="px-5 py-4 text-center text-xs font-bold uppercase">Term</th>
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
                                                    <td className="px-5 py-3 text-sm text-gray-600">{sections.find(s => s.id === item.student.student_section || s.section_name === item.student.student_section)?.section_name || item.student.student_section}</td>
                                                    <td className="px-5 py-3 text-sm text-gray-600">{item.subjectName}</td>
                                                    <td className="px-5 py-3 text-center text-sm font-bold text-gray-700">T{selectedQuarter}</td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-black">
                                                            {item.grade}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                                {atRiskStudents.length === 0 && (
                                    <div className="text-center py-12 text-gray-400 italic">
                                        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        No at-risk students found for Term {selectedQuarter}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    {safeActiveReport === 'requirements' && renderRequirementsChecklist()}
                    {safeActiveReport === 'honor-roll' && (
                        <motion.div
                            key="honor-roll"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Segmented Tab Bar */}
                            <div className="flex border-b border-gray-200 dark:border-white/5 mb-6">
                                <button
                                    onClick={() => setAwardsTab('academic')}
                                    className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${awardsTab === 'academic' ? 'border-deped-blue text-deped-blue font-bold dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    Academic & Subject Excellence
                                </button>
                                <button
                                    onClick={() => {
                                        setAwardsTab('classroom');
                                        const firstKs1 = sections.find(s => isKeyStage1(s.section_grade_level));
                                        if (firstKs1 && !selectedSectionForAwards) {
                                            setSelectedSectionForAwards(firstKs1.id);
                                        }
                                    }}
                                    className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${awardsTab === 'classroom' ? 'border-deped-blue text-deped-blue font-bold dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    Classroom Awards (KS1)
                                </button>
                                <button
                                    onClick={() => {
                                        setAwardsTab('special');
                                        const firstNonKs1 = sections.find(s => !isKeyStage1(s.section_grade_level));
                                        if (firstNonKs1 && !selectedSectionForAwards) {
                                            setSelectedSectionForAwards(firstNonKs1.id);
                                        }
                                    }}
                                    className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${awardsTab === 'special' ? 'border-deped-blue text-deped-blue font-bold dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    Nominated & Special Awards
                                </button>
                            </div>

                            {/* TAB 1: ACADEMIC & SUBJECT */}
                            {awardsTab === 'academic' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {/* Honor Roll Analytics Highlights */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: 'Academic Excellence', color: 'from-blue-650 to-blue-900', icon: Sparkles, bg: 'bg-blue-50', count: honorRoll.length },
                                            { label: 'Subject Excellence', color: 'from-green-800 to-green-950', icon: Trophy, bg: 'bg-green-50', count: subjectAwardees.length }
                                        ].map((type) => {
                                            return (
                                                <div key={type.label} className="relative overflow-hidden group p-6 bg-white rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-1">
                                                    <div className="relative z-10">
                                                        <div className={`p-2 rounded-xl w-fit mb-3 ${type.bg}`}>
                                                            <type.icon className="w-5 h-5 text-deped-blue" />
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{type.label}</p>
                                                        <div className="flex items-baseline gap-2 mt-1">
                                                            <p className="text-4xl font-black text-gray-800">{type.count}</p>
                                                            {type.count > 0 && <span className="text-[10px] font-bold text-green-600">Active</span>}
                                                        </div>
                                                    </div>
                                                    <type.icon className="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] text-black" />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex justify-end">
                                        <button onClick={handleExportHonorRoll} disabled={!canEditReport(user, 'honor-roll')} className="text-xs flex items-center gap-1 text-deped-blue hover:underline font-bold px-3 py-2 bg-white rounded-lg shadow-sm border disabled:opacity-40 disabled:cursor-not-allowed">
                                            <Download className="w-3 h-3" /> Export CSV
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {groupedHonorData.map(group => {
                                            const achievementRate = Math.min(100, (group.items.length / 5) * 100); 
                                            
                                            return (
                                                <div key={group.groupName} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                                                    {/* Modern Glass Header */}
                                                    <div className="bg-linear-to-r from-green-950 via-green-900 to-green-800 px-8 py-6 flex items-center justify-between relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-white/5 opacity-10"></div>
                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="font-black text-white text-2xl tracking-tighter">{group.groupName}</h3>
                                                                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border border-white/10">Official Report</span>
                                                            </div>
                                                            <p className="text-green-100/60 text-[10px] font-bold uppercase tracking-widest mt-1">Academic Achievement Dashboard</p>
                                                        </div>
                                                        <div className="relative z-10 flex gap-4">
                                                            <div className="text-right">
                                                                <p className="text-white text-2xl font-black tracking-tighter leading-none">{group.items.length}</p>
                                                                <p className="text-green-100/40 text-[9px] font-black uppercase mt-1">Awardees</p>
                                                            </div>
                                                            <div className="w-px h-8 bg-white/10 my-auto"></div>
                                                            <div className="text-right">
                                                                <p className="text-white text-2xl font-black tracking-tighter leading-none">{group.awards.length}</p>
                                                                <p className="text-green-100/40 text-[9px] font-black uppercase mt-1">Subjects</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Achievement Analytics Bar */}
                                                    <div className="bg-green-50/50 px-8 py-2 border-b border-green-100/50 flex items-center gap-4">
                                                        <TrendingUp className="w-3 h-3 text-green-600" />
                                                        <div className="flex-1 h-1.5 bg-green-200/50 rounded-full overflow-hidden">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${achievementRate}%` }}
                                                                className="h-full bg-green-600 rounded-full"
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-black text-green-800">{Math.round(achievementRate)}% Achievement Intensity</span>
                                                    </div>

                                                    {group.items.length > 0 && (
                                                        <div className="px-2 pt-2">
                                                            <table className="w-full">
                                                                <thead>
                                                                    <tr className="text-gray-400 text-left underline-offset-4">
                                                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest w-16">No.</th>
                                                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Student Excellence</th>
                                                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Award Category</th>
                                                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Gen. Avg</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {group.items.map((item, idx) => (
                                                                        <tr key={`${item.student.lrn}-${idx}`} className="hover:bg-green-50/30 transition-colors group/row">
                                                                            <td className="px-6 py-5">
                                                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-gray-400 bg-gray-50 border border-gray-150">
                                                                                    {idx + 1}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-5">
                                                                                <p className="font-black text-gray-800 uppercase tracking-tight group-hover/row:text-green-900 transition-colors">
                                                                                    {item.student.last_name}, {item.student.first_name}
                                                                                </p>
                                                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{item.student.lrn}</p>
                                                                            </td>
                                                                            <td className="px-6 py-5 text-center">
                                                                                <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border bg-blue-50 text-deped-blue border-blue-200">
                                                                                    Academic Excellence Award
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-6 py-5 text-right">
                                                                                <p className="text-lg font-black text-gray-900 tracking-tighter">{item.generalAverage}</p>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                    {group.awards.length > 0 && (
                                                        <div className="p-8 bg-gray-50/30 border-t border-gray-100">
                                                            <button 
                                                                onClick={() => setExpandedSubjectAwards(prev => ({ ...prev, [group.groupName]: !prev[group.groupName] }))}
                                                                className="w-full flex items-center justify-between group/btn"
                                                            >
                                                                <div className="flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-[0.2em] group-hover/btn:text-green-800 transition-colors">
                                                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                                                        <Target className="w-4 h-4 text-green-600" />
                                                                    </div>
                                                                    Subject Excellence Matrix ({group.awards.length})
                                                                </div>
                                                                <div className={`p-2 rounded-full transition-all ${expandedSubjectAwards[group.groupName] ? 'bg-green-100 text-green-700 rotate-180' : 'bg-gray-100 text-gray-400'}`}>
                                                                    <ChevronDown className="w-4 h-4" />
                                                                </div>
                                                            </button>
                                                            
                                                            <AnimatePresence>
                                                                {expandedSubjectAwards[group.groupName] && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="pt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                            {group.awards.map((award, idx) => (
                                                                                <div key={`${award.subjectName}-${idx}`} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
                                                                                    <div className="absolute top-0 right-0 p-4">
                                                                                        <Medal className="w-10 h-10 text-green-500/10" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest border-b border-green-50 pb-2 mb-3">{award.subjectName}</p>
                                                                                        <p className="text-md font-black text-gray-800 uppercase leading-snug tracking-tight">{award.studentName}</p>
                                                                                    </div>
                                                                                    <div className="mt-4 pt-4 flex items-center justify-between">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Performance</span>
                                                                                        </div>
                                                                                        <span className="text-xl font-black text-green-900 tracking-tighter">{award.grade}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {groupedHonorData.length === 0 && (
                                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-12 text-gray-400 italic">
                                                <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                No honor students or subject awardees found for {selectedQuarter === 'overall' ? 'the entire year' : `Term ${selectedQuarter}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: CLASSROOM AWARDS (KS1) */}
                            {awardsTab === 'classroom' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                        <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Choose Section:</span>
                                        <select
                                            value={selectedSectionForAwards}
                                            onChange={(e) => setSelectedSectionForAwards(e.target.value)}
                                            className="text-xs font-bold border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-deped-blue/20"
                                        >
                                            <option value="">Select KS1 Section...</option>
                                            {sections
                                                .filter(s => isKeyStage1(s.section_grade_level))
                                                .map(s => (
                                                    <option key={s.id} value={s.id}>{s.section_grade_level} - {s.section_name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    {selectedSectionForAwards ? (() => {
                                        const activeSection = sections.find(s => s.id === selectedSectionForAwards);
                                        if (!activeSection) return null;
                                        
                                        const sectionStudents = students.filter(s => s.student_section === activeSection.section_name || s.student_section === activeSection.id);
                                        const attendanceSheets = useAppStore.getState().sf2Sheets || [];
                                        const attendanceRecords = useAppStore.getState().attendanceRecords || [];

                                        const perfectAttendanceList = sectionStudents.filter(s => {
                                            const absences = getStudentAbsences(
                                                s.lrn, 
                                                activeSection.id, 
                                                activeSchoolYear, 
                                                selectedQuarter === 'overall' ? 'EOSY' : (selectedQuarter as 1 | 2 | 3), 
                                                attendanceRecords, 
                                                attendanceSheets
                                            );
                                            
                                            const manualCheck = s.awardEvaluations?.find(
                                                e => e.awardType === 'PerfectAttendance' && 
                                                     e.schoolYear === activeSchoolYear && 
                                                     e.term === (selectedQuarter === 'overall' ? 'EOSY' : selectedQuarter)
                                            );

                                            if (manualCheck) return true;
                                            return absences === 0;
                                        });

                                        return (
                                            <div className="grid grid-cols-1 gap-6">
                                                {/* SECTION 1: PERFECT ATTENDANCE */}
                                                <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                                                    <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                                                        <div>
                                                            <h4 className="text-md font-extrabold text-gray-800 flex items-center gap-2">
                                                                <Clock3 className="w-5 h-5 text-deped-blue" /> Perfect Attendance Awardees
                                                            </h4>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                                Term {selectedQuarter} • Auto-detected: {perfectAttendanceList.length} Learners
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-left text-gray-400 uppercase text-[9px] font-black tracking-widest border-b pb-2">
                                                                    <th className="pb-2">Learner LRN</th>
                                                                    <th className="pb-2">Name</th>
                                                                    <th className="pb-2 text-center">Absences</th>
                                                                    <th className="pb-2 text-center">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50">
                                                                {sectionStudents.map(s => {
                                                                    const abs = getStudentAbsences(
                                                                        s.lrn, 
                                                                        activeSection.id, 
                                                                        activeSchoolYear, 
                                                                        selectedQuarter === 'overall' ? 'EOSY' : (selectedQuarter as 1 | 2 | 3), 
                                                                        attendanceRecords, 
                                                                        attendanceSheets
                                                                    );
                                                                    const hasAward = perfectAttendanceList.some(p => p.lrn === s.lrn);

                                                                    return (
                                                                        <tr key={s.lrn} className="hover:bg-gray-50/50">
                                                                            <td className="py-2.5 font-medium text-gray-400">{s.lrn}</td>
                                                                            <td className="py-2.5 font-bold uppercase text-gray-800">{s.last_name}, {s.first_name}</td>
                                                                            <td className="py-2.5 text-center font-bold text-gray-600">{abs}</td>
                                                                            <td className="py-2.5 text-center">
                                                                                <button 
                                                                                    onClick={async () => {
                                                                                        const isManual = s.awardEvaluations?.find(
                                                                                            e => e.awardType === 'PerfectAttendance' && 
                                                                                                 e.schoolYear === activeSchoolYear && 
                                                                                                 e.term === (selectedQuarter === 'overall' ? 'EOSY' : selectedQuarter)
                                                                                        );
                                                                                        if (isManual) {
                                                                                            const updated = (s.awardEvaluations || []).filter(e => !(e.awardType === 'PerfectAttendance' && e.schoolYear === activeSchoolYear && e.term === (selectedQuarter === 'overall' ? 'EOSY' : selectedQuarter)));
                                                                                            await useAppStore.getState().updateStudent(s.lrn, { awardEvaluations: updated });
                                                                                        } else {
                                                                                            const evalObj = {
                                                                                                id: `${s.lrn}_${activeSchoolYear}_${selectedQuarter === 'overall' ? 'EOSY' : selectedQuarter}_PerfectAttendance`,
                                                                                                student_lrn: s.lrn,
                                                                                                schoolYear: activeSchoolYear,
                                                                                                term: (selectedQuarter === 'overall' ? 'EOSY' : selectedQuarter) as 1 | 2 | 3 | 'EOSY',
                                                                                                awardType: 'PerfectAttendance' as const
                                                                                            };
                                                                                            const currentEvals = s.awardEvaluations || [];
                                                                                            await useAppStore.getState().updateStudent(s.lrn, { awardEvaluations: [...currentEvals, evalObj] });
                                                                                        }
                                                                                    }}
                                                                                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${hasAward ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-gray-50 border border-gray-200 text-gray-400 hover:bg-gray-100'}`}
                                                                                >
                                                                                    {hasAward ? '✓ Qualified' : 'Not Qualified'}
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* SECTION 2: CHARACTER TRAITS AWARDS */}
                                                <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                                                    <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                                                        <div>
                                                            <h4 className="text-md font-extrabold text-gray-800 flex items-center gap-2">
                                                                <Heart className="w-5 h-5 text-pink-500" /> Character Traits Awards (Nomination)
                                                            </h4>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                                Kindergarten to Grade 3 • Limited to 5 core awards per term
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-left text-gray-400 uppercase text-[9px] font-black tracking-widest border-b pb-2">
                                                                    <th className="pb-2">Student</th>
                                                                    <th className="pb-2">Core Award</th>
                                                                    <th className="pb-2">Contextualized Title</th>
                                                                    <th className="pb-2 text-right">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50">
                                                                {sectionStudents.map(s => {
                                                                    const traitEval = s.awardEvaluations?.find(
                                                                        e => e.awardType === 'CharacterTrait' && 
                                                                             e.schoolYear === activeSchoolYear && 
                                                                             e.term === (selectedQuarter === 'overall' ? 'EOSY' : selectedQuarter)
                                                                    );

                                                                    return (
                                                                        <tr key={s.lrn} className="hover:bg-gray-50/50 group">
                                                                            <td className="py-3">
                                                                                <p className="font-bold uppercase text-gray-800">{s.last_name}, {s.first_name}</p>
                                                                                <p className="text-[9px] text-gray-400">{s.lrn}</p>
                                                                            </td>
                                                                            <td className="py-3 font-semibold text-gray-700">
                                                                                {traitEval?.characterTraitId ? (
                                                                                    <span className="px-2.5 py-1 bg-pink-50 text-pink-600 rounded-full font-bold uppercase text-[9px]">
                                                                                        {traitEval.characterTraitId}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-gray-300 italic">None</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="py-3 text-gray-600 font-medium max-w-[200px] truncate">
                                                                                {traitEval?.characterTraitTitle || '-'}
                                                                            </td>
                                                                            <td className="py-3 text-right">
                                                                                {traitEval ? (
                                                                                    <div className="flex justify-end gap-2">
                                                                                        <button 
                                                                                            onClick={() => {
                                                                                                setEvaluatingStudentLrn(s.lrn);
                                                                                                setEvaluatingAwardType('CharacterTrait');
                                                                                                setEvaluationForm({
                                                                                                    characterTraitId: traitEval.characterTraitId || 'Maka-Diyos',
                                                                                                    characterTraitTitle: traitEval.characterTraitTitle || '',
                                                                                                    characterTraitDescription: traitEval.characterTraitDescription || ''
                                                                                                });
                                                                                            }}
                                                                                            className="px-2 py-1 text-[9px] font-black bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg uppercase"
                                                                                        >
                                                                                            Edit
                                                                                        </button>
                                                                                        <button 
                                                                                            onClick={async () => {
                                                                                                const updated = (s.awardEvaluations || []).filter(e => !(e.awardType === 'CharacterTrait' && e.schoolYear === activeSchoolYear && e.term === (selectedQuarter === 'overall' ? 'EOSY' : selectedQuarter)));
                                                                                                await useAppStore.getState().updateStudent(s.lrn, { awardEvaluations: updated });
                                                                                            }}
                                                                                            className="px-2 py-1 text-[9px] font-black bg-red-50 hover:bg-red-100 text-red-600 rounded-lg uppercase"
                                                                                        >
                                                                                            Remove
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <button 
                                                                                        onClick={() => {
                                                                                            setEvaluatingStudentLrn(s.lrn);
                                                                                            setEvaluatingAwardType('CharacterTrait');
                                                                                            setEvaluationForm({
                                                                                                characterTraitId: 'Maka-Diyos',
                                                                                                characterTraitTitle: 'Gawad sa Pagiging Maka-Diyos',
                                                                                                characterTraitDescription: 'Ipinapahayag ang kanyang mataas na pagpapahalaga sa pananampalataya.'
                                                                                            });
                                                                                        }}
                                                                                        className="px-3 py-1 bg-gray-50 border border-gray-250 text-gray-500 rounded-lg hover:bg-deped-blue hover:text-white hover:border-transparent transition-all uppercase text-[9px] font-black"
                                                                                    >
                                                                                        Nominate
                                                                                    </button>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* SECTION 3: GMRC CERTIFICATE OF MERIT (EOSY Only) */}
                                                {selectedQuarter === 'overall' && (
                                                    <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                                                        <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                                                            <div>
                                                                <h4 className="text-md font-extrabold text-gray-800 flex items-center gap-2">
                                                                    <Sparkles className="w-5 h-5 text-amber-500" /> Certificate of Merit (GMRC Core Competency)
                                                                </h4>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                                    End of School Year • Given to each learner reflecting GMRC competency
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="text-left text-gray-400 uppercase text-[9px] font-black tracking-widest border-b pb-2">
                                                                        <th className="pb-2">Student</th>
                                                                        <th className="pb-2">Excelled/Improved GMRC Competency</th>
                                                                        <th className="pb-2 text-right">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {sectionStudents.map(s => {
                                                                        const meritEval = s.awardEvaluations?.find(
                                                                            e => e.awardType === 'GMRCMerit' && 
                                                                                 e.schoolYear === activeSchoolYear && 
                                                                                 e.term === 'EOSY'
                                                                        );

                                                                        return (
                                                                            <tr key={s.lrn} className="hover:bg-gray-50/50">
                                                                                <td className="py-3">
                                                                                    <p className="font-bold uppercase text-gray-800">{s.last_name}, {s.first_name}</p>
                                                                                    <p className="text-[9px] text-gray-400">{s.lrn}</p>
                                                                                </td>
                                                                                <td className="py-3 text-gray-700 font-medium">
                                                                                    {meritEval?.gmrcCompetency ? (
                                                                                        <span className="font-bold text-amber-800">{meritEval.gmrcCompetency}</span>
                                                                                    ) : (
                                                                                        <span className="text-gray-300 italic">Not Yet Evaluated</span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="py-3 text-right">
                                                                                    {meritEval ? (
                                                                                        <div className="flex justify-end gap-2">
                                                                                            <button 
                                                                                                onClick={() => {
                                                                                                    setEvaluatingStudentLrn(s.lrn);
                                                                                                    setEvaluatingAwardType('GMRCMerit');
                                                                                                    setEvaluationForm({
                                                                                                        gmrcCompetency: meritEval.gmrcCompetency || ''
                                                                                                    });
                                                                                                }}
                                                                                                className="px-2 py-1 text-[9px] font-black bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg uppercase"
                                                                                            >
                                                                                                Edit
                                                                                            </button>
                                                                                            <button 
                                                                                                onClick={async () => {
                                                                                                    const updated = (s.awardEvaluations || []).filter(e => !(e.awardType === 'GMRCMerit' && e.schoolYear === activeSchoolYear && e.term === 'EOSY'));
                                                                                                    await useAppStore.getState().updateStudent(s.lrn, { awardEvaluations: updated });
                                                                                                }}
                                                                                                className="px-2 py-1 text-[9px] font-black bg-red-50 hover:bg-red-100 text-red-600 rounded-lg uppercase"
                                                                                            >
                                                                                                Remove
                                                                                            </button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <button 
                                                                                            onClick={() => {
                                                                                                setEvaluatingStudentLrn(s.lrn);
                                                                                                setEvaluatingAwardType('GMRCMerit');
                                                                                                setEvaluationForm({
                                                                                                    gmrcCompetency: 'Pagpapakita ng paggalang sa guro at kapwa mag-aaral'
                                                                                                });
                                                                                            }}
                                                                                            className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg hover:bg-amber-600 hover:text-white hover:border-transparent transition-all uppercase text-[9px] font-black"
                                                                                        >
                                                                                            Assess Competency
                                                                                        </button>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })() : (
                                        <div className="bg-white rounded-2xl p-12 border text-center text-gray-400 italic shadow-sm">
                                            Please choose a Key Stage 1 (Kindergarten or Grade 1-3) Section above to manage classroom awards.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 3: NOMINATED & SPECIAL AWARDS */}
                            {awardsTab === 'special' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                        <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Choose Section:</span>
                                        <select
                                            value={selectedSectionForAwards}
                                            onChange={(e) => setSelectedSectionForAwards(e.target.value)}
                                            className="text-xs font-bold border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-deped-blue/20"
                                        >
                                            <option value="">Select Section (Grades 2-12)...</option>
                                            {sections
                                                .filter(s => !isKeyStage1(s.section_grade_level) || s.section_grade_level.includes('2') || s.section_grade_level.includes('3'))
                                                .map(s => (
                                                    <option key={s.id} value={s.id}>{s.section_grade_level} - {s.section_name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    {selectedSectionForAwards ? (() => {
                                        const activeSection = sections.find(s => s.id === selectedSectionForAwards);
                                        if (!activeSection) return null;

                                        const sectionStudents = students.filter(s => s.student_section === activeSection.section_name || s.student_section === activeSection.id);
                                        const isG12 = (activeSection.section_grade_level || '').includes('12');
                                        const isSHS = (activeSection.section_grade_level || '').includes('11') || isG12;

                                        return (
                                            <div className="space-y-6">
                                                {/* SECTION 1: LEADERSHIP EXCELLENCE */}
                                                <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                                                    <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                                                        <div>
                                                            <h4 className="text-md font-extrabold text-gray-800 flex items-center gap-2">
                                                                <Trophy className="w-5 h-5 text-indigo-500" /> Leadership Excellence Award
                                                            </h4>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                                KS2 to KS4 • GA ≥ 75, No Failures, No Disciplinary cases • Evaluated Score ≥ 90%
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-left text-gray-400 uppercase text-[9px] font-black tracking-widest border-b pb-2">
                                                                    <th className="pb-2">Student</th>
                                                                    <th className="pb-2">Position</th>
                                                                    <th className="pb-2 text-center">Score</th>
                                                                    <th className="pb-2 text-right">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50">
                                                                {sectionStudents.map(s => {
                                                                    const leadEval = s.awardEvaluations?.find(
                                                                        e => e.awardType === 'Leadership' && 
                                                                             e.schoolYear === activeSchoolYear && 
                                                                             e.term === (selectedQuarter === 'overall' ? 'EOSY' : selectedQuarter)
                                                                    );

                                                                    return (
                                                                        <tr key={s.lrn} className="hover:bg-gray-50/50">
                                                                            <td className="py-3">
                                                                                <p className="font-bold uppercase text-gray-800">{s.last_name}, {s.first_name}</p>
                                                                                <p className="text-[9px] text-gray-400">{s.lrn}</p>
                                                                            </td>
                                                                            <td className="py-3 text-gray-700 font-medium">
                                                                                {leadEval?.leadershipScores?.position || <span className="text-gray-300 italic">Not Evaluated</span>}
                                                                            </td>
                                                                            <td className="py-3 text-center font-bold">
                                                                                {leadEval?.leadershipScores ? (
                                                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${leadEval.leadershipScores.total >= 90 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                                                        {leadEval.leadershipScores.total}%
                                                                                    </span>
                                                                                ) : '-'}
                                                                            </td>
                                                                            <td className="py-3 text-right">
                                                                                {leadEval ? (
                                                                                    <div className="flex justify-end gap-2">
                                                                                        <button 
                                                                                            onClick={() => {
                                                                                                setEvaluatingStudentLrn(s.lrn);
                                                                                                setEvaluatingAwardType('Leadership');
                                                                                                setEvaluationForm({
                                                                                                    position: leadEval.leadershipScores?.position || '',
                                                                                                    motivational: leadEval.leadershipScores?.motivational || 0,
                                                                                                    planning: leadEval.leadershipScores?.planning || 0,
                                                                                                    contribution: leadEval.leadershipScores?.contribution || 0,
                                                                                                    noDerogatory: leadEval.leadershipScores?.noDerogatory ?? true
                                                                                                });
                                                                                            }}
                                                                                            className="px-2 py-1 text-[9px] font-black bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg uppercase"
                                                                                        >
                                                                                            Edit
                                                                                        </button>
                                                                                        <button 
                                                                                            onClick={async () => {
                                                                                                const updated = (s.awardEvaluations || []).filter(e => !(e.awardType === 'Leadership' && e.schoolYear === activeSchoolYear && e.term === (selectedQuarter === 'overall' ? 'EOSY' : selectedQuarter)));
                                                                                                await useAppStore.getState().updateStudent(s.lrn, { awardEvaluations: updated });
                                                                                            }}
                                                                                            className="px-2 py-1 text-[9px] font-black bg-red-50 hover:bg-red-100 text-red-600 rounded-lg uppercase"
                                                                                        >
                                                                                            Remove
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <button 
                                                                                        onClick={() => {
                                                                                            setEvaluatingStudentLrn(s.lrn);
                                                                                            setEvaluatingAwardType('Leadership');
                                                                                            setEvaluationForm({
                                                                                                position: 'Class President',
                                                                                                motivational: 36,
                                                                                                planning: 36,
                                                                                                contribution: 18,
                                                                                                noDerogatory: true
                                                                                            });
                                                                                        }}
                                                                                        className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-transparent transition-all uppercase text-[9px] font-black"
                                                                                    >
                                                                                        Evaluate
                                                                                    </button>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* SECTION 2: RESEARCH / INNOVATION EXCELLENCE (EOSY G12 Only) */}
                                                {isG12 && selectedQuarter === 'overall' && (
                                                    <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-6">
                                                        <div>
                                                            <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                                                                <div>
                                                                    <h4 className="text-md font-extrabold text-gray-800 flex items-center gap-2">
                                                                        <Sparkles className="w-5 h-5 text-amber-500" /> Excellence in Research (Grade 12)
                                                                    </h4>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                                        Research 1 & 2 • Max 4 members • Table 1 Rubric Score ≥ 90%
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="overflow-x-auto mt-4">
                                                                <table className="w-full text-xs">
                                                                    <thead>
                                                                        <tr className="text-left text-gray-400 uppercase text-[9px] font-black tracking-widest border-b pb-2">
                                                                            <th className="pb-2">Student</th>
                                                                            <th className="pb-2">Research Title</th>
                                                                            <th className="pb-2 text-center">Score</th>
                                                                            <th className="pb-2 text-right">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-50">
                                                                        {sectionStudents.map(s => {
                                                                            const resEval = s.awardEvaluations?.find(
                                                                                e => e.awardType === 'Research' && 
                                                                                     e.schoolYear === activeSchoolYear && 
                                                                                     e.term === 'EOSY'
                                                                            );

                                                                            return (
                                                                                <tr key={s.lrn} className="hover:bg-gray-50/50">
                                                                                    <td className="py-3">
                                                                                        <p className="font-bold uppercase text-gray-800">{s.last_name}, {s.first_name}</p>
                                                                                        <p className="text-[9px] text-gray-400">{s.lrn}</p>
                                                                                    </td>
                                                                                    <td className="py-3 text-gray-700 font-medium max-w-[200px] truncate">
                                                                                        {resEval?.projectTitle || <span className="text-gray-300 italic">Not Evaluated</span>}
                                                                                    </td>
                                                                                    <td className="py-3 text-center font-bold">
                                                                                        {resEval?.researchScores ? (
                                                                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${resEval.researchScores.total >= 90 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                                                                {resEval.researchScores.total}%
                                                                                            </span>
                                                                                        ) : '-'}
                                                                                    </td>
                                                                                    <td className="py-3 text-right">
                                                                                        {resEval ? (
                                                                                            <div className="flex justify-end gap-2">
                                                                                                <button 
                                                                                                    onClick={() => {
                                                                                                        setEvaluatingStudentLrn(s.lrn);
                                                                                                        setEvaluatingAwardType('Research');
                                                                                                        setEvaluationForm({
                                                                                                            projectTitle: resEval.projectTitle || '',
                                                                                                            finalGrade: resEval.researchScores?.finalGrade || 18,
                                                                                                            significance: resEval.researchScores?.significance || 30,
                                                                                                            rigor: resEval.researchScores?.rigor || 27,
                                                                                                            presentation: resEval.researchScores?.presentation || 13,
                                                                                                            projectMembers: resEval.projectMembers || []
                                                                                                        });
                                                                                                    }}
                                                                                                    className="px-2 py-1 text-[9px] font-black bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg uppercase"
                                                                                                >
                                                                                                    Edit
                                                                                                </button>
                                                                                                <button 
                                                                                                    onClick={async () => {
                                                                                                        const updated = (s.awardEvaluations || []).filter(e => !(e.awardType === 'Research' && e.schoolYear === activeSchoolYear && e.term === 'EOSY'));
                                                                                                        await useAppStore.getState().updateStudent(s.lrn, { awardEvaluations: updated });
                                                                                                    }}
                                                                                                    className="px-2 py-1 text-[9px] font-black bg-red-50 hover:bg-red-100 text-red-600 rounded-lg uppercase"
                                                                                                >
                                                                                                    Remove
                                                                                                </button>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <button 
                                                                                                onClick={() => {
                                                                                                    setEvaluatingStudentLrn(s.lrn);
                                                                                                    setEvaluatingAwardType('Research');
                                                                                                    setEvaluationForm({
                                                                                                        projectTitle: 'Smart Hydroponics System',
                                                                                                        finalGrade: 18,
                                                                                                        significance: 31,
                                                                                                        rigor: 27,
                                                                                                        presentation: 14,
                                                                                                        projectMembers: [s.lrn]
                                                                                                    });
                                                                                                }}
                                                                                                className="px-3 py-1 bg-gray-50 border border-gray-250 text-gray-500 rounded-lg hover:bg-amber-600 hover:text-white hover:border-transparent transition-all uppercase text-[9px] font-black"
                                                                                            >
                                                                                                Evaluate
                                                                                            </button>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                                                                <div>
                                                                    <h4 className="text-md font-extrabold text-gray-800 flex items-center gap-2">
                                                                        <Target className="w-5 h-5 text-purple-500" /> Excellence in Design and Innovation
                                                                    </h4>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                                        Design & Innovation 1 & 2 • Max 4 members • Table 2 Rubric Score ≥ 90%
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="overflow-x-auto mt-4">
                                                                <table className="w-full text-xs">
                                                                    <thead>
                                                                        <tr className="text-left text-gray-400 uppercase text-[9px] font-black tracking-widest border-b pb-2">
                                                                            <th className="pb-2">Student</th>
                                                                            <th className="pb-2">Innovation Title</th>
                                                                            <th className="pb-2 text-center">Score</th>
                                                                            <th className="pb-2 text-right">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-50">
                                                                        {sectionStudents.map(s => {
                                                                            const innEval = s.awardEvaluations?.find(
                                                                                e => e.awardType === 'Innovation' && 
                                                                                     e.schoolYear === activeSchoolYear && 
                                                                                     e.term === 'EOSY'
                                                                            );

                                                                            return (
                                                                                <tr key={s.lrn} className="hover:bg-gray-50/50">
                                                                                    <td className="py-3">
                                                                                        <p className="font-bold uppercase text-gray-800">{s.last_name}, {s.first_name}</p>
                                                                                        <p className="text-[9px] text-gray-400">{s.lrn}</p>
                                                                                    </td>
                                                                                    <td className="py-3 text-gray-700 font-medium max-w-[200px] truncate">
                                                                                        {innEval?.projectTitle || <span className="text-gray-300 italic">Not Evaluated</span>}
                                                                                    </td>
                                                                                    <td className="py-3 text-center font-bold">
                                                                                        {innEval?.researchScores ? (
                                                                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${innEval.researchScores.total >= 90 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                                                                {innEval.researchScores.total}%
                                                                                            </span>
                                                                                        ) : '-'}
                                                                                    </td>
                                                                                    <td className="py-3 text-right">
                                                                                        {innEval ? (
                                                                                            <div className="flex justify-end gap-2">
                                                                                                <button 
                                                                                                    onClick={() => {
                                                                                                        setEvaluatingStudentLrn(s.lrn);
                                                                                                        setEvaluatingAwardType('Innovation');
                                                                                                        setEvaluationForm({
                                                                                                            projectTitle: innEval.projectTitle || '',
                                                                                                            finalGrade: innEval.researchScores?.finalGrade || 18,
                                                                                                            significance: innEval.researchScores?.significance || 27,
                                                                                                            originality: innEval.researchScores?.originality || 18,
                                                                                                            feasibility: innEval.researchScores?.feasibility || 18,
                                                                                                            presentation: innEval.researchScores?.presentation || 9,
                                                                                                            projectMembers: innEval.projectMembers || []
                                                                                                        });
                                                                                                    }}
                                                                                                    className="px-2 py-1 text-[9px] font-black bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg uppercase"
                                                                                                >
                                                                                                    Edit
                                                                                                </button>
                                                                                                <button 
                                                                                                    onClick={async () => {
                                                                                                        const updated = (s.awardEvaluations || []).filter(e => !(e.awardType === 'Innovation' && e.schoolYear === activeSchoolYear && e.term === 'EOSY'));
                                                                                                        await useAppStore.getState().updateStudent(s.lrn, { awardEvaluations: updated });
                                                                                                    }}
                                                                                                    className="px-2 py-1 text-[9px] font-black bg-red-50 hover:bg-red-100 text-red-600 rounded-lg uppercase"
                                                                                                >
                                                                                                    Remove
                                                                                                </button>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <button 
                                                                                                onClick={() => {
                                                                                                    setEvaluatingStudentLrn(s.lrn);
                                                                                                    setEvaluatingAwardType('Innovation');
                                                                                                    setEvaluationForm({
                                                                                                        projectTitle: 'Solar Powered Waste Segregator',
                                                                                                        finalGrade: 18,
                                                                                                        significance: 27,
                                                                                                        originality: 18,
                                                                                                        feasibility: 18,
                                                                                                        presentation: 9,
                                                                                                        projectMembers: [s.lrn]
                                                                                                    });
                                                                                                }}
                                                                                                className="px-3 py-1 bg-gray-50 border border-gray-250 text-gray-500 rounded-lg hover:bg-purple-600 hover:text-white hover:border-transparent transition-all uppercase text-[9px] font-black"
                                                                                            >
                                                                                                Evaluate
                                                                                            </button>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* SECTION 3: WORK IMMERSION / FIELD EXPOSURE (SHS Only) */}
                                                {isSHS && selectedQuarter === 'overall' && (
                                                    <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                                                        <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                                                            <div>
                                                                <h4 className="text-md font-extrabold text-gray-800 flex items-center gap-2">
                                                                    <Medal className="w-5 h-5 text-teal-600" /> Excellence in Work Immersion / Field Exposure
                                                                </h4>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                                    SHS Graduating • Highest grade in batch (≥ 90) + Supervisor Endorsement
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="text-left text-gray-400 uppercase text-[9px] font-black tracking-widest border-b pb-2">
                                                                        <th className="pb-2">Student</th>
                                                                        <th className="pb-2 text-center">Grade</th>
                                                                        <th className="pb-2 text-center">Supervisor Rating</th>
                                                                        <th className="pb-2 text-center">Endorsed</th>
                                                                        <th className="pb-2 text-right">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {sectionStudents.map(s => {
                                                                        const immEval = s.awardEvaluations?.find(
                                                                            e => e.awardType === 'WorkImmersion' && 
                                                                                 e.schoolYear === activeSchoolYear && 
                                                                                 e.term === 'EOSY'
                                                                        );

                                                                        return (
                                                                            <tr key={s.lrn} className="hover:bg-gray-50/50">
                                                                                <td className="py-3">
                                                                                    <p className="font-bold uppercase text-gray-800">{s.last_name}, {s.first_name}</p>
                                                                                    <p className="text-[9px] text-gray-400">{s.lrn}</p>
                                                                                </td>
                                                                                <td className="py-3 text-center font-bold text-gray-700">
                                                                                    {immEval?.workImmersionDetails?.grade || '-'}
                                                                                </td>
                                                                                <td className="py-3 text-center font-semibold text-gray-600">
                                                                                    {immEval?.workImmersionDetails?.supervisorRating || '-'}
                                                                                </td>
                                                                                <td className="py-3 text-center">
                                                                                    {immEval?.workImmersionDetails ? (
                                                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black ${immEval.workImmersionDetails.isEndorsed ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                                                            {immEval.workImmersionDetails.isEndorsed ? 'YES' : 'NO'}
                                                                                        </span>
                                                                                    ) : '-'}
                                                                                </td>
                                                                                <td className="py-3 text-right">
                                                                                    {immEval ? (
                                                                                        <div className="flex justify-end gap-2">
                                                                                            <button 
                                                                                                onClick={() => {
                                                                                                    setEvaluatingStudentLrn(s.lrn);
                                                                                                    setEvaluatingAwardType('WorkImmersion');
                                                                                                    setEvaluationForm({
                                                                                                        grade: immEval.workImmersionDetails?.grade || 92,
                                                                                                        supervisorRating: immEval.workImmersionDetails?.supervisorRating || 'Outstanding',
                                                                                                        teacherRating: immEval.workImmersionDetails?.teacherRating || 'Outstanding',
                                                                                                        isEndorsed: immEval.workImmersionDetails?.isEndorsed ?? true
                                                                                                    });
                                                                                                }}
                                                                                                className="px-2 py-1 text-[9px] font-black bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg uppercase"
                                                                                            >
                                                                                                Edit
                                                                                            </button>
                                                                                            <button 
                                                                                                onClick={async () => {
                                                                                                    const updated = (s.awardEvaluations || []).filter(e => !(e.awardType === 'WorkImmersion' && e.schoolYear === activeSchoolYear && e.term === 'EOSY'));
                                                                                                    await useAppStore.getState().updateStudent(s.lrn, { awardEvaluations: updated });
                                                                                                }}
                                                                                                className="px-2 py-1 text-[9px] font-black bg-red-50 hover:bg-red-100 text-red-600 rounded-lg uppercase"
                                                                                            >
                                                                                                Remove
                                                                                            </button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <button 
                                                                                            onClick={() => {
                                                                                                setEvaluatingStudentLrn(s.lrn);
                                                                                                setEvaluatingAwardType('WorkImmersion');
                                                                                                setEvaluationForm({
                                                                                                    grade: 92,
                                                                                                    supervisorRating: 'Outstanding',
                                                                                                    teacherRating: 'Outstanding',
                                                                                                    isEndorsed: true
                                                                                                });
                                                                                            }}
                                                                                            className="px-3 py-1 bg-gray-50 border border-gray-250 text-gray-500 rounded-lg hover:bg-teal-600 hover:text-white hover:border-transparent transition-all uppercase text-[9px] font-black"
                                                                                        >
                                                                                            Evaluate
                                                                                        </button>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* SECTION 4: SPECIAL RECOGNITION AWARDS */}
                                                <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                                                    <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                                                        <div>
                                                            <h4 className="text-md font-extrabold text-gray-800 flex items-center gap-2">
                                                                <Award className="w-5 h-5 text-orange-500" /> Special Recognition Awards (External Competitions)
                                                            </h4>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                                Distinctions in competitions/contests at regional, national, or international levels
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-left text-gray-400 uppercase text-[9px] font-black tracking-widest border-b pb-2">
                                                                    <th className="pb-2">Student</th>
                                                                    <th className="pb-2">Award/Distinction</th>
                                                                    <th className="pb-2 text-center">Level</th>
                                                                    <th className="pb-2 text-right">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50">
                                                                {sectionStudents.map(s => {
                                                                    const specEval = s.awardEvaluations?.find(
                                                                        e => e.awardType === 'SpecialRecognition' && 
                                                                             e.schoolYear === activeSchoolYear && 
                                                                             e.term === (selectedQuarter === 'overall' ? 'EOSY' : selectedQuarter)
                                                                    );

                                                                    return (
                                                                        <tr key={s.lrn} className="hover:bg-gray-50/50">
                                                                            <td className="py-3">
                                                                                <p className="font-bold uppercase text-gray-800">{s.last_name}, {s.first_name}</p>
                                                                                <p className="text-[9px] text-gray-400">{s.lrn}</p>
                                                                            </td>
                                                                            <td className="py-3 text-gray-700 font-semibold">
                                                                                {specEval?.specialRecognitionTitle || <span className="text-gray-300 italic">None</span>}
                                                                            </td>
                                                                            <td className="py-3 text-center">
                                                                                {specEval?.specialRecognitionLevel ? (
                                                                                    <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded font-bold uppercase text-[9px]">
                                                                                        {specEval.specialRecognitionLevel}
                                                                                    </span>
                                                                                ) : '-'}
                                                                            </td>
                                                                            <td className="py-3 text-right">
                                                                                {specEval ? (
                                                                                    <div className="flex justify-end gap-2">
                                                                                        <button 
                                                                                            onClick={() => {
                                                                                                setEvaluatingStudentLrn(s.lrn);
                                                                                                setEvaluatingAwardType('SpecialRecognition');
                                                                                                setEvaluationForm({
                                                                                                    specialRecognitionTitle: specEval.specialRecognitionTitle || '',
                                                                                                    specialRecognitionLevel: specEval.specialRecognitionLevel || 'regional'
                                                                                                });
                                                                                            }}
                                                                                            className="px-2 py-1 text-[9px] font-black bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg uppercase"
                                                                                        >
                                                                                            Edit
                                                                                        </button>
                                                                                        <button 
                                                                                            onClick={async () => {
                                                                                                const updated = (s.awardEvaluations || []).filter(e => !(e.awardType === 'SpecialRecognition' && e.schoolYear === activeSchoolYear && e.term === (selectedQuarter === 'overall' ? 'EOSY' : selectedQuarter)));
                                                                                                await useAppStore.getState().updateStudent(s.lrn, { awardEvaluations: updated });
                                                                                            }}
                                                                                            className="px-2 py-1 text-[9px] font-black bg-red-50 hover:bg-red-100 text-red-600 rounded-lg uppercase"
                                                                                        >
                                                                                            Remove
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <button 
                                                                                        onClick={() => {
                                                                                            setEvaluatingStudentLrn(s.lrn);
                                                                                            setEvaluatingAwardType('SpecialRecognition');
                                                                                            setEvaluationForm({
                                                                                                specialRecognitionTitle: 'Champion, Regional Math Olympiad',
                                                                                                specialRecognitionLevel: 'regional'
                                                                                            });
                                                                                        }}
                                                                                        className="px-3 py-1 bg-gray-50 border border-gray-250 text-gray-500 rounded-lg hover:bg-orange-600 hover:text-white hover:border-transparent transition-all uppercase text-[9px] font-black"
                                                                                    >
                                                                                        Record Award
                                                                                    </button>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })() : (
                                        <div className="bg-white rounded-2xl p-12 border text-center text-gray-400 italic shadow-sm">
                                            Please choose a Grade 2–12 Section above to manage nominated and special awards.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* EVALUATION FORM MODAL DIALOG */}
                            {evaluatingStudentLrn && evaluatingAwardType && (() => {
                                const stud = students.find(s => s.lrn === evaluatingStudentLrn);
                                if (!stud) return null;

                                const isLeadership = evaluatingAwardType === 'Leadership';
                                const isResearch = evaluatingAwardType === 'Research';
                                const isInnovation = evaluatingAwardType === 'Innovation';
                                const isWorkImmersion = evaluatingAwardType === 'WorkImmersion';
                                const isCharacterTrait = evaluatingAwardType === 'CharacterTrait';
                                const isGMRCMerit = evaluatingAwardType === 'GMRCMerit';
                                const isSpecial = evaluatingAwardType === 'SpecialRecognition';

                                const handleFormSave = async () => {
                                    const newEval: AwardEvaluation = {
                                        id: `${evaluatingStudentLrn}_${activeSchoolYear}_${selectedQuarter === 'overall' ? 'EOSY' : selectedQuarter}_${evaluatingAwardType}`,
                                        student_lrn: evaluatingStudentLrn,
                                        schoolYear: activeSchoolYear,
                                        term: (selectedQuarter === 'overall' ? 'EOSY' : selectedQuarter) as AwardEvaluation['term'],
                                        awardType: evaluatingAwardType as AwardEvaluation['awardType']
                                    };

                                    if (isLeadership) {
                                        const mot = Number(evaluationForm.motivational) || 0;
                                        const plan = Number(evaluationForm.planning) || 0;
                                        const contr = Number(evaluationForm.contribution) || 0;
                                        newEval.leadershipScores = {
                                            motivational: mot,
                                            planning: plan,
                                            contribution: contr,
                                            total: mot + plan + contr,
                                            position: evaluationForm.position || 'Class Officer',
                                            noDerogatory: evaluationForm.noDerogatory ?? true
                                        };
                                    } else if (isResearch) {
                                        const fg = Number(evaluationForm.finalGrade) || 0;
                                        const sig = Number(evaluationForm.significance) || 0;
                                        const rig = Number(evaluationForm.rigor) || 0;
                                        const pres = Number(evaluationForm.presentation) || 0;
                                        newEval.projectTitle = evaluationForm.projectTitle || '';
                                        newEval.projectMembers = evaluationForm.projectMembers || [evaluatingStudentLrn];
                                        newEval.researchScores = {
                                            finalGrade: fg,
                                            significance: sig,
                                            rigor: rig,
                                            presentation: pres,
                                            total: fg + sig + rig + pres
                                        };
                                    } else if (isInnovation) {
                                        const fg = Number(evaluationForm.finalGrade) || 0;
                                        const sig = Number(evaluationForm.significance) || 0;
                                        const orig = Number(evaluationForm.originality) || 0;
                                        const feas = Number(evaluationForm.feasibility) || 0;
                                        const pres = Number(evaluationForm.presentation) || 0;
                                        newEval.projectTitle = evaluationForm.projectTitle || '';
                                        newEval.projectMembers = evaluationForm.projectMembers || [evaluatingStudentLrn];
                                        newEval.researchScores = {
                                            finalGrade: fg,
                                            significance: sig,
                                            originality: orig,
                                            feasibility: feas,
                                            presentation: pres,
                                            total: fg + sig + orig + feas + pres
                                        };
                                    } else if (isWorkImmersion) {
                                        newEval.workImmersionDetails = {
                                            grade: Number(evaluationForm.grade) || 0,
                                            supervisorRating: evaluationForm.supervisorRating || 'Outstanding',
                                            teacherRating: evaluationForm.teacherRating || 'Outstanding',
                                            isEndorsed: evaluationForm.isEndorsed ?? true
                                        };
                                    } else if (isCharacterTrait) {
                                        newEval.characterTraitId = evaluationForm.characterTraitId || 'Maka-Diyos';
                                        newEval.characterTraitTitle = evaluationForm.characterTraitTitle || '';
                                        newEval.characterTraitDescription = evaluationForm.characterTraitDescription || '';
                                    } else if (isGMRCMerit) {
                                        newEval.gmrcCompetency = evaluationForm.gmrcCompetency || '';
                                    } else if (isSpecial) {
                                        newEval.specialRecognitionTitle = evaluationForm.specialRecognitionTitle || '';
                                        newEval.specialRecognitionLevel = evaluationForm.specialRecognitionLevel || 'regional';
                                    }

                                    const currentEvals = stud.awardEvaluations || [];
                                    const filtered = currentEvals.filter(e => !(e.awardType === newEval.awardType && e.schoolYear === newEval.schoolYear && e.term === newEval.term));
                                    await useAppStore.getState().updateStudent(evaluatingStudentLrn, { 
                                        awardEvaluations: [...filtered, newEval] 
                                    });

                                    if ((isResearch || isInnovation) && evaluationForm.projectMembers && evaluationForm.projectMembers.length > 0) {
                                        for (const lrn of evaluationForm.projectMembers) {
                                            if (lrn === evaluatingStudentLrn) continue;
                                            const member = students.find(s => s.lrn === lrn);
                                            if (member) {
                                                const memberEvals = member.awardEvaluations || [];
                                                const mFiltered = memberEvals.filter(e => !(e.awardType === newEval.awardType && e.schoolYear === newEval.schoolYear && e.term === newEval.term));
                                                const memberEval = { ...newEval, id: `${lrn}_${activeSchoolYear}_${selectedQuarter === 'overall' ? 'EOSY' : selectedQuarter}_${evaluatingAwardType}`, student_lrn: lrn };
                                                await useAppStore.getState().updateStudent(lrn, { 
                                                    awardEvaluations: [...mFiltered, memberEval] 
                                                });
                                            }
                                        }
                                    }

                                    setEvaluatingStudentLrn(null);
                                    setEvaluatingAwardType(null);
                                    setEvaluationForm({});
                                };

                                return (
                                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-deped-blue/30 backdrop-blur-sm">
                                        <div className="bg-white rounded-3xl shadow-2xl border border-gray-150 w-full max-w-lg p-6 space-y-4">
                                            <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                                                <div>
                                                    <h4 className="text-md font-extrabold text-deped-blue uppercase tracking-wider">
                                                        Award Evaluation: {evaluatingAwardType.replace(/([A-Z])/g, ' $1').trim()}
                                                    </h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                                        {stud.first_name} {stud.last_name} ({stud.lrn})
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        setEvaluatingStudentLrn(null);
                                                        setEvaluatingAwardType(null);
                                                        setEvaluationForm({});
                                                    }}
                                                    className="p-1 hover:bg-gray-100 rounded-full"
                                                >
                                                    <AlertCircle className="w-5 h-5 text-gray-400 rotate-45" />
                                                </button>
                                            </div>

                                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                                {/* LEADERSHIP FORM */}
                                                {isLeadership && (
                                                    <>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Position / Office:</label>
                                                            <input type="text" value={evaluationForm.position} onChange={e => setEvaluationForm({...evaluationForm, position: e.target.value})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-deped-blue" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Communication (Max 40%):</label>
                                                                <input type="number" min="0" max="40" value={evaluationForm.motivational} onChange={e => setEvaluationForm({...evaluationForm, motivational: Math.min(40, Number(e.target.value))})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Planning (Max 40%):</label>
                                                                <input type="number" min="0" max="40" value={evaluationForm.planning} onChange={e => setEvaluationForm({...evaluationForm, planning: Math.min(40, Number(e.target.value))})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Contribution (Max 20%):</label>
                                                            <input type="number" min="0" max="20" value={evaluationForm.contribution} onChange={e => setEvaluationForm({...evaluationForm, contribution: Math.min(20, Number(e.target.value))})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                        </div>
                                                        <div className="flex items-center justify-between border-t pt-3 border-gray-100">
                                                            <span className="text-[10px] font-black uppercase text-gray-400">Total Score:</span>
                                                            <span className="text-lg font-black text-indigo-700">
                                                                {(Number(evaluationForm.motivational) || 0) + (Number(evaluationForm.planning) || 0) + (Number(evaluationForm.contribution) || 0)}%
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input type="checkbox" checked={evaluationForm.noDerogatory} onChange={e => setEvaluationForm({...evaluationForm, noDerogatory: e.target.checked})} id="noDerogatory" className="rounded" />
                                                            <label htmlFor="noDerogatory" className="text-xs font-bold text-gray-600">Student has no derogatory records or disciplinary cases</label>
                                                        </div>
                                                    </>
                                                )}

                                                {/* RESEARCH FORM */}
                                                {isResearch && (
                                                    <>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Research Project Title:</label>
                                                            <input type="text" value={evaluationForm.projectTitle} onChange={e => setEvaluationForm({...evaluationForm, projectTitle: e.target.value})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">FG Research 2 (Max 20%):</label>
                                                                <input type="number" min="0" max="20" value={evaluationForm.finalGrade} onChange={e => setEvaluationForm({...evaluationForm, finalGrade: Math.min(20, Number(e.target.value))})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Significance (Max 35%):</label>
                                                                <input type="number" min="0" max="35" value={evaluationForm.significance} onChange={e => setEvaluationForm({...evaluationForm, significance: Math.min(35, Number(e.target.value))})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Rigor/Design (Max 30%):</label>
                                                                <input type="number" min="0" max="30" value={evaluationForm.rigor} onChange={e => setEvaluationForm({...evaluationForm, rigor: Math.min(30, Number(e.target.value))})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Presentation/Defense (Max 15%):</label>
                                                                <input type="number" min="0" max="15" value={evaluationForm.presentation} onChange={e => setEvaluationForm({...evaluationForm, presentation: Math.min(15, Number(e.target.value))})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between border-t pt-3 border-gray-100">
                                                            <span className="text-[10px] font-black uppercase text-gray-400">Total Score:</span>
                                                            <span className="text-lg font-black text-amber-700">
                                                                {(Number(evaluationForm.finalGrade) || 0) + (Number(evaluationForm.significance) || 0) + (Number(evaluationForm.rigor) || 0) + (Number(evaluationForm.presentation) || 0)}%
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Co-Authors / Group Members:</label>
                                                            <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg">
                                                                {students.filter(s => s.student_section === stud.student_section && s.lrn !== stud.lrn).map(s => {
                                                                    const isSelected = evaluationForm.projectMembers?.includes(s.lrn);
                                                                    return (
                                                                        <button 
                                                                            key={s.lrn}
                                                                            onClick={() => {
                                                                                const members = evaluationForm.projectMembers || [];
                                                                                const newMembers = isSelected 
                                                                                    ? members.filter((m: string) => m !== s.lrn) 
                                                                                    : [...members.filter((m: string) => m !== stud.lrn), s.lrn];
                                                                                setEvaluationForm({ ...evaluationForm, projectMembers: [stud.lrn, ...newMembers].slice(0, 4) });
                                                                            }}
                                                                            className={`px-2 py-1 rounded text-[10px] font-bold ${isSelected ? 'bg-amber-100 text-amber-800' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                                        >
                                                                            {s.first_name} {s.last_name[0]}.
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            <p className="text-[9px] text-gray-400 mt-1 font-medium">Select up to 3 co-authors (Max 4 members total per research project).</p>
                                                        </div>
                                                    </>
                                                )}

                                                {/* DESIGN & INNOVATION FORM */}
                                                {isInnovation && (
                                                    <>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Innovation Title:</label>
                                                            <input type="text" value={evaluationForm.projectTitle} onChange={e => setEvaluationForm({...evaluationForm, projectTitle: e.target.value})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">FG Design & Innov (Max 20%):</label>
                                                                <input type="number" min="0" max="20" value={evaluationForm.finalGrade} onChange={e => setEvaluationForm({...evaluationForm, finalGrade: Math.min(20, Number(e.target.value))})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Significance (Max 30%):</label>
                                                                <input type="number" min="0" max="30" value={evaluationForm.significance} onChange={e => setEvaluationForm({...evaluationForm, significance: Math.min(30, Number(e.target.value))})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div>
                                                                <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Originality (Max 20%):</label>
                                                                <input type="number" min="0" max="20" value={evaluationForm.originality} onChange={e => setEvaluationForm({...evaluationForm, originality: Math.min(20, Number(e.target.value))})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Feasibility (Max 20%):</label>
                                                                <input type="number" min="0" max="20" value={evaluationForm.feasibility} onChange={e => setEvaluationForm({...evaluationForm, feasibility: Math.min(20, Number(e.target.value))})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[8px] font-black uppercase text-gray-400 block mb-1">Presentation (Max 10%):</label>
                                                                <input type="number" min="0" max="10" value={evaluationForm.presentation} onChange={e => setEvaluationForm({...evaluationForm, presentation: Math.min(10, Number(e.target.value))})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between border-t pt-3 border-gray-100">
                                                            <span className="text-[10px] font-black uppercase text-gray-400">Total Score:</span>
                                                            <span className="text-lg font-black text-purple-700">
                                                                {(Number(evaluationForm.finalGrade) || 0) + (Number(evaluationForm.significance) || 0) + (Number(evaluationForm.originality) || 0) + (Number(evaluationForm.feasibility) || 0) + (Number(evaluationForm.presentation) || 0)}%
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Co-Innovators / Group Members:</label>
                                                            <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg">
                                                                {students.filter(s => s.student_section === stud.student_section && s.lrn !== stud.lrn).map(s => {
                                                                    const isSelected = evaluationForm.projectMembers?.includes(s.lrn);
                                                                    return (
                                                                        <button 
                                                                            key={s.lrn}
                                                                            onClick={() => {
                                                                                const members = evaluationForm.projectMembers || [];
                                                                                const newMembers = isSelected 
                                                                                    ? members.filter((m: string) => m !== s.lrn) 
                                                                                    : [...members.filter((m: string) => m !== stud.lrn), s.lrn];
                                                                                setEvaluationForm({ ...evaluationForm, projectMembers: [stud.lrn, ...newMembers].slice(0, 4) });
                                                                            }}
                                                                            className={`px-2 py-1 rounded text-[10px] font-bold ${isSelected ? 'bg-purple-100 text-purple-800' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                                        >
                                                                            {s.first_name} {s.last_name[0]}.
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* WORK IMMERSION FORM */}
                                                {isWorkImmersion && (
                                                    <>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Final Grade (Min 90):</label>
                                                                <input type="number" min="0" max="100" value={evaluationForm.grade} onChange={e => setEvaluationForm({...evaluationForm, grade: Number(e.target.value)})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Supervisor Endorsement:</label>
                                                                <select value={evaluationForm.isEndorsed ? 'yes' : 'no'} onChange={e => setEvaluationForm({...evaluationForm, isEndorsed: e.target.value === 'yes'})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2">
                                                                    <option value="yes">Endorsed</option>
                                                                    <option value="no">Not Endorsed</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Supervisor Rating:</label>
                                                                <select value={evaluationForm.supervisorRating} onChange={e => setEvaluationForm({...evaluationForm, supervisorRating: e.target.value})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2">
                                                                    <option value="Outstanding">Outstanding</option>
                                                                    <option value="Very Satisfactory">Very Satisfactory</option>
                                                                    <option value="Satisfactory">Satisfactory</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Teacher Rating:</label>
                                                                <select value={evaluationForm.teacherRating} onChange={e => setEvaluationForm({...evaluationForm, teacherRating: e.target.value})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2">
                                                                    <option value="Outstanding">Outstanding</option>
                                                                    <option value="Very Satisfactory">Very Satisfactory</option>
                                                                    <option value="Satisfactory">Satisfactory</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* CHARACTER TRAIT FORM */}
                                                {isCharacterTrait && (
                                                    <>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Core Values Category:</label>
                                                            <select value={evaluationForm.characterTraitId} onChange={e => setEvaluationForm({...evaluationForm, characterTraitId: e.target.value})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2">
                                                                <option value="Maka-Diyos">Maka-Diyos</option>
                                                                <option value="Maka-tao">Maka-tao</option>
                                                                <option value="Makakalikasan">Makakalikasan</option>
                                                                <option value="Makabayan">Makabayan</option>
                                                                <option value="Positive Learning Behavior / Growth">Positive Learning Behavior / Growth</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Contextualized Award Title:</label>
                                                            <input type="text" value={evaluationForm.characterTraitTitle} onChange={e => setEvaluationForm({...evaluationForm, characterTraitTitle: e.target.value})} placeholder="e.g. Gawad sa Pagiging Maka-Diyos" className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Contextualized Description:</label>
                                                            <textarea value={evaluationForm.characterTraitDescription} onChange={e => setEvaluationForm({...evaluationForm, characterTraitDescription: e.target.value})} placeholder="Describe why student deserves this trait award..." className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 h-20" />
                                                        </div>
                                                    </>
                                                )}

                                                {/* GMRC MERIT FORM */}
                                                {isGMRCMerit && (
                                                    <>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Improved or Excelled GMRC Core Competency:</label>
                                                            <textarea value={evaluationForm.gmrcCompetency} onChange={e => setEvaluationForm({...evaluationForm, gmrcCompetency: e.target.value})} placeholder="e.g. Pagpapakita ng malasakit at pagtulong sa mga nangangailangan sa silid-aralan..." className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2 h-24" />
                                                        </div>
                                                    </>
                                                )}

                                                {/* SPECIAL RECOGNITION FORM */}
                                                {isSpecial && (
                                                    <>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Award / Distinction Title:</label>
                                                            <input type="text" value={evaluationForm.specialRecognitionTitle} onChange={e => setEvaluationForm({...evaluationForm, specialRecognitionTitle: e.target.value})} placeholder="e.g. Champion, National Math Challenge" className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Level of Distinction:</label>
                                                            <select value={evaluationForm.specialRecognitionLevel} onChange={e => setEvaluationForm({...evaluationForm, specialRecognitionLevel: e.target.value})} className="w-full text-xs font-bold border border-gray-200 rounded-lg p-2">
                                                                <option value="school">School Level</option>
                                                                <option value="district">District Level</option>
                                                                <option value="division">Division Level</option>
                                                                <option value="regional">Regional Level</option>
                                                                <option value="national">National Level</option>
                                                                <option value="international">International Level</option>
                                                            </select>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
                                                <button 
                                                    onClick={() => {
                                                        setEvaluatingStudentLrn(null);
                                                        setEvaluatingAwardType(null);
                                                        setEvaluationForm({});
                                                    }}
                                                    className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 uppercase"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleFormSave}
                                                    className="px-5 py-2 bg-deped-blue hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase shadow-md shadow-blue-500/20"
                                                >
                                                    Save Evaluation
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Honor Students', value: honorRoll.length, icon: Award, color: 'emerald', action: () => openReport('quarterly') },
                    { label: 'At-Risk Learners', value: new Set(atRiskStudents.map(a => a.student.lrn)).size, icon: AlertTriangle, color: 'red', action: () => openReport('at-risk') },
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
                {/* Certificate Generator Card */}
                {canViewReport(user, 'certificate-generator') && (
                <div className="bg-linear-to-br from-indigo-50 to-white p-6 rounded-xl shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer" onClick={() => setCurrentView('certificates')}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-600 transition-colors duration-300">
                            <Award className="w-8 h-8 text-indigo-600 group-hover:text-white" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse shadow-sm shadow-indigo-200">NEW TOOL</span>
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded">DepEd Format</span>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Certificate Generator</h3>
                    <p className="text-gray-600 mb-6 text-sm">
                        Create pixel-perfect DepEd Certificates of Recognition for awardees and honor students.
                    </p>
                    <button className="w-full py-3 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all font-medium flex items-center justify-center gap-2">
                         Open Generator <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                )}


                {/* Term Summaries */}
                {canViewReport(user, 'quarterly-summaries') && (
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => openReport('quarterly')}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-600 transition-colors duration-300">
                            <BarChart3 className="w-8 h-8 text-green-600 group-hover:text-white" />
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">Working</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Term Summaries</h3>
                    <p className="text-gray-600 mb-6 text-sm">
                        View Mean Percentage Scores (MPS), Grade Distribution, and Pass/Fail rates.
                    </p>
                    <button className="w-full py-3 rounded-lg border border-gray-200 text-gray-600 hover:border-green-600 hover:text-green-600 transition-colors font-medium flex items-center justify-center gap-2">
                        Generate Report <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                )}

                {/* Subject Performance */}
                {canViewReport(user, 'subject-performance') && (
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => openReport('subject')}>
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
                )}

                {/* Learner Progress */}
                {canViewReport(user, 'learner-progress') && (
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => openReport('progress')}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-600 transition-colors duration-300">
                            <TrendingUp className="w-8 h-8 text-orange-600 group-hover:text-white" />
                        </div>
                        <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded">Working</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Learner Progress</h3>
                    <p className="text-gray-600 mb-6 text-sm">
                        Track academic growth and milestones over time across all terms.
                    </p>
                    <button className="w-full py-3 rounded-lg border border-gray-200 text-gray-600 hover:border-orange-600 hover:text-orange-600 transition-colors font-medium flex items-center justify-center gap-2">
                        Track Progress <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                )}

                {/* At-Risk Students */}
                {canViewReport(user, 'at-risk-students') && (
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => openReport('at-risk')}>
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
                )}

                {/* Honor Roll */}
                {canViewReport(user, 'honor-roll') && (
                <div className="bg-linear-to-br from-green-50 to-white p-6 rounded-xl shadow border border-green-100 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => openReport('honor-roll')}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-900 transition-colors duration-300">
                            <Award className="w-8 h-8 text-green-900 group-hover:text-white" />
                        </div>
                        <span className="bg-green-100 text-green-900 text-xs font-semibold px-2.5 py-0.5 rounded">Working</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Academic Excellence Awards</h3>
                    <p className="text-gray-600 mb-6 text-sm">
                        View detailed list of students qualifying for the Academic Excellence Award per Term and EOSY calculations.
                    </p>
                    <button className="w-full py-3 rounded-lg border border-green-800 text-green-900 hover:bg-green-900 hover:text-white transition-all font-medium flex items-center justify-center gap-2">
                        View Awardees <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                )}

                {/* Checklist of Requirements */}
                {canViewReport(user, 'requirements-checklist') && (
                <div className="bg-linear-to-br from-blue-50 to-white p-6 rounded-xl shadow border border-blue-100 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => openReport('requirements')}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-600 transition-colors duration-300">
                            <ClipboardList className="w-8 h-8 text-blue-600 group-hover:text-white" />
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">Advisory Class</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Checklist of Requirements</h3>
                    <p className="text-gray-600 mb-6 text-sm">
                        Track submissions of Learner's Report Card (SF9), Birth Certificate (PSA), and other essential DepEd requirements.
                    </p>
                    <button className="w-full py-3 rounded-lg border border-blue-250 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all font-medium flex items-center justify-center gap-2">
                        Open Tracker <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                )}
            </div>
        </div>
    );
}
