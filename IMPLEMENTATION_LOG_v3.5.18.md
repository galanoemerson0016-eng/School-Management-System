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
- **Checkpoint:** `a8d15dc` (`test(auth): validate DEK migration against persistent IndexedDB`) is local only. It has not been pushed, tagged, deployed, or released.

## Grade sync manual-override reporting

- **Problem:** Batch E-Class synchronization could bypass the existing single-record manual-override guard, and users received no count of protected manual grades.
- **Root cause:** `bulkUpdateGradingSheetRecords` replaced matching records without applying grade provenance checks.
- **Files changed:** `app/src/stores/slices/grading-slice.ts`, `app/src/pages/ConsolidatedGradesPage.tsx`, and `app/src/stores/slices/grading-slice.test.ts`.
- **Fix:** Batch E-Class updates now leave matching `manual_override` records untouched and return an `{ updated, skippedManualOverrides }` result. Both teaching-load and single-subject sync notifications explicitly report preserved overrides.
- **Tests:** Grading-slice focused suite: 8 passed. TypeScript validation passed.
- **Migration implications:** None; existing manual overrides are preserved rather than replaced.
- **Remaining risk:** The UI notification paths are covered through their returned result contract, not an end-to-end rendered-page test.

## Release workflow validation and staged-publication gate

- **Problem:** The prior release workflow accepted any `v*` tag without proving it matched the packaged application version; its required update-server and licensing deployments ran after both GitHub releases and suppressed their own failures with `continue-on-error`. An installer build could also reach asset patching and publication without a dedicated cross-platform artifact-completeness check.
- **Root cause:** The release job relied on step ordering rather than explicit job dependencies and did not distinguish required production services from the optional Google Drive mirror. Manual dispatch also had no explicit tag input, so a branch ref could be used accidentally.
- **Files changed:** `.github/workflows/release.yml`, `app/package.json`, `app/scripts/check-tag-version.cjs`, and `app/scripts/check-tag-version.test.ts`.
- **Fix:** Both platform jobs now check repository version consistency and require an exact `v<package-version>` tag before tests or packaging. Manual releases require `release_tag`, all checkouts/releases use that input when supplied, and `release-deploy` requires successful macOS and Windows jobs. The deploy job verifies mandatory Windows (`.exe`, `latest.yml`) and macOS (`.dmg`, `.zip`, `latest-mac.yml`) artifacts before metadata patching. It stages private and public GitHub releases as drafts, runs required update-server and licensing-portal deployment/build gates, then uses the GitHub API to publish those verified drafts. Google Drive remains an explicitly optional mirror and is the only tolerated release-workflow failure.
- **Tag/package validation:** `validateReleaseTag` is a pure checker plus a CLI wrapper. Its deterministic test cases cover valid `v3.5.18` / `3.5.18`, mismatches `v3.5.18` / `3.5.17` and `v3.5.19` / `3.5.18`, and malformed tags. The current package remains `3.5.17` by instruction; direct CLI checks therefore pass for `v3.5.17` and fail non-zero for `v3.5.18`, `v3.5.19`, and malformed input.
- **Required vs optional:** Required: tag/version checks, application tests, platform builds, artifact verification, metadata patching, Firebase CLI installation, update-server deployment, licensing-portal dependency installation/build/deployment, and publication of each staged GitHub release. Optional: the post-publication Google Drive mirror (`continue-on-error: true`), which may be stale/unavailable without making the primary releases invalid.
- **Tests and validation:** `npm test -- scripts/check-tag-version.test.ts` passed (7 assertions); `npm run release:check` passed for `app/src/stores/update-store.ts`, `VERSION_HISTORY.md`, and `app/src/pages/SettingsPage.tsx`; direct checker CLI success/failure cases passed; `node --check scripts/check-tag-version.cjs`, Bash syntax validation for the Ubuntu artifact verifier, TypeScript project validation, YAML parsing, static workflow-gate validation, and `git diff --check` passed.
- **Publication behavior / remaining risk:** No public GitHub release is created until both platform jobs, artifact verification, and required Firebase deployments have succeeded. Drafts provide a recoverable staging boundary if a required deployment fails. External GitHub and Firebase operations cannot be made transactionally atomic: after update metadata deploys and before the final draft-publication API call, a client can briefly observe metadata that points at a non-public draft. If the final publication call fails, no installable unvalidated release is exposed, but that metadata can be temporarily unavailable until the operator resolves the failed workflow. Google Drive can also lag by design.
- **Migration implications:** None. This changes CI release orchestration only; it does not touch learner records, backups, credentials, licensing data, or production databases.
- **Release status:** **v3.5.18 — NOT RELEASE READY.** Full regression, dependency audit, production build, Windows packaging, and final version preparation remain mandatory gates.

