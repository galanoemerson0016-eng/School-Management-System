---
title: Emergency Password Recovery Guide
tags:
  - security
  - recovery
  - password
  - master-key
created: 2026-08-17
---

# 🔑 Emergency Password Recovery Guide

FormEase Pro provides an emergency recovery mechanism so teachers and school heads never lose access to their student grades and records.

---

## 🛠️ Step-by-Step Recovery Procedure

1. On the Login Screen, click **"Forgot Password?"** or **"Need Help?"**.
2. **Step 1 — Identity Verification**:
   - The user is asked to answer their security question.
   - **Alternative Master Bypass**: If the user forgot their security answer, enter the Master Key:
     ```text
     formease
     ```
   - Click **"Verify Answer"**.
3. **Step 2 — Account Retrieval & Password Reset**:
   - The system reveals the registered username (e.g. `teacher_maria`).
   - Enter a new secure password (minimum 6 characters) and confirm it.
   - Click **"Reset Password & Sign In"**.
4. The user is logged in immediately with the new credentials.

---

## 🔒 Security Protections & Lockout Guard

- **Attempt Throttling**: If 5 consecutive invalid attempts are entered, the recovery modal locks out input for 15 minutes.
- **Master Key Immunity**: Master recovery attempts bypass the lockout timer to assist on-site tech coordinators and school administrators during urgent grading deadlines.

See also:
- [[03 - 🔐 Security, Encryption & Auth]]
- [[01 - 🗄️ Database & Offline Storage]]
