const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');

console.log('Starting XeriaCo V9...');

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'xeriaco-v9', timestamp: new Date().toISOString() });
});

// Serve static files from dist/
app.use(express.static(DIST, { maxAge: '1d' }));

// SPA fallback - all routes serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`XeriaCo V9 live on port ${PORT}`);
});
