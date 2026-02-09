const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');

console.log(`[XeriaCo V9] Starting frontend server...`);
console.log(`[XeriaCo V9] PORT: ${PORT}`);
console.log(`[XeriaCo V9] DIST: ${DIST}`);
console.log(`[XeriaCo V9] DIST exists: ${fs.existsSync(DIST)}`);

if (fs.existsSync(DIST)) {
  console.log(`[XeriaCo V9] DIST contents:`, fs.readdirSync(DIST));
  const assetsDir = path.join(DIST, 'assets');
  if (fs.existsSync(assetsDir)) {
    console.log(`[XeriaCo V9] Assets:`, fs.readdirSync(assetsDir));
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', service: 'xeriaco-frontend', version: '9.2.0', uptime: Math.floor(process.uptime()) }));
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  let url = (req.url || '/').split('?')[0];
  let fp = path.join(DIST, url === '/' ? 'index.html' : url);

  if (!fp.startsWith(DIST)) { res.writeHead(403); return res.end('Forbidden'); }

  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    fp = path.join(DIST, 'index.html');
  }

  try {
    const data = fs.readFileSync(fp);
    const ext = path.extname(fp);
    const contentType = MIME[ext] || 'application/octet-stream';
    const cacheControl = ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable';
    
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': cacheControl });
    res.end(data);
  } catch (e) {
    console.error(`[XeriaCo V9] Serve error for ${url}:`, e.message);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[XeriaCo V9] Frontend live on http://0.0.0.0:${PORT}`);
});
