const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  let url = (req.url || '/').split('?')[0];
  let fp = path.join(DIST, url === '/' ? 'index.html' : url);
  
  if (!fs.existsSync(fp) || !fp.startsWith(DIST)) {
    fp = path.join(DIST, 'index.html');
  }
  
  try {
    const data = fs.readFileSync(fp);
    const ext = path.extname(fp);
    res.writeHead(200, { 
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  } catch (e) {
    res.writeHead(500);
    res.end('Error');
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log('XeriaCo V9 on port ' + PORT);
});
