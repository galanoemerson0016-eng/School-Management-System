// Grading helper utilities

import type { ClassRecord, Student, Subject, Section } from '../types';
import { ACTIVE_TERMS } from '../lib/terms';

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
    quarter: 1 | 2 | 3 | 4 | 'overall',
    classRecords: ClassRecord[]
): number {
    if (quarter === 'overall') {
        return computeYearlyAverage(studentLrn, classRecords);
    }

    const studentRecords = classRecords.filter(
        r => r.student_lrn === studentLrn && r.quarter === quarter && (Number(r.final_grade) || 0) > 0
    );

    if (studentRecords.length === 0) return 0;

    const total = studentRecords.reduce((sum, r) => sum + (Number(r.final_grade) || 0), 0);
    return Math.round((total / studentRecords.length) * 100) / 100;
}

/**
 * Compute general average across all quarters for a student
 */
export function computeYearlyAverage(
    studentLrn: string,
    classRecords: ClassRecord[]
): number {
    const termAverages = ACTIVE_TERMS
        .map(q => computeStudentAverage(studentLrn, q, classRecords))
        .filter(avg => avg > 0);

    if (termAverages.length === 0) return 0;
    return Math.round((termAverages.reduce((a, b) => a + b, 0) / termAverages.length) * 100) / 100;
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
    quarter: 1 | 2 | 3 | 4 | 'overall'
): HonorStudent[] {
    const honorStudents: HonorStudent[] = [];

    for (const student of students) {
        const avg = computeStudentAverage(student.lrn, quarter, classRecords);
        const honorType = getHonorType(avg);

        if (honorType && avg > 0) {
            const section = sections.find(s => s.section_name === student.student_section);
            const studentRecords = classRecords.filter(
                r => r.student_lrn === student.lrn && (quarter === 'overall' || r.quarter === quarter) && (Number(r.final_grade) || 0) > 0
            );

            const subjectGrades = studentRecords.map(r => {
                const subject = subjects.find(s => s.id === r.subject_id);
                return {
                    subjectName: subject?.subject_name || 'Unknown',
                    grade: Number(r.final_grade) || 0,
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
    quarter: 1 | 2 | 3 | 4 | 'overall'
): { student: Student; subjectName: string; grade: number }[] {
    if (quarter === 'overall') return [];
    const atRisk: { student: Student; subjectName: string; grade: number }[] = [];

    for (const record of classRecords) {
        if (record.quarter !== quarter) continue;
        const finalGrade = Number(record.final_grade) || 0;
        if (finalGrade <= 0) continue;
        if (finalGrade >= 75) continue;

        const student = students.find(s => s.lrn === record.student_lrn);
        const subject = subjects.find(s => s.id === record.subject_id);

        if (student && subject) {
            atRisk.push({
                student,
                subjectName: subject.subject_name,
                grade: Number(record.final_grade) || 0,
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
    quarter: 1 | 2 | 3 | 4 | 'overall'
): { subjectName: string; mps: number; passRate: number; totalStudents: number }[] {
    if (quarter === 'overall') return [];
    const subjectMap = new Map<string, number[]>();

    for (const record of classRecords) {
        if (record.quarter !== quarter) continue;
        const finalGrade = Number(record.final_grade) || 0;
        if (finalGrade <= 0) continue;

        const subject = subjects.find(s => s.id === record.subject_id);
        const key = subject?.subject_name || record.subject_id;

        if (!subjectMap.has(key)) subjectMap.set(key, []);
        subjectMap.get(key)!.push(finalGrade);
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

export interface SubjectAward {
    sectionName: string;
    subjectName: string;
    studentName: string;
    grade: number;
}

/**
 * Get the top student(s) for each subject within each section
 */
export function getSubjectAwardees(
    students: Student[],
    classRecords: ClassRecord[],
    subjects: Subject[],
    sections: Section[],
    quarter: 1 | 2 | 3 | 4 | 'overall'
): SubjectAward[] {
    const awards: SubjectAward[] = [];

    for (const section of sections) {
        const sectionStudents = students.filter(s => s.student_section === section.section_name);
        if (sectionStudents.length === 0) continue;

        // Group records to compute highest grade per subject
        const sectionSubjects = subjects.filter(sub => sub.section_id === section.id);

        for (const subject of sectionSubjects) {
            let topGrade = -1;
            let topStudents: Student[] = [];

            for (const student of sectionStudents) {
                let grade = 0;

                if (quarter === 'overall') {
                    const studentRecords = classRecords.filter(r => r.student_lrn === student.lrn && r.subject_id === subject.id && (Number(r.final_grade) || 0) > 0);
                    if (studentRecords.length > 0) {
                        grade = Math.round((studentRecords.reduce((sum, r) => sum + (Number(r.final_grade) || 0), 0) / studentRecords.length) * 100) / 100;
                    }
                } else {
                    const record = classRecords.find(r => r.student_lrn === student.lrn && r.subject_id === subject.id && r.quarter === quarter);
                    if (record && (Number(record.final_grade) || 0) > 0) {
                        grade = Number(record.final_grade) || 0;
                    }
                }

                if (grade > 0) {
                    if (grade > topGrade) {
                        topGrade = grade;
                        topStudents = [student];
                    } else if (grade === topGrade) {
                        topStudents.push(student);
                    }
                }
            }

            // A typical threshold for Best in Subject is at least 90
            if (topGrade >= 90) {
                for (const topStudent of topStudents) {
                    awards.push({
                        sectionName: section.section_name,
                        subjectName: subject.subject_name,
                        studentName: `${topStudent.last_name}, ${topStudent.first_name}`,
                        grade: topGrade
                    });
                }
            }
        }
    }

    return awards.sort((a, b) => a.subjectName.localeCompare(b.subjectName));
}
