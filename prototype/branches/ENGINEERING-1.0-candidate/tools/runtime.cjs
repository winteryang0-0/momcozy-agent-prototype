'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const entry = path.join(root, 'index.html');
const standalone = path.join(root, 'Momcozy-final.html');
const imageTypes = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml'
};

function assetPath(relative) {
  if (!/^assets\/[A-Za-z0-9_./-]+$/.test(relative) || relative.includes('..')) {
    throw new Error('Invalid local asset path: ' + relative);
  }
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(root + path.sep) || !fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    throw new Error('Missing local asset: ' + relative);
  }
  return absolute;
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function fileEntry(relative) {
  const bytes = fs.readFileSync(path.join(root, relative));
  return { path: relative, size: bytes.length, sha256: sha256(bytes) };
}

function imageData(relative) {
  const extension = path.extname(relative).slice(1).toLowerCase();
  const type = imageTypes[extension];
  if (!type) throw new Error('Unsupported inline image: ' + relative);
  return 'data:' + type + ';base64,' + fs.readFileSync(assetPath(relative)).toString('base64');
}

function inlineStylesheet(css, stylesheet, dependencies) {
  return css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, quote, reference) => {
    if (/^(?:data:|#)/i.test(reference)) return match;
    if (/^(?:https?:|\/\/|\/)/i.test(reference)) throw new Error('External or absolute CSS resource: ' + reference);
    const relative = path.posix.normalize(path.posix.join(path.posix.dirname(stylesheet), reference));
    dependencies.add(relative);
    return 'url(' + imageData(relative) + ')';
  });
}

function generateStandalone() {
  let html = fs.readFileSync(entry, 'utf8');
  const dependencies = new Set();
  const styles = [];
  const scripts = [];

  html = html.replace(/<link\b[^>]*>/gi, tag => {
    if (!/\brel\s*=\s*["']stylesheet["']/i.test(tag)) return tag;
    const match = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!match) throw new Error('Stylesheet link has no href');
    const relative = match[1];
    dependencies.add(relative);
    styles.push(relative);
    const css = fs.readFileSync(assetPath(relative), 'utf8');
    return '<style>' + inlineStylesheet(css, relative, dependencies) + '</style>';
  });

  html = html.replace(/<script\b[^>]*\bsrc\s*=\s*["'][^"']+["'][^>]*>\s*<\/script>/gi, tag => {
    const match = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (!match) throw new Error('Script has no src');
    const relative = match[1];
    dependencies.add(relative);
    scripts.push(relative);
    return '<script>' + fs.readFileSync(assetPath(relative), 'utf8') + '</script>';
  });

  html = html.replace(/(["'])(assets\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|gif|svg))\1/gi, (match, quote, relative) => {
    dependencies.add(relative);
    return quote + imageData(relative) + quote;
  });
  html = html.replace(/url\(\s*(assets\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|gif|svg))\s*\)/gi, (match, relative) => {
    dependencies.add(relative);
    return 'url(' + imageData(relative) + ')';
  });

  if (!styles.length || !scripts.length) throw new Error('No styles or scripts found in index.html');
  if (/<script\b[^>]*\bsrc\s*=/i.test(html) || /<link\b[^>]*\brel\s*=\s*["']stylesheet["']/i.test(html)) {
    throw new Error('A runtime stylesheet or script was not inlined');
  }
  if (/(?:src|href)\s*=\s*["'](?:assets\/|https?:\/\/|\/\/)/i.test(html) ||
      /["']assets\/[A-Za-z0-9_./-]+["']/.test(html)) {
    throw new Error('Standalone HTML still contains a runtime asset reference');
  }

  return { html, dependencies: [...dependencies].sort(), styles, scripts };
}

module.exports = { root, entry, standalone, assetPath, sha256, fileEntry, generateStandalone };
