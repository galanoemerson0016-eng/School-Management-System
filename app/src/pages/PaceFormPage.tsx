import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/app-store';
import { useAuthStore } from '../stores/auth-store';
import { filterSF9Sections } from '../lib/rbac';
import { isGrade1 } from '../services/sf9-g1-excel-export';
import { SF9ExactDocument } from './SF9Page';
import { PaceFormRenderer } from '../components/pace/PaceFormRenderer';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { motion, AnimatePresence } from 'framer-motion';
import { exportGrade1AllInOneSectionMasterToExcel } from '../services/sf9-g1-excel-export';
import { computeStudentAttendance } from '../utils/sf9-attendance';
import { PACE_DESCRIPTORS } from '../services/pace-template-config';
import type { PaceFormData, PaceRatingDescriptor, PaceDescriptorInfo } from '../types/pace';
import { formatLearnerName } from '../utils/student-name';
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight, 
  MousePointerClick, 
  BookOpen, 
  Languages, 
  Calculator, 
  HeartHandshake, 
  Users, 
  CheckCircle2,
  FileText,
  Printer,
  Download,
  Loader2,
  Edit3,
  X
} from 'lucide-react';

export type PacePageFormType = 'reading' | 'language' | 'math' | 'gmrc-makabansa' | 'sf9';

