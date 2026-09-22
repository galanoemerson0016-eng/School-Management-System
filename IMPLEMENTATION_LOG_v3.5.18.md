# FormEase Pro v3.5.18 implementation log

## Baseline

- Starting branch/commit: `main` / `70c5bd56a3e3b60aafcc6e482584892c34f718b0`
- Stabilization branch: `fix/v3.5.18-data-integrity`
- Starting package version: `3.5.17`
- Initial Git state: clean; no untracked files.
- Verified first-stabilization checkpoint: `baa5ac59613dc6abfd30f2b991aeb3b9022eed7f` (`fix(stability): harden restore attendance grade sync and identity`). It is local only; it has not been pushed, tagged, deployed, or released.
- Initial test/build/lint commands were started, but the local command wrapper did not return their final summaries. `npm run release:check` passed for v3.5.17. The baseline `npm audit` reports 10 vulnerabilities (2 high, 8 moderate), including direct `xlsx` and `exceljs` advisories; no dependency changes have been made.

## Implemented and verified in focused tests

### Backup Replace and school profile integrity

- **Problem:** Replace skipped empty selected collections; placeholder school-profile objects could overwrite a real profile.
- **Root cause:** `restoreStoreData` returned before `clearStore`; profile resolution synthesized `school_id` values for any object.
- **Files changed:** `app/src/utils/backup-import.ts`, `app/src/utils/backup-import.test.ts`.
- **Fix:** Replace clears selected stores before any empty-list return. A profile must contain a non-placeholder name and school identifier to be restored. Unselected activity logs are no longer restored.
- **Tests:** Empty Replace clears ten supported collections; empty, placeholder, ID-only, and valid multi-profile inputs are covered.
- **Migration implications:** None. Existing valid profiles retain their stored identifiers; incomplete profile payloads are now safely ignored.
- **Remaining risk:** Restore is not transaction-wide; a browser failure between selected stores can still yield a partial restore and needs a v3.6 migration/restore journal.

### SF2 and attendance reconciliation

- **Problem:** SF2 grouping parsed opaque section IDs and blank SF2 saves left stale attendance records.
- **Root cause:** Business fields came from `sheetId.split('_')`; reconciliation only ran for a nonempty rebuilt list and only deleted keys being rebuilt.
- **Files changed:** `app/src/stores/slices/attendance-slice.ts`, `app/src/stores/app-store.ts`, `app/src/stores/slices/attendance-slice.test.ts`.
- **Fix:** Grouping retains explicit `sectionId`, `schoolYear`, and `month`. A saved SF2 reconciles its exact section/date scope even when it has no marks. Startup repair also avoids composite-ID parsing and preserves blank sheets.
- **Tests:** An underscore-containing section ID creates correct SF2 metadata; clearing every September mark deletes only its scoped stale record.
- **Migration implications:** None; legacy sheet IDs remain readable through existing lookup behavior.
- **Remaining risk:** Attendance provenance is not yet persisted. A v3.6 centralized reconciliation service should formally distinguish SF2, mobile, and daily-attendance ownership.

### Grade sync integrity

- **Problem:** E-Class sync replacement erased assessment details and could replace manual overrides.
- **Root cause:** `updateGradingSheetRecord` replaced full matching objects.
- **Files changed:** `app/src/stores/slices/grading-slice.ts`, `app/src/stores/slices/grading-slice.test.ts`.
- **Fix:** E-Class final-grade updates retain existing WW/PT/exam details. Normal E-Class updates preserve a `manual_override`; an explicit caller option is required to overwrite one.
- **Tests:** Assessment-detail preservation and manual-override protection pass.
- **Migration implications:** None.
- **Remaining risk:** The batch-sync modal has not yet surfaced separate synchronized/skipped-override totals.

### Advisory identity and authorization

- **Problem:** advisory filtering failed open and accepted fuzzy email authorization; Firebase sign-in overwrote local user identity.
- **Root cause:** fallback returned all sections and cloud sign-in mutated `user.uid`.
- **Files changed:** `app/src/lib/rbac.ts`, `app/src/stores/auth-store.ts`, `app/src/types/index.ts`, `app/src/testing/sf2AttendanceReconciliation.test.ts`.
- **Fix:** teacher filtering is fail-closed and requires exact local identity matching. `localUserId` and `cloudUid` are distinct; legacy `uid` remains the local ID for compatibility.
- **Tests:** unassigned/fuzzy-email denial and exact local identity authorization pass.
- **Migration implications:** Existing local adviser assignments using `uid` continue to work. Ambiguous name-only assignments no longer grant access.
- **Remaining risk:** Other page-level legacy `user.uid` checks need the planned v3.6 canonical identity service audit.

