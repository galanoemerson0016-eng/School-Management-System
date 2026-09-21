# FormEase Pro v3.5.18 implementation log

## Baseline

- Starting branch/commit: `main` / `70c5bd56a3e3b60aafcc6e482584892c34f718b0`
- Stabilization branch: `fix/v3.5.18-data-integrity`
- Starting package version: `3.5.17`
- Initial Git state: clean; no untracked files.
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

## Test status

- Focused regression suite: **22 passed, 4 files**.
- Full test suite, final production build, Windows/macOS builds, CI release gate, synthetic snapshot fixture, and password-recovery continuity are **not yet passed**. No release is authorized.
