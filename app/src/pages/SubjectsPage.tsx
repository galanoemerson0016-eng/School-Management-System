import { useState, useMemo, useEffect, type FormEvent, Fragment } from 'react';
import { useAppStore } from '../stores/app-store';
import { useAuthStore } from '../stores/auth-store';
import { db } from '../services/database';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, Binary, Beaker, Globe, Compass, GraduationCap, 
    ChevronRight, ArrowLeft, Plus, Settings,
    CheckCircle2, BookText, X, Trash2, ArrowRight, ChevronLeft,
    Search, Eye, EyeOff, Users, Shield, ShieldCheck, ShieldAlert, Layers, Sparkles,
    AlertTriangle, Scale
} from 'lucide-react';
import type { Subject, ClassRecord, HPSRecord } from '../types';
import type { LucideIcon } from 'lucide-react';
import { canEditClassesAndSubjects } from '../lib/rbac';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { SubjectEnrollmentModal } from '../components/sections/SubjectEnrollmentModal';
import { isMatchingSubject, normalizeGrade12PESubjectName } from '../utils/grading-helpers';
import { generateDeterministicSubjectId, reconcileOrphanedGradesAndSubjects } from '../utils/grade-reconciliation';
import { normalizeSubjectName, getCanonicalSubjectKey } from '../lib/subjectConfig';
import { normalizeWeightPercent } from '../lib/grading';

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

import { 
    STANDARD_SUBJECTS, 
    SPECIAL_SUBJECTS, 
    SPSTEM_SUBJECTS,
    JHS_STE_ELECTIVES,
    SPA_MAJORS,
    SPJ_SUBJECTS,
    SPS_SUBJECTS,
    SPFL_LANGUAGES,
    SSES_SUBJECTS,
    SPTVE_SPECIALIZATIONS,
    ALIVE_SUBJECTS,
    type SpecialSubjectItem,
    getCurriculumTemplatesForSection,
    getDefaultTermForSubject, 
    GRADE_11_CORE_SUBJECTS, 
    isGrade11CoreSubject,
    getShsCategoryForSubject,
    getCategoryForSubject,
    classifyJhsSubjectTrack,
    getDepEdStandardWeights,
    type JhsTrackFilter,
    SSHS_G11_CORE_SUBJECTS,
    SSHS_G11_ACADEMIC_SUBJECTS,
    SSHS_G12_ACADEMIC_SUBJECTS,
    SSHS_G12_TECHPRO_SUBJECTS,
    SHS_G12_CORE_SUBJECTS,
    SHS_G12_APPLIED_SUBJECTS,
    SHS_OLD_STRAND_SUBJECTS,
    SHS_G12_ALL_OLD_SUBJECTS,
    normalizeOfferedTerms
} from '../lib/curriculum';

export type CurriculumChoiceType = 
    | 'standard' 
    | 'special' 
    | 'core_only' 
    | 'program' 
    | 'program_ste' 
    | 'program_spstem' 
    | 'program_spa' 
    | 'program_spj' 
    | 'program_sps' 
    | 'program_spfl' 
    | 'program_sptve' 
    | 'program_sses' 
    | 'program_alive'
    | 'sshs_academic'
    | 'sshs_techpro'
    | 'sshs_all'
    | 'shs_core'
    | 'shs_applied'
    | 'shs_stem'
    | 'shs_abm'
    | 'shs_humss'
    | 'shs_gas'
    | 'shs_tvl'
    | 'shs_arts'
    | 'shs_sports'
    | 'shs_all_old';

