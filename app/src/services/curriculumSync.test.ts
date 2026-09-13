import { describe, it, expect, vi } from 'vitest';
import { applyCurriculumPresetToSection, autoRepairSectionCurriculum } from './curriculumSync';
import { getCurriculumPreset } from '../lib/curriculumPresets';
import type { Section, Subject } from '../types';

describe('Curriculum Sync & In-Situ Auto-Repair Service', () => {
    it('applies SSHS G11 STEM preset to section and creates Subject records with DepEd weights', async () => {
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
        expect(updatedSectionRecord).not.toBeNull();
        expect(updatedSectionRecord!.section_metadata?.subjectTerms).toBeDefined();

        // Check that added subjects have DepEd weights (DO 8, s. 2015 SHS Core: 25% WW, 50% PT, 25% QA)
        const mathSubject = addedSubjects.find(s => s.subject_name.includes('Math'));
        expect(mathSubject).toBeDefined();
        expect(mathSubject!.written_weight).toBe(25);
        expect(mathSubject!.performance_weight).toBe(50);
        expect(mathSubject!.exam_weight).toBe(25);

        // Core subjects should have term === 'all'
        const mabisang = addedSubjects.find(s => s.subject_name.includes('Mabisang Komunikasyon'));
        expect(mabisang).toBeDefined();
        expect(mabisang?.term).toBe('all');
    });

    it('auto-repairs a Grade 11 section with missing Term 2 and Term 3 subjects', async () => {
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

        // Term 2 and Term 3 should now have subjects configured
        const terms = (repairResult.updatedSection!.section_metadata?.subjectTerms || {}) as Record<string, 1 | 2 | 3 | 'all'>;
        expect(terms).toBeDefined();

        const term2Subjects = Object.entries(terms).filter(([, t]) => t === 2);
        const term3Subjects = Object.entries(terms).filter(([, t]) => t === 3);
        expect(term2Subjects.length).toBeGreaterThan(0);
        expect(term3Subjects.length).toBeGreaterThan(0);
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
});
