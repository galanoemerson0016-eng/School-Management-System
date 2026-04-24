/**
 * Encryption Utility for Backup Files
 * Uses Web Crypto API (native, no dependencies needed)
 * AES-256-GCM encryption for backups
 */

/**
 * Encrypts a JSON backup with a password
 * Returns encrypted data as base64 string
 */

function bytesToBase64(bytes: Uint8Array): string {
    // Avoid call stack overflow for large arrays by processing in chunks.
    const chunkSize = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
}

export async function encryptBackup(
    backupJson: string,
    password: string
): Promise<{ encrypted: string; iv: string; salt: string }> {
    // Generate salt (16 random bytes)
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Derive key from password using PBKDF2
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );

    // Generate IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the backup
    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        encoder.encode(backupJson)
    );

    // Convert to base64 for storage (safe for large payloads)
    const encryptedBase64 = bytesToBase64(new Uint8Array(encryptedData));
    const ivBase64 = bytesToBase64(iv);
    const saltBase64 = bytesToBase64(salt);

    return {
        encrypted: encryptedBase64,
        iv: ivBase64,
        salt: saltBase64,
    };
}

/**
 * Decrypts an encrypted backup with a password
 * Returns decrypted JSON string
 */
export async function decryptBackup(
    encryptedData: string,
    password: string,
    salt: string,
    iv: string
): Promise<string> {
    try {
        // Decode from base64
        const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
        const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

        // Derive key from password
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordData,
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations: 100000,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // Decrypt
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivBytes },
            derivedKey,
            encryptedBytes
        );

        // Convert back to string
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    } catch {
        throw new Error('Decryption failed - invalid password or corrupted file');
    }
}

/**
 * Creates an encrypted backup file object
 */
export interface EncryptedBackupFile {
    version: '2.0.0-encrypted';
    encryptedAt: string;
    metadata: {
        originalSize: number;
        encryptedSize: number;
        algorithm: 'AES-256-GCM';
        iterations: number;
    };
    data: {
        encrypted: string;
        iv: string;
        salt: string;
    };
}

/**
 * Wraps encrypted data with metadata
 */
export function createEncryptedBackupFile(
    encrypted: string,
    iv: string,
    salt: string,
    originalSize: number
): EncryptedBackupFile {
    return {
        version: '2.0.0-encrypted',
        encryptedAt: new Date().toISOString(),
        metadata: {
            originalSize,
            encryptedSize: encrypted.length,
            algorithm: 'AES-256-GCM',
            iterations: 100000,
        },
        data: {
            encrypted,
            iv,
            salt,
        },
    };
}

/**
 * Utility to hash a password for display (NOT for security)
 * Only used to show password strength, not for actual encryption
 */
export function getPasswordStrength(password: string): {
    score: number;
    label: 'Weak' | 'Fair' | 'Good' | 'Strong';
    color: string;
} {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const labels = ['Weak', 'Fair', 'Good', 'Strong'] as const;
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

    return {
        score: Math.min(score, 3),
        label: labels[Math.min(score, 3)],
        color: colors[Math.min(score, 3)],
    };
}
