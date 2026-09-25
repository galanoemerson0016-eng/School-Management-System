const fs = require('fs');
const path = require('path');
const { randomUUID, createHash } = require('crypto');

const AUTOMATED_BACKUP_NAME = /^SMS_Backup_Automated_[0-9TZ-]+\.json$/;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function verifyStrongComprehensiveBackup(backup) {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup) || backup._checksumVersion !== 2 ||
      typeof backup._checksum !== 'string' || !/^[a-f0-9]{64}$/.test(backup._checksum) ||
      !backup.payload || typeof backup.payload !== 'object' || Array.isArray(backup.payload) ||
      !['students', 'sections', 'subjects', 'classRecords', 'gradingSheetRecords'].every(key => Array.isArray(backup.payload[key])) ||
      typeof backup.metadata?.payloadHash !== 'string') return false;
  const { _checksum, ...withoutChecksum } = backup;
  const canonical = JSON.stringify(withoutChecksum, (_key, value) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]]))
      : value
  );
  return sha256(canonical) === _checksum &&
    sha256(JSON.stringify(backup.payload)) === backup.metadata.payloadHash;
}

function isInstallBackupReady(downloaded, providedFilename, savedFilename, downloadedAt, savedAt, now = Date.now()) {
  return downloaded === true && typeof providedFilename === 'string' &&
    /^SMS_Backup_Comprehensive_prerestore_[A-Za-z0-9._-]+\.json$/.test(providedFilename) &&
    providedFilename === savedFilename && savedAt >= downloadedAt &&
    savedAt > 0 && now >= savedAt && now - savedAt <= 5 * 60 * 1000;
}

function backupPath(backupDir, filename) {
  if (typeof filename !== 'string' ||
      filename.length === 0 || filename.length > 240 ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(filename) ||
      filename.includes('..') || path.basename(filename) !== filename) {
    throw new Error('Invalid backup filename.');
  }
  return path.join(backupDir, filename);
}

function binaryBackupPath(backupDir, filename) {
  if (typeof filename !== 'string' || filename.length === 0 || filename.length > 240 ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]*\.xlsx$/.test(filename) || filename.includes('..') ||
      path.basename(filename) !== filename) {
    throw new Error('Invalid workbook backup filename.');
  }
  return path.join(backupDir, filename);
}

function saveBinaryBackupFile(backupDir, filename, base64Data) {
  const filePath = binaryBackupPath(backupDir, filename);
  if (typeof base64Data !== 'string' || base64Data.length > 100 * 1024 * 1024 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64Data)) {
    throw new Error('Workbook backup data is invalid or too large.');
  }
  const bytes = Buffer.from(base64Data, 'base64');
  if (bytes.length < 4 || bytes.length > 75 * 1024 * 1024 ||
      bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
    throw new Error('Workbook backup data is empty or too large.');
  }
  fs.mkdirSync(backupDir, { recursive: true });
  if (fs.existsSync(filePath)) throw new Error('A workbook with this filename already exists.');
  const temporaryPath = path.join(backupDir, `.formease-write-${randomUUID()}.tmp`);
  const descriptor = fs.openSync(temporaryPath, 'wx', 0o600);
  try {
    try {
      fs.writeFileSync(descriptor, bytes);
      fs.fsyncSync(descriptor);
    } finally {
      fs.closeSync(descriptor);
    }
    fs.linkSync(temporaryPath, filePath);
    const saved = fs.readFileSync(filePath);
    if (!saved.equals(bytes)) throw new Error('Saved workbook did not pass readback verification.');
  } finally {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
  }
  return filePath;
}

