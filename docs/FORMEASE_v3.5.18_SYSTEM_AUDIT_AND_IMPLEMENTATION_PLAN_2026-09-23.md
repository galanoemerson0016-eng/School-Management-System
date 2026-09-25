# FormEase Pro v3.5.18 — system audit and implementation plan

Audit date: 23 September 2026 (Asia/Manila). Implementation continuation authorized later that day. Status: **NOT RELEASE READY**. Current local progress and remaining gates are recorded in `IMPLEMENTATION_LOG_v3.5.18.md`; the baseline and evidence below describe the audit state before those fixes.

## 1. Decision and immediate next step

The local installer is a test candidate, not a completed data-integrity release. Previous work removed important record-hiding/deletion paths, but this review found additional failures in backup verification, restoration, encryption continuity, and update shutdown. A successful build or passing existing tests does not cover these failures.

Continue on `fix/v3.5.18-data-integrity`. First isolate tests from real user files, then repair the backup/restore safety chain. Do not publish, deploy, upload updater metadata, tag, push, or distribute this installer to teachers until the gates below pass and the owner explicitly authorizes publication.

This document supplements the user's original implementation plan and later SheetJS/full-suite requirements; it does not relax them. The latest request authorizes this audit and plan, not implementation of newly discovered fixes. No application code was changed during this audit.

For an affected teacher, do not promise that a backup exists or that every missing record is recoverable. Do not recommend restoring over their only current profile, especially in the old affected application. Preserve the closed application's profile and original backups first, with consent; investigate only a separate working copy in a validated recovery environment. New work entered after a backup must be identified before any replacement. Copying an Electron profile is not proof that OS-protected encryption keys will work on another computer.

## 2. Verified local baseline

| Item | Observed state |
| --- | --- |
| Primary working directory / Git root | `C:\Users\Emerson\Desktop\FormEase Pro` |
| Branch | `fix/v3.5.18-data-integrity` |
| HEAD | `877beb2172d614891adf0eb340c43b67b5222a49` |
| Origin | `https://github.com/galanoemerson0016-eng/School-Management-System.git` |
| Application package | `form-ease-pro`, version `3.5.18` |
| Local Node / npm | `v24.12.0` / `11.6.2` |
| Installed app tools | Vite `7.3.6`; Vitest `4.1.11`; Electron `41.10.7`; electron-updater `6.8.9` |
| Installed app SheetJS | `0.20.3`, official CDN tarball in package and lockfile; runtime resolves inside the app's own dependencies |
| Important dependency distinction | Repository-root dependencies contain an extraneous `xlsx@0.18.5`. The inspected app resolution is `0.20.3`; root presence alone does not prove the old version is bundled. Audit root utilities separately; do not delete dependencies without approval. |
| Existing uncommitted changes | Three tracked generated files: [main.cjs](<C:/Users/Emerson/Desktop/FormEase Pro/app/dist-electron/main.cjs>), [preload.cjs](<C:/Users/Emerson/Desktop/FormEase Pro/app/dist-electron/preload.cjs>), [license.cjs](<C:/Users/Emerson/Desktop/FormEase Pro/app/dist-electron/license.cjs>). Preserved unchanged by this audit. |
| Untracked files at audit start | None reported by Git. This audit adds this plan document. |
| Inventory | 1,431 tracked files; 358 under app source; 95 source test files matched the `.test.ts` / `.test.tsx` inventory. Additional tests exist under scripts. |

`git status` was run before documentation edits. No branch was created because the requested branch already exists. No reset, stash, clean, deletion, checkout replacement, or commit was performed.

### Source versus generated and protected data

