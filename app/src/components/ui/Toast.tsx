import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X, Sparkles } from 'lucide-react';
import { useAppStore } from '../../stores';

export function Toast() {
    const { notification, hideNotification } = useAppStore();

    useEffect(() => {
        if (notification.visible) {
            const timer = setTimeout(() => {
                hideNotification();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification.visible, hideNotification]);

    const colors = {
        success: 'border-emerald-200 bg-white/95 dark:bg-slate-950/95 text-slate-900 dark:text-slate-100 ring-1 ring-emerald-500/10',
        error: 'border-rose-200 bg-white/95 dark:bg-slate-950/95 text-slate-900 dark:text-slate-100 ring-1 ring-rose-500/10',
        info: 'border-sky-200 bg-white/95 dark:bg-slate-950/95 text-slate-900 dark:text-slate-100 ring-1 ring-sky-500/10'
    };

    const accents = {
        success: 'from-emerald-500 to-emerald-600',
        error: 'from-rose-500 to-rose-600',
        info: 'from-sky-500 to-sky-600'
    };

    const titles = {
        success: 'Success',
        error: 'Action Failed',
        info: 'Notice'
    };

    return (
        <AnimatePresence>
            {notification.visible && (
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 24, scale: 0.96 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-9999 w-[92vw] max-w-md"
                >
                    <div className={`relative overflow-hidden rounded-[1.75rem] border shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl ${colors[notification.type]}`}>
                        <div className={`h-1.5 bg-linear-to-r ${accents[notification.type]}`} />
                        <div className="p-4 flex items-start gap-4">
                            <div className="shrink-0 rounded-2xl p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
                                {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                                {notification.type === 'info' && <Info className="w-5 h-5 text-sky-500" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{titles[notification.type]}</p>
                                </div>
                                <div className="text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
                                    {typeof notification.message === 'object' 
                                        ? (notification.message as unknown as { text?: string }).text || JSON.stringify(notification.message) 
                                        : notification.message}
                                </div>
                            </div>

                            <button
                                onClick={hideNotification}
                                className="shrink-0 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                aria-label="Dismiss notification"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
