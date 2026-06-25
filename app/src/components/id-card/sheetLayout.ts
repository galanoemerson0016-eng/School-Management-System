/** Print-sheet geometry for multi-up CR80 ID tiling. */
export type SheetPaper = 'a4' | 'letter' | 'folio';

export const PAPER_MM: Record<SheetPaper, { w: number; h: number }> = {
    a4: { w: 297, h: 210 },
    letter: { w: 279.4, h: 215.9 },
    folio: { w: 330.2, h: 215.9 }, // 13in x 8.5in (landscape)
};

/** Max cards that fit one sheet for the given paper. */
export function sheetCapacity(paper: SheetPaper): number {
    if (paper === 'folio') return 5;
    return paper === 'a4' ? 5 : 4;
}
