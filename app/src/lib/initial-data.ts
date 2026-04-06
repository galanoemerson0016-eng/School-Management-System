import type { SchoolProfile, Student, Section, Subject, ClassRecord, ObservedValues, HPSRecord } from '../types';

export const defaultSchoolProfile: SchoolProfile = {
    school_id: '123456',
    name: 'Sample Elementary School',
    region: 'Region IV-A',
    division: 'Division of Cavite',
    district: 'District I',
    head_name: 'Juan A. Dela Cruz',
    head_position: 'OIC-School Head, HT-VI',
    grade_levels_offered: 'Grade 7-12',
    logo_url: '/school-logo.png',
};

// Default subjects by grade level (MATATAG Curriculum)
export const defaultSubjects: Subject[] = [
    // ===== Grade 7 Subjects =====
    { id: 'g7-filipino', subject_name: 'Filipino', grade_level: 'Grade 7' },
    { id: 'g7-english', subject_name: 'English', grade_level: 'Grade 7' },
    { id: 'g7-math', subject_name: 'Mathematics', grade_level: 'Grade 7' },
    { id: 'g7-science', subject_name: 'Science', grade_level: 'Grade 7' },
    { id: 'g7-ap', subject_name: 'Araling Panlipunan', grade_level: 'Grade 7' },
    { id: 'g7-values', subject_name: 'Values Education', grade_level: 'Grade 7' },
    { id: 'g7-tle', subject_name: 'Technology and Livelihood Education', grade_level: 'Grade 7' },
    { id: 'g7-mapeh', subject_name: 'MAPEH', grade_level: 'Grade 7' },
    { id: 'g7-music-arts', subject_name: 'Music and Arts', subject_code: 'MAPEH', grade_level: 'Grade 7' },
    { id: 'g7-pe-health', subject_name: 'Physical Education and Health', subject_code: 'MAPEH', grade_level: 'Grade 7' },

    // ===== Grade 8 Subjects =====
    { id: 'g8-filipino', subject_name: 'Filipino', grade_level: 'Grade 8' },
    { id: 'g8-english', subject_name: 'English', grade_level: 'Grade 8' },
    { id: 'g8-math', subject_name: 'Mathematics', grade_level: 'Grade 8' },
    { id: 'g8-science', subject_name: 'Science', grade_level: 'Grade 8' },
    { id: 'g8-ap', subject_name: 'Araling Panlipunan', grade_level: 'Grade 8' },
    { id: 'g8-values', subject_name: 'Values Education', grade_level: 'Grade 8' },
    { id: 'g8-tle', subject_name: 'Technology and Livelihood Education', grade_level: 'Grade 8' },
    { id: 'g8-mapeh', subject_name: 'MAPEH', grade_level: 'Grade 8' },
    { id: 'g8-music-arts', subject_name: 'Music and Arts', subject_code: 'MAPEH', grade_level: 'Grade 8' },
    { id: 'g8-pe-health', subject_name: 'Physical Education and Health', subject_code: 'MAPEH', grade_level: 'Grade 8' },

    // ===== Grade 9 Subjects =====
    { id: 'g9-filipino', subject_name: 'Filipino', grade_level: 'Grade 9' },
    { id: 'g9-english', subject_name: 'English', grade_level: 'Grade 9' },
    { id: 'g9-math', subject_name: 'Mathematics', grade_level: 'Grade 9' },
    { id: 'g9-science', subject_name: 'Science', grade_level: 'Grade 9' },
    { id: 'g9-ap', subject_name: 'Araling Panlipunan (AP)', grade_level: 'Grade 9' },
    { id: 'g9-esp', subject_name: 'Edukasyon sa Pagpapakatao (EsP)', grade_level: 'Grade 9' },
    { id: 'g9-tle', subject_name: 'Technology and Livelihood Education', grade_level: 'Grade 9' },
    { id: 'g9-mapeh', subject_name: 'MAPEH', grade_level: 'Grade 9' },
    { id: 'g9-music', subject_name: 'Music', subject_code: 'MAPEH', grade_level: 'Grade 9' },
    { id: 'g9-arts', subject_name: 'Arts', subject_code: 'MAPEH', grade_level: 'Grade 9' },
    { id: 'g9-pe', subject_name: 'Physical Education (PE)', subject_code: 'MAPEH', grade_level: 'Grade 9' },
    { id: 'g9-health', subject_name: 'Health', subject_code: 'MAPEH', grade_level: 'Grade 9' },

    // ===== Grade 10 Subjects =====
    { id: 'g10-filipino', subject_name: 'Filipino', grade_level: 'Grade 10' },
    { id: 'g10-english', subject_name: 'English', grade_level: 'Grade 10' },
    { id: 'g10-math', subject_name: 'Mathematics', grade_level: 'Grade 10' },
    { id: 'g10-science', subject_name: 'Science', grade_level: 'Grade 10' },
    { id: 'g10-ap', subject_name: 'Araling Panlipunan (AP)', grade_level: 'Grade 10' },
    { id: 'g10-esp', subject_name: 'Edukasyon sa Pagpapakatao (EsP)', grade_level: 'Grade 10' },
    { id: 'g10-tle', subject_name: 'Technology and Livelihood Education', grade_level: 'Grade 10' },
    { id: 'g10-mapeh', subject_name: 'MAPEH', grade_level: 'Grade 10' },
    { id: 'g10-music', subject_name: 'Music', subject_code: 'MAPEH', grade_level: 'Grade 10' },
    { id: 'g10-arts', subject_name: 'Arts', subject_code: 'MAPEH', grade_level: 'Grade 10' },
    { id: 'g10-pe', subject_name: 'Physical Education (PE)', subject_code: 'MAPEH', grade_level: 'Grade 10' },
    { id: 'g10-health', subject_name: 'Health', subject_code: 'MAPEH', grade_level: 'Grade 10' },
];

