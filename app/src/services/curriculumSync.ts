/**
 * Curriculum Synchronization Service — FormEase Pro
 * 
 * Bridges the gap between Section taught_subjects, section_metadata.subjectTerms,
 * and the database `subjects` store. Ensures seamless 1-click curriculum application
 * and real-time auto-repair of missing term subjects.
 */

import { generateUUID } from '../utils/idGenerator';
import type { Section, Subject } from '../types';
import {
    type CurriculumPreset,
    getCurriculumPreset,
    validateSectionCurriculumHealth
} from '../lib/curriculumPresets';
import { normalizeSubjectName } from '../lib/subjectConfig';
import { getDefaultTermForSubject, isGrade11CoreSubject, normalizeOfferedTerms } from '../lib/curriculum';

export interface CurriculumSyncResult {
    updatedSection: Section;
    createdSubjectsCount: number;
    updatedSubjectsCount: number;
}

export interface SectionOfferingRepairResult {
    createdSubjectsCount: number;
    existingSubjectsCount: number;
}

/**
 * Safely materializes a section's existing curriculum as section-owned
 * Subject rows.  It never changes the section, existing subjects, grades, or
 * learner rosters.  This is the migration path for older client data that
 * used a shared Subject Library row as its live offering.
 */
export async function repairSectionOwnedSubjectOfferings(
    section: Section,
    existingSubjects: Subject[],
    callbacks: { addSubject: (subject: Subject) => Promise<void> },
): Promise<SectionOfferingRepairResult> {
    const subjectNames = Array.from(new Map(
        (section.taught_subjects || []).map(name => [normalizeSubjectName(name), name.trim()])
    ).values()).filter(Boolean);
    const configuredTerms = (section.section_metadata?.subjectTerms || {}) as Record<string, unknown>;
    const gradeLevel = section.section_grade_level;
    const isShs = /(?:11|12)/.test(gradeLevel || '');
    let createdSubjectsCount = 0;
    let existingSubjectsCount = 0;

    for (const subjectName of subjectNames) {
        const normalized = normalizeSubjectName(subjectName);
        const sectionOwned = existingSubjects.find(subject =>
            subject.section_id === section.id &&
            normalizeSubjectName(subject.subject_name) === normalized
        );
        if (sectionOwned) {
            existingSubjectsCount++;
            continue;
        }

        const libraryDefinition = existingSubjects.find(subject =>
            !subject.section_id &&
            (subject.grade_level || '').trim() === (gradeLevel || '').trim() &&
            normalizeSubjectName(subject.subject_name) === normalized
        );
        const configuredTerm = configuredTerms[subjectName] ?? configuredTerms[libraryDefinition?.subject_name || ''];
        const fallbackTerm = isGrade11CoreSubject(subjectName)
            ? 'all'
            : (getDefaultTermForSubject(subjectName, gradeLevel) || (isShs ? 1 : 'all'));
        const termSource = configuredTerm ?? libraryDefinition?.offered_terms ?? libraryDefinition?.term ?? fallbackTerm;
        const offeredTerms = normalizeOfferedTerms(termSource);
        const term: Subject['term'] = !isShs
            ? 'all'
            : offeredTerms.length === 3
                ? 'all'
                : offeredTerms.length === 2
                    ? (offeredTerms.join(',') as Subject['term'])
                    : offeredTerms.length === 1
                        ? offeredTerms[0]
                        : 'none';

        await callbacks.addSubject({
            id: generateUUID(),
            subject_name: subjectName,
            subject_code: libraryDefinition?.subject_code,
            grade_level: gradeLevel,
            section_id: section.id,
            term,
            offered_terms: offeredTerms,
            written_weight: libraryDefinition?.written_weight,
            performance_weight: libraryDefinition?.performance_weight,
            exam_weight: libraryDefinition?.exam_weight,
            units: libraryDefinition?.units,
            hours: libraryDefinition?.hours,
            counts_in_general_average: libraryDefinition?.counts_in_general_average ?? true,
            is_component: libraryDefinition?.is_component,
            is_special_program: libraryDefinition?.is_special_program,
            program_type: libraryDefinition?.program_type,
        });
        createdSubjectsCount++;
    }

    return { createdSubjectsCount, existingSubjectsCount };
}

/**
 * Apply an official DepEd Curriculum Preset to a Section.
 * - Updates section.taught_subjects to match the official roster.
 * - Updates section.section_metadata.subjectTerms with exact term assignments.
 * - Auto-creates or syncs matching Subject records in the database with standard DepEd weights.
 */
