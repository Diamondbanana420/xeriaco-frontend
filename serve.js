import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const DIST = join(__dirname, 'dist');

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'xeriaco-storefront', version: '1.0.0', uptime: Math.floor(process.uptime()) });
});

app.use(express.static(DIST, { maxAge: '1d', etag: true }));

app.get('*', (req, res) => {
  const index = join(DIST, 'index.html');
  if (existsSync(index)) res.sendFile(index);
  else res.status(500).send('Build not found');
});

app.listen(PORT, '0.0.0.0', () => console.log(`[XeriaCo Storefront] Live on port ${PORT}`));
