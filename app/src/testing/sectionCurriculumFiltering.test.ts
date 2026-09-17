import { describe, it, expect } from 'vitest';
import { 
    getCategoryForSubject, 
    getCurriculumTemplatesForSection,
    SSHS_ACADEMIC_CLUSTERS_LIST,
    SSHS_TECHPRO_CLUSTERS_LIST,
    getClustersForGrade11Track
} from '../lib/curriculum';

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

    it('ensures Grade 11 only provides Academic and TechPro tracks with strictly SSHS clusters and no old K-12 SHS choices', () => {
        // Academic track in Grade 11
        const acadClusters = getClustersForGrade11Track('Academic');
        expect(acadClusters).toEqual([...SSHS_ACADEMIC_CLUSTERS_LIST]);
        expect(acadClusters).not.toContain('STEM');
        expect(acadClusters).not.toContain('ABM');
        expect(acadClusters).not.toContain('HUMSS');
        expect(acadClusters).not.toContain('GAS');

        // TechPro track in Grade 11
        const techProClusters = getClustersForGrade11Track('TechPro');
        expect(techProClusters).toEqual([...SSHS_TECHPRO_CLUSTERS_LIST]);
        expect(techProClusters).not.toContain('Home Economics (HE)');
        expect(techProClusters).not.toContain('Information and Communications Technology (ICT)');
        expect(techProClusters).not.toContain('Industrial Arts (IA)');
        expect(techProClusters).not.toContain('Agri-Fishery Arts (AFA)');

        // Old K-12 SHS tracks not allowed in Grade 11
        expect(getClustersForGrade11Track('Sports')).toEqual([]);
        expect(getClustersForGrade11Track('Arts and Design')).toEqual([]);
    });

    it('strictly limits Grade 12 Academic ABM subjects to Core, Applied, and ABM Specialized subjects (eliminating all 105 subject pollution)', async () => {
        const { isSubjectMatchingSectionTrackAndStrand } = await import('../lib/curriculum');
        const { getCurriculumPreset } = await import('../lib/curriculumPresets');

        // Verify detected preset for Grade 12 ABM is exactly 12 subjects
        const abmPreset = getCurriculumPreset('Grade 12', 'Academic', 'ABM', 'Regular');
        expect(abmPreset).toBeDefined();
        expect(abmPreset?.subjects.length).toBe(12);

        // Core subjects allowed
        expect(isSubjectMatchingSectionTrackAndStrand('General Mathematics', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('21st Century Literature from the Philippines and the World', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Media and Information Literacy', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Understanding Culture, Society and Politics', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Physical Education and Health 3', 'Grade 12', 'Academic', 'ABM')).toBe(true);

        // Applied subjects allowed
        expect(isSubjectMatchingSectionTrackAndStrand('English for Academic and Professional Purposes', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Practical Research 2', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Empowerment Technologies', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Inquiries, Investigations and Immersion', 'Grade 12', 'Academic', 'ABM')).toBe(true);

        // ABM specialized subjects allowed
        expect(isSubjectMatchingSectionTrackAndStrand('Fundamentals of Accountancy, Business, and Management 1', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Fundamentals of Accountancy, Business, and Management 2', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Business Finance', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Business Math', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Principles of Marketing', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Applied Economics', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Organization and Management', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Business Ethics and Social Responsibility', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Business Enterprise Simulation', 'Grade 12', 'Academic', 'ABM')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Work Immersion', 'Grade 12', 'Academic', 'ABM')).toBe(true);

        // UNRELATED STEM subjects MUST BE REJECTED
        expect(isSubjectMatchingSectionTrackAndStrand('Basic Calculus', 'Grade 12', 'Academic', 'ABM')).toBe(false);
        expect(isSubjectMatchingSectionTrackAndStrand('Pre-Calculus', 'Grade 12', 'Academic', 'ABM')).toBe(false);
        expect(isSubjectMatchingSectionTrackAndStrand('General Biology 1', 'Grade 12', 'Academic', 'ABM')).toBe(false);
        expect(isSubjectMatchingSectionTrackAndStrand('General Chemistry 1', 'Grade 12', 'Academic', 'ABM')).toBe(false);
        expect(isSubjectMatchingSectionTrackAndStrand('General Physics 1', 'Grade 12', 'Academic', 'ABM')).toBe(false);

        // UNRELATED TVL subjects MUST BE REJECTED
        expect(isSubjectMatchingSectionTrackAndStrand('Automotive Servicing', 'Grade 12', 'Academic', 'ABM')).toBe(false);
        expect(isSubjectMatchingSectionTrackAndStrand('Bread and Pastry Production', 'Grade 12', 'Academic', 'ABM')).toBe(false);
        expect(isSubjectMatchingSectionTrackAndStrand('Shielded Metal Arc Welding (SMAW)', 'Grade 12', 'Academic', 'ABM')).toBe(false);
        expect(isSubjectMatchingSectionTrackAndStrand('Electrical Installation and Maintenance', 'Grade 12', 'Academic', 'ABM')).toBe(false);
        expect(isSubjectMatchingSectionTrackAndStrand('Caregiving', 'Grade 12', 'Academic', 'ABM')).toBe(false);

        // UNRELATED Sports & Arts subjects MUST BE REJECTED
        expect(isSubjectMatchingSectionTrackAndStrand('Biomechanical Analysis of Human Movement', 'Grade 12', 'Academic', 'ABM')).toBe(false);
        expect(isSubjectMatchingSectionTrackAndStrand('Sports Officiating', 'Grade 12', 'Academic', 'ABM')).toBe(false);
        expect(isSubjectMatchingSectionTrackAndStrand('Creative Writing', 'Grade 12', 'Academic', 'ABM')).toBe(false);
    });

    it('strictly limits Grade 11 SSHS to Core and chosen cluster electives', async () => {
        const { isSubjectMatchingSectionTrackAndStrand } = await import('../lib/curriculum');

        // SSHS Core subjects always allowed for Grade 11
        expect(isSubjectMatchingSectionTrackAndStrand('General Mathematics', 'Grade 11', 'Academic', 'Science, Technology, Engineering, and Mathematics')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('General Science', 'Grade 11', 'Academic', 'Science, Technology, Engineering, and Mathematics')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Life and Career Skills', 'Grade 11', 'Academic', 'Science, Technology, Engineering, and Mathematics')).toBe(true);

        // Chosen cluster subjects allowed
        expect(isSubjectMatchingSectionTrackAndStrand('Advanced Mathematics', 'Grade 11', 'Academic', 'Science, Technology, Engineering, and Mathematics')).toBe(true);
        expect(isSubjectMatchingSectionTrackAndStrand('Biology 1', 'Grade 11', 'Academic', 'Science, Technology, Engineering, and Mathematics')).toBe(true);

        // TechPro cluster subjects REJECTED when Academic cluster is chosen
        expect(isSubjectMatchingSectionTrackAndStrand('Automotive Servicing', 'Grade 11', 'Academic', 'Science, Technology, Engineering, and Mathematics')).toBe(false);
        expect(isSubjectMatchingSectionTrackAndStrand('Shielded Metal Arc Welding (SMAW)', 'Grade 11', 'Academic', 'Science, Technology, Engineering, and Mathematics')).toBe(false);
    });
});
