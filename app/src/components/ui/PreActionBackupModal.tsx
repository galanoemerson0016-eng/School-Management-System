import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Download, CheckCircle2, X, Database, Lock } from 'lucide-react';
import { AutoBackupManager } from '../../services/AutoBackupManager';
import { exportFullDatabaseBackup, downloadComprehensiveBackup } from '../../utils/backup-restore';

interface PreActionBackupModalProps {
    open: boolean;
    title: string;
    actionDescription: string;
    affectedDetails?: string;
    confirmLabel?: string;
    intent?: 'danger' | 'warning' | 'info';
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

export function PreActionBackupModal({
    open,
    title,
    actionDescription,
    affectedDetails,
    confirmLabel = 'Proceed with Execution',
    intent = 'warning',
    onConfirm,
    onCancel,
}: PreActionBackupModalProps) {
    const [downloaded, setDownloaded] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);

    const handleDownloadBackup = async () => {
        setIsExporting(true);
        try {
            const comprehensive = await exportFullDatabaseBackup('Pre-Action Comprehensive Backup');
            downloadComprehensiveBackup(comprehensive);
            setDownloaded(true);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to download backup: ' + error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleProceed = async () => {
        setIsExecuting(true);
        try {
            // Automatically trigger a local pre-action snapshot checkpoint
            try {
                await AutoBackupManager.triggerBackup();
            } catch (snapErr) {
                console.warn('Pre-action auto-snapshot warning:', snapErr);
            }
            await onConfirm();
            onCancel();
        } catch (error) {
            console.error('Execution error:', error);
        } finally {
            setIsExecuting(false);
            setDownloaded(false);
            setAcknowledged(false);
        }
    };

    const canProceed = downloaded || acknowledged;

    const intentHeaderColors = {
        danger: 'from-rose-600 to-red-700 text-white',
        warning: 'from-amber-500 to-orange-600 text-white',
        info: 'from-indigo-600 to-blue-700 text-white',
    }[intent];

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto"
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 16, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 16, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-[#0d1225] shadow-2xl border border-slate-200 dark:border-white/10 my-auto"
                    >
                        {/* Header Banner */}
                        <div className={`bg-linear-to-r ${intentHeaderColors} px-6 py-5 relative overflow-hidden`}>
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_50%)]" />
                            <div className="relative z-10 flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-white/20 p-2.5 backdrop-blur-xs">
                                        <ShieldAlert className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-widest text-white mb-1">
                                            <Lock className="w-3 h-3" /> FormEase Safeguard Protocol
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight leading-tight">{title}</h3>
                                    </div>
                                </div>
                                <button 
                                    onClick={onCancel} 
                                    className="rounded-xl p-1.5 hover:bg-white/20 transition-colors text-white cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Action Description & Affected Details */}
                            <div className="space-y-2">
                                <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {actionDescription}
                                </p>
                                {affectedDetails && (
                                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {affectedDetails}
                                    </div>
                                )}
                            </div>

                            {/* Step 1: Download Full Backup Box */}
                            <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                                        <Database className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                                            Recommended Safety Requirement
                                        </h4>
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                                            Export a full standalone database backup before making structural updates.
                                        </p>
                                    </div>
                                </div>

                                {downloaded ? (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                        <span>Full Database Backup (.json) downloaded successfully!</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleDownloadBackup}
                                        disabled={isExporting}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        <Download className="w-4 h-4" />
                                        {isExporting ? 'Exporting Database...' : 'Download Full Database Backup Now'}
                                    </button>
                                )}
                            </div>

                            {/* Automatic Rollback Checkpoint Banner */}
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <span>An automatic local snapshot point will also be recorded before execution.</span>
                            </div>

                            {/* Manual Bypass Checkbox if already backed up */}
                            {!downloaded && (
                                <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                                    <input
                                        type="checkbox"
                                        checked={acknowledged}
                                        onChange={(e) => setAcknowledged(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                        I have already exported a backup today and understand the risks
                                    </span>
                                </label>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-150 dark:border-white/5">
                                <button
                                    onClick={onCancel}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProceed}
                                    disabled={!canProceed || isExecuting}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer ${
                                        canProceed && !isExecuting
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                                    }`}
                                >
                                    {isExecuting ? 'Processing...' : confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