## Updater publication consistency: immutable staging with GitHub latest-pointer promotion

- **Problem:** The previous staged-draft workflow still deployed `updates/latest*.yml` to Firebase before publishing the matching public GitHub release. A failed final publish could leave clients pointed to a draft they could not download.
- **Root cause:** `patch-metadata-ci.cjs` wrote patched metadata directly to the live update-server and licensing-portal metadata locations. The desktop application is configured to use `https://formease-licensing.web.app/updates`; that hosting configuration redirects `latest.yml` and `latest-mac.yml` to the public `FormEase-Releases` repository's GitHub Release `latest` assets.
- **Files changed:** `.github/workflows/release.yml`, `app/scripts/patch-metadata-ci.cjs`, and `app/scripts/patch-metadata-ci.test.ts`.
- **Fix / feasible model:** The patching script now writes versioned, immutable copies only to `updates/staged/v<package-version>/` for both hosting projects, while leaving the existing live `updates/latest*.yml` pointers untouched. Release artifacts—including patched `latest.yml` and `latest-mac.yml`—are uploaded to non-public GitHub drafts. Required hosting deployments publish only the staged paths. Only the successful public GitHub draft publication advances the GitHub Release `latest` pointer used by the desktop updater. The public-release API step then requires both metadata assets and verifies the public release page is reachable.
- **Validation:** Isolated synthetic-artifact test passed (1 test): it verifies versioned staged URLs and recalculated SHA-512 values while proving both live metadata files remain byte-for-byte unchanged. Existing tag-check suite remains green (7 tests). Script syntax, TypeScript validation, YAML parsing, workflow ordering assertions, and `git diff --check` passed.
- **Publication behavior / remaining risk:** This eliminates the inaccessible-draft pointer failure mode for the configured desktop updater path. GitHub's public-release transition is the live pointer switch, so release assets and updater metadata become available together. The two Firebase hosting projects may still expose staged, version-specific files at non-advertised URLs; these do not affect clients. As with any external deployment, a post-publication optional Google Drive mirror can lag. If a legacy client is hardcoded to query the update-server host rather than the configured licensing-portal URL, it will continue to see its previous live metadata until a separately controlled migration; no such source configuration exists in this repository.
- **Migration implications:** None. The change affects CI release orchestration and hosted staging paths only; it does not modify local databases, learner data, backups, credentials, or production infrastructure during validation.

## Release-validation hygiene and dependency audit

- **Problem:** Two repository tests contained developer-machine/client-specific assumptions: an opt-in snapshot test named a local backup path and asserted client identifiers/counts, while an SF9 renderer test conditionally wrote a PDF to a personal IDE directory and used real-looking learner identity data. The optional Google Drive script also probed a personal Downloads credential-file path.
- **Files changed:** `app/src/testing/test-client-snapshot-restore.test.ts`, `app/src/testing/g11AcademicSf9Renderer.test.ts`, and `app/scripts/sync-gdrive-release.cjs`.
- **Fix:** The snapshot diagnostic now runs only when `FORMEASE_CLIENT_SNAPSHOT_PATH` is explicitly supplied and uses generic structural assertions. The SF9 renderer test keeps all PDF validation in memory and uses clearly synthetic learner/adviser data. Google Drive credentials are accepted only through declared environment variables; without them, the optional sync exits successfully without reading any local credential file.
- **Tests:** Targeted renderer/snapshot run: **1 file passed / 1 file skipped; 12 tests passed / 5 skipped**. The five skips are an acceptable opt-in developer diagnostic, not a mandatory release protection. All encryption migration, recovery, restore, SF2, grade-integrity, RBAC, and release-tag protections remain active (not skipped). No `.only` occurrences were found.
- **Path/privacy scan:** No remaining personal absolute path was found in application source/tests after cleanup. Filename-only secret scanning found no tracked production backups, private certificates, or credential files; potentially sensitive configuration references are limited to code that reads environment variables or documented Firebase configuration. No secret values are recorded here.
- **Dependency audit:** `npm audit --json` reported **10 vulnerabilities: 2 high, 8 moderate, 0 critical**. High: direct production `xlsx` (prototype-pollution and ReDoS advisories; npm reports no fixed version). Moderate: direct `exceljs` via nested `uuid`, plus build/deployment-only `firebase-tools` through `@google-cloud/pubsub`, `@opentelemetry/core`, `csv-parse`, `gaxios`, `stream-json`, and `uuid`; npm suggests only a semver-major downgrade for some chains, which is not an acceptable hotfix. The audit remains a release-readiness risk requiring an explicit mitigation/acceptance decision; no compatibility-risking dependency change was made.
- **Release status:** **v3.5.18 — NOT RELEASE READY.** The configured full Vitest command was started from the corrected branch but this local runner failed to emit a final aggregate summary/exit record. The normal production-build command likewise did not return a completion summary through the local execution channel. Neither result is recorded as passing.

