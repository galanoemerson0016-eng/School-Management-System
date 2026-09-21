/**
 * App Store (Offline-First with Local Database)
 * 
 * This store manages all application state and persists data to IndexedDB.
 * No Firebase or cloud dependencies - everything is local.
 */

import { create } from 'zustand';
import type { SchoolProfile, Student, Section, Subject, Announcement, ClassRecord, Enrollment, SchoolYear, ObservedValues, HPSRecord, SF2Sheet, User, AttendanceRecord } from '../types';
import { db } from '../services/database';
import { backup } from '../services/backup';
import { normalizeSubjectName } from '../lib/subjectConfig';
import { STANDARD_SUBJECTS, getDefaultTermForSubject, isGrade11CoreSubject } from '../lib/curriculum';
import { normalizeGrade12PESubjectName } from '../utils/grading-helpers';
import { getCurriculumPreset } from '../lib/curriculumPresets';
import { reconcileOrphanedGradesAndSubjects, generateDeterministicSubjectId } from '../utils/grade-reconciliation';
import { purgeGhostEinsteinData } from '../utils/ghost-data-purge';
import { isTestSection, isTestStudent } from '../utils/testSectionGuards';
import {
  buildAttendanceRecordsFromSf2Sheet,
  buildAutoFilledDateLabels,
  buildSf2SheetAttendanceFromRecords,
  getSf2MonthContext,
} from '../utils/sf2-sync';
import { createGradingSlice, type GradingSlice } from './slices/grading-slice';
import { createAttendanceSlice, type AttendanceSlice } from './slices/attendance-slice';
import { createAnnouncementsSlice, type AnnouncementsSlice } from './slices/announcements-slice';

export interface ProfileDiffItem {
  fieldName: string;
  label: string;
  currentValue: string;
  incomingValue: string;
  keepIncoming: boolean;
}

export interface ProfileMergeConflict {
  studentName: string;
  lrn: string;
  diffItems: ProfileDiffItem[];
  resolve: (mergedFields: Record<string, string> | null) => void;
}

const CURRENT_VIEW_STORAGE_KEY = 'formease-current-view';
const SELECTED_SECTION_STORAGE_KEY = 'formease-selected-section';
const SF2_ATTENDANCE_REPAIR_KEY = 'formease-sf2-attendance-repair-v1';

function getLocalStorageValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setLocalStorageValue(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures (private mode or blocked storage).
  }
}

function removeLocalStorageValue(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures (private mode or blocked storage).
  }
}

function getSf2DatesForSheet(sheet: SF2Sheet): string[] {
  const monthIndexByName: Record<string, number> = {
    JANUARY: 0, FEBRUARY: 1, MARCH: 2, APRIL: 3, MAY: 4, JUNE: 5,
    JULY: 6, AUGUST: 7, SEPTEMBER: 8, OCTOBER: 9, NOVEMBER: 10, DECEMBER: 11,
  };
  const monthIndex = monthIndexByName[sheet.month];
  if (monthIndex === undefined) return [];

  const [startYear, endYear] = sheet.school_year.split('-').map(Number);
  const year = monthIndex >= 5 ? startYear : endYear;
  return Object.values(sheet.date_labels || {})
    .map((label) => String(label || '').trim())
    .filter((label) => /^\d{1,2}$/.test(label))
    .map((dayLabel) => `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(Number(dayLabel)).padStart(2, '0')}`);
}

function reconcileAttendanceAndSf2Data(
  attendanceRecords: AttendanceRecord[],
  sf2Sheets: SF2Sheet[],
  activeSchoolYear: string,
): { attendanceRecords: AttendanceRecord[]; sf2Sheets: SF2Sheet[] } {
  const attendanceById = new Map(attendanceRecords.map((record) => [record.id, record]));

  for (const sheet of sf2Sheets) {
    const sheetDates = new Set(getSf2DatesForSheet(sheet));
    for (const record of [...attendanceById.values()]) {
      if (record.section_id === sheet.section_id && sheetDates.has(record.date)) {
        attendanceById.delete(record.id);
      }
    }
    for (const record of buildAttendanceRecordsFromSf2Sheet(sheet)) {
      attendanceById.set(record.id, record);
    }
  }

  const mergedAttendanceRecords = [...attendanceById.values()].sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    const sectionCmp = (a.section_id || '').localeCompare(b.section_id || '');
    if (sectionCmp !== 0) return sectionCmp;
    return a.student_lrn.localeCompare(b.student_lrn);
  });

  const sheetMap = new Map<string, SF2Sheet>();
  for (const sheet of sf2Sheets) {
    sheetMap.set(sheet.id, sheet);
  }

  const groupedRecords = new Map<string, {
    sectionId: string;
    schoolYear: string;
    month: string;
    records: AttendanceRecord[];
  }>();
  for (const record of mergedAttendanceRecords) {
    if (!record.section_id) continue;
    const context = getSf2MonthContext(record.date, activeSchoolYear);
    if (!context) continue;
    const sheetId = `${record.section_id}_${activeSchoolYear}_${context.month}`;
    const group = groupedRecords.get(sheetId) || {
      sectionId: record.section_id,
      schoolYear: activeSchoolYear,
      month: context.month,
      records: [],
    };
    group.records.push(record);
    groupedRecords.set(sheetId, group);
  }

  // Start from persisted sheets so an intentionally blank month is not lost
  // during startup reconciliation.
  const repairedSheets = new Map(sheetMap);
  for (const [sheetId, group] of groupedRecords.entries()) {
    const existing = sheetMap.get(sheetId);
    if (!existing) {
      const baseSheet: SF2Sheet = {
        id: sheetId,
        section_id: group.sectionId,
        school_year: group.schoolYear,
        month: group.month,
        date_labels: buildAutoFilledDateLabels(group.month, group.schoolYear, localStorage.getItem('formease_sf2_include_saturdays') === 'true'),
        attendance: {},
        remarks: {},
        updated_at: new Date().toISOString(),
      };
      repairedSheets.set(sheetId, buildSf2SheetAttendanceFromRecords(baseSheet, group.records));
      continue;
    }
    repairedSheets.set(sheetId, buildSf2SheetAttendanceFromRecords(existing, group.records));
  }

  return {
    attendanceRecords: mergedAttendanceRecords,
    sf2Sheets: [...repairedSheets.values()],
  };
}

interface AppState extends GradingSlice, AttendanceSlice, AnnouncementsSlice {
  // School profile
  schoolProfile: SchoolProfile;
  setSchoolProfile: (profile: SchoolProfile) => void;
  updateSchoolProfile: (profile: SchoolProfile) => Promise<void>;

  // Active school year
  activeSchoolYear: string;
  setActiveSchoolYear: (sy: string, persist?: boolean) => void;
  schoolYears: SchoolYear[];
  setSchoolYears: (schoolYears: SchoolYear[]) => void;
  createSchoolYear: (sy: string) => Promise<void>;
  legacySchoolYear: string;
  setLegacySchoolYear: (sy: string) => void;

