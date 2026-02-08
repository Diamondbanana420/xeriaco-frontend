const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'xeriaco-frontend', 
    version: '9.0.1',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('ERROR: dist directory not found. Build may have failed.');
  console.log('Available files:', fs.readdirSync(__dirname));
  process.exit(1);
}

// Log available files
console.log('Available files in dist:', fs.readdirSync(distPath));

// Serve static files from dist directory
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: true
}));

// Handle all routes by serving index.html (SPA support)
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).json({ 
      error: 'Frontend not built properly',
      missingFile: 'index.html',
      distContents: fs.readdirSync(distPath)
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`XeriaCO Frontend running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});