| Area | Purpose / treatment |
| --- | --- |
| [app/src](<C:/Users/Emerson/Desktop/FormEase Pro/app/src>) | React/TypeScript pages, state, database, authentication, reports, imports/exports, tests |
| [app/electron](<C:/Users/Emerson/Desktop/FormEase Pro/app/electron>) and [app/server.js](<C:/Users/Emerson/Desktop/FormEase Pro/app/server.js>) | Editable desktop main/preload/license code and mobile-attendance server |
| [app/scripts](<C:/Users/Emerson/Desktop/FormEase Pro/app/scripts>) | Build/release tooling and tooling tests; some scripts overwrite existing outputs or publish |
| [license-portal](<C:/Users/Emerson/Desktop/FormEase Pro/license-portal>) | Separate web application, Cloud Functions and security rules; no test script in its package |
| [update-server](<C:/Users/Emerson/Desktop/FormEase Pro/update-server>) | Hosting configuration and updater metadata; existing metadata is release-sensitive |
| [formease-mobile](<C:/Users/Emerson/Desktop/FormEase Pro/formease-mobile>) | Android-related directory; no top-level npm application manifest found. Do not treat this as a separately validated mobile app. |
| [workflows](<C:/Users/Emerson/Desktop/FormEase Pro/.github/workflows>) / root batch scripts | CI, deployment and alternative release entry points |
| [app/dist](<C:/Users/Emerson/Desktop/FormEase Pro/app/dist>) / [app/dist-electron](<C:/Users/Emerson/Desktop/FormEase Pro/app/dist-electron>) | Generated renderer/obfuscated runtime; runtime output is tracked and currently dirty |
| [release](<C:/Users/Emerson/Desktop/FormEase Pro/release>), [app/release](<C:/Users/Emerson/Desktop/FormEase Pro/app/release>), root installers | Existing artifacts; not disposable cleanup targets |
| Dependencies, [scratch](<C:/Users/Emerson/Desktop/FormEase Pro/scratch>), logs, generated exports | Not authoritative source. Scratch can contain user-derived files: do not inspect or delete indiscriminately. |
| Actual AppData profile, Desktop profile copy, real backups, credentials, licenses and learner files | Protected; not audit fixtures. Not opened or modified for this review. |

### npm scripts and configuration

The app defines: `dev`, `predeploy`, `deploy`, `build`, `test`, `test:watch`, `lint`, `preview`, `electron:dev`, `obfuscate:electron`, `electron:build`, `electron:build:mac`, `electron:build:win`, `sync:gdrive`, `release:check`, and `release:check-tag`.

- `test`: `vitest run`. [Test configuration](<C:/Users/Emerson/Desktop/FormEase Pro/app/vite.config.ts>) uses jsdom, the shared test setup, a 60-second test timeout, and excludes only dependencies. The privacy issue in F06 prevents an unrestricted local rerun now.
- `build`: `tsc -b && vite build`. Renderer version is injected from package metadata. TypeScript has separate app and tooling projects; Vite uses manual vendor chunks. No-emit checks are not a substitute for this production build.
- `lint`: `eslint .`. The fresh audit lint result below is specifically the `src` directory, not every root script.
- Electron packaging builds the renderer, regenerates obfuscated Electron files, invokes Electron Builder, and runs a copy-to-root script. Do not use this normal path while preserving existing artifacts. Future validation must use a fresh output directory and explicit `--publish never`.
- [Packaging configuration](<C:/Users/Emerson/Desktop/FormEase Pro/app/package.json>): Windows x64 NSIS, macOS x64/arm64 DMG/ZIP, generic updater endpoint. Signing is not forced. Uninstall is configured not to delete AppData.
- [Release workflow](<C:/Users/Emerson/Desktop/FormEase Pro/.github/workflows/release.yml>) uses Node 20, npm CI, both platform builds, draft staging, hosting deployment and eventual publication. Local Node differs: validate the chosen supported toolchain explicitly.

## 3. Evidence from this audit

| Check | Fresh result / limitation |
| --- | --- |
| Nested backup corruption reproduction | **Confirmed failure**: changing a synthetic student's name and grade still returns `valid: true` from the embedded checksum validator. Only in-memory synthetic objects were used. |
| Foreign encryption-salt reproduction | **Confirmed failure**: after replacing the synthetic salt, the same password can no longer unwrap the existing synthetic DEK wrapper. Uses actual crypto helpers and in-memory storage, not a user account. This proves the key-continuity hazard, not a full UI restore test. |
| Selected regression suite | **PASS: 5 files, 41 tests, 33.76 seconds, natural exit 0.** Covers DEK IndexedDB migration, backup import, backup restore, grade reconciliation and updater store. Existing assertions do not cover the new failures. |
| Test execution environment | Initial restricted run failed before loading tests because the compiler could not access its config. Approved rerun of only the selected synthetic tests completed. jsdom emitted a navigation warning; it did not fail the tests. |
| App TypeScript, no emit | **PASS, exit 0**, incremental output disabled |
| Tooling TypeScript, no emit | **PASS, exit 0**, incremental output disabled |
| Source lint | **FAIL: 343 files examined; 2 errors, 0 warnings, 0 parse failures.** Both are `prefer-const` in the application store at lines 1911 and 1918. Small issues, but not a green lint gate. |
| Electron main/preload and server syntax | **PASS, exit 0** |
| Version consistency | **FAIL, exit 1.** Updater fallback remains `3.5.17` at line 414 while the package is `3.5.18`. Production injection may supply the correct value; do not infer the installer necessarily reports the wrong version. |
| Candidate tag comparison | Pure comparison of `v3.5.18` with package version passes. **No tag was created or validated as an actual release ref.** |
| Git whitespace check | **PASS, exit 0** before documentation changes; rerun after saving this report |
| Online dependency audit | **INCOMPLETE.** Restricted request failed; approval reviewer rejected external transfer of private dependency metadata to npm. No vulnerability totals were obtained. Owner approval for that destination/data is needed before retrying. No audit fix/install was run. |
| Complete suite / production build / installer | Not rerun in this audit. Previous log records 97 files / 844 tests passed, 1 file / 5 tests skipped, and a Vite build of 52.38 seconds. These are historical results, not current end-to-end release certification. |
| Packaged recovery / actual OS secure storage | Not verified end-to-end. Prior isolated startup and fake-IndexedDB tests do not establish the complete Electron recovery journey. |

