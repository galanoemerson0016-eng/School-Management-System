/**
 * Official DepEd Order No. 017, s. 2026 (Strengthened Senior High School Curriculum)
 * Retention, Promotion, and Graduation Requirements (Tables 9 & 10)
 */

import { findElectiveInCatalog, normalizeElectiveTitle } from './sshsCatalog';

export interface SubjectGraduationRecord {
    subjectName: string;
    finalGrade: number;
    gradeLevel?: string;
    isPassed: boolean;
}

export interface ShsGraduationEvaluation {
    isEligible: boolean;
    status: 'Eligible' | 'Incomplete' | 'Disqualified';
    track: 'Academic' | 'Tech-Pro';
    isCrossTrack: boolean;
    totalHours: number;
    requiredTotalHours: number;
    coreHours: number;
    requiredCoreHours: number;
    electiveHours: number;
    requiredElectiveHours: number;
    coreSubjectsCount: number;
    electiveSubjectsCount: number;
    passedSubjects: string[];
    failedSubjects: string[];
    missingRequirements: string[];
    disqualificationReason?: string;
}

const G11_CORE_SUBJECTS = [
    'effective communication',
    'mabisang komunikasyon',
    'general mathematics',
    'general science',
    'life and career skills',
    'pag-aaral ng kasaysayan at lipunang pilipino'
];

export function isG11CoreSubject(name: string): boolean {
    const norm = normalizeElectiveTitle(name);
    return G11_CORE_SUBJECTS.some(core => {
        const coreNorm = normalizeElectiveTitle(core);
        return norm === coreNorm || norm.includes(coreNorm) || coreNorm.includes(norm);
    });
}

export function evaluateShsGraduationStatus(
    track: 'Academic' | 'Tech-Pro',
    records: SubjectGraduationRecord[],
    options?: {
        isCrossTrack?: boolean;
    }
): ShsGraduationEvaluation {
    const isCrossTrack = Boolean(options?.isCrossTrack);
    const passedRecords = records.filter(r => r.isPassed || r.finalGrade >= 75);
    const failedRecords = records.filter(r => !r.isPassed && r.finalGrade < 75);

    let coreHours = 0;
    let electiveHours = 0;
    let coreCount = 0;
    let acadElectiveCount = 0;
    let techProElectiveCount = 0;
    let workImmersionCount = 0;

    const coreSeen = new Set<string>();

    for (const r of passedRecords) {
        if (isG11CoreSubject(r.subjectName)) {
            const norm = normalizeElectiveTitle(r.subjectName);
            if (!coreSeen.has(norm)) {
                coreSeen.add(norm);
                coreCount += 1;
                coreHours += 160; // 160 hours per Core
            }
        } else {
            // Elective subject
            const catalogItem = findElectiveInCatalog(r.subjectName);
            let hours: number = catalogItem ? catalogItem.hours : 80;
            const norm = normalizeElectiveTitle(r.subjectName);
            
            if (norm.includes('workimmersion')) {
                hours = 320;
            }

            electiveHours += hours;

            if (catalogItem?.category === 'work_immersion' || norm.includes('workimmersion')) {
                workImmersionCount += 1;
            } else if (catalogItem?.track === 'Tech-Pro' || hours >= 320) {
                techProElectiveCount += 1;
            } else {
                acadElectiveCount += 1;
            }
        }
    }

    const totalHours = coreHours + electiveHours;
    const missingRequirements: string[] = [];

    const requiredCoreHours = 800; // 5 Core subjects * 160 hours
    const requiredTotalHours = track === 'Academic' ? 2000 : 2080;
    const requiredElectiveHours = track === 'Academic' ? 1200 : 1280;

    // 1. Verify Core subjects (5 subjects, 800 hours)
    if (coreCount < 5 || coreHours < requiredCoreHours) {
        missingRequirements.push(`Missing Core Subjects (${coreCount}/5 completed, ${coreHours}/${requiredCoreHours} hrs)`);
    }

    // 2. Track Specific Checks
    if (track === 'Academic') {
        if (!isCrossTrack) {
            // Pure Academic Track (Table 9)
            if (electiveHours < 1200) {
                missingRequirements.push(`Insufficient Academic Elective hours (${electiveHours}/1,200 hrs)`);
            }
        } else {
            // Academic Track with Cross-Track (Table 9)
            if (techProElectiveCount < 1) {
                missingRequirements.push('Missing 1 Grade 12 Tech-Pro Elective (320 hrs) for Cross-Track pathway');
            }
            if (electiveHours < 1200) {
                missingRequirements.push(`Insufficient total elective hours (${electiveHours}/1,200 hrs)`);
            }
        }
    } else {
        // Tech-Pro Track (Table 10)
        if (workImmersionCount < 1) {
            missingRequirements.push('Missing mandatory Work Immersion (min 320 hrs)');
        }
        if (electiveHours < 1280) {
            missingRequirements.push(`Insufficient Tech-Pro Elective & Immersion hours (${electiveHours}/1,280 hrs)`);
        }
        if (isCrossTrack && acadElectiveCount < 4) {
            missingRequirements.push(`Missing Cross-Track Academic Electives (${acadElectiveCount}/4 completed, min 320 hrs)`);
        }
    }

    // 3. Extra Elective Disqualification Rule (DO 017 Section 26.b)
    // "failing any extra Elective taken will disqualify them from graduation."
    const failedElectives = failedRecords.map(r => r.subjectName);
    let status: 'Eligible' | 'Incomplete' | 'Disqualified' = 'Incomplete';
    let disqualificationReason: string | undefined;

    if (failedElectives.length > 0) {
        status = 'Disqualified';
        disqualificationReason = `DepEd Order No. 017, s. 2026 (Section 26.b): Learner failed ${failedElectives.length} enrolled elective(s) (${failedElectives.join(', ')}). Passing all enrolled electives is mandatory for graduation.`;
    } else if (missingRequirements.length === 0 && totalHours >= requiredTotalHours) {
        status = 'Eligible';
    }

    return {
        isEligible: status === 'Eligible',
        status,
        track,
        isCrossTrack,
        totalHours,
        requiredTotalHours,
        coreHours,
        requiredCoreHours,
        electiveHours,
        requiredElectiveHours,
        coreSubjectsCount: coreCount,
        electiveSubjectsCount: acadElectiveCount + techProElectiveCount + workImmersionCount,
        passedSubjects: passedRecords.map(r => r.subjectName),
        failedSubjects: failedElectives,
        missingRequirements,
        disqualificationReason
    };
}
