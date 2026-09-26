# FORMEASE PRO: MASTER SYSTEM ARCHITECTURE, DEPED REGULATORY CORPUS, 3-TERM CALENDAR & GRADING SPECIFICATION
**The Definitive Encyclopedic Knowledge Base for AI-Assisted Engineering, Re-Architecture, and Next-Generation School Management System Development**

---

## 1. EXECUTIVE SUMMARY & SYSTEM OVERVIEW

### 1.1 Project Purpose & Domain Mission
**FormEase Pro** is an offline-first, enterprise-grade School Management, Grading, and Compliance System engineered specifically for the Philippine basic education system governed by the **Department of Education (DepEd)**. The platform replaces the fragile, unlinked Microsoft Excel spreadsheets passed between teachers on USB flash drives with a secure, mathematically rigorous desktop workstation.

The application manages the complete administrative, academic, and pastoral lifecycle of Philippine public and private schools:
- **Demographics & Enrollment**: 12-digit Learner Reference Number (LRN) tracking, 4Ps (Pantawid Pamilyang Pilipino Program) CCT Household ID tracking, Indigenous Peoples (IP) tagging, Mother Tongue tracking, and biometric/nutritional indicators.
- **Continuous Assessment & Transmutation**: Formative and summative assessment computation adhering strictly to DepEd component weights (Written Works, Performance Tasks, Quarterly/Term Assessments) across K-12, MATATAG, Senior High School (SSHS), and Special Curricular Programs.
- **3-Term Trimester Scheduling**: Comprehensive support for the modern 3-Term school calendar alongside historical 4-quarter archives.
- **DepEd School Forms Automation**: 100% pixel-perfect generation of official DepEd forms:
  - **SF1**: School Register (Census of learners, demographics, family data).
  - **SF2**: Daily Attendance Record (Monthly register, absenteeism, tardiness, cutting classes, ADA metrics).
  - **SF5**: Report on Promotion and Level of Proficiency (Promoted, Conditional, Retained rosters, remedial tracking).
  - **SF6**: Summarized Report on Promotion (School-wide statistical consolidation across all grade levels).
  - **SF8**: Learner Basic Health and Nutrition Report (BMI calculation, Height-for-Age, stunting/wasting analysis).
  - **SF9**: Learner Progress Report Card (Form 138: Front & Back covers, observed core values, narrative remarks).
  - **SF10**: Learner Permanent Academic Record (Form 137: Court-admissible multi-page transcripts for ES, JHS, SHS).
  - **ECR**: Electronic Class Record (Teacher-level raw score grading sheet with automatic transmutation).
  - **LIR**: Learner's Individual Record (Anecdotal notes, counseling logs, behavioral interventions).
  - **TGS**: Temporary Grade Slip (Transferee student documentation under DO 54 s. 2016).
  - **PACE**: Performance Assessment of Core Elements (MATATAG Grade 1 competency assessment with Descriptors A–E).
- **Document & Credential Production**: Student ID cards with Code128 barcodes and verification QR codes (12 design presets), batch name tags, moving-up diplomas, graduation certificates, and academic honors awards.
- **Zero-Loss Data Integrity**: Hardware-bound encryption, atomic database backups, pre-update safety vaults, automated background heartbeats, and automated startup database self-healing.

---

### 1.2 Core Architectural Pillars & Engineering Principles
FormEase Pro is engineered according to five foundational architectural pillars designed to survive the harsh constraints of Philippine public school environments:

1. **Offline-First & Zero-Cloud Dependency**:
   - The system is completely autonomous and requires no active Internet connection or cloud subscriptions to operate. All database transactions, cryptographic operations, document renderings, and form calculations execute locally on the user's machine.
2. **Mathematical Invariance & Regulatory Compliance**:
   - Every grade computation, percentage score conversion, transmutation lookup, and unit-weighted average calculation is mathematically deterministic and provably compliant with DepEd Orders (DO 8 s. 2015, DO 17 s. 2026, DO 10 s. 2024). Floating-point errors are eliminated through integer-scaling and standard DepEd half-up rounding rules.
3. **Surgical OpenXML Injection (`JSZip`)**:
   - Instead of regenerating spreadsheets from scratch (which strips VBA macros, breaks print page setups, and corrupts embedded vector logos), FormEase Pro surgically injects student grades and demographic text directly into official DepEd `.xlsx` templates at the raw XML stream level, preserving 100% template fidelity.
4. **Zero-Loss Multi-Tiered Safety & Atomic Disk Persistence**:
   - Data corruption is prevented through atomic disk writes (`fsyncSync`), mandatory pre-restore safety snapshots, dual-format backup pairs (`.json` + `.xlsx`), 30-minute background heartbeats, and in-memory dry-run preview banners before committing any database restore.
5. **Hardware-Bound Cryptographic Isolation**:
   - Sensitive learner records are encrypted at rest using AES-256-GCM envelope encryption backed by Electron's `safeStorage` (Windows DPAPI / macOS Keychain), with license verification bound strictly to the physical motherboard and processor hardware IDs.

---

### 1.3 Complete Technology Topology & Runtime Architecture
- **Desktop Runtime**: **Electron 41.2** with strict process isolation (`contextIsolation: true`, `nodeIntegration: false`, sandboxed renderer) running on Node.js 24 LTS.
- **Frontend Stack**: **React 19.2**, **TypeScript ~5.9**, **Vite 7.2**, **Zustand 5.0** (modular slice architecture), and **Tailwind CSS v4**.
- **User Interface Componentry**: Lucide React icons, Framer Motion animations (with accessibility toggle to disable all animations), and Recharts for live grade distributions, radar competency maps, and attendance trends.
- **Persistence Layer**: **IndexedDB** (`formease_pro_db`, Version 16+) with 16 isolated object stores, featuring an **AES-256-GCM envelope encryption** model derived from a **PBKDF2-SHA-256 (100,000 iterations)** Key Encryption Key (KEK) and backed by Electron **`safeStorage`** (Windows DPAPI).
- **High-Fidelity Document Engines**:
  - **Direct OpenXML Injection Engine (`JSZip`)**: Surgical XML manipulation of native Microsoft Excel `.xlsx` packages that preserves all embedded macros, drawing objects, vector logos, and shared formulas without triggering Excel repair dialogs.
  - **Client-Side PDF Vector Synthesis**: `@react-pdf/renderer 4.3` and `jspdf 4.1` for permanent transcripts (SF10) and legal certificates.
  - **Hybrid Mobile Gateway**: Local Express/Firebase relay allowing teachers to scan QR-code student attendance using mobile devices on local school Wi-Fi without internet connectivity.

---

### 1.4 Offline Licensing & Hardware-Bound Security Model
FormEase Pro incorporates a tamper-proof, hardware-bound licensing subsystem that guarantees offline operation while preventing unauthorized software piracy across unauthorized hardware:

- **Hardware Machine ID Derivation**:
  - Utilizes `node-machine-id` to extract unique hardware identifiers from the CPU, motherboard BIOS UUID, and primary disk drive serial numbers (`getMachineId()`).
- **Main-Process License Authority**:
  - The activation verdict lives strictly in the **Electron Main process** (`app/electron/license.cjs`), completely isolated from the browser renderer. The frontend communicates with the main process via read-only IPC calls (`window.electronAPI.licenseStatus`); editing `localStorage` or IndexedDB in Developer Tools cannot unlock the software.
- **Cryptographic Signature Verification**:
  - The license record is persisted to `userData/license.dat` as JSON with an HMAC-SHA256 signature keyed from `${KEY_CONTEXT}::${getMachineId()}`.
  - Verification uses constant-time byte buffer comparison (`crypto.timingSafeEqual`) to eliminate timing side-channel attacks.
  - Copying `license.dat` to another physical computer immediately invalidates the cryptographic binding.
- **14-Day Grace Trial & Offline Autonomy**:
  - Unactivated installations support a time-boxed 14-day trial mode with local timestamp validation.
  - Once activated with a legitimate serial key, the software functions **indefinitely offline**, never requiring recurring cloud check-ins or locking out teachers during regional internet blackouts.

---

### 1.5 Storage Architecture, IndexedDB Envelope Encryption & Atomic Disk Persistence
FormEase Pro employs a dual-tier persistence architecture combining in-browser IndexedDB with physical operating system disk storage:

#### 1. IndexedDB Schema (`formease_pro_db`, Version 16+)
Consists of 16 distinct object stores:
1. `students`: Master learner demographic and biometric records (Encrypted).
2. `studentProfiles`: Extended academic history and past enrollments.
3. `sections`: Official class sections, advisory tags, and curriculum assignments.
4. `subjects`: Learning areas catalog, weight configurations, and unit values.
5. `classRecords`: Teacher E-Class Record assessment scores and term ratings (Encrypted).
6. `gradingSheetRecords`: Master consolidated subject grades per quarter/term (Encrypted).
7. `hpsRecords`: Highest Possible Score benchmarks for written works and performance tasks.
8. `sf2Sheets`: Monthly SF2 attendance registers and status logs (Encrypted).
9. `attendanceRecords`: Daily roll-call check-in records with status codes (Encrypted).
10. `enrollments`: School year learner enrollment linking records (Encrypted).
11. `observedValues`: DepEd Core Values quarterly behavioral evaluations (Encrypted).
12. `automated_backups`: Internal snapshot history and checksum logs (Encrypted).
13. `announcements`: Administrative announcements and broadcast notices.
14. `schoolYears`: Historical and active school year definitions (`2026-2027`, etc.).
15. `schoolProfile`: Institutional metadata, school ID, logos, and specimen signatures.
16. `users`: Local authenticated user accounts and permission roles.

#### 2. Envelope Encryption with Projected Indexing
- The 8 stores containing sensitive learner Personally Identifiable Information (PII) and academic ratings (`students`, `classRecords`, `enrollments`, `attendanceRecords`, `sf2Sheets`, `gradingSheetRecords`, `observedValues`, `automated_backups`) are stored as **AES-256-GCM encrypted envelopes**:
  ```typescript
  interface EncryptedEnvelope {
    lrn?: string;
    id?: string;
    iv: string;          // 12-byte initialization vector
    ciphertext: string;  // AES-256-GCM encrypted payload
    is_encrypted: boolean;
    // Projected plaintext indexing fields for query performance:
    student_lrn?: string;
    subject_id?: string;
    school_year?: string;
  }
  ```
- By projecting non-sensitive foreign keys (`student_lrn`, `subject_id`, `school_year`) as plaintext index properties on the envelope, IndexedDB indexes perform rapid range queries without requiring in-memory decryption of the entire database.

#### 3. Atomic Physical Disk Persistence (`backup-files.cjs`)
- **Dual-Format Verified Backup Pairs**:
  - Every automated backup creates a synchronized dual-file pair in the operating system's `userData/backups/` directory:
    1. A canonical JSON snapshot (`SMS_Backup_Automated_${stamp}.json`).
    2. A full multi-tab Master Excel Rescue Workbook (`FormEase_Automated_${stamp}.xlsx`) containing all tables in raw human-readable sheets.
    3. A cryptographic manifest (`FormEase_Automated_${stamp}_Manifest.json`) verifying both files.
- **Crash-Proof Write Protocol**:
  - Data is written to a temporary file (`.tmp`), flushed to physical disk sectors via `fsyncSync`, hardlinked to the target filename, and immediately read back from disk to verify byte-for-byte fidelity (`saved.equals(bytes)`).
- **Mandatory Pre-Restore Safety Guardrail**:
  - The system enforces a strict fail-safe: before restoring an imported backup, the application physically verifies that a fresh safety backup of the current database has been generated and validated within the last 5 minutes (`isInstallBackupReady`). Users can never accidentally overwrite their live school data.

---

### 1.6 Authentication, Single-User Model & Emergency Master Recovery Protocol

#### 1. The Single Local-Account Model
- In Philippine public schools, each desktop computer or teacher laptop serves as a dedicated local workstation. FormEase Pro is architected as a **single-user local installation per machine**, eliminating the complexity of multi-tenant cloud authentication while ensuring total offline resilience.
- Local administrator credentials are created during the first-run setup wizard (`AccountSetupPage.tsx`) and stored locally with secure cryptographic password hashing.

#### 2. The Emergency Master Password Protocol (`formease`)
- **The Operational Challenge**:
  - In rural, air-gapped schools, teachers and administrators frequently forget their local passwords. Because the software operates entirely offline, standard "Forgot Password" email recovery flows cannot function.
- **The Architectural Solution**:
  - FormEase Pro embeds a protected emergency recovery protocol: the master password **`formease`**.
  - Entering `formease` at the login prompt allows verified school heads, registrars, and DepEd ICT coordinators to bypass a locked local account, regain access to the desktop workstation, and reset local credentials without triggering a destructive database wipe or corrupting the underlying Data Encryption Key (DEK).

---

### 1.7 Role-Based Access Control (RBAC) & Educational Personas
FormEase Pro enforces granular permission boundaries aligned with the three primary personas in Philippine schools:

1. **Administrator / School Head**:
   - Complete governance over school profile metadata, DepEd logos, and institutional branding.
   - User account management and master password reset administration.
   - School-wide statistical reporting, including SF6 consolidated promotional summaries.
   - Access to system maintenance tools, diagnostic engines, and database wipe/purge procedures.
2. **Class Adviser**:
   - Exclusive authority over their assigned advisory class section.
   - Management of learner masterlists (SF1), daily attendance roll call, and monthly SF2 registers.
   - Generation and signing of official SF5 promotional reports, SF9 report cards (Form 138), and SF10 permanent records (Form 137).
   - Recording of DepEd Core Values observations, behavioral anecdotes, and Learner's Individual Records (LIR).
3. **Subject Teacher**:
   - Access restricted strictly to assigned learning areas and teaching load sections.
   - Encoding of formative assessment raw scores (Written Works, Performance Tasks, Quarterly Exams) in Electronic Class Records (ECR).
   - Synchronizing finalized subject ratings into the class adviser's master consolidated grade ledger.

---

### 1.8 Peripheral & Hardware Interfacing Topology
FormEase Pro interfaces directly with physical classroom and office hardware without external drivers:

- **USB Barcode & QR Wedge Scanners**:
  - Integrated keyboard-event buffer listener with debounce logic that detects high-speed character streams from handheld laser/CCD scanners, instantly looking up student LRNs during attendance roll call.
- **WebCam Video Stream Scanner**:
  - HTML5 `MediaDevices.getUserMedia()` video capture pipeline coupled with pure-JavaScript `jsQR` decoding, providing instant visual feedback and audio chimes upon scanning student ID cards.
- **Hardware GSM Cellular Modems (Offline Parent SMS)**:
  - Connects to USB GSM dongles over serial COM ports via Node.js serial communication. Dispatches standard AT commands (`AT+CMGS`) to send automated SMS notifications to parents (e.g. absences, tardiness, emergency suspensions) directly through local cellular towers without internet.
- **Local Wi-Fi P2P Attendance Relay**:
  - An embedded local HTTP/WebSocket server allowing teachers and gatekeepers to use the `formease-mobile` smartphone application over school Wi-Fi to scan student IDs at campus entry points, streaming attendance data directly into the desktop database in real time.

---

## 2. THE COMPLETE DEPED REGULATORY & LEGAL CORPUS

FormEase Pro is engineered to be mathematically, procedurally, and legally compliant with the full body of policies issued by the Philippine Department of Education. Every algorithm, validation rule, form layout, and database entity maps directly to an official DepEd Order or Republic Act:

---

### 2.1 DepEd Order No. 8, s. 2015
*Policy Guidelines on Classroom Assessment for the K to 12 Basic Education Program*

- **Formative vs. Summative Philosophy**:
  - *Formative Assessment*: Executed continuously during the learning process to inform teaching adjustments and provide non-graded feedback.
  - *Summative Assessment*: Administered at defined instructional milestones to measure competency achievement and determine term ratings.
- **Three Core Summative Assessment Components**:
  1. **Written Works (WW)** (1 to 10 activities per term): Quizzes, unit summative tests, essays, written laboratory reports, problem sets.
  2. **Performance Tasks (PT)** (1 to 10 activities per term): Hands-on demonstrations, laboratory experiments, multimedia presentations, research projects, physical performance.
  3. **Quarterly/Term Assessment (QA / TE)** (1 major examination per term): Comprehensive evaluative synthesis of term learning competencies.
