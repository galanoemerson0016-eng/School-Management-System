import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../stores';
import { useAuthStore } from '../stores/auth-store';
import type { Student, Section } from '../types';
import { ArrowLeft, Printer, FileText, Plus, Minus, ChevronDown } from 'lucide-react';
import { filterSubjectsForSection } from '../lib/rbac';
import { normalizeSubjectName } from '../lib/subjectConfig';
import { LIRRenderer } from '../components/LIRRenderer';

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
                 // Check both uid and displayName in stores
                 const teacherObj = (teachers as { uid?: string; id?: string; displayName?: string; name?: string }[]).find(t => t.uid === selectedSubjectObj.teacher_id || t.id === selectedSubjectObj.teacher_id);
                 if (teacherObj) return teacherObj.displayName || teacherObj.name;
        }
        return selectedSectionObj?.adviser_name || '';
    }, [selectedSubjectObj, teachers, selectedSectionObj]);

    const handlePrint = () => {
        if (!selectedStudent) return;
        const originalTitle = document.title;
        const safeName = `${selectedStudent.last_name}_${selectedStudent.first_name}`.replace(/[^a-z0-9]/gi, '_');
        document.title = `LIR_${safeName}_${activeSchoolYear}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    };

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
        }, 0);
        return () => clearTimeout(timer);
    }, [selectedSection]);

    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        const sectionId = sections.find(s => s.section_name === selectedSection || s.id === selectedSection)?.id;
        return students.filter(s => s.student_section === selectedSection || (sectionId && s.student_section === sectionId));
    }, [students, selectedSection, sections]);

    const males = sectionStudents.filter(s => (s.gender || '').toLowerCase() === 'male').sort((a, b) => a.last_name.localeCompare(b.last_name));
    const females = sectionStudents.filter(s => (s.gender || '').toLowerCase() === 'female').sort((a, b) => a.last_name.localeCompare(b.last_name));

    const attendanceData = useMemo(() => {
        if (!selectedStudent) return {};
        
        const monthlyAbsences: Record<string, number> = {};
        
        // Filter sheets for this student's section and current school year
        const studentSheets = sf2Sheets.filter(sheet => 
            sheet.school_year === activeSchoolYear &&
            (sheet.section_id === selectedSectionObj?.id || sheet.section_id === selectedSection)
        );

        studentSheets.forEach(sheet => {
            const studentAttendance = sheet.attendance?.[selectedStudent.lrn];
            if (studentAttendance) {
                // Count days where status is 'absent'
                const absenceCount = Object.values(studentAttendance).filter(status => 
                    status?.toLowerCase() === 'absent'
                ).length;
                
                if (absenceCount > 0) {
                    monthlyAbsences[sheet.month.toUpperCase()] = absenceCount;
                }
            }
        });

        return monthlyAbsences;
    }, [selectedStudent, sf2Sheets, activeSchoolYear, selectedSectionObj, selectedSection]);

    const gradeData = useMemo(() => {
        if (!selectedStudent || !selectedSubject) return undefined;
        
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
            // Find class record with multiple fallback checks
            const record = classRecords.find(r => 
                r.student_lrn === selectedStudent.lrn && 
                r.school_year === activeSchoolYear &&
                Number(r.quarter) === term &&
                (r.subject_id === selectedSubjectObj?.id || r.subject_id === selectedSubject)
            ) || gradingSheetRecords.find(r => 
                r.student_lrn === selectedStudent.lrn && 
                r.school_year === activeSchoolYear &&
                Number(r.quarter) === term &&
                (r.subject_id === selectedSubjectObj?.id || r.subject_id === selectedSubject)
            );

            // Find HPS record
            const hpsRec = hpsRecords.find(r => 
                (r.subject_id === selectedSubjectObj?.id || r.subject_id === selectedSubject) && 
                r.school_year === activeSchoolYear && 
                Number(r.quarter) === term
            );

            // Normalize scores to LIR slot counts
            const normalize = (arr: (number | string)[] | undefined, count: number) => {
                const src = Array.isArray(arr) ? arr : [];
                return Array.from({ length: count }, (_, i) => src[i] ?? '');
            };

            const recordWithSummative = (record as unknown) as (Record<string, unknown> & { summative_tests?: (number | string)[] });
            const hpsWithSummative = (hpsRec as unknown) as (Record<string, unknown> & { summative_tests?: (number | string)[] });

            // Extract scores and ensure they are numbers or empty strings
            const clean = (val: unknown) => (val === '' || val === null || val === undefined) ? '' : (val as number | string);

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
                finalGrade: clean(record?.final_grade ?? '')
            };
        });
        return data;
    }, [selectedStudent, selectedSubject, selectedSubjectObj, classRecords, gradingSheetRecords, hpsRecords, activeSchoolYear]);

    return (
        <div className="lir-print-root flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white">
             {/* Sticky Premium Top Toolbar */}
             {/* Sticky Premium Top Toolbar */}
             <div className="z-20 bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm sticky top-0 print:hidden shrink-0 w-full">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30" />
                <div className="flex items-center justify-start w-full h-16 select-none relative px-3 lg:px-4 gap-2 lg:gap-3 overflow-x-auto scrollbar-none">
                    
                    {/* Identity & Context Branding (Left Most Edge) */}
                    <div className="flex items-center gap-2 lg:gap-3 shrink-0">
                        <button 
                            onClick={() => setCurrentView('school-forms')}
                            className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all group shrink-0 active:scale-95 duration-200"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex flex-col shrink-0">
                            <h2 className="text-[11px] lg:text-[12px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">Learner Record</h2>
                            <p className="text-[7.5px] font-black text-emerald-600 uppercase tracking-widest leading-none">Individual LIR</p>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-200 shrink-0 mx-0.5" />
                        
                    {/* Section Selector */}
                    <div className="relative group shrink-0">
                        <select 
                            className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-[120px] lg:min-w-[135px] duration-200"
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
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                    </div>

                    {/* Subject Selector */}
                    <div className="relative group shrink-0">
                        <select 
                            className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer min-w-[130px] lg:min-w-[145px] disabled:opacity-30 duration-200"
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
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                    </div>

                    {/* Learner Selector */}
                    <div className="relative group shrink-0">
                        <select 
                            className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-[140px] lg:min-w-[160px] max-w-[200px] truncate disabled:opacity-30 duration-200"
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
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                    </div>

                    <div className="h-6 w-px bg-slate-200 shrink-0 mx-0.5" />

                    {/* Paper Size selector */}
                    <div className="relative group shrink-0">
                        <select
                            value={paperSize}
                            onChange={(e) => setPaperSize(e.target.value as 'a4' | 'letter' | 'folio')}
                            className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer min-w-[70px] lg:min-w-[80px] duration-200"
                            title="Paper Size"
                        >
                            <option value="a4">A4</option>
                            <option value="letter">Letter</option>
                            <option value="folio">Folio</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                    </div>

                    <div className="h-6 w-px bg-slate-200 shrink-0 mx-0.5" />

                    {/* Branding Colors swatches */}
                    <div className="flex gap-1.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 h-9 shrink-0 items-center px-2">
                        <div className="relative flex items-center justify-center cursor-pointer shrink-0" title="Choose Fill Color">
                            <div className="w-5 h-5 rounded-lg border border-slate-200 shadow-sm shrink-0" style={{ backgroundColor: fillColor }} />
                            <input 
                                type="color" 
                                value={fillColor} 
                                onChange={(e) => setFillColor(e.target.value)}
                                className="w-5 h-5 opacity-0 absolute inset-0 cursor-pointer"
                            />
                        </div>
                        <div className="relative flex items-center justify-center cursor-pointer shrink-0" title="Choose Outline Color">
                            <div className="w-5 h-5 rounded-lg border border-slate-200 shadow-sm shrink-0" style={{ backgroundColor: outlineColor }} />
                            <input 
                                type="color" 
                                value={outlineColor} 
                                onChange={(e) => setOutlineColor(e.target.value)}
                                className="w-5 h-5 opacity-0 absolute inset-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-200 shrink-0 mx-0.5" />

                    {/* View Zoom */}
                    <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 h-9 shrink-0">
                        <button 
                            onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all active:scale-90 duration-200"
                            title="Zoom Out"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[9px] font-black text-slate-900 w-8 text-center tabular-nums">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button 
                            onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all active:scale-90 duration-200"
                            title="Zoom In"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-200 shrink-0 mx-0.5" />

                    {/* Print Button */}
                    <button
                        onClick={handlePrint}
                        disabled={!selectedStudent}
                        className="h-9 px-3.5 lg:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8.5px] uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200"
                    >
                        <Printer className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                        Print / PDF
                    </button>
                </div>
             </div>

             <div className="flex-1 overflow-auto relative bg-slate-100 print:bg-white custom-scrollbar">
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
                                <div className="absolute -inset-24 bg-emerald-500/5 blur-[120px] rounded-full" />
                                <div className="relative w-64 h-64 bg-white rounded-[5rem] border border-slate-200 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl">
                                    <FileText className="w-28 h-28 text-slate-100" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-7xl font-black text-slate-100 tracking-tighter leading-none italic">LIR</span>
                                        <div className="w-20 h-1 bg-emerald-500/10 rounded-full mt-4" />
                                    </div>
                                    <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 group-hover:rotate-12 transition-all duration-500">
                                        <Printer className="w-10 h-10 text-white" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Individual Record</h2>
                                <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60">
                                    Select a learner from the toolbar above to preview their individual record card.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
             </div>

             <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: ${paperSize === 'a4' ? '210mm 297mm' : paperSize === 'letter' ? '8.5in 11in' : '8.5in 13in'};
                        margin: 0 !important;
                    }
                    html, body {
                        width: ${paperSize === 'a4' ? '210mm' : '8.5in'} !important;
                        height: ${paperSize === 'a4' ? '297mm' : paperSize === 'letter' ? '11in' : '13in'} !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        background: #fff !important;
                    }
                    .lir-print-root {
                        display: block !important;
                        width: ${paperSize === 'a4' ? '210mm' : '8.5in'} !important;
                        height: ${paperSize === 'a4' ? '297mm' : paperSize === 'letter' ? '11in' : '13in'} !important;
                        background: #fff !important;
                    }
                    .lir-print-sheet {
                        width: ${paperSize === 'a4' ? '210mm' : '8.5in'} !important;
                        height: ${paperSize === 'a4' ? '297mm' : paperSize === 'letter' ? '11in' : '13in'} !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                }
             ` }} />
        </div>
    );
}
