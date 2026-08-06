const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Determine directories
const appDir = path.resolve(__dirname, '..');
const releaseDir = path.resolve(appDir, 'release');

console.log(`\n=============================================================`);
console.log(`☁️ Google Drive Release Sync & Purge Engine`);
console.log(`=============================================================\n`);

const serviceAccountEnv = process.env.GDRIVE_SERVICE_ACCOUNT_JSON;
const folderId = process.env.GDRIVE_FOLDER_ID;

if (!serviceAccountEnv || !folderId) {
  console.log(`⚠️ Skipping Google Drive sync: GDRIVE_SERVICE_ACCOUNT_JSON or GDRIVE_FOLDER_ID environment variables are not set.`);
  console.log(`💡 To enable Google Drive auto-upload, add these secrets in GitHub Repo Settings -> Secrets and variables -> Actions.`);
  process.exit(0);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountEnv);
} catch (err) {
  console.error(`❌ Failed to parse GDRIVE_SERVICE_ACCOUNT_JSON environment variable:`, err.message);
  process.exit(1);
}

// Helpers for Base64URL encoding
function base64UrlEncode(data) {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Generate OAuth2 Access Token using RS256 JWT
function getAccessToken(serviceAccount) {
  return new Promise((resolve, reject) => {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;

    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp: exp,
      iat: iat,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(unsignedToken);
    const signature = signer.sign(serviceAccount.private_key, 'base64url');

    const jwtToken = `${unsignedToken}.${signature}`;
    const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwtToken}`;

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

// List existing files in Google Drive folder
async function listDriveFiles(accessToken, folderId) {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await driveRequest(accessToken, 'GET', `/drive/v3/files?q=${q}&fields=files(id,name,mimeType)`);
  return res.files || [];
}

// Delete file from Google Drive
async function deleteDriveFile(accessToken, fileId, fileName) {
  console.log(`🧹 Deleting old file from Google Drive: "${fileName}" (${fileId})`);
  await driveRequest(accessToken, 'DELETE', `/drive/v3/files/${fileId}`);
}

// Upload file to Google Drive using multipart upload
async function uploadDriveFile(accessToken, folderId, filePath) {
  const fileName = path.basename(filePath);
  const fileStats = fs.statSync(filePath);
  const fileBuffer = fs.readFileSync(filePath);

  console.log(`📤 Uploading to Google Drive: "${fileName}" (${(fileStats.size / (1024 * 1024)).toFixed(2)} MB)...`);

  const boundary = '-------FormEaseDriveBoundary' + Date.now().toString(16);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const ext = path.extname(fileName).toLowerCase();
  let contentType = 'application/octet-stream';
  if (ext === '.exe') contentType = 'application/vnd.microsoft.portable-executable';
  else if (ext === '.dmg') contentType = 'application/x-apple-diskimage';
  else if (ext === '.yml' || ext === '.yaml') contentType = 'text/yaml';
  else if (ext === '.blockmap') contentType = 'application/json';

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

  console.log(`✅ Successfully uploaded: "${fileName}" -> Google Drive ID: ${response.id}`);
}

async function main() {
  try {
    console.log(`🔑 Authenticating with Google OAuth2 Service Account...`);
    const accessToken = await getAccessToken(serviceAccount);
    console.log(`✅ Authenticated successfully! Target Folder ID: ${folderId}`);

    // 1. Fetch current files in Google Drive folder
    console.log(`\n🔍 Fetching existing files in Google Drive folder...`);
    const existingFiles = await listDriveFiles(accessToken, folderId);
    console.log(`📋 Found ${existingFiles.length} file(s) in target Google Drive folder.`);

    // Target extension types to clean up
    const extsToPurge = ['.exe', '.dmg', '.zip', '.yml', '.yaml', '.blockmap'];

    // 2. Delete existing old installer files in Google Drive folder
    for (const file of existingFiles) {
      const ext = path.extname(file.name).toLowerCase();
      if (extsToPurge.includes(ext) || file.name.startsWith('FormEase')) {
        await deleteDriveFile(accessToken, file.id, file.name);
      }
    }

    // 3. Scan local app/release directory for new release assets
    if (!fs.existsSync(releaseDir)) {
      console.error(`❌ Release directory not found at ${releaseDir}`);
      process.exit(1);
    }

    const localFiles = fs.readdirSync(releaseDir);
    const validAssets = localFiles.filter(f => {
      const ext = path.extname(f).toLowerCase();
      const isFile = fs.statSync(path.join(releaseDir, f)).isFile();
      return isFile && extsToPurge.includes(ext);
    });

    console.log(`\n🚀 Uploading ${validAssets.length} new release asset(s) to Google Drive...`);
    for (const file of validAssets) {
      const filePath = path.join(releaseDir, file);
      await uploadDriveFile(accessToken, folderId, filePath);
    }

    console.log(`\n=============================================================`);
    console.log(`🎉 Google Drive Auto-Purge & Upload Complete!`);
    console.log(`=============================================================\n`);
  } catch (err) {
    console.error(`❌ Google Drive Release Sync Failed:`, err);
    process.exit(1);
  }
}

main();
