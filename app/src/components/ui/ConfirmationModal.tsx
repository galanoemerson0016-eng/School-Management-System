import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

interface ConfirmationModalProps {
    open: boolean;
    title: string;
    message: string;
    details?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    intent?: 'danger' | 'warning' | 'info';
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

export function ConfirmationModal({
    open,
    title,
    message,
    details,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    intent = 'danger',
    onConfirm,
    onCancel,
}: ConfirmationModalProps) {
    const titleId = useId();
    const messageId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);
    const busyRef = useRef(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!open) return;
        const previousFocus = document.activeElement as HTMLElement | null;
        dialogRef.current?.focus();
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !busyRef.current) onCancel();
            if (event.key !== 'Tab') return;
            const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), [tabindex="0"]') || []);
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (!first) { event.preventDefault(); return; }
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
                event.preventDefault(); first.focus();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => { document.removeEventListener('keydown', handleKey); previousFocus?.focus(); };
    }, [open, onCancel]);
    const cancel = () => { if (!busyRef.current) onCancel(); };
    const confirm = async () => {
        if (busyRef.current) return;
        busyRef.current = true;
        setBusy(true);
        setError('');
        try { await onConfirm(); }
        catch (cause) {
            console.error('Confirmed operation failed:', cause);
            setError('The operation could not be completed. Please try again.');
        } finally { busyRef.current = false; setBusy(false); }
    };
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

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4"
                    onClick={cancel}
                >
                    <motion.div
                        ref={dialogRef}
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        aria-describedby={messageId}
                        aria-busy={busy}
                        tabIndex={-1}
                        initial={{ scale: 0.95, y: 16, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 16, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md overflow-hidden rounded-4xl bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)] border border-slate-200"
                    >
                        <div className={`bg-linear-to-r ${intentStyles.accent} px-6 py-5 text-white relative overflow-hidden`}>
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_45%)]" />
                            <div className="relative z-10 flex items-start gap-3">
                                <div className="mt-0.5 rounded-2xl bg-white/15 p-2.5">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">Please confirm</p>
                                    <h3 id={titleId} className="mt-2 text-2xl font-black tracking-tight">{title}</h3>
                                </div>
                                <button type="button" aria-label="Close confirmation" disabled={busy} onClick={cancel} className="rounded-xl p-2 hover:bg-white/10 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <p id={messageId} className="text-sm text-slate-600 leading-relaxed">{message}</p>
                            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                            {details && (
                                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 border border-slate-200 whitespace-pre-wrap">
                                    {details}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={cancel}
                                    className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void confirm()}
                                    className={`h-11 rounded-xl px-5 text-sm font-black transition-colors ${intentStyles.confirm}`}
                                >
                                    {busy ? 'Working…' : confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