- **Mathematical Calculation Standard**:
  1. Calculate raw total scores for each component:
     $$\text{Total Raw Score}_{\text{comp}} = \sum_{i=1}^{n} \text{Score}_i$$
  2. Compute Percentage Score (PS):
     $$\text{Percentage Score (PS)} = \left( \frac{\text{Learner's Total Raw Score}}{\text{Highest Possible Score (HPS)}} \right) \times 100\%$$
  3. Compute Weighted Score (WS) based on curriculum cluster weights:
     $$\text{Weighted Score (WS)} = \text{Percentage Score (PS)} \times \text{Component Weight Percentage}$$
  4. Compute Initial Grade:
     $$\text{Initial Grade} = \text{WS}_{\text{WW}} + \text{WS}_{\text{PT}} + \text{WS}_{\text{QA}}$$
  5. Transmute Initial Grade into the final DepEd transmuted rating (60 to 100 scale).

- **Complete Component Weighting Matrix Across All Tracks**:

  | Education Level | Subject Cluster | Written Works (WW) | Performance Tasks (PT) | Quarterly Exam (QA) |
  | :--- | :--- | :---: | :---: | :---: |
  | **Grades 1 to 10** | Languages (English, Filipino), AP, EsP / Values Ed | **20%** (0.20) | **50%** (0.50) | **30%** (0.30) |
  | **Grades 1 to 10** | Science, Mathematics | **40%** (0.40) | **40%** (0.40) | **20%** (0.20) |
  | **Grades 1 to 10** | MAPEH (Music, Arts, PE, Health), EPP / TLE | **20%** (0.20) | **60%** (0.60) | **20%** (0.20) |
  | **Senior High School** | Core Subjects | **25%** (0.25) | **50%** (0.50) | **25%** (0.25) |
  | **Senior High School** | Academic Track (HUMSS, ABM, STEM, GAS) | **25%** (0.25) | **45%** (0.45) | **30%** (0.30) |
  | **Senior High School** | TVL, Sports, Arts & Design Tracks | **35%** (0.35) | **40%** (0.40) | **25%** (0.25) |
  | **Senior High School** | Work Immersion / Culminating Activity / Practicum | **20%** (0.20) | **60%** (0.60) | **20%** (0.20) |

- **Official DepEd Transmutation Scale (60 to 100 Scale)**:
  Initial grades (spanning $0.00$ to $100.00$) are mapped to Transmuted Ratings where a raw percentage score of **60.00% represents the minimum passing grade of 75**:

  | Initial Grade Range | Transmuted Grade | Initial Grade Range | Transmuted Grade | Initial Grade Range | Transmuted Grade |
  | :---: | :---: | :---: | :---: | :---: | :---: |
  | `100.00` | **100** | `85.60 – 87.19` | **91** | `68.00 – 69.59` | **80** |
  | `98.40 – 99.99` | **99** | `84.00 – 85.59` | **90** | `66.40 – 67.99` | **79** |
  | `96.80 – 98.39` | **98** | `82.40 – 83.99` | **89** | `64.80 – 66.39` | **78** |
  | `95.20 – 96.79` | **97** | `80.80 – 82.39` | **88** | `63.20 – 64.79` | **77** |
  | `93.60 – 95.19` | **96** | `79.20 – 80.79` | **87** | `61.60 – 63.19` | **76** |
  | `92.00 – 93.59` | **95** | `77.60 – 79.19` | **86** | `60.00 – 61.59` | **75 (Passing)** |
  | `90.40 – 91.99` | **94** | `76.00 – 77.59` | **85** | `56.00 – 59.99` | **74** |
  | `88.80 – 90.39` | **93** | `74.40 – 75.99` | **84** | `52.00 – 55.99` | **73** |
  | `87.20 – 88.79` | **92** | `72.80 – 74.39` | **83** | `48.00 – 51.99` | **72** |
  | — | — | `71.20 – 72.79` | **82** | `44.00 – 47.99` | **71** |
  | — | — | `69.60 – 71.19` | **81** | `40.00 – 43.99` | **70** |
  | — | — | — | — | `0.00 – 39.99` | **60 to 69** |

- **Rounding Standard**: All intermediate percentage scores and final weighted averages adhere strictly to DepEd half-up rounding: values with fractional parts $\ge 0.50$ round up to the next integer ($74.50 \rightarrow 75$ Passed; $74.49 \rightarrow 74$ Failed).

---

### 2.2 DepEd Order No. 017, s. 2026 & DepEd Order No. 015, s. 2026
*Strengthened Senior High School (SSHS) Curriculum & Standardized 3-Term School Calendar*

FormEase Pro provides the nation's premier software implementation of the modern Strengthened Senior High School curriculum:

#### 1. The Modern 3-Term Trimester Model
- Fully replaces the legacy 2-semester (4 quarters) system for Senior High School starting SY 2026–2027.
- Operates on three distinct instructional terms: **Term 1**, **Term 2**, and **Term 3**.

#### 2. Universal Grade 11 Core Subjects
Every Grade 11 student in the Philippines under DO 017 s. 2026 takes six universal core subjects regardless of track:
1. *Effective Communication* (in English - 160 hours / 2 units per term)
2. *Mabisang Komunikasyon* (sa Filipino - 160 hours / 2 units per term)
3. *General Mathematics* (160 hours / 2 units per term)
4. *General Science* (160 hours / 2 units per term)
5. *Life and Career Skills* (160 hours / 2 units per term)
6. *Pag-aaral ng Kasaysayan at Lipunang Pilipino* (160 hours / 2 units per term)
- **Total Core Instructional Budget**: **960 hours** (6 core subjects $\times$ 160 hours).

#### 3. Annex A: The 128-Elective Catalog, Prerequisite Validation & TESDA NC Linkage
Implemented in `app/src/lib/sshsCatalog.ts`:
- **80 Academic Track Electives**: Organized across ASSH (Arts, Social Sciences, and Humanities), BE (Business and Entrepreneurship), STEM, FE (Field Experience), and SHW (Sports, Health, and Wellness).
- **48 Technical-Professional (Tech-Pro) Electives**: Aligned directly with Technical Education and Skills Development Authority (**TESDA**) Training Regulations (**TR**) and National Certificate (**NC**) qualifications:
  - *NC I / NC II / NC III* certification competencies embedded within elective course modules.
  - Work Immersion courses (320, 540, or 640 hours).
- **Prerequisite Validation Engine**:
  - Supports dependency types:
    - `all`: Learner must have successfully passed all listed prerequisite subjects.
    - `any`: Learner must have passed at least one of the listed prerequisites.
    - `count`: Learner must have completed a minimum number of cluster electives (e.g. Work Immersion requires 6 completed cluster electives).

#### 4. Tables 9 & 10: Retention, Promotion & Graduation Requirements
Implemented in `app/src/lib/sshsGraduation.ts`:
- Evaluates student graduation eligibility based on curriculum completion:
  - **Academic Track**: Requires completion of 960 Core Hours + 1,280 Elective Hours (16 electives $\times$ 80 hours) = **2,240 Total Hours**.
  - **Tech-Pro Track**: Requires completion of 960 Core Hours + 1,440 Elective Hours (including 320h, 540h, or 640h Work Immersion) = **2,400 Total Hours**.
  - **Cross-Track Enrollment Rules**: A learner may enroll in up to two electives from another track without disqualification.
  - **Evaluation Output**: Generates formal status determinations:
    - `Eligible`: All core and elective requirements satisfied.
    - `Incomplete`: Deficient in elective hours, missing work immersion, or unresolved prerequisites.
    - `Disqualified`: Failing grade ($<75$) in any universal core subject.

#### 5. Annex F.2: Official Equivalency Matrix (K-12 to SSHS)
Implemented in `app/src/lib/sshsEquivalency.ts`:
- Bridges legacy 2016 K-12 Senior High School subjects to 2026 SSHS electives for transferees, repeaters, and *Balik-Aral* students (e.g., crediting legacy *Creative Writing* towards *Creative Composition 1*, or *Empowerment Technologies* towards *ICT Productivity Software*).

#### 6. Unit-Weighted General Average Formula
Unlike Elementary and JHS, Senior High School under DO 017 computes a **Unit-Weighted General Average**:
$$\text{General Average}_{\text{SHS}} = \text{round}\left( \frac{\sum (\text{Final Subject Grade} \times \text{Total Subject Units})}{\sum \text{Total Subject Units}} \right)$$
Where:
- Core Subjects = **2 units** per term.
- Academic Electives = **3 units** per term.
- Tech-Pro Electives = **4 units** per term.
- Work Immersion / Practicum = **12 units**.

---

### 2.3 DepEd Order No. 010, s. 2024 (MATATAG Curriculum)
*Policy Guidelines on the Implementation of the MATATAG Curriculum for Kindergarten to Grade 10*

- **Simplified Primary Curriculum (Key Stage 1: Grades 1 to 3)**:
  - De-congests early education to build strong foundational literacy, numeracy, and socio-emotional skills.
  - *Grade 1 Official Learning Areas*:
    1. Language
    2. Reading and Literacy
    3. Mathematics
    4. Makabansa
    5. Good Manners and Right Conduct (GMRC)
- **Strict Nomenclature Boundary (GMRC vs. Values Education)**:
  - Grades 1 through 6: Designated strictly as **GMRC (Good Manners and Right Conduct)** under Republic Act No. 11476.
  - Grades 7 through 10: Designated strictly as **Values Education**.
- **Grade 1 PACE Form (Performance Assessment of Core Elements)**:
  - Granular competency-based evaluation across Reading, Language, Math, and GMRC/Makabansa.
  - *5-Point Qualitative Descriptor Scale*:
    - **A (Advanced)**: Consistently exhibits mastery independently.
    - **B (Proficient)**: Demonstrates competency with minimal prompting.
    - **C (Approaching Proficiency)**: Developing; requires regular assistance.
    - **D (Developing)**: Emerging; requires direct guidance and scaffolding.
    - **E (Beginning)**: Not yet demonstrating competency.
  - *Print Fidelity Budget*: Strictly formatted to a 4-page print layout (print scale 62%, margins 0.25", Bookman Old Style 12pt).

---

### 2.4 DepEd Order No. 36, s. 2016
*Policy Guidelines on Awards and Recognition for the K to 12 Basic Education Program*

- **Academic Excellence Awards Criteria (Evaluated at End of School Year)**:
  - **With Highest Honors / May Pinakamataas na Karangalan**: General Average of **98.00 to 100**, with **no quarterly, trimester, or final grade below 85** in any subject.
  - **With High Honors / May Mataas na Karangalan**: General Average of **95.00 to 97.99**, with **no quarterly, trimester, or final grade below 85** in any subject.
  - **With Honors / May Karangalan**: General Average of **90.00 to 94.99**, with **no quarterly, trimester, or final grade below 80** in any subject.
  - *Disqualification Rule*: Any failing grade ($<75$) or unserved disciplinary suspension automatically disqualifies a student from honor rolls regardless of General Average.
- **Special Grade-Level Awards & Objective Rubrics**:
  - *Leadership Award*: Evaluates motivational skills (40%), planning & organization (40%), and contribution to school climate (20%). Zero disciplinary records required.
  - *Award for Research / Innovation*: Project significance (35%), methodological rigor (30%), presentation/defense (15%), and final subject grade in research (20%).
  - *Award for Work Immersion*: Work immersion supervisor rating + Teacher evaluation + Portfolio defense score.
  - *Conduct & Values Awards*: Demonstrated adherence to the four DepEd Core Values (*Maka-Diyos, Makatao, Makakalikasan, Makabansa*).

---

### 2.5 DepEd Order No. 54, s. 2016
*Guidelines on the Request and Transfer of Learner's School Records*

- **The 30-Day Mandatory Transmission Rule**:
  - Upon receiving an official written request from a receiving school, origin schools are legally required to transmit official student records (SF10) within 30 calendar days.
- **Temporary Grade Slip (TGS) Mandate**:
  - While awaiting official SF10 transmission, the receiving school is legally mandated to issue a **Temporary Grade Slip (TGS)** to record quarterly marks, compute interim general averages, and ensure continuous schooling without administrative interruption.
  - FormEase Pro implements this as a high-speed, 2-up per page printable document with official certification clauses.
- **Handling Unreleased Private School Records**:
  - Preserves legal mechanisms for conditional enrollment of transferees with unresolved financial obligations in private schools, shielding children from educational exclusion.

---

### 2.6 DepEd Order No. 11, s. 2018
*Guidelines on the Preparation and Checking of School Forms*

- **Checking Committee Structures**:
  - **School Checking Committee (SCC)**: Conducts internal audits of class registers (SF1), attendance sheets (SF2), promotion reports (SF5), and report cards (SF9) prior to end-of-year ceremonies.
  - **Division Checking Committee (DCC)**: Division-level official validation team reviewing graduation cohorts.
- **Audit Sampling Protocols**:
  - 100% census audit of all records for graduating cohorts (Grades 6, 10, and 12).
  - Minimum percentage random sampling for non-graduating levels.
- **Legal Accountability**: Establishes joint administrative liability between the Class Adviser and the School Head for recording discrepancies, fraudulent grades, or unauthorized LRN modifications.

---

### 2.7 DepEd Order No. 58, s. 2017 & Standard School Forms Matrix
*Standardized Basic Education School Forms*

FormEase Pro natively renders the complete suite of DepEd administrative forms:
- **SF1 (School Register)**: Comprehensive classroom census capturing 12-digit LRN, complete legal name (`LAST, FIRST, MIDDLE, EXTENSION`), Sex, Birthdate, Computed Age as of June 1 (BoSY), Mother Tongue, IP Group, 4Ps CCT Household ID, Guardian details, and Physical Residence.
- **SF2 (Daily Attendance Record)**: Monthly attendance ledger tracking daily attendance codes: Blank (Present), `X` (Absent), `T` (Tardy), `CC` (Cutting Classes), `E` (Excused), alongside Average Daily Attendance (ADA) and SARDO early-warning indicators ($\ge 5$ consecutive absences).
- **SF5 (Report on Promotion and Level of Proficiency)**: Official EOSY promotion roster categorizing learners into Promoted, Conditional (1-2 subject deficiencies), or Retained ($\ge 3$ deficiencies), with 5-tier proficiency counts partitioned by gender.
- **SF6 (Summarized Report on Promotion)**: School-wide statistical aggregation summarizing promotional outcomes and proficiency distributions across all sections and grade levels.
- **SF8 (Learner Basic Health & Nutrition Report)**: Anthropometric monitoring recording Weight (kg), Height (m), BMI, BMI nutritional status, and Height-for-Age (HFA) stunting metrics.
- **SF9 (Learner Progress Report Card)**: Form 138 periodic report card issued to parents, featuring learning area ratings, attendance matrices, observed core values evaluations, and promotion certificates.
- **SF10 (Learner Permanent Academic Record)**: Form 137 court-admissible scholastic transcript (SF10-ES, SF10-JHS, SF10-SHS) maintaining permanent records across all school years, remedial classes, school transfers, and eligibility credentials.

---

### 2.8 DepEd Order No. 42, s. 2016
*Policy Guidelines on Daily Lesson Preparation for the K to 12 Basic Education Program*

Implemented in FormEase Pro's `OnlineGeneratorsPage.tsx` and `LessonPlannerTemplates.tsx`:
- **Daily Lesson Log (DLL)**: Mandatory template for experienced teachers (at least one year of teaching experience) tracking Lesson Objectives, Content, Learning Resources, Procedures, and Teacher Reflection.
- **Detailed Lesson Plan (DLP)**: Comprehensive instructional plan for newly hired teachers detailing step-by-step teacher and student activities.
- **The ILAW Framework**: Modern instructional design framework:
  - **I**nquiry (Review, Motivation, Problem Posing)
  - **L**iteracy & Learning (Content Presentation, Concept Exploration)
  - **A**ctive Engagement (Guided Practice, Group Collaboration, 4A's: Activity, Analysis, Abstraction, Application)
  - **W**ellness & Assessment (Evaluation, Formative Reflection, Value Integration)

---

### 2.9 DepEd Special Curricular Programs (SCPs) Legal Frameworks
FormEase Pro embeds specialized curriculum configurations, weighting models, and certificate tracks for DepEd Special Programs:
- **Special Program in the Arts (SPA)** (*DO 46 s. 2012*): Specialized tracking across Visual Arts, Theater Arts, Music (Vocal/Instrumental), Dance, Media Arts, and Creative Writing.
- **Special Program in Sports (SPS)** (*DO 55 s. 2010*): Individual and team sports tracking, athletic event attendance credit, and physical conditioning assessments.
- **Special Program in Journalism (SPJ)** (*DO 46 s. 2011 & RA 7079*): Print, broadcast, and online campus journalism curriculum.
- **Special Program in Foreign Language (SPFL)** (*DO 46 s. 2012*): Elective foreign language instruction (Spanish, Mandarin, Japanese, French, German).
- **Special Program in Technical-Vocational Education (SPTVE)**: Competency-based modular vocational skills training.
- **Science, Technology, and Engineering (STE)** (*DO 57 s. 2011*) & **Special Science Elementary Schools (SSES)**: Accelerated advanced mathematics and natural science curricula.

---

### 2.10 DepEd Order No. 40, s. 2012 & Child Protection Safeguards
*DepEd Child Protection Policy*

- **Privacy of Behavioral & Counseling Logs**:
  - Learner's Individual Record (LIR) and pastoral counseling entries are strictly classified as confidential.
  - Disciplinary infractions, suspensions, or counseling referrals must **never** be printed or recorded onto official academic transcripts (SF10) or periodic report cards (SF9).
  - Ensures a minor's scholastic record remains free from permanent derogatory annotations.

---

### 2.11 DepEd Order No. 001, s. 2024 & Republic Act No. 10173
*Immediate Removal of Administrative Tasks for Teachers & Data Privacy Act of 2012*

- **Removal of Non-Teaching Clerical Burdens**:
  - FormEase Pro directly fulfills DO 001 s. 2024 by automating all school form compilations, attendance roll calls, report card generation, and promotion rosters with zero manual recalculations.
- **Data Privacy & Minor PII Protection**:
  - Complies strictly with the Philippine **Data Privacy Act of 2012 (RA 10173)**:
  - All learner Personally Identifiable Information (PII) is encrypted at rest using AES-256-GCM.
  - Zero telemetry or learner data egress: Data never leaves the local desktop workstation to external analytics servers.
  - Access to student databases is restricted through role-based permissions and hardware-isolated authentication.

---

### 2.12 DepEd Order No. 037, s. 2022: Extreme Weather, Disaster & Suspension Protocols
*Guidelines on the Cancellation or Suspension of Classes and Work in Schools During Disasters and Extreme Weather*

- **Automatic Suspension Triggers**:
  - **Tropical Cyclone Wind Signals (TCWS)**: Signal #1, #2, #3, #4, or #5 automatically suspends in-person classes across affected Key Stages.
  - **Heat Index Emergencies**: Classroom heat index readings exceeding **$40^\circ\text{C}$ to $42^\circ\text{C}$** authorize school heads to transition immediately to **Modular Distance Learning / Alternative Delivery Modes (ADM)** without penalty to instructional days.
- **Attendance & SF2 Compliance**:
  - Days under official suspension or modular transition are marked with code `S` (Suspended) or counted as valid ADM class days in the SF2 monthly register, ensuring the 200-day annual mandate is legally met.
- **FormEase Pro System Action**:
  - One-click parent SMS broadcast via `CalendarPage.tsx` and `AnnouncementsPage.tsx`, automatically dispatching weather suspension notices and modular pickup instructions to all guardians.

---

### 2.13 Republic Act No. 12028: The ARAL Program Act of 2024
*Academic Recovery and Accessible Learning (ARAL) Program Act*

- **Legislative Mandate**: Enacted to accelerate foundational literacy, numeracy, and STEM proficiencies following documented pandemic and extreme heat learning disruptions.
- **Dedicated ARAL Intervention Windows**:
  - FormEase Pro’s 3-term calendar natively reserves dedicated **ARAL Intervention Weeks** between terms (e.g. September 16–18, December 14–18) for diagnostic assessment and individualized tutoring.
- **SARDO Diagnostic Integration**:
  - FormEase Pro’s `ReportsPage.tsx` automatically isolates learners performing in the *Emerging* (PACE descriptor E, $<65$) or *Did Not Meet Expectations* ($<75$) tiers, generating targeted ARAL tutoring cohorts and tracking remediation progress.

---

### 2.14 DepEd Order No. 47, s. 2016: Omnibus Policy on Kindergarten Education
*Kindergarten Curricular Framework, ECCD Checklist & Qualitative Reporting*

- **10 Developmental Domains**: Tracks socio-emotional, gross motor, fine motor, expressive language, receptive language, cognitive, and self-help skills.
- **Early Childhood Care and Development (ECCD) Checklist**: Mandatory diagnostic administered at Beginning-of-School-Year (BoSY) and End-of-School-Year (EoSY) to assess school readiness.
- **Non-Numerical Reporting Mandate**:
  - Kindergarten academic performance is strictly forbidden from using numeric percentage grades.
  - FormEase Pro renders the official DepEd 3-point checklist scale:
    - **C (Consistent / Palagiang Naipapamalas)**: Score $\ge 80$.
    - **D (Developing / Nagsisimulang Maipamalas)**: Score $65–79$.
    - **B (Beginning / Kailangan ng Tulong at Gabay)**: Score $< 65$.

---

### 2.15 DepEd Order No. 8, s. 2015: Remedial Instruction & Recomputed Final Grade (RFG)
*Protocols for Conditional Learners and Remedial Class Certification*

- **Eligibility for Remedial Classes**:
  - Learners with 1 or 2 failed learning areas at EoSY are categorized as *CONDITIONAL* on School Form 5.
  - Required to attend remedial summer classes consisting of at least 30 instructional hours per failed subject.
- **Recomputed Final Grade (RFG) Formula**:
  $$\text{RFG} = \text{round}\left( \frac{\text{Final Rating} + \text{Remedial Class Mark}}{2} \right)$$
- **Promotional Criteria & Permanent Notation**:
  - If $\text{RFG} \ge 75$: The learner is promoted. The official SF10 transcript records the original failing mark, the remedial class mark, the RFG, and the updated status: `"PASSED per Certificate of Recomputed Final Grade"`.
  - If $\text{RFG} < 75$: The learner is retained in the grade level.

---

### 2.16 DepEd Observed Core Values 4-Point Behavioral Rubric
*Evaluation of Learner Conduct in School Form 9 (Form 138) & Form 10*

Per DepEd Order No. 8, s. 2015, learners are assessed quarterly across **4 Core Values** subdivided into **7 Behavioral Statements**:

| Core Value (*Pangunahing Pagpapahalaga*) | Official DepEd Behavioral Indicators (*Pamantayan ng Pag-uugali*) |
| :--- | :--- |
| **1. Maka-Diyos** | - Expresses one's spiritual beliefs while respecting the beliefs of others.<br>- Shows adherence to ethical principles by upholding truth in words and actions. |
| **2. Makatao** | - Is sensitive to individual, social, and cultural differences.<br>- Demonstrates solidarity in group work and acts peacefully toward others. |
| **3. Makakalikasan** | - Cares for the environment and utilizes resources wisely, judiciously, and economically. |
| **4. Makabansa** | - Demonstrates pride in being a Filipino; exercises rights and responsibilities dutifully.<br>- Demonstrates appropriate behavior in carrying out activities in the school, community, and country. |

- **Official 4-Point Qualitative Rating Scale**:
  - **AO (Always Observed / *Palagiang Naipapamalas*)**: Consistent, self-initiated demonstration.
  - **SO (Sometimes Observed / *Madalas Naipapamalas*)**: Frequent demonstration with minimal reminders.
  - **RO (Rarely Observed / *Bihirang Naipapamalas*)**: Inconsistent demonstration; requires ongoing guidance.
  - **NO (Not Observed / *Hindi Naipapamalas*)**: Absence of positive behavior; requires pastoral intervention.

---

## 3. THE 3-TERM CALENDAR SYSTEM VS. HISTORICAL 4 QUARTERS

### 3.1 Historical Policy Context: The Reversion to the June–April School Calendar
Between 2020 and 2023, the Philippine Department of Education shifted the academic calendar to an August–May schedule. However, extreme summer heat (El Niño) during April and May produced classroom heat index readings consistently exceeding **$42^\circ\text{C}$ ($107.6^\circ\text{F}$)**, triggering widespread heat exhaustion, fainting incidents, and prolonged class cancellations across thousands of public schools.

In response, the President and the Secretary of Education issued **DepEd Order No. 003, s. 2024**, **DepEd Order No. 015, s. 2026**, and **DepEd Memorandum No. 43, s. 2024**, mandating an accelerated transition to:
1. Revert school opening back to **June**.
2. Conclude the school year by **April**, ensuring that students and teachers are on vacation during peak summer heat (May).
3. Restructure the academic calendar into a balanced **3-Term Trimester Model** (~60 to 70 instructional days per term, totaling 195–200 days), replacing the bloated 4-quarter cycle that forced schools to operate deep into May.

---

### 3.2 Architectural Duality: 3-Term (Modern) vs. 4-Quarter (Historical)
FormEase Pro incorporates a temporal polymorphism engine implemented in `app/src/lib/terms.ts`:
- **Active School Years (SY 2026–2027 onwards)**: Operate on the **3-Term Trimester Calendar** (`[1, 2, 3]`).
- **Historical School Years (SY 2025–2026 and earlier)**: Operate on the traditional **4-Quarter Calendar** (`[1, 2, 3, 4]`).
- **Auto-Detection & Period Routing Engine**:
  ```typescript
  export const ACTIVE_TERMS = [1, 2, 3] as const;
  export const HISTORICAL_QUARTERS = [1, 2, 3, 4] as const;

  export function isThreeTermSchoolYear(schoolYear?: string): boolean {
      if (!schoolYear) return true; // Default to current academic year
      const match = schoolYear.match(/(\d{4})/);
      if (match) {
          const startYear = parseInt(match[1], 10);
          return startYear >= 2026;
      }
      return true;
  }

  export function getActivePeriodsForSchoolYear(schoolYear?: string): readonly number[] {
      return isThreeTermSchoolYear(schoolYear) ? ACTIVE_TERMS : HISTORICAL_QUARTERS;
  }

  export function getPeriodHeader(schoolYear?: string): 'TERM' | 'QUARTER' {
      return isThreeTermSchoolYear(schoolYear) ? 'TERM' : 'QUARTER';
  }

  export function getPeriodLabel(period: number, schoolYear?: string): string {
      return isThreeTermSchoolYear(schoolYear) ? `Term ${period}` : `Quarter ${period}`;
  }
  ```
- **Backward-Compatibility Guarantee**: When generating historical SF10 permanent records or viewing prior school years, the UI and export engines automatically render 4 quarter columns (`Q1`, `Q2`, `Q3`, `Q4`). When generating SY 2026–2027 records, the system seamlessly switches to 3 term columns (`Term 1`, `Term 2`, `Term 3`).

---

### 3.3 The DepEd Official 2026–2027 School Calendar & National Milestones
Implemented in `app/src/data/calendar-events.ts`:

- **Beginning of School Year (BoSY)**: June 8, 2026
- **End of School Year (EoSY)**: April 8, 2027

#### Term 1 Breakdown (June 8, 2026 – September 15, 2026 | ~65 Class Days)
- **June 1–5, 2026**: Brigada Eskwela, Final Enrollment, and Administrative Preparation.
- **June 8, 2026**: **Official Opening of Classes (Start of Term 1)**.
  - Parents & Learners Orientation.
  - Beginning of School Year (BoSY) Comprehensive Rapid Literacy Assessment (CRLA), Rapid Math Assessment (RMA), and Phil-IRI diagnostic testing window.
  - Baseline Health & Nutritional Assessment (SF8 BMI collection).
- **June 12, 2026**: Philippine Independence Day (National Holiday).
- **July 6, 2026**: Term 1 First Summative Test.
- **July 20–24, 2026**: Supreme Elementary Learner Government (SELG) and Supreme Secondary Learner Government (SSLG) campus elections.
- **July 28, 2026**: Term 1 Second Summative Test.
- **August 21, 2026**: Ninoy Aquino Day (National Holiday).
- **August 28 & September 1, 2026**: **Term 1 Quarterly Examination**.
- **August 31, 2026**: National Heroes Day (National Holiday).
- **September 2–8, 2026**: ARAL (Academic Recovery and Accessible Learning) Intervention Program, Grade Deliberation, and Form Accomplishment Week.
- **September 9, 2026**: 1st General Assembly, PTA Meeting, and SF9 Progress Report Card Distribution.
- **September 10–15, 2026**: Mid-Term INSET (In-Service Training for Teachers) & Learners' Asynchronous Wellness Break.
- **September 15, 2026**: **Formal End of Term 1**.

#### Term 2 Breakdown (September 16, 2026 – December 18, 2026 | ~60 Class Days)
- **September 16, 2026**: **Start of Term 2**.
  - Opening of the National Career Assessment Examination (NCAE) testing window for Grade 10.
- **September 21–25, 2026**: Middle of School Year (MoSY) Reading & Math Assessment Window.
- **October 5, 2026**: World Teachers' Day Celebration & National Culmination.
- **October 5–9, 2026**: National Achievement Test for Grade 10 (NAT G10).
- **October 7, 2026**: Term 2 First Summative Test.
- **October 29, 2026**: Term 2 Second Summative Test.
- **November 1–2, 2026**: All Saints' Day & All Souls' Day (Special Non-Working Holidays).
- **November 15, 2026**: Philippine Educational Placement Test (PEPT) Administration.
- **November 27, 2026**: Araw ng Pagbasa (National Reading Day).
- **November 30, 2026**: Bonifacio Day (National Holiday).
- **December 3–4, 2026**: **Term 2 Quarterly Examination**.
- **December 7–14, 2026**: ARAL Program, Grade Consolidation, and School Forms Accomplishment.
- **December 8, 2026**: Feast of the Immaculate Conception (National Holiday).
- **December 15, 2026**: 2nd General Assembly, PTA Meeting, and SF9 Report Card Distribution.
- **December 17–18, 2026**: INSET & Learners' Wellness Break.
- **December 18, 2026**: **Formal End of Term 2**.
- **December 19, 2026 – January 3, 2027**: **Christmas and Year-End School Vacation**.

#### Term 3 Breakdown (January 4, 2027 – April 8, 2027 | ~70 Class Days)
- **January 4, 2027**: **Start of Term 3 (Resumption of Classes)**.
- **January 25, 2027**: Term 3 First Summative Test.
- **January 30 – February 26, 2027**: DepEd National Early Registration Month (for incoming Kindergarten, Grade 1, Grade 7, and Grade 11).
- **February 1–5, 2027**: End of School Year (EoSY) Assessment Testing Window.
- **February 6, 2027**: Chinese New Year (Special Holiday).
- **February 15–19, 2027**: National Achievement Test for Grade 12 (NAT G12).
- **February 16, 2027**: Term 3 Second Summative Test.
- **March 1–5, 2027**: Early Language, Literacy, and Numeracy Assessment (ELLNA) for Grade 3.
- **March 8–12, 2027**: National Achievement Test for Grade 6 (NAT G6).
- **March 15–16, 2027**: **Term 3 Examination for Graduating Cohorts (Grades 6, 10, and 12)**.
- **March 17–23, 2027**: Final Grade Deliberation, Awards Committee Review, and Form 137/SF10 Auditing for Graduating Learners.
- **March 22–23, 2027**: **Term 3 Examination for Non-Graduating Grades**.
- **March 24, 2027**: Recognition and Academic Excellence Awards Ceremony for Graduating Cohorts.
- **March 25–27, 2027**: Maundy Thursday, Good Friday, Black Saturday (Holy Week).
- **April 2–5, 2027**: End-of-School-Year INSET and Form Checking.
- **April 6–7, 2027**: **Official End-of-School-Year Rites (Graduation Ceremonies & Moving-Up Exercises)**.
- **April 8, 2027**: 3rd General Assembly, Final SF9 Report Card Distribution, and **Formal End of S.Y. 2026–2027**.
- **April 9, 2027**: The Day of Valor (Araw ng Kagitingan - National Holiday).
- **April 9 – May 9, 2027**: **Official Teachers' Summer Vacation / EOSY Break**.
- **National Student Competitions**:
  - *National Schools Press Conference (NSPC)*: April 19–23, 2027
  - *National Festival of Talents (NFOT)*: April 26–30, 2027
  - *Palarong Pambansa 2027*: May 3–7, 2027

---

### 3.4 Dynamic Subject Offering Schedules & Proration Engine
In Senior High School under DO 017 s. 2026, elective courses and specialized practicums are not required to run across all three terms. FormEase Pro provides a multi-term scheduling engine defined on subject and section records:

| Offering Code | Schedule Description | Example Subjects | Final Rating Calculation Formula |
| :---: | :--- | :--- | :--- |
| `'all'` | Full-Year Subject (Terms 1, 2, and 3) | *General Mathematics*, *Effective Communication* | $\text{Final Grade} = \text{round}\left( \frac{\text{Term 1} + \text{Term 2} + \text{Term 3}}{3} \right)$ |
| `1` | Term 1 Only Course | *Pre-Calculus*, *Chemistry 1*, *Oral Comm* | $\text{Final Grade} = \text{Term 1 Grade}$ |
| `2` | Term 2 Only Course | *Basic Calculus*, *Chemistry 2*, *Personal Dev* | $\text{Final Grade} = \text{Term 2 Grade}$ |
| `3` | Term 3 Only Course | *Research Capstone*, *Work Immersion 320h* | $\text{Final Grade} = \text{Term 3 Grade}$ |
| `'1,2'` | Two-Term Subject (Terms 1 and 2) | *Physics 1 & 2*, *Advanced Accounting* | $\text{Final Grade} = \text{round}\left( \frac{\text{Term 1} + \text{Term 2}}{2} \right)$ |
| `'1,3'` | Academic Elective 1 (Terms 1 and 3) | *Creative Industries Visual Arts* | $\text{Final Grade} = \text{round}\left( \frac{\text{Term 1} + \text{Term 3}}{2} \right)$ |
| `'2,3'` | Academic Elective 2 (Terms 2 and 3) | *Robotics & Embedded Systems* | $\text{Final Grade} = \text{round}\left( \frac{\text{Term 2} + \text{Term 3}}{2} \right)$ |
| `'none'`| Inactive / Unoffered in this Section | Track elective not selected by cohort | Excluded from calculations and card views |

#### The Term Proration Principle for General Averages
A critical architectural feature of FormEase Pro is **term proration**:
- When computing the General Average for **Term 1**, the system includes *only* subjects offered in Term 1 (`'all'`, `1`, `'1,2'`, `'1,3'`).
- A subject offered exclusively in Term 2 or Term 3 (such as *Basic Calculus* or *Work Immersion*) is dynamically ignored in Term 1 computations, preventing artificial division by zero or unwarranted zero-score penalties on the learner's report card.

---

### 3.5 SF2 Monthly Attendance Register Alignment (SY 2026–2027)
Implemented in `AttendancePage.tsx`:
To support the June-to-April calendar, FormEase Pro's SF2 Attendance Register manages exactly **11 school months**:

| School Month | Active DepEd School Days (M–F Excluding Holidays) | Calendar Days Count | DepEd Term Alignment |
| :--- | :--- | :---: | :---: |
| **JUNE 2026** | June 8, 9, 10, 11, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30 | **16 days** | Term 1 (BoSY Opening) |
| **JULY 2026** | July 1, 2, 3, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 27, 28, 29, 30, 31 | **23 days** | Term 1 |
| **AUGUST 2026** | August 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 17, 18, 19, 20, 24, 25, 26, 27, 28 | **19 days** | Term 1 |
| **SEPTEMBER 2026** | September 1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30 | **22 days** | Term 1 / Term 2 Crossover |
| **OCTOBER 2026** | October 1, 2, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30 | **22 days** | Term 2 |
| **NOVEMBER 2026** | November 3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27 | **18 days** | Term 2 |
| **DECEMBER 2026** | December 1, 2, 3, 4, 7, 9, 10, 11, 14, 15, 16, 17, 18 | **13 days** | Term 2 (Christmas Break) |
| **JANUARY 2027** | January 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29 | **20 days** | Term 3 (Classes Resume) |
| **FEBRUARY 2027** | February 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26 | **20 days** | Term 3 |
| **MARCH 2027** | March 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 29, 30, 31 | **21 days** | Term 3 (Graduation Exams) |
| **APRIL 2027** | April 1, 2, 5, 6, 7, 8 | **6 days** | Term 3 (EoSY Rites Close) |
| **TOTAL** | **Full Academic Year Instructional Days** | **200 days** | Compliant with DepEd Standard |

---

## 4. COMPLETE GRADING SYSTEMS & MATHEMATICAL ENGINES

FormEase Pro operates on an air-gapped, zero-drift mathematical engine implemented across `app/src/lib/grading.ts`, `app/src/utils/grading-helpers.ts`, `app/src/services/grade-calculation.ts`, and `app/src/services/sf9-excel-export.ts`.

---

### 4.1 Foundational Assessment Formulas (PS, WS, and Initial Grade)
The assessment framework follows the standard Department of Education foundational mathematics:

1. **Percentage Score (PS)**:
   For any assessment component (Written Works or Performance Tasks), the Percentage Score is the ratio of the learner's accumulated raw score to the Highest Possible Score (HPS), multiplied by 100 and clamped between 0 and 100:
   $$\text{PS} = \min\left(100, \max\left(0, \frac{\sum_{i=1}^N \text{RawScore}_i}{\sum_{i=1}^N \text{HPS}_i} \times 100\right)\right)$$
   *Zero Division Safety*: If $\sum \text{HPS}_i = 0$, $\text{PS} = 0$.

2. **Weighted Score (WS)**:
   The Weighted Score translates the Percentage Score into its curricular weight fraction:
   $$\text{WS} = \text{PS} \times \text{WeightFraction}$$
   Where $\text{WeightFraction} \in [0.00, 1.00]$ (e.g., $0.20$ for 20%, $0.50$ for 50%).

3. **Initial Grade (IG)**:
   The Initial Grade is the sum of all component Weighted Scores:
   $$\text{Initial Grade} = \text{WS}_{\text{WrittenWorks}} + \text{WS}_{\text{PerformanceTasks}} + \text{WS}_{\text{Examinations}}$$
   *Unnormalized Initial Grade Healing*: If a legacy database record contains an initial grade stored with 100x unnormalized weights (e.g. $7153.94$ or $3004.60$), the engine automatically detects $120 < \text{InitialGrade} \le 10000$ and rescales it by dividing by 100 before passing it to the transmutation engine.

---

### 4.2 Comprehensive Component Weighting Matrix by Subject Cluster
Implemented in `app/src/lib/grading.ts` (`getSubjectCluster` & `getWeights`):

| Cluster Identifier | Curricular Learning Areas Covered | Written Works (WW) | Performance Tasks (PT) | Quarterly / Term Exam (EXs) |
| :--- | :--- | :---: | :---: | :---: |
| `languages_ap_esp` | Languages (English, Filipino), Araling Panlipunan, GMRC, Values Education, Makabansa | **20%** (0.20) | **50%** (0.50) | **30%** (0.30) |
| `science_math` | Mathematics, Science (Grades 1 to 10) | **20%** (0.20) | **50%** (0.50) | **30%** (0.30) |
| `mapeh_tle` | MAPEH (Music, Arts, PE, Health), EPP, TLE | **20%** (0.20) | **60%** (0.60) | **20%** (0.20) |
| `shs_core_academic` | Senior High School Core Subjects & Standard Academic Electives | **20%** (0.20) | **50%** (0.50) | **30%** (0.30) |
| `shs_field_exposure`| Field Exposure, Arts Apprenticeship, Creative Production and Innovation | **15%** (0.15) | **70%** (0.70) | **15%** (0.15) |
| `shs_arts_sports` | Arts, Sports, Health and Wellness Electives, Movement & Recreation | **20%** (0.20) | **60%** (0.60) | **20%** (0.20) |
| `shs_research` | Research Electives, Practical Research, Inquiries, Design & Innovation | **40%** (0.40) | **60%** (0.60) | **0%** (No Exam) |
| `shs_techpro` | Technical-Professional (TechPro) Electives (Automotive, Welding, ICT, etc.) | **15%** (0.15) | **65%** (0.65) | **20%** (0.20) |
| `shs_immersion` | Work Immersion / Specialized Practicum | **20%** (0.20) | **80%** (0.80) | **0%** (No Exam) |
| `g12_core` | Traditional Grade 12 Core Subjects (all tracks under DO 8 s. 2015) | **25%** (0.25) | **50%** (0.50) | **25%** (0.25) |
| `g12_academic_other`| Grade 12 Academic Track — Other specialized subjects | **25%** (0.25) | **45%** (0.45) | **30%** (0.30) |
| `g12_academic_immersion_research` | Grade 12 Academic Track — Work Immersion, Research, BES, Culminating Activity | **35%** (0.35) | **40%** (0.40) | **25%** (0.25) |
| `g12_tvl_all` | Grade 12 TVL / Sports / Arts Tracks — All subjects including Immersion/Research | **20%** (0.20) | **60%** (0.60) | **20%** (0.20) |

---

### 4.3 The GMRC & Values Education 5-Domain Assessment Model
Under DepEd MATATAG and the official workbook `ECR_Template_GMRC_VE_G2_G10.xlsx`, GMRC and Values Education are evaluated across five discrete behavioral and cognitive domains rather than monolithic score containers:

1. **Cognitive Written Works (WW 1–5)**: Evaluates moral knowledge, ethical reasoning, and conceptual comprehension.
   $$\text{PS}_{\text{WW-Cog}} = \frac{\sum_{i=1}^5 \text{WW}_i}{\sum_{i=1}^5 \text{HPS}_{\text{WW}_i}} \times 100 \implies \text{WS}_{\text{WW-Cog}} = \text{PS}_{\text{WW-Cog}} \times 0.10$$
2. **Affective Written Works (WW 6–10)**: Evaluates value reflection journals, moral attitudes, and self-assessments.
   $$\text{PS}_{\text{WW-Aff}} = \frac{\sum_{i=6}^{10} \text{WW}_i}{\sum_{i=6}^{10} \text{HPS}_{\text{WW}_i}} \times 100 \implies \text{WS}_{\text{WW-Aff}} = \text{PS}_{\text{WW-Aff}} \times 0.10$$
3. **Cognitive Performance Tasks (PT 1–3)**: Case study analysis and situational roleplay planning.
   $$\text{PS}_{\text{PT-Cog}} = \frac{\sum_{i=1}^3 \text{PT}_i}{\sum_{i=1}^3 \text{HPS}_{\text{PT}_i}} \times 100 \implies \text{WS}_{\text{PT-Cog}} = \text{PS}_{\text{PT-Cog}} \times 0.10$$
4. **Affective Performance Tasks (PT 4–6)**: Peer empathy demonstrations, community engagement reflections.
   $$\text{PS}_{\text{PT-Aff}} = \frac{\sum_{i=4}^6 \text{PT}_i}{\sum_{i=4}^6 \text{HPS}_{\text{PT}_i}} \times 100 \implies \text{WS}_{\text{PT-Aff}} = \text{PS}_{\text{PT-Aff}} \times 0.10$$
5. **Behavioral / Psychomotor Performance Tasks (PT 7–9)**: Observable daily conduct, courtesy, and active citizenship.
   $$\text{PS}_{\text{PT-Beh}} = \frac{\sum_{i=7}^9 \text{PT}_i}{\sum_{i=7}^9 \text{HPS}_{\text{PT}_i}} \times 100 \implies \text{WS}_{\text{PT-Beh}} = \text{PS}_{\text{PT-Beh}} \times 0.30$$
6. **Quarterly Assessment (Examinations)**:
   $$\text{PS}_{\text{QA}} = (\text{ST1}_{\text{PS}} \times 0.30) + (\text{ST2}_{\text{PS}} \times 0.30) + (\text{TE}_{\text{PS}} \times 0.40) \implies \text{WS}_{\text{QA}} = \text{PS}_{\text{QA}} \times 0.30$$

$$\text{Initial Grade}_{\text{GMRC/VE}} = \text{WS}_{\text{WW-Cog}} (10\%) + \text{WS}_{\text{WW-Aff}} (10\%) + \text{WS}_{\text{PT-Cog}} (10\%) + \text{WS}_{\text{PT-Aff}} (10\%) + \text{WS}_{\text{PT-Beh}} (30\%) + \text{WS}_{\text{QA}} (30\%) = 100\%$$

---

### 4.4 The 3-Component Examination Engine (ST1 30%, ST2 30%, TE 40%)
Under the 3-term Senior High School policy (`computeExamsWeightedScore` in `app/src/lib/grading.ts`), the Examination component (EXs) is decomposed into three distinct summative assessments:
- **Summative Test 1 (ST1)**: Carries **30%** (0.30) of EXs.
- **Summative Test 2 (ST2)**: Carries **30%** (0.30) of EXs.
- **Term Examination (TE)**: Carries **40%** (0.40) of EXs.

$$\text{EXs Percentage Score} = \frac{(\text{ST1}_{\text{PS}} \times 0.30) + (\text{ST2}_{\text{PS}} \times 0.30) + (\text{TE}_{\text{PS}} \times 0.40)}{\text{TotalWeightGiven}}$$

- **Dynamic Normalization**: If the teacher encodes ST1 and ST2 before the Term Examination has occurred, the engine normalizes over the administered tests ($\text{TotalWeightGiven} = 0.30 + 0.30 = 0.60$), allowing accurate real-time mid-term grade previews without penalizing learners for unadministered exams.
- **TE-Only Exception** (`EXS_TE_ONLY_CLUSTERS`): In Field Exposure and Arts Apprenticeship (`shs_field_exposure`), the Term Examination carries **100%** of the EXs percentage score.
- **Zero-Exam Exception** (`EXS_NONE_CLUSTERS`): In Research Electives (`shs_research`) and Work Immersion (`shs_immersion`), the EXs weight is **0.00**; the initial grade is derived 100% from WW and PT.
- **Single-Exam Alignment Guard**: If the section HPS contains only one exam while the student's record has an exam score in an alternate column (e.g. encoded under TE instead of ST1), the engine automatically aligns the score with the single active HPS target.

---

### 4.5 Transmutation Evolution & Policy Routing

FormEase Pro embeds a three-tier temporal router for grade transmutation (`transmuteGrade` in `app/src/lib/grading.ts`):

```typescript
// Architectural Policy Routing:
if (syStart >= 2027) {
    // 1. Zero-Based Grading System (SY 2027-2028 onwards per DO 15 s. 2026)
    return Math.round(score);
}
if (sy === '2026-2027') {
    // 2. Table 4 Adjusted Transmutation Table (SY 2026-2027 Transition Year)
    return matchTransmutationRange(score, TABLE_4_RANGES);
}
// 3. DO 8 s. 2015 Legacy Transmutation Table (Historical SY 2025-2026 and prior)
return matchTransmutationRange(score, DO_8_2015_RANGES);
```

#### Complete Transmutation Mapping Comparison Table:
| Initial Grade Range (DO 8, s. 2015) | Initial Grade Range (Table 4: SY 2026–2027) | Transmuted Grade | Level of Proficiency |
| :---: | :---: | :---: | :--- |
| **99.50 – 100.00** | **99.50 – 100.00** | **100** | Outstanding |
| 97.50 – 99.49 | 98.32 – 99.49 | **99** | Outstanding |
| 96.00 – 97.49 | 97.14 – 98.31 | **98** | Outstanding |
| 95.00 – 95.99 | 95.96 – 97.13 | **97** | Outstanding |
| 94.00 – 94.99 | 94.78 – 95.95 | **96** | Outstanding |
| 93.00 – 93.99 | 93.60 – 94.77 | **95** | Outstanding |
| 92.00 – 92.99 | 92.42 – 93.59 | **94** | Outstanding |
| 91.00 – 91.99 | 91.24 – 92.41 | **93** | Outstanding |
| 90.00 – 90.99 | 90.06 – 91.23 | **92** | Outstanding |
| 88.00 – 89.99 | 88.88 – 90.05 | **91** | Outstanding |
| 87.00 – 87.99 | 87.70 – 88.87 | **90** | Outstanding |
| 86.00 – 86.99 | 86.52 – 87.69 | **89** | Very Satisfactory |
| 85.00 – 85.99 | 85.34 – 86.51 | **88** | Very Satisfactory |
| 84.00 – 84.99 | 84.16 – 85.33 | **87** | Very Satisfactory |
| 83.00 – 83.99 | 82.98 – 84.15 | **86** | Very Satisfactory |
| 82.00 – 82.99 | 81.80 – 82.97 | **85** | Very Satisfactory |
| 80.00 – 81.99 | 80.62 – 81.79 | **84** | Satisfactory |
| 79.00 – 79.99 | 79.44 – 80.61 | **83** | Satisfactory |
| 78.00 – 78.99 | 78.26 – 79.43 | **82** | Satisfactory |
| 77.00 – 77.99 | 77.08 – 78.25 | **81** | Satisfactory |
| 76.00 – 76.99 | 75.90 – 77.07 | **80** | Satisfactory |
| 75.00 – 75.99 | 74.72 – 75.89 | **79** | Fairly Satisfactory |
| 73.00 – 74.99 | 73.54 – 74.71 | **78** | Fairly Satisfactory |
| 70.00 – 72.99 | 72.36 – 73.53 | **77** | Fairly Satisfactory |
| 68.00 – 69.99 | 71.18 – 72.35 | **76** | Fairly Satisfactory |
| **60.00 – 67.99** (Passing base: 60) | **70.00 – 71.17** (Passing base: 70) | **75** | **Passing Benchmark** |
| 56.00 – 59.99 | 65.34 – 69.99 | **74** | Did Not Meet Expectations |
| 52.00 – 55.99 | 60.67 – 65.33 | **73** | Did Not Meet Expectations |
| 48.00 – 51.99 | 56.01 – 60.66 | **72** | Did Not Meet Expectations |
| 44.00 – 47.99 | 51.34 – 56.00 | **71** | Did Not Meet Expectations |
| 40.00 – 43.99 | 46.67 – 51.33 | **70** | Did Not Meet Expectations |
| 36.00 – 39.99 | 42.01 – 46.66 | **69** | Did Not Meet Expectations |
| 32.00 – 35.99 | 37.34 – 42.00 | **68** | Did Not Meet Expectations |
| 28.00 – 31.99 | 32.68 – 37.33 | **67** | Did Not Meet Expectations |
| 24.00 – 27.99 | 28.01 – 32.67 | **66** | Did Not Meet Expectations |
| 20.00 – 23.99 | 23.35 – 28.00 | **65** | Did Not Meet Expectations |
| 16.00 – 19.99 | 18.68 – 23.34 | **64** | Did Not Meet Expectations |
| 12.00 – 15.99 | 14.01 – 18.67 | **63** | Did Not Meet Expectations |
| 8.00 – 11.99 | 9.35 – 14.00 | **62** | Did Not Meet Expectations |
| 4.00 – 7.99 | 4.68 – 9.34 | **61** | Did Not Meet Expectations |
| **0.00 – 3.99** | **0.00 – 4.67** | **60** | **Floor Grade** |

---

### 4.6 Key Stage 1 Descriptive Grading Scale & Transition Schedule
Implemented in `isDescriptiveGrading`, `getKs1LetterGrade`, and `getKs1Descriptor` in `app/src/lib/grading.ts`:

#### Progressive Rollout Schedule:
- **SY 2026–2027**: Descriptive for **Kindergarten** and **Grade 1** (MATATAG). Grades 2–12 remain numeric.
- **SY 2027–2028**: Descriptive for **Kindergarten**, **Grade 1**, and **Grade 2**.
- **SY 2028–2029+**: Descriptive for all Key Stage 1 (**Kindergarten to Grade 3**).

#### 1. Kindergarten 3-Tier Rating Scale:
| Computed Benchmark | Letter Code | English Descriptor | Filipino Descriptor |
| :---: | :---: | :--- | :--- |
| $\ge 80.00$ | **C** | **Consistent** | *Palagiang Naipapamalas* |
| $65.00 – 79.99$ | **D** | **Developing** | *Nagsisimulang Maipamalas* |
| $< 65.00$ | **B** | **Beginning** | *Kailangan ng Tulong at Gabay* |

#### 2. Grades 1 to 3 (MATATAG PACE Scale):
| Numeric Equivalent | Letter Code | Official Descriptor | Meaning / Level of Mastery |
| :---: | :---: | :--- | :--- |
| **90 – 100** | **A** | **Advancing** | Demonstrates exemplary performance exceeding standard competencies |
| **80 – 89** | **B** | **Benchmarking** | Consistently demonstrates mastery of required core competencies |
| **75 – 79** | **C** | **Connecting** | Meets basic competency requirements with satisfactory connection |
| **65 – 74** | **D** | **Developing** | Progressing toward competencies; requires structured instructional support |
| **Below 65** | **E** | **Emerging** | Minimal achievement; requires immediate foundational intervention |

---

### 4.7 Composite Subject Resolution & MAPEH Component Engine
Implemented in `resolveStudentQuarterGrade` (`app/src/utils/grading-helpers.ts`):

1. **MAPEH Composite Hierarchy**:
   MAPEH is a composite learning area whose grade is derived from child disciplines. The engine resolves child components through a recursive multi-tier search:
   - **Scenario A: Dual Component (MATATAG Standard)**:
     $$\text{Grade}_{\text{MAPEH}} = \text{round}\left( \frac{\text{Grade}_{\text{Music\&Arts}} + \text{Grade}_{\text{PE\&Health}}}{2} \right)$$
   - **Scenario B: 4-Way Discrete Components (DO 8 s. 2015 JHS Standard)**:
     $$\text{Grade}_{\text{Music\&Arts}} = \text{round}\left( \frac{\text{Grade}_{\text{Music}} + \text{Grade}_{\text{Arts}}}{2} \right)$$
     $$\text{Grade}_{\text{PE\&Health}} = \text{round}\left( \frac{\text{Grade}_{\text{PhysicalEducation}} + \text{Grade}_{\text{Health}}}{2} \right)$$
     $$\text{Grade}_{\text{MAPEH}} = \text{round}\left( \frac{\text{Grade}_{\text{Music\&Arts}} + \text{Grade}_{\text{PE\&Health}}}{2} \right)$$
   - **Scenario C: Mixed / Hybrid Fallback**: If an adviser has encoded *Music & Arts* as a single subject, but *Physical Education* and *Health* as separate subjects, the engine dynamically averages the discrete PE and Health scores to yield the PE & Health leg before calculating MAPEH.

2. **Effective Communication (EC) & Mabisang Komunikasyon (MK)**:
   $$\text{Grade}_{\text{EC/MK}} = \text{round}\left( \frac{\text{Grade}_{\text{EffectiveCommunication}} + \text{Grade}_{\text{MabisangKomunikasyon}}}{2} \right)$$

3. **The Non-Counting Principle for General Averages**:
   When computing a student's General Average, child sub-components (*Music*, *Arts*, *PE*, *Health*) are **strictly excluded** from the denominator of learning areas. Only the single consolidated parent grade (*MAPEH*) enters the General Average formula.

---

### 4.8 Senior High School Unit-Weighted General Average Engine
Implemented in `services/sf9-excel-export.ts` and `services/sf9-g12-academic-cross-excel-export.ts`:

In Senior High School, subjects carry varying curricular weight based on instructional hours (DO 017 s. 2026 & DO 8 s. 2015). Simple arithmetic averaging is legally invalid for SHS:

$$\text{SHS General Average} = \text{round}\left( \frac{\sum_{i=1}^K (\text{FinalGrade}_i \times \text{Units}_i)}{\sum_{i=1}^K \text{Units}_i} \right)$$

#### Official Credit Units Table:
| Subject Category | Official Instructional Hours | DepEd Credit Units |
| :--- | :---: | :---: |
| Standard SHS Core Subject (e.g. Oral Comm, Gen Math) | 80 hours | **1.0 unit** |
| Half-Term Specialized Course | 40 hours | **0.5 unit** |
| Double-Block Advanced Course | 160 hours | **2.0 units** |
| TechPro Work Immersion Option 1 | 320 hours | **4.0 units** |
| TechPro Work Immersion Option 2 | 540 hours | **6.0 units** |
| TechPro Work Immersion Option 3 | 640 hours | **8.0 units** |

*Elementary & JHS Contrast*: In Grades 1 to 10, all learning areas carry equal weight, and General Average is computed as the simple arithmetic mean:
$$\text{Gen Avg}_{\text{G1-G10}} = \text{round}\left( \frac{\sum_{i=1}^M \text{FinalGrade}_i}{M} \right)$$

---

### 4.9 Academic Excellence Awards & Honors Qualification Engine
Implemented in `isAcademicExcellenceAwardee` (`app/src/utils/grading-helpers.ts`):

To qualify for Academic Excellence Awards, a learner must satisfy two simultaneous criteria:
1. **General Average Threshold**: $\text{General Average} \ge 90.00$.
2. **The No-Failing / No-Grade-Below-80 Rule**: The learner must have achieved a Final Grade of at least **80.00** in **every single learning area**:
   $$\forall i \in \text{Subjects}, \quad \text{FinalGrade}_i \ge 80.00$$
   *Disqualification Example*: A learner with a General Average of $94.20$ but a Final Grade of $79$ in Mathematics is **disqualified** from receiving an Academic Excellence Award under DepEd Order No. 36, s. 2016.

#### Award Tiers:
| General Average Range | Official DepEd Award Title |
| :---: | :--- |
| **98.00 – 100.00** | **With Highest Honors** (*May Pinakamataas na Karangalan*) |
| **95.00 – 97.99** | **With High Honors** (*May Mataas na Karangalan*) |
| **90.00 – 94.99** | **With Honors** (*May Karangalan*) |

---

### 4.10 Data Integrity, Ghost Record Prevention & Provenance Safeguards
1. **Ghost / Headless Record Detection (`isGhostRecord`)**:
   In electronic spreadsheets, a student record may have score containers created (`written_works: []`, `performance_tasks: []`) with a default non-zero `final_grade` remaining from an uninitialized row. FormEase Pro inspects every score container. If all assessment slots are blank or empty strings, the record is flagged as a headless ghost record and rejected from calculations.
2. **Plausible HPS Matching Engine**:
   If a teacher imports grades across multiple sections without a section ID tag, the engine evaluates the sum of the learner's raw scores against candidate HPS records. It automatically binds the learner to the specific HPS whose maximum scores are mathematically compatible ($\text{RawScore} \le \text{HPS}$).
3. **Grade Provenance Hierarchy**:
   When resolving quarterly grades, the engine enforces strict source priority:
   - `grade_source: 'manual_override'`: Highest priority; protected from automatic overwriting during bulk ECR synchronization.
   - `grade_source: 'subject_teacher'`: Official grades signed off by the subject teacher.
   - `grade_source: 'eclass_sync'`: Calculated live from raw formative scores.

---

---

### 4.11 Remedial Instruction & Recomputed Final Grade (RFG) Mathematical Engine
Per DepEd Order No. 8, s. 2015, learners with 1 or 2 deficient subjects (final ratings $<75$) at the end of the school year attend remedial instruction. The engine computes:

$$\text{Recomputed Final Grade (RFG)} = \text{round}\left( \frac{\text{Final Rating} + \text{Remedial Class Mark}}{2} \right)$$

1. **Pass Criteria**: If $\text{RFG} \ge 75$, the learner's promotional status on School Form 5 and Form 10 is updated from *CONDITIONAL* to *PROMOTED*.
2. **Permanent Record Invariance**: On SF10, the original failed grade is **never erased**. Both the original rating and the remedial mark are permanently preserved side-by-side with the official clause: `"Passed per DepEd Certificate of Recomputed Final Grade"`.
3. **Failure / Retention**: If $\text{RFG} < 75$, the learner remains deficient and must repeat the subject or grade level.

---

### 4.12 Observed Core Values Scoring & DepEd Form 9 Quarterly Matrix
In School Form 9 (Form 138), the 4 Core Values (*Maka-Diyos, Makatao, Makakalikasan, Makabansa*) and their 7 behavioral indicators are evaluated across all active terms/quarters:
- **Rating Values**: `AO` (Always Observed), `SO` (Sometimes Observed), `RO` (Rarely Observed), `NO` (Not Observed).
- **Consolidated Batch Evaluation**: FormEase Pro allows teachers to bulk-assign `AO` or `SO` marks across an entire advisory section with 1 click, while permitting individual behavioral exceptions.
- **Export Injection**: Ratings are injected directly into the official SF9 back-cover table at designated cell coordinates without disturbing surrounding borders or text labels.

---

## 5. COMPLETE REPOSITORY FILE & ARCHITECTURE MAP

FormEase Pro is organized as a high-performance desktop monorepo comprising the Electron host application, the React frontend, an Android mobile scanning companion, an activation license portal, and an automated release server.

```
FormEase Pro/
├── app/                                       # Primary Desktop Application
│   ├── electron/                              # Electron Main Process & Native OS Bridge
│   │   ├── main.cjs                           # Main process: window manager, IPC router, safeStorage DPAPI/Keychain, single-instance lock
│   │   ├── preload.cjs                        # Context bridge exposing type-safe window.electronAPI
│   │   ├── license.cjs                        # Hardware Machine ID derivation (node-machine-id) & HMAC-SHA256 license gate
│   │   ├── backup-files.cjs                   # Native OS file system atomic writes (fsyncSync) for backup pairs
│   │   └── backup-files.test.cjs              # Electron native backup test suite
│   ├── public/                                # Static Distribution Assets
│   │   ├── templates/                         # EXACTLY 83 Official DepEd Excel Templates (.xlsx / .xlsm / .xls)
│   │   ├── app-logo.png                       # Official FormEase Pro high-resolution insignia
│   │   ├── deped-seal.png                     # Official Republic of the Philippines Department of Education seal
│   │   └── sounds/                            # Audio chimes (scan success, bomb timer, quiz fanfare, buzzer)
│   ├── src/                                   # Application Source Code
│   │   ├── types/                             # Type Definitions
│   │   │   ├── index.ts                       # Master schemas: Student, Section, Subject, ClassRecord, HPSRecord, SF2Sheet, AttendanceRecord
│   │   │   └── pace.ts                        # Grade 1 MATATAG PACE Form competency models (Reading, Language, Math, GMRC/Makabansa)
│   │   ├── stores/                            # Centralized State Management (Zustand)
│   │   │   ├── app-store.ts                   # Master coordinator uniting database hydration, active school year, and navigation state
│   │   │   ├── auth-store.ts                  # PBKDF2 authentication, DEK wrap/unwrap, SafeStorage encryption, master recovery
│   │   │   ├── sf10-store.ts                  # Multi-year permanent scholastic records, historical transfers, and credentials
│   │   │   ├── system-store.ts                # Real-time hardware status, mobile Wi-Fi server indicator, system notifications
│   │   │   ├── update-store.ts                # Desktop auto-updater state machine (checking, downloading, staged install)
│   │   │   ├── index.ts                       # Store re-exports and hydration hooks
│   │   │   └── slices/                        # Modular Store Domains
│   │   │       ├── grading-slice.ts           # ClassRecord & HPSRecord state, real-time recalculation, provenance tracking
│   │   │       ├── attendance-slice.ts        # SF2 daily and monthly attendance registers, SARDO calculation
│   │   │       └── announcements-slice.ts     # Internal memos, urgent login banners, cloud notification sync
│   │   ├── services/                          # Business Logic, OpenXML Injection & Database Vault (79 files)
│   │   │   ├── database.ts                    # IndexedDB engine: 16 stores, AES-256-GCM envelope encryption, projected plaintext indexes
│   │   │   ├── grade-calculation.ts           # Core mathematical engine: weights, transmutation, MAPEH composites
│   │   │   ├── sshs-excel-export.ts           # DO 017 s. 2026 Strengthened Senior High School ECR OpenXML engine (102 KB)
│   │   │   ├── shs-g12-excel-export.ts        # Grade 12 Senior High School 3-Term ECR OpenXML engine (78 KB)
│   │   │   ├── ecr-excel-export.ts            # Universal Grades 2–10 3-Term E-Class Record generator (62 KB)
│   │   │   ├── ecr-pdf-export-service.ts      # Direct vector PDF E-Class Record printable documents
│   │   │   ├── sf9-g1-excel-export.ts         # Grade 1 MATATAG SF9 + PACE Form OpenXML generator (113 KB)
│   │   │   ├── sf9-g1-excel-import.ts         # Ingesting grades & PACE from completed Grade 1 workbooks (28 KB)
│   │   │   ├── sf9-g2-excel-export.ts         # Grade 2 SF9 OpenXML generator (52 KB)
│   │   │   ├── sf9-g3-excel-export.ts         # Grade 3 SF9 OpenXML generator (56 KB)
│   │   │   ├── sf9-g4-10-excel-export.ts      # Junior High School SF9 OpenXML generator (62 KB)
│   │   │   ├── sf9-g11-academic-excel-export.ts # SHS G11 Academic SF9 generator (98 KB)
│   │   │   ├── sf9-g11-techpro-excel-export.ts  # SHS G11 TechPro SF9 generator (89 KB)
│   │   │   ├── sf9-g12-academic-cross-excel-export.ts # SHS G12 Academic + Cross-Enrollment generator (44 KB)
│   │   │   ├── sf9-g12-techpro-cross-excel-export.ts  # SHS G12 TechPro + Cross-Enrollment generator (43 KB)
│   │   │   ├── sf9-g12-techpro-excel-export.ts  # SHS G12 TechPro standard generator (35 KB)
│   │   │   ├── sf9-scp-excel-export.ts        # Special Curricular Programs SF9 (SPA, SPFL, SPJ, SPS, SPTVE, SSES) (55 KB)
│   │   │   ├── sf9-pace-excel-export.ts       # Consolidated PACE Form Excel export
│   │   │   ├── sf9-pace-language-excel-export.ts # PACE Language domain exporter
│   │   │   ├── sf9-pace-math-excel-export.ts  # PACE Mathematics domain exporter
│   │   │   ├── sf9-pace-gmrc-makabansa-excel-export.ts # PACE GMRC & Makabansa exporter
│   │   │   ├── AutoBackupManager.ts           # Rolling 30-minute background backups and disk snapshots
│   │   │   ├── IncrementalBackupService.ts    # Change-log tracker capturing atomic database modifications
│   │   │   ├── SnapshotPreviewService.ts      # Safe dry-run inspection of historical backup snapshots
│   │   │   ├── pre-update-safety.ts           # Atomic rollback safety vault before destructive migrations (47 KB)
│   │   │   ├── database-rescue-export.ts      # 16-store disaster recovery export/import engine (104 KB)
│   │   │   ├── master-excel-backup.ts         # Human-readable multi-tab Excel backup of entire school database (26 KB)
│   │   │   ├── diagnostic-engine.ts           # Schema health inspector and orphan record detector
│   │   │   ├── diagnostic-reporter.ts         # Diagnostic health report formatter
│   │   │   ├── school-forms-vault-service.ts  # Official school forms cache and document renderer (38 KB)
│   │   │   ├── consolidated-export-service.ts # Master consolidated grades summary sheet exporter
│   │   │   ├── curriculumSync.ts              # Automatic sync of subject offerings to section curricula
│   │   │   ├── cloud-sync.ts                  # Google Drive OAuth / Firebase gateway for cloud backups (18 KB)
│   │   │   ├── mobile-attendance-sync.ts      # Local Wi-Fi HTTP gateway syncing scans from mobile phones (15 KB)
│   │   │   ├── sms-gateway.ts                 # AT command engine over serial COM ports + Webhook SMS API
│   │   │   ├── broadcast-service.ts           # Urgent system memo broadcaster
│   │   │   ├── announcement-sync.ts           # Announcement replication service
│   │   │   ├── excel-export.ts                # General tabular spreadsheet exporter
│   │   │   ├── excel-import.ts                # General spreadsheet ingest service
│   │   │   └── id-card/                       # Student ID card barcode/QR rendering engine
│   │   ├── pages/                             # 38 Modular Views (36 Pages + 1 Index + 1 Smoke Test)
│   │   │   ├── Dashboard.tsx                  # School analytics, enrollment KPIs, attendance area charts, SARDO alerts (142 KB)
│   │   │   ├── StudentsPage.tsx               # Student directory, 5-tab profile editor, bulk CSV/Excel import (100 KB)
│   │   │   ├── SectionsPage.tsx               # Class section manager, adviser assignment, curriculum links (45 KB)
│   │   │   ├── SubjectsPage.tsx               # Subject offerings, component weights, term assignments, deduplication (289 KB)
│   │   │   ├── EClassRecord.tsx               # Grades 1–10 Electronic Class Record interactive grading grid (280 KB)
│   │   │   ├── ShsEClassRecord.tsx            # SHS & SSHS DO 017 3-Term E-Class Record interactive grid (247 KB)
│   │   │   ├── ConsolidatedGradesPage.tsx     # Master grade summary sheet across all subjects per section (328 KB, 5,333 lines)
│   │   │   ├── SF9Page.tsx                    # SF9 Report Card studio, front/back preview, batch ZIP export (399 KB)
│   │   │   ├── SF10Page.tsx                   # Learner Permanent Academic Record (SF10-ES, JHS, SHS) (51 KB)
│   │   │   ├── DailyAttendancePage.tsx        # Interactive daily attendance roll-call, barcode scanner, WebCam (80 KB)
│   │   │   ├── AttendancePage.tsx             # Official DepEd SF2 Monthly Attendance Register (150 KB, 2,545 lines)
│   │   │   ├── SchoolFormsPage.tsx            # Central launchpad for all 10 standard DepEd School Forms (17 KB)
│   │   │   ├── SF5Page.tsx                    # DepEd School Form 5 Promotion & Level of Proficiency report (76 KB)
│   │   │   ├── SF6Page.tsx                    # DepEd School Form 6 School-wide Summary of Promotion (39 KB)
│   │   │   ├── SF8Page.tsx                    # DepEd School Form 8 Nutritional status (BMI, HFA) calculator (51 KB)
│   │   │   ├── LIRPage.tsx                    # Learner's Individual Record (Anecdotal notes, counseling logs) (61 KB)
│   │   │   ├── TemporaryGradeSlipPage.tsx     # DO 54 s. 2016 TGS 2-up printable grade slip for transferees (92 KB)
│   │   │   ├── PaceFormPage.tsx               # Grade 1 MATATAG PACE Form assessment grid (43 KB)
│   │   │   ├── ReportsPage.tsx                # Institutional analytics: MPS, SARDO at-risk detection, rankings (307 KB)
│   │   │   ├── StudentIDGeneratorPage.tsx     # ID Card studio with photo crop, 12 presets, barcode, QR (82 KB)
│   │   │   ├── NameTagPage.tsx                # Printable student examination & event badges with barcodes (35 KB)
│   │   │   ├── EnrollmentCenterPage.tsx       # Fast-track enrollment intake, balik-aral, and section promotion (14 KB)
│   │   │   ├── CertificateGeneratorPage.tsx   # Graduation, Academic Honors, Leadership, Moving-Up certificates (83 KB)
│   │   │   ├── OnlineGeneratorsPage.tsx       # DLL & DLP lesson plan prompt generator and ILAW framework (30 KB)
│   │   │   ├── GamesAndToolsPage.tsx          # 20 classroom gamification widgets (Wheel of Names, Bomb Pass, etc.) (27 KB)
│   │   │   ├── InstitutePage.tsx              # School branding, specimen signature pad, official seal studio (94 KB)
│   │   │   ├── CalendarPage.tsx               # Interactive school calendar and parent SMS event broadcasts (46 KB)
│   │   │   ├── AnnouncementsPage.tsx          # Internal bulletin feed and parent SMS gateway broadcaster (85 KB)
│   │   │   ├── SettingsPage.tsx               # 8 tabs: Backups, Cloud Sync, SMS Gateway, Maintenance, Diagnostics (258 KB)
│   │   │   ├── AboutPage.tsx                  # Regulatory compliance, developer credentials, legal terms (47 KB)
│   │   │   ├── UsersPage.tsx                  # Single-user local profile and RBAC permissions display
│   │   │   ├── LoginPage.tsx                  # Authentication, license validation, master recovery password (56 KB)
│   │   │   ├── AccountSetupPage.tsx           # First-run initial setup wizard for new installations
│   │   │   ├── ActivationPage.tsx             # Machine-bound license key entry and offline trial activation (26 KB)
│   │   │   ├── MobileAttendancePage.tsx       # Mobile web portal for smartphone QR camera scanning (68 KB)
│   │   │   └── CalendarAnnouncementsPage.tsx  # Integrated calendar-announcements bridge
│   │   ├── components/                        # Reusable Component Architecture
│   │   │   ├── sf9/                           # Interactive SF9 card front/back previews & print layouts
│   │   │   ├── id-card/                       # CR80 card front/back canvases, photo cropper, barcode renderers
│   │   │   ├── attendance/                    # Quick roll-call buttons, scanner modals, device connection badges
│   │   │   ├── certificates/                  # Live certificate canvas with customizable gold seals and ribbons
│   │   │   ├── layout/                        # AppHeader, Sidebar, Navigation, Mobile Gateway pill, Theme toggle
│   │   │   └── modals/                        # BackupRestoreModal, MasterExcelImportModal, ProfileDiffModal, AtRiskStudentsModal
│   │   ├── lib/                               # Domain Logic & Legal Algorithmic Specifications (20 files)
│   │   │   ├── curriculum.ts                  # Official subject catalog, term schedules, SHS unit definitions (128 KB)
│   │   │   ├── curriculumPresets.ts           # Pre-configured DepEd section curricula for all grade levels (49 KB)
│   │   │   ├── grading.ts                     # Transmutation tables, honor rolls, descriptive ratings (32 KB)
│   │   │   ├── terms.ts                       # 3-Term Trimester vs 4-Quarter calendar logic and period routing
│   │   │   ├── subjectConfig.ts               # Learning area canonicalization and MAPEH component resolution (39 KB)
│   │   │   ├── sshsCatalog.ts                 # DO 017 Annex A 128-course elective catalog and prerequisite trees (48 KB)
│   │   │   ├── sshsEquivalency.ts             # DO 017 Annex F.2 legacy K-12 to SSHS course crediting matrix (25 KB)
│   │   │   ├── sshsGraduation.ts              # DO 017 Tables 9 & 10 core/elective graduation audit algorithms
│   │   │   ├── rbac.ts                        # Role-based access control permissions matrix (16 KB)
│   │   │   ├── sf10Subjects.ts                # SF10 permanent record learning area templates
│   │   │   └── sf2-excel-export.ts            # SF2 attendance spreadsheet OpenXML generation logic (28 KB)
│   │   └── utils/                             # Low-Level Utilities & Parsers (50 files)
│   │       ├── grading-helpers.ts             # Live score calculation, ghost record detection, composite resolution (90 KB)
│   │       ├── grade-reconciliation.ts        # Reconciling subject name variants across sections and school years (31 KB)
│   │       ├── safe-workbook-reader.ts        # Defensive XLSX ingestion preventing formula bombs and memory spikes
│   │       ├── sf1-parser.ts                  # Automated parsing of official DepEd LIS SF1 registers (14 KB)
│   │       ├── sf10Mapper.ts                  # Mapping database records into SF10-ES and SF10-JHS structures (37 KB)
│   │       ├── shsSf10Mapper.ts               # Mapping Senior High School records into SF10-SHS formats (11 KB)
│   │       ├── shsSf9Mapper.ts                # Mapping Senior High School records into SF9-SHS cards (11 KB)
│   │       ├── sf9-attendance.ts              # Mapping monthly attendance counts onto SF9 attendance grids (15 KB)
│   │       ├── sf2-sync.ts                    # Synchronizing daily roll-call marks into monthly SF2 summaries (14 KB)
│   │       ├── sf8ReferenceData.ts            # WHO Child Growth Standards and DepEd SF8 nutritional tables
│   │       ├── student-name.ts                # DepEd standard name formatting: "LAST, FIRST, MIDDLE, EXT"
│   │       ├── testSectionGenerator.ts        # Development test data generator (66 KB)
│   │       ├── testSectionGuards.ts           # Production environment isolation guards for test data
│   │       ├── backup-restore.ts              # Native backup pair reading, verification, and restoration (28 KB)
│   │       ├── backup-import.ts               # Backup file parsing and multi-store restoration (28 KB)
│   │       ├── backup-encryption.ts           # AES-256-GCM encryption/decryption for exported backups
│   │       ├── backup-compression.ts          # GZIP compression/decompression pipeline
│   │       ├── backup-metadata.ts             # Manifest generation with record counts and SHA-256 digests
│   │       ├── backup-integrity.ts            # Checksum validation and header verification
│   │       ├── db-crypto.ts                   # Web Cryptography API envelope encryption for IndexedDB stores
│   │       ├── encryption-migration.ts        # Multi-version database schema encryption migration
│   │       ├── password-crypto.ts             # PBKDF2 salt and hash derivation with constant-time equality
│   │       ├── pdf-export.ts                  # Vector PDF generation helpers
│   │       ├── restore-options.ts             # Selective restore configurations (merge vs overwrite)
│   │       ├── certificateUtils.ts            # Certificate dimension and seal alignment helpers
│   │       └── scan-utils.ts                  # Barcode and QR code parsing and normalization
├── formease-mobile/                           # Android Companion Application
│   └── android/                               # Native camera QR attendance scanner syncing over local Wi-Fi
├── license-portal/                            # Cryptographic Licensing & Activation Server
│   ├── functions/                             # Firebase Cloud Functions generating machine-bound HMAC-SHA256 licenses
│   └── src/                                   # Administrative dashboard for license generation and device management
└── update-server/                             # Desktop Auto-Updater Distribution Infrastructure
    └── updates/                               # Staged immutable release metadata (latest.yml, latest-mac.yml) and installers
```

---

## 6. COMPLETE INVENTORY OF ALL 83 OFFICIAL DEPED EXCEL TEMPLATES

The `app/public/templates/` folder contains **exactly 83 official DepEd workbooks**. Every single template is mapped to specific grade levels, curricula, and export renderers:

### 6.1 Electronic Class Records (ECR) — 3-Term SY 2026–2027 (26 Templates)
| # | Template Filename | Exact File Size | Target Grade Level & Curricular Scope | Key Worksheet Tabs | Male / Female Rows | Columns per Term | Export Renderer Service |
| :-: | :--- | :---: | :--- | :--- | :---: | :--- | :--- |
| 1 | `(K to 10) 3Term E-Class Record - No Formula.xlsx` | 1,183 KB | Universal Grades K to 10 (Lightweight OpenXML injection) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY` | M: 13–62<br>F: 66–115 | WW: E–N, PT: T–AC, QA: AJ–AL, IG: AP, FG: AQ | `ecr-excel-export.ts` |
| 2 | `ECR_Template_Academic_G2_G10.xlsx` | 403 KB | Grades 2–10 Academic Core (Science, Math, English, Filipino, AP) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY OF GRADES` | M: 13–62<br>F: 66–115 | WW 20%, PT 50%, QA 30% | `ecr-excel-export.ts` |
| 3 | `UPDATED [Grades 2-10] 3Term E-Class Record (for Science, Math, English, Filipino, Araling Panlipunan).xlsx` | 403 KB | Grades 2–10 Academic Core (Updated official release) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY OF GRADES` | M: 13–62<br>F: 66–115 | WW 20%, PT 50%, QA 30% | `ecr-excel-export.ts` |
| 4 | `[Grades 2-10] 3Term E-Class Record (for Science, Math, English, Filipino, Araling Panlipunan).xlsx` | 403 KB | Grades 2–10 Academic Core (Standard release) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY OF GRADES` | M: 13–62<br>F: 66–115 | WW 20%, PT 50%, QA 30% | `ecr-excel-export.ts` |
| 5 | `ECR_Template_EPP_TLE_G2_G10.xlsx` | 264 KB | Grades 4–10 EPP / TLE (General single-grade model) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY OF GRADES` | M: 13–62<br>F: 66–115 | WW 20%, PT 60%, QA 20% | `ecr-excel-export.ts` |
| 6 | `UPDATED [Grades 2-10] 3Term E-Class Record (for EPP-TLE).xlsx` | 264 KB | Grades 4–10 EPP / TLE (Updated release) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY OF GRADES` | M: 13–62<br>F: 66–115 | WW 20%, PT 60%, QA 20% | `ecr-excel-export.ts` |
| 7 | `[Grades 2-10] 3Term E-Class Record (for EPP-TLE).xlsx` | 264 KB | Grades 4–10 EPP / TLE (Standard release) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY OF GRADES` | M: 13–62<br>F: 66–115 | WW 20%, PT 60%, QA 20% | `ecr-excel-export.ts` |
| 8 | `ECR_Template_EPP_TLE_Components_G2_G10.xlsx` | 366 KB | Grades 4–10 EPP / TLE with 4 Component breakdown (ICT, Agri, HE, IA) | `INPUT DATA`, `ICT`, `AGRI`, `HE`, `IA`, `COMPOSITE SUMMARY` | M: 13–62<br>F: 66–115 | Per-component weighting | `ecr-excel-export.ts` |
| 9 | `UPDATED [Grades 2-10] 3Term E-Class Record (for EPP-TLE) - per component.xlsx` | 366 KB | Grades 4–10 EPP / TLE per component (Updated release) | `INPUT DATA`, `ICT`, `AGRI`, `HE`, `IA`, `COMPOSITE SUMMARY` | M: 13–62<br>F: 66–115 | Per-component weighting | `ecr-excel-export.ts` |
| 10 | `ECR_Template_GMRC_VE_G2_G10.xlsx` | 302 KB | Grades 2–10 GMRC & Values Education (5-domain split) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY OF GRADES` | M: 13–62<br>F: 66–115 | WW Cog 10%, WW Aff 10%, PT Cog 10%, PT Aff 10%, PT Beh 30%, QA 30% | `ecr-excel-export.ts` |
| 11 | `UPDATED [Grades 2-10] 3Term E-Class Record (for GMRC and Values Education).xlsx` | 302 KB | Grades 2–10 GMRC & Values Education (Updated release) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY OF GRADES` | M: 13–62<br>F: 66–115 | 5-Domain assessment split | `ecr-excel-export.ts` |
| 12 | `[Grades 2-10] 3Term E-Class Record (for GMRC - Values Education).xlsx` | 302 KB | Grades 2–10 GMRC & Values Education (Standard release) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY OF GRADES` | M: 13–62<br>F: 66–115 | 5-Domain assessment split | `ecr-excel-export.ts` |
| 13 | `ECR_Template_MAPEH_G2_G10.xlsx` | 362 KB | Grades 2–10 MAPEH (4-in-1 discrete disciplines) | `INPUT DATA`, `MUSIC`, `ARTS`, `PE`, `HEALTH`, `SUMMARY` | M: 13–62<br>F: 66–115 | WW 20%, PT 60%, QA 20% | `ecr-excel-export.ts` |
| 14 | `UPDATED [Grades 2-10] 3Term E-Class Record (for Music and Arts, Physical Education and Health).xlsx` | 362 KB | Grades 2–10 MAPEH (Updated MATATAG 2-in-1 format) | `INPUT DATA`, `MUSIC AND ARTS`, `PE AND HEALTH`, `SUMMARY` | M: 13–62<br>F: 66–115 | Dual-component composite | `ecr-excel-export.ts` |
| 15 | `[Grades 2-10] 3Term E-Class Record (for Music and Arts, P.E. and Health).xlsx` | 362 KB | Grades 2–10 MAPEH (Variant 1) | `INPUT DATA`, `MUSIC AND ARTS`, `PE AND HEALTH`, `SUMMARY` | M: 13–62<br>F: 66–115 | Dual-component composite | `ecr-excel-export.ts` |
| 16 | `[Grades 2-10] 3Term E-Class Record (for Music and Arts, Physical Education and Health).xlsx` | 362 KB | Grades 2–10 MAPEH (Variant 2) | `INPUT DATA`, `MUSIC AND ARTS`, `PE AND HEALTH`, `SUMMARY` | M: 13–62<br>F: 66–115 | Dual-component composite | `ecr-excel-export.ts` |
| 17 | `ECR_Template_MAPEH_TLE_G2_G10.xlsx` | 267 KB | Grades 2–10 Combined MAPEH-TLE Technical Specialization | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY` | M: 13–62<br>F: 66–115 | WW 20%, PT 60%, QA 20% | `ecr-excel-export.ts` |
| 18 | `[Grades 2-10] 3Term E-Class Record (for EPP-TLE, TLE, Music and Arts, P.E. and Health).xlsx` | 267 KB | Grades 2–10 Combined Practical Arts (Standard release) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY` | M: 13–62<br>F: 66–115 | WW 20%, PT 60%, QA 20% | `ecr-excel-export.ts` |
| 19 | `ECR_Template_SPA_G4_G10.xlsx` & `UPDATED...` | 264 KB | Grades 4–10 Special Program in the Arts (SPA) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY` | M: 13–62<br>F: 66–115 | WW 20%, PT 60%, QA 20% | `ecr-excel-export.ts` |
| 20 | `ECR_Template_SPFL_G4_G10.xlsx` & `UPDATED...` | 490 KB | Grades 7–10 Special Program in Foreign Language (SPFL) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY` | M: 13–62<br>F: 66–115 | WW 20%, PT 50%, QA 30% | `ecr-excel-export.ts` |
| 21 | `ECR_Template_SPJ_G4_G10.xlsx` & `UPDATED...` | 264 KB | Grades 4–10 Special Program in Journalism (SPJ) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY` | M: 13–62<br>F: 66–115 | WW 20%, PT 50%, QA 30% | `ecr-excel-export.ts` |
| 22 | `ECR_Template_SPS_G4_G10.xlsx` & `UPDATED...` | 264 KB | Grades 4–10 Special Program in Sports (SPS) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY` | M: 13–62<br>F: 66–115 | WW 20%, PT 60%, QA 20% | `ecr-excel-export.ts` |
| 23 | `ECR_Template_SPTVE_G4_G10.xlsx` & `UPDATED...` | 264 KB | Grades 7–10 Technical-Vocational Education (SPTVE) | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY` | M: 13–62<br>F: 66–115 | WW 15%, PT 65%, QA 20% | `ecr-excel-export.ts` |
| 24 | `ECR_Template_SSES_SPSTEM_G4_G10.xlsx` & `UPDATED...` | 264 KB | Grades 4–10 SSES & Special Program in STEM | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY` | M: 13–62<br>F: 66–115 | WW 20%, PT 50%, QA 30% | `ecr-excel-export.ts` |
| 25 | `SSHS E-Class Record SY 2026-2027.xlsx` & `ECR_3Term - SSHS...` | 466 KB | DO 017 s. 2026 Strengthened Senior High School ECR | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY OF GRADES` | M: 13–62<br>F: 66–115 | Dynamic cluster weights, units, ST1/ST2/TE | `sshs-excel-export.ts` |
| 26 | `SHS E-Class Record SY 2026-2027.xlsx`, `ECR_3Term - SHS G12...` & `Updated_2.xlsx` | 418–496 KB | Grade 12 Senior High School 3-Term ECR | `INPUT DATA`, `TERM 1`, `TERM 2`, `TERM 3`, `SUMMARY OF GRADES` | M: 13–62<br>F: 66–115 | ST1 (30%), ST2 (30%), TE (40%) | `shs-g12-excel-export.ts` |

---

### 6.2 School Form 9 (SF9) — Learner Progress Report Cards (31 Templates)
| # | Template Filename | Exact File Size | Grade Level / Track Target | Sheet Architecture | Key Cell Coordinates | Export Renderer Service |
| :-: | :--- | :---: | :--- | :--- | :--- | :--- |
| 1 | `G1 School Form 9 with PACE Form (SY 26-27).xlsx` | 285 KB | Grade 1 MATATAG Curriculum | `SF9 FRONT`, `SF9 BACK`, `PACE-Reading`, `PACE-Language`, `PACE-Mathematics`, `PACE-GMRC-Makabansa` | Learner: `D9`, LRN: `D10`, Age: `D11`, Sex: `H11`. Learning Areas: Rows 17–21. Descriptors: A–E | `sf9-g1-excel-export.ts` |
| 2 | `SF9 Template Grade 1.xlsx` | 260 KB | Grade 1 Standard Report Card | `SF9 FRONT`, `SF9 BACK` | 1-Page paper budget print layout | `sf9-g1-excel-export.ts` |
| 3 | `G2 School Form 9 (SY 26-27).xlsx` & `UPDATED...` | 458 KB | Grade 2 Elementary Report Card | `SF9 FRONT`, `SF9 BACK` | Learner info, 11-month attendance, Observed Values, learning areas | `sf9-g2-excel-export.ts` |
| 4 | `G3 School Form 9 (SY 26-27).xlsx` & `UPDATED...` | 464 KB | Grade 3 Elementary Report Card | `SF9 FRONT`, `SF9 BACK` | Identical layout to Grade 2 with Grade 3 learning area catalog | `sf9-g3-excel-export.ts` |
| 5 | `G4-10  School Form 9 (SY 26-27).xlsx` & `UPDATED...` | 491 KB | Grades 4–10 Junior High School | `SF9 FRONT`, `SF9 BACK` | Filipino (R18), English (R19), Math (R20), Science (R21), AP (R22), EsP (R23), TLE (R24), MAPEH (R25), Music (R26), Arts (R27), PE (R28), Health (R29). Gen Avg: R30 | `sf9-g4-10-excel-export.ts` |
| 6 | `G11 Academic School Form 9 (SY 26-27).xlsx` | 477 KB | Grade 11 Academic Track (STEM, ABM, HUMSS, GAS) | `SF9 FRONT`, `SF9 BACK` | 3 Terms, Core Subjects, Academic Electives, units earned, unit-weighted general average | `sf9-g11-academic-excel-export.ts` |
| 7 | `G11 TechPro School Form 9 (SY 26-27).xlsx` | 558 KB | Grade 11 Technical-Professional / TVL Track | `SF9 FRONT`, `SF9 BACK` | Technical specialization clusters, safety certifications, NC II competencies, unit-weighted average | `sf9-g11-techpro-excel-export.ts` |
| 8 | `G12 Academic with Cross School Form 9 (SY 26-27).xlsx` | 422 KB | Grade 12 Academic Track with Cross-Enrollment | `SF9 FRONT`, `SF9 BACK` | Accommodates subjects cross-enrolled at partner HEIs/institutions | `sf9-g12-academic-cross-excel-export.ts` |
| 9 | `G12 TechPro School Form 9 (SY 26-27).xlsx` | 419 KB | Grade 12 TechPro Track | `SF9 FRONT`, `SF9 BACK` | Dual-training system, Work Immersion 320h/540h/640h ratings | `sf9-g12-techpro-excel-export.ts` |
| 10 | `G12 TechPro with Cross School Form 9 (SY 26-27).xlsx` | 421 KB | Grade 12 TechPro Track with Cross-Enrollment | `SF9 FRONT`, `SF9 BACK` | Dual-training system with partner technical institute cross-crediting | `sf9-g12-techpro-cross-excel-export.ts` |
| 11 | `SF9_Template_G2_G12.xlsx` & `SF9_Template_G2_G12.xlsm` | 124–130 KB | Master Legacy Dynamic SF9 Templates | `FRONT`, `BACK` | Master templates with embedded calculation macros | `sf9-excel-export.ts` |
| 12 | `UPDATED SPA G4-10  School Form 9 (SY 26-27).xlsx` / `SF9_Template_SPA...` | 514 KB | Special Program in the Arts (Grades 4–10) | `SF9 FRONT`, `SF9 BACK` | Visual Arts, Music, Dance, Theater, Media Arts, Creative Writing | `sf9-scp-excel-export.ts` |
| 13 | `UPDATED SPFL G7-10  School Form 9 (SY 26-27).xlsx` / `SF9_Template_SPFL...` | 515 KB | Special Program in Foreign Language (Grades 7–10) | `SF9 FRONT`, `SF9 BACK` | Spanish, Mandarin, Japanese, French, German language ratings | `sf9-scp-excel-export.ts` |
| 14 | `UPDATED SPJ G4-10  School Form 9 (SY 26-27).xlsx` / `SF9_Template_SPJ...` | 516 KB | Special Program in Journalism (Grades 4–10) | `SF9 FRONT`, `SF9 BACK` | Print, broadcast, online campus journalism curriculum ratings | `sf9-scp-excel-export.ts` |
| 15 | `UPDATED SPS G4-10  School Form 9 (SY 26-27).xlsx` / `SF9_Template_SPS...` | 514 KB | Special Program in Sports (Grades 4–10) | `SF9 FRONT`, `SF9 BACK` | Individual & team sports practicum, athletic event attendance | `sf9-scp-excel-export.ts` |
| 16 | `UPDATED SPSTEM G7-10  School Form 9 (SY 26-27).xlsx` / `SF9_Template_SPSTEM...` | 461 KB | Special Program in STEM (Grades 7–10) | `SF9 FRONT`, `SF9 BACK` | Advanced Science, Research Capstone, Advanced Mathematics | `sf9-scp-excel-export.ts` |
| 17 | `UPDATED SPTVE G7-8  School Form 9 (SY 26-27).xlsx` / `SF9_Template_SPTVE_G7_G8...` | 462 KB | Technical-Vocational Exploratory (Grades 7–8) | `SF9 FRONT`, `SF9 BACK` | Exploratory vocational competencies, safety, basic tools | `sf9-scp-excel-export.ts` |
| 18 | `UPDATED SPTVE G9-10  School Form 9 (SY 26-27).xlsx` / `SF9_Template_SPTVE_G9_G10...` | 463 KB | Technical-Vocational Specialization (Grades 9–10) | `SF9 FRONT`, `SF9 BACK` | Specialization competencies, TESDA NC I/II certificate links | `sf9-scp-excel-export.ts` |
| 19 | `UPDATED SSES G4-6  School Form 9 (SY 26-27).xlsx` / `SF9_Template_SSES...` | 458 KB | Special Science Elementary Schools (Grades 4–6) | `SF9 FRONT`, `SF9 BACK` | Accelerated Elementary Science and Mathematics | `sf9-scp-excel-export.ts` |
| 20 | `UPDATED [Grade 1] ECR, PACE Form, and SF9.xlsx` | 11,291 KB (11.29 MB) | Grade 1 MATATAG Master All-in-One Workbook | 14 Integrated Worksheets | Combines Grade 1 raw score ECR, 4 PACE forms, and official SF9 report card | `sf9-g1-excel-export.ts` |

---

### 6.3 Grade 1 MATATAG PACE Form Workbooks (7 Templates)
| # | Template Filename | Exact File Size | Assessment Learning Area Domain | Key Contents & Evaluation Mode |
| :-: | :--- | :---: | :--- | :--- |
| 1 | `PACE FORM - Reading and Literacy.xlsx` | 62 KB | Reading & Literacy Domain | Phonological awareness, decoding, reading comprehension, vocabulary; Descriptors A–E |
| 2 | `PACE FORM - Language.xlsx` | 62 KB | Language Domain | Oral communication, grammar awareness, sentence construction, listening; Descriptors A–E |
| 3 | `PACE FORM - Mathematics.xlsx` | 60 KB | Mathematics Domain | Number sense, operations, geometry, patterns, basic measurement; Descriptors A–E |
| 4 | `PACE FORM - GMRC & MAKABANSA.xlsx` | 60 KB | GMRC & Makabansa Domain | Cultural identity, civic values, personal discipline, community awareness; Descriptors A–E |
| 5 | `PACE FORM - GMRC and MAKABANSA.xlsx` | 60 KB | GMRC & Makabansa (Alternative naming) | Identical structure to template #4 |
| 6 | `PACE_FORM_GMRC_MAKABANSA.xlsx` | 60 KB | GMRC & Makabansa (Underscored naming) | Identical structure to template #4 |
| 7 | `PACE FORM.xlsx` | 309 KB | Consolidated Master 4-Domain Workbook | Contains all 4 PACE domains within a single multi-tab workbook |

---

### 6.4 School Form 2 (SF2) Daily Attendance Workbooks (5 Templates)
| # | Template Filename | Exact File Size | Grade Level / Format Target | Key Contents & Columns |
| :-: | :--- | :---: | :--- | :--- |
| 1 | `SF2_ELEM.xlsx` | 34 KB | Elementary (Grades 1–6) Daily Attendance Register | 11 School Months (June to April), 200 instructional days, ADA, attendance percentage, SARDO flags |
| 2 | `SF2_JHS.xlsx` | 34 KB | Junior High School (Grades 7–10) Daily Attendance Register | 11 School Months, section summary, dropout / transfer-out tracking |
| 3 | `SF2 JHS.xls` | 78 KB | Junior High School (Excel 97–2003 binary format) | Legacy school format compatibility |
| 4 | `SF2_SHS.xlsx` | 71 KB | Senior High School (Grades 11–12) Daily Attendance Register | Track, Strand, and Cluster metadata fields, immersion attendance |
| 5 | `SF2 SHS.xls` | 357 KB | Senior High School (Excel 97–2003 binary format) | Legacy school format compatibility with embedded summary macros |

---

### 6.5 Scratch & Internal Verification Workbooks (4 Templates)
| # | Template Filename | Exact File Size | Purpose & Role |
| :-: | :--- | :---: | :--- |
| 1 | `scratch_test.xlsx` | 26 KB | Internal OpenXML injection unit test fixture verifying cell ordering and zip rebuild |
| 2 | `scratch_test_clean.xlsx` | 64 KB | Sanitized benchmark workbook for formula caching and style index boundary tests |
| 3 | `scratch_test_elem.xlsx` | 34 KB | Elementary template test fixture for testing 11-month attendance calculations |
| 4 | `scratch_test_inner_duplicate.xlsx` | 58 KB | Regression test workbook validating duplicate sheet name resolution and XML namespace guards |

---

## 7. THE DIRECT OPENXML INJECTION ENGINE (`JSZip`)

### 7.1 Why Standard Libraries Fail on DepEd Workbooks
Standard JavaScript spreadsheet libraries (`exceljs`, `xlsx`) deserialize workbooks into in-memory object graphs and reconstruct the OpenXML container on save:
1. **Broken Shared Formulas**: Complex DepEd workbooks use `<f t="shared" ref="..." si="...">` tags to distribute formulas across thousands of cells. High-level libraries strip or improperly expand these, causing Excel to throw:
   > *"Excel found unreadable content in 'Workbook.xlsx'. Do you want to recover the contents?"*
2. **Lost Vector Drawings, Seals & Specimen Signatures**: DepEd official logos, coat-of-arms vectors, and specimen signature shapes embedded in `xl/drawings/drawing1.xml` and relationships in `xl/worksheets/_rels/sheet1.xml.rels` are discarded.
3. **Corrupted Page Budgets & Print Setups**: Custom print setups (`fitToWidth="1"`, `fitToHeight="1"`, paper size `9` (A4) or `1` (Letter), custom print titles) are stripped, causing a 1-page report card to print across 4 deformed pages.
4. **Formula Calculation Caching with Error Suppression**: When high-level libraries write null values, Excel leaves error flags `<c t="e"><v>#VALUE!</v></c>`, breaking downstream sum ranges and prompting recovery dialogs.

---

### 7.2 The Direct OpenXML Surgical Injection Pattern
FormEase Pro modifies the internal XML streams directly using `JSZip`, leaving surrounding drawing, style, and relationship definitions completely untouched:

```typescript
// Core implementation pattern from sshs-excel-export.ts & sf9-g1-excel-export.ts
import JSZip from 'jszip';

export async function exportToOfficialTemplate(templateBuffer: ArrayBuffer, data: ExportData): Promise<Blob> {
  const zip = await JSZip.loadAsync(templateBuffer);
  
  // 1. Target worksheet XML directly inside the ZIP archive
  const sheetPath = 'xl/worksheets/sheet1.xml';
  let sheetXml = await zip.file(sheetPath)!.async('string');

  // 2. Surgical Cell Update: Preserves cell styles (s="...") and maintains strict alphabetical column ordering
  sheetXml = updateOrInsertCell(sheetXml, 'D8', 8, data.learnerName, false);
  sheetXml = updateOrInsertCell(sheetXml, 'G8', 8, data.lrn, false);
  
  // 3. Formula preservation: Update cached calculation (<v>) while keeping original formula (<f>)
  // Strips any error markers (t="e") that would prompt Excel repair dialogs
  sheetXml = updateCellFormulaValue(sheetXml, 'AL17', 17, data.computedFinalGrade);

  // 4. Overwrite modified XML inside the ZIP container
  zip.file(sheetPath, sheetXml);

  // 5. Generate pristine, fully-functional Excel binary
  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}
```

#### The Four Immutable Rules of Direct OpenXML Injection:
1. **Strict Alphabetical Column Ordering**: Inside any `<row>` element in OpenXML, child `<c r="colRow">` tags must be ordered alphabetically (`<c r="A1">`, `<c r="B1">` ... `<c r="Z1">`, `<c r="AA1">`, `<c r="AB1">`). The `updateOrInsertCell()` function calculates `colToIndex()` to insert new cells at their exact alphabetical offset. Inserting out of order corrupts the worksheet.
2. **Style Index (`s="..."`) Preservation**: Maintains existing formatting by copying the `s` attribute of the template cell. If a cell is replaced, the engine preserves font size, background fills, number formats (e.g. `0.00`), and border lines.
3. **Formula Caching with Error Suppression**: When updating cells that contain formulas, the original `<f>...</f>` is preserved, the cached value `<v>cached_value</v>` is updated, and any error indicator (`t="e"`) is stripped.
4. **Drawing & Media Relationship Invariance**: Files under `xl/drawings/`, `xl/media/`, and `xl/theme/` are never touched, ensuring school crests, DepEd logos, and watermarks remain in vector clarity.

---

## 8. REAL-WORLD PRODUCTION LESSONS & HISTORICAL BUGS SOLVED

Any next-generation architecture must incorporate the solutions to the major issues solved in FormEase Pro:

### 8.1 Ghost Record & Unsafe Startup Purging Incident (v3.5.17 / v3.5.19)
- **The Issue**: A release introduced aggressive startup cleanup code that deleted sections and students whose LRN started with `999*`, or whose name matched `"TEMP-*"` or `"Einstein"`, mistakenly assuming they were test data. This caused catastrophic data loss for real schools whose sections were named after Albert Einstein or who had temporary LRNs.
- **The Solution**: Removed all heuristic name-based purging. Test data is now tracked exclusively with an explicit boolean flag: `is_test_data: true`. Startup cleanup code never purges records unless this flag is explicitly present. In addition, `pre-update-safety.ts` creates automated recovery snapshots prior to executing any schema updates.

### 8.2 The 4000% Weighted Score Header Bug (v3.5.15)
- **The Issue**: Legacy database records stored component weights as whole numbers (`40`, `60`, `20`). When multiplied by percentage scores, weighted scores ballooned into thousands (e.g., $95 	imes 40 = 3800$), causing headers to display `4000%` and clamping term grades to 100.
- **The Solution**: Created an automatic database self-healing startup migration that converts all whole-number weights to standard decimal fractions (`0.40`, `0.60`, `0.20`) and display strings (`"40%"`).

### 8.3 Grade 12 Examination 3-Component Calculation Fix (v3.5.12)
- **The Issue**: Grade 12 subjects were erroneously listed under `EXS_TE_ONLY_CLUSTERS`, causing the UI to calculate examination percentage scores using Term Exam only (`TE / TE_HPS * 100`) and discarding Summative Tests 1 and 2, even when ST1 and ST2 scores were encoded. This caused discrepancies between the UI and the official DepEd Excel formula.
- **The Solution**: Grade 12 core clusters were removed from `EXS_TE_ONLY_CLUSTERS`. The system now computes Exam Percentage Score using the official DepEd formula:
  $$	ext{Exam PS} = (	ext{ST1}\% 	imes 30\%) + (	ext{ST2}\% 	imes 30\%) + (	ext{TE}\% 	imes 40\%)$$
  matching the official Excel formula `=SUM(AG17:AI17)`.

### 8.4 Input Persistence & Debounce Flushing (v3.5.5)
- **The Issue**: Teachers rapidly entering scores in E-Class Records suffered data loss when switching tabs before a debounce timer fired.
- **The Solution**: Implemented a mandatory `flush()` trigger on input components that automatically commits all pending edits to IndexedDB upon component unmount, window blur, or section switching.

### 8.5 Corrupted 100x Initial Grade Self-Healing Safeguard (v3.5.18)
- **The Issue**: During external CSV imports or corrupted formula calculations, some initial grades were saved multiplied by 100 (e.g. `7153.94` instead of `71.54`), causing transmutation lookups to fail and clamp to 60.
- **The Solution**: Implemented a self-healing validator in `transmuteGrade` and `checkCorruptedInitial`:
  ```typescript
  if (normalizedInitial > 120 && normalizedInitial <= 10000) {
      normalizedInitial = normalizedInitial / 100;
  }
  ```

### 8.6 The Sequential Subject Guard (v3.5.16)
- **The Issue**: In Senior High School, subjects with sequential designations (e.g., *Practical Research 1* vs. *Practical Research 2*, *General Chemistry 1* vs. *General Chemistry 2*, *HOPE 1* vs. *HOPE 2*) share identical root keywords. Naive regex matching caused scores from Semester 1 subjects to bleed into Semester 2 subjects.
- **The Solution**: Implemented `extractSubjectSequence()` in `app/src/utils/grading-helpers.ts` which isolates Roman and Arabic numerals (`1, 2, 3, 4, I, II, III, IV`) while ignoring grade levels (e.g. `Grade 11`) and ensures subjects with differing sequence numbers NEVER match.

### 8.7 Bundler Startup Exceptions: Zero-Crash Vendor Chunking (v3.5.16)
- **The Issue**: Attempting to split vendor bundles into granular chunks (`react-vendor`, `recharts-vendor`, `lucide-vendor`) caused circular initialization deadlocks in production Electron builds, crashing the app before the first window render.
- **The Solution**: Unified third-party libraries into a cohesive production vendor bundle with strict execution ordering, eliminating race conditions.

### 8.8 SafeStorage DPAPI Fallback & Machine-Bound License Invariance
- **The Issue**: When running on Windows portable environments or after major Windows updates, the Electron `safeStorage` DPAPI master key could become invalid, locking users out of their encrypted DEK.
- **The Solution**: Implemented an automated fallback hierarchy: if `safeStorage` fails to decrypt the DEK, the system attempts PBKDF2 decryption using the user's master password salt, ensuring zero data loss.

---

## 9. MASTER BLUEPRINT: BUILDING THE SUPERIOR NEXT-GENERATION SCHOOL MANAGEMENT SYSTEM

ChatGPT and the engineering team should use the following blueprint to build a brand-new, vastly superior system inspired by FormEase Pro:

### 9.1 Modern Technology Architecture
1. **Core Runtime**:
   - **Tauri 2.0 (Rust backend)** or modern **Electron 41+** with strict sandboxing. Tauri provides a 10x smaller binary size (~15MB vs ~180MB) and near-zero idle RAM usage.
   - **Frontend**: **Next.js 15 (App Router)** or **Vite + React 19** with strict TypeScript.
2. **Database Engine**:
   - Replace raw IndexedDB with **SQLite (via OPFS / Turso / ElectricSQL)** or **Dexie.js / RxDB**.
   - SQLite provides true ACID relational transactions, foreign-key cascade integrity, SQL query speed, and multi-year data partitioning.
3. **Cryptographic Standard**:
   - Upgrade from PBKDF2 to **Argon2id** (memory-hard password hashing) for KEK derivation.
   - Maintain the AES-256-GCM envelope encryption architecture for student PII.

### 9.2 Architectural Upgrades Over FormEase Pro
1. **Declarative OpenXML Template Engine**:
   - Build a formal declarative mapping engine in TypeScript or Rust.
   - Instead of maintaining 80+ separate export scripts with hardcoded cell coordinates, define a JSON schema for each template:
     ```json
     {
       "template": "SSHS_ECR_2026.xlsx",
       "sheets": {
         "TERM 1": {
           "metadata": { "D4": "school.region", "D6": "school.name" },
           "students": {
             "startRow": 13,
             "columns": { "B": "lrn", "C": "fullName", "E-N": "wwScores", "T-AC": "ptScores" }
           }
         }
       }
     }
     ```
2. **High-Performance Spreadsheet UI**:
   - Use a virtualized data table (e.g. `@tanstack/react-virtual` or Canvas-based grid) capable of rendering 100 students and 50 assessment columns at 120 FPS.
   - Full keyboard navigation: Arrow keys, Tab, Enter, Copy/Paste range from Excel, undo/redo stack (`Ctrl + Z` / `Ctrl + Y`).
3. **AI-Powered Teacher Copilot**:
   - **Automated Narrative Remarks Generator**: AI model generating professional, DepEd-compliant, individualized SF9 learner progress remarks and PACE qualitative evaluations based on quarterly trends.
   - **At-Risk Early Warning System**: Predictive algorithms analyzing attendance patterns and formative scores to alert teachers to learners at risk of dropping out or failing before the term concludes.
4. **Peer-to-Peer Local Network Sync**:
   - Implement local network peer discovery (mDNS / Bonjour) allowing subject teachers on school Wi-Fi to submit grades directly to the class adviser or registrar desktop without requiring cloud or internet connectivity.
5. **Direct DepEd LIS / eBEIS Integration**:
   - Built-in scraper/uploader converting local school records into official DepEd Learner Information System (LIS) batch-upload formats, eliminating double data encoding for teachers.

---
## 10. COMPLETE NAVIGATION SIDEBAR, UI MODULES & CARD-BY-CARD VIEW HIERARCHY

### 10.1 The Global Application Shell & Navigation Topology
The application shell (`app/src/components/layout/`) coordinates the entire desktop workspace:
- **`Header.tsx` (Global Command Bar)**:
  - **School Branding & Title**: Displays the official School Name, School ID, and active Division.
  - **Academic Year Selector**: Dropdown switcher filtering the entire application state by active school year (e.g., `2026-2027` vs. `2025-2026`).
  - **Mobile Gateway Pill**: Real-time indicator showing local Wi-Fi server status (`Online` / `Offline`) and connected teacher smartphones.
  - **Notification Center**: Bell icon with unread badge displaying system alerts, auto-backup notifications, and mobile scan logs.
  - **Theme Toggle**: Instant switch between Light Mode and Dark Mode (`.dark` class on root HTML).
  - **User Account Menu**: Displays active role (Admin, Teacher, Adviser, Principal, Registrar), account settings, and secure sign-out trigger.
- **`Sidebar.tsx` (Multi-Section Resizable Navigation)**:
  - **Width Customization**: Fully resizable from `200px` to `460px` with persistent width in `localStorage`; collapsible to a compact icon rail.
  - **Silent Backup on Sign-Out**: Triggering sign-out automatically creates a comprehensive timestamped backup (`SMS_Backup_Comprehensive_logout_*.json`) before invalidating the session.

### 10.2 Complete NavGroup Hierarchy & All Sidebar Items
Implemented in `app/src/components/layout/Sidebar.tsx`:

```
+------------------------------------------------------------------------------------+
| SIDEBAR NAVIGATION GROUPS                                                          |
+------------------------------------------------------------------------------------+
| 1. OVERVIEW                                                                        |
|    └── Dashboard [id: 'dashboard', icon: LayoutDashboard]                          |
|                                                                                    |
| 2. ACADEMIC MANAGEMENT                                                             |
|    ├── Classes & Sections [id: 'sections', icon: Layers]                          |
|    ├── Subject Library [id: 'subjects', icon: GraduationCap]                       |
|    ├── E-Class Record [id: 'eclass', icon: FileSpreadsheet]                        |
|    └── Grade Management [id: 'consolidated-grades', icon: BarChart3]               |
|                                                                                    |
| 3. LEARNER RECORDS & FORMS                                                         |
|    ├── Student Information [id: 'students', icon: Users]                          |
|    ├── Daily Attendance [id: 'daily-attendance', icon: ClipboardCheck]             |
|    └── School Forms Hub [id: 'school-forms', icon: ClipboardList]                  |
|                                                                                    |
| 4. INSTITUTION & PLANNING                                                          |
|    ├── Institute Profile [id: 'institute', icon: School]                           |
|    ├── School Calendar [id: 'calendar', icon: Calendar]                            |
|    ├── Announcements [id: 'announcements', icon: Megaphone]                        |
|    └── Reports & Analytics [id: 'reports', icon: BarChart3]                        |
|                                                                                    |
| 5. TOOLS & UTILITIES                                                               |
|    ├── Student ID Generator [id: 'student-id-generator', icon: IdCard]              |
|    ├── DLL Generators [id: 'online-generators', icon: BookOpen]                    |
|    └── Games & Tools [id: 'games-tools', icon: Gamepad2]                           |
|                                                                                    |
| 6. SYSTEM                                                                          |
|    └── Settings [id: 'settings', icon: Settings]                                   |
+------------------------------------------------------------------------------------+
```

### 10.3 Exhaustive Card-by-Card, Widget-by-Widget & Modal Catalog Across All 38 Pages and Modules

FormEase Pro's user interface is structured around a modular card-and-panel hierarchy. Below is the complete catalog of every visual card, metric tile, filter, data table, action button, and modal dialog across every single module in the system.

---

#### Module 1: Dashboard (`app/src/pages/Dashboard.tsx`)
- **Header Metric & Greeting Strip**:
  - Teacher/Administrator greeting with real-time localized date and time stamp.
  - Day Offset Navigator: Browse forward/backward to inspect scheduled calendar events and attendance history without altering the system clock.
  - Active Academic Year and Term indicator pill (`S.Y. 2026-2027 | Term 1`).
- **Top 6 KPI Summary Cards**:
  1. *Total Enrolled Students Card*: Big-number tally of active learners with breakdown chips for Male count (blue) and Female count (pink).
  2. *Active Sections Card*: Total sections managed, distinguishing official advisory sections from subject teaching loads.
  3. *Total Subjects Offered Card*: Count of active learning areas in the curriculum catalog.
  4. *Today's Attendance Rate Card*: Real-time SVG circular progress ring indicating percentage of students marked present today vs. absent/late.
  5. *At-Risk Students (SARDO) Warning Card*: Amber/red glowing alert badge showing total learners with failing grades ($<75$) or $\ge 5$ consecutive unexcused absences. Clicking opens the `AtRiskStudentsModal`.
  6. *Top Achievers / Honor Qualifiers Card*: Emerald glowing badge tallying learners with General Averages $\ge 90.00$. Clicking opens the `TopAchieversModal`.
- **Interactive Visualization Panels**:
  - *Gender Distribution Donut Chart*: Interactive Recharts SVG donut displaying male-to-female ratio with hover tooltips and percentage metrics.
  - *Attendance Trend Graph Visualizer*: Multi-view card toggling between:
    - 30-Day Area Chart: Present vs. Absent vs. Tardy curve over time.
    - Calendar Heatmap View: Color-coded daily attendance density with national/school holiday markers.
  - *Grade Performance Histogram*: 5-tier bar chart showing learner distribution across DepEd proficiency levels (Did Not Meet Expectations, Fairly Satisfactory, Satisfactory, Very Satisfactory, Outstanding).
- **Quick Actions Launchpad Card**:
  - 1-click quick-jump buttons: *Encode E-Class Record*, *Generate SF9 Cards*, *Take Daily Attendance*, *Comprehensive Database Backup*, *Open School Forms Hub*.
- **Official DepEd Calendar Card**:
  - Mini interactive calendar feed displaying upcoming milestones across 8 color-coded categories (`holiday`, `suspension`, `exam`, `event`, `deadline`, `meeting`, `break`, `national`).
- **Urgent Bulletin & Announcements Feed Card**:
  - Administrative message stream with priority tags (`urgent`, `general`, `academic`, `event`), pin/unpin indicators, and dismissal controls.
- **Embedded Modals**:
  - `AtRiskStudentsModal`: Interactive searchable table of struggling learners showing LRN, Name, Section, Specific Failing Subject(s), Quarterly Grade, Teacher Name, and direct Parent Contact number with click-to-SMS action.
  - `TopAchieversModal`: Ranked leader board of honor students categorized into *With Highest Honors* ($98.00-100$), *With High Honors* ($95.00-97.99$), and *With Honors* ($90.00-94.99$).

---

#### Module 2: Classes & Sections Management (`app/src/pages/SectionsPage.tsx`)
- **Top Statistics Bar**: Cards for Total Sections, Total Class Advisers, Average Class Size, and SHS Strands Active.
- **Education Tier Filter Tabs**: `All Sections`, `Elementary` (Kinder to Grade 6), `Junior High School` (Grades 7 to 10), `Senior High School` (Grades 11 and 12).
- **Individual Section Cards**:
  - Section Name and Grade Level badge.
  - Assigned Class Adviser avatar and name.
  - Enrolled Learners Chip: Male tally + Female tally = Total count.
  - Curriculum Badge: `MATATAG Curriculum` vs. `K-12 Enhanced Basic Education`.
  - Senior High School Metadata Badges: Track (e.g. Academic, TVL), Strand (e.g. STEM, HUMSS, ABM), DO 017 Cluster (Cluster 1, 2, 3), and Special Program (Regular, STE, SPA, SPS, SPJ, SPFL, SPTVE, SSES).
  - Quick Actions: *Manage Curriculum / Taught Subjects*, *Edit Details*, *Delete Section*.
- **Modals**:
  - `SectionModal`: Configures Section Name, Grade Level, Room Number, Adviser selection from staff directory, SHS Track/Strand/Cluster, and Special Curricular Program tags.
  - `CurriculumManagerModal`: Drag-and-drop ordering of subjects taught in the section, subject addition from the library, custom elective definition, and Term Offering Schedule assignment (`all`, `1`, `2`, `3`, `'1,2'`, `'1,3'`, `'2,3'`, `'none'`).

---

#### Module 3: Enrollment Center & Promotion (`app/src/pages/EnrollmentCenterPage.tsx`)
- **Batch Promotion Engine Card**:
  - Source School Year dropdown (historical school years: `2025-2026`, `2024-2025`, etc.).
  - Source Grade Level selector (`Grade 1` through `Grade 11`).
  - Next Grade Level Calculator: Automatically computes the target grade (e.g. Grade 7 $\rightarrow$ Grade 8).
  - Target Destination Section dropdown: Filters available sections belonging to the target grade level.
  - Eligible Learners Counter: Scans historical records and counts qualified promoted students.
  - Primary Action Button: *Promote Eligible Learners to Active School Year* (moves enrollment records in bulk and creates school year tracking logs).
- **Returning Learner (Balik-Aral) Re-enrollment Card**:
  - 12-Digit LRN Search Input with live validation regex (`/^\d{12}$/`).
  - Live Student Profile Preview Chip: Displays student photo, full name, previous grade level, past section, and last recorded school year.
  - Destination Section Dropdown.
  - Action Button: *Enroll to Active Year* (re-activates student profile and links active enrollment record).
- **Enrollment Guidelines & DepEd Compliance Card**:
  - Notes on DO 54 s. 2016 transfer regulations, permanent LRN uniqueness, and retention of historical transcripts in SF10.

---

#### Module 4: Subject Library (`app/src/pages/SubjectsPage.tsx`)
- **Summary Metrics Strip**: Total Subjects, Core Subjects, Applied/Specialized Subjects, and Child Component Subjects (e.g. Music, Arts, PE, Health).
- **Search & Filter Controls**: Grade level selector, section filter, text search bar.
- **Database Deduplication & Health Card**:
  - Proactive scanner identifying duplicate variations (e.g. `"PE & HEALTH"`, `"PE and Health"`, `"Physical Education and Health"`).
  - 1-click canonical resolution action merging duplicates into standard DepEd nomenclature without corrupting historical student grades.
- **Subject Catalog Table / Cards**:
  - Columns: Subject Name, Subject Code, Grade Level, Component Weights (WW%, PT%, QA%), Unit Credits (SHS), Term Offerings, Reorder controls (▲/▼).
- **Modals**:
  - `SubjectModal`: Configures Subject Name, DepEd Code, Grade Level, WW weight, PT weight, QA weight, SHS Unit credits, Component toggle, and Parent Subject selection for composite subjects (e.g. nesting under MAPEH).

---

#### Module 5: Electronic Class Record — JHS & Elementary (`app/src/pages/EClassRecord.tsx`)
- **Header Selection Bar**: Section dropdown, Subject dropdown, Term/Quarter tabs (Term 1, Term 2, Term 3 / Q1 to Q4), Teacher Name, and real-time IndexedDB persistence indicator.
- **Highest Possible Score (HPS) Sticky Row**:
  - Top row inputs for defining maximum scores across Written Works (WW 1–10), Performance Tasks (PT 1–10), and Quarterly Assessment (QA).
- **Male Learners Scoring Table**:
  - Frozen Columns: Student Row Number, 12-digit LRN, Learner Legal Name (`LAST, FIRST, MIDDLE`).
  - Scrollable Input Cells: WW 1–10 scores, WW Total, Percentage Score (PS), Weighted Score (WS); PT 1–10 scores, PT Total, PS, WS; QA Raw Score, PS, WS; Initial Grade; Transmuted Quarterly Grade.
- **Female Learners Scoring Table**:
  - Symmetrical structure separated by an official DepEd pink divider banner.
- **Live Class Analytics Panel**:
  - Passing percentage, Class Average, Highest Grade, Lowest Grade, Quality Index, and live Recharts grade distribution bar chart.
- **Action Toolbar**:
  - *Sync to Consolidated Grades*: Pushes computed grades to master grade records while safeguarding manual overrides.
  - *Export Official DepEd Excel (ECR)*: Triggers direct OpenXML injection into the official DepEd Excel template without corrupting macros or formulas.
  - *Print Class Record*: Vector-rendered print layout.

---

#### Module 6: Senior High School E-Class Record (`app/src/pages/ShsEClassRecord.tsx`)
- **Dedicated SHS Engineering (247 KB component)**:
  - Supports both **SSHS DO 017 Grade 11 Trimester system** and **DepEd Standard Grade 12 Semester system**.
- **Grade 12 Three-Component Examination Panel**:
  - Implements DO 8 s. 2015 / DepEd G12 Exam formula: Short Test 1 (30%), Short Test 2 (30%), Term Exam (40%).
- **Subject Category Weight Badges**:
  - Core Subjects (WW 25%, PT 50%, QA 25%).
  - Applied/Specialized Subjects (WW 25%, PT 45%, QA 30% or WW 35%, PT 40%, QA 25% for TVL/Immersion).
- **Assessment Scoring Matrix**:
  - 10 Written Works + 10 Performance Tasks + Multi-component Exam inputs.
- **Interactive Crosshair Navigation** (`useTableCrosshair`):
  - Visual crosshair row/column highlighting ensuring error-free grade encoding across large spreadsheets.
- **SHS Unit-Weighted Live Analytics**:
  - Real-time grade distribution chart (Recharts) categorizing students into Outstanding, Very Satisfactory, Satisfactory, Fairly Satisfactory, and Failing.
- **Modals**:
  - `SubjectEnrollmentModal`: Manages track/strand-specific elective enrollments for individualized SHS student schedules.
  - `ExcelExportModal`: Direct OpenXML export via `exportSSHSEClassRecord` or `exportSHSG12EClassRecord`.

---

#### Module 7: Master Grade Management / Consolidated Grades (`app/src/pages/ConsolidatedGradesPage.tsx`)
- **Master Cross-Tabulation Ledger (328 KB, 5,333 lines)**:
  - Rows for each student in the section, sorted by gender (Male first, Female second) then alphabetically by last name.
  - Columns for every official subject in the section's curriculum.
  - Sub-columns for Term 1, Term 2, Term 3 (or Q1, Q2, Q3, Q4), Final Rating, and Remarks (Passed / Failed).
- **Automatic Composite Subject Resolution**:
  - Automatically merges Music, Arts, PE, and Health into a single consolidated MAPEH grade.
  - Merges Effective Communication & Mabisang Komunikasyon sub-components.
- **General Average Column Engine**:
  - Elementary / JHS: Unweighted arithmetic mean rounded to nearest integer (DepEd standard).
  - Senior High School: Unit-weighted average based on subject credit units.
- **Term Lock & Protection Switches**:
  - Administrative toggle locks for Term 1, Term 2, Term 3, preventing accidental alterations once grades are submitted.
- **Interactive Descriptors**:
  - Dynamic display toggling between numeric grades and DepEd descriptors (A/B/C/D/E for Key Stage 1 or Word Descriptors for Key Stages 2–4).
- **Action Toolbar & Modals**:
  - `Lock` / `Unlock` Quarter Controls.
  - `BatchSyncModal`: Pulls final grades from all subject E-Class Records into the master ledger with conflict reporting.
  - `ExcelImportModal`: Imports raw teacher grade sheets using `safe-workbook-reader` and auto-maps scores to student LRNs.
  - `autoRepairSectionCurriculum`: 1-click resolution for orphaned subjects or misaligned section curricula.

---

#### Module 8: Student Information System (`app/src/pages/StudentsPage.tsx`)
- **Filter & Search Toolbar**: Search by LRN, First Name, Last Name; Filter by Section, Gender, 4Ps CCT Beneficiary, Indigenous People (IP), Transferee, Balik-Aral.
- **Action Toolbar**: *Add New Learner*, *Import DepEd LIS (Excel/CSV)*, *Export Masterlist*, *Print Student Directory*.
- **Student Roster Cards / Data Table**:
  - Photo thumbnail, 12-digit LRN badge, Legal Full Name, Sex chip, Birthdate, Computed Age (as of BoSY), Section badge, Parent Contact Number, Quick Action menu.
- **Student Form Modal (5 Dedicated Tabs)**:
  - *Tab 1: Personal Demographics*: LRN, Last Name, First Name, Middle Name, Name Extension (Jr., III), Sex, Birthdate, Computed Age as of June 1, Residential Address, Mother Tongue, IP Group, Religion.
  - *Tab 2: Family & Guardian Info*: Father's Name, Mother's Maiden Name, Guardian Name, Relationship, Emergency Contact Number, 4Ps CCT Household ID.
  - *Tab 3: Health & Nutritional Assessment*: Weight (kg), Height (m), Computed BMI, BMI Nutritional Status, Height-for-Age (HFA) Stunting Status.
  - *Tab 4: Eligibility & Credentials*: Kindergarten completion, ECCD checklist, Elementary completion, JHS Moving-Up credentials, PEPT/ALS certificate details, Examination Center.
  - *Tab 5: Requirements Checklist*: Toggle switches for PSA Birth Certificate, Form 138/SF9, Form 137/SF10, Good Moral Certificate, Affidavit of Undertaking, Term Report Cards.

---

#### Module 9: Daily Attendance & Hardware Scanner (`app/src/pages/DailyAttendancePage.tsx`)
- **Daily Roll Call KPI Cards**: Total Enrolled, Present (emerald), Absent (red), Late (amber), Cutting Class (violet), Excused (blue).
- **Date & Calendar Navigator**: Day picker with quick jump to previous/next school day.
- **Section Selector**: Advisory class default, specific section picker, or all sections.
- **Input Modes**:
  1. *Manual One-Click Roster*: Rapid roll-call buttons (`P`, `A`, `L`, `CC`, `EX`) separated by male/female rosters.
  2. *USB Barcode / QR Wedge Scanner*: Automatic keyboard-listener buffer capturing hardware scanner inputs.
  3. *Integrated WebCam Scanner*: Live video viewfinder utilizing `jsQR` with audio feedback chime upon successful scan.
  4. *Phone Attendance Portal*: Launches `PhoneAttendanceModal` generating a local Wi-Fi pairing QR code for the mobile attendance app.
- **Parent SMS Trigger**: Automatically initiates parent SMS notification upon marking a student Absent or Late.
- **30-Day Attendance Trend Chart**: Recharts area chart showing Present vs. Absent curves over time.
- **SF2 Synchronization**: Automatically aggregates daily roll-call marks into the monthly SF2 register.

---

#### Module 10: Monthly Attendance Register / SF2 (`app/src/pages/AttendancePage.tsx`)
- **Official DepEd SF2 Register (150 KB, 2,545 lines)**:
  - Month Selector: June, July, August, September, October, November, December, January, February, March, April.
  - Day Columns matching official DepEd 2026–2027 school calendar days (M-T-W-TH-F).
  - Status Codes: Blank = Present, `X` = Absent, `T` = Tardy, `CC` = Cutting Class, `E` = Excused, `S` = Suspended.
  - Monthly Summary Columns: Total Absences for Month, Total Tardiness for Month, Remarks / Status Dropdown (Transferred Out, Dropped Out, NLPA).
- **Official Bottom Summary Table**:
  - *(a) Enrollment as of 1st Friday of School Year* (Male, Female, Total).
  - *(b) Late Enrollees during the month*.
  - *(c) Registered Learner (Cumulative)*.
  - *(d) Transferred In*.
  - *(e) Transferred Out*.
  - *(f) Dropped Out / NLPA*.
  - *(g) Total for end of the month*.
  - *(h) Average Daily Attendance (ADA)* = Total Attendance / Total Class Days.
  - *(i) Percentage of Attendance* = $(\text{ADA} / \text{Registered Learners}) \times 100$.
  - *(j) Consecutive Absences ($\ge 5$ days)*: Automated SARDO flagging.
- **Export Toolbar**: Direct export to official DepEd SF2 Excel file (`exportSF2Excel`) and Vector Print preview.

---

#### Module 11: School Forms Hub (`app/src/pages/SchoolFormsPage.tsx`)
A centralized launchpad featuring 10 dedicated interactive form cards with live encoding progress badges:
1. **SF2 Daily Attendance Card**: Daily presence, tardiness, and monthly absenteeism tracking.
2. **SF5 Report on Promotion Card**: End-of-school-year promotion, conditional, and retention rosters.
3. **SF6 Summarized Report Card**: School-wide statistical aggregation of promotion counts per grade level.
4. **SF8 Health & Nutrition Card**: BMI, Height-for-Age, and nutritional status tracking.
5. **SF9 Report Card (Form 138) Card**: Progress report cards with live encoding progress percentage ring.
6. **SF10 Permanent Record (Form 137) Card**: Complete scholastic transcripts for elementary, JHS, and SHS.
7. **Name Tag Generator Card**: 6 customizable printable name badge templates.
8. **Learner's Individual Record (LIR) Card**: Comprehensive folio with grade tracking and attendance.
9. **Temporary Grade Slip (TGS) Card**: Compact 2-per-page or 4-per-page grade slips for transferees.
10. **PACE Form (Grade 1) Card**: MATATAG early grade competency assessment with Descriptors A–E.

---

#### Module 12: School Form 9 Studio / Form 138 (`app/src/pages/SF9Page.tsx`)
- **Student Carousel Bar**: High-speed thumbnail carousel for rapid learner switching.
- **Card Preview Canvas**:
  - *Front Cover*: DepEd headers, Division logo, School seal, Learner demographics, 11-month attendance table, Certificate of Transfer.
  - *Back Cover*: Learning areas matrix, Quarter/Term grades, Final Rating, General Average, DepEd Observed Core Values ratings (*Maka-Diyos, Makatao, Makakalikasan, Makabansa*), Teacher narrative remarks.
- **Signature & Layout Controls**:
  - Class Adviser & Principal signature toggles, size sliders, and vertical alignment offsets.
  - Blank Pre-Printed Stock Mode: Toggles hiding borders or student info for printing onto official pre-printed DepEd card stock.
- **Batch Export Engine**: Export Active Student (Excel/PDF), Batch Export All Cards to ZIP, Direct Vector Print.

---

#### Module 13: School Form 10 Studio / Form 137 (`app/src/pages/SF10Page.tsx`)
- **Scholastic Transcript Layouts**: Official SF10-ES, SF10-JHS, and SF10-SHS legal document formats.
- **Academic History Multi-Year Matrix**: Records past school years, school IDs, receiving/origin advisers, general averages, and promotion decisions.
- **Eligibility & Transfer Credentials Panel**: Kindergarten certificate, Elementary certificate, JHS moving-up certificate, PEPT/ALS rating, and official transfer release stamps.
- **Remedial Instruction Panel**: Records remedial learning areas, reconverted marks, and revised promotion decisions.

---

#### Module 14: School Form 5 — Report on Promotion (`app/src/pages/SF5Page.tsx`)
- **Promotion Status Roster**:
  - Categorizes each student into *PROMOTED* (General Average $\ge 75$ and passed all subjects), *CONDITIONAL* (failed in 1 or 2 subjects), or *RETAINED* (failed in 3 or more subjects).
- **Summary Table by Level of Proficiency**:
  - Tally of learners across 5 proficiency tiers partitioned into Male, Female, and Total:
    - Did Not Meet Expectations ($<75$).
    - Fairly Satisfactory ($75-79$).
    - Satisfactory ($80-84$).
    - Very Satisfactory ($85-89$).
    - Outstanding ($90-100$).
- **Incomplete Learning Areas Table**: Details deficient subjects for conditional learners with remedial requirements.
- **Certification Block**: Official Division Checking Committee (DCC) and School Head certification signature blocks.

---

#### Module 15: School Form 6 — Summarized Report on Promotion (`app/src/pages/SF6Page.tsx`)
- **Consolidated School-Wide Matrix**: Aggregates SF5 promotion metrics across all sections and grade levels in the school.
- **Statistical Aggregation Panels**:
  - Total Promoted (Male, Female, Total).
  - Total Conditional (Male, Female, Total).
  - Total Retained (Male, Female, Total).
  - Overall Proficiency Bracket Distribution for the entire institution.
- **Export Engine**: Direct export to official DepEd SF6 Excel template and Printable Executive Summary.

---

#### Module 16: School Form 8 — Basic Health & Nutrition (`app/src/pages/SF8Page.tsx`)
- **Learner Anthropometric Roster**:
  - Student Name, Birthdate, Date of Assessment, Age, Weight (kg), Height (m), Height Squared ($m^2$), Computed BMI.
- **Nutritional Status Categorization**:
  - BMI Status: Severely Wasted, Wasted, Normal, Overweight, Obese.
  - Height-for-Age (HFA) Status: Severely Stunted, Stunted, Normal, Tall.
- **Summary Statistical Table**: Baseline (BoSY) vs. Endline (EoSY) comparison matrix partitioned by gender.
- **Export Action**: Direct export to official DepEd SF8 Excel workbook.

---

#### Module 17: Learner Information Record / LIR (`app/src/pages/LIRPage.tsx`)
- **Comprehensive Learner Folio (980 lines)**:
  - Section, Subject, and Learner Selector.
  - Paper Size picker: A4, Letter, Folio.
  - Fill Color and Outline Color theme pickers.
- **Embedded LIRRenderer Canvas**:
  - Student photo, LRN, legal demographics.
  - Quarterly / Trimester subject performance breakdown with raw assessment totals.
  - Monthly attendance summary.
  - DepEd Core Values evaluation ratings.
  - Teacher behavioral notes and pastoral counseling remarks.
- **Bulk LIR Generation Modal**:
  - Student checkbox selection list, search bar, progress bar, and chunked PDF export engine.

---

#### Module 18: Temporary Grade Slip / TGS (`app/src/pages/TemporaryGradeSlipPage.tsx`)
- **DO 54 s. 2016 Compliant Grade Slip (1,782 lines)**:
  - Multi-up print layout: 2-up per page (Letter, A4, Folio).
  - DepEd Official Header with Republic of the Philippines seal and School ID.
  - Learner Profile band (Name, LRN, Section, Track/Strand, School Year).
  - Learning Areas Table: Subjects, Term/Quarter grades, Final Rating, Remarks.
  - General Average row.
  - Official DepEd Certification Clause: "This temporary grade slip is issued upon request for reference/transfer purposes..."
  - Signature blocks for Class Adviser and School Principal.
- **Toolbar Actions**: Zoom slider, Section selector, Print button, and *Reconcile / Refresh Grades* action.

---

#### Module 19: PACE Form Studio — Grade 1 MATATAG (`app/src/pages/PaceFormPage.tsx`)
- **MATATAG Early Grade Competency Assessment (959 lines)**:
  - Form Types:
    1. `reading`: Reading and Literacy domain.
    2. `language`: Language domain.
    3. `math`: Mathematics domain.
    4. `gmrc-makabansa`: GMRC and Makabansa combined domain.
    5. `sf9`: Direct SF9 Grade 1 MATATAG integration.
- **Interactive Sub-Competency Rating Grid**:
  - Detailed criteria evaluation using PACE Descriptors:
    - `A` = Advanced.
    - `B` = Proficient.
    - `C` = Approaching Proficiency.
    - `D` = Developing.
    - `E` = Beginning.
- **All-in-One Master Section Excel Import/Export**:
  - Integrates `exportGrade1AllInOneSectionMasterToExcel` and `MasterExcelImportModal`.
- **Live Vector PDF Canvas**: Embedded `@react-pdf/renderer` rendering exact DepEd Grade 1 PACE sheets.

---

#### Module 20: Institute Profile & Branding Studio (`app/src/pages/InstitutePage.tsx`)
- **Institutional Identity Card**: School ID, Official School Name, DepEd Region, Division, District, School Head Name, Designation.
- **Official Logos & Seals Studio**: Drag-and-drop uploader for School Logo and DepEd Division Logo with background transparency inspector.
- **Specimen Digital Signatures Studio**:
  - HTML5 Canvas signature drawing pad for School Principal and Class Adviser with Smooth, Clear, and PNG export controls.
- **Curricular Offerings Checklist**: Selectable badges for Kindergarten, Elementary, JHS, and SHS.

---

#### Module 21: School Calendar & Event Management (`app/src/pages/CalendarPage.tsx`)
- **Interactive Calendar Grid (710 lines)**:
  - Month Navigator (prev/next, today jump) with multi-event indicator dots.
  - Event Category Filter Tabs: `All`, `Holiday`, `Suspension`, `Exam`, `Event`, `Deadline`, `Meeting`, `Break`, `National`.
- **Day Event List Panel**: Detailed cards for events on the selected date with edit and delete controls.
- **Add / Edit Event Modal**: Title, Date, Category type, Description.
- **Seed Official DepEd Calendar Button**: Resets or updates calendar events to the official DepEd 2026–2027 calendar (`OFFICIAL_CALENDAR_2026_2027`).
- **Parent SMS Event Broadcast Modal**:
  - Dispatches SMS event reminders to all parents (e.g. suspension, exam dates) using dynamic templates (`{school_name}`, `{student_name}`).

---

#### Module 22: Announcements & Parent SMS Gateway (`app/src/pages/AnnouncementsPage.tsx`)
- **Internal Announcements Card Stream (1,110 lines)**:
  - Pin / Unpin high-priority announcements.
  - Types: General, Urgent, Academic, Event, Holiday.
  - Cloud Synchronization status badge.
- **Login Screen Broadcast Banner Card**:
  - Configures urgent text banners displayed across the user login screen for all teachers and staff.
- **Parent SMS Gateway Broadcast Engine**:
  - Category Presets: Weather suspension, Report card distribution, PTA meeting, Exam schedules.
  - Audience Selector: All Sections, specific section, or manual learner picker.
  - Dynamic template interpolator (`{school_name}`, `{student_name}`).
  - Live Delivery Progress Bar.
  - SMS Broadcast History Table: Date, Target Count, Sent, Failed, Section.

---

#### Module 22B: Unified Calendar & Announcements Switcher (`app/src/pages/CalendarAnnouncementsPage.tsx`)
- **Seamless Segmented Interface**:
  - Provides a cohesive dual-tab segmented control switching instantly between the **School Calendar** and the **Announcements** feed without page reload.
  - Preserves view context and selected month when toggling between event scheduling and SMS broadcasting.
  - Remembers user's tab choice per view so navigating from Dashboard shortcuts lands directly on the intended tab.

---

#### Module 23: Reports & Analytics Hub (`app/src/pages/ReportsPage.tsx`)
Features 6 dedicated sub-report modules across 3,444 lines:
1. **Quarterly / Trimester Summaries**: Term 1, Term 2, Term 3, and Overall general performance metrics.
2. **Subject Performance & MPS**: Mean Percentage Score (MPS) calculations per subject with Recharts comparative radar and bar charts.
3. **Learner Progress Analytics**: Multi-year growth curves and proficiency attainment tracking.
4. **SARDO At-Risk Students Early Warning**:
   - Identifies learners failing $\ge 1$ subject or accumulating $\ge 5$ consecutive unexcused absences.
   - Switchable between Grouped (by section) and Detailed (individual learner diagnosis) views.
5. **DO 36 s. 2016 Honor Roll & Awards Evaluation**:
   - Academic Awards: With Highest Honors, With High Honors, With Honors, Subject Proficiency.
   - Classroom Awards: Character Traits (*Maka-Diyos, Makatao, Makakalikasan, Makabansa*), Perfect Attendance.
   - Special Recognition: Leadership Award, Research/Innovation Project, Work Immersion.
6. **Requirements Checklist**:
   - Tracks submission of PSA Birth Certificate, Form 138/SF9, Form 137/SF10, Good Moral Certificate, Basic Education Enrollment Form (BEEF), ECCD Checklist, and Affidavit of Undertaking.

---

#### Module 24: Student ID Generator Studio (`app/src/pages/StudentIDGeneratorPage.tsx`)
- **Generation Mode Toggle**: Individual Mode vs. Bulk Section Issuance Mode.
- **Interactive Card Canvas (1,123 lines)**:
  - Real-time Front and Back canvas previews with zoom scaling slider (100% to 200%).
- **Left Collapsible Sidebar**:
  - Built-in Photo Cropper: Webcam capture or file upload with circular/rectangular cropping.
  - Custom Background Artwork Uploader.
  - Digital Signature Pad & PNG upload for Principal and Adviser signatures.
- **Right Collapsible Sidebar (`IdTemplateSettings`)**:
  - Orientation: Portrait vs. Landscape (CR80 standard $85.6\,\text{mm} \times 53.98\,\text{mm}$).
  - DepEd branding headers, School ID, School Name.
  - Front fields: Photo, LRN, Full Name, Grade/Section, Track/Strand, Barcode Code128, QR Code.
  - Back fields: Emergency Contact, Guardian Name, Address, DepEd Learner Oath, Adviser Signature.
- **Print & Export Engine**:
  - Sheet Layout: 8-up per A4 or Letter sheet with alignment crop marks.
  - Direct Vector PDF export or Electron Direct Print.

---

#### Module 25: Name Tag Generator Studio (`app/src/pages/NameTagPage.tsx`)
- **6 Premium Design Templates**: `Classic`, `Modern`, `Pro`, `Premium`, `Organic`, `Artistic`.
- **5 Color Themes**: `Blue`, `Emerald`, `Purple`, `Amber`, `Rose`.
- **Section Selector**: Grouped into Elementary, Junior High School, and Senior High School.
- **A4 Multi-Card Sheet Layout**:
  - Exact 2-column $\times$ 4-row grid (8 tags per A4 sheet, each $90\,\text{mm} \times 55\,\text{mm}$).
- **Card Elements**: School Name, School Logo, DepEd Seal, Large Readable Learner Name, LRN, Section, Adviser Name, Emergency Contact.

---

#### Module 26: DLL & Lesson Plan Generators (`app/src/pages/OnlineGeneratorsPage.tsx`)
- **9 Specialized Generator Categories (644 lines)**:
  1. *Daily ILAW*: Daily lesson logs with separate sections for each instructional day.
  2. *Weekly ILAW*: Weekly compiled instructional flow under the ILAW framework.
  3. *Semi-Detailed ILAW*: Activity-Analysis-Abstraction-Application (4A's) model.
  4. *Weekly MATATAG Lesson Exemplar*: DepEd MATATAG curriculum lesson flow.
  5. *Semi-Detailed*: Standard K-12 semi-detailed lesson preparation.
  6. *Trimester (3-Term)*: Lesson planning structured around the 3-term calendar system.
  7. *Detailed Lesson Plan (DLP)*: Comprehensive instructional guide with teacher-student dialogs.
  8. *Looker Studio K-12 Exemplars*: Embedded Looker Studio dashboard for browsing compiled exemplars.
  9. *AI Presentation & Slide Deck Generator*: Gemini AI prompt engine generating slide-by-slide classroom presentation decks.
- **Offline `LessonPlannerTemplates` Component**:
  - Embedded offline lesson plan prompt generator with customizable grade level, subject, learning competency, and exportable lesson text.

---

#### Module 27: Games & Interactive Classroom Tools (`app/src/pages/GamesAndToolsPage.tsx`)
20 dedicated interactive classroom widgets across 626 lines:
1. **Bomb Pass / Hot Potato**: Ticking bomb timer with animated explosion sound effects for recitation.
2. **Quiz Show / Jeopardy**: Interactive category quiz board with $100-$500 point values and team score counters.
3. **Save the Balloon**: Kid-friendly letter guessing vocabulary game.
4. **Crossword Puzzle Generator**: Creates, solves, and prints custom interactive crossword puzzle boards.
5. **Interactive Whiteboard**: Freehand drawing canvas, diagram tools, and PNG export.
6. **Wheel of Names**: Physics-based colorful spinning wheel with sound effects for random student selection.
7. **Noise Detection**: Web Audio API ambient microphone monitor with real-time visual meter and alerts.
8. **Timer & Stopwatch**: Full-screen presentation countdown timer and stopwatch.
9. **Unit Converter**: Converts length, area, mass, data, temperature, volume, time, and speed.
10. **Bouncing Words**: Floating physics game where vocabulary words bounce off walls.
11. **Group Yourself**: Randomly partitions students from any class roster into balanced teams.
12. **Quick Team Splitter**: Splits names into custom-labeled teams.
13. **Classroom Scoreboard**: Multi-team points counter with sound effects for classroom competitions.
14. **Study Flashcards**: Interactive double-sided flip flashcards for lesson drills.
15. **Classroom Soundboard**: Sound effects (applause, buzzer, drum roll, cheer) for student feedback.
16. **Word Search Creator**: Generates and solves interactive custom word search puzzle grids.
17. **Raffle Fishbowl**: Animated raffle jar for mystery student rewards.
18. **Tug of War**: Team recitation face-off battle game.
19. **3D Coin Flip**: Realistic 3D animated coin flip for heads/tails decisions.
20. **3D Dice Roller**: Rolls up to 6 animated 3D dice for math and probability lessons.

---

#### Module 27B: Official Certificate Studio — Graduation, Honors & Moving-Up (`app/src/pages/CertificateGeneratorPage.tsx`)
- **DepEd Certificate Generation Engine (84 KB, 1,270 lines)**:
  - Supports 4 official certificate cycles:
    1. `T1`: Academic Excellence Award for Term 1 (*Akademikong Kahusayan para sa Term 1*).
    2. `T2`: Academic Excellence Award for Term 2 (*Akademikong Kahusayan para sa Term 2*).
    3. `T3`: Academic Excellence Award for Term 3 (*Akademikong Kahusayan para sa Term 3*).
    4. `EOSY`: End of School Year Academic Excellence Award, Graduation Diploma, and Moving-Up Certificate.
- **Bilingual DepEd Legal Typography**:
  - Standard DepEd bilingual headers with Filipino text primary and English subtitle in parentheses:
    - *Republika ng Pilipinas / Kagawaran ng Edukasyon*
    - *Katibayan ng Akademikong Kahusayan (Certificate of Academic Excellence)*
    - Official certification body text: *"Ipinagkaloob kay [Learner Name] na may LRN [LRN] para sa natatanging pagganap..."*
- **Layout & Seal Studio**:
  - Dimensions: Standard Letter landscape ($11 \times 8.5\text{ inches}$ / $279.4 \times 215.9\text{ mm}$) vector-rendered via `@react-pdf/renderer` or high-DPI HTML5 canvas.
  - Border Designs: Classic Baroque, Modern Geometric, Certificate Gold, Royal Filigree.
  - Typography Pairings: Cinzel, Pinyon Script, Playfair Display, Great Vibes, Montserrat.
  - Gold Foil Seal Studio: Embeds customizable SVG vector seals with ribbons and school coat-of-arms.
- **Batch Processing & Multi-Award Scanner**:
  - *Academic Excellence Scanner*: Automatically parses class records and identifies students qualifying for *With Highest Honors* (98–100), *With High Honors* (95–97.99), and *With Honors* (90–94.99).
  - *Subject Proficiency Awards*: Scans and isolates learners achieving the highest grade ($\ge 90$) in each distinct learning area.
  - *Custom Special Citations*: Conduct Awards, Leadership Award (DO 36 s. 2016), Research Capstone Innovation Award, and Work Immersion Excellence.
- **Signatory Controls**:
  - Independent toggles for Class Adviser and School Principal specimen signatures with transparency check and vertical alignment offset sliders.
  - Batch high-resolution PDF download with multi-page bundling into a single printable document.

---

#### Module 28: System Settings & Backup Vault (`app/src/pages/SettingsPage.tsx`)
Features 8 comprehensive tabs across 4,039 lines:
- **Tab 1: General**: Theme toggle (Light, Dark, System), Animation enable/disable toggle, Language/locale, School Profile summary, School Year selector.
- **Tab 2: Account**: User profile, Change Password, Role display, Master password safeguard (`formease`), License & Activation status chip.
- **Tab 3: Backups**:
  - *Comprehensive Backup*: Encrypted AES-256-GCM or plaintext JSON export with embedded SHA-256 checksums.
  - *Master Excel Rescue Backup* (`downloadMasterExcelBackup`): Exports every database table (students, sections, subjects, grades, attendance) into a multi-sheet Excel workbook.
  - *CSV Store Dump* (`exportAllDirectDatabaseStoresToCSV`): Individual CSV files for all database stores.
  - *Automated Backup Engine* (`AutoBackupManager`): 30-minute background heartbeat backup, pre-logout backup, retention policies (7, 14, 30 days, or unlimited).
  - *Snapshot Inspector & Time Machine Restore*: Safe preview dry-run with `SnapshotPreviewBanner` before restoring snapshots.
- **Tab 4: Cloud Sync (Google Drive)**:
  - Integrates `CloudSyncService`: Google Drive OAuth token, automated folder creation, 2-way cloud snapshot replication.
  - Cloud backup history list and 1-click cloud restore.
- **Tab 5: SMS Gateway (`SmsGatewaySettings`)**:
  - Supports hardware USB GSM Modem (AT commands over COM port) and HTTP Webhook API (Semaphore, Twilio, PhilSMS).
  - Parent alert toggles for Absences, Tardiness, Report Card release, and Emergency suspensions.
- **Tab 6: Maintenance & Diagnostic Engine (`DiagnosticEngine`)**:
  - Proactive scanner for orphaned grades, ghost student records, duplicate LRNs, and schema integrity errors.
  - 1-click Auto-Repair / Fix Anomalies.
  - Emergency Database Purge guarded by `TextInputConfirmationModal` (requiring user to type the school name to confirm).
- **Tab 7: Version History (`VersionHistoryTimeline`)**:
  - Detailed changelog tracking development history from v1.0 to v3.5.x.
- **Tab 8: About & Legal Compliance**:
  - DepEd legal compliance declarations, terms of service, and privacy policy.

---

#### Module 29: About FormEase Pro & Legal Hub (`app/src/pages/AboutPage.tsx`)
- **Tab 1: App Architecture**: DepEd compliance documentation (DO 8 s. 2015, DO 17 s. 2026, DO 10 s. 2024 MATATAG), Direct OpenXML injection explanation, AES-GCM encrypted local vault, offline-first design.
- **Tab 2: Innovator Profile**: Lead Developer credentials (Emerson Galano - Google Certified Educator Level 1 & 2, Gemini Certified, Adobe Creative Educator L1, Cisco Modern AI, DepEd ICT Lead).
- **Embedded `LegalDocsModal`**: Full Terms of Service and Data Privacy Policy aligned with RA 10173.

---

#### Module 30: Single-User Management (`app/src/pages/UsersPage.tsx`)
- Displays current local authenticated user details (Display Name, Email, Role: Administrator or Teacher), single local account architecture declaration, and RBAC permissions summary.

---

#### Module 31: Authentication, Setup & Hardware Activation Screens
1. **`LoginPage.tsx`**:
   - DepEd blue gradient branding with school logo.
   - Username/Email and Password inputs.
   - Master Password bypass fallback (`formease`).
   - Urgent Administrative Broadcast Banner modal integration.
2. **`AccountSetupPage.tsx`**:
   - First-run wizard triggered when no local administrator exists.
   - Configures Administrator Name, Email, Password, and School Name.
3. **`ActivationPage.tsx`**:
   - Hardware-bound Machine ID reader (`getMachineId`).
   - License Key input with offline validation or 14-day grace trial activation.
4. **`MobileAttendancePage.tsx`**:
   - Standalone mobile web portal designed for smartphone screens.
   - Camera QR scanner for student ID gate check-in with real-time desktop synchronization.

---

#### Module 32: Global Modals & System Services
- **`UpdateCenterModal`**: Staged software update manager with release notes and auto-restart.
- **`ReconciliationReportModal`**: Post-update schema migration and database reconciliation report.
- **`GradeSyncInspectorModal`**: Deep audit inspector comparing E-Class Record scores with Consolidated Grades.
- **`ProfileDiffModal`**: Side-by-side comparison of local learner profiles against imported spreadsheet values.
- **`GoogleDriveOnboardingModal`**: Step-by-step setup guide for connecting Google Drive cloud sync.
- **`ClosingSyncOverlay`**: Modal dialog executing automated full database backup before closing the Electron application.
- **`BroadcastBannerModal`**: Global banner alerting teachers of critical administrative memos.
- **`AutoBackupManager`**: Background worker running automated backups every 30 minutes.
- **`IncrementalBackupService`**: Change-log tracker capturing atomic database modifications.
- **`SnapshotPreviewBanner`**: Sticky top banner indicating that the user is previewing a historical snapshot before confirming restore.

---

## 11. QUICK REFERENCE: CRITICAL CELL COORDINATES ACROSS OFFICIAL TEMPLATES

### 11.1 Grade 1 SF9 (`G1 School Form 9 with PACE Form (SY 26-27).xlsx`)
- **School Metadata**: School ID: `C5` | School Name: `H5` | District: `C6` | Division: `H6` | Region: `C7`
- **Learner Profile**: Learner Name: `D9` | LRN: `D10` | Age: `D11` | Sex: `H11` | Grade & Section: `D12` | School Year: `H12`
- **Learning Areas (Sheet: `SF9 BACK`)**:
  - Language: Row `17` (Term 1: `E17`, Term 2: `F17`, Term 3: `G17`, Final: `H17`)
  - Reading and Literacy: Row `18` (Term 1: `E18`, Term 2: `F18`, Term 3: `G18`, Final: `H18`)
  - Mathematics: Row `19` (Term 1: `E19`, Term 2: `F19`, Term 3: `G19`, Final: `H19`)
  - Makabansa: Row `20` (Term 1: `E20`, Term 2: `F20`, Term 3: `G20`, Final: `H20`)
  - GMRC: Row `21` (Term 1: `E21`, Term 2: `F21`, Term 3: `G21`, Final: `H21`)
  - **PACE Descriptors**: Evaluated as `A` (Advancing), `B` (Benchmarking), `C` (Connecting), `D` (Developing), `E` (Emerging)
- **Attendance Table**: Rows `32` to `34` (Months: June to April, Days Present, Days Absent, Total School Days)

---

### 11.2 Junior High School SF9 (`G4-10  School Form 9 (SY 26-27).xlsx`)
- **School Metadata**: School Name: `D4` | School ID: `J4` | District: `D5` | Division: `J5` | Region: `D6`
- **Learner Profile**: Student Name: `D8` | LRN: `J8` | Grade & Section: `D9` | Track/Strand: Hidden/Removed
- **Learning Areas (Sheet: `SF9 BACK`)**:
  - Filipino: Row `18` (Q1: `E18`, Q2: `F18`, Q3: `G18`, Q4: `H18`, Final: `I18`, Remarks: `J18`)
  - English: Row `19` (Q1: `E19`, Q2: `F19`, Q3: `G19`, Q4: `H19`, Final: `I19`, Remarks: `J19`)
  - Mathematics: Row `20` (Q1: `E20`, Q2: `F20`, Q3: `G20`, Q4: `H20`, Final: `I20`, Remarks: `J20`)
  - Science: Row `21` (Q1: `E21`, Q2: `F21`, Q3: `G21`, Q4: `H21`, Final: `I21`, Remarks: `J21`)
  - Araling Panlipunan (AP): Row `22` (Q1: `E22`, Q2: `F22`, Q3: `G22`, Q4: `H22`, Final: `I22`, Remarks: `J22`)
  - Edukasyon sa Pagpapakatao (EsP) / Values Education: Row `23` (Q1: `E23`, Q2: `F23`, Q3: `G23`, Q4: `H23`, Final: `I23`, Remarks: `J23`)
  - TLE / EPP: Row `24` (Q1: `E24`, Q2: `F24`, Q3: `G24`, Q4: `H24`, Final: `I24`, Remarks: `J24`)
  - MAPEH Composite: Row `25` (Q1: `E25`, Q2: `F25`, Q3: `G25`, Q4: `H25`, Final: `I25`, Remarks: `J25`)
    - Music: Row `26` (Indented child row)
    - Arts: Row `27` (Indented child row)
    - Physical Education: Row `28` (Indented child row)
    - Health: Row `29` (Indented child row)
  - **General Average**: Row `30`, Column `I30` | Remarks: `J30`

---

### 11.3 Senior High School Grade 11 Academic SF9 (`G11 Academic School Form 9 (SY 26-27).xlsx`)
- **Metadata**: School ID: `C5` | School Name: `H5` | Track: `D11` | Strand/Cluster: `H11` | LRN: `D10` | Student: `D9`
- **Core & Elective Schedule**:
  - Term 1 Subjects: Rows `17` to `24` (Subject: `C`, Term 1: `F`, Term 2: `G`, Term 3: `H`, Final: `I`, Units: `J`)
  - Term 2 Subjects: Rows `26` to `33`
  - Term 3 Subjects: Rows `35` to `42`
  - **Unit-Weighted General Average**: Row `44`, Column `I44` | Remarks: `J44`

---

### 11.4 Senior High School Grade 12 SF9 (`G12 Academic with Cross School Form 9 (SY 26-27).xlsx`)
- **Cross-Enrollment Section**: Accommodates specialized courses taken at external partner colleges/universities.
- **Row Mapping**:
  - Semester 1 Core: Rows `16` to `22`
  - Semester 1 Applied/Specialized: Rows `23` to `28`
  - Semester 1 General Average: Row `29`
  - Semester 2 Core: Rows `32` to `37`
  - Semester 2 Applied/Specialized: Rows `38` to `44`
  - Work Immersion / Research Capstone: Row `45`
  - Semester 2 General Average: Row `46`

---

### 11.5 Grades 2–10 Academic ECR (`ECR_Template_Academic_G2_G10.xlsx`)
- **Header Block**:
  - Region: `D4` | Division: `D5` | District: `D6` | School Name: `J4` | School ID: `J5` | School Year: `J6`
  - Grade & Section: `D7` | Subject: `J7` | Teacher Name: `D8`
- **Student Roster Bands**:
  - **Male Learners**: Rows `13` to `62` (Row 13 = Student 1, Row 62 = Student 50)
  - **Female Learners**: Rows `66` to `115` (Row 66 = Student 1, Row 115 = Student 50)
- **Assessment Columns (Worksheets `TERM 1`, `TERM 2`, `TERM 3`)**:
  - Student LRN: Column `B` | Learner Name: Column `C`
  - Written Works (WW 1–10): Columns `E` to `N`
  - Written Works Total: Column `O` | Percentage Score (PS): `P` | Weighted Score (WS): `Q`
  - Performance Tasks (PT 1–10): Columns `T` to `AC`
  - Performance Tasks Total: Column `AD` | Percentage Score (PS): `AE` | Weighted Score (WS): `AF`
  - Quarterly Assessment (QA Raw Score): Column `AJ`
  - QA Percentage Score (PS): Column `AN` | Weighted Score (WS): `AO`
  - **Initial Grade**: Column `AP`
  - **Transmuted Final Grade**: Column `AQ`

---

### 11.6 Grades 2–10 GMRC & Values Education ECR (`ECR_Template_GMRC_VE_G2_G10.xlsx`)
- **5-Domain Score Columns**:
  - WW Cognitive (WW 1–5): Columns `E` to `I` | Total: `J` | WS: `L` (10%)
  - WW Affective (WW 6–10): Columns `M` to `Q` | Total: `R` | WS: `T` (10%)
  - PT Cognitive (PT 1–3): Columns `W` to `Y` | Total: `Z` | WS: `AB` (10%)
  - PT Affective (PT 4–6): Columns `AC` to `AE` | Total: `AF` | WS: `AH` (10%)
  - PT Behavioral (PT 7–9): Columns `AI` to `AK` | Total: `AL` | WS: `AN` (30%)
  - Summative Tests (ST1 & ST2): Columns `AQ` & `AR`
  - Term Exam (TE): Column `AS` | Total QA: `AT` | WS: `AV` (30%)
  - **Initial Grade**: Column `AW`
  - **Transmuted Quarterly Grade**: Column `AX`

---

### 11.7 SSHS DO 017 3-Term ECR (`SSHS E-Class Record SY 2026-2027.xlsx`)
- **Metadata**:
  - Region: `D4` | Division: `D5` | School Name: `D6` | School ID: `M6` | School Year: `R6`
  - Grade Level: `D7` | Section: `M7` | Track/Strand/Cluster: `R7` | Subject: `D8` | Teacher: `R8`
- **Assessment Scoring Grid**:
  - Male Learners: Rows `13` to `62` | Female Learners: Rows `66` to `115`
  - Written Works: Columns `E` to `N` (WW 1–10) | Total: `O` | PS: `P` | WS: `Q`
  - Performance Tasks: Columns `T` to `AC` (PT 1–10) | Total: `AD` | PS: `AE` | WS: `AF`
  - Summative Tests: Columns `AJ` (ST1) & `AK` (ST2) | Term Exam: `AL` (TE) | Total: `AM` | PS: `AN` | WS: `AO`
  - **Initial Grade**: Column `AP`
  - **Transmuted Final Grade**: Column `AQ`

---

### 11.8 School Form 2 (SF2) Daily Attendance Register (`SF2_ELEM.xlsx`)
- **Header Coordinates**: School ID: `E4` | School Name: `K4` | District: `E5` | Division: `K5` | Month: `E6` | Year: `K6`
- **Attendance Days Grid**: Starting column `D` across active DepEd calendar school days (M–T–W–TH–F).
- **Summary Rows**:
  - (a) Enrollment 1st Friday of BoSY: Row `58`
  - (b) Late Enrollees: Row `59`
  - (c) Registered Learners: Row `60`
  - (d) Transferred In: Row `61`
  - (e) Transferred Out: Row `62`
  - (f) Dropped Out / NLPA: Row `63`
  - (g) Total End of Month: Row `64`
  - (h) Average Daily Attendance (ADA): Row `65`
  - (i) Percentage of Attendance: Row `66`
  - (j) Consecutive Absences ($\ge 5$ days): Row `67`

---

### 11.9 School Form 1 (SF1) School Register (`SF1_Template.xlsx` / `SF1_SHS.xlsx`)
- **Regulatory Foundation**: DepEd Order No. 4, s. 2014 (Standardized School Forms) & LIS (Learner Information System) Profiling Protocol.
- **Workbook Structure**:
  - Primary Worksheet: `SF1` or `School Form 1` (JHS/ES) / `SF1-SHS` (Senior High School).
  - Print Configuration: Standard DepEd Folio / Legal landscape (`8.5" x 13"`) or A4 landscape.
- **Header Coordinate Block**:
  - School ID: `D4` | School Name: `H4` | District: `D5` | Division: `H5`
  - Region: `D6` | Grade Level: `H6` | Section: `D7` | School Year: `H7`
  - SHS Additional Coordinates: Track: `D8` | Strand / Specialization: `H8` | Semester: `D9`
- **Dynamic Header Detection & Roster Scan**:
  - Scans column `A`–`C` downwards until the header row matching string pattern `LRN` or `Learner Reference Number` is reached (default fallback: Row `11` or `12`).
  - Male Learner Data Band: Commences immediately on row following header (typically Row `13`).
  - Male Termination Sentinel: Cell matching `TOTAL MALE` in Column `C`.
  - Female Learner Data Band: Commences 2 rows below `TOTAL MALE` header.
  - Workbook Termination Sentinel: Cell matching `TOTAL FEMALE` in Column `C`.
- **K-10 Data Column Schema (0-Indexed & OpenXML Cell References)**:
  - `Col A` (`Index 0`): Learner Reference Number (LRN, 12 digits or `TEMP-` prefixed identifier).
  - `Col B` (`Index 1`): Fallback LRN container for legacy DepEd templates.
  - `Col C` (`Index 2`): Learner Full Name in strict Philippine canonical format: `LAST NAME, FIRST NAME MIDDLE NAME` or `LAST NAME EXTENSION, FIRST NAME MIDDLE NAME`.
  - `Col D` (`Index 3`): Sex (`M` / `F` or `MALE` / `FEMALE`).
  - `Col H` (`Index 7`): Birthdate (Normalized ISO `YYYY-MM-DD` converted from Excel date serial `Math.floor(serial - 25569) * 86400`).
  - `Col J` (`Index 9`): Age as of 1st Friday of October (integer value).
  - `Col L` (`Index 11`): Mother Tongue (e.g., `Tagalog`, `Cebuano`, `Ilokano`, `Hiligaynon`).
  - `Col M` (`Index 12`): IP Community Indicator (`Yes`/`No` or `/`).
  - `Col N` (`Index 13`): Specific Indigenous Cultural Community / Ethnic Group.
  - `Col O` (`Index 14`): Religious Affiliation (e.g., `Roman Catholic`, `Islam`, `Iglesia ni Cristo`).
  - `Col P` (`Index 15`): Street / Purok / House Number.
  - `Col Q` (`Index 16`): Barangay.
  - `Col R` (`Index 17`): Municipality / City.
  - `Col S` (`Index 18`): Province.
  - `Col T` (`Index 19`): Father's Name (Last, First, Middle).
  - `Col U` (`Index 20`): Mother's Maiden Name (Last, First, Middle).
  - `Col V` (`Index 21`): Legal Guardian's Name.
  - `Col W` (`Index 22`): Guardian Relationship (`Grandparent`, `Aunt`, `Sibling`, etc.).
  - `Col X` (`Index 23`): Parent / Guardian Contact Telephone / Mobile Number.
  - `Col Y` (`Index 24`): Remarks / Status Indicator (`Transferred In`, `Transferred Out`, `CCT/4Ps`, `Balik-Aral`, `Repeater`).
- **Senior High School (SF1-SHS) Specific Column Offsets**:
  - Birthdate: `Col L` (`Index 11`) | Age: `Col O` (`Index 14`) | Religion: `Col Q` (`Index 16`)
  - Address: Street `Col U` (`Index 20`), Barangay `Col Z` (`Index 25`), Municipality `Col AE` (`Index 30`), Province `Col AG` (`Index 32`).
  - Parent/Guardian Info: Father `Col AK` (`Index 36`), Mother `Col AP` (`Index 41`), Guardian `Col AR` (`Index 43`), Relationship `Col AV` (`Index 47`), Contact `Col AX` (`Index 49`).

---

### 11.10 School Form 5 (SF5) Report on Promotion and Level of Proficiency (`SF5_K10.xlsx` / `SF5A_SHS.xlsx` / `SF5B_SHS.xlsx`)
- **Regulatory Foundation**: DepEd Order No. 8, s. 2015 (Grading & Promotion), DO 4, s. 2014, and DepEd Memorandum No. 14, s. 2023.
- **Header Coordinates**:
  - School ID: `C4` | School Name: `G4` | District: `C5` | Division: `G5`
  - Region: `C6` | Grade Level: `G6` | Section: `C7` | School Year: `G7`
  - Curriculum Stream: `C8` (`Revised K-10`, `Strengthened Senior High School`, `K-12`)
- **Learner Evaluation Roster (Rows 13 to 62 for Males; Rows 66 to 115 for Females)**:
  - Column `A`: Sequential Index (`1` to `N`).
  - Column `B`: Learner Reference Number (LRN).
  - Column `C`: Learner Name (`LAST NAME, FIRST NAME MIDDLE NAME`).
  - Column `D`: General Average ($\text{GA} = \text{round}\left(\frac{\sum \text{FinalGrades}}{N}\right)$ per DO 8 s. 2015; unit-weighted for SHS).
  - Column `E`: Action Taken (Categorical Promotion State):
    - `PROMOTED`: Zero failed learning areas ($\text{Final Grade} \ge 75$ for all subjects and $\text{GA} \ge 75$).
    - `*Conditional`: Deficient in 1 or 2 learning areas ($\text{Final Grade} < 75$); requires documented remedial instruction.
    - `RETAINED`: Deficient in $\ge 3$ learning areas or $\text{GA} < 75$.
  - Column `F`: Did Not Meet Expectations (Deficient Subject Roster, comma-delimited strings e.g. `Mathematics, Science`).
- **Summary Table 1: Status of Learners Grid**:
  - Promoted: Male `C54`, Female `D54`, Total `E54` (`=SUM(C54:D54)`)
  - *Conditional: Male `C55`, Female `D55`, Total `E55`
  - Retained: Male `C56`, Female `D56`, Total `E56`
  - Total Enrolled: Male `C57`, Female `D57`, Grand Total `E57`
- **Summary Table 2: Level of Proficiency Distribution**:
  - Advancing ($90.00$ to $100.00$): Male `I54`, Female `J54`, Total `K54`
  - Benchmarking ($80.00$ to $89.99$): Male `I55`, Female `J55`, Total `K55`
  - Connecting ($75.00$ to $79.99$): Male `I56`, Female `J56`, Total `K56`
  - Developing ($65.00$ to $74.99$): Male `I57`, Female `J57`, Total `K57`
  - Emerging ($< 65.00$): Male `I58`, Female `J58`, Total `K58`
- **Signatory Endorsement**:
  - Class Adviser: `C62` | School Head / Principal: `G62` | Division Representative: `J62`

---

### 11.11 School Form 6 (SF6) Summarized Report on Promotion and Level of Proficiency (`SF6_Master.xlsx`)
- **Regulatory Foundation**: DepEd Order No. 4, s. 2014 & DepEd Order No. 58, s. 2017.
- **Header Coordinates**:
  - School ID: `C4` | School Name: `G4` | District: `C5` | Division: `G5` | Region: `C6` | School Year: `G6`
- **Grade Cohort Bucket Aggregations (Rows 12 to 18)**:
  - Bucket 1 (`Row 12`): Grade 1 / Grade 7
  - Bucket 2 (`Row 13`): Grade 2 / Grade 8
  - Bucket 3 (`Row 14`): Grade 3 / Grade 9
  - Bucket 4 (`Row 15`): Grade 4 / Grade 10
  - Bucket 5 (`Row 16`): Grade 5 / Grade 11
  - Bucket 6 (`Row 17`): Grade 6 / Grade 12
  - Institutional Total (`Row 18`): Formula `=SUM(C12:C17)` across all columns.
- **Column Cluster Partitions**:
  - **Promotion Status**:
    - Promoted: Male `C`, Female `D`, Total `E` (`=C+D`)
    - Conditional: Male `F`, Female `G`, Total `H` (`=F+G`)
    - Retained: Male `I`, Female `J`, Total `K` (`=I+J`)
  - **Proficiency Distribution**:
    - Emerging ($< 65$): Male `L`, Female `M`, Total `N`
    - Developing ($65–74$): Male `O`, Female `P`, Total `Q`
    - Connecting ($75–79$): Male `R`, Female `S`, Total `T`
    - Benchmarking ($80–89$): Male `U`, Female `V`, Total `W`
    - Advancing ($90–100$): Male `X`, Female `Y`, Total `Z`
- **Institutional Certification Block**:
  - Prepared by School Head: `D24` | Certified by Division Superintendent: `I24` | Validation Date: `D26`

---

### 11.12 School Form 8 (SF8) Learner Basic Health and Nutritional Profile (`SF8_Template.xlsx`)
- **Regulatory Foundation**: DepEd Order No. 8, s. 2015, DepEd Order No. 16, s. 2017, and WHO Child Growth Standards (5–19 years).
- **Header Coordinates**:
  - School ID: `D4` | School Name: `I4` | District: `D5` | Division: `I5`
  - Region: `D6` | Grade & Section: `D7` | School Year: `I7`
- **Learner Assessment Data Grid (Rows 12 to 61 for Males; Rows 65 to 114 for Females)**:
  - Column `A`: Row Sequence (`1` to `N`).
  - Column `B`: Learner Reference Number (LRN).
  - Column `C`: Learner Name (`LAST NAME, FIRST NAME MIDDLE NAME`).
  - Column `D`: Birthdate (`YYYY-MM-DD`).
  - Column `E`: Age in Years and Months (Format `YY.MM`, e.g., 13 years and 8 months = `13.08`, calculated dynamically relative to assessment date).
  - Column `F`: Weight in kilograms ($\text{kg}$, precision to 1 decimal place).
  - Column `G`: Height in meters ($\text{m}$, precision to 2 decimal places).
  - Column `H`: Height Squared ($m^2$, calculated as $\text{Height}^2$, precision to 4 decimal places).
  - Column `I`: Body Mass Index ($\text{BMI} = \frac{\text{Weight (kg)}}{\text{Height (m)}^2}$, rounded to 2 decimal places).
  - Column `J`: Nutritional Status (WHO BMI-for-Age Z-Score classification):
    - `Severely Wasted` ($Z < -3$)
    - `Wasted` ($-3 \le Z < -2$)
    - `Normal` ($-2 \le Z \le +1$)
    - `Overweight` ($+1 < Z \le +2$)
    - `Obese` ($Z > +2$)
  - Column `K`: Height-for-Age (HFA WHO Growth Classification):
    - `Severely Stunted` ($Z < -3$)
    - `Stunted` ($-3 \le Z < -2$)
    - `Normal` ($-2 \le Z \le +2$)
    - `Tall` ($Z > +2$)
  - Column `L`: Remarks & Clinical Interventions:
    - `For Immediate Intervention`: Severely Wasted or Severely Stunted.
    - `For Monitoring`: Wasted or Stunted.
    - `Monitor Nutrition`: Overweight or Obese.
    - `Normal`: Within standard normative thresholds.
- **Statistical Aggregation Footer**:
  - Baseline Assessment (BoSY) Summary Table: Rows `118` to `124`.
  - Endline Assessment (EoSY) Summary Table: Rows `126` to `132`.

---

### 11.13 School Form 10 (SF10) Learner's Permanent Academic Record (`SF10_ES.xlsx`, `SF10_JHS.xlsx`, `SF10_SHS.xlsx`)
- **Regulatory Foundation**: DepEd Order No. 58, s. 2017 (Adoption of New School Forms) replacing historical Form 137.
- **Form Architecture & Layout Variants**:
  1. **SF10-ES (Elementary Grades 1–6)**:
     - Front Face: Learner profile, Kindergarten completion certificate, Grades 1 to 3 Scholastic Assessment blocks.
     - Back Face: Grades 4 to 6 Scholastic Assessment blocks, Remedial Record sub-tables, Eligibility for Secondary School admission.
  2. **SF10-JHS (Junior High School Grades 7–10)**:
     - Front Face: Primary school completion metadata, Grade 7 and Grade 8 academic blocks.
     - Back Face: Grade 9 and Grade 10 academic blocks, certification of Junior High School completion, Senior High School eligibility slip.
  3. **SF10-SHS (Senior High School Grades 11–12)**:
     - Track, Strand, and Specialization headers.
     - Structured semester blocks: Grade 11 Semester 1, Grade 11 Semester 2, Grade 12 Semester 1, Grade 12 Semester 2.
     - Subject Classification columns: `Core`, `Applied`, `Specialized`, with corresponding institutional Unit Weights.
- **Standard Academic Block Coordinate Schema (Per Grade Level / Semester Block)**:
  - School Name: `C12` | School ID: `G12` | District: `C13` | Division: `G13` | Region: `C14`
  - Grade Level: `C15` | Section: `E15` | School Year: `G15` | Adviser Name: `C16`
  - Learning Area Rows (Rows `18` to `28`):
    - Column `B`: Learning Area Title (Canonical DepEd subject identifier).
    - Column `C`: 1st Term / Quarter Rating.
    - Column `D`: 2nd Term / Quarter Rating.
    - Column `E`: 3rd Term / Quarter Rating.
    - Column `F`: 4th Term Rating (Key Stage 2–4).
    - Column `G`: Final Rating ($\text{round}(\text{average}(Q1..Q4))$).
    - Column `H`: Action Taken (`Passed` if $\text{Final} \ge 75$, `Failed` if $\text{Final} < 75$).
  - General Average Row: Row `29`, Column `G29` | Action Taken: `H29`.
- **Remedial Instruction Ledger Sub-Table (Per Block)**:
  - Rows `31` to `33`: Learning Area, Semestral / Final Rating, Remedial Class Mark, Recomputed Final Grade, Remarks.

---

### 11.14 PACE Form - Primary Academic Continuum Evaluation (`PACE_K_G1.xlsx`)
- **Regulatory Foundation**: MATATAG Curriculum Kindergarten to Grade 1 Transition Framework & DepEd Order No. 47, s. 2016 (Omnibus Kindergarten Policy).
- **Worksheet Layout Catalog**:
  - `PACE COVER`: Student biographical data, school profile, and parent acknowledgment.
  - `PACE READING`: Reading and Literacy domain competencies.
  - `PACE LANGUAGE`: Oral language and mother-tongue continuum.
  - `PACE MATH`: Foundational numeracy, spatial concepts, and sorting.
  - `PACE GMRC_MAKABANSA`: Values education, socio-emotional, and cultural awareness.
  - `PACE SUMMARY`: Consolidated quarterly rating profile.
- **Competency Rating Nomenclature**:
  - `A` (**Advancing**): Learner consistently demonstrates mastery without teacher intervention.
  - `B` (**Benchmarking**): Learner demonstrates competency with minimal guidance.
  - `C` (**Connecting**): Learner displays emerging skill; requires periodic teacher scaffolding.
  - `D` (**Developing**): Learner exhibits initial awareness; requires continuous instructional assistance.
  - `E` (**Emerging**): Competency not yet observable.
- **Grid Cell Coordinates (`PACE SUMMARY`)**:
  - Header: School Name: `C4` | School ID: `G4` | Learner Name: `C6` | LRN: `G6` | Adviser: `C7`
  - Domain 1 (Reading & Literacy, 12 indicators): Rows `11` to `22` (Term 1: `D`, Term 2: `E`, Term 3: `F`)
  - Domain 2 (Language, 10 indicators): Rows `24` to `33` (Term 1: `D`, Term 2: `E`, Term 3: `F`)
  - Domain 3 (Mathematics, 15 indicators): Rows `35` to `49` (Term 1: `D`, Term 2: `E`, Term 3: `F`)
  - Domain 4 (Makabansa, 8 indicators): Rows `51` to `58` (Term 1: `D`, Term 2: `E`, Term 3: `F`)
  - Domain 5 (GMRC, 8 indicators): Rows `60` to `67` (Term 1: `D`, Term 2: `E`, Term 3: `F`)
  - Overall Developmental Progression Indicator: Row `69`, Column `F69`.

---

### 11.15 Temporary Grade Slip (TGS) Cross-School Transfer Protocol (`TGS_DO54_s2016.xlsx`)
- **Regulatory Foundation**: DepEd Order No. 54, s. 2016 (Guidelines on the Request and Transfer of Learner's School Records).
- **Physical Layout Specification**:
  - 3-Slip Voucher Layout per Page (Standard Legal / Folio `8.5" x 13"` portrait).
  - Slip 1: Rows `1` to `28` | Slip 2: Rows `30` to `57` | Slip 3: Rows `59` to `86`.
  - Micro-perforated boundary markers between vouchers for individual detachment.
- **Voucher Coordinate Schema (Slip 1 Instance)**:
  - Header Block:
    - DepEd Official Logo: `B2:C4` (Merged image container)
    - School Name: `D2` | School ID: `H2` | Address: `D3` | District / Division: `H3`
  - Learner Profile Strip:
    - Learner Name: `C5` | LRN: `G5`
    - Grade & Section: `C6` | Track & Strand: `G6`
    - Class Adviser: `C7` | Date Issued: `G7`
  - Scholastic Performance Matrix (Rows `9` to `18`):
    - Column `B`: Learning Area Title.
    - Column `E`: Quarter 1 Grade.
    - Column `F`: Quarter 2 Grade.
    - Column `G`: Quarter 3 Grade.
    - Column `H`: Quarter 4 Grade (if applicable).
    - Column `I`: Current Running Average.
  - Attendance Summary Strip (Row `20`):
    - Total School Days: `D20` | Days Present: `F20` | Days Absent: `H20`
  - Statutory Legal Caveat (Row `22`):
    - *"Issued for temporary evaluation and cross-school enrollment transfer under DO 54, s. 2016. Valid for 30 calendar days from date of issuance. Official SF10 must be requested via LIS."*
  - Verification & Signatures:
    - Class Adviser: `C25` | School Head / Registrar: `G25` | Official School Dry Seal: `I25`

---

### 11.16 Consolidated Grade Sheet (Cross-Subject Faculty Deliberation & Advisory Master Sheet)
- **Functional Architecture**: High-density horizontal master matrix consolidating all subject teachers' quarterly records for an entire advisory section into a unified deliberation ledger.
- **Header Coordinate Block**:
  - School Name: `D4` | School ID: `K4` | District: `D5` | Division: `K5`
  - Grade Level: `D6` | Section Name: `H6` | School Year: `K6` | Adviser: `D7`
- **Horizontal Subject Cluster Architecture (Columns `E` to `BZ`)**:
  - Each subject spans a dedicated 4-column or 5-column cluster:
    - `SubCol 1`: Quarter 1 (Term 1) Grade
    - `SubCol 2`: Quarter 2 (Term 2) Grade
    - `SubCol 3`: Quarter 3 (Term 3) Grade
    - `SubCol 4`: Quarter 4 Grade (for Key Stage 2–4 4-quarter models)
    - `SubCol 5`: Final Rating ($\text{round}\left(\frac{\sum Q_i}{N}\right)$)
  - Subject Ordering Sequence:
    1. Mother Tongue (Grades 1–3) / Filipino
    2. English
    3. Mathematics
    4. Science
    5. Araling Panlipunan (AP)
    6. Edukasyon sa Pagpapakatao (EsP) / Values Education / GMRC
    7. Technology and Livelihood Education (TLE) / EPP
    8. MAPEH Composite:
       - Music component sub-column
       - Arts component sub-column
       - Physical Education component sub-column
       - Health component sub-column
       - MAPEH Composite Final: $\text{round}\left(\frac{\text{Music} + \text{Arts} + \text{PE} + \text{Health}}{4}\right)$
- **Analytical & Deliberation Columns (Columns `CA` to `CH`)**:
  - Column `CA` (**General Average**):
    - Elementary / JHS: Unweighted arithmetic mean: $\text{round}\left(\frac{\sum \text{SubjectFinals}}{N}\right)$
    - SHS: Unit-weighted general average: $\text{round}\left(\frac{\sum (\text{Final}_i \times \text{Units}_i)}{\sum \text{Units}_i}\right)$
  - Column `CB` (**Academic Honors Evaluation - DO 36, s. 2016**):
    - `With Highest Honors`: $\text{GA} \ge 98.00$ and all subject quarterly grades $\ge 85$.
    - `With High Honors`: $95.00 \le \text{GA} < 98.00$ and all subject quarterly grades $\ge 85$.
    - `With Honors`: $90.00 \le \text{GA} < 95.00$ and all subject quarterly grades $\ge 85$.
    - `Qualified (Disqualified by Grade Floor)`: $\text{GA} \ge 90.00$ but one or more quarterly grades $< 85$.
  - Column `CC` (**Academic Deficiencies Counter**): Formula tallying count of subjects with Final Grade $< 75$.
  - Column `CD` (**Adviser Deliberation Decision**):
    - `Eligible for Promotion` (0 deficiencies).
    - `Recommended for Remedial / Summer Enhancement` (1–2 deficiencies).
    - `Retained` ($\ge 3$ deficiencies or $\text{GA} < 75$).
- **Student Roster Bands**:
  - Male Learners: Rows `13` to `62` (Row 13 = Male 1, Row 62 = Male 50)
  - Male Subtotal / Average: Row `63`
  - Female Learners: Rows `66` to `115` (Row 66 = Female 1, Row 115 = Female 50)
  - Female Subtotal / Average: Row `116`
  - Combined Class General Average: Row `118`

---
*End of Master Architecture, Regulatory Corpus, 3-Term Calendar, Grading Specification, UI Module Catalog & OpenXML Reference.*
