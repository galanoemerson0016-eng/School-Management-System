import { describe, it, expect } from 'vitest';
import {
    testGrade1To12Sections,
    testGrade1To12Subjects,
    testGrade1To12Students
} from './test-fixtures';

describe('Grade 1–12 Test Fixtures (Testing Only)', () => {
    it('should provide sections covering all 12 grades without gaps', () => {
        const gradeLevels = new Set(testGrade1To12Sections.map(s => s.section_grade_level));
        for (let grade = 1; grade <= 12; grade++) {
            expect(gradeLevels.has(`Grade ${grade}`)).toBe(true);
        }
    });

    it('should have valid section names, advisers, and taught subjects for every section', () => {
        for (const section of testGrade1To12Sections) {
            expect(section.id).toBeTruthy();
            expect(section.section_name).toBeTruthy();
            expect(section.section_grade_level).toBeTruthy();
            expect(section.adviser_name).toBeTruthy();
            expect(Array.isArray(section.taught_subjects)).toBe(true);
            expect(section.taught_subjects!.length).toBeGreaterThan(0);
        }
    });

    it('should cover MATATAG curriculum for Grades 1–4 and 7', () => {
        const matatagSections = testGrade1To12Sections.filter(s => s.curriculum_type === 'MATATAG');
        expect(matatagSections.length).toBeGreaterThanOrEqual(4);
        const matatagGrades = new Set(matatagSections.map(s => s.section_grade_level));
        expect(matatagGrades.has('Grade 1')).toBe(true);
        expect(matatagGrades.has('Grade 2')).toBe(true);
        expect(matatagGrades.has('Grade 3')).toBe(true);
        expect(matatagGrades.has('Grade 4')).toBe(true);
        expect(matatagGrades.has('Grade 7')).toBe(true);
    });

    it('should include appropriate SHS track and strand for Grades 11 and 12', () => {
        const shsSections = testGrade1To12Sections.filter(s =>
            s.section_grade_level === 'Grade 11' || s.section_grade_level === 'Grade 12'
        );
        expect(shsSections.length).toBeGreaterThanOrEqual(4); // G11 STEM, G11 TechPro, G12 STEM, G12 TVL

        for (const sec of shsSections) {
            expect(sec.track).toBeTruthy();
            expect(sec.strand).toBeTruthy();
        }
    });

    it('should generate matching subjects for each section in testGrade1To12Subjects', () => {
        expect(testGrade1To12Subjects.length).toBeGreaterThan(0);
        for (const section of testGrade1To12Sections) {
            const sectionSubjects = testGrade1To12Subjects.filter(s => s.section_id === section.id);
            expect(sectionSubjects.length).toBe(section.taught_subjects!.length);
        }
    });

    it('should have sample students for every section with valid 12-digit DepEd LRNs', () => {
        expect(testGrade1To12Students.length).toBeGreaterThan(0);
        const sectionNames = new Set(testGrade1To12Sections.map(s => s.section_name));

        for (const student of testGrade1To12Students) {
            expect(student.lrn).toMatch(/^\d{12}$/);
            expect(student.first_name).toBeTruthy();
            expect(student.last_name).toBeTruthy();
            expect(student.gender).toMatch(/^(Male|Female)$/);
            expect(sectionNames.has(student.student_section!)).toBe(true);
        }
    });
});
