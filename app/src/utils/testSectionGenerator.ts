/**
 * Test Section Generator (Grades 1 to 12) — FormEase Pro
 * 
 * Provides an on-demand generator and cleanup utility for testing all DepEd
 * curriculum combinations across Key Stages 1 to 4:
 * - Key Stage 1 (G1–3): MATATAG Regular, SSES, ALIVE
 * - Key Stage 2 (G4–6): MATATAG Regular (8 Learning Areas), SSES, SPA, SPJ, SPS, ALIVE
 * - Key Stage 3 (G7–10): Regular (8 Core), STE, SPSTEM, SPA, SPJ, SPS, SPFL, SPTVE, ALIVE
 * - Key Stage 4 Grade 11: SSHS Academic (5 clusters) & TechPro (9 clusters)
 * - Key Stage 4 Grade 12: SHS Academic (STEM, ABM, HUMSS, GAS), TVL, Sports, Arts & Design
 * 
 * Includes comprehensive test students (complete DepEd learner details) per section.
 * 
 * GUARANTEE:
 * - Strictly for testing. Never hardcoded into database defaults, initial seeds, or client deployments.
 * - All generated sections are prefixed with [TEST] and tagged with is_test_data: true.
 * - All generated students have 12-digit LRNs starting with 999 and full learner profiles.
 * - One-click cleanup removes 100% of test records without altering authentic user data.
 */

import type { Section, Subject, Student, SubjectTermSelection, ClassRecord, HPSRecord, Enrollment } from '../types';
import { getCurriculumPreset, getDepEdWeightsForSubject } from '../lib/curriculumPresets';
import {
    getCurriculumTemplatesForSection,
    normalizeOfferedTerms,
    SSHS_G11_CORE_SUBJECTS
} from '../lib/curriculum';
import { normalizeSubjectName } from '../lib/subjectConfig';
import { isGmrcVeSubject } from '../services/ecr-excel-export';
import { computeLiveTransmutedGradeFromRecord } from './grading-helpers';
import { db } from '../services/database';
import { useAppStore } from '../stores/app-store';

export interface TestSectionSpec {
    idSuffix: string;
    sectionName: string;
    gradeLevel: string;
    category: 'elementary' | 'jhs' | 'shs';
    track?: string;
    strand?: string;
    cluster?: string;
    program?: 'Regular' | 'STE' | 'SPSTEM' | 'SPA' | 'SPS' | 'SPJ' | 'SPFL' | 'SPTVE' | 'SSES' | 'ALIVE' | string;
    curriculumType?: 'MATATAG' | 'K-12' | 'SSHS';
    spaMajors?: string[];
    adviserName?: string;
}

const GRADE11_CORE_NAMES = SSHS_G11_CORE_SUBJECTS.map((s) => s.name);

// Sample Pool for Generating Realistic Filipino Learners
const MALE_FIRST_NAMES = [
    'Juan', 'Carlo', 'Gabriel', 'Miguel', 'Paolo', 'Christian', 'Angelo',
    'Rafael', 'Daniel', 'Ethan', 'Joshua', 'Mark', 'John', 'David', 'Alexander'
];

const FEMALE_FIRST_NAMES = [
    'Maria', 'Sofia', 'Patricia', 'Angelica', 'Jasmine', 'Chloe', 'Bea',
    'Camille', 'Samantha', 'Andrea', 'Nicole', 'Alyssa', 'Katrina', 'Danielle'
];

const SURNAMES = [
    'Dela Cruz', 'Santos', 'Reyes', 'Bautista', 'Aquino', 'Mendoza', 'Garcia',
    'Ramos', 'Flores', 'Villanueva', 'Tolentino', 'Castro', 'Soriano', 'Corpuz',
    'Navarro', 'Salazar', 'Valdez', 'Morales', 'Pascual', 'Santiago'
];

const MIDDLE_NAMES = [
    'Alcantara', 'Mercado', 'Castillo', 'Ilagan', 'Domingo', 'Valenzuela',
    'Pascual', 'Santiago', 'Manalo', 'Roxas', 'Legaspi', 'Bernardo'
];

const ADDRESSES = [
    '123 Rizal St., Brgy. San Jose, City of San Fernando, Pampanga',
    '45 Mabini Ave., Brgy. Sto. Cristo, Guagua, Pampanga',
    '78 Bonifacio Rd., Brgy. Dolores, City of San Fernando, Pampanga',
    '12 Luna St., Brgy. Santa Ines, Mabalacat City, Pampanga',
    '89 Del Pilar St., Brgy. Poblacion, Angeles City, Pampanga',
    '56 Burgos St., Brgy. San Nicolas, City of San Fernando, Pampanga',
    '23 Aguinaldo St., Brgy. Lourdes, Angeles City, Pampanga',
    '67 Quezon Blvd., Brgy. San Matias, Sto. Tomas, Pampanga'
];

/**
 * Complete catalog of all Grade 1 to 12 curriculum combinations
 */
