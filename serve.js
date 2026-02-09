import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'xeriaco-frontend', version: '9.3.0', uptime: Math.floor(process.uptime()) });
});

app.use(express.static(join(__dirname, 'dist'), { maxAge: '1d', etag: true }));

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[XeriaCo V9] Frontend live on port ${PORT}`);
});
