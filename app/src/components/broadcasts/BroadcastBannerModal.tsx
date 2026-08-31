import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  Bell, 
  Radio,
  ArrowRight
} from 'lucide-react';
import { broadcastService, dismissBroadcast, type SystemBroadcast } from '../../services/broadcast-service';

export function BroadcastBannerModal() {
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>([]);
  const [activeModalIndex, setActiveModalIndex] = useState<number>(0);

  const refreshBroadcasts = async () => {
    if (!navigator.onLine) return;
    const items = await broadcastService.fetchActiveBroadcasts();
    setBroadcasts(items);
  };

  useEffect(() => {
    // Initial fetch
    void refreshBroadcasts();

    // Subscribe to realtime changes if online
    const unsubscribe = broadcastService.subscribeToBroadcasts((items) => {
      setBroadcasts(items);
    });

    // Re-fetch when device reconnects to internet
    const handleOnline = () => {
      console.log('📡 Device online: checking for global broadcasts...');
      void refreshBroadcasts();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleDismiss = (id: string) => {
    dismissBroadcast(id);
    setBroadcasts(prev => prev.filter(b => b.id !== id));
  };

  const handleActionClick = (url?: string) => {
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
  };

  // Separate banners and modals
  const bannerBroadcasts = broadcasts.filter(b => b.display_type === 'banner');
  const modalBroadcasts = broadcasts.filter(b => b.display_type === 'modal');
  const currentModal = modalBroadcasts[activeModalIndex] || null;

  return (
    <>
      {/* 1. TOP STICKY BANNERS */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center gap-2 p-3">
        <AnimatePresence>
          {bannerBroadcasts.map((banner) => {
            const isInfo = banner.severity === 'info';
            const isWarning = banner.severity === 'warning';
            const isUrgent = banner.severity === 'urgent';
            const isSuccess = banner.severity === 'success';

            const bgClasses = isUrgent
              ? 'bg-red-600/95 border-red-400/50 text-white shadow-xl shadow-red-900/30'
              : isWarning
              ? 'bg-amber-600/95 border-amber-400/50 text-white shadow-xl shadow-amber-900/30'
              : isSuccess
              ? 'bg-emerald-600/95 border-emerald-400/50 text-white shadow-xl shadow-emerald-900/30'
              : 'bg-deped-blue/95 border-blue-400/50 text-white shadow-xl shadow-blue-900/30';

            const Icon = isUrgent ? AlertTriangle : isWarning ? AlertTriangle : isSuccess ? CheckCircle2 : Info;

            return (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`pointer-events-auto max-w-4xl w-full rounded-2xl border backdrop-blur-md px-4 py-3 flex items-center justify-between gap-4 ${bgClasses}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-white/15 shrink-0 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                        Notice
                      </span>
                      <h4 className="text-sm font-black truncate">{banner.title}</h4>
                    </div>
                    <p className="text-xs text-white/90 font-medium truncate mt-0.5">{banner.content}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {banner.action_label && banner.action_url && (
                    <button
                      onClick={() => handleActionClick(banner.action_url)}
                      className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-black text-xs hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <span>{banner.action_label}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(banner.id)}
                    className="p-1.5 rounded-xl bg-black/10 hover:bg-black/25 text-white/90 hover:text-white transition-colors"
                    title="Dismiss notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 2. INTERACTIVE POPUP MODAL */}
      <AnimatePresence>
        {currentModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-7 shadow-2xl overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  currentModal.severity === 'urgent'
                    ? 'bg-red-500'
                    : currentModal.severity === 'warning'
                    ? 'bg-amber-500'
                    : currentModal.severity === 'success'
                    ? 'bg-emerald-500'
                    : 'bg-deped-blue'
                }`}
              />

              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-2xl flex items-center justify-center ${
                      currentModal.severity === 'urgent'
                        ? 'bg-red-500/10 text-red-500'
                        : currentModal.severity === 'warning'
                        ? 'bg-amber-500/10 text-amber-500'
                        : currentModal.severity === 'success'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-blue-500/10 text-blue-500'
                    }`}
                  >
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        currentModal.severity === 'urgent'
                          ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                          : currentModal.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : currentModal.severity === 'success'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {currentModal.severity.toUpperCase()} ANNOUNCEMENT
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      {currentModal.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => handleDismiss(currentModal.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">
                  {currentModal.content}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <span className="text-[11px] font-semibold text-slate-400">
                  {new Date(currentModal.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>

                <div className="flex items-center gap-2">
                  {currentModal.action_label && currentModal.action_url && (
                    <button
                      onClick={() => handleActionClick(currentModal.action_url)}
                      className="px-4 py-2.5 rounded-xl bg-deped-blue hover:bg-deped-blue-dark text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 active:scale-95"
                    >
                      <span>{currentModal.action_label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(currentModal.id)}
                    className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all active:scale-95"
                  >
                    Got it / Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
