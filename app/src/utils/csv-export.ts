// CSV Export Utility
export function csvCell(value: unknown): string {
    let text = String(value ?? '');
    // Quoting alone does not stop Excel from evaluating imported formulas.
    // Preserve numeric cells, including negative numeric measurements.
    let prefix = text.trimStart();
    while (prefix.length && prefix.charCodeAt(0) < 32) prefix = prefix.slice(1).trimStart();
    if (typeof value === 'string' && /^[=+@-]/.test(prefix)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];

    // Header row
    csvRows.push(headers.map(csvCell).join(','));

    // Data rows
    for (const row of data) {
        const values = headers.map(h => csvCell(row[h]));
        csvRows.push(values.join(','));
    }

    const csvString = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();

    URL.revokeObjectURL(url);
}
