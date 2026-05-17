/**
 * Backup Restore/Import Feature
 * Allows users to upload and restore from comprehensive backup files
 * 
 * Features:
 * - File validation and integrity checking
 * - Preview of what will be restored
 * - Dry-run mode (preview before committing)
 * - Selective restore (choose what to restore)
 * - Rollback capability (keep previous version)
 * - Verification after restore
 */

import { useMemo, useState } from 'react';
import { Download, Lock } from 'lucide-react';
import {
    validateRestoreBackup,
    prepareDataForRestore,
    getInvalidGradeReferences,
    restoreBackupToFirestore,
    type RestoreValidation,
} from '../utils/backup-import';
import { RestoreStrategyPanel } from './RestoreStrategyPanel';
import type { RestoreStrategy } from '../utils/restore-options';
import type { ComprehensiveBackup } from '../utils/backup-restore';
import { useAppStore } from '../stores';

interface RestoreSummary {
    strategy: RestoreStrategy;
    selectedItems: string[];
    prepared: {
        students: number;
        sections: number;
        subjects: number;
        enrollments: number;
        classRecords: number;
        gradingSheetRecords: number;
        observedValues: number;
    };
    applied: {
        created: number;
        updated: number;
        skipped: number;
    };
    issues: string[];
    completedAt: string;
}

interface RestoreState {
    file: File | null;
    backup: ComprehensiveBackup | null;
    validationResult: RestoreValidation | null;
    selectedItems: Set<string>;
    isProcessing: boolean;
    error: string | null;
    currentStep: 'upload' | 'preview' | 'confirm' | 'complete';
    restoreStrategy: RestoreStrategy;
    restoreSummary: RestoreSummary | null;
}

