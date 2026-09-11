/**
 * SF10 Subject Categorization by Educational Level (Elementary, JHS, SHS).
 * Enforces strict isolation: Elementary forms only get Elementary subjects,
 * JHS only get JHS subjects, and SHS only get SHS subjects.
 */

export type SF10EducationLevel = 'elem' | 'jhs' | 'shs';

export function getEducationLevel(gradeLevel?: string | number, fallback: SF10EducationLevel = 'jhs'): SF10EducationLevel {
    if (gradeLevel === undefined || gradeLevel === null) return fallback;
    const s = String(gradeLevel).toLowerCase().trim();
    if (s.includes('kinder') || s.includes('elem') || s.includes('primary')) return 'elem';
    if (s.includes('shs') || s.includes('senior')) return 'shs';
    if (s.includes('jhs') || s.includes('junior')) return 'jhs';
    const num = parseInt(s.replace(/\D/g, ''));
    if (!isNaN(num)) {
        if (num >= 1 && num <= 6) return 'elem';
        if (num >= 7 && num <= 10) return 'jhs';
        if (num >= 11 && num <= 12) return 'shs';
    }
    return fallback;
}

// ==========================================
// 1. ELEMENTARY SCHOOL (Grades 1 to 6, Kinder)
// ==========================================

export const ELEM_DEPED_CORE_SUBJECTS = [
    'Language',
    'Reading and Literacy',
    'Makabansa',
    'GMRC (Good Manners and Right Conduct)',
    'Filipino',
    'English',
    'Mathematics',
    'Science',
    'Araling Panlipunan (AP)',
    'Edukasyong Pantahanan at Pangkabuhayan (EPP)',
    'MAPEH',
    'Music and Arts',
    'Physical Education and Health',
    'Homeroom Guidance'
];

export const ELEM_DEPED_OLD_K12_SUBJECTS = [
    'Mother Tongue',
    'Edukasyon sa Pagpapakatao (EsP)',
    'Music',
    'Arts',
    'Physical Education',
    'Health',
    'Character Education'
];

export const ELEM_SPECIAL_PROGRAMS = [
    'ALIVE: Arabic Language',
    'ALIVE: Islamic Values Education',
    'SPED: Special Education'
];

// ==========================================
// 2. JUNIOR HIGH SCHOOL (Grades 7 to 10)
// ==========================================

export const JHS_DEPED_CORE_SUBJECTS = [
    'Filipino',
    'English',
    'Mathematics',
    'Science',
    'Araling Panlipunan (AP)',
    'Values Education',
    'Technology and Livelihood Education (TLE)',
    'MAPEH',
    'Music and Arts',
    'Physical Education and Health',
    'Homeroom Guidance'
];

export const JHS_DEPED_OLD_K12_SUBJECTS = [
    'Edukasyon sa Pagpapakatao (EsP)',
    'Music',
    'Arts',
    'Physical Education',
    'Health'
];

export const JHS_TVE_ELECTIVES = [
    'TLE: Information and Communications Technology (ICT)',
    'TLE: Computer Systems Servicing (CSS)',
    'TLE: Cookery',
    'TLE: Bread and Pastry Production',
    'TLE: Food and Beverage Services (FBS)',
    'TLE: Shielded Metal Arc Welding (SMAW)',
    'TLE: Electrical Installation and Maintenance (EIM)',
    'TLE: Technical Drafting',
    'TLE: Automotive Servicing',
    'TLE: Agricultural Crop Production',
    'TLE: Animal Production',
    'TLE: Aquaculture / Fishery Arts',
    'TLE: Dressmaking / Tailoring',
    'TLE: Beauty Care (Nail Care / Wellness)',
    'TLE: Handicraft Production',
    'Specialization I',
    'Specialization II',
    'Entrepreneurship'
];

export const JHS_SPECIAL_PROGRAMS = [
    // STE / Special Program in STEM (Canonical Electives)
    'Environmental Science',
    'Research I',
    'Biotechnology',
    'Research II',
    'Consumer Chemistry',
    'Research III',
    'Electronics and Robotics',
    'Research IV',
    // STE / DepEd Detailed Aliases & Advanced Offerings
    'Research I (Scientific Investigation)',
    'Research II (Research Methodology)',
    'Research III (Science Investigatory Project)',
    'Research IV (SIP Defense & Capstone)',
    'Robotics and Digital Electronics',
    'Advanced Statistics',
    'Computer Science I',
    'Advanced Physics (Electronics)',
    'Advanced Chemistry',
    'STE: Advanced Mathematics / Pre-Calculus',
    // Special Program in the Arts (SPA)
    'SPA: Music',
    'SPA: Visual Arts',
    'SPA: Theater Arts',
    'SPA: Dance',
    'SPA: Media Arts',
    'SPA: Creative Writing',
    // Special Program in Sports (SPS)
    'SPS: Sports Specialization',
    // Special Program in Journalism (SPJ)
    'SPJ: Journalism (English)',
    'SPJ: Journalism (Filipino)',
    // Special Program in Foreign Language (SPFL)
    'SPFL: Special Program in Foreign Language',
    // Madrasah / ALIVE Program
    'ALIVE: Arabic Language',
    'ALIVE: Islamic Values Education'
];

