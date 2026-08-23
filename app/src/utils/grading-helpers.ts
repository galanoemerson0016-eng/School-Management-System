// Grading helper utilities
// Updated per DepEd Order (SY 2026-2027): Assessment, Grading System, Awards & Recognition

import type { ClassRecord, Student, Subject, Section, AttendanceRecord, SF2Sheet, HPSRecord } from '../types';
import { ACTIVE_TERMS } from '../lib/terms';
import { isDescriptiveGrading, getSubjectCluster, getWeights, computeExamsWeightedScore, transmuteGrade, normalizeScores } from '../lib/grading';

function isQuarterMatch(recQuarter: unknown, targetQuarter: number): boolean {
    if (recQuarter === undefined || recQuarter === null || recQuarter === '') return false;
    const num = Number(recQuarter);
    if (!isNaN(num) && num === targetQuarter) return true;
    const str = String(recQuarter).toLowerCase().replace(/[^a-z0-9]/g, '');
    return str === `q${targetQuarter}` || str === `t${targetQuarter}` || str === `quarter${targetQuarter}` || str === `term${targetQuarter}`;
}

export function cleanSubjectQuery(input: string): string {
    if (!input) return '';
    let str = input.trim();
    if (str.startsWith('virtual-')) {
        str = str.substring(8);
        const lastHyphen = str.lastIndexOf('-');
        if (lastHyphen > 0) {
            str = str.substring(0, lastHyphen);
        }
    }
    return str;
}