## Encryption architecture investigation (before changes)

- **Key origin:** `setupDatabaseEncryption(password)` reads the database salt and derives a 256-bit AES-GCM key with PBKDF2-SHA-256 (100,000 iterations). The trial path derives the same kind of key from the machine ID instead of a password.
- **Salt storage:** `formease-db-salt-v1` in local storage is the first lookup. Electron also maintains `formease-db-salt.enc` under its user-data directory using `safeStorage`; the renderer migrates that value back into local storage when present.
- **Encrypted records:** `students`, `classRecords`, `enrollments`, `attendanceRecords`, `sf2Sheets`, `gradingSheetRecords`, `observedValues`, and `automated_backups`. They use AES-GCM envelopes with selected index fields projected in clear text.
- **Normal password change:** while the old key is active, auth reads all eight collections, derives the new password key, switches the active key, and rewrites each collection. There is no explicit all-or-nothing migration marker or post-write verification.
- **Security-answer reset:** it verifies the answer hash and updates `passwordHash` only. It neither derives the old key nor migrates encrypted data, so it can orphan the existing records after restart.
- **Existing migrations:** IndexedDB schema version is 12; the database has a v11 indexing-projection rewrite marker and a guarded students-store key-path migration. Neither handles encryption architecture/versioning. No wrapped DEK, recovery key, or encryption migration marker exists.
- **Failure behavior:** read decryption errors are logged and the encrypted envelope is returned as though it were the requested record. This must not be treated as successful recovery because it can look like unreadable or empty application data.

### Proposed recovery-safe direction under evaluation

The safe desktop-compatible design is a random AES-GCM DEK for records, wrapped by a password-derived KEK and separately protected by Electron `safeStorage` for same-OS-user recovery after the security answer is verified. A browser/non-Electron environment cannot safely keep a recovery protector; it must refuse a data-bearing password reset rather than report success. A legacy database can only migrate after a successful normal password login, when its current key can decrypt and verify all encrypted stores. Migration must have explicit prepared/committed metadata and leave legacy data recoverable until verification succeeds.

### Final target model (approved for implementation)

- **DEK:** a random AES-256-GCM key encrypts every encrypted FormEase record after migration. It is never persisted raw.
- **Password KEK:** PBKDF2 derives a KEK from the current password and existing DB salt. It stores a versioned password-wrapped DEK in `formease-db-key-envelope-v1` local-storage metadata. Password change replaces only this wrapper after verifying it unwraps the same DEK.
- **Recovery protector:** Electron 41 runs with `nodeIntegration: false` and `contextIsolation: true`; its main process already uses OS-backed `safeStorage` for the DB salt. A new narrow IPC bridge will accept only a versioned wrapped-DEK payload for safe-storage protection/recovery. It will not expose generic encryption/decryption or filesystem APIs. The security answer remains an authorization check and is not an encryption key.
- **Platform scope:** Windows and macOS Electron builds can use their OS credential protection. Linux/browser/test environments must explicitly report that recovery protection is unavailable; they must never persist a raw recovery key in local storage or pretend password recovery can unlock data.
- **Migration state:** durable local metadata will identify `legacy`, `migration_prepared`, `migration_in_progress`, `migration_verifying`, `migrated`, and `migration_failed_recoverable`. A prepared migration retains the legacy password key as a temporary read fallback until all encrypted stores are verified under the DEK. Ambiguous metadata causes a controlled recovery error, never a blank database.
- **Portability boundary:** the password wrapper is portable with FormEase data and a known password. The OS recovery protector is intentionally bound to the same OS account/device; a copied database or changed OS profile cannot use password-recovery alone and must use the known password or a valid FormEase backup.

### Cryptographic building block

