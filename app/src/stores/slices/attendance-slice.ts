import type { SF2Sheet, AttendanceRecord } from '../../types';
import { db } from '../../services/database';

export interface AttendanceSlice {
  activeSF2Sheet: SF2Sheet | null;
  sf2Sheets: SF2Sheet[];
  setSF2Sheets: (sheets: SF2Sheet[]) => void;
  fetchSF2Sheet: (sectionId: string, month: string) => Promise<void>;
  saveSF2Sheet: (sheet: SF2Sheet) => Promise<void>;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: (records: AttendanceRecord[]) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAttendanceSlice(set: (state: any) => void, get: () => any): AttendanceSlice {
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
        set((state: { sf2Sheets: SF2Sheet[] }) => ({
          sf2Sheets: [...state.sf2Sheets.filter((s) => s.id !== sheet.id), sheet],
          activeSF2Sheet: sheet,
        }));
      } catch (error) {
        console.error('Error saving SF2 sheet:', error);
        throw error;
      }
    },
    attendanceRecords: [],
    setAttendanceRecords: (records) => set({ attendanceRecords: records }),
  };
}