Fresh regression command, run inside the app:

```text
npm test -- src/services/dek-indexeddb-migration.test.ts src/utils/backup-import.test.ts src/utils/backup-restore.test.ts src/utils/grade-reconciliation.test.ts src/stores/update-store.test.ts
```

Record future commands with working directory, start/end time, actual process exit code, aggregate results, skipped-test reasons and commit SHA. A trailing successful command must not conceal an earlier failure. Do not use a forced successful exit to resolve a hanging suite.

## 4. Confirmed findings and required fixes

P0 means mandatory before any data-bearing recovery release. P1 means high priority, with the release impact stated explicitly. Evidence is distinguished from scenarios still needing an integration reproduction.

### F01 — P0: embedded checksum does not cover nested records

**Evidence/root cause:** [backup-integrity.ts:10](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/utils/backup-integrity.ts:10>) supplies top-level keys as the array replacer to `JSON.stringify`. That whitelist also applies inside nested objects. The reproduced serialized coverage was `{"metadata":{},"payload":{},"summary":{}}`. Changing nested learner/grade values did not change the accepted checksum. [Recovery discovery:36](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/stores/update-store.ts:36>) relies on this weak check to label a backup verified.

**Smallest safe fix:** Introduce an explicit checksum-format version and deterministic recursive serialization preserving array order. Use one validator in discovery, preview and execution. The separate `metadata.payloadHash` validator already covers nested payload data in [backup-restore.ts:444](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/utils/backup-restore.ts:444>), but recovery discovery does not call it. Reuse that validation where present; distinguish legacy weak checks from strong verification.

**Regression/acceptance:** Nested name, grade, attendance, SF10, count, array-order, truncation and deleted-field changes must fail; equivalent object-key ordering must be deterministic. Legacy backups remain readable with an honest verification status, not falsely rejected or silently upgraded. An unkeyed checksum detects corruption, not a malicious party able to replace both content and hash.

**Migration/risk:** New checksum metadata; no rewriting of old backups. Legacy weak-only files require structural/content review and explicit confirmation.

### F02 — P0: backup export turns read failures into valid-looking empty tables

**Evidence/root cause:** [exportFullDatabaseBackup:289](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/utils/backup-restore.ts:289>) catches every major table-read failure with `[]`. That output can be checksummed and saved by the updater as a successful safety backup. Independent reads can also capture inconsistent revisions if editing continues.

**Fix:** A required-table failure must fail the backup and block installation; distinguish an intentionally absent legacy store from an unreadable required store. Use a coherent snapshot after committed writes, validate decrypted content, persist atomically, read it back, and verify it before marking it safe. Return structured per-store errors, not learner data in logs.

**Regression/acceptance:** Inject read failure in every required store, wrong key, corrupt record, concurrent edit, disk-full/partial write, and readback mismatch. Each must leave the original database and existing good backups intact, and must not allow install readiness. A genuinely empty database must still back up correctly.

**Migration/risk:** No schema migration required merely to stop swallowing errors. Atomic backup-file handling must use new, confined temporary paths; never overwrite or clean real backups during development.

### F03 — P0: recovery bypasses review and uses a destructive non-atomic importer

**Evidence/root cause:** [Recovery modal:117](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/components/updates/ReconciliationReportModal.tsx:117>) labels the action “Review & Restore” but directly calls [rollbackToPreUpdateBackup:530](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/stores/update-store.ts:530>). That rereads the file and imports immediately, without a review dialog, execution-time integrity verification, or a new safety snapshot. [database.ts:704](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/services/database.ts:704>) clears all listed tables first, then restores them separately. Even an object-shaped invalid payload can reach clearing. A later failure leaves partial data.

The separate selective importer has better profile handling but still clears then writes, catches individual step failures, and proceeds. Fixing one import path does not fix the other. The legacy importer also fabricates a `300001` school identifier and clears the profile when it is absent; full school-year/settings continuity is not established.