function rotateVerifiedBackupPairs(backupDir, retentionLimit) {
  if (!Number.isSafeInteger(retentionLimit) || retentionLimit <= 0 || !fs.existsSync(backupDir)) return 0;
  const pairs = [];
  for (const manifestFilename of fs.readdirSync(backupDir)) {
    const match = /^FormEase_Automated_([0-9a-fTZ-]+)_Manifest\.json$/.exec(manifestFilename);
    if (!match) continue;
    try {
      const stamp = match[1];
      const jsonFilename = `SMS_Backup_Automated_${stamp}.json`;
      const workbookFilename = `FormEase_Automated_${stamp}.xlsx`;
      const manifest = readBackupFile(backupDir, manifestFilename);
      if (manifest.schemaVersion !== 1 || manifest.status !== 'verified-pair' ||
          manifest.files?.length !== 2 || manifest.files[0]?.name !== jsonFilename ||
          manifest.files[1]?.name !== workbookFilename) continue;
      const fullBackup = readBackupFile(backupDir, jsonFilename);
      if (!verifyStrongComprehensiveBackup(fullBackup) || fullBackup.metadata.snapshotId !== manifest.snapshotId ||
          fullBackup._checksum !== manifest.files[0].sha256) continue;
      const workbookPath = binaryBackupPath(backupDir, workbookFilename);
      const workbookStats = fs.lstatSync(workbookPath);
      if (!workbookStats.isFile() || workbookStats.isSymbolicLink()) continue;
      const workbookHash = createHash('sha256').update(fs.readFileSync(workbookPath)).digest('hex');
      if (workbookHash !== manifest.files[1].sha256) continue;
      pairs.push({ stamp, manifestFilename, jsonFilename, workbookFilename, time: Date.parse(manifest.createdAt) || workbookStats.mtimeMs });
    } catch {
      // Never prune a backup group whose membership or integrity is uncertain.
    }
  }
  pairs.sort((a, b) => b.time - a.time || b.stamp.localeCompare(a.stamp));
  const expired = pairs.slice(retentionLimit);
  for (const pair of expired) {
    for (const filename of [pair.manifestFilename, pair.jsonFilename, pair.workbookFilename]) {
      const filePath = filename.endsWith('.xlsx') ? binaryBackupPath(backupDir, filename) : backupPath(backupDir, filename);
      const stats = fs.lstatSync(filePath);
      if (!stats.isFile() || stats.isSymbolicLink()) throw new Error('A paired backup file is not a regular file.');
    }
    for (const filename of [pair.manifestFilename, pair.jsonFilename, pair.workbookFilename]) {
      fs.unlinkSync(filename.endsWith('.xlsx') ? binaryBackupPath(backupDir, filename) : backupPath(backupDir, filename));
    }
  }
  return expired.length;
}

function readBackupFile(backupDir, filename) {
  const filePath = backupPath(backupDir, filename);
  const stats = fs.lstatSync(filePath);
  if (!stats.isFile() || stats.isSymbolicLink()) throw new Error('Backup is not a regular file.');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function deleteBackupFile(backupDir, filename) {
  const filePath = backupPath(backupDir, filename);
  if (!fs.existsSync(filePath)) return;
  const stats = fs.lstatSync(filePath);
  if (!stats.isFile() || stats.isSymbolicLink()) throw new Error('Backup is not a regular file.');
  fs.unlinkSync(filePath);
}

function saveBackupFile(backupDir, filename, data, retentionLimit = 0) {
  const filePath = backupPath(backupDir, filename);
  const serialized = JSON.stringify(data, null, 2);
  if (typeof serialized !== 'string') throw new Error('Backup data cannot be serialized.');
  fs.mkdirSync(backupDir, { recursive: true });
  if (fs.existsSync(filePath)) throw new Error('A backup with this filename already exists.');

  // Write and flush a new temporary file, then link it to the final name.
  // A hard link cannot replace an existing user backup even on a racing save.
  const temporaryPath = path.join(backupDir, `.formease-write-${randomUUID()}.tmp`);
  const descriptor = fs.openSync(temporaryPath, 'wx', 0o600);
  try {
    try {
      fs.writeFileSync(descriptor, serialized);
      fs.fsyncSync(descriptor);
    } finally {
      fs.closeSync(descriptor);
    }
    fs.linkSync(temporaryPath, filePath);
    if (fs.readFileSync(filePath, 'utf8') !== serialized) {
      throw new Error('Saved backup did not pass readback verification.');
    }
  } finally {
    // This path was uniquely created by this call. A failed final backup is
    // deliberately retained for diagnosis; only its private staging name goes.
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
  }

  // Older automated files share a prefix with manual exports, so only the new
  // dedicated name may participate in automatic retention.
  if (AUTOMATED_BACKUP_NAME.test(filename) && Number.isSafeInteger(retentionLimit) && retentionLimit > 0) {
    const automated = fs.readdirSync(backupDir)
      .filter(name => AUTOMATED_BACKUP_NAME.test(name))
      .map(name => ({ name, filePath: backupPath(backupDir, name) }))
      .filter(entry => {
        const stats = fs.lstatSync(entry.filePath);
        return stats.isFile() && !stats.isSymbolicLink();
      })
      .map(entry => ({ ...entry, time: fs.statSync(entry.filePath).mtimeMs }))
      .sort((a, b) => b.time - a.time || b.name.localeCompare(a.name));
    for (const expired of automated.slice(retentionLimit)) {
      fs.unlinkSync(expired.filePath);
    }
  }

  return filePath;
}

module.exports = { backupPath, readBackupFile, deleteBackupFile, saveBackupFile, saveBinaryBackupFile, rotateVerifiedBackupPairs, verifyStrongComprehensiveBackup, isInstallBackupReady };
