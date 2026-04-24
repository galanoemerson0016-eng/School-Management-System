# 🤖 Auto-Backup Scheduling Guide

## Overview

This guide provides instructions for setting up automated backups for your School Management System using Firebase Cloud Functions.

## Architecture

```
Firestore → Cloud Functions → Scheduled Task → Create Backup → Store Metadata
     ↓                                ↓
Backup Config                    Execute Daily/Weekly
   Settings                          at specified time
```

## Prerequisites

- Firebase Blaze plan (required for Cloud Functions)
- gcloud CLI installed and configured
- Firebase Admin SDK credentials

## Setup Steps

### 1. Enable Cloud Functions API

```bash
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable storage.googleapis.com
```

### 2. Create Firestore Collection for Backup Config

Create a `backup_config` collection in Firestore with a document `settings`:

```json
{
  "enabled": true,
  "schedule": "daily",      // "daily" | "weekly" | "manual"
  "time": "02:00",          // 24-hour format (UTC)
  "dayOfWeek": "Sunday",    // for weekly backups
  "retentionDays": 30,      // auto-delete backups older than this
  "maxBackups": 50,         // keep only N recent backups
  "includeUsers": true,
  "includeSettings": true,
  "includeAnnouncements": true,
  "lastBackupTime": "2024-01-15T02:15:00Z",
  "totalBackupsCreated": 245
}
```

### 3. Cloud Functions Implementation

Create `functions/src/backups.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { bucket } from './config';

const db = admin.firestore();
const storage = admin.storage().bucket();

// Scheduled function: Daily backup at 2 AM UTC
export const scheduledBackup = functions.pubsub
  .schedule('0 2 * * *')  // Daily at 2 AM
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('Starting scheduled backup...');

      // Get backup config
      const configDoc = await db.collection('backup_config').doc('settings').get();
      const config = configDoc.data();

      if (!config?.enabled) {
        console.log('Backups disabled');
        return;
      }

      // Create backup
      const backup = await createComprehensiveBackup(config);

      // Upload to Cloud Storage
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `backups/auto_backup_${timestamp}.json`;
      
      await storage.file(filename).save(JSON.stringify(backup), {
        metadata: {
          contentType: 'application/json',
          metadata: {
            backup_date: timestamp,
            backup_type: 'scheduled',
            version: backup.metadata.version,
          },
        },
      });

      // Save metadata to Firestore
      await db.collection('backup_metadata').add({
        exportedAt: backup.metadata.exportDate,
        exportedBy: 'system_scheduler',
        backupVersion: backup.metadata.version,
        fileSize: JSON.stringify(backup).length,
        isEncrypted: false,  // Can be encrypted
        isCompressed: false,
        summary: backup.summary,
        status: 'success',
        notes: 'Automatically scheduled backup',
        cloudStoragePath: filename,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update config with last backup time
      await configDoc.ref.update({
        lastBackupTime: admin.firestore.FieldValue.serverTimestamp(),
        totalBackupsCreated: admin.firestore.FieldValue.increment(1),
      });

      // Cleanup old backups
      await deleteOldBackups(config.retentionDays, config.maxBackups);

      console.log('Backup completed successfully');
      return { success: true, message: 'Backup created' };
    } catch (error) {
      console.error('Backup failed:', error);
      
      // Log error to Firestore
      await db.collection('backup_errors').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        error: String(error),
        errorType: error instanceof Error ? error.name : 'Unknown',
      });

      throw error;
    }
  });

// On-demand backup function
export const createOnDemandBackup = functions.https.onCall(
  async (data, context) => {
    // Verify admin
    const user = await admin.auth().getUser(context.auth!.uid);
    if (!user.customClaims?.admin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin privileges required'
      );
    }

    try {
      const backup = await createComprehensiveBackup({
        includeUsers: true,
        includeSettings: true,
        includeAnnouncements: true,
      });

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `backups/manual_backup_${timestamp}_${Date.now()}.json`;

      await storage.file(filename).save(JSON.stringify(backup), {
        metadata: {
          contentType: 'application/json',
          metadata: {
            backup_type: 'manual',
            user: context.auth!.uid,
          },
        },
      });

      // Save metadata
      await db.collection('backup_metadata').add({
        exportedAt: backup.metadata.exportDate,
        exportedBy: context.auth!.uid,
        backupVersion: backup.metadata.version,
        fileSize: JSON.stringify(backup).length,
        isEncrypted: false,
        isCompressed: false,
        summary: backup.summary,
        status: 'success',
        notes: 'On-demand backup triggered by user',
        cloudStoragePath: filename,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        backupId: filename,
        size: JSON.stringify(backup).length,
      };
    } catch (error) {
      throw new functions.https.HttpsError('internal', String(error));
    }
  }
);

// Helper: Delete old backups
async function deleteOldBackups(
  retentionDays: number,
  maxBackups: number
): Promise<void> {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  // Get all backups
  const snapshot = await db
    .collection('backup_metadata')
    .orderBy('createdAt', 'desc')
    .get();

  let deleted = 0;

  for (let i = 0; i < snapshot.docs.length; i++) {
    const doc = snapshot.docs[i];
    const data = doc.data();

    // Delete if older than retention or beyond max backups
    if (new Date(data.exportedAt) < cutoffDate || i >= maxBackups) {
      // Delete from Cloud Storage
      if (data.cloudStoragePath) {
        try {
          await storage.file(data.cloudStoragePath).delete();
        } catch (e) {
          console.warn(`Could not delete file: ${data.cloudStoragePath}`, e);
        }
      }

      // Delete metadata
      await doc.ref.delete();
      deleted++;
    }
  }

  console.log(`Deleted ${deleted} old backups`);
}

// Helper: Create comprehensive backup
async function createComprehensiveBackup(config: any) {
  // Fetch all data from Firestore
  const [schools, students, sections, subjects, classRecords, users] =
    await Promise.all([
      fetchCollection('schools'),
      fetchCollection('students'),
      fetchCollection('sections'),
      fetchCollection('subjects'),
      fetchCollection('classRecords'),
      config.includeUsers ? fetchCollection('users') : Promise.resolve([]),
    ]);

  return {
    metadata: {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      exportedBy: 'system_scheduler',
    },
    summary: {
      students: students.length,
      sections: sections.length,
      subjects: subjects.length,
      grades: classRecords.length,
      users: users.length,
      activeSchoolYear: 'SY 2024-2025',
    },
    data: {
      schools,
      students,
      sections,
      subjects,
      classRecords,
      users: config.includeUsers ? users : [],
    },
  };
}

async function fetchCollection(collectionName: string) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}
```

