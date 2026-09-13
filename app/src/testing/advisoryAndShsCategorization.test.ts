import { describe, it, expect } from 'vitest';
import {
    filterSF9Sections,
    filterAttendanceSections,
    filterOfficialSectionsForUser
} from '../lib/rbac';
import {
    getSshsCategoryForSubject,
    getSshsClusterForSubject,
    getTraditionalShsTrackForSubject,
    getTraditionalShsStrandForSubject
} from '../lib/curriculum';
import type { Section, User } from '../types';

describe('Advisory Section Filtering for Official Forms & Grade Management', () => {
    const mockUser: User = {
        uid: 'teacher-123',
        displayName: 'Emerson M. Galano',
        email: 'emerson@school.edu.ph',
        role: 'teacher'
    };

    const mockSections: Section[] = [
        {
            id: 'sec-adv-1',
            section_name: 'Einstein',
            section_grade_level: 'Grade 7',
            adviser_id: 'teacher-123',
            is_advisory: true,
            is_teaching_load: false,
            taught_subjects: ['English', 'Mathematics', 'Science']
        },
        {
            id: 'sec-adv-2',
            section_name: 'Newton',
            section_grade_level: 'Grade 8',
            adviser_id: 'teacher-123',
            is_advisory: true,
            is_teaching_load: true,
            taught_subjects: ['Science']
        },
        {
            id: 'sec-nonadv-teaching-only',
            section_name: 'Curie',
            section_grade_level: 'Grade 9',
            adviser_id: 'other-teacher-456',
            is_advisory: false,
            is_teaching_load: true,
            teaching_subjects: ['Science']
        },
        {
            id: 'sec-other',
            section_name: 'Rizal',
            section_grade_level: 'Grade 10',
            adviser_id: 'other-teacher-789',
            is_advisory: false,
            is_teaching_load: false
        }
    ];

    it('filterSF9Sections strictly returns advisory sections only', () => {
        const result = filterSF9Sections(mockUser, mockSections);
        expect(result.map(s => s.id)).toEqual(['sec-adv-1', 'sec-adv-2']);
        expect(result.some(s => s.id === 'sec-nonadv-teaching-only')).toBe(false);
        expect(result.some(s => s.id === 'sec-other')).toBe(false);
    });

    it('filterAttendanceSections strictly returns advisory sections only', () => {
        const result = filterAttendanceSections(mockUser, mockSections);
        expect(result.map(s => s.id)).toEqual(['sec-adv-1', 'sec-adv-2']);
        expect(result.some(s => s.id === 'sec-nonadv-teaching-only')).toBe(false);
    });

    it('filterOfficialSectionsForUser strictly returns advisory sections only', () => {
        const result = filterOfficialSectionsForUser(mockUser, mockSections);
        expect(result.map(s => s.id)).toEqual(['sec-adv-1', 'sec-adv-2']);
        expect(result.some(s => s.id === 'sec-nonadv-teaching-only')).toBe(false);
    });
});

