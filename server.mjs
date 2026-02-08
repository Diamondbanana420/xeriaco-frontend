import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

createServer((req, res) => {
  let url = req.url.split('?')[0];
  let filePath = join(DIST, url === '/' ? 'index.html' : url);
  
  if (!existsSync(filePath) || !filePath.startsWith(DIST)) {
    filePath = join(DIST, 'index.html');
  }
  
  try {
    const data = readFileSync(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { 
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
    });
    res.end(data);
  } catch (e) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`XeriaCo V9 live on port ${PORT}`);
});
