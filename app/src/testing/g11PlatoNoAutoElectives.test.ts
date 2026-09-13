import { describe, it, expect } from 'vitest';
import { 
    STANDARD_SUBJECTS, 
    SSHS_G11_CORE_SUBJECTS, 
    SSHS_G11_ACADEMIC_SUBJECTS,
    isGrade11CoreSubject 
} from '../lib/curriculum';
import { normalizeSubjectName } from '../lib/subjectConfig';
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
        const gradingSheetRecords: any[] = [];
        const classRecords: any[] = [];

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
});
