import { describe, it, expect } from 'vitest';
import { getCategoryForSubject, getCurriculumTemplatesForSection } from '../lib/curriculum';

const normalizeSubjectLabel = (value: string) =>
    value.toLowerCase().replace(/\s+/g, ' ').replace(/\s*\([^)]*\)/g, '').trim();

/**
 * Pure reproduction of the helper function used in SectionForm.tsx
 */
function isSubjectAllowedForProgram(subjectName: string, gradeLevel: string = '', program: string = 'Regular'): boolean {
    const normName = normalizeSubjectLabel(subjectName);
    if (!normName || normName === 'specialization' || normName === 'mapeh') {
        return false;
    }

    const isSHS = gradeLevel.includes('11') || gradeLevel.includes('12');
    if (isSHS) {
        return true;
    }

    const prog = (program || 'Regular').trim().toLowerCase();
    const cat = getCategoryForSubject(subjectName, gradeLevel);

    const isSTE = cat === 'Science, Technology & Engineering (STE / SPSTEM)';
    const isSPA = cat === 'Special Program in the Arts (SPA)';
    const isSPJ = cat === 'Special Program in Journalism (SPJ)';
    const isSPS = cat === 'Special Program in Sports (SPS)';
    const isSPFL = cat === 'Special Program in Foreign Language (SPFL)';
    const isSPTVE = cat === 'Technical-Vocational Education (SPTVE)';
    const isSSES = cat === 'Special Science Elementary School (SSES)';
    const isALIVE = cat === 'Madrasah / ALIVE Program';

    const isSpecialProgramCategory = isSTE || isSPA || isSPJ || isSPS || isSPFL || isSPTVE || isSSES || isALIVE;

    if (prog === 'regular') {
        return !isSpecialProgramCategory;
    }

    if (prog === 'ste' || prog === 'spstem') {
        return !isSPA && !isSPJ && !isSPS && !isSPFL && !isSPTVE && !isSSES && !isALIVE;
    }

    if (prog === 'spa') {
        return !isSTE && !isSPJ && !isSPS && !isSPFL && !isSPTVE && !isSSES && !isALIVE;
    }

    if (prog === 'spj') {
        return !isSTE && !isSPA && !isSPS && !isSPFL && !isSPTVE && !isSSES && !isALIVE;
    }

    if (prog === 'sps') {
        return !isSTE && !isSPA && !isSPJ && !isSPFL && !isSPTVE && !isSSES && !isALIVE;
    }

    if (prog === 'spfl') {
        return !isSTE && !isSPA && !isSPJ && !isSPS && !isSPTVE && !isSSES && !isALIVE;
    }

    if (prog === 'sptve') {
        return !isSTE && !isSPA && !isSPJ && !isSPS && !isSPFL && !isSSES && !isALIVE;
    }

    if (prog === 'sses') {
        return !isSTE && !isSPA && !isSPJ && !isSPS && !isSPFL && !isSPTVE && !isALIVE;
    }

    if (prog === 'alive' || prog === 'madrasah') {
        return !isSTE && !isSPA && !isSPJ && !isSPS && !isSPFL && !isSPTVE && !isSSES;
    }

    return true;
}

