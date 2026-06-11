const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const filesToObfuscate = [
  { src: 'electron/main.cjs', dest: 'dist-electron/main.cjs' },
  { src: 'electron/preload.cjs', dest: 'dist-electron/preload.cjs' }
];

console.log('🛡️ Starting Electron Core Obfuscation...');

// Ensure output directory exists
const distElectronDir = path.join(process.cwd(), 'dist-electron');
if (!fs.existsSync(distElectronDir)) {
  fs.mkdirSync(distElectronDir, { recursive: true });
}

filesToObfuscate.forEach(({ src, dest }) => {
  try {
    const srcPath = path.join(process.cwd(), src);
    const destPath = path.join(process.cwd(), dest);
    
    if (!fs.existsSync(srcPath)) {
      console.warn(`⚠️ Warning: ${src} not found, skipping.`);
      return;
    }

    const code = fs.readFileSync(srcPath, 'utf8');
    
    // Light obfuscation only: identifier renaming + plain string array.
    // controlFlowFlattening, selfDefending, debugProtection, splitStrings,
    // and numbersToExpressions are deliberately OFF — the main process handles
    // all IPC (dialogs, backups, printing, updater), and the 2s debugger-trap
    // loop from debugProtection stalled it periodically on every platform.
    const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
      compact: true,
      controlFlowFlattening: false,
      numbersToExpressions: false,
      simplify: true,
      stringArray: true,
      stringArrayThreshold: 0.75,
      splitStrings: false,
      selfDefending: false,
      debugProtection: false
    });

    fs.writeFileSync(destPath, obfuscationResult.getObfuscatedCode());
    console.log(`✅ Obfuscated: ${src} -> ${dest}`);
  } catch (err) {
    console.error(`❌ Error obfuscating ${src}:`, err);
    process.exit(1);
  }
});

console.log('🎉 Electron Core Shielding Complete!');
