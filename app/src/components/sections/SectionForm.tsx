import { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '../../stores/app-store';
import { useAuthStore } from '../../stores/auth-store';
import type { Section, SubjectTermSelection } from '../../types';
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
    isSubjectAllowedForProgram,
    getDefaultTermForSubject,
    normalizeOfferedTerms,
    isGrade11CoreSubject,
    isSubjectMatchingSectionTrackAndStrand,
    SSHS_G12_TECHPRO_SUBJECTS,
    isTraditionalCoreSubject,
    isTraditionalAppliedSubject,
    isTraditionalImmersionSubject,
    getTvlComponentForSubject,
    getShsSubjectUnitInfo
} from '../../lib/curriculum';
import { auditGrade11ElectiveEnrollment, normalizeGrade12PESubjectName } from '../../utils/grading-helpers';
import { normalizeSubjectName, sortSubjects } from '../../lib/subjectConfig';
import { motion } from 'framer-motion';
import { X, Save, Shield, BookOpen, AlertCircle, ChevronRight, Check, RotateCcw, RefreshCw, Search, Copy, Plus, Sparkles, Calendar, Layers, CheckCircle2, Trash2, CheckSquare } from 'lucide-react';
import { getCurriculumPreset, getDepEdWeightsForSubject } from '../../lib/curriculumPresets';
import { repairSectionOwnedSubjectOfferings } from '../../services/curriculumSync';
import { generateUUID } from '../../utils/idGenerator';

const SSHS_CATEGORY_DISPLAY: Record<string, string> = {
    'SSHS - CORE': 'Core Subject (All Tracks)',
    'SSHS - ACADEMIC': 'Academic Elective (All Other Electives)',
    'SSHS - TECH-PRO': 'TechPro Elective (All Other Electives)'
};

type SectionSetupPanel = 'details' | 'curriculum' | 'teaching' | 'review';

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

const grade11CoreNames = SSHS_G11_CORE_SUBJECTS.map(subject => subject.name);

const createGrade11CoreTerms = (): Record<string, SubjectTermSelection> =>
    Object.fromEntries(grade11CoreNames.map(name => [name, 'all' as const]));

const isGrade11CoreName = (name: string) =>
    grade11CoreNames.some(core => core.toLowerCase() === name.toLowerCase());

const normalizeTermValue = (val: unknown): 1 | 2 | 3 | 'all' | 'none' | '1,2' | '2,3' => {
    if (val === 'all' || val === 'none' || val === '1,2' || val === '2,3') return val;
    if (Array.isArray(val)) {
        const joined = val.map(Number).filter(n => n >= 1 && n <= 3).sort().join(',');
        if (joined === '1,2,3') return 'all';
        if (joined === '1,2' || joined === '2,3') return joined;
        if (joined === '1') return 1;
        if (joined === '2') return 2;
        if (joined === '3') return 3;
        return 'none';
    }
    const num = Number(val);
    if (num === 1 || num === 2 || num === 3) return num;
    return 'none';
};

const getGrade11ElectiveTerm = (name: string, terms: Record<string, SubjectTermSelection>) => {
    const configured = terms[name];
    if (getShsSubjectUnitInfo(name, 'Grade 11').category === 'techpro_elective' || configured === 'all') {
        return 'all';
    }
    if (configured === 1 || configured === 2 || configured === 3) return configured;
    const defaultTerm = getDefaultTermForSubject(name, 11);
    if (defaultTerm === 'all') return 'all';
    return defaultTerm === 2 || defaultTerm === 3 ? defaultTerm : 1;
};

