/**
 * Password hashing via WebCrypto PBKDF2.
 *
 * Stored format: "pbkdf2-v1:<iterations>:<saltBase64>:<hashBase64>"
 * The format string is versioned so iteration counts / algorithms can be
 * raised later while still verifying old hashes.
 */

const FORMAT_VERSION = 'pbkdf2-v1';
const ITERATIONS = 310_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveBits(secret: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    KEY_BITS
  );
  return new Uint8Array(bits);
}

/** Hash a secret with a fresh random salt. */
export async function hashSecret(secret: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await deriveBits(secret, salt, ITERATIONS);
  return `${FORMAT_VERSION}:${ITERATIONS}:${toBase64(salt)}:${toBase64(hash)}`;
}

/** Verify a secret against a stored hash string. Never throws; returns false on malformed input. */
export async function verifySecret(secret: string, stored: string): Promise<boolean> {
  try {
    const [version, iterationsRaw, saltB64, hashB64] = stored.split(':');
    if (version !== FORMAT_VERSION) return false;
    const iterations = Number(iterationsRaw);
    if (!Number.isFinite(iterations) || iterations < 1) return false;

    const expected = fromBase64(hashB64);
    const actual = await deriveBits(secret, fromBase64(saltB64), iterations);
    if (expected.length !== actual.length) return false;

    // Constant-time comparison
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected[i] ^ actual[i];
    }
    return diff === 0;
  } catch {
    return false;
  }
}
