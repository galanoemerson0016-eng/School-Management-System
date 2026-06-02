import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../stores';
import { 
    Plus, 
    Search, 
    Edit3, 
    Trash2, 
    GraduationCap, 
    Users, 
    Layers,
    Shield,
    BookOpen,
    Sparkles,
    Compass,
    BookMarked
} from 'lucide-react';
import { SectionForm } from '../components/sections/SectionForm';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import type { Section } from '../types';

const getShortSubjectName = (name: string): string => {
    const norm = name.trim().toLowerCase();
    if (norm.includes('technology and livelihood') || norm === 'tle') return 'TLE';
    if (norm.includes('good manners') || norm.includes('gmrc')) return 'GMRC';
    if (norm.includes('araling panlipunan') || norm === 'ap') return 'AP';
    if (norm.includes('physical education') || norm === 'pe' || norm === 'pe.') {
        if (norm.includes('health')) return 'PE & Health';
        return 'PE';
    }
    if (norm.includes('music and arts') || norm.includes('music, arts')) return 'MAPEH';
    if (norm.includes('mother tongue')) return 'Mother Tongue';
    if (norm.includes('reading and literacy')) return 'Reading & Lit';
    if (norm.includes('values education')) return 'Values Ed';
    if (norm.includes('english for academic')) return 'EAPP';
    if (norm.includes('contemporary philippine arts')) return 'CPAR';
    if (norm.includes('21st century literature')) return '21st Century Lit';
    if (norm.includes('introduction to philosophy')) return 'Philosophy';
    if (norm.includes('media and information literacy')) return 'MIL';
    if (norm.includes('understanding culture')) return 'UCSP';
    if (norm.includes('disaster readiness') || norm.includes('drrr')) return 'DRRR';
    if (norm.includes('komunikasyon')) return 'Komunikasyon';
    if (norm.includes('pagbasa at pagsusuri')) return 'Pagbasa & Pagsusuri';
    if (norm.includes('practical research 1')) return 'Research 1';
    if (norm.includes('practical research 2')) return 'Research 2';
    if (norm.includes('inquiries, investigations')) return '3Is';
    if (norm.includes('empowerment technologies')) return 'EmpTech';
    
    // Fallback: strip parentheses if any, keep it reasonably short
    return name.replace(/\s*\([^)]*\)/g, '').trim();
};

