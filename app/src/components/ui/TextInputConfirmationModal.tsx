import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface TextInputConfirmationModalProps {
    open: boolean;
    title: string;
    message: string;
    details?: string;
    inputPlaceholder?: string;
    requiredText?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    intent?: 'danger' | 'warning' | 'info';
    onConfirm: (inputValue: string) => void | Promise<void>;
    onCancel: () => void;
}

export function TextInputConfirmationModal({
    open,
    title,
    message,
    details,
    inputPlaceholder = 'Enter confirmation text',
    requiredText = '',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    intent = 'danger',
    onConfirm,
    onCancel,
}: TextInputConfirmationModalProps) {
    const [inputValue, setInputValue] = useState('');

    const intentStyles = {
        danger: {
            accent: 'from-rose-600 to-red-600',
            confirm: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200',
            icon: 'text-rose-600',
        },
        warning: {
            accent: 'from-amber-500 to-orange-500',
            confirm: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200',
            icon: 'text-amber-600',
        },
        info: {
            accent: 'from-sky-600 to-blue-600',
            confirm: 'bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-200',
            icon: 'text-sky-600',
        },
    }[intent];

    const isConfirmed = requiredText ? inputValue === requiredText : inputValue.length > 0;

    const handleConfirm = async () => {
        if (!isConfirmed) return;
        setInputValue('');
        await onConfirm(inputValue);
    };

    const handleCancel = () => {
        setInputValue('');
        onCancel();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4"
                    onClick={handleCancel}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 16, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 16, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)] border border-slate-200"
                    >
                        <div className={`bg-gradient-to-r ${intentStyles.accent} px-6 py-5 text-white relative overflow-hidden`}>
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_45%)]" />
                            <div className="relative z-10 flex items-start gap-3">
                                <div className="mt-0.5 rounded-2xl bg-white/15 p-2.5">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">Please confirm</p>
                                    <h3 className="mt-2 text-2xl font-black tracking-tight">{title}</h3>
                                </div>
                                <button onClick={handleCancel} className="rounded-xl p-2 hover:bg-white/10 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
                            {details && (
                                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 border border-slate-200 whitespace-pre-wrap">
                                    {details}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    {requiredText && `Type "${requiredText}" to confirm`}
                                </label>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={inputPlaceholder}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && isConfirmed) {
                                            handleConfirm();
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={handleCancel}
                                    className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={!isConfirmed}
                                    className={`h-11 rounded-xl px-5 text-sm font-black transition-colors ${isConfirmed ? intentStyles.confirm : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
