/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import type { Section, Subject } from '../types';

describe('Grading Improvements Workflow (Options A, B, and D)', () => {

    describe('Option A: Missing Grades Summary & Detection Logic', () => {
        // Mirrors missingGradesSummary calculation in ConsolidatedGradesPage.tsx
        function calculateMissingGrades(
            students: { lrn: string; name: string }[],
            subjects: { id: string; subject_name: string; _mapehGroups?: boolean; _ecmkGroups?: boolean }[],
            gradesData: Record<string, any>,
            selectedTerm: 'q1' | 'q2' | 'q3' | 'all'
        ) {
            if (!students.length || !subjects.length) {
                return { totalMissing: 0, bySubject: [] };
            }

            const bySubjectMap = new Map<string, { name: string; count: number }>();
            subjects.forEach(s => {
                bySubjectMap.set(s.id, { name: s.subject_name, count: 0 });
            });

            let total = 0;

            students.forEach(student => {
                const studentGrades = gradesData[student.lrn] || {};

                subjects.forEach(subject => {
                    const sData = studentGrades[subject.id] || {};

                    if (selectedTerm !== 'all') {
                        const qKey = selectedTerm;
                        if (subject._mapehGroups) {
                            const detail = sData[qKey];
                            const maVal = detail?.musicArts;
                            const phVal = detail?.peHealth;
                            let missingInMapeh = 0;
                            if (!maVal && maVal !== 0) missingInMapeh++;
                            if (!phVal && phVal !== 0) missingInMapeh++;
                            if (missingInMapeh > 0) {
                                total += missingInMapeh;
                                const curr = bySubjectMap.get(subject.id);
                                if (curr) curr.count += missingInMapeh;
                            }
                        } else if (subject._ecmkGroups) {
                            const detail = sData[qKey];
                            const ecVal = detail?.effectiveComm;
                            const mkVal = detail?.mabisangKom;
                            let missingInEcmk = 0;
                            if (!ecVal && ecVal !== 0) missingInEcmk++;
                            if (!mkVal && mkVal !== 0) missingInEcmk++;
                            if (missingInEcmk > 0) {
                                total += missingInEcmk;
                                const curr = bySubjectMap.get(subject.id);
                                if (curr) curr.count += missingInEcmk;
                            }
                        } else {
                            const val = typeof sData[qKey] === 'object' ? sData[qKey]?.value : sData[qKey];
                            if (!val && val !== 0) {
                                total++;
                                const curr = bySubjectMap.get(subject.id);
                                if (curr) curr.count++;
                            }
                        }
                    } else {
                        const quarters = ['q1', 'q2', 'q3'];
                        quarters.forEach(qKey => {
                            const val = typeof sData[qKey] === 'object' ? sData[qKey]?.value : sData[qKey];
                            if (!val && val !== 0) {
                                total++;
                                const curr = bySubjectMap.get(subject.id);
                                if (curr) curr.count++;
                            }
                        });
                    }
                });
            });

            const bySubject = Array.from(bySubjectMap.entries())
                .map(([id, info]) => ({ subjectId: id, subjectName: info.name, missingCount: info.count }))
                .filter(item => item.missingCount > 0)
                .sort((a, b) => b.missingCount - a.missingCount);

            return { totalMissing: total, bySubject };
        }

        it('correctly counts missing grades per subject and overall for a quarter', () => {
            const students = [
                { lrn: '1001', name: 'Alvarez, Juan' },
                { lrn: '1002', name: 'Bernardo, Maria' },
                { lrn: '1003', name: 'Cruz, Pedro' }
            ];

            const subjects = [
                { id: 'subj-sci', subject_name: 'Science' },
                { id: 'subj-math', subject_name: 'Mathematics' },
                { id: 'subj-eng', subject_name: 'English' }
            ];

            // Alvarez: all filled (88, 90, 85)
            // Bernardo: missing math
            // Cruz: missing science and english
            const gradesData = {
                '1001': {
                    'subj-sci': { q1: 88 },
                    'subj-math': { q1: 90 },
                    'subj-eng': { q1: 85 }
                },
                '1002': {
                    'subj-sci': { q1: 89 },
                    'subj-math': { q1: null },
                    'subj-eng': { q1: 92 }
                },
                '1003': {
                    'subj-sci': { q1: undefined },
                    'subj-math': { q1: 84 },
                    'subj-eng': { q1: '' }
                }
            };

            const summary = calculateMissingGrades(students, subjects, gradesData, 'q1');

            expect(summary.totalMissing).toBe(3);
            expect(summary.bySubject).toHaveLength(3);
            expect(summary.bySubject.map(s => s.subjectName).sort()).toEqual(['English', 'Mathematics', 'Science']);
        });

        it('reports 0 missing when all grades are present', () => {
            const students = [{ lrn: '1001', name: 'Alvarez, Juan' }];
            const subjects = [{ id: 'subj-sci', subject_name: 'Science' }];
            const gradesData = {
                '1001': {
                    'subj-sci': { q1: 85 }
                }
            };

            const summary = calculateMissingGrades(students, subjects, gradesData, 'q1');
            expect(summary.totalMissing).toBe(0);
            expect(summary.bySubject).toHaveLength(0);
        });

        it('handles composite MAPEH sub-components (Music/Arts and PE/Health)', () => {
            const students = [{ lrn: '1001', name: 'Alvarez, Juan' }];
            const subjects = [{ id: 'subj-mapeh', subject_name: 'MAPEH', _mapehGroups: true }];
            const gradesData = {
                '1001': {
                    'subj-mapeh': {
                        q1: { musicArts: 85, peHealth: null } // PE & Health is missing
                    }
                }
            };

            const summary = calculateMissingGrades(students, subjects, gradesData, 'q1');
            expect(summary.totalMissing).toBe(1);
            expect(summary.bySubject[0].subjectName).toBe('MAPEH');
        });
    });

    describe('Option B: Advisory Without Teaching Load Detection', () => {
        function checkAdvisoryWithoutTeachingLoad(
            selectedSection: string,
            selectedSectionObj: Section | undefined,
            filteredSubjects: Subject[]
        ): boolean {
            return Boolean(selectedSection && selectedSectionObj?.is_advisory && filteredSubjects.length === 0);
        }

        it('returns true when user is adviser but has no teaching subjects configured', () => {
            const advisorySection: Section = {
                id: 'sec-7a',
                section_name: 'Grade 7 - Diamond',
                section_grade_level: 'Grade 7',
                is_advisory: true,
                teaching_subjects: []
            };

            const isAdvisoryOnly = checkAdvisoryWithoutTeachingLoad(
                'Grade 7 - Diamond',
                advisorySection,
                [] // No personal subjects taught in E-Class Record
            );

            expect(isAdvisoryOnly).toBe(true);
        });

        it('returns false when user is adviser AND teaches subjects in that class', () => {
            const advisoryWithTeaching: Section = {
                id: 'sec-7a',
                section_name: 'Grade 7 - Diamond',
                section_grade_level: 'Grade 7',
                is_advisory: true,
                teaching_subjects: ['Science']
            };

            const isAdvisoryOnly = checkAdvisoryWithoutTeachingLoad(
                'Grade 7 - Diamond',
                advisoryWithTeaching,
                [{ id: 'sub-sci', subject_name: 'Science', grade_level: 'Grade 7' }]
            );

            expect(isAdvisoryOnly).toBe(false);
        });

        it('returns false when section is not an advisory section', () => {
            const pureTeachingSection: Section = {
                id: 'sec-8b',
                section_name: 'Grade 8 - Emerald',
                section_grade_level: 'Grade 8',
                is_advisory: false,
                teaching_subjects: []
            };

            const isAdvisoryOnly = checkAdvisoryWithoutTeachingLoad(
                'Grade 8 - Emerald',
                pureTeachingSection,
                []
            );

            expect(isAdvisoryOnly).toBe(false);
        });
    });

    describe('Option D: Teaching Load Matrix Logic', () => {
        const initialSections: Section[] = [
            {
                id: 'sec-1',
                section_name: 'Grade 7 - Diamond',
                section_grade_level: 'Grade 7',
                is_advisory: true,
                teaching_subjects: ['Science']
            },
            {
                id: 'sec-2',
                section_name: 'Grade 7 - Ruby',
                section_grade_level: 'Grade 7',
                is_advisory: false,
                teaching_subjects: []
            }
        ];

        it('detects modified sections when draft assignments change', () => {
            const draft: Record<string, string[]> = {
                'sec-1': ['Science'], // Unchanged
                'sec-2': ['Science', 'Mathematics'] // Modified
            };

            const modified = initialSections.filter(sec => {
                const original = (sec.teaching_subjects || []).slice().sort();
                const current = (draft[sec.id] || []).slice().sort();
                return original.length !== current.length || original.some((val, idx) => val !== current[idx]);
            }).map(s => s.id);

            expect(modified).toEqual(['sec-2']);
        });

        it('computes is_teaching_load dynamically based on assigned subjects', () => {
            const testCases = [
                { subjects: ['Science'], isAdvisory: true, expectedTeachingLoad: true },
                { subjects: [], isAdvisory: true, expectedTeachingLoad: false },
                { subjects: ['Math'], isAdvisory: false, expectedTeachingLoad: true }
            ];

            testCases.forEach(({ subjects, isAdvisory, expectedTeachingLoad }) => {
                const isTeaching = subjects.length > 0;
                const resultTeachingLoad = isAdvisory ? isTeaching : true;
                expect(resultTeachingLoad).toBe(expectedTeachingLoad);
            });
        });

        it('allows column-wide subject toggling across multiple sections', () => {
            const draft: Record<string, string[]> = {
                'sec-1': ['English'],
                'sec-2': []
            };
            const subjectToToggle = 'Science';

            // Simulate setting subject across all sections
            Object.keys(draft).forEach(secId => {
                if (!draft[secId].includes(subjectToToggle)) {
                    draft[secId] = [...draft[secId], subjectToToggle];
                }
            });

            expect(draft['sec-1']).toEqual(['English', 'Science']);
            expect(draft['sec-2']).toEqual(['Science']);
        });
    });
});