**Fix:** Both entry points must use one restore orchestrator: parse/validate -> preview exact changes -> explicit selection/confirmation -> verified current-state snapshot -> staged restore -> atomic commit -> content verification -> reopen/restart verification. Stage asynchronous encryption before the write transaction. Use a restart-safe journal for settings outside IndexedDB; a single IndexedDB transaction alone cannot atomically update localStorage.

**Regression/acceptance:** Reject `{}`, wrong schema, corrupt checksum, duplicate IDs and invalid record types before any mutation. Test cancellation, absent versus explicitly empty collections, replace/merge/skip strategies, missing/placeholder school profile, all tables, school years, SF10 settings, quota errors, failure after each store, process interruption and restart. Failed restore must preserve the original state or recover deterministically before normal writes resume. No success alert after partial failure.

**Migration/risk:** Preserve legacy aliases and values. Orphaned/TEMP records are retained and reported, never dropped. Full replacement can discard newer work even when technically atomic: the UI must show that risk and provide an explicit recovery choice.

### F04 — P0: restore can replace the destination's encryption salt

**Evidence/root cause:** [Backup settings collection:149](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/utils/backup-restore.ts:149>) includes `formease-db-salt-v1`; [restoreBackupLocalStorage:166](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/utils/backup-restore.ts:166>) accepts every key supplied by the backup. [getDbSalt:49](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/utils/db-crypto.ts:49>) prefers that local value. [Authentication:275](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/stores/auth-store.ts:275>) uses the salt to unwrap the existing destination DEK. A foreign salt can therefore break next-login decryption, despite records appearing usable in the already-open session. The in-memory crypto reproduction confirmed this failure mechanism.

**Fix:** Ordinary data restore must preserve destination credentials, salt, DEK wrapper, OS recovery material, license state and credential journal. Enforce a restore-side allowlist, not only an export filter. Import portable decrypted record data under the destination key. Treat encrypted-profile recovery as a separate, explicitly designed workflow.

**Regression/acceptance:** Backup from synthetic profile A -> restore to differently keyed B -> logout -> cold restart -> same password opens all records. Repeat after password change and recovery. Tampered settings must not replace auth/session/license/recovery keys. Same-profile legacy backups remain usable. Test localStorage failures as part of F03.

**Migration/risk:** Keep old backup files unchanged. Do not “repair” this by replacing or generating production keys. Existing accounts already affected need diagnosis on a copy, not automatic key regeneration.

### F05 — P0: download completion can quit the app immediately

**Evidence/root cause:** [main.cjs:42](<C:/Users/Emerson/Desktop/FormEase Pro/app/electron/main.cjs:42>) calls `quitAndInstall(true, true)` on `update-downloaded`, while a second listener later sends the UI event. `autoInstallOnAppQuit` is enabled. The separate install IPC handler destroys windows; it is not a main-process verified-backup/write-commit gate. A backup taken before downloading does not cover edits made during the download.

**Fix:** One install state machine in the main process. Download completion means ready to review, not permission to close. Require user-approved install, committed writes, a fresh verified backup and a main-process readiness token before any install/quit path can proceed. Define “Later” behavior without bypassing those requirements.

**Regression/acceptance:** Download while editing; pending/failed writes; backup failure; normal close with cached update; duplicate events; direct IPC; restart and retry. No path may install while the safety gate is unmet. Validate actual packaged behavior against a local test update feed, never the production updater.

**Migration/risk:** No database migration. Existing downloaded updates and old pre-update markers require explicit state handling.

### F06 — P0 validation blocker: the default suite can read real teacher backups

**Evidence/root cause:** [SHS export test:634](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/services/shs-g12-excel-export.test.ts:634>) locates the user's actual AppData backup directory, loads the latest JSON, and writes a workbook into scratch. It silently returns if required real data/templates are missing. A separate client-snapshot diagnostic was previously made opt-in; this remaining test was missed.

**Fix:** Replace this test's real-data discovery with an explicitly synthetic fixture. Keep all outputs in a unique disposable test directory or memory. Add a guard preventing normal tests from opening user-profile backups, credentials or learner paths; disable external services in tests. Required fixtures missing in CI must fail, not return successfully. Check committed test fixtures for personal data before release without copying private files into Git.

**Regression/acceptance:** Complete suite runs without access to actual AppData and without the opt-in diagnostic environment variable. Confirm no user-derived scratch workbook is produced. All mandatory scenarios execute and report normal assertions.

**Migration/risk:** No user-data changes. Do not delete the existing scratch file or backups to make the test safe. Historical full-suite success is not proof that no private data was accessed; this audit did not investigate historical user-file contents.

### F07 — P0 safety primitive: successful requests are treated as committed writes

