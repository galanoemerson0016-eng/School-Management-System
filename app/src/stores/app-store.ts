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

interface AppState {
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

  // Class Records (Grades)
  classRecords: ClassRecord[];
  setClassRecords: (records: ClassRecord[]) => void;
  addClassRecord: (record: ClassRecord) => Promise<void>;
  updateClassRecord: (record: ClassRecord) => Promise<void>;
  deleteClassRecord: (id: string) => Promise<void>;

  // Grading Sheet Records (separate from E-Class records)
  gradingSheetRecords: ClassRecord[];
  setGradingSheetRecords: (records: ClassRecord[]) => void;
  updateGradingSheetRecord: (record: ClassRecord) => Promise<void>;
  deleteGradingSheetRecord: (id: string) => Promise<void>;
  clearGradingSheet: () => Promise<void>;

  // Enrollments
  enrollments: Enrollment[];
  setEnrollments: (enrollments: Enrollment[]) => void;
  addEnrollment: (enrollment: Enrollment) => Promise<void>;
  promoteStudentsFromYear: (sourceSchoolYear: string, sourceGradeLevel: string, targetSectionId: string) => Promise<number>;
  enrollReturningStudent: (lrn: string, targetSectionId: string) => Promise<void>;

  // Announcements
  announcements: Announcement[];
  setAnnouncements: (announcements: Announcement[]) => void;
  addAnnouncement: (announcement: Announcement) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;

  // Observed Values
  observedValues: ObservedValues[];
  setObservedValues: (values: ObservedValues[]) => void;
  updateObservedValue: (value: ObservedValues) => Promise<void>;

  // HPS Records
  hpsRecords: HPSRecord[];
  setHpsRecords: (records: HPSRecord[]) => void;
  updateHPSRecord: (record: HPSRecord) => Promise<void>;

  // SF2 Attendance Persistence
  activeSF2Sheet: SF2Sheet | null;
  sf2Sheets: SF2Sheet[];
  setSF2Sheets: (sheets: SF2Sheet[]) => void;
  fetchSF2Sheet: (sectionId: string, month: string) => Promise<void>;
  saveSF2Sheet: (sheet: SF2Sheet) => Promise<void>;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: (records: AttendanceRecord[]) => void;

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

  // Backup & Restore
  createBackup: (label?: string) => Promise<void>;
  restoreFromFile: (file: File) => Promise<void>;
  listBackups: () => Promise<void>;
  lastBackupTime: number | null;
  setLastBackupTime: (time: number | null) => void;
}

