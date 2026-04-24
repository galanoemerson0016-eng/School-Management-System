/**
 * Firebase Cloud Functions - Auto Backup Configuration
 * 
 * This file contains the Firebase configuration and utilities for
 * setting up automated backups. Place in your functions/src/ directory.
 * 
 * Installation:
 * 1. Install dependencies: npm install firebase-functions firebase-admin
 * 2. Copy this file to functions/src/backups.ts
 * 3. Deploy: firebase deploy --only functions
 * 
 * Usage:
 * - Scheduled backups run daily at 2 AM UTC
 * - On-demand backups can be triggered from the admin panel
 * - All backups are stored in Firestore backup_metadata collection
 */

// NOTE: This is a template. Actual implementation would go in your functions folder.
// See AUTO_BACKUP_SETUP_GUIDE.md for detailed setup instructions.

export interface BackupConfig {
  enabled: boolean;
  schedule: 'daily' | 'weekly' | 'manual';
  time: string; // "HH:MM" format UTC
  dayOfWeek?: string; // for weekly
  retentionDays: number;
  maxBackups: number;
  includeUsers: boolean;
  includeSettings: boolean;
  includeAnnouncements: boolean;
  lastBackupTime?: string;
  totalBackupsCreated: number;
}

export interface BackupError {
  timestamp: string;
  error: string;
  errorType: string;
  functionName: string;
  userId?: string;
}

/**
 * STEP 1: Create Firestore backup_config document
 * 
 * Collection: backup_config
 * Document: settings
 * 
 * Content:
 * {
 *   "enabled": true,
 *   "schedule": "daily",
 *   "time": "02:00",
 *   "dayOfWeek": null,
 *   "retentionDays": 30,
 *   "maxBackups": 50,
 *   "includeUsers": true,
 *   "includeSettings": true,
 *   "includeAnnouncements": true,
 *   "lastBackupTime": null,
 *   "totalBackupsCreated": 0
 * }
 */

/**
 * STEP 2: Create indexes in Firestore
 * 
 * For the query in deleteOldBackups() to work efficiently:
 * 
 * Collection: backup_metadata
 * Fields: createdAt (Descending), exportedAt (Descending)
 */

/**
 * STEP 3: Set up Cloud Storage bucket
 * 
 * Create a bucket for backup files:
 * gsutil mb gs://your-project-backups
 * 
 * Add retention policy (optional):
 * gsutil retention set 90 gs://your-project-backups
 */

/**
 * STEP 4: Update Firestore Security Rules
 * 
 * match /backup_metadata/{document=**} {
 *   allow read: if request.auth != null && request.auth.token.admin == true;
 *   allow write: if false;
 * }
 * 
 * match /backup_config/{document=**} {
 *   allow read: if request.auth != null && request.auth.token.admin == true;
 *   allow write: if request.auth != null && request.auth.token.admin == true;
 * }
 */

/**
 * STEP 5: Deploy Cloud Function
 * 
 * Firebase automatically creates a Cloud Scheduler job when you deploy
 * a scheduled function. No manual setup needed!
 * 
 * Verify it deployed:
 * firebase functions:list
 * gcloud scheduler jobs list --location=us-central1
 */

/**
 * STEP 6: Monitor and Test
 * 
 * View logs:
 * firebase functions:log
 * 
 * Test manually:
 * gcloud functions call scheduledBackup --runtime nodejs18
 * 
 * Check Firestore:
 * - backup_metadata collection should have new entries
 * - backup_config should have updated lastBackupTime
 */

export const BACKUP_CONFIG_DEFAULTS: BackupConfig = {
  enabled: true,
  schedule: 'daily',
  time: '02:00',
  retentionDays: 30,
  maxBackups: 50,
  includeUsers: true,
  includeSettings: true,
  includeAnnouncements: true,
  totalBackupsCreated: 0,
};

export const BACKUP_SCHEDULES = {
  daily: {
    cronExpression: '0 2 * * *', // 2 AM UTC every day
    description: 'Every day at 2:00 AM UTC',
  },
  weekly: {
    cronExpression: '0 2 ? * SUN *', // 2 AM UTC every Sunday
    description: 'Every Sunday at 2:00 AM UTC',
  },
  biweekly: {
    cronExpression: '0 2 ? * SUN#1,SUN#3 *', // 1st and 3rd Sunday
    description: 'Every 2 weeks on Sunday at 2:00 AM UTC',
  },
};

/**
 * Estimated costs for different backup frequencies
 * (Blaze plan with typical 5MB backup file)
 */
export const COST_ESTIMATES = {
  daily: {
    functionCalls: '$0.50/month',
    storage: '$1.50/month',
    total: '$2/month',
    backupsPerMonth: 30,
  },
  weekly: {
    functionCalls: '$0.15/month',
    storage: '$0.50/month',
    total: '$0.65/month',
    backupsPerMonth: 4,
  },
  biweekly: {
    functionCalls: '$0.08/month',
    storage: '$0.25/month',
    total: '$0.33/month',
    backupsPerMonth: 2,
  },
};

/**
 * Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)
 */
export const RTO_RPO = {
  daily: {
    rto: '< 5 minutes', // Time to restore
    rpo: '24 hours', // Data loss if failure
    fileSize: '5-20 MB',
    restoreTime: '2-5 seconds',
  },
  weekly: {
    rto: '< 10 minutes',
    rpo: '7 days',
    fileSize: '10-50 MB',
    restoreTime: '5-10 seconds',
  },
};

/**
 * Disaster Recovery Checklist
 */
export const DISASTER_RECOVERY_CHECKLIST = [
  '✅ Verify Firebase project access',
  '✅ Check backup_metadata collection has recent entries',
  '✅ Download latest backup from Cloud Storage',
  '✅ Decrypt backup (if encrypted)',
  '✅ Validate backup file integrity',
  '✅ Upload to restore dialog',
  '✅ Select "Merge" strategy (safest)',
  '✅ Review preview of changes',
  '✅ Execute restore',
  '✅ Verify data in dashboard',
  '✅ Send confirmation to stakeholders',
  '✅ Document incident in backup_errors collection',
];

/**
 * Environment variables to set in Firebase config
 */
export const REQUIRED_ENV_VARS = {
  BACKUP_BUCKET: 'your-project-backups',
  BACKUP_ENABLED: 'true',
  BACKUP_RETENTION_DAYS: '30',
  BACKUP_MAX_FILES: '50',
  ADMIN_EMAIL: 'admin@school.edu', // For notifications
};

/**
 * Quick reference: Common issues and solutions
 */
export const TROUBLESHOOTING = {
  'Backup not triggering': [
    '1. Check Cloud Scheduler is enabled',
    '2. Verify service account has permissions',
    '3. Check Cloud Functions logs',
    '4. Ensure backup_config.enabled === true',
  ],
  'Storage quota exceeded': [
    '1. Reduce retentionDays setting',
    '2. Reduce maxBackups count',
    '3. Enable compression for backups',
    '4. Archive old backups to Cloud Storage Coldline',
  ],
  'Restore failing': [
    '1. Verify backup file integrity',
    '2. Check Firestore security rules',
    '3. Ensure user is admin',
    '4. Try "Merge" instead of "Replace"',
  ],
};

// Export for use in other modules
export default {
  BACKUP_CONFIG_DEFAULTS,
  BACKUP_SCHEDULES,
  COST_ESTIMATES,
  RTO_RPO,
  DISASTER_RECOVERY_CHECKLIST,
  REQUIRED_ENV_VARS,
  TROUBLESHOOTING,
};