export function SectionForm({ section, isClone, onClose }: SectionFormProps) {
    const { addSection, updateSection, sections, students, subjects, schoolProfile, updateSchoolProfile, showNotification, addSubject, updateSubject } = useAppStore();
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const lastInitializedSectionIdRef = useRef<string | null>(null);

    // Initial default name logic
    const getDefaultTeacherName = () => {
        return schoolProfile?.adviser_name || user?.displayName || '';
    };

    const initialGradePreset = !section ? getCurriculumPreset('Grade 7', '', '', 'Regular') : null;
    const initialPresetSubjects = initialGradePreset ? initialGradePreset.subjects.map(s => s.name) : [];
    const initialPresetTerms: Record<string, SubjectTermSelection> = {};
    if (initialGradePreset) {
        initialGradePreset.subjects.forEach(s => { initialPresetTerms[s.name] = s.term; });
    }

    const [formData, setFormData] = useState<Partial<Section>>({
        id: '',
        section_name: '',
        section_grade_level: 'Grade 7',
        adviser_id: user?.uid || '',
        adviser_name: getDefaultTeacherName(),
        subject_name: '',
        taught_subjects: initialPresetSubjects,
        teaching_subjects: [],
        is_teaching_load: false,
        is_advisory: true,
        track: '',
        strand: '',
        cluster: '',
        program: 'Regular',
        spa_majors: [],
        section_metadata: {
            subjectTerms: initialPresetTerms
        }
    });

    const [subjectTerms, setSubjectTerms] = useState<Record<string, SubjectTermSelection>>(() => {
        return section?.section_metadata?.subjectTerms || initialPresetTerms;
    });
    const [showAddCustomModal, setShowAddCustomModal] = useState(false);
    const [customSubjName, setCustomSubjName] = useState('');
    const [customSubjTerm, setCustomSubjTerm] = useState<1 | 2 | 3 | 'all'>(1);
    const [curriculumViewMode, setCurriculumViewMode] = useState<'matrix' | 'catalog'>('matrix');
    const [hasExplicitlyClearedTaught, setHasExplicitlyClearedTaught] = useState(false);
    const [activeSetupPanel, setActiveSetupPanel] = useState<SectionSetupPanel>('details');

    // Grade 11 SSHS has a different offering model from a generic preset.  The
    // six Core subjects are required throughout the year; the cluster catalog is
    // a list of choices, not a list to automatically offer in one section.
    const isGrade11SshsSection = () => (formData.section_grade_level || '').includes('11');

    const applyGrade11CoreBaseline = () => {
        const coreTerms = createGrade11CoreTerms();
        setHasExplicitlyClearedTaught(false);
        setFormData(prev => ({
            ...prev,
            taught_subjects: [...grade11CoreNames],
            section_metadata: {
                ...(prev.section_metadata || {}),
                subjectTerms: coreTerms
            }
        }));
        setSubjectTerms(coreTerms);
    };

    /** Adds a Grade 11 SSHS elective offering for a term.  Learner enrolment,
     * not the section roster, enforces one elective per learner per term. */
    const setGrade11ElectiveForTerm = (subjectName: string, term: 1 | 2 | 3 | 'all') => {
        if (isGrade11CoreName(subjectName)) {
            showNotification('Grade 11 SSHS Core Subjects are required in all three terms.', 'info');
            return;
        }

        const current = formData.taught_subjects || [];
        const alreadyOffered = current.some(name => name.toLowerCase() === subjectName.toLowerCase());
        const nextSubjects = [
            ...grade11CoreNames,
            ...current.filter(name => !isGrade11CoreName(name)),
            ...(alreadyOffered ? [] : [subjectName])
        ];
        const nextTerms: Record<string, SubjectTermSelection> = createGrade11CoreTerms();
        nextSubjects.forEach(name => {
            if (!isGrade11CoreName(name)) {
                nextTerms[name] = name === subjectName ? term : getGrade11ElectiveTerm(name, subjectTerms);
            }
        });

        setHasExplicitlyClearedTaught(false);
        setFormData(prev => ({
            ...prev,
            taught_subjects: nextSubjects,
            section_metadata: {
                ...(prev.section_metadata || {}),
                subjectTerms: nextTerms
            }
        }));
        setSubjectTerms(nextTerms);
        showNotification(
            alreadyOffered
                ? `Moved "${subjectName}" to ${term === 'all' ? 'All Terms' : `Term ${term}`}.`
                : `Added "${subjectName}" as a ${term === 'all' ? '3-term' : `Term ${term}`} offering.`,
            'info'
        );
    };

    const detectedPreset = useMemo(() => {
        return getCurriculumPreset(
            formData.section_grade_level,
            formData.track,
            formData.cluster || formData.strand,
            formData.program
        );
    }, [formData.section_grade_level, formData.track, formData.cluster, formData.strand, formData.program]);

    const isPresetActive = useMemo(() => {
        if ((formData.section_grade_level || '').includes('11')) {
            const selected = formData.taught_subjects || [];
            const hasAllCores = grade11CoreNames.every(core => selected.some(name => name.toLowerCase() === core.toLowerCase()));
            const electiveTerms = new Set(selected
                .filter(name => !isGrade11CoreName(name))
                .map(name => getGrade11ElectiveTerm(name, subjectTerms)));
            return hasAllCores && electiveTerms.size === 3;
        }
        if (!detectedPreset || !formData.taught_subjects || formData.taught_subjects.length === 0) return false;
        return detectedPreset.subjects.length > 0 &&
               detectedPreset.subjects.every(s => (formData.taught_subjects || []).some(t => t.toLowerCase() === s.name.toLowerCase()));
    }, [detectedPreset, formData.taught_subjects, formData.section_grade_level, subjectTerms]);

    const applyDetectedPreset = () => {
        if (!detectedPreset) return;
        if (isGrade11SshsSection()) {
            applyGrade11CoreBaseline();
            showNotification('Applied the 6 required Grade 11 SSHS Core Subjects. Add the elective offerings needed in each term, then enrol learners in their chosen elective.', 'success');
            return;
        }
        setHasExplicitlyClearedTaught(false);
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
            setFormData(prev => {
                const currentGrade = prev.section_grade_level || 'Grade 7';
                const preset = getCurriculumPreset(currentGrade, '', '', 'Regular');
                const defaultSubjects = preset ? preset.subjects.map(s => s.name) : [];
                const defaultTerms: Record<string, SubjectTermSelection> = {};
                if (preset) {
                    preset.subjects.forEach(s => { defaultTerms[s.name] = s.term; });
                }
                setSubjectTerms(defaultTerms);
                return {
                    ...prev,
                    is_advisory: true,
                    is_teaching_load: false,
                    program: 'Regular',
                    taught_subjects: defaultSubjects,
                    teaching_subjects: [],
                    section_metadata: {
                        ...(prev.section_metadata || {}),
                        subjectTerms: defaultTerms
                    }
                };
            });
            setHasExplicitlyClearedTaught(false);
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

        // 2. Grade-level generic subjects in database (filtered strictly by section track & strand/cluster)
        const genericSubjects = subjects.filter(s => 
            s.grade_level === grade && 
            !s.is_teaching_load && 
            !s.section_id
        );
        genericSubjects.forEach(s => {
            if (isSubjectMatchingSectionTrackAndStrand(s.subject_name, grade, formData.track, formData.strand || formData.cluster)) {
                addToList(s.subject_name, s.subject_code || '');
            }
        });

        // 3. Standard curriculum templates (Core & Track-specific subjects)
        if (grade === 'Grade 11') {
            // Always add the universal 6 Core Learning Areas
            SSHS_G11_CORE_SUBJECTS.forEach(s => addToList(s.name, s.code || ''));

            const isTechPro = formData.track === 'TechPro';
            const isAcademic = formData.track === 'Academic';

            if (isAcademic || !formData.track) {
                const clusterKey = formData.cluster || formData.strand;
                if (clusterKey && SSHS_ACADEMIC_CLUSTERS[clusterKey]) {
                    SSHS_ACADEMIC_CLUSTERS[clusterKey].forEach(name => addToList(name, ''));
                } else {
                    // If no cluster selected yet, provide academic cluster choices
                    Object.values(SSHS_ACADEMIC_CLUSTERS).flat().forEach(name => addToList(name, ''));
                }
            }

            if (isTechPro || !formData.track) {
                const clusterKey = formData.cluster || formData.strand;
                if (clusterKey && (SSHS_TECHPRO_CLUSTERS_LIST as readonly string[]).includes(clusterKey)) {
                    const techProList = SPECIAL_SUBJECTS['Grade 11'] || [];
                    techProList.forEach(s => {
                        if (isSubjectMatchingSectionTrackAndStrand(s.name, grade, 'TechPro', clusterKey)) {
                            addToList(s.name, s.code || '');
                        }
                    });
                } else {
                    const techPro11 = SPECIAL_SUBJECTS['Grade 11'] || [];
                    techPro11.forEach(s => addToList(s.name, s.code || ''));
                }
            }
        } else if (grade === 'Grade 12') {
            const isExplicitSSHS = (formData.track || '').toLowerCase().includes('techpro') ||
                                   (formData.track || '').toLowerCase().includes('sshs') ||
                                   Boolean(formData.cluster && (SSHS_TECHPRO_CLUSTERS_LIST as readonly string[]).includes(formData.cluster));

            if (isExplicitSSHS) {
                // Grade 12 SSHS Curriculum (DO 017, s. 2026)
                SSHS_G11_CORE_SUBJECTS.forEach(s => addToList(s.name, s.code || ''));
                SHS_G12_CORE_SUBJECTS.forEach(s => addToList(s.name, s.code || ''));

                if (formData.track === 'TechPro') {
                    SSHS_G12_TECHPRO_SUBJECTS.forEach(s => {
                        if (isSubjectMatchingSectionTrackAndStrand(s.name, grade, formData.track, formData.strand || formData.cluster)) {
                            addToList(s.name, s.code || '');
                        }
                    });
                } else {
                    SSHS_G12_ACADEMIC_SUBJECTS.forEach(s => {
                        if (isSubjectMatchingSectionTrackAndStrand(s.name, grade, formData.track, formData.strand || formData.cluster)) {
                            addToList(s.name, s.code || '');
                        }
                    });
                }
            } else {
                // Traditional SHS Grade 12 Curriculum (DO 8, s. 2015)
                // 1. Core Subjects (All Tracks)
                SHS_G12_CORE_SUBJECTS.forEach(s => addToList(s.name, s.code || ''));

                // 2. Applied Subjects (Universal for Academic/TVL tracks)
                SHS_G12_APPLIED_SUBJECTS.forEach(s => addToList(s.name, s.code || ''));

                // 3. Specialized subjects for chosen track and strand
                const strandKey = formData.strand;
                if (strandKey && SHS_OLD_STRAND_SUBJECTS[strandKey]) {
                    SHS_OLD_STRAND_SUBJECTS[strandKey].forEach(s => addToList(s.name, s.code || ''));
                } else if (formData.track === 'Academic') {
                    (SHS_OLD_STRAND_SUBJECTS.ABM || []).forEach(s => addToList(s.name, s.code || ''));
                    (SHS_OLD_STRAND_SUBJECTS.STEM || []).forEach(s => addToList(s.name, s.code || ''));
                    (SHS_OLD_STRAND_SUBJECTS.HUMSS || []).forEach(s => addToList(s.name, s.code || ''));
                    (SHS_OLD_STRAND_SUBJECTS.GAS || []).forEach(s => addToList(s.name, s.code || ''));
                } else if (formData.track === 'TVL') {
                    (SHS_OLD_STRAND_SUBJECTS.TVL || []).forEach(s => addToList(s.name, s.code || ''));
                } else if (formData.track === 'Sports') {
                    (SHS_OLD_STRAND_SUBJECTS.Sports || []).forEach(s => addToList(s.name, s.code || ''));
                } else if (formData.track === 'Arts and Design') {
                    (SHS_OLD_STRAND_SUBJECTS['Arts and Design'] || []).forEach(s => addToList(s.name, s.code || ''));
                } else {
                    Object.values(SHS_OLD_STRAND_SUBJECTS).flat().forEach(s => addToList(s.name, s.code || ''));
                }
            }
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

        // 5. Retain any custom or section-specific subjects already chosen in taught_subjects
        (formData.taught_subjects || []).forEach(name => addToList(name, ''));

        // Filter through isSubjectMatchingSectionTrackAndStrand (except custom active subjects)
        const activeTaughtSet = new Set((formData.taught_subjects || []).map(s => s.toLowerCase()));
        const filteredList = uniqueList.filter(s => 
            activeTaughtSet.has(s.name.toLowerCase()) || 
            isSubjectMatchingSectionTrackAndStrand(s.name, grade, formData.track, formData.strand || formData.cluster)
        );

        // Sort them according to standard DepEd order if possible, otherwise alphabetical
        const standardOrder = [
            'Language', 'Reading and Literacy', 'Filipino', 'English', 
            'Mathematics', 'Science', 'Araling Panlipunan (AP)', 
            'GMRC (Good Manners and Right Conduct)', 'Values Education',
            'Makabansa', 'E.P.P.', 'Technology and Livelihood Education (TLE)', 
            'Music and Arts', 'Physical Education and Health'
        ];

        return filteredList.sort((a, b) => {
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

    // Subjects in database configured for this grade level and track/strand (customized on Subjects Page)
    const existingDbSubjects = useMemo(() => {
        const grade = formData.section_grade_level as GradeLevel;
        const list = subjects.filter(s => 
            s.grade_level === grade && 
            !s.is_teaching_load && 
            isSubjectAllowedForProgram(s.subject_name, grade, formData.program) &&
            isSubjectMatchingSectionTrackAndStrand(s.subject_name, grade, formData.track, formData.strand || formData.cluster) &&
            (!s.section_id || (formData.id && s.section_id === formData.id))
        ).map(s => s.subject_name);
        if (grade === 'Grade 11' || (grade || '').includes('11')) {
            // For Grade 11: Only Core subjects default automatically into defaultCurriculumSubjectNames.
            // Electives must be explicitly selected by the teacher and never auto-selected!
            return list.filter(name => isGrade11CoreSubject(name));
        }
        return list;
    }, [subjects, formData.section_grade_level, formData.id, formData.program, formData.track, formData.strand, formData.cluster]);

    // Grade 11 starts with its required cores only. Its matching preset is an
    // elective catalog and must never become the section's automatic offering.
    const defaultCurriculumSubjectNames = useMemo(() => {
        if ((formData.section_grade_level || '').includes('11')) {
            return [...grade11CoreNames];
        }
        if (detectedPreset && detectedPreset.subjects.length > 0) {
            return detectedPreset.subjects.map(s => s.name);
        }
        return existingDbSubjects.length > 0 ? existingDbSubjects : standardCurriculumSubjectNames;
    }, [detectedPreset, existingDbSubjects, standardCurriculumSubjectNames, formData.section_grade_level]);

    const activeTaughtList = useMemo(() => {
        const grade = (formData.section_grade_level || 'Grade 7') as GradeLevel;
        const program = formData.program || 'Regular';
        if (hasExplicitlyClearedTaught) {
            return (formData.taught_subjects || []).filter(name => isSubjectAllowedForProgram(name, grade, program));
        }
        const raw = (formData.taught_subjects && formData.taught_subjects.length > 0)
            ? formData.taught_subjects
            : defaultCurriculumSubjectNames;
        return raw.filter(name => isSubjectAllowedForProgram(name, grade, program));
    }, [formData.taught_subjects, hasExplicitlyClearedTaught, defaultCurriculumSubjectNames, formData.section_grade_level, formData.program]);

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
        if (isGrade11SshsSection()) {
            showNotification('For Grade 11 SSHS, add only the elective offerings your school will run. Each learner is later enrolled in one elective per term.', 'info');
            return;
        }
        setHasExplicitlyClearedTaught(false);
        const current = activeTaughtList;
        const toAdd = categorySubjects.map(s => s.name);
        const next = Array.from(new Set([...current, ...toAdd]));
        setFormData({ ...formData, taught_subjects: next });
    };

    const clearAllInAdvisoryCategory = (categorySubjects: { name: string }[]) => {
        if (isGrade11SshsSection()) {
            showNotification('Use the elective term cards to remove Grade 11 SSHS elective offerings.', 'info');
            return;
        }
        const current = activeTaughtList;
        const toRemove = new Set(categorySubjects.map(s => s.name));
        const next = current.filter(name => !toRemove.has(name));
        if (next.length === 0) {
            setHasExplicitlyClearedTaught(true);
        }
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

        // Case 1: SSHS (Grade 11, or Grade 12 when TechPro or explicit SSHS track/cluster is selected)
        const isExplicitSSHS = gradeNum === 11 || (gradeNum === 12 && ((formData.track || '').toLowerCase().includes('techpro') || (formData.track || '').toLowerCase().includes('sshs') || Boolean(formData.cluster && (SSHS_TECHPRO_CLUSTERS_LIST as readonly string[]).includes(formData.cluster))));

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

        // Case 2: Traditional SHS Grade 12 (DO 8, s. 2015)
        if (gradeNum === 12) {
            const strandLabel = formData.strand 
                ? `${formData.strand} Specialized Subjects` 
                : (formData.track ? `${formData.track} Specialized Subjects` : 'Specialized Track Subjects');
            const catOrder = [
                'Core Subjects (Universal)',
                'Applied Subjects',
                strandLabel,
                'Work Immersion / Culminating Activity',
                'TVL / Sports / Arts & Design'
            ];
            const groups: Record<string, typeof availableSubjects> = {};
            catOrder.forEach(cat => { groups[cat] = []; });

            filteredSubjects.forEach((subject) => {
                if (isTraditionalImmersionSubject(subject.name)) {
                    groups['Work Immersion / Culminating Activity'].push(subject);
                } else if (isTraditionalCoreSubject(subject.name)) {
                    groups['Core Subjects (Universal)'].push(subject);
                } else if (isTraditionalAppliedSubject(subject.name)) {
                    groups['Applied Subjects'].push(subject);
                } else if (getTraditionalShsTrackForSubject(subject.name) === 'TVL/ SPORTS/ ARTS AND DESIGN TRACK' && formData.track !== 'TVL') {
                    groups['TVL / Sports / Arts & Design'].push(subject);
                } else {
                    groups[strandLabel].push(subject);
                }
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
        catOrder.forEach(cat => {
            if (groups[cat] && groups[cat].length > 0) {
                filtered[cat] = groups[cat];
            }
        });

        Object.entries(groups).forEach(([cat, list]) => {
            if (list.length > 0 && !filtered[cat]) {
                filtered[cat] = list;
            }
        });

        return filtered;
    }, [availableSubjects, formData.section_grade_level, formData.track, formData.strand, formData.cluster, subjectSearchFilter]);

    const groupSubjectsByCluster = (subList: typeof availableSubjects) => {
        const grade = formData.section_grade_level || 'Grade 7';
        const gradeNum = parseInt(grade.replace(/\D/g, '')) || 0;
        const isSHS = gradeNum === 11 || gradeNum === 12;
        const isExplicitSSHS = gradeNum === 11 || (gradeNum === 12 && ((formData.track || '').toLowerCase().includes('techpro') || (formData.track || '').toLowerCase().includes('sshs') || Boolean(formData.cluster && (SSHS_TECHPRO_CLUSTERS_LIST as readonly string[]).includes(formData.cluster))));

        if (!isSHS) {
            return { '': subList };
        }

        if (isExplicitSSHS) {
            const clusters: Record<string, typeof availableSubjects> = {};
            subList.forEach((s) => {
                const clusterName = getSshsClusterForSubject(s.name);
                if (!clusters[clusterName]) clusters[clusterName] = [];
                clusters[clusterName].push(s);
            });
            return clusters;
        }

        // Traditional SHS Grade 12 (DO 8, s. 2015)
        // If TVL track, group by TVL component sector
        if (formData.track === 'TVL') {
            const tvlClusters: Record<string, typeof availableSubjects> = {};
            subList.forEach((s) => {
                const tvlSec = getTvlComponentForSubject(s.name);
                if (!tvlClusters[tvlSec]) tvlClusters[tvlSec] = [];
                tvlClusters[tvlSec].push(s);
            });
            return tvlClusters;
        }

        // For Academic Track (ABM, STEM, HUMSS, GAS), Sports, Arts & Design:
        // Render cleanly in the category grid without redundant sub-cluster headings
        return { '': subList };
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

    const grade11OfferingProgress = useMemo(() => {
        if (!isG11) return [] as { term: 1 | 2 | 3; subjects: string[]; state: 'ready' | 'empty' | 'review' }[];
        const lists = [termMatrixData.term1, termMatrixData.term2, termMatrixData.term3];
        return ([1, 2, 3] as const).map((term, index) => {
            const subjects = lists[index];
            return {
                term,
                subjects,
                state: subjects.length === 0 ? 'empty' : 'ready'
            };
        });
    }, [isG11, termMatrixData]);

    // Existing sections can be audited before the adviser generates school
    // forms.  New sections receive their section-owned offerings on first
    // save, so their learner audit begins after that save.
    const grade11EnrollmentAudit = useMemo(() => {
        const sectionId = section?.id || formData.id;
        if (!isG11 || !sectionId) return null;
        const sectionForAudit: Section = {
            ...(section || {}),
            ...formData,
            id: sectionId,
            section_name: formData.section_name || section?.section_name || '',
            section_grade_level: formData.section_grade_level || section?.section_grade_level || 'Grade 11',
            taught_subjects: activeTaughtList,
            section_metadata: {
                ...(section?.section_metadata || {}),
                ...(formData.section_metadata || {}),
                subjectTerms,
            },
        };
        return auditGrade11ElectiveEnrollment(sectionForAudit, students, subjects);
    }, [isG11, section, formData, activeTaughtList, subjectTerms, students, subjects]);

    const handleSetSubjectTerm = (subjName: string, term: SubjectTermSelection) => {
        if (isGrade11SshsSection()) {
            if (isGrade11CoreName(subjName)) {
                setSubjectTerms(prev => ({ ...prev, [subjName]: 'all' }));
                return;
            }
            const isTechProSubj = getShsSubjectUnitInfo(subjName, 'Grade 11').category === 'techpro_elective';
            if (term === 'all' && !isTechProSubj) {
                showNotification('A Grade 11 Academic elective (80 hours) is offered in one term only (T1, T2, or T3). Tech-Pro electives (320 hours) run across All Terms.', 'info');
                return;
            }
            if (term === 'all' && isTechProSubj) {
                setSubjectTerms(prev => ({ ...prev, [subjName]: 'all' }));
                return;
            }
            if (term === 1 || term === 2 || term === 3) {
                setGrade11ElectiveForTerm(subjName, term);
                return;
            }
        }
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
        if (isGrade11SshsSection()) {
            const isTechProSubj = getShsSubjectUnitInfo(trimmed, 'Grade 11').category === 'techpro_elective';
            if (customSubjTerm === 'all' && !isTechProSubj) {
                showNotification('A Grade 11 Academic elective must be assigned to one term (T1, T2, or T3).', 'error');
                return;
            }
            if (customSubjTerm === 'all' && isTechProSubj) {
                setFormData(prev => ({
                    ...prev,
                    taught_subjects: Array.from(new Set([...(prev.taught_subjects || []), trimmed]))
                }));
                setSubjectTerms(prev => ({ ...prev, [trimmed]: 'all' }));
                setCustomSubjName('');
                setShowAddCustomModal(false);
                showNotification(`Set Tech-Pro elective "${trimmed}" across All Terms (Terms 1–3).`, 'success');
                return;
            }
            setGrade11ElectiveForTerm(trimmed, customSubjTerm as 1 | 2 | 3);
            setCustomSubjName('');
            setShowAddCustomModal(false);
            showNotification(`Set custom elective "${trimmed}" for Term ${customSubjTerm}.`, 'success');
            return;
        }
        setHasExplicitlyClearedTaught(false);
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
        setHasExplicitlyClearedTaught(false);
        const isG11 = formData.section_grade_level?.includes('Grade 11');
        const isG12 = formData.section_grade_level?.includes('Grade 12');
        const grade = (formData.section_grade_level || 'Grade 11') as GradeLevel;

        if (isG11) {
            const coreTerms = createGrade11CoreTerms();
            setSubjectTerms(coreTerms);
            setFormData(prev => ({
                ...prev,
                track: newTrack,
                strand: '',
                cluster: '',
                taught_subjects: [...grade11CoreNames],
                section_metadata: {
                    ...(prev.section_metadata || {}),
                    subjectTerms: coreTerms
                }
            }));
            showNotification('Track changed. Required cores were kept; choose the new cluster and its elective offerings.', 'info');
            return;
        }

        const preset = getCurriculumPreset(grade, newTrack, '', formData.program);
        let nextTaught: string[] = [];
        const newTerms: Record<string, 1 | 2 | 3 | 'all'> = {};

        if (preset && preset.subjects.length > 0) {
            nextTaught = preset.subjects.map(s => s.name);
            preset.subjects.forEach(s => { newTerms[s.name] = s.term; });
        } else if (isG11) {
            nextTaught = SSHS_G11_CORE_SUBJECTS.map(s => s.name);
        } else if (isG12) {
            const templates = getCurriculumTemplatesForSection(grade, formData.program, formData.spa_majors, newTrack, '');
            nextTaught = templates
                .map(t => t.name)
                .filter(name => isSubjectAllowedForProgram(name, grade, formData.program) && isSubjectMatchingSectionTrackAndStrand(name, grade, newTrack, ''));
        }

        if (Object.keys(newTerms).length > 0) {
            setSubjectTerms(prev => ({ ...prev, ...newTerms }));
        }

        setFormData(prev => ({
            ...prev,
            track: newTrack,
            strand: '',
            cluster: '',
            taught_subjects: nextTaught,
            section_metadata: {
                ...(prev.section_metadata || {}),
                subjectTerms: Object.keys(newTerms).length > 0 ? { ...(prev.section_metadata?.subjectTerms || {}), ...newTerms } : prev.section_metadata?.subjectTerms
            }
        }));
    };

    const handleStrandChange = (newStrand: string) => {
        setHasExplicitlyClearedTaught(false);
        const isG11 = formData.section_grade_level?.includes('Grade 11');
        const isG12 = formData.section_grade_level?.includes('Grade 12');
        const grade = (formData.section_grade_level || 'Grade 11') as GradeLevel;

        if (isG11) {
            const coreTerms = createGrade11CoreTerms();
            setSubjectTerms(coreTerms);
            setFormData(prev => ({
                ...prev,
                strand: newStrand,
                cluster: newStrand,
                taught_subjects: [...grade11CoreNames],
                section_metadata: {
                    ...(prev.section_metadata || {}),
                    subjectTerms: coreTerms
                }
            }));
            showNotification('Cluster changed. Required cores were kept; add the elective offerings your section will run.', 'info');
            return;
        }

        const preset = getCurriculumPreset(grade, formData.track, newStrand, formData.program);
        let nextTaught: string[] = [];
        const newTerms: Record<string, 1 | 2 | 3 | 'all'> = {};

        if (preset && preset.subjects.length > 0) {
            nextTaught = preset.subjects.map(s => s.name);
            preset.subjects.forEach(s => { newTerms[s.name] = s.term; });
        } else if (isG11 || isG12) {
            const templates = getCurriculumTemplatesForSection(grade, formData.program, formData.spa_majors, formData.track, newStrand);
            nextTaught = templates
                .map(t => t.name)
                .filter(name => isSubjectAllowedForProgram(name, grade, formData.program) && isSubjectMatchingSectionTrackAndStrand(name, grade, formData.track, newStrand));
        }

        if (Object.keys(newTerms).length > 0) {
            setSubjectTerms(prev => ({ ...prev, ...newTerms }));
        }

        setFormData(prev => ({
            ...prev,
            strand: newStrand,
            cluster: isG11 || formData.track === 'TechPro' ? newStrand : '',
            taught_subjects: nextTaught,
            section_metadata: {
                ...(prev.section_metadata || {}),
                subjectTerms: Object.keys(newTerms).length > 0 ? { ...(prev.section_metadata?.subjectTerms || {}), ...newTerms } : prev.section_metadata?.subjectTerms
            }
        }));
    };

    const handleGradeLevelChange = (newGrade: string) => {
        setHasExplicitlyClearedTaught(false);
        const isNewElem = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'].includes(newGrade);
        let newProgram = formData.program || 'Regular';
        if (isNewElem && ['STE', 'SPA', 'SPJ', 'SPS', 'SPFL', 'SPTVE'].includes(newProgram)) {
            newProgram = 'Regular';
        } else if (!isNewElem && newProgram === 'SSES') {
            newProgram = 'Regular';
        }

        let newTrack = formData.track || '';
        let newStrand = formData.strand || '';
        let newCluster = formData.cluster || '';

        const isG11 = newGrade.includes('Grade 11') || newGrade === '11';
        const isG12 = newGrade.includes('Grade 12') || newGrade === '12';

        if (isG11) {
            // For Grade 11: Only Academic and TechPro are allowed under SSHS (DO 017, s. 2026)
            if (newTrack !== 'Academic' && newTrack !== 'TechPro') {
                newTrack = newTrack === 'TVL' ? 'TechPro' : 'Academic';
            }
            const validClusters = getStrandsForTrack(newTrack, 'Grade 11');
            const currentSelected = newCluster || newStrand;
            if (!validClusters.includes(currentSelected)) {
                newStrand = validClusters[0] || '';
                newCluster = newStrand;
            } else {
                newStrand = currentSelected;
                newCluster = currentSelected;
            }
        } else if (isG12) {
            // Traditional K-12 Grade 12 (DO 8, s. 2015)
            if (newTrack !== 'TechPro') {
                newCluster = '';
            }
        } else {
            // Non-SHS (Elementary / JHS)
            newTrack = '';
            newStrand = '';
            newCluster = '';
        }

        let newTaught = formData.taught_subjects;
        const newTerms: Record<string, 1 | 2 | 3 | 'all'> = {};
        const isAdvisoryClass = formData.is_advisory || !section;
        if (isAdvisoryClass) {
            if (isG11) {
                newTaught = [...grade11CoreNames];
                Object.assign(newTerms, createGrade11CoreTerms());
            } else {
                const preset = getCurriculumPreset(newGrade, newTrack, newStrand || newCluster, newProgram);
                if (preset && preset.subjects.length > 0) {
                    newTaught = preset.subjects.map(s => s.name);
                    preset.subjects.forEach(s => { newTerms[s.name] = s.term; });
                } else {
                    const newGradeDbSubjects = subjects.filter(s => 
                        s.grade_level === newGrade && 
                        !s.is_teaching_load && 
                        !s.section_id &&
                        isSubjectMatchingSectionTrackAndStrand(s.subject_name, newGrade, newTrack, newStrand || newCluster)
                    ).map(s => s.subject_name);
                    let standardSubjs = (STANDARD_SUBJECTS[newGrade as GradeLevel] || []).map(s => s.name);
                    if (isG11) {
                        standardSubjs = SSHS_G11_CORE_SUBJECTS.map(s => s.name);
                    }
                    newTaught = newGradeDbSubjects.length > 0 ? newGradeDbSubjects : standardSubjs;
                }
            }
        }
        if (Object.keys(newTerms).length > 0) {
            setSubjectTerms(prev => ({ ...prev, ...newTerms }));
        }

        setFormData({
            ...formData,
            section_grade_level: newGrade,
            program: newProgram,
            spa_majors: newProgram === 'SPA' ? (formData.spa_majors || []) : [],
            taught_subjects: newTaught,
            track: newTrack,
            strand: newStrand,
            cluster: newCluster,
            section_metadata: {
                ...(formData.section_metadata || {}),
                subjectTerms: Object.keys(newTerms).length > 0 ? { ...(formData.section_metadata?.subjectTerms || {}), ...newTerms } : formData.section_metadata?.subjectTerms
            }
        });
    };

    const syncTaughtSubjectsWithDb = () => {
        setHasExplicitlyClearedTaught(false);
        if (isGrade11SshsSection()) {
            const elected = activeTaughtList.filter(name => !isGrade11CoreName(name));
            const nextTerms: Record<string, SubjectTermSelection> = createGrade11CoreTerms();
            elected.forEach(name => { nextTerms[name] = getGrade11ElectiveTerm(name, subjectTerms); });
            setFormData(prev => ({
                ...prev,
                taught_subjects: [...grade11CoreNames, ...elected],
                section_metadata: { ...(prev.section_metadata || {}), subjectTerms: nextTerms }
            }));
            setSubjectTerms(nextTerms);
            showNotification('Synced the required Grade 11 SSHS Core Subjects without changing elective selections.', 'success');
            return;
        }
        if (existingDbSubjects.length > 0) {
            setFormData(prev => ({
                ...prev,
                taught_subjects: [...existingDbSubjects]
            }));
            showNotification(`Loaded ${existingDbSubjects.length} subjects from Subject Library.`, 'success');
        } else {
            showNotification('No matching subjects found in Subject Library for this section.', 'info');
        }
    };

    const resetTaughtSubjectsToStandard = () => {
        setHasExplicitlyClearedTaught(false);
        if (isGrade11SshsSection()) {
            applyGrade11CoreBaseline();
            showNotification('Restored the 6 required Grade 11 SSHS Core Subjects. Elective selections were cleared.', 'info');
            return;
        }
        if (detectedPreset && detectedPreset.subjects.length > 0) {
            applyDetectedPreset();
            return;
        }
        setFormData(prev => ({
            ...prev,
            taught_subjects: [...standardCurriculumSubjectNames]
        }));
        showNotification('Advisory curriculum reset to standard DepEd subjects.', 'info');
    };

    const clearAllTaughtSubjects = () => {
        if (isGrade11SshsSection()) {
            applyGrade11CoreBaseline();
            showNotification('Cleared elective selections. The 6 required Grade 11 SSHS Core Subjects remain active.', 'info');
            return;
        }
        setHasExplicitlyClearedTaught(true);
        setFormData(prev => ({
            ...prev,
            taught_subjects: []
        }));
        showNotification('Cleared all official curriculum subjects.', 'info');
    };

    const selectAllAvailableSubjects = () => {
        if (isGrade11SshsSection()) {
            showNotification('For Grade 11 SSHS, add the elective offerings your section will run, then enrol each learner in one per term.', 'info');
            return;
        }
        setHasExplicitlyClearedTaught(false);
        const allNames = availableSubjects.map(s => s.name);
        setFormData(prev => ({
            ...prev,
            taught_subjects: allNames
        }));
        showNotification(`Selected all ${allNames.length} available subjects.`, 'success');
    };

    const toggleTaughtSubject = (subjectName: string) => {
        if (isGrade11SshsSection()) {
            if (isGrade11CoreName(subjectName)) {
                showNotification('Grade 11 SSHS Core Subjects are required and cannot be removed.', 'info');
                return;
            }
            const current = formData.taught_subjects || grade11CoreNames;
            if (current.some(name => name.toLowerCase() === subjectName.toLowerCase())) {
                const next = current.filter(name => name.toLowerCase() !== subjectName.toLowerCase());
                setFormData(prev => ({ ...prev, taught_subjects: next }));
                setSubjectTerms(prev => {
                    const updated = { ...prev };
                    delete updated[subjectName];
                    return updated;
                });
            } else {
                setGrade11ElectiveForTerm(subjectName, getGrade11ElectiveTerm(subjectName, subjectTerms));
            }
            return;
        }
        setHasExplicitlyClearedTaught(false);
        const current = activeTaughtList;
        if (current.includes(subjectName)) {
            const next = current.filter(s => s !== subjectName);
            if (next.length === 0) {
                setHasExplicitlyClearedTaught(true);
            }
            setFormData({ ...formData, taught_subjects: next });
        } else {
            setFormData({ ...formData, taught_subjects: [...current, subjectName] });
        }
    };

    const handleRepairSectionOfferings = async () => {
        if (!section?.id) {
            showNotification('Save this new section first, then run the offering repair if needed.', 'info');
            return;
        }
        setIsLoading(true);
        try {
            const result = await repairSectionOwnedSubjectOfferings(section, subjects, { addSubject });
            showNotification(
                result.createdSubjectsCount > 0
                    ? `Repair complete: created ${result.createdSubjectsCount} section-owned offering${result.createdSubjectsCount === 1 ? '' : 's'}. Existing grades and enrolments were not changed.`
                    : 'This section already has its own subject offerings. Nothing was changed.',
                'success'
            );
        } catch (error) {
            console.error('Failed to repair section subject offerings:', error);
            showNotification('Could not repair section offerings. No existing grades or subjects were removed.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const chooseSectionRole = (role: 'advisory' | 'teaching' | 'both') => {
        const isAdvisory = role === 'advisory' || role === 'both';
        const isTeaching = role === 'teaching' || role === 'both';
        setHasExplicitlyClearedTaught(false);

        let nextTaught = formData.taught_subjects || [];
        const newTerms: Record<string, SubjectTermSelection> = {};

        if (isAdvisory && (nextTaught.length === 0 || formData.program === 'Regular')) {
            const grade = formData.section_grade_level || 'Grade 7';
            const isG11 = grade.includes('11');
            if (isG11) {
                nextTaught = [...grade11CoreNames];
                Object.assign(newTerms, createGrade11CoreTerms());
            } else {
                const preset = getCurriculumPreset(grade, formData.track, formData.strand || formData.cluster, formData.program || 'Regular');
                if (preset && preset.subjects.length > 0) {
                    nextTaught = preset.subjects.map(s => s.name);
                    preset.subjects.forEach(s => { newTerms[s.name] = s.term; });
                } else if (defaultCurriculumSubjectNames.length > 0) {
                    nextTaught = defaultCurriculumSubjectNames;
                }
            }
            if (Object.keys(newTerms).length > 0) {
                setSubjectTerms(prev => ({ ...prev, ...newTerms }));
            }
        }

        setFormData(prev => ({
            ...prev,
            is_advisory: isAdvisory,
            is_teaching_load: isTeaching,
            adviser_name: isAdvisory ? (schoolProfile?.adviser_name || user?.displayName || '') : '',
            taught_subjects: isAdvisory ? nextTaught : (prev.taught_subjects || []),
            teaching_subjects: isTeaching ? (prev.teaching_subjects || []) : [],
            section_metadata: {
                ...(prev.section_metadata || {}),
                subjectTerms: Object.keys(newTerms).length > 0
                    ? { ...(prev.section_metadata?.subjectTerms || {}), ...newTerms }
                    : prev.section_metadata?.subjectTerms
            }
        }));
        setActiveSetupPanel(isAdvisory ? 'curriculum' : 'teaching');
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
                const normalized: Record<string, SubjectTermSelection> = {};
                for (const [k, v] of Object.entries(section.section_metadata.subjectTerms)) {
                    normalized[k] = normalizeTermValue(v);
                }
                setSubjectTerms(normalized);
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

        const normalizedSectionName = formData.section_name.trim().toLowerCase();
        const duplicateSection = sections.find(existing =>
            existing.id !== formData.id &&
            existing.section_grade_level === formData.section_grade_level &&
            existing.section_name.trim().toLowerCase() === normalizedSectionName
        );
        if (duplicateSection) {
            showNotification(
                `${formData.section_grade_level} already has a section named "${duplicateSection.section_name}". Use a unique name to keep learners, grades, and forms separated.`,
                'error'
            );
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
                if (hasExplicitlyClearedTaught && currentTaught.length === 0) {
                    finalTaughtSubjects = [];
                } else if (currentTaught.length > 0) {
                    finalTaughtSubjects = currentTaught;
                } else if (section?.taught_subjects && section.taught_subjects.length > 0) {
                    finalTaughtSubjects = section.taught_subjects;
                } else {
                    const preset = getCurriculumPreset(gradeLevel, formData.track, formData.strand || formData.cluster, sectionProgram);
                    if (preset && preset.subjects.length > 0) {
                        finalTaughtSubjects = preset.subjects.map(s => s.name);
                        preset.subjects.forEach(s => {
                            if (!subjectTerms[s.name]) {
                                subjectTerms[s.name] = s.term;
                            }
                        });
                    } else {
                        finalTaughtSubjects = defaultCurriculumSubjectNames;
                    }
                }
            } else {
                finalTaughtSubjects = validTeachingSubjects;
            }

            // Sanitize final taught subjects to only include allowed subjects for this grade & program
            finalTaughtSubjects = finalTaughtSubjects.filter(s => isSubjectAllowedForProgram(s, gradeLevel, sectionProgram));

            // A Grade 11 SSHS section always has the six year-long cores.  It
            // may offer several electives in a term when learners split into
            // different choices; the learner roster enforces one choice per
            // learner in each term.
            let finalSubjectTerms: Record<string, SubjectTermSelection> = { ...subjectTerms };
            if (isG11 && isAdvisory) {
                const electives = finalTaughtSubjects.filter(subjectName => !isGrade11CoreName(subjectName));
                finalTaughtSubjects = [
                    ...grade11CoreNames,
                    ...electives
                ];
                finalSubjectTerms = createGrade11CoreTerms();
                electives.forEach(subjectName => {
                    finalSubjectTerms[subjectName] = getGrade11ElectiveTerm(subjectName, subjectTerms);
                });
                setSubjectTerms(finalSubjectTerms);
            }

            if (isG12 && !isExplicitSSHS) {
                finalTaughtSubjects = finalTaughtSubjects.map(s => normalizeGrade12PESubjectName(s, false));
            }

            if (isG11 || isG12) {
                finalTaughtSubjects = sortSubjects(finalTaughtSubjects, s => s);
            }

            // Ensure every final taught subject has an assigned term in finalSubjectTerms
            finalTaughtSubjects.forEach(sName => {
                if (!isSHS) {
                    finalSubjectTerms[sName] = 'all';
                } else if (finalSubjectTerms[sName] === undefined) {
                    const preset = getCurriculumPreset(gradeLevel, formData.track, formData.strand || formData.cluster, sectionProgram);
                    const match = preset?.subjects.find(s => s.name.toLowerCase() === sName.toLowerCase());
                    finalSubjectTerms[sName] = match?.term ?? 1;
                }
            });

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
                    subjectTerms: finalSubjectTerms
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
                    // A subject in the library is only a reusable definition.
                    // Every official section needs its own offering record so
                    // term settings, teacher work and learner enrolment cannot
                    // be shared with another section of the same grade.
                    const existing = subjects.find(s => 
                        (s.grade_level || '').trim() === sectionData.section_grade_level.trim() &&
                        s.section_id === sectionData.id &&
                        normalizeSubjectName(s.subject_name) === norm
                    );
                    const libraryDefinition = subjects.find(s =>
                        (s.grade_level || '').trim() === sectionData.section_grade_level.trim() &&
                        !s.section_id &&
                        normalizeSubjectName(s.subject_name) === norm
                    );
                    const effTerm = finalSubjectTerms[subName] || (isSHS ? 1 : 'all');
                    const offeredTerms = normalizeOfferedTerms(effTerm);
                    const legacyTerm = offeredTerms.length === 3
                        ? 'all'
                        : offeredTerms.length === 1
                            ? offeredTerms[0]
                            : 'none';
                    if (!existing) {
                        const weights = getDepEdWeightsForSubject(subName, sectionData.section_grade_level, sectionData.track);
                        await addSubject({
                            id: generateUUID(),
                            subject_name: subName,
                            subject_code: libraryDefinition?.subject_code,
                            grade_level: sectionData.section_grade_level,
                            section_id: sectionData.id,
                            term: legacyTerm,
                            offered_terms: offeredTerms,
                            written_weight: libraryDefinition?.written_weight ?? weights.written_weight,
                            performance_weight: libraryDefinition?.performance_weight ?? weights.performance_weight,
                            exam_weight: libraryDefinition?.exam_weight ?? weights.exam_weight,
                            units: libraryDefinition?.units,
                            hours: libraryDefinition?.hours,
                            counts_in_general_average: libraryDefinition?.counts_in_general_average ?? true
                        });
                    } else if (
                        existing.term !== legacyTerm ||
                        JSON.stringify(existing.offered_terms || []) !== JSON.stringify(offeredTerms)
                    ) {
                        await updateSubject({
                            ...existing,
                            term: legacyTerm,
                            offered_terms: offeredTerms
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
                                        let cleanNames: string[] = [];
                                        const newTerms: Record<string, SubjectTermSelection> = {};

                                        if (p === 'Regular') {
                                            const preset = getCurriculumPreset(grade, formData.track, formData.strand || formData.cluster, 'Regular');
                                            if (preset && preset.subjects.length > 0) {
                                                cleanNames = preset.subjects.map(s => s.name);
                                                preset.subjects.forEach(s => { newTerms[s.name] = s.term; });
                                            } else {
                                                cleanNames = (STANDARD_SUBJECTS[grade] || []).map(s => s.name);
                                            }
                                        } else {
                                            const templates = getCurriculumTemplatesForSection(grade, p, p === 'SPA' ? (formData.spa_majors && formData.spa_majors.length > 0 ? formData.spa_majors : Object.keys(SPA_MAJORS)) : []);
                                            cleanNames = templates
                                                .map(t => t.name)
                                                .filter(name => isSubjectAllowedForProgram(name, grade, p));
                                        }

                                        if (Object.keys(newTerms).length > 0) {
                                            setSubjectTerms(prev => ({ ...prev, ...newTerms }));
                                        }

                                        setFormData({
                                            ...formData,
                                            program: p,
                                            taught_subjects: cleanNames,
                                            spa_majors: p === 'SPA' ? (formData.spa_majors && formData.spa_majors.length > 0 ? formData.spa_majors : Object.keys(SPA_MAJORS)) : [],
                                            section_metadata: {
                                                ...(formData.section_metadata || {}),
                                                subjectTerms: Object.keys(newTerms).length > 0
                                                    ? { ...(formData.section_metadata?.subjectTerms || {}), ...newTerms }
                                                    : formData.section_metadata?.subjectTerms
                                            }
                                        });
                                        showNotification(
                                            p === 'Regular'
                                                ? `Applied official DepEd Regular Basic Education (MATATAG) curriculum (${cleanNames.length} subjects loaded).`
                                                : `Curricular program changed to ${p} (${cleanNames.length} official subjects loaded).`,
                                            'info'
                                        );
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
                            <label className="block text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-1 ml-1">How will you use this section?</label>
                            <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mb-4 ml-1">Choose one setup. You can add your personal E-Class subjects after the official advisory curriculum is ready.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => chooseSectionRole('advisory')}
                                    className={`text-left p-4 rounded-2xl transition-all border-2 cursor-pointer ${formData.is_advisory && !formData.is_teaching_load ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-xs' : 'bg-white dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10'}`}
                                >
                                    <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-300 mb-2" />
                                    <p className="text-xs font-black text-slate-800 dark:text-white">My advisory class</p>
                                    <p className="text-[8.5px] text-slate-500 dark:text-slate-400 mt-1">Set official subjects, school forms, and learner grades.</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => chooseSectionRole('teaching')}
                                    className={`text-left p-4 rounded-2xl transition-all border-2 cursor-pointer ${!formData.is_advisory && formData.is_teaching_load ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-xs' : 'bg-white dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10'}`}
                                >
                                    <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-300 mb-2" />
                                    <p className="text-xs font-black text-slate-800 dark:text-white">A class I teach</p>
                                    <p className="text-[8.5px] text-slate-500 dark:text-slate-400 mt-1">Choose only personal E-Class Record and LIR subjects.</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => chooseSectionRole('both')}
                                    className={`text-left p-4 rounded-2xl transition-all border-2 cursor-pointer ${formData.is_advisory && formData.is_teaching_load ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700 shadow-xs' : 'bg-white dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10'}`}
                                >
                                    <Layers className="w-5 h-5 text-violet-600 dark:text-violet-300 mb-2" />
                                    <p className="text-xs font-black text-slate-800 dark:text-white">Both</p>
                                    <p className="text-[8.5px] text-slate-500 dark:text-slate-400 mt-1">Finish the advisory setup first, then choose the subjects you teach.</p>
                                </button>
                            </div>

                            {(formData.is_advisory || formData.is_teaching_load) && (
                                <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-white/10 flex flex-wrap gap-2">
                                    <button type="button" onClick={() => setActiveSetupPanel('details')} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer ${activeSetupPanel === 'details' ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-white/10'}`}>1. Details</button>
                                    {formData.is_advisory && <button type="button" onClick={() => setActiveSetupPanel('curriculum')} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer ${activeSetupPanel === 'curriculum' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-white/10'}`}>2. Official curriculum</button>}
                                    {formData.is_teaching_load && <button type="button" onClick={() => setActiveSetupPanel('teaching')} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer ${activeSetupPanel === 'teaching' ? 'bg-amber-500 text-white' : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-white/10'}`}>{formData.is_advisory ? '3. My E-Class subjects' : '2. My E-Class subjects'}</button>}
                                    <button type="button" onClick={() => setActiveSetupPanel('review')} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer ${activeSetupPanel === 'review' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-white/10'}`}>Review & save</button>
                                </div>
                            )}

                            {/* ADVISORY CURRICULUM PANEL */}
                            {formData.is_advisory && activeSetupPanel === 'curriculum' && (
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
                                                    {isG11 ? 'Grade 11 SSHS Curriculum Plan' : `Official Section Curriculum (${activeTaughtList.length})`}
                                                </label>
                                                {!isG11 && <span className="px-2 py-0.5 rounded-md text-[8.5px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                                                    {formData.program || 'Regular'}
                                                </span>}
                                                {!isG11 && isSHS && (
                                                    <span className="px-2 py-0.5 rounded-md text-[8.5px] font-black bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                                                        3-Term Trimestral
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[9.5px] font-medium text-slate-400 dark:text-slate-500">
                                                {isG11
                                                    ? `6 required cores • elective offerings by term • each learner takes one elective per term • powers school forms`
                                                    : 'Official subjects for this section (powers SF9, SF10, Consolidated Grades, & Grade Slips)'}
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
                                                    {isG11 ? 'Curriculum' : 'Visual Term Matrix'}
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
                                                    {isG11 ? 'Elective Catalog' : 'Catalog Checklist'}
                                                </button>
                                            </div>

                                            {!isG11 && <button
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
                                            </button>}
                                            {!isG11 && existingDbSubjects.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={syncTaughtSubjectsWithDb}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer shadow-xs"
                                                >
                                                    <RefreshCw className="w-3 h-3" />
                                                    Sync DB
                                                </button>
                                            )}
                                            {!isG11 && <button
                                                type="button"
                                                onClick={resetTaughtSubjectsToStandard}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-100 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer shadow-xs"
                                                title={isG11 ? 'Restore the 6 required Core Subjects and clear electives' : 'Reset to official DepEd standard preset'}
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                                {isG11 ? 'Restore Cores' : 'Reset'}
                                            </button>}
                                            <button
                                                type="button"
                                                onClick={clearAllTaughtSubjects}
                                                disabled={activeTaughtList.length === 0}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                                title={isG11 ? 'Clear only Grade 11 SSHS elective selections' : 'Uncheck all subjects in one click'}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                {isG11 ? 'Clear Electives' : 'Clear All'}
                                            </button>
                                        </div>
                                    </div>

                                    {isG11 && (
                                        <div className="mb-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200">Confirm the section offerings</p>
                                                    <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">The six Core Subjects are locked. Add every elective this section will offer, then use Manage Learners in E-Class to place each learner in one elective per term.</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurriculumViewMode('catalog')}
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider cursor-pointer"
                                                >
                                                    <Layers className="w-3.5 h-3.5" /> Choose electives
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                {grade11OfferingProgress.map(({ term, subjects, state }) => (
                                                    <div key={term} className={`rounded-xl border px-3 py-2.5 ${
                                                        state === 'ready'
                                                            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
                                                            : state === 'review'
                                                                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
                                                                : 'bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10'
                                                    }`}>
                                                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-500">Term {term}</p>
                                                        <p className="text-[10px] font-bold mt-1 text-slate-800 dark:text-slate-100 truncate">
                                                            {state === 'ready' ? `${subjects.length} elective offering${subjects.length === 1 ? '' : 's'}` : 'No elective offering yet'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Detected Official DepEd Preset Banner */}
                                    {!isG11 && detectedPreset && (
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
                                                        {isG11 ? 'Grade 11 SSHS Offering Plan' : detectedPreset.label}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                        {isG11
                                                            ? <>6 required Core Subjects (Terms 1–3) + <span className="font-bold text-slate-700 dark:text-slate-300">adviser-selected elective offerings</span>. A learner is enrolled in one elective per term; the cluster list is a catalog, not an automatic roster.</>
                                                            : <>{detectedPreset.description} • <span className="font-bold text-slate-700 dark:text-slate-300">{detectedPreset.subjects.length} official subjects</span> ({detectedPreset.termStructure || (isSHS ? '3 Terms (Trimester)' : '3 Terms (Whole-Year)')})</>}
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
                                                        {isG11
                                                            ? 'Restore 6 Required Cores'
                                                            : (isPresetActive ? 'Re-Apply DepEd Preset' : `1-Click Apply (${detectedPreset.subjects.length} Subjects)`)}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Visual Term Matrix View */}
                                    {curriculumViewMode === 'matrix' && (
                                        <div className="space-y-4">
                                            {activeTaughtList.length === 0 ? (
                                                <div className="text-center py-12 px-4 bg-white/70 dark:bg-[#0d1225]/70 border-2 border-dashed border-slate-200/80 dark:border-white/10 rounded-2xl">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                                                        <BookOpen className="w-6 h-6" />
                                                    </div>
                                                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-1">
                                                        No Subjects Assigned to Curriculum
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto mb-4">
                                                        {detectedPreset 
                                                            ? (isG11
                                                                ? 'Restore the 6 required Core Subjects, then add the elective offerings this section will run in each term.'
                                                                : `All subjects have been cleared. Click below to load the official ${detectedPreset.label} (${detectedPreset.subjects.length} subjects), or switch to "Catalog Checklist" to pick specific subjects.`)
                                                            : 'All subjects have been cleared. Switch to "Catalog Checklist" above to select subjects for this section or add custom electives.'}
                                                    </p>
                                                    {detectedPreset && (
                                                        <button
                                                            type="button"
                                                            onClick={applyDetectedPreset}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-500/20 active:scale-95"
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                            {isG11 ? 'Restore 6 Required Core Subjects' : `Apply ${detectedPreset.label} (${detectedPreset.subjects.length} Subjects)`}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : !isSHS ? (
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
                                                                                    {isG11 ? 'Required in Term 1, Term 2, and Term 3' : `All Terms · WW ${weights.written_weight}% · PT ${weights.performance_weight}% · QA ${weights.exam_weight}%`}
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-1 shrink-0">
                                                                                {isG11 ? (
                                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[8px] font-black bg-indigo-600 text-white">
                                                                                        <Shield className="w-3 h-3" /> Required T1–T3
                                                                                    </span>
                                                                                ) : (['all', 1, 2, 3] as const).map(t => (
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
                                                                                {!isG11 && <button
                                                                                    type="button"
                                                                                    onClick={() => toggleTaughtSubject(subjName)}
                                                                                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                                                                    title="Remove from curriculum"
                                                                                >
                                                                                    <X className="w-3.5 h-3.5" />
                                                                                </button>}
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
                                                                            {isG11 ? `(${list.length} elective offering${list.length === 1 ? '' : 's'})` : `(${list.length} ${list.length === 1 ? 'subject' : 'subjects'})`}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (isG11) {
                                                                                setCurriculumViewMode('catalog');
                                                                            } else {
                                                                                setCustomSubjTerm(termNum);
                                                                                setShowAddCustomModal(true);
                                                                            }
                                                                        }}
                                                                        className="p-1 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-white/10 text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                                                                        title={isG11 ? `Add an elective offering for ${title}` : `Add subject to ${title}`}
                                                                    >
                                                                        <Plus className="w-3 h-3" />
                                                                        <span className="text-[8px] uppercase">{isG11 ? 'Choose' : 'Add'}</span>
                                                                    </button>
                                                                </div>

                                                                {/* Column Subject Cards */}
                                                                <div className="space-y-2 flex-1">
                                                                    {list.length === 0 ? (
                                                                        <div className="flex flex-col items-center justify-center h-24 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-2">
                                                                            <span className="text-[9px] font-bold text-slate-400">{isG11 ? `Add elective offerings for ${title}` : `No electives for ${title}`}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    if (isG11) {
                                                                                        setCurriculumViewMode('catalog');
                                                                                    } else {
                                                                                        setCustomSubjTerm(termNum);
                                                                                        setShowAddCustomModal(true);
                                                                                    }
                                                                                }}
                                                                                className="text-[8.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-1 cursor-pointer"
                                                                            >
                                                                                {isG11 ? 'Choose from Catalog' : '+ Add Course'}
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
                                                                                                {isG11 ? `Candidate for Term ${termNum}` : `WW ${weights.written_weight}% · PT ${weights.performance_weight}% · QA ${weights.exam_weight}%`}
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

                                                                                    {isG11 && list.length > 1 && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => setGrade11ElectiveForTerm(subjName, termNum)}
                                                                                            className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-white py-1.5 text-[8px] font-black uppercase tracking-wider cursor-pointer"
                                                                                        >
                                                                                            Keep this as Term {termNum} elective
                                                                                        </button>
                                                                                    )}

                                                                                    {/* Term Switcher Pills */}
                                                                                    {!isG11 && <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
                                                                                        <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-400">Term:</span>
                                                                                        <div className="flex items-center gap-1">
                                                                                            {(isG11 ? [1, 2, 3] : ['all', 1, 2, 3] as const).map(t => (
                                                                                                <button
                                                                                                    key={t}
                                                                                                    type="button"
                                                                                                    onClick={() => handleSetSubjectTerm(subjName, t as 1 | 2 | 3 | 'all')}
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
                                                                                    </div>}
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
                                            {isG11 && (
                                                <div className="mb-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-[9.5px] text-slate-600 dark:text-slate-300">
                                                    <span className="font-black text-indigo-700 dark:text-indigo-300">Set up offerings first:</span> select a term button for every elective this section will run. Core Subjects cannot be changed; use Manage Learners in E-Class so each learner belongs to one elective in that term.
                                                </div>
                                            )}
                                            {/* Search filter & Quick Actions Toolbar */}
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3">
                                                <div className="relative flex-1">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search subjects in catalog..."
                                                        value={subjectSearchFilter}
                                                        onChange={(e) => setSubjectSearchFilter(e.target.value)}
                                                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-300"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200/50 dark:border-white/5">
                                                        {availableSubjects.length} relevant subject{availableSubjects.length === 1 ? '' : 's'}
                                                    </span>
                                                    {!isG11 && (
                                                    <button
                                                        type="button"
                                                        onClick={selectAllAvailableSubjects}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 rounded-xl text-[9px] font-bold transition-all cursor-pointer shadow-xs"
                                                        title="Select all relevant subjects for this section"
                                                    >
                                                        <CheckSquare className="w-3 h-3" />
                                                        Select All
                                                    </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={clearAllTaughtSubjects}
                                                        disabled={activeTaughtList.length === 0}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 rounded-xl text-[9px] font-bold transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                                        title="Uncheck all subjects"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        {isG11 ? 'Clear Electives' : 'Clear All'}
                                                    </button>
                                                </div>
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
                                                                    {!isG11 && <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider select-none shrink-0 pl-4">
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
                                                                    </div>}
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
                                                                                    const isGrade11Core = isG11 && isGrade11CoreName(subj.name);

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

                                                                                            {/* Grade 11 cores are locked across all three terms. */}
                                                                                            {isG11 && isGrade11Core && (
                                                                                                <span className="text-[7.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300 shrink-0">Required T1–T3</span>
                                                                                            )}
                                                                                            {isG11 && !isSelected && !isGrade11Core && (
                                                                                                <div className="flex items-center gap-1 shrink-0" onClick={event => event.stopPropagation()}>
                                                                                                    {getShsSubjectUnitInfo(subj.name, 'Grade 11').category === 'techpro_elective' ? (
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={() => handleSetSubjectTerm(subj.name, 'all')}
                                                                                                            className="px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                                                                                                            title="Offer across All Terms (Terms 1–3)"
                                                                                                        >
                                                                                                            All
                                                                                                        </button>
                                                                                                    ) : (
                                                                                                        ([1, 2, 3] as const).map(term => (
                                                                                                            <button
                                                                                                                key={term}
                                                                                                                type="button"
                                                                                                                onClick={() => setGrade11ElectiveForTerm(subj.name, term)}
                                                                                                                className="px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                                                                                                                title={`Set as the Term ${term} elective`}
                                                                                                            >
                                                                                                                T{term}
                                                                                                            </button>
                                                                                                        ))
                                                                                                    )}
                                                                                                </div>
                                                                                            )}
                                                                                            {/* Inline offering term selector for SHS subjects */}
                                                                                            {isSHS && isSelected && !isGrade11Core && (
                                                                                                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                                                                                    {(() => {
                                                                                                        const isTechPro = isG11 && getShsSubjectUnitInfo(subj.name, 'Grade 11').category === 'techpro_elective';
                                                                                                        const isWorkImmersion = subj.name.toLowerCase().includes('work immersion');
                                                                                                        const termOptions: SubjectTermSelection[] = isG11
                                                                                                            ? (isTechPro ? ['all', 1, 2, 3] : [1, 2, 3])
                                                                                                            : (isWorkImmersion ? ['all', 1, 2, 3, '1,2', '2,3'] : ['all', 1, 2, 3]);

                                                                                                        return termOptions.map(t => (
                                                                                                            <button
                                                                                                                key={String(t)}
                                                                                                                type="button"
                                                                                                                onClick={() => handleSetSubjectTerm(subj.name, t)}
                                                                                                                className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-all cursor-pointer ${
                                                                                                                    effTerm === t
                                                                                                                        ? 'bg-indigo-600 text-white shadow-xs'
                                                                                                                        : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20'
                                                                                                                }`}
                                                                                                                title={`Offer in ${t === 'all' ? 'All Terms' : typeof t === 'string' && t.includes(',') ? `Terms ${t}` : `Term ${t}`}`}
                                                                                                            >
                                                                                                                {t === 'all' ? 'All' : typeof t === 'string' && t.includes(',') ? `T${t}` : `T${t}`}
                                                                                                            </button>
                                                                                                        ));
                                                                                                    })()}
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
                            {formData.is_teaching_load && activeSetupPanel === 'teaching' && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 'auto' }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-6 border-t border-slate-100 dark:border-white/10 pt-6"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 ml-1">
                                        <div>
                                            <label className="block text-[9px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest">
                                                My E-Class Record subjects ({formData.teaching_subjects?.length || 0})
                                            </label>
                                            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                                                Choose only subjects you personally teach. This does not change SF9, SF10, or grade slips.
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

                            {activeSetupPanel === 'review' && (formData.is_advisory || formData.is_teaching_load) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 border-t border-slate-100 dark:border-white/10 pt-6"
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white">Review this section</h4>
                                            <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">Confirm what powers official school forms and what only opens your personal E-Class Record.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {formData.is_advisory && (
                                            <div className="rounded-2xl p-4 border border-indigo-200/70 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/20">
                                                <p className="text-[9px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Official advisory setup</p>
                                                <p className="text-xs font-black text-slate-900 dark:text-white mt-1">{activeTaughtList.length} official subject{activeTaughtList.length === 1 ? '' : 's'}</p>
                                                <p className="text-[8.5px] text-slate-500 dark:text-slate-400 mt-1">Used by SF9, SF10, consolidated grades, and grade slips.</p>
                                                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
                                                    <button type="button" onClick={() => setActiveSetupPanel('curriculum')} className="text-[8.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300 hover:underline cursor-pointer">Edit official curriculum</button>
                                                    {section?.id && <button type="button" onClick={() => void handleRepairSectionOfferings()} disabled={isLoading} className="text-[8.5px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-300 hover:underline cursor-pointer disabled:opacity-50">Repair subject offerings</button>}
                                                </div>
                                            </div>
                                        )}
                                        {formData.is_teaching_load && (
                                            <div className="rounded-2xl p-4 border border-amber-200/70 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
                                                <p className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">My teaching assignment</p>
                                                <p className="text-xs font-black text-slate-900 dark:text-white mt-1">{formData.teaching_subjects?.length || 0} E-Class subject{(formData.teaching_subjects?.length || 0) === 1 ? '' : 's'}</p>
                                                <p className="text-[8.5px] text-slate-500 dark:text-slate-400 mt-1">Used only by your E-Class Record and LIR; it does not alter school forms.</p>
                                                <button type="button" onClick={() => setActiveSetupPanel('teaching')} className="mt-3 text-[8.5px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-300 hover:underline cursor-pointer">Edit my E-Class subjects</button>
                                            </div>
                                        )}
                                    </div>

                                    {isG11 && (
                                        <div className="mt-4 rounded-2xl p-4 border border-violet-200/80 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-950/20">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-300">Grade 11 elective enrollment check</p>
                                                    <p className="text-[8.5px] text-slate-500 dark:text-slate-400 mt-1">A section may offer several electives. Each learner must belong to exactly one offered elective in each term.</p>
                                                </div>
                                                {formData.is_teaching_load && (
                                                    <button type="button" onClick={() => setActiveSetupPanel('teaching')} className="shrink-0 text-[8.5px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-300 hover:underline cursor-pointer">Open E-Class setup</button>
                                                )}
                                            </div>

                                            {!grade11EnrollmentAudit ? (
                                                <p className="mt-3 text-[9px] font-bold text-slate-500 dark:text-slate-400">Save this new section first. FormEase will create its section-owned offerings, then this check can review learner choices.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                                                    {grade11EnrollmentAudit.map(({ term, offeredSubjects, missingLearnerLrns, conflictingLearnerLrns }) => {
                                                        const hasIssues = missingLearnerLrns.length > 0 || conflictingLearnerLrns.length > 0;
                                                        return (
                                                            <div key={term} className={`rounded-xl border p-3 ${hasIssues ? 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-200 dark:border-amber-800/50' : 'bg-white/80 dark:bg-white/5 border-emerald-200 dark:border-emerald-800/50'}`}>
                                                                <p className="text-[8px] font-black uppercase tracking-wider text-slate-500">Term {term}</p>
                                                                {offeredSubjects.length === 0 ? (
                                                                    <p className="mt-1 text-[9px] font-bold text-slate-500 dark:text-slate-400">No elective offering set</p>
                                                                ) : hasIssues ? (
                                                                    <div className="mt-1.5 space-y-1 text-[8.5px] font-bold text-amber-800 dark:text-amber-200">
                                                                        {missingLearnerLrns.length > 0 && <p>{missingLearnerLrns.length} learner{missingLearnerLrns.length === 1 ? '' : 's'} need a choice</p>}
                                                                        {conflictingLearnerLrns.length > 0 && <p>{conflictingLearnerLrns.length} learner{conflictingLearnerLrns.length === 1 ? '' : 's'} have multiple choices</p>}
                                                                    </div>
                                                                ) : (
                                                                    <p className="mt-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">All learners assigned once</p>
                                                                )}
                                                                <p className="mt-1.5 text-[8px] text-slate-400 truncate" title={offeredSubjects.map(subject => subject.subject_name).join(', ')}>{offeredSubjects.map(subject => subject.subject_name).join(', ') || 'Add an offering in Curriculum'}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
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

                        {/* Adviser / Teacher (shown while reviewing, not repeated in every setup panel) */}
                        {(activeSetupPanel === 'details' || activeSetupPanel === 'review') && <div className="col-span-2">
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
                        </div>}
                    </div>

                    {/* Role reminder */}
                    {activeSetupPanel === 'review' && <div className="flex gap-4 p-4 bg-blue-50/50 dark:bg-blue-950/40 rounded-2.5xl border border-blue-100/50 dark:border-blue-800/40">
                        <AlertCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[9px] font-black text-blue-700 dark:text-blue-300 leading-relaxed uppercase tracking-tighter">
                            Advisory classes will appear in official SF forms, while teaching roles are for Grade management and E-Class Record.
                        </p>
                    </div>}

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
