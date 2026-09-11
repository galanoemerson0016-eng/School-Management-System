import { describe, it, expect } from 'vitest';
import type { Section } from '../types';

/**
 * Pure-logic unit tests verifying that subject rename / delete operations
 * correctly propagate to BOTH taught_subjects AND teaching_subjects.
 *
 * These tests mirror the transformation logic in app-store.ts
 * (updateSubject, deleteSubject, deleteSubjectsBulk) without needing
 * the full Zustand store or IndexedDB.
 */

// Helper: matches the normalizeSubjectName used in app-store.ts
function normalizeSubjectName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

// ─── Rename propagation (mirrors updateSubject logic) ───────────────────

function applyRenameToSections(
    sections: Section[],
    oldName: string,
    newName: string
): Section[] {
    return sections.map(sec => ({
        ...sec,
        taught_subjects: sec.taught_subjects?.map(name =>
            normalizeSubjectName(name) === normalizeSubjectName(oldName) ? newName : name
        ) || [],
        teaching_subjects: sec.teaching_subjects?.map(name =>
            normalizeSubjectName(name) === normalizeSubjectName(oldName) ? newName : name
        ) || []
    }));
}

// ─── Delete propagation (mirrors deleteSubject logic) ───────────────────

function applyDeleteToSections(
    sections: Section[],
    deletedSubjectName: string
): Section[] {
    return sections.map(sec => ({
        ...sec,
        taught_subjects: sec.taught_subjects?.filter(name =>
            normalizeSubjectName(name) !== normalizeSubjectName(deletedSubjectName)
        ) || [],
        teaching_subjects: sec.teaching_subjects?.filter(name =>
            normalizeSubjectName(name) !== normalizeSubjectName(deletedSubjectName)
        ) || []
    }));
}

// ─── Bulk delete propagation (mirrors deleteSubjectsBulk logic) ─────────

function applyBulkDeleteToSections(
    sections: Section[],
    deletedNames: Set<string>
): Section[] {
    return sections.map(sec => {
        if (deletedNames.size === 0) return sec;
        return {
            ...sec,
            taught_subjects: sec.taught_subjects?.filter(name =>
                !deletedNames.has(normalizeSubjectName(name))
            ) || [],
            teaching_subjects: sec.teaching_subjects?.filter(name =>
                !deletedNames.has(normalizeSubjectName(name))
            ) || []
        };
    });
}

// ─── Persistence dirty check (mirrors the JSON.stringify comparison) ────

function isSectionDirty(prev: Section, next: Section): boolean {
    return (
        JSON.stringify(prev.taught_subjects) !== JSON.stringify(next.taught_subjects) ||
        JSON.stringify(prev.teaching_subjects) !== JSON.stringify(next.teaching_subjects)
    );
}

