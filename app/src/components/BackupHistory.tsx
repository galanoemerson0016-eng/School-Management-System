/**
 * Backup History UI Component
 * Displays all saved backups with options to:
 * - View details
 * - Restore from history
 * - Delete old backups
 * - View statistics
 */

import { useState, useEffect } from 'react';
import { Calendar, DownloadCloud, Trash2, BarChart3, AlertCircle } from 'lucide-react';
import type { BackupMetadataRecord } from '../utils/backup-metadata';
import {
    fetchAllBackupMetadata,
    deleteOldBackupMetadata,
    deleteBackupMetadata,
    getBackupStatistics,
    generateBackupHistoryReport,
} from '../utils/backup-metadata';
import { ConfirmationModal } from './ui/ConfirmationModal';

interface BackupHistoryProps {
    onRestoreClick?: (backup: BackupMetadataRecord) => void;
}

interface BackupStatistics {
    totalBackups: number;
    totalSize: number;
    averageSize: number;
    lastBackup: BackupMetadataRecord | null;
    largest: BackupMetadataRecord | null;
    oldest: BackupMetadataRecord | null;
    encryptedCount: number;
    compressedCount: number;
}

export function BackupHistory({ onRestoreClick }: BackupHistoryProps) {
    const [backups, setBackups] = useState<BackupMetadataRecord[]>([]);
    const [statistics, setStatistics] = useState<BackupStatistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [report, setReport] = useState<string>('');
    const [deleteMode, setDeleteMode] = useState<'old' | BackupMetadataRecord | null>(null);

    useEffect(() => {
        loadBackupHistory();
    }, []);

    const loadBackupHistory = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Load backups and stats
            const [backupList, stats, historyReport] = await Promise.all([
                fetchAllBackupMetadata().catch((e: unknown) => {
                    console.error('Error fetching backups:', e);
                    return [];
                }),
                getBackupStatistics().catch((e: unknown) => {
                    console.error('Error getting statistics:', e);
                    return null;
                }),
                generateBackupHistoryReport().catch(e => {
                    console.error('Error generating report:', e);
                    return '';
                }),
            ]);

            setBackups(backupList || []);
            setStatistics(stats);
            setReport(historyReport || '');
        } catch (err) {
            console.error('Error loading backup history:', err);
            setError('Failed to load backup history');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteOld = async () => {
        setDeleteMode('old');
    };

    const confirmDeleteOld = async () => {
        setDeleteMode(null);
        try {
            const deleted = await deleteOldBackupMetadata(30);
            alert(`✅ Deleted ${deleted} old backup records`);
            await loadBackupHistory();
        } catch (err) {
            console.error('Error deleting old backups:', err);
            alert('Failed to delete old backups');
        }
    };

    const handleDeleteOne = async (backup: BackupMetadataRecord) => {
        if (!backup.id) {
            alert('Cannot delete backup: missing backup ID');
            return;
        }

        setDeleteMode(backup);
    };

    const confirmDeleteOne = async (backup: BackupMetadataRecord) => {
        // Clear modal state first before async operation
        setDeleteMode(null);
        
        try {
            if (!backup.id) {
                throw new Error('Missing backup id');
            }

            await deleteBackupMetadata(backup.id);
            alert('✅ Backup record deleted');
            await loadBackupHistory();
        } catch (err) {
            console.error('Error deleting backup metadata:', err);
            alert('Failed to delete backup record');
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading backup history...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-6 rounded-xl border border-red-200 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                <div>
                    <p className="text-red-800 font-semibold">{error}</p>
                    <button
                        onClick={loadBackupHistory}
                        className="text-red-700 text-sm font-medium hover:underline mt-1"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Statistics Card */}
            {statistics && (
                <div
                    className="bg-linear-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setShowStats(!showStats)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                            <div>
                                <p className="font-semibold text-gray-800">Backup Statistics</p>
                                <p className="text-sm text-gray-600">
                                    {statistics.totalBackups} backups • {formatBytes(statistics.totalSize)}
                                </p>
                            </div>
                        </div>
                        <button className="text-2xl text-gray-400">
                            {showStats ? '−' : '+'}
                        </button>
                    </div>

                    {showStats && (
                        <div className="mt-4 pt-4 border-t border-purple-200 text-sm space-y-2">
                            <pre className="bg-white p-3 rounded-lg font-mono text-xs overflow-auto text-gray-700 whitespace-pre-wrap wrap-break-word max-h-96">
                                {report}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            <ConfirmationModal
                open={deleteMode === 'old'}
                title="Delete old backup history?"
                message="This will permanently remove backup records older than the latest 30 entries."
                details="This action cannot be undone."
                confirmLabel="Delete Old Backups"
                intent="danger"
                onConfirm={confirmDeleteOld}
                onCancel={() => setDeleteMode(null)}
            />

            <ConfirmationModal
                open={deleteMode !== null && deleteMode !== 'old'}
                title={deleteMode && deleteMode !== 'old' ? `Delete backup from ${new Date(deleteMode.exportedAt).toLocaleString()}?` : ''}
                message="This backup record will be permanently removed from history."
                details={deleteMode && deleteMode !== 'old' ? `Exported by: ${deleteMode.exportedBy || 'Unknown'}\nSize: ${formatBytes(deleteMode.fileSize)}` : ''}
                confirmLabel="Delete Backup"
                intent="danger"
                onConfirm={() => deleteMode && deleteMode !== 'old' ? void confirmDeleteOne(deleteMode) : undefined}
                onCancel={() => setDeleteMode(null)}
            />

            {/* Backups List */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Backup History ({backups.length})
                    </h3>
                    {backups.length > 30 && (
                        <button
                            onClick={handleDeleteOld}
                            className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium"
                        >
                            Clean Up Old
                        </button>
                    )}
                </div>

                {backups.length === 0 ? (
                    <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600 border border-dashed border-gray-300">
                        <p>No backup history yet</p>
                        <p className="text-sm">Create your first backup to get started</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {backups.map((backup) => (
                            <div
                                key={backup.id}
                                className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-800">
                                                {new Date(backup.exportedAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                            {backup.isEncrypted && (
                                                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full font-medium">
                                                    🔒 Encrypted
                                                </span>
                                            )}
                                            {backup.isCompressed && (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                                                    📦 Compressed
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            by {backup.exportedBy} • {formatBytes(backup.fileSize)}
                                        </p>
                                        <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                            <p>
                                                📚 {backup.summary.students} students • 📊 {backup.summary.grades} grades •
                                                👥 {backup.summary.users} users
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onRestoreClick?.(backup)}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm flex items-center gap-1"
                                        >
                                            <DownloadCloud className="w-4 h-4" />
                                            Restore
                                        </button>
                                        <button
                                            onClick={() => handleDeleteOne(backup)}
                                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm"
                                            title="Delete this backup"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {backup.notes && (
                                    <p className="text-xs text-gray-600 mt-2 italic">📝 {backup.notes}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper function
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
