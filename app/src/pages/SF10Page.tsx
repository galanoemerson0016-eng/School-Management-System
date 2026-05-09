import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../stores';
import { useAuthStore } from '../stores/auth-store';
import { useSF10Store } from '../stores/sf10-store';
import type { Student } from '../types';
import SF10SpecRenderer from '../components/SF10SpecRenderer';
import SF10JHSRenderer from '../components/SF10JHSRenderer';
import { mapStudentToSpecData } from '../utils/sf10Mapper';
import { ArrowLeft, Printer, FileText, Plus, Minus } from 'lucide-react';
import { canAccessSF9Section, filterSF9Sections } from '../lib/rbac';

export function SF10Page() {
    const { students, sections, subjects, gradingSheetRecords, teachers, schoolProfile, activeSchoolYear, setCurrentView } = useAppStore();
    const { user } = useAuthStore();
    const { overrides, setOverride } = useSF10Store();
    
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(1);

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

    const groupedSections = useMemo(() => {
        const groups: Record<string, any[]> = {
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

    // Auto-select section if only one is available
    useEffect(() => {
        if (!selectedSection && sortedSections.length === 1) {
            setSelectedSection(sortedSections[0].section_name);
        }
    }, [sortedSections, selectedSection]);

    const selectedSectionObj = useMemo(() => {
        return sections.find((s) => s.section_name === selectedSection || s.id === selectedSection);
    }, [sections, selectedSection]);

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
        const baseData = mapStudentToSpecData({
            student: selectedStudent,
            profile: schoolProfile,
            schoolYear: activeSchoolYear,
            sections,
            teachers,
            gradingSheetRecords,
            subjects,
        });
        
        // Helper to get a nested value from an object by dot path
        const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
            const parts = path.split('.');
            let curr: unknown = obj;
            for (const part of parts) {
                if (!curr || typeof curr !== 'object') return undefined;
                const rec = curr as Record<string, unknown>;
                if (part.includes('[')) {
                    const [p, rest] = part.split('[');
                    const idx = parseInt(rest.replace(']', ''));
                    const arr = rec[p];
                    curr = Array.isArray(arr) ? arr[idx] : undefined;
                } else {
                    curr = rec[part];
                }
            }
            return curr;
        };

        const mergedData = { ...baseData };
        Object.entries(currentOverrides).forEach(([path, value]) => {
            // Skip empty overrides for certification fields if base data already has a value
            if (path.startsWith('certification.') && (!value || value === '')) {
                const baseVal = getNestedValue(baseData as Record<string, unknown>, path);
                if (baseVal && typeof baseVal === 'string' && baseVal.trim() !== '') return;
            }

            const parts = path.split('.');
            let curr: Record<string, unknown> = mergedData as Record<string, unknown>;
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (part.includes('[')) {
                    const [p, rest] = part.split('[');
                    const idx = parseInt(rest.replace(']', ''));
                    const arr = (curr[p] as unknown[]) || [];
                    if (!arr[idx]) arr[idx] = {};
                    curr[p] = arr;
                    curr = (arr[idx] as Record<string, unknown>) || {};
                } else {
                    if (!curr[part]) curr[part] = {};
                    curr = curr[part] as Record<string, unknown>;
                }
            }
            const lastPart = parts[parts.length - 1];
            curr[lastPart] = value;
        });
        return mergedData;
    }, [selectedStudent, schoolProfile, activeSchoolYear, sections, teachers, gradingSheetRecords, subjects, overrides, studentKey, currentPage]);

    const handleCellUpdate = (path: string, value: string) => {
        if (!selectedStudent) return;
        // Allow certification fields to always be editable
        const isCertPath = path.startsWith('certification.');
        if (!isCertPath && !canEditCurrentSection) return;
        setOverride(selectedStudent.lrn, `page_${currentPage}`, path, value);
    };

    return (
        <div className="sf10-print-root flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white">
             {/* Sticky Premium Top Toolbar */}
             <div className="h-24 px-8 flex items-center justify-between z-[100] bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm relative print:hidden shrink-0">
                <div className="flex items-center gap-8">
                    {/* Brand/Back Hook */}
                    <div className="flex items-center gap-5">
                        <button 
                            onClick={() => setCurrentView('school-forms')}
                            className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all group"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">SF10 Record</h2>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Permanent Record</p>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2" />

                    {/* Learner & Section Selector */}
                    <div className="flex items-center gap-4">
                        {sortedSections.length > 1 && (
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Section</span>
                                <select 
                                    className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2 text-[12px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
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
                            </div>
                        )}

                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Learner Database</span>
                            <select 
                                className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2 text-[12px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer min-w-[240px] disabled:opacity-30"
                                value={selectedStudent?.lrn || ''}
                                onChange={(e) => setSelectedStudent(students.find(s => s.lrn === e.target.value) || null)}
                                disabled={!selectedSection}
                            >
                                <option value="">Select Student</option>
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
                        </div>

                        {/* Page Toggles */}
                        <div className="flex flex-col ml-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Record Page</span>
                            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    className={`px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === 1 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Page 1
                                </button>
                                <button
                                    onClick={() => setCurrentPage(2)}
                                    className={`px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === 2 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Page 2
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Zoom Control */}
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">View Zoom</span>
                        <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            <button 
                                onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-[11px] font-black text-slate-900 w-12 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button 
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-slate-200" />

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrintSF10}
                            disabled={!selectedStudent}
                            className="h-14 px-8 rounded-2.5xl bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-3 group"
                        >
                            <Printer className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                            Print / PDF
                        </button>
                    </div>
                </div>
             </div>

             {/* Workspace Container */}
             <div className="flex-1 overflow-auto relative bg-slate-100 print:bg-white custom-scrollbar">
                <div className="w-full min-h-full flex flex-col items-center justify-start py-20 px-10 relative print:overflow-visible print:py-0 print:px-0">
                    {selectedStudent && specData ? (
                        <div 
                            className="transition-all duration-700 ease-out origin-top print:scale-100"
                            style={{ transform: `scale(${zoom})` }}
                        >
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                                <div className={`sf10-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none ${currentPage === 1 ? 'sf10-force-single-page' : ''}`}>
                                    {specData.isES ? (
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
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10">
                            <div className="relative group">
                                <div className="absolute -inset-24 bg-blue-500/5 blur-[120px] rounded-full" />
                                <div className="relative w-64 h-64 bg-white rounded-[5rem] border border-slate-200 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl">
                                    <FileText className="w-28 h-28 text-slate-100" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-7xl font-black text-slate-100 tracking-tighter leading-none italic">SF10</span>
                                        <div className="w-20 h-1 bg-blue-500/10 rounded-full mt-4" />
                                    </div>
                                    <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 group-hover:rotate-12 transition-all duration-500">
                                        <Printer className="w-10 h-10 text-white" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Permanent Record</h2>
                                <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60">
                                    Select a learner from the toolbar above to preview and edit their academic profile.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
             </div>

             <style dangerouslySetInnerHTML={{ __html: `
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
             ` }} />
        </div>
    );
}
