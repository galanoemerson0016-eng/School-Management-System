/**
 * Official DepEd Order No. 017, s. 2026 (Strengthened Senior High School Curriculum)
 * Annex A: Complete Elective Catalog & Prerequisite Rules
 */

export interface SshsElective {
    title: string;
    hours: 80 | 160 | 320;
    gradeLevel: '11' | '12' | '11/12';
    cluster: string;
    track: 'Academic' | 'Tech-Pro';
    category: 'academic_elective' | 'arts_elective' | 'techpro_elective' | 'field_experience' | 'work_immersion';
    prerequisites: string[]; // List of required subjects or rule descriptors
    prerequisiteType?: 'all' | 'any' | 'count'; // 'all' means all listed are required; 'any' means any one is enough; 'count' means a specific number
    prerequisiteCount?: number; // e.g., 6 electives for Work Immersion
    tesdaTr?: string; // Equivalent TESDA Training Regulation
    ncLevel?: string; // e.g., 'NC I', 'NC II', 'NC III', 'Non-NC'
}

export interface PrerequisiteCheckResult {
    valid: boolean;
    missingPrerequisites: string[];
    ruleDescription?: string;
}

export const SSHS_ELECTIVE_CATALOG: SshsElective[] = [
    // =========================================================================
    // ACADEMIC TRACK - ARTS, SOCIAL SCIENCES, AND HUMANITIES (25 electives)
    // =========================================================================
    {
        title: 'Art Criticism and Creative Markets',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: [
            'Creative Industries - Applied and Traditional Arts',
            'Creative Industries - Literary Arts',
            'Creative Industries - Media Arts',
            'Creative Industries - Visual Arts'
        ],
        prerequisiteType: 'any'
    },
    {
        title: 'Creative Industries - Visual Arts',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Creative Industries - Literary Arts',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Creative Industries - Media Arts',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Creative Industries - Applied and Traditional Arts',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Creative Industries - Music',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Creative Industries - Dance',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Creative Industries - Theater Arts',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Citizenship and Civic Engagement',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Contemporary Literature 1',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Contemporary Literature 2',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Contemporary Literature 1'],
        prerequisiteType: 'all'
    },
    {
        title: 'Creative Composition 1',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Creative Composition 2',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Creative Composition 1'],
        prerequisiteType: 'all'
    },
    {
        title: 'Creative Production and Presentation',
        hours: 160,
        gradeLevel: '12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'arts_elective',
        prerequisites: [
            'Arts Apprenticeship - Dance',
            'Arts Apprenticeship - Literary Arts',
            'Arts Apprenticeship - Media Arts',
            'Arts Apprenticeship - Music',
            'Arts Apprenticeship - Theater Arts',
            'Arts Apprenticeship - Traditional Cultural Expressions',
            'Arts Apprenticeship - Visual Arts'
        ],
        prerequisiteType: 'any'
    },
    {
        title: 'Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Filipino 2 (Filipino sa Isports)',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)'],
        prerequisiteType: 'all'
    },
    {
        title: 'Filipino 2 (Filipino sa Sining at Disenyo)',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)'],
        prerequisiteType: 'all'
    },
    {
        title: 'Filipino 2 (Filipino sa Larang Teknikal-Propesyonal)',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)'],
        prerequisiteType: 'all'
    },
    {
        title: 'Filipino Identity Through the Arts',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Introduction to the Philosophy of the Human Person',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Leadership and Management in the Arts',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Malikhaing Pagsulat',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Performance Criticism and Creative Markets',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: [
            'Creative Industries - Music',
            'Creative Industries - Dance',
            'Creative Industries - Theater Arts'
        ],
        prerequisiteType: 'any'
    },
    {
        title: 'Philippine Governance (Philippine Politics and Governance)',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Social Sciences (Theory and Practice)',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Arts, Social Sciences, and Humanities',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },

    // =========================================================================
    // ACADEMIC TRACK - BUSINESS AND ENTREPRENEURSHIP (6 electives)
    // =========================================================================
    {
        title: 'Business 1 (Basic Accounting)',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Business and Entrepreneurship',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Business 2 (Business Finance and Income Taxation)',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Business and Entrepreneurship',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: [
            'Business 1 (Basic Accounting)',
            'Introduction to Organization and Management'
        ],
        prerequisiteType: 'all'
    },
    {
        title: 'Business 3 (Business Economics)',
        hours: 80,
        gradeLevel: '12',
        cluster: 'Business and Entrepreneurship',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: [
            'Business 1 (Basic Accounting)',
            'Business 2 (Business Finance and Income Taxation)',
            'Introduction to Organization and Management'
        ],
        prerequisiteType: 'all'
    },
    {
        title: 'Contemporary Marketing',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Business and Entrepreneurship',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: [
            'Business 1 (Basic Accounting)',
            'Introduction to Organization and Management'
        ],
        prerequisiteType: 'all'
    },
    {
        title: 'Entrepreneurship',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Business and Entrepreneurship',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Introduction to Organization and Management',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Business and Entrepreneurship',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },

    // =========================================================================
    // ACADEMIC TRACK - STEM (26 electives)
    // =========================================================================
    {
        title: 'Advanced Mathematics',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Pre-Calculus'],
        prerequisiteType: 'all'
    },
    {
        title: 'Basic Calculus',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Pre-Calculus'],
        prerequisiteType: 'all'
    },
    {
        title: 'Biology 1',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Biology 2',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Biology 1'],
        prerequisiteType: 'all'
    },
    {
        title: 'Biology 3',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Biology 1', 'Biology 2'],
        prerequisiteType: 'all'
    },
    {
        title: 'Biology 4',
        hours: 80,
        gradeLevel: '12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Biology 1', 'Biology 2', 'Biology 3'],
        prerequisiteType: 'all'
    },
    {
        title: 'Chemistry 1',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Chemistry 2',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Chemistry 1'],
        prerequisiteType: 'all'
    },
    {
        title: 'Chemistry 3',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Chemistry 1', 'Chemistry 2'],
        prerequisiteType: 'all'
    },
    {
        title: 'Chemistry 4',
        hours: 80,
        gradeLevel: '12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Chemistry 1', 'Chemistry 2', 'Chemistry 3'],
        prerequisiteType: 'all'
    },
    {
        title: 'Conceptual Physics and Chemistry in Daily Life',
        hours: 80,
        gradeLevel: '12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['General Science'],
        prerequisiteType: 'all'
    },
    {
        title: 'Conceptual Biology and Earth and Space Science',
        hours: 80,
        gradeLevel: '12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['General Science'],
        prerequisiteType: 'all'
    },
    {
        title: 'Database Management',
        hours: 80,
        gradeLevel: '12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['General Mathematics'],
        prerequisiteType: 'all'
    },
    {
        title: 'Earth and Space Science 1',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Earth and Space Science 2',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Earth and Space Science 1'],
        prerequisiteType: 'all'
    },
    {
        title: 'Earth and Space Science 3',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Earth and Space Science 1', 'Earth and Space Science 2'],
        prerequisiteType: 'all'
    },
    {
        title: 'Earth and Space Science 4',
        hours: 80,
        gradeLevel: '12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Earth and Space Science 1', 'Earth and Space Science 2', 'Earth and Space Science 3'],
        prerequisiteType: 'all'
    },
    {
        title: 'Empowerment Technologies',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Finite Mathematics 1',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Finite Mathematics 2',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Fundamentals of Data Analytics',
        hours: 80,
        gradeLevel: '12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['General Mathematics'],
        prerequisiteType: 'all'
    },
    {
        title: 'Physics 1',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Physics 2',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Physics 1'],
        prerequisiteType: 'all'
    },
    {
        title: 'Physics 3',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Physics 1', 'Physics 2'],
        prerequisiteType: 'all'
    },
    {
        title: 'Physics 4',
        hours: 80,
        gradeLevel: '12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Physics 1', 'Physics 2', 'Physics 3'],
        prerequisiteType: 'all'
    },
    {
        title: 'Pre-Calculus',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },

    // =========================================================================
    // ACADEMIC TRACK - SPORTS, HEALTH, AND WELLNESS (10 electives)
    // =========================================================================
    {
        title: 'Exercise and Sports Programming',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Sports, Health, and Wellness',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: [
            'Human Movement 1 (Basic Anatomy in Sports and Exercise)',
            'Human Movement 2 (Motor Skills Development)'
        ],
        prerequisiteType: 'all'
    },
    {
        title: 'First Aid',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Sports, Health, and Wellness',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Fundamentals of Basic Life Support',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Sports, Health, and Wellness',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Human Movement 1 (Basic Anatomy in Sports and Exercise)',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Sports, Health, and Wellness',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Human Movement 2 (Motor Skills Development)',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Sports, Health, and Wellness',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Human Movement 1 (Basic Anatomy in Sports and Exercise)'],
        prerequisiteType: 'all'
    },
    {
        title: 'Physical Education 1 (Fitness and Recreation)',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Sports, Health, and Wellness',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Physical Education 2 (Sports and Dance)',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Sports, Health, and Wellness',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Sports Activity Management',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Sports, Health, and Wellness',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Sports Coaching',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Sports, Health, and Wellness',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: [
            'Human Movement 1 (Basic Anatomy in Sports and Exercise)',
            'Human Movement 2 (Motor Skills Development)'
        ],
        prerequisiteType: 'all'
    },
    {
        title: 'Sports Officiating',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Sports, Health, and Wellness',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: [
            'Human Movement 1 (Basic Anatomy in Sports and Exercise)',
            'Human Movement 2 (Motor Skills Development)'
        ],
        prerequisiteType: 'all'
    },

    // =========================================================================
    // ACADEMIC TRACK - FIELD EXPERIENCE (13 electives)
    // =========================================================================
    {
        title: 'Arts Apprenticeship - Dance',
        hours: 160,
        gradeLevel: '12',
        cluster: 'Field Experience',
        track: 'Academic',
        category: 'arts_elective',
        prerequisites: [
            'Filipino Identity Through the Arts',
            'Leadership and Management in the Arts',
            'Performance Criticism and Creative Markets'
        ],
        prerequisiteType: 'all'
    },
    {
        title: 'Arts Apprenticeship - Literary Arts',
        hours: 160,
        gradeLevel: '12',
        cluster: 'Field Experience',
        track: 'Academic',
        category: 'arts_elective',
        prerequisites: [
            'Filipino Identity Through the Arts',
            'Leadership and Management in the Arts',
            'Art Criticism and Creative Markets'
        ],
        prerequisiteType: 'all'
    },
    {
        title: 'Arts Apprenticeship - Media Arts',
        hours: 160,
        gradeLevel: '12',
        cluster: 'Field Experience',
        track: 'Academic',
        category: 'arts_elective',
        prerequisites: [
            'Filipino Identity Through the Arts',
            'Leadership and Management in the Arts',
            'Art Criticism and Creative Markets'
        ],
        prerequisiteType: 'all'
    },
    {
        title: 'Arts Apprenticeship - Music',
        hours: 160,
        gradeLevel: '12',
        cluster: 'Field Experience',
        track: 'Academic',
        category: 'arts_elective',
        prerequisites: [
            'Filipino Identity Through the Arts',
            'Leadership and Management in the Arts',
            'Performance Criticism and Creative Markets'
        ],
        prerequisiteType: 'all'
    },
    {
        title: 'Arts Apprenticeship - Theater Arts',
        hours: 160,
        gradeLevel: '12',
        cluster: 'Field Experience',
        track: 'Academic',
        category: 'arts_elective',
        prerequisites: [
            'Filipino Identity Through the Arts',
            'Leadership and Management in the Arts',
            'Performance Criticism and Creative Markets'
        ],
        prerequisiteType: 'all'
    },
    {
        title: 'Arts Apprenticeship - Traditional Cultural Expressions',
        hours: 160,
        gradeLevel: '12',
        cluster: 'Field Experience',
        track: 'Academic',
        category: 'arts_elective',
        prerequisites: [
            'Filipino Identity Through the Arts',
            'Leadership and Management in the Arts',
            'Art Criticism and Creative Markets'
        ],
        prerequisiteType: 'all'
    },
    {
        title: 'Arts Apprenticeship - Visual Arts',
        hours: 160,
        gradeLevel: '12',
        cluster: 'Field Experience',
        track: 'Academic',
        category: 'arts_elective',
        prerequisites: [
            'Filipino Identity Through the Arts',
            'Leadership and Management in the Arts',
            'Art Criticism and Creative Markets'
        ],
        prerequisiteType: 'all'
    },
    {
        title: 'Design and Innovation',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Field Experience',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Research 1',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Field Experience',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: []
    },
    {
        title: 'Research 2',
        hours: 80,
        gradeLevel: '11/12',
        cluster: 'Field Experience',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Research 1'],
        prerequisiteType: 'all'
    },
    {
        title: 'In-Campus Field Exposure for Sports',
        hours: 160,
        gradeLevel: '12',
        cluster: 'Field Experience',
        track: 'Academic',
        category: 'arts_elective',
        prerequisites: [
            'Human Movement 1 (Basic Anatomy in Sports and Exercise)',
            'Human Movement 2 (Motor Skills Development)',
            'Sports Coaching',
            'Sports Officiating',
            'Sports Activity Management',
            'First Aid',
            'Fundamentals of Basic Life Support'
        ],
        prerequisiteType: 'all'
    },
    {
        title: 'Field Exposure (Off Campus)',
        hours: 80,
        gradeLevel: '12',
        cluster: 'Field Experience',
        track: 'Academic',
        category: 'academic_elective',
        prerequisites: ['Life and Career Skills'],
        prerequisiteType: 'all'
    },
    {
        title: 'Work Immersion for Academic Track',
        hours: 320,
        gradeLevel: '12',
        cluster: 'Field Experience',
        track: 'Academic',
        category: 'work_immersion',
        prerequisites: [
            'Business 1 (Basic Accounting)',
            'Introduction to Organization and Management'
        ],
        prerequisiteType: 'any'
    },

    // =========================================================================
    // TECH-PRO TRACK (10 Clusters, all 320 hours)
    // =========================================================================

    // 1. Aesthetic, Wellness, and Human Care
    {
        title: 'Aesthetic Services (Beauty Care)',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Aesthetic, Wellness, and Human Care',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Beauty Care (Nail Care Services)',
        ncLevel: 'NC II'
    },
    {
        title: 'Caregiving (Adult Care)',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Aesthetic, Wellness, and Human Care',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Caregiving',
        ncLevel: 'NC II'
    },
    {
        title: 'Caregiving (Child Care)',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Aesthetic, Wellness, and Human Care',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Caregiving (Newborn to Pre-schooler)',
        ncLevel: 'NC II'
    },
    {
        title: 'Hairdressing Services',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Aesthetic, Wellness, and Human Care',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Hairdressing',
        ncLevel: 'NC II'
    },

    // 2. Agri-Fishery Business and Food Innovation
    {
        title: 'Agricultural Crops Production',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Agri-Fishery Business and Food Innovation',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Agricultural Crops Production',
        ncLevel: 'NC II'
    },
    {
        title: 'Agro-entrepreneurship',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Agri-Fishery Business and Food Innovation',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Agro-Entrepreneurship',
        ncLevel: 'NC II'
    },
    {
        title: 'Aquaculture',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Agri-Fishery Business and Food Innovation',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Aquaculture (Tilapia Culture / Grow-Out / Hatchery)',
        ncLevel: 'NC II'
    },
    {
        title: 'Fish Capture Operation',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Agri-Fishery Business and Food Innovation',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Fish Capture',
        ncLevel: 'NC II'
    },
    {
        title: 'Food Processing',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Agri-Fishery Business and Food Innovation',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Food Processing',
        ncLevel: 'NC II'
    },
    {
        title: 'Organic Agriculture Production',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Agri-Fishery Business and Food Innovation',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Organic Agriculture Production',
        ncLevel: 'NC II'
    },
    {
        title: 'Poultry Production (Chicken)',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Agri-Fishery Business and Food Innovation',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Animal Production (Poultry-Chicken)',
        ncLevel: 'NC II'
    },
    {
        title: 'Ruminants Production',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Agri-Fishery Business and Food Innovation',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Animal Production (Ruminants)',
        ncLevel: 'NC II'
    },
    {
        title: 'Swine Production',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Agri-Fishery Business and Food Innovation',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Animal Production (Swine)',
        ncLevel: 'NC II'
    },

    // 3. Artisanry and Creative Enterprise
    {
        title: 'Garments Artisanry',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Artisanry and Creative Enterprise',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Dressmaking and Tailoring',
        ncLevel: 'NC II'
    },
    {
        title: 'Handicrafts (Weaving)',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Artisanry and Creative Enterprise',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Handicraft',
        ncLevel: 'Non-NC'
    },

    // 4. Automotive and Small Engine Technologies
    {
        title: 'Automotive Servicing (Electrical Repair)',
        hours: 320,
        gradeLevel: '12',
        cluster: 'Automotive and Small Engine Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: ['Driving and Automotive Servicing'],
        prerequisiteType: 'all',
        tesdaTr: 'Automotive Servicing (Electrical Repair)',
        ncLevel: 'NC II'
    },
    {
        title: 'Automotive Servicing (Engine and Chassis Repairs)',
        hours: 320,
        gradeLevel: '12',
        cluster: 'Automotive and Small Engine Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: ['Driving and Automotive Servicing'],
        prerequisiteType: 'all',
        tesdaTr: 'Automotive Servicing (Engine Repair) / (Chassis Repair)',
        ncLevel: 'NC II'
    },
    {
        title: 'Driving and Automotive Servicing',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Automotive and Small Engine Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Driving and Automotive',
        ncLevel: 'Driving NC II / Automotive NC I'
    },
    {
        title: 'Motorcycle and Small Engine Servicing',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Automotive and Small Engine Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Motorcycle and Small Engine',
        ncLevel: 'NC II'
    },

    // 5. Construction and Building Technologies
    {
        title: 'Carpentry',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Construction and Building Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Carpentry',
        ncLevel: 'NC I and NC II'
    },
    {
        title: 'Construction Operation',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Construction and Building Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Masonry, Tile Setting, and Plumbing',
        ncLevel: 'Masonry NC I / Plumbing NC II'
    },
    {
        title: 'Manual Metal Arc Welding',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Construction and Building Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Manual Metal Arc Welding',
        ncLevel: 'NC I and NC II'
    },
    {
        title: 'Technical Drafting',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Construction and Building Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Technical Drafting',
        ncLevel: 'NC II'
    },

    // 6. Creative Arts and Design Technologies
    {
        title: 'Animation',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Creative Arts and Design Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Animation',
        ncLevel: 'NC II'
    },
    {
        title: 'Illustration',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Creative Arts and Design Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Illustration',
        ncLevel: 'NC II'
    },
    {
        title: 'Visual Graphic Design',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Creative Arts and Design Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Visual Graphic Design',
        ncLevel: 'NC III'
    },

    // 7. Hospitality and Tourism
    {
        title: 'Bakery Operations',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Hospitality and Tourism',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Bread and Pastry Production',
        ncLevel: 'NC II'
    },
    {
        title: 'Events Management Services',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Hospitality and Tourism',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Events Management Services',
        ncLevel: 'NC III'
    },
    {
        title: 'Food and Beverage Operation',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Hospitality and Tourism',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Food and Beverage Services and/or Barista',
        ncLevel: 'NC II'
    },
    {
        title: 'Hotel Operations (Front Office Services)',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Hospitality and Tourism',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Front Office Services',
        ncLevel: 'NC II'
    },
    {
        title: 'Hotel Operations (Housekeeping Services)',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Hospitality and Tourism',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Housekeeping Services',
        ncLevel: 'NC II'
    },
    {
        title: 'Kitchen Operations',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Hospitality and Tourism',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Cookery',
        ncLevel: 'NC II'
    },
    {
        title: 'Tourism Services',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Hospitality and Tourism',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Local Tour Guiding / Travel Promotion / Tourism Services',
        ncLevel: 'NC II'
    },

    // 8. Industrial Technologies
    {
        title: 'Commercial Air-Conditioning Installation and Servicing',
        hours: 320,
        gradeLevel: '12',
        cluster: 'Industrial Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: ['Domestic Refrigeration and Air-Conditioning Servicing'],
        prerequisiteType: 'all',
        tesdaTr: 'Commercial Air-Conditioning Installation and Servicing',
        ncLevel: 'NC III'
    },
    {
        title: 'Domestic Refrigeration and Air-Conditioning Servicing',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Industrial Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Domestic Refrigeration and Air-Conditioning Servicing',
        ncLevel: 'NC II'
    },
    {
        title: 'Electrical Installation and Maintenance',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Industrial Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Electrical Installation and Maintenance',
        ncLevel: 'NC II'
    },
    {
        title: 'Electronic Products Assembly and Servicing',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Industrial Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Electronic Products Assembly and Servicing',
        ncLevel: 'NC II'
    },
    {
        title: 'Mechatronics',
        hours: 320,
        gradeLevel: '12',
        cluster: 'Industrial Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: ['Electronic Products Assembly and Servicing'],
        prerequisiteType: 'all',
        tesdaTr: 'Mechatronics',
        ncLevel: 'NC II'
    },
    {
        title: 'Photovoltaic Systems Installation',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Industrial Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'PV System Installation',
        ncLevel: 'NC II'
    },

    // 9. ICT Support and Computer Programming Technologies
    {
        title: 'Broadband Installation',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'ICT Support and Computer Programming Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Fixed Wireless Systems / Broadband Installation',
        ncLevel: 'NC II'
    },
    {
        title: 'Computer Programming (Java) ( NC III )',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'ICT Support and Computer Programming Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Programming (JAVA)',
        ncLevel: 'NC III'
    },
    {
        title: 'Computer Programming (.Net Technology)',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'ICT Support and Computer Programming Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Programming (.NET Technology)',
        ncLevel: 'NC III'
    },
    {
        title: 'Computer Programming (Oracle Database)',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'ICT Support and Computer Programming Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Programming (Oracle Database)',
        ncLevel: 'NC III'
    },
    {
        title: 'Computer Systems Servicing',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'ICT Support and Computer Programming Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Computer Systems Servicing',
        ncLevel: 'NC II'
    },
    {
        title: 'Contact Center Services',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'ICT Support and Computer Programming Technologies',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Contact Center Services',
        ncLevel: 'NC II'
    },

    // 10. Maritime
    {
        title: 'Marine Engineering at the Support Level',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Maritime',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'N/A',
        ncLevel: 'Non-NC'
    },
    {
        title: 'Marine Transportation at the Support Level',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Maritime',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'N/A',
        ncLevel: 'Non-NC'
    },
    {
        title: 'Ships Catering Services',
        hours: 320,
        gradeLevel: '11/12',
        cluster: 'Maritime',
        track: 'Tech-Pro',
        category: 'techpro_elective',
        prerequisites: [],
        tesdaTr: 'Ships Catering Services',
        ncLevel: 'NC I and/or NC II'
    },

    // Work Immersion for Tech-Pro Track
    {
        title: 'Work Immersion for Tech-Pro Track',
        hours: 320,
        gradeLevel: '12',
        cluster: 'Hospitality and Tourism', // Can be offered in any Tech-Pro cluster
        track: 'Tech-Pro',
        category: 'work_immersion',
        prerequisites: [],
        tesdaTr: 'Work Immersion',
        ncLevel: 'N/A'
    }
];

