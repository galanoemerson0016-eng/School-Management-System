import { describe, it, expect, vi } from 'vitest';

vi.mock('../services/database', () => ({
    db: {
        getRecord: vi.fn().mockResolvedValue(undefined),
        putRecord: vi.fn().mockResolvedValue('id'),
    },
}));

import { extractLrnFromScan } from './scan-utils';
import {
    attendanceStatusFromSf2Mark,
    buildAttendanceRecordsFromSf2Sheet,
    buildSf2SheetAttendanceFromRecords,
    sf2MarkFor,
} from './sf2-sync';

describe('extractLrnFromScan', () => {
    it('returns a plain barcode value as-is (USB scanner)', () => {
        expect(extractLrnFromScan('136548120001')).toBe('136548120001');
        expect(extractLrnFromScan('  136548120001  ')).toBe('136548120001');
    });

    it('extracts the LRN line from the ID card QR payload', () => {
        const payload = 'Name: Dela Cruz, Juan\nLRN: 136548120001\nGrade Level and Section: Grade 10 – Aguinaldo';
        expect(extractLrnFromScan(payload)).toBe('136548120001');
    });

    it('is case-insensitive on the LRN label', () => {
        expect(extractLrnFromScan('lrn: 136548120001')).toBe('136548120001');
    });
});

describe('sf2MarkFor', () => {
    it('maps daily statuses to SF2 cell marks', () => {
        expect(sf2MarkFor('present')).toBe('');
        expect(sf2MarkFor('absent')).toBe('absent');
        expect(sf2MarkFor('late')).toBe('tardy-upper');
        expect(sf2MarkFor('cutting')).toBe('tardy-lower');
        // SF2 has no excused mark — excused absences count as absent on the form
        expect(sf2MarkFor('excused')).toBe('absent');
    });
});

describe('SF2 attendance sync helpers', () => {
    it('maps SF2 cell marks back to daily statuses', () => {
        expect(attendanceStatusFromSf2Mark('')).toBe('present');
        expect(attendanceStatusFromSf2Mark('absent')).toBe('absent');
        expect(attendanceStatusFromSf2Mark('tardy-upper')).toBe('late');
        expect(attendanceStatusFromSf2Mark('tardy-lower')).toBe('cutting');
    });

    it('rebuilds attendance records from an SF2 sheet', () => {
        const sheet = {
            id: 'Grade 7_Arr_2026-2027_JULY',
            section_id: 'Grade 7-A',
            school_year: '2026-2027',
            month: 'JULY',
            date_labels: { 1: '5', 2: '6', 3: '7' },
            attendance: {
                'LRN-1': {
                    date_5: '',
                    date_6: 'tardy-upper',
                    date_7: 'tardy-lower',
                },
            },
            remarks: {},
            updated_at: new Date().toISOString(),
        } as const;

        const records = buildAttendanceRecordsFromSf2Sheet(sheet as never);
        expect(records).toHaveLength(2);
        expect(records[0]).toMatchObject({ student_lrn: 'LRN-1', date: '2026-07-06', status: 'late' });
        expect(records[1]).toMatchObject({ student_lrn: 'LRN-1', date: '2026-07-07', status: 'cutting' });
    });

    it('writes daily statuses back into an SF2 sheet', () => {
        const sheet = {
            id: 'Grade 7-A_2026-2027_JULY',
            section_id: 'Grade 7-A',
            school_year: '2026-2027',
            month: 'JULY',
            date_labels: { 1: '5', 2: '6', 3: '7' },
            attendance: {},
            remarks: {},
            updated_at: new Date().toISOString(),
        } as const;

        const updated = buildSf2SheetAttendanceFromRecords(sheet as never, [
            { id: 'LRN-1_2026-07-05', student_lrn: 'LRN-1', date: '2026-07-05', status: 'present', section_id: 'Grade 7-A' },
            { id: 'LRN-1_2026-07-06', student_lrn: 'LRN-1', date: '2026-07-06', status: 'late', section_id: 'Grade 7-A' },
            { id: 'LRN-1_2026-07-07', student_lrn: 'LRN-1', date: '2026-07-07', status: 'cutting', section_id: 'Grade 7-A' },
        ] as never);

        expect(updated.attendance['LRN-1'].date_5).toBe('');
        expect(updated.attendance['LRN-1'].date_6).toBe('tardy-upper');
        expect(updated.attendance['LRN-1'].date_7).toBe('tardy-lower');
    });
});