export async function applyCurriculumPresetToSection(
    section: Section,
    preset: CurriculumPreset,
    existingSubjects: Subject[],
    callbacks: {
        addSubject: (subject: Subject) => Promise<void>;
        updateSubject: (subject: Subject) => Promise<void>;
        updateSection: (section: Section) => Promise<void>;
    }
): Promise<CurriculumSyncResult> {
    const offeredPresetSubjects = preset.subjects;
    const subjectNames = offeredPresetSubjects.map(s => s.name);
    const subjectTerms: Record<string, 1 | 2 | 3 | 'all'> = {};

    for (const item of offeredPresetSubjects) {
        subjectTerms[item.name] = item.term;
    }

    const updatedMetadata = {
        ...(section.section_metadata || {}),
        subjectTerms: {
            ...((section.section_metadata?.subjectTerms as Record<string, 1 | 2 | 3 | 'all'>) || {}),
            ...subjectTerms
        }
    };

    const updatedSection: Section = {
        ...section,
        taught_subjects: subjectNames,
        section_metadata: updatedMetadata
    };

    let createdCount = 0;
    let updatedCount = 0;

    const gradeLevel = section.section_grade_level || preset.gradeLevel;

    // Synchronize Subject database records
    for (const item of offeredPresetSubjects) {
        const normName = normalizeSubjectName(item.name);
        // Keep the library definition separate from this section's actual
        // offering.  A section-owned row is where roster and term decisions
        // live, so a global record must not be updated in its place.
        const existing = existingSubjects.find(s =>
            (s.grade_level || '').trim() === gradeLevel.trim() &&
            s.section_id === section.id &&
            normalizeSubjectName(s.subject_name) === normName
        );

        if (!existing) {
            const newSubj: Subject = {
                id: generateUUID(),
                subject_name: item.name,
                subject_code: item.code || '',
                grade_level: gradeLevel,
                section_id: section.id,
                term: item.term,
                written_weight: item.written_weight,
                performance_weight: item.performance_weight,
                exam_weight: item.exam_weight,
                units: item.units,
                hours: item.hoursPerYear,
                counts_in_general_average: item.counts_in_general_average !== false,
                is_component: item.is_component || false,
                is_special_program: preset.program !== 'Regular',
                program_type: preset.program !== 'Regular' ? preset.program : undefined
            };
            await callbacks.addSubject(newSubj);
            createdCount++;
        } else {
            // Update the schedule and curriculum metadata if divergent.
            const needsTermUpdate = existing.term !== item.term;
            const needsUnitUpdate = item.units !== undefined && existing.units !== item.units;
            const needsHoursUpdate = item.hoursPerYear !== undefined && existing.hours !== item.hoursPerYear;
            if (needsTermUpdate || needsUnitUpdate || needsHoursUpdate) {
                await callbacks.updateSubject({
                    ...existing,
                    term: needsTermUpdate ? item.term : existing.term,
                    units: item.units ?? existing.units,
                    hours: item.hoursPerYear ?? existing.hours
                });
                updatedCount++;
            }
        }
    }

    // Persist section changes
    await callbacks.updateSection(updatedSection);

    return {
        updatedSection,
        createdSubjectsCount: createdCount,
        updatedSubjectsCount: updatedCount
    };
}

/**
 * 1-Click Auto-Repair for Sections with Missing Term Subjects:
 * Detects if any active term (1, 2, or 3) has 0 subjects configured, finds the matching
 * DepEd preset, and fills in the missing term assignments.
 */
export async function autoRepairSectionCurriculum(
    section: Section,
    existingSubjects: Subject[],
    callbacks: {
        addSubject: (subject: Subject) => Promise<void>;
        updateSubject: (subject: Subject) => Promise<void>;
        updateSection: (section: Section) => Promise<void>;
    }
): Promise<{ success: boolean; message: string; updatedSection?: Section }> {
    const grade = section.section_grade_level || '';
    const subjectTerms = (section.section_metadata?.subjectTerms as Record<string, 1 | 2 | 3 | 'all'>) || {};
    const taught = section.taught_subjects || [];

    const health = validateSectionCurriculumHealth(
        taught,
        subjectTerms,
        grade,
        section.track,
        section.cluster || section.strand,
        section.program
    );

    if (health.isHealthy) {
        return { success: true, message: 'Section curriculum is already healthy and complete.' };
    }

    const preset = health.suggestedPreset || getCurriculumPreset(
        grade,
        section.track,
        section.cluster || section.strand,
        section.program
    );

    if (!preset) {
        return { success: false, message: `No official DepEd preset found for ${grade}.` };
    }

    const result = await applyCurriculumPresetToSection(section, preset, existingSubjects, callbacks);

    return {
        success: true,
        message: `Successfully applied ${preset.label}: ${result.createdSubjectsCount} subjects created, ${result.updatedSection.taught_subjects?.length || 0} subjects configured.`,
        updatedSection: result.updatedSection
    };
}
