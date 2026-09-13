import { describe, it, expect } from 'vitest';
import { 
    STANDARD_SUBJECTS, 
    SPECIAL_SUBJECTS, 
    SSHS_G11_CORE_SUBJECTS, 
    SSHS_G11_ACADEMIC_SUBJECTS,
    isGrade11CoreSubject,
    getShsCategoryForSubject
} from '../lib/curriculum';

describe('Grade 11 Full Curriculum Catalog Choices Availability', () => {
    it('provides all 6 universal Core subjects in SSHS_G11_CORE_SUBJECTS', () => {
        expect(SSHS_G11_CORE_SUBJECTS).toHaveLength(6);
        const coreNames = SSHS_G11_CORE_SUBJECTS.map(s => s.name);
        expect(coreNames).toContain('Effective Communication');
        expect(coreNames).toContain('General Mathematics');
        expect(coreNames).toContain('General Science');
        expect(coreNames).toContain('Life and Career Skills');
        expect(coreNames).toContain('Mabisang Komunikasyon');
        expect(coreNames).toContain('Pag-aaral ng Kasaysayan at Lipunang Pilipino');
    });

    it('ensures STANDARD_SUBJECTS["Grade 11"] strictly defaults to the 6 universal Core subjects so electives are not forced on sections', () => {
        expect(STANDARD_SUBJECTS['Grade 11']).toEqual(SSHS_G11_CORE_SUBJECTS);
        expect(STANDARD_SUBJECTS['Grade 11']).toHaveLength(6);
        const names = STANDARD_SUBJECTS['Grade 11'].map(s => s.name);
        expect(names).toContain('Effective Communication');
        expect(names).toContain('General Mathematics');
        expect(names).toContain('General Science');
        expect(names).toContain('Life and Career Skills');
        expect(names).toContain('Mabisang Komunikasyon');
        expect(names).toContain('Pag-aaral ng Kasaysayan at Lipunang Pilipino');
        // Unselected electives must NEVER be in standard subjects
        expect(names).not.toContain('Finite Mathematics 1');
        expect(names).not.toContain('Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)');
    });

    it('makes the COMPLETE catalog of Academic Track choices available in SSHS_G11_ACADEMIC_SUBJECTS so teachers can choose any elective', () => {
        expect(SSHS_G11_ACADEMIC_SUBJECTS.length).toBeGreaterThanOrEqual(70);

        const names = SSHS_G11_ACADEMIC_SUBJECTS.map(s => s.name);
        // Core subjects present
        expect(names).toContain('Effective Communication');
        expect(names).toContain('General Mathematics');
        
        // STEM choices present
        expect(names).toContain('Pre-Calculus');
        expect(names).toContain('Basic Calculus');
        expect(names).toContain('Chemistry 1');
        expect(names).toContain('Physics 1');
        expect(names).toContain('Biology 1');
        expect(names).toContain('Finite Mathematics 1');
        expect(names).toContain('Advanced Mathematics');

        // ABM choices present
        expect(names).toContain('Business 1 (Basic Accounting)');
        expect(names).toContain('Contemporary Marketing');
        expect(names).toContain('Entrepreneurship');

        // HUMSS choices present
        expect(names).toContain('Contemporary Literature 1');
        expect(names).toContain('Introduction to the Philosophy of the Human Person');
        expect(names).toContain('Philippine Governance (Philippine Politics and Governance)');
        expect(names).toContain('Malikhaing Pagsulat');

        // Field Experience / Research choices present
        expect(names).toContain('Research 1');
        expect(names).toContain('Design and Innovation');
    });

    it('makes the COMPLETE catalog of TechPro choices available in SPECIAL_SUBJECTS["Grade 11"]', () => {
        const g11Special = SPECIAL_SUBJECTS['Grade 11'];
        expect(g11Special.length).toBeGreaterThanOrEqual(40);

        const names = g11Special.map(s => s.name);
        expect(names).toContain('Effective Communication');
        expect(names).toContain('Automotive Servicing (Electrical Repair)');
        expect(names).toContain('Computer Systems Servicing');
        expect(names).toContain('Food Processing');
        expect(names).toContain('Bakery Operation');
    });

    it('allows filtering to Core Only when needed without losing elective choices in catalog', () => {
        const fullCatalog = SSHS_G11_ACADEMIC_SUBJECTS;
        const coreOnly = fullCatalog.filter(s => getShsCategoryForSubject(s.name, 'Grade 11') === 'Core Subject (All Tracks)');
        expect(coreOnly).toHaveLength(6);

        const electiveChoices = fullCatalog.filter(s => !isGrade11CoreSubject(s.name));
        expect(electiveChoices.length).toBeGreaterThanOrEqual(60);
    });

    it('organizes SSHS Grade 11 into 5 Academic Clusters and 10 TechPro Clusters (No Strands)', async () => {
        const { 
            SSHS_ACADEMIC_CLUSTERS_LIST, 
            SSHS_TECHPRO_CLUSTERS_LIST, 
            SSHS_ACADEMIC_CLUSTERS, 
            SSHS_TECHPRO_CLUSTERS,
            getClustersForGrade11Track,
            getSshsCategoryForSubject
        } = await import('../lib/curriculum');

        // 5 Academic Clusters
        expect(SSHS_ACADEMIC_CLUSTERS_LIST).toHaveLength(5);
        expect(Object.keys(SSHS_ACADEMIC_CLUSTERS)).toHaveLength(5);
        expect(SSHS_ACADEMIC_CLUSTERS_LIST).toContain('Science, Technology, Engineering, and Mathematics');
        expect(SSHS_ACADEMIC_CLUSTERS_LIST).toContain('Business and Entrepreneurship');
        expect(SSHS_ACADEMIC_CLUSTERS_LIST).toContain('Arts, Social Sciences, and Humanities');
        expect(SSHS_ACADEMIC_CLUSTERS_LIST).toContain('Sports, Health, and Wellness');
        expect(SSHS_ACADEMIC_CLUSTERS_LIST).toContain('Field Experience');

        // 10 TechPro Clusters
        expect(SSHS_TECHPRO_CLUSTERS_LIST).toHaveLength(10);
        expect(Object.keys(SSHS_TECHPRO_CLUSTERS)).toHaveLength(10);

        // Grade 11 Academic track returns Academic Clusters, not old strands
        const clusters = getClustersForGrade11Track('Academic');
        expect(clusters).toEqual([...SSHS_ACADEMIC_CLUSTERS_LIST]);
        expect(clusters).not.toContain('STEM');
        expect(clusters).not.toContain('ABM');
        expect(clusters).not.toContain('HUMSS');
        expect(clusters).not.toContain('GAS');

        // Category resolution for SSHS
        expect(getSshsCategoryForSubject('Effective Communication')).toBe('SSHS - CORE');
        expect(getSshsCategoryForSubject('General Mathematics')).toBe('SSHS - CORE');
        expect(getSshsCategoryForSubject('Pre-Calculus')).toBe('SSHS - ACADEMIC');
        expect(getSshsCategoryForSubject('Basic Accounting')).toBe('SSHS - ACADEMIC');
        expect(getSshsCategoryForSubject('Automotive Servicing')).toBe('SSHS - TECH-PRO');
    });
});

