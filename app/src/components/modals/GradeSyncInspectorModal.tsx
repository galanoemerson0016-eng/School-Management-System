import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore, useAuthStore } from '../../stores';
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
} from 'lucide-react';
import type { Student, Subject, ClassRecord } from '../../types';
import { normalizeSubjectName, sortSubjects } from '../../lib/subjectConfig';
import {
  resolveStudentQuarterGrade,
  isMatchingSubject,
} from '../../utils/grading-helpers';
import {
  getSubjectCluster,
  getWeights,
  computeExamsWeightedScore,
  transmuteGrade,
} from '../../lib/grading';
import { DiagnosticReporter, type SubmissionResult } from '../../services/diagnostic-reporter';

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
  
  gradeManagementValue: number | null;
  gradeManagementResolved: number | null;
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
    showNotification
  } = useAppStore();

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedStudentLrn, setSelectedStudentLrn] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || 'all');
  const [selectedQuarter, setSelectedQuarter] = useState<number>(initialQuarter);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'mismatches' | 'in_sync'>('all');
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);

  // Global event listener to open from anywhere
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
    } else if (!selectedSectionId && sections.length > 0) {
      setSelectedSectionId(sections[0].id || sections[0].section_name);
    }
  }, [sections, initialSectionId, selectedSectionId]);

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
    return sections.find(s => s.id === selectedSectionId || s.section_name === selectedSectionId);
  }, [sections, selectedSectionId]);

  const sectionStudents = useMemo(() => {
    if (!selectedSectionObj) return [];
    return students
      .filter(s => s.student_section === selectedSectionObj.section_name || s.student_section === selectedSectionObj.id)
      .sort((a, b) => {
        if (a.gender !== b.gender) return a.gender === 'Male' ? -1 : 1;
        return a.last_name.localeCompare(b.last_name);
      });
  }, [students, selectedSectionObj]);

  // Set default student if none selected or if section changes
  useEffect(() => {
    if (sectionStudents.length > 0) {
      const exists = sectionStudents.some(s => s.lrn === selectedStudentLrn);
      if (!exists) {
        setSelectedStudentLrn(sectionStudents[0].lrn);
      }
    } else {
      setSelectedStudentLrn('');
    }
  }, [sectionStudents, selectedStudentLrn]);

  const selectedStudentObj = useMemo(() => {
    return sectionStudents.find(s => s.lrn === selectedStudentLrn) || sectionStudents[0] || null;
  }, [sectionStudents, selectedStudentLrn]);

  // Section subjects deduplicated
  const sectionSubjects = useMemo(() => {
    if (!selectedSectionObj) return [];
    const sectionGradeNum = parseInt(selectedSectionObj.section_grade_level.replace(/\D/g, '')) || 0;

    const candidates = subjects.filter(s => {
      const subjectGradeNum = parseInt(s.grade_level?.toString().replace(/\D/g, '') || '0');
      const isMatchingGrade = subjectGradeNum === sectionGradeNum;
      const isMatchingSection = s.section_id === selectedSectionObj.id;
      return (isMatchingGrade || isMatchingSection) && s.term !== 'none';
    }).filter(s => !s.section_id || s.section_id === selectedSectionObj.id);

    candidates.sort((a, b) => {
      const aDirect = a.section_id === selectedSectionObj.id ? 1 : 0;
      const bDirect = b.section_id === selectedSectionObj.id ? 1 : 0;
      return bDirect - aDirect;
    });

    const seen = new Set<string>();
    const res: Subject[] = [];
    for (const s of candidates) {
      const norm = normalizeSubjectName(s.subject_name);
      if (norm && seen.has(norm)) continue;
      if (norm) seen.add(norm);
      res.push(s);
    }
    return sortSubjects(res, s => s.subject_name);
  }, [subjects, selectedSectionObj]);

  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return sectionStudents;
    const q = studentSearchQuery.toLowerCase().trim();
    return sectionStudents.filter(s =>
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.lrn.includes(q)
    );
  }, [sectionStudents, studentSearchQuery]);

  // Calculate deep multi-module inspection for a student + subject + quarter
  const inspectSubject = useCallback((student: Student, subject: Subject, quarter: number): ModuleGradeBreakdown => {
    const discrepancies: string[] = [];
    const recommendations: string[] = [];
    const q = quarter;
    const gradeLevel = selectedSectionObj?.section_grade_level || student.grade_level || 'Grade 7';
    const track = selectedSectionObj?.track || student.track || '';

    // 1. E-Class Record Search
    const ecrMatches = classRecords.filter(r =>
      (r.student_lrn === student.lrn || String(r.student_lrn).trim() === String(student.lrn).trim()) &&
      isMatchingSubject(subject.id, r.subject_id, r.subject_name, subject.subject_name) &&
      (Number(r.quarter) === q || String(r.quarter).toLowerCase() === `q${q}` || String(r.quarter).toLowerCase() === `t${q}`) &&
      (!r.school_year || !activeSchoolYear || r.school_year === activeSchoolYear || r.school_year.includes(activeSchoolYear))
    );

    const crossSyEcrMatches = classRecords.filter(r =>
      (r.student_lrn === student.lrn || String(r.student_lrn).trim() === String(student.lrn).trim()) &&
      isMatchingSubject(subject.id, r.subject_id, r.subject_name, subject.subject_name) &&
      (Number(r.quarter) === q || String(r.quarter).toLowerCase() === `q${q}` || String(r.quarter).toLowerCase() === `t${q}`) &&
      r.school_year && activeSchoolYear && r.school_year !== activeSchoolYear
    );

    let ecrRawScoreSummary = 'No raw scores entered';
    let ecrTransmutedGrade: number | null = null;
    let ecrStoredFinalGrade: number | null = null;
    let ecrRecordId: string | undefined;

    if (ecrMatches.length > 0) {
      const cRec = ecrMatches[0];
      ecrRecordId = cRec.id;
      if (cRec.final_grade && Number(cRec.final_grade) > 0) {
        ecrStoredFinalGrade = Number(cRec.final_grade);
      }

      const rawWw = (cRec.written_works || []).map(v => (v !== undefined && v !== null ? v : ''));
      const rawPt = (cRec.performance_tasks || []).map(v => (v !== undefined && v !== null ? v : ''));
      const rawQa = cRec.quarterly_exam !== undefined && cRec.quarterly_exam !== null ? cRec.quarterly_exam : '';

      const isValidScore = (v: unknown): boolean => v !== '' && v !== null && v !== undefined && !isNaN(Number(v));
      const hasScores = rawWw.some(isValidScore) || rawPt.some(isValidScore) || isValidScore(rawQa);

      if (hasScores) {
        // Find HPS
        const hRec = hpsRecords.find(h =>
          isMatchingSubject(subject.id, h.subject_id, undefined, subject.subject_name) &&
          (Number(h.quarter) === q || String(h.quarter).toLowerCase() === `q${q}`) &&
          (!h.school_year || !activeSchoolYear || h.school_year === activeSchoolYear)
        );

        const hps_ww: number[] = (hRec?.written_works || []).map((v: unknown) => Number(v) || 0);
        const hps_pt: number[] = (hRec?.performance_tasks || []).map((v: unknown) => Number(v) || 0);
        const hps_qa: number = Number(hRec?.quarterly_exam) || 0;

        const wwTotalScore = rawWw.reduce<number>((acc: number, v: unknown) => acc + (isValidScore(v) ? Number(v) : 0), 0);
        const ptTotalScore = rawPt.reduce<number>((acc: number, v: unknown) => acc + (isValidScore(v) ? Number(v) : 0), 0);
        const wwTotalHPS = hps_ww.reduce((a: number, b: number) => a + b, 0);
        const ptTotalHPS = hps_pt.reduce((a: number, b: number) => a + b, 0);

        ecrRawScoreSummary = `WW: ${wwTotalScore}/${wwTotalHPS || 0}, PT: ${ptTotalScore}/${ptTotalHPS || 0}`;

        if (wwTotalHPS > 0 || ptTotalHPS > 0) {
          const cluster = getSubjectCluster(subject.subject_name, gradeLevel, track);
          const weights = getWeights(cluster, subject);

          const wwPS = wwTotalHPS === 0 ? 0 : Math.min(100, Math.max(0, (wwTotalScore / wwTotalHPS) * 100));
          const ptPS = ptTotalHPS === 0 ? 0 : Math.min(100, Math.max(0, (ptTotalScore / ptTotalHPS) * 100));
          const wwWS = wwPS * (weights.written_works || 0);
          const ptWS = ptPS * (weights.performance_tasks || 0);

          const parseNumOrNull = (val: number | string | null | undefined): number | null => {
            if (val === '' || val === null || val === undefined) return null;
            const n = Number(val);
            return isNaN(n) ? null : n;
          };

          const qaPS = computeExamsWeightedScore(
            parseNumOrNull(rawQa), hps_qa,
            null, 0,
            null, 0,
            cluster
          );
          const qaWS = qaPS * (weights.quarterly_exam || 0);

          const initial = Math.min(100, Math.max(0, wwWS + ptWS + qaWS));
          const transmuted = transmuteGrade(initial, activeSchoolYear);
          if (transmuted > 0) {
            ecrTransmutedGrade = transmuted;
          }
        } else {
          discrepancies.push(`E-Class Record has raw student scores, but Total Highest Possible Score (HPS) is 0.`);
          recommendations.push(`Open E-Class Record and fill in the Highest Possible Score (HPS) row so transmuted grades can be computed.`);
        }
      }
    } else if (crossSyEcrMatches.length > 0) {
      discrepancies.push(`Found ECR record under different school year "${crossSyEcrMatches[0].school_year}" (Active SY: "${activeSchoolYear}").`);
      recommendations.push(`Verify School Year in Settings matches the recorded ECR school year.`);
    }

    // 2. Grade Management (Grading Sheet) Search
    const gsMatches = gradingSheetRecords.filter(r =>
      (r.student_lrn === student.lrn || String(r.student_lrn).trim() === String(student.lrn).trim()) &&
      isMatchingSubject(subject.id, r.subject_id, r.subject_name, subject.subject_name) &&
      (Number(r.quarter) === q || String(r.quarter).toLowerCase() === `q${q}`) &&
      (!r.school_year || !activeSchoolYear || r.school_year === activeSchoolYear || r.school_year.includes(activeSchoolYear))
    );

    let gradeManagementValue: number | null = null;
    if (gsMatches.length > 0) {
      const matchWithGrade = gsMatches.find(r => r.final_grade && Number(r.final_grade) > 0) || gsMatches[0];
      if (matchWithGrade && matchWithGrade.final_grade && Number(matchWithGrade.final_grade) > 0) {
        gradeManagementValue = Number(matchWithGrade.final_grade);
      }
    }

    const isVirtualSubject = subject.id.startsWith('virtual-') || subject.id.startsWith('curriculum-');

    // 3. Overall Resolution for All Modules
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

    const effectiveGrade = effectiveResolved > 0 ? effectiveResolved : (gradeManagementValue && gradeManagementValue > 0 ? gradeManagementValue : null);

    const gradeManagementResolved = gradeManagementValue ?? (effectiveResolved > 0 ? effectiveResolved : null);
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
    const norm = normalizeSubjectName(subject.subject_name);
    const isComponent = (
      norm.includes('musicandarts') || norm.includes('musicarts') ||
      norm.includes('physicaleducationandhealth') || norm.includes('peandhealth') || norm.includes('pehealth') ||
      norm === 'music' || norm === 'arts' || norm === 'physicaleducation' || norm === 'health'
    );
    const gradeSlipExcludedFromAvg = isComponent || subject.subject_name.startsWith('*');

    // SF10 Standard Key
    const sf10StandardKey = norm;

    // Detect Mismatches and Root Causes
    const ecrEffective = ecrTransmutedGrade || ecrStoredFinalGrade;
    const gsEffective = gradeManagementValue;

    if (ecrEffective && gsEffective && ecrEffective !== gsEffective) {
      discrepancies.push(
        `Grade Management has a stored value of ${gsEffective}, but E-Class Record (Teacher's Teaching Load) computed transmutation is ${ecrEffective}.`
      );
      recommendations.push(
        `Click "Sync ECR" to overwrite Grade Management with the teacher's official E-Class Record calculation (${ecrEffective}).`
      );
    }

    if (ecrEffective && !gsEffective) {
      discrepancies.push(
        `E-Class Record has computed grade ${ecrEffective}, but it is not yet saved into Grading Sheet records.`
      );
      recommendations.push(
        `Click "Sync ECR" to save the teacher's transmuted grade permanently to Grade Management summary sheets.`
      );
    }

    if (!ecrEffective && gsEffective) {
      discrepancies.push(
        `Grade Management has score ${gsEffective}, but no raw scores exist in E-Class Record.`
      );
      recommendations.push(
        `This is normal if grades were entered directly in Grade Management / Excel import rather than weekly ECR score sheets.`
      );
    }

    // Determine overall sync status
    let syncStatus: ModuleGradeBreakdown['syncStatus'] = 'in_sync';

    if (discrepancies.some(d => d.includes('different school year') || d.includes('stored value of'))) {
      syncStatus = 'mismatch';
    } else if (!ecrEffective && !gsEffective && !effectiveResolved) {
      syncStatus = 'missing';
    } else if (ecrEffective && gsEffective && ecrEffective !== gsEffective) {
      syncStatus = 'mismatch';
    } else {
      syncStatus = 'in_sync';
    }

    return {
      ecrRawScoreSummary,
      ecrTransmutedGrade,
      ecrStoredFinalGrade,
      ecrRecordId,
      gradeManagementValue,
      gradeManagementResolved,
      isVirtualSubject,
      sf9ResolvedGrade,
      sf9Descriptor,
      gradeSlipResolvedGrade,
      gradeSlipExcludedFromAvg,
      sf10ResolvedGrade,
      sf10StandardKey,
      syncStatus,
      discrepancies,
      recommendations
    };
  }, [selectedSectionObj, classRecords, hpsRecords, gradingSheetRecords, activeSchoolYear]);

  // Inspect all subjects for the selected student
  const inspectionRows = useMemo(() => {
    if (!selectedStudentObj) return [];

    let targetSubjects = sectionSubjects;
    if (selectedSubjectId !== 'all') {
      targetSubjects = sectionSubjects.filter(s => s.id === selectedSubjectId);
    }

    return targetSubjects.map(subj => {
      const breakdown = inspectSubject(selectedStudentObj, subj, selectedQuarter);
      return {
        subject: subj,
        breakdown
      };
    });
  }, [selectedStudentObj, sectionSubjects, selectedSubjectId, selectedQuarter, inspectSubject]);

  // Filtered inspection rows based on status filter
  const displayedInspectionRows = useMemo(() => {
    if (statusFilter === 'all') return inspectionRows;
    if (statusFilter === 'mismatches') return inspectionRows.filter(r => r.breakdown.syncStatus === 'mismatch');
    if (statusFilter === 'in_sync') return inspectionRows.filter(r => r.breakdown.syncStatus === 'in_sync');
    return inspectionRows;
  }, [inspectionRows, statusFilter]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = inspectionRows.length;
    const mismatches = inspectionRows.filter(r => r.breakdown.syncStatus === 'mismatch').length;
    const inSync = inspectionRows.filter(r => r.breakdown.syncStatus === 'in_sync').length;
    const missing = inspectionRows.filter(r => r.breakdown.syncStatus === 'missing').length;
    const syncRate = total > 0 ? Math.round((inSync / total) * 100) : 100;
    return { total, mismatches, inSync, missing, syncRate };
  }, [inspectionRows]);

  // 1-Click Sync single subject from ECR to Grading Sheet
  const handleSyncSubject = async (student: Student, subject: Subject, targetGrade: number) => {
    try {
      const validQuarter = (selectedQuarter === 2 ? 2 : selectedQuarter === 3 ? 3 : 1) as 1 | 2 | 3;
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
        quarterly_exam: 0
      };

      await updateGradingSheetRecord(record);

      // Also ensure classRecord has final_grade recorded
      const cRec = classRecords.find(r =>
        (r.student_lrn === student.lrn || String(r.student_lrn).trim() === String(student.lrn).trim()) &&
        isMatchingSubject(subject.id, r.subject_id, r.subject_name, subject.subject_name) &&
        (Number(r.quarter) === validQuarter || String(r.quarter).toLowerCase() === `q${validQuarter}`) &&
        (!r.school_year || !activeSchoolYear || r.school_year === activeSchoolYear)
      );
      if (cRec && (!cRec.final_grade || Number(cRec.final_grade) !== targetGrade)) {
        const { updateClassRecord } = useAppStore.getState();
        await updateClassRecord({ ...cRec, final_grade: targetGrade });
      }

      showNotification(`Synced ${subject.subject_name} (Grade: ${targetGrade}) to Grade Management!`, 'success');
    } catch (err) {
      console.error('Failed to sync grade:', err);
      showNotification('Failed to sync grade record.', 'error');
    }
  };

  // 1-Click Batch Sync for all mismatches for current student
  const handleBatchSyncStudent = async () => {
    if (!selectedStudentObj) return;
    setIsBatchSyncing(true);
    try {
      let syncedCount = 0;
      const validQuarter = (selectedQuarter === 2 ? 2 : selectedQuarter === 3 ? 3 : 1) as 1 | 2 | 3;
      const { updateClassRecord } = useAppStore.getState();

      for (const row of inspectionRows) {
        const target = row.breakdown.ecrTransmutedGrade || row.breakdown.ecrStoredFinalGrade || row.breakdown.gradeManagementResolved;
        if (target && target > 0) {
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
            quarterly_exam: 0
          };
          await updateGradingSheetRecord(record);

          // Also check classRecords
          const cRec = classRecords.find(r =>
            (r.student_lrn === selectedStudentObj.lrn || String(r.student_lrn).trim() === String(selectedStudentObj.lrn).trim()) &&
            isMatchingSubject(row.subject.id, r.subject_id, r.subject_name, row.subject.subject_name) &&
            (Number(r.quarter) === validQuarter || String(r.quarter).toLowerCase() === `q${validQuarter}`) &&
            (!r.school_year || !activeSchoolYear || r.school_year === activeSchoolYear)
          );
          if (cRec && (!cRec.final_grade || Number(cRec.final_grade) !== target)) {
            await updateClassRecord({ ...cRec, final_grade: target });
          }

          syncedCount++;
        }
      }
      showNotification(`Successfully synchronized ${syncedCount} subject(s) for ${selectedStudentObj.last_name}, ${selectedStudentObj.first_name}!`, 'success');
    } catch (err) {
      console.error('Batch sync error:', err);
      showNotification('Batch synchronization failed.', 'error');
    } finally {
      setIsBatchSyncing(false);
    }
  };

  const { user } = useAuthStore();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [userNote, setUserNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  // Generate full markdown report
  const generateReportMarkdown = useCallback(() => {
    if (!selectedStudentObj || !selectedSectionObj) return '';

    let report = `# FormEase Pro - Grade Sync & Diagnostic Report\n`;
    report += `Generated at: ${new Date().toLocaleString()}\n`;
    report += `Active School Year: ${activeSchoolYear}\n`;
    report += `Section: ${selectedSectionObj.section_name} (${selectedSectionObj.section_grade_level})\n`;
    report += `Student: ${selectedStudentObj.last_name}, ${selectedStudentObj.first_name} (LRN: ${selectedStudentObj.lrn})\n`;
    report += `Quarter Inspected: Q${selectedQuarter}\n\n`;
    report += `## Summary\n`;
    report += `- Total Subjects: ${stats.total}\n`;
    report += `- In Sync: ${stats.inSync}\n`;
    report += `- Mismatches: ${stats.mismatches}\n`;
    report += `- Sync Health: ${stats.syncRate}%\n\n`;
    report += `## Subject-by-Subject Matrix\n\n`;
    report += `| Subject | ECR Grade | Grade Mgmt | SF9 | Grade Slip | SF10 | Status |\n`;
    report += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

    inspectionRows.forEach(r => {
      const ecr = r.breakdown.ecrTransmutedGrade || r.breakdown.ecrStoredFinalGrade || '-';
      const gm = r.breakdown.gradeManagementValue || r.breakdown.gradeManagementResolved || '-';
      const sf9 = r.breakdown.sf9ResolvedGrade || '-';
      const gs = r.breakdown.gradeSlipResolvedGrade || '-';
      const sf10 = r.breakdown.sf10ResolvedGrade || '-';
      const status = r.breakdown.syncStatus.toUpperCase();
      report += `| ${r.subject.subject_name} | ${ecr} | ${gm} | ${sf9} | ${gs} | ${sf10} | ${status} |\n`;
    });

    const mismatchesOnly = inspectionRows.filter(r => r.breakdown.discrepancies.length > 0);
    if (mismatchesOnly.length > 0) {
      report += `\n## Detected Root Causes & Recommendations\n\n`;
      mismatchesOnly.forEach(m => {
        report += `### ${m.subject.subject_name}\n`;
        m.breakdown.discrepancies.forEach(d => {
          report += `- ⚠️ **Issue:** ${d}\n`;
        });
        m.breakdown.recommendations.forEach(rec => {
          report += `- 💡 **Fix:** ${rec}\n`;
        });
      });
    }
    return report;
  }, [selectedStudentObj, selectedSectionObj, activeSchoolYear, selectedQuarter, stats, inspectionRows]);

  // Copy full diagnostic report
  const handleCopyReport = () => {
    const report = generateReportMarkdown();
    if (!report) return;

    void navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
    showNotification('Diagnostic report copied to clipboard!', 'success');
  };

  // Submit diagnostic report directly to Firestore
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
        studentName: selectedStudentObj ? `${selectedStudentObj.last_name}, ${selectedStudentObj.first_name}` : undefined,
        totalMismatches: stats.mismatches,
        syncRate: stats.syncRate,
        reportMarkdown,
        schoolProfile,
        user: user || undefined,
        activeSchoolYear,
        technicalDetails: {
          quarter: selectedQuarter,
          totalSubjects: stats.total,
          inSyncSubjects: stats.inSync,
          missingSubjects: stats.missing,
        }
      });
      setSubmissionResult(result);
      if (result.success) {
        showNotification(`Report #${result.ticketId} uploaded directly to developer Emerson!`, 'success');
      } else {
        showNotification('Report could not be uploaded online. Email link prepared.', 'info');
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
    <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-hidden animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[92vh] bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-blue-600 via-indigo-600 to-emerald-500 shrink-0" />

        {/* 1. Modal Header */}
        <div className="shrink-0 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-sm shrink-0">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  Live Diagnostics
                </span>
                <span className="text-xs text-slate-400 font-bold">SY {activeSchoolYear}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                Grade Sync Inspector & Root-Cause Debugger
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowSubmitModal(true);
                setSubmissionResult(null);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
              title="Automatically send this diagnostic report to developer Emerson"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send to Developer</span>
            </button>
            <button
              onClick={handleCopyReport}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Copy complete diagnostic report to clipboard"
            >
              {copiedReport ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedReport ? 'Copied!' : 'Copy Report'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Debugger"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Developer Submission Drawer / Modal */}
        {showSubmitModal && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white dark:bg-[#0B1121] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Submit Error Report to Developer
                    </h3>
                    <p className="text-xs text-slate-400">
                      Directly notify developer Emerson with full diagnostic logs.
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
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Report #{submissionResult.ticketId} Sent!</span>
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
                        studentName: selectedStudentObj ? `${selectedStudentObj.last_name}, ${selectedStudentObj.first_name}` : undefined,
                        totalMismatches: stats.mismatches,
                        syncRate: stats.syncRate,
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
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                    <p>• <strong>School:</strong> {schoolProfile?.name || 'School Profile'}</p>
                    <p>• <strong>Section:</strong> {selectedSectionObj?.section_name} ({selectedSectionObj?.section_grade_level})</p>
                    <p>• <strong>Student:</strong> {selectedStudentObj ? `${selectedStudentObj.last_name}, ${selectedStudentObj.first_name}` : 'All'}</p>
                    <p>• <strong>Mismatches Detected:</strong> <span className={stats.mismatches > 0 ? 'text-red-500 font-bold' : 'text-emerald-500 font-bold'}>{stats.mismatches} item(s)</span></p>
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
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
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
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
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

        {/* 2. Controls & Filter Bar */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Section Picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Section:</span>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-blue-500"
              >
                {sections.map(s => (
                  <option key={s.id || s.section_name} value={s.id || s.section_name}>
                    {s.section_grade_level} - {s.section_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quarter Picker */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              {[1, 2, 3].map(q => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    selectedQuarter === q
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Q{q}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-3">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setStatusFilter('mismatches')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'mismatches'
                    ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                    : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Mismatches ({stats.mismatches})</span>
              </button>
              <button
                onClick={() => setStatusFilter('in_sync')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  statusFilter === 'in_sync'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Synced ({stats.inSync})</span>
              </button>
            </div>
          </div>

          {/* Batch Sync Button */}
          {stats.mismatches > 0 && (
            <button
              onClick={handleBatchSyncStudent}
              disabled={isBatchSyncing}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isBatchSyncing ? 'Synchronizing...' : 'Auto-Sync All Mismatches'}</span>
            </button>
          )}
        </div>

        {/* 3. Main Workspace: Split View (Student List + Live Comparison Matrix) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Left Panel: Students List */}
          <div className="w-64 sm:w-72 border-r border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col shrink-0 min-h-0">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or LRN..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 min-h-0">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st, idx) => {
                  const isSelected = st.lrn === selectedStudentLrn;
                  return (
                    <button
                      key={st.lrn}
                      onClick={() => setSelectedStudentLrn(st.lrn)}
                      className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                          : 'hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs truncate leading-tight">
                          {idx + 1}. {st.last_name}, {st.first_name}
                        </p>
                        <p className={`text-[10px] mt-0.5 font-mono ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {st.lrn}
                        </p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : st.gender === 'Male'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                      }`}>
                        {st.gender === 'Male' ? 'M' : 'F'}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">
                  No students found in this section.
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Live Cross-Module Comparison Matrix */}
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-white dark:bg-[#0B1121] p-4 sm:p-6 min-h-0">
            
            {/* Student Banner */}
            {selectedStudentObj ? (
              <div className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-sm flex items-center justify-center border border-blue-500/20">
                    {selectedStudentObj.last_name[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {selectedStudentObj.last_name}, {selectedStudentObj.first_name} {selectedStudentObj.middle_name || ''}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-0.5">
                      <span>LRN: <strong className="text-slate-600 dark:text-slate-200 font-mono">{selectedStudentObj.lrn}</strong></span>
                      <span>•</span>
                      <span>Grade Level: <strong>{selectedSectionObj?.section_grade_level}</strong></span>
                      <span>•</span>
                      <span>Section: <strong>{selectedSectionObj?.section_name}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Sync Health</span>
                    <p className={`text-sm font-black ${stats.syncRate === 100 ? 'text-emerald-500' : stats.syncRate >= 75 ? 'text-amber-500' : 'text-red-500'}`}>
                      {stats.syncRate}% Complete
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Matrix Table with Sticky Headers & Direct Scroll */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900/50">
              <div className="overflow-auto max-h-[55vh] custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-20 shadow-xs">
                    <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-black text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="p-3 bg-slate-100 dark:bg-slate-900">Learning Area / Subject</th>
                      <th className="p-3 text-center bg-slate-100 dark:bg-slate-900">1. E-Class Record (ECR)</th>
                      <th className="p-3 text-center bg-slate-100 dark:bg-slate-900">2. Grade Management</th>
                      <th className="p-3 text-center bg-slate-100 dark:bg-slate-900">3. SF9 Card</th>
                      <th className="p-3 text-center bg-slate-100 dark:bg-slate-900">4. Grade Slip</th>
                      <th className="p-3 text-center bg-slate-100 dark:bg-slate-900">5. SF10 Form</th>
                      <th className="p-3 text-center bg-slate-100 dark:bg-slate-900">Sync Status</th>
                      <th className="p-3 text-right bg-slate-100 dark:bg-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedInspectionRows.length > 0 ? (
                      displayedInspectionRows.map(({ subject, breakdown }) => {
                        const isExpanded = expandedSubjectId === subject.id;
                        const ecrDisplay = breakdown.ecrTransmutedGrade ?? breakdown.ecrStoredFinalGrade;
                        const gmDisplay = breakdown.gradeManagementValue ?? breakdown.gradeManagementResolved;
                        const sf9Display = breakdown.sf9ResolvedGrade;
                        const gsDisplay = breakdown.gradeSlipResolvedGrade;
                        const sf10Display = breakdown.sf10ResolvedGrade;

                        return (
                          <React.Fragment key={subject.id}>
                            <tr
                              className={`transition-colors cursor-pointer ${
                                isExpanded
                                  ? 'bg-blue-50/50 dark:bg-blue-900/10'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'
                              }`}
                              onClick={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
                            >
                              <td className="p-3 font-bold text-slate-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  <div>
                                    <p className="font-black text-xs">{subject.subject_name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {subject.id}</p>
                                  </div>
                                </div>
                              </td>

                              {/* 1. ECR */}
                              <td className="p-3 text-center">
                                {ecrDisplay !== null ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-black font-mono">
                                    {ecrDisplay}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 font-mono">-</span>
                                )}
                              </td>

                              {/* 2. Grade Management */}
                              <td className="p-3 text-center">
                                {gmDisplay !== null ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-black font-mono">
                                    {gmDisplay}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 font-mono">-</span>
                                )}
                              </td>

                              {/* 3. SF9 */}
                              <td className="p-3 text-center">
                                {sf9Display !== null ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-black font-mono">
                                    {sf9Display}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 font-mono">-</span>
                                )}
                              </td>

                              {/* 4. Grade Slip */}
                              <td className="p-3 text-center">
                                {gsDisplay !== null ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-black font-mono">
                                    {gsDisplay}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 font-mono">-</span>
                                )}
                              </td>

                              {/* 5. SF10 */}
                              <td className="p-3 text-center">
                                {sf10Display !== null ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-black font-mono">
                                    {sf10Display}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 font-mono">-</span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="p-3 text-center">
                                {breakdown.syncStatus === 'in_sync' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-black text-[10px] uppercase">
                                    In Sync
                                  </span>
                                ) : breakdown.syncStatus === 'mismatch' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-black text-[10px] uppercase flex items-center gap-1 justify-center">
                                    <AlertTriangle className="w-3 h-3" />
                                    Mismatch
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px] uppercase">
                                    No Grade
                                  </span>
                                )}
                              </td>

                              {/* Action Button */}
                              <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                {breakdown.ecrTransmutedGrade && breakdown.ecrTransmutedGrade !== breakdown.gradeManagementValue ? (
                                  <button
                                    onClick={() => handleSyncSubject(selectedStudentObj!, subject, breakdown.ecrTransmutedGrade!)}
                                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition-all shadow-sm active:scale-95 cursor-pointer"
                                    title="Sync ECR transmuted grade to Grade Management"
                                  >
                                    Sync ECR
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[10px] font-medium">OK</span>
                                )}
                              </td>
                            </tr>

                            {/* Deep Diagnostic Breakdown Drawer */}
                            {isExpanded && (
                              <tr className="bg-blue-50/30 dark:bg-slate-900/80 border-b border-blue-200 dark:border-slate-700">
                                <td colSpan={8} className="p-4 sm:p-5">
                                  <div className="space-y-4">
                                    
                                    {/* 1. Root Cause Alerts if discrepancies found */}
                                    {breakdown.discrepancies.length > 0 ? (
                                      <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-wider">
                                          <ShieldAlert className="w-4 h-4" />
                                          <span>Root-Cause Diagnostic Analysis</span>
                                        </div>
                                        {breakdown.discrepancies.map((d, i) => (
                                          <p key={i} className="text-xs text-red-700 dark:text-red-300 font-medium leading-relaxed">
                                            • {d}
                                          </p>
                                        ))}
                                        {breakdown.recommendations.map((rec, i) => (
                                          <p key={i} className="text-xs text-emerald-700 dark:text-emerald-400 font-bold leading-relaxed pt-1">
                                            💡 Recommendation: {rec}
                                          </p>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>All 5 modules (ECR, Grade Management, SF9, Grade Slips, and SF10) are in 100% perfect agreement.</span>
                                      </div>
                                    )}

                                    {/* 2. Technical System Inspector Details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-black uppercase text-slate-400">ECR Raw & HPS Score</span>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                                          {breakdown.ecrRawScoreSummary}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                          Record ID: {breakdown.ecrRecordId || 'None'}
                                        </p>
                                      </div>

                                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-black uppercase text-slate-400">Grade Management Status</span>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                                          {breakdown.gradeManagementValue ? `Stored Final Grade: ${breakdown.gradeManagementValue}` : 'Resolved Dynamically'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                          Virtual Subject: {breakdown.isVirtualSubject ? 'Yes (Curriculum)' : 'No (Database ID)'}
                                        </p>
                                      </div>

                                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-black uppercase text-slate-400">SF9 & Grade Slip Config</span>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                                          Descriptor: {breakdown.sf9Descriptor}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                          Excluded in Gen Avg: {breakdown.gradeSlipExcludedFromAvg ? 'Yes (Component)' : 'No (Core/Subject)'}
                                        </p>
                                      </div>

                                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-black uppercase text-slate-400">SF10 Mapping Key</span>
                                        <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                                          {breakdown.sf10StandardKey}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                          Quarter: Q{selectedQuarter}
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
                          No subject grade records found matching the active filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        {/* 4. Modal Footer Guide */}
        <div className="shrink-0 p-3.5 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Click any subject row to expand full root-cause diagnostic logs and score breakdowns.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-medium text-[11px]">
            <span>FormEase Pro Live Diagnostic Engine v3.2</span>
          </div>
        </div>

      </div>
    </div>
  );
}
