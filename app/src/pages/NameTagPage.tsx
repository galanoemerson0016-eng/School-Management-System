import { useState, useMemo } from 'react';
import { useAppStore } from '../stores';
import { ArrowLeft, Printer, Layout, Sparkles, GraduationCap, ChevronDown } from 'lucide-react';
import type { Student, Section, SchoolProfile } from '../types';

type DesignTemplate = 'classic' | 'modern' | 'pro' | 'premium' | 'organic' | 'artistic';
type ColorTheme = 'blue' | 'emerald' | 'purple' | 'amber' | 'rose';

export function NameTagPage() {
    

    const { students, sections, schoolProfile, setCurrentView } = useAppStore();
    const [selectedSection, setSelectedSection] = useState('');
    const [template, setTemplate] = useState<DesignTemplate>('premium');
    const [colorTheme, setColorTheme] = useState<ColorTheme>('blue');

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

    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        return students.filter(s => s.student_section === selectedSection)
            .sort((a, b) => {
                // Sort by Gender (Male first), then by Last Name
                if (a.gender !== b.gender) {
                    return a.gender === 'Male' ? -1 : 1;
                }
                return a.last_name.localeCompare(b.last_name);
            });
    }, [students, selectedSection]);

    const selectedSectionObj = useMemo(() => {
        return sections.find(s => s.section_name === selectedSection || s.id === selectedSection);
    }, [sections, selectedSection]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans print:bg-white print:h-auto print:overflow-visible">
            <style>{`
                .print-page {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 0;
                    margin: 20px auto;
                    display: grid;
                    grid-template-columns: repeat(2, 90mm);
                    grid-template-rows: repeat(4, 60mm);
                    gap: 8mm;
                    place-content: center;
                    background: white;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    border-radius: 4px;
                    position: relative;
                }

                .name-tag-card {
                    height: 55mm !important;
                    width: 90mm !important;
                    margin: auto !important;
                    position: relative !important;
                    overflow: hidden !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }

                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .print-page {
                        margin: 0 !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        page-break-after: always;
                    }
                    .name-tag-card {
                        break-inside: avoid;
                        page-break-inside: avoid;
                        box-shadow: none !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
            {/* Header Toolbar */}
            <div className="z-20 bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm sticky top-0 print:hidden shrink-0 w-full">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30" />
                <div className="flex items-center justify-start w-full h-16 select-none relative px-3 lg:px-4 gap-2 lg:gap-3 overflow-x-auto scrollbar-none">
                    
                    {/* Identity & Context (Left Most Edge) */}
                    <div className="flex items-center gap-2 lg:gap-3 shrink-0">
                        <button 
                            onClick={() => setCurrentView('school-forms')}
                            className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all group shrink-0 active:scale-95 duration-200"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex flex-col shrink-0">
                            <h2 className="text-[11px] lg:text-[12px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">Name Tags</h2>
                            <p className="text-[7.5px] font-black text-blue-600 uppercase tracking-widest leading-none">Resource Tool</p>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-200 shrink-0 mx-0.5" />

                    {/* Controls Block */}
                    <div className="relative group shrink-0">
                        <select 
                            className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-[120px] lg:min-w-[135px] duration-200"
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                        >
                            <option value="">Select Section</option>
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

                    <div className="relative group shrink-0">
                        <select
                            value={template}
                            onChange={(e) => setTemplate(e.target.value as DesignTemplate)}
                            className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-[90px] lg:min-w-[100px] duration-200"
                            title="Design Template"
                        >
                            <option value="classic">Classic</option>
                            <option value="modern">Modern</option>
                            <option value="pro">Pro</option>
                            <option value="premium">Premium</option>
                            <option value="organic">Organic</option>
                            <option value="artistic">Artistic</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                    </div>

                    {(template === 'pro' || template === 'premium') && (
                        <div className="relative group shrink-0">
                            <select
                                value={colorTheme}
                                onChange={(e) => setColorTheme(e.target.value as ColorTheme)}
                                className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-7 text-[9.5px] lg:text-[10px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-[80px] lg:min-w-[90px] duration-200"
                                title="Color Theme"
                            >
                                <option value="blue">Blue</option>
                                <option value="emerald">Emerald</option>
                                <option value="purple">Purple</option>
                                <option value="amber">Amber</option>
                                <option value="rose">Rose</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                        </div>
                    )}

                    <div className="h-6 w-px bg-slate-200 shrink-0 mx-0.5" />

                    <button
                        onClick={handlePrint}
                        disabled={sectionStudents.length === 0}
                        className="h-9 px-3.5 lg:px-4 rounded-xl bg-blue-600 text-white font-black text-[8.5px] uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.01] active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap duration-200"
                    >
                        <Printer className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                        Print Tags
                    </button>
                </div>
            </div>

            {/* Layout Preview */}
            <div className="flex-1 overflow-auto p-12 flex flex-col items-center bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible custom-scrollbar">
                {sectionStudents.length > 0 ? (
                    <div className="print:w-full flex flex-col items-center">
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-700 print:hidden max-w-2xl shadow-sm">
                            <Sparkles className="w-5 h-5 shrink-0" />
                            <div className="text-xs space-y-1">
                                <p className="font-black uppercase tracking-tight">Print Setup Required</p>
                                <p className="font-medium opacity-90">To see the colors and backgrounds, please check <span className="font-black underline italic text-amber-800">"Background graphics"</span> in the Print Preview settings.</p>
                            </div>
                        </div>
                        
                        <div className="print:w-full flex flex-col items-center gap-8">
                            {/* PDF-like Paginated View */}
                            {Array.from({ length: Math.ceil(sectionStudents.length / 8) }).map((_, pageIdx) => (
                                <div key={pageIdx} className="print-page relative" style={{
                                    width: '210mm',
                                    minHeight: '297mm',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 90mm)',
                                    gridTemplateRows: 'repeat(4, 60mm)',
                                    gap: '8mm',
                                    placeContent: 'center',
                                    background: 'white',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                    borderRadius: '4px',
                                    padding: '0',
                                }}>
                                    {/* Page Number Indicator */}
                                    <div className="absolute -top-6 right-0 text-[10px] font-black text-slate-400 uppercase tracking-widest print:hidden">
                                        Page {pageIdx + 1} of {Math.ceil(sectionStudents.length / 8)}
                                    </div>
                                    
                                    {sectionStudents.slice(pageIdx * 8, (pageIdx + 1) * 8).map((student) => (
                                        <NameTagCard 
                                            key={student.lrn} 
                                            student={student} 
                                            schoolProfile={schoolProfile}
                                            section={selectedSectionObj}
                                            template={template}
                                            colorTheme={colorTheme}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md">
                        <div className="w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mb-6">
                            <Layout className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">No Students Selected</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            Select a section from the toolbar to generate professional name tags for your class.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
 
function NameTagCard({ student, schoolProfile, section, template, colorTheme }: { student: Student, schoolProfile: SchoolProfile, section: Section | undefined, template: DesignTemplate, colorTheme?: ColorTheme }) {
    const logoUrl = schoolProfile.logo_url || 'school-logo.png';
    
    const theme = {
        blue: { primary: 'bg-blue-600', secondary: 'text-blue-500', bg: 'bg-blue-50', gradient: 'from-blue-600 to-indigo-600', accent: 'bg-blue-500/10' },
        emerald: { primary: 'bg-emerald-600', secondary: 'text-emerald-500', bg: 'bg-emerald-50', gradient: 'from-emerald-600 to-teal-600', accent: 'bg-emerald-500/10' },
        purple: { primary: 'bg-purple-600', secondary: 'text-purple-500', bg: 'bg-purple-50', gradient: 'from-purple-600 to-fuchsia-600', accent: 'bg-purple-500/10' },
        amber: { primary: 'bg-amber-600', secondary: 'text-amber-500', bg: 'bg-amber-50', gradient: 'from-amber-600 to-orange-600', accent: 'bg-amber-500/10' },
        rose: { primary: 'bg-rose-600', secondary: 'text-rose-500', bg: 'bg-rose-50', gradient: 'from-rose-600 to-pink-600', accent: 'bg-rose-500/10' },
    }[colorTheme || 'blue'];
 
    if (template === 'organic') {
        return (
            <div className="name-tag-card h-[55mm] rounded-[2.5rem] overflow-hidden flex flex-col relative bg-emerald-50 shadow-xl group border-2 border-emerald-100/50">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-200/40 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-200/30 rounded-full blur-2xl -ml-16 -mb-16" />
                
                <div className="relative z-10 p-6 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                        <img src={logoUrl} className="w-10 h-10 object-contain opacity-60" alt="Logo" />
                        <h4 className="text-[9px] font-black text-emerald-800/60 uppercase tracking-[0.2em] leading-tight">{schoolProfile.name}</h4>
                    </div>
                    <div className="flex-1 flex flex-col justify-center -mt-2 min-h-0">
                        <h1 className={`${student.first_name.length > 15 ? 'text-xl' : student.first_name.length > 10 ? 'text-2xl' : 'text-3xl'} font-black text-emerald-900 uppercase leading-tight mb-1`}>
                            {student.first_name}
                        </h1>
                        <h2 className={`${student.last_name.length > 12 ? 'text-sm' : 'text-lg'} font-bold text-emerald-600 uppercase tracking-widest leading-tight`}>
                            {student.last_name}
                        </h2>
                    </div>
                    <div className="mt-4 pt-4 border-t border-emerald-200/50 flex items-end justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{section?.section_grade_level} • {section?.section_name}</p>
                            <p className="text-[8.5px] font-bold text-emerald-600 uppercase italic">Adviser: {schoolProfile.adviser_name || 'N/A'}</p>
                        </div>
                        <div className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] tracking-widest tabular-nums border border-emerald-200">
                             {student.lrn}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
 
    if (template === 'artistic') {
        return (
            <div className="name-tag-card h-[55mm] rounded-2xl overflow-hidden flex flex-col relative bg-white shadow-2xl group border border-slate-100">
                {/* Watercolor Splash Effect */}
                <div className="absolute inset-0 bg-linear-to-br from-rose-50 via-amber-50 to-indigo-50 opacity-60" />
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl transform rotate-12" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl transform -rotate-12" />
                
                <div className="relative z-10 p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center p-1.5">
                            <img src={logoUrl} className="w-full h-full object-contain" alt="Logo" />
                        </div>
                        <div className="text-right">
                             <h4 className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">{schoolProfile.name}</h4>
                             <div className="h-0.5 w-16 bg-linear-to-r from-rose-500 to-orange-500 ml-auto rounded-full" />
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-h-0 -mt-2">
                        <h1 className={`${student.first_name.length > 15 ? 'text-xl' : student.first_name.length > 10 ? 'text-2xl' : 'text-3xl'} font-black text-slate-900 uppercase tracking-tighter leading-tight`}>
                            {student.first_name}
                        </h1>
                        <h2 className={`${student.last_name.length > 12 ? 'text-sm' : 'text-xl'} font-bold text-slate-500 uppercase tracking-[0.2em] italic leading-tight`}>
                            {student.last_name}
                        </h2>
                    </div>
                    <div className="mt-auto pt-3 border-t border-slate-200/50 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{section?.section_grade_level} • {section?.section_name}</p>
                            <p className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest italic leading-tight">Adviser: {schoolProfile.adviser_name || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[6px] font-black text-slate-400 uppercase block mb-0.5 tracking-[0.3em]">LRN ID</span>
                            <span className="text-[11px] font-black text-slate-900 tabular-nums bg-white px-2.5 py-1 rounded-lg shadow-sm border border-slate-100">{student.lrn}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
 
    if (template === 'premium') {
        return (
            <div className={`name-tag-card h-[55mm] rounded-[2.5rem] overflow-hidden flex flex-col relative bg-white shadow-2xl group border-4 ${theme.primary.replace('bg-', 'border-')}/10`}>
                <div className={`absolute top-0 right-0 w-64 h-64 ${theme.accent} rounded-full blur-[80px] -mr-32 -mt-32 opacity-60`} />
                <div className={`absolute bottom-0 left-0 w-48 h-48 ${theme.accent} rounded-full blur-[60px] -ml-24 -mb-24 opacity-40`} />
                
                <div className="relative z-10 p-6 flex flex-col h-full pl-6">
                    {/* Institutional Header */}
                    <div className="flex items-start gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-xl shadow-black/5 border border-slate-100 flex items-center justify-center p-1.5 shrink-0">
                            <img src={logoUrl} className="w-full h-full object-contain" alt="School Logo" />
                        </div>
                        <div className="flex flex-col justify-center h-12">
                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.15em] leading-none mb-1">
                                {schoolProfile.name}
                            </h4>
                            <div className="flex gap-1">
                                <div className={`h-1 w-8 rounded-full ${theme.primary} opacity-30`} />
                                <div className={`h-1 w-4 rounded-full ${theme.primary} opacity-10`} />
                            </div>
                        </div>
                    </div>

                    {/* Learner Identity */}
                    <div className="flex-1 flex flex-col justify-center min-h-0">
                        <h1 className={`${student.first_name.length > 12 ? 'text-2xl' : student.first_name.length > 8 ? 'text-3xl' : 'text-4xl'} font-black text-slate-900 uppercase tracking-tighter leading-[0.9] mb-0`}>
                            {student.first_name}
                        </h1>
                        <h2 className={`${student.last_name.length > 12 ? 'text-sm' : 'text-lg'} font-black ${theme.secondary} uppercase tracking-[0.15em] leading-tight`}>
                            {student.last_name}
                        </h2>
                    </div>

                    {/* Information Footer */}
                    <div className="mt-auto pt-1 flex items-end justify-between">
                         <div className="space-y-0">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                <GraduationCap className={`w-3.5 h-3.5 ${theme.secondary}`} />
                                {section?.section_grade_level} • {section?.section_name}
                            </div>
                            <p className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest pl-5 italic leading-none">Adviser: {schoolProfile.adviser_name || 'N/A'}</p>
                        </div>
                        <div className={`px-3 py-1.5 ${theme.primary} text-white rounded-2xl shadow-lg shadow-current/20 flex flex-col items-center justify-center min-w-[90px] shrink-0`}>
                            <span className="text-[6px] font-black opacity-70 uppercase tracking-widest leading-none mb-0.5">LRN ID</span>
                            <span className="text-[10px] font-black tracking-widest tabular-nums leading-none">
                                {student.lrn}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Aesthetic Detail: Top Edge Shine */}
                <div className="absolute top-0 left-0 right-0 h-px bg-white/40" />
            </div>
        );
    }
       if (template === 'pro') {
        return (
            <div className={`name-tag-card h-[55mm] rounded-2xl overflow-hidden flex flex-col relative bg-slate-900 shadow-xl group border border-white/10`}>
                <div className={`absolute top-0 right-0 w-32 h-32 ${theme.primary} opacity-20 rounded-full blur-3xl -mr-16 -mt-16`} />
                <div className="relative z-10 p-5 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-1">
                                <img src={logoUrl} className="w-full h-full object-contain" alt="Logo" />
                            </div>
                            <span className="text-[9px] font-black text-white/70 uppercase tracking-widest leading-tight">
                                {schoolProfile.name}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center -mt-8 min-h-0">
                        <h1 className={`${student.first_name.length > 12 ? 'text-xl' : student.first_name.length > 8 ? 'text-2xl' : 'text-3xl'} font-black text-white uppercase tracking-tighter leading-tight mb-1`}>
                            {student.first_name}
                        </h1>
                        <h2 className={`${student.last_name.length > 12 ? 'text-sm' : 'text-lg'} font-black ${theme.secondary} uppercase tracking-widest leading-tight`}>
                            {student.last_name}
                        </h2>
                    </div>
                    <div className="mt-auto pt-2 border-t border-white/10 flex items-end justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-black text-white/90 uppercase tracking-widest">
                                <GraduationCap className={`w-3.5 h-3.5 ${theme.secondary}`} />
                                {section?.section_grade_level} • {section?.section_name}
                            </div>
                            <p className="text-[8.5px] font-bold text-white/70 uppercase tracking-widest pl-5 italic leading-tight">Adviser: {schoolProfile.adviser_name || 'N/A'}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl bg-white/20 border border-white/20 flex flex-col items-center shadow-lg backdrop-blur-sm shrink-0`}>
                            <span className="text-[6px] font-black text-white/70 uppercase tracking-[0.2em] mb-0.5">LRN ID</span>
                            <span className="text-[11px] font-black text-white tracking-widest tabular-nums leading-none">{student.lrn}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (template === 'modern') {
        return (
            <div className={`name-tag-card h-[55mm] border-2 border-slate-900 rounded-xl overflow-hidden flex flex-col relative bg-white group shadow-lg`}>
                <div className={`h-2 ${theme.primary} w-full`} />
                <div className="p-5 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-3">
                        <img src={logoUrl} className="w-10 h-10 object-contain" alt="Logo" />
                        <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-tight">{schoolProfile.name}</h4>
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-h-0">
                        <h1 className={`${student.first_name.length > 12 ? 'text-xl' : student.first_name.length > 8 ? 'text-2xl' : 'text-3xl'} font-black text-slate-900 uppercase leading-tight mb-1`}>
                            {student.first_name}
                        </h1>
                        <h2 className={`${student.last_name.length > 12 ? 'text-sm' : 'text-lg'} font-black ${theme.secondary} uppercase leading-tight`}>
                            {student.last_name}
                        </h2>
                    </div>
                    <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
                        <div>
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{section?.section_grade_level} • {section?.section_name}</p>
                             <p className="text-[8.5px] font-bold text-slate-500 uppercase mt-1 italic leading-tight">Adviser: {schoolProfile.adviser_name || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">LRN ID</p>
                            <p className="text-[12px] font-black text-slate-900 tabular-nums">{student.lrn}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Classic Template
    return (
        <div className="name-tag-card h-[55mm] border-4 border-double border-slate-300 rounded-none flex flex-col bg-white relative">
            <div className="bg-slate-900 text-white p-2 flex items-center justify-center gap-3">
                <img src={logoUrl} className="w-6 h-6 object-contain" alt="Logo" />
                <span className="text-[8px] font-black uppercase tracking-widest truncate">{schoolProfile.name}</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0">
                <h1 className={`${student.first_name.length > 12 ? 'text-xl' : student.first_name.length > 8 ? 'text-2xl' : 'text-3xl'} font-black text-slate-900 uppercase leading-tight mb-1 text-center w-full`}>
                    {student.first_name}
                </h1>
                <h2 className={`${student.last_name.length > 12 ? 'text-sm' : 'text-xl'} font-black text-blue-600 uppercase leading-tight mb-4 text-center w-full`}>
                    {student.last_name}
                </h2>
                <div className="flex flex-col items-center gap-1">
                    <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 uppercase">
                        {section?.section_grade_level} • {section?.section_name}
                    </div>
                    <p className="text-[8.5px] font-bold text-slate-500 uppercase italic">Adviser: {schoolProfile.adviser_name || 'N/A'}</p>
                </div>
            </div>
            <div className="absolute bottom-1 right-2 flex flex-col items-end">
                <span className="text-[6px] font-black text-slate-300 uppercase">LRN ID</span>
                <span className="text-[9px] font-black text-slate-400 tracking-widest">{student.lrn}</span>
            </div>
        </div>
    );
}