export const TEST_SECTION_SPECS: TestSectionSpec[] = [
    // -----------------------------------------------------------------------
    // GRADE 1 (Key Stage 1 - MATATAG DO 10, s. 2024)
    // -----------------------------------------------------------------------
    {
        idSuffix: 'g1-reg',
        sectionName: '[TEST] Grade 1 - Regular (MATATAG)',
        gradeLevel: 'Grade 1',
        category: 'elementary',
        program: 'Regular',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G1-Regular'
    },
    {
        idSuffix: 'g1-sses',
        sectionName: '[TEST] Grade 1 - SSES (Special Science)',
        gradeLevel: 'Grade 1',
        category: 'elementary',
        program: 'SSES',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G1-SSES'
    },
    {
        idSuffix: 'g1-alive',
        sectionName: '[TEST] Grade 1 - ALIVE (Madrasah)',
        gradeLevel: 'Grade 1',
        category: 'elementary',
        program: 'ALIVE',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G1-ALIVE'
    },

    // -----------------------------------------------------------------------
    // GRADE 2 (Key Stage 1 - MATATAG)
    // -----------------------------------------------------------------------
    {
        idSuffix: 'g2-reg',
        sectionName: '[TEST] Grade 2 - Regular (MATATAG)',
        gradeLevel: 'Grade 2',
        category: 'elementary',
        program: 'Regular',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G2-Regular'
    },
    {
        idSuffix: 'g2-sses',
        sectionName: '[TEST] Grade 2 - SSES (Special Science)',
        gradeLevel: 'Grade 2',
        category: 'elementary',
        program: 'SSES',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G2-SSES'
    },
    {
        idSuffix: 'g2-alive',
        sectionName: '[TEST] Grade 2 - ALIVE (Madrasah)',
        gradeLevel: 'Grade 2',
        category: 'elementary',
        program: 'ALIVE',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G2-ALIVE'
    },

    // -----------------------------------------------------------------------
    // GRADE 3 (Key Stage 1 - MATATAG)
    // -----------------------------------------------------------------------
    {
        idSuffix: 'g3-reg',
        sectionName: '[TEST] Grade 3 - Regular (MATATAG)',
        gradeLevel: 'Grade 3',
        category: 'elementary',
        program: 'Regular',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G3-Regular'
    },
    {
        idSuffix: 'g3-sses',
        sectionName: '[TEST] Grade 3 - SSES (Special Science)',
        gradeLevel: 'Grade 3',
        category: 'elementary',
        program: 'SSES',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G3-SSES'
    },
    {
        idSuffix: 'g3-alive',
        sectionName: '[TEST] Grade 3 - ALIVE (Madrasah)',
        gradeLevel: 'Grade 3',
        category: 'elementary',
        program: 'ALIVE',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G3-ALIVE'
    },

    // -----------------------------------------------------------------------
    // GRADE 4 (Key Stage 2 - 8 Learning Areas)
    // -----------------------------------------------------------------------
    {
        idSuffix: 'g4-reg',
        sectionName: '[TEST] Grade 4 - Regular (MATATAG 8 Areas)',
        gradeLevel: 'Grade 4',
        category: 'elementary',
        program: 'Regular',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G4-Regular'
    },
    {
        idSuffix: 'g4-sses',
        sectionName: '[TEST] Grade 4 - SSES (Special Science)',
        gradeLevel: 'Grade 4',
        category: 'elementary',
        program: 'SSES',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G4-SSES'
    },
    {
        idSuffix: 'g4-spa',
        sectionName: '[TEST] Grade 4 - SPA (Arts)',
        gradeLevel: 'Grade 4',
        category: 'elementary',
        program: 'SPA',
        curriculumType: 'MATATAG',
        spaMajors: ['Visual Arts', 'Music (Vocal)', 'Dance'],
        adviserName: 'Test Adviser G4-SPA'
    },
    {
        idSuffix: 'g4-spj',
        sectionName: '[TEST] Grade 4 - SPJ (Journalism)',
        gradeLevel: 'Grade 4',
        category: 'elementary',
        program: 'SPJ',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G4-SPJ'
    },
    {
        idSuffix: 'g4-sps',
        sectionName: '[TEST] Grade 4 - SPS (Sports)',
        gradeLevel: 'Grade 4',
        category: 'elementary',
        program: 'SPS',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G4-SPS'
    },
    {
        idSuffix: 'g4-alive',
        sectionName: '[TEST] Grade 4 - ALIVE (Madrasah)',
        gradeLevel: 'Grade 4',
        category: 'elementary',
        program: 'ALIVE',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G4-ALIVE'
    },

    // -----------------------------------------------------------------------
    // GRADE 5 (Key Stage 2)
    // -----------------------------------------------------------------------
    {
        idSuffix: 'g5-reg',
        sectionName: '[TEST] Grade 5 - Regular (MATATAG)',
        gradeLevel: 'Grade 5',
        category: 'elementary',
        program: 'Regular',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G5-Regular'
    },
    {
        idSuffix: 'g5-sses',
        sectionName: '[TEST] Grade 5 - SSES (Special Science)',
        gradeLevel: 'Grade 5',
        category: 'elementary',
        program: 'SSES',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G5-SSES'
    },
    {
        idSuffix: 'g5-spa',
        sectionName: '[TEST] Grade 5 - SPA (Arts)',
        gradeLevel: 'Grade 5',
        category: 'elementary',
        program: 'SPA',
        curriculumType: 'MATATAG',
        spaMajors: ['Visual Arts', 'Music (Vocal)', 'Dance'],
        adviserName: 'Test Adviser G5-SPA'
    },
    {
        idSuffix: 'g5-spj',
        sectionName: '[TEST] Grade 5 - SPJ (Journalism)',
        gradeLevel: 'Grade 5',
        category: 'elementary',
        program: 'SPJ',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G5-SPJ'
    },
    {
        idSuffix: 'g5-sps',
        sectionName: '[TEST] Grade 5 - SPS (Sports)',
        gradeLevel: 'Grade 5',
        category: 'elementary',
        program: 'SPS',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G5-SPS'
    },
    {
        idSuffix: 'g5-alive',
        sectionName: '[TEST] Grade 5 - ALIVE (Madrasah)',
        gradeLevel: 'Grade 5',
        category: 'elementary',
        program: 'ALIVE',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G5-ALIVE'
    },

    // -----------------------------------------------------------------------
    // GRADE 6 (Key Stage 2)
    // -----------------------------------------------------------------------
    {
        idSuffix: 'g6-reg',
        sectionName: '[TEST] Grade 6 - Regular (MATATAG)',
        gradeLevel: 'Grade 6',
        category: 'elementary',
        program: 'Regular',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G6-Regular'
    },
    {
        idSuffix: 'g6-sses',
        sectionName: '[TEST] Grade 6 - SSES (Special Science)',
        gradeLevel: 'Grade 6',
        category: 'elementary',
        program: 'SSES',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G6-SSES'
    },
    {
        idSuffix: 'g6-spa',
        sectionName: '[TEST] Grade 6 - SPA (Arts)',
        gradeLevel: 'Grade 6',
        category: 'elementary',
        program: 'SPA',
        curriculumType: 'MATATAG',
        spaMajors: ['Visual Arts', 'Theater Arts', 'Media Arts'],
        adviserName: 'Test Adviser G6-SPA'
    },
    {
        idSuffix: 'g6-spj',
        sectionName: '[TEST] Grade 6 - SPJ (Journalism)',
        gradeLevel: 'Grade 6',
        category: 'elementary',
        program: 'SPJ',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G6-SPJ'
    },
    {
        idSuffix: 'g6-sps',
        sectionName: '[TEST] Grade 6 - SPS (Sports)',
        gradeLevel: 'Grade 6',
        category: 'elementary',
        program: 'SPS',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G6-SPS'
    },
    {
        idSuffix: 'g6-alive',
        sectionName: '[TEST] Grade 6 - ALIVE (Madrasah)',
        gradeLevel: 'Grade 6',
        category: 'elementary',
        program: 'ALIVE',
        curriculumType: 'MATATAG',
        adviserName: 'Test Adviser G6-ALIVE'
    },

    // -----------------------------------------------------------------------
    // GRADE 7 (Key Stage 3 - Junior High School)
    // -----------------------------------------------------------------------
    {
        idSuffix: 'g7-reg',
        sectionName: '[TEST] Grade 7 - Regular (JHS Core)',
        gradeLevel: 'Grade 7',
        category: 'jhs',
        program: 'Regular',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G7-Regular'
    },
    {
        idSuffix: 'g7-ste',
        sectionName: '[TEST] Grade 7 - STE (Science & Tech)',
        gradeLevel: 'Grade 7',
        category: 'jhs',
        program: 'STE',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G7-STE'
    },
    {
        idSuffix: 'g7-spstem',
        sectionName: '[TEST] Grade 7 - SPSTEM (Special STEM)',
        gradeLevel: 'Grade 7',
        category: 'jhs',
        program: 'SPSTEM',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G7-SPSTEM'
    },
    {
        idSuffix: 'g7-spa',
        sectionName: '[TEST] Grade 7 - SPA (Special Arts)',
        gradeLevel: 'Grade 7',
        category: 'jhs',
        program: 'SPA',
        curriculumType: 'K-12',
        spaMajors: ['Visual Arts', 'Music (Vocal)', 'Dance', 'Theater Arts'],
        adviserName: 'Test Adviser G7-SPA'
    },
    {
        idSuffix: 'g7-spj',
        sectionName: '[TEST] Grade 7 - SPJ (Journalism)',
        gradeLevel: 'Grade 7',
        category: 'jhs',
        program: 'SPJ',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G7-SPJ'
    },
    {
        idSuffix: 'g7-sps',
        sectionName: '[TEST] Grade 7 - SPS (Sports)',
        gradeLevel: 'Grade 7',
        category: 'jhs',
        program: 'SPS',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G7-SPS'
    },
    {
        idSuffix: 'g7-spfl',
        sectionName: '[TEST] Grade 7 - SPFL (Foreign Language)',
        gradeLevel: 'Grade 7',
        category: 'jhs',
        program: 'SPFL',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G7-SPFL'
    },
    {
        idSuffix: 'g7-sptve',
        sectionName: '[TEST] Grade 7 - SPTVE (Tech-Voc)',
        gradeLevel: 'Grade 7',
        category: 'jhs',
        program: 'SPTVE',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G7-SPTVE'
    },
    {
        idSuffix: 'g7-alive',
        sectionName: '[TEST] Grade 7 - ALIVE (Madrasah)',
        gradeLevel: 'Grade 7',
        category: 'jhs',
        program: 'ALIVE',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G7-ALIVE'
    },

    // -----------------------------------------------------------------------
    // GRADE 8 (Key Stage 3)
    // -----------------------------------------------------------------------
    {
        idSuffix: 'g8-reg',
        sectionName: '[TEST] Grade 8 - Regular (JHS Core)',
        gradeLevel: 'Grade 8',
        category: 'jhs',
        program: 'Regular',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G8-Regular'
    },
    {
        idSuffix: 'g8-ste',
        sectionName: '[TEST] Grade 8 - STE (Science & Tech)',
        gradeLevel: 'Grade 8',
        category: 'jhs',
        program: 'STE',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G8-STE'
    },
    {
        idSuffix: 'g8-spstem',
        sectionName: '[TEST] Grade 8 - SPSTEM (Special STEM)',
        gradeLevel: 'Grade 8',
        category: 'jhs',
        program: 'SPSTEM',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G8-SPSTEM'
    },
    {
        idSuffix: 'g8-spa',
        sectionName: '[TEST] Grade 8 - SPA (Special Arts)',
        gradeLevel: 'Grade 8',
        category: 'jhs',
        program: 'SPA',
        curriculumType: 'K-12',
        spaMajors: ['Visual Arts', 'Music (Instrumental)', 'Dance'],
        adviserName: 'Test Adviser G8-SPA'
    },
    {
        idSuffix: 'g8-spj',
        sectionName: '[TEST] Grade 8 - SPJ (Journalism)',
        gradeLevel: 'Grade 8',
        category: 'jhs',
        program: 'SPJ',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G8-SPJ'
    },
    {
        idSuffix: 'g8-sps',
        sectionName: '[TEST] Grade 8 - SPS (Sports)',
        gradeLevel: 'Grade 8',
        category: 'jhs',
        program: 'SPS',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G8-SPS'
    },
    {
        idSuffix: 'g8-spfl',
        sectionName: '[TEST] Grade 8 - SPFL (Foreign Language)',
        gradeLevel: 'Grade 8',
        category: 'jhs',
        program: 'SPFL',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G8-SPFL'
    },
    {
        idSuffix: 'g8-sptve',
        sectionName: '[TEST] Grade 8 - SPTVE (Tech-Voc)',
        gradeLevel: 'Grade 8',
        category: 'jhs',
        program: 'SPTVE',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G8-SPTVE'
    },
    {
        idSuffix: 'g8-alive',
        sectionName: '[TEST] Grade 8 - ALIVE (Madrasah)',
        gradeLevel: 'Grade 8',
        category: 'jhs',
        program: 'ALIVE',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G8-ALIVE'
    },

    // -----------------------------------------------------------------------
    // GRADE 9 (Key Stage 3)
    // -----------------------------------------------------------------------
    {
        idSuffix: 'g9-reg',
        sectionName: '[TEST] Grade 9 - Regular (JHS Core)',
        gradeLevel: 'Grade 9',
        category: 'jhs',
        program: 'Regular',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G9-Regular'
    },
    {
        idSuffix: 'g9-ste',
        sectionName: '[TEST] Grade 9 - STE (Science & Tech)',
        gradeLevel: 'Grade 9',
        category: 'jhs',
        program: 'STE',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G9-STE'
    },
    {
        idSuffix: 'g9-spstem',
        sectionName: '[TEST] Grade 9 - SPSTEM (Special STEM)',
        gradeLevel: 'Grade 9',
        category: 'jhs',
        program: 'SPSTEM',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G9-SPSTEM'
    },
    {
        idSuffix: 'g9-spa',
        sectionName: '[TEST] Grade 9 - SPA (Special Arts)',
        gradeLevel: 'Grade 9',
        category: 'jhs',
        program: 'SPA',
        curriculumType: 'K-12',
        spaMajors: ['Visual Arts', 'Creative Writing', 'Media Arts'],
        adviserName: 'Test Adviser G9-SPA'
    },
    {
        idSuffix: 'g9-spj',
        sectionName: '[TEST] Grade 9 - SPJ (Journalism)',
        gradeLevel: 'Grade 9',
        category: 'jhs',
        program: 'SPJ',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G9-SPJ'
    },
    {
        idSuffix: 'g9-sps',
        sectionName: '[TEST] Grade 9 - SPS (Sports)',
        gradeLevel: 'Grade 9',
        category: 'jhs',
        program: 'SPS',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G9-SPS'
    },
    {
        idSuffix: 'g9-spfl',
        sectionName: '[TEST] Grade 9 - SPFL (Foreign Language)',
        gradeLevel: 'Grade 9',
        category: 'jhs',
        program: 'SPFL',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G9-SPFL'
    },
    {
        idSuffix: 'g9-sptve',
        sectionName: '[TEST] Grade 9 - SPTVE (Tech-Voc)',
        gradeLevel: 'Grade 9',
        category: 'jhs',
        program: 'SPTVE',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G9-SPTVE'
    },
    {
        idSuffix: 'g9-alive',
        sectionName: '[TEST] Grade 9 - ALIVE (Madrasah)',
        gradeLevel: 'Grade 9',
        category: 'jhs',
        program: 'ALIVE',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G9-ALIVE'
    },

    // -----------------------------------------------------------------------
    // GRADE 10 (Key Stage 3)
    // -----------------------------------------------------------------------
    {
        idSuffix: 'g10-reg',
        sectionName: '[TEST] Grade 10 - Regular (JHS Core)',
        gradeLevel: 'Grade 10',
        category: 'jhs',
        program: 'Regular',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G10-Regular'
    },
    {
        idSuffix: 'g10-ste',
        sectionName: '[TEST] Grade 10 - STE (Science & Tech)',
        gradeLevel: 'Grade 10',
        category: 'jhs',
        program: 'STE',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G10-STE'
    },
    {
        idSuffix: 'g10-spstem',
        sectionName: '[TEST] Grade 10 - SPSTEM (Special STEM)',
        gradeLevel: 'Grade 10',
        category: 'jhs',
        program: 'SPSTEM',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G10-SPSTEM'
    },
    {
        idSuffix: 'g10-spa',
        sectionName: '[TEST] Grade 10 - SPA (Special Arts)',
        gradeLevel: 'Grade 10',
        category: 'jhs',
        program: 'SPA',
        curriculumType: 'K-12',
        spaMajors: ['Visual Arts', 'Music (Vocal)', 'Dance', 'Media Arts'],
        adviserName: 'Test Adviser G10-SPA'
    },
    {
        idSuffix: 'g10-spj',
        sectionName: '[TEST] Grade 10 - SPJ (Journalism)',
        gradeLevel: 'Grade 10',
        category: 'jhs',
        program: 'SPJ',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G10-SPJ'
    },
    {
        idSuffix: 'g10-sps',
        sectionName: '[TEST] Grade 10 - SPS (Sports)',
        gradeLevel: 'Grade 10',
        category: 'jhs',
        program: 'SPS',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G10-SPS'
    },
    {
        idSuffix: 'g10-spfl',
        sectionName: '[TEST] Grade 10 - SPFL (Foreign Language)',
        gradeLevel: 'Grade 10',
        category: 'jhs',
        program: 'SPFL',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G10-SPFL'
    },
    {
        idSuffix: 'g10-sptve',
        sectionName: '[TEST] Grade 10 - SPTVE (Tech-Voc)',
        gradeLevel: 'Grade 10',
        category: 'jhs',
        program: 'SPTVE',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G10-SPTVE'
    },
    {
        idSuffix: 'g10-alive',
        sectionName: '[TEST] Grade 10 - ALIVE (Madrasah)',
        gradeLevel: 'Grade 10',
        category: 'jhs',
        program: 'ALIVE',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G10-ALIVE'
    },

    // -----------------------------------------------------------------------
    // GRADE 11 (SSHS Pilot — DepEd Order No. 017, s. 2026)
    // -----------------------------------------------------------------------
    // Academic Track Clusters
    {
        idSuffix: 'g11-stem',
        sectionName: '[TEST] Grade 11 SSHS - Academic (STEM)',
        gradeLevel: 'Grade 11',
        category: 'shs',
        track: 'Academic',
        strand: 'Science, Technology, Engineering, and Mathematics',
        cluster: 'Science, Technology, Engineering, and Mathematics',
        curriculumType: 'SSHS',
        adviserName: 'Test Adviser G11-STEM'
    },
    {
        idSuffix: 'g11-abm',
        sectionName: '[TEST] Grade 11 SSHS - Academic (ABM)',
        gradeLevel: 'Grade 11',
        category: 'shs',
        track: 'Academic',
        strand: 'Business and Entrepreneurship',
        cluster: 'Business and Entrepreneurship',
        curriculumType: 'SSHS',
        adviserName: 'Test Adviser G11-ABM'
    },
    {
        idSuffix: 'g11-humss',
        sectionName: '[TEST] Grade 11 SSHS - Academic (HUMSS)',
        gradeLevel: 'Grade 11',
        category: 'shs',
        track: 'Academic',
        strand: 'Arts, Social Sciences, and Humanities',
        cluster: 'Arts, Social Sciences, and Humanities',
        curriculumType: 'SSHS',
        adviserName: 'Test Adviser G11-HUMSS'
    },
    {
        idSuffix: 'g11-sports-health',
        sectionName: '[TEST] Grade 11 SSHS - Academic (Sports & Health)',
        gradeLevel: 'Grade 11',
        category: 'shs',
        track: 'Academic',
        strand: 'Sports, Health, and Wellness',
        cluster: 'Sports, Health, and Wellness',
        curriculumType: 'SSHS',
        adviserName: 'Test Adviser G11-SportsHealth'
    },
    {
        idSuffix: 'g11-field-exp',
        sectionName: '[TEST] Grade 11 SSHS - Academic (Field Experience)',
        gradeLevel: 'Grade 11',
        category: 'shs',
        track: 'Academic',
        strand: 'Field Experience',
        cluster: 'Field Experience',
        curriculumType: 'SSHS',
        adviserName: 'Test Adviser G11-FieldExp'
    },

    // Technical-Professional (TechPro) Clusters
    {
        idSuffix: 'g11-techpro-ict',
        sectionName: '[TEST] Grade 11 SSHS - TechPro (ICT & Programming)',
        gradeLevel: 'Grade 11',
        category: 'shs',
        track: 'Technical-Professional',
        strand: 'ICT Support and Computer Programming Technologies',
        cluster: 'ICT Support and Computer Programming Technologies',
        curriculumType: 'SSHS',
        adviserName: 'Test Adviser G11-ICT'
    },
    {
        idSuffix: 'g11-techpro-auto',
        sectionName: '[TEST] Grade 11 SSHS - TechPro (Automotive)',
        gradeLevel: 'Grade 11',
        category: 'shs',
        track: 'Technical-Professional',
        strand: 'Automotive and Small Engine Technologies',
        cluster: 'Automotive and Small Engine Technologies',
        curriculumType: 'SSHS',
        adviserName: 'Test Adviser G11-Auto'
    },
    {
        idSuffix: 'g11-techpro-hosp',
        sectionName: '[TEST] Grade 11 SSHS - TechPro (Hospitality & Tourism)',
        gradeLevel: 'Grade 11',
        category: 'shs',
        track: 'Technical-Professional',
        strand: 'Hospitality and Tourism',
        cluster: 'Hospitality and Tourism',
        curriculumType: 'SSHS',
        adviserName: 'Test Adviser G11-Hosp'
    },
    {
        idSuffix: 'g11-techpro-aesthetic',
        sectionName: '[TEST] Grade 11 SSHS - TechPro (Aesthetic & Human Care)',
        gradeLevel: 'Grade 11',
        category: 'shs',
        track: 'Technical-Professional',
        strand: 'Aesthetic, Wellness, and Human Care',
        cluster: 'Aesthetic, Wellness, and Human Care',
        curriculumType: 'SSHS',
        adviserName: 'Test Adviser G11-Aesthetic'
    },
    {
        idSuffix: 'g11-techpro-agri',
        sectionName: '[TEST] Grade 11 SSHS - TechPro (Agri-Fishery & Food)',
        gradeLevel: 'Grade 11',
        category: 'shs',
        track: 'Technical-Professional',
        strand: 'Agri-Fishery Business and Food Innovation',
        cluster: 'Agri-Fishery Business and Food Innovation',
        curriculumType: 'SSHS',
        adviserName: 'Test Adviser G11-Agri'
    },
    {
        idSuffix: 'g11-techpro-const',
        sectionName: '[TEST] Grade 11 SSHS - TechPro (Construction & Building)',
        gradeLevel: 'Grade 11',
        category: 'shs',
        track: 'Technical-Professional',
        strand: 'Construction and Building Technologies',
        cluster: 'Construction and Building Technologies',
        curriculumType: 'SSHS',
        adviserName: 'Test Adviser G11-Const'
    },
    {
        idSuffix: 'g11-techpro-design',
        sectionName: '[TEST] Grade 11 SSHS - TechPro (Creative Arts & Design)',
        gradeLevel: 'Grade 11',
        category: 'shs',
        track: 'Technical-Professional',
        strand: 'Creative Arts and Design Technologies',
        cluster: 'Creative Arts and Design Technologies',
        curriculumType: 'SSHS',
        adviserName: 'Test Adviser G11-Design'
    },
    {
        idSuffix: 'g11-techpro-ind',
        sectionName: '[TEST] Grade 11 SSHS - TechPro (Industrial Tech)',
        gradeLevel: 'Grade 11',
        category: 'shs',
        track: 'Technical-Professional',
        strand: 'Industrial Technologies',
        cluster: 'Industrial Technologies',
        curriculumType: 'SSHS',
        adviserName: 'Test Adviser G11-Ind'
    },
    {
        idSuffix: 'g11-techpro-mari',
        sectionName: '[TEST] Grade 11 SSHS - TechPro (Maritime)',
        gradeLevel: 'Grade 11',
        category: 'shs',
        track: 'Technical-Professional',
        strand: 'Maritime',
        cluster: 'Maritime',
        curriculumType: 'SSHS',
        adviserName: 'Test Adviser G11-Mari'
    },

    // -----------------------------------------------------------------------
    // GRADE 12 (Universal 3-Term Model)
    // -----------------------------------------------------------------------
    {
        idSuffix: 'g12-stem',
        sectionName: '[TEST] Grade 12 - Academic (STEM)',
        gradeLevel: 'Grade 12',
        category: 'shs',
        track: 'Academic',
        strand: 'STEM',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G12-STEM'
    },
    {
        idSuffix: 'g12-abm',
        sectionName: '[TEST] Grade 12 - Academic (ABM)',
        gradeLevel: 'Grade 12',
        category: 'shs',
        track: 'Academic',
        strand: 'ABM',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G12-ABM'
    },
    {
        idSuffix: 'g12-humss',
        sectionName: '[TEST] Grade 12 - Academic (HUMSS)',
        gradeLevel: 'Grade 12',
        category: 'shs',
        track: 'Academic',
        strand: 'HUMSS',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G12-HUMSS'
    },
    {
        idSuffix: 'g12-gas',
        sectionName: '[TEST] Grade 12 - Academic (GAS)',
        gradeLevel: 'Grade 12',
        category: 'shs',
        track: 'Academic',
        strand: 'GAS',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G12-GAS'
    },
    {
        idSuffix: 'g12-tvl',
        sectionName: '[TEST] Grade 12 - TVL Track',
        gradeLevel: 'Grade 12',
        category: 'shs',
        track: 'TVL',
        strand: 'TVL',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G12-TVL'
    },
    {
        idSuffix: 'g12-sports',
        sectionName: '[TEST] Grade 12 - Sports Track',
        gradeLevel: 'Grade 12',
        category: 'shs',
        track: 'Sports',
        strand: 'Sports Track',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G12-Sports'
    },
    {
        idSuffix: 'g12-arts',
        sectionName: '[TEST] Grade 12 - Arts & Design Track',
        gradeLevel: 'Grade 12',
        category: 'shs',
        track: 'Arts and Design',
        strand: 'Arts and Design Track',
        curriculumType: 'K-12',
        adviserName: 'Test Adviser G12-Arts'
    }
];

