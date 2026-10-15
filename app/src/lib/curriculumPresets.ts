/**
 * DepEd Curriculum Presets Engine — FormEase Pro
 * 
 * Central deterministic source of truth for all official Department of Education (DepEd)
 * curriculum rosters, offering terms, unit credits, and assessment weights.
 * 
 * Governed by:
 * - DepEd Order No. 8, s. 2015 (Classroom Assessment & Component Weights: WW, PT, QA)
 * - DepEd Order No. 10, s. 2024 (MATATAG Curriculum Rollout for K, G1-3, G4, G7)
 * - DepEd Order No. 15, s. 2026 (SY 2026-2027 Transmutation Table 4 & Unified Academic Awards)
 * - DepEd Order No. 017, s. 2026 (Strengthened Senior High School - SSHS Pilot Grade 11)
 * - DepEd Order No. 51, s. 2004 & DO 41, s. 2017 (Madrasah / ALIVE Non-Graded Policy)
 * 
 * UNIVERSAL 3-TERM MODEL (SY 2026-2027 onward):
 * - All grade levels operate on 3 Terms (Term 1, Term 2, Term 3).
 * - Quarters (1-4) exist strictly in retrospective SF10 historical records for pre-2026 school years.
 */

export type DepEdWeightCategory =
    | 'Languages'
    | 'MathScience'
    | 'MAPEH'
    | 'TLE_EPP'
    | 'SHSCore'
    | 'SHSAcademic'
    | 'SHSAcademicMathSci'
    | 'SHSAcademicHumanities'
    | 'SHSFieldExposure'
    | 'SHSResearch'
    | 'SHSTechPro'
    | 'SHSTVL'
    | 'SHSImmersion'
    | 'Immersion'
    | 'G12Core'
    | 'G12AcademicOther'
    | 'G12AcademicImmersionResearch'
    | 'G12TVL';

export interface PresetSubjectItem {
    name: string;
    code?: string;
    term: 1 | 2 | 3 | 'all';
    category: 'Core' | 'Applied' | 'Specialized' | 'Academic Elective' | 'TechPro Elective' | 'Program Elective' | 'Learning Area';
    weightCategory: DepEdWeightCategory;
    written_weight: number;
    performance_weight: number;
    exam_weight: number;
    units?: number;
    hoursPerYear?: number;
    counts_in_general_average?: boolean;
    is_component?: boolean;
    parent_name?: string;
}

export interface CurriculumPreset {
    id: string;
    label: string;
    description: string;
    gradeLevel: string;
    curriculumType: 'MATATAG' | 'K-12' | 'SSHS';
    depedOrder?: string;
    termStructure?: string;
    track?: 'Academic' | 'Technical-Professional' | 'TVL' | 'Sports' | 'Arts';
    strandOrCluster?: string;
    program?: 'Regular' | 'STE' | 'SPSTEM' | 'SPA' | 'SPS' | 'SPJ' | 'SPFL' | 'SPTVE' | 'SSES' | 'ALIVE';
    subjects: PresetSubjectItem[];
}

/**
 * Standard DepEd Assessment Weight Profiles (DO 15, s. 2026 / DO 17, s. 2026 / DO 8, s. 2015)
 * Official weights under DepEd Order No. 015, s. 2026 (effective SY 2026–2027)
 */
export const DEPED_WEIGHT_PROFILES = {
    // Elementary & JHS (Grades 4 to 10 - DO 15, s. 2026)
    // Core Learning Areas (Languages, AP, EsP/Values, GMRC, Mathematics, Science): 20% WW, 50% PT, 30% EX
    Languages: { written_weight: 20, performance_weight: 50, exam_weight: 30 },
    MathScience: { written_weight: 20, performance_weight: 50, exam_weight: 30 },
    // Other Learning Areas (EPP/TLE, MAPEH): 20% WW, 60% PT, 20% EX
    MAPEH: { written_weight: 20, performance_weight: 60, exam_weight: 20 },
    TLE_EPP: { written_weight: 20, performance_weight: 60, exam_weight: 20 },

    // Senior High School (Grades 11 & 12 under DO 15, s. 2026 / SSHS)
    // Core Subjects & Other Academic Electives: 20% WW, 50% PT, 30% EX
    SHSCore: { written_weight: 20, performance_weight: 50, exam_weight: 30 },
    SHSAcademic: { written_weight: 20, performance_weight: 50, exam_weight: 30 },
    SHSAcademicMathSci: { written_weight: 20, performance_weight: 50, exam_weight: 30 },
    SHSAcademicHumanities: { written_weight: 20, performance_weight: 50, exam_weight: 30 },
    // Field Exposure, Arts Apprenticeship, Creative Production: 15% WW, 70% PT, 15% EX
    SHSFieldExposure: { written_weight: 15, performance_weight: 70, exam_weight: 15 },
    // Research Electives, Design and Innovation: 40% WW, 60% PT, 0% EX
    SHSResearch: { written_weight: 40, performance_weight: 60, exam_weight: 0 },
    // Work Immersion: 20% WW, 80% PT, 0% EX
    SHSImmersion: { written_weight: 20, performance_weight: 80, exam_weight: 0 },
    // Technical-Professional Electives: 15% WW, 65% PT, 20% EX
    SHSTechPro: { written_weight: 15, performance_weight: 65, exam_weight: 20 },
    // TVL Practical Skills: 20% WW, 60% PT, 20% EX
    SHSTVL: { written_weight: 20, performance_weight: 60, exam_weight: 20 },

    // Grade 12 Old K-12 Transitional Weights (DO 8, s. 2015)
    G12Core: { written_weight: 25, performance_weight: 50, exam_weight: 25 },
    G12AcademicOther: { written_weight: 25, performance_weight: 45, exam_weight: 30 },
    G12AcademicImmersionResearch: { written_weight: 35, performance_weight: 40, exam_weight: 25 },
    G12TVL: { written_weight: 20, performance_weight: 60, exam_weight: 20 }
} as const;