// ==========================================
// 3. SENIOR HIGH SCHOOL (Grades 11 to 12)
// ==========================================

export const SHS_CORE_SUBJECTS = [
    'Oral Communication in Context',
    'Reading and Writing Skills',
    'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino',
    'Pagbasa at Pagsusuri ng Iba\'t Ibang Teksto Tungo sa Pananaliksik',
    '21st Century Literature from the Philippines and the World',
    'Contemporary Philippine Arts from the Regions',
    'Media and Information Literacy',
    'General Mathematics',
    'Statistics and Probability',
    'Earth and Life Science',
    'Physical Science',
    'Introduction to the Philosophy of the Human Person',
    'Physical Education and Health 1',
    'Physical Education and Health 2',
    'Physical Education and Health 3',
    'Physical Education and Health 4',
    'Personal Development',
    'Understanding Culture, Society and Politics',
    'Disaster Readiness and Risk Reduction (DRRR)'
];

export const SHS_APPLIED_SUBJECTS = [
    'English for Academic and Professional Purposes (EAPP)',
    'Practical Research 1',
    'Practical Research 2',
    'Inquiries, Investigations, and Immersion (3I\'s)',
    'Pagsulat sa Filipino sa Piling Larangan',
    'Empowerment Technologies (E-Tech)',
    'Entrepreneurship'
];

export const SHS_SPECIALIZED_SUBJECTS = [
    // STEM
    'Pre-Calculus',
    'Basic Calculus',
    'General Biology 1',
    'General Biology 2',
    'General Physics 1',
    'General Physics 2',
    'General Chemistry 1',
    'General Chemistry 2',
    // ABM
    'Business Mathematics',
    'Organization and Management',
    'Fundamentals of Accountancy, Business and Management 1 (FABM 1)',
    'Fundamentals of Accountancy, Business and Management 2 (FABM 2)',
    'Business Finance',
    'Applied Economics',
    'Business Ethics and Social Responsibility',
    // HUMSS
    'Creative Writing / Malikhaing Pagsulat',
    'Creative Nonfiction',
    'Philippine Politics and Governance',
    'Community Engagement, Solidarity and Citizenship',
    'Disciplines and Ideas in the Social Sciences (DISS)',
    'Disciplines and Ideas in the Applied Social Sciences (DIASS)',
    'Trends, Networks, and Critical Thinking in the 21st Century (TNCT)',
    // Common / TVL
    'Work Immersion / Culminating Activity / Research',
    'TVL: Bread and Pastry Production (NC II)',
    'TVL: Food and Beverage Services (NC II)',
    'TVL: Cookery (NC II)',
    'TVL: Computer Systems Servicing (NC II)',
    'TVL: Computer Programming (Java) ( NC III )',
    'Computer Programming (Java) ( NC III )',
    'TVL: Computer Programming (.Net Technology) ( NC III )',
    'TVL: Computer Programming (Oracle Database) ( NC III )',
    'TVL: Shielded Metal Arc Welding (NC II)',
    'TVL: Electrical Installation and Maintenance (NC II)'
];

