import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const DIST = join(__dirname, 'dist');

console.log(`[XeriaCo Store] Starting on port ${PORT}...`);
console.log(`[XeriaCo Store] DIST: ${DIST} | exists: ${existsSync(DIST)}`);
if (existsSync(DIST)) console.log(`[XeriaCo Store] Contents:`, readdirSync(DIST));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'xeriaco-storefront', version: '1.1.0', uptime: Math.floor(process.uptime()), distExists: existsSync(DIST) });
});

app.use(express.static(DIST, { maxAge: '1d', etag: true }));

app.get('*', (req, res) => {
  const index = join(DIST, 'index.html');
  if (existsSync(index)) res.sendFile(index);
  else res.status(500).json({ error: 'Build not found', dist: existsSync(DIST) });
});

app.listen(PORT, '0.0.0.0', () => console.log(`[XeriaCo Store] Live on port ${PORT}`));
