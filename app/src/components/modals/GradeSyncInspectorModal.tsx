import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore } from '../../stores/app-store';
import { useAuthStore } from '../../stores/auth-store';
import {
  Bug,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  Copy,
  ChevronDown,
  Check,
  Zap,
  ShieldAlert,
  Info,
  Send,
  Loader2,
  Mail,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';
import type { Student, Subject, ClassRecord } from '../../types';
import {
  normalizeSubjectName,
  sortSubjects,
  getCanonicalSubjectKey,
  getSubjectsForGrade,
} from '../../lib/subjectConfig';
import {
  resolveStudentQuarterGrade,
  isMatchingSubject,
} from '../../utils/grading-helpers';
import {
  getActivePeriodsForSchoolYear,
  getPeriodLabel,
  getPeriodHeader,
  isThreeTermSchoolYear,
} from '../../lib/terms';
import { DiagnosticReporter, type SubmissionResult } from '../../services/diagnostic-reporter';

const isEcmkParent = (name: string) =>
  name.toLowerCase().includes('effective communication') &&
  name.toLowerCase().includes('mabisang komunikasyon');

interface GradeSyncInspectorModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialSectionId?: string;
  initialStudentLrn?: string;
  initialSubjectId?: string;
  initialQuarter?: number;
}

interface ModuleGradeBreakdown {
  ecrRawScoreSummary: string;
  ecrTransmutedGrade: number | null;
  ecrStoredFinalGrade: number | null;
  ecrRecordId?: string;
  ecrScores: {
    wwScore: number;
    wwHps: number;
    wwPct: number;
    ptScore: number;
    ptHps: number;
    ptPct: number;
    qaScore: number;
    qaHps: number;
    qaPct: number;
  } | null;

  gradeManagementValue: number | null;
  gradeManagementResolved: number | null;
  gradeSource?: string;
  isVirtualSubject: boolean;

  sf9ResolvedGrade: number | null;
  sf9Descriptor: string;

  gradeSlipResolvedGrade: number | null;
  gradeSlipExcludedFromAvg: boolean;

  sf10ResolvedGrade: number | null;
  sf10StandardKey: string;

  syncStatus: 'in_sync' | 'mismatch' | 'missing' | 'off_term';
  discrepancies: string[];
  recommendations: string[];
}

