import { describe, it, expect } from 'vitest';
import { 
    getCategoryForSubject, 
    isSubjectAllowedForProgram, 
    classifyJhsSubjectTrack, 
    JHS_STE_ELECTIVES,
    SPSTEM_SUBJECTS
} from '../lib/curriculum';
import { JHS_SPECIAL_PROGRAMS, getSubjectGroupsForLevel } from '../lib/sf10Subjects';

describe('STE Electives & Cross-Grade JHS Customization', () => {
    describe('1. Categorization and Recognition', () => {
        const canonicalElectives = [
            'Environmental Science',
            'Research I',
            'Biotechnology',
            'Research II',
            'Consumer Chemistry',
            'Research III',
            'Electronics and Robotics',
            'Research IV'
        ];

        it.each(canonicalElectives)('classifies "%s" as STE across JHS grades', (subj) => {
            const catG7 = getCategoryForSubject(subj, 'Grade 7');
            const catG10 = getCategoryForSubject(subj, 'Grade 10');
            expect(catG7).toBe('Science, Technology & Engineering (STE / SPSTEM)');
            expect(catG10).toBe('Science, Technology & Engineering (STE / SPSTEM)');
        });

        it('recognizes both Roman and Arabic variations of Research', () => {
            expect(getCategoryForSubject('Research I', 'Grade 7')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
            expect(getCategoryForSubject('Research 1', 'Grade 7')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
            expect(getCategoryForSubject('Research II', 'Grade 10')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
            expect(getCategoryForSubject('Research 2', 'Grade 10')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
            expect(getCategoryForSubject('Research III', 'Grade 9')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
            expect(getCategoryForSubject('Research 3', 'Grade 9')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
            expect(getCategoryForSubject('Research IV', 'Grade 10')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
            expect(getCategoryForSubject('Research 4', 'Grade 10')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
        });

        it('recognizes both Electronics and Robotics and legacy Robotics and Digital Electronics', () => {
            expect(getCategoryForSubject('Electronics and Robotics', 'Grade 10')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
            expect(getCategoryForSubject('Electronics & Robotics', 'Grade 10')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
            expect(getCategoryForSubject('Robotics and Digital Electronics', 'Grade 10')).toBe('Science, Technology & Engineering (STE / SPSTEM)');
        });

        it('correctly maps track filter to "ste"', () => {
            expect(classifyJhsSubjectTrack('Electronics and Robotics', 'Grade 10')).toBe('ste');
            expect(classifyJhsSubjectTrack('Research II', 'Grade 10')).toBe('ste');
            expect(classifyJhsSubjectTrack('Biotechnology', 'Grade 8')).toBe('ste');
            expect(classifyJhsSubjectTrack('Environmental Science', 'Grade 7')).toBe('ste');
        });
    });

    describe('2. Cross-Grade Section Permission (isSubjectAllowedForProgram)', () => {
        it('allows Research II and Electronics and Robotics in a Grade 10 STE section', () => {
            expect(isSubjectAllowedForProgram('Research II', 'Grade 10', 'STE')).toBe(true);
            expect(isSubjectAllowedForProgram('Electronics and Robotics', 'Grade 10', 'STE')).toBe(true);
            expect(isSubjectAllowedForProgram('Biotechnology', 'Grade 10', 'STE')).toBe(true);
            expect(isSubjectAllowedForProgram('Environmental Science', 'Grade 10', 'STE')).toBe(true);
        });

        it('allows core subjects along with STE electives in an STE section', () => {
            expect(isSubjectAllowedForProgram('Mathematics', 'Grade 10', 'STE')).toBe(true);
            expect(isSubjectAllowedForProgram('Science', 'Grade 10', 'STE')).toBe(true);
            expect(isSubjectAllowedForProgram('Filipino', 'Grade 10', 'STE')).toBe(true);
        });

        it('prevents STE electives from polluting Regular sections', () => {
            expect(isSubjectAllowedForProgram('Research II', 'Grade 10', 'Regular')).toBe(false);
            expect(isSubjectAllowedForProgram('Electronics and Robotics', 'Grade 10', 'Regular')).toBe(false);
            expect(isSubjectAllowedForProgram('Environmental Science', 'Grade 7', 'Regular')).toBe(false);
            expect(isSubjectAllowedForProgram('Biotechnology', 'Grade 8', 'Regular')).toBe(false);
        });

        it('prevents SPA/SPJ subjects from polluting an STE section', () => {
            expect(isSubjectAllowedForProgram('SPA - Visual Arts', 'Grade 10', 'STE')).toBe(false);
            expect(isSubjectAllowedForProgram('Journalism I (Print Journalism)', 'Grade 10', 'STE')).toBe(false);
        });
    });

    describe('3. Master Catalog & Template Pools', () => {
        it('contains all 8 canonical electives in JHS_STE_ELECTIVES', () => {
            const names = JHS_STE_ELECTIVES.map(s => s.name);
            expect(names).toContain('Environmental Science');
            expect(names).toContain('Research I');
            expect(names).toContain('Biotechnology');
            expect(names).toContain('Research II');
            expect(names).toContain('Consumer Chemistry');
            expect(names).toContain('Research III');
            expect(names).toContain('Electronics and Robotics');
            expect(names).toContain('Research IV');
        });

        it('contains legacy DepEd aliases in JHS_STE_ELECTIVES for backward compatibility', () => {
            const names = JHS_STE_ELECTIVES.map(s => s.name);
            expect(names).toContain('Research I (Scientific Investigation)');
            expect(names).toContain('Research II (Research Methodology)');
            expect(names).toContain('Research III (Science Investigatory Project)');
            expect(names).toContain('Research IV (SIP Defense & Capstone)');
            expect(names).toContain('Robotics and Digital Electronics');
        });

        it('includes canonical Research I-IV in SPSTEM_SUBJECTS defaults', () => {
            const g7Names = SPSTEM_SUBJECTS['Grade 7'].map(s => s.name);
            const g8Names = SPSTEM_SUBJECTS['Grade 8'].map(s => s.name);
            const g9Names = SPSTEM_SUBJECTS['Grade 9'].map(s => s.name);
            const g10Names = SPSTEM_SUBJECTS['Grade 10'].map(s => s.name);

            expect(g7Names).toContain('Research I');
            expect(g8Names).toContain('Research II');
            expect(g9Names).toContain('Research III');
            expect(g10Names).toContain('Research IV');
            expect(g10Names).toContain('Electronics and Robotics');
        });
    });

    describe('4. SF10 Dropdown Subject Options', () => {
        it('includes all canonical STE electives in JHS_SPECIAL_PROGRAMS', () => {
            expect(JHS_SPECIAL_PROGRAMS).toContain('Environmental Science');
            expect(JHS_SPECIAL_PROGRAMS).toContain('Research I');
            expect(JHS_SPECIAL_PROGRAMS).toContain('Biotechnology');
            expect(JHS_SPECIAL_PROGRAMS).toContain('Research II');
            expect(JHS_SPECIAL_PROGRAMS).toContain('Consumer Chemistry');
            expect(JHS_SPECIAL_PROGRAMS).toContain('Research III');
            expect(JHS_SPECIAL_PROGRAMS).toContain('Electronics and Robotics');
            expect(JHS_SPECIAL_PROGRAMS).toContain('Research IV');
        });

        it('exposes all STE electives to JHS SF10 subject dropdown groups', () => {
            const groups = getSubjectGroupsForLevel('jhs');
            const specialGroup = groups.find(g => g.label.includes('Special Curricular Programs'));
            expect(specialGroup).toBeDefined();

            expect(specialGroup?.subjects).toContain('Electronics and Robotics');
            expect(specialGroup?.subjects).toContain('Research II');
            expect(specialGroup?.subjects).toContain('Research IV');
            expect(specialGroup?.subjects).toContain('Biotechnology');
        });
    });
});
