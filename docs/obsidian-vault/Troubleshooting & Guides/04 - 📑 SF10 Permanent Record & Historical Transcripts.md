---
title: SF10 Permanent Record & Historical Transcripts
tags:
  - sf10
  - permanent-record
  - transcripts
  - deped
created: 2026-08-17
---

# 📑 SF10 Permanent Record & Historical Transcripts

FormEase Pro provides an automated multi-grade **DepEd Form 137 / School Form 10 (SF10)** generator supporting Elementary (SF10-ES), Junior High (SF10-JHS), and Senior High School (SF10-SHS).

---

## 🏛️ SF10 Architecture & Multi-Year Aggregation

```mermaid
graph TD
    History["📅 Multi-Year Academic Records"] --> Engine["⚙️ SF10 Transmutation & Summary Engine"]
    Engine --> ES["SF10-ES (Elementary Grades 1-6)"]
    Engine --> JHS["SF10-JHS (Junior High Grades 7-10)"]
    Engine --> SHS["SF10-SHS (Senior High Semesters 1-4)"]
    
    SHS --> Render["🖨️ SF10SHSRenderer.tsx (Vector PDF & Print Preview)"]
    JHS --> Render
    ES --> Render
```

---

## 📋 Standard DepEd SF10 Sections
1. **Learner's Information**: LRN, Full Name, Birthdate, Gender, School Name & ID.
2. **Eligibility Verification**: Elementary Completer / PEPT Passer / ALS Completer checkboxes.
3. **Scholastic Records (Table per Grade/Semester)**:
   - Learning Areas, Quarter Ratings (Q1–Q4), Final Rating, Remarks (Passed/Failed).
   - General Average for the School Year.
4. **Certification of Transfer / Records Clearance**: Head Teacher / Registrar signatures and official school seal block.

See also:
- [[03 - 📄 School Forms (SF9, SF10, SF5)]]
- [[02 - 📊 Grading Engine & DepEd Formulas]]
- [[07 - 🎓 Awards Engine & Certificate Generator]]
