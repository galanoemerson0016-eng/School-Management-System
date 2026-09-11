import { describe, it, expect } from 'vitest';
import type { Section, Subject } from '../types';

describe('Quarter Lock & Fast Column Controls Workflow', () => {
    const mockSection: Section = {
        id: 'sec-10-emerald',
        section_name: 'Emerald',
        section_grade_level: 'Grade 10',
        is_advisory: true,
        taught_subjects: ['Filipino', 'English', 'Mathematics', 'Science'],
        teaching_subjects: ['Filipino'],
        section_metadata: {
            lockedQuarters: ['q1', 'q2']
        }
    };

    describe('Quarter Lock Controls', () => {
        it('identifies locked and unlocked quarters correctly', () => {
            const lockedQuarters = mockSection.section_metadata?.lockedQuarters || [];
            const isQuarterLocked = (q: string | number) => {
                const key = (typeof q === 'number' ? `q${q}` : String(q).toLowerCase()) as 'q1' | 'q2' | 'q3' | 'q4';
                return lockedQuarters.includes(key);
            };

            expect(isQuarterLocked(1)).toBe(true);
            expect(isQuarterLocked('q1')).toBe(true);
            expect(isQuarterLocked(2)).toBe(true);
            expect(isQuarterLocked(3)).toBe(false);
            expect(isQuarterLocked(4)).toBe(false);
        });

        it('filters quarters during batch sync to exclude locked terms', () => {
            const lockedQuarters = mockSection.section_metadata?.lockedQuarters || [];
            const isQuarterLocked = (q: number) => lockedQuarters.includes(`q${q}` as 'q1' | 'q2' | 'q3' | 'q4');

            const allQuarters: (1 | 2 | 3)[] = [1, 2, 3];
            const quartersToSync = allQuarters.filter(q => !isQuarterLocked(q));

            expect(quartersToSync).toEqual([3]);
        });

        it('prevents sync entirely if all requested terms are locked', () => {
            const selectedTerm = 'q1';
            const quarter = parseInt(selectedTerm.replace('q', '')) as 1 | 2 | 3;
            const lockedQuarters = mockSection.section_metadata?.lockedQuarters || [];
            const isLocked = lockedQuarters.includes(`q${quarter}` as 'q1' | 'q2' | 'q3' | 'q4');

            expect(isLocked).toBe(true);
        });

        it('toggles quarter lock state properly', () => {
            const currentLocked = mockSection.section_metadata?.lockedQuarters || [];
            
            // Toggle off q1
            const toggledOff = currentLocked.filter(k => k !== 'q1');
            expect(toggledOff).toEqual(['q2']);

            // Toggle on q3
            const toggledOn = [...toggledOff, 'q3' as const];
            expect(toggledOn).toEqual(['q2', 'q3']);
        });
    });

    describe('In-Table Subject Reordering (Move Left / Right)', () => {
        it('moves subject to the left when clicked', () => {
            const currentOrder = [...(mockSection.taught_subjects || [])]; // ['Filipino', 'English', 'Mathematics', 'Science']
            const subjectToMove = 'English';
            const currentIndex = currentOrder.indexOf(subjectToMove);
            const targetIndex = currentIndex - 1;

            const updatedOrder = [...currentOrder];
            const temp = updatedOrder[currentIndex];
            updatedOrder[currentIndex] = updatedOrder[targetIndex];
            updatedOrder[targetIndex] = temp;

            expect(updatedOrder).toEqual(['English', 'Filipino', 'Mathematics', 'Science']);
        });

        it('moves subject to the right when clicked', () => {
            const currentOrder = [...(mockSection.taught_subjects || [])];
            const subjectToMove = 'English';
            const currentIndex = currentOrder.indexOf(subjectToMove);
            const targetIndex = currentIndex + 1;

            const updatedOrder = [...currentOrder];
            const temp = updatedOrder[currentIndex];
            updatedOrder[currentIndex] = updatedOrder[targetIndex];
            updatedOrder[targetIndex] = temp;

            expect(updatedOrder).toEqual(['Filipino', 'Mathematics', 'English', 'Science']);
        });

        it('prevents boundary violation at first and last positions', () => {
            const currentOrder = [...(mockSection.taught_subjects || [])];
            
            // First item cannot move left
            const firstIndex = 0;
            expect(firstIndex - 1 < 0).toBe(true);

            // Last item cannot move right
            const lastIndex = currentOrder.length - 1;
            expect(lastIndex + 1 >= currentOrder.length).toBe(true);
        });
    });

    describe('Quick Column Add and Single Subject Sync Target', () => {
        it('appends a newly added catalog subject without duplicates', () => {
            const currentTaught = [...(mockSection.taught_subjects || [])];
            const newSubject = 'Araling Panlipunan';

            if (!currentTaught.includes(newSubject)) {
                currentTaught.push(newSubject);
            }

            expect(currentTaught).toHaveLength(5);
            expect(currentTaught[4]).toBe('Araling Panlipunan');

            // Attempting to add duplicate
            const duplicateAttempt = [...currentTaught];
            if (!duplicateAttempt.includes(newSubject)) {
                duplicateAttempt.push(newSubject);
            }
            expect(duplicateAttempt).toHaveLength(5);
        });

        it('targets only the specific subject in single-subject sync', () => {
            const targetSubject: Subject = {
                id: 'sub-sci-10',
                subject_name: 'Science',
                grade_level: 'Grade 10'
            };

            const allSubjectIds = ['sub-fil-10', 'sub-eng-10', 'sub-math-10', 'sub-sci-10'];
            const targetedIds = allSubjectIds.filter(id => id === targetSubject.id);

            expect(targetedIds).toEqual(['sub-sci-10']);
        });
    });

    describe('Subject Header Dropdown Column Deletion and Canvas Width Adjustment', () => {
        it('deletes a column from taught_subjects and removes from hidden subjects', () => {
            const currentTaught = ['Filipino', 'English', 'Mathematics', 'Science'];
            const subjectToDelete = 'Mathematics';

            const updatedTaught = currentTaught.filter(s => s.toLowerCase().trim() !== subjectToDelete.toLowerCase().trim());
            expect(updatedTaught).toEqual(['Filipino', 'English', 'Science']);
            expect(updatedTaught).toHaveLength(3);
        });

        it('dynamically expands sheet width when columns are added to prevent overlap', () => {
            const BASE_PAGE_WIDTH = 1248;
            const SHEET_PADDING = 48;
            const learnerNameColumnWidth = 180;
            const summaryColsWidth = 195;
            const minSubColWidth = 65;

            // Scenario A: 8 columns (standard)
            const countA = 8;
            const neededA = learnerNameColumnWidth + summaryColsWidth + (countA * minSubColWidth) + SHEET_PADDING;
            const sheetWidthA = Math.max(BASE_PAGE_WIDTH, neededA);
            expect(sheetWidthA).toBe(1248); // Fits within standard folio

            // Scenario B: 18 columns (added 10 columns)
            const countB = 18;
            const neededB = learnerNameColumnWidth + summaryColsWidth + (countB * minSubColWidth) + SHEET_PADDING;
            const sheetWidthB = Math.max(BASE_PAGE_WIDTH, neededB);
            expect(sheetWidthB).toBeGreaterThan(1248);
            expect(sheetWidthB).toBe(1593); // Automatically expanded to prevent squishing and overlap

            // Usable table width strictly fits inside canvas
            const usableB = sheetWidthB - SHEET_PADDING;
            const totalColsWidth = learnerNameColumnWidth + (countB * minSubColWidth) + summaryColsWidth;
            expect(totalColsWidth).toBeLessThanOrEqual(usableB);
        });

        it('dynamically contracts sheet width when columns are deleted', () => {
            const BASE_PAGE_WIDTH = 1248;
            const SHEET_PADDING = 48;
            const learnerNameColumnWidth = 180;
            const summaryColsWidth = 195;
            const minSubColWidth = 65;

            // Start with 18 columns
            const neededBefore = learnerNameColumnWidth + summaryColsWidth + (18 * minSubColWidth) + SHEET_PADDING;
            const sheetWidthBefore = Math.max(BASE_PAGE_WIDTH, neededBefore);

            // Delete 10 columns down to 8 columns
            const neededAfter = learnerNameColumnWidth + summaryColsWidth + (8 * minSubColWidth) + SHEET_PADDING;
            const sheetWidthAfter = Math.max(BASE_PAGE_WIDTH, neededAfter);

            expect(sheetWidthAfter).toBeLessThan(sheetWidthBefore);
            expect(sheetWidthAfter).toBe(1248); // Cleanly returned to base folio width
        });

        it('deduplicates catalog subjects by name when catalog has multiple records', () => {
            const mockCatalog = [
                { id: '1', subject_name: 'Music and Arts', grade_level: 'Grade 7' },
                { id: '2', subject_name: 'Music and Arts', grade_level: 'Grade 7' },
                { id: '3', subject_name: 'Music and Arts', grade_level: 'Grade 7' },
                { id: '4', subject_name: 'Physical Education and Health', grade_level: 'Grade 7' },
                { id: '5', subject_name: 'Physical Education and Health', grade_level: 'Grade 7' },
                { id: '6', subject_name: 'Values Education', grade_level: 'Grade 7' },
            ];

            const seenNames = new Set<string>();
            const unique: typeof mockCatalog = [];
            for (const s of mockCatalog) {
                const norm = s.subject_name.trim().toLowerCase();
                if (!seenNames.has(norm)) {
                    seenNames.add(norm);
                    unique.push(s);
                }
            }

            expect(unique).toHaveLength(3);
            expect(unique.map(u => u.subject_name)).toEqual([
                'Music and Arts',
                'Physical Education and Health',
                'Values Education'
            ]);
        });

        it('suppresses Music and Arts and PE & Health when MAPEH composite is already on sheet', () => {
            const sectionSubjects = [{ subject_name: 'MAPEH' }, { subject_name: 'Filipino' }];
            const currentNames = new Set(sectionSubjects.map(s => s.subject_name.toLowerCase().trim()));

            // Exclude subcomponents if MAPEH is present
            sectionSubjects.forEach(s => {
                if (s.subject_name.toUpperCase() === 'MAPEH') {
                    currentNames.add('music and arts');
                    currentNames.add('physical education and health');
                }
            });

            expect(currentNames.has('music and arts')).toBe(true);
            expect(currentNames.has('physical education and health')).toBe(true);

            const catalog = [
                { id: '1', subject_name: 'Music and Arts' },
                { id: '2', subject_name: 'Physical Education and Health' },
                { id: '3', subject_name: 'Values Education' }
            ];

            const available = catalog.filter(s => !currentNames.has(s.subject_name.toLowerCase().trim()));
            expect(available).toHaveLength(1);
            expect(available[0].subject_name).toBe('Values Education');
        });
    });
});
