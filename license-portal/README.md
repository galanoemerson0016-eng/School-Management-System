# FormEase License Portal

A standalone, premium administrative dashboard for managing FormEase G7 Special serial keys.

## Features
- **Key Generation**: Create unique 16-character serial keys.
- **Device Locking**: Monitor Machine IDs bound to each license.
- **Expiration Tracking**: Automatic calculation of 1-year subscriptions.
- **Revocation**: Securely disable keys if needed.

## Setup Instructions

### 1. Firebase Configuration
Create a **NEW** Firebase project (e.g., `formease-license-v2`) to isolate license data.
In the Firestore database, create the following structure:
- Collection: `artifacts`
  - Document: `g7-special`
    - Collection: `public`
      - Document: `data`
        - Collection: `licenses`

### 2. Update API URL in G7 Special App
In your main app (`app/src/pages/ActivationPage.tsx`), update the `projectId` to match your new project ID.

### 3. Local Development
```bash
cd license-portal
npm install
npm run dev
```

### 4. Deployment
Deploy this portal as a separate web app (e.g., via Firebase Hosting) to manage your keys from anywhere.

---
*Powered by FormEase Secure Licensing Infrastructure*
