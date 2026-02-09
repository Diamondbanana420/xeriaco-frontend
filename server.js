const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');

console.log('[XeriaCo Store] Starting...');
console.log('[XeriaCo Store] PORT:', PORT);
console.log('[XeriaCo Store] DIST exists:', fs.existsSync(DIST));
if (fs.existsSync(DIST)) {
  console.log('[XeriaCo Store] Contents:', fs.readdirSync(DIST));
  const assetsDir = path.join(DIST, 'assets');
  if (fs.existsSync(assetsDir)) {
    console.log('[XeriaCo Store] Assets:', fs.readdirSync(assetsDir));
  }
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'xeriaco-storefront',
    version: '1.2.1',
    uptime: Math.floor(process.uptime()),
    distExists: fs.existsSync(DIST)
  });
});

app.use(express.static(DIST, { maxAge: '1d', etag: true }));

app.get('*', (req, res) => {
  const index = path.join(DIST, 'index.html');
  if (fs.existsSync(index)) {
    res.sendFile(index);
  } else {
    res.status(500).send('Build not found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('[XeriaCo Store] Live on port ' + PORT);
});
