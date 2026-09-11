import { describe, it, expect } from 'vitest';
import type { Section } from '../types';
import { sortSubjects, normalizeSubjectName } from '../lib/subjectConfig';

describe('Manage Columns Workflow in Grade Management', () => {
    const baseSection: Section = {
        id: 'sec-g7-diamond',
        section_name: 'Grade 7 - Diamond',
        section_grade_level: 'Grade 7',
        is_advisory: true,
        taught_subjects: [
            'Science',
            'Mathematics',
            'English',
            'Filipino',
            'Araling Panlipunan',
            'GMRC',
            'TLE',
            'Music and Arts',
            'Physical Education and Health'
        ],
        teaching_subjects: ['Science']
    };

    // Mirrors the sorting and filtering logic in ConsolidatedGradesPage.tsx
    function resolveConsolidatedColumns(
        section: Section,
        withGroupData: { subject_name: string; id: string }[]
    ): { subject_name: string; id: string }[] {
        const taughtOrder = section.taught_subjects || [];
        let filteredCandidates = withGroupData;

        if (taughtOrder.length > 1) {
            const isAllowed = (name: string) => {
                const norm = normalizeSubjectName(name);
                return taughtOrder.some(t => {
                    const normT = normalizeSubjectName(t);
                    return normT === norm || t.toLowerCase() === name.toLowerCase();
                });
            };
            filteredCandidates = withGroupData.filter(s => isAllowed(s.subject_name));
        }

        let orderedSubjects: typeof withGroupData;

        if (taughtOrder.length > 1) {
            const getTaughtIndex = (subName: string) => {
                const norm = normalizeSubjectName(subName);
                return taughtOrder.findIndex(t => {
                    const normT = normalizeSubjectName(t);
                    return normT === norm || t.toLowerCase() === subName.toLowerCase();
                });
            };

            orderedSubjects = [...filteredCandidates].sort((a, b) => {
                const idxA = getTaughtIndex(a.subject_name);
                const idxB = getTaughtIndex(b.subject_name);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return 0;
            });
        } else {
            orderedSubjects = sortSubjects(withGroupData, s => s.subject_name);
        }

        const hiddenNorms = new Set(
            (section.section_metadata?.hiddenConsolidatedSubjects || []).map(h => normalizeSubjectName(h))
        );

        return orderedSubjects.filter(sub => {
            const norm = normalizeSubjectName(sub.subject_name);
            return !hiddenNorms.has(norm);
        });
    }

    const testSubjects = [
        { id: 'sub-eng', subject_name: 'English' },
        { id: 'sub-sci', subject_name: 'Science' },
        { id: 'sub-math', subject_name: 'Mathematics' },
        { id: 'sub-fil', subject_name: 'Filipino' },
        { id: 'sub-ap', subject_name: 'Araling Panlipunan' },
        { id: 'sub-gmrc', subject_name: 'GMRC' },
        { id: 'sub-tle', subject_name: 'TLE' },
        { id: 'sub-rob', subject_name: 'Robotics' }
    ];

    it('1. Respects custom order when taught_subjects is manually arranged', () => {
        // Teacher arranged: Mathematics first, then Science, then English
        const customizedSection: Section = {
            ...baseSection,
            taught_subjects: ['Mathematics', 'Science', 'English', 'Filipino', 'Araling Panlipunan', 'GMRC', 'TLE']
        };

        const result = resolveConsolidatedColumns(customizedSection, testSubjects);
        const names = result.map(r => r.subject_name);

        expect(names[0]).toBe('Mathematics');
        expect(names[1]).toBe('Science');
        expect(names[2]).toBe('English');
    });

    it('2. Appends newly added subject to the columns list', () => {
        const sectionWithAddedSubject: Section = {
            ...baseSection,
            taught_subjects: [...baseSection.taught_subjects!, 'Robotics']
        };

        const result = resolveConsolidatedColumns(sectionWithAddedSubject, testSubjects);
        const names = result.map(r => r.subject_name);

        expect(names).toContain('Robotics');
        expect(names[names.length - 1]).toBe('Robotics');
    });

    it('3. Excludes subject from columns when removed from taught_subjects', () => {
        const sectionWithoutTLE: Section = {
            ...baseSection,
            taught_subjects: baseSection.taught_subjects!.filter(s => s !== 'TLE')
        };

        const result = resolveConsolidatedColumns(sectionWithoutTLE, testSubjects);
        const names = result.map(r => r.subject_name);

        expect(names).not.toContain('TLE');
        expect(names).toContain('Science');
        expect(names).toContain('Mathematics');
    });

    it('4. Hides subject from columns when included in hiddenConsolidatedSubjects without deleting from taught_subjects', () => {
        const sectionWithHiddenAP: Section = {
            ...baseSection,
            taught_subjects: ['Science', 'Mathematics', 'English', 'Araling Panlipunan'],
            section_metadata: {
                hiddenConsolidatedSubjects: ['Araling Panlipunan']
            }
        };

        const result = resolveConsolidatedColumns(sectionWithHiddenAP, testSubjects);
        const names = result.map(r => r.subject_name);

        // Araling Panlipunan is hidden from the sheet
        expect(names).not.toContain('Araling Panlipunan');
        // Still preserved in taught_subjects!
        expect(sectionWithHiddenAP.taught_subjects).toContain('Araling Panlipunan');
    });

    it('5. Reset to DepEd Order restores official standard sequence', () => {
        const reversedSubjects = ['Robotics', 'TLE', 'Science', 'English', 'Filipino'];
        const sorted = sortSubjects(reversedSubjects, s => s);

        // DepEd order: Filipino, English, Science, TLE, Robotics
        expect(sorted[0]).toBe('Filipino');
        expect(sorted[1]).toBe('English');
        expect(sorted[2]).toBe('Science');
        expect(sorted[3]).toBe('TLE');
        expect(sorted[4]).toBe('Robotics');
    });
});
