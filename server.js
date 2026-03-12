// Local dev server for game-portal
// Sets Cross-Origin headers required for WebAssembly + SharedArrayBuffer
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.wasm': 'application/wasm',
  '.pck':  'application/octet-stream',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.css':  'text/css',
  '.json': 'application/json',
  '.ogg':  'audio/ogg',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
};

http.createServer((req, res) => {
  let filePath = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (filePath.endsWith('/') || fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  // Required for SharedArrayBuffer / Godot WASM
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');

  fs.readFile(filePath, async (err, data) => {
    if (!err) {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
      return;
    }

    // File not found — try to assemble from split parts
    // Looks in: <dir>/index_parts/<file>.part001 ... AND <dir>/index.side_parts/<file>.part001
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);
    const partDirs = [
      path.join(dir, 'index_parts'),
      path.join(dir, 'index.side_parts'),
      path.join(dir, base + '_parts'),
    ];

    let assembled = null;
    for (const partDir of partDirs) {
      if (!fs.existsSync(partDir)) continue;
      const chunks = [];
      let i = 1;
      while (true) {
        const partFile = path.join(partDir, `${base}.part${String(i).padStart(3,'0')}`);
        if (!fs.existsSync(partFile)) break;
        chunks.push(fs.readFileSync(partFile));
        i++;
      }
      if (chunks.length > 0) {
        assembled = Buffer.concat(chunks);
        console.log(`  Assembled ${base} from ${chunks.length} parts (${(assembled.length/1024/1024).toFixed(1)} MB)`);
        break;
      }
    }

    if (assembled) {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(assembled);
    } else {
      res.writeHead(404);
      res.end(`404: ${req.url}`);
    }
  });
}).listen(PORT, () => {
  console.log(`\n🎮 Game Portal server running at http://localhost:${PORT}`);
  console.log(`   Outhold 2: http://localhost:${PORT}/games/outhold2/index.html`);
  console.log(`   Portal:    http://localhost:${PORT}/index.html`);
  console.log('\nCOOP/COEP headers enabled for WebAssembly SharedArrayBuffer\n');
});
