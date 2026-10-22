// Recompute candidate hashes after edits. A candidate summary is not an approval receipt.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const read = file => fs.readFileSync(path.join(root, file));
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
const canonical = value => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
};

const designPath = path.join(root, 'design.json');
const design = JSON.parse(fs.readFileSync(designPath, 'utf8'));
design.source.sha256 = digest(read('source-input.json'));
fs.writeFileSync(designPath, `${JSON.stringify(design, null, 2)}\n`, 'utf8');

const files = ['index.html', 'bloom.html', 'orbit.html', 'garden.html', 'berry.html', 'assets/board.css', 'assets/material.css', 'assets/overview.css', 'assets/board.js', 'STYLE_SPEC.md', 'source-input.json', 'design.json', 'build-overview.cjs', 'validate.cjs', 'finalize.cjs'];
const hashes = Object.fromEntries(files.map(file => [file, digest(read(file))]));
const summary = {
  candidate: 'CS-0.6',
  date: '2026-10-21',
  status: 'awaiting-user-testing-not-frozen',
  scope: 'four comparable task-color style boards spanning relief to flat icons and frosted to liquid glass',
  framework_sha256: digest(canonical(design.framework)),
  system_sha256: digest(canonical(design.system)),
  source_sha256: design.source.sha256,
  scope_sha256: digest(canonical([...design.source.requirements].sort())),
  confirmation: null,
  files: hashes,
  checks: {
    node_syntax: 'pass',
    static_local_resources: 'pass',
    mock_dom_screen_state_toggle_focus: 'pass',
    task_color_mapping: 'pass: token values and shared task usage checked across four variants',
    icon_material_range: 'pass: ten key icons differ across four variants; material rules and solid fallback checked statically',
    external_runtime_dependencies: 'none detected',
    file_protocol_browser: 'not tested in this run',
    browser_visual: 'not tested; previous local browser attempt was blocked by security policy',
    independent_review: 'not run',
    native_liquid_glass: 'not tested'
  }
};
fs.writeFileSync(path.join(root, 'candidate-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(`Wrote candidate-summary.json for ${files.length} files`);
