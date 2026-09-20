import { useState, useEffect } from 'react';
import { 
  Eye, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Users, 
  Layers, 
  FileText, 
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  GraduationCap,
  ClipboardList
} from 'lucide-react';
import { SnapshotPreviewService, type SnapshotPreviewMetadata } from '../services/SnapshotPreviewService';
import { useAppStore } from '../stores/app-store';

export function SnapshotPreviewBanner() {
  const [isPreview, setIsPreview] = useState(() => SnapshotPreviewService.isPreviewActive());
  const [metadata, setMetadata] = useState<SnapshotPreviewMetadata | null>(() => {
    if (SnapshotPreviewService.isPreviewActive()) {
      return SnapshotPreviewService.getPreviewMetadata();
    }
    return null;
  });
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const currentView = useAppStore(state => state.currentView);
  const setCurrentView = useAppStore(state => state.setCurrentView);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ active: boolean; metadata: SnapshotPreviewMetadata | null }>;
      if (customEvent.detail) {
        setIsPreview(customEvent.detail.active);
        setMetadata(customEvent.detail.metadata);
      } else {
        setIsPreview(SnapshotPreviewService.isPreviewActive());
        setMetadata(SnapshotPreviewService.getPreviewMetadata());
      }
    };
    window.addEventListener('formease_preview_changed', handler);
    return () => window.removeEventListener('formease_preview_changed', handler);
  }, []);

  if (!isPreview) {
    return null;
  }

  const handleExit = async () => {
    setIsProcessing(true);
    try {
      setShowExitConfirm(false);
      await SnapshotPreviewService.exitPreview();
    } catch (err) {
      alert('Error exiting preview mode: ' + err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitRestore = async () => {
    setIsProcessing(true);
    try {
      setShowRestoreConfirm(false);
      await SnapshotPreviewService.commitPreviewRestore();
    } catch (err) {
      alert('Error committing restore: ' + err);
    } finally {
      setIsProcessing(false);
    }
  };

  const navItems = [
    { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'sections', label: 'Sections', icon: Layers },
    { view: 'students', label: 'Students', icon: Users },
    { view: 'class-record', label: 'Class Record', icon: ClipboardList },
    { view: 'sf9', label: 'SF9 Card', icon: GraduationCap },
    { view: 'sf10', label: 'SF10 Record', icon: FileText },
    { view: 'attendance', label: 'Attendance', icon: Calendar },
  ];

  return (
    <>
      {/* Top Sticky Sandbox Notification Bar */}
      <div 
        className="w-full bg-linear-to-r from-amber-600 via-amber-700 to-orange-700 text-white shadow-lg border-b border-amber-400/30 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs relative z-40 print:hidden transition-all"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        {/* Left Side: Glowing Badge and Scope Info */}
        <div className="flex items-center flex-wrap gap-2.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25 border border-white/20 shadow-xs font-black tracking-wider text-[11px] uppercase shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300"></span>
            </span>
            <Eye className="w-3.5 h-3.5 text-amber-200" />
            <span>Snapshot Preview Sandbox</span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-100 font-semibold truncate">
            <span className="text-white font-black truncate max-w-48 sm:max-w-xs">{metadata?.title || 'Backup Snapshot'}</span>
            {metadata?.schoolYear && (
              <span className="px-2 py-0.5 rounded-md bg-white/15 text-white font-extrabold text-[10px] whitespace-nowrap">
                S.Y. {metadata.schoolYear}
              </span>
            )}
          </div>

          {/* Quick Metrics Chips */}
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/20 text-amber-100 text-[10px] font-bold">
              <Users className="w-2.5 h-2.5" />
              {metadata?.studentsCount ?? 0} Learners
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/20 text-amber-100 text-[10px] font-bold">
              <Layers className="w-2.5 h-2.5" />
              {metadata?.sectionsCount ?? 0} Sections
            </span>
            {(metadata?.gradesCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/20 text-amber-100 text-[10px] font-bold">
                <FileText className="w-2.5 h-2.5" />
                {metadata?.gradesCount} Grades
              </span>
            )}
          </div>
        </div>

        {/* Center: Quick Inspection Navigator */}
        <div className="hidden xl:flex items-center gap-1 bg-black/20 p-0.5 rounded-xl border border-white/10">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 px-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Test Page:
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-white text-amber-900 shadow-xs' 
                    : 'text-amber-100 hover:bg-white/15 hover:text-white'
                }`}
                title={`Test viewing ${item.label} in this snapshot`}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowExitConfirm(true)}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-xl bg-black/25 hover:bg-black/40 text-amber-100 hover:text-white border border-white/20 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Exit preview sandbox without changing your real active data"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close Preview</span>
          </button>

          <button
            onClick={() => setShowRestoreConfirm(true)}
            disabled={isProcessing}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 border border-emerald-300/40 cursor-pointer disabled:opacity-50"
            title="Permanently restore this verified snapshot into your active system"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Restore This Snapshot</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Exit Preview Without Restoring */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0E131F] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white">Exit Snapshot Preview?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Return to your live database</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/2 border border-slate-150 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
              <p>
                Closing the preview will discard this sandbox session and reload your <strong>current real data</strong> and active school year.
              </p>
              <p className="text-[11px] text-slate-400">
                🛡️ Your active database was never modified during preview.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Keep Exploring
              </button>
              <button
                onClick={handleExit}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                {isProcessing ? 'Closing Sandbox...' : 'Close & Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Commit Permanent Restore */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0E131F] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white">Restore Verified Snapshot?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Apply this snapshot to your permanent active database</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/2 border border-slate-150 dark:border-white/5 space-y-2 text-xs">
              <p className="text-slate-700 dark:text-slate-300 font-semibold">
                You have verified this snapshot in preview mode. Restoring will apply these records to your main database:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-medium text-slate-600 dark:text-slate-300">
                <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-150 dark:border-white/5">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">School Year</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">S.Y. {metadata?.schoolYear || 'Current'}</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-150 dark:border-white/5">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Learners</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{metadata?.studentsCount ?? 0} Enrolled</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-150 dark:border-white/5">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Sections</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{metadata?.sectionsCount ?? 0} Classes</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-150 dark:border-white/5">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Grades</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{metadata?.gradesCount ?? 0} Records</span>
                </div>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                🔒 A safety checkpoint of your current data will be automatically saved before restoring.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowRestoreConfirm(false)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCommitRestore}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-xs cursor-pointer shadow-md transition-all inline-flex items-center gap-1.5"
              >
                {isProcessing ? 'Restoring Snapshot...' : 'Yes, Restore Snapshot'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