describe('Section Curriculum Filtering & Sanitization', () => {
    const grade7UserReported29Subjects = [
        'Applied Entrepreneurship',
        'Applied Technical Drawing',
        'Computer Education / ICT',
        'Computer Science I',
        'Filipino',
        'English',
        'Enhanced Mathematics',
        'Mathematics',
        'Science',
        'Araling Panlipunan (AP)',
        'Creative Technology',
        'Enhanced Science',
        'Environmental Science',
        'Journalism I (Print Journalism)',
        'Pamamahayag I (Pamamahayag na Nakalimbag)',
        'Research I (Scientific Investigation)',
        'Research MIM/SIP',
        'SPA - Creative Writing (Malikhaing Pagsulat)',
        'SPA - Dance (Folk & Contemporary)',
        'SPA - Media Arts',
        'SPA - Music (Instrumental)',
        'SPA - Music (Vocal)',
        'SPA - Theater Arts',
        'SPA - Visual Arts',
        'Special Program in Foreign Language - Chinese',
        'Special Program in Foreign Language - French',
        'Special Program in Foreign Language - German',
        'Special Program in Foreign Language - Japanese',
        'Special Program in Foreign Language - Korean'
    ];

    it('filters out all 20 special program subjects from a Regular Grade 7 section', () => {
        const allowed = grade7UserReported29Subjects.filter(s =>
            isSubjectAllowedForProgram(s, 'Grade 7', 'Regular')
        );

        // Core subjects that should remain
        expect(allowed).toContain('Filipino');
        expect(allowed).toContain('English');
        expect(allowed).toContain('Mathematics');
        expect(allowed).toContain('Science');
        expect(allowed).toContain('Araling Panlipunan (AP)');
        expect(allowed).toContain('Computer Education / ICT'); // general elective

        // Special program subjects that MUST NOT be present in Regular curriculum
        expect(allowed).not.toContain('Applied Entrepreneurship');
        expect(allowed).not.toContain('Applied Technical Drawing');
        expect(allowed).not.toContain('Computer Science I');
        expect(allowed).not.toContain('Enhanced Mathematics');
        expect(allowed).not.toContain('Creative Technology');
        expect(allowed).not.toContain('Enhanced Science');
        expect(allowed).not.toContain('Environmental Science');
        expect(allowed).not.toContain('Journalism I (Print Journalism)');
        expect(allowed).not.toContain('Pamamahayag I (Pamamahayag na Nakalimbag)');
        expect(allowed).not.toContain('Research I (Scientific Investigation)');
        expect(allowed).not.toContain('Research MIM/SIP');
        expect(allowed).not.toContain('SPA - Creative Writing (Malikhaing Pagsulat)');
        expect(allowed).not.toContain('SPA - Dance (Folk & Contemporary)');
        expect(allowed).not.toContain('SPA - Media Arts');
        expect(allowed).not.toContain('SPA - Music (Instrumental)');
        expect(allowed).not.toContain('SPA - Music (Vocal)');
        expect(allowed).not.toContain('SPA - Theater Arts');
        expect(allowed).not.toContain('SPA - Visual Arts');
        expect(allowed).not.toContain('Special Program in Foreign Language - Chinese');
        expect(allowed).not.toContain('Special Program in Foreign Language - French');
        expect(allowed).not.toContain('Special Program in Foreign Language - German');
        expect(allowed).not.toContain('Special Program in Foreign Language - Japanese');
        expect(allowed).not.toContain('Special Program in Foreign Language - Korean');
    });

    it('sanitizes a contaminated section previously saved with 29 subjects down to clean DepEd curriculum', () => {
        const sanitized = grade7UserReported29Subjects.filter(s =>
            isSubjectAllowedForProgram(s, 'Grade 7', 'Regular')
        );

        // Should not be anywhere near 29 subjects
        expect(sanitized.length).toBeLessThanOrEqual(9);
    });

    it('resets to standard DepEd curriculum without foreign subjects', () => {
        const templates = getCurriculumTemplatesForSection('Grade 7', 'Regular');
        const cleanNames = templates
            .map(t => t.name)
            .filter(name => isSubjectAllowedForProgram(name, 'Grade 7', 'Regular'));

        // Grade 7 standard DepEd curriculum has 9 subjects (or 8 without unbundled MAPEH)
        expect(cleanNames).toContain('Filipino');
        expect(cleanNames).toContain('English');
        expect(cleanNames).toContain('Mathematics');
        expect(cleanNames).toContain('Science');
        expect(cleanNames).toContain('Araling Panlipunan (AP)');
        expect(cleanNames).toContain('Values Education');
        expect(cleanNames).toContain('Technology and Livelihood Education (TLE)');
        expect(cleanNames).toContain('Music and Arts');
        expect(cleanNames).toContain('Physical Education and Health');

        expect(cleanNames).not.toContain('SPA - Visual Arts');
        expect(cleanNames).not.toContain('Enhanced Science');
        expect(cleanNames).not.toContain('Special Program in Foreign Language - Chinese');
    });

    it('allows STE subjects when program is STE, but excludes other special programs', () => {
        expect(isSubjectAllowedForProgram('Enhanced Science', 'Grade 7', 'STE')).toBe(true);
        expect(isSubjectAllowedForProgram('Environmental Science', 'Grade 7', 'STE')).toBe(true);
        expect(isSubjectAllowedForProgram('Science', 'Grade 7', 'STE')).toBe(true);
        expect(isSubjectAllowedForProgram('Mathematics', 'Grade 7', 'STE')).toBe(true);

        // SPA, SPJ, SPFL, SPTVE must still be excluded
        expect(isSubjectAllowedForProgram('SPA - Visual Arts', 'Grade 7', 'STE')).toBe(false);
        expect(isSubjectAllowedForProgram('Journalism I (Print Journalism)', 'Grade 7', 'STE')).toBe(false);
        expect(isSubjectAllowedForProgram('Special Program in Foreign Language - Japanese', 'Grade 7', 'STE')).toBe(false);
        expect(isSubjectAllowedForProgram('Applied Technical Drawing', 'Grade 7', 'STE')).toBe(false);
    });

    it('rejects "specialization" as a subject name across all programs', () => {
        expect(isSubjectAllowedForProgram('Specialization', 'Grade 7', 'Regular')).toBe(false);
        expect(isSubjectAllowedForProgram('specialization', 'Grade 7', 'STE')).toBe(false);
        expect(isSubjectAllowedForProgram('Specialization', 'Grade 11', 'Regular')).toBe(false);
    });

    it('preserves Senior High School Grade 11 & Grade 12 subjects unaffected', () => {
        expect(isSubjectAllowedForProgram('General Mathematics', 'Grade 11', 'Regular')).toBe(true);
        expect(isSubjectAllowedForProgram('General Science', 'Grade 11', 'Regular')).toBe(true);
        expect(isSubjectAllowedForProgram('Creative Industries - Dance', 'Grade 11', 'Regular')).toBe(true);
        expect(isSubjectAllowedForProgram('Aesthetic Services (Beauty Care)', 'Grade 11', 'Regular')).toBe(true);
        expect(isSubjectAllowedForProgram('Practical Research 1', 'Grade 12', 'Regular')).toBe(true);
    });
});
