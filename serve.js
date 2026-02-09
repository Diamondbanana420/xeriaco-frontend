import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const DIST = join(__dirname, 'dist');

console.log('[XeriaCo Store] Starting...');
console.log('[XeriaCo Store] PORT:', PORT);
console.log('[XeriaCo Store] DIST:', DIST);
console.log('[XeriaCo Store] DIST exists:', existsSync(DIST));

if (existsSync(DIST)) {
  const contents = readdirSync(DIST);
  console.log('[XeriaCo Store] DIST contents:', contents);
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'xeriaco-storefront',
    version: '1.2.0',
    uptime: Math.floor(process.uptime()),
    distExists: existsSync(DIST)
  });
});

app.use(express.static(DIST, { maxAge: '1d', etag: true }));

app.get('*', (req, res) => {
  const index = join(DIST, 'index.html');
  if (existsSync(index)) {
    res.sendFile(index);
  } else {
    res.status(500).send('<h1>Build not found</h1><p>dist/index.html missing</p>');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('[XeriaCo Store] ✅ Live on port', PORT);
});
