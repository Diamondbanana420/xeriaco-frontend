const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');

console.log('Starting XeriaCo V9 Frontend...');
console.log('PORT:', PORT);
console.log('DIST dir:', DIST);
console.log('DIST exists:', fs.existsSync(DIST));
if (fs.existsSync(DIST)) {
  console.log('DIST contents:', fs.readdirSync(DIST));
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify({status:'ok',uptime:process.uptime()}));
  }
  
  let url = (req.url || '/').split('?')[0];
  let fp = path.join(DIST, url === '/' ? 'index.html' : url);
  
  if (!fs.existsSync(fp)) fp = path.join(DIST, 'index.html');
  
  try {
    const data = fs.readFileSync(fp);
    res.writeHead(200, { 
      'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  } catch (e) {
    console.error('Serve error:', e.message);
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`XeriaCo V9 live on port ${PORT}`);
});
