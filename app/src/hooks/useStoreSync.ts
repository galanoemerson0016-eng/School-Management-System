import { useEffect } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAppStore } from '../stores/app-store';
import { useAuthStore } from '../stores/auth-store';
import type { Student, Section, Subject, ClassRecord, ObservedValues, SchoolProfile, HPSRecord } from '../types';

import { defaultSchoolProfile } from '../lib/initial-data';

export default function useStoreSync() {
    const {
        setStudents,
        setSections,
        setSubjects,
        setClassRecords,
        setObservedValues,
        setSchoolProfile,
        setHpsRecords,
        setTeachers
    } = useAppStore();

    // Only sync when the user is authenticated
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    useEffect(() => {
        // Don't start Firestore listeners if user isn't authenticated
        if (!isAuthenticated) return;

        // Sync School Profile
        const unsubProfile = onSnapshot(doc(db, 'settings', 'schoolProfile'), (docSnap) => {
            if (docSnap.exists()) {
                const fetchedProfile = docSnap.data() as SchoolProfile;
                setSchoolProfile({
                    ...defaultSchoolProfile, // Fallback defaults
                    ...fetchedProfile,        // Fetched data
                    // Ensure logo_url is present if missing in fetched
                    logo_url: fetchedProfile.logo_url || defaultSchoolProfile.logo_url
                });
            }
        });

        // Sync Students
        const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
            const students = snapshot.docs.map(d => d.data() as Student);
            setStudents(students);
        }, (error) => {
            console.error("Sync Error (Students):", error);
        });

        // Sync Sections
        const unsubSections = onSnapshot(collection(db, 'sections'), (snapshot) => {
            const sections = snapshot.docs.map(d => d.data() as Section);
            setSections(sections);
        });

        // Sync Subjects
        const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snapshot) => {
            const subjects = snapshot.docs.map(d => d.data() as Subject);
            setSubjects(subjects);
        });

        // Sync Grades
        const unsubGrades = onSnapshot(collection(db, 'grades'), (snapshot) => {
            const grades = snapshot.docs.map(d => d.data() as ClassRecord);
            setClassRecords(grades);
        });

        // Sync Observed Values
        const unsubValues = onSnapshot(collection(db, 'observedValues'), (snapshot) => {
            const values = snapshot.docs.map(d => d.data() as ObservedValues);
            setObservedValues(values);
        });

        // Sync HPS Records
        const unsubHPS = onSnapshot(collection(db, 'hps'), (snapshot) => {
            const hpsRecords = snapshot.docs.map(d => d.data() as HPSRecord);
            setHpsRecords(hpsRecords);
        });

        // Sync Teachers (Users)
        const unsubTeachers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const users = snapshot.docs.map(d => ({
                uid: d.id,
                ...d.data()
            } as any));
            setTeachers(users);
        });

        return () => {
            unsubProfile();
            unsubStudents();
            unsubSections();
            unsubSubjects();
            unsubGrades();
            unsubValues();
            unsubHPS();
            unsubTeachers();
        };
    }, [isAuthenticated]);
}