// ---------------------------------------------------------------------------
// 1. ELEMENTARY SCHOOL PRESETS (Kindergarten to Grade 6)
// ---------------------------------------------------------------------------

export const KINDERGARTEN_PRESET: CurriculumPreset = {
    id: 'elem-kinder-matatag',
    label: 'Kindergarten (MATATAG)',
    description: 'Foundational Developmental Domains under DO 10, s. 2024',
    gradeLevel: 'Kindergarten',
    curriculumType: 'MATATAG',
    program: 'Regular',
    subjects: [
        { name: 'Emerging Literacy and Language', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'Mathematics and Numeracy', term: 'all', category: 'Learning Area', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience },
        { name: 'Socio-Emotional and Values Development', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'Physical Health and Motor Development', term: 'all', category: 'Learning Area', weightCategory: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH },
        { name: 'Creative Expression and Aesthetic Development', term: 'all', category: 'Learning Area', weightCategory: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH }
    ]
};

export const GRADE_1_MATATAG_PRESET: CurriculumPreset = {
    id: 'elem-g1-matatag',
    label: 'Grade 1 (MATATAG 5 Learning Areas)',
    description: 'Decongested foundational curriculum (DO 10, s. 2024)',
    gradeLevel: 'Grade 1',
    curriculumType: 'MATATAG',
    program: 'Regular',
    subjects: [
        { name: 'Language', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'Reading and Literacy', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'Mathematics', term: 'all', category: 'Learning Area', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience },
        { name: 'Makabansa', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'GMRC (Good Manners and Right Conduct)', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages }
    ]
};

export const GRADE_2_MATATAG_PRESET: CurriculumPreset = {
    id: 'elem-g2-matatag',
    label: 'Grade 2 (MATATAG 5 Learning Areas)',
    description: 'Transition to formal English and Filipino with Makabansa & GMRC',
    gradeLevel: 'Grade 2',
    curriculumType: 'MATATAG',
    program: 'Regular',
    subjects: [
        { name: 'Filipino', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'English', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'Mathematics', term: 'all', category: 'Learning Area', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience },
        { name: 'Makabansa', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'GMRC (Good Manners and Right Conduct)', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages }
    ]
};

export const GRADE_3_MATATAG_PRESET: CurriculumPreset = {
    id: 'elem-g3-matatag',
    label: 'Grade 3 (MATATAG 6 Learning Areas)',
    description: 'Adds formal Science to the Grade 2 foundational roster',
    gradeLevel: 'Grade 3',
    curriculumType: 'MATATAG',
    program: 'Regular',
    subjects: [
        { name: 'Filipino', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'English', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'Mathematics', term: 'all', category: 'Learning Area', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience },
        { name: 'Science', term: 'all', category: 'Learning Area', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience },
        { name: 'Makabansa', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'GMRC (Good Manners and Right Conduct)', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages }
    ]
};

