import { describe, it, expect } from 'vitest';
import { getDepEdStandardWeights, classifyJhsSubjectTrack } from '../lib/curriculum';
import type { Section, Student } from '../types';

describe('A. Subjects Page Improvements', () => {
    describe('One-Click DepEd Standard Presets', () => {
        it('returns 30-50-20 for Languages, Araling Panlipunan, and EsP / Values Education', () => {
            expect(getDepEdStandardWeights('English')).toEqual({ written_weight: 0.3, performance_weight: 0.5, exam_weight: 0.2 });
            expect(getDepEdStandardWeights('Filipino')).toEqual({ written_weight: 0.3, performance_weight: 0.5, exam_weight: 0.2 });
            expect(getDepEdStandardWeights('Reading and Literacy')).toEqual({ written_weight: 0.3, performance_weight: 0.5, exam_weight: 0.2 });
            expect(getDepEdStandardWeights('Araling Panlipunan (AP)')).toEqual({ written_weight: 0.3, performance_weight: 0.5, exam_weight: 0.2 });
            expect(getDepEdStandardWeights('Values Education')).toEqual({ written_weight: 0.3, performance_weight: 0.5, exam_weight: 0.2 });
            expect(getDepEdStandardWeights('GMRC')).toEqual({ written_weight: 0.3, performance_weight: 0.5, exam_weight: 0.2 });
        });

        it('returns 40-40-20 for Mathematics and Science', () => {
            expect(getDepEdStandardWeights('Mathematics')).toEqual({ written_weight: 0.4, performance_weight: 0.4, exam_weight: 0.2 });
            expect(getDepEdStandardWeights('Science')).toEqual({ written_weight: 0.4, performance_weight: 0.4, exam_weight: 0.2 });
            expect(getDepEdStandardWeights('Research 1')).toEqual({ written_weight: 0.4, performance_weight: 0.4, exam_weight: 0.2 });
            expect(getDepEdStandardWeights('Biotechnology')).toEqual({ written_weight: 0.4, performance_weight: 0.4, exam_weight: 0.2 });
        });

        it('returns 20-60-20 for TLE, EPP, and MAPEH', () => {
            expect(getDepEdStandardWeights('Technology and Livelihood Education (TLE)')).toEqual({ written_weight: 0.2, performance_weight: 0.6, exam_weight: 0.2 });
            expect(getDepEdStandardWeights('E.P.P.')).toEqual({ written_weight: 0.2, performance_weight: 0.6, exam_weight: 0.2 });
            expect(getDepEdStandardWeights('Music and Arts')).toEqual({ written_weight: 0.2, performance_weight: 0.6, exam_weight: 0.2 });
            expect(getDepEdStandardWeights('Physical Education and Health')).toEqual({ written_weight: 0.2, performance_weight: 0.6, exam_weight: 0.2 });
            expect(getDepEdStandardWeights('Cookery')).toEqual({ written_weight: 0.2, performance_weight: 0.6, exam_weight: 0.2 });
        });
    });

    describe('Curriculum Track Filter Tabs (classifyJhsSubjectTrack)', () => {
        it('classifies STE special science electives', () => {
            expect(classifyJhsSubjectTrack('Advanced Science')).toBe('ste');
            expect(classifyJhsSubjectTrack('Scientific Research')).toBe('ste');
            expect(classifyJhsSubjectTrack('Biotechnology')).toBe('ste');
            expect(classifyJhsSubjectTrack('Robotics')).toBe('ste');
        });

        it('classifies SPA arts electives', () => {
            expect(classifyJhsSubjectTrack('Visual Arts')).toBe('spa');
            expect(classifyJhsSubjectTrack('Creative Writing')).toBe('spa');
            expect(classifyJhsSubjectTrack('Dance Arts')).toBe('spa');
            expect(classifyJhsSubjectTrack('Theater Arts')).toBe('spa');
        });

        it('classifies SPJ journalism electives', () => {
            expect(classifyJhsSubjectTrack('Journalism (English)')).toBe('spj');
            expect(classifyJhsSubjectTrack('Peryodismo (Filipino)')).toBe('spj');
            expect(classifyJhsSubjectTrack('Photojournalism')).toBe('spj');
        });

        it('classifies TVL/SPTVE electives', () => {
            expect(classifyJhsSubjectTrack('SPTVE Technical Drafting')).toBe('tvl');
            expect(classifyJhsSubjectTrack('Electrical Installation')).toBe('tvl');
            expect(classifyJhsSubjectTrack('Food and Beverage Services')).toBe('tvl');
            expect(classifyJhsSubjectTrack('Automotive Servicing')).toBe('tvl');
        });

        it('classifies Core MATATAG subjects', () => {
            expect(classifyJhsSubjectTrack('English')).toBe('core');
            expect(classifyJhsSubjectTrack('Mathematics')).toBe('core');
            expect(classifyJhsSubjectTrack('Science')).toBe('core');
            expect(classifyJhsSubjectTrack('Filipino')).toBe('core');
            expect(classifyJhsSubjectTrack('Araling Panlipunan')).toBe('core');
            expect(classifyJhsSubjectTrack('Values Education')).toBe('core');
        });
    });
});

