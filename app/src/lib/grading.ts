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

export type SubjectCluster = 'languages_ap_esp' | 'science_math' | 'mapeh_tle';

// Determine subject cluster based on subject name
export function getSubjectCluster(subjectName: string): SubjectCluster {
    const name = subjectName.toLowerCase();
    const cleanName = name.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

    // MAPEH, TLE, EPP, Specialization cluster (20/60/20)
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
