/**
 * Enhanced Backup Export Modal
 * Provides options for:
 * - Password encryption
 * - Compression
 * - Selective data export
 * - Metadata saving
 */

import { useState } from 'react';
import { Lock, Zap, Database, Info } from 'lucide-react';
import {
    getPasswordStrength,
} from '../utils/backup-encryption';
import { compareBackupSizes } from '../utils/backup-compression';
import type { ComprehensiveBackup } from '../utils/backup-restore';

interface ExportOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    backup: ComprehensiveBackup | null;
    onExport: (options: ExportOptions) => Promise<void>;
    isExporting: boolean;
}

export interface ExportOptions {
    encrypt: boolean;
    password?: string;
    compress: boolean;
    saveMetadata: boolean;
    includeReport: boolean;
}

export function ExportOptionsModal({
    isOpen,
    onClose,
    backup,
    onExport,
    isExporting,
}: ExportOptionsModalProps) {
    const [options, setOptions] = useState<ExportOptions>({
        encrypt: true,
        compress: true,
        saveMetadata: true,
        includeReport: true,
    });

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    if (!isOpen || !backup) return null;

    const passwordStrength = password ? getPasswordStrength(password) : null;
    const backupJson = JSON.stringify(backup, null, 2);
    const sizes = compareBackupSizes(backupJson);

    const handleEncryptionToggle = () => {
        setOptions(prev => ({ ...prev, encrypt: !prev.encrypt }));
        setPasswordError('');
    };

    const handleExport = async () => {
        // Validation
        if (options.encrypt) {
            if (!password) {
                setPasswordError('Password is required');
                return;
            }
            if (password.length < 8) {
                setPasswordError('Password must be at least 8 characters');
                return;
            }
            if (password !== confirmPassword) {
                setPasswordError('Passwords do not match');
                return;
            }
        }

        // Export with options
        await onExport({ ...options, password: options.encrypt ? password : undefined });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-linear-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Zap className="w-6 h-6" />
                        <h2 className="text-2xl font-bold">Export Options</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isExporting}
                        className="text-2xl hover:bg-white/20 p-1 rounded disabled:opacity-50"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Encryption Section */}
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                        <label className="flex items-center gap-3 cursor-pointer mb-4">
                            <input
                                type="checkbox"
                                checked={options.encrypt}
                                onChange={handleEncryptionToggle}
                                className="w-5 h-5"
                            />
                            <div>
                                <p className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    Password Protection (AES-256)
                                </p>
                                <p className="text-sm text-gray-600">
                                    Encrypt backup with password - recommended for sensitive data
                                </p>
                            </div>
                        </label>

                        {options.encrypt && (
                            <div className="space-y-3 mt-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                                        Enter Password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setPasswordError('');
                                        }}
                                        placeholder="At least 8 characters"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {passwordStrength && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full transition-all"
                                                    style={{
                                                        width: `${(passwordStrength.score + 1) * 25}%`,
                                                        backgroundColor: passwordStrength.color,
                                                    }}
                                                />
                                            </div>
                                            <span
                                                className="text-xs font-semibold"
                                                style={{ color: passwordStrength.color }}
                                            >
                                                {passwordStrength.label}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            setPasswordError('');
                                        }}
                                        placeholder="Confirm password"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {passwordError && (
                                    <p className="text-sm text-red-600 font-semibold">⚠️ {passwordError}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Compression Section */}
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={options.compress}
                                onChange={(e) =>
                                    setOptions(prev => ({ ...prev, compress: e.target.checked }))
                                }
                                className="w-5 h-5"
                            />
                            <div>
                                <p className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    Compress Backup
                                </p>
                                <p className="text-sm text-gray-600">
                                    Reduce file size by ~30-40% - makes transfers faster
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Metadata Section */}
                    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={options.saveMetadata}
                                onChange={(e) =>
                                    setOptions(prev => ({ ...prev, saveMetadata: e.target.checked }))
                                }
                                className="w-5 h-5"
                            />
                            <div>
                                <p className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Database className="w-4 h-4" />
                                    Save to Backup History
                                </p>
                                <p className="text-sm text-gray-600">
                                    Store backup metadata for easy recovery - enable "restore any date"
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Report Section */}
                    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={options.includeReport}
                                onChange={(e) =>
                                    setOptions(prev => ({ ...prev, includeReport: e.target.checked }))
                                }
                                className="w-5 h-5"
                            />
                            <div>
                                <p className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Include Report File
                                </p>
                                <p className="text-sm text-gray-600">
                                    Download human-readable summary of backup contents
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Size Estimation */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-800 mb-3">📊 File Size Estimate</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Original:</span>
                                <span className="font-mono font-semibold">{sizes.original}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Minified:</span>
                                <span className="font-mono font-semibold">{sizes.minified}</span>
                            </div>
                            {options.compress && (
                                <>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-gray-600">After Compression:</span>
                                        <span className="font-mono font-semibold text-green-600">
                                            {sizes.estimate}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Space Saved:</span>
                                        <span className="font-mono font-semibold text-green-600">
                                            {sizes.savings}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isExporting}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting || (options.encrypt && !password)}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    ⬇️ Export with Options
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
