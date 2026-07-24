<!-- markdownlint-disable MD024 -->

# Version History

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
