import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.AKD_PREVIEW_PORT) || 4173;
const types = {
  '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.xml': 'application/xml',
  '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json'
};

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  let file = pathname === '/' ? '/index.html' : pathname;
  if (/^\/(ru|en|es)\/$/.test(file)) file += 'index.html';
  else if (/^\/(ru|en|es)\/[a-z0-9-]+$/.test(file)) file += '.html';
  else if (/^\/[a-z0-9-]+$/.test(file) && !path.extname(file)) file = `/pages${file}.html`;
  const target = path.resolve(root, `.${file}`);
  if (!target.startsWith(`${root}${path.sep}`) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.setHeader('Content-Type', `${types[path.extname(target)] || 'application/octet-stream'}; charset=utf-8`);
  fs.createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Localized preview: http://127.0.0.1:${port}/ru/`);
});
