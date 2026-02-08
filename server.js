const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 XeriaCO Frontend Server Starting...');
console.log(`📍 Port: ${PORT}`);
console.log(`📂 Directory: ${__dirname}`);
console.log(`📄 Files: ${fs.readdirSync(__dirname).filter(f => f.endsWith('.html'))}`);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'xeriaco-frontend',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Serve main app
app.get('/', (req, res) => {
    const appPath = path.join(__dirname, 'app.html');
    if (fs.existsSync(appPath)) {
        res.sendFile(appPath);
    } else {
        res.status(500).send('Frontend app not found');
    }
});

// Serve app at multiple paths
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.html'));
});

// Catch all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('💥 Server Error:', err);
    res.status(500).send('Internal Server Error');
});

// Start server
app.listen(PORT, '0.0.0.0', (err) => {
    if (err) {
        console.error('💥 Failed to start server:', err);
        process.exit(1);
    }
    console.log(`✅ XeriaCO Frontend running on port ${PORT}`);
    console.log(`🌐 Access: http://localhost:${PORT}`);
});

// Handle process events
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection:', reason);
});