export interface GeneratedTestData {
    sections: Section[];
    subjects: Subject[];
    students: Student[];
}

/**
 * Generate complete, realistic DepEd student profiles for a test section
 */
export function buildTestStudentsForSection(
    section: Section,
    spec: TestSectionSpec,
    specIndex: number,
    countPerSection: number = 6
): Student[] {
    const students: Student[] = [];
    const gradeNum = parseInt(section.section_grade_level.replace(/\D/g, '')) || 7;
    const isElementary = gradeNum >= 1 && gradeNum <= 6;

    // Appropriate age and birth year based on DepEd standard school entry
    // Grade 1 = 6 yrs old (born 2020 for SY 2026-2027)
    // Grade 7 = 12 yrs old (born 2014)
    // Grade 11 = 16 yrs old (born 2010)
    // Grade 12 = 17 yrs old (born 2009)
    const baseAge = gradeNum + 5;
    const birthYear = 2026 - baseAge;

    for (let i = 0; i < countPerSection; i++) {
        const isMale = i < Math.ceil(countPerSection / 2);
        const gender: 'Male' | 'Female' = isMale ? 'Male' : 'Female';

        // Deterministic unique 12-digit LRN starting with 999
        // Format: 999 + 3-digit spec index + 2-digit student index + 4 digits
        const globalNum = specIndex * 100 + (i + 1);
        const lrn = `999${String(globalNum).padStart(9, '0')}`;

        const firstNamePool = isMale ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;
        const firstName = firstNamePool[(specIndex * 3 + i) % firstNamePool.length];
        const lastName = SURNAMES[(specIndex * 5 + i * 2) % SURNAMES.length];
        const middleName = MIDDLE_NAMES[(specIndex * 2 + i) % MIDDLE_NAMES.length];
        const nameExtension = isMale && i === 0 && specIndex % 3 === 0 ? 'Jr.' : undefined;

        // Spread birthdays across months
        const birthMonth = String((i * 2 + 1) % 12 + 1).padStart(2, '0');
        const birthDay = String((i * 4 + 5) % 28 + 1).padStart(2, '0');
        const birthday = `${birthYear}-${birthMonth}-${birthDay}`;

        const address = ADDRESSES[(specIndex + i) % ADDRESSES.length];
        const contactNumber = `09${17 + (i % 5)}-555-${String(globalNum % 10000).padStart(4, '0')}`;

        // Realistic SF8 nutritional metrics based on age
        // G1: ~21 kg, 1.16 m | G7: ~44 kg, 1.51 m | G11-12: ~54 kg, 1.64 m
        const weightBase = 16 + gradeNum * 3.2 + (i % 3) * 1.5;
        const heightBase = 1.05 + gradeNum * 0.05 + (i % 3) * 0.02;
        const weight = Math.round(weightBase * 10) / 10;
        const height = Math.round(heightBase * 100) / 100;
        const heightSquared = Math.round(height * height * 100) / 100;
        const bmi = Math.round((weight / (height * height)) * 10) / 10;

        const studentId = `test-stud-${spec.idSuffix}-${i + 1}`;

        const student: Student = {
            id: studentId,
            is_test_data: true,
            lrn,
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            name_extension: nameExtension,
            gender,
            birthday,
            age: baseAge,
            address,
            contact_number: contactNumber,
            grade_level: section.section_grade_level,
            student_section: section.id,
            track: section.track,
            strand: section.strand,
            cluster: section.cluster,
            program: section.program,
            curriculum: section.curriculum_type,
            weight,
            height,
            heightSquared,
            bmi,
            bmi_category: 'Normal',
            hfa: 'Normal',
            remarks: 'Promoted',
            enrollment_date: '2026-06-01',

            // Checklist of requirements for advisory class
            req_report_card: true,
            req_birth_cert: true,
            req_sf10: true,
            req_good_moral: true,
            req_1st_term: true,
            req_2nd_term: true,
            req_3rd_term: true,
            kinder_progress_report: isElementary,
            eccd_checklist: isElementary,
            kinder_completion_cert: isElementary
        };

        students.push(student);
    }

    return students;
}

