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
    BookOpen
} from 'lucide-react';
import { SectionForm } from '../components/sections/SectionForm';
import { BulkStudentModal } from '../components/sections/BulkStudentModal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import type { Section } from '../types';

export function SectionsPage() {
    const { sections, deleteSection, teachers, schoolProfile, updateSection } = useAppStore();
    
    // Auto-Sync Adviser Names from Institute Profile (Source of Truth)
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
            
            // If it's a known placeholder or stale advisory name, sync it
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

    const getAdviserName = (id?: string) => {
        if (!id) return '---';
        const teacher = teachers.find(t => t.uid === id);
        return teacher?.displayName || 'Unknown Teacher';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight dark:text-white">Classes & Sections</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 dark:text-slate-400">
                        Manage Advisory Classes and Teaching Loads
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

            {/* Search & Filters */}
            <div className="bg-white/50 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/20 shadow-sm transition-all focus-within:shadow-xl focus-within:bg-white flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search by section name or grade level..."
                        className="w-full bg-slate-100/50 border-none rounded-2xl py-4 pl-14 pr-6 text-sm font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSections.map((section) => (
                    <motion.div 
                        layout
                        key={section.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                        className="group relative bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm transition-all duration-300 cursor-default overflow-hidden flex flex-col"
                    >
                        {/* Role Accent Line */}
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${section.is_advisory ? 'bg-indigo-500' : 'bg-amber-500'}`} />

                        <div className="p-7 flex-1">
                            {/* Top Row: Meta & Icons */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500 ${
                                        section.is_advisory 
                                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-indigo-200' 
                                            : 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-200'
                                    }`}>
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-deped-blue transition-colors">
                                            {section.section_name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                                            <GraduationCap className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em]">{section.section_grade_level}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Icons */}
                                <div className="flex gap-1.5">
                                    {section.is_advisory && (
                                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm" title="Advisory Class">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                    )}
                                    {section.is_teaching_load && (
                                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm" title="Teaching Load">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Subjects Area */}
                            <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100 min-h-[120px] flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                                        Assigned Subjects
                                    </span>
                                    {section.is_teaching_load && (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded-lg uppercase tracking-widest border border-amber-200/50">
                                            {section.taught_subjects?.length || 0} Total
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {section.is_teaching_load && (section.taught_subjects?.length || 0) > 0 ? (
                                        section.taught_subjects?.map(subj => (
                                            <span key={subj} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-bold text-slate-600 uppercase tracking-tight shadow-sm hover:border-amber-400 hover:text-amber-600 transition-colors cursor-default">
                                                {subj}
                                            </span>
                                        ))
                                    ) : section.is_teaching_load && section.subject_name ? (
                                        <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-bold text-slate-600 uppercase tracking-tight italic">
                                            {section.subject_name}
                                        </span>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl py-4">
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Advisory Only</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Row */}
                        <div className="px-7 py-5 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-20" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { setActiveSectionForBulk(section); setIsBulkModalOpen(true); }}
                                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-emerald-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all flex items-center justify-center shadow-sm"
                                    title="Import Student Names"
                                >
                                    <UserPlus className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleEdit(section)}
                                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-center shadow-sm"
                                    title="Edit Section"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setDeleteTarget(section)}
                                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all flex items-center justify-center shadow-sm"
                                    title="Delete Section"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredSections.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-40 h-40 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 flex items-center justify-center mb-10">
                        <Layers className="w-20 h-20 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">No sections found</h3>
                    <p className="text-slate-400 font-bold max-w-sm mt-4 leading-relaxed italic uppercase text-[10px] tracking-[0.2em]">
                        Start by creating your advisory class or teaching load sections.
                    </p>
                </div>
            )}

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
