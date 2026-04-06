// Grading helper utilities

import type { ClassRecord, Student, Subject, Section } from '../types';

export interface HonorStudent {
    student: Student;
    sectionName: string;
    generalAverage: number;
    honorType: 'With Highest Honors' | 'With High Honors' | 'With Honors';
    subjectGrades: { subjectName: string; grade: number }[];
}

/**
 * Compute general average for a student across all subjects for a given quarter
 */
export function computeStudentAverage(
    studentLrn: string,
    quarter: 1 | 2 | 3 | 4,
    classRecords: ClassRecord[],
    subjects: Subject[]
): number {
    const studentRecords = classRecords.filter(
        r => r.student_lrn === studentLrn && r.quarter === quarter && (r.final_grade ?? 0) > 0
    );

    if (studentRecords.length === 0) return 0;

    const total = studentRecords.reduce((sum, r) => sum + (r.final_grade ?? 0), 0);
    return Math.round((total / studentRecords.length) * 100) / 100;
}

/**
 * Compute general average across all quarters for a student
 */
export function computeYearlyAverage(
    studentLrn: string,
    classRecords: ClassRecord[],
    subjects: Subject[]
): number {
    const quarters: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
    const quarterAverages = quarters
        .map(q => computeStudentAverage(studentLrn, q, classRecords, subjects))
        .filter(avg => avg > 0);

    if (quarterAverages.length === 0) return 0;
    return Math.round((quarterAverages.reduce((a, b) => a + b, 0) / quarterAverages.length) * 100) / 100;
}

/**
 * Get honor roll based on general average
 */
export function getHonorType(average: number): HonorStudent['honorType'] | null {
    if (average >= 98) return 'With Highest Honors';
    if (average >= 95) return 'With High Honors';
    if (average >= 90) return 'With Honors';
    return null;
}

/**
 * Generate honor roll list for a section
 */
export function generateHonorRoll(
    students: Student[],
    classRecords: ClassRecord[],
    subjects: Subject[],
    sections: Section[],
    quarter: 1 | 2 | 3 | 4
): HonorStudent[] {
    const honorStudents: HonorStudent[] = [];

    for (const student of students) {
        const avg = computeStudentAverage(student.lrn, quarter, classRecords, subjects);
        const honorType = getHonorType(avg);

        if (honorType && avg > 0) {
            const section = sections.find(s => s.section_name === student.student_section);
            const studentRecords = classRecords.filter(
                r => r.student_lrn === student.lrn && r.quarter === quarter && (r.final_grade ?? 0) > 0
            );

            const subjectGrades = studentRecords.map(r => {
                const subject = subjects.find(s => s.id === r.subject_id);
                return {
                    subjectName: subject?.subject_name || 'Unknown',
                    grade: r.final_grade ?? 0,
                };
            });

            honorStudents.push({
                student,
                sectionName: section?.section_name || student.student_section || 'Unknown',
                generalAverage: avg,
                honorType,
                subjectGrades,
            });
        }
    }

    return honorStudents.sort((a, b) => b.generalAverage - a.generalAverage);
}

/**
 * Get at-risk students (below 75 in any subject)
 */
export function getAtRiskStudents(
    students: Student[],
    classRecords: ClassRecord[],
    subjects: Subject[],
    quarter: 1 | 2 | 3 | 4
): { student: Student; subjectName: string; grade: number }[] {
    const atRisk: { student: Student; subjectName: string; grade: number }[] = [];

    for (const record of classRecords) {
        if (record.quarter !== quarter) continue;
        if ((record.final_grade ?? 0) <= 0) continue;
        if ((record.final_grade ?? 0) >= 75) continue;

        const student = students.find(s => s.lrn === record.student_lrn);
        const subject = subjects.find(s => s.id === record.subject_id);

        if (student) {
            atRisk.push({
                student,
                subjectName: subject?.subject_name || 'Unknown',
                grade: record.final_grade ?? 0,
            });
        }
    }

    return atRisk.sort((a, b) => a.grade - b.grade);
}

/**
 * Get MPS (Mean Percentage Score) per subject
 */
export function getMPSPerSubject(
    classRecords: ClassRecord[],
    subjects: Subject[],
    quarter: 1 | 2 | 3 | 4
): { subjectName: string; mps: number; passRate: number; totalStudents: number }[] {
    const subjectMap = new Map<string, number[]>();

    for (const record of classRecords) {
        if (record.quarter !== quarter) continue;
        if ((record.final_grade ?? 0) <= 0) continue;

        const subject = subjects.find(s => s.id === record.subject_id);
        const key = subject?.subject_name || record.subject_id;

        if (!subjectMap.has(key)) subjectMap.set(key, []);
        subjectMap.get(key)!.push(record.final_grade ?? 0);
    }

    return Array.from(subjectMap.entries()).map(([subjectName, grades]) => {
        const mps = Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100;
        const passing = grades.filter(g => g >= 75).length;
        const passRate = Math.round((passing / grades.length) * 100);

        return {
            subjectName,
            mps,
            passRate,
            totalStudents: grades.length,
        };
    }).sort((a, b) => b.mps - a.mps);
}
