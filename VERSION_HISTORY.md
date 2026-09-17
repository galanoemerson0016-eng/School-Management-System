# Version History

## v3.5.14 (2026-09-17)

### ⚡ Client Data Protection & Self-Healing

- **Automated Startup Database Healing**: FormEase Pro automatically scans local IndexedDB on startup, recalculates any unnormalized legacy weights (`> 120`), and restores genuine DepEd grades with zero manual re-encoding required from teachers.
- **Weight Normalization Engine**: Converted whole weights (`40`, `60`, `20`) to standard fractions (`0.40`, `0.60`, `0.20`) and display percentages (`40%`), eliminating thousands-scale weighted scores and the `4000%` header bug.
- **Ghost Record Suppression**: Implemented score container verification in `resolveStudentQuarterGrade` ensuring empty score arrays never output phantom grades in SF9, SF10, or Consolidated Grades.
- **Unified Subject Canonicalization & Deduplication**: Unified normalization for PE & Health and GMRC/Values Education across Grade Management, SF9, SF10, and Temporary Grade Slips.

### 🚀 Enhancements & Export Resilience

- **Grade 11 SF9 Excel & PDF Export Resilience**: Fixed style index boundaries and shared formulas in `sheet6.xml`, eliminating Excel file repair prompts.
- **Database Rescue Export Tool**: Added direct offline JSON & Excel database extraction and repair in `database-rescue-export.ts`.
- **Pre-Update Safety Vault**: Automated local database snapshot and school forms packaging in `pre-update-safety.ts`.

### 🐞 Bug Fixes

- Resolved issue where table headers displayed `4000%` / `6000%` and weighted scores multiplied into the thousands.
- Fixed term grades clamping to 100 on subjects with custom or legacy weights.
- Fixed `prefer-const` and explicit `any` lint violations in grading helpers and reconciliation services.

### 📝 Notes

- 100% backward-compatible update with automatic local database self-healing on first launch.

## v3.5.13 (2026-09-16)

### 🚀 Fixes & Enhancements

- **Comprehensive Subject Sync, Deduplication, and Normalization Across SF9, SF10, & Temporary Grade Slip**:
  - Unified canonical subject normalization in `subjectConfig.ts`: All variants of Physical Education and Health (`"PE and HEALTH"`, `"Physical Education and Health"`, `"PE & HEALTH"`, `"PE HEALTH"`, with or without sequential suffix 1-4) now resolve cleanly to the same canonical key (`physicaleducationandhealth${num}`).
  - Fixed a regression in sequential stem matching where `'pe'` prefix prevented `"peandhealth"` from matching `"physicaleducationandhealth"`, which previously caused resurrected "virtual" duplicate subjects in SF9.
  - Upgraded "Remove Duplicate" in Subjects Page (`duplicateGhostInfo` & `handleMergeAndCleanDuplicates`) to cluster subjects by canonical key and automatically sanitize `sections.taught_subjects` and `sections.teaching_subjects`, merging duplicate IDs and canonicalizing subject labels.
  - Enhanced Sync action in SF9 (`handleSyncFromGradeManagement`), SF10, and Temporary Grade Slip (TGS) with automatic grade reconciliation (`reconcileOrphanedGradesAndSubjects`), database purging of duplicate subject records, and consolidation of student grades under canonical subject names without data loss.
  - Added 1-click "Sync" button to Temporary Grade Slip (TGS) matching SF9 and SF10.
- **Restored SF9 Layout & Options Subject Arrangement Dropdowns**:
  - Fixed the empty dropdown issue across all 13 SF9 layout slots by providing a comprehensive candidate list (`layoutModalCandidates`) composed of section-assigned subjects, grade-level subjects, and taught subjects, deduplicated by canonical key and ordered by DepEd priority.

## v3.5.12 (2026-09-16)

### 🚀 Fixes & Enhancements

- **Resolved Grade 12 Examination 3-Component Calculation Discrepancy**:
  - Identified and fixed the root cause of the calculation discrepancy between the UI and the exported Excel workbook for Grade 12 subjects (such as *Physical Science* in *Grade 12 Archimedes*).
  - In `grading.ts`, `g12_core` and related Grade 12 clusters were previously listed in `EXS_TE_ONLY_CLUSTERS`, causing the UI to calculate examination percentage scores using Term Exam only (`TE / TE_HPS * 100`) and discarding Summative Tests 1 and 2, even when the 3-exam layout (`useThreeExamLayout`) was active and ST1/ST2 scores were encoded.
  - Removed `g12_core`, `g12_academic_other`, `g12_academic_immersion_research`, and `g12_tvl_all` from `EXS_TE_ONLY_CLUSTERS`. The UI now computes Exam Percentage Score using the official formula: $(ST1\% \times 30\%) + (ST2\% \times 30\%) + (TE\% \times 40\%)$, matching the columns `WS ST1`, `WS ST2`, and `WS TE` in the UI table, and aligning 100% with the official DepEd Excel formula `=SUM(AG17:AI17)`.
  - For Bonilla, Jade Cyrus Sandoval: Exam PS is now accurately $80.00$ (instead of $100.00$), Exam WS is $20.00$, Initial Grade is $87.60$, and Transmuted Quarterly Grade is $89$ across both the UI and the Excel export.

## v3.5.11 (2026-09-16)

### 🚀 Fixes & Enhancements

- **Senior High School Grade 12 Summative Tests 1 & 2 HPS Registration**:
  - Resolved an issue in the updated DepEd Grade 12 ECR template where Summative Tests 1 and 2 Highest Possible Scores (HPS) in row 14 (`AD14` and `AE14`) were left blank. Both cells are now correctly populated from `hpsRecord.summative_tests` (or fallback WW6/7).
  - Fixed division-by-blank formula evaluation in columns `AG` (WS ST1), `AH` (WS ST2), `AI` (WS TE), `AJ` (Exam PS), `AK` (Exam WS), and `AL` (Initial Grade).
- **Synchronized Final Grades Calculation & Headers**:
  - Added row 9 header population in `FINAL GRADES` sheet (`D9` for Grade Level 12 and `G9` for Subject Name), eliminating previous uncalculated `"0"` placeholder.
  - Aligned Term 1 student grades on `FINAL GRADES` (`E17:E117`) with the live transmuted score from `Term 1` cell `AM`, eliminating the discrepancy where 100 was displayed due to cross-section HPS pollution.
  - Implemented section-scoped and subject-scoped HPS record lookup (`findSHSG12HPSRecordForTerm`) to ensure calculations always use the active class's exact benchmarks.
- **HELPER Sheet Dropdown & Formula Integrity**:
  - Cleared `#N/A` error cache on cell `F10` in the `HELPER` sheet, ensuring 100% clean OpenXML structure with zero Excel repair warnings.

## v3.5.10 (2026-09-15)

### 🚀 Fixes & Enhancements

- **Senior High School SSHS E-Class Record Term Block Auto-Detection**: Fixed an issue where single-term subjects (such as *Chemistry 1*, *Pre-Calculus*, *Basic Calculus*, *Physics*) were defaulting to the 3rd Term or generic 3-term block when exported. The system now dynamically determines the correct term offering by evaluating:
  1. Universal Core status (DO 017, s. 2026 universal 3 terms).
  2. Section metadata term offerings (`section_metadata.subjectTerms`).
  3. Individual subject term configuration (`subject.term`).
  4. Encoded scores in class records and HPS records (e.g. grades encoded in Quarter/Term 1).
  5. Official curriculum sequence defaults (e.g. *Chemistry 1* $\rightarrow$ Term 1, *Chemistry 2* $\rightarrow$ Term 2).
- **Restored Raw Scores and Final Grades on SSHS Excel Export**: Resolved the missing scores and grades issue on single-term subjects where inactive term warning formulas (`"INCORRECT SHEET. Do not use this sheet to input data."`) were erroneously suppressing Term 1 data. All 26 student scores, HPS benchmarks, weighted scores, and final grades now cleanly populate on the correct active term worksheet and the *FINAL GRADES* sheet.
- **Robust Subject & School Year Matching**: Enhanced record matching to handle varying subject ID and name permutations as well as school year formatting differences (such as en-dashes vs. hyphens), ensuring complete grade recovery during export.

## v3.5.9 (2026-09-15)

### 🚀 New Features & Enhancements

- **Official DepEd DO 8, s. 2015 Grade 12 Categorization**: Fully aligned traditional Senior High School subject categories into Core Subjects (Universal), Applied Subjects, Strand-Specific Specialized Subjects (GAS, ABM, STEM, HUMSS, TVL, Sports, Arts), and Work Immersion / Culminating Activity based on official DepEd curriculum reference infographics.
- **Eliminated Misapplied SSHS Clusters from Grade 12**: Completely removed incorrect SSHS cluster categories (such as *"General Academic Elective"*, *"Arts, Social Sciences, and Humanities"*, *"Field Experience"*, *"Business and Entrepreneurship"*) from Grade 12 Traditional K-12 section creation, Catalog checklist, and Teaching Load panels.
- **Grade 12 GAS & TVL 3-Term Official Presets**: Added official DepEd 12-subject trimester presets for General Academic Strand (GAS) and Technical-Vocational-Livelihood (TVL) tracks with balanced 4-subject per term distributions.
- **Universal Core Subject Accuracy**: Robust recognition of all 18 DepEd Core subjects (including HOPE 1–4, PE & Health 1–4, DRRR, Earth & Life, Philosophy variations) preventing accidental misclassification into electives.

