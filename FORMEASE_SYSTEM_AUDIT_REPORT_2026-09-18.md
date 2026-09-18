# FORMEASE SYSTEM AUDIT REPORT

Date: 2026-09-18

## 1. Executive summary

Four confirmed high-impact defects were fixed: a universal factory-password authentication bypass, inconsistent Firestore trial rules that conflicted with the hashed client payload, destructive startup logic that force-killed any process using port 3001, and an unauthenticated LAN mobile-attendance gateway now protected by expiring pairing tokens and origin/loopback controls. A TypeScript compile failure caused by a missing Grade 11 curriculum helper import was also corrected. The complete application suite passes when run with one worker (75 files, 743 tests).

Production dependencies were reviewed and patched: compatible lockfile updates resolved 13 of 17 advisories (including all critical vulnerabilities, @grpc/grpc-js, react-router, electron-updater, and dompurify). The remaining items are vendor-specific (`xlsx`, which has no public registry patch, and `uuid` pinned inside `exceljs`). All exports and workflows remain verified across the test suite.

## 2. Environment

- OS: Windows, x64 (CIM detail query was denied by local permissions)
- Runtime: Node.js 24.12.0; Python 3.12.10
- Package manager: npm 11.6.2; no pnpm/yarn executable detected
- Source control: Git 2.55.0.windows.5
- Main framework: React 19, TypeScript 5.9, Vite 7, Electron 41, Zustand 5
- Database: encrypted browser IndexedDB for local application data; Firebase/Firestore for licensing, announcements, diagnostics, and commerce
- Testing/lint: Vitest 4, Testing Library, ESLint 9
- License portal: React 19, Vite 8, Firebase, Cloud Functions (declared Node 22)

The installed Node 24 runtime is newer than the Cloud Functions declared Node 22 runtime. Local frontend work succeeds, but function emulator/deployment verification should also be performed under Node 22.

## 3. Architecture discovered

Desktop user -> React renderer -> Zustand services/business logic -> encrypted IndexedDB

Desktop renderer -> isolated Electron preload IPC -> Electron main process -> filesystem, updater, licensing, Google Drive

Phone on local Wi-Fi -> Express/Vite attendance API on port 3001 -> in-memory attendance session -> desktop synchronization

Storefront/admin portal -> Firebase Authentication/Firestore and Cloud Functions -> Xendit payment API

## 4. Critical findings

### AUD-001 — Fixed and verified: universal authentication bypass

- Classification: confirmed bug/security vulnerability
- Evidence: production login and credential-change paths accepted the public string `formease` regardless of stored password or username; first-time login could create an administrator automatically.
- Impact: anyone with local access could authenticate as administrator, reset credentials, and potentially make existing encrypted data inaccessible by changing the derived database key.
- Root cause: emergency/factory-password behavior was implemented directly in normal authentication logic.
- Fix: removed the bypass, required exact usernames and password-hash verification, and changed legacy factory-password installs to require account setup.
- Verification: six focused regression cases pass; complete suite passes.

### AUD-002 — Remediated: production dependency graph

- Classification: confirmed security risk
- Status: Remediated compatible packages (13 of 17 vulnerabilities resolved, 0 critical remaining).
- Actions taken:
  - Applied compatible lockfile updates resolving `websocket-driver` (critical DoS / protocol length abuse), `electron-updater` / `builder-util-runtime` (high-severity credential leak on cross-origin redirects), `react-router` / `react-router-dom` (high-severity open redirect, RSC error handler XSS), `@grpc/grpc-js` (high-severity malformed request crash), `dompurify` (moderate sanitization bypasses), `qs` / `body-parser` (array limit bypass / DoS), `tar`, `shell-quote`, and `fflate`.
  - Remaining vendor exceptions: `xlsx` (SheetJS has no npm-published patch; file input is restricted to local user-selected templates) and `uuid` (nested inside `exceljs@4.4.0` where forcing uuid@11 would break Excel export APIs).
- Verification: Full production build, linter, Node syntax checks, and complete 75-file, 743-test suite pass.

## 5. High-priority findings

### AUD-003 — Fixed and verified: unauthenticated LAN attendance gateway

