import type { ClassRecord, ObservedValues, HPSRecord } from '../../types';
import { db } from '../../services/database';

export interface GradingSlice {
  classRecords: ClassRecord[];
  setClassRecords: (records: ClassRecord[]) => void;
  addClassRecord: (record: ClassRecord) => Promise<void>;
  updateClassRecord: (record: ClassRecord) => Promise<void>;
  deleteClassRecord: (id: string) => Promise<void>;

  gradingSheetRecords: ClassRecord[];
  setGradingSheetRecords: (records: ClassRecord[]) => void;
  updateGradingSheetRecord: (record: ClassRecord) => Promise<void>;
  deleteGradingSheetRecord: (id: string) => Promise<void>;
  clearGradingSheet: (sectionId?: string, quarter?: number | string, schoolYear?: string) => Promise<void>;

  observedValues: ObservedValues[];
  setObservedValues: (values: ObservedValues[]) => void;
  updateObservedValue: (value: ObservedValues) => Promise<void>;

  hpsRecords: HPSRecord[];
  setHpsRecords: (records: HPSRecord[]) => void;
  updateHPSRecord: (record: HPSRecord) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createGradingSlice(set: (state: any) => void, get: () => any): GradingSlice {
  return {
    // ==================== CLASS RECORDS ====================
    classRecords: [],
    setClassRecords: (records) => set({ classRecords: records }),
    addClassRecord: async (record) => {
      try {
        set((state: { classRecords: ClassRecord[] }) => ({ classRecords: [...state.classRecords, record] }));
        await db.putRecord('classRecords', record);
        get().showNotification('Grade recorded', 'success');
      } catch (error) {
        console.error('Error adding class record:', error);
        get().showNotification('Failed to record grade', 'error');
        set((state: { classRecords: ClassRecord[] }) => ({ classRecords: state.classRecords.filter((r) => r.id !== record.id) }));
        throw error;
      }
    },
    updateClassRecord: async (record) => {
      try {
        const existing = get().classRecords.find((r: ClassRecord) => r.id === record.id);
        if (existing) {
          set((state: { classRecords: ClassRecord[] }) => ({
            classRecords: state.classRecords.map((r) => (r.id === record.id ? record : r)),
          }));
        } else {
          set((state: { classRecords: ClassRecord[] }) => ({
            classRecords: [...state.classRecords, record],
          }));
        }
        await db.putRecord('classRecords', record);
      } catch (error) {
        console.error('Error updating class record:', error);
        get().showNotification('Failed to update grade', 'error');
        throw error;
      }
    },
    deleteClassRecord: async (id) => {
      const previousRecords = get().classRecords as ClassRecord[];
      try {
        set((state: { classRecords: ClassRecord[] }) => ({ classRecords: state.classRecords.filter((r) => r.id !== id) }));
        await db.deleteRecord('classRecords', id);
        get().showNotification('Grade deleted', 'success');
      } catch (error) {
        console.error('Error deleting class record:', error);
        set({ classRecords: previousRecords });
        get().showNotification('Failed to delete grade', 'error');
        throw error;
      }
    },

    // ==================== GRADING SHEET RECORDS ====================
    gradingSheetRecords: [],
    setGradingSheetRecords: (records) => set({ gradingSheetRecords: records }),
    updateGradingSheetRecord: async (record) => {
      try {
        const existing = get().gradingSheetRecords.find((r: ClassRecord) => r.id === record.id);
        if (existing) {
          set((state: { gradingSheetRecords: ClassRecord[] }) => ({
            gradingSheetRecords: state.gradingSheetRecords.map((r) => (r.id === record.id ? record : r)),
          }));
        } else {
          set((state: { gradingSheetRecords: ClassRecord[] }) => ({
            gradingSheetRecords: [...state.gradingSheetRecords, record],
          }));
        }
        await db.putRecord('gradingSheetRecords', record);
      } catch (error) {
        console.error('Error updating grading sheet record:', error);
        throw error;
      }
    },
    deleteGradingSheetRecord: async (id) => {
      const previousRecords = get().gradingSheetRecords as ClassRecord[];
      try {
        set((state: { gradingSheetRecords: ClassRecord[] }) => ({ gradingSheetRecords: state.gradingSheetRecords.filter((r) => r.id !== id) }));
        await db.deleteRecord('gradingSheetRecords', id);
      } catch (error) {
        console.error('Error deleting grading sheet record:', error);
        set({ gradingSheetRecords: previousRecords });
        throw error;
      }
    },
    clearGradingSheet: async (sectionId?: string, quarter?: number | string, schoolYear?: string) => {
      try {
        if (sectionId) {
          const allRecords = get().gradingSheetRecords as ClassRecord[];
          const toDelete = allRecords.filter(r => {
            const matchSec = r.section_id === sectionId;
            const matchQ = quarter === undefined || quarter === 'all' || Number(r.quarter) === Number(quarter);
            const matchSY = !schoolYear || !r.school_year || r.school_year === schoolYear;
            return matchSec && matchQ && matchSY;
          });

          const remaining = allRecords.filter(r => !toDelete.some(d => d.id === r.id));
          set({ gradingSheetRecords: remaining });

          for (const rec of toDelete) {
            await db.deleteRecord('gradingSheetRecords', rec.id);
          }
          get().showNotification(`Cleared ${toDelete.length} grading sheet entries for this section`, 'success');
        } else {
          set({ gradingSheetRecords: [] });
          await db.clearStore('gradingSheetRecords');
          get().showNotification('All grading records cleared', 'success');
        }
      } catch (error) {
        console.error('Error clearing grading sheet:', error);
        get().showNotification('Failed to clear records', 'error');
        throw error;
      }
    },

    // ==================== OBSERVED VALUES ====================
    observedValues: [],
    setObservedValues: (values) => set({ observedValues: values }),
    updateObservedValue: async (value) => {
      try {
        const existing = get().observedValues.find((v: ObservedValues) => v.id === value.id);
        if (existing) {
          set((state: { observedValues: ObservedValues[] }) => ({
            observedValues: state.observedValues.map((v) => (v.id === value.id ? value : v)),
          }));
        } else {
          set((state: { observedValues: ObservedValues[] }) => ({
            observedValues: [...state.observedValues, value],
          }));
        }
        await db.putRecord('observedValues', value);
      } catch (error) {
        console.error('Error updating observed value:', error);
        throw error;
      }
    },

    // ==================== HPS RECORDS ====================
    hpsRecords: [],
    setHpsRecords: (records) => set({ hpsRecords: records }),
    updateHPSRecord: async (record) => {
      try {
        const existing = get().hpsRecords.find((r: HPSRecord) => r.id === record.id);
        if (existing) {
          set((state: { hpsRecords: HPSRecord[] }) => ({
            hpsRecords: state.hpsRecords.map((r) => (r.id === record.id ? record : r)),
          }));
        } else {
          set((state: { hpsRecords: HPSRecord[] }) => ({
            hpsRecords: [...state.hpsRecords, record],
          }));
        }
        await db.putRecord('hpsRecords', record);
      } catch (error) {
        console.error('Error updating HPS record:', error);
        throw error;
      }
    },
  };
}
