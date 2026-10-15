import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../stores/app-store';
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
    X,
    TableProperties,
    Copy,
    AlertTriangle,
    Sparkles,
    FlaskConical
} from 'lucide-react';
import { SectionForm } from '../components/sections/SectionForm';
import { TeachingLoadMatrixModal } from '../components/sections/TeachingLoadMatrixModal';
import { TestSectionGeneratorModal } from '../components/sections/TestSectionGeneratorModal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { AnimatePresence, motion } from 'framer-motion';
import { isStudentInSection } from '../utils/grading-helpers';
import { getAllowedDepartmentCategories } from '../lib/curriculum';
import { getTestSectionStats } from '../utils/testSectionGenerator';
import { isTestSection } from '../utils/testSectionGuards';
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

const getGradeTheme = (gradeLevel: string) => {
    const gl = (gradeLevel || '').toLowerCase();
    const num = parseInt(gl.replace(/\D/g, '')) || 0;
    if (gl.includes('kinder') || (num >= 1 && num <= 6)) {
        return {
            badge: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-500/20',
            glow: 'group-hover:border-sky-400/40',
            accent: 'from-sky-400 to-cyan-400 dark:from-sky-500 dark:to-cyan-500',
            iconBg: 'bg-gradient-to-br from-sky-500 to-cyan-600 dark:from-sky-600 dark:to-cyan-700',
            hoverBorder: 'hover:border-sky-300/70 dark:hover:border-sky-500/30',
            label: 'Elementary'
        };
    }
    if (num >= 7 && num <= 10) {
        return {
            badge: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-500/20',
            glow: 'group-hover:border-indigo-400/40',
            accent: 'from-indigo-400 to-blue-500 dark:from-indigo-500 dark:to-blue-600',
            iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600 dark:from-indigo-600 dark:to-blue-700',
            hoverBorder: 'hover:border-indigo-300/70 dark:hover:border-indigo-500/30',
            label: 'Junior High'
        };
    }
    return {
        badge: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-500/20',
        glow: 'group-hover:border-purple-400/40',
        accent: 'from-purple-400 to-fuchsia-500 dark:from-purple-500 dark:to-fuchsia-600',
        iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600 dark:from-purple-600 dark:to-fuchsia-700',
        hoverBorder: 'hover:border-purple-300/70 dark:hover:border-purple-500/30',
        label: 'Senior High'
    };
};