// Default sections (1 per grade level for testing)
export const defaultSections: Section[] = [
    { id: 'sec-g7-einstein', section_name: 'Einstein', section_grade_level: 'Grade 7', section_room: 'Room 101' },
    { id: 'sec-g8-curie', section_name: 'Curie', section_grade_level: 'Grade 8', section_room: 'Room 102' },
    { id: 'sec-g9-newton', section_name: 'Newton', section_grade_level: 'Grade 9', section_room: 'Room 103' },
    { id: 'sec-g10-darwin', section_name: 'Darwin', section_grade_level: 'Grade 10', section_room: 'Room 104' },
];

// Default students (3 per grade level for testing)
export const defaultStudents: Student[] = [
    // Grade 7 Students
    { lrn: '100000000001', first_name: 'Juan', last_name: 'Dela Cruz', middle_name: 'Santos', gender: 'Male', birthday: '2012-05-15', age: 12, address: '123 Rizal St., Cavite City', grade_level: 'Grade 7', student_section: 'Einstein' },
    { lrn: '100000000002', first_name: 'Maria', last_name: 'Santos', middle_name: 'Reyes', gender: 'Female', birthday: '2012-08-20', age: 12, address: '456 Bonifacio St., Cavite City', grade_level: 'Grade 7', student_section: 'Einstein' },
    { lrn: '100000000003', first_name: 'Pedro', last_name: 'Reyes', middle_name: 'Garcia', gender: 'Male', birthday: '2012-03-10', age: 12, address: '789 Mabini St., Cavite City', grade_level: 'Grade 7', student_section: 'Einstein' },

    // Grade 8 Students
    { lrn: '100000000004', first_name: 'Ana', last_name: 'Garcia', middle_name: 'Lopez', gender: 'Female', birthday: '2011-06-25', age: 13, address: '321 Luna St., Cavite City', grade_level: 'Grade 8', student_section: 'Curie' },
    { lrn: '100000000005', first_name: 'Jose', last_name: 'Lopez', middle_name: 'Cruz', gender: 'Male', birthday: '2011-11-12', age: 13, address: '654 Aguinaldo St., Cavite City', grade_level: 'Grade 8', student_section: 'Curie' },
    { lrn: '100000000006', first_name: 'Carmen', last_name: 'Cruz', middle_name: 'Santos', gender: 'Female', birthday: '2011-02-28', age: 13, address: '987 Del Pilar St., Cavite City', grade_level: 'Grade 8', student_section: 'Curie' },

    // Grade 9 Students
    { lrn: '100000000007', first_name: 'Miguel', last_name: 'Ramos', middle_name: 'Flores', gender: 'Male', birthday: '2010-07-18', age: 14, address: '147 Quezon St., Cavite City', grade_level: 'Grade 9', student_section: 'Newton' },
    { lrn: '100000000008', first_name: 'Isabella', last_name: 'Flores', middle_name: 'Torres', gender: 'Female', birthday: '2010-09-30', age: 14, address: '258 Marcos St., Cavite City', grade_level: 'Grade 9', student_section: 'Newton' },
    { lrn: '100000000009', first_name: 'Antonio', last_name: 'Torres', middle_name: 'Ramos', gender: 'Male', birthday: '2010-04-05', age: 14, address: '369 Roxas St., Cavite City', grade_level: 'Grade 9', student_section: 'Newton' },

    // Grade 10 Students
    { lrn: '100000000010', first_name: 'Sofia', last_name: 'Mendoza', middle_name: 'Villanueva', gender: 'Female', birthday: '2009-12-08', age: 15, address: '741 Magsaysay St., Cavite City', grade_level: 'Grade 10', student_section: 'Darwin' },
    { lrn: '100000000011', first_name: 'Carlos', last_name: 'Villanueva', middle_name: 'Aquino', gender: 'Male', birthday: '2009-01-22', age: 15, address: '852 Osmeña St., Cavite City', grade_level: 'Grade 10', student_section: 'Darwin' },
    { lrn: '100000000012', first_name: 'Elena', last_name: 'Aquino', middle_name: 'Mendoza', gender: 'Female', birthday: '2009-10-14', age: 15, address: '963 Garcia St., Cavite City', grade_level: 'Grade 10', student_section: 'Darwin' },
];

