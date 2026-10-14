import { describe, it, expect } from 'vitest';
import { SCHOOL_CALENDAR_2026_2027 } from '../utils/sf2-sync';
import { computeStudentAttendance } from '../utils/sf9-attendance';
import { isMaleStudent, isFemaleStudent } from '../utils/grading-helpers';
import { getBMICategoryForAge, getHeightForAge } from '../utils/sf8ReferenceData';
import { getDepEdWeightsForSubject } from '../lib/curriculumPresets';
import { getDepEdStandardWeights } from '../lib/curriculum';
import type { Student } from '../types';

describe('Wave 2 Audit Regression Suite (A-01 to D-03)', () => {
  describe('A-01: Canonical School Calendar 2026-2027 Synchronization', () => {
    it('defines correct school days per month in SCHOOL_CALENDAR_2026_2027', () => {
      expect(SCHOOL_CALENDAR_2026_2027.JUNE.length).toBe(21);
      expect(SCHOOL_CALENDAR_2026_2027.JULY.length).toBe(23);
      expect(SCHOOL_CALENDAR_2026_2027.AUGUST.length).toBe(19);
      expect(SCHOOL_CALENDAR_2026_2027.SEPTEMBER.length).toBe(22);
      expect(SCHOOL_CALENDAR_2026_2027.OCTOBER.length).toBe(22);
      expect(SCHOOL_CALENDAR_2026_2027.NOVEMBER.length).toBe(19);
      expect(SCHOOL_CALENDAR_2026_2027.DECEMBER.length).toBe(13);
      expect(SCHOOL_CALENDAR_2026_2027.JANUARY.length).toBe(20);
      expect(SCHOOL_CALENDAR_2026_2027.FEBRUARY.length).toBe(20);
      expect(SCHOOL_CALENDAR_2026_2027.MARCH.length).toBe(21);
      expect(SCHOOL_CALENDAR_2026_2027.APRIL.length).toBe(6);
    });

    it('synchronizes SF2 calendar counts exactly with SF9 computeStudentAttendance fallback days', () => {
      const mockStudent: Student = {
        id: 'stud-1',
        lrn: '123456789012',
        first_name: 'Juan',
        last_name: 'Dela Cruz',
        gender: 'Male',
        grade_level: 'Grade 11',
        student_section: 'Einstein',
        birthday: '2010-01-01',
        age: 16,
        address: 'Test Address',
      };

      const result = computeStudentAttendance(mockStudent, [], '2026-2027');
      // months: ['JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'TOTAL']
      expect(result.schoolDays[0]).toBe(21); // June
      expect(result.schoolDays[1]).toBe(23); // July
      expect(result.schoolDays[6]).toBe(13); // December
      expect(result.schoolDays[9]).toBe(21); // March
      expect(result.schoolDays[10]).toBe(6); // April
    });
  });

  describe('B-04 & B-05: Gender Normalization & Matching', () => {
    it('accurately identifies male students across diverse casing and shorthands', () => {
      expect(isMaleStudent({ gender: 'Male' })).toBe(true);
      expect(isMaleStudent({ gender: 'male' })).toBe(true);
      expect(isMaleStudent({ gender: 'MALE' })).toBe(true);
      expect(isMaleStudent({ gender: 'M' })).toBe(true);
      expect(isMaleStudent({ gender: 'm' })).toBe(true);
      expect(isMaleStudent({ gender: 'Boy' })).toBe(true);
      expect(isMaleStudent({ gender: 'BOY' })).toBe(true);

      expect(isMaleStudent({ gender: 'Female' })).toBe(false);
      expect(isMaleStudent({ gender: 'F' })).toBe(false);
      expect(isMaleStudent({ gender: 'Girl' })).toBe(false);
      expect(isMaleStudent(null)).toBe(false);
    });

    it('accurately identifies female students across diverse casing and shorthands', () => {
      expect(isFemaleStudent({ gender: 'Female' })).toBe(true);
      expect(isFemaleStudent({ gender: 'female' })).toBe(true);
      expect(isFemaleStudent({ gender: 'FEMALE' })).toBe(true);
      expect(isFemaleStudent({ gender: 'F' })).toBe(true);
      expect(isFemaleStudent({ gender: 'f' })).toBe(true);
      expect(isFemaleStudent({ gender: 'Girl' })).toBe(true);
      expect(isFemaleStudent({ gender: 'GIRL' })).toBe(true);

      expect(isFemaleStudent({ gender: 'Male' })).toBe(false);
      expect(isFemaleStudent({ gender: 'M' })).toBe(false);
      expect(isFemaleStudent({ gender: 'Boy' })).toBe(false);
      expect(isFemaleStudent(null)).toBe(false);
    });
  });

  describe('C-01: SF8 Reference Data Normalization & Age Clamping', () => {
    it('normalizes single letter gender M/F in getBMICategoryForAge and getHeightForAge', () => {
      // 10 year old male, bmi 15 -> Normal
      const catMaleFull = getBMICategoryForAge(15, 10, 'Male');
      const catMaleShort = getBMICategoryForAge(15, 10, 'M');
      expect(catMaleFull).toBe(catMaleShort);

      // 10 year old female, height 120 -> Stunted
      const hFemaleFull = getHeightForAge(120, 10, 'Female');
      const hFemaleShort = getHeightForAge(120, 10, 'f');
      expect(hFemaleFull).toBe(hFemaleShort);
    });

    it('clamps age > 18 to 18 so older SHS learners are not falsely diagnosed as Normal', () => {
      // 19 year old male learner with very short height (130cm)
      // Clamped to 18 where severelyStuntedMax is ~152.8cm -> Severely Stunted
      const heightCat = getHeightForAge(130, 19, 'Male');
      expect(heightCat).toBe('Severely Stunted');

      // 19 year old male learner with very low BMI (13)
      // Clamped to 18 where wastedMax is ~16.3 -> Severely Wasted
      const bmiCat = getBMICategoryForAge(13, 19, 'Male');
      expect(bmiCat).toBe('Severely Wasted');
    });

    it('clamps age < 5 to 5 so younger learners use bottom range instead of fallback Normal', () => {
      // 4 year old with low height
      const heightCat = getHeightForAge(90, 4, 'Male');
      expect(heightCat).not.toBe('Normal');
    });
  });

  describe('C-02: Temporary Grade Slip Off-Term Resolution', () => {
    it('correctly handles comma-delimited multi-term strings in isOffTerm logic', () => {
      const isOffTerm = (termStr: string, activeTerm: number): boolean => {
        const terms = (termStr || '')
          .split(',')
          .map(t => parseInt(t.trim(), 10))
          .filter(n => !isNaN(n));
        return terms.length > 0 && !terms.includes(activeTerm);
      };

      // Subject offered in terms 1 and 2
      expect(isOffTerm('1,2', 1)).toBe(false);
      expect(isOffTerm('1,2', 2)).toBe(false);
      expect(isOffTerm('1,2', 3)).toBe(true);

      // Subject offered in terms 2 and 3
      expect(isOffTerm('2,3', 1)).toBe(true);
      expect(isOffTerm('2,3', 2)).toBe(false);
      expect(isOffTerm('2,3', 3)).toBe(false);

      // Subject offered in all 3 terms
      expect(isOffTerm('1, 2, 3', 1)).toBe(false);
      expect(isOffTerm('1, 2, 3', 2)).toBe(false);
      expect(isOffTerm('1, 2, 3', 3)).toBe(false);

      // No term specified (empty) -> never off-term
      expect(isOffTerm('', 1)).toBe(false);
    });
  });

  describe('D-03: Dual-SHS Weight Differentiation (Old Grade 12 vs SSHS Pilot)', () => {
    it('applies DepEd Order No. 8, s. 2015 weights for traditional Grade 12 (Core: 25/50/25)', () => {
      const coreWeights = getDepEdWeightsForSubject('Oral Communication', 'Grade 12', 'Academic Track');
      expect(coreWeights.written_weight).toBe(25);
      expect(coreWeights.performance_weight).toBe(50);
      expect(coreWeights.exam_weight).toBe(25);

      const standardCore = getDepEdStandardWeights('Oral Communication', 'Grade 12', 'Academic Track');
      expect(standardCore.written_weight).toBe(0.25);
      expect(standardCore.performance_weight).toBe(0.50);
      expect(standardCore.exam_weight).toBe(0.25);
    });

    it('applies DepEd Order No. 8, s. 2015 weights for Grade 12 Academic Other (25/45/30)', () => {
      const businessWeights = getDepEdWeightsForSubject('Business Finance', 'Grade 12', 'Academic Track');
      expect(businessWeights.written_weight).toBe(25);
      expect(businessWeights.performance_weight).toBe(45);
      expect(businessWeights.exam_weight).toBe(30);

      const standardBusiness = getDepEdStandardWeights('Business Finance', 'Grade 12', 'Academic Track');
      expect(standardBusiness.written_weight).toBe(0.25);
      expect(standardBusiness.performance_weight).toBe(0.45);
      expect(standardBusiness.exam_weight).toBe(0.30);
    });

    it('applies DepEd Order No. 8, s. 2015 weights for Grade 12 Immersion & Research (35/40/25)', () => {
      const immersionWeights = getDepEdWeightsForSubject('Culminating Activity', 'Grade 12', 'Academic Track');
      expect(immersionWeights.written_weight).toBe(35);
      expect(immersionWeights.performance_weight).toBe(40);
      expect(immersionWeights.exam_weight).toBe(25);

      const standardImmersion = getDepEdStandardWeights('Culminating Activity', 'Grade 12', 'Academic Track');
      expect(standardImmersion.written_weight).toBe(0.35);
      expect(standardImmersion.performance_weight).toBe(0.40);
      expect(standardImmersion.exam_weight).toBe(0.25);
    });

    it('applies DepEd Order No. 8, s. 2015 weights for Grade 12 TVL (20/60/20)', () => {
      const tvlWeights = getDepEdWeightsForSubject('Bread and Pastry Production', 'Grade 12', 'TVL Track');
      expect(tvlWeights.written_weight).toBe(20);
      expect(tvlWeights.performance_weight).toBe(60);
      expect(tvlWeights.exam_weight).toBe(20);

      const standardTvl = getDepEdStandardWeights('Bread and Pastry Production', 'Grade 12', 'TVL Track');
      expect(standardTvl.written_weight).toBe(0.20);
      expect(standardTvl.performance_weight).toBe(0.60);
      expect(standardTvl.exam_weight).toBe(0.20);
    });

    it('applies revised SSHS pilot weights for Grade 12 when curriculumType is SSHS (Core: 20/50/30)', () => {
      const sshsLangWeights = getDepEdWeightsForSubject('Oral Communication', 'Grade 12', 'SSHS', 'SSHS');
      expect(sshsLangWeights.written_weight).toBe(20);
      expect(sshsLangWeights.performance_weight).toBe(50);
      expect(sshsLangWeights.exam_weight).toBe(30);

      const sshsStandardCore = getDepEdStandardWeights('Oral Communication', 'Grade 12', 'SSHS', 'SSHS');
      expect(sshsStandardCore.written_weight).toBe(0.20);
      expect(sshsStandardCore.performance_weight).toBe(0.50);
      expect(sshsStandardCore.exam_weight).toBe(0.30);
    });
  });
});
