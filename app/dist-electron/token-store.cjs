const fs = require('node:fs');

function readTokenFile(filename, protector) {
  if (!fs.existsSync(filename)) return null;
  const stored = JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (stored.format !== 'safe-storage-v1') return stored; // Legacy; migrated on next successful token save.
  if (!protector.isEncryptionAvailable()) throw new Error('Secure credential storage is unavailable.');
  return JSON.parse(protector.decryptString(Buffer.from(stored.data, 'base64')));
}

function writeTokenFile(filename, data, protector) {
  if (!protector.isEncryptionAvailable()) throw new Error('Secure credential storage is unavailable.');
  const envelope = { format: 'safe-storage-v1', data: protector.encryptString(JSON.stringify(data)).toString('base64') };
  const temporary = `${filename}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(envelope), { mode: 0o600 });
    // Verify before replacing the previous working credentials.
    readTokenFile(temporary, protector);
    fs.renameSync(temporary, filename);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}
module.exports = { readTokenFile, writeTokenFile };
