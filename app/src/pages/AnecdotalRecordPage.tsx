import { useState, useMemo, useEffect } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { Printer, Save, Trash2, ArrowLeft, Sparkles } from 'lucide-react';

interface AnecdotalData {
    address: string;
    parentGuardian: string;
    contactNumber: string;
    observationDate: string;
    observationTime: string;
    observationLocation: string;
    narrativeDescription: string;
    actionTaken: string;
    recommendations: string;
}

const initialData = (): AnecdotalData => ({
    address: '',
    parentGuardian: '',
    contactNumber: '',
    observationDate: '',
    observationTime: '',
    observationLocation: '',
    narrativeDescription: '',
    actionTaken: '',
    recommendations: '',
});

export function AnecdotalRecordPage() {
    const { students, sections, schoolProfile, activeSchoolYear, setCurrentView, showNotification } = useAppStore();
    const { user } = useAuthStore();

    const [selectedSection, setSelectedSection] = useState('');
    const [selectedStudentLrn, setSelectedStudentLrn] = useState('');
    const [formData, setFormData] = useState<AnecdotalData>(initialData());
    const [pageSize, setPageSize] = useState<'letter' | 'a4' | 'folio'>('folio');

    // Dynamic dimensions based on pageSize
    const dimensions = useMemo(() => {
        switch (pageSize) {
            case 'letter':
                return { width: '816px', minHeight: '1056px' };
            case 'a4':
                return { width: '794px', minHeight: '1122px' };
            case 'folio':
            default:
                return { width: '816px', minHeight: '1248px' };
        }
    }, [pageSize]);

    const mainSpacingClass = useMemo(() => {
        switch (pageSize) {
            case 'letter':
                return 'space-y-3';
            case 'a4':
                return 'space-y-4';
            case 'folio':
            default:
                return 'space-y-6';
        }
    }, [pageSize]);

    const sectionSpacingClass = useMemo(() => {
        switch (pageSize) {
            case 'letter':
                return 'space-y-2';
            case 'a4':
                return 'space-y-2.5';
            case 'folio':
            default:
                return 'space-y-3';
        }
    }, [pageSize]);

    const rowConfig = useMemo(() => {
        switch (pageSize) {
            case 'letter':
                return { narrative: 3, action: 2, recommendations: 2 };
            case 'a4':
                return { narrative: 3, action: 3, recommendations: 2 };
            case 'folio':
            default:
                return { narrative: 4, action: 3, recommendations: 3 };
        }
    }, [pageSize]);

    const paddingClass = useMemo(() => {
        switch (pageSize) {
            case 'letter':
                return 'p-5 md:p-6';
            case 'a4':
                return 'p-6 md:p-8';
            case 'folio':
            default:
                return 'p-6 md:p-10';
        }
    }, [pageSize]);

    const getPageSizeCSS = () => {
        switch (pageSize) {
            case 'letter':
                return 'size: 8.5in 11in;';
            case 'a4':
                return 'size: 8.27in 11.69in;';
            case 'folio':
            default:
                return 'size: 8.5in 13in;';
        }
    };

    const getPrintDimensionsCSS = () => {
        switch (pageSize) {
            case 'letter':
                return `
                    width: 8.5in !important;
                    height: 11in !important;
                    padding: 0.4in !important;
                `;
            case 'a4':
                return `
                    width: 8.27in !important;
                    height: 11.69in !important;
                    padding: 0.4in !important;
                `;
            case 'folio':
            default:
                return `
                    width: 8.5in !important;
                    height: 13in !important;
                    padding: 0.5in !important;
                `;
        }
    };

    // Get adviser name
    const teacherName = useMemo(() => {
        if (user?.email?.includes('galanoemerson') || user?.displayName?.toLowerCase().includes('emerson')) {
            return "EMERSON M. GALANO";
        }
        const currentSectionObj = sections.find(s => s.section_name === selectedSection);
        if (currentSectionObj?.adviser_name) {
            return currentSectionObj.adviser_name.toUpperCase();
        }
        return (schoolProfile?.adviser_name || user?.displayName || '').toUpperCase();
    }, [selectedSection, sections, schoolProfile, user]);

    // Roster and Student selectors
    const sortedSections = useMemo(() => {
        return [...sections].sort((a, b) => {
            const numA = parseInt(a.section_grade_level.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.section_grade_level.replace(/\D/g, '')) || 0;
            if (numA !== numB) return numA - numB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections]);

    const filteredStudents = useMemo(() => {
        if (!selectedSection) return [];
        const sectionObj = sections.find(s => s.section_name === selectedSection);
        return students
            .filter(s => s.student_section === selectedSection || (sectionObj && s.student_section === sectionObj.id))
            .sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`));
    }, [selectedSection, students, sections]);

    const activeStudent = useMemo(() => {
        return students.find(s => s.lrn === selectedStudentLrn);
    }, [students, selectedStudentLrn]);

    // Age calculation
    const calculatedAge = useMemo(() => {
        if (!activeStudent?.birthday) return '';
        try {
            const birthDate = new Date(activeStudent.birthday);
            if (isNaN(birthDate.getTime())) return '';
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age > 0 ? String(age) : '';
        } catch {
            return '';
        }
    }, [activeStudent]);

    const studentName = useMemo(() => {
        if (!activeStudent) return '';
        return `${activeStudent.last_name}, ${activeStudent.first_name} ${activeStudent.middle_name || ''}`.trim().toUpperCase();
    }, [activeStudent]);

    const gradeSection = useMemo(() => {
        const lvl = sections.find(s => s.section_name === selectedSection)?.section_grade_level || '';
        if (!lvl && !selectedSection) return '';
        return `${lvl} - ${selectedSection}`.trim().toUpperCase();
    }, [sections, selectedSection]);

    // Dynamic Font sizing for long student names
    const getNameFontSize = (nameStr: string) => {
        if (nameStr.length > 25) return 'text-[11px]';
        if (nameStr.length > 18) return 'text-[13px]';
        return 'text-[15px]';
    };

    // Load saved anecdotal record whenever LRN changes
    useEffect(() => {
        let active = true;
        const timer = setTimeout(() => {
            if (!selectedStudentLrn) {
                if (active) setFormData(initialData());
                return;
            }
            try {
                const key = `formease_anecdotal_${selectedStudentLrn}`;
                const raw = localStorage.getItem(key);
                if (raw) {
                    if (active) setFormData(JSON.parse(raw));
                } else {
                    // Auto-populate from student schema if fresh
                    const base = initialData();
                    base.parentGuardian = activeStudent?.parent_name || activeStudent?.guardian_name || '';
                    base.contactNumber = activeStudent?.contact_number || '';
                    base.address = activeStudent?.address || '';
                    if (active) setFormData(base);
                }
            } catch {
                if (active) setFormData(initialData());
            }
        }, 0);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [selectedStudentLrn, activeStudent]);

    const handleSave = () => {
        if (!selectedStudentLrn) {
            showNotification('Please select a student first.', 'error');
            return;
        }
        try {
            const key = `formease_anecdotal_${selectedStudentLrn}`;
            localStorage.setItem(key, JSON.stringify(formData));
            showNotification('Anecdotal Record saved successfully!', 'success');
        } catch {
            showNotification('Failed to save record.', 'error');
        }
    };

    const handleDelete = () => {
        if (!selectedStudentLrn) return;
        if (!confirm('Are you sure you want to delete this anecdotal record?')) return;
        try {
            const key = `formease_anecdotal_${selectedStudentLrn}`;
            localStorage.removeItem(key);
            setFormData(initialData());
            showNotification('Anecdotal Record cleared.', 'success');
        } catch {
            showNotification('Failed to delete record.', 'error');
        }
    };

    const handlePrint = () => {
        if (!selectedStudentLrn) {
            showNotification('Please select a student first.', 'error');
            return;
        }
        const originalTitle = document.title;
        const studentName = activeStudent ? `${activeStudent.last_name}_${activeStudent.first_name}` : 'Student';
        document.title = `Anecdotal_Record_${studentName}`;
        window.print();
        document.title = originalTitle;
    };

    // Helper to render horizontal notebook ruled lines in textareas
    const renderRuledLines = (value: string, placeholder: string, onChange: (val: string) => void, lineColor: string, rows: number = 3) => {
        return (
            <div className="relative w-full flex flex-col py-1 print:py-0">
                <textarea
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    rows={rows}
                    className="w-full bg-transparent border-none outline-none resize-none font-bold text-slate-800 text-[13px] leading-[26px] relative z-10 focus:ring-0 p-0 text-left placeholder:text-slate-400/60 print:placeholder:text-transparent print:overflow-hidden print:leading-[26px]"
                    style={{
                        background: `repeating-linear-gradient(transparent, transparent 25px, ${lineColor} 25px, ${lineColor} 26px)`,
                        paddingTop: '2px',
                    }}
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden print:h-auto print:overflow-visible print:bg-white anecdotal-formal-theme">
            
            {/* STICKY TOOLBAR */}
            <div className="z-20 bg-white border-b border-slate-200 shadow-sm relative print:hidden shrink-0 w-full">
                {/* Top accent bar */}
                <div className="h-[3px] w-full" style={{ background: 'linear-gradient(to right, #ff7043, #2196f3, #7e57c2)' }} />

                <div className="px-4 py-2.5 flex items-center justify-between gap-3">

                    {/* LEFT: Back + App identity */}
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => setCurrentView('school-forms')}
                            className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all active:scale-95"
                            title="Back to Forms"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#1565C0] to-[#7B1FA2] flex items-center justify-center shadow-md shrink-0">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="leading-none">
                                <p className="text-[13px] font-black text-slate-800 tracking-tight">Anecdotal Record</p>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Learner Behavior Log</p>
                            </div>
                        </div>
                    </div>

                    {/* CENTER / RIGHT: Controls */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">

                        {/* Section selector */}
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Section</label>
                            <select
                                value={selectedSection}
                                onChange={(e) => {
                                    setSelectedSection(e.target.value);
                                    setSelectedStudentLrn('');
                                }}
                                className="h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[11px] font-bold text-slate-800 cursor-pointer outline-none hover:border-blue-400 focus:border-blue-500 focus:bg-white transition-all w-[145px]"
                            >
                                <option value="">— Select Section —</option>
                                {sortedSections.map(s => (
                                    <option key={s.id} value={s.section_name}>
                                        {s.section_grade_level} – {s.section_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Learner selector */}
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Learner</label>
                            <select
                                value={selectedStudentLrn}
                                onChange={(e) => setSelectedStudentLrn(e.target.value)}
                                disabled={!selectedSection}
                                className="h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[11px] font-bold text-slate-800 cursor-pointer outline-none hover:border-blue-400 focus:border-blue-500 focus:bg-white transition-all w-[210px] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <option value="">— Select Learner —</option>
                                {filteredStudents.map(s => (
                                    <option key={s.lrn} value={s.lrn}>{s.last_name}, {s.first_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Page size selector */}
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Paper Size</label>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(e.target.value as 'letter' | 'a4' | 'folio')}
                                className="h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[11px] font-bold text-slate-800 cursor-pointer outline-none hover:border-blue-400 focus:border-blue-500 focus:bg-white transition-all w-[110px]"
                            >
                                <option value="letter">Letter (8.5×11)</option>
                                <option value="a4">A4 (8.27×11.7)</option>
                                <option value="folio">Folio (8.5×13)</option>
                            </select>
                        </div>

                        {/* Action buttons — only when student selected */}
                        {selectedStudentLrn && (
                            <div className="flex items-end gap-2 pb-0.5 mt-4">
                                <button
                                    onClick={handleSave}
                                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-wide rounded-xl shadow transition-all flex items-center gap-1.5 active:scale-95"
                                >
                                    <Save className="w-3.5 h-3.5" /> Save
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="h-9 w-9 bg-rose-50 border border-rose-200 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-xl flex items-center justify-center transition-all active:scale-95"
                                    title="Clear Record"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="h-9 px-4 bg-linear-to-r from-[#1565C0] to-[#7B1FA2] hover:opacity-90 text-white font-bold text-[11px] uppercase tracking-wide rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                                >
                                    <Printer className="w-3.5 h-3.5" /> Print
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN PORTAL AREA */}
            <div className="flex-1 overflow-auto bg-slate-100 print:bg-white print:overflow-visible custom-scrollbar py-6 print:py-0">
                {!selectedStudentLrn ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
                        {/* Background gradient blobs */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
                            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-300/10 rounded-full blur-3xl" />
                        </div>

                        {/* Main card */}
                        <div className="relative z-10 w-full max-w-xl">
                            <div className="bg-white/70 backdrop-blur-xl rounded-4xl border border-white shadow-2xl shadow-blue-900/10 overflow-hidden">
                                
                                {/* Card header with gradient */}
                                <div className="bg-linear-to-r from-[#1565C0] via-[#1976D2] to-[#7B1FA2] px-8 py-6">
                                    {/* Logos row */}
                                    <div className="flex items-center justify-between mb-5">
                                        <img
                                            src={`${import.meta.env.BASE_URL}deped_logo_left.png`}
                                            alt="DepEd Logo"
                                            className="w-14 h-14 object-contain drop-shadow-lg"
                                        />
                                        <div className="text-center flex-1 px-3">
                                            <h1 className="text-xl font-black text-white uppercase tracking-widest leading-none drop-shadow">
                                                Anecdotal Record
                                            </h1>
                                            <p className="text-blue-200 text-[11px] font-semibold tracking-wider mt-1 uppercase">
                                                {schoolProfile?.name || 'Matatag High School'}
                                            </p>
                                        </div>
                                        <img
                                            src={schoolProfile?.logo_url || `${import.meta.env.BASE_URL}school-logo.png`}
                                            alt="School Logo"
                                            className="w-14 h-14 object-contain drop-shadow-lg"
                                        />
                                    </div>

                                    {/* Dashed divider */}
                                    <div className="border-t-2 border-dashed border-blue-300/50" />
                                </div>

                                {/* Card body */}
                                <div className="px-8 py-7 space-y-5">
                                    <div className="text-center space-y-1">
                                        <p className="text-slate-400 text-[12px] font-semibold uppercase tracking-widest">Getting Started</p>
                                        <p className="text-slate-700 font-bold text-sm leading-snug">
                                            Select a section and learner from the toolbar above to load or create an anecdotal record.
                                        </p>
                                    </div>

                                    {/* Steps */}
                                    <div className="space-y-3">
                                        {[
                                            { step: '1', color: 'bg-blue-600', label: 'Choose a Section', desc: 'Pick the grade & section from the first dropdown.' },
                                            { step: '2', color: 'bg-purple-600', label: 'Select a Learner', desc: 'Then pick the student whose record you need.' },
                                            { step: '3', color: 'bg-emerald-600', label: 'Fill & Print', desc: 'Complete the form and print a single-page record.' },
                                        ].map(({ step, color, label, desc }) => (
                                            <div key={step} className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                <div className={`w-8 h-8 ${color} text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0`}>
                                                    {step}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 text-[13px]">{label}</p>
                                                    <p className="text-slate-400 text-[11px] font-medium leading-snug">{desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Card footer */}
                                <div className="px-8 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                                    <span className="text-slate-400 text-[11px] font-semibold ml-1">Waiting for learner selection…</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex justify-center print:block print:p-0">
                        {/* THE ANECDOTAL SHEET CONTAINER */}
                        <div
                            id="anecdotal-print-sheet"
                            className={`bg-[#fafbfc] mx-auto shadow-2xl print:shadow-none border border-slate-300 print:border-none ${paddingClass} rounded-[30px] max-w-full relative flex flex-col justify-between transition-all duration-300 select-text`}
                            style={{ 
                                width: dimensions.width,
                                minHeight: dimensions.minHeight,
                                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.12), inset 0 0 2px 2px rgba(255,255,255,0.7)',
                            }}
                        >
                            {/* DYNAMIC HEADER */}
                            <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
                                {/* Left Header: DepEd Left Logo Image */}
                                <div className="w-16 h-16 md:w-20 md:h-20 print:w-14 print:h-14 shrink-0 select-none print:opacity-100 flex items-center justify-center">
                                    <img
                                        src={`${import.meta.env.BASE_URL}deped_logo_left.png`}
                                        alt="DepEd Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                {/* Header Center Title Text */}
                                <div className="text-center flex-1">
                                    <h1 className="text-3xl md:text-4.5xl font-black uppercase tracking-tight text-center leading-none select-none">
                                        <span className="bg-linear-to-r from-[#ff7043] to-[#2196f3] bg-clip-text text-transparent mr-2 font-black">ANECDOTAL</span>
                                        <span className="bg-linear-to-r from-[#2196f3] to-[#7e57c2] bg-clip-text text-transparent font-black">RECORD</span>
                                    </h1>
                                    <p className="text-[12px] font-bold text-slate-800 dark:text-slate-800 tracking-wider uppercase mt-2 font-sans">
                                        {schoolProfile?.name || 'MATATAG HIGH SCHOOL'} • S.Y. {activeSchoolYear || '2026-2027'}
                                    </p>
                                </div>

                                {/* Right Header: School Logo Image */}
                                <div className="w-16 h-16 md:w-20 md:h-20 print:w-14 print:h-14 shrink-0 select-none print:opacity-100 flex items-center justify-center">
                                    <img
                                        src={schoolProfile.logo_url || `${import.meta.env.BASE_URL}school-logo.png`}
                                        alt="School Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>

                            {/* FIRST HORIZONTAL DIVIDER - Blue dashed line */}
                            <div className={`border-b-4 border-dashed border-[#1565c0] w-full pointer-events-none select-none ${pageSize === 'letter' ? 'mb-3' : pageSize === 'a4' ? 'mb-4' : 'mb-6'}`} />

                            {/* BODY CONTENT SECTIONS */}
                            <div className={`text-black text-[13px] flex-1 font-sans ${mainSpacingClass}`}>
                                
                                {/* I. LEARNER PROFILE */}
                                <div className="border border-[#1565c0]/30 rounded-xl bg-white p-4 print:p-3 shadow-sm relative">
                                    <div className="absolute top-[-12px] left-4 text-[11px] font-black px-4 py-0.5 uppercase tracking-wider flex items-center bg-[#1565c0] text-white rounded-md select-none">
                                        I LEARNER PROFILE
                                    </div>
                                    
                                    <div className="flex flex-col md:flex-row items-center gap-4 mt-3">
                                        {/* Left Side fields */}
                                        <div className={`flex-1 w-full relative z-10 min-w-0 ${sectionSpacingClass}`}>
                                            {/* Row 1: Name */}
                                            <div className="flex items-end w-full">
                                                <span className="font-bold text-slate-500 mr-2 shrink-0">Name of Student:</span>
                                                <div className={`border-b border-[#90caf9] flex-1 font-black text-slate-800 uppercase pb-0.5 tracking-wide text-left truncate ${getNameFontSize(studentName || 'AGUSTIN, DONNA BELLE GABRIEL')}`}>
                                                    {studentName || 'AGUSTIN, DONNA BELLE GABRIEL'}
                                                </div>
                                            </div>

                                            {/* Row 2: LRN, Age, Sex */}
                                            <div className="flex flex-col sm:flex-row gap-x-4 gap-y-3 w-full print:flex-row print:gap-y-0 print:gap-x-4">
                                                <div className="flex items-end flex-2 min-w-0">
                                                    <span className="font-bold text-slate-500 mr-2 shrink-0">LRN:</span>
                                                    <div className="border-b border-[#90caf9] flex-1 font-bold text-slate-800 pb-0.5 tracking-wide text-left">
                                                        {activeStudent?.lrn || '106781180009'}
                                                    </div>
                                                </div>
                                                <div className="flex items-end flex-1 min-w-0">
                                                    <span className="font-bold text-slate-500 mr-2 shrink-0">Age:</span>
                                                    <div className="border-b border-[#90caf9] flex-1 font-bold text-slate-800 pb-0.5 text-left">
                                                        {calculatedAge || '13'}
                                                    </div>
                                                </div>
                                                <div className="flex items-end flex-1 min-w-0">
                                                    <span className="font-bold text-slate-500 mr-2 shrink-0">Sex:</span>
                                                    <div className="border-b border-[#90caf9] flex-1 font-bold text-slate-800 uppercase pb-0.5 text-left">
                                                        {activeStudent?.gender || 'FEMALE'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row 3: Grade & Section */}
                                            <div className="flex items-end w-full">
                                                <span className="font-bold text-slate-500 mr-2 shrink-0">Grade & Section:</span>
                                                <div className="border-b border-[#90caf9] flex-1 font-bold text-slate-800 uppercase pb-0.5 tracking-wide text-left">
                                                    {selectedSection ? gradeSection : 'GRADE 7 - EINSTEIN'}
                                                </div>
                                            </div>

                                            {/* Row 4: Address */}
                                            <div className="flex items-end w-full">
                                                <span className="font-bold text-slate-500 mr-2 shrink-0">Address:</span>
                                                <input
                                                    type="text"
                                                    value={formData.address}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                                    placeholder="BALINGOG EAST, GUIMBA, NUEVA ECIJA"
                                                    className="border-0 border-b border-[#90caf9] outline-none flex-1 font-bold text-slate-800 pb-0.5 p-0 bg-transparent text-left placeholder:text-slate-400 print:placeholder:text-transparent"
                                                />
                                            </div>

                                            {/* Row 5: Parent/ Guardian */}
                                            <div className="flex items-end w-full">
                                                <span className="font-bold text-slate-500 mr-2 shrink-0">Parent/ Guardian:</span>
                                                <input
                                                    type="text"
                                                    value={formData.parentGuardian}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, parentGuardian: e.target.value }))}
                                                    placeholder="[ENTER PARENT OR GUARDIAN NAME...]"
                                                    className="border-0 border-b border-[#90caf9] outline-none flex-1 font-bold text-slate-800 pb-0.5 p-0 bg-transparent text-left uppercase placeholder:text-slate-400/60 print:placeholder:text-transparent"
                                                />
                                            </div>

                                            {/* Row 6: Contact Number */}
                                            <div className="flex items-end w-full">
                                                <span className="font-bold text-slate-500 mr-2 shrink-0">Contact Number:</span>
                                                <input
                                                    type="text"
                                                    value={formData.contactNumber}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                                                    placeholder="[Enter contact number...]"
                                                    className="border-0 border-b border-[#90caf9] outline-none flex-1 font-bold text-slate-800 pb-0.5 p-0 bg-transparent text-left placeholder:text-slate-400/60 print:placeholder:text-transparent"
                                                />
                                            </div>
                                        </div>

                                        {/* Right Side ID Badge Silhouette SVG Icon (Two-Tone Sky Blue) */}
                                        <div className="w-20 h-20 shrink-0 select-none print:opacity-100 hidden md:flex print:flex items-center justify-center self-center">
                                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                                <rect x="15" y="20" width="70" height="60" fill="#E3F2FD" rx="8" stroke="#1565C0" strokeWidth="2.5" />
                                                <rect x="42" y="12" width="16" height="5" fill="none" stroke="#1565C0" strokeWidth="2" rx="1.5" />
                                                <circle cx="36" cy="46" r="8" fill="none" stroke="#1565C0" strokeWidth="2.5" />
                                                <path d="M 23 64 C 23 57, 49 57, 49 64" fill="none" stroke="#1565C0" strokeWidth="2.5" strokeLinecap="round" />
                                                <line x1="58" y1="38" x2="74" y2="38" stroke="#1565C0" strokeWidth="2.5" strokeLinecap="round" />
                                                <line x1="58" y1="48" x2="70" y2="48" stroke="#1565C0" strokeWidth="2.5" strokeLinecap="round" />
                                                <line x1="58" y1="58" x2="74" y2="58" stroke="#1565C0" strokeWidth="2.5" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* II. OBSERVATION DETAILS */}
                                <div className="border border-[#2e7d32]/30 rounded-xl bg-white p-4 print:p-3 shadow-sm relative">
                                    <div className="absolute top-[-12px] left-4 text-[11px] font-black px-4 py-0.5 uppercase tracking-wider flex items-center bg-[#2e7d32] text-white rounded-md select-none">
                                        II OBSERVATION DETAILS
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center gap-4 mt-3">
                                        {/* Left Side fields */}
                                        <div className={`flex-1 w-full relative z-10 min-w-0 ${sectionSpacingClass}`}>
                                            {/* Row 1: Observer/ Adviser */}
                                            <div className="flex items-end w-full">
                                                <span className="font-bold text-slate-500 mr-2 shrink-0">Observer/ Adviser:</span>
                                                <div className="border-b border-[#81c784] flex-1 font-bold text-slate-800 uppercase pb-0.5 tracking-wide text-left truncate">
                                                    {teacherName || 'EMERSON M. GALANO'}
                                                </div>
                                            </div>

                                            {/* Row 2: Date of Observation + Time */}
                                            <div className="flex flex-col sm:flex-row gap-x-4 gap-y-3 w-full print:flex-row print:gap-y-0 print:gap-x-4">
                                                <div className="flex items-end flex-1.5 min-w-0">
                                                    <span className="font-bold text-slate-500 mr-2 shrink-0">Date of Observation:</span>
                                                    <input
                                                        type="text"
                                                        value={formData.observationDate}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, observationDate: e.target.value }))}
                                                        placeholder="[Enter observation date...]"
                                                        className="border-0 border-b border-[#81c784] outline-none flex-1 font-bold text-slate-800 pb-0.5 p-0 bg-transparent text-left placeholder:text-slate-400/60 print:placeholder:text-transparent"
                                                    />
                                                </div>
                                                <div className="flex items-end flex-1 min-w-0">
                                                    <span className="font-bold text-slate-500 mr-2 shrink-0">Time:</span>
                                                    <input
                                                        type="text"
                                                        value={formData.observationTime}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, observationTime: e.target.value }))}
                                                        placeholder="[Enter time...]"
                                                        className="border-0 border-b border-[#81c784] outline-none flex-1 font-bold text-slate-800 pb-0.5 p-0 bg-transparent text-left placeholder:text-slate-400/60 print:placeholder:text-transparent"
                                                    />
                                                </div>
                                            </div>

                                            {/* Row 3: Location/ Setting */}
                                            <div className="flex items-end w-full">
                                                <span className="font-bold text-slate-500 mr-2 shrink-0">Location/ Setting:</span>
                                                <input
                                                    type="text"
                                                    value={formData.observationLocation}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, observationLocation: e.target.value }))}
                                                    placeholder="[Enter location (e.g. Classroom, Playground)...]"
                                                    className="border-0 border-b border-[#81c784] outline-none flex-1 font-bold text-slate-800 pb-0.5 p-0 bg-transparent text-left placeholder:text-slate-400/60 print:placeholder:text-transparent"
                                                />
                                            </div>
                                        </div>

                                        {/* Right Side Magnifying glass SVG Icon (Two-Tone Sky Blue) */}
                                        <div className="w-20 h-20 shrink-0 select-none print:opacity-100 hidden md:flex print:flex items-center justify-center self-center">
                                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                                <circle cx="44" cy="44" r="24" fill="#E3F2FD" stroke="#1565C0" strokeWidth="2.5" />
                                                <path d="M 28 52 L 36 41 L 44 46 L 56 32" fill="none" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx="56" cy="32" r="2" fill="#1565C0" />
                                                <path d="M 32 28 A 18 18 0 0 1 54 28" fill="none" stroke="#90CAF9" strokeWidth="1.5" strokeLinecap="round" />
                                                <line x1="61" y1="61" x2="84" y2="84" stroke="#1565C0" strokeWidth="6" strokeLinecap="round" />
                                                <line x1="64" y1="64" x2="75" y2="75" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* III. NARRATIVE DESCRIPTION */}
                                <div className="border border-[#6a1b9a]/30 rounded-xl bg-white p-4 print:p-3 shadow-sm relative">
                                    <div className="absolute top-[-12px] left-4 text-[11px] font-black px-4 py-0.5 uppercase tracking-wider flex items-center bg-[#6a1b9a] text-white rounded-md select-none">
                                        III NARRATIVE DESCRIPTION
                                    </div>

                                    <p className="text-[11px] text-purple-700 font-bold leading-normal mt-3 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100 select-none print:hidden">
                                        (Describe the specific incident or behavior observed using factual, objective language. Focus on what was seen and heard without interpretation.)
                                    </p>

                                    <div className="flex items-start gap-4 mt-3">
                                        <div className="flex-1">
                                            {renderRuledLines(
                                                formData.narrativeDescription,
                                                "Write significant classroom narrative descriptions here...",
                                                (val) => setFormData(prev => ({ ...prev, narrativeDescription: val })),
                                                "#d1c4e9",
                                                rowConfig.narrative
                                            )}
                                        </div>

                                        {/* Right Side hand writing on paper SVG Icon (Two-Tone Sky Blue) */}
                                        <div className="w-20 h-20 shrink-0 select-none print:opacity-100 hidden md:flex print:flex items-center justify-center self-center">
                                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                                <rect x="25" y="15" width="55" height="70" fill="#E3F2FD" rx="6" stroke="#1565C0" strokeWidth="2.5" />
                                                <line x1="36" y1="30" x2="68" y2="30" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
                                                <line x1="36" y1="40" x2="68" y2="40" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
                                                <line x1="36" y1="50" x2="58" y2="50" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
                                                <line x1="36" y1="60" x2="50" y2="60" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
                                                <g transform="translate(6, 6) rotate(-15 60 60)">
                                                    <rect x="52" y="22" width="5" height="36" fill="#1565C0" rx="1.5" />
                                                    <polygon points="52,58 54.5,65 57,58" fill="#E3F2FD" stroke="#1565C0" strokeWidth="1.5" />
                                                    <path d="M 28 65 Q 40 50, 54 56 L 48 70 Z" fill="#90CAF9" stroke="#1565C0" strokeWidth="1.5" />
                                                </g>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* IV. ACTION TAKEN / INTERVENTION */}
                                <div className="border border-[#e65100]/30 rounded-xl bg-white p-4 print:p-3 shadow-sm relative">
                                    <div className="absolute top-[-12px] left-4 text-[11px] font-black px-4 py-0.5 uppercase tracking-wider flex items-center bg-[#e65100] text-white rounded-md select-none">
                                        IV ACTION TAKEN / INTERVENTION
                                    </div>

                                    <p className="text-[11px] text-orange-700 font-bold leading-normal mt-3 bg-orange-50/50 p-2.5 rounded-lg border border-orange-100 select-none print:hidden">
                                        (Immediate steps taken by the teacher or adviser to address the behavior or incident.)
                                    </p>

                                    <div className="flex items-start gap-4 mt-3">
                                        <div className="flex-1">
                                            {renderRuledLines(
                                                formData.actionTaken,
                                                "Write classroom action taken or intervention records here...",
                                                (val) => setFormData(prev => ({ ...prev, actionTaken: val })),
                                                "#ffe0b2",
                                                rowConfig.action
                                            )}
                                        </div>

                                        {/* Right Side clipboard target checkmark SVG Icon (Two-Tone Sky Blue) */}
                                        <div className="w-20 h-20 shrink-0 select-none print:opacity-100 hidden md:flex print:flex items-center justify-center self-center">
                                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                                <rect x="25" y="20" width="50" height="65" fill="#E3F2FD" rx="6" stroke="#1565C0" strokeWidth="2.5" />
                                                <path d="M 38 20 L 38 14 C 38 12, 62 12, 62 14 L 62 20" fill="#90CAF9" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx="50" cy="45" r="14" fill="none" stroke="#1565C0" strokeWidth="2" strokeDasharray="3 2" />
                                                <circle cx="50" cy="45" r="8" fill="none" stroke="#1565C0" strokeWidth="2" />
                                                <circle cx="50" cy="45" r="2" fill="#1565C0" />
                                                <path d="M 38 68 L 46 75 L 64 57" fill="none" stroke="#1565C0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* V. RECOMMENDATIONS / NOTES */}
                                <div className="border border-[#c62828]/30 rounded-xl bg-white p-4 print:p-3 shadow-sm relative">
                                    <div className="absolute top-[-12px] left-4 text-[11px] font-black px-4 py-0.5 uppercase tracking-wider flex items-center bg-[#c62828] text-white rounded-md select-none">
                                        V RECOMMENDATIONS / NOTES
                                    </div>

                                    <p className="text-[11px] text-red-700 font-bold leading-normal mt-3 bg-red-50/50 p-2.5 rounded-lg border border-red-100 select-none print:hidden">
                                        (Long-term suggestions or referrals for guidance counseling if the behavior persists.)
                                    </p>

                                    <div className="flex items-start gap-4 mt-3">
                                        <div className="flex-1">
                                            {renderRuledLines(
                                                formData.recommendations,
                                                "Write recommendations or guidance logs here...",
                                                (val) => setFormData(prev => ({ ...prev, recommendations: val })),
                                                "#ffcdd2",
                                                rowConfig.recommendations
                                            )}
                                        </div>

                                        {/* Right Side red lightbulb vector icon (Two-Tone Sky Blue) */}
                                        <div className="w-20 h-20 shrink-0 select-none print:opacity-100 hidden md:flex print:flex items-center justify-center self-center">
                                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                                <path d="M 50 16 C 36 16, 30 26, 30 41 C 30 51, 39 58, 39 65 L 61 65 C 61 58, 71 51, 71 41 C 71 26, 64 16, 50 16 Z" fill="#E3F2FD" stroke="#1565C0" strokeWidth="2.5" />
                                                <rect x="42" y="65" width="16" height="5" fill="#90CAF9" rx="1.5" stroke="#1565C0" strokeWidth="2" />
                                                <rect x="44" y="70" width="12" height="5" fill="#90CAF9" rx="1.5" stroke="#1565C0" strokeWidth="2" />
                                                <circle cx="50" cy="78" r="2.5" fill="#1565C0" />
                                                <path d="M 40 48 L 47 40 L 53 45 L 61 33" fill="none" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <polygon points="61,33 55,33 59,39" fill="#1565C0" />
                                                <line x1="50" y1="6" x2="50" y2="10" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
                                                <line x1="20" y1="26" x2="25" y2="29" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
                                                <line x1="80" y1="26" x2="75" y2="29" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECOND HORIZONTAL DIVIDER - Blue dashed line */}
                            <div className={`border-t-4 border-dashed border-[#1565c0] w-full pointer-events-none select-none ${pageSize === 'letter' ? 'mt-3 mb-3' : pageSize === 'a4' ? 'mt-4 mb-4' : 'mt-6 mb-6'}`} />

                            {/* SIGNATURE BLOCK */}
                            <div className="flex flex-col items-center justify-center gap-3 relative select-none">
                                <div className="relative w-[380px] max-w-full text-center">
                                    <span className="text-[12px] font-black text-slate-800 uppercase block tracking-wider mb-8">
                                        SIGNATURE OVER PRINTED NAME OF THE OBSERVER/ADVISER
                                    </span>
                                    {/* Line */}
                                    <div className="border-b-2 border-slate-700 w-full mb-1" />
                                    <span className="text-[11px] font-bold text-slate-500 uppercase block tracking-widest">
                                        ADVISER
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>

            {/* PRINT-ONLY CSS SPEC */}
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
                
                .anecdotal-formal-theme select,
                .anecdotal-formal-theme input,
                .anecdotal-formal-theme textarea,
                .anecdotal-formal-theme button,
                .anecdotal-formal-theme span,
                .anecdotal-formal-theme h1,
                .anecdotal-formal-theme h2,
                .anecdotal-formal-theme p,
                #anecdotal-print-sheet * {
                    font-family: 'Poppins', sans-serif !important;
                }
                
                @media print {
                    @page {
                        ${getPageSizeCSS()}
                        margin: 0 !important;
                    }
                    body {
                        background: white !important;
                        overflow: visible !important;
                        height: auto !important;
                    }
                    #anecdotal-print-sheet {
                        box-sizing: border-box !important;
                        border: none !important;
                        box-shadow: none !important;
                        margin: 0 auto !important;
                        background: white !important;
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                        page-break-before: avoid !important;
                        overflow: hidden !important;
                        ${getPrintDimensionsCSS()}
                    }
                    .no-print, header, nav, aside {
                        display: none !important;
                    }
                }
            ` }} />
        </div>
    );
}
