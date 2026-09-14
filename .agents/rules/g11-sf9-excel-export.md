# Grade 11 SF9 Excel Export Guidelines & Rules

Rules and template conventions for Grade 11 Academic and Technical-Professional (Tech-Pro) SF9 Excel exports (`sf9-g11-academic-excel-export.ts` and `sf9-g11-techpro-excel-export.ts`).

## 1. INPUT DATA (Sheet 2) Native Styles & Outlines
- **Never force arbitrary styles** (e.g. `'25'`, `'26'`, `'27'`) on learner data cells (`L`, `M`, `N` for males; `Q`, `R`, `S` for females). Forcing styles strips the template's native cell borders and outlines.
- Preserve template native styles:
  - Learner Name: Style `19` (or `14` in TechPro)
  - LRN: Style `224` (or `133` in TechPro)
  - Birthdate: Style `225` (or `134` in TechPro) with native date format `mm/dd/yyyy;@` (`numFmtId=164`).

## 2. Birthdate Formatting
- Birthdates must be written using the native `DATE(year,month,day)` formula with the Excel serial number as cached value.
- **Never pass forceStyle `'27'`** to `updateFormulaCellExplicit` on DOB cells in `INPUT DATA` or `TERM SUMMARY` sheets (`H16:H65` for males, `H67:H116` for females). Style `'27'` has `numFmtId=0` (General), which strips date formatting and causes dates to display as raw serial numbers or blanks.
- Preserving native styles (`225`, `228`, `231`) ensures dates format correctly as `mm/dd/yyyy`.

## 3. Female LRN Column
- In `INPUT DATA`, female LRN must only be written to column `R` (width 23.88).
- **Never duplicate LRN into column `T`** (column `T` is a narrow 3.88-width helper column).
- In summary sheets, female LRN formula must reference `'INPUT DATA'!R${11+idx}`.

## 4. School Year in Term Summary Sheets
- In Term summary sheets (Sheets 3, 4, 5), the school year is placed in merged cell `O6:P6` via formula `=IF('INPUT DATA'!F18="","",'INPUT DATA'!F18)`.
- **Do NOT write school year to `Q6` or `P6`**.
- Orphan cells `Q6` and `R6` (present in Term 2 & 3) must be explicitly cleared with `updateFormulaCellExplicit(sXml, 'Q6', '', '')` and `updateFormulaCellExplicit(sXml, 'R6', '', '')` so rogue school year text or template formulas in `R6` do not appear.

## 5. Column Mapping in Term Summary Sheets
- Learner Name: Column `C` (merged `C:E`)
- LRN: Column `F` (merged `F:G`)
- Date of Birth: Column `H`
- Age: Column `I` (formula: `IF(H#="","",DATEDIF(H#,TODAY(),"Y"))`)
- Sex: Column `J`
- Learning Areas / Grades: Columns `K` through `R`
- General Average: Column `S` (where applicable)
- Rank: Column `T` (where applicable)
