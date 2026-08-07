<!-- markdownlint-disable -->

# Version History

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
