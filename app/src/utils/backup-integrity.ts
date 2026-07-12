/**
 * Backup Integrity Verification Utility
 * Uses Web Crypto API SHA-256 for checksum computation and verification.
 */

/**
 * Compute a SHA-256 checksum of a JavaScript object.
 * The object is serialised with sorted keys to guarantee deterministic output.
 */
export async function computeChecksum(data: unknown): Promise<string> {
    const json = JSON.stringify(data, Object.keys(data as Record<string, unknown>).sort());
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(json));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify that a previously stored checksum matches the data.
 */
export async function verifyChecksum(data: unknown, expectedHash: string): Promise<boolean> {
    const actualHash = await computeChecksum(data);
    return actualHash === expectedHash;
}

/**
 * Embed a _checksum field into a backup payload object.
 * Returns a new object with the field appended.
 */
export async function embedChecksum<T extends Record<string, unknown>>(backup: T): Promise<T & { _checksum: string }> {
    // Compute hash *without* the _checksum key itself
    const { _checksum: _, ...rest } = backup as T & { _checksum?: string };
    const hash = await computeChecksum(rest);
    return { ...backup, _checksum: hash };
}

/**
 * Validate the _checksum field embedded in a backup.
 * Returns { valid, hash } so the caller can display the result.
 */
export async function validateEmbeddedChecksum(backup: Record<string, unknown>): Promise<{ valid: boolean; expected: string; actual: string }> {
    const expected = (backup._checksum as string) || '';
    const { _checksum: _, ...rest } = backup;
    const actual = await computeChecksum(rest);
    return { valid: expected === actual, expected, actual };
}