/**
 * Build section, subject, and student objects from specifications
 */
export function buildTestSectionRecords(
    filterCategory: 'all' | 'elementary' | 'jhs' | 'shs' | string = 'all',
    includeStudents: boolean = true,
    studentsPerSection: number = 6,
    asTeachingLoad: boolean = true,
    includeClassRecords: boolean = true,
    activeSchoolYear: string = '2026-2027'
): {
    sections: Section[];
    subjects: Subject[];
    students: Student[];
    hpsRecords: HPSRecord[];
    classRecords: ClassRecord[];
    gradingSheetRecords: ClassRecord[];
} {
    const normFilter = filterCategory.toLowerCase();
    const specs = TEST_SECTION_SPECS.filter((spec) => {
        if (normFilter === 'all') return true;
        if (normFilter === 'elementary') return spec.category === 'elementary';
        if (normFilter === 'jhs' || normFilter === 'junior high') return spec.category === 'jhs';
        if (normFilter === 'shs' || normFilter === 'senior high') return spec.category === 'shs';
        if (normFilter.startsWith('grade')) return spec.gradeLevel.toLowerCase() === normFilter;
        return true;
    });

    const generatedSections: Section[] = [];
    const generatedSubjects: Subject[] = [];
    const generatedStudents: Student[] = [];

    specs.forEach((spec, specIdx) => {
        const sectionId = `test-sec-${spec.idSuffix}`;
        const isG11 = spec.gradeLevel.includes('11');
        const isG12 = spec.gradeLevel.includes('12');
        const isSHS = isG11 || isG12;

        // Resolve official subjects from curriculum preset or templates
        let subjectsList: string[] = [];
        const subjectTerms: Record<string, SubjectTermSelection> = {};

        const preset = getCurriculumPreset(
            spec.gradeLevel,
            spec.track,
            spec.cluster || spec.strand,
            spec.program || 'Regular'
        );

        if (preset && preset.subjects.length > 0) {
            subjectsList = preset.subjects.map((s) => s.name);
            preset.subjects.forEach((s) => {
                subjectTerms[s.name] = s.term;
            });
        } else {
            // Fallback to curriculum templates
            const templates = getCurriculumTemplatesForSection(
                spec.gradeLevel,
                spec.program,
                spec.spaMajors,
                spec.track,
                spec.strand || spec.cluster
            );
            subjectsList = templates.map((t) => t.name);
            templates.forEach((t) => {
                subjectTerms[t.name] = isSHS ? (t.term ?? 1) : 'all';
            });
        }

        // Ensure Grade 11 Core subjects are included if SSHS
        if (isG11) {
            GRADE11_CORE_NAMES.forEach((core) => {
                if (!subjectsList.some((s) => s.toLowerCase() === core.toLowerCase())) {
                    subjectsList.unshift(core);
                }
                subjectTerms[core] = 'all';
            });
        }

        const sectionRecord: Section = {
            id: sectionId,
            is_test_data: true,
            section_name: spec.sectionName,
            section_grade_level: spec.gradeLevel,
            adviser_id: `test-adv-${spec.idSuffix}`,
            adviser_name: spec.adviserName || 'Test Adviser',
            is_advisory: true,
            is_teaching_load: asTeachingLoad,
            track: isSHS ? spec.track : undefined,
            strand: isSHS ? spec.strand : undefined,
            cluster: isG11 ? spec.cluster : undefined,
            program: !isSHS ? spec.program || 'Regular' : undefined,
            curriculum_type: spec.curriculumType || (isG11 ? 'SSHS' : spec.gradeLevel.includes('Grade 1') || spec.gradeLevel.includes('Grade 2') || spec.gradeLevel.includes('Grade 3') ? 'MATATAG' : 'K-12'),
            spa_majors: spec.spaMajors,
            taught_subjects: subjectsList,
            teaching_subjects: asTeachingLoad ? subjectsList : [],
            section_metadata: {
                subjectTerms,
                customColumnWidths: {},
                lockedQuarters: [],
                hiddenConsolidatedSubjects: []
            }
        };

        generatedSections.push(sectionRecord);

        // Build individual subject offering records
        subjectsList.forEach((subName, idx) => {
            const weights = getDepEdWeightsForSubject(subName, spec.gradeLevel, spec.track);
            const effTerm = subjectTerms[subName] || (isSHS ? 1 : 'all');
            const offeredTerms = normalizeOfferedTerms(effTerm);
            const legacyTerm = offeredTerms.length === 3
                ? 'all'
                : offeredTerms.length === 1
                    ? offeredTerms[0]
                    : 'none';

            const subSlug = normalizeSubjectName(subName).replace(/[^a-z0-9]/g, '-').slice(0, 24);
            const subjectId = `test-subj-${spec.idSuffix}-${subSlug}-${idx}`;

            const isArabicOrNonGraded = subName.toLowerCase().includes('arabic language') ||
                subName.toLowerCase().includes('islamic values');

            const subjectRecord: Subject = {
                id: subjectId,
                is_test_data: true,
                subject_name: subName,
                grade_level: spec.gradeLevel,
                section_id: sectionId,
                is_teaching_load: asTeachingLoad,
                term: legacyTerm,
                offered_terms: offeredTerms,
                order: idx + 1,
                written_weight: weights.written_weight,
                performance_weight: weights.performance_weight,
                exam_weight: weights.exam_weight,
                counts_in_general_average: !isArabicOrNonGraded
            };

            generatedSubjects.push(subjectRecord);
        });

        // Build test students for this section if requested
        if (includeStudents) {
            const sectionStudents = buildTestStudentsForSection(
                sectionRecord,
                spec,
                specIdx,
                studentsPerSection
            );
            generatedStudents.push(...sectionStudents);
        }
    });

    let generatedHpsRecords: HPSRecord[] = [];
    let generatedClassRecords: ClassRecord[] = [];
    let generatedGradingSheetRecords: ClassRecord[] = [];

    if (includeClassRecords) {
        generatedHpsRecords = buildTestHpsRecords(generatedSections, generatedSubjects, activeSchoolYear);
        if (includeStudents && generatedStudents.length > 0) {
            const assessment = buildTestClassRecords(
                generatedSections,
                generatedSubjects,
                generatedStudents,
                generatedHpsRecords,
                activeSchoolYear
            );
            generatedClassRecords = assessment.classRecords;
            generatedGradingSheetRecords = assessment.gradingSheetRecords;
        }
    }

    return {
        sections: generatedSections,
        subjects: generatedSubjects,
        students: generatedStudents,
        hpsRecords: generatedHpsRecords,
        classRecords: generatedClassRecords,
        gradingSheetRecords: generatedGradingSheetRecords
    };
}

