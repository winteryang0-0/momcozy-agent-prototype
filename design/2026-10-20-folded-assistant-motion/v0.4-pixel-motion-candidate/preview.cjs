#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT || 4196);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.md': 'text/markdown; charset=utf-8'
};

http.createServer((request, response) => {
  let relative;
  try {
    relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  fs.stat(target, (error, info) => {
    if (error || !info.isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(target).pipe(response);
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`Folded Assistant V0.4 preview: http://127.0.0.1:${port}/`);
});