// Pre-filled Class Records for testing (Juan Dela Cruz - Grade 7)
export const defaultClassRecords: ClassRecord[] = [
    // Filipino - All 4 quarters
    { id: 'cr-1', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-filipino', school_year: '2025-2026', quarter: 1, written_works: [18, 17, 19, 16, 18, 15, 17, 18, 16, 19], performance_tasks: [18, 19, 17, 18, 16, 19, 17, 18, 16, 17], quarterly_exam: 42, final_grade: 87 },
    { id: 'cr-2', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-filipino', school_year: '2025-2026', quarter: 2, written_works: [17, 18, 16, 17, 19, 18, 16, 17, 18, 16], performance_tasks: [17, 18, 19, 16, 17, 18, 19, 16, 17, 18], quarterly_exam: 44, final_grade: 88 },
    { id: 'cr-3', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-filipino', school_year: '2025-2026', quarter: 3, written_works: [19, 18, 17, 18, 16, 17, 18, 19, 17, 18], performance_tasks: [18, 17, 18, 19, 17, 16, 18, 19, 17, 18], quarterly_exam: 43, final_grade: 88 },
    { id: 'cr-4', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-filipino', school_year: '2025-2026', quarter: 4, written_works: [18, 19, 17, 18, 17, 18, 19, 17, 18, 16], performance_tasks: [19, 18, 17, 18, 19, 17, 18, 16, 18, 17], quarterly_exam: 45, final_grade: 89 },
    // English - All 4 quarters
    { id: 'cr-5', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-english', school_year: '2025-2026', quarter: 1, written_works: [19, 18, 17, 18, 19, 17, 18, 16, 18, 17], performance_tasks: [18, 17, 19, 18, 16, 17, 18, 19, 17, 18], quarterly_exam: 44, final_grade: 89 },
    { id: 'cr-6', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-english', school_year: '2025-2026', quarter: 2, written_works: [18, 17, 18, 19, 17, 18, 16, 17, 18, 19], performance_tasks: [17, 18, 17, 18, 19, 16, 17, 18, 19, 17], quarterly_exam: 43, final_grade: 88 },
    { id: 'cr-7', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-english', school_year: '2025-2026', quarter: 3, written_works: [17, 18, 19, 17, 18, 16, 18, 17, 19, 18], performance_tasks: [18, 19, 17, 16, 18, 17, 19, 18, 16, 17], quarterly_exam: 42, final_grade: 87 },
    { id: 'cr-8', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-english', school_year: '2025-2026', quarter: 4, written_works: [19, 18, 17, 18, 19, 18, 17, 18, 16, 18], performance_tasks: [18, 17, 18, 19, 17, 18, 16, 17, 18, 19], quarterly_exam: 46, final_grade: 90 },
    // Mathematics - All 4 quarters
    { id: 'cr-9', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-math', school_year: '2025-2026', quarter: 1, written_works: [17, 16, 18, 17, 15, 16, 17, 18, 16, 17], performance_tasks: [16, 17, 18, 16, 17, 15, 16, 17, 18, 16], quarterly_exam: 40, final_grade: 84 },
    { id: 'cr-10', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-math', school_year: '2025-2026', quarter: 2, written_works: [18, 17, 16, 17, 18, 16, 17, 16, 17, 18], performance_tasks: [17, 16, 17, 18, 16, 17, 18, 16, 17, 16], quarterly_exam: 41, final_grade: 85 },
    { id: 'cr-11', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-math', school_year: '2025-2026', quarter: 3, written_works: [16, 17, 18, 16, 17, 18, 16, 17, 18, 16], performance_tasks: [18, 16, 17, 16, 18, 17, 16, 17, 18, 16], quarterly_exam: 42, final_grade: 86 },
    { id: 'cr-12', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-math', school_year: '2025-2026', quarter: 4, written_works: [17, 18, 17, 16, 17, 18, 17, 16, 17, 18], performance_tasks: [16, 17, 18, 17, 16, 17, 18, 17, 16, 17], quarterly_exam: 43, final_grade: 87 },
    // Science - All 4 quarters
    { id: 'cr-13', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-science', school_year: '2025-2026', quarter: 1, written_works: [18, 17, 19, 18, 17, 16, 18, 17, 19, 18], performance_tasks: [17, 18, 17, 18, 19, 17, 18, 16, 17, 18], quarterly_exam: 43, final_grade: 88 },
    { id: 'cr-14', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-science', school_year: '2025-2026', quarter: 2, written_works: [17, 18, 17, 19, 18, 17, 16, 18, 17, 19], performance_tasks: [18, 17, 18, 17, 18, 19, 17, 18, 17, 16], quarterly_exam: 44, final_grade: 89 },
    { id: 'cr-15', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-science', school_year: '2025-2026', quarter: 3, written_works: [19, 18, 17, 18, 17, 18, 17, 19, 18, 17], performance_tasks: [17, 18, 19, 17, 18, 17, 18, 17, 18, 19], quarterly_exam: 45, final_grade: 90 },
    { id: 'cr-16', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-science', school_year: '2025-2026', quarter: 4, written_works: [18, 17, 18, 19, 18, 17, 18, 17, 18, 19], performance_tasks: [18, 19, 17, 18, 17, 18, 19, 17, 18, 17], quarterly_exam: 44, final_grade: 89 },
    // Araling Panlipunan - All 4 quarters
    { id: 'cr-17', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-ap', school_year: '2025-2026', quarter: 1, written_works: [17, 18, 16, 17, 18, 16, 17, 18, 16, 17], performance_tasks: [18, 17, 18, 16, 17, 18, 16, 17, 18, 16], quarterly_exam: 41, final_grade: 86 },
    { id: 'cr-18', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-ap', school_year: '2025-2026', quarter: 2, written_works: [18, 17, 18, 16, 17, 18, 16, 17, 18, 16], performance_tasks: [17, 18, 17, 18, 16, 17, 18, 16, 17, 18], quarterly_exam: 42, final_grade: 87 },
    { id: 'cr-19', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-ap', school_year: '2025-2026', quarter: 3, written_works: [16, 17, 18, 17, 18, 16, 17, 18, 17, 18], performance_tasks: [18, 16, 17, 18, 17, 18, 16, 17, 18, 17], quarterly_exam: 43, final_grade: 88 },
    { id: 'cr-20', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-ap', school_year: '2025-2026', quarter: 4, written_works: [17, 18, 17, 18, 16, 17, 18, 17, 18, 16], performance_tasks: [16, 17, 18, 17, 18, 16, 17, 18, 17, 18], quarterly_exam: 44, final_grade: 88 },
    // Values Education - All 4 quarters
    { id: 'cr-21', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-values', school_year: '2025-2026', quarter: 1, written_works: [19, 18, 19, 18, 17, 18, 19, 18, 17, 18], performance_tasks: [18, 19, 18, 17, 18, 19, 18, 17, 18, 19], quarterly_exam: 45, final_grade: 91 },
    { id: 'cr-22', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-values', school_year: '2025-2026', quarter: 2, written_works: [18, 19, 18, 17, 18, 19, 18, 17, 18, 19], performance_tasks: [19, 18, 17, 18, 19, 18, 17, 18, 19, 18], quarterly_exam: 46, final_grade: 92 },
    { id: 'cr-23', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-values', school_year: '2025-2026', quarter: 3, written_works: [17, 18, 19, 18, 19, 18, 17, 18, 19, 18], performance_tasks: [18, 17, 18, 19, 18, 17, 18, 19, 18, 17], quarterly_exam: 44, final_grade: 90 },
    { id: 'cr-24', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-values', school_year: '2025-2026', quarter: 4, written_works: [18, 19, 18, 19, 18, 17, 18, 19, 18, 17], performance_tasks: [17, 18, 19, 18, 17, 18, 19, 18, 17, 18], quarterly_exam: 45, final_grade: 91 },
    // TLE - All 4 quarters
    { id: 'cr-25', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-tle', school_year: '2025-2026', quarter: 1, written_works: [16, 17, 16, 15, 16, 17, 16, 15, 16, 17], performance_tasks: [18, 19, 18, 17, 18, 19, 18, 17, 18, 19], quarterly_exam: 40, final_grade: 87 },
    { id: 'cr-26', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-tle', school_year: '2025-2026', quarter: 2, written_works: [17, 16, 15, 16, 17, 16, 15, 16, 17, 16], performance_tasks: [19, 18, 17, 18, 19, 18, 17, 18, 19, 18], quarterly_exam: 41, final_grade: 88 },
    { id: 'cr-27', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-tle', school_year: '2025-2026', quarter: 3, written_works: [15, 16, 17, 16, 15, 16, 17, 16, 15, 16], performance_tasks: [17, 18, 19, 18, 17, 18, 19, 18, 17, 18], quarterly_exam: 42, final_grade: 89 },
    { id: 'cr-28', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-tle', school_year: '2025-2026', quarter: 4, written_works: [16, 15, 16, 17, 16, 15, 16, 17, 16, 15], performance_tasks: [18, 17, 18, 19, 18, 17, 18, 19, 18, 17], quarterly_exam: 43, final_grade: 90 },
    // MAPEH is calculated in SF9 as average of Music and Arts + PE and Health (no separate records)
    // Music and Arts - All 4 quarters
    { id: 'cr-33', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-music-arts', school_year: '2025-2026', quarter: 1, written_works: [18, 17, 18, 17, 16, 17, 18, 17, 16, 17], performance_tasks: [19, 18, 19, 18, 19, 18, 17, 18, 19, 18], quarterly_exam: 43, final_grade: 90 },
    { id: 'cr-34', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-music-arts', school_year: '2025-2026', quarter: 2, written_works: [17, 18, 17, 16, 17, 18, 17, 16, 17, 18], performance_tasks: [18, 19, 18, 19, 18, 17, 18, 19, 18, 17], quarterly_exam: 44, final_grade: 91 },
    { id: 'cr-35', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-music-arts', school_year: '2025-2026', quarter: 3, written_works: [16, 17, 18, 17, 18, 17, 16, 17, 18, 17], performance_tasks: [17, 18, 19, 18, 17, 18, 19, 18, 17, 18], quarterly_exam: 42, final_grade: 89 },
    { id: 'cr-36', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-music-arts', school_year: '2025-2026', quarter: 4, written_works: [17, 16, 17, 18, 17, 16, 17, 18, 17, 16], performance_tasks: [18, 17, 18, 19, 18, 17, 18, 19, 18, 17], quarterly_exam: 45, final_grade: 92 },
    // PE and Health - All 4 quarters
    { id: 'cr-37', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-pe-health', school_year: '2025-2026', quarter: 1, written_works: [16, 15, 16, 17, 16, 15, 16, 17, 16, 15], performance_tasks: [19, 20, 19, 18, 19, 20, 19, 18, 19, 20], quarterly_exam: 41, final_grade: 91 },
    { id: 'cr-38', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-pe-health', school_year: '2025-2026', quarter: 2, written_works: [15, 16, 17, 16, 15, 16, 17, 16, 15, 16], performance_tasks: [20, 19, 18, 19, 20, 19, 18, 19, 20, 19], quarterly_exam: 42, final_grade: 92 },
    { id: 'cr-39', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-pe-health', school_year: '2025-2026', quarter: 3, written_works: [17, 16, 15, 16, 17, 16, 15, 16, 17, 16], performance_tasks: [18, 19, 20, 19, 18, 19, 20, 19, 18, 19], quarterly_exam: 43, final_grade: 93 },
    { id: 'cr-40', student_lrn: '100000000001', section_id: 'sec-g7-einstein', subject_id: 'g7-pe-health', school_year: '2025-2026', quarter: 4, written_works: [16, 17, 16, 15, 16, 17, 16, 15, 16, 17], performance_tasks: [19, 18, 19, 20, 19, 18, 19, 20, 19, 18], quarterly_exam: 44, final_grade: 94 },
];

// Pre-filled Observed Values for testing (Juan Dela Cruz - Grade 7)
export const defaultObservedValues: ObservedValues[] = [
    // Quarter 1
    { id: 'ov-q1', student_lrn: '100000000001', school_year: '2025-2026', quarter: 1, values: { 'MAKA-DIYOS_0': 'AO', 'MAKA-DIYOS_1': 'AO', 'MAKATAO_0': 'SO', 'MAKATAO_1': 'AO', 'MAKA KALIKASAN_0': 'AO', 'MAKABANSA_0': 'AO', 'MAKABANSA_1': 'SO' } },
    // Quarter 2
    { id: 'ov-q2', student_lrn: '100000000001', school_year: '2025-2026', quarter: 2, values: { 'MAKA-DIYOS_0': 'AO', 'MAKA-DIYOS_1': 'SO', 'MAKATAO_0': 'AO', 'MAKATAO_1': 'AO', 'MAKA KALIKASAN_0': 'SO', 'MAKABANSA_0': 'AO', 'MAKABANSA_1': 'AO' } },
    // Quarter 3
    { id: 'ov-q3', student_lrn: '100000000001', school_year: '2025-2026', quarter: 3, values: { 'MAKA-DIYOS_0': 'SO', 'MAKA-DIYOS_1': 'AO', 'MAKATAO_0': 'AO', 'MAKATAO_1': 'SO', 'MAKA KALIKASAN_0': 'AO', 'MAKABANSA_0': 'SO', 'MAKABANSA_1': 'AO' } },
    // Quarter 4
    { id: 'ov-q4', student_lrn: '100000000001', school_year: '2025-2026', quarter: 4, values: { 'MAKA-DIYOS_0': 'AO', 'MAKA-DIYOS_1': 'AO', 'MAKATAO_0': 'AO', 'MAKATAO_1': 'AO', 'MAKA KALIKASAN_0': 'AO', 'MAKABANSA_0': 'AO', 'MAKABANSA_1': 'AO' } },
];
// Default HPS for testing
export const defaultHPSRecords: HPSRecord[] = [
    // Grade 7 Filipino - Q1
    {
        id: 'hps-g7-filipino-q1',
        subject_id: 'g7-filipino',
        school_year: '2025-2026',
        quarter: 1,
        written_works: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
        performance_tasks: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
        quarterly_exam: 50
    }
];
