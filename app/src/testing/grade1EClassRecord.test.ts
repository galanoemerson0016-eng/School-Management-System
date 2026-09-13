import { describe, it, expect } from 'vitest';
import { getSubjectCluster, getWeights, transmuteGrade, getKs1LetterGrade } from '../lib/grading';
import { STANDARD_SUBJECTS } from '../lib/curriculum';
import { isSubjectInTeachingLoad } from '../utils/grading-helpers';
import type { Section } from '../types';

describe('Grade 1 E-Class Record & PACE Form Integration', () => {
    const grade1Subjects = STANDARD_SUBJECTS['Grade 1'];

    it('contains all standard DepEd MATATAG Grade 1 learning areas', () => {
        const names = grade1Subjects.map(s => s.name);
        expect(names).toContain('Language');
        expect(names).toContain('Reading and Literacy');
        expect(names).toContain('Mathematics');
        expect(names).toContain('GMRC (Good Manners and Right Conduct)');
        expect(names).toContain('Makabansa');
    });

    it('resolves correct weight clusters for Grade 1 subjects', () => {
        // Mathematics -> science_math (20/50/30)
        const mathCluster = getSubjectCluster('Mathematics', 'Grade 1');
        expect(mathCluster).toBe('science_math');
        const mathWeights = getWeights(mathCluster);
        expect(mathWeights.written_works).toBe(0.20);
        expect(mathWeights.performance_tasks).toBe(0.50);
        expect(mathWeights.quarterly_exam).toBe(0.30);

        // Language & Reading -> languages_ap_esp (20/50/30)
        const langCluster = getSubjectCluster('Language', 'Grade 1');
        expect(langCluster).toBe('languages_ap_esp');
        const langWeights = getWeights(langCluster);
        expect(langWeights.written_works).toBe(0.20);
        expect(langWeights.performance_tasks).toBe(0.50);
        expect(langWeights.quarterly_exam).toBe(0.30);

        // Makabansa & GMRC -> languages_ap_esp (20/50/30)
        const makabansaCluster = getSubjectCluster('Makabansa', 'Grade 1');
        expect(makabansaCluster).toBe('languages_ap_esp');

        const gmrcCluster = getSubjectCluster('GMRC (Good Manners and Right Conduct)', 'Grade 1');
        expect(gmrcCluster).toBe('languages_ap_esp');
    });

    it('calculates transmuted grades and KS1 descriptors for Grade 1', () => {
        // 100% initial score -> 100 transmuted grade -> 'A'
        const transmuted100 = transmuteGrade(100);
        expect(transmuted100).toBe(100);
        expect(getKs1LetterGrade(transmuted100, 'Grade 1')).toBe('A');

        // 90% initial score -> 91 transmuted -> 'A' (>=90 is A)
        const transmuted90 = transmuteGrade(90);
        expect(transmuted90).toBe(91);
        expect(getKs1LetterGrade(transmuted90, 'Grade 1')).toBe('A');

        // 85% initial score -> 87 transmuted -> 'B' (80-89 is B)
        const transmuted85 = transmuteGrade(85);
        expect(transmuted85).toBe(87);
        expect(getKs1LetterGrade(transmuted85, 'Grade 1')).toBe('B');

        // 75% initial score -> 79 transmuted -> 'C' (75-79 is C)
        const transmuted75 = transmuteGrade(75);
        expect(transmuted75).toBe(79);
        expect(getKs1LetterGrade(transmuted75, 'Grade 1')).toBe('C');

        // 70% initial score (passing 75) -> 75 transmuted -> 'C' (75-79 is C)
        const transmuted70 = transmuteGrade(70);
        expect(transmuted70).toBe(75);
        expect(getKs1LetterGrade(transmuted70, 'Grade 1')).toBe('C');

        // 60% initial score -> 72 transmuted -> 'D' (65-74 is D)
        const transmuted60 = transmuteGrade(60);
        expect(transmuted60).toBe(72);
        expect(getKs1LetterGrade(transmuted60, 'Grade 1')).toBe('D');
    });

    it('allows Grade 1 sections to configure teaching loads and detect subjects in load', () => {
        const grade1Section: Section = {
            id: 'sec-g1-emerald',
            section_name: 'Grade 1 - Emerald',
            section_grade_level: 'Grade 1',
            is_advisory: true,
            is_teaching_load: true,
            adviser_name: 'Teacher Rose',
            taught_subjects: [
                'Language',
                'Reading and Literacy',
                'Mathematics',
                'Makabansa',
                'GMRC (Good Manners and Right Conduct)'
            ],
            teaching_subjects: [
                'Language',
                'Reading and Literacy',
                'Mathematics'
            ]
        };

        // Subjects in teaching load
        expect(isSubjectInTeachingLoad('Language', grade1Section)).toBe(true);
        expect(isSubjectInTeachingLoad('Reading and Literacy', grade1Section)).toBe(true);
        expect(isSubjectInTeachingLoad('Mathematics', grade1Section)).toBe(true);

        // Subject taught by another teacher
        expect(isSubjectInTeachingLoad('Makabansa', grade1Section)).toBe(false);
    });
});
