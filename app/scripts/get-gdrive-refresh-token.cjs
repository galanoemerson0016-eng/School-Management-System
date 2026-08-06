const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

const clientId = '516385983931-vs3rvcpe9012hqhtjhumpdeqm7ftmc8d.apps.googleusercontent.com';
const clientSecret = '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';
const redirectUri = 'http://localhost:8089';

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/drive')}&access_type=offline&prompt=consent`;

console.log(`\n=============================================================`);
console.log(`🔐 Google Drive OAuth 2.0 Token Generator`);
console.log(`=============================================================\n`);
console.log(`👉 Please open this URL in your web browser to authorize access:\n`);
console.log(`   ${authUrl}\n`);
console.log(`Waiting for authorization callback on ${redirectUri}...`);

// Start temporary local server to capture authorization code
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, redirectUri);
  const code = reqUrl.searchParams.get('code');

  if (code) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>✅ Google Drive Authorization Successful!</h1><p>You can close this browser tab now and return to your terminal.</p>');

    console.log(`\n✅ Authorization code received! Exchanging for Refresh Token...`);
    server.close();

    try {
      const postData = `code=${encodeURIComponent(code)}&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&redirect_uri=${encodeURIComponent(redirectUri)}&grant_type=authorization_code`;

      const tokenRes = await new Promise((resolve, reject) => {
        const tokenReq = https.request('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
          },
        }, (response) => {
          let body = '';
          response.on('data', chunk => body += chunk);
          response.on('end', () => resolve(JSON.parse(body)));
        });
        tokenReq.on('error', reject);
        tokenReq.write(postData);
        tokenReq.end();
      });

      if (tokenRes.refresh_token) {
        console.log(`\n🎉 Refresh Token Successfully Generated!`);
        console.log(`🔑 Refresh Token: ${tokenRes.refresh_token}\n`);

        console.log(`🚀 Setting Secrets in GitHub Repository (galanoemerson0016-eng/School-Management-System)...`);
        execSync(`gh secret set GDRIVE_CLIENT_ID -b "${clientId}" -R galanoemerson0016-eng/School-Management-System`);
        execSync(`gh secret set GDRIVE_CLIENT_SECRET -b "${clientSecret}" -R galanoemerson0016-eng/School-Management-System`);
        execSync(`gh secret set GDRIVE_REFRESH_TOKEN -b "${tokenRes.refresh_token}" -R galanoemerson0016-eng/School-Management-System`);
        execSync(`gh secret set GDRIVE_FOLDER_ID -b "1HKQyBkXcVjZ3dKvQPb5Ulv2KqgymyLze" -R galanoemerson0016-eng/School-Management-System`);

        console.log(`\n=============================================================`);
        console.log(`✅ ALL GITHUB SECRETS SUCCESSFULLY CONFIGURED!`);
        console.log(`=============================================================\n`);
        process.exit(0);
      } else {
        console.error(`❌ Token response did not contain refresh_token:`, tokenRes);
        process.exit(1);
      }
    } catch (err) {
      console.error(`❌ Failed to exchange authorization code:`, err);
      process.exit(1);
    }
  }
});

server.listen(8089);
