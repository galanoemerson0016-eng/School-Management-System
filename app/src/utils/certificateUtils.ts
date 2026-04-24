import type { ClassRecord, Subject } from '../types';
import { ACTIVE_TERMS } from '../lib/terms';

export type CertificateType = 'EOSY' | 'T1' | 'T2' | 'T3';

export interface HonorsInfo {
    tagalog: string;
    english: string;
    average: number;
}

/**
 * Determines honors category based on General Average
 */
export function getHonorsInfo(average: number): HonorsInfo | null {
    if (average >= 98 && average <= 100) {
        return {
            tagalog: 'May Pinakamataas na Karangalan',
            english: 'With Highest Honors',
            average
        };
    } else if (average >= 95 && average < 98) {
        return {
            tagalog: 'May Mataas na Karangalan',
            english: 'With High Honors',
            average
        };
    } else if (average >= 90 && average < 95) {
        return {
            tagalog: 'May Karangalan',
            english: 'With Honors',
            average
        };
    }
    return null;
}

/**
 * Calculates General Average for a student in a specific quarter or EOSY
 */
export function calculateStudentAverage(
    studentLrn: string,
    term: 1 | 2 | 3 | 'EOSY',
    records: ClassRecord[],
    subjects: Subject[],
    schoolYear: string
): number {
    const studentRecords = records.filter(r => 
        r.student_lrn === studentLrn && 
        r.school_year === schoolYear
    );

    if (studentRecords.length === 0) return 0;

    let totalPoints = 0;
    let subjectCount = 0;

    // Filter subjects linked to the section (assumed to be managed by the caller)
    // We'll iterate through all unique subjects found in the records
    const uniqueSubjectIds = Array.from(new Set(studentRecords.map(r => r.subject_id)));

    if (!subjects || subjects.length === 0) return 0;

    uniqueSubjectIds.forEach(subId => {
        const subject = subjects.find(s => s.id === subId);
        if (!subject) return;

        // Skip non-academic or composite subjects if necessary (standard DepEd logic)
        // For simplicity, we'll average all final grades available
        
        if (term === 'EOSY') {
            // Average of all 3 terms for this subject
            const termGrades = ACTIVE_TERMS.map(q => {
                const rec = studentRecords.find(r => r.subject_id === subId && r.quarter === q);
                return Number(rec?.final_grade || 0);
            }).filter(g => g > 0);

            if (termGrades.length === 3) {
                const finalSubGrade = Math.round(termGrades.reduce((a, b) => a + b, 0) / 3);
                totalPoints += finalSubGrade;
                subjectCount++;
            }
        } else {
            // Single-term grade
            const rec = studentRecords.find(r => r.subject_id === subId && r.quarter === term);
            const grade = Number(rec?.final_grade || 0);
            if (grade > 0) {
                totalPoints += grade;
                subjectCount++;
            }
        }
    });

    return subjectCount > 0 ? Number((totalPoints / subjectCount).toFixed(2)) : 0;
}
