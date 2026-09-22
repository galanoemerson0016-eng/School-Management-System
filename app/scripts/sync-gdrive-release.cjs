const fs = require('fs');
const path = require('path');
const https = require('https');

// Determine directories
const appDir = path.resolve(__dirname, '..');
const releaseDir = path.resolve(appDir, 'release');
const packageJson = require(path.join(appDir, 'package.json'));
const version = packageJson.version; // e.g. "2.9.5"

console.log(`\n=============================================================`);
console.log(`☁️ Google Drive Release Sync Engine (v${version})`);
console.log(`=============================================================\n`);

const clientId = process.env.GDRIVE_CLIENT_ID;
const clientSecret = process.env.GDRIVE_CLIENT_SECRET;
const refreshToken = process.env.GDRIVE_REFRESH_TOKEN;
const rootFolderId = process.env.GDRIVE_FOLDER_ID || '1HKQyBkXcVjZ3dKvQPb5Ulv2KqgymyLze';

const serviceAccountEnv = process.env.GDRIVE_SERVICE_ACCOUNT_JSON;

if (!clientId && !serviceAccountEnv) {
  console.log(`⚠️ Skipping Google Drive sync: GDRIVE_CLIENT_ID or GDRIVE_SERVICE_ACCOUNT_JSON environment variables are not set.`);
  console.log(`💡 To enable Google Drive auto-upload, configure secrets in GitHub Repo Settings -> Secrets and variables -> Actions.`);
  process.exit(0);
}

// Generate OAuth2 Access Token using Refresh Token
function getAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&refresh_token=${encodeURIComponent(refreshToken)}&grant_type=refresh_token`;

    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const json = JSON.parse(body);
          resolve(json.access_token);
        } else {
          reject(new Error(`OAuth Token Error (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Make Google Drive API request
function driveRequest(accessToken, method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath.startsWith('http') ? urlPath : `https://www.googleapis.com${urlPath}`);
    const reqHeaders = {
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    };

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: reqHeaders,
    };

    const req = https.request(options, (res) => {
      let resBody = Buffer.alloc(0);
      res.on('data', (chunk) => {
        resBody = Buffer.concat([resBody, chunk]);
      });
      res.on('end', () => {
        const text = resBody.toString('utf8');
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(text ? JSON.parse(text) : {});
          } catch {
            resolve(text);
          }
        } else {
          reject(new Error(`Drive API Error (${res.statusCode}) [${method} ${urlPath}]: ${text}`));
        }
      });
    });

    req.on('error', reject);
    if (body) {
      if (Buffer.isBuffer(body)) {
        req.write(body);
      } else if (typeof body === 'string') {
        req.write(body);
      }
    }
    req.end();
  });
}

// List existing items in a Google Drive folder
async function listDriveItems(accessToken, folderId) {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await driveRequest(accessToken, 'GET', `/drive/v3/files?q=${q}&fields=files(id,name,mimeType)`);
  return res.files || [];
}

// Find or create subfolder by name
async function getOrCreateSubfolder(accessToken, parentFolderId, subfolderName) {
  const items = await listDriveItems(accessToken, parentFolderId);
  const existingFolder = items.find(i => i.name.toLowerCase() === subfolderName.toLowerCase() && i.mimeType === 'application/vnd.google-apps.folder');

  if (existingFolder) {
    return existingFolder.id;
  }

  console.log(`📁 Creating subfolder "${subfolderName}" in Google Drive...`);
  const res = await driveRequest(
    accessToken,
    'POST',
    '/drive/v3/files',
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      name: subfolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    })
  );
  return res.id;
}

// Delete/Trash file from Google Drive
async function deleteDriveFile(accessToken, fileId, fileName, folderLabel) {
  console.log(`🧹 Trashing old file in Google Drive [${folderLabel}]: "${fileName}" (${fileId})`);
  try {
    await driveRequest(accessToken, 'PATCH', `/drive/v3/files/${fileId}`, { 'Content-Type': 'application/json' }, JSON.stringify({ trashed: true }));
  } catch (_err) {
    try {
      await driveRequest(accessToken, 'DELETE', `/drive/v3/files/${fileId}`);
    } catch (err) {
      console.warn(`⚠️ Note: Could not delete prior file "${fileName}": ${err.message}`);
    }
  }
}

