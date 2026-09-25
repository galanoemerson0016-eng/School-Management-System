# FormEase Pro: grade consistency and Excel backup implementation plan

Date: 24 September 2026, Asia/Manila  
Application inspected: 3.5.18  
Branch: `fix/v3.5.18-data-integrity`  
HEAD: `877beb2172d614891adf0eb340c43b67b5222a49`, plus the existing uncommitted changes  
Status: implementation in progress; source work and verification evidence are recorded in section 12.

## 1. Recommended course of action

Keep IndexedDB as the operational database. Establish one authoritative grade-resolution contract, one transactional grade-write service, and one shared calculation layer. Have E-Class Record, Grade Management, summaries, SF9, SF10, temporary grade slips, and exports consume the same resolved academic data for the same scope and revision.

Then extend the existing backup system to produce a complete FormEase recovery file and a readable Excel workbook from the same snapshot. Excel is a secondary backup and inspection format. It must not become another independently edited operational database.

Deliver in this order:

1. **Prerequisite: preserve data safely before any migration or restore.** Close the newly identified empty-snapshot fallback gap.
2. **Release A: consistent grades and safe saves.** Complete the grade contract, transactional writes, report integration, conflict handling, and non-destructive migration.
3. **Release B: automatic paired backups.** Consolidate scheduling and generate matching full-recovery and Excel files with verifiable completion.
4. **Optional Release C: restore directly from a structured Excel backup.** Add only after a workbook can demonstrably preserve the required data. This is a separate acceptance gate, not an implied ability of today's Master Excel export.

SQLite, a local Excel REST API, ODBC, and a new cloud database are deferred. None is needed to resolve the confirmed application-level synchronization gaps. Reconsider a server database when concurrent school-wide editing becomes a separate requirement with permissions and conflict resolution designed explicitly.

## 2. Scope and confidence

This plan covers the grading, reporting, persistence, migration, and backup paths relevant to the user's recurring mismatches. It incorporates the updated local code, not just the pasted conversation or earlier audit log.

It is not a claim of complete knowledge of every application feature. No real learner database, teacher backup, account credential, or installed production profile was inspected. Actual affected-record diagnosis, every supported template, packaged operation, and official applicability of curriculum policies remain verification work.

The earlier system audit remains a companion document: `docs/FORMEASE_v3.5.18_SYSTEM_AUDIT_AND_IMPLEMENTATION_PLAN_2026-09-23.md`. Its original findings describe an earlier baseline; compare each with current source before treating it as unresolved. Existing changes in the working tree must be preserved.

### Evidence collected in this review

| Evidence | Result and limitation |
| --- | --- |
| Selected grading/sync/database/checksum tests in the preceding review | 9 files, 112 tests passed, exit 0. Includes subject sync, E-Class summary, SF9 template 2, temporary slips, grading helpers, grading slice, transaction completion, atomic restore, and checksum tests. |
| Additional curriculum/report tests during plan preparation | 5 files, 43 tests passed, exit 0: section scope, grading improvement workflows, SHS single-term behavior, SF10 customization, and Grade 1 E-Class. |
| Combined scope | 14 selected files, 155 tests passed across two separate runs. This is not the complete suite or packaged end-to-end certification. |
| Build/release evidence in the implementation log | Historical evidence only; no production build, installer, deployment, or live-profile restore was performed for this plan. |
| Mutation scope of this planning task | This new Markdown plan only. Existing application changes were not rewritten. |

## 3. Current architecture and observed gaps

Line references below describe the inspected working copy and will move during implementation.

