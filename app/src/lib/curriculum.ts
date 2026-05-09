/**
 * DepEd Curriculum Standard Subjects (Grades 1 to 12)
 * Includes Matatag (G1-3) and Standard DepEd (G4-12)
 */

export const STANDARD_SUBJECTS = {
    'Grade 1': [
        { name: 'Language', code: '' },
        { name: 'Reading and Literacy', code: '' },
        { name: 'Mathematics', code: '' },
        { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
        { name: 'Makabansa', code: '' },
        { name: '*Arabic Language', code: '' },
        { name: '*Islamic Values Education', code: '' }
    ],
    'Grade 2': [
        { name: 'Filipino', code: '' },
        { name: 'English', code: '' },
        { name: 'Mathematics', code: '' },
        { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
        { name: 'Makabansa', code: '' },
        { name: '*Arabic Language', code: '' },
        { name: '*Islamic Values Education', code: '' }
    ],
    'Grade 3': [
        { name: 'Filipino', code: '' },
        { name: 'English', code: '' },
        { name: 'Mathematics', code: '' },
        { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
        { name: 'Makabansa', code: '' },
        { name: '*Arabic Language', code: '' },
        { name: '*Islamic Values Education', code: '' }
    ],
    'Grade 4': [
        { name: 'Filipino', code: '' },
        { name: 'English', code: '' },
        { name: 'Mathematics', code: '' },
        { name: 'Science', code: '' },
        { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
        { name: 'Araling Panlipunan (AP)', code: '' },
        { name: 'E.P.P.', code: '' },
        { name: 'MAPEH', code: '' },
        { name: 'Music and Arts', code: 'MAPEH' },
        { name: 'Physical Education and Health', code: 'MAPEH' },
        { name: '*Arabic Language', code: '' },
        { name: '*Islamic Values Education', code: '' }
    ],
    'Grade 5': [
        { name: 'Filipino', code: '' },
        { name: 'English', code: '' },
        { name: 'Mathematics', code: '' },
        { name: 'Science', code: '' },
        { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
        { name: 'Araling Panlipunan (AP)', code: '' },
        { name: 'E.P.P.', code: '' },
        { name: 'MAPEH', code: '' },
        { name: 'Music and Arts', code: 'MAPEH' },
        { name: 'Physical Education and Health', code: 'MAPEH' },
        { name: '*Arabic Language', code: '' },
        { name: '*Islamic Values Education', code: '' }
    ],
    'Grade 6': [
        { name: 'Filipino', code: '' },
        { name: 'English', code: '' },
        { name: 'Mathematics', code: '' },
        { name: 'Science', code: '' },
        { name: 'GMRC (Good Manners and Right Conduct)', code: '' },
        { name: 'Araling Panlipunan (AP)', code: '' },
        { name: 'E.P.P.', code: '' },
        { name: 'MAPEH', code: '' },
        { name: 'Music and Arts', code: 'MAPEH' },
        { name: 'Physical Education and Health', code: 'MAPEH' },
        { name: '*Arabic Language', code: '' },
        { name: '*Islamic Values Education', code: '' }
    ],
    'Grade 7': [
        { name: 'Filipino', code: '' },
        { name: 'English', code: '' },
        { name: 'Mathematics', code: '' },
        { name: 'Science', code: '' },
        { name: 'Araling Panlipunan (AP)', code: '' },
        { name: 'Values Education', code: '' },
        { name: 'Technology and Livelihood Education (TLE)', code: '' },
        { name: 'Music and Arts', code: 'MAPEH' },
        { name: 'Physical Education and Health', code: 'MAPEH' }
    ],
    'Grade 8': [
        { name: 'Filipino', code: '' },
        { name: 'English', code: '' },
        { name: 'Mathematics', code: '' },
        { name: 'Science', code: '' },
        { name: 'Araling Panlipunan (AP)', code: '' },
        { name: 'Values Education', code: '' },
        { name: 'Technology and Livelihood Education (TLE)', code: '' },
        { name: 'Music and Arts', code: 'MAPEH' },
        { name: 'Physical Education and Health', code: 'MAPEH' }
    ],
    'Grade 9': [
        { name: 'Filipino', code: '' },
        { name: 'English', code: '' },
        { name: 'Mathematics', code: '' },
        { name: 'Science', code: '' },
        { name: 'Araling Panlipunan (AP)', code: '' },
        { name: 'Values Education', code: '' },
        { name: 'Technology and Livelihood Education (TLE)', code: '' },
        { name: 'Music and Arts', code: 'MAPEH' },
        { name: 'Physical Education and Health', code: 'MAPEH' }
    ],
    'Grade 10': [
        { name: 'Filipino', code: '' },
        { name: 'English', code: '' },
        { name: 'Mathematics', code: '' },
        { name: 'Science', code: '' },
        { name: 'Araling Panlipunan (AP)', code: '' },
        { name: 'Values Education', code: '' },
        { name: 'Technology and Livelihood Education (TLE)', code: '' },
        { name: 'Music and Arts', code: 'MAPEH' },
        { name: 'Physical Education and Health', code: 'MAPEH' }
    ],
    'Grade 11': [
        { name: 'Oral Communication', code: '' },
        { name: 'General Mathematics', code: '' },
        { name: 'Earth and Life Science', code: '' },
        { name: 'Personal Development', code: '' },
        { name: 'PE and Health 1', code: '' },
        { name: 'Specialized Subject 1', code: '' }
    ],
    'Grade 12': [
        { name: '21st Century Literature', code: '' },
        { name: 'Contemporary Philippine Arts', code: '' },
        { name: 'Understanding Culture, Society and Politics', code: '' },
        { name: 'PE and Health 3', code: '' },
        { name: 'Specialized Subject 3', code: '' }
    ]
};

/**
 * Special Curriculum with Extra Subject (Usually for JHS Science/Arts programs)
 */
export const SPECIAL_SUBJECTS = {
    ...STANDARD_SUBJECTS, // Inherit all standard ones
    'Grade 7': [
        ...STANDARD_SUBJECTS['Grade 7'],
        { name: 'Specialization', code: '' }
    ],
    'Grade 8': [
        ...STANDARD_SUBJECTS['Grade 8'],
        { name: 'Specialization', code: '' }
    ],
    'Grade 9': [
        ...STANDARD_SUBJECTS['Grade 9'],
        { name: 'Specialization', code: '' }
    ],
    'Grade 10': [
        ...STANDARD_SUBJECTS['Grade 10'],
        { name: 'Specialization', code: '' }
    ]
};

export type GradeLevel = keyof typeof STANDARD_SUBJECTS;
