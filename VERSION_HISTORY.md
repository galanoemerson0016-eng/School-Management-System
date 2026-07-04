# Version History

## v2.4.1 (2026-07-04)

### 🚀 New Features
- Added support for adviser and school head digital signature uploads in the Institute Profile settings.
- Integrated digital signatures dynamically across ID cards, student profile sheets, SF9 report cards, and temporary grade slips.

### ⚡ Improvements
- Optimized student ID card back layout and spacing to prevent text or footer displacement.
- Added signature scale and vertical offset sliders to the ID Template settings for precise alignment.
- Corrected the **School Last Attended** field on the printed student profile sheets to dynamically resolve based on the student's department (Elementary, JHS, or SHS).

### 🐞 Bug Fixes
- Fixed a rendering issue under the **Glassmorphism** ID card template that caused details to disappear in vector PDF downloads.

## v2.4.0 (2026-06-28)

### 🚀 New Features
- Added previous school type selection (Public / Private) for Elementary, JHS, and SHS in editing forms and printed layouts.
- Added support for Balik-Aral and ALS enrollment types in student forms.
- Formatted first day of attendance on printable profiles as a boxed grid cell layout.

### ⚡ Improvements
- Balanced name column spacing and bolded middle names/extensions on printed student profile sheets.
- Cleaned up redundant enrollment term dropdown selectors and duplicate print blocks.

### 🐞 Bug Fixes
- Fixed parent_name state locking issue to allow correct editing and saving of parent/guardian names in the database.
- Fixed hardcoded "CALIBUNGAN" badge label on student ID templates, replacing it with "STUDENT".