| Area | Current evidence | Consequence / implementation requirement |
| --- | --- | --- |
| Operational storage | `src/services/database.ts`; React state in `src/stores/app-store.ts` and grading slice | IndexedDB persists records; UI state is a separate in-memory view. Correct database writes alone do not guarantee current UI state. |
| E-Class automatic updates | `src/pages/EClassRecord.tsx:2073`, `src/pages/ShsEClassRecord.tsx:1838` | Automatic raw/consolidated saves already exist. The earlier claim that all updates require Publish is inaccurate. Replace duplicated page orchestration, not merely add another live-sync effect. |
| Multi-store grade save | Separate `updateClassRecord` and `updateGradingSheetRecord` calls in page handlers | Related saves can complete or fail independently. Some calls are not awaited. There is no single committed grade-edit result for these paths. |
| Override protection | `src/stores/slices/grading-slice.ts:107` | Protection relies on incoming `grade_source: 'eclass_sync'`; ordinary E-Class calls omit it. Grade Management's ordinary manual-write paths also need explicit source classification. |
| Grade Management reads | `src/pages/ConsolidatedGradesPage.tsx:3009` passes `classRecords: []` | Its inputs differ from consumers that permit raw-score fallback. A missing or stale consolidated record can produce a different display. |
| Grade resolver | `src/utils/grading-helpers.ts:947` onward | Existing source priority is not a complete provenance/revision policy. Legacy healing and special treatment of 100 must be reviewed against explicit sources and valid perfect grades. |
| SF9 reactivity | `src/pages/SF9Page.tsx:3134` and `computeStudentGrades` | Calculation reads raw/HPS state indirectly while memo dependencies omit those inputs. Use explicit snapshot inputs and subscriptions. |
| SF10 overrides | `src/pages/SF10Page.tsx:146`, `src/stores/sf10-store.ts` | Cell overrides are merged after calculated values and persisted separately. Intentional historical/custom fields must survive; current grade overrides must be visible and scoped. |
| Formula duplication | SF9 page, consolidated page, temporary slips, `sf10Mapper.ts`, SHS mappers, export services | Shared quarterly lookup does not establish final-rating/general-average parity. Completeness, offered terms, units, and exclusions must be shared too. |
| Subject identity and scope | `grading-helpers.ts`, `grade-reconciliation.ts`, `curriculumSync.ts`, curriculum helpers | Aliases, grade-wide subjects, section offerings, elective sequences, and enrollment create different matching needs. Fuzzy matching is unsuitable as the final write key. |
| Provenance migration | `src/utils/grade-provenance-migration.ts` | A classifier exists; repository search found its definition but no invocation. Its comments are not evidence that startup already enforces source priority. Matching values alone do not prove provenance. |
| Startup | `src/stores/app-store.ts:1625` onward | Current initialization intentionally preserves teacher-owned data. Do not reintroduce silent startup grade/subject healing. |
| Existing Excel export | `src/services/master-excel-backup.ts`, Settings export, pre-update safety vault | Extend existing functionality. Current class-record sheets omit individual assessment scores/HPS and are not a full round-trip backup. Overview version text is hard-coded to an older release. |
| Existing restore UI | `src/components/BackupRestoreModal.tsx:183` | General restore accepts JSON/FormEase backup files. Grade 1 workbook import is a specialized separate workflow, not general workbook restoration. |
| Backup scheduling | `services/AutoBackupManager.ts`, `services/IncrementalBackupService.ts`, `components/AutoBackupManager.tsx` | Daily/startup/exit/incremental paths already coexist. Avoid adding an independent Excel timer. LocalStorage-only changes also need backup tracking. |
| Snapshot consistency | `src/utils/backup-restore.ts:424` reads stores separately | Separate reads plus later settings/state reads do not inherently identify one coherent revision. Add a coordinated snapshot boundary. |
| Recovery prerequisite | `src/utils/backup-restore.ts:552` | A broad catch builds an empty fallback and subsequently labels it a protected safety copy. It does not preserve unreadable original records. This must not authorize a destructive restore or migration. |

## 4. Product behavior to deliver

- A committed score or HPS edit updates all current reports without requiring Publish or Sync.
- While typing, a local draft may change immediately; “Saved” means the related database transaction completed. Failed drafts remain available for retry and do not appear as saved official grades elsewhere.
- E-Class shows the calculated grade. When a deliberate override exists, show the effective official grade and the reason for the difference. Do not force intentional overrides to equal the raw calculation.
- Grade Management identifies E-Class-derived, directly entered, imported, overridden, incomplete, and unresolved results clearly.
- Missing data remains distinct from an encoded zero, not-enrolled, not-offered, exempt, and incomplete. Internal results must not use one numeric zero to represent all these states.
- Final results follow the required periods and learning areas for the selected policy. If a partial average is useful, label it provisional and keep it distinct from a completed final/general average.
- Current-year SF9, temporary slips, summaries, and current-year SF10 agree on the effective result for matching scope and revision. Historical SF10 records and legitimate archival overrides are preserved.
- A report's layout may hide or reorder rows without silently redefining which subjects count toward an official average. Subject exclusions come from academic policy/enrollment, not accidental column visibility.
- Backup status reports the last successful full backup and Excel backup separately. A failed Excel file must not be reported as a completed pair.
- Users can open readable Excel records without FormEase. Complete restore continues to use the full backup until the optional workbook restore contract passes its own tests.

## 5. Target design

### 5.1 Grade identity and ownership

Use a canonical scope consisting of school year, section, learner identifier, subject offering, and period. Retain existing IDs during compatibility rollout; add a stable scoped key and indexes only through a versioned migration. Include section/year in new identifiers. Do not collapse different electives because their names are similar.

Prefer a stable learner ID where already available; otherwise preserve string LRNs and handle LRN corrections as a transactional reference migration. No broad learner-ID redesign is required for the first release. Preserve leading zeros in exported/imported identifiers.

Store or derive these concepts explicitly:

