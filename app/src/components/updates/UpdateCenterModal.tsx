import { useUpdateStore } from '../../stores/update-store';
import { Shield, CheckCircle, XCircle, Loader2, ArrowRight, Download, RefreshCw, X, ExternalLink } from 'lucide-react';

export function UpdateCenterModal() {
  const { 
    updateAvailable, 
    updateInfo, 
    updateStep, 
    checklist, 
    downloadProgress, 
    errorMessage, 
    runPreUpdatePipeline, 
    startDownload, 
    applyUpdate,
    checkForUpdates
  } = useUpdateStore();

  if (!updateAvailable || updateStep === 'idle' || updateStep === 'checking') return null;

  const getStatusIcon = (status: 'pending' | 'success' | 'failed') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
      default:
        return <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />;
    }
  };

  const isMac = (window.electronAPI?.platform === 'darwin') || (typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac'));

  const handleStartUpdate = async () => {
    const passed = await runPreUpdatePipeline();
    if (passed) {
      if (isMac) {
        // Open macOS DMG release download URL directly in browser
        window.open('https://github.com/galanoemerson0016-eng/FormEase-Releases/releases/latest', '_blank');
        useUpdateStore.setState({ updateStep: 'idle' });
      } else {
        await startDownload();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-100 p-4 animate-in fade-in duration-300">
      <div className="relative bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Close Button */}
        {(updateStep === 'ready-to-start' || updateStep === 'failed') && (
          <button
            onClick={() => useUpdateStore.setState({ updateStep: 'idle' })}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer z-50 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {/* Banner header */}
        <div className="bg-linear-to-r from-indigo-600 via-blue-600 to-indigo-700 p-6 text-white text-center shrink-0">
          <Shield className="w-12 h-12 mx-auto mb-3 text-white/95 drop-shadow-md animate-pulse" />
          <h2 className="text-xl font-black uppercase tracking-wider">FormEase Update Center</h2>
          <p className="text-xs text-blue-100/80 font-medium mt-1">Guaranteed Data Protection & Integrity</p>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Release version info */}
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/5 rounded-2xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Target Version</span>
              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs px-2.5 py-1 rounded-full uppercase">
                v{updateInfo?.version} {isMac ? '(macOS)' : ''}
              </span>
            </div>
            {updateInfo?.notes && updateInfo.notes.length > 0 && (
              <div className="mt-3 border-t border-slate-200/50 dark:border-white/5 pt-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">What's New:</p>
                <ul className="text-xs text-slate-600 dark:text-gray-300 space-y-1 list-disc list-inside font-medium leading-relaxed">
                  {updateInfo.notes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Core Pipeline UI */}
          {updateStep === 'ready-to-start' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-slate-600 dark:text-gray-400 font-medium leading-relaxed">
                {isMac 
                  ? 'A new macOS version is available! FormEase will run a quick backup check, then launch the 1-click DMG installer download in your browser.'
                  : 'A critical application update is ready. Before downloading, FormEase will run a system validation check and create an automatic full backup to local storage.'}
              </p>

              {isMac && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-left space-y-1 text-xs text-amber-800 dark:text-amber-300 font-medium">
                  <p className="font-bold text-amber-900 dark:text-amber-200">🍏 macOS 2-Step Install Guide:</p>
                  <p>1. Tap <b>Download macOS Update (.dmg)</b> below.</p>
                  <p>2. Open the downloaded <b>.dmg</b> file and drag <b>FormEase Pro</b> into <b>Applications</b> to complete the update.</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleStartUpdate}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[13px] uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isMac ? '🍏 Download macOS Update (.dmg)' : 'Start Update'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => useUpdateStore.setState({ updateStep: 'idle' })}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-black text-[13px] uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>
          )}

          {/* Validation checklist status */}
          {(updateStep === 'health-checks' || updateStep === 'backup' || updateStep === 'simulation' || updateStep === 'downloading' || updateStep === 'ready-to-install') && (
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pre-Update Health Checklist</h3>
              <div className="space-y-3 bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
                {/* DB check */}
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-gray-300">✓ Database Connection & Integrity</span>
                  {getStatusIcon(checklist.dbAccess)}
                </div>
                {/* Disk Space check */}
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-gray-300">✓ Required Disk Space Verification (&gt;100MB)</span>
                  {getStatusIcon(checklist.diskSpace)}
                </div>
                {/* Network check */}
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-gray-300">✓ Network Connection Availability</span>
                  {getStatusIcon(checklist.network)}
                </div>
                {/* Backup check */}
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-gray-300">✓ Automatic Full Database Backup</span>
                  {getStatusIcon(checklist.backup)}
                </div>
                {/* Simulation check */}
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-gray-300">✓ Database Model Migration Simulation</span>
                  {getStatusIcon(checklist.simulation)}
                </div>
              </div>

              {/* Downloading block */}
              {updateStep === 'downloading' && (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 animate-bounce" />
                      Downloading Package
                    </span>
                    <span className="font-mono font-bold text-slate-500 tabular-nums">
                      {downloadProgress.percent}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${downloadProgress.percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                    <span>{downloadProgress.transferredMB} MB / {downloadProgress.totalMB} MB</span>
                    <span>Speed: {downloadProgress.speedMB} MB/s</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Complete ready to apply block */}
          {updateStep === 'ready-to-install' && (
            <div className="space-y-4 text-center animate-in zoom-in-95 duration-200">
              <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 drop-shadow-sm" />
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-sm">Download Complete</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-medium max-w-xs mx-auto leading-relaxed">
                  All validation checks have passed and data is safely backed up. FormEase Pro needs to restart to complete the installation.
                </p>
              </div>
              <button
                onClick={applyUpdate}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[13px] uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Apply Update & Restart
              </button>
            </div>
          )}

          {/* Failure block */}
          {updateStep === 'failed' && (
            <div className="space-y-5 text-center animate-in zoom-in-95 duration-200">
              <XCircle className="w-12 h-12 mx-auto text-red-500 drop-shadow-sm animate-bounce" />
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-sm">Pipeline Validation Blocked</h3>
                <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-3 rounded-xl max-w-sm mx-auto leading-relaxed">
                  {errorMessage || 'An error occurred during verification.'}
                </p>
              </div>
              <div className="space-y-2">
                <a
                  href="https://github.com/galanoemerson0016-eng/FormEase-Releases/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-300 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  {isMac ? '🍏 Download macOS Update (.dmg)' : 'Download Direct Installer (.exe / .dmg / .zip)'}
                </a>
                <div className="flex gap-3">
                  <button
                    onClick={checkForUpdates}
                    className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-[13px] uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Check
                  </button>
                  <button
                    onClick={() => useUpdateStore.setState({ updateStep: 'idle' })}
                    className="flex-1 py-3.5 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-black text-[13px] uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
                  >
                    Close & Continue
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
