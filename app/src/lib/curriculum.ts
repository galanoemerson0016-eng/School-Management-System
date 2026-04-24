/**
 * Matatag Curriculum Standard Subjects
 * Grade 7 to 10
 */

export const STANDARD_SUBJECTS = {
    'Grade 7': [
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
    ],
    'Grade 8': [
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
    ],
    'Grade 9': [
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
    ],
    'Grade 10': [
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
    ]
};

/**
 * Special Curriculum with Extra Subject
 * Includes "Specialization" as 11th subject
 * Grade 7 to 10
 */
export const SPECIAL_SUBJECTS = {
    'Grade 7': [
        { name: 'Filipino', code: '' },
        { name: 'English', code: '' },
        { name: 'Mathematics', code: '' },
        { name: 'Science', code: '' },
        { name: 'Araling Panlipunan (AP)', code: '' },
        { name: 'Values Education', code: '' },
        { name: 'Technology and Livelihood Education (TLE)', code: '' },
        { name: 'MAPEH', code: '' },
        { name: 'Music and Arts', code: 'MAPEH' },
        { name: 'Physical Education and Health', code: 'MAPEH' },
        { name: 'Specialization', code: '' }
    ],
    'Grade 8': [
        { name: 'Filipino', code: '' },
        { name: 'English', code: '' },
        { name: 'Mathematics', code: '' },
        { name: 'Science', code: '' },
        { name: 'Araling Panlipunan (AP)', code: '' },
        { name: 'Values Education', code: '' },
        { name: 'Technology and Livelihood Education (TLE)', code: '' },
        { name: 'MAPEH', code: '' },
        { name: 'Music and Arts', code: 'MAPEH' },
        { name: 'Physical Education and Health', code: 'MAPEH' },
        { name: 'Specialization', code: '' }
    ],
    'Grade 9': [
        { name: 'Filipino', code: '' },
        { name: 'English', code: '' },
        { name: 'Mathematics', code: '' },
        { name: 'Science', code: '' },
        { name: 'Araling Panlipunan (AP)', code: '' },
        { name: 'Values Education', code: '' },
        { name: 'Technology and Livelihood Education (TLE)', code: '' },
        { name: 'MAPEH', code: '' },
        { name: 'Music and Arts', code: 'MAPEH' },
        { name: 'Physical Education and Health', code: 'MAPEH' },
        { name: 'Specialization', code: '' }
    ],
    'Grade 10': [
        { name: 'Filipino', code: '' },
        { name: 'English', code: '' },
        { name: 'Mathematics', code: '' },
        { name: 'Science', code: '' },
        { name: 'Araling Panlipunan (AP)', code: '' },
        { name: 'Values Education', code: '' },
        { name: 'Technology and Livelihood Education (TLE)', code: '' },
        { name: 'MAPEH', code: '' },
        { name: 'Music and Arts', code: 'MAPEH' },
        { name: 'Physical Education and Health', code: 'MAPEH' },
        { name: 'Specialization', code: '' }
    ]
};

export type GradeLevel = keyof typeof STANDARD_SUBJECTS;
