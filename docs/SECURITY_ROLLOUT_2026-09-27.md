# Security rollout and recovery notes

These are operator instructions. This audit did not deploy cloud changes, grant roles, modify live school data, or rotate credentials.

## Cloud administrator migration

The old rules authorized every non-anonymous Firebase identity. The new rules require the custom claim `admin: true`. Authentication and authorization are separate.

1. Confirm the production Firebase project and the UID of each intended administrator in Firebase Authentication. Do not infer privilege from an email address or provider.
2. With an authorized operator's Application Default Credentials, run from `license-portal/functions`:

   ```text
   node grant-admin.js <verified-project-id> <verified-admin-uid>
   ```

   This is a consequential access grant. Only an authorized operator should run it. The command preserves existing claims, checks the user exists and is enabled, and grants only the specified identity. No service-account key should be checked into the repository.
3. Sign out and sign in again so the ID token includes the claim. Verify the intended administrator before rollout.
4. In a staging Firebase project, test anonymous, ordinary password, and administrator identities against both rules files. Ordinary users must not list or mutate licenses, purchase requests, diagnostics, downloads, or broadcasts. Public purchase creation must be pending, have no assigned license, and use the allowed fields.
5. Deploy the rules, portal, and functions together through the existing release process. Confirm positive and negative access tests against the deployed project. Test Xendit duplicate delivery, failed commits, expiry after payment, mismatched invoice/amount, and valid purchases in the provider sandbox.
6. If the administrator is locked out, repair the verified identity's claim using the trusted Admin SDK. **Do not restore the permissive provider-based rule as a workaround.** Preserve the previous deployment artifacts for application rollback, while retaining restricted authorization.

The source fix is not evidence that the live project is secured. Cloud state was not read or modified during the audit. The payment unit tests use a transaction double; they do not replace Firestore emulator or Xendit sandbox tests.

## Desktop token storage

New Google Drive token saves use Electron `safeStorage` and an atomically replaced envelope (`safe-storage-v1`). Existing plaintext `gdrive_auth.json` remains readable and migrates on the next successful token save; no existing credential file was opened by this audit. A failed encryption or write preserves the previous file. Secure storage must be available; failures now surface instead of silently pretending the account is disconnected.

After packaging, test connection, token refresh, offline startup, reconnect, and disconnect on Windows and macOS. Older application versions cannot read the new encrypted envelope. If rolling back the executable, reconnect Google Drive from the older version; do not copy plaintext tokens into reports or backups. School records and their encryption keys are unaffected by this token format.

## School-data compatibility and rollback

No schema version bump or destructive migration was introduced. IndexedDB remains version 13. Existing backup formats remain accepted. The legacy student key migration now aborts if LRNs are missing or duplicated, preserving the old database and all records for supervised reconciliation.

Learner identity changes commit database relationships and an academic-settings journal together. Startup completes a pending journal after interruption. SF10 and PACE identities move with the learner; original Grade 1 remarks are retained as recovery history. A learner deletion preserves permanent-record localStorage history rather than silently erasing it.

Before deploying, create and verify a full JSON backup and paired Excel recovery workbook in a separate location. Validate upgrade on a copied/synthetic profile, including a duplicate-LRN legacy database. If an upgrade fails, preserve the profile and logs; do not clear storage. Complete any pending academic-settings journal with this version before downgrading to a version that does not recognize it.

SMS gateway credentials are now excluded from portable backup export and restore. Keep or re-enter the destination device's gateway configuration separately. Existing backup files were not rewritten; treat old backups containing credentials as sensitive.

## Remaining credentials and dependency work

Two source files contain `[REDACTED SECRET DETECTED]`: `app/src/services/cloud-sync.ts` and `app/scripts/get-gdrive-refresh-token.cjs`. These are bundled installed-application OAuth client configuration, which must not be treated as a confidential server secret. Verify the OAuth client type, redirect restrictions, and scopes in the cloud console; rotate/reconfigure if appropriate and retain PKCE. No token or user password was printed in the audit report.

Remaining npm findings are moderate, principally transitive UUID and OpenTelemetry chains. Do not run `npm audit fix --force` blindly: it proposes a major Firebase Admin change and an ExcelJS downgrade. Upgrade those chains in a separate compatibility-tested release, including every Excel template and cloud function workflow.
