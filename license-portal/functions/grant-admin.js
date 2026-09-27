// One-time operator command. Never called by the application or deployment.
// Usage: node grant-admin.js <firebase-project-id> <verified-admin-uid>
const admin = require('firebase-admin');
const [projectId, uid] = process.argv.slice(2);
if (!projectId || !uid) {
  console.error('Usage: node grant-admin.js <firebase-project-id> <verified-admin-uid>');
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId });
(async () => {
  const user = await admin.auth().getUser(uid);
  if (user.disabled) throw new Error('Cannot grant administrator access to a disabled account.');
  await admin.auth().setCustomUserClaims(uid, { ...user.customClaims, admin: true });
  console.log('Administrator claim granted. Sign out and sign in again before testing access.');
})().catch(error => { console.error('Unable to grant administrator claim:', error.code || error.message); process.exitCode = 1; });
