'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { root, standalone, sha256, fileEntry, generateStandalone } = require('./tools/runtime.cjs');

const branch = JSON.parse(fs.readFileSync(path.join(root, 'branch.json'), 'utf8'));
const built = generateStandalone();
fs.writeFileSync(standalone, built.html, 'utf8');

const paths = [...new Set(['index.html', 'Momcozy-final.html', ...built.dependencies])].sort();
const manifest = {
  schema_version: '1.0',
  branch: branch.name,
  source_standalone_sha256: branch.source.standalone_sha256,
  purpose: 'Runtime file integrity only; design and browser reviews are separate.',
  files: paths.map(fileEntry)
};
fs.writeFileSync(path.join(root, 'runtime-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log('Built ' + path.relative(root, standalone) + ' (' + Buffer.byteLength(built.html) + ' bytes)');
console.log('SHA-256 ' + sha256(Buffer.from(built.html)));
console.log('Tracked ' + paths.length + ' runtime files');
