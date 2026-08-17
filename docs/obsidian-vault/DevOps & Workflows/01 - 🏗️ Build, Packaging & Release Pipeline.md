---
title: Build, Packaging & Release Pipeline
tags:
  - devops
  - build
  - electron
  - release
  - workflow
created: 2026-08-17
---

# 🏗️ Build, Packaging & Release Pipeline

The official automated workflow for compiling, obfuscating, verifying, and publishing FormEase Pro desktop and web releases.

---

## 🚀 Production Build Sequence

```mermaid
graph TD
    Source["💻 Source Code (React 19 + Electron 34)"] --> Compile["1. TypeScript Check (tsc -b)"]
    Compile --> Vite["2. Web Bundle Build (vite build)"]
    Vite --> Obf["3. Obfuscate Electron Core (javascript-obfuscator)"]
    Obf --> QA["4. Unit Tests & Smoke Verification (vitest)"]
    QA --> Pack["5. Desktop Packaging (electron-builder)"]
    Pack --> OutWin["Windows NSIS (.exe)"]
    Pack --> OutMac["macOS Universal (.dmg)"]
    Pack --> Publish["6. Release Deployment & Auto-Update Sync"]
```

---

## 🛠️ CLI Release Command Cheat Sheet

```bash
# 1. Verify and test codebase
npm run test

# 2. Compile Web App & Obfuscate Desktop Entrypoints
npm run build && npm run obfuscate:electron

# 3. Pre-flight integrity audit
npm run release:check

# 4. Package Windows Installer (x64 / ia32)
npm run electron:build:win

# 5. Package macOS Universal Bundle
npm run electron:build:mac
```

---

## 🛡️ Security Obfuscation Shields (`scripts/obfuscate-electron.cjs`)
To safeguard intellectual property and licensing logic:
- Transforms `electron/main.cjs`, `license.cjs`, and `preload.cjs` into high-entropy control flow flattened code.
- Strips debug strings and console traces in production builds.

See also:
- [[02 - 🧪 Pre-Flight QA & Smoke Testing Checklist]]
- [[06 - 🔑 License Portal & Activation Cryptography]]
- [[01 - 📋 Version History Index]]
