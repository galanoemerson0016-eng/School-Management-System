/**
 * Advanced Restore Options
 * Handles:
 * - Merge vs Replace strategies
 * - Preview of changes
 * - Conflict resolution
 */

import type { ComprehensiveBackup } from './backup-restore';

export type RestoreStrategy = 'replace' | 'merge' | 'skip_existing';

interface RestoreCurrentData {
    students?: Array<{ id?: string; lrn?: string }>;
    sections?: Array<{ id: string }>;
    subjects?: Array<{ id: string }>;
    users?: Array<{ uid: string }>;
}

export interface RestorePreview {
    strategy: RestoreStrategy;
    willOverwrite: {
        students: number;
        sections: number;
        subjects: number;
        users: number;
    };
    willCreate: {
        students: number;
        sections: number;
        subjects: number;
        users: number;
    };
    conflicts: {
        type: string;
        count: number;
        description: string;
    }[];
    estimatedTime: string;
}

/**
 * Generate preview of restore operation
 */
export function generateRestorePreview(
    currentData: RestoreCurrentData,
    backupData: ComprehensiveBackup,
    strategy: RestoreStrategy,
    selectedCategories: Record<string, boolean>
): RestorePreview {
    const preview: RestorePreview = {
        strategy,
        willOverwrite: { students: 0, sections: 0, subjects: 0, users: 0 },
        willCreate: { students: 0, sections: 0, subjects: 0, users: 0 },
        conflicts: [],
        estimatedTime: '2-5 seconds',
    };

    if (selectedCategories.students && backupData.payload.students) {
        const currentStudentIds = new Set(
            currentData.students?.map((s) => s.id ?? s.lrn).filter((id): id is string => Boolean(id)) || []
        );
        const backupStudentIds = backupData.payload.students;

        backupStudentIds.forEach((student) => {
            if (currentStudentIds.has(student.lrn)) {
                preview.willOverwrite.students++;
            } else {
                preview.willCreate.students++;
            }
        });
    }

    if (selectedCategories.sections && backupData.payload.sections) {
        const currentSectionIds = new Set(currentData.sections?.map((s) => s.id) || []);
        const backupSectionIds = backupData.payload.sections;

        backupSectionIds.forEach((section) => {
            if (currentSectionIds.has(section.id)) {
                preview.willOverwrite.sections++;
            } else {
                preview.willCreate.sections++;
            }
        });
    }

    if (selectedCategories.subjects && backupData.payload.subjects) {
        const currentSubjectIds = new Set(currentData.subjects?.map((s) => s.id) || []);
        const backupSubjectIds = backupData.payload.subjects;

        backupSubjectIds.forEach((subject) => {
            if (currentSubjectIds.has(subject.id)) {
                preview.willOverwrite.subjects++;
            } else {
                preview.willCreate.subjects++;
            }
        });
    }

    if (selectedCategories.users && backupData.payload.users) {
        const currentUserIds = new Set(currentData.users?.map((u) => u.uid) || []);
        const backupUserIds = backupData.payload.users;

        backupUserIds.forEach((user) => {
            if (currentUserIds.has(user.uid)) {
                preview.willOverwrite.users++;
            } else {
                preview.willCreate.users++;
            }
        });
    }

    // Add conflicts
    if (preview.willOverwrite.students > 0) {
        preview.conflicts.push({
            type: 'Students',
            count: preview.willOverwrite.students,
            description: `${preview.willOverwrite.students} existing student records will be ${strategy === 'replace' ? 'replaced' : 'merged'}`,
        });
    }

    if (preview.willOverwrite.sections > 0) {
        preview.conflicts.push({
            type: 'Sections',
            count: preview.willOverwrite.sections,
            description: `${preview.willOverwrite.sections} existing section records will be ${strategy === 'replace' ? 'replaced' : 'merged'}`,
        });
    }

    if (preview.willOverwrite.users > 0) {
        preview.conflicts.push({
            type: 'Users',
            count: preview.willOverwrite.users,
            description: `${preview.willOverwrite.users} existing user records will be ${strategy === 'replace' ? 'replaced' : 'kept'} (users are not replaced for security)`,
        });
    }

    return preview;
}