- **Files changed:** `app/src/utils/db-crypto.ts`, `app/src/utils/db-crypto.test.ts`.
- **Implemented:** A random, exportable AES-GCM DEK can be wrapped/unwrapped with an AES-GCM KEK. The envelope is versioned (`dek-v1`) and malformed metadata is rejected.
- **Tests:** 2 passed — correct KEK continuity and wrong/corrupt KEK-envelope rejection.
- **Not yet integrated:** account creation/login/change/recovery, Electron recovery-secret storage, legacy migration markers, data migration verification, and fail-closed decryption UI. These remain mandatory before release readiness.

## Test status

- First-stabilization focused regression suite: **22 passed, 4 files**.
- DEK cryptographic unit suite: **2 passed, 1 file**.
- Full test suite, final production build, Windows/macOS builds, CI release gate, synthetic snapshot fixture, and password-recovery continuity are **not yet passed**. No release is authorized.

## DEK migration and desktop recovery protector (implemented, pending broader release gates)

- **Problem:** A v3.5.17 password-derived record key meant that a password reset could replace the credential hash while permanently orphaning encrypted IndexedDB records. Password rotation also rewrote records without a durable state machine or completion verification.
- **Root cause:** The password was both the login secret and database encryption key. There was no independent recovery-protected key, migration version marker, or restart-safe credential/wrapper transaction.
- **Files changed:** `app/src/utils/db-crypto.ts`, `app/src/utils/encryption-migration.ts`, `app/src/services/database.ts`, `app/src/stores/auth-store.ts`, `app/electron/main.cjs`, `app/electron/preload.cjs`, `app/src/electron.d.ts`, and focused tests.
- **DEK model:** New installations generate a random AES-256-GCM DEK. `formease-db-key-envelope-v1` stores only DEK-v1 metadata: a password-KEK-wrapped DEK, a non-secret SHA-256 DEK fingerprint, recovery-protector availability, encryption schema version, and durable migration state. The raw DEK is never written to local storage.
- **Recovery protector:** Electron main process protects the same base64-encoded 32-byte DEK with `safeStorage` and writes only its OS-protected ciphertext to `formease-db-recovery-dek-v1.enc` under Electron user data. The preload bridge exposes only availability, protect-a-validated-DEK, and recover-that-DEK operations—no arbitrary safe-storage or filesystem operation. The security answer is authorization only; it is never a KEK.
- **Legacy migration:** After successful normal authentication, the legacy password key remains in memory as a temporary decrypt fallback. The DEK is prepared and protected, then every currently encrypted store (`students`, `classRecords`, `enrollments`, `attendanceRecords`, `sf2Sheets`, `gradingSheetRecords`, `observedValues`, and `automated_backups`) is read, re-encrypted under the DEK, and re-read with the DEK alone. Record counts and primary identifiers (`lrn`/`id`) must match before state becomes `migrated`.
- **Migration states:** `legacy` is represented by absent metadata. Durable metadata states are `migration_prepared`, `migration_in_progress`, `migration_verifying`, `migrated`, and `migration_failed_recoverable`. A restart at a prepared or failed checkpoint resumes with the password-derived legacy key plus the DEK; it never creates or selects a blank database. Index-projection migration is deliberately suppressed while encryption migration owns record writes, avoiding concurrent re-encryption work.
- **Credential transaction:** Password change and approved recovery write a local journal containing both complete credential/wrapper pairs. On next login, the persisted credential hash determines whether the old pair is restored or the new pair is completed. Post-migration password change rewraps the same DEK and does not rewrite record ciphertext. Recovery verifies the protected DEK fingerprint before replacing the password wrapper.
- **Failure behavior:** Missing/corrupt/mismatched wrapped metadata, unavailable/corrupt OS recovery material, or failed verification produce controlled errors and leave records untouched. Browser, test, or platforms without `safeStorage` may create/use a password wrapper but cannot perform data-bearing password recovery; no plaintext recovery fallback exists.
- **Device-transfer boundary:** The password wrapper remains usable only with the known password and application data/salt. Electron `safeStorage` is intentionally tied to the OS account/device; copied application data, a changed OS profile, or a different computer cannot use security-answer recovery and must use the known password or a verified FormEase backup. Existing JSON backup behavior is otherwise unchanged.
- **Focused tests:** `db-crypto.test.ts` covers correct, incorrect, and corrupt key wrapping. `encryption-migration.test.ts` injects interruption after DEK generation, password-wrapper creation, recovery-protector creation, `migration_prepared`, `migration_in_progress`, `migration_verifying`, and immediately before the completion marker. Before durable metadata, only a harmless OS-protected orphan recovery blob can exist; after metadata, every restart completes deterministically. It also creates synthetic v3.5.17-style encrypted records, migrates them, and verifies DEK-only reads. `authMasterPassword.test.ts` covers new-account setup, wrapper-only password change, same-DEK recovery, bad legacy/factory credentials, and corrupt recovery material with original-password continuity.
- **Known limitations / remaining risk:** The integration migration test uses a synthetic database adapter rather than the browser's actual IndexedDB implementation; an Electron/IndexedDB end-to-end fixture remains a mandatory later release gate. Real OS safe-storage behavior is platform-bound and cannot be fully exercised in the current browser test runtime. The app still has the pre-existing Firebase offline test warnings. No production database, backup, credential, or release artifact was modified.
- **Verification on 2026-09-22:** 40 targeted tests passed across seven files (the new crypto, migration, and authentication coverage plus the prior 22 stabilization assertions); `npx tsc -b --pretty false`, `node --check electron/main.cjs`, and `git diff --check` passed. No release, tag, push, installer build, or production-data operation was performed.