const createElementaryUpperPreset = (grade: 'Grade 4' | 'Grade 5' | 'Grade 6'): CurriculumPreset => ({
    id: `elem-${grade.toLowerCase().replace(' ', '')}-standard`,
    label: `${grade} (Standard 8 Learning Areas)`,
    description: 'Complete 8 learning areas with EPP and MAPEH components',
    gradeLevel: grade,
    curriculumType: 'MATATAG',
    program: 'Regular',
    subjects: [
        { name: 'Filipino', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'English', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'Mathematics', term: 'all', category: 'Learning Area', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience },
        { name: 'Science', term: 'all', category: 'Learning Area', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience },
        { name: 'Araling Panlipunan (AP)', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'GMRC (Good Manners and Right Conduct)', term: 'all', category: 'Learning Area', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
        { name: 'E.P.P.', term: 'all', category: 'Learning Area', weightCategory: 'TLE_EPP', ...DEPED_WEIGHT_PROFILES.TLE_EPP },
        { name: 'MAPEH', term: 'all', category: 'Learning Area', weightCategory: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH },
        { name: 'Music and Arts', term: 'all', category: 'Learning Area', weightCategory: 'MAPEH', is_component: true, parent_name: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH },
        { name: 'Physical Education and Health', term: 'all', category: 'Learning Area', weightCategory: 'MAPEH', is_component: true, parent_name: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH }
    ]
});

// ---------------------------------------------------------------------------
// 2. JUNIOR HIGH SCHOOL PRESETS (Grades 7 to 10)
// ---------------------------------------------------------------------------

const getJHSStandardCoreSubjects = (): PresetSubjectItem[] => [
    { name: 'Filipino', term: 'all', category: 'Core', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
    { name: 'English', term: 'all', category: 'Core', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
    { name: 'Mathematics', term: 'all', category: 'Core', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience },
    { name: 'Science', term: 'all', category: 'Core', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience },
    { name: 'Araling Panlipunan (AP)', term: 'all', category: 'Core', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
    { name: 'Values Education', term: 'all', category: 'Core', weightCategory: 'Languages', ...DEPED_WEIGHT_PROFILES.Languages },
    { name: 'Technology and Livelihood Education (TLE)', term: 'all', category: 'Core', weightCategory: 'TLE_EPP', ...DEPED_WEIGHT_PROFILES.TLE_EPP },
    { name: 'MAPEH', term: 'all', category: 'Core', weightCategory: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH },
    { name: 'Music and Arts', term: 'all', category: 'Core', weightCategory: 'MAPEH', is_component: true, parent_name: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH },
    { name: 'Physical Education and Health', term: 'all', category: 'Core', weightCategory: 'MAPEH', is_component: true, parent_name: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH }
];

const createJHSRegularPreset = (grade: 'Grade 7' | 'Grade 8' | 'Grade 9' | 'Grade 10'): CurriculumPreset => ({
    id: `jhs-${grade.toLowerCase().replace(' ', '')}-regular`,
    label: `${grade} (Regular 8 Core Subjects)`,
    description: 'Standard DepEd Junior High School Curriculum',
    gradeLevel: grade,
    curriculumType: 'K-12',
    program: 'Regular',
    subjects: getJHSStandardCoreSubjects()
});

const createJHSSTEPreset = (grade: 'Grade 7' | 'Grade 8' | 'Grade 9' | 'Grade 10'): CurriculumPreset => {
    const electivesByGrade: Record<string, PresetSubjectItem[]> = {
        'Grade 7': [
            { name: 'Environmental Science', term: 'all', category: 'Program Elective', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience },
            { name: 'Research I', term: 'all', category: 'Program Elective', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience }
        ],
        'Grade 8': [
            { name: 'Biotechnology', term: 'all', category: 'Program Elective', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience },
            { name: 'Research II', term: 'all', category: 'Program Elective', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience }
        ],
        'Grade 9': [
            { name: 'Consumer Chemistry', term: 'all', category: 'Program Elective', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience },
            { name: 'Research III', term: 'all', category: 'Program Elective', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience }
        ],
        'Grade 10': [
            { name: 'Electronics and Robotics', term: 'all', category: 'Program Elective', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience },
            { name: 'Research IV', term: 'all', category: 'Program Elective', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience }
        ]
    };

    return {
        id: `jhs-${grade.toLowerCase().replace(' ', '')}-ste`,
        label: `${grade} STE / SPSTEM Special Program`,
        description: 'Standard 8 Core Subjects + DepEd DO 55, s. 2010 Science & Research Electives',
        gradeLevel: grade,
        curriculumType: 'K-12',
        program: 'STE',
        subjects: [
            ...getJHSStandardCoreSubjects(),
            ...(electivesByGrade[grade] || [])
        ]
    };
};

// ---------------------------------------------------------------------------
// 3. SENIOR HIGH SCHOOL GRADE 11 (SSHS Pilot — DepEd Order No. 017, s. 2026)
// ---------------------------------------------------------------------------

/**
 * All Grade 11 sections under SSHS take exactly these 6 Core Subjects spanning all 3 terms.
 * Each core subject earns 2 units per term = 6 units/year (80 hours/year).
 */
export const SSHS_G11_CORE_SUBJECTS: PresetSubjectItem[] = [
    { name: 'Effective Communication', term: 'all', category: 'Core', weightCategory: 'SHSCore', units: 2, hoursPerYear: 160, ...DEPED_WEIGHT_PROFILES.SHSCore },
    { name: 'Mabisang Komunikasyon', term: 'all', category: 'Core', weightCategory: 'SHSCore', units: 2, hoursPerYear: 160, ...DEPED_WEIGHT_PROFILES.SHSCore },
    { name: 'General Mathematics', term: 'all', category: 'Core', weightCategory: 'SHSCore', units: 2, hoursPerYear: 160, ...DEPED_WEIGHT_PROFILES.SHSCore },
    { name: 'General Science', term: 'all', category: 'Core', weightCategory: 'SHSCore', units: 2, hoursPerYear: 160, ...DEPED_WEIGHT_PROFILES.SHSCore },
    { name: 'Life and Career Skills', term: 'all', category: 'Core', weightCategory: 'SHSCore', units: 2, hoursPerYear: 160, ...DEPED_WEIGHT_PROFILES.SHSCore },
    { name: 'Pag-aaral ng Kasaysayan at Lipunang Pilipino', term: 'all', category: 'Core', weightCategory: 'SHSCore', units: 2, hoursPerYear: 160, ...DEPED_WEIGHT_PROFILES.SHSCore }
];

export const SSHS_G11_STEM_PRESET: CurriculumPreset = {
    id: 'sshs-g11-stem',
    label: 'Grade 11 SSHS STEM (Science, Technology, Engineering, and Mathematics)',
    description: '5 Core Subjects (Terms 1–3, 30 units) + 3 Term-Sequenced STEM Electives (1 per term, 9 units = 39 units/yr)',
    gradeLevel: 'Grade 11',
    curriculumType: 'SSHS',
    track: 'Academic',
    strandOrCluster: 'Science, Technology, Engineering, and Mathematics',
    program: 'Regular',
    subjects: [
        ...SSHS_G11_CORE_SUBJECTS,
        { name: 'Pre-Calculus', term: 1, category: 'Academic Elective', weightCategory: 'SHSAcademicMathSci', units: 3, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci },
        { name: 'Basic Calculus', term: 2, category: 'Academic Elective', weightCategory: 'SHSAcademicMathSci', units: 3, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci },
        { name: 'Chemistry 1', term: 3, category: 'Academic Elective', weightCategory: 'SHSAcademicMathSci', units: 3, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci }
    ]
};

export const SSHS_G11_ABM_PRESET: CurriculumPreset = {
    id: 'sshs-g11-abm',
    label: 'Grade 11 SSHS Business & Entrepreneurship (ABM)',
    description: '5 Core Subjects (Terms 1–3, 30 units) + 3 Business Sequence Electives (1 per term, 9 units = 39 units/yr)',
    gradeLevel: 'Grade 11',
    curriculumType: 'SSHS',
    track: 'Academic',
    strandOrCluster: 'Business and Entrepreneurship',
    program: 'Regular',
    subjects: [
        ...SSHS_G11_CORE_SUBJECTS,
        { name: 'Business 1 (Basic Accounting)', term: 1, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Business 2 (Business Finance and Income Taxation)', term: 2, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Business 3 (Business Economics)', term: 3, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities }
    ]
};

export const SSHS_G11_HUMSS_PRESET: CurriculumPreset = {
    id: 'sshs-g11-humss',
    label: 'Grade 11 SSHS Arts, Social Sciences, and Humanities (HUMSS)',
    description: '5 Core Subjects (Terms 1–3, 30 units) + 3 Humanities & Social Sciences Electives (1 per term, 9 units = 39 units/yr)',
    gradeLevel: 'Grade 11',
    curriculumType: 'SSHS',
    track: 'Academic',
    strandOrCluster: 'Arts, Social Sciences, and Humanities',
    program: 'Regular',
    subjects: [
        ...SSHS_G11_CORE_SUBJECTS,
        { name: 'Philippine Governance (Philippine Politics and Governance)', term: 1, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Social Sciences (Theory and Practice)', term: 2, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Introduction to the Philosophy of the Human Person', term: 3, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities }
    ]
};

export const SSHS_G11_TECHPRO_ICT_PRESET: CurriculumPreset = {
    id: 'sshs-g11-techpro-ict',
    label: 'Grade 11 SSHS TechPro: ICT Support & Computer Programming',
    description: '5 Core Subjects (Terms 1–3) + 1 TechPro Specialization across All 3 Terms (320 hrs, 4 units/term = 12 units/yr)',
    gradeLevel: 'Grade 11',
    curriculumType: 'SSHS',
    track: 'Technical-Professional',
    strandOrCluster: 'ICT Support and Computer Programming Technologies',
    program: 'Regular',
    subjects: [
        ...SSHS_G11_CORE_SUBJECTS,
        { name: 'Computer Systems Servicing', term: 'all', category: 'TechPro Elective', weightCategory: 'SHSTVL', units: 4, hoursPerYear: 320, ...DEPED_WEIGHT_PROFILES.SHSTVL }
    ]
};

export const SSHS_G11_TECHPRO_AUTOMOTIVE_PRESET: CurriculumPreset = {
    id: 'sshs-g11-techpro-automotive',
    label: 'Grade 11 SSHS TechPro: Automotive & Small Engine Technologies',
    description: '5 Core Subjects (Terms 1–3) + 1 TechPro Specialization across All 3 Terms (320 hrs, 4 units/term = 12 units/yr)',
    gradeLevel: 'Grade 11',
    curriculumType: 'SSHS',
    track: 'Technical-Professional',
    strandOrCluster: 'Automotive and Small Engine Technologies',
    program: 'Regular',
    subjects: [
        ...SSHS_G11_CORE_SUBJECTS,
        { name: 'Driving and Automotive Servicing', term: 'all', category: 'TechPro Elective', weightCategory: 'SHSTVL', units: 4, hoursPerYear: 320, ...DEPED_WEIGHT_PROFILES.SHSTVL }
    ]
};

export const SSHS_G11_TECHPRO_HOSPITALITY_PRESET: CurriculumPreset = {
    id: 'sshs-g11-techpro-hospitality',
    label: 'Grade 11 SSHS TechPro: Hospitality & Tourism',
    description: '5 Core Subjects (Terms 1–3) + 1 TechPro Specialization across All 3 Terms (320 hrs, 4 units/term = 12 units/yr)',
    gradeLevel: 'Grade 11',
    curriculumType: 'SSHS',
    track: 'Technical-Professional',
    strandOrCluster: 'Hospitality and Tourism',
    program: 'Regular',
    subjects: [
        ...SSHS_G11_CORE_SUBJECTS,
        { name: 'Food and Beverage Operation', term: 'all', category: 'TechPro Elective', weightCategory: 'SHSTVL', units: 4, hoursPerYear: 320, ...DEPED_WEIGHT_PROFILES.SHSTVL }
    ]
};

// ---------------------------------------------------------------------------
// 4. SENIOR HIGH SCHOOL GRADE 12 (3-Term Model)
// ---------------------------------------------------------------------------

export const SHS_G12_STEM_PRESET: CurriculumPreset = {
    id: 'shs-g12-stem-3term',
    label: 'Grade 12 STEM (Universal 3-Term Model)',
    description: 'Balanced 3-Term distribution of Core, Applied, and Specialized STEM subjects',
    gradeLevel: 'Grade 12',
    curriculumType: 'K-12',
    track: 'Academic',
    strandOrCluster: 'STEM',
    program: 'Regular',
    subjects: [
        // Term 1 (4 subjects)
        { name: '21st Century Literature from the Philippines and the World', term: 1, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'Practical Research 2', term: 1, category: 'Applied', weightCategory: 'G12AcademicImmersionResearch', ...DEPED_WEIGHT_PROFILES.G12AcademicImmersionResearch },
        { name: 'General Chemistry 1', term: 1, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Physical Education and Health 3', term: 1, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },

        // Term 2 (4 subjects)
        { name: 'Contemporary Philippine Arts from the Regions', term: 2, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'English for Academic and Professional Purposes', term: 2, category: 'Applied', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'General Physics 1', term: 2, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Empowerment Technologies', term: 2, category: 'Applied', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },

        // Term 3 (4 subjects)
        { name: 'Introduction to the Philosophy of the Human Person', term: 3, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'Inquiries, Investigations, and Immersion', term: 3, category: 'Applied', weightCategory: 'G12AcademicImmersionResearch', ...DEPED_WEIGHT_PROFILES.G12AcademicImmersionResearch },
        { name: 'General Physics 2', term: 3, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Physical Education and Health 4', term: 3, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core }
    ]
};

export const SHS_G12_ABM_PRESET: CurriculumPreset = {
    id: 'shs-g12-abm-3term',
    label: 'Grade 12 ABM (Universal 3-Term Model)',
    description: 'Balanced 3-Term distribution of Core, Applied, and Specialized ABM subjects',
    gradeLevel: 'Grade 12',
    curriculumType: 'K-12',
    track: 'Academic',
    strandOrCluster: 'ABM',
    program: 'Regular',
    subjects: [
        // Term 1
        { name: '21st Century Literature from the Philippines and the World', term: 1, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'Practical Research 2', term: 1, category: 'Applied', weightCategory: 'G12AcademicImmersionResearch', ...DEPED_WEIGHT_PROFILES.G12AcademicImmersionResearch },
        { name: 'Applied Economics', term: 1, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Physical Education and Health 3', term: 1, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },

        // Term 2
        { name: 'Contemporary Philippine Arts from the Regions', term: 2, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'English for Academic and Professional Purposes', term: 2, category: 'Applied', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Business Ethics and Social Responsibility', term: 2, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Fundamentals of Accountancy, Business and Management 2', term: 2, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },

        // Term 3
        { name: 'Introduction to the Philosophy of the Human Person', term: 3, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'Inquiries, Investigations, and Immersion', term: 3, category: 'Applied', weightCategory: 'G12AcademicImmersionResearch', ...DEPED_WEIGHT_PROFILES.G12AcademicImmersionResearch },
        { name: 'Business Finance', term: 3, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Physical Education and Health 4', term: 3, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core }
    ]
};

export const SHS_G12_HUMSS_PRESET: CurriculumPreset = {
    id: 'shs-g12-humss-3term',
    label: 'Grade 12 HUMSS (Universal 3-Term Model)',
    description: 'Balanced 3-Term distribution of Core, Applied, and Specialized HUMSS subjects',
    gradeLevel: 'Grade 12',
    curriculumType: 'K-12',
    track: 'Academic',
    strandOrCluster: 'HUMSS',
    program: 'Regular',
    subjects: [
        // Term 1
        { name: '21st Century Literature from the Philippines and the World', term: 1, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'Practical Research 2', term: 1, category: 'Applied', weightCategory: 'G12AcademicImmersionResearch', ...DEPED_WEIGHT_PROFILES.G12AcademicImmersionResearch },
        { name: 'Creative Writing', term: 1, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Physical Education and Health 3', term: 1, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },

        // Term 2
        { name: 'Contemporary Philippine Arts from the Regions', term: 2, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'English for Academic and Professional Purposes', term: 2, category: 'Applied', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Disciplines and Ideas in the Social Sciences', term: 2, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Trends, Networks, and Critical Thinking in the 21st Century Culture', term: 2, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },

        // Term 3
        { name: 'Introduction to the Philosophy of the Human Person', term: 3, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'Inquiries, Investigations, and Immersion', term: 3, category: 'Applied', weightCategory: 'G12AcademicImmersionResearch', ...DEPED_WEIGHT_PROFILES.G12AcademicImmersionResearch },
        { name: 'Community Engagement, Solidarity and Citizenship', term: 3, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Physical Education and Health 4', term: 3, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core }
    ]
};

export const SHS_G12_GAS_PRESET: CurriculumPreset = {
    id: 'shs-g12-gas-3term',
    label: 'Grade 12 GAS (Universal 3-Term Model)',
    description: 'Balanced 3-Term distribution of Core, Applied, and Specialized GAS subjects',
    gradeLevel: 'Grade 12',
    curriculumType: 'K-12',
    track: 'Academic',
    strandOrCluster: 'GAS',
    program: 'Regular',
    subjects: [
        // Term 1
        { name: '21st Century Literature from the Philippines and the World', term: 1, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'Practical Research 2', term: 1, category: 'Applied', weightCategory: 'G12AcademicImmersionResearch', ...DEPED_WEIGHT_PROFILES.G12AcademicImmersionResearch },
        { name: 'Humanities 1', term: 1, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Physical Education and Health 3', term: 1, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },

        // Term 2
        { name: 'Contemporary Philippine Arts from the Regions', term: 2, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'English for Academic and Professional Purposes', term: 2, category: 'Applied', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Social Science 1', term: 2, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Applied Economics', term: 2, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },

        // Term 3
        { name: 'Introduction to the Philosophy of the Human Person', term: 3, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'Inquiries, Investigations, and Immersion', term: 3, category: 'Applied', weightCategory: 'G12AcademicImmersionResearch', ...DEPED_WEIGHT_PROFILES.G12AcademicImmersionResearch },
        { name: 'Organization and Management', term: 3, category: 'Specialized', weightCategory: 'G12AcademicOther', ...DEPED_WEIGHT_PROFILES.G12AcademicOther },
        { name: 'Physical Education and Health 4', term: 3, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core }
    ]
};

export const SHS_G12_TVL_PRESET: CurriculumPreset = {
    id: 'shs-g12-tvl-3term',
    label: 'Grade 12 TVL (Universal 3-Term Model)',
    description: 'Balanced 3-Term distribution of Core, Applied, and TVL track subjects',
    gradeLevel: 'Grade 12',
    curriculumType: 'K-12',
    track: 'TVL',
    strandOrCluster: 'TVL',
    program: 'Regular',
    subjects: [
        // Term 1
        { name: '21st Century Literature from the Philippines and the World', term: 1, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'Practical Research 2', term: 1, category: 'Applied', weightCategory: 'G12TVL', ...DEPED_WEIGHT_PROFILES.G12TVL },
        { name: 'Empowerment Technologies', term: 1, category: 'Applied', weightCategory: 'G12TVL', ...DEPED_WEIGHT_PROFILES.G12TVL },
        { name: 'Physical Education and Health 3', term: 1, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },

        // Term 2
        { name: 'Contemporary Philippine Arts from the Regions', term: 2, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'English for Academic and Professional Purposes', term: 2, category: 'Applied', weightCategory: 'G12TVL', ...DEPED_WEIGHT_PROFILES.G12TVL },
        { name: 'Entrepreneurship', term: 2, category: 'Applied', weightCategory: 'G12TVL', ...DEPED_WEIGHT_PROFILES.G12TVL },
        { name: 'Filipino sa Piling Larang (Teknikal-Bokasyunal)', term: 2, category: 'Applied', weightCategory: 'G12TVL', ...DEPED_WEIGHT_PROFILES.G12TVL },

        // Term 3
        { name: 'Introduction to the Philosophy of the Human Person', term: 3, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core },
        { name: 'Inquiries, Investigations, and Immersion', term: 3, category: 'Applied', weightCategory: 'G12TVL', ...DEPED_WEIGHT_PROFILES.G12TVL },
        { name: 'Work Immersion (TVL)', term: 3, category: 'Specialized', weightCategory: 'G12TVL', ...DEPED_WEIGHT_PROFILES.G12TVL },
        { name: 'Physical Education and Health 4', term: 3, category: 'Core', weightCategory: 'G12Core', ...DEPED_WEIGHT_PROFILES.G12Core }
    ]
};

// ---------------------------------------------------------------------------
// MASTER PRESETS REPOSITORY & QUERY ENGINES
// ---------------------------------------------------------------------------

export const ALL_CURRICULUM_PRESETS: CurriculumPreset[] = [
    KINDERGARTEN_PRESET,
    GRADE_1_MATATAG_PRESET,
    GRADE_2_MATATAG_PRESET,
    GRADE_3_MATATAG_PRESET,
    createElementaryUpperPreset('Grade 4'),
    createElementaryUpperPreset('Grade 5'),
    createElementaryUpperPreset('Grade 6'),
    createJHSRegularPreset('Grade 7'),
    createJHSSTEPreset('Grade 7'),
    createJHSRegularPreset('Grade 8'),
    createJHSSTEPreset('Grade 8'),
    createJHSRegularPreset('Grade 9'),
    createJHSSTEPreset('Grade 9'),
    createJHSRegularPreset('Grade 10'),
    createJHSSTEPreset('Grade 10'),
    SSHS_G11_STEM_PRESET,
    SSHS_G11_ABM_PRESET,
    SSHS_G11_HUMSS_PRESET,
    SSHS_G11_TECHPRO_ICT_PRESET,
    SSHS_G11_TECHPRO_AUTOMOTIVE_PRESET,
    SSHS_G11_TECHPRO_HOSPITALITY_PRESET,
    SHS_G12_STEM_PRESET,
    SHS_G12_ABM_PRESET,
    SHS_G12_HUMSS_PRESET,
    SHS_G12_GAS_PRESET,
    SHS_G12_TVL_PRESET
];

/**
 * Find the official DepEd curriculum preset matching a section's configuration.
 */
export function getCurriculumPreset(
    gradeLevel?: string | null,
    track?: string | null,
    strandOrCluster?: string | null,
    program?: string | null
): CurriculumPreset | null {
    if (!gradeLevel) return null;
    const cleanGrade = gradeLevel.trim();
    const isG11 = cleanGrade.includes('11');
    const isG12 = cleanGrade.includes('12');

    // 1. Grade 11 SSHS Matching
    if (isG11) {
        const clusterNorm = (strandOrCluster || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const trackNorm = (track || '').toLowerCase();

        if (clusterNorm.includes('stem') || clusterNorm.includes('science') || clusterNorm.includes('engineering')) {
            return SSHS_G11_STEM_PRESET;
        }
        if (clusterNorm.includes('abm') || clusterNorm.includes('business') || clusterNorm.includes('entrepreneurship')) {
            return SSHS_G11_ABM_PRESET;
        }
        if (clusterNorm.includes('humss') || clusterNorm.includes('humanities') || clusterNorm.includes('social')) {
            return SSHS_G11_HUMSS_PRESET;
        }
        if (trackNorm.includes('tech') || trackNorm.includes('tvl')) {
            if (clusterNorm.includes('auto')) return SSHS_G11_TECHPRO_AUTOMOTIVE_PRESET;
            if (clusterNorm.includes('hosp') || clusterNorm.includes('tourism')) return SSHS_G11_TECHPRO_HOSPITALITY_PRESET;
            if (clusterNorm.includes('ict') || clusterNorm.includes('computer') || clusterNorm.includes('programming')) {
                return SSHS_G11_TECHPRO_ICT_PRESET;
            }
            return null;
        }
        // A missing or unrecognised SSHS cluster is not a reason to assign
        // STEM subjects.  The adviser must make an explicit offering choice.
        return null;
    }

    // 2. Grade 12 SHS Matching (DO 8, s. 2015)
    if (isG12) {
        const strandNorm = (strandOrCluster || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const trackNorm = (track || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (strandNorm.includes('gas') || strandNorm.includes('generalacademic')) return SHS_G12_GAS_PRESET;
        if (strandNorm.includes('abm') || strandNorm.includes('business')) return SHS_G12_ABM_PRESET;
        if (strandNorm.includes('humss') || strandNorm.includes('humanities')) return SHS_G12_HUMSS_PRESET;
        if (trackNorm.includes('tvl') || trackNorm.includes('technicalvocational')) return SHS_G12_TVL_PRESET;
        if (strandNorm.includes('stem') || strandNorm.includes('science')) return SHS_G12_STEM_PRESET;
        return SHS_G12_GAS_PRESET;
    }

    // 3. Junior High School Matching (Grades 7 to 10)
    const jhsMatch = cleanGrade.match(/(?:Grade\s*)?([789]|10)/i);
    if (jhsMatch) {
        const gradeStr = `Grade ${jhsMatch[1]}` as 'Grade 7' | 'Grade 8' | 'Grade 9' | 'Grade 10';
        const prog = (program || '').toUpperCase();
        if (prog === 'STE' || prog === 'SPSTEM') {
            return createJHSSTEPreset(gradeStr);
        }
        return createJHSRegularPreset(gradeStr);
    }

    // 4. Elementary Matching (Kinder to Grade 6)
    if (cleanGrade.toLowerCase().includes('kinder')) return KINDERGARTEN_PRESET;
    if (cleanGrade.includes('1')) return GRADE_1_MATATAG_PRESET;
    if (cleanGrade.includes('2')) return GRADE_2_MATATAG_PRESET;
    if (cleanGrade.includes('3')) return GRADE_3_MATATAG_PRESET;
    if (cleanGrade.includes('4')) return createElementaryUpperPreset('Grade 4');
    if (cleanGrade.includes('5')) return createElementaryUpperPreset('Grade 5');
    if (cleanGrade.includes('6')) return createElementaryUpperPreset('Grade 6');

    return null;
}

/**
 * Get all presets relevant to a specific grade level.
 */
export function getAvailablePresetsForGrade(gradeLevel: string): CurriculumPreset[] {
    const cleanGrade = gradeLevel.trim();
    return ALL_CURRICULUM_PRESETS.filter(p => p.gradeLevel.toLowerCase() === cleanGrade.toLowerCase());
}

/**
 * Get standard DepEd assessment weights (WW, PT, QA) for any subject based on learning area.
 * Follows DepEd Order No. 015, s. 2026 (SY 2026-2027 onward) with support for legacy Grade 12 tracks.
 */
export function getDepEdWeightsForSubject(
    subjectName: string,
    gradeLevel?: string | null,
    track?: string | null,
    curriculumType?: string | null
): { written_weight: number; performance_weight: number; exam_weight: number } {
    const nameNorm = subjectName.toLowerCase();
    const cleanNorm = nameNorm.replace(/[^a-z0-9]/g, '');
    const isG11 = (gradeLevel || '').includes('11');
    const isG12 = (gradeLevel || '').includes('12');
    const isSHS = isG11 || isG12;

    if (isSHS) {
        const isExplicitSSHS = (curriculumType || '').toUpperCase() === 'SSHS' || (track ? (
            track.toLowerCase().includes('sshs') ||
            track.toLowerCase().includes('cluster')
        ) : false);

        // Grade 12 Traditional K-12 fallback (DO 8, s. 2015)
        if (isG12 && !isExplicitSSHS) {
            const isTVL = (track || '').toLowerCase().includes('tvl') || (track || '').toLowerCase().includes('sports') || (track || '').toLowerCase().includes('arts');
            if (isTVL) return DEPED_WEIGHT_PROFILES.SHSTVL; // 20/60/20

            const isImmersionResearch = 
                nameNorm.includes('work immersion') || cleanNorm.includes('workimmersion') ||
                nameNorm.includes('practical research') || cleanNorm.includes('practicalresearch') ||
                nameNorm.includes('inquiries') || nameNorm.includes('investigation') ||
                nameNorm.includes('business enterprise simulation') || cleanNorm.includes('businessenterprisesimulation') ||
                nameNorm.includes('culminating activity') || cleanNorm.includes('culminatingactivity');
            if (isImmersionResearch) return DEPED_WEIGHT_PROFILES.G12AcademicImmersionResearch; // 35/40/25

            const cores = [
                '21st century literature', 'contemporary philippine arts', 'disaster readiness',
                'earth and life science', 'earth science', 'general mathematics',
                'introduction to philosophy', 'komunikasyon at pananaliksik', 'media and information literacy',
                'oral communication', 'pagbasa at pagsusuri', 'personal development', 'physical science',
                'reading and writing', 'statistics and probability', 'understanding culture',
                'physical education and health', 'hope'
            ];
            const isCore = cores.some(c => cleanNorm.includes(c.replace(/[^a-z0-9]/g, '')));
            if (isCore) return DEPED_WEIGHT_PROFILES.G12Core; // 25/50/25

            return DEPED_WEIGHT_PROFILES.G12AcademicOther; // 25/45/30
        }

        // DepEd Order No. 015, s. 2026 (Grade 11 SSHS and Grade 12 SSHS)
        // 1. Work Immersion (20/80/0)
        if (nameNorm.includes('work immersion') || cleanNorm.includes('workimmersion')) {
            return DEPED_WEIGHT_PROFILES.SHSImmersion;
        }

        // 2. Research Electives, Design and Innovation (40/60/0)
        if (nameNorm.includes('research') || nameNorm.includes('inquiries') || nameNorm.includes('investigation') || nameNorm.includes('design and innovation') || cleanNorm.includes('designandinnovation')) {
            return DEPED_WEIGHT_PROFILES.SHSResearch;
        }

        // 3. Field Exposure, Arts Apprenticeship, Creative Production (15/70/15)
        if (nameNorm.includes('field exposure') || cleanNorm.includes('fieldexposure') || nameNorm.includes('apprenticeship') || nameNorm.includes('creative production') || cleanNorm.includes('creativeproduction')) {
            return DEPED_WEIGHT_PROFILES.SHSFieldExposure;
        }

        // 4. TechPro Electives (15/65/20)
        const isTechPro = (track || '').toLowerCase().includes('tech') || (track || '').toLowerCase().includes('tvl');
        if (isTechPro) {
            return DEPED_WEIGHT_PROFILES.SHSTechPro;
        }

        // 5. Arts, Sports, Health and Wellness Electives (20/60/20)
        if (nameNorm.includes('fitness') || nameNorm.includes('recreation') || nameNorm.includes('sports') || nameNorm.includes('dance') || nameNorm.includes('coaching') || nameNorm.includes('officiating') || nameNorm.includes('first aid') || nameNorm.includes('basic life support')) {
            return DEPED_WEIGHT_PROFILES.MAPEH; // 20/60/20
        }

        // 6. SHS Core Subjects & Academic Electives (20/50/30)
        return DEPED_WEIGHT_PROFILES.SHSCore;
    }

    // Elementary & JHS (Key Stage 2 & 3: DO 15, s. 2026)
    // TLE / EPP: 20/60/20
    if (nameNorm.includes('tle') || nameNorm.includes('epp') || nameNorm.includes('technology and livelihood') || nameNorm.includes('pantahanan')) {
        return DEPED_WEIGHT_PROFILES.TLE_EPP;
    }
    // MAPEH: 20/60/20
    if (nameNorm.includes('mapeh') || nameNorm.includes('music') || nameNorm.includes('arts') || nameNorm.includes('physical education') || nameNorm.includes('health')) {
        return DEPED_WEIGHT_PROFILES.MAPEH;
    }
    // Core Learning Areas (Filipino, English, Math, Science, AP, Values Education, GMRC, Makabansa, Reading & Literacy): 20/50/30
    return DEPED_WEIGHT_PROFILES.Languages;
}

/**
 * Diagnostic health check for a section's curriculum:
 * Checks if any of the active terms (Term 1, Term 2, Term 3) has zero subjects configured.
 */
export function validateSectionCurriculumHealth(
    taughtSubjects: string[] = [],
    subjectTermsMeta: Record<string, 1 | 2 | 3 | 'all'> = {},
    gradeLevel: string = '',
    track?: string,
    strandOrCluster?: string,
    program?: string
): {
    isHealthy: boolean;
    missingTerms: (1 | 2 | 3)[];
    termCounts: { term1: number; term2: number; term3: number };
    suggestedPreset: CurriculumPreset | null;
} {
    const isSHS = gradeLevel.includes('11') || gradeLevel.includes('12');
    let t1Count = 0;
    let t2Count = 0;
    let t3Count = 0;

    for (const subName of taughtSubjects) {
        const assignedTerm = subjectTermsMeta[subName];
        if (!isSHS || assignedTerm === 'all' || !assignedTerm) {
            t1Count++;
            t2Count++;
            t3Count++;
        } else {
            if (Number(assignedTerm) === 1) t1Count++;
            if (Number(assignedTerm) === 2) t2Count++;
            if (Number(assignedTerm) === 3) t3Count++;
        }
    }

    const missingTerms: (1 | 2 | 3)[] = [];
    if (t1Count === 0) missingTerms.push(1);
    if (t2Count === 0) missingTerms.push(2);
    if (t3Count === 0) missingTerms.push(3);

    return {
        isHealthy: taughtSubjects.length > 0 && missingTerms.length === 0,
        missingTerms,
        termCounts: { term1: t1Count, term2: t2Count, term3: t3Count },
        suggestedPreset: getCurriculumPreset(gradeLevel, track, strandOrCluster, program)
    };
}
