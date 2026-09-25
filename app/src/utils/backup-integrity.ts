/**
 * Backup Integrity Verification Utility
 * Uses Web Crypto API SHA-256 for checksum computation and verification.
 */

/**
 * Compute a SHA-256 checksum of a JavaScript object.
 * The object is serialised with sorted keys to guarantee deterministic output.
 */
export async function computeChecksum(data: unknown): Promise<string> {
    // A replacer *array* also filters properties of nested objects. Sort each
    // object recursively while retaining all fields and the order of arrays.
    const json = JSON.stringify(data, (_key, value: unknown) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const object = value as Record<string, unknown>;
            return Object.fromEntries(Object.keys(object).sort().map(key => [key, object[key]]));
        }
        return value;
    });
    if (json === undefined) throw new Error('Backup checksum data is not serializable.');
    return hashJson(json);
}

async function hashJson(json: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(json));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function computeLegacyChecksum(data: Record<string, unknown>): Promise<string> {
    const json = JSON.stringify(data, Object.keys(data).sort());
    return hashJson(json);
}

/** The older comprehensive backup also includes a full-payload hash. */
export async function hasValidPayloadHash(backup: Record<string, unknown>): Promise<boolean> {
    const metadata = backup.metadata as Record<string, unknown> | undefined;
    const expected = metadata?.payloadHash;
    if (typeof expected !== 'string' || !/^[a-f0-9]{64}$/.test(expected)) return false;
    if (!backup.payload || typeof backup.payload !== 'object' || Array.isArray(backup.payload)) return false;
    return await hashJson(JSON.stringify(backup.payload)) === expected;
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
export async function embedChecksum<T extends Record<string, unknown>>(backup: T): Promise<T & { _checksum: string; _checksumVersion: 2 }> {
    // Compute hash *without* the _checksum key itself
    const { _checksum: _, _checksumVersion: _oldVersion, ...rest } = backup as T & { _checksum?: string; _checksumVersion?: number };
    const versioned = { ...rest, _checksumVersion: 2 as const };
    const hash = await computeChecksum(versioned);
    return { ...versioned, _checksum: hash } as T & { _checksum: string; _checksumVersion: 2 };
}

/**
 * Validate the _checksum field embedded in a backup.
 * Returns { valid, hash } so the caller can display the result.
 */
export async function validateEmbeddedChecksum(backup: Record<string, unknown>): Promise<{ valid: boolean; expected: string; actual: string; strength: 'strong' | 'legacy' | 'invalid' }> {
    const expected = (backup._checksum as string) || '';
    const { _checksum: _, ...rest } = backup;
    const version = backup._checksumVersion;
    const actual = version === 2
        ? await computeChecksum(rest)
        : version === undefined
            ? await computeLegacyChecksum(rest)
            : '';
    const valid = /^[a-f0-9]{64}$/.test(expected) && expected === actual;
    return { valid, expected, actual, strength: valid ? (version === 2 ? 'strong' : 'legacy') : 'invalid' };
}
