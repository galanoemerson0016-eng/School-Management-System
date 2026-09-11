import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub out the database service — validateBackup doesn't use it directly,
// but backup-restore.ts imports it at module load time.
vi.mock('../services/database', () => ({
    db: {
        getAllRecords: vi.fn().mockResolvedValue([]),
        putRecord: vi.fn().mockResolvedValue('id'),
        putRecordsBulk: vi.fn().mockResolvedValue(undefined),
        clearStore: vi.fn().mockResolvedValue(undefined),
    },
}));

import {
    validateBackup,
    collectBackupLocalStorage,
    restoreBackupLocalStorage,
    createComprehensiveBackup,
    generateBackupReport,
    exportFullDatabaseBackup,
    downloadComprehensiveBackup,
} from './backup-restore';
import type { ComprehensiveBackup } from './backup-restore';
import type { SchoolProfile } from '../types';
import { useSF10Store } from '../stores/sf10-store';

// Minimal valid backup fixture — enough to pass all structural checks.
function makeBackup(overrides: Partial<ComprehensiveBackup> = {}): ComprehensiveBackup {
    return {
        metadata: {
            exportDate: '2026-01-01T00:00:00.000Z',
            version: '2.0.0',
            exportedBy: 'test',
            note: '',
            warning: '',
        },
        summary: {
            activeSchoolYear: '2026-2027',
            students: 0,
            studentProfiles: 0,
            sections: 0,
            subjects: 0,
            grades: 0,
            gradingSheetRecords: 0,
            observedValues: 0,
            hpsRecords: 0,
            sf2Sheets: 0,
            announcements: 0,
            schoolYears: 0,
            enrollments: 0,
            users: 0,
            systemSettings: 0,
            adviserAssignments: 0,
            gradingConfiguration: 0,
            attendanceRecords: 0,
            sf10Records: 0,
        },
        payload: {
            students: [],
            studentProfiles: [],
            sections: [],
            subjects: [],
            grades: [],
            gradingSheetRecords: [],
            observedValues: [],
            hpsRecords: [],
            sf2Sheets: [],
            announcements: [],
            schoolYears: [],
            enrollments: [],
            attendanceRecords: [],
            users: [],
            systemSettings: {},
            adviserAssignments: [],
            gradingConfiguration: {},
            localStorageData: {},
        },
        ...overrides,
    } as ComprehensiveBackup;
}

describe('validateBackup', () => {
    it('passes a well-formed backup with no hash', async () => {
        const result = await validateBackup(makeBackup());
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
    });

    it('flags missing metadata timestamp', async () => {
        const backup = makeBackup({ metadata: { exportDate: '', version: '2.0.0', exportedBy: '', note: '', warning: '' } });
        const result = await validateBackup(backup);
        expect(result.isValid).toBe(false);
        expect(result.issues.some(i => i.includes('metadata timestamp'))).toBe(true);
    });

    it('flags invalid students array', async () => {
        const backup = makeBackup();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (backup.payload as any).students = null;
        const result = await validateBackup(backup);
        expect(result.isValid).toBe(false);
        expect(result.issues.some(i => i.includes('Students payload'))).toBe(true);
    });

    it('passes when the stored hash matches the payload', async () => {
        const backup = makeBackup();
        // Compute the expected hash the same way the production code does.
        const encoded = new TextEncoder().encode(JSON.stringify(backup.payload));
        const buf = await crypto.subtle.digest('SHA-256', encoded);
        const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

        backup.metadata.payloadHash = hash;
        const result = await validateBackup(backup);
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
    });

    it('flags tampered payload when hash does not match', async () => {
        const backup = makeBackup();
        backup.metadata.payloadHash = 'deadbeef'.repeat(8); // wrong hash
        const result = await validateBackup(backup);
        expect(result.isValid).toBe(false);
        expect(result.issues.some(i => i.includes('integrity'))).toBe(true);
    });

    it('flags corrupted sf10-storage JSON in localStorageData', async () => {
        const backup = makeBackup({
            payload: {
                ...makeBackup().payload,
                localStorageData: {
                    'sf10-storage': '{corrupted json...',
                },
            },
        });
        const result = await validateBackup(backup);
        expect(result.isValid).toBe(false);
        expect(result.issues.some(i => i.includes('SF10 storage data is corrupted'))).toBe(true);
    });
});

