/* Local dev server with the same headers as vercel.json. Usage: node scripts/serve.js [port] */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const headers = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')).headers[0].headers;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.mp4': 'video/mp4', '.vtt': 'text/vtt', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };

createServer((req, res) => {
  headers.forEach((h) => res.setHeader(h.key, h.value));
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = normalize(join(root, url === '/' ? 'index.html' : url));
  if (!extname(file) && existsSync(`${file}.html`)) file += '.html';
  if (!file.startsWith(root) || /\/(scripts|tests|content)\//.test(url) || !existsSync(file) || !statSync(file).isFile()) { res.statusCode = 404; res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(readFileSync(join(root, '404.html'))); }
  res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
  createReadStream(file).pipe(res);
}).listen(Number(process.argv[2]) || 4180, () => console.log(`http://localhost:${process.argv[2] || 4180}`));
