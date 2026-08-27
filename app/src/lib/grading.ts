import { useAppStore } from '../stores';

export const normalizeScores = (scores: (number | string)[] | undefined, count: number): (number | string)[] => {
    const src = Array.isArray(scores) ? scores : [];
    return Array.from({ length: count }, (_, i) => src[i] ?? '');
};

// Grade computation weights based on current school policy
// Updated per DepEd Order (SY 2026-2027): Assessment, Grading System, Awards & Recognition

// Subject Cluster 1: AP, English, Filipino, Mathematics, Science, GMRC / Values Education
export const WEIGHTS_LANGUAGES_AP_ESP = {
    written_works: 0.20,      // 20%
    performance_tasks: 0.50,   // 50%
    quarterly_exam: 0.30,      // 30%
};

// Subject Cluster 2: Mathematics and Science (same weights as Cluster 1)
export const WEIGHTS_SCIENCE_MATH = {
    written_works: 0.20,      // 20%
    performance_tasks: 0.50,   // 50%
    quarterly_exam: 0.30,      // 30%
};

// Subject Cluster 3: EPP/TLE, MAPEH, Specialization
export const WEIGHTS_MAPEH_TLE = {
    written_works: 0.20,      // 20%
    performance_tasks: 0.60,   // 60%
    quarterly_exam: 0.20,      // 20%
};

// SHS Core Subjects, Other SHS Academic Electives (20/50/30)
export const WEIGHTS_SHS_CORE_ACADEMIC = {
    written_works: 0.20,
    performance_tasks: 0.50,
    quarterly_exam: 0.30,
};

// SHS Field Exposure, Arts Apprenticeship, Creative Production and Innovation (15/70/15)
export const WEIGHTS_SHS_FIELD_EXPOSURE = {
    written_works: 0.15,
    performance_tasks: 0.70,
    quarterly_exam: 0.15,
};

// SHS Arts, Sports, Health and Wellness Electives (20/60/20)
export const WEIGHTS_SHS_ARTS_SPORTS = {
    written_works: 0.20,
    performance_tasks: 0.60,
    quarterly_exam: 0.20,
};

// SHS Research Electives and Design and Innovation (40/60/0)
export const WEIGHTS_SHS_RESEARCH = {
    written_works: 0.40,
    performance_tasks: 0.60,
    quarterly_exam: 0.00,
};

// SHS TechPro Electives (15/65/20)
export const WEIGHTS_SHS_TECHPRO = {
    written_works: 0.15,
    performance_tasks: 0.65,
    quarterly_exam: 0.20,
};

// SHS Work Immersion (20/80/0)
export const WEIGHTS_SHS_IMMERSION = {
    written_works: 0.20,
    performance_tasks: 0.80,
    quarterly_exam: 0.00,
};

// Grade 12 Core Subjects (all tracks) (25/50/25)
export const WEIGHTS_G12_CORE = {
    written_works: 0.25,
    performance_tasks: 0.50,
    quarterly_exam: 0.25,
};

// Grade 12 Academic Track - All other subjects (25/45/30)
export const WEIGHTS_G12_ACADEMIC_OTHER = {
    written_works: 0.25,
    performance_tasks: 0.45,
    quarterly_exam: 0.30,
};

// Grade 12 Academic Track - Work Immersion / Research / Business Enterprise Simulation (35/40/25)
export const WEIGHTS_G12_ACADEMIC_IMMERSION_RESEARCH = {
    written_works: 0.35,
    performance_tasks: 0.40,
    quarterly_exam: 0.25,
};

// Grade 12 TVL / Sports / Arts Track - All other subjects (and Immersion/Research) (20/60/20)
export const WEIGHTS_G12_TVL_ALL = {
    written_works: 0.20,
    performance_tasks: 0.60,
    quarterly_exam: 0.20,
};