export function SubjectsPage() {
    const { 
        schoolProfile, subjects, sections, students, classRecords, hpsRecords, gradingSheetRecords,
        addSubject, deleteSubject, deleteSubjectsBulk, updateSubject, updateSection,
        updateClassRecord, updateHPSRecord, bulkUpdateGradingSheetRecords,
        setCurrentView, showNotification 
    } = useAppStore(); 
    const { user } = useAuthStore();
    const canEdit = canEditClassesAndSubjects(user);

    const [viewMode, setViewMode] = useState<'grades' | 'subjects'>('grades');
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
    const [jhsTrackFilter, setJhsTrackFilter] = useState<JhsTrackFilter>('all');
    const [isMergingDuplicates, setIsMergingDuplicates] = useState(false);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedAdvisorySectionId, setSelectedAdvisorySectionId] = useState<string | null>(null);
    const [sectionAssignmentSubject, setSectionAssignmentSubject] = useState<Subject | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [enrollmentSubject, setEnrollmentSubject] = useState<Subject | null>(null);
    const [formData, setFormData] = useState({
        subject_name: '',
        subject_code: '',
        grade_level: '',
        section_id: '',
        teacher_id: '',
        term: 'all' as 1 | 2 | 3 | 'all' | 'none' | '1,2' | '2,3',
        written_weight: '',
        performance_weight: '',
        exam_weight: ''
    });
    const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
    const [useDepEdWeightsLocked, setUseDepEdWeightsLocked] = useState(true);
    const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
    const [curriculumChoice, setCurriculumChoice] = useState<CurriculumChoiceType | null>(null);
    const [showCurriculumChoice, setShowCurriculumChoice] = useState(false);
    const [lastLoadedCurriculumType, setLastLoadedCurriculumType] = useState<CurriculumChoiceType | null>(null);
    const [g12CurriculumTab, setG12CurriculumTab] = useState<'sshs' | 'shs'>('sshs');
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'Elementary' | 'JHS' | 'SHS' | null>(null);
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
    const [subjectSearchQuery, setSubjectSearchQuery] = useState('');

    // Import Wizard states
    const [wizardStep, setWizardStep] = useState<'choice' | 'select' | null>(null);
    const [pendingWizardSubjects, setPendingWizardSubjects] = useState<SpecialSubjectItem[]>([]);
    const [selectedWizardSubjects, setSelectedWizardSubjects] = useState<Set<string>>(new Set());
    const [wizardIncludeCrossTrack, setWizardIncludeCrossTrack] = useState(false);
    const [wizardSearch, setWizardSearch] = useState('');
    const [collapsedWizardCategories, setCollapsedWizardCategories] = useState<Record<string, boolean>>({});

    // Auto-migrate old subjects that should be "Not Offered" by default (only for SHS)
    useEffect(() => {
        if (!subjects || subjects.length === 0) return;
        
        let alreadyMigrated = false;
        try {
            alreadyMigrated = localStorage.getItem('formease_shs_subjects_migrated_v2') === 'true';
        } catch (e) {
            console.warn(e);
        }
        if (alreadyMigrated) return;
        
        const shsSubjectsToFix = subjects.filter(subject => {
            const grade = subject.grade_level || '';
            const isSHS = grade.includes('11') || grade.includes('12');
            if (!isSHS) return false;
            
            // If it is already marked as 'none', 1, 2, or 3, it has a term-specific configuration
            if (subject.term === 'none' || subject.term === 1 || subject.term === 2 || subject.term === 3) return false;
            
            // For SHS, check if it's a core subject
            const normalized = subject.subject_name.trim().toLowerCase();
            const cores = [
                'effective communication',
                'mabisang komunikasyon',
                'general mathematics',
                'general science',
                'life and career skills',
                'pag-aaral ng kasaysayan at lipunang pilipino',
                'kasaysayan at lipunang pilipino'
            ];
            const isCore = cores.some(c => normalized.includes(c)) && !(grade.includes('12') && normalized.includes('general mathematics'));
            
            // If it is NOT a core subject and it is marked as 'all' or undefined/null, it needs to be fixed to 'none'
            return !isCore;
        });

        // Auto-heal any Elementary or JHS subjects corrupted with term: 'none'
        const elemOrJhsHiddenToFix = subjects.filter(subject => {
            const grade = subject.grade_level || '';
            const gNum = parseInt(grade.replace(/\D/g, '')) || 0;
            const isElemOrJhs = (gNum >= 1 && gNum <= 10) || grade.toLowerCase().includes('kinder');
            return isElemOrJhs && subject.term === 'none';
        });

        if (elemOrJhsHiddenToFix.length > 0) {
            console.log(`[SUBJECTS HEALING] Restoring ${elemOrJhsHiddenToFix.length} Elementary/JHS subjects corrupted to 'none' back to 'all'...`);
            elemOrJhsHiddenToFix.forEach(sub => {
                void updateSubject({
                    ...sub,
                    term: 'all',
                    offered_terms: [1, 2, 3]
                });
            });
        }

        if (shsSubjectsToFix.length > 0) {
            console.log(`[SUBJECTS MIGRATION] Migrating ${shsSubjectsToFix.length} SHS subjects to 'none' (Not Offered)...`);
            const runMigration = async () => {
                for (const subject of shsSubjectsToFix) {
                    try {
                        await updateSubject({
                            ...subject,
                            term: 'none'
                        });
                    } catch (err) {
                        console.error('Failed to migrate subject:', subject.subject_name, err);
                    }
                }
                try {
                    localStorage.setItem('formease_shs_subjects_migrated_v2', 'true');
                } catch (e) {
                    console.warn(e);
                }
            };
            void runMigration();
        } else {
            try {
                localStorage.setItem('formease_shs_subjects_migrated_v2', 'true');
            } catch (e) {
                console.warn(e);
            }
        }
    }, [subjects, updateSubject]);

    const toggleWizardCategory = (categoryName: string) => {
        setCollapsedWizardCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    const startImportWizard = (type: CurriculumChoiceType) => {
        if (!selectedGrade) return;

        if (selectedGrade.includes('11') && type.startsWith('shs_')) {
            showNotification('Traditional SHS old curriculum is not available for Grade 11 (SSHS only).', 'info');
            return;
        }

        let templates: SpecialSubjectItem[] | { name: string; code: string }[] | undefined;

        if (type === 'standard') {
            templates = (selectedGrade || '').includes('11')
                ? SSHS_G11_ACADEMIC_SUBJECTS
                : STANDARD_SUBJECTS[selectedGrade as keyof typeof STANDARD_SUBJECTS];
        } else if (type === 'special') {
            templates = (selectedGrade || '').includes('11')
                ? [...SSHS_G11_CORE_SUBJECTS, ...SSHS_G12_TECHPRO_SUBJECTS]
                : SPECIAL_SUBJECTS[selectedGrade as keyof typeof SPECIAL_SUBJECTS];
        } else if (type === 'sshs_academic') {
            templates = SSHS_G12_ACADEMIC_SUBJECTS;
        } else if (type === 'sshs_techpro') {
            templates = SSHS_G12_TECHPRO_SUBJECTS;
        } else if (type === 'sshs_all') {
            templates = [...SSHS_G12_ACADEMIC_SUBJECTS, ...SSHS_G12_TECHPRO_SUBJECTS];
        } else if (type === 'shs_core') {
            templates = SHS_G12_CORE_SUBJECTS;
        } else if (type === 'shs_applied') {
            templates = SHS_G12_APPLIED_SUBJECTS;
        } else if (type === 'shs_stem') {
            templates = [...SHS_G12_CORE_SUBJECTS, ...SHS_G12_APPLIED_SUBJECTS, ...SHS_OLD_STRAND_SUBJECTS.STEM];
        } else if (type === 'shs_abm') {
            templates = [...SHS_G12_CORE_SUBJECTS, ...SHS_G12_APPLIED_SUBJECTS, ...SHS_OLD_STRAND_SUBJECTS.ABM];
        } else if (type === 'shs_humss') {
            templates = [...SHS_G12_CORE_SUBJECTS, ...SHS_G12_APPLIED_SUBJECTS, ...SHS_OLD_STRAND_SUBJECTS.HUMSS];
        } else if (type === 'shs_gas') {
            templates = [...SHS_G12_CORE_SUBJECTS, ...SHS_G12_APPLIED_SUBJECTS, ...SHS_OLD_STRAND_SUBJECTS.GAS];
        } else if (type === 'shs_tvl') {
            templates = [...SHS_G12_CORE_SUBJECTS, ...SHS_G12_APPLIED_SUBJECTS, ...SHS_OLD_STRAND_SUBJECTS.TVL];
        } else if (type === 'shs_arts') {
            templates = [...SHS_G12_CORE_SUBJECTS, ...SHS_G12_APPLIED_SUBJECTS, ...SHS_OLD_STRAND_SUBJECTS['Arts and Design'], ...SHS_OLD_STRAND_SUBJECTS.Sports];
        } else if (type === 'shs_all_old') {
            templates = SHS_G12_ALL_OLD_SUBJECTS;
        } else if (type === 'program_ste' || type === 'program_spstem') {
            const gradeDefaults = SPSTEM_SUBJECTS[selectedGrade] || [];
            const otherJhsElectives = JHS_STE_ELECTIVES.filter(e => 
                !gradeDefaults.some(g => normalizeSubjectLabel(g.name) === normalizeSubjectLabel(e.name))
            );
            templates = [...gradeDefaults, ...otherJhsElectives];
        } else if (type === 'program_spa') {
            templates = Object.values(SPA_MAJORS).flat();
        } else if (type === 'program_spj') {
            templates = SPJ_SUBJECTS[selectedGrade] || [];
        } else if (type === 'program_sps') {
            templates = SPS_SUBJECTS[selectedGrade] || [];
        } else if (type === 'program_spfl') {
            templates = SPFL_LANGUAGES;
        } else if (type === 'program_sptve') {
            templates = SPTVE_SPECIALIZATIONS;
        } else if (type === 'program_sses') {
            templates = SSES_SUBJECTS[selectedGrade] || [];
        } else if (type === 'program_alive') {
            templates = ALIVE_SUBJECTS;
        } else if (type === 'core_only') {
            const allStandard = STANDARD_SUBJECTS[selectedGrade as keyof typeof STANDARD_SUBJECTS] || [];
            templates = allStandard.filter(s => getShsCategoryForSubject(s.name, selectedGrade) === 'Core Subject (All Tracks)');
        } else if (type === 'program') {
            templates = getCurriculumTemplatesForSection(selectedGrade, selectedSection?.program, selectedSection?.spa_majors);
        }

        if (!templates || templates.length === 0) {
            showNotification(`No subjects defined for this offering in ${selectedGrade}`, 'info');
            return;
        }

        // Determine which subjects are already existing in this section/grade
        const existingSectionSubjects = subjects.filter((subject) => {
            if (selectedSectionId && selectedSectionId !== 'all') {
                return subject.section_id === selectedSectionId || !subject.section_id;
            }
            return subject.grade_level === selectedGrade && !subject.section_id;
        });
        const existingNames = new Set(existingSectionSubjects.map((subject) => normalizeSubjectLabel(subject.subject_name)));

        // Pre-select logic:
        // For SHS (Grade 11 & Grade 12), DO NOT pre-select all subjects!
        // Allow the teacher to select themselves as requested.
        const isSHSGrade = (selectedGrade || '').includes('11') || (selectedGrade || '').includes('12');
        const initialSelected = new Set<string>();

        if (!isSHSGrade) {
            const gradeDefaults = (type === 'program_ste' || type === 'program_spstem') ? (SPSTEM_SUBJECTS[selectedGrade] || []) : templates;
            templates.forEach(s => {
                if (!existingNames.has(normalizeSubjectLabel(s.name))) {
                    if (type === 'program_ste' || type === 'program_spstem') {
                        if (gradeDefaults.some(g => normalizeSubjectLabel(g.name) === normalizeSubjectLabel(s.name))) {
                            initialSelected.add(s.name);
                        }
                    } else {
                        initialSelected.add(s.name);
                    }
                }
            });
        }

        setPendingWizardSubjects(templates.map(s => ({ ...s })));
        setSelectedWizardSubjects(initialSelected);
        setCurriculumChoice(type);
        setWizardStep('select');
        setWizardIncludeCrossTrack(false);
        setWizardSearch('');
    };

    const wizardDisplaySubjects = useMemo(() => {
        if (!selectedGrade) return [];
        
        let baseList = [...pendingWizardSubjects];
        const gradeNum = parseInt(selectedGrade.replace(/\D/g, '')) || 0;
        const isSHS = gradeNum === 11 || gradeNum === 12;

        if (isSHS && wizardIncludeCrossTrack) {
            let otherTemplates: { name: string; code?: string }[] = [];
            if (curriculumChoice === 'sshs_academic' || (curriculumChoice === 'standard' && gradeNum === 12)) {
                otherTemplates = SSHS_G12_TECHPRO_SUBJECTS;
            } else if (curriculumChoice === 'sshs_techpro' || (curriculumChoice === 'special' && gradeNum === 12)) {
                otherTemplates = SSHS_G12_ACADEMIC_SUBJECTS;
            } else if (curriculumChoice?.startsWith('shs_')) {
                otherTemplates = SHS_G12_ALL_OLD_SUBJECTS;
            } else {
                const oppositeType = curriculumChoice === 'standard' ? 'special' : 'standard';
                otherTemplates = (oppositeType === 'standard'
                    ? STANDARD_SUBJECTS[selectedGrade as keyof typeof STANDARD_SUBJECTS]
                    : SPECIAL_SUBJECTS[selectedGrade as keyof typeof SPECIAL_SUBJECTS]) || [];
            }
            
            otherTemplates.forEach(item => {
                if (!baseList.some(s => s.name.toLowerCase().trim() === item.name.toLowerCase().trim())) {
                    baseList.push({ ...item, code: item.code || '' });
                }
            });
        }

        if (wizardSearch.trim()) {
            const query = wizardSearch.toLowerCase().trim();
            baseList = baseList.filter(s => s.name.toLowerCase().includes(query) || (s.code && s.code.toLowerCase().includes(query)));
        }

        return baseList;
    }, [pendingWizardSubjects, wizardIncludeCrossTrack, curriculumChoice, selectedGrade, wizardSearch]);

    const groupedWizardSubjects = useMemo(() => {
        if (!selectedGrade) return {};
        const isSHS = selectedGrade.includes('11') || selectedGrade.includes('12');
        const isJHS = selectedGrade.includes('Grade 7') || selectedGrade.includes('Grade 8') || selectedGrade.includes('Grade 9') || selectedGrade.includes('Grade 10');

        let catOrder: string[] = [];
        if (isSHS) {
            const gradeNum = parseInt(selectedGrade.replace(/\D/g, '')) || 0;
            catOrder = gradeNum === 11 ? [
                'Core Subject (All Tracks)',
                'Academic Elective (All Other Electives)',
                'Academic Elective (Field Experience/ Exposure, and Sports and Arts)',
                'TechPro Elective (All Other Elective)'
            ] : [
                'Core Subjects',
                'Applied Subjects',
                'Specialized Subjects',
                'Academic Track Electives',
                'TechPro Track Electives'
            ];
        } else if (isJHS) {
            catOrder = [
                'Core Academic Subjects',
                'MAPEH (Music, Arts, PE, Health)',
                'Technology & Livelihood (TLE)',
                'Values / Character Education',
                'Science, Technology & Engineering (STE)',
                'Special Program in the Arts (SPA)',
                'Special Program in Journalism (SPJ)',
                'Special Program in Sports (SPS)',
                'Special Program in Foreign Language (SPFL)',
                'Technical-Vocational Education (SPTVE)',
                'Madrasah / ALIVE Program',
                'ICT & Computer Education',
                'Other Subjects'
            ];
        } else {
            // Elementary
            catOrder = [
                'Core Academic Subjects',
                'Languages & Literacy',
                'Livelihood & Makabansa',
                'MAPEH (Music, Arts, PE, Health)',
                'Values / Character Education',
                'Special Science Elementary School (SSES)',
                'Madrasah / ALIVE Program',
                'ICT & Computer Education',
                'Other Subjects'
            ];
        }

        const groups: Record<string, typeof wizardDisplaySubjects> = {};
        
        catOrder.forEach(cat => {
            groups[cat] = [];
        });

        wizardDisplaySubjects.forEach((subject) => {
            const cat = isSHS 
                ? getShsCategoryForSubject(subject.name, selectedGrade) 
                : getCategoryForSubject(subject.name, selectedGrade);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(subject);
        });

        const filteredGroups: Record<string, typeof wizardDisplaySubjects> = {};
        catOrder.forEach(cat => {
            if (groups[cat] && groups[cat].length > 0) {
                filteredGroups[cat] = groups[cat];
            }
        });
        Object.entries(groups).forEach(([cat, list]) => {
            if (list.length > 0 && !filteredGroups[cat]) {
                filteredGroups[cat] = list;
            }
        });

        return filteredGroups;
    }, [wizardDisplaySubjects, selectedGrade]);

    const toggleWizardSubject = (name: string) => {
        setSelectedWizardSubjects(prev => {
            const next = new Set(prev);
            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }
            return next;
        });
    };

    const selectAllInCategory = (categorySubjects: { name: string }[]) => {
        setSelectedWizardSubjects(prev => {
            const next = new Set(prev);
            categorySubjects.forEach(s => next.add(s.name));
            return next;
        });
    };

    const clearAllInCategory = (categorySubjects: { name: string }[]) => {
        setSelectedWizardSubjects(prev => {
            const next = new Set(prev);
            categorySubjects.forEach(s => next.delete(s.name));
            return next;
        });
    };

    const selectAllWizardSubjects = () => {
        setSelectedWizardSubjects(new Set(wizardDisplaySubjects.map(s => s.name)));
    };

    const clearAllWizardSubjects = () => {
        setSelectedWizardSubjects(new Set());
    };

    const selectCoreOnlyWizardSubjects = () => {
        const isSHS = (selectedGrade || '').includes('11') || (selectedGrade || '').includes('12');
        const coreSubjects = wizardDisplaySubjects.filter(s => {
            const cat = isSHS 
                ? getShsCategoryForSubject(s.name, selectedGrade || '') 
                : getCategoryForSubject(s.name, selectedGrade || '');
            return cat.toLowerCase().includes('core');
        });
        setSelectedWizardSubjects(new Set(coreSubjects.map(s => s.name)));
    };

    const handleWizardImport = async () => {
        if (!selectedGrade || selectedWizardSubjects.size === 0) return;

        setIsLoadingTemplate(true);
        const targetSection = (selectedSectionId && selectedSectionId !== 'all') ? selectedSection : null;
        // Standard core offerings are grade-wide master subjects unless a specialized program was picked
        const isStandardOffering = curriculumChoice === 'standard' || curriculumChoice === 'core_only' || curriculumChoice === 'shs_core';
        const sectionId = isStandardOffering ? undefined : (selectedSectionId && selectedSectionId !== 'all' ? targetSection?.id : undefined);
        const gradeLevel = selectedGrade;
        const gradeNum = parseInt(selectedGrade.replace(/\D/g, '')) || 0;
        const isSHS = gradeNum === 11 || gradeNum === 12;

        const candidateTemplates = (isSHS && wizardIncludeCrossTrack) ? wizardDisplaySubjects : pendingWizardSubjects;
        const templatesToLoad = candidateTemplates.filter(t => selectedWizardSubjects.has(t.name));

        try {
            const existingSectionSubjects = subjects.filter((subject) => {
                if (sectionId) return subject.section_id === sectionId;
                return subject.grade_level === gradeLevel && !subject.section_id;
            });
            const existingNames = new Set(existingSectionSubjects.map((subject) => normalizeSubjectLabel(subject.subject_name)));
            
            const missingTemplates = templatesToLoad.filter((template) => !existingNames.has(normalizeSubjectLabel(template.name)));

            if (missingTemplates.length === 0) {
                if (targetSection) {
                    const existingTaught = targetSection.taught_subjects || [];
                    const namesToAdd = templatesToLoad.map(t => t.name).filter(n => !existingTaught.some(et => isMatchingSubject(et, undefined, n)));
                    if (namesToAdd.length > 0) {
                        await updateSection({
                            ...targetSection,
                            taught_subjects: [...existingTaught, ...namesToAdd]
                        });
                    }
                }
                showNotification(`All selected subjects are already loaded for ${targetSection?.section_name || gradeLevel}.`, 'info');
                setShowCurriculumChoice(false);
                setWizardStep(null);
                return;
            }

            for (let i = 0; i < missingTemplates.length; i++) {
                const template = missingTemplates[i] as SpecialSubjectItem;
                const subjectId = generateDeterministicSubjectId(gradeLevel, template.name, sectionId);
                
                const isComponent = template.is_component ?? template.isComponent ?? (['music and arts', 'physical education and health'].some(c => template.name.toLowerCase().includes(c)));
                const countsInGenAvg = (template.counts_in_general_average ?? template.countsInGeneralAverage) !== false && !isComponent && !template.name.startsWith('*');
                const templateTerm = template.term;
                const isShsGrade = /11|12/.test(String(gradeLevel || ''));
                const resolvedTerm = isShsGrade ? (templateTerm !== undefined ? templateTerm : getDefaultTermForSubject(template.name, gradeLevel)) : 'all';
                const resolvedOfferedTerms: (1 | 2 | 3)[] = isShsGrade ? (normalizeOfferedTerms(resolvedTerm) as (1 | 2 | 3)[]) : [1, 2, 3];

                const newSubject: Subject = {
                    id: subjectId,
                    subject_name: template.name,
                    subject_code: template.code || '',
                    grade_level: gradeLevel,
                    section_id: sectionId,
                    term: resolvedTerm,
                    offered_terms: resolvedOfferedTerms,
                    order: UNIVERSAL_SUBJECT_ORDER.findIndex((name) => normalizeSubjectLabel(name) === normalizeSubjectLabel(template.name)),
                    is_special_program: Boolean(template.program || template.is_special_program || template.isSpecialProgram),
                    program_type: template.program,
                    is_component: isComponent,
                    counts_in_general_average: countsInGenAvg
                };
                
                await addSubject(newSubject);
            }

            if (targetSection) {
                const existingTaught = targetSection.taught_subjects || [];
                const namesToAdd = templatesToLoad.map(t => t.name).filter(n => !existingTaught.some(et => isMatchingSubject(et, undefined, n)));
                if (namesToAdd.length > 0) {
                    await updateSection({
                        ...targetSection,
                        taught_subjects: [...existingTaught, ...namesToAdd]
                    });
                }
            }

            showNotification(`Successfully imported ${missingTemplates.length} subjects!`, 'success');
            setLastLoadedCurriculumType(curriculumChoice);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error("[SUBJECTS WIZARD] Failed to commit selective load:", errorMsg);
            showNotification(`Failed to import subjects: ${errorMsg}`, 'error');
        } finally {
            setIsLoadingTemplate(false);
            setShowCurriculumChoice(false);
            setWizardStep(null);
            setPendingWizardSubjects([]);
            setSelectedWizardSubjects(new Set());
        }
    };

    const toggleCategory = (categoryName: string) => {
        setCollapsedCategories(prev => {
            const currentVal = prev[categoryName] ?? true;
            return {
                ...prev,
                [categoryName]: !currentVal
            };
        });
    };

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

    const selectedSection = useMemo(() => {
        if (!selectedSectionId || selectedSectionId === 'all') return null;
        return sections.find(s => s.id === selectedSectionId);
    }, [sections, selectedSectionId]);

    const existingSectionSubjectNames = useMemo(() => {
        if (!selectedGrade) return new Set<string>();
        const list = subjects.filter((s) => {
            if (selectedSectionId && selectedSectionId !== 'all') {
                return s.section_id === selectedSectionId || !s.section_id;
            }
            return s.grade_level === selectedGrade && !s.section_id;
        });
        return new Set(list.map((s) => normalizeSubjectLabel(s.subject_name)));
    }, [subjects, selectedSectionId, selectedGrade]);

    const templateMeta = useMemo(() => {
        if (!selectedGrade) return null;
        
        const gradeNum = parseInt(selectedGrade.replace(/\D/g, '')) || 0;
        const isES = gradeNum >= 1 && gradeNum <= 6;
        const isJHS = gradeNum >= 7 && gradeNum <= 10;
        const isSHS = gradeNum === 11 || gradeNum === 12;

        const standard = STANDARD_SUBJECTS[selectedGrade as keyof typeof STANDARD_SUBJECTS] || [];
        const special = SPECIAL_SUBJECTS[selectedGrade as keyof typeof SPECIAL_SUBJECTS] || [];
        const hasProgram = Boolean(selectedSection?.program && selectedSection.program !== 'Regular');
        const programTemplates = hasProgram 
            ? getCurriculumTemplatesForSection(selectedGrade, selectedSection!.program, selectedSection!.spa_majors)
            : [];
        
        const getPreview = (list: { name: string; code?: string }[]) => {
            const names = list.slice(0, 3).map(s => `✓ ${s.name}`);
            if (list.length > 3) names.push(`+ ${list.length - 3} more...`);
            return names;
        };

        interface CurriculumCardDef {
            id: CurriculumChoiceType;
            title: string;
            subtitle: string;
            description: string;
            badge: string;
            badgeStyle: string;
            borderColor: string;
            bgColor: string;
            hoverBorder: string;
            hoverBg: string;
            ringColor: string;
            emoji: string;
            count: number;
            preview: string[];
            isSectionAssigned?: boolean;
        }

        const cards: CurriculumCardDef[] = [];

        // If Section has an assigned special program preset (e.g. STE, SPA, SPS, etc.)
        if (hasProgram && selectedSection) {
            cards.push({
                id: 'program',
                title: `${selectedSection.program} Preset`,
                subtitle: 'Assigned Section Program',
                description: `Official preset curriculum for this section (${selectedSection.program}), pre-configured with core and specialized subjects.`,
                badge: '★ Section Preset',
                badgeStyle: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60',
                borderColor: 'border-purple-300 dark:border-purple-800/50',
                bgColor: 'bg-purple-50/50 dark:bg-purple-950/20',
                hoverBorder: 'hover:border-purple-500',
                hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-950/40',
                ringColor: 'ring-purple-200/50',
                emoji: '🎓',
                count: programTemplates.length,
                preview: getPreview(programTemplates),
                isSectionAssigned: true
            });
        }

        if (isJHS) {
            // Card 1: Normal / Standard (MATATAG / Core)
            cards.push({
                id: 'standard',
                title: 'Normal / Standard Curriculum',
                subtitle: 'MATATAG & DepEd Core',
                description: 'Official DepEd junior high core learning areas (English, Filipino, Math, Science, AP, Values Ed, TLE, MAPEH).',
                badge: 'DepEd Core',
                badgeStyle: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
                borderColor: 'border-emerald-200 dark:border-emerald-800/40',
                bgColor: 'bg-emerald-50/40 dark:bg-emerald-950/20',
                hoverBorder: 'hover:border-emerald-500',
                hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
                ringColor: 'ring-emerald-200/50',
                emoji: '📚',
                count: standard.length,
                preview: getPreview(standard)
            });

            // Card 2: Science, Technology & Engineering / STEM (STE / SPSTEM)
            const steList = SPSTEM_SUBJECTS[selectedGrade] || [];
            cards.push({
                id: 'program_ste',
                title: 'Science, Tech & STEM',
                subtitle: 'STE / SPSTEM Program',
                description: 'Specialized STEM curriculum: Enhanced Science, Enhanced Math, Creative Technology, Research MIM/SIP, Scientific Investigation, and Robotics.',
                badge: 'Special Program',
                badgeStyle: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60',
                borderColor: 'border-cyan-200 dark:border-cyan-800/40',
                bgColor: 'bg-cyan-50/40 dark:bg-cyan-950/20',
                hoverBorder: 'hover:border-cyan-500',
                hoverBg: 'hover:bg-cyan-50 dark:hover:bg-cyan-950/30',
                ringColor: 'ring-cyan-200/50',
                emoji: '🔬',
                count: steList.length,
                preview: getPreview(steList)
            });

            // Card 3: Special Program in the Arts (SPA)
            const spaList = Object.values(SPA_MAJORS).flat();
            cards.push({
                id: 'program_spa',
                title: 'Special Program in the Arts',
                subtitle: 'SPA Majors',
                description: 'DepEd arts specialization: Visual Arts, Vocal Music, Instrumental Music, Dance, Theater Arts, Creative Writing, Media Arts.',
                badge: 'Special Program',
                badgeStyle: 'bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800/60',
                borderColor: 'border-fuchsia-200 dark:border-fuchsia-800/40',
                bgColor: 'bg-fuchsia-50/40 dark:bg-fuchsia-950/20',
                hoverBorder: 'hover:border-fuchsia-500',
                hoverBg: 'hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/30',
                ringColor: 'ring-fuchsia-200/50',
                emoji: '🎭',
                count: spaList.length,
                preview: getPreview(spaList)
            });

            // Card 4: Special Program in Journalism (SPJ)
            const spjList = SPJ_SUBJECTS[selectedGrade] || [];
            cards.push({
                id: 'program_spj',
                title: 'Special Program in Journalism',
                subtitle: 'SPJ Program',
                description: 'Journalism electives: Print Journalism, Radio Broadcast, TV Broadcast & Photojournalism, Online Journalism.',
                badge: 'Special Program',
                badgeStyle: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60',
                borderColor: 'border-indigo-200 dark:border-indigo-800/40',
                bgColor: 'bg-indigo-50/40 dark:bg-indigo-950/20',
                hoverBorder: 'hover:border-indigo-500',
                hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30',
                ringColor: 'ring-indigo-200/50',
                emoji: '📰',
                count: spjList.length,
                preview: getPreview(spjList)
            });

            // Card 5: Special Program in Sports (SPS)
            const spsList = SPS_SUBJECTS[selectedGrade] || [];
            cards.push({
                id: 'program_sps',
                title: 'Special Program in Sports',
                subtitle: 'SPS Program',
                description: 'Sports specialization: Foundations of Sports, Team Sports, Sports Science & Nutrition, Sports Officiating.',
                badge: 'Special Program',
                badgeStyle: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
                borderColor: 'border-amber-200 dark:border-amber-800/40',
                bgColor: 'bg-amber-50/40 dark:bg-amber-950/20',
                hoverBorder: 'hover:border-amber-500',
                hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-950/30',
                ringColor: 'ring-amber-200/50',
                emoji: '🏃',
                count: spsList.length,
                preview: getPreview(spsList)
            });

            // Card 6: Special Program in Foreign Language (SPFL)
            const spflList = SPFL_LANGUAGES;
            cards.push({
                id: 'program_spfl',
                title: 'Foreign Language (SPFL)',
                subtitle: 'SPFL Languages',
                description: 'Global language electives: Spanish, Japanese (Nihongo), French, German, Mandarin Chinese, and Korean.',
                badge: 'Special Program',
                badgeStyle: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60',
                borderColor: 'border-blue-200 dark:border-blue-800/40',
                bgColor: 'bg-blue-50/40 dark:bg-blue-950/20',
                hoverBorder: 'hover:border-blue-500',
                hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950/30',
                ringColor: 'ring-blue-200/50',
                emoji: '🌍',
                count: spflList.length,
                preview: getPreview(spflList)
            });

            // Card 7: Technical-Vocational Education (SPTVE)
            const sptveList = SPTVE_SPECIALIZATIONS;
            cards.push({
                id: 'program_sptve',
                title: 'Technical-Vocational (SPTVE)',
                subtitle: 'STVEP Specializations',
                description: 'Applied Technical Drawing, Applied Entrepreneurship, TVE Specialization, Technical drafting, CSS, EIM, SMAW, Automotive, Cookery.',
                badge: 'Special Program',
                badgeStyle: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60',
                borderColor: 'border-violet-200 dark:border-violet-800/40',
                bgColor: 'bg-violet-50/40 dark:bg-violet-950/20',
                hoverBorder: 'hover:border-violet-500',
                hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-950/30',
                ringColor: 'ring-violet-200/50',
                emoji: '⚙️',
                count: sptveList.length,
                preview: getPreview(sptveList)
            });

            // Card 8: All Specialized Offerings (Combined)
            cards.push({
                id: 'special',
                title: 'All Specialized Offerings',
                subtitle: 'Complete Catalog',
                description: 'Combined catalog of all specialized electives, programs (STE, SPA, SPJ, SPS, SPFL, SPTVE) and ICT.',
                badge: 'All Offerings',
                badgeStyle: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60',
                borderColor: 'border-purple-200 dark:border-purple-800/40',
                bgColor: 'bg-purple-50/40 dark:bg-purple-950/20',
                hoverBorder: 'hover:border-purple-500',
                hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-950/30',
                ringColor: 'ring-purple-200/50',
                emoji: '⭐',
                count: special.length,
                preview: getPreview(special)
            });
        } else if (isES) {
            // Card 1: Normal / MATATAG Curriculum
            cards.push({
                id: 'standard',
                title: 'Normal / MATATAG Curriculum',
                subtitle: 'DepEd Primary Standard',
                description: 'Official DepEd elementary curriculum (Language, Reading, Math, Makabansa, GMRC, Science, AP, EPP, MAPEH).',
                badge: 'DepEd Standard',
                badgeStyle: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
                borderColor: 'border-emerald-200 dark:border-emerald-800/40',
                bgColor: 'bg-emerald-50/40 dark:bg-emerald-950/20',
                hoverBorder: 'hover:border-emerald-500',
                hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
                ringColor: 'ring-emerald-200/50',
                emoji: '📚',
                count: standard.length,
                preview: getPreview(standard)
            });

            // Card 2: Special Science Elementary School (SSES)
            const ssesList = SSES_SUBJECTS[selectedGrade] || [];
            cards.push({
                id: 'program_sses',
                title: 'Special Science Elementary (SSES)',
                subtitle: 'SSES Program',
                description: 'Enhanced Science, Enhanced Math, Creative Technology, Research MIM/SIP, Investigative Science, and elementary robotics & ICT.',
                badge: 'Special Program',
                badgeStyle: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60',
                borderColor: 'border-cyan-200 dark:border-cyan-800/40',
                bgColor: 'bg-cyan-50/40 dark:bg-cyan-950/20',
                hoverBorder: 'hover:border-cyan-500',
                hoverBg: 'hover:bg-cyan-50 dark:hover:bg-cyan-950/30',
                ringColor: 'ring-cyan-200/50',
                emoji: '🔬',
                count: ssesList.length,
                preview: getPreview(ssesList)
            });

            // Card 3: Madrasah / ALIVE Program
            const aliveList = ALIVE_SUBJECTS;
            cards.push({
                id: 'program_alive',
                title: 'Madrasah / ALIVE Program',
                subtitle: 'Arabic & Islamic Values',
                description: 'Official DepEd Madrasah curriculum: Arabic Language and Islamic Values Education for Muslim learners.',
                badge: 'DepEd Madrasah',
                badgeStyle: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60',
                borderColor: 'border-teal-200 dark:border-teal-800/40',
                bgColor: 'bg-teal-50/40 dark:bg-teal-950/20',
                hoverBorder: 'hover:border-teal-500',
                hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-950/30',
                ringColor: 'ring-teal-200/50',
                emoji: '🌙',
                count: aliveList.length,
                preview: getPreview(aliveList)
            });

            // Card 4: All Specialized Offerings (Combined)
            cards.push({
                id: 'special',
                title: 'All Specialized Offerings',
                subtitle: 'Combined Catalog',
                description: 'Combined catalog of elementary special offerings: SSES science/math, ALIVE Arabic/Islamic values, and ICT.',
                badge: 'All Offerings',
                badgeStyle: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60',
                borderColor: 'border-purple-200 dark:border-purple-800/40',
                bgColor: 'bg-purple-50/40 dark:bg-purple-950/20',
                hoverBorder: 'hover:border-purple-500',
                hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-950/30',
                ringColor: 'ring-purple-200/50',
                emoji: '⭐',
                count: special.length,
                preview: getPreview(special)
            });
        } else if (isSHS) {
            const isG12 = selectedGrade.includes('12');

            if (isG12 && g12CurriculumTab === 'shs') {
                // Traditional SHS (Old Curriculum K to 12) Cards (Available for Grade 12 ONLY)
                // 1. Core Subjects Only
                cards.push({
                    id: 'shs_core',
                    title: 'Core Subjects Only',
                    subtitle: 'Required Core (All Tracks)',
                    description: 'The 15 official core learning areas common across all senior high tracks (Oral Comm, Gen Math, Earth & Life Sci, 21st Century Lit, etc.).',
                    badge: 'Core Subjects',
                    badgeStyle: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60',
                    borderColor: 'border-indigo-200 dark:border-indigo-800/40',
                    bgColor: 'bg-indigo-50/40 dark:bg-indigo-950/20',
                    hoverBorder: 'hover:border-indigo-500',
                    hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30',
                    ringColor: 'ring-indigo-200/50',
                    emoji: '🧠',
                    count: SHS_G12_CORE_SUBJECTS.length,
                    preview: getPreview(SHS_G12_CORE_SUBJECTS)
                });

                // 2. Applied Subjects
                cards.push({
                    id: 'shs_applied',
                    title: 'Applied Subjects',
                    subtitle: 'Contextualized Learning',
                    description: 'Practical Research 1 & 2, EAPP, Filipino sa Piling Larang, Inquiries/Investigations/Immersion (3Is), Empowerment Tech, Entrepreneurship, Work Immersion.',
                    badge: 'Applied Subjects',
                    badgeStyle: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
                    borderColor: 'border-emerald-200 dark:border-emerald-800/40',
                    bgColor: 'bg-emerald-50/40 dark:bg-emerald-950/20',
                    hoverBorder: 'hover:border-emerald-500',
                    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
                    ringColor: 'ring-emerald-200/50',
                    emoji: '📖',
                    count: SHS_G12_APPLIED_SUBJECTS.length,
                    preview: getPreview(SHS_G12_APPLIED_SUBJECTS)
                });

                // 3. STEM Strand
                const stemPkg = [...SHS_G12_CORE_SUBJECTS, ...SHS_G12_APPLIED_SUBJECTS, ...SHS_OLD_STRAND_SUBJECTS.STEM];
                cards.push({
                    id: 'shs_stem',
                    title: 'STEM Strand',
                    subtitle: 'Science, Tech, Engg & Math',
                    description: 'Full STEM strand package: Core, Applied, and Specialized subjects (Pre-Calculus, Basic Calculus, Gen Bio, Gen Chem, Gen Physics, Capstone).',
                    badge: 'STEM Strand',
                    badgeStyle: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60',
                    borderColor: 'border-cyan-200 dark:border-cyan-800/40',
                    bgColor: 'bg-cyan-50/40 dark:bg-cyan-950/20',
                    hoverBorder: 'hover:border-cyan-500',
                    hoverBg: 'hover:bg-cyan-50 dark:hover:bg-cyan-950/30',
                    ringColor: 'ring-cyan-200/50',
                    emoji: '🔬',
                    count: stemPkg.length,
                    preview: getPreview([...SHS_OLD_STRAND_SUBJECTS.STEM, ...SHS_G12_APPLIED_SUBJECTS])
                });

                // 4. ABM Strand
                const abmPkg = [...SHS_G12_CORE_SUBJECTS, ...SHS_G12_APPLIED_SUBJECTS, ...SHS_OLD_STRAND_SUBJECTS.ABM];
                cards.push({
                    id: 'shs_abm',
                    title: 'ABM Strand',
                    subtitle: 'Accountancy & Business Mgmt',
                    description: 'Full ABM strand package: Core, Applied, and Specialized subjects (FABM 1 & 2, Business Finance, Business Math, Org & Mgmt, Principles of Mktg).',
                    badge: 'ABM Strand',
                    badgeStyle: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
                    borderColor: 'border-amber-200 dark:border-amber-800/40',
                    bgColor: 'bg-amber-50/40 dark:bg-amber-950/20',
                    hoverBorder: 'hover:border-amber-500',
                    hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-950/30',
                    ringColor: 'ring-amber-200/50',
                    emoji: '💼',
                    count: abmPkg.length,
                    preview: getPreview([...SHS_OLD_STRAND_SUBJECTS.ABM, ...SHS_G12_APPLIED_SUBJECTS])
                });

                // 5. HUMSS Strand
                const humssPkg = [...SHS_G12_CORE_SUBJECTS, ...SHS_G12_APPLIED_SUBJECTS, ...SHS_OLD_STRAND_SUBJECTS.HUMSS];
                cards.push({
                    id: 'shs_humss',
                    title: 'HUMSS Strand',
                    subtitle: 'Humanities & Social Sciences',
                    description: 'Full HUMSS strand package: Core, Applied, and Specialized subjects (DISS, DIASS, Creative Writing, Phil. Politics, World Religions, Trends).',
                    badge: 'HUMSS Strand',
                    badgeStyle: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60',
                    borderColor: 'border-rose-200 dark:border-rose-800/40',
                    bgColor: 'bg-rose-50/40 dark:bg-rose-950/20',
                    hoverBorder: 'hover:border-rose-500',
                    hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-950/30',
                    ringColor: 'ring-rose-200/50',
                    emoji: '🏛️',
                    count: humssPkg.length,
                    preview: getPreview([...SHS_OLD_STRAND_SUBJECTS.HUMSS, ...SHS_G12_APPLIED_SUBJECTS])
                });

                // 6. GAS Strand
                const gasPkg = [...SHS_G12_CORE_SUBJECTS, ...SHS_G12_APPLIED_SUBJECTS, ...SHS_OLD_STRAND_SUBJECTS.GAS];
                cards.push({
                    id: 'shs_gas',
                    title: 'GAS Strand',
                    subtitle: 'General Academic Strand',
                    description: 'Full GAS package: Core, Applied, and Specialized electives in Humanities and Social Sciences.',
                    badge: 'GAS Strand',
                    badgeStyle: 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60',
                    borderColor: 'border-violet-200 dark:border-violet-800/40',
                    bgColor: 'bg-violet-50/40 dark:bg-violet-950/20',
                    hoverBorder: 'hover:border-violet-500',
                    hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-950/30',
                    ringColor: 'ring-violet-200/50',
                    emoji: '🌐',
                    count: gasPkg.length,
                    preview: getPreview([...SHS_OLD_STRAND_SUBJECTS.GAS, ...SHS_G12_APPLIED_SUBJECTS])
                });

                // 7. TVL Track
                const tvlPkg = [...SHS_G12_CORE_SUBJECTS, ...SHS_G12_APPLIED_SUBJECTS, ...SHS_OLD_STRAND_SUBJECTS.TVL];
                cards.push({
                    id: 'shs_tvl',
                    title: 'TVL Track',
                    subtitle: 'Technical-Vocational-Livelihood',
                    description: 'Full TVL package: Core, Applied, and TVL specializations across Home Economics, ICT, Industrial Arts, and Agri-Fishery Arts.',
                    badge: 'TVL Track',
                    badgeStyle: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60',
                    borderColor: 'border-orange-200 dark:border-orange-800/40',
                    bgColor: 'bg-orange-50/40 dark:bg-orange-950/20',
                    hoverBorder: 'hover:border-orange-500',
                    hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-950/30',
                    ringColor: 'ring-orange-200/50',
                    emoji: '⚙️',
                    count: tvlPkg.length,
                    preview: getPreview([...SHS_OLD_STRAND_SUBJECTS.TVL.slice(0, 3)])
                });

                // 8. Arts & Sports Tracks
                const artsSportsPkg = [...SHS_G12_CORE_SUBJECTS, ...SHS_G12_APPLIED_SUBJECTS, ...SHS_OLD_STRAND_SUBJECTS['Arts and Design'], ...SHS_OLD_STRAND_SUBJECTS.Sports];
                cards.push({
                    id: 'shs_arts',
                    title: 'Arts & Sports Tracks',
                    subtitle: 'Arts & Design and Sports',
                    description: 'Full Arts & Design and Sports package: Core, Applied, and Specialized subjects in Performing Arts, Visual Design, and Sports Officiating.',
                    badge: 'Arts & Sports',
                    badgeStyle: 'bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800/60',
                    borderColor: 'border-fuchsia-200 dark:border-fuchsia-800/40',
                    bgColor: 'bg-fuchsia-50/40 dark:bg-fuchsia-950/20',
                    hoverBorder: 'hover:border-fuchsia-500',
                    hoverBg: 'hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/30',
                    ringColor: 'ring-fuchsia-200/50',
                    emoji: '🎨',
                    count: artsSportsPkg.length,
                    preview: getPreview([...SHS_OLD_STRAND_SUBJECTS['Arts and Design'].slice(0, 2), ...SHS_OLD_STRAND_SUBJECTS.Sports.slice(0, 2)])
                });

                // 9. Complete Old SHS Catalog
                cards.push({
                    id: 'shs_all_old',
                    title: 'All Traditional SHS Subjects',
                    subtitle: 'Complete K-12 Catalog',
                    description: 'Full traditional DepEd Senior High School catalog: Core, Applied, and all Strand Specializations combined.',
                    badge: 'All Old SHS',
                    badgeStyle: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
                    borderColor: 'border-slate-200 dark:border-slate-700/50',
                    bgColor: 'bg-slate-50/40 dark:bg-slate-900/30',
                    hoverBorder: 'hover:border-slate-400',
                    hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-900/50',
                    ringColor: 'ring-slate-200/50',
                    emoji: '📚',
                    count: SHS_G12_ALL_OLD_SUBJECTS.length,
                    preview: getPreview(SHS_G12_ALL_OLD_SUBJECTS)
                });
            } else {
                // SSHS (New Curriculum DepEd Order No. 017, s. 2026)
                if (isG12) {
                    // SSHS Grade 12 Cards
                    cards.push({
                        id: 'sshs_academic',
                        title: 'Academic Track',
                        subtitle: 'SSHS Academic Track',
                        description: 'Strengthened SHS Academic Track: Arts & Humanities, Business & Management, STEM, Sports & Field Experience electives.',
                        badge: 'SSHS Academic',
                        badgeStyle: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
                        borderColor: 'border-amber-200 dark:border-amber-800/40',
                        bgColor: 'bg-amber-50/40 dark:bg-amber-950/20',
                        hoverBorder: 'hover:border-amber-500',
                        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-950/30',
                        ringColor: 'ring-amber-200/50',
                        emoji: '🎓',
                        count: SSHS_G12_ACADEMIC_SUBJECTS.length,
                        preview: getPreview(SSHS_G12_ACADEMIC_SUBJECTS)
                    });

                    cards.push({
                        id: 'sshs_techpro',
                        title: 'TechPro Track',
                        subtitle: 'Technical-Professional',
                        description: 'Strengthened SHS TechPro Track: Aesthetic Services, Agri-Fishery, Artisanry, Automotive, Construction, ICT, Industrial, Hospitality & Tourism, Work Immersion.',
                        badge: 'SSHS TechPro',
                        badgeStyle: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60',
                        borderColor: 'border-blue-200 dark:border-blue-800/40',
                        bgColor: 'bg-blue-50/40 dark:bg-blue-950/20',
                        hoverBorder: 'hover:border-blue-500',
                        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950/30',
                        ringColor: 'ring-blue-200/50',
                        emoji: '🛠️',
                        count: SSHS_G12_TECHPRO_SUBJECTS.length,
                        preview: getPreview(SSHS_G12_TECHPRO_SUBJECTS)
                    });

                    const allSshsG12 = [...SSHS_G12_ACADEMIC_SUBJECTS, ...SSHS_G12_TECHPRO_SUBJECTS];
                    cards.push({
                        id: 'sshs_all',
                        title: 'All SSHS Offerings',
                        subtitle: 'Complete SSHS Catalog',
                        description: 'Combined catalog of all Grade 12 SSHS Academic and TechPro electives and Work Immersion options.',
                        badge: 'All SSHS Offerings',
                        badgeStyle: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60',
                        borderColor: 'border-purple-200 dark:border-purple-800/40',
                        bgColor: 'bg-purple-50/40 dark:bg-purple-950/20',
                        hoverBorder: 'hover:border-purple-500',
                        hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-950/30',
                        ringColor: 'ring-purple-200/50',
                        emoji: '🌟',
                        count: allSshsG12.length,
                        preview: getPreview(allSshsG12)
                    });
                } else {
                    // Grade 11 SSHS Cards
                    const g11AcademicOfferings = SSHS_G11_ACADEMIC_SUBJECTS;
                    const g11TechProOfferings = [...SSHS_G11_CORE_SUBJECTS, ...SSHS_G12_TECHPRO_SUBJECTS];
                    const g11CoreOnly = SSHS_G11_CORE_SUBJECTS;

                    cards.push({
                        id: 'standard',
                        title: 'Academic Track',
                        subtitle: 'SSHS Academic Track',
                        description: 'Universal Core Subjects plus Academic Track electives across the 5 Academic Clusters (STEM, Business & Entrepreneurship, Arts & Humanities, Sports & Wellness, Field Experience).',
                        badge: 'Academic Track',
                        badgeStyle: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
                        borderColor: 'border-amber-200 dark:border-amber-800/40',
                        bgColor: 'bg-amber-50/40 dark:bg-amber-950/20',
                        hoverBorder: 'hover:border-amber-500',
                        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-950/30',
                        ringColor: 'ring-amber-200/50',
                        emoji: '🎓',
                        count: g11AcademicOfferings.length,
                        preview: getPreview(g11AcademicOfferings)
                    });

                    cards.push({
                        id: 'special',
                        title: 'TechPro Track',
                        subtitle: 'Technical-Professional',
                        description: 'Universal Core Subjects plus TechPro electives across the 10 TechPro Clusters (Automotive, Hospitality, ICT, Industrial Technologies, etc.).',
                        badge: 'TechPro Track',
                        badgeStyle: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60',
                        borderColor: 'border-blue-200 dark:border-blue-800/40',
                        bgColor: 'bg-blue-50/40 dark:bg-blue-950/20',
                        hoverBorder: 'hover:border-blue-500',
                        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950/30',
                        ringColor: 'ring-blue-200/50',
                        emoji: '🛠️',
                        count: g11TechProOfferings.length,
                        preview: getPreview(g11TechProOfferings)
                    });

                    cards.push({
                        id: 'core_only',
                        title: 'Core Subjects Only',
                        subtitle: 'Required Core (All Tracks)',
                        description: 'Load only the 6 official Core Subjects required across all senior high school tracks without electives.',
                        badge: 'Core Only',
                        badgeStyle: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60',
                        borderColor: 'border-indigo-200 dark:border-indigo-800/40',
                        bgColor: 'bg-indigo-50/40 dark:bg-indigo-950/20',
                        hoverBorder: 'hover:border-indigo-500',
                        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30',
                        ringColor: 'ring-indigo-200/50',
                        emoji: '🧠',
                        count: g11CoreOnly.length,
                        preview: getPreview(g11CoreOnly)
                    });
                }
            }
        }

        return {
            cards,
            standardCount: standard.length,
            specialCount: special.length,
            programCount: programTemplates.length,
            hasProgram,
            programName: selectedSection?.program || '',
            isES,
            isJHS,
            isSHS
        };
    }, [selectedGrade, selectedSection, g12CurriculumTab]);

    const shsSubjectSuggestions = useMemo(() => {
        if (!selectedGrade) return [];
        const isSHS = selectedGrade.includes('11') || selectedGrade.includes('12');
        if (!isSHS) return [];

        const grade = selectedGrade as 'Grade 11' | 'Grade 12';
        const standardList = STANDARD_SUBJECTS[grade] || [];
        const specialList = SPECIAL_SUBJECTS[grade] || [];

        // Merge standard, special, and all traditional SHS subjects (removing duplicates by name)
        const merged: { name: string; code?: string }[] = [...standardList];
        specialList.forEach((item) => {
            if (!merged.some(s => s.name.toLowerCase().trim() === item.name.toLowerCase().trim())) {
                merged.push(item);
            }
        });
        if (grade === 'Grade 12') {
            SHS_G12_ALL_OLD_SUBJECTS.forEach((item) => {
                if (!merged.some(s => s.name.toLowerCase().trim() === item.name.toLowerCase().trim())) {
                    merged.push(item);
                }
            });
        }

        return merged.map(s => s.name).sort((a, b) => a.localeCompare(b));
    }, [selectedGrade]);

    const totalGradeSubjectsCount = useMemo(() => {
        if (!selectedGrade) return 0;
        const rawList = subjects
            .filter(s => !s.is_teaching_load) 
            .filter((s) => {
                if (s.grade_level !== selectedGrade) return false;
                if (selectedSectionId && selectedSectionId !== 'all') {
                    return s.section_id === selectedSectionId || !s.section_id;
                }
                return true;
            });
        const seenNames = new Set<string>();
        let count = 0;
        for (const s of rawList) {
            const key = normalizeSubjectLabel(s.subject_name);
            if (key && seenNames.has(key)) continue;
            if (key) {
                seenNames.add(key);
                count++;
            }
        }
        return count;
    }, [subjects, selectedSectionId, selectedGrade]);

    const isJhsGrade = useMemo(() => {
        return Boolean(selectedGrade && ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].includes(selectedGrade));
    }, [selectedGrade]);

    const jhsTrackCounts = useMemo(() => {
        if (!isJhsGrade || !selectedGrade) return null;
        const counts: Record<JhsTrackFilter, number> = { all: 0, core: 0, ste: 0, spa: 0, spj: 0, tvl: 0 };
        const rawList = subjects
            .filter(s => !s.is_teaching_load) 
            .filter((s) => {
                if (s.grade_level !== selectedGrade) return false;
                if (selectedSectionId && selectedSectionId !== 'all') {
                    return s.section_id === selectedSectionId || !s.section_id;
                }
                return true;
            });

        const seenNames = new Set<string>();
        for (const s of rawList) {
            const key = normalizeSubjectLabel(s.subject_name);
            if (key && seenNames.has(key)) continue;
            if (key) seenNames.add(key);
            counts.all++;
            const track = classifyJhsSubjectTrack(s.subject_name, selectedGrade, s.subject_code);
            counts[track]++;
        }
        return counts;
    }, [isJhsGrade, selectedGrade, subjects, selectedSectionId]);

    const filteredSubjects = useMemo(() => {
        if (!selectedGrade) return [];
        const rawList = subjects
            .filter(s => !s.is_teaching_load) 
            .filter((s) => {
                if (s.grade_level !== selectedGrade) return false;
                if (selectedSectionId && selectedSectionId !== 'all') {
                    return s.section_id === selectedSectionId || !s.section_id;
                }
                return true;
            });

        // Sort so that:
        // 1. If viewing a specific section: that section's subjects come first, then master subjects.
        // 2. If viewing "All Sections": master subjects come first so standard curriculum is prioritized and never duplicated.
        const sortedList = [...rawList].sort((a, b) => {
            if (selectedSectionId && selectedSectionId !== 'all') {
                const aSec = a.section_id === selectedSectionId ? 1 : 0;
                const bSec = b.section_id === selectedSectionId ? 1 : 0;
                return bSec - aSec;
            }
            const aMaster = !a.section_id ? 1 : 0;
            const bMaster = !b.section_id ? 1 : 0;
            return bMaster - aMaster;
        });

        const seenNames = new Set<string>();
        const uniqueList: Subject[] = [];
        for (const s of sortedList) {
            const key = normalizeSubjectLabel(s.subject_name);
            if (key && seenNames.has(key)) continue;
            if (key) seenNames.add(key);
            uniqueList.push(s);
        }

        const query = subjectSearchQuery.toLowerCase().trim();
        return uniqueList
            .filter((s) => {
                if (isJhsGrade && jhsTrackFilter !== 'all') {
                    const track = classifyJhsSubjectTrack(s.subject_name, selectedGrade, s.subject_code);
                    if (track !== jhsTrackFilter) return false;
                }
                if (!query) return true;
                return (
                    s.subject_name.toLowerCase().includes(query) ||
                    (s.subject_code && s.subject_code.toLowerCase().includes(query)) ||
                    getCategoryForSubject(s.subject_name, selectedGrade).toLowerCase().includes(query)
                );
            })
            .sort((a, b) => {
                // If searching, keep standard order
                if (query) {
                    const orderA = a.order ?? getPreferredSubjectOrder(a.subject_name);
                    const orderB = b.order ?? getPreferredSubjectOrder(b.subject_name);
                    if (orderA !== orderB) return orderA - orderB;
                    return a.subject_name.localeCompare(b.subject_name);
                }

                // If categorized view, sort primarily by category order
                const catA = getCategoryForSubject(a.subject_name, selectedGrade);
                const catB = getCategoryForSubject(b.subject_name, selectedGrade);
                
                const isSHS = selectedGrade.includes('11') || selectedGrade.includes('12');
                const isJHS = selectedGrade.includes('Grade 7') || selectedGrade.includes('Grade 8') || selectedGrade.includes('Grade 9') || selectedGrade.includes('Grade 10');

                let catOrder: string[] = [];
                if (isSHS) {
                    const gradeNum = parseInt(selectedGrade.replace(/\D/g, '')) || 0;
                    catOrder = gradeNum === 11 ? [
                        'Core Subject (All Tracks)',
                        'Academic Elective (All Other Electives)',
                        'Academic Elective (Field Experience/ Exposure, and Sports and Arts)',
                        'TechPro Elective (All Other Elective)'
                    ] : [
                        'Core Subjects',
                        'Applied Subjects',
                        'Specialized Subjects',
                        'Academic Track Electives',
                        'TechPro Track Electives'
                    ];
                } else if (isJHS) {
                    catOrder = [
                        'Core Academic Subjects',
                        'MAPEH (Music, Arts, PE, Health)',
                        'Technology & Livelihood (TLE)',
                        'Values / Character Education',
                        'Science, Technology & Engineering (STE)',
                        'Special Program in the Arts (SPA)',
                        'Special Program in Journalism (SPJ)',
                        'Special Program in Sports (SPS)',
                        'Special Program in Foreign Language (SPFL)',
                        'Technical-Vocational Education (SPTVE)',
                        'Madrasah / ALIVE Program',
                        'ICT & Computer Education',
                        'Other Subjects'
                    ];
                } else {
                    catOrder = [
                        'Core Academic Subjects',
                        'Languages & Literacy',
                        'Livelihood & Makabansa',
                        'MAPEH (Music, Arts, PE, Health)',
                        'Values / Character Education',
                        'Special Science Elementary School (SSES)',
                        'Madrasah / ALIVE Program',
                        'ICT & Computer Education',
                        'Other Subjects'
                    ];
                }

                if (catA !== catB) {
                    const idxA = catOrder.indexOf(catA);
                    const idxB = catOrder.indexOf(catB);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                }

                const orderA = a.order ?? getPreferredSubjectOrder(a.subject_name);
                const orderB = b.order ?? getPreferredSubjectOrder(b.subject_name);
                if (orderA !== orderB) return orderA - orderB;
                return a.subject_name.localeCompare(b.subject_name);
            });
    }, [subjects, selectedSectionId, selectedGrade, subjectSearchQuery, isJhsGrade, jhsTrackFilter]);

    const groupedSubjects = useMemo(() => {
        if (!selectedGrade) return {};
        const isSHS = selectedGrade.includes('11') || selectedGrade.includes('12');
        const isJHS = selectedGrade.includes('Grade 7') || selectedGrade.includes('Grade 8') || selectedGrade.includes('Grade 9') || selectedGrade.includes('Grade 10');

        let catOrder: string[] = [];
        if (isSHS) {
            const gradeNum = parseInt(selectedGrade.replace(/\D/g, '')) || 0;
            catOrder = gradeNum === 11 ? [
                'Core Subject (All Tracks)',
                'Academic Elective (All Other Electives)',
                'Academic Elective (Field Experience/ Exposure, and Sports and Arts)',
                'TechPro Elective (All Other Elective)'
            ] : [
                'Core Subjects',
                'Applied Subjects',
                'Specialized Subjects',
                'Academic Track Electives',
                'TechPro Track Electives'
            ];
        } else if (isJHS) {
            catOrder = [
                'Core Academic Subjects',
                'MAPEH (Music, Arts, PE, Health)',
                'Technology & Livelihood (TLE)',
                'Values / Character Education',
                'Science, Technology & Engineering (STE)',
                'Special Program in the Arts (SPA)',
                'Special Program in Journalism (SPJ)',
                'Special Program in Sports (SPS)',
                'Special Program in Foreign Language (SPFL)',
                'Technical-Vocational Education (SPTVE)',
                'Madrasah / ALIVE Program',
                'ICT & Computer Education',
                'Other Subjects'
            ];
        } else {
            // Elementary
            catOrder = [
                'Core Academic Subjects',
                'Languages & Literacy',
                'Livelihood & Makabansa',
                'MAPEH (Music, Arts, PE, Health)',
                'Values / Character Education',
                'Special Science Elementary School (SSES)',
                'Madrasah / ALIVE Program',
                'ICT & Computer Education',
                'Other Subjects'
            ];
        }

        const groups: Record<string, Subject[]> = {};
        
        // Initialize all categories in order so they are always displayed
        catOrder.forEach(cat => {
            groups[cat] = [];
        });

        filteredSubjects.forEach((subject) => {
            const cat = getCategoryForSubject(subject.subject_name, selectedGrade);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(subject);
        });

        // Filter out empty groups so we don't display empty categories in the table
        const filteredGroups: Record<string, Subject[]> = {};
        Object.entries(groups).forEach(([cat, list]) => {
            if (list.length > 0) {
                filteredGroups[cat] = list;
            }
        });

        return filteredGroups;
    }, [filteredSubjects, selectedGrade]);

    // All sections matching the currently selected grade
    const gradeSections = useMemo(() => {
        if (!selectedGrade) return [];
        return sections.filter((section) => sectionMatchesGrade(section, selectedGrade));
    }, [sections, selectedGrade]);

    // Advisory sections matching the currently selected grade
    const advisorySections = useMemo(() => {
        return gradeSections.filter((section) => section.is_advisory);
    }, [gradeSections]);

    // Currently active advisory section for curriculum assignment
    const activeAdvisorySection = useMemo(() => {
        if (!selectedGrade || advisorySections.length === 0) return null;
        if (selectedAdvisorySectionId) {
            const match = advisorySections.find((s) => s.id === selectedAdvisorySectionId);
            if (match) return match;
        }
        // Match by user uid or adviser name if possible
        const userMatch = advisorySections.find((s) => s.adviser_id === user?.uid || (s.adviser_name && s.adviser_name === user?.displayName));
        return userMatch || advisorySections[0];
    }, [advisorySections, selectedAdvisorySectionId, selectedGrade, user]);

    const isGrade11 = Boolean(selectedGrade?.includes('11'));

    // Automatically initialize Grade 11 advisory section with Core Subjects if empty
    useEffect(() => {
        if (viewMode === 'subjects' && selectedGrade?.includes('11') && activeAdvisorySection && activeAdvisorySection.is_advisory) {
            if (!activeAdvisorySection.taught_subjects || activeAdvisorySection.taught_subjects.length === 0) {
                void updateSection({
                    ...activeAdvisorySection,
                    taught_subjects: [...GRADE_11_CORE_SUBJECTS]
                });
            }
        }
    }, [viewMode, selectedGrade, activeAdvisorySection, updateSection]);

    const handleToggleAdvisorySubject = async (subject: Subject) => {
        if (!activeAdvisorySection) {
            showNotification('No advisory section found for this grade level. Please create one in Classes & Sections.', 'info');
            return;
        }

        let currentTaught = activeAdvisorySection.taught_subjects || [];
        if (currentTaught.length === 0 && selectedGrade?.includes('11')) {
            currentTaught = [...GRADE_11_CORE_SUBJECTS];
        }

        const isAlreadyAssigned = currentTaught.some(s => isMatchingSubject(s, subject.id, subject.subject_name));

        let updatedTaught: string[];
        if (isAlreadyAssigned) {
            updatedTaught = currentTaught.filter(s => !isMatchingSubject(s, subject.id, subject.subject_name));
        } else {
            const isG12 = selectedGrade?.includes('12');
            const isExplicitSSHS = (activeAdvisorySection.track || '').toLowerCase().includes('sshs') || (activeAdvisorySection.track || '').toLowerCase().includes('cluster');
            const targetName = (isG12 && !isExplicitSSHS)
                ? normalizeGrade12PESubjectName(subject.subject_name, false)
                : subject.subject_name;
            updatedTaught = [...currentTaught, targetName];
        }

        try {
            await updateSection({
                ...activeAdvisorySection,
                taught_subjects: updatedTaught
            });

            if (isAlreadyAssigned) {
                showNotification(
                    `Removed ${subject.subject_name} from ${activeAdvisorySection.section_name} Advisory Curriculum.`,
                    'info'
                );
            } else {
                showNotification(
                    `Assigned ${subject.subject_name} to ${activeAdvisorySection.section_name} (Basis for SF9, SF10, & Summary of Grades).`,
                    'success'
                );
            }
        } catch (err) {
            console.error('Failed to update advisory curriculum:', err);
            showNotification('Failed to update advisory curriculum.', 'error');
        }
    };

    const handleAssignAllCoreToAdvisory = async () => {
        if (!activeAdvisorySection || !selectedGrade) return;
        const isG11 = selectedGrade.includes('11');
        const g11Cores = [
            'Effective Communication',
            'Mabisang Komunikasyon',
            'General Mathematics',
            'General Science',
            'Life and Career Skills',
            'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
        ];

        const currentTaughtSet = new Set((activeAdvisorySection.taught_subjects || []).map(s => s.trim().toLowerCase()));
        const newTaught = [...(activeAdvisorySection.taught_subjects || [])];

        filteredSubjects.forEach(s => {
            const norm = s.subject_name.trim().toLowerCase();
            const isCore = isG11 
                ? g11Cores.some(c => norm.includes(c.toLowerCase()))
                : getCategoryForSubject(s.subject_name, selectedGrade) === 'Core Academic Subjects';
            
            if (isCore && !currentTaughtSet.has(norm)) {
                newTaught.push(s.subject_name);
                currentTaughtSet.add(norm);
            }
        });

        try {
            await updateSection({
                ...activeAdvisorySection,
                taught_subjects: newTaught
            });
            showNotification(`Assigned Core subjects to ${activeAdvisorySection.section_name} advisory curriculum.`, 'success');
        } catch (err) {
            console.error('Failed to assign core subjects:', err);
            showNotification('Failed to assign core subjects.', 'error');
        }
    };

    const handleAssignAllOfferedToAdvisory = async () => {
        if (!activeAdvisorySection) return;
        const offered = filteredSubjects.filter(s => s.term !== 'none').map(s => s.subject_name);
        
        try {
            await updateSection({
                ...activeAdvisorySection,
                taught_subjects: offered
            });
            showNotification(`Assigned all ${offered.length} offered subjects to ${activeAdvisorySection.section_name}.`, 'success');
        } catch (err) {
            console.error('Failed to assign all offered subjects:', err);
            showNotification('Failed to assign all subjects.', 'error');
        }
    };

    const handleClearAdvisoryCurriculum = async () => {
        if (!activeAdvisorySection) return;
        try {
            await updateSection({
                ...activeAdvisorySection,
                taught_subjects: []
            });
            showNotification(`Cleared advisory curriculum for ${activeAdvisorySection.section_name}.`, 'info');
        } catch (err) {
            console.error('Failed to clear advisory curriculum:', err);
            showNotification('Failed to clear advisory curriculum.', 'error');
        }
    };

    const handleToggleSectionSubjectAssignment = async (targetSection: typeof sections[0], subjectName: string) => {
        const currentTaught = targetSection.taught_subjects || [];
        const norm = subjectName.trim().toLowerCase();
        const isAssigned = currentTaught.some(s => s.trim().toLowerCase() === norm);

        const updatedTaught = isAssigned
            ? currentTaught.filter(s => s.trim().toLowerCase() !== norm)
            : [...currentTaught, subjectName];

        try {
            await updateSection({
                ...targetSection,
                taught_subjects: updatedTaught
            });
            showNotification(
                `${isAssigned ? 'Removed' : 'Assigned'} ${subjectName} ${isAssigned ? 'from' : 'to'} ${targetSection.section_name}`,
                'success'
            );
        } catch (err) {
            console.error('Failed to update section assignment:', err);
            showNotification('Failed to update section assignment.', 'error');
        }
    };

    const handleGradeClick = (grade: string) => {
        setSelectedGrade(grade);
        setSubjectSearchQuery('');
        setSelectedSectionId('all');

        const matchingSecs = sections.filter((section) => sectionMatchesGrade(section, grade));
        const matchingAdvisories = matchingSecs.filter(s => s.is_advisory);
        const userAdvisory = matchingAdvisories.find(s => s.adviser_id === user?.uid || (s.adviser_name && s.adviser_name === user?.displayName));
        setSelectedAdvisorySectionId(userAdvisory?.id || matchingAdvisories[0]?.id || null);

        setViewMode('subjects');
    };

    const handleBackToGrades = () => {
        setSelectedGrade(null);
        setSelectedAdvisorySectionId(null);
        setSubjectSearchQuery('');
        setViewMode('grades');
    };

    const handleBackToCategories = () => {
        setSelectedCategory(null);
        setSelectedGrade(null);
        setSelectedAdvisorySectionId(null);
        setSubjectSearchQuery('');
        setViewMode('grades');
    };

    const openAddModal = () => {
        setEditingSubjectId(null);
        setUseDepEdWeightsLocked(true);
        const targetSection = sections.find(s => s.id === (selectedSectionId && selectedSectionId !== 'all' ? selectedSectionId : undefined));
        const std = getDepEdStandardWeights('', selectedGrade, targetSection?.track, targetSection?.curriculum_type);
        setFormData({
            subject_name: '',
            subject_code: '',
            grade_level: selectedGrade || '',
            section_id: (selectedSectionId && selectedSectionId !== 'all') ? selectedSectionId : '',
            teacher_id: '',
            term: selectedGrade ? getDefaultTermForSubject('', selectedGrade) : 'all',
            written_weight: String(Math.round(std.written_weight * 100)),
            performance_weight: String(Math.round(std.performance_weight * 100)),
            exam_weight: String(Math.round(std.exam_weight * 100))
        });
        setIsModalOpen(true);
    };

    const handleEdit = (subject: Subject) => {
        setEditingSubjectId(subject.id);
        const hasCustomWeights = subject.written_weight !== undefined || subject.performance_weight !== undefined || subject.exam_weight !== undefined;
        let isLocked = true;
        if (hasCustomWeights) {
            const targetSection = sections.find(s => s.id === (subject.section_id || (selectedSectionId !== 'all' ? selectedSectionId : undefined)));
            const std = getDepEdStandardWeights(subject.subject_name, subject.grade_level, targetSection?.track, targetSection?.curriculum_type);
            const subWw = normalizeWeightPercent(subject.written_weight);
            const subPt = normalizeWeightPercent(subject.performance_weight);
            const subQa = normalizeWeightPercent(subject.exam_weight);
            const stdWw = normalizeWeightPercent(std.written_weight);
            const stdPt = normalizeWeightPercent(std.performance_weight);
            const stdQa = normalizeWeightPercent(std.exam_weight);
            const matchesStd = subWw === stdWw && subPt === stdPt && subQa === stdQa;
            isLocked = matchesStd;
        }
        setUseDepEdWeightsLocked(isLocked);
        setFormData({
            subject_name: subject.subject_name,
            subject_code: subject.subject_code || '',
            grade_level: subject.grade_level,
            section_id: subject.section_id || '',
            teacher_id: subject.teacher_id || '',
            term: subject.term || 'all',
            written_weight: subject.written_weight !== undefined ? String(normalizeWeightPercent(subject.written_weight)) : '',
            performance_weight: subject.performance_weight !== undefined ? String(normalizeWeightPercent(subject.performance_weight)) : '',
            exam_weight: subject.exam_weight !== undefined ? String(normalizeWeightPercent(subject.exam_weight)) : ''
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

    const handleToggleOffered = async (subject: Subject) => {
        const grade = subject.grade_level || '';
        const gNum = parseInt(grade.replace(/\D/g, '')) || 0;
        const isElemOrJhs = (gNum >= 1 && gNum <= 10) || grade.toLowerCase().includes('kinder');
        if (isElemOrJhs) {
            showNotification('Elementary and Junior High School subjects are offered full-year and cannot be disabled.', 'info');
            return;
        }

        const isCurrentlyNotOffered = subject.term === 'none';
        const newTerm = isCurrentlyNotOffered ? 'all' : 'none';
        
        try {
            await updateSubject({
                ...subject,
                term: newTerm
            });
            showNotification(
                `Marked ${subject.subject_name} as ${isCurrentlyNotOffered ? 'Offered' : 'Not Offered'}.`,
                'success'
            );
        } catch (error) {
            console.error('Failed to toggle offered status:', error);
            showNotification('Failed to update offered status.', 'error');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const cleanName = formData.subject_name.trim();
        if (!cleanName) {
            showNotification('Subject name is required.', 'error');
            return;
        }

        const grade = (formData.grade_level || selectedGrade || '').trim();
        const targetSection = (formData.section_id || '').trim();

        // Tier 3 Prevention: Guard against adding or renaming to a duplicate subject
        const duplicateSubject = subjects.find(s =>
            s.id !== editingSubjectId &&
            (s.grade_level || '').trim() === grade &&
            (s.section_id || '').trim() === targetSection &&
            normalizeSubjectName((s.subject_name || '').trim()) === normalizeSubjectName(cleanName)
        );

        if (duplicateSubject) {
            showNotification(`A subject named "${duplicateSubject.subject_name}" already exists for ${grade || 'this grade'}${targetSection ? ' in this section' : ''}.`, 'error');
            return;
        }

        // Validation: If any weight is specified, check that all three are specified and sum to 100
        const hasWritten = formData.written_weight.trim() !== '';
        const hasPerformance = formData.performance_weight.trim() !== '';
        const hasExam = formData.exam_weight.trim() !== '';

        let writtenVal: number | undefined;
        let performanceVal: number | undefined;
        let examVal: number | undefined;

        if (hasWritten || hasPerformance || hasExam) {
            if (!hasWritten || !hasPerformance || !hasExam) {
                showNotification('If you specify custom weights, you must fill in all three fields (Written, Performance, and Exam).', 'error');
                return;
            }

            const w = parseFloat(formData.written_weight);
            const p = parseFloat(formData.performance_weight);
            const ex = parseFloat(formData.exam_weight);

            if (isNaN(w) || isNaN(p) || isNaN(ex) || w < 0 || p < 0 || ex < 0) {
                showNotification('Weights must be positive numbers.', 'error');
                return;
            }

            if (Math.abs((w + p + ex) - 100) > 0.001) {
                showNotification(`The sum of the percentages must equal exactly 100%. (Current sum: ${w + p + ex}%)`, 'error');
                return;
            }

            // Convert to fraction for DB storage
            writtenVal = w / 100;
            performanceVal = p / 100;
            examVal = ex / 100;
        }

        const isShsGrade = /11|12/.test(String(grade || ''));
        const finalTerm: Subject['term'] = isShsGrade
            ? (formData.term === 'all' ? 'all' : (formData.term === 'none' ? 'none' : Number(formData.term) as 1 | 2 | 3))
            : 'all';
        const finalOfferedTerms: (1 | 2 | 3)[] = isShsGrade
            ? normalizeOfferedTerms(finalTerm)
            : [1, 2, 3];

        const subjectData: Subject = {
            id: editingSubjectId || generateDeterministicSubjectId(grade, cleanName, targetSection || undefined),
            subject_name: cleanName,
            subject_code: formData.subject_code ? formData.subject_code.trim() : '',
            grade_level: grade,
            section_id: targetSection || undefined,
            teacher_id: formData.teacher_id || undefined,
            term: finalTerm,
            offered_terms: finalOfferedTerms,
            written_weight: writtenVal,
            performance_weight: performanceVal,
            exam_weight: examVal
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

    const duplicateGhostInfo = useMemo(() => {
        const gradeGroups: Record<string, Subject[]> = {};
        const untrimmedSubjects: Subject[] = [];
        const validSectionIds = new Set(sections.flatMap(sec => [sec.id, sec.section_name]));

        subjects.forEach(s => {
            if (s.subject_name !== s.subject_name.trim()) {
                untrimmedSubjects.push(s);
            }
            const canon = getCanonicalSubjectKey(s.subject_name, s.grade_level) || normalizeSubjectLabel(s.subject_name);
            const isOrphanedSection = Boolean(s.section_id && !validSectionIds.has(s.section_id));
            const secKey = isOrphanedSection ? 'all' : (s.section_id || 'all');
            const key = `${s.grade_level || 'all'}::${secKey}::${canon}`;
            if (!gradeGroups[key]) gradeGroups[key] = [];
            gradeGroups[key].push(s);
        });

        const duplicateClusters = Object.values(gradeGroups).filter(group => group.length > 1);
        const totalDuplicates = duplicateClusters.reduce((acc, g) => acc + (g.length - 1), 0);

        const activeSubjectIds = new Set(subjects.map(s => s.id));
        const orphanedClassRecords = classRecords.filter(cr => cr.subject_id && !activeSubjectIds.has(cr.subject_id));
        const orphanedGradingRecords = gradingSheetRecords.filter(gs => gs.subject_id && !activeSubjectIds.has(gs.subject_id));
        const totalOrphaned = orphanedClassRecords.length + orphanedGradingRecords.length;

        const hasIssues = totalDuplicates > 0 || untrimmedSubjects.length > 0 || totalOrphaned > 0;
        const sampleDuplicates = duplicateClusters.slice(0, 3).map(g => g[0].subject_name);

        return {
            hasIssues,
            duplicateClusters,
            totalDuplicates,
            untrimmedCount: untrimmedSubjects.length,
            totalOrphaned,
            sampleDuplicates
        };
    }, [subjects, classRecords, gradingSheetRecords, sections]);

    const handleMergeAndCleanDuplicates = async () => {
        setIsMergingDuplicates(true);
        try {
            let mergedCount = 0;
            const duplicateIdsToDelete: string[] = [];
            const dupIdToCanonicalMap = new Map<string, Subject>();
            const classRecordsToUpdate: ClassRecord[] = [];
            const gradingRecordsToUpdate: ClassRecord[] = [];
            const hpsRecordsToUpdate: HPSRecord[] = [];

            for (const cluster of duplicateGhostInfo.duplicateClusters) {
                const clusterGrade = cluster[0].grade_level;
                const gNum = parseInt((clusterGrade || '').replace(/\D/g, '')) || 0;
                const isElem = (gNum >= 1 && gNum <= 6) || (clusterGrade || '').toLowerCase().includes('elem');
                const isJhs = (gNum >= 7 && gNum <= 10) || (clusterGrade || '').toLowerCase().includes('jhs');

                let officialTarget: string | null = null;
                const cKey = getCanonicalSubjectKey(cluster[0].subject_name, clusterGrade);
                if (cKey === 'gmrc' || normalizeSubjectLabel(cluster[0].subject_name) === 'gmrc') {
                    if (isElem) officialTarget = 'GMRC (Good Manners and Right Conduct)';
                    if (isJhs) officialTarget = 'Values Education';
                } else if (cKey.startsWith('physicaleducationandhealth')) {
                    const numMatch = cKey.match(/[1-4]$/)?.[0];
                    officialTarget = numMatch ? `Physical Education and Health ${numMatch}` : 'Physical Education and Health';
                }

                // Find canonical subject: prefer master subject (!s.section_id), official DepEd template name, deterministic ID, or cleanly trimmed name
                let canonical = cluster.find(s => !s.section_id && officialTarget && s.subject_name === officialTarget)
                    || cluster.find(s => !s.section_id)
                    || cluster.find(s => officialTarget && s.subject_name === officialTarget)
                    || cluster.find(s => UNIVERSAL_SUBJECT_ORDER.includes(s.subject_name))
                    || cluster.find(s => s.subject_name.includes('(') && s.subject_name.includes(')'))
                    || cluster.find(s => !s.id.startsWith('sub_') && s.subject_name === s.subject_name.trim())
                    || cluster[0];

                if (officialTarget && canonical.subject_name !== officialTarget) {
                    canonical = { ...canonical, subject_name: officialTarget };
                    await updateSubject(canonical);
                } else if (canonical.subject_name !== canonical.subject_name.trim()) {
                    canonical = { ...canonical, subject_name: canonical.subject_name.trim() };
                    await updateSubject(canonical);
                }

                const duplicates = cluster.filter(s => s.id !== canonical.id);
                for (const dup of duplicates) {
                    duplicateIdsToDelete.push(dup.id);
                    dupIdToCanonicalMap.set(dup.id, canonical);
                    mergedCount++;

                    classRecords.forEach(cr => {
                        if (cr.subject_id === dup.id) {
                            classRecordsToUpdate.push({
                                ...cr,
                                subject_id: canonical.id,
                                subject_name: canonical.subject_name
                            });
                        }
                    });

                    gradingSheetRecords.forEach(gs => {
                        if (gs.subject_id === dup.id) {
                            gradingRecordsToUpdate.push({
                                ...gs,
                                subject_id: canonical.id,
                                subject_name: canonical.subject_name
                            });
                        }
                    });

                    hpsRecords.forEach(hps => {
                        if (hps.subject_id === dup.id) {
                            hpsRecordsToUpdate.push({
                                ...hps,
                                subject_id: canonical.id
                            });
                        }
                    });
                }
            }

            // Update records in parallel batches or sequentially
            for (const cr of classRecordsToUpdate) {
                await updateClassRecord(cr);
            }
            if (gradingRecordsToUpdate.length > 0) {
                await bulkUpdateGradingSheetRecords(gradingRecordsToUpdate);
            }
            for (const hps of hpsRecordsToUpdate) {
                await updateHPSRecord(hps);
            }

            // Delete duplicate subject items
            if (duplicateIdsToDelete.length > 0) {
                await deleteSubjectsBulk(duplicateIdsToDelete);
            }

            // Update all sections so taught_subjects and teaching_subjects replace duplicates with canonical names
            for (const sec of sections) {
                let secChanged = false;
                const sanitizeSecList = (list?: string[]): string[] | undefined => {
                    if (!list) return undefined;
                    const mapped = list.map(item => {
                        const trimmed = item.trim();
                        for (const [dupId, canon] of dupIdToCanonicalMap.entries()) {
                            if (dupId === trimmed || normalizeSubjectName(trimmed) === normalizeSubjectName(dupId)) {
                                secChanged = true;
                                return canon.subject_name;
                            }
                        }
                        const itemCanon = getCanonicalSubjectKey(trimmed, sec.section_grade_level);
                        for (const canon of dupIdToCanonicalMap.values()) {
                            const canonKey = getCanonicalSubjectKey(canon.subject_name, sec.section_grade_level);
                            if (itemCanon && canonKey && itemCanon === canonKey) {
                                if (trimmed !== canon.subject_name) {
                                    secChanged = true;
                                    return canon.subject_name;
                                }
                            }
                        }
                        return trimmed;
                    });
                    const seen = new Set<string>();
                    const deduped: string[] = [];
                    for (const m of mapped) {
                        const k = getCanonicalSubjectKey(m, sec.section_grade_level) || normalizeSubjectName(m);
                        if (k && seen.has(k)) {
                            secChanged = true;
                            continue;
                        }
                        if (k) seen.add(k);
                        deduped.push(m);
                    }
                    if (deduped.length !== list.length) secChanged = true;
                    return deduped;
                };

                const newTaught = sanitizeSecList(sec.taught_subjects);
                const newTeaching = sanitizeSecList(sec.teaching_subjects);
                if (secChanged) {
                    await updateSection({
                        ...sec,
                        taught_subjects: newTaught,
                        teaching_subjects: newTeaching
                    });
                }
            }

            // Reconcile any remaining orphaned grade records
            const recon = reconcileOrphanedGradesAndSubjects({
                subjects,
                sections,
                students,
                classRecords,
                hpsRecords,
                gradingSheetRecords
            });

            if (recon.deletedSubjectIds.length > 0) {
                for (const delId of recon.deletedSubjectIds) {
                    await deleteSubject(delId);
                }
            }

            if (recon.modified || recon.subjectsModified) {
                for (const s of recon.subjects) {
                    const existing = subjects.find(cur => cur.id === s.id);
                    if (existing) {
                        await updateSubject(s);
                    } else {
                        await addSubject(s);
                    }
                }
            }

            if (recon.modified) {
                await db.putRecordsBulk('classRecords', recon.classRecords);
                await db.putRecordsBulk('hpsRecords', recon.hpsRecords);
                await db.putRecordsBulk('gradingSheetRecords', recon.gradingSheetRecords);
                useAppStore.setState({
                    classRecords: recon.classRecords,
                    hpsRecords: recon.hpsRecords,
                    gradingSheetRecords: recon.gradingSheetRecords
                });
            }

            if (recon.sectionsModified && recon.sections) {
                for (const sec of recon.sections) {
                    await updateSection(sec);
                }
            }

            showNotification(
                mergedCount > 0
                    ? `Successfully merged and cleaned ${mergedCount} duplicate subject(s) with all grades preserved!`
                    : 'Cleaned duplicate and orphaned subjects successfully!',
                'success'
            );
        } catch (err) {
            console.error('Failed to merge duplicate subjects:', err);
            showNotification('Failed to merge duplicate subjects. Please try again.', 'error');
        } finally {
            setIsMergingDuplicates(false);
        }
    };

    const handleApplyDepEdWeights = async () => {
        if (!selectedGrade || filteredSubjects.length === 0) return;

        try {
            let updatedCount = 0;
            for (const sub of filteredSubjects) {
                const targetSection = sections.find(s => s.id === sub.section_id);
                const std = getDepEdStandardWeights(sub.subject_name, sub.grade_level, targetSection?.track, targetSection?.curriculum_type);
                await updateSubject({
                    ...sub,
                    written_weight: std.written_weight,
                    performance_weight: std.performance_weight,
                    exam_weight: std.exam_weight
                });
                updatedCount++;
            }
            showNotification(`Applied DepEd Standard Weights to ${updatedCount} subjects in ${selectedGrade}!`, 'success');
        } catch (err) {
            console.error('Failed to apply DepEd weights:', err);
            showNotification('Failed to apply DepEd standard weights.', 'error');
        }
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
        <div className="space-y-4 pb-6 relative min-h-[80vh]">
            {/* Global Page Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0 overflow-hidden">
                <img 
                    src={schoolProfile?.logo_url || `${import.meta.env.BASE_URL}school-logo.png`} 
                    className="w-200 h-200 object-contain grayscale scale-150 -rotate-12"
                    alt=""
                />
            </div>

            {/* Ghost & Duplicate Subject Detector Alert Banner */}
            {duplicateGhostInfo.hasIssues && canEdit && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 shadow-xs relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                                    Ghost & Duplicate Subject Detector
                                </h4>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-400/30">
                                    {duplicateGhostInfo.totalDuplicates + duplicateGhostInfo.untrimmedCount + (duplicateGhostInfo.totalOrphaned > 0 ? 1 : 0)} Issues Detected
                                </span>
                            </div>
                            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                                {duplicateGhostInfo.totalDuplicates > 0
                                    ? `Found duplicate subject records${duplicateGhostInfo.sampleDuplicates.length > 0 ? ` (${duplicateGhostInfo.sampleDuplicates.join(', ')})` : ''} that can split student grades.`
                                    : 'Found orphaned grade entries or untrimmed subject names.'}
                                {' Click Merge & Clean to safely re-link all grades and remove duplicate records.'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleMergeAndCleanDuplicates}
                        disabled={isMergingDuplicates}
                        className="px-4 py-2 bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50"
                    >
                        <Settings className={`w-3.5 h-3.5 ${isMergingDuplicates ? 'animate-spin' : ''}`} />
                        <span>{isMergingDuplicates ? 'Merging Grades...' : 'Merge & Clean Duplicates'}</span>
                    </button>
                </div>
            )}

            {/* Redesigned Compact Header Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-[#0f172a]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-2.5 rounded-2xl shadow-2xs relative z-10">
                <div className="flex items-center gap-3">
                    {/* Compact Navigation / Breadcrumbs */}
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => { setViewMode('grades'); setSelectedCategory(null); }}>Grades</span>
                        {viewMode !== 'grades' && (
                            <>
                                <ChevronRight className="w-3 h-3 text-slate-350 dark:text-slate-500" />
                                <span className="text-slate-700 dark:text-slate-200 font-extrabold">{selectedGrade}</span>
                            </>
                        )}
                    </div>

                    {/* Compact Badge indicating special/standard loaded */}
                    {viewMode === 'subjects' && filteredSubjects.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                            lastLoadedCurriculumType === 'special' 
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/40' 
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40'
                        }`}>
                            {lastLoadedCurriculumType === 'special' ? '⭐ Special Template' : '📚 Standard Template'}
                        </span>
                    )}
                </div>
                
                {/* Actions Row */}
                <div className="flex items-center gap-2">
                    {viewMode !== 'grades' && (
                        <button 
                            onClick={handleBackToGrades}
                            className="h-8 px-3.5 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-white/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back
                        </button>
                    )}

                    {viewMode === 'subjects' && canEdit && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleApplyDepEdWeights}
                                className="h-8 px-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800/40 active:scale-95 cursor-pointer"
                                title="Apply DepEd standard weights (Math/Science: 40-40-20, Languages/AP/EsP: 30-50-20, TLE/MAPEH: 20-60-20) to all subjects in this grade"
                            >
                                <Scale className="w-3.5 h-3.5" />
                                <span>DepEd Weights</span>
                            </button>
                            <button 
                                onClick={() => {
                                    setWizardStep('choice');
                                    setShowCurriculumChoice(true);
                                }}
                                className="h-8 px-3.5 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
                                title="Choose from MATATAG, Standard, STE, SPA, and Specialized Subject Offerings"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                Choose Offerings
                            </button>
                            <button 
                                onClick={handleMergeAndCleanDuplicates}
                                disabled={isMergingDuplicates}
                                className="h-8 px-3 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl font-bold text-xs hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all flex items-center gap-1.5 border border-amber-200 dark:border-amber-800/40 active:scale-95 cursor-pointer disabled:opacity-50"
                                title="Safely merge duplicate subject records and consolidate grades"
                            >
                                <Settings className={`w-3.5 h-3.5 ${isMergingDuplicates ? 'animate-spin' : ''}`} />
                                <span>{isMergingDuplicates ? 'Merging...' : 'Clean Duplicates'}</span>
                            </button>
                            {filteredSubjects.length > 0 && (
                                <button 
                                    onClick={() => setShowDeleteAllConfirm(true)}
                                    className="h-8 px-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 rounded-xl font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all flex items-center gap-1.5 border border-rose-100 dark:border-rose-800/40 active:scale-95 cursor-pointer"
                                    title="Delete all subjects in this view"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete All
                                </button>
                            )}
                            <button 
                                onClick={openAddModal} 
                                className="h-8 px-3.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-indigo-700 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Subject
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
                        className="space-y-4 relative"
                    >
                        {!selectedCategory ? (
                            <>
                                {/* Quick Guide Header — Compact Modern Workflow Banner */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="relative z-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden mb-4"
                                >
                                    {/* Ambient Glow */}
                                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
                                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                                    {/* Section Header Badge */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2.5">
                                            <span className="flex h-2.5 w-2.5 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                            </span>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                                                DepEd Curriculum & Subject Management Workflow
                                            </h3>
                                        </div>
                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                                            3-Step Automated Setup
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                                        {/* Step 1 */}
                                        <div className="group relative bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-500/30 transition-all hover:bg-white dark:hover:bg-slate-800/60 shadow-2xs">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                                                    <BookOpen className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                                1. Select Department
                                            </h4>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">
                                                Choose Elementary, JHS, or SHS to explore grade levels and curriculum tracks.
                                            </p>
                                        </div>

                                        {/* Step 2 */}
                                        <div className="group relative bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-500/30 transition-all hover:bg-white dark:hover:bg-slate-800/60 shadow-2xs">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                                                    <Settings className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                                2. Configure Subjects
                                            </h4>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">
                                                Add custom subjects or auto-load standard DepEd templates per grade level.
                                            </p>
                                        </div>

                                        {/* Step 3 */}
                                        <div className="group relative bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-500/30 transition-all hover:bg-white dark:hover:bg-slate-800/60 shadow-2xs">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                                3. Automatic Report Sync
                                            </h4>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">
                                                Subjects automatically sync with class records, E-Class sheets, and official SF9/SF10 reports.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Category Cards Grid — Compact Viewport Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                                    {(Object.entries(CATEGORIES) as [keyof typeof CATEGORIES, typeof CATEGORIES[keyof typeof CATEGORIES]][]).map(([key, category]) => {
                                        const gradeList = category.grades;
                                        const totalSubjectsInDept = subjects.filter(s => gradeList.includes(s.grade_level) && !s.is_teaching_load).length;
                                        const activeSectionsCount = sections.filter(sec => gradeList.some(g => sectionMatchesGrade(sec, g))).length;

                                        return (
                                            <motion.button
                                                key={key}
                                                whileHover={{ y: -4, scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSelectedCategory(key)}
                                                className="relative group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 text-left overflow-hidden h-full flex flex-col justify-between"
                                            >
                                                {/* Background Accent Mesh Gradient */}
                                                <div className={`absolute top-0 right-0 w-36 h-36 bg-linear-to-br ${category.color} opacity-10 blur-2xl rounded-full group-hover:opacity-20 transition-opacity pointer-events-none`} />

                                                {/* Background Icon Watermark */}
                                                <div className="absolute -right-5 -bottom-5 opacity-[0.05] dark:opacity-[0.08] group-hover:opacity-[0.12] transition-all duration-500 pointer-events-none transform -rotate-12 group-hover:rotate-0 group-hover:scale-110 text-slate-800 dark:text-white">
                                                    <category.icon className="w-32 h-32" />
                                                </div>

                                                <div className="relative z-10">
                                                    {/* Top Row: Icon & Range Badge */}
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${category.color} flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300`}>
                                                            <category.icon className="w-5.5 h-5.5" />
                                                        </div>
                                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                                                            {category.range}
                                                        </span>
                                                    </div>

                                                    {/* Title & Description */}
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1.5 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {category.title}
                                                    </h3>
                                                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-4 font-medium line-clamp-2">
                                                        {category.description}
                                                    </p>

                                                    {/* Grade Level Chips Preview */}
                                                    <div className="flex flex-wrap gap-1 mb-4">
                                                        {category.grades.map((g) => {
                                                            const shortLabel = g.replace('Grade ', 'G');
                                                            return (
                                                                <span 
                                                                    key={g} 
                                                                    className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 group-hover:border-indigo-200 transition-colors"
                                                                >
                                                                    {shortLabel}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Card Footer Info & CTA */}
                                                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between relative z-10">
                                                    <div className="flex items-center gap-3 text-xs">
                                                        <div>
                                                            <span className="font-black text-slate-900 dark:text-white">{totalSubjectsInDept}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold ml-1">Subjects</span>
                                                        </div>
                                                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                        <div>
                                                            <span className="font-black text-slate-900 dark:text-white">{activeSectionsCount}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold ml-1">Sections</span>
                                                        </div>
                                                    </div>

                                                    <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 group-hover:bg-linear-to-r ${category.color} text-slate-700 dark:text-slate-200 group-hover:text-white transition-all shadow-2xs group-hover:shadow-sm`}>
                                                        <span>Explore</span>
                                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                                    </div>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={handleBackToCategories}
                                            className="w-11 h-11 rounded-2xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all shadow-xs active:scale-95 cursor-pointer"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{CATEGORIES[selectedCategory].title}</h2>
                                            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{CATEGORIES[selectedCategory].range}</p>
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
                                                whileHover={{ scale: 1.02, y: -4 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleGradeClick(grade)}
                                                className="group bg-white dark:bg-[#0d1225] rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 shadow-md hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all cursor-pointer overflow-hidden relative flex flex-col justify-between"
                                            >
                                                <div className={`absolute top-0 right-0 w-28 h-28 ${meta.bg} dark:bg-white/5 rounded-bl-full -mr-8 -mt-8 opacity-40 group-hover:scale-110 transition-transform pointer-events-none`} />
                                                
                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${meta.color} flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-transform`}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                                                            {grade}
                                                        </span>
                                                    </div>

                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{grade}</h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6 line-clamp-2">
                                                        {meta.description}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10 mt-auto relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div>
                                                            <div className="text-lg font-black text-slate-900 dark:text-white leading-none mb-0.5">{count}</div>
                                                            <div className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Subjects</div>
                                                        </div>
                                                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                        <div>
                                                            <div className="text-lg font-black text-slate-900 dark:text-white leading-none mb-0.5">{sectionCount}</div>
                                                            <div className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">Sections</div>
                                                        </div>
                                                    </div>

                                                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/10 group-hover:bg-indigo-600 flex items-center justify-center text-slate-400 dark:text-slate-300 group-hover:text-white transition-all">
                                                        <ArrowRight className="w-4 h-4" />
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
                        className="space-y-4"
                    >
                        {/* Advisory Curriculum Management Toolbar Banner (SHS Grade 11 DO 017 Cluster System Only) */}
                        {isGrade11 && (
                            <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-4 sm:p-5 border border-indigo-500/20 shadow-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                                                    Grade 11 Advisory Curriculum Scope
                                                </h3>
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                                    DepEd Order No. 017, s. 2026 • SF9 & SF10
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-300 font-medium mt-0.5 max-w-2xl">
                                                Select the specific cluster electives and core subjects for this Grade 11 advisory section. Unassigned track electives will remain excluded from SF9 and SF10.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Section Selector & Quick Batch Actions */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {advisorySections.length > 0 ? (
                                            <>
                                                {advisorySections.length > 1 ? (
                                                    <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-1.5 border border-white/10">
                                                        <span className="text-[10px] font-bold text-slate-300 uppercase">Advisory:</span>
                                                        <select
                                                            value={activeAdvisorySection?.id || ''}
                                                            onChange={(e) => setSelectedAdvisorySectionId(e.target.value)}
                                                            className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                                                        >
                                                            {advisorySections.map(sec => (
                                                                <option key={sec.id} value={sec.id} className="bg-slate-900 text-white">
                                                                    {sec.section_name} {sec.adviser_name ? `(${sec.adviser_name})` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ) : activeAdvisorySection ? (
                                                    <div className="px-3 py-1.5 bg-white/10 rounded-xl border border-white/10 text-xs font-bold text-white flex items-center gap-1.5">
                                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span>{activeAdvisorySection.section_name}</span>
                                                        {activeAdvisorySection.adviser_name && (
                                                            <span className="text-[10px] text-slate-300">({activeAdvisorySection.adviser_name})</span>
                                                        )}
                                                    </div>
                                                ) : null}
                                                
                                                {canEdit && activeAdvisorySection && (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={handleAssignAllCoreToAdvisory}
                                                            title="Assign all standard Grade 11 Core subjects to this advisory section"
                                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-400/40 active:scale-95 cursor-pointer shadow-xs"
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                                            <span>Assign Core</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleAssignAllOfferedToAdvisory}
                                                            title="Assign all currently offered Grade 11 subjects to advisory"
                                                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border border-white/10"
                                                        >
                                                            <span>Assign All</span>
                                                        </button>
                                                        {(activeAdvisorySection.taught_subjects?.length || 0) > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={handleClearAdvisoryCurriculum}
                                                                title="Clear all assigned advisory subjects"
                                                                className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border border-rose-500/30"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-xs text-amber-300 flex items-center gap-1.5 bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-500/30">
                                                <ShieldAlert className="w-4 h-4" />
                                                <span>No advisory class found for {selectedGrade}.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {activeAdvisorySection && (
                                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400">Advisory Status:</span>
                                            {(activeAdvisorySection.taught_subjects?.length || 0) > 0 ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    {activeAdvisorySection.taught_subjects?.length} subjects explicitly assigned to {activeAdvisorySection.section_name}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                    No explicit subjects assigned yet. Click "Assign to Advisory" on subjects below.
                                                </span>
                                            )}
                                        </div>
                                        {(activeAdvisorySection.taught_subjects?.length || 0) > 0 && (
                                            <span className="text-[11px] text-slate-400">
                                                Only these {activeAdvisorySection.taught_subjects?.length} subjects will appear in SF9, SF10, & Summary of Grades.
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Section Filter Tabs (Multi-Section Visibility) */}
                        {gradeSections.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white/80 dark:bg-[#0f172a]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-2.5 pr-1 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                                    <span className="hidden sm:inline">Section:</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedSectionId('all')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                                        !selectedSectionId || selectedSectionId === 'all'
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
                                    }`}
                                >
                                    <span>All Sections (Master)</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                                        !selectedSectionId || selectedSectionId === 'all'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-200/70 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                    }`}>
                                        {gradeSections.length}
                                    </span>
                                </button>
                                {gradeSections.map(sec => {
                                    const secStudentCount = students.filter(s => s.student_section === sec.section_name || s.student_section === sec.id).length;
                                    const isSelected = selectedSectionId === sec.id;
                                    return (
                                        <button
                                            key={sec.id}
                                            type="button"
                                            onClick={() => setSelectedSectionId(sec.id)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                    : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
                                            }`}
                                        >
                                            <span>{sec.section_name}</span>
                                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                                                isSelected
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-slate-200/70 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                            }`}>
                                                {secStudentCount}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Curriculum Track Filter Tabs (Grade 7 - 10) */}
                        {isJhsGrade && jhsTrackCounts && totalGradeSubjectsCount > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white/80 dark:bg-[#0f172a]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-2.5 pr-1 hidden sm:inline">Track:</span>
                                {[
                                    { key: 'all' as const, label: 'All', count: jhsTrackCounts.all },
                                    { key: 'core' as const, label: 'Core MATATAG', count: jhsTrackCounts.core },
                                    { key: 'ste' as const, label: 'STE', count: jhsTrackCounts.ste },
                                    { key: 'spa' as const, label: 'SPA', count: jhsTrackCounts.spa },
                                    { key: 'spj' as const, label: 'SPJ', count: jhsTrackCounts.spj },
                                    { key: 'tvl' as const, label: 'TVL', count: jhsTrackCounts.tvl },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setJhsTrackFilter(tab.key)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                                            jhsTrackFilter === tab.key
                                                ? 'bg-indigo-600 text-white shadow-xs'
                                                : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                                            jhsTrackFilter === tab.key
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-200/70 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Search and Quick Filters Bar */}
                        {totalGradeSubjectsCount > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-3 rounded-2xl shadow-2xs">
                                <div className="relative flex-1 min-w-65 max-w-xl">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={subjectSearchQuery}
                                        onChange={(e) => setSubjectSearchQuery(e.target.value)}
                                        placeholder={`Search ${selectedGrade} subjects by name or code (e.g. Math, Pre-Calculus, CSS)...`}
                                        className="w-full h-9.5 pl-10 pr-9 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                                    />
                                    {subjectSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSubjectSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                            title="Clear search"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {subjectSearchQuery.trim() ? (
                                        <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                                            {filteredSubjects.length} of {totalGradeSubjectsCount} found
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                                            {filteredSubjects.length} {filteredSubjects.length === 1 ? 'subject' : 'subjects'} total
                                        </span>
                                    )}

                                    {Object.keys(groupedSubjects).length > 1 && !subjectSearchQuery.trim() && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const allCategories = Object.keys(groupedSubjects);
                                                const anyCollapsed = allCategories.some(cat => collapsedCategories[cat] ?? true);
                                                const newCollapsed: Record<string, boolean> = {};
                                                allCategories.forEach(cat => {
                                                    newCollapsed[cat] = !anyCollapsed;
                                                });
                                                setCollapsedCategories(newCollapsed);
                                            }}
                                            className="h-9 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer border border-slate-200/60 dark:border-white/10"
                                        >
                                            <Layers className="w-3.5 h-3.5" />
                                            <span>
                                                {Object.keys(groupedSubjects).some(cat => collapsedCategories[cat] ?? true) ? 'Expand All' : 'Collapse All'}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Subjects Table Container */}
                        <div className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white rounded-[2.5rem] border border-slate-100 dark:border-white/10 shadow-xs overflow-hidden">
                            {totalGradeSubjectsCount === 0 ? (
                                <div className="p-24 text-center">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <BookText className="w-10 h-10 text-slate-300 dark:text-slate-500" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Empty Curriculum</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">This grade doesn't have any subjects yet. You can add them manually or use the level template.</p>
                                    {canEdit && (
                                        <button 
                                            onClick={() => {
                                                setWizardStep('choice');
                                                setShowCurriculumChoice(true);
                                            }} 
                                            disabled={isLoadingTemplate}
                                            className="mt-8 h-12 px-8 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl flex items-center gap-2 mx-auto cursor-pointer"
                                        >
                                            <Sparkles className="w-4 h-4 text-amber-300" />
                                            {isLoadingTemplate ? 'Loading...' : 'Choose Curriculum / Offerings'}
                                        </button>
                                    )}
                                    {!selectedSection && (
                                        <button onClick={() => setCurrentView('institute')} className="mt-4 block mx-auto text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-tighter hover:underline">Go to Institute Profile</button>
                                    )}
                                </div>
                            ) : filteredSubjects.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-white/10">
                                        <Search className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">No Subjects Found</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                                        No subjects match your search "{subjectSearchQuery}".
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setSubjectSearchQuery('')}
                                        className="mt-4 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                                    >
                                        Clear Search Filter
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto p-4">
                                    <table className="w-full text-left border-separate border-spacing-y-3">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em]">
                                                {canEdit && <th className="px-6 py-4 w-16 text-center">Pos</th>}
                                                <th className="px-6 py-4">Subject Info</th>
                                                <th className="px-6 py-4">Term Offered</th>
                                                {isGrade11 && <th className="px-6 py-4">Advisory Class (SF9/SF10)</th>}
                                                {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(groupedSubjects).map(([category, categorySubjects]) => {
                                                const isSHS = selectedGrade?.includes('11') || selectedGrade?.includes('12');
                                                const isCollapsed = subjectSearchQuery.trim() ? false : (collapsedCategories[category] ?? isSHS);
                                                return (
                                                    <Fragment key={category}>
                                                        {category && (
                                                            <tr 
                                                                onClick={() => toggleCategory(category)}
                                                                className="bg-slate-50/50 dark:bg-white/5 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/10 transition-colors select-none"
                                                            >
                                                                <td colSpan={canEdit ? (isGrade11 ? 5 : 4) : (isGrade11 ? 4 : 3)} className="px-6 py-4 border-y border-slate-100 dark:border-white/10">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                                                            <span className="text-xs font-black text-slate-600 dark:text-slate-200 uppercase tracking-widest">
                                                                                {category}
                                                                            </span>
                                                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                                                                {categorySubjects.length} {categorySubjects.length === 1 ? 'subject' : 'subjects'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                                                            <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
                                                                            <ChevronRight className={`w-4 h-4 transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {!isCollapsed && categorySubjects.map((subject, idx) => {
                                                            const isG11 = selectedGrade?.includes('11');
                                                            const isG11Core = isG11 && isGrade11CoreSubject(subject.subject_name);
                                                            const hasExplicitTaught = (activeAdvisorySection?.taught_subjects?.length || 0) > 0;

                                                            const isInAdvisory = Boolean(
                                                                activeAdvisorySection?.taught_subjects?.some(
                                                                    s => isMatchingSubject(s, subject.id, subject.subject_name)
                                                                ) || (!hasExplicitTaught && isG11Core)
                                                            );

                                                            return (
                                                                <motion.tr
                                                                    key={subject.id}
                                                                    layout
                                                                    draggable={canEdit}
                                                                    onDragStart={() => handleDragStart(subject.id)}
                                                                    onDragOver={handleDragOver}
                                                                    onDrop={() => handleDrop(subject.id)}
                                                                    onDragEnd={() => setDraggedSubjectId(null)}
                                                                    className={`group rounded-3xl bg-white dark:bg-[#0f172a]/60 border border-slate-50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/10 hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all ${
                                                                        draggedSubjectId === subject.id ? 'opacity-40 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' : ''
                                                                    } ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                                                >
                                                                    {canEdit && (
                                                                        <td className="px-6 py-6 text-center">
                                                                            <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                                                <button
                                                                                    onClick={() => moveSubject(subject.id, 'up')}
                                                                                    disabled={idx === 0}
                                                                                    className="text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-0 transition-colors cursor-pointer"
                                                                                >
                                                                                    <ChevronRight className="w-4 h-4 -rotate-90" />
                                                                                </button>
                                                                                <div className="text-[10px] font-black text-slate-300 dark:text-slate-600">{(idx + 1).toString().padStart(2, '0')}</div>
                                                                                <button
                                                                                    onClick={() => moveSubject(subject.id, 'down')}
                                                                                    disabled={idx === categorySubjects.length - 1}
                                                                                    className="text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-0 transition-colors cursor-pointer"
                                                                                >
                                                                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    )}
                                                                    <td className="px-6 py-6">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/10 border border-slate-100 dark:border-white/10 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-sm">
                                                                                {subject.subject_name.charAt(0)}
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-black text-slate-900 dark:text-white text-lg tracking-tight uppercase">{subject.subject_name}</div>
                                                                                {subject.subject_code && <div className="text-[10px] font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest mt-0.5">{subject.subject_code}</div>}
                                                                                {subject.written_weight !== undefined && subject.performance_weight !== undefined && subject.exam_weight !== undefined && (
                                                                                    <div className="text-[10px] font-medium text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/40 rounded px-1.5 py-0.5 inline-block mt-1 uppercase tracking-wide mr-2">
                                                                                        Custom Weights: WW: {normalizeWeightPercent(subject.written_weight)}% | PT: {normalizeWeightPercent(subject.performance_weight)}% | QA: {normalizeWeightPercent(subject.exam_weight)}%
                                                                                    </div>
                                                                                )}
                                                                                {(() => {
                                                                                    if (!subject.section_id) {
                                                                                        const secCount = gradeSections.length;
                                                                                        return (
                                                                                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded px-1.5 py-0.5 inline-flex items-center gap-1 mt-1 uppercase tracking-wide">
                                                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                                                <span>Grade-Wide Master • {secCount > 0 ? `All ${secCount} Sections` : 'All Sections'}</span>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    const sect = sections.find(s => s.id === subject.section_id || s.section_name === subject.section_id);
                                                                                    const sectName = sect ? sect.section_name : subject.section_id;
                                                                                    const sectStudents = students.filter(s => s.student_section === sectName || s.student_section === subject.section_id);
                                                                                    const sectCount = sectStudents.length;
                                                                                    const enrolledCount = subject.enrolled_student_lrns && subject.enrolled_student_lrns.length > 0 
                                                                                        ? subject.enrolled_student_lrns.length 
                                                                                        : sectCount;
                                                                                    return (
                                                                                        <div className="text-[10px] font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/40 rounded px-1.5 py-0.5 inline-flex items-center gap-1 mt-1 uppercase tracking-wide">
                                                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                                            <span>Enrolled: {enrolledCount} / {sectCount} Learners • {sectName}</span>
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-6">
                                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${
                                                                            subject.term === 1 ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800/40' :
                                                                            subject.term === 2 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/40' :
                                                                            subject.term === 3 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-800/40' :
                                                                            subject.term === 'none' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border-rose-100 dark:border-rose-800/40' :
                                                                            'bg-slate-50 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-white/10'
                                                                        }`}>
                                                                            {subject.term === 1 ? 'Term 1 Only' :
                                                                             subject.term === 2 ? 'Term 2 Only' :
                                                                             subject.term === 3 ? 'Term 3 Only' :
                                                                             subject.term === 'none' ? 'Not Offered' :
                                                                             'All Terms'}
                                                                        </span>
                                                                    </td>

                                                                    {/* Advisory Curriculum Assignment Column (SHS Grade 11 Only) */}
                                                                    {isGrade11 && (
                                                                        <td className="px-6 py-6">
                                                                            {activeAdvisorySection ? (
                                                                                <div className="flex items-center gap-2">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleToggleAdvisorySubject(subject)}
                                                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                                                                            isInAdvisory
                                                                                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                                                                                : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                                                                                        }`}
                                                                                        title={
                                                                                            isInAdvisory
                                                                                                ? `Assigned to ${activeAdvisorySection.section_name}. Basis for SF9, SF10, Summary of Grades, & Grade Slip. Click to remove.`
                                                                                                : `Not in ${activeAdvisorySection.section_name}. Click to assign to Advisory Class for SF9, SF10, & Summary of Grades.`
                                                                                        }
                                                                                    >
                                                                                        {isInAdvisory ? (
                                                                                            <>
                                                                                                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                                                                <span>In Advisory List</span>
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <Shield className="w-4 h-4 text-slate-400" />
                                                                                                <span>+ Assign to Advisory</span>
                                                                                            </>
                                                                                        )}
                                                                                    </button>
                                                                                    {gradeSections.length > 1 && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => setSectionAssignmentSubject(subject)}
                                                                                            title={`Manage section assignments for ${subject.subject_name}`}
                                                                                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                                                                        >
                                                                                            <Layers className="w-4 h-4" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-[11px] text-slate-400 italic">No advisory section</span>
                                                                            )}
                                                                        </td>
                                                                    )}

                                                                    {canEdit && (() => {
                                                                        const g = subject.grade_level || '';
                                                                        const gn = parseInt(g.replace(/\D/g, '')) || 0;
                                                                        const isSHS = gn === 11 || gn === 12;
                                                                        return (
                                                                        <td className="px-6 py-6 text-right">
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                {isSHS && (
                                                                                    <button
                                                                                        onClick={() => handleToggleOffered(subject)}
                                                                                        title={subject.term === 'none' ? "Mark as Offered" : "Mark as Not Offered"}
                                                                                        className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                                                                                            subject.term === 'none'
                                                                                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                                                                                                : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600'
                                                                                        }`}
                                                                                    >
                                                                                        {subject.term === 'none' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                                    </button>
                                                                                )}
                                                                                {subject.section_id && (
                                                                                    <button
                                                                                        onClick={() => setEnrollmentSubject(subject)}
                                                                                        title={`Manage Enrolled Students (${sections.find(s => s.id === subject.section_id || s.section_name === subject.section_id)?.section_name || subject.section_id})`}
                                                                                        className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                                                                                    >
                                                                                        <Users className="w-4 h-4" />
                                                                                    </button>
                                                                                )}
                                                                                <button
                                                                                    onClick={() => handleEdit(subject)}
                                                                                    className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                                                                                >
                                                                                    <Settings className="w-4 h-4" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteClick(subject)}
                                                                                    className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/10 text-slate-400 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-all flex items-center justify-center cursor-pointer"
                                                                                >
                                                                                    <X className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                        );
                                                                    })()}
                                                                </motion.tr>
                                                            );
                                                        })}
                                                    </Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
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
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                    onClick={() => {}}
                >
                    <motion.div 
                        initial={{ scale: 0.92, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-white dark:bg-[#0d1225] rounded-3xl shadow-2xl w-full overflow-hidden transition-all duration-300 max-w-5xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-white/10"
                    >
                        {wizardStep === 'choice' && (
                            <>
                                <div className={`px-8 py-6 shrink-0 ${
                                    templateMeta?.isES 
                                        ? 'bg-linear-to-r from-emerald-500 to-teal-600' 
                                        : templateMeta?.isSHS 
                                            ? (selectedGrade?.includes('12') && g12CurriculumTab === 'shs'
                                                ? 'bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700'
                                                : 'bg-linear-to-r from-amber-500 to-orange-600')
                                            : 'bg-linear-to-r from-indigo-500 via-purple-600 to-blue-600'
                                } text-white flex items-center justify-between`}>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-2xl font-black text-white tracking-tight">
                                                {templateMeta?.isSHS
                                                    ? (selectedGrade?.includes('12') && g12CurriculumTab === 'shs' ? 'Traditional SHS Curriculum Offerings' : 'SSHS Curriculum Offerings')
                                                    : 'Choose Curriculum & Specialized Offerings'}
                                            </h2>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
                                                {selectedGrade}
                                            </span>
                                            {templateMeta?.isSHS && (
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    selectedGrade?.includes('12') && g12CurriculumTab === 'shs' ? 'bg-indigo-400/30 text-indigo-100 border border-indigo-300/40' : 'bg-amber-400/30 text-amber-100 border border-amber-300/40'
                                                }`}>
                                                    {selectedGrade?.includes('12') && g12CurriculumTab === 'shs' ? 'Old Curriculum (K to 12)' : 'New Curriculum (DO 017)'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs opacity-90 mt-1 font-medium text-white/90">
                                            {templateMeta?.isSHS
                                                ? (selectedGrade?.includes('12') && g12CurriculumTab === 'shs'
                                                    ? 'DepEd K to 12 Senior High: Core, Applied, and Specialized subjects across STEM, ABM, HUMSS, GAS, TVL, Arts & Sports'
                                                    : 'Strengthened Senior High School: Academic Track and Technical-Professional (TechPro) Track electives')
                                                : `Choose from DepEd standard core or special curricular programs (STE, SPA, SPJ, etc.)`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowCurriculumChoice(false);
                                            setCurriculumChoice(null);
                                            setWizardStep(null);
                                        }}
                                        className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* SHS Curriculum Switcher (SSHS vs Traditional K-12 SHS) - Grade 12 ONLY */}
                                {templateMeta?.isSHS && selectedGrade?.includes('12') && (
                                    <div className="px-6 md:px-8 pt-4 pb-3 bg-slate-50/70 dark:bg-black/20 border-b border-slate-200/60 dark:border-white/10 shrink-0">
                                        <div className="bg-slate-200/80 dark:bg-white/10 p-1.5 rounded-2xl flex flex-col sm:flex-row items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setG12CurriculumTab('sshs')}
                                                className={`flex-1 w-full py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-between cursor-pointer ${
                                                    g12CurriculumTab === 'sshs'
                                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/50'
                                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base">✨</span>
                                                    <div className="text-left">
                                                        <div className="leading-tight">SSHS (New Curriculum)</div>
                                                        <div className={`text-[10px] font-medium ${g12CurriculumTab === 'sshs' ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                                            Academic & TechPro Tracks
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-black ${
                                                    g12CurriculumTab === 'sshs' 
                                                        ? 'bg-white/20 text-white border border-white/30' 
                                                        : 'bg-slate-300 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                                                }`}>
                                                    DO 017, s. 2026
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setG12CurriculumTab('shs')}
                                                className={`flex-1 w-full py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-between cursor-pointer ${
                                                    g12CurriculumTab === 'shs'
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-400/50'
                                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base">🏛️</span>
                                                    <div className="text-left">
                                                        <div className="leading-tight">SHS (Old Curriculum)</div>
                                                        <div className={`text-[10px] font-medium ${g12CurriculumTab === 'shs' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                                            Core, Applied & Strands
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-black ${
                                                    g12CurriculumTab === 'shs' 
                                                        ? 'bg-white/20 text-white border border-white/30' 
                                                        : 'bg-slate-300 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                                                }`}>
                                                    Traditional K-12
                                                </span>
                                            </button>
                                        </div>

                                        <div className="mt-2.5 px-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                            <span>
                                                {g12CurriculumTab === 'sshs' ? (
                                                    <>💡 <strong>SSHS:</strong> DepEd Order 017 offers elective-based <strong>Academic</strong> and <strong>TechPro</strong> clusters.</>
                                                ) : (
                                                    <>💡 <strong>Old SHS:</strong> Categorized by <strong>Core</strong>, <strong>Applied</strong>, and <strong>Specialized</strong> subjects per track/strand.</>
                                                )}
                                            </span>
                                            <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                                                {templateMeta?.cards.length} {templateMeta?.cards.length === 1 ? 'Option' : 'Options'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-140px)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 bg-slate-50/40 dark:bg-black/10">
                                    {templateMeta?.cards.map((card) => (
                                        <motion.button
                                            key={card.id}
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => startImportWizard(card.id)}
                                            className={`p-5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer shadow-xs hover:shadow-md ${card.borderColor} ${card.bgColor} ${card.hoverBorder} ${card.hoverBg} ring-2 ${card.ringColor}`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-3xl">{card.emoji}</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${card.badgeStyle}`}>
                                                        {card.badge}
                                                    </span>
                                                </div>
                                                <h3 className="text-base font-black text-slate-900 dark:text-white mb-0.5 leading-snug">
                                                    {card.title}
                                                </h3>
                                                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                                                    {card.subtitle}
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                                                    {card.description}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-2 pt-3 border-t border-slate-200/60 dark:border-white/10">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                        {card.count} {card.count === 1 ? 'Subject' : 'Subjects'}
                                                    </span>
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1">
                                                        <span>Choose</span>
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                                                    {card.preview.map((line, i) => (
                                                        <div key={i} className="truncate">{line}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>

                                <div className="bg-slate-50 dark:bg-[#0f172a] px-8 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
                                    <span className="text-xs text-slate-400">
                                        💡 You can import Normal subjects first, then import specialized programs anytime without conflicts.
                                    </span>
                                    <button
                                        onClick={() => {
                                            setShowCurriculumChoice(false);
                                            setCurriculumChoice(null);
                                            setWizardStep(null);
                                        }}
                                        className="px-6 py-2 rounded-xl text-slate-600 dark:text-slate-200 font-bold hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-xs"
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}

                        {wizardStep === 'select' && (
                            <div className="flex flex-col h-[85vh] md:h-[80vh] overflow-hidden">
                                {/* Wizard Header */}
                                <div className={`px-8 py-5 flex items-center justify-between shrink-0 ${
                                    templateMeta?.isES 
                                        ? 'bg-linear-to-r from-emerald-500 to-teal-600' 
                                        : templateMeta?.isSHS 
                                            ? 'bg-linear-to-r from-amber-500 to-orange-600' 
                                            : 'bg-linear-to-r from-indigo-500 via-purple-600 to-blue-600'
                                } text-white`}>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">
                                            Select Subjects to Import
                                        </h2>
                                        <p className="text-xs opacity-90 mt-0.5 uppercase tracking-wider font-bold">
                                            {selectedGrade} | Offering: {
                                                curriculumChoice === 'standard' ? (templateMeta?.isSHS ? (selectedGrade?.includes('11') ? 'SSHS Academic Track (Core & Electives)' : 'Traditional SHS Academic Track') : 'Normal / MATATAG / Standard Core') :
                                                curriculumChoice === 'program_ste' || curriculumChoice === 'program_spstem' ? 'Science, Technology & Engineering (STE / SPSTEM)' :
                                                curriculumChoice === 'program_spa' ? 'Special Program in the Arts (SPA)' :
                                                curriculumChoice === 'program_spj' ? 'Special Program in Journalism (SPJ)' :
                                                curriculumChoice === 'program_sps' ? 'Special Program in Sports (SPS)' :
                                                curriculumChoice === 'program_spfl' ? 'Special Program in Foreign Language (SPFL)' :
                                                curriculumChoice === 'program_sptve' ? 'Technical-Vocational (SPTVE)' :
                                                curriculumChoice === 'program_sses' ? 'Special Science Elementary (SSES)' :
                                                curriculumChoice === 'program_alive' ? 'Madrasah / ALIVE Program' :
                                                curriculumChoice === 'special' ? 'All Specialized Offerings (Combined)' :
                                                curriculumChoice === 'program' ? `${templateMeta?.programName || 'Special Program'} Preset` :
                                                curriculumChoice === 'sshs_academic' ? 'SSHS Academic Track Electives' :
                                                curriculumChoice === 'sshs_techpro' ? 'SSHS TechPro Track Electives' :
                                                curriculumChoice === 'sshs_all' ? 'All SSHS Offerings (Combined)' :
                                                curriculumChoice === 'shs_core' ? 'Traditional SHS Core Subjects' :
                                                curriculumChoice === 'shs_applied' ? 'Traditional SHS Applied Subjects' :
                                                curriculumChoice === 'shs_stem' ? 'Traditional SHS STEM Strand' :
                                                curriculumChoice === 'shs_abm' ? 'Traditional SHS ABM Strand' :
                                                curriculumChoice === 'shs_humss' ? 'Traditional SHS HUMSS Strand' :
                                                curriculumChoice === 'shs_gas' ? 'Traditional SHS GAS Strand' :
                                                curriculumChoice === 'shs_tvl' ? 'Traditional SHS TVL Track' :
                                                curriculumChoice === 'shs_arts' ? 'Traditional SHS Arts & Sports Tracks' :
                                                curriculumChoice === 'shs_all_old' ? 'Complete Traditional SHS Catalog' :
                                                'Core Subjects Only'
                                            }
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black">{selectedWizardSubjects.size}</div>
                                        <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Selected</div>
                                    </div>
                                </div>

                                {/* Wizard Search and Options Bar */}
                                <div className="px-8 py-3.5 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-[#0f172a] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={wizardSearch}
                                            onChange={(e) => setWizardSearch(e.target.value)}
                                            placeholder="Search offerings by name or code..."
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 dark:text-white font-medium"
                                        />
                                        {wizardSearch && (
                                            <button 
                                                onClick={() => setWizardSearch('')} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* Cross Track Toggle (Only for SHS) */}
                                        {templateMeta?.isSHS && (
                                            <div className="flex items-center gap-3 bg-white dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 shadow-xs">
                                                <label className="relative inline-flex items-center cursor-pointer select-none">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={wizardIncludeCrossTrack}
                                                        onChange={(e) => setWizardIncludeCrossTrack(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-slate-200 dark:bg-white/20 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    <span className="ml-3 text-xs font-black text-slate-600 dark:text-slate-200 uppercase tracking-wider">
                                                        Include Cross-Track Electives
                                                    </span>
                                                </label>
                                            </div>
                                        )}

                                        {templateMeta?.isSHS && (
                                            <button
                                                type="button"
                                                onClick={selectCoreOnlyWizardSubjects}
                                                className="px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                                                title="Select only the required Core subjects"
                                            >
                                                Select Core Only
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={selectAllWizardSubjects}
                                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                                        >
                                            Select All
                                        </button>

                                        <button
                                            type="button"
                                            onClick={clearAllWizardSubjects}
                                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>

                                {/* Wizard Scrollable Subjects Checklist */}
                                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/30 dark:bg-black/20">
                                    {Object.keys(groupedWizardSubjects).length === 0 ? (
                                        <div className="p-16 text-center text-slate-400 dark:text-slate-500">
                                            <BookText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                            <p className="text-sm font-bold">No subjects match your search.</p>
                                        </div>
                                    ) : (
                                        Object.entries(groupedWizardSubjects).map(([category, list]) => {
                                            const isCollapsed = collapsedWizardCategories[category] || false;
                                            
                                            return (
                                                <div key={category} className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-xs overflow-hidden">
                                                    {/* Category Header */}
                                                    <div className="px-6 py-3.5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
                                                        <div 
                                                            className="flex items-center gap-2 cursor-pointer select-none"
                                                            onClick={() => toggleWizardCategory(category)}
                                                        >
                                                            <ChevronRight className={`w-4 h-4 text-slate-400 transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
                                                            <span className="text-xs font-black text-slate-600 dark:text-slate-200 uppercase tracking-widest">
                                                                {category || 'Offerings'}
                                                            </span>
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                                                {list.length}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-wider">
                                                            <button 
                                                                onClick={() => selectAllInCategory(list)}
                                                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                                                            >
                                                                Select All
                                                            </button>
                                                            <span className="text-slate-300 dark:text-slate-600">|</span>
                                                            <button 
                                                                onClick={() => clearAllInCategory(list)}
                                                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                                            >
                                                                Clear All
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Category Grid */}
                                                    {!isCollapsed && (
                                                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                                            {list.map((subject) => {
                                                                const isChecked = selectedWizardSubjects.has(subject.name);
                                                                const isAlreadySaved = existingSectionSubjectNames.has(normalizeSubjectLabel(subject.name));
                                                                
                                                                // Category based tag
                                                                const isSHS = selectedGrade?.includes('11') || selectedGrade?.includes('12');
                                                                let tagText = '';
                                                                let tagStyle = '';
                                                                if (isSHS) {
                                                                    const cat = getShsCategoryForSubject(subject.name, selectedGrade || '');
                                                                    if (cat.includes('Core')) {
                                                                        tagText = 'Core';
                                                                        tagStyle = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
                                                                    } else if (cat.includes('Applied')) {
                                                                        tagText = 'Applied';
                                                                        tagStyle = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40';
                                                                    } else if (cat.includes('Specialized')) {
                                                                        tagText = 'Specialized';
                                                                        tagStyle = 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
                                                                    } else if (cat.includes('Academic')) {
                                                                        tagText = 'Academic';
                                                                        tagStyle = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
                                                                    } else if (cat.includes('TechPro')) {
                                                                        tagText = 'TechPro';
                                                                        tagStyle = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
                                                                    }
                                                                }

                                                                return (
                                                                    <div 
                                                                        key={subject.name}
                                                                        onClick={() => toggleWizardSubject(subject.name)}
                                                                        className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                                                            isChecked 
                                                                                ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/40 ring-1 ring-indigo-500/20' 
                                                                                : isAlreadySaved
                                                                                    ? 'border-emerald-200/80 dark:border-emerald-800/30 bg-emerald-50/20 dark:bg-emerald-950/10'
                                                                                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5'
                                                                        }`}
                                                                    >
                                                                        <div className="pt-0.5">
                                                                            <input 
                                                                                type="checkbox"
                                                                                checked={isChecked}
                                                                                onChange={() => {}} // Controlled by outer div click
                                                                                className="w-4 h-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="font-bold text-slate-800 dark:text-white text-sm leading-snug uppercase tracking-tight wrap-break-word">
                                                                                {subject.name}
                                                                            </div>
                                                                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                                                {isAlreadySaved && (
                                                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                                                                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                                                                        Already Saved
                                                                                    </span>
                                                                                )}
                                                                                {tagText && (
                                                                                    <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${tagStyle}`}>
                                                                                        {tagText}
                                                                                    </span>
                                                                                )}
                                                                                {subject.code && (
                                                                                    <span className="text-[10px] font-mono text-slate-400">
                                                                                        {subject.code}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Wizard Footer */}
                                <div className="bg-slate-50 dark:bg-[#0f172a] px-8 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
                                    <button
                                        onClick={() => setWizardStep('choice')}
                                        className="h-10 px-5 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-600 dark:text-slate-200 font-bold text-xs hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        Back to Offerings
                                    </button>
                                    
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                setShowCurriculumChoice(false);
                                                setCurriculumChoice(null);
                                                setWizardStep(null);
                                            }}
                                            className="px-5 py-2 text-slate-600 dark:text-slate-200 font-bold hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-xs"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleWizardImport}
                                            disabled={isLoadingTemplate || selectedWizardSubjects.size === 0}
                                            className="h-10 px-6 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer"
                                        >
                                            {isLoadingTemplate ? 'Importing...' : `Import Selected (${selectedWizardSubjects.size})`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}


            {/* Modal */}
            {isModalOpen && (() => {
                const cleanModalName = formData.subject_name.trim();
                const modalGrade = (formData.grade_level || selectedGrade || '').trim();
                const modalSection = (formData.section_id || '').trim();
                const normModalName = normalizeSubjectName(cleanModalName);
                const duplicateExistingSubject = normModalName ? subjects.find(s =>
                    s.id !== editingSubjectId &&
                    (s.grade_level || '').trim() === modalGrade &&
                    (s.section_id || '').trim() === modalSection &&
                    normalizeSubjectName((s.subject_name || '').trim()) === normModalName
                ) : null;

                return (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                        <div className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                            <div className="bg-deped-blue dark:bg-[#0f172a] text-white px-6 py-4 flex justify-between items-center rounded-t-2xl border-b border-deped-blue/30 dark:border-white/10">
                                <h3 className="text-xl font-bold">{editingSubjectId ? 'Edit Subject' : 'Add Subject'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-gray-200 cursor-pointer">×</button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Subject Name</label>
                                    <input
                                        type="text"
                                        value={formData.subject_name}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (useDepEdWeightsLocked) {
                                                const targetSection = sections.find(s => s.id === (formData.section_id || (selectedSectionId !== 'all' ? selectedSectionId : undefined)));
                                                const std = getDepEdStandardWeights(val, formData.grade_level || selectedGrade, targetSection?.track, targetSection?.curriculum_type);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    subject_name: val,
                                                    written_weight: String(Math.round(std.written_weight * 100)),
                                                    performance_weight: String(Math.round(std.performance_weight * 100)),
                                                    exam_weight: String(Math.round(std.exam_weight * 100))
                                                }));
                                            } else {
                                                setFormData(prev => ({ ...prev, subject_name: val }));
                                            }
                                        }}
                                        placeholder="Type or select a subject..."
                                        className="form-input mt-1 block w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#0d1225] rounded-xl border border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all h-11 px-4"
                                        list="shs-subjects-list"
                                        required
                                    />
                                    {shsSubjectSuggestions.length > 0 && (
                                        <datalist id="shs-subjects-list">
                                            {shsSubjectSuggestions.map((name, idx) => (
                                                <option key={idx} value={name} />
                                            ))}
                                        </datalist>
                                    )}
                                    {duplicateExistingSubject && (
                                        <div className="mt-2.5 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-bold">Duplicate Detected:</span> A subject named &quot;{duplicateExistingSubject.subject_name}&quot; already exists for {modalGrade || 'this grade'}{modalSection ? ' in this section' : ''}. Adding duplicate records splits student grades.
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Subject Code (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.subject_code}
                                        onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                                        className="form-input mt-1 block w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-white/10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Section Scope / Offering</label>
                                    <select
                                        value={formData.section_id}
                                        onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                                        className="form-input mt-1 block w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-white/10"
                                    >
                                        <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">
                                            ★ All Sections in {formData.grade_level || selectedGrade || 'this grade'} (Grade-Wide Master)
                                        </option>
                                        {gradeSections.map(sec => (
                                            <option key={sec.id} value={sec.id} className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">
                                                Only for {sec.section_name} {sec.track ? `(${sec.track})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        {formData.section_id
                                            ? `Offering exclusively for ${sections.find(s => s.id === formData.section_id)?.section_name || formData.section_id}.`
                                            : `Universal master subject. All sections in ${formData.grade_level || selectedGrade || 'this grade'} share this curriculum in E-Class Record.`}
                                    </p>
                                </div>
                                {(() => {
                                    const g = formData.grade_level || selectedGrade || '';
                                    const gn = parseInt(g.replace(/\D/g, '')) || 0;
                                    const isSHS = gn === 11 || gn === 12;
                                    if (!isSHS) return null;
                                    return (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Term Offered</label>
                                            <select
                                                value={formData.term}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const parsed = val === 'all' ? 'all' : (val === 'none' ? 'none' : Number(val) as 1 | 2 | 3);
                                                    setFormData({ ...formData, term: parsed });
                                                }}
                                                className="form-input mt-1 block w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-white/10"
                                            >
                                                <option value="all" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">All Terms</option>
                                                <option value="1" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Term 1 Only</option>
                                                <option value="2" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Term 2 Only</option>
                                                <option value="3" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Term 3 Only</option>
                                                <option value="none" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Not Offered</option>
                                            </select>
                                        </div>
                                    );
                                })()}
                                <div className="border-t border-slate-100 dark:border-white/10 pt-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Grading Weights</h4>
                                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={useDepEdWeightsLocked}
                                                onChange={(e) => {
                                                    const locked = e.target.checked;
                                                    setUseDepEdWeightsLocked(locked);
                                                    if (locked) {
                                                        const targetSection = sections.find(s => s.id === (formData.section_id || (selectedSectionId !== 'all' ? selectedSectionId : undefined)));
                                                        const std = getDepEdStandardWeights(formData.subject_name || '', formData.grade_level || selectedGrade, targetSection?.track, targetSection?.curriculum_type);
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            written_weight: String(Math.round(std.written_weight * 100)),
                                                            performance_weight: String(Math.round(std.performance_weight * 100)),
                                                            exam_weight: String(Math.round(std.exam_weight * 100))
                                                        }));
                                                    }
                                                }}
                                                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                                                Use DepEd Standard Weights (Locked)
                                            </span>
                                        </label>
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                        <span>Prescribed under <strong>DepEd Order No. 015, s. 2026</strong> (Universal 3-Term Model)</span>
                                    </div>
                                    {!useDepEdWeightsLocked && (() => {
                                        const modalGradeLevel = formData.grade_level || selectedGrade || '';
                                        const isModalSHS = modalGradeLevel.includes('11') || modalGradeLevel.includes('12');
                                        const isModalG12 = modalGradeLevel.includes('12');

                                        return (
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {isModalSHS ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, written_weight: '20', performance_weight: '50', exam_weight: '30' })}
                                                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                                                            title="SHS Core Subjects & Academic Electives: 20% WW, 50% PT, 30% EX (DO 15, s. 2026)"
                                                        >
                                                            Core / Academic (20-50-30)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, written_weight: '15', performance_weight: '70', exam_weight: '15' })}
                                                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors cursor-pointer"
                                                            title="Field Exposure, Arts Apprenticeship, Creative Production: 15% WW, 70% PT, 15% EX (DO 15, s. 2026)"
                                                        >
                                                            Field Exposure / Arts (15-70-15)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, written_weight: '40', performance_weight: '60', exam_weight: '0' })}
                                                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                                                            title="Research Electives, Design & Innovation: 40% WW, 60% PT, 0% EX (DO 15, s. 2026)"
                                                        >
                                                            Research / Inquiries (40-60-0)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, written_weight: '20', performance_weight: '80', exam_weight: '0' })}
                                                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                                                            title="Work Immersion: 20% WW, 80% PT, 0% EX (DO 15, s. 2026)"
                                                        >
                                                            Work Immersion (20-80-0)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, written_weight: '15', performance_weight: '65', exam_weight: '20' })}
                                                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-colors cursor-pointer"
                                                            title="Technical-Professional (Tech-Pro) Electives: 15% WW, 65% PT, 20% EX (DO 15, s. 2026)"
                                                        >
                                                            Tech-Pro (15-65-20)
                                                        </button>
                                                        {isModalG12 && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, written_weight: '25', performance_weight: '50', exam_weight: '25' })}
                                                                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
                                                                    title="Grade 12 Legacy Core (DO 8, s. 2015): 25% WW, 50% PT, 25% QA"
                                                                >
                                                                    Legacy G12 Core (25-50-25)
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, written_weight: '20', performance_weight: '60', exam_weight: '20' })}
                                                                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
                                                                    title="Grade 12 Legacy TVL / Sports (DO 8, s. 2015): 20% WW, 60% PT, 20% QA"
                                                                >
                                                                    Legacy TVL (20-60-20)
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, written_weight: '20', performance_weight: '50', exam_weight: '30' })}
                                                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                                                            title="Core Learning Areas: Languages, Math, Science, AP, Values/GMRC, Makabansa (20% WW, 50% PT, 30% EX - DO 15, s. 2026)"
                                                        >
                                                            Core: Lang/Math/Sci/AP/GMRC (20-50-30)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, written_weight: '20', performance_weight: '60', exam_weight: '20' })}
                                                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                                                            title="EPP, TLE, MAPEH: 20% WW, 60% PT, 20% EX (DO 15, s. 2026)"
                                                        >
                                                            TLE / EPP / MAPEH (20-60-20)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, written_weight: '30', performance_weight: '50', exam_weight: '20' })}
                                                            className="px-2.5 py-1 text-[10px] font-medium rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
                                                            title="Legacy DO 8, s. 2015: Languages, AP, EsP (30% WW, 50% PT, 20% QA)"
                                                        >
                                                            Legacy Lang/AP (30-50-20)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, written_weight: '40', performance_weight: '40', exam_weight: '20' })}
                                                            className="px-2.5 py-1 text-[10px] font-medium rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
                                                            title="Legacy DO 8, s. 2015: Mathematics, Science (40% WW, 40% PT, 20% QA)"
                                                        >
                                                            Legacy Math/Sci (40-40-20)
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, written_weight: '', performance_weight: '', exam_weight: '' })}
                                                    className="px-2.5 py-1 text-[10px] font-medium rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
                                                    title="Reset to DepEd cluster defaults (clears manual overrides)"
                                                >
                                                    Reset to Default
                                                </button>
                                            </div>
                                        );
                                    })()}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Written Works %</label>
                                            <input
                                                type="number"
                                                value={formData.written_weight}
                                                readOnly={useDepEdWeightsLocked}
                                                onChange={(e) => setFormData({ ...formData, written_weight: e.target.value })}
                                                placeholder="Default"
                                                className={`form-input mt-1 block w-full rounded-xl border border-slate-200 dark:border-white/10 transition-all h-10 px-3 text-center text-sm font-bold ${
                                                    useDepEdWeightsLocked 
                                                        ? 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                                        : 'bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#0d1225] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                                                }`}
                                                min="0"
                                                max="100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Performance %</label>
                                            <input
                                                type="number"
                                                value={formData.performance_weight}
                                                readOnly={useDepEdWeightsLocked}
                                                onChange={(e) => setFormData({ ...formData, performance_weight: e.target.value })}
                                                placeholder="Default"
                                                className={`form-input mt-1 block w-full rounded-xl border border-slate-200 dark:border-white/10 transition-all h-10 px-3 text-center text-sm font-bold ${
                                                    useDepEdWeightsLocked 
                                                        ? 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                                        : 'bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#0d1225] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                                                }`}
                                                min="0"
                                                max="100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Summative %</label>
                                            <input
                                                type="number"
                                                value={formData.exam_weight}
                                                readOnly={useDepEdWeightsLocked}
                                                onChange={(e) => setFormData({ ...formData, exam_weight: e.target.value })}
                                                placeholder="Default"
                                                className={`form-input mt-1 block w-full rounded-xl border border-slate-200 dark:border-white/10 transition-all h-10 px-3 text-center text-sm font-bold ${
                                                    useDepEdWeightsLocked 
                                                        ? 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                                        : 'bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white focus:bg-white dark:focus:bg-[#0d1225] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                                                }`}
                                                min="0"
                                                max="100"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-2 italic">
                                        {useDepEdWeightsLocked 
                                            ? 'Weights automatically locked to official DepEd DO 8, s. 2015 standards for this subject.'
                                            : 'Custom weights must sum to 100% (WW + PT + QA).'}
                                    </p>
                                </div>
                                <div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer">Cancel</button>
                                        <button
                                            type="submit"
                                            disabled={Boolean(duplicateExistingSubject)}
                                            className={`btn-primary cursor-pointer shadow-md ${duplicateExistingSubject ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                        >
                                            {editingSubjectId ? 'Update' : 'Add'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}

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


            <SubjectEnrollmentModal
                open={enrollmentSubject !== null}
                subject={enrollmentSubject}
                onClose={() => setEnrollmentSubject(null)}
            />

            {/* Multi-Section Subject Assignment Modal */}
            {sectionAssignmentSubject && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setSectionAssignmentSubject(null)}>
                    <div 
                        className="bg-white dark:bg-[#0d1225] text-slate-900 dark:text-white rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 max-w-lg w-full p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tight">
                                    Assign to Sections
                                </h3>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                                    {sectionAssignmentSubject.subject_name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                    Select which sections in {selectedGrade} include this subject in their curriculum (Summary of Grades, SF9, SF10, & Grade Slip).
                                </p>
                            </div>
                            <button
                                onClick={() => setSectionAssignmentSubject(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                            {gradeSections.map((sec) => {
                                const norm = sectionAssignmentSubject.subject_name.trim().toLowerCase();
                                const isAssigned = (sec.taught_subjects || []).some(s => s.trim().toLowerCase() === norm);
                                return (
                                    <div
                                        key={sec.id}
                                        onClick={() => handleToggleSectionSubjectAssignment(sec, sectionAssignmentSubject.subject_name)}
                                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                            isAssigned
                                                ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60'
                                                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                                isAssigned
                                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                            }`}>
                                                {isAssigned && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold flex items-center gap-2">
                                                    <span>{sec.section_name}</span>
                                                    {sec.is_advisory ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 flex items-center gap-1">
                                                            <Shield className="w-2.5 h-2.5" />
                                                            Advisory
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                                            Teaching Load
                                                        </span>
                                                    )}
                                                </div>
                                                {sec.adviser_name && (
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        Adviser: {sec.adviser_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold ${isAssigned ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                            {isAssigned ? 'Included' : 'Excluded'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setSectionAssignmentSubject(null)}
                                className="px-5 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-600 transition-all cursor-pointer shadow-md"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
