/**
 * Test Fixtures for FormEase Pro Automated Testing & Development Verification
 * ONLY used in unit/integration tests (*.test.ts).
 * Never hardcoded or auto-seeded in client production runtime.
 */

import type { Student, Section, Subject } from '../types';

export const testGrade1To12Sections: Section[] = [
    // ==================== ELEMENTARY (GRADES 1–6) ====================
    {
        id: 'sec-g1-sampaguita',
        section_name: 'Sampaguita',
        section_grade_level: 'Grade 1',
        adviser_id: 'adv-g1',
        adviser_name: 'Maria L. Santos',
        is_advisory: true,
        is_teaching_load: false,
        program: 'Regular',
        curriculum_type: 'MATATAG',
        taught_subjects: [
            'Language',
            'Reading and Literacy',
            'Mathematics',
            'GMRC (Good Manners and Right Conduct)',
            'Makabansa'
        ],
        teaching_subjects: [
            'Language',
            'Reading and Literacy',
            'Mathematics',
            'GMRC (Good Manners and Right Conduct)',
            'Makabansa'
        ]
    },
    {
        id: 'sec-g2-ilang-ilang',
        section_name: 'Ilang-Ilang',
        section_grade_level: 'Grade 2',
        adviser_id: 'adv-g2',
        adviser_name: 'Bella C. Cruz',
        is_advisory: true,
        is_teaching_load: false,
        program: 'Regular',
        curriculum_type: 'MATATAG',
        taught_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'GMRC (Good Manners and Right Conduct)',
            'Makabansa'
        ],
        teaching_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'GMRC (Good Manners and Right Conduct)',
            'Makabansa'
        ]
    },
    {
        id: 'sec-g3-rosal',
        section_name: 'Rosal',
        section_grade_level: 'Grade 3',
        adviser_id: 'adv-g3',
        adviser_name: 'Carlos D. Dizon',
        is_advisory: true,
        is_teaching_load: false,
        program: 'Regular',
        curriculum_type: 'MATATAG',
        taught_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'GMRC (Good Manners and Right Conduct)',
            'Makabansa'
        ],
        teaching_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'GMRC (Good Manners and Right Conduct)',
            'Makabansa'
        ]
    },
    {
        id: 'sec-g4-mabini',
        section_name: 'Mabini',
        section_grade_level: 'Grade 4',
        adviser_id: 'adv-g4',
        adviser_name: 'Diana M. Lopez',
        is_advisory: true,
        is_teaching_load: false,
        program: 'Regular',
        curriculum_type: 'MATATAG',
        taught_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'GMRC (Good Manners and Right Conduct)',
            'Araling Panlipunan (AP)',
            'E.P.P.',
            'MAPEH',
            'Music and Arts',
            'Physical Education and Health'
        ],
        teaching_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'GMRC (Good Manners and Right Conduct)',
            'Araling Panlipunan (AP)',
            'E.P.P.',
            'MAPEH'
        ]
    },
    {
        id: 'sec-g5-rizal',
        section_name: 'Rizal',
        section_grade_level: 'Grade 5',
        adviser_id: 'adv-g5',
        adviser_name: 'Eduardo G. Gomez',
        is_advisory: true,
        is_teaching_load: false,
        program: 'Regular',
        taught_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'GMRC (Good Manners and Right Conduct)',
            'Araling Panlipunan (AP)',
            'E.P.P.',
            'MAPEH',
            'Music and Arts',
            'Physical Education and Health'
        ],
        teaching_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'GMRC (Good Manners and Right Conduct)',
            'Araling Panlipunan (AP)',
            'E.P.P.',
            'MAPEH'
        ]
    },
    {
        id: 'sec-g6-bonifacio',
        section_name: 'Bonifacio',
        section_grade_level: 'Grade 6',
        adviser_id: 'adv-g6',
        adviser_name: 'Fatima R. Reyes',
        is_advisory: true,
        is_teaching_load: false,
        program: 'Regular',
        taught_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'GMRC (Good Manners and Right Conduct)',
            'Araling Panlipunan (AP)',
            'E.P.P.',
            'MAPEH',
            'Music and Arts',
            'Physical Education and Health'
        ],
        teaching_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'GMRC (Good Manners and Right Conduct)',
            'Araling Panlipunan (AP)',
            'E.P.P.',
            'MAPEH'
        ]
    },

    // ==================== JUNIOR HIGH SCHOOL (GRADES 7–10) ====================
    {
        id: 'sec-g7-diamond',
        section_name: 'Diamond',
        section_grade_level: 'Grade 7',
        adviser_id: 'adv-g7',
        adviser_name: 'Gabriel S. Santos',
        is_advisory: true,
        is_teaching_load: false,
        program: 'Regular',
        curriculum_type: 'MATATAG',
        taught_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'Araling Panlipunan (AP)',
            'Values Education',
            'Technology and Livelihood Education (TLE)',
            'MAPEH',
            'Music and Arts',
            'Physical Education and Health'
        ],
        teaching_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'Araling Panlipunan (AP)',
            'Values Education',
            'Technology and Livelihood Education (TLE)',
            'MAPEH'
        ]
    },
    {
        id: 'sec-g8-emerald',
        section_name: 'Emerald',
        section_grade_level: 'Grade 8',
        adviser_id: 'adv-g8',
        adviser_name: 'Hannah P. Perez',
        is_advisory: true,
        is_teaching_load: false,
        program: 'Regular',
        taught_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'Araling Panlipunan (AP)',
            'Values Education',
            'Technology and Livelihood Education (TLE)',
            'MAPEH',
            'Music and Arts',
            'Physical Education and Health'
        ],
        teaching_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'Araling Panlipunan (AP)',
            'Values Education',
            'Technology and Livelihood Education (TLE)',
            'MAPEH'
        ]
    },
    {
        id: 'sec-g9-ruby',
        section_name: 'Ruby',
        section_grade_level: 'Grade 9',
        adviser_id: 'adv-g9',
        adviser_name: 'Ian B. Bautista',
        is_advisory: true,
        is_teaching_load: false,
        program: 'Regular',
        taught_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'Araling Panlipunan (AP)',
            'Values Education',
            'Technology and Livelihood Education (TLE)',
            'MAPEH',
            'Music and Arts',
            'Physical Education and Health'
        ],
        teaching_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'Araling Panlipunan (AP)',
            'Values Education',
            'Technology and Livelihood Education (TLE)',
            'MAPEH'
        ]
    },
    {
        id: 'sec-g10-sapphire',
        section_name: 'Sapphire',
        section_grade_level: 'Grade 10',
        adviser_id: 'adv-g10',
        adviser_name: 'Joy V. Villanueva',
        is_advisory: true,
        is_teaching_load: false,
        program: 'Regular',
        taught_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'Araling Panlipunan (AP)',
            'Values Education',
            'Technology and Livelihood Education (TLE)',
            'MAPEH',
            'Music and Arts',
            'Physical Education and Health'
        ],
        teaching_subjects: [
            'Filipino',
            'English',
            'Mathematics',
            'Science',
            'Araling Panlipunan (AP)',
            'Values Education',
            'Technology and Livelihood Education (TLE)',
            'MAPEH'
        ]
    },

    // ==================== SENIOR HIGH SCHOOL (GRADES 11–12) ====================
    {
        id: 'sec-g11-stem-newton',
        section_name: 'STEM - Newton',
        section_grade_level: 'Grade 11',
        adviser_id: 'adv-g11-stem',
        adviser_name: 'Kevin O. Ocampo',
        is_advisory: true,
        is_teaching_load: false,
        track: 'Academic',
        strand: 'STEM',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        taught_subjects: [
            'Effective Communication',
            'General Mathematics',
            'General Science',
            'Life and Career Skills',
            'Mabisang Komunikasyon',
            'Pag-aaral ng Kasaysayan at Lipunang Pilipino',
            'Pre-Calculus',
            'Basic Calculus',
            'Biology 1',
            'Chemistry 1',
            'Physics 1'
        ],
        teaching_subjects: [
            'Effective Communication',
            'General Mathematics',
            'General Science',
            'Life and Career Skills',
            'Mabisang Komunikasyon',
            'Pag-aaral ng Kasaysayan at Lipunang Pilipino',
            'Pre-Calculus',
            'Basic Calculus',
            'Biology 1',
            'Chemistry 1',
            'Physics 1'
        ]
    },
    {
        id: 'sec-g11-techpro-edison',
        section_name: 'TechPro - Edison',
        section_grade_level: 'Grade 11',
        adviser_id: 'adv-g11-tech',
        adviser_name: 'Manuel T. Torres',
        is_advisory: false,
        is_teaching_load: true,
        track: 'TechPro',
        strand: 'Information and Communications Technology (ICT)',
        cluster: 'ICT Support and Computer Programming Technologies',
        taught_subjects: [
            'Effective Communication',
            'General Mathematics',
            'General Science',
            'Life and Career Skills',
            'Mabisang Komunikasyon',
            'Pag-aaral ng Kasaysayan at Lipunang Pilipino',
            'Computer Systems Servicing',
            'Computer Programming (Java)',
            'Broadband Installation'
        ],
        teaching_subjects: [
            'Effective Communication',
            'General Mathematics',
            'General Science',
            'Life and Career Skills',
            'Mabisang Komunikasyon',
            'Pag-aaral ng Kasaysayan at Lipunang Pilipino',
            'Computer Systems Servicing',
            'Computer Programming (Java)',
            'Broadband Installation'
        ]
    },
    {
        id: 'sec-g12-stem-einstein',
        section_name: 'STEM - Einstein',
        section_grade_level: 'Grade 12',
        adviser_id: 'adv-g12-stem',
        adviser_name: 'Laura M. Mendoza',
        is_advisory: true,
        is_teaching_load: false,
        track: 'Academic',
        strand: 'STEM',
        taught_subjects: [
            '21st Century Literature from the Philippines and the World',
            'Contemporary Philippine Arts from the Regions',
            'Media and Information Literacy',
            'Physical Education and Health 3',
            'Physical Education and Health 4',
            'Practical Research 2',
            'Inquiries, Investigations and Immersion',
            'General Biology 2',
            'General Physics 2',
            'General Chemistry 2'
        ],
        teaching_subjects: [
            '21st Century Literature from the Philippines and the World',
            'Contemporary Philippine Arts from the Regions',
            'Media and Information Literacy',
            'Physical Education and Health 3',
            'Physical Education and Health 4',
            'Practical Research 2',
            'Inquiries, Investigations and Immersion',
            'General Biology 2',
            'General Physics 2',
            'General Chemistry 2'
        ]
    },
    {
        id: 'sec-g12-tvl-tesla',
        section_name: 'TVL - Tesla',
        section_grade_level: 'Grade 12',
        adviser_id: 'adv-g12-tvl',
        adviser_name: 'Nelson P. Pascual',
        is_advisory: false,
        is_teaching_load: true,
        track: 'TVL',
        strand: 'Information and Communications Technology (ICT)',
        taught_subjects: [
            '21st Century Literature from the Philippines and the World',
            'Contemporary Philippine Arts from the Regions',
            'Media and Information Literacy',
            'Physical Education and Health 3',
            'Physical Education and Health 4',
            'Empowerment Technologies',
            'Practical Research 2',
            'Computer Systems Servicing'
        ],
        teaching_subjects: [
            '21st Century Literature from the Philippines and the World',
            'Contemporary Philippine Arts from the Regions',
            'Media and Information Literacy',
            'Physical Education and Health 3',
            'Physical Education and Health 4',
            'Empowerment Technologies',
            'Practical Research 2',
            'Computer Systems Servicing'
        ]
    }
];

