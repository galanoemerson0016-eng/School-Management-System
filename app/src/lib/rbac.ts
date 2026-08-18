import type { Section, Subject, User, UserRole } from '../types';
import { normalizeSubjectName } from './subjectConfig';

export type AppView =
    | 'dashboard'
    | 'students'
    | 'enrollment'
    | 'institute'
    | 'subjects'
    | 'sections'
    | 'class-record'
    | 'eclass'
    | 'sf9'
    | 'sf10'
    | 'sf8'
    | 'sf5'
    | 'sf6'
    | 'school-forms'
    | 'attendance'
    | 'daily-attendance'
    | 'calendar'
    | 'announcements'
    | 'reports'
    | 'name-tags'
    | 'consolidated-grades'
    | 'users'
    | 'settings'
    | 'certificates'
    | 'about'
    | 'lir'
    | 'tgs'
    | 'student-id-generator'
    | 'games-tools'
    | 'online-generators';

export type SubjectArea =
    | 'English'
    | 'Mathematics'
    | 'Science'
    | 'Filipino'
    | 'Araling Panlipunan (AP)'
    | 'Technology and Livelihood Education (TLE)'
    | 'MAPEH'
    | 'Edukasyon sa Pagpapakatao (ESP) / Values Education';

const SUBJECT_AREA_ALIASES: Array<{ match: RegExp; area: SubjectArea }> = [
    { match: /english/i, area: 'English' },
    { match: /mathematics|\bmath\b/i, area: 'Mathematics' },
    { match: /science/i, area: 'Science' },
    { match: /filipino/i, area: 'Filipino' },
    { match: /araling panlipunan|\bap\b/i, area: 'Araling Panlipunan (AP)' },
    { match: /technology and livelihood education|\btle\b/i, area: 'Technology and Livelihood Education (TLE)' },
    { match: /mapeh|music|arts|physical education|health/i, area: 'MAPEH' },
    { match: /edukasyon sa pagpapakatao|values education|\besp\b/i, area: 'Edukasyon sa Pagpapakatao (ESP) / Values Education' },
];

const roleForArea: Record<SubjectArea, UserRole> = {
    English: 'subject_leader_english',
    Mathematics: 'subject_leader_mathematics',
    Science: 'subject_leader_science',
    Filipino: 'subject_leader_filipino',
    'Araling Panlipunan (AP)': 'subject_leader_ap',
    'Technology and Livelihood Education (TLE)': 'subject_leader_tle',
    MAPEH: 'subject_leader_mapeh',
    'Edukasyon sa Pagpapakatao (ESP) / Values Education': 'subject_leader_esp',
};

export function getEffectiveRoles(user: User | null | undefined): UserRole[] {
    if (!user) return [];
    const roles = [user.role, ...(user.roles || [])].filter(Boolean) as UserRole[];
    return Array.from(new Set(roles));
}

export function hasRole(user: User | null | undefined, role: UserRole): boolean {
    return getEffectiveRoles(user).includes(role);
}

export function hasAnyRole(user: User | null | undefined, roles: UserRole[]): boolean {
    const effective = getEffectiveRoles(user);
    return roles.some((role) => effective.includes(role));
}

// Single-user offline mode: all can*() functions return true for any authenticated
// user regardless of their assigned role. This is intentional for the current
// single-user architecture — there is no multi-user enforcement surface.
// IMPORTANT: If multi-user mode is ever added, every function below must be
// updated to check user.role / user.roles[] before any gates become meaningful.
export function canAccessView(user: User | null | undefined, _view: AppView): boolean {
    return !!user;
}

export function canEditClassesAndSubjects(user: User | null | undefined): boolean {
    return !!user;
}

export function canManageSchoolProfile(user: User | null | undefined): boolean {
    return !!user;
}

export function canPurgeMaintenance(user: User | null | undefined): boolean {
    return !!user;
}

export function canManagePublicPosts(user: User | null | undefined): boolean {
    return !!user;
}

export function canManageCalendarEvents(user: User | null | undefined): boolean {
    return !!user;
}

// Student ID Generator. Any authenticated user can issue/print IDs (advisers are
// scoped to their advisory sections via the existing section filters). Editing the
// school-wide template/branding goes through canManageIdTemplates — both return
// !!user today and act as the enforcement seam if multi-user mode is added later.
export function canGenerateStudentIds(user: User | null | undefined): boolean {
    return !!user;
}

export function canManageIdTemplates(user: User | null | undefined): boolean {
    return !!user;
}

export function getSubjectAreaFromName(subjectName: string): SubjectArea | null {
    const matched = SUBJECT_AREA_ALIASES.find((entry) => entry.match.test(subjectName.trim()));
    return matched?.area || null;
}

export function subjectLeaderRoleForArea(area: SubjectArea): UserRole {
    return roleForArea[area];
}

export function isSubjectLeaderForArea(_user: User | null | undefined, _area: SubjectArea): boolean {
    return true;
}

export function canAccessEClassSection(user: User | null | undefined, _section: Section, _subjects: Subject[]): boolean {
    return !!user;
}

export function canEditEClassSection(user: User | null | undefined, _section: Section, _subject: Subject | null | undefined): boolean {
    return !!user;
}