  // Students
  students: Student[];
  setStudents: (students: Student[]) => void;
  studentProfiles: Student[];
  setStudentProfiles: (students: Student[]) => void;
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (lrn: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (lrn: string) => Promise<void>;
  importStudentsFromSF1: (students: Student[], sectionName: string) => Promise<number>;
  bulkAddStudents: (students: Student[]) => Promise<void>;
  clearSection: (sectionName: string) => Promise<void>;

  // Sections
  sections: Section[];
  setSections: (sections: Section[]) => void;
  addSection: (section: Section) => Promise<void>;
  updateSection: (section: Section) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;

  // Subjects
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => void;
  addSubject: (subject: Subject) => Promise<void>;
  updateSubject: (subject: Subject) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  deleteSubjectsBulk: (ids: string[]) => Promise<void>;

  // Enrollments
  enrollments: Enrollment[];
  setEnrollments: (enrollments: Enrollment[]) => void;
  addEnrollment: (enrollment: Enrollment) => Promise<void>;
  promoteStudentsFromYear: (sourceSchoolYear: string, sourceGradeLevel: string, targetSectionId: string) => Promise<number>;
  enrollReturningStudent: (lrn: string, targetSectionId: string) => Promise<void>;

  // Teachers (Users)
  teachers: User[];
  setTeachers: (teachers: User[]) => void;

  // SF9 Layout Settings (Local for now, or save to profile?)
  sf9Layout: {
    fontSize: number;
    cellPadding: number;
    gradesTable: {
      subject: string;
      qtr: string;
      final: string;
      remarks: string;
    };
    valuesTable: {
      valueName: string;
      behavior: string;
      marking: string;
    };
  };
  setSF9Layout: (layout: AppState['sf9Layout']) => void;

  // UI State
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  selectedSection: string | null;
  setSelectedSection: (section: string | null) => void;
  selectedSubject: string | null;
  setSelectedSubject: (subject: string | null) => void;

  // Sync State
  isSyncReady: boolean;
  setSyncReady: (ready: boolean) => void;

  // Notifications
  notification: {
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  };
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideNotification: () => void;

  // Cloud Sync Settings
  cloudSyncEnabled: boolean;
  setCloudSyncEnabled: (enabled: boolean) => void;

  // Merge Conflicts Visual Diff
  pendingConflicts: ProfileMergeConflict[];
  addMergeConflict: (conflict: ProfileMergeConflict) => void;
  resolveMergeConflict: (mergedFields: Record<string, string> | null) => void;

  // Backup & Restore
  createBackup: (label?: string) => Promise<void>;
  restoreFromFile: (file: File) => Promise<void>;
  listBackups: () => Promise<void>;
  lastBackupTime: number | null;
  setLastBackupTime: (time: number | null) => void;
  dbWritePendingCount: number;
}

const defaultSchoolProfile: SchoolProfile = {
  school_id: '',
  name: '',
  region: '',
  division: '',
  district: '',
  head_name: '',
  head_position: '',
  grade_levels_offered: '',
  municipality: '',
  city: '',
  province: '',
  adviser_name: '',
  grade_level: '',
  section: '',
  adviser_image_url: '',
  is_activated: false,
  is_trial: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...createGradingSlice(set, get),
  ...createAttendanceSlice(set, get),
  ...createAnnouncementsSlice(set, get),

  // ==================== UI THEME ====================
  theme: (getLocalStorageValue('formease-theme') as 'light' | 'dark' | 'system') || 'system',
  setTheme: (theme) => {
    set({ theme });
    setLocalStorageValue('formease-theme', theme);
  },

  // ==================== SCHOOL PROFILE ====================
  schoolProfile: defaultSchoolProfile,
  setSchoolProfile: (profile) => set({ schoolProfile: profile ? { ...profile, division: (profile.division || '').replace(/schools division office of/i, '').replace(/schools division of/i, '').replace(/division of/i, '').trim() } : profile }),
  updateSchoolProfile: async (profile) => {
    try {
      const currentProfile = get().schoolProfile;
      const updated = { ...currentProfile, ...profile };
      if (updated.division) {
        updated.division = updated.division.replace(/schools division office of/i, '').replace(/schools division of/i, '').replace(/division of/i, '').trim();
      }
      // If the school_id changed, delete the old record first so we don't
      // leave a stale default entry (e.g. '123456') sitting in IndexedDB.
      if (currentProfile.school_id && currentProfile.school_id !== updated.school_id) {
        await db.deleteRecord('schoolProfile', currentProfile.school_id);
      }

      set({ schoolProfile: updated });
      await db.putRecord('schoolProfile', updated);

      if (updated.adviser_name && updated.adviser_name.trim() && updated.adviser_name.toLowerCase() !== 'admin') {
        const newAdv = updated.adviser_name.trim();
        const currentSections = get().sections;
        let anySectionSynced = false;
        const updatedSections = currentSections.map(sec => {
          if (sec.is_advisory) {
            const cName = (sec.adviser_name || '').trim();
            const isMock = !cName ||
                           cName.toLowerCase().includes('maria') ||
                           cName.toLowerCase().includes('santos') ||
                           cName.toLowerCase().includes('juan') ||
                           cName.toLowerCase().includes('recovered') ||
                           cName.toLowerCase() === 'tba' ||
                           (sec.adviser_id && sec.adviser_id.startsWith('adv-'));
            if (isMock || cName === currentProfile.adviser_name) {
              anySectionSynced = true;
              return { ...sec, adviser_name: newAdv };
            }
          }
          return sec;
        });
        if (anySectionSynced) {
          set({ sections: updatedSections });
          void db.putRecordsBulk('sections', updatedSections).catch(e => console.error('Failed to sync advisory sections on profile update:', e));
        }
      }

      get().showNotification('School profile updated', 'success');
    } catch (error) {
      console.error('Error updating school profile:', error);
      get().showNotification('Failed to update school profile', 'error');
      throw error;
    }
  },

  // ==================== SCHOOL YEAR ====================
  activeSchoolYear: '2026-2027',
  setActiveSchoolYear: (sy, persist = true) => {
    set({ activeSchoolYear: sy });
    if (persist) {
      localStorage.setItem('activeSchoolYear', sy);
    }
  },
  schoolYears: [],
  setSchoolYears: (schoolYears) => set({ schoolYears }),
  createSchoolYear: async (sy) => {
    const normalized = sy.trim();
    const match = normalized.match(/^(\d{4})-(\d{4})$/);
    if (!match) {
      get().showNotification('Invalid school year format. Use YYYY-YYYY.', 'error');
      throw new Error('Invalid school year format');
    }

    const startYear = Number(match[1]);
    const endYear = Number(match[2]);
    if (endYear !== startYear + 1) {
      get().showNotification('Invalid school year range. Example: 2026-2027.', 'error');
      throw new Error('Invalid school year range');
    }

    const timestamp = new Date().toISOString();
    const newSchoolYear: SchoolYear = {
      sy_id: normalized,
      label: normalized,
      is_active: true,
      start_date: `${startYear}-06-01`,
      end_date: `${endYear}-03-31`,
      is_locked: false,
      created_at: timestamp,
      updated_at: timestamp,
    };

    set((state) => ({
      schoolYears: [...state.schoolYears, newSchoolYear].sort((a, b) => b.label.localeCompare(a.label)),
      activeSchoolYear: normalized,
    }));

    get().showNotification(`School year ${normalized} created.`, 'success');
  },
  legacySchoolYear: '2026-2027',
  setLegacySchoolYear: (sy) => set({ legacySchoolYear: sy }),

  // ==================== MERGE CONFLICTS ====================
  pendingConflicts: [],
  addMergeConflict: (conflict) => set((state) => ({ pendingConflicts: [...state.pendingConflicts, conflict] })),
  resolveMergeConflict: (mergedFields) => {
    const current = get().pendingConflicts[0];
    if (current) {
      current.resolve(mergedFields);
      set((state) => ({ pendingConflicts: state.pendingConflicts.slice(1) }));
    }
  },

  // ==================== STUDENTS ====================
  students: [],
  setStudents: (students) => set({ students }),
  studentProfiles: [],
  setStudentProfiles: (students) => set({ studentProfiles: students }),
  addStudent: async (student) => {
    try {
      set((state) => ({ students: [...state.students, student] }));
      await db.putRecord('students', student);
      get().showNotification('Student added successfully', 'success');
    } catch (error) {
      console.error('Error adding student:', error);
      get().showNotification('Failed to add student', 'error');
      set((state) => ({ students: state.students.filter((s) => s.lrn !== student.lrn) }));
      throw error;
    }
  },
  updateStudent: async (lrn, updates) => {
    try {
      const existing = get().students.find((s) => s.lrn === lrn);
      if (!existing) throw new Error('Student not found');

      let updated = { ...existing, ...updates };
      const lrnChanged = updated.lrn !== lrn;

      if (lrnChanged) {
        // Cascade update in AwardEvaluations (nested array in Student object)
        if (updated.awardEvaluations) {
          updated = {
            ...updated,
            awardEvaluations: updated.awardEvaluations.map((ae) => ({
              ...ae,
              student_lrn: updated.lrn,
              id: ae.id.replace(lrn, updated.lrn),
            })),
          };
        }

        // 1. Database (IndexedDB) Updates
        // Delete old student record
        await db.deleteRecord('students', lrn);

        // Cascade to enrollments
        const enrollmentsToUpdate = await db.getRecordsByIndex<Enrollment>('enrollments', 'by-student-lrn', lrn);
        for (const e of enrollmentsToUpdate) {
          await db.deleteRecord('enrollments', e.id);
          const newId = e.id.replace(lrn, updated.lrn);
          const newE = { ...e, id: newId, student_lrn: updated.lrn };
          await db.putRecord('enrollments', newE);
        }

        // Cascade to classRecords
        const classRecordsToUpdate = await db.getRecordsByIndex<ClassRecord>('classRecords', 'by-student-lrn', lrn);
        for (const r of classRecordsToUpdate) {
          await db.deleteRecord('classRecords', r.id);
          const newId = r.id.replace(lrn, updated.lrn);
          const newR = { ...r, id: newId, student_lrn: updated.lrn };
          await db.putRecord('classRecords', newR);
        }

        // Cascade to gradingSheetRecords
        const gradingSheetRecordsToUpdate = await db.getRecordsByIndex<ClassRecord>('gradingSheetRecords', 'by-student-lrn', lrn);
        for (const r of gradingSheetRecordsToUpdate) {
          await db.deleteRecord('gradingSheetRecords', r.id);
          const newId = r.id.replace(lrn, updated.lrn);
          const newR = { ...r, id: newId, student_lrn: updated.lrn };
          await db.putRecord('gradingSheetRecords', newR);
        }

        // Cascade to attendanceRecords
        const attendanceRecordsToUpdate = await db.getRecordsByIndex<AttendanceRecord>('attendanceRecords', 'by-student-lrn', lrn);
        for (const r of attendanceRecordsToUpdate) {
          await db.deleteRecord('attendanceRecords', r.id);
          const newId = r.id.replace(lrn, updated.lrn);
          const newR = { ...r, id: newId, student_lrn: updated.lrn };
          await db.putRecord('attendanceRecords', newR);
        }

        // Cascade to observedValues
        const observedValuesToUpdate = await db.getRecordsByIndex<ObservedValues>('observedValues', 'by-student-lrn', lrn);
        for (const v of observedValuesToUpdate) {
          await db.deleteRecord('observedValues', v.id);
          const newId = v.id.replace(lrn, updated.lrn);
          const newV = { ...v, id: newId, student_lrn: updated.lrn };
          await db.putRecord('observedValues', newV);
        }

        // Cascade to sf2Sheets
        const allSf2Sheets = await db.getAllRecords<SF2Sheet>('sf2Sheets');
        for (const sheet of allSf2Sheets) {
          let changed = false;
          const attendance = { ...sheet.attendance };
          const remarks = { ...sheet.remarks };
          if (attendance[lrn]) {
            attendance[updated.lrn] = attendance[lrn];
            delete attendance[lrn];
            changed = true;
          }
          if (remarks[lrn]) {
            remarks[updated.lrn] = remarks[lrn];
            delete remarks[lrn];
            changed = true;
          }
          if (changed) {
            const newSheet = { ...sheet, attendance, remarks };
            await db.putRecord('sf2Sheets', newSheet);
          }
        }

        // 2. Zustand Store State Updates
        set((state) => ({
          students: state.students.map((s) => (s.lrn === lrn ? updated : s)),
          studentProfiles: state.studentProfiles.map((s) => (s.lrn === lrn ? updated : s)),
          enrollments: state.enrollments.map((e) =>
            e.student_lrn === lrn ? { ...e, id: e.id.replace(lrn, updated.lrn), student_lrn: updated.lrn } : e
          ),
          classRecords: state.classRecords.map((r) =>
            r.student_lrn === lrn ? { ...r, id: r.id.replace(lrn, updated.lrn), student_lrn: updated.lrn } : r
          ),
          gradingSheetRecords: state.gradingSheetRecords.map((r) =>
            r.student_lrn === lrn ? { ...r, id: r.id.replace(lrn, updated.lrn), student_lrn: updated.lrn } : r
          ),
          attendanceRecords: state.attendanceRecords.map((r) =>
            r.student_lrn === lrn ? { ...r, id: r.id.replace(lrn, updated.lrn), student_lrn: updated.lrn } : r
          ),
          observedValues: state.observedValues.map((v) =>
            v.student_lrn === lrn ? { ...v, id: v.id.replace(lrn, updated.lrn), student_lrn: updated.lrn } : v
          ),
        }));

        // Update activeSF2Sheet if it is currently loaded in store and matches
        const activeSheet = get().activeSF2Sheet;
        if (activeSheet) {
          let changed = false;
          const attendance = { ...activeSheet.attendance };
          const remarks = { ...activeSheet.remarks };
          if (attendance[lrn]) {
            attendance[updated.lrn] = attendance[lrn];
            delete attendance[lrn];
            changed = true;
          }
          if (remarks[lrn]) {
            remarks[updated.lrn] = remarks[lrn];
            delete remarks[lrn];
            changed = true;
          }
          if (changed) {
            set({ activeSF2Sheet: { ...activeSheet, attendance, remarks } });
          }
        }
      } else {
        // Normal update (no LRN change)
        set((state) => ({
          students: state.students.map((s) => (s.lrn === lrn ? updated : s)),
          studentProfiles: state.studentProfiles.map((s) => (s.lrn === lrn ? updated : s)),
        }));
      }

      await db.putRecord('students', updated);
      get().showNotification('Student updated', 'success');
    } catch (error) {
      console.error('Error updating student:', error);
      get().showNotification('Failed to update student', 'error');
      throw error;
    }
  },
  deleteStudent: async (lrn) => {
    const previousStudents = get().students;
    const previousClassRecords = get().classRecords;
    const previousGradingSheetRecords = get().gradingSheetRecords;
    const previousEnrollments = get().enrollments;
    const previousAttendanceRecords = get().attendanceRecords;
    try {
      // 1. Delete student
      await db.deleteRecord('students', lrn);

      // 2. Cascade delete from classRecords
      const matchingClassRecs = previousClassRecords.filter(r => r.student_lrn === lrn);
      for (const rec of matchingClassRecs) {
        await db.deleteRecord('classRecords', rec.id);
      }

      // 3. Cascade delete from gradingSheetRecords
      const matchingGradingRecs = previousGradingSheetRecords.filter(r => r.student_lrn === lrn);
      for (const rec of matchingGradingRecs) {
        await db.deleteRecord('gradingSheetRecords', rec.id);
      }

      // 4. Cascade delete from enrollments
      const matchingEnrollments = previousEnrollments.filter(r => r.student_lrn === lrn);
      for (const rec of matchingEnrollments) {
        await db.deleteRecord('enrollments', rec.id);
      }

      // 5. Cascade delete from attendanceRecords
      const matchingAttendance = previousAttendanceRecords.filter(r => r.student_lrn === lrn);
      for (const rec of matchingAttendance) {
        await db.deleteRecord('attendanceRecords', rec.id);
      }

      set((state) => ({
        students: state.students.filter((s) => s.lrn !== lrn),
        classRecords: state.classRecords.filter((r) => r.student_lrn !== lrn),
        gradingSheetRecords: state.gradingSheetRecords.filter((r) => r.student_lrn !== lrn),
        enrollments: state.enrollments.filter((r) => r.student_lrn !== lrn),
        attendanceRecords: state.attendanceRecords.filter((r) => r.student_lrn !== lrn),
      }));

      get().showNotification('Student and associated records deleted', 'success');
    } catch (error) {
      console.error('Error deleting student:', error);
      set({
        students: previousStudents,
        classRecords: previousClassRecords,
        gradingSheetRecords: previousGradingSheetRecords,
        enrollments: previousEnrollments,
        attendanceRecords: previousAttendanceRecords,
      });
      get().showNotification('Failed to delete student', 'error');
      throw error;
    }
  },
  importStudentsFromSF1: async (students, sectionName) => {
    void sectionName;
    try {
      let count = 0;
      const validStudents = students.filter(s => s && s.lrn);
      
      const existingStudents = await db.getAllRecords<Student>('students');
      
      for (const student of validStudents) {
        // 1. Check if LRN already exists
        const matchByLrn = existingStudents.find(s => s.lrn === student.lrn);
        
        // 2. Check if Name + Gender matches (but ONLY if the existing record in database has a temporary LRN)
        const matchByName = existingStudents.find(s => 
          s.lrn.startsWith('TEMP-') &&
          s.last_name?.trim().toUpperCase() === student.last_name?.trim().toUpperCase() &&
          s.first_name?.trim().toUpperCase() === student.first_name?.trim().toUpperCase() &&
          (s.middle_name || '').trim().toUpperCase() === (student.middle_name || '').trim().toUpperCase() &&
          (s.name_extension || '').trim().toUpperCase() === (student.name_extension || '').trim().toUpperCase() &&
          s.gender === student.gender
        );

        const existing = matchByLrn || matchByName;
        let resolvedStudent = { ...student };

        if (existing) {
          // Compare fields to see if we have differences
          const diffItems: ProfileDiffItem[] = [];
          const fieldsToCompare = [
            { field: 'first_name', label: 'First Name' },
            { field: 'middle_name', label: 'Middle Name' },
            { field: 'last_name', label: 'Last Name' },
            { field: 'name_extension', label: 'Name Extension' },
            { field: 'gender', label: 'Gender' },
            { field: 'birth_date', label: 'Birth Date' },
            { field: 'address', label: 'Address' },
            { field: 'contact_number', label: 'Contact Number' },
            { field: 'guardian_name', label: 'Guardian/Parent Name' }
          ];

          for (const item of fieldsToCompare) {
            const currentVal = String((existing as unknown as Record<string, unknown>)[item.field] || '').trim();
            const incomingVal = String((student as unknown as Record<string, unknown>)[item.field] || '').trim();
            if (currentVal !== incomingVal) {
              diffItems.push({
                fieldName: item.field,
                label: item.label,
                currentValue: currentVal,
                incomingValue: incomingVal,
                keepIncoming: true
              });
            }
          }

          if (diffItems.length > 0) {
            const mergedFields = await new Promise<Record<string, string> | null>((resolve) => {
              get().addMergeConflict({
                studentName: `${student.first_name} ${student.last_name}`,
                lrn: student.lrn,
                diffItems,
                resolve
              });
            });

            if (mergedFields === null) {
              // User chose to skip importing this student entirely
              continue;
            }

            // Apply selected merged fields
            resolvedStudent = {
              ...student,
              ...mergedFields
            };
          }

          // If LRN has changed (e.g. upgraded from TEMP- or corrected), delete the old record from IndexedDB and cascade LRN update
          if (existing.lrn !== resolvedStudent.lrn) {
            const oldLrn = existing.lrn;
            const newLrn = resolvedStudent.lrn;

            await db.deleteRecord('students', oldLrn);

            // Cascade to enrollments
            const enrollmentsToUpdate = await db.getRecordsByIndex<Enrollment>('enrollments', 'by-student-lrn', oldLrn);
            for (const e of enrollmentsToUpdate) {
              await db.deleteRecord('enrollments', e.id);
              const newId = e.id.replace(oldLrn, newLrn);
              const newE = { ...e, id: newId, student_lrn: newLrn };
              await db.putRecord('enrollments', newE);
            }

            // Cascade to classRecords
            const classRecordsToUpdate = await db.getRecordsByIndex<ClassRecord>('classRecords', 'by-student-lrn', oldLrn);
            for (const r of classRecordsToUpdate) {
              await db.deleteRecord('classRecords', r.id);
              const newId = r.id.replace(oldLrn, newLrn);
              const newR = { ...r, id: newId, student_lrn: newLrn };
              await db.putRecord('classRecords', newR);
            }

            // Cascade to gradingSheetRecords
            const gradingSheetRecordsToUpdate = await db.getRecordsByIndex<ClassRecord>('gradingSheetRecords', 'by-student-lrn', oldLrn);
            for (const r of gradingSheetRecordsToUpdate) {
              await db.deleteRecord('gradingSheetRecords', r.id);
              const newId = r.id.replace(oldLrn, newLrn);
              const newR = { ...r, id: newId, student_lrn: newLrn };
              await db.putRecord('gradingSheetRecords', newR);
            }

            // Cascade to attendanceRecords
            const attendanceRecordsToUpdate = await db.getRecordsByIndex<AttendanceRecord>('attendanceRecords', 'by-student-lrn', oldLrn);
            for (const r of attendanceRecordsToUpdate) {
              await db.deleteRecord('attendanceRecords', r.id);
              const newId = r.id.replace(oldLrn, newLrn);
              const newR = { ...r, id: newId, student_lrn: newLrn };
              await db.putRecord('attendanceRecords', newR);
            }

            // Cascade to observedValues
            const observedValuesToUpdate = await db.getRecordsByIndex<ObservedValues>('observedValues', 'by-student-lrn', oldLrn);
            for (const v of observedValuesToUpdate) {
              await db.deleteRecord('observedValues', v.id);
              const newId = v.id.replace(oldLrn, newLrn);
              const newV = { ...v, id: newId, student_lrn: newLrn };
              await db.putRecord('observedValues', newV);
            }

            // Cascade to sf2Sheets
            const allSf2Sheets = await db.getAllRecords<SF2Sheet>('sf2Sheets');
            for (const sheet of allSf2Sheets) {
              let changed = false;
              const attendance = { ...sheet.attendance };
              const remarks = { ...sheet.remarks };
              if (attendance[oldLrn]) {
                attendance[newLrn] = attendance[oldLrn];
                delete attendance[oldLrn];
                changed = true;
              }
              if (remarks[oldLrn]) {
                remarks[newLrn] = remarks[oldLrn];
                delete remarks[oldLrn];
                changed = true;
              }
              if (changed) {
                const newSheet = { ...sheet, attendance, remarks };
                await db.putRecord('sf2Sheets', newSheet);
              }
            }

            // Update local state arrays for this student to keep UI fully in sync
            set((state) => ({
              enrollments: state.enrollments.map((e) =>
                e.student_lrn === oldLrn ? { ...e, id: e.id.replace(oldLrn, newLrn), student_lrn: newLrn } : e
              ),
              classRecords: state.classRecords.map((r) =>
                r.student_lrn === oldLrn ? { ...r, id: r.id.replace(oldLrn, newLrn), student_lrn: newLrn } : r
              ),
              gradingSheetRecords: state.gradingSheetRecords.map((r) =>
                r.student_lrn === oldLrn ? { ...r, id: r.id.replace(oldLrn, newLrn), student_lrn: newLrn } : r
              ),
              attendanceRecords: state.attendanceRecords.map((r) =>
                r.student_lrn === oldLrn ? { ...r, id: r.id.replace(oldLrn, newLrn), student_lrn: newLrn } : r
              ),
              observedValues: state.observedValues.map((v) =>
                v.student_lrn === oldLrn ? { ...v, id: v.id.replace(oldLrn, newLrn), student_lrn: newLrn } : v
              ),
            }));

            const activeSheet = get().activeSF2Sheet;
            if (activeSheet) {
              let changed = false;
              const attendance = { ...activeSheet.attendance };
              const remarks = { ...activeSheet.remarks };
              if (attendance[oldLrn]) {
                attendance[newLrn] = attendance[oldLrn];
                delete attendance[oldLrn];
                changed = true;
              }
              if (remarks[oldLrn]) {
                remarks[newLrn] = remarks[oldLrn];
                delete remarks[oldLrn];
                changed = true;
              }
              if (changed) {
                set({ activeSF2Sheet: { ...activeSheet, attendance, remarks } });
              }
            }
          }

          // Merge: Keep custom fields from existing, but update all profile fields from the imported student
          let merged = {
            ...existing,
            ...resolvedStudent,
            lrn: resolvedStudent.lrn,
            grade_level: resolvedStudent.grade_level,
            student_section: resolvedStudent.student_section
          };

          // If nested awardEvaluations exist, update their IDs/LRNs as well
          if (existing.lrn !== resolvedStudent.lrn && existing.awardEvaluations) {
            merged = {
              ...merged,
              awardEvaluations: existing.awardEvaluations.map((ae) => ({
                ...ae,
                student_lrn: resolvedStudent.lrn,
                id: ae.id.replace(existing.lrn, resolvedStudent.lrn),
              })),
            };
          }

          await db.putRecord('students', merged);
        } else {
          // Brand new student: write as is
          await db.putRecord('students', resolvedStudent);
        }
        count++;
      }
      
      // Update local state so UI refreshes
      const allStudents = await db.getAllRecords<Student>('students');
      set({ students: allStudents, studentProfiles: allStudents });
      
      get().showNotification(`${count} students imported`, 'success');
      return count;
    } catch (error) {
      console.error('Error importing students:', error);
      throw error;
    }
  },
  bulkAddStudents: async (newStudents) => {
    try {
      await db.putRecordsBulk('students', newStudents);
      const allStudents = await db.getAllRecords<Student>('students');
      set({ students: allStudents, studentProfiles: allStudents });
      get().showNotification(`${newStudents.length} students added successfully`, 'success');
    } catch (error) {
      console.error('Error in bulkAddStudents:', error);
      get().showNotification('Failed to add students in bulk', 'error');
      throw error;
    }
  },
  clearSection: async (sectionName) => {
    try {
      const studentsInSection = get().students.filter((s) => s.student_section === sectionName);
      
      for (const student of studentsInSection) {
        await db.deleteRecord('students', student.lrn);
      }

      set((state) => ({
        students: state.students.filter((s) => s.student_section !== sectionName),
        studentProfiles: state.studentProfiles.filter((s) => s.student_section !== sectionName),
      }));
      
      get().showNotification(`Section ${sectionName} cleared successfully`, 'success');
    } catch (error) {
      console.error('Error clearing section:', error);
      get().showNotification('Failed to clear section', 'error');
      throw error;
    }
  },

  // ==================== SECTIONS ====================
  sections: [],
  setSections: (sections) => set({ sections }),
  addSection: async (section) => {
    try {
      let sectionToSave = section;
      // If advisory and taught_subjects is empty or missing, auto-populate from existing DB subjects
      if (section.is_advisory && (!section.taught_subjects || section.taught_subjects.length === 0)) {
        let gradeSubjects = get().subjects
          .filter(s => s.grade_level === section.section_grade_level && !s.is_teaching_load && (!s.section_id || s.section_id === section.id))
          .map(s => s.subject_name);
        const gNum = parseInt(section.section_grade_level?.replace(/\D/g, '') || '0');
        if (gNum === 11) {
          // For Grade 11: ONLY universal Core subjects default when taught_subjects is empty
          gradeSubjects = gradeSubjects.filter(name => isGrade11CoreSubject(name));
        } else if (gNum === 12) {
          gradeSubjects = [];
        }
        if (gradeSubjects.length === 0) {
          const preset = getCurriculumPreset(section.section_grade_level, section.track, section.cluster || section.strand, section.program || 'Regular');
          if (preset && preset.subjects.length > 0) {
            gradeSubjects = (gNum === 11)
              ? preset.subjects.filter(s => isGrade11CoreSubject(s.name)).map(s => s.name)
              : preset.subjects.map(s => s.name);
          }
        }
        if (gradeSubjects.length > 0) {
          sectionToSave = { ...section, taught_subjects: gradeSubjects };
        }
      }
      set((state) => ({ sections: [...state.sections, sectionToSave] }));
      await db.putRecord('sections', sectionToSave);
      get().showNotification('Section added', 'success');
    } catch (error) {
      console.error('Error adding section:', error);
      get().showNotification('Failed to add section', 'error');
      set((state) => ({ sections: state.sections.filter((s) => s.id !== section.id) }));
      throw error;
    }
  },
  updateSection: async (section) => {
    let sectionToUpdate = section;
    if (section.is_advisory && (!section.taught_subjects || section.taught_subjects.length === 0)) {
      const gNum = parseInt(section.section_grade_level?.replace(/\D/g, '') || '0');
      const preset = getCurriculumPreset(section.section_grade_level, section.track, section.cluster || section.strand, section.program || 'Regular');
      if (preset && preset.subjects.length > 0) {
        const gradeSubjects = (gNum === 11)
          ? preset.subjects.filter(s => isGrade11CoreSubject(s.name)).map(s => s.name)
          : preset.subjects.map(s => s.name);
        if (gradeSubjects.length > 0) {
          sectionToUpdate = { ...section, taught_subjects: gradeSubjects };
        }
      }
    }
    const oldSection = get().sections.find((s) => s.id === sectionToUpdate.id);
    const oldName = oldSection?.section_name;
    const newName = section.section_name;
    const nameChanged = oldName && oldName !== newName;

    try {
      set((state) => ({
        sections: state.sections.map((s) => (s.id === sectionToUpdate.id ? sectionToUpdate : s)),
      }));
      await db.putRecord('sections', sectionToUpdate);

      if (nameChanged) {
        // Cascade changes to students list
        const updatedStudents = get().students.map((student) => {
          if (student.student_section === oldName || student.student_section === section.id) {
            return { ...student, student_section: newName };
          }
          return student;
        });

        const studentsToUpdate = get().students
          .filter((s) => s.student_section === oldName || s.student_section === section.id)
          .map((s) => ({ ...s, student_section: newName }));

        await db.putRecordsBulk('students', studentsToUpdate);

        // Cascade changes to studentProfiles list
        const updatedStudentProfiles = get().studentProfiles.map((student) => {
          if (student.student_section === oldName || student.student_section === section.id) {
            return { ...student, student_section: newName };
          }
          return student;
        });

        // Cascade changes to enrollments list
        const updatedEnrollments = get().enrollments.map((e) => {
          if (e.student_section === oldName || e.student_section === section.id) {
            return { ...e, student_section: newName };
          }
          return e;
        });

        const enrollmentsToUpdate = get().enrollments
          .filter((e) => e.student_section === oldName || e.student_section === section.id)
          .map((e) => ({ ...e, student_section: newName }));

        await db.putRecordsBulk('enrollments', enrollmentsToUpdate);

        set({
          students: updatedStudents,
          studentProfiles: updatedStudentProfiles,
          enrollments: updatedEnrollments,
        });
      }

      get().showNotification('Section updated', 'success');
    } catch (error) {
      console.error('Error updating section:', error);
      get().showNotification('Failed to update section', 'error');
      throw error;
    }
  },
  deleteSection: async (id) => {
    const previousSections = get().sections;
    const targetSection = previousSections.find((s) => s.id === id);
    if (!targetSection) return;

    // If students are assigned to this section, unassign them so deletion can proceed
    const activeStudents = get().students.filter(
      (student) => student.student_section === targetSection.id || student.student_section === targetSection.section_name
    );

    if (activeStudents.length > 0) {
      const updatedStudents = get().students.map((student) => {
        if (student.student_section === targetSection.id || student.student_section === targetSection.section_name) {
          return { ...student, student_section: '' };
        }
        return student;
      });
      set({ students: updatedStudents, studentProfiles: updatedStudents });
      void db.putRecordsBulk('students', updatedStudents).catch(e => console.error('Failed to unassign students on section delete:', e));
    }

    try {
      set((state) => ({ sections: state.sections.filter((s) => s.id !== id) }));
      await db.deleteRecord('sections', id);
      get().showNotification('Section deleted', 'success');
    } catch (error) {
      console.error('Error deleting section:', error);
      set({ sections: previousSections });
      get().showNotification('Failed to delete section', 'error');
      throw error;
    }
  },

  // ==================== SUBJECTS ====================
  subjects: [],
  setSubjects: (subjects) => set({ subjects }),
  addSubject: async (subject) => {
    try {
      const cleanName = (subject.subject_name || '').trim();
      if (!cleanName) return;

      const currentSubjects = get().subjects;
      const normalizedNew = normalizeSubjectName(cleanName);
      const cleanGrade = (subject.grade_level || 'all').trim();
      const cleanSection = (subject.section_id || 'all').trim();

      // Store-level deduplication guard: Prevent creating duplicate subjects for the same grade/section
      const existing = currentSubjects.find(s =>
        (s.grade_level || 'all').trim() === cleanGrade &&
        (s.section_id || 'all').trim() === cleanSection &&
        normalizeSubjectName((s.subject_name || '').trim()) === normalizedNew
      );

      if (existing) {
        // If subject exists but was hidden (term: 'none'), unhide it
        if (existing.term === 'none' && subject.term !== 'none') {
          await get().updateSubject({ ...existing, term: subject.term || 'all' });
        }
        return;
      }

      const sanitizedSubject: Subject = {
        ...subject,
        subject_name: cleanName
      };

      set((state) => ({ subjects: [...state.subjects, sanitizedSubject] }));
      await db.putRecord('subjects', sanitizedSubject);

      // Auto-sync: append to taught_subjects of matching advisory sections
      // Only for grade-level subjects (not section-specific ones already handled by the wizard)
      const currentSections = get().sections;
      const sectionsToUpdate = currentSections.filter((sec: Section) => {
        if (!sec.is_advisory || sec.section_grade_level !== sanitizedSubject.grade_level) return false;
        const gNum = parseInt(sec.section_grade_level?.replace(/\D/g, '') || '0');
        if (gNum === 11) {
          // For Grade 11: ONLY universal Core subjects can be auto-synced to all advisory sections.
          // Cluster electives must be explicitly selected per section!
          if (!isGrade11CoreSubject(sanitizedSubject.subject_name)) return false;
        } else if (gNum === 12) {
          // For Grade 12: Never auto-sync specialized electives to all sections.
          return false;
        }
        return !(sec.taught_subjects || []).some((t: string) =>
          normalizeSubjectName(t) === normalizeSubjectName(sanitizedSubject.subject_name)
        );
      });
      if (sectionsToUpdate.length > 0) {
        const updateIds = new Set(sectionsToUpdate.map((s: Section) => s.id));
        const updatedSections = currentSections.map((sec: Section) => {
          if (!updateIds.has(sec.id)) return sec;
          return {
            ...sec,
            taught_subjects: [...(sec.taught_subjects || []), sanitizedSubject.subject_name]
          };
        });
        set({ sections: updatedSections });
        for (const sec of sectionsToUpdate) {
          await db.putRecord('sections', {
            ...sec,
            taught_subjects: [...(sec.taught_subjects || []), sanitizedSubject.subject_name]
          });
        }
      }

      get().showNotification('Subject added', 'success');
    } catch (error) {
      console.error('Error adding subject:', error);
      get().showNotification('Failed to add subject', 'error');
      set((state) => ({ subjects: state.subjects.filter((s) => s.id !== subject.id) }));
      throw error;
    }
  },
  updateSubject: async (subject) => {
    const previousSubjects = get().subjects;
    const previousSections = get().sections;
    const oldSubject = previousSubjects.find(s => s.id === subject.id);
    
    if (!oldSubject) return;

    const sanitizedSubject: Subject = {
      ...subject,
      subject_name: (subject.subject_name || '').trim()
    };
    const oldName = oldSubject.subject_name;
    const newName = sanitizedSubject.subject_name;
    const nameChanged = oldName.trim() !== newName.trim();

    try {
      // 1. Update subjects
      // If the name changed, we also rename any OTHER subjects in the same grade 
      // that have the same old name (to clean up duplicates)
      const newSubjects = get().subjects.map((s) => {
        if (s.id === subject.id) return subject;
        if (nameChanged && s.grade_level === subject.grade_level && (normalizeSubjectName(s.subject_name) === normalizeSubjectName(oldName) || s.subject_name.trim().toLowerCase() === oldName.trim().toLowerCase())) {
          return { ...s, subject_name: newName };
        }
        return s;
      });
      
      // 2. Propagate name change to sections if necessary
      let newSections = previousSections;
      if (nameChanged) {
        newSections = previousSections.map(sec => {
          const oldNorm = normalizeSubjectName(oldName);
          const metadata = sec.section_metadata ? { ...sec.section_metadata } : undefined;
          let hidden = metadata?.hiddenConsolidatedSubjects ? [...metadata.hiddenConsolidatedSubjects] : undefined;

          if (hidden && hidden.length > 0) {
            hidden = hidden.filter(h => {
              if (h.toLowerCase().trim() === oldName.toLowerCase().trim()) return false;
              if (normalizeSubjectName(h) === oldNorm) return false;
              return true;
            });
          }

          return {
            ...sec,
            taught_subjects: sec.taught_subjects?.map(name => 
              (name.trim().toLowerCase() === oldName.trim().toLowerCase() || normalizeSubjectName(name) === oldNorm) ? newName : name
            ) || [],
            teaching_subjects: sec.teaching_subjects?.map(name =>
              (name.trim().toLowerCase() === oldName.trim().toLowerCase() || normalizeSubjectName(name) === oldNorm) ? newName : name
            ) || [],
            section_metadata: metadata ? {
              ...metadata,
              hiddenConsolidatedSubjects: hidden
            } : undefined
          };
        });
      }

      set({ subjects: newSubjects, sections: newSections });
      
      // 3. Persist subject changes
      await db.putRecord('subjects', subject);
      if (nameChanged) {
          // Persist other renamed subjects
          const renamedOthers = newSubjects.filter(s => s.id !== subject.id && s.subject_name === newName && normalizeSubjectName(previousSubjects.find(ps => ps.id === s.id)?.subject_name || '') === normalizeSubjectName(oldName));
          for (const s of renamedOthers) {
              await db.putRecord('subjects', s);
          }
      }
      
      // 4. Persist section changes
      if (nameChanged) {
        for (const sec of newSections) {
          const prevSec = previousSections.find(ps => ps.id === sec.id);
          if (JSON.stringify(prevSec?.taught_subjects) !== JSON.stringify(sec.taught_subjects) ||
              JSON.stringify(prevSec?.teaching_subjects) !== JSON.stringify(sec.teaching_subjects)) {
            await db.putRecord('sections', sec);
          }
        }
      }

      get().showNotification('Subject updated and teaching loads synchronized', 'success');
    } catch (error) {
      console.error('Error updating subject:', error);
      set({ subjects: previousSubjects, sections: previousSections });
      get().showNotification('Failed to update subject', 'error');
      throw error;
    }
  },
  deleteSubject: async (id) => {
    const previousSubjects = get().subjects;
    const previousSections = get().sections;
    const subjectToDelete = previousSubjects.find(s => s.id === id);
    
    try {
      // 1. Remove the subject itself
      const newSubjects = get().subjects.filter((s) => s.id !== id);
      
      // 2. Clean up sections that were teaching this subject by name
      // This prevents "ghost" checkboxes in the Section Edit modal
      const newSections = get().sections.map(sec => {
        if (!subjectToDelete) return sec;
        return {
          ...sec,
          taught_subjects: sec.taught_subjects?.filter(name => 
            normalizeSubjectName(name) !== normalizeSubjectName(subjectToDelete.subject_name)
          ) || [],
          teaching_subjects: sec.teaching_subjects?.filter(name =>
            normalizeSubjectName(name) !== normalizeSubjectName(subjectToDelete.subject_name)
          ) || []
        };
      });

      set({ subjects: newSubjects, sections: newSections });
      
      // Preserve subject_name on any affected classRecords/gradingSheetRecords before deletion
      if (subjectToDelete) {
        const stateRecords = get().classRecords || [];
        const affectedCr = stateRecords.filter(r => r.subject_id === id && !r.subject_name);
        if (affectedCr.length > 0) {
          const updatedCr = affectedCr.map(r => ({ ...r, subject_name: subjectToDelete.subject_name }));
          await db.putRecordsBulk('classRecords', updatedCr);
        }
      }

      await db.deleteRecord('subjects', id);
      
      // Persist section changes to database
      if (subjectToDelete) {
        for (const sec of newSections) {
          const prevSec = previousSections.find(ps => ps.id === sec.id);
          if (JSON.stringify(prevSec?.taught_subjects) !== JSON.stringify(sec.taught_subjects) ||
              JSON.stringify(prevSec?.teaching_subjects) !== JSON.stringify(sec.teaching_subjects)) {
            await db.putRecord('sections', sec);
          }
        }
      }

      get().showNotification('Subject deleted and teaching loads updated', 'success');
    } catch (error) {
      console.error('Error deleting subject:', error);
      set({ subjects: previousSubjects, sections: previousSections });
      get().showNotification('Failed to delete subject', 'error');
      throw error;
    }
  },
  deleteSubjectsBulk: async (ids: string[]) => {
    const previousSubjects = get().subjects;
    const previousSections = get().sections;
    const subjectsToDelete = previousSubjects.filter(s => ids.includes(s.id));
    const deletedNames = new Set(subjectsToDelete.map(s => normalizeSubjectName(s.subject_name)));
    
    try {
      // 1. Remove the subjects
      const newSubjects = get().subjects.filter((s) => !ids.includes(s.id));
      
      // 2. Clean up sections
      const newSections = get().sections.map(sec => {
        if (deletedNames.size === 0) return sec;
        return {
          ...sec,
          taught_subjects: sec.taught_subjects?.filter(name => 
            !deletedNames.has(normalizeSubjectName(name))
          ) || [],
          teaching_subjects: sec.teaching_subjects?.filter(name =>
            !deletedNames.has(normalizeSubjectName(name))
          ) || []
        };
      });

      set({ subjects: newSubjects, sections: newSections });
      
      // Preserve subject_name on affected grade records before deletion
      for (const subj of subjectsToDelete) {
        const stateRecords = get().classRecords || [];
        const affectedCr = stateRecords.filter(r => r.subject_id === subj.id && !r.subject_name);
        if (affectedCr.length > 0) {
          const updatedCr = affectedCr.map(r => ({ ...r, subject_name: subj.subject_name }));
          await db.putRecordsBulk('classRecords', updatedCr);
        }
      }

      // Persist to DB
      for (const id of ids) {
        await db.deleteRecord('subjects', id);
      }
      
      for (const sec of newSections) {
        const prevSec = previousSections.find(ps => ps.id === sec.id);
        if (JSON.stringify(prevSec?.taught_subjects) !== JSON.stringify(sec.taught_subjects) ||
            JSON.stringify(prevSec?.teaching_subjects) !== JSON.stringify(sec.teaching_subjects)) {
          await db.putRecord('sections', sec);
        }
      }

      get().showNotification(`${ids.length} subjects deleted`, 'success');
    } catch (error) {
      console.error('Error deleting subjects in bulk:', error);
      set({ subjects: previousSubjects, sections: previousSections });
      get().showNotification('Failed to delete subjects', 'error');
      throw error;
    }
  },

  // ==================== ENROLLMENTS ====================
  enrollments: [],
  setEnrollments: (enrollments) => set({ enrollments }),
  addEnrollment: async (enrollment) => {
    try {
      set((state) => ({ enrollments: [...state.enrollments, enrollment] }));
      await db.putRecord('enrollments', enrollment);
    } catch (error) {
      console.error('Error adding enrollment:', error);
      set((state) => ({ enrollments: state.enrollments.filter((e) => e.id !== enrollment.id) }));
      throw error;
    }
  },
  promoteStudentsFromYear: async (sourceSchoolYear, sourceGradeLevel, targetSectionId) => {
    try {
      const state = get();
      const targetSection = state.sections.find((s) => s.id === targetSectionId);
      if (!targetSection) {
        throw new Error('Target section not found');
      }
      const targetSchoolYear = state.activeSchoolYear;
      if (sourceSchoolYear === targetSchoolYear) {
        throw new Error('Source school year must differ from the active school year');
      }

      // Candidates come from enrollment history for the source year/grade.
      // Installs without enrollment records (all pre-rollover installs) fall
      // back to students currently sitting on the source grade level.
      const candidateLrns = new Set(
        state.enrollments
          .filter((e) => e.school_year === sourceSchoolYear && e.grade_level === sourceGradeLevel)
          .map((e) => e.student_lrn)
      );
      if (candidateLrns.size === 0) {
        state.students
          .filter((s) => s.grade_level === sourceGradeLevel)
          .forEach((s) => candidateLrns.add(s.lrn));
      }

      // Never double-enroll a learner into the active school year
      const alreadyEnrolled = new Set(
        state.enrollments
          .filter((e) => e.school_year === targetSchoolYear)
          .map((e) => e.student_lrn)
      );

      const timestamp = new Date().toISOString();
      const updatedStudents = [...state.students];
      const newEnrollments: Enrollment[] = [];
      const promotedStudentsToSave: Student[] = [];

      for (const lrn of candidateLrns) {
        if (alreadyEnrolled.has(lrn)) continue;
        const idx = updatedStudents.findIndex((s) => s.lrn === lrn);
        if (idx === -1) continue;

        const promotedStudent = {
          ...updatedStudents[idx],
          grade_level: targetSection.section_grade_level,
          student_section: targetSection.section_name,
        };
        updatedStudents[idx] = promotedStudent;
        promotedStudentsToSave.push(promotedStudent);

        const enrollment: Enrollment = {
          id: `enroll-${lrn}-${targetSchoolYear}`,
          student_lrn: lrn,
          school_year: targetSchoolYear,
          grade_level: targetSection.section_grade_level,
          student_section: targetSection.section_name,
          enrolled_at: timestamp,
        };
        newEnrollments.push(enrollment);
      }

      const promoted = newEnrollments.length;
      if (promoted > 0) {
        await db.putRecordsBulk('students', promotedStudentsToSave);
        await db.putRecordsBulk('enrollments', newEnrollments);

        set({
          students: updatedStudents,
          studentProfiles: updatedStudents,
          enrollments: [...state.enrollments, ...newEnrollments],
        });
        get().showNotification(
          `${promoted} learner(s) promoted to ${targetSection.section_grade_level} - ${targetSection.section_name}`,
          'success'
        );
      } else {
        get().showNotification('No eligible learners found to promote', 'info');
      }
      return promoted;
    } catch (error) {
      console.error('Error promoting students:', error);
      throw error;
    }
  },
  enrollReturningStudent: async (lrn, targetSectionId) => {
    try {
      const enrollment: Enrollment = {
        id: `enroll-${lrn}-${targetSectionId}`,
        student_lrn: lrn,
        school_year: get().activeSchoolYear,
        student_section: targetSectionId,
        enrolled_at: new Date().toISOString(),
      };
      await get().addEnrollment(enrollment);
    } catch (error) {
      console.error('Error enrolling student:', error);
      throw error;
    }
  },

  // ==================== TEACHERS/USERS ====================
  teachers: [],
  setTeachers: (teachers) => set({ teachers }),

  // ==================== SF9 LAYOUT ====================
  sf9Layout: {
    fontSize: 11,
    cellPadding: 4,
    gradesTable: {
      subject: '30%',
      qtr: '15%',
      final: '20%',
      remarks: '35%',
    },
    valuesTable: {
      valueName: '30%',
      behavior: '35%',
      marking: '35%',
    },
  },
  setSF9Layout: (layout) => set({ sf9Layout: layout }),

  // ==================== UI STATE ====================
  currentView: getLocalStorageValue(CURRENT_VIEW_STORAGE_KEY) || 'dashboard',
  setCurrentView: (view) => {
    setLocalStorageValue(CURRENT_VIEW_STORAGE_KEY, view);
    set({ currentView: view });
  },
  selectedSection: getLocalStorageValue(SELECTED_SECTION_STORAGE_KEY),
  setSelectedSection: (section) => {
    if (section) {
      setLocalStorageValue(SELECTED_SECTION_STORAGE_KEY, section);
    } else {
      removeLocalStorageValue(SELECTED_SECTION_STORAGE_KEY);
    }
    set({ selectedSection: section });
  },
  selectedSubject: null,
  setSelectedSubject: (subject) => set({ selectedSubject: subject }),

  // ==================== SYNC STATE ====================
  isSyncReady: true, // Always ready since it's local
  setSyncReady: (ready) => set({ isSyncReady: ready }),

  // ==================== NOTIFICATIONS ====================
  notification: { message: '', type: 'info', visible: false },
  showNotification: (message, type = 'info') => {
    set({ notification: { message, type, visible: true } });
    setTimeout(() => {
      set({ notification: { message: '', type: 'info', visible: false } });
    }, 3000);
  },
  hideNotification: () => set({ notification: { message: '', type: 'info', visible: false } }),

  // ==================== CLOUD SYNC ====================
  cloudSyncEnabled: localStorage.getItem('announcement_cloud_sync') === 'true',
  setCloudSyncEnabled: (enabled) => {
    localStorage.setItem('announcement_cloud_sync', enabled.toString());
    set({ cloudSyncEnabled: enabled });
  },

  // ==================== DB WRITE TRACKING ====================
  dbWritePendingCount: 0,

  // ==================== BACKUP & RESTORE ====================
  lastBackupTime: null,
  setLastBackupTime: (time) => set({ lastBackupTime: time }),
  createBackup: async (label) => {
    try {
      await backup.createBackup(label);
      set({ lastBackupTime: Date.now() });
      get().showNotification('Backup created successfully', 'success');
    } catch (error) {
      console.error('Error creating backup:', error);
      get().showNotification('Failed to create backup', 'error');
      throw error;
    }
  },
  restoreFromFile: async (file) => {
    try {
      await backup.restoreFromBackupFile(file);
      // Reload all data collections to keep the UI in sync
      const students = await db.getAllRecords<Student>('students');
      const sections = await db.getAllRecords<Section>('sections');
      const rawSubjects = await db.getAllRecords<Subject>('subjects');
      const subjects: Subject[] = rawSubjects.map(s => ({
        ...s,
        term: s.term !== undefined && s.term !== null ? s.term : getDefaultTermForSubject(s.subject_name, s.grade_level)
      }));
      const classRecords = await db.getAllRecords<ClassRecord>('classRecords');
      const gradingSheetRecords = await db.getAllRecords<ClassRecord>('gradingSheetRecords');
      const hpsRecords = await db.getAllRecords<HPSRecord>('hpsRecords');
      const enrollments = await db.getAllRecords<Enrollment>('enrollments');
      const announcements = await db.getAllRecords<Announcement>('announcements');
      const attendanceRecords = await db.getAllRecords<AttendanceRecord>('attendanceRecords');
      const sf2Sheets = await db.getAllRecords<SF2Sheet>('sf2Sheets');
      const observedValues = await db.getAllRecords<ObservedValues>('observedValues');
      const allProfiles = await db.getAllRecords<SchoolProfile>('schoolProfile');
      const schoolProfile = allProfiles.length > 0 ? allProfiles[0] : undefined;

      set({
        students,
        studentProfiles: students,
        sections,
        subjects,
        classRecords,
        gradingSheetRecords,
        hpsRecords,
        enrollments,
        announcements,
        attendanceRecords,
        sf2Sheets,
        observedValues,
        schoolProfile: schoolProfile ? { ...schoolProfile, division: (schoolProfile.division || '').replace(/schools division office of/i, '').replace(/schools division of/i, '').replace(/division of/i, '').trim() } : defaultSchoolProfile,
      });
      get().showNotification('Data restored successfully', 'success');
    } catch (error) {
      console.error('Error restoring from backup:', error);
      get().showNotification('Failed to restore backup', 'error');
      throw error;
    }
  },
  listBackups: async () => {
    try {
      const backups = await backup.listBackups();
      console.log('Available backups:', backups);
    } catch (error) {
      console.error('Error listing backups:', error);
    }
  },
}));

