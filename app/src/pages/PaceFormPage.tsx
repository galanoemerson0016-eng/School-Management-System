import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../stores';
import { useAuthStore } from '../stores/auth-store';
import { filterSF9Sections } from '../lib/rbac';
import { isGrade1 } from '../services/sf9-g1-excel-export';
import { PaceFormRenderer } from '../components/pace/PaceFormRenderer';
import { exportPaceToExcel } from '../services/sf9-pace-excel-export';
import { exportPaceLanguageToExcel } from '../services/sf9-pace-language-excel-export';
import { exportPaceMathToExcel } from '../services/sf9-pace-math-excel-export';
import { exportPaceGmrcMakabansaToExcel } from '../services/sf9-pace-gmrc-makabansa-excel-export';
import { PACE_DESCRIPTORS } from '../services/pace-template-config';
import type { PaceFormData, PaceRatingDescriptor, PaceDescriptorInfo } from '../types/pace';
import { formatLearnerName } from '../utils/student-name';
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  Save, 
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
  BookOpen,
  Languages,
  Calculator,
  HeartHandshake,
  Users,
  CheckCircle2
} from 'lucide-react';

export function PaceFormPage() {
  const user = useAuthStore((s) => s.user);
  const sections = useAppStore((s) => s.sections);
  const students = useAppStore((s) => s.students);
  const activeSchoolYear = useAppStore((s) => s.activeSchoolYear);
  const schoolProfile = useAppStore((s) => s.schoolProfile);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  // Form Type Selection: 'reading' | 'language' | 'math' | 'gmrc-makabansa'
  const [formType, setFormType] = useState<'reading' | 'language' | 'math' | 'gmrc-makabansa'>(() => {
    return (localStorage.getItem('formease_pace_active_form_type') as 'reading' | 'language' | 'math' | 'gmrc-makabansa') || 'reading';
  });

  const getStorageKey = (type: typeof formType) => {
    return type === 'gmrc-makabansa'
      ? 'formease_pace_gmrc_makabansa_ratings'
      : type === 'math' 
      ? 'formease_pace_math_ratings'
      : type === 'language' 
      ? 'formease_pace_language_ratings' 
      : 'formease_pace_reading_ratings';
  };

  const loadRatingsStore = (type: typeof formType): Record<string, PaceFormData> => {
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

  const handleFormTypeChange = (type: 'reading' | 'language' | 'math' | 'gmrc-makabansa') => {
    setFormType(type);
    localStorage.setItem('formease_pace_active_form_type', type);
    setRatingsStore(loadRatingsStore(type));
  };

  // GRADE 1 ONLY FILTER
  const grade1Sections = useMemo(() => {
    const rbacSections = filterSF9Sections(user, sections);
    return rbacSections.filter(s => isGrade1(s.section_grade_level));
  }, [user, sections]);

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedLrn, setSelectedLrn] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
    if (!selectedLrn) {
      return {
        lrn: '',
        studentName: '',
        gradeLevel: selectedSection?.section_grade_level || 'Grade 1',
        section: selectedSection?.section_name || '',
        schoolYear: activeSchoolYear,
        teacherName: schoolProfile.adviser_name || '',
        ratings: {}
      };
    }
    return ratingsStore[selectedLrn] || {
      lrn: selectedLrn,
      studentName: selectedStudent ? formatLearnerName(selectedStudent) : '',
      gradeLevel: selectedStudent?.grade_level || selectedSection?.section_grade_level || 'Grade 1',
      section: selectedSection?.section_name || '',
      schoolYear: activeSchoolYear,
      teacherName: schoolProfile.adviser_name || '',
      ratings: {}
    };
  }, [selectedLrn, selectedStudent, selectedSection, activeSchoolYear, schoolProfile, ratingsStore]);

  const setRating = (ratingId: string, term: 't1' | 't2' | 't3', value: PaceRatingDescriptor) => {
    if (!selectedLrn) return;
    const storageKey = getStorageKey(formType);
    setRatingsStore(prev => {
      const studentPace = prev[selectedLrn] || {
        lrn: selectedLrn,
        studentName: selectedStudent ? formatLearnerName(selectedStudent) : '',
        gradeLevel: selectedStudent?.grade_level || selectedSection?.section_grade_level || 'Grade 1',
        section: selectedSection?.section_name || '',
        schoolYear: activeSchoolYear,
        teacherName: schoolProfile.adviser_name || '',
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
  };

  const handleSave = () => {
    setIsSaving(true);
    const storageKey = getStorageKey(formType);
    localStorage.setItem(storageKey, JSON.stringify(ratingsStore));
    if (formType === 'reading') {
      localStorage.setItem('formease_pace_ratings', JSON.stringify(ratingsStore));
    }
    setTimeout(() => {
      setIsSaving(false);
      const formTitle = formType === 'gmrc-makabansa' 
        ? 'GMRC & MAKABANSA' 
        : formType === 'math' 
        ? 'Mathematics' 
        : formType === 'language' 
        ? 'Language' 
        : 'Reading & Literacy';
      setSaveMessage(`PACE Form (${formTitle}) ratings saved!`);
      setTimeout(() => setSaveMessage(null), 3000);
    }, 300);
  };

  const handleExcelExport = async () => {
    if (!selectedStudent || !selectedSection) return;
    const opts = {
      student: selectedStudent,
      schoolProfile,
      schoolYear: activeSchoolYear,
      section: selectedSection.section_name,
      adviser: selectedSection.adviser_name || schoolProfile.adviser_name || 'Class Adviser',
      principal: schoolProfile.head_name || 'School Principal',
      principalTitle: schoolProfile.head_position || 'School Principal',
      paceData: currentPaceData
    };

    if (formType === 'gmrc-makabansa') {
      await exportPaceGmrcMakabansaToExcel(opts);
    } else if (formType === 'math') {
      await exportPaceMathToExcel(opts);
    } else if (formType === 'language') {
      await exportPaceLanguageToExcel(opts);
    } else {
      await exportPaceToExcel(opts);
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
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 shadow-xs space-y-2.5">
        
        {/* ROW 1: Branding Header & Subject Segment Switcher */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          {/* Left Title & Grade 1 Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('school-forms')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 shadow-xs"
              title="Back to School Forms"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                PACE Form
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10.5px] font-black uppercase tracking-wider shadow-xs">
                Grade 1 Only
              </span>
            </div>
          </div>

          {/* Subject Switcher Segment Control */}
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner gap-1 text-xs font-bold flex-wrap">
            <button
              onClick={() => handleFormTypeChange('reading')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 font-bold ${
                formType === 'reading'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Reading & Literacy</span>
            </button>

            <button
              onClick={() => handleFormTypeChange('language')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 font-bold ${
                formType === 'language'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Languages className="w-4 h-4" />
              <span>Language</span>
            </button>

            <button
              onClick={() => handleFormTypeChange('math')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 font-bold ${
                formType === 'math'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Mathematics</span>
            </button>

            <button
              onClick={() => handleFormTypeChange('gmrc-makabansa')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 font-bold ${
                formType === 'gmrc-makabansa'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>GMRC & MAKABANSA</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Section Picker, Learner Navigator, and Primary Actions Toolbar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          
          {/* Section & Learner Navigation Control Group */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Section Picker Card */}
            <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
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
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <button
                onClick={handlePrevStudent}
                disabled={selectedStudentIndex <= 0}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition-colors"
                title="Previous Student"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                  {sectionStudents.length > 0 ? `${selectedStudentIndex + 1} of ${sectionStudents.length}` : '0'}
                </span>
                <select
                  value={selectedLrn}
                  onChange={(e) => setSelectedLrn(e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none max-w-72 truncate cursor-pointer"
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
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shadow-amber-500/20"
            >
              {isSaving ? <CheckCircle2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving...' : 'Save Ratings'}</span>
            </button>

            <button
              onClick={handleExcelExport}
              disabled={!selectedStudent}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shadow-emerald-600/20 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>

        </div>
      </div>

      {saveMessage && (
        <div className="bg-emerald-500 text-white text-xs font-bold text-center py-1.5 px-4 animate-fade-in shadow-xs">
          {saveMessage}
        </div>
      )}

      {/* Main Full-Width Workspace */}
      <div className="flex-1 w-full mx-auto p-4 space-y-3">
        {/* On-Form Editing Guide & Rating Key - Center Aligned */}
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

        {selectedStudent ? (
          /* Direct Interactive Document Form Workspace */
          <div className="bg-slate-200 dark:bg-slate-950 p-6 rounded-3xl overflow-auto custom-scrollbar shadow-inner flex justify-center w-full min-h-187.5">
            {selectedSection && (
              <PaceFormRenderer
                student={selectedStudent}
                schoolProfile={schoolProfile}
                schoolYear={activeSchoolYear}
                section={selectedSection.section_name}
                adviser={selectedSection.adviser_name || schoolProfile.adviser_name || 'Class Adviser'}
                paceData={currentPaceData}
                formType={formType}
                onSetRating={setRating}
                editable={true}
              />
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
            <p className="font-bold text-sm">No Grade 1 learners selected. Please choose a Grade 1 section and learner above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
