export const ACTIVE_TERMS = [1, 2, 3] as const;

export type ActiveTerm = (typeof ACTIVE_TERMS)[number];

export const HISTORICAL_QUARTERS = [1, 2, 3, 4] as const;

export type HistoricalQuarter = (typeof HISTORICAL_QUARTERS)[number];

/**
 * Check whether a school year operates on the 3-Term calendar (SY 2026-2027 onwards)
 * or the 4-Quarter calendar (SY 2025-2026 and earlier).
 */
export function isThreeTermSchoolYear(schoolYear?: string): boolean {
    if (!schoolYear) return true; // Default to current school year
    const match = schoolYear.match(/(\d{4})/);
    if (match) {
        const startYear = parseInt(match[1], 10);
        return startYear >= 2026;
    }
    return true;
}

/**
 * Returns the active period indices for a given school year
 * (1..3 for 3-Term, 1..4 for Historical Quarters).
 */
export function getActivePeriodsForSchoolYear(schoolYear?: string): readonly number[] {
    return isThreeTermSchoolYear(schoolYear) ? ACTIVE_TERMS : HISTORICAL_QUARTERS;
}

/**
 * Get period table header: 'TERM' for SY 2026-2027+, 'QUARTER' for historical.
 */
export function getPeriodHeader(schoolYear?: string): 'TERM' | 'QUARTER' {
    return isThreeTermSchoolYear(schoolYear) ? 'TERM' : 'QUARTER';
}

/**
 * Get period label, e.g. "Term 1" vs "Quarter 1" depending on school year.
 */
export function getPeriodLabel(period: number, schoolYear?: string): string {
    const isTerm = isThreeTermSchoolYear(schoolYear);
    if (isTerm) {
        switch (period) {
            case 1: return 'Term 1';
            case 2: return 'Term 2';
            case 3: return 'Term 3';
            default: return `Term ${period}`;
        }
    } else {
        switch (period) {
            case 1: return 'Quarter 1';
            case 2: return 'Quarter 2';
            case 3: return 'Quarter 3';
            case 4: return 'Quarter 4';
            default: return `Quarter ${period}`;
        }
    }
}

/**
 * Get uppercase period label, e.g. "FIRST TERM" vs "FIRST QUARTER".
 */
export function getPeriodUpperLabel(period: number, schoolYear?: string): string {
    const isTerm = isThreeTermSchoolYear(schoolYear);
    if (isTerm) {
        switch (period) {
            case 1: return 'FIRST TERM';
            case 2: return 'SECOND TERM';
            case 3: return 'THIRD TERM';
            default: return `TERM ${period}`;
        }
    } else {
        switch (period) {
            case 1: return 'FIRST QUARTER';
            case 2: return 'SECOND QUARTER';
            case 3: return 'THIRD QUARTER';
            case 4: return 'FOURTH QUARTER';
            default: return `QUARTER ${period}`;
        }
    }
}

// Backward-compatible alias
export const getTermLabel = (term: number) => getPeriodLabel(term, '2026-2027');
export const getTermUpperLabel = (term: number) => getPeriodUpperLabel(term, '2026-2027');