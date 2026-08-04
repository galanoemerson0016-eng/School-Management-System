export interface MinimalStudent {
    first_name: string;
    last_name: string;
    middle_name?: string;
    name_extension?: string;
}

/**
 * Formats a student's name to follow standard DepEd formats.
 * E.g.:
 * - Baluyut, Ruben III Gonda (where III is the extension, Gonda is middle name)
 * - Galano Jr., Emerson Mercado (where Jr. is the extension, Mercado is middle name)
 * If no extension, returns: LastName, FirstName MiddleName
 */
export function formatLearnerName(student: MinimalStudent, options?: { middleInitialOnly?: boolean }): string {
    const last = (student.last_name || '').trim();
    let first = (student.first_name || '').trim();
    const middle = (student.middle_name || '').trim();
    const ext = (student.name_extension || '').trim();

    // If first_name contains multiple words (e.g., "Mervin Emerson Galano Baman"), check and trim trailing middle names
    const firstWords = first.split(/\s+/);
    if (middle && firstWords.length > 1) {
        const cleanMiddle = middle.replace(/[^a-zA-Z]/g, '').toLowerCase();
        // Check if last word of first_name matches or overlaps middle_name
        const lastWordClean = firstWords[firstWords.length - 1].replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (cleanMiddle && (cleanMiddle === lastWordClean || cleanMiddle.startsWith(lastWordClean) || lastWordClean.startsWith(cleanMiddle))) {
            firstWords.pop();
            first = firstWords.join(' ');
        }
    }

    // Format middle name or convert to Middle Initial if requested
    let middleStr = middle;
    if (options?.middleInitialOnly && middleStr) {
        const cleanChar = middleStr.replace(/[^a-zA-Z]/g, '')[0];
        if (cleanChar) {
            middleStr = `${cleanChar.toUpperCase()}.`;
        }
    }

    // Prevent duplicating middle_name or name_extension if they are already inside first_name or last_name
    if (middleStr) {
        const cleanMid = middleStr.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (cleanMid && (first.toLowerCase().includes(cleanMid) || last.toLowerCase().includes(cleanMid))) {
            middleStr = '';
        }
    }

    let extStr = ext;
    if (extStr && (first.toLowerCase().includes(extStr.toLowerCase()) || last.toLowerCase().includes(extStr.toLowerCase()))) {
        extStr = '';
    }

    if (!extStr) {
        return `${last}, ${first}${middleStr ? ' ' + middleStr : ''}`.trim();
    }

    const isSuffixToLastName = ['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v'].includes(extStr.toLowerCase());
    if (isSuffixToLastName) {
        return `${last} ${extStr}, ${first}${middleStr ? ' ' + middleStr : ''}`.trim();
    } else {
        return `${last}, ${first} ${extStr}${middleStr ? ' ' + middleStr : ''}`.trim();
    }
}