### 4. Deploy Cloud Functions

```bash
cd functions
firebase deploy --only functions:scheduledBackup,functions:createOnDemandBackup
```

### 5. Test the Function

```bash
# Test scheduled backup
gcloud functions call scheduledBackup --runtime nodejs18

# Test on-demand backup (from client)
import { functions } from 'firebase/functions';
const createOnDemandBackup = functions.httpsCallable('createOnDemandBackup');

const result = await createOnDemandBackup({});
console.log('Backup created:', result.data);
```

## Firestore Rules for Backup Data

Add these rules to `firestore.rules`:

```
match /databases/{database}/documents {
  match /backup_metadata/{document=**} {
    allow read: if request.auth != null && request.auth.token.admin == true;
    allow write: if false;  // Only Cloud Functions can write
  }
  
  match /backup_config/{document=**} {
    allow read: if request.auth != null && request.auth.token.admin == true;
    allow write: if request.auth != null && request.auth.token.admin == true;
  }
  
  match /backup_errors/{document=**} {
    allow read: if request.auth != null && request.auth.token.admin == true;
    allow write: if false;  // Only Cloud Functions can write
  }
}
```

## Cloud Storage Rules

Add these rules to `storage.rules`:

```
match /b/{bucket}/o {
  match /backups/{allPaths=**} {
    allow read: if request.auth != null && request.auth.token.admin == true;
    allow write: if false;  // Only Cloud Functions can write
    allow delete: if false; // Only Cloud Functions can delete
  }
}
```

## Monitoring & Alerts

### View Logs

```bash
gcloud functions logs read scheduledBackup --limit 50
```

### Set up Email Alerts

1. Go to Cloud Functions console
2. Select the function
3. Click "Execution"
4. Configure error reporting in Cloud Logging

### Monitor Costs

```bash
gcloud billing accounts list
gcloud compute billing-accounts describe <BILLING_ACCOUNT_ID>
```

## Estimated Costs (Blaze Plan)

- **Scheduled Backup (2 AM daily)**: ~$0.50/month (includes triggers)
- **Storage (50 backups × 5MB)**: ~$1/month
- **Compute**: Included in free tier for small backups

**Total**: ~$2-3/month

## Troubleshooting

### Backup not triggering

1. Check if Cloud Scheduler job exists:
   ```bash
   gcloud scheduler jobs list
   ```

2. Check Cloud Functions logs:
   ```bash
   gcloud functions logs read scheduledBackup
   ```

3. Verify service account has Firestore permissions:
   ```bash
   gcloud projects get-iam-policy PROJECT_ID
   ```

### Large backup files

- Implement encryption + compression
- Archive old backups to Cloud Storage cold storage
- Split large schools into separate collections

### Storage quota

Monitor usage:
```bash
gsutil du gs://your-backup-bucket/
```

Clean up:
```bash
gsutil -m rm -r gs://your-backup-bucket/backups/old_*
```

## Disaster Recovery Procedure

1. **Download Latest Backup**
   ```bash
   gsutil cp gs://your-backup-bucket/backups/latest.json ./
   ```

2. **Decrypt if Encrypted**
   ```bash
   # Use your decryption utility
   ```

3. **Restore via Dashboard**
   - Go to Settings → Restore
   - Upload backup file
   - Select "Replace All"
   - Confirm

4. **Verify Data Integrity**
   - Check student count
   - Verify grades imported
   - Validate sections/subjects

## Best Practices

✅ **DO:**
- Test restore procedures monthly
- Keep at least 30 days of backups
- Monitor backup size trends
- Enable encryption for sensitive data
- Set up automated cleanup policies
- Document recovery procedures

❌ **DON'T:**
- Store backups in same Firebase project only
- Forget to test restore process
- Keep unlimited backups (expensive)
- Store passwords in backup metadata
- Disable backup notifications

## Additional Resources

- [Firebase Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Cloud Scheduler Documentation](https://cloud.google.com/scheduler/docs)
- [Firestore Backup Guide](https://firebase.google.com/docs/firestore/manage-data/export-import)

---

**Next Steps:**
1. Create backup_config document in Firestore
2. Set up Cloud Functions in `functions/` folder
3. Deploy and test
4. Configure email alerts
5. Document your recovery procedure
