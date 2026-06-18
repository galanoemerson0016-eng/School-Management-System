# FormEase Pro — Comprehensive Application Audit Report

**Version:** 2.2.7  
**Audit Date:** 2026-06-17  
**Auditor:** Claude Code (claude-sonnet-4-6)  
**Scope:** Full application — security, architecture, features, code quality, dependencies, performance  
**Output:** Combined report with concrete implementation steps for every finding

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Application Overview](#2-application-overview)
3. [Architecture](#3-architecture)
4. [Security Audit & Fixes](#4-security-audit--fixes)
5. [Feature Audit](#5-feature-audit)
6. [Code Quality & Fixes](#6-code-quality--fixes)
7. [Dependencies & Fixes](#7-dependencies--fixes)
8. [Performance & Fixes](#8-performance--fixes)
9. [Master Fix Roadmap](#9-master-fix-roadmap)

---

## 1. Executive Summary

FormEase Pro is a mature, offline-first school management desktop application targeting Philippine DepEd-compliant workflows. The core architecture is sound — well-typed TypeScript, strong at-rest encryption, and a complete feature set covering every required DepEd form. However, several high-impact security gaps in the backup and storage layer need to be addressed before sensitive student data is fully protected.

### Domain Health Scores

| Domain | Score | Notes |
|--------|-------|-------|
| Security | 6 / 10 | Strong encryption and auth; backup export and salt storage are critical gaps |
| Feature Completeness | 9 / 10 | All six DepEd forms implemented; minor gaps noted |
| Code Quality | 7 / 10 | Well-structured; renderer files are too large, app-store is monolithic |
| Test Coverage | 3 / 10 | Unit tests only for grading math; no UI or integration tests |
| Dependencies | 8 / 10 | Mostly current; two redundant packages to remove |
| Performance | 6 / 10 | Memory-intensive for large cohorts; no memoization or pagination |

### Top 5 Critical Findings

| # | Severity | Finding | Fix Section |
|---|----------|---------|-------------|
| 1 | 🔴 CRITICAL | Manual backup files export as plaintext JSON — student PII unencrypted on disk | [4.2-A](#a-backup-exports-are-plaintext-json) |
| 2 | 🔴 CRITICAL | No cryptographic integrity check on backup files — tampered backups accepted silently | [4.2-B](#b-no-integrity-check-before-backup-restore) |
| 3 | 🟠 HIGH | Encryption salt and session key in `localStorage`/`sessionStorage` — readable by renderer scripts | [4.2-C](#c-encryption-salt-and-session-key-in-browser-storage) |
| 4 | 🟠 HIGH | No file-size validation on Excel imports — oversized files freeze or crash the renderer | [4.2-D](#d-no-file-size-validation-on-excel-imports) |
| 5 | 🟠 HIGH | 30-day offline license grace period — revoked licenses work for a month | [4.2-E](#e-30-day-offline-license-grace-period) |

---

## 2. Application Overview

**Product:** FormEase Pro  
**Category:** Desktop school management system (Electron)  
**Target Users:** Philippine public school teachers and administrators  
**Compliance:** DepEd Order forms — SF2, SF5, SF6, SF8, SF9, SF10  
**Deployment:** Windows NSIS installer + macOS DMG; offline-first, no server required  
**Data Residency:** All student data stored locally on the machine (IndexedDB, AES-256-GCM encrypted)  
**Cloud Usage:** Firebase Firestore for announcements sync and license verification only  
**Build Pipeline:** Vite → JavaScript obfuscation → electron-builder (NSIS/DMG)

### Key Facts

- Single local user account with PBKDF2-hashed credentials (310,000 iterations)
- AES-256-GCM encryption on 8 of 14 IndexedDB stores (all student/grade/attendance data)
- Hardware-bound license key via machine ID + HMAC-SHA256
- Auto-updates served from `https://formease-licensing.web.app/updates`
- Electron main process is obfuscated before packaging to protect IP

---

## 3. Architecture

### 3.1 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Desktop shell | Electron | 41.2.2 |
| UI framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build tool | Vite | 7.2.4 |
| State management | Zustand | 5.0.11 |
| Local database | IndexedDB (browser API) | DB v8 |
| Styling | TailwindCSS | 4.1.18 |
| Cloud backend | Firebase (Firestore + Auth) | 12.12.1 |
| PDF generation | @react-pdf/renderer + jspdf + pdf-lib | 4.3.2 / 4.1.0 / 1.17.1 |
| Charts | Recharts | 3.7.0 |
| Testing | Vitest | 4.1.8 |
| Packaging | electron-builder | 26.8.1 |

### 3.2 Data Flow

```
User Action
    │
    ▼
React Component (pages/ · components/)
    │
    ▼
Zustand Store (stores/) ─── persist to localStorage (credentials, settings, salt)
    │
    ▼
Database Service (services/database.ts)
    │
    ├── encrypt via AES-256-GCM  ◄──  utils/db-crypto.ts (PBKDF2 key)
    │
    ▼
IndexedDB "FormEaseDB" v8  (14 object stores)
    │
    └── optional cloud sync ──►  Firebase Firestore  (announcements only)
```

### 3.3 IndexedDB Stores

| Store | Key | Encrypted | Contains |
|-------|-----|-----------|---------|
| `students` | `lrn` | ✅ Yes | Full student PII |
| `classRecords` | `id` | ✅ Yes | Grades per student/subject/term |
| `enrollments` | `id` | ✅ Yes | Enrollment records |
| `attendanceRecords` | `id` | ✅ Yes | Daily attendance |
| `sf2Sheets` | `id` | ✅ Yes | Monthly SF2 sheets |
| `gradingSheetRecords` | `id` | ✅ Yes | Published/official grade records |
| `observedValues` | `id` | ✅ Yes | Core values observations |
| `automated_backups` | `id` | ✅ Yes | Auto-backup payloads |
| `schoolProfile` | `school_id` | ❌ No | School metadata, license info |
| `sections` | `id` | ❌ No | Class section configuration |
| `subjects` | `id` | ❌ No | Subject and grading weights |
| `announcements` | `id` | ❌ No | Bulletin board posts |
| `backups` | `id` | ❌ No | Manual backup metadata |
| `hpsRecords` | `id` | ❌ No | Highest Possible Score records |

### 3.4 State Stores

| Store | Fields | Responsibility |
|-------|--------|--------------|
| `app-store.ts` | ~50 | Master store: students, sections, subjects, grades, attendance, SF2, school years, UI state, backup/restore, notifications, cloud sync |
| `auth-store.ts` | ~15 | Login session, PBKDF2 hashing, security questions, 12-hour expiry, legacy migration |
| `sf10-store.ts` | ~5 | SF10 cell overrides + timestamped snapshots (last 20 retained) |
| `system-store.ts` | ~5 | Login announcement text, system-wide settings |

### 3.5 Module Map

```
app/src/
├── pages/          31 full-screen views
├── components/     47 components (16 games/tools, SF renderers, modals, layout)
├── stores/         5 Zustand stores
├── services/       6 backend services (db, backup, auto-backup, sync, excel)
├── lib/            8 domain libraries (grading, curriculum, RBAC, Firebase)
└── utils/          20 utilities (crypto, backup, SF-mappers, exporters, parsers)
```

---

## 4. Security Audit & Fixes

### 4.1 Security Strengths

| Control | Detail |
|---------|--------|
| Password hashing | PBKDF2 / SHA-256, 310,000 iterations, random salt per install |
| DB key derivation | PBKDF2 / SHA-256, 100,000 iterations → AES-256 key |
| Record encryption | AES-256-GCM, random 12-byte IV per record |
| Electron isolation | `contextIsolation: true`, `nodeIntegration: false`, devtools off in production |
| License hardware binding | Machine ID + HMAC-SHA256; timing-safe comparison |
| Auth error messages | Generic — no username enumeration possible |
| Session expiry | Hard 12-hour limit |
| Recovery lockout | 5 failed attempts → 15-minute lockout |
| Firestore license rules | Carefully scoped: only unclaimed licenses claimable; immutable fields protected |

### 4.2 Findings and Fix Steps

---

#### A. Backup exports are plaintext JSON

**Severity:** 🔴 CRITICAL  
**File:** [app/src/utils/backup-restore.ts](app/src/utils/backup-restore.ts) — `createComprehensiveBackup()`

**Problem:** Manual backups download a `.json` file containing the full decrypted payload: student names, LRNs, home addresses, parent information, all grades, and user credential hashes. No encryption is applied. A backup file on a USB drive, email attachment, or cloud folder exposes every student's PII.

`app/src/utils/backup-encryption.ts` already implements XChaCha20-Poly1305 encryption — it is just not wired to the export flow.

**Steps to Fix:**

1. **Read `backup-encryption.ts`** to confirm the encrypt/decrypt API signatures before calling them.

2. **In `SettingsPage.tsx`**, when the user clicks "Download Backup", show a password prompt modal instead of triggering the download immediately:
   ```tsx
   const [backupPassword, setBackupPassword] = useState('');
   const [showPasswordModal, setShowPasswordModal] = useState(false);

   const handleBackupDownload = () => setShowPasswordModal(true);

   const handleConfirmBackupPassword = async () => {
     if (backupPassword.length < 8) {
       toast.error('Backup password must be at least 8 characters');
       return;
     }
     await triggerEncryptedBackupDownload(backupPassword);
     setShowPasswordModal(false);
     setBackupPassword('');
   };
   ```

3. **In `backup-restore.ts`**, add an `exportEncryptedBackup()` function:
   ```ts
   import { encryptBackupFile } from './backup-encryption'; // adjust import path

   export async function exportEncryptedBackup(
     backup: ComprehensiveBackup,
     password: string
   ): Promise<Blob> {
     const json = JSON.stringify(backup);
     const encrypted = await encryptBackupFile(json, password); // uses XChaCha20
     return new Blob([encrypted], { type: 'application/octet-stream' });
   }
   ```

4. **Change the download file extension** from `.json` to `.febackup` so users know it is encrypted:
   ```ts
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = `formease-backup-${Date.now()}.febackup`;
   a.click();
   ```

5. **Update the restore flow** to detect encrypted vs plaintext backups by checking the file header before parsing:
   ```ts
   export async function loadBackupFile(
     file: File,
     password?: string
   ): Promise<ComprehensiveBackup> {
     const buffer = await file.arrayBuffer();
     const firstBytes = new Uint8Array(buffer, 0, 4);
     const isJson = firstBytes[0] === 0x7B; // '{'
     if (isJson) {
       // Legacy plaintext — warn user, then parse
       return JSON.parse(new TextDecoder().decode(buffer));
     }
     if (!password) throw new Error('This backup is encrypted. Please enter the backup password.');
     const decrypted = await decryptBackupFile(buffer, password);
     return JSON.parse(decrypted);
   }
   ```

---

#### B. No integrity check before backup restore

**Severity:** 🔴 CRITICAL  
**File:** [app/src/utils/backup-restore.ts](app/src/utils/backup-restore.ts) — `validateBackup()`

**Problem:** `validateBackup()` only checks that `metadata.exportDate` exists and that `students`/`sections` are arrays. No HMAC, checksum, or signature verifies that the file was not tampered with or partially corrupted. A modified backup file replaces all existing data silently.

**Steps to Fix:**

1. **At export time**, compute a SHA-256 hash of the payload and embed it in `metadata`:
   ```ts
   async function hashPayload(payload: ComprehensiveBackup['payload']): Promise<string> {
     const json = JSON.stringify(payload);
     const encoded = new TextEncoder().encode(json);
     const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
     return Array.from(new Uint8Array(hashBuffer))
       .map(b => b.toString(16).padStart(2, '0'))
       .join('');
   }

   // Inside createComprehensiveBackup(), after building backup:
   backup.metadata.payloadHash = await hashPayload(backup.payload);
   ```

2. **Add `payloadHash` to `BackupMetadata`** in `backup-restore.ts`:
   ```ts
   export interface BackupMetadata {
     exportDate: string;
     version: string;
     exportedBy: string;
     note: string;
     warning: string;
     payloadHash?: string; // SHA-256 hex of JSON.stringify(payload)
   }
   ```

3. **In `validateBackup()`**, verify the hash before accepting the restore:
   ```ts
   export async function validateBackup(
     backup: ComprehensiveBackup
   ): Promise<{ isValid: boolean; issues: string[] }> {
     const issues: string[] = [];
     if (!backup?.metadata?.exportDate) issues.push('Missing backup metadata timestamp');
     if (!Array.isArray(backup?.payload?.students)) issues.push('Students payload is invalid');
     if (!Array.isArray(backup?.payload?.sections)) issues.push('Sections payload is invalid');

     if (backup?.metadata?.payloadHash) {
       const recomputed = await hashPayload(backup.payload);
       if (recomputed !== backup.metadata.payloadHash) {
         issues.push('Backup file integrity check failed — the file may be corrupted or tampered with');
       }
     }
     return { isValid: issues.length === 0, issues };
   }
   ```

4. **In the restore UI** (`BackupRestoreModal.tsx` or `SettingsPage.tsx`), block the import if `isValid` is `false` and display `issues` to the user.

---

#### C. Encryption salt and session key in browser storage

**Severity:** 🟠 HIGH  
**Files:** [app/src/utils/db-crypto.ts](app/src/utils/db-crypto.ts) — `getDbSalt()`, `exportKeyToSession()`

**Problem:**
- The PBKDF2 salt (`formease-db-salt-v1`) is stored as plain base64 in `localStorage`.
- The derived AES-256 key (`formease-db-session-key`) is exported and stored as base64 in `sessionStorage`.

Both are accessible to any JavaScript executing in the renderer process. A compromised renderer (malicious file opened by the app, supply chain attack on a dependency) can read both values and decrypt all IndexedDB records without the user's password.

**Steps to Fix:**

1. **Add an IPC channel in `app/electron/main.cjs`** for salt storage using Electron's `safeStorage` (OS credential manager on Windows, Keychain on macOS):
   ```js
   const { safeStorage } = require('electron');
   const fs = require('fs');
   const path = require('path');
   const saltPath = path.join(app.getPath('userData'), 'db-salt.enc');

   ipcMain.handle('store-db-salt', (_event, saltBase64) => {
     const encrypted = safeStorage.encryptString(saltBase64);
     fs.writeFileSync(saltPath, encrypted);
   });

   ipcMain.handle('read-db-salt', () => {
     if (!fs.existsSync(saltPath)) return null;
     const encrypted = fs.readFileSync(saltPath);
     return safeStorage.decryptString(encrypted);
   });
   ```

2. **Expose the channel via `preload.cjs`**:
   ```js
   contextBridge.exposeInMainWorld('electronAPI', {
     storeDbSalt: (saltBase64) => ipcRenderer.invoke('store-db-salt', saltBase64),
     readDbSalt: () => ipcRenderer.invoke('read-db-salt'),
   });
   ```

3. **Update `getDbSalt()` in `db-crypto.ts`** to use the IPC bridge instead of `localStorage`:
   ```ts
   export async function getDbSalt(): Promise<Uint8Array> {
     const stored = await window.electronAPI?.readDbSalt();
     if (stored) return fromBase64(stored);

     const salt = crypto.getRandomValues(new Uint8Array(16));
     await window.electronAPI?.storeDbSalt(toBase64(salt));
     return salt;
   }
   ```

4. **Remove `exportKeyToSession()` usage** — keep the `CryptoKey` object in memory only (it lives for the life of the renderer process, which is the session). The key does not need to survive process restarts; re-derive it on next login. Delete calls to `exportKeyToSession` and `importKeyFromSession` from `auth-store.ts`.

5. **Remove the old `localStorage` salt key** on first migration:
   ```ts
   // One-time migration: remove plaintext salt from localStorage
   localStorage.removeItem('formease-db-salt-v1');
   sessionStorage.removeItem('formease-db-session-key');
   ```

---

#### D. No file-size validation on Excel imports

**Severity:** 🟠 HIGH  
**File:** [app/src/services/excel-import.ts](app/src/services/excel-import.ts)

**Problem:** `importStudentsFromExcel()` calls `reader.readAsArrayBuffer(file)` without checking `file.size`. A multi-gigabyte file stalls the renderer process indefinitely and can crash the app.

**Steps to Fix:**

1. **Add a size guard at the top of each import function** before touching the `FileReader`:
   ```ts
   const MAX_IMPORT_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

   export function importStudentsFromExcel(file: File): Promise<ImportResult> {
     return new Promise((resolve, reject) => {
       if (file.size > MAX_IMPORT_SIZE_BYTES) {
         reject(new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 20 MB.`));
         return;
       }
       // ... existing FileReader code
     });
   }
   ```

2. **Apply the same guard** to `importSectionsFromExcel()` and `importSubjectsFromExcel()`.

3. **(Optional — P3) Validate XLSX magic bytes** after reading to ensure the file is actually an Office Open XML package:
   ```ts
   const bytes = new Uint8Array(data as ArrayBuffer);
   const isXlsx = bytes[0] === 0x50 && bytes[1] === 0x4B &&
                  bytes[2] === 0x03 && bytes[3] === 0x04;
   if (!isXlsx) {
     reject(new Error('File does not appear to be a valid Excel (.xlsx) file.'));
     return;
   }
   ```

---

#### E. 30-day offline license grace period

**Severity:** 🟠 HIGH  
**File:** [app/electron/license.cjs](app/electron/license.cjs) — line 86

**Problem:** `const maxOfflineMs = 30 * 24 * 60 * 60 * 1000`. A revoked or expired license continues to work for up to 30 days after the last successful online verification. This is a business risk if a refund has been issued.

**Steps to Fix:**

1. **Change the constant to 7 days**:
   ```js
   // Before:
   const maxOfflineMs = 30 * 24 * 60 * 60 * 1000;

   // After:
   const maxOfflineMs = 7 * 24 * 60 * 60 * 1000;
   ```

2. **Show a user-facing warning at 5 days** (i.e., 2 days before expiry of the grace period) so offline users know to connect:
   ```js
   const daysOffline = (Date.now() - lastVerified) / (24 * 60 * 60 * 1000);
   if (daysOffline > 5) {
     // Return a soft warning alongside the activated status
     return { activated: true, warning: `offline_grace_expiring`, daysRemaining: Math.ceil(7 - daysOffline) };
   }
   ```

3. **Surface the warning in the UI** — check for `result.warning === 'offline_grace_expiring'` in `ActivationPage.tsx` or the app init and show a banner: *"You have been offline for X days. Please connect to the internet to keep your license active."*

---

#### F. Firebase client credentials embedded in bundle

**Severity:** 🟡 MEDIUM  
**File:** [app/src/lib/firebase.ts](app/src/lib/firebase.ts)

**Problem:** The Firebase API key, project ID, auth domain, and storage bucket are embedded in the compiled Electron bundle. This is standard and acceptable for anonymous auth clients — Firebase security rules are the sole enforcement mechanism — but it should be documented so future maintainers do not treat the key as a secret.

**Steps to Fix:**

1. **Add a comment to `firebase.ts`** explaining the intentional design:
   ```ts
   // NOTE: These Firebase credentials are intentionally embedded in the client bundle.
   // The API key is not a secret — Firebase Security Rules (firestore.rules) are the
   // sole enforcement mechanism. Never assume the key provides any access control.
   // See: https://firebase.google.com/docs/projects/api-keys
   const firebaseConfig = { ... };
   ```

2. No code change is required beyond the comment. Ensure `firestore.rules` remains the authoritative security boundary and is reviewed whenever new collections are added.

---

#### G. Trial Firestore document ID equals machine ID

**Severity:** 🟡 MEDIUM  
**File:** [firestore.rules](firestore.rules) — line 65

**Problem:** Trial registrations use the device's machine ID as the Firestore document ID. Because `allow get: if true`, any authenticated session can probe arbitrary machine IDs to check if a device has or has not claimed a trial — enabling enumeration if machine IDs are predictable.

**Steps to Fix:**

1. **In the desktop app**, hash the machine ID before using it as the document ID:
   ```ts
   async function getTrialDocId(machineId: string): Promise<string> {
     const data = new TextEncoder().encode(machineId + 'formease-trial-v1');
     const hash = await crypto.subtle.digest('SHA-256', data);
     return Array.from(new Uint8Array(hash))
       .map(b => b.toString(16).padStart(2, '0'))
       .join('');
   }
   ```

2. **Update all Firestore trial operations** (registration check, claim, admin lookup) to use `await getTrialDocId(machineId)` instead of the raw machine ID.

3. **Update `firestore.rules`** — the `machine_id == trialId` constraint must now be `machine_id == sha256(trialId + "formease-trial-v1")`. Because Firestore rules cannot compute SHA-256, the rule becomes a structural check only (key existence + field types), and the hash verification is enforced by the desktop app itself. The important protection (preventing a device from registering a trial for someone else's ID) is maintained by the fact that each device only knows its own hash.

---

#### H. RBAC provides no role-differentiated enforcement

**Severity:** 🔵 LOW  
**File:** [app/src/lib/rbac.ts](app/src/lib/rbac.ts)

**Problem:** All `can*()` functions return `true` for any authenticated user regardless of their assigned role. Acceptable for the current single-user model, but creates a false sense of security if multi-user mode is added.

**Steps to Fix (if multi-user is planned):**

1. Update each `can*()` function to check `user.role` or `user.roles[]`:
   ```ts
   export function canEditEClassSection(user: User | null, sectionAdviserId?: string): boolean {
     if (!user) return false;
     if (user.role === 'admin') return true;
     if (user.role === 'teacher' || user.role === 'adviser') {
       return sectionAdviserId === user.uid;
     }
     return false;
   }
   ```

2. No change needed for the current single-user deployment — document this as a known limitation.

---

#### I. No file-type validation on Excel import

**Severity:** 🔵 LOW  
**File:** [app/src/services/excel-import.ts](app/src/services/excel-import.ts)

**Steps to Fix:** Covered in [Section D, Step 3](#d-no-file-size-validation-on-excel-imports).

---

### 4.3 Security Summary

| Severity | Count | Items |
|----------|-------|-------|
| 🔴 Critical | 2 | Plaintext backup export, no backup integrity check |
| 🟠 High | 3 | Browser storage for salt/key, no Excel file-size guard, 30-day grace period |
| 🟡 Medium | 2 | Firebase key undocumented, trial ID enumerable |
| 🔵 Low | 2 | RBAC no-op, no XLSX magic-byte check |

---

## 5. Feature Audit

### 5.1 Implemented Features

| Category | Feature | Status |
|---------|---------|--------|
| **School Forms** | SF2 Daily Attendance Sheet | ✅ Complete |
| | SF5 Report on Promotion | ✅ Complete |
| | SF6 Summarized Promotion Report | ✅ Complete |
| | SF8 BMI / Health & Nutrition Report | ✅ Complete |
| | SF9 Report Card (Grades 1–10, JHS, SHS) | ✅ Complete |
| | SF10 Permanent Academic Record / Form 137 (ES, JHS, SHS) | ✅ Complete |
| **Grading** | E-Class Record Grades 1–10 (WW / PT / QE weighted) | ✅ Complete |
| | SHS E-Class Record Grades 11–12 | ✅ Complete |
| | Consolidated Grades view (section-wide matrix) | ✅ Complete |
| | Custom grading weights per subject cluster | ✅ Complete |
| | DepEd transmutation table | ✅ Complete |
| | MAPEH virtual aggregation | ✅ Complete |
| | Proficiency level breakdown per gender | ✅ Complete |
| **Attendance** | SF2-compliant monthly grid (ADA, 5-consecutive-absence flags) | ✅ Complete |
| | 14-day attendance trend on Dashboard | ✅ Complete |
| **Reports** | MPS per subject, honor rolls, at-risk students, subject awardees | ✅ Complete |
| | Gender distribution, academic achievement charts | ✅ Complete |
| **Certificates** | 4 types (EOSY, T1, T2, T3) with 8 award evaluation types | ✅ Complete |
| **Student Data** | Full student profile (SF10-ES/JHS/SHS fields, BMI, photo, contacts) | ✅ Complete |
| | Excel bulk import/export (students, sections, subjects) | ✅ Complete |
| | SF1 form parser for legacy import | ✅ Complete |
| | Custom enrollment template download | ✅ Complete |
| **Dashboard** | Real-time KPIs (enrollment, grading progress, attendance, achievers) | ✅ Complete |
| **Calendar** | 7-type school calendar with event management | ✅ Complete |
| **Announcements** | Local + optional Firebase cloud sync | ✅ Complete |
| **Award Evaluations** | 8 award types with scored competencies per DepEd framework | ✅ Complete |
| **Backup & Restore** | Auto-backup (daily, 5-rotation), manual backup, selective restore | ✅ Complete |
| **Onboarding** | 17-step interactive wizard with spotlight highlighting | ✅ Complete |
| **Games & Tools** | 16 educational classroom tools | ✅ Complete |
| **Licensing** | Hardware-bound license with online verification | ✅ Complete |
| **Auto-update** | electron-updater with hosted update server | ✅ Complete |

### 5.2 Gaps and Improvement Opportunities

| Item | Detail | Fix Steps | Priority |
|------|--------|-----------|---------|
| Encrypted backup export | Manual exports are plaintext; `backup-encryption.ts` is unwired | See [Section 4.2-A](#a-backup-exports-are-plaintext-json) | P0 |
| Anecdotal/LIR records | `AnecdotalRecordPage.tsx` deleted in current working tree; no sidebar replacement visible | Re-add a route or replace with a new LIR component | P2 |
| Activity log persistence | Form activity log in `SchoolFormsPage.tsx` uses `localStorage` — wiped on restore/reinstall | Move to a new `activityLog` IndexedDB store; see [Section 6.2](#62-issues) | P2 |
| Bulk attendance import | Attendance entry is manual only; no Excel/CSV import | Add import function to `excel-import.ts` following the existing student import pattern | P3 |
| Grade approval workflow | All grade edits are immediately final; no supervisor review step | Add a `status: 'draft' | 'submitted' | 'approved'` field to `ClassRecord` | P3 |

---

## 6. Code Quality & Fixes

### 6.1 Strengths

- **TypeScript 5.9 throughout** — domain models in `types/index.ts` are well-typed; core structures use no raw `any`
- **Clean layering** — components → stores → services → `db.*`; no direct IndexedDB access from UI code
- **Consistent async/await** — all database operations follow the same pattern with structured try/catch
- **Native Web Crypto** — PBKDF2 and AES-256-GCM use `crypto.subtle` with zero third-party crypto dependencies
- **Unit tests for grading** — `lib/grading.test.ts` and `utils/grading-helpers.test.ts` cover the highest-risk pure functions

### 6.2 Issues

---

#### Issue 1 — Oversized SF10/SF9 renderer files

| File | Size |
|------|------|
| `SF10SpecRenderer.tsx` | 84 KB |
| `SF10JHSRenderer.tsx` | 77 KB |
| `SF10SHSRenderer.tsx` | 33 KB |
| `SF9SHSRenderer.tsx` | 33 KB |

**Steps to Fix:**

1. **Split `SF10JHSRenderer.tsx`** into logical sub-components:
   ```
   components/
   ├── sf10/
   │   ├── SF10JHSHeader.tsx         ← school info, student info block
   │   ├── SF10JHSEligibility.tsx    ← completer/PEPT/ALS section
   │   ├── SF10JHSScholasticRecord.tsx  ← the grade table rows
   │   ├── SF10JHSSignatories.tsx    ← certification block
   │   └── index.ts                  ← re-exports SF10JHSRenderer
   ```

2. **Extract shared types** used by all SF10 variants into `components/sf10/sf10-types.ts`.

3. Apply the same split pattern to `SF10SpecRenderer.tsx` and `SF9SHSRenderer.tsx`.

---

#### Issue 2 — Monolithic `app-store.ts`

`app-store.ts` manages ~50 fields across six unrelated domains in a single Zustand store. Any field change triggers re-renders across all subscribed components.

**Steps to Fix:**

1. **Create `stores/attendance-store.ts`**:
   ```ts
   import { create } from 'zustand';
   interface AttendanceStore {
     attendanceRecords: AttendanceRecord[];
     sf2Sheets: SF2Sheet[];
     setAttendanceRecords: (records: AttendanceRecord[]) => void;
     setSf2Sheets: (sheets: SF2Sheet[]) => void;
   }
   export const useAttendanceStore = create<AttendanceStore>((set) => ({
     attendanceRecords: [],
     sf2Sheets: [],
     setAttendanceRecords: (records) => set({ attendanceRecords: records }),
     setSf2Sheets: (sheets) => set({ sf2Sheets: sheets }),
   }));
   ```

2. **Create `stores/grading-store.ts`** with `classRecords`, `gradingSheetRecords`, `hpsRecords`, `observedValues`.

3. **Create `stores/announcements-store.ts`** with `announcements`, `cloudSyncEnabled`.

4. **Update `stores/index.ts`** to export all new stores alongside `useAppStore`.

5. **Migrate component imports** — search for `useAppStore(state => state.attendanceRecords)` and replace with `useAttendanceStore(state => state.attendanceRecords)`.

---

#### Issue 3 — No integration or UI tests

Only grading math has unit test coverage. The backup/restore flow, license activation, and form generation have zero automated tests.

**Steps to Fix:**

1. **Install testing libraries**:
   ```bash
   npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
   ```

2. **Configure Vitest** to include the DOM environment in `vite.config.ts`:
   ```ts
   test: {
     environment: 'jsdom',
     setupFiles: ['./src/test-setup.ts'],
   }
   ```

3. **Create `src/test-setup.ts`**:
   ```ts
   import '@testing-library/jest-dom';
   ```

4. **Write a smoke test for Dashboard** at `src/__tests__/Dashboard.test.tsx`:
   ```tsx
   import { render, screen } from '@testing-library/react';
   import Dashboard from '../pages/Dashboard';

   test('renders KPI cards', () => {
     render(<Dashboard />);
     expect(screen.getByText(/Student Population/i)).toBeInTheDocument();
   });
   ```

5. **Write a backup/restore integration test** that creates a backup object, hashes it, mutates one field, and asserts that `validateBackup()` returns `isValid: false`.

---

#### Issue 4 — `dangerouslySetInnerHTML` usage

Several SF10 and LIR renderer components inject CSS via `dangerouslySetInnerHTML`. Content is generated internally (not from user input), so XSS risk is low — but it suppresses React's protections.

**Steps to Fix:**

1. For simple cases, replace with a `<style>` JSX element:
   ```tsx
   // Before:
   <div dangerouslySetInnerHTML={{ __html: '<style>.sf10 { ... }</style>' }} />

   // After:
   <style>{`.sf10 { ... }`}</style>
   ```

2. Add a comment on any remaining instances explaining why it is safe:
   ```tsx
   {/* CSS string is statically generated — no user input involved */}
   <div dangerouslySetInnerHTML={{ __html: cssString }} />
   ```

---

#### Issue 5 — Activity log is ephemeral

The form generation activity log in `SchoolFormsPage.tsx` is stored in `localStorage` and is wiped on backup restore or reinstall.

**Steps to Fix:**

1. **Add an `activityLog` store** to `database.ts`:
   ```ts
   // In DB_STORES or createObjectStore call during upgrade:
   db.createObjectStore('activityLog', { keyPath: 'id' });
   ```

2. **Create an `ActivityLogEntry` type** in `types/index.ts`:
   ```ts
   export interface ActivityLogEntry {
     id: string;
     action: string;
     details: string;
     userId: string;
     userName: string;
     timestamp: string;
     entityType: string;
     entityId?: string;
   }
   ```

3. **Replace `localStorage`-based log writes** in `SchoolFormsPage.tsx` with `db.putRecord('activityLog', entry)`.

---

## 7. Dependencies & Fixes

### 7.1 Runtime Dependency Status

| Package | Version | Status | Action |
|---------|---------|--------|--------|
| `react` + `react-dom` | ^19.2.0 | ✅ Current | None |
| `electron` | 41.2.2 | ✅ Current | None |
| `firebase` | ^12.12.1 | ✅ Current | None |
| `zustand` | ^5.0.11 | ✅ Current | None |
| `@react-pdf/renderer` | ^4.3.2 | ✅ Current | None |
| `electron-updater` | ^6.8.3 | ✅ Current | None |
| `jspdf` + `pdf-lib` | ^4.1.0 / 1.17.1 | ✅ Current | None |
| `recharts` | ^3.7.0 | ✅ Current | None |
| `framer-motion` | ^12.33.0 | ✅ Current | None |
| `node-machine-id` | ^1.1.12 | ✅ Current | None |
| `xlsx` | ^0.18.5 | ⚠️ Watch | No CVEs currently; monitor security advisories. Community fork `xlsx-js-style` is more actively maintained but not a drop-in replacement for this use case. |
| `dom-to-image-more` | ^3.7.2 | ❌ Remove | Redundant with `html2canvas-pro` — see fix below |
| `html2canvas-pro` | ^2.0.4 | ✅ Keep | More actively maintained; prefer over `dom-to-image-more` |

### 7.2 Dev Dependency Status

| Package | Status | Action |
|---------|--------|--------|
| `vite-plugin-javascript-obfuscator` | ✅ Keep | Correct entry point |
| `javascript-obfuscator` | ❌ Remove direct dep | Already pulled in transitively by the plugin |
| `@testing-library/react` | ❌ Missing | Add — see [Section 6.2 Issue 3](#issue-3--no-integration-or-ui-tests) |
| `vitest` | ✅ Present | Already configured |

### 7.3 Fix Steps — Remove Redundant Dependencies

1. **Find all usages of `dom-to-image-more`**:
   ```bash
   grep -r "dom-to-image-more" app/src --include="*.tsx" --include="*.ts" -l
   ```

2. **For each file found**, replace the `domtoimage` calls with `html2canvas`:
   ```ts
   // Before (dom-to-image-more):
   import domtoimage from 'dom-to-image-more';
   const dataUrl = await domtoimage.toPng(element);

   // After (html2canvas-pro):
   import html2canvas from 'html2canvas-pro';
   const canvas = await html2canvas(element, { useCORS: true, scale: 2 });
   const dataUrl = canvas.toDataURL('image/png');
   ```

3. **Uninstall** both redundant packages:
   ```bash
   cd app
   npm uninstall dom-to-image-more javascript-obfuscator
   ```

4. **Verify the build** still works: `npm run build`.

---

## 8. Performance & Fixes

### 8.1 Memory-Intensive PDF Generation

**Problem:** SF10/SF9 batch PDF generation renders all selected student records into the DOM simultaneously before capturing with `html2canvas`. For 40–50 students, hundreds of complex nodes are inflated at once — on 4 GB RAM school computers this causes long freezes or crashes.

**Steps to Fix:**

1. **Change batch rendering from parallel to sequential** in the PDF generation function:
   ```ts
   // Before (parallel — all at once):
   const images = await Promise.all(students.map(s => renderAndCapture(s)));

   // After (sequential with progress):
   const images: string[] = [];
   for (let i = 0; i < students.length; i++) {
     setProgress({ current: i + 1, total: students.length });
     const img = await renderAndCapture(students[i]);
     images.push(img);
     // Yield to the browser between captures to prevent freezing
     await new Promise(r => requestAnimationFrame(r));
   }
   ```

2. **Add a progress bar** to the PDF generation modal:
   ```tsx
   {isGenerating && (
     <div className="mt-4">
       <p className="text-sm text-gray-600">
         Generating PDF {progress.current} of {progress.total}...
       </p>
       <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
         <div
           className="bg-blue-600 h-2 rounded-full transition-all"
           style={{ width: `${(progress.current / progress.total) * 100}%` }}
         />
       </div>
     </div>
   )}
   ```

3. **Dispose the temporary container** after each capture:
   ```ts
   async function renderAndCapture(student: Student): Promise<string> {
     const container = document.createElement('div');
     container.style.position = 'absolute';
     container.style.left = '-9999px';
     document.body.appendChild(container);
     try {
       ReactDOM.render(<SF10JHSRenderer student={student} />, container);
       const canvas = await html2canvas(container);
       return canvas.toDataURL('image/png');
     } finally {
       ReactDOM.unmountComponentAtNode(container);
       document.body.removeChild(container);
     }
   }
   ```

---

### 8.2 Dashboard Analytics Without Memoization

**Problem:** Attendance trends, grade averages, achiever counts, and gender breakdowns are recomputed inline on every Dashboard render, scanning all class records and attendance records each time.

**Steps to Fix:**

Wrap all expensive derivations in `useMemo` inside `Dashboard.tsx`:

```tsx
import { useMemo } from 'react';

const achieverCount = useMemo(
  () => gradingSheetRecords.filter(r => (r.final_grade ?? 0) >= 90).length,
  [gradingSheetRecords]
);

const atRiskCount = useMemo(
  () => gradingSheetRecords.filter(r => (r.final_grade ?? 100) < 75).length,
  [gradingSheetRecords]
);

const attendanceTrend = useMemo(
  () => computeAttendanceTrend(attendanceRecords, 14),
  [attendanceRecords]
);

const genderDistribution = useMemo(
  () => computeGenderDistribution(students),
  [students]
);
```

---

### 8.3 No IndexedDB Read Pagination

**Problem:** `database.ts:getAllRecords()` decrypts and returns every record in a store before returning anything. For schools with 500–1,000+ students this initial load takes several seconds and holds the full decrypted dataset in memory.

**Steps to Fix:**

1. **Add a paginated read method** to `database.ts`:
   ```ts
   async getRecordsPaginated<T>(
     storeName: string,
     page: number,
     pageSize: number
   ): Promise<{ records: T[]; hasMore: boolean }> {
     const db = await this.getDb();
     return new Promise((resolve, reject) => {
       const tx = db.transaction(storeName, 'readonly');
       const store = tx.objectStore(storeName);
       const records: T[] = [];
       let skipped = 0;
       const skip = page * pageSize;
       const request = store.openCursor();
       request.onsuccess = async (e) => {
         const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
         if (!cursor || records.length >= pageSize) {
           resolve({ records, hasMore: !!cursor });
           return;
         }
         if (skipped < skip) { skipped++; cursor.continue(); return; }
         const decrypted = await this.decryptRecordIfNeeded<T>(storeName, cursor.value);
         records.push(decrypted);
         cursor.continue();
       };
       request.onerror = () => reject(request.error);
     });
   }
   ```

2. **Use pagination in `StudentsPage.tsx`** for the student list view:
   ```tsx
   const PAGE_SIZE = 50;
   const [page, setPage] = useState(0);
   const [students, setStudents] = useState<Student[]>([]);
   const [hasMore, setHasMore] = useState(true);

   useEffect(() => {
     db.getRecordsPaginated<Student>('students', page, PAGE_SIZE).then(({ records, hasMore }) => {
       setStudents(prev => page === 0 ? records : [...prev, ...records]);
       setHasMore(hasMore);
     });
   }, [page]);
   ```

---

### 8.4 Monolithic App Store Re-renders

Splitting `app-store.ts` (described in [Section 6.2 Issue 2](#issue-2--monolithic-app-storerts)) also resolves this performance issue. Once attendance and grading state live in separate stores, toggling a UI flag in `appStore` will no longer re-render `AttendancePage` or `EClassRecord`.

---

## 9. Master Fix Roadmap

All findings from both audit documents, combined into a single prioritized action list with effort estimates and responsible files.

| Priority | Severity | Category | Finding | File(s) | Effort | Section |
|----------|----------|---------|---------|---------|--------|---------|
| **P0** | 🔴 | Security | Backup files are unencrypted PII on disk | `backup-restore.ts`, `SettingsPage.tsx` | Medium | [4.2-A](#a-backup-exports-are-plaintext-json) |
| **P0** | 🔴 | Security | No integrity check on backup restore | `backup-restore.ts` | Small | [4.2-B](#b-no-integrity-check-before-backup-restore) |
| **P1** | 🟠 | Security | Salt + session key in browser storage | `db-crypto.ts`, `electron/main.cjs`, `preload.cjs` | Medium | [4.2-C](#c-encryption-salt-and-session-key-in-browser-storage) |
| **P1** | 🟠 | Security | No file-size guard on Excel import | `excel-import.ts` | Trivial | [4.2-D](#d-no-file-size-validation-on-excel-imports) |
| **P1** | 🟠 | Security | 30-day offline license grace period | `electron/license.cjs` | Trivial | [4.2-E](#e-30-day-offline-license-grace-period) |
| **P2** | 🟡 | Security | Trial doc ID = raw machine ID (enumerable) | `electron/license.cjs`, `firestore.rules` | Medium | [4.2-G](#g-trial-firestore-document-id-equals-machine-id) |
| **P2** | — | Code Quality | SF10/SF9 renderer files 33–84 KB | `SF10JHSRenderer.tsx`, `SF10SpecRenderer.tsx`, `SF9SHSRenderer.tsx` | Large | [Issue 1](#issue-1--oversized-sf10sf9-renderer-files) |
| **P2** | — | Code Quality | `app-store.ts` monolithic (~50 fields) | `stores/app-store.ts` | Large | [Issue 2](#issue-2--monolithic-app-storerts) |
| **P2** | — | Testing | No UI or integration tests | `package.json`, new `__tests__/` | Medium | [Issue 3](#issue-3--no-integration-or-ui-tests) |
| **P2** | — | Performance | Dashboard analytics recomputed each render | `pages/Dashboard.tsx` | Small | [8.2](#82-dashboard-analytics-without-memoization) |
| **P2** | — | Feature | Anecdotal/LIR records removed with no replacement | `pages/`, `Sidebar.tsx` | Medium | [5.2](#52-gaps-and-improvement-opportunities) |
| **P3** | 🟡 | Security | Firebase key undocumented | `lib/firebase.ts` | Trivial | [4.2-F](#f-firebase-client-credentials-embedded-in-bundle) |
| **P3** | 🔵 | Security | No XLSX magic-byte validation | `excel-import.ts` | Trivial | [4.2-I](#i-no-file-type-validation-on-excel-import) |
| **P3** | — | Dependencies | `dom-to-image-more` redundant | `package.json` | Small | [7.3](#73-fix-steps--remove-redundant-dependencies) |
| **P3** | — | Dependencies | `javascript-obfuscator` as direct dep | `package.json` | Trivial | [7.3](#73-fix-steps--remove-redundant-dependencies) |
| **P3** | — | Dependencies | Add `@testing-library/react` | `package.json` | Trivial | [Issue 3](#issue-3--no-integration-or-ui-tests) |
| **P3** | — | Performance | IndexedDB reads have no pagination | `services/database.ts`, `StudentsPage.tsx` | Large | [8.3](#83-no-indexeddb-read-pagination) |
| **P3** | — | Performance | PDF batch generation inflates all records at once | SF9/SF10 generation logic | Medium | [8.1](#81-memory-intensive-pdf-generation) |
| **P3** | — | Feature | Activity log is `localStorage`-only | `SchoolFormsPage.tsx`, `services/database.ts` | Small | [Issue 5](#issue-5--activity-log-is-ephemeral) |
| **P3** | — | Feature | No bulk attendance import | `excel-import.ts` | Medium | [5.2](#52-gaps-and-improvement-opportunities) |

### Suggested Sprint Order

**Sprint 1 — Security hardening (P0 + P1)**
- Wire `backup-encryption.ts` to the manual export flow (password prompt → encrypted `.febackup`)
- Add `payloadHash` to backup metadata and verify it on restore
- Add Excel file-size guard
- Reduce license grace period to 7 days

**Sprint 2 — Storage hardening + quality (P1 + P2)**
- Migrate DB salt to Electron `safeStorage`
- Add Dashboard `useMemo` wrappers
- Write smoke tests for Dashboard and EClassRecord
- Begin `app-store.ts` split (attendance store first — smallest domain)

**Sprint 3 — Maintainability (P2 + P3)**
- Split SF10JHSRenderer into sub-components
- Remove `dom-to-image-more`, unify on `html2canvas-pro`
- Sequential PDF batch generation with progress bar
- Add activity log IndexedDB store

**Sprint 4 — Scale and polish (P3)**
- IndexedDB read pagination for students
- Trial ID hashing for Firestore
- RBAC enforcement (if multi-user mode is planned)
- Bulk attendance import

---

## Appendix — File Inventory

### Pages (31)
`AccountSetupPage`, `ActivationPage`, `AnnouncementsPage`, `AttendancePage`, `CalendarPage`, `CertificateGeneratorPage`, `ConsolidatedGradesPage`, `Dashboard`, `EClassRecord`, `EnrollmentCenterPage`, `GamesAndToolsPage`, `InstitutePage`, `LIRPage`, `LoginPage`, `NameTagPage`, `ReportsPage`, `SF5Page`, `SF6Page`, `SF8Page`, `SF9Page`, `SF10Page`, `SchoolFormsPage`, `SectionsPage`, `SettingsPage`, `ShsEClassRecord`, `StudentsPage`, `SubjectsPage`, `TemporaryGradeSlipPage`, `UsersPage`, `AboutPage`

### Key Services
`database.ts` — IndexedDB wrapper with transparent AES-256-GCM encryption  
`AutoBackupManager.ts` — Daily auto-backup scheduler with 5-backup rotation  
`announcement-sync.ts` — Firebase Firestore real-time sync for announcements  
`excel-import.ts` — Bulk student/section/subject import from XLSX  
`excel-export.ts` — Formatted XLSX export

### Key Utils
`db-crypto.ts` — PBKDF2 key derivation + AES-256-GCM encrypt/decrypt  
`backup-restore.ts` — Backup creation, validation, restore logic  
`backup-encryption.ts` — XChaCha20-Poly1305 file encryption (available, not wired to manual export)  
`grading-helpers.ts` — MPS, honor roll, at-risk, proficiency computations  
`sf10Mapper.ts`, `shsSf10Mapper.ts`, `shsSf9Mapper.ts` — DepEd form field mapping

---

*Combined audit report generated by Claude Code on 2026-06-17. Findings are based on static analysis of the source code at commit `82591b8` (v2.2.6) plus all uncommitted working-tree changes visible in git status. Fix steps are prescriptive and reference exact file paths — implement and verify each fix with `npm run build` and, for security fixes, manual testing of the affected flow.*
