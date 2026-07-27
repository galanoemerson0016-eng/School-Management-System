import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../stores';
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Users,
    Layers,
    Shield,
    BookOpen,
    BookMarked,
    X
} from 'lucide-react';
import { SectionForm } from '../components/sections/SectionForm';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { AnimatePresence, motion } from 'framer-motion';
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

const getGradeBadge = (gradeLevel: string): string => {
    const gl = (gradeLevel || '').toLowerCase();
    if (gl.includes('kinder')) return 'K';
    const num = parseInt(gl.replace(/\D/g, ''));
    return num ? `G${num}` : '—';
};

const GROUP_LABELS: Record<string, string> = {
    'ELEMENTARY': 'Elementary',
    'JUNIOR HIGH SCHOOL': 'Junior High',
    'SENIOR HIGH SCHOOL': 'Senior High'
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

    const openCreateModal = () => {
        setEditingSection(null);
        setIsModalOpen(true);
    };

    const visibleGroups = Object.entries(groupedSections).filter(
        ([group, groupSections]) => searchTerm ? groupSections.length > 0 : activeCategory === group
    );

    return (
        <div className="space-y-6 pb-16 relative min-h-[80vh] overflow-hidden">
            {/* School Logo Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] dark:opacity-[0.06] pointer-events-none select-none z-0">
                <img 
                    src={schoolProfile?.logo_url || `${import.meta.env.BASE_URL}school-logo.png`} 
                    className="w-160 h-160 max-w-none object-contain grayscale scale-125 -rotate-6"
                    alt=""
                    onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                    }}
                />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
                <div className="flex items-center bg-slate-100 rounded-lg p-1 self-start">
                    {Object.keys(groupedSections).map((group) => {
                        const isActive = !searchTerm && activeCategory === group;
                        const count = groupedSections[group].length;
                        return (
                            <button
                                key={group}
                                onClick={() => {
                                    setActiveCategory(group);
                                    if (searchTerm) setSearchTerm('');
                                }}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                                    isActive
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {GROUP_LABELS[group]}
                                {count > 0 && (
                                    <span className={`ml-1.5 text-xs ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search sections..."
                            className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 outline-none transition focus:border-deped-blue focus:ring-2 focus:ring-deped-blue/15"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-deped-blue hover:bg-deped-blue-dark text-white text-sm font-semibold rounded-lg transition-colors active:scale-[0.98] cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        New Section
                    </button>
                </div>
            </div>

            {/* Section groups */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={searchTerm ? 'search' : activeCategory}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-10 relative z-10"
                >
                    {visibleGroups.map(([group, groupSections]) => (
                        <section key={group} className="space-y-4">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-base font-semibold text-slate-900">{GROUP_LABELS[group]}</h3>
                                <span className="text-sm text-slate-400">
                                    {groupSections.length} {groupSections.length === 1 ? 'section' : 'sections'}
                                </span>
                            </div>

                            {groupSections.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {groupSections.map((section) => {
                                        const subjects = section.is_teaching_load
                                            ? [...(section.taught_subjects || [])].sort((a, b) => a.localeCompare(b))
                                            : [];
                                        const isGrade11 = (section.section_grade_level || '').includes('Grade 11');
                                        const isGrade12 = (section.section_grade_level || '').includes('Grade 12');
                                        return (
                                            <div
                                                key={section.id}
                                                className="group bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4 transition hover:border-slate-300 hover:shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 shrink-0 rounded-lg bg-deped-blue/10 text-deped-blue flex items-center justify-center text-sm font-bold">
                                                            {getGradeBadge(section.section_grade_level)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="text-sm font-semibold text-slate-900 truncate" title={section.section_name}>
                                                                {section.section_name}
                                                            </h4>
                                                            <p className="text-xs text-slate-500 truncate">
                                                                {section.section_grade_level}
                                                                {' · '}
                                                                {section.adviser_name
                                                                    ? section.adviser_name
                                                                    : <span className="italic text-slate-400">No adviser</span>}
                                                            </p>
                                                            {isGrade11 && section.track && (
                                                                <div className="mt-1.5 flex flex-wrap gap-1">
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100/80 uppercase tracking-wider">
                                                                        {section.track} Track
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {isGrade12 && section.track && (
                                                                <div className="mt-1.5 flex flex-wrap gap-1">
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100/80 uppercase tracking-wider">
                                                                        {section.track}
                                                                    </span>
                                                                    {section.strand && (
                                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/80 uppercase tracking-wider">
                                                                            {section.strand}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {section.is_advisory ? (
                                                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md">
                                                            <Shield className="w-3 h-3" />
                                                            Advisory
                                                        </span>
                                                    ) : (
                                                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-md">
                                                            <BookMarked className="w-3 h-3" />
                                                            Subject Load
                                                        </span>
                                                    )}
                                                </div>

                                                {subjects.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {subjects.map(subj => (
                                                            <span
                                                                key={subj}
                                                                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-md"
                                                                title={subj}
                                                            >
                                                                {getShortSubjectName(subj)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic">No subjects loaded</p>
                                                )}

                                                <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-100">
                                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                                        <span className="inline-flex items-center gap-1.5" title="Enrolled learners">
                                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                                            {getStudentCount(section)} students
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5" title="Loaded subjects">
                                                            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                                            {(section.taught_subjects?.length || 0)} subjects
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEdit(section)}
                                                            className="p-2 rounded-lg text-slate-400 hover:text-deped-blue hover:bg-slate-100 transition-colors cursor-pointer"
                                                            title="Edit section"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteTarget(section)}
                                                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                            title="Delete section"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-white border border-dashed border-slate-300 rounded-xl py-14 px-6 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                                        <Layers className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-900">
                                        No {GROUP_LABELS[group]} sections yet
                                    </h4>
                                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                                        Create a section to assign advisories, subjects, and learners for this level.
                                    </p>
                                    <button
                                        onClick={openCreateModal}
                                        className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-deped-blue hover:bg-deped-blue-dark text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Create Section
                                    </button>
                                </div>
                            )}
                        </section>
                    ))}

                    {filteredSections.length === 0 && searchTerm && (
                        <div className="py-20 text-center">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                                <Search className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900">No matching sections</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                No results for "{searchTerm}". Try a different name or grade level.
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

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