**Evidence/root cause:** Single-record put/delete/clear in [database.ts:397](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/services/database.ts:397>) resolve on request success, not transaction completion. The pending-write counter can fall before commit. Bulk paths wait for completion but lack an explicit abort handler. Missing stores can be reported as skipped success.

**Fix:** Resolve only on transaction completion; reject on error and abort; update write counters and success notifications after durable completion. Required stores must fail explicitly. Keep optional legacy-store handling explicit rather than generic success.

**Regression/acceptance:** Abort a transaction after a successful request; simulate quota/connection/version-change failures; verify rejected promises, no success notifications, correct write counts and no install/backup gate opening. Test close/restart immediately after a saved-record acknowledgment.

**Migration/risk:** No schema change needed. Carefully test call sites that depend on immediate UI updates; do not replace optimistic UI with silent data loss.

### F08 — P1, hotfix gate: decryption failure becomes an apparent domain record

**Evidence/root cause:** [decryptRecordIfNeeded:137](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/services/database.ts:137>) returns the raw encrypted envelope as `T` if no key exists or decryption fails. This can make records appear incomplete/invisible to downstream code and allow invalid exports. The dedicated migration validator is stricter, but ordinary reads do not share that behavior.

**Fix:** Normal reads must return a controlled locked/corrupt-data result or throw before domain processing. Preserve ciphertext unchanged. Block automatic repair, backup success, and mutation while any required record is unreadable. Never generate a new key as a generic response to a decryption error.

**Regression/acceptance:** Missing key, wrong key, corrupt one-of-many records, mixed legacy/DEK migration states, interrupted account setup and trial-to-account transition. Ordinary startup must not show a valid empty school or rewrite unreadable records. Full trial-transition failure has not yet been reproduced; it is a mandatory test gap.

### F09 — P1, hotfix gate: startup still guesses adviser identity and advisory status

**Evidence/root cause:** [app-store.ts:1846](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/stores/app-store.ts:1846>) rewrites adviser names using a list of ordinary names, an `adv-` prefix and “TBA”. It also marks a named section and a hardcoded user ID as advisory. These writes occur during initialization without confirmed provenance. Removing the Einstein purge did not remove all name-based startup mutations.

**Fix:** Remove identity/name guesses from automatic startup mutation. Use explicit fixture provenance and verified local/cloud identity mappings only. Ambiguous adviser assignments should be reported for review. Inventory remaining subject and grade self-healing writes; allow only deterministic, scoped, tested migrations with durable markers.

**Regression/acceptance:** Legitimate names matching old fixtures, `adv-*` IDs, same section names across years, teaching versus advisory sections, alternate local/cloud IDs, and unchanged ordinary startup. Verify exact fields, not counts. Preserve manual grades and cross-section isolation.

### F10 — P1, hotfix gate: routine retention can delete pre-update safety backups

**Evidence/root cause:** [main.cjs:315](<C:/Users/Emerson/Desktop/FormEase Pro/app/electron/main.cjs:315>) applies a configured limit to every `.json` in the backup directory. [AutoBackupManager:184](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/services/AutoBackupManager.ts:184>) passes the user's retention limit. This is conditional on a finite preference, not always active. Filesystem save failures returned as `{success:false}` are also ignored by some callers.

**Fix:** Separate protected pre-update/pre-restore/manual backups from rotatable routine snapshots. Apply retention only to explicitly owned routine backups, after a new verified snapshot succeeds. Honor returned failure results. Use atomic writes and unique identifiers.

**Regression/acceptance:** Synthetic mixed backup directory, finite/unlimited retention, failed new save, equal timestamps, filename collision and malformed files. Protected backups must survive every automatic retention case. No real backup cleanup during implementation.

### F11 — P1 security: local IPC and cloud authorization need stronger boundaries

**Local evidence:** [Backup IPC:731](<C:/Users/Emerson/Desktop/FormEase Pro/app/electron/main.cjs:731>) joins renderer-provided filenames to a directory; save/delete paths are similar. Path confinement and sender authorization are not enforced there. Key-recovery IPC also needs explicit trusted-renderer review. Context isolation is enabled, but it is not a substitute for validating each privileged operation.

**Cloud evidence:** [Portal rules:17](<C:/Users/Emerson/Desktop/FormEase Pro/license-portal/firestore.rules:17>) and [root rules:17](<C:/Users/Emerson/Desktop/FormEase Pro/firestore.rules:17>) treat any non-anonymous authenticated identity as admin. That is not an explicit administrator role. Actual deployed rules and account-provisioning restrictions were not inspected, so this is a source-level authorization defect, not a claim of observed compromise.

