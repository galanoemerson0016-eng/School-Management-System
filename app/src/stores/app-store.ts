/**
 * App Store (Offline-First with Local Database)
 * 
 * This store manages all application state and persists data to IndexedDB.
 * No Firebase or cloud dependencies - everything is local.
 */

import { create } from 'zustand';
import type { SchoolProfile, Student, Section, Subject, Announcement, ClassRecord, Enrollment, SchoolYear, ObservedValues, HPSRecord, SF2Sheet, User, AttendanceRecord } from '../types';
import { db, type AtomicRecordChange } from '../services/database';
import { backup } from '../services/backup';
import { persistLearnerUpdate, persistLearnerDelete, persistLearnersDelete, withLearnerMutation } from '../services/learner-record-service';
import { normalizeSubjectName } from '../lib/subjectConfig';
import { STANDARD_SUBJECTS, getDefaultTermForSubject, isGrade11CoreSubject } from '../lib/curriculum';
import { getCurriculumPreset } from '../lib/curriculumPresets';
import { generateDeterministicSubjectId } from '../utils/grade-reconciliation';
import { createGradingSlice, type GradingSlice } from './slices/grading-slice';
import { createAttendanceSlice, type AttendanceSlice } from './slices/attendance-slice';
import { createAnnouncementsSlice, type AnnouncementsSlice } from './slices/announcements-slice';
import { invalidateResolvedSubjectNameCache, isStudentInSection } from '../utils/grading-helpers';

export type SF1RowStatus = 'imported' | 'updated' | 'skipped' | 'conflicted' | 'failed';

export interface SF1RowOutcome {
  lrn: string;
  name: string;
  status: SF1RowStatus;
  error?: string;
  details?: string;
}