## Dependency reachability decision: XLSX

- **Audit identifiers:** `xlsx` is directly shipped at `0.18.5`. `npm audit` reports GHSA-4r6h-8v6p-xvw6 (prototype pollution; affected `<0.19.3`) and GHSA-5pgg-2g8v-p4x9 (regular-expression denial of service; affected `<0.20.2`). npm reports no fixed release.
- **Reachability:** This is not export-only. `XLSX.read` / `sheet_to_json` process user-selected workbooks in the enrollment template flow, SF1 parser, Consolidated Grades import, and master-workbook import UI; the accepted UI extensions include `.xlsx`, `.xls`, and, in some flows, `.csv`. The repository also uses the library extensively for exports and reads bundled DepEd templates, but those trusted paths do not eliminate the untrusted-import exposure.
- **Decision:** **RELEASE BLOCKER.** No file-size cap, content-structure limit, isolated parser, or complete untrusted-input validation layer was demonstrated across the reachable import paths, and a library migration cannot be safely completed during this stabilization cycle without broad DepEd workbook compatibility regression coverage. v3.5.18 must not be prepared or published until the import boundary is hardened and/or a supported dependency remediation is validated.
- **Deferred remediation:** v3.6.0 must inventory all workbook imports, enforce bounded file size and workbook complexity before parsing, reject unsupported content deterministically, avoid trusting parsed object properties, and evaluate a maintained parser replacement or vetted fork with full import/export fidelity regression tests.
- **Other audit classification:** `exceljs` reaches a vulnerable nested `uuid` but is used primarily for trusted bundled-template reads and generated exports; it remains a moderate risk requiring a separately tested dependency plan, not a justification for a hotfix downgrade/upgrade. `firebase-tools` advisory chains are development/deployment tooling only; they are not shipped in the Electron runtime, but their moderate advisories must be addressed in deployment-tool maintenance.

## SheetJS CE upgrade and workbook-reader hardening (in progress)

- **Dependency source:** Replaced npm `xlsx@0.18.5` with the official exact SheetJS CE tarball `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`. `package.json`, lockfile, Node resolution, and `npm ls` resolve `xlsx@0.20.3`.
- **Direct SheetJS inventory:** `database-rescue-export.ts` and `excel-export.ts` use SheetJS only to create downloads. `excel-import.ts`, `enrollment-template.ts`, `sf1-parser.ts`, and `ConsolidatedGradesPage.tsx` process user-selected files; all now use the shared bounded reader. `ConsolidatedGradesPage.tsx` and `enrollment-template.ts` also create downloads. Grade 1 master import uses ExcelJS rather than SheetJS, and its modal now enforces the same pre-read size boundary.
- **Security evidence:** The direct parser test confirms `XLSX.version === 0.20.3` and verifies that parsing a synthetic crafted workbook does not add attacker-controlled inherited properties. ReDoS proof-of-concept execution is deliberately not run because it could make CI non-terminating; version remediation is verified instead.
- **Reader boundary:** `safe-workbook-reader` limits user files to 20 MB, rejects empty/non-Excel signatures while preserving legacy OLE `.xls` support, limits workbooks to 64 worksheets, and uses `WTF: false`. Generic Excel imports, enrollment, SF1, and consolidated-grade imports now use it; their existing domain validation remains responsible for LRN, header, grade, and persistence checks.
- **Focused validation:** SheetJS security, Grade 1 import, and database-rescue export suites passed **16 tests across 3 files**. The upgrade removes the two former `xlsx` high findings; production-only audit is now **1 high / 2 moderate**, attributable to transitive `brace-expansion` and `exceljs`/`uuid`, not SheetJS.
- **Status:** XLSX remediation is promising but **not yet classified resolved**. Remaining gates are synthetic compatibility coverage for every user-workbook importer, the broader official-export matrix, deterministic full-suite completion, and production-build completion.

