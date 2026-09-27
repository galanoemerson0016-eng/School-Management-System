# FormEase Pro — implementation and release plan

Prepared 27 September 2026 from the completed repository audit. This document proposes the next work; it does not mark that work implemented, authorize production access grants, or certify a release.

Source documents: [audit and bug tracker](AUDIT_2026-09-27.md), [security rollout and recovery procedure](SECURITY_ROLLOUT_2026-09-27.md).

## Outcome and order of work

Deliver a release that preserves historical school records, makes related changes consistently, enforces cloud permissions, recovers from interrupted operations, and passes representative packaged-app acceptance tests.

The desktop critical path is: **preserve baseline → define identity/retention contracts → repair PACE and unsafe cascades → verify backup/recovery → validate packaged application → controlled release**.

Cloud authorization and payment validation form a separate urgent track. They can proceed alongside desktop work and should not wait for a long desktop release cycle if the vulnerable rules are confirmed live. Performance and cosmetic improvements must not delay a verified security correction. Any cloud-only rollout still needs compatibility checks against supported desktop clients.

The audit already supplied local source repairs and tests. Keep those changes and verify their remaining integration boundaries; do not rewrite them unnecessarily. The last recorded baseline is 944 passing desktop tests with five existing skips, seven Electron helper tests and five backend tests. Desktop and portal builds/type checks and desktop lint passed. The default desktop test run also exhibited four heavy-workbook timeouts; a complete two-worker run passed without changing assertions or time limits.

## Ownership and working rules

The roles below describe responsibilities, not a requirement to hire a large team. One implementer may perform several roles, with the school owner reviewing behavior that changes records.

| Role | Responsibility |
|---|---|
| Implementer | Source changes, migration code, focused regression tests and technical documentation |
| QA/reviewer | Independent fixture expectations, error/restart scenarios, report comparisons and acceptance evidence |
| Product/school owner | School-year handling, import reconciliation, deletion/retention meaning, supported workflows |
| Authorized cloud operator | Verified administrator identities, staging/provider configuration, production rollout and access verification |
| Release owner | Package identity, signing/update policy, compatibility matrix, release evidence and rollback decision |

Work in small reviewable changes, each tied to an audit ID. Every change records affected data, intended behavior, failure handling, test results and compatibility consequences. Use synthetic records by default. Use copied school profiles only with authorization and controlled handling. Preserve the existing user-edited architecture document. Keep secrets and learner contents out of logs and test artifacts.

A failed save must not publish success. A partially recovered read must not appear complete. An ambiguous relationship must not be guessed. A migration must be repeatable after interruption and retain the original evidence. These are acceptance requirements for implementation, not just documentation goals.

## Phase 0 — preserve and reproduce the starting point

**Priority:** first. **Owner:** implementer/release owner. **Dependencies:** none.

1. Record the current source revision, pending audit changes and lockfiles. Create a recoverable source checkpoint without overwriting the user's unrelated edits. Split later work into coherent reviewable changes.
2. Confirm the supported Windows/macOS versions, desktop/browser modes, Node/npm versions, older app versions and backup formats that must remain compatible. The functions runtime is currently declared Node 22; test the chosen development/CI runtime against all package roots before standardizing it.
3. Reproduce the bounded-worker test baseline and clean builds in an isolated checkout. Reproduce fresh dependency installation on a clean environment; the previous desktop/portal install checks were dry runs.
4. Create reusable synthetic profiles covering empty data, two school years, duplicate names, temporary LRNs, legacy encryption, malformed rows, same-name subjects in different sections, and a large dataset.
5. Before any real-profile upgrade, obtain independently stored verified backups through a controlled operator procedure. Do not interpret a generated file alone as proof of a restorable backup.
6. Add a work tracker with the task IDs below, owner, dependency, status, evidence link and release-blocking flag. A source fix remains separate from native/cloud acceptance.

**Deliverables:** reproducible baseline, fixture catalog, compatibility matrix and release evidence directory.

**Exit criterion:** another run can reproduce the baseline without accessing production data, and the original source/data state can be recovered.

## Phase 1 — establish shared data rules and mutation boundaries

**Priority:** release-blocking foundation. **Findings:** D03, D07, D09, D10, D11. **Owner:** implementer plus school owner. **Dependencies:** Phase 0.