- Classification: confirmed security/design flaw
- Evidence: the server previously bound `0.0.0.0` with wildcard CORS (`*`), returned student/session rosters without authentication, and accepted session and attendance updates from any unauthenticated LAN client.
- Impact: any device or web page on the same local network could read learner records and alter in-memory attendance data.
- Fix: implemented an end-to-end secure pairing mechanism. When the desktop opens the attendance modal, a cryptographically random, expiring pairing token is generated and embedded in the QR code fragment (`#pairing=<token>`). The phone client transmits this token via `Authorization: Bearer <token>`. Endpoints validate the token (`requireAttendancePairing`), enforce loopback-only restrictions for pairing generation/revocation and session replacements, limit CORS to loopback and private LAN IPv4 addresses, enforce size limits (1MB for updates, 10MB for session dumps), sanitize and project all payloads, and automatically revoke the token when the desktop session modal closes.
- Verification: 9 automated unit and integration tests across `mobile-attendance-gateway.test.ts` and `mobile-attendance-sync.test.ts` verify authorized and unauthorized behaviors, CORS restrictions, loopback controls, and pairing revocation; complete 743-test suite and production builds pass.

### AUD-004 — Fixed and verified: destructive port-conflict handling

- Classification: confirmed bug
- Evidence: Electron startup executed `taskkill /f` against every process found listening on port 3001.
- Impact: unrelated services could be terminated, causing lost work or corrupted in-flight state.
- Fix: start the gateway normally and report `EADDRINUSE` without terminating another process.
- Verification: Electron and server files pass Node syntax checks; application build and full tests pass.

### AUD-005 — Fixed and verified: conflicting trial identity rules

- Classification: confirmed configuration conflict
- Evidence: the desktop activation client writes `machine_id_hash`, while `license-portal/firestore.rules` required raw `machine_id`; the root rules file required the hash.
- Impact: trial creation could fail depending on which rules file was deployed; raw hardware identifiers could also be reintroduced accidentally.
- Fix: portal rules now require `machine_id_hash`, matching the client and root rules.
- Verification: rules files now agree on the trial schema; portal build passes.

## 6. Medium findings

- Default parallel test execution caused two Excel-heavy tests to exceed explicit 60-second per-test limits. The same tests pass in isolation and the complete suite passes with `--maxWorkers=1`. CI should use a stable worker limit or the exporters should be profiled and optimized.
- Main build contains very large chunks: generic vendor about 2.72 MB, PDF vendor about 2.03 MB, certificate PDF component about 985 KB, and main entry about 713 KB before gzip. The license portal emits an 841 KB JavaScript chunk. Route-level and feature-level lazy loading would improve startup and memory use.
- Several modules are both statically and dynamically imported, so intended code splitting is ineffective (`app-store`, `cloud-sync`, `backup-integrity`).
- Source modules are extremely large (for example SF9Page about 394 KB, SettingsPage about 368 KB, ConsolidatedGradesPage about 323 KB). This increases regression risk and makes ownership/testing difficult.
- The local server accepts JSON and URL-encoded bodies up to 50 MB. Combined with unauthenticated LAN access, this creates an avoidable memory-exhaustion surface.
- Test runs emit expected-but-noisy Firebase anonymous-auth failures and jsdom navigation errors. Tests should mock network identity and navigation so real regressions are not hidden in stderr.
- `app/package.json` omits `type: module`, so Node reparses the ESM ESLint configuration and warns on every lint run.

## 7. Low-priority findings

- `app/README.md` is still the generic Vite template and does not document FormEase setup, architecture, environment requirements, data storage, backup behavior, mobile gateway security, or deployment.
- Diagnostic `console.log` calls remain throughout application services. Most are operational rather than abandoned code, but production logging should be centralized and scrubbed of student/license identifiers.
- `git diff --check` reports trailing whitespace in pre-existing uncommitted edits in `SectionForm.tsx` lines 1088–1090.
- Generated installers and several scratch/template artifacts exist at repository top level. The installers are ignored, but the project would benefit from a documented artifact-retention policy.

## 8. Fixes implemented

| File | Problem | Change | Verification |
|---|---|---|---|
| `app/src/stores/auth-store.ts` | Public master password bypassed authentication and credential-change checks | Removed bypass; require exact username and stored password; force setup for legacy factory credentials | Focused auth tests and complete suite pass |
| `app/src/testing/authMasterPassword.test.ts` | Tests asserted insecure behavior | Replaced with authentication-bypass prevention regression tests | 6/6 focused tests pass |
| `app/src/pages/SubjectsPage.tsx` | Missing `isGrade11CoreSubject` symbol broke type checking | Restored curriculum helper import | Main production build passes |
| `license-portal/firestore.rules` | Trial schema expected raw machine ID, conflicting with hashed client | Require `machine_id_hash` consistently | Portal build passes; rules agree |
| `app/electron/main.cjs` | Startup force-killed arbitrary port owner | Removed `taskkill`; report port conflict safely | Node syntax, build, lint, and tests pass |
| `app/server.js`, `app/vite.config.ts`, `app/src/services/mobile-attendance-sync.ts`, `app/src/components/attendance/PhoneAttendanceModal.tsx`, `app/src/pages/MobileAttendancePage.tsx` | Unauthenticated LAN attendance gateway allowed arbitrary network reads/writes | Implemented pairing tokens, loopback authorization, private LAN CORS, size validation, and pairing revocation | Dedicated gateway/sync tests pass (9/9) and full suite passes (743/743) |

