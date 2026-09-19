import { describe, it, expect } from 'vitest';
import type { Subject } from '../types';

const normalizeSubjectLabel = (value: string) =>
    value.toLowerCase().replace(/\s+/g, ' ').replace(/\s*\([^)]*\)/g, '').trim();

describe('Subjects Section Scope & Multi-Section Handling', () => {
    const mockSections = [
        { id: 'sec-a', section_name: 'Diamond', grade_level: 'Grade 6', track: undefined },
        { id: 'sec-b', section_name: 'Emerald', grade_level: 'Grade 6', track: undefined },
        { id: 'sec-c', section_name: 'Ruby', grade_level: 'Grade 6', track: undefined },
    ];

    const mockStudents = [
        // 45 students in Section Diamond
        ...Array.from({ length: 45 }, (_, i) => ({
            lrn: `1000${i.toString().padStart(3, '0')}`,
            student_name: `Diamond Student ${i + 1}`,
            student_section: 'Diamond',
            grade_level: 'Grade 6',
        })),
        // 40 students in Section Emerald
        ...Array.from({ length: 40 }, (_, i) => ({
            lrn: `2000${i.toString().padStart(3, '0')}`,
            student_name: `Emerald Student ${i + 1}`,
            student_section: 'Emerald',
            grade_level: 'Grade 6',
        })),
        // 30 students in Section Ruby
        ...Array.from({ length: 30 }, (_, i) => ({
            lrn: `3000${i.toString().padStart(3, '0')}`,
            student_name: `Ruby Student ${i + 1}`,
            student_section: 'Ruby',
            grade_level: 'Grade 6',
        })),
    ];

    const mockSubjects: Subject[] = [
        // Grade-Wide Master Subjects (no section_id)
        {
            id: 'sub-sci-master',
            subject_name: 'Science 6',
            subject_code: 'SCI6',
            grade_level: 'Grade 6',
            section_id: undefined,
            written_weight: 40,
            performance_weight: 40,
            exam_weight: 20,
        },
        {
            id: 'sub-math-master',
            subject_name: 'Mathematics 6',
            subject_code: 'MATH6',
            grade_level: 'Grade 6',
            section_id: undefined,
            written_weight: 40,
            performance_weight: 40,
            exam_weight: 20,
        },
        // Section-specific subject: Robotics elective only for Section Diamond
        {
            id: 'sub-robotics-diamond',
            subject_name: 'Robotics & AI',
            subject_code: 'ROB6',
            grade_level: 'Grade 6',
            section_id: 'sec-a',
            written_weight: 30,
            performance_weight: 50,
            exam_weight: 20,
            enrolled_student_lrns: Array.from({ length: 25 }, (_, i) => `1000${i.toString().padStart(3, '0')}`),
        },
        // Section-specific subject: Journalism elective only for Section Emerald
        {
            id: 'sub-journalism-emerald',
            subject_name: 'Campus Journalism',
            subject_code: 'JOURN6',
            grade_level: 'Grade 6',
            section_id: 'sec-b',
            written_weight: 30,
            performance_weight: 50,
            exam_weight: 20,
        },
    ];

    describe('Filter Logic for Subjects Page Table', () => {
        const filterSubjects = (
            selectedGrade: string,
            selectedSectionId: string | null,
            subjects: Subject[]
        ) => {
            const rawList = subjects
                .filter(s => !s.is_teaching_load)
                .filter(s => {
                    if (s.grade_level !== selectedGrade) return false;
                    if (selectedSectionId && selectedSectionId !== 'all') {
                        return s.section_id === selectedSectionId || !s.section_id;
                    }
                    return true;
                });

            // Sort so that:
            // 1. If viewing a specific section: that section's subjects come first, then master subjects.
            // 2. If viewing "All Sections": master subjects come first so standard curriculum is prioritized and never duplicated.
            const sortedList = [...rawList].sort((a, b) => {
                if (selectedSectionId && selectedSectionId !== 'all') {
                    const aSec = a.section_id === selectedSectionId ? 1 : 0;
                    const bSec = b.section_id === selectedSectionId ? 1 : 0;
                    return bSec - aSec;
                }
                const aMaster = !a.section_id ? 1 : 0;
                const bMaster = !b.section_id ? 1 : 0;
                return bMaster - aMaster;
            });

            const seenNames = new Set<string>();
            const uniqueList: Subject[] = [];
            for (const s of sortedList) {
                const key = normalizeSubjectLabel(s.subject_name);
                if (key && seenNames.has(key)) continue;
                if (key) seenNames.add(key);
                uniqueList.push(s);
            }
            return uniqueList;
        };

        it('displays all grade master subjects plus all section offerings when viewing "All Sections"', () => {
            const result = filterSubjects('Grade 6', 'all', mockSubjects);
            const names = result.map(s => s.subject_name);

            expect(names).toContain('Science 6');
            expect(names).toContain('Mathematics 6');
            expect(names).toContain('Robotics & AI');
            expect(names).toContain('Campus Journalism');
            expect(result.length).toBe(4);
        });

        it('keeps grade-wide master subjects visible when viewing a specific section (e.g. Diamond)', () => {
            const result = filterSubjects('Grade 6', 'sec-a', mockSubjects);
            const names = result.map(s => s.subject_name);

            // Diamond has Science 6 (master), Math 6 (master), and Robotics (section-specific)
            expect(names).toContain('Science 6');
            expect(names).toContain('Mathematics 6');
            expect(names).toContain('Robotics & AI');
            // But NOT Journalism which belongs strictly to Emerald
            expect(names).not.toContain('Campus Journalism');
            expect(result.length).toBe(3);
        });

        it('shows only master subjects for a section without specialized electives (Ruby)', () => {
            const result = filterSubjects('Grade 6', 'sec-c', mockSubjects);
            const names = result.map(s => s.subject_name);

            expect(names).toContain('Science 6');
            expect(names).toContain('Mathematics 6');
            expect(names).not.toContain('Robotics & AI');
            expect(names).not.toContain('Campus Journalism');
            expect(result.length).toBe(2);
        });

        it('allows section-specific override to take precedence over master subject in section view', () => {
            const specializedSciDiamond: Subject = {
                id: 'sci-diamond-advanced',
                subject_name: 'Science 6',
                subject_code: 'SCI6-ADV',
                grade_level: 'Grade 6',
                section_id: 'sec-a',
                written_weight: 30,
                performance_weight: 50,
                exam_weight: 20,
            };

            const subjectsWithOverride = [...mockSubjects, specializedSciDiamond];
            const resultDiamond = filterSubjects('Grade 6', 'sec-a', subjectsWithOverride);

            const sciSubject = resultDiamond.find(s => s.subject_name === 'Science 6');
            expect(sciSubject?.id).toBe('sci-diamond-advanced');
            expect(sciSubject?.subject_code).toBe('SCI6-ADV');

            // Ruby still gets the master Science 6
            const resultRuby = filterSubjects('Grade 6', 'sec-c', subjectsWithOverride);
            const rubySci = resultRuby.find(s => s.subject_name === 'Science 6');
            expect(rubySci?.id).toBe('sub-sci-master');
            expect(rubySci?.subject_code).toBe('SCI6');
        });

        it('never duplicates subjects in All Sections view when both master and section-specific versions exist', () => {
            const specializedSciDiamond: Subject = {
                id: 'sci-diamond-advanced',
                subject_name: 'Science 6',
                subject_code: 'SCI6-ADV',
                grade_level: 'Grade 6',
                section_id: 'sec-a',
                written_weight: 20,
                performance_weight: 50,
                exam_weight: 30,
            };

            const subjectsWithBoth = [...mockSubjects, specializedSciDiamond];
            const allResult = filterSubjects('Grade 6', 'all', subjectsWithBoth);

            const sciEntries = allResult.filter(s => normalizeSubjectLabel(s.subject_name) === 'science 6');
            // Must be strictly 1 entry, never duplicated!
            expect(sciEntries.length).toBe(1);
            // In All Sections (Master) view, universal master subject is prioritized
            expect(sciEntries[0].id).toBe('sub-sci-master');
            expect(sciEntries[0].section_id).toBeUndefined();
        });
    });

    describe('Badge and Scope Indicator Formatting', () => {
        const getBadgeInfo = (subject: Subject, sections: typeof mockSections, students: typeof mockStudents) => {
            if (!subject.section_id) {
                const gradeSecs = sections.filter(s => s.grade_level === subject.grade_level);
                return {
                    type: 'master',
                    label: `Grade-Wide Master • All ${gradeSecs.length} Sections`,
                };
            }

            const sect = sections.find(s => s.id === subject.section_id || s.section_name === subject.section_id);
            const sectName = sect ? sect.section_name : subject.section_id;
            const sectStudents = students.filter(s => s.student_section === sectName || s.student_section === subject.section_id);
            const sectCount = sectStudents.length;
            const enrolledCount = subject.enrolled_student_lrns && subject.enrolled_student_lrns.length > 0
                ? subject.enrolled_student_lrns.length
                : sectCount;

            return {
                type: 'section',
                label: `Enrolled: ${enrolledCount} / ${sectCount} Learners • ${sectName}`,
                enrolledCount,
                sectCount,
                sectName,
            };
        };

        it('renders Grade-Wide Master badge with section count for master subjects', () => {
            const masterSub = mockSubjects[0]; // Science 6
            const badge = getBadgeInfo(masterSub, mockSections, mockStudents);

            expect(badge.type).toBe('master');
            expect(badge.label).toBe('Grade-Wide Master • All 3 Sections');
        });

        it('renders section-specific badge with section name and custom enrollment count', () => {
            const roboticsSub = mockSubjects[2]; // Robotics for Diamond (25 enrolled / 45 class size)
            const badge = getBadgeInfo(roboticsSub, mockSections, mockStudents);

            expect(badge.type).toBe('section');
            expect(badge.label).toBe('Enrolled: 25 / 45 Learners • Diamond');
            expect(badge.enrolledCount).toBe(25);
            expect(badge.sectCount).toBe(45);
            expect(badge.sectName).toBe('Diamond');
        });

        it('defaults to full section class size when enrolled_student_lrns is empty', () => {
            const journSub = mockSubjects[3]; // Journalism for Emerald (40 students)
            const badge = getBadgeInfo(journSub, mockSections, mockStudents);

            expect(badge.type).toBe('section');
            expect(badge.label).toBe('Enrolled: 40 / 40 Learners • Emerald');
            expect(badge.enrolledCount).toBe(40);
            expect(badge.sectCount).toBe(40);
            expect(badge.sectName).toBe('Emerald');
        });
    });

    describe('Section Filter Tab Count Formatting', () => {
        it('computes learner counts for each section tab accurately', () => {
            const getSectionLearnerCount = (sectionName: string) =>
                mockStudents.filter(s => s.student_section === sectionName).length;

            expect(getSectionLearnerCount('Diamond')).toBe(45);
            expect(getSectionLearnerCount('Emerald')).toBe(40);
            expect(getSectionLearnerCount('Ruby')).toBe(30);
        });
    });
});
