import { useState, useMemo, useRef, type FormEvent } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, Binary, Beaker, Globe, Compass, GraduationCap, 
    ChevronRight, ArrowLeft, Plus, Settings,
    Sparkles, BookText, X, Trash2, ArrowRight, ChevronLeft
} from 'lucide-react';
import type { Subject } from '../types';
import type { LucideIcon } from 'lucide-react';
import { canEditClassesAndSubjects } from '../lib/rbac';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';

const GRADE_METADATA: Record<string, { icon: LucideIcon; color: string; description: string; bg: string }> = {
    'Grade 1': { icon: BookOpen, color: 'from-pink-500 to-rose-600', bg: 'bg-pink-50', description: 'Emerging Learners - Focus on literacy and numeracy foundations.' },
    'Grade 2': { icon: BookOpen, color: 'from-orange-500 to-amber-600', bg: 'bg-orange-50', description: 'Growing Learners - Developing reading and social skills.' },
    'Grade 3': { icon: BookOpen, color: 'from-yellow-500 to-orange-600', bg: 'bg-yellow-50', description: 'Curious Learners - Introduction to formal science and research.' },
    'Grade 4': { icon: Beaker, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', description: 'Exploratory Learners - Expanding horizons in AP and Science.' },
    'Grade 5': { icon: Beaker, color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50', description: 'Analytical Learners - Critical thinking and complex problem solving.' },
    'Grade 6': { icon: GraduationCap, color: 'from-indigo-500 to-blue-600', bg: 'bg-indigo-50', description: 'Transitioning Learners - Preparing for secondary education.' },
    'Grade 7': { icon: BookOpen, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', description: 'Foundation Year - Core curriculum induction.' },
    'Grade 8': { icon: Beaker, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', description: 'Exploration Year - Scientific and creative focus.' },
    'Grade 9': { icon: Binary, color: 'from-purple-500 to-fuchsia-600', bg: 'bg-purple-50', description: 'Analytical Year - Logic and abstract reasoning.' },
    'Grade 10': { icon: Globe, color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', description: 'Global Year - Citizenship and preparation.' },
    'Grade 11': { icon: Compass, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', description: 'Specialization Year - Specialized tracks.' },
    'Grade 12': { icon: GraduationCap, color: 'from-slate-700 to-slate-900', bg: 'bg-slate-50', description: 'Culmination Year - College and career readiness.' },
};

const UNIVERSAL_SUBJECT_ORDER = [
    'Language',
    'Reading and Literacy',
    'Filipino',
    'English',
    'Mathematics',
    'Science',
    'Araling Panlipunan (AP)',
    'GMRC (Good Manners and Right Conduct)',
    'Values Education',
    'Makabansa',
    'E.P.P.',
    'Technology and Livelihood Education (TLE)',
    'MAPEH',
    'Music and Arts',
    'Physical Education and Health',
    'Specialization',
    '*Arabic Language',
    '*Islamic Values Education',
];

const normalizeSubjectLabel = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').replace(/\s*\([^)]*\)/g, '').trim();

const getPreferredSubjectOrder = (subjectName: string) => {
    const normalized = normalizeSubjectLabel(subjectName);
    const index = UNIVERSAL_SUBJECT_ORDER.findIndex((name) => normalizeSubjectLabel(name) === normalized);
    return index === -1 ? 999 : index;
};

const getGradeNumber = (value: string | undefined | null) => {
    const text = String(value || '').trim().toLowerCase();
    const numeric = text.match(/\d+/);
    if (numeric) return Number(numeric[0]);

    if (/\bone\b|\bi\b/.test(text)) return 1;
    if (/\btwo\b|\bii\b/.test(text)) return 2;
    if (/\bthree\b|\biii\b/.test(text)) return 3;
    if (/\bfour\b|\biv\b/.test(text)) return 4;
    if (/\bfive\b|\bv\b/.test(text)) return 5;
    if (/\bsix\b|\bvi\b/.test(text)) return 6;
    if (/\bseven\b|\bvii\b/.test(text)) return 7;
    if (/\beight\b|\bviii\b/.test(text)) return 8;
    if (/\bnine\b|\bix\b/.test(text)) return 9;
    if (/\bten\b|\bx\b/.test(text)) return 10;
    return null;
};

const sectionMatchesGrade = (section: { section_grade_level?: string; section_name: string }, gradeLabel: string) => {
    const wanted = getGradeNumber(gradeLabel);
    if (!wanted) return false;

    const fromGradeField = getGradeNumber(section.section_grade_level);
    if (fromGradeField === wanted) return true;

    const fromSectionName = getGradeNumber(section.section_name);
    return fromSectionName === wanted;
};

import { STANDARD_SUBJECTS, SPECIAL_SUBJECTS } from '../lib/curriculum';

export function SubjectsPage() {
    const { schoolProfile, subjects, sections, addSubject, deleteSubject, deleteSubjectsBulk, updateSubject, setCurrentView, showNotification } = useAppStore(); 
    const { user } = useAuthStore();
    const canEdit = canEditClassesAndSubjects(user);

    const [viewMode, setViewMode] = useState<'grades' | 'subjects'>('grades');
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        subject_name: '',
        subject_code: '',
        grade_level: '',
        section_id: '',
        teacher_id: ''
    });
    const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
    const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
    const [pendingTemplateLoad, setPendingTemplateLoad] = useState<{ count: number; sectionName: string } | null>(null);
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
    const [curriculumChoice, setCurriculumChoice] = useState<'standard' | 'special' | null>(null);
    const [showCurriculumChoice, setShowCurriculumChoice] = useState(false);
    const [lastLoadedCurriculumType, setLastLoadedCurriculumType] = useState<'standard' | 'special' | null>(null);
    const [showLoadSuccessHighlight, setShowLoadSuccessHighlight] = useState(false);
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const [showAutoLoadConfirm, setShowAutoLoadConfirm] = useState(false);
    const templateLoadInFlightRef = useRef(false);
    const [selectedCategory, setSelectedCategory] = useState<'Elementary' | 'JHS' | 'SHS' | null>(null);

    const CATEGORIES = {
        'Elementary': {
            title: 'Elementary',
            range: 'Grade 1 - 6',
            grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
            icon: BookOpen,
            color: 'from-rose-500 to-pink-600',
            bg: 'bg-rose-50',
            description: 'Foundational years (Matatag & Standard curricula).'
        },
        'JHS': {
            title: 'Junior High School',
            range: 'Grade 7 - 10',
            grades: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
            icon: Binary,
            color: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-50',
            description: 'Secondary core academic and exploratory years.'
        },
        'SHS': {
            title: 'Senior High School',
            range: 'Grade 11 - 12',
            grades: ['Grade 11', 'Grade 12'],
            icon: GraduationCap,
            color: 'from-amber-500 to-orange-600',
            bg: 'bg-amber-50',
            description: 'Specialization tracks and career preparation.'
        }
    };

    const templateMeta = useMemo(() => {
        if (!selectedGrade) return null;
        
        const standard = STANDARD_SUBJECTS[selectedGrade as keyof typeof STANDARD_SUBJECTS] || [];
        const special = SPECIAL_SUBJECTS[selectedGrade as keyof typeof SPECIAL_SUBJECTS] || [];
        
        const getPreview = (list: any[]) => {
            const names = list.slice(0, 3).map(s => `✓ ${s.name}`);
            if (list.length > 3) names.push(`+ ${list.length - 3} more...`);
            return names;
        };

        return {
            standardCount: standard.length,
            specialCount: special.length,
            standardPreview: getPreview(standard),
            specialPreview: getPreview(special),
            isES: selectedGrade.match(/Grade [1-6]/),
            isSHS: selectedGrade.match(/Grade 1[1-2]/)
        };
    }, [selectedGrade]);

    const grades = [
        'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
        'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
    ];

    const selectedSection = useMemo(() => {
        return sections.find(s => s.id === selectedSectionId);
    }, [sections, selectedSectionId]);

    const filteredSubjects = useMemo(() => {
        if (!selectedGrade) return [];
        return subjects
            .filter(s => !s.is_teaching_load) 
            .filter((s) => {
                if (selectedSectionId) return s.section_id === selectedSectionId;
                return s.grade_level === selectedGrade && !s.section_id;
            })
            .sort((a, b) => {
                const orderA = a.order ?? getPreferredSubjectOrder(a.subject_name);
                const orderB = b.order ?? getPreferredSubjectOrder(b.subject_name);
                if (orderA !== orderB) return orderA - orderB;
                return a.subject_name.localeCompare(b.subject_name);
            });
    }, [subjects, selectedSectionId, selectedGrade]);

    const handleGradeClick = (grade: string) => {
        setSelectedGrade(grade);
        const firstSection = sections
            .filter((section) => sectionMatchesGrade(section, grade))
            .sort((a, b) => a.section_name.localeCompare(b.section_name))[0];
        setSelectedSectionId(firstSection?.id || null);
        setViewMode('subjects');
    };

    const handleBackToGrades = () => {
        setSelectedGrade(null);
        setViewMode('grades');
    };

    const handleBackToCategories = () => {
        setSelectedCategory(null);
        setSelectedGrade(null);
        setViewMode('grades');
    };

    const openAddModal = () => {
        setEditingSubjectId(null);
        setFormData({
            subject_name: '',
            subject_code: '',
            grade_level: selectedGrade || '',
            section_id: selectedSectionId || '',
            teacher_id: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (subject: Subject) => {
        setEditingSubjectId(subject.id);
        setFormData({
            subject_name: subject.subject_name,
            subject_code: subject.subject_code || '',
            grade_level: subject.grade_level,
            section_id: subject.section_id || '',
            teacher_id: subject.teacher_id || ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (subject: Subject) => {
        setDeleteTarget(subject);
    };

    const confirmDeleteSubject = async () => {
        if (!deleteTarget) return;
        const subject = deleteTarget;
        setDeleteTarget(null);

        showNotification(`${subject.subject_name} deleted successfully.`, 'success');

        try {
            await deleteSubject(subject.id);
        } catch (error) {
            console.error('Failed to delete subject:', error);
            showNotification(error instanceof Error ? error.message : 'Failed to delete subject.', 'error');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const subjectData: Subject = {
            id: editingSubjectId || `subject-${Date.now()}`,
            subject_name: formData.subject_name,
            subject_code: formData.subject_code,
            grade_level: formData.grade_level,
            section_id: formData.section_id || undefined,
            teacher_id: formData.teacher_id || undefined
        };

        setIsModalOpen(false);

        const savePromise = editingSubjectId
            ? updateSubject(subjectData)
            : addSubject(subjectData);

        void savePromise.catch((error) => {
            console.error('Failed to save subject in background:', error);
            alert(error instanceof Error ? error.message : 'An error occurred while saving the subject.');
        });
    };

    const handleDeleteAll = async () => {
        if (filteredSubjects.length === 0) return;
        
        const ids = filteredSubjects.map(s => s.id);
        setShowDeleteAllConfirm(false);
        
        try {
            await deleteSubjectsBulk(ids);
        } catch (error) {
            console.error('Failed to bulk delete subjects:', error);
        }
    };

    const handleAutoLoadAllGrades = async () => {
        setShowAutoLoadConfirm(false);
        setIsLoadingTemplate(true);
        let totalAdded = 0;
        const timestamp = Date.now();
        
        try {
            for (const grade of grades) {
                const templates = STANDARD_SUBJECTS[grade as keyof typeof STANDARD_SUBJECTS];
                if (!templates) continue;

                const existingGradeSubjects = subjects.filter(s => s.grade_level === grade && !s.section_id && !s.is_teaching_load);
                const existingNames = new Set(existingGradeSubjects.map(s => normalizeSubjectLabel(s.subject_name)));
                
                const templatesToCreate = templates.filter(t => !existingNames.has(normalizeSubjectLabel(t.name)));
                
                for (let i = 0; i < templatesToCreate.length; i++) {
                    const template = templatesToCreate[i];
                    const subjectId = `subject-${timestamp}-${grade.replace(/\s+/g, '-')}-${i}-${Math.random().toString(36).substr(2, 5)}`;
                    
                    const newSubject: Subject = {
                        id: subjectId,
                        subject_name: template.name,
                        subject_code: template.code,
                        grade_level: grade,
                        order: UNIVERSAL_SUBJECT_ORDER.findIndex((name) => normalizeSubjectLabel(name) === normalizeSubjectLabel(template.name))
                    };
                    
                    await addSubject(newSubject);
                    totalAdded++;
                }
            }
            
            if (totalAdded > 0) {
                showNotification(`Successfully auto-loaded ${totalAdded} standard subjects across all grades.`, 'success');
            } else {
                showNotification(`All standard subjects are already loaded.`, 'info');
            }
        } catch (error) {
            console.error("Failed to auto-load all subjects:", error);
            showNotification(`Failed to auto-load subjects: ${error instanceof Error ? error.message : String(error)}`, 'error');
        } finally {
            setIsLoadingTemplate(false);
        }
    };

    const handleLoadStandardSubjects = async () => {
        if (!selectedGrade) return;
        setShowCurriculumChoice(true);
    };

    const loadCurriculumTemplate = async (type: 'standard' | 'special') => {
        if (!selectedGrade) return;

        const targetSection = selectedSection || null;
        const templates = type === 'standard' 
            ? STANDARD_SUBJECTS[selectedGrade as keyof typeof STANDARD_SUBJECTS]
            : SPECIAL_SUBJECTS[selectedGrade as keyof typeof SPECIAL_SUBJECTS];

        if (!templates) {
            showNotification(`No ${type} subjects defined for ${selectedGrade}`, 'info');
            return;
        }

        const existingSectionSubjects = subjects.filter((subject) => {
            if (targetSection) return subject.section_id === targetSection.id;
            return subject.grade_level === selectedGrade && !subject.section_id;
        });
        const existingNames = new Set(existingSectionSubjects.map((subject) => normalizeSubjectLabel(subject.subject_name)));
        const missingTemplates = templates.filter((template) => !existingNames.has(normalizeSubjectLabel(template.name)));

        if (missingTemplates.length === 0) {
            showNotification(`All ${templates.length} ${type} subjects are already loaded for ${targetSection?.section_name || selectedGrade}.`, 'info');
            return;
        }

        setPendingTemplateLoad({ count: missingTemplates.length, sectionName: targetSection?.section_name || selectedGrade });
        setCurriculumChoice(type);
    };

    const confirmLoadStandardSubjects = async () => {
        if (templateLoadInFlightRef.current) {
            return;
        }
        if (!selectedGrade || !pendingTemplateLoad) return;

        const targetSection = selectedSection || null;

        const sectionId = targetSection?.id;
        const gradeLevel = selectedGrade;

        const templates = curriculumChoice === 'standard'
            ? STANDARD_SUBJECTS[gradeLevel as keyof typeof STANDARD_SUBJECTS]
            : SPECIAL_SUBJECTS[gradeLevel as keyof typeof SPECIAL_SUBJECTS];
        
        if (!templates) {
            setPendingTemplateLoad(null);
            setCurriculumChoice(null);
            return;
        }

        setPendingTemplateLoad(null);
        templateLoadInFlightRef.current = true;
        setIsLoadingTemplate(true);
        const timestamp = Date.now();

        try {
            const sectionSubjects = subjects.filter((subject) => {
                if (sectionId) return subject.section_id === sectionId;
                return subject.grade_level === gradeLevel && !subject.section_id;
            });

            const groupedByName = new Map<string, Subject[]>();
            sectionSubjects.forEach((subject) => {
                const key = normalizeSubjectLabel(subject.subject_name);
                const current = groupedByName.get(key) || [];
                current.push(subject);
                groupedByName.set(key, current);
            });

            const duplicateIdsToDelete: string[] = [];
            groupedByName.forEach((entries) => {
                if (entries.length <= 1) return;
                const sorted = [...entries].sort((a, b) => String(a.id).localeCompare(String(b.id)));
                sorted.slice(1).forEach((duplicate) => duplicateIdsToDelete.push(duplicate.id));
            });

            const existingNames = new Set(sectionSubjects.map((subject) => normalizeSubjectLabel(subject.subject_name)));
            const templatesToCreate = templates.filter((template) => !existingNames.has(normalizeSubjectLabel(template.name)));

            if (templatesToCreate.length === 0 && duplicateIdsToDelete.length === 0) {
                showNotification(`All ${templates.length} subjects are already set for ${targetSection?.section_name || gradeLevel}.`, 'info');
                return;
            }

            for (const duplicateId of duplicateIdsToDelete) {
                await deleteSubject(duplicateId);
            }

            for (let i = 0; i < templatesToCreate.length; i++) {
                const template = templatesToCreate[i];
                const subjectId = `subject-${timestamp}-${String(i).padStart(2, '0')}-${Math.random().toString(36).substr(2, 5)}`;
                
                const newSubject: Subject = {
                    id: subjectId,
                    subject_name: template.name,
                    subject_code: template.code,
                    grade_level: gradeLevel,
                    section_id: sectionId,
                    order: UNIVERSAL_SUBJECT_ORDER.findIndex((name) => normalizeSubjectLabel(name) === normalizeSubjectLabel(template.name))
                };
                
                await addSubject(newSubject);
            }

            if (templatesToCreate.length > 0 && duplicateIdsToDelete.length > 0) {
                showNotification(`Added ${templatesToCreate.length} subjects and removed ${duplicateIdsToDelete.length} duplicate copies.`, 'success');
            } else if (templatesToCreate.length > 0) {
                const typeLabel = curriculumChoice === 'standard' ? 'standard' : 'special (with Specialization)';
                showNotification(`All ${templatesToCreate.length} ${typeLabel} subjects added successfully!`, 'success');
                setLastLoadedCurriculumType(curriculumChoice);
                setShowLoadSuccessHighlight(true);
                setTimeout(() => setShowLoadSuccessHighlight(false), 5000);
            } else {
                showNotification(`Removed ${duplicateIdsToDelete.length} duplicate subject copies.`, 'success');
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error("[SUBJECTS] Failed to commit batch:", errorMsg);
            showNotification(`Failed to add subjects: ${errorMsg}`, 'error');
        } finally {
            setIsLoadingTemplate(false);
            templateLoadInFlightRef.current = false;
            setCurriculumChoice(null);
        }
    };

    const handleDragStart = (subjectId: string) => {
        setDraggedSubjectId(subjectId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (targetSubjectId: string) => {
        if (!draggedSubjectId || draggedSubjectId === targetSubjectId) {
            setDraggedSubjectId(null);
            return;
        }

        const items = [...filteredSubjects];
        const dragIdx = items.findIndex(s => s.id === draggedSubjectId);
        const dropIdx = items.findIndex(s => s.id === targetSubjectId);

        if (dragIdx < 0 || dropIdx < 0) return;

        const [moved] = items.splice(dragIdx, 1);
        items.splice(dropIdx, 0, moved);

        for (let i = 0; i < items.length; i++) {
            await updateSubject({ ...items[i], order: i });
        }
        setDraggedSubjectId(null);
    };

    const moveSubject = async (subjectId: string, direction: 'up' | 'down') => {
        const items = [...filteredSubjects];
        const idx = items.findIndex(s => s.id === subjectId);
        if (idx < 0) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= items.length) return;

        [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];

        for (let i = 0; i < items.length; i++) {
            await updateSubject({ ...items[i], order: i });
        }
    };

    return (
        <div className="space-y-8 pb-12 relative min-h-[80vh]">
            {/* Global Page Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0 overflow-hidden">
                <img 
                    src={schoolProfile?.logo_url || `${import.meta.env.BASE_URL}school-logo.png`} 
                    className="w-[800px] h-[800px] object-contain grayscale scale-150 -rotate-12"
                    alt=""
                />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                    <div className="flex items-center gap-2 text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">
                        <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => { setViewMode('grades'); setSelectedCategory(null); }}>Grades</span>
                        {viewMode !== 'grades' && (
                            <>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-slate-900">{selectedGrade}</span>
                            </>
                        )}
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        {viewMode === 'grades' && 'Subject Hub'}
                        {viewMode === 'subjects' && selectedGrade}
                        {viewMode === 'grades' && <Sparkles className="w-6 h-6 text-amber-500" />}
                        {viewMode === 'subjects' && filteredSubjects.length > 0 && (
                            <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                                    lastLoadedCurriculumType === 'special' 
                                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' 
                                        : 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300'
                                } ${showLoadSuccessHighlight ? 'ring-4' : ''}`}
                            >
                                {lastLoadedCurriculumType === 'special' ? '⭐ Special' : '📚 Standard'}
                            </motion.div>
                        )}
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                        {viewMode === 'grades' && 'Organize curriculum for each level.'}
                        {viewMode === 'subjects' && `Configuring subjects for ${selectedGrade}.`}
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    {viewMode !== 'grades' && (
                        <button 
                            onClick={handleBackToGrades}
                            className="h-12 px-6 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 group shadow-sm active:scale-95"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back
                        </button>
                    )}
                    {viewMode === 'grades' && canEdit && (
                        <button 
                            onClick={() => setShowAutoLoadConfirm(true)} 
                            disabled={isLoadingTemplate}
                            className="h-12 px-6 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50"
                        >
                            <Sparkles className="w-4 h-4" />
                            Auto-Load All Standards
                        </button>
                    )}
                    {viewMode === 'subjects' && canEdit && (
                        <div className="flex items-center gap-2">
                            {filteredSubjects.length > 0 && (
                                <button 
                                    onClick={() => setShowDeleteAllConfirm(true)}
                                    className="h-12 px-5 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-all flex items-center gap-2 border border-rose-100 active:scale-95"
                                    title="Delete all subjects in this view"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete All
                                </button>
                            )}
                            <button 
                                onClick={openAddModal} 
                                className="h-12 px-8 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl shadow-indigo-200 active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                Add New Subject
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'grades' && (
                    <motion.div 
                        key="grades-categories"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8 relative"
                    >
                        {!selectedCategory ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                    {(Object.entries(CATEGORIES) as [keyof typeof CATEGORIES, any][]).map(([key, category]) => (
                                        <motion.button
                                            key={key}
                                            whileHover={{ scale: 1.02, y: -5 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedCategory(key)}
                                            className="relative group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 transition-all text-left overflow-hidden h-full flex flex-col"
                                        >
                                            <div className={`absolute top-0 right-0 w-32 h-32 ${category.bg} rounded-bl-[5rem] -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform`} />
                                            
                                            <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${category.color} flex items-center justify-center text-white shadow-lg mb-6 group-hover:rotate-6 transition-transform`}>
                                                <category.icon className="w-8 h-8" />
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="text-2xl font-black text-slate-900 mb-1">{category.title}</h3>
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{category.range}</p>
                                                <p className="text-slate-500 text-sm leading-relaxed mb-6">{category.description}</p>
                                            </div>

                                            <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Open Category</span>
                                                <div className={`w-10 h-10 rounded-full bg-slate-50 group-hover:bg-gradient-to-br ${category.color} flex items-center justify-center text-slate-400 group-hover:text-white transition-all`}>
                                                    <ArrowRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Quick Guide Footer */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10 pt-16 mt-16 border-t border-slate-100"
                                >
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 rounded-[1rem] bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-2">1. Select Level</h4>
                                            <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-wider opacity-80">Choose a department (Elementary, JHS, or SHS) to explore its specific grade levels and curriculum tracks.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 rounded-[1rem] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                                            <Settings className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-2">2. Configure Subjects</h4>
                                            <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-wider opacity-80">Inside each grade, you can add subjects manually or load standard DepEd templates to ensure academic compliance.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-2">3. Automate Workflow</h4>
                                            <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-wider opacity-80">Configured subjects are automatically synced to class records and SF9/SF10 reports for seamless grading.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={handleBackToCategories}
                                            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-deped-blue hover:border-deped-blue transition-all shadow-sm"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 leading-tight">{CATEGORIES[selectedCategory].title}</h2>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{CATEGORIES[selectedCategory].range}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {CATEGORIES[selectedCategory].grades.map((grade) => {
                                        const meta = GRADE_METADATA[grade];
                                        const Icon = meta.icon;
                                        const count = new Set(subjects.filter(s => s.grade_level === grade && !s.is_teaching_load).map(s => s.subject_name)).size;
                                        const sectionCount = sections.filter(s => sectionMatchesGrade(s, grade)).length;

                                        return (
                                            <motion.div
                                                key={grade}
                                                whileHover={{ scale: 1.03, y: -5 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleGradeClick(grade)}
                                                className="group bg-white rounded-[2rem] p-6 border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-2xl transition-all cursor-pointer overflow-hidden relative"
                                            >
                                                <div className={`absolute top-0 right-0 w-24 h-24 ${meta.bg} rounded-bl-full -mr-8 -mt-8 opacity-40 group-hover:scale-110 transition-transform`} />
                                                
                                                <div className="relative z-10">
                                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-white shadow-lg mb-6 group-hover:rotate-6 transition-transform`}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>

                                                    <h3 className="text-xl font-black text-slate-900 mb-2">{grade}</h3>
                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">
                                                        {meta.description}
                                                    </p>

                                                    <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
                                                        <div className="flex flex-col">
                                                            <div className="text-xl font-black text-slate-900 leading-none mb-1">{count}</div>
                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subjects</div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="text-xl font-black text-slate-900 leading-none mb-1">{sectionCount}</div>
                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sections</div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-auto group-hover:text-deped-blue transition-colors">
                                                            Open Subjects
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* View: Subjects */}
                {viewMode === 'subjects' && (
                    <motion.div 
                        key="subjects"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
                    >
                        {!selectedSection && filteredSubjects.length === 0 ? (
                            <div className="p-24 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <BookText className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Empty Curriculum</h3>
                                <p className="text-slate-500 mt-2 max-w-sm mx-auto">This grade doesn't have any subjects yet. You can add them manually or use the level template.</p>
                                {canEdit && (
                                    <button 
                                        onClick={handleLoadStandardSubjects} 
                                        disabled={isLoadingTemplate}
                                        className="mt-8 h-12 px-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl"
                                    >
                                        {isLoadingTemplate ? 'Loading...' : 'Load Level Template'}
                                    </button>
                                )}
                                {!selectedSection && (
                                    <button onClick={() => setCurrentView('institute')} className="mt-4 block mx-auto text-indigo-600 font-black text-xs uppercase tracking-tighter hover:underline">Go to Institute Profile</button>
                                )}
                            </div>
                        ) : filteredSubjects.length === 0 ? (
                            <div className="p-24 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <BookText className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Empty Curriculum</h3>
                                <p className="text-slate-500 mt-2 max-w-sm mx-auto">This grade doesn't have any subjects yet. You can add them manually or use the level template.</p>
                                {canEdit && (
                                    <button 
                                        onClick={handleLoadStandardSubjects} 
                                        disabled={isLoadingTemplate}
                                        className="mt-8 h-12 px-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl"
                                    >
                                        {isLoadingTemplate ? 'Loading...' : 'Load Level Template'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto p-4">
                                <table className="w-full text-left border-separate border-spacing-y-3">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            {canEdit && <th className="px-6 py-4 w-16 text-center">Pos</th>}
                                            <th className="px-6 py-4">Subject Info</th>
                                            {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSubjects.map((subject, idx) => (
                                            <motion.tr
                                                key={subject.id}
                                                layout
                                                draggable={canEdit}
                                                onDragStart={() => handleDragStart(subject.id)}
                                                onDragOver={handleDragOver}
                                                onDrop={() => handleDrop(subject.id)}
                                                onDragEnd={() => setDraggedSubjectId(null)}
                                                className={`group rounded-3xl bg-white border border-slate-50 hover:bg-slate-50/50 hover:border-indigo-100 transition-all ${
                                                    draggedSubjectId === subject.id ? 'opacity-40 bg-indigo-50 border-indigo-200' : ''
                                                } ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                            >
                                                {canEdit && (
                                                    <td className="px-6 py-6 text-center">
                                                        <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => moveSubject(subject.id, 'up')}
                                                                disabled={idx === 0}
                                                                className="text-slate-400 hover:text-indigo-600 disabled:opacity-0 transition-colors"
                                                            >
                                                                <ChevronRight className="w-4 h-4 -rotate-90" />
                                                            </button>
                                                            <div className="text-[10px] font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</div>
                                                            <button
                                                                onClick={() => moveSubject(subject.id, 'down')}
                                                                disabled={idx === filteredSubjects.length - 1}
                                                                className="text-slate-400 hover:text-indigo-600 disabled:opacity-0 transition-colors"
                                                            >
                                                                <ChevronRight className="w-4 h-4 rotate-90" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-indigo-600 text-sm">
                                                            {subject.subject_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 text-lg tracking-tight uppercase">{subject.subject_name}</div>
                                                            {subject.subject_code && <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">{subject.subject_code}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                {canEdit && (
                                                    <td className="px-6 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEdit(subject)}
                                                                className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                                            >
                                                                <Settings className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(subject)}
                                                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Curriculum Choice Dialog */}
            {showCurriculumChoice && (
                <motion.div 
                    key="curriculum-choice"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => {}}
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-8">
                            <h2 className="text-2xl font-black text-white">Choose Curriculum Type</h2>
                            <p className="text-emerald-100 text-sm mt-2">Select which subject template to load for {selectedGrade}</p>
                        </div>
                        
                        <div className="p-8 grid md:grid-cols-2 gap-6">
                            {/* Standard Option */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setShowCurriculumChoice(false);
                                    loadCurriculumTemplate('standard');
                                }}
                                className="p-6 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                            >
                                <div className="text-3xl mb-3">📚</div>
                                <h3 className="text-lg font-black text-slate-900 mb-2">
                                    {templateMeta?.isES ? 'Matatag / Standard' : 'Standard'}
                                </h3>
                                <p className="text-sm text-slate-600 mb-4">
                                    {templateMeta?.isES ? 'Official DepEd Primary curriculum' : 'DepEd standard curriculum'}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                                        {templateMeta?.standardCount} Subjects
                                    </span>
                                    <span className="text-emerald-600 font-bold">→</span>
                                </div>
                                <div className="mt-3 text-xs text-slate-500 space-y-1">
                                    {templateMeta?.standardPreview.map((line, i) => (
                                        <div key={i}>{line}</div>
                                    ))}
                                </div>
                            </motion.button>

                            {/* Special Option */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setShowCurriculumChoice(false);
                                    loadCurriculumTemplate('special');
                                }}
                                className="p-6 rounded-2xl border-2 border-blue-300 bg-blue-50 hover:border-blue-500 hover:bg-blue-100 transition-all text-left ring-2 ring-blue-200"
                            >
                                <div className="text-3xl mb-3">⭐</div>
                                <h3 className="text-lg font-black text-blue-900 mb-2">
                                    {templateMeta?.isES ? 'Enhanced / Special' : 'Special'}
                                </h3>
                                <p className="text-sm text-blue-700 mb-4">
                                    {templateMeta?.isES ? 'Curriculum with extra electives' : 'Extra subject included'}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-blue-600 bg-blue-200 px-3 py-1 rounded-full">
                                        {templateMeta?.specialCount} Subjects
                                    </span>
                                    <span className="text-blue-600 font-bold">→</span>
                                </div>
                                <div className="mt-3 text-xs text-blue-700 space-y-1">
                                    {templateMeta?.specialPreview.map((line, i) => (
                                        <div key={i}>{line}</div>
                                    ))}
                                </div>
                            </motion.button>
                        </div>

                        <div className="bg-slate-50 px-8 py-6 border-t border-slate-200">
                            <button
                                onClick={() => {
                                    setShowCurriculumChoice(false);
                                    setCurriculumChoice(null);
                                    setPendingTemplateLoad(null);
                                }}
                                className="w-full py-3 text-slate-600 font-bold hover:text-slate-900 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            <ConfirmationModal
                open={pendingTemplateLoad !== null}
                title={pendingTemplateLoad ? `Add ${pendingTemplateLoad.count} ${curriculumChoice === 'special' ? 'special' : 'standard'} subjects?` : ''}
                message={pendingTemplateLoad ? `This will add ${curriculumChoice === 'special' ? 'special subjects (with Specialization)' : 'standard subjects'} to ${pendingTemplateLoad.sectionName}.` : ''}
                details="You can still edit the subjects after they are added."
                confirmLabel="Add Subjects"
                intent="warning"
                onConfirm={confirmLoadStandardSubjects}
                onCancel={() => {
                    setPendingTemplateLoad(null);
                    setCurriculumChoice(null);
                }}
            />

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-deped-blue text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
                            <h3 className="text-xl font-bold">{editingSubjectId ? 'Edit Subject' : 'Add Subject'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-gray-200">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject Name</label>
                                <input
                                    type="text"
                                    value={formData.subject_name}
                                    onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                                    className="form-input mt-1 block w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject Code (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.subject_code}
                                    onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                                    className="form-input mt-1 block w-full"
                                />
                            </div>
                            <div>
                                <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">
                                    {editingSubjectId ? 'Update' : 'Add'}
                                </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                open={showDeleteAllConfirm}
                title={`Delete All Subjects for ${selectedSection?.section_name || selectedGrade}?`}
                message={`This will permanently remove ALL ${filteredSubjects.length} subjects from the Hub.`}
                details="This action cannot be undone and will also clear these subjects from any section teaching loads."
                confirmLabel="Yes, Delete All"
                intent="danger"
                onConfirm={handleDeleteAll}
                onCancel={() => setShowDeleteAllConfirm(false)}
            />

            <ConfirmationModal
                open={deleteTarget !== null}
                title={deleteTarget ? `Delete ${deleteTarget.subject_name}?` : ''}
                message={deleteTarget ? `This will permanently remove ${deleteTarget.subject_name} from the system.` : ''}
                details={deleteTarget ? 'This action cannot be undone.' : ''}
                confirmLabel="Delete Subject"
                intent="danger"
                onConfirm={confirmDeleteSubject}
                onCancel={() => setDeleteTarget(null)}
            />

            <ConfirmationModal
                open={showAutoLoadConfirm}
                title="Auto-Load Standard Subjects for All Grades?"
                message="This will automatically populate all grade levels (Grade 1 to 12) with their standard DepEd subjects."
                details="Subjects that already exist will not be duplicated. This process may take a few seconds."
                confirmLabel="Yes, Load All Subjects"
                intent="warning"
                onConfirm={handleAutoLoadAllGrades}
                onCancel={() => setShowAutoLoadConfirm(false)}
            />
        </div>
    );
}
