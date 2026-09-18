# FormEase Pro

> **Professional School Management System for Philippine DepEd Educators**  
> Version: **3.5.14** | Architecture: **Offline-First Desktop Application (Electron + React 19 + TypeScript)**

FormEase Pro is an offline-first desktop school management system engineered specifically for Philippine Department of Education (DepEd) educators and administrators. It automates grading calculations, official DepEd school form generation, attendance tracking via smartphones over local Wi-Fi, report cards (SF9), learner permanent records (SF10), and encrypted database backups.

---

## Key Features

- **DepEd School Forms Automation**:
  - **SF2**: Daily Attendance recording with automatic monthly summary computation and SMS parent notifications.
  - **SF5**: Report on Promotion and Level of Proficiency.
  - **SF6**: Summarized Report on Promotion and Level of Proficiency.
  - **SF8**: Health and Nutritional Status Report (BMI / Height-for-Age calculation).
  - **SF9**: Progress Report Card (Template 1 & Template 2 across Elementary, JHS, SHS, SSHS, and MATATAG curriculums).
  - **SF10**: Learner's Permanent Academic Record with historical grade migration and credit evaluation.
  - **ECR & LIR**: Electronic Class Record and Learner's Individual Record.
  - **PACE & SSHS**: Special Science High School curriculum workflows and PACE assessments.
- **Offline-First & Data Privacy**:
  - Encrypted browser IndexedDB using client-derived AES-256-GCM keys.
  - Student data never leaves the local machine unless explicitly synchronized with the teacher's personal Google Drive account.
  - PBKDF2 password hashing for local user accounts with zero factory-default master backdoors.
- **Local LAN Mobile Attendance Gateway**:
  - Conduct daily classroom attendance via phone camera scanning student QR/barcodes.
  - High-entropy cryptographic pairing tokens generated on desktop modal launch and carried via QR URL fragment (`#pairing=<token>`).
  - Private IPv4 LAN CORS and loopback-only authorization controls preventing unauthorized network access.
- **Automated Backup & Disaster Recovery**:
  - Hourly automated snapshots and pre-action checkpoints.
  - SHA-256 backup integrity verification for `.formease` backup files.
  - Backward compatibility with legacy archives dating back to version 3.0.

---

## Technology Stack

- **Desktop Framework**: Electron 41 (Context Isolation enabled, Node Integration disabled)
- **Frontend**: React 19, TypeScript 5.9, Vite 7, Tailwind CSS v4, Framer Motion 12
- **State Management**: Zustand 5 (Modular sliced stores)
- **Database**: Encrypted browser IndexedDB + LocalStorage
- **Document & Spreadsheet Engines**: ExcelJS, SheetJS (`xlsx`), `@react-pdf/renderer`, `pdf-lib`, `jspdf`, `html2canvas-pro`
- **Cloud Services**: Firebase Authentication & Firestore (Licensing, Activation, Announcements)
- **Testing & Quality**: Vitest 4, Testing Library, ESLint 9

---

## Repository Structure

```
FormEase Pro/
├── app/                              # Main desktop application source
│   ├── electron/                     # Electron main process & preload IPC
│   ├── src/
│   │   ├── components/               # React components (modals, forms, UI primitives)
│   │   ├── lib/                      # Curriculum definitions, grading math, RBAC
│   │   ├── pages/                    # Route-level views (Dashboard, SF9, SF10, Attendance, etc.)
│   │   ├── services/                 # Excel exporters, database engine, mobile attendance gateway
│   │   ├── stores/                   # Zustand stores (app, auth, system, update)
│   │   ├── testing/                  # Vitest workflow and regression test suites
│   │   └── utils/                    # Backup/restore, cryptography, student normalization
│   ├── server.js                     # Standalone Express LAN attendance gateway
│   ├── vite.config.ts                # Vite build, code-splitting & dev attendance middleware
│   └── package.json                  # Application dependencies & release scripts
├── license-portal/                   # Web-based license activation & management portal
├── FORMEASE_SYSTEM_AUDIT_REPORT_2026-09-18.md # Comprehensive system audit report
└── VERSION_HISTORY.md                # Changelog & version release notes
```

---

## Getting Started

### Prerequisites
- **Node.js**: `v22.x` or `v24.x`
- **npm**: `v10.x` or `v11.x`
- **OS**: Windows 10/11 or macOS 12+

### Installation

```bash
# Navigate into the main application directory
cd app

# Install dependencies
npm install
```

### Development

```bash
# Run web client in Vite development server (http://localhost:3000)
npm run dev

# Run full desktop app (Vite + Electron with Hot Module Replacement)
npm run electron:dev
```

---

## Verification & Testing

FormEase Pro maintains a suite of **743 automated tests across 75 test files** covering Excel template preservation, curriculum constraints, grading mathematics, authentication bypass prevention, and LAN gateway security.

```bash
# Run full Vitest test suite
npm run test

# Run tests with single-worker allocation (recommended for heavy Excel export tests)
npx vitest run --maxWorkers=1

# Run code linter
npm run lint

# Verify release version consistency across all source files
npm run release:check
```

---

## Building & Packaging

To generate production installers:

### Windows (.exe / NSIS Installer)
```bash
# Builds the production bundle, shields electron core, and packages the Windows installer
npm run electron:build:win
```
The output installer executable and blockmap will be placed in `app/release/` and copied to the root `release/` directory.

### macOS (.dmg / Universal)
```bash
npm run electron:build:mac
```

---

## Security Architecture

1. **Authentication**:
   - Accounts are created locally during first launch.
   - Passwords are encrypted using PBKDF2 with unique salts and stored under `formease-credentials-v2`.
   - Legacy installations on default passwords are automatically redirected to account creation.
2. **Mobile Attendance Security**:
   - Pairing tokens expire automatically after 2 hours or upon closing the desktop modal.
   - Network IP discovery and session replacements are restricted strictly to `localhost` / loopback requests.
   - Request payloads are validated against rigid schemas and restricted to 1 MB for updates and 10 MB for sessions.
3. **Data Protection**:
   - Encryption keys are derived per-installation and never transmitted over the network.
   - Local database backups exclude sensitive licensing tokens and user password hashes.

---

## Author & License

- **Developer**: Emerson M. Galano
- **Copyright**: © 2026 Department of Education / FormEase Pro. All rights reserved.
