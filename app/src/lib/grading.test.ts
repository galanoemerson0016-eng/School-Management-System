import { describe, it, expect, vi } from 'vitest';

// grading.ts falls back to the app store for the active school year; mock the
// store so tests run without IndexedDB/Firebase. Every test passes an explicit
// schoolYear anyway — the mock only guards the fallback path.
vi.mock('../stores', () => ({
  useAppStore: {
    getState: () => ({ activeSchoolYear: '2026-2027' }),
  },
}));

import {
  transmuteGrade,
  computeExamsWeightedScore,
  getSubjectCluster,
  getWeights,
  isDescriptiveGrading,
  getKs1LetterGrade,
  getKs1Descriptor,
  getGradeDescriptorWithFilipino,
  formatGradeForDisplay,
  isSHS,
  isKeyStage1,
  type SubjectCluster,
} from './grading';

const TRANSITION_SY = '2026-2027'; // adjusted transmutation table
const LEGACY_SY = '2025-2026';     // DO 8 s. 2015 table
const ZERO_BASED_SY = '2027-2028'; // no transmutation

describe('transmuteGrade — SY 2026-2027 adjusted table', () => {
  it('maps the passing boundary: 70.00 → 75', () => {
    expect(transmuteGrade(70.0, TRANSITION_SY)).toBe(75);
  });

  it('maps range edges around 75/76 correctly', () => {
    expect(transmuteGrade(71.17, TRANSITION_SY)).toBe(75);
    expect(transmuteGrade(71.18, TRANSITION_SY)).toBe(76);
  });

  it('maps the top of the table: 99.50 → 100, 99.49 → 99', () => {
    expect(transmuteGrade(100, TRANSITION_SY)).toBe(100);
    expect(transmuteGrade(99.5, TRANSITION_SY)).toBe(100);
    expect(transmuteGrade(99.49, TRANSITION_SY)).toBe(99);
  });

  it('maps the floor: 0 → 60, 4.67 → 60, 4.68 → 61', () => {
    expect(transmuteGrade(0, TRANSITION_SY)).toBe(60);
    expect(transmuteGrade(4.67, TRANSITION_SY)).toBe(60);
    expect(transmuteGrade(4.68, TRANSITION_SY)).toBe(61);
  });

  it('clamps out-of-range inputs', () => {
    expect(transmuteGrade(105, TRANSITION_SY)).toBe(100);
    expect(transmuteGrade(-5, TRANSITION_SY)).toBe(60);
  });

  it('below-passing band: 65.34–69.99 → 74', () => {
    expect(transmuteGrade(65.34, TRANSITION_SY)).toBe(74);
    expect(transmuteGrade(69.99, TRANSITION_SY)).toBe(74);
  });
});

describe('transmuteGrade — DO 8 s. 2015 table (pre-2026 SYs)', () => {
  it('maps the passing boundary: 70.00–72.99 → 75, 73.00 → 76', () => {
    expect(transmuteGrade(70.0, LEGACY_SY)).toBe(75);
    expect(transmuteGrade(72.99, LEGACY_SY)).toBe(75);
    expect(transmuteGrade(73.0, LEGACY_SY)).toBe(76);
  });

  it('maps mid-table values', () => {
    expect(transmuteGrade(88.5, LEGACY_SY)).toBe(90);
    expect(transmuteGrade(60.0, LEGACY_SY)).toBe(70);
  });

  it('maps the floor: anything below 40 → 60', () => {
    expect(transmuteGrade(39.99, LEGACY_SY)).toBe(60);
    expect(transmuteGrade(24, LEGACY_SY)).toBe(60);
    expect(transmuteGrade(0, LEGACY_SY)).toBe(60);
  });
});

describe('transmuteGrade — zero-based grading from SY 2027-2028', () => {
  it('does not transmute; rounds the initial grade', () => {
    expect(transmuteGrade(88.4, ZERO_BASED_SY)).toBe(88);
    expect(transmuteGrade(88.6, ZERO_BASED_SY)).toBe(89);
    expect(transmuteGrade(70, ZERO_BASED_SY)).toBe(70);
    expect(transmuteGrade(0, ZERO_BASED_SY)).toBe(0);
  });

  it('still clamps to 0–100', () => {
    expect(transmuteGrade(104, ZERO_BASED_SY)).toBe(100);
    expect(transmuteGrade(-3, ZERO_BASED_SY)).toBe(0);
  });
});

