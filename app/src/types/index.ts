// TypeScript interfaces for the School Management System

export interface CurriculumSubject {
    name: string;
    code?: string;
    grade_levels?: string[]; // Which grades have this subject
}

export interface SchoolCurriculum {
    school_id: string;
    grade_1_subjects?: CurriculumSubject[];
    grade_2_subjects?: CurriculumSubject[];
    grade_3_subjects?: CurriculumSubject[];
    grade_4_subjects?: CurriculumSubject[];
    grade_5_subjects?: CurriculumSubject[];
    grade_6_subjects?: CurriculumSubject[];
    grade_7_subjects?: CurriculumSubject[];
    grade_8_subjects?: CurriculumSubject[];
    grade_9_subjects?: CurriculumSubject[];
    grade_10_subjects?: CurriculumSubject[];
    grade_11_subjects?: CurriculumSubject[];
    grade_12_subjects?: CurriculumSubject[];
    is_custom?: boolean; // Flag to indicate custom curriculum
}

export interface SchoolProfile {
    school_id: string;
    name: string;
    region: string;
    division: string;
    district: string;
    head_name: string;
    head_position: string;
    grade_levels_offered: string;
    municipality?: string;
    city?: string;
    province?: string;
    logo_url?: string;
    head_signature_url?: string;
    adviser_name?: string;
    grade_level?: string;
    section?: string;
    adviser_image_url?: string;
    curriculum?: SchoolCurriculum; // Custom curriculum config
    is_activated?: boolean;
    is_trial?: boolean;
    activation_key?: string;
    activated_at?: string;
    trial_activated_at?: string;
    subscription_end_date?: string;
}

export interface SchoolYear {
    sy_id: string;
    label: string;
    is_active: boolean;
    start_date?: string;
    end_date?: string;
    is_locked?: boolean;
    created_at?: string;
    updated_at?: string;
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
    weight?: number | string;
    height?: number | string;
    heightSquared?: number | string;
    bmi?: number | string;
    bmi_category?: string;
    hfa?: string;
    remarks?: string;
    enrollment_date?: string;
    photo_url?: string;
    
    // Checklist of requirements for advisory class
    req_report_card?: boolean;
    req_birth_cert?: boolean;
    req_sf10?: boolean;
    req_good_moral?: boolean;
    req_beef?: boolean;
    req_eccd?: boolean;
    req_undertaking?: boolean;
    
    // Elementary Enrolment Eligibility (SF10-ES)
    kinder_progress_report?: boolean;
    eccd_checklist?: boolean;
    kinder_completion_cert?: boolean;
    pept_checked?: boolean;
    other_checked?: boolean;
    
    // Secondary Enrolment Eligibility (SF10-JHS/SHS)
    elementary_school?: string;
    elementary_school_id?: string;
    elementary_school_address?: string;
    sy_last_attended?: string;
    average_grade?: string;
    citation?: string;
    
    // Other credentials (PEPT / ALS)
    pept_rating?: string;
    pept_date?: string; // Date of Examination/Assessment
    als_rating?: string;
    testing_center?: string; // Name and Address of Testing Center
    other_credentials?: string; // Others (Pls. Specify)
    eligibility_type?: 'Elementary' | 'PEPT' | 'ALS' | 'Other';
    is_elem_completer?: boolean;
    is_pept_passer?: boolean;
    is_als_passer?: boolean;
    is_other_eligibility?: boolean;

    // SHS Specific Enrolment and Eligibility Fields
    shs_admission_date?: string;
    is_hs_completer?: boolean;
    hs_gen_ave?: string;
    hs_graduation_date?: string;
    is_jhs_completer?: boolean;
    jhs_gen_ave?: string;
    jhs_school_name?: string;
    jhs_school_address?: string;
    jhs_graduation_date?: string;
    shs_pept_rating?: string;
    shs_pept_date?: string;
    shs_als_rating?: string;
    shs_als_clc_name_address?: string;
    shs_other_credentials?: string;
    
    // Parent info
    parent_name?: string;
    parent_contact?: string;
    parent_email?: string;
    mother_tongue?: string;
    is_ip?: boolean;
    ethnic_group?: string;
    religion?: string;
    father_name?: string;
    mother_name?: string;
    guardian_name?: string;
    guardian_relationship?: string;
    awardEvaluations?: AwardEvaluation[];
}

export interface AwardEvaluation {
    id: string; // format: `${lrn}_${schoolYear}_${term}_${awardType}`
    student_lrn: string;
    schoolYear: string;
    term: 1 | 2 | 3 | 'EOSY';
    awardType: 'Leadership' | 'Research' | 'Innovation' | 'WorkImmersion' | 'CharacterTrait' | 'GMRCMerit' | 'PerfectAttendance' | 'SpecialRecognition';
    
    // Leadership: motivational (40), planning (40), contribution (20)
    leadershipScores?: {
        motivational: number;
        planning: number;
        contribution: number;
        total: number;
        position: string;
        noDerogatory: boolean;
    };
    