1. Write a relationship map for learners, school years, enrollment, sections, subjects, grading, observed values, daily attendance, SF2, SF10, PACE and nested award evaluations. Include durable storage and loaded UI consumers.
2. Define which identifiers are stable, which are display labels and which are scoped by school year/section. Stop treating identical names as proof that two entities are the same.
3. Define the mutation sequence: read current records → validate identity/scope/revision → prepare changes → verify revisions and commit → complete required settings journal → refresh affected UI → show success.
4. Extend the existing learner service and database transaction/journal mechanisms. Introduce one documented coordination boundary for competing learner/attendance/grading changes. UI merge prompts must happen outside a held write transaction or mutation lock.
5. Where writes are prepared before the transaction, revalidate relevant revisions inside the write transaction so encrypted-data preparation cannot silently apply a stale plan. Add metadata only through a documented, backward-aware migration; do not invent a new full database design merely to add a lock.
6. Establish supported cross-tab/process behavior. Prefer persisted conflict detection plus an appropriate lock where supported; notifications alone do not prevent lost updates. If a mode cannot safely support concurrent writers, detect it and explain the restriction before accepting edits.
7. Define journal states and restart behavior. If database changes commit but local settings/UI refresh fail, report pending recovery rather than claiming nothing was saved. Block conflicting operations until recovery is complete.

**Decisions to record before affected implementation:** clear-section meaning; permanent-record retention; subject identity/scope; handling unknown historical school years; import duplicate/merge policy. Proposed defaults appear near the end of this plan.

**Exit criterion:** written invariants and tests demonstrate that a conflicting stale writer cannot silently overwrite a newer result, and interrupted journal completion is safely replayable.

## Phase 2 — preserve PACE records by school year

**Priority:** critical release blocker. **Finding:** D08. **Owner:** implementer with school owner/QA. **Dependencies:** Phase 1 identity contract.

**Primary scope:** `app/src/pages/PaceFormPage.tsx`, every PACE reader/writer, SF9/export consumers, learner identity service and backup/restore settings handling.

1. Locate every supported PACE map, subject/domain variant, reader, writer and export consumer. Record the list in migration tests so no legacy access path is accidentally left active.
2. Create one versioned PACE access service. Its identity must include school year and LRN, with subject/domain separation retained. A versioned envelope behind the service can minimize the initial storage change; decide the exact storage location after checking atomicity, size and backup compatibility.
3. Preserve the original legacy maps unchanged as migration evidence. Build the new representation separately, validate counts/identities, then switch the active-format marker through a recoverable commit/journal.
4. Use each legacy record's stored valid school year. Put missing, conflicting or malformed years into a reviewable unresolved set. Never silently assign them to the currently selected year.
5. Make migration idempotent. Detect a previous partial attempt, resume or rebuild from preserved input, and never overwrite a valid migrated record because the source is processed twice.
6. Route all reads/writes and report generation through the service. Remove live fallback behavior that silently serves a different year's record. Keep explicit compatibility import for old backup formats.
7. Update LRN renaming across every year. Refresh loaded PACE/SF10 consumers after identity changes so stale memory cannot write old keys back.
8. Add a backup format/compatibility declaration for the new representation. An older application must not write into a newly migrated live profile unknowingly; document guarded downgrade or restore-into-separate-profile behavior.

**Acceptance tests:** same learner in two years retains independent ratings; editing one year does not change another; all domains export the selected year's values; missing-year records remain preserved and visible; repeated/interrupted migration is safe; quota failure preserves source; old backup import and new backup round-trip succeed; LRN rename updates both years without collisions.

**Exit criterion:** no supported PACE path uses LRN alone as the identity of a multi-year assessment, and all migration inputs are accounted for as migrated or unresolved. Already overwritten history is reported as unrecoverable unless a verified backup supplies it.

## Phase 3 — repair SF1 import and bulk learner actions

**Priority:** critical/high release blockers. **Findings:** D10, D11. **Owner:** implementer/QA. **Dependencies:** Phase 1; final integration with Phase 2.

**Primary scope:** `app/src/stores/app-store.ts`, `learner-record-service.ts`, StudentsPage import flow and BulkStudentModal.

