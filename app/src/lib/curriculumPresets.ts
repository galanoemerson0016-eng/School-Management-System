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
    | 'SHSTVL'
    | 'SHSImmersion'
    | 'Immersion';

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
 * Standard DepEd Assessment Weight Profiles (DO 8, s. 2015 / DO 15, s. 2026)
 */
export const DEPED_WEIGHT_PROFILES = {
    // Elementary & JHS
    Languages: { written_weight: 30, performance_weight: 50, exam_weight: 20 },
    MathScience: { written_weight: 40, performance_weight: 40, exam_weight: 20 },
    MAPEH: { written_weight: 20, performance_weight: 60, exam_weight: 20 },
    TLE_EPP: { written_weight: 20, performance_weight: 60, exam_weight: 20 },

    // Senior High School (Grades 11 & 12)
    SHSCore: { written_weight: 25, performance_weight: 50, exam_weight: 25 },
    SHSAcademicMathSci: { written_weight: 35, performance_weight: 40, exam_weight: 25 },
    SHSAcademicHumanities: { written_weight: 25, performance_weight: 45, exam_weight: 30 },
    SHSTVL: { written_weight: 20, performance_weight: 60, exam_weight: 20 },
    SHSImmersion: { written_weight: 35, performance_weight: 40, exam_weight: 25 }
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
            { name: 'Research I (Scientific Investigation)', term: 'all', category: 'Program Elective', weightCategory: 'MathScience', ...DEPED_WEIGHT_PROFILES.MathScience }
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
    { name: 'Effective Communication', term: 'all', category: 'Core', weightCategory: 'SHSCore', units: 6, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSCore },
    { name: 'Mabisang Komunikasyon', term: 'all', category: 'Core', weightCategory: 'SHSCore', units: 6, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSCore },
    { name: 'General Mathematics', term: 'all', category: 'Core', weightCategory: 'SHSCore', units: 6, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSCore },
    { name: 'General Science', term: 'all', category: 'Core', weightCategory: 'SHSCore', units: 6, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSCore },
    { name: 'Life and Career Skills', term: 'all', category: 'Core', weightCategory: 'SHSCore', units: 6, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSCore },
    { name: 'Pag-aaral ng Kasaysayan at Lipunang Pilipino', term: 'all', category: 'Core', weightCategory: 'SHSCore', units: 6, hoursPerYear: 80, ...DEPED_WEIGHT_PROFILES.SHSCore }
];

export const SSHS_G11_STEM_PRESET: CurriculumPreset = {
    id: 'sshs-g11-stem',
    label: 'Grade 11 SSHS STEM (Science, Technology, Engineering, and Mathematics)',
    description: '6 Core Subjects (Terms 1–3) + 7 Term-Sequenced STEM Electives (Annex E)',
    gradeLevel: 'Grade 11',
    curriculumType: 'SSHS',
    track: 'Academic',
    strandOrCluster: 'Science, Technology, Engineering, and Mathematics',
    program: 'Regular',
    subjects: [
        ...SSHS_G11_CORE_SUBJECTS,
        // Term 1 Electives (3 units each)
        { name: 'Chemistry 1', term: 1, category: 'Academic Elective', weightCategory: 'SHSAcademicMathSci', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci },
        { name: 'Pre-Calculus', term: 1, category: 'Academic Elective', weightCategory: 'SHSAcademicMathSci', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci },

        // Term 2 Electives (3 units each)
        { name: 'Chemistry 2', term: 2, category: 'Academic Elective', weightCategory: 'SHSAcademicMathSci', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci },
        { name: 'Basic Calculus', term: 2, category: 'Academic Elective', weightCategory: 'SHSAcademicMathSci', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci },
        { name: 'Physics 1', term: 2, category: 'Academic Elective', weightCategory: 'SHSAcademicMathSci', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci },

        // Term 3 Electives (3 units each)
        { name: 'Physics 2', term: 3, category: 'Academic Elective', weightCategory: 'SHSAcademicMathSci', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci },
        { name: 'Advanced Mathematics', term: 3, category: 'Academic Elective', weightCategory: 'SHSAcademicMathSci', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci }
    ]
};

