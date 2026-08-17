---
title: Pre-Flight QA & Smoke Testing Checklist
tags:
  - qa
  - testing
  - quality-assurance
  - release
created: 2026-08-17
---

# 🧪 Pre-Flight QA & Smoke Testing Checklist

Mandatory verification checklist to execute before publishing any production release to prevent client-side data loss or regression issues.

---

## ✅ Pre-Flight Release Checklist

### 1. Automated Test Suite
- [ ] Run `npx vitest run` in `app/` $\rightarrow$ **100% test pass rate required** (94/94 tests).
- [ ] Database Encryption / Decryption unit tests pass.
- [ ] Grading helper transmutation unit tests pass.
- [ ] Emergency password recovery master key unit tests pass.

---

### 2. Manual Smoke Test Flows

| # | Test Area | Verification Steps | Expected Result | Pass/Fail |
| :-: | :--- | :--- | :--- | :-: |
| **1** | **E-Class Record** | Open Grade 10 section $\rightarrow$ Select Filipino $\rightarrow$ Enter scores for WW/PT/QA. | Initial grade & transmuted grade calculate accurately. | [ ] |
| **2** | **Subject Sync** | Rename a subject $\rightarrow$ Check Section dropdowns. | Renamed subject appears cleanly without missing student rows. | [ ] |
| **3** | **SF9 Generation** | Open SF9 Card $\rightarrow$ Toggle Front/Back preview $\rightarrow$ Export PDF. | All 4 quarters and general average render in high resolution. | [ ] |
| **4** | **SF10 Transcripts** | Open SF10 $\rightarrow$ Select multi-year records. | Multi-grade tables populate with valid passing remarks. | [ ] |
| **5** | **Backup & Restore** | Create full `.json` backup $\rightarrow$ Restore snapshot. | All student records, sections, and grades restore intact. | [ ] |
| **6** | **Recovery Key** | Enter `formease` in password recovery. | Username is revealed and new password can be assigned. | [ ] |

---

### 3. Build & Artifact Verification
- [ ] `tsc -b` completes with 0 errors.
- [ ] `vite build` completes with 0 errors.
- [ ] `npm run obfuscate:electron` executes successfully.
- [ ] `version` in `package.json`, `update-store.ts`, `VERSION_HISTORY.md`, and `SettingsPage.tsx` are aligned.

See also:
- [[01 - 🏗️ Build, Packaging & Release Pipeline]]
- [[02 - 🚀 v2.11.2 Release Notes]]
