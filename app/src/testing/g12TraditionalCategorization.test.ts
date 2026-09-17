import { describe, it, expect } from 'vitest';
import {
    isTraditionalCoreSubject,
    isTraditionalAppliedSubject,
    isTraditionalImmersionSubject,
    getTraditionalShsStrandForSubject,
    getTraditionalShsTrackForSubject,
    getTvlComponentForSubject,
    isSubjectMatchingSectionTrackAndStrand,
    getShsCategoryForSubject
} from '../lib/curriculum';
import {
    getCurriculumPreset
} from '../lib/curriculumPresets';

describe('Traditional SHS Grade 12 Subject Categorization (DepEd DO 8, s. 2015)', () => {
    describe('1. Core Subjects from DepEd Reference (Image 1)', () => {
        const officialCores = [
            '21st Century Literature from the Philippines and the World',
            'Contemporary Philippine Arts from the Regions',
            'Disaster Readiness and Risk Reduction',
            'Earth and Life Science',
            'Earth Science',
            'General Mathematics',
            'Introduction to Philosophy of the Human Person',
            'Introduction to the Philosophy of the Human Person',
            'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino',
            'Media and Information Literacy',
            'Oral Communication in Context',
            "Pagbasa at Pagsusuri ng Iba't ibang Teksto Tungo sa Pananaliksik",
            "Pagbasa at Pagsusuri ng Iba't Ibang Teksto Tungo sa Pananaliksik",
            'Personal Development',
            'Physical Education and Health (Grade 11)',
            'Physical Education and Health (Grade 12)',
            'Physical Education and Health 1',
            'Physical Education and Health 2',
            'Physical Education and Health 3',
            'Physical Education and Health 4',
            'Health Optimizing Physical Education and Health 1',
            'Health Optimizing Physical Education and Health 2',
            'Health Optimizing Physical Education and Health 3',
            'Health Optimizing Physical Education and Health 4',
            'Physical Science',
            'Reading and Writing Skills',
            'Statistics and Probability',
            'Understanding Culture, Society and Politics'
        ];

        it('recognizes all DepEd core subjects via isTraditionalCoreSubject', () => {
            officialCores.forEach(name => {
                expect(isTraditionalCoreSubject(name), `Failed for ${name}`).toBe(true);
            });
        });

        it('classifies all DepEd core subjects as "Core Subjects" in Grade 12', () => {
            officialCores.forEach(name => {
                expect(getShsCategoryForSubject(name, 'Grade 12'), `Failed for ${name}`).toBe('Core Subjects');
            });
        });

        it('identifies Core Subjects under getTraditionalShsStrandForSubject and Track', () => {
            officialCores.forEach(name => {
                expect(getTraditionalShsTrackForSubject(name)).toBe('CORE SUBJECT (ALL TRACKS)');
                expect(getTraditionalShsStrandForSubject(name)).toBe('Core Subjects');
            });
        });
    });

    describe('2. Applied Subjects from DepEd Reference (Image 1)', () => {
        const officialApplied = [
            'Empowerment Technologies',
            'English for Academic and Professional Purposes',
            'Entrepreneurship',
            'Filipino sa Piling Larang (Akademik)',
            'Filipino sa Piling Larang (Isports)',
            'Filipino sa Piling Larang (Sining at Disenyo)',
            'Filipino sa Piling Larang (Teknikal-Bokasyunal)',
            'Inquiries, Investigations and Immersion',
            'Practical Research 1',
            'Practical Research 2'
        ];

        it('recognizes all DepEd applied subjects via isTraditionalAppliedSubject', () => {
            officialApplied.forEach(name => {
                expect(isTraditionalAppliedSubject(name), `Failed for ${name}`).toBe(true);
            });
        });

        it('classifies all DepEd applied subjects as "Applied Subjects" in Grade 12', () => {
            officialApplied.forEach(name => {
                expect(getShsCategoryForSubject(name, 'Grade 12'), `Failed for ${name}`).toBe('Applied Subjects');
            });
        });

        it('returns "Applied Subjects" in getTraditionalShsStrandForSubject', () => {
            officialApplied.forEach(name => {
                expect(getTraditionalShsStrandForSubject(name), `Failed for ${name}`).toBe('Applied Subjects');
            });
        });
    });

    describe('3. Work Immersion / Culminating Activity', () => {
        const immersionList = [
            'Work Immersion',
            'Culminating Activity',
            'Research / Capstone Project',
            'Research Output',
            'Business Enterprise Simulation',
            'Practicum in Sports (In-Campus)',
            'Apprenticeship in Sports (Off-Campus)'
        ];

        it('recognizes all immersion variations via isTraditionalImmersionSubject', () => {
            immersionList.forEach(name => {
                expect(isTraditionalImmersionSubject(name), `Failed for ${name}`).toBe(true);
            });
        });

        it('returns "Work Immersion / Culminating Activity" under getTraditionalShsStrandForSubject', () => {
            expect(getTraditionalShsStrandForSubject('Work Immersion')).toBe('Work Immersion / Culminating Activity');
            expect(getTraditionalShsStrandForSubject('Culminating Activity')).toBe('Work Immersion / Culminating Activity');
        });
    });

    describe('4. Grade 12 GAS (General Academic Strand) Section Configuration', () => {
        it('provides official 3-Term preset for Grade 12 GAS (12 subjects, 4 per term)', () => {
            const preset = getCurriculumPreset('Grade 12', 'Academic', 'GAS');
            expect(preset).toBeDefined();
            expect(preset?.id).toBe('shs-g12-gas-3term');
            expect(preset?.subjects).toHaveLength(12);

            const t1 = preset!.subjects.filter(s => s.term === 1);
            const t2 = preset!.subjects.filter(s => s.term === 2);
            const t3 = preset!.subjects.filter(s => s.term === 3);

            expect(t1).toHaveLength(4);
            expect(t2).toHaveLength(4);
            expect(t3).toHaveLength(4);

            expect(t1.map(s => s.name)).toContain('Humanities 1');
            expect(t2.map(s => s.name)).toContain('Social Science 1');
            expect(t2.map(s => s.name)).toContain('Applied Economics');
            expect(t3.map(s => s.name)).toContain('Organization and Management');
        });

        it('filters subjects strictly for Grade 12 Academic GAS', () => {
            // Universal Core allowed
            expect(isSubjectMatchingSectionTrackAndStrand('21st Century Literature from the Philippines and the World', 'Grade 12', 'Academic', 'GAS')).toBe(true);
            expect(isSubjectMatchingSectionTrackAndStrand('Physical Education and Health 3', 'Grade 12', 'Academic', 'GAS')).toBe(true);
            expect(isSubjectMatchingSectionTrackAndStrand('General Mathematics', 'Grade 12', 'Academic', 'GAS')).toBe(true);

            // Universal Applied allowed
            expect(isSubjectMatchingSectionTrackAndStrand('Practical Research 2', 'Grade 12', 'Academic', 'GAS')).toBe(true);
            expect(isSubjectMatchingSectionTrackAndStrand('English for Academic and Professional Purposes', 'Grade 12', 'Academic', 'GAS')).toBe(true);
            expect(isSubjectMatchingSectionTrackAndStrand('Inquiries, Investigations, and Immersion', 'Grade 12', 'Academic', 'GAS')).toBe(true);

            // GAS Specialized subjects allowed
            expect(isSubjectMatchingSectionTrackAndStrand('Humanities 1', 'Grade 12', 'Academic', 'GAS')).toBe(true);
            expect(isSubjectMatchingSectionTrackAndStrand('Social Science 1', 'Grade 12', 'Academic', 'GAS')).toBe(true);
            expect(isSubjectMatchingSectionTrackAndStrand('Applied Economics', 'Grade 12', 'Academic', 'GAS')).toBe(true);
            expect(isSubjectMatchingSectionTrackAndStrand('Organization and Management', 'Grade 12', 'Academic', 'GAS')).toBe(true);

            // Irrelevant TVL / Sports / Arts subjects blocked
            expect(isSubjectMatchingSectionTrackAndStrand('Automotive Servicing', 'Grade 12', 'Academic', 'GAS')).toBe(false);
            expect(isSubjectMatchingSectionTrackAndStrand('Bread and Pastry Production', 'Grade 12', 'Academic', 'GAS')).toBe(false);
            expect(isSubjectMatchingSectionTrackAndStrand('Sports Officiating and Activity Management', 'Grade 12', 'Academic', 'GAS')).toBe(false);
        });
    });

    describe('5. Grade 12 TVL Track Configuration', () => {
        it('provides official 3-Term preset for Grade 12 TVL', () => {
            const preset = getCurriculumPreset('Grade 12', 'TVL', 'TVL');
            expect(preset).toBeDefined();
            expect(preset?.id).toBe('shs-g12-tvl-3term');
            expect(preset?.subjects).toHaveLength(12);
        });

        it('correctly maps TVL specializations into DepEd TVL components', () => {
            expect(getTvlComponentForSubject('Bread and Pastry Production')).toBe('Home Economics (HE)');
            expect(getTvlComponentForSubject('Cookery')).toBe('Home Economics (HE)');
            expect(getTvlComponentForSubject('Computer Systems Servicing')).toBe('Information and Communications Technology (ICT)');
            expect(getTvlComponentForSubject('Technical Drafting')).toBe('Information and Communications Technology (ICT)');
            expect(getTvlComponentForSubject('Shielded Metal Arc Welding (SMAW)')).toBe('Industrial Arts (IA)');
            expect(getTvlComponentForSubject('Automotive Servicing')).toBe('Industrial Arts (IA)');
            expect(getTvlComponentForSubject('Agricultural Crops Production')).toBe('Agri-Fishery Arts (AFA)');
            expect(getTvlComponentForSubject('Work Immersion (TVL)')).toBe('Work Immersion');
        });
    });
});