describe('SSHS Curriculum Subject Categorization (DepEd DO 017, s. 2026)', () => {
    it('correctly classifies SSHS Core subjects into SSHS - CORE and cluster CORE', () => {
        const coreSubjects = [
            'Effective Communication in English',
            'Mabisang Komunikasyon sa Filipino',
            'General Mathematics',
            'General Science',
            'Life and Career Skills',
            'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
        ];

        coreSubjects.forEach(name => {
            expect(getSshsCategoryForSubject(name)).toBe('SSHS - CORE');
            expect(getSshsClusterForSubject(name)).toBe('CORE');
        });
    });

    it('correctly classifies SSHS Academic Electives into SSHS - ACADEMIC and their respective clusters', () => {
        expect(getSshsCategoryForSubject('Creative Writing')).toBe('SSHS - ACADEMIC');
        expect(getSshsClusterForSubject('Creative Writing')).toBe('Arts, Social Sciences, and Humanities');

        expect(getSshsCategoryForSubject('Pre-Calculus')).toBe('SSHS - ACADEMIC');
        expect(getSshsClusterForSubject('Pre-Calculus')).toBe('Science, Technology, Engineering, and Mathematics');

        expect(getSshsCategoryForSubject('Fundamentals of Accountancy, Business & Management 1')).toBe('SSHS - ACADEMIC');
        expect(getSshsClusterForSubject('Fundamentals of Accountancy, Business & Management 1')).toBe('Business and Entrepreneurship');
    });

    it('correctly classifies SSHS Tech-Pro subjects into SSHS - TECH-PRO and respective TechPro clusters', () => {
        expect(getSshsCategoryForSubject('Computer Systems Servicing NC II')).toBe('SSHS - TECH-PRO');
        expect(getSshsClusterForSubject('Computer Systems Servicing NC II')).toBe('ICT Support and Computer Programming Technologies');

        expect(getSshsCategoryForSubject('Automotive Servicing NC I')).toBe('SSHS - TECH-PRO');
        expect(getSshsClusterForSubject('Automotive Servicing NC I')).toBe('Automotive and Small Engine Technologies');

        expect(getSshsCategoryForSubject('Shielded Metal Arc Welding NC II')).toBe('SSHS - TECH-PRO');
        expect(getSshsClusterForSubject('Shielded Metal Arc Welding NC II')).toBe('Construction and Building Technologies');
    });

    it('classifies Work Immersion under SSHS - TECH-PRO', () => {
        expect(getSshsCategoryForSubject('Work Immersion (240 Hours)')).toBe('SSHS - TECH-PRO');
        expect(getSshsClusterForSubject('Work Immersion (240 Hours)')).toBe('Work Immersion');
    });
});

describe('Traditional SHS Grade 12 Subject Categorization', () => {
    it('correctly identifies Core Subjects (All Tracks)', () => {
        const coreSubjects = [
            '21st Century Literature from the Philippines and the World',
            'Contemporary Philippine Arts from the Regions',
            'Media and Information Literacy',
            'Physical Education and Health 3',
            'Physical Science',
            'Understanding Culture, Society and Politics'
        ];

        coreSubjects.forEach(name => {
            expect(getTraditionalShsTrackForSubject(name)).toBe('CORE SUBJECT (ALL TRACKS)');
        });
    });

    it('correctly identifies Applied Subjects in Academic Track', () => {
        const appliedSubjects = [
            'Empowerment Technologies',
            'English for Academic and Professional Purposes',
            'Practical Research 2',
            'Entrepreneurship',
            'Filipino sa Piling Larang (Akademik)'
        ];

        appliedSubjects.forEach(name => {
            expect(getTraditionalShsTrackForSubject(name)).toBe('ACADEMIC TRACK (EXCEPT IMMERSION)');
            expect(getTraditionalShsStrandForSubject(name)).toBe('Applied Subjects');
        });
    });

    it('correctly identifies Work Immersion / Culminating Activity Track', () => {
        const immersionSubjects = [
            'Work Immersion',
            'Culminating Activity',
            'Research Output'
        ];

        immersionSubjects.forEach(name => {
            expect(getTraditionalShsTrackForSubject(name)).toBe('WORK IMMERSION/ CULMINATING ACTIVITY (FOR ACADEMIC TRACK)');
        });
    });

    it('correctly identifies TVL / Sports / Arts & Design subjects', () => {
        expect(getTraditionalShsTrackForSubject('Bread and Pastry Production')).toBe('TVL/ SPORTS/ ARTS AND DESIGN TRACK');
        expect(getTraditionalShsTrackForSubject('Automotive Servicing')).toBe('TVL/ SPORTS/ ARTS AND DESIGN TRACK');
        expect(getTraditionalShsTrackForSubject('Sports Officiating')).toBe('TVL/ SPORTS/ ARTS AND DESIGN TRACK');
    });
});
