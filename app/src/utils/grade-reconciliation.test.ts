import { describe, it, expect } from 'vitest';
import { reconcileOrphanedGradesAndSubjects, generateDeterministicSubjectId, deduceSubjectNameFromId } from './grade-reconciliation';
import type { Subject, Section, Student, ClassRecord, HPSRecord } from '../types';

describe('grade-reconciliation', () => {
    it('retains temporary-LRN grade records when their learner relationship is missing', () => {
        const classRecord: ClassRecord = {
            id: 'class-temp-1',
            student_lrn: 'TEMP-123',
            section_id: 'section-1',
            subject_id: 'subject-1',
            school_year: '2026-2027',
            quarter: 1,
            written_works: [20],
            performance_tasks: [40],
            quarterly_exam: 30,
        };
        const gradingSheetRecord: ClassRecord = { ...classRecord, id: 'grading-temp-1' };

        const result = reconcileOrphanedGradesAndSubjects({
            subjects: [],
            sections: [],
            students: [],
            classRecords: [classRecord],
            hpsRecords: [],
            gradingSheetRecords: [gradingSheetRecord],
        });

        expect(result.classRecords).toEqual([expect.objectContaining({
            student_lrn: 'TEMP-123', section_id: 'section-1', subject_id: 'subject-1', quarterly_exam: 30,
        })]);
        expect(result.gradingSheetRecords).toEqual([expect.objectContaining({
            student_lrn: 'TEMP-123', section_id: 'section-1', subject_id: 'subject-1', quarterly_exam: 30,
        })]);
        expect(result.deletedClassRecordIds).toEqual([]);
        expect(result.deletedGradingSheetRecordIds).toEqual([]);
    });

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

    it('auto-heals duplicate subject clusters and re-links split grades seamlessly', () => {
        // Simulating the user's situation: 2 duplicate subject records for the same subject
        const subjects: Subject[] = [
            { id: 'sub_temp_filipino_dup1', subject_name: 'Filipino 2 (Filipino sa Isports)', grade_level: 'Grade 12', term: 'all' },
            { id: 'subject-grade12-filipino2', subject_name: 'Filipino 2 (Filipino sa Isports)', grade_level: 'Grade 12', term: 'all' },
            { id: 'sub_untrimmed_science ', subject_name: 'Science ', grade_level: 'Grade 9', term: 'all' },
            { id: 'subject-grade9-science', subject_name: 'Science', grade_level: 'Grade 9', term: 'all' },
        ];

        const sections: Section[] = [
            { id: 'sec-g12', section_name: 'Rizal', section_grade_level: 'Grade 12' },
            { id: 'sec-g9', section_name: 'Molave', section_grade_level: 'Grade 9' }
        ];

        const students: Student[] = [
            { lrn: '111222333444', first_name: 'Maria', last_name: 'Clara', student_section: 'sec-g12' } as unknown as Student
        ];

        // Class record encoded under the duplicate/temporary subject ID
        const classRecords: ClassRecord[] = [
            {
                id: 'grade_111222333444_sub_temp_filipino_dup1_Q1',
                student_lrn: '111222333444',
                section_id: 'sec-g12',
                subject_id: 'sub_temp_filipino_dup1', // Duplicate ID!
                subject_name: 'Filipino 2 (Filipino sa Isports)',
                school_year: '2026-2027',
                quarter: 1,
                written_works: [30],
                performance_tasks: [50],
                quarterly_exam: 20,
                final_grade: 91
            },
            {
                id: 'grade_111222333444_sub_untrimmed_science_Q1',
                student_lrn: '111222333444',
                section_id: 'sec-g9',
                subject_id: 'sub_untrimmed_science ', // Duplicate ID with trailing space!
                subject_name: 'Science ',
                school_year: '2026-2027',
                quarter: 1,
                written_works: [25],
                performance_tasks: [45],
                quarterly_exam: 20,
                final_grade: 89
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

        // 1. Should detect and deduplicate subjects
        expect(result.subjectsModified).toBe(true);
        expect(result.subjects).toHaveLength(2); // Only 2 canonical subjects remain
        expect(result.subjects.map(s => s.id)).toEqual(['subject-grade12-filipino2', 'subject-grade9-science']);

        // 2. Duplicate IDs should be flagged for deletion from IndexedDB
        expect(result.deletedSubjectIds).toContain('sub_temp_filipino_dup1');
        expect(result.deletedSubjectIds).toContain('sub_untrimmed_science ');

        // 3. Class records must be re-linked to canonical subject IDs
        expect(result.modified).toBe(true);
        const filipinoRecord = result.classRecords.find(cr => cr.student_lrn === '111222333444' && cr.subject_name === 'Filipino 2 (Filipino sa Isports)');
        expect(filipinoRecord).toBeDefined();
        expect(filipinoRecord?.subject_id).toBe('subject-grade12-filipino2');
        expect(filipinoRecord?.final_grade).toBe(91);

        const scienceRecord = result.classRecords.find(cr => cr.student_lrn === '111222333444' && cr.subject_name === 'Science');
        expect(scienceRecord).toBeDefined();
        expect(scienceRecord?.subject_id).toBe('subject-grade9-science');
        expect(scienceRecord?.final_grade).toBe(89);
    });

    it('heals orphaned HPS records by deducing subject name from classRecords and populates subject_name', () => {
        const subjects: Subject[] = [
            { id: 'subj-active-sci', subject_name: 'Science', grade_level: 'Grade 7' },
        ];

        const sections: Section[] = [
            { id: 'sec-g7', section_name: 'Diamond', section_grade_level: 'Grade 7' }
        ];

        const students: Student[] = [
            { lrn: '123456789012', first_name: 'Juan', last_name: 'Dela Cruz', gender: 'Male', birthday: '2010-01-01', student_section: 'sec-g7' } as unknown as Student
        ];

        // Arbitrary unknown UUID for old deleted/re-templated subject
        const orphanedSubjId = 'random-uuid-987654';

        const classRecords: ClassRecord[] = [
            {
                id: `grade_123456789012_${orphanedSubjId}_Q1`,
                student_lrn: '123456789012',
                section_id: 'sec-g7',
                subject_id: orphanedSubjId,
                subject_name: 'Science', // class record kept the subject_name!
                school_year: '2026-2027',
                quarter: 1,
                written_works: [25, 23, 40],
                performance_tasks: [89, 95, 48],
                quarterly_exam: 28,
                final_grade: 93
            }
        ];

        // HPS record only had orphanedSubjId and NO subject_name originally
        const hpsRecords: HPSRecord[] = [
            {
                id: `hps_${orphanedSubjId}_sec-g7_2026-2027_Q1`,
                subject_id: orphanedSubjId,
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
        // HPS record should now be re-linked to subj-active-sci!
        const healedHps = result.hpsRecords[0];
        expect(healedHps.subject_id).toBe('subj-active-sci');
        expect(healedHps.subject_name).toBe('Science');
        expect(healedHps.written_works).toEqual([25, 25, 50]);
        expect(healedHps.performance_tasks).toEqual([100, 100, 50]);
        expect(healedHps.quarterly_exam).toBe(30);
    });

    it('auto-heals duplicate GMRC and GMRC (Good Manners and Right Conduct) in Elementary: keeps official name, removes short duplicate, heals section & hidden columns', () => {
        const subjects: Subject[] = [
            { id: 'subject-grade4-gmrc', subject_name: 'GMRC', grade_level: 'Grade 4', term: 'all' },
            { id: 'sub_temp_gmrc_full', subject_name: 'GMRC (Good Manners and Right Conduct)', grade_level: 'Grade 4', term: 'all' }
        ];

        const sections: Section[] = [
            {
                id: 'sec-g4-emerald',
                section_name: 'Grade 4 - Emerald',
                section_grade_level: 'Grade 4',
                is_advisory: true,
                taught_subjects: ['Filipino', 'English', 'Mathematics', 'Science', 'GMRC', 'Araling Panlipunan (AP)'],
                teaching_subjects: ['GMRC'],
                section_metadata: {
                    hiddenConsolidatedSubjects: ['GMRC']
                }
            }
        ];

        const students: Student[] = [
            { lrn: '555666777888', first_name: 'Pedro', last_name: 'Penduko', student_section: 'sec-g4-emerald' } as unknown as Student
        ];

        const classRecords: ClassRecord[] = [
            {
                id: 'grade_555666777888_subject-grade4-gmrc_Q1',
                student_lrn: '555666777888',
                section_id: 'sec-g4-emerald',
                subject_id: 'subject-grade4-gmrc',
                subject_name: 'GMRC',
                school_year: '2026-2027',
                quarter: 1,
                written_works: [20, 20],
                performance_tasks: [40, 40],
                quarterly_exam: 20,
                final_grade: 90
            }
        ];

        const hpsRecords: HPSRecord[] = [
            {
                id: 'hps_subject-grade4-gmrc_sec-g4-emerald_2026-2027_Q1',
                subject_id: 'subject-grade4-gmrc',
                subject_name: 'GMRC',
                section_id: 'sec-g4-emerald',
                school_year: '2026-2027',
                quarter: 1,
                written_works: [25, 25],
                performance_tasks: [50, 50],
                quarterly_exam: 25
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

        // 1. Should have only 1 subject, and its name MUST be the official full DepEd title
        expect(result.subjects).toHaveLength(1);
        expect(result.subjects[0].subject_name).toBe('GMRC (Good Manners and Right Conduct)');

        // 2. Duplicate ID should be flagged for deletion
        expect(result.deletedSubjectIds).toHaveLength(1);

        // 3. Class record must be updated to official name
        const cr = result.classRecords[0];
        expect(cr.subject_name).toBe('GMRC (Good Manners and Right Conduct)');
        expect(cr.subject_id).toBe(result.subjects[0].id);

        // 4. HPS record must be updated to official name
        const hps = result.hpsRecords[0];
        expect(hps.subject_name).toBe('GMRC (Good Manners and Right Conduct)');
        expect(hps.subject_id).toBe(result.subjects[0].id);

        // 5. Section taught_subjects and teaching_subjects must be upgraded
        expect(result.sectionsModified).toBe(true);
        expect(result.sections).toBeDefined();
        const healedSec = result.sections![0];
        expect(healedSec.taught_subjects).toContain('GMRC (Good Manners and Right Conduct)');
        expect(healedSec.taught_subjects).not.toContain('GMRC');
        expect(healedSec.teaching_subjects).toContain('GMRC (Good Manners and Right Conduct)');
        expect(healedSec.teaching_subjects).not.toContain('GMRC');

        // 6. GMRC must be unhidden from hiddenConsolidatedSubjects
        expect(healedSec.section_metadata?.hiddenConsolidatedSubjects).not.toContain('GMRC');
    });

    it('upgrades standalone GMRC in JHS to Values Education', () => {
        const subjects: Subject[] = [
            { id: 'subj-g7-legacy-gmrc', subject_name: 'GMRC', grade_level: 'Grade 7', term: 'all' }
        ];

        const sections: Section[] = [
            {
                id: 'sec-g7-narra',
                section_name: 'Grade 7 - Narra',
                section_grade_level: 'Grade 7',
                taught_subjects: ['Filipino', 'English', 'Mathematics', 'Science', 'GMRC'],
                teaching_subjects: ['GMRC']
            }
        ];

        const result = reconcileOrphanedGradesAndSubjects({
            subjects,
            sections,
            students: [],
            classRecords: [],
            hpsRecords: [],
            gradingSheetRecords: []
        });

        // Subject should be upgraded to Values Education
        expect(result.subjects[0].subject_name).toBe('Values Education');

        // Section taught_subjects and teaching_subjects should be upgraded
        expect(result.sectionsModified).toBe(true);
        const healedSec = result.sections![0];
        expect(healedSec.taught_subjects).toContain('Values Education');
        expect(healedSec.taught_subjects).not.toContain('GMRC');
        expect(healedSec.teaching_subjects).toContain('Values Education');
        expect(healedSec.teaching_subjects).not.toContain('GMRC');
    });

    it('auto-heals duplicate PE & Health clusters, re-links grades, and sanitizes section taught_subjects', () => {
        const subjects: Subject[] = [
            {
                id: 'sub_pe_health_clean',
                subject_name: 'Physical Education and Health',
                grade_level: 'Grade 7',
                term: 'all'
            },
            {
                id: 'sub_pe_health_dup',
                subject_name: 'PE and HEALTH',
                grade_level: 'Grade 7',
                term: 'all'
            }
        ];

        const sections: Section[] = [
            {
                id: 'sec_g7_diamond',
                section_name: 'Diamond',
                section_grade_level: 'Grade 7',
                taught_subjects: ['English', 'Physical Education and Health', 'PE and HEALTH'],
                teaching_subjects: ['PE and HEALTH']
            }
        ];

        const gradingSheetRecords: ClassRecord[] = [
            {
                id: 'lrn123_sub_pe_health_dup_1_2026-2027',
                student_lrn: '123456789012',
                subject_id: 'sub_pe_health_dup',
                subject_name: 'PE and HEALTH',
                quarter: 1,
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 89,
                section_id: 'sec_g7_diamond',
                school_year: '2026-2027'
            }
        ];

        const result = reconcileOrphanedGradesAndSubjects({
            subjects,
            sections,
            students: [],
            classRecords: [],
            hpsRecords: [],
            gradingSheetRecords
        });

        // 1. Subjects: Deduplicated into one canonical Physical Education and Health
        expect(result.subjectsModified).toBe(true);
        expect(result.subjects.length).toBe(1);
        expect(result.subjects[0].subject_name).toBe('Physical Education and Health');
        expect(result.subjects[0].id).toBe('sub_pe_health_clean');
        expect(result.deletedSubjectIds).toContain('sub_pe_health_dup');

        // 2. Section taught_subjects: "PE and HEALTH" duplicate removed
        expect(result.sectionsModified).toBe(true);
        const sec = result.sections![0];
        expect(sec.taught_subjects).toEqual(['English', 'Physical Education and Health']);
        expect(sec.teaching_subjects).toEqual(['Physical Education and Health']);

        // 3. Grading records: Grades from "sub_pe_health_dup" re-linked to canonical "sub_pe_health_clean"
        expect(result.modified).toBe(true);
        const gs = result.gradingSheetRecords[0];
        expect(gs.subject_id).toBe('sub_pe_health_clean');
        expect(gs.subject_name).toBe('Physical Education and Health');
        expect(gs.final_grade).toBe(89);
    });

    it('L-17: preserves existing classRecord, HPS, and gradingSheetRecord IDs during reconciliation', () => {
        const subjects: Subject[] = [
            { id: 'subj-canonical', subject_name: 'Science', grade_level: 'Grade 7' }
        ];
        const sections: Section[] = [
            { id: 'sec-1', section_name: 'Sampaguita', section_grade_level: 'Grade 7' }
        ];
        const classRecords: ClassRecord[] = [
            {
                id: 'custom_cr_id_123',
                student_lrn: '123456789012',
                section_id: 'sec-1',
                subject_id: 'subject-17250000-Grade-7-3-old',
                school_year: '2026-2027',
                quarter: 1,
                written_works: [20],
                performance_tasks: [40],
                quarterly_exam: 30,
            }
        ];
        const hpsRecords: HPSRecord[] = [
            {
                id: 'custom_hps_id_456',
                section_id: 'sec-1',
                subject_id: 'subject-17250000-Grade-7-3-old',
                quarter: 1,
                school_year: '2026-2027',
                written_works: [25],
                performance_tasks: [50],
                quarterly_exam: 40,
            }
        ];
        const gradingSheetRecords: ClassRecord[] = [
            {
                id: 'custom_gs_id_789',
                student_lrn: '123456789012',
                section_id: 'sec-1',
                subject_id: 'subject-17250000-Grade-7-3-old',
                school_year: '2026-2027',
                quarter: 1,
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 88,
            }
        ];

        const result = reconcileOrphanedGradesAndSubjects({
            subjects,
            sections,
            students: [],
            classRecords,
            hpsRecords,
            gradingSheetRecords,
        });

        expect(result.modified).toBe(true);
        expect(result.classRecords[0].id).toBe('custom_cr_id_123');
        expect(result.classRecords[0].subject_id).toBe('subj-canonical');
        expect(result.hpsRecords[0].id).toBe('custom_hps_id_456');
        expect(result.hpsRecords[0].subject_id).toBe('subj-canonical');
        expect(result.gradingSheetRecords[0].id).toBe('custom_gs_id_789');
        expect(result.gradingSheetRecords[0].subject_id).toBe('subj-canonical');
    });
});

