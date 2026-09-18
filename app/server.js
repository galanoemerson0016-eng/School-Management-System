/**
 * FormEase G7 — Backend Server
 * =============================
 * Express server for serving the React frontend.
 * Runs on localhost:3001 when packaged, or dev server port when in development.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

const DEFAULT_PAIRING_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_STUDENTS = 10000;
const MAX_SECTIONS = 1000;
const MAX_ATTENDANCE_RECORDS = 50000;

// Middleware. Ten megabytes is ample for a large school roster while limiting
// the memory impact of a malformed request on the LAN-facing process.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS Middleware for Local Network Mobile Sync
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    let allowed = false;
    try {
      const originHost = new URL(origin).hostname;
      const requestHost = String(req.headers.host || '').replace(/^\[/, '').split(/\]:|:/)[0];
      allowed = allowed || originHost === requestHost || ['localhost', '127.0.0.1', '::1'].includes(originHost);
    } catch {
      allowed = false;
    }
    if (!allowed) {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Resolve dist directory (works both in development and packaged Electron app)
const distPath = fs.existsSync(path.join(__dirname, 'dist'))
  ? path.join(__dirname, 'dist')
  : path.join(__dirname, '..', 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

function getLocalDateIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// In-Memory Live Mobile Attendance Buffer
let activeAttendanceSession = {
  date: getLocalDateIso(),
  records: [],
  students: [],
  sections: [],
  schoolProfile: null,
  lastUpdated: Date.now()
};
let syncEventsQueue = [];
let lastEventTimestamp = 0;
let activePairing = { token: null, expiresAt: 0 };

function nextEventTimestamp() {
  lastEventTimestamp = Math.max(Date.now(), lastEventTimestamp + 1);
  return lastEventTimestamp;
}

function secureTokenEquals(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || !left || !right) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function startAttendancePairing(ttlMs = DEFAULT_PAIRING_TTL_MS) {
  const safeTtl = Number.isFinite(ttlMs) ? Math.min(Math.max(ttlMs, 1000), DEFAULT_PAIRING_TTL_MS) : DEFAULT_PAIRING_TTL_MS;
  activePairing = {
    token: crypto.randomBytes(32).toString('base64url'),
    expiresAt: Date.now() + safeTtl,
  };
  return { ...activePairing };
}

function revokeAttendancePairing(token) {
  if (token && activePairing.token && !secureTokenEquals(token, activePairing.token)) return false;
  activePairing = { token: null, expiresAt: 0 };
  return true;
}

function isAttendancePairingValid(token) {
  if (!activePairing.token || activePairing.expiresAt <= Date.now()) {
    activePairing = { token: null, expiresAt: 0 };
    return false;
  }
  return secureTokenEquals(token, activePairing.token);
}

function getRequestPairingToken(req) {
  const authorization = String(req.headers.authorization || '');
  const bearer = authorization.match(/^Bearer\s+(.+)$/i);
  return bearer ? bearer[1].trim() : '';
}

function requireAttendancePairing(req, res, next) {
  if (!isAttendancePairingValid(getRequestPairingToken(req))) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(401).json({ error: 'A valid mobile attendance pairing is required' });
  }
  res.setHeader('Cache-Control', 'no-store');
  next();
}

function isLoopbackRequest(req) {
  const address = String(req.socket?.remoteAddress || '').replace(/^::ffff:/, '');
  return address === '127.0.0.1' || address === '::1';
}

function isLocalDesktopRequest(req) {
  if (!isLoopbackRequest(req)) return false;
  const host = String(req.headers.host || '').toLowerCase();
  const hostname = host.startsWith('[') ? host.slice(1, host.indexOf(']')) : host.split(':')[0];
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isValidAttendanceRecord(record) {
  if (!record || typeof record !== 'object') return false;
  const validStatuses = new Set(['present', 'absent', 'late', 'cutting', 'excused']);
  return typeof record.student_lrn === 'string'
    && record.student_lrn.length > 0
    && record.student_lrn.length <= 64
    && typeof record.date === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(record.date)
    && validStatuses.has(record.status);
}

function text(value, maxLength = 200) {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

function projectMobileStudent(student) {
  return {
    lrn: text(student?.lrn, 64),
    first_name: text(student?.first_name),
    last_name: text(student?.last_name),
    middle_name: text(student?.middle_name),
    name_extension: text(student?.name_extension, 30),
    gender: text(student?.gender, 20),
    grade_level: text(student?.grade_level, 50),
    student_section: text(student?.student_section, 200),
  };
}

function projectMobileSection(section) {
  return {
    id: text(section?.id, 200),
    section_name: text(section?.section_name, 200),
    is_advisory: section?.is_advisory === true,
  };
}

function projectMobileRecord(record) {
  return {
    id: text(record?.id, 200),
    student_lrn: text(record?.student_lrn, 64),
    section_id: text(record?.section_id, 200),
    date: text(record?.date, 10),
    status: text(record?.status, 20),
    time_in: text(record?.time_in, 20) || undefined,
    time_out: text(record?.time_out, 20) || undefined,
  };
}

function updateActiveSession(data) {
  if (!data || typeof data !== 'object') return false;
  if ((data.students && !Array.isArray(data.students))
    || (data.sections && !Array.isArray(data.sections))
    || (data.records && !Array.isArray(data.records))) return false;
  if ((data.students?.length || 0) > MAX_STUDENTS
    || (data.sections?.length || 0) > MAX_SECTIONS
    || (data.records?.length || 0) > MAX_ATTENDANCE_RECORDS) return false;
  const newStudents = Array.isArray(data.students)
    ? data.students.map(projectMobileStudent)
    : activeAttendanceSession.students;
  const newSections = Array.isArray(data.sections)
    ? data.sections.map(projectMobileSection)
    : activeAttendanceSession.sections;
  const newRecords = Array.isArray(data.records) ? data.records.map(projectMobileRecord) : activeAttendanceSession.records;

  activeAttendanceSession = {
    date: data.date || activeAttendanceSession.date,
    records: newRecords,
    students: newStudents,
    sections: newSections,
    schoolProfile: data.schoolProfile && typeof data.schoolProfile === 'object'
      ? { name: text(data.schoolProfile.name) }
      : activeAttendanceSession.schoolProfile,
    lastUpdated: Date.now()
  };
  return true;
}

// Pairing may only be initiated by the desktop on this computer. The secret is
// then carried inside the QR fragment and sent as a bearer token by the phone.
app.post('/api/attendance/pairing', (req, res) => {
  if (!isLocalDesktopRequest(req)) return res.status(403).json({ error: 'Pairing can only be started on the desktop' });
  res.setHeader('Cache-Control', 'no-store');
  res.json(startAttendancePairing());
});

app.delete('/api/attendance/pairing', requireAttendancePairing, (req, res) => {
  if (!isLocalDesktopRequest(req)) return res.status(403).json({ error: 'Pairing can only be revoked on the desktop' });
  revokeAttendancePairing(getRequestPairingToken(req));
  res.status(204).end();
});

// Local LAN Network IP Discovery Endpoint
app.get('/api/network-ip', (req, res) => {
  if (!isLocalDesktopRequest(req)) return res.status(403).json({ error: 'Network discovery is desktop-only' });
  const interfaces = os.networkInterfaces();
  const candidates = [];
  let bestIp = 'localhost';

  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue;
    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) {
        candidates.push({ name, address: net.address });
        if (bestIp === 'localhost' || bestIp === '127.0.0.1') {
          bestIp = net.address;
        }
      }
    }
  }

  res.json({ ip: bestIp, candidates });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'FormEase Pro' });
});

// Sync Attendance State Endpoint
app.get('/api/attendance/session', requireAttendancePairing, (req, res) => {
  res.json(activeAttendanceSession);
});

app.post('/api/attendance/session', requireAttendancePairing, (req, res) => {
  if (!isLoopbackRequest(req)) {
    return res.status(403).json({ error: 'Only the desktop can replace the attendance session' });
  }
  if (!updateActiveSession(req.body)) {
    return res.status(400).json({ error: 'Invalid or oversized attendance session' });
  }
  res.json({ success: true, count: activeAttendanceSession.records.length, studentCount: activeAttendanceSession.students.length });
});

// Real-time Push Endpoint (from Smartphone or Desktop)
app.post('/api/attendance/update', requireAttendancePairing, (req, res) => {
  const event = req.body;
  if (!event || event.type !== 'ATTENDANCE_UPDATE' || !isValidAttendanceRecord(event.record)) {
    return res.status(400).json({ error: 'Invalid attendance update' });
  }

  // Always stamp with server time to avoid cross-device clock skew
  event.timestamp = nextEventTimestamp();
  syncEventsQueue.push(event);
  if (syncEventsQueue.length > 500) {
    syncEventsQueue.shift();
  }

  // Update session record in memory
  const rec = projectMobileRecord(event.record);
  event.record = rec;
  const idx = activeAttendanceSession.records.findIndex(
    r => (r.id && r.id === rec.id) || (r.student_lrn === rec.student_lrn && r.date === rec.date)
  );
  if (idx >= 0) {
    activeAttendanceSession.records[idx] = rec;
  } else {
    activeAttendanceSession.records.push(rec);
  }
  activeAttendanceSession.lastUpdated = Date.now();

  res.json({ success: true, event });
});

// Real-time Pull Endpoint for updates since timestamp
app.get('/api/attendance/updates', requireAttendancePairing, (req, res) => {
  const parsedSince = Number.parseInt(String(req.query.since || '0'), 10);
  const since = Number.isFinite(parsedSince) && parsedSince >= 0 ? parsedSince : 0;
  const newEvents = syncEventsQueue.filter(e => e.timestamp > since);
  const now = Math.max(Date.now(), lastEventTimestamp);
  res.json({
    serverTime: now,
    lastUpdated: activeAttendanceSession.lastUpdated,
    events: newEvents
  });
});

// SPA fallback: redirect all non-API requests to index.html
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});

// Start server on 0.0.0.0 so paired local-network devices can connect.
let server = null;
function startServer(port = PORT, host = '0.0.0.0') {
  if (server) return server;
  server = app.listen(port, host, () => {
    console.log(`[FormEase G7 Server] Running on http://${host}:${server.address()?.port || port}`);
    if (process.env.ELECTRON_MODE === '1') console.log('[FormEase G7 Server] Electron mode enabled');
  });
  return server;
}

// Graceful shutdown
process.on('SIGTERM', () => {
  if (!server) return;
  console.log('[FormEase G7 Server] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[FormEase G7 Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  if (!server) return;
  console.log('[FormEase G7 Server] SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('[FormEase G7 Server] Server closed');
    process.exit(0);
  });
});

if (require.main === module) startServer();

module.exports = {
  app,
  startServer,
  get server() { return server; },
  startAttendancePairing,
  revokeAttendancePairing,
  isAttendancePairingValid,
  updateActiveSession,
  getActiveSession: () => activeAttendanceSession,
  /** Push an attendance update event into the sync queue (used by Electron IPC) */
  pushSyncEvent: (event) => {
    if (!event || event.type !== 'ATTENDANCE_UPDATE' || !isValidAttendanceRecord(event.record)) return false;
    event.timestamp = nextEventTimestamp();
    syncEventsQueue.push(event);
    if (syncEventsQueue.length > 500) syncEventsQueue.shift();
    // Also update the in-memory session record
    const rec = projectMobileRecord(event.record);
    event.record = rec;
    const idx = activeAttendanceSession.records.findIndex(
      r => (r.id && r.id === rec.id) || (r.student_lrn === rec.student_lrn && r.date === rec.date)
    );
    if (idx >= 0) {
      activeAttendanceSession.records[idx] = rec;
    } else {
      activeAttendanceSession.records.push(rec);
    }
    activeAttendanceSession.lastUpdated = Date.now();
    return true;
  },
  /** Get sync events since a given timestamp (used by Electron IPC) */
  getSyncEventsSince: (since) => {
    const sinceTs = parseInt(since || '0', 10);
    const now = Math.max(Date.now(), lastEventTimestamp);
    return {
      serverTime: now,
      lastUpdated: activeAttendanceSession.lastUpdated,
      events: syncEventsQueue.filter(e => e.timestamp > sinceTs)
    };
  }
};
