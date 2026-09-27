import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { db } from './database';
import {
    validateBackupPayloadStructure,
    validateBackup,
    createComprehensiveBackup,
    collectBackupLocalStorage,
    restoreBackupLocalStorage,
    savePreRestoreSafetySnapshot,
    type ComprehensiveBackup,
} from '../utils/backup-restore';
import { getLiveDatabaseRecordCounts } from './database-rescue-export';
import { savePaceRecord, getPaceRecord, getPaceStorageKeyV2 } from './pace-record-service';

describe('Phase 5 (Work Package F) - Trustworthy Backup & Recovery Health', () => {
    beforeEach(async () => {
        await db.resetConnection();
        localStorage.clear();
        db.releaseInstallWriteBarrier();
        db.setDatabaseEncryptionKey(null);
        db.clearQuarantinedRecords();
        globalThis.indexedDB = new IDBFactory();
        globalThis.IDBKeyRange = IDBKeyRange;
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await db.resetConnection();
        db.clearQuarantinedRecords();
    });

    describe('Finding H01: Unreadable records quarantine & health visibility', () => {
        it('quarantines undecryptable records during tolerant reads without discarding evidence', async () => {
            // Set an initial database encryption key and insert an encrypted record
            localStorage.setItem('formease_db_indexing_migrated_v11', 'true');
            const key1 = await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
            db.setDatabaseEncryptionKey(key1, [], false);

            await db.putRecord('gradingSheetRecords', {
                id: 'gs-q1-valid',
                student_lrn: '123456789001',
                subject_id: 'sub-math',
                quarter: 1,
                final_grade: 90,
            });

            // Switch to a new, different encryption key (simulating key mismatch / undecryptable record)
            const key2 = await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
            db.setDatabaseEncryptionKey(key2, [], false);

            // Add another record that can be decrypted with key2
            await db.putRecord('gradingSheetRecords', {
                id: 'gs-q2-valid',
                student_lrn: '123456789001',
                subject_id: 'sub-math',
                quarter: 2,
                final_grade: 92,
            });

            // Read gradingSheetRecords tolerantly (non-strict)
            const readableRecords = await db.getAllRecords<{ id: string }>('gradingSheetRecords');
            expect(readableRecords).toHaveLength(1);
            expect(readableRecords[0].id).toBe('gs-q2-valid');

            // Verify that the undecryptable record was quarantined rather than silently lost
            const quarantined = db.getQuarantinedRecords();
            expect(quarantined).toHaveLength(1);
            expect(quarantined[0].storeName).toBe('gradingSheetRecords');
            expect(quarantined[0].rawEnvelope).toBeDefined();

            // Verify quarantine stats
            const stats = db.getQuarantineStats();
            expect(stats.total).toBe(1);
            expect(stats.byStore['gradingSheetRecords']).toBe(1);

            // Verify exportQuarantineArtifact produces valid JSON with opaque envelope
            const artifactJson = db.exportQuarantineArtifact();
            const parsedArtifact = JSON.parse(artifactJson);
            expect(parsedArtifact.totalQuarantined).toBe(1);
            expect(parsedArtifact.records[0].storeName).toBe('gradingSheetRecords');
            expect(parsedArtifact.records[0].rawEnvelope).toHaveProperty('ciphertext');
        });

        it('inspectDatabaseHealth reports unreadable and partial statuses accurately', async () => {
            const key1 = await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
            db.setDatabaseEncryptionKey(key1);

            await db.putRecord('students', { lrn: '123456789001', first_name: 'Ana' });

            // Switch to different key so students cannot be decrypted
            const key2 = await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
            db.setDatabaseEncryptionKey(key2);

            const health = await db.inspectDatabaseHealth();
            expect(health.isAvailable).toBe(true);
            expect(health.hasUnreadableStores).toBe(true);
            expect(health.stores['students'].status).toBe('unreadable');
            expect(health.stores['students'].rawCount).toBe(1);
            expect(health.stores['students'].readableCount).toBe(0);
        });

        it('getLiveDatabaseRecordCounts sets hasUnreadableStores and does not mask failures as healthy', async () => {
            await db.putRecord('students', { lrn: '123456789001', first_name: 'Ana' });

            // Simulate store read failure on students
            vi.spyOn(db, 'getAllRecords').mockImplementation(async (storeName: string) => {
                if (storeName === 'students') {
                    throw new Error('Synthetic IndexedDB I/O failure');
                }
                return [];
            });

            const counts = await getLiveDatabaseRecordCounts();
            expect(counts.hasUnreadableStores).toBe(true);
            expect(counts.storeStatuses?.['students']?.status).toBe('unreadable');
            expect(counts.storeStatuses?.['students']?.count).toBeNull();
            expect(counts.storeStatuses?.['students']?.error).toContain('Synthetic IndexedDB I/O failure');
        });
    });

    describe('Centralized Backup Schema & Version Validation', () => {
        it('rejects a backup with a future major version with an actionable message', () => {
            const futureBackup = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '4.0.0',
                    exportedBy: 'future-version-user',
                },
                payload: {
                    students: [{ lrn: '123456789001', first_name: 'Future Student' }],
                    sections: [{ id: 'sec-1', section_name: 'Emerald' }],
                },
            };

            const result = validateBackupPayloadStructure(futureBackup);
            expect(result.isValid).toBe(false);
            expect(result.isFutureVersion).toBe(true);
            expect(result.issues.some(issue => issue.includes('newer than this version of FormEase Pro (v3.5.20)'))).toBe(true);
        });

        it('rejects a backup containing internal duplicate student LRNs before writing', () => {
            const duplicateLrnBackup = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '2.0.0-local',
                },
                payload: {
                    students: [
                        { lrn: '123456789012', first_name: 'Student One', last_name: 'Dela Cruz' },
                        { lrn: '123456789012', first_name: 'Student Two', last_name: 'Santos' },
                    ],
                    sections: [{ id: 'sec-1', section_name: 'Emerald' }],
                },
            };

            const result = validateBackupPayloadStructure(duplicateLrnBackup);
            expect(result.isValid).toBe(false);
            expect(result.issues.some(issue => issue.includes('duplicate student LRN "123456789012"'))).toBe(true);
        });

        it('aborts importFromBackup before changing any records when backup validation fails', async () => {
            await db.putRecord('students', { lrn: 'ORIGINAL-LRN', first_name: 'Original Record' });

            const invalidBackup = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '5.0.0',
                },
                payload: {
                    students: [{ lrn: 'NEW-LRN', first_name: 'Replaced Record' }],
                },
            };

            await expect(db.importFromBackup(invalidBackup)).rejects.toThrow(/newer than this version/);

            // Verify original data is completely untouched
            const storedStudents = await db.getAllRecords<{ lrn: string; first_name: string }>('students');
            expect(storedStudents).toHaveLength(1);
            expect(storedStudents[0].lrn).toBe('ORIGINAL-LRN');
        });

        it('validateBackup integrates structure validation with integrity hashing', async () => {
            const backup = await createComprehensiveBackup(
                { school_id: '123456', name: 'Valid School', region: 'Region III', division: 'Tarlac', district: 'Victoria', head_name: 'Principal', head_position: 'Principal I', grade_levels_offered: 'Elementary' },
                [{ sy_id: 'sy-1', label: '2026-2027', is_active: true }],
                '2026-2027',
                [],
                [{ lrn: '123456789001', first_name: 'Maria', last_name: 'Santos', student_section: 'sec-1' } as never],
                [{ lrn: '123456789001', first_name: 'Maria', last_name: 'Santos', student_section: 'sec-1' } as never],
                [{ id: 'sec-1', section_name: 'Diamond' } as never],
                [{ id: 'sub-1', subject_name: 'English' } as never],
                [],
                [],
                [],
                [],
                [],
                [],
                []
            );

            const validation = await validateBackup(backup);
            expect(validation.isValid).toBe(true);
            expect(validation.issues).toHaveLength(0);

            // Tamper with students payload
            const tampered = JSON.parse(JSON.stringify(backup)) as ComprehensiveBackup;
            tampered.payload.students.push({ lrn: '123456789001', first_name: 'Duplicate' } as never);

            const tamperedValidation = await validateBackup(tampered);
            expect(tamperedValidation.isValid).toBe(false);
            expect(tamperedValidation.issues.some(i => i.includes('duplicate student LRN'))).toBe(true);
        });
    });

    describe('Pre-restore Safety Backup & Preview Cleanup', () => {
        it('halts restore when pre-restore safety snapshot cannot be created', async () => {
            // Put an existing learner record
            await db.putRecord('students', { lrn: 'SYNTHETIC-PRESERVE', first_name: 'Must Not Lose' });

            // Mock db.readBackupSnapshot failure so exportFullDatabaseBackup fails
            vi.spyOn(db, 'readBackupSnapshot').mockRejectedValueOnce(
                new Error('Disk space full or quota exhausted')
            );

            await expect(savePreRestoreSafetySnapshot()).rejects.toThrow(
                /Restore was cancelled because the existing records could not be preserved in a verified safety backup/
            );

            // Verify existing student was not modified
            const students = await db.getAllRecords<{ lrn: string }>('students');
            expect(students).toHaveLength(1);
            expect(students[0].lrn).toBe('SYNTHETIC-PRESERVE');
        });

        it('cleanupPreviewDatabase returns structured result and preparePreviewDatabase surfaces failures', async () => {
            const cleanupResult = await db.cleanupPreviewDatabase();
            expect(cleanupResult.success).toBe(true);

            // If preparePreviewDatabase encounters an error, it throws an actionable error
            vi.spyOn(db, 'cleanupPreviewDatabase').mockResolvedValueOnce({
                success: false,
                blocked: true,
                error: 'Preview database deletion was blocked by an open connection.',
            });

            await expect(db.preparePreviewDatabase()).rejects.toThrow(
                /Cannot prepare preview database: deletion was blocked/
            );
        });
    });

    describe('PACE Multi-Year Round-trip and S08 Credential Exclusion', () => {
        it('preserves multi-year PACE envelopes in backup settings round-trip', async () => {
            savePaceRecord('reading', '2025-2026', '123456789001', {
                lrn: '123456789001',
                studentName: 'Juan Dela Cruz',
                gradeLevel: 'Grade 1',
                section: 'Emerald',
                schoolYear: '2025-2026',
                teacherName: 'Teacher',
                ratings: { comp1: { t1: 'A', t2: 'B', t3: 'A' } },
            });
            savePaceRecord('reading', '2026-2027', '123456789001', {
                lrn: '123456789001',
                studentName: 'Juan Dela Cruz',
                gradeLevel: 'Grade 1',
                section: 'Emerald',
                schoolYear: '2026-2027',
                teacherName: 'Teacher',
                ratings: { comp1: { t1: 'B', t2: 'B', t3: 'B' } },
            });

            const collectedSettings = collectBackupLocalStorage();
            expect(collectedSettings[getPaceStorageKeyV2('reading')]).toBeDefined();

            // Clear localStorage
            localStorage.clear();
            expect(getPaceRecord('reading', '2025-2026', '123456789001')).toBeUndefined();

            // Restore settings
            restoreBackupLocalStorage(collectedSettings);

            const restored2025 = getPaceRecord('reading', '2025-2026', '123456789001');
            const restored2026 = getPaceRecord('reading', '2026-2027', '123456789001');
            expect(restored2025?.ratings.comp1.t1).toBe('A');
            expect(restored2026?.ratings.comp1.t1).toBe('B');
        });

        it('Finding S08: strictly excludes sensitive device credentials from backups', () => {
            // Set sensitive tokens and device configurations
            localStorage.setItem('formease_sms_api_key', 'SUPER-SECRET-SMS-KEY');
            localStorage.setItem('formease_sms_device_id', 'DEVICE-ID-12345');
            localStorage.setItem('gdrive_token', 'SECRET-GDRIVE-TOKEN');
            localStorage.setItem('gdrive_refresh_token', 'SECRET-GDRIVE-REFRESH');
            localStorage.setItem('formease_active_school_year', '2026-2027');

            const collected = collectBackupLocalStorage();
            expect(collected['formease_sms_api_key']).toBeUndefined();
            expect(collected['formease_sms_device_id']).toBeUndefined();
            expect(collected['gdrive_token']).toBeUndefined();
            expect(collected['gdrive_refresh_token']).toBeUndefined();
            expect(collected['formease_active_school_year']).toBe('2026-2027');

            // Also verify restoreBackupLocalStorage rejects credential keys
            localStorage.clear();
            restoreBackupLocalStorage({
                formease_sms_api_key: 'LEAKED-KEY',
                formease_active_school_year: '2026-2027',
            });
            expect(localStorage.getItem('formease_sms_api_key')).toBeNull();
            expect(localStorage.getItem('formease_active_school_year')).toBe('2026-2027');
        });
    });
});