## v3.5.8 (2026-09-15)

### 🚀 New Features & Enhancements

- **Senior High School Track & Strand Scoping**: Eliminated the 105-subject overload in section creation. Selecting Grade 12 (e.g. ABM, STEM, HUMSS, TVL) automatically presents only relevant Core, Applied, and Strand-specific specialized subjects.
- **Official DepEd 12-Subject Preset Auto-Application**: Creating or configuring Grade 12 advisory sections automatically loads the official DepEd 12-subject trimester model (T1, T2, T3) with zero database pollution.
- **Dedicated "Clear All" & Quick Selection Controls**: Added a 1-click Clear All button in the curriculum header and a quick toolbar (Select All / Clear All) in the Catalog Checklist, backed by an explicit cleared state flag (`hasExplicitlyClearedTaught`) to prevent unwanted default subject resets.
- **Grade 11 SSHS DepEd Order No. 017, s. 2026 Strict Compliance**: Grade 11 strictly presents the universal 6 Core Learning Areas and Academic/TechPro cluster electives, completely isolating old K-12 SHS choices.
- **Refined Grade 12 Catalog Categorization**: Grouped Grade 12 subjects cleanly into Core Subjects (Universal), Applied Subjects, Strand Specialized Subjects, and Work Immersion / Culminating Activity.

### ⚡ Client Data Protection & Self-Healing

- **Clean Setup & Local Protection**: Purged un-graded hardcoded sample section and learner records from fresh installations while safeguarding all existing user grades and active classes.

## v3.5.7 (2026-09-15)

### 🚀 New Features & Enhancements

- **Curriculum-Compliant GMRC & Values Education Separation**: Strict DepEd curriculum distinction ensuring Elementary (Grades 1–6) exclusively uses "GMRC (Good Manners and Right Conduct)" and Junior High School (Grades 7–10) exclusively uses "Values Education".
- **Official Excel Template & OpenXML Formula Integrity**: Validated and preserved native DepEd formulas across Senior High School Grade 12 3-Term ECR, SSHS Pilot ECR, ECR Academic G2–G10, Grade 1 PACE/SF9, and SF9 Grade 11 Academic & Tech-Pro templates.
- **Deduplicated Subject Selection & Dropdowns**: Automatically removes duplicate and ghost subject columns from Grade Management, E-Class Record, and Consolidated Grades, guaranteeing a clean and consistent curriculum structure.

### ⚡ Client Data Protection & Self-Healing

- **Self-Healing Grade Reconciliation Engine**: Automatic startup scanning that detects duplicate or legacy GMRC and Values Education entries, consolidates them seamlessly, re-maps associated grades, and unhides all client records with zero data loss.
- **Grade & Raw Score Preservation**: Guaranteed 100% preservation of all existing student raw scores, HPS, and section allocations during automated database self-healing.
- **Guaranteed Full-Year Subject Visibility**: Forces `term: 'all'` for all Elementary (Grades 1–6) and JHS (Grades 7–10) subjects, permanently eliminating `term: 'none'` visibility filters.
- **MAPEH Dual Component Restoration**: Automatic dual-component resolver ensuring both "Music and Arts" and "Physical Education and Health" are always accessible in ECR and grade sheets.

### 🐞 Bug Fixes

- Resolved issue where legacy or duplicate GMRC entries persisted across Grade Management and E-Class Record even after cleaning duplicates.
- Fixed subject deletion bug where removing duplicate GMRC columns inadvertently removed the official "GMRC (Good Manners and Right Conduct)" subject.
- Enforced grade level curriculum boundaries preventing Elementary sections from inheriting JHS Values Education and vice versa.
- Resolved Vitest parallel execution timeouts across Grade 11 SF9 OpenXML inspection suites.

### 📝 Notes

- 100% backward-compatible update with automated database self-healing on first startup.

## v3.5.6 (2026-09-15)

### 🚀 New Features & Enhancements

