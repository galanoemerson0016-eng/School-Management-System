import { describe, it, expect } from 'vitest';
import { filterSubjectsForSection } from './rbac';
import { getSubjectsForGrade, normalizeSubjectName, sortSubjects, getCanonicalSubjectKey } from './subjectConfig';
import { SPECIAL_SUBJECTS, getCurriculumTemplatesForSection } from './curriculum';
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

        const intendedSubjects = getSubjectsForGrade(sectionObj.section_grade_level);

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

    it('Grade Slip: Deduplicates subjects across sections and prevents duplicate rows', () => {
        // Multi-section scenario with shared/duplicated subject records in the store
        const multiSectionSubjects: Subject[] = [
            { id: 'sub-eng-1', subject_name: 'English', grade_level: 'Grade 7', term: 'all', section_id: 'sec-g7-matatag-1' },
            { id: 'sub-eng-2', subject_name: 'English', grade_level: 'Grade 7', term: 'all', section_id: 'sec-g7-matatag-2' },
            { id: 'sub-eng-global', subject_name: 'English', grade_level: 'Grade 7', term: 'all' },
            { id: 'sub-math-1', subject_name: 'Mathematics', grade_level: 'Grade 7', term: 'all', section_id: 'sec-g7-matatag-1' },
            { id: 'sub-math-2', subject_name: 'Mathematics', grade_level: 'Grade 7', term: 'all', section_id: 'sec-g7-matatag-2' },
            { id: 'sub-sci-global', subject_name: 'Science', grade_level: 'Grade 7', term: 'all' },
            { id: 'sub-fil-global', subject_name: 'Filipino', grade_level: 'Grade 7', term: 'all' }
        ];

        const sectionObj: Section = {
            id: 'sec-g7-matatag-2',
            section_name: 'Newton',
            section_grade_level: 'Grade 7',
            is_advisory: true
        };

        const sectionGradeNum = parseInt(sectionObj.section_grade_level.replace(/\D/g, '')) || 0;
        const taughtSet = new Set((sectionObj.taught_subjects || []).map(s => s.toLowerCase().trim()));

        // Grade Slip candidate filtering logic
        let candidates = multiSectionSubjects.filter(s => {
            const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
            const isMatchingGrade = subjectGradeNum === sectionGradeNum;
            const isMatchingSection = s.section_id === sectionObj.id;
            return (isMatchingGrade || isMatchingSection) && s.term !== 'none';
        });

        candidates = candidates.filter(s => !s.section_id || s.section_id === sectionObj.id);

        if (taughtSet.size > 0) {
            candidates = candidates.filter(s => {
                const norm = normalizeSubjectName(s.subject_name);
                return taughtSet.has(s.subject_name.toLowerCase().trim()) || (norm ? taughtSet.has(norm) : false);
            });
        }

        candidates.sort((a, b) => {
            const aDirect = a.section_id === sectionObj.id ? 1 : 0;
            const bDirect = b.section_id === sectionObj.id ? 1 : 0;
            return bDirect - aDirect;
        });

        const seenNames = new Set<string>();
        const uniqueSubjects: Subject[] = [];
        for (const s of candidates) {
            const norm = normalizeSubjectName(s.subject_name);
            if (norm && seenNames.has(norm)) continue;
            if (norm) seenNames.add(norm);
            uniqueSubjects.push(s);
        }

        const sorted = sortSubjects(uniqueSubjects, s => s.subject_name);
        const subjectNames = sorted.map(s => s.subject_name);

        // Every subject should appear exactly once
        expect(subjectNames).toEqual(expect.arrayContaining(['English', 'Mathematics', 'Science', 'Filipino']));
        expect(subjectNames.filter(n => n === 'English')).toHaveLength(1);
        expect(subjectNames.filter(n => n === 'Mathematics')).toHaveLength(1);
        expect(sorted.find(s => s.subject_name === 'English')?.id).toBe('sub-eng-2');
        expect(sorted.find(s => s.subject_name === 'Mathematics')?.id).toBe('sub-math-2');
    });

    it('Grade Management: Excludes ghost or deleted subjects like Entrepreneurship from Grade 10 even if present in the database', () => {
        const mockG10AdvisorySection: Section = {
            id: 'sec-g10-makisig',
            section_name: 'Makisig',
            section_grade_level: 'Grade 10',
            is_advisory: true,
            taught_subjects: [
                'Filipino',
                'English',
                'Mathematics',
                'Science',
                'Araling Panlipunan (AP)',
                'Values Education',
                'Technology and Livelihood Education (TLE)',
                'MAPEH'
            ]
        };

        const mockG10Subjects: Subject[] = [
            { id: 'sub-g10-fil', subject_name: 'Filipino', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-eng', subject_name: 'English', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-math', subject_name: 'Mathematics', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-sci', subject_name: 'Science', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-ap', subject_name: 'Araling Panlipunan (AP)', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-ve', subject_name: 'Values Education', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-tle', subject_name: 'Technology and Livelihood Education (TLE)', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-mapeh', subject_name: 'MAPEH', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-ma', subject_name: 'Music and Arts', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-peh', subject_name: 'Physical Education and Health', grade_level: 'Grade 10', term: 'all' },
            // Ghost / unassigned subject in DB with Grade 10 tag:
            { id: 'sub-g10-entrepreneurship', subject_name: 'Entrepreneurship', grade_level: 'Grade 10', term: 'all' }
        ];

        const sectionObj = mockG10AdvisorySection;
        const subjects = mockG10Subjects;
        const sectionGradeNum = 10;
        const isSHS = false;
        const taughtRaw = sectionObj.taught_subjects || [];
        const intendedSubjects = getSubjectsForGrade(sectionObj.section_grade_level);

        let candidates = subjects.filter(s => {
            const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
            const isMatchingGrade = subjectGradeNum === sectionGradeNum;
            const isMatchingSection = s.section_id === sectionObj.id;
            return (isMatchingGrade || isMatchingSection) && s.term !== 'none';
        });

        // The updated logic in ConsolidatedGradesPage
        if (!isSHS) {
            const isSubjectAllowedInTaught = (subId: string, subName: string) => {
                return taughtRaw.some(t => {
                    const normT = normalizeSubjectName(t);
                    const normSub = normalizeSubjectName(subName);
                    if (normT === normSub || normT.includes(normSub) || normSub.includes(normT)) return true;
                    if (normT === 'mapeh') {
                        return normSub.includes('music') || normSub.includes('arts') || normSub.includes('pe') || normSub.includes('health') || normSub.includes('physical');
                    }
                    return false;
                });
            };

            if (taughtRaw.length > 1) {
                candidates = candidates.filter(s => isSubjectAllowedInTaught(s.id, s.subject_name));
            } else {
                candidates = candidates.filter(s => {
                    const isIntended = intendedSubjects.some(intended => normalizeSubjectName(intended.name) === normalizeSubjectName(s.subject_name));
                    const isExplicitlyTaught = isSubjectAllowedInTaught(s.id, s.subject_name);
                    return isIntended || isExplicitlyTaught;
                });
            }
        }

        const candidateNames = candidates.map(c => c.subject_name);
        expect(candidateNames).not.toContain('Entrepreneurship');
        expect(candidateNames).toContain('Filipino');
        expect(candidateNames).toContain('English');
        expect(candidateNames).toContain('Mathematics');
        expect(candidateNames).toContain('Science');
        expect(candidateNames).toContain('Araling Panlipunan (AP)');
        expect(candidateNames).toContain('Values Education');
        expect(candidateNames).toContain('Technology and Livelihood Education (TLE)');
        expect(candidateNames).toContain('MAPEH');
    });

    it('Temporary Grade Slip: Includes parent MAPEH header when components exist, places it right before components', () => {
        const mockG10SubjectsWithComponentsOnly: Subject[] = [
            { id: 'sub-g10-fil', subject_name: 'Filipino', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-eng', subject_name: 'English', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-math', subject_name: 'Mathematics', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-sci', subject_name: 'Science', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-ap', subject_name: 'Araling Panlipunan (AP)', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-ve', subject_name: 'Values Education', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-tle', subject_name: 'Technology and Livelihood Education (TLE)', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-ma', subject_name: 'Music and Arts', grade_level: 'Grade 10', term: 'all' },
            { id: 'sub-g10-peh', subject_name: 'Physical Education and Health', grade_level: 'Grade 10', term: 'all' }
        ];

        const sectionObj: Section = {
            id: 'sec-g10-makisig',
            section_name: 'Makisig',
            section_grade_level: 'Grade 10',
            is_advisory: true
        };

        const isSHS = false;
        const candidates = [...mockG10SubjectsWithComponentsOnly];

        const seenNames = new Set<string>();
        const uniqueSubjects: Subject[] = [];
        for (const s of candidates) {
            const canonical = getCanonicalSubjectKey(s.subject_name, sectionObj.section_grade_level);
            if (canonical && seenNames.has(canonical)) continue;
            if (canonical) seenNames.add(canonical);
            uniqueSubjects.push(s);
        }

        // Parent MAPEH logic from TemporaryGradeSlipPage
        if (!isSHS) {
            const hasMapehHeader = uniqueSubjects.some(s => normalizeSubjectName(s.subject_name) === 'mapeh');
            const hasMapehComponents = uniqueSubjects.some(s => {
                const n = normalizeSubjectName(s.subject_name);
                return n.includes('musicandarts') || n.includes('musicarts') || 
                       n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth') ||
                       n === 'music' || n === 'arts' || n === 'physicaleducation' || n === 'health';
            });

            if (hasMapehComponents && !hasMapehHeader) {
                uniqueSubjects.push({
                    id: `virtual-mapeh-${sectionObj.id}`,
                    subject_name: 'MAPEH',
                    section_id: sectionObj.id,
                    grade_level: sectionObj.section_grade_level,
                    term: 'all'
                } as Subject);
            }
        }

        const sorted = sortSubjects(uniqueSubjects, s => s.subject_name);
        const names = sorted.map(s => s.subject_name);

        expect(names).toContain('MAPEH');
        expect(names).toContain('Music and Arts');
        expect(names).toContain('Physical Education and Health');

        const mapehIdx = names.indexOf('MAPEH');
        const maIdx = names.indexOf('Music and Arts');
        const pehIdx = names.indexOf('Physical Education and Health');

        // MAPEH must appear directly before its components
        expect(mapehIdx).toBeLessThan(maIdx);
        expect(mapehIdx).toBeLessThan(pehIdx);
        expect(maIdx).toBe(mapehIdx + 1);
        expect(pehIdx).toBe(mapehIdx + 2);
    });

    it('Grade Management: Preserves imported special program subjects (STE, SPJ, SPA) even when section taught_subjects only lists standard subjects', () => {
        const mockG7AdvisorySection: Section = {
            id: 'sec-g7-diamond',
            section_name: 'Diamond',
            section_grade_level: 'Grade 7',
            is_advisory: true,
            program: 'Regular',
            taught_subjects: [
                'Filipino',
                'English',
                'Mathematics',
                'Science',
                'Araling Panlipunan (AP)',
                'Values Education',
                'Technology and Livelihood Education (TLE)',
                'MAPEH'
            ]
        };

        const mockG7SubjectsWithImportedSpecials: Subject[] = [
            { id: 'sub-g7-fil', subject_name: 'Filipino', grade_level: 'Grade 7', term: 'all' },
            { id: 'sub-g7-eng', subject_name: 'English', grade_level: 'Grade 7', term: 'all' },
            { id: 'sub-g7-math', subject_name: 'Mathematics', grade_level: 'Grade 7', term: 'all' },
            { id: 'sub-g7-sci', subject_name: 'Science', grade_level: 'Grade 7', term: 'all' },
            { id: 'sub-g7-ap', subject_name: 'Araling Panlipunan (AP)', grade_level: 'Grade 7', term: 'all' },
            { id: 'sub-g7-ve', subject_name: 'Values Education', grade_level: 'Grade 7', term: 'all' },
            { id: 'sub-g7-tle', subject_name: 'Technology and Livelihood Education (TLE)', grade_level: 'Grade 7', term: 'all' },
            { id: 'sub-g7-mapeh', subject_name: 'MAPEH', grade_level: 'Grade 7', term: 'all' },
            // Imported STE subjects from wizard:
            { id: 'sub-g7-ste-res1', subject_name: 'Research I (Scientific Investigation)', grade_level: 'Grade 7', term: 'all', is_special_program: true, program_type: 'STE' },
            { id: 'sub-g7-ste-es', subject_name: 'Environmental Science', grade_level: 'Grade 7', term: 'all', is_special_program: true, program_type: 'STE' },
            // Imported SPJ subject assigned to this section:
            { id: 'sub-g7-spj-1', subject_name: 'Journalism I (Print Journalism)', grade_level: 'Grade 7', term: 'all', section_id: 'sec-g7-diamond', is_special_program: true, program_type: 'SPJ' },
            // Ghost unassigned subject from SHS:
            { id: 'sub-g7-ghost', subject_name: 'Entrepreneurship', grade_level: 'Grade 7', term: 'all' }
        ];

        const sectionObj = mockG7AdvisorySection;
        const subjects = mockG7SubjectsWithImportedSpecials;
        const sectionGradeNum = 7;
        const taughtRaw = sectionObj.taught_subjects || [];

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

        let candidates = subjects.filter(s => {
            const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
            const isMatchingGrade = subjectGradeNum === sectionGradeNum;
            const isMatchingSection = s.section_id === sectionObj.id;
            return (isMatchingGrade || isMatchingSection) && s.term !== 'none';
        });

        const isSpecialOrImported = (s: Subject) => {
            if (s.section_id === sectionObj.id) return true;
            if (s.is_special_program || Boolean(s.program_type)) return true;
            const specialTemplates = SPECIAL_SUBJECTS[sectionObj.section_grade_level] || [];
            if (specialTemplates.some(t => normalizeSubjectName(t.name) === normalizeSubjectName(s.subject_name))) {
                return true;
            }
            if (intendedSubjects.some(intended => normalizeSubjectName(intended.name) === normalizeSubjectName(s.subject_name))) {
                return true;
            }
            return false;
        };

        const isSubjectAllowedInTaught = (subId: string, subName: string) => {
            return taughtRaw.some(t => {
                const normT = normalizeSubjectName(t);
                const normSub = normalizeSubjectName(subName);
                if (normT === normSub || normT.includes(normSub) || normSub.includes(normT)) return true;
                if (normT === 'mapeh') {
                    return normSub.includes('music') || normSub.includes('arts') || normSub.includes('pe') || normSub.includes('health') || normSub.includes('physical');
                }
                return false;
            });
        };

        if (taughtRaw.length > 1) {
            candidates = candidates.filter(s => isSubjectAllowedInTaught(s.id, s.subject_name) || isSpecialOrImported(s));
        } else {
            candidates = candidates.filter(s => {
                const isIntended = intendedSubjects.some(intended => normalizeSubjectName(intended.name) === normalizeSubjectName(s.subject_name));
                const isExplicitlyTaught = isSubjectAllowedInTaught(s.id, s.subject_name);
                return isIntended || isExplicitlyTaught || isSpecialOrImported(s);
            });
        }

        const candidateNames = candidates.map(c => c.subject_name);

        // Core subjects preserved
        expect(candidateNames).toContain('Filipino');
        expect(candidateNames).toContain('English');
        expect(candidateNames).toContain('Mathematics');
        expect(candidateNames).toContain('Science');
        expect(candidateNames).toContain('MAPEH');

        // Imported special program subjects MUST be preserved!
        expect(candidateNames).toContain('Research I (Scientific Investigation)');
        expect(candidateNames).toContain('Environmental Science');
        expect(candidateNames).toContain('Journalism I (Print Journalism)');

        // Ghost subjects still excluded!
        expect(candidateNames).not.toContain('Entrepreneurship');
    });
});
