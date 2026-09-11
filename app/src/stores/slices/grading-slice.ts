import type { ClassRecord, ObservedValues, HPSRecord } from '../../types';
import { db } from '../../services/database';
import { isSameSubject } from '../../utils/grading-helpers';

export interface GradingSlice {
  classRecords: ClassRecord[];
  setClassRecords: (records: ClassRecord[]) => void;
  addClassRecord: (record: ClassRecord) => Promise<void>;
  updateClassRecord: (record: ClassRecord) => Promise<void>;
  deleteClassRecord: (id: string) => Promise<void>;

  gradingSheetRecords: ClassRecord[];
  setGradingSheetRecords: (records: ClassRecord[]) => void;
  updateGradingSheetRecord: (record: ClassRecord) => Promise<void>;
  bulkUpdateGradingSheetRecords: (records: ClassRecord[]) => Promise<void>;
  deleteGradingSheetRecord: (id: string) => Promise<void>;
  clearGradingSheet: (sectionId?: string, quarter?: number | string, schoolYear?: string, studentLrns?: string[]) => Promise<void>;

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
        const state = get();
        const currentRecords = state.gradingSheetRecords as ClassRecord[];

        const isMatch = (r: ClassRecord) => {
          if (r.id === record.id) return true;
          const sameStudent = r.student_lrn === record.student_lrn || String(r.student_lrn).trim() === String(record.student_lrn).trim();
          const sameSubject = isSameSubject(r.subject_id, r.subject_name, record.subject_id, record.subject_name);
          const sameQuarter = Number(r.quarter) === Number(record.quarter) || String(r.quarter).toLowerCase() === String(record.quarter).toLowerCase();
          const sameSy = !r.school_year || !record.school_year || r.school_year === record.school_year;
          return sameStudent && sameSubject && sameQuarter && sameSy;
        };

        const matchingOldRecords = currentRecords.filter(isMatch);
        const remainingRecords = currentRecords.filter((r) => !isMatch(r));

        for (const oldRec of matchingOldRecords) {
          if (oldRec.id && oldRec.id !== record.id) {
            await db.deleteRecord('gradingSheetRecords', oldRec.id);
          }
        }

        set({ gradingSheetRecords: [...remainingRecords, record] });
        await db.putRecord('gradingSheetRecords', record);
      } catch (error) {
        console.error('Error updating grading sheet record:', error);
        throw error;
      }
    },
    bulkUpdateGradingSheetRecords: async (records) => {
      if (!records || records.length === 0) return;
      try {
        const state = get();
        const currentRecords = state.gradingSheetRecords as ClassRecord[];

        const newRecordMap = new Map<string, ClassRecord>();
        for (const r of records) {
          const key = `${String(r.student_lrn).trim()}_${r.subject_id}_${r.quarter}_${r.school_year || ''}`;
          newRecordMap.set(key, r);
        }

        const isOverwritten = (r: ClassRecord) => {
          const key = `${String(r.student_lrn).trim()}_${r.subject_id}_${r.quarter}_${r.school_year || ''}`;
          if (newRecordMap.has(key)) return true;
          return records.some((newRec) => {
            const sameStudent = r.student_lrn === newRec.student_lrn || String(r.student_lrn).trim() === String(newRec.student_lrn).trim();
            const sameSubject = isSameSubject(r.subject_id, r.subject_name, newRec.subject_id, newRec.subject_name);
            const sameQuarter = Number(r.quarter) === Number(newRec.quarter) || String(r.quarter).toLowerCase() === String(newRec.quarter).toLowerCase();
            const sameSy = !r.school_year || !newRec.school_year || r.school_year === newRec.school_year;
            return sameStudent && sameSubject && sameQuarter && sameSy;
          });
        };

        const matchingOldRecords = currentRecords.filter(isOverwritten);
        const remainingRecords = currentRecords.filter((r) => !isOverwritten(r));

        for (const oldRec of matchingOldRecords) {
          if (oldRec.id && !newRecordMap.has(oldRec.id)) {
            await db.deleteRecord('gradingSheetRecords', oldRec.id);
          }
        }

        set({ gradingSheetRecords: [...remainingRecords, ...records] });
        await db.putRecordsBulk('gradingSheetRecords', records);
      } catch (error) {
        console.error('Error bulk updating grading sheet records:', error);
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
    clearGradingSheet: async (sectionId?: string, quarter?: number | string, schoolYear?: string, studentLrns?: string[]) => {
      try {
        const state = get();
        const allGradingSheetRecords = state.gradingSheetRecords as ClassRecord[];

        if (sectionId || (studentLrns && studentLrns.length > 0)) {
          // Build set of section tokens to match against
          const secTokens = new Set<string>();
          if (sectionId) {
            secTokens.add(sectionId.trim().toLowerCase());
          }

          const sections = (state.sections || []) as { id: string; section_name: string; section_grade_level: string }[];
          const secObj = sections.find(s =>
            s.id === sectionId ||
            s.section_name.toLowerCase() === (sectionId || '').toLowerCase() ||
            `${s.section_grade_level} - ${s.section_name}`.toLowerCase() === (sectionId || '').toLowerCase()
          );

          if (secObj) {
            secTokens.add(secObj.id.trim().toLowerCase());
            secTokens.add(secObj.section_name.trim().toLowerCase());
            secTokens.add(`${secObj.section_grade_level} - ${secObj.section_name}`.trim().toLowerCase());
          }

          // Build set of student LRNs for this section
          const lrnSet = new Set<string>((studentLrns || []).map(lrn => String(lrn).trim()));
          if (secObj) {
            const allStudents = (state.students || []) as { lrn: string; section_id?: string; student_section?: string }[];
            allStudents.forEach(st => {
              if (
                st.section_id === secObj.id ||
                st.student_section === secObj.section_name ||
                st.student_section === `${secObj.section_grade_level} - ${secObj.section_name}`
              ) {
                lrnSet.add(String(st.lrn).trim());
              }
            });
          }

          const isRecordMatch = (r: ClassRecord) => {
            const matchQ = quarter === undefined || quarter === 'all' || Number(r.quarter) === Number(quarter);
            const matchSY = !schoolYear || !r.school_year || r.school_year === schoolYear || r.school_year.includes(schoolYear) || schoolYear.includes(r.school_year || '');
            if (!matchQ || !matchSY) return false;

            const rSec = (r.section_id || '').trim().toLowerCase();
            const rLrn = String(r.student_lrn || '').trim();

            const secMatch = rSec !== '' && secTokens.has(rSec);
            const lrnMatch = rLrn !== '' && lrnSet.has(rLrn);

            return secMatch || lrnMatch;
          };

          const gToDelete = allGradingSheetRecords.filter(isRecordMatch);
          const remainingGradingSheet = allGradingSheetRecords.filter(r => !gToDelete.some(d => d.id === r.id));

          set({
            gradingSheetRecords: remainingGradingSheet,
          });

          for (const rec of gToDelete) {
            await db.deleteRecord('gradingSheetRecords', rec.id);
          }

          get().showNotification(`Successfully cleared ${gToDelete.length} grade entries from this summary sheet`, 'success');
        } else {
          set({ gradingSheetRecords: [] });
          await db.clearStore('gradingSheetRecords');
          get().showNotification('All grading sheet entries cleared', 'success');
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
