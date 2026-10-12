'use strict';
/* Local dev server mimicking Vercel: clean URLs, /api functions, and the headers from vercel.json (incl. CSP). Usage: node tests/serve.js [port] */
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), cfg = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const hdrs = cfg.headers[0].headers, types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };
const api = { '/api/order': require('../api/order.js'), '/api/contact': require('../api/contact.js') };
http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  hdrs.forEach((h) => res.setHeader(h.key, h.value));
  if (api[url]) {
    let b = ''; req.on('data', (d) => (b += d)); req.on('end', () => {
      req.body = b; const r = { setHeader: (k, v) => res.setHeader(k, v), status(c) { res.statusCode = c; return r; }, json(o) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); } };
      try { req.body = JSON.parse(b || '{}'); } catch (e) { req.body = null; }
      api[url](req, r);
    }); return;
  }
  let f = path.join(root, url === '/' ? 'index.html' : url);
  if (!path.extname(f)) f += '.html';
  if (!f.startsWith(root) || !fs.existsSync(f) || /\/(api|lib|scripts|tests)\//.test(url) && !url.startsWith('/lib/')) { res.statusCode = 404; res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(fs.readFileSync(path.join(root, '404.html'))); }
  res.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); res.end(fs.readFileSync(f));
}).listen(+process.argv[2] || 4173, () => console.log('serving on ' + (process.argv[2] || 4173)));
