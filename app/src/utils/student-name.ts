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
export function formatLearnerName(student: MinimalStudent): string {
    const last = (student.last_name || '').trim();
    const first = (student.first_name || '').trim();
    const middle = student.middle_name ? student.middle_name.trim() : '';
    const ext = student.name_extension ? student.name_extension.trim() : '';

    if (!ext) {
        return `${last}, ${first}${middle ? ' ' + middle : ''}`;
    }

    // Check if the extension is Jr, Sr, II, III, etc.
    const isSuffixToLastName = ['jr', 'jr.', 'sr', 'sr.'].includes(ext.toLowerCase());
    if (isSuffixToLastName) {
        return `${last} ${ext}, ${first}${middle ? ' ' + middle : ''}`;
    } else {
        return `${last}, ${first} ${ext}${middle ? ' ' + middle : ''}`;
    }
}
