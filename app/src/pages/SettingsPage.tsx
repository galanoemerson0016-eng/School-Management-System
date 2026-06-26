import { useState, useEffect, useCallback } from 'react';
import { useAuthStore, useAppStore, initializeAppStore, useUpdateStore } from '../stores';
import { db } from '../services/database';
import { Database, User, Shield, Upload, History, Cloud } from 'lucide-react';
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
import { compareBackupSizes } from '../utils/backup-compression';
import { createBackupMetadata, saveBackupMetadata } from '../utils/backup-metadata';

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
    const [activeTab, setActiveTab] = useState<'account' | 'cloud' | 'backups' | 'maintenance' | 'versions'>('account');

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
            const backupJson = JSON.stringify(currentBackup, null, 2);
            const timestamp = new Date().toISOString().split('T')[0];
            let exportData = backupJson;
            let filename = `SMS_Backup_Comprehensive_${timestamp}`;

            // Handle encryption
            let fileExt = '.json';
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
                </div>

                {/* Main Content Pane */}
                <div className="flex-1 min-w-0">
                    {/* Tab 1: Account & Security */}
                    {activeTab === 'account' && (
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
                    )}

                    {/* Tab 2: Backups & Recovery */}
                    {activeTab === 'backups' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Backup Options Guide */}
                            <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950/40 bg-linear-to-br from-indigo-50/30 via-white to-sky-50/20 dark:from-indigo-950/5 dark:via-[#0d1225] dark:to-sky-950/5 p-6 shadow-xs space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Choosing the Right Backup Type</h3>
                                        <p className="text-xs font-semibold text-slate-400 mt-0.5">Learn which backup option is best for your specific needs.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Option 1: Full Export */}
                                    <div className="relative rounded-2xl border-2 border-indigo-500/20 bg-white/70 dark:bg-[#141b36]/40 p-5 shadow-xs space-y-2 flex flex-col justify-between">
                                        <div className="absolute top-3 right-3 rounded-full bg-indigo-500 text-white text-[9px] font-black px-2.5 py-0.5 uppercase tracking-wider shadow-xs">
                                            Recommended
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                                                <Database className="w-4 h-4" />
                                                <span>1. Full Database Export</span>
                                            </div>
                                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Generates a single comprehensive <span className="font-extrabold text-indigo-600 dark:text-indigo-400">.json</span> file containing all student profiles, sections, subjects, grades, attendance, and settings.
                                            </p>
                                            <ul className="text-[10px] space-y-1 font-semibold text-slate-400">
                                                <li className="flex items-start gap-1">
                                                    <span className="text-emerald-500 font-bold">✓</span> Complete, standalone file
                                                </li>
                                                <li className="flex items-start gap-1">
                                                    <span className="text-emerald-500 font-bold">✓</span> Perfect for USB flash drives
                                                </li>
                                                <li className="flex items-start gap-1">
                                                    <span className="text-emerald-500 font-bold">✓</span> Transfer between computers
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 mt-2">
                                            <p className="text-[10px] font-black uppercase text-indigo-500">Best for: Safekeeping & compliance</p>
                                        </div>
                                    </div>

                                    {/* Option 2: Cloud Sync */}
                                    <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-white/2 p-5 space-y-2 flex flex-col justify-between hover:border-slate-355 dark:hover:border-white/10 transition-colors">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-extrabold text-sm">
                                                <Cloud className="w-4 h-4" />
                                                <span>2. Cloud Sync (Google Drive)</span>
                                            </div>
                                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Syncs your active portal database securely to your linked personal Google Drive account. Run restorations with a single click.
                                            </p>
                                            <ul className="text-[10px] space-y-1 font-semibold text-slate-400">
                                                <li className="flex items-start gap-1">
                                                    <span className="text-emerald-500 font-bold">✓</span> Off-site secure cloud storage
                                                </li>
                                                <li className="flex items-start gap-1">
                                                    <span className="text-emerald-500 font-bold">✓</span> Protects against device damage
                                                </li>
                                                <li className="flex items-start gap-1">
                                                    <span className="text-emerald-500 font-bold">✓</span> Fast cloud restore list
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 mt-2 flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-sky-500">Best for: Auto offsite backup</span>
                                            <button 
                                                onClick={() => setActiveTab('cloud')}
                                                className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline cursor-pointer"
                                            >
                                                Configure Cloud →
                                            </button>
                                        </div>
                                    </div>

                                    {/* Option 3: Local Checkpoints */}
                                    <div className="rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-white/2 p-5 space-y-2 flex flex-col justify-between hover:border-slate-355 dark:hover:border-white/10 transition-colors">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-extrabold text-sm">
                                                <History className="w-4 h-4" />
                                                <span>3. System Checkpoints</span>
                                            </div>
                                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Automatic offline snapshots saved to browser memory or local computer folders. Ideal for quick undo points.
                                            </p>
                                            <ul className="text-[10px] space-y-1 font-semibold text-slate-400">
                                                <li className="flex items-start gap-1">
                                                    <span className="text-emerald-500 font-bold">✓</span> Automated daily snapshots
                                                </li>
                                                <li className="flex items-start gap-1">
                                                    <span className="text-emerald-500 font-bold">✓</span> Pre-update rollbacks
                                                </li>
                                                <li className="flex items-start gap-1">
                                                    <span className="text-emerald-500 font-bold">✓</span> Instant localized restore
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 mt-2 flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-violet-500">Best for: Undoing mistakes</span>
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

                            {/* Primary: Full Comprehensive Backup card */}
                            <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-xs bg-linear-to-b from-indigo-50/20 via-white to-white dark:from-indigo-950/5 dark:via-[#0d1225] dark:to-[#0d1225] p-6 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-indigo-50 dark:border-indigo-950/20">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-indigo-600 text-white">
                                            <Database className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Full Database Export</h3>
                                                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-2 py-0.5 border border-emerald-200/30">
                                                    Complete & Standalone
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-400 mt-0.5">Save a portable copy of all school records to your local device.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed space-y-2">
                                    <p>
                                        This exports a complete standalone backup file containing:
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                        <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 text-[11px]">
                                            <span className="block font-black text-slate-700 dark:text-gray-200">👥 Student Profiles</span>
                                            <span className="text-[10px] text-slate-400 font-bold">{students.length} enrollment(s)</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 text-[11px]">
                                            <span className="block font-black text-slate-700 dark:text-gray-200">🏫 Sections & Classes</span>
                                            <span className="text-[10px] text-slate-400 font-bold">{sections.length} section(s)</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 text-[11px]">
                                            <span className="block font-black text-slate-700 dark:text-gray-200">📚 Subjects</span>
                                            <span className="text-[10px] text-slate-400 font-bold">{subjects.length} subject(s)</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 text-[11px]">
                                            <span className="block font-black text-slate-700 dark:text-gray-200">📝 Grades & Attendance</span>
                                            <span className="text-[10px] text-slate-400 font-bold">All class records</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-amber-500 font-bold italic pt-2">
                                        💡 Keep this downloaded backup file safe in an external drive (e.g. USB flash drive) or secure cloud storage.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
                                    className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 cursor-pointer text-left focus:outline-hidden"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400">
                                            <History className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">Emergency Restore Points</h3>
                                                <span className="rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-black px-2.5 py-0.5 border border-slate-200/50 dark:border-white/5">
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
                                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-700 dark:text-amber-300 font-semibold leading-relaxed">
                                            ⚠️ <strong className="font-black">Advanced Users Only:</strong> Local checkpoints are automatic rollbacks saved locally on this machine (browser memory or local disk). Use them if you made a mistake today and need to revert. They are not portable files.
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                                                            <svg xmlns="http://www.w3.org/2500/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
                                {/* Version 2.3.1 */}
                                <div className="relative pl-6">
                                    <div className="absolute left-[-18.5px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0d1225] shadow-xs" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">Version 2.3.1</span>
                                        <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5">Latest Production</span>
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
        </div>
    );
}
