import { describe, it, expect, vi, beforeAll } from 'vitest';

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

import { validateBackup } from './backup-restore';
import type { ComprehensiveBackup } from './backup-restore';

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
});
