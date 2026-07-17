import { useState, useMemo, useEffect, type FormEvent, Fragment } from 'react';
import { useAppStore, useAuthStore } from '../stores';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, Binary, Beaker, Globe, Compass, GraduationCap, 
    ChevronRight, ArrowLeft, Plus, Settings,
    Sparkles, BookText, X, Trash2, ArrowRight, ChevronLeft,
    Search, Eye, EyeOff, Users
} from 'lucide-react';
import type { Subject } from '../types';
import type { LucideIcon } from 'lucide-react';
import { canEditClassesAndSubjects } from '../lib/rbac';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { SubjectEnrollmentModal } from '../components/sections/SubjectEnrollmentModal';

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

const getShsCategoryForSubject = (subjectName: string, gradeLevel: string): string => {
    const normalized = subjectName.trim().toLowerCase();
    const isG11 = gradeLevel.includes('11');
    const isG12 = gradeLevel.includes('12');

    if (isG11) {
        // Core Subject (All Tracks)
        const cores = [
            'effective communication',
            'mabisang komunikasyon',
            'general mathematics',
            'general science',
            'life and career skills',
            'pag-aaral ng kasaysayan at lipunang pilipino',
            'kasaysayan at lipunang pilipino'
        ];
        if (cores.some(c => normalized.includes(c))) {
            return 'Core Subject (All Tracks)';
        }

        // Academic Elective (Field Experience/ Exposure, and Sports and Arts)
        if (normalized.startsWith('field exposure') || normalized.startsWith('field experience') || normalized.includes('apprenticeship')) {
            return 'Academic Elective (Field Experience/ Exposure, and Sports and Arts)';
        }

        // TechPro Elective (All Other Elective)
        const techPros = [
            'aesthetic services', 'aesthethic services', 'aesthetic', 'aesthethic', 'beauty care', 'barbering services', 'caregiving', 'hairdressing', 'wellness services', 'hilot',
            'agricultural crops', 'agro-entrepreneurship', 'aquaculture', 'fish capture', 'food processing',
            'organic agriculture', 'poultry production', 'ruminants production', 'swine production', 'garments artisanry',
            'handicrafts', 'weaving', 'automotive servicing', 'electrical repair', 'engine and chassis', 'driving',
            'motorcycle', 'small engine', 'carpentry', 'construction operation', 'manual metal arc welding', 'welding',
            'technical drafting', 'animation', 'illustration', 'visual graphics', 'visual graphic', 'bakery operation',
            'events management', 'food and beverage', 'hotel operation', 'front office', 'housekeeping', 'kitchen operations',
            'kitchen operation', 'tourism services', 'commercial air-conditioning', 'domestic refrigeration',
            'electrical installation', 'electronics product', 'mechatronics', 'photovoltaic systems', 'broadband installation',
            'computer programming', 'java', '.net', 'oracle', 'computer systems servicing', 'contact center', 'marine engineering',
            'marine transportation', 'support level', 'ships catering'
        ];
        if (techPros.some(tp => normalized.includes(tp))) {
            return 'TechPro Elective (All Other Elective)';
        }

        // Academic Elective (All Other Electives)
        return 'Academic Elective (All Other Electives)';
    }

    if (isG12) {
        const norm = normalized.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // 1. Core Subjects
        const cores = [
            "21st century literature from the philippines and the world",
            "contemporary philippine arts from the regions",
            "disaster readiness and risk reduction",
            "earth and life science",
            "earth science",
            "general mathematics",
            "introduction to philosophy of the human person",
            "komunikasyon at pananaliksik sa wika at kulturang pilipino",
            "media and information literacy",
            "oral communication in context",
            "pagbasa at pagsusuri ng ibat ibang teksto tungo sa pananaliksik",
            "pagbasa at pagsusuri ng iba't ibang teksto tungo sa pananaliksik",
            "personal development",
            "physical education and health 1",
            "physical education and health 2",
            "physical education and health 3",
            "physical education and health 4",
            "physical science",
            "reading and writing skills",
            "statistics and probability",
            "understanding culture society and politics",
            "understanding culture, society and politics",
            "21st century literature",
            "contemporary philippine arts",
            "pe and health 3",
            "pe and health 4"
        ];
        if (cores.some(c => {
            const cNorm = c.toLowerCase().replace(/[^a-z0-9]/g, '');
            return norm === cNorm || norm.includes(cNorm) || cNorm.includes(norm);
        })) {
            return 'Core Subjects';
        }

        // 2. Applied Subjects
        const applied = [
            "empowerment technologies",
            "english for academic and professional purposes",
            "entrepreneurship",
            "filipino sa piling larang akademik",
            "filipino sa piling larang akademiko",
            "filipino sa piling larang isports",
            "filipino sa piling larang sining at disenyo",
            "filipino sa piling larang teknikal bokasyunal",
            "filipino sa piling larang teknikal-bokasyunal",
            "filipino sa piling larang",
            "inquiries investigations and immersion",
            "inquiries, investigations and immersion",
            "practical research 1",
            "practical research 2"
        ];
        if (applied.some(a => {
            const aNorm = a.toLowerCase().replace(/[^a-z0-9]/g, '');
            return norm === aNorm || norm.includes(aNorm) || aNorm.includes(norm);
        })) {
            return 'Applied Subjects';
        }

        // 3. Specialized Subjects
        return 'Specialized Subjects';
    }

    return '';
};

