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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS Middleware for Local Network Mobile Sync
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

function updateActiveSession(data) {
  if (!data) return;
  const newStudents = Array.isArray(data.students) && data.students.length > 0
    ? data.students
    : activeAttendanceSession.students;
  const newSections = Array.isArray(data.sections) && data.sections.length > 0
    ? data.sections
    : activeAttendanceSession.sections;
  const newRecords = Array.isArray(data.records) ? data.records : activeAttendanceSession.records;

  activeAttendanceSession = {
    date: data.date || activeAttendanceSession.date,
    records: newRecords,
    students: newStudents,
    sections: newSections,
    schoolProfile: data.schoolProfile || activeAttendanceSession.schoolProfile,
    lastUpdated: Date.now()
  };
}

// Local LAN Network IP Discovery Endpoint
app.get('/api/network-ip', (req, res) => {
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
  res.json({ status: 'ok', app: 'FormEase G7', sessionDate: activeAttendanceSession.date, studentCount: activeAttendanceSession.students.length });
});

// Sync Attendance State Endpoint
app.get('/api/attendance/session', (req, res) => {
  res.json(activeAttendanceSession);
});

app.post('/api/attendance/session', (req, res) => {
  if (req.body) {
    updateActiveSession(req.body);
  }
  res.json({ success: true, count: activeAttendanceSession.records.length, studentCount: activeAttendanceSession.students.length });
});

// Real-time Push Endpoint (from Smartphone or Desktop)
app.post('/api/attendance/update', (req, res) => {
  const event = req.body;
  if (!event || !event.record) {
    return res.status(400).json({ error: 'Missing record' });
  }

  // Always stamp with server time to avoid cross-device clock skew
  event.timestamp = Date.now();
  syncEventsQueue.push(event);
  if (syncEventsQueue.length > 500) {
    syncEventsQueue.shift();
  }

  // Update session record in memory
  const rec = event.record;
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
app.get('/api/attendance/updates', (req, res) => {
  const since = parseInt(req.query.since || '0', 10);
  const newEvents = syncEventsQueue.filter(e => e.timestamp > since);
  const now = Date.now();
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

// Start server on 0.0.0.0 so local network Wi-Fi devices can connect
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[FormEase G7 Server] Running on http://0.0.0.0:${PORT}`);
  if (process.env.ELECTRON_MODE === '1') {
    console.log('[FormEase G7 Server] Electron mode enabled');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[FormEase G7 Server] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[FormEase G7 Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[FormEase G7 Server] SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('[FormEase G7 Server] Server closed');
    process.exit(0);
  });
});

module.exports = {
  server,
  updateActiveSession,
  getActiveSession: () => activeAttendanceSession,
  /** Push an attendance update event into the sync queue (used by Electron IPC) */
  pushSyncEvent: (event) => {
    if (!event || !event.record) return;
    event.timestamp = Date.now();
    syncEventsQueue.push(event);
    if (syncEventsQueue.length > 500) syncEventsQueue.shift();
    // Also update the in-memory session record
    const rec = event.record;
    const idx = activeAttendanceSession.records.findIndex(
      r => (r.id && r.id === rec.id) || (r.student_lrn === rec.student_lrn && r.date === rec.date)
    );
    if (idx >= 0) {
      activeAttendanceSession.records[idx] = rec;
    } else {
      activeAttendanceSession.records.push(rec);
    }
    activeAttendanceSession.lastUpdated = Date.now();
  },
  /** Get sync events since a given timestamp (used by Electron IPC) */
  getSyncEventsSince: (since) => {
    const sinceTs = parseInt(since || '0', 10);
    const now = Date.now();
    return {
      serverTime: now,
      lastUpdated: activeAttendanceSession.lastUpdated,
      events: syncEventsQueue.filter(e => e.timestamp > sinceTs)
    };
  }
};
