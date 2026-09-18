import { describe, it, expect, vi } from 'vitest';
import { getCurriculumPreset } from '../lib/curriculumPresets';
import { autoRepairSectionCurriculum } from '../services/curriculumSync';
import type { Section, Subject } from '../types';

describe('Auto-Apply DepEd MATATAG Presets for Advisory Classes', () => {
    describe('Curriculum Preset Resolution for Regular Basic Education (MATATAG)', () => {
        it('resolves Grade 1 MATATAG (5 foundational learning areas)', () => {
            const preset = getCurriculumPreset('Grade 1', undefined, undefined, 'Regular');
            expect(preset).not.toBeNull();
            expect(preset?.curriculumType).toBe('MATATAG');
            expect(preset?.subjects).toHaveLength(5);
            const names = preset?.subjects.map(s => s.name) || [];
            expect(names).toEqual([
                'Language',
                'Reading and Literacy',
                'Mathematics',
                'Makabansa',
                'GMRC (Good Manners and Right Conduct)'
            ]);
        });

        it('resolves Grade 2 MATATAG (5 learning areas)', () => {
            const preset = getCurriculumPreset('Grade 2', undefined, undefined, 'Regular');
            expect(preset).not.toBeNull();
            const names = preset?.subjects.map(s => s.name) || [];
            expect(names).toContain('Filipino');
            expect(names).toContain('English');
            expect(names).toContain('Mathematics');
            expect(names).toContain('Makabansa');
            expect(names).toContain('GMRC (Good Manners and Right Conduct)');
        });

        it('resolves Grade 3 MATATAG (6 learning areas with Science)', () => {
            const preset = getCurriculumPreset('Grade 3', undefined, undefined, 'Regular');
            expect(preset).not.toBeNull();
            const names = preset?.subjects.map(s => s.name) || [];
            expect(names).toContain('Science');
            expect(names).toContain('Mathematics');
            expect(names).toContain('Makabansa');
            expect(names).toHaveLength(6);
        });

        it('resolves Grade 4 MATATAG (Upper Elementary with EPP & MAPEH)', () => {
            const preset = getCurriculumPreset('Grade 4', undefined, undefined, 'Regular');
            expect(preset).not.toBeNull();
            const names = preset?.subjects.map(s => s.name) || [];
            expect(names).toContain('Filipino');
            expect(names).toContain('English');
            expect(names).toContain('Mathematics');
            expect(names).toContain('Science');
            expect(names).toContain('Araling Panlipunan (AP)');
            expect(names).toContain('GMRC (Good Manners and Right Conduct)');
            expect(names).toContain('E.P.P.');
            expect(names).toContain('MAPEH');
        });

        it('resolves Grade 7 MATATAG (Junior High School 8 Core Subjects)', () => {
            const preset = getCurriculumPreset('Grade 7', undefined, undefined, 'Regular');
            expect(preset).not.toBeNull();
            const names = preset?.subjects.map(s => s.name) || [];
            expect(names).toContain('Filipino');
            expect(names).toContain('English');
            expect(names).toContain('Mathematics');
            expect(names).toContain('Science');
            expect(names).toContain('Araling Panlipunan (AP)');
            expect(names).toContain('Values Education');
            expect(names).toContain('Technology and Livelihood Education (TLE)');
            expect(names).toContain('MAPEH');
        });

        it('resolves Grade 10 Regular JHS Core Subjects', () => {
            const preset = getCurriculumPreset('Grade 10', undefined, undefined, 'Regular');
            expect(preset).not.toBeNull();
            const names = preset?.subjects.map(s => s.name) || [];
            expect(names).toContain('Filipino');
            expect(names).toContain('English');
            expect(names).toContain('Mathematics');
            expect(names).toContain('Science');
            expect(names).toContain('Araling Panlipunan (AP)');
            expect(names).toContain('Values Education');
            expect(names).toContain('Technology and Livelihood Education (TLE)');
            expect(names).toContain('MAPEH');
        });
    });

    describe('Auto-Repair for Advisory Classes with Empty Subjects', () => {
        it('automatically repairs and populates official MATATAG subjects for an advisory class with empty taught_subjects', async () => {
            const emptyAdvisorySection: Section = {
                id: 'sec-g1-advisory',
                section_name: 'Sampaguita',
                section_grade_level: 'Grade 1',
                is_advisory: true,
                program: 'Regular',
                taught_subjects: [],
                section_metadata: {}
            };

            const createdSubjects: Subject[] = [];
            let updatedSectionResult: Section | undefined;

            const callbacks = {
                addSubject: vi.fn(async (s: Subject) => { createdSubjects.push(s); }),
                updateSubject: vi.fn(async () => {}),
                updateSection: vi.fn(async (s: Section) => { updatedSectionResult = s; })
            };

            const result = await autoRepairSectionCurriculum(emptyAdvisorySection, [], callbacks);

            expect(result.success).toBe(true);
            expect(callbacks.updateSection).toHaveBeenCalled();
            expect(updatedSectionResult?.taught_subjects).toEqual([
                'Language',
                'Reading and Literacy',
                'Mathematics',
                'Makabansa',
                'GMRC (Good Manners and Right Conduct)'
            ]);
            expect(createdSubjects).toHaveLength(5);
            expect(createdSubjects.every(s => s.section_id === 'sec-g1-advisory')).toBe(true);
            expect(createdSubjects.every(s => (s.written_weight ?? 0) > 0 && (s.performance_weight ?? 0) > 0)).toBe(true);
        });

        it('preserves existing Grade 7 subjects while repairing missing term assignments', async () => {
            const preset = getCurriculumPreset('Grade 7', undefined, undefined, 'Regular')!;
            const g7AdvisorySection: Section = {
                id: 'sec-g7-advisory',
                section_name: 'Rizal',
                section_grade_level: 'Grade 7',
                is_advisory: true,
                program: 'Regular',
                taught_subjects: [],
                section_metadata: {}
            };

            let updatedSectionResult: Section | undefined;
            const callbacks = {
                addSubject: vi.fn(async () => {}),
                updateSubject: vi.fn(async () => {}),
                updateSection: vi.fn(async (s: Section) => { updatedSectionResult = s; })
            };

            const result = await autoRepairSectionCurriculum(g7AdvisorySection, [], callbacks);
            expect(result.success).toBe(true);
            expect(updatedSectionResult?.taught_subjects).toHaveLength(preset.subjects.length);
            const metadata = updatedSectionResult?.section_metadata?.subjectTerms as Record<string, unknown>;
            expect(metadata['Mathematics']).toBe('all');
            expect(metadata['Filipino']).toBe('all');
        });
    });
});
