import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FlaskConical,
    X,
    Trash2,
    Layers,
    Sparkles,
    ShieldCheck,
    AlertCircle,
    GraduationCap,
    BookOpen,
    Cpu,
    Users,
    TableProperties,
    FileSpreadsheet
} from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import {
    generateTestSections,
    clearTestSections,
    getTestSectionStats,
    TEST_SECTION_SPECS
} from '../../utils/testSectionGenerator';

interface TestSectionGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type FilterScope = 'all' | 'elementary' | 'jhs' | 'shs';

export function TestSectionGeneratorModal({ isOpen, onClose }: TestSectionGeneratorModalProps) {
    const { sections, students, classRecords, showNotification } = useAppStore();
    const [selectedScope, setSelectedScope] = useState<FilterScope>('all');
    const [includeStudents, setIncludeStudents] = useState(true);
    const [studentsPerSection, setStudentsPerSection] = useState(6);
    const [asTeachingLoad, setAsTeachingLoad] = useState(true);
    const [includeClassRecords, setIncludeClassRecords] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const stats = useMemo(() => getTestSectionStats(sections, students, classRecords), [sections, students, classRecords]);

    const targetSpecs = useMemo(() => {
        return TEST_SECTION_SPECS.filter((s) => {
            if (selectedScope === 'all') return true;
            if (selectedScope === 'elementary') return s.category === 'elementary';
            if (selectedScope === 'jhs') return s.category === 'jhs';
            if (selectedScope === 'shs') return s.category === 'shs';
            return true;
        });
    }, [selectedScope]);

    const totalStudentsToGenerate = includeStudents ? targetSpecs.length * studentsPerSection : 0;

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await generateTestSections(
                selectedScope,
                includeStudents,
                studentsPerSection,
                asTeachingLoad,
                includeClassRecords
            );
            showNotification(
                `Generated ${result.sectionCount} test sections, ${result.subjectCount} subjects, ${result.studentCount} test students, and ${result.classRecordCount} E-Class score records.`,
                'success'
            );
        } catch (error) {
            console.error('Failed to generate test sections:', error);
            showNotification('Error generating test sections.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClear = async () => {
        setIsClearing(true);
        try {
            const result = await clearTestSections();
            showNotification(
                `Cleared ${result.deletedSections} test sections, ${result.deletedSubjects} subjects, ${result.deletedStudents} test students, and ${result.deletedClassRecords} E-Class records.`,
                'info'
            );
        } catch (error) {
            console.error('Failed to clear test sections:', error);
            showNotification('Error clearing test sections.', 'error');
        } finally {
            setIsClearing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-6"
                >
                    {/* Header */}
                    <div className="relative px-6 py-5 bg-linear-to-br from-indigo-50 via-sky-50 to-white dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-deped-blue flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                                    <FlaskConical className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        Test Section & Learner Generator (G1–12)
                                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                            Testing Only
                                        </span>
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Generate all curriculum program combinations with complete DepEd student profiles.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Production Guarantee Banner */}
                        <div className="mt-3.5 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300">
                            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>
                                <strong>Zero Hardcoding:</strong> Generated on-demand only. Never bundled in production client builds or initial databases.
                            </span>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5">
                        {/* Scope Selector */}
                        <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">
                                1. Select Generation Scope
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { id: 'all', label: 'All Grades', sub: 'G1–12 (All Specs)', count: TEST_SECTION_SPECS.length },
                                    { id: 'elementary', label: 'Elementary', sub: 'Grades 1–6', count: TEST_SECTION_SPECS.filter(s => s.category === 'elementary').length },
                                    { id: 'jhs', label: 'Junior High', sub: 'Grades 7–10', count: TEST_SECTION_SPECS.filter(s => s.category === 'jhs').length },
                                    { id: 'shs', label: 'Senior High', sub: 'Grades 11–12', count: TEST_SECTION_SPECS.filter(s => s.category === 'shs').length }
                                ].map((tab) => {
                                    const isSelected = selectedScope === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setSelectedScope(tab.id as FilterScope)}
                                            className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/80 dark:border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs'
                                                    : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="text-xs font-bold">{tab.label}</div>
                                            <div className="text-[11px] opacity-75 mt-0.5">{tab.sub}</div>
                                            <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                                                {tab.count} sections
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Test Students Option */}
                        <div className="p-3.5 rounded-xl border border-indigo-200/70 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={includeStudents}
                                        onChange={(e) => setIncludeStudents(e.target.checked)}
                                        className="w-4 h-4 rounded text-deped-blue focus:ring-deped-blue border-slate-300 dark:border-slate-700 cursor-pointer"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                            Include Complete Sample Students
                                        </span>
                                    </div>
                                </label>

                                {includeStudents && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Students / Section:</span>
                                        {[4, 6, 8, 10].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setStudentsPerSection(num)}
                                                className={`px-2 py-0.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                                                    studentsPerSection === num
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {includeStudents && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6.5">
                                    Generates <strong>{studentsPerSection} learners per section ({Math.ceil(studentsPerSection / 2)} Male, {Math.floor(studentsPerSection / 2)} Female)</strong> with unique 12-digit LRNs (<code>999...</code>), age/birthday matching grade level, SF8 height/weight/BMI measurements, address, contact, and enrollment checklist to thoroughly test SF1, SF2, SF9, SF10, and ECR.
                                </p>
                            )}
                        </div>

                        {/* Teaching Loads Option */}
                        <div className="p-3.5 rounded-xl border border-purple-200/70 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={asTeachingLoad}
                                    onChange={(e) => setAsTeachingLoad(e.target.checked)}
                                    className="w-4 h-4 rounded text-deped-blue focus:ring-deped-blue border-slate-300 dark:border-slate-700 cursor-pointer"
                                />
                                <div className="flex items-center gap-2">
                                    <TableProperties className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        Enable Subjects as Teaching Loads (ECR)
                                    </span>
                                </div>
                            </label>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6.5">
                                Enables all subjects in these test sections as active Teaching Loads so they appear in the Teaching Load Matrix and can be immediately selected and graded in the E-Class Record (ECR).
                            </p>
                        </div>

                        {/* Sample E-Class Records Option */}
                        <div className="p-3.5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={includeClassRecords}
                                    disabled={!includeStudents}
                                    onChange={(e) => setIncludeClassRecords(e.target.checked)}
                                    className="w-4 h-4 rounded text-deped-blue focus:ring-deped-blue border-slate-300 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                                />
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        Include Sample Assessment Scores & E-Class Records (WW, PT, QA)
                                    </span>
                                </div>
                            </label>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6.5">
                                Populates realistic assessment scores across Written Works, Performance Tasks, Summative Tests, and Quarterly Exams with matching HPS for all subjects and terms, so every ECR calculation, transmutation, and export can be tested immediately.
                            </p>
                        </div>

                        {/* Summary of Included Combinations */}
                        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    Curriculum Offerings ({targetSpecs.length} sections, {totalStudentsToGenerate} students)
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Prefix: <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">[TEST]</code>
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {(selectedScope === 'all' || selectedScope === 'elementary') && (
                                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
                                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                                            <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                            Elementary (G1–6)
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                            MATATAG Regular (5 & 8 areas), SSES (Science School), ALIVE (Madrasah), SPA (Arts), SPJ (Journalism), SPS (Sports).
                                        </p>
                                    </div>
                                )}

                                {(selectedScope === 'all' || selectedScope === 'jhs') && (
                                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
                                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                                            <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                            Junior High (G7–10)
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                            Regular (8 Core), STE & SPSTEM, SPA (all art majors), SPJ, SPS, SPFL (Foreign Language), SPTVE (Tech-Voc), ALIVE.
                                        </p>
                                    </div>
                                )}

                                {(selectedScope === 'all' || selectedScope === 'shs') && (
                                    <>
                                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
                                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                                                <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                                Grade 11 (SSHS DO 17, s. 2026)
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                6 Core + Academic (STEM, ABM, HUMSS, Sports, Field Exp) & TechPro (ICT, Automotive, Hospitality, etc.).
                                            </p>
                                        </div>

                                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
                                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                                                <Layers className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400" />
                                                Grade 12 (3-Term Model)
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Academic (STEM, ABM, HUMSS, GAS), TVL Track, Sports Track, Arts and Design Track.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Active Test Sections & Students Status */}
                        {(stats.totalTestSections > 0 || stats.totalTestStudents > 0 || stats.totalTestClassRecords > 0) && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50">
                                <div className="flex items-center gap-2.5">
                                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                    <div className="text-xs text-amber-900 dark:text-amber-200">
                                        <strong>{stats.totalTestSections} test sections, {stats.totalTestStudents} test students & {stats.totalTestClassRecords} ECR score records active</strong>
                                        <div className="text-[11px] opacity-80 mt-0.5">
                                            ({stats.elementaryCount} Elementary, {stats.jhsCount} JHS, {stats.shsCount} SHS)
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClear}
                                    disabled={isClearing}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-950/60 hover:bg-red-200/80 dark:hover:bg-red-900/60 border border-red-300 dark:border-red-800 rounded-lg transition-colors cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {isClearing ? 'Clearing...' : 'Clear All Test Records'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {targetSpecs.length} sections & {totalStudentsToGenerate} students will be generated locally.
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
                            >
                                Close
                            </button>

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-linear-to-r from-deped-blue to-indigo-600 hover:from-deped-blue-dark hover:to-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                {isGenerating ? 'Generating...' : `Generate ${targetSpecs.length} Sections & ${totalStudentsToGenerate} Students`}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
