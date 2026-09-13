import { describe, it, expect } from 'vitest';
import { getSubjectsForGrade, normalizeSubjectName, getCanonicalSubjectKey } from '../lib/subjectConfig';
import { getDefaultTermForSubject, getCurriculumTemplatesForSection, isGrade11CoreSubject } from '../lib/curriculum';
import { isMatchingSubject, isSameSubject, extractSubjectSequence, normalizeGrade12PESubjectName } from '../utils/grading-helpers';
import type { Subject, Section } from '../types';

describe('Grade 11 Subject & Term Resolution in Grade Management', () => {
    // Helper replicating ConsolidatedGradesPage sectionSubjects useMemo exactly
    function resolveSectionSubjects(params: {
        sectionObj: Section;
        subjects: Subject[];
        selectedTerm: 'q1' | 'q2' | 'q3' | 'all';
    }) {
        const { sectionObj, subjects, selectedTerm } = params;

        const isSHS = sectionObj.section_grade_level.includes('11') || sectionObj.section_grade_level.includes('12');

        const hiddenList = sectionObj.section_metadata?.hiddenConsolidatedSubjects || [];
        const isSubjectHidden = (subName: string, subId?: string): boolean => {
            if (!hiddenList || hiddenList.length === 0 || !subName) return false;
            const normSub = normalizeSubjectName(subName);
            const canonSub = getCanonicalSubjectKey(subName, sectionObj.section_grade_level);

            for (const h of hiddenList) {
                if (!h) continue;
                if (h.toLowerCase().trim() === subName.toLowerCase().trim()) return true;
                const normH = normalizeSubjectName(h);
                if (normH && normH === normSub) return true;
                const canonH = getCanonicalSubjectKey(h, sectionObj.section_grade_level);
                if (canonH && (canonH === canonSub || canonH === normSub || normH === canonSub)) return true;
                if (isSameSubject(subId, subName, undefined, h)) return true;
                if (isMatchingSubject(h, subId, subName)) return true;
            }
            return false;
        };

        const standardTemplates = getSubjectsForGrade(sectionObj.section_grade_level);
        const programTemplates = getCurriculumTemplatesForSection(
            sectionObj.section_grade_level,
            sectionObj.program,
            sectionObj.spa_majors
        );
        const intendedSubjects = [
            ...standardTemplates,
            ...programTemplates.filter(pt => !standardTemplates.some(st => normalizeSubjectName(st.name) === normalizeSubjectName(pt.name)))
        ];

        const sectionGradeNum = parseInt(sectionObj.section_grade_level.replace(/\D/g, '')) || 0;

        const getEffectiveTerm = (s: Subject | { subject_name: string; grade_level?: string; term?: string | number | null; id?: string }): 1 | 2 | 3 | 'all' | 'none' => {
            const sectionTermOverride = (sectionObj?.section_metadata as Record<string, unknown> | undefined)?.subjectTerms as Record<string, 1 | 2 | 3 | 'all' | 'none'> | undefined;
            if (sectionTermOverride) {
                if (sectionTermOverride[s.subject_name] !== undefined) {
                    return sectionTermOverride[s.subject_name];
                }
                const normName = normalizeSubjectName(s.subject_name);
                for (const [key, val] of Object.entries(sectionTermOverride)) {
                    if (normalizeSubjectName(key) === normName || isMatchingSubject(key, (s as Subject).id, s.subject_name)) {
                        return val;
                    }
                }
            }
            if (sectionGradeNum === 11) {
                if (isGrade11CoreSubject(s.subject_name)) {
                    return 'all';
                }
                if (s.term === 1 || s.term === 2 || s.term === 3 || s.term === '1' || s.term === '2' || s.term === '3') {
                    return Number(s.term) as 1 | 2 | 3;
                }
                return getDefaultTermForSubject(s.subject_name, 11);
            }
            if (s.term !== undefined && s.term !== null && s.term !== 'none') {
                if (s.term === 1 || s.term === 2 || s.term === 3) return s.term;
                if (s.term === 'all') return 'all';
                if (s.term === '1' || s.term === '2' || s.term === '3') return Number(s.term) as 1 | 2 | 3;
            }
            return getDefaultTermForSubject(s.subject_name, (s as Subject).grade_level || sectionObj.section_grade_level);
        };

        const taughtRaw = (sectionObj.taught_subjects || []).filter(t => !isSubjectHidden(t));

        let candidates = subjects.filter(s => {
            if (normalizeSubjectName(s.subject_name) === 'specialization') return false;
            if (isSubjectHidden(s.subject_name, s.id)) return false;

            const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
            const isMatchingGrade = subjectGradeNum === sectionGradeNum;
            const isMatchingSection = s.section_id === sectionObj.id;
            if (!isMatchingGrade && !isMatchingSection) return false;

            const effTerm = getEffectiveTerm(s);
            if (effTerm === 'none') {
                const isExplicitlyTaught = taughtRaw.some(t => isMatchingSubject(t, s.id, s.subject_name));
                const isDirectOrSpecial = s.section_id === sectionObj.id || s.is_special_program || Boolean(s.program_type);
                return isExplicitlyTaught || isDirectOrSpecial;
            }
            return true;
        });

        const isSpecialOrImported = (s: Subject) => {
            if (isSubjectHidden(s.subject_name, s.id)) return false;
            if (s.section_id === sectionObj.id) return true;
            return false;
        };

        if (isSHS) {
            if (taughtRaw.length > 0) {
                for (const tName of taughtRaw) {
                    if (isSubjectHidden(tName)) continue;
                    const alreadyHas = candidates.some(s => isMatchingSubject(tName, s.id, s.subject_name));
                    if (!alreadyHas) {
                        candidates.push({
                            id: `virtual_${tName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                            subject_name: tName,
                            subject_code: '',
                            grade_level: sectionObj.section_grade_level,
                            section_id: sectionObj.id,
                            term: getEffectiveTerm({ subject_name: tName, grade_level: sectionObj.section_grade_level })
                        });
                    }
                }

                candidates = candidates.filter(s => {
                    return taughtRaw.some(t => isMatchingSubject(t, s.id, s.subject_name)) || isSpecialOrImported(s);
                });

                const isExplicitSSHS = (sectionObj.track || '').toLowerCase().includes('sshs') || (sectionObj.track || '').toLowerCase().includes('cluster');
                candidates = candidates.map(s => {
                    const matchedTaught = taughtRaw.find(t => isMatchingSubject(t, s.id, s.subject_name));
                    let name = matchedTaught || s.subject_name;
                    if (sectionGradeNum === 12 && !isExplicitSSHS) {
                        name = normalizeGrade12PESubjectName(name, false);
                    }
                    if (name !== s.subject_name) {
                        return { ...s, subject_name: name };
                    }
                    return s;
                });
            }
        }

        let sectionDbSubjects = candidates.filter(s => !isSubjectHidden(s.subject_name, s.id));

        if (selectedTerm !== 'all') {
            const termNum = selectedTerm === 'q1' ? 1 : selectedTerm === 'q2' ? 2 : selectedTerm === 'q3' ? 3 : null;
            if (termNum !== null) {
                sectionDbSubjects = sectionDbSubjects.filter(s => {
                    const effTerm = getEffectiveTerm(s);
                    if (!isSHS) return true;
                    if (sectionGradeNum === 11 && (effTerm === 'all' || isGrade11CoreSubject(s.subject_name))) return true;
                    return Number(effTerm) === termNum;
                });
            }
        }

        const seenSubjectNames = new Set<string>();
        const uniqueDbSubjects: Subject[] = [];
        for (const s of sectionDbSubjects) {
            const norm = normalizeSubjectName(s.subject_name);
            if (norm && seenSubjectNames.has(norm)) continue;
            if (norm) seenSubjectNames.add(norm);
            uniqueDbSubjects.push(s);
        }
        sectionDbSubjects = uniqueDbSubjects;

        const matchedNorms = new Set<string>();
        const baseList: Subject[] = [];
        for (const s of sectionDbSubjects) {
            const norm = normalizeSubjectName(s.subject_name);
            if (norm) matchedNorms.add(norm);
            baseList.push(s);
        }

        // Merge any missing intended curriculum subjects
        const relevantIntended = intendedSubjects.filter(intended => {
            if (normalizeSubjectName(intended.name) === 'specialization') return false;
            if (isSubjectHidden(intended.name)) return false;

            // Strict Section Isolation: Never auto-inject unselected electives!
            if (isSHS) {
                const isG11Core = sectionGradeNum === 11 ? isGrade11CoreSubject(intended.name) : false;
                const isTaught = taughtRaw.length > 0 && taughtRaw.some(t => isMatchingSubject(t, '', intended.name));
                if (!isG11Core && !isTaught) {
                    return false;
                }
            } else if (taughtRaw.length > 1) {
                const isAllowed = taughtRaw.some(t => isMatchingSubject(t, '', intended.name));
                if (!isAllowed) return false;
            }

            const defaultTerm = getDefaultTermForSubject(intended.name, sectionObj.section_grade_level);
            if (defaultTerm === 'none') return false;

            if (selectedTerm !== 'all') {
                const termNum = selectedTerm === 'q1' ? 1 : selectedTerm === 'q2' ? 2 : selectedTerm === 'q3' ? 3 : null;
                if (termNum !== null) {
                    if (!isSHS) return true;
                    if (sectionGradeNum === 11 && (defaultTerm === 'all' || isGrade11CoreSubject(intended.name))) return true;
                    return Number(defaultTerm) === termNum;
                }
            }
            return true;
        });

        for (const intended of relevantIntended) {
            const norm = normalizeSubjectName(intended.name);
            if (isSubjectHidden(intended.name)) continue;
            let alreadyCovered = matchedNorms.has(norm);
            if (!alreadyCovered) {
                const seqNorm = extractSubjectSequence(norm);
                for (const m of matchedNorms) {
                    const seqM = extractSubjectSequence(m);
                    if (seqNorm && seqM && seqNorm !== seqM) continue;
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
                    term: getEffectiveTerm({ subject_name: intended.name, grade_level: sectionObj.section_grade_level })
                });
            }
        }

        return baseList;
    }

    it('extracts sequence numbers reliably without confusion from grades, NC, or century terms', () => {
        expect(extractSubjectSequence('Chemistry 1')).toBe('1');
        expect(extractSubjectSequence('Chemistry 2')).toBe('2');
        expect(extractSubjectSequence('General Chemistry 1')).toBe('1');
        expect(extractSubjectSequence('General Chemistry 2')).toBe('2');
        expect(extractSubjectSequence('Creative Industries I - Visual Arts')).toBe('1');
        expect(extractSubjectSequence('Creative Industries II - Performing Arts')).toBe('2');
        expect(extractSubjectSequence('Practical Research 1')).toBe('1');
        expect(extractSubjectSequence('Practical Research 2')).toBe('2');
        expect(extractSubjectSequence('HOPE 1')).toBe('1');
        expect(extractSubjectSequence('HOPE 4')).toBe('4');
        expect(extractSubjectSequence('Grade 11')).toBeNull();
        expect(extractSubjectSequence('G11')).toBeNull();
        expect(extractSubjectSequence('General Mathematics')).toBeNull();
        expect(extractSubjectSequence('Computer Programming (Java) ( NC III )')).toBeNull();
        expect(extractSubjectSequence('21st Century Literature')).toBeNull();
    });

    it('prevents false matches between sequential subjects in isMatchingSubject', () => {
        // Different sequences must NEVER match
        expect(isMatchingSubject('Chemistry 1', undefined, 'Chemistry 2')).toBe(false);
        expect(isMatchingSubject('Chemistry 2', undefined, 'Chemistry 1')).toBe(false);
        expect(isMatchingSubject('General Chemistry 1', undefined, 'General Chemistry 2')).toBe(false);
        expect(isMatchingSubject('Practical Research 1', undefined, 'Practical Research 2')).toBe(false);
        expect(isMatchingSubject('HOPE 1', undefined, 'HOPE 2')).toBe(false);

        // Same sequences DO match
        expect(isMatchingSubject('Chemistry 1', undefined, 'Chemistry 1')).toBe(true);
        expect(isMatchingSubject('Chemistry 2', undefined, 'Chemistry 2')).toBe(true);
        expect(isMatchingSubject('General Chemistry 1', undefined, 'Chemistry 1')).toBe(true);
        expect(isMatchingSubject('General Chemistry 2', undefined, 'Chemistry 2')).toBe(true);
    });

    it('getDefaultTermForSubject correctly assigns terms for Grade 11', () => {
        expect(getDefaultTermForSubject('General Mathematics', 11)).toBe('all');
        expect(getDefaultTermForSubject('General Science', 11)).toBe('all');
        expect(getDefaultTermForSubject('Effective Communication', 11)).toBe('all');
        expect(getDefaultTermForSubject('Chemistry 1', 11)).toBe(1);
        expect(getDefaultTermForSubject('Chemistry 2', 11)).toBe(2);
        expect(getDefaultTermForSubject('Pre-Calculus', 11)).toBe(1);
        expect(getDefaultTermForSubject('Basic Calculus', 11)).toBe(2);
        expect(getDefaultTermForSubject('Philippine Politics and Governance', 11)).toBe('none');
    });

    it('guarantees ONLY Core subjects and selected electives appear (NO unselected electives injected)', () => {
        // Curie section with only Chemistry 1 and Chemistry 2 selected in taught_subjects
        const mockSection: Section = {
            id: 'sec-g11-curie',
            section_name: 'Grade 11 - Curie',
            section_grade_level: 'Grade 11',
            track: 'Academic',
            cluster: 'Science, Technology, Engineering, and Mathematics',
            is_advisory: true,
            is_teaching_load: false,
            taught_subjects: [
                'Chemistry 1',
                'Chemistry 2'
            ],
            section_metadata: {
                subjectTerms: {
                    'Chemistry 1': 1,
                    'Chemistry 2': 2
                }
            }
        };

        const mockSubjects: Subject[] = [
            { id: 'sub-chem1', subject_name: 'Chemistry 1', grade_level: 'Grade 11', term: 1, section_id: 'sec-g11-curie' },
            { id: 'sub-chem2', subject_name: 'Chemistry 2', grade_level: 'Grade 11', term: 2, section_id: 'sec-g11-curie' },
        ];

        const term1Subjects = resolveSectionSubjects({
            sectionObj: mockSection,
            subjects: mockSubjects,
            selectedTerm: 'q1'
        });

        const term1Names = term1Subjects.map(s => s.subject_name);

        // 1. MUST contain Core subjects
        expect(term1Names).toContain('General Mathematics');
        expect(term1Names).toContain('General Science');
        expect(term1Names).toContain('Effective Communication');
        expect(term1Names).toContain('Mabisang Komunikasyon');
        expect(term1Names).toContain('Life and Career Skills');
        expect(term1Names).toContain('Pag-aaral ng Kasaysayan at Lipunang Pilipino');

        // 2. MUST contain the active Term 1 elective
        expect(term1Names).toContain('Chemistry 1');

        // 3. MUST NOT contain Term 2 elective
        expect(term1Names).not.toContain('Chemistry 2');

        // 4. MUST NOT contain ANY of the 13 unselected electives across other clusters
        expect(term1Names).not.toContain('Finite Mathematics 1');
        expect(term1Names).not.toContain('Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)');
        expect(term1Names).not.toContain('Physical Education and Health 1');
        expect(term1Names).not.toContain('Contemporary Literature 1');
        expect(term1Names).not.toContain('Creative Composition 1');
        expect(term1Names).not.toContain('Business 1 (Basic Accounting)');
        expect(term1Names).not.toContain('Research 1');
        expect(term1Names).not.toContain('Biology 1');
        expect(term1Names).not.toContain('Earth and Space Science 1');
        expect(term1Names).not.toContain('Physics 1');
        expect(term1Names).not.toContain('Pre-Calculus');
        expect(term1Names).not.toContain('Human Movement 1 (Basic Anatomy in Sports and Exercise)');
        expect(term1Names).not.toContain('Physical Education 1 (Fitness and Recreation)');

        // Total subjects for Curie in Term 1 should be 7 (6 Core + 1 Elective), NOT 19!
        expect(term1Subjects.length).toBe(7);

        // Term 2 Check
        const term2Subjects = resolveSectionSubjects({
            sectionObj: mockSection,
            subjects: mockSubjects,
            selectedTerm: 'q2'
        });
        const term2Names = term2Subjects.map(s => s.subject_name);

        expect(term2Names).toContain('Chemistry 2');
        expect(term2Names).not.toContain('Chemistry 1');
        expect(term2Subjects.length).toBe(7);
    });

    it('recovers gracefully even if imported subjects previously had term: "all" or term: "none"', () => {
        const corruptedSubjects: Subject[] = [
            { id: 'sub-chem1', subject_name: 'Chemistry 1', grade_level: 'Grade 11', term: 'all', section_id: 'sec-g11-curie' },
            { id: 'sub-chem2', subject_name: 'Chemistry 2', grade_level: 'Grade 11', term: 'all', section_id: 'sec-g11-curie' },
        ];

        const mockSectionWithoutMetadata: Section = {
            id: 'sec-g11-curie',
            section_name: 'Grade 11 - Curie',
            section_grade_level: 'Grade 11',
            track: 'Academic',
            cluster: 'Science, Technology, Engineering, and Mathematics',
            is_advisory: true,
            is_teaching_load: false,
            taught_subjects: [
                'Chemistry 1',
                'Chemistry 2'
            ]
        };

        const term1Subjects = resolveSectionSubjects({
            sectionObj: mockSectionWithoutMetadata,
            subjects: corruptedSubjects,
            selectedTerm: 'q1'
        });

        const term2Subjects = resolveSectionSubjects({
            sectionObj: mockSectionWithoutMetadata,
            subjects: corruptedSubjects,
            selectedTerm: 'q2'
        });

        const term1Names = term1Subjects.map(s => s.subject_name);
        const term2Names = term2Subjects.map(s => s.subject_name);

        expect(term1Names).toContain('Chemistry 1');
        expect(term1Names).not.toContain('Chemistry 2');

        expect(term2Names).toContain('Chemistry 2');
        expect(term2Names).not.toContain('Chemistry 1');
    });
});
