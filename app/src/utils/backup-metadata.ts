import type { ComprehensiveBackup } from './backup-restore';

const KEY = 'formease_backup_metadata';

export interface BackupMetadataRecord {
    id?: string;
    createdAt: string;
    exportedAt: string;
    exportedBy: string;
    backupVersion: string;
    fileSize: number;
    isEncrypted: boolean;
    isCompressed: boolean;
    summary: {
        students: number;
        sections: number;
        subjects: number;
        grades: number;
        users: number;
        activeSchoolYear: string;
    };
    status: 'success' | 'failed' | 'partial';
    notes?: string;
    checksum?: string;
}

const loadAll = (): BackupMetadataRecord[] => {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as BackupMetadataRecord[]) : [];
    } catch {
        return [];
    }
};

const saveAll = (records: BackupMetadataRecord[]) => {
    localStorage.setItem(KEY, JSON.stringify(records));
};

export async function saveBackupMetadata(metadata: Omit<BackupMetadataRecord, 'id' | 'createdAt'>): Promise<string> {
    const id = `meta-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const next: BackupMetadataRecord = { id, createdAt: new Date().toISOString(), ...metadata };
    const all = loadAll();
    all.unshift(next);
    saveAll(all);
    return id;
}

export async function fetchAllBackupMetadata(): Promise<BackupMetadataRecord[]> {
    return loadAll().sort((a, b) => b.exportedAt.localeCompare(a.exportedAt));
}

export async function fetchBackupsByDateRange(startDate: string, endDate: string): Promise<BackupMetadataRecord[]> {
    const all = await fetchAllBackupMetadata();
    return all.filter((b) => b.exportedAt >= startDate && b.exportedAt <= endDate);
}

export async function getLatestBackup(): Promise<BackupMetadataRecord | null> {
    const all = await fetchAllBackupMetadata();
    return all[0] || null;
}

export async function deleteOldBackupMetadata(keepCount: number = 30): Promise<number> {
    const all = await fetchAllBackupMetadata();
    if (all.length <= keepCount) return 0;
    const kept = all.slice(0, keepCount);
    const removed = all.length - kept.length;
    saveAll(kept);
    return removed;
}

export async function deleteBackupMetadata(id: string): Promise<void> {
    const all = await fetchAllBackupMetadata();
    saveAll(all.filter((item) => item.id !== id));
}

export async function getBackupStatistics() {
    const backups = await fetchAllBackupMetadata();
    const totalSize = backups.reduce((sum, item) => sum + (item.fileSize || 0), 0);
    const averageSize = backups.length > 0 ? totalSize / backups.length : 0;
    const sortedBySize = [...backups].sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
    const sortedByDateAsc = [...backups].sort((a, b) => a.exportedAt.localeCompare(b.exportedAt));

    return {
        totalBackups: backups.length,
        totalSize,
        averageSize,
        lastBackup: backups[0] || null,
        largest: sortedBySize[0] || null,
        oldest: sortedByDateAsc[0] || null,
        encryptedCount: backups.filter((item) => item.isEncrypted).length,
        compressedCount: backups.filter((item) => item.isCompressed).length,
    };
}

const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

export async function generateBackupHistoryReport(): Promise<string> {
    const stats = await getBackupStatistics();
    const lines = [
        'BACKUP HISTORY REPORT',
        '=====================',
        `Total Backups: ${stats.totalBackups}`,
        `Total Size: ${formatBytes(stats.totalSize)}`,
        `Average Size: ${formatBytes(stats.averageSize)}`,
        `Encrypted Backups: ${stats.encryptedCount}`,
        `Compressed Backups: ${stats.compressedCount}`,
        `Last Backup: ${stats.lastBackup?.exportedAt || 'N/A'}`,
        `Oldest Backup: ${stats.oldest?.exportedAt || 'N/A'}`,
        `Largest Backup: ${stats.largest ? `${formatBytes(stats.largest.fileSize)} (${stats.largest.exportedAt})` : 'N/A'}`,
    ];

    return lines.join('\n');
}

export function createBackupMetadata(
    backup: ComprehensiveBackup,
    fileSize: number,
    exportedBy: string,
    isEncrypted: boolean = false,
    isCompressed: boolean = false
): Omit<BackupMetadataRecord, 'id' | 'createdAt'> {
    return {
        exportedAt: backup.metadata.exportDate,
        exportedBy,
        backupVersion: backup.metadata.version,
        fileSize,
        isEncrypted,
        isCompressed,
        summary: {
            students: backup.summary.students,
            sections: backup.summary.sections,
            subjects: backup.summary.subjects,
            grades: backup.summary.grades,
            users: backup.summary.users || 0,
            activeSchoolYear: backup.summary.activeSchoolYear,
        },
        status: 'success',
        notes: `Backup of ${backup.summary.activeSchoolYear} with ${backup.summary.students} students`,
    };
}