export const testGrade1To12Subjects: Subject[] = testGrade1To12Sections.flatMap((sec) => {
    const gradeLevel = sec.section_grade_level;
    const subjects = sec.taught_subjects || [];
    return subjects.map((subjName, idx) => {
        const isComponent = subjName === 'Music and Arts' || subjName === 'Physical Education and Health';
        return {
            id: `subj-${sec.id}-${idx + 1}`,
            subject_name: subjName,
            subject_code: isComponent ? 'MAPEH' : '',
            grade_level: gradeLevel,
            section_id: sec.id,
            order: idx + 1,
            is_component: isComponent,
            parent_subject_id: isComponent ? `subj-${sec.id}-mapeh` : undefined,
            counts_in_general_average: true
        };
    });
});

export const testGrade1To12Students: Student[] = [
    {
        lrn: '100101202601',
        first_name: 'Juan',
        middle_name: 'L.',
        last_name: 'Dela Cruz',
        gender: 'Male',
        birthday: '2020-03-15',
        age: 6,
        address: 'Brgy. San Jose, Pasig City',
        grade_level: 'Grade 1',
        student_section: 'Sampaguita'
    },
    {
        lrn: '100101202602',
        first_name: 'Maria Clara',
        middle_name: 'S.',
        last_name: 'Santos',
        gender: 'Female',
        birthday: '2020-07-22',
        age: 6,
        address: 'Brgy. Kapasigan, Pasig City',
        grade_level: 'Grade 1',
        student_section: 'Sampaguita'
    },
    {
        lrn: '100201202601',
        first_name: 'Mark Anthony',
        middle_name: 'B.',
        last_name: 'Bautista',
        gender: 'Male',
        birthday: '2019-04-10',
        age: 7,
        address: 'Brgy. Malinao, Pasig City',
        grade_level: 'Grade 2',
        student_section: 'Ilang-Ilang'
    },
    {
        lrn: '100201202602',
        first_name: 'Chloe Andrea',
        middle_name: 'R.',
        last_name: 'Reyes',
        gender: 'Female',
        birthday: '2019-09-18',
        age: 7,
        address: 'Brgy. San Antonio, Pasig City',
        grade_level: 'Grade 2',
        student_section: 'Ilang-Ilang'
    },
    {
        lrn: '100301202601',
        first_name: 'Joshua',
        middle_name: 'A.',
        last_name: 'Aquino',
        gender: 'Male',
        birthday: '2018-05-20',
        age: 8,
        address: 'Brgy. Bagong Ilog, Pasig City',
        grade_level: 'Grade 3',
        student_section: 'Rosal'
    },
    {
        lrn: '100301202602',
        first_name: 'Sarah Jane',
        middle_name: 'G.',
        last_name: 'Garcia',
        gender: 'Female',
        birthday: '2018-11-04',
        age: 8,
        address: 'Brgy. Ugong, Pasig City',
        grade_level: 'Grade 3',
        student_section: 'Rosal'
    },
    {
        lrn: '100401202601',
        first_name: 'Christian',
        middle_name: 'R.',
        last_name: 'Ramos',
        gender: 'Male',
        birthday: '2017-06-12',
        age: 9,
        address: 'Brgy. Rosario, Pasig City',
        grade_level: 'Grade 4',
        student_section: 'Mabini'
    },
    {
        lrn: '100401202602',
        first_name: 'Princess Nicole',
        middle_name: 'D.',
        last_name: 'Diaz',
        gender: 'Female',
        birthday: '2017-12-30',
        age: 9,
        address: 'Brgy. Santa Lucia, Pasig City',
        grade_level: 'Grade 4',
        student_section: 'Mabini'
    },
    {
        lrn: '100501202601',
        first_name: 'Angelo Gabriel',
        middle_name: 'M.',
        last_name: 'Mendoza',
        gender: 'Male',
        birthday: '2016-07-08',
        age: 10,
        address: 'Brgy. Maybunga, Pasig City',
        grade_level: 'Grade 5',
        student_section: 'Rizal'
    },
    {
        lrn: '100501202602',
        first_name: 'Angelica',
        middle_name: 'L.',
        last_name: 'Locsin',
        gender: 'Female',
        birthday: '2016-02-14',
        age: 10,
        address: 'Brgy. Caniogan, Pasig City',
        grade_level: 'Grade 5',
        student_section: 'Rizal'
    },
    {
        lrn: '100601202601',
        first_name: 'Daniel John',
        middle_name: 'P.',
        last_name: 'Padilla',
        gender: 'Male',
        birthday: '2015-08-25',
        age: 11,
        address: 'Brgy. Pinagbuhatan, Pasig City',
        grade_level: 'Grade 6',
        student_section: 'Bonifacio'
    },
    {
        lrn: '100601202602',
        first_name: 'Kathryn Chandria',
        middle_name: 'B.',
        last_name: 'Bernardo',
        gender: 'Female',
        birthday: '2015-03-26',
        age: 11,
        address: 'Brgy. Dela Paz, Pasig City',
        grade_level: 'Grade 6',
        student_section: 'Bonifacio'
    },
    {
        lrn: '100701202601',
        first_name: 'Gabriel',
        middle_name: 'S.',
        last_name: 'Santos',
        gender: 'Male',
        birthday: '2014-09-14',
        age: 12,
        address: 'Brgy. Manggahan, Pasig City',
        grade_level: 'Grade 7',
        student_section: 'Diamond'
    },
    {
        lrn: '100701202602',
        first_name: 'Bea Kristine',
        middle_name: 'A.',
        last_name: 'Alonzo',
        gender: 'Female',
        birthday: '2014-10-17',
        age: 12,
        address: 'Brgy. Santolan, Pasig City',
        grade_level: 'Grade 7',
        student_section: 'Diamond'
    },
    {
        lrn: '100801202601',
        first_name: 'James Robert',
        middle_name: 'R.',
        last_name: 'Reid',
        gender: 'Male',
        birthday: '2013-10-18',
        age: 13,
        address: 'Brgy. San Nicolas, Pasig City',
        grade_level: 'Grade 8',
        student_section: 'Emerald'
    },
    {
        lrn: '100801202602',
        first_name: 'Nadine Alexis',
        middle_name: 'L.',
        last_name: 'Lustre',
        gender: 'Female',
        birthday: '2013-05-11',
        age: 13,
        address: 'Brgy. Palatiw, Pasig City',
        grade_level: 'Grade 8',
        student_section: 'Emerald'
    },
    {
        lrn: '100901202601',
        first_name: 'Enrique',
        middle_name: 'M.',
        last_name: 'Gil',
        gender: 'Male',
        birthday: '2012-11-22',
        age: 14,
        address: 'Brgy. Bambang, Pasig City',
        grade_level: 'Grade 9',
        student_section: 'Ruby'
    },
    {
        lrn: '100901202602',
        first_name: 'Hope Elizabeth',
        middle_name: 'S.',
        last_name: 'Soberano',
        gender: 'Female',
        birthday: '2012-01-04',
        age: 14,
        address: 'Brgy. Buting, Pasig City',
        grade_level: 'Grade 9',
        student_section: 'Ruby'
    },
    {
        lrn: '101001202601',
        first_name: 'Richard',
        middle_name: 'F.',
        last_name: 'Faulkerson',
        gender: 'Male',
        birthday: '2011-12-05',
        age: 15,
        address: 'Brgy. Kalawaan, Pasig City',
        grade_level: 'Grade 10',
        student_section: 'Sapphire'
    },
    {
        lrn: '101001202602',
        first_name: 'Nicomaine Dei',
        middle_name: 'C.',
        last_name: 'Mendoza',
        gender: 'Female',
        birthday: '2011-03-03',
        age: 15,
        address: 'Brgy. Sagad, Pasig City',
        grade_level: 'Grade 10',
        student_section: 'Sapphire'
    },
    {
        lrn: '101101202601',
        first_name: 'David Alexander',
        middle_name: 'L.',
        last_name: 'Licauco',
        gender: 'Male',
        birthday: '2010-01-30',
        age: 16,
        address: 'Brgy. Pineda, Pasig City',
        grade_level: 'Grade 11',
        student_section: 'STEM - Newton',
        track: 'Academic',
        strand: 'STEM',
        cluster: 'Science, Technology, Engineering, and Mathematics'
    },
    {
        lrn: '101101202602',
        first_name: 'Barbara Ambas',
        middle_name: 'F.',
        last_name: 'Forteza',
        gender: 'Female',
        birthday: '2010-07-31',
        age: 16,
        address: 'Brgy. Bagong Katipunan, Pasig City',
        grade_level: 'Grade 11',
        student_section: 'STEM - Newton',
        track: 'Academic',
        strand: 'STEM',
        cluster: 'Science, Technology, Engineering, and Mathematics'
    },
    {
        lrn: '101102202601',
        first_name: 'Joshua Espineli',
        middle_name: 'G.',
        last_name: 'Garcia',
        gender: 'Male',
        birthday: '2010-10-07',
        age: 16,
        address: 'Brgy. Santa Cruz, Pasig City',
        grade_level: 'Grade 11',
        student_section: 'TechPro - Edison',
        track: 'TechPro',
        strand: 'Information and Communications Technology (ICT)',
        cluster: 'ICT Support and Computer Programming Technologies'
    },
    {
        lrn: '101102202602',
        first_name: 'Julia Francesca',
        middle_name: 'B.',
        last_name: 'Barretto',
        gender: 'Female',
        birthday: '2010-03-10',
        age: 16,
        address: 'Brgy. Sumilang, Pasig City',
        grade_level: 'Grade 11',
        student_section: 'TechPro - Edison',
        track: 'TechPro',
        strand: 'Information and Communications Technology (ICT)',
        cluster: 'ICT Support and Computer Programming Technologies'
    },
    {
        lrn: '101201202601',
        first_name: 'Donny Alcantara',
        middle_name: 'P.',
        last_name: 'Pangilinan',
        gender: 'Male',
        birthday: '2009-02-10',
        age: 17,
        address: 'Brgy. Oranbo, Pasig City',
        grade_level: 'Grade 12',
        student_section: 'STEM - Einstein',
        track: 'Academic',
        strand: 'STEM'
    },
    {
        lrn: '101201202602',
        first_name: 'Belinda Angelito',
        middle_name: 'M.',
        last_name: 'Mariano',
        gender: 'Female',
        birthday: '2009-06-10',
        age: 17,
        address: 'Brgy. San Joaquin, Pasig City',
        grade_level: 'Grade 12',
        student_section: 'STEM - Einstein',
        track: 'Academic',
        strand: 'STEM'
    },
    {
        lrn: '101202202601',
        first_name: 'Gerald Randolph',
        middle_name: 'A.',
        last_name: 'Anderson',
        gender: 'Male',
        birthday: '2009-03-07',
        age: 17,
        address: 'Brgy. Kapitolyo, Pasig City',
        grade_level: 'Grade 12',
        student_section: 'TVL - Tesla',
        track: 'TVL',
        strand: 'Information and Communications Technology (ICT)'
    },
    {
        lrn: '101202202602',
        first_name: 'Kimberly Sue',
        middle_name: 'C.',
        last_name: 'Chiu',
        gender: 'Female',
        birthday: '2009-04-19',
        age: 17,
        address: 'Brgy. San Miguel, Pasig City',
        grade_level: 'Grade 12',
        student_section: 'TVL - Tesla',
        track: 'TVL',
        strand: 'Information and Communications Technology (ICT)'
    }
];