1. Add failing fixtures for temporary-to-official LRN import, failed cascade, duplicate LRNs in one file, two same-name learners and a conflict dialog left open while another edit occurs.
2. Replace the duplicated SF1 cascade with the shared durable learner operation. After each conflict decision, reload the relevant identity/revision before attempting the short write operation.
3. Preserve interactive merge, skip and cancel behavior. Do not hold a database transaction or global queue while waiting for a person to choose fields.
4. Define imports as explicit per-row outcomes unless the product requires all-or-nothing batches: imported, updated, skipped, conflicted, failed and not processed. Successfully completed rows survive a later failure; retry must not duplicate them. Report that distinction clearly.
5. Reject duplicate new identities in bulk-add before writing, or route them to an explicit merge decision. Do not use replacement writes as an implicit create policy.
6. Implement clear-section only after its meaning is chosen. Prefer a current-year membership operation when the intended action is clearing a roster; a destructive learner purge must be a distinct, explicit operation with defined retention and complete relationship handling.
7. Query durable relationships, not only rows currently loaded on screen. Update all affected UI stores after confirmed completion and retain enough identifiers to reconcile partial imports safely.

**Acceptance tests:** interruption during temporary-LRN conversion preserves the original or the complete new identity; duplicate rows cannot replace another learner silently; skipped/cancelled rows remain intact; stale merge decisions conflict visibly; historical grades/SF10/PACE remain according to policy; bulk failure/retry has accurate counts after restart.

**Exit criterion:** every UI path that changes learner identity uses the same tested persistence contract, and every bulk action has an explicit collision and partial-success policy.

## Phase 4 — make section and subject cascades atomic

**Priority:** high release blocker. **Findings:** D04, D07, D09. **Owner:** implementer/QA with school owner. **Dependencies:** Phase 1; coordinate with Phase 3.

1. Trace section rename, subject rename/update/delete and bulk subject deletion across enrollment, grades, class records, teaching/advisory loads and section subject lists.
2. Build a complete change plan from durable scoped records. Include stable IDs and year/section scope; do not remove a subject from unrelated sections solely because the name matches.
3. Execute each logically atomic operation in one supported database transaction, with journal coordination only where settings are involved. For a large operation, design a resumable staged operation rather than silently splitting it into unrelated commits.
4. Publish state and success only after completion. Make failures distinguish unchanged state from a recoverable committed journal state.
5. Add the missing dedicated failure-injection test for section deletion that was already repaired during the audit.

**Acceptance tests:** fail every cascade stage and verify durable consistency after restart; rename into an existing identity is rejected; same-name subjects in separate scopes remain independent; unloaded historical records are handled according to retention policy; concurrent grading/attendance cannot restore an obsolete reference.

**Exit criterion:** no audited section/subject cascade can leave half of its required changes committed or change an unrelated scope.

## Phase 5 — make backup and recovery status trustworthy

**Priority:** release blocker for data migrations. **Findings:** H01, D01/D02/D06, S08, backup-version gaps. **Owner:** implementer/QA. **Dependencies:** begin fixtures in Phase 0; finish against Phases 2–4.

1. Separate complete reads, partial recovery and unreadable/unavailable storage in service results and UI. A failed count is “unknown” or “unavailable,” never a reassuring zero.
2. Preserve opaque unreadable rows. Offer an explicit raw recovery artifact/quarantine view where appropriate; do not expose decrypted school data or secrets in ordinary diagnostics.
3. Extend the existing health check with schema/store availability, raw/readable/quarantined counts, pending journal status, storage availability and last successfully verified backup. Keep checks minimally invasive.
4. Centralize backup schema/version validation. Validate required datasets, types, duplicates and supported versions before changing existing records. Retain documented legacy migrations and reject unsupported future formats with an actionable message.
5. Make preview-database cleanup failure visible and retryable without touching the active profile. Preserve blocked/corrupt evidence for investigation.
6. Verify the sequence: validate → create independent safety backup → apply transaction/journal → verify → restart check. A failed safety backup prevents a destructive restore.
7. Ensure all new PACE/settings data round-trips. Keep device credentials excluded; explain that old exported files may still contain them.
8. Add isolated fault scenarios for quota exhaustion, interrupted restore/journal, invalid encryption key, read-only directory, locked native file and incomplete backup pairs.

**Exit criterion:** valid supported backups restore into an isolated profile with matching records/history; malformed/unsupported backups leave the current profile intact; incomplete recovery is unmistakable; rollback has been rehearsed. JSON/Excel confidentiality and compatibility limitations remain accurately documented.

