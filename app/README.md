# FormEase Pro - Desktop Application

This directory contains the main desktop application source for **FormEase Pro** (v3.5.14), built with Electron, React 19, TypeScript, and Vite.

For full project overview, DepEd form specifications, and security architecture, see the root [README.md](../README.md).

---

## Directory Overview

```
app/
├── electron/                 # Electron main process, preload script, and window management
│   ├── main.ts               # App lifecycle, IPC handlers, protocol registration
│   └── preload.ts            # Context bridge exposing secure desktop APIs
├── src/                      # React application source code
│   ├── components/           # Reusable UI components, modals, and layout containers
│   ├── lib/                  # Core domain logic (curriculum, grading calculations, RBAC)
│   ├── pages/                # Route views (Dashboard, SF9, SF10, Attendance, Settings, etc.)
│   ├── services/             # Background services (Excel exports, IndexedDB, Mobile Gateway)
│   ├── stores/               # Zustand state stores (app-store, auth-store, etc.)
│   ├── testing/              # Vitest test suites and integration test helpers
│   └── utils/                # Utilities (crypto, backup/restore, student normalization)
├── server.js                 # Standalone Express server for LAN attendance gateway
├── vite.config.ts            # Vite configuration, code-splitting chunks, dev gateway proxy
└── package.json              # Application scripts and dependencies
```

---

## Available Scripts

From this `app/` directory, you can run:

### Development
```bash
# Start Vite development server (port 3000)
npm run dev

# Start Electron application alongside Vite with Hot Module Replacement
npm run electron:dev
```

### Verification & Testing
```bash
# Run full Vitest test suite
npm run test

# Run tests with single-worker allocation (recommended for heavy Excel export tests)
npx vitest run --maxWorkers=1

# Run ESLint validation
npm run lint

# Run release consistency checks across code and metadata
npm run release:check
```

### Production Build & Packaging
```bash
# Build React web application bundle into dist/
npm run build

# Obfuscate Electron main process into dist-electron/
npm run obfuscate:electron

# Build Windows NSIS installer
npm run electron:build:win

# Build Windows portable / unpacked package
npm run electron:build:dir
```

---

## Architecture Notes

1. **Context Isolation**: Renderer communicates with Electron exclusively via `window.electronAPI` bridge defined in `electron/preload.ts`.
2. **Offline-First Storage**: User credentials and school records are stored locally in encrypted IndexedDB. No student data is sent to external servers.
3. **LAN Attendance Gateway**: Mobile devices connect over local Wi-Fi to desktop IP using high-entropy pairing tokens passed in QR codes (`#pairing=<token>`).
