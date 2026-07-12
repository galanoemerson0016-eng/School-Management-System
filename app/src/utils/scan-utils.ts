/** Extract an LRN from a scanned code: either the raw barcode value (plain LRN)
 * or the `LRN: …` line of the student ID QR payload.
 * Returns an empty string if the extracted value is not a valid LRN. */
export function extractLrnFromScan(raw: string): string {
    const match = raw.match(/LRN:\s*([\w-]+)/i);
    const candidate = (match ? match[1] : raw).trim();
    if (/^\d{12}$/.test(candidate) || candidate.startsWith('TEMP-')) {
        return candidate;
    }
    return '';
}
