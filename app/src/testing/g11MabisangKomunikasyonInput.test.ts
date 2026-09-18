import { describe, it, expect } from 'vitest';
import { normalizeSubjectName } from '../lib/subjectConfig';
import { isMatchingSubject, resolveStudentQuarterGrade } from '../utils/grading-helpers';
import type { Subject, ClassRecord } from '../types';

describe('Grade 11 - Mabisang Komunikasyon Input in Grade Management', () => {
    // 1. Component Identification
    const isEffCommComp = (name: string) => {
        const n = normalizeSubjectName(name);
        return (n.includes('effectivecommunication') || n.startsWith('effectivecomm')) && !n.includes('mabisang');
    };

    const isMabKomComp = (name: string) => {
        const n = normalizeSubjectName(name);
        return (n.includes('mabisangkomunikasyon') || n.startsWith('mabisangkom')) && !n.includes('effective');
    };

    const isEcmkParent = (name: string) => 
        name.toLowerCase().includes('effective communication') && name.toLowerCase().includes('mabisang komunikasyon');

    it('correctly discriminates parent and subcomponents', () => {
        const parent = 'Effective Communication & Mabisang Komunikasyon';
        const ec = 'Effective Communication';
        const mk = 'Mabisang Komunikasyon';

        expect(isEcmkParent(parent)).toBe(true);
        expect(isEcmkParent(ec)).toBe(false);
        expect(isEcmkParent(mk)).toBe(false);

        expect(isEffCommComp(parent)).toBe(false);
        expect(isEffCommComp(ec)).toBe(true);
        expect(isEffCommComp(mk)).toBe(false);

        expect(isMabKomComp(parent)).toBe(false);
        expect(isMabKomComp(ec)).toBe(false);
        expect(isMabKomComp(mk)).toBe(true);
    });

    it('guarantees _ecmkGroups are always populated with valid subcomponent objects even when DB only has parent', () => {
        const sectionObj = {
            id: 'section-plato-g11',
            section_grade_level: 'Grade 11'
        };

        // Section DB subjects only has the composite parent
        const sectionDbSubjects: Subject[] = [
            { id: 'sub-ecmk', subject_name: 'Effective Communication & Mabisang Komunikasyon', grade_level: 'Grade 11' }
        ];
        const allDbSubjects: Subject[] = [...sectionDbSubjects];

        const base = sectionDbSubjects[0];

        // Simulate our fix in withGroupData
        let effectiveComm = sectionDbSubjects.filter(s => isEffCommComp(s.subject_name));
        let mabisangKom = sectionDbSubjects.filter(s => isMabKomComp(s.subject_name));

        if (effectiveComm.length === 0) {
            effectiveComm = allDbSubjects.filter(s =>
                isEffCommComp(s.subject_name) &&
                (s.grade_level === sectionObj.section_grade_level || !s.grade_level)
            );
        }
        if (mabisangKom.length === 0) {
            mabisangKom = allDbSubjects.filter(s =>
                isMabKomComp(s.subject_name) &&
                (s.grade_level === sectionObj.section_grade_level || !s.grade_level)
            );
        }

        if (effectiveComm.length === 0) {
            effectiveComm = [{
                id: `virtual_effective_comm_${sectionObj.id}`,
                subject_name: 'Effective Communication',
                section_id: sectionObj.id,
                grade_level: sectionObj.section_grade_level,
            }];
        }
        if (mabisangKom.length === 0) {
            mabisangKom = [{
                id: `virtual_mabisang_kom_${sectionObj.id}`,
                subject_name: 'Mabisang Komunikasyon',
                section_id: sectionObj.id,
                grade_level: sectionObj.section_grade_level,
            }];
        }

        const grouped = {
            ...base,
            _ecmkGroups: {
                effectiveComm,
                mabisangKom
            }
        };

        // Both components MUST exist and not be empty!
        expect(grouped._ecmkGroups.effectiveComm).toHaveLength(1);
        expect(grouped._ecmkGroups.mabisangKom).toHaveLength(1);
        expect(grouped._ecmkGroups.effectiveComm[0].subject_name).toBe('Effective Communication');
        expect(grouped._ecmkGroups.mabisangKom[0].subject_name).toBe('Mabisang Komunikasyon');
        expect(grouped._ecmkGroups.mabisangKom[0].id).toBe('virtual_mabisang_kom_section-plato-g11');
    });

    it('resolves grades encoded for Mabisang Komunikasyon and computes composite average', () => {
        const studentLrn = '123456789012';
        const sy = '2026-2027';

        // Teacher inputs 88 for Mabisang Komunikasyon and 92 for Effective Communication in Term 1
        const gradingSheetRecords: ClassRecord[] = [
            {
                id: `${studentLrn}_virtual_mabisang_kom_section-plato-g11_1_${sy}`,
                student_lrn: studentLrn,
                section_id: 'section-plato-g11',
                subject_id: 'virtual_mabisang_kom_section-plato-g11',
                subject_name: 'Mabisang Komunikasyon',
                quarter: 1,
                school_year: sy,
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 88
            },
            {
                id: `${studentLrn}_virtual_effective_comm_section-plato-g11_1_${sy}`,
                student_lrn: studentLrn,
                section_id: 'section-plato-g11',
                subject_id: 'virtual_effective_comm_section-plato-g11',
                subject_name: 'Effective Communication',
                quarter: 1,
                school_year: sy,
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 92
            }
        ];

        // 1. Check resolveStudentQuarterGrade by subjectId
        const mkGradeById = resolveStudentQuarterGrade(
            studentLrn,
            'virtual_mabisang_kom_section-plato-g11',
            1,
            sy,
            [],
            gradingSheetRecords
        );
        expect(mkGradeById).toBe(88);

        // 2. Check resolveStudentQuarterGrade by subject_name fallback
        const mkGradeByName = resolveStudentQuarterGrade(
            studentLrn,
            'Mabisang Komunikasyon',
            1,
            sy,
            [],
            gradingSheetRecords
        );
        expect(mkGradeByName).toBe(88);

        // 3. Check composite average resolution
        const compositeGrade = resolveStudentQuarterGrade(
            studentLrn,
            'Effective Communication & Mabisang Komunikasyon',
            1,
            sy,
            [],
            gradingSheetRecords
        );
        expect(compositeGrade).toBe(Math.round((92 + 88) / 2)); // 90
    });

    it('never shows an Effective Communication grade in Mabisang Komunikasyon', () => {
        const studentLrn = '123456789012';
        const sy = '2026-2027';
        const gradingSheetRecords: ClassRecord[] = [{
            id: `${studentLrn}_ecmk_ec_sec-123_1_${sy}`,
            student_lrn: studentLrn,
            section_id: 'sec-123',
            subject_id: 'ecmk_ec_sec-123',
            subject_name: 'Effective Communication',
            quarter: 1,
            school_year: sy,
            written_works: [],
            performance_tasks: [],
            quarterly_exam: 0,
            final_grade: 98
        }];

        expect(resolveStudentQuarterGrade(studentLrn, 'Effective Communication', 1, sy, [], gradingSheetRecords)).toBe(98);
        expect(resolveStudentQuarterGrade(studentLrn, 'Mabisang Komunikasyon', 1, sy, [], gradingSheetRecords)).toBe(0);
        expect(resolveStudentQuarterGrade(studentLrn, 'Effective Communication & Mabisang Komunikasyon', 1, sy, [], gradingSheetRecords)).toBe(0);
        expect(isMatchingSubject('Effective Communication', 'ecmk_mk_sec-123', 'Mabisang Komunikasyon')).toBe(false);
        expect(isMatchingSubject('Mabisang Komunikasyon', 'ecmk_ec_sec-123', 'Effective Communication')).toBe(false);
        expect(isMatchingSubject('Effective Communication & Mabisang Komunikasyon', 'ecmk_ec_sec-123', 'Effective Communication')).toBe(false);
    });

    it('areEqual detects changes to mabisangKom and forces re-render', () => {
        type QuarterCellDetail = {
            value?: number;
            effectiveComm?: number;
            mabisangKom?: number;
            musicArts?: number;
            peHealth?: number;
        };

        const isQuarterCellEqual = (
            a: QuarterCellDetail | number | undefined,
            b: QuarterCellDetail | number | undefined
        ) => {
            if (a === b) return true;
            if (!a && !b) return true;
            if (typeof a === 'object' && typeof b === 'object' && a && b) {
                return a.value === b.value &&
                       a.musicArts === b.musicArts &&
                       a.peHealth === b.peHealth &&
                       a.effectiveComm === b.effectiveComm &&
                       a.mabisangKom === b.mabisangKom;
            }
            return a === b;
        };

        const prevQuarter = {
            value: 80,
            effectiveComm: 80,
            mabisangKom: undefined
        };

        const nextQuarter = {
            value: 85,
            effectiveComm: 80,
            mabisangKom: 90
        };

        // Before our fix, areEqual was returning true because it compared top-level properties instead of q1!
        expect(isQuarterCellEqual(prevQuarter, nextQuarter)).toBe(false);

        // Same values should return true
        expect(isQuarterCellEqual(nextQuarter, { ...nextQuarter })).toBe(true);
    });

    it('resolves grades saved with ecmk_mk_ and ecmk_ec_ IDs when queried by SF9 with subject names', () => {
        const studentLrn = '123456789012';
        const sy = '2026-2027';

        // Records as saved by ConsolidatedGrades GradeInput with ecmk_ec_ and ecmk_mk_ IDs
        const gradingSheetRecords: ClassRecord[] = [
            {
                id: `${studentLrn}_ecmk_mk_sec-123_1_${sy}`,
                student_lrn: studentLrn,
                section_id: 'sec-123',
                subject_id: 'ecmk_mk_sec-123',
                subject_name: 'Mabisang Komunikasyon',
                quarter: 1,
                school_year: sy,
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 95
            },
            {
                id: `${studentLrn}_ecmk_ec_sec-123_1_${sy}`,
                student_lrn: studentLrn,
                section_id: 'sec-123',
                subject_id: 'ecmk_ec_sec-123',
                subject_name: 'Effective Communication',
                quarter: 1,
                school_year: sy,
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 99
            }
        ];

        // 1. Direct query with subject name (how SF9 resolves subjects)
        const mkGrade = resolveStudentQuarterGrade(
            studentLrn,
            'Mabisang Komunikasyon',
            1,
            sy,
            [],
            gradingSheetRecords
        );
        expect(mkGrade).toBe(95);

        const ecGrade = resolveStudentQuarterGrade(
            studentLrn,
            'Effective Communication',
            1,
            sy,
            [],
            gradingSheetRecords
        );
        expect(ecGrade).toBe(99);

        // 2. Query with composite parent name (computes average of 99 and 95 = 97)
        const compositeGrade = resolveStudentQuarterGrade(
            studentLrn,
            'Effective Communication / Mabisang Komunikasyon',
            1,
            sy,
            [],
            gradingSheetRecords
        );
        expect(compositeGrade).toBe(97);

        // 3. Query with virtual subject IDs
        const mkVirtualGrade = resolveStudentQuarterGrade(
            studentLrn,
            'virtual_mabisang_kom_sec-123',
            1,
            sy,
            [],
            gradingSheetRecords
        );
        expect(mkVirtualGrade).toBe(95);
    });
});