export function PaceFormPage() {
  const user = useAuthStore((s) => s.user);
  const sections = useAppStore((s) => s.sections);
  const students = useAppStore((s) => s.students);
  const teachers = useAppStore((s) => s.teachers);
  const activeSchoolYear = useAppStore((s) => s.activeSchoolYear);
  const schoolProfile = useAppStore((s) => s.schoolProfile);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  const resolveAdviserName = useCallback((sec?: typeof selectedSection) => {
    const profileAdviser = (schoolProfile?.adviser_name || '').trim();
    if (!sec) {
      return profileAdviser || user?.displayName || '';
    }
    const fromSec = (sec.adviser_name || '').trim();
    const isMock = !fromSec || 
                   fromSec.toLowerCase().includes('maria') || 
                   fromSec.toLowerCase().includes('santos') || 
                   fromSec.toLowerCase().includes('juan') || 
                   fromSec.toLowerCase().includes('recovered') || 
                   fromSec.toLowerCase() === 'tba' ||
                   (sec.adviser_id?.startsWith('adv-') && !teachers?.some(t => t.uid === sec.adviser_id));

    if (isMock && profileAdviser && profileAdviser.toLowerCase() !== 'admin') {
      return profileAdviser;
    }

    if (fromSec && !isMock) return fromSec;

    const teacher = teachers?.find(t => t.uid === sec.adviser_id);
    if (teacher?.displayName) return teacher.displayName;

    if (user?.role === 'teacher' && (user.uid === sec.adviser_id || (!sec.adviser_id && !sec.adviser_name))) {
      return user.displayName || '';
    }
    return profileAdviser || user?.displayName || '';
  }, [schoolProfile?.adviser_name, user?.displayName, user?.role, user?.uid, teachers]);

  // Form Type Selection: 'reading' | 'language' | 'math' | 'gmrc-makabansa' | 'sf9'
  const [formType, setFormType] = useState<PacePageFormType>(() => {
    return (localStorage.getItem('formease_pace_active_form_type') as PacePageFormType) || 'reading';
  });

  const getStorageKey = (type: PacePageFormType) => {
    return type === 'gmrc-makabansa'
      ? 'formease_pace_gmrc_makabansa_ratings'
      : type === 'math' 
      ? 'formease_pace_math_ratings'
      : type === 'language' 
      ? 'formease_pace_language_ratings' 
      : 'formease_pace_reading_ratings';
  };

  const loadRatingsStore = (type: PacePageFormType): Record<string, PaceFormData> => {
    if (type === 'sf9') return {};
    const key = getStorageKey(type);
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
    if (type === 'reading') {
      const legacy = localStorage.getItem('formease_pace_ratings');
      if (legacy) return JSON.parse(legacy);
    }
    return {};
  };

  const [ratingsStore, setRatingsStore] = useState<Record<string, PaceFormData>>(() => loadRatingsStore(formType));

  const handleFormTypeChange = (type: PacePageFormType) => {
    setFormType(type);
    localStorage.setItem('formease_pace_active_form_type', type);
    if (type !== 'sf9') {
      setRatingsStore(loadRatingsStore(type));
    }
  };

  // GRADE 1 ONLY FILTER
  const grade1Sections = useMemo(() => {
    const rbacSections = filterSF9Sections(user, sections);
    return rbacSections.filter(s => isGrade1(s.section_grade_level));
  }, [user, sections]);

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedLrn, setSelectedLrn] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-select first Grade 1 section
  useEffect(() => {
    if (!selectedSectionId && grade1Sections.length > 0) {
      const firstId = grade1Sections[0].id;
      setTimeout(() => setSelectedSectionId(firstId), 0);
    }
  }, [grade1Sections, selectedSectionId]);

  const selectedSection = useMemo(() => {
    return sections.find(s => s.id === selectedSectionId || s.section_name === selectedSectionId);
  }, [sections, selectedSectionId]);

  // Male first, Female second, alphabetically arranged by Last Name, First Name (No LRN)
  const sectionStudents = useMemo(() => {
    if (!selectedSection) return [];
    const filtered = students.filter(s =>
      s.student_section === selectedSection.id ||
      s.student_section === selectedSection.section_name
    );

    const isMale = (s: typeof students[0]) => {
      const g = (s.gender || '').toUpperCase();
      return g === 'MALE' || g === 'M';
    };

    const sortFn = (a: typeof students[0], b: typeof students[0]) => {
      const lastA = (a.last_name || '').toUpperCase();
      const lastB = (b.last_name || '').toUpperCase();
      if (lastA !== lastB) return lastA.localeCompare(lastB);
      return (a.first_name || '').toUpperCase().localeCompare((b.first_name || '').toUpperCase());
    };

    const males = filtered.filter(isMale).sort(sortFn);
    const females = filtered.filter(s => !isMale(s)).sort(sortFn);

    return [...males, ...females];
  }, [students, selectedSection]);

  // Auto-select first student when section changes
  useEffect(() => {
    if (sectionStudents.length > 0) {
      if (!selectedLrn || !sectionStudents.some(s => s.lrn === selectedLrn)) {
        const firstLrn = sectionStudents[0].lrn;
        setTimeout(() => setSelectedLrn(firstLrn), 0);
      }
    } else {
      setTimeout(() => setSelectedLrn(''), 0);
    }
  }, [sectionStudents, selectedLrn]);

  const selectedStudentIndex = useMemo(() => {
    return sectionStudents.findIndex(s => s.lrn === selectedLrn);
  }, [sectionStudents, selectedLrn]);

  const selectedStudent = useMemo(() => {
    return students.find(s => s.lrn === selectedLrn);
  }, [students, selectedLrn]);

  const currentPaceData: PaceFormData = useMemo(() => {
    const resolvedTeacher = resolveAdviserName(selectedSection) || schoolProfile.adviser_name || '';
    if (!selectedLrn) {
      return {
        lrn: '',
        studentName: '',
        gradeLevel: selectedSection?.section_grade_level || 'Grade 1',
        section: selectedSection?.section_name || '',
        schoolYear: activeSchoolYear,
        teacherName: resolvedTeacher,
        ratings: {}
      };
    }
    return ratingsStore[selectedLrn] || {
      lrn: selectedLrn,
      studentName: selectedStudent ? formatLearnerName(selectedStudent) : '',
      gradeLevel: selectedStudent?.grade_level || selectedSection?.section_grade_level || 'Grade 1',
      section: selectedSection?.section_name || '',
      schoolYear: activeSchoolYear,
      teacherName: resolvedTeacher,
      ratings: {}
    };
  }, [selectedLrn, selectedStudent, selectedSection, activeSchoolYear, schoolProfile, ratingsStore, resolveAdviserName]);

  const setRating = (ratingId: string, term: 't1' | 't2' | 't3', value: PaceRatingDescriptor) => {
    if (!selectedLrn) return;
    setIsSaving(true);
    const storageKey = getStorageKey(formType);
    const resolvedTeacher = resolveAdviserName(selectedSection) || schoolProfile.adviser_name || '';
    setRatingsStore(prev => {
      const studentPace = prev[selectedLrn] || {
        lrn: selectedLrn,
        studentName: selectedStudent ? formatLearnerName(selectedStudent) : '',
        gradeLevel: selectedStudent?.grade_level || selectedSection?.section_grade_level || 'Grade 1',
        section: selectedSection?.section_name || '',
        schoolYear: activeSchoolYear,
        teacherName: resolvedTeacher,
        ratings: {}
      };

      const compRating = studentPace.ratings[ratingId] || {};
      const updatedCompRating = { ...compRating, [term]: value };

      const updatedPace = {
        ...studentPace,
        ratings: {
          ...studentPace.ratings,
          [ratingId]: updatedCompRating
        }
      };

      const updatedStore = { ...prev, [selectedLrn]: updatedPace };
      localStorage.setItem(storageKey, JSON.stringify(updatedStore));
      if (formType === 'reading') {
        localStorage.setItem('formease_pace_ratings', JSON.stringify(updatedStore));
      }
      return updatedStore;
    });

    setTimeout(() => {
      setIsSaving(false);
    }, 300);
  };

  const getPaceRatingsForStudent = (sLrn: string) => {
    try {
      const reading = JSON.parse(localStorage.getItem('formease_pace_reading_ratings') || localStorage.getItem('formease_pace_ratings') || '{}');
      const language = JSON.parse(localStorage.getItem('formease_pace_language_ratings') || '{}');
      const math = JSON.parse(localStorage.getItem('formease_pace_math_ratings') || '{}');
      const gmrcMakabansa = JSON.parse(localStorage.getItem('formease_pace_gmrc_makabansa_ratings') || '{}');

      return {
        reading: reading[sLrn]?.ratings || {},
        language: language[sLrn]?.ratings || {},
        math: math[sLrn]?.ratings || {},
        gmrcMakabansa: gmrcMakabansa[sLrn]?.ratings || {},
      };
    } catch {
      return undefined;
    }
  };

  const getG1RemarksForStudent = useCallback((sLrn: string) => {
    try {
      const stored = localStorage.getItem(`g1_remarks_${sLrn}_${activeSchoolYear}`);
      return stored ? JSON.parse(stored) : undefined;
    } catch {
      return undefined;
    }
  }, [activeSchoolYear]);

  interface G1RemarksData {
    term1CanDo?: string;
    term1ToImprove?: string;
    term2CanDo?: string;
    term2ToImprove?: string;
    term3CanDo?: string;
    term3ToImprove?: string;
  }

  const [g1RemarksState, setG1RemarksState] = useState<G1RemarksData>(() => {
    return selectedStudent ? getG1RemarksForStudent(selectedStudent.lrn) || {} : {};
  });
  const [isG1ModalOpen, setIsG1ModalOpen] = useState(false);
  const [tempG1Remarks, setTempG1Remarks] = useState<G1RemarksData>(g1RemarksState);

  useEffect(() => {
    if (selectedStudent) {
      const r = getG1RemarksForStudent(selectedStudent.lrn) || {};
      setG1RemarksState(r);
      setTempG1Remarks(r);
    } else {
      setG1RemarksState({});
      setTempG1Remarks({});
    }
  }, [selectedStudent, activeSchoolYear, getG1RemarksForStudent]);

  const handleSaveG1Progress = () => {
    setG1RemarksState(tempG1Remarks);
    if (selectedStudent) {
      localStorage.setItem(`g1_remarks_${selectedStudent.lrn}_${activeSchoolYear}`, JSON.stringify(tempG1Remarks));
    }
    setIsG1ModalOpen(false);
  };

  const getStudentAttendance = useCallback((st: (typeof sectionStudents)[0]) => {
    if (!selectedSection) return undefined;
    return computeStudentAttendance(
      st,
      useAppStore.getState().sf2Sheets || [],
      activeSchoolYear,
      selectedSection,
      useAppStore.getState().attendanceRecords || []
    );
  }, [selectedSection, activeSchoolYear]);

  const singleDocument = useMemo(() => {
    if (!selectedStudent || !selectedSection) return null;
    const attendance = getStudentAttendance(selectedStudent) || {
      months: ['JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'TOTAL'],
      schoolDays: [],
      daysPresent: [],
      daysAbsent: []
    };

    const resolvedSectionName = selectedSection.section_name || '';

    return (
      <SF9ExactDocument
        student={selectedStudent}
        schoolName={schoolProfile.name}
        schoolYear={activeSchoolYear}
        section={resolvedSectionName}
        region={schoolProfile.region}
        division={schoolProfile.division}
        district={schoolProfile.district}
        adviser={resolveAdviserName(selectedSection)}
        principal={schoolProfile.head_name || ''}
        principalTitle={schoolProfile.head_position || 'School Head'}
        grades={{}}
        subjects={[]}
        observedValues={{}}
        comments={['', '', '']}
        g1Remarks={g1RemarksState}
        attendance={attendance}
        pageSize="A4"
        logoUrl={schoolProfile.logo_url || ''}
        schoolProfile={schoolProfile}
        printMode="full"
        showAdviserSig={true}
        showHeadSig={true}
        adviserSigWidth={60}
        adviserSigHeight={18}
        adviserSigOffset={10}
        headSigWidth={60}
        headSigHeight={18}
        headSigOffset={10}
        hideLearnerInfo={false}
        hideAttendance={false}
        hideGrades={false}
        hideAdviserName={false}
        hideHeadName={false}
      />
    );
  }, [selectedStudent, selectedSection, schoolProfile, activeSchoolYear, g1RemarksState, resolveAdviserName, getStudentAttendance]);

  const handlePrint = async () => {
    if (!selectedStudent || !singleDocument) return;
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(singleDocument).toBlob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.focus();
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      } else {
        alert('Could not open print window. Please check if popups are blocked.');
      }
    } catch (err) {
      console.error('Print failed:', err);
      useAppStore.getState().showNotification('Failed to generate print document: ' + (err as Error).message, 'error');
    }
  };


  const handleSectionMasterExcelExport = async () => {
    if (!selectedSection || sectionStudents.length === 0) return;
    try {
      const baseStudent = selectedStudent || sectionStudents[0];
      const attendance = getStudentAttendance(baseStudent);
      const resolvedAdviser = resolveAdviserName(selectedSection);
      const resolvedSectionName = selectedSection.section_name || selectedSection.id || '';

      const opts = {
        student: baseStudent,
        schoolProfile,
        schoolYear: activeSchoolYear,
        section: resolvedSectionName,
        gradeLevel: selectedSection.section_grade_level || 'Grade 1',
        adviser: resolvedAdviser,
        principal: schoolProfile.head_name || '',
        principalTitle: schoolProfile.head_position || 'School Principal',
        attendance,
        g1Remarks: getG1RemarksForStudent(baseStudent.lrn),
        paceRatings: getPaceRatingsForStudent(baseStudent.lrn),
        sectionStudents,
        getStudentRemarks: getG1RemarksForStudent,
        getStudentAttendance,
        getStudentPaceRatings: getPaceRatingsForStudent,
      };

      await exportGrade1AllInOneSectionMasterToExcel(opts);
      useAppStore.getState().showNotification('All-In-One Master Workbook (.xlsx) exported successfully!', 'success');
    } catch (err) {
      console.error('Failed to export section master workbook:', err);
      useAppStore.getState().showNotification('Export failed: ' + (err as Error).message, 'error');
    }
  };

  const handlePrevStudent = () => {
    if (selectedStudentIndex > 0) {
      setSelectedLrn(sectionStudents[selectedStudentIndex - 1].lrn);
    }
  };

  const handleNextStudent = () => {
    if (selectedStudentIndex < sectionStudents.length - 1) {
      setSelectedLrn(sectionStudents[selectedStudentIndex + 1].lrn);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white flex flex-col font-sans">
      {/* Modern Redesigned Top Header Bar */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-3.5 py-2 shadow-xs space-y-2">
        
        {/* ROW 1: Branding Header & Subject Segment Switcher */}
        <div className="w-full flex items-center justify-between gap-2.5">
          {/* Left Title & Grade 1 Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setCurrentView('school-forms')}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 shadow-xs"
              title="Back to School Forms"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                PACE Form
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider shadow-xs">
                Grade 1 Only
              </span>
            </div>
          </div>

          {/* Subject Switcher Segment Control */}
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-0.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner gap-0.5 text-[11px] font-bold overflow-x-auto custom-scrollbar shrink-0">
            <button
              onClick={() => handleFormTypeChange('reading')}
              className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 font-bold ${
                formType === 'reading'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reading & Literacy</span>
            </button>

            <button
              onClick={() => handleFormTypeChange('language')}
              className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 font-bold ${
                formType === 'language'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Language</span>
            </button>

            <button
              onClick={() => handleFormTypeChange('math')}
              className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 font-bold ${
                formType === 'math'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Mathematics</span>
            </button>

            <button
              onClick={() => handleFormTypeChange('gmrc-makabansa')}
              className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 font-bold ${
                formType === 'gmrc-makabansa'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>GMRC & MAKABANSA</span>
            </button>

            <button
              onClick={() => handleFormTypeChange('sf9')}
              className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 font-bold ${
                formType === 'sf9'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>School Form 9 (SF9)</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Section Picker, Learner Navigator, and Primary Actions Toolbar */}
        <div className="w-full flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto custom-scrollbar">
          
          {/* Section & Learner Navigation Control Group */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Section Picker Card */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
              >
                {grade1Sections.length === 0 ? (
                  <option value="">No Grade 1 Sections</option>
                ) : (
                  grade1Sections.map(s => (
                    <option key={s.id} value={s.id} className="dark:bg-slate-900">
                      {s.section_grade_level} - {s.section_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Learner Roster Selector Card with Prev/Next Buttons */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <button
                onClick={handlePrevStudent}
                disabled={selectedStudentIndex <= 0}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition-colors"
                title="Previous Student"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5 px-1.5">
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9.5px] font-black shrink-0">
                  {sectionStudents.length > 0 ? `${selectedStudentIndex + 1} of ${sectionStudents.length}` : '0'}
                </span>
                <select
                  value={selectedLrn}
                  onChange={(e) => setSelectedLrn(e.target.value)}
                  className="bg-transparent text-[11px] font-bold text-slate-900 dark:text-white focus:outline-none max-w-36 sm:max-w-44 md:max-w-56 lg:max-w-64 truncate cursor-pointer"
                >
                  {sectionStudents.length === 0 ? (
                    <option value="">No Students Enrolled</option>
                  ) : (
                    sectionStudents.map((s, idx) => (
                      <option key={s.lrn} value={s.lrn} className="dark:bg-slate-900">
                        {idx + 1}. {formatLearnerName(s).toUpperCase()}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                onClick={handleNextStudent}
                disabled={selectedStudentIndex < 0 || selectedStudentIndex >= sectionStudents.length - 1}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition-colors"
                title="Next Student"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Auto-Save Status Badge */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-bold shadow-xs transition-all shrink-0">
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  <span>Auto-saved</span>
                </>
              )}
            </div>

            {formType === 'sf9' && (
              <>
                <button
                  onClick={() => {
                    setTempG1Remarks(g1RemarksState);
                    setIsG1ModalOpen(true);
                  }}
                  disabled={!selectedStudent}
                  className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs shadow-purple-500/20 disabled:opacity-50 shrink-0"
                  title="Edit Grade 1 Learner Progress"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Progress</span>
                </button>

                <button
                  onClick={handlePrint}
                  disabled={!selectedStudent || !singleDocument}
                  className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs shadow-blue-500/20 disabled:opacity-50 shrink-0"
                  title="Print official Grade 1 SF9"
                >
                  <Printer className="w-3 h-3" />
                  <span>Print SF9</span>
                </button>

                {singleDocument && (
                  <PDFDownloadLink
                    document={singleDocument}
                    fileName={`SF9_${selectedSection?.section_name || 'Record'}_${selectedStudent?.last_name || 'Student'}_${activeSchoolYear}.pdf`}
                    className="px-2.5 py-1 rounded-xl bg-slate-700 hover:bg-slate-800 active:scale-95 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs disabled:opacity-50 shrink-0"
                    title="Download Grade 1 SF9 PDF"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download PDF</span>
                  </PDFDownloadLink>
                )}
              </>
            )}

            <button
              onClick={handleSectionMasterExcelExport}
              disabled={sectionStudents.length === 0}
              className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-xs shadow-indigo-600/20 disabled:opacity-50 shrink-0"
              title="Export official DepEd 17-sheet unified master workbook with all section learners, ECRs, attendance, and PACE forms"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-200" />
              <span>Export Master (.xlsx)</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Full-Width Workspace */}
      <div className="flex-1 w-full mx-auto p-4 space-y-3">
        {formType === 'sf9' ? (
          <div className="bg-indigo-500/10 border border-indigo-500/30 p-2.5 px-4 rounded-2xl flex flex-col items-center justify-center text-center gap-1 text-xs">
            <div className="flex items-center justify-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold">
              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                Grade 1 School Form 9 (Learner's Progress Report Card)
              </span>
            </div>
            <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 font-medium">
              Official DepEd Grade 1 Learner Progress Report Card. Click 'Progress' to edit qualitative remarks for Terms 1, 2, and 3. Attendance is automatically synchronized.
            </p>
          </div>
        ) : (
          /* On-Form Editing Guide & Rating Key - Center Aligned */
          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 px-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 text-xs">
            <div className="flex items-center justify-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
              <MousePointerClick className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Type rating letters (A, B, C, D, E) directly into any rating cell on the {
                  formType === 'gmrc-makabansa' ? 'GMRC & MAKABANSA' : formType === 'math' ? 'Mathematics' : formType === 'language' ? 'Language' : 'Reading & Literacy'
                } form below.
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PACE_DESCRIPTORS.map((desc: PaceDescriptorInfo) => (
                <span key={desc.code} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-black">
                  <strong className="text-amber-500 mr-1">{desc.code}:</strong> {desc.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {selectedStudent ? (
          /* Direct Interactive Document Form Workspace */
          <div className="w-full flex justify-center">
            {selectedSection && (
              formType === 'sf9' ? (
                <div className="w-full h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
                  {singleDocument ? (
                    <PDFViewer
                      key={`${selectedStudent.lrn}_${selectedSection.id || ''}_${activeSchoolYear}`}
                      width="100%"
                      height="100%"
                      showToolbar={false}
                      className="border-none w-full h-full flex-1"
                    >
                      {singleDocument}
                    </PDFViewer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 font-bold">
                      Loading Grade 1 SF9 Document...
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-200 dark:bg-slate-950 p-6 rounded-3xl overflow-auto custom-scrollbar shadow-inner flex justify-center w-full min-h-187.5">
                  <PaceFormRenderer
                    student={selectedStudent}
                    schoolProfile={schoolProfile}
                    schoolYear={activeSchoolYear}
                    section={selectedSection.section_name}
                    adviser={resolveAdviserName(selectedSection)}
                    paceData={currentPaceData}
                    formType={formType}
                    onSetRating={setRating}
                    editable={true}
                  />
                </div>
              )
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
            <p className="font-bold text-sm">No Grade 1 learners selected. Please choose a Grade 1 section and learner above.</p>
          </div>
        )}
      </div>

      {/* Grade 1 Learner Progress Modal (Exact from SF9Page) */}
      <AnimatePresence>
        {isG1ModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Grade 1 Learner Progress</h3>
                    <p className="text-xs font-semibold text-slate-500">{selectedStudent ? formatLearnerName(selectedStudent) : ''} — Progress Notes for Terms 1, 2, & 3</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsG1ModalOpen(false)} 
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { termNum: 1, title: 'TERM 1 (UNANG TERMINO)', canDoKey: 'term1CanDo', toImproveKey: 'term1ToImprove' },
                  { termNum: 2, title: 'TERM 2 (IKALAWANG TERMINO)', canDoKey: 'term2CanDo', toImproveKey: 'term2ToImprove' },
                  { termNum: 3, title: 'TERM 3 (IKATLONG TERMINO)', canDoKey: 'term3CanDo', toImproveKey: 'term3ToImprove' }
                ].map((t) => (
                  <div key={t.termNum} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                    <h4 className="text-xs font-black uppercase text-purple-700 dark:text-purple-400 tracking-wider">{t.title}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          What Your Child Can Do (Mga Nagagawa)
                        </label>
                        <textarea
                          value={tempG1Remarks[t.canDoKey as keyof typeof tempG1Remarks] || ''}
                          onChange={(e) => setTempG1Remarks(prev => ({ ...prev, [t.canDoKey]: e.target.value }))}
                          rows={3}
                          placeholder="Enter learner's achievements and progress..."
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          What Your Child Is Learning to Improve (Dapat Linangin)
                        </label>
                        <textarea
                          value={tempG1Remarks[t.toImproveKey as keyof typeof tempG1Remarks] || ''}
                          onChange={(e) => setTempG1Remarks(prev => ({ ...prev, [t.toImproveKey]: e.target.value }))}
                          rows={3}
                          placeholder="Enter skills and areas needing guidance..."
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setIsG1ModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveG1Progress}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-500/20 active:scale-95 transition-all"
                >
                  Save Progress
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
