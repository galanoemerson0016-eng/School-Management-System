import type { Section, Subject, Student, ClassRecord } from '../types';

/**
 * Check whether a section is a generated test section
 */
export function isTestSection(section: Section): boolean {
    if (!section) return false;
    return (section as unknown as Record<string, unknown>).is_test_data === true;
}

/**
 * Check whether a subject is an associated test subject
 */
export function isTestSubject(subject: Subject): boolean {
    if (!subject) return false;
    return (subject as unknown as Record<string, unknown>).is_test_data === true;
}

/**
 * Check whether a student is a generated test student
 */
export function isTestStudent(student: Student): boolean {
    if (!student) return false;
    return (student as unknown as Record<string, unknown>).is_test_data === true;
}

/**
 * Check whether a class record is a generated test class record
 */
export function isTestClassRecord(record: ClassRecord | Record<string, unknown>): boolean {
    if (!record) return false;
    const r = record as Record<string, unknown>;
    return r.is_test_data === true;
}