## CSV compatibility at the hardened workbook boundary

- **Problem:** Both the Enrollment Template and SF1 user interfaces explicitly accept `.csv`, but the new binary workbook-signature guard only allowed `.xlsx` and legacy OLE `.xls` input. That would have silently broken a documented CSV import path.
- **Root cause:** The hardened reader accepted only `ArrayBuffer` data, while the prior SheetJS parser accepted CSV data through its broader binary-read behavior.
- **Files changed:** `app/src/utils/safe-workbook-reader.ts`, `app/src/utils/enrollment-template.ts`, `app/src/utils/sf1-parser.ts`, `app/src/utils/safe-workbook-reader.test.ts`, `app/src/utils/enrollment-template.test.ts`, and `app/src/utils/sf1-parser.test.ts`.
- **Fix:** The shared reader admits text only through an explicit `allowCsv` option. Enrollment and SF1 select that option solely for files named `.csv` and read those files as text; `.xlsx`/`.xls` remain subject to the Excel-signature check. The 20 MB pre-read cap, 64-sheet cap, `WTF: false`, and each importer's existing header/domain validation continue to apply.
- **Tests added:** Synthetic CSV Enrollment imports preserve LRN/name/gender normalization. Synthetic CSV SF1 imports preserve learner identity, date, age, address, mother tongue, and IP values. Reader tests cover valid XLSX, explicit CSV opt-in, prohibited text input, invalid binary signatures, excessive sheet counts, empty files, and oversize files.
- **Tests passed:** `npm test -- src/utils/safe-workbook-reader.test.ts src/utils/enrollment-template.test.ts src/utils/sf1-parser.test.ts src/utils/sheetjs-security.test.ts src/services/sf9-g1-excel-import.test.ts` — **5 files / 10 tests passed**. Previously, the ECR export suite passed **1 file / 32 tests**, Grade 2 SF9 export passed **1 file / 4 tests**, Grade 3 SF9 export passed **1 file / 4 tests**, and Grades 4–10 SF9 export passed **1 file / 7 tests** after the SheetJS migration.
- **Tests inconclusive:** A combined broad-export command and the Grade 11 Academic export command did not return a final Vitest exit summary through the local execution channel. They are not recorded as passing. The TypeScript build command similarly provided no final exit record and remains a release gate.
- **Migration implications:** None. This restores already advertised CSV compatibility and does not change persisted data, records, templates, or backup formats.
- **Remaining risk:** UI-level file-picker integration is covered through parser behavior rather than a rendered page test. The remaining Grade 11/12, SHS, and final deterministic full-suite/build gates must complete before the SheetJS finding can be classified resolved or any release considered.

## v3.5.17 missing-record incident corrective work (in progress)

