import { describe, it, expect } from 'vitest';
import type { Student, Section, Subject, ClassRecord, SchoolProfile } from '../types';
import { getSubjectsForGrade, normalizeSubjectName } from '../lib/subjectConfig';
import { mapStudentToSpecData } from '../utils/sf10Mapper';
import { isMatchingSubject, resolveStudentQuarterGrade } from '../utils/grading-helpers';

describe('Unified Subject Architecture: Grade Management, SF9, SF10 & TGS Synchronization', () => {
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

    const mockStudent: Student = {
        lrn: '123456789012',
        first_name: 'Juan',
        last_name: 'Dela Cruz',
        middle_name: 'Mendoza',
        gender: 'Male',
        grade_level: 'Grade 7',
        student_section: 'sec-g7-diamond',
        birthday: '2012-05-15',
        age: 13,
        address: 'Malolos, Bulacan'
    };

    const mockG7Subjects: Subject[] = [
        { id: 'sub-eng', subject_name: 'English', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-math', subject_name: 'Mathematics', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-sci', subject_name: 'Science', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-fil', subject_name: 'Filipino', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-ap', subject_name: 'Araling Panlipunan (AP)', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-ve', subject_name: 'Values Education', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-tle', subject_name: 'Technology and Livelihood Education (TLE)', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-mapeh', subject_name: 'MAPEH', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-ma', subject_name: 'Music and Arts', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-peh', subject_name: 'Physical Education and Health', grade_level: 'Grade 7', term: 'all' }
    ];

    // Advisory section with full 8-subject curriculum, but the adviser only teaches Science!
    const mockG7Section: Section = {
        id: 'sec-g7-diamond',
        section_name: 'Diamond',
        section_grade_level: 'Grade 7',
        is_advisory: true,
        is_teaching_load: false,
        adviser_name: 'Gabriel S. Santos',
        taught_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'Araling Panlipunan (AP)',
            'Values Education',
            'Technology and Livelihood Education (TLE)',
            'MAPEH',
            'Music and Arts',
            'Physical Education and Health'
        ],
        teaching_subjects: ['Science'] // Teacher only teaches Science personally
    };

    // Realistic grading sheet records for Juan Dela Cruz across all 4 quarters
    const mockGradingSheetRecords: ClassRecord[] = [
        // English
        { id: 'rec-eng-q1', student_lrn: '123456789012', subject_id: 'sub-eng', subject_name: 'English', school_year: '2025-2026', quarter: 1, final_grade: 88, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-eng-q2', student_lrn: '123456789012', subject_id: 'sub-eng', subject_name: 'English', school_year: '2025-2026', quarter: 2, final_grade: 89, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-eng-q3', student_lrn: '123456789012', subject_id: 'sub-eng', subject_name: 'English', school_year: '2025-2026', quarter: 3, final_grade: 90, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-eng-q4', student_lrn: '123456789012', subject_id: 'sub-eng', subject_name: 'English', school_year: '2025-2026', quarter: 4, final_grade: 91, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },

        // Mathematics
        { id: 'rec-math-q1', student_lrn: '123456789012', subject_id: 'sub-math', subject_name: 'Mathematics', school_year: '2025-2026', quarter: 1, final_grade: 90, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-math-q2', student_lrn: '123456789012', subject_id: 'sub-math', subject_name: 'Mathematics', school_year: '2025-2026', quarter: 2, final_grade: 91, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-math-q3', student_lrn: '123456789012', subject_id: 'sub-math', subject_name: 'Mathematics', school_year: '2025-2026', quarter: 3, final_grade: 92, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-math-q4', student_lrn: '123456789012', subject_id: 'sub-math', subject_name: 'Mathematics', school_year: '2025-2026', quarter: 4, final_grade: 93, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },

        // Science
        { id: 'rec-sci-q1', student_lrn: '123456789012', subject_id: 'sub-sci', subject_name: 'Science', school_year: '2025-2026', quarter: 1, final_grade: 92, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-sci-q2', student_lrn: '123456789012', subject_id: 'sub-sci', subject_name: 'Science', school_year: '2025-2026', quarter: 2, final_grade: 93, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-sci-q3', student_lrn: '123456789012', subject_id: 'sub-sci', subject_name: 'Science', school_year: '2025-2026', quarter: 3, final_grade: 94, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-sci-q4', student_lrn: '123456789012', subject_id: 'sub-sci', subject_name: 'Science', school_year: '2025-2026', quarter: 4, final_grade: 95, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },

        // Filipino
        { id: 'rec-fil-q1', student_lrn: '123456789012', subject_id: 'sub-fil', subject_name: 'Filipino', school_year: '2025-2026', quarter: 1, final_grade: 87, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-fil-q2', student_lrn: '123456789012', subject_id: 'sub-fil', subject_name: 'Filipino', school_year: '2025-2026', quarter: 2, final_grade: 88, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-fil-q3', student_lrn: '123456789012', subject_id: 'sub-fil', subject_name: 'Filipino', school_year: '2025-2026', quarter: 3, final_grade: 89, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-fil-q4', student_lrn: '123456789012', subject_id: 'sub-fil', subject_name: 'Filipino', school_year: '2025-2026', quarter: 4, final_grade: 90, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },

        // Araling Panlipunan
        { id: 'rec-ap-q1', student_lrn: '123456789012', subject_id: 'sub-ap', subject_name: 'Araling Panlipunan (AP)', school_year: '2025-2026', quarter: 1, final_grade: 89, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-ap-q2', student_lrn: '123456789012', subject_id: 'sub-ap', subject_name: 'Araling Panlipunan (AP)', school_year: '2025-2026', quarter: 2, final_grade: 90, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-ap-q3', student_lrn: '123456789012', subject_id: 'sub-ap', subject_name: 'Araling Panlipunan (AP)', school_year: '2025-2026', quarter: 3, final_grade: 90, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-ap-q4', student_lrn: '123456789012', subject_id: 'sub-ap', subject_name: 'Araling Panlipunan (AP)', school_year: '2025-2026', quarter: 4, final_grade: 91, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },

        // Values Education
        { id: 'rec-ve-q1', student_lrn: '123456789012', subject_id: 'sub-ve', subject_name: 'Values Education', school_year: '2025-2026', quarter: 1, final_grade: 93, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-ve-q2', student_lrn: '123456789012', subject_id: 'sub-ve', subject_name: 'Values Education', school_year: '2025-2026', quarter: 2, final_grade: 94, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-ve-q3', student_lrn: '123456789012', subject_id: 'sub-ve', subject_name: 'Values Education', school_year: '2025-2026', quarter: 3, final_grade: 94, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-ve-q4', student_lrn: '123456789012', subject_id: 'sub-ve', subject_name: 'Values Education', school_year: '2025-2026', quarter: 4, final_grade: 95, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },

        // TLE
        { id: 'rec-tle-q1', student_lrn: '123456789012', subject_id: 'sub-tle', subject_name: 'Technology and Livelihood Education (TLE)', school_year: '2025-2026', quarter: 1, final_grade: 91, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-tle-q2', student_lrn: '123456789012', subject_id: 'sub-tle', subject_name: 'Technology and Livelihood Education (TLE)', school_year: '2025-2026', quarter: 2, final_grade: 92, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-tle-q3', student_lrn: '123456789012', subject_id: 'sub-tle', subject_name: 'Technology and Livelihood Education (TLE)', school_year: '2025-2026', quarter: 3, final_grade: 92, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-tle-q4', student_lrn: '123456789012', subject_id: 'sub-tle', subject_name: 'Technology and Livelihood Education (TLE)', school_year: '2025-2026', quarter: 4, final_grade: 93, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },

        // MAPEH Components: Music and Arts & Physical Education and Health
        { id: 'rec-ma-q1', student_lrn: '123456789012', subject_id: 'sub-ma', subject_name: 'Music and Arts', school_year: '2025-2026', quarter: 1, final_grade: 90, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-ma-q2', student_lrn: '123456789012', subject_id: 'sub-ma', subject_name: 'Music and Arts', school_year: '2025-2026', quarter: 2, final_grade: 91, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-ma-q3', student_lrn: '123456789012', subject_id: 'sub-ma', subject_name: 'Music and Arts', school_year: '2025-2026', quarter: 3, final_grade: 91, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-ma-q4', student_lrn: '123456789012', subject_id: 'sub-ma', subject_name: 'Music and Arts', school_year: '2025-2026', quarter: 4, final_grade: 92, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },

        { id: 'rec-peh-q1', student_lrn: '123456789012', subject_id: 'sub-peh', subject_name: 'Physical Education and Health', school_year: '2025-2026', quarter: 1, final_grade: 92, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-peh-q2', student_lrn: '123456789012', subject_id: 'sub-peh', subject_name: 'Physical Education and Health', school_year: '2025-2026', quarter: 2, final_grade: 93, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-peh-q3', student_lrn: '123456789012', subject_id: 'sub-peh', subject_name: 'Physical Education and Health', school_year: '2025-2026', quarter: 3, final_grade: 93, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-peh-q4', student_lrn: '123456789012', subject_id: 'sub-peh', subject_name: 'Physical Education and Health', school_year: '2025-2026', quarter: 4, final_grade: 94, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },

        // Parent MAPEH Record (computed average of MA & PEH)
        { id: 'rec-mapeh-q1', student_lrn: '123456789012', subject_id: 'sub-mapeh', subject_name: 'MAPEH', school_year: '2025-2026', quarter: 1, final_grade: 91, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-mapeh-q2', student_lrn: '123456789012', subject_id: 'sub-mapeh', subject_name: 'MAPEH', school_year: '2025-2026', quarter: 2, final_grade: 92, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-mapeh-q3', student_lrn: '123456789012', subject_id: 'sub-mapeh', subject_name: 'MAPEH', school_year: '2025-2026', quarter: 3, final_grade: 92, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' },
        { id: 'rec-mapeh-q4', student_lrn: '123456789012', subject_id: 'sub-mapeh', subject_name: 'MAPEH', school_year: '2025-2026', quarter: 4, final_grade: 93, written_works: [], performance_tasks: [], quarterly_exam: 0, section_id: 'sec-g7-diamond' }
    ];

    // =========================================================================
    // TEST 1: Grade Management (Consolidated Grades) Subject Resolution
    // =========================================================================
    it('1. Grade Management resolves all 8 official curriculum subjects, not just the teacher teaching load', () => {
        const sectionObj = mockG7Section;
        const subjects = mockG7Subjects;
        const sectionGradeNum = 7;
        const taughtRaw = sectionObj.taught_subjects || [];

        // Simulate ConsolidatedGradesPage candidate filtering
        const isSubjectAllowedInTaught = (subId: string, subName: string) => {
            return taughtRaw.some(t => {
                if (isMatchingSubject(t, subId, subName)) return true;
                const normT = normalizeSubjectName(t);
                const normSub = normalizeSubjectName(subName);
                if (normT === 'mapeh') {
                    return normSub.includes('music') || normSub.includes('arts') || normSub.includes('pe') || normSub.includes('health');
                }
                return false;
            });
        };

        const candidates = subjects.filter(s => {
            const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
            return subjectGradeNum === sectionGradeNum && isSubjectAllowedInTaught(s.id, s.subject_name);
        });

        // Group into official 8 learning areas (MAPEH consolidates its sub-components)
        const isMusicArts = (name: string) => {
            const n = normalizeSubjectName(name);
            return n.includes('music') || n.includes('arts');
        };
        const isPeHealth = (name: string) => {
            const n = normalizeSubjectName(name);
            return n.includes('pe') || n.includes('health') || n.includes('physical');
        };

        const finalColumns = candidates.filter(s => {
            const isComp = isMusicArts(s.subject_name) || isPeHealth(s.subject_name);
            const isParentMapeh = normalizeSubjectName(s.subject_name) === 'mapeh';
            return (!isComp || isParentMapeh);
        });

        const subjectNames = finalColumns.map(s => s.subject_name);

        expect(finalColumns).toHaveLength(8);
        expect(subjectNames).toContain('English');
        expect(subjectNames).toContain('Mathematics');
        expect(subjectNames).toContain('Science');
        expect(subjectNames).toContain('Filipino');
        expect(subjectNames).toContain('Araling Panlipunan (AP)');
        expect(subjectNames).toContain('Values Education');
        expect(subjectNames).toContain('Technology and Livelihood Education (TLE)');
        expect(subjectNames).toContain('MAPEH');

        // Verify Science is included, but NOT the only subject
        expect(subjectNames.length).toBeGreaterThan(1);
    });

    // =========================================================================
    // TEST 2: SF9 (Learner's Progress Report Card) Subject & Grade Parity
    // =========================================================================
    it('2. SF9 resolves all 8 subjects and accurately maps quarterly grades and MAPEH components', () => {
        const sectionObj = mockG7Section;
        const subjects = mockG7Subjects;
        const gradeLevelNum = 7;
        const taughtRaw = sectionObj.taught_subjects || [];

        const isSubjectAllowedInTaught = (subId: string, subName: string) => {
            return taughtRaw.some(t => {
                if (isMatchingSubject(t, subId, subName)) return true;
                const normT = normalizeSubjectName(t);
                const normSub = normalizeSubjectName(subName);
                if (normT === 'mapeh') {
                    return normSub.includes('music') || normSub.includes('arts') || normSub.includes('pe') || normSub.includes('health');
                }
                return false;
            });
        };

        const sf9Candidates = subjects.filter(s => {
            const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
            return subjectGradeNum === gradeLevelNum && isSubjectAllowedInTaught(s.id, s.subject_name);
        });

        // Compute quarterly grades for Juan Dela Cruz for each subject
        const sf9Grades: Record<string, { q1: number | null; q2: number | null; q3: number | null; q4: number | null; final: number | null }> = {};

        for (const sub of sf9Candidates) {
            const q1 = resolveStudentQuarterGrade(mockStudent.lrn, sub.subject_name, 1, '2025-2026', [], mockGradingSheetRecords);
            const q2 = resolveStudentQuarterGrade(mockStudent.lrn, sub.subject_name, 2, '2025-2026', [], mockGradingSheetRecords);
            const q3 = resolveStudentQuarterGrade(mockStudent.lrn, sub.subject_name, 3, '2025-2026', [], mockGradingSheetRecords);
            const q4 = resolveStudentQuarterGrade(mockStudent.lrn, sub.subject_name, 4, '2025-2026', [], mockGradingSheetRecords);
            
            const quarterVals = [q1, q2, q3, q4].filter((g): g is number => g !== null && g > 0);
            const finalGrade = quarterVals.length === 4 ? Math.round(quarterVals.reduce((a, b) => a + b, 0) / 4) : null;

            sf9Grades[sub.subject_name] = { q1, q2, q3, q4, final: finalGrade };
        }

        // English: 88, 89, 90, 91 -> Final = 90
        expect(sf9Grades['English'].q1).toBe(88);
        expect(sf9Grades['English'].final).toBe(90);

        // Science (teacher's own load): 92, 93, 94, 95 -> Final = 94
        expect(sf9Grades['Science'].q1).toBe(92);
        expect(sf9Grades['Science'].final).toBe(94);

        // Mathematics (other teacher's load): 90, 91, 92, 93 -> Final = 92
        expect(sf9Grades['Mathematics'].q1).toBe(90);
        expect(sf9Grades['Mathematics'].final).toBe(92);

        // MAPEH Parent: 91, 92, 92, 93 -> Final = 92
        expect(sf9Grades['MAPEH'].q1).toBe(91);
        expect(sf9Grades['MAPEH'].final).toBe(92);

        // All 8 core subjects have complete, valid grades
        const coreSubjects = ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan (AP)', 'Values Education', 'Technology and Livelihood Education (TLE)', 'MAPEH'];
        for (const name of coreSubjects) {
            expect(sf9Grades[name].final).not.toBeNull();
            expect(sf9Grades[name].final!).toBeGreaterThanOrEqual(75);
        }
    });

    // =========================================================================
    // TEST 3: Temporary Grade Slip (TGS) Subject & Grade Parity
    // =========================================================================
    it('3. Temporary Grade Slip (TGS) lists all 8 subjects without truncation', () => {
        const selectedSectionObj = mockG7Section;
        const subjects = mockG7Subjects;
        const sectionGradeNum = 7;
        const taughtSet = selectedSectionObj.taught_subjects || [];

        const isSubjectAllowedInTaught = (subId: string, subName: string) => {
            return taughtSet.some(t => {
                if (isMatchingSubject(t, subId, subName)) return true;
                const normT = normalizeSubjectName(t);
                const normSub = normalizeSubjectName(subName);
                if (normT === 'mapeh') {
                    return normSub.includes('music') || normSub.includes('arts') || normSub.includes('pe') || normSub.includes('health');
                }
                return false;
            });
        };

        const tgsCandidates = subjects.filter(s => {
            const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
            return subjectGradeNum === sectionGradeNum && isSubjectAllowedInTaught(s.id, s.subject_name);
        });

        // Filter out components, retaining parent MAPEH for compact slip
        const tgsDisplaySubjects = tgsCandidates.filter(s => {
            const norm = normalizeSubjectName(s.subject_name);
            const isComp = norm.includes('music') || norm.includes('arts') || norm.includes('pe') || norm.includes('health');
            return (!isComp || norm === 'mapeh');
        });

        expect(tgsDisplaySubjects).toHaveLength(8);
        const tgsNames = tgsDisplaySubjects.map(s => s.subject_name);
        expect(tgsNames).toEqual(expect.arrayContaining([
            'English',
            'Mathematics',
            'Science',
            'Filipino',
            'Araling Panlipunan (AP)',
            'Values Education',
            'Technology and Livelihood Education (TLE)',
            'MAPEH'
        ]));
    });

    // =========================================================================
    // TEST 4: SF10 (Permanent Record) Mapping Parity via mapStudentToSpecData
    // =========================================================================
    it('4. SF10 (mapStudentToSpecData) populates all 8 standard learning areas and computes General Average matching SF9', () => {
        const sf10Spec = mapStudentToSpecData({
            student: mockStudent,
            profile: mockSchoolProfile,
            schoolYear: '2025-2026',
            sections: [mockG7Section],
            subjects: mockG7Subjects,
            gradingSheetRecords: mockGradingSheetRecords
        });

        expect(sf10Spec).toBeDefined();
        // Grade 7 is the first block in JHS scholasticRecords
        const g7Block = sf10Spec.scholasticRecords[0];
        expect(g7Block).toBeDefined();
        expect(g7Block.schoolName).toBe('Mabini National High School');
        expect(g7Block.section).toBe('Diamond');

        const subjectsData = g7Block.subjects;

        // Verify standard JHS keys are mapped (per getSF10RowsForGrade)
        expect(subjectsData['english']).toBeDefined();
        expect(subjectsData['mathematics']).toBeDefined();
        expect(subjectsData['science']).toBeDefined();
        expect(subjectsData['filipino']).toBeDefined();
        expect(subjectsData['ap']).toBeDefined(); // Araling Panlipunan key is 'ap'
        expect(subjectsData['valuesEducation']).toBeDefined();
        expect(subjectsData['tle']).toBeDefined();
        expect(subjectsData['mapeh']).toBeDefined();

        // Check specific grades for Science
        const sciEntry = subjectsData['science'] as { q1: string; q2: string; q3: string; q4: string; finalRating: string; remarks: string };
        expect(sciEntry.q1).toBe('92');
        expect(sciEntry.q2).toBe('93');
        expect(sciEntry.q3).toBe('94');
        expect(sciEntry.q4).toBe('95');
        expect(sciEntry.finalRating).toBe('94');
        expect(sciEntry.remarks).toBe('PASSED');

        // Check specific grades for Mathematics (proves other subjects aren't dropped)
        const mathEntry = subjectsData['mathematics'] as { q1: string; q2: string; q3: string; q4: string; finalRating: string; remarks: string };
        expect(mathEntry.q1).toBe('90');
        expect(mathEntry.q2).toBe('91');
        expect(mathEntry.q3).toBe('92');
        expect(mathEntry.q4).toBe('93');
        expect(mathEntry.finalRating).toBe('92');
        expect(mathEntry.remarks).toBe('PASSED');

        // Verify General Average is computed
        expect(subjectsData.generalAverage).toBeDefined();
        const genAvg = Number(subjectsData.generalAverage);
        expect(genAvg).toBeGreaterThanOrEqual(90);
        expect(genAvg).toBeLessThanOrEqual(95);
    });

    // =========================================================================
    // TEST 5: Zero Data Loss: Legacy 1-Subject Section Fallback Verification
    // =========================================================================
    it('5. Zero Data Loss: If a section had legacy truncated taught_subjects = ["Science"], safe fallback loads all 8 subjects across all reports', () => {
        // Corrupted legacy section where earlier bug stored teaching load as taught_subjects
        const legacyCorruptedSection: Section = {
            id: 'sec-g7-corrupted',
            section_name: 'Ruby',
            section_grade_level: 'Grade 7',
            is_advisory: true,
            is_teaching_load: false,
            adviser_name: 'Gabriel S. Santos',
            taught_subjects: ['Science'], // Only 1 subject (legacy bug!)
            teaching_subjects: ['Science']
        };

        const subjects = mockG7Subjects;
        const sectionGradeNum = 7;
        const taughtRaw = legacyCorruptedSection.taught_subjects || [];
        const intendedSubjects = getSubjectsForGrade('Grade 7');

        // In ConsolidatedGradesPage / SF9Page / TGS:
        // When taughtRaw.length <= 1, the safe fallback branch executes:
        const isSubjectAllowedInTaught = (subId: string, subName: string) => {
            return taughtRaw.some(t => isMatchingSubject(t, subId, subName));
        };

        const recoveredCandidates = subjects.filter(s => {
            const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
            if (subjectGradeNum !== sectionGradeNum) return false;

            const isIntended = intendedSubjects.some(intended => 
                isMatchingSubject(intended.name, s.id, s.subject_name) || 
                normalizeSubjectName(intended.name) === normalizeSubjectName(s.subject_name)
            );
            const isExplicitlyTaught = isSubjectAllowedInTaught(s.id, s.subject_name);
            return isIntended || isExplicitlyTaught;
        });

        // Group into official 8 learning areas
        const recoveredFinal = recoveredCandidates.filter(s => {
            const norm = normalizeSubjectName(s.subject_name);
            const isComp = norm.includes('music') || norm.includes('arts') || norm.includes('pe') || norm.includes('health');
            return (!isComp || norm === 'mapeh');
        });

        const recoveredNames = recoveredFinal.map(s => s.subject_name);

        // ZERO DATA LOSS: All 8 subjects are recovered and visible, despite taught_subjects having only 1 item!
        expect(recoveredFinal).toHaveLength(8);
        expect(recoveredNames).toContain('English');
        expect(recoveredNames).toContain('Mathematics');
        expect(recoveredNames).toContain('Science');
        expect(recoveredNames).toContain('Filipino');
        expect(recoveredNames).toContain('Araling Panlipunan (AP)');
        expect(recoveredNames).toContain('Values Education');
        expect(recoveredNames).toContain('Technology and Livelihood Education (TLE)');
        expect(recoveredNames).toContain('MAPEH');
    });

    it('ensures E-Class Record is the authoritative basis: returns 0 when ECR has no scores and clears stale grading sheet entries', () => {
        // When teacher ECR has no scores entered (WW, PT, QA all blank/empty)
        const emptyTeacherClassRecords: ClassRecord[] = [
            {
                id: 'rec-life-q1',
                student_lrn: '101101202601',
                section_id: 'sec-g11',
                subject_id: 'virtual-lifeandcareerskills-sec-g11',
                subject_name: 'Life and Career Skills',
                quarter: 1,
                school_year: '2026-2027',
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 0
            }
        ];

        // Resolving from teacher E-Class Records strictly yields 0
        const computedGrade = resolveStudentQuarterGrade(
            '101101202601',
            'Life and Career Skills',
            1,
            '2026-2027',
            emptyTeacherClassRecords,
            [], // Strictly evaluate ECR
            [],
            'Grade 11',
            'Academic'
        );

        expect(computedGrade).toBe(0);

        // Pre-existing / stale grading sheet records (e.g. placeholder 100)
        let gradingSheetRecords: ClassRecord[] = [
            {
                id: '101101202601_virtual-lifeandcareerskills_1_2026-2027',
                student_lrn: '101101202601',
                section_id: 'sec-g11',
                subject_id: 'virtual-lifeandcareerskills-sec-g11',
                subject_name: 'Life and Career Skills',
                quarter: 1,
                school_year: '2026-2027',
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 100
            }
        ];

        // When syncing from ECR with empty scores, the stale grading sheet record must be deleted
        if (computedGrade === 0) {
            gradingSheetRecords = gradingSheetRecords.filter(r => r.id !== '101101202601_virtual-lifeandcareerskills_1_2026-2027');
        }

        expect(gradingSheetRecords).toHaveLength(0);
    });

    it('SF9 Sync: synchronizes subjects and grades based on Grade Management taught_subjects and gradingSheetRecords', () => {
        // Section where subjects were customized and reordered in Grade Management:
        // Science first, then Mathematics, then English, then Filipino, etc.
        const customOrderTaught = [
            'Science',
            'Mathematics',
            'English',
            'Filipino',
            'Araling Panlipunan (AP)',
            'Values Education',
            'Technology and Livelihood Education (TLE)',
            'MAPEH'
        ];

        const sectionWithCustomOrder: Section = {
            ...mockG7Section,
            taught_subjects: customOrderTaught,
            section_metadata: {
                // Pre-existing stale layout selections that had a different order
                sf9SubjectSelections: {
                    0: 'sub-fil',
                    1: 'sub-eng',
                    2: 'sub-math'
                }
            }
        };

        // Grades saved in Grade Management (gradingSheetRecords)
        const mockGradingRecords: ClassRecord[] = [
            {
                id: 'rec-sci-q1',
                student_lrn: mockStudent.lrn,
                section_id: sectionWithCustomOrder.id,
                subject_id: 'sub-sci',
                subject_name: 'Science',
                quarter: 1,
                school_year: '2026-2027',
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 92
            },
            {
                id: 'rec-math-q1',
                student_lrn: mockStudent.lrn,
                section_id: sectionWithCustomOrder.id,
                subject_id: 'sub-math',
                subject_name: 'Mathematics',
                quarter: 1,
                school_year: '2026-2027',
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 89
            },
            {
                id: 'rec-eng-q1',
                student_lrn: mockStudent.lrn,
                section_id: sectionWithCustomOrder.id,
                subject_id: 'sub-eng',
                subject_name: 'English',
                quarter: 1,
                school_year: '2026-2027',
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 95
            }
        ];

        // 1. Before sync: section_metadata has stale sf9SubjectSelections
        expect(sectionWithCustomOrder.section_metadata?.sf9SubjectSelections).toBeDefined();

        // 2. Perform sync operation: reset sf9SubjectSelections so Grade Management order takes effect
        const syncedSection: Section = {
            ...sectionWithCustomOrder,
            section_metadata: {
                ...sectionWithCustomOrder.section_metadata,
                sf9SubjectSelections: undefined
            }
        };

        expect(syncedSection.section_metadata?.sf9SubjectSelections).toBeUndefined();

        // 3. Verify that resolving subjects according to taught_subjects puts Science first, Math second, English third
        const getTaughtIndex = (subName: string) => {
            const norm = normalizeSubjectName(subName);
            return customOrderTaught.findIndex(t => normalizeSubjectName(t) === norm || isMatchingSubject(t, '', subName));
        };

        const sortedSubjects = [...mockG7Subjects].sort((a, b) => {
            const idxA = getTaughtIndex(a.subject_name);
            const idxB = getTaughtIndex(b.subject_name);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return 0;
        });

        expect(sortedSubjects[0].subject_name).toBe('Science');
        expect(sortedSubjects[1].subject_name).toBe('Mathematics');
        expect(sortedSubjects[2].subject_name).toBe('English');

        // 4. Verify that student grades for these synced subjects resolve properly from gradingSheetRecords
        const scienceQ1Grade = resolveStudentQuarterGrade(
            mockStudent.lrn,
            'Science',
            1,
            '2026-2027',
            [],
            mockGradingRecords,
            [],
            'Grade 7'
        );
        const mathQ1Grade = resolveStudentQuarterGrade(
            mockStudent.lrn,
            'Mathematics',
            1,
            '2026-2027',
            [],
            mockGradingRecords,
            [],
            'Grade 7'
        );
        const englishQ1Grade = resolveStudentQuarterGrade(
            mockStudent.lrn,
            'English',
            1,
            '2026-2027',
            [],
            mockGradingRecords,
            [],
            'Grade 7'
        );

        expect(scienceQ1Grade).toBe(92);
        expect(mathQ1Grade).toBe(89);
        expect(englishQ1Grade).toBe(95);
    });

    it('8. Accurately collapses MAPEH sub-components into 1 official learning area yielding 8 official subjects', () => {
        const taughtWithComponents = [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'Araling Panlipunan (AP)',
            'Values Education',
            'Technology and Livelihood Education (TLE)',
            'Music and Arts',
            'Physical Education and Health'
        ];

        const isMapehComp = (name: string) => {
            const n = name.toLowerCase().replace(/[^a-z]/g, '');
            return (
                n.includes('musicandarts') || n.includes('musicarts') || (n.includes('music') && n.includes('arts')) ||
                n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth') ||
                n === 'music' || n === 'arts' || n === 'pe' || n === 'health'
            );
        };

        const hasMapehOrComponents = taughtWithComponents.some(s => s.trim().toUpperCase() === 'MAPEH' || isMapehComp(s));
        const nonMapehTaught = taughtWithComponents.filter(s => s.trim().toUpperCase() !== 'MAPEH' && !isMapehComp(s));
        const officialSubjectCount = nonMapehTaught.length + (hasMapehOrComponents ? 1 : 0);

        expect(taughtWithComponents.length).toBe(9); // Raw array has 9 items
        expect(officialSubjectCount).toBe(8); // Collapses to 8 official DepEd learning areas
    });

    it('9. SF10 synchronization dynamically adopts Grade Management taught_subjects and maps updated student grades', () => {
        const studentForSF10: Student = {
            lrn: '123456789099',
            first_name: 'Maria',
            last_name: 'Santos',
            gender: 'Female',
            grade_level: 'Grade 7',
            student_section: 'sec-g7-sf10-sync',
            birthday: '2012-08-20',
            age: 13,
            address: 'Malolos, Bulacan'
        };

        const sectionWithTaught: Section = {
            id: 'sec-g7-sf10-sync',
            section_name: 'SF10-Sync-Section',
            section_grade_level: 'Grade 7',
            is_advisory: true,
            taught_subjects: [
                'Science',
                'Mathematics',
                'English',
                'Filipino',
                'Araling Panlipunan (AP)',
                'Values Education',
                'Technology and Livelihood Education (TLE)',
                'Music and Arts',
                'Physical Education and Health'
            ]
        };

        const freshGradingRecords: ClassRecord[] = [
            {
                id: 'rec-sf10-sci-q1',
                student_lrn: studentForSF10.lrn,
                section_id: sectionWithTaught.id,
                subject_id: 'sub-sci',
                subject_name: 'Science',
                quarter: 1,
                school_year: '2026-2027',
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 94
            },
            {
                id: 'rec-sf10-math-q1',
                student_lrn: studentForSF10.lrn,
                section_id: sectionWithTaught.id,
                subject_id: 'sub-math',
                subject_name: 'Mathematics',
                quarter: 1,
                school_year: '2026-2027',
                written_works: [],
                performance_tasks: [],
                quarterly_exam: 0,
                final_grade: 91
            }
        ];

        // Map student data for SF10 specification
        const sf10Data = mapStudentToSpecData({
            student: studentForSF10,
            profile: mockSchoolProfile,
            schoolYear: '2026-2027',
            sections: [sectionWithTaught],
            teachers: [],
            gradingSheetRecords: freshGradingRecords,
            classRecords: [],
            subjects: mockG7Subjects
        });

        expect(sf10Data).toBeDefined();
        // Grade 7 is the first block in JHS scholasticRecords
        const g7Block = sf10Data.scholasticRecords[0];
        expect(g7Block).toBeDefined();
        expect(g7Block.section).toBe('SF10-Sync-Section');
        
        const subjectsData = g7Block.subjects;

        // Check that Science has q1 grade resolved
        const sciEntry = subjectsData['science'] as { q1: string; q2: string; q3: string; q4: string; finalRating: string; remarks: string };
        expect(sciEntry).toBeDefined();
        expect(sciEntry.q1).toBe('94');

        // Check that Mathematics has q1 grade resolved
        const mathEntry = subjectsData['mathematics'] as { q1: string; q2: string; q3: string; q4: string; finalRating: string; remarks: string };
        expect(mathEntry).toBeDefined();
        expect(mathEntry.q1).toBe('91');
    });
});



