/** Extract an LRN from a scanned code: either the raw barcode value (plain LRN)
 * or the `LRN: …` line of the student ID QR payload. */
export function extractLrnFromScan(raw: string): string {
    const match = raw.match(/LRN:\s*([\w-]+)/i);
    return (match ? match[1] : raw).trim();
}
