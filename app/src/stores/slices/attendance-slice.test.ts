import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AttendanceRecord, SF2Sheet } from '../../types';

const stores = new Map<string, Map<string, unknown>>();
const table = (name: string) => {
  if (!stores.has(name)) stores.set(name, new Map());
  return stores.get(name)!;
};

vi.mock('../../services/database', () => ({
  db: {
    getRecord: vi.fn(async (store: string, id: string) => table(store).get(id)),
    getAllRecords: vi.fn(async (store: string) => [...table(store).values()]),
    putRecord: vi.fn(async (store: string, record: { id: string }) => table(store).set(record.id, record)),
    putRecordsBulk: vi.fn(async (store: string, records: Array<{ id: string }>) => {
      records.forEach((record) => table(store).set(record.id, record));
    }),
    deleteRecord: vi.fn(async (store: string, id: string) => table(store).delete(id)),
  },
}));

import { createAttendanceSlice } from './attendance-slice';

describe('AttendanceSlice SF2 reconciliation', () => {
  let state: {
    activeSchoolYear: string;
    sections: Array<{ id: string; section_name: string; section_grade_level: string }>;
    sf2Sheets: SF2Sheet[];
    activeSF2Sheet: SF2Sheet | null;
    attendanceRecords: AttendanceRecord[];
  };
  const set = (updater: unknown) => {
    const next = typeof updater === 'function' ? (updater as (current: typeof state) => Partial<typeof state>)(state) : updater;
    state = { ...state, ...(next as Partial<typeof state>) };
  };

  beforeEach(() => {
    stores.clear();
    state = {
      activeSchoolYear: '2026-2027',
      sections: [{ id: 'section_1789451336249', section_name: 'Grade 7_Diamond', section_grade_level: 'Grade 7' }],
      sf2Sheets: [], activeSF2Sheet: null, attendanceRecords: [],
    };
  });

  it('retains opaque section metadata when daily attendance creates an SF2 sheet', async () => {
    const slice = createAttendanceSlice(set, () => state);
    await slice.upsertAttendanceRecords([{
      id: 'TEST000000001_2026-09-10', student_lrn: 'TEST000000001', section_id: 'section_1789451336249',
      date: '2026-09-10', status: 'absent',
    }]);

    const sheet = table('sf2Sheets').get('section_1789451336249_2026-2027_SEPTEMBER') as SF2Sheet;
    expect(sheet).toMatchObject({
      section_id: 'section_1789451336249', school_year: '2026-2027', month: 'SEPTEMBER',
    });
  });

  it('removes stale SF2-owned attendance when every mark in the month is cleared', async () => {
    const stale: AttendanceRecord = {
      id: 'TEST000000001_2026-09-10', student_lrn: 'TEST000000001', section_id: 'section_1789451336249',
      date: '2026-09-10', status: 'absent',
    };
    table('attendanceRecords').set(stale.id, stale);
    state.attendanceRecords = [stale];
    const slice = createAttendanceSlice(set, () => state);

    await slice.saveSF2Sheet({
      id: 'section_1789451336249_2026-2027_SEPTEMBER', section_id: 'section_1789451336249',
      school_year: '2026-2027', month: 'SEPTEMBER', date_labels: { 1: '10' }, attendance: {}, remarks: {},
      updated_at: '2026-09-10T00:00:00.000Z',
    });

    expect(table('attendanceRecords').get(stale.id)).toBeUndefined();
    expect(state.attendanceRecords).toEqual([]);
  });
});
