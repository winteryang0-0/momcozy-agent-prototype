'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { root } = require('./tools/runtime.cjs');

const types = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml'
};
const requestedPort = process.env.MOMCOZY_PREVIEW_PORT;
const port = requestedPort === undefined ? 0 : Number(requestedPort);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid MOMCOZY_PREVIEW_PORT');

const server = http.createServer((request, response) => {
  let relative;
  try {
    relative = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname).replace(/^\/+/, '') || 'index.html';
  } catch {
    response.writeHead(400);
    response.end();
    return;
  }
  if (!(relative === 'index.html' || relative === 'Momcozy-final.html' ||
        /^assets\/[A-Za-z0-9_./-]+$/.test(relative)) || relative.includes('..')) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(root + path.sep) || !fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  response.setHeader('Content-Type', types[path.extname(relative).slice(1).toLowerCase()] || 'application/octet-stream');
  response.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(absolute).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log('Preview: http://127.0.0.1:' + server.address().port + '/#/home');
});