| Concept | Contract |
| --- | --- |
| Raw inputs | Individual scores, blank-vs-zero state, HPS, assessment definitions, applicable configuration. |
| Calculated grade | Result of a versioned policy and a known input revision; reconstructible. |
| Direct grade | Legitimate subject-teacher/manual/imported result without a required local raw-score record. |
| Override | Intentional replacement of the effective result, with reason, actor where available, timestamp, and revision. |
| Effective grade | Selected result with source, completion state, policy version, scope, and revision. |
| Conflict | Multiple incompatible candidates or insufficient scope information; retain candidates and request review rather than choosing by array order. |

Recommended resolution: an explicit valid override wins; otherwise follow the offering's configured source (E-Class or direct grade). An unambiguous legacy direct grade can remain usable with its legacy status. A newly found raw record must not silently seize ownership from an existing teacher-entered grade. Stale calculated projections are rebuilt through the write service, never selected merely because they were saved last.

An intentional grade clear needs a durable clear marker/source transition where necessary so a fallback or old import cannot resurrect the cleared value. Releasing an override is a distinct action that returns ownership to the configured source.

### 5.2 Calculation service

Extract pure functions from existing helpers incrementally; do not rewrite every formula at once. Proposed module: `src/services/grade-calculation.ts`, supported by existing `lib/grading.ts`, curriculum helpers, and subject configuration.

Inputs must include the curriculum/policy version, year, grade/track, offering, periods, raw scores/HPS, units, and enrollment. Outputs must carry completion state and calculation detail sufficient for diagnosis. No hidden `useAppStore.getState()` reads inside pure calculation functions.

One service defines transmutation, rounding stages, subject final ratings, MAPEH component composition, term averages, general averages, and required-subject completeness. PACE/Grade 1 descriptors remain a distinct typed path; do not coerce them into ordinary numeric grades. Promotion/remarks should use the appropriate shared decision policy, not just an independently rounded number in each report.

Policy preparation must distinguish current three-term behavior, historical four-quarter records, SHS offered-term patterns/units, and specialized subjects. Inventory current code and template expectations, then attach approved policy references to fixtures. Comments claiming DepEd compliance are not independent policy verification. Preserve existing values when policy applicability is unknown; do not change weights or historical grades based on the pasted conversation.

### 5.3 Transactional write service

Proposed module: `src/services/grade-record-service.ts`.

1. Accept typed commands for score/HPS edit, direct grade, override/release, import, clearing, and scoped identity changes.
2. Validate scope and source ownership; load the relevant revision.
3. Prepare encryption and calculations before opening the write transaction.
4. Check expected revisions in the transaction and commit affected inputs, consolidated projection, revision metadata, and audit entry together. Abort on conflict or any write failure.
5. Publish one coherent state update and database-change event after commit. Retain the draft and actionable error on failure.

Serialize/coalesce rapid edits by scope, with revisions preventing an older asynchronous completion from overwriting a newer edit. HPS changes update every affected calculated grade and composite in the intended scope. Large imports must either commit the approved set atomically or use an explicit resumable job with visible boundaries; do not report partial completion as a completed import.

Use a dedicated reusable database transaction primitive. Do not call the restore orchestrator for every keystroke, or assume existing separate `putRecord` calls become atomic when awaited sequentially. IndexedDB can transact across multiple object stores; no second database is required.

Cross-tab/window changes require a persisted revision and invalidation notification, followed by a reload of committed data. An in-memory write counter alone does not coordinate separate processes. Restore, migrations, backup snapshots, and edits must use the same coordination mechanism.

### 5.4 Shared report snapshot

Proposed module: `src/services/academic-record-service.ts` with a reactive hook such as `src/hooks/useAcademicRecord.ts`.

Build one scoped academic snapshot for the learner/section/year/revision. Pages, printable components, PDF renderers, and Excel exporters adapt that snapshot into their layouts. Build all files in a batch from one captured revision; do not repeatedly read live state halfway through rendering.

Retain compatibility adapters for existing resolver signatures while converting consumers. Inventory every caller, including both E-Class pages, Grade Management, both SF9 templates, Grade 1/PACE, SHS renderers/mappers, SF10, temporary-slip variants, ECR export, section summaries, and the school forms vault.

Keep SF10 historical entries and non-grade fields separate from current grade resolution. Grade overrides must show their source and original calculated value. Preserve existing SF10 customization/history during migration; do not silently copy every SF10 field edit into Grade Management.

### 5.5 Backup snapshot and paired output

Proposed coordinator: `src/services/backup-coordinator.ts`, integrating existing services instead of duplicating them.

