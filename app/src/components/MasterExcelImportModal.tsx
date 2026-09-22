import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Check,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import {
  parseGrade1MasterWorkbook,
  applyGrade1MasterImport,
  type CurrentGrade1Data,
  type Grade1MasterImportResult,
  type ImportDiffItem,
  type ImportStrategy,
  type ApplyImportResult
} from '../services/sf9-g1-excel-import';
import { assertSafeWorkbookFile } from '../utils/safe-workbook-reader';

interface MasterExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradeLevel: string;
  schoolYear: string;
  section: string;
  currentData: CurrentGrade1Data;
  onImportSuccess: (result: ApplyImportResult) => void;
}

type ModalStep = 'upload' | 'parsing' | 'preview' | 'applying' | 'success';

export const MasterExcelImportModal: React.FC<MasterExcelImportModalProps> = ({
  isOpen,
  onClose,
  gradeLevel,
  schoolYear,
  section,
  currentData,
  onImportSuccess
}) => {
  const [step, setStep] = useState<ModalStep>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [importResult, setImportResult] = useState<Grade1MasterImportResult | null>(null);
  const [strategy, setStrategy] = useState<ImportStrategy>('merge');
  const [activeTab, setActiveTab] = useState<'all' | 'pace' | 'remarks'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyImportResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setStep('upload');
    setFileName('');
    setImportResult(null);
    setStrategy('merge');
    setActiveTab('all');
    setSearchQuery('');
    setErrorMessage(null);
    setApplyResult(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileProcess = async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      setErrorMessage('Please select a valid Excel workbook (.xlsx file).');
      return;
    }

    try {
      assertSafeWorkbookFile(file);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Workbook could not be read safely.');
      return;
    }

    try {
      setStep('parsing');
      setFileName(file.name);
      setErrorMessage(null);

      const arrayBuffer = await file.arrayBuffer();
      const result = await parseGrade1MasterWorkbook(arrayBuffer, currentData);

      setImportResult(result);
      setStep('preview');
    } catch (err) {
      console.error('Error parsing Grade 1 Master Excel:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to parse Excel workbook. Please ensure it is a valid FormEase Grade 1 master workbook.');
      setStep('upload');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const filteredDiffs = useMemo(() => {
    if (!importResult) return [];

    return importResult.diffs.filter((d: ImportDiffItem) => {
      // Tab filter
      if (activeTab === 'pace' && d.category !== 'pace') return false;
      if (activeTab === 'remarks' && d.category !== 'remarks') return false;

      // Strategy filter
      if (strategy === 'fill_blanks' && d.oldValue) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = d.studentName.toLowerCase().includes(q);
        const matchesLrn = d.studentLrn.toLowerCase().includes(q);
        const matchesField = d.field.toLowerCase().includes(q);
        const matchesSubject = d.subject ? d.subject.toLowerCase().includes(q) : false;
        return matchesName || matchesLrn || matchesField || matchesSubject;
      }

      return true;
    });
  }, [importResult, activeTab, strategy, searchQuery]);

  const handleApply = async () => {
    if (!importResult) return;

    try {
      setStep('applying');
      const res = await applyGrade1MasterImport(importResult, strategy);
      setApplyResult(res);
      setStep('success');
      onImportSuccess(res);
    } catch (err) {
      console.error('Error applying import:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to apply imported changes.');
      setStep('preview');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-linear-to-r from-emerald-500/5 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white tracking-wide">
                  Import Master Excel (Two-Way Sync)
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                  {gradeLevel} • {section}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Sync offline edits from exported master workbook back into FormEase Pro.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center gap-3 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-emerald-500 dark:hover:border-emerald-500/80 rounded-2xl p-10 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-white/2 hover:bg-emerald-500/5 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Upload className="h-8 w-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  Drop your Master Excel workbook here, or <span className="text-emerald-600 dark:text-emerald-400 underline">browse</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
                  Upload the exported <span className="font-semibold text-slate-600 dark:text-slate-300">UPDATED [Grade 1] ECR, PACE Form, and SF9.xlsx</span> file after making edits offline.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <Info className="h-3.5 w-3.5" /> Supports PACE ratings (5 subjects) and SF9 remarks (Terms 1–3)
                </div>
              </div>

              {/* Guide / Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-white/2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <Sparkles className="h-4 w-4" />
                    <span>Visual Diff Inspection</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Every modified cell is compared side-by-side (old vs new) before any changes are saved.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-white/2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Flexible Merge Strategies</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Choose between Smart Merge (recommended), Fill Blanks Only, or Complete Overwrite.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-white/2">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Safe & Non-Destructive</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Export code remains locked. Only your ratings and remarks are updated seamlessly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PARSING */}
          {step === 'parsing' && (
            <div className="py-16 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <RefreshCw className="h-16 w-16 text-emerald-500 animate-spin" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-white">
                  Scanning & Comparing Master Workbook...
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Comparing Reading, Language, Math, GMRC, Makabansa ratings and SF9 remarks for {section}...
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & DIFFS */}
          {step === 'preview' && importResult && (
            <div className="space-y-5">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Changes</span>
                  <div className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">
                    {importResult.stats.totalChanges}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    in {fileName}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Learners Detected</span>
                  <div className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">
                    {importResult.stats.totalStudents}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {importResult.parsed.sectionName || section} ({schoolYear})
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PACE Ratings</span>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    +{importResult.stats.paceAdded} / ~{importResult.stats.paceModified}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {importResult.stats.paceAdded} added, {importResult.stats.paceModified} modified
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SF9 Remarks</span>
                  <div className="text-xl font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">
                    +{importResult.stats.remarksAdded} / ~{importResult.stats.remarksModified}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {importResult.stats.remarksAdded} added, {importResult.stats.remarksModified} modified
                  </span>
                </div>
              </div>

              {/* Strategy Selector */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-white/2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Import Strategy
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStrategy('merge')}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      strategy === 'merge'
                        ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white shadow-xs'
                        : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>Smart Merge (Recommended)</span>
                      {strategy === 'merge' && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Applies all additions and updates from Excel while keeping untouched local data intact.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStrategy('fill_blanks')}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      strategy === 'fill_blanks'
                        ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white shadow-xs'
                        : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>Fill Blanks Only</span>
                      {strategy === 'fill_blanks' && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Only fills in empty/blank cells in FormEase. Will not overwrite existing entries.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStrategy('overwrite')}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      strategy === 'overwrite'
                        ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white shadow-xs'
                        : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>Overwrite All</span>
                      {strategy === 'overwrite' && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Strict sync with Excel file. Overwrites existing records for all matched learners.
                    </p>
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'all'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    All Changes ({importResult.diffs.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('pace')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'pace'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    PACE Ratings ({importResult.stats.paceAdded + importResult.stats.paceModified})
                  </button>
                  <button
                    onClick={() => setActiveTab('remarks')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'remarks'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    SF9 Remarks ({importResult.stats.remarksAdded + importResult.stats.remarksModified})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search learner or field..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Diffs Table */}
              <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden bg-slate-50/20 max-h-90 overflow-y-auto">
                {filteredDiffs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    {importResult.diffs.length === 0
                      ? 'No differences detected. Your FormEase data is identical to the Excel file.'
                      : 'No matching differences found with current filters.'}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900/90 backdrop-blur-xs text-[10px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-200 dark:border-white/10">
                      <tr>
                        <th className="py-2.5 px-4">Learner</th>
                        <th className="py-2.5 px-4">Category & Field</th>
                        <th className="py-2.5 px-4">Current Value</th>
                        <th className="py-2.5 px-4">Incoming from Excel</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-white/5 text-xs">
                      {filteredDiffs.map((d: ImportDiffItem) => (
                        <tr key={d.id} className="hover:bg-slate-100/30 dark:hover:bg-white/2 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-100">
                            <div>{d.studentName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{d.studentLrn}</div>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 mr-1.5">
                              {d.category === 'pace' ? (d.subject || 'PACE') : 'SF9'}
                            </span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{d.field}</span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">
                            {d.oldValue ? (
                              <span className="line-through decoration-rose-400 text-slate-400">
                                {d.oldValue}
                              </span>
                            ) : (
                              <span className="text-slate-350 dark:text-slate-600 italic">(blank)</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/5">
                            <div className="flex items-center gap-1.5">
                              <ArrowRight className="h-3 w-3 text-emerald-500 shrink-0" />
                              <span>{d.newValue}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                d.changeType === 'added'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {d.changeType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: APPLYING */}
          {step === 'applying' && (
            <div className="py-16 text-center space-y-4">
              <RefreshCw className="h-16 w-16 mx-auto text-emerald-500 animate-spin" />
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-white">
                  Applying Changes to Database...
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Updating local storage records and synchronizing stores...
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: SUCCESS */}
          {step === 'success' && applyResult && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white">
                  Master Import Applied Successfully!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Updated <span className="font-bold text-emerald-600 dark:text-emerald-400">{applyResult.updatedPaceCount} PACE ratings</span> and{' '}
                  <span className="font-bold text-teal-600 dark:text-teal-400">{applyResult.updatedRemarksCount} SF9 remarks</span> in FormEase Pro.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-white/2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div>
            {step === 'preview' && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                ← Choose different file
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {step === 'success' ? 'Done' : 'Cancel'}
            </button>

            {step === 'preview' && (
              <button
                type="button"
                onClick={handleApply}
                disabled={filteredDiffs.length === 0}
                className={`px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                  filteredDiffs.length === 0
                    ? 'bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
              >
                Apply Changes ({filteredDiffs.length})
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
