import { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore, useAuthStore } from '../../stores';
import type { Section } from '../../types';
import { 
    STANDARD_SUBJECTS, 
    SPECIAL_SUBJECTS,
    SSHS_G11_CORE_SUBJECTS,
    SSHS_G12_ACADEMIC_SUBJECTS,
    SHS_G12_CORE_SUBJECTS,
    SHS_G12_APPLIED_SUBJECTS,
    SHS_OLD_STRAND_SUBJECTS,
    SSHS_ACADEMIC_CLUSTERS,
    SSHS_ACADEMIC_CLUSTERS_LIST,
    SSHS_TECHPRO_CLUSTERS_LIST,
    SPA_MAJORS,
    getCurriculumTemplatesForSection,
    JHS_STE_ELECTIVES,
    findElectiveInCatalog, 
    type GradeLevel,
    getCategoryForSubject,
    getSshsCategoryForSubject,
    getSshsClusterForSubject,
    getTraditionalShsTrackForSubject,
    getTraditionalShsStrandForSubject,
    isSubjectAllowedForProgram,
    getDefaultTermForSubject,
    isGrade11CoreSubject
} from '../../lib/curriculum';
import { normalizeGrade12PESubjectName } from '../../utils/grading-helpers';
import { normalizeSubjectName, sortSubjects } from '../../lib/subjectConfig';
import { motion } from 'framer-motion';
import { X, Save, Shield, BookOpen, AlertCircle, ChevronRight, Check, RotateCcw, RefreshCw, Search, Copy, Plus, Sparkles, Calendar, Layers, CheckCircle2 } from 'lucide-react';
import { getCurriculumPreset, getDepEdWeightsForSubject } from '../../lib/curriculumPresets';
import { generateUUID } from '../../utils/idGenerator';

const SSHS_CATEGORY_DISPLAY: Record<string, string> = {
    'SSHS - CORE': 'Core Subject (All Tracks)',
    'SSHS - ACADEMIC': 'Academic Elective (All Other Electives)',
    'SSHS - TECH-PRO': 'TechPro Elective (All Other Electives)'
};

interface SectionFormProps {
    section: Section | null;
    isClone?: boolean;
    onClose: () => void;
}

const GRADE_LEVELS = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    'Grade 11', 'Grade 12'
];

const STRANDS: Record<string, string[]> = {
    Academic: [
        'STEM',
        'ABM',
        'HUMSS',
        'GAS',
        ...SSHS_ACADEMIC_CLUSTERS_LIST
    ],
    TVL: [
        'Home Economics (HE)',
        'Information and Communications Technology (ICT)',
        'Industrial Arts (IA)',
        'Agri-Fishery Arts (AFA)',
        'Maritime',
        ...SSHS_TECHPRO_CLUSTERS_LIST
    ],
    TechPro: [
        ...SSHS_TECHPRO_CLUSTERS_LIST
    ],
    Sports: ['Sports Track'],
    'Arts and Design': ['Arts and Design Track'],
};

const getStrandsForTrack = (trackName: string | undefined, gradeLevel?: string | undefined): string[] => {
    if (!trackName) return [];
    const normalizedTrack = trackName.trim().toLowerCase();
    const isGrade11 = gradeLevel?.includes('Grade 11') || gradeLevel === '11';

    // Grade 11 SSHS (DepEd Order No. 017, s. 2026):
    // Strictly 2 tracks (Academic and TechPro) with respective SSHS clusters (zero old K-12 SHS choices)
    if (isGrade11) {
        if (normalizedTrack === 'academic') {
            return [...SSHS_ACADEMIC_CLUSTERS_LIST];
        }
        if (normalizedTrack === 'techpro' || normalizedTrack === 'tvl') {
            return [...SSHS_TECHPRO_CLUSTERS_LIST];
        }
        return [];
    }

    // Grade 12 (Traditional K-12 SHS or Dual SSHS support)
    if (normalizedTrack === 'academic') {
        return STRANDS.Academic;
    }
    if (normalizedTrack === 'techpro') {
        return [...SSHS_TECHPRO_CLUSTERS_LIST];
    }
    if (normalizedTrack === 'tvl') {
        return STRANDS.TVL;
    }
    if (normalizedTrack === 'sports') {
        return STRANDS.Sports;
    }
    if (normalizedTrack === 'arts and design' || normalizedTrack.includes('arts')) {
        return STRANDS['Arts and Design'];
    }
    return [];
};


const normalizeSubjectLabel = (value: string) =>
    value.toLowerCase().replace(/\s+/g, ' ').replace(/\s*\([^)]*\)/g, '').trim();