const getCategoryForSubject = (subjectName: string, gradeLevel: string): string => {
    const normalized = subjectName.trim().toLowerCase();
    const isSHS = gradeLevel.includes('11') || gradeLevel.includes('12');

    if (isSHS) {
        return getShsCategoryForSubject(subjectName, gradeLevel);
    }

    const isJHS = gradeLevel.includes('Grade 7') || gradeLevel.includes('Grade 8') || gradeLevel.includes('Grade 9') || gradeLevel.includes('Grade 10');

    if (isJHS) {
        const cores = ['filipino', 'english', 'mathematics', 'science', 'araling panlipunan'];
        if (cores.some(c => normalized.includes(c) || normalized === 'ap' || normalized === 'math')) {
            return 'Core Academic Subjects';
        }
        const values = ['values education', 'gmrc', 'good manners'];
        if (values.some(v => normalized.includes(v))) {
            return 'Values / Character Education';
        }
        const livelihood = ['technology and livelihood', 'tle', 'specialization', 'e.p.p.', 'epp'];
        if (livelihood.some(l => normalized.includes(l))) {
            return 'Technology & Livelihood (TLE)';
        }
        const mapeh = ['music', 'arts', 'physical education', 'health', 'mapeh', 'pe '];
        if (mapeh.some(m => normalized.includes(m) || normalized === 'pe' || normalized === 'pe.')) {
            return 'MAPEH (Music, Arts, PE, Health)';
        }
        return 'Other Subjects';
    }

    // Elementary (Grade 1 - 6)
    const cores = ['filipino', 'english', 'mathematics', 'science', 'araling panlipunan'];
    if (cores.some(c => normalized.includes(c) || normalized === 'ap' || normalized === 'math')) {
        return 'Core Academic Subjects';
    }
    const values = ['gmrc', 'good manners', 'values education', 'islamic values'];
    if (values.some(v => normalized.includes(v))) {
        return 'Values / Character Education';
    }
    const languages = ['language', 'reading', 'literacy', 'arabic language', 'mother tongue'];
    if (languages.some(l => normalized.includes(l))) {
        return 'Languages & Literacy';
    }
    const livelihood = ['makabansa', 'e.p.p.', 'epp', 'tle', 'technology and livelihood', 'specialization'];
    if (livelihood.some(l => normalized.includes(l))) {
        return 'Livelihood & Makabansa';
    }
    const mapeh = ['mapeh', 'music', 'arts', 'physical education', 'health', 'pe '];
    if (mapeh.some(m => normalized.includes(m) || normalized === 'pe' || normalized === 'pe.')) {
        return 'MAPEH (Music, Arts, PE, Health)';
    }

    return 'Other Subjects';
};

import { STANDARD_SUBJECTS, SPECIAL_SUBJECTS, getDefaultTermForSubject } from '../lib/curriculum';