export function isMatchingSubject(
    targetQuery: string,
    recordSubId?: string,
    recordSubName?: string,
    resolvedSubjectName?: string
): boolean {
    if (!targetQuery) return false;
    if (recordSubId && recordSubId === targetQuery) return true;

    const cleanedTarget = cleanSubjectQuery(targetQuery);
    const normTarget = cleanedTarget.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normTarget) return false;

    const normName = (recordSubName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normId = (recordSubId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanedId = cleanSubjectQuery(recordSubId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normResolved = (resolvedSubjectName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    if (normName && (normName === normTarget || normName === normResolved)) return true;
    if (normId && (normId === normTarget || normId === normResolved)) return true;
    if (cleanedId && (cleanedId === normTarget || cleanedId === normResolved)) return true;

    // Substring containment check
    if (normName && normTarget && (normName.includes(normTarget) || normTarget.includes(normName))) return true;
    if (cleanedId && normTarget && (cleanedId.includes(normTarget) || normTarget.includes(cleanedId))) return true;

    // 1. Filipino
    const isFilipino = (s: string) => s.includes('filipino') || s.includes('wikangfilipino') || s === 'fil' || s.includes('panitikan');
    if (isFilipino(normTarget) && (isFilipino(normName) || isFilipino(cleanedId))) return true;

    // 2. English / Language / Reading & Literacy
    const isEnglish = (s: string) => s.includes('english') || s === 'eng' || s.includes('readingandliteracy') || s.includes('readingliteracy') || s === 'language';
    if (isEnglish(normTarget) && (isEnglish(normName) || isEnglish(cleanedId))) return true;

    // 3. Mathematics / Gen Math
    const isMath = (s: string) => s.includes('mathematics') || s.includes('math') || s.includes('genmath') || s.includes('generalmath');
    if (isMath(normTarget) && (isMath(normName) || isMath(cleanedId))) return true;

    // 4. Science / General Science
    const isScience = (s: string) => s.includes('science') || s.includes('gensci') || s.includes('generalscience') || s.includes('earthandlife') || s.includes('physicalscience');
    if (isScience(normTarget) && (isScience(normName) || isScience(cleanedId))) return true;

    // 5. Araling Panlipunan (AP) / Makabansa / Kasaysayan / Social Studies
    const isAP = (s: string) => s === 'ap' || s.includes('aralingpanlipunan') || s.includes('kasaysayan') || s.includes('socialstudies');
    if (isAP(normTarget) && (isAP(normName) || isAP(cleanedId))) return true;

    // 6. Values Education / ESP / GMRC / Makabansa / Character Education
    const isValues = (s: string) => s.includes('values') || s === 'esp' || s.includes('edukasyonsapagpapakatao') || s.includes('gmrc') || s.includes('goodmanner') || s.includes('goodmoral') || s.includes('makabansa') || s.includes('charactereducation');
    if (isValues(normTarget) && (isValues(normName) || isValues(cleanedId))) return true;

    // 7. EPP / TLE / TVL / Technology & Livelihood Education
    const isTLE = (s: string) => s === 'tle' || s.includes('technologyandlivelihood') || s.includes('epp') || s.includes('edukasyongpantahanan') || s === 'tvl';
    if (isTLE(normTarget) && (isTLE(normName) || isTLE(cleanedId))) return true;

    // 8. MAPEH / Music / Arts / PE / Health
    const isMA = (s: string) => s.includes('musicandarts') || s.includes('musicarts');
    if (isMA(normTarget) && (isMA(normName) || isMA(cleanedId))) return true;

    const isPEH = (s: string) => s.includes('physicaleducationandhealth') || s.includes('peandhealth') || s.includes('pehealth') || (s.includes('physicaleducation') && s.includes('health'));
    if (isPEH(normTarget) && (isPEH(normName) || isPEH(cleanedId))) return true;

    const isMAPEH = (s: string) => s === 'mapeh' || s.includes('musicartsphysicaleducation');
    if (isMAPEH(normTarget) && (isMAPEH(normName) || isMAPEH(cleanedId))) return true;

    // 9. SHS Core / Applied
    const shsKeys = [
        'contemporaryphilippinearts', 'practicalresearch1', 'practicalresearch2', 'practicalresearch',
        'oralcommunication', 'readingandwriting', 'komunikasyon', 'pagbasaatpagsusuri',
        'personaldevelopment', 'understandingculture', 'empowermenttechnologies',
        'introductiontothephilosophy', 'disasterreadiness', 'generalbiology', 'generalchemistry',
        'generalphysics', 'basiccalculus', 'precalculus', 'appliedeconomics', 'businessethics',
        'businessmath', 'businessenterprise', 'accountancy'
    ];
    for (const k of shsKeys) {
        if (normTarget.includes(k) && (normName.includes(k) || cleanedId.includes(k))) return true;
    }

    return false;
}

/**
 * Resolves the final transmuted grade for a student, subject, quarter, and school year.
 * Performs live dynamic calculation from classRecords + hpsRecords matching EClassRecord.tsx / ConsolidatedGradesPage.tsx,
 * with fallback to pre-stored classRecord.final_grade and gradingSheetRecord.final_grade.
 */
export function resolveStudentQuarterGrade(
    studentLrn: string,
    subjectIdOrName: string,
    quarter: number,
    schoolYear: string,
    classRecords: ClassRecord[] = [],
    gradingSheetRecords: ClassRecord[] = [],
    hpsRecords: HPSRecord[] = [],
    sectionGradeLevel?: string,
    sectionTrack?: string,
    depth: number = 0
): number {
    if (!studentLrn || !subjectIdOrName) return 0;
    const cleanedTarget = cleanSubjectQuery(subjectIdOrName);
    const normTarget = cleanedTarget.toLowerCase().replace(/[^a-z0-9]/g, '');

    const allRecords = [...classRecords, ...gradingSheetRecords];
    const recWithName = allRecords.find(r =>
        (r.subject_id === subjectIdOrName || isMatchingSubject(subjectIdOrName, r.subject_id, r.subject_name)) && r.subject_name
    );
    const resolvedSubjectName = recWithName?.subject_name || '';

    const isSubjectMatch = (rSubId: string, rSubName?: string) => {
        return isMatchingSubject(subjectIdOrName, rSubId, rSubName, resolvedSubjectName);
    };

    // 1. Check primary classRecords
    const cRecord = classRecords.find(r =>
        (r.student_lrn === studentLrn || String(r.student_lrn).trim() === String(studentLrn).trim()) &&
        isSubjectMatch(r.subject_id, r.subject_name) &&
        isQuarterMatch(r.quarter, quarter) &&
        (!schoolYear || !r.school_year || r.school_year === schoolYear || r.school_year.includes(schoolYear) || schoolYear.includes(r.school_year || ''))
    );

    if (cRecord) {
        // Find HPS matching this section first, then fallback to global HPS
        const hpsRec = hpsRecords.find(h =>
            (isSubjectMatch(h.subject_id, (h as HPSRecord & { subject_name?: string }).subject_name) || h.subject_id === cRecord.subject_id) &&
            (!schoolYear || !h.school_year || h.school_year === schoolYear || h.school_year.includes(schoolYear) || schoolYear.includes(h.school_year || '')) &&
            isQuarterMatch(h.quarter, quarter) &&
            (cRecord.section_id && h.section_id === cRecord.section_id)
        ) || hpsRecords.find(h =>
            (isSubjectMatch(h.subject_id, (h as HPSRecord & { subject_name?: string }).subject_name) || h.subject_id === cRecord.subject_id) &&
            (!schoolYear || !h.school_year || h.school_year === schoolYear || h.school_year.includes(schoolYear) || schoolYear.includes(h.school_year || '')) &&
            isQuarterMatch(h.quarter, quarter)
        );

        if (hpsRec) {
            const hps_ww = normalizeScores(hpsRec.written_works, 10).map((v: number | string) => v === '' ? 0 : Number(v));
            const hps_pt = normalizeScores(hpsRec.performance_tasks, 10).map((v: number | string) => v === '' ? 0 : Number(v));
            const rawHpsQa = (hpsRec as HPSRecord & { summative_tests?: (number | string)[] }).summative_tests;
            const hps_qa = normalizeScores(rawHpsQa, 3).map((v: number | string, i: number) => {
                if (i === 2 && (v === undefined || v === '' || v === 0) && Number(hpsRec.quarterly_exam) > 0) {
                    return Number(hpsRec.quarterly_exam);
                }
                return Number(v) || 0;
            });

            // Keep raw strings to accurately check if teacher entered any scores
            const rawWw = normalizeScores(cRecord.written_works, 10);
            const rawPt = normalizeScores(cRecord.performance_tasks, 10);
            const rawQa = (cRecord as ClassRecord & { summative_tests?: (number | string)[] }).summative_tests;
            const normQaScores = normalizeScores(rawQa, 3);
            if ((normQaScores[2] === '' || normQaScores[2] === undefined || normQaScores[2] === null) && cRecord.quarterly_exam !== '' && cRecord.quarterly_exam !== undefined && cRecord.quarterly_exam !== null && cRecord.quarterly_exam !== 0 && cRecord.quarterly_exam !== '0') {
                normQaScores[2] = cRecord.quarterly_exam;
            }

            const isValidScore = (s: number | string | null | undefined) => s !== '' && s !== null && s !== undefined && !isNaN(Number(s));
            const hasScores =
                rawWw.some(isValidScore) ||
                rawPt.some(isValidScore) ||
                normQaScores.some(isValidScore);

            const wwTotalScore = rawWw.reduce<number>((a, b) => a + (isValidScore(b) ? Number(b) : 0), 0);
            const wwTotalHPS = hps_ww.reduce((a, b) => a + b, 0);
            const ptTotalScore = rawPt.reduce<number>((a, b) => a + (isValidScore(b) ? Number(b) : 0), 0);
            const ptTotalHPS = hps_pt.reduce((a, b) => a + b, 0);

            const subjectName = cRecord.subject_name || resolvedSubjectName || subjectIdOrName;
            const cluster = getSubjectCluster(subjectName, sectionGradeLevel, sectionTrack);
            const weights = getWeights(cluster, { subject_name: subjectName } as Subject);

            const wwWS = wwTotalHPS === 0 ? 0 : (wwTotalScore / wwTotalHPS) * 100 * (weights.written_works || 0);
            const ptWS = ptTotalHPS === 0 ? 0 : (ptTotalScore / ptTotalHPS) * 100 * (weights.performance_tasks || 0);

            const parseNumOrNull = (val: number | string | null | undefined): number | null => {
                if (val === '' || val === null || val === undefined) return null;
                const n = Number(val);
                return isNaN(n) ? null : n;
            };

            const st1Score = parseNumOrNull(normQaScores[0]);
            const st1HPS = Number(hps_qa[0]) || 0;
            const st2Score = parseNumOrNull(normQaScores[1]);
            const st2HPS = Number(hps_qa[1]) || 0;
            const teScore = parseNumOrNull(normQaScores[2]);
            const teHPS = Number(hps_qa[2]) || 0;

            const qaPS = computeExamsWeightedScore(st1Score, st1HPS, st2Score, st2HPS, teScore, teHPS, cluster);
            const qaWS = qaPS * (weights.quarterly_exam || 0);

            const initialGrade = wwWS + ptWS + qaWS;
            const hasHps = wwTotalHPS > 0 || ptTotalHPS > 0 || st1HPS > 0 || st2HPS > 0 || teHPS > 0;

            if (hasScores && hasHps) {
                const transmuted = transmuteGrade(initialGrade, schoolYear || cRecord.school_year);
                if (transmuted > 0) return transmuted;
            }
        }

        if (cRecord.final_grade && Number(cRecord.final_grade) > 0) {
            return Number(cRecord.final_grade);
        }
    }

    // 2. Check gradingSheetRecords
    const gRecord = gradingSheetRecords.find(r =>
        (r.student_lrn === studentLrn || String(r.student_lrn).trim() === String(studentLrn).trim()) &&
        isSubjectMatch(r.subject_id, r.subject_name) &&
        isQuarterMatch(r.quarter, quarter) &&
        (!schoolYear || !r.school_year || r.school_year === schoolYear || r.school_year.includes(schoolYear) || schoolYear.includes(r.school_year || ''))
    );

    if (gRecord && gRecord.final_grade && Number(gRecord.final_grade) > 0) {
        return Number(gRecord.final_grade);
    }

    // 3. Composite / Parent Subject Fallback (e.g. MAPEH, Music & Arts, PE & Health, EC/MK)
    if (depth === 0) {
        // MAPEH
        if (normTarget === 'mapeh') {
            const ma = resolveStudentQuarterGrade(studentLrn, 'Music and Arts', quarter, schoolYear, classRecords, gradingSheetRecords, hpsRecords, sectionGradeLevel, sectionTrack, 1);
            const pe = resolveStudentQuarterGrade(studentLrn, 'Physical Education and Health', quarter, schoolYear, classRecords, gradingSheetRecords, hpsRecords, sectionGradeLevel, sectionTrack, 1);
            if (ma > 0 && pe > 0) return Math.round((ma + pe) / 2);
            if (ma > 0) return ma;
            if (pe > 0) return pe;

            // Fallback for 4 separate MAPEH components (old curriculum)
            const m = resolveStudentQuarterGrade(studentLrn, 'Music', quarter, schoolYear, classRecords, gradingSheetRecords, hpsRecords, sectionGradeLevel, sectionTrack, 1);
            const a = resolveStudentQuarterGrade(studentLrn, 'Arts', quarter, schoolYear, classRecords, gradingSheetRecords, hpsRecords, sectionGradeLevel, sectionTrack, 1);
            const p = resolveStudentQuarterGrade(studentLrn, 'Physical Education', quarter, schoolYear, classRecords, gradingSheetRecords, hpsRecords, sectionGradeLevel, sectionTrack, 1);
            const h = resolveStudentQuarterGrade(studentLrn, 'Health', quarter, schoolYear, classRecords, gradingSheetRecords, hpsRecords, sectionGradeLevel, sectionTrack, 1);
            const components = [m, a, p, h].filter(v => v > 0);
            if (components.length > 0) {
                return Math.round(components.reduce((x, y) => x + y, 0) / components.length);
            }
        }

        // Music and Arts composite from individual Music and Arts
        if (normTarget.includes('musicandarts') || normTarget === 'musicarts') {
            const m = resolveStudentQuarterGrade(studentLrn, 'Music', quarter, schoolYear, classRecords, gradingSheetRecords, hpsRecords, sectionGradeLevel, sectionTrack, 1);
            const a = resolveStudentQuarterGrade(studentLrn, 'Arts', quarter, schoolYear, classRecords, gradingSheetRecords, hpsRecords, sectionGradeLevel, sectionTrack, 1);
            if (m > 0 && a > 0) return Math.round((m + a) / 2);
            if (m > 0) return m;
            if (a > 0) return a;
        }

        // Physical Education and Health composite from individual PE and Health
        if (normTarget.includes('physicaleducationandhealth') || normTarget === 'peandhealth' || normTarget === 'pehealth') {
            const p = resolveStudentQuarterGrade(studentLrn, 'Physical Education', quarter, schoolYear, classRecords, gradingSheetRecords, hpsRecords, sectionGradeLevel, sectionTrack, 1);
            const h = resolveStudentQuarterGrade(studentLrn, 'Health', quarter, schoolYear, classRecords, gradingSheetRecords, hpsRecords, sectionGradeLevel, sectionTrack, 1);
            if (p > 0 && h > 0) return Math.round((p + h) / 2);
            if (p > 0) return p;
            if (h > 0) return h;
        }

        // Effective Communication & Mabisang Komunikasyon
        if (normTarget.includes('effectivecommunication') && normTarget.includes('mabisangkomunikasyon')) {
            const ec = resolveStudentQuarterGrade(studentLrn, 'Effective Communication', quarter, schoolYear, classRecords, gradingSheetRecords, hpsRecords, sectionGradeLevel, sectionTrack, 1);
            const mk = resolveStudentQuarterGrade(studentLrn, 'Mabisang Komunikasyon', quarter, schoolYear, classRecords, gradingSheetRecords, hpsRecords, sectionGradeLevel, sectionTrack, 1);
            if (ec > 0 && mk > 0) return Math.round((ec + mk) / 2);
            if (ec > 0) return ec;
            if (mk > 0) return mk;
        }
    }

    return 0;
}

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
                 (quarter === 'overall' || Number(r.quarter) === Number(quarter)) &&
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

        const section = sections.find(s => s.section_name === student.student_section || s.id === student.student_section);

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
        if (Number(record.quarter) !== Number(quarter)) continue;
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

    return subjects.map(subject => {
        const subjectRecords = classRecords.filter(r =>
            r.subject_id === subject.id &&
            Number(r.quarter) === Number(quarter) &&
            (Number(r.final_grade) || 0) > 0
        );

        if (subjectRecords.length === 0) {
            return { subjectName: subject.subject_name, mps: 0, passRate: 0, totalStudents: 0 };
        }

        const totalStudents = subjectRecords.length;
        const totalGrades = subjectRecords.reduce((sum, r) => sum + (Number(r.final_grade) || 0), 0);
        const mps = Math.round((totalGrades / totalStudents) * 100) / 100;
        const passingCount = subjectRecords.filter(r => (Number(r.final_grade) || 0) >= 75).length;
        const passRate = Math.round((passingCount / totalStudents) * 100);

        return { subjectName: subject.subject_name, mps, passRate, totalStudents };
    }).filter(d => d.totalStudents > 0);
}

// ─── Subject Awardees ─────────────────────────────────────────────────────────

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
            return s.student_section === section.section_name || s.student_section === section.id;
        });
        if (sectionStudents.length === 0) continue;

        // Get section-specific subjects or fall back to subjects matching section ID / taught subjects
        const sectionSubjectIds = new Set(subjects.filter(sub => sub.section_id === section.id || (section.taught_subjects || []).includes(sub.subject_name)).map(s => s.id));
        const relevantSubjects = subjects.filter(sub => sectionSubjectIds.has(sub.id) || sub.section_id === section.id);
        const allSubjectsToEvaluate = relevantSubjects.length > 0 ? relevantSubjects : subjects.filter(s => s.term !== 'none');

        for (const subject of allSubjectsToEvaluate) {
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
                    const record = classRecords.find(r => r.student_lrn === student.lrn && r.subject_id === subject.id && Number(r.quarter) === Number(quarter));
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
    let hasAnyData = false;
    
    // Filter months to check based on term
    let monthsToInclude: string[] = [];
    if (term === 1) monthsToInclude = ['june', 'july', 'august'];
    else if (term === 2) monthsToInclude = ['september', 'october', 'november', 'december'];
    else if (term === 3) monthsToInclude = ['january', 'february', 'march', 'april'];
    else monthsToInclude = ['june', 'july', 'august', 'september', 'october', 'november', 'december', 'january', 'february', 'march', 'april'];

    const monthsWithSF2 = new Set<string>();
    const isAbsentStatus = (st?: string | number) => {
        if (st == null) return false;
        const s = st.toString().toLowerCase().trim();
        return s === 'absent' || s === 'excused' || s === 'x' || s === 'a' || s === 'abs' || s === 'ab' || s === 'unexcused';
    };

    const targetLRN = (studentLrn || '').toString().trim().toLowerCase();
    const normalizeToken = (v?: string | number) => (v ?? '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetSectionToken = normalizeToken(sectionId);

    // 1. Check SF2Sheets
    const sheets = sf2Sheets.filter(s => {
        if (s.school_year && schoolYear && s.school_year !== schoolYear && !s.school_year.includes(schoolYear) && !schoolYear.includes(s.school_year)) return false;
        if (!targetSectionToken) return true;
        const sheetTokens = [normalizeToken(s.section_id), normalizeToken(s.id)];
        return sheetTokens.some(st => st === targetSectionToken || st.includes(targetSectionToken) || targetSectionToken.includes(st));
    });

    sheets.forEach(sheet => {
        const m = sheet.month.toLowerCase();
        const matchesTerm = monthsToInclude.some(mi => mi.startsWith(m) || m.startsWith(mi));
        if (term !== 'EOSY' && !matchesTerm) return;

        monthsWithSF2.add(m);

        const attendanceKeys = Object.keys(sheet.attendance || {});
        const matchedKey = attendanceKeys.find(k => k.toString().trim().toLowerCase() === targetLRN);
        const studentAttendance = matchedKey ? sheet.attendance[matchedKey] : {};

        if (studentAttendance && matchedKey) {
            hasAnyData = true;
            const hasDateLabels = sheet.date_labels && Object.keys(sheet.date_labels).length > 0;
            if (hasDateLabels) {
                Object.keys(sheet.date_labels).forEach(colKeyStr => {
                    const colKey = Number(colKeyStr);
                    const dateVal = sheet.date_labels[colKey];
                    if (dateVal && dateVal.trim() !== '') {
                        const dayNumStr = dateVal.trim();
                        const dayNum = Number(dayNumStr);
                        const paddedDay = !isNaN(dayNum) ? String(dayNum).padStart(2, '0') : dayNumStr;

                        const status = studentAttendance[`date_${dayNumStr}`]
                            ?? studentAttendance[`date_${paddedDay}`]
                            ?? studentAttendance[dayNumStr]
                            ?? studentAttendance[paddedDay]
                            ?? studentAttendance[colKey]
                            ?? studentAttendance[colKeyStr];
                        
                        if (isAbsentStatus(status)) {
                            count++;
                        }
                    }
                });
            } else {
                Object.values(studentAttendance).forEach(status => {
                    if (isAbsentStatus(status)) {
                        count++;
                    }
                });
            }
        }
    });

    // 2. Also check individual attendanceRecords for months that DO NOT have an SF2 sheet yet
    const records = attendanceRecords.filter(r => 
        r.student_lrn.toString().trim().toLowerCase() === targetLRN
    );

    // Check if any attendance records exist for the term months (regardless of status)
    const termRecords = records.filter(r => {
        const dateObj = new Date(r.date);
        const monthName = dateObj.toLocaleString('default', { month: 'long' }).toLowerCase();
        return monthsToInclude.some(mi => mi.startsWith(monthName) || monthName.startsWith(mi));
    });

    if (termRecords.length > 0) {
        hasAnyData = true;
    }

    // Count absences from individual records only for months without SF2
    termRecords.forEach(r => {
        const dateObj = new Date(r.date);
        const monthName = dateObj.toLocaleString('default', { month: 'long' }).toLowerCase();
        const hasSF2Sheet = Array.from(monthsWithSF2).some(m => m.startsWith(monthName) || monthName.startsWith(m));
        
        if (!hasSF2Sheet && isAbsentStatus(r.status)) {
            count++;
        }
    });

    // Return -1 if no attendance data exists at all for the term
    // This distinguishes "confirmed zero absences" from "no data available"
    if (!hasAnyData) return -1;

    return count;
}
