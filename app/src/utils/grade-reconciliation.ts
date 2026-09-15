import type { Subject, Section, Student, ClassRecord, HPSRecord } from '../types';
import { isMatchingSubject } from './grading-helpers';
import { STANDARD_SUBJECTS } from '../lib/curriculum';
import { normalizeSubjectName, getCanonicalSubjectKey } from '../lib/subjectConfig';

export interface ReconciliationInput {
    subjects: Subject[];
    sections: Section[];
    students: Student[];
    classRecords: ClassRecord[];
    hpsRecords: HPSRecord[];
    gradingSheetRecords: ClassRecord[];
}

export interface ReconciliationResult {
    subjects: Subject[];
    subjectsModified: boolean;
    deletedSubjectIds: string[];
    classRecords: ClassRecord[];
    hpsRecords: HPSRecord[];
    gradingSheetRecords: ClassRecord[];
    modified: boolean;
    repairedCount: number;
    sections?: Section[];
    sectionsModified?: boolean;
}

/**
 * Generates a clean, deterministic, permanent ID for a subject based on grade level and subject name.
 * Using deterministic IDs prevents ID churn when standard templates are reloaded.
 */
export function generateDeterministicSubjectId(gradeLevel: string, subjectName: string, sectionId?: string): string {
    const cleanGrade = (gradeLevel || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSubj = (subjectName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const secPart = sectionId ? `-${sectionId.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '';
    return `subject-${cleanGrade}-${cleanSubj}${secPart}`;
}

/**
 * Attempts to deduce a subject name from an orphaned subject_id.
 * Inspects template patterns, known slugs, and ID conventions.
 */
export function deduceSubjectNameFromId(subjectId: string, gradeHint?: string): string | null {
    if (!subjectId) return null;
    const lowerId = subjectId.toLowerCase();

    // 1. Check template pattern: `subject-${timestamp}-${grade}-${index}-${random}`
    // e.g. `subject-1725000000000-Grade-7-3-abcde`
    const gradeIndexMatch = lowerId.match(/grade-?(\d+)-(\d+)/i);
    if (gradeIndexMatch) {
        const gradeKey = `Grade ${gradeIndexMatch[1]}` as keyof typeof STANDARD_SUBJECTS;
        const index = parseInt(gradeIndexMatch[2], 10);
        const templates = STANDARD_SUBJECTS[gradeKey];
        if (templates && templates[index]) {
            return templates[index].name;
        }
    }

    // 2. Check template pattern with padStart: `subject-${timestamp}-${index}-${random}`
    const simpleIndexMatch = lowerId.match(/subject-\d+-(\d{1,2})-[a-z0-9]+/i);
    if (simpleIndexMatch && gradeHint) {
        const gradeKey = gradeHint as keyof typeof STANDARD_SUBJECTS;
        const index = parseInt(simpleIndexMatch[1], 10);
        const templates = STANDARD_SUBJECTS[gradeKey];
        if (templates && templates[index]) {
            return templates[index].name;
        }
    }

    // 3. Known subject keyword slugs in ID
    const keywordMap: Array<[RegExp, string]> = [
        [/music.*arts/i, 'Music and Arts'],
        [/pe.*health|physical.*health|hope/i, 'Physical Education and Health'],
        [/science/i, 'Science'],
        [/math/i, 'Mathematics'],
        [/filipino/i, 'Filipino'],
        [/english/i, 'English'],
        [/araling.*panlipunan|\bap\b/i, 'Araling Panlipunan (AP)'],
        [/gmrc|goodmanner|goodmoral/i, 'GMRC'],
        [/values|esp|pagpapakatao/i, 'Values Education'],
        [/epp|pantahanan/i, 'Edukasyong Pantahanan at Pangkabuhayan (EPP)'],
        [/tle|technologyandlivelihood/i, 'Technology and Livelihood Education (TLE)'],
        [/makabansa/i, 'Makabansa'],
        [/reading.*literacy/i, 'Reading and Literacy'],
        [/language/i, 'Language'],
        [/mapeh/i, 'MAPEH']
    ];

    for (const [regex, canonical] of keywordMap) {
        if (regex.test(lowerId)) {
            return canonical;
        }
    }

    return null;
}

/**
 * Reconciles orphaned classRecords, hpsRecords, and gradingSheetRecords by re-linking them
 * to the matching active subject in `subjects`. Also resurrects missing subjects and restores
 * visibility for subjects that have encoded grades but were set to term: 'none'.
 * 
 * This completely protects users from data loss when updating versions or re-templating.
 */
export function reconcileOrphanedGradesAndSubjects(input: ReconciliationInput): ReconciliationResult {
    const { subjects, sections, students, classRecords, hpsRecords, gradingSheetRecords } = input;

    let repairedCount = 0;
    let modified = false;
    let subjectsModified = false;
    const workingSubjects: Subject[] = [...subjects];

    // Build lookup maps
    const studentSectionMap = new Map<string, string>();
    for (const st of students) {
        if (st.student_section) {
            studentSectionMap.set(st.lrn, st.student_section);
        }
    }

    const sectionGradeMap = new Map<string, string>();
    for (const sec of sections) {
        if (sec.id) sectionGradeMap.set(sec.id, sec.section_grade_level);
        if (sec.section_name) sectionGradeMap.set(sec.section_name, sec.section_grade_level);
    }

    // Helper to determine the official standard name for a subject if applicable
    const getOfficialStandardName = (name: string, gradeLevel?: string): string | null => {
        const norm = normalizeSubjectName(name);
        const gNum = parseInt((gradeLevel || '').replace(/\D/g, '')) || 0;
        const isElem = (gNum >= 1 && gNum <= 6) || (gradeLevel || '').toLowerCase().includes('elem');
        const isJhs = (gNum >= 7 && gNum <= 10) || (gradeLevel || '').toLowerCase().includes('jhs');

        if (norm === 'gmrc') {
            if (isElem) return 'GMRC (Good Manners and Right Conduct)';
            if (isJhs) return 'Values Education';
        }
        return null;
    };

    // 0. Auto-heal duplicate subject clusters (early users / legacy databases)
    // Detects subjects sharing the exact same grade, section, and normalized name,
    // picks the canonical subject, and maps all duplicates to it so all grades re-link seamlessly.
    const duplicateIdToCanonicalMap = new Map<string, Subject>();
    const deletedSubjectIds: string[] = [];

    const clusters: Record<string, Subject[]> = {};
    for (const sub of workingSubjects) {
        const cleanGrade = (sub.grade_level || 'all').trim();
        const cleanSection = (sub.section_id || 'all').trim();
        const canonKey = getCanonicalSubjectKey(sub.subject_name, sub.grade_level) || normalizeSubjectName(sub.subject_name);
        if (!canonKey) continue;
        const clusterKey = `${cleanGrade}::${cleanSection}::${canonKey}`;
        if (!clusters[clusterKey]) clusters[clusterKey] = [];
        clusters[clusterKey].push(sub);
    }

    const deduplicatedSubjects: Subject[] = [];
    for (const cluster of Object.values(clusters)) {
        const clusterGrade = cluster[0].grade_level;
        const officialTarget = getOfficialStandardName(cluster[0].subject_name, clusterGrade);

        if (cluster.length === 1) {
            const single = cluster[0];
            if (officialTarget && single.subject_name !== officialTarget) {
                single.subject_name = officialTarget;
                subjectsModified = true;
            } else if (single.subject_name !== single.subject_name.trim()) {
                single.subject_name = single.subject_name.trim();
                subjectsModified = true;
            }
            deduplicatedSubjects.push(single);
            continue;
        }

        // Multiple subjects in cluster! Find canonical:
        // Prioritize official DepEd standard template names, e.g. GMRC (Good Manners and Right Conduct)
        // while also preferring permanent deterministic IDs over temporary sub_ IDs.
        let canonical = (officialTarget && cluster.find(s => s.subject_name === officialTarget && !s.id.startsWith('sub_')))
            || (officialTarget && cluster.find(s => s.subject_name === officialTarget))
            || cluster.find(s => !s.id.startsWith('sub_') && s.subject_name === s.subject_name.trim())
            || cluster.find(s => !s.id.startsWith('sub_'))
            || cluster.find(s => s.subject_name.includes('(') && s.subject_name.includes(')'))
            || cluster[0];

        if (officialTarget && canonical.subject_name !== officialTarget) {
            canonical.subject_name = officialTarget;
            subjectsModified = true;
        } else if (canonical.subject_name !== canonical.subject_name.trim()) {
            canonical.subject_name = canonical.subject_name.trim();
            subjectsModified = true;
        }
        deduplicatedSubjects.push(canonical);

        const duplicates = cluster.filter(s => s.id !== canonical.id);
        for (const dup of duplicates) {
            duplicateIdToCanonicalMap.set(dup.id, canonical);
            deletedSubjectIds.push(dup.id);
            subjectsModified = true;
        }
    }

    if (deletedSubjectIds.length > 0) {
        workingSubjects.length = 0;
        workingSubjects.push(...deduplicatedSubjects);
    }

    // 1. Unhide any subjects that have encoded grades but were incorrectly assigned term: 'none',
    // or are Elementary / JHS subjects (which never have terms, all are full-year 'all'),
    // or are Grade 12 subjects
    const isElemOrJhs = (grade: string | undefined) => {
        if (!grade) return false;
        const gNum = parseInt(grade.replace(/\D/g, '')) || 0;
        const lower = grade.toLowerCase();
        return (gNum >= 1 && gNum <= 10) || lower.includes('kinder') || lower.includes('elem') || lower.includes('jhs');
    };

    const hasAnyGrades = (subId: string, subName?: string) => {
        return classRecords.some(cr => cr.subject_id === subId || (subName && isMatchingSubject(subName, cr.subject_id, cr.subject_name))) ||
               gradingSheetRecords.some(gs => gs.subject_id === subId || (subName && isMatchingSubject(subName, gs.subject_id, gs.subject_name))) ||
               hpsRecords.some(hps => hps.subject_id === subId || (subName && isMatchingSubject(subName, hps.subject_id, undefined)));
    };

    for (let i = 0; i < workingSubjects.length; i++) {
        const sub = workingSubjects[i];
        const isG12 = (sub.grade_level || '').includes('12');
        const isElemJhs = isElemOrJhs(sub.grade_level);
        if (sub.term === 'none' && (isElemJhs || isG12 || hasAnyGrades(sub.id, sub.subject_name))) {
            workingSubjects[i] = { ...sub, term: 'all' };
            subjectsModified = true;
        }
    }

    const currentSubjectIds = new Set(workingSubjects.map((s) => s.id));

    // Helper to ensure matched subject is unhidden (term: 'all')
    const ensureSubjectActive = (sub: Subject) => {
        if (sub.term === 'none') {
            const idx = workingSubjects.findIndex(s => s.id === sub.id);
            if (idx !== -1) {
                workingSubjects[idx] = { ...workingSubjects[idx], term: 'all' };
                subjectsModified = true;
            }
        }
    };

    // Helper to find best matching current subject
    const findMatchingSubject = (
        rawSubId: string,
        rawSubName?: string,
        gradeHint?: string
    ): Subject | undefined => {
        // Direct ID match
        const exact = workingSubjects.find((s) => s.id === rawSubId);
        if (exact) {
            ensureSubjectActive(exact);
            return exact;
        }

        // Try deducing subject name if not supplied
        const deducedName = rawSubName || deduceSubjectNameFromId(rawSubId, gradeHint);

        // Scope to candidate subjects for grade if known
        const gradeScoped = gradeHint
            ? workingSubjects.filter((s) => {
                if (!s.grade_level) return true;
                const g1 = parseInt(s.grade_level.replace(/\D/g, '')) || 0;
                const g2 = parseInt(gradeHint.replace(/\D/g, '')) || 0;
                return g1 === g2 || s.grade_level.toLowerCase() === gradeHint.toLowerCase();
            })
            : workingSubjects;

        const candidatePool = gradeScoped.length > 0 ? gradeScoped : workingSubjects;

        // 1. Normalized exact name match
        if (deducedName) {
            const normDeduced = normalizeSubjectName(deducedName);
            const normMatch = candidatePool.find(s => normalizeSubjectName(s.subject_name) === normDeduced);
            if (normMatch) {
                ensureSubjectActive(normMatch);
                return normMatch;
            }
        }

        // 2. Canonical key match (handles MAPEH components, abbreviations, etc.)
        if (deducedName && gradeHint) {
            const gNum = parseInt(gradeHint.replace(/\D/g, '')) || 0;
            const targetCanonical = getCanonicalSubjectKey(deducedName, gNum);
            if (targetCanonical) {
                const canonMatch = candidatePool.find(s => getCanonicalSubjectKey(s.subject_name, gNum) === targetCanonical);
                if (canonMatch) {
                    ensureSubjectActive(canonMatch);
                    return canonMatch;
                }
            }
        }

        // 3. Match using isMatchingSubject with deduced or raw name
        const fuzzyMatch = candidatePool.find((s) =>
            isMatchingSubject(s.subject_name, rawSubId, deducedName || undefined)
        ) || workingSubjects.find((s) =>
            isMatchingSubject(s.subject_name, rawSubId, deducedName || undefined)
        );

        if (fuzzyMatch) {
            ensureSubjectActive(fuzzyMatch);
            return fuzzyMatch;
        }

        return undefined;
    };

    // Helper to resurrect missing subject from grade record if it has no match
    const resurrectMissingSubject = (rawSubId: string, rawSubName?: string, gradeHint?: string): Subject => {
        let deducedName = rawSubName || deduceSubjectNameFromId(rawSubId, gradeHint) || 'General Subject';
        const officialTarget = getOfficialStandardName(deducedName, gradeHint);
        if (officialTarget) {
            deducedName = officialTarget;
        }
        const newSub: Subject = {
            id: rawSubId || generateDeterministicSubjectId(gradeHint || 'Grade 7', deducedName),
            subject_name: deducedName,
            grade_level: gradeHint || 'Grade 7',
            term: 'all'
        };
        workingSubjects.push(newSub);
        currentSubjectIds.add(newSub.id);
        subjectsModified = true;
        return newSub;
    };

    // 2. Reconcile ClassRecords
    const updatedClassRecords = classRecords.map((cr) => {
        if (duplicateIdToCanonicalMap.has(cr.subject_id)) {
            const canonical = duplicateIdToCanonicalMap.get(cr.subject_id)!;
            ensureSubjectActive(canonical);
            repairedCount++;
            modified = true;
            return {
                ...cr,
                subject_id: canonical.id,
                subject_name: canonical.subject_name,
                id: `grade_${cr.student_lrn}_${canonical.id}_Q${cr.quarter}`
            };
        }

        if (currentSubjectIds.has(cr.subject_id)) {
            // Already connected to a valid subject. Ensure subject is active and subject_name is populated if missing.
            const existingSub = workingSubjects.find(s => s.id === cr.subject_id);
            if (existingSub) {
                ensureSubjectActive(existingSub);
                if (cr.subject_name !== existingSub.subject_name) {
                    modified = true;
                    return { ...cr, subject_name: existingSub.subject_name };
                }
            }
            return cr;
        }

        // Determine grade hint from student or record section
        const secId = cr.section_id || studentSectionMap.get(cr.student_lrn);
        const gradeHint = secId ? sectionGradeMap.get(secId) : undefined;

        let matchedSub = findMatchingSubject(cr.subject_id, cr.subject_name, gradeHint);
        if (!matchedSub) {
            // Resurrect subject so this teacher's grades never disappear
            matchedSub = resurrectMissingSubject(cr.subject_id, cr.subject_name, gradeHint);
        }

        repairedCount++;
        modified = true;
        return {
            ...cr,
            subject_id: matchedSub.id,
            subject_name: matchedSub.subject_name,
            id: `grade_${cr.student_lrn}_${matchedSub.id}_Q${cr.quarter}`
        };
    });

    // 3. Reconcile HPSRecords
    const updatedHpsRecords = hpsRecords.map((hps) => {
        // Derive known subject name from any available source (hps.subject_name, classRecords, gradingSheetRecords, workingSubjects)
        const relatedCr = classRecords.find(cr => cr.subject_id === hps.subject_id && cr.subject_name);
        const relatedGs = gradingSheetRecords.find(gs => gs.subject_id === hps.subject_id && gs.subject_name);
        const relatedSub = workingSubjects.find(s => s.id === hps.subject_id);
        const knownSubName = hps.subject_name || relatedCr?.subject_name || relatedGs?.subject_name || relatedSub?.subject_name;

        if (duplicateIdToCanonicalMap.has(hps.subject_id)) {
            const canonical = duplicateIdToCanonicalMap.get(hps.subject_id)!;
            ensureSubjectActive(canonical);
            repairedCount++;
            modified = true;
            return {
                ...hps,
                subject_id: canonical.id,
                subject_name: canonical.subject_name,
                id: `hps_${canonical.id}_${hps.section_id || 'all'}_${hps.school_year || ''}_Q${hps.quarter}`
            };
        }

        if (currentSubjectIds.has(hps.subject_id)) {
            const existingSub = workingSubjects.find(s => s.id === hps.subject_id);
            if (existingSub) {
                ensureSubjectActive(existingSub);
                if (hps.subject_name !== existingSub.subject_name) {
                    modified = true;
                    return {
                        ...hps,
                        subject_name: existingSub.subject_name
                    };
                }
            }
            return hps;
        }

        const gradeHint = hps.section_id ? sectionGradeMap.get(hps.section_id) : undefined;
        let matchedSub = findMatchingSubject(hps.subject_id, knownSubName, gradeHint);
        if (!matchedSub) {
            matchedSub = resurrectMissingSubject(hps.subject_id, knownSubName, gradeHint);
        }

        repairedCount++;
        modified = true;
        return {
            ...hps,
            subject_id: matchedSub.id,
            subject_name: matchedSub.subject_name,
            id: `hps_${matchedSub.id}_${hps.section_id || 'all'}_${hps.school_year || ''}_Q${hps.quarter}`
        };
    });

    // 4. Reconcile GradingSheetRecords
    const updatedGradingSheetRecords = gradingSheetRecords.map((gs) => {
        if (duplicateIdToCanonicalMap.has(gs.subject_id)) {
            const canonical = duplicateIdToCanonicalMap.get(gs.subject_id)!;
            ensureSubjectActive(canonical);
            repairedCount++;
            modified = true;
            return {
                ...gs,
                subject_id: canonical.id,
                subject_name: canonical.subject_name,
                id: `${gs.student_lrn}_${canonical.id}_${gs.quarter}_${gs.school_year || ''}`
            };
        }

        if (currentSubjectIds.has(gs.subject_id)) {
            const existingSub = workingSubjects.find(s => s.id === gs.subject_id);
            if (existingSub) {
                ensureSubjectActive(existingSub);
                if (gs.subject_name !== existingSub.subject_name) {
                    modified = true;
                    return { ...gs, subject_name: existingSub.subject_name };
                }
            }
            return gs;
        }

        const secId = gs.section_id || studentSectionMap.get(gs.student_lrn);
        const gradeHint = secId ? sectionGradeMap.get(secId) : undefined;

        let matchedSub = findMatchingSubject(gs.subject_id, gs.subject_name, gradeHint);
        if (!matchedSub) {
            matchedSub = resurrectMissingSubject(gs.subject_id, gs.subject_name, gradeHint);
        }

        repairedCount++;
        modified = true;
        return {
            ...gs,
            subject_id: matchedSub.id,
            subject_name: matchedSub.subject_name,
            id: `${gs.student_lrn}_${matchedSub.id}_${gs.quarter}_${gs.school_year || ''}`
        };
    });

    // 5. Reconcile Sections (Ensure Elementary sections use official GMRC and JHS use Values Education)
    let sectionsModified = false;
    const workingSections: Section[] = sections.map(sec => {
        const secGradeNum = parseInt((sec.section_grade_level || '').replace(/\D/g, '')) || 0;
        const secIsElem = (secGradeNum >= 1 && secGradeNum <= 6) || (sec.section_grade_level || '').toLowerCase().includes('elem');
        const secIsJhs = (secGradeNum >= 7 && secGradeNum <= 10) || (sec.section_grade_level || '').toLowerCase().includes('jhs');
        let secChanged = false;

        let taught = sec.taught_subjects ? [...sec.taught_subjects] : undefined;
        let teaching = sec.teaching_subjects ? [...sec.teaching_subjects] : undefined;
        const metadata = sec.section_metadata ? { ...sec.section_metadata } : undefined;
        let hidden = metadata?.hiddenConsolidatedSubjects ? [...metadata.hiddenConsolidatedSubjects] : undefined;

        if (secIsElem) {
            if (taught) {
                const newTaught = taught.map(t => {
                    if (normalizeSubjectName(t) === 'gmrc' && t !== 'GMRC (Good Manners and Right Conduct)') {
                        secChanged = true;
                        return 'GMRC (Good Manners and Right Conduct)';
                    }
                    return t;
                });
                const seenT = new Set<string>();
                taught = newTaught.filter(t => {
                    const norm = normalizeSubjectName(t);
                    if (seenT.has(norm)) {
                        secChanged = true;
                        return false;
                    }
                    seenT.add(norm);
                    return true;
                });
            }

            if (teaching) {
                const newTeaching = teaching.map(t => {
                    if (normalizeSubjectName(t) === 'gmrc' && t !== 'GMRC (Good Manners and Right Conduct)') {
                        secChanged = true;
                        return 'GMRC (Good Manners and Right Conduct)';
                    }
                    return t;
                });
                const seenTech = new Set<string>();
                teaching = newTeaching.filter(t => {
                    const norm = normalizeSubjectName(t);
                    if (seenTech.has(norm)) {
                        secChanged = true;
                        return false;
                    }
                    seenTech.add(norm);
                    return true;
                });
            }

            if (hidden && hidden.length > 0) {
                const newHidden = hidden.filter(h => {
                    if (normalizeSubjectName(h) === 'gmrc' || h.toLowerCase().trim() === 'gmrc') {
                        secChanged = true;
                        return false;
                    }
                    return true;
                });
                if (newHidden.length !== hidden.length) {
                    secChanged = true;
                    hidden = newHidden;
                }
            }
        } else if (secIsJhs) {
            if (taught) {
                const newTaught = taught.map(t => {
                    if (normalizeSubjectName(t) === 'gmrc') {
                        secChanged = true;
                        return 'Values Education';
                    }
                    return t;
                });
                const seenT = new Set<string>();
                taught = newTaught.filter(t => {
                    const norm = normalizeSubjectName(t);
                    if (seenT.has(norm)) {
                        secChanged = true;
                        return false;
                    }
                    seenT.add(norm);
                    return true;
                });
            }
            if (teaching) {
                const newTeaching = teaching.map(t => {
                    if (normalizeSubjectName(t) === 'gmrc') {
                        secChanged = true;
                        return 'Values Education';
                    }
                    return t;
                });
                const seenTech = new Set<string>();
                teaching = newTeaching.filter(t => {
                    const norm = normalizeSubjectName(t);
                    if (seenTech.has(norm)) {
                        secChanged = true;
                        return false;
                    }
                    seenTech.add(norm);
                    return true;
                });
            }
        }

        if (secChanged) {
            sectionsModified = true;
            return {
                ...sec,
                taught_subjects: taught,
                teaching_subjects: teaching,
                section_metadata: metadata ? {
                    ...metadata,
                    hiddenConsolidatedSubjects: hidden
                } : undefined
            };
        }
        return sec;
    });

    return {
        subjects: workingSubjects,
        subjectsModified,
        deletedSubjectIds,
        classRecords: updatedClassRecords,
        hpsRecords: updatedHpsRecords,
        gradingSheetRecords: updatedGradingSheetRecords,
        modified,
        repairedCount,
        sections: workingSections,
        sectionsModified
    };
}
