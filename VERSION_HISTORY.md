<!-- markdownlint-disable MD024 -->

# Version History

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