export function SectionsPage() {
    const { sections, deleteSection, schoolProfile, updateSection, students } = useAppStore();
    
    // Auto-Sync Adviser Names from Institute Profile
    useEffect(() => {
        const profileName = (schoolProfile?.adviser_name || '').trim();
        if (!profileName || profileName.toLowerCase() === 'admin') return;
        
        sections.forEach(section => {
            const currentName = (section.adviser_name || '').trim();
            
            if (section.is_advisory) {
                const isStale = currentName !== profileName;
                const isPlaceholder = currentName.toLowerCase().includes('juan') || 
                                    currentName.toLowerCase().includes('recovered') ||
                                    currentName.toLowerCase() === 'tba' ||
                                    currentName === '';
                if (isStale && (isPlaceholder || !section.adviser_id)) {
                    void updateSection({ ...section, adviser_name: profileName });
                }
            } else {
                // If it is not an advisory class, but has the profile name as adviser, we should clear it
                if (currentName === profileName) {
                    void updateSection({ ...section, adviser_name: '' });
                }
            }
        });
    }, [schoolProfile?.adviser_name, sections, updateSection]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('ELEMENTARY');

    const filteredSections = useMemo(() => {
        return sections.filter(s => 
            s.section_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.section_grade_level.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => {
            const gradeA = parseInt(a.section_grade_level.replace(/\D/g, '')) || 0;
            const gradeB = parseInt(b.section_grade_level.replace(/\D/g, '')) || 0;
            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, searchTerm]);

    const getStudentCount = (sec: Section) => {
        return students.filter(s => s.student_section === sec.section_name || s.student_section === sec.id).length;
    };

    const groupedSections = useMemo(() => {
        const groups: Record<string, Section[]> = {
            'ELEMENTARY': [],
            'JUNIOR HIGH SCHOOL': [],
            'SENIOR HIGH SCHOOL': []
        };
        
        filteredSections.forEach(s => {
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
    }, [filteredSections]);

    const activeGroupsCount = useMemo(() => {
        return Object.values(groupedSections).filter(g => g.length > 0).length;
    }, [groupedSections]);

    const handleEdit = (section: Section) => {
        setEditingSection(section);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteSection(id);
            setDeleteTarget(null);
        } catch (error) {
            console.error('Failed to delete section:', error);
        }
    };

    return (
        <div className="relative space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Premium Mesh Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className={`absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full blur-[130px] opacity-20 transition-all duration-1200 ${
                    activeCategory === 'ELEMENTARY' ? 'bg-cyan-300' :
                    activeCategory === 'JUNIOR HIGH SCHOOL' ? 'bg-blue-300' :
                    'bg-purple-300'
                }`} />
                <div className={`absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[110px] opacity-15 transition-all duration-1200 ${
                    activeCategory === 'ELEMENTARY' ? 'bg-blue-300' :
                    activeCategory === 'JUNIOR HIGH SCHOOL' ? 'bg-indigo-300' :
                    'bg-pink-300'
                }`} />
            </div>

            {/* Redesigned Premium Segmented Control, Search Bar, & Stats Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/70 backdrop-blur-xl border border-slate-200/80 p-2.5 rounded-3xl shadow-[0_8px_30px_-6px_rgba(0,0,0,0.02)]">
                {/* Segmented Capsule Toggles */}
                <div className="flex bg-slate-100/90 p-1 rounded-2xl border border-slate-200/40 relative max-w-full overflow-x-auto scrollbar-none shrink-0">
                    {Object.keys(groupedSections).map((group) => {
                        const isActive = activeCategory === group;
                        const label = group === 'ELEMENTARY' ? 'Elementary' :
                                      group === 'JUNIOR HIGH SCHOOL' ? 'Junior High' : 'Senior High';
                        return (
                            <button 
                                key={group} 
                                onClick={() => {
                                    setActiveCategory(group);
                                    if (searchTerm) setSearchTerm('');
                                }}
                                className={`relative px-6 py-2.5 text-xs font-black rounded-xl transition-all duration-300 z-10 select-none cursor-pointer whitespace-nowrap ${
                                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {isActive && (
                                    <motion.div 
                                        layoutId="active-segment"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        className="absolute inset-0 rounded-xl shadow-md bg-[#527083] -z-10"
                                    />
                                )}
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Inline Premium Search Bar (between Senior High toggle and Stats) */}
                <div className="relative group flex-1 max-w-md w-full lg:mx-2">
                    <div className="absolute -inset-0.5 bg-linear-to-r from-blue-500 to-indigo-500 rounded-2xl blur-xs opacity-5 group-focus-within:opacity-20 transition duration-300" />
                    <div className="relative bg-slate-50 border border-slate-200/80 p-1 rounded-2xl shadow-2xs transition-all duration-300 flex items-center gap-2 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-400">
                        <div className="pl-3.5 pr-1 text-slate-400 group-focus-within:text-blue-500 transition-colors flex items-center">
                            <Search className="w-3.5 h-3.5" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search sections by name or grade level..."
                            className="w-full bg-transparent border-none py-1.5 pr-3 text-xs font-bold text-slate-700 placeholder:text-slate-400 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="mr-1.5 px-2 py-1 text-[8px] font-black text-slate-400 hover:text-slate-600 bg-slate-100 rounded-md uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats indicators and Create button next to control */}
                <div className="flex items-center gap-5 pl-5 lg:border-l border-slate-200/80 pr-2 self-center lg:self-stretch justify-end shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                            {activeGroupsCount}
                        </span>
                        <div className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                            Active<br />Categories
                        </div>
                    </div>
                    
                    <div className="h-6 w-px bg-slate-200/80" />

                    <div className="flex items-center gap-2.5">
                        <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                            {filteredSections.length}
                        </span>
                        <div className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                            Total<br />Sections
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-200/80" />

                    <button 
                        onClick={() => { setEditingSection(null); setIsModalOpen(true); }}
                        className="group relative px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-wider shadow-sm hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer overflow-hidden shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Create Section
                    </button>
                </div>
            </div>

            {/* Dynamic Sections Content */}
            <div className="space-y-12">
                <AnimatePresence mode="wait">
                    {Object.entries(groupedSections).map(([group, groupSections]) => (
                        (activeCategory === group || searchTerm) && (
                            <motion.div 
                                key={group}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-4 px-2">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{group}</h3>
                                    <div className="h-px flex-1 bg-slate-200/50" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{groupSections.length} Sections</span>
                                </div>

                                {groupSections.length > 0 ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {groupSections.map((section) => (
                                            <motion.div 
                                                layout
                                                key={section.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                whileHover={{ y: -4, scale: 1.005 }}
                                                className="group relative bg-white/45 backdrop-blur-xl rounded-3xl border border-white/65 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] hover:bg-white/60 hover:border-white/90 transition-all duration-500 cursor-default overflow-hidden flex flex-col md:flex-row min-h-[220px]"
                                            >
                                                {/* Category Specific Gradient left accent bar */}
                                                <div className={`absolute top-0 bottom-0 left-0 w-1.5 transition-all duration-500 z-20 ${
                                                    group === 'ELEMENTARY' ? 'bg-linear-to-b from-cyan-400 to-blue-500' :
                                                    group === 'JUNIOR HIGH SCHOOL' ? 'bg-linear-to-b from-blue-500 to-indigo-600' :
                                                    'bg-linear-to-b from-indigo-500 to-purple-600'
                                                }`} />

                                                {/* Left details panel */}
                                                <div className="w-full md:w-[42%] shrink-0 bg-white/10 p-6 border-b md:border-b-0 md:border-r border-white/40 flex flex-col justify-between gap-6 relative backdrop-blur-xs">
                                                    <div className="flex items-start gap-3.5 w-full pl-1.5">
                                                        {/* Elegant Custom Level Specific Icon Container */}
                                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shrink-0 ${
                                                            group === 'ELEMENTARY' ? 'bg-linear-to-br from-cyan-500 to-blue-500 text-white shadow-blue-100' :
                                                            group === 'JUNIOR HIGH SCHOOL' ? 'bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-indigo-100' :
                                                            'bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-purple-100'
                                                        }`}>
                                                            {group === 'ELEMENTARY' ? <Sparkles className="w-5 h-5" /> :
                                                             group === 'JUNIOR HIGH SCHOOL' ? <Compass className="w-5 h-5" /> :
                                                             <GraduationCap className="w-5 h-5" />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="text-base font-black text-slate-800 tracking-tight leading-tight group-hover:text-deped-blue transition-colors truncate">
                                                                {section.section_name}
                                                            </h3>
                                                            <div className="flex flex-col gap-0.5 mt-1 text-slate-400">
                                                                <div className="flex items-center gap-1.5">
                                                                    <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                                                                    <span className="text-[9px] font-black uppercase tracking-wider truncate">{section.section_grade_level}</span>
                                                                </div>
                                                                {section.adviser_name ? (
                                                                    <span className="text-[9px] font-bold text-slate-500 truncate">
                                                                        Adviser: <span className="font-extrabold text-slate-655">{section.adviser_name}</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[9px] font-medium text-slate-400 italic">
                                                                        No Adviser Assigned
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Section Summary Stats */}
                                                    <div className="flex flex-col gap-2 w-full pl-1.5 mt-auto">
                                                        <div className="flex items-center gap-3 bg-white/35 backdrop-blur-2xs p-2.5 rounded-xl border border-white/50 shadow-3xs hover:bg-white/50 transition-all">
                                                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
                                                                <Users className="w-4 h-4" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Enrolled Learners</p>
                                                                <p className="text-[10px] font-extrabold text-slate-700 mt-1 leading-none">
                                                                    {getStudentCount(section)} Students
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 bg-white/35 backdrop-blur-2xs p-2.5 rounded-xl border border-white/50 shadow-3xs hover:bg-white/50 transition-all">
                                                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                                                                <BookOpen className="w-4 h-4" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Loaded Subjects</p>
                                                                <p className="text-[10px] font-extrabold text-slate-700 mt-1 leading-none">
                                                                    {(section.taught_subjects?.length || 0)} Subjects
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right details panel */}
                                                <div className="flex-1 p-6 flex flex-col justify-between gap-4 w-full">
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                            Assigned Subjects
                                                        </span>
                                                        <div>
                                                            {section.is_advisory ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100/80 text-[8px] font-black rounded-lg uppercase tracking-wider shadow-2xs">
                                                                    <Shield className="w-3 h-3 text-indigo-600" />
                                                                    Advisory
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50/80 text-amber-700 border border-amber-100/80 text-[8px] font-black rounded-lg uppercase tracking-wider shadow-2xs">
                                                                    <BookMarked className="w-3 h-3 text-amber-600" />
                                                                    Subject Load
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Subject tags box */}
                                                    <div className="w-full">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {section.is_teaching_load && (section.taught_subjects?.length || 0) > 0 ? (
                                                                [...(section.taught_subjects || [])].sort((a, b) => a.localeCompare(b)).map(subj => {
                                                                    const name = subj.toLowerCase();
                                                                    const cleanName = name.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
                                                                    let colorClass = 'bg-slate-50 text-slate-500 border-slate-200/60';
                                                                    
                                                                    if (name.includes('math') || cleanName.includes('math') || name.includes('science') || cleanName.includes('science')) 
                                                                        colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100/60 hover:bg-emerald-100/40';
                                                                    else if (name.includes('english') || cleanName.includes('english') || name.includes('filipino') || cleanName.includes('filipino') || name.includes('language') || cleanName.includes('language') || name.includes('reading') || cleanName.includes('reading') || name.includes('literacy') || cleanName.includes('literacy')) 
                                                                        colorClass = 'bg-blue-50 text-blue-700 border-blue-100/60 hover:bg-blue-100/40';
                                                                    else if (name.includes('arabic') || cleanName.includes('arabic') || name.includes('islamic') || cleanName.includes('islamic') || name.includes('gmrc') || cleanName.includes('gmrc') || name.includes('values') || cleanName.includes('values') || name.includes('conduct') || cleanName.includes('conduct')) 
                                                                        colorClass = 'bg-amber-50 text-amber-700 border-amber-100/60 hover:bg-amber-100/40';
                                                                    else if (name.includes('makabansa') || cleanName.includes('makabansa') || name.includes('araling') || cleanName.includes('araling') || name.includes('ap') || cleanName === 'ap') 
                                                                        colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-100/60 hover:bg-indigo-100/40';
                                                                    else if (name.includes('mapeh') || cleanName.includes('mapeh') || name.includes('music') || cleanName.includes('music') || name.includes('art') || cleanName.includes('art') || name.includes('pe') || cleanName === 'pe' || cleanName === 'pe.' || name.includes('health') || cleanName.includes('health')) 
                                                                        colorClass = 'bg-rose-50 text-rose-700 border-rose-100/60 hover:bg-rose-100/40';
                                                                    else if (name.includes('epp') || cleanName.includes('epp') || name.includes('tle') || cleanName.includes('tle') || name.includes('specialization') || cleanName.includes('specialization')) 
                                                                        colorClass = 'bg-cyan-50 text-cyan-700 border-cyan-100/60 hover:bg-cyan-100/40';
                                                                    
                                                                    return (
                                                                        <span 
                                                                            key={subj} 
                                                                            className={`px-2.5 py-1 border rounded-lg text-[8px] font-black uppercase tracking-tight shadow-2xs transition-all hover:scale-105 cursor-default ${colorClass}`}
                                                                            title={subj}
                                                                        >
                                                                            {getShortSubjectName(subj)}
                                                                        </span>
                                                                    );
                                                                })
                                                            ) : (
                                                                <div className="w-full flex flex-col items-center justify-center border border-dashed border-slate-200/80 rounded-xl py-6 bg-slate-50/20">
                                                                    <BookMarked className="w-4 h-4 text-slate-300 mb-1" />
                                                                    <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">No Subjects Loaded</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Card Actions Row */}
                                                    <div className="border-t border-white/40 pt-3 flex justify-between items-center w-full mt-auto">
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative flex h-2 w-2">
                                                                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                             </div>
                                                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Class</span>
                                                         </div>

                                                         <div className="flex gap-2">
                                                             <button 
                                                                 onClick={() => handleEdit(section)}
                                                                 className="w-9 h-9 rounded-xl bg-white/40 backdrop-blur-xs border border-white/60 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                                                                 title="Edit Section"
                                                             >
                                                                 <Edit3 className="w-4 h-4" />
                                                             </button>
                                                             <button 
                                                                 onClick={() => setDeleteTarget(section)}
                                                                 className="w-9 h-9 rounded-xl bg-white/40 backdrop-blur-xs border border-white/60 text-slate-500 hover:text-red-500 hover:bg-red-50/50 hover:border-red-200 transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
                                                                 title="Delete Section"
                                                             >
                                                                 <Trash2 className="w-4 h-4" />
                                                             </button>
                                                         </div>
                                                     </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-dashed border-slate-200/80 p-14 text-center max-w-lg mx-auto shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg ${
                                            group === 'ELEMENTARY' ? 'bg-linear-to-br from-cyan-100 to-blue-50 text-cyan-600 shadow-cyan-100' :
                                            group === 'JUNIOR HIGH SCHOOL' ? 'bg-linear-to-br from-blue-100 to-indigo-50 text-blue-600 shadow-indigo-100' :
                                            'bg-linear-to-br from-indigo-100 to-purple-50 text-indigo-600 shadow-purple-100'
                                        }`}>
                                            {group === 'ELEMENTARY' ? <Sparkles className="w-6 h-6" /> :
                                             group === 'JUNIOR HIGH SCHOOL' ? <Compass className="w-6 h-6" /> :
                                             <GraduationCap className="w-6 h-6" />}
                                        </div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">No {group === 'JUNIOR HIGH SCHOOL' ? 'Junior High' : group === 'SENIOR HIGH SCHOOL' ? 'Senior High' : 'Elementary'} Sections</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto leading-relaxed">
                                            Assign classes, advisories, and subjects by creating your first section for this academic category.
                                        </p>
                                        <button
                                            onClick={() => { setEditingSection(null); setIsModalOpen(true); }}
                                            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add First Section
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )
                    ))}
                </AnimatePresence>

                {filteredSections.length === 0 && searchTerm && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-slate-100 rounded-3xl border border-dashed border-slate-200/80 flex items-center justify-center mb-6 shadow-2xs">
                            <Layers className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">No matching sections</h3>
                        <p className="text-slate-400 font-bold max-w-sm mt-2 leading-relaxed uppercase text-[9px] tracking-widest">
                            Try adjusting your search terms or filter selections.
                        </p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isModalOpen && (
                    <SectionForm 
                        section={editingSection}
                        onClose={() => setIsModalOpen(false)}
                    />
                )}
            </AnimatePresence>

            <ConfirmationModal 
                open={!!deleteTarget}
                title="Delete Section?"
                message={`Are you sure you want to delete ${deleteTarget?.section_name}? This will NOT delete the students assigned to it, but they will become unassigned.`}
                confirmLabel="Delete Section"
                intent="danger"
                onConfirm={() => {
                    if (deleteTarget) {
                        void handleDelete(deleteTarget.id);
                    }
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
