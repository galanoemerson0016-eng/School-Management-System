import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { SchoolProfile, Student, Section, Subject, Announcement, ClassRecord, ObservedValues, HPSRecord, SF2Sheet } from '../types';
import {
    defaultSchoolProfile
} from '../lib/initial-data';
import type { User } from '../types';

interface AppState {
    // School profile
    schoolProfile: SchoolProfile;
    setSchoolProfile: (profile: SchoolProfile) => void;
    updateSchoolProfile: (profile: SchoolProfile) => Promise<void>;

    // Active school year
    activeSchoolYear: string;
    setActiveSchoolYear: (sy: string) => void;

    // Students
    students: Student[];
    setStudents: (students: Student[]) => void;
    addStudent: (student: Student) => Promise<void>;
    updateStudent: (lrn: string, student: Partial<Student>) => Promise<void>;
    deleteStudent: (lrn: string) => Promise<void>;
    clearSection: (sectionName: string) => Promise<void>;

    // Teachers (Users)
    teachers: User[];
    setTeachers: (teachers: User[]) => void;


    // Sections
    sections: Section[];
    setSections: (sections: Section[]) => void;
    addSection: (section: Section) => Promise<void>;
    updateSection: (section: Section) => Promise<void>; // Added
    deleteSection: (id: string) => Promise<void>;

    // Subjects
    subjects: Subject[];
    setSubjects: (subjects: Subject[]) => void;
    addSubject: (subject: Subject) => Promise<void>;
    updateSubject: (subject: Subject) => Promise<void>; // Added
    deleteSubject: (id: string) => Promise<void>;

    // Announcements
    announcements: Announcement[];
    setAnnouncements: (announcements: Announcement[]) => void;
    addAnnouncement: (announcement: Announcement) => Promise<void>;
    deleteAnnouncement: (id: string) => Promise<void>;

    // UI state
    currentView: string;
    setCurrentView: (view: string) => void;

    // Cross-page selection state
    selectedSection: string | null;
    setSelectedSection: (section: string | null) => void;
    selectedSubject: string | null;
    setSelectedSubject: (subject: string | null) => void;


    // Class Records
    classRecords: ClassRecord[];
    setClassRecords: (records: ClassRecord[]) => void;
    updateClassRecord: (record: ClassRecord) => Promise<void>;
    deleteClassRecord: (id: string) => Promise<void>;


    // Observed Values
    observedValues: ObservedValues[];
    setObservedValues: (values: ObservedValues[]) => void;
    updateObservedValue: (value: ObservedValues) => Promise<void>;

    // HPS Records
    hpsRecords: HPSRecord[];
    setHpsRecords: (records: HPSRecord[]) => void;
    updateHPSRecord: (record: HPSRecord) => Promise<void>;

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

    // SF2 Attendance Persistence
    activeSF2Sheet: SF2Sheet | null;
    fetchSF2Sheet: (sectionId: string, month: string) => Promise<void>;
    saveSF2Sheet: (sheet: SF2Sheet) => Promise<void>;

    // Global Notifications
    notification: {
        message: string;
        type: 'success' | 'error' | 'info';
        visible: boolean;
    };
    showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
    hideNotification: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    // School profile
    schoolProfile: defaultSchoolProfile,
    setSchoolProfile: (schoolProfile) => set({ schoolProfile }),
    updateSchoolProfile: async (profile) => {
        await setDoc(doc(db, 'settings', 'schoolProfile'), profile);
    },

    // Active school year (Local preference)
    activeSchoolYear: '2025-2026',
    setActiveSchoolYear: (sy) => set({ activeSchoolYear: sy }),

    // Students
    students: [],
    setStudents: (students) => set({ students }),
    addStudent: async (student) => {
        // Optimistic Update
        set((state) => ({ students: [...state.students, student] }));
        try {
            await setDoc(doc(db, 'students', student.lrn), student);
        } catch (error) {
            console.error("Failed to add student", error);
            // Revert on error
            set((state) => ({ students: state.students.filter(s => s.lrn !== student.lrn) }));
            throw error;
        }
    },
    updateStudent: async (lrn, updates) => {
        // Optimistic Update
        set((state) => ({
            students: state.students.map(s => s.lrn === lrn ? { ...s, ...updates } : s)
        }));
        try {
            await updateDoc(doc(db, 'students', lrn), updates);
        } catch (error) {
            console.error("Failed to update student", error);
            // Revert (requires fetching previous state, omitted for brevity, but could imply re-fetching)
            throw error;
        }
    },
    deleteStudent: async (lrn) => {
        // Optimistic Update
        const previousStudents = useAppStore.getState().students;
        set((state) => ({ students: state.students.filter(s => s.lrn !== lrn) }));
        try {
            await deleteDoc(doc(db, 'students', lrn));
        } catch (error) {
            console.error("Failed to delete student", error);
            // Revert
            set({ students: previousStudents });
            throw error;
        }
    },

