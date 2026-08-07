const fs = require('fs');
const path = require('path');

const appDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(appDir, '..');

const pkg = require(path.join(appDir, 'package.json'));
const version = pkg.version;

console.log(`\n=============================================================`);
console.log(`🔍 FormEase Pro Release Consistency Check (v${version})`);
console.log(`=============================================================\n`);

let hasError = false;

// 1. Check update-store.ts
const updateStorePath = path.join(appDir, 'src', 'stores', 'update-store.ts');
if (fs.existsSync(updateStorePath)) {
  const content = fs.readFileSync(updateStorePath, 'utf8');
  if (!content.includes(`'${version}'`) && !content.includes(`"${version}"`)) {
    console.error(`❌ Error: update-store.ts CURRENT_VERSION fallback does not contain version "${version}".`);
    hasError = true;
  } else {
    console.log(`✅ update-store.ts matches version v${version}`);
  }
}

// 2. Check VERSION_HISTORY.md
const historyPath = path.join(rootDir, 'VERSION_HISTORY.md');
if (fs.existsSync(historyPath)) {
  const content = fs.readFileSync(historyPath, 'utf8');
  if (!content.includes(`## v${version}`)) {
    console.error(`❌ Error: VERSION_HISTORY.md does not contain top header "## v${version}".`);
    hasError = true;
  } else {
    console.log(`✅ VERSION_HISTORY.md matches version v${version}`);
  }
}

// 3. Check SettingsPage.tsx
const settingsPath = path.join(appDir, 'src', 'pages', 'SettingsPage.tsx');
if (fs.existsSync(settingsPath)) {
  const content = fs.readFileSync(settingsPath, 'utf8');
  if (!content.includes(`Version ${version}`)) {
    console.error(`❌ Error: SettingsPage.tsx version timeline does not contain "Version ${version}".`);
    hasError = true;
  } else {
    console.log(`✅ SettingsPage.tsx matches version v${version}`);
  }
}

console.log(`\n-------------------------------------------------------------`);
if (hasError) {
  console.error(`❌ Release consistency check FAILED! Please update mismatched files.`);
  process.exit(1);
} else {
  console.log(`🎉 ALL RELEASE VERSIONS ARE 100% ALIGNED AND READY FOR RELEASE!`);
  console.log(`=============================================================\n`);
}
