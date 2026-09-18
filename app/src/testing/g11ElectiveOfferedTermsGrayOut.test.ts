import { describe, it, expect } from 'vitest';
import { resolveSubjectOfferedTerms } from '../lib/curriculum';
import { getSubjectCategory } from '../lib/subjectConfig';

describe('Grade 11 Summary of Grades (All Terms) Gray-Out Logic', () => {
    const grade11Plato = {
        id: 'sec-g11-plato',
        section_name: 'Grade 11 - Plato',
        section_grade_level: 'Grade 11',
        track: 'Academic Track - STEM'
    };

    describe('Curriculum & Categorization', () => {
        it('categorizes Core subjects under "Core Subject (All Tracks)"', () => {
            const coreSubjects = [
                'Effective Communication & Mabisang Komunikasyon',
                'General Mathematics',
                'General Science',
                'Life and Career Skills',
                'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
            ];

            coreSubjects.forEach(name => {
                expect(getSubjectCategory(name, 'Grade 11')).toBe('Core Subject (All Tracks)');
                expect(resolveSubjectOfferedTerms({ subject_name: name }, grade11Plato)).toEqual([1, 2, 3]);
            });
        });

        it('categorizes Academic Electives under "Academic Elective (All Other Electives)"', () => {
            const electives = [
                { name: 'Biology 1', expectedTerm: 1 },
                { name: 'Biology 2', expectedTerm: 2 },
                { name: 'Biology 3', expectedTerm: 3 },
                { name: 'Chemistry 1', expectedTerm: 1 },
                { name: 'Pre-Calculus', expectedTerm: 1 },
                { name: 'Basic Calculus', expectedTerm: 2 }
            ];

            electives.forEach(({ name, expectedTerm }) => {
                expect(getSubjectCategory(name, 'Grade 11')).toBe('Academic Elective (All Other Electives)');
                expect(resolveSubjectOfferedTerms({ subject_name: name, offered_terms: [expectedTerm as 1 | 2 | 3] }, grade11Plato)).toEqual([expectedTerm]);
            });
        });
    });

    describe('Term Column Offering & Gray-Out Determination', () => {
        it('determines which term sub-columns are offered vs grayed out for each subject', () => {
            const determineColStatus = (subjectName: string) => {
                const configuredTerms: Record<string, (1 | 2 | 3)[]> = {
                    'Biology 1': [1],
                    'Biology 2': [2],
                    'Biology 3': [3],
                };
                const offered = resolveSubjectOfferedTerms({ subject_name: subjectName, offered_terms: configuredTerms[subjectName] }, grade11Plato);
                return {
                    isT1Offered: offered.includes(1),
                    isT2Offered: offered.includes(2),
                    isT3Offered: offered.includes(3),
                    isFinalAlwaysOffered: true
                };
            };

            // Core Subject: all 3 terms offered
            expect(determineColStatus('General Mathematics')).toEqual({
                isT1Offered: true,
                isT2Offered: true,
                isT3Offered: true,
                isFinalAlwaysOffered: true
            });

            // Biology 1: only T1 offered, T2 and T3 grayed out
            expect(determineColStatus('Biology 1')).toEqual({
                isT1Offered: true,
                isT2Offered: false,
                isT3Offered: false,
                isFinalAlwaysOffered: true
            });

            // Biology 2: only T2 offered, T1 and T3 grayed out
            expect(determineColStatus('Biology 2')).toEqual({
                isT1Offered: false,
                isT2Offered: true,
                isT3Offered: false,
                isFinalAlwaysOffered: true
            });

            // Biology 3: only T3 offered, T1 and T2 grayed out
            expect(determineColStatus('Biology 3')).toEqual({
                isT1Offered: false,
                isT2Offered: false,
                isT3Offered: true,
                isFinalAlwaysOffered: true
            });
        });
    });

    describe('Missing Grades Filter Logic', () => {
        it('does NOT flag unoffered terms as missing grades', () => {
            const subjects = [
                { id: 'sub-bio1', subject_name: 'Biology 1', offered_terms: [1] as (1 | 2 | 3)[] },
                { id: 'sub-bio2', subject_name: 'Biology 2', offered_terms: [2] as (1 | 2 | 3)[] },
                { id: 'sub-bio3', subject_name: 'Biology 3', offered_terms: [3] as (1 | 2 | 3)[] },
                { id: 'sub-genmath', subject_name: 'General Mathematics' }
            ];

            // Student with Bio 1 grade, but no Bio 2 or Bio 3 or GenMath grades
            const studentGrades: Record<string, { q1?: number; q2?: number; q3?: number }> = {
                'sub-bio1': { q1: 88 },
                'sub-bio2': {},
                'sub-bio3': {},
                'sub-genmath': { q1: 85 } // missing q2 and q3
            };

            // Calculate missing terms per subject
            const missingSummary: Record<string, number[]> = {};

            subjects.forEach(sub => {
                const offered = resolveSubjectOfferedTerms(sub, grade11Plato);
                const sData = studentGrades[sub.id] || {};
                const missingTerms: number[] = [];

                [1, 2, 3].forEach(termNum => {
                    if (!offered.includes(termNum)) return; // Unoffered terms are skipped!
                    const key = `q${termNum}` as 'q1' | 'q2' | 'q3';
                    const val = sData[key];
                    if (!val && val !== 0) {
                        missingTerms.push(termNum);
                    }
                });

                missingSummary[sub.id] = missingTerms;
            });

            // Bio 1: T1 has 88, T2/T3 not offered -> 0 missing
            expect(missingSummary['sub-bio1']).toEqual([]);

            // Bio 2: T2 offered and missing -> [2]
            expect(missingSummary['sub-bio2']).toEqual([2]);

            // Bio 3: T3 offered and missing -> [3]
            expect(missingSummary['sub-bio3']).toEqual([3]);

            // GenMath: T1 has 85, T2 and T3 offered and missing -> [2, 3]
            expect(missingSummary['sub-genmath']).toEqual([2, 3]);
        });
    });

    describe('Final Grade Resolution for Single-Term vs Multi-Term Subjects', () => {
        it('calculates final grade correctly based only on offered terms', () => {
            const calculateFinal = (subjectName: string, grades: { q1?: number; q2?: number; q3?: number }) => {
                const configuredTerms: Record<string, (1 | 2 | 3)[]> = {
                    'Biology 1': [1],
                    'Biology 2': [2],
                    'Biology 3': [3],
                };
                const offered = resolveSubjectOfferedTerms({ subject_name: subjectName, offered_terms: configuredTerms[subjectName] }, grade11Plato);
                const isT1 = offered.includes(1);
                const isT2 = offered.includes(2);
                const isT3 = offered.includes(3);

                const offeredGrades = [
                    isT1 ? grades.q1 : null,
                    isT2 ? grades.q2 : null,
                    isT3 ? grades.q3 : null,
                ].filter((v): v is number => typeof v === 'number' && v > 0);

                if (offeredGrades.length === 0) return null;
                return Math.round(offeredGrades.reduce((a, b) => a + b, 0) / offeredGrades.length);
            };

            // Single-term elective: Final equals its offered term grade
            expect(calculateFinal('Biology 1', { q1: 89 })).toBe(89);
            expect(calculateFinal('Biology 2', { q2: 91 })).toBe(91);
            expect(calculateFinal('Biology 3', { q3: 94 })).toBe(94);

            // Core subject: Final averages all offered terms
            expect(calculateFinal('General Mathematics', { q1: 85, q2: 87, q3: 90 })).toBe(87);
        });
    });
});