/**
 * Get restore strategy descriptions
 */
export const RESTORE_STRATEGIES = {
    replace: {
        name: 'Replace All',
        description: 'Completely replace current data with backup data. WARNING: This is destructive.',
        icon: '🔄',
        color: 'red',
        riskLevel: 'high' as const,
    },
    merge: {
        name: 'Merge (Recommended)',
        description: 'Merge backup data with current data. Existing records kept, new ones added.',
        icon: '🔗',
        color: 'blue',
        riskLevel: 'low' as const,
    },
    skip_existing: {
        name: 'Skip Existing',
        description: 'Only restore records that do not exist in the current database.',
        icon: '⏭️',
        color: 'green',
        riskLevel: 'none' as const,
    },
};

/**
 * Generate detailed restore plan summary
 */
export function generateRestorePlan(preview: RestorePreview, timestamp: string): string {
    const lines = [
        '╔════════════════════════════════════════════════════════════╗',
        '║                   RESTORE OPERATION PLAN                   ║',
        '╚════════════════════════════════════════════════════════════╝',
        '',
        '📅 Timestamp: ' + timestamp,
        `🔀 Strategy: ${RESTORE_STRATEGIES[preview.strategy as keyof typeof RESTORE_STRATEGIES].name}`,
        '',
        '📊 SUMMARY:',
        `  Will Create: ${preview.willCreate.students} students, ${preview.willCreate.sections} sections, ${preview.willCreate.subjects} subjects`,
        `  Will ${preview.strategy === 'replace' ? 'Replace' : 'Update'}: ${preview.willOverwrite.students} students, ${preview.willOverwrite.sections} sections, ${preview.willOverwrite.subjects} subjects`,
        '',
    ];

    if (preview.conflicts.length > 0) {
        lines.push('⚠️ CONFLICTS/CHANGES:');
        preview.conflicts.forEach(conflict => {
            lines.push(`  • ${conflict.type}: ${conflict.description}`);
        });
        lines.push('');
    }

    lines.push(`⏱️ Estimated Time: ${preview.estimatedTime}`);
    lines.push('');
    lines.push('✅ Ready to restore? Confirm to proceed.');

    return lines.join('\n');
}

/**
 * Validate restore data integrity
 */
export function validateRestoreIntegrity(backup: ComprehensiveBackup): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
} {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Validate backup structure
    if (!backup.payload) {
        issues.push('Missing backup data');
    }

    if (!backup.metadata) {
        issues.push('Missing backup metadata');
    }

    if (!backup.summary) {
        issues.push('Missing backup summary');
    }

    // Check for data consistency
    if (backup.payload.students && backup.payload.students.length > 0 && !backup.payload.enrollments) {
        warnings.push('Students found but no enrollments data');
    }

    if (backup.payload.classRecords && backup.payload.classRecords.length === 0) {
        warnings.push('No class records found in backup');
    }

    // Check file size
    const backupSize = JSON.stringify(backup).length;
    if (backupSize > 100 * 1024 * 1024) {
        warnings.push('Large backup file (>100MB) - restore may take longer');
    }

    return {
        isValid: issues.length === 0,
        issues,
        warnings,
    };
}

/**
 * Estimate restore time based on data size
 */
export function estimateRestoreTime(backup: ComprehensiveBackup): string {
    let totalRecords = 0;

    if (backup.payload.students) totalRecords += backup.payload.students.length;
    if (backup.payload.classRecords) totalRecords += backup.payload.classRecords.length;
    if (backup.payload.users) totalRecords += backup.payload.users.length;

    // Rough estimation: ~100 records per second
    const estimatedSeconds = Math.max(2, Math.ceil(totalRecords / 100));

    if (estimatedSeconds < 5) return '2-3 seconds';
    if (estimatedSeconds < 10) return '5-8 seconds';
    if (estimatedSeconds < 30) return '10-20 seconds';
    if (estimatedSeconds < 60) return '20-60 seconds';

    return `${Math.ceil(estimatedSeconds / 60)} minute(s)`;
}