- Capture committed records across required stores in a consistent read transaction and capture restorable settings under the same coordinated revision. Route report-setting/localStorage changes through tracked actions, or migrate those settings to transactional storage in a separately versioned step.
- Use one immutable snapshot to generate the full backup, readable workbook, counts, and verification manifest. Required read/decryption failures fail the snapshot; they never become empty successful collections.
- Trigger after committed relevant changes with an initial proposed 30-second idle delay and a 5-minute maximum dirty interval while the app is open. Measure and tune; retain manual and pre-migration/pre-update checkpoints. New edits during generation remain dirty for the next snapshot.
- Single-flight scheduling prevents overlapping jobs. Exclude backup output and scheduler bookkeeping from dirty tracking. Include attendance, enrollment, school/profile configuration, SF10 overrides, PACE, and report settings where part of the recovery contract.
- Write versioned files to a configured directory outside the application storage. Stage each file, close it, read back and verify, then write the completion manifest last. A pair is complete only when both files are verified. Existing good files remain untouched on failure.
- Handle open files, disk full, permissions, disconnected USB, and filesystems without hard-link support. Do not assume an NTFS-only publication strategy works on all backup destinations. Retry with clear status; retain the valid full backup if only Excel fails.
- Use a resumable next-start job for unfinished Excel output. Do not make application exit depend on rendering large workbooks, and do not use a short close timeout as evidence of successful backup. Preserve the updater's separate committed-write/verified-backup gate.
- Consolidate daily, incremental, startup, and exit scheduling. Preserve protected pre-restore, migration, and update backups from routine retention. Respect configured retention; do not silently replace it with a hard-coded one-day policy.
- Browser mode must describe its actual capabilities: supported user-granted directory access or explicit download. IndexedDB/localStorage snapshots in the same origin are not an independent external backup.

Suggested filenames: `FormEase_<snapshot-id>_Full.febackup`, `FormEase_<snapshot-id>_Records.xlsx`, and `FormEase_<snapshot-id>_Manifest.json`. Reuse supported full-backup format/version handling; an extension change does not itself encrypt a file.

### 5.6 Workbook content and restore boundaries

Release B workbook: Overview/manifest, learners, sections, subject offerings, enrollments, raw assessment scores, HPS, resolved period grades, subject finals/general averages, attendance, observed values, PACE where applicable, and an appropriate SF10/history representation. Clearly distinguish calculated results from source data. Export actual application/policy/schema versions rather than a hard-coded version label.

For optional Release C, add complete machine-readable structured tables and a schema manifest. Preserve IDs, null/blank distinctions, source/revision metadata, custom subject offerings, SF10 history, and all supported restorable academic settings. For nested values use bounded chunked content or normalized child tables, not an unlimited JSON string in a single cell. Excel cell and worksheet limits must be tested explicitly.

The workbook's readable report sheets are not the authoritative import payload. If a teacher edits them, show that the display differs from the stored recovery payload or treat the file as an editable import with a separate diff workflow. Never silently ignore visible edits while claiming to restore exactly what the teacher sees.

Workbook restore flow: identify schema -> validate bounds, manifest, hashes and references -> preview changes/conflicts -> preserve current data -> stage values -> use the shared restore transaction -> verify record contents and grade results -> restart/reopen verification. Reject unsupported schema versions before mutation. Do not evaluate imported formulas/macros or external links. Export untrusted text as text.

General backup restore, Grade 1 workbook editing, and ordinary roster imports remain distinguishable workflows with shared validation where appropriate. A formatted SF9 or summary workbook is not automatically a full system backup.

Security/portability: readable Excel includes learner information and is not protected by hidden sheets. Exclude credentials, tokens, license/device secrets, and authentication key material from readable worksheets and ordinary portable settings. Preserve destination authentication during restore. Define full-backup encryption and recovery-password handling using the existing supported mechanisms and test recovery on a different synthetic profile. An external copy on the same disk helps app recovery but does not cover disk loss; a removable or configured remote copy is a separate destination option.

## 6. Ordered implementation work packages

