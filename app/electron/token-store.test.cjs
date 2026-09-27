const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readTokenFile, writeTokenFile } = require('./token-store.cjs');
test('legacy tokens migrate on save and failed protection preserves the previous file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'formease-token-test-'));
  const filename = path.join(dir, 'tokens.json');
  // A deterministic fake protector tests the file protocol, not OS cryptography.
  const protector = { isEncryptionAvailable: () => true, encryptString: s => Buffer.from(s.split('').reverse().join('')), decryptString: b => b.toString().split('').reverse().join('') };
  const data = { refresh_token: 'synthetic-token' };
  try {
    fs.writeFileSync(filename, JSON.stringify(data));
    assert.deepEqual(readTokenFile(filename, protector), data);
    writeTokenFile(filename, data, protector);
    assert.equal(fs.readFileSync(filename, 'utf8').includes('synthetic-token'), false);
    assert.deepEqual(readTokenFile(filename, protector), data);
    const previous = fs.readFileSync(filename, 'utf8');
    assert.throws(() => writeTokenFile(filename, {}, { ...protector, isEncryptionAvailable: () => false }));
    assert.equal(fs.readFileSync(filename, 'utf8'), previous);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