export type SubjectCluster = 
    | 'languages_ap_esp' 
    | 'science_math' 
    | 'mapeh_tle' 
    | 'shs_core_academic' 
    | 'shs_field_exposure' 
    | 'shs_arts_sports' 
    | 'shs_research' 
    | 'shs_techpro' 
    | 'shs_immersion'
    | 'g12_core'
    | 'g12_academic_other'
    | 'g12_academic_immersion_research'
    | 'g12_tvl_all';

/**
 * EXs internal sub-weights per DepEd Order (SY 2026-2027).
 * Within the EXs component: ST1 = 30%, ST2 = 30%, TE = 40%.
 */
export const EXS_SUBWEIGHTS = {
    st1: 0.30, // First Summative Test
    st2: 0.30, // Second Summative Test
    te:  0.40, // Term Examination
} as const;

/**
 * Clusters where EXs consists ONLY of TE (no STs), so TE carries 100% of EXs weight.
 * Applies to: SHS Field Exposure, Arts Apprenticeship, Creative Production and Innovation.
 */
export const EXS_TE_ONLY_CLUSTERS: SubjectCluster[] = ['shs_field_exposure'];

/**
 * Clusters that have NO EXs component (weight is already 0).
 * Applies to: Research Electives, Design and Innovation, Work Immersion.
 */
export const EXS_NONE_CLUSTERS: SubjectCluster[] = ['shs_research', 'shs_immersion'];

/**
 * Compute the weighted Percentage Score for the Examinations (EXs) component.
 * Per the DepEd Order: ST1 = 30%, ST2 = 30%, TE = 40% of the EXs component.
 *
 * For clusters with TE-only EXs (e.g. Field Exposure), TE carries 100%.
 * For clusters with no EXs (e.g. Research/Work Immersion), returns 0.
 *
 * @param st1Score - Student's raw score on Summative Test 1
 * @param st1HPS   - Highest Possible Score for ST1
 * @param st2Score - Student's raw score on Summative Test 2
 * @param st2HPS   - Highest Possible Score for ST2
 * @param teScore  - Student's raw score on Term Examination
 * @param teHPS    - Highest Possible Score for TE
 * @param cluster  - Subject cluster to determine EXs mode
 * @returns A percentage score (0–100) for the EXs component
 */
export function computeExamsWeightedScore(
    st1Score: number | string | null | undefined, st1HPS: number,
    st2Score: number | string | null | undefined, st2HPS: number,
    teScore: number | string | null | undefined, teHPS: number,
    cluster: SubjectCluster
): number {
    // No EXs component for these clusters
    if (EXS_NONE_CLUSTERS.includes(cluster)) return 0;

    const parseVal = (val: number | string | null | undefined): number | null => {
        if (val === '' || val === null || val === undefined) return null;
        const n = Number(val);
        return isNaN(n) ? null : n;
    };

    const s1 = parseVal(st1Score);
    const s2 = parseVal(st2Score);
    const te = parseVal(teScore);

    // TE-only EXs: TE gets 100% of the EXs percentage score
    if (EXS_TE_ONLY_CLUSTERS.includes(cluster)) {
        if (teHPS <= 0 || te === null) return 0;
        return Math.min(100, Math.max(0, (te / teHPS) * 100));
    }

    let ps = 0;
    let totalWeightGiven = 0;

    if (st1HPS > 0 && s1 !== null) {
        const pct1 = Math.min(100, Math.max(0, (s1 / st1HPS) * 100));
        ps += pct1 * 0.30;
        totalWeightGiven += 0.30;
    }
    if (st2HPS > 0 && s2 !== null) {
        const pct2 = Math.min(100, Math.max(0, (s2 / st2HPS) * 100));
        ps += pct2 * 0.30;
        totalWeightGiven += 0.30;
    }
    if (teHPS > 0 && te !== null) {
        const pctTe = Math.min(100, Math.max(0, (te / teHPS) * 100));
        ps += pctTe * 0.40;
        totalWeightGiven += 0.40;
    }

    if (totalWeightGiven <= 0) return 0;
    
    // Normalize based on tests actually administered (e.g., if TE is missing, ST1+ST2 accounts for 100% of the grade so far)
    return Math.min(100, Math.max(0, ps / totalWeightGiven));
}