describe('computeExamsWeightedScore', () => {
  it('weights ST1 30%, ST2 30%, TE 40% for standard clusters', () => {
    // 80% * .3 + 90% * .3 + 70% * .4 = 24 + 27 + 28 = 79
    expect(
      computeExamsWeightedScore(8, 10, 9, 10, 35, 50, 'science_math')
    ).toBeCloseTo(79, 5);
  });

  it('treats a zero-HPS component as 0 instead of dividing by zero', () => {
    // ST1 missing (HPS 0): 0 + 100% * .3 + 100% * .4 = 70
    expect(
      computeExamsWeightedScore(5, 0, 10, 10, 50, 50, 'science_math')
    ).toBeCloseTo(70, 5);
  });

  it('gives TE 100% of the component for TE-only clusters (field exposure)', () => {
    expect(
      computeExamsWeightedScore(99, 100, 99, 100, 40, 50, 'shs_field_exposure')
    ).toBeCloseTo(80, 5);
    expect(computeExamsWeightedScore(0, 0, 0, 0, 10, 0, 'shs_field_exposure')).toBe(0);
  });

  it('returns 0 for clusters with no exams component (research, immersion)', () => {
    expect(computeExamsWeightedScore(10, 10, 10, 10, 50, 50, 'shs_research')).toBe(0);
    expect(computeExamsWeightedScore(10, 10, 10, 10, 50, 50, 'shs_immersion')).toBe(0);
  });
});

describe('getSubjectCluster', () => {
  it('classifies elementary/JHS subjects', () => {
    expect(getSubjectCluster('Mathematics', 'Grade 7')).toBe('science_math');
    expect(getSubjectCluster('Science', 'Grade 9')).toBe('science_math');
    expect(getSubjectCluster('MAPEH', 'Grade 8')).toBe('mapeh_tle');
    expect(getSubjectCluster('TLE', 'Grade 10')).toBe('mapeh_tle');
    expect(getSubjectCluster('English', 'Grade 7')).toBe('languages_ap_esp');
    expect(getSubjectCluster('Araling Panlipunan', 'Grade 5')).toBe('languages_ap_esp');
  });

  it('classifies Grade 11 subjects', () => {
    expect(getSubjectCluster('Work Immersion', 'Grade 11')).toBe('shs_immersion');
    expect(getSubjectCluster('Practical Research 1', 'Grade 11')).toBe('shs_research');
    expect(getSubjectCluster('Field Exposure', 'Grade 11')).toBe('shs_field_exposure');
    expect(getSubjectCluster('Oral Communication in Context', 'Grade 11')).toBe('shs_core_academic');
  });

  it('classifies Grade 12 subjects', () => {
    expect(getSubjectCluster('General Mathematics', 'Grade 12')).toBe('g12_core');
    expect(getSubjectCluster('Work Immersion', 'Grade 12', 'Academic')).toBe('g12_academic_immersion_research');
    expect(getSubjectCluster('Computer Systems Servicing', 'Grade 12', 'TVL')).toBe('g12_tvl_all');
  });
});

describe('getWeights', () => {
  const clusters: SubjectCluster[] = [
    'languages_ap_esp', 'science_math', 'mapeh_tle',
    'shs_core_academic', 'shs_field_exposure', 'shs_arts_sports',
    'shs_research', 'shs_techpro', 'shs_immersion',
    'g12_core', 'g12_academic_other', 'g12_academic_immersion_research', 'g12_tvl_all',
  ];

  it('every cluster weight set sums to exactly 100%', () => {
    for (const cluster of clusters) {
      const w = getWeights(cluster);
      expect(
        w.written_works + w.performance_tasks + w.quarterly_exam,
        `weights for ${cluster}`
      ).toBeCloseTo(1, 10);
    }
  });

  it('MAPEH/TLE uses 20/60/20', () => {
    expect(getWeights('mapeh_tle')).toEqual({
      written_works: 0.20,
      performance_tasks: 0.60,
      quarterly_exam: 0.20,
    });
  });

  it('returns custom weights when specified on the subject', () => {
    const customSubject = {
      written_weight: 0.30,
      performance_weight: 0.45,
      exam_weight: 0.25,
    };
    expect(getWeights('languages_ap_esp', customSubject)).toEqual({
      written_works: 0.30,
      performance_tasks: 0.45,
      quarterly_exam: 0.25,
    });
  });

  it('falls back to cluster default when custom weights are partially missing or incorrect', () => {
    const incompleteSubject = {
      written_weight: 0.30,
      performance_weight: 0.45,
    };
    expect(getWeights('mapeh_tle', incompleteSubject)).toEqual({
      written_works: 0.20,
      performance_tasks: 0.60,
      quarterly_exam: 0.20,
    });
  });
});

