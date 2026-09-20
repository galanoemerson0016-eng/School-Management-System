import type { Section, Subject, Student, ClassRecord } from '../types';

/**
 * Check whether a section is a generated test section
 */
export function isTestSection(section: Section): boolean {
    if (!section) return false;
    return Boolean(
        (section.id && (section.id.startsWith('test-sec-') || section.id.startsWith('test-'))) ||
        (section.section_name && section.section_name.includes('[TEST]')) ||
        ((section as unknown as Record<string, unknown>).is_test_data === true) ||
        (section.adviser_id && section.adviser_id.startsWith('test-adv-'))
    );
}

/**
 * Check whether a subject is an associated test subject
 */
export function isTestSubject(subject: Subject): boolean {
    if (!subject) return false;
    return Boolean(
        (subject.id && (subject.id.startsWith('test-subj-') || subject.id.startsWith('test-'))) ||
        (subject.subject_name && subject.subject_name.includes('[TEST]')) ||
        (subject.section_id && (subject.section_id.startsWith('test-sec-') || subject.section_id.includes('[TEST]')))
    );
}

/**
 * Check whether a student is a generated test student
 */
export function isTestStudent(student: Student): boolean {
    if (!student) return false;
    return Boolean(
        (student.id && (student.id.startsWith('test-stud-') || student.id.startsWith('test-'))) ||
        (student.lrn && (student.lrn.startsWith('999') || student.lrn.startsWith('test-'))) ||
        (student.last_name && student.last_name.includes('[TEST]')) ||
        (student.first_name && student.first_name.includes('[TEST]')) ||
        (student.student_section && (
            student.student_section.startsWith('test-sec-') ||
            student.student_section.includes('[TEST]')
        ))
    );
}

/**
 * Check whether a class record is a generated test class record
 */
export function isTestClassRecord(record: ClassRecord | Record<string, unknown>): boolean {
    if (!record) return false;
    const r = record as Record<string, unknown>;
    const id = typeof r.id === 'string' ? r.id : '';
    const sectionId = typeof r.section_id === 'string' ? r.section_id : '';
    const studentLrn = typeof r.student_lrn === 'string' ? r.student_lrn : '';
    const subjectId = typeof r.subject_id === 'string' ? r.subject_id : '';

    return Boolean(
        (id && (
            id.startsWith('test-cr-') ||
            id.startsWith('test-gs-') ||
            id.startsWith('test-') ||
            id.includes('[TEST]')
        )) ||
        (sectionId && (
            sectionId.startsWith('test-sec-') ||
            sectionId.includes('[TEST]')
        )) ||
        (studentLrn && (
            studentLrn.startsWith('999') ||
            studentLrn.startsWith('test-')
        )) ||
        (subjectId && (
            subjectId.startsWith('test-subj-') ||
            subjectId.startsWith('test-')
        ))
    );
}