| Package | Work and affected areas | Completion gate |
| --- | --- | --- |
| P0 — safe recovery foundation | Fix the empty pre-restore fallback in `backup-restore.ts`; audit all callers, backup UI, database restore, and recovery tests. Preserve readable state or an actual raw encrypted preservation copy with explicit limitations. Never present an empty replacement as preservation of prior data. | Inject an unreadable record and an integrity failure: original data remains intact; normal destructive restore/migration does not proceed without real preservation. Isolated empty-destination restore still works. |
| P1 — workflow inventory and reproduction | Document every grade writer/reader and create synthetic mismatches using actual page handlers/services. Include source-marker omissions, split writes, stale SF9, valid 100, clearing, and conflicting section/year aliases. Establish approved calculation fixtures. | Each confirmed defect has a failing behavior-level test; unknowns are marked, not explained away by passing helper tests. |
| P2 — canonical contract and pure calculation | Add typed scope/source/status/revision contract; extract calculations incrementally from grading helpers, curriculum helpers, and page code. Decide provisional/final semantics consistently. | Known policy cases produce expected values, including missing/zero, offered terms, MAPEH and SHS. Legacy data remains readable. |
| P3 — transactional commands | Implement the database primitive and grade service; convert E-Class, SHS E-Class, Grade Management, HPS, imports, clear/delete, and relevant learner/subject cascades. | Aborts leave all related stores unchanged; rapid edits cannot regress saved data; explicit overrides survive normal sync and raw-score deletion. |
| P4 — reactive reporting and exports | Add shared academic snapshots; convert summary/GM, SF9 variants, slips, SF10 mappers/overrides, PDF and Excel adapters. Remove hidden state reads and stale dependency paths. | Matching effective grades and averages across screens/exports at one revision, with intentional differences labeled. No normal refresh/publish action required for saved edits. |
| P5 — legacy reconciliation and Release A | Extend Grade Sync Inspector and existing reconciliation/classifier into previewable, idempotent migration. Preserve ambiguous records and originals. Reuse safe snapshots and audit log. | Migration is repeatable, abortable, and restart-safe. Packaged synthetic upgrade/restart proves records and settings survive. Release A gates below pass. |
| P6 — coherent paired backup and Release B | Build coordinator, extend Master Excel export, integrate bounded Electron file APIs, Settings status, manifest/readback, retention, and all existing schedulers. | Full backup and workbook identify the same revision; failures never delete last good backups or falsely mark a pair complete. Restore full backup into isolated profiles. |
| P7 — optional structured workbook restore | Implement explicit workbook schema/parser, preview, source-aware validation, restoration, limits, and compatibility fixtures. | Excel-only round trip reproduces every declared supported record/setting and academic result. Limitations and edited-sheet behavior are visible. |

P0 precedes any migration. P1/P2 define the contract before P3/P4 change behavior. Release B depends on Release A and the snapshot boundary. Release C depends on a lossless workbook schema, not just successful Excel generation. Work can be separated into small reviewable changes, but no half-converted writer/reader combination should be distributed.

## 7. Migration and compatibility procedure

1. Inventory record counts, scopes, sources, duplicate keys, and missing links without modifying data. Produce an aggregate diagnostic report without learner details in logs.
2. Create and verify an actual pre-migration preservation copy. Capture the schema/policy version and revision to be migrated.
3. Preview deterministic mappings and ambiguous cases. Normalizing a display name is not permission to merge two offerings or invent a missing school year.
4. Automatically prepare only unambiguous structural transformations; present grade-changing repairs and ambiguous source decisions for review in the application. Current planning authorization does not choose values for real teacher conflicts.
5. Preserve original values and mappings in a migration journal. Avoid generating fictitious perfect grades, dropping TEMP/orphaned records, or reassigning learners by name.
6. Stage encryption and values, verify that the source revision is unchanged, and commit a defined batch atomically. Resume or roll back deterministically after interruption.
7. Rebuild projections and verify referential integrity, expected counts, overrides, report parity, and backup restoration after cold restart.
8. Mark the migration version only after verification. A repeat run must not create duplicates or change values again.

Rollback must restore the preserved schema/data in a compatible application. Merely switching off a UI feature or installing an older binary is not a data rollback. Do not open migrated data in an older version unless backward compatibility was tested. Retain a preservation copy and explicit rollback instructions for each release candidate.

## 8. Verification matrix

Use synthetic fixtures by default; no tests may auto-discover real AppData backups or teacher workbooks. Audit the suite before a full run. Keep test outputs in isolated temporary directories.

| Scenario | Required assertions |
| --- | --- |
| Edit a saved score and navigate immediately | Committed grade, scope and revision agree in GM, summary, SF9, slips, current SF10 and export; pending draft is not falsely “Saved.” |
| HPS/weight/configuration edit | Exactly the affected scope recomputes, including composites; manual overrides persist; historical policy is unchanged. |
| Blank, zero, complete/perfect 100 | Missing vs encoded zero remains distinct; a valid perfect grade is not suppressed as corrupt. |
| Clear raw scores or direct grade | Derived projections are cleared appropriately; unrelated direct grades/overrides are preserved; fallback cannot resurrect an intentional clear. |
| Override and release override | Effective grade wins where intended; raw calculation remains visible; audit shows who/what/when; releasing selects the configured source. |
| Two rapid edits, delayed encryption, transaction abort | Older completion cannot overwrite newer data; all related stores commit or none do; retries are idempotent. |
| Multi-tab/window edit or restore | Revision conflict/invalidation is handled; no stale in-memory save overwrites a newer restore. |
| Same learner across sections/years | No grade leakage or accidental deduplication. LRN correction updates related references together. |
| Aliases and elective sequences | Math/Mathematics aliases resolve only within unambiguous scope; different numbered electives remain separate. |
| Missing periods or subjects | Provisional and final behavior matches policy; averages do not silently omit required missing learning areas. |
| MAPEH and SHS | Correct component treatment, no double count, correct offered terms/units/exclusions. |
| Grade 1/PACE | Descriptor/rating pathways and specialized workbook import remain intact. |
| SF10 history and overrides | Prior-year records, custom fields, layout choices, and snapshots survive; current conflicting grade overrides are identifiable. |
| Restore/import and cold restart | Same records, raw scores, HPS, source ownership, computed results and relevant settings; destination credentials still work. |
| Unreadable prior database | Actual originals remain preserved; an empty manufactured snapshot cannot satisfy the safety gate. |
| Snapshot during ongoing edits | Outputs contain one revision; later edits remain dirty and trigger a subsequent backup. |
| Open workbook / disk full / disconnected destination | Last verified files remain; full/Excel status is truthful; retry completes without duplicates or overwrite. |
| Process termination during file generation | Incomplete files are not listed as verified complete pairs; next startup can retry safely. |
| Corrupt/edited/oversize workbook | Validation fails or offers an explicit import diff before writes; no formula execution; no silent truncation. |
| Settings-only/SF10-only edit | Backup becomes dirty and captures the change despite no grade-store mutation. |
| Performance | Benchmark representative 50-learner sections and a 10,000-learner synthetic database; report input responsiveness, recomputation and backup duration. Avoid whole-school recomputation on every keystroke. |

