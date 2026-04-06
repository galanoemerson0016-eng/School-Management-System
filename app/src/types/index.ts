// TypeScript interfaces for the School Management System

export interface SchoolProfile {
    school_id: string;
    name: string;
    region: string;
    division: string;
    district: string;
    head_name: string;
    head_position: string;
    grade_levels_offered: string;
    logo_url?: string;
}

export interface SchoolYear {
    sy_id: string;
    label: string;
    is_active: boolean;
    start_date: Date;
    end_date: Date;
}

export interface Student {
    lrn: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    name_extension?: string;
    gender: 'Male' | 'Female';
    birthday: string;
    age: number;
    address: string;
    contact_number?: string;
    grade_level: string;
    student_section?: string;
    track?: string;
    strand?: string;
    enrollment_date?: string;
    photo_url?: string;
    // Elementary completer info
    elementary_school?: string;
    elementary_school_id?: string;
    elementary_school_address?: string;
    sy_last_attended?: string;
    average_grade?: string;
    citation?: string;
    // High School completer info (SF10)
    shs_admission_date?: string;
    hs_gen_average?: string;
    jhs_gen_average?: string;
    graduation_date?: string;
    hs_school_name?: string;
    hs_school_address?: string;
    // Other credentials
    pept_rating?: string;
    pept_date?: string;
    als_rating?: string;
    testing_center?: string;
    other_credentials?: string;
    // Parent info
    parent_name?: string;
    parent_contact?: string;
    parent_email?: string;
}

export interface Section {
    id: string;
    section_name: string;
    section_grade_level: string;
    section_room?: string;
    adviser_id?: string;
    adviser_name?: string; // Teacher/Adviser Name
}

export interface Subject {
    id: string;
    subject_name: string;
    subject_code?: string;
    grade_level: string;
    section_id?: string; // Link to specific section
    teacher_id?: string; // Assigned teacher
}

export interface ClassRecord {
    id: string;
    student_lrn: string;
    section_id: string;
    subject_id: string;
    school_year: string;
    quarter: 1 | 2 | 3 | 4;
    written_works: number[];
    performance_tasks: number[];
    quarterly_exam: number;
    final_grade?: number;
}

export interface Enrollment {
    id: string;
    student_lrn: string;
    section_id: string;
    school_year: string;
    enrolled_at: Date;
}

export interface Announcement {
    id: string;
    announcement_title: string;
    announcement_content: string;
    announcement_date: string;
    announcement_type: 'general' | 'urgent' | 'event';
    is_pinned?: boolean;
    category?: string;
    created_by?: string;
}

export interface AttendanceRecord {
    id: string;
    student_lrn: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    section_id: string;
}

export type UserRole = 'admin' | 'teacher' | 'parent';

export interface User {
    uid: string;
    email: string;
    role: UserRole;
    displayName?: string;
}

// Navigation item type
export interface NavItem {
    id: string;
    icon: string;
    label: string;
}

export interface ObservedValues {
    id: string;
    student_lrn: string;
    school_year: string; // To track year
    quarter: 1 | 2 | 3 | 4;
    // Key: Core Value ID (e.g., 'Maka-Diyos'), Value: Rating (AO, SO, RO, NO)
    values: Record<string, string>;
}

export interface HPSRecord {
    id: string;
    subject_id: string; // Unique per section in this system
    school_year: string;
    quarter: 1 | 2 | 3 | 4;
    written_works: number[];
    performance_tasks: number[];
    quarterly_exam: number;
}

export interface SF2Sheet {
    id: string; // format: `${section_id}_${school_year}_${month}`
    section_id: string;
    school_year: string;
    month: string; // e.g., "JUNE"
    date_labels: Record<number, string>; // { 1: "3", 2: "4", ... }
    attendance: Record<string, Record<number, string>>; // { "LRN123": { 1: "absent", 2: "tardy" } }
    updated_at: string;
}

// Calendar Event
export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    date: string; // YYYY-MM-DD
    end_date?: string; // YYYY-MM-DD for multi-day events
    type: 'holiday' | 'exam' | 'event' | 'deadline' | 'meeting';
    color?: string;
    created_by?: string;
}

// Activity Log
export interface ActivityLog {
    id: string;
    action: string; // e.g., 'grade_updated', 'student_added'
    details: string;
    user_id: string;
    user_name: string;
    timestamp: string;
    entity_type?: string; // 'student' | 'grade' | 'attendance' etc.
    entity_id?: string;
}

// Notification
export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    read: boolean;
    timestamp: string;
    link?: string; // Navigation target
}
