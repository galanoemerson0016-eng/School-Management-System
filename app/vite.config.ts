import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { obfuscate } from 'javascript-obfuscator'
import type { ObfuscatorOptions } from 'javascript-obfuscator'
import { readFileSync } from 'fs'
import { join } from 'path'
import { networkInterfaces } from 'os'

const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))

// Light obfuscation only: identifier renaming + plain string array.
// controlFlowFlattening, deadCodeInjection, debugProtection, selfDefending,
// RC4 string encoding, numbersToExpressions, and splitStrings are deliberately
// OFF — they execute on every render and made the production app severely
// laggy (including a blocking debugger-trap every 2.5s from debugProtection).
const obfuscatorOptions: ObfuscatorOptions = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: false,
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: false,
  stringArray: true,
  stringArrayCallsTransform: false,
  stringArrayEncoding: [],
  stringArrayThreshold: 0.75,
  unicodeEscapeSequence: false
};

function bundleObfuscator(options: ObfuscatorOptions) {
  return {
    name: 'vite-plugin-bundle-obfuscator',
    enforce: 'post' as const,
    renderChunk(code: string, chunk: { fileName: string }) {
      // Skip obfuscating third-party vendor code for performance and stability
      if (chunk.fileName.includes('vendor')) {
        return null;
      }
      const result = obfuscate(code, options);
      return {
        code: result.getObfuscatedCode(),
        map: options.sourceMap ? result.getSourceMap() : null
      };
    }
  };
}

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

  return {
    name: 'vite-plugin-attendance-api',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/api/network-ip')) {
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
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                activeAttendanceSession = {
                  date: parsed.date || activeAttendanceSession.date,
                  records: parsed.records || activeAttendanceSession.records,
                  students: parsed.students || activeAttendanceSession.students,
                  sections: parsed.sections || activeAttendanceSession.sections,
                  schoolProfile: parsed.schoolProfile || activeAttendanceSession.schoolProfile,
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
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const event = JSON.parse(body || '{}');
                if (event && event.record) {
                  // Always stamp with server time to avoid cross-device clock skew
                  event.timestamp = Date.now();
                  syncEventsQueue.push(event);
                  if (syncEventsQueue.length > 500) syncEventsQueue.shift();

                  const rec = event.record;
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
          const now = Date.now();
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
export default defineConfig(({ mode }) => ({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    react(), 
    !process.env.VITEST ? tailwindcss() : null,
    attendanceApiPlugin(),
    // Only obfuscate in production to keep dev fast
    mode === 'production' ? bundleObfuscator(obfuscatorOptions) : null
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
  },
}))
// Trigger restart
