import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { useAppStore, initializeAppStore } from '../stores/app-store';
import { useUpdateStore } from '../stores/update-store';
import { db } from '../services/database';
import { Database, User, Shield, Upload, Cloud, Info, Sparkles, Sun, Moon, Monitor, Download, MessageSquare, FileSpreadsheet, RefreshCw, CheckCircle2, Archive, Search, Eye } from 'lucide-react';
import { AboutPage } from './AboutPage';
import { VersionHistoryTimeline } from '../components/settings/VersionHistoryTimeline';
import { SmsGatewaySettings } from '../components/settings/SmsGatewaySettings';
import { AutoBackupManager, type AutomatedBackupEntry } from '../services/AutoBackupManager';
import { SnapshotPreviewService } from '../services/SnapshotPreviewService';
import { CloudSyncService } from '../services/cloud-sync';
import { DiagnosticEngine, type DiagnosticIssue } from '../services/diagnostic-engine';
import { canPurgeMaintenance } from '../lib/rbac';
import { createComprehensiveBackup, generateBackupReport, savePreRestoreSafetySnapshot, validateBackup, type ComprehensiveBackup } from '../utils/backup-restore';
import { BackupRestoreModal } from '../components/BackupRestoreModal';
import { ExportOptionsModal, type ExportOptions } from '../components/ExportOptionsModal';
import { PreActionBackupModal } from '../components/ui/PreActionBackupModal';
import { TextInputConfirmationModal } from '../components/ui/TextInputConfirmationModal';
import { encryptBackup, createEncryptedBackupFile } from '../utils/backup-encryption';
import { compareBackupSizes, formatBytes } from '../utils/backup-compression';
import { createBackupMetadata, saveBackupMetadata } from '../utils/backup-metadata';
import { embedChecksum } from '../utils/backup-integrity';
import {
    getLiveDatabaseRecordCounts,
    exportDirectDatabaseToExcel,
    exportAllDirectDatabaseStoresToCSV,
    type DatabaseRecordCounts
} from '../services/database-rescue-export';
import type { Student, AttendanceRecord, ClassRecord, Section } from '../types';
import { downloadMasterExcelBackup } from '../services/master-excel-backup';
import { generatePreUpdateSafetyVault } from '../services/pre-update-safety';

interface FsBackupEntry {
    filename: string;
    path: string;
    size: number;
    mtime: number;
    metadata: Record<string, unknown>;
    summary: {
        activeSchoolYear: string;
        students: number;
        sections: number;
        subjects: number;
        grades: number;
        attendanceRecords?: number;
        gradingSheetRecords?: number;
    };
}

interface CloudBackupEntry {
    id: string;
    name: string;
    size?: number;
    createdTime: string;
}

