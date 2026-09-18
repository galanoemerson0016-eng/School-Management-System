import { describe, it, expect } from 'vitest';
import type { ClassRecord, HPSRecord, Subject, Student } from '../types';
import { computeLiveTransmutedGradeFromRecord, resolveStudentQuarterGrade } from '../utils/grading-helpers';
import { getSubjectCluster, getWeights, getGradeDescriptorWithFilipino } from '../lib/grading';
import { isMusicArtsSubject, isPeHealthSubject } from '../services/ecr-excel-export';

describe('E-Class Record Summary Sync & Consistency', () => {
    const schoolYear = '2026-2027';

    describe('computeLiveTransmutedGradeFromRecord', () => {
        it('calculates live transmuted grade for Academic subject (e.g. Science / Math)', () => {
            const hps = {
                id: 'hps-sci',
                subject_id: 'sub-sci',
                section_id: 'sec-1',
                quarter: 1,
                school_year: schoolYear,
                ww: [20, 20, 20, 20, 20], // total 100
                pt: [30, 30, 40],         // total 100
                qa: [25, 25, 50],         // total 100
            } as unknown as HPSRecord;

            const record = {
                id: 'rec-1',
                student_lrn: '1001',
                subject_id: 'sub-sci',
                subject_name: 'Science',
                section_id: 'sec-1',
                quarter: 1,
                school_year: schoolYear,
                written_works: [18, 18, 18, 18, 18], // 90 / 100 => 90%
                performance_tasks: [27, 27, 36],     // 90 / 100 => 90%
                quarterly_exam: [22.5, 22.5, 45],    // 90 / 100 => 90%
                final_grade: 0
            } as unknown as ClassRecord;

            // Science cluster weights: WW 40%, PT 40%, QA 20%
            const cluster = getSubjectCluster('Science', 'Grade 7');
            const weights = getWeights(cluster);

            const liveGrade = computeLiveTransmutedGradeFromRecord(record, hps, {
                gradeLevel: 'Grade 7',
                schoolYear,
                weights,
                cluster
            });

            // Initial grade is 90.0, transmutes to 91 in DepEd SY 2026-2027 table
            expect(liveGrade).toBe(91);
        });

        it('calculates live transmuted grade for GMRC with 5-domain split', () => {
            const hps = {
                id: 'hps-gmrc',
                subject_id: 'sub-gmrc',
                section_id: 'sec-1',
                quarter: 1,
                school_year: schoolYear,
                ww: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10], // 50 cognitive + 50 affective
                pt: [10, 10, 10, 10, 10, 10, 10, 10, 10],     // 30 cog + 30 aff + 30 beh
                qa: [20, 20, 40],                             // total 80
            } as unknown as HPSRecord;

            const record = {
                id: 'rec-gmrc-1',
                student_lrn: '1002',
                subject_id: 'sub-gmrc',
                subject_name: 'GMRC',
                section_id: 'sec-1',
                quarter: 1,
                school_year: schoolYear,
                // full scores
                written_works: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
                performance_tasks: [10, 10, 10, 10, 10, 10, 10, 10, 10],
                quarterly_exam: [20, 20, 40],
                final_grade: 0
            } as unknown as ClassRecord;

            const cluster = getSubjectCluster('GMRC', 'Grade 4');
            const weights = getWeights(cluster);

            const liveGrade = computeLiveTransmutedGradeFromRecord(record, hps, {
                gradeLevel: 'Grade 4',
                schoolYear,
                weights,
                cluster
            });

            // 100 initial grade transmutes to 100
            expect(liveGrade).toBe(100);
        });
    });

    describe('MAPEH Components and Composite Sync', () => {
        const student = {
            lrn: '1003',
            first_name: 'Maria',
            last_name: 'Santos',
            middle_name: 'Cruz',
            gender: 'Female',
            student_section: 'Grade 7 - Diamond'
        } as unknown as Student;

        const maSubj: Subject = {
            id: 'sub-ma',
            subject_name: 'Music and Arts',
            grade_level: 'Grade 7',
            is_component: true
        };

        const peSubj: Subject = {
            id: 'sub-pe',
            subject_name: 'Physical Education and Health',
            grade_level: 'Grade 7',
            is_component: true
        };

        it('recognizes standard and variant subject names for Music and Arts and PE and Health', () => {
            expect(isMusicArtsSubject('Music and Arts')).toBe(true);
            expect(isMusicArtsSubject('Music & Arts')).toBe(true);
            expect(isMusicArtsSubject('Music and Arts 7')).toBe(true);
            expect(isMusicArtsSubject('Music')).toBe(true);

            expect(isPeHealthSubject('Physical Education and Health')).toBe(true);
            expect(isPeHealthSubject('PE and Health')).toBe(true);
            expect(isPeHealthSubject('PE & Health 7')).toBe(true);
            expect(isPeHealthSubject('Physical Education')).toBe(true);
        });

        it('computes MAPEH composite as exact average of live component grades', () => {
            const hpsMA = {
                id: 'hps-ma-1',
                subject_id: 'sub-ma',
                quarter: 1,
                school_year: schoolYear,
                ww: [20, 20, 20],
                pt: [30, 30],
                qa: [20, 20],
            } as unknown as HPSRecord;

            const hpsPE = {
                id: 'hps-pe-1',
                subject_id: 'sub-pe',
                quarter: 1,
                school_year: schoolYear,
                ww: [20, 20, 20],
                pt: [30, 30],
                qa: [20, 20],
            } as unknown as HPSRecord;

            // Music & Arts scores: 85% initial -> transmutes to 87 in SY 2026-2027
            const recordMA = {
                id: 'rec-ma-1',
                student_lrn: student.lrn,
                subject_id: maSubj.id,
                subject_name: maSubj.subject_name,
                section_id: 'sec-1',
                quarter: 1,
                school_year: schoolYear,
                written_works: [17, 17, 17],
                performance_tasks: [25.5, 25.5],
                quarterly_exam: [17, 17],
                final_grade: 0
            } as unknown as ClassRecord;

            // PE & Health scores: 92% initial -> transmutes to 93 in SY 2026-2027
            const recordPE = {
                id: 'rec-pe-1',
                student_lrn: student.lrn,
                subject_id: peSubj.id,
                subject_name: peSubj.subject_name,
                section_id: 'sec-1',
                quarter: 1,
                school_year: schoolYear,
                written_works: [18.4, 18.4, 18.4],
                performance_tasks: [27.6, 27.6],
                quarterly_exam: [18.4, 18.4],
                final_grade: 0
            } as unknown as ClassRecord;

            const maGrade = computeLiveTransmutedGradeFromRecord(recordMA, hpsMA, {
                gradeLevel: 'Grade 7',
                schoolYear,
                weights: getWeights(getSubjectCluster('Music and Arts', 'Grade 7')),
                cluster: getSubjectCluster('Music and Arts', 'Grade 7')
            });

            const peGrade = computeLiveTransmutedGradeFromRecord(recordPE, hpsPE, {
                gradeLevel: 'Grade 7',
                schoolYear,
                weights: getWeights(getSubjectCluster('Physical Education and Health', 'Grade 7')),
                cluster: getSubjectCluster('Physical Education and Health', 'Grade 7')
            });

            expect(maGrade).toBe(87);
            expect(peGrade).toBe(93);

            // MAPEH Composite = (87 + 93) / 2 = 90
            const mapehComposite = Math.round((maGrade + peGrade) / 2);
            expect(mapehComposite).toBe(90);

            const descriptor = getGradeDescriptorWithFilipino(mapehComposite, 'Grade 7', schoolYear);
            expect(descriptor).toContain('Advancing');
        });
    });

    describe('SHS Single-Term Class Record & Final Summary Sync', () => {
        const studentLrn = '1004';
        const chemSubj: Subject = {
            id: 'sub-chem1',
            subject_name: 'General Chemistry 1',
            grade_level: 'Grade 11',
            term: 1 // Single term offering
        };

        it('displays term 1 grade as final grade for single-term subject and computes correct descriptor', () => {
            const hps = {
                id: 'hps-chem',
                subject_id: chemSubj.id,
                quarter: 1,
                school_year: schoolYear,
                ww: [25, 25],
                pt: [50, 50],
                qa: [50],
            } as unknown as HPSRecord;

            const record = {
                id: 'rec-chem-1',
                student_lrn: studentLrn,
                subject_id: chemSubj.id,
                subject_name: chemSubj.subject_name,
                section_id: 'sec-1',
                quarter: 1,
                school_year: schoolYear,
                written_works: [23, 23], // 92%
                performance_tasks: [46, 46], // 92%
                quarterly_exam: [46], // 92%
                final_grade: 0
            } as unknown as ClassRecord;

            const term1Grade = computeLiveTransmutedGradeFromRecord(record, hps, {
                gradeLevel: 'Grade 11',
                schoolYear,
                weights: getWeights(getSubjectCluster('General Chemistry 1', 'Grade 11')),
                cluster: getSubjectCluster('General Chemistry 1', 'Grade 11')
            });

            expect(term1Grade).toBe(93);

            // Single term calculation simulation:
            const offeredTerms = [1];
            const terms = [1, 2, 3].map(t => offeredTerms.includes(t) ? term1Grade : '');
            
            // For 1-term subject, final grade equals the single term grade
            const finalGrade = offeredTerms.length === 1 ? terms[offeredTerms[0] - 1] : 0;
            expect(finalGrade).toBe(93);

            const descriptor = getGradeDescriptorWithFilipino(Number(finalGrade), 'Grade 11', schoolYear);
            expect(descriptor).toContain('Advancing');
        });
    });

    describe('resolveStudentQuarterGrade backward compatibility and priority', () => {
        it('prioritizes an explicitly published manual Grade Management override', () => {
            const gradingSheetRecord = {
                id: 'gs-1',
                student_lrn: '1005',
                subject_id: 'sub-eng',
                subject_name: 'English',
                section_id: 'sec-1',
                quarter: 1,
                school_year: schoolYear,
                final_grade: 89,
                grade_source: 'manual_override',
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0
            } as unknown as ClassRecord;

            const classRecord = {
                id: 'cr-1',
                student_lrn: '1005',
                subject_id: 'sub-eng',
                subject_name: 'English',
                section_id: 'sec-1',
                quarter: 1,
                school_year: schoolYear,
                final_grade: 85,
                written_works: [10],
                performance_tasks: [10],
                quarterly_exam: 10
            } as unknown as ClassRecord;

            const grade = resolveStudentQuarterGrade({
                studentLrn: '1005',
                subjectId: 'sub-eng',
                subjectName: 'English',
                quarter: 1,
                schoolYear,
                gradingSheetRecords: [gradingSheetRecord],
                classRecords: [classRecord]
            });

            expect(grade).toBe(89);
        });

        it('falls back to live calculation when gradingSheetRecords and classRecords final_grade are 0', () => {
            const classRecord = {
                id: 'cr-2',
                student_lrn: '1006',
                subject_id: 'sub-fil',
                subject_name: 'Filipino',
                section_id: 'sec-1',
                quarter: 1,
                school_year: schoolYear,
                final_grade: 0,
                written_works: [20, 20],
                performance_tasks: [25, 25],
                quarterly_exam: 50
            } as unknown as ClassRecord;

            const hps = {
                id: 'hps-fil',
                subject_id: 'sub-fil',
                quarter: 1,
                school_year: schoolYear,
                ww: [20, 20],
                pt: [25, 25],
                qa: [50]
            } as unknown as HPSRecord;

            const grade = resolveStudentQuarterGrade({
                studentLrn: '1006',
                subjectId: 'sub-fil',
                subjectName: 'Filipino',
                quarter: 1,
                schoolYear,
                gradingSheetRecords: [],
                classRecords: [classRecord],
                hpsRecords: [hps],
                sectionGradeLevel: 'Grade 8'
            });

            // 100% scores transmute to 100
            expect(grade).toBe(100);
        });
    });
});
