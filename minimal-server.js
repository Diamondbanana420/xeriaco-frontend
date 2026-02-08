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

  // Serve emergency frontend
  const emergencyPath = path.join(__dirname, 'public', 'emergency.html');
  
  try {
    const content = fs.readFileSync(emergencyPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(content);
  } catch (err) {
    console.error('❌ Error serving file:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('XeriaCO Emergency Mode - File Error');
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