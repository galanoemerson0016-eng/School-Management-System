import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { obfuscate } from 'javascript-obfuscator'
import type { ObfuscatorOptions } from 'javascript-obfuscator'
import { readFileSync } from 'fs'
import { join } from 'path'

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

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    react(), 
    tailwindcss(),
    // Only obfuscate in production to keep dev fast
    mode === 'production' ? bundleObfuscator(obfuscatorOptions) : null
  ].filter(Boolean),
  server: {
    port: 3001,
    strictPort: true,
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
