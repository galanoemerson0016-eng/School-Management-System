// Grading helper utilities
// Updated per DepEd Order (SY 2026-2027): Assessment, Grading System, Awards & Recognition

import type { ClassRecord, Student, Subject, Section, AttendanceRecord, SF2Sheet } from '../types';
import { ACTIVE_TERMS } from '../lib/terms';
import { isDescriptiveGrading } from '../lib/grading';

// ─── Award Types ──────────────────────────────────────────────────────────────

/**
 * New award type per DepEd Order (SY 2026-2027).
 * The old 3-tier honor system (Highest Honors / High Honors / Honors) has been
 * replaced by the Academic Excellence Award and subject-specific awards.
 */
export interface AwardStudent {
    student: Student;
    sectionName: string;
    generalAverage: number;
    /** @deprecated Use awardType instead. Kept for backward-compat with certificate code. */
    honorType: 'Academic Excellence Award';
    awardType: 'Academic Excellence Award';
    subjectGrades: { subjectName: string; grade: number }[];
}

/**
 * @deprecated Use AwardStudent instead.
 * Kept as a type alias for backward compatibility during migration.
 */
export type HonorStudent = AwardStudent;

// ─── General Average ──────────────────────────────────────────────────────────

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

// ─── Academic Excellence Award ────────────────────────────────────────────────

/**
 * Determine if a student qualifies for the Academic Excellence Award.
 *
 * Per DepEd Order (SY 2026-2027):
 *   - General Average of 90 or higher
 *   - No Final Grade (FG) below 80 in any learning area
 *   - No derogatory records / disciplinary cases (tracked externally)
 *
 * @param generalAverage   - Student's General Average (already computed)
 * @param subjectFinalGrades - Array of final grades for all learning areas
 */
export function isAcademicExcellenceAwardee(
    generalAverage: number,
    subjectFinalGrades: number[]
): boolean {
    if (generalAverage < 90) return false;
    if (subjectFinalGrades.some(g => g > 0 && g < 80)) return false;
    return true;
}

/**
 * @deprecated Use isAcademicExcellenceAwardee() instead.
 * Old 3-tier honor system removed per DepEd Order (SY 2026-2027).
 *
 * The following tiers no longer exist:
 *   - "With Highest Honors" (GA ≥ 98) → REMOVED
 *   - "With High Honors"   (GA ≥ 95) → REMOVED
 *   - "With Honors"        (GA ≥ 90) → REMOVED
 *
 * Replaced by: Academic Excellence Award (GA ≥ 90, no FG < 80, listed alphabetically)
 */
export function getHonorType(average: number): AwardStudent['awardType'] | null {
    // Returns only the single new award type for GA ≥ 90.
    // Note: This does NOT check for no-FG-below-80 since subject grades are not passed here.
    // Use isAcademicExcellenceAwardee() for the full check.
    if (average >= 90) return 'Academic Excellence Award';
    return null;
}

/**
 * Generate the Academic Excellence Award list for a section.
 *
 * Per DepEd Order (SY 2026-2027):
 *   - GA ≥ 90 AND no FG below 80 in any learning area
 *   - Listed ALPHABETICALLY (not by grade rank) to promote fairness
 */
