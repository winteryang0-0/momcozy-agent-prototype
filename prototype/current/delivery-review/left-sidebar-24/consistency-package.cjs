const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const design = JSON.parse(read('design.json'));
const evidence = JSON.parse(read('delivery-review/left-sidebar-24/browser-evidence.json'));
const modular = read('index.html').toString('utf8');
const standalone = read('Momcozy-final.html').toString('utf8');
const assets = [...modular.matchAll(/(?:src|href)="(assets\/[^\"]+)"/g)].map(match => match[1]);
const missing = assets.filter(file => !fs.existsSync(path.join(root, file)));
const screenshots = evidence.screenshots.map(item => ({ path: item.path, hash_matches: sha(read(item.path)) === item.sha256 }));
const result = {
  revision: 'left-sidebar-24', reviewed_at: new Date().toISOString(),
  design_sha256: sha(read('design.json')),
  source_sha256: sha(read(design.source.path)),
  source_hash_matches: sha(read(design.source.path)) === design.source.sha256,
  standalone_sha256: sha(read('Momcozy-final.html')),
  modular_sha256: sha(read('index.html')),
  author_browser_evidence_hash_matches:
    sha(read('Momcozy-final.html')) === evidence.source_sha256.standalone &&
    sha(read('index.html')) === evidence.source_sha256.modular,
  author_browser_errors: evidence.errors,
  screenshot_count: screenshots.length,
  screenshot_hashes_match: screenshots.every(item => item.hash_matches),
  modular_assets: assets, missing_modular_assets: missing,
  standalone_external_runtime_references: /(?:src|href)="(?:https?:|assets\/)/i.test(standalone),
  standalone_contains_sidebar_markup: standalone.includes('id="care-sidebar"'),
  standalone_contains_sidebar_logic: standalone.includes('function renderSidebar()'),
};
const output = path.join(__dirname, 'consistency-package-evidence.json');
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