## Phase 6 — validate and roll out cloud security and payments

**Priority:** urgent independent track. **Findings:** S01–S03, M07, M09. **Owner:** implementer, QA and authorized cloud operator. **Dependencies:** Phase 0 configuration/evidence; does not depend on desktop PACE completion.

1. Add Firestore emulator tests and configuration; the existing payment transaction double is insufficient to certify deployed rules/transactions.
2. Test anonymous, ordinary authenticated and claimed-admin identities for each protected collection and supported public operation. Include direct SDK attempts, malformed public requests, protected-field changes and legitimate desktop activation/read flows so hardening does not accidentally break supported clients.
3. Test real Firestore transaction behavior for callback retries, simultaneous callbacks, serial collision, manual double approval and manual approval racing a webhook. Define paid-after-expired/declined and mismatch reconciliation explicitly; never silently grant multiple licenses or discard a confirmed payment without review.
4. Run Xendit sandbox cases: valid invoice/payment, callback authentication failure, wrong invoice/amount/currency, duplicates, delayed events, provider timeout and partial checkout failure. Record outcomes without credentials or learner data.
5. Add server-side request bounds, appropriate distributed quotas/rate controls, privacy-aware status lookup and minimal diagnostics. Determine endpoint-specific controls so a rate limit does not break legitimate provider retries.
6. Audit each advertised portal product end to end. Mark an unverified workflow unavailable or fix its contract before presenting it as supported.
7. Have the operator confirm project identity and intended administrator UIDs, grant the explicit claim, refresh tokens and verify access in staging. Test ordinary-account denial.
8. Prepare a compatible deployment set and exact order. Typically provision and verify admin claims first, then deploy restricted rules and compatible functions/portal in the rehearsed sequence; do not assume those deployments are atomic.
9. After production rollout, perform authorized positive/negative access and a controlled transaction check. Retain a reconciliation record for pre-existing inconsistent orders. Do not automatically regenerate licenses during cleanup.

**Exit criterion:** emulator and sandbox checks pass; intended admin and public client flows work; ordinary users cannot perform admin operations; duplicate delivery produces one agreed entitlement. Production status remains unverified until actual post-deploy checks pass.

**Rollback:** retain restricted rules. Repair missing intended claims or deploy a compatible corrected portal/function; never restore provider-based administrator access to fix a lockout.

## Phase 7 — close native desktop and end-to-end acceptance gaps

**Priority:** release blocker for shipped platforms/features. **Findings:** S04–S08, M01–M03, M10 and native acceptance gaps. **Owner:** QA/release owner plus implementer. **Dependencies:** candidate from Phases 2–5; staging cloud from Phase 6 for online workflows.

1. Build candidate installers and exercise actual packaged startup, IPC, navigation, external links, print children, PDF/QR output and local files. Verify new Electron helper modules are packaged.
2. Test real safeStorage protection, token refresh, unavailable secure storage, corrupted envelope, reconnect/disconnect and offline startup on each supported platform. Verify prior credentials survive failed replacement.
3. Test setup/login/logout/password change/recovery on copied profiles, including wrong key and interrupted recovery. Confirm repeated auth cycles do not multiply background work.
4. Run authenticated learner/enrollment/attendance/grade/PACE/SF9/SF10 journeys with known expected values. Compare output values, worksheets, formulas, Unicode names, pagination and printed layout with approved fixtures.
5. Test LAN pairing/expired tokens/reconnect, camera and SMS with authorized test destinations. Do not send test messages to real learners/parents.
6. Exercise unsaved-change prompts, Enter/double-click, navigation/cancel, loading/failure/empty states, keyboard focus, zoom/reflow, contrast and screen readers in the important forms/grids.
7. Test fresh install and upgrade from supported older releases, interrupted update, failed migration, reopening and documented rollback. Preserve current profiles even when reverting the executable.
8. Inspect and document package signing/update authenticity. Current build configuration disables forced signing; a successful build is not evidence of a signed/trusted installer. Rehearse the chosen production signing/distribution policy.

**Exit criterion:** supported platform/feature matrix has evidence for critical paths, with no unresolved data loss, unauthorized operation, unusable recovery, or unexplained report discrepancy. Unsupported combinations are documented explicitly.