export const SSHS_G11_ABM_PRESET: CurriculumPreset = {
    id: 'sshs-g11-abm',
    label: 'Grade 11 SSHS Business & Entrepreneurship (ABM)',
    description: '6 Core Subjects (Terms 1–3) + Business Sequence Electives',
    gradeLevel: 'Grade 11',
    curriculumType: 'SSHS',
    track: 'Academic',
    strandOrCluster: 'Business and Entrepreneurship',
    program: 'Regular',
    subjects: [
        ...SSHS_G11_CORE_SUBJECTS,
        // Term 1
        { name: 'Business 1 (Basic Accounting)', term: 1, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Contemporary Marketing', term: 1, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },

        // Term 2
        { name: 'Business 2 (Business Finance and Income Taxation)', term: 2, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Introduction to Organization and Management', term: 2, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },

        // Term 3
        { name: 'Business 3 (Business Economics)', term: 3, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Entrepreneurship', term: 3, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities }
    ]
};

export const SSHS_G11_HUMSS_PRESET: CurriculumPreset = {
    id: 'sshs-g11-humss',
    label: 'Grade 11 SSHS Arts, Social Sciences, and Humanities (HUMSS)',
    description: '6 Core Subjects (Terms 1–3) + Humanities & Social Sciences Electives',
    gradeLevel: 'Grade 11',
    curriculumType: 'SSHS',
    track: 'Academic',
    strandOrCluster: 'Arts, Social Sciences, and Humanities',
    program: 'Regular',
    subjects: [
        ...SSHS_G11_CORE_SUBJECTS,
        // Term 1
        { name: 'Contemporary Literature 1', term: 1, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Philippine Governance (Philippine Politics and Governance)', term: 1, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Creative Composition 1', term: 1, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },

        // Term 2
        { name: 'Contemporary Literature 2', term: 2, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Social Sciences (Theory and Practice)', term: 2, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Creative Composition 2', term: 2, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },

        // Term 3
        { name: 'Introduction to the Philosophy of the Human Person', term: 3, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Malikhaing Pagsulat', term: 3, category: 'Academic Elective', weightCategory: 'SHSAcademicHumanities', units: 3, ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities }
    ]
};

export const SSHS_G11_TECHPRO_ICT_PRESET: CurriculumPreset = {
    id: 'sshs-g11-techpro-ict',
    label: 'Grade 11 SSHS TechPro: ICT Support & Computer Programming',
    description: '6 Core Subjects (Terms 1–3) + 4 units/term TechPro Specialization (Annex E)',
    gradeLevel: 'Grade 11',
    curriculumType: 'SSHS',
    track: 'Technical-Professional',
    strandOrCluster: 'ICT Support and Computer Programming Technologies',
    program: 'Regular',
    subjects: [
        ...SSHS_G11_CORE_SUBJECTS,
        { name: 'Computer Systems Servicing', term: 1, category: 'TechPro Elective', weightCategory: 'SHSTVL', units: 4, ...DEPED_WEIGHT_PROFILES.SHSTVL },
        { name: 'Broadband Installation', term: 2, category: 'TechPro Elective', weightCategory: 'SHSTVL', units: 4, ...DEPED_WEIGHT_PROFILES.SHSTVL },
        { name: 'Computer Programming (.Net Technology)', term: 3, category: 'TechPro Elective', weightCategory: 'SHSTVL', units: 4, ...DEPED_WEIGHT_PROFILES.SHSTVL }
    ]
};

export const SSHS_G11_TECHPRO_AUTOMOTIVE_PRESET: CurriculumPreset = {
    id: 'sshs-g11-techpro-automotive',
    label: 'Grade 11 SSHS TechPro: Automotive & Small Engine Technologies',
    description: '6 Core Subjects (Terms 1–3) + 4 units/term Automotive Specialization (Annex E)',
    gradeLevel: 'Grade 11',
    curriculumType: 'SSHS',
    track: 'Technical-Professional',
    strandOrCluster: 'Automotive and Small Engine Technologies',
    program: 'Regular',
    subjects: [
        ...SSHS_G11_CORE_SUBJECTS,
        { name: 'Driving and Automotive Servicing', term: 1, category: 'TechPro Elective', weightCategory: 'SHSTVL', units: 4, ...DEPED_WEIGHT_PROFILES.SHSTVL },
        { name: 'Motorcycle and Small Engine Servicing', term: 2, category: 'TechPro Elective', weightCategory: 'SHSTVL', units: 4, ...DEPED_WEIGHT_PROFILES.SHSTVL },
        { name: 'Automotive Servicing (Electrical Repair)', term: 3, category: 'TechPro Elective', weightCategory: 'SHSTVL', units: 4, ...DEPED_WEIGHT_PROFILES.SHSTVL }
    ]
};

export const SSHS_G11_TECHPRO_HOSPITALITY_PRESET: CurriculumPreset = {
    id: 'sshs-g11-techpro-hospitality',
    label: 'Grade 11 SSHS TechPro: Hospitality & Tourism',
    description: '6 Core Subjects (Terms 1–3) + 4 units/term Hospitality Specialization (Annex E)',
    gradeLevel: 'Grade 11',
    curriculumType: 'SSHS',
    track: 'Technical-Professional',
    strandOrCluster: 'Hospitality and Tourism',
    program: 'Regular',
    subjects: [
        ...SSHS_G11_CORE_SUBJECTS,
        { name: 'Food and Beverage Operation', term: 1, category: 'TechPro Elective', weightCategory: 'SHSTVL', units: 4, ...DEPED_WEIGHT_PROFILES.SHSTVL },
        { name: 'Kitchen Operations', term: 2, category: 'TechPro Elective', weightCategory: 'SHSTVL', units: 4, ...DEPED_WEIGHT_PROFILES.SHSTVL },
        { name: 'Bakery Operations', term: 3, category: 'TechPro Elective', weightCategory: 'SHSTVL', units: 4, ...DEPED_WEIGHT_PROFILES.SHSTVL }
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
        { name: '21st Century Literature from the Philippines and the World', term: 1, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'Practical Research 2', term: 1, category: 'Applied', weightCategory: 'SHSAcademicMathSci', ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci },
        { name: 'General Chemistry 1', term: 1, category: 'Specialized', weightCategory: 'SHSAcademicMathSci', ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci },
        { name: 'Physical Education and Health 3', term: 1, category: 'Core', weightCategory: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH },

        // Term 2 (4 subjects)
        { name: 'Contemporary Philippine Arts from the Regions', term: 2, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'English for Academic and Professional Purposes', term: 2, category: 'Applied', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'General Physics 1', term: 2, category: 'Specialized', weightCategory: 'SHSAcademicMathSci', ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci },
        { name: 'Empowerment Technologies', term: 2, category: 'Applied', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },

        // Term 3 (4 subjects)
        { name: 'Introduction to the Philosophy of the Human Person', term: 3, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'Inquiries, Investigations, and Immersion', term: 3, category: 'Applied', weightCategory: 'SHSAcademicMathSci', ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci },
        { name: 'General Physics 2', term: 3, category: 'Specialized', weightCategory: 'SHSAcademicMathSci', ...DEPED_WEIGHT_PROFILES.SHSAcademicMathSci },
        { name: 'Physical Education and Health 4', term: 3, category: 'Core', weightCategory: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH }
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
        { name: '21st Century Literature from the Philippines and the World', term: 1, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'Practical Research 2', term: 1, category: 'Applied', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Applied Economics', term: 1, category: 'Specialized', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Physical Education and Health 3', term: 1, category: 'Core', weightCategory: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH },

        // Term 2
        { name: 'Contemporary Philippine Arts from the Regions', term: 2, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'English for Academic and Professional Purposes', term: 2, category: 'Applied', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Business Ethics and Social Responsibility', term: 2, category: 'Specialized', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Fundamentals of Accountancy, Business and Management 2', term: 2, category: 'Specialized', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },

        // Term 3
        { name: 'Introduction to the Philosophy of the Human Person', term: 3, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'Inquiries, Investigations, and Immersion', term: 3, category: 'Applied', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Business Finance', term: 3, category: 'Specialized', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Physical Education and Health 4', term: 3, category: 'Core', weightCategory: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH }
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
        { name: '21st Century Literature from the Philippines and the World', term: 1, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'Practical Research 2', term: 1, category: 'Applied', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Creative Writing', term: 1, category: 'Specialized', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Physical Education and Health 3', term: 1, category: 'Core', weightCategory: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH },

        // Term 2
        { name: 'Contemporary Philippine Arts from the Regions', term: 2, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'English for Academic and Professional Purposes', term: 2, category: 'Applied', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Disciplines and Ideas in the Social Sciences', term: 2, category: 'Specialized', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Trends, Networks, and Critical Thinking in the 21st Century Culture', term: 2, category: 'Specialized', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },

        // Term 3
        { name: 'Introduction to the Philosophy of the Human Person', term: 3, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'Inquiries, Investigations, and Immersion', term: 3, category: 'Applied', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Community Engagement, Solidarity and Citizenship', term: 3, category: 'Specialized', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Physical Education and Health 4', term: 3, category: 'Core', weightCategory: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH }
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
        { name: '21st Century Literature from the Philippines and the World', term: 1, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'Practical Research 2', term: 1, category: 'Applied', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Humanities 1', term: 1, category: 'Specialized', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Physical Education and Health 3', term: 1, category: 'Core', weightCategory: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH },

        // Term 2
        { name: 'Contemporary Philippine Arts from the Regions', term: 2, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'English for Academic and Professional Purposes', term: 2, category: 'Applied', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Social Science 1', term: 2, category: 'Specialized', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Applied Economics', term: 2, category: 'Specialized', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },

        // Term 3
        { name: 'Introduction to the Philosophy of the Human Person', term: 3, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'Inquiries, Investigations, and Immersion', term: 3, category: 'Applied', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Organization and Management', term: 3, category: 'Specialized', weightCategory: 'SHSAcademicHumanities', ...DEPED_WEIGHT_PROFILES.SHSAcademicHumanities },
        { name: 'Physical Education and Health 4', term: 3, category: 'Core', weightCategory: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH }
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
        { name: '21st Century Literature from the Philippines and the World', term: 1, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'Practical Research 2', term: 1, category: 'Applied', weightCategory: 'SHSTVL', ...DEPED_WEIGHT_PROFILES.SHSTVL },
        { name: 'Empowerment Technologies', term: 1, category: 'Applied', weightCategory: 'SHSTVL', ...DEPED_WEIGHT_PROFILES.SHSTVL },
        { name: 'Physical Education and Health 3', term: 1, category: 'Core', weightCategory: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH },

        // Term 2
        { name: 'Contemporary Philippine Arts from the Regions', term: 2, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'English for Academic and Professional Purposes', term: 2, category: 'Applied', weightCategory: 'SHSTVL', ...DEPED_WEIGHT_PROFILES.SHSTVL },
        { name: 'Entrepreneurship', term: 2, category: 'Applied', weightCategory: 'SHSTVL', ...DEPED_WEIGHT_PROFILES.SHSTVL },
        { name: 'Filipino sa Piling Larang (Teknikal-Bokasyunal)', term: 2, category: 'Applied', weightCategory: 'SHSTVL', ...DEPED_WEIGHT_PROFILES.SHSTVL },

        // Term 3
        { name: 'Introduction to the Philosophy of the Human Person', term: 3, category: 'Core', weightCategory: 'SHSCore', ...DEPED_WEIGHT_PROFILES.SHSCore },
        { name: 'Inquiries, Investigations, and Immersion', term: 3, category: 'Applied', weightCategory: 'SHSTVL', ...DEPED_WEIGHT_PROFILES.SHSTVL },
        { name: 'Work Immersion (TVL)', term: 3, category: 'Specialized', weightCategory: 'SHSTVL', ...DEPED_WEIGHT_PROFILES.SHSTVL },
        { name: 'Physical Education and Health 4', term: 3, category: 'Core', weightCategory: 'MAPEH', ...DEPED_WEIGHT_PROFILES.MAPEH }
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
    gradeLevel?: string,
    track?: string,
    strandOrCluster?: string,
    program?: string
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
            return SSHS_G11_TECHPRO_ICT_PRESET;
        }
        return SSHS_G11_STEM_PRESET; // Default fallback for G11 Academic
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
 */
export function getDepEdWeightsForSubject(
    subjectName: string,
    gradeLevel?: string,
    track?: string
): { written_weight: number; performance_weight: number; exam_weight: number } {
    const nameNorm = subjectName.toLowerCase();
    const isSHS = (gradeLevel || '').includes('11') || (gradeLevel || '').includes('12');

    if (isSHS) {
        const isTechPro = (track || '').toLowerCase().includes('tech') || (track || '').toLowerCase().includes('tvl');
        if (isTechPro) return DEPED_WEIGHT_PROFILES.SHSTVL;
        if (nameNorm.includes('immersion') || nameNorm.includes('inquiries') || nameNorm.includes('culminating')) {
            return DEPED_WEIGHT_PROFILES.SHSImmersion;
        }
        if (nameNorm.includes('calculus') || nameNorm.includes('chemistry') || nameNorm.includes('physics') || nameNorm.includes('biology') || nameNorm.includes('math')) {
            return DEPED_WEIGHT_PROFILES.SHSAcademicMathSci;
        }
        if (nameNorm.includes('literature') || nameNorm.includes('philosophy') || nameNorm.includes('governance') || nameNorm.includes('business') || nameNorm.includes('writing') || nameNorm.includes('komunikasyon')) {
            return DEPED_WEIGHT_PROFILES.SHSAcademicHumanities;
        }
        return DEPED_WEIGHT_PROFILES.SHSCore;
    }

    // Elementary & JHS
    if (nameNorm.includes('math') || nameNorm.includes('science')) {
        return DEPED_WEIGHT_PROFILES.MathScience;
    }
    if (nameNorm.includes('mapeh') || nameNorm.includes('music') || nameNorm.includes('arts') || nameNorm.includes('physical education') || nameNorm.includes('health')) {
        return DEPED_WEIGHT_PROFILES.MAPEH;
    }
    if (nameNorm.includes('tle') || nameNorm.includes('epp') || nameNorm.includes('technology') || nameNorm.includes('pantahanan')) {
        return DEPED_WEIGHT_PROFILES.TLE_EPP;
    }
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