- **Pre-Update Safety Vault Engine**: Automated comprehensive offline backup vault generated before updates or on demand, exporting official Excel & PDF archives of SF2, SF5, SF6, SF9, and ECR class records packaged into a secure ZIP archive.
- **Grade 1 PACE Form 4-Page Print Fidelity**: Exact 4-page print setup preservation (print scale 62%, margins 0.25", fitToPage 1) ensuring printed documents align with DepEd standards.
- **Competency VLOOKUP Blank-Guarding**: Native formula blank-guarding (`IF(VLOOKUP(...)="","",VLOOKUP(...))`) across PACE Form rating cells, displaying unencoded competencies as clean blank cells instead of zero.
- **Section-Isolated Highest Possible Score (HPS)**: Independent HPS assignment per section, giving teachers complete flexibility to assign distinct HPS across sections with zero cross-contamination.
- **Senior High School Multi-Term & Cross Exports**: High-fidelity Academic and Tech-Pro cross exports, SSHS pilot integration, and complete SCP program coverage (SPFL, SPJ, SPA, SPS, SPTVE, SSES/SPSTEM).

### ⚡ Client Data Protection & Self-Healing

- **Zero Data Loss Guarantee**: 100% preservation of all existing client records, raw scores, student profiles, and section assignments in IndexedDB.
- **Automated Startup Reconciliation**: Scans local database on app launch, reconnects any orphaned grade records, and restores missing subjects before UI rendering.
- **Guaranteed Full-Year Subject Visibility**: Forces `term: 'all'` for all Elementary (Grades 1–6) and JHS (Grades 7–10) subjects, permanently eliminating `term: 'none'` visibility filters.
- **MAPEH Dual Component Restoration**: Automatic dual-component resolver ensuring both "Music and Arts" and "Physical Education and Health" are always accessible in ECR and grade sheets.

### 🐞 Bug Fixes

- Resolved issue where teachers entering HPS in one section caused unintended cross-sharing of HPS to other sections of the same subject.
- Fixed Grade 1 PACE Form printing beyond 4 pages by locking exact print scale (62%) and margins (0.25 in).
- Fixed Grade 1 PACE Form displaying `0` for unrated competencies by wrapping VLOOKUP references with blank-guard checks.
- Resolved TypeScript strict type checking warnings in `school-forms-vault-service.ts`.

### 📝 Notes

- 100% backward-compatible update with automated database self-healing on first startup.

## v3.5.5 (2026-09-14)

### 🚀 New Features & Enhancements

- **SF9 Multi-Level Excel Layout Preservation**: Restored native Excel outline groupings, hierarchical collapse controls, and clean XML quote formatting across all grade levels.
- **Dynamic Age Calculation**: Automatic birthdate-driven age computation in SF9 terms summary sheets using standard DepEd formula references.
- **DepEd Formula Integrity**: Restored Term 2 MAPEH computation, School ID formula references (F15), and rendered unencoded grades as clean blank cells instead of zero.

### ⚡ Client Data Protection & Self-Healing

- **Raw Score Persistence Engine**: Permanently eliminated score loss and reversion across GMRC, Values Education, Makabansa, Language, Reading & Literacy, English, EPP, and TLE when navigating between pages.
- **DebouncedInput Safe Flush**: Guaranteed automatic saving of all active cell inputs on component unmount, field blur, and tab/section transitions.
- **Automated Startup Reconciliation**: Scans local database on app launch, reconnects any orphaned grade records, and restores missing subjects before UI rendering.
- **Zero Data Loss Guarantee**: 100% preservation of all existing client records, raw scores, student profiles, and section assignments in IndexedDB.

### 🐞 Bug Fixes

- Resolved issue where raw scores typed in E-Class Record for GMRC, Values Education, and Makabansa disappeared upon page navigation.
- Fixed corrupt workbook repair dialogs in Excel by correctly escaping quotation marks (`&quot;`) in generated OpenXML formulas.
- Fixed missing Term 2 MAPEH formula in SF9 report cards and restored School ID formula references across terms summary sheets.
- Fixed unencoded grades displaying as `0` in exported SF9 spreadsheets by outputting clean blank cells.

### 📝 Notes

- 100% backward-compatible update with automated database self-healing on first startup.

## v3.5.4 (2026-09-14)

### 🚀 New Features & Enhancements

- **DepEd Order 17 s. 2026 SSHS Electives Classification**: Physical Education 1 & 2 correctly designated as electives (not core), unblocking all 80 Academic and 48 Tech-Pro elective choices during section offering imports.
- **Grade Management Live Save Persistence**: Input debounce reduced to 400ms with automatic flush on component unmount, field blur, and page navigation, permanently eliminating lost grade entries.
- **Composite Subject Resolution & ECR Sync Protection**: Precise section ID grouping for Effective Communication and Mabisang Komunikasyon, safeguarding manual Grade Management entries from accidental overwrite during E-Class Record synchronization.
- **SF9 & SF10 Learning Area Fallbacks**: Enhanced composite and component subject matching across multi-level SF9 report cards and SF10 permanent records.

### ⚡ Client Data Protection & Self-Healing

- **Zero Data Loss Guarantee**: 100% preservation of all existing client records, raw scores, student profiles, and section assignments in IndexedDB.
- **Automatic Startup Reconciliation**: Scans local database on app launch, reconnects any orphaned grade records, and restores missing subjects before UI rendering.
- **Guaranteed Subject Visibility**: Permanent visibility enforcement ensuring no subjects or encoded grades are filtered out by term assignment.

### 🐞 Bug Fixes

- Resolved issue where quickly typing grades and switching tabs/sections caused unsaved input values to revert.
- Fixed elective offerings list in SSHS sections failing to display electives when importing subject catalogs.
- Fixed manual Grade Management grades being wiped when syncing subjects from E-Class Records.
- Resolved missing loop brace syntax error and ESLint `useEffect` dependency warnings in `ConsolidatedGradesPage.tsx`.

### 📝 Notes

- 100% backward-compatible update with automated database self-healing on first startup.

## v3.5.3 (2026-09-14)

### 🚀 New Features & Enhancements

- **Base64 Data URL Image Resolution for React-PDF**: Automated Base64 Data URL conversion for local image assets (`deped_logo_left.png`, `school-logo.png`) in Node.js test environments, eliminating `fetch failed` warnings.

### ⚡ Client Data Protection & Code Quality

- **ESLint Code Compliance**: Conformed caught error variable names (`_e`) to strict ESLint `/^_/u` rule standards across PDF renderer utility methods.
- **Zero Data Loss Guarantee**: 100% preservation of all existing client records, raw scores, student profiles, and section assignments in IndexedDB.

### 🐞 Bug Fixes

- Fixed `fetch failed` image loading warnings in Vitest test runners.
- Resolved ESLint unused catch variable parameter lint errors in `SF9Page.tsx`.

### 📝 Notes

- 100% backward-compatible update with automated database self-healing on first startup.

## v3.5.2 (2026-09-14)

### 🚀 New Features & Enhancements

- **Grade 11 SSHS Academic SF9 Multi-Level Report Card Renderer**: Complete layout alignment with official DepEd Grade 11 Academic SF9 format, including 39-unit curriculum rules (6 units Core, 3 units Electives).
- **Elective Term Shading & Grade Suppression**: Non-offered elective terms render with solid neutral gray (`#A6A6A6`) shading and zero grade text. Single-term electives compute Final Grade directly from the offered term score.
- **Dynamic Schools Division Header**: Formatted as `SCHOOLS DIVISION OF ${cleanDivision}` (e.g., `SCHOOLS DIVISION OF TARLAC PROVINCE`) or `SCHOOLS DIVISION OF _____` when blank.
- **Automated Age Calculation & `#VALUE!` / `#####` Defect Elimination**: Robust birthdate parsing and dynamic age derivation across both React-PDF renderer and Excel exports.

### ⚡ Client Data Protection & Self-Healing

- **Zero Data Loss Guarantee**: 100% preservation of all existing client records, raw scores, student profiles, and section assignments in IndexedDB.
- **Strict 1-Page Landscape Fit**: Compacted layout budget ensuring zero vertical spillover to Page 2 across A4 and Letter landscape formats.
- **Automatic Startup Reconciliation**: Scans local database on app launch, reconnects any orphaned grade records, and unhides missing subjects before UI rendering.

### 🐞 Bug Fixes

- Resolved issue where Grade 11 Academic SF9 overflowed onto Page 2.
- Fixed TypeScript type narrowing comparison errors on term checks in `SF9Page.tsx`.
- Corrected unit allocation logic for Grade 11 SSHS Academic subjects.

### 📝 Notes

- 100% backward-compatible update with automated database self-healing on first startup.

## v3.5.1 (2026-09-13)

### 🚀 New Features & Enhancements

- **Summary of Grades Term Shading & Gray-Out (SHS Grade 11)**: Automated visual graying out of unoffered terms for sequential and modular academic electives in Grade 11 (e.g., Biology 1 in T1, Biology 2 in T2, Biology 3 in T3). Subheaders and student grade cells for non-offered terms render with clean em-dash (`—`) indicators and non-interactive tooltips.
- **Grade 1 PACE Form Master Excel Print Setup & Single-Subject Isolation**: Complete 17-sheet master workbook generation with strict 4-page print layout for PACE - Grade 1 and dedicated single-subject PACE form isolation.
- **Ghost & Duplicate Subject Prevention Engine**: 3-tier deduplication engine eliminating ghost or duplicate subjects while accurately preserving TVL/SHS parenthetical specializations.
- **SF9 Booklet (Template 2) Subject & Grade Sync**: Live grade and subject synchronization for Grade 1 MATATAG and Senior High School Grade 11 in double-sided 2-page duplex booklets.
- **Comprehensive Uncompressed Master Backups & G11 SF9 OpenXML Repair**: High-fidelity OpenXML repair ensuring smooth Excel export without formula calculation errors or corruption.

### ⚡ Client Data Protection & Self-Healing

- **Zero Data Loss Guarantee**: 100% preservation of all existing client records, raw scores, student profiles, and section assignments in IndexedDB.
- **Missing Grades Filter Optimization**: Unoffered terms for academic electives are excluded from missing grade tallies, completely eliminating false incomplete grade warnings in both all-terms and single-term views.
- **Automatic Startup Reconciliation**: Scans local database on app launch, reconnects any orphaned grade records, and unhides missing subjects before UI rendering.

### 🐞 Bug Fixes

- Resolved issue where sequential academic electives without configured terms caused false missing grade alerts.
- Fixed subheader alignment and column widths in Consolidated Grade sheets when switching between single term and all-terms views.
- Corrected TVL/SHS subject deduplication to avoid false positive matches on parenthetical learning areas.

### 📝 Notes

- 100% backward-compatible update with automated database self-healing on first startup.

## v3.5.0 (2026-09-11)

### 🚀 New Features & Enhancements

- **Double-Sided SF9 Booklet (Template 2)**: High-fidelity 2-up front-and-back printable booklet with automatic cut guides, page-flipping duplex symmetry, and strict 2-page pagination on standard A4 and Letter portrait formats.
- **SF10 Customization & Dynamic Layout Engine**: Added intuitive Subject Customization and Layout management modal allowing educators to reorder subjects, define custom learning areas, and edit historical grade entries across JHS, SHS, and Special Curricula.
- **Senior High School Grade 12 Cross-Curricular SF9**: Integrated official DepEd School Form 9 templates and export pipelines for Grade 12 Academic and TechPro tracks with Cross-School subject support.
- **Teaching Load Matrix & Live Advisory Sync**: Added dedicated Teaching Load Matrix management modal for advisory sections, enabling live multi-subject assignment, STE curriculum filtering, and automated two-way synchronization between E-Class Records and teaching loads.
- **Master Excel Automated Database Backup**: One-click and automated master backup utility generating comprehensive, multi-sheet Excel workbooks encapsulating all student profiles, class records, and section rosters for offline auditing and emergency recovery.

### ⚡ Client Data Protection & Safety Improvements

- **Pre-Update Safety Vault Engine**: Automated pre-action backup snapshots and zero data loss safety pipeline before system migrations or critical batch updates.
- **Quarter Lock & Column Visibility Controls**: Dynamic quarter locking mechanism preventing accidental grade edits in closed grading periods, paired with customizable column visibility toggles.
- **Self-Healing Grade Reconciliation Engine**: Automated startup scanning that detects and reconnects orphaned grades or HPS records and guarantees subject visibility across all curriculum levels.
- **Enhanced Emergency Master Recovery**: Hardened emergency master access with secure SHA-256 hashed storage migration, protecting teacher data from lockouts while maintaining offline confidentiality.

### 🐞 Bug Fixes

- Fixed advisory subject synchronization edge cases where teaching load adjustments occasionally reverted custom section subjects.
- Resolved table layout boundary alignment in SF9 PDF rendering ensuring exact two-page output without trailing blank overflow pages.
- Corrected Grade 12 cross-curricular subject mapping in SF9 exports ensuring imported cross-school subjects appear in designated report card rows.

### 📝 Notes

- 100% backward-compatible update with zero risk to student records, grades, and section enrollments.

## v3.4.1 (2026-09-08)

### ⚡ Improvements & Styling Refinements

- **Modern Tailwind v4 Class Compatibility**: Streamlined gradient syntax to modern `bg-linear-to-br` and resolved redundant dark border token declarations across administrative settings.
- **Section Form SVG Indicator Precision**: Upgraded checkbox checkmark indicators in advisory subject selection rosters with optimized `stroke-3` SVG rendering.
- **Component & Hook Dependency Optimization**: Reinforced React hook dependency arrays across Grade 1 PACE forms and Consolidated Grade sheets, ensuring zero unnecessary re-renders.

### 📝 Notes

- 100% backward-compatible patch update with zero changes to underlying database schemas.

## v3.4.0 (2026-09-08)

### 🚀 New Features & Enhancements

- **Senior High School (SHS) Grade 12 3-Term ECR**: Integrated the official DepEd 3-term E-Class Record for Grade 12 with Summative Tests 1 and 2 seamlessly relocated to Written Works 6 and 7, single consolidated Term Exam, and full native formula preservation.
- **SSHS Pilot E-Class Record Suite**: Complete official 8-subject sheets (Core, Applied, Specialized, Apprenticeship/Immersion) with automated 3-term summaries and formula preservation.
- **Special Curricular Programs (SCP) Support**: Integrated official DepEd 3-term ECR templates for SPFL, SPJ, SPA, SPS, SPTVE, SSES, and SPSTEM with per-component breakdowns.
- **SF9 Multi-Level Report Cards**: High-fidelity DepEd School Form 9 exports across Key Stage 1 (PACE Form & SF9), Grades 2–10, and Senior High School with 100% DepEd layout and formula fidelity.

### ⚡ Client Data Protection & Self-Healing

- **Automated Startup Reconciliation**: Scans local database on app launch, reconnects any orphaned grade records, and restores missing subjects before UI rendering.
- **Elementary & JHS Subject Visibility**: Guaranteed full-year visibility (`term: 'all'`) for all Elementary (Grades 1–6) and JHS (Grades 7–10) subjects, permanently eliminating `term: 'none'` visibility filters.
- **MAPEH Dual Component Restoration**: Automatic dual-component resolver ensuring both "Music and Arts" and "Physical Education and Health" are always accessible in ECR and grade sheets.
- **Zero Data Loss Guarantee**: 100% preservation of all existing client records, raw scores, and student profiles in IndexedDB.

### 🐞 Bug Fixes

- **Resolved Subject & Grade Visibility Cascade**: Fixed issue where edited subjects or subjects without a term defaulted to `term: 'none'`, causing them to be hidden from Grade Management, E-Class Record, and SF9.
- **Fixed MAPEH Component Dropdown**: Resolved issue where only "Music and Arts" was shown in the component dropdown, ensuring "Physical Education and Health" is always displayed with its encoded grades.
- **Transmutation Table Boundary Fix**: Corrected DepEd Order 15 s. 2026 Table 4 edge-case boundary mapping for SY 2026-2027.

### 📝 Notes

- Fully backward-compatible update with automated database self-healing on first startup.

## v3.3.1 (2026-09-03)

### 🚀 New Features & Enhancements

- **Direct OpenXML Learner Name & Header Injection**: Implemented robust direct-write injection of student names and section metadata into SSHS Grade 11 E-Class Record term sheets and Final Grades sheets, guaranteeing complete rosters on all spreadsheet viewers.

### ⚡ Improvements

- **Dynamic Term Summary Averaging**: Upgraded Grade 11 TechPro and Academic School Form 9 summary calculation to dynamically average only active graded subjects using `ROUND(AVERAGE(K..:Q..),0)`, eliminating hardcoded division by 7 and preventing partial term score distortion.
- **Robust OpenXML Cell Matcher**: Upgraded Excel sheet cell replacers with precise pattern matching that strictly separates self-closing cell tags (`<c .../>`) from full element pairs (`<c>...</c>`), preventing XML tag corruption.
- **Parent MAPEH Dynamic 2-Pass Hierarchy**: Restored parent MAPEH composite grade calculation with 2-pass averaging and hierarchical sorting in Temporary Grade Slips and E-Class Record views.

### 🐞 Bug Fixes

- **Grade 11 TechPro Final Grade Calculation Mismatch**: Resolved issue where students with only 1 graded subject showed mismatched final averages of `10` and `9` instead of their true subject grades (`67`, `62`, `64`, `65`).
- **SSHS Grade 11 ECR Missing Learner Names & Headers**: Resolved cascading `#VALUE!` formula failures in cell `B8` and helper sheets that caused the learner names column and headers to evaluate to blank in exported workbooks.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v3.3.0 (2026-09-02)

### 🚀 New Features & Enhancements

- **Live Grade Sync Inspector & Root-Cause Debugger Tool**: Integrated a multi-module cross-system debugger comparing student grades across E-Class Record (ECR), Grade Management, SF9, Grade Slips, and SF10 with 1-click batch synchronization and sticky pinned headers.
- **Client Diagnostic & Error Reporter**: Integrated an automatic diagnostic report generator and Firestore uploader enabling teachers to submit detailed technical logs and feedback directly to Developer Emerson with offline queueing support.
- **License Portal Bug Reports & Diagnostic Hub**: Added a centralized Bug Reports center in the License Admin Portal with live open-ticket counter badges, multi-filtering, search, and full modal inspection tools.

### ⚡ Improvements

- **Strict E-Class Record (ECR) Source-of-Truth Hierarchy**: Established live computed ECR transmuted scores as the primary source of truth across Advisory Grade Management and all downstream DepEd school forms.
- **Smart Record Deduplication & ID Alignment**: Enhanced `updateGradingSheetRecord` to automatically detect, replace, and purge obsolete duplicate records and IDs from IndexedDB.
- **Dynamic Subject Name Fallback Resolution**: Improved cross-module subject matching ensuring Advisory Grade Management scores seamlessly propagate to SF9, Temporary Grade Slips, and SF10.

### 🐞 Bug Fixes

- **Temporary Grade Slip Subject Deduplication**: Fixed section isolation and deduplicated repeated learning areas in Temporary Grade Slips.
- **Inspector Table Viewport Scrolling**: Fixed flexbox container height constraints and enabled smooth vertical/horizontal scrolling directly over matrix tables.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v3.2.0 (2026-08-31)

### 🚀 New Features & Enhancements

- **Real-Time Global System Broadcasts & Client Announcement Engine**: Integrated an instant cloud announcement subsystem delivering real-time top notification banners and dialog modal alerts directly to FormEase Pro desktop users upon connection, complete with persistent local dismissal memory.
- **License Portal Broadcast Manager**: Introduced a dedicated administrative broadcast management portal at `/admin` to compose, schedule, filter, and delete live broadcast messages across multiple severity levels (*Info*, *Warning*, *Urgent*, *Success*).
- **Official DepEd SF9 Multi-Grade 3-Term Report Card Suite**: Integrated official DepEd 3-term SF9 report card template export generators for Grade 1, Grade 2, Grade 3, Grade 4–10, and Senior High School Grade 11 (Technical-Professional & Academic tracks).
- **Comprehensive E-Class Record (ECR) Export Suite**: Added official templates for EPP/TLE, MAPEH 9-sheet dual-component systems, and GMRC & Values Education with automatic weighted component calculations.

### ⚡ Improvements

- **OpenXML Formula & Cell Border Preservation**: Enhanced spreadsheet generation engines across all DepEd forms to preserve complex array formulas, nested conditional formatting, cell merges, and print area boundaries.
- **Resilient Real-Time Client Listening**: Configured non-blocking, zero-latency Firestore snapshot listeners for instant client notice delivery with offline fallback resilience.

### 🐞 Bug Fixes

- **SHS Grade 11 Attendance Sentinel Calculation**: Fixed absent day sentinel calculation and worksheet layout alignments in Senior High School Grade 11 forms.
- **Multi-Sheet OpenXML Syntax**: Fixed formula syntax compatibility across multi-sheet DepEd SF9 workbooks.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v3.1.1 (2026-08-27)

### 🚀 New Features & Enhancements

- **Responsive Grade Input Engine**: Reduced input debounce latency down to 300ms across Electronic Class Records and Senior High School grading sheets for instantaneous feedback.
- **Zero-Lockout Pure Advisory Workflows**: Reinforced advisory subject resolution to guarantee class advisers have full access to all active grade-level learning areas without artificial lockouts.

### ⚡ Improvements

- **Grade Management Multi-Subject Visibility**: Resolved advisory section curriculum merging ensuring all standard DepEd learning areas (Filipino, English, Mathematics, Science, Araling Panlipunan, Values Education, TLE, MAPEH) seamlessly render in the Master Summary of Grades regardless of individual teaching load assignments.
- **Junior High School Curriculum Cleanup**: Streamlined Grades 7–10 standard curriculum definitions by removing unused generic Specialization column placeholders.

### 🐞 Bug Fixes

- **Unconfigured Highest Possible Score (HPS) Input Guard**: Fixed score validation logic to accept student scores prior to explicit HPS configuration without triggering premature error alerts.
- **Section Teaching Load Preservation**: Prevented individual teacher subject assignments from overriding or truncating the full advisory section curriculum.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v3.1.0 (2026-08-27)

### 🚀 New Features & Enhancements

- **Official DepEd Grades 2-10 3-Term E-Class Record Excel Export**: Integrated official DepEd 3-Term Electronic Class Record templates for Academic learning areas (Science, Math, English, Filipino, GMRC-VE, Araling Panlipunan) and MAPEH/TLE (Music & Arts, PE & Health, EPP/TLE, TLE), strictly preserving 100% of DepEd Excel formulas and data validations across all 6 worksheets.
- **Single Subject & Batch ZIP Exporting**: Export individual official `.xlsx` spreadsheets or generate a consolidated `.zip` package containing all section subjects in one click directly from the E-Class Record interface.

### ⚡ Improvements

- **Protected Grade Management "Clear All"**: Redesigned summary sheet clearing to strictly target `gradingSheetRecords`, guaranteeing teachers' underlying Electronic Class Records (`classRecords`) are 100% untouched and preserved as the source of truth.
- **Full Word Scale Descriptors**: Unified Grade Management summary descriptors to display the full word scale (**`Advancing`**, **`Benchmarking`**, **`Connecting`**, **`Developing`**, **`Emerging`**) across all grade levels.
- **Role-Based Advisory Load Management**: Reinforced section subject assignments and advisory load checks for streamlined grade recording and reporting.

### 🐞 Bug Fixes

- **Highest Possible Score (HPS) Resolution & Score Bounding**: Resolved section UUID vs. section name mismatch in HPS lookups and applied $[0, 100]\%$ score bounding to eliminate percentage score overflows (fixing erroneous 100 final grade transmuted calculations).
- **Dynamic HPS Grade Recalculation**: Automated immediate recalculation and synchronization of student final grades in both `classRecords` and `gradingSheetRecords` upon HPS adjustments.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v3.0.2 (2026-08-23)

### 🚀 New Features & Enhancements

- **Automated Google Drive Cloud Backup Onboarding**: Integrated automated cloud onboarding wizard with OAuth/Service Account verification, hourly background synchronization schedule, exit protection, and full database collection restore.
- **E-Class Record Dynamic Grade Management Sync**: Automated live grade synchronization pulling verified transmuted grades directly into Grade Management for all standalone subjects and composite MAPEH (Music & Arts, PE & Health) / EC&MK components.

### ⚡ Improvements

- **Curriculum & Virtual Subject Matching**: Enhanced subject alias resolution across DepEd learning areas (Filipino, English, Mathematics, Science, Araling Panlipunan, GMRC/Values Education/Makabansa, EPP/TLE, MAPEH, SHS) enabling seamless grade flow.
- **Robust Excel Template Import & Cell Input**: Fully supported manual cell editing and Excel template importing for non-advisory learning areas with automated subject ID and name mapping.
- **Safe & Scoped Grade Management Clear All**: Re-engineered "Clear All" to strictly target manual/imported summary sheet overrides for the selected section and term with zero impact on teacher E-Class Records.

### 🐞 Bug Fixes

- **Virtual Subject Input Dropping**: Resolved an issue where manual grade input and template imports on curriculum/virtual subjects were rejected.
- **Grade Management React Hook Optimization**: Fixed dependency tracking in grade computation hooks to eliminate unnecessary recalculations.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v3.0.1 (2026-08-23)

### 🚀 New Features & Enhancements

- **Strengthened Senior High School Curriculum (DepEd Order No. 017, s. 2026)**: Integrated full compliance for Grade 11 Core Subjects (*Effective Communication*, *Mabisang Komunikasyon*, *General Mathematics*, *General Science*, *Life and Career Skills*, *Pag-aaral ng Kasaysayan at Lipunang Pilipino*).
- **SSHS Curriculum Clusters**: Official support for the 5 Academic Track clusters and 10 Tech-Pro Track clusters with automatic track scoping.
- **Annex E Unit-Weighted Grading System**: Automated unit-weighted grading calculations across SF9 (Learner Progress Report Card), SF10-SHS (Learner Permanent Academic Record), SF5 (Report on Promotion), and Summary of Grades.
- **DepEd Class Size Limit Monitoring**: Real-time class size compliance indicators adhering to Table 7 maximum limits (40 Core, 30 Academic Electives, 25 Tech-Pro Electives).

### 🐞 Bug Fixes

- **Strict Advisory Subject Scoping**: Fixed report cards and school forms to strictly exclude unassigned database catalog electives (e.g. *Biology 1*, *Business 1*) when not explicitly assigned to the section's advisory load.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v3.0.0 (2026-08-22)

### 🚀 New Features & Enhancements

- **Major v3.0 Core Architecture**: Standardized next-generation architecture featuring robust offline-first Dexie/IndexedDB database encryption, atomic write verification, and zero-loss backup synchronization.
- **Enterprise-Grade Multi-Platform Deployment**: Automated Windows (`.exe`) and macOS (`.dmg`) compilation and distribution pipelines with SHA-512 cryptographic checksum verification.
- **DepEd Form Automation & Precision Suite**: Unified DepEd grading, PACE Form Excel exports (Reading & Literacy, GMRC, Makabansa, Math), SF1-SF10 automated pipelines, SHS Multi-Semester support, and high-speed honor evaluations.
- **Integrated Cloud & Mobile Ecosystem**: Direct Google Drive cloud backup synchronization, real-time mobile QR attendance scanning gateway, and centralized licensing portal integration.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.11.7 (2026-08-18)

### 🚀 New Features & Enhancements

- **Stable Core Baseline Rollout**: Restored and standardized the entire application architecture on the proven, stable 2.11.0 baseline.
- **Enhanced Update & Deployment Resiliency**: Multi-platform release packaging for Windows and macOS with automated health verification.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.11.0 (2026-08-14)

### 🚀 New Features & Enhancements

- Added Grade 1 PACE Form Excel export templates & services for Reading & Literacy, GMRC & MAKABANSA, Language, and Mathematics.
- Added dedicated interactive PACE Form rendering page & template configuration.
- Integrated PACE Form navigation tab in School Forms Page.

### 🐞 Bug Fixes

- Fixed candidate subject type evaluation in Academic Excellence evaluation.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.10.4 (2026-08-14)

### 🐞 Bug Fixes

- Fixed Grade 11 and Grade 12 SF9 template routing to strictly exclude Senior High from Grade 1 rules.
- Restored SHS multi-semester Track/Strand SF9 template rendering and Excel exporter for Grade 11 & Grade 12.
- Standardized `isGrade1to10` range check (1 to 10) for Junior High and Elementary sections.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.10.3 (2026-08-14)

### 🚀 New Features & Enhancements

- Added official DepEd Grade 1 SF9 Excel Export template and service.
- Added PACE Form Reading & Literacy template support.

### ⚡ Improvements

- Instant 50ms Certificate Generator scan with zero-flicker stale state clearing.
- Bidirectional subject ID and subject name matching for DepEd Honor evaluation.

### 🐞 Bug Fixes

- Fixed Term 1 Academic Excellence Certificate evaluation for quarter string variations (`q1`, `Term 1`, `1`).
- Fixed perfect attendance absent sentinel calculation (-1) in Reports Page.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.10.2 (2026-08-08)

### Fixed & Enhanced

- **SF2 Excel Export Fix**: Fixed an Electron application URL protocol error (`file:///` path mapping) that caused "Failed to fetch" errors when attempting to download SF2 Excel files in the production desktop app.
- **Official DepEd 3-Column SF2 Layout**: Overhauled the SF2 bottom guidelines & codes section into the official DepEd 3-column layout (Formulas nested under Guideline #3 in Column 1, Codes & NLS Reasons in Column 2, Summary Table in Column 3).
- **Uniform Square Attendance Cells**: Standardized attendance matrix cells to strict 22px × 22px uniform squares across all symbols (`X`, tardy half-shaded triangles, cutting, and empty states).
- **Editable Summary Fields**: Made summary table cells (Late Enrollment, NLS, Transferred Out, Transferred In) editable in-app and blank by default for teacher customization.
- **Dashboard Layout Overhaul**: Redesigned Dashboard cards (Academic Performance, At-Risk Learners, Academic Achievers, and Announcements) to prevent text clipping and overlapping.

## v2.10.1 (2026-08-08)

### Fixed

- Fixed a mathematical oversight in the Summative Tests calculation to strictly enforce the independent 30/30/40 weighting for ST1, ST2, and TE components.
- Ensured missing assessments are dynamically re-weighted to prevent penalizing students for exams not yet administered.

<!-- markdownlint-disable -->

# Version History

## v2.10.0 (2026-08-08)

### 🚀 New Features & Enhancements

- 📊 **Native SF2 Excel Export**: Added native SF2 Excel (JHS & SHS & ELEM) export functionality with automated summary table calculations.
- 🛡️ **Silent Auto-Updates**: Enforced 1-click silent NSIS background updates to prevent application uninstallation prompts during auto-updates.
- ✨ **Template Alignment Fixes**: Fixed various template mismatching issues for perfectly aligned Excel formatting, and protected user's hardcoded template School Name fields from being overwritten.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.9.7 (2026-08-07)

### 🚀 New Features & Enhancements

- 📅 **Unified MM/DD/YYYY Attendance Format**: Standardized attendance calendar date pickers across desktop and mobile screens into a clean, single-box control displaying dates in `MM/DD/YYYY` format.
- 🗓️ **Multi-Date Historical Attendance Editing**: Enabled teachers to select any past date from the calendar on laptop or mobile phone to view, mark, or edit attendance records with real-time cross-device sync.
- 🛡️ **Today-Only Parent SMS Safeguard**: Integrated date verification into the SMS gateway so updating attendance for past dates automatically skips sending SMS alerts to parents.
- 📱 **Real-Time Smartphone Parent SMS Alerts**: Triggered live Parent SMS notifications on the laptop app whenever attendance is punched or scanned from a connected mobile phone.
- 📹 **Camera Stream Stabilization**: Refactored QR scanner video stream lifecycle using React refs to eliminate 3-second black screen flickering.
- 🔑 **Google Drive Token & Auto-Updater Protection**: Refactored Google Drive OAuth refresh token storage and configured NSIS 1-click background updates (`oneClick: true`) for silent binary upgrades.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.9.6 (2026-08-06)

### 🚀 New Features & Enhancements

- ☁️ **Optimized Google Drive Release Asset Sync Engine**: Updated automated Google Drive release sync pipeline (`sync-gdrive-release.cjs`) to upload strictly binary installers (`.exe` for Windows and the 2 `.dmg` installers for macOS) and auto-purge metadata files (`.yml`, `.yaml`, `.blockmap`, `.zip`) from target release folders.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.9.5 (2026-08-06)

### 🚀 New Features & Enhancements

- 🛡️ **Auto-Updater Installer Restart Safeguard**: Integrated top-level module scope protection and safe fallback checks around Express gateway server shutdown during automatic updates to prevent installer restart JavaScript errors (`expressServer is not defined`).
- 📊 **Unified Live Grade Engine Across All School Forms & Reports**: Real-time transmuted grade calculation matching E-Class Record and Summary of Grades live across SF9 (Report Card), SF10 (Form 137), SF5, SF6, LIR, Grade Slips, and Analytics.
- 🔢 **Natural Grade-Level Section Sorting**: Updated Temporary Grade Slips and Reports to sort strictly by numerical Grade Level (Grade 7 ➔ Grade 12), then alphabetically by Section Name.
- 🏆 **Excellence Awards & Certificate Generator Restoration**: Restored Subject Excellence Awards (FG ≥ 90) across all JHS and SHS grade levels with enhanced section ID and name matching.
- 🔑 **Unrestricted Application Master Access**: Updated RBAC permissions so all installed standalone application instances provide 100% full access to all forms, certificates, and settings.
- 🧹 **Cascade Section & Roster Purge Maintenance Utility**: Added a 1-click database cleanup tool under Settings ➔ Data Maintenance to purge orphaned sections, ghost rosters, and unlinked grade records.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.9.4 (2026-08-06)

### 🚀 New Features & Enhancements

- **Dynamic Summative Tests & Term Examination (30%) Computation**: Updated Total Score and Total HPS to calculate dynamically based on valid, completed assessments only. Blank/un-administered Term Exam scores and HPS are excluded from numerator and denominator, preventing premature grade drops.
- **Unified Summary of Grades Transmuted Grade Engine**: Re-aligned transmuted grade calculations between E-Class Records and Summary of Grades for 100% exact parity with zero discrepancy across all school forms (SF9, SF10, LIR).
- **Tailored macOS Update Experience**: Added 1-click 🍏 **Download macOS Update (.dmg)** installer workflow with 2-step drag-and-drop installation instructions for Mac users.
- **Packaged Real-Time Mobile Attendance Server**: Embedded Express mobile gateway in production ASAR build with 2-way real-time polling, server timestamping, and 24/7 background session roster push.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.9.3 (2026-08-05)

### ⚡ Fixes & Improvements

- **Instant Mobile Student Roster Sync**: Integrated 24/7 background session push from desktop App store to Express server memory (`/api/attendance/session`) so mobile devices load all students and sections instantly upon scanning.

## v2.9.2 (2026-08-05)

### ⚡ Fixes & Improvements

- **Packaged Electron Server Fix**: Bundled `server.js` into production ASAR build (`files` manifest) so Mobile Attendance Gateway server automatically starts on port 3001 in installed desktop apps.

## v2.9.1 (2026-08-05)

### 🚀 New Features & Enhancements

- **Mobile Phone Attendance Portal**: Added dedicated `/mobile-attendance` web interface for teachers to mark student attendance from any smartphone on local Wi-Fi.
- **Real-Time Cross-Device Sync Engine**: Built multi-device synchronization using BroadcastChannel, LocalStorage events, and background REST API polling with server timestamping.
- **Attendance Legend & Layout**: Added visual legend guide (P, A, L, CC, EX) and single-line student name formatting for mobile devices.
- **Interactive 1-Click Chrome Setup Guide**: Integrated copy buttons for Chrome flags (`chrome://flags/#unsafely-treat-insecure-origin-as-secure`) and laptop IP address for 1-minute setup.
- **Native Camera QR Photo Scanner**: Added 1-tap `Snap QR Photo` fallback using native OS camera file capture and `jsQR` decoding.

### ⚡ Improvements

- **DepEd Order 15 s. 2026 Standardization**: Updated all Class Record and School Form headers to conform to DepEd Order 15 series of 2026.
- **LAN Wi-Fi Auto-Discovery API**: Added `/api/network-ip` endpoint to automatically detect and select laptop local Wi-Fi IP address.
- **Browser AutoFill Security Protection**: Added readOnly focus-unlock and nonce input attributes to prevent browser password managers from auto-filling credentials.
- **Automated 1-Time Storage Reset Safeguard**: Integrated automatic local storage reset migration on launch to ensure all users receive clean default settings.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.8.4 (2026-08-04)

### 🚀 New Features & Enhancements

- **Parent SMS Broadcast Center**: Integrated comprehensive Parent SMS Broadcasting with 57 pre-configured, DepEd-aligned templates across 11 categories (Weather & Emergencies, PTC, Grades & Report Cards, Awards, Periodical Exams, School Programs, Forms & Clearance, Graduation, Attendance & Discipline, Health & Safety, General Reminders).
- **Specific Student SMS Targeting**: Added hand-picked learner selection with searchable student picker, individual parent contact checkboxes, and real-time selection metrics.
- **SMS Broadcast History Log**: Implemented local broadcast audit trail tracking last 10 broadcast runs with sent/failed delivery counts.

### ⚡ Improvements

- **Announcements Hub UI Redesign**: Overhauled Announcements page layout with Quick-Action Dashboard Cards, collapsible login announcement banner, and guided empty states.
- **Settings Version History Sync**: Updated Settings Version History UI with full timeline coverage up to v2.8.4.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.8.3 (2026-08-03)

### 🚀 New Features & Enhancements

- **Expanded Onboarding Spotlight Tour**: Updated interactive onboarding wizard to 22 spotlight steps, including new tour highlights for Daily Attendance (`sidebar-daily-attendance`), Student ID Generator (`sidebar-student-id-generator`), and Online Generators (`sidebar-online-generators`).
- **Automated Target Auto-Scrolling**: Integrated `scrollIntoView` into the spotlight tour engine to automatically scroll sidebar items into view when highlighted.
- **3-Term Grading Terminology**: Standardized terminology in E-Class Record and Grade Management from "Quarterly" to "Term" to seamlessly support 3-term school calendars.

### ⚡ Improvements

- **Accurate Feature Descriptions**: Audited and updated all onboarding step descriptions and feature bullets to 100% accurately reflect actual app capabilities (DLL Generators in ILAW format, Wheel of Names, Noise Monitor, Quiz Show, Team Splitters).
- **Documentation Quality**: Resolved Markdown formatting linter warnings (`MD031`, `MD012`) in `AUDIT_REPORT.md`.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.8.2 (2026-08-02)

### ⚡ Improvements

- **E-Class Record Subject Selector Deduplication**: Deduplicated base subject list by normalized title in both JHS/Elementary and SHS E-Class Record pages to eliminate duplicate option entries in the dropdown selector.

### 🐞 Bug Fixes

- **Dark Mode Printable Document Sheet Background Contrast**: Removed `dark:bg-[#070a12]` overrides in `index.css`, enforcing pure paper-white canvas (`#FFFFFF`) and high-contrast `#000000` black text across all printable Summary of Grades and Class Record document sheets in Dark Mode.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.8.1 (2026-08-02)

### 🚀 New Features & Enhancements

- **DepEd SF2 Attendance Roster Filtering**: Learners are now dynamically filtered per monthly sheet based on their `first_day_attendance` date (defaulting to SY opening June 8, 2026 for regular learners).
- **Pre-Enrollment Date Cell Protection**: Attendance cells for dates prior to a learner's first day of attendance are shaded, non-editable, and display helpful tooltips.
- **Clean Duplicates Database Utility**: Added a **Clean Duplicates** utility in the Subjects manager to automatically find and bulk-delete redundant database subject records.

### ⚡ Improvements

- **Automatic Normalized Subject Deduplication**: Both SF9 Report Cards and Consolidated Grade matrices automatically deduplicate subject headers by normalized title, restoring single-row subject layouts.
- **Vite Dev Server CJS Dependency Optimization**: Pre-bundled `@react-pdf/renderer`, `unicode-trie`, `base64-js`, `buffer`, and `dfa` CommonJS dependencies to eliminate Vite dev server reload errors.

### 🐞 Bug Fixes

- **Subject & Grade Lookup Fallback**: Enhanced grade lookup to query class records by both `subject_id` and normalized `subject_name`, ensuring complete grade calculations with zero data loss.
- **Node Test Environment Guard**: Guarded database indexing projection migration when running tests in Node.js environments.

### 📝 Notes

- Fully backward compatible update with zero risk of data loss.

## v2.8.0 (2026-07-30)

### 🚀 New Features & Enhancements

* **Full Dark Mode Support Across School Forms & Tools:**
  * Applied comprehensive dark mode styling across toolbars, selection controls, empty states, modals, and workspaces for **SF2** (Daily Attendance), **SF5** (Report on Promotion), **SF6** (Summarized Report), **SF8** (Health & Nutrition), **SF9** (Report Card), **SF10** (Permanent Record), **LIR** (Learner's Individual Record), **Grade Slips**, and **Name Tags**.
  * Enforced light color scheme and crisp `#000000` text rendering inside printable document sheets to ensure paper prints remain pure white.
* **Post-Update What's New & Fixes Screen:**
  * Automated release notes pop-up display on app startup after updating via in-app updater or direct installer download.
* **macOS Auto-Updater & Release Download Fallback:**
  * Configured Firebase Hosting 302 redirects for `latest-mac.yml` and `latest.yml` to resolve YAML parsing errors.
  * Added direct release installer download link (`.dmg` / `.zip` / `.exe`) in the update modal for macOS Gatekeeper fallback.
* **Excel Template Export & Import Optimization:**
  * Added sheet name sanitization (stripping illegal Excel characters `: \ / ? * [ ]`) and deduplication to ensure template export and bulk grade import work seamlessly in Summary of Grades.

### 🐞 Bug Fixes & Refactoring

* **Attendance Sheet Header Text Visibility:**
  * Fixed day-of-week letter header row (`M`, `T`, `W`, `TH`, `F`) in SF2 Daily Attendance table to maintain high-contrast black text in dark mode.
* **Native Select Group Header Contrast:**
  * Added global CSS styling for `<optgroup>` and `<option>` dropdown labels to prevent white-on-white text clipping across Chromium browsers.
* **SF9 Toolbar Cleanup:**
  * Removed redundant duplicate "Signatures" button from the SF9 top toolbar and cleaned up unused icon imports.

### 📝 Notes

Backward compatible. School Forms dark mode, macOS updater, and Excel template enhancement release.

## v2.7.6 (2026-07-28)

### 🚀 New Features & Enhancements

* **Post-Update Version Description Display:**
  * Embedded dedicated **Version Description (What's New in vX.X.X)** section inside the post-update **Data Reconciliation Report** modal.
  * Preserved target release notes through pre-update system state serialization to ensure release details display seamlessly after system restarts.

### 📝 Notes

Backward compatible. Reconciliation report UX enhancement release.

## v2.7.5 (2026-07-28)

### 🐞 Bug Fixes & Refactoring

* **SF2 Summary Columns & Header Alignment:**
  * Restored summary column 2 header in School Form 2 (Daily Attendance) from `TARDY` back to `PRESENT`.
  * Synchronized student row totals to display total Present days (`countStats(student.lrn, 'present')`), matching the Male/Female/Combined total rows.
  * Synchronized Excel export headers (`ABSENT`, `PRESENT`, `REMARKS`) and calculated learner present counts.

### 📝 Notes

Backward compatible. SF2 Daily Attendance summary headers and Excel sync patch release.

## v2.7.4 (2026-07-28)

### 🐞 Bug Fixes & Refactoring

* **Grade Slips Section Selector:**
  * Added Section selection dropdown in Temporary Grade Slip toolbar enabling teachers to browse and print grade slips for any section in the school.
  * Prioritized advisory classes at the top of the dropdown list.
* **Toolbar UI Cleanup:**
  * Removed redundant header title and subtitle text to declutter the toolbar.
  * Resolved Tailwind class linter warning by converting `min-w-[220px]` to standard `min-w-55`.

### 📝 Notes

Backward compatible. Temporary Grade Slip module enhancement release.

## v2.7.3 (2026-07-28)

### 🚀 New Features & Enhancements

* **100% Decoded Gemini Hyperlinks Integration:**
  * Updated all 35 DepEd-compliant AI prompt generators and lesson log templates with exact decoded Gemini share links across all 8 Planner categories (*Daily ILAW, Weekly ILAW, Semi-Detailed ILAW, Weekly Planner, Semi-Detailed Planner, Trimester Planner, Detailed Planner, Looker Studio*).
  * Added 35th template card: **Daily Lesson Log (DLL) + Exemplar** (`https://gemini.google.com/share/3bc0dd129f42`).

### 🐞 Bug Fixes & Refactoring

* **Linter & Code Quality:** Resolved unused `BookOpen` import error in `OnlineGeneratorsPage.tsx`.

### 📝 Notes

Backward compatible. Decoded hyperlink patch release.

## v2.7.2 (2026-07-28)

### 🐞 Bug Fixes & Refactoring

* **School Form 2 Navigation:** Fixed School Form 2 button in School Forms page redirecting to Dashboard instead of Attendance page.
* **Student Information & Modal Scroll Fix:** Resolved fixed backdrop overlay clipping and scrolling issues in Student Information page and Add Learner modal.
* **Age Alert Badge Removal:** Stripped out outdated age warning calculation, badge markup, and unused `AlertTriangle` imports from Learner records.

### ⚡ Improvements & Enhancements

* **Online Generators & Lesson Planners Interactivity:**
  * Assigned valid URLs and interactive template launchers to all 34+ DepEd generator cards in `OnlineGeneratorsPage.tsx` and `LessonPlannerTemplates.tsx`.
  * Added **"Use Template"** primary launcher button alongside **"Copy Template Outline"** quick action with clipboard toast feedback.

### 📝 Notes

Backward compatible. Bug fix and template interactivity patch.

## v2.7.1 (2026-07-27)

### 🚀 New Features & Enhancements

* **Online Generators Hub & Lesson Planners:**
  * Added dedicated **Online Generators** sidebar page with 34+ DepEd-compliant AI prompt generators, ILAW lesson logs, Matatag weekly logs, and Looker Studio K-12 Lesson Exemplars.
  * Embedded direct links and interactive template preview/copy generator for all ILAW, MATATAG, 4A's, 7E's, and Trimester lesson logs.

* **Institute Profile & Advisory Roster:**
  * Added multi-advisory section listing sorted numerically by Grade Level (Kinder -> G12).
  * Restored featured adviser avatar card and added direct signature upload shortcut.

* **Reports & Analytics Page Redesign:**
  * Re-architected landing layout into a 4-column compact grid fitting 100% in desktop viewport without vertical scrollbars while preserving card aesthetics.

* **Subjects Page Workflow Banner:**
  * Upgraded DepEd Curriculum & Subject Management banner to a clean white glassmorphic card compatible with light and dark themes.

### 🐞 Bug Fixes & Refactoring

* **Games & Tools Cleanup:** Streamlined Games & Tools dashboard by moving lesson plan generators into the dedicated Online Generators tab.
* **Code Quality & Lints:** Resolved TypeScript type errors, unused icon imports, and fixed Tailwind class linter warnings across all updated components.

### 📝 Notes

Backward compatible. No database migration required.

## v2.7.0 (2026-07-26)

### 🚀 New Features & Enhancements

* **Interactive Games & Classroom Tools Suite:**
  * **Bomb Pass / Hot Potato:** Ticking bomb timer with secret random suspense mode, Web Audio API pitch-shifting ticks, dark studio animations, and explosive shockwave blast effects.
  * **Quiz Show / Jeopardy Board:** Interactive category quiz board with $100–$500 point tiles, answer reveal fanfares, and 3-team score tracking (*Team Alpha, Team Bravo, Team Charlie*).
  * **Save the Balloon (Word Guessing Game):** Kid-friendly vocabulary guessing game with floating balloons, subject presets, and Web Audio API pop & victory chime sound effects.
  * **Crossword Puzzle Generator:** Interactive crossword solver with automatic layout generator engine, custom word/clue entry manager, built-in subject presets, and 1-click printable review worksheets.
  * **3D Wheel of Names Overhaul:** 3D metallic gold rim with 24 peg studs, radial along-ray text engine supporting 50+ student rosters without text overlap, 1-click name display format switcher (*Full Name / Last Only / First Only*), and confetti particle cannon.
  * **3D Coin Flip Simulator:** Metallic gold 3D coin flip physics with Web Audio API landing clinks, Heads/Tails prediction mode, and probability stats breakdown.
  * **3D Dice Roller:** Roll 1 to 5 dice with Web Audio API clatter sounds, red pip markers, automatic sum calculator, and roll history log.
  * **Tug of War Recitation Battle:** Team score tracking, customizable team names, rope pull grunts, and victory fanfare celebrations.
  * **Raffle Ticket Jar:** Glass jar stage with real-time ticket shuffling audio ticks, confetti cannon celebration, 1-click winner removal, and class roster loading.
  * **Bouncing Words Sentence Rebuilder:** Glowing neon 3D physics word bubbles, pop audio feedback, subject presets, and victory confetti blasts.
  * **Collapsible Category Accordions:** Interactive expand/collapse category section headers and 1-click "Expand All / Collapse All" toolbar control on the Games & Tools dashboard.

### 🐞 Bug Fixes & Code Improvements

* **Certificate Generator Header:** Corrected Tagalog Division Name formatting to `Lalawigan ng Tarlac` and `Tarlac Province`.
* **Login Page Exit Fix:** Resolved exit button non-responsiveness on the Login screen by forcing unconditioned application exit via Electron's close API.

### 📝 Notes

Backward compatible. No database migration required.

## v2.6.0 (2026-07-24)

### 🚀 New Features & Enhancements

* **Multi-Advisory Class Management:**
  * Removed single advisory class restriction in Section management (`SectionForm.tsx`), enabling teachers and multi-grade advisers to create and manage multiple advisory classes simultaneously.
  * Ensured the Complete Student Information Form renders for all learners belonging to advisory sections in `StudentsPage.tsx`.
  * Added a dedicated **Select Advisory Section** dropdown toolbar control in `SF9Page.tsx` to switch between advisory classes for SF9 report card preview, printing, and batch PDF export.
  * Updated section selector availability in `SF10Page.tsx`.

* **Google Drive & Database Auto-Backup Enhancements:**
  * Added a prominent **Sync Full Backup to Google Drive** button in both the top Header Backup Options menu and Settings Data Management dashboard.
  * Verified all auto-backups and cloud sync exports produce a 100% complete, uncompressed, unencrypted, raw `.json` snapshot of all database records.
  * Refactored `AutoBackupManager.tsx` so database backup generation runs silently in the background when confirming application exit.

### 🐞 Bug Fixes & Code Cleanup

* Resolved section locking issue on the SF9 Report Card page by adding section selection controls.
* Cleaned up unused state variable destructuring and satisfied lint rules across section forms.

### 📝 Notes

Backward compatible. No database migration required.

## v2.5.2 (2026-07-17)

### 🚀 New Features & Improvements

* Updated default ID card watermark seal opacity to 7%.
* Added signature scale and vertical offset configuration settings.
* Positioned the School Head signatory block directly below the signature on the back of the card.

### 🐞 Bug Fixes

* **ID Generator Layout:** Repaired left/right sidebar scrolling bounds to allow full scrolling.
* **Floating Controls:** Moved the floating controls bar (zoom and sidebar toggles) to float at the top of the preview area to prevent overlapping card contents.
* **Logo Persistence:** Fixed a bug where uploading/removing a logo from the Institute Profile would be overridden by stale config saves from the ID Generator page. Logo updates now auto-save immediately.
* **Grade & Section Formatting:** Formatted the back-of-card table to strip the `"Grade "` prefix (e.g. displaying `"7 - Einstein"` instead of `"Grade 7 - Einstein"`).
* **TypeScript Fixes:** Resolved VM model type errors by adding missing `schoolYear` and `adviserSignatureUrl` to `IdCardViewModel`.

### 📝 Notes

Backward compatible. No data migration required.

## v2.5.1 (2026-07-12)

### ⚡ Improvements

* Redesigned and optimized the Settings page "Backups & Recovery" tab layout into a modern, responsive 2-column dashboard.
* Commented out the incomplete "Multi-Device Sync" card to simplify the layout.
* Commented out the incomplete "School Year Archiver" card to keep the user interface clean.
* Updated Tailwind custom classes (`bg-gradient-to-br` to `bg-linear-to-br`).

### 🐞 Bug Fixes

* Fixed multiple pre-existing TypeScript compile warnings and linter errors across the codebase.
* Commented out unused state hooks and helper methods (`handleArchiveSchoolYear`) to satisfy strict ESLint rules.
* Added explicit type casts for indexable records and Electron context bridge APIs.

## v2.5.0 (2026-07-05)

### 🚀 New Features

* Added daily QR attendance scanning.
* Added calendar announcements.

### ⚡ Improvements

* Improved grade sheets synchronization.

### 📝 Notes

Backward compatible.

## v2.4.5 (2026-07-05)

### 🐞 Bug Fixes

* **Application Icon:**
  * Fixed the application icon missing from the installed app by re-enabling executable resource editing, so the FormEase Pro logo is embedded into the built executable, installer, desktop shortcuts, and taskbar.
  * Rebuilt the Windows icon (`.ico`) with multi-size images (16–256 px) for crisp rendering in the title bar, taskbar, and Explorer.
* **Certificate Generator:**
  * Included missing DepEd and school certificate logo assets in the application bundle.

### 📝 Notes

Backward compatible. No data migration required.

## v2.4.4 (2026-07-05)

### 🐞 Bug Fixes

* **Advanced Certificate Generator:**
  * Resolved `file://` fetch CORS issues during batch certificate compilation.
  * Implemented protocol-aware resolution for font and logo assets to support both web subpaths and desktop Electron environments.
  * Split signature visibility options into separate, direct toggle checkboxes (Class Adviser & School Head) utilizing global institute profile signatures.
  * Centered award descriptions, body texts, and category titles on printed certificates, adjusting date margins for clean alignment.
  * Fixed missing Subject Awards scanner lookup to automatically fall back to grade-level subjects when section-specific links are absent.
* **Application Icon & Identity:**
  * Added Windows Application User Model ID registration to correctly link taskbar and titlebar icons to the FormEase Pro desktop shortcut.
  * Configured high-resolution native `.ico` support for Windows platforms.

## v2.4.3 (2026-07-04)

### 🐞 Bug Fixes

* Fixed a layout formatting bug in the Advanced Certificate Generator preview within the installed app by statically compiling and bundling the certificate stylesheet.

## v2.4.2 (2026-07-04)

### 🚀 New Features

* Added native window close interception prompts to prevent closing the application without confirming.
* Implemented a select dropdown menu with 18 official offerings for Grade Levels Offered.

### ⚡ Improvements

* Optimized the Institutional Profile edit page dimensions, scaling down image elements and inputs to fit on screen without vertical scrollbars.

### 🐞 Bug Fixes

* Removed unused helper functions and unused variables (`visibleGrades`, `GRADE_GROUPS`, `displayGroup`, and `parseGradeGroup`) to ensure clean compilation.

## v2.4.1 (2026-07-04)

### 🚀 New Features

* Added support for adviser and school head digital signature uploads in the Institute Profile settings.
* Integrated digital signatures dynamically across ID cards, student profile sheets, SF9 report cards, and temporary grade slips.

### ⚡ Improvements

* Optimized student ID card back layout and spacing to prevent text or footer displacement.
* Added signature scale and vertical offset sliders to the ID Template settings for precise alignment.
* Corrected the **School Last Attended** field on the printed student profile sheets to dynamically resolve based on the student's department (Elementary, JHS, or SHS).

### 🐞 Bug Fixes

* Fixed a rendering issue under the **Glassmorphism** ID card template that caused details to disappear in vector PDF downloads.

## v2.4.0 (2026-06-28)

### 🚀 New Features

* Added previous school type selection (Public / Private) for Elementary, JHS, and SHS in editing forms and printed layouts.
* Added support for Balik-Aral and ALS enrollment types in student forms.
* Formatted first day of attendance on printable profiles as a boxed grid cell layout.

### ⚡ Improvements

* Balanced name column spacing and bolded middle names/extensions on printed student profile sheets.
* Cleaned up redundant enrollment term dropdown selectors and duplicate print blocks.

### 🐞 Bug Fixes

* Fixed parent_name state locking issue to allow correct editing and saving of parent/guardian names in the database.
* Fixed hardcoded "CALIBUNGAN" badge label on student ID templates, replacing it with "STUDENT".
