import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../stores';
import { useAuthStore } from '../stores/auth-store';
import { useSF10Store } from '../stores/sf10-store';
import type { Student, Section } from '../types';
import SF10SpecRenderer from '../components/SF10SpecRenderer';
import SF10JHSRenderer from '../components/SF10JHSRenderer';
import { mapStudentToSpecData } from '../utils/sf10Mapper';
import { mapStudentToShsSf10Data } from '../utils/shsSf10Mapper';
import { ArrowLeft, Printer, FileText, Plus, Minus, History, ChevronDown, Clock3, Bug } from 'lucide-react';
import { canAccessSF9Section, filterSF9Sections } from '../lib/rbac';
import { SF10HistoricalDataModal } from '../components/SF10HistoricalDataModal';

export function SF10Page() {
    const { students, sections, subjects, gradingSheetRecords, teachers, schoolProfile, activeSchoolYear, setCurrentView } = useAppStore();
    const { user } = useAuthStore();
    const { overrides, setOverride, clearOverrides } = useSF10Store();
    
    const [selectedSectionState, setSelectedSectionState] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [showHistoricalModal, setShowHistoricalModal] = useState(false);





    const handlePrintSF10 = () => {
        if (!selectedStudent) return;
        const originalTitle = document.title;
        const safeName = `${selectedStudent.last_name}_${selectedStudent.first_name}`.replace(/[^a-z0-9]/gi, '_');
        document.title = `SF10_${safeName}_${activeSchoolYear}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    };

    const sortedSections = useMemo(() => {
        return [...filterSF9Sections(user, sections)].sort((a, b) => {
            const getGradeNum = (val: string) => {
                const num = val.match(/\d+/);
                return num ? parseInt(num[0] || '0') : 0;
            };
            const gradeA = getGradeNum(a.section_grade_level);
            const gradeB = getGradeNum(b.section_grade_level);
            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, user]);

    const selectedSection = !selectedSectionState && sortedSections?.length === 1 
        ? sortedSections[0].section_name 
        : selectedSectionState;
    const setSelectedSection = setSelectedSectionState;

    const groupedSections = useMemo(() => {
        const groups: Record<string, Section[]> = {
            'ELEMENTARY': [],
            'JUNIOR HIGH SCHOOL': [],
            'SENIOR HIGH SCHOOL': []
        };
        
        sortedSections.forEach(s => {
            const gl = (s.section_grade_level || '').toLowerCase();
            const num = parseInt(gl.replace(/\D/g, '')) || 0;
            
            if (gl.includes('kinder') || (num >= 1 && num <= 6)) {
                groups['ELEMENTARY'].push(s);
            } else if (num >= 7 && num <= 10) {
                groups['JUNIOR HIGH SCHOOL'].push(s);
            } else if (num >= 11 && num <= 12) {
                groups['SENIOR HIGH SCHOOL'].push(s);
            }
        });
        
        return groups;
    }, [sortedSections]);


    const selectedSectionObj = useMemo(() => {
        return sections.find((s) => s.section_name === selectedSection || s.id === selectedSection);
    }, [sections, selectedSection]);

    const isShsSection = useMemo(() => {
        const grade = (selectedSectionObj?.section_grade_level || '').toString().toLowerCase();
        if (!grade.includes('grade')) return false;
        const num = parseInt(grade.replace(/\D/g, '')) || 0;
        return num === 11 || num === 12;
    }, [selectedSectionObj?.section_grade_level]);

    const isShsSf10Selection = useMemo(() => {
        const fromStudent = (selectedStudent?.grade_level || '').toString();
        const text = `${fromStudent} ${selectedSectionObj?.section_grade_level || ''}`.toLowerCase();
        if (!text.includes('grade')) return false;
        const num = parseInt(text.replace(/\D/g, '')) || 0;
        return num === 11 || num === 12;
    }, [selectedStudent?.grade_level, selectedSectionObj?.section_grade_level]);

    const canEditCurrentSection = useMemo(() => {
        if (!selectedSectionObj) return false;
        return canAccessSF9Section(user, selectedSectionObj);
    }, [user, selectedSectionObj]);

    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        const sectionId = sections.find(s => s.section_name === selectedSection)?.id;
        return students.filter(s => s.student_section === selectedSection || (sectionId && s.student_section === sectionId));
    }, [students, selectedSection, sections]);

    const males = sectionStudents.filter(s => (s.gender || '').toLowerCase() === 'male').sort((a, b) => a.last_name.localeCompare(b.last_name));
    const females = sectionStudents.filter(s => (s.gender || '').toLowerCase() === 'female').sort((a, b) => a.last_name.localeCompare(b.last_name));

    const studentKey = selectedStudent?.lrn || '';

    const specData = useMemo(() => {
        const overrideKey = `${studentKey}_page_${currentPage}`;
        const currentOverrides = overrides[overrideKey] || {};
        if (!selectedStudent) return null;
        
        const isSHS = selectedStudent.grade_level?.includes('11') || selectedStudent.grade_level?.includes('12');
        
        const baseData = isSHS ? mapStudentToShsSf10Data({
            student: selectedStudent,
            profile: schoolProfile,
            schoolYear: activeSchoolYear,
            sections,
            teachers,
            gradingSheetRecords,
            subjects,
        }) : mapStudentToSpecData({
            student: selectedStudent,
            profile: schoolProfile,
            schoolYear: activeSchoolYear,
            sections,
            teachers,
            gradingSheetRecords,
            subjects,
        });
        
        const mergedData = JSON.parse(JSON.stringify(baseData)); // Deep clone
        Object.entries(currentOverrides).forEach(([path, value]) => {
            if (!path || value === undefined) return;

            const parts = path.split('.');
            let curr = mergedData as Record<string, unknown>;
            
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (part.includes('[')) {
                    const [p, rest] = part.split('[');
                    const idx = parseInt(rest.replace(']', ''));
                    if (!curr[p]) curr[p] = [];
                    const arr = curr[p] as unknown[];
                    if (!arr[idx]) arr[idx] = {};
                    curr = arr[idx] as Record<string, unknown>;
                } else {
                    if (!curr[part]) curr[part] = {};
                    curr = curr[part] as Record<string, unknown>;
                }
            }

            const lastPart = parts[parts.length - 1];
            if (lastPart) {
                curr[lastPart] = value;
            }
        });

        // Combine everything: prefer nested structure but fallback to flat keys for getVal compatibility
        return { ...mergedData, ...currentOverrides };
    }, [selectedStudent, schoolProfile, activeSchoolYear, sections, teachers, gradingSheetRecords, subjects, overrides, studentKey, currentPage]);

    const handleCellUpdate = (path: string, value: string) => {
        if (!selectedStudent) return;
        // Allow certification fields to always be editable
        const isCertPath = path.startsWith('certification.');
        if (!isCertPath && !canEditCurrentSection) return;
        setOverride(selectedStudent.lrn, `page_${currentPage}`, path, value);
    };

    const handleResetOverrides = () => {
        if (!selectedStudent) return;
        if (window.confirm('Are you sure you want to reset all manual edits for this page? This will clear any inputted data and restore the template defaults.')) {
            clearOverrides(selectedStudent.lrn, `page_${currentPage}`);
        }
    };

    return (
        <div className="sf10-print-root flex flex-col h-full bg-linear-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 dark:from-[#080d1a] dark:via-[#0b1329] dark:to-[#0d1630] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white">
             {/* Sticky Premium Top Toolbar */}
             <div className="z-20 bg-white/75 dark:bg-[#0d1225]/90 backdrop-blur-2xl border-b border-slate-200/70 dark:border-white/10 shadow-[0_8px_28px_rgba(15,23,42,0.05)] relative print:hidden shrink-0 w-full">
                <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-500 via-indigo-500 to-cyan-500 z-30" />
                <div className="flex items-center justify-start w-full h-18 select-none relative px-3 lg:px-4 gap-2.5 lg:gap-3 overflow-x-auto scrollbar-none">
                    
                    {/* Identity & Context Branding (Left Most Edge) */}
                    <div className="flex items-center gap-2 lg:gap-3 shrink-0">
                        <button 
                            onClick={() => setCurrentView('school-forms')}
                            className="w-8 h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex flex-col shrink-0">
                            <h2 className="text-[11px] lg:text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">SF10 Record</h2>
                            <p className="text-[7.5px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">Permanent Academic Record</p>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10 shrink-0 mx-0.5" />
                        
                    {/* Section and Student Selectors */}
                    {sortedSections.length >= 1 && (
                        <div className="relative group shrink-0">
                            <select 
                                className="appearance-none h-9 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-30 lg:min-w-33.75 duration-200"
                                value={selectedSection}
                                onChange={(e) => { setSelectedSection(e.target.value); setSelectedStudent(null); }}
                            >
                                <option value="">Choose Section</option>
                                {Object.entries(groupedSections).map(([group, groupSections]) => (
                                    groupSections.length > 0 && (
                                        <optgroup key={group} label={group}>
                                            {groupSections.map(s => (
                                                <option key={s.id} value={s.section_name}>
                                                    {s.section_grade_level} - {s.section_name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )
                                ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                        </div>
                    )}

                    <div className="relative group shrink-0">
                        <select 
                            className="appearance-none h-9 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-35 lg:min-w-38.75 max-w-50 truncate disabled:opacity-30 duration-200"
                            value={selectedStudent?.lrn || ''}
                            onChange={(e) => setSelectedStudent(students.find(s => s.lrn === e.target.value) || null)}
                            disabled={!selectedSection || isShsSection}
                        >
                            <option value="">{isShsSection ? 'Template Locked' : 'Select Student'}</option>
                            {males.length > 0 && (
                                <optgroup label="MALE">
                                    {males.map(s => <option key={s.lrn} value={s.lrn}>{s.last_name}, {s.first_name}</option>)}
                                </optgroup>
                            )}
                            {females.length > 0 && (
                                <optgroup label="FEMALE">
                                    {females.map(s => <option key={s.lrn} value={s.lrn}>{s.last_name}, {s.first_name}</option>)}
                                </optgroup>
                            )}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10 shrink-0 mx-0.5" />

                    {/* View & Formatting Controls (Center) */}
                    {selectedStudent && (
                        <>
                            <div className="flex bg-slate-100 dark:bg-white/10 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 h-9 shrink-0">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    className={`px-3.5 h-full rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 ${currentPage === 1 ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                                >
                                    Page 1
                                </button>
                                <button
                                    onClick={() => setCurrentPage(2)}
                                    className={`px-3.5 h-full rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 ${currentPage === 2 ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                                >
                                    Page 2
                                </button>
                            </div>

                            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-white/10 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 shrink-0">
                                <button 
                                    onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                                    className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-lg transition-all shadow-sm active:scale-90 duration-200"
                                    title="Zoom Out"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-[9px] font-black text-slate-900 dark:text-white w-8 text-center tabular-nums">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button 
                                    onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                    className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-lg transition-all shadow-sm active:scale-90 duration-200"
                                    title="Zoom In"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </>
                    )}

                    {/* Data and Actions (Right) */}
                    {selectedStudent && (
                        <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
                            {/* Divider between Center and Right */}
                            <div className="h-6 w-px bg-slate-200 dark:bg-white/10 shrink-0 mx-0.5" />
                            <button
                                onClick={() => setShowHistoricalModal(true)}
                                disabled={!selectedStudent || isShsSf10Selection}
                                className="h-9 px-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-900 dark:hover:bg-white/20 text-slate-500 dark:text-slate-300 hover:text-white font-black text-[8.5px] uppercase tracking-wider disabled:opacity-30 transition-all flex items-center gap-1 shadow-sm shrink-0 duration-200 active:scale-95 border border-slate-200/40 dark:border-white/10"
                                title="Edit Previous SF10 Records (Historical Data)"
                            >
                                <History className="w-3.5 h-3.5" />
                                History
                            </button>
                            <button
                                onClick={handleResetOverrides}
                                disabled={!selectedStudent || isShsSf10Selection}
                                className="h-9 px-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-red-50 dark:hover:bg-red-500/20 text-slate-500 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-black text-[8.5px] uppercase tracking-wider disabled:opacity-30 transition-all flex items-center gap-1 shadow-sm shrink-0 duration-200 active:scale-95 border border-slate-200/40 dark:border-white/10"
                                title="Reset all manual edits for this page"
                            >
                                Reset
                            </button>
                            
                            <button
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('formease-open-grade-debugger', {
                                        detail: {
                                            sectionId: selectedSectionObj?.id || selectedSectionState,
                                            studentLrn: selectedStudent?.lrn
                                        }
                                    }));
                                }}
                                className="h-9 px-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:text-amber-700 border border-amber-200/60 dark:border-amber-700/30 transition-all flex items-center gap-1 shrink-0 active:scale-95 text-[8.5px] font-black uppercase tracking-wider cursor-pointer"
                                title="Inspect & Debug Grade Sync"
                            >
                                <Bug className="w-3 h-3" />
                                <span className="hidden sm:inline">Inspect Sync</span>
                            </button>

                            <div className="h-6 w-px bg-slate-200 dark:bg-white/10 shrink-0" />
                            
                            <button
                                onClick={handlePrintSF10}
                                disabled={!selectedStudent || isShsSf10Selection}
                                className="h-9 px-3.5 lg:px-4 rounded-xl bg-blue-600 text-white font-black text-[8.5px] uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.01] active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200"
                            >
                                <Printer className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                                Print
                            </button>
                        </div>
                    )}
                </div>
             </div>

             {/* Workspace Container */}
             <div className="flex-1 overflow-auto relative bg-linear-to-b from-slate-100/70 to-blue-100/40 dark:from-[#080d1a] dark:to-[#0c142c] print:bg-white custom-scrollbar">
                <div className="w-full min-h-full flex flex-col items-center justify-start py-6 sm:py-8 px-3 sm:px-6 lg:px-10 relative print:overflow-visible print:py-0 print:px-0">
                    {isShsSection ? (
                        <div className="flex-1 flex items-center justify-center py-8 w-full">
                            <div className="relative w-full max-w-5xl rounded-3xl border border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] px-6 sm:px-10 py-10 sm:py-12 overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-br from-indigo-50/70 via-white/60 to-blue-50/60" />
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-40 bg-blue-300/20 blur-3xl rounded-full" />

                                <div className="relative flex flex-col items-center gap-7">
                                    <div className="relative group">
                                        <div className="absolute -inset-10 bg-indigo-500/10 blur-3xl rounded-full opacity-70 group-hover:opacity-100 transition-all duration-700" />
                                        <div className="relative w-52 h-52 sm:w-56 sm:h-56 bg-white rounded-[3rem] border border-slate-200 flex items-center justify-center transform group-hover:-translate-y-1 transition-all duration-500 shadow-xl">
                                            <FileText className="w-24 h-24 text-slate-200" />
                                            <div className="absolute -bottom-5 -right-5 w-22 h-22 bg-linear-to-br from-indigo-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl ring-8 ring-white">
                                                <span className="text-3xl font-black text-white italic tracking-tighter">SF10</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 max-w-2xl text-center">
                                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 mx-auto">
                                            <Clock3 className="w-3.5 h-3.5" />
                                            Preparing Official DepEd-Compliant Template
                                        </span>
                                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">Senior High School SF10 Template Coming Soon</h2>
                                        <p className="text-slate-600 font-semibold leading-relaxed text-sm sm:text-base">
                                            The Grade 11 and Grade 12 SF10 generation module is currently being finalized to align with the latest official DepEd formatting standards.
                                        </p>
                                        <p className="text-slate-600 font-medium leading-relaxed text-xs sm:text-sm">
                                            All core processing logic and student data handling are already in place. The preview and export features will be re-enabled once the final template structure is completed.
                                        </p>
                                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-blue-700/75">
                                            SF10 SHS Layout Queue
                                        </p>
                                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-500 shadow-sm mx-auto">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                            Status
                                            <span className="text-blue-700">Template validation in progress</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : selectedStudent && specData ? (
                        <div
                            className="transition-all duration-700 ease-out origin-top print:scale-100"
                            style={{
                                transform: `scale(${zoom}) translateZ(0)`,
                                transformOrigin: 'top center',
                                willChange: 'transform',
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden'
                            }}
                        >
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-linear-to-br from-blue-500/5 to-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                                <div className={`sf10-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none ${currentPage === 1 ? 'sf10-force-single-page' : ''}`}>
                                    {isShsSf10Selection ? (
                                        <div className="min-h-190 p-6 sm:p-8 md:p-12 flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-blue-50/50">
                                            <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
                                                <div className="absolute inset-0 bg-linear-to-br from-blue-100/45 via-transparent to-indigo-100/35" />
                                                <div className="absolute -top-16 -left-12 w-56 h-56 rounded-full bg-blue-300/20 blur-3xl" />
                                                <div className="absolute -bottom-20 -right-10 w-64 h-64 rounded-full bg-indigo-300/20 blur-3xl" />

                                                <div className="relative grid lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-10 p-6 sm:p-8 lg:p-10 items-center">
                                                    <div className="space-y-5 text-center lg:text-left">
                                                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                                                            <Clock3 className="w-3.5 h-3.5" />
                                                            Preparing Official DepEd-Compliant Template
                                                        </span>

                                                        <div className="space-y-3">
                                                            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-[1.05]">
                                                                Senior High School SF10 Template Coming Soon
                                                            </h3>
                                                            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold max-w-2xl mx-auto lg:mx-0">
                                                                The Grade 11 and Grade 12 SF10 generation module is currently being finalized to align with the latest official DepEd formatting standards.
                                                            </p>
                                                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
                                                                All core processing logic and student data handling are already in place. The preview and export features will be re-enabled once the final template structure is completed.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="relative h-64 sm:h-72 rounded-3xl border border-white/70 bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_30px_rgba(15,23,42,0.08)] overflow-hidden">
                                                        <div className="absolute inset-x-0 top-0 h-11 bg-linear-to-r from-blue-500/15 to-indigo-500/20 border-b border-slate-200/60" />
                                                        <motion.div
                                                            initial={{ y: 4, opacity: 0.85 }}
                                                            animate={{ y: [-2, 4, -2], opacity: [0.8, 1, 0.8] }}
                                                            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                                                            className="absolute top-6 left-6 right-6 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm"
                                                        >
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                                                                    <FileText className="w-4 h-4" />
                                                                </div>
                                                                <div className="text-[11px] font-black text-slate-700 uppercase tracking-wider">SF10 SHS Layout Queue</div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="h-2 rounded-full bg-slate-200/80" />
                                                                <div className="h-2 rounded-full bg-slate-200/80 w-10/12" />
                                                                <div className="h-2 rounded-full bg-blue-200/70 w-8/12" />
                                                            </div>
                                                        </motion.div>
                                                        <motion.div
                                                            initial={{ y: -2, opacity: 0.8 }}
                                                            animate={{ y: [4, -2, 4], opacity: [0.8, 1, 0.8] }}
                                                            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                                                            className="absolute bottom-5 right-5 w-36 rounded-2xl border border-blue-100 bg-blue-50/90 p-3 shadow-sm"
                                                        >
                                                            <div className="text-[9px] font-black uppercase tracking-wider text-blue-700">Status</div>
                                                            <div className="mt-1 text-[11px] font-bold text-slate-700 leading-tight">Template validation in progress</div>
                                                        </motion.div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : specData.isES ? (
                                        <SF10SpecRenderer
                                            pageNumber={currentPage}
                                            data={specData}
                                            onUpdate={handleCellUpdate}
                                        />
                                    ) : (
                                        <SF10JHSRenderer
                                            pageNumber={currentPage}
                                            data={specData}
                                            onUpdate={handleCellUpdate}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                            <div className="relative w-full max-w-5xl rounded-3xl border border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] px-6 sm:px-10 py-10 sm:py-12 overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-br from-indigo-50/70 via-white/60 to-blue-50/60" />
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-40 bg-blue-300/20 blur-3xl rounded-full" />

                                <div className="relative flex flex-col items-center gap-7">
                                    <div className="relative group">
                                        <div className="absolute -inset-10 bg-indigo-500/10 blur-3xl rounded-full opacity-70 group-hover:opacity-100 transition-all duration-700" />
                                        <div className="relative w-52 h-52 sm:w-56 sm:h-56 bg-white rounded-[3rem] border border-slate-200 flex items-center justify-center transform group-hover:-translate-y-1 transition-all duration-500 shadow-xl">
                                            <FileText className="w-24 h-24 text-slate-200" />
                                            <div className="absolute -bottom-5 -right-5 w-22 h-22 bg-linear-to-br from-indigo-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl ring-8 ring-white">
                                                <span className="text-3xl font-black text-white italic tracking-tighter">SF10</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 max-w-2xl">
                                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                                            <Clock3 className="w-3.5 h-3.5" />
                                            Preparing Official DepEd-Compliant Template
                                        </span>
                                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">Senior High School SF10 Template Coming Soon</h2>
                                        <p className="text-slate-600 font-semibold leading-relaxed text-sm sm:text-base">
                                            The Grade 11 and Grade 12 SF10 generation module is currently being finalized to align with the latest official DepEd formatting standards.
                                        </p>
                                        <p className="text-slate-600 font-medium leading-relaxed text-xs sm:text-sm">
                                            All core processing logic and student data handling are already in place. The preview and export features will be re-enabled once the final template structure is completed.
                                        </p>
                                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-blue-700/75">
                                            SF10 SHS Layout Queue
                                        </p>
                                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-500 shadow-sm">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                            Status
                                            <span className="text-blue-700">Template validation in progress</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
             </div>

             {showHistoricalModal && selectedStudent && (
                 <SF10HistoricalDataModal
                    student={selectedStudent}
                    schoolProfile={schoolProfile}
                    onClose={() => setShowHistoricalModal(false)}
                 />
             )}



             <style>{`
                @media print {
                    @page {
                        size: 8.5in 13in;
                        margin: 0 !important;
                    }

                    html,
                    body {
                        width: 8.5in !important;
                        height: 13in !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        background: #fff !important;
                    }

                    .sf10-print-root {
                        display: block !important;
                        width: 8.5in !important;
                        height: 13in !important;
                        max-height: 13in !important;
                        overflow: hidden !important;
                        background: #fff !important;
                    }

                    .sf10-print-sheet {
                        width: 8.5in !important;
                        height: 13in !important;
                        max-height: 13in !important;
                        margin: 0 !important;
                        overflow: hidden !important;
                    }

                    .sf10-force-single-page {
                        break-after: avoid-page !important;
                        page-break-after: avoid !important;
                    }
                }
             `}</style>
        </div>
    );
}