describe('Subject Sync — teaching_subjects propagation', () => {
    const baseSections: Section[] = [
        {
            id: 'sec-advisory',
            section_name: 'Grade 7 - Matatag',
            section_grade_level: 'Grade 7',
            is_advisory: true,
            is_teaching_load: true,
            adviser_name: 'Teacher Emerson',
            taught_subjects: ['Science', 'Mathematics', 'English', 'Filipino'],
            teaching_subjects: ['Science', 'Mathematics']
        },
        {
            id: 'sec-teaching-only',
            section_name: 'Grade 8 - Mapagmahal',
            section_grade_level: 'Grade 8',
            is_advisory: false,
            is_teaching_load: true,
            taught_subjects: ['Science', 'TLE'],
            teaching_subjects: ['Science']
        },
        {
            id: 'sec-unrelated',
            section_name: 'Grade 9 - Pag-asa',
            section_grade_level: 'Grade 9',
            is_advisory: true,
            taught_subjects: ['Araling Panlipunan', 'Values Education'],
            teaching_subjects: []
        }
    ];

    // ─── RENAME TESTS ───────────────────────────────────────────────

    describe('Rename propagation', () => {
        it('renames subject in both taught_subjects and teaching_subjects', () => {
            const result = applyRenameToSections(baseSections, 'Science', 'General Science');

            // Advisory section: taught has Science → General Science, teaching has Science → General Science
            expect(result[0].taught_subjects).toContain('General Science');
            expect(result[0].taught_subjects).not.toContain('Science');
            expect(result[0].teaching_subjects).toContain('General Science');
            expect(result[0].teaching_subjects).not.toContain('Science');

            // Teaching-only section: same propagation
            expect(result[1].taught_subjects).toContain('General Science');
            expect(result[1].teaching_subjects).toContain('General Science');
        });

        it('preserves unrelated subjects during rename', () => {
            const result = applyRenameToSections(baseSections, 'Science', 'General Science');

            // Other subjects unchanged
            expect(result[0].taught_subjects).toContain('Mathematics');
            expect(result[0].taught_subjects).toContain('English');
            expect(result[0].taught_subjects).toContain('Filipino');
            expect(result[0].teaching_subjects).toContain('Mathematics');

            // Unrelated section entirely unchanged
            expect(result[2].taught_subjects).toEqual(['Araling Panlipunan', 'Values Education']);
            expect(result[2].teaching_subjects).toEqual([]);
        });

        it('handles case-insensitive rename', () => {
            const result = applyRenameToSections(baseSections, 'science', 'General Science');
            expect(result[0].teaching_subjects).toContain('General Science');
            expect(result[1].teaching_subjects).toContain('General Science');
        });
    });

    // ─── DELETE TESTS ───────────────────────────────────────────────

    describe('Delete propagation', () => {
        it('removes subject from both taught_subjects and teaching_subjects', () => {
            const result = applyDeleteToSections(baseSections, 'Science');

            expect(result[0].taught_subjects).toEqual(['Mathematics', 'English', 'Filipino']);
            expect(result[0].teaching_subjects).toEqual(['Mathematics']);

            expect(result[1].taught_subjects).toEqual(['TLE']);
            expect(result[1].teaching_subjects).toEqual([]);
        });

        it('preserves unrelated subjects during delete', () => {
            const result = applyDeleteToSections(baseSections, 'Science');

            expect(result[2].taught_subjects).toEqual(['Araling Panlipunan', 'Values Education']);
            expect(result[2].teaching_subjects).toEqual([]);
        });
    });

    // ─── BULK DELETE TESTS ──────────────────────────────────────────

    describe('Bulk delete propagation', () => {
        it('removes multiple subjects from both arrays', () => {
            const deletedNames = new Set([
                normalizeSubjectName('Science'),
                normalizeSubjectName('Mathematics')
            ]);
            const result = applyBulkDeleteToSections(baseSections, deletedNames);

            expect(result[0].taught_subjects).toEqual(['English', 'Filipino']);
            expect(result[0].teaching_subjects).toEqual([]);

            expect(result[1].taught_subjects).toEqual(['TLE']);
            expect(result[1].teaching_subjects).toEqual([]);
        });

        it('skips sections when deletedNames is empty', () => {
            const result = applyBulkDeleteToSections(baseSections, new Set());

            // Sections returned as-is (same reference)
            expect(result[0]).toBe(baseSections[0]);
            expect(result[1]).toBe(baseSections[1]);
            expect(result[2]).toBe(baseSections[2]);
        });
    });

    // ─── PERSISTENCE DIRTY CHECK ────────────────────────────────────

    describe('Persistence dirty check', () => {
        it('detects change when only teaching_subjects changed', () => {
            const prev: Section = {
                ...baseSections[0],
                teaching_subjects: ['Science', 'Mathematics']
            };
            const next: Section = {
                ...baseSections[0],
                teaching_subjects: ['General Science', 'Mathematics']
            };
            expect(isSectionDirty(prev, next)).toBe(true);
        });

        it('detects change when only taught_subjects changed', () => {
            const prev = baseSections[0];
            const next: Section = {
                ...baseSections[0],
                taught_subjects: ['General Science', 'Mathematics', 'English', 'Filipino']
            };
            expect(isSectionDirty(prev, next)).toBe(true);
        });

        it('returns false when nothing changed', () => {
            expect(isSectionDirty(baseSections[0], { ...baseSections[0] })).toBe(false);
        });
    });

    // ─── AUTO-SYNC ON ADD ───────────────────────────────────────────

    describe('Auto-sync on addSubject', () => {
        // Mirrors the logic added to addSubject in app-store.ts
        function applyAutoSync(
            sections: Section[],
            newSubjectName: string,
            newSubjectGradeLevel: string
        ): Section[] {
            const sectionsToUpdate = sections.filter(sec =>
                sec.is_advisory &&
                sec.section_grade_level === newSubjectGradeLevel &&
                !(sec.taught_subjects || []).some(t =>
                    normalizeSubjectName(t) === normalizeSubjectName(newSubjectName)
                )
            );
            if (sectionsToUpdate.length === 0) return sections;

            const updateIds = new Set(sectionsToUpdate.map(s => s.id));
            return sections.map(sec => {
                if (!updateIds.has(sec.id)) return sec;
                return {
                    ...sec,
                    taught_subjects: [...(sec.taught_subjects || []), newSubjectName]
                };
            });
        }

        const multiSections: Section[] = [
            {
                id: 'sec-g7-a',
                section_name: 'Grade 7 - Matatag',
                section_grade_level: 'Grade 7',
                is_advisory: true,
                taught_subjects: ['English', 'Mathematics'],
                teaching_subjects: ['English']
            },
            {
                id: 'sec-g7-b',
                section_name: 'Grade 7 - Magiting',
                section_grade_level: 'Grade 7',
                is_advisory: true,
                taught_subjects: ['English', 'Mathematics'],
                teaching_subjects: []
            },
            {
                id: 'sec-g8-a',
                section_name: 'Grade 8 - Mapagmahal',
                section_grade_level: 'Grade 8',
                is_advisory: true,
                taught_subjects: ['Science'],
                teaching_subjects: []
            },
            {
                id: 'sec-g7-teaching',
                section_name: 'Grade 7 - Malusog',
                section_grade_level: 'Grade 7',
                is_advisory: false,
                is_teaching_load: true,
                taught_subjects: ['Science'],
                teaching_subjects: ['Science']
            }
        ];

        it('appends new subject to all advisory sections of the same grade', () => {
            const result = applyAutoSync(multiSections, 'Science', 'Grade 7');

            // Both Grade 7 advisory sections should get Science
            expect(result[0].taught_subjects).toContain('Science');
            expect(result[1].taught_subjects).toContain('Science');

            // Grade 8 section should NOT be touched
            expect(result[2].taught_subjects).toEqual(['Science']);

            // Non-advisory Grade 7 section should NOT be touched
            expect(result[3].taught_subjects).toEqual(['Science']);
        });

        it('skips sections that already have the subject', () => {
            const result = applyAutoSync(multiSections, 'English', 'Grade 7');

            // English already exists — no duplicate
            expect(result[0].taught_subjects).toEqual(['English', 'Mathematics']);
            expect(result[1].taught_subjects).toEqual(['English', 'Mathematics']);
        });

        it('does not modify teaching_subjects', () => {
            const result = applyAutoSync(multiSections, 'Science', 'Grade 7');

            // teaching_subjects should remain untouched
            expect(result[0].teaching_subjects).toEqual(['English']);
            expect(result[1].teaching_subjects).toEqual([]);
        });

        it('handles case-insensitive dedup', () => {
            const result = applyAutoSync(multiSections, 'english', 'Grade 7');

            // Should not add duplicate even with different casing
            expect(result[0].taught_subjects).toEqual(['English', 'Mathematics']);
        });

        it('returns sections unchanged when no advisory sections match', () => {
            const result = applyAutoSync(multiSections, 'Chemistry', 'Grade 10');

            // No Grade 10 sections exist — all returned as-is
            expect(result).toBe(multiSections);
        });
    });

    // ─── AUTO-POPULATE ON SECTION CREATION (RECOMMENDATION #3) ───────

    describe('Auto-populate taught_subjects on Section Creation (Recommendation #3)', () => {
        interface SubjectItem {
            id: string;
            subject_name: string;
            grade_level: string;
            is_teaching_load?: boolean;
            section_id?: string;
        }

        // Mirrors the logic added to addSection in app-store.ts and SectionForm.tsx
        function resolveTaughtSubjectsOnCreate(
            section: Partial<Section>,
            allSubjects: SubjectItem[],
            standardTemplateSubjects: string[]
        ): string[] {
            if (!section.is_advisory) {
                return section.taught_subjects || [];
            }
            if (section.taught_subjects && section.taught_subjects.length > 1) {
                return section.taught_subjects;
            }
            const dbSubjects = allSubjects
                .filter(s => s.grade_level === section.section_grade_level && !s.is_teaching_load && (!s.section_id || s.section_id === section.id))
                .map(s => s.subject_name);

            return dbSubjects.length > 0 ? dbSubjects : standardTemplateSubjects;
        }

        const mockDbSubjects: SubjectItem[] = [
            { id: 'sub-1', subject_name: 'Science (Advanced)', grade_level: 'Grade 7' },
            { id: 'sub-2', subject_name: 'Mathematics', grade_level: 'Grade 7' },
            { id: 'sub-3', subject_name: 'English Plus', grade_level: 'Grade 7' },
            { id: 'sub-4', subject_name: 'My Teaching Science', grade_level: 'Grade 7', is_teaching_load: true }, // Teaching load, should be ignored
            { id: 'sub-5', subject_name: 'Biology', grade_level: 'Grade 8' },
        ];

        const standardG7 = ['English', 'Mathematics', 'Science', 'Filipino'];

        it('auto-populates taught_subjects from DB subjects when available', () => {
            const newSection: Partial<Section> = {
                section_name: 'Grade 7 - Sapphire',
                section_grade_level: 'Grade 7',
                is_advisory: true,
                taught_subjects: []
            };

            const result = resolveTaughtSubjectsOnCreate(newSection, mockDbSubjects, standardG7);

            expect(result).toEqual(['Science (Advanced)', 'Mathematics', 'English Plus']);
            expect(result).not.toContain('My Teaching Science'); // filtered out teaching load
        });

        it('falls back to standard curriculum templates when no DB subjects exist for the grade', () => {
            const newSection: Partial<Section> = {
                section_name: 'Grade 9 - Ruby',
                section_grade_level: 'Grade 9',
                is_advisory: true,
                taught_subjects: []
            };

            const standardG9 = ['English 9', 'Math 9', 'Science 9'];
            const result = resolveTaughtSubjectsOnCreate(newSection, mockDbSubjects, standardG9);

            expect(result).toEqual(['English 9', 'Math 9', 'Science 9']);
        });

        it('preserves custom taught_subjects if already explicitly defined (> 1 item)', () => {
            const customSection: Partial<Section> = {
                section_name: 'Grade 7 - Custom',
                section_grade_level: 'Grade 7',
                is_advisory: true,
                taught_subjects: ['Robotics', 'Journalism', 'Animation']
            };

            const result = resolveTaughtSubjectsOnCreate(customSection, mockDbSubjects, standardG7);

            expect(result).toEqual(['Robotics', 'Journalism', 'Animation']);
        });

        it('does not auto-populate taught_subjects for non-advisory sections', () => {
            const teachingOnlySection: Partial<Section> = {
                section_name: 'Grade 7 - Teaching Only',
                section_grade_level: 'Grade 7',
                is_advisory: false,
                is_teaching_load: true,
                taught_subjects: []
            };

            const result = resolveTaughtSubjectsOnCreate(teachingOnlySection, mockDbSubjects, standardG7);

            expect(result).toEqual([]);
        });
    });
});

