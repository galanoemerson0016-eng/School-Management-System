import { describe, expect, it } from 'vitest';
import { deriveDbKey, generateDataEncryptionKey, unwrapDataEncryptionKey, wrapDataEncryptionKey } from './db-crypto';

describe('wrapped database encryption keys', () => {
  const salt = new Uint8Array(32).fill(7);

  it('unwraps the same random DEK with its password-derived KEK', async () => {
    const kek = await deriveDbKey('CorrectPassword123!', salt);
    const dek = await generateDataEncryptionKey();
    const wrapped = await wrapDataEncryptionKey(dek, kek);

    const unwrapped = await unwrapDataEncryptionKey(wrapped, kek);
    const sample = new TextEncoder().encode('synthetic FormEase record');
    const iv = new Uint8Array(12).fill(3);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, dek, sample);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, unwrapped, encrypted);

    expect(new TextDecoder().decode(decrypted)).toBe('synthetic FormEase record');
  });

  it('rejects a wrong KEK or corrupt wrapped-key metadata', async () => {
    const kek = await deriveDbKey('CorrectPassword123!', salt);
    const wrongKek = await deriveDbKey('WrongPassword123!', salt);
    const wrapped = await wrapDataEncryptionKey(await generateDataEncryptionKey(), kek);

    await expect(unwrapDataEncryptionKey(wrapped, wrongKek)).rejects.toThrow();
    await expect(unwrapDataEncryptionKey({ ...wrapped, ciphertext: 'not-valid-base64' }, kek)).rejects.toThrow();
  });
});
