---
title: License Portal & Activation Cryptography
tags:
  - licensing
  - cryptography
  - activation
  - hardware-id
created: 2026-08-17
---

# 🔑 License Portal & Activation Cryptography

FormEase Pro operates with an **offline-capable hardware activation model** allowing schools without consistent internet to register and activate software licenses locally.

---

## 🔒 Activation Flow & Cryptographic Proof

```mermaid
graph TD
    Client["💻 Client Desktop App"] --> Mac["Compute Machine ID (Hardware UUID + MAC)"]
    Mac --> Disp["Display Activation Dialog & Machine ID"]
    Disp --> Portal["🏫 Admin License Portal (Firebase / Offline CLI)"]
    Portal --> Gen["Sign Machine ID + Secret Salt (SHA-256 Hash Key)"]
    Gen --> Key["Generate 16-character Unlock Key"]
    Key --> Client
    Client --> Unlock["Verify Hash & Unlock Full Perpetual Features"]
```

---

## 🛡️ License Protection Shield
- **Obfuscation**: Electron production entrypoints (`dist-electron/main.cjs`, `license.cjs`, `preload.cjs`) are shielded with JS Obfuscator control flow flattening and string encryption.
- **Hardware Binding**: Unlock keys cannot be cloned to other laptops or PCs because each unlock key is tied to that specific device's CPU and motherboard signature.

See also:
- [[03 - 🔐 Security, Encryption & Auth]]
- [[01 - 🗄️ Database & Offline Storage]]
