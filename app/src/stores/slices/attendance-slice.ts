import type { SF2Sheet, AttendanceRecord, Section } from '../../types';
import { db } from '../../services/database';
import {
  buildAttendanceRecordsFromSf2Sheet,
  buildSf2SheetAttendanceFromRecords,
  buildAutoFilledDateLabels,
  getSf2MonthContext,
} from '../../utils/sf2-sync';

export interface AttendanceSlice {
  activeSF2Sheet: SF2Sheet | null;
  sf2Sheets: SF2Sheet[];
  setSF2Sheets: (sheets: SF2Sheet[]) => void;
  fetchSF2Sheet: (sectionId: string, month: string) => Promise<void>;
  saveSF2Sheet: (sheet: SF2Sheet) => Promise<void>;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: (records: AttendanceRecord[]) => void;
  upsertAttendanceRecords: (records: AttendanceRecord[]) => Promise<void>;
  deleteAttendanceRecords: (ids: string[]) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAttendanceSlice(set: (state: any) => void, get: () => any): AttendanceSlice {
  const syncSheetState = (sheet: SF2Sheet) => {
    set((state: { sf2Sheets: SF2Sheet[]; activeSF2Sheet: SF2Sheet | null }) => ({
      sf2Sheets: [...state.sf2Sheets.filter((s) => s.id !== sheet.id), sheet],
      activeSF2Sheet: state.activeSF2Sheet?.id === sheet.id ? sheet : state.activeSF2Sheet,
    }));
  };

  const syncAttendanceState = (records: AttendanceRecord[]) => {
    set((state: { attendanceRecords: AttendanceRecord[] }) => {
      const incomingKeys = new Set(records.map((r) => `${r.student_lrn}_${r.date}`));
      const incomingIds = new Set(records.map((r) => r.id));

      const filteredExisting = state.attendanceRecords.filter(
        (r) => !incomingIds.has(r.id) && !incomingKeys.has(`${r.student_lrn}_${r.date}`)
      );

      return {
        attendanceRecords: [...filteredExisting, ...records],
      };
    });
  };

  const upsertAttendanceToSf2 = async (records: AttendanceRecord[]) => {
    if (!records.length) return;
    const activeSchoolYear = get().activeSchoolYear as string;
    const allSections = (get().sections || []) as Section[];
    const grouped = new Map<string, AttendanceRecord[]>();

    for (const record of records) {
      const context = getSf2MonthContext(record.date, activeSchoolYear);
      if (!context || !record.section_id) continue;
      const matchedSection = allSections.find((s) => s.id === record.section_id || s.section_name === record.section_id);
      const targetSectionId = matchedSection?.id || record.section_id;
      const sheetId = `${targetSectionId}_${activeSchoolYear}_${context.month}`;
      const bucket = grouped.get(sheetId) || [];
      bucket.push(record);
      grouped.set(sheetId, bucket);
    }

    for (const [sheetId, group] of grouped.entries()) {
      const [sectionId, schoolYear, month] = sheetId.split('_');
      const matchedSection = allSections.find((s) => s.id === sectionId || s.section_name === sectionId);
      let existing = await db.getRecord<SF2Sheet>('sf2Sheets', sheetId);
      if (!existing && matchedSection) {
        const altId1 = `${matchedSection.section_name}_${schoolYear}_${month}`;
        const altId2 = `${matchedSection.id}_${schoolYear}_${month}`;
        if (altId1 !== sheetId) existing = await db.getRecord<SF2Sheet>('sf2Sheets', altId1);
        if (!existing && altId2 !== sheetId) existing = await db.getRecord<SF2Sheet>('sf2Sheets', altId2);
      }

      const includeSaturdays = localStorage.getItem('formease_sf2_include_saturdays') === 'true';
      const baseSheet: SF2Sheet = existing || {
        id: sheetId,
        section_id: sectionId,
        school_year: schoolYear,
        month,
        date_labels: buildAutoFilledDateLabels(month, schoolYear, includeSaturdays),
        attendance: {},
        remarks: {},
        updated_at: new Date().toISOString(),
      };
      const nextSheet = buildSf2SheetAttendanceFromRecords(baseSheet, group);
      await db.putRecord('sf2Sheets', nextSheet);
      syncSheetState(nextSheet);
    }
  };

  return {
    // ==================== SF2 SHEETS ====================
    activeSF2Sheet: null,
    sf2Sheets: [],
    setSF2Sheets: (sheets) => set({ sf2Sheets: sheets }),
    fetchSF2Sheet: async (sectionId, month) => {
      try {
        const sy = get().activeSchoolYear as string;
        const id = `${sectionId}_${sy}_${month}`;
        const sheet = await db.getRecord<SF2Sheet>('sf2Sheets', id);
        if (sheet) {
          set({ activeSF2Sheet: sheet });
        } else {
          set({ activeSF2Sheet: null });
        }
      } catch (error) {
        console.error('Error fetching SF2 sheet:', error);
      }
    },
    saveSF2Sheet: async (sheet) => {
      try {
        await db.putRecord('sf2Sheets', sheet);
        syncSheetState(sheet);

        const rebuilt = buildAttendanceRecordsFromSf2Sheet(sheet);
        if (rebuilt.length > 0) {
          const allAttendance = await db.getAllRecords<AttendanceRecord>('attendanceRecords');
          const monthIndex = [
            'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
          ].indexOf(sheet.month);
          const [startYear, endYear] = sheet.school_year.split('-').map(Number);
          const year = monthIndex >= 5 ? startYear : endYear;
          const monthDates = new Set(
            Object.values(sheet.date_labels || {})
              .map((label) => String(label || '').trim())
              .filter((label) => /^\d{1,2}$/.test(label))
              .map((dayLabel) => `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(Number(dayLabel)).padStart(2, '0')}`),
          );

          const allSections = (get().sections || []) as Section[];
          const sheetSection = allSections.find((s) => s.id === sheet.section_id || s.section_name === sheet.section_id);
          const isRecordForSheetSection = (rec: AttendanceRecord) => {
            if (rec.section_id === sheet.section_id) return true;
            if (sheetSection && (rec.section_id === sheetSection.id || rec.section_id === sheetSection.section_name)) return true;
            return false;
          };

          const rebuiltKeys = new Set(rebuilt.map((r) => `${r.student_lrn}_${r.date}`));
          const staleIds = allAttendance
            .filter((record) => isRecordForSheetSection(record) && monthDates.has(record.date) && rebuiltKeys.has(`${record.student_lrn}_${record.date}`))
            .map((record) => record.id);

          for (const id of staleIds) {
            await db.deleteRecord('attendanceRecords', id);
          }
          await db.putRecordsBulk('attendanceRecords', rebuilt);
          set((state: { attendanceRecords: AttendanceRecord[] }) => ({
            attendanceRecords: [
              ...state.attendanceRecords.filter((record) => !staleIds.includes(record.id)),
              ...rebuilt,
            ],
          }));
        }
      } catch (error) {
        console.error('Error saving SF2 sheet:', error);
        throw error;
      }
    },
    attendanceRecords: [],
    setAttendanceRecords: (records) => set({ attendanceRecords: records }),
    upsertAttendanceRecords: async (records) => {
      // 1. Always persist to IndexedDB and update in-memory state
      await db.putRecordsBulk('attendanceRecords', records);
      syncAttendanceState(records);

      // 2. SF2 sync is desktop-only; never let it break attendance marking
      try {
        await upsertAttendanceToSf2(records);
      } catch (sf2Err) {
        // Silently skip SF2 sync on phone (no activeSchoolYear)
        console.debug('[Attendance] SF2 sync skipped:', sf2Err);
      }
    },
    deleteAttendanceRecords: async (ids) => {
      try {
        const allAttendance = await db.getAllRecords<AttendanceRecord>('attendanceRecords');
        const removedRecords = allAttendance.filter((record) => ids.includes(record.id));
        for (const id of ids) {
          await db.deleteRecord('attendanceRecords', id);
        }
        set((state: { attendanceRecords: AttendanceRecord[] }) => ({
          attendanceRecords: state.attendanceRecords.filter((record) => !ids.includes(record.id)),
        }));

        const activeSchoolYear = get().activeSchoolYear as string;
        const grouped = new Map<string, AttendanceRecord[]>();
        for (const record of removedRecords) {
          const context = getSf2MonthContext(record.date, activeSchoolYear);
          if (!context || !record.section_id) continue;
          const sheetId = `${record.section_id}_${activeSchoolYear}_${context.month}`;
          const bucket = grouped.get(sheetId) || [];
          bucket.push(record);
          grouped.set(sheetId, bucket);
        }

        for (const [sheetId, group] of grouped.entries()) {
          const existing = await db.getRecord<SF2Sheet>('sf2Sheets', sheetId);
          if (!existing) continue;
          const attendance = { ...existing.attendance };
          for (const record of group) {
            const context = getSf2MonthContext(record.date, activeSchoolYear);
            if (!context) continue;
            const row = { ...(attendance[record.student_lrn] || {}) };
            delete row[context.dateKey];
            attendance[record.student_lrn] = row;
          }
          const nextSheet = { ...existing, attendance, updated_at: new Date().toISOString() };
          await db.putRecord('sf2Sheets', nextSheet);
          syncSheetState(nextSheet);
        }
      } catch (error) {
        console.error('Error deleting attendance records:', error);
        throw error;
      }
    },
  };
}