describe('collectBackupLocalStorage & restoreBackupLocalStorage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('whitelists sf10-storage, activeSchoolYear, and configuration keys', () => {
        const sf10Data = JSON.stringify({
            state: {
                overrides: {
                    '123456789012_Front': { 'G7_Q1_MATH': '90', 'G7_REMARKS': 'PASSED' },
                },
                history: {},
            },
            version: 0,
        });

        localStorage.setItem('sf10-storage', sf10Data);
        localStorage.setItem('activeSchoolYear', '2026-2027');
        localStorage.setItem('formease_subjects_autoloaded', 'true');
        localStorage.setItem('formease_shs_subjects_migrated_v2', 'true');
        localStorage.setItem('formease_sf8_signatories_123', '{"adviser":"Teacher"}');
        localStorage.setItem('g1_remarks_123_2026-2027', '{"q1":"Very good"}');
        // Excluded keys
        localStorage.setItem('formease-auth-token', 'secret');
        localStorage.setItem('formease-browser-id', 'browser-xyz');

        const collected = collectBackupLocalStorage();

        expect(collected['sf10-storage']).toBe(sf10Data);
        expect(collected['activeSchoolYear']).toBe('2026-2027');
        expect(collected['formease_subjects_autoloaded']).toBe('true');
        expect(collected['formease_shs_subjects_migrated_v2']).toBe('true');
        expect(collected['formease_sf8_signatories_123']).toBe('{"adviser":"Teacher"}');
        expect(collected['g1_remarks_123_2026-2027']).toBe('{"q1":"Very good"}');
        expect(collected['formease-auth-token']).toBeUndefined();
        expect(collected['formease-browser-id']).toBeUndefined();
    });

    it('restores localStorage items and calls sf10 rehydrate', () => {
        const rehydrateSpy = vi.spyOn(useSF10Store.persist, 'rehydrate');

        const dataToRestore = {
            'sf10-storage': JSON.stringify({
                state: {
                    overrides: {
                        '999999999999_Front': { 'G7_REMARKS': 'FAILED' },
                    },
                    history: {},
                },
            }),
            'activeSchoolYear': '2027-2028',
        };

        restoreBackupLocalStorage(dataToRestore);

        expect(localStorage.getItem('sf10-storage')).toBe(dataToRestore['sf10-storage']);
        expect(localStorage.getItem('activeSchoolYear')).toBe('2027-2028');
        expect(rehydrateSpy).toHaveBeenCalled();

        rehydrateSpy.mockRestore();
    });

    it('computes sf10Records in createComprehensiveBackup and includes in report', async () => {
        const sf10Data = JSON.stringify({
            state: {
                overrides: {
                    '100000000001_Front': { G7_REMARKS: 'PASSED' },
                    '100000000002_Front': { G7_REMARKS: 'PROMOTED' },
                },
            },
        });
        localStorage.setItem('sf10-storage', sf10Data);

        const backup = await createComprehensiveBackup(
            { school_id: '123' } as unknown as SchoolProfile,
            [],
            '2026-2027',
            [],
            [],
            [],
            [],
            [],
            [],
            [],
            [],
            [],
            [],
            [],
            [],
            'test-user'
        );

        expect(backup.summary.sf10Records).toBe(2);
        expect(backup.payload.localStorageData?.['sf10-storage']).toBe(sf10Data);

        const report = generateBackupReport(backup);
        expect(report).toContain('SF10 Customizations & Remarks: 2 learner(s)');
    });

    it('exports full database backup as ComprehensiveBackup with metadata, summary, and payload', async () => {
        const backup = await exportFullDatabaseBackup('automated-test');

        expect(backup).toBeDefined();
        expect(backup.metadata).toBeDefined();
        expect(backup.metadata.version).toBe('2.0.0-local');
        expect(backup.metadata.exportedBy).toBe('automated-test');
        expect(backup.metadata.payloadHash).toBeDefined();
        expect(backup.summary).toBeDefined();
        expect(backup.payload).toBeDefined();
        expect(backup.payload.schoolProfile).toBeDefined();
        expect(Array.isArray(backup.payload.students)).toBe(true);
        expect(Array.isArray(backup.payload.sections)).toBe(true);
        expect(Array.isArray(backup.payload.subjects)).toBe(true);
        expect(Array.isArray(backup.payload.classRecords)).toBe(true);
        expect(backup._checksum).toBeDefined();

        const validation = await validateBackup(backup);
        expect(validation.isValid).toBe(true);
    });

    it('downloadComprehensiveBackup creates download element with SMS_Backup_Comprehensive filename', () => {
        const fakeBackup = makeBackup();
        const appendChildSpy = vi.spyOn(document.body, 'appendChild');
        const removeChildSpy = vi.spyOn(document.body, 'removeChild');

        downloadComprehensiveBackup(fakeBackup);

        expect(appendChildSpy).toHaveBeenCalled();
        const link = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
        expect(link.download).toMatch(/^SMS_Backup_Comprehensive_\d{4}-\d{2}-\d{2}\.json$/);
        expect(removeChildSpy).toHaveBeenCalledWith(link);

        appendChildSpy.mockRestore();
        removeChildSpy.mockRestore();
    });
});