    clearSection: async (sectionName: string) => {
        const previousStudents = useAppStore.getState().students;
        // Optimistic remove
        set((state) => ({ students: state.students.filter(s => s.student_section !== sectionName) }));

        try {
            const studentsToDelete = previousStudents.filter(s => s.student_section === sectionName);
            const batch = writeBatch(db);
            let opCount = 0;

            for (const s of studentsToDelete) {
                const ref = doc(db, 'students', s.lrn);
                batch.delete(ref);
                opCount++;
            }

            if (opCount > 0) {
                await batch.commit();
            }
        } catch (error) {
            console.error("Failed to clear section", error);
            set({ students: previousStudents }); // Revert
            throw error;
        }
    },

    // Sections
    sections: [],
    setSections: (sections) => set({ sections }),
    addSection: async (section) => {
        set((state) => ({ sections: [...state.sections, section] }));
        try {
            await setDoc(doc(db, 'sections', section.id), section);
        } catch (e) {
            set((state) => ({ sections: state.sections.filter(s => s.id !== section.id) }));
            throw e;
        }
    },
    updateSection: async (section) => {
        set((state) => ({
            sections: state.sections.map(s => s.id === section.id ? section : s)
        }));
        try {
            await setDoc(doc(db, 'sections', section.id), section, { merge: true });
        } catch (e) {
            console.error("Failed to update section", e);
            throw e;
        }
    },
    deleteSection: async (id) => {
        const previousSections = useAppStore.getState().sections;
        set((state) => ({ sections: state.sections.filter(s => s.id !== id) }));
        try {
            await deleteDoc(doc(db, 'sections', id));
        } catch (e) {
            set({ sections: previousSections });
            throw e;
        }
    },

    // Subjects
    subjects: [],
    setSubjects: (subjects) => set({ subjects }),
    addSubject: async (subject) => {
        set((state) => ({ subjects: [...state.subjects, subject] }));
        try {
            await setDoc(doc(db, 'subjects', subject.id), subject);
        } catch (e) {
            set((state) => ({ subjects: state.subjects.filter(s => s.id !== subject.id) }));
            throw e;
        }
    },
    deleteSubject: async (id) => {
        const previousSubjects = useAppStore.getState().subjects;
        set((state) => ({ subjects: state.subjects.filter(s => s.id !== id) }));
        try {
            await deleteDoc(doc(db, 'subjects', id));
        } catch (e) {
            set({ subjects: previousSubjects });
            throw e;
        }
    },
    updateSubject: async (subject) => {
        set((state) => ({
            subjects: state.subjects.map(s => s.id === subject.id ? subject : s)
        }));
        try {
            await setDoc(doc(db, 'subjects', subject.id), subject, { merge: true });
        } catch (e) {
            console.error("Failed to update subject", e);
            throw e;
        }
    },

    // Announcements
    announcements: [],
    setAnnouncements: (announcements) => set({ announcements }),
    addAnnouncement: async (announcement) => {
        await setDoc(doc(db, 'announcements', announcement.id), announcement);
    },
    deleteAnnouncement: async (id) => {
        await deleteDoc(doc(db, 'announcements', id));
    },

    // Teachers
    teachers: [],
    setTeachers: (teachers) => set({ teachers }),

    // UI state
    currentView: 'dashboard',
    setCurrentView: (view) => set({ currentView: view }),

    // Cross-page selection state
    selectedSection: null,
    setSelectedSection: (section) => set({ selectedSection: section }),
    selectedSubject: null,
    setSelectedSubject: (subject) => set({ selectedSubject: subject }),


