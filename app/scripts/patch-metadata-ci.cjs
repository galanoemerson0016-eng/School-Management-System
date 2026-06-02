const fs = require('fs');
const path = require('path');

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

// 1. Rename release files to replace spaces with dots (e.g. "FormEase Pro Setup 1.0.55.exe" -> "FormEase.Pro.Setup.1.0.55.exe")
if (fs.existsSync(releaseDir)) {
  const files = fs.readdirSync(releaseDir);
  files.forEach(file => {
    const filePath = path.join(releaseDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile()) {
      // We only want to rename installer/archive assets and yml files.
      // Avoid modifying anything else.
      const ext = path.extname(file).toLowerCase();
      if (['.exe', '.dmg', '.zip', '.blockmap', '.yml'].includes(ext)) {
        let newName = file;
        
        // For Windows EXE, we also want to convert "FormEase Pro Setup" to "FormEase.Pro.Setup"
        if (file.startsWith('FormEase Pro Setup')) {
          newName = file.replace('FormEase Pro Setup', 'FormEase.Pro.Setup');
        }
        
        // Replace any remaining spaces with dots
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

// 2. Define updates destinations
const updateServerUpdatesDir = path.join(rootDir, 'update-server', 'updates');
const licensePortalUpdatesDir = path.join(rootDir, 'license-portal', 'public', 'updates');

// Ensure destination directories exist
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
  
  // Split lines and patch
  const lines = content.split(/\r?\n/);
  const patchedLines = lines.map(line => {
    // Match: url: <val> or - url: <val>
    const urlMatch = line.match(/^(\s*-?\s*url:\s*)(.+)$/);
    if (urlMatch) {
      const prefix = urlMatch[1];
      let val = urlMatch[2].trim();
      
      // Clean up single/double quotes
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      
      // Replace spaces with dots
      let filenameWithDots = val.replace(/ /g, '.');
      if (filenameWithDots.startsWith('FormEase.Pro.Setup') === false && filenameWithDots.startsWith('FormEase.Pro.Setup')) {
        // Safe guard
      }
      if (val.startsWith('FormEase Pro Setup')) {
        filenameWithDots = filenameWithDots.replace('FormEase.Pro.Setup', 'FormEase.Pro.Setup'); // just in case
      }
      
      // If it's already an absolute URL, leave it or update version, otherwise prepend base URL
      if (filenameWithDots.startsWith('http://') || filenameWithDots.startsWith('https://')) {
        // Extract the filename from the URL and prepend base
        const parts = filenameWithDots.split('/');
        const actualName = parts[parts.length - 1];
        return `${prefix}${baseReleaseUrl}/${actualName}`;
      } else {
        return `${prefix}${baseReleaseUrl}/${filenameWithDots}`;
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
      return `${prefix}${filenameWithDots}`;
    }
    
    return line;
  });
  
  const patchedContent = patchedLines.join('\n');
  
  // Write to both update-server and license-portal
  fs.writeFileSync(path.join(updateServerUpdatesDir, filename), patchedContent, 'utf8');
  fs.writeFileSync(path.join(licensePortalUpdatesDir, filename), patchedContent, 'utf8');
  console.log(`✅ Patched and copied ${filename} to hosting folders.`);
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
