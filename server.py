#!/usr/bin/env python3
import http.server
import socketserver
import os
from pathlib import Path

PORT = int(os.environ.get('PORT', 8000))

class XeriaCOHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Serve index.html for all requests (SPA behavior)
        if self.path == '/' or self.path == '/health':
            if self.path == '/health':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "ok", "service": "xeriaco-python-frontend"}')
                return
            
            # Serve index.html
            index_path = Path(__file__).parent / 'index.html'
            if index_path.exists():
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                with open(index_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b'XeriaCO Frontend - Index not found')
        else:
            # Handle other requests normally
            super().do_GET()

print(f"🐍 XeriaCO Python Frontend starting on port {PORT}")
print(f"📁 Working directory: {os.getcwd()}")
print(f"📄 Files available: {list(Path('.').glob('*.html'))}")

with socketserver.TCPServer(("", PORT), XeriaCOHandler) as httpd:
    print(f"✅ Server running at http://0.0.0.0:{PORT}")
    httpd.serve_forever()