// Determine subject cluster based on subject name, grade level, and track
export function getSubjectCluster(subjectName: string, gradeLevel?: string, track?: string): SubjectCluster {
    const name = subjectName.toLowerCase();
    const cleanName = name.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const isSHS = gradeLevel ? (gradeLevel.includes('11') || gradeLevel.includes('12')) : false;

    if (isSHS) {
        const isG12 = gradeLevel ? gradeLevel.includes('12') : false;
        
        if (isG12) {
            // Check if Core Subject
            const norm = subjectName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
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
            const isCore = cores.some(c => {
                const cNorm = c.toLowerCase().replace(/[^a-z0-9]/g, '');
                return norm === cNorm || norm.includes(cNorm) || cNorm.includes(norm);
            });

            if (isCore) {
                return 'g12_core';
            }

            // Determine if track is TVL
            const isTVL = track ? (
                track.toLowerCase().includes('tvl') || 
                track.toLowerCase().includes('techpro') || 
                track.toLowerCase().includes('he') || 
                track.toLowerCase().includes('ict') ||
                track.toLowerCase().includes('sports') ||
                track.toLowerCase().includes('arts')
            ) : false;

            if (isTVL) {
                return 'g12_tvl_all';
            }

            // Check if Academic Track Immersion/Research
            const isImmersionResearch = 
                name.includes('work immersion') || cleanName.includes('workimmersion') ||
                name.includes('research') || name.includes('inquiries') || name.includes('investigation') ||
                name.includes('business') || name.includes('simulation') || name.includes('enterprise') ||
                name.includes('exhibit') || name.includes('performance');

            if (isImmersionResearch) {
                return 'g12_academic_immersion_research';
            }

            return 'g12_academic_other';
        }

        // Grade 11 logic
        // 1. Work Immersion
        if (name.includes('work immersion') || cleanName.includes('workimmersion')) {
            return 'shs_immersion';
        }
        // 2. Research Electives
        if (name.includes('research') || name.includes('inquiries') || name.includes('investigation') || name.includes('design and innovation') || cleanName.includes('designandinnovation')) {
            return 'shs_research';
        }
        // 3. Field Exposure
        if (name.includes('field exposure') || cleanName.includes('fieldexposure') || name.includes('apprenticeship') || name.includes('creative production') || cleanName.includes('creativeproduction')) {
            return 'shs_field_exposure';
        }
        // 4. Arts & Sports
        if (name.includes('creative industries') || cleanName.includes('creativeindustries') || 
            name.includes('arts 1') || name.includes('arts 2') || name.includes('arts1') || name.includes('arts2') ||
            name.includes('movement') || name.includes('fitness') || name.includes('recreation') || 
            name.includes('sports') || name.includes('dance') || name.includes('coaching') || name.includes('officiating')) {
            return 'shs_arts_sports';
        }
        // 5. TechPro Electives
        const techPros = [
            'aesthetic services', 'aesthethic services', 'beauty care', 'barbering services', 'caregiving', 'hairdressing', 'wellness services', 'hilot',
            'agricultural crops', 'agro-entrepreneurship', 'aquaculture', 'fish capture', 'food processing',
            'organic agriculture', 'poultry production', 'ruminants production', 'swine production', 'garments artisanry',
            'handicrafts', 'weaving', 'automotive servicing', 'electrical repair', 'engine and chassis', 'driving',
            'motorcycle', 'small engine', 'carpentry', 'construction operation', 'manual metal arc welding', 'welding',
            'technical drafting', 'animation', 'illustration', 'visual graphics', 'bakery operation',
            'events management', 'food and beverage', 'hotel operation', 'front office', 'housekeeping', 'kitchen operations',
            'tourism services', 'commercial air-conditioning', 'domestic refrigeration',
            'electrical installation', 'electronics product', 'mechatronics', 'photovoltaic systems', 'broadband installation',
            'computer programming', 'java', '.net', 'oracle', 'computer systems servicing', 'contact center', 'marine engineering',
            'marine transportation', 'support level', 'ships catering'
        ];
        if (techPros.some(tp => name.includes(tp) || cleanName.includes(tp.replace(/\s+/g, '')))) {
            return 'shs_techpro';
        }
        // Default SHS Academic/Core
        return 'shs_core_academic';
    }

    // Elementary & JHS mapping
    if (name.includes('mapeh') || cleanName.includes('mapeh') ||
        name.includes('music') || cleanName.includes('music') ||
        name.includes('arts') || cleanName.includes('arts') ||
        name.includes('physical education') || cleanName.includes('physicaleducation') ||
        name.includes('health') || cleanName.includes('health') ||
        name.includes('specialization') || cleanName.includes('specialization') ||
        name.includes('tle') || cleanName.includes('tle') ||
        name.includes('technology and livelihood') || cleanName.includes('technologyandlivelihood') ||
        name.includes('epp') || cleanName.includes('epp') ||
        name.includes('edukasyong pantahanan') || cleanName.includes('edukasyongpantahanan')) {
        return 'mapeh_tle';
    }

    // Science and Math cluster (20/50/30)
    if (name.includes('science') || cleanName.includes('science') ||
        name.includes('mathematics') || cleanName.includes('mathematics') ||
        name.includes('math') || cleanName.includes('math')) {
        return 'science_math';
    }

    // Languages, AP, GMRC, Makabansa cluster (20/50/30) - default
    // Includes: Language, Reading, Makabansa, GMRC, Arabic, Islamic
    return 'languages_ap_esp';
}