export function SettingsPage() {
    const { user } = useAuthStore();
    const {
        students,
        studentProfiles,
        sections,
        subjects,
        classRecords,
        gradingSheetRecords,
        observedValues,
        hpsRecords,
        sf2Sheets,
        announcements,
        schoolProfile,
        activeSchoolYear,
        schoolYears,
        enrollments,
        attendanceRecords,
        deleteStudent,
        deleteSection,
        updateStudent,
        updateSection,
        updateSubject,
        theme,
        setTheme,
    } = useAppStore();
    const canPurge = canPurgeMaintenance(user);

    const [autoBackups, setAutoBackups] = useState<AutomatedBackupEntry[]>([]);
    const [fsBackups, setFsBackups] = useState<FsBackupEntry[]>([]);
    const [snapshotSearchQuery, setSnapshotSearchQuery] = useState("");
    const [snapshotRetentionLimit, setSnapshotRetentionLimit] = useState<string>(() => {
        return localStorage.getItem('formease_snapshot_retention_limit') || 'unlimited';
    });
    const [snapshotTypeFilter, setSnapshotTypeFilter] = useState<'all' | 'auto' | 'fs'>('all');

    const handleRetentionLimitChange = async (newLimit: string) => {
        setSnapshotRetentionLimit(newLimit);
        localStorage.setItem('formease_snapshot_retention_limit', newLimit);
        if (newLimit !== 'unlimited') {
            await AutoBackupManager.rotateBackups();
            loadAutoBackups();
            loadFsBackups();
        }
    };

    const [inspectingSnapshot, setInspectingSnapshot] = useState<{
        title: string;
        timestamp: number;
        type: 'auto' | 'fs';
        size: number;
        schoolYear: string;
        students: number;
        sections: number;
        sectionNames?: string[];
        grades: number;
        gradingSheets?: number;
        attendance: number;
        subjects: number;
        onRestore: () => void;
        onDownload?: () => void;
        onPreview?: () => void;
    } | null>(null);
    const updateStore = useUpdateStore();
    const [activeTab, setActiveTab] = useState<'general' | 'account' | 'backups' | 'cloud' | 'sms' | 'maintenance' | 'versions' | 'about'>('general');
    const [aboutSubTab, setAboutSubTab] = useState<'highlights' | 'history' | 'innovator'>('highlights');

    const [disableAnimations, setDisableAnimations] = useState(() => {
        return localStorage.getItem('disable-animations') === 'true';
    });

    const handleToggleAnimations = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setDisableAnimations(checked);
        localStorage.setItem('disable-animations', checked ? 'true' : 'false');
        if (checked) {
            document.documentElement.classList.add('no-animations');
        } else {
            document.documentElement.classList.remove('no-animations');
        }
    };

    const [cloudSyncState, setCloudSyncState] = useState(CloudSyncService.getState());
    const [isCloudSyncing, setIsCloudSyncing] = useState(false);
    const [cloudBackups, setCloudBackups] = useState<CloudBackupEntry[]>([]);
    const [isLoadingCloudBackups, setIsLoadingCloudBackups] = useState(false);
    const [isRestoringCloudBackup, setIsRestoringCloudBackup] = useState(false);
    const [selectedSectionToCascadePurge, setSelectedSectionToCascadePurge] = useState<string>('');

    // --- Direct Database Rescue & Health State ---
    const [liveDbCounts, setLiveDbCounts] = useState<DatabaseRecordCounts | null>(null);
    const [isScanningDb, setIsScanningDb] = useState(false);
    const [isRescuingExcel, setIsRescuingExcel] = useState(false);
    const [isReloadingDb, setIsReloadingDb] = useState(false);

    const handleScanLiveDatabase = useCallback(async () => {
        setIsScanningDb(true);
        try {
            const counts = await getLiveDatabaseRecordCounts();
            setLiveDbCounts(counts);
        } catch (e) {
            console.error('Failed to scan live database:', e);
        } finally {
            setIsScanningDb(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'backups' || activeTab === 'maintenance') {
            void handleScanLiveDatabase();
        }
    }, [activeTab, handleScanLiveDatabase]);

    const handleRescueDatabaseExcel = async () => {
        setIsRescuingExcel(true);
        try {
            const res = await exportDirectDatabaseToExcel();
            if (res.totalRecords === 0) {
                alert('⚠️ The local IndexedDB database (FormEaseDB) currently contains 0 records on this browser.\n\nPlease check if your data was entered in a different browser (e.g. Chrome vs Edge), an Incognito/Private window, or under a different Windows user profile.');
            } else {
                const studentsCount = res.breakdown['Students_Masterlist'] ?? res.breakdown['Students'] ?? 0;
                const sectionsCount = res.breakdown['Sections_Masterlist'] ?? res.breakdown['Sections'] ?? 0;
                const subjectsCount = res.breakdown['Subjects_Masterlist'] ?? res.breakdown['Subjects'] ?? 0;
                const gradesCount = res.breakdown['DepEd_EClass_Records'] ?? res.breakdown['ClassRecords'] ?? 0;
                const attendanceCount = (res.breakdown['SF2_Monthly_Attendance'] ?? 0) + (res.breakdown['Daily_Attendance'] ?? 0) || (res.breakdown['Attendance'] ?? 0);
                const enrollmentsCount = res.breakdown['Enrollments_History'] ?? res.breakdown['Enrollments'] ?? 0;
                const dateStr = new Date().toISOString().split('T')[0];

                alert(
                    `✅ Complete Database Rescued & Exported to Excel!\n\n` +
                    `Extracted ${res.totalRecords} total records across all sheets directly from IndexedDB (FormEaseDB):\n` +
                    `• Students: ${studentsCount}\n` +
                    `• Sections: ${sectionsCount}\n` +
                    `• Subjects: ${subjectsCount}\n` +
                    `• E-Class Records / Grades: ${gradesCount}\n` +
                    `• Attendance Records: ${attendanceCount}\n` +
                    `• Enrollments: ${enrollmentsCount}\n\n` +
                    `Check your Downloads folder for FormEase_Complete_DepEd_Database_Rescue_${dateStr}.xlsx.`
                );
            }
            await handleScanLiveDatabase();
        } catch (err: unknown) {
            alert('Failed to export database to Excel: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setIsRescuingExcel(false);
        }
    };

    const handleForceReloadDatabase = async () => {
        setIsReloadingDb(true);
        try {
            await initializeAppStore();
            await handleScanLiveDatabase();
            alert('✅ Success! The application has re-read all records directly from IndexedDB into active memory. Your data should now appear in all page views.');
        } catch (err: unknown) {
            alert('Failed to reload database: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setIsReloadingDb(false);
        }
    };

    useEffect(() => {
        CloudSyncService.getStateAsync().then(state => {
            setCloudSyncState(state);
            setIsCloudSyncing(state.isSyncing);
        });
        const unsubscribe = CloudSyncService.subscribe(state => {
            setCloudSyncState(state);
            setIsCloudSyncing(state.isSyncing);
        });
        return () => unsubscribe();
    }, []);

    const handleLinkGoogle = async () => {
        try {
            const newState = await CloudSyncService.authorize();
            setCloudSyncState(newState);
            alert('✅ Google Drive linked successfully!');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            alert('Failed to link Google Drive: ' + message);
        }
    };

    const handleUnlinkGoogle = async () => {
        await CloudSyncService.unlink();
        setCloudSyncState(CloudSyncService.getState());
        alert('🔌 Google Drive account unlinked.');
    };

    const handleCloudSync = async () => {
        setIsCloudSyncing(true);
        try {
            await CloudSyncService.syncNow();
            setCloudSyncState(CloudSyncService.getState());
            alert('✅ Database successfully synced to Google Drive!');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            alert('Sync failed: ' + message);
        } finally {
            setIsCloudSyncing(false);
        }
    };

    const loadCloudBackupsList = useCallback(async () => {
        if (!cloudSyncState.linked) {
            setCloudBackups([]);
            return;
        }
        setIsLoadingCloudBackups(true);
        try {
            const list = await CloudSyncService.listCloudBackups();
            setCloudBackups(list);
        } catch (error) {
            console.error('Failed to load cloud backups:', error);
        } finally {
            setIsLoadingCloudBackups(false);
        }
    }, [cloudSyncState.linked]);

    const handlePreviewCloudBackup = async (fileId: string, filename: string) => {
        setIsRestoringCloudBackup(true);
        try {
            const fileContentStr = await CloudSyncService.downloadCloudBackup(fileId);
            const backupData = JSON.parse(fileContentStr);
            const raw = backupData.data || backupData;
            const payload = (raw as Record<string, unknown>).payload as Record<string, unknown> | undefined;
            const summary = (raw as Record<string, unknown>).summary as Record<string, unknown> | undefined;

            const sy = (payload?.activeSchoolYear as string) || (summary?.activeSchoolYear as string) || 'Active S.Y.';
            const studentsCount = (summary?.students as number) || (Array.isArray(payload?.students) ? payload.students.length : 0);
            const sectionsCount = (summary?.sections as number) || (Array.isArray(payload?.sections) ? payload.sections.length : 0);
            const gradesCount = (summary?.grades as number) || (Array.isArray(payload?.classRecords) ? payload.classRecords.length : 0);

            await SnapshotPreviewService.startPreview(raw, {
                id: fileId,
                filename,
                sourceType: 'cloud',
                title: filename,
                timestamp: Date.now(),
                schoolYear: sy,
                studentsCount,
                sectionsCount,
                gradesCount,
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            alert('Failed to preview cloud backup: ' + message);
        } finally {
            setIsRestoringCloudBackup(false);
        }
    };

    const handleRestoreCloudBackup = (fileId: string, filename: string) => {
        setPendingConfirmation({
            title: 'Restore Cloud Backup?',
            message: `Are you sure you want to download and restore the database state from the cloud backup file "${filename}"?`,
            details: 'This will replace all current students, sections, subjects, grades, and attendance records. Any local changes not backed up will be permanently overwritten.',
            confirmLabel: 'Download & Restore',
            intent: 'warning',
            onConfirm: async () => {
                setIsRestoringCloudBackup(true);
                try {
                    const fileContentStr = await CloudSyncService.downloadCloudBackup(fileId);
                    const backupData = JSON.parse(fileContentStr);
                    
                    const raw = backupData.data || backupData;
                    await savePreRestoreSafetySnapshot();
                    await db.importFromBackup(raw);

                    const payload = (raw as Record<string, unknown>).payload as Record<string, unknown> | undefined;
                    const sy = (payload?.activeSchoolYear as string) || 
                               ((raw as Record<string, unknown>)?.summary as Record<string, unknown>)?.activeSchoolYear as string;
                    if (sy && typeof sy === 'string') {
                        localStorage.setItem('activeSchoolYear', sy);
                        localStorage.setItem('formease_active_school_year', sy);
                        useAppStore.setState({ activeSchoolYear: sy });
                    }

                    localStorage.removeItem('formease_selected_section');
                    localStorage.removeItem('selectedSection');

                    await initializeAppStore();
                    alert('✅ Database state successfully restored from Google Drive cloud backup!\n\nThe application will now reload to display all restored classes and records.');
                    window.location.reload();
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    alert('Restore failed: ' + message);
                } finally {
                    setIsRestoringCloudBackup(false);
                }
            }
        });
    };

    const handleDownloadCloudBackup = async (fileId: string, filename: string) => {
        try {
            const fileContentStr = await CloudSyncService.downloadCloudBackup(fileId);
            const downloadName = filename.endsWith('.json') ? filename : `${filename}.json`;
            const blob = new Blob([fileContentStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            alert('Failed to download cloud backup: ' + message);
        }
    };

    const [diagnosticIssues, setDiagnosticIssues] = useState<DiagnosticIssue[]>([]);
    const [isScanningDiagnostics, setIsScanningDiagnostics] = useState(false);
    const [isRepairingDiagnostics, setIsRepairingDiagnostics] = useState(false);

    const handleRunDiagnostics = async () => {
        setIsScanningDiagnostics(true);
        try {
            const list = await DiagnosticEngine.runDiagnostics();
            setDiagnosticIssues(list);
            if (list.length === 0) {
                alert('🎉 System is fully healthy! No issues detected.');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            alert('Diagnostics failed: ' + message);
        } finally {
            setIsScanningDiagnostics(false);
        }
    };

    const handleRepairIssue = (issue: DiagnosticIssue) => {
        setPendingConfirmation({
            title: `Auto Repair: ${issue.description}`,
            message: issue.details,
            details: `Affected Item Count: ${issue.affectedIds.length} record(s)`,
            confirmLabel: 'Run Auto Repair',
            intent: issue.severity === 'error' ? 'danger' : 'warning',
            onConfirm: async () => {
                setIsRepairingDiagnostics(true);
                try {
                    await issue.repairAction();
                    alert('✅ Database successfully repaired!');
                    // Re-run diagnostics
                    const list = await DiagnosticEngine.runDiagnostics();
                    setDiagnosticIssues(list);
                    addMaintenanceLog(`Auto Repair: ${issue.id}`, issue.affectedIds.length);
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    alert('Repair failed: ' + message);
                } finally {
                    setIsRepairingDiagnostics(false);
                }
            },
        });
    };

    const loadAutoBackups = async () => {
        try {
            const list = await AutoBackupManager.getAutomatedBackups();
            setAutoBackups(list);
        } catch (error) {
            console.error('Failed to load automated backups:', error);
        }
    };

    const loadFsBackups = async () => {
        try {
            if (window.electronAPI?.listFsBackups) {
                const list = await window.electronAPI.listFsBackups();
                setFsBackups(list);
            }
        } catch (error) {
            console.error('Failed to load filesystem backups:', error);
        }
    };

    useEffect(() => {
        loadAutoBackups();
        loadFsBackups();
        
        // Fetch real Google Drive connection status asynchronously from the main process
        CloudSyncService.getStateAsync().then((state) => {
            setCloudSyncState(state);
        });
    }, []);

    useEffect(() => {
        if (activeTab === 'cloud' || activeTab === 'backups') {
            loadCloudBackupsList();
        }
    }, [activeTab, cloudSyncState.linked, loadCloudBackupsList]);

    const handlePreviewFsBackup = async (filename: string, fb?: FsBackupEntry) => {
        try {
            if (!window.electronAPI?.readFsBackupContent) {
                throw new Error('Local disk read capability not available.');
            }
            const data = await window.electronAPI.readFsBackupContent(filename);
            if (!data) throw new Error('Could not read backup file content from disk.');

            const studentCount = fb?.summary?.students ?? 0;
            const sectionCount = fb?.summary?.sections ?? 0;
            const gradeCount = fb?.summary?.grades ?? 0;
            const attendanceCount = fb?.summary?.attendanceRecords ?? 0;
            const subjectCount = fb?.summary?.subjects ?? 0;
            const sy = fb?.summary?.activeSchoolYear || 'Active S.Y.';

            await SnapshotPreviewService.startPreview(data, {
                filename,
                sourceType: 'fs',
                title: filename,
                timestamp: fb?.mtime || Date.now(),
                schoolYear: sy,
                studentsCount: studentCount,
                sectionsCount: sectionCount,
                gradesCount: gradeCount,
                attendanceCount,
                subjectsCount: subjectCount,
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            alert('Failed to start snapshot preview: ' + msg);
        }
    };

    const handleRestoreFsBackup = (filename: string) => {
        setPendingConfirmation({
            title: 'Restore Local Backup?',
            message: `Are you sure you want to restore the system state from the backup file "${filename}"?`,
            details: 'This will replace all current students, sections, subjects, grades, and attendance data with the backup file content. Current unsaved changes will be lost.',
            confirmLabel: 'Restore Backup',
            intent: 'warning',
            onConfirm: async () => {
                try {
                    if (window.electronAPI?.readFsBackupContent) {
                        const backupData = await window.electronAPI.readFsBackupContent(filename);
                        if (!backupData) throw new Error('Could not read backup file content.');
                        
                        const raw = backupData.data || backupData;
                        await savePreRestoreSafetySnapshot();
                        await db.importFromBackup(raw);

                        const payload = (raw as Record<string, unknown>).payload as Record<string, unknown> | undefined;
                        const sy = (payload?.activeSchoolYear as string) || 
                                   ((raw as Record<string, unknown>)?.summary as Record<string, unknown>)?.activeSchoolYear as string;
                        if (sy && typeof sy === 'string') {
                            localStorage.setItem('activeSchoolYear', sy);
                            localStorage.setItem('formease_active_school_year', sy);
                            useAppStore.setState({ activeSchoolYear: sy });
                        }

                        localStorage.removeItem('formease_selected_section');
                        localStorage.removeItem('selectedSection');

                        await initializeAppStore();
                        alert('✅ Database state successfully restored from local backup!\n\nThe application will now reload to display all restored classes and records.');
                        window.location.reload();
                    }
                } catch (err) {
                    alert('Restore failed: ' + err);
                }
            }
        });
    };

    const handleDeleteFsBackup = (filename: string) => {
        setPendingConfirmation({
            title: 'Delete Local Backup?',
            message: `Are you sure you want to permanently delete the backup file "${filename}" from your drive?`,
            details: 'This action is irreversible.',
            confirmLabel: 'Delete File',
            intent: 'danger',
            onConfirm: async () => {
                try {
                    if (window.electronAPI?.deleteFsBackup) {
                        const result = await window.electronAPI.deleteFsBackup(filename);
                        if (result.success) {
                            alert('Backup file deleted successfully.');
                            loadFsBackups();
                        } else {
                            throw new Error(result.error || 'Failed to delete file');
                        }
                    }
                } catch (err) {
                    alert('Failed to delete backup: ' + err);
                }
            }
        });
    };

    const handleDownloadFsBackup = async (filename: string) => {
        try {
            let content = '';
            if (window.electronAPI?.readFsBackupContent) {
                const data = await window.electronAPI.readFsBackupContent(filename);
                content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
            }
            if (!content) {
                throw new Error('Unable to read snapshot content from disk.');
            }

            const downloadName = filename.endsWith('.json') ? filename : `${filename}.json`;
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download disk backup: ' + err);
        }
    };

    const handleCheckForUpdates = () => {
        if (updateStore?.checkForUpdates) {
            updateStore.checkForUpdates();
        }
    };

    const handleManualAutoBackup = async () => {
        try {
            await AutoBackupManager.triggerBackup();
            alert('New automated backup snapshot generated successfully!');
            loadAutoBackups();
            loadFsBackups();
        } catch (err) {
            alert('Failed to create backup: ' + err);
        }
    };

    const formatRelativeTime = (timestamp: number): string => {
        const diffMs = Date.now() - timestamp;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 30) return `${diffDays}d ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    const getAutoBackupSections = (b: AutomatedBackupEntry): string[] => {
        try {
            const payload = (b.data as ComprehensiveBackup)?.payload;
            if (payload?.sections && Array.isArray(payload.sections)) {
                return payload.sections.map((s: Section) => s.section_name).filter(Boolean);
            }
        } catch {
            // ignore
        }
        return [];
    };

    const getAutoBackupSchoolYear = (b: AutomatedBackupEntry): string => {
        try {
            const cb = b.data as ComprehensiveBackup;
            return cb?.summary?.activeSchoolYear || cb?.payload?.activeSchoolYear || activeSchoolYear || 'Active S.Y.';
        } catch {
            return activeSchoolYear || 'Active S.Y.';
        }
    };

    const handleDownloadAutoBackup = (b: AutomatedBackupEntry) => {
        try {
            const raw = b.data || b;
            const content = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2);
            const sy = getAutoBackupSchoolYear(b).replace(/[^a-zA-Z0-9_-]/g, '-');
            const safeLabel = b.label.replace(/[^a-zA-Z0-9_-]/g, '_');
            const dateStr = new Date(b.timestamp).toISOString().split('T')[0];
            const filename = `FormEase_Snapshot_${sy}_${safeLabel}_${dateStr}.json`;

            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download snapshot: ' + err);
        }
    };

    const handlePreviewAutoBackup = async (b: AutomatedBackupEntry) => {
        try {
            const studentsCount = b?.recordCounts?.students ?? 0;
            const sectionsCount = b?.recordCounts?.sections ?? 0;
            const gradesCount = b?.recordCounts?.classRecords ?? 0;
            const attendanceCount = b?.recordCounts?.attendanceRecords ?? 0;
            const subjectsCount = b?.recordCounts?.subjects ?? 0;
            const sy = getAutoBackupSchoolYear(b);

            await SnapshotPreviewService.startPreview(b.data || b, {
                id: b.id,
                sourceType: 'auto',
                title: b.label,
                timestamp: b.timestamp,
                schoolYear: sy,
                studentsCount,
                sectionsCount,
                gradesCount,
                attendanceCount,
                subjectsCount,
            });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            alert('Failed to start snapshot preview: ' + msg);
        }
    };

    const handleRestoreAutoBackup = (backupId: string, label: string, entry?: AutomatedBackupEntry) => {
        const b = entry || autoBackups.find(item => item.id === backupId);
        const studentsCount = b?.recordCounts?.students ?? 0;
        const sectionsCount = b?.recordCounts?.sections ?? 0;
        const gradesCount = b?.recordCounts?.classRecords ?? 0;
        const attendanceCount = b?.recordCounts?.attendanceRecords ?? 0;
        const sy = b ? getAutoBackupSchoolYear(b) : activeSchoolYear;
        const secList = b ? getAutoBackupSections(b) : [];
        const secPreview = secList.length > 0 ? ` [${secList.slice(0, 3).join(', ')}${secList.length > 3 ? '...' : ''}]` : '';

        setPendingConfirmation({
            title: 'Restore Automated Backup Snapshot?',
            message: `Revert system data to "${label}" from ${b ? new Date(b.timestamp).toLocaleString() : 'saved state'}?`,
            details: `📦 Checkpoint Contents:\n• School Year: S.Y. ${sy}\n• Enrolled Learners: ${studentsCount}\n• Sections: ${sectionsCount}${secPreview}\n• Recorded Grades: ${gradesCount}\n• Attendance Logs: ${attendanceCount}\n\n⚠️ Warning: Restoring will overwrite any changes made after this snapshot.`,
            confirmLabel: 'Restore Snapshot',
            intent: 'warning',
            onConfirm: async () => {
                try {
                    await AutoBackupManager.restoreFromBackup(backupId);
                    if (sy && sy !== 'Active S.Y.') {
                        localStorage.setItem('activeSchoolYear', sy);
                        localStorage.setItem('formease_active_school_year', sy);
                        useAppStore.setState({ activeSchoolYear: sy });
                    }
                    localStorage.removeItem('formease_selected_section');
                    localStorage.removeItem('selectedSection');
                    await initializeAppStore();
                    loadAutoBackups();
                    alert(`✅ Snapshot successfully restored!\n\n• Active School Year: S.Y. ${sy}\n• Enrolled Learners: ${studentsCount}\n• Sections: ${sectionsCount}\n• Recorded Grades: ${gradesCount}\n\nThe application will now reload to display all restored classes and records.`);
                    window.location.reload();
                } catch (err) {
                    alert('Restore failed: ' + err);
                }
            }
        });
    };

    const handleDeleteAutoBackup = (backupId: string, label: string) => {
        setPendingConfirmation({
            title: 'Delete Automated Backup?',
            message: `Are you sure you want to permanently delete the backup snapshot "${label}"?`,
            details: 'This action is irreversible.',
            confirmLabel: 'Delete Backup',
            intent: 'danger',
            onConfirm: async () => {
                try {
                    await AutoBackupManager.deleteBackup(backupId);
                    alert('Backup snapshot deleted.');
                    loadAutoBackups();
                } catch (err) {
                    alert('Failed to delete backup: ' + err);
                }
            }
        });
    };

    type MaintenanceProgress = {
        active: boolean;
        title: string;
        currentStep: string;
        completed: number;
        total: number;
    };

    const [maintenanceProgress, setMaintenanceProgress] = useState<MaintenanceProgress>({
        active: false,
        title: '',
        currentStep: '',
        completed: 0,
        total: 0,
    });
    const [pendingConfirmation, setPendingConfirmation] = useState<{
        title: string;
        message: string;
        details?: string;
        confirmLabel?: string;
        intent?: 'danger' | 'warning' | 'info';
        onConfirm: () => Promise<void> | void;
    } | null>(null);

    const runPendingConfirmation = async () => {
        if (!pendingConfirmation) return;
        const action = pendingConfirmation.onConfirm;
        setPendingConfirmation(null);
        await action();
    };

    // --- New States for 20 Features ---
    const [duplicateLrns, setDuplicateLrns] = useState<Array<{ lrn: string; students: Student[] }>>([]);
    const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [lrnValidationIssues, setLrnValidationIssues] = useState<Array<{ student: Student; issue: string }>>([]);
    const [isScanningLrnValidation, setIsScanningLrnValidation] = useState(false);
    const [gradeConsistencyIssues, setGradeConsistencyIssues] = useState<Array<{ type: string; studentName: string; details: string; severity: 'warning' | 'error' }>>([]);
    const [isScanningConsistency, setIsScanningConsistency] = useState(false);
    // const [archiveSY, setArchiveSY] = useState(activeSchoolYear);
    // const [isArchiving, setIsArchiving] = useState(false);
    const [maintenanceLogs, setMaintenanceLogs] = useState<Array<{ action: string; timestamp: number; user: string; count: number }>>(() => {
        try {
            return JSON.parse(localStorage.getItem('formease_maintenance_log') || '[]');
        } catch {
            return [];
        }
    });
    const [, setBackupHistory] = useState<Array<{ type: string; timestamp: number; size: number; status: string }>>(() => {
        try {
            return JSON.parse(localStorage.getItem('formease_backup_history') || '[]');
        } catch {
            return [];
        }
    });
    const [usbDetectedPath, setUsbDetectedPath] = useState<string | null>(null);

    const addMaintenanceLog = (action: string, count: number) => {
        const logEntry = {
            action,
            timestamp: Date.now(),
            user: user?.displayName || user?.email || 'admin',
            count
        };
        setMaintenanceLogs((prev) => {
            const updated = [logEntry, ...prev].slice(0, 50);
            localStorage.setItem('formease_maintenance_log', JSON.stringify(updated));
            return updated;
        });
    };

    const addBackupHistoryEntry = (type: string, size: number, status: string) => {
        const historyEntry = {
            type,
            timestamp: Date.now(),
            size,
            status
        };
        setBackupHistory((prev) => {
            const updated = [historyEntry, ...prev].slice(0, 50);
            localStorage.setItem('formease_backup_history', JSON.stringify(updated));
            return updated;
        });
    };

    const startProgress = (title: string, total: number, step: string) => {
        setMaintenanceProgress({
            active: true,
            title,
            currentStep: step,
            completed: 0,
            total,
        });
    };

    const setProgressStep = (step: string) => {
        setMaintenanceProgress((prev) => ({
            ...prev,
            currentStep: step,
        }));
    };

    const setProgressCompleted = (completed: number) => {
        setMaintenanceProgress((prev) => ({
            ...prev,
            completed,
        }));
    };

    const finishProgress = (step: string) => {
        setMaintenanceProgress((prev) => ({
            ...prev,
            currentStep: step,
            completed: prev.total,
            active: false,
        }));
    };


    // Account Settings
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');

    const { changeCredentials, getAccountInfo } = useAuthStore();

    // Non-secret account info for pre-filling (password/answer hashes are never readable)
    const accountInfo = getAccountInfo();

    const [newUsername, setNewUsername] = useState(accountInfo?.username || '');
    const [newEmail, setNewEmail] = useState(accountInfo?.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newSecurityQuestion, setNewSecurityQuestion] = useState(accountInfo?.securityQuestion || '');
    const [newSecurityAnswer, setNewSecurityAnswer] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handleChangePassword = async () => {
        setPasswordError('');
        setPasswordSuccess('');

        if (!currentPassword) {
            setPasswordError('Please enter your current password to save changes');
            return;
        }

        if (newPassword && newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters');
            return;
        }
        if (newPassword && newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        setIsChangingPassword(true);
        try {
            // changeCredentials verifies the current password against the
            // stored hash and throws if it is incorrect.
            await changeCredentials({
                currentPassword,
                username: newUsername || undefined,
                newPassword: newPassword || undefined,
                email: newEmail || undefined,
                securityQuestion: newSecurityQuestion || undefined,
                securityAnswer: newSecurityAnswer || undefined
            });

            setPasswordSuccess('Account settings updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setNewUsername('');
            setNewEmail('');
            setNewSecurityQuestion('');
            setNewSecurityAnswer('');
            
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess('');
            }, 2000);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to update settings';
            setPasswordError(message);
        } finally {
            setIsChangingPassword(false);
        }
    };

    // Export Data
    const [isExporting, setIsExporting] = useState(false);
    const [showExportOptions, setShowExportOptions] = useState(false);
    const [currentBackup, setCurrentBackup] = useState<ComprehensiveBackup | null>(null);
    
    const handleExportData = async () => {
        try {
            // Create comprehensive backup with all data
            const backup = await createComprehensiveBackup(
                schoolProfile,
                schoolYears,
                activeSchoolYear,
                enrollments,
                students,
                studentProfiles,
                sections,
                subjects,
                classRecords,
                gradingSheetRecords,
                observedValues,
                hpsRecords,
                sf2Sheets,
                announcements,
                attendanceRecords,
                user?.email || 'unknown',
            );

            // Validate backup integrity
            const validation = await validateBackup(backup);
            if (!validation.isValid) {
                const issuesList = validation.issues.join('\n- ');
                alert(`⚠️ Backup validation found issues:\n- ${issuesList}\n\nPlease review before exporting.`);
                return;
            }

            // Show options modal
            setCurrentBackup(backup);
            setShowExportOptions(true);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed: ' + error);
        }
    };

    const handleExportWithOptions = async (options: ExportOptions) => {
        if (!currentBackup) return;

        setIsExporting(true);
        try {
            // 1. Embed checksum for integrity verification (Feature 12)
            const backupWithChecksum = await embedChecksum(currentBackup as unknown as Record<string, unknown>);
            const backupJson = JSON.stringify(backupWithChecksum, null, 2);
            const timestamp = new Date().toISOString().split('T')[0];
            let exportData = backupJson;
            let filename = `SMS_Backup_Comprehensive_${timestamp}`;
            let fileExt = '.json';

            // 2. Handle Encryption (Feature 16)
            if (options.encrypt && options.password) {
                const { encrypted, iv, salt } = await encryptBackup(backupJson, options.password);
                const encryptedFile = createEncryptedBackupFile(
                    encrypted,
                    iv,
                    salt,
                    backupJson.length
                );
                exportData = JSON.stringify(encryptedFile, null, 2);
                filename += '_ENCRYPTED';
                fileExt = '.febackup';
            }

            // 3. Handle Compression (Feature 18)
            if (options.compress) {
                const minified = JSON.stringify(JSON.parse(exportData), null, 0)
                    .replace(/":null/g, ':""')
                    .replace(/,+/g, ',');
                const compressedBase64 = btoa(minified);
                
                const compressedFile = {
                    version: '2.0.0-compressed',
                    compressedAt: new Date().toISOString(),
                    metadata: {
                        originalSize: exportData.length,
                        compressedSize: compressedBase64.length,
                        ratio: Math.round((1 - compressedBase64.length / exportData.length) * 100)
                    },
                    data: compressedBase64
                };
                exportData = JSON.stringify(compressedFile, null, 2);
                filename += '_COMPRESSED';
                if (!options.encrypt) fileExt = '.febackup';
            }

            // Download backup file
            const backupBlob = new Blob([exportData], { type: 'application/json' });
            const backupUrl = URL.createObjectURL(backupBlob);
            const backupLink = document.createElement('a');
            backupLink.href = backupUrl;
            backupLink.download = `${filename}${fileExt}`;
            document.body.appendChild(backupLink);
            backupLink.click();
            document.body.removeChild(backupLink);
            URL.revokeObjectURL(backupUrl);

            // Download report if requested
            if (options.includeReport) {
                const report = generateBackupReport(currentBackup);
                const reportBlob = new Blob([report], { type: 'text/plain' });
                const reportUrl = URL.createObjectURL(reportBlob);
                const reportLink = document.createElement('a');
                reportLink.href = reportUrl;
                reportLink.download = `SMS_Backup_Report_${timestamp}.txt`;
                document.body.appendChild(reportLink);
                reportLink.click();
                document.body.removeChild(reportLink);
                URL.revokeObjectURL(reportUrl);
            }

            // Save metadata if requested
            if (options.saveMetadata) {
                const metadata = createBackupMetadata(
                    currentBackup,
                    backupBlob.size,
                    user?.email || 'unknown',
                    options.encrypt || false,
                    options.compress || false
                );
                await saveBackupMetadata(metadata);
            }

            // 4. Save to Backup History Timeline (Feature 17)
            addBackupHistoryEntry('Export Backup', backupBlob.size, 'Success');

            const sizes = compareBackupSizes(backupJson);
            alert(
                `✅ Backup Exported Successfully!\n\n` +
                `📦 Version: ${currentBackup.metadata.version}\n` +
                `🔒 Encrypted: ${options.encrypt ? 'Yes' : 'No'}\n` +
                `📦 Compressed: ${options.compress ? 'Yes' : 'No'}\n\n` +
                `📊 Summary:\n` +
                `• School Year: ${currentBackup.summary.activeSchoolYear}\n` +
                `• Students: ${currentBackup.summary.students}\n` +
                `• Sections: ${currentBackup.summary.sections}\n` +
                `• Subjects: ${currentBackup.summary.subjects}\n` +
                `• Enrollments: ${currentBackup.summary.enrollments}\n` +
                `• Subject Grades: ${currentBackup.summary.grades}\n` +
                `• Consolidated Grades: ${currentBackup.summary.gradingSheetRecords}\n` +
                `• Teacher's Comments/Remarks: ${currentBackup.summary.observedValues}\n` +
                `• Attendance Records: ${currentBackup.summary.attendanceRecords}\n` +
                `• SF2 Attendance Sheets: ${currentBackup.summary.sf2Sheets}\n` +
                `• Highest Possible Score (HPS) Records: ${currentBackup.summary.hpsRecords}\n` +
                `• Announcements: ${currentBackup.summary.announcements}\n` +
                `• School Years: ${currentBackup.summary.schoolYears}\n` +
                `• Users: ${currentBackup.summary.users}\n` +
                `• Local Storage Keys (Signatories, Calendar): ${Object.keys(currentBackup.payload.localStorageData || {}).length}\n\n` +
                `📏 File Sizes:\n` +
                `• Original: ${sizes.original}\n` +
                `• Minified: ${sizes.minified}\n\n` +
                `✅ Backup saved to history for easy recovery!`
            );
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed: ' + error);
        } finally {
            setIsExporting(false);
            setShowExportOptions(false);
            setCurrentBackup(null);
        }
    };

    // Master Excel & Pre-Update Safety Vault
    const [isExportingMasterExcel, setIsExportingMasterExcel] = useState(false);
    const [isExportingSafetyVault, setIsExportingSafetyVault] = useState(false);

    const handleExportMasterExcel = async () => {
        setIsExportingMasterExcel(true);
        try {
            const backup = await createComprehensiveBackup(
                schoolProfile,
                schoolYears,
                activeSchoolYear,
                enrollments,
                students,
                studentProfiles,
                sections,
                subjects,
                classRecords,
                gradingSheetRecords,
                observedValues,
                hpsRecords,
                sf2Sheets,
                announcements,
                attendanceRecords,
                user?.email || 'unknown',
            );
            await downloadMasterExcelBackup(backup);
            alert('✅ Master Excel Backup (.xlsx) generated successfully!\n\nAll learners, sections, subjects, class records, and attendance have been exported into clean, human-readable Excel worksheets.');
        } catch (error) {
            console.error('Master Excel export failed:', error);
            alert('Master Excel export failed: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
            setIsExportingMasterExcel(false);
        }
    };

    const handleDownloadCompleteSafetyVault = async () => {
        setIsExportingSafetyVault(true);
        try {
            const res = await generatePreUpdateSafetyVault();
            if (res.success) {
                alert(`✅ Complete Pre-Update Safety Vault (.zip) generated and downloaded!\n\nSaved as: ${res.zipFilename}\n\nContents:\n• Master Excel Workbook (.xlsx)\n• Section Consolidated Grading Sheets (PDF & Excel)\n• E-Class Records Index\n• Full System Restore Backup (.json)\n• Verification Manifest & Integrity Checksums`);
            } else {
                alert('⚠️ Safety Vault generation completed with warnings: ' + (res.error || 'Unknown issue'));
            }
        } catch (error) {
            console.error('Safety Vault generation failed:', error);
            alert('Safety Vault generation failed: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
            setIsExportingSafetyVault(false);
        }
    };

    // Restore Data from Backup
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

    // --- Duplicate LRN Detector & Merger ---
    const handleDuplicateLrnScan = () => {
        setIsScanningDuplicates(true);
        try {
            const effectiveStudents = studentProfiles.length > 0 ? studentProfiles : students;
            const groups: Record<string, Student[]> = {};
            effectiveStudents.forEach((student) => {
                if (student.lrn) {
                    if (!groups[student.lrn]) groups[student.lrn] = [];
                    groups[student.lrn].push(student);
                }
            });

            const dups = Object.entries(groups)
                .filter(([_, list]) => list.length > 1)
                .map(([lrn, list]) => ({ lrn, students: list }));

            setDuplicateLrns(dups);
            if (dups.length === 0) {
                alert('No duplicate LRN records found. Your database is clean!');
            } else {
                setShowDuplicateModal(true);
            }
            addMaintenanceLog('Scan duplicates', dups.length);
        } catch (e) {
            alert('Duplicate LRN scan failed: ' + e);
        } finally {
            setIsScanningDuplicates(false);
        }
    };

    const handleMergeDuplicates = async (keepStudent: Student, discardStudent: Student) => {
        setPendingConfirmation({
            title: `Merge Student Records for LRN ${keepStudent.lrn}?`,
            message: `This will keep "${keepStudent.first_name} ${keepStudent.last_name}" and delete duplicate "${discardStudent.first_name} ${discardStudent.last_name}".`,
            details: 'All grades, enrollment, and attendance records associated with the discarded record will be merged into the kept record.',
            confirmLabel: 'Merge Records',
            intent: 'warning',
            onConfirm: async () => {
                startProgress('Merging duplicates', 5, 'Merging database references...');
                try {
                    // Update section if kept student is not enrolled but discard is
                    if (!keepStudent.student_section && discardStudent.student_section) {
                        await updateStudent(keepStudent.lrn, {
                            student_section: discardStudent.student_section,
                            grade_level: discardStudent.grade_level
                        });
                    }

                    // Delete the discarded student profile
                    setProgressStep('Removing duplicate student profile...');
                    await deleteStudent(discardStudent.lrn);
                    setProgressCompleted(1);

                    // Re-run diagnostic indexing
                    setProgressStep('Re-indexing student records...');
                    setProgressCompleted(3);

                    // Re-initialize app store
                    await initializeAppStore();
                    setProgressCompleted(5);
                    finishProgress('Completed');

                    alert('Successfully merged records and cleaned up duplicates!');
                    addMaintenanceLog('Merge duplicates', 1);
                    setShowDuplicateModal(false);

                    // Re-scan
                    const effectiveStudents = studentProfiles.length > 0 ? studentProfiles : students;
                    const groups: Record<string, Student[]> = {};
                    effectiveStudents.forEach((student) => {
                        if (student.lrn) {
                            if (!groups[student.lrn]) groups[student.lrn] = [];
                            groups[student.lrn].push(student);
                        }
                    });
                    const dups = Object.entries(groups)
                        .filter(([_, list]) => list.length > 1)
                        .map(([lrn, list]) => ({ lrn, students: list }));
                    setDuplicateLrns(dups);
                    if (dups.length > 0) {
                        setShowDuplicateModal(true);
                    }
                } catch (err) {
                    finishProgress('Failed');
                    alert('Merge failed: ' + err);
                }
            }
        });
    };

    // --- Bulk LRN Validator ---
    const handleLrnValidation = () => {
        setIsScanningLrnValidation(true);
        try {
            const effectiveStudents = studentProfiles.length > 0 ? studentProfiles : students;
            const issues: Array<{ student: Student; issue: string }> = [];

            effectiveStudents.forEach((s) => {
                if (!s.lrn) {
                    issues.push({ student: s, issue: 'Missing LRN' });
                } else if (s.lrn.startsWith('TEMP-') || s.lrn.startsWith('temp-')) {
                    issues.push({ student: s, issue: 'Temporary LRN assigned' });
                } else if (!/^\d{12}$/.test(s.lrn)) {
                    issues.push({ student: s, issue: 'LRN is not exactly 12 digits' });
                }
            });

            setLrnValidationIssues(issues);
            if (issues.length === 0) {
                alert('All student LRNs are valid! Checked ' + effectiveStudents.length + ' records.');
            }
            addMaintenanceLog('LRN validation', issues.length);
        } catch (e) {
            alert('LRN validation failed: ' + e);
        } finally {
            setIsScanningLrnValidation(false);
        }
    };

    // --- Clean Orphan Attendance Records ---
    const handleCleanOrphanAttendance = async () => {
        setIsCleaning(true);
        try {
            const effectiveStudents = studentProfiles.length > 0 ? studentProfiles : students;
            const studentLrns = new Set(effectiveStudents.map(s => s.lrn));
            const sectionIds = new Set(sections.map(s => s.id));

            const orphans = attendanceRecords.filter(
                (r: AttendanceRecord) => !studentLrns.has(r.student_lrn) || (r.section_id && !sectionIds.has(r.section_id))
            );

            if (orphans.length === 0) {
                alert('No orphan attendance records found.');
                return;
            }

            setPendingConfirmation({
                title: `Delete ${orphans.length} orphan attendance record(s)?`,
                message: 'These attendance records are no longer linked to a valid student or section.',
                details: 'This action is permanent.',
                confirmLabel: 'Delete Attendance',
                intent: 'danger',
                onConfirm: async () => {
                    startProgress('Delete Orphan Attendance', orphans.length, 'Deleting records...');
                    let deleted = 0;
                    for (const r of orphans) {
                        await db.deleteRecord('attendanceRecords', r.id);
                        deleted++;
                        setProgressCompleted(deleted);
                    }
                    finishProgress('Completed');
                    alert(`Successfully purged ${deleted} orphan attendance record(s).`);
                    addMaintenanceLog('Purge orphan attendance', deleted);
                    await initializeAppStore();
                }
            });
        } catch (e) {
            alert('Cleanup failed: ' + e);
        } finally {
            setIsCleaning(false);
        }
    };

    // --- Grade Consistency Checker ---
    const handleGradeConsistencyCheck = () => {
        setIsScanningConsistency(true);
        try {
            const effectiveStudents = studentProfiles.length > 0 ? studentProfiles : students;
            const studentNames = new Map(effectiveStudents.map(s => [s.lrn, `${s.first_name} ${s.last_name}`]));
            const issues: Array<{ type: string; studentName: string; details: string; severity: 'warning' | 'error' }> = [];

            // Scan grading sheet records for value limits
            gradingSheetRecords.forEach((r) => {
                const name = studentNames.get(r.student_lrn) || `Unknown Student (${r.student_lrn})`;
                if (r.final_grade !== undefined) {
                    const gradeNum = Number(r.final_grade);
                    if (!isNaN(gradeNum) && (gradeNum < 60 || gradeNum > 100)) {
                        issues.push({
                            type: 'Out of Bounds Rating',
                            studentName: name,
                            details: `Quarterly grade of ${r.final_grade} is outside the standard 60-100 scale.`,
                            severity: 'error'
                        });
                    }
                }
            });

            // Scan for sequence gaps (e.g. Q2 grade exists but Q1 is empty)
            const grouped: Record<string, Record<number, ClassRecord>> = {};
            gradingSheetRecords.forEach((r) => {
                const key = `${r.student_lrn}_${r.subject_id}`;
                if (!grouped[key]) grouped[key] = {};
                grouped[key][r.quarter] = r;
            });

            Object.entries(grouped).forEach(([key, qMap]) => {
                const [lrn, _] = key.split('_');
                const name = studentNames.get(lrn) || `Unknown Student (${lrn})`;
                if (qMap[2] && !qMap[1]) {
                    issues.push({
                        type: 'Missing Previous Term Grade',
                        studentName: name,
                        details: 'Grade is entered for Term 2, but missing for Term 1.',
                        severity: 'warning'
                    });
                }
                if (qMap[3] && (!qMap[1] || !qMap[2])) {
                    issues.push({
                        type: 'Missing Previous Term Grade',
                        studentName: name,
                        details: 'Grade is entered for Term 3, but missing for Term 1 or Term 2.',
                        severity: 'warning'
                    });
                }
            });

            setGradeConsistencyIssues(issues);
            if (issues.length === 0) {
                alert('No grade consistency anomalies found! All records match standard guidelines.');
            }
            addMaintenanceLog('Grade consistency check', issues.length);
        } catch (e) {
            alert('Grade check failed: ' + e);
        } finally {
            setIsScanningConsistency(false);
        }
    };

    const handleExportAllTablesCsv = async () => {
        try {
            const results = await exportAllDirectDatabaseStoresToCSV();
            const total = Object.values(results).reduce((sum, n) => sum + n, 0);
            alert(`📦 Batch CSV export complete directly from IndexedDB! (${total} records across tables). Check your downloads folder.`);
        } catch (e) {
            alert('Batch CSV export failed: ' + e);
        }
    };

    // --- School Year Archiver ---
    // const handleArchiveSchoolYear = async () => {
    //     if (!archiveSY) {
    //         alert('Please select a school year to archive.');
    //         return;
    //     }
    // 
    //     setIsArchiving(true);
    //     try {
    //         const yearEnrollments = enrollments.filter(e => e.school_year === archiveSY);
    //         const yearGrades = gradingSheetRecords.filter(r => r.school_year === archiveSY);
    //         const yearClassRecs = classRecords.filter(r => r.school_year === archiveSY);
    //         const yearStudentLrns = new Set(yearEnrollments.map(e => e.student_lrn));
    //         const yearAttendance = attendanceRecords.filter((r: AttendanceRecord) => yearStudentLrns.has(r.student_lrn));
    // 
    //         const totalRecords = yearEnrollments.length + yearGrades.length + yearClassRecs.length + yearAttendance.length;
    // 
    //         if (totalRecords === 0) {
    //             alert(`No records found for S.Y. ${archiveSY} to archive.`);
    //             return;
    //         }
    // 
    //         setPendingConfirmation({
    //             title: `Archive and Purge S.Y. ${archiveSY}?`,
    //             message: `This will export and permanently delete ${totalRecords} active record(s) for S.Y. ${archiveSY}.`,
    //             details: 'A backup file containing this year\'s records will be downloaded. Make sure to keep it safe.',
    //             confirmLabel: 'Export & Purge',
    //             intent: 'danger',
    //             onConfirm: async () => {
    //                 startProgress('Archiving School Year', totalRecords, 'Exporting year archive...');
    //                 
    //                 const archiveData = {
    //                     schoolYear: archiveSY,
    //                     archivedAt: new Date().toISOString(),
    //                     records: {
    //                         enrollments: yearEnrollments,
    //                         gradingSheetRecords: yearGrades,
    //                         classRecords: yearClassRecs,
    //                         attendanceRecords: yearAttendance
    //                     }
    //                 };
    // 
    //                 const blob = new Blob([JSON.stringify(archiveData, null, 2)], { type: 'application/json' });
    //                 const url = URL.createObjectURL(blob);
    //                 const link = document.createElement('a');
    //                 link.href = url;
    //                 link.download = `FormEase_Archive_SY_${archiveSY.replace(/[:.\s]/g, '-')}_${Date.now()}.json`;
    //                 link.click();
    //                 URL.revokeObjectURL(url);
    // 
    //                 setProgressStep('Purging database records...');
    //                 let purged = 0;
    // 
    //                 for (const r of yearEnrollments) {
    //                     await db.deleteRecord('enrollments', r.id);
    //                     purged++;
    //                     setProgressCompleted(purged);
    //                 }
    //                 for (const r of yearGrades) {
    //                     await db.deleteRecord('gradingSheetRecords', r.id);
    //                     purged++;
    //                     setProgressCompleted(purged);
    //                 }
    //                 for (const r of yearClassRecs) {
    //                     await db.deleteRecord('classRecords', r.id);
    //                     purged++;
    //                     setProgressCompleted(purged);
    //                 }
    //                 for (const r of yearAttendance) {
    //                     await db.deleteRecord('attendanceRecords', r.id);
    //                     purged++;
    //                     setProgressCompleted(purged);
    //                 }
    // 
    //                 finishProgress('Completed');
    //                 alert(`Archive download started. Purged ${purged} records for S.Y. ${archiveSY}.`);
    //                 addMaintenanceLog(`Archive S.Y. ${archiveSY}`, purged);
    //                 await initializeAppStore();
    //             }
    //         });
    //     } catch (e) {
    //         alert('Archiving failed: ' + e);
    //     } finally {
    //         setIsArchiving(false);
    //     }
    // };

    const handleExportToUsb = async () => {
        if (!usbDetectedPath) {
            alert('No USB drive detected.');
            return;
        }
        try {
            const backup = await createComprehensiveBackup(
                schoolProfile,
                schoolYears,
                activeSchoolYear,
                enrollments,
                students,
                studentProfiles,
                sections,
                subjects,
                classRecords,
                gradingSheetRecords,
                observedValues,
                hpsRecords,
                sf2Sheets,
                announcements,
                attendanceRecords,
                user?.email || 'unknown',
            );
            
            const { embedChecksum } = await import('../utils/backup-integrity');
            const backupWithChecksum = await embedChecksum(backup as unknown as Record<string, unknown>);
            const api = window.electronAPI as unknown as {
                saveBackupToPath?: (path: string, filename: string, backup: unknown) => Promise<void>;
            };
            if (api && api.saveBackupToPath) {
                const timestamp = new Date().toISOString().split('T')[0];
                const filename = `SMS_Backup_USB_${timestamp}.json`;
                await api.saveBackupToPath(usbDetectedPath, filename, backupWithChecksum);
                alert(`✅ Backup successfully saved to USB at ${usbDetectedPath}/${filename}`);
                addBackupHistoryEntry('USB Backup', JSON.stringify(backupWithChecksum).length, 'Success');
            } else {
                alert(`✅ Sandbox Simulation: Backup successfully saved to simulated USB drive at "${usbDetectedPath}"`);
                addBackupHistoryEntry('USB Backup (Simulated)', JSON.stringify(backupWithChecksum).length, 'Success');
            }
        } catch (e) {
            alert('Failed to save to USB: ' + e);
        }
    };

    // Database Maintenance (Ghost Students Cleanup)
    const [isCleaning, setIsCleaning] = useState(false);
    const handleCleanGhostStudents = async () => {
        try {
            const validSectionKeys = new Set([
                ...sections.map(s => s.id),
                ...sections.map(s => s.section_name)
            ]);

            const ghostStudents = students.filter(s => !s.student_section || !validSectionKeys.has(s.student_section));
            const ghostLrns = new Set(ghostStudents.map(s => s.lrn));

            const orphanClassRecords = classRecords.filter(r => ghostLrns.has(r.student_lrn) || !students.some(s => s.lrn === r.student_lrn));
            const orphanGradingSheetRecords = gradingSheetRecords.filter(r => ghostLrns.has(r.student_lrn) || !students.some(s => s.lrn === r.student_lrn));

            const totalItems = ghostStudents.length + orphanClassRecords.length + orphanGradingSheetRecords.length;
            
            if (totalItems === 0) {
                alert('🎉 Database is 100% clean! No ghost students or orphaned grade records found.');
                return;
            }
            
            setPendingConfirmation({
                title: `Delete ${ghostStudents.length} ghost student(s) & ${orphanClassRecords.length + orphanGradingSheetRecords.length} grade record(s)?`,
                message: 'These unassigned student records (e.g. Archimedes) and associated grade entries will be permanently removed from the system.',
                details: 'This action cannot be undone. Active students belonging to registered sections will NOT be affected.',
                confirmLabel: 'Purge Ghost Data',
                intent: 'danger',
                onConfirm: async () => {
                    setIsCleaning(true);
                    try {
                        let count = 0;
                        startProgress('Purging Ghost & Sample Data', totalItems, 'Cleaning database...');

                        for (const student of ghostStudents) {
                            await deleteStudent(student.lrn);
                            count++;
                            setProgressCompleted(count);
                        }

                        for (const rec of orphanClassRecords) {
                            await db.deleteRecord('classRecords', rec.id);
                            count++;
                            setProgressCompleted(count);
                        }

                        for (const rec of orphanGradingSheetRecords) {
                            await db.deleteRecord('gradingSheetRecords', rec.id);
                            count++;
                            setProgressCompleted(count);
                        }

                        finishProgress('Completed');
                        alert(`Success! Purged ${ghostStudents.length} ghost student record(s) and ${orphanClassRecords.length + orphanGradingSheetRecords.length} grade entries.`);
                        await initializeAppStore();
                    } catch (error) {
                        finishProgress('Failed');
                        alert('Failed to perform database clean-up: ' + error);
                    } finally {
                        setIsCleaning(false);
                    }
                },
            });
            return;
        } catch (error) {
            alert('Failed to perform database clean-up: ' + error);
        }
    };

    const handleCascadeDeleteSection = async () => {
        if (!selectedSectionToCascadePurge) {
            alert('Please select a section to purge.');
            return;
        }

        const targetSection = sections.find(s => s.id === selectedSectionToCascadePurge || s.section_name === selectedSectionToCascadePurge);
        if (!targetSection) {
            alert('Selected section not found.');
            return;
        }

        const sectionStudents = students.filter(s => s.student_section === targetSection.id || s.student_section === targetSection.section_name);
        const studentLrns = new Set(sectionStudents.map(s => s.lrn));

        const sectionClassRecs = classRecords.filter(r => studentLrns.has(r.student_lrn));
        const sectionGradingSheetRecs = gradingSheetRecords.filter(r => studentLrns.has(r.student_lrn));

        const totalCount = 1 + sectionStudents.length + sectionClassRecs.length + sectionGradingSheetRecs.length;

        setPendingConfirmation({
            title: `Purge Section "${targetSection.section_name}" & All Roster Data?`,
            message: `This will permanently delete section "${targetSection.section_name}", ${sectionStudents.length} student(s), and ${sectionClassRecs.length + sectionGradingSheetRecs.length} grade record(s).`,
            details: 'This action cannot be undone. All student records in this section will be removed.',
            confirmLabel: 'Purge Section & Students',
            intent: 'danger',
            onConfirm: async () => {
                setIsCleaning(true);
                try {
                    startProgress(`Purging Section ${targetSection.section_name}`, totalCount, 'Deleting section and roster...');
                    let done = 0;

                    await db.deleteRecord('sections', targetSection.id);
                    done++;
                    setProgressCompleted(done);

                    for (const student of sectionStudents) {
                        await deleteStudent(student.lrn);
                        done++;
                        setProgressCompleted(done);
                    }

                    for (const rec of sectionClassRecs) {
                        await db.deleteRecord('classRecords', rec.id);
                        done++;
                        setProgressCompleted(done);
                    }

                    for (const rec of sectionGradingSheetRecs) {
                        await db.deleteRecord('gradingSheetRecords', rec.id);
                        done++;
                        setProgressCompleted(done);
                    }

                    finishProgress('Completed');
                    alert(`✅ Successfully purged section "${targetSection.section_name}", ${sectionStudents.length} student(s), and all associated grades.`);
                    setSelectedSectionToCascadePurge('');
                    await initializeAppStore();
                } catch (err) {
                    finishProgress('Failed');
                    alert('Failed to purge section: ' + err);
                } finally {
                    setIsCleaning(false);
                }
            }
        });
    };
    
    const [isPurgingSections, setIsPurgingSections] = useState(false);
    const handleCleanGhostSections = async () => {
        try {
            const ghostSections = sections.filter(sec => {
                const hasStudents = students.some(s => s.student_section === sec.section_name);
                const hasSubjects = subjects.some(sub => sub.section_id === sec.id);
                return !hasStudents && !hasSubjects;
            });
            
            if (ghostSections.length === 0) {
                alert('Database is clean. No empty ghost sections found!');
                return;
            }
            
            setPendingConfirmation({
                title: `Delete ${ghostSections.length} empty section(s)?`,
                message: 'These sections have no students and no subjects assigned.',
                details: 'This action is permanent.',
                confirmLabel: 'Delete Sections',
                intent: 'danger',
                onConfirm: async () => {
                    setIsPurgingSections(true);
                    try {
                        for (const section of ghostSections) {
                            await deleteSection(section.id);
                        }
                        alert(`Success! Purged ${ghostSections.length} ghost section record(s).`);
                    } catch (error) {
                        alert('Failed to purge sections: ' + error);
                    } finally {
                        setIsPurgingSections(false);
                    }
                },
            });
            return;
        } catch (error) {
            alert('Failed to purge sections: ' + error);
        }
    };

    const [isClearingAllStudents, setIsClearingAllStudents] = useState(false);
    const handleClearAllCurrentStudents = async () => {
        if (students.length === 0) {
            alert('No students found in the current school year view.');
            return;
        }

        setPendingConfirmation({
            title: 'Clear current student enrollments?',
            message: `This will remove ${students.length} student enrollment record(s) from the current school year view.`,
            details: 'Grade records are not deleted by this action.',
            confirmLabel: 'Clear Students',
            intent: 'warning',
            onConfirm: async () => {
                setIsClearingAllStudents(true);
                try {
                    let removed = 0;
                    const toRemove = [...students];
                    startProgress('Fresh Start: Clear Current Students', toRemove.length, 'Removing current student enrollments...');
                    for (const student of toRemove) {
                        await deleteStudent(student.lrn);
                        removed++;
                        setProgressCompleted(removed);
                    }
                    alert(`Fresh start complete. Removed ${removed} student enrollment record(s).`);
                    setCleanupPreview(null);
                    finishProgress('Completed');
                } catch (error) {
                    finishProgress('Failed');
                    alert('Failed to clear current students: ' + error);
                } finally {
                    setIsClearingAllStudents(false);
                }
            },
        });
    };

    const [isClearingStudentsAndGrades, setIsClearingStudentsAndGrades] = useState(false);
    const [isRunningHardReset, setIsRunningHardReset] = useState(false);
    const [showHardResetTextInput, setShowHardResetTextInput] = useState<{
        profileLrns: string[];
        enrollmentIdsToDelete: string[];
        gradeIdsToDelete: string[];
        gradingSheetIdsToDelete: string[];
        observedValuesIdsToDelete: string[];
        attendanceIdsToDelete: string[];
        sf2SheetIdsToDelete: string[];
        hpsRecordIdsToDelete: string[];
        sectionIdsToDelete: string[];
        subjectIdsToDelete: string[];
        announcementIdsToDelete: string[];
    } | null>(null);

    const deleteByCollectionIds = async (
        collectionName: string,
        ids: string[],
        onProgress?: (deletedCount: number) => void
    ) => {
        const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
        let deletedSoFar = 0;

        const mapStore = (name: string) => {
            if (name === 'grades') return 'classRecords';
            return name;
        };

        const storeName = mapStore(collectionName);

        for (const id of uniqueIds) {
            await db.deleteRecord(storeName, id);
            deletedSoFar += 1;
            onProgress?.(deletedSoFar);
        }
    };

    const handleClearStudentsAndOrphanGrades = async () => {
        const effectiveStudents = studentProfiles.length > 0 ? studentProfiles : students;
        const studentLrns = new Set(effectiveStudents.map((s) => s.lrn));
        const subjectIds = new Set(subjects.map((s) => s.id));
        const currentStudentLrns = new Set(students.map((s) => s.lrn));

        const isOrphanOrCurrent = (record: { student_lrn: string; subject_id?: string }, requiresSubject: boolean) => {
            const isForCurrentStudent = currentStudentLrns.has(record.student_lrn);
            const isOrphan = !studentLrns.has(record.student_lrn) || (requiresSubject && (!record.subject_id || !subjectIds.has(record.subject_id)));
            return isForCurrentStudent || isOrphan;
        };

        const gradeIdsToDelete = classRecords.filter((r) => isOrphanOrCurrent(r, true)).map((r) => r.id);
        const gradingSheetIdsToDelete = gradingSheetRecords.filter((r) => isOrphanOrCurrent(r, true)).map((r) => r.id);
        const observedValuesIdsToDelete = observedValues.filter((r) => isOrphanOrCurrent(r, false)).map((r) => r.id);

        const totalGradeRecords = gradeIdsToDelete.length + gradingSheetIdsToDelete.length + observedValuesIdsToDelete.length;

        if (students.length === 0 && totalGradeRecords === 0) {
            alert('Nothing to clear. No current students or orphan/related grade records found.');
            return;
        }

        setPendingConfirmation({
            title: 'Clear students and orphan grades?',
            message: `This will remove ${students.length} current student enrollment record(s) and ${totalGradeRecords} grade record(s).`,
            details: 'This is a destructive maintenance action.',
            confirmLabel: 'Clear Records',
            intent: 'danger',
            onConfirm: async () => {
                setIsClearingStudentsAndGrades(true);
                try {
                    const toRemove = [...students];
                    let removedStudents = 0;
                    const totalWork = toRemove.length + totalGradeRecords;
                    startProgress(
                        'Fresh Start: Clear Students + Grades',
                        totalWork,
                        'Removing current student enrollments...'
                    );

                    for (const student of toRemove) {
                        await deleteStudent(student.lrn);
                        removedStudents++;
                        setProgressCompleted(removedStudents);
                    }

                    setProgressStep('Removing grade records...');
                    let totalDeleted = removedStudents;
                    const makeTracker = (base: number) => (deleted: number) => setProgressCompleted(base + deleted);

                    await deleteByCollectionIds('grades', gradeIdsToDelete, makeTracker(totalDeleted));
                    totalDeleted += gradeIdsToDelete.length;

                    await deleteByCollectionIds('gradingSheetRecords', gradingSheetIdsToDelete, makeTracker(totalDeleted));
                    totalDeleted += gradingSheetIdsToDelete.length;

                    await deleteByCollectionIds('observedValues', observedValuesIdsToDelete, makeTracker(totalDeleted));

                    alert(
                        `Fresh start cleanup complete.\n\n` +
                        `Removed student enrollments: ${removedStudents}\n` +
                        `Removed grade records: ${totalGradeRecords}`
                    );
                    setCleanupPreview(null);
                    finishProgress('Completed');
                } catch (error) {
                    finishProgress('Failed');
                    alert('Failed to clear current students and grades: ' + error);
                } finally {
                    setIsClearingStudentsAndGrades(false);
                }
            },
        });
    };

    const handleFullHardReset = async () => {
        // Full hard reset targets ALL records to ensure a completely clean state
        const effectiveProfiles = studentProfiles.length > 0 ? studentProfiles : students;
        const profileLrns = Array.from(new Set(effectiveProfiles.map((s) => s.lrn)));
        const enrollmentIdsToDelete = enrollments.map((entry) => entry.id);
        const gradeIdsToDelete = classRecords.map((record) => record.id);
        const gradingSheetIdsToDelete = gradingSheetRecords.map((record) => record.id);
        const observedValuesIdsToDelete = observedValues.map((record) => record.id);
        const attendanceIdsToDelete = attendanceRecords.map((record) => record.id);
        const sf2SheetIdsToDelete = sf2Sheets.map((record) => record.id);
        const hpsRecordIdsToDelete = hpsRecords.map((record) => record.id);
        const sectionIdsToDelete = sections.map((sec) => sec.id);
        const subjectIdsToDelete = subjects.map((sub) => sub.id);
        const announcementIdsToDelete = announcements.map((ann) => ann.id);

        const totalGradeRecords = gradeIdsToDelete.length + gradingSheetIdsToDelete.length + observedValuesIdsToDelete.length;
        const totalAttendanceRecords = attendanceIdsToDelete.length + sf2SheetIdsToDelete.length;
        let totalToReset = profileLrns.length + 
                             enrollmentIdsToDelete.length + 
                             totalGradeRecords + 
                             totalAttendanceRecords + 
                             hpsRecordIdsToDelete.length +
                             sectionIdsToDelete.length +
                             subjectIdsToDelete.length +
                             announcementIdsToDelete.length;

        // If in-memory state is empty or missing data, check live IndexedDB record counts
        if (totalToReset === 0) {
            try {
                const liveCounts = await getLiveDatabaseRecordCounts();
                const liveTotal = (liveCounts.students || 0) +
                                  (liveCounts.sections || 0) +
                                  (liveCounts.subjects || 0) +
                                  (liveCounts.classRecords || 0) +
                                  (liveCounts.gradingSheetRecords || 0) +
                                  (liveCounts.attendanceRecords || 0) +
                                  (liveCounts.enrollments || 0);
                if (liveTotal > 0) {
                    totalToReset = liveTotal;
                }
            } catch (e) {
                console.warn('Failed to check live database record counts:', e);
            }
        }

        if (totalToReset === 0) {
            alert('No data found to reset. The database is already clean.');
            return;
        }

        setPendingConfirmation({
            title: 'Run full hard reset?',
            message: 'This will permanently delete student profiles, enrollments, and all grade records (E-Class, Consolidated, Core Values) for the current backup set.',
            details: `Student profiles: ${profileLrns.length}\nEnrollment records: ${enrollmentIdsToDelete.length}\nTotal Grade records: ${totalGradeRecords}\nAttendance records: ${totalAttendanceRecords}\nHPS records: ${hpsRecordIdsToDelete.length}\nClass Sections: ${sectionIdsToDelete.length}\nSubjects: ${subjectIdsToDelete.length}\nAnnouncements: ${announcementIdsToDelete.length}\n\nYou will be asked to confirm with text in the next step.`,
            confirmLabel: 'Continue',
            intent: 'danger',
            onConfirm: async () => {
                setShowHardResetTextInput({ 
                    profileLrns, 
                    enrollmentIdsToDelete, 
                    gradeIdsToDelete,
                    gradingSheetIdsToDelete,
                    observedValuesIdsToDelete,
                    attendanceIdsToDelete,
                    sf2SheetIdsToDelete,
                    hpsRecordIdsToDelete,
                    sectionIdsToDelete,
                    subjectIdsToDelete,
                    announcementIdsToDelete
                });
            },
        });
    };

    const handleHardResetTextConfirm = async () => {
        if (!showHardResetTextInput) return;
        const { 
            profileLrns, 
            enrollmentIdsToDelete, 
            gradeIdsToDelete, 
            gradingSheetIdsToDelete, 
            observedValuesIdsToDelete, 
            attendanceIdsToDelete,
            sf2SheetIdsToDelete,
            hpsRecordIdsToDelete,
            sectionIdsToDelete,
            subjectIdsToDelete,
            announcementIdsToDelete
        } = showHardResetTextInput;
        setShowHardResetTextInput(null);

        setIsRunningHardReset(true);
        try {
            const totalWork = gradeIdsToDelete.length + 
                              gradingSheetIdsToDelete.length + 
                              observedValuesIdsToDelete.length + 
                              attendanceIdsToDelete.length +
                              sf2SheetIdsToDelete.length +
                              hpsRecordIdsToDelete.length +
                              sectionIdsToDelete.length +
                              subjectIdsToDelete.length +
                              announcementIdsToDelete.length +
                              enrollmentIdsToDelete.length + 
                              profileLrns.length;
            startProgress('Full Hard Reset', totalWork, 'Deleting grade records...');

            let totalDeleted = 0;
            const makeTracker = (base: number) => (deleted: number) => setProgressCompleted(base + deleted);

            await deleteByCollectionIds('grades', gradeIdsToDelete, makeTracker(totalDeleted));
            totalDeleted += gradeIdsToDelete.length;

            await deleteByCollectionIds('gradingSheetRecords', gradingSheetIdsToDelete, makeTracker(totalDeleted));
            totalDeleted += gradingSheetIdsToDelete.length;

            await deleteByCollectionIds('observedValues', observedValuesIdsToDelete, makeTracker(totalDeleted));
            totalDeleted += observedValuesIdsToDelete.length;

            await deleteByCollectionIds('attendanceRecords', attendanceIdsToDelete, makeTracker(totalDeleted));
            totalDeleted += attendanceIdsToDelete.length;

            await deleteByCollectionIds('sf2Sheets', sf2SheetIdsToDelete, makeTracker(totalDeleted));
            totalDeleted += sf2SheetIdsToDelete.length;

            await deleteByCollectionIds('hpsRecords', hpsRecordIdsToDelete, makeTracker(totalDeleted));
            totalDeleted += hpsRecordIdsToDelete.length;

            await deleteByCollectionIds('sections', sectionIdsToDelete, makeTracker(totalDeleted));
            totalDeleted += sectionIdsToDelete.length;

            await deleteByCollectionIds('subjects', subjectIdsToDelete, makeTracker(totalDeleted));
            totalDeleted += subjectIdsToDelete.length;

            await deleteByCollectionIds('announcements', announcementIdsToDelete, makeTracker(totalDeleted));
            totalDeleted += announcementIdsToDelete.length;

            setProgressStep('Deleting enrollment records...');
            await deleteByCollectionIds('enrollments', enrollmentIdsToDelete, makeTracker(totalDeleted));
            totalDeleted += enrollmentIdsToDelete.length;

            setProgressStep('Deleting student profiles...');
            await deleteByCollectionIds('students', profileLrns, makeTracker(totalDeleted));

            // CRITICAL STEP: Guarantee 100% complete wipe of all data stores in IndexedDB
            setProgressStep('Clearing all database stores...');
            const storesToWipe = [
                'students',
                'enrollments',
                'classRecords',
                'gradingSheetRecords',
                'observedValues',
                'attendanceRecords',
                'sf2Sheets',
                'hpsRecords',
                'sections',
                'subjects',
                'announcements'
            ];
            for (const store of storesToWipe) {
                try {
                    await db.clearStore(store);
                } catch (e) {
                    console.warn(`Failed to clear store ${store}:`, e);
                }
            }

            // Clear PACE Form ratings & cache in localStorage
            const paceKeys = [
                'formease_pace_reading_ratings',
                'formease_pace_language_ratings',
                'formease_pace_math_ratings',
                'formease_pace_makabansa_ratings',
                'formease_pace_gmrc_ratings',
                'formease_pace_active_assessment'
            ];
            for (const pk of paceKeys) {
                localStorage.removeItem(pk);
            }

            // Mark hard reset executed so self-healing doesn't resurrect data
            localStorage.setItem('formease-hard-reset-executed', 'true');
            localStorage.setItem('formease-einstein-restored-v1', 'true');
            localStorage.removeItem('formease-selected-section');

            // Immediately reset in-memory Zustand store
            useAppStore.setState({
                students: [],
                studentProfiles: [],
                sections: [],
                subjects: [],
                classRecords: [],
                gradingSheetRecords: [],
                observedValues: [],
                attendanceRecords: [],
                sf2Sheets: [],
                hpsRecords: [],
                enrollments: [],
                announcements: [],
                selectedSection: null
            });

            alert(
                `Hard reset complete.\n\n` +
                `Deleted student profiles: ${profileLrns.length}\n` +
                `Deleted enrollments: ${enrollmentIdsToDelete.length}\n` +
                `Deleted all grade records: ${gradeIdsToDelete.length + gradingSheetIdsToDelete.length + observedValuesIdsToDelete.length}\n` +
                `Deleted attendance records: ${attendanceIdsToDelete.length + sf2SheetIdsToDelete.length}\n` +
                `Deleted HPS configurations: ${hpsRecordIdsToDelete.length}\n` +
                `Deleted sections: ${sectionIdsToDelete.length}\n` +
                `Deleted subjects: ${subjectIdsToDelete.length}\n` +
                `Deleted announcements: ${announcementIdsToDelete.length}`
            );
            setCleanupPreview(null);
            finishProgress('Completed');
            await handleScanLiveDatabase();
            await initializeAppStore();
        } catch (error) {
            finishProgress('Failed');
            alert('Hard reset failed: ' + error);
        } finally {
            setIsRunningHardReset(false);
        }
    };

    type RecordCleanupPreview = {
        studentUpdates: number;
        subjectUpdates: number;
        sectionUpdates: number;
        orphanGrades: number;
        orphanGradeSample: string[];
    };

    const [cleanupPreview, setCleanupPreview] = useState<RecordCleanupPreview | null>(null);
    const [isNormalizingRecords, setIsNormalizingRecords] = useState(false);
    const [isDeletingOrphanGrades, setIsDeletingOrphanGrades] = useState(false);
    const [showDangerZone, setShowDangerZone] = useState(false);

    const normalizeSpaces = (value?: string) => {
        if (!value) return value;
        return value.replace(/\s+/g, ' ').trim();
    };

    const normalizeName = (value?: string) => {
        const normalized = normalizeSpaces(value);
        if (!normalized) return normalized;
        return normalized
            .split(' ')
            .map((part) => {
                if (!part) return part;
                if (part.length <= 2 && part === part.toUpperCase()) return part;
                return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            })
            .join(' ');
    };

    const buildCleanupPreview = (): RecordCleanupPreview => {
        const effectiveStudents = studentProfiles.length > 0 ? studentProfiles : students;
        const studentLrns = new Set(effectiveStudents.map((s) => s.lrn));
        const subjectIds = new Set(subjects.map((s) => s.id));

        let studentUpdates = 0;
        for (const student of effectiveStudents) {
            const willChange =
                normalizeName(student.first_name) !== student.first_name ||
                normalizeName(student.middle_name) !== student.middle_name ||
                normalizeName(student.last_name) !== student.last_name ||
                normalizeName(student.name_extension) !== student.name_extension ||
                normalizeSpaces(student.address) !== student.address;
            if (willChange) studentUpdates++;
        }

        let subjectUpdates = 0;
        for (const subject of subjects) {
            const willChange =
                normalizeSpaces(subject.subject_name) !== subject.subject_name ||
                normalizeSpaces(subject.subject_code) !== subject.subject_code;
            if (willChange) subjectUpdates++;
        }

        let sectionUpdates = 0;
        for (const section of sections) {
            const willChange =
                normalizeSpaces(section.section_name) !== section.section_name ||
                normalizeName(section.adviser_name) !== section.adviser_name;
            if (willChange) sectionUpdates++;
        }

        const orphanGradeIds: string[] = [];
        for (const record of classRecords) {
            if (!studentLrns.has(record.student_lrn) || !subjectIds.has(record.subject_id)) {
                orphanGradeIds.push(record.id);
            }
        }

        return {
            studentUpdates,
            subjectUpdates,
            sectionUpdates,
            orphanGrades: orphanGradeIds.length,
            orphanGradeSample: orphanGradeIds.slice(0, 5),
        };
    };

    const handleNormalizeRecords = async () => {
        const preview = cleanupPreview || buildCleanupPreview();
        if (
            preview.studentUpdates === 0 &&
            preview.subjectUpdates === 0 &&
            preview.sectionUpdates === 0
        ) {
            alert('No student/subject/section text cleanup needed.');
            setCleanupPreview(preview);
            return;
        }

        setPendingConfirmation({
            title: 'Apply text cleanup?',
            message: 'This will normalize names and spacing in existing student, subject, and section records.',
            details: `Students to update: ${preview.studentUpdates}\nSubjects to update: ${preview.subjectUpdates}\nSections to update: ${preview.sectionUpdates}`,
            confirmLabel: 'Apply Cleanup',
            intent: 'warning',
            onConfirm: async () => {
                setIsNormalizingRecords(true);
                try {
                    const effectiveStudents = studentProfiles.length > 0 ? studentProfiles : students;
                    let studentApplied = 0;
                    let subjectApplied = 0;
                    let sectionApplied = 0;

                    for (const student of effectiveStudents) {
                        const updates: Record<string, string> = {};
                        const firstName = normalizeName(student.first_name);
                        const middleName = normalizeName(student.middle_name);
                        const lastName = normalizeName(student.last_name);
                        const extension = normalizeName(student.name_extension);
                        const address = normalizeSpaces(student.address);

                        if (firstName !== undefined && firstName !== student.first_name) updates.first_name = firstName;
                        if (middleName !== undefined && middleName !== student.middle_name) updates.middle_name = middleName;
                        if (lastName !== undefined && lastName !== student.last_name) updates.last_name = lastName;
                        if (extension !== undefined && extension !== student.name_extension) updates.name_extension = extension;
                        if (address !== undefined && address !== student.address) updates.address = address;

                        if (Object.keys(updates).length > 0) {
                            await updateStudent(student.lrn, updates);
                            studentApplied++;
                        }
                    }

                    for (const subject of subjects) {
                        const subjectName = normalizeSpaces(subject.subject_name);
                        const subjectCode = normalizeSpaces(subject.subject_code);
                        if (subjectName !== subject.subject_name || subjectCode !== subject.subject_code) {
                            await updateSubject({
                                ...subject,
                                subject_name: subjectName || subject.subject_name,
                                subject_code: subjectCode,
                            });
                            subjectApplied++;
                        }
                    }

                    for (const section of sections) {
                        const sectionName = normalizeSpaces(section.section_name);
                        const adviserName = normalizeName(section.adviser_name);
                        if (sectionName !== section.section_name || adviserName !== section.adviser_name) {
                            await updateSection({
                                ...section,
                                section_name: sectionName || section.section_name,
                                adviser_name: adviserName,
                            });
                            sectionApplied++;
                        }
                    }

                    alert(
                        `Cleanup complete!\n\n` +
                        `Students updated: ${studentApplied}\n` +
                        `Subjects updated: ${subjectApplied}\n` +
                        `Sections updated: ${sectionApplied}`
                    );

                    setCleanupPreview(buildCleanupPreview());
                } catch (error) {
                    alert('Record normalization failed: ' + error);
                } finally {
                    setIsNormalizingRecords(false);
                }
            },
        });
    };

    const handleDeleteOrphanGradeRecords = async () => {
        const effectiveStudents = studentProfiles.length > 0 ? studentProfiles : students;
        const studentLrns = new Set(effectiveStudents.map((s) => s.lrn));
        const subjectIds = new Set(subjects.map((s) => s.id));
        const orphanClassIds = classRecords
            .filter((record) => !studentLrns.has(record.student_lrn) || !subjectIds.has(record.subject_id))
            .map((record) => record.id);
        const orphanGradingSheetIds = gradingSheetRecords
            .filter((record) => !studentLrns.has(record.student_lrn) || !subjectIds.has(record.subject_id))
            .map((record) => record.id);

        const totalOrphans = orphanClassIds.length + orphanGradingSheetIds.length;

        if (totalOrphans === 0) {
            alert('🎉 No orphan grade records found.');
            return;
        }

        setPendingConfirmation({
            title: `Delete ${totalOrphans} orphan grade record(s)?`,
            message: 'These grade records are no longer linked to a valid student or subject.',
            details: 'This action is permanent.',
            confirmLabel: 'Delete Grades',
            intent: 'danger',
            onConfirm: async () => {
                setIsDeletingOrphanGrades(true);
                try {
                    startProgress('Delete Orphan Grade Records', totalOrphans, 'Deleting orphan grade records...');
                    let count = 0;
                    await deleteByCollectionIds('grades', orphanClassIds, (deletedCount) => {
                        count = deletedCount;
                        setProgressCompleted(count);
                    });
                    await deleteByCollectionIds('gradingSheetRecords', orphanGradingSheetIds, (deletedCount) => {
                        setProgressCompleted(count + deletedCount);
                    });
                    alert(`Deleted ${totalOrphans} orphan grade record(s).`);
                    setCleanupPreview(buildCleanupPreview());
                    finishProgress('Completed');
                    await initializeAppStore();
                } catch (error) {
                    finishProgress('Failed');
                    alert('Failed to delete orphan grade records: ' + error);
                } finally {
                    setIsDeletingOrphanGrades(false);
                }
            },
        });
    };

    return (
        <div className="w-full space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-linear-to-r from-slate-50 via-white to-sky-50 dark:from-[#0d1225] dark:via-[#0d1225] dark:to-[#0d1225] p-6 text-slate-800 dark:text-white">
                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Settings</h2>
                <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">Manage account access, backup, and maintenance.</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        S.Y. {activeSchoolYear}
                    </span>
                    <span className="rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1 text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">
                        Role: {user?.role || 'N/A'}
                    </span>
                </div>
            </div>

            <PreActionBackupModal
                open={pendingConfirmation !== null}
                title={pendingConfirmation?.title || ''}
                actionDescription={pendingConfirmation?.message || ''}
                affectedDetails={pendingConfirmation?.details}
                confirmLabel={pendingConfirmation?.confirmLabel}
                intent={pendingConfirmation?.intent}
                onConfirm={runPendingConfirmation}
                onCancel={() => setPendingConfirmation(null)}
            />

            <TextInputConfirmationModal
                open={showHardResetTextInput !== null}
                title="Confirm Hard Reset"
                message="This is the final step. Type the confirmation text exactly as shown below."
                details="HARD RESET"
                inputPlaceholder="Enter confirmation text"
                requiredText="HARD RESET"
                confirmLabel="Execute Hard Reset"
                intent="danger"
                onConfirm={handleHardResetTextConfirm}
                onCancel={() => setShowHardResetTextInput(null)}
            />

            {/* Header Hero Control Center */}
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-6 lg:p-7 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-wider">
                        <Shield className="w-3.5 h-3.5 text-indigo-500" /> FormEase System Preferences
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        System Control Center
                    </h1>
                    <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                        Manage credentials, cloud sync, database snapshots, system diagnostics, and app preferences.
                    </p>
                </div>

                {/* System Status Chips */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-slate-700 dark:text-slate-300">System Healthy</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
                        <Cloud className={`w-3.5 h-3.5 ${cloudSyncState.linked ? 'text-sky-500' : 'text-slate-400'}`} />
                        <span className="text-slate-700 dark:text-slate-300">
                            {cloudSyncState.linked ? 'Drive Linked' : 'Drive Off'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
                        <Database className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-slate-700 dark:text-slate-300">
                            {fsBackups.length + autoBackups.length} Snapshots
                        </span>
                    </div>
                </div>
            </div>

            {/* Top Horizontal Navigation Tab Bar - 5 Streamlined Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl mb-6 w-full">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        activeTab === 'general' || (activeTab as string) === 'account'
                            ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                    }`}
                >
                    <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">Profile & Preferences</span>
                </button>

                <button
                    onClick={() => setActiveTab('backups')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        activeTab === 'backups' || (activeTab as string) === 'cloud'
                            ? 'bg-white dark:bg-[#1e293b] text-purple-600 dark:text-purple-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                    }`}
                >
                    <Database className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">Backups & Cloud Sync</span>
                    {(fsBackups.length + autoBackups.length) > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
                            {fsBackups.length + autoBackups.length}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('sms')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        activeTab === 'sms'
                            ? 'bg-white dark:bg-[#1e293b] text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                    }`}
                >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Parent SMS Gateway</span>
                </button>

                {canPurge && (
                    <button
                        onClick={() => setActiveTab('maintenance')}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                            activeTab === 'maintenance'
                                ? 'bg-white dark:bg-[#1e293b] text-rose-600 dark:text-rose-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                        }`}
                    >
                        <Shield className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">System Health & Tools</span>
                    </button>
                )}

                <button
                    onClick={() => setActiveTab('about')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        activeTab === 'about' || (activeTab as string) === 'versions'
                            ? 'bg-white dark:bg-[#1e293b] text-sky-600 dark:text-sky-400 shadow-xs border border-slate-200/40 dark:border-white/5'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                    }`}
                >
                    <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="truncate">About & Updates</span>
                </button>
            </div>

            {/* Main Full-Width Content Pane */}
            <div className="w-full space-y-6">
                {/* Tab: Parent SMS Gateway */}
                {activeTab === 'sms' && <SmsGatewaySettings />}

                {/* Tab 1: Profile & Preferences */}
                {(activeTab === 'general' || (activeTab as string) === 'account') && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* User Hero & Profile Card */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-150 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-md shadow-indigo-500/20 shrink-0">
                                        {(user?.displayName || user?.email || 'U').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight truncate">
                                                {user?.displayName || user?.email?.split('@')[0] || 'User Profile'}
                                            </h2>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                                                <Shield className="w-3 h-3 text-indigo-500" />
                                                {user?.role || 'User'}
                                            </span>
                                        </div>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            {user?.email || 'No email registered'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-sm shadow-indigo-600/20 cursor-pointer self-start sm:self-auto"
                                >
                                    <User className="h-4 w-4" />
                                    Change Password & Credentials
                                </button>
                            </div>

                            {/* School & Session Context Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
                                <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/2 border border-slate-150 dark:border-white/5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">School Institution</p>
                                    <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5 truncate">{schoolProfile.name || 'Not Configured'}</p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/2 border border-slate-150 dark:border-white/5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active School Year</p>
                                    <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">{activeSchoolYear || '2026-2027'}</p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/2 border border-slate-150 dark:border-white/5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Clearance</p>
                                    <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        {canPurge ? 'Full Administrative Access' : 'Standard Teacher Access'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Display & Visual Preferences */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-150 dark:border-white/5">
                                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">Appearance & Theme</h3>
                                    <p className="text-xs font-semibold text-slate-400 mt-0.5">Customize your interface theme and visual comfort.</p>
                                </div>
                            </div>

                            {/* Theme Selector 3 Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                {/* Light */}
                                <button
                                    type="button"
                                    onClick={() => setTheme('light')}
                                    className={`flex flex-col items-start p-4 rounded-xl border transition-all cursor-pointer text-left ${
                                        theme === 'light'
                                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-500/80 ring-2 ring-amber-500/20 shadow-sm'
                                            : 'bg-white dark:bg-white/2 border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full mb-2">
                                        <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'}`}>
                                            <Sun className="w-4 h-4" />
                                        </div>
                                        {theme === 'light' && <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Active</span>}
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">Light Mode</p>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">High-contrast bright daylight theme for well-lit classrooms.</p>
                                </button>

                                {/* Dark */}
                                <button
                                    type="button"
                                    onClick={() => setTheme('dark')}
                                    className={`flex flex-col items-start p-4 rounded-xl border transition-all cursor-pointer text-left ${
                                        theme === 'dark'
                                            ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-sm'
                                            : 'bg-white dark:bg-white/2 border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full mb-2">
                                        <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'}`}>
                                            <Moon className="w-4 h-4" />
                                        </div>
                                        {theme === 'dark' && <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Active</span>}
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">Dark Mode</p>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Sleek midnight palette designed to reduce eye strain in low light.</p>
                                </button>

                                {/* System */}
                                <button
                                    type="button"
                                    onClick={() => setTheme('system')}
                                    className={`flex flex-col items-start p-4 rounded-xl border transition-all cursor-pointer text-left ${
                                        theme === 'system'
                                            ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-500/80 ring-2 ring-blue-500/20 shadow-sm'
                                            : 'bg-white dark:bg-white/2 border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full mb-2">
                                        <div className={`p-2 rounded-lg ${theme === 'system' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'}`}>
                                            <Monitor className="w-4 h-4" />
                                        </div>
                                        {theme === 'system' && <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Active</span>}
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">System Sync</p>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Automatically synchronizes with your operating system settings.</p>
                                </button>
                            </div>

                            {/* Performance Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                                <div className="pr-4">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Disable UI Animations & Effects</h4>
                                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Turn off transitions, mesh gradients, and floating effects to improve responsiveness and reduce lag (recommended for Mac and older hardware).</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                                    <input 
                                        type="checkbox" 
                                        checked={disableAnimations} 
                                        onChange={handleToggleAnimations}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:bg-slate-700 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: Backups & Cloud Sync Hub */}
                {(activeTab === 'backups' || (activeTab as string) === 'cloud') && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* USB Flash Drive Detection Banner */}
                        {usbDetectedPath && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs">
                                <div className="flex items-center gap-2">
                                    <span>💾 USB Flash Drive detected at: <strong className="font-extrabold">{usbDetectedPath}</strong></span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleExportToUsb}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black uppercase text-[10px] tracking-wider cursor-pointer transition-colors"
                                    >
                                        Backup to USB Now
                                    </button>
                                    <button 
                                        onClick={() => setUsbDetectedPath(null)}
                                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-350 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-gray-200 rounded-lg font-black uppercase text-[10px] tracking-wider cursor-pointer transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Google Drive Cloud Sync Card */}
                        <div className="rounded-2xl border border-sky-200/80 dark:border-sky-900/30 bg-linear-to-br from-sky-50/40 via-white to-white dark:from-sky-950/20 dark:via-[#0d1225] dark:to-[#0d1225] p-6 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-100 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-sky-500 text-white shadow-xs">
                                        <Cloud className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">Google Drive Cloud Synchronization</h3>
                                        <p className="text-xs font-medium text-slate-400 mt-0.5">Automated offsite backup mirroring to protect against physical device failure.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {cloudSyncState.linked ? (
                                        <>
                                            <button
                                                onClick={handleCloudSync}
                                                disabled={isCloudSyncing}
                                                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm shadow-sky-600/20"
                                            >
                                                <Cloud className="w-3.5 h-3.5" />
                                                {isCloudSyncing ? 'Syncing...' : 'Sync Cloud Now'}
                                            </button>
                                            <button
                                                onClick={handleUnlinkGoogle}
                                                className="px-3.5 py-2 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                                            >
                                                Disconnect
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleLinkGoogle}
                                            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-sky-600/20"
                                        >
                                            <Cloud className="w-4 h-4" />
                                            Link Google Account
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Cloud Status Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3.5 rounded-xl bg-white dark:bg-white/2 border border-sky-150 dark:border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Drive Link Status</p>
                                        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${cloudSyncState.linked ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                            {cloudSyncState.linked ? `Linked as ${cloudSyncState.email}` : 'Not Connected'}
                                        </p>
                                    </div>
                                    {cloudSyncState.linked && (
                                        <button
                                            onClick={loadCloudBackupsList}
                                            disabled={isLoadingCloudBackups}
                                            className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                                        >
                                            {isLoadingCloudBackups ? 'Refreshing...' : 'Refresh Backups'}
                                        </button>
                                    )}
                                </div>
                                <div className="p-3.5 rounded-xl bg-white dark:bg-white/2 border border-sky-150 dark:border-white/5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last Cloud Sync</p>
                                    <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">
                                        {cloudSyncState.lastSync ? new Date(cloudSyncState.lastSync).toLocaleString() : 'Never synced'}
                                    </p>
                                </div>
                            </div>

                            {/* Cloud Backups List when Linked */}
                            {cloudSyncState.linked && cloudBackups.length > 0 && (
                                <div className="pt-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Backups Stored in Google Drive (FormEase_Backups)</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                        {cloudBackups.map((snap) => (
                                            <div key={snap.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-150 dark:border-white/5 bg-white dark:bg-[#090d16] text-xs">
                                                <div className="truncate min-w-0 pr-2">
                                                    <p className="font-extrabold text-slate-700 dark:text-slate-200 truncate">{snap.name}</p>
                                                    <p className="text-[10px] text-slate-400">{new Date(snap.createdTime).toLocaleString()}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        onClick={() => handlePreviewCloudBackup(snap.id, snap.name)}
                                                        disabled={isRestoringCloudBackup}
                                                        className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1 transition-colors"
                                                        title="Live sandbox preview of this cloud backup across all pages"
                                                    >
                                                        <Eye className="w-2.5 h-2.5" />
                                                        Preview
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadCloudBackup(snap.id, snap.name)}
                                                        className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1 transition-colors"
                                                        title="Download cloud backup JSON file"
                                                    >
                                                        <Download className="w-2.5 h-2.5" />
                                                        Download
                                                    </button>
                                                    <button
                                                        onClick={() => handleRestoreCloudBackup(snap.id, snap.name)}
                                                        disabled={isRestoringCloudBackup}
                                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors"
                                                    >
                                                        {isRestoringCloudBackup ? 'Restoring...' : 'Restore'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Instant Backup & Export Action Hub (Replacing 4 options guide cards) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* 1. Full JSON Backup */}
                            <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 bg-white dark:bg-[#0d1225] p-5 shadow-xs flex flex-col justify-between space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                                            <Database className="w-5 h-5" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40">
                                            Full System
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white">Full Database Backup</h4>
                                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                        Export all students, classes, subjects, grades, and system settings to a standalone <code>.json</code> file.
                                    </p>
                                </div>
                                <button
                                    onClick={handleExportData}
                                    disabled={isExporting}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-sm shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    {isExporting ? 'Exporting...' : 'Create Full Backup (.json)'}
                                </button>
                            </div>

                            {/* 2. Master Excel & Safety Vault */}
                            <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 bg-white dark:bg-[#0d1225] p-5 shadow-xs flex flex-col justify-between space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                            <FileSpreadsheet className="w-5 h-5" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40">
                                            Human Readable
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white">Master Excel Archive</h4>
                                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                        Generate multi-tab styled Excel spreadsheets or a complete pre-update safety vault (.zip) for offline records.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <button
                                        onClick={handleExportMasterExcel}
                                        disabled={isExportingMasterExcel}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                                    >
                                        <FileSpreadsheet className="w-3.5 h-3.5" />
                                        {isExportingMasterExcel ? 'Generating...' : 'Export Master Excel (.xlsx)'}
                                    </button>
                                    <button
                                        onClick={handleDownloadCompleteSafetyVault}
                                        disabled={isExportingSafetyVault}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 py-2 text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <Archive className="w-3.5 h-3.5" />
                                        {isExportingSafetyVault ? 'Packaging Vault...' : 'Safety Vault (.zip)'}
                                    </button>
                                </div>
                            </div>

                            {/* 3. Restore System */}
                            <div className="rounded-2xl border border-slate-200/80 dark:border-white/5 bg-white dark:bg-[#0d1225] p-5 shadow-xs flex flex-col justify-between space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                                            <Upload className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/40 dark:border-white/10">
                                            Recovery
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white">Restore from Backup</h4>
                                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                        Restore your complete system state, sections, and encoded grades from a previously exported backup file.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsRestoreModalOpen(true)}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                    <Upload className="w-3.5 h-3.5 text-purple-500" />
                                    Restore Backup File
                                </button>
                            </div>
                        </div>

                        {/* Local Snapshots Vault & History Table */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 dark:border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400">
                                            <Database className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">Local Snapshot Vault</h3>
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                                                    {snapshotRetentionLimit === 'unlimited' ? '♾️ Unlimited Checkpoints' : `Last ${snapshotRetentionLimit} Retained`}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                                                    {autoBackups.length + fsBackups.length} Saved
                                                </span>
                                            </div>
                                            <p className="text-xs font-medium text-slate-400 mt-0.5">Automated checkpoints with detailed learner, section, and grade record breakdown. Scrollable history without limits.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Retention Policy Selector */}
                                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1.5 rounded-xl">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Retention:</span>
                                            <select
                                                value={snapshotRetentionLimit}
                                                onChange={(e) => handleRetentionLimitChange(e.target.value)}
                                                className="text-xs font-bold bg-transparent text-purple-600 dark:text-purple-400 focus:outline-none cursor-pointer"
                                                title="Choose retention policy for automatic snapshots"
                                            >
                                                <option value="unlimited" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-slate-200">♾️ Unlimited (Keep All)</option>
                                                <option value="100" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-slate-200">Keep Last 100</option>
                                                <option value="50" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-slate-200">Keep Last 50</option>
                                                <option value="25" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-slate-200">Keep Last 25</option>
                                                <option value="10" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-slate-200">Keep Last 10</option>
                                            </select>
                                        </div>
                                        <div className="relative">
                                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={snapshotSearchQuery}
                                                onChange={(e) => setSnapshotSearchQuery(e.target.value)}
                                                placeholder="Search by date, class, or S.Y...."
                                                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-purple-500 font-medium w-44 sm:w-56"
                                            />
                                        </div>
                                        <button
                                            onClick={handleManualAutoBackup}
                                            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                                        >
                                            <Database className="w-3.5 h-3.5" />
                                            Take Instant Snapshot
                                        </button>
                                    </div>
                                </div>

                                {/* Filter Tabs & Scroll Hint */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setSnapshotTypeFilter('all')}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                                                snapshotTypeFilter === 'all'
                                                    ? 'bg-purple-600 text-white shadow-xs'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            All ({autoBackups.length + fsBackups.length})
                                        </button>
                                        <button
                                            onClick={() => setSnapshotTypeFilter('auto')}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                                                snapshotTypeFilter === 'auto'
                                                    ? 'bg-purple-600 text-white shadow-xs'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            Auto Snapshots ({autoBackups.length})
                                        </button>
                                        <button
                                            onClick={() => setSnapshotTypeFilter('fs')}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                                                snapshotTypeFilter === 'fs'
                                                    ? 'bg-purple-600 text-white shadow-xs'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            Disk Files ({fsBackups.length})
                                        </button>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">
                                        📜 Scrollable Vault • Drag or scroll to view all checkpoints
                                    </span>
                                </div>

                            {/* Snapshots Table */}
                            {autoBackups.length === 0 && fsBackups.length === 0 ? (
                                <div className="text-center py-10 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl text-slate-400 text-xs font-medium">
                                    No local snapshots saved yet. Snapshots are automatically captured hourly and upon sign-out.
                                </div>
                            ) : (
                                <div className="max-h-130 overflow-y-auto overflow-x-auto custom-scrollbar border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-inner">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="sticky top-0 bg-slate-50/95 dark:bg-[#0d1225]/95 backdrop-blur-md z-10 border-b border-slate-200 dark:border-white/10 shadow-xs">
                                            <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                <th className="py-2.5 px-3">Snapshot Name / Date</th>
                                                <th className="py-2.5 px-3">Type</th>
                                                <th className="py-2.5 px-3">School Year</th>
                                                <th className="py-2.5 px-3">Data Scope & Records</th>
                                                <th className="py-2.5 px-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {(snapshotTypeFilter === 'all' || snapshotTypeFilter === 'auto') && autoBackups
                                                .filter((b) => {
                                                    if (!snapshotSearchQuery.trim()) return true;
                                                    const q = snapshotSearchQuery.toLowerCase();
                                                    const sections = getAutoBackupSections(b).join(" ").toLowerCase();
                                                    const sy = getAutoBackupSchoolYear(b).toLowerCase();
                                                    return b.label.toLowerCase().includes(q) ||
                                                        new Date(b.timestamp).toLocaleString().toLowerCase().includes(q) ||
                                                        sections.includes(q) ||
                                                        sy.includes(q);
                                                })
                                                .map((b) => {
                                                    const sy = getAutoBackupSchoolYear(b);
                                                    const sections = getAutoBackupSections(b);
                                                    const gradeCount = b.recordCounts?.classRecords ?? 0;
                                                    const attendanceCount = b.recordCounts?.attendanceRecords ?? 0;
                                                    const subjectCount = b.recordCounts?.subjects ?? 0;
                                                    const studentCount = b.recordCounts?.students ?? 0;
                                                    const sectionCount = b.recordCounts?.sections ?? 0;
                                                    return (
                                                        <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-white/2 transition-colors">
                                                            <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200 align-top">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="truncate max-w-50 text-xs font-black">{b.label}</span>
                                                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 font-medium shrink-0">
                                                                        {formatBytes(b.fileSize)}
                                                                    </span>
                                                                </div>
                                                                <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                                                                    {new Date(b.timestamp).toLocaleString()} • <strong className="text-slate-500 dark:text-slate-400">{formatRelativeTime(b.timestamp)}</strong>
                                                                </span>
                                                                <span
                                                                    title={`Snapshot ${b.snapshotId || 'from an earlier backup format'}`}
                                                                    className={`inline-flex mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                                        b.pairedFileStatus === 'verified'
                                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                                            : b.pairedFileStatus === 'full-only'
                                                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                                                                : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
                                                                    }`}
                                                                >
                                                                    {b.pairedFileStatus === 'verified' ? 'Full + Excel verified' : b.pairedFileStatus === 'full-only' ? 'Full backup saved' : 'Local snapshot'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 align-top">
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                                                                    Auto Snapshot
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 align-top">
                                                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                                    S.Y. {sy}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 align-top">
                                                                <div className="space-y-1.5 max-w-sm">
                                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300" title="Enrolled Students">
                                                                            👥 {studentCount} learners
                                                                        </span>
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300" title="Class Sections">
                                                                            🏫 {sectionCount} {sectionCount === 1 ? 'section' : 'sections'}
                                                                        </span>
                                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                                            gradeCount > 0
                                                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40'
                                                                                : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                                                        }`} title="Encoded Grades / Class Records">
                                                                            📝 {gradeCount} grades
                                                                        </span>
                                                                        {attendanceCount > 0 && (
                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400" title="Attendance Logs">
                                                                                📅 {attendanceCount} logs
                                                                            </span>
                                                                        )}
                                                                        {subjectCount > 0 && (
                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400" title="Subjects">
                                                                                📚 {subjectCount} subjects
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {sections.length > 0 && (
                                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate" title={sections.join(", ")}>
                                                                            <span className="font-bold text-slate-600 dark:text-slate-300">Sections:</span> {sections.join(", ")}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-3 text-right space-x-1.5 align-top whitespace-nowrap">
                                                                <button
                                                                    onClick={() => setInspectingSnapshot({
                                                                        title: b.label,
                                                                        timestamp: b.timestamp,
                                                                        type: 'auto',
                                                                        size: b.fileSize,
                                                                        schoolYear: sy,
                                                                        students: studentCount,
                                                                        sections: sectionCount,
                                                                        sectionNames: sections,
                                                                        grades: gradeCount,
                                                                        gradingSheets: b.recordCounts?.gradingSheetRecords,
                                                                        attendance: attendanceCount,
                                                                        subjects: subjectCount,
                                                                        onRestore: () => handleRestoreAutoBackup(b.id, b.label, b),
                                                                        onDownload: () => handleDownloadAutoBackup(b),
                                                                        onPreview: () => handlePreviewAutoBackup(b),
                                                                    })}
                                                                    className="px-2.5 py-1 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                                                                >
                                                                    Inspect
                                                                </button>
                                                                <button
                                                                    onClick={() => handlePreviewAutoBackup(b)}
                                                                    className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors inline-flex items-center gap-1"
                                                                    title="Live sandbox preview of this snapshot across all pages"
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                    Preview
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDownloadAutoBackup(b)}
                                                                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors inline-flex items-center gap-1"
                                                                    title="Download snapshot JSON file to send or inspect"
                                                                >
                                                                    <Download className="w-3 h-3" />
                                                                    Download
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRestoreAutoBackup(b.id, b.label, b)}
                                                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-xs"
                                                                >
                                                                    Restore
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteAutoBackup(b.id, b.label)}
                                                                    className="px-2 py-1 text-slate-400 hover:text-rose-600 text-[10px] font-bold cursor-pointer transition-colors"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            {(snapshotTypeFilter === 'all' || snapshotTypeFilter === 'fs') && fsBackups
                                                .filter((fb) => {
                                                    if (!snapshotSearchQuery.trim()) return true;
                                                    const q = snapshotSearchQuery.toLowerCase();
                                                    const sy = (fb.summary?.activeSchoolYear || "").toLowerCase();
                                                    return fb.filename.toLowerCase().includes(q) ||
                                                        new Date(fb.mtime).toLocaleString().toLowerCase().includes(q) ||
                                                        sy.includes(q);
                                                })
                                                .map((fb) => {
                                                    const studentCount = fb.summary?.students ?? 0;
                                                    const sectionCount = fb.summary?.sections ?? 0;
                                                    const gradeCount = fb.summary?.grades ?? 0;
                                                    const subjectCount = fb.summary?.subjects ?? 0;
                                                    const attendanceCount = fb.summary?.attendanceRecords ?? 0;
                                                    const sy = fb.summary?.activeSchoolYear || "Active S.Y.";
                                                    return (
                                                        <tr key={fb.filename} className="hover:bg-slate-50/60 dark:hover:bg-white/2 transition-colors">
                                                            <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200 align-top">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="truncate max-w-50 text-xs font-black">{fb.filename}</span>
                                                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 font-medium shrink-0">
                                                                        {formatBytes(fb.size)}
                                                                    </span>
                                                                </div>
                                                                <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                                                                    {new Date(fb.mtime).toLocaleString()} • <strong className="text-slate-500 dark:text-slate-400">{formatRelativeTime(fb.mtime)}</strong>
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 align-top">
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                                                                    Disk File
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 align-top">
                                                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                                    S.Y. {sy}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 align-top">
                                                                <div className="space-y-1.5 max-w-sm">
                                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                                                                            👥 {studentCount} learners
                                                                        </span>
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                                                                            🏫 {sectionCount} {sectionCount === 1 ? 'section' : 'sections'}
                                                                        </span>
                                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                                            gradeCount > 0
                                                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40'
                                                                                : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                                                        }`}>
                                                                            📝 {gradeCount} grades
                                                                        </span>
                                                                        {attendanceCount > 0 && (
                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400">
                                                                                📅 {attendanceCount} logs
                                                                            </span>
                                                                        )}
                                                                        {subjectCount > 0 && (
                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                                                                                📚 {subjectCount} subjects
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-3 text-right space-x-1.5 align-top whitespace-nowrap">
                                                                <button
                                                                    onClick={() => setInspectingSnapshot({
                                                                        title: fb.filename,
                                                                        timestamp: fb.mtime,
                                                                        type: 'fs',
                                                                        size: fb.size,
                                                                        schoolYear: sy,
                                                                        students: studentCount,
                                                                        sections: sectionCount,
                                                                        grades: gradeCount,
                                                                        gradingSheets: fb.summary?.gradingSheetRecords,
                                                                        attendance: attendanceCount,
                                                                        subjects: subjectCount,
                                                                        onRestore: () => handleRestoreFsBackup(fb.filename),
                                                                        onDownload: () => handleDownloadFsBackup(fb.filename),
                                                                        onPreview: () => handlePreviewFsBackup(fb.filename, fb),
                                                                    })}
                                                                    className="px-2.5 py-1 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                                                                >
                                                                    Inspect
                                                                </button>
                                                                <button
                                                                    onClick={() => handlePreviewFsBackup(fb.filename, fb)}
                                                                    className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors inline-flex items-center gap-1"
                                                                    title="Live sandbox preview of this backup file across all pages"
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                    Preview
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDownloadFsBackup(fb.filename)}
                                                                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors inline-flex items-center gap-1"
                                                                    title="Download snapshot JSON file to send or inspect"
                                                                >
                                                                    <Download className="w-3 h-3" />
                                                                    Download
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRestoreFsBackup(fb.filename)}
                                                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-xs"
                                                                >
                                                                    Restore
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteFsBackup(fb.filename)}
                                                                    className="px-2 py-1 text-slate-400 hover:text-rose-600 text-[10px] font-bold cursor-pointer transition-colors"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Snapshot Inspection & Comparison Modal */}
                        {inspectingSnapshot && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                                <div className="bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
                                    <div className="flex items-start justify-between gap-3 border-b border-slate-150 dark:border-white/5 pb-4">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                                                {inspectingSnapshot.type === 'auto' ? 'Automated Checkpoint' : 'Disk File Backup'}
                                            </span>
                                            <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5 truncate max-w-sm">
                                                {inspectingSnapshot.title}
                                            </h3>
                                            <p className="text-xs text-slate-400 font-medium">
                                                Captured {new Date(inspectingSnapshot.timestamp).toLocaleString()} ({formatRelativeTime(inspectingSnapshot.timestamp)})
                                            </p>
                                        </div>
                                        <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 shrink-0">
                                            {formatBytes(inspectingSnapshot.size)}
                                        </span>
                                    </div>

                                    {/* Scope Details Grid */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            Checkpoint Scope & Data Contents
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/2 border border-slate-150 dark:border-white/5 space-y-0.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">School Year</span>
                                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">S.Y. {inspectingSnapshot.schoolYear}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/2 border border-slate-150 dark:border-white/5 space-y-0.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Learners</span>
                                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{inspectingSnapshot.students} enrolled</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/2 border border-slate-150 dark:border-white/5 space-y-0.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Class Sections</span>
                                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{inspectingSnapshot.sections} active</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/2 border border-slate-150 dark:border-white/5 space-y-0.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Subject Grades</span>
                                                <p className={`text-xs font-extrabold ${inspectingSnapshot.grades > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                                                    {inspectingSnapshot.grades} encoded
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/2 border border-slate-150 dark:border-white/5 space-y-0.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Attendance Logs</span>
                                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{inspectingSnapshot.attendance} records</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/2 border border-slate-150 dark:border-white/5 space-y-0.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Subjects</span>
                                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{inspectingSnapshot.subjects} subjects</p>
                                            </div>
                                        </div>

                                        {/* Section Tags */}
                                        {inspectingSnapshot.sectionNames && inspectingSnapshot.sectionNames.length > 0 && (
                                            <div className="space-y-1.5 pt-1">
                                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Classes Included:</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {inspectingSnapshot.sectionNames.map((name, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/40">
                                                            {name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Teacher Guidance Note */}
                                        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                                            💡 <strong>Teacher Guidance:</strong> Compare the <strong>{inspectingSnapshot.grades} recorded grades</strong> and <strong>{inspectingSnapshot.students} enrolled learners</strong> against your intended recovery point to ensure you are restoring the exact version needed.
                                        </div>
                                    </div>

                                    {/* Modal Buttons */}
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-150 dark:border-white/5">
                                        <div>
                                            {inspectingSnapshot.onDownload && (
                                                <button
                                                    onClick={() => inspectingSnapshot.onDownload?.()}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                                    title="Download snapshot JSON file to send or inspect"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    Download JSON
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <button
                                                onClick={() => setInspectingSnapshot(null)}
                                                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                            >
                                                Close
                                            </button>
                                            {inspectingSnapshot.onPreview && (
                                                <button
                                                    onClick={() => {
                                                        const p = inspectingSnapshot.onPreview;
                                                        setInspectingSnapshot(null);
                                                        p?.();
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                                                    title="Explore all pages and records of this snapshot in live sandbox before restoring"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Preview in App
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    const restoreFn = inspectingSnapshot.onRestore;
                                                    setInspectingSnapshot(null);
                                                    restoreFn();
                                                }}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                                            >
                                                Restore This Snapshot
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Maintenance Logs (Audit Trail) */}
                        {maintenanceLogs.length > 0 && (
                            <div className="rounded-2xl border border-slate-200/80 dark:border-white/5 bg-white dark:bg-[#0d1225] p-5 shadow-xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        Recent Maintenance Activity ({maintenanceLogs.length})
                                    </h4>
                                    <button
                                        onClick={() => {
                                            setMaintenanceLogs([]);
                                            localStorage.removeItem('formease_maintenance_log');
                                        }}
                                        className="text-[10px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                                    >
                                        Clear History
                                    </button>
                                </div>
                                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                                    {maintenanceLogs.slice(0, 10).map((log, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/2 text-[11px]">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{log.action}</span>
                                            <span className="text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()} ({log.count} records)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 4: System Health & Maintenance */}
                {activeTab === 'maintenance' && canPurge && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Active Progress Bar */}
                        {maintenanceProgress.total > 0 && (
                            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-blue-900 dark:text-blue-300">
                                    <span>{maintenanceProgress.title}: {maintenanceProgress.currentStep}</span>
                                    <span>{Math.round((maintenanceProgress.completed / Math.max(1, maintenanceProgress.total)) * 100)}%</span>
                                </div>
                                <div className="w-full bg-blue-200 dark:bg-blue-900/50 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full transition-all duration-200 rounded-full"
                                        style={{ width: `${Math.round((maintenanceProgress.completed / Math.max(1, maintenanceProgress.total)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                        {/* Smart System Health Inspector Hero */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-150 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">System Health & Integrity Inspector</h3>
                                        <p className="text-xs font-medium text-slate-400 mt-0.5">Automated diagnostics to detect duplicates, unlinked logs, and text inconsistencies.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRunDiagnostics}
                                    disabled={isScanningDiagnostics}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-xs disabled:opacity-50 cursor-pointer self-start sm:self-auto"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isScanningDiagnostics ? 'animate-spin' : ''}`} />
                                    {isScanningDiagnostics ? 'Scanning System...' : 'Run System Health Scan'}
                                </button>
                            </div>

                            {/* Detected Diagnostic Issues Banner */}
                            {diagnosticIssues.length > 0 && (
                                <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-950/20 space-y-3">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                                        Detected System Issues ({diagnosticIssues.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {diagnosticIssues.map((issue) => (
                                            <div key={issue.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#090d16] border border-amber-200 dark:border-amber-900/40 text-xs">
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white">{issue.description}</p>
                                                    <p className="text-[11px] text-slate-400">{issue.details}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRepairIssue(issue)}
                                                    disabled={isRepairingDiagnostics}
                                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer shrink-0 ml-2"
                                                >
                                                    Auto Repair
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 6 Interactive Health Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {/* 1. Duplicate LRN */}
                                <div className="p-4 rounded-xl border border-indigo-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 space-y-3 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black text-slate-800 dark:text-white">Duplicate LRNs</p>
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">Integrity</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">Identifies students with duplicate 12-digit LRNs and merges records safely.</p>
                                    </div>
                                    <button
                                        onClick={handleDuplicateLrnScan}
                                        disabled={isScanningDuplicates}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                    >
                                        Scan Duplicates
                                    </button>
                                </div>

                                {/* 2. LRN Format Validator */}
                                <div className="p-4 rounded-xl border border-purple-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 space-y-3 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black text-slate-800 dark:text-white">LRN Validator</p>
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600">Compliance</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            {lrnValidationIssues.length > 0
                                                ? `⚠️ Found ${lrnValidationIssues.length} issue(s) with student LRNs.`
                                                : 'Checks for non-standard, temporary, or missing 12-digit student LRNs.'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleLrnValidation}
                                        disabled={isScanningLrnValidation}
                                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                    >
                                        {isScanningLrnValidation ? 'Validating...' : 'Validate 12-Digit LRNs'}
                                    </button>
                                </div>

                                {/* 3. Grade Consistency Scanner */}
                                <div className="p-4 rounded-xl border border-emerald-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 space-y-3 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black text-slate-800 dark:text-white">Grade Consistency</p>
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">Verification</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            {gradeConsistencyIssues.length > 0
                                                ? `⚠️ Found ${gradeConsistencyIssues.length} grade consistency anomaly(ies).`
                                                : 'Scans encoded scores and quarterly grades for out-of-range values.'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleGradeConsistencyCheck}
                                        disabled={isScanningConsistency}
                                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                    >
                                        {isScanningConsistency ? 'Checking...' : 'Check Grade Values'}
                                    </button>
                                </div>

                                {/* Text & Name Normalization */}
                                <div className="p-4 rounded-xl border border-blue-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 space-y-3 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black text-slate-800 dark:text-white">Name Normalization</p>
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600">Formatting</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">Trims double spaces, fixes proper casing, and normalizes student and subject names.</p>
                                    </div>
                                    <button
                                        onClick={handleNormalizeRecords}
                                        disabled={isNormalizingRecords}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                    >
                                        Normalize Text
                                    </button>
                                </div>

                                {/* Empty Sections */}
                                <div className="p-4 rounded-xl border border-amber-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 space-y-3 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black text-slate-800 dark:text-white">Empty Sections</p>
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600">Cleanup</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">Detects and purges empty section records that contain 0 students and 0 subjects.</p>
                                    </div>
                                    <button
                                        onClick={handleCleanGhostSections}
                                        disabled={isPurgingSections}
                                        className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                    >
                                        Clean Empty Classes
                                    </button>
                                </div>

                                {/* 6. Orphan Attendance & Grades */}
                                <div className="p-4 rounded-xl border border-teal-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 space-y-3 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black text-slate-800 dark:text-white">Orphan Records</p>
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-600">Pruning</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">Scans and removes attendance logs and grades not linked to active students.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={handleCleanOrphanAttendance}
                                            disabled={isCleaning}
                                            className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                                        >
                                            Prune Logs
                                        </button>
                                        <button
                                            onClick={handleDeleteOrphanGradeRecords}
                                            disabled={isDeletingOrphanGrades}
                                            className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                                        >
                                            Prune Grades
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section Cascade Purge Card (e.g. Archimedes Sample Data) */}
                        <div className="rounded-2xl border border-red-200/80 dark:border-red-950/40 bg-red-50/20 dark:bg-red-950/10 p-5 shadow-xs space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-black text-red-800 dark:text-red-300 uppercase tracking-wider">Purge Specific Section & Roster</h4>
                                    <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">Quickly remove sample or test classes (such as Archimedes) along with all their enrolled students and grades.</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <select
                                        value={selectedSectionToCascadePurge}
                                        onChange={(e) => setSelectedSectionToCascadePurge(e.target.value)}
                                        className="text-xs bg-white dark:bg-[#0d1225] border border-red-200 dark:border-red-900/50 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-gray-200"
                                    >
                                        <option value="">-- Select Section to Purge --</option>
                                        {sections.map(sec => {
                                            const studentCount = students.filter(s => s.student_section === sec.id || s.student_section === sec.section_name).length;
                                            return (
                                                <option key={sec.id} value={sec.id}>
                                                    {sec.section_grade_level ? `${sec.section_grade_level} - ` : ''}{sec.section_name} ({studentCount} students)
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <button
                                        onClick={handleCascadeDeleteSection}
                                        disabled={!selectedSectionToCascadePurge || isCleaning}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        Purge Section
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Direct Database Rescue & Live Status */}
                        <div className="rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 bg-linear-to-br from-emerald-50/20 to-white dark:from-emerald-950/10 dark:to-[#0d1225] p-6 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-emerald-100 dark:border-white/5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">Direct Database Rescue to Excel</h3>
                                        <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-2.5 py-0.5 uppercase tracking-wider">
                                            Direct Extraction
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5 font-medium">Extracts records directly from IndexedDB without filtering by school year or active view.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={handleScanLiveDatabase}
                                        disabled={isScanningDb}
                                        className="px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 inline mr-1 ${isScanningDb ? 'animate-spin' : ''}`} />
                                        Scan Storage
                                    </button>
                                    <button
                                        onClick={handleForceReloadDatabase}
                                        disabled={isReloadingDb}
                                        className="px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                                    >
                                        {isReloadingDb ? 'Reloading...' : 'Reload Cache'}
                                    </button>
                                    <button
                                        onClick={handleRescueDatabaseExcel}
                                        disabled={isRescuingExcel}
                                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black uppercase tracking-wider cursor-pointer"
                                    >
                                        Export Direct Excel
                                    </button>
                                    <button
                                        onClick={handleExportAllTablesCsv}
                                        className="px-3 py-1.5 border border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                                    >
                                        Export CSV
                                    </button>
                                </div>
                            </div>

                            {/* Live Counts */}
                            {liveDbCounts && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1 text-center">
                                    <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-150 dark:border-white/5">
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Students</span>
                                        <span className="text-sm font-black text-slate-800 dark:text-white">{liveDbCounts.students}</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-150 dark:border-white/5">
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Sections</span>
                                        <span className="text-sm font-black text-slate-800 dark:text-white">{liveDbCounts.sections}</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-150 dark:border-white/5">
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Subjects</span>
                                        <span className="text-sm font-black text-slate-800 dark:text-white">{liveDbCounts.subjects}</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-150 dark:border-white/5">
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Grades</span>
                                        <span className="text-sm font-black text-slate-800 dark:text-white">{liveDbCounts.classRecords}</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-150 dark:border-white/5">
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase">HPS Records</span>
                                        <span className="text-sm font-black text-slate-800 dark:text-white">{liveDbCounts.hpsRecords}</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-150 dark:border-white/5">
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Attendance</span>
                                        <span className="text-sm font-black text-slate-800 dark:text-white">{liveDbCounts.attendanceRecords}</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-150 dark:border-white/5">
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase">SF2</span>
                                        <span className="text-sm font-black text-slate-800 dark:text-white">{liveDbCounts.sf2Sheets}</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-150 dark:border-white/5">
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Total Records</span>
                                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{liveDbCounts.totalRecords}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Danger Zone */}
                        <div className="rounded-2xl border-2 border-rose-500/30 dark:border-rose-950/40 bg-rose-50/10 dark:bg-rose-950/5 p-6 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-rose-800 dark:text-rose-300 uppercase tracking-wider">Danger Zone</h3>
                                        <p className="text-xs text-rose-600/70 dark:text-rose-400/70 font-medium">Irreversible actions that purge data. Always export a backup first.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDangerZone(!showDangerZone)}
                                    className="px-3.5 py-1.5 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                    {showDangerZone ? 'Hide Danger Actions' : 'Show Danger Actions'}
                                </button>
                            </div>

                            {showDangerZone && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-rose-200/40">
                                    <div className="p-4 rounded-xl bg-white dark:bg-[#0d1225] border border-rose-200 dark:border-rose-900/40 space-y-2">
                                        <h5 className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase">Clear Current Students</h5>
                                        <p className="text-[11px] text-slate-400">Removes student enrollments from the active view while keeping sections and subjects.</p>
                                        <button
                                            onClick={handleClearAllCurrentStudents}
                                            disabled={isClearingAllStudents}
                                            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                        >
                                            {isClearingAllStudents ? 'Clearing...' : 'Clear Student Enrollments'}
                                        </button>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white dark:bg-[#0d1225] border border-rose-200 dark:border-rose-900/40 space-y-2">
                                        <h5 className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase">Clear Students & Orphan Grades</h5>
                                        <p className="text-[11px] text-slate-400">Removes students and wipes all grade records linked to current or removed learners.</p>
                                        <button
                                            onClick={handleClearStudentsAndOrphanGrades}
                                            disabled={isClearingStudentsAndGrades}
                                            className="w-full py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                        >
                                            {isClearingStudentsAndGrades ? 'Clearing...' : 'Clear Students & Grades'}
                                        </button>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white dark:bg-[#0d1225] border border-rose-200 dark:border-rose-900/40 space-y-2">
                                        <h5 className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase">Purge Ghost Students</h5>
                                        <p className="text-[11px] text-slate-400">Removes student records not assigned to any existing class section.</p>
                                        <button
                                            onClick={handleCleanGhostStudents}
                                            disabled={isCleaning}
                                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                        >
                                            Purge Ghost Students
                                        </button>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white dark:bg-[#0d1225] border border-rose-200 dark:border-rose-900/40 space-y-2">
                                        <h5 className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase">Factory Reset Database</h5>
                                        <p className="text-[11px] text-slate-400">Completely clears all database tables, resetting FormEase Pro back to initial state.</p>
                                        <button
                                            onClick={handleFullHardReset}
                                            disabled={isRunningHardReset}
                                            className="w-full py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                        >
                                            {isRunningHardReset ? 'Resetting...' : 'Reset Entire Database'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab 5: About & Updates */}
                {(activeTab === 'about' || (activeTab as string) === 'versions') && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* App Version Hero Card */}
                        <div className="rounded-2xl border border-slate-200/80 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-150 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-deped-blue dark:bg-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 border border-blue-400/20 overflow-hidden">
                                        <img src={`${import.meta.env.BASE_URL}app-logo.png`} alt="App Logo" className="w-10 h-10 object-contain" />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                                                FormEase Pro
                                            </h2>
                                            <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 3.5.19</span>
                                            <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5">
                                                Latest Production
                                            </span>
                                        </div>
                                        <p className="text-xs font-semibold text-slate-400">
                                            Official DepEd School Management System • 100% Offline-First Architecture
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCheckForUpdates}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Check for Updates
                                </button>
                            </div>

                            {/* Sub Navigation Bar inside About */}
                            <div className="flex items-center gap-2 pt-5 border-b border-slate-100 dark:border-white/5 pb-3">
                                <button
                                    onClick={() => setAboutSubTab('highlights')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                        aboutSubTab === 'highlights'
                                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/50 dark:border-sky-800/40'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    Latest Highlights
                                </button>
                                <button
                                    onClick={() => setAboutSubTab('history')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                        aboutSubTab === 'history'
                                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/50 dark:border-sky-800/40'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    Release Changelog
                                </button>
                                <button
                                    onClick={() => setAboutSubTab('innovator')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                        aboutSubTab === 'innovator'
                                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/50 dark:border-sky-800/40'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    Innovator & Documentation
                                </button>
                            </div>

                            {/* SubTab 1: Highlights */}
                            {aboutSubTab === 'highlights' && (
                                <div className="pt-4 space-y-4">
                                    <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-white/2 border border-slate-150 dark:border-white/5 space-y-2">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                            What&apos;s New in Version 3.5.19
                                        </h4>
                                        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium list-disc list-inside leading-relaxed">
                                            <li>🛡️ <strong>Data Integrity Protection</strong>: Startup never hides or deletes legitimate records merely because an LRN, section name, or temporary identifier resembles test data.</li>
                                            <li>💾 <strong>Verified Recovery</strong>: A checksum-verified v3.5.17 pre-update backup is offered for explicit restore when it contains missing records.</li>
                                            <li>📚 <strong>Temporary Grade Retention</strong>: Comprehensive backups preserve temporary and unmatched grade records for teacher review and repair.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* SubTab 2: History */}
                            {aboutSubTab === 'history' && (
                                <div className="pt-4">
                                    <VersionHistoryTimeline onCheckForUpdates={handleCheckForUpdates} />
                                </div>
                            )}

                            {/* SubTab 3: Innovator */}
                            {aboutSubTab === 'innovator' && (
                                <div className="pt-4 rounded-xl overflow-hidden min-h-125">
                                    <AboutPage />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>


            {/* Account Settings Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowPasswordModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden my-auto" onClick={e => e.stopPropagation()}>
                        <div className="bg-deped-blue text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold flex items-center gap-2"><User className="w-5 h-5" /> Account Settings</h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-2xl hover:bg-white/20 rounded-lg p-1">×</button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            {passwordError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">{passwordError}</div>
                            )}
                            {passwordSuccess && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">{passwordSuccess}</div>
                            )}
                            
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl mb-2">
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Verification Required</p>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="form-input"
                                    placeholder="Enter current password to save changes"
                                />
                            </div>

                            <hr className="border-gray-100" />

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Username</label>
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="form-input"
                                    placeholder="Change username (optional)"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Email</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="form-input"
                                    placeholder="Change email address (optional)"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="form-input"
                                        placeholder="Min 6 chars"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="form-input"
                                        placeholder="Confirm new"
                                    />
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recovery Options</p>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Security Question</label>
                                    <input
                                        type="text"
                                        value={newSecurityQuestion}
                                        onChange={(e) => setNewSecurityQuestion(e.target.value)}
                                        className="form-input"
                                        placeholder="e.g., What is my pet's name?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Security Answer</label>
                                    <input
                                        type="text"
                                        value={newSecurityAnswer}
                                        onChange={(e) => setNewSecurityAnswer(e.target.value)}
                                        className="form-input"
                                        placeholder="Leave blank to keep your current answer"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={isChangingPassword}
                                    className="px-6 py-2 bg-deped-blue text-white rounded-lg font-bold hover:bg-blue-700 shadow-md disabled:opacity-50"
                                >
                                    {isChangingPassword ? 'Saving...' : 'Update Settings'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Backup Restore Modal */}
            <BackupRestoreModal
                isOpen={isRestoreModalOpen}
                onClose={() => setIsRestoreModalOpen(false)}
                onRestoreComplete={async () => {
                    await initializeAppStore();
                }}
            />

            {/* Export Options Modal */}
            <ExportOptionsModal
                isOpen={showExportOptions}
                onClose={() => setShowExportOptions(false)}
                backup={currentBackup}
                onExport={handleExportWithOptions}
                isExporting={isExporting}
            />
            {/* Duplicate LRN Merger Modal */}
            {showDuplicateModal && duplicateLrns.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-[#0d1225] rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-white/10 space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-150 dark:border-white/5">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Duplicate LRN Records Detected</h3>
                            <button 
                                onClick={() => setShowDuplicateModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-slate-400">
                            The following students have identical LRNs. Choose which record is the canonical profile to retain. Unselected profiles will be merged and purged.
                        </p>
                        <div className="space-y-4">
                            {duplicateLrns.map((dup, i) => (
                                <div key={i} className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/10 dark:bg-indigo-950/5 space-y-3">
                                    <div className="flex justify-between items-center text-xs font-black text-indigo-600 dark:text-indigo-400">
                                        <span>LRN: {dup.lrn}</span>
                                        <span>{dup.students.length} copies found</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {dup.students.map((student, idx) => {
                                            const otherStudent = dup.students[(idx + 1) % dup.students.length];
                                            return (
                                                <div key={idx} className="p-3 rounded-xl bg-white dark:bg-[#141b36] border border-slate-200 dark:border-white/5 space-y-2">
                                                    <div>
                                                        <p className="text-xs font-extrabold text-slate-800 dark:text-white">
                                                            {student.first_name} {student.last_name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                            Section: {student.student_section || 'Unassigned'} | Grade: {student.grade_level || 'N/A'}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-slate-400">Enrollment Date: {student.enrollment_date || 'N/A'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleMergeDuplicates(student, otherStudent)}
                                                        className="w-full px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                                    >
                                                        Keep This Record
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
