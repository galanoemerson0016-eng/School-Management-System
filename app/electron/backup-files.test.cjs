const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { afterEach, test } = require('node:test');
const { createHash } = require('node:crypto');
const { saveBackupFile, saveBinaryBackupFile, rotateVerifiedBackupPairs } = require('./backup-files.cjs');

const directories = [];
afterEach(() => {
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

function makeDirectory() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'formease-workbook-backup-'));
  directories.push(directory);
  return directory;
}

test('saves a validated xlsx file atomically and verifies the bytes', () => {
  const directory = makeDirectory();
  const bytes = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x01, 0x02, 0x03]);
  const savedPath = saveBinaryBackupFile(directory, 'FormEase_Automated_fixture.xlsx', bytes.toString('base64'));
  assert.deepEqual(fs.readFileSync(savedPath), bytes);
  assert.deepEqual(fs.readdirSync(directory), ['FormEase_Automated_fixture.xlsx']);
});

test('rejects unsafe workbook names and non-xlsx content before writing', () => {
  const directory = makeDirectory();
  const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]).toString('base64');
  assert.throws(() => saveBinaryBackupFile(directory, '../outside.xlsx', zipHeader), /Invalid workbook/);
  assert.throws(() => saveBinaryBackupFile(directory, 'FormEase_fixture.xlsx', Buffer.from('not a zip').toString('base64')), /invalid|empty/i);
  assert.deepEqual(fs.readdirSync(directory), []);
});

function checksum(value) {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalJson(value) {
  return JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]]))
    : item);
}

function savePair(directory, stamp, snapshotId, workbookBytes, createdAt) {
  const payload = {
    students: [], sections: [], subjects: [], classRecords: [], gradingSheetRecords: [],
  };
  const backup = {
    metadata: { payloadHash: checksum(JSON.stringify(payload)), snapshotId },
    summary: {},
    payload,
    _checksumVersion: 2,
  };
  backup._checksum = checksum(canonicalJson(backup));
  const jsonName = `SMS_Backup_Automated_${stamp}.json`;
  const workbookName = `FormEase_Automated_${stamp}.xlsx`;
  const manifestName = `FormEase_Automated_${stamp}_Manifest.json`;
  saveBinaryBackupFile(directory, workbookName, workbookBytes.toString('base64'));
  saveBackupFile(directory, jsonName, backup);
  saveBackupFile(directory, manifestName, {
    schemaVersion: 1,
    status: 'verified-pair',
    snapshotId,
    createdAt,
    files: [
      { name: jsonName, sha256: backup._checksum },
      { name: workbookName, sha256: checksum(workbookBytes) },
    ],
  });
  return { jsonName, workbookName, manifestName };
}

test('retention removes only complete, checksum-verified pairs', () => {
  const directory = makeDirectory();
  const old = savePair(directory, '2026-09-20T00-00-00-000Z', 'old', Buffer.from([0x50, 0x4b, 3, 4, 1]), '2026-09-20T00:00:00.000Z');
  const recent = savePair(directory, '2026-09-25T00-00-00-000Z', 'recent', Buffer.from([0x50, 0x4b, 3, 4, 2]), '2026-09-25T00:00:00.000Z');
  const orphan = 'SMS_Backup_Automated_2026-09-19T00-00-00-000Z.json';
  fs.writeFileSync(path.join(directory, orphan), '{}');

  assert.equal(rotateVerifiedBackupPairs(directory, 1), 1);
  for (const filename of Object.values(old)) assert.equal(fs.existsSync(path.join(directory, filename)), false);
  for (const filename of Object.values(recent)) assert.equal(fs.existsSync(path.join(directory, filename)), true);
  assert.equal(fs.existsSync(path.join(directory, orphan)), true);
});