**Fix/tests:** Confine backup operations to validated basenames and resolved allowed directories; reject traversal, absolute paths, alternate separators, and untrusted IPC senders. Add temporary-directory tests. For cloud access, use server-managed admin claims/allowlists with emulator tests for unauthenticated, anonymous, ordinary registered and admin users. Review unauthenticated purchase/diagnostic creates, claim expiry constraints, status lookup rate limits and webhook idempotency. Do not change live rules, licenses, accounts or payment services without separate approval.

**Release impact:** Desktop backup IPC fixes are part of the recovery safety gate. Cloud findings block calling the whole system secure; actual cloud remediation is a separate local implementation and approved deployment track, not permission to deploy now.

### F12 — P1 release control: current checks fail and alternate release scripts bypass gates

**Evidence:** Version consistency currently fails because of [updater fallback:414](<C:/Users/Emerson/Desktop/FormEase Pro/app/src/stores/update-store.ts:414>). Two source lint errors remain. Root release helpers still contain force-push, artifact clobber and publication steps; for example [hybrid script:79](<C:/Users/Emerson/Desktop/FormEase Pro/RELEASE_UPDATE_HYBRID.bat:79>) and [automated script:123](<C:/Users/Emerson/Desktop/FormEase Pro/RELEASE_UPDATE_AUTOMATED.bat:123>). Improving CI does not make those entry points safe. CI publication also lacks a visible environment-approval/concurrency boundary in the reviewed YAML.

**Fix/tests:** Centralize version identity and test packaged UI/runtime/installer/update metadata agreement. Correct lint without mixing in broad cleanup. Make old release entry points refuse unsafe publication or route through the same gated process. Separate build/stage/promote, pin a validated toolchain, require artifact manifests/hashes and manual approval, and serialize promotion. Test failed builds, missing artifacts, concurrent releases and retries entirely with synthetic artifacts/mocked services. Verify downloadable assets, not merely the release webpage.

**Migration/risk:** No data migration. Do not reset the three pre-existing generated changes. Reconcile source/generated artifacts in a deliberate later checkpoint. No real tag or workflow dispatch is needed to test tag comparison.

## 5. Wider system coverage and remaining validation

| Area | Current evidence | Required next validation |
| --- | --- | --- |
| Original disappearance incident | Broad `999*`/`TEMP-*` guards and automatic Einstein purge have been removed in inspected source; orphan TEMP grades are retained | Production-mode startup, cold restart and export retain real-looking synthetic identifiers, ordinary Einstein/Archimedes names and all grade fields |
| Recovery communication | Available backup is always reported as mismatch; dismiss is memory-only; equal counts are described as “100%” preservation | Separate “backup available” from “data mismatch”; content-level comparison; durable per-backup dismissal; revalidate at restore; corrupt newest backup must not prevent inspecting older candidates |
| Backup schema | Multiple legacy shapes and two restore engines; hardcoded year fallbacks and settings outside IndexedDB | Versioned normalization, absent/empty semantics, full coverage of school profile/years, users, attendance, grades, HPS, SF2, SF10 and settings |
| Password/DEK recovery | Unit and fake-IndexedDB persistence tests exist and selected tests pass | Real isolated Electron OS secure storage, cold restart, wrong answer/password, unavailable keychain, interrupted migration and trial conversion on supported platforms |
| RBAC / identity | Stable local/cloud identity work exists, but some section permission helpers grant access to any signed-in user while page filters restrict sections | Document intended single-user versus multi-user policy; test every read/write route under that policy; no email/name fuzzy grants; never silently lock teachers out of existing advisory data |
| Grades | Manual-override protections exist; subject reconciliation still runs at startup | JHS, G11/G12, SSHS, semester/quarter and school-year separation; override survives all bulk/sync/restore paths; raw activities/HPS unchanged; reports resolve the same grade with provenance |
| Attendance/SF2 | Scope/parsing fixes and tests exist | Underscore IDs, identical section names across years, blank sheet/month, current day versus historical edits, mobile provenance, duplicate/replayed events, deletion boundaries and restart persistence |
| Phone attendance | Pairing tokens and projections exist in the server | Local-only synthetic HTTP tests, expiry/revoke, student/section membership, >500 queued events, offline reconnect and process restart. Queue overflow/restart needs durable delivery or an explicit resynchronization protocol, not silent loss. Verify dev and packaged servers behave consistently. |
| SheetJS imports | Actual app resolves official `0.20.3`; central wrapper checks file size and sheet count | Complete original enrollment/SF1/consolidated/master import matrix. Limits must be enforced in the reader too; worksheet count is checked only after synchronous parsing. Add bounded worker/time/memory/row-cell controls appropriate to legitimate workbooks. No unbounded malicious-input test. |
| Spreadsheet/PDF exports | Existing tests cover multiple forms but a real-backup test compromises suite privacy | All synthetic SF1/SF2/SF5/SF6/SF8/SF9/SF10, G11/G12/SSHS and native template flows. Compare formulas, cached values, merged cells, print areas, hidden sheets, dates, identifiers and relationships, not ZIP bytes. Rendering/print inspection remains a separate manual gate. |
| Licensing/payment portal | Source review found broad admin policy; webhook writes license then order separately and logs generated serials | Emulator/mocked tests for duplicate/concurrent callbacks, payment/order consistency, key redaction, order-status authorization/rate limits and quota abuse. Do not inspect or mutate production orders/licenses. |
| Test isolation | A profile-path override exists for Electron; fake IndexedDB tests are isolated | Also isolate networking/updater/cloud/license calls. A fresh filesystem profile alone does not prevent production network requests. Test processes must never attach to an already-running real app. |
| Performance / maintainability | Large shared store and duplicated import/reconciliation/network logic | Synthetic large-school load/save/import/export measurements, memory ceilings and UI responsiveness. Architectural extraction follows the hotfix; do not combine it with emergency migration changes. |

