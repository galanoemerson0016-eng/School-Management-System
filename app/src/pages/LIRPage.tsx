import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores';
import { useAuthStore } from '../stores/auth-store';
import type { Student, Section, Subject } from '../types';
import { 
    ArrowLeft, Printer, FileText, Plus, Minus, ChevronDown, 
    Download, Users, CheckSquare, Square, X, Loader2, Filter
} from 'lucide-react';
import { filterSubjectsForSection } from '../lib/rbac';
import { normalizeSubjectName } from '../lib/subjectConfig';
import { resolveStudentQuarterGrade } from '../utils/grading-helpers';
import { LIRRenderer } from '../components/LIRRenderer';
import { exportElementsToPdf, printElements } from '../utils/pdf-export';

export function LIRPage() {
    const { students, sections, subjects, teachers, schoolProfile, activeSchoolYear, setCurrentView, classRecords, gradingSheetRecords, hpsRecords, sf2Sheets } = useAppStore();
    const { user } = useAuthStore();
    
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [zoom, setZoom] = useState(1);
    const [fillColor, setFillColor] = useState('#86efac');
    const [outlineColor, setOutlineColor] = useState('#22c55e');
    const [paperSize, setPaperSize] = useState<'a4' | 'letter' | 'folio'>('folio');

    // Bulk Modal & Export State
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [selectedBulkLrns, setSelectedBulkLrns] = useState<Set<string>>(new Set());
    const [bulkSearchQuery, setBulkSearchQuery] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportStatusText, setExportStatusText] = useState('');

    const selectedSectionObj = useMemo(() => {
        return sections.find((s) => s.section_name === selectedSection || s.id === selectedSection);
    }, [sections, selectedSection]);

    const selectedSubjectObj = useMemo(() => {
        return subjects.find((s) => s.id === selectedSubject || s.subject_name === selectedSubject);
    }, [subjects, selectedSubject]);

    const availableSubjects = useMemo(() => {
        if (!selectedSectionObj) return [];

        const filtered = filterSubjectsForSection(user, selectedSectionObj, subjects);
        const seen = new Set<string>();

        return filtered.filter((subject) => {
            const key = normalizeSubjectName(subject.subject_name);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [selectedSectionObj, subjects, user]);

    const teacherName = useMemo(() => {
        if (selectedSubjectObj?.teacher_id) {
            const teacherObj = (teachers as { uid?: string; id?: string; displayName?: string; name?: string }[]).find(t => t.uid === selectedSubjectObj.teacher_id || t.id === selectedSubjectObj.teacher_id);
            if (teacherObj) return teacherObj.displayName || teacherObj.name;
        }
        return selectedSectionObj?.adviser_name || '';
    }, [selectedSubjectObj, teachers, selectedSectionObj]);

    const sortedSections = useMemo(() => {
        return [...sections].sort((a, b) => {
            const glCompare = (a.section_grade_level || '').localeCompare(b.section_grade_level || '', undefined, { numeric: true });
            if (glCompare !== 0) return glCompare;
            return (a.section_name || '').localeCompare(b.section_name || '');
        });
    }, [sections]);

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
            } else {
                groups['ELEMENTARY'].push(s);
            }
        });
        
        return groups;
    }, [sortedSections]);

    useEffect(() => {
        if (!selectedSection && sortedSections.length === 1) {
            const timer = setTimeout(() => {
                setSelectedSection(sortedSections[0].section_name);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [sortedSections, selectedSection]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSelectedSubject('');
            setSelectedStudent(null);
            setSelectedBulkLrns(new Set());
        }, 0);
        return () => clearTimeout(timer);
    }, [selectedSection]);

    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        const sectionId = sections.find(s => s.section_name === selectedSection || s.id === selectedSection)?.id;
        return students.filter(s => s.student_section === selectedSection || (sectionId && s.student_section === sectionId));
    }, [students, selectedSection, sections]);

    const males = useMemo(() => sectionStudents.filter(s => (s.gender || '').toLowerCase() === 'male').sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`)), [sectionStudents]);
    const females = useMemo(() => sectionStudents.filter(s => (s.gender || '').toLowerCase() !== 'male').sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`)), [sectionStudents]);

    const handleOpenBulkModal = () => {
        if (selectedBulkLrns.size === 0 && sectionStudents.length > 0) {
            setSelectedBulkLrns(new Set(sectionStudents.map(s => s.lrn)));
        }
        setIsBulkModalOpen(true);
    };

    // Student Data Calculation Helpers
    const getAttendanceDataForStudent = useCallback((student: Student | null) => {
        if (!student) return {};
        
        const monthlyAbsences: Record<string, number> = {};
        
        const studentSheets = sf2Sheets.filter(sheet => 
            sheet.school_year === activeSchoolYear &&
            (sheet.section_id === selectedSectionObj?.id || sheet.section_id === selectedSection)
        );

        studentSheets.forEach(sheet => {
            const studentAttendance = sheet.attendance?.[student.lrn];
            if (studentAttendance) {
                const absenceCount = Object.values(studentAttendance).filter(status => 
                    status?.toLowerCase() === 'absent'
                ).length;
                
                if (absenceCount > 0) {
                    monthlyAbsences[sheet.month.toUpperCase()] = absenceCount;
                }
            }
        });

        return monthlyAbsences;
    }, [sf2Sheets, activeSchoolYear, selectedSectionObj, selectedSection]);

    const getGradeDataForStudent = useCallback((student: Student | null, subjectId: string, subjectObj?: Subject) => {
        if (!student || !subjectId) return undefined;
        
        interface TermData {
            scores: {
                ww: (number | string)[];
                pt: (number | string)[];
                st: (number | string)[];
                te: number | string;
            };
            hps: {
                ww: (number | string)[];
                pt: (number | string)[];
                st: (number | string)[];
                te: number | string;
            };
            finalGrade: number | string;
        }

        const data: Record<number, TermData> = {};
        [1, 2, 3].forEach(term => {
            const isMatch = (rSubId: string, rSubName?: string) => {
                if (rSubId === subjectObj?.id || rSubId === subjectId) return true;
                if (rSubName && subjectObj?.subject_name && normalizeSubjectName(rSubName) === normalizeSubjectName(subjectObj.subject_name)) return true;
                return false;
            };

            const record = classRecords.find(r => 
                r.student_lrn === student.lrn && 
                r.school_year === activeSchoolYear &&
                Number(r.quarter) === term &&
                isMatch(r.subject_id, r.subject_name)
            ) || gradingSheetRecords.find(r => 
                r.student_lrn === student.lrn && 
                r.school_year === activeSchoolYear && 
                Number(r.quarter) === term &&
                isMatch(r.subject_id, r.subject_name)
            );

            const hpsRec = hpsRecords.find(r => 
                isMatch(r.subject_id, (r as { subject_name?: string }).subject_name) && 
                r.school_year === activeSchoolYear && 
                Number(r.quarter) === term &&
                (r.section_id === student.student_section || (selectedSectionObj?.id && r.section_id === selectedSectionObj.id))
            ) || hpsRecords.find(r => 
                isMatch(r.subject_id, (r as { subject_name?: string }).subject_name) && 
                r.school_year === activeSchoolYear && 
                Number(r.quarter) === term
            );

            const normalize = (arr: (number | string)[] | undefined, count: number) => {
                const src = Array.isArray(arr) ? arr : [];
                return Array.from({ length: count }, (_, i) => src[i] ?? '');
            };

            const recordWithSummative = (record as unknown) as (Record<string, unknown> & { summative_tests?: (number | string)[] });
            const hpsWithSummative = (hpsRec as unknown) as (Record<string, unknown> & { summative_tests?: (number | string)[] });

            const clean = (val: unknown) => (val === '' || val === null || val === undefined) ? '' : (val as number | string);

            const resolvedFG = resolveStudentQuarterGrade(
                student.lrn,
                subjectObj?.id || selectedSubject,
                term,
                activeSchoolYear,
                classRecords,
                gradingSheetRecords,
                hpsRecords,
                selectedSectionObj?.section_grade_level,
                selectedSectionObj?.track
            );

            data[term] = {
                scores: {
                    ww: normalize(record?.written_works, 10).map(clean),
                    pt: normalize(record?.performance_tasks, 10).map(clean),
                    st: normalize(recordWithSummative?.summative_tests, 5).map(clean),
                    te: clean(record?.quarterly_exam ?? '')
                },
                hps: {
                    ww: normalize(hpsRec?.written_works, 10).map(clean),
                    pt: normalize(hpsRec?.performance_tasks, 10).map(clean),
                    st: normalize(hpsWithSummative?.summative_tests, 5).map(clean),
                    te: clean(hpsRec?.quarterly_exam ?? '')
                },
                finalGrade: resolvedFG > 0 ? resolvedFG : clean(record?.final_grade ?? '')
            };
        });
        return data;
    }, [classRecords, gradingSheetRecords, hpsRecords, activeSchoolYear, selectedSectionObj, selectedSubject]);

    const attendanceData = useMemo(() => {
        return getAttendanceDataForStudent(selectedStudent);
    }, [selectedStudent, getAttendanceDataForStudent]);

    const gradeData = useMemo(() => {
        return getGradeDataForStudent(selectedStudent, selectedSubject, selectedSubjectObj);
    }, [selectedStudent, selectedSubject, selectedSubjectObj, getGradeDataForStudent]);

    const sortedSectionStudents = useMemo(() => {
        return [...males, ...females];
    }, [males, females]);

    // Active Bulk Learners List (Male learners A-Z first, then Female learners A-Z)
    const bulkSelectedStudents = useMemo(() => {
        return sortedSectionStudents.filter(s => selectedBulkLrns.has(s.lrn));
    }, [sortedSectionStudents, selectedBulkLrns]);

    const filteredBulkStudents = useMemo(() => {
        if (!bulkSearchQuery.trim()) return sectionStudents;
        const q = bulkSearchQuery.toLowerCase();
        return sectionStudents.filter(s => 
            s.last_name.toLowerCase().includes(q) || 
            s.first_name.toLowerCase().includes(q) || 
            s.lrn.includes(q)
        );
    }, [sectionStudents, bulkSearchQuery]);

    const filteredMales = useMemo(() => filteredBulkStudents.filter(s => (s.gender || '').toLowerCase() === 'male'), [filteredBulkStudents]);
    const filteredFemales = useMemo(() => filteredBulkStudents.filter(s => (s.gender || '').toLowerCase() === 'female'), [filteredBulkStudents]);

    const handlePrintSingle = () => {
        if (!selectedStudent) return;
        const originalTitle = document.title;
        const safeName = `${selectedStudent.last_name}_${selectedStudent.first_name}`.replace(/[^a-z0-9]/gi, '_');
        document.title = `LIR_${safeName}_${activeSchoolYear}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    };

    // Bulk Print Execution
    const handleBulkPrint = async () => {
        if (bulkSelectedStudents.length === 0) return;
        
        setIsExporting(true);
        setExportProgress(10);
        setExportStatusText('Preparing LIR sheets for bulk printing...');

        try {
            await new Promise(r => setTimeout(r, 400));
            const bulkContainer = document.getElementById('lir-bulk-render-container');
            const sheetElements = bulkContainer ? Array.from(bulkContainer.querySelectorAll('.lir-bulk-sheet')) as HTMLElement[] : [];

            if (sheetElements.length === 0) {
                alert('No sheets ready for printing. Please try again.');
                setIsExporting(false);
                return;
            }

            setExportProgress(50);
            setExportStatusText(`Opening print stream for ${sheetElements.length} learners...`);

            await printElements({
                elements: sheetElements,
                paperSize,
                orientation: 'portrait',
                title: `Bulk_LIR_${selectedSectionObj?.section_name || 'Section'}_${selectedSubjectObj?.subject_name || 'Subject'}`
            });

            setExportProgress(100);
            setExportStatusText('Bulk print stream launched successfully.');
            setTimeout(() => {
                setIsExporting(false);
                setIsBulkModalOpen(false);
            }, 600);
        } catch (err) {
            console.error('Bulk print error:', err);
            alert('Failed to launch bulk print.');
            setIsExporting(false);
        }
    };

    // Bulk PDF Download Execution
    const handleBulkPdfDownload = async () => {
        if (bulkSelectedStudents.length === 0) return;

        setIsExporting(true);
        setExportProgress(5);
        setExportStatusText('Initializing vector PDF export pipeline...');

        try {
            await new Promise(r => setTimeout(r, 400));
            const bulkContainer = document.getElementById('lir-bulk-render-container');
            const sheetElements = bulkContainer ? Array.from(bulkContainer.querySelectorAll('.lir-bulk-sheet')) as HTMLElement[] : [];

            if (sheetElements.length === 0) {
                alert('No sheets ready for PDF export.');
                setIsExporting(false);
                return;
            }

            const sectionName = (selectedSectionObj?.section_name || selectedSection || 'Section').replace(/[^a-z0-9]/gi, '_');
            const subjectName = (selectedSubjectObj?.subject_name || 'Subject').replace(/[^a-z0-9]/gi, '_');
            const filename = `LIR_${sectionName}_${subjectName}_${activeSchoolYear}`;

            const result = await exportElementsToPdf({
                elements: sheetElements,
                filename,
                paperSize,
                orientation: 'portrait',
                title: filename,
                onProgressChange: (progress: number) => {
                    setExportProgress(progress);
                    setExportStatusText(`Processing LIR PDF pages: ${progress}% complete...`);
                }
            });

            if (result.success) {
                setExportProgress(100);
                setExportStatusText('PDF download complete!');
                setTimeout(() => {
                    setIsExporting(false);
                    setIsBulkModalOpen(false);
                }, 800);
            } else if (!result.cancelled) {
                alert(`Export failed: ${result.error || 'Unknown error'}`);
                setIsExporting(false);
            } else {
                setIsExporting(false);
            }
        } catch (err) {
            console.error('Bulk PDF download error:', err);
            alert('Failed to generate PDF download.');
            setIsExporting(false);
        }
    };

    const toggleStudentSelection = (lrn: string) => {
        setSelectedBulkLrns(prev => {
            const next = new Set(prev);
            if (next.has(lrn)) next.delete(lrn);
            else next.add(lrn);
            return next;
        });
    };

    const selectAllStudents = () => {
        setSelectedBulkLrns(new Set(sectionStudents.map(s => s.lrn)));
    };

    const selectMalesOnly = () => {
        setSelectedBulkLrns(new Set(males.map(s => s.lrn)));
    };

    const selectFemalesOnly = () => {
        setSelectedBulkLrns(new Set(females.map(s => s.lrn)));
    };

    const clearAllSelection = () => {
        setSelectedBulkLrns(new Set());
    };

    return (
        <div className="lir-print-root flex flex-col h-full min-h-0 bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white">
             {/* Sticky Premium Top Toolbar */}
             <div className="z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm sticky top-0 print:hidden shrink-0 w-full">
                <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30" />
                <div className="flex items-center w-full h-14 select-none relative px-2 lg:px-3 gap-1.5 lg:gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                    
                    {/* Identity & Context Branding */}
                    <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
                        <button 
                            onClick={() => setCurrentView('school-forms')}
                            className="w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex flex-col shrink-0">
                            <h2 className="text-[10px] lg:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5">Learner Record</h2>
                            <p className="text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Individual LIR</p>
                        </div>
                    </div>

                    <div className="h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0" />
                        
                    {/* Section Selector */}
                    <div className="relative group min-w-0 flex-1">
                        <select 
                            className="appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 duration-200 truncate"
                            value={selectedSection}
                            onChange={(e) => { setSelectedSection(e.target.value); setSelectedStudent(null); setSelectedSubject(''); }}
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
                        <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    </div>

                    {/* Subject Selector */}
                    <div className="relative group min-w-0 flex-1">
                        <select 
                            className="appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-22.5 disabled:opacity-30 duration-200 truncate"
                            value={selectedSubject}
                            onChange={(e) => { setSelectedSubject(e.target.value); setSelectedStudent(null); }}
                            disabled={!selectedSection}
                        >
                            <option value="">Select Subject</option>
                            {availableSubjects.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.subject_name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    </div>

                    {/* Learner Selector */}
                    <div className="relative group min-w-0 flex-1">
                        <select 
                            className="appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-full min-w-25 truncate disabled:opacity-30 duration-200"
                            value={selectedStudent?.lrn || ''}
                            onChange={(e) => {
                                const student = students.find(s => s.lrn === e.target.value) || null;
                                setSelectedStudent(student);
                            }}
                            disabled={!selectedSubject}
                        >
                            <option value="">Select Learner</option>
                            {males.length > 0 && (
                                <optgroup label="MALE">
                                    {males.map(s => {
                                        const hasRecords = selectedSubject && (
                                            classRecords.some(r => r.student_lrn === s.lrn && r.subject_id === selectedSubject && r.school_year === activeSchoolYear) ||
                                            gradingSheetRecords.some(r => r.student_lrn === s.lrn && r.subject_id === selectedSubject && r.school_year === activeSchoolYear)
                                        );
                                        return <option key={s.lrn} value={s.lrn}>{s.last_name}, {s.first_name} {hasRecords ? '✓' : ''}</option>;
                                    })}
                                </optgroup>
                            )}
                            {females.length > 0 && (
                                <optgroup label="FEMALE">
                                    {females.map(s => {
                                        const hasRecords = selectedSubject && (
                                            classRecords.some(r => r.student_lrn === s.lrn && r.subject_id === selectedSubject && r.school_year === activeSchoolYear) ||
                                            gradingSheetRecords.some(r => r.student_lrn === s.lrn && r.subject_id === selectedSubject && r.school_year === activeSchoolYear)
                                        );
                                        return <option key={s.lrn} value={s.lrn}>{s.last_name}, {s.first_name} {hasRecords ? '✓' : ''}</option>;
                                    })}
                                </optgroup>
                            )}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    </div>

                    <div className="h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0" />

                    {/* Paper Size selector */}
                    <div className="relative group shrink-0">
                        <select
                            value={paperSize}
                            onChange={(e) => setPaperSize(e.target.value as 'a4' | 'letter' | 'folio')}
                            className="appearance-none h-8 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-2 pr-6 text-[9px] lg:text-[9.5px] font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer min-w-13.75 duration-200"
                            title="Paper Size"
                        >
                            <option value="a4">A4</option>
                            <option value="letter">Letter</option>
                            <option value="folio">Folio</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    </div>

                    {/* Branding Colors swatches */}
                    <div className="flex gap-1 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0 items-center px-1.5">
                        <div className="relative flex items-center justify-center cursor-pointer shrink-0" title="Choose Fill Color">
                            <div className="w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0" style={{ backgroundColor: fillColor, width: 18, height: 18 }} />
                            <input 
                                type="color" 
                                value={fillColor} 
                                onChange={(e) => setFillColor(e.target.value)}
                                className="w-full h-full opacity-0 absolute inset-0 cursor-pointer"
                            />
                        </div>
                        <div className="relative flex items-center justify-center cursor-pointer shrink-0" title="Choose Outline Color">
                            <div className="w-4.5 h-4.5 rounded-md border border-slate-200 dark:border-white/20 shadow-sm shrink-0" style={{ backgroundColor: outlineColor, width: 18, height: 18 }} />
                            <input 
                                type="color" 
                                value={outlineColor} 
                                onChange={(e) => setOutlineColor(e.target.value)}
                                className="w-full h-full opacity-0 absolute inset-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* View Zoom */}
                    <div className="flex items-center gap-0 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-8 shrink-0">
                        <button 
                            onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                            className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200"
                            title="Zoom Out"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-[8px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button 
                            onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                            className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all active:scale-90 duration-200"
                            title="Zoom In"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Bulk Selection / Manage Button */}
                    <button
                        onClick={handleOpenBulkModal}
                        disabled={!selectedSection || !selectedSubject || sectionStudents.length === 0}
                        className="ml-auto h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer"
                        title="Filter / Select Learners"
                    >
                        <Users className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                        Select ({selectedBulkLrns.size})
                    </button>

                    {/* Direct Bulk PDF Export */}
                    <button
                        onClick={handleBulkPdfDownload}
                        disabled={!selectedSection || !selectedSubject || bulkSelectedStudents.length === 0}
                        className="h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer"
                        title="Bulk Download PDF for selected learners"
                    >
                        <Download className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" />
                        Bulk PDF
                    </button>

                    {/* Direct Bulk Print */}
                    <button
                        onClick={handleBulkPrint}
                        disabled={!selectedSection || !selectedSubject || bulkSelectedStudents.length === 0}
                        className="h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer"
                        title="Bulk Print for selected learners"
                    >
                        <Printer className="w-3 h-3 group-hover:scale-110 transition-transform" />
                        Bulk Print
                    </button>

                    {/* Single Print Button */}
                    <button
                        onClick={handlePrintSingle}
                        disabled={!selectedStudent}
                        className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200 shrink-0 cursor-pointer"
                        title="Print single active learner"
                    >
                        <Printer className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                        Print Single
                    </button>
                </div>
             </div>

             {/* Main Single Preview Viewport */}
             <div className="flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar">
                <div className="w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0">
                    {selectedStudent ? (
                        <div 
                            className="transition-all duration-700 ease-out origin-top print:scale-100"
                            style={{ 
                                transform: `scale(${zoom}) translateZ(0)`,
                                willChange: 'transform',
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden'
                            }}
                        >
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-linear-to-br from-emerald-500/5 to-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                                <div className="lir-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none">
                                    <LIRRenderer 
                                        pageNumber={1} 
                                        student={selectedStudent}
                                        profile={schoolProfile}
                                        schoolYear={activeSchoolYear}
                                        subject={selectedSubjectObj?.subject_name || ''}
                                        teacher={teacherName}
                                        fillColor={fillColor}
                                        outlineColor={outlineColor}
                                        gradeData={gradeData}
                                        attendanceData={attendanceData}
                                        paperSize={paperSize}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10">
                            <div className="relative group">
                                <div className="absolute -inset-24 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full" />
                                <div className="relative w-64 h-64 bg-white dark:bg-white/5 rounded-[5rem] border border-slate-200 dark:border-white/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl">
                                    <FileText className="w-28 h-28 text-slate-100 dark:text-slate-600" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-7xl font-black text-slate-100 dark:text-slate-600 tracking-tighter leading-none italic">LIR</span>
                                        <div className="w-20 h-1 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full mt-4" />
                                    </div>
                                    <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 dark:ring-[#080d1a] group-hover:rotate-12 transition-all duration-500">
                                        <Printer className="w-10 h-10 text-white" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Individual Record</h2>
                                <p className="text-slate-400 dark:text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60">
                                    Select a learner from the toolbar above to preview single LIR, or use Bulk Actions for printing and downloading entire sections.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
             </div>

             {/* Hidden DOM Container for Multi-Page Bulk Operations */}
             <div id="lir-bulk-render-container" className="fixed top-0 pointer-events-none opacity-100 -z-50 print:static print:left-0 print:z-auto print:block" style={{ left: '-9999px' }}>
                {bulkSelectedStudents.map((student) => {
                    const studentGrades = getGradeDataForStudent(student, selectedSubject, selectedSubjectObj);
                    const studentAttendance = getAttendanceDataForStudent(student);
                    return (
                        <div key={student.lrn} className="lir-bulk-sheet lir-print-sheet print:break-after-page print:page-break-after-always">
                            <LIRRenderer 
                                pageNumber={1}
                                student={student}
                                profile={schoolProfile}
                                schoolYear={activeSchoolYear}
                                subject={selectedSubjectObj?.subject_name || ''}
                                teacher={teacherName}
                                fillColor={fillColor}
                                outlineColor={outlineColor}
                                gradeData={studentGrades}
                                attendanceData={studentAttendance}
                                paperSize={paperSize}
                            />
                        </div>
                    );
                })}
             </div>

             {/* BULK OPERATIONS MODAL */}
             {isBulkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-wide text-white">Bulk LIR Operations</h3>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                                        {selectedSectionObj?.section_grade_level} - {selectedSectionObj?.section_name} | {selectedSubjectObj?.subject_name}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsBulkModalOpen(false)}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Controls Toolbar */}
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                            {/* Search */}
                            <div className="relative flex-1 min-w-48">
                                <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Filter learners by name or LRN..."
                                    value={bulkSearchQuery}
                                    onChange={(e) => setBulkSearchQuery(e.target.value)}
                                    className="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            {/* Batch Selection Presets */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                    onClick={selectAllStudents}
                                    className="h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1"
                                >
                                    <CheckSquare className="w-3 h-3 text-indigo-600" />
                                    All ({sectionStudents.length})
                                </button>
                                <button
                                    onClick={selectMalesOnly}
                                    className="h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1"
                                >
                                    Males ({males.length})
                                </button>
                                <button
                                    onClick={selectFemalesOnly}
                                    className="h-7 px-2.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1"
                                >
                                    Females ({females.length})
                                </button>
                                <button
                                    onClick={clearAllSelection}
                                    className="h-7 px-2.5 rounded-md bg-slate-200/60 hover:bg-slate-200 text-[10px] font-bold text-slate-600 transition-colors flex items-center gap-1"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Learners Selection Table / List */}
                        <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-slate-100/50 space-y-4">
                            {/* MALE GROUP */}
                            {filteredMales.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Male Learners ({filteredMales.length})
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {filteredMales.map(student => {
                                            const isSelected = selectedBulkLrns.has(student.lrn);
                                            const hasGrades = selectedSubject && (
                                                classRecords.some(r => r.student_lrn === student.lrn && r.subject_id === selectedSubject && r.school_year === activeSchoolYear) ||
                                                gradingSheetRecords.some(r => r.student_lrn === student.lrn && r.subject_id === selectedSubject && r.school_year === activeSchoolYear)
                                            );
                                            return (
                                                <div 
                                                    key={student.lrn}
                                                    onClick={() => toggleStudentSelection(student.lrn)}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                        isSelected 
                                                            ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm' 
                                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {isSelected ? (
                                                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                                                        ) : (
                                                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                                                        )}
                                                        <div className="truncate">
                                                            <p className="text-xs font-bold text-slate-800 truncate">
                                                                {student.last_name}, {student.first_name} {student.middle_name ? student.middle_name[0] + '.' : ''}
                                                            </p>
                                                            <p className="text-[9px] font-medium text-slate-400">LRN: {student.lrn}</p>
                                                        </div>
                                                    </div>
                                                    {hasGrades && (
                                                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0">
                                                            ✓ Grades
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* FEMALE GROUP */}
                            {filteredFemales.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Female Learners ({filteredFemales.length})
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {filteredFemales.map(student => {
                                            const isSelected = selectedBulkLrns.has(student.lrn);
                                            const hasGrades = selectedSubject && (
                                                classRecords.some(r => r.student_lrn === student.lrn && r.subject_id === selectedSubject && r.school_year === activeSchoolYear) ||
                                                gradingSheetRecords.some(r => r.student_lrn === student.lrn && r.subject_id === selectedSubject && r.school_year === activeSchoolYear)
                                            );
                                            return (
                                                <div 
                                                    key={student.lrn}
                                                    onClick={() => toggleStudentSelection(student.lrn)}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                        isSelected 
                                                            ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20 shadow-sm' 
                                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {isSelected ? (
                                                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                                                        ) : (
                                                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                                                        )}
                                                        <div className="truncate">
                                                            <p className="text-xs font-bold text-slate-800 truncate">
                                                                {student.last_name}, {student.first_name} {student.middle_name ? student.middle_name[0] + '.' : ''}
                                                            </p>
                                                            <p className="text-[9px] font-medium text-slate-400">LRN: {student.lrn}</p>
                                                        </div>
                                                    </div>
                                                    {hasGrades && (
                                                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold shrink-0">
                                                            ✓ Grades
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {filteredBulkStudents.length === 0 && (
                                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                                    No learners found matching "{bulkSearchQuery}".
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                            <div className="text-xs font-bold text-slate-600">
                                <span className="text-indigo-600 font-black">{selectedBulkLrns.size}</span> of {sectionStudents.length} learners selected
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleBulkPdfDownload}
                                    disabled={selectedBulkLrns.size === 0}
                                    className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download PDF
                                </button>
                                <button
                                    onClick={handleBulkPrint}
                                    disabled={selectedBulkLrns.size === 0}
                                    className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    Bulk Print
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
             )}

             {/* EXPORT / PRINT PROGRESS OVERLAY */}
             {isExporting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-lg animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-6">
                        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                            <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 animate-ping" />
                            <div className="relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Processing LIR Records</h3>
                            <p className="text-xs font-semibold text-slate-500">{exportStatusText}</p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                                <div 
                                    className="h-full bg-linear-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.max(5, exportProgress)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                <span>Export Pipeline</span>
                                <span>{exportProgress}%</span>
                            </div>
                        </div>
                    </div>
                </div>
             )}

             <style>{`
                @media print {
                    @page {
                        size: ${paperSize === 'a4' ? '210mm 297mm' : paperSize === 'letter' ? '8.5in 11in' : '8.5in 13in'};
                        margin: 0 !important;
                    }
                    html, body {
                        width: ${paperSize === 'a4' ? '210mm' : '8.5in'} !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: ${paperSize === 'a4' ? '210mm' : '8.5in'} !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: ${paperSize === 'a4' ? '210mm' : '8.5in'} !important;
                        height: ${paperSize === 'a4' ? '297mm' : paperSize === 'letter' ? '11in' : '13in'} !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        break-after: page !important;
                        page-break-after: always !important;
                    }
                    .lir-print-sheet:last-child {
                        break-after: auto !important;
                        page-break-after: auto !important;
                    }
                }
             `}</style>
        </div>
    );
}
