import type { ClassRecord, ObservedValues, HPSRecord } from '../../types';
import { db } from '../../services/database';
import { isSameSubject } from '../../utils/grading-helpers';
import { commitEClassChanges, enqueueGradeWrite, sameGradeScope, type EClassChanges } from '../../services/grade-record-service';

export interface GradingSlice {
  saveEClassChanges: (changes: EClassChanges) => Promise<void>;
  classRecords: ClassRecord[];
  setClassRecords: (records: ClassRecord[]) => void;
  addClassRecord: (record: ClassRecord) => Promise<void>;
  updateClassRecord: (record: ClassRecord) => Promise<void>;
  deleteClassRecord: (id: string) => Promise<void>;

  gradingSheetRecords: ClassRecord[];
  setGradingSheetRecords: (records: ClassRecord[]) => void;
  updateGradingSheetRecord: (record: ClassRecord, options?: { overwriteManualOverride?: boolean }) => Promise<void>;
  bulkUpdateGradingSheetRecords: (records: ClassRecord[]) => Promise<{ updated: number; skippedManualOverrides: number }>;
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
  // Keep each pending row's last committed value, so a failed later edit does
  // not roll back to an earlier draft that also failed to save.
  const pending = new Map<string, { version: number; committed: ClassRecord | HPSRecord | undefined }>();
  let editVersion = 0;
  const slice: GradingSlice = {
    saveEClassChanges: (input) => {
      const changes: EClassChanges = structuredClone(input);
      changes.records = changes.records.map(record => ({ ...record, grade_source: 'eclass_sync' }));
      const version = ++editVersion;
      const edits = [
        ...changes.records.map(record => ({ store: 'classRecords' as const, id: record.id, record })),
        ...(changes.removedRecords || []).filter(record => !changes.records.some(next => next.id === record.id))
          .map(record => ({ store: 'classRecords' as const, id: record.id, record: undefined })),
        ...(changes.hpsRecords || []).map(record => ({ store: 'hpsRecords' as const, id: record.id, record })),
      ];
      for (const edit of edits) {
        const key = `${edit.store}:${edit.id}`;
        const previous = pending.get(key);
        pending.set(key, { version, committed: previous ? previous.committed : get()[edit.store].find((row: { id: string }) => row.id === edit.id) });
        set((state: GradingSlice) => ({
          [edit.store]: [...state[edit.store].filter(row => row.id !== edit.id), ...(edit.record ? [edit.record] : [])],
        }));
      }
      return enqueueGradeWrite(async () => {
        try {
          const gradingSheetRecords = await commitEClassChanges(changes, get().gradingSheetRecords);
          set({ gradingSheetRecords });
          for (const edit of edits) {
            const key = `${edit.store}:${edit.id}`;
            const entry = pending.get(key);
            if (!entry) continue;
            entry.committed = edit.record;
            if (entry.version === version) pending.delete(key);
          }
        } catch (error) {
          for (const edit of edits) {
            const key = `${edit.store}:${edit.id}`;
            const entry = pending.get(key);
            if (!entry || entry.version !== version) continue;
            set((state: GradingSlice) => ({
              [edit.store]: [...state[edit.store].filter(row => row.id !== edit.id), ...(entry.committed ? [entry.committed] : [])],
            }));
            pending.delete(key);
          }
          get().showNotification('The grade changes could not be saved. Please retry.', 'error');
          throw error;
        }
      });
    },
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
      const previousRecords = get().classRecords as ClassRecord[];
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
        set({ classRecords: previousRecords });
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
    updateGradingSheetRecord: async (record, options) => {
      const previousRecords = get().gradingSheetRecords as ClassRecord[];
      try {
        const state = get();
        const currentRecords = state.gradingSheetRecords as ClassRecord[];

        const isMatch = (r: ClassRecord) => {
          if (r.id === record.id && !sameGradeScope(r, record)) throw new Error('This grade identifier belongs to a different academic record. Review it before saving.');
          if (r.id === record.id) return true;
          const sameStudent = r.student_lrn === record.student_lrn || String(r.student_lrn).trim() === String(record.student_lrn).trim();
          const sameSubject = isSameSubject(r.subject_id, r.subject_name, record.subject_id, record.subject_name);
          const sameQuarter = Number(r.quarter) === Number(record.quarter) || String(r.quarter).toLowerCase() === String(record.quarter).toLowerCase();
          const sameSy = r.school_year === record.school_year;
          // Do not consolidate records from different sections. An empty
          // section is treated as a legacy record and may be safely upgraded
          // into the current section-owned record.
          const sameSection = r.section_id === record.section_id;
          return sameStudent && sameSubject && sameQuarter && sameSy && sameSection;
        };

        const matchingOldRecords = currentRecords.filter(isMatch);
        const remainingRecords = currentRecords.filter((r) => !isMatch(r));
        const existingRecord = matchingOldRecords.find((r) => r.id === record.id) || matchingOldRecords[0];

        // An E-Class sync is not permission to undo a teacher's explicit
        // Grade Management decision.  Callers that intentionally replace an
        // override must opt in so the action can be confirmed in their UI.
        if (
          matchingOldRecords.some(candidate => candidate.grade_source === 'manual_override')
          && record.grade_source === 'eclass_sync'
          && !options?.overwriteManualOverride
        ) {
          return;
        }

        // Grade synchronization owns the resolved final grade, not the
        // assessment-level inputs already recorded in Grade Management.
        const recordToPersist: ClassRecord = existingRecord && record.grade_source === 'eclass_sync'
          ? {
              ...existingRecord,
              ...record,
              written_works: existingRecord.written_works,
              performance_tasks: existingRecord.performance_tasks,
              quarterly_exam: existingRecord.quarterly_exam,
            }
          : record;

        await db.commitRecordChanges([{
          store: 'gradingSheetRecords',
          deletes: matchingOldRecords.filter(old => old.id !== recordToPersist.id).map(old => old.id),
          puts: [recordToPersist],
        }]);
        set({ gradingSheetRecords: [...remainingRecords, recordToPersist] });
      } catch (error) {
        console.error('Error updating grading sheet record:', error);
        set({ gradingSheetRecords: previousRecords });
        throw error;
      }
    },
    bulkUpdateGradingSheetRecords: async (records) => {
      if (!records || records.length === 0) return { updated: 0, skippedManualOverrides: 0 };
      const previousRecords = get().gradingSheetRecords as ClassRecord[];
      try {
        const state = get();
        const currentRecords = state.gradingSheetRecords as ClassRecord[];

        const matchesRecord = (existing: ClassRecord, incoming: ClassRecord) => {
          if (existing.id === incoming.id && !sameGradeScope(existing, incoming)) throw new Error('A grade identifier belongs to another academic record. Review the import before saving.');
          const sameStudent = existing.student_lrn === incoming.student_lrn || String(existing.student_lrn).trim() === String(incoming.student_lrn).trim();
          const sameSubject = isSameSubject(existing.subject_id, existing.subject_name, incoming.subject_id, incoming.subject_name);
          const sameQuarter = Number(existing.quarter) === Number(incoming.quarter) || String(existing.quarter).toLowerCase() === String(incoming.quarter).toLowerCase();
          const sameSy = existing.school_year === incoming.school_year;
          const sameSection = existing.section_id === incoming.section_id;
          return sameStudent && sameSubject && sameQuarter && sameSy && sameSection;
        };
        const protectedRecords = records.filter(incoming => incoming.grade_source === 'eclass_sync' && currentRecords.some(existing => existing.grade_source === 'manual_override' && matchesRecord(existing, incoming)));
        const acceptedRecords = records.filter(incoming => !protectedRecords.includes(incoming));
        if (acceptedRecords.length === 0) return { updated: 0, skippedManualOverrides: protectedRecords.length };

        const newRecordMap = new Map<string, ClassRecord>();
        for (const r of acceptedRecords) {
          const key = `${String(r.student_lrn).trim()}_${r.subject_id}_${r.quarter}_${r.school_year || ''}_${r.section_id || ''}`;
          newRecordMap.set(key, r);
        }

        const isOverwritten = (r: ClassRecord) => {
          const key = `${String(r.student_lrn).trim()}_${r.subject_id}_${r.quarter}_${r.school_year || ''}_${r.section_id || ''}`;
          if (newRecordMap.has(key)) return true;
          return acceptedRecords.some((newRec) => matchesRecord(r, newRec));
        };

        const matchingOldRecords = currentRecords.filter(isOverwritten);
        const remainingRecords = currentRecords.filter((r) => !isOverwritten(r));

        await db.commitRecordChanges([{
          store: 'gradingSheetRecords',
          deletes: matchingOldRecords.map(old => old.id),
          puts: acceptedRecords,
        }]);
        set({ gradingSheetRecords: [...remainingRecords, ...acceptedRecords] });
        return { updated: acceptedRecords.length, skippedManualOverrides: protectedRecords.length };
      } catch (error) {
        console.error('Error bulk updating grading sheet records:', error);
        set({ gradingSheetRecords: previousRecords });
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

            return secMatch || (!rSec && lrnMatch);
          };

          const gToDelete = allGradingSheetRecords.filter(isRecordMatch);
          const remainingGradingSheet = allGradingSheetRecords.filter(r => !gToDelete.some(d => d.id === r.id));

          await db.commitRecordChanges([{ store: 'gradingSheetRecords', deletes: gToDelete.map(record => record.id) }]);
          set({ gradingSheetRecords: remainingGradingSheet });

          get().showNotification(`Successfully cleared ${gToDelete.length} grade entries from this summary sheet`, 'success');
        } else {
          await db.clearStore('gradingSheetRecords');
          set({ gradingSheetRecords: [] });
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
  // Direct grades and E-Class commands share ordering within this application.
  const updateOfficial = slice.updateGradingSheetRecord;
  slice.updateGradingSheetRecord = (record, options) => enqueueGradeWrite(() => updateOfficial(record, options));
  const updateOfficialBulk = slice.bulkUpdateGradingSheetRecords;
  slice.bulkUpdateGradingSheetRecords = records => enqueueGradeWrite(() => updateOfficialBulk(records));
  const deleteOfficial = slice.deleteGradingSheetRecord;
  slice.deleteGradingSheetRecord = id => enqueueGradeWrite(() => deleteOfficial(id));
  const clearOfficial = slice.clearGradingSheet;
  slice.clearGradingSheet = (...args) => enqueueGradeWrite(() => clearOfficial(...args));
  return slice;
}