export function SectionForm({ section, isClone, onClose }: SectionFormProps) {
    const { addSection, updateSection, subjects, schoolProfile, updateSchoolProfile, showNotification, addSubject, updateSubject } = useAppStore();
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const lastInitializedSectionIdRef = useRef<string | null>(null);

    // Initial default name logic
    const getDefaultTeacherName = () => {
        return schoolProfile?.adviser_name || user?.displayName || '';
    };

    const [formData, setFormData] = useState<Partial<Section>>({
        id: '',
        section_name: '',
        section_grade_level: 'Grade 7',
        adviser_id: user?.uid || '',
        adviser_name: getDefaultTeacherName(),
        subject_name: '',
        taught_subjects: [],
        teaching_subjects: [],
        is_teaching_load: false,
        is_advisory: false,
        track: '',
        strand: '',
        cluster: '',
        program: 'Regular',
        spa_majors: []
    });

    const [subjectTerms, setSubjectTerms] = useState<Record<string, 1 | 2 | 3 | 'all'>>(() => {
        return section?.section_metadata?.subjectTerms || {};
    });
    const [showAddCustomModal, setShowAddCustomModal] = useState(false);
    const [customSubjName, setCustomSubjName] = useState('');
    const [customSubjTerm, setCustomSubjTerm] = useState<1 | 2 | 3 | 'all'>(1);
    const [curriculumViewMode, setCurriculumViewMode] = useState<'matrix' | 'catalog'>('matrix');

    const detectedPreset = useMemo(() => {
        return getCurriculumPreset(
            formData.section_grade_level,
            formData.track,
            formData.cluster || formData.strand,
            formData.program
        );
    }, [formData.section_grade_level, formData.track, formData.cluster, formData.strand, formData.program]);

    const isPresetActive = useMemo(() => {
        if (!detectedPreset || !formData.taught_subjects || formData.taught_subjects.length === 0) return false;
        return detectedPreset.subjects.length > 0 &&
               detectedPreset.subjects.every(s => (formData.taught_subjects || []).some(t => t.toLowerCase() === s.name.toLowerCase()));
    }, [detectedPreset, formData.taught_subjects]);

    const applyDetectedPreset = () => {
        if (!detectedPreset) return;
        const names = detectedPreset.subjects.map(s => s.name);
        const newTerms: Record<string, 1 | 2 | 3 | 'all'> = {};
        detectedPreset.subjects.forEach(s => {
            newTerms[s.name] = s.term;
        });

        setFormData(prev => ({
            ...prev,
            taught_subjects: names,
            section_metadata: {
                ...(prev.section_metadata || {}),
                subjectTerms: newTerms
            }
        }));
        setSubjectTerms(newTerms);
        showNotification(`Applied official DepEd curriculum for ${detectedPreset.label}! (${names.length} subjects)`, 'success');
    };

    // Handle initial role defaults for NEW sections
    useEffect(() => {
        if (!section) {
            setFormData(prev => ({
                ...prev,
                is_advisory: false,
                is_teaching_load: false,
                taught_subjects: [],
                teaching_subjects: []
            }));
        }
    }, [section]);

    // Update adviser_name automatically if it's generic/empty and profile details appear
    useEffect(() => {
        const currentName = formData.adviser_name || '';
        const isGeneric = currentName.toLowerCase() === 'admin' || currentName === '';
        
        if (formData.is_advisory && isGeneric && schoolProfile?.adviser_name) {
            setFormData(prev => ({ 
                ...prev, 
                adviser_name: schoolProfile.adviser_name
            }));
        }
    }, [schoolProfile, formData.adviser_name, formData.is_advisory]);

    const availableSubjects = useMemo(() => {
        const grade = formData.section_grade_level as GradeLevel;
        if (!grade) return [];

        const uniqueList: { name: string; code: string }[] = [];
        const seenNames = new Set<string>();

        const addToList = (name: string, code: string = '') => {
            if (!name) return;
            if (!isSubjectAllowedForProgram(name, grade, formData.program)) return;
            const key = name.trim().toLowerCase();
            if (!seenNames.has(key)) {
                seenNames.add(key);
                uniqueList.push({ name, code });
            }
        };

        // 1. Section-specific subjects (if configured in database)
        if (formData.id) {
            const sectionSubjects = subjects.filter(s => 
                s.grade_level === grade && 
                !s.is_teaching_load &&
                s.section_id === formData.id
            );
            sectionSubjects.forEach(s => addToList(s.subject_name, s.subject_code || ''));
        }

        // 2. Grade-level generic subjects in database
        const genericSubjects = subjects.filter(s => 
            s.grade_level === grade && 
            !s.is_teaching_load && 
            !s.section_id
        );
        genericSubjects.forEach(s => {
            if (grade === 'Grade 11') {
                if (isGrade11CoreSubject(s.subject_name)) {
                    addToList(s.subject_name, s.subject_code || '');
                }
            } else {
                addToList(s.subject_name, s.subject_code || '');
            }
        });

        // 3. Standard curriculum templates (Core Subjects)
        if (grade === 'Grade 11') {
            // Always add the 6 universal Core Learning Areas
            SSHS_G11_CORE_SUBJECTS.forEach(s => addToList(s.name, s.code || ''));

            const isTechPro = formData.track === 'TechPro';
            const isAcademic = formData.track === 'Academic';

            if (isAcademic || !formData.track) {
                const clusterKey = formData.cluster || formData.strand;
                if (clusterKey && SSHS_ACADEMIC_CLUSTERS[clusterKey]) {
                    SSHS_ACADEMIC_CLUSTERS[clusterKey].forEach(name => addToList(name, ''));
                }
                // Provide all academic cluster choices so teachers can choose electives
                Object.values(SSHS_ACADEMIC_CLUSTERS).flat().forEach(name => addToList(name, ''));
            }

            if (isTechPro || !formData.track) {
                const techPro11 = SPECIAL_SUBJECTS['Grade 11'] || [];
                techPro11.forEach(s => addToList(s.name, s.code || ''));
            }
        } else if (grade === 'Grade 12') {
            const standard = STANDARD_SUBJECTS[grade] || [];
            standard.forEach(s => addToList(s.name, s.code || ''));

            const techPro12 = SPECIAL_SUBJECTS['Grade 12'] || [];
            techPro12.forEach(s => addToList(s.name, s.code || ''));

            SSHS_G12_ACADEMIC_SUBJECTS.forEach(s => addToList(s.name, s.code || ''));
            SHS_G12_CORE_SUBJECTS.forEach(s => addToList(s.name, s.code || ''));
            SHS_G12_APPLIED_SUBJECTS.forEach(s => addToList(s.name, s.code || ''));
            Object.values(SHS_OLD_STRAND_SUBJECTS).flat().forEach(s => addToList(s.name, s.code || ''));
        } else {
            const standard = STANDARD_SUBJECTS[grade] || [];
            standard.forEach(s => addToList(s.name, s.code || ''));
        }

        // 4. Special Curricular Programs (STE, SPA, SPJ, SPS, SPFL, SPTVE, SSES, ALIVE)
        if (formData.program && formData.program !== 'Regular') {
            const programTemplates = getCurriculumTemplatesForSection(grade, formData.program, formData.spa_majors);
            programTemplates.forEach(s => addToList(s.name, s.code || ''));

            // Cross-grade elective support: Allow STE/SPSTEM sections in JHS to offer any JHS STE Elective
            if (formData.program === 'STE' || formData.program === 'SPSTEM') {
                JHS_STE_ELECTIVES.forEach(s => addToList(s.name, s.code || ''));
            }
        }

        // 5. Any custom or section-specific subjects already in taught_subjects
        (formData.taught_subjects || []).forEach(name => addToList(name, ''));

        // Sort them according to standard DepEd order if possible, otherwise alphabetical
        const standardOrder = [
            'Language', 'Reading and Literacy', 'Filipino', 'English', 
            'Mathematics', 'Science', 'Araling Panlipunan (AP)', 
            'GMRC (Good Manners and Right Conduct)', 'Values Education',
            'Makabansa', 'E.P.P.', 'Technology and Livelihood Education (TLE)', 
            'Music and Arts', 'Physical Education and Health'
        ];

        return uniqueList.sort((a, b) => {
            const indexA = standardOrder.findIndex(name => normalizeSubjectLabel(name) === normalizeSubjectLabel(a.name));
            const indexB = standardOrder.findIndex(name => normalizeSubjectLabel(name) === normalizeSubjectLabel(b.name));

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [formData.section_grade_level, formData.id, formData.program, formData.spa_majors, formData.taught_subjects, formData.track, formData.strand, formData.cluster, subjects]);

    // Standard DepEd curriculum names for this section's grade level and program
    const standardCurriculumSubjectNames = useMemo(() => {
        const grade = (formData.section_grade_level || 'Grade 7') as GradeLevel;
        const templates = getCurriculumTemplatesForSection(grade, formData.program, formData.spa_majors);
        const filtered = templates
            .map(t => t.name)
            .filter(name => isSubjectAllowedForProgram(name, grade, formData.program));
        if (grade === 'Grade 11') {
            return filtered.filter(name => isGrade11CoreSubject(name));
        }
        return filtered;
    }, [formData.section_grade_level, formData.program, formData.spa_majors]);

    // Subjects in database configured for this grade level (customized on Subjects Page)
    const existingDbSubjects = useMemo(() => {
        const grade = formData.section_grade_level as GradeLevel;
        const list = subjects.filter(s => 
            s.grade_level === grade && 
            !s.is_teaching_load && 
            isSubjectAllowedForProgram(s.subject_name, grade, formData.program) &&
            (!s.section_id || (formData.id && s.section_id === formData.id))
        ).map(s => s.subject_name);
        if (grade === 'Grade 11' || (grade || '').includes('11')) {
            // For Grade 11: Only Core subjects default automatically into defaultCurriculumSubjectNames.
            // Electives must be explicitly selected by the teacher and never auto-selected!
            return list.filter(name => isGrade11CoreSubject(name));
        }
        return list;
    }, [subjects, formData.section_grade_level, formData.id, formData.program]);

    // Default advisory curriculum: Prioritize existing DB subjects, fall back to standard template
    const defaultCurriculumSubjectNames = useMemo(() => {
        return existingDbSubjects.length > 0 ? existingDbSubjects : standardCurriculumSubjectNames;
    }, [existingDbSubjects, standardCurriculumSubjectNames]);

    const activeTaughtList = useMemo(() => {
        const grade = (formData.section_grade_level || 'Grade 7') as GradeLevel;
        const program = formData.program || 'Regular';
        const raw = (formData.taught_subjects && formData.taught_subjects.length > 0)
            ? formData.taught_subjects
            : defaultCurriculumSubjectNames;
        return raw.filter(name => isSubjectAllowedForProgram(name, grade, program));
    }, [formData.taught_subjects, defaultCurriculumSubjectNames, formData.section_grade_level, formData.program]);

    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
    const [subjectSearchFilter, setSubjectSearchFilter] = useState('');

    const toggleCategory = (categoryName: string) => {
        setCollapsedCategories(prev => {
            const currentVal = prev[categoryName] ?? false;
            return {
                ...prev,
                [categoryName]: !currentVal
            };
        });
    };

    const selectAllInCategory = (categorySubjects: { name: string }[]) => {
        const current = formData.teaching_subjects || [];
        const toAdd = categorySubjects.map(s => s.name);
        const next = Array.from(new Set([...current, ...toAdd]));
        setFormData({ ...formData, teaching_subjects: next });
    };

    const clearAllInCategory = (categorySubjects: { name: string }[]) => {
        const current = formData.teaching_subjects || [];
        const toRemove = new Set(categorySubjects.map(s => s.name));
        const next = current.filter(name => !toRemove.has(name));
        setFormData({ ...formData, teaching_subjects: next });
    };

    const selectAllInAdvisoryCategory = (categorySubjects: { name: string }[]) => {
        const current = activeTaughtList;
        const toAdd = categorySubjects.map(s => s.name);
        const next = Array.from(new Set([...current, ...toAdd]));
        setFormData({ ...formData, taught_subjects: next });
    };

    const clearAllInAdvisoryCategory = (categorySubjects: { name: string }[]) => {
        const current = activeTaughtList;
        const toRemove = new Set(categorySubjects.map(s => s.name));
        const next = current.filter(name => !toRemove.has(name));
        setFormData({ ...formData, taught_subjects: next });
    };

    const groupedSubjects = useMemo(() => {
        const grade = formData.section_grade_level || 'Grade 7';
        const gradeNum = parseInt(grade.replace(/\D/g, '')) || 0;

        // Apply search filter
        const searchLower = subjectSearchFilter.toLowerCase().trim();
        const filteredSubjects = searchLower 
            ? availableSubjects.filter(s => s.name.toLowerCase().includes(searchLower))
            : availableSubjects;

        // Case 1: SSHS (Grade 11, or Grade 12 when SSHS track or cluster is selected)
        const isExplicitSSHS = gradeNum === 11 || (gradeNum === 12 && ((formData.track || '').toLowerCase().includes('sshs') || (formData.track || '').toLowerCase().includes('cluster') || Boolean(formData.cluster)));

        if (isExplicitSSHS) {
            const catOrder = ['SSHS - CORE', 'SSHS - ACADEMIC', 'SSHS - TECH-PRO'];
            const groups: Record<string, typeof availableSubjects> = {
                'SSHS - CORE': [],
                'SSHS - ACADEMIC': [],
                'SSHS - TECH-PRO': []
            };

            filteredSubjects.forEach((subject) => {
                const cat = getSshsCategoryForSubject(subject.name);
                groups[cat].push(subject);
            });

            const filtered: Record<string, typeof availableSubjects> = {};
            catOrder.forEach(cat => {
                if (groups[cat] && groups[cat].length > 0) {
                    filtered[cat] = groups[cat];
                }
            });
            return filtered;
        }

        // Case 2: Traditional SHS Grade 12 (from ECR_3Term - SHS G12 - SY2026-2027 - Updated_3.xlsx)
        if (gradeNum === 12) {
            const catOrder = [
                'CORE SUBJECT (ALL TRACKS)',
                'ACADEMIC TRACK (EXCEPT IMMERSION)',
                'WORK IMMERSION/ CULMINATING ACTIVITY (FOR ACADEMIC TRACK)',
                'TVL/ SPORTS/ ARTS AND DESIGN TRACK'
            ];
            const groups: Record<string, typeof availableSubjects> = {};
            catOrder.forEach(cat => { groups[cat] = []; });

            filteredSubjects.forEach((subject) => {
                const track = getTraditionalShsTrackForSubject(subject.name);
                if (!groups[track]) groups[track] = [];
                groups[track].push(subject);
            });

            const filtered: Record<string, typeof availableSubjects> = {};
            catOrder.forEach(cat => {
                if (groups[cat] && groups[cat].length > 0) {
                    filtered[cat] = groups[cat];
                }
            });
            return filtered;
        }

        // Case 3: JHS & Elementary
        let catOrder: string[] = [];
        if (gradeNum >= 7) {
            catOrder = [
                'Core Academic Subjects',
                'Values / Character Education',
                'Technology & Livelihood (TLE)',
                'MAPEH (Music, Arts, PE, Health)',
                'Science, Technology & Engineering (STE / SPSTEM)',
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
                'Languages & Literacy',
                'Core Academic Subjects',
                'Values / Character Education',
                'Livelihood & Makabansa',
                'MAPEH (Music, Arts, PE, Health)',
                'Special Science Elementary School (SSES)',
                'Madrasah / ALIVE Program',
                'ICT & Computer Education',
                'Other Subjects'
            ];
        }

        const groups: Record<string, typeof availableSubjects> = {};
        catOrder.forEach(cat => { groups[cat] = []; });

        filteredSubjects.forEach((subject) => {
            const cat = getCategoryForSubject(subject.name, grade);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(subject);
        });

        const filtered: Record<string, typeof availableSubjects> = {};
        Object.entries(groups).forEach(([cat, list]) => {
            if (list.length > 0) {
                filtered[cat] = list;
            }
        });

        return filtered;
    }, [availableSubjects, formData.section_grade_level, formData.track, formData.cluster, subjectSearchFilter]);

    const groupSubjectsByCluster = (subList: typeof availableSubjects) => {
        const grade = formData.section_grade_level || 'Grade 7';
        const gradeNum = parseInt(grade.replace(/\D/g, '')) || 0;
        const isSHS = gradeNum === 11 || gradeNum === 12;
        const isExplicitSSHS = gradeNum === 11 || (gradeNum === 12 && ((formData.track || '').toLowerCase().includes('sshs') || (formData.track || '').toLowerCase().includes('cluster') || Boolean(formData.cluster)));

        if (!isSHS) {
            return { '': subList };
        }

        const clusters: Record<string, typeof availableSubjects> = {};
        subList.forEach((s) => {
            const clusterName = isExplicitSSHS 
                ? getSshsClusterForSubject(s.name) 
                : getTraditionalShsStrandForSubject(s.name);
            if (!clusters[clusterName]) clusters[clusterName] = [];
            clusters[clusterName].push(s);
        });
        return clusters;
    };

    const isElementary = useMemo(() => {
        const grade = formData.section_grade_level || '';
        return ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'].includes(grade);
    }, [formData.section_grade_level]);

    const isJHS = useMemo(() => {
        const grade = formData.section_grade_level || '';
        return ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].includes(grade);
    }, [formData.section_grade_level]);

    const isSHS = useMemo(() => {
        const grade = formData.section_grade_level || '';
        return grade.includes('11') || grade.includes('12');
    }, [formData.section_grade_level]);

    const isG11 = useMemo(() => {
        const grade = formData.section_grade_level || '';
        return grade.includes('11') || grade === '11';
    }, [formData.section_grade_level]);

    const termMatrixData = useMemo(() => {
        const allTerms: string[] = [];
        const term1: string[] = [];
        const term2: string[] = [];
        const term3: string[] = [];

        const gradeNum = parseInt((formData.section_grade_level || 'Grade 12').replace(/\D/g, '')) || 12;

        for (const name of activeTaughtList) {
            const defaultTerm = getDefaultTermForSubject(name, gradeNum);
            const effTerm = subjectTerms[name] ?? (defaultTerm === 'none' ? 1 : (defaultTerm || 1));

            if (!isSHS || effTerm === 'all' || (isG11 && isGrade11CoreSubject(name) && subjectTerms[name] === undefined)) {
                allTerms.push(name);
            } else if (Number(effTerm) === 1) {
                term1.push(name);
            } else if (Number(effTerm) === 2) {
                term2.push(name);
            } else if (Number(effTerm) === 3) {
                term3.push(name);
            } else {
                term1.push(name);
            }
        }

        return { allTerms, term1, term2, term3 };
    }, [activeTaughtList, subjectTerms, isSHS, isG11, formData.section_grade_level]);

    const handleSetSubjectTerm = (subjName: string, term: 1 | 2 | 3 | 'all') => {
        setSubjectTerms(prev => ({
            ...prev,
            [subjName]: term
        }));
    };

    const handleAddCustomSubject = () => {
        const trimmed = customSubjName.trim();
        if (!trimmed) {
            showNotification('Please enter a subject name.', 'error');
            return;
        }
        const current = activeTaughtList;
        if (current.map(s => s.toLowerCase()).includes(trimmed.toLowerCase())) {
            showNotification('This subject is already in the section curriculum.', 'info');
            return;
        }
        setFormData(prev => ({
            ...prev,
            taught_subjects: [...current, trimmed]
        }));
        setSubjectTerms(prev => ({
            ...prev,
            [trimmed]: customSubjTerm
        }));
        setCustomSubjName('');
        setShowAddCustomModal(false);
        showNotification(`Added custom elective "${trimmed}" to curriculum.`, 'success');
    };

    const handleTrackChange = (newTrack: string) => {
        const isG11 = formData.section_grade_level?.includes('Grade 11');
        const isG12 = formData.section_grade_level?.includes('Grade 12');
        const grade = (formData.section_grade_level || 'Grade 11') as GradeLevel;

        let nextTaught = formData.taught_subjects || [];
        if (isG11 || isG12) {
            const templates = getCurriculumTemplatesForSection(grade, formData.program, formData.spa_majors, newTrack, '');
            const cleanNames = templates
                .map(t => t.name)
                .filter(name => isSubjectAllowedForProgram(name, grade, formData.program));
            if (cleanNames.length > 0) {
                nextTaught = cleanNames;
            }
        }

        setFormData(prev => ({
            ...prev,
            track: newTrack,
            strand: '',
            cluster: '',
            taught_subjects: nextTaught
        }));
    };

    const handleStrandChange = (newStrand: string) => {
        const isG11 = formData.section_grade_level?.includes('Grade 11');
        const isG12 = formData.section_grade_level?.includes('Grade 12');
        const grade = (formData.section_grade_level || 'Grade 11') as GradeLevel;

        let nextTaught = formData.taught_subjects || [];
        if (isG11 || isG12) {
            const templates = getCurriculumTemplatesForSection(grade, formData.program, formData.spa_majors, formData.track, newStrand);
            const cleanNames = templates
                .map(t => t.name)
                .filter(name => isSubjectAllowedForProgram(name, grade, formData.program));
            if (cleanNames.length > 0) {
                nextTaught = cleanNames;
            }
        }

        setFormData(prev => ({
            ...prev,
            strand: newStrand,
            cluster: newStrand,
            taught_subjects: nextTaught
        }));
    };

    const handleGradeLevelChange = (newGrade: string) => {
        const isNewElem = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'].includes(newGrade);
        let newProgram = formData.program || 'Regular';
        if (isNewElem && ['STE', 'SPA', 'SPJ', 'SPS', 'SPFL', 'SPTVE'].includes(newProgram)) {
            newProgram = 'Regular';
        } else if (!isNewElem && newProgram === 'SSES') {
            newProgram = 'Regular';
        }

        let newTaught = formData.taught_subjects;
        if (!section && formData.is_advisory) {
            const newGradeDbSubjects = subjects.filter(s => 
                s.grade_level === newGrade && 
                !s.is_teaching_load && 
                !s.section_id
            ).map(s => s.subject_name);
            let standardSubjs = (STANDARD_SUBJECTS[newGrade as GradeLevel] || []).map(s => s.name);
            if (newGrade === 'Grade 11' || newGrade.includes('11')) {
                standardSubjs = standardSubjs.filter(name => isGrade11CoreSubject(name));
            }
            newTaught = newGradeDbSubjects.length > 0 ? newGradeDbSubjects : standardSubjs;
        }

        let newTrack = formData.track || '';
        let newStrand = formData.strand || '';
        let newCluster = formData.cluster || '';

        const isG11 = newGrade.includes('Grade 11') || newGrade === '11';
        const isG12 = newGrade.includes('Grade 12') || newGrade === '12';

        if (isG11) {
            // For Grade 11: Only Academic and TechPro are allowed under SSHS (no old K-12 SHS tracks)
            if (newTrack !== 'Academic' && newTrack !== 'TechPro') {
                if (newTrack === 'TVL') {
                    newTrack = 'TechPro';
                } else {
                    newTrack = '';
                }
            }
            // Validate strand / cluster against allowed Grade 11 clusters
            const validClusters = getStrandsForTrack(newTrack, 'Grade 11');
            const currentSelected = newCluster || newStrand;
            if (!validClusters.includes(currentSelected)) {
                newStrand = '';
                newCluster = '';
            } else {
                newStrand = currentSelected;
                newCluster = currentSelected;
            }
        } else if (!isG12) {
            // Non-SHS (Elementary / JHS)
            newTrack = '';
            newStrand = '';
            newCluster = '';
        }

        setFormData({
            ...formData,
            section_grade_level: newGrade,
            program: newProgram,
            spa_majors: newProgram === 'SPA' ? (formData.spa_majors || []) : [],
            taught_subjects: newTaught,
            track: newTrack,
            strand: newStrand,
            cluster: newCluster
        });
    };

    const handleAdvisoryChange = (checked: boolean) => {
        setFormData(prev => ({ 
            ...prev, 
            is_advisory: checked,
            adviser_name: checked ? (schoolProfile?.adviser_name || user?.displayName || '') : '',
            taught_subjects: checked && (!prev.taught_subjects || prev.taught_subjects.length <= 1)
                ? defaultCurriculumSubjectNames
                : (prev.taught_subjects || [])
        }));
    };

    const syncTaughtSubjectsWithDb = () => {
        if (existingDbSubjects.length > 0) {
            setFormData(prev => ({
                ...prev,
                taught_subjects: [...existingDbSubjects]
            }));
            showNotification(`Synced ${existingDbSubjects.length} subjects from Subjects Page.`, 'success');
        } else {
            showNotification('No subjects found in Subjects Page for this grade level.', 'info');
        }
    };

    const resetTaughtSubjectsToStandard = () => {
        setFormData(prev => ({
            ...prev,
            taught_subjects: [...standardCurriculumSubjectNames]
        }));
        showNotification('Advisory curriculum reset to standard DepEd subjects.', 'info');
    };

    const toggleTaughtSubject = (subjectName: string) => {
        const current = activeTaughtList;
        if (current.includes(subjectName)) {
            setFormData({ ...formData, taught_subjects: current.filter(s => s !== subjectName) });
        } else {
            setFormData({ ...formData, taught_subjects: [...current, subjectName] });
        }
    };

    const handleTeachingChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            is_teaching_load: checked,
            teaching_subjects: checked ? (prev.teaching_subjects && prev.teaching_subjects.length > 0 ? prev.teaching_subjects : []) : []
        }));
    };

    const toggleSubject = (subjectName: string) => {
        const current = formData.teaching_subjects || [];
        if (current.includes(subjectName)) {
            setFormData({ ...formData, teaching_subjects: current.filter(s => s !== subjectName) });
        } else {
            setFormData({ ...formData, teaching_subjects: [...current, subjectName] });
        }
    };

    useEffect(() => {
        if (section) {
            const initKey = isClone ? `clone_${section.id}` : section.id;
            // Prevent re-initializing if this section was already initialized
            if (lastInitializedSectionIdRef.current === initKey) {
                return;
            }
            lastInitializedSectionIdRef.current = initKey;

            const profileName = (schoolProfile?.adviser_name || '').trim();
            const isGenericProfile = profileName.toLowerCase() === 'admin' || profileName === '';
            const isAdvisory = section.is_advisory ?? !section.is_teaching_load;
            const isTeaching = section.is_teaching_load ?? false;
            const teachingSubjs = section.teaching_subjects 
                || (isTeaching && !isAdvisory ? (section.taught_subjects || (section.subject_name ? [section.subject_name] : [])) : []) 
                || [];
            
            const grade = (section.section_grade_level || 'Grade 7') as GradeLevel;
            const program = section.program || 'Regular';

            // Sanitize existing taught subjects: strip subjects not allowed for this section's program
            let existingTaught = section.taught_subjects || (section.subject_name ? [section.subject_name] : []);
            existingTaught = existingTaught.filter(name => isSubjectAllowedForProgram(name, grade, program));

            if (isAdvisory && existingTaught.length <= 1) {
                const templates = getCurriculumTemplatesForSection(grade, program, section.spa_majors);
                existingTaught = templates
                    .map(t => t.name)
                    .filter(name => isSubjectAllowedForProgram(name, grade, program));
                if (grade === 'Grade 11' || (grade || '').includes('11')) {
                    existingTaught = existingTaught.filter(name => isGrade11CoreSubject(name));
                }
            }

            const isSectionG11 = section.section_grade_level?.includes('Grade 11') || section.section_grade_level === '11';
            let initialTrack = section.track || '';
            let initialStrand = section.strand || '';
            let initialCluster = section.cluster || (isSectionG11 ? section.strand || '' : '');

            if (isSectionG11) {
                if (initialTrack === 'TVL') {
                    initialTrack = 'TechPro';
                } else if (initialTrack && initialTrack !== 'Academic' && initialTrack !== 'TechPro') {
                    initialTrack = '';
                }
                const validG11Choices = getStrandsForTrack(initialTrack, 'Grade 11');
                const selectedVal = initialCluster || initialStrand;
                if (!validG11Choices.includes(selectedVal)) {
                    initialStrand = '';
                    initialCluster = '';
                } else {
                    initialStrand = selectedVal;
                    initialCluster = selectedVal;
                }
            }

            // Set form data ONCE on section mount/change
            setFormData({
                ...section,
                id: isClone ? '' : section.id,
                section_name: isClone ? `${section.section_name} (Copy)` : section.section_name,
                // Force update adviser name if profile name is set and it is an advisory class. Otherwise keep it empty/as is.
                adviser_name: isAdvisory 
                    ? ((!isGenericProfile && profileName) ? profileName : (section.adviser_name || ''))
                    : '',
                is_advisory: isAdvisory,
                is_teaching_load: isTeaching,
                taught_subjects: existingTaught,
                teaching_subjects: teachingSubjs,
                track: initialTrack,
                strand: initialStrand,
                cluster: initialCluster,
                program: section.program || 'Regular',
                spa_majors: section.spa_majors || []
            });

            if (section.section_metadata?.subjectTerms) {
                setSubjectTerms(section.section_metadata.subjectTerms);
            } else {
                setSubjectTerms({});
            }
        } else {
            lastInitializedSectionIdRef.current = null;
            setSubjectTerms({});
        }
    }, [section, isClone, schoolProfile?.adviser_name]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.section_name || !formData.section_grade_level) {
            showNotification('Please fill in all required fields.', 'error');
            return;
        }

        if (!formData.is_advisory && !formData.is_teaching_load) {
            showNotification('Please select at least one role: Advisory or Teaching.', 'error');
            return;
        }

        const isG11 = formData.section_grade_level?.includes('Grade 11');
        const isG12 = formData.section_grade_level?.includes('Grade 12');
        const isTeaching = !!formData.is_teaching_load;
        const isAdvisory = !!formData.is_advisory;

        try {
            const validSubjectNames = new Set(availableSubjects.map(s => s.name));
            const validTeachingSubjects = isTeaching
                ? (formData.teaching_subjects || []).filter(s => validSubjectNames.has(s) && normalizeSubjectLabel(s) !== 'specialization')
                : [];
            
            const isExplicitSSHS = (formData.track || '').toLowerCase().includes('sshs') || (formData.track || '').toLowerCase().includes('cluster');
            
            // For Advisory classes, use formData.taught_subjects if non-empty, otherwise default to DB subjects or standard curriculum
            let finalTaughtSubjects: string[] = [];
            const gradeLevel = (formData.section_grade_level || 'Grade 7') as GradeLevel;
            const sectionProgram = formData.program || 'Regular';

            if (isAdvisory) {
                const currentTaught = formData.taught_subjects || [];
                if (currentTaught.length > 1) {
                    finalTaughtSubjects = currentTaught;
                } else if (section?.taught_subjects && section.taught_subjects.length > 1) {
                    finalTaughtSubjects = section.taught_subjects;
                } else {
                    finalTaughtSubjects = defaultCurriculumSubjectNames;
                }
            } else {
                finalTaughtSubjects = validTeachingSubjects;
            }

            // Sanitize final taught subjects to only include allowed subjects for this grade & program
            finalTaughtSubjects = finalTaughtSubjects.filter(s => isSubjectAllowedForProgram(s, gradeLevel, sectionProgram));

            if (isG12 && !isExplicitSSHS) {
                finalTaughtSubjects = finalTaughtSubjects.map(s => normalizeGrade12PESubjectName(s, false));
            }

            if (isG11 || isG12) {
                finalTaughtSubjects = sortSubjects(finalTaughtSubjects, s => s);
            }

            const sectionData: Section = {
                id: formData.id || `section_${Date.now()}`,
                section_name: formData.section_name!,
                section_grade_level: formData.section_grade_level!,
                adviser_id: formData.adviser_id || '',
                adviser_name: isAdvisory ? (formData.adviser_name || '') : '',
                subject_name: formData.subject_name,
                taught_subjects: finalTaughtSubjects,
                teaching_subjects: validTeachingSubjects,
                is_teaching_load: isTeaching,
                is_advisory: isAdvisory,
                track: (isG11 || isG12)
                    ? formData.track || ''
                    : undefined,
                strand: (isG11 || isG12)
                    ? (isG11 ? formData.cluster || formData.strand || '' : formData.strand || '')
                    : undefined,
                cluster: isG11
                    ? formData.cluster || formData.strand || ''
                    : undefined,
                program: (!isG11 && !isG12)
                    ? (formData.program || 'Regular')
                    : undefined,
                spa_majors: (!isG11 && !isG12 && formData.program === 'SPA')
                    ? (formData.spa_majors || [])
                    : undefined,
                section_metadata: {
                    ...(section?.section_metadata || {}),
                    ...(formData.section_metadata || {}),
                    subjectTerms: subjectTerms
                }
            };

            if (isClone) {
                await addSection(sectionData);
                showNotification('Section configuration cloned successfully.', 'success');
            } else if (section) {
                await updateSection(sectionData);
                showNotification('Section updated successfully.', 'success');
            } else {
                await addSection(sectionData);
                showNotification('Section created successfully.', 'success');
            }

            // Auto-sync Subject database records with DepEd weights
            if (isAdvisory && finalTaughtSubjects.length > 0) {
                for (const subName of finalTaughtSubjects) {
                    const norm = normalizeSubjectName(subName);
                    const existing = subjects.find(s => 
                        (s.grade_level || '').trim() === sectionData.section_grade_level.trim() &&
                        (!s.section_id || s.section_id === sectionData.id) &&
                        normalizeSubjectName(s.subject_name) === norm
                    );
                    const effTerm = subjectTerms[subName] || (isSHS ? 1 : 'all');
                    if (!existing) {
                        const weights = getDepEdWeightsForSubject(subName, sectionData.section_grade_level, sectionData.track);
                        await addSubject({
                            id: generateUUID(),
                            subject_name: subName,
                            grade_level: sectionData.section_grade_level,
                            section_id: sectionData.id,
                            term: effTerm,
                            written_weight: weights.written_weight,
                            performance_weight: weights.performance_weight,
                            exam_weight: weights.exam_weight,
                            counts_in_general_average: true
                        });
                    } else if (existing.term !== effTerm && effTerm !== 'all') {
                        await updateSubject({
                            ...existing,
                            term: effTerm
                        });
                    }
                }
            }

            // Sync with Institute Profile if this is the Advisory Class (and not a cloned section)
            if (!isClone) {
                if (sectionData.is_advisory) {
                    await updateSchoolProfile({
                        ...schoolProfile!,
                        grade_level: sectionData.section_grade_level,
                        section: sectionData.section_name
                    });
                } else if (section && (section.is_advisory ?? !section.is_teaching_load)) {
                    // If it WAS an advisory class but is now NOT, clear the profile fields
                    await updateSchoolProfile({
                        ...schoolProfile!,
                        grade_level: '',
                        section: ''
                    });
                }
            }

            onClose();
        } catch (error) {
            console.error('Failed to save section:', error);
            showNotification('Failed to save section.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white w-full max-w-5xl xl:max-w-6xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] border border-slate-200 dark:border-white/10"
            >
                {/* Header */}
                <div className="bg-deped-blue dark:bg-[#0f172a] p-8 text-white relative shrink-0 border-b border-deped-blue/30 dark:border-white/10">
                    <button 
                        onClick={onClose}
                        className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-2xl font-black tracking-tight mb-1">
                        {isClone ? 'Clone Section Configuration' : section ? 'Edit Section' : 'Create New Section'}
                    </h3>
                    <p className="text-blue-200/60 dark:text-blue-300/60 font-bold uppercase tracking-widest text-[9px]">
                        {isClone 
                            ? `Copying configuration from ${section?.section_name || 'source section'}` 
                            : section 
                                ? `Modifying ${section.section_name}` 
                                : (formData.is_advisory ? 'Setup your official advisory class' : 'Add a section for your teaching load')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-5">
                        {/* Grade Level First */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2.5 ml-1">Grade Level *</label>
                            <select 
                                required
                                className="w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-[#0d1225] rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none cursor-pointer"
                                value={formData.section_grade_level}
                                onChange={(e) => handleGradeLevelChange(e.target.value)}
                            >
                                {GRADE_LEVELS.map(g => <option key={g} value={g} className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">{g}</option>)}
                            </select>
                        </div>

                        {/* Section Name Second */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2.5 ml-1">Section Name *</label>
                            <input 
                                type="text" 
                                required
                                placeholder="e.g. Einstein"
                                className="w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-[#0d1225] rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                value={formData.section_name}
                                onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                            />
                        </div>

                        {/* Curricular Program Selection (G1-G10) */}
                        {(isElementary || isJHS) && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2.5 ml-1">
                                    Curricular Program
                                </label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-[#0d1225] rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none cursor-pointer"
                                    value={formData.program || 'Regular'}
                                    onChange={(e) => {
                                        const p = e.target.value;
                                        const grade = (formData.section_grade_level || 'Grade 7') as GradeLevel;
                                        const templates = getCurriculumTemplatesForSection(grade, p, p === 'SPA' ? (formData.spa_majors && formData.spa_majors.length > 0 ? formData.spa_majors : Object.keys(SPA_MAJORS)) : []);
                                        const cleanNames = templates
                                            .map(t => t.name)
                                            .filter(name => isSubjectAllowedForProgram(name, grade, p));
                                        setFormData({
                                            ...formData,
                                            program: p,
                                            taught_subjects: cleanNames,
                                            spa_majors: p === 'SPA' ? (formData.spa_majors && formData.spa_majors.length > 0 ? formData.spa_majors : Object.keys(SPA_MAJORS)) : []
                                        });
                                        showNotification(`Curricular program changed to ${p} (${cleanNames.length} official subjects loaded).`, 'info');
                                    }}
                                >
                                    {isElementary ? (
                                        <>
                                            <option value="Regular" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Regular Basic Education (MATATAG)</option>
                                            <option value="SSES" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Special Science Elementary School (SSES)</option>
                                            <option value="ALIVE" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Madrasah / ALIVE Program</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Regular" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Regular Basic Education (MATATAG)</option>
                                            <option value="STE" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Science, Technology, and Engineering (STE)</option>
                                            <option value="SPSTEM" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Special Program in STEM (SPSTEM)</option>
                                            <option value="SPA" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Special Program in the Arts (SPA)</option>
                                            <option value="SPJ" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Special Program in Journalism (SPJ)</option>
                                            <option value="SPS" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Special Program in Sports (SPS)</option>
                                            <option value="SPFL" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Special Program in Foreign Language (SPFL)</option>
                                            <option value="SPTVE" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Technical-Vocational Education (SPTVE)</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        )}

                        {/* SPA Majors Selection (If SPA program is selected) */}
                        {(isJHS && formData.program === 'SPA') && (
                            <div className="col-span-2 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/30 rounded-2xl p-4">
                                <label className="block text-[9px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-widest mb-1.5">
                                    Offered SPA Art Majors / Disciplines
                                </label>
                                <p className="text-[10px] text-purple-600/80 dark:text-purple-300/80 mb-3">
                                    Select which art specializations are offered in this section. Students will be enrolled in their specific major elective.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {Object.keys(SPA_MAJORS).map((major) => {
                                        const isSelected = (formData.spa_majors || []).includes(major);
                                        return (
                                            <div 
                                                key={major}
                                                onClick={() => {
                                                    const current = formData.spa_majors || [];
                                                    const next = isSelected 
                                                        ? current.filter(m => m !== major)
                                                        : [...current, major];
                                                    setFormData({ ...formData, spa_majors: next });
                                                }}
                                                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                                    isSelected 
                                                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs' 
                                                        : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-purple-300'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'border-white bg-white/20' : 'border-slate-300 dark:border-white/20'}`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white stroke-3" />}
                                                </div>
                                                <span className="truncate text-[11px]">{major}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Track Selection (SHS only: Grade 11 or Grade 12) */}
                        {(formData.section_grade_level?.includes('Grade 11') || formData.section_grade_level?.includes('Grade 12')) && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2.5 ml-1">
                                    {formData.section_grade_level?.includes('Grade 11') ? 'SSHS Track *' : 'SHS Track *'}
                                </label>
                                <select 
                                    required
                                    className="w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-[#0d1225] rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none cursor-pointer"
                                    value={formData.track || ''}
                                    onChange={(e) => handleTrackChange(e.target.value)}
                                >
                                    <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">
                                        {formData.section_grade_level?.includes('Grade 11') ? 'Select SSHS Track' : 'Select SHS Track'}
                                    </option>
                                    <option value="Academic" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Academic</option>
                                    <option value="TechPro" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">TechPro</option>
                                    {!formData.section_grade_level?.includes('Grade 11') && (
                                        <>
                                            <option value="TVL" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">TVL</option>
                                            <option value="Sports" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Sports</option>
                                            <option value="Arts and Design" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Arts and Design</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        )}

                        {/* Academic / TechPro Cluster Selection (SHS: Grade 11 uses Clusters, Grade 12 uses Strands/Clusters) */}
                        {(formData.section_grade_level?.includes('Grade 11') || formData.section_grade_level?.includes('Grade 12')) && formData.track && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2.5 ml-1">
                                    {formData.section_grade_level?.includes('Grade 11') 
                                        ? (formData.track === 'Academic' ? 'Academic Cluster *' : 'TechPro Cluster *') 
                                        : (formData.track === 'TechPro' ? 'TechPro Cluster *' : 'SHS Strand *')}
                                </label>
                                <select 
                                    required
                                    className="w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white border-2 border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-[#0d1225] rounded-2xl px-5 py-3.5 text-sm font-bold transition-all outline-none cursor-pointer"
                                    value={formData.strand || formData.cluster || ''}
                                    onChange={(e) => handleStrandChange(e.target.value)}
                                >
                                    <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">
                                        {formData.section_grade_level?.includes('Grade 11')
                                            ? (formData.track === 'Academic' ? 'Select Academic Cluster' : 'Select TechPro Cluster')
                                            : (formData.track === 'TechPro' ? 'Select TechPro Cluster' : 'Select SHS Strand')}
                                    </option>
                                    {getStrandsForTrack(formData.track, formData.section_grade_level).map((s) => (
                                        <option key={s} value={s} className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">{s}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* ROLE CONFIGURATION */}
                        <div className="col-span-2 bg-slate-50/50 dark:bg-white/5 rounded-2.5xl p-5 border border-slate-100 dark:border-white/10">
                            <label className="block text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-4 ml-1">Role Configuration</label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Advisory Role */}
                                <label className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2 ${formData.is_advisory ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40 shadow-xs' : 'bg-white dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.is_advisory ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-300'}`}>
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-xs font-black ${formData.is_advisory ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>Advisory</div>
                                        <div className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase">Class Adviser</div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-2 border-slate-200 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer" 
                                        checked={formData.is_advisory}
                                        onChange={(e) => handleAdvisoryChange(e.target.checked)}
                                    />
                                </label>

                                {/* Teaching Role */}
                                <label className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2 ${formData.is_teaching_load ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 shadow-xs' : 'bg-white dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.is_teaching_load ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-none' : 'bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-300'}`}>
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-xs font-black ${formData.is_teaching_load ? 'text-amber-900 dark:text-amber-300' : 'text-slate-600 dark:text-slate-300'}`}>Teaching</div>
                                        <div className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase">Subject Teacher</div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-2 border-slate-200 dark:border-white/10 text-amber-500 focus:ring-amber-500 transition-all cursor-pointer" 
                                        checked={formData.is_teaching_load}
                                        onChange={(e) => handleTeachingChange(e.target.checked)}
                                    />
                                </label>
                            </div>

                            {/* ADVISORY CURRICULUM PANEL */}
                            {formData.is_advisory && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 'auto' }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-6 border-t border-slate-100 dark:border-white/10 pt-6"
                                >
                                    {/* 1. Header & Actions Bar */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 ml-1">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                                    Official Section Curriculum ({activeTaughtList.length})
                                                </label>
                                                <span className="px-2 py-0.5 rounded-md text-[8.5px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                                                    {formData.program || 'Regular'}
                                                </span>
                                                {isSHS && (
                                                    <span className="px-2 py-0.5 rounded-md text-[8.5px] font-black bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                                                        3-Term Trimestral
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[9.5px] font-medium text-slate-400 dark:text-slate-500">
                                                Official subjects for this section (powers SF9, SF10, Consolidated Grades, & Grade Slips)
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* View Mode Switcher */}
                                            <div className="flex items-center bg-slate-100 dark:bg-white/5 p-0.5 rounded-xl border border-slate-200/60 dark:border-white/10 text-[9px] font-bold">
                                                <button
                                                    type="button"
                                                    onClick={() => setCurriculumViewMode('matrix')}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                                        curriculumViewMode === 'matrix'
                                                            ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs font-black'
                                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                                    }`}
                                                >
                                                    <Calendar className="w-3 h-3" />
                                                    Visual Term Matrix
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurriculumViewMode('catalog')}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                                        curriculumViewMode === 'catalog'
                                                            ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs font-black'
                                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                                    }`}
                                                >
                                                    <Layers className="w-3 h-3" />
                                                    Catalog Checklist
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCustomSubjTerm(1);
                                                    setShowAddCustomModal(true);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9.5px] font-bold transition-all cursor-pointer shadow-xs"
                                                title="Add an elective, specialized course, or custom subject for this section"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Add Elective / Custom
                                            </button>
                                            {existingDbSubjects.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={syncTaughtSubjectsWithDb}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer shadow-xs"
                                                >
                                                    <RefreshCw className="w-3 h-3" />
                                                    Sync DB
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={resetTaughtSubjectsToStandard}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-100 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer shadow-xs"
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                                Reset
                                            </button>
                                        </div>
                                    </div>

                                    {/* 2. Detected Official DepEd Preset Banner */}
                                    {detectedPreset && (
                                        <div className="relative overflow-hidden mb-5 p-4 rounded-2xl bg-linear-to-r from-indigo-500/10 via-purple-500/5 to-emerald-500/10 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                                                            <Sparkles className="w-2.5 h-2.5" />
                                                            DepEd Official Preset
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                                                            {detectedPreset.depedOrder || (detectedPreset.curriculumType === 'SSHS' ? 'DO 017, s. 2026' : detectedPreset.curriculumType === 'MATATAG' ? 'DO 10, s. 2024' : 'DO 8, s. 2015')}
                                                        </span>
                                                        {isPresetActive && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
                                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                                                Preset Active
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {detectedPreset.label}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                        {detectedPreset.description} • <span className="font-bold text-slate-700 dark:text-slate-300">{detectedPreset.subjects.length} official subjects</span> ({detectedPreset.termStructure || (isSHS ? '3 Terms (Trimester)' : '3 Terms (Whole-Year)')})
                                                    </p>
                                                </div>

                                                <div className="shrink-0 flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={applyDetectedPreset}
                                                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 ${
                                                            isPresetActive
                                                                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200'
                                                                : 'bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20 ring-2 ring-indigo-400/40'
                                                        }`}
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                        {isPresetActive ? 'Re-Apply DepEd Preset' : `1-Click Apply (${detectedPreset.subjects.length} Subjects)`}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Visual Term Matrix View */}
                                    {curriculumViewMode === 'matrix' && (
                                        <div className="space-y-4">
                                            {!isSHS ? (
                                                /* Elementary & JHS Whole-Year Curriculum Matrix */
                                                <div className="bg-white/80 dark:bg-[#0d1225]/80 border border-slate-200/70 dark:border-white/10 rounded-2xl p-4 shadow-xs">
                                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10 mb-3">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                                                    Whole-Year Learning Areas
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                                                                    Continuous Across Terms 1, 2, & 3
                                                                </span>
                                                            </div>
                                                            <span className="text-[9px] text-slate-400">
                                                                DepEd MATATAG / K-12: Grades 1–10 subjects operate through all 3 terms with cumulative term assessment.
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                                            {activeTaughtList.length} Subjects Active
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                        {activeTaughtList.map(subjName => {
                                                            const weights = getDepEdWeightsForSubject(subjName, formData.section_grade_level, formData.track);
                                                            return (
                                                                <div
                                                                    key={`mat-elem-${subjName}`}
                                                                    className="group p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex items-center justify-between gap-2"
                                                                >
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="text-[10px] font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 truncate">
                                                                            {subjName}
                                                                        </div>
                                                                        <div className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                                                                            WW {weights.written_weight}% · PT {weights.performance_weight}% · QA {weights.exam_weight}%
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleTaughtSubject(subjName)}
                                                                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer shrink-0"
                                                                        title="Remove from section curriculum"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Senior High School Visual Term Matrix (SSHS G11 & SHS G12) */
                                                <div className="space-y-4">
                                                    {/* Core Learning Areas spanning All Terms */}
                                                    {termMatrixData.allTerms.length > 0 && (
                                                        <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/40 rounded-2xl p-4 shadow-xs">
                                                            <div className="flex items-center justify-between pb-2.5 border-b border-indigo-100 dark:border-indigo-900/40 mb-3">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                                                                            {isG11 ? 'SSHS Core Learning Areas (Spans All 3 Terms)' : 'Whole-Year / Core Learning Areas'}
                                                                        </span>
                                                                        <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black bg-indigo-600 text-white shadow-xs">
                                                                            {termMatrixData.allTerms.length} Subjects • 2.0 Units/Term (6.0 Units/Yr)
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[9px] text-slate-500 dark:text-slate-400">
                                                                        Continuous learning areas required across Term 1, Term 2, and Term 3 (DO 017, s. 2026).
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                                {termMatrixData.allTerms.map(subjName => {
                                                                    const weights = getDepEdWeightsForSubject(subjName, formData.section_grade_level, formData.track);
                                                                    return (
                                                                        <div
                                                                            key={`mat-core-${subjName}`}
                                                                            className="p-2.5 rounded-xl border border-indigo-200/60 dark:border-indigo-800/50 bg-white dark:bg-indigo-950/40 shadow-xs flex items-center justify-between gap-2"
                                                                        >
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="text-[10px] font-black uppercase tracking-tight text-indigo-950 dark:text-indigo-200 truncate">
                                                                                    {subjName}
                                                                                </div>
                                                                                <div className="text-[8px] font-bold text-indigo-600/70 dark:text-indigo-400/80 mt-0.5">
                                                                                    All Terms · WW {weights.written_weight}% · PT {weights.performance_weight}% · QA {weights.exam_weight}%
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-1 shrink-0">
                                                                                {(['all', 1, 2, 3] as const).map(t => (
                                                                                    <button
                                                                                        key={t}
                                                                                        type="button"
                                                                                        onClick={() => handleSetSubjectTerm(subjName, t)}
                                                                                        className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-all cursor-pointer ${
                                                                                            'all' === t
                                                                                                ? 'bg-indigo-600 text-white shadow-xs'
                                                                                                : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20'
                                                                                        }`}
                                                                                        title={`Offer in ${t === 'all' ? 'All Terms' : `Term ${t}`}`}
                                                                                    >
                                                                                        {t === 'all' ? 'All' : `T${t}`}
                                                                                    </button>
                                                                                ))}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => toggleTaughtSubject(subjName)}
                                                                                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                                                                    title="Remove from curriculum"
                                                                                >
                                                                                    <X className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 3 Columns for Term 1, Term 2, Term 3 Electives / Courses */}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                                        {([
                                                            { termNum: 1, title: 'Term 1', subtitle: 'Trimester 1 Electives', list: termMatrixData.term1, borderCol: 'border-blue-200 dark:border-blue-900/50', bgCol: 'bg-blue-50/20 dark:bg-blue-950/10', headerBadge: 'bg-blue-600 text-white' },
                                                            { termNum: 2, title: 'Term 2', subtitle: 'Trimester 2 Electives', list: termMatrixData.term2, borderCol: 'border-emerald-200 dark:border-emerald-900/50', bgCol: 'bg-emerald-50/20 dark:bg-emerald-950/10', headerBadge: 'bg-emerald-600 text-white' },
                                                            { termNum: 3, title: 'Term 3', subtitle: 'Trimester 3 Electives', list: termMatrixData.term3, borderCol: 'border-purple-200 dark:border-purple-900/50', bgCol: 'bg-purple-50/20 dark:bg-purple-950/10', headerBadge: 'bg-purple-600 text-white' }
                                                        ] as const).map(({ termNum, title, list, borderCol, bgCol, headerBadge }) => (
                                                            <div
                                                                key={`term-col-${termNum}`}
                                                                className={`rounded-2xl border ${borderCol} ${bgCol} p-3.5 flex flex-col min-h-40 shadow-xs`}
                                                            >
                                                                {/* Term Column Header */}
                                                                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/50 dark:border-white/10 mb-2.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${headerBadge}`}>
                                                                            {title}
                                                                        </span>
                                                                        <span className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400">
                                                                            ({list.length} {list.length === 1 ? 'subject' : 'subjects'})
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setCustomSubjTerm(termNum);
                                                                            setShowAddCustomModal(true);
                                                                        }}
                                                                        className="p-1 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-white/10 text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                                                                        title={`Add subject to ${title}`}
                                                                    >
                                                                        <Plus className="w-3 h-3" />
                                                                        <span className="text-[8px] uppercase">Add</span>
                                                                    </button>
                                                                </div>

                                                                {/* Column Subject Cards */}
                                                                <div className="space-y-2 flex-1">
                                                                    {list.length === 0 ? (
                                                                        <div className="flex flex-col items-center justify-center h-24 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-2">
                                                                            <span className="text-[9px] font-bold text-slate-400">No electives for {title}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setCustomSubjTerm(termNum);
                                                                                    setShowAddCustomModal(true);
                                                                                }}
                                                                                className="text-[8.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-1 cursor-pointer"
                                                                            >
                                                                                + Add Course
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        list.map(subjName => {
                                                                            const weights = getDepEdWeightsForSubject(subjName, formData.section_grade_level, formData.track);
                                                                            return (
                                                                                <div
                                                                                    key={`mat-t${termNum}-${subjName}`}
                                                                                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0d1225] shadow-xs space-y-2"
                                                                                >
                                                                                    <div className="flex items-start justify-between gap-1.5">
                                                                                        <div className="min-w-0 flex-1">
                                                                                            <span className="text-[9.5px] font-black uppercase tracking-tight text-slate-900 dark:text-white block leading-tight">
                                                                                                {subjName}
                                                                                            </span>
                                                                                            <span className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 block">
                                                                                                WW {weights.written_weight}% · PT {weights.performance_weight}% · QA {weights.exam_weight}%
                                                                                            </span>
                                                                                        </div>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => toggleTaughtSubject(subjName)}
                                                                                            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer shrink-0"
                                                                                            title="Remove from curriculum"
                                                                                        >
                                                                                            <X className="w-3 h-3" />
                                                                                        </button>
                                                                                    </div>

                                                                                    {/* Term Switcher Pills */}
                                                                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
                                                                                        <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-400">Term:</span>
                                                                                        <div className="flex items-center gap-1">
                                                                                            {(['all', 1, 2, 3] as const).map(t => (
                                                                                                <button
                                                                                                    key={t}
                                                                                                    type="button"
                                                                                                    onClick={() => handleSetSubjectTerm(subjName, t)}
                                                                                                    className={`px-1.5 py-0.5 rounded text-[7.5px] font-black transition-all cursor-pointer ${
                                                                                                        termNum === t
                                                                                                            ? 'bg-indigo-600 text-white shadow-xs'
                                                                                                            : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20'
                                                                                                    }`}
                                                                                                    title={`Switch to ${t === 'all' ? 'All Terms' : `Term ${t}`}`}
                                                                                                >
                                                                                                    {t === 'all' ? 'All' : `T${t}`}
                                                                                                </button>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 4. Catalog Checklist View */}
                                    {curriculumViewMode === 'catalog' && (
                                        <div>
                                            {/* Search filter */}
                                            <div className="relative mb-3">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                <input
                                                    type="text"
                                                    placeholder="Search subjects in catalog..."
                                                    value={subjectSearchFilter}
                                                    onChange={(e) => setSubjectSearchFilter(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-300"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                {Object.entries(groupedSubjects).map(([category, list]) => {
                                                    const isCollapsed = category ? (collapsedCategories[category] ?? false) : false;
                                                    
                                                    return (
                                                        <div key={`adv-${category}`} className="bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/70 dark:border-indigo-800/30 rounded-2xl overflow-hidden shadow-xs">
                                                            {/* Category Header */}
                                                            {category && (
                                                                <div className="bg-indigo-100/50 dark:bg-indigo-950/40 px-4 py-2.5 flex items-center justify-between border-b border-indigo-100/70 dark:border-indigo-800/30">
                                                                    <div 
                                                                        onClick={() => toggleCategory(category)}
                                                                        className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                                                                    >
                                                                        <ChevronRight className={`w-3.5 h-3.5 text-indigo-400 transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
                                                                        <span className="text-[9.5px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider truncate">
                                                                            {SSHS_CATEGORY_DISPLAY[category] || category}
                                                                        </span>
                                                                        <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-200/60 dark:bg-indigo-800/40 text-indigo-600 dark:text-indigo-300">
                                                                            {list.length}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider select-none shrink-0 pl-4">
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => selectAllInAdvisoryCategory(list)}
                                                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors font-bold cursor-pointer"
                                                                        >
                                                                            Select All
                                                                        </button>
                                                                        <span className="text-indigo-300 dark:text-indigo-700">|</span>
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => clearAllInAdvisoryCategory(list)}
                                                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-bold cursor-pointer"
                                                                        >
                                                                            Clear All
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Category Grid */}
                                                            {!isCollapsed && (
                                                                <div className="p-3 space-y-3">
                                                                    {Object.entries(groupSubjectsByCluster(list)).map(([clusterName, clusterItems]) => (
                                                                        <div key={clusterName || 'all'} className="space-y-1.5">
                                                                            {clusterName && (
                                                                                <div className="flex items-center gap-2 pt-1 pb-0.5 px-1">
                                                                                    <span className="text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100/70 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200">
                                                                                        {clusterName}
                                                                                    </span>
                                                                                    <span className="text-[8px] font-bold text-slate-400">
                                                                                        ({clusterItems.length})
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                                {clusterItems.map((subj) => {
                                                                                    const isSelected = activeTaughtList.includes(subj.name);
                                                                                    const gradeNum = parseInt((formData.section_grade_level || 'Grade 12').replace(/\D/g, '')) || 12;
                                                                                    const defaultTerm = getDefaultTermForSubject(subj.name, gradeNum);
                                                                                    const effTerm = subjectTerms[subj.name] ?? (defaultTerm === 'none' ? 1 : (defaultTerm || 1));

                                                                                    return (
                                                                                        <div
                                                                                            key={`advisory-${subj.name}`}
                                                                                            onClick={() => toggleTaughtSubject(subj.name)}
                                                                                            className={`group p-2.5 ps-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 min-h-11 ${isSelected ? 'bg-white dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-600 shadow-xs' : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/10 opacity-60 hover:opacity-100'}`}
                                                                                        >
                                                                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'border-slate-300 dark:border-white/20'}`}>
                                                                                                    {isSelected && <Check className="w-3 h-3 stroke-3" />}
                                                                                                </div>
                                                                                                <span className={`text-[9.5px] font-black uppercase tracking-tight block truncate ${isSelected ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                                                    {subj.name}
                                                                                                </span>
                                                                                            </div>

                                                                                            {/* Inline offering term selector for SHS subjects */}
                                                                                            {isSHS && isSelected && (
                                                                                                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                                                                                    {(['all', 1, 2, 3] as const).map(t => (
                                                                                                        <button
                                                                                                            key={t}
                                                                                                            type="button"
                                                                                                            onClick={() => handleSetSubjectTerm(subj.name, t)}
                                                                                                            className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-all cursor-pointer ${
                                                                                                                effTerm === t
                                                                                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                                                                                    : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20'
                                                                                                            }`}
                                                                                                            title={`Offer in ${t === 'all' ? 'All Terms' : `Term ${t}`}`}
                                                                                                        >
                                                                                                            {t === 'all' ? 'All' : `T${t}`}
                                                                                                        </button>
                                                                                                    ))}
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            toggleTaughtSubject(subj.name);
                                                                                                        }}
                                                                                                        className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ml-0.5 cursor-pointer"
                                                                                                        title="Remove from section curriculum"
                                                                                                    >
                                                                                                        <X className="w-3 h-3" />
                                                                                                    </button>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* TEACHING LOAD PANEL */}
                            {formData.is_teaching_load && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 'auto' }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-6 border-t border-slate-100 dark:border-white/10 pt-6"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 ml-1">
                                        <div>
                                            <label className="block text-[9px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest">
                                                My Teaching Load in this Section ({formData.teaching_subjects?.length || 0})
                                            </label>
                                            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                                                Select subjects you personally teach (powers E-Class Record and LIR)
                                            </span>
                                        </div>
                                        {formData.is_advisory && activeTaughtList.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, teaching_subjects: [...activeTaughtList] })}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer shadow-xs"
                                                    title="Quickly select all official section subjects as your teaching load"
                                                >
                                                    <Check className="w-3 h-3 stroke-3" />
                                                    Teach All ({activeTaughtList.length})
                                                </button>
                                                {(formData.teaching_subjects?.length || 0) > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, teaching_subjects: [] })}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer shadow-xs"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                        
                                    {availableSubjects.length > 0 ? (
                                        <div className="space-y-4">
                                            {Object.entries(groupedSubjects).map(([category, list]) => {
                                                const grade = formData.section_grade_level || 'Grade 11';
                                                const isSHS = grade.includes('11') || grade.includes('12');
                                                const isCollapsed = category ? (collapsedCategories[category] ?? isSHS) : false;
                                                
                                                return (
                                                    <div key={category} className="bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs">
                                                        {/* Category Header */}
                                                        {category && (
                                                            <div className="bg-slate-100/80 dark:bg-white/10 px-4 py-3 flex items-center justify-between border-b border-slate-200/50 dark:border-white/10">
                                                                <div 
                                                                    onClick={() => toggleCategory(category)}
                                                                    className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                                                                >
                                                                    <ChevronRight className={`w-4 h-4 text-slate-400 transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
                                                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-200 uppercase tracking-wider truncate">
                                                                        {category}
                                                                    </span>
                                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-300">
                                                                        {list.length}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider select-none shrink-0 pl-4">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => selectAllInCategory(list)}
                                                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors font-bold cursor-pointer"
                                                                    >
                                                                        Select All
                                                                    </button>
                                                                    <span className="text-slate-300 dark:text-slate-600">|</span>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => clearAllInCategory(list)}
                                                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-bold cursor-pointer"
                                                                    >
                                                                        Clear All
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Category Grid */}
                                                        {!isCollapsed && (
                                                            <div className="p-4 space-y-3 bg-white dark:bg-[#0f172a]">
                                                                {Object.entries(groupSubjectsByCluster(list)).map(([clusterName, clusterItems]) => (
                                                                    <div key={clusterName || 'all'} className="space-y-1.5">
                                                                        {clusterName && (
                                                                            <div className="flex items-center gap-2 pt-1 pb-0.5 px-1">
                                                                                <span className="text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100/70 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
                                                                                    {clusterName}
                                                                                </span>
                                                                                <span className="text-[8px] font-bold text-slate-400">
                                                                                    ({clusterItems.length})
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                            {clusterItems.map((subj) => {
                                                                                const isSHS = (formData.section_grade_level || '').includes('11') || (formData.section_grade_level || '').includes('12');
                                                                                const electiveInfo = isSHS ? findElectiveInCatalog(subj.name) : undefined;
                                                                                const isSelected = formData.teaching_subjects?.includes(subj.name);
                                                                                const isAdvisoryTaught = activeTaughtList.includes(subj.name);
                                                                                return (
                                                                                    <div 
                                                                                        key={`teaching-${subj.name}`}
                                                                                        onClick={() => toggleSubject(subj.name)}
                                                                                        className={`group p-2.5 ps-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 min-h-11 ${isSelected ? 'bg-white dark:bg-amber-950/60 border-amber-400 dark:border-amber-500 shadow-xs' : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/10 opacity-60 hover:opacity-100'}`}
                                                                                    >
                                                                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-amber-500 border-amber-500 text-white shadow-xs' : 'border-slate-300 dark:border-white/20'}`}>
                                                                                                {isSelected && <Check className="w-3 h-3 stroke-3" />}
                                                                                            </div>
                                                                                            <div className="min-w-0 flex-1">
                                                                                                <span className={`text-[9.5px] font-black uppercase tracking-tight block truncate ${isSelected ? 'text-amber-950 dark:text-amber-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                                                    {subj.name}
                                                                                                </span>
                                                                                                {electiveInfo?.prerequisites && electiveInfo.prerequisites.length > 0 && (
                                                                                                    <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 block truncate">
                                                                                                        Prereq: {electiveInfo.prerequisites.join(', ')}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-1 shrink-0">
                                                                                            {isAdvisoryTaught && (
                                                                                                <span className="text-[7.5px] font-bold px-1 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400">
                                                                                                    Section
                                                                                                </span>
                                                                                            )}
                                                                                            {electiveInfo?.hours && (
                                                                                                <span className="text-[7.5px] font-bold px-1 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                                                                                                    {electiveInfo.hours}h
                                                                                                </span>
                                                                                            )}
                                                                                            {electiveInfo?.ncLevel && (
                                                                                                <span className="text-[7.5px] font-bold px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
                                                                                                    {electiveInfo.ncLevel}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 italic">No standard subjects found.</p>
                                    )}
                                </motion.div>
                            )}

                            {/* NEITHER ROLE SELECTED PROMPT */}
                            {!formData.is_advisory && !formData.is_teaching_load && (
                                <div className="mt-6 border-t border-slate-100 dark:border-white/10 pt-6">
                                    <div className="p-5 text-center bg-slate-50/50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10">
                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-400">
                                            Select a role above (<span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Advisory</span> or <span className="text-amber-600 dark:text-amber-400 font-extrabold">Teaching</span>) to configure this section.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Adviser / Teacher (LOCKED) */}
                        <div className="col-span-2">
                            <label className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2.5 ml-1 flex items-center gap-2">
                                {formData.is_advisory ? 'Adviser Name' : 'Subject Teacher Name'} (LOCKED)
                                <Shield className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                            </label>
                            <div className="relative group/locked">
                                <input 
                                    readOnly
                                    className="w-full bg-slate-100 dark:bg-white/10 border-2 border-slate-200/50 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-black text-slate-500 dark:text-slate-200 outline-none cursor-not-allowed transition-all"
                                    value={formData.is_advisory ? (formData.adviser_name || '') : (schoolProfile?.adviser_name || user?.displayName || '')}
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                    <Shield className="w-4 h-4 text-slate-300 dark:text-slate-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Alert */}
                    <div className="flex gap-4 p-4 bg-blue-50/50 dark:bg-blue-950/40 rounded-2.5xl border border-blue-100/50 dark:border-blue-800/40">
                        <AlertCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[9px] font-black text-blue-700 dark:text-blue-300 leading-relaxed uppercase tracking-tighter">
                            Advisory classes will appear in official SF forms, while teaching roles are for Grade management and E-Class Record.
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="flex-3 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading ? 'Saving...' : isClone ? (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Clone Section
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Config
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Custom Elective Modal */}
                {showAddCustomModal && (
                    <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                        <div className="bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 text-slate-800 dark:text-white">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-black uppercase tracking-wider">
                                    Add Elective / Custom Subject
                                </h4>
                                <button 
                                    type="button" 
                                    onClick={() => setShowAddCustomModal(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Add an elective, specialized course, or custom school subject for this section.
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase mb-1">
                                        Subject Name *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Robotics, Journalism, Java NC III..."
                                        value={customSubjName}
                                        onChange={(e) => setCustomSubjName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                                        autoFocus
                                    />
                                </div>
                                {isSHS && (
                                    <div>
                                        <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase mb-1">
                                            Offering Term *
                                        </label>
                                        <select
                                            value={customSubjTerm}
                                            onChange={(e) => {
                                                const val = e.target.value === 'all' ? 'all' : (Number(e.target.value) as 1 | 2 | 3);
                                                setCustomSubjTerm(val);
                                            }}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                                        >
                                            <option value="1" className="bg-white dark:bg-[#0d1225]">Term 1 Only</option>
                                            <option value="2" className="bg-white dark:bg-[#0d1225]">Term 2 Only</option>
                                            <option value="3" className="bg-white dark:bg-[#0d1225]">Term 3 Only</option>
                                            <option value="all" className="bg-white dark:bg-[#0d1225]">All Terms</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddCustomModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddCustomSubject}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer"
                                >
                                    Add to Section
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