## 6. Implementation sequence and checkpoints

Each checkpoint: inspect -> reproduce with synthetic data -> add failing regression -> smallest safe fix -> targeted tests -> broader tests once safe -> update the implementation log. Keep commits local on the existing branch. Do not bury behavior changes in generated-file commits.

### Phase 0 — establish trustworthy test isolation

1. Preserve and document current dirty generated files; no reset or cleanup.
2. Fix F06 before the next full suite. All fixtures explicitly synthetic; no real backup discovery or user-derived file output.
3. Add filesystem/network tripwires and isolated profile setup. Confirm app startup does not contact production services in tests.
4. Record baseline commands/exit codes. Obtain separate owner permission before sending dependency metadata to npm; do not retry the blocked transfer indirectly.

**Exit:** Full suite can safely execute without access to personal files. Suggested local checkpoint: `test(safety): isolate fixtures from user profiles and services`.

### Phase 1 — safe persistence and verifiable backups

1. Fix committed-write acknowledgment and abort handling (F07).
2. Make locked/corrupt reads explicit (F08) and backup reads fail closed (F02).
3. Version and repair checksum validation (F01); apply it to every recovery entry point.
4. Implement atomic confined backup writes, readback and protected retention (F10/F11).

**Exit:** No failed read/write can produce an accepted safety backup; no automatic rotation removes protected snapshots. Fault-injection tests prove this. Commit persistence, checksum and backup lifecycle changes separately.

### Phase 2 — one safe restore pathway

1. Normalize legacy formats and validate all inputs before writes.
2. Add honest preview, newer-record/conflict summary and explicit confirmation.
3. Preserve destination auth/key/license state (F04); restore only allowed settings.
4. Stage and atomically commit selected data; journal cross-storage changes (F03).
5. Verify exact content, rehydrate, cold restart, log in and verify again.
6. Fix misleading/repeating recovery messaging without hiding genuine unresolved recovery needs.

**Exit:** Cancel/error/crash tests preserve recoverability; same-profile and cross-profile synthetic restore survive restart/password change/recovery. No real restore is authorized by this plan.

### Phase 3 — safe startup, updater and domain regressions

1. Remove remaining name-based startup mutations (F09), preserving compatibility.
2. Implement main-process install gating and a single controlled shutdown path (F05).
3. Run original data-preservation, RBAC, SF2, grade override and school-profile/year gates.
4. Complete the SheetJS import/export matrix and bounded security tests; keep it a blocker until evidence exists.
5. Correct version fallback and lint; do not mistake this small cleanup for completion of the data-safety work.

**Exit:** Original incident reproductions and newly discovered cases pass in production-mode behavior, including restart.

### Phase 4 — cross-system security and testable release controls

1. Complete desktop IPC sender/path tests and mobile synchronization/security tests.
2. Implement/test cloud-rule and payment changes locally with emulators/mocks. Document deployed-state unknowns; any deployment needs a new explicit approval.
3. Consolidate release entry points, review signing/trust policy and pipeline toolchain; no force-push or artifact replacement in validation.
4. Run a fresh approved dependency review for runtime and build dependencies, portal and functions. Triage exact installed versions, reachability, fix risk and accepted exceptions; no blanket audit-fix upgrade.

**Exit:** No unresolved P0; every P1 has a fix or explicit, evidence-backed owner disposition consistent with the original mandatory gates. Data-integrity blockers cannot be deferred merely to get a release out.

### Phase 5 — clean, local-only release candidate validation

