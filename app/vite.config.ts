import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'
import { join } from 'path'
import { networkInterfaces } from 'os'
import { randomBytes, timingSafeEqual } from 'crypto'

const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))

function attendanceApiPlugin() {
  let activeAttendanceSession: {
    date: string;
    records: unknown[];
    students: unknown[];
    sections: unknown[];
    schoolProfile: unknown;
    lastUpdated: number;
  } = {
    date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
    records: [],
    students: [],
    sections: [],
    schoolProfile: null,
    lastUpdated: Date.now(),
  };
  const syncEventsQueue: Array<{ timestamp: number; record: unknown }> = [];
  let lastEventTimestamp = 0;
  let activePairing: { token: string; expiresAt: number } | null = null;
  const pairingTtlMs = 2 * 60 * 60 * 1000;
  const nextEventTimestamp = () => {
    lastEventTimestamp = Math.max(Date.now(), lastEventTimestamp + 1);
    return lastEventTimestamp;
  };

  const isLoopback = (address?: string) => {
    const normalized = String(address || '').replace(/^::ffff:/, '');
    return normalized === '127.0.0.1' || normalized === '::1';
  };
  const isLocalDesktopRequest = (req: import('http').IncomingMessage) => {
    if (!isLoopback(req.socket.remoteAddress)) return false;
    const host = String(req.headers.host || '').toLowerCase();
    const hostname = host.startsWith('[') ? host.slice(1, host.indexOf(']')) : host.split(':')[0];
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  };
  const isAllowedOrigin = (req: import('http').IncomingMessage) => {
    const origin = req.headers.origin;
    if (!origin || origin === 'null') return !origin;
    try {
      const originHost = new URL(origin).hostname;
      const host = String(req.headers.host || '').toLowerCase();
      const requestHost = host.startsWith('[') ? host.slice(1, host.indexOf(']')) : host.split(':')[0];
      return originHost === requestHost;
    } catch {
      return false;
    }
  };
  const tokenMatches = (candidate: string) => {
    if (!activePairing || activePairing.expiresAt <= Date.now()) {
      activePairing = null;
      return false;
    }
    const left = Buffer.from(candidate || '');
    const right = Buffer.from(activePairing.token);
    return left.length === right.length && timingSafeEqual(left, right);
  };
  const requestToken = (req: import('http').IncomingMessage) => {
    const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || '';
  };

  return {
    name: 'vite-plugin-attendance-api',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if ((url.startsWith('/api/attendance/') || url.startsWith('/api/network-ip')) && !isAllowedOrigin(req)) {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: 'Origin not allowed' }));
          return;
        }
        if (url.startsWith('/api/attendance/pairing')) {
          res.setHeader('Cache-Control', 'no-store');
          if (req.method === 'POST') {
            if (!isLocalDesktopRequest(req)) {
              res.statusCode = 403;
              res.end(JSON.stringify({ error: 'Pairing can only be started on the desktop' }));
              return;
            }
            activePairing = {
              token: randomBytes(32).toString('base64url'),
              expiresAt: Date.now() + pairingTtlMs,
            };
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(activePairing));
            return;
          }
          if (req.method === 'DELETE') {
            if (!isLocalDesktopRequest(req)) {
              res.statusCode = 403;
              res.end(JSON.stringify({ error: 'Pairing can only be revoked on the desktop' }));
              return;
            }
            if (!tokenMatches(requestToken(req))) {
              res.statusCode = 401;
              res.end(JSON.stringify({ error: 'A valid mobile attendance pairing is required' }));
              return;
            }
            activePairing = null;
            res.statusCode = 204;
            res.end();
            return;
          }
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        if (url.startsWith('/api/attendance/')) {
          if (req.method === 'OPTIONS') {
            if (req.headers.origin) {
              res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
              res.setHeader('Vary', 'Origin');
            }
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
            res.statusCode = 204;
            res.end();
            return;
          }
          if (!tokenMatches(requestToken(req))) {
            res.statusCode = 401;
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'A valid mobile attendance pairing is required' }));
            return;
          }
          res.setHeader('Cache-Control', 'no-store');
        }

        if (url.startsWith('/api/network-ip')) {
          if (!isLocalDesktopRequest(req)) {
            res.statusCode = 403;
            res.end(JSON.stringify({ error: 'Network discovery is desktop-only' }));
            return;
          }
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }
          const interfaces = networkInterfaces();
          let bestIp = 'localhost';
          const candidates: Array<{ name: string; address: string }> = [];
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
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ip: bestIp, candidates }));
          return;
        }

        if (url.startsWith('/api/attendance/session')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }
          if (req.method === 'POST') {
            if (!isLoopback(req.socket.remoteAddress)) {
              res.statusCode = 403;
              res.end(JSON.stringify({ error: 'Only the desktop can replace the attendance session' }));
              return;
            }
            let body = '';
            let tooLarge = false;
            req.on('data', (chunk) => {
              if (body.length + chunk.length > 10 * 1024 * 1024) {
                tooLarge = true;
                return;
              }
              body += chunk;
            });
            req.on('end', () => {
              if (tooLarge) {
                res.statusCode = 413;
                res.end(JSON.stringify({ error: 'Attendance session is too large' }));
                return;
              }
              try {
                const parsed = JSON.parse(body || '{}');
                if (!parsed || typeof parsed !== 'object'
                  || (parsed.students && !Array.isArray(parsed.students))
                  || (parsed.sections && !Array.isArray(parsed.sections))
                  || (parsed.records && !Array.isArray(parsed.records))
                  || (parsed.students?.length || 0) > 10000
                  || (parsed.sections?.length || 0) > 1000
                  || (parsed.records?.length || 0) > 50000) {
                  throw new Error('Invalid attendance session');
                }
                activeAttendanceSession = {
                  date: parsed.date || activeAttendanceSession.date,
                  records: Array.isArray(parsed.records) ? parsed.records.map((record: Record<string, unknown>) => ({
                    id: typeof record?.id === 'string' ? record.id.slice(0, 200) : '',
                    student_lrn: typeof record?.student_lrn === 'string' ? record.student_lrn.slice(0, 64) : '',
                    section_id: typeof record?.section_id === 'string' ? record.section_id.slice(0, 200) : '',
                    date: typeof record?.date === 'string' ? record.date.slice(0, 10) : '',
                    status: typeof record?.status === 'string' ? record.status.slice(0, 20) : '',
                    time_in: typeof record?.time_in === 'string' ? record.time_in.slice(0, 20) : undefined,
                    time_out: typeof record?.time_out === 'string' ? record.time_out.slice(0, 20) : undefined,
                  })) : activeAttendanceSession.records,
                  students: Array.isArray(parsed.students) ? parsed.students.map((student: Record<string, unknown>) => ({
                    lrn: typeof student?.lrn === 'string' ? student.lrn.slice(0, 64) : '',
                    first_name: typeof student?.first_name === 'string' ? student.first_name.slice(0, 200) : '',
                    last_name: typeof student?.last_name === 'string' ? student.last_name.slice(0, 200) : '',
                    middle_name: typeof student?.middle_name === 'string' ? student.middle_name.slice(0, 200) : '',
                    name_extension: typeof student?.name_extension === 'string' ? student.name_extension.slice(0, 30) : '',
                    gender: typeof student?.gender === 'string' ? student.gender.slice(0, 20) : '',
                    grade_level: typeof student?.grade_level === 'string' ? student.grade_level.slice(0, 50) : '',
                    student_section: typeof student?.student_section === 'string' ? student.student_section.slice(0, 200) : '',
                  })) : activeAttendanceSession.students,
                  sections: Array.isArray(parsed.sections) ? parsed.sections.map((section: Record<string, unknown>) => ({
                    id: typeof section?.id === 'string' ? section.id.slice(0, 200) : '',
                    section_name: typeof section?.section_name === 'string' ? section.section_name.slice(0, 200) : '',
                    is_advisory: section?.is_advisory === true,
                  })) : activeAttendanceSession.sections,
                  schoolProfile: parsed.schoolProfile && typeof parsed.schoolProfile === 'object'
                    ? { name: typeof parsed.schoolProfile.name === 'string' ? parsed.schoolProfile.name.slice(0, 200) : '' }
                    : activeAttendanceSession.schoolProfile,
                  lastUpdated: Date.now(),
                };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, count: activeAttendanceSession.records.length, studentCount: activeAttendanceSession.students.length }));
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(activeAttendanceSession));
          return;
        }

        if (url.startsWith('/api/attendance/update')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }
          if (req.method === 'POST') {
            let body = '';
            let tooLarge = false;
            req.on('data', (chunk) => {
              if (body.length + chunk.length > 1024 * 1024) {
                tooLarge = true;
                return;
              }
              body += chunk;
            });
            req.on('end', () => {
              if (tooLarge) {
                res.statusCode = 413;
                res.end(JSON.stringify({ error: 'Attendance update is too large' }));
                return;
              }
              try {
                const event = JSON.parse(body || '{}');
                const validStatuses = new Set(['present', 'absent', 'late', 'cutting', 'excused']);
                const record = event?.record;
                const isValidRecord = event?.type === 'ATTENDANCE_UPDATE'
                  && record && typeof record === 'object'
                  && typeof record.student_lrn === 'string' && record.student_lrn.length > 0 && record.student_lrn.length <= 64
                  && typeof record.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(record.date)
                  && validStatuses.has(record.status);
                if (isValidRecord) {
                  // Always stamp with server time to avoid cross-device clock skew
                  event.timestamp = nextEventTimestamp();
                  syncEventsQueue.push(event);
                  if (syncEventsQueue.length > 500) syncEventsQueue.shift();

                  const rec = {
                    id: typeof event.record.id === 'string' ? event.record.id.slice(0, 200) : '',
                    student_lrn: event.record.student_lrn.slice(0, 64),
                    section_id: typeof event.record.section_id === 'string' ? event.record.section_id.slice(0, 200) : '',
                    date: event.record.date.slice(0, 10),
                    status: event.record.status.slice(0, 20),
                    time_in: typeof event.record.time_in === 'string' ? event.record.time_in.slice(0, 20) : undefined,
                    time_out: typeof event.record.time_out === 'string' ? event.record.time_out.slice(0, 20) : undefined,
                  };
                  event.record = rec;
                  const idx = (activeAttendanceSession.records as Array<{ id?: string; student_lrn?: string; date?: string }>).findIndex(
                    r => (r.id && r.id === rec.id) || (r.student_lrn === rec.student_lrn && r.date === rec.date)
                  );
                  if (idx >= 0) {
                    activeAttendanceSession.records[idx] = rec;
                  } else {
                    activeAttendanceSession.records.push(rec);
                  }
                  activeAttendanceSession.lastUpdated = Date.now();

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, event }));
                  return;
                }
              } catch { /* ignore */ }
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing record' }));
            });
            return;
          }
        }

        if (url.startsWith('/api/attendance/updates')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', '*');
          const urlObj = new URL(url, 'http://localhost');
          const since = parseInt(urlObj.searchParams.get('since') || '0', 10);
          const newEvents = syncEventsQueue.filter(e => e.timestamp > since);
          const now = Math.max(Date.now(), lastEventTimestamp);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            serverTime: now,
            lastUpdated: activeAttendanceSession.lastUpdated,
            events: newEvents
          }));
          return;
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(() => ({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    react(), 
    !process.env.VITEST ? tailwindcss() : null,
    attendanceApiPlugin(),
    // Frontend bundle obfuscator is disabled because React runtime JIT and V8 inline caches
    // are severely degraded by string array lookups on every render and calculation.
    // Electron main/preload/license are protected via scripts/obfuscate-electron.cjs.
  ].filter(Boolean),
  esbuild: {
    target: 'es2022',
    legalComments: 'none',
  },
  css: {
    devSourcemap: false,
  },
  server: {
    port: 3001,
    strictPort: false,
    host: true,
    proxy: {
      '/api-sms-cloud': {
        target: 'https://api.sms-gate.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-sms-cloud/, ''),
      },
    },
    hmr: {
      overlay: true,
    },
    watch: {
      ignored: ['**/release/**', '**/dist/**', '**/dist-electron/**', '**/.git/**', '**/build/**'],
    },
    warmup: {
      clientFiles: ['./src/main.tsx', './src/App.tsx'],
    },
  },
  optimizeDeps: {
    holdUntilCrawlEnd: true,
    include: [
      '@react-pdf/renderer',
      'unicode-trie',
      'dfa',
      'restructure',
      'fontkit',
      'base64-js',
      'brotli',
      'tiny-inflate',
      'unicode-properties',
      'buffer',
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'lucide-react',
      'framer-motion',
      'recharts',
      'zustand',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'html2canvas-pro',
      'jsbarcode',
      'qrcode.react',
    ],
    exclude: ['pdf-parse'],
  },
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('@react-pdf') || 
              id.includes('pdfjs-dist') || 
              id.includes('pdf-lib') || 
              id.includes('jspdf') || 
              id.includes('html2canvas')
            ) {
              return 'vendor-pdf-libs';
            }
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer-motion';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    exclude: ['node_modules/**'],
    testTimeout: 30000,
  },
}))
// Trigger restart
