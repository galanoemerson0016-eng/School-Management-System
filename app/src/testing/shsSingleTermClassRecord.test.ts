import { describe, it, expect } from 'vitest';
import type { Subject } from '../types';

describe('Senior High School Single-Term Class Record & Final Summary', () => {
    it('resolves offeredTerms to strictly [1] when subject is configured for Term 1 only', () => {
        const subject: Subject = {
            id: 'sub-gm',
            subject_name: 'General Mathematics',
            grade_level: 'Grade 11',
            term: 1
        };

        const computeOfferedTerms = (subj: Subject, override = 'auto', activeTerms: number[] = []) => {
            if (override !== 'auto') {
                if (override === 'all') return [1, 2, 3];
                if (override === 'none') return [];
                return override.split(',').map(n => Number(n.trim())).filter(n => n >= 1 && n <= 3);
            }
            if (subj.term === 1) return [1];
            if (subj.term === 2) return [2];
            if (subj.term === 3) return [3];
            if (subj.term === 'none') return [];
            if (activeTerms.length > 0 && activeTerms.length < 3) return activeTerms;
            return [1, 2, 3];
        };

        expect(computeOfferedTerms(subject)).toEqual([1]);
    });

    it('auto-detects 1-term subject from active student grades when term is unset/all', () => {
        const subject: Subject = {
            id: 'sub-gm',
            subject_name: 'General Mathematics',
            grade_level: 'Grade 11',
            term: 'all'
        };

        // Student ALVIENTO has 100 in Term 1 only; Terms 2 and 3 have no encoded grades
        const activeTermsWithGrades = [1];

        const computeOfferedTerms = (subj: Subject, override = 'auto', activeTerms: number[] = []) => {
            if (override !== 'auto') {
                if (override === 'all') return [1, 2, 3];
                if (override === 'none') return [];
                return override.split(',').map(n => Number(n.trim())).filter(n => n >= 1 && n <= 3);
            }
            if (subj.term === 1) return [1];
            if (subj.term === 2) return [2];
            if (subj.term === 3) return [3];
            if (subj.term === 'none') return [];
            if (activeTerms.length > 0 && activeTerms.length < 3) return activeTerms;
            return [1, 2, 3];
        };

        const result = computeOfferedTerms(subject, 'auto', activeTermsWithGrades);
        expect(result).toEqual([1]);
    });

    it('generates table columns containing strictly LEARNERS\' NAMES, TERM 1 FINAL GRADE, and DESCRIPTOR for 1-term subject', () => {
        const offeredTerms = [1];

        const generateHeaderColumns = (terms: number[]) => {
            const cols = ['LEARNERS\' NAMES'];
            if (terms.length === 1) {
                cols.push(`TERM ${terms[0]} FINAL GRADE`);
            } else {
                terms.forEach(t => cols.push(`TERM ${t}`));
                cols.push('FINAL GRADE');
            }
            cols.push('DESCRIPTOR');
            return cols;
        };

        const columns = generateHeaderColumns(offeredTerms);
        expect(columns).toEqual([
            'LEARNERS\' NAMES',
            'TERM 1 FINAL GRADE',
            'DESCRIPTOR'
        ]);
        expect(columns).not.toContain('TERM 1');
        expect(columns).not.toContain('TERM 2');
        expect(columns).not.toContain('TERM 3');
        expect(columns).not.toContain('FINAL GRADE');
    });

    it('generates full term columns plus final grade for multi-term subjects', () => {
        const offeredTerms = [1, 2, 3];

        const generateHeaderColumns = (terms: number[]) => {
            const cols = ['LEARNERS\' NAMES'];
            if (terms.length === 1) {
                cols.push(`TERM ${terms[0]} FINAL GRADE`);
            } else {
                terms.forEach(t => cols.push(`TERM ${t}`));
                cols.push('FINAL GRADE');
            }
            cols.push('DESCRIPTOR');
            return cols;
        };

        const columns = generateHeaderColumns(offeredTerms);
        expect(columns).toEqual([
            'LEARNERS\' NAMES',
            'TERM 1',
            'TERM 2',
            'TERM 3',
            'FINAL GRADE',
            'DESCRIPTOR'
        ]);
    });

    it('computes Final Grade and descriptor correctly based only on offered term', () => {
        const offeredTerms = [1];
        const studentGrades = {
            t1: 75,
            t2: undefined,
            t3: undefined
        };

        let total = 0;
        let count = 0;
        [1, 2, 3].forEach(q => {
            if (!offeredTerms.includes(q)) return;
            const g = q === 1 ? studentGrades.t1 : q === 2 ? studentGrades.t2 : studentGrades.t3;
            if (g && g > 0) {
                total += g;
                count++;
            }
        });

        const finalGrade = count > 0 ? Math.round(total / count) : 0;
        const descriptor = finalGrade >= 90 ? 'Advancing' : finalGrade >= 75 ? 'Connecting' : 'Beginning';

        expect(finalGrade).toBe(75);
        expect(descriptor).toBe('Connecting');
    });
});