const defaultSchoolProfile: SchoolProfile = {
  school_id: '',
  name: 'School Name',
  region: '',
  division: '',
  district: '',
  head_name: '',
  head_position: 'Principal I',
  grade_levels_offered: 'Grade 7 - 12',
  adviser_name: '',
  grade_level: 'Grade 7',
  section: 'Einstein',
  is_activated: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  // ==================== SCHOOL PROFILE ====================
  schoolProfile: defaultSchoolProfile,
  setSchoolProfile: (profile) => set({ schoolProfile: profile }),
  updateSchoolProfile: async (profile) => {
    try {
      const currentProfile = get().schoolProfile;
      const updated = { ...currentProfile, ...profile };

      // If the school_id changed, delete the old record first so we don't
      // leave a stale default entry (e.g. '123456') sitting in IndexedDB.
      if (currentProfile.school_id && currentProfile.school_id !== updated.school_id) {
        await db.deleteRecord('schoolProfile', currentProfile.school_id);
      }

      set({ schoolProfile: updated });
      await db.putRecord('schoolProfile', updated);
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

      const updated = { ...existing, ...updates };
      set((state) => ({
        students: state.students.map((s) => (s.lrn === lrn ? updated : s)),
      }));
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
    try {
      set((state) => ({ students: state.students.filter((s) => s.lrn !== lrn) }));
      await db.deleteRecord('students', lrn);
      get().showNotification('Student deleted', 'success');
    } catch (error) {
      console.error('Error deleting student:', error);
      set({ students: previousStudents });
      get().showNotification('Failed to delete student', 'error');
      throw error;
    }
  },
  importStudentsFromSF1: async (students, sectionName) => {
    try {
      let count = 0;
      const validStudents = students.filter(s => s && s.lrn);
      
      for (const student of validStudents) {
        await db.putRecord('students', student);
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
      for (const student of newStudents) {
        await db.putRecord('students', student);
      }
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
      set((state) => ({
        students: state.students.filter((s) => s.student_section !== sectionName),
      }));
      get().showNotification('Section cleared', 'success');
    } catch (error) {
      console.error('Error clearing section:', error);
      throw error;
    }
  },

  // ==================== SECTIONS ====================
  sections: [],
  setSections: (sections) => set({ sections }),
  addSection: async (section) => {
    try {
      set((state) => ({ sections: [...state.sections, section] }));
      await db.putRecord('sections', section);
      get().showNotification('Section added', 'success');
    } catch (error) {
      console.error('Error adding section:', error);
      get().showNotification('Failed to add section', 'error');
      set((state) => ({ sections: state.sections.filter((s) => s.id !== section.id) }));
      throw error;
    }
  },
  updateSection: async (section) => {
    try {
      set((state) => ({
        sections: state.sections.map((s) => (s.id === section.id ? section : s)),
      }));
      await db.putRecord('sections', section);
      get().showNotification('Section updated', 'success');
    } catch (error) {
      console.error('Error updating section:', error);
      get().showNotification('Failed to update section', 'error');
      throw error;
    }
  },
  deleteSection: async (id) => {
    const previousSections = get().sections;
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
      set((state) => ({ subjects: [...state.subjects, subject] }));
      await db.putRecord('subjects', subject);
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
      set((state) => ({
        subjects: state.subjects.map((s) => (s.id === subject.id ? subject : s)),
      }));
      await db.putRecord('subjects', subject);
      get().showNotification('Subject updated', 'success');
    } catch (error) {
      console.error('Error updating subject:', error);
      get().showNotification('Failed to update subject', 'error');
      throw error;
    }
  },
  deleteSubject: async (id) => {
    const previousSubjects = get().subjects;
    try {
      set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) }));
      await db.deleteRecord('subjects', id);
      get().showNotification('Subject deleted', 'success');
    } catch (error) {
      console.error('Error deleting subject:', error);
      set({ subjects: previousSubjects });
      get().showNotification('Failed to delete subject', 'error');
      throw error;
    }
  },

  // ==================== CLASS RECORDS ====================
  classRecords: [],
  setClassRecords: (records) => set({ classRecords: records }),
  addClassRecord: async (record) => {
    try {
      set((state) => ({ classRecords: [...state.classRecords, record] }));
      await db.putRecord('classRecords', record);
      get().showNotification('Grade recorded', 'success');
    } catch (error) {
      console.error('Error adding class record:', error);
      get().showNotification('Failed to record grade', 'error');
      set((state) => ({ classRecords: state.classRecords.filter((r) => r.id !== record.id) }));
      throw error;
    }
  },
  updateClassRecord: async (record) => {
    try {
      const existing = get().classRecords.find(r => r.id === record.id);
      if (existing) {
        set((state) => ({
          classRecords: state.classRecords.map((r) => (r.id === record.id ? record : r)),
        }));
      } else {
        set((state) => ({
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
    const previousRecords = get().classRecords;
    try {
      set((state) => ({ classRecords: state.classRecords.filter((r) => r.id !== id) }));
      await db.deleteRecord('classRecords', id);
      get().showNotification('Grade deleted', 'success');
    } catch (error) {
      console.error('Error deleting class record:', error);
      set({ classRecords: previousRecords });
      get().showNotification('Failed to delete grade', 'error');
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
      // Stub: Implement promotion logic
      get().showNotification('Students promoted', 'success');
      return 0;
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

  // ==================== ANNOUNCEMENTS ====================
  announcements: [],
  setAnnouncements: (announcements) => set({ announcements }),
  addAnnouncement: async (announcement) => {
    try {
      set((state) => ({ announcements: [...state.announcements, announcement] }));
      await db.putRecord('announcements', announcement);
      get().showNotification('Announcement posted', 'success');
    } catch (error) {
      console.error('Error adding announcement:', error);
      get().showNotification('Failed to post announcement', 'error');
      set((state) => ({ announcements: state.announcements.filter((a) => a.id !== announcement.id) }));
      throw error;
    }
  },
  deleteAnnouncement: async (id) => {
    const previousAnnouncements = get().announcements;
    try {
      set((state) => ({ announcements: state.announcements.filter((a) => a.id !== id) }));
      await db.deleteRecord('announcements', id);
      get().showNotification('Announcement deleted', 'success');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      set({ announcements: previousAnnouncements });
      get().showNotification('Failed to delete announcement', 'error');
      throw error;
    }
  },

  // ==================== GRADING SHEET RECORDS ====================
  gradingSheetRecords: [],
  setGradingSheetRecords: (records) => set({ gradingSheetRecords: records }),
  updateGradingSheetRecord: async (record) => {
    try {
      const existing = get().gradingSheetRecords.find(r => r.id === record.id);
      if (existing) {
        set((state) => ({
          gradingSheetRecords: state.gradingSheetRecords.map((r) => (r.id === record.id ? record : r)),
        }));
      } else {
        set((state) => ({
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
    const previousRecords = get().gradingSheetRecords;
    try {
      set((state) => ({ gradingSheetRecords: state.gradingSheetRecords.filter((r) => r.id !== id) }));
      await db.deleteRecord('gradingSheetRecords', id);
    } catch (error) {
      console.error('Error deleting grading sheet record:', error);
      set({ gradingSheetRecords: previousRecords });
      throw error;
    }
  },
  clearGradingSheet: async () => {
    try {
      set({ gradingSheetRecords: [] });
      await db.clearStore('gradingSheetRecords');
      get().showNotification('All grading records cleared', 'success');
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
      const existing = get().observedValues.find(v => v.id === value.id);
      if (existing) {
        set((state) => ({
          observedValues: state.observedValues.map((v) => (v.id === value.id ? value : v)),
        }));
      } else {
        set((state) => ({
          observedValues: [...state.observedValues, value],
        }));
      }
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
      const existing = get().hpsRecords.find(r => r.id === record.id);
      if (existing) {
        set((state) => ({
          hpsRecords: state.hpsRecords.map((r) => (r.id === record.id ? record : r)),
        }));
      } else {
        set((state) => ({
          hpsRecords: [...state.hpsRecords, record],
        }));
      }
      await db.putRecord('hpsRecords', record);
    } catch (error) {
      console.error('Error updating HPS record:', error);
      throw error;
    }
  },

  // ==================== SF2 SHEETS ====================
  activeSF2Sheet: null,
  sf2Sheets: [],
  setSF2Sheets: (sheets) => set({ sf2Sheets: sheets }),
  fetchSF2Sheet: async (sectionId, month) => {
    try {
      const sy = get().activeSchoolYear;
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
      set((state) => ({
        sf2Sheets: [...state.sf2Sheets.filter((s) => s.id !== sheet.id), sheet],
        activeSF2Sheet: sheet
      }));
    } catch (error) {
      console.error('Error saving SF2 sheet:', error);
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
  attendanceRecords: [],
  setAttendanceRecords: (records) => set({ attendanceRecords: records }),

  // ==================== UI STATE ====================
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),
  selectedSection: null,
  setSelectedSection: (section) => set({ selectedSection: section }),
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
      // Reload data
      const students = await db.getAllRecords<Student>('students');
      const sections = await db.getAllRecords<Section>('sections');
      const subjects = await db.getAllRecords<Subject>('subjects');
      const classRecords = await db.getAllRecords<ClassRecord>('classRecords');
      const announcements = await db.getAllRecords<Announcement>('announcements');
      const allProfiles = await db.getAllRecords<SchoolProfile>('schoolProfile');
      const schoolProfile = allProfiles.length > 0 ? allProfiles[0] : undefined;

      set({
        students,
        sections,
        subjects,
        classRecords,
        announcements,
        schoolProfile: schoolProfile || defaultSchoolProfile,
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
    const students = await loadStore<Student>('students');
    const sections = await loadStore<Section>('sections');
    const subjects = await loadStore<Subject>('subjects');
    // Load the school profile by fetching all records.
    // We do NOT use the hardcoded default school_id as the lookup key because
    // the client may have changed their School ID, which changes the stored key.
    // If somehow multiple records exist (legacy), prefer the non-default one.
    const allProfiles = await db.getAllRecords<SchoolProfile>('schoolProfile');
    const schoolProfile =
      allProfiles.find(p => p.school_id !== defaultSchoolProfile.school_id) ??
      allProfiles[0] ??
      undefined;
    const finalSubjects = schoolProfile ? subjects : [];

    const classRecords = await loadStore<ClassRecord>('classRecords');
    const enrollments = await loadStore<Enrollment>('enrollments');
    const announcements = await loadStore<Announcement>('announcements');
    const attendanceRecords = await loadStore<AttendanceRecord>('attendanceRecords');
    const gradingSheetRecords = await loadStore<ClassRecord>('gradingSheetRecords');
    const hpsRecords = await loadStore<HPSRecord>('hpsRecords');
    const sf2Sheets = await loadStore<SF2Sheet>('sf2Sheets');


    const advisorySection = sections.find(s => s.is_advisory || (s as any).is_advisory_class);
    
    useAppStore.setState({
      students,
      studentProfiles: students,
      sections,
      subjects: finalSubjects,
      classRecords,
      gradingSheetRecords,
      hpsRecords,
      enrollments,
      announcements,
      attendanceRecords,
      sf2Sheets,
      schoolProfile: schoolProfile || defaultSchoolProfile,
      isSyncReady: true,
      selectedSection: advisorySection ? advisorySection.section_name : null
    });

    // Check for daily backup
    await backup.checkAndCreateDailyBackup();

    // Load last backup time
    try {
      const backups = await backup.listBackups();
      if (backups.length > 0) {
        const latest = backups.reduce((prev, curr) => 
          (curr.timestamp > prev.timestamp) ? curr : prev
        );
        useAppStore.setState({ lastBackupTime: latest.timestamp });
      }
    } catch (e) {
      console.warn('Could not load backups list:', e);
    }

    console.log('✅ App store initialized with local data');
  } catch (error) {
    console.error('Critical error during app initialization:', error);
    useAppStore.setState({ isSyncReady: true });
  }
}
