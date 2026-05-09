import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../stores';
import { 
    Plus, 
    Search, 
    Edit3, 
    Trash2, 
    GraduationCap, 
    Users, 
    UserPlus,
    Layers,
    Shield,
    BookOpen,
    ChevronRight
} from 'lucide-react';
import { SectionForm } from '../components/sections/SectionForm';
import { BulkStudentModal } from '../components/sections/BulkStudentModal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import type { Section } from '../types';

export function SectionsPage() {
    const { sections, subjects, deleteSection, teachers, schoolProfile, updateSection } = useAppStore();
    
    // Auto-Sync Adviser Names from Institute Profile
    useEffect(() => {
        const profileName = (schoolProfile?.adviser_name || '').trim();
        if (!profileName || profileName.toLowerCase() === 'admin') return;
        
        let hasChanges = false;
        sections.forEach(section => {
            const currentName = (section.adviser_name || '').trim();
            const isStale = currentName !== profileName;
            const isPlaceholder = currentName.toLowerCase().includes('juan') || 
                                currentName.toLowerCase().includes('recovered') ||
                                currentName.toLowerCase() === 'tba' ||
                                currentName === '';
            
            if (isStale && (isPlaceholder || section.is_advisory || !section.adviser_id)) {
                void updateSection({ ...section, adviser_name: profileName });
                hasChanges = true;
            }
        });
    }, [schoolProfile?.adviser_name, sections, updateSection]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [activeSectionForBulk, setActiveSectionForBulk] = useState<Section | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>('ELEMENTARY');

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
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Classes & Sections</h2>
                    <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">
                        {activeGroupsCount} Active Categories • {filteredSections.length} Total Sections
                    </p>
                </div>
                
                <button 
                    onClick={() => { setEditingSection(null); setIsModalOpen(true); }}
                    className="group relative px-8 py-4 bg-deped-blue text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                >
                    <Plus className="w-4 h-4" />
                    Create New Section
                </button>
            </div>

            {/* Category Toggle Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                {Object.entries(groupedSections).map(([group, groupSections]) => (
                    <button 
                        key={group} 
                        onClick={() => {
                            setActiveCategory(activeCategory === group ? null : group);
                            if (searchTerm) setSearchTerm('');
                        }}
                        className={`group relative text-left bg-white rounded-[2.5rem] p-8 border transition-all duration-500 ${
                            activeCategory === group 
                                ? 'border-deped-blue ring-4 ring-blue-500/10 shadow-xl scale-[1.02]' 
                                : 'border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                                    activeCategory === group ? 'text-deped-blue' : 'text-slate-400'
                                }`}>{group}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-black text-slate-800 tracking-tight">{groupSections.length}</p>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sections</span>
                                </div>
                            </div>
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-all group-hover:rotate-12 ${
                                activeCategory === group ? 'scale-110 rotate-6' : ''
                            } ${
                                group === 'ELEMENTARY' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200' :
                                group === 'JUNIOR HIGH SCHOOL' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-indigo-200' :
                                group === 'SENIOR HIGH SCHOOL' ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-purple-200' :
                                'bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-slate-200'
                            }`}>
                                <Layers className="w-8 h-8" />
                            </div>
                        </div>

                        {activeCategory === group && (
                            <motion.div 
                                layoutId="active-indicator"
                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-deped-blue rounded-full"
                            />
                        )}
                        
                        <div className={`absolute top-4 right-4 transition-opacity duration-300 ${activeCategory === group ? 'opacity-100' : 'opacity-0'}`}>
                            <ChevronRight className="w-4 h-4 text-deped-blue rotate-90" />
                        </div>
                    </button>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="bg-white/50 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/20 shadow-sm transition-all focus-within:shadow-xl focus-within:bg-white flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search for a section..."
                        className="w-full bg-slate-100/50 border-none rounded-2xl py-4 pl-14 pr-6 text-sm font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Dynamic Sections Content */}
            <div className="space-y-12">
                <AnimatePresence mode="wait">
                    {Object.entries(groupedSections).map(([group, groupSections]) => (
                        (activeCategory === group || searchTerm) && groupSections.length > 0 && (
                            <motion.div 
                                key={group}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-4 px-2">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">{group}</h3>
                                    <div className="h-px flex-1 bg-slate-200/50" />
                                    <span className="text-[10px] font-black text-slate-300 uppercase">{groupSections.length} Sections</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {groupSections.map((section) => (
                                        <motion.div 
                                            layout
                                            key={section.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
                                            className="group relative bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm transition-all duration-500 cursor-default overflow-hidden flex flex-col"
                                        >
                                            <div className={`absolute top-0 left-0 w-2 h-full ${section.is_advisory ? 'bg-indigo-500' : 'bg-amber-500'}`} />

                                            <div className="p-8 flex-1">
                                                <div className="flex justify-between items-start mb-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500 ${
                                                            section.is_advisory 
                                                                ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-indigo-200' 
                                                                : 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-200'
                                                        }`}>
                                                            <Layers className="w-8 h-8" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-deped-blue transition-colors">
                                                                {section.section_name}
                                                            </h3>
                                                            <div className="flex items-center gap-1.5 mt-1.5 text-slate-400">
                                                                <GraduationCap className="w-4 h-4" />
                                                                <span className="text-[11px] font-black uppercase tracking-[0.15em]">{section.section_grade_level}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {section.is_advisory && (
                                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm" title="Advisory Class">
                                                                <Shield className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                        {section.is_teaching_load && (
                                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm" title="Teaching Load">
                                                                <BookOpen className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 min-h-[140px] flex flex-col">
                                                    <div className="flex justify-between items-center mb-5">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                                                            Assigned Subjects
                                                        </span>
                                                        {section.is_teaching_load && (
                                                            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black rounded-lg uppercase tracking-widest border border-amber-200/50">
                                                                {(section.taught_subjects?.length || 0)} Total
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-2.5">
                                                        {section.is_teaching_load && (section.taught_subjects?.length || 0) > 0 ? (
                                                            section.taught_subjects?.map(subj => (
                                                                <span key={subj} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-tight shadow-sm hover:border-amber-400 hover:text-amber-600 transition-colors cursor-default">
                                                                    {subj}
                                                                </span>
                                                            ))
                                                        ) : section.is_teaching_load && section.subject_name ? (
                                                            <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-tight italic">
                                                                {section.subject_name}
                                                            </span>
                                                        ) : (
                                                            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200/50 rounded-2xl py-6">
                                                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Advisory Only</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="relative">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                                        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-20" />
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                                                </div>

                                                <div className="flex gap-2.5">
                                                    <button 
                                                        onClick={() => { setActiveSectionForBulk(section); setIsBulkModalOpen(true); }}
                                                        className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-emerald-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all flex items-center justify-center shadow-sm"
                                                        title="Import Students"
                                                    >
                                                        <UserPlus className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEdit(section)}
                                                        className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-center shadow-sm"
                                                        title="Edit Section"
                                                    >
                                                        <Edit3 className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setDeleteTarget(section)}
                                                        className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all flex items-center justify-center shadow-sm"
                                                        title="Delete Section"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )
                    ))}
                </AnimatePresence>

                {filteredSections.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-40 text-center">
                        <div className="w-48 h-48 bg-slate-50 rounded-[4rem] border border-dashed border-slate-200 flex items-center justify-center mb-12">
                            <Layers className="w-24 h-24 text-slate-200" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">No sections found</h3>
                        <p className="text-slate-400 font-bold max-w-sm mt-6 leading-relaxed italic uppercase text-[12px] tracking-[0.2em]">
                            Try adjusting your search or category filters.
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
                {isBulkModalOpen && (
                    <BulkStudentModal 
                        open={isBulkModalOpen}
                        section={activeSectionForBulk}
                        onClose={() => setIsBulkModalOpen(false)}
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
