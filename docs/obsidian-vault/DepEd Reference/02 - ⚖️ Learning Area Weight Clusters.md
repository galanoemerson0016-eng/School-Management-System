---
title: Learning Area Weight Clusters
tags:
  - deped
  - grading
  - weights
  - clusters
created: 2026-08-17
---

# ⚖️ Learning Area Weight Clusters

FormEase Pro calculates quarterly grades using DepEd learning area cluster weights configured in `app/src/lib/subjectConfig.ts`.

---

## 📊 Standard Weight Breakdown by Grade & Track

### 🏫 Elementary & Junior High School (Grades 1–10)

| Cluster ID | Learning Areas | WW (%) | PT (%) | QA (%) |
| :--- | :--- | :---: | :---: | :---: |
| `languages_ap_esp` | English, Filipino, AP, ESP / Values, Mother Tongue | **30%** | **50%** | **20%** |
| `science_math` | Science, Mathematics | **40%** | **40%** | **20%** |
| `mapeh_epp_tle` | MAPEH (Music, Arts, PE, Health), EPP, TLE | **20%** | **60%** | **20%** |

---

### 🎓 Senior High School (Grades 11–12)

| Cluster ID | Subject Classification | WW (%) | PT (%) | QA (%) |
| :--- | :--- | :---: | :---: | :---: |
| `shs_core` | Core Subjects (Oral Comm, Gen Math, Earth Science, etc.) | **25%** | **50%** | **25%** |
| `shs_applied_academic` | Applied Academic (Empowerment Tech, Practical Research) | **25%** | **45%** | **30%** |
| `shs_tvl_work_immersion`| TVL Specializations, Work Immersion, Research Practicum | **20%** | **60%** | **20%** |
| `shs_field_exposure` | Pure Internship / On-the-Job Training | **0%** | **100%** | **0%** |

---

## 🛠️ Custom Weight Customization

Teachers can override standard weights per subject in **Subjects Hub ➔ Edit Subject Weights** to tailor specialized elective courses or school-specific grading policies.

See also:
- [[02 - 📊 Grading Engine & DepEd Formulas]]
- [[01 - 📜 MATATAG Curriculum Standards]]
