import { describe, it, expect } from 'vitest';
import { reconcileOrphanedGradesAndSubjects, generateDeterministicSubjectId, deduceSubjectNameFromId } from './grade-reconciliation';
import type { Subject, Section, Student, ClassRecord, HPSRecord } from '../types';

describe('grade-reconciliation', () => {
    it('generates consistent deterministic subject IDs', () => {
        const id1 = generateDeterministicSubjectId('Grade 7', 'Science');
        const id2 = generateDeterministicSubjectId('Grade 7', 'Science');
        expect(id1).toBe('subject-grade7-science');
        expect(id1).toBe(id2);

        const mapehId = generateDeterministicSubjectId('Grade 7', 'Physical Education and Health');
        expect(mapehId).toBe('subject-grade7-physicaleducationandhealth');
    });

    it('deduces subject name from template IDs', () => {
        expect(deduceSubjectNameFromId('subject-17250000-Grade-7-3-abcde')).toBe('Science');
        expect(deduceSubjectNameFromId('subject-17250000-Grade-7-8-abcde')).toBe('Music and Arts');
        expect(deduceSubjectNameFromId('subject-17250000-Grade-7-9-abcde')).toBe('Physical Education and Health');
        expect(deduceSubjectNameFromId('subj_science_123')).toBe('Science');
        expect(deduceSubjectNameFromId('subj_pe_health_123')).toBe('Physical Education and Health');
    });

    it('reconnects orphaned class records and HPS to re-templated subjects', () => {
        // Current subjects in database (e.g. freshly re-loaded template)
        const subjects: Subject[] = [
            { id: 'subj-new-sci', subject_name: 'Science', grade_level: 'Grade 7' },
            { id: 'subj-new-pe', subject_name: 'Physical Education and Health', grade_level: 'Grade 7' },
            { id: 'subj-new-ma', subject_name: 'Music and Arts', grade_level: 'Grade 7' },
        ];

        const sections: Section[] = [
            { id: 'sec-g7', section_name: 'Narra', section_grade_level: 'Grade 7' }
        ];

        const students: Student[] = [
            { lrn: '123456789012', first_name: 'Juan', last_name: 'Dela Cruz', gender: 'Male', birthday: '2010-01-01', student_section: 'sec-g7' } as unknown as Student
        ];

        // Orphaned class record referencing an old deleted subject ID
        const classRecords: ClassRecord[] = [
            {
                id: 'grade_123456789012_old-sci-id_Q1',
                student_lrn: '123456789012',
                section_id: 'sec-g7',
                subject_id: 'subject-17250000-Grade-7-3-old', // was Science!
                school_year: '2026-2027',
                quarter: 1,
                written_works: [25, 23, 40],
                performance_tasks: [89, 95, 48],
                quarterly_exam: 28,
                final_grade: 93
            },
            {
                id: 'grade_123456789012_old-pe-id_Q1',
                student_lrn: '123456789012',
                section_id: 'sec-g7',
                subject_id: 'subject-17250000-Grade-7-9-old', // was PE & Health!
                school_year: '2026-2027',
                quarter: 1,
                written_works: [20, 20],
                performance_tasks: [45, 45],
                quarterly_exam: 25,
                final_grade: 90
            }
        ];

        const hpsRecords: HPSRecord[] = [
            {
                id: 'hps_old-sci-id_all_2026-2027_Q1',
                subject_id: 'subject-17250000-Grade-7-3-old',
                section_id: 'sec-g7',
                school_year: '2026-2027',
                quarter: 1,
                written_works: [25, 25, 50],
                performance_tasks: [100, 100, 50],
                quarterly_exam: 30
            }
        ];

        const result = reconcileOrphanedGradesAndSubjects({
            subjects,
            sections,
            students,
            classRecords,
            hpsRecords,
            gradingSheetRecords: []
        });

        expect(result.modified).toBe(true);
        expect(result.repairedCount).toBe(3); // 2 classRecords + 1 hpsRecord

        // Check that Science record reconnected to subj-new-sci
        const sciRecord = result.classRecords.find(r => r.student_lrn === '123456789012' && r.subject_id === 'subj-new-sci');
        expect(sciRecord).toBeDefined();
        expect(sciRecord?.subject_name).toBe('Science');
        expect(sciRecord?.final_grade).toBe(93);

        // Check that PE record reconnected to subj-new-pe
        const peRecord = result.classRecords.find(r => r.student_lrn === '123456789012' && r.subject_id === 'subj-new-pe');
        expect(peRecord).toBeDefined();
        expect(peRecord?.subject_name).toBe('Physical Education and Health');

        // Check that HPS reconnected to subj-new-sci
        const sciHps = result.hpsRecords.find(h => h.subject_id === 'subj-new-sci');
        expect(sciHps).toBeDefined();
        expect(sciHps?.written_works).toEqual([25, 25, 50]);
    });

    it('unhides subjects with term: none that have grades and resurrects completely missing subjects', () => {
        const subjects: Subject[] = [
            { id: 'subj-pr2', subject_name: 'Practical Research 2', grade_level: 'Grade 12', term: 'none' },
            { id: 'subj-bio', subject_name: 'General Biology 1', grade_level: 'Grade 12', term: 'none' },
        ];

        const sections: Section[] = [
            { id: 'sec-g12', section_name: 'STEM 12-A', section_grade_level: 'Grade 12' }
        ];

        const students: Student[] = [
            { lrn: '111222333444', first_name: 'Maria', last_name: 'Santos', student_section: 'sec-g12' } as unknown as Student
        ];

        const classRecords: ClassRecord[] = [
            // Grade for Practical Research 2 (which had term: 'none')
            {
                id: 'grade_111222333444_subj-pr2_Q1',
                student_lrn: '111222333444',
                section_id: 'sec-g12',
                subject_id: 'subj-pr2',
                school_year: '2026-2027',
                quarter: 1,
                written_works: [25, 30],
                performance_tasks: [40, 45],
                quarterly_exam: 50,
                final_grade: 95
            },
            // Grade for a completely missing subject that was removed from subjects
            {
                id: 'grade_111222333444_missing-subj-id_Q1',
                student_lrn: '111222333444',
                section_id: 'sec-g12',
                subject_id: 'missing-subj-id',
                subject_name: 'Contemporary Philippine Arts',
                school_year: '2026-2027',
                quarter: 1,
                written_works: [20, 25],
                performance_tasks: [50, 48],
                quarterly_exam: 45,
                final_grade: 91
            }
        ];

        const result = reconcileOrphanedGradesAndSubjects({
            subjects,
            sections,
            students,
            classRecords,
            hpsRecords: [],
            gradingSheetRecords: []
        });

        expect(result.subjectsModified).toBe(true);
        // Practical Research 2 should have been unhidden (term: 'all')
        const pr2 = result.subjects.find(s => s.id === 'subj-pr2');
        expect(pr2?.term).toBe('all');

        // General Biology 1 (Grade 12) should also default to 'all'
        const bio = result.subjects.find(s => s.id === 'subj-bio');
        expect(bio?.term).toBe('all');

        // Missing subject 'Contemporary Philippine Arts' should have been resurrected
        const cpar = result.subjects.find(s => s.subject_name === 'Contemporary Philippine Arts');
        expect(cpar).toBeDefined();
        expect(cpar?.term).toBe('all');

        // The grade record for the missing subject should now point to the resurrected subject
        const cparGrade = result.classRecords.find(r => r.subject_name === 'Contemporary Philippine Arts');
        expect(cparGrade).toBeDefined();
        expect(cparGrade?.subject_id).toBe(cpar?.id);
    });

    it('unhides all Elementary and JHS subjects that were corrupted to term: none', () => {
        const subjects: Subject[] = [
            { id: 'subj-g1-read', subject_name: 'Reading and Literacy', grade_level: 'Grade 1', term: 'none' },
            { id: 'subj-g1-lang', subject_name: 'Language', grade_level: 'Grade 1', term: 'none' },
            { id: 'subj-g7-ma', subject_name: 'Music and Arts', grade_level: 'Grade 7', term: 'none' },
            { id: 'subj-g7-pe', subject_name: 'Physical Education and Health', grade_level: 'Grade 7', term: 'none' },
            { id: 'subj-g7-sci', subject_name: 'Science', grade_level: 'Grade 7', term: 'none' },
        ];

        const result = reconcileOrphanedGradesAndSubjects({
            subjects,
            sections: [],
            students: [],
            classRecords: [],
            hpsRecords: [],
            gradingSheetRecords: []
        });

        expect(result.subjectsModified).toBe(true);
        expect(result.subjects.every(s => s.term === 'all')).toBe(true);
    });

    it('re-links orphaned grades with canonical matching even when names have slight variations', () => {
        const subjects: Subject[] = [
            { id: 'subj-new-pe-health', subject_name: 'Physical Education and Health', grade_level: 'Grade 8', term: 'all' },
            { id: 'subj-new-music-arts', subject_name: 'Music and Arts', grade_level: 'Grade 8', term: 'all' },
        ];

        const sections: Section[] = [
            { id: 'sec-g8', section_name: 'Emerald', section_grade_level: 'Grade 8' }
        ];

        const students: Student[] = [
            { lrn: '555666777888', first_name: 'Pedro', last_name: 'Penduko', student_section: 'sec-g8' } as unknown as Student
        ];

        const classRecords: ClassRecord[] = [
            {
                id: 'grade_pe_old',
                student_lrn: '555666777888',
                section_id: 'sec-g8',
                subject_id: 'old-pe-id',
                subject_name: 'PE and Health',
                school_year: '2026-2027',
                quarter: 1,
                written_works: [30],
                performance_tasks: [50],
                quarterly_exam: 20,
                final_grade: 88
            }
        ];

        const result = reconcileOrphanedGradesAndSubjects({
            subjects,
            sections,
            students,
            classRecords,
            hpsRecords: [],
            gradingSheetRecords: []
        });

        expect(result.modified).toBe(true);
        expect(result.repairedCount).toBe(1);
        const peRecord = result.classRecords[0];
        expect(peRecord.subject_id).toBe('subj-new-pe-health');
        expect(peRecord.subject_name).toBe('Physical Education and Health');
    });
});