- **Problem:** Schools reported apparently missing learners and records after the public v3.5.17 update.
- **Verified root cause:** The `v3.5.16` → `v3.5.17` diff added production-only filtering of students with `999*` LRNs and test-looking values, then added startup persistence deletion for unmatched `TEMP-*` class and grading records. The older Einstein utility also deleted sections/learners/related records by a generic name match. A learner-form duplicate path could silently delete an Einstein-labelled learner. These are unsafe criteria for real school data.
- **Files changed:** `app/src/stores/app-store.ts`, `app/src/utils/grade-reconciliation.ts`, `app/src/utils/ghost-data-purge.ts`, `app/src/components/students/StudentForm.tsx`, `app/src/utils/testSectionGuards.ts`, `app/src/utils/testSectionGenerator.ts`, `app/src/types/index.ts`, `app/src/stores/update-store.ts`, `app/src/components/updates/ReconciliationReportModal.tsx`, and focused tests.
- **Fix:** App startup no longer filters or deletes test-looking sections/learners/grades, invokes no Einstein purge, and performs no persistent duplicate-subject deletion. Temporary grade records remain available for repair rather than being removed. The learner form now treats every duplicate as a normal duplicate and never silently deletes it. Test-data cleanup now requires the explicit `is_test_data: true` marker; generated fixtures write that marker to their section, learner, subject, HPS, and grade records. The legacy Einstein identifier is diagnostic-only; its compatibility wrapper preserves every record.
- **Recovery:** The update pipeline now fails if the mandatory local pre-update JSON backup or recovery-state write reports failure. On launch, a checksum-verified `SMS_Backup_Comprehensive_preupdate_3.5.17_*.json` backup produces a prominent, explicit restore prompt with backup/current counts. It never auto-restores or overwrites current data. Corrupt, unchecksummed, and wrong-version backups are not offered through this incident-recovery flow.
- **Tests:** Focused incident suite passed: **37 tests across 5 files**; the existing opt-in client snapshot diagnostic remains skipped (**5 skipped tests**). Coverage proves `999*`, `TEMP-*`, and ordinary Einstein-labelled records are not classified as test/ghost data or deleted; validates explicit test markers; and verifies checksum-gated v3.5.17 recovery-backup discovery.
- **Migration implications:** `is_test_data` is optional and does not alter existing records. Existing `999*`, `TEMP-*`, Einstein-labelled, and legacy demo-ID records are retained rather than purged. Recovery is user-confirmed replacement from a verified backup, not an automatic data migration.
- **Remaining risk:** The targeted TypeScript project check now passes. The full test suite, real Electron updater/backup/restore journey, production build, packaging, and broader release gates remain mandatory. The package is still `3.5.17`; do not tag, deploy, or publish until all v3.5.18 gates pass.

## v3.5.17 recovery end-to-end data-retention gate

- **Problem:** The earlier focused checks proved individual guard and recovery behaviors, but did not prove that a complete pre-update backup retains every affected grade record and survives the real restore-and-startup sequence. During that journey, the production backup exporter still excluded `TEMP-*` grade records whose learner was absent.
- **Root cause:** `createComprehensiveBackup` applied the same unsafe orphan heuristic that had previously led to startup data loss, removing those grade records from both the backup payload and its summary.
- **Files changed:** `app/src/utils/backup-restore.ts`, `app/src/stores/app-store.ts`, `app/src/stores/update-store.ts`, `app/src/utils/ghost-data-purge.ts`, `app/src/stores/v3517-recovery.integration.test.ts`, `app/src/testing/ghostEinsteinPurge.test.ts`, and `app/src/testing/test-client-snapshot-restore.test.ts`.
- **Fix:** Comprehensive backups now retain all class and grading-sheet records. Startup also no longer writes an empty `schoolProfile.section` solely because its value is `Einstein`.
- **Tests added:** The isolated IndexedDB recovery journey seeds a real `999*` learner in an `Einstein` section plus an unmatched `TEMP-*` grade; creates a checksum-protected v3.5.17-style backup; simulates data loss; discovers that verified backup; restores with the production importer; runs production store initialization; and proves the learner, section, normal grade, and temporary grade persist in the database and application store.
- **Tests passed:** The new end-to-end test passed (**1 file / 1 test**). The expanded incident regression set passed (**6 files / 38 tests**, with the existing opt-in client snapshot diagnostic skipped: **1 file / 5 tests**). `npx tsc -b --pretty false` completed successfully.
- **Migration implications:** Backup schema is unchanged. New backups retain records that older releases incorrectly omitted; existing backups remain import-compatible. No user database or backup was read or changed during validation.
- **Remaining risk:** This is an isolated browser-compatible IndexedDB fixture, not an installed Electron update. Full-suite completion, TypeScript/build completion, packaging, and real updater validation remain mandatory release gates.

## Post-recovery release-gate verification

