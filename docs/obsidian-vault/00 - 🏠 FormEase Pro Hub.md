---
title: FormEase Pro Knowledge Hub
tags:
  - formease
  - overview
  - deped
  - architecture
created: 2026-08-17
updated: 2026-08-17
---

# 🏫 FormEase Pro — Master Knowledge Hub

Welcome to the **FormEase Pro Knowledge Vault**! This vault contains official architectural documentation, DepEd grading standard workflows, troubleshooting guides, and release roadmaps.

```mermaid
graph TD
    Hub["🏠 FormEase Pro Hub"] --> Arch["🏗️ Architecture"]
    Hub --> Features["⚡ Features & Engines"]
    Hub --> Grading["📊 Grading & DepEd Standards"]
    Hub --> Guides["🛠️ Troubleshooting & Guides"]
    Hub --> Releases["📋 Releases & History"]

    Arch --> DB["[[01 - 🗄️ Database & Offline Storage]]"]
    Arch --> Sec["[[03 - 🔐 Security, Encryption & Auth]]"]
    Arch --> Backup["[[04 - 🔄 Backup & Auto-Reconciliation]]"]
    Arch --> Gate["[[05 - 📱 Mobile Gateway & Local Attendance Sync]]"]
    Arch --> Lic["[[06 - 🔑 License Portal & Activation Cryptography]]"]

    Features --> IDCard["[[05 - 🪪 Student ID Card Generator & Layouts]]"]
    Features --> SMS["[[06 - 📩 SMS Gateway & Parent Notification System]]"]
    Features --> Awards["[[07 - 🎓 Awards Engine & Certificate Generator]]"]

    Grading --> Engine["[[02 - 📊 Grading Engine & DepEd Formulas]]"]
    Grading --> Matatag["[[01 - 📜 MATATAG Curriculum Standards]]"]
    Grading --> Weights["[[02 - ⚖️ Learning Area Weight Clusters]]"]

    Guides --> Sync["[[01 - 🐞 Subject & Section Sync Guide]]"]
    Guides --> Recovery["[[02 - 🔑 Emergency Password Recovery]]"]
    Guides --> Forms["[[03 - 📄 School Forms (SF9, SF10, SF5)]]"]
    Guides --> SF10["[[04 - 📑 SF10 Permanent Record & Historical Transcripts]]"]

    Releases --> Index["[[01 - 📋 Version History Index]]"]
    Releases --> Latest["[[02 - 🚀 v2.11.2 Release Notes]]"]
```

---

## 🧭 Navigation Map

### 🏗️ Architecture & Core Systems
* **[[01 - 🗄️ Database & Offline Storage]]** — IndexedDB schema, AES-256-GCM encryption, safeStorage keychains.
* **[[02 - 📊 Grading Engine & DepEd Formulas]]** — Weighted scores, transmutation tables, HPS isolation, and Grade 1 PACE forms.
* **[[03 - 🔐 Security, Encryption & Auth]]** — PBKDF2 hashing, master recovery keys, hardware machine ID binding.
* **[[04 - 🔄 Backup & Auto-Reconciliation]]** — Multi-slot backups, JSON snapshots, and post-update self-healing.
* **[[05 - 📱 Mobile Gateway & Local Attendance Sync]]** — Embedded Express LAN microservice (:3001), WebRTC QR scanner.
* **[[06 - 🔑 License Portal & Activation Cryptography]]** — Offline hardware key hashing, obfuscated desktop shields.

### ⚡ Key Features & Engines
* **[[05 - 🪪 Student ID Card Generator & Layouts]]** — DepEd ID card layouts, 300 DPI vector PDF sheets, Code128 barcodes.
* **[[06 - 📩 SMS Gateway & Parent Notification System]]** — Automated parent SMS alerts via GSM modem / Android bridge.
* **[[07 - 🎓 Awards Engine & Certificate Generator]]** — Academic Excellence evaluators, Old English calligraphy diplomas.

### 📜 DepEd Standards & Regulations
* **[[01 - 📜 MATATAG Curriculum Standards]]** — DepEd Order 2026 compliance, elementary clusters, junior high subjects.
* **[[02 - ⚖️ Learning Area Weight Clusters]]** — Written Works, Performance Tasks, and Quarterly Exams weight configurations.

### 🛠️ Troubleshooting & Guides
* **[[01 - 🐞 Subject & Section Sync Guide]]** — Resolving custom subject variants, section normalization, and E-Class dropdowns.
* **[[02 - 🔑 Emergency Password Recovery]]** — 2-step password reset, master key `formease`, and lockout protection.
* **[[03 - 📄 School Forms (SF9, SF10, SF5)]]** — SF9 Learner Progress, SF10 Permanent Record, SF5 Promotion, and SF6 Summaries.
* **[[04 - 📑 SF10 Permanent Record & Historical Transcripts]]** — Multi-year scholastic transcript generation and eligibility clearance.

### 📋 Release & Changelogs
* **[[01 - 📋 Version History Index]]** — Complete release timeline and major architectural milestones.
* **[[02 - 🚀 v2.11.2 Release Notes]]** — Subject normalization, E-Class score grid fallback, and bundle optimizations.

---

## ⚡ Quick App Specs
- **Framework**: React 19 + TypeScript + Vite 7
- **Desktop Runtime**: Electron 34 with Node.js 20
- **Database**: IndexedDB (Native `FormEaseDB`, Version 11)
- **Encryption**: AES-256-GCM + PBKDF2 (100,000 iterations)
- **Styling**: Tailwind CSS + Framer Motion
- **Reports**: ExcelJS, jsPDF, PDFKit, Canvas 2D
