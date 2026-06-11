import { useState } from 'react';
import { useAuthStore, useAppStore, initializeAppStore } from '../stores';
import { db } from '../services/database';
import { Database, User, Shield, Upload } from 'lucide-react';
import { canPurgeMaintenance } from '../lib/rbac';
import { createComprehensiveBackup, generateBackupReport, validateBackup, type ComprehensiveBackup } from '../utils/backup-restore';
import { BackupRestoreModal } from '../components/BackupRestoreModal';
import { ExportOptionsModal, type ExportOptions } from '../components/ExportOptionsModal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { TextInputConfirmationModal } from '../components/ui/TextInputConfirmationModal';
import { encryptBackup, createEncryptedBackupFile } from '../utils/backup-encryption';
import { compareBackupSizes } from '../utils/backup-compression';
import { createBackupMetadata, saveBackupMetadata } from '../utils/backup-metadata';

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
    
    // Get current credentials for pre-filling
    const rawCreds = localStorage.getItem('formease-credentials');
    const savedCreds = rawCreds ? JSON.parse(rawCreds) : { username: 'admin', email: 'admin@school.local', securityQuestion: '', securityAnswer: '' };

    const [newUsername, setNewUsername] = useState(savedCreds.username || '');
    const [newEmail, setNewEmail] = useState(savedCreds.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newSecurityQuestion, setNewSecurityQuestion] = useState(savedCreds.securityQuestion || '');
    const [newSecurityAnswer, setNewSecurityAnswer] = useState(savedCreds.securityAnswer || '');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const { updateCredentials } = useAuthStore();

    const handleChangePassword = async () => {
        setPasswordError('');
        setPasswordSuccess('');
        
        if (!currentPassword) {
            setPasswordError('Please enter your current password to save changes');
            return;
        }

        if (newPassword && newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters');
            return;
        }
        if (newPassword && newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        setIsChangingPassword(true);
        try {
            // Use a robust way to get current credentials (including defaults)
            const raw = localStorage.getItem('formease-credentials');
            const defaults = { username: 'admin', password: 'formease' };
            const parsed = raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
            
            if (parsed.password !== currentPassword) {
                throw new Error('Current password is incorrect');
            }

            updateCredentials({
                username: newUsername || parsed.username,
                password: newPassword || parsed.password,
                email: newEmail || parsed.email,
                securityQuestion: newSecurityQuestion || parsed.securityQuestion,
                securityAnswer: newSecurityAnswer || parsed.securityAnswer
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
            const validation = validateBackup(backup);
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
            }

            // Download backup file
            const backupBlob = new Blob([exportData], { type: 'application/json' });
            const backupUrl = URL.createObjectURL(backupBlob);
            const backupLink = document.createElement('a');
            backupLink.href = backupUrl;
            backupLink.download = `${filename}.json`;
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
                `• Core Values: ${currentBackup.summary.observedValues}\n` +
                `• Attendance Records: ${currentBackup.summary.attendanceRecords}\n` +
                `• SF2 Attendance Sheets: ${currentBackup.summary.sf2Sheets}\n` +
                `• Highest Possible Score (HPS) Records: ${currentBackup.summary.hpsRecords}\n` +
                `• Announcements: ${currentBackup.summary.announcements}\n` +
                `• School Years: ${currentBackup.summary.schoolYears}\n` +
                `• Users: ${currentBackup.summary.users}\n` +
                `• Local Storage Keys (Signatories, Anecdotal, Calendar): ${Object.keys(currentBackup.payload.localStorageData || {}).length}\n\n` +
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
        <div className="max-w-5xl space-y-6">
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 text-deped-blue" />
                            <h3 className="text-lg font-bold text-slate-900">Account & Security</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Display Name</p>
                                <p className="text-base font-bold text-slate-800">{user?.displayName || 'N/A'}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</p>
                                <p className="text-base font-bold text-slate-800">{user?.email || 'N/A'}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Role</p>
                                <p className="flex items-center gap-2 text-base font-bold capitalize text-slate-800">
                                    <Shield className="h-4 w-4 text-deped-blue" />
                                    {user?.role || 'N/A'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">User ID</p>
                                <p className="break-all font-mono text-xs text-slate-600">{user?.uid || 'N/A'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-deped-blue px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                        >
                            <User className="h-4 w-4" />
                            Account Settings
                        </button>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-600" />
                            <h3 className="text-lg font-bold text-slate-900">Backup & Restore</h3>
                        </div>
                        <p className="mb-4 text-sm text-slate-500">Create secure backups and restore school data when needed.</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setIsRestoreModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                            >
                                <Upload className="h-4 w-4" />
                                Restore
                            </button>
                            <button
                                onClick={handleExportData}
                                disabled={isExporting}
                                className="rounded-xl bg-deped-blue px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isExporting ? 'Exporting...' : 'Export Backup'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 lg:col-span-1">
                    <div className="rounded-2xl border border-red-200 bg-white p-5">
                        <h3 className="text-lg font-bold text-slate-900">Database Maintenance</h3>
                        <p className="mt-1 text-sm text-slate-500">Clean records and run reset tools with progress tracking.</p>

                        {canPurge ? (
                            <div className="mt-4 space-y-2">
                                <button
                                    onClick={handlePreviewRecordCleanup}
                                    disabled={isPreviewingCleanup}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                                >
                                    {isPreviewingCleanup ? 'Scanning...' : 'Preview Record Cleanup'}
                                </button>
                                <button
                                    onClick={handleNormalizeRecords}
                                    disabled={isNormalizingRecords}
                                    className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-left text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                >
                                    {isNormalizingRecords ? 'Applying...' : 'Normalize Names & Text'}
                                </button>
                                <button
                                    onClick={handleCleanGhostStudents}
                                    disabled={isCleaning}
                                    className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                >
                                    {isCleaning ? 'Cleaning...' : 'Purge Ghost Students'}
                                </button>
                                <button
                                    onClick={handleCleanGhostSections}
                                    disabled={isPurgingSections}
                                    className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                                >
                                    {isPurgingSections ? 'Purging...' : 'Purge Ghost Sections'}
                                </button>

                                <button
                                    onClick={() => setShowDangerZone((prev) => !prev)}
                                    className="mt-2 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50"
                                >
                                    {showDangerZone ? 'Hide Danger Zone' : 'Show Danger Zone'}
                                </button>

                                {showDangerZone && (
                                    <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
                                        <button
                                            onClick={handleDeleteOrphanGradeRecords}
                                            disabled={isDeletingOrphanGrades}
                                            className="w-full rounded-lg bg-red-100 px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                                        >
                                            {isDeletingOrphanGrades ? 'Deleting...' : 'Delete Orphan Grades'}
                                        </button>
                                        <button
                                            onClick={handleClearAllCurrentStudents}
                                            disabled={isClearingAllStudents}
                                            className="w-full rounded-lg bg-rose-600 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                                        >
                                            {isClearingAllStudents ? 'Clearing...' : 'Fresh Start: Clear Current Students'}
                                        </button>
                                        <button
                                            onClick={handleClearStudentsAndOrphanGrades}
                                            disabled={isClearingStudentsAndGrades}
                                            className="w-full rounded-lg bg-red-600 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                        >
                                            {isClearingStudentsAndGrades ? 'Clearing...' : 'Fresh Start: Clear Students + Grades'}
                                        </button>
                                        <button
                                            onClick={handleFullHardReset}
                                            disabled={isRunningHardReset}
                                            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                                        >
                                            {isRunningHardReset ? 'Resetting...' : 'Full Hard Reset (Delete Profiles)'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Maintenance tools are restricted to administrators.</p>
                        )}

                        {cleanupPreview && (
                            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                <p className="font-semibold text-slate-900">Record Cleanup Preview</p>
                                <p>Student text fixes: {cleanupPreview.studentUpdates}</p>
                                <p>Subject text fixes: {cleanupPreview.subjectUpdates}</p>
                                <p>Section text fixes: {cleanupPreview.sectionUpdates}</p>
                                <p>Orphan grade records: {cleanupPreview.orphanGrades}</p>
                                {cleanupPreview.orphanGradeSample.length > 0 && (
                                    <p className="mt-1 text-xs text-slate-500">Sample IDs: {cleanupPreview.orphanGradeSample.join(', ')}</p>
                                )}
                            </div>
                        )}

                        {maintenanceProgress.total > 0 && (
                            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
                                <p className="font-semibold text-blue-900">{maintenanceProgress.title}</p>
                                <p className="mt-1 text-sm text-blue-800">{maintenanceProgress.currentStep}</p>
                                <p className="mt-1 text-xs text-blue-700">
                                    {maintenanceProgress.completed} / {maintenanceProgress.total} records
                                    ({Math.round((maintenanceProgress.completed / Math.max(1, maintenanceProgress.total)) * 100)}%)
                                </p>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-300"
                                        style={{
                                            width: `${Math.round((maintenanceProgress.completed / Math.max(1, maintenanceProgress.total)) * 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
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
                                        placeholder="The answer for recovery"
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
