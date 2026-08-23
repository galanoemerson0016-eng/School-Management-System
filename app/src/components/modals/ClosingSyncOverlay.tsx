import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, ShieldCheck, RefreshCw } from 'lucide-react';

interface ClosingSyncOverlayProps {
  isVisible: boolean;
  statusText?: string;
}

export const ClosingSyncOverlay: React.FC<ClosingSyncOverlayProps> = ({
  isVisible,
  statusText = 'Saving school records & syncing to Google Drive...'
}) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/85 backdrop-blur-md text-white select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center max-w-sm text-center p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-5"
        >
          {/* Animated Cloud Icon with Glow */}
          <div className="relative flex items-center justify-center w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping opacity-75" />
            <div className="absolute inset-2 rounded-full bg-indigo-500/30 animate-pulse" />
            <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
              <Cloud className="w-8 h-8 text-white animate-bounce" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white tracking-tight">Securing School Records</h3>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {statusText}
            </p>
          </div>

          {/* Sync Progress Bar / Spinner */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[11px] font-bold text-blue-300">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>Finalizing database snapshot...</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>FormEase Pro Zero-Loss Guarantee</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
