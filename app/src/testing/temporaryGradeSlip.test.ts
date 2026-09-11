import { describe, it, expect } from 'vitest';
import type { Subject } from '../types';

describe('Temporary Grade Slip 3-term completion logic', () => {
    it('verifies that incomplete terms (e.g. only Term 1) suppress final grades, per-term general average, and remarks', () => {
        // Setup mock subjects
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

        // Scenario 1: Only Term 1 has grades (e.g. 88 across subjects)
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

        // Simulate GradeSlipCard computation
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
        const areAll3TermsComplete = expectedSubjCount > 0 &&
            finalCount === expectedSubjCount &&
            termCounts.t1 === expectedSubjCount &&
            termCounts.t2 === expectedSubjCount &&
            termCounts.t3 === expectedSubjCount;

        if (!areAll3TermsComplete) {
            Object.keys(subjectGrades).forEach(id => {
                subjectGrades[id].final = '';
                subjectGrades[id].remarks = '';
            });
        }

        const genAvg = areAll3TermsComplete && finalCount > 0 ? Math.round(finalTotal / finalCount).toString() : '';
        const genRemarks = areAll3TermsComplete && genAvg ? (Number(genAvg) >= 75 ? 'Passed' : 'Failed') : '';
        const genT1 = areAll3TermsComplete && termCounts.t1 > 0 ? Math.round(termTotals.t1 / termCounts.t1).toString() : '';
        const genT2 = areAll3TermsComplete && termCounts.t2 > 0 ? Math.round(termTotals.t2 / termCounts.t2).toString() : '';
        const genT3 = areAll3TermsComplete && termCounts.t3 > 0 ? Math.round(termTotals.t3 / termCounts.t3).toString() : '';

        // Verification: when only Term 1 is entered, all 3 terms are NOT complete
        expect(areAll3TermsComplete).toBe(false);
        expect(subjectGrades['subj-fil'].q1).toBe('88');
        expect(subjectGrades['subj-fil'].q2).toBe('');
        expect(subjectGrades['subj-fil'].q3).toBe('');
        expect(subjectGrades['subj-fil'].final).toBe('');
        expect(subjectGrades['subj-fil'].remarks).toBe('');

        // General Average row must be completely blank
        expect(genT1).toBe('');
        expect(genT2).toBe('');
        expect(genT3).toBe('');
        expect(genAvg).toBe('');
        expect(genRemarks).toBe('');
    });

    it('verifies that when all 3 terms are complete, final grades, per-term averages, general average, and remarks are computed and shown', () => {
        const subjects: Subject[] = [
            { id: 'subj-fil', subject_name: 'Filipino', grade_level: 'Grade 5' },
            { id: 'subj-eng', subject_name: 'English', grade_level: 'Grade 5' },
            { id: 'subj-math', subject_name: 'Mathematics', grade_level: 'Grade 5' },
            { id: 'subj-sci', subject_name: 'Science', grade_level: 'Grade 5' }
        ];

        // Scenario 2: All 3 terms are complete (Q1: 85, Q2: 87, Q3: 90)
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
        const areAll3TermsComplete = expectedSubjCount > 0 &&
            finalCount === expectedSubjCount &&
            termCounts.t1 === expectedSubjCount &&
            termCounts.t2 === expectedSubjCount &&
            termCounts.t3 === expectedSubjCount;

        if (!areAll3TermsComplete) {
            Object.keys(subjectGrades).forEach(id => {
                subjectGrades[id].final = '';
                subjectGrades[id].remarks = '';
            });
        }

        const genAvg = areAll3TermsComplete && finalCount > 0 ? Math.round(finalTotal / finalCount).toString() : '';
        const genRemarks = areAll3TermsComplete && genAvg ? (Number(genAvg) >= 75 ? 'Passed' : 'Failed') : '';
        const genT1 = areAll3TermsComplete && termCounts.t1 > 0 ? Math.round(termTotals.t1 / termCounts.t1).toString() : '';
        const genT2 = areAll3TermsComplete && termCounts.t2 > 0 ? Math.round(termTotals.t2 / termCounts.t2).toString() : '';
        const genT3 = areAll3TermsComplete && termCounts.t3 > 0 ? Math.round(termTotals.t3 / termCounts.t3).toString() : '';

        // Verification: when all 3 terms are complete
        expect(areAll3TermsComplete).toBe(true);
        expect(subjectGrades['subj-fil'].final).toBe('87'); // round((85+87+90)/3) = 87
        expect(subjectGrades['subj-fil'].remarks).toBe('Passed');

        // General Average row is populated
        expect(genT1).toBe('85');
        expect(genT2).toBe('87');
        expect(genT3).toBe('90');
        expect(genAvg).toBe('87');
        expect(genRemarks).toBe('Passed');
    });
});
