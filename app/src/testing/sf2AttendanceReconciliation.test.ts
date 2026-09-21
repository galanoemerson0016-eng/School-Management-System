import { describe, it, expect } from 'vitest';
import { isStudentInSection, isMaleStudent, isFemaleStudent } from '../utils/grading-helpers';
import { filterAttendanceSections } from '../lib/rbac';
import type { Section, User } from '../types';

describe('SF2 Learner Matching & Roster Inclusion', () => {
    const mockSection: Section = {
        id: 'sec-g7-diamond',
        section_name: 'Diamond',
        section_grade_level: 'Grade 7',
        is_advisory: true,
        adviser_id: 'teacher-1'
    };

    it('matches learners across all section representation formats', () => {
        // Direct ID
        expect(isStudentInSection({ student_section: 'sec-g7-diamond' }, mockSection, 'sec-g7-diamond')).toBe(true);
        // Direct Name
        expect(isStudentInSection({ student_section: 'Diamond' }, mockSection, 'sec-g7-diamond')).toBe(true);
        // Case-insensitive / whitespace
        expect(isStudentInSection({ student_section: ' diamond ' }, mockSection, 'sec-g7-diamond')).toBe(true);
        expect(isStudentInSection({ student_section: 'DIAMOND' }, mockSection, 'sec-g7-diamond')).toBe(true);
        // Grade combined labels
        expect(isStudentInSection({ student_section: 'Grade 7 - Diamond' }, mockSection, 'sec-g7-diamond')).toBe(true);
        expect(isStudentInSection({ student_section: 'Grade 7-Diamond' }, mockSection, 'sec-g7-diamond')).toBe(true);
        expect(isStudentInSection({ student_section: 'G7 - Diamond' }, mockSection, 'sec-g7-diamond')).toBe(true);
        expect(isStudentInSection({ student_section: 'G7 Diamond' }, mockSection, 'sec-g7-diamond')).toBe(true);

        // Different section
        expect(isStudentInSection({ student_section: 'Pearl' }, mockSection, 'sec-g7-diamond')).toBe(false);
    });

    it('categorizes learners into Male and Female tables without dropping any learners', () => {
        const learners: Array<{ name: string; gender?: string }> = [
            { name: 'Boy 1', gender: 'Male' },
            { name: 'Boy 2', gender: 'MALE' },
            { name: 'Boy 3', gender: 'male' },
            { name: 'Boy 4', gender: 'M' },
            { name: 'Girl 1', gender: 'Female' },
            { name: 'Girl 2', gender: 'FEMALE' },
            { name: 'Girl 3', gender: 'female' },
            { name: 'Girl 4', gender: 'F' },
            { name: 'Unknown', gender: '' }
        ];

        const males = learners.filter(isMaleStudent);
        const females = learners.filter(s => !isMaleStudent(s));

        expect(males).toHaveLength(4);
        expect(males.map(m => m.name)).toEqual(['Boy 1', 'Boy 2', 'Boy 3', 'Boy 4']);

        // Females include standard females and non-males so no learner is ever dropped
        expect(females).toHaveLength(5);
        expect(females.some(f => f.name === 'Girl 1')).toBe(true);
        expect(females.some(f => f.name === 'Unknown')).toBe(true);
        expect(isFemaleStudent({ gender: 'Female' })).toBe(true);
    });

    it('allows admin and principal to access all sections in SF2, while filtering teachers to advisory', () => {
        const sections: Section[] = [
            { id: 'sec-1', section_name: 'Diamond', section_grade_level: 'Grade 7', is_advisory: true },
            { id: 'sec-2', section_name: 'Emerald', section_grade_level: 'Grade 7', is_advisory: false }
        ];

        const teacherUser: User = { uid: 'u1', email: 't@school.edu', role: 'teacher' };
        const adminUser: User = { uid: 'u2', email: 'a@school.edu', role: 'admin' };
        const principalUser: User = { uid: 'u3', email: 'p@school.edu', role: 'principal' };

        expect(filterAttendanceSections(teacherUser, sections).map(s => s.id)).toEqual(['sec-1']);
        expect(filterAttendanceSections(adminUser, sections).map(s => s.id)).toEqual(['sec-1', 'sec-2']);
        expect(filterAttendanceSections(principalUser, sections).map(s => s.id)).toEqual(['sec-1', 'sec-2']);
    });

    it('retains advisory access for teacher assigned to section even if is_advisory flag is unset or false (Archimedes fix)', () => {
        const sections: Section[] = [
            { id: 'section_1789451336249', section_name: 'Archimedes', section_grade_level: 'Grade 12', adviser_id: 'user-emerson', is_advisory: false, is_teaching_load: true },
            { id: 'sec-paciolo', section_name: 'Paciolo', section_grade_level: 'Grade 11', is_advisory: true }
        ];

        const emersonUser: User = { uid: 'user-emerson', email: 'galanoemerson0016@gmail.com', displayName: 'Emerson M. Galano', role: 'teacher' };
        const result = filterAttendanceSections(emersonUser, sections);
        expect(result.some(s => s.id === 'section_1789451336249')).toBe(true);
        expect(result.map(s => s.section_name)).toContain('Archimedes');
    });
});

