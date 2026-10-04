const fs = require('fs');
const path = require('path');

const releaseDir = path.resolve(__dirname, '..', 'release');
const rootDir = path.resolve(__dirname, '..', '..');
const rootReleaseDir = path.resolve(rootDir, 'release');

if (!fs.existsSync(releaseDir)) {
  console.log('[copy-release] No app/release directory found.');
  process.exit(0);
}

if (!fs.existsSync(rootReleaseDir)) {
  fs.mkdirSync(rootReleaseDir, { recursive: true });
}

const files = fs.readdirSync(releaseDir);
let copied = 0;

for (const file of files) {
  if (file.endsWith('.exe') || file.endsWith('.dmg') || file.endsWith('.blockmap') || file.endsWith('.yml')) {
    const srcPath = path.join(releaseDir, file);
    if (fs.statSync(srcPath).isFile()) {
      // Copy all release artifacts to root/release/
      const destRelease = path.join(rootReleaseDir, file);
      fs.copyFileSync(srcPath, destRelease);
      console.log(`[copy-release] Copied ${file} -> ${destRelease}`);
      copied++;
    }
  }
}

if (copied === 0) {
  console.log('[copy-release] No installer files found to copy.');
} else {
  console.log(`[copy-release] Successfully copied ${copied} installer(s) to project root!`);
}
