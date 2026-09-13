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

export interface CurriculumSyncResult {
    updatedSection: Section;
    createdSubjectsCount: number;
    updatedSubjectsCount: number;
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
    const subjectNames = preset.subjects.map(s => s.name);
    const subjectTerms: Record<string, 1 | 2 | 3 | 'all'> = {};

    for (const item of preset.subjects) {
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
    for (const item of preset.subjects) {
        const normName = normalizeSubjectName(item.name);
        const existing = existingSubjects.find(s =>
            (s.grade_level || '').trim() === gradeLevel.trim() &&
            (!s.section_id || s.section_id === section.id) &&
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
                counts_in_general_average: item.counts_in_general_average !== false,
                is_component: item.is_component || false,
                is_special_program: preset.program !== 'Regular',
                program_type: preset.program !== 'Regular' ? preset.program : undefined
            };
            await callbacks.addSubject(newSubj);
            createdCount++;
        } else {
            // Update term or weights if divergent
            const needsTermUpdate = existing.term !== item.term && item.term !== 'all';
            if (needsTermUpdate) {
                await callbacks.updateSubject({
                    ...existing,
                    term: item.term
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
        message: `Successfully applied ${preset.label}: ${result.createdSubjectsCount} subjects created, ${preset.subjects.length} subjects configured.`,
        updatedSection: result.updatedSection
    };
}
