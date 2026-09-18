import { describe, it, expect } from 'vitest';
import { resolveSubjectOfferedTerms } from '../lib/curriculum';

describe('resolveSubjectOfferedTerms for SHS single-term electives vs core subjects', () => {
    const grade11Section = {
        id: 'sec-g11-plato',
        section_name: 'Plato',
        section_grade_level: 'Grade 11',
        track: 'Academic Track - STEM'
    };

    it('identifies Grade 11 Core subjects as offered across all 3 terms', () => {
        const coreSubjects = [
            'General Mathematics',
            'General Science',
            'Effective Communication & Mabisang Komunikasyon',
            'Life and Career Skills',
            'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
        ];

        coreSubjects.forEach(name => {
            const terms = resolveSubjectOfferedTerms({ subject_name: name }, grade11Section);
            expect(terms).toEqual([1, 2, 3]);
        });
    });

    it('uses adviser-selected offerings for non-Core subjects', () => {
        expect(resolveSubjectOfferedTerms({ subject_name: 'Biology 1', offered_terms: [1] }, grade11Section)).toEqual([1]);
        expect(resolveSubjectOfferedTerms({ subject_name: 'Biology 2', offered_terms: [2] }, grade11Section)).toEqual([2]);
        expect(resolveSubjectOfferedTerms({ subject_name: 'Biology 3', offered_terms: [3] }, grade11Section)).toEqual([3]);
        expect(resolveSubjectOfferedTerms({ subject_name: 'Chemistry 1', offered_terms: [1] }, grade11Section)).toEqual([1]);
        expect(resolveSubjectOfferedTerms({ subject_name: 'Pre-Calculus', offered_terms: [1] }, grade11Section)).toEqual([1]);
        expect(resolveSubjectOfferedTerms({ subject_name: 'Basic Calculus', offered_terms: [2] }, grade11Section)).toEqual([2]);
    });

    it('respects explicit section metadata subjectTerms override when configured by teacher', () => {
        const sectionWithOverride = {
            ...grade11Section,
            section_metadata: {
                subjectTerms: {
                    'Biology 1': 'all',
                    'Custom Elective': 2
                }
            }
        };

        expect(resolveSubjectOfferedTerms({ subject_name: 'Biology 1' }, sectionWithOverride)).toEqual([1, 2, 3]);
        expect(resolveSubjectOfferedTerms({ subject_name: 'Custom Elective' }, sectionWithOverride)).toEqual([2]);
    });

    it('returns [1, 2, 3] for non-SHS sections (Elementary and JHS)', () => {
        const elemSection = {
            id: 'sec-g5-rizal',
            section_grade_level: 'Grade 5'
        };
        expect(resolveSubjectOfferedTerms({ subject_name: 'Science' }, elemSection)).toEqual([1, 2, 3]);
        expect(resolveSubjectOfferedTerms({ subject_name: 'Mathematics' }, elemSection)).toEqual([1, 2, 3]);

        const jhsSection = {
            id: 'sec-g7-diamond',
            section_grade_level: 'Grade 7'
        };
        expect(resolveSubjectOfferedTerms({ subject_name: 'Science' }, jhsSection)).toEqual([1, 2, 3]);
    });
});