/**
 * Standard HPS templates for DepEd curriculum levels
 */
export const HPS_TEMPLATE_STANDARD = {
    written_works: [20, 25, 20, 25, 30], // 5 items, total 120
    performance_tasks: [50, 50, 60], // 3 items, total 160 (aligned with DepEd Grades 2-10 ECR template: 3 PT columns N, O, P)
    summative_tests: [25, 25, 50], // ST1: 25, ST2: 25, QE: 50
    quarterly_exam: 50
};

export const HPS_TEMPLATE_GMRC = {
    // 5 cognitive (15, 20, 15, 20, 20) + 5 affective (10, 10, 10, 10, 10)
    written_works: [15, 20, 15, 20, 20, 10, 10, 10, 10, 10], // 10 items, total 140
    // 3 cognitive (30, 30, 30) + 3 affective (20, 20, 20) + 3 behavioral (50, 50, 50)
    performance_tasks: [30, 30, 30, 20, 20, 20, 50, 50, 50], // 9 items, total 300
    summative_tests: [25, 25, 50],
    quarterly_exam: 50
};

export const HPS_TEMPLATE_SHS = {
    // 10 items for SHS Written Works
    written_works: [20, 20, 25, 25, 20, 20, 25, 25, 20, 20], // 10 items, total 220
    // 10 items for SHS Performance Tasks
    performance_tasks: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50], // 10 items, total 500
    summative_tests: [25, 25, 50],
    quarterly_exam: 50
};

