import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
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

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        error: <AlertCircle className="w-5 h-5 text-rose-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    const colors = {
        success: 'border-emerald-500/20 bg-emerald-50/90 text-emerald-900',
        error: 'border-rose-500/20 bg-rose-50/90 text-rose-900',
        info: 'border-blue-500/20 bg-blue-50/90 text-blue-900'
    };

    return (
        <AnimatePresence>
            {notification.visible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md"
                >
                    <div className={`
                        flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl
                        ${colors[notification.type]}
                    `}>
                        <div className="flex-shrink-0 bg-white/50 p-2 rounded-xl shadow-sm">
                            {icons[notification.type]}
                        </div>
                        <div className="flex-1 text-sm font-semibold tracking-tight">
                            {notification.message}
                        </div>
                        <button
                            onClick={hideNotification}
                            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 opacity-50" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