const GROUP_LABELS: Record<string, string> = {
    'ALL': 'All Sections',
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
                                    currentName.toLowerCase().includes('maria') ||
                                    currentName.toLowerCase().includes('santos') ||
                                    currentName.toLowerCase() === 'tba' ||
                                    currentName === '';
                const isMockId = !section.adviser_id || section.adviser_id.startsWith('adv-');
                if (isStale && (isPlaceholder || isMockId)) {
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
    const [isCloneModal, setIsCloneModal] = useState(false);
    const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('ALL');

    const testStats = useMemo(() => getTestSectionStats(sections, students), [sections, students]);

    const filteredSections = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return sections.filter(s => {
            // In production builds (shipped to clients), never display test sections
            if (!import.meta.env.DEV && isTestSection(s)) return false;

            return (
                s.section_name.toLowerCase().includes(term) ||
                s.section_grade_level.toLowerCase().includes(term) ||
                (s.track && s.track.toLowerCase().includes(term)) ||
                (s.strand && s.strand.toLowerCase().includes(term)) ||
                (s.cluster && s.cluster.toLowerCase().includes(term))
            );
        }).sort((a, b) => {
            const gradeA = parseInt(a.section_grade_level.replace(/\D/g, '')) || 0;
            const gradeB = parseInt(b.section_grade_level.replace(/\D/g, '')) || 0;
            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, searchTerm]);

    const getStudentStats = (sec: Section) => {
        const secStudents = students.filter(s => isStudentInSection(s, sec));
        const total = secStudents.length;
        let males = 0;
        let females = 0;
        secStudents.forEach(s => {
            const g = (s.gender || '').trim().toLowerCase();
            if (g === 'male' || g === 'm') males++;
            else if (g === 'female' || g === 'f') females++;
        });
        return { total, males, females };
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
            } else {
                groups['ELEMENTARY'].push(s);
            }
        });

        return groups;
    }, [filteredSections]);

    const handleEdit = (section: Section) => {
        setEditingSection(section);
        setIsCloneModal(false);
        setIsModalOpen(true);
    };

    const handleClone = (section: Section) => {
        setEditingSection(section);
        setIsCloneModal(true);
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
        setIsCloneModal(false);
        setIsModalOpen(true);
    };

    const allowedDepts = useMemo(() => {
        const existingGrades = sections.map(s => s.section_grade_level).filter(Boolean);
        return getAllowedDepartmentCategories(schoolProfile?.grade_levels_offered, 'AUTO', existingGrades);
    }, [schoolProfile?.grade_levels_offered, sections]);

    const allowedDeptGroups = useMemo(() => {
        const map: Record<'Elementary' | 'JHS' | 'SHS', string> = {
            Elementary: 'ELEMENTARY',
            JHS: 'JUNIOR HIGH SCHOOL',
            SHS: 'SENIOR HIGH SCHOOL',
        };
        return new Set(allowedDepts.map(d => map[d]));
    }, [allowedDepts]);

    const visibleGroups = Object.entries(groupedSections).filter(
        ([group, groupSections]) => {
            if (searchTerm) return groupSections.length > 0;
            if (groupSections.length > 0) {
                return activeCategory === 'ALL' || activeCategory === group;
            }
            return allowedDeptGroups.has(group) && activeCategory === group;
        }
    );

    return (
        <div className="space-y-6 pb-24 relative min-h-full">
            {/* School Logo Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] dark:opacity-[0.06] pointer-events-none select-none z-0 overflow-hidden">
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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between relative z-10">
                <div className="flex items-center bg-slate-100 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-lg p-0.5 sm:p-1 self-start overflow-x-auto max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {Object.keys(GROUP_LABELS)
                        .filter(group => group === 'ALL' || allowedDeptGroups.has(group) || (groupedSections[group]?.length || 0) > 0)
                        .map((group) => {
                        const isActive = !searchTerm && activeCategory === group;
                        const count = group === 'ALL'
                            ? filteredSections.length
                            : (groupedSections[group]?.length || 0);
                        return (
                            <button
                                key={group}
                                onClick={() => {
                                    setActiveCategory(group);
                                    if (searchTerm) setSearchTerm('');
                                }}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                                    isActive
                                        ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                {GROUP_LABELS[group]}
                                {count > 0 && (
                                    <span className={`ml-1 text-[11px] ${isActive ? 'text-slate-400 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    <div className="relative w-full sm:w-48 md:w-56 lg:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search sections..."
                            className="w-full pl-8 pr-8 py-1.5 text-xs sm:text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-deped-blue focus:ring-2 focus:ring-deped-blue/15"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                title="Clear search"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setIsMatrixModalOpen(true)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800/40 transition-colors active:scale-[0.98] cursor-pointer shadow-xs whitespace-nowrap"
                        title="Configure teaching subjects across all sections on one screen"
                    >
                        <TableProperties className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span className="hidden sm:inline">Teaching Load Matrix</span>
                    </button>

                    {import.meta.env.DEV && (
                        <button
                            onClick={() => setIsTestModalOpen(true)}
                            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border transition-colors active:scale-[0.98] cursor-pointer shadow-xs whitespace-nowrap ${
                                testStats.totalTestSections > 0
                                    ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700/50'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                            }`}
                            title="Test curriculum programs and generate/clear sample Grade 1–12 sections"
                        >
                            <FlaskConical className={`w-3.5 h-3.5 ${testStats.totalTestSections > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
                            <span>Test Sections (G1–12)</span>
                            {testStats.totalTestSections > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200/80 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100">
                                    {testStats.totalTestSections}
                                </span>
                            )}
                        </button>
                    )}

                    <button
                        onClick={openCreateModal}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-deped-blue hover:bg-deped-blue-dark text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors active:scale-[0.98] cursor-pointer shadow-xs whitespace-nowrap"
                    >
                        <Plus className="w-3.5 h-3.5" />
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
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{GROUP_LABELS[group]}</h3>
                                <span className="text-sm text-slate-400 dark:text-slate-400 font-medium">
                                    {groupSections.length} {groupSections.length === 1 ? 'section' : 'sections'}
                                </span>
                            </div>

                            {groupSections.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {groupSections.map((section) => {
                                        const teachingSubjects = section.is_teaching_load
                                            ? [...(section.teaching_subjects || section.taught_subjects || [])].sort((a, b) => a.localeCompare(b))
                                            : [];
                                        const curriculumSubjects = section.is_advisory
                                            ? [...(section.taught_subjects || [])].sort((a, b) => a.localeCompare(b))
                                            : [];
                                        const isGrade11 = (section.section_grade_level || '').includes('Grade 11');
                                        const isGrade12 = (section.section_grade_level || '').includes('Grade 12');
                                        const gradeTheme = getGradeTheme(section.section_grade_level);
                                        const stats = getStudentStats(section);

                                        return (
                                            <div
                                                key={section.id}
                                                className={`group relative bg-white dark:bg-[#0c1222] border border-slate-200/80 dark:border-white/8 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/30 ${gradeTheme.hoverBorder} hover:-translate-y-1`}
                                            >
                                                {/* Top Gradient Accent Bar */}
                                                <div className={`h-1 w-full bg-linear-to-r ${gradeTheme.accent}`} />

                                                <div className="p-5 pb-4 flex flex-col flex-1">
                                                    {/* Header: Grade Icon + Title + Role Badges */}
                                                    <div className="flex items-start gap-3.5">
                                                        {/* Grade Badge - Large gradient icon */}
                                                        <div className={`shrink-0 w-11 h-11 rounded-xl ${gradeTheme.iconBg} flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-slate-300/30 dark:shadow-black/40 ring-1 ring-white/10`}>
                                                            {getGradeBadge(section.section_grade_level)}
                                                        </div>

                                                        {/* Title + Adviser + Role pills */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0 flex-1">
                                                                    <h4 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight leading-snug truncate group-hover:text-deped-blue dark:group-hover:text-blue-400 transition-colors" title={section.section_name}>
                                                                        {section.section_name}
                                                                    </h4>
                                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                                        {section.section_grade_level}
                                                                    </p>
                                                                </div>

                                                                {/* Role Badges */}
                                                                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                                                    {section.is_advisory && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/12 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/25 text-[10px] font-semibold rounded-md" title="Advisory Class">
                                                                            <Shield className="w-2.5 h-2.5" />
                                                                            Advisory
                                                                        </span>
                                                                    )}
                                                                    {section.is_teaching_load && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/25 text-[10px] font-semibold rounded-md" title="Teaching Load">
                                                                            <BookMarked className="w-2.5 h-2.5" />
                                                                            Teaching
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Senior High Track / Strand / Cluster */}
                                                    {(isGrade11 || isGrade12) && (section.track || section.cluster || section.strand) && (
                                                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                                            {section.track && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-500/20">
                                                                    {section.track} Track
                                                                </span>
                                                            )}
                                                            {(section.cluster || section.strand) && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20 max-w-[calc(100%-8px)]" title={section.cluster || section.strand}>
                                                                    <Sparkles className="w-2.5 h-2.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                                                                    <span className="truncate">{section.cluster || section.strand}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Subject Pills Section */}
                                                    <div className="mt-3.5 flex-1">
                                                        {teachingSubjects.length > 0 ? (
                                                            <div className="rounded-xl bg-slate-50/70 dark:bg-white/3 border border-slate-100 dark:border-white/5 p-3 space-y-2">
                                                                <div className="text-[10px] font-bold text-amber-600/90 dark:text-amber-400/90 uppercase tracking-wider flex items-center gap-1.5">
                                                                    <BookMarked className="w-3 h-3" />
                                                                    Teaching Load · {teachingSubjects.length}
                                                                </div>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {teachingSubjects.slice(0, 5).map(subj => (
                                                                        <span
                                                                            key={subj}
                                                                            className="px-2 py-0.5 bg-white dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-200/50 dark:border-amber-800/40 text-[11px] font-medium rounded-md shadow-xs"
                                                                            title={subj}
                                                                        >
                                                                            {getShortSubjectName(subj)}
                                                                        </span>
                                                                    ))}
                                                                    {teachingSubjects.length > 5 && (
                                                                        <span 
                                                                            className="px-2 py-0.5 bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[11px] font-semibold rounded-md border border-amber-200/60 dark:border-amber-700/30 cursor-default"
                                                                            title={teachingSubjects.slice(5).join(', ')}
                                                                        >
                                                                            +{teachingSubjects.length - 5} more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : section.is_advisory && curriculumSubjects.length > 0 ? (
                                                            <div className="rounded-xl bg-slate-50/70 dark:bg-white/3 border border-slate-100 dark:border-white/5 p-3 space-y-2">
                                                                <div className="text-[10px] font-bold text-indigo-600/90 dark:text-indigo-400/90 uppercase tracking-wider flex items-center gap-1.5">
                                                                    <BookOpen className="w-3 h-3" />
                                                                    Curriculum · {curriculumSubjects.length}
                                                                </div>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {curriculumSubjects.slice(0, 5).map(subj => (
                                                                        <span
                                                                            key={subj}
                                                                            className="px-2 py-0.5 bg-white dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40 text-[11px] font-medium rounded-md shadow-xs"
                                                                            title={subj}
                                                                        >
                                                                            {getShortSubjectName(subj)}
                                                                        </span>
                                                                    ))}
                                                                    {curriculumSubjects.length > 5 && (
                                                                        <span 
                                                                            className="px-2 py-0.5 bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold rounded-md border border-indigo-200/60 dark:border-indigo-700/30 cursor-default"
                                                                            title={curriculumSubjects.slice(5).join(', ')}
                                                                        >
                                                                            +{curriculumSubjects.length - 5} more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : section.is_advisory && curriculumSubjects.length === 0 ? (
                                                            <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50/60 dark:bg-amber-950/25 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30 rounded-xl text-[11px] font-medium">
                                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                                <span>No official curriculum configured</span>
                                                            </div>
                                                        ) : (
                                                            <div className="py-3 px-3 rounded-xl bg-slate-50/60 dark:bg-white/2 border border-dashed border-slate-200/80 dark:border-white/8 text-center">
                                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">No subjects configured</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Card Footer */}
                                                <div className="px-5 py-3 border-t border-slate-100/80 dark:border-white/5 bg-slate-50/40 dark:bg-white/1.5 flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                                                        <span className="inline-flex items-center gap-1.5" title={`${stats.males} Male · ${stats.females} Female`}>
                                                            <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                            <strong className="font-semibold text-slate-700 dark:text-slate-200">{stats.total}</strong>
                                                            <span className="text-slate-400 dark:text-slate-500">({stats.males}M · {stats.females}F)</span>
                                                        </span>
                                                        <span className="text-slate-300 dark:text-slate-600">|</span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <BookOpen className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                                            <span>
                                                                {section.is_teaching_load 
                                                                    ? `${(section.teaching_subjects?.length ?? section.taught_subjects?.length ?? 0)} taught`
                                                                    : `${(section.taught_subjects?.length || 0)} subjects`}
                                                            </span>
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-0.5">
                                                        <button
                                                            onClick={() => handleClone(section)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all duration-150 cursor-pointer active:scale-90"
                                                            title="Clone section"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(section)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-deped-blue dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-150 cursor-pointer active:scale-90"
                                                            title="Edit section"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteTarget(section)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-150 cursor-pointer active:scale-90"
                                                            title="Delete section"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-[#0d1225] border border-dashed border-slate-300 dark:border-white/10 rounded-xl py-14 px-6 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-4">
                                        <Layers className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                        No {GROUP_LABELS[group]} sections yet
                                    </h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
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

                    {visibleGroups.length === 0 && !searchTerm && (
                        <div className="bg-white dark:bg-[#0d1225] border border-dashed border-slate-300 dark:border-white/10 rounded-xl py-14 px-6 text-center">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-4">
                                <Layers className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                {activeCategory === 'ALL' ? 'No sections yet' : `No ${GROUP_LABELS[activeCategory]} sections yet`}
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                                Create a section to assign advisories, subjects, and learners.
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
                        isClone={isCloneModal}
                        onClose={() => {
                            setIsModalOpen(false);
                            setIsCloneModal(false);
                        }}
                    />
                )}
            </AnimatePresence>

            <TeachingLoadMatrixModal
                isOpen={isMatrixModalOpen}
                onClose={() => setIsMatrixModalOpen(false)}
            />

            {import.meta.env.DEV && (
                <TestSectionGeneratorModal
                    isOpen={isTestModalOpen}
                    onClose={() => setIsTestModalOpen(false)}
                />
            )}

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