// Upload file to Google Drive using multipart upload
async function uploadDriveFile(accessToken, targetFolderId, filePath, folderLabel) {
  const fileName = path.basename(filePath);
  const fileStats = fs.statSync(filePath);
  const fileBuffer = fs.readFileSync(filePath);

  console.log(`📤 Uploading to Google Drive [${folderLabel}]: "${fileName}" (${(fileStats.size / (1024 * 1024)).toFixed(2)} MB)...`);

  const boundary = '-------FormEaseDriveBoundary' + Date.now().toString(16);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    parents: [targetFolderId],
  };

  const ext = path.extname(fileName).toLowerCase();
  let contentType = 'application/octet-stream';
  if (ext === '.exe') contentType = 'application/vnd.microsoft.portable-executable';
  else if (ext === '.dmg') contentType = 'application/x-apple-diskimage';
  else if (ext === '.yml' || ext === '.yaml') contentType = 'text/yaml';

  const multipartRequestBody = Buffer.concat([
    Buffer.from(
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${contentType}\r\n\r\n`
    ),
    fileBuffer,
    Buffer.from(closeDelimiter),
  ]);

  const response = await driveRequest(
    accessToken,
    'POST',
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': multipartRequestBody.length,
    },
    multipartRequestBody
  );

  console.log(`✅ Successfully uploaded to [${folderLabel}]: "${fileName}" -> Google Drive ID: ${response.id}`);
}

async function syncTargetPlatform(accessToken, parentFolderId, platformName, filePredicate) {
  console.log(`\n-------------------------------------------------------------`);
  console.log(`📂 Processing Platform: ${platformName.toUpperCase()}`);
  console.log(`-------------------------------------------------------------`);

  const platformFolderId = await getOrCreateSubfolder(accessToken, parentFolderId, platformName);
  console.log(`✅ ${platformName.toUpperCase()} Folder ID: ${platformFolderId}`);

  // 1. Purge old installer & blockmap files in this platform folder
  const existingFiles = await listDriveItems(accessToken, platformFolderId);
  const extsToPurge = ['.exe', '.dmg', '.zip', '.yml', '.yaml', '.blockmap'];

  for (const file of existingFiles) {
    const ext = path.extname(file.name).toLowerCase();
    if (extsToPurge.includes(ext) || file.name.startsWith('FormEase') || file.name.startsWith('latest')) {
      await deleteDriveFile(accessToken, file.id, file.name, platformName);
    }
  }

  // 2. Upload matching latest version release assets from local app/release/
  if (!fs.existsSync(releaseDir)) return;

  const localFiles = fs.readdirSync(releaseDir);
  const validAssets = localFiles.filter(f => {
    const filePath = path.join(releaseDir, f);
    return fs.statSync(filePath).isFile() && filePredicate(f);
  });

  console.log(`🚀 Uploading ${validAssets.length} latest release asset(s) to "${platformName}" subfolder...`);
  for (const file of validAssets) {
    const filePath = path.join(releaseDir, file);
    await uploadDriveFile(accessToken, platformFolderId, filePath, platformName);
  }
}

async function main() {
  try {
    console.log(`🔑 Authenticating with Google OAuth 2.0 User Access...`);
    const accessToken = await getAccessToken();
    console.log(`✅ Authenticated successfully! Root Folder ID: ${rootFolderId}`);

    // Process Windows Subfolder (Strictly latest version .exe binary only, NO .yml, NO .blockmap)
    await syncTargetPlatform(
      accessToken,
      rootFolderId,
      'windows',
      (filename) => {
        if (filename.endsWith('.blockmap') || filename.endsWith('.yml') || filename.endsWith('.yaml')) return false;
        const ext = path.extname(filename).toLowerCase();
        if (ext === '.exe') {
          return filename.includes(version);
        }
        return false;
      }
    );

    // Process Mac Subfolder (Strictly latest version 2 .dmg binaries only, NO .yml, NO .zip, NO .blockmap)
    await syncTargetPlatform(
      accessToken,
      rootFolderId,
      'mac',
      (filename) => {
        if (filename.endsWith('.blockmap') || filename.endsWith('.yml') || filename.endsWith('.yaml') || filename.endsWith('.zip')) return false;
        const ext = path.extname(filename).toLowerCase();
        if (ext === '.dmg') {
          return filename.includes(version);
        }
        return false;
      }
    );

    console.log(`\n=============================================================`);
    console.log(`🎉 Google Drive Auto-Purge & Upload Complete for Windows and Mac!`);
    console.log(`=============================================================\n`);
  } catch (err) {
    console.error(`❌ Google Drive Release Sync Failed:`, err);
    process.exit(1);
  }
}

main();