// Get weights based on subject cluster
export function getWeights(cluster: SubjectCluster, subject?: { written_weight?: number; performance_weight?: number; exam_weight?: number }) {
    if (subject && 
        typeof subject.written_weight === 'number' && 
        typeof subject.performance_weight === 'number' && 
        typeof subject.exam_weight === 'number') {
        return {
            written_works: subject.written_weight,
            performance_tasks: subject.performance_weight,
            quarterly_exam: subject.exam_weight
        };
    }
    switch (cluster) {
        case 'science_math':
            return WEIGHTS_SCIENCE_MATH;
        case 'mapeh_tle':
            return WEIGHTS_MAPEH_TLE;
        case 'shs_core_academic':
            return WEIGHTS_SHS_CORE_ACADEMIC;
        case 'shs_field_exposure':
            return WEIGHTS_SHS_FIELD_EXPOSURE;
        case 'shs_arts_sports':
            return WEIGHTS_SHS_ARTS_SPORTS;
        case 'shs_research':
            return WEIGHTS_SHS_RESEARCH;
        case 'shs_techpro':
            return WEIGHTS_SHS_TECHPRO;
        case 'shs_immersion':
            return WEIGHTS_SHS_IMMERSION;
        case 'g12_core':
            return WEIGHTS_G12_CORE;
        case 'g12_academic_other':
            return WEIGHTS_G12_ACADEMIC_OTHER;
        case 'g12_academic_immersion_research':
            return WEIGHTS_G12_ACADEMIC_IMMERSION_RESEARCH;
        case 'g12_tvl_all':
            return WEIGHTS_G12_TVL_ALL;
        case 'languages_ap_esp':
        default:
            return WEIGHTS_LANGUAGES_AP_ESP;
    }
}

