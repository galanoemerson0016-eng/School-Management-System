const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Determine paths relative to this script
const rootDir = path.resolve(process.env.FORMEASE_CI_ROOT_DIR || path.resolve(__dirname, '../..'));
const appDir = path.resolve(process.env.FORMEASE_CI_APP_DIR || path.join(rootDir, 'app'));
const releaseDir = path.resolve(process.env.FORMEASE_CI_RELEASE_DIR || path.join(appDir, 'release'));

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

// 2. Stage metadata under an immutable version path. The live updater pointer
// remains the public GitHub Release "latest" redirect until that release is
// published, so a failed draft publication cannot advertise unavailable assets.
const updateServerUpdatesDir = path.join(rootDir, 'update-server', 'updates');
const licensePortalUpdatesDir = path.join(rootDir, 'license-portal', 'public', 'updates');
const stagedReleasePath = path.join('staged', `v${version}`);
const stagedUpdateServerDir = path.join(updateServerUpdatesDir, stagedReleasePath);
const stagedLicensePortalDir = path.join(licensePortalUpdatesDir, stagedReleasePath);

fs.mkdirSync(stagedUpdateServerDir, { recursive: true });
fs.mkdirSync(stagedLicensePortalDir, { recursive: true });

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
  
  // Stage the immutable metadata for both hosting projects. Do not overwrite
  // updates/latest*.yml: those files are the live pointer for existing users.
  fs.writeFileSync(path.join(stagedUpdateServerDir, filename), patchedContent, 'utf8');
  fs.writeFileSync(path.join(stagedLicensePortalDir, filename), patchedContent, 'utf8');
  console.log(`✅ Patched, hashed, and staged ${filename} at ${stagedReleasePath}.`);
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
    fs.copyFileSync(srcPath, path.join(stagedUpdateServerDir, file));
    fs.copyFileSync(srcPath, path.join(stagedLicensePortalDir, file));
    console.log(`📁 Staged blockmap: ${file}`);
  }
});

// 4. Ensure Fix-FormEase-Mac repair tools are staged into releaseDir
const macFixCommand = path.join(rootDir, 'Fix-FormEase-Mac.command');
const macFixZip = path.join(rootDir, 'license-portal', 'public', 'Fix-FormEase-Mac.command.zip');
if (fs.existsSync(macFixCommand)) {
  fs.copyFileSync(macFixCommand, path.join(releaseDir, 'Fix-FormEase-Mac.command'));
  console.log(`📁 Staged Fix-FormEase-Mac.command in release directory`);
}
if (fs.existsSync(macFixZip)) {
  fs.copyFileSync(macFixZip, path.join(releaseDir, 'Fix-FormEase-Mac.command.zip'));
  console.log(`📁 Staged Fix-FormEase-Mac.command.zip in release directory`);
}
const macInstructions = path.join(rootDir, 'PLEASE_READ_MAC_INSTRUCTIONS.txt');
if (fs.existsSync(macInstructions)) {
  fs.copyFileSync(macInstructions, path.join(releaseDir, 'PLEASE_READ_MAC_INSTRUCTIONS.txt'));
  console.log(`📁 Staged PLEASE_READ_MAC_INSTRUCTIONS.txt in release directory`);
}

console.log(`\n🎉 CI/CD Release Asset Patching completed successfully!`);