export function GradeSyncInspectorModal({
  isOpen: propsIsOpen,
  onClose: propsOnClose,
  initialSectionId,
  initialStudentLrn,
  initialSubjectId,
  initialQuarter = 1,
}: GradeSyncInspectorModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propsIsOpen !== undefined ? propsIsOpen : internalIsOpen;
  const onClose = propsOnClose || (() => setInternalIsOpen(false));

  const {
    sections,
    students,
    subjects,
    classRecords,
    gradingSheetRecords,
    hpsRecords,
    schoolProfile,
    activeSchoolYear,
    updateGradingSheetRecord,
    showNotification,
  } = useAppStore();

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedStudentLrn, setSelectedStudentLrn] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || 'all');
  const [selectedQuarter, setSelectedQuarter] = useState<number>(initialQuarter);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [studentRosterFilter, setStudentRosterFilter] = useState<
    'all' | 'needs_attention' | 'in_sync' | 'no_grades'
  >('all');
  const [subjectStatusFilter, setSubjectStatusFilter] = useState<
    'all' | 'mismatches' | 'in_sync' | 'missing'
  >('all');
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [showSectionSyncModal, setShowSectionSyncModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [userNote, setUserNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  const { user } = useAuthStore();

  // Active periods for current school year (Term 1-3 for SY 2026-2027+, Q1-4 for historical)
  const activePeriods = useMemo(
    () => getActivePeriodsForSchoolYear(activeSchoolYear),
    [activeSchoolYear]
  );
  const periodHeader = useMemo(() => getPeriodHeader(activeSchoolYear), [activeSchoolYear]);
  const isThreeTerm = useMemo(() => isThreeTermSchoolYear(activeSchoolYear), [activeSchoolYear]);

  // Sections sorted strictly by grade level (numeric) then section name (alphabetical)
  const sortedSections = useMemo(() => {
    if (!sections || sections.length === 0) return [];
    return [...sections].sort((a, b) => {
      const aGrade = parseInt(a.section_grade_level.replace(/\D/g, '')) || 0;
      const bGrade = parseInt(b.section_grade_level.replace(/\D/g, '')) || 0;
      if (aGrade !== bGrade) return aGrade - bGrade;
      return a.section_name.localeCompare(b.section_name, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
  }, [sections]);

  // Global event listener to open from anywhere in the app
  useEffect(() => {
    const handleOpenEvent = (event: Event) => {
      const custom = event as CustomEvent<{
        sectionId?: string;
        studentLrn?: string;
        subjectId?: string;
        quarter?: number;
      }>;
      if (custom.detail) {
        if (custom.detail.sectionId) setSelectedSectionId(custom.detail.sectionId);
        if (custom.detail.studentLrn) setSelectedStudentLrn(custom.detail.studentLrn);
        if (custom.detail.subjectId) setSelectedSubjectId(custom.detail.subjectId);
        if (custom.detail.quarter) setSelectedQuarter(custom.detail.quarter);
      }
      setInternalIsOpen(true);
    };

    window.addEventListener('formease-open-grade-debugger', handleOpenEvent);
    return () => {
      window.removeEventListener('formease-open-grade-debugger', handleOpenEvent);
    };
  }, []);

  // Initialize selected section & student
  useEffect(() => {
    if (initialSectionId) {
      setSelectedSectionId(initialSectionId);
    } else if (!selectedSectionId && sortedSections.length > 0) {
      setSelectedSectionId(sortedSections[0].id || sortedSections[0].section_name);
    }
  }, [sortedSections, initialSectionId, selectedSectionId]);

  useEffect(() => {
    if (initialStudentLrn) {
      setSelectedStudentLrn(initialStudentLrn);
    }
  }, [initialStudentLrn]);

  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId);
    }
  }, [initialSubjectId]);

  const selectedSectionObj = useMemo(() => {
    return sortedSections.find(
      (s) => s.id === selectedSectionId || s.section_name === selectedSectionId
    );
  }, [sortedSections, selectedSectionId]);

  const sectionStudents = useMemo(() => {
    if (!selectedSectionObj) return [];
    return students
      .filter(
        (s) =>
          s.student_section === selectedSectionObj.section_name ||
          s.student_section === selectedSectionObj.id
      )
      .sort((a, b) => {
        if (a.gender !== b.gender) return a.gender === 'Male' ? -1 : 1;
        return a.last_name.localeCompare(b.last_name);
      });
  }, [students, selectedSectionObj]);

  // Set default student if none selected or if section changes
  useEffect(() => {
    if (sectionStudents.length > 0) {
      const exists = sectionStudents.some((s) => s.lrn === selectedStudentLrn);
      if (!exists) {
        setSelectedStudentLrn(sectionStudents[0].lrn);
      }
    } else {
      setSelectedStudentLrn('');
    }
  }, [sectionStudents, selectedStudentLrn]);

  const selectedStudentObj = useMemo(() => {
    return sectionStudents.find((s) => s.lrn === selectedStudentLrn) || sectionStudents[0] || null;
  }, [sectionStudents, selectedStudentLrn]);

  // Section subjects deduplicated with Curriculum Fallback
  const sectionSubjects = useMemo(() => {
    if (!selectedSectionObj) return [];
    const gradeLevelStr = selectedSectionObj.section_grade_level || '';
    const sectionGradeNum = parseInt(gradeLevelStr.replace(/\D/g, '')) || 0;

    // 1. Direct section subjects
    const sectionSpecific = subjects.filter(
      (s) => s.section_id === selectedSectionObj.id && s.term !== 'none'
    );

    // 2. Generic grade subjects (no section_id or matching grade)
    const genericGradeSubjects = subjects.filter((s) => {
      if (s.section_id) return false;
      const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
      return subjectGradeNum === sectionGradeNum && s.term !== 'none';
    });

    const candidates: Subject[] = [...sectionSpecific, ...genericGradeSubjects];

    // 3. Section taught_subjects merge (for Senior High School or custom section subjects)
    const taughtRaw = selectedSectionObj.taught_subjects || [];
    if (taughtRaw.length > 0) {
      for (const tName of taughtRaw) {
        const alreadyHas = candidates.some((s) =>
          isMatchingSubject(tName, s.id, s.subject_name)
        );
        if (!alreadyHas) {
          candidates.push({
            id: `virtual_${tName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            subject_name: tName,
            grade_level: gradeLevelStr,
            section_id: selectedSectionObj.id,
            term: 'all',
          } as Subject);
        }
      }
    }

    // 4. Fallback: If no subjects exist in DB for this grade level, load standard curriculum subjects
    if (candidates.length === 0) {
      const standardList = getSubjectsForGrade(gradeLevelStr);
      for (const item of standardList) {
        if (item.name && item.name.trim()) {
          const canonical = getCanonicalSubjectKey(item.name, sectionGradeNum);
          candidates.push({
            id: `curriculum-${canonical}`,
            subject_name: item.name,
            grade_level: gradeLevelStr,
            term: 'all',
          } as Subject);
        }
      }
    }

    // 5. Special Case: Ensure MAPEH parent header exists if components exist (Grades 1-10)
    const isSHS = sectionGradeNum === 11 || sectionGradeNum === 12;
    if (!isSHS) {
      const hasMapehHeader = candidates.some(
        (s) => normalizeSubjectName(s.subject_name) === 'mapeh'
      );
      const hasMapehComponents = candidates.some((s) => {
        const n = normalizeSubjectName(s.subject_name);
        return (
          n.includes('musicandarts') ||
          n.includes('musicarts') ||
          n.includes('physicaleducationandhealth') ||
          n.includes('peandhealth') ||
          n.includes('pehealth') ||
          n === 'music' ||
          n === 'arts' ||
          n === 'physicaleducation' ||
          n === 'health' ||
          n === 'pe'
        );
      });

      if (hasMapehComponents && !hasMapehHeader) {
        candidates.push({
          id: `virtual-mapeh-${selectedSectionObj.id}`,
          subject_name: 'MAPEH',
          grade_level: gradeLevelStr,
          section_id: selectedSectionObj.id,
          term: 'all',
        } as Subject);
      }
    }

    // 6. Special Case: Ensure EC/MK composite parent exists if both components exist
    const hasEcmkHeader = candidates.some((s) => isEcmkParent(s.subject_name));
    const hasEc = candidates.some(
      (s) => normalizeSubjectName(s.subject_name) === 'effectivecommunication'
    );
    const hasMk = candidates.some(
      (s) => normalizeSubjectName(s.subject_name) === 'mabisangkomunikasyon'
    );
    if (hasEc && hasMk && !hasEcmkHeader) {
      candidates.push({
        id: `virtual-ecmk-${selectedSectionObj.id}`,
        subject_name: 'Effective Communication & Mabisang Komunikasyon',
        grade_level: gradeLevelStr,
        section_id: selectedSectionObj.id,
        term: 'all',
      } as Subject);
    }

    candidates.sort((a, b) => {
      const aDirect = a.section_id === selectedSectionObj.id ? 1 : 0;
      const bDirect = b.section_id === selectedSectionObj.id ? 1 : 0;
      return bDirect - aDirect;
    });

    const seen = new Set<string>();
    const res: Subject[] = [];
    for (const s of candidates) {
      const canonical = getCanonicalSubjectKey(s.subject_name, sectionGradeNum);
      if (canonical && seen.has(canonical)) continue;
      if (canonical) seen.add(canonical);
      res.push(s);
    }
    return sortSubjects(res, (s) => s.subject_name);
  }, [subjects, selectedSectionObj]);

  // Auto-reset selectedSubjectId if it does not belong to the current section
  useEffect(() => {
    if (selectedSubjectId !== 'all' && sectionSubjects.length > 0) {
      const exists = sectionSubjects.some((s) => s.id === selectedSubjectId);
      if (!exists) {
        setSelectedSubjectId('all');
      }
    }
  }, [sectionSubjects, selectedSubjectId]);

  // Deep multi-module inspection for a student + subject + quarter
  const inspectSubject = useCallback(
    (student: Student, subject: Subject, quarter: number): ModuleGradeBreakdown => {
      const discrepancies: string[] = [];
      const recommendations: string[] = [];
      const q = quarter;
      const gradeLevel = selectedSectionObj?.section_grade_level || student.grade_level || 'Grade 7';
      const track = selectedSectionObj?.track || student.track || '';

      // 1. E-Class Record Search & Raw Scores Resolution
      const ecrMatches = classRecords.filter(
        (r) =>
          (r.student_lrn === student.lrn ||
            String(r.student_lrn).trim() === String(student.lrn).trim()) &&
          isMatchingSubject(subject.id, r.subject_id, r.subject_name, subject.subject_name) &&
          (Number(r.quarter) === q ||
            String(r.quarter).toLowerCase() === `q${q}` ||
            String(r.quarter).toLowerCase() === `t${q}`) &&
          (!r.school_year ||
            !activeSchoolYear ||
            r.school_year === activeSchoolYear ||
            r.school_year.includes(activeSchoolYear))
      );

      const crossSyEcrMatches = classRecords.filter(
        (r) =>
          (r.student_lrn === student.lrn ||
            String(r.student_lrn).trim() === String(student.lrn).trim()) &&
          isMatchingSubject(subject.id, r.subject_id, r.subject_name, subject.subject_name) &&
          (Number(r.quarter) === q ||
            String(r.quarter).toLowerCase() === `q${q}` ||
            String(r.quarter).toLowerCase() === `t${q}`) &&
          r.school_year &&
          activeSchoolYear &&
          r.school_year !== activeSchoolYear
      );

      let ecrRawScoreSummary = 'No raw scores entered';
      let ecrStoredFinalGrade: number | null = null;
      let ecrRecordId: string | undefined;
      let ecrScores: ModuleGradeBreakdown['ecrScores'] = null;

      if (ecrMatches.length > 0) {
        const cRec = ecrMatches[0];
        ecrRecordId = cRec.id;
        const rawWw = (cRec.written_works || []).map((v) =>
          v !== undefined && v !== null ? v : ''
        );
        const rawPt = (cRec.performance_tasks || []).map((v) =>
          v !== undefined && v !== null ? v : ''
        );
        const rawQa =
          cRec.quarterly_exam !== undefined && cRec.quarterly_exam !== null
            ? cRec.quarterly_exam
            : '';
        const rawSt =
          (cRec as ClassRecord & { summative_tests?: (number | string)[] }).summative_tests || [];

        const isValidScore = (v: unknown): boolean =>
          v !== '' && v !== null && v !== undefined && !isNaN(Number(v));
        const hasScores =
          rawWw.some(isValidScore) ||
          rawPt.some(isValidScore) ||
          (isValidScore(rawQa) && Number(rawQa) > 0) ||
          rawSt.some(isValidScore);

        if (hasScores && cRec.final_grade && Number(cRec.final_grade) > 0) {
          ecrStoredFinalGrade = Number(cRec.final_grade);
        } else if (!hasScores && cRec.final_grade && Number(cRec.final_grade) > 0) {
          discrepancies.push(
            `Ghost grade detected: E-Class Record holds stored grade (${cRec.final_grade}) without any raw scores.`
          );
          recommendations.push(
            `Encode student scores in E-Class Record or run Database Diagnostics to clean ghost records.`
          );
        }

        if (hasScores) {
          // Find HPS record
          const hRec = hpsRecords.find(
            (h) =>
              isMatchingSubject(subject.id, h.subject_id, undefined, subject.subject_name) &&
              (Number(h.quarter) === q || String(h.quarter).toLowerCase() === `q${q}`) &&
              (!h.school_year || !activeSchoolYear || h.school_year === activeSchoolYear)
          );

          const hps_ww: number[] = (hRec?.written_works || []).map(
            (v: unknown) => Number(v) || 0
          );
          const hps_pt: number[] = (hRec?.performance_tasks || []).map(
            (v: unknown) => Number(v) || 0
          );
          const hps_qa = Number(hRec?.quarterly_exam) || 0;

          const wwTotalScore = rawWw.reduce<number>(
            (acc, v) => acc + (isValidScore(v) ? Number(v) : 0),
            0
          );
          const ptTotalScore = rawPt.reduce<number>(
            (acc, v) => acc + (isValidScore(v) ? Number(v) : 0),
            0
          );
          const qaTotalScore = isValidScore(rawQa) ? Number(rawQa) : 0;

          const wwTotalHPS = hps_ww.reduce((a, b) => a + b, 0);
          const ptTotalHPS = hps_pt.reduce((a, b) => a + b, 0);

          ecrRawScoreSummary = `WW: ${wwTotalScore}/${wwTotalHPS || 0} | PT: ${ptTotalScore}/${ptTotalHPS || 0} | QA: ${qaTotalScore}/${hps_qa || 0}`;

          ecrScores = {
            wwScore: wwTotalScore,
            wwHps: wwTotalHPS,
            wwPct: wwTotalHPS > 0 ? Math.round((wwTotalScore / wwTotalHPS) * 100) : 0,
            ptScore: ptTotalScore,
            ptHps: ptTotalHPS,
            ptPct: ptTotalHPS > 0 ? Math.round((ptTotalScore / ptTotalHPS) * 100) : 0,
            qaScore: qaTotalScore,
            qaHps: hps_qa,
            qaPct: hps_qa > 0 ? Math.round((qaTotalScore / hps_qa) * 100) : 0,
          };

          if (wwTotalHPS === 0 && ptTotalHPS === 0) {
            discrepancies.push(
              `E-Class Record has raw student scores, but Total Highest Possible Score (HPS) is 0.`
            );
            recommendations.push(
              `Open E-Class Record and fill in the Highest Possible Score (HPS) row so transmuted grades can be computed.`
            );
          }
        }
      } else if (crossSyEcrMatches.length > 0) {
        discrepancies.push(
          `Found ECR record under different school year "${crossSyEcrMatches[0].school_year}" (Active SY: "${activeSchoolYear}").`
        );
        recommendations.push(
          `Verify School Year in Settings matches the recorded ECR school year.`
        );
      }

      // True E-Class Record Computed Transmuted Grade Resolution
      const ecrResolved = resolveStudentQuarterGrade(
        student.lrn,
        subject.id,
        q,
        activeSchoolYear,
        classRecords,
        [], // Strictly compute from ECR raw scores (no grading sheet fallback)
        hpsRecords,
        gradeLevel,
        track
      );
      const ecrTransmutedGrade: number | null = ecrResolved > 0 ? ecrResolved : null;

      // 2. Grade Management (Grading Sheet) Search
      const gsMatches = gradingSheetRecords.filter(
        (r) =>
          (r.student_lrn === student.lrn ||
            String(r.student_lrn).trim() === String(student.lrn).trim()) &&
          isMatchingSubject(subject.id, r.subject_id, r.subject_name, subject.subject_name) &&
          (Number(r.quarter) === q || String(r.quarter).toLowerCase() === `q${q}`) &&
          (!r.school_year ||
            !activeSchoolYear ||
            r.school_year === activeSchoolYear ||
            r.school_year.includes(activeSchoolYear))
      );

      let gradeManagementValue: number | null = null;
      let gradeSource: string | undefined;
      if (gsMatches.length > 0) {
        const matchWithGrade =
          gsMatches.find((r) => r.final_grade && Number(r.final_grade) > 0) || gsMatches[0];
        if (matchWithGrade && matchWithGrade.final_grade && Number(matchWithGrade.final_grade) > 0) {
          gradeManagementValue = Number(matchWithGrade.final_grade);
          gradeSource = matchWithGrade.grade_source;
        }
      }

      const norm = normalizeSubjectName(subject.subject_name);
      const isCompositeParent = norm === 'mapeh' || isEcmkParent(subject.subject_name);

      // If no direct gradeManagementValue exists for a composite parent, dynamically resolve from components
      if (gradeManagementValue === null && isCompositeParent) {
        const gmComp = resolveStudentQuarterGrade(
          student.lrn,
          subject.id,
          q,
          activeSchoolYear,
          [], // No ECR fallback
          gradingSheetRecords, // Strictly from Grade Management saved records
          hpsRecords,
          gradeLevel,
          track
        );
        if (gmComp > 0) {
          gradeManagementValue = gmComp;
          gradeSource = 'dynamic_composite';
        }
      }

      const isVirtualSubject =
        subject.id.startsWith('virtual-') || subject.id.startsWith('curriculum-');

      // 3. Overall Resolution for Output Forms
      const effectiveResolved = resolveStudentQuarterGrade(
        student.lrn,
        subject.id,
        q,
        activeSchoolYear,
        classRecords,
        gradingSheetRecords,
        hpsRecords,
        gradeLevel,
        track
      );

      const effectiveGrade =
        effectiveResolved > 0
          ? effectiveResolved
          : gradeManagementValue && gradeManagementValue > 0
          ? gradeManagementValue
          : null;

      const gradeManagementResolved =
        gradeManagementValue ?? (effectiveResolved > 0 ? effectiveResolved : null);
      const sf9ResolvedGrade = effectiveGrade;
      const gradeSlipResolvedGrade = effectiveGrade;
      const sf10ResolvedGrade = effectiveGrade;

      // SF9 descriptor
      let sf9Descriptor = 'No Grade';
      if (sf9ResolvedGrade) {
        if (sf9ResolvedGrade >= 90) sf9Descriptor = 'Outstanding';
        else if (sf9ResolvedGrade >= 85) sf9Descriptor = 'Very Satisfactory';
        else if (sf9ResolvedGrade >= 80) sf9Descriptor = 'Satisfactory';
        else if (sf9ResolvedGrade >= 75) sf9Descriptor = 'Fairly Satisfactory';
        else sf9Descriptor = 'Did Not Meet Expectations';
      }

      // Grade Slip MAPEH exclusion
      const isComponent =
        norm.includes('musicandarts') ||
        norm.includes('musicarts') ||
        norm.includes('physicaleducationandhealth') ||
        norm.includes('peandhealth') ||
        norm.includes('pehealth') ||
        norm === 'music' ||
        norm === 'arts' ||
        norm === 'physicaleducation' ||
        norm === 'health' ||
        norm === 'pe';
      const gradeSlipExcludedFromAvg = isComponent || subject.subject_name.startsWith('*');

      // SF10 Standard Key
      const sf10StandardKey = norm;

      // Detect Mismatches and Root Causes Across All 5 Modules
      const ecrEffective = ecrTransmutedGrade || ecrStoredFinalGrade;
      const gsEffective = gradeManagementValue;

      // Compare all 5 modules across the board
      const moduleGrades = [
        ecrEffective,
        gradeManagementValue,
        sf9ResolvedGrade,
        gradeSlipResolvedGrade,
        sf10ResolvedGrade,
      ].filter((g): g is number => g !== null && g > 0);

      const hasCrossModuleMismatch = moduleGrades.length > 1 && new Set(moduleGrades).size > 1;

      if (hasCrossModuleMismatch) {
        discrepancies.push(
          `Module grade mismatch detected: ECR (${ecrTransmutedGrade ?? ecrStoredFinalGrade ?? '-'}), Grade Mgmt (${gradeManagementValue ?? '-'}), Forms SF9/Slip/SF10 (${sf9ResolvedGrade ?? '-'}).`
        );
        recommendations.push(
          `Click "Apply ECR" to synchronize the teacher's official E-Class Record grade (${ecrTransmutedGrade ?? ecrStoredFinalGrade}) across all modules.`
        );
      }

      if (ecrEffective && !gsEffective && !hasCrossModuleMismatch) {
        discrepancies.push(
          `E-Class Record has computed grade ${ecrEffective}, but it is not yet saved into Grading Sheet records.`
        );
        recommendations.push(
          `Click "Apply ECR" to save the teacher's transmuted grade permanently to Grade Management summary sheets.`
        );
      }

      if (!ecrEffective && gsEffective && !hasCrossModuleMismatch) {
        discrepancies.push(
          `Grade Management has score ${gsEffective}, but no raw scores exist in E-Class Record.`
        );
        recommendations.push(
          `This is normal if grades were entered directly in Grade Management or imported from Excel rather than weekly score sheets.`
        );
      }

      // Determine overall sync status
      let syncStatus: ModuleGradeBreakdown['syncStatus'] = 'in_sync';

      if (
        hasCrossModuleMismatch ||
        discrepancies.some((d) => d.includes('different school year') || d.includes('stored value of'))
      ) {
        syncStatus = 'mismatch';
      } else if (!ecrEffective && !gsEffective && !effectiveResolved) {
        syncStatus = 'missing';
      } else {
        syncStatus = 'in_sync';
      }

      return {
        ecrRawScoreSummary,
        ecrTransmutedGrade,
        ecrStoredFinalGrade,
        ecrRecordId,
        ecrScores,
        gradeManagementValue,
        gradeManagementResolved,
        gradeSource,
        isVirtualSubject,
        sf9ResolvedGrade,
        sf9Descriptor,
        gradeSlipResolvedGrade,
        gradeSlipExcludedFromAvg,
        sf10ResolvedGrade,
        sf10StandardKey,
        syncStatus,
        discrepancies,
        recommendations,
      };
    },
    [selectedSectionObj, classRecords, hpsRecords, gradingSheetRecords, activeSchoolYear]
  );

  // Compute sync health across all students in the section for the selected quarter
  // This powers the student roster status pills and instant filter tabs!
  const studentHealthMap = useMemo(() => {
    const map = new Map<
      string,
      { mismatches: number; inSync: number; missing: number; total: number; syncRate: number }
    >();

    for (const st of sectionStudents) {
      let mismatches = 0;
      let inSync = 0;
      let missing = 0;

      for (const subj of sectionSubjects) {
        const bd = inspectSubject(st, subj, selectedQuarter);
        if (bd.syncStatus === 'mismatch') mismatches++;
        else if (bd.syncStatus === 'in_sync') inSync++;
        else if (bd.syncStatus === 'missing') missing++;
      }

      const total = sectionSubjects.length;
      const syncRate = total > 0 ? Math.round((inSync / total) * 100) : 100;
      map.set(st.lrn, { mismatches, inSync, missing, total, syncRate });
    }

    return map;
  }, [sectionStudents, sectionSubjects, selectedQuarter, inspectSubject]);

  // Section-wide statistics
  const sectionStats = useMemo(() => {
    let totalMismatches = 0;
    let studentsWithMismatches = 0;
    let studentsFullySynced = 0;
    let studentsNoGrades = 0;

    for (const st of sectionStudents) {
      const h = studentHealthMap.get(st.lrn);
      if (!h) continue;
      if (h.mismatches > 0) {
        studentsWithMismatches++;
        totalMismatches += h.mismatches;
      } else if (h.inSync > 0 && h.missing === 0) {
        studentsFullySynced++;
      } else if (h.missing === h.total) {
        studentsNoGrades++;
      }
    }

    const totalStudents = sectionStudents.length;
    const overallRate =
      totalStudents > 0
        ? Math.round(
            (Array.from(studentHealthMap.values()).reduce((acc, h) => acc + h.syncRate, 0) /
              totalStudents)
          )
        : 100;

    return {
      totalStudents,
      studentsWithMismatches,
      totalMismatches,
      studentsFullySynced,
      studentsNoGrades,
      overallRate,
    };
  }, [sectionStudents, studentHealthMap]);

  // Inspect all subjects for the currently selected student
  const inspectionRows = useMemo(() => {
    if (!selectedStudentObj) return [];

    let targetSubjects = sectionSubjects;
    if (selectedSubjectId !== 'all') {
      targetSubjects = sectionSubjects.filter((s) => s.id === selectedSubjectId);
    }

    return targetSubjects.map((subj) => {
      const breakdown = inspectSubject(selectedStudentObj, subj, selectedQuarter);
      return {
        subject: subj,
        breakdown,
      };
    });
  }, [selectedStudentObj, sectionSubjects, selectedSubjectId, selectedQuarter, inspectSubject]);

  // Filtered inspection rows based on subject status filter
  const displayedInspectionRows = useMemo(() => {
    if (subjectStatusFilter === 'all') return inspectionRows;
    if (subjectStatusFilter === 'mismatches')
      return inspectionRows.filter((r) => r.breakdown.syncStatus === 'mismatch');
    if (subjectStatusFilter === 'in_sync')
      return inspectionRows.filter((r) => r.breakdown.syncStatus === 'in_sync');
    if (subjectStatusFilter === 'missing')
      return inspectionRows.filter((r) => r.breakdown.syncStatus === 'missing');
    return inspectionRows;
  }, [inspectionRows, subjectStatusFilter]);

  // Current student statistics
  const currentStudentStats = useMemo(() => {
    const total = inspectionRows.length;
    const mismatches = inspectionRows.filter((r) => r.breakdown.syncStatus === 'mismatch').length;
    const inSync = inspectionRows.filter((r) => r.breakdown.syncStatus === 'in_sync').length;
    const missing = inspectionRows.filter((r) => r.breakdown.syncStatus === 'missing').length;
    const syncRate = total > 0 ? Math.round((inSync / total) * 100) : 100;
    return { total, mismatches, inSync, missing, syncRate };
  }, [inspectionRows]);

  // Filtered students for sidebar based on search query AND student roster filter tab
  const filteredStudents = useMemo(() => {
    let list = sectionStudents;

    // Apply status filter tab
    if (studentRosterFilter === 'needs_attention') {
      list = list.filter((s) => (studentHealthMap.get(s.lrn)?.mismatches || 0) > 0);
    } else if (studentRosterFilter === 'in_sync') {
      list = list.filter((s) => {
        const h = studentHealthMap.get(s.lrn);
        return h && h.inSync > 0 && h.mismatches === 0 && h.missing === 0;
      });
    } else if (studentRosterFilter === 'no_grades') {
      list = list.filter((s) => {
        const h = studentHealthMap.get(s.lrn);
        return h && h.missing === h.total;
      });
    }

    // Apply search query
    if (studentSearchQuery.trim()) {
      const q = studentSearchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          s.lrn.includes(q)
      );
    }

    return list;
  }, [sectionStudents, studentRosterFilter, studentHealthMap, studentSearchQuery]);

  // 1-Click Sync single subject from ECR to Grading Sheet
  const handleSyncSubject = async (student: Student, subject: Subject, targetGrade: number) => {
    try {
      const validQuarter = (selectedQuarter === 2 ? 2 : selectedQuarter === 3 ? 3 : selectedQuarter === 4 ? 4 : 1) as 1 | 2 | 3 | 4;
      const norm = normalizeSubjectName(subject.subject_name);

      // Special Case 1: MAPEH parent syncs component subjects
      if (norm === 'mapeh') {
        const compSubjects = sectionSubjects.filter((s) => {
          const sn = normalizeSubjectName(s.subject_name);
          return (
            sn !== 'mapeh' &&
            (sn.includes('musicandarts') ||
              sn.includes('musicarts') ||
              sn.includes('physicaleducationandhealth') ||
              sn.includes('peandhealth') ||
              sn.includes('pehealth') ||
              sn === 'music' ||
              sn === 'arts' ||
              sn === 'physicaleducation' ||
              sn === 'health' ||
              sn === 'pe')
          );
        });

        let syncedAny = false;
        for (const comp of compSubjects) {
          const compGrade = resolveStudentQuarterGrade(
            student.lrn,
            comp.id,
            validQuarter,
            activeSchoolYear,
            classRecords,
            [],
            hpsRecords,
            selectedSectionObj?.section_grade_level,
            selectedSectionObj?.track
          );

          if (compGrade > 0) {
            syncedAny = true;
            await updateGradingSheetRecord({
              id: `${student.lrn}_${comp.id}_${validQuarter}_${activeSchoolYear}`,
              student_lrn: student.lrn,
              section_id: selectedSectionObj?.id || '',
              subject_id: comp.id,
              subject_name: comp.subject_name,
              quarter: validQuarter,
              school_year: activeSchoolYear,
              final_grade: compGrade,
              written_works: [],
              performance_tasks: [],
              quarterly_exam: 0,
              grade_source: 'eclass_sync',
            });
          }
        }

        if (syncedAny) {
          showNotification(`Synced MAPEH component records to Grade Management!`, 'success');
          return;
        }
      }

      // Special Case 2: EC/MK composite parent syncs both components
      if (isEcmkParent(subject.subject_name)) {
        const compSubjects = sectionSubjects.filter((s) => {
          const sn = normalizeSubjectName(s.subject_name);
          return sn === 'effectivecommunication' || sn === 'mabisangkomunikasyon';
        });

        let syncedAny = false;
        for (const comp of compSubjects) {
          const compGrade = resolveStudentQuarterGrade(
            student.lrn,
            comp.id,
            validQuarter,
            activeSchoolYear,
            classRecords,
            [],
            hpsRecords,
            selectedSectionObj?.section_grade_level,
            selectedSectionObj?.track
          );

          if (compGrade > 0) {
            syncedAny = true;
            await updateGradingSheetRecord({
              id: `${student.lrn}_${comp.id}_${validQuarter}_${activeSchoolYear}`,
              student_lrn: student.lrn,
              section_id: selectedSectionObj?.id || '',
              subject_id: comp.id,
              subject_name: comp.subject_name,
              quarter: validQuarter,
              school_year: activeSchoolYear,
              final_grade: compGrade,
              written_works: [],
              performance_tasks: [],
              quarterly_exam: 0,
              grade_source: 'eclass_sync',
            });
          }
        }

        if (syncedAny) {
          showNotification(`Synced EC & MK component records to Grade Management!`, 'success');
          return;
        }
      }

      const recordId = `${student.lrn}_${subject.id}_${validQuarter}_${activeSchoolYear}`;
      const record: ClassRecord = {
        id: recordId,
        student_lrn: student.lrn,
        section_id: selectedSectionObj?.id || '',
        subject_id: subject.id,
        subject_name: subject.subject_name,
        quarter: validQuarter,
        school_year: activeSchoolYear,
        final_grade: targetGrade,
        written_works: [],
        performance_tasks: [],
        quarterly_exam: 0,
        grade_source: 'eclass_sync',
      };

      await updateGradingSheetRecord(record);

      // Also ensure classRecord has final_grade recorded
      const cRec = classRecords.find(
        (r) =>
          (r.student_lrn === student.lrn ||
            String(r.student_lrn).trim() === String(student.lrn).trim()) &&
          isMatchingSubject(subject.id, r.subject_id, r.subject_name, subject.subject_name) &&
          (Number(r.quarter) === validQuarter ||
            String(r.quarter).toLowerCase() === `q${validQuarter}`) &&
          (!r.school_year || !activeSchoolYear || r.school_year === activeSchoolYear)
      );
      if (cRec && (!cRec.final_grade || Number(cRec.final_grade) !== targetGrade)) {
        const { updateClassRecord } = useAppStore.getState();
        await updateClassRecord({ ...cRec, final_grade: targetGrade });
      }

      showNotification(
        `Synced ${subject.subject_name} (Grade: ${targetGrade}) to Grade Management!`,
        'success'
      );
    } catch (err) {
      console.error('Failed to sync grade:', err);
      showNotification('Failed to sync grade record.', 'error');
    }
  };

  // Retain a Grade Management value only when an adviser explicitly confirms it
  const handleKeepGradeManagement = async (student: Student, subject: Subject) => {
    const record = gradingSheetRecords.find(
      (candidate) =>
        (candidate.student_lrn === student.lrn ||
          String(candidate.student_lrn).trim() === String(student.lrn).trim()) &&
        isMatchingSubject(
          subject.id,
          candidate.subject_id,
          candidate.subject_name,
          subject.subject_name
        ) &&
        Number(candidate.quarter) === selectedQuarter &&
        (!activeSchoolYear || !candidate.school_year || candidate.school_year === activeSchoolYear) &&
        (!selectedSectionObj?.id ||
          !candidate.section_id ||
          candidate.section_id === selectedSectionObj.id)
    );

    if (!record || Number(record.final_grade) <= 0) {
      showNotification('There is no Grade Management value to preserve for this subject.', 'info');
      return;
    }

    try {
      await updateGradingSheetRecord({ ...record, grade_source: 'manual_override' });
      showNotification(
        `${subject.subject_name} preserved as an intentional Grade Management override.`,
        'success'
      );
    } catch (error) {
      console.error('Failed to preserve Grade Management override:', error);
      showNotification('Could not preserve the Grade Management override.', 'error');
    }
  };

  // 1-Click Batch Sync for all mismatches for current student
  const handleBatchSyncStudent = async () => {
    if (!selectedStudentObj) return;
    setIsBatchSyncing(true);
    try {
      let syncedCount = 0;
      const validQuarter = (selectedQuarter === 2 ? 2 : selectedQuarter === 3 ? 3 : selectedQuarter === 4 ? 4 : 1) as 1 | 2 | 3 | 4;
      const { updateClassRecord } = useAppStore.getState();

      for (const row of inspectionRows) {
        if (row.breakdown.syncStatus !== 'mismatch') continue;

        const target = row.breakdown.ecrTransmutedGrade || row.breakdown.ecrStoredFinalGrade;
        if (target && target > 0) {
          const norm = normalizeSubjectName(row.subject.subject_name);
          if (norm === 'mapeh' || isEcmkParent(row.subject.subject_name)) {
            await handleSyncSubject(selectedStudentObj, row.subject, target);
            syncedCount++;
            continue;
          }

          const recordId = `${selectedStudentObj.lrn}_${row.subject.id}_${validQuarter}_${activeSchoolYear}`;
          const record: ClassRecord = {
            id: recordId,
            student_lrn: selectedStudentObj.lrn,
            section_id: selectedSectionObj?.id || '',
            subject_id: row.subject.id,
            subject_name: row.subject.subject_name,
            quarter: validQuarter,
            school_year: activeSchoolYear,
            final_grade: target,
            written_works: [],
            performance_tasks: [],
            quarterly_exam: 0,
            grade_source: 'eclass_sync',
          };
          await updateGradingSheetRecord(record);

          const cRec = classRecords.find(
            (r) =>
              (r.student_lrn === selectedStudentObj.lrn ||
                String(r.student_lrn).trim() === String(selectedStudentObj.lrn).trim()) &&
              isMatchingSubject(row.subject.id, r.subject_id, r.subject_name, row.subject.subject_name) &&
              (Number(r.quarter) === validQuarter ||
                String(r.quarter).toLowerCase() === `q${validQuarter}`) &&
              (!r.school_year || !activeSchoolYear || r.school_year === activeSchoolYear)
          );
          if (cRec && (!cRec.final_grade || Number(cRec.final_grade) !== target)) {
            await updateClassRecord({ ...cRec, final_grade: target });
          }

          syncedCount++;
        }
      }
      showNotification(
        `Synchronized ${syncedCount} subject(s) for ${selectedStudentObj.last_name}, ${selectedStudentObj.first_name}!`,
        'success'
      );
    } catch (err) {
      console.error('Batch sync error:', err);
      showNotification('Batch synchronization failed.', 'error');
    } finally {
      setIsBatchSyncing(false);
    }
  };

  // Section-wide batch sync: syncs all mismatches across ALL students in the section
  const handleBatchSyncSection = async () => {
    setIsBatchSyncing(true);
    setShowSectionSyncModal(false);
    try {
      let totalSynced = 0;
      const validQuarter = (selectedQuarter === 2 ? 2 : selectedQuarter === 3 ? 3 : selectedQuarter === 4 ? 4 : 1) as 1 | 2 | 3 | 4;
      const { updateClassRecord } = useAppStore.getState();

      for (const st of sectionStudents) {
        const h = studentHealthMap.get(st.lrn);
        if (!h || h.mismatches === 0) continue;

        for (const subj of sectionSubjects) {
          const bd = inspectSubject(st, subj, selectedQuarter);
          if (bd.syncStatus !== 'mismatch') continue;

          const target = bd.ecrTransmutedGrade || bd.ecrStoredFinalGrade;
          if (target && target > 0) {
            const norm = normalizeSubjectName(subj.subject_name);
            if (norm === 'mapeh' || isEcmkParent(subj.subject_name)) {
              await handleSyncSubject(st, subj, target);
              totalSynced++;
              continue;
            }

            const recordId = `${st.lrn}_${subj.id}_${validQuarter}_${activeSchoolYear}`;
            await updateGradingSheetRecord({
              id: recordId,
              student_lrn: st.lrn,
              section_id: selectedSectionObj?.id || '',
              subject_id: subj.id,
              subject_name: subj.subject_name,
              quarter: validQuarter,
              school_year: activeSchoolYear,
              final_grade: target,
              written_works: [],
              performance_tasks: [],
              quarterly_exam: 0,
              grade_source: 'eclass_sync',
            });

            const cRec = classRecords.find(
              (r) =>
                (r.student_lrn === st.lrn ||
                  String(r.student_lrn).trim() === String(st.lrn).trim()) &&
                isMatchingSubject(subj.id, r.subject_id, r.subject_name, subj.subject_name) &&
                (Number(r.quarter) === validQuarter ||
                  String(r.quarter).toLowerCase() === `q${validQuarter}`) &&
                (!r.school_year || !activeSchoolYear || r.school_year === activeSchoolYear)
            );
            if (cRec && (!cRec.final_grade || Number(cRec.final_grade) !== target)) {
              await updateClassRecord({ ...cRec, final_grade: target });
            }

            totalSynced++;
          }
        }
      }

      showNotification(
        `Section Auto-Sync complete! Synchronized ${totalSynced} record(s) across section ${selectedSectionObj?.section_name}.`,
        'success'
      );
    } catch (err) {
      console.error('Section batch sync error:', err);
      showNotification('Section batch synchronization failed.', 'error');
    } finally {
      setIsBatchSyncing(false);
    }
  };

  // Generate full markdown report for copying and developer dispatch
  const generateReportMarkdown = useCallback(() => {
    if (!selectedStudentObj || !selectedSectionObj) return '';

    const periodStr = getPeriodLabel(selectedQuarter, activeSchoolYear);
    let report = `# FormEase Pro - Grade Sync & Diagnostic Report\n`;
    report += `Generated at: ${new Date().toLocaleString()}\n`;
    report += `Active School Year: ${activeSchoolYear}\n`;
    report += `Section: ${selectedSectionObj.section_name} (${selectedSectionObj.section_grade_level})\n`;
    report += `Student: ${selectedStudentObj.last_name}, ${selectedStudentObj.first_name} (LRN: ${selectedStudentObj.lrn})\n`;
    report += `Period Inspected: ${periodStr}\n\n`;
    report += `## Summary\n`;
    report += `- Total Subjects: ${currentStudentStats.total}\n`;
    report += `- In Sync: ${currentStudentStats.inSync}\n`;
    report += `- Mismatches: ${currentStudentStats.mismatches}\n`;
    report += `- Sync Health: ${currentStudentStats.syncRate}%\n\n`;
    report += `## Section Overview\n`;
    report += `- Section Total Students: ${sectionStats.totalStudents}\n`;
    report += `- Students With Mismatches: ${sectionStats.studentsWithMismatches}\n`;
    report += `- Overall Section Health: ${sectionStats.overallRate}%\n\n`;
    report += `## Subject-by-Subject Matrix\n\n`;
    report += `| Subject | ECR Live Grade | Grade Mgmt | SF9 | Grade Slip | SF10 | Status |\n`;
    report += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

    inspectionRows.forEach((r) => {
      const ecr = r.breakdown.ecrTransmutedGrade || r.breakdown.ecrStoredFinalGrade || '-';
      const gm = r.breakdown.gradeManagementValue || r.breakdown.gradeManagementResolved || '-';
      const sf9 = r.breakdown.sf9ResolvedGrade || '-';
      const gs = r.breakdown.gradeSlipResolvedGrade || '-';
      const sf10 = r.breakdown.sf10ResolvedGrade || '-';
      const status = r.breakdown.syncStatus.toUpperCase();
      report += `| ${r.subject.subject_name} | ${ecr} | ${gm} | ${sf9} | ${gs} | ${sf10} | ${status} |\n`;
    });

    const mismatchesOnly = inspectionRows.filter((r) => r.breakdown.discrepancies.length > 0);
    if (mismatchesOnly.length > 0) {
      report += `\n## Detected Root Causes & Recommendations\n\n`;
      mismatchesOnly.forEach((m) => {
        report += `### ${m.subject.subject_name}\n`;
        m.breakdown.discrepancies.forEach((d) => {
          report += `- ⚠️ **Issue:** ${d}\n`;
        });
        m.breakdown.recommendations.forEach((rec) => {
          report += `- 💡 **Fix:** ${rec}\n`;
        });
      });
    }
    return report;
  }, [
    selectedStudentObj,
    selectedSectionObj,
    activeSchoolYear,
    selectedQuarter,
    currentStudentStats,
    sectionStats,
    inspectionRows,
  ]);

  // Copy diagnostic report
  const handleCopyReport = () => {
    const report = generateReportMarkdown();
    if (!report) return;

    void navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
    showNotification('Diagnostic report copied to clipboard!', 'success');
  };

  // Submit diagnostic report directly to developer Emerson
  const handleSendReport = async () => {
    setIsSubmitting(true);
    setSubmissionResult(null);
    try {
      const reportMarkdown = generateReportMarkdown();
      const result = await DiagnosticReporter.submitReport({
        category: 'grade_sync',
        userNote,
        sectionName: selectedSectionObj?.section_name,
        gradeLevel: selectedSectionObj?.section_grade_level,
        studentLrn: selectedStudentObj?.lrn,
        studentName: selectedStudentObj
          ? `${selectedStudentObj.last_name}, ${selectedStudentObj.first_name}`
          : undefined,
        totalMismatches: currentStudentStats.mismatches,
        syncRate: currentStudentStats.syncRate,
        reportMarkdown,
        schoolProfile,
        user: user || undefined,
        activeSchoolYear,
        technicalDetails: {
          period: selectedQuarter,
          periodLabel: getPeriodLabel(selectedQuarter, activeSchoolYear),
          totalSubjects: currentStudentStats.total,
          inSyncSubjects: currentStudentStats.inSync,
          missingSubjects: currentStudentStats.missing,
          sectionMismatches: sectionStats.totalMismatches,
        },
      });
      setSubmissionResult(result);
      if (result.success) {
        showNotification(
          `Report #${result.ticketId} uploaded directly to developer Emerson!`,
          'success'
        );
      } else {
        showNotification('Report queued or email link prepared.', 'info');
      }
    } catch (err) {
      console.error('Submit error:', err);
      showNotification('Failed to submit report.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-100 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md overflow-hidden animate-fadeIn"
    >
      <div className="relative w-full max-w-7xl h-[94vh] max-h-[94vh] bg-white dark:bg-[#0B1120] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">

        {/* 1. Header & Navigation Bar */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-xs shrink-0">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                  Live Diagnostics
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  SY {activeSchoolYear}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
                Grade Sync Inspector & Root-Cause Debugger
              </h2>
            </div>
          </div>

          {/* Quick Context Selectors & Global Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Section Picker */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Section:
              </span>
              <select
                value={selectedSectionId}
                onChange={(e) => {
                  setSelectedSectionId(e.target.value);
                  setSelectedSubjectId('all');
                  setSubjectStatusFilter('all');
                  setStudentRosterFilter('all');
                }}
                className="bg-transparent text-slate-800 dark:text-slate-100 font-bold text-xs focus:outline-none cursor-pointer pr-1"
              >
                {sortedSections.map((s) => (
                  <option key={s.id || s.section_name} value={s.id || s.section_name}>
                    {s.section_grade_level} - {s.section_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Term / Quarter Segmented Controller */}
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-300/60 dark:border-slate-700/60">
              {activePeriods.map((p) => {
                const label = isThreeTerm ? `Term ${p}` : `Q${p}`;
                const isSelected = selectedQuarter === p;
                return (
                  <button
                    key={p}
                    onClick={() => setSelectedQuarter(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Actions: Send to Dev & Copy Report */}
            <button
              onClick={() => {
                setShowSubmitModal(true);
                setSubmissionResult(null);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
              title="Automatically notify developer Emerson with diagnostic state"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send to Developer</span>
            </button>

            <button
              onClick={handleCopyReport}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
              title="Copy complete diagnostic report to clipboard"
            >
              {copiedReport ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{copiedReport ? 'Copied' : 'Copy Report'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Inspector (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Executive Section Health Bar */}
        <div className="shrink-0 px-5 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0E1626] flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Section Summary Chips */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-500 dark:text-slate-400">Section Health:</span>
              <div className="flex items-center gap-1.5 font-bold">
                <span
                  className={`px-2 py-0.5 rounded-md font-mono text-[11px] ${
                    sectionStats.overallRate === 100
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                      : sectionStats.overallRate >= 80
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  {sectionStats.overallRate}% Synced
                </span>
              </div>
            </div>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300">
                <strong>{sectionStats.totalStudents}</strong> Students
              </span>
              <span>•</span>
              <span className={sectionStats.studentsWithMismatches > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400'}>
                <strong>{sectionStats.studentsWithMismatches}</strong> with Mismatches
              </span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                <strong>{sectionStats.studentsFullySynced}</strong> Verified
              </span>
            </div>
          </div>

          {/* Section Auto-Sync Trigger */}
          {sectionStats.totalMismatches > 0 && (
            <button
              onClick={() => setShowSectionSyncModal(true)}
              disabled={isBatchSyncing}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Resolve {sectionStats.totalMismatches} Section Mismatch{sectionStats.totalMismatches > 1 ? 'es' : ''}
              </span>
            </button>
          )}
        </div>

        {/* 3. Main Workspace: Split-View Cockpit */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Left Panel: Student Roster with Health Indicators */}
          <div className="w-68 sm:w-76 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B0F19] flex flex-col shrink-0 min-h-0">
            
            {/* Search Box */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or LRN..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {studentSearchQuery && (
                  <button
                    onClick={() => setStudentSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Roster Filter Tabs */}
              <div className="grid grid-cols-4 gap-1 mt-2.5 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl text-[10px] font-bold">
                <button
                  onClick={() => setStudentRosterFilter('all')}
                  className={`py-1 rounded-lg text-center transition-all cursor-pointer ${
                    studentRosterFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                  title="Show all students in this section"
                >
                  All ({sectionStudents.length})
                </button>

                <button
                  onClick={() => setStudentRosterFilter('needs_attention')}
                  className={`py-1 rounded-lg text-center transition-all cursor-pointer ${
                    studentRosterFilter === 'needs_attention'
                      ? 'bg-rose-500 text-white shadow-xs font-black'
                      : sectionStats.studentsWithMismatches > 0
                      ? 'text-rose-600 dark:text-rose-400 font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                  title="Filter students with detected grade mismatches"
                >
                  Issues ({sectionStats.studentsWithMismatches})
                </button>

                <button
                  onClick={() => setStudentRosterFilter('in_sync')}
                  className={`py-1 rounded-lg text-center transition-all cursor-pointer ${
                    studentRosterFilter === 'in_sync'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                  title="Filter fully synchronized students"
                >
                  Synced ({sectionStats.studentsFullySynced})
                </button>

                <button
                  onClick={() => setStudentRosterFilter('no_grades')}
                  className={`py-1 rounded-lg text-center transition-all cursor-pointer ${
                    studentRosterFilter === 'no_grades'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                  title="Filter students with unencoded subjects"
                >
                  Empty ({sectionStats.studentsNoGrades})
                </button>
              </div>
            </div>

            {/* Student List Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 min-h-0">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st, idx) => {
                  const isSelected = st.lrn === selectedStudentLrn;
                  const health = studentHealthMap.get(st.lrn);
                  const hasMismatches = (health?.mismatches || 0) > 0;
                  const isFullySynced = (health?.inSync || 0) === (health?.total || 0) && (health?.total || 0) > 0;
                  const isEmpty = (health?.missing || 0) === (health?.total || 0);

                  return (
                    <button
                      key={st.lrn}
                      onClick={() => setSelectedStudentLrn(st.lrn)}
                      className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 font-bold'
                          : 'bg-white dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200/70 dark:border-slate-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              hasMismatches
                                ? 'bg-rose-500'
                                : isFullySynced
                                ? 'bg-emerald-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <p className="text-xs truncate font-bold leading-tight">
                            {idx + 1}. {st.last_name}, {st.first_name}
                          </p>
                        </div>
                        <p
                          className={`text-[10px] mt-0.5 font-mono tabular-nums ${
                            isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'
                          }`}
                        >
                          {st.lrn}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {hasMismatches ? (
                          <span
                            className={`px-1.5 py-0.5 rounded-md font-black text-[9px] uppercase tracking-wider flex items-center gap-0.5 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                            }`}
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {health?.mismatches} diff
                          </span>
                        ) : isFullySynced ? (
                          <span
                            className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] uppercase ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            Synced
                          </span>
                        ) : isEmpty ? (
                          <span
                            className={`text-[9px] ${
                              isSelected ? 'text-blue-100' : 'text-slate-400'
                            }`}
                          >
                            Empty
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] font-mono ${
                              isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {health?.inSync}/{health?.total}
                          </span>
                        )}

                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-semibold uppercase ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : st.gender === 'Male'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-pink-600 dark:text-pink-400'
                          }`}
                        >
                          {st.gender === 'Male' ? 'M' : 'F'}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">
                  No students matching active filter.
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: High-Precision Live Comparison Matrix */}
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-slate-50/40 dark:bg-[#0B1120] p-4 sm:p-5 min-h-0">
            
            {/* Student Banner */}
            {selectedStudentObj ? (
              <div className="mb-4 p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-black text-sm flex items-center justify-center border border-blue-500/20 shrink-0">
                    {selectedStudentObj.last_name[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {selectedStudentObj.last_name}, {selectedStudentObj.first_name}{' '}
                      {selectedStudentObj.middle_name || ''}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      <span>
                        LRN:{' '}
                        <strong className="text-slate-700 dark:text-slate-200 font-mono tabular-nums">
                          {selectedStudentObj.lrn}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Grade Level: <strong>{selectedSectionObj?.section_grade_level}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Section: <strong>{selectedSectionObj?.section_name}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Student Status & Quick Actions */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                      Student Health
                    </span>
                    <p
                      className={`text-sm font-black font-mono tabular-nums ${
                        currentStudentStats.syncRate === 100
                          ? 'text-emerald-500'
                          : currentStudentStats.syncRate >= 75
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {currentStudentStats.syncRate}% Complete
                    </p>
                  </div>

                  {currentStudentStats.mismatches > 0 && (
                    <button
                      onClick={handleBatchSyncStudent}
                      disabled={isBatchSyncing}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{isBatchSyncing ? 'Syncing...' : 'Sync This Student'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {/* Subject Status Filter Chips */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                  Filter Subjects:
                </span>
                <button
                  onClick={() => setSubjectStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    subjectStatusFilter === 'all'
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  All ({currentStudentStats.total})
                </button>
                <button
                  onClick={() => setSubjectStatusFilter('mismatches')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    subjectStatusFilter === 'mismatches'
                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-black'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Mismatches ({currentStudentStats.mismatches})</span>
                </button>
                <button
                  onClick={() => setSubjectStatusFilter('in_sync')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    subjectStatusFilter === 'in_sync'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>In Sync ({currentStudentStats.inSync})</span>
                </button>
                <button
                  onClick={() => setSubjectStatusFilter('missing')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    subjectStatusFilter === 'missing'
                      ? 'bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white'
                      : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>No Grade ({currentStudentStats.missing})</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Period: <strong>{getPeriodLabel(selectedQuarter, activeSchoolYear)}</strong>
              </span>
            </div>

            {/* Matrix Table with Unified Calm Aesthetics */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-slate-900/60">
              <div className="overflow-auto max-h-[56vh] custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-20 shadow-xs text-[11px] uppercase tracking-wider">
                    {/* Primary Grouping Header */}
                    <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700/80">
                      <th className="p-3 font-black bg-slate-100 dark:bg-slate-800">
                        Learning Area / Subject
                      </th>
                      <th
                        colSpan={2}
                        className="p-3 text-center font-black bg-slate-100/95 dark:bg-slate-800/95 border-l border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-300"
                      >
                        1. Authoritative Grade Sources
                      </th>
                      <th
                        colSpan={3}
                        className="p-3 text-center font-black bg-slate-100/90 dark:bg-slate-800/90 border-l border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      >
                        2. Downstream School Forms
                      </th>
                      <th className="p-3 text-center font-black bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
                        Status
                      </th>
                      <th className="p-3 text-right font-black bg-slate-100 dark:bg-slate-800">
                        Resolution
                      </th>
                    </tr>

                    {/* Secondary Specific Column Header */}
                    <tr className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[10px]">
                      <th className="px-3 py-2">DepEd Curriculum Subject</th>
                      <th className="px-3 py-2 text-center border-l border-slate-200 dark:border-slate-800 font-bold text-blue-600 dark:text-blue-400">
                        E-Class Record (ECR)
                      </th>
                      <th className="px-3 py-2 text-center font-bold text-blue-600 dark:text-blue-400">
                        Grade Management
                      </th>
                      <th className="px-3 py-2 text-center border-l border-slate-200 dark:border-slate-800">
                        SF9 Card
                      </th>
                      <th className="px-3 py-2 text-center">Grade Slip</th>
                      <th className="px-3 py-2 text-center">SF10 Form</th>
                      <th className="px-3 py-2 text-center border-l border-slate-200 dark:border-slate-800">
                        Diagnostic
                      </th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {displayedInspectionRows.length > 0 ? (
                      displayedInspectionRows.map(({ subject, breakdown }) => {
                        const isExpanded = expandedSubjectId === subject.id;
                        const ecrDisplay =
                          breakdown.ecrTransmutedGrade ?? breakdown.ecrStoredFinalGrade;
                        const gmDisplay =
                          breakdown.gradeManagementValue ?? breakdown.gradeManagementResolved;
                        const sf9Display = breakdown.sf9ResolvedGrade;
                        const gsDisplay = breakdown.gradeSlipResolvedGrade;
                        const sf10Display = breakdown.sf10ResolvedGrade;
                        const isMismatch = breakdown.syncStatus === 'mismatch';

                        return (
                          <React.Fragment key={subject.id}>
                            <tr
                              className={`transition-colors cursor-pointer group ${
                                isExpanded
                                  ? 'bg-blue-50/60 dark:bg-blue-950/20'
                                  : isMismatch
                                  ? 'bg-rose-50/30 dark:bg-rose-950/10 hover:bg-rose-50/60 dark:hover:bg-rose-950/20'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              }`}
                              onClick={() =>
                                setExpandedSubjectId(isExpanded ? null : subject.id)
                              }
                            >
                              {/* Subject Name */}
                              <td className="p-3 font-bold text-slate-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                                      isExpanded ? 'rotate-180 text-blue-500' : ''
                                    }`}
                                  />
                                  <div>
                                    <p className="font-bold text-xs">{subject.subject_name}</p>
                                    {breakdown.isVirtualSubject && (
                                      <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">
                                        Virtual / Composite Learning Area
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 1. ECR Grade */}
                              <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800/60">
                                {ecrDisplay !== null ? (
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-mono tabular-nums text-xs font-bold ${
                                      isMismatch
                                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                        : 'text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80'
                                    }`}
                                  >
                                    {ecrDisplay}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 font-mono">—</span>
                                )}
                              </td>

                              {/* 2. Grade Management */}
                              <td className="p-3 text-center">
                                {gmDisplay !== null ? (
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-mono tabular-nums text-xs font-bold ${
                                      isMismatch
                                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                        : 'text-slate-800 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80'
                                    }`}
                                  >
                                    {gmDisplay}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 font-mono">—</span>
                                )}
                              </td>

                              {/* 3. SF9 Card */}
                              <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800/60 font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                                {sf9Display !== null ? sf9Display : '—'}
                              </td>

                              {/* 4. Grade Slip */}
                              <td className="p-3 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                                {gsDisplay !== null ? gsDisplay : '—'}
                              </td>

                              {/* 5. SF10 Form */}
                              <td className="p-3 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                                {sf10Display !== null ? sf10Display : '—'}
                              </td>

                              {/* Status Badge */}
                              <td className="p-3 text-center border-l border-slate-100 dark:border-slate-800/60">
                                {breakdown.syncStatus === 'in_sync' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-900/60">
                                    <Check className="w-2.5 h-2.5" />
                                    In Sync
                                  </span>
                                ) : breakdown.syncStatus === 'mismatch' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 font-black text-[10px] uppercase tracking-wider border border-rose-300 dark:border-rose-900/60">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    Mismatch
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 font-semibold text-[10px] uppercase">
                                    No Grade
                                  </span>
                                )}
                              </td>

                              {/* Quick Resolution Actions */}
                              <td
                                className="p-3 text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {(breakdown.ecrTransmutedGrade || breakdown.ecrStoredFinalGrade) &&
                                ((breakdown.ecrTransmutedGrade || breakdown.ecrStoredFinalGrade) !==
                                  breakdown.gradeManagementValue ||
                                  breakdown.syncStatus === 'mismatch') ? (
                                  <div className="flex justify-end items-center gap-1.5">
                                    <button
                                      onClick={() =>
                                        handleSyncSubject(
                                          selectedStudentObj!,
                                          subject,
                                          (breakdown.ecrTransmutedGrade ||
                                            breakdown.ecrStoredFinalGrade)!
                                        )
                                      }
                                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition-all shadow-xs active:scale-95 cursor-pointer"
                                      title="Update Grade Management with the authoritative E-Class score"
                                    >
                                      Apply ECR (
                                      {breakdown.ecrTransmutedGrade ||
                                        breakdown.ecrStoredFinalGrade}
                                      )
                                    </button>
                                    {breakdown.gradeManagementValue !== null && (
                                      <button
                                        onClick={() =>
                                          handleKeepGradeManagement(selectedStudentObj!, subject)
                                        }
                                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[10px] transition-all cursor-pointer"
                                        title="Confirm Grade Management value as an intentional override"
                                      >
                                        Keep Override
                                      </button>
                                    )}
                                  </div>
                                ) : breakdown.syncStatus === 'in_sync' ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Verified
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[10px] font-medium">
                                    Pending
                                  </span>
                                )}
                              </td>
                            </tr>

                            {/* Deep Diagnostic Breakdown Drawer */}
                            {isExpanded && (
                              <tr className="bg-slate-50/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
                                <td colSpan={8} className="p-4 sm:p-5">
                                  <div className="space-y-4">
                                    
                                    {/* 1. Root Cause Alert Banner */}
                                    {breakdown.discrepancies.length > 0 ? (
                                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                                            <ShieldAlert className="w-4 h-4" />
                                            <span>Root-Cause Diagnostic Analysis</span>
                                          </div>
                                          {(breakdown.ecrTransmutedGrade || breakdown.ecrStoredFinalGrade) && (
                                            <button
                                              onClick={() =>
                                                handleSyncSubject(
                                                  selectedStudentObj!,
                                                  subject,
                                                  (breakdown.ecrTransmutedGrade || breakdown.ecrStoredFinalGrade)!
                                                )
                                              }
                                              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                                            >
                                              Fix Now (Apply ECR Score)
                                            </button>
                                          )}
                                        </div>

                                        {breakdown.discrepancies.map((d, i) => (
                                          <p
                                            key={i}
                                            className="text-xs text-rose-800 dark:text-rose-200 font-medium leading-relaxed"
                                          >
                                            • {d}
                                          </p>
                                        ))}

                                        {breakdown.recommendations.map((rec, i) => (
                                          <p
                                            key={i}
                                            className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold leading-relaxed pt-1"
                                          >
                                            💡 Recommendation: {rec}
                                          </p>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        <span>
                                          Verified Agreement: Teacher E-Class Record calculations match Grade Management and all downstream school forms (SF9, Grade Slip, SF10).
                                        </span>
                                      </div>
                                    )}

                                    {/* 2. Score Computation Trace & Weights */}
                                    {breakdown.ecrScores && (
                                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                          <span>ECR Raw Score Composition</span>
                                          <span className="text-[11px] text-slate-400 font-mono">
                                            Transmuted Final: {breakdown.ecrTransmutedGrade ?? 'N/A'}
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Written Works (WW)</p>
                                            <p className="font-mono font-bold mt-1 text-slate-800 dark:text-slate-200">
                                              {breakdown.ecrScores.wwScore} / {breakdown.ecrScores.wwHps} ({breakdown.ecrScores.wwPct}%)
                                            </p>
                                          </div>
                                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Performance Tasks (PT)</p>
                                            <p className="font-mono font-bold mt-1 text-slate-800 dark:text-slate-200">
                                              {breakdown.ecrScores.ptScore} / {breakdown.ecrScores.ptHps} ({breakdown.ecrScores.ptPct}%)
                                            </p>
                                          </div>
                                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Quarterly Assessment (QA)</p>
                                            <p className="font-mono font-bold mt-1 text-slate-800 dark:text-slate-200">
                                              {breakdown.ecrScores.qaScore} / {breakdown.ecrScores.qaHps} ({breakdown.ecrScores.qaPct}%)
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* 3. Technical System Inspector Details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                          Database Record ID
                                        </span>
                                        <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 truncate" title={subject.id}>
                                          {subject.id}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1 truncate">
                                          ECR ID: {breakdown.ecrRecordId || 'None'}
                                        </p>
                                      </div>

                                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                          Grade Source
                                        </span>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                                          {breakdown.gradeSource || 'Standard Compute'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                          Virtual: {breakdown.isVirtualSubject ? 'Yes (Curriculum)' : 'No (Database)'}
                                        </p>
                                      </div>

                                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                          SF9 Descriptor
                                        </span>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                                          {breakdown.sf9Descriptor}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                          General Average: {breakdown.gradeSlipExcludedFromAvg ? 'Excluded (Component)' : 'Included'}
                                        </p>
                                      </div>

                                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                          SF10 Canonical Key
                                        </span>
                                        <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                                          {breakdown.sf10StandardKey}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                          {periodHeader}: {selectedQuarter}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-xs text-slate-400 font-medium">
                          <div className="flex flex-col items-center justify-center gap-2 py-4">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {subjectStatusFilter === 'mismatches'
                                ? 'All subjects are perfectly synchronized! No grade mismatches found.'
                                : subjectStatusFilter === 'in_sync'
                                ? 'No synchronized grades found under this filter.'
                                : subjectStatusFilter === 'missing'
                                ? 'No missing grade subjects found.'
                                : 'No subject grade records found matching the active filter.'}
                            </p>
                            {subjectStatusFilter !== 'all' && (
                              <button
                                onClick={() => setSubjectStatusFilter('all')}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-100 transition-all cursor-pointer mt-1"
                              >
                                Show All Subjects ({currentStudentStats.total})
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        {/* 4. Modal Footer Status Bar */}
        <div className="shrink-0 p-3 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Click any subject row to expand full calculation trace, raw scores, and diagnostic lineage.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>FormEase Pro Live Diagnostic Engine v3.5</span>
          </div>
        </div>

      </div>

      {/* Section-Wide Auto-Sync Confirmation Dialog */}
      {showSectionSyncModal && (
        <div className="absolute inset-0 z-110 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0E1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Synchronize Section Mismatches
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedSectionObj?.section_name} ({selectedSectionObj?.section_grade_level})
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2 text-slate-700 dark:text-slate-300">
              <p>
                Found <strong>{sectionStats.totalMismatches}</strong> subject mismatch(es) across{' '}
                <strong>{sectionStats.studentsWithMismatches}</strong> student(s).
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                This action will update Grade Management master records to match the teachers' authoritative E-Class Record computed grades.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSectionSyncModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchSyncSection}
                disabled={isBatchSyncing}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isBatchSyncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synchronizing Section...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Confirm & Sync Section</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Submission Drawer / Modal */}
      {showSubmitModal && (
        <div className="absolute inset-0 z-110 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0E1626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Submit Diagnostic Ticket
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Directly notify developer Emerson with full diagnostic logs and metadata.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submissionResult ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Ticket #{submissionResult.ticketId} Created!</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {submissionResult.message}
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <a
                    href={DiagnosticReporter.getEmailFallbackUrl(submissionResult.ticketId, {
                      category: 'grade_sync',
                      userNote,
                      sectionName: selectedSectionObj?.section_name,
                      gradeLevel: selectedSectionObj?.section_grade_level,
                      studentLrn: selectedStudentObj?.lrn,
                      studentName: selectedStudentObj
                        ? `${selectedStudentObj.last_name}, ${selectedStudentObj.first_name}`
                        : undefined,
                      totalMismatches: currentStudentStats.mismatches,
                      syncRate: currentStudentStats.syncRate,
                      reportMarkdown: generateReportMarkdown(),
                      schoolProfile,
                      user: user || undefined,
                      activeSchoolYear,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Also Open in Email</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                  <p>
                    • <strong>School:</strong> {schoolProfile?.name || 'School Profile'}
                  </p>
                  <p>
                    • <strong>Section:</strong> {selectedSectionObj?.section_name} (
                    {selectedSectionObj?.section_grade_level})
                  </p>
                  <p>
                    • <strong>Student:</strong>{' '}
                    {selectedStudentObj
                      ? `${selectedStudentObj.last_name}, ${selectedStudentObj.first_name}`
                      : 'All'}
                  </p>
                  <p>
                    • <strong>Mismatches:</strong>{' '}
                    <span
                      className={
                        currentStudentStats.mismatches > 0
                          ? 'text-rose-500 font-bold'
                          : 'text-emerald-500 font-bold'
                      }
                    >
                      {currentStudentStats.mismatches} item(s)
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Optional Note / What were you trying to do?
                  </label>
                  <textarea
                    rows={3}
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="e.g. SF9 is not showing the Math grade after importing the Excel template..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendReport}
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