- **Commands verified:** `npx tsc -b --pretty false`, `npx vite build`, and the complete `npm test` suite from `app/`.
- **Result:** TypeScript completed successfully. Vite completed successfully in **52.38 seconds** after transforming 3,799 modules. The full Vitest suite completed successfully in **167.29 seconds: 97 files / 844 tests passed; 1 opt-in diagnostic file / 5 tests skipped**.
- **Warnings:** The full suite emitted repeated jsdom “navigation not implemented” messages from browser-link behavior. Vitest returned exit code zero and no test failed, but suppressing or explicitly mocking that behavior is a non-release-blocking test-hygiene follow-up.
- **Data impact:** The generated `app/dist/` directory is ignored; no tracked file, local database, backup, credential, or user-generated file was changed by these checks.
- **Release status:** **v3.5.18 remains NOT RELEASE READY.** Local Windows packaging and a real isolated updater/recovery validation remain mandatory; package version preparation and publication remain prohibited until those gates pass.

## Isolated Windows packaging attempt

- **Safety boundary:** The repository's normal packaging script would copy over historical installers and metadata in `release/` and `app/release/`. Those existing artifacts were left untouched. Packaging was invoked directly with a new output directory under the system temporary folder, without the copy-to-root script and without publication.
- **Result:** `electron-builder --win` rebuilt native dependencies, downloaded/extracted Electron, and entered dependency processing for the temporary `win-unpacked` directory. It produced no installer, blockmap, or update metadata and did not advance after several bounded checks; the verified temporary process tree was stopped. The incomplete temporary directory was deliberately retained for later inspection rather than deleted.
- **Data impact:** No tracked file, existing installer, release metadata, local database, backup, credential, or user-generated file changed. The working tree remained clean.
- **Follow-up diagnosis:** The same packaging command with `--dir` and `--publish never` was allowed to complete in a second new temporary directory. Electron Builder returned exit code zero and produced a 223,834,112-byte unpacked `FormEase Pro.exe`. The long phase was its CPU-bound `npm list --include prod --include optional --omit dev --json --long` dependency-graph collection, not a hang.
- **Remaining risk:** Unpacked Windows application assembly now passes. A full NSIS installer, isolated packaged-app recovery journey, and the separate release-artifact workflow remain mandatory. Do not use the release-copy script until existing artifact ownership and overwrite behavior are explicitly approved.

## Isolated packaged-app launch gate

- **Problem:** A packaged-app test cannot be considered safe merely because it was built in a temporary folder; Electron normally resolves `userData` to the real per-user application profile.
- **Files changed:** `app/electron/main.cjs` and its generated `app/dist-electron/` runtime files.
- **Fix:** Added an opt-in `FORMEASE_TEST_USER_DATA_DIR` startup hook before Electron initializes logging, sessions, or user-data paths. It redirects only that process's `userData` and `sessionData` locations; normal installations remain unchanged unless the environment variable is explicitly supplied.
- **Validation:** Syntax check passed. A newly assembled unpacked Windows package launched successfully with the hook set to a fresh temporary directory. Its visible process title was `FormEase Pro`; its `backups`, `logs`, `session-data`, and lockfile were created under the synthetic directory, not the real profile. The synthetic process was then stopped.
- **Data impact:** No real database, backup, license, credential, user-generated file, historical installer, or release metadata was opened or changed.
- **Remaining risk:** This proves isolated packaged startup, not an end-to-end click-through restore prompt in Electron. The existing isolated IndexedDB recovery journey remains green; a scripted packaged recovery fixture and full NSIS installer still remain release gates.

## Local v3.5.18 version preparation

- **Files changed:** `app/package.json`, `app/package-lock.json`, `VERSION_HISTORY.md`, `app/src/pages/SettingsPage.tsx`, `app/src/components/settings/VersionHistoryTimeline.tsx`, and the recovery integration fixture.
- **Fix:** Local package/version metadata and visible release notes now identify v3.5.18 and accurately describe the data-integrity protections. The recovery fixture uses the production backup type safely.
- **Tests passed:** v3.5.18 tag consistency check passed; isolated recovery journey passed (**1 file / 1 test**); TypeScript project validation completed successfully.
- **Release status:** Local preparation only. No GitHub tag/release, push, deployment, updater metadata upload, or public artifact was created.