export function normalizeElectiveTitle(title: string): string {
    if (!title) return '';
    return title
        .toLowerCase()
        .replace(/\s*\([^)]*\)/g, '') // remove parenthetical remarks
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

/**
 * Finds elective metadata from catalog by title (with fuzzy match)
 */
export function findElectiveInCatalog(title: string): SshsElective | undefined {
    const norm = normalizeElectiveTitle(title);
    return SSHS_ELECTIVE_CATALOG.find(e => {
        const catNorm = normalizeElectiveTitle(e.title);
        return catNorm === norm || norm.includes(catNorm) || catNorm.includes(norm);
    });
}

/**
 * Validates if the student has satisfied prerequisites for a given subject.
 */
export function checkSubjectPrerequisites(subjectTitle: string, completedSubjects: string[]): PrerequisiteCheckResult {
    const elective = findElectiveInCatalog(subjectTitle);
    if (!elective || !elective.prerequisites || elective.prerequisites.length === 0) {
        return { valid: true, missingPrerequisites: [] };
    }

    const normalizedCompleted = new Set(completedSubjects.map(s => normalizeElectiveTitle(s)));

    if (elective.prerequisiteType === 'any') {
        // Any one prerequisite is sufficient
        const satisfied = elective.prerequisites.some(p => normalizedCompleted.has(normalizeElectiveTitle(p)));
        if (satisfied) {
            return { valid: true, missingPrerequisites: [] };
        }
        return {
            valid: false,
            missingPrerequisites: elective.prerequisites,
            ruleDescription: `Requires ANY ONE of: ${elective.prerequisites.join(', ')}`
        };
    }

    // Default: 'all' prerequisites are required
    const missing = elective.prerequisites.filter(p => !normalizedCompleted.has(normalizeElectiveTitle(p)));
    if (missing.length === 0) {
        return { valid: true, missingPrerequisites: [] };
    }

    return {
        valid: false,
        missingPrerequisites: missing,
        ruleDescription: `Requires: ${missing.join(', ')}`
    };
}
