import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './database';

interface EncryptedEnvelope {
    id?: string;
    lrn?: string;
    iv: string;
    ciphertext: string;
    is_encrypted: boolean;
    student_lrn?: string;
    subject_id?: string;
    school_year?: string;
}

describe('Database Encryption/Decryption Utility', () => {
    let testKey: CryptoKey;

    beforeEach(async () => {
        // Generate a 256-bit AES-GCM key for testing
        testKey = await crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256,
            },
            true,
            ['encrypt', 'decrypt']
        );
        db.setDatabaseEncryptionKey(testKey);
    });

    it('should encrypt a plain record correctly', async () => {
        const plainRecord = {
            id: 'test-1',
            student_lrn: '123456789012',
            subject_id: 'sub-1',
            school_year: '2026-2027',
            grade_value: 95,
        };

        const encrypted = await db._encryptRecord('classRecords', plainRecord) as EncryptedEnvelope;
        expect(encrypted).toBeDefined();
        expect(encrypted.is_encrypted).toBe(true);
        expect(encrypted.iv).toBeDefined();
        expect(encrypted.ciphertext).toBeDefined();
        expect(encrypted.student_lrn).toBe('123456789012');
        expect(encrypted.id).toBe('test-1');

        // Decrypt and verify
        const decrypted = await db._decryptRecord('classRecords', encrypted);
        expect(decrypted).toEqual(plainRecord);
    });

    it('should decrypt an already-encrypted record and re-encrypt it with the current key', async () => {
        const plainRecord = {
            id: 'test-2',
            student_lrn: '123456789012',
            subject_id: 'sub-2',
            school_year: '2026-2027',
            grade_value: 88,
        };

        // Encrypt it once
        const firstEncrypted = await db._encryptRecord('classRecords', plainRecord) as EncryptedEnvelope;
        expect(firstEncrypted.is_encrypted).toBe(true);

        // Run encryptRecordIfNeeded on the already-encrypted record
        const secondEncrypted = await db._encryptRecord('classRecords', firstEncrypted) as EncryptedEnvelope;
        
        // It should NOT be double encrypted (the ciphertext should represent the plain record, not the envelope)
        expect(secondEncrypted.is_encrypted).toBe(true);
        expect(secondEncrypted.id).toBe('test-2');
        expect(secondEncrypted.student_lrn).toBe('123456789012');

        // Decrypt the second envelope
        const decrypted = await db._decryptRecord('classRecords', secondEncrypted);
        expect(decrypted).toEqual(plainRecord); // It decrypts directly to the original plain record!
    });

    it('rejects an encrypted record with the wrong key rather than silently writing it', async () => {
        const plainRecord = {
            id: 'test-3',
            student_lrn: '123456789012',
            subject_id: 'sub-3',
            school_year: '2026-2027',
            grade_value: 90,
        };

        // Encrypt with first key
        const firstEncrypted = await db._encryptRecord('classRecords', plainRecord);

        // Change the key to a different one
        const anotherKey = await crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256,
            },
            true,
            ['encrypt', 'decrypt']
        );
        db.setDatabaseEncryptionKey(anotherKey);

        await expect(db._encryptRecord('classRecords', firstEncrypted)).rejects.toThrow();
        expect(firstEncrypted).toHaveProperty('is_encrypted', true);
    });
});
