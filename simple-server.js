// Ultra-simple Express server for debugging Railway deployment
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting XeriaCO Frontend...');
console.log('📁 Working directory:', __dirname);
console.log('🔍 Files in root:', fs.readdirSync(__dirname).slice(0, 10));

// Check if dist exists
const distPath = path.join(__dirname, 'dist');
const distExists = fs.existsSync(distPath);
console.log('📦 Dist directory exists:', distExists);

if (distExists) {
  console.log('📂 Dist contents:', fs.readdirSync(distPath));
}

app.get('/debug', (req, res) => {
  res.json({
    distExists: distExists,
    distContents: distExists ? fs.readdirSync(distPath) : [],
    rootContents: fs.readdirSync(__dirname).slice(0, 10),
    port: PORT,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'xeriaco-frontend-simple' });
});

// Serve emergency frontend if main build fails
app.get('/emergency', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'emergency.html'));
});

if (distExists) {
  // Serve built app
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Fallback to emergency frontend
      res.redirect('/emergency');
    }
  });
} else {
  console.log('⚠️  Build not found - serving emergency frontend');
  // Serve emergency frontend
  app.use('/assets', express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'emergency.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});