export type ReportType =
    | 'certificate-generator'
    | 'consolidated-grade-sheet'
    | 'quarterly-summaries'
    | 'subject-performance'
    | 'learner-progress'
    | 'at-risk-students'
    | 'honor-roll'
    | 'requirements-checklist';

export function canViewReport(user: User | null | undefined, _report: ReportType): boolean {
    return !!user;
}

export function canEditReport(user: User | null | undefined, _report: ReportType): boolean {
    return !!user;
}

export function filterSectionsForUser(user: User | null | undefined, sections: Section[], _subjects: Subject[]): Section[] {
    if (!user) return [];
    return sections;
}

export function filterSubjectsForSection(user: User | null | undefined, section: Section | null | undefined, subjects: Subject[]): Subject[] {
    if (!user || !section) return [];
    
    // First, find subjects directly linked to this section
    const directlyLinked = subjects.filter((subject) => subject.section_id === section.id && subject.term !== 'none');
    
    // Collect all registered names from taught_subjects and subject_name
    const registeredNames = new Set(section.taught_subjects || []);
    if (section.subject_name) {
        section.subject_name.split(',').forEach(s => {
            const trimmed = s.trim();
            if (trimmed) registeredNames.add(trimmed);
        });
    }
    const normRegisteredNames = new Set(
        Array.from(registeredNames).map(n => normalizeSubjectName(n))
    );

    const isRegistered = (subjName: string) => {
        if (registeredNames.has(subjName)) return true;
        const norm = normalizeSubjectName(subjName);
        return normRegisteredNames.has(norm);
    };

    if (section.is_teaching_load || registeredNames.size > 0) {
        // Find existing catalog subjects that match the grade level and are selected as taught
        const gradeMatches = subjects.filter(s => 
            (s.grade_level === section.section_grade_level || !s.grade_level) && 
            isRegistered(s.subject_name)
        );

        // Combine directly linked and catalog matches
        const combined: Subject[] = [...directlyLinked, ...gradeMatches];
        const seenNorms = new Set<string>();
        const result: Subject[] = [];
        
        for (const s of combined) {
            const norm = normalizeSubjectName(s.subject_name);
            if (norm && !seenNorms.has(norm)) {
                seenNorms.add(norm);
                result.push({
                    ...s,
                    // If explicitly registered in this section, ensure term is active
                    term: s.term === 'none' ? 'all' : s.term
                });
            }
        }

        // For any registered subject name that did NOT match an existing catalog subject,
        // dynamically synthesize a Subject object for this section so custom subjects (e.g. "Research 2") are never lost
        for (const regName of Array.from(registeredNames)) {
            const norm = normalizeSubjectName(regName);
            if (norm && !seenNorms.has(norm)) {
                seenNorms.add(norm);
                result.push({
                    id: `custom_${section.id}_${norm}`,
                    subject_name: regName,
                    grade_level: section.section_grade_level,
                    section_id: section.id,
                    teacher_id: user?.uid,
                    term: 'all'
                } as Subject);
            }
        }

        if (result.length > 0) {
            return result;
        }
    }
    
    // Fallback: if not a teaching load and no subjects checked, return all active subjects for that grade level
    const gradeLevelSubjects = subjects.filter(s => 
        s.grade_level === section.section_grade_level && 
        s.term !== 'none'
    );
    
    const fallbackList = gradeLevelSubjects.length > 0
        ? gradeLevelSubjects
        : subjects.filter(s => s.grade_level === section.section_grade_level);

    if (fallbackList.length > 0) {
        const unique: Subject[] = [];
        const seen = new Set<string>();
        for (const s of fallbackList) {
            const key = normalizeSubjectName(s.subject_name) || s.subject_name.trim().toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                unique.push({
                    ...s,
                    term: s.term === 'none' ? 'all' : s.term
                });
            }
        }
        return unique;
    }
    
    const uniqueDirect: Subject[] = [];
    const seenDirect = new Set<string>();
    for (const s of directlyLinked) {
        const key = normalizeSubjectName(s.subject_name) || s.subject_name.trim().toLowerCase();
        if (!seenDirect.has(key)) {
            seenDirect.add(key);
            uniqueDirect.push(s);
        }
    }
    return uniqueDirect;
}

export function canAccessSF9Section(user: User | null | undefined, _section: Section): boolean {
    return !!user;
}

export function filterSF9Sections(user: User | null | undefined, sections: Section[]): Section[] {
    if (!user) return [];
    return sections;
}

export function canAccessAttendanceSection(user: User | null | undefined, _section: Section): boolean {
    return !!user;
}

export function canEditAttendanceSection(user: User | null | undefined, _section: Section): boolean {
    return !!user;
}

export function filterAttendanceSections(user: User | null | undefined, sections: Section[]): Section[] {
    if (!user) return [];
    return sections;
}

export function filterOfficialSectionsForUser(user: User | null | undefined, sections: Section[]): Section[] {
    if (!user) return [];
    return sections;
}

export function filterOfficialRecords<T extends { is_teaching_load?: boolean; is_advisory?: boolean }>(records: T[]): T[] {
    return records;
}