// Transmutation table (DepEd Order 15 s. 2026 / Adjusted for SY 2026-2027)
export function transmuteGrade(initialGrade: number, schoolYear?: string): number {
    const roundedGrade = Math.round(initialGrade * 100) / 100;
    const score = Math.min(100, Math.max(0, roundedGrade)); // Clamp 0-100
    
    // Parse the school year, defaulting to the store's activeSchoolYear
    let sy = schoolYear;
    try {
        if (!sy) {
            sy = useAppStore.getState().activeSchoolYear;
        }
    } catch (_e) {
        // useAppStore might not be initialized or available in test environments
    }
    if (!sy) sy = '2026-2027'; // Fallback to transition SY


    // Parse the school year start year
    const syStart = parseInt(sy.split('-')[0]) || 2026;

    // Beginning SY 2027-2028, a zero-based grading system is implemented: no transmutation.
    if (syStart >= 2027) {
        return Math.round(score);
    }

    // Check if it's SY 2026-2027 for the adjusted transmutation table
    const isTransitionSY = sy === '2026-2027';

    if (isTransitionSY) {
        // Table 4: Adjusted Transmutation Table (only for SY 2026-2027)
        const transmutationRanges = [
            { min: 99.50, max: 100.00, grade: 100 },
            { min: 98.32, max: 99.49, grade: 99 },
            { min: 97.14, max: 98.31, grade: 98 },
            { min: 95.96, max: 97.13, grade: 97 },
            { min: 94.78, max: 95.95, grade: 96 },
            { min: 93.60, max: 94.77, grade: 95 },
            { min: 92.42, max: 93.59, grade: 94 },
            { min: 91.24, max: 92.41, grade: 93 },
            { min: 90.06, max: 91.23, grade: 92 },
            { min: 88.88, max: 90.05, grade: 91 },
            { min: 87.70, max: 88.87, grade: 90 },
            { min: 86.52, max: 87.69, grade: 89 },
            { min: 85.34, max: 86.51, grade: 88 },
            { min: 84.16, max: 85.33, grade: 87 },
            { min: 82.98, max: 84.15, grade: 86 },
            { min: 81.80, max: 82.97, grade: 85 },
            { min: 80.62, max: 81.79, grade: 84 },
            { min: 79.44, max: 80.61, grade: 83 },
            { min: 78.26, max: 79.43, grade: 82 },
            { min: 77.08, max: 78.25, grade: 81 },
            { min: 75.90, max: 77.07, grade: 80 },
            { min: 74.72, max: 75.89, grade: 79 },
            { min: 73.54, max: 74.71, grade: 78 },
            { min: 72.36, max: 73.53, grade: 77 },
            { min: 71.18, max: 72.35, grade: 76 },
            { min: 70.00, max: 71.17, grade: 75 },
            { min: 65.34, max: 69.99, grade: 74 },
            { min: 60.67, max: 65.33, grade: 73 },
            { min: 56.01, max: 60.66, grade: 72 },
            { min: 51.34, max: 56.00, grade: 71 },
            { min: 46.67, max: 51.33, grade: 70 },
            { min: 42.01, max: 46.66, grade: 69 },
            { min: 37.34, max: 42.00, grade: 68 },
            { min: 32.68, max: 37.33, grade: 67 },
            { min: 28.01, max: 32.67, grade: 66 },
            { min: 23.35, max: 28.00, grade: 65 },
            { min: 18.68, max: 23.34, grade: 64 },
            { min: 14.01, max: 18.67, grade: 63 },
            { min: 9.35,  max: 14.00, grade: 62 },
            { min: 4.68,  max: 9.34,  grade: 61 },
            { min: 0.00,  max: 4.67,  grade: 60 },
        ];
        const matched = transmutationRanges.find((range) => score >= range.min && score <= range.max);
        return matched ? matched.grade : 60;
    }

    // Default DO 8 s. 2015 Transmutation Table
    const transmutationRanges = [
        { min: 99.5, max: 100.0, grade: 100 },
        { min: 97.5, max: 99.49, grade: 99 },
        { min: 96.0, max: 97.49, grade: 98 },
        { min: 95.0, max: 95.99, grade: 97 },
        { min: 94.0, max: 94.99, grade: 96 },
        { min: 93.0, max: 93.99, grade: 95 },
        { min: 92.0, max: 92.99, grade: 94 },
        { min: 91.0, max: 91.99, grade: 93 },
        { min: 90.0, max: 90.99, grade: 92 },
        { min: 89.0, max: 89.99, grade: 91 },
        { min: 88.0, max: 88.99, grade: 90 },
        { min: 87.0, max: 87.99, grade: 89 },
        { min: 86.0, max: 86.99, grade: 88 },
        { min: 85.0, max: 85.99, grade: 87 },
        { min: 84.0, max: 84.99, grade: 86 },
        { min: 83.0, max: 83.99, grade: 85 },
        { min: 82.0, max: 82.99, grade: 84 },
        { min: 81.0, max: 81.99, grade: 83 },
        { min: 80.0, max: 80.99, grade: 82 },
        { min: 79.0, max: 79.99, grade: 81 },
        { min: 78.0, max: 78.99, grade: 80 },
        { min: 77.0, max: 77.99, grade: 79 },
        { min: 76.0, max: 76.99, grade: 78 },
        { min: 75.0, max: 75.99, grade: 77 },
        { min: 73.0, max: 74.99, grade: 76 },
        { min: 70.0, max: 72.99, grade: 75 },
        { min: 68.0, max: 69.99, grade: 74 },
        { min: 66.0, max: 67.99, grade: 73 },
        { min: 64.0, max: 65.99, grade: 72 },
        { min: 62.0, max: 63.99, grade: 71 },
        { min: 60.0, max: 61.99, grade: 70 },
        { min: 58.0, max: 59.99, grade: 69 },
        { min: 56.0, max: 57.99, grade: 68 },
        { min: 54.0, max: 55.99, grade: 67 },
        { min: 52.0, max: 53.99, grade: 66 },
        { min: 50.0, max: 51.99, grade: 65 },
        { min: 48.0, max: 49.99, grade: 64 },
        { min: 46.0, max: 47.99, grade: 63 },
        { min: 43.0, max: 45.99, grade: 62 },
        { min: 40.0, max: 42.99, grade: 61 },
        { min: 25.0, max: 39.99, grade: 60 },
        { min: 0.0, max: 24.0, grade: 60 },
    ];
    const matched = transmutationRanges.find((range) => score >= range.min && score <= range.max);
    return matched ? matched.grade : 60;
}