## Real IndexedDB migration persistence gate

- **Problem:** Earlier migration coverage used a synthetic adapter and could not prove browser-style persistence, database close/reopen behavior, per-store transaction boundaries, or backup portability.
- **Files changed:** `app/package.json`, `app/package-lock.json`, `app/src/services/dek-indexeddb-migration.test.ts`, and `app/src/utils/encryption-migration.ts`.
- **Fixture:** `fake-indexeddb` is a test-only, standards-compatible IndexedDB implementation. Each test installs an isolated `IDBFactory`; it cannot open, enumerate, or modify the developer's actual FormEase database. It seeds only `FORMEASE MIGRATION TEST SCHOOL` / `999999` and fake learner identifiers.
- **Persistence coverage:** The fixture creates genuine v3.5.17-style AES-GCM envelopes via the production database service with only the password-derived legacy key and no DEK metadata. It invokes the same authentication login path and production migration coordinator, closes/reopens the database, clears in-memory keys, then proves password-KEK → wrapped-DEK access works without the legacy fallback. Meaningful profile, learner, section/subject, enrollment, grade, HPS, attendance, SF2, observed-value, and automated-backup fields are asserted.
- **Actual interruption coverage:** A persisted migration is interrupted after its in-progress metadata, after the first store transaction, before verification, during verification, and immediately before the final marker. Every case closes/reopens IndexedDB and resumes deterministically. The after-first-store case proves a mixed state (students DEK-encrypted while class records remain legacy-encrypted) and then completes safely.
- **Transaction boundary:** Encryption migration uses one `putRecordsBulk` IndexedDB transaction per store. A mid-store partial write cannot persist under this implementation; interruption is only observable between committed store transactions. Durable state and the temporary in-memory legacy fallback make those mixed-store boundaries resumable.
- **Password/recovery corruption coverage:** Password change leaves raw record envelopes unchanged and preserves the DEK fingerprint. A corrupt recovery protector blocks recovery while normal password login remains valid. A corrupt password wrapper blocks password login but the valid recovery protector repairs the wrapper without rewriting records.
- **Backup portability:** `db.exportAllData()` exports decrypted logical data; it does not include credentials, DEK metadata, or Electron recovery-protector material. It restores into a clean synthetic IndexedDB database under a newly generated destination DEK. The supported importer adds its existing empty `student_section` compatibility default; learner identity, relationships, grades, attendance, SF2 metadata, and collection counts remain intact. Internal `automated_backups` retention metadata is intentionally not part of this portable backup payload.
- **Remaining risk:** This validates browser-compatible IndexedDB persistence, not Electron's live OS `safeStorage` implementation. The production bridge remains syntax-reviewed and its renderer surface is narrow/validated, but a signed Electron-process integration test requires a separately isolated Electron harness. Firebase offline warnings remain expected in local auth tests.
- **Verification on 2026-09-22:** The encryption/persistence gate passed **49 tests across 8 files**, combining the 9 persistent IndexedDB cases with all previous 40 focused auth, crypto, migration, backup, SF2/attendance, and grading assertions. `npx tsc -b --pretty false` and `node --check electron/main.cjs` passed. The test command emits expected wrong-key decryption and Firebase-offline warnings, but no test failed.
