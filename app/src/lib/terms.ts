export const ACTIVE_TERMS = [1, 2, 3] as const;

export const LEGACY_TERMS = [1, 2, 3, 4] as const;

export type ActiveTerm = (typeof ACTIVE_TERMS)[number];

export const getTermLabel = (term: number) => {
    switch (term) {
        case 1:
            return 'Term 1';
        case 2:
            return 'Term 2';
        case 3:
            return 'Term 3';
        case 4:
            return 'Legacy Quarter 4';
        default:
            return 'Term 1';
    }
};

export const getTermUpperLabel = (term: number) => {
    switch (term) {
        case 1:
            return 'FIRST TERM';
        case 2:
            return 'SECOND TERM';
        case 3:
            return 'THIRD TERM';
        case 4:
            return 'LEGACY QUARTER 4';
        default:
            return 'FIRST TERM';
    }
};