// ─── SY-Aware Descriptive Grading (KS1 Transition) ─────────────────────────

/**
 * Returns true if a grade level is under DESCRIPTIVE grading for the given SY.
 * Per DepEd Order (KS1 Transition):
 *  - SY 2026-2027: Descriptive for Kindergarten and Grade 1
 *  - SY 2027-2028: Descriptive for Kindergarten, Grade 1, Grade 2
 *  - SY 2028-2029+: Descriptive for all KS1 (Kindergarten to Grade 3)
 *
 * @param gradeLevel - e.g. "Grade 1", "Kindergarten", "Grade 3"
 * @param schoolYear - e.g. "2026-2027" (defaults to 2026-2027 if not provided)
 */
export function isDescriptiveGrading(gradeLevel: string, schoolYear?: string): boolean {
    const gl = (gradeLevel || '').toLowerCase();
    if (gl.includes('kinder')) return true; // Always descriptive

    const gradeNum = parseInt(gl.replace(/\D/g, '')) || 0;
    if (gradeNum < 1 || gradeNum > 3) return false; // Only KS1 (G1-G3) ever go descriptive

    // Parse the school year, defaulting to the store's activeSchoolYear
    let sy = schoolYear;
    try {
        if (!sy) {
            sy = useAppStore.getState().activeSchoolYear;
        }
    } catch (_e) {
        // useAppStore might not be initialized
    }
    if (!sy) sy = '2026-2027';

    // Parse the school year start year
    const syStart = parseInt(sy.split('-')[0]) || 2026;

    if (syStart >= 2028) return gradeNum >= 1 && gradeNum <= 3; // G1-G3 all descriptive
    if (syStart >= 2027) return gradeNum <= 2;                   // G1-G2 descriptive
    return gradeNum <= 1;                                        // SY 2026-2027: G1 only
}