## Phase 8 — dependency, performance and engineering reliability

**Priority:** before release for demonstrated regressions; otherwise next maintenance release. **Findings:** M05, M06, L01–L04. **Owner:** implementer/QA. **Dependencies:** baseline; performance validation on the stabilized candidate.

1. Re-run dependency audits when selecting the release candidate. Review actual affected code paths; do not equate advisory counts with proven exposure. Upgrade remaining UUID/OpenTelemetry parent chains in isolated changes, avoiding forced ExcelJS downgrade or untested Firebase Admin major upgrades.
2. After each relevant dependency change, run template/workbook tests, cloud integration tests or native packaging checks as appropriate. Keep lockfiles synchronized.
3. Make CI worker count explicit and sized to runner resources. Keep original assertions and meaningful time limits. Investigate the four workbook timeouts with duration/memory evidence; separate slow integration jobs if justified.
4. Standardize tested Node/npm configuration and documentation. Source version reporting from build/package metadata. Correct diagnostic version, README port/version/count and clean-install instructions.
5. Resolve ESLint module-mode warnings without breaking CommonJS tooling; isolate unsupported jsdom navigation at the test boundary without suppressing real errors.
6. Benchmark realistic small/medium/20,000-record fixtures on a documented reference machine. Record cold start, search, grade edits, imports, reports, backup/restore, peak memory and long-operation feedback.
7. Set budgets from the baseline and school hardware needs. Apply code splitting, indexed queries, pagination/virtualization or off-main-thread work only where measurements identify a bottleneck; preserve export/report fidelity.

**Exit criterion:** reproducible CI, no unaccepted exploitable dependency risk, accurate version/runtime documentation, and no unexplained regression in candidate performance. Remaining moderate advisories need an explicit disposition with owner and follow-up, not a blanket “clean” claim.

## Phase 9 — release review, pilot and wider rollout

**Priority:** mandatory release gate. **Owner:** release owner, QA, school owner, cloud operator. **Dependencies:** all applicable release blockers above.

1. Assemble one candidate containing source/lockfile identifiers, installer hashes/signing result, supported versions, test logs, migration evidence, report samples, known limitations and recovery instructions.
2. Re-run the final pipeline after the last source/dependency change. Inspect the final diff, generated Electron artifacts and packaging contents. Do not infer success from an earlier candidate's logs.
3. Perform the full backup/restore/restart drill on a representative copied profile, including each new migration. Record counts and selected academic values, not just “opened successfully.”
4. Review school-owner acceptance of year mapping, import resolution, clear-section/retention and report behavior. Ensure ordinary users receive clear instructions where manual reconciliation is required.
5. Deliver to a small, explicitly selected pilot group with a verified backup for each profile. Include real roster editing, attendance, grading, year selection, report output, backup and restart during the pilot; elapsed time alone is not acceptance.
6. Watch for failed/pending migrations, partial imports, unknown health counts, duplicate entitlement attempts and native crashes through minimal, consented diagnostics. Stop widening rollout on unexplained data mismatch or security failure.
7. Expand only after pilot evidence is accepted. Preserve previous installers and verified pre-upgrade profiles. Downgrades must not discard post-upgrade records or feed a new data format to an incompatible older writer; export/reconcile new work before a controlled rollback.

**Go/no-go requirements:** no open critical data-loss issue; no known unaddressed critical cloud exposure; atomic cascade/concurrency/recovery tests pass; cloud permissions and payments verified where released; packaged critical journeys accepted; supported reports correct; clean build/type/lint/test pipeline; recovery and rollback rehearsed.

## Phase 10 — follow-on architecture and useful product improvements

**Priority:** after stabilization, except any demonstrated security issue promoted earlier. **Findings:** M08 and maintainability opportunities.

1. Replace client-derived license trust with server-signed entitlements verified using a public key. Design key rotation, existing-license transition, renewal, machine changes and offline grace first. Do not strand legitimate licensed users.
2. Treat multi-user school roles as a separate feature: define principals, ownership and a trusted enforcement layer before claiming role security. Keep the current local-owner model accurately described meanwhile.
3. Gradually move academic data behind consistent versioned services, reducing scattered localStorage/Zustand persistence. Avoid another broad migration until the new tests and recovery tools make it safe.
4. Consolidate development/production gateway logic with shared contract tests. Refactor large stores/pages along tested domain boundaries.
5. Add reversible deletion/audit history, import previews with row-level reconciliation and saved filters only where confirmed workflows benefit. Extend existing backup history/health/recovery features rather than duplicating them.

