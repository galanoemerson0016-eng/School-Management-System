import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, ShieldCheck, Clock, RefreshCw, HardDrive, X, ArrowRight } from 'lucide-react';
import { CloudSyncService } from '../../services/cloud-sync';

interface GoogleDriveOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const GoogleDriveOnboardingModal: React.FC<GoogleDriveOnboardingModalProps> = ({
  isOpen,
  onClose,
  onConnected
}) => {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsAuthorizing(true);
    setError(null);
    try {
      const state = await CloudSyncService.authorize();
      if (state.linked) {
        // Trigger initial cloud sync immediately
        CloudSyncService.syncNow().catch((e) => console.warn('Initial cloud sync notice:', e));
        if (onConnected) onConnected();
        onClose();
      } else {
        setError('Google Drive authorization was not completed.');
      }
    } catch (err) {
      console.error('Google Drive connection failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Google Drive. Please try again.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleRemindLater = () => {
    CloudSyncService.dismissOnboarding(true);
    onClose();
  };

  const handleNeverAsk = () => {
    CloudSyncService.dismissOnboarding(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden text-slate-800 dark:text-slate-100"
        >
          {/* Header Gradient Banner */}
          <div className="relative p-6 bg-linear-to-br from-blue-600 via-indigo-600 to-emerald-600 text-white">
            <button
              onClick={handleRemindLater}
              className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
                <Cloud className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/25 rounded-full text-white">
                  Automated Cloud Protection
                </span>
                <h3 className="text-xl font-black text-white tracking-tight">Connect Google Drive</h3>
              </div>
            </div>
            <p className="text-xs text-white/90 font-medium leading-relaxed mt-1">
              Safeguard all school forms, student profiles, and grading sheets with automated cloud backups directly to your personal Google Drive.
            </p>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-700 dark:text-rose-300 font-semibold">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Hourly Auto-Sync in the Background</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    Your database automatically updates to Google Drive every hour so you never lose encoded grades.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                <RefreshCw className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Sync Before Application Exit</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    When you exit FormEase Pro, an instant snapshot is saved before closing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">100% Private & Dedicated Folder</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    Stored in a secure <code className="font-mono text-indigo-600 dark:text-indigo-400">FormEase_Backups</code> folder accessible only to you.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                <HardDrive className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">1-Click Restoration Anywhere</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                    Switch to another desktop or laptop and restore your school database instantly.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
              <button
                type="button"
                onClick={handleConnect}
                disabled={isAuthorizing}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition disabled:opacity-50 cursor-pointer"
              >
                {isAuthorizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to Google Drive...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Connect Google Drive</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1 pt-1">
                <button
                  type="button"
                  onClick={handleRemindLater}
                  className="hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                >
                  Remind Me Later (24h)
                </button>
                <button
                  type="button"
                  onClick={handleNeverAsk}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                >
                  Don't Ask Again
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
