import { describe, it, expect } from 'vitest';
import { filterSubjectsForSection } from './rbac';
import { getSubjectsForGrade, normalizeSubjectName, sortSubjects } from './subjectConfig';
import type { Section, Subject, User } from '../types';

describe('Grade Management & E-Class Record Advisory Subject Integration', () => {
    const mockUser: User = {
        uid: 'user-emerson',
        email: 'galanoemerson0016@gmail.com',
        displayName: 'Emerson Galano',
        role: 'teacher'
    };

    const mockG7AdvisorySection: Section = {
        id: 'sec-g7-matatag-1',
        section_name: 'Matatag',
        section_grade_level: 'Grade 7',
        is_advisory: true,
        is_teaching_load: false,
        adviser_name: 'Emerson Galano',
        taught_subjects: ['English'], // Legacy/teaching pollution
        teaching_subjects: []
    };

    const mockG7Subjects: Subject[] = [
        { id: 'sub-eng', subject_name: 'English', grade_level: 'Grade 7', term: 'all', section_id: 'sec-g7-matatag-1' },
        { id: 'sub-math', subject_name: 'Mathematics', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-sci', subject_name: 'Science', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-fil', subject_name: 'Filipino', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-ap', subject_name: 'Araling Panlipunan', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-ve', subject_name: 'Values Education', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-tle', subject_name: 'Technology and Livelihood Education', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-ma', subject_name: 'Music and Arts', grade_level: 'Grade 7', term: 'all' },
        { id: 'sub-peh', subject_name: 'Physical Education and Health', grade_level: 'Grade 7', term: 'all' }
    ];

    it('E-Class Record: Advisory section allows access to all grade-level subjects when teaching load is not restricted', () => {
        const filtered = filterSubjectsForSection(mockUser, mockG7AdvisorySection, mockG7Subjects);
        const names = filtered.map(s => s.subject_name);

        expect(names).toHaveLength(9);
        expect(names).toContain('English');
        expect(names).toContain('Mathematics');
        expect(names).toContain('Science');
        expect(names).toContain('Filipino');
        expect(names).toContain('Araling Panlipunan');
        expect(names).toContain('Values Education');
        expect(names).toContain('Technology and Livelihood Education');
        expect(names).toContain('Music and Arts');
        expect(names).toContain('Physical Education and Health');
    });

    it('Grade Management: Full standard curriculum (8 columns including MAPEH) is rendered even if taught_subjects had only English', () => {
        // Simulate ConsolidatedGradesPage sectionSubjects resolution logic
        const sectionObj = mockG7AdvisorySection;
        const subjects = mockG7Subjects;
        const sectionGradeNum = 7;

        const intendedSubjects = getSubjectsForGrade(sectionObj.section_grade_level, 'MATATAG');

        const candidates = subjects.filter(s => {
            const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
            const isMatchingGrade = subjectGradeNum === sectionGradeNum;
            const isMatchingSection = s.section_id === sectionObj.id;
            return (isMatchingGrade || isMatchingSection) && s.term !== 'none';
        });

        // Prioritize section-specific subjects over generic ones, then deduplicate by normalized name
        candidates.sort((a, b) => {
            const aDirect = a.section_id === sectionObj.id ? 1 : 0;
            const bDirect = b.section_id === sectionObj.id ? 1 : 0;
            return bDirect - aDirect;
        });

        const seenSubjectNames = new Set<string>();
        const uniqueDbSubjects: Subject[] = [];
        for (const s of candidates) {
            const norm = normalizeSubjectName(s.subject_name);
            if (norm && seenSubjectNames.has(norm)) continue;
            if (norm) seenSubjectNames.add(norm);
            uniqueDbSubjects.push(s);
        }

        const matchedNorms = new Set<string>();
        const baseList: (Subject & { is_virtual?: boolean; _mapehGroups?: unknown })[] = [];

        for (const s of uniqueDbSubjects) {
            const norm = normalizeSubjectName(s.subject_name);
            if (norm) matchedNorms.add(norm);
            baseList.push({ ...s, is_virtual: false });
        }

        // Merge any missing intended curriculum subjects (excluding Specialization)
        const relevantIntended = intendedSubjects.filter(intended => {
            if (normalizeSubjectName(intended.name) === 'specialization') return false;
            return true;
        });

        for (const intended of relevantIntended) {
            const norm = normalizeSubjectName(intended.name);
            let alreadyCovered = matchedNorms.has(norm);
            if (!alreadyCovered) {
                for (const m of matchedNorms) {
                    if (m === norm || m.includes(norm) || norm.includes(m)) {
                        alreadyCovered = true;
                        break;
                    }
                }
            }
            if (!alreadyCovered) {
                matchedNorms.add(norm);
                baseList.push({
                    id: `virtual-${norm}-${sectionObj.id}`,
                    subject_name: intended.name,
                    section_id: sectionObj.id,
                    grade_level: sectionObj.section_grade_level,
                    is_virtual: true
                });
            }
        }

        // Add MAPEH header if components exist
        const hasMapehHeader = baseList.some(s => normalizeSubjectName(s.subject_name) === 'mapeh');
        const hasMapehComponents = baseList.some(s => {
            const n = normalizeSubjectName(s.subject_name);
            return n.includes('musicandarts') || n.includes('musicarts') || 
                   n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth');
        });

        if (hasMapehComponents && !hasMapehHeader) {
            baseList.push({
                id: `virtual-mapeh-${sectionObj.id}`,
                subject_name: 'MAPEH',
                section_id: sectionObj.id,
                grade_level: sectionObj.section_grade_level,
                is_virtual: true
            });
        }

        const isMusicArts = (name: string) => {
            const n = normalizeSubjectName(name);
            return n.includes('musicandarts') || n.includes('musicarts') || (n.includes('music') && n.includes('arts')) || n === 'music' || n === 'arts';
        };
        const isPeHealth = (name: string) => {
            const n = normalizeSubjectName(name);
            return n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth') || n === 'pe' || n === 'health';
        };

        const withGroupData = baseList.map(base => {
            const norm = normalizeSubjectName(base.subject_name);
            if (norm === 'mapeh') {
                return {
                    ...base,
                    _mapehGroups: {
                        musicArts: uniqueDbSubjects.filter(s => isMusicArts(s.subject_name)),
                        peHealth: uniqueDbSubjects.filter(s => isPeHealth(s.subject_name))
                    }
                };
            }
            return base;
        });

        const sorted = sortSubjects(withGroupData, s => s.subject_name);
        const finalColumns = sorted.filter(sub => {
            const norm = normalizeSubjectName(sub.subject_name);
            const isComp = isMusicArts(sub.subject_name) || isPeHealth(sub.subject_name);
            return (!isComp || norm === 'mapeh');
        });

        const columnNames = finalColumns.map(c => c.subject_name);

        // Grade 7 must have all 8 standard learning areas and strictly NO Specialization
        expect(columnNames).toContain('English');
        expect(columnNames).toContain('Mathematics');
        expect(columnNames).toContain('Science');
        expect(columnNames).toContain('Filipino');
        expect(columnNames).toContain('Araling Panlipunan');
        expect(columnNames).toContain('Values Education');
        expect(columnNames).toContain('Technology and Livelihood Education');
        expect(columnNames).toContain('MAPEH');
        expect(columnNames).not.toContain('Specialization');
        expect(finalColumns.length).toBe(8);
    });
});