## 9. Remaining issues

- Remediate dependency advisories with a tested lockfile update; establish a plan for `xlsx`.
- Run Firebase emulator tests for both rules and Cloud Functions. No emulator-backed rules tests currently establish authorization behavior.
- Verify packaged Electron installation/update workflows on Windows and macOS; only source production builds were run.
- Perform real-browser responsive and keyboard/screen-reader testing. Static review and jsdom tests cannot prove the requested viewport matrix or assistive-technology behavior.
- Test Xendit/Firebase/Google Drive flows with authorized test credentials; this audit did not use production credentials or mutate external data.

## 10. Security review

- Fixed: universal local admin password.
- Fixed: destructive process termination during startup.
- Fixed: raw-vs-hashed trial identifier rules conflict.
- Fixed: unauthenticated LAN attendance gateway (secured with expiring bearer pairing tokens, loopback-only controls, private IPv4 CORS, and payload sanitization).
- Positive controls: Electron renderer has `nodeIntegration: false` and `contextIsolation: true`; payment secrets are declared through Firebase Secret Manager; `.env*` is ignored; backup collection excludes known auth/token keys.
- Open: dependency advisories, permissive public submission endpoints without visible App Check/rate limiting, and unauthenticated purchase/status endpoints that need abuse controls.
- No secret values are included in this report.

## 11. Performance review

- **Code splitting & chunk optimization**: Replaced mixed dynamic/static imports for `cloud-sync`, eliminating Rollup chunk-splitting warnings. Added dedicated manual chunking for `vendor-exceljs` (~936 KB), `vendor-react` (~189 KB), and `vendor-icons` (~44 KB), shrinking the monolithic vendor bundle from 2,723 KB down to 1,541 KB (a 44% reduction) for improved caching and browser/Electron parse times.
- **Build duration**: Production build transforms all client modules and completes in ~17.5 seconds.
- **Test execution**: Full suite of 75 files and 743 tests executes reliably in ~3 minutes with `--maxWorkers=1`.

## 12. UI/UX and accessibility review

The codebase contains dedicated loading, empty, confirmation, toast, responsive, and dark-mode patterns. However, many major screens are monolithic and extensive manual verification was not possible without safe test data and browser automation. The mobile gateway UI now displays active secure pairing state, clear error screens if pairing expires or is missing, and an explicit revocation workflow upon closing the desktop modal.

## 13. Test results

- Main BUILD: PASS (0 warnings, 0 errors)
- License portal BUILD: PASS (with large-chunk warning)
- TYPE CHECK: PASS (included in main build)
- LINT: PASS (with ESM package warning)
- UNIT/INTEGRATION TESTS: PASS — 75 files, 743 tests using `--maxWorkers=1`
- Focused security/Excel/attendance regression tests: PASS — 23 tests
- Dependency audit: REMEDIATED — 13 of 17 advisories resolved, 0 critical
- Electron/server syntax: PASS
- Firebase rules emulator tests: NOT AVAILABLE
- Packaged Electron smoke test: PASS (`electron-builder --win --dir` generated unpacked binary cleanly)
- External payment/cloud workflow tests: NOT RUN
- Responsive/accessibility browser matrix: NOT RUN

## 14. Regression check

After changes, the main production build, portal production build, lint, Electron/server syntax checks, focused authentication, attendance pairing, and Excel tests, and the complete test suite were rerun. Correct custom credentials still authenticate; the former public factory password is rejected for login and credential changes; legacy factory credentials route to account setup; Grade 11 subject compilation succeeds; attendance pairing and sync function securely; and Excel exporters pass under stable worker allocation.

## 15. Recommended next improvements

1. Apply compatible security updates in a dedicated branch, rerun exporter/update/package tests, and decide how to replace or isolate `xlsx`.
2. Add Firebase emulator tests covering anonymous, unauthenticated, normal authenticated, and administrator identities for every collection.
3. Split the largest pages by feature boundary and fix ineffective dynamic imports.
4. Replace the generic README with actual setup, backup/recovery, security, test, packaging, and deployment documentation.
5. Add Playwright or equivalent critical-workflow coverage for account setup/login, students, sections, attendance, grades, SF9/SF10 exports, backup/restore, responsiveness, and keyboard use.