/**
 * Build Highest Possible Scores (HPS) records for test subjects
 */
export function buildTestHpsRecords(
    sections: Section[],
    subjects: Subject[],
    activeSchoolYear: string = '2026-2027'
): HPSRecord[] {
    const sectionMap = new Map(sections.map(s => [s.id, s]));
    const hpsRecords: HPSRecord[] = [];

    subjects.forEach((subject) => {
        const sec = subject.section_id ? sectionMap.get(subject.section_id) : undefined;
        const gradeLevel = subject.grade_level || sec?.section_grade_level || '';
        const isSHS = gradeLevel.includes('11') || gradeLevel.includes('12');
        const isGmrc = isGmrcVeSubject(subject.subject_name);

        const template = isGmrc
            ? HPS_TEMPLATE_GMRC
            : isSHS
                ? HPS_TEMPLATE_SHS
                : HPS_TEMPLATE_STANDARD;

        const offeredTerms = (subject.offered_terms && subject.offered_terms.length > 0)
            ? subject.offered_terms
            : [1, 2, 3];

        offeredTerms.forEach((q) => {
            const hpsId = `test-hps-${subject.id}-q${q}`;
            const hpsRecord: HPSRecord & { summative_tests?: (number | string)[] } = {
                id: hpsId,
                is_test_data: true,
                subject_id: subject.id,
                subject_name: subject.subject_name,
                section_id: subject.section_id,
                school_year: activeSchoolYear,
                quarter: q as 1 | 2 | 3,
                written_works: [...template.written_works],
                performance_tasks: [...template.performance_tasks],
                quarterly_exam: template.quarterly_exam,
                summative_tests: [...template.summative_tests]
            };
            hpsRecords.push(hpsRecord as HPSRecord);
        });
    });

    return hpsRecords;
}

/**
 * Build random student assessment records (ClassRecord) for test learners
 */
export function buildTestClassRecords(
    sections: Section[],
    subjects: Subject[],
    students: Student[],
    hpsRecords: HPSRecord[],
    activeSchoolYear: string = '2026-2027'
): { classRecords: ClassRecord[]; gradingSheetRecords: ClassRecord[] } {
    const sectionMap = new Map(sections.map(s => [s.id, s]));
    const hpsMap = new Map(hpsRecords.map(h => [`${h.subject_id}_q${h.quarter}`, h]));
    const classRecords: ClassRecord[] = [];
    const gradingSheetRecords: ClassRecord[] = [];

    // Group subjects by section
    const subjectsBySection = new Map<string, Subject[]>();
    subjects.forEach((subj) => {
        if (!subj.section_id) return;
        const existing = subjectsBySection.get(subj.section_id) || [];
        existing.push(subj);
        subjectsBySection.set(subj.section_id, existing);
    });

    // Score variations across learners: high achievers, above average, average, developing
    const studentBaseFactors = [0.94, 0.88, 0.82, 0.95, 0.85, 0.78, 0.91, 0.84, 0.89, 0.79];

    students.forEach((student, studentIdx) => {
        const secId = student.student_section;
        if (!secId) return;
        const sec = sectionMap.get(secId);
        const secSubjects = subjectsBySection.get(secId) || [];
        const baseFactor = studentBaseFactors[studentIdx % studentBaseFactors.length];

        secSubjects.forEach((subject) => {
            const offeredTerms = (subject.offered_terms && subject.offered_terms.length > 0)
                ? subject.offered_terms
                : [1, 2, 3];

            // Deterministic subject hash to ensure independent, distinct scores across subjects (e.g., Music & Arts vs PE & Health)
            const subjSeed = (subject.id + (subject.subject_name || '')).split('').reduce((acc, c, idx) => acc + c.charCodeAt(0) * (idx + 1), 0);

            offeredTerms.forEach((q) => {
                const hpsKey = `${subject.id}_q${q}`;
                const hps = hpsMap.get(hpsKey);
                if (!hps) return;

                const rawHpsQa = (hps as HPSRecord & { summative_tests?: (number | string)[] }).summative_tests || [25, 25, 50];

                // Natural learner performance variation across quarters/terms (Term 1, Term 2, Term 3: ±0.035 to ±0.045)
                const termDrift = Math.sin(studentIdx * 11 + q * 17 + subjSeed * 5) * 0.038;
                const studentTermBase = Math.min(0.96, Math.max(0.68, baseFactor + termDrift));

                const generateScore = (maxHps: number, itemIdx: number): number => {
                    if (!maxHps || maxHps <= 0) return 0;
                    // Deterministic pseudo-random variation based on student, subject, item, and quarter
                    const jitter = ((Math.sin(studentIdx * 7 + itemIdx * 13 + q * 19 + subjSeed * 3) + 1) / 2) * 0.12 - 0.06;
                    const factor = Math.min(0.98, Math.max(0.65, studentTermBase + jitter));
                    return Math.max(1, Math.min(maxHps, Math.round(maxHps * factor)));
                };

                const studentWw = hps.written_works.map((itemHps, i) => generateScore(Number(itemHps), i));
                const studentPt = hps.performance_tasks.map((itemHps, i) => generateScore(Number(itemHps), i + 20));
                const studentSt = rawHpsQa.map((itemHps, i) => generateScore(Number(itemHps), i + 40));
                const studentQe = studentSt[2] ?? generateScore(Number(hps.quarterly_exam) || 50, 50);

                const crId = `test-cr-${secId}-${subject.id}-${student.lrn}-q${q}`;
                const gsId = `test-gs-${secId}-${subject.id}-${student.lrn}-q${q}`;

                const cRecord: ClassRecord & { summative_tests?: (number | string)[] } = {
                    id: crId,
                    is_test_data: true,
                    student_lrn: student.lrn,
                    section_id: secId,
                    subject_id: subject.id,
                    subject_name: subject.subject_name,
                    school_year: activeSchoolYear,
                    quarter: q as 1 | 2 | 3,
                    written_works: studentWw,
                    performance_tasks: studentPt,
                    quarterly_exam: studentQe,
                    summative_tests: studentSt,
                    is_teaching_load: true,
                    grade_source: 'eclass_sync'
                };

                // Compute live transmuted grade
                const computedGrade = computeLiveTransmutedGradeFromRecord(
                    cRecord,
                    hps,
                    {
                        subjectName: subject.subject_name,
                        gradeLevel: sec?.section_grade_level || subject.grade_level,
                        track: sec?.track,
                        schoolYear: activeSchoolYear,
                        weights: (subject.written_weight && subject.performance_weight && subject.exam_weight) ? {
                            written_works: subject.written_weight,
                            performance_tasks: subject.performance_weight,
                            quarterly_exam: subject.exam_weight
                        } : undefined
                    }
                );

                const finalGrade = computedGrade > 0 ? computedGrade : Math.round(75 + baseFactor * 20);
                cRecord.final_grade = finalGrade;

                const gRecord: ClassRecord = {
                    ...cRecord,
                    id: gsId
                };

                classRecords.push(cRecord);
                gradingSheetRecords.push(gRecord);
            });
        });
    });

    return { classRecords, gradingSheetRecords };
}

