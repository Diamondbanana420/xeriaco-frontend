import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DIST = join(__dirname, 'dist');

console.log(`[XeriaCo V9.3] Starting...`);
console.log(`[XeriaCo V9.3] PORT=${PORT}`);
console.log(`[XeriaCo V9.3] DIST=${DIST}`);
console.log(`[XeriaCo V9.3] DIST exists: ${existsSync(DIST)}`);

if (existsSync(DIST)) {
  console.log(`[XeriaCo V9.3] DIST contents:`, readdirSync(DIST));
} else {
  console.error(`[XeriaCo V9.3] ERROR: dist/ directory not found!`);
}

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'xeriaco-frontend', 
    version: '9.3.0', 
    uptime: Math.floor(process.uptime()),
    distExists: existsSync(DIST)
  });
});

app.use(express.static(DIST, { maxAge: '1d', etag: true }));

app.get('*', (req, res) => {
  const indexPath = join(DIST, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('Build not found — dist/index.html missing');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[XeriaCo V9.3] Frontend live on port ${PORT}`);
});
