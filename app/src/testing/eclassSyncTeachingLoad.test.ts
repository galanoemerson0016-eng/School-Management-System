import { describe, it, expect } from 'vitest';
import { isSubjectInTeachingLoad } from '../utils/grading-helpers';
import type { Section, Subject, ClassRecord } from '../types';

describe('isSubjectInTeachingLoad & E-Class Sync Isolation', () => {
    const mockAdvisorySection: Section = {
        id: 'sec-101',
        section_name: 'Grade 7 - Diamond',
        section_grade_level: 'Grade 7',
        is_advisory: true,
        is_teaching_load: true,
        adviser_name: 'Teacher Emerson',
        taught_subjects: [
            'Science',
            'Mathematics',
            'English',
            'Filipino',
            'Araling Panlipunan',
            'Edukasyon sa Pagpapakatao (EsP)',
            'Music and Arts',
            'Physical Education and Health'
        ],
        // The adviser ONLY teaches Science and Music & Arts in this section
        teaching_subjects: ['Science', 'Music and Arts']
    };

    describe('Teaching load detection via isSubjectInTeachingLoad', () => {
        it('identifies subjects that are part of the personal teaching load', () => {
            expect(isSubjectInTeachingLoad('Science', mockAdvisorySection)).toBe(true);
            expect(isSubjectInTeachingLoad({ id: 'sub-sci', subject_name: 'Science' }, mockAdvisorySection)).toBe(true);
            expect(isSubjectInTeachingLoad({ id: 'sub-ma', subject_name: 'Music and Arts' }, mockAdvisorySection)).toBe(true);
        });

        it('identifies subjects assigned to other teachers as NOT in personal teaching load', () => {
            expect(isSubjectInTeachingLoad('Mathematics', mockAdvisorySection)).toBe(false);
            expect(isSubjectInTeachingLoad({ id: 'sub-math', subject_name: 'Mathematics' }, mockAdvisorySection)).toBe(false);
            expect(isSubjectInTeachingLoad({ id: 'sub-eng', subject_name: 'English' }, mockAdvisorySection)).toBe(false);
            expect(isSubjectInTeachingLoad({ id: 'sub-fil', subject_name: 'Filipino' }, mockAdvisorySection)).toBe(false);
            expect(isSubjectInTeachingLoad({ id: 'sub-pe', subject_name: 'Physical Education and Health' }, mockAdvisorySection)).toBe(false);
        });

        it('returns false for pure advisory sections with empty teaching_subjects []', () => {
            const pureAdvisorySection: Section = {
                ...mockAdvisorySection,
                teaching_subjects: []
            };

            expect(isSubjectInTeachingLoad('Science', pureAdvisorySection)).toBe(false);
            expect(isSubjectInTeachingLoad('Mathematics', pureAdvisorySection)).toBe(false);
            expect(isSubjectInTeachingLoad('English', pureAdvisorySection)).toBe(false);
        });

        it('recognizes MAPEH composite when components or MAPEH itself are in load', () => {
            const mapehSection: Section = {
                ...mockAdvisorySection,
                teaching_subjects: ['MAPEH']
            };

            // Parent MAPEH matches
            expect(isSubjectInTeachingLoad('MAPEH', mapehSection)).toBe(true);
            // Components match
            expect(isSubjectInTeachingLoad('Music and Arts', mapehSection)).toBe(true);
            expect(isSubjectInTeachingLoad('Physical Education and Health', mapehSection)).toBe(true);
        });

        it('recognizes SSHS Effective Communication and Mabisang Komunikasyon', () => {
            const sshsSection: Section = {
                ...mockAdvisorySection,
                teaching_subjects: ['Effective Communication']
            };

            expect(isSubjectInTeachingLoad('Effective Communication', sshsSection)).toBe(true);
            expect(isSubjectInTeachingLoad('Mabisang Komunikasyon', sshsSection)).toBe(false);
        });

        it('falls back to active classRecords when teaching_subjects is undefined (legacy sections)', () => {
            const legacySection: Section = {
                id: 'sec-legacy',
                section_name: 'Grade 7 - Old',
                section_grade_level: 'Grade 7',
                is_advisory: true,
                is_teaching_load: true,
                taught_subjects: ['Science', 'Mathematics'],
                teaching_subjects: undefined
            };

            const existingRecords: ClassRecord[] = [
                {
                    id: 'cr-1',
                    student_lrn: '123456789012',
                    section_id: 'sec-legacy',
                    subject_id: 'sub-sci',
                    subject_name: 'Science',
                    school_year: '2025-2026',
                    quarter: 1,
                    written_works: [],
                    performance_tasks: [],
                    quarterly_exam: 0,
                    final_grade: 88
                }
            ];

            // Science has active class record -> true
            expect(isSubjectInTeachingLoad({ id: 'sub-sci', subject_name: 'Science' }, legacySection, existingRecords)).toBe(true);
            // Math has no active class record -> false
            expect(isSubjectInTeachingLoad({ id: 'sub-math', subject_name: 'Mathematics' }, legacySection, existingRecords)).toBe(false);
        });
    });

    describe('Sync Simulation — Preserving manual grades from other teachers', () => {
        interface Student {
            lrn: string;
            name: string;
        }

        const students: Student[] = [
            { lrn: '1001', name: 'Learner A' },
            { lrn: '1002', name: 'Learner B' }
        ];

        const sectionSubjects: Subject[] = [
            { id: 'sub-sci', subject_name: 'Science', grade_level: 'Grade 7' },
            { id: 'sub-math', subject_name: 'Mathematics', grade_level: 'Grade 7' },
            { id: 'sub-eng', subject_name: 'English', grade_level: 'Grade 7' }
        ];

        // Existing consolidated grading sheet records (contains teacher's manual grades for Math & English from other teachers)
        const currentGradingRecords: ClassRecord[] = [
            {
                id: '1001_sub-math_1_2025-2026',
                student_lrn: '1001',
                subject_id: 'sub-math',
                subject_name: 'Mathematics',
                section_id: 'sec-101',
                quarter: 1,
                school_year: '2025-2026',
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 92 // Manually input from Math teacher!
            },
            {
                id: '1001_sub-eng_1_2025-2026',
                student_lrn: '1001',
                subject_id: 'sub-eng',
                subject_name: 'English',
                section_id: 'sec-101',
                quarter: 1,
                school_year: '2025-2026',
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 89 // Manually input from English teacher!
            },
            {
                id: '1001_sub-sci_1_2025-2026',
                student_lrn: '1001',
                subject_id: 'sub-sci',
                subject_name: 'Science',
                section_id: 'sec-101',
                quarter: 1,
                school_year: '2025-2026',
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 85 // Old Science grade
            }
        ];

        // Adviser's E-Class Record (adviser only has records for Science!)
        const eClassGrades: Record<string, Record<string, number>> = {
            '1001': { 'sub-sci': 95 }, // New calculated score in Science E-Class
            '1002': { 'sub-sci': 88 }
        };

        it('syncs ONLY teaching load subjects and preserves manual grades for other teachers', () => {
            // Filter sectionSubjects by isSubjectInTeachingLoad
            const teachingLoadSubjects = sectionSubjects.filter(sub =>
                isSubjectInTeachingLoad(sub, mockAdvisorySection)
            );

            expect(teachingLoadSubjects.map(s => s.subject_name)).toEqual(['Science']);

            const recordsToSync: ClassRecord[] = [];
            const recordsToDelete: string[] = [];

            // Execute the isolated sync logic
            for (const student of students) {
                for (const subject of teachingLoadSubjects) {
                    const grade = eClassGrades[student.lrn]?.[subject.id] || 0;
                    if (grade > 0) {
                        recordsToSync.push({
                            id: `${student.lrn}_${subject.id}_1_2025-2026`,
                            student_lrn: student.lrn,
                            subject_id: subject.id,
                            subject_name: subject.subject_name,
                            section_id: mockAdvisorySection.id,
                            quarter: 1,
                            school_year: '2025-2026',
                            written_works: [],
                            performance_tasks: [],
                            quarterly_exam: 0,
                            final_grade: grade
                        });
                    } else {
                        const existing = currentGradingRecords.find(r =>
                            r.student_lrn === student.lrn && r.subject_id === subject.id
                        );
                        if (existing?.id) recordsToDelete.push(existing.id);
                    }
                }
            }

            // Verify records to sync only contains Science
            expect(recordsToSync.length).toBe(2);
            expect(recordsToSync.every(r => r.subject_id === 'sub-sci')).toBe(true);
            expect(recordsToSync.find(r => r.student_lrn === '1001')?.final_grade).toBe(95);

            // Verify records to delete does NOT contain Mathematics or English!
            expect(recordsToDelete).not.toContain('1001_sub-math_1_2025-2026');
            expect(recordsToDelete).not.toContain('1001_sub-eng_1_2025-2026');

            // Apply updates to simulate Zustand store state
            const updatedRecords = currentGradingRecords
                .filter(r => !recordsToDelete.includes(r.id!))
                .map(r => {
                    const match = recordsToSync.find(s => s.id === r.id);
                    return match || r;
                });

            // Mathematics (92) and English (89) remain completely intact
            const mathRec = updatedRecords.find(r => r.subject_id === 'sub-math');
            const engRec = updatedRecords.find(r => r.subject_id === 'sub-eng');
            const sciRec = updatedRecords.find(r => r.subject_id === 'sub-sci');

            expect(mathRec?.final_grade).toBe(92);
            expect(engRec?.final_grade).toBe(89);
            expect(sciRec?.final_grade).toBe(95); // updated from E-Class!
        });

        it('does not touch any records if teacher has no teaching load in advisory section', () => {
            const pureAdvisory: Section = {
                ...mockAdvisorySection,
                teaching_subjects: []
            };

            const teachingLoadSubjects = sectionSubjects.filter(sub =>
                isSubjectInTeachingLoad(sub, pureAdvisory)
            );

            expect(teachingLoadSubjects.length).toBe(0);
            // Early return triggers; 0 synced, 0 deleted, all manual grades preserved 100%
        });
    });
});
