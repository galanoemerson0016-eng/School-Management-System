import { describe, it, expect } from 'vitest';
import {
  TEST_SECTION_SPECS,
  buildTestSectionRecords,
  buildTestHpsRecords,
  buildTestClassRecords
} from './testSectionGenerator';
import { computeLiveTransmutedGradeFromRecord } from './grading-helpers';
import { getSubjectCluster, getWeights, normalizeWeightFraction, isSingleTermExamOnlyShsSubject } from '../lib/grading';

describe('Comprehensive Grade Audit Across All Grade Levels & Curriculum Programs', () => {
  it('validates 100% mathematical parity between in-app live calculation and Excel formulas across all subjects', () => {
    // Generate for all sections (1 section per spec, 6 students each)
    const { sections, subjects, students } = buildTestSectionRecords('all', true, 6, true, true);
    const hpsRecords = buildTestHpsRecords(sections, subjects);
    const { classRecords } = buildTestClassRecords(sections, subjects, students, hpsRecords);

    expect(sections.length).toBe(TEST_SECTION_SPECS.length);
    expect(subjects.length).toBeGreaterThan(0);
    expect(classRecords.length).toBeGreaterThan(0);

    // Transmutation helper for SY 2026-2027 matching Excel HELPER sheet
    function excelTransmute(ig: number): number {
      const rounded = Math.round(ig * 100) / 100;
      if (rounded >= 99.5) return 100;
      if (rounded >= 98.32) return 99;
      if (rounded >= 97.14) return 98;
      if (rounded >= 95.96) return 97;
      if (rounded >= 94.78) return 96;
      if (rounded >= 93.60) return 95;
      if (rounded >= 92.42) return 94;
      if (rounded >= 91.24) return 93;
      if (rounded >= 90.06) return 92;
      if (rounded >= 88.88) return 91;
      if (rounded >= 87.70) return 90;
      if (rounded >= 86.52) return 89;
      if (rounded >= 85.34) return 88;
      if (rounded >= 84.16) return 87;
      if (rounded >= 82.98) return 86;
      if (rounded >= 81.80) return 85;
      if (rounded >= 80.62) return 84;
      if (rounded >= 79.44) return 83;
      if (rounded >= 78.26) return 82;
      if (rounded >= 77.08) return 81;
      if (rounded >= 75.90) return 80;
      if (rounded >= 74.72) return 79;
      if (rounded >= 73.54) return 78;
      if (rounded >= 72.36) return 77;
      if (rounded >= 71.18) return 76;
      if (rounded >= 70.00) return 75;
      if (rounded >= 65.34) return 74;
      if (rounded >= 60.67) return 73;
      if (rounded >= 56.01) return 72;
      if (rounded >= 51.34) return 71;
      if (rounded >= 46.67) return 70;
      if (rounded >= 42.01) return 69;
      if (rounded >= 37.34) return 68;
      if (rounded >= 32.68) return 67;
      if (rounded >= 28.01) return 66;
      if (rounded >= 23.35) return 65;
      if (rounded >= 18.68) return 64;
      if (rounded >= 14.01) return 63;
      if (rounded >= 9.35) return 62;
      if (rounded >= 4.68) return 61;
      return 60;
    }

    let totalChecked = 0;
    const mismatches: string[] = [];

    for (const cr of classRecords) {
      totalChecked++;
      const hps = hpsRecords.find(h => h.subject_id === cr.subject_id && h.quarter === cr.quarter);
      expect(hps).toBeDefined();
      if (!hps) continue;

      const subj = subjects.find(s => s.id === cr.subject_id);
      const sec = sections.find(s => s.id === cr.section_id);
      const gradeLevel = sec?.section_grade_level || subj?.grade_level || '';
      const isG12 = gradeLevel.includes('12');
      const isG11 = gradeLevel.includes('11');
      const isSHS = isG11 || isG12;
      const isGmrc = (subj?.subject_name || '').toLowerCase().includes('gmrc') || (subj?.subject_name || '').toLowerCase().includes('values');

      // In-app live computed grade
      const appGrade = computeLiveTransmutedGradeFromRecord(cr, hps, {
        subjectName: subj?.subject_name,
        gradeLevel,
        track: sec?.track,
        schoolYear: '2026-2027',
        weights: (subj?.written_weight && subj?.performance_weight && subj?.exam_weight) ? {
          written_works: subj.written_weight,
          performance_tasks: subj.performance_weight,
          quarterly_exam: subj.exam_weight
        } : undefined
      });

      const crExt = cr as typeof cr & { summative_tests?: (number | string)[] };
      const hpsExt = hps as typeof hps & { summative_tests?: (number | string)[] };

      const sumScores = (arr: (number | string)[], count?: number): number => {
        const slice = count !== undefined ? arr.slice(0, count) : arr;
        return slice.reduce<number>((acc, v) => acc + (v !== '' && v !== null && v !== undefined && !isNaN(Number(v)) ? Number(v) : 0), 0);
      };

      // Simulate Excel evaluation
      let excelGrade = 0;
      if (isGmrc) {
        // GMRC template: 10 WW, 9 PT, 3 QA
        const wwCog = sumScores(cr.written_works.slice(0, 5));
        const wwCogHps = sumScores(hps.written_works.slice(0, 5));
        const wwAff = sumScores(cr.written_works.slice(5, 10));
        const wwAffHps = sumScores(hps.written_works.slice(5, 10));

        const ptCog = sumScores(cr.performance_tasks.slice(0, 3));
        const ptCogHps = sumScores(hps.performance_tasks.slice(0, 3));
        const ptAff = sumScores(cr.performance_tasks.slice(3, 6));
        const ptAffHps = sumScores(hps.performance_tasks.slice(3, 6));
        const ptBeh = sumScores(cr.performance_tasks.slice(6, 9));
        const ptBehHps = sumScores(hps.performance_tasks.slice(6, 9));

        const qa0 = Number(crExt.summative_tests?.[0]) || 0;
        const qa1 = Number(crExt.summative_tests?.[1]) || 0;
        const qa2 = Number(crExt.summative_tests?.[2]) || 0;
        const qa0Hps = Number(hpsExt.summative_tests?.[0]) || 25;
        const qa1Hps = Number(hpsExt.summative_tests?.[1]) || 25;
        const qa2Hps = Number(hpsExt.summative_tests?.[2]) || 50;

        const wwCogWS = (wwCog / wwCogHps) * 10;
        const wwAffWS = (wwAff / wwAffHps) * 10;
        const ptCogWS = (ptCog / ptCogHps) * 10;
        const ptAffWS = (ptAff / ptAffHps) * 10;
        const ptBehWS = (ptBeh / ptBehHps) * 30;
        const qaPS = (qa0 / qa0Hps) * 30 + (qa1 / qa1Hps) * 30 + (qa2 / qa2Hps) * 40;
        const qaWS = qaPS * 0.30;
        const ig = Math.round((wwCogWS + wwAffWS + ptCogWS + ptAffWS + ptBehWS + qaWS) * 100) / 100;
        excelGrade = excelTransmute(ig);
      } else {
        // Standard template
        const cluster = getSubjectCluster(subj?.subject_name || '', gradeLevel, sec?.track);
        const weights = (subj?.written_weight && subj?.performance_weight && subj?.exam_weight) ? {
          written_works: subj.written_weight,
          performance_tasks: subj.performance_weight,
          quarterly_exam: subj.exam_weight
        } : getWeights(cluster, subj);
        const wwCount = isSHS ? 10 : 5;
        const ptCount = isSHS ? 10 : 3;

        const wwTotal = sumScores(cr.written_works, wwCount);
        const wwHps = sumScores(hps.written_works, wwCount);
        const ptTotal = sumScores(cr.performance_tasks, ptCount);
        const ptHps = sumScores(hps.performance_tasks, ptCount);

        const qa0 = Number(crExt.summative_tests?.[0]) || 0;
        const qa1 = Number(crExt.summative_tests?.[1]) || 0;
        const qa2 = Number(crExt.summative_tests?.[2]) || 0;
        const qa0Hps = Number(hpsExt.summative_tests?.[0]) || 25;
        const qa1Hps = Number(hpsExt.summative_tests?.[1]) || 25;
        const qa2Hps = Number(hpsExt.summative_tests?.[2]) || 50;

        const wwWeight = normalizeWeightFraction(weights.written_works);
        const ptWeight = normalizeWeightFraction(weights.performance_tasks);
        const qaWeight = normalizeWeightFraction(weights.quarterly_exam);

        const wwPS = wwHps > 0 ? (wwTotal / wwHps) * 100 : 0;
        const ptPS = ptHps > 0 ? (ptTotal / ptHps) * 100 : 0;
        const wwWS = wwPS * wwWeight;
        const ptWS = ptPS * ptWeight;
        let qaWS = 0;
        if (qaWeight > 0) {
          let qaPS = 0;
          if (cluster === 'shs_field_exposure' || isSingleTermExamOnlyShsSubject(subj?.subject_name || '')) {
            qaPS = qa2Hps > 0 ? (qa2 / qa2Hps) * 100 : 0;
          } else {
            qaPS = (qa0 / qa0Hps) * 30 + (qa1 / qa1Hps) * 30 + (qa2 / qa2Hps) * 40;
          }
          qaWS = qaPS * qaWeight;
        }
        const ig = Math.round((wwWS + ptWS + qaWS) * 100) / 100;
        excelGrade = excelTransmute(ig);
      }

      if (appGrade !== excelGrade) {
        mismatches.push(`${sec?.section_name} > ${subj?.subject_name} Q${cr.quarter}: App=${appGrade}, Excel=${excelGrade}`);
      }
    }

    console.log(`Audited ${totalChecked} class records across ${sections.length} sections and ${subjects.length} subjects.`);
    if (mismatches.length > 0) {
      console.error('Found mismatches:', mismatches.slice(0, 10));
    }
    expect(mismatches).toEqual([]);
  });
});
