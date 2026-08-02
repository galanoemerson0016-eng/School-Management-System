const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Determine paths relative to this script
const rootDir = path.resolve(__dirname, '../..');
const appDir = path.resolve(__dirname, '..');
const releaseDir = path.resolve(appDir, 'release');

const packageJson = require(path.join(appDir, 'package.json'));
const version = packageJson.version;
const baseReleaseUrl = `https://github.com/galanoemerson0016-eng/FormEase-Releases/releases/download/v${version}`;

console.log(`🚀 Starting CI/CD Release Asset Patching & Preparation`);
console.log(`📦 Release Version: v${version}`);
console.log(`🔗 Public Release Download Base: ${baseReleaseUrl}\n`);

function computeFileSha512(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha512').update(fileBuffer).digest('base64');
}

// 1. Rename release files to replace spaces with dots (e.g. "FormEase Pro Setup 1.0.55.exe" -> "FormEase.Pro.Setup.1.0.55.exe")
if (fs.existsSync(releaseDir)) {
  const files = fs.readdirSync(releaseDir);
  files.forEach(file => {
    const filePath = path.join(releaseDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile()) {
      const ext = path.extname(file).toLowerCase();
      if (['.exe', '.dmg', '.zip', '.blockmap'].includes(ext)) {
        let newName = file;
        
        if (file.startsWith('FormEase Pro Setup')) {
          newName = file.replace('FormEase Pro Setup', 'FormEase.Pro.Setup');
        }
        
        newName = newName.replace(/ /g, '.');
        
        if (newName !== file) {
          const newPath = path.join(releaseDir, newName);
          fs.renameSync(filePath, newPath);
          console.log(`🏷️ Renamed: "${file}" -> "${newName}"`);
        }
      }
    }
  });
} else {
  console.error(`❌ Error: Release directory does not exist at ${releaseDir}`);
  process.exit(1);
}

// Build map of actual installer sha512 checksums in releaseDir
const fileChecksums = {};
const releaseFiles = fs.readdirSync(releaseDir);
releaseFiles.forEach(f => {
  const ext = path.extname(f).toLowerCase();
  if (['.exe', '.dmg', '.zip'].includes(ext)) {
    const fullP = path.join(releaseDir, f);
    const hash = computeFileSha512(fullP);
    if (hash) {
      fileChecksums[f] = hash;
      console.log(`🔑 Computed sha512 for ${f}: ${hash.slice(0, 20)}...`);
    }
  }
});

// 2. Define updates destinations
const updateServerUpdatesDir = path.join(rootDir, 'update-server', 'updates');
const licensePortalUpdatesDir = path.join(rootDir, 'license-portal', 'public', 'updates');

fs.mkdirSync(updateServerUpdatesDir, { recursive: true });
fs.mkdirSync(licensePortalUpdatesDir, { recursive: true });

// Helper to patch yml content
function patchYmlFile(filename) {
  const sourcePath = path.join(releaseDir, filename);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`⚠️ Warning: Metadata file ${filename} not found in release folder.`);
    return;
  }

  console.log(`📝 Patching metadata file: ${filename}`);
  let content = fs.readFileSync(sourcePath, 'utf8');
  
  const lines = content.split(/\r?\n/);
  let currentTargetFile = '';

  const patchedLines = lines.map(line => {
    // Match: url: <val> or - url: <val>
    const urlMatch = line.match(/^(\s*-?\s*url:\s*)(.+)$/);
    if (urlMatch) {
      const prefix = urlMatch[1];
      let val = urlMatch[2].trim();
      
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      
      let filenameWithDots = val.replace(/ /g, '.');
      if (val.startsWith('FormEase Pro Setup')) {
        filenameWithDots = filenameWithDots.replace('FormEase.Pro.Setup', 'FormEase.Pro.Setup');
      }
      
      const parts = filenameWithDots.split('/');
      currentTargetFile = parts[parts.length - 1];

      if (filenameWithDots.startsWith('http://') || filenameWithDots.startsWith('https://')) {
        return `${prefix}${baseReleaseUrl}/${currentTargetFile}`;
      } else {
        return `${prefix}${baseReleaseUrl}/${currentTargetFile}`;
      }
    }
    
    // Match: path: <val>
    const pathMatch = line.match(/^(\s*path:\s*)(.+)$/);
    if (pathMatch) {
      const prefix = pathMatch[1];
      let val = pathMatch[2].trim();
      
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      
      let filenameWithDots = val.replace(/ /g, '.');
      const parts = filenameWithDots.split('/');
      currentTargetFile = parts[parts.length - 1];

      return `${prefix}${currentTargetFile}`;
    }

    // Match: sha512: <val>
    const shaMatch = line.match(/^(\s*sha512:\s*)(.+)$/);
    if (shaMatch && currentTargetFile && fileChecksums[currentTargetFile]) {
      const prefix = shaMatch[1];
      const actualHash = fileChecksums[currentTargetFile];
      return `${prefix}${actualHash}`;
    }
    
    return line;
  });
  
  const patchedContent = patchedLines.join('\n');
  
  // Write back to sourcePath (in app/release) so GitHub release action uploads the patched yml!
  fs.writeFileSync(sourcePath, patchedContent, 'utf8');
  
  // Write to both update-server and license-portal
  fs.writeFileSync(path.join(updateServerUpdatesDir, filename), patchedContent, 'utf8');
  fs.writeFileSync(path.join(licensePortalUpdatesDir, filename), patchedContent, 'utf8');
  console.log(`✅ Patched, hashed, and saved ${filename} to release & hosting folders.`);
}

// Patch latest.yml and latest-mac.yml
patchYmlFile('latest.yml');
patchYmlFile('latest-mac.yml');

// 3. Copy blockmaps and other update files to hosting folders
const filesInRelease = fs.readdirSync(releaseDir);
filesInRelease.forEach(file => {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.blockmap') {
    const srcPath = path.join(releaseDir, file);
    fs.copyFileSync(srcPath, path.join(updateServerUpdatesDir, file));
    fs.copyFileSync(srcPath, path.join(licensePortalUpdatesDir, file));
    console.log(`📁 Copied blockmap: ${file}`);
  }
});

console.log(`\n🎉 CI/CD Release Asset Patching completed successfully!`);
