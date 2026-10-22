// Record the candidate's source and output hashes after validation.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const source = path.resolve(root, '..', 'CS-0.6-testboards');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const outputs = [
  'index.html', 'bloom.html', 'orbit.html', 'garden.html', 'berry.html',
  'assets/board.css', 'assets/material.css', 'assets/overview.css',
  'assets/english.css', 'assets/board.js', 'README.md',
  'build-en.cjs', 'validate-en.cjs', 'finalize-en.cjs'
];
const inputs = ['index.html', 'assets/board.js', 'assets/board.css',
  'assets/material.css', 'assets/overview.css', 'design.json', 'candidate-summary.json'];
const result = {
  candidate: 'CS-0.6-en',
  date: '2026-10-21',
  locale: 'en-US',
  status: 'awaiting-user-testing-not-frozen',
  scope: 'English copy and accessible labels for the CS-0.6 overview and four style boards',
  source_candidate: '../CS-0.6-testboards',
  source_sha256: Object.fromEntries(inputs.map(file => [file, sha(path.join(source, file))])),
  files: Object.fromEntries(outputs.map(file => [file, sha(path.join(root, file))])),
  checks: {
    node_syntax: 'pass',
    local_resources: 'pass',
    english_visible_copy: 'pass: no CJK in HTML, CSS, JS, or mock-DOM states',
    visual_asset_parity: 'pass: base CSS and SVG icon definitions match CS-0.6',
    preview_state_switching: 'pass: all four boards, three screens, feedback states, and display toggles in mock DOM',
    actual_browser_render: 'not tested',
    native_os_glass: 'not tested',
    independent_language_review: 'not run'
  }
};
fs.writeFileSync(path.join(root, 'candidate-summary.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(`Recorded ${outputs.length} output hashes and ${inputs.length} source hashes`);