    // Class Records (Grades)
    classRecords: [],
    setClassRecords: (records) => set({ classRecords: records }),
    updateClassRecord: async (record) => {
        // Prepare sanitized record for Firestore (remove undefined)
        const sanitizedRecord = JSON.parse(JSON.stringify(record, (key, value) => 
            value === undefined ? null : value
        ));

        // Optimistic UI update
        set((state) => {
            const existingIndex = state.classRecords.findIndex(r => r.id === record.id);
            const newRecords = [...state.classRecords];
            if (existingIndex >= 0) {
                newRecords[existingIndex] = record;
            } else {
                newRecords.push(record);
            }
            return { classRecords: newRecords };
        });

        try {
            await setDoc(doc(db, 'grades', record.id), sanitizedRecord);
        } catch (error) {
            console.error("Failed to update class record", error);
            get().showNotification("Failed to save grade to database.", "error");
        }
    },
    deleteClassRecord: async (id) => {
        const previousRecords = get().classRecords;
        set((state) => ({
            classRecords: state.classRecords.filter(r => r.id !== id)
        }));
        try {
            await deleteDoc(doc(db, 'grades', id));
        } catch (error) {
            console.error("Failed to delete class record", error);
            set({ classRecords: previousRecords });
            get().showNotification("Failed to delete record from database.", "error");
        }
    },

    // Observed Values (Behavior)
    observedValues: [],
    setObservedValues: (values) => set({ observedValues: values }),
    updateObservedValue: async (value) => {
        // Sanitize
        const sanitizedValue = JSON.parse(JSON.stringify(value, (key, val) => 
            val === undefined ? null : val
        ));
        try {
            await setDoc(doc(db, 'observedValues', value.id), sanitizedValue);
        } catch (error) {
            console.error("Failed to update observed value", error);
            get().showNotification("Failed to save behavior rating.", "error");
        }
    },

    // HPS Records
    hpsRecords: [],
    setHpsRecords: (records) => set({ hpsRecords: records }),
    updateHPSRecord: async (record) => {
        // Optimistic UI update
        set((state) => {
            const existingIndex = state.hpsRecords.findIndex(r => r.id === record.id);
            if (existingIndex >= 0) {
                const newRecords = [...state.hpsRecords];
                newRecords[existingIndex] = record;
                return { hpsRecords: newRecords };
            } else {
                return { hpsRecords: [...state.hpsRecords, record] };
            }
        });
        await setDoc(doc(db, 'hps', record.id), record, { merge: true });
    },

    // SF9 Layout
    sf9Layout: {
        fontSize: 10,
        cellPadding: 8,
        gradesTable: {
            subject: '40%',
            qtr: '7%',
            final: '12%',
            remarks: '20%'
        },
        valuesTable: {
            valueName: '25%',
            behavior: '43%',
            marking: '8%'
        }
    },
    setSF9Layout: (layout) => set({ sf9Layout: layout }),

    // SF2 Attendance Persistence
    activeSF2Sheet: null,
    fetchSF2Sheet: async (sectionId, month) => {
        if (!sectionId || !month) return;

        const schoolYear = get().activeSchoolYear;
        const sheetId = `${sectionId}_${schoolYear}_${month}`;

        try {
            const docRef = doc(db, 'sf2_sheets', sheetId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                set({ activeSF2Sheet: docSnap.data() as SF2Sheet });
            } else {
                // Initialize empty sheet structure locally if not exists
                // We don't save it yet until user makes changes
                const newSheet: SF2Sheet = {
                    id: sheetId,
                    section_id: sectionId,
                    school_year: schoolYear,
                    month: month,
                    date_labels: {},
                    attendance: {},
                    updated_at: new Date().toISOString()
                };
                set({ activeSF2Sheet: newSheet });
            }
        } catch (e) {
            console.error("Error fetching SF2 sheet", e);
        }
    },
    saveSF2Sheet: async (sheet) => {
        // Debounce logic should probably be in the component, but store can handle saving.
        set({ activeSF2Sheet: sheet });
        try {
            await setDoc(doc(db, 'sf2_sheets', sheet.id), sheet, { merge: true });
        } catch (e) {
            console.error("Error saving SF2 sheet", e);
        }
    },

    // Global Notifications
    notification: {
        message: '',
        type: 'info',
        visible: false,
    },
    showNotification: (message, type = 'info') => {
        set({ notification: { message, type, visible: true } });
        // Auto-hide after 3.5 seconds
        setTimeout(() => {
            get().hideNotification();
        }, 3500);
    },
    hideNotification: () => {
        set((state) => ({ 
            notification: { ...state.notification, visible: false } 
        }));
    },
}));
