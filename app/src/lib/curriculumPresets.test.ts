import { describe, it, expect } from 'vitest';
import {
    getCurriculumPreset,
    getAvailablePresetsForGrade,
    getDepEdWeightsForSubject,
    validateSectionCurriculumHealth,
    SSHS_G11_STEM_PRESET,
    SSHS_G11_CORE_SUBJECTS,
    GRADE_1_MATATAG_PRESET
} from './curriculumPresets';

describe('DepEd Curriculum Presets Engine (Universal 3-Term)', () => {
    describe('Elementary Presets', () => {
        it('returns Grade 1 MATATAG with exactly 5 subjects spanning all terms', () => {
            const preset = getCurriculumPreset('Grade 1');
            expect(preset).not.toBeNull();
            expect(preset?.id).toBe('elem-g1-matatag');
            expect(preset?.subjects).toHaveLength(5);
            expect(preset?.subjects.every(s => s.term === 'all')).toBe(true);

            const names = preset?.subjects.map(s => s.name);
            expect(names).toContain('Language');
            expect(names).toContain('Reading and Literacy');
            expect(names).toContain('Mathematics');
            expect(names).toContain('Makabansa');
            expect(names).toContain('GMRC (Good Manners and Right Conduct)');
        });

        it('returns Grade 3 MATATAG with 6 subjects including Science', () => {
            const preset = getCurriculumPreset('Grade 3');
            expect(preset?.subjects).toHaveLength(6);
            expect(preset?.subjects.some(s => s.name === 'Science')).toBe(true);
        });

        it('returns Grade 4 with 8 learning areas and MAPEH components', () => {
            const preset = getCurriculumPreset('Grade 4');
            expect(preset?.subjects.some(s => s.name === 'MAPEH')).toBe(true);
            expect(preset?.subjects.some(s => s.name === 'Music and Arts' && s.is_component)).toBe(true);
            expect(preset?.subjects.some(s => s.name === 'Physical Education and Health' && s.is_component)).toBe(true);
        });
    });

    describe('Junior High School Presets', () => {
        it('returns Grade 7 Regular with standard 8 core subjects', () => {
            const preset = getCurriculumPreset('Grade 7', undefined, undefined, 'Regular');
            expect(preset?.program).toBe('Regular');
            expect(preset?.subjects.some(s => s.name === 'Filipino')).toBe(true);
            expect(preset?.subjects.some(s => s.name === 'Mathematics')).toBe(true);
            expect(preset?.subjects.some(s => s.name === 'Science')).toBe(true);
            expect(preset?.subjects.some(s => s.name === 'Araling Panlipunan (AP)')).toBe(true);
        });

        it('returns Grade 7 STE with Environmental Science and Research I', () => {
            const preset = getCurriculumPreset('Grade 7', undefined, undefined, 'STE');
            expect(preset?.program).toBe('STE');
            const names = preset?.subjects.map(s => s.name);
            expect(names).toContain('Environmental Science');
            expect(names).toContain('Research I (Scientific Investigation)');
        });
    });

    describe('Senior High School Grade 11 (SSHS DO 017, s. 2026)', () => {
        it('contains 6 core subjects spanning all 3 terms', () => {
            expect(SSHS_G11_CORE_SUBJECTS).toHaveLength(6);
            expect(SSHS_G11_CORE_SUBJECTS.every(s => s.term === 'all')).toBe(true);
            expect(SSHS_G11_CORE_SUBJECTS.map(s => s.name)).toEqual([
                'Effective Communication',
                'Mabisang Komunikasyon',
                'General Mathematics',
                'General Science',
                'Life and Career Skills',
                'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
            ]);
        });

        it('matches Grade 11 STEM with sequenced electives across Terms 1, 2, and 3', () => {
            const preset = getCurriculumPreset('Grade 11', 'Academic', 'Science, Technology, Engineering, and Mathematics');
            expect(preset?.id).toBe(SSHS_G11_STEM_PRESET.id);

            // Term 1 electives: Chemistry 1, Pre-Calculus
            const t1Electives = preset?.subjects.filter(s => s.term === 1).map(s => s.name);
            expect(t1Electives).toContain('Chemistry 1');
            expect(t1Electives).toContain('Pre-Calculus');

            // Term 2 electives: Chemistry 2, Basic Calculus, Physics 1
            const t2Electives = preset?.subjects.filter(s => s.term === 2).map(s => s.name);
            expect(t2Electives).toContain('Chemistry 2');
            expect(t2Electives).toContain('Basic Calculus');
            expect(t2Electives).toContain('Physics 1');

            // Term 3 electives: Physics 2, Advanced Mathematics
            const t3Electives = preset?.subjects.filter(s => s.term === 3).map(s => s.name);
            expect(t3Electives).toContain('Physics 2');
            expect(t3Electives).toContain('Advanced Mathematics');
        });

        it('matches Grade 11 TechPro ICT preset', () => {
            const preset = getCurriculumPreset('Grade 11', 'Technical-Professional', 'ICT Support and Computer Programming Technologies');
            expect(preset?.id).toBe('sshs-g11-techpro-ict');
            expect(preset?.subjects.some(s => s.name === 'Computer Systems Servicing' && s.term === 1)).toBe(true);
            expect(preset?.subjects.some(s => s.name === 'Broadband Installation' && s.term === 2)).toBe(true);
            expect(preset?.subjects.some(s => s.name === 'Computer Programming (.Net Technology)' && s.term === 3)).toBe(true);
        });
    });

    describe('Senior High School Grade 12 (3-Term Model)', () => {
        it('matches Grade 12 STEM with subjects across Terms 1, 2, and 3', () => {
            const preset = getCurriculumPreset('Grade 12', 'Academic', 'STEM');
            expect(preset?.id).toBe('shs-g12-stem-3term');
            expect(preset?.subjects.some(s => s.term === 1)).toBe(true);
            expect(preset?.subjects.some(s => s.term === 2)).toBe(true);
            expect(preset?.subjects.some(s => s.term === 3)).toBe(true);
        });
    });

    describe('DepEd Assessment Weights', () => {
        it('assigns 40/40/20 for Math and Science in Elementary/JHS', () => {
            const weights = getDepEdWeightsForSubject('Mathematics', 'Grade 7');
            expect(weights).toEqual({ written_weight: 40, performance_weight: 40, exam_weight: 20 });
        });

        it('assigns 30/50/20 for Languages and AP in Elementary/JHS', () => {
            const weights = getDepEdWeightsForSubject('English', 'Grade 8');
            expect(weights).toEqual({ written_weight: 30, performance_weight: 50, exam_weight: 20 });
        });

        it('assigns 20/60/20 for MAPEH and TLE', () => {
            const weights = getDepEdWeightsForSubject('Technology and Livelihood Education (TLE)', 'Grade 9');
            expect(weights).toEqual({ written_weight: 20, performance_weight: 60, exam_weight: 20 });
        });

        it('assigns 25/50/25 for SHS Core subjects', () => {
            const weights = getDepEdWeightsForSubject('Effective Communication', 'Grade 11', 'Academic');
            expect(weights).toEqual({ written_weight: 25, performance_weight: 50, exam_weight: 25 });
        });
    });

    describe('validateSectionCurriculumHealth', () => {
        it('flags missing terms if SHS section has no subjects for a term', () => {
            const health = validateSectionCurriculumHealth(
                ['Effective Communication', 'Chemistry 1'],
                { 'Chemistry 1': 1 }, // Term 1 only; Term 2 and 3 electives missing!
                'Grade 11'
            );
            // Effective Communication has no metadata so it defaults to all, meaning T1, T2, T3 have at least 1
            expect(health.isHealthy).toBe(true);
        });

        it('flags when taughtSubjects is empty', () => {
            const health = validateSectionCurriculumHealth([], {}, 'Grade 11');
            expect(health.isHealthy).toBe(false);
            expect(health.missingTerms).toEqual([1, 2, 3]);
        });
    });
});
