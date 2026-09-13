import { describe, it, expect } from 'vitest';
import type { Section } from '../types';
import { sortSubjects, normalizeSubjectName, getCanonicalSubjectKey } from '../lib/subjectConfig';

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
        const hiddenList = section.section_metadata?.hiddenConsolidatedSubjects || [];
        const isSubjectHidden = (subName: string): boolean => {
            if (!hiddenList || hiddenList.length === 0 || !subName) return false;
            const normSub = normalizeSubjectName(subName);
            const canonSub = getCanonicalSubjectKey(subName, section.section_grade_level);

            const isMapehParentHidden = hiddenList.some(h => normalizeSubjectName(h) === 'mapeh');
            if (isMapehParentHidden) {
                if (normSub === 'mapeh' || normSub.includes('music') || normSub.includes('arts') || normSub.includes('pe') || normSub.includes('health') || normSub.includes('physical')) {
                    return true;
                }
            }

            for (const h of hiddenList) {
                if (!h) continue;
                if (h.toLowerCase().trim() === subName.toLowerCase().trim()) return true;
                const normH = normalizeSubjectName(h);
                if (normH && normH === normSub) return true;
                const canonH = getCanonicalSubjectKey(h, section.section_grade_level);
                if (canonH && (canonH === canonSub || canonH === normSub || normH === canonSub)) return true;
            }
            return false;
        };

        const taughtOrder = (section.taught_subjects || []).filter(t => !isSubjectHidden(t));
        let filteredCandidates = withGroupData.filter(s => !isSubjectHidden(s.subject_name));

        if (taughtOrder.length > 1) {
            const isAllowed = (name: string) => {
                const norm = normalizeSubjectName(name);
                return taughtOrder.some(t => {
                    const normT = normalizeSubjectName(t);
                    return normT === norm || t.toLowerCase() === name.toLowerCase();
                });
            };
            filteredCandidates = filteredCandidates.filter(s => isAllowed(s.subject_name));
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
            orderedSubjects = sortSubjects(filteredCandidates, s => s.subject_name);
        }

        return orderedSubjects.filter(sub => !isSubjectHidden(sub.subject_name));
    }

    // Mirrors handleDeleteColumn from ConsolidatedGradesPage.tsx
    function deleteColumnWorkflow(section: Section, subjectToDelete: string): Section {
        const trimmed = subjectToDelete.trim();
        const normTrimmed = normalizeSubjectName(trimmed);
        const canonTrimmed = getCanonicalSubjectKey(trimmed, section.section_grade_level);

        const prevHidden = section.section_metadata?.hiddenConsolidatedSubjects || [];
        const isTargetMatch = (s: string) => {
            if (s.toLowerCase().trim() === trimmed.toLowerCase()) return true;
            if (normalizeSubjectName(s) === normTrimmed) return true;
            const canon = getCanonicalSubjectKey(s, section.section_grade_level);
            if (canon && (canon === canonTrimmed || canon === normTrimmed)) return true;
            return false;
        };

        const alreadyInHidden = prevHidden.some(h => isTargetMatch(h));
        const updatedHidden = alreadyInHidden ? [...prevHidden] : [...prevHidden, trimmed];

        if (normTrimmed === 'mapeh') {
            const mapehSubs = ['Music and Arts', 'Physical Education and Health', 'Music', 'Arts', 'Physical Education', 'Health'];
            mapehSubs.forEach(ms => {
                if (!updatedHidden.some(h => normalizeSubjectName(h) === normalizeSubjectName(ms))) {
                    updatedHidden.push(ms);
                }
            });
        }

        const currentTaught = section.taught_subjects || [];
        const updatedTaught = currentTaught.filter(s => !isTargetMatch(s));

        const updatedTeaching = section.teaching_subjects
            ? section.teaching_subjects.filter(s => !isTargetMatch(s))
            : undefined;

        return {
            ...section,
            taught_subjects: updatedTaught,
            ...(updatedTeaching !== undefined ? { teaching_subjects: updatedTeaching } : {}),
            section_metadata: {
                ...section.section_metadata,
                hiddenConsolidatedSubjects: updatedHidden
            }
        };
    }

    // Mirrors handleQuickAddSubject from ConsolidatedGradesPage.tsx
    function quickAddSubjectWorkflow(section: Section, subjectToAdd: string): Section {
        const trimmed = subjectToAdd.trim();
        const normTrimmed = normalizeSubjectName(trimmed);
        const canonTrimmed = getCanonicalSubjectKey(trimmed, section.section_grade_level);

        const currentTaught = section.taught_subjects || [];
        const updatedTaught = [...currentTaught, trimmed];

        const prevHidden = section.section_metadata?.hiddenConsolidatedSubjects || [];
        const updatedHidden = prevHidden.filter(h => {
            if (h.toLowerCase().trim() === trimmed.toLowerCase()) return false;
            if (normalizeSubjectName(h) === normTrimmed) return false;
            const canonH = getCanonicalSubjectKey(h, section.section_grade_level);
            if (canonH && (canonH === canonTrimmed || canonH === normTrimmed)) return false;
            return true;
        });

        return {
            ...section,
            taught_subjects: updatedTaught,
            section_metadata: {
                ...section.section_metadata,
                hiddenConsolidatedSubjects: updatedHidden
            }
        };
    }

    const testSubjects = [
        { id: 'sub-eng', subject_name: 'English' },
        { id: 'sub-sci', subject_name: 'Science' },
        { id: 'sub-math', subject_name: 'Mathematics' },
        { id: 'sub-fil', subject_name: 'Filipino' },
        { id: 'sub-ap', subject_name: 'Araling Panlipunan' },
        { id: 'sub-gmrc', subject_name: 'GMRC' },
        { id: 'sub-tle', subject_name: 'TLE' },
        { id: 'sub-ma', subject_name: 'Music and Arts' },
        { id: 'sub-peh', subject_name: 'Physical Education and Health' },
        { id: 'sub-rob', subject_name: 'Robotics' }
    ];

    it('1. Respects custom order when taught_subjects is manually arranged', () => {
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

        expect(names).not.toContain('Araling Panlipunan');
        expect(sectionWithHiddenAP.taught_subjects).toContain('Araling Panlipunan');
    });

    it('5. Reset to DepEd Order restores official standard sequence', () => {
        const reversedSubjects = ['Robotics', 'TLE', 'Science', 'English', 'Filipino'];
        const sorted = sortSubjects(reversedSubjects, s => s);

        expect(sorted[0]).toBe('Filipino');
        expect(sorted[1]).toBe('English');
        expect(sorted[2]).toBe('Science');
        expect(sorted[3]).toBe('TLE');
        expect(sorted[4]).toBe('Robotics');
    });

    it('6. Deleting a column properly adds it to hiddenConsolidatedSubjects and removes it from taught_subjects & teaching_subjects', () => {
        // Section with teaching load in Science and TLE
        const section: Section = {
            ...baseSection,
            taught_subjects: ['Science', 'Mathematics', 'English', 'TLE'],
            teaching_subjects: ['Science', 'TLE'],
            section_metadata: {}
        };

        // User deletes TLE
        const updated = deleteColumnWorkflow(section, 'TLE');

        expect(updated.section_metadata?.hiddenConsolidatedSubjects).toContain('TLE');
        expect(updated.taught_subjects).not.toContain('TLE');
        expect(updated.teaching_subjects).not.toContain('TLE');

        const columns = resolveConsolidatedColumns(updated, testSubjects);
        const columnNames = columns.map(c => c.subject_name);

        expect(columnNames).not.toContain('TLE');
        expect(columnNames).toContain('Science');
        expect(columnNames).toContain('Mathematics');
        expect(columnNames).toContain('English');
    });

    it('7. Deleting a column with canonical alias variants (e.g. "Araling Panlipunan (AP)" vs "Araling Panlipunan")', () => {
        const section: Section = {
            ...baseSection,
            taught_subjects: ['Araling Panlipunan (AP)', 'Science', 'Mathematics'],
            section_metadata: {}
        };

        const updated = deleteColumnWorkflow(section, 'Araling Panlipunan');
        const columns = resolveConsolidatedColumns(updated, testSubjects);
        const columnNames = columns.map(c => c.subject_name);

        expect(columnNames).not.toContain('Araling Panlipunan');
        expect(columnNames).not.toContain('Araling Panlipunan (AP)');
    });

    it('8. Deleting MAPEH hides MAPEH and all its composite subcomponents', () => {
        const section: Section = {
            ...baseSection,
            taught_subjects: ['Mathematics', 'Science', 'Music and Arts', 'Physical Education and Health'],
            section_metadata: {}
        };

        const updated = deleteColumnWorkflow(section, 'MAPEH');
        const columns = resolveConsolidatedColumns(updated, testSubjects);
        const columnNames = columns.map(c => c.subject_name);

        expect(columnNames).not.toContain('Music and Arts');
        expect(columnNames).not.toContain('Physical Education and Health');
        expect(columnNames).toContain('Mathematics');
        expect(columnNames).toContain('Science');
    });

    it('9. Re-adding a previously deleted subject unhides it and restores it to columns', () => {
        const section: Section = {
            ...baseSection,
            taught_subjects: ['Science', 'Mathematics'],
            section_metadata: {
                hiddenConsolidatedSubjects: ['English']
            }
        };

        // Initially English is hidden
        const initialCols = resolveConsolidatedColumns(section, testSubjects).map(c => c.subject_name);
        expect(initialCols).not.toContain('English');

        // Teacher re-adds English
        const restoredSection = quickAddSubjectWorkflow(section, 'English');

        expect(restoredSection.section_metadata?.hiddenConsolidatedSubjects).not.toContain('English');
        expect(restoredSection.taught_subjects).toContain('English');

        const restoredCols = resolveConsolidatedColumns(restoredSection, testSubjects).map(c => c.subject_name);
        expect(restoredCols).toContain('English');
    });

    it('10. Deleting when taught_subjects has only 1 or 0 subjects left keeps the deleted subject hidden', () => {
        const section: Section = {
            ...baseSection,
            taught_subjects: ['Science', 'Mathematics'],
            section_metadata: {}
        };

        // Delete Mathematics, leaving only 1 subject
        const updated = deleteColumnWorkflow(section, 'Mathematics');
        expect(updated.taught_subjects?.length).toBe(1);

        const columns = resolveConsolidatedColumns(updated, testSubjects);
        const names = columns.map(c => c.subject_name);

        // Mathematics remains hidden, even with <= 1 taught subject
        expect(names).not.toContain('Mathematics');
        expect(names).toContain('Science');
    });
});