**Exit criterion for each follow-on feature:** a specific user need, a compatibility plan, focused tests and measured benefit. It does not inherit release approval merely because it was listed here.

## Decisions and proposed defaults

These do not block drafting or preliminary tests. Resolve them before implementing the affected behavior or performing production operations.

| Decision | Proposed default | Required before |
|---|---|---|
| PACE entry has no trustworthy year | Preserve in unresolved history; ask for explicit mapping; do not infer current year | Phase 2 migration activation |
| Same-name learners or subjects | Treat as separate until stable identity/scope proves otherwise | Phases 3–4 |
| SF1 row failure | Explicit per-row results; preserve successful rows; retry only unresolved work | Phase 3 UI/service contract |
| Existing LRN during bulk create | Reject as duplicate or offer explicit merge; never silently replace | Phase 3 |
| Clear section | Recommend removing current-year membership while retaining permanent history; confirm intended semantics | Phase 3 |
| Delete learner/subject history | Separate removal from active use and permanent purge; preserve history by default | Phases 3–4 |
| Supported concurrent writers | Detect/reject stale writes; document any temporarily unsupported mode | Phase 1/acceptance |
| Supported products/platforms | Publish only tested combinations; resolve incomplete portal/Android scope | Phases 6–9 |
| Cloud administrator | Verified UID in verified project, selected by authorized operator | Phase 6 deployment |
| Signing and offline license policy | Document product/support requirements, then implement and rehearse transition | Phases 7/10 |

## Existing commands and additional tests to add

The following commands already exist or were used in the audit; run them from the repository root. They do not deploy or send production requests.

```powershell
npm --prefix app run lint
npm --prefix app test -- --maxWorkers=2
npm --prefix app run build
node --test app/electron/backup-files.test.cjs app/electron/security.test.cjs app/electron/token-store.test.cjs
npm --prefix license-portal run build
npm --prefix license-portal/functions test
npm --prefix app run release:check
git diff --check
```

Before the final candidate, validate dependency trees in all three package roots, audit resolved dependencies and rehearse clean installation. Add the new PACE/import/cascade/concurrency/recovery regressions to the desktop suite. Add emulator and browser/native acceptance jobs deliberately; these are planned additions, not existing verified scripts. Run focused tests after each batch and the full applicable pipeline at candidate boundaries. Record old skips and every new skip explicitly; passing a reduced selection does not certify the full release.

## Work-package index

| Package | Scope | Finding coverage | Depends on | Completion evidence |
|---|---|---|---|---|
| A | Baseline and compatibility fixtures | All existing fixes; validation limitations | None | Reproduced baseline and recovery checkpoint |
| B | Mutation/identity contracts | D03, D09 | A | Revision/conflict/journal tests |
| C | PACE versioning/migration | D08 | B | Two-year and migration/backup fixtures |
| D | SF1 and learner bulk operations | D10, D11 | B; integrate C | Failure/retry/merge tests and UI results |
| E | Section/subject cascades | D04, D07 | B | Scoped failure/restart fixtures |
| F | Recovery visibility/backup validation | H01, D01, D02, D06, S08 | A; integrate C–E | Restore drill, counts and raw evidence preservation |
| G | Cloud security/payments/abuse | S01, S02, S03, M07, M09 | A | Emulator, sandbox and deployed access results |
| H | Native, reports and UX acceptance | D05, S04–S08, M01–M03, M10 | C–F; G for online flows | Packaged platform/feature matrix |
| I | Dependencies, performance and CI/docs | M04–M06, L01–L04 | A; stabilized candidate for profiling | Repeatable jobs, audits, measurements |
| J | Candidate/pilot/release | All release blockers | B–I as applicable | Signed-off evidence and rollback rehearsal |
| K | Licensing and architecture | M08; future improvements | Stabilized contracts | Separate feature acceptance |

The first implementation batch should establish A/B and introduce failing PACE/import fixtures. The first finished desktop repair should close D08, followed by D10/D11 and D07. The cloud G track can proceed independently from A. No production release should be scheduled solely from estimated coding time: the migration, provider and native acceptance evidence determines readiness.
