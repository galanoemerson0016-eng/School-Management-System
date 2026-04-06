// Grade computation weights per DepEd Order 8 s. 2015 (Grades 1-10)

// Subject Cluster 1: Languages, Araling Panlipunan (AP), EsP
export const WEIGHTS_LANGUAGES_AP_ESP = {
    written_works: 0.30,      // 30%
    performance_tasks: 0.50,   // 50%
    quarterly_exam: 0.20,      // 20%
};

// Subject Cluster 2: Science and Mathematics
export const WEIGHTS_SCIENCE_MATH = {
    written_works: 0.40,      // 40%
    performance_tasks: 0.40,   // 40%
    quarterly_exam: 0.20,      // 20%
};

// Subject Cluster 3: MAPEH, EPP, TLE
export const WEIGHTS_MAPEH_TLE = {
    written_works: 0.20,      // 20%
    performance_tasks: 0.60,   // 60%
    quarterly_exam: 0.20,      // 20%
};

export type SubjectCluster = 'languages_ap_esp' | 'science_math' | 'mapeh_tle';

// Determine subject cluster based on subject name
export function getSubjectCluster(subjectName: string): SubjectCluster {
    const name = subjectName.toLowerCase();

    // MAPEH, TLE, EPP cluster (20/60/20)
    if (name.includes('mapeh') ||
        name.includes('music') ||
        name.includes('arts') ||
        name.includes('physical education') ||
        name.includes('health') ||
        name.includes('tle') ||
        name.includes('technology and livelihood') ||
        name.includes('epp') ||
        name.includes('edukasyong pantahanan')) {
        return 'mapeh_tle';
    }

    // Science and Math cluster (40/40/20)
    if (name.includes('science') ||
        name.includes('mathematics') ||
        name.includes('math')) {
        return 'science_math';
    }

    // Languages, AP, EsP cluster (30/50/20) - default
    // Includes: Filipino, English, AP, EsP, Values Education
    return 'languages_ap_esp';
}

// Get weights based on subject cluster
export function getWeights(cluster: SubjectCluster) {
    switch (cluster) {
        case 'science_math':
            return WEIGHTS_SCIENCE_MATH;
        case 'mapeh_tle':
            return WEIGHTS_MAPEH_TLE;
        case 'languages_ap_esp':
        default:
            return WEIGHTS_LANGUAGES_AP_ESP;
    }
}

// Transmutation table (DepEd Order 8 s. 2015)
export function transmuteGrade(initialGrade: number): number {
    const score = Math.min(100, Math.max(0, initialGrade)); // Clamp 0-100

    // Range 0 - 59.99 (Transmuted: 60 - 74)
    if (score < 60) {
        // Using formula approximation for step size 4
        // 0-3.99 -> 60
        return 60 + Math.floor(score / 4);
    }

    // Range 60 - 100 (Transmuted: 75 - 100)
    // Step size is 1.6
    if (score >= 100) return 100;

    return 75 + Math.floor((score - 60) / 1.6);
}