describe('isDescriptiveGrading — KS1 transition schedule', () => {
  it('Kindergarten is always descriptive', () => {
    expect(isDescriptiveGrading('Kindergarten', '2026-2027')).toBe(true);
    expect(isDescriptiveGrading('Kindergarten', '2030-2031')).toBe(true);
  });

  it('SY 2026-2027: only Grade 1', () => {
    expect(isDescriptiveGrading('Grade 1', '2026-2027')).toBe(true);
    expect(isDescriptiveGrading('Grade 2', '2026-2027')).toBe(false);
    expect(isDescriptiveGrading('Grade 3', '2026-2027')).toBe(false);
  });

  it('SY 2027-2028: Grades 1-2', () => {
    expect(isDescriptiveGrading('Grade 2', '2027-2028')).toBe(true);
    expect(isDescriptiveGrading('Grade 3', '2027-2028')).toBe(false);
  });

  it('SY 2028-2029+: Grades 1-3', () => {
    expect(isDescriptiveGrading('Grade 3', '2028-2029')).toBe(true);
    expect(isDescriptiveGrading('Grade 4', '2028-2029')).toBe(false);
  });
});

describe('KS1 letter grades and descriptors', () => {
  it('Kindergarten letters: C (≥80), D (≥65), B (below)', () => {
    expect(getKs1LetterGrade(85, 'Kindergarten')).toBe('C');
    expect(getKs1LetterGrade(70, 'Kindergarten')).toBe('D');
    expect(getKs1LetterGrade(50, 'Kindergarten')).toBe('B');
  });

  it('Grades 1-3 letters: A/B/C/D/E bands', () => {
    expect(getKs1LetterGrade(95, 'Grade 1')).toBe('A');
    expect(getKs1LetterGrade(85, 'Grade 1')).toBe('B');
    expect(getKs1LetterGrade(77, 'Grade 1')).toBe('C');
    expect(getKs1LetterGrade(70, 'Grade 1')).toBe('D');
    expect(getKs1LetterGrade(50, 'Grade 1')).toBe('E');
  });

  it('rounds before banding (89.5 → A for Grade 1)', () => {
    expect(getKs1LetterGrade(89.5, 'Grade 1')).toBe('A');
  });

  it('descriptors differ between Kindergarten and Grades 1-3', () => {
    expect(getKs1Descriptor('C', 'Kindergarten')).toContain('Consistent');
    expect(getKs1Descriptor('C', 'Grade 2')).toContain('Connecting');
    expect(getKs1Descriptor('A', 'Grade 1')).toContain('Advancing');
  });
});

describe('formatGradeForDisplay', () => {
  it('shows letters for descriptive grade levels', () => {
    expect(formatGradeForDisplay(92, 'Grade 1', '2026-2027')).toBe('A');
  });

  it('shows rounded numbers for non-descriptive levels', () => {
    expect(formatGradeForDisplay(87.6, 'Grade 5', '2026-2027')).toBe('88');
  });

  it('passes existing letters through unchanged', () => {
    expect(formatGradeForDisplay('b', 'Grade 1', '2026-2027')).toBe('B');
  });

  it('handles empty values', () => {
    expect(formatGradeForDisplay('', 'Grade 5')).toBe('');
    expect(formatGradeForDisplay(null, 'Grade 5')).toBe('');
    expect(formatGradeForDisplay(undefined, 'Grade 5')).toBe('');
  });
});

describe('getGradeDescriptorWithFilipino', () => {
  it('uses numeric bands for Grades 4-12', () => {
    expect(getGradeDescriptorWithFilipino(92, 'Grade 7', '2026-2027')).toContain('Advancing');
    expect(getGradeDescriptorWithFilipino(82, 'Grade 7', '2026-2027')).toContain('Benchmarking');
    expect(getGradeDescriptorWithFilipino(75, 'Grade 7', '2026-2027')).toContain('Connecting');
    expect(getGradeDescriptorWithFilipino(70, 'Grade 7', '2026-2027')).toContain('Developing');
    expect(getGradeDescriptorWithFilipino(60, 'Grade 7', '2026-2027')).toContain('Emerging');
  });

  it('returns empty for missing grades', () => {
    expect(getGradeDescriptorWithFilipino(0, 'Grade 7')).toBe('');
  });
});

describe('grade stage helpers', () => {
  it('detects SHS levels', () => {
    expect(isSHS('Grade 11')).toBe(true);
    expect(isSHS('Grade 12')).toBe(true);
    expect(isSHS('Grade 10')).toBe(false);
  });

  it('detects Key Stage 1', () => {
    expect(isKeyStage1('Kindergarten')).toBe(true);
    expect(isKeyStage1('Grade 3')).toBe(true);
    expect(isKeyStage1('Grade 4')).toBe(false);
  });
});
