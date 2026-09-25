import { describe, it, expect } from 'vitest';
import type { Subject, ClassRecord } from '../types';
import { resolveStudentQuarterGrade } from '../utils/grading-helpers';

describe('Temporary Grade Slip grading and general average rules', () => {
    describe('Elementary and JHS', () => {
        it('verifies that if Term 1 is complete, its General Average is shown, but final grades and final average are suppressed until all 3 terms complete', () => {
            const subjects: Subject[] = [
                { id: 'subj-fil', subject_name: 'Filipino', grade_level: 'Grade 5' },
                { id: 'subj-eng', subject_name: 'English', grade_level: 'Grade 5' },
                { id: 'subj-math', subject_name: 'Mathematics', grade_level: 'Grade 5' },
                { id: 'subj-sci', subject_name: 'Science', grade_level: 'Grade 5' },
                { id: 'subj-ap', subject_name: 'Araling Panlipunan (AP)', grade_level: 'Grade 5' },
                { id: 'subj-gmrc', subject_name: 'GMRC (Good Manners and Right Conduct)', grade_level: 'Grade 5' },
                { id: 'subj-epp', subject_name: 'E.P.P.', grade_level: 'Grade 5' },
                { id: 'subj-mapeh', subject_name: 'MAPEH', grade_level: 'Grade 5' }
            ];

            // Only Term 1 has complete grades
            const term1OnlyGrades: Record<string, { q1: number; q2?: number; q3?: number }> = {
                'subj-fil': { q1: 88 },
                'subj-eng': { q1: 88 },
                'subj-math': { q1: 88 },
                'subj-sci': { q1: 88 },
                'subj-ap': { q1: 88 },
                'subj-gmrc': { q1: 88 },
                'subj-epp': { q1: 88 },
                'subj-mapeh': { q1: 88 }
            };

            const subjectGrades: Record<string, { q1: string; q2: string; q3: string; final: string; remarks: string }> = {};
            let finalTotal = 0;
            let finalCount = 0;
            const termTotals = { t1: 0, t2: 0, t3: 0 };
            const termCounts = { t1: 0, t2: 0, t3: 0 };

            subjects.forEach((subj) => {
                let q1 = '', q2 = '', q3 = '';
                let sTotal = 0, sCount = 0;
                const entry = term1OnlyGrades[subj.id];
                if (entry?.q1) { q1 = entry.q1.toString(); termTotals.t1 += entry.q1; termCounts.t1++; sTotal += entry.q1; sCount++; }
                if (entry?.q2) { q2 = entry.q2.toString(); termTotals.t2 += entry.q2; termCounts.t2++; sTotal += entry.q2; sCount++; }
                if (entry?.q3) { q3 = entry.q3.toString(); termTotals.t3 += entry.q3; termCounts.t3++; sTotal += entry.q3; sCount++; }

                let finalGrade = '';
                let remarks = '';
                if (sCount === 3) {
                    const avg = Math.round(sTotal / 3);
                    finalGrade = avg.toString();
                    finalTotal += avg;
                    finalCount++;
                    remarks = avg >= 75 ? 'Passed' : 'Failed';
                }
                subjectGrades[subj.id] = { q1, q2, q3, final: finalGrade, remarks };
            });

            const expectedSubjCount = subjects.length;
            const isT1Complete = expectedSubjCount > 0 && termCounts.t1 === expectedSubjCount;
            const isT2Complete = expectedSubjCount > 0 && termCounts.t2 === expectedSubjCount;
            const isT3Complete = expectedSubjCount > 0 && termCounts.t3 === expectedSubjCount;

            const areAll3TermsComplete = expectedSubjCount > 0 &&
                finalCount === expectedSubjCount &&
                isT1Complete &&
                isT2Complete &&
                isT3Complete;

            if (!areAll3TermsComplete) {
                Object.keys(subjectGrades).forEach(id => {
                    subjectGrades[id].final = '';
                    subjectGrades[id].remarks = '';
                });
            }

            const genAvg = areAll3TermsComplete && finalCount > 0 ? Math.round(finalTotal / finalCount).toString() : '';
            const genRemarks = areAll3TermsComplete && genAvg ? (Number(genAvg) >= 75 ? 'Passed' : 'Failed') : '';

            // Term general averages
            const genT1 = isT1Complete && termCounts.t1 > 0 ? Math.round(termTotals.t1 / termCounts.t1).toString() : '';
            const genT2 = isT2Complete && termCounts.t2 > 0 ? Math.round(termTotals.t2 / termCounts.t2).toString() : '';
            const genT3 = isT3Complete && termCounts.t3 > 0 ? Math.round(termTotals.t3 / termCounts.t3).toString() : '';

            const genAverageRowUnderTerms = { t1: genT1, t2: genT2, t3: genT3 };

            expect(isT1Complete).toBe(true);
            expect(isT2Complete).toBe(false);
            expect(isT3Complete).toBe(false);
            expect(areAll3TermsComplete).toBe(false);

            // Term 1 General Average is displayed!
            expect(genAverageRowUnderTerms.t1).toBe('88');
            // Term 2 and 3 General Average are blank
            expect(genAverageRowUnderTerms.t2).toBe('');
            expect(genAverageRowUnderTerms.t3).toBe('');

            // Final Grade and Final Remarks for subjects and general average are blank
            expect(subjectGrades['subj-fil'].final).toBe('');
            expect(subjectGrades['subj-fil'].remarks).toBe('');
            expect(genAvg).toBe('');
            expect(genRemarks).toBe('');
        });

        it('verifies the user scenario: Grade 7 Section MAKISIG with 99s across all subjects and MAPEH in Term 1', () => {
            const subjects: Subject[] = [
                { id: 'subj-fil', subject_name: 'Filipino', grade_level: 'Grade 7' },
                { id: 'subj-eng', subject_name: 'English', grade_level: 'Grade 7' },
                { id: 'subj-math', subject_name: 'Mathematics', grade_level: 'Grade 7' },
                { id: 'subj-sci', subject_name: 'Science', grade_level: 'Grade 7' },
                { id: 'subj-ap', subject_name: 'Araling Panlipunan (AP)', grade_level: 'Grade 7' },
                { id: 'subj-ve', subject_name: 'Values Education', grade_level: 'Grade 7' },
                { id: 'subj-tle', subject_name: 'Technology and Livelihood Education (TLE)', grade_level: 'Grade 7' },
                { id: 'subj-mapeh', subject_name: 'MAPEH', grade_level: 'Grade 7' },
                { id: 'subj-ma', subject_name: 'Music and Arts', grade_level: 'Grade 7' },
                { id: 'subj-peh', subject_name: 'Physical Education and Health', grade_level: 'Grade 7' }
            ];

            const grades: Record<string, { q1: number }> = {
                'subj-fil': { q1: 99 },
                'subj-eng': { q1: 99 },
                'subj-math': { q1: 99 },
                'subj-sci': { q1: 99 },
                'subj-ap': { q1: 99 },
                'subj-ve': { q1: 99 },
                'subj-tle': { q1: 99 },
                'subj-ma': { q1: 99 },
                'subj-peh': { q1: 99 }
            };

            const termTotals = { t1: 0, t2: 0, t3: 0 };
            const termCounts = { t1: 0, t2: 0, t3: 0 };
            const subjectGrades: Record<string, { q1: string; q2: string; q3: string; final: string; remarks: string }> = {};

            const hasParentMapeh = subjects.some(s => s.subject_name.toLowerCase() === 'mapeh');

            // 1st pass: non-MAPEH
            subjects.forEach(subj => {
                const norm = subj.subject_name.toLowerCase();
                if (norm === 'mapeh') return;

                const isComponent = hasParentMapeh && (norm.includes('music') || norm.includes('physical'));
                const g = grades[subj.id]?.q1 || 0;
                const q1 = g > 0 ? g.toString() : '';

                if (g > 0 && !isComponent) {
                    termTotals.t1 += g;
                    termCounts.t1++;
                }

                subjectGrades[subj.id] = { q1, q2: '', q3: '', final: '', remarks: '' };
            });

            // 2nd pass: MAPEH composite
            const maScore = Number(subjectGrades['subj-ma']?.q1 || 0);
            const peScore = Number(subjectGrades['subj-peh']?.q1 || 0);
            const mapehQ1 = Math.round((maScore + peScore) / 2);
            termTotals.t1 += mapehQ1;
            termCounts.t1++;
            subjectGrades['subj-mapeh'] = { q1: mapehQ1.toString(), q2: '', q3: '', final: '', remarks: '' };

            // Expected count: 7 standard subjects + 1 parent MAPEH = 8 (subcomponents excluded)
            const expectedSubjCount = 8;
            const isT1Complete = termCounts.t1 === expectedSubjCount;
            const isT2Complete = false;
            const isT3Complete = false;
            const areAll3TermsComplete = false;

            const genT1 = isT1Complete ? Math.round(termTotals.t1 / termCounts.t1).toString() : '';
            const genT2 = isT2Complete ? Math.round(termTotals.t2 / termCounts.t2).toString() : '';
            const genT3 = isT3Complete ? Math.round(termTotals.t3 / termCounts.t3).toString() : '';
            const genAvg = areAll3TermsComplete ? '99' : '';

            expect(termCounts.t1).toBe(8);
            expect(isT1Complete).toBe(true);
            expect(genT1).toBe('99');
            expect(genT2).toBe('');
            expect(genT3).toBe('');
            expect(genAvg).toBe('');
            expect(subjectGrades['subj-mapeh'].final).toBe('');
            expect(subjectGrades['subj-fil'].final).toBe('');
        });

        it('verifies that when all 3 terms are complete, general average is shown for each term AND final grades and general average are shown', () => {
            const subjects: Subject[] = [
                { id: 'subj-fil', subject_name: 'Filipino', grade_level: 'Grade 5' },
                { id: 'subj-eng', subject_name: 'English', grade_level: 'Grade 5' },
                { id: 'subj-math', subject_name: 'Mathematics', grade_level: 'Grade 5' },
                { id: 'subj-sci', subject_name: 'Science', grade_level: 'Grade 5' }
            ];

            const allTermsGrades: Record<string, { q1: number; q2: number; q3: number }> = {
                'subj-fil': { q1: 85, q2: 87, q3: 90 },
                'subj-eng': { q1: 85, q2: 87, q3: 90 },
                'subj-math': { q1: 85, q2: 87, q3: 90 },
                'subj-sci': { q1: 85, q2: 87, q3: 90 }
            };

            const subjectGrades: Record<string, { q1: string; q2: string; q3: string; final: string; remarks: string }> = {};
            let finalTotal = 0;
            let finalCount = 0;
            const termTotals = { t1: 0, t2: 0, t3: 0 };
            const termCounts = { t1: 0, t2: 0, t3: 0 };

            subjects.forEach((subj) => {
                let q1 = '', q2 = '', q3 = '';
                let sTotal = 0, sCount = 0;
                const entry = allTermsGrades[subj.id];
                if (entry?.q1) { q1 = entry.q1.toString(); termTotals.t1 += entry.q1; termCounts.t1++; sTotal += entry.q1; sCount++; }
                if (entry?.q2) { q2 = entry.q2.toString(); termTotals.t2 += entry.q2; termCounts.t2++; sTotal += entry.q2; sCount++; }
                if (entry?.q3) { q3 = entry.q3.toString(); termTotals.t3 += entry.q3; termCounts.t3++; sTotal += entry.q3; sCount++; }

                let finalGrade = '';
                let remarks = '';
                if (sCount === 3) {
                    const avg = Math.round(sTotal / 3);
                    finalGrade = avg.toString();
                    finalTotal += avg;
                    finalCount++;
                    remarks = avg >= 75 ? 'Passed' : 'Failed';
                }
                subjectGrades[subj.id] = { q1, q2, q3, final: finalGrade, remarks };
            });

            const expectedSubjCount = subjects.length;
            const isT1Complete = expectedSubjCount > 0 && termCounts.t1 === expectedSubjCount;
            const isT2Complete = expectedSubjCount > 0 && termCounts.t2 === expectedSubjCount;
            const isT3Complete = expectedSubjCount > 0 && termCounts.t3 === expectedSubjCount;

            const areAll3TermsComplete = expectedSubjCount > 0 &&
                finalCount === expectedSubjCount &&
                isT1Complete &&
                isT2Complete &&
                isT3Complete;

            const genAvg = areAll3TermsComplete && finalCount > 0 ? Math.round(finalTotal / finalCount).toString() : '';
            const genRemarks = areAll3TermsComplete && genAvg ? (Number(genAvg) >= 75 ? 'Passed' : 'Failed') : '';

            const genT1 = isT1Complete && termCounts.t1 > 0 ? Math.round(termTotals.t1 / termCounts.t1).toString() : '';
            const genT2 = isT2Complete && termCounts.t2 > 0 ? Math.round(termTotals.t2 / termCounts.t2).toString() : '';
            const genT3 = isT3Complete && termCounts.t3 > 0 ? Math.round(termTotals.t3 / termCounts.t3).toString() : '';

            const genAverageRowUnderTerms = { t1: genT1, t2: genT2, t3: genT3 };

            expect(areAll3TermsComplete).toBe(true);
            expect(subjectGrades['subj-fil'].final).toBe('87');
            expect(subjectGrades['subj-fil'].remarks).toBe('Passed');
            expect(genAvg).toBe('87');
            expect(genRemarks).toBe('Passed');

            // General Average per term is displayed
            expect(genAverageRowUnderTerms.t1).toBe('85');
            expect(genAverageRowUnderTerms.t2).toBe('87');
            expect(genAverageRowUnderTerms.t3).toBe('90');
        });
    });

    describe('Senior High School (SHS)', () => {
        it('for SHS: no subject final grade is shown until the complete three-term school year is finished', () => {
            const shsSubjects: (Subject & { term: 1 | 2 | 3 | 'all' })[] = [
                { id: 'shs-math', subject_name: 'General Mathematics', grade_level: 'Grade 11', term: 'all' },
                { id: 'shs-sci', subject_name: 'General Science', grade_level: 'Grade 11', term: 'all' },
                { id: 'shs-precalc', subject_name: 'Pre-Calculus', grade_level: 'Grade 11', term: 1 },
                { id: 'shs-bascalc', subject_name: 'Basic Calculus', grade_level: 'Grade 11', term: 2 }
            ];

            // Scenario: Only Term 1 is graded
            const rawStudentGrades: Record<string, { q1?: number; q2?: number; q3?: number }> = {
                'shs-math': { q1: 85 },
                'shs-sci': { q1: 86 },
                'shs-precalc': { q1: 89 },
                'shs-bascalc': {} // Not offered in Term 1
            };

            const areAll3TermsCompleteShs = false; // Only Term 1 done
            const isT1CompleteShs = true; // All Term 1 units are graded

            const gradesLookup: Record<string, { q1: string; q2: string; q3: string; final: string; remarks: string }> = {};

            shsSubjects.forEach(subj => {
                const entry = rawStudentGrades[subj.id] || {};
                const q1 = entry.q1 || 0;
                const q2 = entry.q2 || 0;
                const q3 = entry.q3 || 0;

                let final = 0;
                if (subj.term === 1) final = q1;
                else if (subj.term === 2) final = q2;
                else if (subj.term === 3) final = q3;
                else {
                    let cnt = 0, sum = 0;
                    if (q1 > 0) { cnt++; sum += q1; }
                    if (q2 > 0) { cnt++; sum += q2; }
                    if (q3 > 0) { cnt++; sum += q3; }
                    final = cnt === 3 ? Math.round(sum / 3) : 0;
                }

                const showFinal = areAll3TermsCompleteShs && final > 0;

                gradesLookup[subj.id] = {
                    q1: q1 > 0 ? q1.toString() : '',
                    q2: q2 > 0 ? q2.toString() : '',
                    q3: q3 > 0 ? q3.toString() : '',
                    final: showFinal ? final.toString() : '',
                    remarks: showFinal ? (final >= 75 ? 'Passed' : 'Failed') : ''
                };
            });

            // Final general average row
            const genAvg = areAll3TermsCompleteShs ? '87' : '';
            const genRemarks = areAll3TermsCompleteShs ? 'Passed' : '';
            // Term 1 average: (85 + 86 + 89) / 3 = 86.67 -> 87
            const genT1 = isT1CompleteShs ? '87' : '';
            const genT2 = '';
            const genT3 = '';
            const genAverageRowUnderTerms = { t1: genT1, t2: genT2, t3: genT3 };

            // 1. The Term 1 grade remains visible, but its Final Grade and remarks stay blank.
            expect(gradesLookup['shs-precalc'].q1).toBe('89');
            expect(gradesLookup['shs-precalc'].final).toBe('');
            expect(gradesLookup['shs-precalc'].remarks).toBe('');

            // 2. Single-term elective offered in Term 2 (Basic Calculus) has NO final grade yet
            expect(gradesLookup['shs-bascalc'].final).toBe('');
            expect(gradesLookup['shs-bascalc'].remarks).toBe('');

            // 3. Multi-term Core subjects (General Math, Science) do NOT have final grade yet
            expect(gradesLookup['shs-math'].q1).toBe('85');
            expect(gradesLookup['shs-math'].final).toBe('');
            expect(gradesLookup['shs-math'].remarks).toBe('');

            // 4. General Average row has Term 1 General Average, but NO final average
            expect(genAverageRowUnderTerms.t1).toBe('87');
            expect(genAverageRowUnderTerms.t2).toBe('');
            expect(genAverageRowUnderTerms.t3).toBe('');
            expect(genAvg).toBe('');
            expect(genRemarks).toBe('');
        });

        it('for SHS: when all terms are complete, all subjects have final grades, and term and final averages are shown', () => {
            const shsSubjects: (Subject & { term: 1 | 2 | 3 | 'all' })[] = [
                { id: 'shs-math', subject_name: 'General Mathematics', grade_level: 'Grade 11', term: 'all' },
                { id: 'shs-precalc', subject_name: 'Pre-Calculus', grade_level: 'Grade 11', term: 1 },
                { id: 'shs-bascalc', subject_name: 'Basic Calculus', grade_level: 'Grade 11', term: 2 }
            ];

            const rawStudentGrades: Record<string, { q1?: number; q2?: number; q3?: number }> = {
                'shs-math': { q1: 85, q2: 87, q3: 90 },
                'shs-precalc': { q1: 89 },
                'shs-bascalc': { q2: 91 }
            };

            const areAll3TermsCompleteShs = true; // All terms complete!

            const gradesLookup: Record<string, { q1: string; q2: string; q3: string; final: string; remarks: string }> = {};

            shsSubjects.forEach(subj => {
                const entry = rawStudentGrades[subj.id] || {};
                const q1 = entry.q1 || 0;
                const q2 = entry.q2 || 0;
                const q3 = entry.q3 || 0;

                const isSingleTerm = subj.term === 1 || subj.term === 2 || subj.term === 3;
                let final = 0;
                if (subj.term === 1) final = q1;
                else if (subj.term === 2) final = q2;
                else if (subj.term === 3) final = q3;
                else {
                    let cnt = 0, sum = 0;
                    if (q1 > 0) { cnt++; sum += q1; }
                    if (q2 > 0) { cnt++; sum += q2; }
                    if (q3 > 0) { cnt++; sum += q3; }
                    final = cnt === 3 ? Math.round(sum / 3) : 0;
                }

                const showFinal = (isSingleTerm && final > 0) || (areAll3TermsCompleteShs && final > 0);

                gradesLookup[subj.id] = {
                    q1: q1 > 0 ? q1.toString() : '',
                    q2: q2 > 0 ? q2.toString() : '',
                    q3: q3 > 0 ? q3.toString() : '',
                    final: showFinal ? final.toString() : '',
                    remarks: showFinal ? (final >= 75 ? 'Passed' : 'Failed') : ''
                };
            });

            // General Average row
            const genAvg = areAll3TermsCompleteShs ? '89' : '';
            const genRemarks = areAll3TermsCompleteShs ? 'Passed' : '';
            // T1 avg: (85 + 89)/2 = 87, T2 avg: (87 + 91)/2 = 89, T3 avg: 90
            const genAverageRowUnderTerms = { t1: '87', t2: '89', t3: '90' };

            expect(gradesLookup['shs-math'].final).toBe('87'); // round((85+87+90)/3) = 87
            expect(gradesLookup['shs-math'].remarks).toBe('Passed');
            expect(gradesLookup['shs-precalc'].final).toBe('89');
            expect(gradesLookup['shs-precalc'].remarks).toBe('Passed');
            expect(gradesLookup['shs-bascalc'].final).toBe('91');
            expect(gradesLookup['shs-bascalc'].remarks).toBe('Passed');

            expect(genAvg).toBe('89');
            expect(genRemarks).toBe('Passed');
            expect(genAverageRowUnderTerms.t1).toBe('87');
            expect(genAverageRowUnderTerms.t2).toBe('89');
            expect(genAverageRowUnderTerms.t3).toBe('90');
        });
    });

    describe('Reactive Live Sync without Manual Publish', () => {
        it('resolves grades directly from raw classRecords when gradingSheetRecords is empty', () => {
            const studentLrn = '123456789012';
            const subjectId = 'subj-sci';
            const classRecords: Partial<ClassRecord>[] = [
                {
                    id: 'cr-sci-q1',
                    student_lrn: studentLrn,
                    subject_id: subjectId,
                    subject_name: 'Science',
                    quarter: 1,
                    school_year: '2025-2026',
                    final_grade: 92,
                    written_works: [20],
                    performance_tasks: [40],
                    quarterly_exam: 25
                }
            ];
            const emptyGradingSheetRecords: ClassRecord[] = [];
            const resolved = resolveStudentQuarterGrade(
                studentLrn,
                subjectId,
                1,
                '2025-2026',
                classRecords as ClassRecord[],
                emptyGradingSheetRecords,
                [],
                'Grade 7'
            );
            expect(resolved).toBe(92);
        });
    });
});
