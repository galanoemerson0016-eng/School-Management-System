import { describe, it, expect } from 'vitest';
import { mapStudentToShsSf9Data } from '../utils/shsSf9Mapper';
import { mapStudentToShsSf10Data } from '../utils/shsSf10Mapper';
import { filterSubjectsForSection } from './rbac';
import { getClustersForGrade11Track, isGrade11CoreSubject } from './curriculum';
import type { Student, SchoolProfile, Section, Subject, User } from '../types';

describe('Advisory Subject Assignment for SF9, SF10 & Grade Management', () => {
    const mockProfile: SchoolProfile = {
        name: 'Test National High School',
        school_id: '123456',
        region: 'Region I',
        division: 'Ilocos Sur',
        district: 'District 1',
        head_name: 'Dr. Principal',
        head_position: 'Principal IV',
        grade_levels_offered: 'Grade 11, Grade 12'
    };

    const mockStudent: Student = {
        lrn: '123456789012',
        first_name: 'Juan',
        last_name: 'Dela Cruz',
        middle_name: 'Perez',
        gender: 'Male',
        birthday: '2008-01-01',
        age: 17,
        address: 'Poblacion',
        grade_level: 'Grade 11',
        student_section: 'Grade 11 - STEM Einstein',
        track: 'Academic',
        strand: 'STEM'
    };

    const mockAdvisorySection: Section = {
        id: 'sec-einstein',
        section_name: 'Grade 11 - STEM Einstein',
        section_grade_level: 'Grade 11',
        is_advisory: true,
        adviser_name: 'Emerson Galano',
        track: 'Academic',
        strand: 'STEM',
        taught_subjects: [
            'General Mathematics',
            'General Science',
            'Effective Communication / Komunikasyon',
            'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
        ]
    };

    const mockAllGradeSubjects: Subject[] = [
        {
            id: 'sub-math',
            subject_name: 'General Mathematics',
            grade_level: 'Grade 11',
            term: 'all'
        },
        {
            id: 'sub-sci',
            subject_name: 'General Science',
            grade_level: 'Grade 11',
            term: 'all'
        },
        {
            id: 'sub-eng',
            subject_name: 'Effective Communication / Komunikasyon',
            grade_level: 'Grade 11',
            term: 'all'
        },
        {
            id: 'sub-kas',
            subject_name: 'Pag-aaral ng Kasaysayan at Lipunang Pilipino',
            grade_level: 'Grade 11',
            term: 'all'
        },
        {
            id: 'sub-beauty',
            subject_name: 'Aesthetic Services (Beauty Care)',
            grade_level: 'Grade 11',
            term: 1 // Offered in Term 1 for another section
        },
        {
            id: 'sub-welding',
            subject_name: 'Shielded Metal Arc Welding (SMAW)',
            grade_level: 'Grade 11',
            term: 1 // Offered in Term 1 for another section
        }
    ];

    it('excludes teaching-load electives from advisory SF9 report card when taught_subjects is configured', () => {
        const sf9Data = mapStudentToShsSf9Data({
            student: mockStudent,
            profile: mockProfile,
            schoolYear: '2026-2027',
            sectionObj: mockAdvisorySection,
            subjects: mockAllGradeSubjects,
            gradingSheetRecords: []
        });

        // Subject names present in the mapped SF9 subjectGrades
        const allSf9SubjectNames = sf9Data.subjectGrades.map(s => s.subjectName);

        // Should include assigned subjects
        expect(allSf9SubjectNames).toContain('General Mathematics');
        expect(allSf9SubjectNames).toContain('General Science');

        // Should strictly NOT include Aesthetic Services or Welding
        expect(allSf9SubjectNames).not.toContain('Aesthetic Services (Beauty Care)');
        expect(allSf9SubjectNames).not.toContain('Shielded Metal Arc Welding (SMAW)');
    });

    it('excludes unassigned electives from advisory SF10 permanent record', () => {
        const sf10Data = mapStudentToShsSf10Data({
            student: mockStudent,
            profile: mockProfile,
            schoolYear: '2026-2027',
            sections: [mockAdvisorySection],
            subjects: mockAllGradeSubjects,
            gradingSheetRecords: []
        });

        // Gather all subject titles in the grade 11 record
        const g11Subjects = sf10Data.scholasticRecords?.find(r => r.gradeLevel === 11)?.subjects || [];
        const allSf10SubjectTitles = g11Subjects.map(s => s.subjectName);

        expect(allSf10SubjectTitles).toContain('General Mathematics');
        expect(allSf10SubjectTitles).not.toContain('Aesthetic Services (Beauty Care)');
        expect(allSf10SubjectTitles).not.toContain('Shielded Metal Arc Welding (SMAW)');
    });

    it('filterSubjectsForSection strictly honors teaching_subjects for E-Class Record', () => {
        const mockUser: User = {
            uid: 'user-1',
            email: 'teacher@school.gov.ph',
            displayName: 'Teacher Emerson',
            role: 'teacher'
        };

        const mockTeachingSection: Section = {
            ...mockAdvisorySection,
            is_teaching_load: true,
            teaching_subjects: ['General Mathematics', 'General Science']
        };

        const filtered = filterSubjectsForSection(mockUser, mockTeachingSection, mockAllGradeSubjects);
        const filteredNames = filtered.map(s => s.subject_name);

        expect(filteredNames).toContain('General Mathematics');
        expect(filteredNames).toContain('General Science');
        expect(filteredNames).not.toContain('Aesthetic Services (Beauty Care)');
        expect(filteredNames).not.toContain('Shielded Metal Arc Welding (SMAW)');
    });

    it('dynamically includes a newly assigned elective when added to taught_subjects', () => {
        const updatedSection: Section = {
            ...mockAdvisorySection,
            taught_subjects: [
                ...(mockAdvisorySection.taught_subjects || []),
                'Aesthetic Services (Beauty Care)'
            ]
        };

        const sf9Data = mapStudentToShsSf9Data({
            student: mockStudent,
            profile: mockProfile,
            schoolYear: '2026-2027',
            sectionObj: updatedSection,
            subjects: mockAllGradeSubjects,
            gradingSheetRecords: []
        });

        const allSf9SubjectNames = sf9Data.subjectGrades.map(s => s.subjectName);

        expect(allSf9SubjectNames).toContain('Aesthetic Services (Beauty Care)');
        expect(allSf9SubjectNames).not.toContain('Shielded Metal Arc Welding (SMAW)');
    });

    it('automatically includes Grade 11 Core subjects by default when taught_subjects is empty', () => {
        const emptyTaughtSection: Section = {
            ...mockAdvisorySection,
            taught_subjects: []
        };

        const sf9Data = mapStudentToShsSf9Data({
            student: mockStudent,
            profile: mockProfile,
            schoolYear: '2026-2027',
            sectionObj: emptyTaughtSection,
            subjects: mockAllGradeSubjects,
            gradingSheetRecords: []
        });

        const allSf9SubjectNames = sf9Data.subjectGrades.map(s => s.subjectName);

        // Core subjects must be present by default
        expect(allSf9SubjectNames).toContain('General Mathematics');
        expect(allSf9SubjectNames).toContain('General Science');
        expect(allSf9SubjectNames).toContain('Effective Communication / Komunikasyon');
        expect(allSf9SubjectNames).toContain('Pag-aaral ng Kasaysayan at Lipunang Pilipino');

        // Electives must remain excluded
        expect(allSf9SubjectNames).not.toContain('Aesthetic Services (Beauty Care)');
        expect(allSf9SubjectNames).not.toContain('Shielded Metal Arc Welding (SMAW)');
    });

    it('returns the 5 official Academic and 10 official TechPro clusters for Grade 11 under DO 017', () => {
        const acadClusters = getClustersForGrade11Track('Academic');
        expect(acadClusters).toHaveLength(5);
        expect(acadClusters).toContain('Arts, Social Sciences, and Humanities');
        expect(acadClusters).toContain('Business and Entrepreneurship');
        expect(acadClusters).toContain('Science, Technology, Engineering, and Mathematics');
        expect(acadClusters).toContain('Sports, Health, and Wellness');
        expect(acadClusters).toContain('Field Experience');

        const techProClusters = getClustersForGrade11Track('TechPro');
        expect(techProClusters).toHaveLength(10);
        expect(techProClusters).toContain('Aesthetic, Wellness, and Human Care');
        expect(techProClusters).toContain('Agri-Fishery Business and Food Innovation');
        expect(techProClusters).toContain('Artisanry and Creative Enterprise');
        expect(techProClusters).toContain('Automotive and Small Engine Technologies');
        expect(techProClusters).toContain('Construction and Building Technologies');
        expect(techProClusters).toContain('Creative Arts and Design Technologies');
        expect(techProClusters).toContain('Hospitality and Tourism');
        expect(techProClusters).toContain('ICT Support and Computer Programming Technologies');
        expect(techProClusters).toContain('Industrial Technologies');
        expect(techProClusters).toContain('Maritime');
    });

    it('validates Grade 11 Core subjects accurately', () => {
        expect(isGrade11CoreSubject('General Mathematics')).toBe(true);
        expect(isGrade11CoreSubject('General Science')).toBe(true);
        expect(isGrade11CoreSubject('Effective Communication')).toBe(true);
        expect(isGrade11CoreSubject('Mabisang Komunikasyon')).toBe(true);
        expect(isGrade11CoreSubject('Life and Career Skills')).toBe(true);
        expect(isGrade11CoreSubject('Pag-aaral ng Kasaysayan at Lipunang Pilipino')).toBe(true);

        // Non-core electives
        expect(isGrade11CoreSubject('Aesthetic Services (Beauty Care)')).toBe(false);
        expect(isGrade11CoreSubject('Technical Drafting')).toBe(false);
        expect(isGrade11CoreSubject('Basic Calculus')).toBe(false);
        expect(isGrade11CoreSubject('Biology 1')).toBe(false);
        expect(isGrade11CoreSubject('Business 1 (Basic Accounting)')).toBe(false);
    });

    it('strictly excludes unassigned Academic electives (Biology 1, Business 1) from SF9 and SF10 when not in taught_subjects', () => {
        const subjectsWithElectives: Subject[] = [
            ...mockAllGradeSubjects,
            { id: 'sub-bio', subject_name: 'Biology 1', grade_level: 'Grade 11', term: 'all' },
            { id: 'sub-bus', subject_name: 'Business 1 (Basic Accounting)', grade_level: 'Grade 11', term: 'all' }
        ];

        const sf9 = mapStudentToShsSf9Data({
            student: mockStudent,
            profile: mockProfile,
            schoolYear: '2026-2027',
            sectionObj: mockAdvisorySection,
            subjects: subjectsWithElectives,
            gradingSheetRecords: []
        });

        const sf9Names = sf9.subjectGrades.map(s => s.subjectName);
        expect(sf9Names).not.toContain('Biology 1');
        expect(sf9Names).not.toContain('Business 1 (Basic Accounting)');

        const sf10 = mapStudentToShsSf10Data({
            student: mockStudent,
            profile: mockProfile,
            schoolYear: '2026-2027',
            sections: [mockAdvisorySection],
            subjects: subjectsWithElectives,
            gradingSheetRecords: []
        });

        const g11Subjects = sf10.scholasticRecords?.find(r => r.gradeLevel === 11)?.subjects || [];
        const sf10Names = g11Subjects.map(s => s.subjectName);
        expect(sf10Names).not.toContain('Biology 1');
        expect(sf10Names).not.toContain('Business 1 (Basic Accounting)');
    });

    it('returns only teaching_subjects in E-Class Record when teacher is adviser and teaches a single subject', () => {
        const mockUser: User = {
            uid: 'user-1',
            email: 'teacher@school.gov.ph',
            displayName: 'Teacher Emerson',
            role: 'teacher'
        };

        const sectionWithSingleTeachingLoad: Section = {
            ...mockAdvisorySection,
            is_advisory: true,
            is_teaching_load: true,
            taught_subjects: [
                'General Mathematics',
                'General Science',
                'Effective Communication / Komunikasyon',
                'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
            ],
            teaching_subjects: ['General Mathematics']
        };

        // In E-Class Record: filterSubjectsForSection should ONLY return General Mathematics
        const filtered = filterSubjectsForSection(mockUser, sectionWithSingleTeachingLoad, mockAllGradeSubjects);
        const filteredNames = filtered.map(s => s.subject_name);
        expect(filteredNames).toEqual(['General Mathematics']);

        // In SF9: all 4 advisory curriculum subjects must still be present
        const sf9 = mapStudentToShsSf9Data({
            student: mockStudent,
            profile: mockProfile,
            schoolYear: '2026-2027',
            sectionObj: sectionWithSingleTeachingLoad,
            subjects: mockAllGradeSubjects,
            gradingSheetRecords: []
        });
        const sf9Names = sf9.subjectGrades.map(s => s.subjectName);
        expect(sf9Names).toContain('General Mathematics');
        expect(sf9Names).toContain('General Science');
        expect(sf9Names).toContain('Effective Communication / Komunikasyon');
        expect(sf9Names).toContain('Pag-aaral ng Kasaysayan at Lipunang Pilipino');
    });

    it('returns all active grade-level subjects for E-Class Record when section is advisory without restricted teaching load', () => {
        const mockUser: User = {
            uid: 'user-1',
            email: 'teacher@school.gov.ph',
            displayName: 'Teacher Emerson',
            role: 'teacher'
        };

        const pureAdvisorySection: Section = {
            ...mockAdvisorySection,
            is_advisory: true,
            is_teaching_load: false,
            teaching_subjects: []
        };

        const filtered = filterSubjectsForSection(mockUser, pureAdvisorySection, mockAllGradeSubjects);
        const filteredNames = filtered.map(s => s.subject_name);
        expect(filteredNames).toContain('General Mathematics');
        expect(filteredNames).toContain('General Science');
        expect(filteredNames).toContain('Effective Communication / Komunikasyon');
        expect(filteredNames).toContain('Pag-aaral ng Kasaysayan at Lipunang Pilipino');
    });

    it('returns empty list for pure non-advisory teaching load section with 0 subjects selected', () => {
        const mockUser: User = {
            uid: 'user-1',
            email: 'teacher@school.gov.ph',
            displayName: 'Teacher Emerson',
            role: 'teacher'
        };

        const pureTeachingSection: Section = {
            ...mockAdvisorySection,
            is_advisory: false,
            is_teaching_load: true,
            teaching_subjects: []
        };

        const filtered = filterSubjectsForSection(mockUser, pureTeachingSection, mockAllGradeSubjects);
        expect(filtered).toHaveLength(0);
    });

    it('preserves all Grade 7 subjects in E-Class Record and SF10 even if section had a single teaching load', () => {
        const mockUser: User = {
            uid: 'user-1',
            email: 'teacher@school.gov.ph',
            displayName: 'Teacher Emerson',
            role: 'teacher'
        };

        const mockG7AdvisorySection: Section = {
            id: 'sec-g7-matatag',
            section_name: 'Grade 7 - Matatag',
            section_grade_level: 'Grade 7',
            is_advisory: true,
            is_teaching_load: false,
            adviser_name: 'Teacher Emerson',
            taught_subjects: ['English'] // previous pollution
        };

        const mockG7Subjects: Subject[] = [
            { id: 'g7-eng', subject_name: 'English', grade_level: 'Grade 7', term: 'all' },
            { id: 'g7-math', subject_name: 'Mathematics', grade_level: 'Grade 7', term: 'all' },
            { id: 'g7-sci', subject_name: 'Science', grade_level: 'Grade 7', term: 'all' },
            { id: 'g7-fil', subject_name: 'Filipino', grade_level: 'Grade 7', term: 'all' },
            { id: 'g7-ap', subject_name: 'Araling Panlipunan', grade_level: 'Grade 7', term: 'all' },
            { id: 'g7-ve', subject_name: 'Values Education', grade_level: 'Grade 7', term: 'all' },
            { id: 'g7-tle', subject_name: 'Technology and Livelihood Education', grade_level: 'Grade 7', term: 'all' },
            { id: 'g7-ma', subject_name: 'Music and Arts', grade_level: 'Grade 7', term: 'all' },
            { id: 'g7-peh', subject_name: 'Physical Education and Health', grade_level: 'Grade 7', term: 'all' }
        ];

        // E-Class Record access for pure advisory class:
        const filtered = filterSubjectsForSection(mockUser, mockG7AdvisorySection, mockG7Subjects);
        const filteredNames = filtered.map(s => s.subject_name);
        expect(filteredNames).toContain('English');
        expect(filteredNames).toContain('Mathematics');
        expect(filteredNames).toContain('Science');
        expect(filteredNames).toContain('Filipino');
        expect(filteredNames).toContain('Araling Panlipunan');
        expect(filteredNames).toContain('Values Education');
        expect(filteredNames).toContain('Technology and Livelihood Education');
        expect(filteredNames).toContain('Music and Arts');
        expect(filteredNames).toContain('Physical Education and Health');
    });
});