Acceptance tests must exercise real commands/page interactions and rendered/exported values. Reimplementing production formulas in tests only demonstrates agreement between duplicated logic; include independently specified expected results and fault injection.

## 9. Release gates and delivery evidence

### Release A

- P0-P5 pass, all mutation/read paths are accounted for, and the defect reproductions now pass.
- Applicable policies/periods are documented with approved reference fixtures; no undocumented bulk recalculation of historical grades.
- Full synthetic suite, TypeScript checks, appropriate lint, and production build pass. Record commands, exit codes, test counts, skipped reasons, revision, and source diff.
- Launch a newly built package with `FORMEASE_TEST_USER_DATA_DIR` pointing to a new isolated directory. Exercise edit -> navigation -> export -> close -> restart -> restore and manual overrides through the UI.
- Confirm update preparation and restore preserve all declared stores/settings and do not weaken the existing update safety gate.
- Check print/PDF/Excel output for each supported report family; calculation parity and visual template fidelity are separate checks.

### Release B

- Demonstrate scheduled/manual/startup/exit coordination without duplicate jobs and without counting internal backups as external copies.
- Verify matching snapshot identifiers, hashes, record counts and selected data across full backup, workbook and manifest.
- Restore the full backup into a differently keyed synthetic profile and verify cold login and complete declared data.
- Test ordinary disk, open workbook, disconnected removable destination, disk-full/permission failure, and interrupted generation. Retention cannot prune protected checkpoints or the last good backup because a new job failed.
- Test browser fallback separately; do not advertise silent Documents-folder writes where unsupported.

### Optional Release C

- Demonstrate a workbook-only restoration against the declared schema, including raw scores/HPS, SF10 history, source provenance and settings.
- Document exclusions explicitly. A workbook omitting part of the recovery contract must be labeled partial recovery, not a full backup.

Build candidates in isolated output directories without overwriting historical installers or production updater metadata. Source changes, built artifacts, packaged behavior and publication are separate milestones. Publication is outside this planning task; no release readiness is inferred from this document or earlier passing tests.

## 10. Practical implementation checklist

- [x] Preserve the current working-tree changes and record the baseline.
- [x] Fix and reproduce the empty pre-restore snapshot problem.
- [ ] Inventory all writers/readers and applicable curriculum policies.
- [x] Add behavior tests for scoped atomic grade writes, ownership protection, backup read failures, and paired-file failures.
- [ ] Implement source/scope/status/revision contracts and pure calculation adapters.
- [ ] Implement atomic grade commands and convert every writer.
- [ ] Convert reports and exports to a shared committed snapshot.
- [x] Add initial visible override-preservation and save-failure behavior.
- [ ] Implement previewable reconciliation and reversible migration.
- [ ] Complete Release A packaged validation.
- [x] Consolidate backup scheduling and coherent database snapshot capture.
- [x] Add raw assessment/HPS workbook rows, pair verification, status, and checksum-gated retention.
- [ ] Complete Release B restoration/failure/portability validation.
- [ ] Add structured workbook restore only after its lossless contract is proven.

## 11. Supporting technical references