/**
 * Generate test sections, students, and assessment records on demand and save to database & store
 */
export async function generateTestSections(
    filterCategory: 'all' | 'elementary' | 'jhs' | 'shs' | string = 'all',
    includeStudents: boolean = true,
    studentsPerSection: number = 6,
    asTeachingLoad: boolean = true,
    includeClassRecords: boolean = true
): Promise<{
    sectionCount: number;
    subjectCount: number;
    studentCount: number;
    hpsRecordCount: number;
    classRecordCount: number;
}> {
    const activeSchoolYear = useAppStore.getState().activeSchoolYear || '2026-2027';
    const {
        sections,
        subjects,
        students,
        hpsRecords,
        classRecords,
        gradingSheetRecords
    } = buildTestSectionRecords(
        filterCategory,
        includeStudents,
        studentsPerSection,
        asTeachingLoad,
        includeClassRecords,
        activeSchoolYear
    );

    // Save to IndexedDB (Dexie) in bulk
    await db.putRecordsBulk('sections', sections);
    await db.putRecordsBulk('subjects', subjects);
    if (students.length > 0) {
        await db.putRecordsBulk('students', students);
    }
    if (hpsRecords.length > 0) {
        await db.putRecordsBulk('hpsRecords', hpsRecords);
    }
    if (classRecords.length > 0) {
        await db.putRecordsBulk('classRecords', classRecords);
    }
    if (gradingSheetRecords.length > 0) {
        await db.putRecordsBulk('gradingSheetRecords', gradingSheetRecords);
    }

    // Update Zustand state in-memory
    const currentSections = useAppStore.getState().sections;
    const currentSubjects = useAppStore.getState().subjects;
    const currentStudents = useAppStore.getState().students;
    const currentHpsRecords = useAppStore.getState().hpsRecords;
    const currentClassRecords = useAppStore.getState().classRecords;
    const currentGradingSheetRecords = useAppStore.getState().gradingSheetRecords;

    const remainingSections = currentSections.filter((s) => !isTestSection(s));
    const remainingSubjects = currentSubjects.filter((s) => !isTestSubject(s));
    const remainingStudents = currentStudents.filter((s) => !isTestStudent(s));
    const remainingHpsRecords = currentHpsRecords.filter((h) => !isTestHpsRecord(h));
    const remainingClassRecords = currentClassRecords.filter((c) => !isTestClassRecord(c));
    const remainingGradingSheetRecords = currentGradingSheetRecords.filter((g) => !isTestClassRecord(g));

    useAppStore.setState({
        sections: [...remainingSections, ...sections],
        subjects: [...remainingSubjects, ...subjects],
        students: [...remainingStudents, ...students],
        studentProfiles: [...remainingStudents, ...students],
        hpsRecords: [...remainingHpsRecords, ...hpsRecords],
        classRecords: [...remainingClassRecords, ...classRecords],
        gradingSheetRecords: [...remainingGradingSheetRecords, ...gradingSheetRecords]
    });

    return {
        sectionCount: sections.length,
        subjectCount: subjects.length,
        studentCount: students.length,
        hpsRecordCount: hpsRecords.length,
        classRecordCount: classRecords.length
    };
}

/**
 * Remove all test sections, test subjects, test students, and test assessment records
 */
