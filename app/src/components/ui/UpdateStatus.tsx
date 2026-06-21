import { useUpdateStore } from '../../stores/update-store';
import { DownloadCloud, RefreshCw, AlertCircle } from 'lucide-react';

export function UpdateStatus() {
  const { updateStep, updateInfo, errorMessage, downloadProgress, checkForUpdates } = useUpdateStore();

  const isChecking = updateStep === 'checking' || updateStep === 'health-checks' || updateStep === 'backup' || updateStep === 'simulation';
  const isDownloading = updateStep === 'downloading';
  const isReady = updateStep === 'ready-to-install' || updateStep === 'ready-to-start';
  const isFailed = updateStep === 'failed';

  const handleCheckForUpdates = () => {
    if (isChecking || isDownloading) return;
    if (window.electronAPI) {
      checkForUpdates();
    } else {
      alert('Updates are only available in the desktop application.');
    }
  };

  let status = '';
  if (updateStep === 'checking') status = 'Checking for updates...';
  else if (updateStep === 'health-checks') status = 'Running update health checks...';
  else if (updateStep === 'backup') status = 'Creating system backup...';
  else if (updateStep === 'simulation') status = 'Simulating database migration...';
  else if (updateStep === 'downloading') status = `Downloading update: ${downloadProgress.percent}%`;
  else if (updateStep === 'ready-to-start') status = `New version v${updateInfo?.version} available!`;
  else if (updateStep === 'ready-to-install') status = 'Update ready to install and restart.';
  else if (updateStep === 'failed') status = errorMessage || 'Update check failed.';

  return (
    <div className="relative group flex items-center">
      <button
        onClick={handleCheckForUpdates}
        disabled={isChecking || isDownloading}
        className={`relative p-2 rounded-2xl bg-white/50 dark:bg-black/40 border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 shadow-sm flex items-center gap-2 ${
          isChecking || isDownloading ? 'opacity-80 cursor-wait' : ''
        }`}
        title="Check for Updates"
      >
        {isChecking ? (
          <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
        ) : isDownloading ? (
          <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
        ) : isReady ? (
          <DownloadCloud className="w-5 h-5 text-blue-500 animate-bounce" />
        ) : isFailed ? (
          <AlertCircle className="w-5 h-5 text-red-500" />
        ) : (
          <DownloadCloud className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        )}
      </button>

      {/* Tooltip / Status Popover */}
      {status && (
        <div className="absolute right-0 top-full mt-2 w-max max-w-[250px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200 dark:border-white/10 p-3 z-50">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
            {status}
          </p>
        </div>
      )}
    </div>
  );
}

