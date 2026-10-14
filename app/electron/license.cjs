/**
 * Main-process license manager.
 *
 * The activation verdict lives HERE, not in the renderer. The renderer asks
 * for the verdict over IPC and receives a read-only answer; editing
 * localStorage or IndexedDB in the renderer can no longer unlock the app.
 *
 * The license record is persisted to userData/license.dat as JSON with an
 * HMAC over the payload, keyed from the hardware machine id. Editing the
 * file by hand invalidates the signature; copying it to another machine
 * invalidates the binding.
 */

const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { machineIdSync } = require('node-machine-id');

const PROJECT_ID = 'formease-licensing';
const LICENSE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/artifacts/g7-special/public/data/licenses`;
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const KEY_CONTEXT = 'formease-license-v1';

function getMachineId() {
  try {
    return machineIdSync().toUpperCase();
  } catch {
    return 'UNKNOWN-DEVICE';
  }
}

function getLicenseFilePath() {
  return path.join(app.getPath('userData'), 'license.dat');
}

function signPayload(payload) {
  const key = crypto.createHash('sha256').update(`${KEY_CONTEXT}::${getMachineId()}`).digest();
  return crypto.createHmac('sha256', key).update(JSON.stringify(payload)).digest('hex');
}

function readLicenseRecord() {
  try {
    const raw = fs.readFileSync(getLicenseFilePath(), 'utf8');
    const { payload, sig } = JSON.parse(raw);
    if (!payload || !sig) return null;

    const expected = signPayload(payload);
    const sigBuf = Buffer.from(String(sig), 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null; // tampered or copied from another machine
    }
    if (payload.machineId !== getMachineId()) return null;
    return payload;
  } catch {
    return null;
  }
}

function writeLicenseRecord(payload) {
  const record = { payload, sig: signPayload(payload) };
  fs.writeFileSync(getLicenseFilePath(), JSON.stringify(record));
}

function clearLicenseRecord() {
  try {
    fs.unlinkSync(getLicenseFilePath());
  } catch {
    // already absent
  }
}

/** Local (offline) verdict. */
function getStatus() {
  const record = readLicenseRecord();
  if (!record) {
    return { activated: false, reason: 'none' };
  }
  if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
    return { activated: false, reason: 'expired', serial: record.serial, expiresAt: record.expiresAt };
  }

  // Once activated and bound to this device, offline access is unrestricted.
  // Teachers and school staff can use FormEase Pro indefinitely offline
  // without being locked out or forced to re-register with their serial and name.
  return {
    activated: true,
    serial: record.serial,
    registeredTo: record.registeredTo,
    activatedAt: record.activatedAt,
    expiresAt: record.expiresAt,
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Verify a serial against the licensing service and bind it to this machine.
 * Used both for new activations and for migrating legacy installs whose
 * activation state previously lived only in the renderer.
 */
async function activate(serialInput, fullName, platform) {
  const serial = String(serialInput || '').trim().toUpperCase();
  if (!serial) {
    return { success: false, error: 'No serial key provided.' };
  }
  const machineId = getMachineId();

  let response;
  try {
    response = await fetchWithTimeout(`${LICENSE_BASE_URL}/${serial}`);
  } catch {
    return { success: false, offline: true, error: 'Could not reach the licensing server.' };
  }

  if (response.status === 404) {
    return { success: false, error: `Serial Key "${serial}" was not found.` };
  }
  if (!response.ok) {
    return { success: false, error: 'Server connection failed.' };
  }

  const docData = await response.json();
  const fields = docData.fields || {};
  const existingMachineId = fields.machine_id?.stringValue || '';
  const licensePlatform = fields.platform?.stringValue || 'windows';
  const remoteStatus = fields.status?.stringValue || '';
  const remoteExpiresAt = fields.expires_at?.timestampValue || '';

  const runningPlatform = process.platform === 'darwin' ? 'mac' : 'windows';
  if (licensePlatform && licensePlatform !== runningPlatform) {
    return {
      success: false,
      error: `Invalid License: This is a ${licensePlatform.toUpperCase()} key, but you are running on ${runningPlatform.toUpperCase()}.`,
    };
  }
  if (existingMachineId && existingMachineId !== machineId) {
    return { success: false, error: 'This license is registered to another computer.' };
  }

  const now = new Date();
  const durationMonths = parseInt(fields.duration_months?.integerValue || '12', 10) || 12;
  const durationMs = durationMonths * 30 * 24 * 60 * 60 * 1000;
  let expiresAt = remoteExpiresAt || new Date(now.getTime() + durationMs).toISOString();

  if (!existingMachineId) {
    // Claim the license for this machine
    expiresAt = remoteExpiresAt || new Date(now.getTime() + durationMs).toISOString();
    const patchUrl = `${LICENSE_BASE_URL}/${serial}?updateMask.fieldPaths=machine_id&updateMask.fieldPaths=activated_at&updateMask.fieldPaths=registered_to&updateMask.fieldPaths=status&updateMask.fieldPaths=expires_at`;
    try {
      const patchRes = await fetchWithTimeout(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            machine_id: { stringValue: machineId },
            activated_at: { timestampValue: now.toISOString() },
            expires_at: { timestampValue: expiresAt },
            registered_to: { stringValue: String(fullName || '').trim() },
            status: { stringValue: 'activated' },
          },
        }),
      });
      if (!patchRes.ok) {
        return { success: false, error: 'Could not register this computer to the license.' };
      }
    } catch {
      return { success: false, offline: true, error: 'Could not reach the licensing server.' };
    }
  } else if (remoteStatus && remoteStatus !== 'activated') {
    return { success: false, error: 'This license has been deactivated. Please contact support.' };
  }

  writeLicenseRecord({
    serial,
    machineId,
    registeredTo: String(fullName || '').trim(),
    activatedAt: now.toISOString(),
    expiresAt,
    lastVerifiedAt: now.toISOString(),
  });

  return { success: true, ...getStatus() };
}

/**
 * Background online re-verification of an existing local license.
 * Returns { revoked: true } when the licensing service says this serial is
 * no longer activated or is bound to a different machine.
 */
async function verifyOnline() {
  const record = readLicenseRecord();
  if (!record) return { revoked: false };

  let response;
  try {
    response = await fetchWithTimeout(`${LICENSE_BASE_URL}/${record.serial}`);
  } catch {
    return { revoked: false, offline: true }; // offline — keep local verdict
  }
  if (response.status === 404) {
    clearLicenseRecord();
    return { revoked: true };
  }
  if (!response.ok) {
    return { revoked: false }; // transient server issue — keep local verdict
  }

  const docData = await response.json();
  const fields = docData.fields || {};
  const remoteMachineId = fields.machine_id?.stringValue || '';
  const remoteStatus = fields.status?.stringValue || 'pending';

  if (remoteStatus !== 'activated' || (remoteMachineId && remoteMachineId !== getMachineId())) {
    clearLicenseRecord();
    return { revoked: true };
  }

  // Update last verified timestamp and sync remote expiration date
  const remoteExpiresAt = fields.expires_at?.timestampValue || '';
  writeLicenseRecord({
    ...record,
    expiresAt: remoteExpiresAt || record.expiresAt,
    lastVerifiedAt: new Date().toISOString()
  });

  return { revoked: false };
}

module.exports = { getStatus, activate, verifyOnline, clearLicenseRecord };
