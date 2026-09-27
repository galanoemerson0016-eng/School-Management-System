import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPaceRecord,
  savePaceRecord,
  getPaceRecordsForSchoolYear,
  migrateLegacyPaceSubject,
  migrateAllPaceStores,
  renamePaceLrn,
  getPaceUnresolved,
  resolvePaceUnresolvedEntry,
  getTotalPaceRecordCount,
  clearAllPaceStores,
  getPaceStorageKeyV2,
  isValidSchoolYear,
  makePaceRecordKey,
} from './pace-record-service';
import type { PaceFormData } from '../types/pace';

describe('pace-record-service: school year scoping and versioned migration (D08)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('school year validation and keying', () => {
    it('validates standard DepEd school year formats', () => {
      expect(isValidSchoolYear('2024-2025')).toBe(true);
      expect(isValidSchoolYear(' 2025-2026 ')).toBe(true);
      expect(isValidSchoolYear('2026 - 2027')).toBe(true);
      expect(isValidSchoolYear('')).toBe(false);
      expect(isValidSchoolYear('2024')).toBe(false);
      expect(isValidSchoolYear('invalid-year')).toBe(false);
      expect(isValidSchoolYear(null)).toBe(false);
      expect(isValidSchoolYear(undefined)).toBe(false);
    });

    it('generates consistent composite keys', () => {
      expect(makePaceRecordKey('2024-2025', '123456789012')).toBe('2024-2025::123456789012');
      expect(makePaceRecordKey(' 2024 - 2025 ', ' 123456789012 ')).toBe('2024-2025::123456789012');
    });
  });

  describe('multi-year isolation (finding D08 resolution)', () => {
    it('maintains independent ratings for the same learner across two different school years', () => {
      const lrn = '100000000001';
      const sy1 = '2024-2025';
      const sy2 = '2025-2026';

      const dataSy1: PaceFormData = {
        lrn,
        studentName: 'Cruz, Juan',
        gradeLevel: 'Grade 1',
        section: 'Mabini',
        schoolYear: sy1,
        teacherName: 'Teacher A',
        ratings: {
          comp1: { t1: 'A', t2: 'B', t3: 'A' },
        },
      };

      const dataSy2: PaceFormData = {
        lrn,
        studentName: 'Cruz, Juan',
        gradeLevel: 'Grade 1',
        section: 'Rizal',
        schoolYear: sy2,
        teacherName: 'Teacher B',
        ratings: {
          comp1: { t1: 'C', t2: 'D', t3: 'C' },
        },
      };

      // Save ratings in year 1
      savePaceRecord('reading', sy1, lrn, dataSy1);

      // Verify year 1 is saved
      const loadedSy1 = getPaceRecord('reading', sy1, lrn);
      expect(loadedSy1).toBeDefined();
      expect(loadedSy1?.ratings.comp1.t1).toBe('A');

      // Verify year 2 has no ratings yet for this learner
      const initialSy2 = getPaceRecord('reading', sy2, lrn);
      expect(initialSy2).toBeUndefined();

      // Save ratings in year 2
      savePaceRecord('reading', sy2, lrn, dataSy2);

      // Verify year 2 has its own ratings
      const loadedSy2 = getPaceRecord('reading', sy2, lrn);
      expect(loadedSy2).toBeDefined();
      expect(loadedSy2?.ratings.comp1.t1).toBe('C');
      expect(loadedSy2?.teacherName).toBe('Teacher B');

      // Crucial: verify year 1 ratings were NOT changed or overwritten
      const checkSy1Again = getPaceRecord('reading', sy1, lrn);
      expect(checkSy1Again?.ratings.comp1.t1).toBe('A');
      expect(checkSy1Again?.teacherName).toBe('Teacher A');
      expect(checkSy1Again?.schoolYear).toBe('2024-2025');

      // Verify getPaceRecordsForSchoolYear isolates by year
      const year1Batch = getPaceRecordsForSchoolYear('reading', sy1);
      const year2Batch = getPaceRecordsForSchoolYear('reading', sy2);

      expect(year1Batch[lrn]?.ratings.comp1.t1).toBe('A');
      expect(year2Batch[lrn]?.ratings.comp1.t1).toBe('C');
    });

    it('keeps subject domains separate without key collisions', () => {
      const lrn = '100000000002';
      const sy = '2025-2026';

      savePaceRecord('reading', sy, lrn, {
        lrn,
        studentName: 'Santos, Maria',
        gradeLevel: 'Grade 1',
        section: 'Luna',
        schoolYear: sy,
        teacherName: 'Teacher',
        ratings: { reading1: { t1: 'A' } },
      });

      savePaceRecord('math', sy, lrn, {
        lrn,
        studentName: 'Santos, Maria',
        gradeLevel: 'Grade 1',
        section: 'Luna',
        schoolYear: sy,
        teacherName: 'Teacher',
        ratings: { math1: { t1: 'B' } },
      });

      const readingRec = getPaceRecord('reading', sy, lrn);
      const mathRec = getPaceRecord('math', sy, lrn);

      expect(readingRec?.ratings).toEqual({ reading1: { t1: 'A' } });
      expect(mathRec?.ratings).toEqual({ math1: { t1: 'B' } });
    });
  });

  describe('legacy migration and unresolved quarantine', () => {
    it('migrates valid legacy records into v2 while preserving the original legacy keys', () => {
      const lrnValid = '100000000003';
      const lrnUnresolved = '100000000004';

      const legacyData = {
        [lrnValid]: {
          lrn: lrnValid,
          studentName: 'Reyes, Jose',
          schoolYear: '2024-2025',
          ratings: { compA: { t1: 'A' } },
        },
        [lrnUnresolved]: {
          lrn: lrnUnresolved,
          studentName: 'Unknown Year Learner',
          schoolYear: '', // missing school year
          ratings: { compB: { t1: 'B' } },
        },
      };

      // Seed legacy storage
      localStorage.setItem('formease_pace_reading_ratings', JSON.stringify(legacyData));

      // Execute migration
      const env = migrateLegacyPaceSubject('reading');

      // 1. Valid record migrated under composite key
      expect(env.records['2024-2025::100000000003']).toBeDefined();
      expect(env.records['2024-2025::100000000003'].ratings).toEqual({ compA: { t1: 'A' } });

      // 2. Missing-year record placed into unresolved quarantine, NOT guessed as current year
      const unresolvedKey = `formease_pace_reading_ratings::${lrnUnresolved}`;
      expect(env.unresolved[unresolvedKey]).toBeDefined();
      expect(env.unresolved[unresolvedKey].reason).toContain('Missing school year');

      // 3. Legacy storage was preserved as evidence
      expect(localStorage.getItem('formease_pace_reading_ratings')).toBe(JSON.stringify(legacyData));

      // 4. v2 storage key was created
      expect(localStorage.getItem(getPaceStorageKeyV2('reading'))).toBeDefined();
    });

    it('is idempotent across repeated migrations', () => {
      const lrn = '100000000005';
      localStorage.setItem(
        'formease_pace_language_ratings',
        JSON.stringify({
          [lrn]: {
            lrn,
            studentName: 'Test Student',
            schoolYear: '2024-2025',
            ratings: { lang1: { t1: 'A' } },
          },
        })
      );

      const firstPass = migrateLegacyPaceSubject('language');
      const secondPass = migrateLegacyPaceSubject('language');

      expect(Object.keys(firstPass.records)).toEqual(Object.keys(secondPass.records));
      expect(Object.keys(firstPass.unresolved)).toEqual(Object.keys(secondPass.unresolved));
    });

    it('allows supervised resolution of quarantined unresolved records', () => {
      const lrn = '100000000006';
      localStorage.setItem(
        'formease_pace_math_ratings',
        JSON.stringify({
          [lrn]: {
            lrn,
            studentName: 'Quarantined Math Learner',
            schoolYear: 'corrupt-year',
            ratings: { m1: { t1: 'C' } },
          },
        })
      );

      migrateLegacyPaceSubject('math');
      const unresolved = getPaceUnresolved('math');
      const unresKey = Object.keys(unresolved)[0];
      expect(unresKey).toBeDefined();

      // Resolve with teacher/operator chosen school year
      resolvePaceUnresolvedEntry('math', unresKey, '2025-2026');

      // Should now be a valid active record
      const resolvedRec = getPaceRecord('math', '2025-2026', lrn);
      expect(resolvedRec).toBeDefined();
      expect(resolvedRec?.schoolYear).toBe('2025-2026');
      expect(resolvedRec?.ratings).toEqual({ m1: { t1: 'C' } });

      // Unresolved set is cleared of that entry
      expect(getPaceUnresolved('math')[unresKey]).toBeUndefined();
    });
  });

  describe('atomic LRN rename across all school years', () => {
    it('renames a learner LRN across multiple school years and updates settings journal', () => {
      const oldLrn = '111111111111';
      const newLrn = '222222222222';

      // Seed student in two school years
      savePaceRecord('reading', '2024-2025', oldLrn, {
        lrn: oldLrn,
        studentName: 'Cruz, Ana',
        gradeLevel: 'Grade 1',
        section: 'Mabini',
        schoolYear: '2024-2025',
        teacherName: 'Teacher',
        ratings: { r1: { t1: 'A' } },
      });

      savePaceRecord('reading', '2025-2026', oldLrn, {
        lrn: oldLrn,
        studentName: 'Cruz, Ana',
        gradeLevel: 'Grade 1',
        section: 'Rizal',
        schoolYear: '2025-2026',
        teacherName: 'Teacher',
        ratings: { r1: { t2: 'B' } },
      });

      // Also set a Grade 1 remarks key
      localStorage.setItem(`g1_remarks_${oldLrn}_2024-2025`, JSON.stringify({ term1CanDo: 'Reading well' }));

      // Rename LRN
      const journalUpdates = renamePaceLrn(oldLrn, newLrn);

      // Verify journal returns updates
      expect(Object.keys(journalUpdates).length).toBeGreaterThan(0);
      expect(journalUpdates[`g1_remarks_${newLrn}_2024-2025`]).toBeDefined();

      // Apply journal updates to localStorage as transaction coordinator does
      for (const [k, v] of Object.entries(journalUpdates)) {
        localStorage.setItem(k, v);
      }

      // Old LRN records should no longer exist under old key
      expect(getPaceRecord('reading', '2024-2025', oldLrn)).toBeUndefined();
      expect(getPaceRecord('reading', '2025-2026', oldLrn)).toBeUndefined();

      // New LRN records must exist in both school years
      const newYear1 = getPaceRecord('reading', '2024-2025', newLrn);
      const newYear2 = getPaceRecord('reading', '2025-2026', newLrn);

      expect(newYear1).toBeDefined();
      expect(newYear1?.ratings.r1.t1).toBe('A');
      expect(newYear2).toBeDefined();
      expect(newYear2?.ratings.r1.t2).toBe('B');
    });

    it('rejects rename if new LRN already has ratings in any matching school year', () => {
      const oldLrn = '333333333333';
      const existingNewLrn = '444444444444';

      savePaceRecord('reading', '2025-2026', oldLrn, {
        lrn: oldLrn,
        studentName: 'Student 1',
        gradeLevel: 'Grade 1',
        section: 'A',
        schoolYear: '2025-2026',
        teacherName: 'Teacher',
        ratings: { r1: { t1: 'A' } },
      });

      savePaceRecord('reading', '2025-2026', existingNewLrn, {
        lrn: existingNewLrn,
        studentName: 'Student 2',
        gradeLevel: 'Grade 1',
        section: 'B',
        schoolYear: '2025-2026',
        teacherName: 'Teacher',
        ratings: { r1: { t1: 'B' } },
      });

      expect(() => renamePaceLrn(oldLrn, existingNewLrn)).toThrow(
        /already has PACE reading ratings for school year 2025-2026/
      );
    });
  });

  describe('full migration summary and counts', () => {
    it('summarizes migrated and unresolved counts across all subjects', () => {
      localStorage.setItem(
        'formease_pace_reading_ratings',
        JSON.stringify({
          '555555555555': { lrn: '555555555555', schoolYear: '2024-2025', ratings: {} },
        })
      );
      localStorage.setItem(
        'formease_pace_math_ratings',
        JSON.stringify({
          '666666666666': { lrn: '666666666666', schoolYear: '2024-2025', ratings: {} },
        })
      );

      const summary = migrateAllPaceStores(true);
      expect(summary.migratedCounts.reading).toBe(1);
      expect(summary.migratedCounts.math).toBe(1);
      expect(getTotalPaceRecordCount()).toBe(2);
    });

    it('completely clears all stores on reset', () => {
      savePaceRecord('reading', '2025-2026', '777777777777', {
        lrn: '777777777777',
        studentName: 'Reset Student',
        gradeLevel: 'Grade 1',
        section: 'A',
        schoolYear: '2025-2026',
        teacherName: 'Teacher',
        ratings: {},
      });

      expect(getTotalPaceRecordCount()).toBe(1);
      clearAllPaceStores();
      expect(getTotalPaceRecordCount()).toBe(0);
    });
  });
});