export function SubjectsPage() {
    const { schoolProfile, subjects, sections, students, addSubject, deleteSubject, deleteSubjectsBulk, updateSubject, setCurrentView, showNotification } = useAppStore(); 
    const { user } = useAuthStore();
    const canEdit = canEditClassesAndSubjects(user);

    const [viewMode, setViewMode] = useState<'grades' | 'subjects'>('grades');
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [enrollmentSubject, setEnrollmentSubject] = useState<Subject | null>(null);
    const [formData, setFormData] = useState({
        subject_name: '',
        subject_code: '',
        grade_level: '',
        section_id: '',
        teacher_id: '',
        term: 'all' as 1 | 2 | 3 | 'all' | 'none',
        written_weight: '',
        performance_weight: '',
        exam_weight: ''
    });
    const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
    const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
    const [curriculumChoice, setCurriculumChoice] = useState<'standard' | 'special' | 'core_only' | null>(null);
    const [showCurriculumChoice, setShowCurriculumChoice] = useState(false);
    const [lastLoadedCurriculumType, setLastLoadedCurriculumType] = useState<'standard' | 'special' | 'core_only' | null>(null);
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const [showAutoLoadConfirm, setShowAutoLoadConfirm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'Elementary' | 'JHS' | 'SHS' | null>(null);
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

    // Import Wizard states
    const [wizardStep, setWizardStep] = useState<'choice' | 'select' | null>(null);
    const [pendingWizardSubjects, setPendingWizardSubjects] = useState<{ name: string; code: string }[]>([]);
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

    const startImportWizard = (type: 'standard' | 'special' | 'core_only') => {
        if (!selectedGrade) return;

        let templates = type === 'standard' 
            ? STANDARD_SUBJECTS[selectedGrade as keyof typeof STANDARD_SUBJECTS]
            : SPECIAL_SUBJECTS[selectedGrade as keyof typeof SPECIAL_SUBJECTS];

        if (type === 'core_only') {
            const allStandard = STANDARD_SUBJECTS[selectedGrade as keyof typeof STANDARD_SUBJECTS] || [];
            templates = allStandard.filter(s => getShsCategoryForSubject(s.name, selectedGrade) === 'Core Subject (All Tracks)');
        }

        if (!templates) {
            showNotification(`No subjects defined for ${selectedGrade}`, 'info');
            return;
        }

        setPendingWizardSubjects(templates.map(s => ({ ...s })));
        setSelectedWizardSubjects(new Set(templates.map(s => s.name)));
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
            const oppositeType = curriculumChoice === 'standard' ? 'special' : 'standard';
            const oppositeTemplates = oppositeType === 'standard'
                ? STANDARD_SUBJECTS[selectedGrade as keyof typeof STANDARD_SUBJECTS] || []
                : SPECIAL_SUBJECTS[selectedGrade as keyof typeof SPECIAL_SUBJECTS] || [];
            
            oppositeTemplates.forEach(item => {
                if (!baseList.some(s => s.name.toLowerCase().trim() === item.name.toLowerCase().trim())) {
                    baseList.push({ ...item });
                }
            });
        }

        if (wizardSearch.trim()) {
            const query = wizardSearch.toLowerCase().trim();
            baseList = baseList.filter(s => s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query));
        }

        return baseList;
    }, [pendingWizardSubjects, wizardIncludeCrossTrack, curriculumChoice, selectedGrade, wizardSearch]);

    const groupedWizardSubjects = useMemo(() => {
        if (!selectedGrade) return {};
        const isSHS = selectedGrade.includes('11') || selectedGrade.includes('12');
        if (!isSHS) {
            return { '': wizardDisplaySubjects };
        }

        const gradeNum = parseInt(selectedGrade.replace(/\D/g, '')) || 0;
        const catOrder = gradeNum === 11 ? [
            'Core Subject (All Tracks)',
            'Academic Elective (All Other Electives)',
            'Academic Elective (Field Experience/ Exposure, and Sports and Arts)',
            'TechPro Elective (All Other Elective)'
        ] : [
            'Core Subjects',
            'Applied Subjects',
            'Specialized Subjects'
        ];

        const groups: Record<string, typeof wizardDisplaySubjects> = {};
        
        catOrder.forEach(cat => {
            groups[cat] = [];
        });

        wizardDisplaySubjects.forEach((subject) => {
            const cat = getShsCategoryForSubject(subject.name, selectedGrade);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(subject);
        });

        const filteredGroups: Record<string, typeof wizardDisplaySubjects> = {};
        Object.entries(groups).forEach(([cat, list]) => {
            if (list.length > 0) {
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

    const handleWizardImport = async () => {
        if (!selectedGrade || selectedWizardSubjects.size === 0) return;

        setIsLoadingTemplate(true);
        const timestamp = Date.now();
        const targetSection = selectedSection || null;
        const sectionId = targetSection?.id;
        const gradeLevel = selectedGrade;

        const standardTemplates = STANDARD_SUBJECTS[gradeLevel as keyof typeof STANDARD_SUBJECTS] || [];
        const specialTemplates = SPECIAL_SUBJECTS[gradeLevel as keyof typeof SPECIAL_SUBJECTS] || [];
        const allTemplates = [...standardTemplates];
        specialTemplates.forEach(item => {
            if (!allTemplates.some(s => s.name.toLowerCase().trim() === item.name.toLowerCase().trim())) {
                allTemplates.push(item);
            }
        });

        const templatesToLoad = allTemplates.filter(t => selectedWizardSubjects.has(t.name));

        try {
            const existingSectionSubjects = subjects.filter((subject) => {
                if (sectionId) return subject.section_id === sectionId;
                return subject.grade_level === gradeLevel && !subject.section_id;
            });
            const existingNames = new Set(existingSectionSubjects.map((subject) => normalizeSubjectLabel(subject.subject_name)));
            
            const missingTemplates = templatesToLoad.filter((template) => !existingNames.has(normalizeSubjectLabel(template.name)));

            if (missingTemplates.length === 0) {
                showNotification(`All selected subjects are already loaded for ${targetSection?.section_name || gradeLevel}.`, 'info');
                setShowCurriculumChoice(false);
                setWizardStep(null);
                return;
            }

            for (let i = 0; i < missingTemplates.length; i++) {
                const template = missingTemplates[i];
                const subjectId = `subject-${timestamp}-${String(i).padStart(2, '0')}-${Math.random().toString(36).substr(2, 5)}`;
                
                const newSubject: Subject = {
                    id: subjectId,
                    subject_name: template.name,
                    subject_code: template.code,
                    grade_level: gradeLevel,
                    section_id: sectionId,
                    term: getDefaultTermForSubject(template.name, gradeLevel),
                    order: UNIVERSAL_SUBJECT_ORDER.findIndex((name) => normalizeSubjectLabel(name) === normalizeSubjectLabel(template.name))
                };
                
                await addSubject(newSubject);
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

    const templateMeta = useMemo(() => {
        if (!selectedGrade) return null;
        
        const standard = STANDARD_SUBJECTS[selectedGrade as keyof typeof STANDARD_SUBJECTS] || [];
        const special = SPECIAL_SUBJECTS[selectedGrade as keyof typeof SPECIAL_SUBJECTS] || [];
        
        const getPreview = (list: { name: string; code: string }[]) => {
            const names = list.slice(0, 3).map(s => `✓ ${s.name}`);
            if (list.length > 3) names.push(`+ ${list.length - 3} more...`);
            return names;
        };

        const gradeNum = parseInt(selectedGrade.replace(/\D/g, '')) || 0;

        return {
            standardCount: standard.length,
            specialCount: special.length,
            standardPreview: getPreview(standard),
            specialPreview: getPreview(special),
            isES: gradeNum >= 1 && gradeNum <= 6,
            isSHS: gradeNum === 11 || gradeNum === 12
        };
    }, [selectedGrade]);

    const shsSubjectSuggestions = useMemo(() => {
        if (!selectedGrade) return [];
        const isSHS = selectedGrade.includes('11') || selectedGrade.includes('12');
        if (!isSHS) return [];

        const grade = selectedGrade as 'Grade 11' | 'Grade 12';
        const standardList = STANDARD_SUBJECTS[grade] || [];
        const specialList = SPECIAL_SUBJECTS[grade] || [];

        // Merge standard and special lists, removing duplicates by name
        const merged: { name: string; code: string }[] = [...standardList];
        specialList.forEach((item) => {
            if (!merged.some(s => s.name.toLowerCase().trim() === item.name.toLowerCase().trim())) {
                merged.push(item);
            }
        });

        return merged.map(s => s.name).sort((a, b) => a.localeCompare(b));
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
                const gradeNum = parseInt(selectedGrade.replace(/\D/g, '')) || 0;
                const isSHS = gradeNum === 11 || gradeNum === 12;
                
                if (isSHS) {
                    const catA = getShsCategoryForSubject(a.subject_name, selectedGrade);
                    const catB = getShsCategoryForSubject(b.subject_name, selectedGrade);
                    
                    const catOrder = gradeNum === 11 ? [
                        'Core Subject (All Tracks)',
                        'Academic Elective (All Other Electives)',
                        'Academic Elective (Field Experience/ Exposure, and Sports and Arts)',
                        'TechPro Elective (All Other Elective)'
                    ] : [
                        'Core Subjects',
                        'Applied Subjects',
                        'Specialized Subjects'
                    ];
                    
                    const idxA = catOrder.indexOf(catA);
                    const idxB = catOrder.indexOf(catB);
                    
                    if (idxA !== idxB) {
                        return idxA - idxB;
                    }
                }

                const orderA = a.order ?? getPreferredSubjectOrder(a.subject_name);
                const orderB = b.order ?? getPreferredSubjectOrder(b.subject_name);
                if (orderA !== orderB) return orderA - orderB;
                return a.subject_name.localeCompare(b.subject_name);
            });
    }, [subjects, selectedSectionId, selectedGrade]);

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
                'Specialized Subjects'
            ];
        } else if (isJHS) {
            catOrder = [
                'Core Academic Subjects',
                'MAPEH (Music, Arts, PE, Health)',
                'Technology & Livelihood (TLE)',
                'Values / Character Education',
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
            teacher_id: '',
            term: selectedGrade ? getDefaultTermForSubject('', selectedGrade) : 'all',
            written_weight: '',
            performance_weight: '',
            exam_weight: ''
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
            teacher_id: subject.teacher_id || '',
            term: subject.term || 'all',
            written_weight: subject.written_weight !== undefined ? String(Math.round(subject.written_weight * 100)) : '',
            performance_weight: subject.performance_weight !== undefined ? String(Math.round(subject.performance_weight * 100)) : '',
            exam_weight: subject.exam_weight !== undefined ? String(Math.round(subject.exam_weight * 100)) : ''
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

        const subjectData: Subject = {
            id: editingSubjectId || `subject-${Date.now()}`,
            subject_name: formData.subject_name,
            subject_code: formData.subject_code,
            grade_level: formData.grade_level,
            section_id: formData.section_id || undefined,
            teacher_id: formData.teacher_id || undefined,
            term: formData.term === 'all' ? 'all' : (formData.term === 'none' ? 'none' : Number(formData.term) as 1 | 2 | 3),
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
                        term: getDefaultTermForSubject(template.name, grade),
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
        
        const isSHS = selectedGrade.includes('11') || selectedGrade.includes('12');
        if (isSHS) {
            setIsLoadingTemplate(true);
            const timestamp = Date.now();
            const targetSection = selectedSection || null;
            const sectionId = targetSection?.id;
            const gradeLevel = selectedGrade;

            const grade = selectedGrade as 'Grade 11' | 'Grade 12';
            const standardList = STANDARD_SUBJECTS[grade] || [];
            const specialList = SPECIAL_SUBJECTS[grade] || [];
            
            // Merge Academic and TechPro subjects into a unified list
            const merged: { name: string; code: string }[] = [...standardList];
            specialList.forEach((item) => {
                if (!merged.some(s => s.name.toLowerCase().trim() === item.name.toLowerCase().trim())) {
                    merged.push(item);
                }
            });

            try {
                const existingSectionSubjects = subjects.filter((subject) => {
                    if (sectionId) return subject.section_id === sectionId;
                    return subject.grade_level === gradeLevel && !subject.section_id;
                });
                const existingNames = new Set(existingSectionSubjects.map((subject) => normalizeSubjectLabel(subject.subject_name)));
                
                const missingTemplates = merged.filter((template) => !existingNames.has(normalizeSubjectLabel(template.name)));

                if (missingTemplates.length === 0) {
                    showNotification(`All standard subjects are already loaded for ${targetSection?.section_name || gradeLevel}.`, 'info');
                    return;
                }

                for (let i = 0; i < missingTemplates.length; i++) {
                    const template = missingTemplates[i];
                    const subjectId = `subject-${timestamp}-${String(i).padStart(2, '0')}-${Math.random().toString(36).substr(2, 5)}`;
                    
                    const newSubject: Subject = {
                        id: subjectId,
                        subject_name: template.name,
                        subject_code: template.code,
                        grade_level: gradeLevel,
                        section_id: sectionId,
                        term: getDefaultTermForSubject(template.name, gradeLevel),
                        order: UNIVERSAL_SUBJECT_ORDER.findIndex((name) => normalizeSubjectLabel(name) === normalizeSubjectLabel(template.name))
                    };
                    
                    await addSubject(newSubject);
                }

                showNotification(`Successfully loaded all unified ${missingTemplates.length} subjects!`, 'success');
                setLastLoadedCurriculumType('standard');
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                console.error("[SUBJECTS AUTOMATIC] Failed to commit:", errorMsg);
                showNotification(`Failed to load subjects: ${errorMsg}`, 'error');
            } finally {
                setIsLoadingTemplate(false);
            }
        } else {
            setWizardStep('choice');
            setShowCurriculumChoice(true);
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

            {/* Redesigned Compact Header Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/70 backdrop-blur-xl border border-slate-200/80 p-3 rounded-2xl shadow-2xs relative z-10">
                <div className="flex items-center gap-3">
                    {/* Compact Navigation / Breadcrumbs */}
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => { setViewMode('grades'); setSelectedCategory(null); }}>Grades</span>
                        {viewMode !== 'grades' && (
                            <>
                                <ChevronRight className="w-3 h-3 text-slate-350" />
                                <span className="text-slate-700 font-extrabold">{selectedGrade}</span>
                            </>
                        )}
                    </div>

                    {/* Compact Badge indicating special/standard loaded */}
                    {viewMode === 'subjects' && filteredSubjects.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                            lastLoadedCurriculumType === 'special' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
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
                            className="h-9 px-4 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back
                        </button>
                    )}
                    {viewMode === 'grades' && canEdit && (
                        <button 
                            onClick={() => setShowAutoLoadConfirm(true)} 
                            disabled={isLoadingTemplate}
                            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Auto-Load All
                        </button>
                    )}
                    {viewMode === 'subjects' && canEdit && (
                        <div className="flex items-center gap-2">
                            {filteredSubjects.length > 0 && (
                                <button 
                                    onClick={() => setShowDeleteAllConfirm(true)}
                                    className="h-9 px-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-all flex items-center gap-1.5 border border-rose-100 active:scale-95 cursor-pointer"
                                    title="Delete all subjects in this view"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete All
                                </button>
                            )}
                            <button 
                                onClick={openAddModal} 
                                className="h-9 px-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-indigo-700 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
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
                        className="space-y-8 relative"
                    >
                        {!selectedCategory ? (
                            <>
                                {/* Quick Guide Header */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 pb-6"
                                >
                                    <div className="space-y-3 flex flex-col items-center text-center">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-2xs">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-1">1. Select Level</h4>
                                            <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-wider opacity-80">Choose a department (Elementary, JHS, or SHS) to explore its specific grade levels and curriculum tracks.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 flex flex-col items-center text-center">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-2xs">
                                            <Settings className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-1">2. Configure Subjects</h4>
                                            <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-wider opacity-80">Inside each grade, you can add subjects manually or load standard DepEd templates to ensure academic compliance.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 flex flex-col items-center text-center">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-2xs">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-1">3. Automate Workflow</h4>
                                            <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-wider opacity-80">Configured subjects are automatically synced to class records and SF9/SF10 reports for seamless grading.</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                    {(Object.entries(CATEGORIES) as [keyof typeof CATEGORIES, typeof CATEGORIES[keyof typeof CATEGORIES]][]).map(([key, category]) => (
                                        <motion.button
                                            key={key}
                                            whileHover={{ scale: 1.02, y: -5 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedCategory(key)}
                                            className="relative group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 transition-all text-center overflow-hidden h-full flex flex-col items-center"
                                        >
                                            <div className={`absolute top-0 right-0 w-32 h-32 ${category.bg} rounded-bl-[5rem] -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform`} />
                                            
                                            <div className={`w-16 h-16 rounded-3xl bg-linear-to-br ${category.color} flex items-center justify-center text-white shadow-lg mb-6 group-hover:rotate-6 transition-transform`}>
                                                <category.icon className="w-8 h-8" />
                                            </div>

                                            <div className="flex-1 w-full">
                                                <h3 className="text-2xl font-black text-slate-900 mb-1">{category.title}</h3>
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{category.range}</p>
                                                <p className="text-slate-500 text-sm leading-relaxed mb-6">{category.description}</p>
                                            </div>

                                            <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto w-full">
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Open Category</span>
                                                <div className={`w-10 h-10 rounded-full bg-slate-50 group-hover:bg-linear-to-br ${category.color} flex items-center justify-center text-slate-400 group-hover:text-white transition-all`}>
                                                    <ArrowRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
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
                                                className="group bg-white rounded-4xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-2xl transition-all cursor-pointer overflow-hidden relative"
                                            >
                                                <div className={`absolute top-0 right-0 w-24 h-24 ${meta.bg} rounded-bl-full -mr-8 -mt-8 opacity-40 group-hover:scale-110 transition-transform`} />
                                                
                                                <div className="relative z-10">
                                                    <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${meta.color} flex items-center justify-center text-white shadow-lg mb-6 group-hover:rotate-6 transition-transform`}>
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
                                            <th className="px-6 py-4">Term Offered</th>
                                            {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(groupedSubjects).map(([category, categorySubjects]) => {
                                            const isSHS = selectedGrade?.includes('11') || selectedGrade?.includes('12');
                                            const isCollapsed = collapsedCategories[category] ?? isSHS;
                                            return (
                                                <Fragment key={category}>
                                                    {category && (
                                                        <tr 
                                                            onClick={() => toggleCategory(category)}
                                                            className="bg-slate-50/50 cursor-pointer hover:bg-slate-100/50 transition-colors select-none"
                                                        >
                                                            <td colSpan={canEdit ? 4 : 3} className="px-6 py-4 border-y border-slate-100">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                                                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                                                            {category}
                                                                        </span>
                                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                                                            {categorySubjects.length} {categorySubjects.length === 1 ? 'subject' : 'subjects'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                                                        <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
                                                                        <ChevronRight className={`w-4 h-4 transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {!isCollapsed && categorySubjects.map((subject, idx) => (
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
                                                                            disabled={idx === categorySubjects.length - 1}
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
                                                                        {subject.written_weight !== undefined && subject.performance_weight !== undefined && subject.exam_weight !== undefined && (
                                                                            <div className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 inline-block mt-1 uppercase tracking-wide mr-2">
                                                                                Custom Weights: WW: {Math.round(subject.written_weight * 100)}% | PT: {Math.round(subject.performance_weight * 100)}% | QA: {Math.round(subject.exam_weight * 100)}%
                                                                            </div>
                                                                        )}
                                                                        {(() => {
                                                                            if (!subject.section_id) return null;
                                                                            const sect = sections.find(s => s.id === subject.section_id || s.section_name === subject.section_id);
                                                                            const sectName = sect ? sect.section_name : subject.section_id;
                                                                            const sectStudents = students.filter(s => s.student_section === sectName || s.student_section === subject.section_id);
                                                                            const sectCount = sectStudents.length;
                                                                            const enrolledCount = subject.enrolled_student_lrns && subject.enrolled_student_lrns.length > 0 
                                                                                ? subject.enrolled_student_lrns.length 
                                                                                : sectCount;
                                                                            return (
                                                                                <div className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 inline-block mt-1 uppercase tracking-wide">
                                                                                    Enrolled: {enrolledCount} / {sectCount} Learners
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-6">
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${
                                                                    subject.term === 1 ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                    subject.term === 2 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                    subject.term === 3 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                    subject.term === 'none' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                    'bg-slate-50 text-slate-600 border-slate-100'
                                                                }`}>
                                                                    {subject.term === 1 ? 'Term 1 Only' :
                                                                     subject.term === 2 ? 'Term 2 Only' :
                                                                     subject.term === 3 ? 'Term 3 Only' :
                                                                     subject.term === 'none' ? 'Not Offered' :
                                                                     'All Terms'}
                                                                </span>
                                                            </td>
                                                            {canEdit && (
                                                                <td className="px-6 py-6 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <button
                                                                            onClick={() => handleToggleOffered(subject)}
                                                                            title={subject.term === 'none' ? "Mark as Offered" : "Mark as Not Offered"}
                                                                            className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${
                                                                                subject.term === 'none'
                                                                                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                                                                    : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                                                                            }`}
                                                                        >
                                                                            {subject.term === 'none' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                        </button>
                                                                        {subject.section_id && (
                                                                            <button
                                                                                onClick={() => setEnrollmentSubject(subject)}
                                                                                title="Manage Enrolled Students"
                                                                                className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm cursor-pointer"
                                                                            >
                                                                                <Users className="w-4 h-4" />
                                                                            </button>
                                                                        )}
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
                                                </Fragment>
                                            );
                                        })}
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
                        className={`bg-white rounded-3xl shadow-2xl w-full overflow-hidden transition-all duration-300 ${
                            wizardStep === 'select' ? 'max-w-5xl max-h-[90vh] flex flex-col' : 'max-w-3xl'
                        }`}
                    >
                        {wizardStep === 'choice' && (
                            <>
                                <div className={`px-8 py-8 ${
                                    templateMeta?.isES 
                                        ? 'bg-linear-to-r from-emerald-500 to-teal-600' 
                                        : templateMeta?.isSHS 
                                            ? 'bg-linear-to-r from-amber-500 to-orange-600' 
                                            : 'bg-linear-to-r from-indigo-500 to-blue-600'
                                }`}>
                                    <h2 className="text-2xl font-black text-white">
                                        {templateMeta?.isSHS ? 'Select Track Curriculum' : 'Choose Curriculum Type'}
                                    </h2>
                                    <p className={`${
                                        templateMeta?.isES 
                                            ? 'text-emerald-100' 
                                            : templateMeta?.isSHS 
                                                ? 'text-orange-100' 
                                                : 'text-indigo-100'
                                    } text-sm mt-2`}>
                                        {templateMeta?.isSHS 
                                            ? `Select which Senior High School track to load for ${selectedGrade}` 
                                            : `Select which subject template to load for ${selectedGrade}`}
                                    </p>
                                </div>
                                
                                <div className={`p-8 grid gap-6 ${templateMeta?.isSHS ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                                    {/* Standard Option */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            startImportWizard('standard');
                                        }}
                                        className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col justify-between ${
                                            templateMeta?.isSHS
                                                ? 'border-amber-200 bg-amber-50/30 hover:border-amber-500 hover:bg-amber-50 ring-2 ring-amber-100/50'
                                                : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50'
                                        }`}
                                    >
                                        <div>
                                            <div className="text-3xl mb-3">📚</div>
                                            <h3 className={`text-lg font-black mb-2 ${templateMeta?.isSHS ? 'text-amber-950' : 'text-slate-900'}`}>
                                                {templateMeta?.isES ? 'Matatag / Standard' : templateMeta?.isSHS ? 'SSHS Academic Track' : 'Standard'}
                                            </h3>
                                            <p className={`text-sm mb-4 ${templateMeta?.isSHS ? 'text-amber-800' : 'text-slate-600'}`}>
                                                {templateMeta?.isES ? 'Official DepEd Primary curriculum' : templateMeta?.isSHS ? 'Standard core + academic electives' : 'DepEd standard curriculum'}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                    templateMeta?.isSHS 
                                                        ? 'text-amber-700 bg-amber-100' 
                                                        : 'text-emerald-600 bg-emerald-100'
                                                }`}>
                                                    {templateMeta?.standardCount} Subjects
                                                </span>
                                                <span className={templateMeta?.isSHS ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>→</span>
                                            </div>
                                            <div className={`text-[11px] space-y-1 ${templateMeta?.isSHS ? 'text-amber-700/80' : 'text-slate-500'}`}>
                                                {templateMeta?.standardPreview.map((line, i) => (
                                                    <div key={i}>{line}</div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.button>
         
                                    {/* Special Option */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            startImportWizard('special');
                                        }}
                                        className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col justify-between ${
                                            templateMeta?.isSHS
                                                ? 'border-blue-200 bg-blue-50/30 hover:border-blue-500 hover:bg-blue-50 ring-2 ring-blue-100/50'
                                                : 'border-blue-300 bg-blue-50 hover:border-blue-500 hover:bg-blue-100 ring-2 ring-blue-200'
                                        }`}
                                    >
                                        <div>
                                            <div className="text-3xl mb-3">⭐</div>
                                            <h3 className={`text-lg font-black mb-2 ${templateMeta?.isSHS ? 'text-blue-950' : 'text-blue-900'}`}>
                                                {templateMeta?.isES ? 'Enhanced / Special' : templateMeta?.isSHS ? 'SSHS TechPro Track' : 'Special'}
                                            </h3>
                                            <p className={`text-sm mb-4 ${templateMeta?.isSHS ? 'text-blue-800' : 'text-blue-700'}`}>
                                                {templateMeta?.isES ? 'Curriculum with extra electives' : templateMeta?.isSHS ? 'Standard core + TechPro electives' : 'Extra subject included'}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-blue-600 bg-blue-200 px-3 py-1 rounded-full">
                                                    {templateMeta?.specialCount} Subjects
                                                </span>
                                                <span className="text-blue-600 font-bold">→</span>
                                            </div>
                                            <div className="text-[11px] text-blue-700 space-y-1">
                                                {templateMeta?.specialPreview.map((line, i) => (
                                                    <div key={i}>{line}</div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.button>

                                    {/* SSHS Core Only Option (Only for SHS inside modal) */}
                                    {templateMeta?.isSHS && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                startImportWizard('core_only');
                                            }}
                                            className="p-6 rounded-2xl border-2 border-indigo-200 bg-indigo-50/30 hover:border-indigo-500 hover:bg-indigo-50 ring-2 ring-indigo-100/50 text-left transition-all flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="text-3xl mb-3">🧠</div>
                                                <h3 className="text-lg font-black mb-2 text-indigo-950">
                                                    SSHS Core Only
                                                </h3>
                                                <p className="text-sm mb-4 text-indigo-800 leading-relaxed">
                                                    Load only the 6 official Core Subjects required for all tracks (no electives)
                                                </p>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                                                        6 Subjects
                                                    </span>
                                                    <span className="text-indigo-600 font-bold">→</span>
                                                </div>
                                                <div className="text-[11px] text-indigo-700/80 space-y-1">
                                                    <div>✓ Effective Communication</div>
                                                    <div>✓ Mabisang Komunikasyon</div>
                                                    <div>✓ General Mathematics</div>
                                                </div>
                                            </div>
                                        </motion.button>
                                    )}
                                </div>

                                <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 flex justify-end">
                                    <button
                                        onClick={() => {
                                            setShowCurriculumChoice(false);
                                            setCurriculumChoice(null);
                                            setWizardStep(null);
                                        }}
                                        className="px-6 py-2 rounded-xl text-slate-600 font-bold hover:text-slate-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}

                        {wizardStep === 'select' && (
                            <div className="flex flex-col h-[85vh] md:h-[80vh] overflow-hidden">
                                {/* Wizard Header */}
                                <div className={`px-8 py-6 flex items-center justify-between shrink-0 ${
                                    templateMeta?.isES 
                                        ? 'bg-linear-to-r from-emerald-500 to-teal-600' 
                                        : templateMeta?.isSHS 
                                            ? 'bg-linear-to-r from-amber-500 to-orange-600' 
                                            : 'bg-linear-to-r from-indigo-500 to-blue-600'
                                } text-white`}>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">
                                            Select Subjects to Import
                                        </h2>
                                        <p className="text-xs opacity-90 mt-1 uppercase tracking-wider font-bold">
                                            {selectedGrade} | Template: {curriculumChoice === 'standard' ? 'Academic Track' : curriculumChoice === 'special' ? 'TechPro Track' : 'Core Subjects Only'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black">{selectedWizardSubjects.size}</div>
                                        <div className="text-[10px] font-black uppercase tracking-wider opacity-80">Selected</div>
                                    </div>
                                </div>

                                {/* Wizard Search and Options Bar */}
                                <div className="px-8 py-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={wizardSearch}
                                            onChange={(e) => setWizardSearch(e.target.value)}
                                            placeholder="Search template subjects..."
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-800 font-medium"
                                        />
                                        {wizardSearch && (
                                            <button 
                                                onClick={() => setWizardSearch('')} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    {/* Cross Track Toggle (Only for SHS) */}
                                    {templateMeta?.isSHS && (
                                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
                                            <label className="relative inline-flex items-center cursor-pointer select-none">
                                                <input 
                                                    type="checkbox" 
                                                    checked={wizardIncludeCrossTrack}
                                                    onChange={(e) => setWizardIncludeCrossTrack(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                                <span className="ml-3 text-xs font-black text-slate-600 uppercase tracking-wider">
                                                    Include Cross-Track Electives
                                                </span>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Wizard Scrollable Subjects Checklist */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30">
                                    {Object.keys(groupedWizardSubjects).length === 0 ? (
                                        <div className="p-16 text-center text-slate-400">
                                            <BookText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                            <p className="text-sm font-bold">No subjects match your search.</p>
                                        </div>
                                    ) : (
                                        Object.entries(groupedWizardSubjects).map(([category, list]) => {
                                            const isCollapsed = collapsedWizardCategories[category] || false;
                                            
                                            return (
                                                <div key={category} className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
                                                    {/* Category Header */}
                                                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                                        <div 
                                                            className="flex items-center gap-2 cursor-pointer select-none"
                                                            onClick={() => toggleWizardCategory(category)}
                                                        >
                                                            <ChevronRight className={`w-4 h-4 text-slate-400 transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
                                                            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
                                                                {category || 'Standard Subjects'}
                                                            </span>
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                                                                {list.length}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-wider">
                                                            <button 
                                                                onClick={() => selectAllInCategory(list)}
                                                                className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                                            >
                                                                Select All
                                                            </button>
                                                            <span className="text-slate-300">|</span>
                                                            <button 
                                                                onClick={() => clearAllInCategory(list)}
                                                                className="text-slate-400 hover:text-slate-600 transition-colors"
                                                            >
                                                                Clear All
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Category Grid */}
                                                    {!isCollapsed && (
                                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {list.map((subject) => {
                                                                const isChecked = selectedWizardSubjects.has(subject.name);
                                                                
                                                                // Category based tag
                                                                const isSHS = selectedGrade?.includes('11') || selectedGrade?.includes('12');
                                                                let tagText = '';
                                                                let tagStyle = '';
                                                                if (isSHS) {
                                                                    const cat = getShsCategoryForSubject(subject.name, selectedGrade || '');
                                                                    if (cat.includes('Core')) {
                                                                        tagText = 'Core';
                                                                        tagStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                                                    } else if (cat.includes('Applied')) {
                                                                        tagText = 'Applied';
                                                                        tagStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                                                                    } else if (cat.includes('Specialized')) {
                                                                        tagText = 'Specialized';
                                                                        tagStyle = 'bg-purple-50 text-purple-700 border-purple-200';
                                                                    } else if (cat.includes('Academic')) {
                                                                        tagText = 'Academic';
                                                                        tagStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                                                                    } else if (cat.includes('TechPro')) {
                                                                        tagText = 'TechPro';
                                                                        tagStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                                                                    }
                                                                }

                                                                return (
                                                                    <div 
                                                                        key={subject.name}
                                                                        onClick={() => toggleWizardSubject(subject.name)}
                                                                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                                                                            isChecked 
                                                                                ? 'border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500/20' 
                                                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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
                                                                            <div className="font-bold text-slate-800 text-sm leading-snug uppercase tracking-tight wrap-break-word">
                                                                                {subject.name}
                                                                            </div>
                                                                            {tagText && (
                                                                                <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mt-2 ${tagStyle}`}>
                                                                                    {tagText}
                                                                                </span>
                                                                            )}
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
                                <div className="bg-slate-50 px-8 py-5 border-t border-slate-200 flex items-center justify-between shrink-0">
                                    {!templateMeta?.isSHS && (
                                        <button
                                            onClick={() => setWizardStep('choice')}
                                            className="h-11 px-5 border border-slate-200 bg-white hover:bg-slate-100 rounded-xl text-slate-600 font-bold text-sm hover:text-slate-900 transition-all flex items-center gap-2"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Back
                                        </button>
                                    )}
                                    
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                setShowCurriculumChoice(false);
                                                setCurriculumChoice(null);
                                                setWizardStep(null);
                                            }}
                                            className="px-6 py-2 text-slate-600 font-bold hover:text-slate-900 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleWizardImport}
                                            disabled={isLoadingTemplate || selectedWizardSubjects.size === 0}
                                            className="h-11 px-8 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-xl font-black text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
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
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-deped-blue text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
                            <h3 className="text-xl font-bold">{editingSubjectId ? 'Edit Subject' : 'Add Subject'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-gray-200">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Subject Name</label>
                                <input
                                    type="text"
                                    value={formData.subject_name}
                                    onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                                    placeholder="Type or select a subject..."
                                    className="form-input mt-1 block w-full bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all h-11 px-4 text-slate-800"
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
                                <label className="block text-sm font-medium text-gray-700">Term Offered</label>
                                <select
                                    value={formData.term}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const parsed = val === 'all' ? 'all' : (val === 'none' ? 'none' : Number(val) as 1 | 2 | 3);
                                        setFormData({ ...formData, term: parsed });
                                    }}
                                    className="form-input mt-1 block w-full"
                                >
                                    <option value="all">All Terms</option>
                                    <option value="1">Term 1 Only</option>
                                    <option value="2">Term 2 Only</option>
                                    <option value="3">Term 3 Only</option>
                                    <option value="none">Not Offered</option>
                                </select>
                            </div>
                            <div className="border-t border-slate-100 pt-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Custom Grading Weights (Optional)</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Written Works %</label>
                                        <input
                                            type="number"
                                            value={formData.written_weight}
                                            onChange={(e) => setFormData({ ...formData, written_weight: e.target.value })}
                                            placeholder="Default"
                                            className="form-input mt-1 block w-full bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all h-10 px-3 text-slate-800 text-sm text-center"
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Performance %</label>
                                        <input
                                            type="number"
                                            value={formData.performance_weight}
                                            onChange={(e) => setFormData({ ...formData, performance_weight: e.target.value })}
                                            placeholder="Default"
                                            className="form-input mt-1 block w-full bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all h-10 px-3 text-slate-800 text-sm text-center"
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Summative %</label>
                                        <input
                                            type="number"
                                            value={formData.exam_weight}
                                            onChange={(e) => setFormData({ ...formData, exam_weight: e.target.value })}
                                            placeholder="Default"
                                            className="form-input mt-1 block w-full bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all h-10 px-3 text-slate-800 text-sm text-center"
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic">Leave empty to use standard DepEd cluster defaults. If custom weights are used, they must sum to 100%.</p>
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

            <SubjectEnrollmentModal
                open={enrollmentSubject !== null}
                subject={enrollmentSubject}
                onClose={() => setEnrollmentSubject(null)}
            />
        </div>
    );
}
