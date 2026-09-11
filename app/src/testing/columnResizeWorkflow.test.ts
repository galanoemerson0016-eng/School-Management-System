import { describe, it, expect } from 'vitest';

describe('Grade Management Column Resizing Workflow', () => {
    // Clamping limits defined in ConsolidatedGradesPage
    const clampWidth = (colKey: string, width: number): number => {
        if (colKey === 'name') {
            return Math.min(500, Math.max(150, Math.round(width)));
        }
        if (colKey === 'average' || colKey === 'generalAverage' || colKey === 'descriptor') {
            return Math.min(200, Math.max(50, Math.round(width)));
        }
        return Math.min(350, Math.max(45, Math.round(width)));
    };

    it('clamps learner name column width within 150px to 500px range', () => {
        expect(clampWidth('name', 80)).toBe(150);
        expect(clampWidth('name', 260)).toBe(260);
        expect(clampWidth('name', 650)).toBe(500);
    });

    it('clamps subject column widths within 45px to 350px range', () => {
        const subjectColKey = 'sub-math-123';
        expect(clampWidth(subjectColKey, 20)).toBe(45);
        expect(clampWidth(subjectColKey, 110)).toBe(110);
        expect(clampWidth(subjectColKey, 450)).toBe(350);
    });

    it('clamps summary column widths (average, generalAverage, descriptor) within 50px to 200px range', () => {
        expect(clampWidth('average', 30)).toBe(50);
        expect(clampWidth('average', 85)).toBe(85);
        expect(clampWidth('average', 300)).toBe(200);

        expect(clampWidth('generalAverage', 25)).toBe(50);
        expect(clampWidth('generalAverage', 95)).toBe(95);
        expect(clampWidth('generalAverage', 250)).toBe(200);

        expect(clampWidth('descriptor', 10)).toBe(50);
        expect(clampWidth('descriptor', 120)).toBe(120);
        expect(clampWidth('descriptor', 400)).toBe(200);
    });

    it('accurately updates width map on drag resize interaction', () => {
        let widthsMap: Record<string, number> = {};

        const onResize = (colKey: string, startWidth: number, deltaX: number) => {
            const nextWidth = clampWidth(colKey, startWidth + deltaX);
            widthsMap = { ...widthsMap, [colKey]: nextWidth };
        };

        // Resize learner name by +50px from 220px
        onResize('name', 220, 50);
        expect(widthsMap['name']).toBe(270);

        // Resize a subject column by -20px from 80px
        onResize('sub-eng-1', 80, -20);
        expect(widthsMap['sub-eng-1']).toBe(60);

        // Resize beyond upper bound
        onResize('sub-eng-1', 60, 400);
        expect(widthsMap['sub-eng-1']).toBe(350);
    });

    it('resets column widths back to empty custom map', () => {
        let widthsMap: Record<string, number> = {
            name: 320,
            'sub-science': 120,
            average: 90
        };

        const resetWidths = () => {
            widthsMap = {};
        };

        expect(Object.keys(widthsMap).length).toBe(3);
        resetWidths();
        expect(Object.keys(widthsMap).length).toBe(0);
        expect(widthsMap['name']).toBeUndefined();
    });

    it('computes auto-fit width for learner names based on longest student name', () => {
        const studentNames = [
            'DELA CRUZ, JUAN M.',
            'VILLANUEVA-SANTOS, MARIA CONCEPCION ESPERANZA R.',
            'ALVAREZ, MARK'
        ];

        const longestNameLength = Math.max(...studentNames.map(n => n.length));
        expect(longestNameLength).toBe(48);

        // 7.5px per character + 36px padding
        const autoFitNameWidth = clampWidth('name', longestNameLength * 7.5 + 36);
        expect(autoFitNameWidth).toBe(396);
        expect(autoFitNameWidth).toBeGreaterThan(240);
        expect(autoFitNameWidth).toBeLessThanOrEqual(500);
    });
});
