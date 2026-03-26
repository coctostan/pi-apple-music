#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";

const configPath = join(homedir(), ".pi-apple-music", "config.json");
const config = JSON.parse(readFileSync(configPath, "utf-8"));
const { teamId, keyId, privateKeyPath } = config;
const privateKey = readFileSync(privateKeyPath, "utf-8");

// Generate developer token with localhost origin
const devToken = jwt.sign({}, privateKey, {
  algorithm: "ES256",
  expiresIn: "180d",
  issuer: teamId,
  header: { alg: "ES256", kid: keyId },
  keyid: keyId,
});

const html = `<!DOCTYPE html>
<html>
<head>
  <title>Apple Music Authorization</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 60px auto; padding: 20px; }
    h1 { font-size: 24px; }
    button { background: #ff2d55; color: white; border: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; cursor: pointer; }
    button:hover { background: #e0264c; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    #token { word-break: break-all; background: #1d1d1f; color: #30d158; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px; margin-top: 16px; display: none; user-select: all; max-height: 200px; overflow-y: auto; }
    #status { margin-top: 16px; font-weight: 500; }
    .ok { color: #30d158; }
    .err { color: #ff3b30; }
    .info { margin: 12px 0; padding: 12px; background: #f5f5f7; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>🎵 Authorize Apple Music</h1>
  <div class="info">Click the button below. Sign in with your Apple ID and allow access.</div>
  <button id="btn" onclick="go()">Authorize Apple Music</button>
  <div id="status"></div>
  <div id="token"></div>

  <script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js" data-web-components></script>
  <script>
    const DEV_TOKEN = ${JSON.stringify(devToken)};

    async function go() {
      const btn = document.getElementById('btn');
      const status = document.getElementById('status');
      const output = document.getElementById('token');
      btn.disabled = true;
      status.textContent = 'Configuring MusicKit...';

      try {
        const music = await MusicKit.configure({
          developerToken: DEV_TOKEN,
          app: { name: 'pi-apple-music', build: '0.1.0' },
        });

        status.textContent = 'Waiting for authorization (check popup)...';
        await music.authorize();

        const userToken = music.musicUserToken;
        if (userToken) {
          output.style.display = 'block';
          output.textContent = userToken;
          status.innerHTML = '<span class="ok">✓ Authorized! Copy the token above.</span><br><br>' +
            'Then update your config:<br><code>open ~/.pi-apple-music/config.json</code><br><br>' +
            'Replace YOUR_MUSIC_USER_TOKEN with the green text above.<br>' +
            'Token is valid for ~180 days. You can close this page.';

          // Also POST it back so the server can display it
          fetch('/token', { method: 'POST', body: userToken });
        } else {
          status.innerHTML = '<span class="err">Auth succeeded but no token returned.</span>';
        }
      } catch (err) {
        status.innerHTML = '<span class="err">Error: ' + (err.message || err) + '</span>';
        console.error(err);
      } finally {
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>`;

const PORT = 8374;

const server = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/token") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      receivedToken = body;
      console.log("\n══════════════════════════════════════");
      console.log("✓ MUSIC USER TOKEN RECEIVED");
      console.log("══════════════════════════════════════\n");
      console.log(body);
      console.log("\n══════════════════════════════════════");
      console.log("Add this to ~/.pi-apple-music/config.json");
      console.log("as the \"musicUserToken\" value.");
      console.log("══════════════════════════════════════\n");
      console.log("Press Ctrl+C to stop the server.\n");
      res.writeHead(200);
      res.end("ok");
    });
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`\nOpen in your browser:\n`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log("Waiting for authorization...\n");
});