// ─── Grade Stage Checkers ─────────────────────────────────────────────────────

export function isKindergarten(gradeLevel: string): boolean {
    const gl = (gradeLevel || '').toLowerCase();
    return gl.includes('kinder');
}

export function isGrade1To3(gradeLevel: string): boolean {
    const gl = (gradeLevel || '').toLowerCase();
    if (gl.includes('grade')) {
        const num = parseInt(gl.replace(/\D/g, '')) || 0;
        return num >= 1 && num <= 3;
    }
    return false;
}

export function isKeyStage1(gradeLevel: string): boolean {
    return isKindergarten(gradeLevel) || isGrade1To3(gradeLevel);
}

export function isSHS(gradeLevel: string): boolean {
    const gl = (gradeLevel || '').toLowerCase();
    return gl.includes('11') || gl.includes('12') || gl.includes('shs');
}

// Letter grade transmutes for Key Stage 1
export function getKs1LetterGrade(numericGrade: number, gradeLevel: string): string {
    const score = Math.round(numericGrade);
    
    if (isKindergarten(gradeLevel)) {
        if (score >= 80) return 'C';
        if (score >= 65) return 'D';
        return 'B';
    }
    
    if (isGrade1To3(gradeLevel)) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 75) return 'C';
        if (score >= 65) return 'D';
        return 'E';
    }
    
    return String(score);
}

// English/Filipino descriptor for KS1 letter grades
export function getKs1Descriptor(letterGrade: string, gradeLevel: string): string {
    const lg = (letterGrade || '').toUpperCase().trim();
    
    if (isKindergarten(gradeLevel)) {
        switch (lg) {
            case 'C': return 'Consistent';
            case 'D': return 'Developing';
            case 'B': return 'Beginning';
            default: return '';
        }
    }
    
    // Grades 1-3
    switch (lg) {
        case 'A': return 'Advancing';
        case 'B': return 'Benchmarking';
        case 'C': return 'Connecting';
        case 'D': return 'Developing';
        case 'E': return 'Emerging';
        default: return '';
    }
}

// Unified qualitative descriptors for Grades 4-12 (KS2-KS4) or KS1 letters
export function getGradeDescriptorWithFilipino(grade: number, gradeLevel: string, schoolYear?: string): string {
    if (!grade || grade <= 0) return '';
    
    if (isDescriptiveGrading(gradeLevel, schoolYear)) {
        const letter = getKs1LetterGrade(grade, gradeLevel);
        return getKs1Descriptor(letter, gradeLevel);
    }
    
    // Grades 4-12
    if (grade >= 90) return 'Advancing';
    if (grade >= 80) return 'Benchmarking';
    if (grade >= 75) return 'Connecting';
    if (grade >= 65) return 'Developing';
    return 'Emerging';
}

// Formatter to display numerical grade as descriptive letter (for KS1) or rounded number (for KS2-KS4)
export function formatGradeForDisplay(numericGrade: number | string | null | undefined, gradeLevel: string, schoolYear?: string): string {
    if (numericGrade === null || numericGrade === undefined || numericGrade === '') return '';
    
    // If it's already a letter like A, B, C, D, E, just return it
    const strVal = String(numericGrade).trim();
    if (/^[A-E]$/i.test(strVal)) return strVal.toUpperCase();
    
    const grade = Number(numericGrade);
    if (isNaN(grade) || grade <= 0) return strVal;
    
    if (isDescriptiveGrading(gradeLevel, schoolYear)) {
        return getKs1LetterGrade(grade, gradeLevel);
    }
    
    return String(Math.round(grade));
}

