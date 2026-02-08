// Absolute minimal server for Railway deployment
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

console.log('🚀 Minimal XeriaCO Server Starting...');
console.log('📍 Port:', PORT);
console.log('📂 Directory:', __dirname);

const server = http.createServer((req, res) => {
  console.log('📨 Request:', req.method, req.url);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'minimal-frontend', port: PORT }));
    return;
  }

  // Serve main frontend
  const indexPath = path.join(__dirname, 'index.html');
  
  try {
    const content = fs.readFileSync(indexPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(content);
  } catch (err) {
    console.error('❌ Error serving file:', err);
    // Fallback to emergency frontend
    try {
      const emergencyPath = path.join(__dirname, 'public', 'emergency.html');
      const emergencyContent = fs.readFileSync(emergencyPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(emergencyContent);
    } catch (err2) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('XeriaCO Frontend - Unable to serve content');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ XeriaCO Frontend Online - Port ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
});

// Error handling
server.on('error', (err) => {
  console.error('💥 Server Error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason);
});