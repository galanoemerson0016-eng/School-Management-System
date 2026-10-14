import { describe, it, expect, vi } from 'vitest';
import { applyCurriculumPresetToSection, autoRepairSectionCurriculum, repairSectionOwnedSubjectOfferings } from './curriculumSync';
import { getCurriculumPreset, SSHS_G11_STEM_PRESET } from '../lib/curriculumPresets';
import type { Section, Subject } from '../types';

describe('Curriculum Sync & In-Situ Auto-Repair Service', () => {
    it('applies the full SSHS G11 preset including term-sequenced electives per W3-06', async () => {
        const section: Section = {
            id: 'sec_g11_stem',
            section_name: 'Grade 11 - Einstein',
            section_grade_level: 'Grade 11',
            track: 'Academic',
            cluster: 'STEM',
            taught_subjects: [],
            adviser_name: 'Maria Santos',
            is_advisory: true
        };

        const preset = getCurriculumPreset('Grade 11', 'Academic', 'STEM');
        expect(preset).toBeDefined();

        const addedSubjects: Subject[] = [];
        const updatedSubjects: Subject[] = [];
        let updatedSectionRecord: Section | null = null;

        const callbacks = {
            addSubject: async (s: Subject) => { addedSubjects.push(s); },
            updateSubject: async (s: Subject) => { updatedSubjects.push(s); },
            updateSection: async (s: Section) => { updatedSectionRecord = s; }
        };

        const result = await applyCurriculumPresetToSection(section, preset!, [], callbacks);

        expect(result.createdSubjectsCount).toBe(preset!.subjects.length);
        expect(result.updatedSection.taught_subjects?.length).toBe(preset!.subjects.length);
        expect(result.updatedSection.taught_subjects).toEqual(preset!.subjects.map(subject => subject.name));
        expect(result.updatedSection.taught_subjects).toContain('Chemistry 1');
        expect(updatedSectionRecord).not.toBeNull();
        expect(updatedSectionRecord!.section_metadata?.subjectTerms).toBeDefined();

        // Check that added subjects have DepEd weights (DO 15, s. 2026 SHS Core: 20% WW, 50% PT, 30% EX)
        const mathSubject = addedSubjects.find(s => s.subject_name.includes('Math'));
        expect(mathSubject).toBeDefined();
        expect(mathSubject!.written_weight).toBe(20);
        expect(mathSubject!.performance_weight).toBe(50);
        expect(mathSubject!.exam_weight).toBe(30);
        expect(mathSubject!.units).toBe(2);
        expect(mathSubject!.hours).toBe(160);

        // Core subjects should have term === 'all'
        const mabisang = addedSubjects.find(s => s.subject_name.includes('Mabisang Komunikasyon'));
        expect(mabisang).toBeDefined();
        expect(mabisang?.term).toBe('all');
    });

    it('auto-repairs a Grade 11 section with the mandatory cores without inventing electives', async () => {
        const unhealthySection: Section = {
            id: 'sec_unhealthy_g11',
            section_name: 'Grade 11 - Newton',
            section_grade_level: 'Grade 11',
            track: 'Academic',
            cluster: 'STEM',
            // Only 1 subject configured for Term 1, terms 2 & 3 empty
            taught_subjects: ['General Biology 1'],
            section_metadata: {
                subjectTerms: {
                    'General Biology 1': 1
                }
            }
        };

        const addedSubjects: Subject[] = [];
        const callbacks = {
            addSubject: async (s: Subject) => { addedSubjects.push(s); },
            updateSubject: async () => {},
            updateSection: async () => {}
        };

        const repairResult = await autoRepairSectionCurriculum(unhealthySection, [], callbacks);

        expect(repairResult.success).toBe(true);
        expect(repairResult.message).toContain('Grade 11 SSHS');
        expect(repairResult.updatedSection).toBeDefined();

        // Per W3-06, applying the curriculum preset to a Grade 11 section includes
        // the core subjects as well as preset electives and their terms.
        const terms = (repairResult.updatedSection!.section_metadata?.subjectTerms || {}) as Record<string, 1 | 2 | 3 | 'all'>;
        expect(terms).toBeDefined();
        expect(repairResult.updatedSection?.taught_subjects).toEqual(SSHS_G11_STEM_PRESET.subjects.map(subject => subject.name));
        expect(terms['Effective Communication']).toBe('all');
        expect(terms['Pre-Calculus']).toBe(1);
        expect(terms['Basic Calculus']).toBe(2);
        expect(terms['Chemistry 1']).toBe(3);
    });

    it('identifies healthy Elementary section and skips redundant auto-repair', async () => {
        const healthyElemSection: Section = {
            id: 'sec_elem_g1',
            section_name: 'Grade 1 - Rizal',
            section_grade_level: 'Grade 1',
            taught_subjects: [
                'Language',
                'Reading and Literacy',
                'Mathematics',
                'Makabansa',
                'Good Manners and Right Conduct (GMRC)'
            ]
        };

        const callbacks = {
            addSubject: vi.fn(),
            updateSubject: vi.fn(),
            updateSection: vi.fn()
        };

        const result = await autoRepairSectionCurriculum(healthyElemSection, [], callbacks);

        expect(result.success).toBe(true);
        expect(result.message).toContain('already healthy');
        expect(callbacks.addSubject).not.toHaveBeenCalled();
    });

    it('creates only missing section-owned offerings without changing the shared library or existing rows', async () => {
        const section: Section = {
            id: 'sec-plato',
            section_name: 'Plato',
            section_grade_level: 'Grade 11',
            taught_subjects: ['Effective Communication', 'Biology 1'],
            section_metadata: { subjectTerms: { 'Effective Communication': 'all', 'Biology 1': 1 } },
        };
        const existing: Subject[] = [
            { id: 'library-bio', subject_name: 'Biology 1', grade_level: 'Grade 11', term: 1, written_weight: 35, performance_weight: 40, exam_weight: 25 },
            { id: 'plato-core', subject_name: 'Effective Communication', grade_level: 'Grade 11', section_id: 'sec-plato', term: 'all' },
        ];
        const created: Subject[] = [];

        const result = await repairSectionOwnedSubjectOfferings(section, existing, {
            addSubject: async subject => { created.push(subject); },
        });

        expect(result).toEqual({ createdSubjectsCount: 1, existingSubjectsCount: 1 });
        expect(created[0]).toMatchObject({
            subject_name: 'Biology 1', section_id: 'sec-plato', term: 1,
            written_weight: 35, performance_weight: 40, exam_weight: 25,
        });
        expect(created[0].enrolled_student_lrns).toBeUndefined();
        expect(existing).toHaveLength(2);
    });
});
