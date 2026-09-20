import { describe, it, expect } from 'vitest';
import type { Section, Student } from '../types';
import {
    TEST_SECTION_SPECS,
    buildTestSectionRecords,
    isTestSection,
    isTestSubject,
    isTestStudent,
    isTestClassRecord,
    isTestHpsRecord,
    buildTestHpsRecords,
    buildTestClassRecords,
    getTestSectionStats
} from './testSectionGenerator';

describe('testSectionGenerator', () => {
    it('contains test specs for all grades from Grade 1 to Grade 12', () => {
        const coveredGrades = new Set(TEST_SECTION_SPECS.map((s) => s.gradeLevel));
        for (let g = 1; g <= 12; g++) {
            expect(coveredGrades.has(`Grade ${g}`)).toBe(true);
        }
    });

    it('covers elementary programs (Regular, SSES, ALIVE, SPA, SPJ, SPS)', () => {
        const elemSpecs = TEST_SECTION_SPECS.filter((s) => s.category === 'elementary');
        const programs = new Set(elemSpecs.map((s) => s.program));
        expect(programs.has('Regular')).toBe(true);
        expect(programs.has('SSES')).toBe(true);
        expect(programs.has('ALIVE')).toBe(true);
        expect(programs.has('SPA')).toBe(true);
        expect(programs.has('SPJ')).toBe(true);
        expect(programs.has('SPS')).toBe(true);
    });

    it('covers junior high school programs (Regular, STE, SPSTEM, SPA, SPJ, SPS, SPFL, SPTVE, ALIVE)', () => {
        const jhsSpecs = TEST_SECTION_SPECS.filter((s) => s.category === 'jhs');
        const programs = new Set(jhsSpecs.map((s) => s.program));
        expect(programs.has('Regular')).toBe(true);
        expect(programs.has('STE')).toBe(true);
        expect(programs.has('SPSTEM')).toBe(true);
        expect(programs.has('SPA')).toBe(true);
        expect(programs.has('SPJ')).toBe(true);
        expect(programs.has('SPS')).toBe(true);
        expect(programs.has('SPFL')).toBe(true);
        expect(programs.has('SPTVE')).toBe(true);
        expect(programs.has('ALIVE')).toBe(true);
    });

    it('covers Grade 11 SSHS Academic and TechPro clusters', () => {
        const g11Specs = TEST_SECTION_SPECS.filter((s) => s.gradeLevel === 'Grade 11');
        const clusters = new Set(g11Specs.map((s) => s.cluster));
        // Academic
        expect(clusters.has('Science, Technology, Engineering, and Mathematics')).toBe(true);
        expect(clusters.has('Business and Entrepreneurship')).toBe(true);
        expect(clusters.has('Arts, Social Sciences, and Humanities')).toBe(true);
        expect(clusters.has('Sports, Health, and Wellness')).toBe(true);
        expect(clusters.has('Field Experience')).toBe(true);
        // TechPro
        expect(clusters.has('ICT Support and Computer Programming Technologies')).toBe(true);
        expect(clusters.has('Automotive and Small Engine Technologies')).toBe(true);
        expect(clusters.has('Hospitality and Tourism')).toBe(true);
    });

    it('covers Grade 12 SHS Academic strands and TVL/Sports/Arts tracks', () => {
        const g12Specs = TEST_SECTION_SPECS.filter((s) => s.gradeLevel === 'Grade 12');
        const strands = new Set(g12Specs.map((s) => s.strand));
        expect(strands.has('STEM')).toBe(true);
        expect(strands.has('ABM')).toBe(true);
        expect(strands.has('HUMSS')).toBe(true);
        expect(strands.has('GAS')).toBe(true);
        expect(strands.has('TVL')).toBe(true);
        expect(strands.has('Sports Track')).toBe(true);
        expect(strands.has('Arts and Design Track')).toBe(true);
    });

    it('builds section records and subject offerings with valid curriculum data', () => {
        const { sections, subjects, students } = buildTestSectionRecords('all', true, 6);
        expect(sections.length).toBe(TEST_SECTION_SPECS.length);
        expect(subjects.length).toBeGreaterThan(sections.length);
        expect(students.length).toBe(sections.length * 6);

        sections.forEach((sec) => {
            expect(sec.id.startsWith('test-sec-')).toBe(true);
            expect(sec.section_name.startsWith('[TEST]')).toBe(true);
            expect(sec.taught_subjects).toBeDefined();
            expect(sec.taught_subjects!.length).toBeGreaterThan(0);
            expect(isTestSection(sec)).toBe(true);
        });

        subjects.forEach((subj) => {
            expect(subj.id.startsWith('test-subj-')).toBe(true);
            expect(subj.section_id!.startsWith('test-sec-')).toBe(true);
            expect(isTestSubject(subj)).toBe(true);
            expect(subj.written_weight).toBeGreaterThan(0);
            expect(subj.performance_weight).toBeGreaterThan(0);
        });
    });

    it('generates test students with complete details and realistic DepEd profiles', () => {
        const { sections, students } = buildTestSectionRecords('Grade 7', true, 6);
        expect(students.length).toBe(sections.length * 6);

        students.forEach((student) => {
            expect(isTestStudent(student)).toBe(true);
            expect(student.lrn).toMatch(/^999\d{9}$/); // 12-digit LRN starting with 999
            expect(student.first_name).toBeTruthy();
            expect(student.last_name).toBeTruthy();
            expect(student.middle_name).toBeTruthy();
            expect(['Male', 'Female']).toContain(student.gender);
            expect(student.birthday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(student.age).toBeGreaterThanOrEqual(5);
            expect(student.address).toBeTruthy();
            expect(student.contact_number).toMatch(/^09\d{2}-555-\d{4}$/);
            expect(student.grade_level).toBe('Grade 7');
            expect(student.student_section).toBeTruthy();
            // Nutritional status
            expect(typeof student.weight).toBe('number');
            expect(typeof student.height).toBe('number');
            expect(typeof student.bmi).toBe('number');
            expect(student.bmi_category).toBe('Normal');
            // Requirements
            expect(student.req_report_card).toBe(true);
            expect(student.req_birth_cert).toBe(true);
            expect(student.req_sf10).toBe(true);
            expect(student.req_good_moral).toBe(true);
        });

        // Check gender balance per section
        sections.forEach((sec) => {
            const secStudents = students.filter((s) => s.student_section === sec.id);
            const males = secStudents.filter((s) => s.gender === 'Male');
            const females = secStudents.filter((s) => s.gender === 'Female');
            expect(males.length).toBe(3);
            expect(females.length).toBe(3);
        });
    });

    it('supports disabling student generation via includeStudents: false', () => {
        const { sections, students } = buildTestSectionRecords('Grade 1', false);
        expect(sections.length).toBeGreaterThan(0);
        expect(students.length).toBe(0);
    });

    it('filters test sections by category (elementary, jhs, shs)', () => {
        const elemData = buildTestSectionRecords('elementary');
        expect(elemData.sections.every((s) => {
            const num = parseInt(s.section_grade_level.replace(/\D/g, ''));
            return num >= 1 && num <= 6;
        })).toBe(true);

        const jhsData = buildTestSectionRecords('jhs');
        expect(jhsData.sections.every((s) => {
            const num = parseInt(s.section_grade_level.replace(/\D/g, ''));
            return num >= 7 && num <= 10;
        })).toBe(true);

        const shsData = buildTestSectionRecords('shs');
        expect(shsData.sections.every((s) => {
            const num = parseInt(s.section_grade_level.replace(/\D/g, ''));
            return num === 11 || num === 12;
        })).toBe(true);
    });

    it('enables subjects as teaching loads by default', () => {
        const { sections, subjects } = buildTestSectionRecords('Grade 7', false, 6, true);
        sections.forEach((sec) => {
            expect(sec.is_teaching_load).toBe(true);
            expect(sec.teaching_subjects).toEqual(sec.taught_subjects);
        });
        subjects.forEach((subj) => {
            expect(subj.is_teaching_load).toBe(true);
        });
    });

    it('supports disabling teaching loads when asTeachingLoad is false', () => {
        const { sections, subjects } = buildTestSectionRecords('Grade 7', false, 6, false);
        sections.forEach((sec) => {
            expect(sec.is_teaching_load).toBe(false);
            expect(sec.teaching_subjects).toEqual([]);
        });
        subjects.forEach((subj) => {
            expect(subj.is_teaching_load).toBe(false);
        });
    });

    it('calculates test section, student, and class record statistics accurately', () => {
        const { sections, students, classRecords } = buildTestSectionRecords('all', true, 6, true, true);
        const stats = getTestSectionStats(sections, students, classRecords);
        expect(stats.totalTestSections).toBe(sections.length);
        expect(stats.elementaryCount + stats.jhsCount + stats.shsCount).toBe(sections.length);
        expect(stats.totalTestStudents).toBe(students.length);
        expect(stats.totalTestClassRecords).toBe(classRecords.length);
        expect(stats.totalTestClassRecords).toBeGreaterThan(0);
    });

    it('generates matching HPS records tailored to subject types (standard, GMRC, SHS)', () => {
        const { subjects, hpsRecords } = buildTestSectionRecords('all', false, 6, true, true);
        expect(hpsRecords.length).toBeGreaterThan(0);

        hpsRecords.forEach((hps) => {
            expect(isTestHpsRecord(hps)).toBe(true);
            expect(hps.id.startsWith('test-hps-')).toBe(true);
            expect(hps.school_year).toBe('2026-2027');
            expect([1, 2, 3]).toContain(hps.quarter);
            expect(hps.written_works.length).toBeGreaterThanOrEqual(5);
            expect(hps.performance_tasks.length).toBeGreaterThanOrEqual(3);
            expect(Number(hps.quarterly_exam)).toBe(50);
        });

        // Verify GMRC HPS (10 WW, 9 PT)
        const gmrcHps = hpsRecords.find((h) => h.subject_name?.toLowerCase().includes('gmrc') || h.subject_name?.toLowerCase().includes('values'));
        if (gmrcHps) {
            expect(gmrcHps.written_works.length).toBe(10);
            expect(gmrcHps.performance_tasks.length).toBe(9);
        }

        // Verify SHS HPS (10 WW, 10 PT)
        const shsHps = hpsRecords.find((h) => {
            const subj = subjects.find(s => s.id === h.subject_id);
            return subj?.grade_level.includes('11') || subj?.grade_level.includes('12');
        });
        if (shsHps) {
            expect(shsHps.written_works.length).toBe(10);
            expect(shsHps.performance_tasks.length).toBe(10);
        }
    });

    it('generates distinct, independent scores across different subjects for the same learner', () => {
        const { subjects, classRecords, students } = buildTestSectionRecords('Grade 5', true, 6, true, true);
        const secSubjects = subjects.filter(s => s.section_id?.includes('g5'));
        expect(secSubjects.length).toBeGreaterThanOrEqual(2);

        // Check for learner 1 across all subjects in Quarter 1
        const lrn = students[0].lrn;
        const studentQ1Records = classRecords.filter(cr => cr.student_lrn === lrn && cr.quarter === 1);
        expect(studentQ1Records.length).toBeGreaterThanOrEqual(2);

        // Scores across subjects should not be 100% identical
        const firstWw = JSON.stringify(studentQ1Records[0].written_works);
        const hasVariation = studentQ1Records.some((cr, idx) => {
            if (idx === 0) return false;
            return JSON.stringify(cr.written_works) !== firstWw ||
                   JSON.stringify(cr.performance_tasks) !== JSON.stringify(studentQ1Records[0].performance_tasks);
        });
        expect(hasVariation).toBe(true);
    });

    it('generates natural performance variance across quarters (Terms 1, 2, and 3) for learners', () => {
        const { subjects, classRecords, students } = buildTestSectionRecords('Grade 5', true, 6, true, true);
        const subj = subjects[0];
        const lrn = students[0].lrn;

        const termRecords = classRecords.filter(cr => cr.student_lrn === lrn && cr.subject_id === subj.id);
        expect(termRecords.length).toBe(3);

        // Scores should have natural term drift and not be 100% identical across all 3 terms
        const t1Scores = JSON.stringify(termRecords.find(r => r.quarter === 1)?.written_works);
        const t2Scores = JSON.stringify(termRecords.find(r => r.quarter === 2)?.written_works);
        const t3Scores = JSON.stringify(termRecords.find(r => r.quarter === 3)?.written_works);
        expect(t1Scores === t2Scores && t2Scores === t3Scores).toBe(false);
    });

    it('generates random class records and grading sheet records with realistic valid scores', () => {
        const { hpsRecords, classRecords, gradingSheetRecords } = buildTestSectionRecords('Grade 1', true, 6, true, true);
        expect(classRecords.length).toBeGreaterThan(0);
        expect(gradingSheetRecords.length).toBe(classRecords.length);

        const hpsMap = new Map(hpsRecords.map(h => [`${h.subject_id}_q${h.quarter}`, h]));

        classRecords.forEach((cr) => {
            expect(isTestClassRecord(cr)).toBe(true);
            expect(cr.id.startsWith('test-cr-')).toBe(true);
            expect(cr.school_year).toBe('2026-2027');
            expect([1, 2, 3]).toContain(cr.quarter);
            expect(cr.is_teaching_load).toBe(true);
            expect(cr.grade_source).toBe('eclass_sync');

            // Find matching HPS
            const hps = hpsMap.get(`${cr.subject_id}_q${cr.quarter}`);
            expect(hps).toBeDefined();

            if (hps) {
                // WW scores within range
                cr.written_works.forEach((s, idx) => {
                    const score = Number(s);
                    const max = Number(hps.written_works[idx]);
                    expect(score).toBeGreaterThanOrEqual(1);
                    expect(score).toBeLessThanOrEqual(max);
                });

                // PT scores within range
                cr.performance_tasks.forEach((s, idx) => {
                    const score = Number(s);
                    const max = Number(hps.performance_tasks[idx]);
                    expect(score).toBeGreaterThanOrEqual(1);
                    expect(score).toBeLessThanOrEqual(max);
                });

                // Final grade within valid DepEd range
                const finalGrade = Number(cr.final_grade);
                expect(finalGrade).toBeGreaterThanOrEqual(75);
                expect(finalGrade).toBeLessThanOrEqual(100);
            }
        });
    });

    it('correctly identifies test class records and HPS records', () => {
        expect(isTestClassRecord({ id: 'test-cr-sec-1', student_lrn: '999000000001', section_id: 'test-sec-g1', subject_id: 'test-subj-1', school_year: '2026-2027', quarter: 1, written_works: [], performance_tasks: [], quarterly_exam: 50 })).toBe(true);
        expect(isTestClassRecord({ id: 'cr-real-1', student_lrn: '123456789012', section_id: 'sec-real-1', subject_id: 'subj-real-1', school_year: '2026-2027', quarter: 1, written_works: [], performance_tasks: [], quarterly_exam: 50 })).toBe(false);

        expect(isTestHpsRecord({ id: 'test-hps-subj-1-q1', subject_id: 'test-subj-1', section_id: 'test-sec-g1', school_year: '2026-2027', quarter: 1, written_works: [], performance_tasks: [], quarterly_exam: 50 })).toBe(true);
        expect(isTestHpsRecord({ id: 'hps-real-1', subject_id: 'subj-real-1', section_id: 'sec-real-1', school_year: '2026-2027', quarter: 1, written_works: [], performance_tasks: [], quarterly_exam: 50 })).toBe(false);
    });

    it('correctly identifies test sections with grade or custom prefixes', () => {
        expect(isTestSection({ id: 'sec-1', section_name: '11 - [TEST] Grade SSHS TechPro (Aesthetic & Human Care)', section_grade_level: 'Grade 11' } as unknown as Section)).toBe(true);
        expect(isTestSection({ id: 'sec-2', section_name: 'Grade 10 - Rizal', section_grade_level: 'Grade 10' } as unknown as Section)).toBe(false);
        expect(isTestStudent({ id: 's-1', lrn: '123456789012', student_section: '11 - [TEST] Grade SSHS' } as unknown as Student)).toBe(true);
        expect(isTestStudent({ id: 's-2', lrn: '999123456789', student_section: 'Regular Section' } as unknown as Student)).toBe(true);
        expect(isTestStudent({ id: 's-3', lrn: '123456789012', student_section: 'Regular Section' } as unknown as Student)).toBe(false);
    });

    it('buildTestHpsRecords and buildTestClassRecords function independently', () => {
        const { sections, subjects, students } = buildTestSectionRecords('Grade 7', true, 4, true, false);
        const hps = buildTestHpsRecords(sections, subjects);
        expect(hps.length).toBeGreaterThan(0);
        const { classRecords, gradingSheetRecords } = buildTestClassRecords(sections, subjects, students, hps);
        expect(classRecords.length).toBeGreaterThan(0);
        expect(gradingSheetRecords.length).toBe(classRecords.length);
    });
});

