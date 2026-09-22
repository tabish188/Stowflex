const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = process.argv[2] || 8810;
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.json': 'application/json'
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  // Mirrors the forced /blog/:slug -> /blog/post.html rewrite in _redirects:
  // every post is one dynamic page, no per-slug file needed.
  const slugMatch = p.match(/^\/blog\/([^/]+)\/?$/);
  if (slugMatch && !/^post(\.html)?$/i.test(slugMatch[1])) p = '/blog/post.html';
  const base = path.join(root, p);
  if (!base.startsWith(root)) { res.writeHead(403); res.end(); return; }
  // Clean URLs: /about -> about.html, /admin/ -> admin/index.html
  const candidates = [base, base + '.html', path.join(base, 'index.html')];
  (function next(i) {
    if (i >= candidates.length) { res.writeHead(404); res.end('Not found'); return; }
    fs.readFile(candidates[i], (err, data) => {
      if (err) return next(i + 1);
      // Directory index served without a trailing slash breaks the page's own
      // relative asset URLs (e.g. /admin -> admin.css resolves as /admin.css).
      // Redirect to the slash form first, like most static hosts do.
      if (i === 2 && !p.endsWith('/')) {
        const qs = req.url.indexOf('?');
        res.writeHead(301, { Location: p + '/' + (qs > -1 ? req.url.slice(qs) : '') });
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': types[path.extname(candidates[i])] || 'application/octet-stream' });
      res.end(data);
    });
  })(0);
}).listen(port, () => console.log('Serving on ' + port));
