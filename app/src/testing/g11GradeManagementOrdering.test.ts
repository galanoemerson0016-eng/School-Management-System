import { describe, it, expect } from 'vitest';
import { sortSubjects, getSubjectCategory } from '../lib/subjectConfig';

describe('Grade 11 Summary of Grades Ordering and Category Grouping', () => {
    // The exact 8 subjects from the user's screenshot:
    const userScrambledSubjects = [
        'Chemistry 1',
        'General Mathematics',
        'Finite Mathematics 1',
        'General Science',
        'Life and Career Skills',
        'Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)',
        'Effective Communication & Mabisang Komunikasyon',
        'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
    ];

    it('correctly sorts Grade 11 subjects into DepEd Order No. 017 Core first, followed by Academic Electives', () => {
        const sorted = sortSubjects(userScrambledSubjects, s => s);

        // Core subjects must occupy the first 5 slots in official DO 017 order
        expect(sorted[0]).toBe('Effective Communication & Mabisang Komunikasyon');
        expect(sorted[1]).toBe('General Mathematics');
        expect(sorted[2]).toBe('General Science');
        expect(sorted[3]).toBe('Life and Career Skills');
        expect(sorted[4]).toBe('Pag-aaral ng Kasaysayan at Lipunang Pilipino');

        // Electives must follow after Core subjects
        expect(sorted.slice(5)).toEqual([
            'Chemistry 1',
            'Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)',
            'Finite Mathematics 1'
        ]);
    });

    it('identifies categories correctly for table header grouping', () => {
        const coreNames = [
            'Effective Communication & Mabisang Komunikasyon',
            'General Mathematics',
            'General Science',
            'Life and Career Skills',
            'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
        ];

        coreNames.forEach(name => {
            const cat = getSubjectCategory(name, 'Grade 11');
            expect(cat).toBe('Core Subject (All Tracks)');
        });

        const electiveNames = [
            'Chemistry 1',
            'Finite Mathematics 1',
            'Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)'
        ];

        electiveNames.forEach(name => {
            const cat = getSubjectCategory(name, 'Grade 11');
            expect(cat).toBe('Academic Elective (All Other Electives)');
        });
    });

    it('merges contiguous same-category columns into unified category groups', () => {
        const sorted = sortSubjects(userScrambledSubjects, s => s);
        
        // Simulate termColSpan for each subject (ECMK = 3, others = 1)
        const termColSpan = (name: string) => {
            if (name.includes('Effective Communication')) return 3;
            return 1;
        };

        const groups: { category: string; colSpan: number }[] = [];
        sorted.forEach(subName => {
            const cat = getSubjectCategory(subName, 'Grade 11');
            const span = termColSpan(subName);
            const last = groups[groups.length - 1];
            if (last && last.category === cat) {
                last.colSpan += span;
            } else {
                groups.push({ category: cat, colSpan: span });
            }
        });

        // There should be EXACTLY 2 clean category headers: Core and Academic Elective!
        expect(groups).toHaveLength(2);
        expect(groups[0]).toEqual({
            category: 'Core Subject (All Tracks)',
            colSpan: 7 // 3 (ECMK) + 1 (Math) + 1 (Science) + 1 (Life & Career) + 1 (Kasaysayan)
        });
        expect(groups[1]).toEqual({
            category: 'Academic Elective (All Other Electives)',
            colSpan: 3 // Chemistry 1 + Filipino 1 + Finite Math 1
        });
    });
});
