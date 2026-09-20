# Grade 1 SF9 & PACE Form Excel Export & Import Guidelines & Rules (LOCKED)

> [!IMPORTANT]
> **LOCKED CODEBASE MODULE**: The implementation for Grade 1 SF9, PACE Form, the 17-sheet unified master workbook, and the bidirectional Excel sync is **STRICTLY LOCKED AND VERIFIED**.
> **DO NOT MODIFY OR REVERT** any part of this Grade 1 SF9 & PACE implementation, its color definitions, its lookup mappings, its template bindings, or its import/export services without explicit knowledge and approval.

---

## 1. Authoritative Master Template
- **Template File**: `app/public/templates/UPDATED [Grade 1] ECR, PACE Form, and SF9.xlsx`
- **Specifications**: 17 worksheets, size ~11.29 MB, updated September 16, 2026.
- **Rules**:
  - Do NOT replace or downgrade this file with older versions (`PACE FORM.xlsx`, `PACE FORM - *.xlsx`, or `G1 School Form 9 with PACE Form (SY 26-27).xlsx`).
  - All 17 worksheets (`Home` through `G1 - ATTENDANCE SUMMARY`) must be preserved with their native OpenXML formatting, print configurations, and formulas.

---

## 2. Zero-to-Blank Guard Rule (Crucial Excel Behavior)
- **Problem**: In Microsoft Excel, when a `VLOOKUP` formula points to an empty cell (e.g., `N14` or `Q14` on `TERM 1 SUMMARY`), Excel evaluates the empty reference to numeric `0`.
- A formula like `=IF(VLOOKUP(...)="","",VLOOKUP(...))` will **FAIL** in Excel because numeric `0 = ""` evaluates to `FALSE`.
- **Mandatory Formula**:
  All remarks cells in `SF9 - GRADE 1` (E23, E31, E43, E51, E63, E71) and all 616 PACE rating cells in `PACE - GRADE 1` (sheet 7) **MUST** use the compound zero-guard:
  ```excel
  =IFERROR(IF(OR(VLOOKUP(...)=0,VLOOKUP(...)=""),"",VLOOKUP(...)),"")
  ```
- **XML Value Tag**:
  - If a rating or remark exists: `<v>${escapeXml(val)}</v>`
  - If blank / unrated: `<v/>` (an empty value tag).
  - **NEVER** write `<v>0</v>` or omit the guard.
- **Summary Sheets** (`TERM 1/2/3 SUMMARY`):
  - Blank remarks cells (`N${r}` and `Q${r}`) must be written with style `704` and empty body: `<c r="N${r}" s="704"/>`. Never write `0` or `<v>0</v>`.

---

## 3. The `#3F3F3F` and `#434343` Rule ("Not Included" in PACE Form)
- In sheet `PACE - GRADE 1`:
  - Cells shaded with dark gray `#3F3F3F` (59 cells) and `#434343` (18 cells) denote competencies/macro-skills that are **NOT INCLUDED / UNASSESSED** in that particular term.
  - In `pace-template-config.ts`, `PACE_MASTER_CELL_COLORS` must strictly reflect `#3F3F3F`:
    - Items 1–5: T1 assessed; T2 and T3 are `#3F3F3F` (Not Included).
    - Item 12a & 12b Writing: T1 is `#3F3F3F` (Not Included); T2 & T3 are `#C4E0B3` (Writing).
    - Item 19: T1 & T2 are `#3F3F3F` (Not Included); T3 is assessed.
    - Item 20a–20e Reading: T1 is `#3F3F3F` (Not Included); T2 & T3 are `#F7B083` (Reading).
    - Item 20f: T1 is `#3F3F3F` (Not Included); T2 & T3 are assessed.
    - Item 20g: T1 & T2 are `#3F3F3F` (Not Included); T3 is assessed.
    - Item 21a & 21b Reading: T1 is `#3F3F3F` (Not Included); T2 & T3 are `#F7B083` (Reading).
    - Items 22b, 22c, 23w, 24b, 24c: In T1 and T2, they are `#3F3F3F` (Not Included); they are ONLY assessed in T3!
- In `PaceFormRenderer.tsx`:
  - All `#3F3F3F`, `#434343`, `#B7B7B7`, and `#000000` cells are strictly disabled, locked, have `pointer-events-none`, and completely disallow letter input.
  - Keyboard navigation (Tab, Enter, Arrow keys) automatically skips these unassessed cells.
