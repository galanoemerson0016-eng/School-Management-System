/**
 * Database Encryption Utilities
 * Uses Web Crypto API (native, no dependencies)
 * Derives a key using PBKDF2 and encrypts payloads with AES-256-GCM.
 */

const KEY_BITS = 256;
const ITERATIONS = 100000;
// localStorage fallback key — only used when safeStorage IPC is unavailable (dev browser, Linux without libsecret, etc.)
const SALT_FALLBACK_KEY = 'formease-db-salt-v1';

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
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

// Returns hex string from a Uint8Array
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

// Prefer safeStorage IPC (OS keychain) with localStorage as fallback for dev/non-Electron environments.
export async function getDbSalt(): Promise<Uint8Array> {
  const api = (window as Window & { electronAPI?: { readDbSalt?: () => Promise<string | null>; storeDbSalt?: (h: string) => Promise<boolean> } }).electronAPI;

  // 1. Check localStorage first (silent, no OS keychain prompts)
  try {
    const stored = localStorage.getItem(SALT_FALLBACK_KEY);
    if (stored) return fromBase64(stored);
  } catch (e) {
    console.warn('Failed to read db salt from localStorage', e);
  }

  // 2. If not in localStorage, check safeStorage (migration path for existing users)
  if (api?.readDbSalt) {
    try {
      const hex = await api.readDbSalt();
      if (hex && hex !== 'DECRYPTION_FAILED') {
        const salt = fromHex(hex);
        // Persist to localStorage so we never prompt for Keychain again
        try {
          localStorage.setItem(SALT_FALLBACK_KEY, toBase64(salt));
        } catch (err) {
          console.warn('Failed to save migrated salt to localStorage', err);
        }
        return salt;
      }
    } catch (e) {
      console.warn('safeStorage salt IPC failed, falling back to localStorage', e);
    }
  }

  // 3. First run / fallback: generate new salt and persist to both
  const salt = crypto.getRandomValues(new Uint8Array(32));
  try {
    localStorage.setItem(SALT_FALLBACK_KEY, toBase64(salt));
  } catch (e) {
    console.warn('Failed to save new db salt to localStorage', e);
  }

  if (api?.storeDbSalt) {
    try {
      await api.storeDbSalt(toHex(salt));
    } catch (e) {
      console.warn('Failed to save new db salt to safeStorage', e);
    }
  }

  return salt;
}

export async function deriveDbKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const secretData = encoder.encode(secret);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    secretData,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_BITS },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPayload(payload: unknown, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const json = JSON.stringify(payload);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    encoder.encode(json) as unknown as BufferSource
  );
  
  return {
    ciphertext: toBase64(new Uint8Array(encrypted)),
    iv: toBase64(iv)
  };
}

export async function decryptPayload<T>(ciphertext: string, iv: string, key: CryptoKey): Promise<T> {
  const encryptedBytes = fromBase64(ciphertext);
  const ivBytes = fromBase64(iv);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes as unknown as BufferSource },
    key,
    encryptedBytes as unknown as BufferSource
  );
  
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decrypted)) as T;
}


