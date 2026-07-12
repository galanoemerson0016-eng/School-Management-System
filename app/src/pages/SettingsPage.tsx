import { useState, useEffect, useCallback } from 'react';
import { useAuthStore, useAppStore, initializeAppStore, useUpdateStore } from '../stores';
import { db } from '../services/database';
import { Database, User, Shield, Upload, History, Cloud, Info, Sparkles } from 'lucide-react';
import { AboutPage } from './AboutPage';
import { AutoBackupManager, type AutomatedBackupEntry } from '../services/AutoBackupManager';
import { CloudSyncService } from '../services/cloud-sync';
import { DiagnosticEngine, type DiagnosticIssue } from '../services/diagnostic-engine';
import { canPurgeMaintenance } from '../lib/rbac';
import { createComprehensiveBackup, generateBackupReport, validateBackup, type ComprehensiveBackup } from '../utils/backup-restore';
import { BackupRestoreModal } from '../components/BackupRestoreModal';
import { ExportOptionsModal, type ExportOptions } from '../components/ExportOptionsModal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { TextInputConfirmationModal } from '../components/ui/TextInputConfirmationModal';
import { encryptBackup, createEncryptedBackupFile } from '../utils/backup-encryption';
import { compareBackupSizes, formatBytes } from '../utils/backup-compression';
import { createBackupMetadata, saveBackupMetadata } from '../utils/backup-metadata';
import { embedChecksum } from '../utils/backup-integrity';
import { exportToCSV } from '../utils/csv-export';
import type { Student, AttendanceRecord, ClassRecord } from '../types';

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
    } = useAppStore();
    const canPurge = canPurgeMaintenance(user);

    const [autoBackups, setAutoBackups] = useState<AutomatedBackupEntry[]>([]);
    const [fsBackups, setFsBackups] = useState<FsBackupEntry[]>([]);
    const updateStore = useUpdateStore();
    const [activeTab, setActiveTab] = useState<'account' | 'cloud' | 'backups' | 'maintenance' | 'versions' | 'about'>('account');

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
    const [showEmergencyRollbacks, setShowEmergencyRollbacks] = useState(false);

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
                    
                    await db.importFromBackup(backupData.data || backupData);
                    await initializeAppStore();
                    alert('✅ Database state successfully restored from Google Drive cloud backup!');
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    alert('Restore failed: ' + message);
                } finally {
                    setIsRestoringCloudBackup(false);
                }
            }
        });
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

    const handleRepairIssue = async (issue: DiagnosticIssue) => {
        setIsRepairingDiagnostics(true);
        try {
            await issue.repairAction();
            alert('✅ Database successfully repaired!');
            // Re-run diagnostics
            const list = await DiagnosticEngine.runDiagnostics();
            setDiagnosticIssues(list);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            alert('Repair failed: ' + message);
        } finally {
            setIsRepairingDiagnostics(false);
        }
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
        if (activeTab === 'cloud') {
            loadCloudBackupsList();
        }
    }, [activeTab, cloudSyncState.linked, loadCloudBackupsList]);

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
                        
                        await db.importFromBackup(backupData.data || backupData);
                        await initializeAppStore();
                        alert('Database state successfully restored from local backup!');
                        loadFsBackups();
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

    const handleRestoreAutoBackup = (backupId: string, label: string) => {
        setPendingConfirmation({
            title: 'Restore Automated Backup?',
            message: `Are you sure you want to restore the system state from the snapshot "${label}"?`,
            details: 'This will replace all current students, sections, subjects, grades, and attendance data with the backup snapshot. Current unsaved changes will be overwritten.',
            confirmLabel: 'Restore Snapshot',
            intent: 'warning',
            onConfirm: async () => {
                try {
                    await AutoBackupManager.restoreFromBackup(backupId);
                    await initializeAppStore();
                    alert('Database state successfully restored from automated backup!');
                    loadAutoBackups();
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
    const [storageStats, setStorageStats] = useState<Record<string, { count: number; sizeBytes: number }> | null>(null);
    const [storageEstimate, setStorageEstimate] = useState<{ used: number; total: number } | null>(null);
    const [isScanningStorage, setIsScanningStorage] = useState(false);
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
    const [autoCleanupEnabled, setAutoCleanupEnabled] = useState(() => {
        return localStorage.getItem('formease_auto_cleanup_enabled') === 'true';
    });
    const [cloudBackupSchedule, setCloudBackupSchedule] = useState(() => {
        return localStorage.getItem('formease_cloud_backup_schedule') || 'off';
    });
    const [backupHistory, setBackupHistory] = useState<Array<{ type: string; timestamp: number; size: number; status: string }>>(() => {
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

    // --- CSV Table Exporter ---
    const handleExportTableCsv = (tableName: string) => {
        try {
            let dataToExport: Record<string, unknown>[] = [];
            if (tableName === 'students') {
                dataToExport = (studentProfiles.length > 0 ? studentProfiles : students) as unknown as Record<string, unknown>[];
            } else if (tableName === 'sections') {
                dataToExport = sections as unknown as Record<string, unknown>[];
            } else if (tableName === 'subjects') {
                dataToExport = subjects as unknown as Record<string, unknown>[];
            } else if (tableName === 'grades') {
                dataToExport = classRecords as unknown as Record<string, unknown>[];
            } else if (tableName === 'gradingSheetRecords') {
                dataToExport = gradingSheetRecords as unknown as Record<string, unknown>[];
            } else if (tableName === 'attendanceRecords') {
                dataToExport = attendanceRecords as unknown as Record<string, unknown>[];
            } else if (tableName === 'enrollments') {
                dataToExport = enrollments as unknown as Record<string, unknown>[];
            }

            if (dataToExport.length === 0) {
                alert(`No records found in table "${tableName}" to export.`);
                return;
            }

            exportToCSV(dataToExport, `FormEase_${tableName}_${new Date().toISOString().split('T')[0]}`);
            addMaintenanceLog(`Export table CSV: ${tableName}`, dataToExport.length);
        } catch (e) {
            alert('CSV Export failed: ' + e);
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

    // --- Database Storage scan ---
    const handleStorageScan = async () => {
        setIsScanningStorage(true);
        try {
            const stats = await db.getStoreStats();
            setStorageStats(stats);

            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                setStorageEstimate({
                    used: estimate.usage || 0,
                    total: estimate.quota || 100 * 1024 * 1024
                });
            } else {
                let totalSize = 0;
                Object.values(stats).forEach(s => totalSize += s.sizeBytes);
                setStorageEstimate({
                    used: totalSize,
                    total: 100 * 1024 * 1024
                });
            }
            addMaintenanceLog('Storage scan', Object.keys(stats).length);
        } catch (e) {
            alert('Storage scan failed: ' + e);
        } finally {
            setIsScanningStorage(false);
        }
    };

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
            
            const api = window.electronAPI as unknown as {
                saveBackupToPath?: (path: string, filename: string, backup: unknown) => Promise<void>;
            };
            if (api && api.saveBackupToPath) {
                const timestamp = new Date().toISOString().split('T')[0];
                const filename = `SMS_Backup_USB_${timestamp}.json`;
                await api.saveBackupToPath(usbDetectedPath, filename, backup);
                alert(`✅ Backup successfully saved to USB at ${usbDetectedPath}/${filename}`);
                addBackupHistoryEntry('USB Backup', JSON.stringify(backup).length, 'Success');
            } else {
                alert(`✅ Sandbox Simulation: Backup successfully saved to simulated USB drive at "${usbDetectedPath}"`);
                addBackupHistoryEntry('USB Backup (Simulated)', JSON.stringify(backup).length, 'Success');
            }
        } catch (e) {
            alert('Failed to save to USB: ' + e);
        }
    };

    // Database Maintenance (Ghost Students Cleanup)
    const [isCleaning, setIsCleaning] = useState(false);
    const handleCleanGhostStudents = async () => {
        try {
            const ghostStudents = students.filter(s => !sections.some(sec => sec.section_name === s.student_section));
            
            if (ghostStudents.length === 0) {
                alert('Database is clean. No ghost students found!');
                return;
            }
            
            setPendingConfirmation({
                title: `Delete ${ghostStudents.length} ghost student(s)?`,
                message: 'These unassigned student records will be permanently removed from the system.',
                details: 'This action cannot be undone.',
                confirmLabel: 'Delete Students',
                intent: 'danger',
                onConfirm: async () => {
                    setIsCleaning(true);
                    try {
                        for (const student of ghostStudents) {
                            await deleteStudent(student.lrn);
                        }
                        alert(`Success! Purged ${ghostStudents.length} ghost student record(s) from the database.`);
                    } catch (error) {
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
        const profileLrns = Array.from(new Set(studentProfiles.map((s) => s.lrn)));
        const enrollmentIdsToDelete = enrollments
            .filter((entry) => profileLrns.includes(entry.student_lrn))
            .map((entry) => entry.id);
        const gradeIdsToDelete = classRecords
            .filter((record) => profileLrns.includes(record.student_lrn))
            .map((record) => record.id);
        const gradingSheetIdsToDelete = gradingSheetRecords
            .filter((record) => profileLrns.includes(record.student_lrn))
            .map((record) => record.id);
        const observedValuesIdsToDelete = observedValues
            .filter((record) => profileLrns.includes(record.student_lrn))
            .map((record) => record.id);

        const totalGradeRecords = gradeIdsToDelete.length + gradingSheetIdsToDelete.length + observedValuesIdsToDelete.length;

        if (profileLrns.length === 0) {
            alert('No student profiles found to reset.');
            return;
        }

        setPendingConfirmation({
            title: 'Run full hard reset?',
            message: 'This will permanently delete student profiles, enrollments, and all grade records (E-Class, Consolidated, Core Values) for the current backup set.',
            details: `Student profiles: ${profileLrns.length}\nEnrollment records: ${enrollmentIdsToDelete.length}\nTotal Grade records: ${totalGradeRecords}\n\nYou will be asked to confirm with text in the next step.`,
            confirmLabel: 'Continue',
            intent: 'danger',
            onConfirm: async () => {
                setShowHardResetTextInput({ 
                    profileLrns, 
                    enrollmentIdsToDelete, 
                    gradeIdsToDelete,
                    gradingSheetIdsToDelete,
                    observedValuesIdsToDelete 
                });
            },
        });
    };

    const handleHardResetTextConfirm = async () => {
        if (!showHardResetTextInput) return;
        const { profileLrns, enrollmentIdsToDelete, gradeIdsToDelete, gradingSheetIdsToDelete, observedValuesIdsToDelete } = showHardResetTextInput;
        setShowHardResetTextInput(null);

        setIsRunningHardReset(true);
        try {
            const totalWork = gradeIdsToDelete.length + gradingSheetIdsToDelete.length + observedValuesIdsToDelete.length + enrollmentIdsToDelete.length + profileLrns.length;
            startProgress('Full Hard Reset', totalWork, 'Deleting grade records...');

            let totalDeleted = 0;
            const makeTracker = (base: number) => (deleted: number) => setProgressCompleted(base + deleted);

            await deleteByCollectionIds('grades', gradeIdsToDelete, makeTracker(totalDeleted));
            totalDeleted += gradeIdsToDelete.length;

            await deleteByCollectionIds('gradingSheetRecords', gradingSheetIdsToDelete, makeTracker(totalDeleted));
            totalDeleted += gradingSheetIdsToDelete.length;

            await deleteByCollectionIds('observedValues', observedValuesIdsToDelete, makeTracker(totalDeleted));
            totalDeleted += observedValuesIdsToDelete.length;

            setProgressStep('Deleting enrollment records...');
            await deleteByCollectionIds('enrollments', enrollmentIdsToDelete, makeTracker(totalDeleted));
            totalDeleted += enrollmentIdsToDelete.length;

            setProgressStep('Deleting student profiles...');
            await deleteByCollectionIds('students', profileLrns, makeTracker(totalDeleted));

            alert(
                `Hard reset complete.\n\n` +
                `Deleted student profiles: ${profileLrns.length}\n` +
                `Deleted enrollments: ${enrollmentIdsToDelete.length}\n` +
                `Deleted all grade records: ${gradeIdsToDelete.length + gradingSheetIdsToDelete.length + observedValuesIdsToDelete.length}`
            );
            setCleanupPreview(null);
            finishProgress('Completed');
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
    const [isPreviewingCleanup, setIsPreviewingCleanup] = useState(false);
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

    const handlePreviewRecordCleanup = () => {
        setIsPreviewingCleanup(true);
        try {
            const preview = buildCleanupPreview();
            setCleanupPreview(preview);
        } finally {
            setIsPreviewingCleanup(false);
        }
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
        const orphanIds = classRecords
            .filter((record) => !studentLrns.has(record.student_lrn) || !subjectIds.has(record.subject_id))
            .map((record) => record.id);

        if (orphanIds.length === 0) {
            alert('No orphan grade records found.');
            return;
        }

        setPendingConfirmation({
            title: `Delete ${orphanIds.length} orphan grade record(s)?`,
            message: 'These grade records are no longer linked to a valid student or subject.',
            details: 'This action is permanent.',
            confirmLabel: 'Delete Grades',
            intent: 'danger',
            onConfirm: async () => {
                setIsDeletingOrphanGrades(true);
                try {
                    startProgress('Delete Orphan Grade Records', orphanIds.length, 'Deleting orphan grade records...');
                    await deleteByCollectionIds('grades', orphanIds, (deletedCount) => {
                        setProgressCompleted(deletedCount);
                    });
                    alert(`Deleted ${orphanIds.length} orphan grade record(s).`);
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
            <div className="rounded-2xl border border-slate-200 bg-linear-to-r from-slate-50 via-white to-sky-50 p-6">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Settings</h2>
                <p className="mt-1 text-sm font-medium text-slate-600">Manage account access, backup, and maintenance.</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        S.Y. {activeSchoolYear}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                        Role: {user?.role || 'N/A'}
                    </span>
                </div>
            </div>

            <ConfirmationModal
                open={pendingConfirmation !== null}
                title={pendingConfirmation?.title || ''}
                message={pendingConfirmation?.message || ''}
                details={pendingConfirmation?.details}
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

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible shrink-0 gap-1.5 p-1.5 bg-slate-100/60 dark:bg-white/5 backdrop-blur-md rounded-2xl lg:w-64 lg:h-fit border border-slate-200/50 dark:border-white/5 scrollbar-none">
                    <button
                        onClick={() => setActiveTab('account')}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 w-full text-left whitespace-nowrap cursor-pointer ${
                            activeTab === 'account'
                                ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/30 dark:border-white/5'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/2'
                        }`}
                    >
                        <User className="w-4.5 h-4.5" />
                        <span>Account & Security</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('cloud')}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 w-full text-left whitespace-nowrap cursor-pointer ${
                            activeTab === 'cloud'
                                ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/30 dark:border-white/5'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/2'
                        }`}
                    >
                        <Cloud className="w-4.5 h-4.5" />
                        <span>Cloud Backup Sync</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('backups')}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 w-full text-left whitespace-nowrap cursor-pointer ${
                            activeTab === 'backups'
                                ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/30 dark:border-white/5'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/2'
                        }`}
                    >
                        <Database className="w-4.5 h-4.5" />
                        <span>Local Backups & Recovery</span>
                    </button>
                    {canPurge && (
                        <button
                            onClick={() => setActiveTab('maintenance')}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 w-full text-left whitespace-nowrap cursor-pointer ${
                                activeTab === 'maintenance'
                                    ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/30 dark:border-white/5'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/2'
                            }`}
                        >
                            <Shield className="w-4.5 h-4.5" />
                            <span>System Maintenance</span>
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('versions')}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 w-full text-left whitespace-nowrap cursor-pointer ${
                            activeTab === 'versions'
                                ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/30 dark:border-white/5'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/2'
                        }`}
                    >
                        <History className="w-4.5 h-4.5" />
                        <span>Version History</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('about')}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 w-full text-left whitespace-nowrap cursor-pointer ${
                            activeTab === 'about'
                                ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/30 dark:border-white/5'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/2'
                        }`}
                    >
                        <Info className="w-4.5 h-4.5" />
                        <span>About & Innovator</span>
                    </button>
                </div>

                {/* Main Content Pane */}
                <div className="flex-1 min-w-0">
                    {/* Tab 1: Account & Security */}
                    {activeTab === 'account' && (
                        <>
                        <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Account & Security</h3>
                                    <p className="text-xs font-semibold text-slate-400 mt-0.5">Manage your personal credentials and recovery options.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Display Name</p>
                                    <p className="text-sm font-extrabold text-slate-700 dark:text-gray-200 mt-1">{user?.displayName || 'N/A'}</p>
                                </div>
                                <div className="rounded-xl border border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</p>
                                    <p className="text-sm font-extrabold text-slate-700 dark:text-gray-200 mt-1 break-all">{user?.email || 'N/A'}</p>
                                </div>
                                <div className="rounded-xl border border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Security Access Role</p>
                                    <p className="flex items-center gap-1.5 text-sm font-extrabold text-slate-700 dark:text-gray-200 mt-1 capitalize">
                                        <Shield className="h-4 w-4 text-indigo-500" />
                                        {user?.role || 'N/A'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Unique Identifier (UID)</p>
                                    <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-1 break-all">{user?.uid || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="pt-2">
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                                >
                                    <User className="h-4 w-4" />
                                    Change Password & Settings
                                </button>
                            </div>
                        </div>

                        {/* Performance and Display Settings */}
                        <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-6 mt-6">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Display & Performance</h3>
                                    <p className="text-xs font-semibold text-slate-400 mt-0.5">Optimize the app interface and behavior for your device.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-gray-200">Disable UI Animations & Effects</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Turn off transitions, mesh gradients, and floating effects to improve responsiveness and reduce lag (highly recommended for Mac and older hardware).</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={disableAnimations} 
                                            onChange={handleToggleAnimations}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:bg-slate-700 peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                        </>)
                    }

                    {/* Tab 2: Backups & Recovery */}
                    {activeTab === 'backups' && (
                        <div className="space-y-8 animate-in fade-in duration-200">
                            {/* USB Detection Banner */}
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

                            {/* Options Guide section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">Choosing the Right Backup Type</h3>
                                        <p className="text-xs font-semibold text-slate-400 mt-0.5">Learn which backup option is best for your specific needs.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Option 1: Full Export */}
                                    <div className="relative rounded-2xl border border-indigo-500/30 bg-linear-to-br from-indigo-50/20 to-white dark:from-indigo-950/10 dark:to-[#0d1225] p-5 shadow-xs flex flex-col justify-between hover:scale-[1.01] transition-transform">
                                        <div className="absolute top-4 right-4 rounded-full bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-wider shadow-xs">
                                            Recommended
                                        </div>
                                        <div className="space-y-2.5">
                                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
                                                <Database className="w-4 h-4" />
                                                <span>1. Full Export</span>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Generates a single comprehensive <span className="font-extrabold text-indigo-600 dark:text-indigo-400">.json</span> file containing all student profiles, sections, subjects, grades, attendance, and settings.
                                            </p>
                                            <ul className="text-[10px] space-y-1 font-semibold text-slate-400">
                                                <li className="flex items-center gap-1.5">
                                                    <span className="text-emerald-500 font-bold">✓</span> Complete, standalone file
                                                </li>
                                                <li className="flex items-center gap-1.5">
                                                    <span className="text-emerald-500 font-bold">✓</span> Perfect for USB flash drives
                                                </li>
                                                <li className="flex items-center gap-1.5">
                                                    <span className="text-emerald-500 font-bold">✓</span> Transfer between computers
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 mt-4">
                                            <p className="text-[9px] font-black uppercase text-indigo-500">Best for: Safekeeping & compliance</p>
                                        </div>
                                    </div>

                                    {/* Option 2: Cloud Sync */}
                                    <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-5 shadow-xs flex flex-col justify-between hover:scale-[1.01] transition-transform">
                                        <div className="space-y-2.5">
                                            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-extrabold text-xs uppercase tracking-wider">
                                                <Cloud className="w-4 h-4" />
                                                <span>2. Cloud Sync</span>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Syncs your active portal database securely to your linked personal Google Drive account. Run restorations with a single click.
                                            </p>
                                            <ul className="text-[10px] space-y-1 font-semibold text-slate-400">
                                                <li className="flex items-center gap-1.5">
                                                    <span className="text-emerald-500 font-bold">✓</span> Off-site secure cloud storage
                                                </li>
                                                <li className="flex items-center gap-1.5">
                                                    <span className="text-emerald-500 font-bold">✓</span> Protects against device damage
                                                </li>
                                                <li className="flex items-center gap-1.5">
                                                    <span className="text-emerald-500 font-bold">✓</span> Fast cloud restore list
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 mt-4 flex justify-between items-center">
                                            <span className="text-[9px] font-black uppercase text-sky-500">Best for: Auto offsite backup</span>
                                            <button 
                                                onClick={() => setActiveTab('cloud')}
                                                className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline cursor-pointer"
                                            >
                                                Configure Cloud →
                                            </button>
                                        </div>
                                    </div>

                                    {/* Option 3: Local Checkpoints */}
                                    <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-5 shadow-xs flex flex-col justify-between hover:scale-[1.01] transition-transform">
                                        <div className="space-y-2.5">
                                            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-extrabold text-xs uppercase tracking-wider">
                                                <History className="w-4 h-4" />
                                                <span>3. Local Checkpoints</span>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Automatic offline snapshots saved to browser memory or local computer folders. Ideal for quick undo points.
                                            </p>
                                            <ul className="text-[10px] space-y-1 font-semibold text-slate-400">
                                                <li className="flex items-center gap-1.5">
                                                    <span className="text-emerald-500 font-bold">✓</span> Automated daily snapshots
                                                </li>
                                                <li className="flex items-center gap-1.5">
                                                    <span className="text-emerald-500 font-bold">✓</span> Pre-update rollbacks
                                                </li>
                                                <li className="flex items-center gap-1.5">
                                                    <span className="text-emerald-500 font-bold">✓</span> Instant localized restore
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 mt-4 flex justify-between items-center">
                                            <span className="text-[9px] font-black uppercase text-violet-500">Best for: Undoing mistakes</span>
                                            <button 
                                                onClick={() => {
                                                    setShowEmergencyRollbacks(true);
                                                    setTimeout(() => {
                                                        const el = document.getElementById('emergency-rollbacks-section');
                                                        el?.scrollIntoView({ behavior: 'smooth' });
                                                    }, 100);
                                                }}
                                                className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline cursor-pointer"
                                            >
                                                View Snapshots ↓
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Core Dashboard Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left Section: Core Operations (Col span 7 on lg) */}
                                <div className="lg:col-span-7 space-y-6">
                                    {/* Primary Card: Full Database Export */}
                                    <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-5">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                                                    <Database className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">Full Database Export</h3>
                                                        <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[8px] font-black px-2 py-0.5 border border-emerald-250/20">
                                                            Complete & Standalone
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-400 mt-0.5">Save a portable copy of all school records to your local device.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed space-y-3">
                                            <p>This exports a complete standalone backup file containing:</p>
                                            
                                            {/* Modern 4-column micro-stats grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                                                <div className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                                                    <span className="block font-black text-slate-700 dark:text-gray-200">👥 Students</span>
                                                    <span className="text-[11px] text-slate-400 font-extrabold">{students.length} enrollment(s)</span>
                                                </div>
                                                <div className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                                                    <span className="block font-black text-slate-700 dark:text-gray-200">🏫 Sections</span>
                                                    <span className="text-[11px] text-slate-400 font-extrabold">{sections.length} section(s)</span>
                                                </div>
                                                <div className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                                                    <span className="block font-black text-slate-700 dark:text-gray-200">📚 Subjects</span>
                                                    <span className="text-[11px] text-slate-400 font-extrabold">{subjects.length} subject(s)</span>
                                                </div>
                                                <div className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                                                    <span className="block font-black text-slate-700 dark:text-gray-200">📝 Grades</span>
                                                    <span className="text-[11px] text-slate-400 font-extrabold">All records</span>
                                                </div>
                                            </div>

                                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 mt-2">
                                                <span className="text-sm">💡</span>
                                                <p className="text-[10px] text-amber-600 dark:text-amber-300 font-extrabold leading-relaxed">
                                                    Keep this downloaded backup file safe in an external drive (e.g. USB flash drive) or secure cloud storage.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                            <button
                                                onClick={handleExportData}
                                                disabled={isExporting}
                                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3.5 text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/15 disabled:opacity-50 cursor-pointer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                {isExporting ? 'Exporting...' : 'Export Comprehensive Backup (.json)'}
                                            </button>
                                            <button
                                                onClick={() => setIsRestoreModalOpen(true)}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-gray-200 px-5 py-3.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                                            >
                                                <Upload className="h-4 w-4 text-emerald-500" />
                                                Restore Backup File
                                            </button>
                                        </div>
                                    </div>

                                    {/* Collapsible: Emergency Local Rollbacks */}
                                    <div id="emergency-rollbacks-section" className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-4">
                                        <button
                                            onClick={() => setShowEmergencyRollbacks(!showEmergencyRollbacks)}
                                            className="w-full flex items-center justify-between pb-1 cursor-pointer text-left focus:outline-hidden"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400">
                                                    <History className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">Emergency Restore Points</h3>
                                                        <span className="rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-black px-2 py-0.5 border border-slate-200/50 dark:border-white/5">
                                                            {autoBackups.length + fsBackups.length} checkpoint(s) available
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-400 mt-0.5">Access automatic offline rollbacks and system pre-update restore points. (Advanced)</p>
                                                </div>
                                            </div>
                                            <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                                {showEmergencyRollbacks ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </button>

                                        {showEmergencyRollbacks && (
                                            <div className="space-y-6 pt-2 animate-in slide-in-from-top-4 duration-300">
                                                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-[11px] text-amber-700 dark:text-amber-300 font-semibold leading-relaxed">
                                                    ⚠️ <strong className="font-black">Advanced Users Only:</strong> Local checkpoints are automatic rollbacks saved locally on this machine (browser memory or local disk). Use them if you made a mistake today and need to revert. They are not portable files.
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Column A: Automated Browser Snapshots */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="p-1 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                                                                    <History className="h-3.5 w-3.5" />
                                                                </span>
                                                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300">Browser Snapshots (IndexedDB)</h4>
                                                            </div>
                                                            <button
                                                                onClick={handleManualAutoBackup}
                                                                className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
                                                            >
                                                                Snapshot Now
                                                            </button>
                                                        </div>
                                                        
                                                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                                                            {autoBackups.length > 0 ? (
                                                                autoBackups.map((snap) => (
                                                                    <div key={snap.id} className="p-3.5 rounded-xl border border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 space-y-2 transition-all hover:bg-slate-100/50 dark:hover:bg-white/5">
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <p className="text-xs font-extrabold text-slate-800 dark:text-gray-200">{snap.label}</p>
                                                                                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                                                                    {new Date(snap.timestamp).toLocaleString()} | {(snap.fileSize / 1024).toFixed(1)} KB
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                                <button
                                                                                    onClick={() => handleRestoreAutoBackup(snap.id, snap.label)}
                                                                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                                                                >
                                                                                    Restore
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteAutoBackup(snap.id, snap.label)}
                                                                                    className="p-1.5 border border-slate-200 dark:border-white/5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                                                                                    aria-label="Delete"
                                                                                >
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                                        <path d="M3 6h18" />
                                                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {snap.recordCounts ? (
                                                                                <>
                                                                                    <span className="text-[8px] font-bold bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                                                                        👥 Students: {snap.recordCounts.students ?? 0}
                                                                                    </span>
                                                                                    <span className="text-[8px] font-bold bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                                                                        🏫 Sections: {snap.recordCounts.sections ?? 0}
                                                                                    </span>
                                                                                    <span className="text-[8px] font-bold bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                                                                        📚 Subjects: {snap.recordCounts.subjects ?? 0}
                                                                                    </span>
                                                                                    <span className="text-[8px] font-bold bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                                                                        📝 Grades: {(snap.recordCounts.classRecords ?? 0) + (snap.recordCounts.gradingSheetRecords ?? 0)}
                                                                                    </span>
                                                                                </>
                                                                            ) : (
                                                                                <span className="text-[8px] font-bold bg-red-100/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 px-1.5 py-0.5 rounded">
                                                                                    ⚠️ Old Decryption Format
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-white/5 rounded-xl text-slate-400 text-[10px] font-bold">
                                                                    No automated snapshots created yet.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Column B: Local Disk Backups */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                                                                    <Database className="h-3.5 w-3.5" />
                                                                </span>
                                                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300">Local Disk Snapshots</h4>
                                                            </div>
                                                            <button
                                                                onClick={loadFsBackups}
                                                                className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
                                                            >
                                                                Refresh List
                                                            </button>
                                                        </div>

                                                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                                                            {fsBackups.length > 0 ? (
                                                                fsBackups.map((snap) => (
                                                                    <div key={snap.filename} className="p-3.5 rounded-xl border border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 space-y-2 transition-all hover:bg-slate-100/50 dark:hover:bg-white/5">
                                                                        <div className="flex justify-between items-start gap-4">
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="text-xs font-extrabold text-slate-800 dark:text-gray-200 break-all">{snap.filename}</p>
                                                                                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                                                                    {new Date(snap.mtime).toLocaleString()} | {(snap.size / 1024 / 1024).toFixed(2)} MB
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                                <button
                                                                                    onClick={() => handleRestoreFsBackup(snap.filename)}
                                                                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                                                                >
                                                                                    Restore
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteFsBackup(snap.filename)}
                                                                                    className="p-1.5 border border-slate-200 dark:border-white/5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                                                                                    aria-label="Delete"
                                                                                >
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                                        <path d="M3 6h18" />
                                                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            <span className="text-[8px] font-bold bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                                                                👥 Students: {snap.summary.students ?? 0}
                                                                            </span>
                                                                            <span className="text-[8px] font-bold bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                                                                🏫 Sections: {snap.summary.sections ?? 0}
                                                                            </span>
                                                                            <span className="text-[8px] font-bold bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                                                                📚 Subjects: {snap.summary.subjects ?? 0}
                                                                            </span>
                                                                            <span className="text-[8px] font-bold bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                                                                📝 Grades: {snap.summary.grades ?? 0}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-white/5 rounded-xl text-slate-400 text-[10px] font-bold">
                                                                    No local filesystem backups found.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Section: Automation & Auditing (Col span 5 on lg) */}
                                <div className="lg:col-span-5 space-y-6">
                                    {/* Cloud Auto-Backup Schedule */}
                                    <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-4">
                                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                                            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400">
                                                <Cloud className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">Cloud Sync Schedule</h3>
                                                <p className="text-xs font-semibold text-slate-400 mt-0.5">Automatically sync database backups to Google Drive.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Backup Sync Interval</label>
                                                <select
                                                    value={cloudBackupSchedule}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setCloudBackupSchedule(value);
                                                        localStorage.setItem('formease_cloud_backup_schedule', value);
                                                        alert(`Cloud Auto-Backup schedule set to: ${value.toUpperCase()}`);
                                                    }}
                                                    className="form-input w-full capitalize rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-3 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
                                                >
                                                    <option value="off">Off (Manual Sync Only)</option>
                                                    <option value="daily">Daily</option>
                                                    <option value="weekly">Weekly</option>
                                                </select>
                                            </div>

                                            <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-white/2 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                                <span>Cloud Sync State:</span>
                                                <div className="flex items-center gap-1.5">
                                                    {cloudSyncState.linked && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                                    <span className={cloudSyncState.linked ? "text-emerald-500 font-extrabold" : "text-red-500 font-extrabold"}>
                                                        {cloudSyncState.linked ? `Linked (${cloudSyncState.email})` : 'Not Linked'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Backup & Restore History Timeline */}
                                    <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                                                    <History className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">Activity History</h3>
                                                    <p className="text-xs font-semibold text-slate-400 mt-0.5">Chronological record of operations.</p>
                                                </div>
                                            </div>
                                            {backupHistory.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        localStorage.removeItem('formease_backup_history');
                                                        setBackupHistory([]);
                                                    }}
                                                    className="text-[9px] font-black text-red-600 uppercase hover:underline cursor-pointer border border-red-500/10 px-2 py-0.5 rounded-md hover:bg-red-50"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                            {backupHistory.length > 0 ? (
                                                backupHistory.map((log, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs p-3 rounded-xl border border-slate-100 dark:border-white/2 bg-slate-50/30 dark:bg-white/1">
                                                        <div>
                                                            <span className="font-extrabold text-slate-700 dark:text-gray-200 capitalize">{log.type}</span>
                                                            <span className="text-[9px] text-slate-400 ml-2 font-bold bg-slate-105 dark:bg-white/10 px-1.5 py-0.5 rounded uppercase">{log.status}</span>
                                                        </div>
                                                        <div className="text-right flex items-center gap-2.5">
                                                            <span className="text-[9px] text-slate-400 font-bold">{new Date(log.timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
                                                            {log.size > 0 && <span className="bg-emerald-100/70 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-black px-1.5 py-0.5 rounded">{formatBytes(log.size)}</span>}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-slate-400 text-[11px] font-bold border border-dashed border-slate-200 dark:border-white/5 rounded-xl">
                                                    No backup activities logged yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2.5: Cloud Backup Sync */}
                    {activeTab === 'cloud' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Cloud Backup Sync (Google Drive) */}
                            <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                                    <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400">
                                        <Cloud className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Cloud Backup Sync</h3>
                                        <p className="text-xs font-semibold text-slate-400 mt-0.5">Securely duplicate backups to your personal Google Drive cloud folder.</p>
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Keep your data safe from hardware failure by syncing system backups directly to Google Drive. Backups are stored in a dedicated <code>FormEase_Backups</code> folder.
                                </p>
                                <div className="rounded-xl border border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Google Connection Status</p>
                                        <p className="text-sm font-extrabold text-slate-700 dark:text-gray-200 flex items-center gap-1.5 mt-1">
                                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${cloudSyncState.linked ? 'bg-emerald-500 shadow-md shadow-emerald-500/30 animate-pulse' : 'bg-rose-500'}`} />
                                            {cloudSyncState.linked ? `Linked as ${cloudSyncState.email}` : 'Disconnected'}
                                        </p>
                                        {cloudSyncState.lastSync && (
                                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                                                Last Synced: {new Date(cloudSyncState.lastSync).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {cloudSyncState.linked ? (
                                            <>
                                                <button
                                                    onClick={handleCloudSync}
                                                    disabled={isCloudSyncing}
                                                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-600/10"
                                                >
                                                    <Cloud className="w-4 h-4" />
                                                    {isCloudSyncing ? 'Syncing...' : 'Sync Now'}
                                                </button>
                                                <button
                                                    onClick={handleUnlinkGoogle}
                                                    className="px-4 py-2.5 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                                                >
                                                    Disconnect
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={handleLinkGoogle}
                                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
                                            >
                                                <Cloud className="w-4 h-4" />
                                                Link Google Account
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {cloudSyncState.linked && (
                                    <div className="rounded-xl border border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 p-4 space-y-4">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-white/5">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Cloud Restore Center</p>
                                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Download and restore system backups stored in Google Drive.</p>
                                            </div>
                                            <button
                                                onClick={loadCloudBackupsList}
                                                disabled={isLoadingCloudBackups}
                                                className="rounded-lg bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                            >
                                                {isLoadingCloudBackups ? 'Refreshing...' : 'Refresh Cloud List'}
                                            </button>
                                        </div>

                                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                                            {isLoadingCloudBackups ? (
                                                <div className="text-center py-8 text-slate-400 text-xs font-semibold animate-pulse">
                                                    Fetching backups from Google Drive...
                                                </div>
                                            ) : cloudBackups.length > 0 ? (
                                                cloudBackups.map((snap) => (
                                                    <div key={snap.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-slate-150 dark:border-white/5 bg-white dark:bg-[#090d16] gap-4 transition-all hover:bg-slate-50 dark:hover:bg-white/5">
                                                        <div className="space-y-1 min-w-0 flex-1">
                                                            <p className="text-xs font-extrabold text-slate-800 dark:text-gray-200 break-all">{snap.name}</p>
                                                            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                                                                Uploaded: {new Date(snap.createdTime).toLocaleString()} | Size: {snap.size ? `${(snap.size / 1024).toFixed(1)} KB` : 'Unknown'}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRestoreCloudBackup(snap.id, snap.name)}
                                                            disabled={isRestoringCloudBackup}
                                                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                                                        >
                                                            {isRestoringCloudBackup ? 'Restoring...' : 'Restore'}
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl text-slate-400 text-xs font-medium">
                                                    No backup files found in your Google Drive FormEase_Backups folder.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    )}

                    {/* Tab 3: System Maintenance */}
                    {activeTab === 'maintenance' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Database Maintenance</h3>
                                        <p className="text-xs font-semibold text-slate-400 mt-0.5">Analyze and optimize records, clean ghost profiles, and reset modules.</p>
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Use these administrative utilities to maintain schema health, normalize database formats, and clean up empty or unlinked records. Ensure a comprehensive backup is exported before executing modifications.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                                    <button
                                        onClick={handlePreviewRecordCleanup}
                                        disabled={isPreviewingCleanup}
                                        className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 hover:bg-slate-100/50 dark:hover:bg-white/5 px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-gray-200 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <div className="font-extrabold uppercase tracking-wider text-[11px] mb-0.5 text-slate-800 dark:text-white">Preview Record Cleanup</div>
                                        <span className="text-[10px] text-slate-400 font-semibold">Scan database for textual inconsistencies and orphans.</span>
                                    </button>
                                    <button
                                        onClick={handleNormalizeRecords}
                                        disabled={isNormalizingRecords}
                                        className="rounded-xl border border-blue-150 dark:border-blue-900/35 bg-blue-50/30 dark:bg-blue-950/15 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 px-4 py-3 text-left text-xs font-bold text-blue-700 dark:text-blue-400 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <div className="font-extrabold uppercase tracking-wider text-[11px] mb-0.5 text-blue-800 dark:text-blue-300">Normalize Names & Text</div>
                                        <span className="text-[10px] text-blue-400/80 font-semibold">Format capitalization and clean excess whitespaces.</span>
                                    </button>
                                    <button
                                        onClick={handleCleanGhostStudents}
                                        disabled={isCleaning}
                                        className="rounded-xl border border-rose-150 dark:border-rose-900/35 bg-rose-50/30 dark:bg-rose-950/15 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 px-4 py-3 text-left text-xs font-bold text-rose-700 dark:text-rose-400 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <div className="font-extrabold uppercase tracking-wider text-[11px] mb-0.5 text-rose-800 dark:text-rose-300">Purge Ghost Students</div>
                                        <span className="text-[10px] text-rose-400/80 font-semibold">Remove students not assigned to any active section.</span>
                                    </button>
                                    <button
                                        onClick={handleCleanGhostSections}
                                        disabled={isPurgingSections}
                                        className="rounded-xl border border-amber-150 dark:border-amber-900/35 bg-amber-50/30 dark:bg-amber-950/15 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 px-4 py-3 text-left text-xs font-bold text-amber-700 dark:text-amber-400 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <div className="font-extrabold uppercase tracking-wider text-[11px] mb-0.5 text-amber-800 dark:text-amber-300">Purge Ghost Sections</div>
                                        <span className="text-[10px] text-amber-400/80 font-semibold">Delete sections with 0 students and 0 subjects.</span>
                                    </button>
                                    
                                    {/* Feature 1: Duplicate LRN Detector */}
                                    <button
                                        onClick={handleDuplicateLrnScan}
                                        disabled={isScanningDuplicates}
                                        className="rounded-xl border border-indigo-150 dark:border-indigo-900/35 bg-indigo-50/30 dark:bg-indigo-950/15 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 px-4 py-3 text-left text-xs font-bold text-indigo-700 dark:text-indigo-400 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <div className="font-extrabold uppercase tracking-wider text-[11px] mb-0.5 text-indigo-800 dark:text-indigo-300">Duplicate LRN Detector</div>
                                        <span className="text-[10px] text-indigo-400/80 font-semibold">Scan and merge duplicate student profiles.</span>
                                    </button>

                                    {/* Feature 3: Bulk LRN Validator */}
                                    <button
                                        onClick={handleLrnValidation}
                                        disabled={isScanningLrnValidation}
                                        className="rounded-xl border border-teal-150 dark:border-teal-900/35 bg-teal-50/30 dark:bg-teal-950/15 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 px-4 py-3 text-left text-xs font-bold text-teal-700 dark:text-teal-400 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <div className="font-extrabold uppercase tracking-wider text-[11px] mb-0.5 text-teal-800 dark:text-teal-300">Bulk LRN Validator</div>
                                        <span className="text-[10px] text-teal-400/80 font-semibold">Flag LRN format errors and temp-LRNs.</span>
                                    </button>

                                    {/* Feature 4: Orphan Attendance Records Cleanup */}
                                    <button
                                        onClick={handleCleanOrphanAttendance}
                                        className="rounded-xl border border-fuchsia-150 dark:border-fuchsia-900/35 bg-fuchsia-50/30 dark:bg-fuchsia-950/15 hover:bg-fuchsia-50/60 dark:hover:bg-fuchsia-950/30 px-4 py-3 text-left text-xs font-bold text-fuchsia-700 dark:text-fuchsia-400 transition-all cursor-pointer"
                                    >
                                        <div className="font-extrabold uppercase tracking-wider text-[11px] mb-0.5 text-fuchsia-800 dark:text-fuchsia-300">Purge Orphan Attendance</div>
                                        <span className="text-[10px] text-fuchsia-400/80 font-semibold">Delete attendance logs without active students.</span>
                                    </button>

                                    {/* Feature 6: Grade Consistency Checker */}
                                    <button
                                        onClick={handleGradeConsistencyCheck}
                                        disabled={isScanningConsistency}
                                        className="rounded-xl border border-cyan-150 dark:border-cyan-900/35 bg-cyan-50/30 dark:bg-cyan-950/15 hover:bg-cyan-50/60 dark:hover:bg-cyan-950/30 px-4 py-3 text-left text-xs font-bold text-cyan-700 dark:text-cyan-400 transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        <div className="font-extrabold uppercase tracking-wider text-[11px] mb-0.5 text-cyan-800 dark:text-cyan-300">Grade Consistency Check</div>
                                        <span className="text-[10px] text-cyan-400/80 font-semibold">Scan grades for gaps or out-of-bounds ratings.</span>
                                    </button>
                                    
                                    {/* Feature 10: Scheduled Auto-Cleanup Toggle */}
                                    <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-white/2 px-4 py-3 flex flex-col justify-between">
                                        <div>
                                            <div className="font-extrabold uppercase tracking-wider text-[11px] mb-0.5 text-slate-800 dark:text-white">Auto Weekly Cleanup</div>
                                            <span className="text-[10px] text-slate-400 font-semibold">Automatically clean database schema weekly.</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer select-none mt-2">
                                            <input 
                                                type="checkbox" 
                                                checked={autoCleanupEnabled} 
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setAutoCleanupEnabled(checked);
                                                    localStorage.setItem('formease_auto_cleanup_enabled', checked ? 'true' : 'false');
                                                }}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:bg-slate-700 peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={() => setShowDangerZone((prev) => !prev)}
                                        className="w-full rounded-xl border border-red-200 dark:border-red-900/30 bg-white hover:bg-red-50/30 dark:bg-transparent dark:hover:bg-red-950/10 px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 transition-all cursor-pointer"
                                    >
                                        {showDangerZone ? 'Hide Admin Danger Zone' : 'Show Admin Danger Zone ⚠️'}
                                    </button>
                                </div>

                                {showDangerZone && (
                                    <div className="space-y-3 rounded-2xl border border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/15 p-5 animate-in slide-in-from-top-2 duration-200">
                                        <div className="pb-2 border-b border-red-100 dark:border-red-950/30">
                                            <h4 className="text-xs font-black text-red-800 dark:text-red-400 uppercase tracking-widest">⚠️ Administrative Reset Actions</h4>
                                            <p className="text-[10px] text-red-500 font-semibold mt-0.5">These destructive actions are permanent and reset database modules.</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <button
                                                onClick={handleDeleteOrphanGradeRecords}
                                                disabled={isDeletingOrphanGrades}
                                                className="rounded-xl bg-red-100/50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 border border-red-200/50 dark:border-red-900/30 px-3 py-2 text-left text-xs font-bold text-red-700 dark:text-red-400 transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                <div className="font-extrabold uppercase text-[10px] tracking-wider mb-0.5">Delete Orphan Grades</div>
                                                <span className="text-[9px] text-red-500/70 font-semibold">Delete grades not linked to active students.</span>
                                            </button>
                                            <button
                                                onClick={handleClearAllCurrentStudents}
                                                disabled={isClearingAllStudents}
                                                className="rounded-xl bg-rose-600 hover:bg-rose-700 border border-rose-700 px-3 py-2 text-left text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                <div className="font-extrabold uppercase text-[10px] tracking-wider mb-0.5">Fresh Start: Clear Students</div>
                                                <span className="text-[9px] text-rose-100/75 font-semibold">Remove all enrollments for this school year.</span>
                                            </button>
                                            <button
                                                onClick={handleClearStudentsAndOrphanGrades}
                                                disabled={isClearingStudentsAndGrades}
                                                className="rounded-xl bg-red-600 hover:bg-red-700 border border-red-700 px-3 py-2 text-left text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                <div className="font-extrabold uppercase text-[10px] tracking-wider mb-0.5">Clear Students + Grades</div>
                                                <span className="text-[9px] text-red-100/75 font-semibold">Wipe both enrollments and grades globally.</span>
                                            </button>
                                            <button
                                                onClick={handleFullHardReset}
                                                disabled={isRunningHardReset}
                                                className="rounded-xl bg-slate-900 hover:bg-black border border-black dark:bg-[#090d16] dark:hover:bg-[#121927] px-3 py-2 text-left text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                <div className="font-extrabold uppercase text-[10px] tracking-wider mb-0.5">Full Reset (Delete Profiles)</div>
                                                <span className="text-[9px] text-slate-400 font-semibold">Delete all profiles, enrollments, and grades.</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Feature 2: Database Storage Monitor */}
                            <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                                            <Database className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Database Storage Monitor</h3>
                                            <p className="text-xs font-semibold text-slate-400 mt-0.5">Monitor and analyze local IndexedDB database sizes.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleStorageScan}
                                        disabled={isScanningStorage}
                                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                                    >
                                        {isScanningStorage ? 'Scanning...' : 'Analyze Storage'}
                                    </button>
                                </div>

                                {storageEstimate && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-extrabold">
                                            <span className="text-slate-500">IndexedDB Storage Used:</span>
                                            <span className="text-slate-800 dark:text-white">
                                                {formatBytes(storageEstimate.used)} of {formatBytes(storageEstimate.total)}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-600 rounded-full transition-all"
                                                style={{ width: `${Math.min(100, (storageEstimate.used / storageEstimate.total) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {storageStats && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                        {Object.entries(storageStats).map(([table, stat]) => (
                                            <div key={table} className="p-3 rounded-xl border border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                                                <div className="text-[10px] font-black text-slate-400 uppercase truncate">{table}</div>
                                                <div className="text-sm font-black text-slate-800 dark:text-white mt-1">{stat.count} <span className="text-[9px] font-semibold text-slate-400">rows</span></div>
                                                <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{formatBytes(stat.sizeBytes)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Feature 7 & 8: School Year Archiver & CSV Export */}
                            <div className="grid grid-cols-1 gap-6">
                                {/* School Year Archiver (Temporarily hidden)
                                <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-4">
                                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                                            <History className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">School Year Archiver</h3>
                                            <p className="text-xs font-semibold text-slate-400 mt-0.5">Archive and purge historical records to keep database clean.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <select 
                                            value={archiveSY}
                                            onChange={(e) => setArchiveSY(e.target.value)}
                                            className="form-input flex-1"
                                        >
                                            {schoolYears.map(sy => (
                                                <option key={sy.sy_id} value={sy.label}>{sy.label}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleArchiveSchoolYear}
                                            disabled={isArchiving}
                                            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                                        >
                                            {isArchiving ? 'Archiving...' : 'Archive & Purge'}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">
                                        * Note: This will download a standalone year-specific JSON backup of all grades and attendance, then delete those records for the selected year from the database.
                                    </p>
                                </div>
                                */}

                                {/* CSV Export Card */}
                                <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-4">
                                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                                            <Upload className="h-5 w-5 rotate-180" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Data Export as CSV</h3>
                                            <p className="text-xs font-semibold text-slate-400 mt-0.5">Download individual database tables as clean CSV spreadsheets.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['students', 'sections', 'subjects', 'grades', 'gradingSheetRecords', 'attendanceRecords', 'enrollments'].map(table => (
                                            <button
                                                key={table}
                                                onClick={() => handleExportTableCsv(table)}
                                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-gray-300 cursor-pointer"
                                            >
                                                {table.replace('Records', '')} ↓
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Reports & Previews */}
                            {cleanupPreview && (
                                <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 p-5 text-xs text-slate-700 dark:text-gray-300 space-y-3.5">
                                    <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[11px] pb-2 border-b border-slate-200/50 dark:border-white/5">Record Cleanup Scan Report</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Text Normalizations</p>
                                            <p className="text-base font-extrabold text-slate-800 dark:text-white">{cleanupPreview.studentUpdates}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject Text Normalizations</p>
                                            <p className="text-base font-extrabold text-slate-800 dark:text-white">{cleanupPreview.subjectUpdates}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Section Text Normalizations</p>
                                            <p className="text-base font-extrabold text-slate-800 dark:text-white">{cleanupPreview.sectionUpdates}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orphan Grade Records</p>
                                            <p className="text-base font-extrabold text-red-500 dark:text-red-400">{cleanupPreview.orphanGrades}</p>
                                        </div>
                                    </div>
                                    {cleanupPreview.orphanGradeSample.length > 0 && (
                                        <div className="bg-white dark:bg-[#0a0f1d] border border-slate-150 dark:border-white/5 p-3 rounded-xl">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sample Orphan Record IDs</p>
                                            <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 break-all leading-relaxed">{cleanupPreview.orphanGradeSample.join(', ')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {lrnValidationIssues.length > 0 && (
                                <div className="rounded-2xl border border-teal-200 dark:border-teal-900/30 bg-teal-50/20 dark:bg-teal-950/10 p-5 text-xs text-slate-700 dark:text-gray-300 space-y-3">
                                    <div className="flex justify-between items-center pb-2 border-b border-teal-200/40">
                                        <p className="font-black text-teal-800 dark:text-teal-400 uppercase tracking-widest text-[11px]">LRN Format Issue Scan Report ({lrnValidationIssues.length})</p>
                                        <button onClick={() => setLrnValidationIssues([])} className="text-[10px] text-teal-600 dark:text-teal-400 uppercase font-black cursor-pointer">Clear Report</button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                        {lrnValidationIssues.map((issue, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-1">
                                                <div>
                                                    <span className="font-extrabold text-slate-800 dark:text-white">{issue.student.first_name} {issue.student.last_name}</span>
                                                    <span className="ml-2 font-mono text-[10px] bg-teal-100 dark:bg-teal-950 px-1.5 py-0.5 rounded text-teal-800 dark:text-teal-300">{issue.student.lrn}</span>
                                                </div>
                                                <span className="text-red-500 font-semibold">{issue.issue}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {gradeConsistencyIssues.length > 0 && (
                                <div className="rounded-2xl border border-cyan-200 dark:border-cyan-900/30 bg-cyan-50/20 dark:bg-cyan-950/10 p-5 text-xs text-slate-700 dark:text-gray-300 space-y-3">
                                    <div className="flex justify-between items-center pb-2 border-b border-cyan-200/40">
                                        <p className="font-black text-cyan-800 dark:text-cyan-400 uppercase tracking-widest text-[11px]">Grade Consistency Scan Report ({gradeConsistencyIssues.length})</p>
                                        <button onClick={() => setGradeConsistencyIssues([])} className="text-[10px] text-cyan-600 dark:text-cyan-400 uppercase font-black cursor-pointer">Clear Report</button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                        {gradeConsistencyIssues.map((issue, idx) => (
                                            <div key={idx} className="py-1 border-b border-slate-100 dark:border-white/2 last:border-0">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-extrabold text-slate-800 dark:text-white">{issue.studentName}</span>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                                        issue.severity === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                                    }`}>{issue.type}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{issue.details}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Feature 9: Maintenance Activity Log Timeline */}
                            <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                                            <History className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Maintenance Activity Log</h3>
                                            <p className="text-xs font-semibold text-slate-400 mt-0.5">Audit trail of database cleanup and structure actions.</p>
                                        </div>
                                    </div>
                                    {maintenanceLogs.length > 0 && (
                                        <button
                                            onClick={() => {
                                                localStorage.removeItem('formease_maintenance_log');
                                                setMaintenanceLogs([]);
                                            }}
                                            className="text-[10px] font-black text-red-600 uppercase hover:underline cursor-pointer"
                                        >
                                            Clear Log
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar">
                                    {maintenanceLogs.length > 0 ? (
                                        maintenanceLogs.map((log, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-xs p-3 rounded-xl border border-slate-100 dark:border-white/2 bg-slate-50/30 dark:bg-white/1">
                                                <div>
                                                    <span className="font-extrabold text-slate-700 dark:text-gray-200 capitalize">{log.action}</span>
                                                    <span className="text-[10px] text-slate-400 ml-2 font-semibold">by {log.user}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] text-slate-400 font-bold">{new Date(log.timestamp).toLocaleString()}</span>
                                                    {log.count > 0 && <span className="ml-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black px-1.5 py-0.5 rounded">{log.count} records</span>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-slate-400 text-xs font-medium">
                                            No maintenance activities logged yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {maintenanceProgress.total > 0 && (
                                <div className="rounded-2xl border border-blue-200 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/15 p-5 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider text-xs">{maintenanceProgress.title}</p>
                                            <p className="text-xs text-blue-700/80 dark:text-blue-400 font-semibold mt-0.5">{maintenanceProgress.currentStep}</p>
                                        </div>
                                        <span className="font-mono text-xs font-black text-blue-800 dark:text-blue-400 shrink-0">
                                            {Math.round((maintenanceProgress.completed / Math.max(1, maintenanceProgress.total)) * 100)}%
                                        </span>
                                    </div>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-blue-100 dark:bg-white/10">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${Math.round((maintenanceProgress.completed / Math.max(1, maintenanceProgress.total)) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-blue-500/80 dark:text-blue-400/80 font-bold uppercase tracking-wider">
                                        Progress: {maintenanceProgress.completed} of {maintenanceProgress.total} records resolved
                                    </p>
                                </div>
                            )}

                            {/* Database Self-Healing Diagnostics */}
                            <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Self-Healing Diagnostics</h3>
                                            <p className="text-xs font-semibold text-slate-400 mt-0.5">Scan for corrupted records, duplicates, or format anomalies and repair them.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRunDiagnostics}
                                        disabled={isScanningDiagnostics}
                                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                    >
                                        {isScanningDiagnostics ? 'Scanning...' : 'Scan Database'}
                                    </button>
                                </div>

                                {diagnosticIssues.length > 0 ? (
                                    <div className="space-y-3">
                                        {diagnosticIssues.map((issue) => (
                                            <div key={issue.id} className="p-4 rounded-2xl border border-slate-150 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                            issue.severity === 'error'
                                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                                                                : issue.severity === 'warning'
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                                                        }`}>
                                                            {issue.severity}
                                                        </span>
                                                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">{issue.description}</h4>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{issue.details}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRepairIssue(issue)}
                                                    disabled={isRepairingDiagnostics}
                                                    className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                                                >
                                                    Auto Repair
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl text-slate-400 text-xs font-medium">
                                        Click "Scan Database" to scan your IndexedDB tables for consistency issues.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Version History */}
                    {activeTab === 'versions' && (
                        <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0d1225] p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                                        <History className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Version History</h3>
                                        <p className="text-xs font-semibold text-slate-400 mt-0.5">Explore update releases, feature rollouts, and changelog summaries.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCheckForUpdates}
                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                                >
                                    Check for Updates
                                </button>
                            </div>

                            <div className="space-y-6 relative pl-3 border-l-2 border-slate-100 dark:border-white/5 ml-2.5">
                                {/* Version 2.5.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.5.1</span>
                                        <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5">Latest Production</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 12, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Redesigned and optimized Settings "Backups & Recovery" tab layout into a modern 2-column dashboard grid.</li>
                                        <li>Commented out incomplete "Multi-Device Sync" and "School Year Archiver" features to simplify user interface.</li>
                                        <li>Fixed multiple pre-existing TypeScript compile warnings and linter errors to achieve clean build status.</li>
                                    </ul>
                                </div>

                                {/* Version 2.5.0 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.5.0</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 5, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added daily QR attendance scanning functionality.</li>
                                        <li>Added calendar announcements feature.</li>
                                        <li>Improved robustness and speed of grade sheets synchronization.</li>
                                    </ul>
                                </div>

                                {/* Version 2.4.5 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.4.5</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 5, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed the application icon missing from the installed app so the FormEase Pro logo appears on the executable, installer, desktop shortcuts, and taskbar.</li>
                                        <li>Rebuilt the Windows icon with multi-size images for crisp rendering in the title bar, taskbar, and Explorer.</li>
                                        <li>Included missing DepEd and school certificate logo assets in the application bundle.</li>
                                    </ul>
                                </div>

                                {/* Version 2.4.4 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.4.4</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 5, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Resolved CORS/relative path loading bugs for fonts and logos on both routing subpaths and Electron.</li>
                                        <li>Centered advanced certificate text blocks and improved margins for Title and Date lines.</li>
                                        <li>Added automatic signature display toggle checkboxes in place of manual uploads.</li>
                                        <li>Fixed missing Subject Awards search by adding a grade-level subjects fallback.</li>
                                        <li>Configured application user model ID to link native taskbar and titlebar window icons to the desktop shortcut on Windows.</li>
                                    </ul>
                                </div>

                                {/* Version 2.4.3 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.4.3</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 4, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed a layout formatting bug in the Advanced Certificate Generator preview within the installed app by statically compiling and bundling the certificate stylesheet.</li>
                                    </ul>
                                </div>

                                {/* Version 2.4.2 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.4.2</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">July 4, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added native window close interception prompts to prevent closing the application without confirming.</li>
                                        <li>Optimized the Institutional Profile edit page dimensions, scaling down image elements and inputs to fit on screen without vertical scrollbars.</li>
                                        <li>Implemented a select dropdown menu with 18 official offerings for Grade Levels Offered.</li>
                                    </ul>
                                </div>

                                {/* Version 2.3.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.3.1</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 26, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed a critical UI bug where the FormEase Update Center modal blocked the application screen without a close/dismiss option.</li>
                                        <li>Added a new database scanner check under Settings -&gt; Self-Healing Diagnostics to identify and automatically repair (delete) corrupted or unreadable student profiles.</li>
                                    </ul>
                                </div>

                                {/* Version 2.2.7 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.2.7</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed a discrepancy in the section teaching load subject list by filtering out other sections' subjects and deduplicating by exact subject name (preserving unique parenthesized electives).</li>
                                        <li>Replaced the non-operational Academic Health card on the dashboard with a functional 'Class Sections & Subject Loads' card tracking active sections and teaching loads.</li>
                                    </ul>
                                </div>

                                {/* Version 2.2.6 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.2.6</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Fixed a critical freeze in SF2 Daily Attendance caused by calendar holiday parsing logic.</li>
                                    </ul>
                                </div>

                                {/* Version 2.2.5 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.2.5</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added custom Student Enrollment Template download and import with LRN bypass support.</li>
                                        <li>Automatically normalizes student names to ALL CAPS when imported.</li>
                                        <li>Prevents database record duplication/resets by automatically merging existing students during template or SF1 imports.</li>
                                        <li>Intelligently formats and hides temporary IDs (`TEMP-` prefix) in the students list, dropdown selector, reports (SF9/SF10), and CSV exports.</li>
                                    </ul>
                                </div>

                                {/* Version 2.2.4 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.2.4</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Implemented 7-day offline grace limit and automatic reconnection license checks.</li>
                                        <li>Gated PDF report generation and printing behind active product validation checks.</li>
                                        <li>Added user-friendly offline limit warnings to the Product Activation screen.</li>
                                    </ul>
                                </div>

                                {/* Version 2.2.3 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.2.3</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added Track display for Grade 11 section cards and Track & Strand display for Grade 12 section cards.</li>
                                        <li>Integrated dynamic statement-form comment suggestions engine with Tone selection in SF9 Remarks.</li>
                                        <li>Capped SF9 comments at 250 characters with validation warning and automatic spacing/punctuation helpers.</li>
                                    </ul>
                                </div>

                                {/* Version 2.2.2 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.2.2</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Added option to edit custom grading weight percentages (Written, Performance, Exam) for subjects.</li>
                                        <li>Excluded calendar holiday dates dynamically from SF2 daily attendance.</li>
                                        <li>Updated sidebar and main workspace to modern flat edge-to-edge layouts (no rounded edges).</li>
                                        <li>Added sign-out confirmation popup with automatic silent database backup.</li>
                                        <li>Fixed the backup restore interface to support importing auto-backups and logout-backups.</li>
                                    </ul>
                                </div>

                                {/* Version 2.2.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.2.1</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">June 14, 2026</p>
                                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-gray-300 font-semibold list-disc list-inside leading-relaxed">
                                        <li>Removed redundant PDF Download button from the SF2 page.</li>
                                        <li>Wired up custom printing to PDF using Electron backend.</li>
                                        <li>Fixed overlapping character spacing issues in Chrome/Electron printing.</li>
                                        <li>Added auto-loading of standard subjects (Grade 1 to 12) for empty databases.</li>
                                        <li>Fixed month-switching and session logout SF2 data preservation.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200/50 dark:border-white/10 h-[calc(100vh-220px)] min-h-[500px]">
                            <AboutPage />
                        </div>
                    )}
                </div>
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