- In `sf9-g1-excel-export.ts`:
  - `isUnassessedPaceCell` guards against ever writing ratings into `#3F3F3F`, `#434343`, or `#000000` cells.

---

## 4. The `#000000` Rule ("Locked / Must Not Allow Letter Input in All Sheets")
- In sheet `TERM 1 READING & LITERACY`:
  - Columns `CT`, `CU`, `CV`, `CW`, `CY`, `DB`, `DC`, `DD`, `DE` across all 100 student rows (900 cells) are filled with **pure black (`#000000`)**.
  - These correspond to the competencies excluded in Term 1 (`22b`, `22c`, `23 writing`, `24b`, `24c`).
  - In `g1-pace-lookup-map.ts`, all `_t1` and `_t2` keys that previously pointed to these columns are removed.
  - Export must NEVER write ratings into `#000000` columns, and import must NEVER read from them.

---

## 5. Bidirectional Master Excel Sync (Two-Way Sync)
- **Import Service**: `sf9-g1-excel-import.ts` parses offline-edited master workbooks.
- **Modal Component**: `MasterExcelImportModal.tsx` provides side-by-side diff review, conflict resolution strategies (`merge`, `fill_blanks`, `overwrite`), and live filtering.
- **Guards**:
  - Automatically filters out unassessed `#3F3F3F` cells and `#000000` columns.
  - Normalizes ratings to DepEd valid descriptors (`A`, `B`, `C`, `D`, `E`).
  - Matches students by LRN with name fallback.

---

## 6. 17-Sheet Unified Master Workbook Sheet Discovery
- In the official DepEd 17-sheet master workbook (`UPDATED [Grade 1] ECR, PACE Form, and SF9.xlsx`), `<sheet>` tags in `xl/workbook.xml` contain `state="visible"` before `name` (e.g., `<sheet state="visible" name="..." sheetId="..." r:id="..."/>`).
- `getWorkbookSheetMap` must use the flexible regex:
  ```typescript
  const sRegex = /<sheet\b([^>]*?)\/?>/g;
  ```
  and match `name="([^"]+)"` and `r:id="([^"]+)"` independently of attribute order.
- Default fallback mappings for all 17 worksheets (`Home` = sheet1 through `G1 - ATTENDANCE SUMMARY` = sheet17) must remain in place.
- In OpenXML formulas, ampersands are escaped (`&amp;`). Sheet names extracted from formulas (such as `'TERM 1 READING &amp; LITERACY'`) **MUST** be decoded with `unescapeXml` before looking up keys in `subjectSheetXmls`.

---

## 7. PACE Ratings & Remarks Data Lookup
- **Learner Key Fallback**: Must check `st.lrn`, `st.lrn?.trim()`, and `st.id` (internal ID).
- **Structure Flexibility**: Must support both nested `{ ratings: { ... } }` and flat rating dictionaries `{ [subId]: { t1, t2, t3 } }`.
- **GMRC & Makabansa Merge**: `formease_pace_gmrc_ratings` and `formease_pace_makabansa_ratings` must both be merged into `gmrcMakabansa`.
- In `Student` interface (`src/types/index.ts`), `id?: string;` must remain present so `st.id` is strongly typed without `any` casts.

---

## 8. Protected Files List
Do NOT alter or revert any of the following files when working on other tasks or forms:
1. `app/src/services/sf9-g1-excel-export.ts`
2. `app/src/services/sf9-g1-excel-import.ts`
3. `app/src/services/g1-pace-lookup-map.ts`
4. `app/src/services/pace-template-config.ts`
5. `app/src/services/pace-language-template-config.ts`
6. `app/src/components/pace/PaceFormRenderer.tsx`
7. `app/src/components/MasterExcelImportModal.tsx`
8. `app/src/services/sf9-g1-excel-import.test.ts`
9. `app/src/testing/sf9Grade1PacePrintSetup.test.ts`
10. `app/public/templates/UPDATED [Grade 1] ECR, PACE Form, and SF9.xlsx`
11. Grade 1 PACE & SF9 export & import handlers in:
    - `app/src/pages/PaceFormPage.tsx`
    - `app/src/pages/SF9Page.tsx`