    // Research / Design & Innovation: Table 1 / Table 2
    projectTitle?: string;
    projectMembers?: string[]; // Array of LRNs
    researchScores?: {
        finalGrade: number; // 20
        significance: number; // 35 or 30
        rigor?: number; // 30 (Research only)
        originality?: number; // 20 (Innovation only)
        feasibility?: number; // 20 (Innovation only)
        presentation: number; // 15 or 10
        total: number;
    };
    
    // Work Immersion details
    workImmersionDetails?: {
        grade: number;
        supervisorRating: string;
        teacherRating: string;
        isEndorsed: boolean;
    };
    
    // Character Trait
    characterTraitId?: string; // e.g. Maka-Diyos, Maka-tao, etc.
    characterTraitTitle?: string; // contextualized title
    characterTraitDescription?: string;
    
    // GMRC Merit (competency)
    gmrcCompetency?: string;
    
    // Special Recognition / custom achievement
    specialRecognitionTitle?: string;
    specialRecognitionLevel?: 'regional' | 'national' | 'international' | 'school' | string;
}


export interface Section {
    id: string;
    section_name: string;
    section_grade_level: string;
    adviser_id?: string;
    adviser_name?: string; // Teacher/Adviser Name
    subject_name?: string; // Keep for legacy/compatibility
    taught_subjects?: string[]; // List of subjects taught in this section
    is_teaching_load?: boolean; // Keep for legacy
    is_advisory?: boolean; // Flag for advisory class
    track?: string; // Track for SHS (Academic or TechPro)
    strand?: string; // Strand for SHS (STEM, ABM, HUMSS, GAS, etc.)
    section_metadata?: {
        sf9SubjectSelections?: Record<number, string>;
    };
}

export interface Subject {
    id: string;
    subject_name: string;
    subject_code?: string;
    grade_level: string;
    section_id?: string; // Link to specific section
    teacher_id?: string; // Assigned teacher
    order?: number; // Display order for reordering
    is_teaching_load?: boolean; // Flag for separate E-Class subjects
    term?: 1 | 2 | 3 | 'all' | 'none'; // The term this subject is offered in
    written_weight?: number;
    performance_weight?: number;
    exam_weight?: number;
}

export interface ClassRecord {
    id: string;
    student_lrn: string;
    section_id: string;
    subject_id: string;
    school_year: string;
    quarter: 1 | 2 | 3; // Strictly 3-term system
    written_works: (number | string)[];
    performance_tasks: (number | string)[];
    quarterly_exam: number | string;
    final_grade?: number | string;
    is_teaching_load?: boolean; // Flag for records created as part of teaching load
}

export interface Enrollment {
    id: string;
    student_lrn: string;
    school_year: string;
    grade_level?: string;
    student_section?: string;
    enrolled_at?: string;
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
    author_id?: string;
    is_cloud?: boolean;
}

export interface AttendanceRecord {
    id: string;
    student_lrn: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    section_id: string;
}

export type UserRole =
    | 'admin'
    | 'teacher'
    | 'adviser'
    | 'principal'
    | 'registrar'
    | 'parent'
    | 'guidance_counselor'
    | 'staff'
    | 'subject_leader_english'
    | 'subject_leader_mathematics'
    | 'subject_leader_science'
    | 'subject_leader_filipino'
    | 'subject_leader_ap'
    | 'subject_leader_tle'
    | 'subject_leader_mapeh'
    | 'subject_leader_esp';

export interface User {
    uid: string;
    email: string;
    role: UserRole;
    roles?: UserRole[];
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
    quarter: 1 | 2 | 3; // Strictly 3-term system
    // Key: Core Value ID (e.g., 'Maka-Diyos'), Value: Rating (AO, SO, RO, NO)
    values: Record<string, string>;
}

export interface HPSRecord {
    id: string;
    subject_id: string; // Unique per section in this system
    school_year: string;
    quarter: 1 | 2 | 3; // Strictly 3-term system
    written_works: (number | string)[];
    performance_tasks: (number | string)[];
    quarterly_exam: number | string;
}

export interface SF2Sheet {
    id: string; // format: `${section_id}_${school_year}_${month}`
    section_id: string;
    school_year: string;
    month: string; // e.g., "JUNE"
    date_labels: Record<number, string>; // { 1: "3", 2: "4", ... }
    attendance: Record<string, Record<string | number, string>>; // { "LRN123": { 1: "absent", 2: "tardy" } }
    remarks: Record<string, string>; // { "LRN123": "NLS - reasons..." }
    updated_at: string;
}

// Calendar Event
export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    date: string; // YYYY-MM-DD
    end_date?: string; // YYYY-MM-DD for multi-day events
    type: 'holiday' | 'exam' | 'event' | 'deadline' | 'meeting' | 'break' | 'national';
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

