import type { Section, Subject, User, UserRole } from '../types';

export type AppView =
    | 'dashboard'
    | 'students'
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
    | 'calendar'
    | 'announcements'
    | 'reports'
    | 'consolidated-grades'
    | 'users'
    | 'settings'
    | 'certificates'
    | 'about';

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

// Single-user offline mode: authenticated user can access/edit all app views/features.
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
    | 'honor-roll';

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
    
    // Filter by section association
    const associatedSubjects = subjects.filter((subject) => subject.section_id === section.id);
    
    // Only show subjects that are registered in the section configuration
    if (section.is_teaching_load) {
        const registeredNames = new Set(section.taught_subjects || []);
        if (section.subject_name) {
            section.subject_name.split(',').forEach(s => registeredNames.add(s.trim()));
        }
        
        return associatedSubjects.filter(s => registeredNames.has(s.subject_name));
    }
    
    // If not a teaching load, usually no subjects should show up in E-Class Record 
    // unless they were manually added before
    return associatedSubjects;
}

export function canAccessSF9Section(user: User | null | undefined, section: Section): boolean {
    if (!user) return false;
    return !section.is_teaching_load;
}

export function filterSF9Sections(user: User | null | undefined, sections: Section[]): Section[] {
    if (!user) return [];
    return sections.filter((section) => section.is_advisory || !section.is_teaching_load);
}

export function canAccessAttendanceSection(user: User | null | undefined, section: Section): boolean {
    if (!user) return false;
    return section.is_advisory || !section.is_teaching_load;
}

export function canEditAttendanceSection(user: User | null | undefined, section: Section): boolean {
    if (!user) return false;
    return section.is_advisory || !section.is_teaching_load;
}

export function filterAttendanceSections(user: User | null | undefined, sections: Section[]): Section[] {
    if (!user) return [];
    return sections.filter((section) => section.is_advisory || !section.is_teaching_load);
}

export function filterOfficialSectionsForUser(user: User | null | undefined, sections: Section[]): Section[] {
    if (!user) return [];
    return sections.filter((section) => section.is_advisory || !section.is_teaching_load);
}

export function filterOfficialRecords<T extends { is_teaching_load?: boolean; is_advisory?: boolean }>(records: T[]): T[] {
    return records.filter((record) => record.is_advisory || !record.is_teaching_load);
}