export function generateHonorRoll(
    students: Student[],
    classRecords: ClassRecord[],
    subjects: Subject[],
    sections: Section[],
    quarter: 1 | 2 | 3 | 4 | 'overall',
    schoolYear?: string
): AwardStudent[] {
    const awardees: AwardStudent[] = [];
    const sy = schoolYear || '2026-2027';

    for (const student of students) {
        // Exclude descriptive grading levels from Academic Excellence Awards
        if (isDescriptiveGrading(student.grade_level, sy)) continue;

        const avg = computeStudentAverage(student.lrn, quarter, classRecords);
        if (avg < 90 || avg <= 0) continue;

        const studentRecords = classRecords.filter(
            r => r.student_lrn === student.lrn &&
                 (quarter === 'overall' || r.quarter === quarter) &&
                 (Number(r.final_grade) || 0) > 0
        );

        const subjectGrades = studentRecords.map(r => {
            const subject = subjects.find(s => s.id === r.subject_id);
            return {
                subjectName: subject?.subject_name || 'Unknown',
                grade: Number(r.final_grade) || 0,
            };
        });

        // Check: no FG below 80 in any learning area
        const hasFgBelow80 = subjectGrades.some(sg => sg.grade > 0 && sg.grade < 80);
        if (hasFgBelow80) continue;

        const section = sections.find(s => s.section_name === student.student_section);

        awardees.push({
            student,
            sectionName: section?.section_name || student.student_section || 'Unknown',
            generalAverage: avg,
            honorType: 'Academic Excellence Award',  // backward compat
            awardType: 'Academic Excellence Award',
            subjectGrades,
        });
    }

    // Per DepEd Order: awardees shall be listed ALPHABETICALLY to promote fairness
    return awardees.sort((a, b) => {
        const nameA = `${a.student.last_name}, ${a.student.first_name}`.toLowerCase();
        const nameB = `${b.student.last_name}, ${b.student.first_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
    });
}

// ─── At-Risk Students ─────────────────────────────────────────────────────────

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

// ─── MPS per Subject ──────────────────────────────────────────────────────────

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

// ─── Excellence in a Specific Learning Area Award ─────────────────────────────

export interface SubjectAward {
    sectionName: string;
    subjectName: string;
    studentName: string;
    grade: number;
}

/**
 * Get the "Excellence in a Specific Learning Area" awardees.
 *
 * Per DepEd Order (SY 2026-2027):
 *   - Conferred on learners who obtain an FG of 90 or higher AND the highest FG
 *     in the batch in a particular learning area.
 *   - In cases of identical highest grades, all qualified learners shall be recognized.
 */
export function getSubjectAwardees(
    students: Student[],
    classRecords: ClassRecord[],
    subjects: Subject[],
    sections: Section[],
    quarter: 1 | 2 | 3 | 4 | 'overall',
    schoolYear?: string
): SubjectAward[] {
    const awards: SubjectAward[] = [];
    const sy = schoolYear || '2026-2027';

    for (const section of sections) {
        const sectionStudents = students.filter(s => {
            // Exclude descriptive grading levels from Subject Excellence Awards
            if (isDescriptiveGrading(s.grade_level, sy)) return false;
            return s.student_section === section.section_name;
        });
        if (sectionStudents.length === 0) continue;

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

            // Per DepEd Order: FG must be 90 or higher to qualify
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

export function getStudentAbsences(
    studentLrn: string,
    sectionId: string,
    schoolYear: string,
    term: 1 | 2 | 3 | 'EOSY',
    attendanceRecords: AttendanceRecord[],
    sf2Sheets: SF2Sheet[]
): number {
    let count = 0;
    
    // Filter months to check based on term
    let monthsToInclude: string[] = [];
    if (term === 1) monthsToInclude = ['june', 'july', 'august'];
    else if (term === 2) monthsToInclude = ['september', 'october', 'november', 'december'];
    else if (term === 3) monthsToInclude = ['january', 'february', 'march', 'april'];
    else monthsToInclude = ['june', 'july', 'august', 'september', 'october', 'november', 'december', 'january', 'february', 'march', 'april'];

    // Check SF2Sheets
    const sheets = sf2Sheets.filter(s => s.section_id === sectionId && s.school_year === schoolYear);
    sheets.forEach(sheet => {
        const m = sheet.month.toLowerCase();
        const matchesTerm = monthsToInclude.some(mi => mi.startsWith(m) || m.startsWith(mi));
        if (term !== 'EOSY' && !matchesTerm) return;

        const studentAttendance = sheet.attendance[studentLrn];
        if (studentAttendance) {
            Object.values(studentAttendance).forEach(status => {
                if (status === 'absent') {
                    count++;
                }
            });
        }
    });

    // Also check individual attendanceRecords (as a fallback or override)
    const records = attendanceRecords.filter(r => r.student_lrn === studentLrn && r.status === 'absent');
    if (count === 0 && records.length > 0) {
        records.forEach(r => {
            if (term !== 'EOSY') {
                const dateObj = new Date(r.date);
                const monthName = dateObj.toLocaleString('default', { month: 'long' }).toLowerCase();
                if (monthsToInclude.includes(monthName)) {
                    count++;
                }
            } else {
                count++;
            }
        });
    }

    return count;
}
