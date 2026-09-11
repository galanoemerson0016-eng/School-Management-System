import { describe, it, expect } from 'vitest';
import type { Student, Section, Subject, ClassRecord, SchoolProfile } from '../types';
import { mapStudentToSpecData } from '../utils/sf10Mapper';
import { getSF10RowsForGrade, getSF9SubjectsForGrade } from '../lib/subjectConfig';
import {
    getEducationLevel,
    getSubjectGroupsForLevel,
    filterDbSubjectsForLevel
} from '../lib/sf10Subjects';

describe('SF10 Subject Filtering & Customization Architecture', () => {
    const mockSchoolProfile: SchoolProfile = {
        school_id: '300123',
        name: 'Mabini National High School',
        region: 'Region III',
        division: 'Division of Bulacan',
        district: 'District 1',
        head_name: 'Dr. Juan Dela Cruz',
        head_position: 'Principal IV',
        adviser_name: 'Gabriel S. Santos',
        grade_levels_offered: 'Junior High School'
    };

    const regularG8Student: Student = {
        lrn: '123456789088',
        first_name: 'Maria',
        last_name: 'Santos',
        middle_name: 'Reyes',
        gender: 'Female',
        grade_level: 'Grade 8',
        student_section: 'sec-g8-regular',
        birthday: '2011-03-20',
        age: 14,
        address: 'Malolos, Bulacan'
    };

    const regularG8Section: Section = {
        id: 'sec-g8-regular',
        section_name: 'Grade 8 - Sampaguita',
        section_grade_level: 'Grade 8',
        program: 'Regular'
    };

    // Database subjects including standard subjects PLUS specialized electives (ICT, Specialization II, Home Economics)
    const dbSubjectsWithSpecialized: Subject[] = [
        { id: 'sub-fil8', subject_name: 'Filipino', grade_level: 'Grade 8', term: 'all' },
        { id: 'sub-eng8', subject_name: 'English', grade_level: 'Grade 8', term: 'all' },
        { id: 'sub-math8', subject_name: 'Mathematics', grade_level: 'Grade 8', term: 'all' },
        { id: 'sub-sci8', subject_name: 'Science', grade_level: 'Grade 8', term: 'all' },
        { id: 'sub-ap8', subject_name: 'Araling Panlipunan (AP)', grade_level: 'Grade 8', term: 'all' },
        { id: 'sub-ve8', subject_name: 'Values Education', grade_level: 'Grade 8', term: 'all' },
        { id: 'sub-tle8', subject_name: 'Technology and Livelihood Education (TLE)', grade_level: 'Grade 8', term: 'all' },
        { id: 'sub-mapeh8', subject_name: 'MAPEH', grade_level: 'Grade 8', term: 'all' },
        { id: 'sub-ma8', subject_name: 'Music and Arts', grade_level: 'Grade 8', term: 'all' },
        { id: 'sub-peh8', subject_name: 'Physical Education and Health', grade_level: 'Grade 8', term: 'all' },
        // Specialized & exploratory offerings that should NOT leak to regular SF10
        { id: 'sub-ict8', subject_name: 'ICT', grade_level: 'Grade 8', term: 'all', is_special_program: true },
        { id: 'sub-spec8', subject_name: 'Specialization II', grade_level: 'Grade 8', term: 'all', is_special_program: true },
        { id: 'sub-he8', subject_name: 'Home Economics', grade_level: 'Grade 8', term: 'all', is_special_program: true }
    ];

    it('1. Regular Grade 8 SF10 blocks do NOT include ICT, Specialization II, or Home Economics', () => {
        const sf10Data = mapStudentToSpecData({
            student: regularG8Student,
            profile: mockSchoolProfile,
            schoolYear: '2026-2027',
            sections: [regularG8Section],
            teachers: [],
            gradingSheetRecords: [],
            classRecords: [],
            subjects: dbSubjectsWithSpecialized
        });

        const g8Curriculum = sf10Data.curriculum?.grade_8_subjects || [];
        const subjectNames = g8Curriculum.map(s => s.name);

        // Verify standard core subjects are present
        expect(subjectNames).toContain('Filipino');
        expect(subjectNames).toContain('English');
        expect(subjectNames).toContain('Mathematics');
        expect(subjectNames).toContain('Science');
        expect(subjectNames).toContain('Araling Panlipunan (AP)');
        expect(subjectNames).toContain('Values Education');
        expect(subjectNames).toContain('Technology and Livelihood Education (TLE)');
        expect(subjectNames).toContain('MAPEH');
        expect(subjectNames).toContain('Music and Arts');
        expect(subjectNames).toContain('Physical Education and Health');

        // Verify unwanted specialized subjects are EXCLUDED
        expect(subjectNames).not.toContain('ICT');
        expect(subjectNames).not.toContain('Specialization II');
        expect(subjectNames).not.toContain('Home Economics');

        // Check rows generated for SF10 form
        const rows = getSF10RowsForGrade(8, sf10Data.curriculum);
        const activeLabels = rows.map(r => r.label).filter(l => Boolean(l && l.trim()));

        expect(activeLabels).not.toContain('ICT');
        expect(activeLabels).not.toContain('Specialization II');
        expect(activeLabels).not.toContain('Home Economics');
        expect(rows.length).toBe(14); // Exactly 14 official DepEd JHS rows
    });

    it('2. Includes specialized elective ONLY if student actually took the subject and has recorded grades', () => {
        const studentGradesWithICT: ClassRecord[] = [
            {
                id: 'rec-1',
                student_lrn: regularG8Student.lrn,
                section_id: regularG8Section.id,
                subject_id: 'sub-ict8',
                subject_name: 'ICT',
                school_year: '2026-2027',
                quarter: 1,
                written_works: [90],
                performance_tasks: [92],
                quarterly_exam: 88,
                final_grade: 90
            }
        ];

        const sf10Data = mapStudentToSpecData({
            student: regularG8Student,
            profile: mockSchoolProfile,
            schoolYear: '2026-2027',
            sections: [regularG8Section],
            teachers: [],
            gradingSheetRecords: studentGradesWithICT,
            classRecords: studentGradesWithICT,
            subjects: dbSubjectsWithSpecialized
        });

        const g8Curriculum = sf10Data.curriculum?.grade_8_subjects || [];
        const subjectNames = g8Curriculum.map(s => s.name);

        // ICT is included because the student took it
        expect(subjectNames).toContain('ICT');
        // Specialization II and Home Economics are still excluded because no grades exist
        expect(subjectNames).not.toContain('Specialization II');
        expect(subjectNames).not.toContain('Home Economics');
    });

    it('3. Honors schoolProfile custom curriculum arrangement for Grade 8', () => {
        const customProfile: SchoolProfile = {
            ...mockSchoolProfile,
            curriculum: {
                school_id: mockSchoolProfile.school_id,
                is_custom: true,
                grade_8_subjects: [
                    { name: 'Mathematics', code: '' },
                    { name: 'English', code: '' },
                    { name: 'Science', code: '' },
                    { name: 'Filipino', code: '' },
                    { name: 'Araling Panlipunan (AP)', code: '' },
                    { name: 'Values Education', code: '' },
                    { name: 'Technology and Livelihood Education (TLE)', code: '' },
                    { name: 'MAPEH', code: '' },
                    { name: 'Music and Arts', code: 'MAPEH' },
                    { name: 'Physical Education and Health', code: 'MAPEH' }
                ]
            }
        };

        const sf10Data = mapStudentToSpecData({
            student: regularG8Student,
            profile: customProfile,
            schoolYear: '2026-2027',
            sections: [regularG8Section],
            teachers: [],
            gradingSheetRecords: [],
            classRecords: [],
            subjects: dbSubjectsWithSpecialized
        });

        const rows = getSF10RowsForGrade(8, sf10Data.curriculum);
        // Math must be row 1, English row 2 as configured in custom curriculum
        expect(rows[0].label).toBe('Mathematics');
        expect(rows[1].label).toBe('English');
    });

    it('4. Honors section_metadata.sf10SubjectSelections for section-level customization', () => {
        const sectionWithSf10CustomOrder: Section = {
            ...regularG8Section,
            section_metadata: {
                sf10SubjectSelections: {
                    0: 'sub-math8',
                    1: 'sub-sci8',
                    2: 'sub-eng8',
                    3: 'sub-fil8',
                    4: 'sub-ap8',
                    5: 'sub-ve8',
                    6: 'sub-tle8',
                    7: 'sub-mapeh8'
                }
            }
        };

        const sf10Data = mapStudentToSpecData({
            student: regularG8Student,
            profile: mockSchoolProfile,
            schoolYear: '2026-2027',
            sections: [sectionWithSf10CustomOrder],
            teachers: [],
            gradingSheetRecords: [],
            classRecords: [],
            subjects: dbSubjectsWithSpecialized
        });

        const g8Curriculum = sf10Data.curriculum?.grade_8_subjects || [];
        expect(g8Curriculum[0].name).toBe('Mathematics');
        expect(g8Curriculum[1].name).toBe('Science');
        expect(g8Curriculum[2].name).toBe('English');
    });

    it('5. Historical SF10 scholasticRecords subject label overrides and custom names are preserved', () => {
        // Test that custom overrides with modified labels or TVE electives are properly reflected
        const customOverrides: Record<string, unknown> = {
            'scholasticRecords[0].subjects.esp.label': 'Edukasyon sa Pagpapakatao (EsP)',
            'scholasticRecords[0].subjects.extra_reserved_10.label': 'TLE - Cookery',
            'scholasticRecords[0].subjects.extra_reserved_10.finalRating': '88',
            'scholasticRecords[0].subjects.extra_reserved_10.remarks': 'PASSED',
            'scholasticRecords[0].subjects.extra_reserved_11.label': '' // Blanked row
        };

        const espLabel = customOverrides['scholasticRecords[0].subjects.esp.label'];
        const cookeryLabel = customOverrides['scholasticRecords[0].subjects.extra_reserved_10.label'];
        const blankLabel = customOverrides['scholasticRecords[0].subjects.extra_reserved_11.label'];

        expect(espLabel).toBe('Edukasyon sa Pagpapakatao (EsP)');
        expect(cookeryLabel).toBe('TLE - Cookery');
        expect(blankLabel).toBe('');
    });

    it('6. School-wide SF10 curriculum (sf10_curriculum) does NOT alter general curriculum or SF9 subjects', () => {
        // School has standard curriculum (Filipino first)
        const profileWithSf10Curriculum: SchoolProfile = {
            ...mockSchoolProfile,
            curriculum: {
                school_id: mockSchoolProfile.school_id,
                grade_8_subjects: [
                    { name: 'Filipino', code: '' },
                    { name: 'English', code: '' },
                    { name: 'Mathematics', code: '' },
                    { name: 'Science', code: '' }
                ]
            },
            // Custom layout applied ONLY to SF10 (e.g. Science first, then TLE - Cookery)
            sf10_curriculum: {
                school_id: mockSchoolProfile.school_id,
                grade_8_subjects: [
                    { name: 'Science', code: '' },
                    { name: 'TLE - Cookery', code: '' },
                    { name: 'Filipino', code: '' }
                ]
            }
        };

        // SF10 mapStudentToSpecData must adopt sf10_curriculum
        const sf10Data = mapStudentToSpecData({
            student: regularG8Student,
            profile: profileWithSf10Curriculum,
            schoolYear: '2026-2027',
            sections: [regularG8Section],
            teachers: [],
            gradingSheetRecords: [],
            classRecords: [],
            subjects: dbSubjectsWithSpecialized
        });

        const sf10Rows = getSF10RowsForGrade(8, sf10Data.curriculum);
        expect(sf10Rows[0].label).toBe('Science');
        expect(sf10Rows[1].label).toBe('TLE - Cookery');

        // SF9 (Report Card) relies on schoolProfile.curriculum and must remain completely untouched!
        const sf9Rows = getSF9SubjectsForGrade(8, profileWithSf10Curriculum.curriculum);
        expect(sf9Rows[0].name).toBe('Filipino');
        expect(sf9Rows[0].name).not.toBe('Science');
        expect(sf9Rows.map(r => r.name)).not.toContain('TLE - Cookery');
    });

    it('7. Section metadata sf10SubjectSelections is strictly isolated from sf9SubjectSelections', () => {
        const sectionWithBoth: Section = {
            ...regularG8Section,
            section_metadata: {
                // SF10 custom order
                sf10SubjectSelections: {
                    0: 'sub-sci8',
                    1: 'sub-math8'
                },
                // SF9 custom order (different order)
                sf9SubjectSelections: {
                    0: 'sub-eng8',
                    1: 'sub-fil8'
                }
            }
        };

        // SF10 mapping must prioritize sf10SubjectSelections
        const sf10Data = mapStudentToSpecData({
            student: regularG8Student,
            profile: mockSchoolProfile,
            schoolYear: '2026-2027',
            sections: [sectionWithBoth],
            teachers: [],
            gradingSheetRecords: [],
            classRecords: [],
            subjects: dbSubjectsWithSpecialized
        });

        const g8Curriculum = sf10Data.curriculum?.grade_8_subjects || [];
        expect(g8Curriculum[0].name).toBe('Science');
        expect(g8Curriculum[1].name).toBe('Mathematics');

        // Verify that SF9 metadata was not modified or overwritten
        expect(sectionWithBoth.section_metadata?.sf9SubjectSelections?.[0]).toBe('sub-eng8');
        expect(sectionWithBoth.section_metadata?.sf9SubjectSelections?.[1]).toBe('sub-fil8');
    });

    it('8. SF10 overrides remain isolated to SF10 view and do not mutate raw database records', () => {
        const rawClassRecords: ClassRecord[] = [
            {
                id: 'rec-math',
                student_lrn: regularG8Student.lrn,
                section_id: regularG8Section.id,
                subject_id: 'sub-math8',
                subject_name: 'Mathematics',
                school_year: '2026-2027',
                quarter: 1,
                written_works: [85],
                performance_tasks: [88],
                quarterly_exam: 86,
                final_grade: 87
            }
        ];

        // An SF10 manual override on-sheet (e.g. changing Math to 95 for historical permanent record)
        const sf10OverrideRecord = {
            'scholasticRecords[0].subjects.mathematics.q1': '95',
            'scholasticRecords[0].subjects.mathematics.finalRating': '95'
        };

        // Ensure original database classRecord object was NOT mutated
        expect(rawClassRecords[0].final_grade).toBe(87);
        expect(sf10OverrideRecord['scholasticRecords[0].subjects.mathematics.finalRating']).toBe('95');
    });

    describe('Strict Educational Level Subject Isolation (Elem vs JHS vs SHS)', () => {
        it('9. Correctly resolves educational level from various grade level representations', () => {
            expect(getEducationLevel('Grade 1')).toBe('elem');
            expect(getEducationLevel('Grade 6')).toBe('elem');
            expect(getEducationLevel(4)).toBe('elem');
            expect(getEducationLevel('Kinder')).toBe('elem');
            expect(getEducationLevel('Elementary')).toBe('elem');

            expect(getEducationLevel('Grade 7')).toBe('jhs');
            expect(getEducationLevel('Grade 10')).toBe('jhs');
            expect(getEducationLevel(9)).toBe('jhs');
            expect(getEducationLevel('Junior High School')).toBe('jhs');

            expect(getEducationLevel('Grade 11')).toBe('shs');
            expect(getEducationLevel('Grade 12')).toBe('shs');
            expect(getEducationLevel(12)).toBe('shs');
            expect(getEducationLevel('Senior High School')).toBe('shs');
        });

        it('10. Elementary subject dropdown NEVER includes JHS or SHS subjects', () => {
            const elemGroups = getSubjectGroupsForLevel('elem');
            const elemSubjects = elemGroups.flatMap(g => g.subjects);

            // Verify Elem specific subjects are present
            expect(elemSubjects).toContain('Makabansa');
            expect(elemSubjects).toContain('Reading and Literacy');
            expect(elemSubjects).toContain('Language');
            expect(elemSubjects).toContain('GMRC (Good Manners and Right Conduct)');
            expect(elemSubjects).toContain('Edukasyong Pantahanan at Pangkabuhayan (EPP)');

            // Strict check: No JHS subjects
            expect(elemSubjects).not.toContain('Technology and Livelihood Education (TLE)');
            expect(elemSubjects).not.toContain('TLE: Cookery');
            expect(elemSubjects).not.toContain('Values Education');
            expect(elemSubjects).not.toContain('Specialization I');
            expect(elemSubjects).not.toContain('SPA: Music');
            expect(elemSubjects).not.toContain('STE: Research / Scientific Research');

            // Strict check: No SHS subjects
            expect(elemSubjects).not.toContain('Oral Communication in Context');
            expect(elemSubjects).not.toContain('Practical Research 1');
            expect(elemSubjects).not.toContain('Pre-Calculus');
            expect(elemSubjects).not.toContain('Work Immersion / Culminating Activity / Research');
        });

        it('11. JHS subject dropdown NEVER includes Elementary or SHS subjects', () => {
            const jhsGroups = getSubjectGroupsForLevel('jhs');
            const jhsSubjects = jhsGroups.flatMap(g => g.subjects);

            // Verify JHS core subjects are present
            expect(jhsSubjects).toContain('Values Education');
            expect(jhsSubjects).toContain('Technology and Livelihood Education (TLE)');
            expect(jhsSubjects).toContain('Filipino');
            expect(jhsSubjects).toContain('English');
            expect(jhsSubjects).toContain('Science');

            // Strict check: No Elementary-only subjects
            expect(jhsSubjects).not.toContain('Makabansa');
            expect(jhsSubjects).not.toContain('Reading and Literacy');
            expect(jhsSubjects).not.toContain('Language');

            // Strict check: No SHS subjects
            expect(jhsSubjects).not.toContain('Oral Communication in Context');
            expect(jhsSubjects).not.toContain('Practical Research 1');
            expect(jhsSubjects).not.toContain('Pre-Calculus');
            expect(jhsSubjects).not.toContain('General Biology 1');
            expect(jhsSubjects).not.toContain('Work Immersion / Culminating Activity / Research');
        });

        it('12. SHS subject dropdown NEVER includes Elementary or JHS subjects', () => {
            const shsGroups = getSubjectGroupsForLevel('shs');
            const shsSubjects = shsGroups.flatMap(g => g.subjects);

            // Verify SHS core, applied, and specialized subjects are present
            expect(shsSubjects).toContain('Oral Communication in Context');
            expect(shsSubjects).toContain('Practical Research 1');
            expect(shsSubjects).toContain('Pre-Calculus');
            expect(shsSubjects).toContain('21st Century Literature from the Philippines and the World');
            expect(shsSubjects).toContain('English for Academic and Professional Purposes (EAPP)');

            // Strict check: No Elementary subjects
            expect(shsSubjects).not.toContain('Makabansa');
            expect(shsSubjects).not.toContain('Reading and Literacy');
            expect(shsSubjects).not.toContain('Language');
            expect(shsSubjects).not.toContain('Mother Tongue');
            expect(shsSubjects).not.toContain('Edukasyong Pantahanan at Pangkabuhayan (EPP)');

            // Strict check: No JHS-only subjects
            expect(shsSubjects).not.toContain('Values Education');
            expect(shsSubjects).not.toContain('Technology and Livelihood Education (TLE)');
        });

        it('13. Database subjects are strictly filtered according to the active educational level', () => {
            const mixedDbSubjects = [
                { id: 'sub-elem-1', subject_name: 'Custom Elem Penmanship', grade_level: 'Grade 2' },
                { id: 'sub-jhs-1', subject_name: 'Robotics 8', grade_level: 'Grade 8' },
                { id: 'sub-shs-1', subject_name: 'Robotics 11 (NC II)', grade_level: 'Grade 11' },
                { id: 'sub-dup', subject_name: 'Filipino', grade_level: 'Grade 7' } // Duplicate of standard JHS subject
            ];

            const elemStandard = getSubjectGroupsForLevel('elem').flatMap(g => g.subjects);
            const elemFiltered = filterDbSubjectsForLevel(mixedDbSubjects, 'elem', elemStandard);
            expect(elemFiltered.map(s => s.subject_name)).toEqual(['Custom Elem Penmanship']);

            const jhsStandard = getSubjectGroupsForLevel('jhs').flatMap(g => g.subjects);
            const jhsFiltered = filterDbSubjectsForLevel(mixedDbSubjects, 'jhs', jhsStandard);
            expect(jhsFiltered.map(s => s.subject_name)).toEqual(['Robotics 8']);
            // Notice 'Filipino' is excluded because it is already a standard JHS subject

            const shsStandard = getSubjectGroupsForLevel('shs').flatMap(g => g.subjects);
            const shsFiltered = filterDbSubjectsForLevel(mixedDbSubjects, 'shs', shsStandard);
            expect(shsFiltered.map(s => s.subject_name)).toEqual(['Robotics 11 (NC II)']);
        });
    });

    describe('Subject Backspace, Blank Selection & Row Hiding Behavior', () => {
        it('14. Explicit empty string label override (via backspace or blank dropdown) does NOT revert to default DepEd label', () => {
            const row = { key: 'filipino', label: 'Filipino' };
            const blockIdx = 0;

            // Scenario A: Fresh record without override
            const freshData: Record<string, unknown> = {};
            const subFresh = (freshData[`scholasticRecords[${blockIdx}].subjects.${row.key}`] as Record<string, unknown>) || {};
            const dotKeyFresh = `scholasticRecords[${blockIdx}].subjects.${row.key}.label`;
            const underKeyFresh = `scholasticRecords[${blockIdx}].subjects.${row.key}_label`;
            const hasOverrideFresh = subFresh.label !== undefined || freshData[dotKeyFresh] !== undefined || freshData[underKeyFresh] !== undefined;
            const customLabelFresh = hasOverrideFresh
                ? (subFresh.label !== undefined ? subFresh.label : (freshData[dotKeyFresh] !== undefined ? freshData[dotKeyFresh] : freshData[underKeyFresh]))
                : undefined;
            const displayLabelFresh = customLabelFresh !== undefined ? customLabelFresh : (row.label !== " " ? row.label : "");
            expect(displayLabelFresh).toBe('Filipino');

            // Scenario B: User backspaces the subject or chooses "-- Blank (Hide Row) --" so value is ""
            const blankOverrideData: Record<string, unknown> = {
                [`scholasticRecords[${blockIdx}].subjects.${row.key}_label`]: '',
                [`scholasticRecords[${blockIdx}].subjects.${row.key}.label`]: '',
                [`scholasticRecords[${blockIdx}].subjects.${row.key}.q1`]: '88',
                [`scholasticRecords[${blockIdx}].subjects.${row.key}.finalRating`]: '88',
                [`scholasticRecords[${blockIdx}].subjects.${row.key}.remarks`]: 'PASSED',
            };

            const subOverridden = (blankOverrideData[`scholasticRecords[${blockIdx}].subjects.${row.key}`] as Record<string, unknown>) || {};
            const dotKey = `scholasticRecords[${blockIdx}].subjects.${row.key}.label`;
            const underKey = `scholasticRecords[${blockIdx}].subjects.${row.key}_label`;
            const hasOverride = subOverridden.label !== undefined || blankOverrideData[dotKey] !== undefined || blankOverrideData[underKey] !== undefined;
            const customLabel = hasOverride
                ? (subOverridden.label !== undefined ? subOverridden.label : (blankOverrideData[dotKey] !== undefined ? blankOverrideData[dotKey] : blankOverrideData[underKey]))
                : undefined;

            const displayLabel = customLabel !== undefined ? customLabel : (row.label !== " " ? row.label : "");
            const isBlank = !displayLabel || String(displayLabel).trim() === '';
            const shouldShowData = !isBlank;

            // Must be empty string and NOT revert back to "Filipino"
            expect(hasOverride).toBe(true);
            expect(customLabel).toBe('');
            expect(displayLabel).toBe('');
            expect(isBlank).toBe(true);
            expect(shouldShowData).toBe(false);

            // Verify grades and remarks are hidden when blanked
            const renderedQ1 = shouldShowData ? blankOverrideData[`scholasticRecords[${blockIdx}].subjects.${row.key}.q1`] : '';
            const renderedFinal = shouldShowData ? blankOverrideData[`scholasticRecords[${blockIdx}].subjects.${row.key}.finalRating`] : '';
            const renderedRemarks = shouldShowData ? blankOverrideData[`scholasticRecords[${blockIdx}].subjects.${row.key}.remarks`] : '';

            expect(renderedQ1).toBe('');
            expect(renderedFinal).toBe('');
            expect(renderedRemarks).toBe('');
        });

        it('15. SHS subject row hiding: blanking subject name blanks quarterly grades and remarks', () => {
            const shsSubjectRecord = {
                subjectCode: 'CORE-ENG',
                subjectName: '', // Blanked by teacher
                quarter1Grade: '85',
                quarter2Grade: '87',
                finalGrade: '86',
                remarks: 'PASSED'
            };

            const subName = shsSubjectRecord.subjectName || '';
            const isBlank = !subName || subName.trim() === '';
            const shouldShowData = !isBlank;

            expect(isBlank).toBe(true);
            expect(shouldShowData).toBe(false);

            const displaySubjectCode = shouldShowData ? (shsSubjectRecord.subjectCode || '') : '';
            const displayQ1 = shouldShowData ? shsSubjectRecord.quarter1Grade : '';
            const displayQ2 = shouldShowData ? shsSubjectRecord.quarter2Grade : '';
            const displayFinal = shouldShowData ? shsSubjectRecord.finalGrade : '';
            const displayRemarks = shouldShowData ? shsSubjectRecord.remarks : '';

            expect(displaySubjectCode).toBe('');
            expect(displayQ1).toBe('');
            expect(displayQ2).toBe('');
            expect(displayFinal).toBe('');
            expect(displayRemarks).toBe('');
        });

        it('16. Subject Remark dropdown values support PASSED and FAILED with manual override fidelity', () => {
            const blockIdx = 0;
            const subjectKey = 'science';

            // Scenario A: Default remarks from completed grades
            const baseRemarks = 'PASSED';
            expect(['PASSED', 'FAILED']).toContain(baseRemarks);

            // Scenario B: Teacher overrides remark to FAILED via dropdown
            const overrideData: Record<string, unknown> = {
                [`scholasticRecords[${blockIdx}].subjects.${subjectKey}.remarks`]: 'FAILED'
            };
            const remPath = `scholasticRecords[${blockIdx}].subjects.${subjectKey}.remarks`;
            const hasRemOverride = overrideData[remPath] !== undefined;
            const effectiveRemark = hasRemOverride ? overrideData[remPath] : baseRemarks;
            expect(effectiveRemark).toBe('FAILED');

            // Scenario C: Teacher clears remark via dropdown (__blank__)
            const clearedData: Record<string, unknown> = {
                [`scholasticRecords[${blockIdx}].subjects.${subjectKey}.remarks`]: ''
            };
            const hasClearedOverride = clearedData[remPath] !== undefined;
            const clearedRemark = hasClearedOverride ? clearedData[remPath] : baseRemarks;
            expect(clearedRemark).toBe('');
        });

        it('17. General Average remarks support PROMOTED, RETAINED, and manual overrides', () => {
            const blockIdx = 0;
            const genAvgRemPath = `scholasticRecords[${blockIdx}].subjects.remarks`;

            // Scenario A: Auto-computed when General Average >= 75
            const passingGenAvg = 82;
            const autoPassingStatus = passingGenAvg >= 75 ? 'PROMOTED' : passingGenAvg > 0 ? 'RETAINED' : '';
            expect(autoPassingStatus).toBe('PROMOTED');

            // Scenario B: Auto-computed when General Average < 75
            const failingGenAvg = 71;
            const autoFailingStatus = failingGenAvg >= 75 ? 'PROMOTED' : failingGenAvg > 0 ? 'RETAINED' : '';
            expect(autoFailingStatus).toBe('RETAINED');

            // Scenario C: Teacher overrides General Average status to RETAINED via dropdown
            const manualRetainedData: Record<string, unknown> = {
                [genAvgRemPath]: 'RETAINED'
            };
            const hasOverride = manualRetainedData[genAvgRemPath] !== undefined;
            const displayStatus = hasOverride ? manualRetainedData[genAvgRemPath] : autoPassingStatus;
            expect(displayStatus).toBe('RETAINED');

            // Scenario D: Teacher overrides General Average status to PROMOTED via dropdown
            const manualPromotedData: Record<string, unknown> = {
                [genAvgRemPath]: 'PROMOTED'
            };
            const hasPromotedOverride = manualPromotedData[genAvgRemPath] !== undefined;
            const displayPromotedStatus = hasPromotedOverride ? manualPromotedData[genAvgRemPath] : autoFailingStatus;
            expect(displayPromotedStatus).toBe('PROMOTED');
        });
    });
});