/**
 * Initialize app store by loading all data from local database
 */
export async function initializeAppStore() {
  const loadStore = async <T>(name: string, fallback: T[] = []): Promise<T[]> => {
    try {
      return await db.getAllRecords<T>(name);
    } catch (e) {
      console.error(`Failed to load ${name}:`, e);
      return fallback;
    }
  };

  try {
    // Phase 1: load data needed before making decisions, all in parallel
    const [students, sections, rawSubjects, allProfiles] = await Promise.all([
      loadStore<Student>('students'),
      loadStore<Section>('sections'),
      loadStore<Subject>('subjects'),
      db.getAllRecords<SchoolProfile>('schoolProfile'),
    ]);

    // Purge any rogue standalone 'Specialization' subject from the database
    const specializationSubjects = rawSubjects.filter(s => {
      const norm = (s.subject_name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return norm === 'specialization';
    });
    if (specializationSubjects.length > 0) {
      for (const s of specializationSubjects) {
        try {
          await db.deleteRecord('subjects', s.id);
        } catch (e) {
          console.error('Failed to delete rogue Specialization subject record:', e);
        }
      }
    }

    const filteredRawSubjects = rawSubjects.filter(s => {
      const norm = (s.subject_name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return norm !== 'specialization';
    });

    const subjects: Subject[] = filteredRawSubjects.map(s => ({
      ...s,
      term: s.term !== undefined && s.term !== null ? s.term : getDefaultTermForSubject(s.subject_name, s.grade_level)
    }));

    // Load the school profile by fetching all records.
    // We do NOT use the hardcoded default school_id as the lookup key because
    // the client may have changed their School ID, which changes the stored key.
    // If somehow multiple records exist (legacy), prefer the non-default and non-empty one.
    const schoolProfile =
      allProfiles.find(p => p && p.school_id && p.school_id !== defaultSchoolProfile.school_id && p.name && p.name.trim() && p.name.trim() !== 'School Name') ??
      allProfiles.find(p => p && p.name && p.name.trim() && p.name.trim() !== 'School Name') ??
      allProfiles.find(p => p && p.school_id && p.school_id !== defaultSchoolProfile.school_id) ??
      allProfiles[0] ??
      undefined;

    const isAutoloaded = localStorage.getItem('formease_subjects_autoloaded') === 'true';
    if (subjects.length === 0) {
      if (!isAutoloaded) {
        console.log('Auto-loading all subjects for all grade levels right away...');
        const grades = [
          'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
          'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
        ];
        const universalOrder = [
          'Language',
          'Reading and Literacy',
          'Filipino',
          'English',
          'Mathematics',
          'Science',
          'Araling Panlipunan (AP)',
          'GMRC (Good Manners and Right Conduct)',
          'Values Education',
          'Makabansa',
          'E.P.P.',
          'Technology and Livelihood Education (TLE)',
          'MAPEH',
          'Music and Arts',
          'Physical Education and Health',
          '*Arabic Language',
          '*Islamic Values Education',
        ];

        const normalizeLabel = (val: string) => val.toLowerCase().replace(/\s+/g, ' ').replace(/\s*\([^)]*\)/g, '').trim();
        const newSubjects: Subject[] = [];

        for (const grade of grades) {
          let templates = STANDARD_SUBJECTS[grade as keyof typeof STANDARD_SUBJECTS];
          if (!templates) continue;

          // For Senior High School, default auto-load should ONLY seed universal Core subjects,
          // avoiding dumping 70+ unused electives into a new user's database.
          // Electives remain fully available in the catalog and wizard for teachers to add as needed.
          if (grade === 'Grade 11') {
            templates = templates.filter(t => isGrade11CoreSubject(t.name));
          } else if (grade === 'Grade 12') {
            templates = [];
          }

          for (let i = 0; i < templates.length; i++) {
            const template = templates[i];
            const subjectId = generateDeterministicSubjectId(grade, template.name);
            newSubjects.push({
              id: subjectId,
              subject_name: template.name,
              subject_code: template.code,
              grade_level: grade,
              term: getDefaultTermForSubject(template.name, grade),
              order: universalOrder.findIndex((name) => normalizeLabel(name) === normalizeLabel(template.name)),
            });
          }
        }

        await db.putRecordsBulk('subjects', newSubjects);
        subjects.push(...newSubjects);
        localStorage.setItem('formease_subjects_autoloaded', 'true');
      }
    } else {
      localStorage.setItem('formease_subjects_autoloaded', 'true');
    }
    const finalSubjects = subjects;

    // Phase 2: load remaining stores in parallel — none depend on each other
    const [classRecords, enrollments, announcements, attendanceRecords, gradingSheetRecords, hpsRecords, sf2Sheets, observedValues] = await Promise.all([
      loadStore<ClassRecord>('classRecords'),
      loadStore<Enrollment>('enrollments'),
      loadStore<Announcement>('announcements'),
      loadStore<AttendanceRecord>('attendanceRecords'),
      loadStore<ClassRecord>('gradingSheetRecords'),
      loadStore<HPSRecord>('hpsRecords'),
      loadStore<SF2Sheet>('sf2Sheets'),
      loadStore<ObservedValues>('observedValues'),
    ]);

    // Backward compatibility: resolve school year from school profile, stored preferences, or restored records
    const cleanSy = (sy?: string | null) => {
      const s = (sy || '').trim();
      return (s && s.toLowerCase() !== 'unknown') ? s : '';
    };

    const resolvedSchoolYear = cleanSy(schoolProfile?.school_year)
      || cleanSy(getLocalStorageValue('activeSchoolYear'))
      || cleanSy(getLocalStorageValue('formease_active_school_year'))
      || cleanSy(classRecords.find(r => r.school_year)?.school_year)
      || cleanSy(gradingSheetRecords.find(r => r.school_year)?.school_year)
      || cleanSy(sf2Sheets.find(s => s.school_year)?.school_year)
      || cleanSy(useAppStore.getState().activeSchoolYear)
      || '2026-2027';
    setLocalStorageValue('activeSchoolYear', resolvedSchoolYear);
    setLocalStorageValue('formease_active_school_year', resolvedSchoolYear);

    const shouldRepairSf2Attendance = getLocalStorageValue(SF2_ATTENDANCE_REPAIR_KEY) !== 'true';
    const repaired = shouldRepairSf2Attendance
      ? reconcileAttendanceAndSf2Data(attendanceRecords, sf2Sheets, resolvedSchoolYear)
      : { attendanceRecords, sf2Sheets };

    if (shouldRepairSf2Attendance) {
      await Promise.all([
        db.putRecordsBulk('attendanceRecords', repaired.attendanceRecords),
        db.putRecordsBulk('sf2Sheets', repaired.sf2Sheets),
      ]);
      setLocalStorageValue(SF2_ATTENDANCE_REPAIR_KEY, 'true');
    }


    const advisorySection = sections.find(s => s.is_advisory || (s as Section & { is_advisory_class?: boolean }).is_advisory_class);
    const persistedSelectedSection = getLocalStorageValue(SELECTED_SECTION_STORAGE_KEY);
    const hasPersistedSection = !!persistedSelectedSection && sections.some(
      s => s.id === persistedSelectedSection || s.section_name === persistedSelectedSection
    );
    
    // Transparent Migration: 
    // 1. Ensure Grade 12 Old K-12 PE subjects and sections use the official title
    // 2. Remove non-curriculum 'Specialization' subject from section rosters (taught_subjects & teaching_subjects)
    let sectionsChanged = false;
    let finalSections = sections.map(sec => {
      let secChanged = false;

      const cleanedTaught = (sec.taught_subjects || []).filter(s => {
        const norm = (s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (norm === 'specialization') {
          secChanged = true;
          return false;
        }
        return true;
      });
      const cleanedTeaching = (sec.teaching_subjects || []).filter(s => {
        const norm = (s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (norm === 'specialization') {
          secChanged = true;
          return false;
        }
        return true;
      });

      const gNum = parseInt((sec.section_grade_level || '').replace(/\D/g, '')) || 0;
      const isSSHS = (sec.track || '').toLowerCase().includes('sshs') || (sec.track || '').toLowerCase().includes('cluster');
      let newTaught = cleanedTaught;
      let newTeaching = cleanedTeaching;

      if (sec.is_advisory && (!sec.program || sec.program === 'Regular') && cleanedTaught.length === 0) {
        const preset = getCurriculumPreset(sec.section_grade_level, sec.track, sec.cluster || sec.strand, 'Regular');
        if (preset && preset.subjects.length > 0) {
          newTaught = gNum === 11
            ? preset.subjects.filter(s => isGrade11CoreSubject(s.name)).map(s => s.name)
            : preset.subjects.map(s => s.name);
          secChanged = true;
        }
      }

      if (gNum === 12 && !isSSHS) {
        newTaught = cleanedTaught.map(s => {
          const norm = normalizeGrade12PESubjectName(s, false);
          if (norm !== s) secChanged = true;
          return norm;
        });
        newTeaching = cleanedTeaching.map(s => {
          const norm = normalizeGrade12PESubjectName(s, false);
          if (norm !== s) secChanged = true;
          return norm;
        });
      }

      if (secChanged) {
        sectionsChanged = true;
        return {
          ...sec,
          taught_subjects: newTaught,
          teaching_subjects: newTeaching
        };
      }
      return sec;
    });

    if (sectionsChanged) {
      void db.putRecordsBulk('sections', finalSections).catch(e => console.error('Failed to persist migrated sections:', e));
    }

    let subjectsChanged = false;
    const finalSubjectsWithMigration = finalSubjects.map(sub => {
      const gNum = parseInt((sub.grade_level || '').replace(/\D/g, '')) || 0;
      if (gNum === 12) {
        const norm = normalizeGrade12PESubjectName(sub.subject_name, false);
        if (norm !== sub.subject_name) {
          subjectsChanged = true;
          return { ...sub, subject_name: norm };
        }
      }
      return sub;
    });

    if (subjectsChanged) {
      void db.putRecordsBulk('subjects', finalSubjectsWithMigration).catch(e => console.error('Failed to persist migrated subjects:', e));
    }

    // Exact DepEd test-fixture mock adviser names that should never be shown in real deployments
    const FIXTURE_MOCK_ADVISER_NAMES = new Set([
      'Manuel T. Torres',
      'Nelson P. Pascual',
      'Kevin O. Ocampo',
      'Laura M. Mendoza',
      'Joy V. Villanueva',
      'Maria L. Santos',
      'Bella C. Cruz',
      'Carlos D. Dizon',
      'Diana M. Lopez',
      'Eduardo G. Gomez',
      'Fatima R. Reyes',
      'Gabriel S. Santos',
      'Hannah P. Perez',
      'Ian B. Bautista'
    ]);

    // Transparent Self-Healing: Sync sections with test-fixture mock adviser names to actual schoolProfile adviser
    const activeProfileAdviser = (schoolProfile?.adviser_name || '').trim();
    if (activeProfileAdviser && activeProfileAdviser.toLowerCase() !== 'admin') {
      let anyAdviserMigrated = false;
      finalSections = finalSections.map(sec => {
        const cName = (sec.adviser_name || '').trim();
        const isFixtureMock = FIXTURE_MOCK_ADVISER_NAMES.has(cName) ||
                              (sec.adviser_id && sec.adviser_id.startsWith('adv-')) ||
                              cName.toLowerCase() === 'tba';
        if (isFixtureMock && cName !== activeProfileAdviser) {
          anyAdviserMigrated = true;
          return { ...sec, adviser_name: activeProfileAdviser };
        }
        return sec;
      });
      if (anyAdviserMigrated) {
        void db.putRecordsBulk('sections', finalSections).catch(e => console.error('Failed to persist adviser-migrated sections:', e));
      }
    }

    // Transparent Self-Healing: Ensure sections assigned to active adviser or named 'Archimedes' have is_advisory: true
    let anyAdvisoryHealed = false;
    finalSections = finalSections.map(sec => {
      const secNameNorm = (sec.section_name || '').trim().toLowerCase();
      const isArchimedes = secNameNorm === 'archimedes';
      const isEmersonAssigned = sec.adviser_id === 'user-emerson' ||
        (activeProfileAdviser && sec.adviser_name && sec.adviser_name.trim().toLowerCase() === activeProfileAdviser.toLowerCase());
      const isProfileSection = !!(schoolProfile?.section && secNameNorm === schoolProfile.section.trim().toLowerCase());

      if ((isArchimedes || isEmersonAssigned || isProfileSection) && !sec.is_advisory) {
        anyAdvisoryHealed = true;
        return {
          ...sec,
          is_advisory: true,
          adviser_name: sec.adviser_name || activeProfileAdviser || sec.adviser_name
        };
      }
      return sec;
    });
    if (anyAdvisoryHealed) {
      void db.putRecordsBulk('sections', finalSections).catch(e => console.error('Failed to persist advisory-healed sections:', e));
    }



    // Comprehensive Purge: Unconditionally purge ghost "Einstein" section, mock students, and orphan records
    let finalStudents = students;
    const ghostPurge = await purgeGhostEinsteinData(db, {
      sections: finalSections,
      students: finalStudents,
      classRecords,
      gradingSheetRecords,
      attendanceRecords: repaired.attendanceRecords,
      sf2Sheets: repaired.sf2Sheets,
      enrollments,
    });

    finalSections = ghostPurge.sections;
    finalStudents = ghostPurge.students;

    // Production client protection: Ensure test sections and mock test students are never visible or loaded by clients
    if (!import.meta.env.DEV) {
      finalSections = finalSections.filter(s => !isTestSection(s));
      finalStudents = finalStudents.filter(s => !isTestStudent(s));
    }

    const finalClassRecords = ghostPurge.classRecords;
    const finalGradingSheetRecords = ghostPurge.gradingSheetRecords;
    const finalAttendanceRecords = ghostPurge.attendanceRecords;
    const finalSf2Sheets = ghostPurge.sf2Sheets;
    const finalEnrollments = ghostPurge.enrollments;

    // Ensure schoolProfile does not cling to ghost Einstein section
    let finalSchoolProfile = schoolProfile;
    if (finalSchoolProfile && (finalSchoolProfile.section || '').trim().toLowerCase() === 'einstein') {
      finalSchoolProfile = { ...finalSchoolProfile, section: '' };
      void db.putRecord('schoolProfile', finalSchoolProfile).catch(() => {});
    }

    // Re-resolve selectedSection ensuring configured section or advisory class has priority
    const configuredSectionName = (finalSchoolProfile?.section || '').trim();
    const primarySectionObj = configuredSectionName
      ? finalSections.find(s => s.section_name.toLowerCase() === configuredSectionName.toLowerCase())
      : null;
    const resolvedActiveSection = hasPersistedSection
      ? persistedSelectedSection
      : (primarySectionObj ? primarySectionObj.section_name : (advisorySection ? advisorySection.section_name : (finalSections[0]?.section_name || finalSections[0]?.id || null)));
    if (resolvedActiveSection) {
      setLocalStorageValue(SELECTED_SECTION_STORAGE_KEY, resolvedActiveSection);
    }

    // Transparent Self-Healing: Reconnect any orphaned class records, HPS, and grading sheet records
    // caused by deleted, edited, or re-templated subjects, and resurrect missing/unhidden subjects
    const reconciliation = reconcileOrphanedGradesAndSubjects({
      subjects: finalSubjectsWithMigration,
      sections: finalSections,
      students: finalStudents,
      classRecords: finalClassRecords,
      hpsRecords,
      gradingSheetRecords: finalGradingSheetRecords
    });

    if (reconciliation.modified) {
      console.log(`[FormEase Pro] Self-healing reconnected ${reconciliation.repairedCount} orphaned grade/HPS record(s) to active subjects.`);
      await Promise.all([
        db.putRecordsBulk('classRecords', reconciliation.classRecords),
        db.putRecordsBulk('hpsRecords', reconciliation.hpsRecords),
        db.putRecordsBulk('gradingSheetRecords', reconciliation.gradingSheetRecords),
      ]);
    }

    if (reconciliation.subjectsModified) {
      console.log(`[FormEase Pro] Self-healing restored visibility for ${reconciliation.subjects.length} subjects with recorded grades.`);
      await db.putRecordsBulk('subjects', reconciliation.subjects);
    }

    if (reconciliation.deletedSubjectIds && reconciliation.deletedSubjectIds.length > 0) {
      console.log(`[FormEase Pro] Self-healing purged ${reconciliation.deletedSubjectIds.length} duplicate subject record(s) and re-linked their grades.`);
      await db.deleteRecordsBulk('subjects', reconciliation.deletedSubjectIds);
    }

    if (reconciliation.deletedClassRecordIds && reconciliation.deletedClassRecordIds.length > 0) {
      console.log(`[FormEase Pro] Self-healing purged ${reconciliation.deletedClassRecordIds.length} orphaned temporary grade record(s).`);
      await db.deleteRecordsBulk('classRecords', reconciliation.deletedClassRecordIds);
    }

    if (reconciliation.deletedGradingSheetRecordIds && reconciliation.deletedGradingSheetRecordIds.length > 0) {
      console.log(`[FormEase Pro] Self-healing purged ${reconciliation.deletedGradingSheetRecordIds.length} orphaned temporary grading sheet record(s).`);
      await db.deleteRecordsBulk('gradingSheetRecords', reconciliation.deletedGradingSheetRecordIds);
    }

    if (reconciliation.sectionsModified && reconciliation.sections) {
      console.log(`[FormEase Pro] Self-healing updated ${reconciliation.sections.length} section(s) with synchronized subjects.`);
      await db.putRecordsBulk('sections', reconciliation.sections);
      finalSections = reconciliation.sections;
    }

    useAppStore.setState({
      activeSchoolYear: resolvedSchoolYear,
      students: finalStudents,
      studentProfiles: finalStudents,
      sections: finalSections,
      subjects: reconciliation.subjects,
      classRecords: reconciliation.classRecords,
      gradingSheetRecords: reconciliation.gradingSheetRecords,
      hpsRecords: reconciliation.hpsRecords,
      enrollments: finalEnrollments,
      announcements,
      attendanceRecords: finalAttendanceRecords,
      sf2Sheets: finalSf2Sheets,
      observedValues,
      schoolProfile: finalSchoolProfile ? { ...finalSchoolProfile, division: (finalSchoolProfile.division || '').replace(/schools division office of/i, '').replace(/schools division of/i, '').replace(/division of/i, '').trim() } : defaultSchoolProfile,
      isSyncReady: true,
      selectedSection: resolvedActiveSection
    });

    console.log('✅ App store data loaded from IndexedDB');

    // Perform non-blocking background tasks
    setTimeout(async () => {
        try {
            await backup.checkAndCreateDailyBackup();
            const backups = await backup.listBackups();
            if (backups.length > 0) {
              const latest = backups.reduce((prev, curr) => 
                (curr.timestamp > prev.timestamp) ? curr : prev
              );
              useAppStore.setState({ lastBackupTime: latest.timestamp });
            }
        } catch (e) {
            console.warn('⚠️ Background initialization task failed:', e);
        }
    }, 1000);

  } catch (error) {
    console.error('❌ Critical error during app initialization:', error);
    useAppStore.setState({ isSyncReady: true });
  }
}