- [IndexedDB transactions across object stores](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction): supports the multi-store write design; it does not by itself make separate transactions or localStorage updates atomic.
- [Excel specifications and limits](https://support.microsoft.com/en-us/excel/excel-specifications-and-limits): workbook schema must respect cell/worksheet limits, including 32,767 characters per cell. A large embedded backup cannot be placed into an unrestricted single cell.

These references support storage mechanics. They do not validate the application's curriculum or grading-policy assumptions; policy verification is a distinct implementation gate.

## 12. Implementation progress (25 September 2026)

The following source changes have been made in the working tree. They are not a release certification, and the full Release A/B acceptance gates remain open.

| Work | Implemented so far | Remaining gate |
| --- | --- | --- |
| Recovery prerequisite | Required backup-store reads now fail closed; a pre-restore safety copy no longer substitutes an empty backup. All restorable IndexedDB stores are read in one readonly transaction. | Test the packaged app and recovery scenarios with an isolated profile, unavailable storage, and active encryption keys. |
| Grade writes | Added a multi-store commit primitive and ordered grade-write service. E-Class, SHS E-Class, Grade Management, HPS, publish, clear, and delete paths use scoped atomic updates. Explicit/manual and unresolved legacy grades are retained during E-Class edits. | Inventory every remaining import, cascade, and writer; add persisted revisions and cross-window conflict handling. |
| Grade readers | Explicit grade provenance is resolved before legacy healing. Added a pure SF9 calculation module for subject finals, three-term completeness, general averages, and SHS unit weighting. SF9 page, PDF rendering, and export callbacks now pass grade/HPS inputs explicitly instead of reading those records from hidden global state. | A shared academic snapshot and calculation contract across Grade Management, summaries, SF10, temporary slips, and their exports is still needed. Existing formulas were moved without adopting new curriculum policy. |
| Grade Management calculations | Consolidated Grades uses shared pure functions for subject finals, weighted averages, MAPEH/EC-MK composite term grades, and selected-term averages. Composite groups are averaged equally; a partial value remains visible when one group is missing, but that term is incomplete. Annual subject calculations average only schedule-offered terms; selected-term overall averages skip subjects not offered in that term. | Validate component groups against approved school teaching-load/curriculum fixtures. Exported report status still needs a reliable offered-term snapshot contract before provisional/final labels can be added consistently. |
| Offered-term status display | Consolidated Grades marks provisional subject finals with a `P`, shows `PROV` beside a partial average, and provides explanatory hover text. Selected-term average status is based on offered, included subjects. | Verify visual fit in supported print/table layouts and confirm composite expectations against approved reference fixtures. |
| Specialized SHS export averages | Grade 12 Academic-cross and TechPro-cross workbook calculations now call the shared weighted-average helper. Their different completeness, remarks, and honors rules remain separate and unchanged. | Review output against official policy fixtures; visual table/print verification of status markers remains pending because the local app opened at initial account setup and no school profile was available. Status markers remain printed with the grade cells to identify provisional values. |
| Temporary Grade Slip | Ordinary subject and MAPEH finals now share the three-term helper, and the slip still displays a final only when all three grades are present. Its existing all-expected-subject gate for general averages and remarks remains in place. | Verify term offering and weighting against approved policy fixtures, then converge completeness and display semantics with other reports without weakening the slip's completeness gate. |
| SF10 history and exports | The historical SF10 editor shares quarter/final and equal-weight-average helpers for both three-term and four-quarter history. It keeps its partial-average behavior and clears a final when no terms remain. Consolidated PDF/Excel and standard SF9 workbook averages now share the generic helpers while retaining existing subject selection and SHS unit weighting. | Verify historical school-year term mapping and generic export subject scope against official fixtures; specialized SHS exports still use dedicated policy paths and are not yet unified. |
| Backup snapshot | Database payload reads are coherent across required stores; local settings are checked for changes during capture. Read errors are no longer silently converted into empty sidecars. | Coordinate settings and cross-process changes with an explicit revision and test interrupted saves. |
| Excel workbook | Added per-assessment score/HPS rows and replaced the stale hard-coded application-version label. | Add the remaining declared recovery sheets, evaluate workbook limits/performance, and verify visual outputs. |
| Automatic backup | The daily, dirty-data, and pre-exit paths now share one de-duplicated backup operation. Desktop output writes the full JSON, Excel workbook, and a manifest with one snapshot ID and hashes. The desktop file handler validates the workbook path/type and verifies the saved bytes. Retention removes only complete pairs that pass manifest and checksum checks. Settings shows whether the full/Excel pair was verified. | Exercise disk-full, interruption, old Electron builds, and packaged cold-restart behavior. Settings-only changes are not yet part of dirty detection. Browser fallback remains local-only. |

Verification update, 2026-09-25: full `npm test -- src` passed (105 files passed, 1 file skipped; 911 tests passed, 5 skipped). The skipped file is `test-client-snapshot-restore.test.ts`, conditionally skipped because its external snapshot fixture is unavailable. The latest focused checks passed (42 composite/calculation/Grade Management workflow tests), TypeScript with exit code 0, scoped ESLint, and whitespace checks for the files changed in this part. `npm run build` passed (`tsc -b` and Vite production build); Vite reported existing mixed dynamic/static import chunk warnings and large vendor chunks. An unpacked Windows x64 Electron build also succeeded in an isolated temporary directory. It launched with a new `FORMEASE_TEST_USER_DATA_DIR`; the startup log was created, the packaged local app page returned HTTP 200 with the root element, and the window responded. The test instance was closed; no existing app profile was used. This is a packaged startup smoke test, not a cold-login/restore/update acceptance run. The full test run emitted jsdom's unsupported-navigation diagnostics from download tests but exited successfully. Whole-tree `git diff --check` reports added blank lines at EOF in `IMPLEMENTATION_LOG_v3.5.18.md` and `app/src/services/database.ts`, outside this part's changes. Visual QA of a populated school profile and report templates remains unverified. The earlier SF10 historical component lint findings are pre-existing state-loading effect errors. No installer was built.

### Test coverage audit

`npm test -- src` is the full automated test run. It executes synthetic unit/integration tests across 106 test files; 105 files passed and one file was skipped. The skipped suite is `test-client-snapshot-restore.test.ts`: its five client-data diagnostics are guarded by `describe.skipIf(!hasSnapshot)` and require a developer-supplied `FORMEASE_CLIENT_SNAPSHOT_PATH`. They were not run because no snapshot was provided.

| Coverage area | Automated evidence already present | Remaining validation |
| --- | --- | --- |
| Grade calculations and statuses | `grade-calculation.test.ts`: shared quarterly finals, provisional/completed status, offered-term averages, weighted averages, SF9 average, and full/partial/missing MAPEH/EC-MK component groups. `GradeStatusMarker.test.tsx` checks marker rendering. | Approved curriculum fixtures and visual fit on actual populated report/print layouts. |
| Grade 11 offered terms and electives | `g11ElectiveOfferedTermsGrayOut.test.ts`, `shsSingleTermConsolidatedGrades.test.ts`, and `grade11TermSubjectResolution.test.ts` cover schedule resolution, gray-out/missing behavior, and single-term vs core subjects. | Compare each configured local track/section against school-approved teaching-load fixtures. |
| Grade write integrity | `grade-record-service.test.ts` and grading-slice tests cover atomic raw/official/HPS commits, abort rollback, ownership preservation, section/year scope, perfect manual override resolution, ordered rapid writes, and a failed write preserving committed state. | Exercise edit -> navigate -> read/export using a real application profile; test two independent windows and delayed encryption. |
| E-Class persistence and composites | `eclassRecordSubjectPersistence.test.ts`, `eclassRecordSummarySync.test.ts`, `eclassSyncTeachingLoad.test.ts`, `subjectSyncWorkflow.test.ts`, and `gradingImprovementsWorkflow.test.ts` cover subject separation, summary sync, teaching load, report mapping, and missing composite components. | Run UI editing and clearing workflows in the packaged app; add confirmed legacy reconciliation preview/undo acceptance coverage. |
| SF9, SF10, and temporary slips | `subjectSyncWorkflow.test.ts`, SF9 template/render/print tests, `sf10SubjectCustomization.test.ts`, and `temporaryGradeSlip.test.ts` cover subject mapping, averages, customizations, print configuration, and the slip's completeness gates. | Compare every supported template visually and verify prior-year overrides/history survive real migration/restore. |
| Excel exports/imports | Grade-level SF9 exporter tests, both Grade 12 cross-track exporter tests, `shs-g12-excel-export.test.ts`, and `consolidated-export-service.test.ts` cover workbook mappings, grade calculations, structure, and representative exports. | Visual review of generated workbooks with real templates, policy-approved expected values, and large-class performance. |
| Backup capture, integrity, restore, and pairing | `backup.test.ts`, `backup-compatibility.test.ts`, `backup-files.test.ts`, `automated-backup-pair.test.ts`, `snapshot-preview.test.ts`, `backup-integrity.test.ts`, `backup-import.test.ts`, `backup-restore.test.ts`, and `backup-full-restore-check.test.ts` cover synthetic snapshot/read failures, checksums, compatibility, pair verification, and restore behavior. | Packaged cold-restart on a differently keyed profile; real disk-full, open-workbook, disconnected destination, process-termination, and retry tests. |
| Application lifecycle and release | TypeScript compile, scoped ESLint, full test suite, Vite production build, and unpacked Windows x64 Electron startup smoke test passed using a new isolated user-data directory. | Installer, cold login/restore, updater safety, cross-window revision conflict, populated-profile visual QA, and Release A/B gates are not complete. |
| Performance and portability | Synthetic logic and isolated fake-IndexedDB tests run in the full suite. | Benchmark 50 learners and 10,000 synthetic learners; test browser fallback and packaged Windows paths on target configurations. |

Items above describe automated coverage that exists; they do not imply every scenario in section 8 has passed. In particular, no populated real profile was opened for visual QA, no school-approved curriculum fixture set was supplied, no packaged candidate was built, and no Release A/B acceptance run was performed.

The baseline working tree already contained extensive unrelated/uncommitted changes. They have been left in place; this progress record describes only the implementation scope above and should not be read as validation of the other changes.