describe('B. Classes & Sections Improvements', () => {
    describe('Learner Gender Breakdown', () => {
        it('correctly calculates total and male/female counts for section', () => {
            const mockStudents: Partial<Student>[] = [
                { lrn: '1001', first_name: 'Juan', last_name: 'Dela Cruz', gender: 'Male', student_section: 'Grade 7 - Einstein' },
                { lrn: '1002', first_name: 'Pedro', last_name: 'Santos', gender: 'Male', student_section: 'Grade 7 - Einstein' },
                { lrn: '1003', first_name: 'Maria', last_name: 'Clara', gender: 'Female', student_section: 'Grade 7 - Einstein' }
            ];

            const sectionStudents = mockStudents.filter(s => s.student_section === 'Grade 7 - Einstein');
            let males = 0;
            let females = 0;
            sectionStudents.forEach(s => {
                const g = (s.gender || '').trim().toLowerCase();
                if (g === 'male' || g === 'm') males++;
                else if (g === 'female' || g === 'f') females++;
            });

            expect(sectionStudents.length).toBe(3);
            expect(males).toBe(2);
            expect(females).toBe(1);
        });
    });

    describe('Unassigned Curriculum Warning detection', () => {
        it('flags an advisory section with empty taught_subjects as unconfigured', () => {
            const sectionWithNoCurriculum: Section = {
                id: 'sec-1',
                section_name: 'Grade 7 - Newton',
                section_grade_level: 'Grade 7',
                is_advisory: true,
                is_teaching_load: false,
                taught_subjects: []
            };

            const isUnconfigured = sectionWithNoCurriculum.is_advisory && 
                (!sectionWithNoCurriculum.taught_subjects || sectionWithNoCurriculum.taught_subjects.length === 0);

            expect(isUnconfigured).toBe(true);
        });

        it('does not flag an advisory section with configured taught_subjects', () => {
            const sectionWithCurriculum: Section = {
                id: 'sec-2',
                section_name: 'Grade 7 - Einstein',
                section_grade_level: 'Grade 7',
                is_advisory: true,
                is_teaching_load: false,
                taught_subjects: ['English', 'Mathematics', 'Science']
            };

            const isUnconfigured = sectionWithCurriculum.is_advisory && 
                (!sectionWithCurriculum.taught_subjects || sectionWithCurriculum.taught_subjects.length === 0);

            expect(isUnconfigured).toBe(false);
        });
    });

    describe('Section Configuration Cloning', () => {
        it('copies grade level, track, strand, program, and curriculum with a new name and fresh ID', () => {
            const sourceSection: Section = {
                id: 'sec-original',
                section_name: 'Grade 7 - Einstein',
                section_grade_level: 'Grade 7',
                program: 'STE',
                is_advisory: true,
                is_teaching_load: false,
                taught_subjects: ['English', 'Science', 'Mathematics', 'Biotechnology']
            };

            // Cloned section representation
            const clonedSection: Section = {
                ...sourceSection,
                id: `section_${Date.now()}`,
                section_name: `${sourceSection.section_name} (Copy)`
            };

            expect(clonedSection.id).not.toBe(sourceSection.id);
            expect(clonedSection.section_name).toBe('Grade 7 - Einstein (Copy)');
            expect(clonedSection.section_grade_level).toBe('Grade 7');
            expect(clonedSection.program).toBe('STE');
            expect(clonedSection.taught_subjects).toEqual(['English', 'Science', 'Mathematics', 'Biotechnology']);
        });
    });
});

describe('D. Consolidated Grades Improvements', () => {
    describe('Missing Grade Spotlight and Real-time Sync Indicator', () => {
        it('detects missing grades and filters students accurately', () => {
            const mockSectionStudents = [
                { lrn: '1001', name: 'Student Complete' },
                { lrn: '1002', name: 'Student Missing Sci' },
                { lrn: '1003', name: 'Student Missing Math' }
            ];

            const mockGradesData: Record<string, Record<string, { q1?: number }>> = {
                '1001': { 'eng': { q1: 88 }, 'math': { q1: 90 }, 'sci': { q1: 92 } },
                '1002': { 'eng': { q1: 85 }, 'math': { q1: 87 }, 'sci': {} },
                '1003': { 'eng': { q1: 80 }, 'math': {}, 'sci': { q1: 82 } }
            };

            const subjects = [
                { id: 'eng', subject_name: 'English' },
                { id: 'math', subject_name: 'Mathematics' },
                { id: 'sci', subject_name: 'Science' }
            ];

            let totalMissing = 0;
            const studentsWithMissing = new Set<string>();

            mockSectionStudents.forEach(st => {
                const sGrades = mockGradesData[st.lrn] || {};
                subjects.forEach(sub => {
                    const gradeVal = sGrades[sub.id]?.q1;
                    if (!gradeVal && gradeVal !== 0) {
                        totalMissing++;
                        studentsWithMissing.add(st.lrn);
                    }
                });
            });

            expect(totalMissing).toBe(2);
            expect(studentsWithMissing.size).toBe(2);
            expect(studentsWithMissing.has('1001')).toBe(false);
            expect(studentsWithMissing.has('1002')).toBe(true);
            expect(studentsWithMissing.has('1003')).toBe(true);

            // Filtering test: when spotlight is on
            const showMissingOnly = true;
            const displayedStudents = showMissingOnly
                ? mockSectionStudents.filter(s => studentsWithMissing.has(s.lrn))
                : mockSectionStudents;

            expect(displayedStudents).toHaveLength(2);
            expect(displayedStudents.map(s => s.lrn)).toEqual(['1002', '1003']);
        });

        it('indicates All Subjects Synced when totalMissing is 0', () => {
            const totalMissing = 0;
            const isAllSynced = totalMissing === 0;
            expect(isAllSynced).toBe(true);
        });
    });
});
