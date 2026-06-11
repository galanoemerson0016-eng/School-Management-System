import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import obfuscator from 'vite-plugin-javascript-obfuscator'
import { readFileSync } from 'fs'
import { join } from 'path'

const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))

// Light obfuscation only: identifier renaming + plain string array.
// controlFlowFlattening, deadCodeInjection, debugProtection, selfDefending,
// RC4 string encoding, numbersToExpressions, and splitStrings are deliberately
// OFF — they execute on every render and made the production app severely
// laggy (including a blocking debugger-trap every 2.5s from debugProtection).
const obfuscatorOptions: any = {
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
    mode === 'production' ? obfuscator(obfuscatorOptions) : null
  ].filter(Boolean),
  server: {
    port: 3001,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 3000,
  }
}))
// Trigger restart
