import type { Section, Subject, User, UserRole } from '../types';
import { getShsSubjectUnitInfo } from './curriculum';

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
    
    // Exclude subjects marked as 'none' (Not Offered)
    const activeSubjects = subjects.filter(s => s.term !== 'none');
    
    // If the section is purely an Advisory class without a teaching load, the user does NOT teach subjects here in E-Class Record
    if (section.is_advisory && !section.is_teaching_load) {
        return [];
    }

    // Determine the teacher's explicit teaching load subjects
    let teachingList: string[] = [];
    if (section.teaching_subjects !== undefined) {
        teachingList = section.teaching_subjects;
    } else if (section.is_teaching_load && section.taught_subjects !== undefined) {
        // Fallback only if this section was specifically designated as a teaching load in older records
        teachingList = section.taught_subjects;
    }

    const registeredNames = new Set(teachingList);
    if (section.subject_name) {
        section.subject_name.split(',').forEach(s => registeredNames.add(s.trim()));
    }

    // If teaching load subjects or subject_name are configured, strictly filter to those subjects
    if (registeredNames.size > 0) {
        const directlyLinked = activeSubjects.filter((subject) => subject.section_id === section.id && registeredNames.has(subject.subject_name));
        const gradeMatches = activeSubjects.filter(s => 
            s.grade_level === section.section_grade_level && 
            registeredNames.has(s.subject_name)
        );

        const combined = [...directlyLinked, ...gradeMatches];
        const unique: Subject[] = [];
        const seen = new Set<string>();
        
        for (const s of combined) {
            const key = s.subject_name.trim().toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(s);
            }
        }
        
        return unique.filter(s => registeredNames.has(s.subject_name));
    }

    // If marked as teaching load but 0 subjects selected: return empty
    if (section.is_teaching_load) {
        return [];
    }

    // Section-specific subjects if directly tied to the section id
    const directlyLinked = activeSubjects.filter((subject) => subject.section_id === section.id);
    if (directlyLinked.length > 0) {
        const uniqueDirect: Subject[] = [];
        const seenDirect = new Set<string>();
        for (const s of directlyLinked) {
            const key = s.subject_name.trim().toLowerCase();
            if (!seenDirect.has(key)) {
                seenDirect.add(key);
                uniqueDirect.push(s);
            }
        }
        return uniqueDirect;
    }

    return [];
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