export interface SF1ImportResult {
  count: number;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  conflicted: number;
  failed: number;
  outcomes: SF1RowOutcome[];
}

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
  importStudentsFromSF1: (students: Student[], sectionName: string) => Promise<SF1ImportResult>;
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
  addStudent: (student) => withLearnerMutation(async () => {
    try {
      if (await db.getRecord('students', student.lrn)) throw new Error('A learner with this LRN already exists.');
      await db.putRecord('students', student);
      set((state) => ({ students: [...state.students, student] }));
      get().showNotification('Student added successfully', 'success');
    } catch (error) {
      console.error('Error adding student:', error);
      get().showNotification('Failed to add student', 'error');
      throw error;
    }
  }),
  updateStudent: (lrn, updates) => withLearnerMutation(async () => {
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

        await persistLearnerUpdate(lrn, updated);

        // 2. Zustand Store State Updates
        set((state) => ({
          sf2Sheets: state.sf2Sheets.map(sheet => {
            const attendance = { ...sheet.attendance };
            const remarks = { ...sheet.remarks };
            if (Object.prototype.hasOwnProperty.call(attendance, lrn)) { attendance[updated.lrn] = attendance[lrn]; delete attendance[lrn]; }
            if (Object.prototype.hasOwnProperty.call(remarks, lrn)) { remarks[updated.lrn] = remarks[lrn]; delete remarks[lrn]; }
            return { ...sheet, attendance, remarks };
          }),
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
          if (Object.prototype.hasOwnProperty.call(attendance, lrn)) {
            attendance[updated.lrn] = attendance[lrn];
            delete attendance[lrn];
            changed = true;
          }
          if (Object.prototype.hasOwnProperty.call(remarks, lrn)) {
            remarks[updated.lrn] = remarks[lrn];
            delete remarks[lrn];
            changed = true;
          }
          if (changed) {
            set({ activeSF2Sheet: { ...activeSheet, attendance, remarks } });
          }
        }
      } else {
        // Publish state only after the durable write succeeds.
        await persistLearnerUpdate(lrn, updated);
        set((state) => ({
          students: state.students.map((s) => (s.lrn === lrn ? updated : s)),
          studentProfiles: state.studentProfiles.map((s) => (s.lrn === lrn ? updated : s)),
        }));
      }

      get().showNotification('Student updated', 'success');
    } catch (error) {
      console.error('Error updating student:', error);
      get().showNotification('Failed to update student', 'error');
      throw error;
    }
  }),
  deleteStudent: (lrn) => withLearnerMutation(async () => {
    try {
      await persistLearnerDelete(lrn);
      set((state) => {
        const activeSF2Sheet = state.activeSF2Sheet;
        const attendance = { ...activeSF2Sheet?.attendance };
        const remarks = { ...activeSF2Sheet?.remarks };
        delete attendance[lrn];
        delete remarks[lrn];
        return {
          students: state.students.filter(s => s.lrn !== lrn),
          studentProfiles: state.studentProfiles.filter(s => s.lrn !== lrn),
          classRecords: state.classRecords.filter(r => r.student_lrn !== lrn),
          gradingSheetRecords: state.gradingSheetRecords.filter(r => r.student_lrn !== lrn),
          enrollments: state.enrollments.filter(r => r.student_lrn !== lrn),
          attendanceRecords: state.attendanceRecords.filter(r => r.student_lrn !== lrn),
          observedValues: state.observedValues.filter(r => r.student_lrn !== lrn),
          activeSF2Sheet: activeSF2Sheet ? { ...activeSF2Sheet, attendance, remarks } : null,
          sf2Sheets: state.sf2Sheets.map(sheet => {
            const attendance = { ...sheet.attendance };
            const remarks = { ...sheet.remarks };
            delete attendance[lrn]; delete remarks[lrn];
            return { ...sheet, attendance, remarks };
          }),
        };
      });
      get().showNotification('Student and associated records deleted', 'success');
    } catch (error) {
      console.error('Error deleting student:', error);
      get().showNotification('Failed to delete student. Existing records were preserved.', 'error');
      throw error;
    }
  }),
  importStudentsFromSF1: async (students, sectionName) => {
    try {
      const validStudents = (students || []).filter(s => s && s.lrn && s.lrn.trim());
      
      const outcomeList: SF1RowOutcome[] = [];
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      let conflictedCount = 0;
      let failedCount = 0;

      if (validStudents.length === 0) {
        return {
          count: 0,
          total: 0,
          imported: 0,
          updated: 0,
          skipped: 0,
          conflicted: 0,
          failed: 0,
          outcomes: []
        };
      }

      // Track incoming LRNs within this import file to reject duplicate identities in the same batch
      const seenIncomingLrns = new Set<string>();

      for (const student of validStudents) {
        const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.lrn;
        const incomingLrn = student.lrn.trim();

        // 1. Detect duplicate LRN within the incoming file
        if (seenIncomingLrns.has(incomingLrn)) {
          conflictedCount++;
          outcomeList.push({
            lrn: incomingLrn,
            name: studentName,
            status: 'conflicted',
            error: `Duplicate LRN ${incomingLrn} encountered in the import file. Subsequent row was not applied.`,
          });
          continue;
        }
        seenIncomingLrns.add(incomingLrn);

        // 2. Identify match in database
        // Match by exact LRN
        const matchByLrn = await db.getRecord<Student>('students', incomingLrn);

        // Match by Name + Gender for learners currently having temporary LRN
        let matchByName: Student | null = null;
        if (!matchByLrn) {
          const allDbStudents = await db.getAllRecords<Student>('students');
          const tempMatches = allDbStudents.filter(s =>
            (s.lrn.startsWith('TEMP-') || s.lrn.startsWith('TEMP_')) &&
            s.last_name?.trim().toUpperCase() === student.last_name?.trim().toUpperCase() &&
            s.first_name?.trim().toUpperCase() === student.first_name?.trim().toUpperCase() &&
            (s.middle_name || '').trim().toUpperCase() === (student.middle_name || '').trim().toUpperCase() &&
            (s.name_extension || '').trim().toUpperCase() === (student.name_extension || '').trim().toUpperCase() &&
            s.gender === student.gender
          );

          // If there are multiple same-name learners with temporary LRNs, treat as separate to prevent guessing
          if (tempMatches.length === 1) {
            matchByName = tempMatches[0];
          }
        }

        const existing = matchByLrn || matchByName;
        let resolvedStudent: Student = {
          ...student,
          lrn: incomingLrn,
          student_section: sectionName || student.student_section
        };

        // 3. Compare fields and prompt for merge if differences exist
        if (existing) {
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
            // Interactive conflict resolution without holding any lock or transaction
            const mergedFields = await new Promise<Record<string, string> | null>((resolve) => {
              get().addMergeConflict({
                studentName: `${student.first_name} ${student.last_name}`,
                lrn: incomingLrn,
                diffItems,
                resolve
              });
            });

            if (mergedFields === null) {
              // User skipped this row
              skippedCount++;
              outcomeList.push({
                lrn: incomingLrn,
                name: studentName,
                status: 'skipped',
                details: 'User chose to skip importing this student.'
              });
              continue;
            }

            resolvedStudent = {
              ...resolvedStudent,
              ...mergedFields
            };
          }
        }

        // 4. Perform durable write using withLearnerMutation
        try {
          await withLearnerMutation(async () => {
            if (existing) {
              // Reload fresh record from DB after interactive conflict resolution
              const freshExisting = await db.getRecord<Student>('students', existing.lrn);
              if (!freshExisting) {
                throw new Error(`Original student record for LRN ${existing.lrn} was removed concurrently.`);
              }

              if (freshExisting.lrn !== resolvedStudent.lrn) {
                // Temporary to official LRN upgrade
                const collision = await db.getRecord<Student>('students', resolvedStudent.lrn);
                if (collision) {
                  throw new Error(`A learner with the target LRN ${resolvedStudent.lrn} already exists.`);
                }

                const merged: Student = {
                  ...freshExisting,
                  ...resolvedStudent,
                  lrn: resolvedStudent.lrn,
                  grade_level: resolvedStudent.grade_level || freshExisting.grade_level,
                  student_section: resolvedStudent.student_section || sectionName || freshExisting.student_section
                };

                if (freshExisting.awardEvaluations) {
                  merged.awardEvaluations = freshExisting.awardEvaluations.map((ae) => ({
                    ...ae,
                    student_lrn: resolvedStudent.lrn,
                    id: ae.id ? ae.id.replace(freshExisting.lrn, resolvedStudent.lrn) : ae.id,
                  }));
                }

                await persistLearnerUpdate(freshExisting.lrn, merged);
                updatedCount++;
                outcomeList.push({
                  lrn: resolvedStudent.lrn,
                  name: studentName,
                  status: 'updated',
                  details: `Upgraded LRN from ${freshExisting.lrn} to ${resolvedStudent.lrn}`
                });
              } else {
                // Same LRN - update profile
                const merged: Student = {
                  ...freshExisting,
                  ...resolvedStudent,
                  grade_level: resolvedStudent.grade_level || freshExisting.grade_level,
                  student_section: resolvedStudent.student_section || sectionName || freshExisting.student_section
                };
                await persistLearnerUpdate(freshExisting.lrn, merged);
                updatedCount++;
                outcomeList.push({
                  lrn: resolvedStudent.lrn,
                  name: studentName,
                  status: 'updated',
                  details: 'Profile updated with merged fields'
                });
              }
            } else {
              // Brand new student
              const collision = await db.getRecord<Student>('students', resolvedStudent.lrn);
              if (collision) {
                throw new Error(`A learner with LRN ${resolvedStudent.lrn} already exists.`);
              }
              await db.putRecord('students', resolvedStudent);
              importedCount++;
              outcomeList.push({
                lrn: resolvedStudent.lrn,
                name: studentName,
                status: 'imported'
              });
            }
          });
        } catch (rowError) {
          console.error(`Error processing row for ${studentName} (${incomingLrn}):`, rowError);
          const errMsg = rowError instanceof Error ? rowError.message : String(rowError);
          failedCount++;
          outcomeList.push({
            lrn: incomingLrn,
            name: studentName,
            status: 'failed',
            error: errMsg
          });
        }
      }

      // 5. Refresh all in-memory stores after import completion
      const allStudents = await db.getAllRecords<Student>('students');
      const allEnrollments = await db.getAllRecords<Enrollment>('enrollments');
      const allClassRecords = await db.getAllRecords<ClassRecord>('classRecords');
      const allGradingSheetRecords = await db.getAllRecords<ClassRecord>('gradingSheetRecords');
      const allAttendanceRecords = await db.getAllRecords<AttendanceRecord>('attendanceRecords');
      const allObservedValues = await db.getAllRecords<ObservedValues>('observedValues');
      const allSf2Sheets = await db.getAllRecords<SF2Sheet>('sf2Sheets');

      set({
        students: allStudents,
        studentProfiles: allStudents,
        enrollments: allEnrollments,
        classRecords: allClassRecords,
        gradingSheetRecords: allGradingSheetRecords,
        attendanceRecords: allAttendanceRecords,
        observedValues: allObservedValues,
        sf2Sheets: allSf2Sheets,
      });

      const totalSuccess = importedCount + updatedCount;
      if (failedCount > 0 || conflictedCount > 0) {
        get().showNotification(
          `${totalSuccess} processed (${importedCount} new, ${updatedCount} updated), ${skippedCount} skipped, ${failedCount + conflictedCount} issues`,
          failedCount > 0 ? 'error' : 'info'
        );
      } else {
        get().showNotification(
          `${totalSuccess} students imported successfully (${importedCount} new, ${updatedCount} updated)${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`,
          'success'
        );
      }

      return {
        count: totalSuccess,
        total: validStudents.length,
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        conflicted: conflictedCount,
        failed: failedCount,
        outcomes: outcomeList
      };
    } catch (error) {
      console.error('Error importing students from SF1:', error);
      throw error;
    }
  },
  bulkAddStudents: (newStudents) => withLearnerMutation(async () => {
    try {
      if (!newStudents || newStudents.length === 0) return;

      // 1. Validate incoming batch and check for internal duplicate LRNs
      const incomingLrns = new Set<string>();
      const duplicateInBatch: string[] = [];
      for (const student of newStudents) {
        if (!student.lrn || !student.lrn.trim()) {
          throw new Error('All students must have a valid LRN.');
        }
        const trimmedLrn = student.lrn.trim();
        if (incomingLrns.has(trimmedLrn)) {
          duplicateInBatch.push(trimmedLrn);
        }
        incomingLrns.add(trimmedLrn);
      }
      if (duplicateInBatch.length > 0) {
        throw new Error(`Duplicate LRN(s) in batch: ${duplicateInBatch.join(', ')}`);
      }

      // 2. Check for collisions against existing database records to prevent silent replacement
      const collidingLrns: string[] = [];
      for (const lrn of incomingLrns) {
        const existing = await db.getRecord<Student>('students', lrn);
        if (existing) {
          collidingLrns.push(lrn);
        }
      }
      if (collidingLrns.length > 0) {
        throw new Error(
          `Cannot add students. The following LRN(s) already exist: ${collidingLrns.join(', ')}. Use SF1 import or edit existing profiles to update them.`
        );
      }

      // 3. Atomically put all new students
      const changes = [{
        store: 'students' as const,
        puts: newStudents.map(s => ({ ...s, lrn: s.lrn.trim() }))
      }];
      await db.commitRecordChanges(changes);

      // 4. Refresh store
      const allStudents = await db.getAllRecords<Student>('students');
      set({ students: allStudents, studentProfiles: allStudents });
      get().showNotification(`${newStudents.length} students added successfully`, 'success');
    } catch (error) {
      console.error('Error in bulkAddStudents:', error);
      get().showNotification(error instanceof Error ? error.message : 'Failed to add students in bulk', 'error');
      throw error;
    }
  }),
  clearSection: (sectionName) => withLearnerMutation(async () => {
    try {
      // 1. Query all durable records from database, not just in-memory state
      const allDbStudents = await db.getAllRecords<Student>('students');
      const secObj = get().sections.find((s: Section) => s.section_name === sectionName || s.id === sectionName);
      const studentsInSection = allDbStudents.filter((s) => isStudentInSection(s, secObj, sectionName));
      
      if (studentsInSection.length === 0) {
        get().showNotification(`Section ${sectionName} is already empty`, 'info');
        return;
      }

      const lrnsToDelete = studentsInSection.map((s) => s.lrn);

      // 2. Cascade delete all students and their relationships atomically
      await persistLearnersDelete(lrnsToDelete);

      // 3. Refresh in-memory Zustand store completely
      const remainingStudents = await db.getAllRecords<Student>('students');
      const remainingEnrollments = await db.getAllRecords<Enrollment>('enrollments');
      const remainingClassRecords = await db.getAllRecords<ClassRecord>('classRecords');
      const remainingGradingRecords = await db.getAllRecords<ClassRecord>('gradingSheetRecords');
      const remainingAttendance = await db.getAllRecords<AttendanceRecord>('attendanceRecords');
      const remainingObserved = await db.getAllRecords<ObservedValues>('observedValues');
      const remainingSf2Sheets = await db.getAllRecords<SF2Sheet>('sf2Sheets');

      const activeSheet = get().activeSF2Sheet;
      let updatedActiveSheet = activeSheet;
      if (activeSheet) {
        let changed = false;
        const attendance = { ...activeSheet.attendance };
        const remarks = { ...activeSheet.remarks };
        for (const lrn of lrnsToDelete) {
          if (attendance[lrn]) { delete attendance[lrn]; changed = true; }
          if (remarks[lrn]) { delete remarks[lrn]; changed = true; }
        }
        if (changed) {
          updatedActiveSheet = { ...activeSheet, attendance, remarks };
        }
      }

      set({
        students: remainingStudents,
        studentProfiles: remainingStudents,
        enrollments: remainingEnrollments,
        classRecords: remainingClassRecords,
        gradingSheetRecords: remainingGradingRecords,
        attendanceRecords: remainingAttendance,
        observedValues: remainingObserved,
        sf2Sheets: remainingSf2Sheets,
        activeSF2Sheet: updatedActiveSheet,
      });

      get().showNotification(`Cleared ${lrnsToDelete.length} students from ${sectionName}`, 'success');
    } catch (error) {
      console.error('Error clearing section:', error);
      get().showNotification('Failed to clear section', 'error');
      throw error;
    }
  }),

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

    try {
      const oldSection = (await db.getRecord<Section>('sections', sectionToUpdate.id)) || get().sections.find((s) => s.id === sectionToUpdate.id);
      const oldName = oldSection?.section_name;
      const newName = sectionToUpdate.section_name;
      const nameChanged = Boolean(oldName && oldName.trim() !== newName.trim());

      if (nameChanged) {
        // Collision guard: reject renaming if another section already uses newName
        const allSections = await db.getAllRecords<Section>('sections');
        const collision = allSections.find(s => s.id !== sectionToUpdate.id && s.section_name.trim().toLowerCase() === newName.trim().toLowerCase());
        if (collision) {
          throw new Error(`A section named "${newName}" already exists.`);
        }
      }

      const changes: AtomicRecordChange[] = [
        { store: 'sections', puts: [sectionToUpdate] },
      ];

      if (nameChanged && oldName) {
        const allDbStudents = await db.getAllRecords<Student>('students');
        const studentsToUpdate = allDbStudents
          .filter((s) => s.student_section === oldName || s.student_section === sectionToUpdate.id)
          .map((s) => ({ ...s, student_section: newName }));

        if (studentsToUpdate.length > 0) {
          changes.push({ store: 'students', puts: studentsToUpdate });
        }

        const allDbEnrollments = await db.getAllRecords<Enrollment>('enrollments');
        const enrollmentsToUpdate = allDbEnrollments
          .filter((e) => e.student_section === oldName || e.student_section === sectionToUpdate.id)
          .map((e) => ({ ...e, student_section: newName }));

        if (enrollmentsToUpdate.length > 0) {
          changes.push({ store: 'enrollments', puts: enrollmentsToUpdate });
        }
      }

      await db.commitRecordChanges(changes);

      // Publish in-memory state only after successful commit
      const freshSections = await db.getAllRecords<Section>('sections');
      const freshStudents = await db.getAllRecords<Student>('students');
      const freshEnrollments = await db.getAllRecords<Enrollment>('enrollments');
      set({
        sections: freshSections,
        students: freshStudents,
        studentProfiles: freshStudents,
        enrollments: freshEnrollments,
      });

      get().showNotification('Section updated', 'success');
    } catch (error) {
      console.error('Error updating section:', error);
      get().showNotification(error instanceof Error ? error.message : 'Failed to update section', 'error');
      throw error;
    }
  },
  deleteSection: async (id) => {
    try {
      const targetSection = (await db.getRecord<Section>('sections', id)) || get().sections.find((s) => s.id === id);
      if (!targetSection) return;

      const matches = (item: { student_section?: string }) =>
        item.student_section === targetSection.id || item.student_section === targetSection.section_name;

      const allDbStudents = await db.getAllRecords<Student>('students');
      const assignedStudents = allDbStudents.filter(matches);

      const allDbEnrollments = await db.getAllRecords<Enrollment>('enrollments');
      const assignedEnrollments = allDbEnrollments.filter(matches);

      const changes: AtomicRecordChange[] = [
        { store: 'sections', deletes: [id] },
      ];
      if (assignedStudents.length > 0) {
        changes.push({ store: 'students', puts: assignedStudents.map(student => ({ ...student, student_section: '' })) });
      }
      if (assignedEnrollments.length > 0) {
        changes.push({ store: 'enrollments', puts: assignedEnrollments.map(e => ({ ...e, student_section: '' })) });
      }

      await db.commitRecordChanges(changes);

      const freshSections = await db.getAllRecords<Section>('sections');
      const freshStudents = await db.getAllRecords<Student>('students');
      const freshEnrollments = await db.getAllRecords<Enrollment>('enrollments');

      set({
        sections: freshSections,
        students: freshStudents,
        studentProfiles: freshStudents,
        enrollments: freshEnrollments,
      });

      get().showNotification('Section deleted', 'success');
    } catch (error) {
      console.error('Error deleting section:', error);
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
      invalidateResolvedSubjectNameCache();
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
    try {
      const oldSubject = (await db.getRecord<Subject>('subjects', subject.id)) || get().subjects.find(s => s.id === subject.id);
      if (!oldSubject) return;

      const sanitizedSubject: Subject = {
        ...subject,
        subject_name: (subject.subject_name || '').trim()
      };
      const oldName = oldSubject.subject_name;
      const newName = sanitizedSubject.subject_name;
      const nameChanged = oldName.trim() !== newName.trim();

      if (nameChanged) {
        const allSubjects = await db.getAllRecords<Subject>('subjects');
        const collision = allSubjects.find(s =>
          s.id !== subject.id &&
          (s.grade_level || 'all').trim() === (sanitizedSubject.grade_level || 'all').trim() &&
          (s.section_id || 'all').trim() === (sanitizedSubject.section_id || 'all').trim() &&
          normalizeSubjectName(s.subject_name) === normalizeSubjectName(newName)
        );
        if (collision) {
          throw new Error(`A subject named "${newName}" already exists in this grade level.`);
        }
      }

      const allDbSubjects = await db.getAllRecords<Subject>('subjects');
      const allDbSections = await db.getAllRecords<Section>('sections');

      // 1. Rename any duplicate subjects in the same grade level/scope
      const renamedOthers: Subject[] = [];
      if (nameChanged) {
        for (const s of allDbSubjects) {
          if (s.id !== subject.id &&
              s.grade_level === subject.grade_level &&
              (s.section_id || '') === (subject.section_id || '') &&
              (normalizeSubjectName(s.subject_name) === normalizeSubjectName(oldName) || s.subject_name.trim().toLowerCase() === oldName.trim().toLowerCase())) {
            renamedOthers.push({ ...s, subject_name: newName });
          }
        }
      }

      // 2. Propagate name change to sections SCOPED by grade_level and section_id
      const sectionsToUpdate: Section[] = [];
      if (nameChanged) {
        const oldNorm = normalizeSubjectName(oldName);
        for (const sec of allDbSections) {
          // SCOPE CHECK: Only update sections in matching grade level / section_id
          if (subject.grade_level && sec.section_grade_level !== subject.grade_level) {
            continue;
          }
          if (subject.section_id && sec.id !== subject.section_id) {
            continue;
          }

          let changed = false;
          const taught = (sec.taught_subjects || []).map(name => {
            if (name.trim().toLowerCase() === oldName.trim().toLowerCase() || normalizeSubjectName(name) === oldNorm) {
              changed = true;
              return newName;
            }
            return name;
          });
          const teaching = (sec.teaching_subjects || []).map(name => {
            if (name.trim().toLowerCase() === oldName.trim().toLowerCase() || normalizeSubjectName(name) === oldNorm) {
              changed = true;
              return newName;
            }
            return name;
          });

          let nextMeta = sec.section_metadata;
          if (sec.section_metadata?.subjectTerms && oldName in sec.section_metadata.subjectTerms) {
            const nextSubjectTerms = { ...sec.section_metadata.subjectTerms };
            nextSubjectTerms[newName] = nextSubjectTerms[oldName];
            delete nextSubjectTerms[oldName];
            nextMeta = { ...sec.section_metadata, subjectTerms: nextSubjectTerms };
            changed = true;
          }
          if (sec.section_metadata?.hiddenConsolidatedSubjects?.includes(oldName)) {
            const nextHidden = sec.section_metadata.hiddenConsolidatedSubjects.map(n => n === oldName ? newName : n);
            nextMeta = { ...(nextMeta || sec.section_metadata), hiddenConsolidatedSubjects: nextHidden };
            changed = true;
          }

          if (changed) {
            sectionsToUpdate.push({
              ...sec,
              taught_subjects: taught,
              teaching_subjects: teaching,
              ...(nextMeta ? { section_metadata: nextMeta } : {}),
            });
          }
        }
      }

      const classRecordsToUpdate: ClassRecord[] = [];
      const gradingSheetsToUpdate: ClassRecord[] = [];
      const hpsRecordsToUpdate: HPSRecord[] = [];

      if (nameChanged) {
        const oldNorm = normalizeSubjectName(oldName);
        const allClassRecords = await db.getAllRecords<ClassRecord>('classRecords');
        const allGradingSheetRecords = await db.getAllRecords<ClassRecord>('gradingSheetRecords');
        const allHpsRecords = await db.getAllRecords<HPSRecord>('hpsRecords');

        allClassRecords.forEach(r => {
          if (r.subject_id === subject.id || (r.subject_name && normalizeSubjectName(r.subject_name) === oldNorm)) {
            classRecordsToUpdate.push({ ...r, subject_name: newName });
          }
        });

        allGradingSheetRecords.forEach(r => {
          if (r.subject_id === subject.id || (r.subject_name && normalizeSubjectName(r.subject_name) === oldNorm)) {
            gradingSheetsToUpdate.push({ ...r, subject_name: newName });
          }
        });

        allHpsRecords.forEach(r => {
          if (r.subject_id === subject.id || (r.subject_name && normalizeSubjectName(r.subject_name) === oldNorm)) {
            hpsRecordsToUpdate.push({ ...r, subject_name: newName });
          }
        });
      }

      const changes: AtomicRecordChange[] = [
        { store: 'subjects', puts: [sanitizedSubject, ...renamedOthers] },
      ];
      if (sectionsToUpdate.length > 0) {
        changes.push({ store: 'sections', puts: sectionsToUpdate });
      }
      if (classRecordsToUpdate.length > 0) {
        changes.push({ store: 'classRecords', puts: classRecordsToUpdate });
      }
      if (gradingSheetsToUpdate.length > 0) {
        changes.push({ store: 'gradingSheetRecords', puts: gradingSheetsToUpdate });
      }
      if (hpsRecordsToUpdate.length > 0) {
        changes.push({ store: 'hpsRecords', puts: hpsRecordsToUpdate });
      }

      await db.commitRecordChanges(changes);

      // Publish in-memory state only after successful commit
      const freshSubjects = await db.getAllRecords<Subject>('subjects');
      const freshSections = await db.getAllRecords<Section>('sections');
      const freshClassRecords = classRecordsToUpdate.length > 0 ? await db.getAllRecords<ClassRecord>('classRecords') : get().classRecords;
      const freshGradingSheetRecords = gradingSheetsToUpdate.length > 0 ? await db.getAllRecords<ClassRecord>('gradingSheetRecords') : get().gradingSheetRecords;
      const freshHpsRecords = hpsRecordsToUpdate.length > 0 ? await db.getAllRecords<HPSRecord>('hpsRecords') : get().hpsRecords;

      set({
        subjects: freshSubjects,
        sections: freshSections,
        classRecords: freshClassRecords,
        gradingSheetRecords: freshGradingSheetRecords,
        hpsRecords: freshHpsRecords,
      });

      invalidateResolvedSubjectNameCache();
      get().showNotification('Subject updated and teaching loads synchronized', 'success');
    } catch (error) {
      console.error('Error updating subject:', error);
      get().showNotification(error instanceof Error ? error.message : 'Failed to update subject', 'error');
      throw error;
    }
  },
  deleteSubject: async (id) => {
    try {
      const subjectToDelete = (await db.getRecord<Subject>('subjects', id)) || get().subjects.find(s => s.id === id);
      if (!subjectToDelete) return;

      const allDbSections = await db.getAllRecords<Section>('sections');
      const allClassRecords = await db.getAllRecords<ClassRecord>('classRecords');

      // Preserve subject_name on any affected classRecords/gradingSheetRecords before deletion
      const affectedCr = allClassRecords.filter(r => r.subject_id === id && !r.subject_name);
      const updatedCr = affectedCr.map(r => ({ ...r, subject_name: subjectToDelete.subject_name }));

      // Clean up sections SCOPED to the subject's grade_level and section_id
      const sectionsToUpdate: Section[] = [];
      const targetNorm = normalizeSubjectName(subjectToDelete.subject_name);

      for (const sec of allDbSections) {
        if (subjectToDelete.grade_level && sec.section_grade_level !== subjectToDelete.grade_level) {
          continue;
        }
        if (subjectToDelete.section_id && sec.id !== subjectToDelete.section_id) {
          continue;
        }

        const originalTaughtLen = (sec.taught_subjects || []).length;
        const originalTeachingLen = (sec.teaching_subjects || []).length;

        const filteredTaught = (sec.taught_subjects || []).filter(name =>
          normalizeSubjectName(name) !== targetNorm
        );
        const filteredTeaching = (sec.teaching_subjects || []).filter(name =>
          normalizeSubjectName(name) !== targetNorm
        );

        if (filteredTaught.length !== originalTaughtLen || filteredTeaching.length !== originalTeachingLen) {
          sectionsToUpdate.push({
            ...sec,
            taught_subjects: filteredTaught,
            teaching_subjects: filteredTeaching,
          });
        }
      }

      const changes: AtomicRecordChange[] = [
        { store: 'subjects', deletes: [id] },
      ];
      if (updatedCr.length > 0) {
        changes.push({ store: 'classRecords', puts: updatedCr });
      }
      if (sectionsToUpdate.length > 0) {
        changes.push({ store: 'sections', puts: sectionsToUpdate });
      }

      await db.commitRecordChanges(changes);

      const freshSubjects = await db.getAllRecords<Subject>('subjects');
      const freshSections = await db.getAllRecords<Section>('sections');
      const freshClassRecords = await db.getAllRecords<ClassRecord>('classRecords');
      set({
        subjects: freshSubjects,
        sections: freshSections,
        classRecords: freshClassRecords,
      });
      invalidateResolvedSubjectNameCache();

      get().showNotification('Subject deleted and teaching loads updated', 'success');
    } catch (error) {
      console.error('Error deleting subject:', error);
      get().showNotification('Failed to delete subject', 'error');
      throw error;
    }
  },
  deleteSubjectsBulk: async (ids: string[]) => {
    try {
      if (!ids || ids.length === 0) return;

      const allDbSubjects = await db.getAllRecords<Subject>('subjects');
      const subjectsToDelete = allDbSubjects.filter(s => ids.includes(s.id));
      if (subjectsToDelete.length === 0) return;

      const allDbSections = await db.getAllRecords<Section>('sections');
      const allClassRecords = await db.getAllRecords<ClassRecord>('classRecords');

      // Preserve subject_name on affected grade records before deletion
      const subjectMap = new Map(subjectsToDelete.map(s => [s.id, s.subject_name]));
      const affectedCr = allClassRecords.filter(r => ids.includes(r.subject_id) && !r.subject_name);
      const updatedCr = affectedCr.map(r => ({ ...r, subject_name: subjectMap.get(r.subject_id) || '' }));

      // Clean up sections SCOPED to each subject's grade_level and section_id
      const sectionsToUpdate: Section[] = [];
      for (const sec of allDbSections) {
        let changed = false;
        let taught = [...(sec.taught_subjects || [])];
        let teaching = [...(sec.teaching_subjects || [])];

        for (const subj of subjectsToDelete) {
          if (subj.grade_level && sec.section_grade_level !== subj.grade_level) {
            continue;
          }
          if (subj.section_id && sec.id !== subj.section_id) {
            continue;
          }
          const norm = normalizeSubjectName(subj.subject_name);
          const newTaught = taught.filter(name => normalizeSubjectName(name) !== norm);
          if (newTaught.length !== taught.length) {
            taught = newTaught;
            changed = true;
          }
          const newTeaching = teaching.filter(name => normalizeSubjectName(name) !== norm);
          if (newTeaching.length !== teaching.length) {
            teaching = newTeaching;
            changed = true;
          }
        }

        if (changed) {
          sectionsToUpdate.push({
            ...sec,
            taught_subjects: taught,
            teaching_subjects: teaching,
          });
        }
      }

      const changes: AtomicRecordChange[] = [
        { store: 'subjects', deletes: ids },
      ];
      if (updatedCr.length > 0) {
        changes.push({ store: 'classRecords', puts: updatedCr });
      }
      if (sectionsToUpdate.length > 0) {
        changes.push({ store: 'sections', puts: sectionsToUpdate });
      }

      await db.commitRecordChanges(changes);

      const freshSubjects = await db.getAllRecords<Subject>('subjects');
      const freshSections = await db.getAllRecords<Section>('sections');
      const freshClassRecords = await db.getAllRecords<ClassRecord>('classRecords');
      set({
        subjects: freshSubjects,
        sections: freshSections,
        classRecords: freshClassRecords,
      });

      get().showNotification(`${ids.length} subjects deleted`, 'success');
    } catch (error) {
      console.error('Error deleting subjects in bulk:', error);
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

        // Check if learner has recorded grades in sourceSchoolYear with a failing final average (< 75)
        const learnerSourceGrades = [
          ...state.gradingSheetRecords.filter((r: ClassRecord) => r.student_lrn === lrn && r.school_year === sourceSchoolYear && Number(r.final_grade) > 0),
          ...state.classRecords.filter((r: ClassRecord) => r.student_lrn === lrn && r.school_year === sourceSchoolYear && Number(r.final_grade) > 0),
        ];
        if (learnerSourceGrades.length > 0) {
          const avg = Math.round(
            learnerSourceGrades.reduce((sum, r) => sum + Number(r.final_grade), 0) / learnerSourceGrades.length
          );
          if (avg < 75) continue; // Retained learners are not auto-promoted to the next grade level
        }

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
      const state = get();
      const targetSection = state.sections.find(
        (s: Section) => s.id === targetSectionId || s.section_name === targetSectionId
      );
      if (!targetSection) {
        throw new Error('Destination section not found.');
      }
      const existingStudent =
        (await db.getRecord<Student>('students', lrn)) ||
        state.students.find((s: Student) => s.lrn === lrn);
      if (!existingStudent) {
        throw new Error(`Learner with LRN ${lrn} was not found.`);
      }

      const targetSchoolYear = state.activeSchoolYear;
      const updatedStudent: Student = {
        ...existingStudent,
        grade_level: targetSection.section_grade_level,
        student_section: targetSection.section_name,
      };
      const enrollment: Enrollment = {
        id: `enroll-${lrn}-${targetSchoolYear}`,
        student_lrn: lrn,
        school_year: targetSchoolYear,
        grade_level: targetSection.section_grade_level,
        student_section: targetSection.section_name,
        enrolled_at: new Date().toISOString(),
      };

      await db.commitRecordChanges([
        { store: 'students', puts: [updatedStudent] },
        { store: 'enrollments', puts: [enrollment] },
      ]);

      const nextStudents = state.students.map((s: Student) =>
        s.lrn === lrn ? updatedStudent : s
      );
      const nextEnrollments = [
        ...state.enrollments.filter((e: Enrollment) => e.id !== enrollment.id),
        enrollment,
      ];
      set({
        students: nextStudents,
        studentProfiles: nextStudents,
        enrollments: nextEnrollments,
      });
      get().showNotification(
        `Enrolled ${updatedStudent.last_name}, ${updatedStudent.first_name} in ${targetSection.section_grade_level} - ${targetSection.section_name}`,
        'success'
      );
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
export async function initializePublicAppProfile(): Promise<void> {
  if (typeof indexedDB !== 'undefined') await db.resumePendingRestoreSettings();
  const profiles = await db.getAllRecords<SchoolProfile>('schoolProfile');
  const schoolProfile =
    profiles.find(p => p && p.school_id && p.school_id !== defaultSchoolProfile.school_id && p.name && p.name.trim() && p.name.trim() !== 'School Name') ??
    profiles.find(p => p && p.name && p.name.trim() && p.name.trim() !== 'School Name') ??
    profiles.find(p => p && p.school_id && p.school_id !== defaultSchoolProfile.school_id) ??
    profiles[0] ?? defaultSchoolProfile;
  useAppStore.setState({ schoolProfile, isSyncReady: true });
}

export async function initializeAppStore() {
  const loadStore = async <T>(name: string): Promise<T[]> => db.getAllRecords<T>(name);

  try {
    // A previous restore may have committed its database transaction just
    // before the process stopped. Complete its idempotent settings step first.
    if (typeof indexedDB !== 'undefined') await db.resumePendingRestoreSettings();
    // Phase 1: load data needed before making decisions, all in parallel
    const [students, sections, rawSubjects, allProfiles] = await Promise.all([
      loadStore<Student>('students'),
      loadStore<Section>('sections'),
      loadStore<Subject>('subjects'),
      db.getAllRecords<SchoolProfile>('schoolProfile'),
    ]);

    // Subject names are teacher-owned data, including "Specialization".
    const subjects: Subject[] = rawSubjects.map(s => ({
      ...s,
      term: s.term !== undefined && s.term !== null ? s.term : getDefaultTermForSubject(s.subject_name, s.grade_level)
    }));
    invalidateResolvedSubjectNameCache();

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

    // Attendance/SF2 repair requires an explicit, previewable migration. Loading
    // a teacher's records must not silently rewrite either store.


    const advisorySection = sections.find(s => s.is_advisory || (s as Section & { is_advisory_class?: boolean }).is_advisory_class);
    const persistedSelectedSection = getLocalStorageValue(SELECTED_SECTION_STORAGE_KEY);
    const hasPersistedSection = !!persistedSelectedSection && sections.some(
      s => s.id === persistedSelectedSection || s.section_name === persistedSelectedSection
    );
    
    // Loading records must never rewrite teacher-owned names, rosters, subjects,
    // or advisory assignments based on fixture-like text or inferred curriculum.
    // Any future migration needs explicit provenance, a preview and consent.
    const finalSections = sections;
    const finalSubjectsWithMigration = finalSubjects;



    // Startup is intentionally non-destructive. Recovery and test-data cleanup are
    // explicit user actions, never a side effect of loading the local database.
    const finalStudents = students;
    const finalClassRecords = classRecords;
    const finalGradingSheetRecords = gradingSheetRecords;
    const finalAttendanceRecords = attendanceRecords;
    const finalSf2Sheets = sf2Sheets;
    const finalEnrollments = enrollments;

    const finalSchoolProfile = schoolProfile;

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

    useAppStore.setState({
      activeSchoolYear: resolvedSchoolYear,
      students: finalStudents,
      studentProfiles: finalStudents,
      sections: finalSections,
      subjects: finalSubjectsWithMigration,
      classRecords: finalClassRecords,
      gradingSheetRecords: finalGradingSheetRecords,
      hpsRecords,
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
    useAppStore.setState({ isSyncReady: false });
    throw error;
  }
}
