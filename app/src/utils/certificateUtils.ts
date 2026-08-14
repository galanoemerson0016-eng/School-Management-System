import type { ClassRecord, Subject, HPSRecord } from '../types';
import { ACTIVE_TERMS } from '../lib/terms';
import { resolveStudentQuarterGrade } from './grading-helpers';

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
    if (average >= 90 && average <= 100) {
        return {
            tagalog: 'Gawad sa Akademikong Kahusayan',
            english: 'Academic Excellence Award',
            average
        };
    }
    return null;
}

/**
 * Helper to get active subjects for a specific section or grade level
 */
export function getSectionSubjects(
    sectionId?: string,
    sectionGradeLevel?: string,
    subjects: Subject[] = []
): Subject[] {
    if (!subjects || subjects.length === 0) return [];
    
    // 1. Check for section-specific subjects
    if (sectionId) {
        const secSubs = subjects.filter(s => s.section_id === sectionId && s.term !== 'none');
        if (secSubs.length > 0) return secSubs;
    }
    
    // 2. Check for grade-level subjects (excluding subjects explicitly assigned to another section)
    if (sectionGradeLevel) {
        const secGradeNum = parseInt(sectionGradeLevel.replace(/\D/g, '')) || 0;
        const gradeSubs = subjects.filter(s => {
            if (s.term === 'none') return false;
            if (s.section_id && s.section_id !== sectionId) return false;
            const subGradeNum = parseInt((s.grade_level || '').toString().replace(/\D/g, '')) || 0;
            return secGradeNum > 0 ? subGradeNum === secGradeNum : true;
        });
        if (gradeSubs.length > 0) return gradeSubs;
    }
    
    return subjects.filter(s => s.term !== 'none');
}

/**
 * Calculates General Average for a student in a specific quarter or EOSY
 */
export function calculateStudentAverage(
    studentLrn: string,
    term: 1 | 2 | 3 | 'EOSY',
    records: ClassRecord[],
    subjects: Subject[],
    schoolYear: string,
    classRecords: ClassRecord[] = [],
    hpsRecords: HPSRecord[] = [],
    sectionGradeLevel?: string,
    sectionTrack?: string,
    sectionId?: string
): number {
    const targetLrn = String(studentLrn || '').trim();
    const sectionSubjects = getSectionSubjects(sectionId, sectionGradeLevel, subjects);

    let candidateSubjects: { id: string; name: string }[] = sectionSubjects.map(s => ({ id: s.id, name: s.subject_name }));

    // Fallback: If no candidate subjects derived from section/store, check student records
    if (candidateSubjects.length === 0) {
        const allRecords = [...records, ...classRecords];
        const studentRecords = allRecords.filter(r => 
            String(r.student_lrn || '').trim() === targetLrn && 
            (!schoolYear || !r.school_year || r.school_year === schoolYear || r.school_year.includes(schoolYear) || schoolYear.includes(r.school_year || ''))
        );

        studentRecords.forEach(r => {
            const subId = r.subject_id;
            const subName = r.subject_name || subId;
            const normName = (subName || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

            const exists = candidateSubjects.some(c => 
                c.id === subId || 
                (c.name && c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normName)
            );

            if (!exists) {
                candidateSubjects.push({ id: subId, name: subName });
            }
        });
    }

    if (candidateSubjects.length === 0) return 0;

    let totalPoints = 0;
    let subjectCount = 0;

    candidateSubjects.forEach(sub => {
        if (term === 'EOSY') {
            // Average of all 3 terms for this subject
            const termGrades = ACTIVE_TERMS.map(q => {
                return resolveStudentQuarterGrade(
                    studentLrn,
                    sub.id,
                    q,
                    schoolYear,
                    classRecords,
                    records,
                    hpsRecords,
                    sectionGradeLevel,
                    sectionTrack
                );
            }).filter(g => g > 0);

            if (termGrades.length === 3) {
                const finalSubGrade = Math.round(termGrades.reduce((a, b) => a + b, 0) / 3);
                totalPoints += finalSubGrade;
                subjectCount++;
            }
        } else {
            // Single-term grade
            const grade = resolveStudentQuarterGrade(
                studentLrn,
                sub.id,
                term,
                schoolYear,
                classRecords,
                records,
                hpsRecords,
                sectionGradeLevel,
                sectionTrack
            );
            if (grade > 0) {
                totalPoints += grade;
                subjectCount++;
            }
        }
    });

    return subjectCount > 0 ? Number((totalPoints / subjectCount).toFixed(2)) : 0;
}
