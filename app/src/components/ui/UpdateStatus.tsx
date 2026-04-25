import { useState, useEffect } from 'react';
import { DownloadCloud, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export function UpdateStatus() {
  const [status, setStatus] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Listen for update messages from the main process
    if ((window as any).electronAPI && (window as any).electronAPI.onUpdateMessage) {
      (window as any).electronAPI.onUpdateMessage((message: string) => {
        setStatus(message);
        setIsChecking(message.includes('Checking') || message.includes('Downloading'));
        
        // Clear success/error messages after a while
        if (message.includes('up to date') || message.includes('Error')) {
          setTimeout(() => {
            setStatus('');
            setIsChecking(false);
          }, 5000);
        }
      });
    }
  }, []);

  const handleCheckForUpdates = () => {
    if (isChecking) return;
    setStatus('Checking for updates...');
    setIsChecking(true);
    if ((window as any).electronAPI && (window as any).electronAPI.checkForUpdates) {
      (window as any).electronAPI.checkForUpdates();
    } else {
      setStatus('Updates only available in desktop app.');
      setTimeout(() => setStatus(''), 3000);
      setIsChecking(false);
    }
  };

  return (
    <div className="relative group flex items-center">
      <button
        onClick={handleCheckForUpdates}
        disabled={isChecking}
        className={`relative p-2 rounded-2xl bg-white/50 dark:bg-black/40 border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 shadow-sm flex items-center gap-2 ${
          isChecking ? 'opacity-80 cursor-wait' : ''
        }`}
        title="Check for Updates"
      >
        {isChecking ? (
          <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />
        ) : status.includes('available') || status.includes('downloaded') ? (
          <DownloadCloud className="w-5 h-5 text-blue-500 animate-bounce" />
        ) : status.includes('Error') ? (
          <AlertCircle className="w-5 h-5 text-red-500" />
        ) : status.includes('up to date') ? (
          <CheckCircle className="w-5 h-5 text-emerald-500" />
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
