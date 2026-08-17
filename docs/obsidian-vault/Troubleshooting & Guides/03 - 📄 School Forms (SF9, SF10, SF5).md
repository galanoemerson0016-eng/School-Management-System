---
title: School Forms Generation (SF9, SF10, SF5)
tags:
  - school-forms
  - sf9
  - sf10
  - sf5
  - deped
created: 2026-08-17
---

# 📄 School Forms Generation (SF9, SF10, SF5)

FormEase Pro automates standard DepEd school form generation from recorded grades and attendance.

---

## 📑 Supported DepEd School Forms

| Form Code | Form Name | Primary Module | Export Formats |
| :--- | :--- | :--- | :--- |
| **SF9** | Learner Progress Report Card | `SF9Page.tsx` | PDF (Print Ready), Excel |
| **SF10** | Learner's Permanent Academic Record | `SF10Page.tsx` | PDF (DepEd Form 137 style) |
| **SF5** | Report on Promotion & Level of Proficiency | `SF5Page.tsx` | Official DepEd Excel (`.xlsx`), PDF |
| **SF6** | Summarized Report on Promotion | `SF6Page.tsx` | Excel, PDF |
| **SF2** | Daily Attendance Summary | `AttendanceDailyPage.tsx` | Official DepEd Excel (`.xls`), PDF |
| **TGS** | Temporary Grade Slip | `TemporaryGradeSlipPage.tsx` | PDF |
| **LIR** | Learner's Information Record | `LIRPage.tsx` | PDF |

---

## 🖨️ SF9 Generation Checklist

To generate an accurate SF9 Report Card:
1. Ensure all 4 Quarters have recorded scores in **E-Class Record**.
2. Verify that **Core Values / Observed Values** are marked under **Observed Values**.
3. Check that **Attendance Days Present / Absent** are logged under **Attendance**.
4. Click **School Forms ➔ SF9 Card**, select the section and student, and click **Print / Export PDF**.

See also:
- [[02 - 📊 Grading Engine & DepEd Formulas]]
- [[01 - 📜 MATATAG Curriculum Standards]]
