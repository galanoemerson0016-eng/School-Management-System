import { describe, it, expect } from 'vitest';
import { 
    STANDARD_SUBJECTS, 
    SSHS_G11_ACADEMIC_SUBJECTS,
    isGrade11CoreSubject 
} from '../lib/curriculum';
import { isMatchingSubject } from '../utils/grading-helpers';

describe('Grade 11 Advisory Isolation — No Auto-Injection of Finite Math or Filipino 1', () => {
    it('guarantees STANDARD_SUBJECTS["Grade 11"] defaults strictly to the 6 Core subjects', () => {
        const standardG11 = STANDARD_SUBJECTS['Grade 11'];
        expect(standardG11).toHaveLength(6);
        const names = standardG11.map(s => s.name);
        expect(names).toContain('Effective Communication');
        expect(names).toContain('General Mathematics');
        expect(names).toContain('General Science');
        expect(names).toContain('Life and Career Skills');
        expect(names).toContain('Mabisang Komunikasyon');
        expect(names).toContain('Pag-aaral ng Kasaysayan at Lipunang Pilipino');

        // Finite Math and Filipino 1 MUST NOT be in standard subjects
        expect(names).not.toContain('Finite Mathematics 1');
        expect(names).not.toContain('Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)');
        expect(names).not.toContain('Biology 1');
    });

    it('keeps the complete elective choices in SSHS_G11_ACADEMIC_SUBJECTS without polluting standard subjects', () => {
        const catalogNames = SSHS_G11_ACADEMIC_SUBJECTS.map(s => s.name);
        expect(catalogNames).toContain('Finite Mathematics 1');
        expect(catalogNames).toContain('Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)');
        expect(catalogNames).toContain('Biology 1');
        expect(catalogNames.length).toBeGreaterThanOrEqual(70);
    });

    it('simulates Grade 11 - Plato filtering and ensures unselected electives are strictly excluded', () => {
        // Simulated section: Grade 11 - Plato configured with Core subjects
        const platoSection = {
            id: 'section-plato-g11',
            section_name: 'Grade 11 - Plato',
            section_grade_level: 'Grade 11',
            is_advisory: true,
            track: 'Academic',
            strand: 'Science, Technology, Engineering, and Mathematics',
            cluster: 'Science, Technology, Engineering, and Mathematics',
            taught_subjects: [
                'Effective Communication & Mabisang Komunikasyon',
                'General Mathematics',
                'General Science',
                'Life and Career Skills',
                'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
            ]
        };

        // All database subjects for Grade 11 (including generic electives in DB)
        const dbSubjects = [
            { id: 'sub-ecmk', subject_name: 'Effective Communication & Mabisang Komunikasyon', grade_level: 'Grade 11' },
            { id: 'sub-gm', subject_name: 'General Mathematics', grade_level: 'Grade 11' },
            { id: 'sub-gs', subject_name: 'General Science', grade_level: 'Grade 11' },
            { id: 'sub-lcs', subject_name: 'Life and Career Skills', grade_level: 'Grade 11' },
            { id: 'sub-pkp', subject_name: 'Pag-aaral ng Kasaysayan at Lipunang Pilipino', grade_level: 'Grade 11' },
            { id: 'sub-fil1', subject_name: 'Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)', grade_level: 'Grade 11' },
            { id: 'sub-fm1', subject_name: 'Finite Mathematics 1', grade_level: 'Grade 11' },
            { id: 'sub-bio1', subject_name: 'Biology 1', grade_level: 'Grade 11' },
        ];

        // Empty grading sheet records (no grades encoded for electives)
        const gradingSheetRecords: Array<{ section_id: string; subject_id: string; subject_name: string; final_grade: number }> = [];
        const classRecords: Array<{ section_id: string; subject_id: string; subject_name: string; final_grade: number }> = [];

        // Apply the same candidate filtering logic as ConsolidatedGradesPage
        const taughtRaw = platoSection.taught_subjects;
        const candidates = dbSubjects.filter(s => {
            const isExplicit = taughtRaw.some(t => isMatchingSubject(t, s.id, s.subject_name));
            if (isExplicit) return true;
            const hasGrades = gradingSheetRecords.some(r => isMatchingSubject(r.subject_id, r.subject_name, s.id, s.subject_name) && r.section_id === platoSection.id && Number(r.final_grade) > 0) ||
                              classRecords.some(r => isMatchingSubject(r.subject_id, r.subject_name, s.id, s.subject_name) && r.section_id === platoSection.id && Number(r.final_grade) > 0);
            return hasGrades;
        });

        const candidateNames = candidates.map(c => c.subject_name);
        expect(candidateNames).toHaveLength(5);
        expect(candidateNames).not.toContain('Finite Mathematics 1');
        expect(candidateNames).not.toContain('Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)');
        expect(candidateNames).not.toContain('Biology 1');
    });

    it('auto-heals a previously corrupted Plato section where electives were leaked into taught_subjects', () => {
        // Corrupted section where bug had injected electives
        const corruptedPlato = {
            id: 'section-plato-g11',
            section_name: 'Grade 11 - Plato',
            section_grade_level: 'Grade 11',
            is_advisory: true,
            track: 'Academic',
            strand: 'Science, Technology, Engineering, and Mathematics',
            cluster: 'Science, Technology, Engineering, and Mathematics',
            taught_subjects: [
                'Effective Communication & Mabisang Komunikasyon',
                'General Mathematics',
                'General Science',
                'Life and Career Skills',
                'Pag-aaral ng Kasaysayan at Lipunang Pilipino',
                'Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)',
                'Finite Mathematics 1',
                'Biology 1'
            ]
        };

        // Grades exist for General Mathematics and Mabisang Komunikasyon, but ZERO for electives
        const gradingSheetRecords = [
            { section_id: 'section-plato-g11', subject_id: 'sub-gm', subject_name: 'General Mathematics', final_grade: 92 },
            { section_id: 'section-plato-g11', subject_id: 'ecmk_mk_123', subject_name: 'Mabisang Komunikasyon', final_grade: 89 },
            { section_id: 'section-plato-g11', subject_id: 'sub-gs', subject_name: 'General Science', final_grade: 90 },
        ];

        // Ensure isMatchingSubject does NOT match Gen Math grades to Finite Math 1
        expect(isMatchingSubject('Finite Mathematics 1', 'sub-gm', 'General Mathematics')).toBe(false);
        expect(isMatchingSubject('General Mathematics', 'sub-fm1', 'Finite Mathematics 1')).toBe(false);

        // Ensure isMatchingSubject does NOT match Mabisang Komunikasyon or Filipino to Filipino 1
        expect(isMatchingSubject('Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)', 'ecmk_mk_123', 'Mabisang Komunikasyon')).toBe(false);
        expect(isMatchingSubject('Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)', 'sub-fil', 'Filipino')).toBe(false);

        // Run the store / page sanitizer
        const sanitizedTaught = corruptedPlato.taught_subjects.filter(subName => {
            if (isGrade11CoreSubject(subName)) return true;
            const hasGrades = gradingSheetRecords.some(r => r.section_id === corruptedPlato.id && isMatchingSubject(subName, r.subject_id, r.subject_name) && Number(r.final_grade) > 0);
            return hasGrades;
        });

        expect(sanitizedTaught).toEqual([
            'Effective Communication & Mabisang Komunikasyon',
            'General Mathematics',
            'General Science',
            'Life and Career Skills',
            'Pag-aaral ng Kasaysayan at Lipunang Pilipino'
        ]);
        expect(sanitizedTaught).not.toContain('Finite Mathematics 1');
        expect(sanitizedTaught).not.toContain('Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)');
        expect(sanitizedTaught).not.toContain('Biology 1');
    });

    it('ensures explicitly assigned electives with 0 student grades are preserved and appear in candidate subjects', () => {
        const stemSection = {
            id: 'section-stem-g11',
            section_name: 'Grade 11 - STEM Einstein',
            section_grade_level: 'Grade 11',
            is_advisory: true,
            track: 'Academic',
            strand: 'Science, Technology, Engineering, and Mathematics',
            cluster: 'Science, Technology, Engineering, and Mathematics',
            taught_subjects: [
                'Effective Communication & Mabisang Komunikasyon',
                'General Mathematics',
                'General Science',
                'Life and Career Skills',
                'Pag-aaral ng Kasaysayan at Lipunang Pilipino',
                'Biology 1',
                'Basic Calculus'
            ]
        };

        const dbSubjects = [
            { id: 'sub-ecmk', subject_name: 'Effective Communication & Mabisang Komunikasyon', grade_level: 'Grade 11' },
            { id: 'sub-gm', subject_name: 'General Mathematics', grade_level: 'Grade 11' },
            { id: 'sub-gs', subject_name: 'General Science', grade_level: 'Grade 11' },
            { id: 'sub-lcs', subject_name: 'Life and Career Skills', grade_level: 'Grade 11' },
            { id: 'sub-pkp', subject_name: 'Pag-aaral ng Kasaysayan at Lipunang Pilipino', grade_level: 'Grade 11' },
            { id: 'sub-bio1', subject_name: 'Biology 1', grade_level: 'Grade 11' },
            { id: 'sub-calc', subject_name: 'Basic Calculus', grade_level: 'Grade 11' },
            { id: 'sub-fil1', subject_name: 'Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)', grade_level: 'Grade 11' },
            { id: 'sub-fm1', subject_name: 'Finite Mathematics 1', grade_level: 'Grade 11' },
        ];

        // 0 student grades recorded
        const gradingSheetRecords: Array<{ section_id: string; subject_id: string; subject_name: string; final_grade: number }> = [];
        const classRecords: Array<{ section_id: string; subject_id: string; subject_name: string; final_grade: number }> = [];

        // Candidate filtering logic without artificial stripping
        const taughtRaw = stemSection.taught_subjects;
        const candidates = dbSubjects.filter(s => {
            const isExplicit = taughtRaw.some(t => isMatchingSubject(t, s.id, s.subject_name));
            if (isExplicit) return true;
            const hasGrades = gradingSheetRecords.some(r => isMatchingSubject(r.subject_id, r.subject_name, s.id, s.subject_name) && r.section_id === stemSection.id && Number(r.final_grade) > 0) ||
                              classRecords.some(r => isMatchingSubject(r.subject_id, r.subject_name, s.id, s.subject_name) && r.section_id === stemSection.id && Number(r.final_grade) > 0);
            return hasGrades;
        });

        const candidateNames = candidates.map(c => c.subject_name);
        expect(candidateNames).toContain('Biology 1');
        expect(candidateNames).toContain('Basic Calculus');
        expect(candidateNames).not.toContain('Finite Mathematics 1');
        expect(candidateNames).not.toContain('Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)');
    });
});