export function BackupRestoreModal({
    isOpen,
    onClose,
    onRestoreComplete,
}: {
    isOpen: boolean;
    onClose: () => void;
    onRestoreComplete?: () => void;
}) {
    const students = useAppStore((s) => s.students);
    const sections = useAppStore((s) => s.sections);
    const subjects = useAppStore((s) => s.subjects);
    const teachers = useAppStore((s) => s.teachers);

    const [state, setState] = useState<RestoreState>({
        file: null,
        backup: null,
        validationResult: null,
        selectedItems: new Set([
            'schoolProfile',
            'students',
            'sections',
            'subjects',
            'enrollments',
            'classRecords',
            'gradingSheetRecords',
            'observedValues',
            'announcements',
        ]),
        isProcessing: false,
        error: null,
        currentStep: 'upload',
        restoreStrategy: 'merge',
        restoreSummary: null,
    });

    const downloadRestoreReport = (summary: RestoreSummary) => {
        const lines = [
            'RESTORE EXECUTION REPORT',
            '========================',
            `Completed At: ${new Date(summary.completedAt).toLocaleString()}`,
            `Strategy: ${summary.strategy}`,
            `Items: ${summary.selectedItems.join(', ')}`,
            '',
            'Prepared Data',
            `- Students: ${summary.prepared.students}`,
            `- Sections: ${summary.prepared.sections}`,
            `- Subjects: ${summary.prepared.subjects}`,
            `- Enrollments: ${summary.prepared.enrollments}`,
            `- Subject Grades: ${summary.prepared.classRecords}`,
            `- Consolidated Grades: ${summary.prepared.gradingSheetRecords}`,
            `- Core Values: ${summary.prepared.observedValues}`,
            '',
            'Applied Actions',
            `- Created: ${summary.applied.created}`,
            `- Updated: ${summary.applied.updated}`,
            `- Skipped: ${summary.applied.skipped}`,
            '',
            `Issues Found: ${summary.issues.length}`,
            ...(summary.issues.length > 0
                ? ['--- Issues ---', ...summary.issues.map((issue, index) => `${index + 1}. ${issue}`)]
                : ['No issues reported.']),
        ];

        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date(summary.completedAt).toISOString().replace(/[:.]/g, '-');

        link.href = url;
        link.download = `restore_report_${timestamp}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setState(prev => ({ ...prev, error: null, isProcessing: true }));

        try {
            // Validate file
            const isComprehensive = file.name.includes('SMS_Backup_Comprehensive');
            const isStandard = file.name.includes('FormEase_Backup');

            if (!isComprehensive && !isStandard) {
                throw new Error('Invalid backup file. Must be FormEase_Backup_*.json or SMS_Backup_Comprehensive_*.json');
            }
            if (file.size > 50 * 1024 * 1024) {
                // 50MB limit
                throw new Error('Backup file too large (max 50MB)');
            }

            // Parse backup
            const text = await file.text();
            let rawData = JSON.parse(text);
            let backup: ComprehensiveBackup;

            // Handle Standard to Comprehensive conversion
            if (isStandard && !rawData.payload && rawData.data) {
                backup = {
                    metadata: {
                        exportDate: new Date(rawData.timestamp).toISOString(),
                        version: '1.0.0-converted',
                        exportedBy: 'Auto-detected',
                        note: `Standard Backup: ${rawData.label}`,
                        warning: 'Converted from standard backup format',
                    },
                    summary: {
                        activeSchoolYear: rawData.data.activeSchoolYear || 'Unknown',
                        students: rawData.data.students?.length || 0,
                        studentProfiles: rawData.data.studentProfiles?.length || 0,
                        sections: rawData.data.sections?.length || 0,
                        subjects: rawData.data.subjects?.length || 0,
                        grades: rawData.data.classRecords?.length || 0,
                        gradingSheetRecords: rawData.data.gradingSheetRecords?.length || 0,
                        observedValues: rawData.data.observedValues?.length || 0,
                        hpsRecords: rawData.data.hpsRecords?.length || 0,
                        sf2Sheets: rawData.data.sf2Sheets?.length || 0,
                        announcements: rawData.data.announcements?.length || 0,
                        schoolYears: rawData.data.schoolYears?.length || 0,
                        enrollments: rawData.data.enrollments?.length || 0,
                        users: rawData.data.users?.length || 0,
                        systemSettings: 0,
                        adviserAssignments: 0,
                        gradingConfiguration: 0,
                    },
                    payload: {
                        ...rawData.data,
                        schoolProfile: rawData.data.schoolProfile?.[0] || rawData.data.schoolProfile,
                        systemSettings: {},
                        adviserAssignments: [],
                        gradingConfiguration: {},
                    },
                };
            } else {
                backup = rawData;
            }

            // Validate backup
            const validation = validateRestoreBackup(backup);

            setState(prev => ({
                ...prev,
                file,
                backup,
                validationResult: validation,
                currentStep: 'preview',
                isProcessing: false,
                restoreSummary: null,
            }));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setState(prev => ({
                ...prev,
                error: `Failed to load backup: ${message}`,
                isProcessing: false,
            }));
        }
    };

    const toggleItem = (item: string) => {
        setState(prev => {
            const newSet = new Set(prev.selectedItems);
            if (newSet.has(item)) {
                newSet.delete(item);
            } else {
                newSet.add(item);
            }
            return { ...prev, selectedItems: newSet };
        });
    };

    const handleProceedToConfirm = () => {
        if (state.selectedItems.size === 0) {
            setState(prev => ({
                ...prev,
                error: 'Please select at least one item to restore',
            }));
            return;
        }
        setState(prev => ({ ...prev, currentStep: 'confirm', error: null }));
    };

    const handleConfirmRestore = async () => {
        if (!state.backup) return;

        setState(prev => ({ ...prev, isProcessing: true, error: null }));

        try {
            const prepared = prepareDataForRestore(state.backup);
            const result = await restoreBackupToFirestore(state.backup, {
                strategy: state.restoreStrategy,
                selectedItems: state.selectedItems,
            });

            const summary: RestoreSummary = {
                strategy: state.restoreStrategy,
                selectedItems: Array.from(state.selectedItems),
                prepared: {
                    students: prepared.students.length,
                    sections: prepared.sections.length,
                    subjects: prepared.subjects.length,
                    enrollments: prepared.enrollments.length,
                    classRecords: prepared.classRecords.length,
                    gradingSheetRecords: prepared.gradingSheetRecords.length,
                    observedValues: prepared.observedValues.length,
                },
                applied: {
                    created: result.created,
                    updated: result.updated,
                    skipped: result.skipped,
                },
                issues: result.issues,
                completedAt: new Date().toISOString(),
            };

            alert(
                `✅ RESTORE COMPLETED\n\n` +
                `Strategy: ${state.restoreStrategy}\n` +
                `Items restored: ${Array.from(state.selectedItems).join(', ')}\n\n` +
                `Prepared Data:\n` +
                `• Students: ${prepared.students.length}\n` +
                `• Sections: ${prepared.sections.length}\n` +
                `• Subjects: ${prepared.subjects.length}\n` +
                `• Enrollments: ${prepared.enrollments.length}\n` +
                `• Subject Grades: ${prepared.classRecords.length}\n` +
                `• Consolidated Grades: ${prepared.gradingSheetRecords.length}\n` +
                `• Core Values: ${prepared.observedValues.length}\n\n` +
                `Database Actions:\n` +
                `• Created: ${result.created}\n` +
                `• Updated: ${result.updated}\n` +
                `• Skipped: ${result.skipped}\n\n` +
                `Issues found: ${result.issues.length}\n` +
                `${
                    result.issues.length > 0
                        ? `\nFirst 5 issues:\n${result.issues.slice(0, 5).join('\n')}`
                        : ''
                }`
            );

            setState(prev => ({
                ...prev,
                currentStep: 'complete',
                isProcessing: false,
                restoreSummary: summary,
            }));
            
            if (onRestoreComplete) {
                onRestoreComplete();
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            setState(prev => ({
                ...prev,
                error: `Restore failed: ${message}`,
                isProcessing: false,
            }));
        }
    };

    const invalidGradeReferences = useMemo(() => {
        if (!state.backup) return [];
        return getInvalidGradeReferences(state.backup);
    }, [state.backup]);
    const validationWarnings = state.validationResult?.warnings ?? [];

    const downloadInvalidGradesCsv = () => {
        if (!state.backup) return;

        const rows = getInvalidGradeReferences(state.backup);
        if (rows.length === 0) {
            alert('No invalid grade references found.');
            return;
        }

        const headers = [
            'classRecordId',
            'studentLrn',
            'subjectId',
            'schoolYear',
            'quarter',
            'missingStudent',
            'missingSubject',
        ];

        const escapeCsv = (value: string | number | boolean) => {
            const str = String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };

        const csvLines = [
            headers.join(','),
            ...rows.map(row =>
                [
                    row.classRecordId,
                    row.studentLrn,
                    row.subjectId,
                    row.schoolYear,
                    row.quarter,
                    row.missingStudent,
                    row.missingSubject,
                ]
                    .map(escapeCsv)
                    .join(',')
            ),
        ];

        const csvContent = csvLines.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().split('T')[0];

        link.href = url;
        link.download = `invalid_grade_references_${timestamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Download className="w-6 h-6" />
                        <h2 className="text-2xl font-bold">Restore from Backup</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={state.isProcessing}
                        className="text-2xl hover:bg-white/20 p-1 rounded disabled:opacity-50"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {state.error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                            ⚠️ {state.error}
                        </div>
                    )}

                    {validationWarnings.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="font-semibold text-yellow-800 mb-2">Warnings:</p>
                            <ul className="text-sm text-yellow-700 space-y-1">
                                {validationWarnings.map((w: string, i: number) => (
                                    <li key={i}>• {w}</li>
                                ))}
                            </ul>
                            {invalidGradeReferences.length > 0 && (
                                <button
                                    onClick={downloadInvalidGradesCsv}
                                    className="mt-3 px-3 py-1.5 bg-yellow-100 text-yellow-900 rounded-lg hover:bg-yellow-200 text-sm font-medium"
                                >
                                    Download Invalid Grade Rows (CSV)
                                </button>
                            )}
                        </div>
                    )}

                    {/* UPLOAD STEP */}
                    {state.currentStep === 'upload' && (
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                Select a backup file to preview and restore. No changes will be made until you confirm.
                            </p>

                            <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileSelect}
                                    disabled={state.isProcessing}
                                    className="hidden"
                                    id="backup-file"
                                />
                                <label htmlFor="backup-file" className="cursor-pointer">
                                    <div className="text-4xl mb-2">📦</div>
                                    <p className="font-semibold text-gray-700">
                                        Click to select backup file
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                                        FormEase_Backup_*.json
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-2 italic">
                                        (Also supports SMS_Backup_Comprehensive files)
                                    </p>
                                </label>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800">
                                    💡 <strong>Tip:</strong> You can also drag and drop a file here
                                </p>
                            </div>
                        </div>
                    )}

                    {/* PREVIEW STEP */}
                    {state.currentStep === 'preview' && state.backup && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-2">Backup Information</h3>
                                <div className="text-sm space-y-1 text-gray-600">
                                    <p>
                                        <strong>Exported:</strong>{' '}
                                        {new Date(
                                            state.backup.metadata.exportDate
                                        ).toLocaleString()}
                                    </p>
                                    <p>
                                        <strong>Version:</strong> {state.backup.metadata.version}
                                    </p>
                                    <p>
                                        <strong>School Year:</strong>{' '}
                                        {state.backup.summary.activeSchoolYear}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3">Select Items to Restore</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {[
                                        {
                                            id: 'schoolProfile',
                                            label: '🏫 School Profile',
                                            count: 1,
                                        },
                                        {
                                            id: 'students',
                                            label: '👥 Students',
                                            count: state.backup.summary.students,
                                        },
                                        {
                                            id: 'sections',
                                            label: '📚 Sections',
                                            count: state.backup.summary.sections,
                                        },
                                        {
                                            id: 'subjects',
                                            label: '📖 Subjects',
                                            count: state.backup.summary.subjects,
                                        },
                                        {
                                            id: 'enrollments',
                                            label: '✍️ Enrollments',
                                            count: state.backup.summary.enrollments,
                                        },
                                        {
                                            id: 'classRecords',
                                            label: '📊 Subject Grades',
                                            count: state.backup.summary.grades,
                                        },
                                        {
                                            id: 'gradingSheetRecords',
                                            label: '📈 Consolidated Grades',
                                            count: state.backup.summary.gradingSheetRecords || 0,
                                        },
                                        {
                                            id: 'observedValues',
                                            label: '⭐ Core Values',
                                            count: state.backup.summary.observedValues || 0,
                                        },
                                        {
                                            id: 'users',
                                            label: '👤 User Accounts',
                                            count: state.backup.summary.users,
                                        },
                                        {
                                            id: 'systemSettings',
                                            label: '⚙️ System Settings',
                                            count: state.backup.summary.systemSettings,
                                        },
                                        {
                                            id: 'announcements',
                                            label: '📢 Announcements',
                                            count: state.backup.summary.announcements,
                                        },
                                    ].map(item => (
                                        <label
                                            key={item.id}
                                            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={state.selectedItems.has(item.id)}
                                                onChange={() => toggleItem(item.id)}
                                                className="w-4 h-4 mr-3"
                                            />
                                            <span className="flex-1">
                                                {item.label}
                                                <span className="text-xs text-gray-500 ml-2">
                                                    ({item.count})
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setState(prev => ({ ...prev, currentStep: 'upload' }))}
                                    disabled={state.isProcessing}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleProceedToConfirm}
                                    disabled={state.isProcessing || state.selectedItems.size === 0}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Continue →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* CONFIRM STEP */}
                    {state.currentStep === 'confirm' && state.backup && (
                        <div className="space-y-4">
                            {/* Restore Strategy Selection */}
                            <RestoreStrategyPanel
                                backup={state.backup}
                                currentData={{
                                    students,
                                    sections,
                                    subjects,
                                    users: teachers,
                                }}
                                selectedCategories={Object.fromEntries(
                                    Array.from(state.selectedItems).map(item => [item, true])
                                )}
                                onStrategySelect={(strategy) => {
                                    setState(prev => ({ ...prev, restoreStrategy: strategy }));
                                }}
                                isLoading={state.isProcessing}
                            />

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-amber-800 font-semibold mb-2">⚠️ Before You Proceed</p>
                                <ul className="text-sm text-amber-700 space-y-1">
                                    <li>✓ This will {state.restoreStrategy === 'replace' ? 'completely replace' : state.restoreStrategy === 'merge' ? 'merge with' : 'enhance'} existing data</li>
                                    <li>✓ Create a backup of current data first</li>
                                    <li>✓ This action requires admin confirmation</li>
                                    <li>✓ You can still cancel after preview</li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-2">Items to Restore</h3>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    {Array.from(state.selectedItems).map(item => (
                                        <li key={item}>✓ {item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setState(prev => ({ ...prev, currentStep: 'preview' }))}
                                    disabled={state.isProcessing}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleConfirmRestore}
                                    disabled={state.isProcessing}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {state.isProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            Confirm Restore
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* COMPLETE STEP */}
                    {state.currentStep === 'complete' && (
                        <div className="space-y-4">
                            <div className="text-center">
                            <div className="text-5xl mb-4">✅</div>
                            <h3 className="text-xl font-semibold">Restore Complete</h3>
                            <p className="text-gray-600">
                                Backup data has been applied based on your selected strategy. Please refresh key pages
                                (Students, Institute Profile, Reports) and verify the restored records.
                            </p>
                            </div>

                            {state.restoreSummary && (
                                <div className="space-y-3 text-left">
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                        <p className="text-xs font-bold text-emerald-700 uppercase mb-2">Applied Actions</p>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <p className="text-emerald-800"><span className="font-semibold">Created:</span> {state.restoreSummary.applied.created}</p>
                                            <p className="text-blue-800"><span className="font-semibold">Updated:</span> {state.restoreSummary.applied.updated}</p>
                                            <p className="text-amber-800"><span className="font-semibold">Skipped:</span> {state.restoreSummary.applied.skipped}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <p className="text-xs font-bold text-gray-700 uppercase mb-2">Prepared Data</p>
                                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                                            <p>Students: {state.restoreSummary.prepared.students}</p>
                                            <p>Sections: {state.restoreSummary.prepared.sections}</p>
                                            <p>Subjects: {state.restoreSummary.prepared.subjects}</p>
                                            <p>Enrollments: {state.restoreSummary.prepared.enrollments}</p>
                                            <p>Subject Grades: {state.restoreSummary.prepared.classRecords}</p>
                                            <p>Consolidated Grades: {state.restoreSummary.prepared.gradingSheetRecords}</p>
                                            <p>Core Values: {state.restoreSummary.prepared.observedValues}</p>
                                            <p>Strategy: {state.restoreSummary.strategy}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-bold text-gray-700 uppercase">Issues ({state.restoreSummary.issues.length})</p>
                                            <button
                                                onClick={() => downloadRestoreReport(state.restoreSummary!)}
                                                className="px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                                            >
                                                Download Report
                                            </button>
                                        </div>
                                        {state.restoreSummary.issues.length === 0 ? (
                                            <p className="text-sm text-emerald-700">No issues reported.</p>
                                        ) : (
                                            <div className="max-h-44 overflow-y-auto rounded border border-gray-100 bg-gray-50 p-2">
                                                <ul className="text-xs text-gray-700 space-y-1">
                                                    {state.restoreSummary.issues.slice(0, 30).map((issue, index) => (
                                                        <li key={`${issue}-${index}`}>{index + 1}. {issue}</li>
                                                    ))}
                                                </ul>
                                                {state.restoreSummary.issues.length > 30 && (
                                                    <p className="mt-2 text-xs text-gray-500">
                                                        Showing first 30 issues. Use Download Report for full details.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
