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
import { announcementSync } from '../services/announcement-sync';
import { normalizeSubjectName } from '../lib/subjectConfig';
import { STANDARD_SUBJECTS, getDefaultTermForSubject } from '../lib/curriculum';

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
  deleteSubjectsBulk: (ids: string[]) => Promise<void>;

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
  deleteAnnouncementFromCloud: (cloudId: string) => Promise<void>;

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

  // Cloud Sync Settings
  cloudSyncEnabled: boolean;
  setCloudSyncEnabled: (enabled: boolean) => void;

  // Backup & Restore
  createBackup: (label?: string) => Promise<void>;
  restoreFromFile: (file: File) => Promise<void>;
  listBackups: () => Promise<void>;
  lastBackupTime: number | null;
  setLastBackupTime: (time: number | null) => void;
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
    void sectionName;
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
    const oldSection = get().sections.find((s) => s.id === section.id);
    const oldName = oldSection?.section_name;
    const newName = section.section_name;
    const nameChanged = oldName && oldName !== newName;

    try {
      set((state) => ({
        sections: state.sections.map((s) => (s.id === section.id ? section : s)),
      }));
      await db.putRecord('sections', section);

      if (nameChanged) {
        // Cascade changes to students list
        const updatedStudents = get().students.map((student) => {
          if (student.student_section === oldName || student.student_section === section.id) {
            return { ...student, student_section: newName };
          }
          return student;
        });

        for (const s of updatedStudents) {
          if (s.student_section === newName) {
            await db.putRecord('students', s);
          }
        }

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

        for (const e of updatedEnrollments) {
          if (e.student_section === newName) {
            await db.putRecord('enrollments', e);
          }
        }

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
    const previousSubjects = get().subjects;
    const previousSections = get().sections;
    const oldSubject = previousSubjects.find(s => s.id === subject.id);
    
    if (!oldSubject) return;

    const oldName = oldSubject.subject_name;
    const newName = subject.subject_name;
    const nameChanged = normalizeSubjectName(oldName) !== normalizeSubjectName(newName);

    try {
      // 1. Update subjects
      // If the name changed, we also rename any OTHER subjects in the same grade 
      // that have the same old name (to clean up duplicates)
      const newSubjects = get().subjects.map((s) => {
        if (s.id === subject.id) return subject;
        if (nameChanged && s.grade_level === subject.grade_level && normalizeSubjectName(s.subject_name) === normalizeSubjectName(oldName)) {
          return { ...s, subject_name: newName };
        }
        return s;
      });
      
      // 2. Propagate name change to sections if necessary
      let newSections = previousSections;
      if (nameChanged) {
        newSections = previousSections.map(sec => ({
          ...sec,
          taught_subjects: sec.taught_subjects?.map(name => 
            normalizeSubjectName(name) === normalizeSubjectName(oldName) ? newName : name
          ) || []
        }));
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
          if (JSON.stringify(prevSec?.taught_subjects) !== JSON.stringify(sec.taught_subjects)) {
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
          ) || []
        };
      });

      set({ subjects: newSubjects, sections: newSections });
      
      await db.deleteRecord('subjects', id);
      
      // Persist section changes to database
      if (subjectToDelete) {
        for (const sec of newSections) {
          const prevSec = previousSections.find(ps => ps.id === sec.id);
          if (JSON.stringify(prevSec?.taught_subjects) !== JSON.stringify(sec.taught_subjects)) {
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
          ) || []
        };
      });

      set({ subjects: newSubjects, sections: newSections });
      
      // Persist to DB
      for (const id of ids) {
        await db.deleteRecord('subjects', id);
      }
      
      for (const sec of newSections) {
        const prevSec = previousSections.find(ps => ps.id === sec.id);
        if (JSON.stringify(prevSec?.taught_subjects) !== JSON.stringify(sec.taught_subjects)) {
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
        await db.putRecord('students', promotedStudent);

        const enrollment: Enrollment = {
          id: `enroll-${lrn}-${targetSchoolYear}`,
          student_lrn: lrn,
          school_year: targetSchoolYear,
          grade_level: targetSection.section_grade_level,
          student_section: targetSection.section_name,
          enrolled_at: timestamp,
        };
        newEnrollments.push(enrollment);
        await db.putRecord('enrollments', enrollment);
      }

      const promoted = newEnrollments.length;
      if (promoted > 0) {
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

  // ==================== ANNOUNCEMENTS ====================
  announcements: [],
  setAnnouncements: (announcements) => set({ announcements }),
  addAnnouncement: async (announcement) => {
    try {
      set((state) => ({ announcements: [...state.announcements, announcement] }));
      await db.putRecord('announcements', announcement);
      get().showNotification('Announcement posted', 'success');

      // Auto-publish to cloud if enabled and school_id exists, and it's NOT already a cloud-sourced announcement
      const state = get();
      // Get author ID from local storage or session
      const authorId = localStorage.getItem('auth_user_uid') || 'anonymous';
      
      if (state.cloudSyncEnabled && state.schoolProfile.school_id && !announcement.is_cloud) {
        try {
          await announcementSync.publishToCloud(announcement, state.schoolProfile.school_id, authorId);
        } catch (err) {
          console.error('Failed to sync announcement to cloud:', err);
        }
      }
    } catch (error) {
      console.error('Error adding announcement:', error);
      get().showNotification('Failed to post announcement', 'error');
      set((state) => ({ announcements: state.announcements.filter((a) => a.id !== announcement.id) }));
      throw error;
    }
  },
  deleteAnnouncement: async (id) => {
    const previousAnnouncements = get().announcements;
    const target = previousAnnouncements.find(a => a.id === id);
    
    try {
      set((state) => ({ announcements: state.announcements.filter((a) => a.id !== id) }));
      await db.deleteRecord('announcements', id);
      
      // If it's a cloud announcement, also delete from cloud (if sync enabled)
      // Note: Firebase rules will verify if the user is actually the author
      if (target && target.is_cloud && get().cloudSyncEnabled) {
          await announcementSync.deleteFromCloud(id);
      }
      
      get().showNotification('Announcement deleted', 'success');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      set({ announcements: previousAnnouncements });
      get().showNotification('Failed to delete announcement', 'error');
      throw error;
    }
  },
  deleteAnnouncementFromCloud: async (cloudId) => {
      try {
          await announcementSync.deleteFromCloud(cloudId);
          set((state) => ({ announcements: state.announcements.filter((a) => a.id !== cloudId) }));
          await db.deleteRecord('announcements', cloudId);
      } catch (err) {
          console.error('Cloud delete failed:', err);
          throw err;
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
      const subjects = await db.getAllRecords<Subject>('subjects');
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
    let subjects = await loadStore<Subject>('subjects');
    // Load the school profile by fetching all records.
    // We do NOT use the hardcoded default school_id as the lookup key because
    // the client may have changed their School ID, which changes the stored key.
    // If somehow multiple records exist (legacy), prefer the non-default one.
    const allProfiles = await db.getAllRecords<SchoolProfile>('schoolProfile');
    const schoolProfile =
      allProfiles.find(p => p.school_id !== defaultSchoolProfile.school_id) ??
      allProfiles[0] ??
      undefined;

    // Auto-load all subjects for all grade levels if none are loaded
    if (subjects.length === 0) {
      console.log('Auto-loading all subjects for all grade levels right away...');
      const timestamp = Date.now();
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
        'Specialization',
        '*Arabic Language',
        '*Islamic Values Education',
      ];
      
      const normalizeLabel = (val: string) => val.toLowerCase().replace(/\s+/g, ' ').replace(/\s*\([^)]*\)/g, '').trim();

      for (const grade of grades) {
        const templates = STANDARD_SUBJECTS[grade as keyof typeof STANDARD_SUBJECTS];
        if (!templates) continue;

        for (let i = 0; i < templates.length; i++) {
          const template = templates[i];
          const subjectId = `subject-${timestamp}-${grade.replace(/\s+/g, '-')}-${i}-${Math.random().toString(36).substr(2, 5)}`;
          
          const newSubject: Subject = {
            id: subjectId,
            subject_name: template.name,
            subject_code: template.code,
            grade_level: grade,
            term: getDefaultTermForSubject(template.name, grade),
            order: universalOrder.findIndex((name) => normalizeLabel(name) === normalizeLabel(template.name))
          };
          
          await db.putRecord('subjects', newSubject);
          subjects.push(newSubject);
        }
      }
    }
    const finalSubjects = subjects;

    const classRecords = await loadStore<ClassRecord>('classRecords');
    const enrollments = await loadStore<Enrollment>('enrollments');
    const announcements = await loadStore<Announcement>('announcements');
    const attendanceRecords = await loadStore<AttendanceRecord>('attendanceRecords');
    const gradingSheetRecords = await loadStore<ClassRecord>('gradingSheetRecords');
    const hpsRecords = await loadStore<HPSRecord>('hpsRecords');
    const sf2Sheets = await loadStore<SF2Sheet>('sf2Sheets');
    const observedValues = await loadStore<ObservedValues>('observedValues');


    const advisorySection = sections.find(s => s.is_advisory || (s as Section & { is_advisory_class?: boolean }).is_advisory_class);
    const persistedSelectedSection = getLocalStorageValue(SELECTED_SECTION_STORAGE_KEY);
    const hasPersistedSection = !!persistedSelectedSection && sections.some(
      s => s.id === persistedSelectedSection || s.section_name === persistedSelectedSection
    );
    const resolvedSelectedSection = hasPersistedSection
      ? persistedSelectedSection
      : (advisorySection ? advisorySection.section_name : null);
    
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
      observedValues,
      schoolProfile: schoolProfile || defaultSchoolProfile,
      isSyncReady: true,
      selectedSection: resolvedSelectedSection
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