// Presets for Curriculum Customizers
export const ELEM_MATATAG_PRIMARY_PRESET = [
    { name: 'Language', code: '' },
    { name: 'Reading and Literacy', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
    { name: 'Makabansa', code: '' }
];

export const ELEM_MATATAG_INTERMEDIATE_PRESET = [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
    { name: 'Edukasyong Pantahanan at Pangkabuhayan (EPP)', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music and Arts', code: 'MAPEH' },
    { name: 'Physical Education and Health', code: 'MAPEH' }
];

export const JHS_MATATAG_PRESET = [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'Values Education', code: '' },
    { name: 'Technology and Livelihood Education (TLE)', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music and Arts', code: 'MAPEH' },
    { name: 'Physical Education and Health', code: 'MAPEH' }
];

export const JHS_OLD_K12_PRESET = [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'Edukasyon sa Pagpapakatao (EsP)', code: '' },
    { name: 'Technology and Livelihood Education (TLE)', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music', code: 'MAPEH' },
    { name: 'Arts', code: 'MAPEH' },
    { name: 'Physical Education', code: 'MAPEH' },
    { name: 'Health', code: 'MAPEH' }
];

export const JHS_TVE_PRESET = [
    { name: 'Filipino', code: '' },
    { name: 'English', code: '' },
    { name: 'Mathematics', code: '' },
    { name: 'Science', code: '' },
    { name: 'Araling Panlipunan (AP)', code: '' },
    { name: 'Values Education', code: '' },
    { name: 'TLE: Computer Systems Servicing (CSS)', code: '' },
    { name: 'TLE: Cookery', code: '' },
    { name: 'Specialization I', code: '' },
    { name: 'MAPEH', code: '' },
    { name: 'Music and Arts', code: 'MAPEH' },
    { name: 'Physical Education and Health', code: 'MAPEH' }
];

export const SHS_STEM_PRESET = [
    { name: 'Oral Communication in Context', code: 'CORE' },
    { name: 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', code: 'CORE' },
    { name: 'General Mathematics', code: 'CORE' },
    { name: 'Earth and Life Science', code: 'CORE' },
    { name: 'Personal Development', code: 'CORE' },
    { name: 'Physical Education and Health 1', code: 'CORE' },
    { name: 'English for Academic and Professional Purposes (EAPP)', code: 'APPLIED' },
    { name: 'Pre-Calculus', code: 'SPECIALIZED' },
    { name: 'General Chemistry 1', code: 'SPECIALIZED' }
];

export const SHS_ABM_PRESET = [
    { name: 'Oral Communication in Context', code: 'CORE' },
    { name: 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', code: 'CORE' },
    { name: 'General Mathematics', code: 'CORE' },
    { name: 'Earth and Life Science', code: 'CORE' },
    { name: 'Personal Development', code: 'CORE' },
    { name: 'Physical Education and Health 1', code: 'CORE' },
    { name: 'Organization and Management', code: 'SPECIALIZED' },
    { name: 'Fundamentals of Accountancy, Business and Management 1 (FABM 1)', code: 'SPECIALIZED' },
    { name: 'Business Mathematics', code: 'SPECIALIZED' }
];

export const SHS_HUMSS_PRESET = [
    { name: 'Oral Communication in Context', code: 'CORE' },
    { name: 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', code: 'CORE' },
    { name: 'General Mathematics', code: 'CORE' },
    { name: 'Earth and Life Science', code: 'CORE' },
    { name: 'Personal Development', code: 'CORE' },
    { name: 'Physical Education and Health 1', code: 'CORE' },
    { name: 'Creative Writing / Malikhaing Pagsulat', code: 'SPECIALIZED' },
    { name: 'Philippine Politics and Governance', code: 'SPECIALIZED' },
    { name: 'Disciplines and Ideas in the Social Sciences (DISS)', code: 'SPECIALIZED' }
];

export interface SubjectOptionGroup {
    label: string;
    subjects: string[];
}

/**
 * Returns strictly isolated subject option groups for the given educational level.
 * Elementary forms will never receive JHS/SHS subjects, JHS will never receive Elem/SHS, etc.
 */
export function getSubjectGroupsForLevel(level: SF10EducationLevel): SubjectOptionGroup[] {
    if (level === 'elem') {
        return [
            { label: '📘 DepEd Core Learning Areas (Elem)', subjects: ELEM_DEPED_CORE_SUBJECTS },
            { label: '🏛️ DepEd K-12 Standard (Elem)', subjects: ELEM_DEPED_OLD_K12_SUBJECTS },
            { label: '🎨 Special Elementary Programs', subjects: ELEM_SPECIAL_PROGRAMS }
        ];
    }
    if (level === 'shs') {
        return [
            { label: '📘 SHS Core Subjects', subjects: SHS_CORE_SUBJECTS },
            { label: '📄 SHS Applied / Contextualized Subjects', subjects: SHS_APPLIED_SUBJECTS },
            { label: '🎓 SHS Specialized Subjects (Strands & Tracks)', subjects: SHS_SPECIALIZED_SUBJECTS }
        ];
    }
    // Default JHS
    return [
        { label: '📘 DepEd Core Learning Areas (JHS)', subjects: JHS_DEPED_CORE_SUBJECTS },
        { label: '🏛️ DepEd 2016 K-12 Standard (JHS)', subjects: JHS_DEPED_OLD_K12_SUBJECTS },
        { label: '🛠️ TVE & Specialized Electives (JHS)', subjects: JHS_TVE_ELECTIVES },
        { label: '🎨 Special Curricular Programs (JHS)', subjects: JHS_SPECIAL_PROGRAMS }
    ];
}

/**
 * Filters school database subjects to only those that match the target educational level.
 * Also removes any subjects already present in the standard lists.
 */
export function filterDbSubjectsForLevel<T extends { subject_name: string; grade_level?: string }>(
    dbSubjects: T[],
    level: SF10EducationLevel,
    standardSubjectsForLevel: string[]
): T[] {
    const knownSet = new Set(standardSubjectsForLevel.map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '')));

    return dbSubjects.filter(s => {
        const norm = s.subject_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (knownSet.has(norm)) return false;

        if (!s.grade_level) return true;

        const sLevel = getEducationLevel(s.grade_level);
        return sLevel === level;
    });
}