1. Record exact source SHA and resolve generated-file provenance without discarding existing changes.
2. Complete suite exits naturally with 0 and normal totals; mandatory tests cannot be skipped.
3. Full TypeScript + production Vite build exits 0; no-emit checks alone do not satisfy this gate.
4. Build new Windows NSIS and macOS artifacts to unique directories with publishing disabled. Preserve all old installers and metadata.
5. Verify package/installer/UI/updater versions, architecture, signing decision, hashes, install/uninstall profile preservation and actual startup.
6. Run packaged legacy-upgrade -> missing-record recovery -> new edit -> close -> reopen -> password change/recovery -> export/restore tests with a synthetic school and isolated local update feed. Validate OS secure storage on each supported OS.
7. Perform manual UI and print/export checks on synthetic data. Provide an exact safe launch procedure; launching an installer itself does not create an isolated profile.

**Exit:** A versioned evidence manifest links every gate to its command/test, process exit, SHA, platform and artifact hash. Only then ask for a separate production-release decision. A higher-version corrected release is the intended direction; do not silently downgrade existing users or relabel an unsafe old binary.

## 7. Mandatory release checklist

- [ ] F01–F07 fixed and failure-path regression tests pass.
- [ ] F08–F10 data-integrity/startup/retention gates pass.
- [ ] Desktop privileged IPC validated; cloud findings resolved or handled in an explicitly approved, safe separate track.
- [ ] Original no-hidden-999/TEMP/no-Einstein-delete protections proven in production mode.
- [ ] No automatic orphan/manual-grade deletion or heuristic ownership reassignment.
- [ ] Replace-empty, missing-profile, school-year, SF10 and cross-profile restore tests pass.
- [ ] Interrupted restore/migration never leaves an apparently successful partial school database.
- [ ] Password change/recovery and cold restart preserve exact records on Windows and macOS for the supported release.
- [ ] SF2 reconciliation and blank-sheet deletion remain precisely scoped; mobile records are preserved.
- [ ] Manual overrides/raw activities/HPS survive sync, import, restore and subject changes.
- [ ] SheetJS actual resolution and full import/export/security matrix pass.
- [ ] Default tests contain no real learner files and do not discover private backups.
- [ ] Full configured suite: normal aggregate summary and natural exit 0, with justified non-mandatory skips only.
- [ ] Lint, full production build, Windows packaging and required macOS packaging pass on the final candidate.
- [ ] Version consistency passes; eventual tag equals package version and points to tested source.
- [ ] Dependency audit reviewed, with no newly introduced critical vulnerability and no undisposed blocker.
- [ ] Artifacts match tested source; generated-file state is understood; no unsafe parallel release path remains.
- [ ] Packaged recovery and safe install gating tested against isolated data/services.
- [ ] Support instructions explain preservation, limitations, new-work conflicts and recovery without guaranteeing unavailable data.
- [ ] User explicitly approves production publication/deployment. **Not currently authorized.**

## 8. v3.6 follow-up — after the hotfix gates

Preserve the original architectural direction: canonical local/cloud/student/section/subject identity; one grade resolver with source/provenance; unified attendance reconciliation; explicit backup schema migrations; an idempotent database migration registry; and a meaningful audit trail for restore, overrides, credentials and migrations. Consolidate duplicate auto-backup managers and dev/production attendance handlers after behavioral tests exist. Improve performance and form accessibility using synthetic workloads. These are not reasons to postpone the urgent restore and key-continuity safeguards above.

For every implementation checkpoint, log: problem, root cause, exact files changed, smallest fix, regression names, targeted/full results with exits, migration/recovery implications, remaining risk and SHA. Append corrections to historical claims rather than rewriting history to imply a gate already passed.

## 9. Audit limitations and references

This was a risk-based cross-system source/configuration review, source lint, selected regression run and two synthetic reproductions. It was not a line-by-line proof of all 1,431 tracked files, a penetration test, a production-account inspection, or a completed desktop/manual/platform test matrix. No claim is made that every possible defect has been found. Existing learner records, user backups, profile copies, licenses, credentials, environment secrets and production services were not inspected or modified for the audit.

Public references clarify recommended boundaries, not the state of this installation:

- The JSON array replacer limits included property names: [MDN JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify). Local synthetic execution, not documentation alone, establishes F01.
- Authentication identifies an account; access must be authorized by rules: [Firebase authentication and Security Rules](https://firebase.google.com/docs/rules/rules-and-auth). Local rule inspection establishes F11; deployed configuration remains unknown.
- Validate IPC senders and privileged boundaries: [Electron security recommendations](https://www.electronjs.org/docs/latest/tutorial/security). Local profile isolation does not replace these controls.

**Recommended next authorization:** implement Phase 0 and Phase 1 locally, then Phase 2 safe restore. Keep releases/deployments prohibited throughout. Separately approve npm dependency-name/version disclosure if a fresh online vulnerability check is desired.