export async function clearTestSections(): Promise<{
    deletedSections: number;
    deletedSubjects: number;
    deletedStudents: number;
    deletedHpsRecords: number;
    deletedClassRecords: number;
    deletedGradingSheetRecords: number;
    deletedEnrollments: number;
}> {
    const store = useAppStore.getState();
    const currentSections = store.sections || [];
    const currentSubjects = store.subjects || [];
    const currentStudents = store.students || [];
    const currentHpsRecords = store.hpsRecords || [];
    const currentClassRecords = store.classRecords || [];
    const currentGradingSheetRecords = store.gradingSheetRecords || [];
    const currentEnrollments = store.enrollments || [];

    // Query IndexedDB directly to ensure records not in the in-memory store are also found and cleared
    let dbSections: Section[] = [];
    let dbSubjects: Subject[] = [];
    let dbStudents: Student[] = [];
    let dbHpsRecords: HPSRecord[] = [];
    let dbClassRecords: ClassRecord[] = [];
    let dbGradingSheetRecords: ClassRecord[] = [];
    let dbEnrollments: Enrollment[] = [];

    try {
        dbSections = (await db.getAllRecords<Section>('sections')) || [];
    } catch (_e) {
        // Ignore DB read failure
    }
    try {
        dbSubjects = (await db.getAllRecords<Subject>('subjects')) || [];
    } catch (_e) {
        // Ignore DB read failure
    }
    try {
        dbStudents = (await db.getAllRecords<Student>('students')) || [];
    } catch (_e) {
        // Ignore DB read failure
    }
    try {
        dbHpsRecords = (await db.getAllRecords<HPSRecord>('hpsRecords')) || [];
    } catch (_e) {
        // Ignore DB read failure
    }
    try {
        dbClassRecords = (await db.getAllRecords<ClassRecord>('classRecords')) || [];
    } catch (_e) {
        // Ignore DB read failure
    }
    try {
        dbGradingSheetRecords = (await db.getAllRecords<ClassRecord>('gradingSheetRecords')) || [];
    } catch (_e) {
        // Ignore DB read failure
    }
    try {
        dbEnrollments = (await db.getAllRecords<Enrollment>('enrollments')) || [];
    } catch (_e) {
        // Ignore DB read failure
    }

    // Deduplicate lists of all existing entities across in-memory store and IndexedDB
    const allSectionsMap = new Map<string, Section>();
    [...currentSections, ...dbSections].forEach((s) => { if (s?.id) allSectionsMap.set(s.id, s); });
    const allSections = Array.from(allSectionsMap.values());

    const allSubjectsMap = new Map<string, Subject>();
    [...currentSubjects, ...dbSubjects].forEach((s) => { if (s?.id) allSubjectsMap.set(s.id, s); });
    const allSubjects = Array.from(allSubjectsMap.values());

    const allStudentsMap = new Map<string, Student>();
    [...currentStudents, ...dbStudents].forEach((s) => { if (s?.lrn) allStudentsMap.set(s.lrn, s); });
    const allStudents = Array.from(allStudentsMap.values());

    const allHpsMap = new Map<string, HPSRecord>();
    [...currentHpsRecords, ...dbHpsRecords].forEach((h) => { if (h?.id) allHpsMap.set(h.id, h); });
    const allHpsRecords = Array.from(allHpsMap.values());

    const allClassRecordsMap = new Map<string, ClassRecord>();
    [...currentClassRecords, ...dbClassRecords].forEach((c) => { if (c?.id) allClassRecordsMap.set(c.id, c); });
    const allClassRecords = Array.from(allClassRecordsMap.values());

    const allGradingSheetRecordsMap = new Map<string, ClassRecord>();
    [...currentGradingSheetRecords, ...dbGradingSheetRecords].forEach((g) => { if (g?.id) allGradingSheetRecordsMap.set(g.id, g); });
    const allGradingSheetRecords = Array.from(allGradingSheetRecordsMap.values());

    const allEnrollmentsMap = new Map<string, Enrollment>();
    [...currentEnrollments, ...dbEnrollments].forEach((e) => { if (e?.id) allEnrollmentsMap.set(e.id, e); });
    const allEnrollments = Array.from(allEnrollmentsMap.values());

    // Identify test entities
    const testSections = allSections.filter(isTestSection);
    const testSectionIds = new Set(testSections.map((s) => s.id));

    const testSubjects = allSubjects.filter((s) => isTestSubject(s) || (s.section_id && testSectionIds.has(s.section_id)));
    const testSubjectIds = new Set(testSubjects.map((s) => s.id));

    const testStudents = allStudents.filter((s) => isTestStudent(s) || (s.student_section && testSectionIds.has(s.student_section)));
    const testStudentLrns = new Set(testStudents.map((s) => s.lrn));

    const testHpsRecords = allHpsRecords.filter((h) =>
        isTestHpsRecord(h) ||
        (h.section_id && testSectionIds.has(h.section_id)) ||
        (h.subject_id && testSubjectIds.has(h.subject_id))
    );
    const testHpsIds = new Set(testHpsRecords.map((h) => h.id));

    const testClassRecords = allClassRecords.filter((c) =>
        isTestClassRecord(c) ||
        (c.section_id && testSectionIds.has(c.section_id)) ||
        (c.student_lrn && testStudentLrns.has(c.student_lrn)) ||
        (c.subject_id && testSubjectIds.has(c.subject_id))
    );
    const testClassRecordIds = new Set(testClassRecords.map((c) => c.id));

    const testGradingSheets = allGradingSheetRecords.filter((g) =>
        isTestClassRecord(g) ||
        (g.section_id && testSectionIds.has(g.section_id)) ||
        (g.student_lrn && testStudentLrns.has(g.student_lrn)) ||
        (g.subject_id && testSubjectIds.has(g.subject_id))
    );
    const testGradingSheetIds = new Set(testGradingSheets.map((g) => g.id));

    const testEnrollments = allEnrollments.filter((e) => {
        const sec = e.student_section || '';
        return (
            (e.id && (e.id.startsWith('test-') || e.id.includes('[TEST]'))) ||
            (sec && (testSectionIds.has(sec) || sec.startsWith('test-sec-') || sec.includes('[TEST]'))) ||
            (e.student_lrn && testStudentLrns.has(e.student_lrn))
        );
    });
    const testEnrollmentIds = new Set(testEnrollments.map((e) => e.id));

    // Delete from IndexedDB in bulk transactions (single transaction per store = runs in milliseconds)
    const delSecArr = Array.from(testSectionIds);
    const delSubjArr = Array.from(testSubjectIds);
    const delStudArr = Array.from(testStudentLrns);
    const delHpsArr = Array.from(testHpsIds);
    const delCrArr = Array.from(testClassRecordIds);
    const delGsArr = Array.from(testGradingSheetIds);
    const delEnrArr = Array.from(testEnrollmentIds);

    if (delSecArr.length > 0) await db.deleteRecordsBulk('sections', delSecArr);
    if (delSubjArr.length > 0) await db.deleteRecordsBulk('subjects', delSubjArr);
    if (delStudArr.length > 0) await db.deleteRecordsBulk('students', delStudArr);
    if (delHpsArr.length > 0) await db.deleteRecordsBulk('hpsRecords', delHpsArr);
    if (delCrArr.length > 0) await db.deleteRecordsBulk('classRecords', delCrArr);
    if (delGsArr.length > 0) await db.deleteRecordsBulk('gradingSheetRecords', delGsArr);
    if (delEnrArr.length > 0) await db.deleteRecordsBulk('enrollments', delEnrArr);

    // Update Zustand store
    const cleanSections = currentSections.filter((s) => !testSectionIds.has(s.id));
    const cleanSubjects = currentSubjects.filter((s) => !testSubjectIds.has(s.id));
    const cleanStudents = currentStudents.filter((s) => !testStudentLrns.has(s.lrn));
    const cleanHpsRecords = currentHpsRecords.filter((h) => !testHpsIds.has(h.id));
    const cleanClassRecords = currentClassRecords.filter((c) => !testClassRecordIds.has(c.id));
    const cleanGradingSheetRecords = currentGradingSheetRecords.filter((g) => !testGradingSheetIds.has(g.id));
    const cleanEnrollments = currentEnrollments.filter((e) => !testEnrollmentIds.has(e.id));

    useAppStore.setState({
        sections: cleanSections,
        subjects: cleanSubjects,
        students: cleanStudents,
        studentProfiles: (store.studentProfiles || []).filter((s) => !testStudentLrns.has(s.lrn)),
        hpsRecords: cleanHpsRecords,
        classRecords: cleanClassRecords,
        gradingSheetRecords: cleanGradingSheetRecords,
        enrollments: cleanEnrollments
    });

    return {
        deletedSections: delSecArr.length,
        deletedSubjects: delSubjArr.length,
        deletedStudents: delStudArr.length,
        deletedHpsRecords: delHpsArr.length,
        deletedClassRecords: delCrArr.length,
        deletedGradingSheetRecords: delGsArr.length,
        deletedEnrollments: delEnrArr.length
    };
}

import {
    isTestSection,
    isTestSubject,
    isTestStudent,
    isTestClassRecord
} from './testSectionGuards';

export {
    isTestSection,
    isTestSubject,
    isTestStudent,
    isTestClassRecord
};

/**
 * Check whether an HPS record is a generated test HPS record
 */
export function isTestHpsRecord(record: HPSRecord | Record<string, unknown>): boolean {
    if (!record) return false;
    const r = record as Record<string, unknown>;
    return r.is_test_data === true;
}

/**
 * Get current test section, student, and class record statistics
 */
export function getTestSectionStats(
    sections: Section[],
    students?: Student[],
    classRecords?: ClassRecord[]
): {
    totalTestSections: number;
    elementaryCount: number;
    jhsCount: number;
    shsCount: number;
    totalTestStudents: number;
    totalTestClassRecords: number;
} {
    const testSecs = sections.filter(isTestSection);
    let elem = 0;
    let jhs = 0;
    let shs = 0;

    testSecs.forEach((s) => {
        const gl = (s.section_grade_level || '').toLowerCase();
        const num = parseInt(gl.replace(/\D/g, '')) || 0;
        if (gl.includes('kinder') || (num >= 1 && num <= 6)) elem++;
        else if (num >= 7 && num <= 10) jhs++;
        else if (num >= 11 && num <= 12) shs++;
    });

    const testStudents = (students || []).filter(isTestStudent);
    const testCr = (classRecords || []).filter(isTestClassRecord);

    return {
        totalTestSections: testSecs.length,
        elementaryCount: elem,
        jhsCount: jhs,
        shsCount: shs,
        totalTestStudents: testStudents.length,
        totalTestClassRecords: testCr.length
    };
}
