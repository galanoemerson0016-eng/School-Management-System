// Grade computation weights based on current school policy

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
export function getWeights(cluster: SubjectCluster) {
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

// Transmutation table (DepEd Order 8 s. 2015)
export function transmuteGrade(initialGrade: number): number {
    const score = Math.min(100, Math.max(0, initialGrade)); // Clamp 0-100

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
        { min: 0.0, max: 24.0, grade: 60 }, // default minimum
    ];

    const matched = transmutationRanges.find((range) => score >= range.min && score <= range.max);
    return matched ? matched.grade : 60;
}

// Grade stage checkers
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
            case 'C': return 'Consistent (Palagiang Naipapakita)';
            case 'D': return 'Developing (Umuusbong)';
            case 'B': return 'Beginning (Nagsisimula)';
            default: return '';
        }
    }
    
    // Grades 1-3
    switch (lg) {
        case 'A': return 'Advancing (Namumukod-tangi)';
        case 'B': return 'Benchmarking (Napamamalas)';
        case 'C': return 'Connecting (Natutungo)';
        case 'D': return 'Developing (Napauunlad)';
        case 'E': return 'Emerging (Nagsisimula)';
        default: return '';
    }
}

// Unified qualitative descriptors for Grades 4-12 (KS2-KS4) or KS1 letters
export function getGradeDescriptorWithFilipino(grade: number, gradeLevel: string): string {
    if (!grade || grade <= 0) return '';
    
    if (isKeyStage1(gradeLevel)) {
        const letter = getKs1LetterGrade(grade, gradeLevel);
        return getKs1Descriptor(letter, gradeLevel);
    }
    
    // Grades 4-12
    if (grade >= 90) return 'Advancing (Namumukod-tangi)';
    if (grade >= 80) return 'Benchmarking (Napamamalas)';
    if (grade >= 75) return 'Connecting (Natutungo)';
    if (grade >= 65) return 'Developing (Napauunlad)';
    return 'Emerging (Nasisimula)';
}

// Formatter to display numerical grade as descriptive letter (for KS1) or rounded number (for KS2-KS4)
export function formatGradeForDisplay(numericGrade: number | string | null | undefined, gradeLevel: string): string {
    if (numericGrade === null || numericGrade === undefined || numericGrade === '') return '';
    
    // If it's already a letter like A, B, C, D, E, just return it
    const strVal = String(numericGrade).trim();
    if (/^[A-E]$/i.test(strVal)) return strVal.toUpperCase();
    
    const grade = Number(numericGrade);
    if (isNaN(grade) || grade <= 0) return strVal;
    
    if (isKeyStage1(gradeLevel)) {
        return getKs1LetterGrade(grade, gradeLevel);
    }
    
    return String(Math.round(grade));
}

