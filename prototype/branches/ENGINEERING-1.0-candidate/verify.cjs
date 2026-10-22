'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { root, standalone, sha256, fileEntry, generateStandalone } = require('./tools/runtime.cjs');

const branch = JSON.parse(fs.readFileSync(path.join(root, 'branch.json'), 'utf8'));
const design = JSON.parse(fs.readFileSync(path.join(root, 'design.json'), 'utf8'));
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const built = generateStandalone();
const actual = fs.readFileSync(standalone, 'utf8');
assert.equal(actual, built.html, 'Standalone file is stale. Run node build-standalone.cjs.');

for (const relative of built.scripts) {
  new vm.Script(fs.readFileSync(path.join(root, relative), 'utf8'), { filename: relative });
}
for (const page of design.framework.pages) {
  assert.ok(source.includes('data-page-id="' + page.id + '"'), 'Missing page marker: ' + page.id);
}

const foundation = fs.readFileSync(path.join(root, 'assets/app/00-foundation.js'), 'utf8');
assert.ok(foundation.includes("KEY='" + branch.storage_namespace + "'"), 'Branch storage key differs from branch.json');
assert.ok(!foundation.includes("KEY='momcozy-home-1.0'"), 'Branch still uses the R27 storage key');
assert.equal(design.project.id, branch.project_id);
assert.equal(design.project.stage, 'draft');

assert.match(branch.source.baseline_id, /^B-[A-Za-z0-9-]+$/);
const baselineDirectory = path.join(root, 'upstream-baseline', branch.source.baseline_id);
const receiptBytes = fs.readFileSync(path.join(baselineDirectory, 'receipt.json'));
const snapshotBytes = fs.readFileSync(path.join(baselineDirectory, 'design.json'));
const receipt = JSON.parse(receiptBytes);
const frozen = JSON.parse(snapshotBytes);
const approval = JSON.parse(fs.readFileSync(path.join(baselineDirectory, 'approval.json'), 'utf8'));
assert.equal(sha256(receiptBytes), branch.source.baseline_receipt_sha256);
assert.equal(sha256(snapshotBytes), branch.source.baseline_snapshot_sha256);
assert.equal(receipt.snapshot_sha256, branch.source.baseline_snapshot_sha256);
assert.equal(receipt.baseline_id, approval.baseline_id);
assert.equal(receipt.framework_sha256, approval.framework_sha256);
assert.equal(receipt.system_sha256, approval.system_sha256);
assert.equal(receipt.source_sha256, approval.source_sha256);
assert.equal(receipt.scope_sha256, approval.scope_sha256);
if (branch.design_delta.status === 'none') {
  assert.deepEqual(design.framework, frozen.framework, 'Framework changed without a recorded candidate delta');
  assert.deepEqual(design.system, frozen.system, 'Design system changed without a recorded candidate delta');
  assert.deepEqual(design.source, frozen.source, 'Requirement source changed without a recorded candidate delta');
} else {
  assert.equal(branch.design_delta.status, 'candidate');
  const changeLog = branch.design_delta.change_log;
  assert.ok(/^docs\/[A-Za-z0-9_./-]+\.md$/.test(changeLog) && !changeLog.includes('..'));
  assert.ok(fs.statSync(path.join(root, changeLog)).size > 0, 'Missing candidate design change log');
}

const references = new Map();
function collectSources(value) {
  if (!value || typeof value !== 'object') return;
  if (typeof value.path === 'string' && value.path.startsWith('sources/') && typeof value.sha256 === 'string') {
    assert.ok(/^sources\/[A-Za-z0-9_./-]+$/.test(value.path) && !value.path.includes('..'));
    references.set(value.path, value.sha256);
  }
  for (const nested of Object.values(value)) collectSources(nested);
}
collectSources(design.source);
for (const [relative, expected] of references) {
  assert.equal(sha256(fs.readFileSync(path.join(root, relative))), expected, 'Source snapshot changed: ' + relative);
}

const paths = [...new Set(['index.html', 'Momcozy-final.html', ...built.dependencies])].sort();
const expectedFiles = paths.map(fileEntry);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'runtime-manifest.json'), 'utf8'));
assert.equal(manifest.branch, branch.name);
assert.equal(manifest.source_standalone_sha256, branch.source.standalone_sha256);
assert.deepEqual(manifest.files, expectedFiles, 'Runtime manifest is stale. Run node build-standalone.cjs.');

console.log('Verified ' + built.styles.length + ' stylesheets, ' + built.scripts.length + ' scripts, ' + paths.length + ' runtime files');
console.log('Verified ' + references.size + ' inherited requirement snapshots and ' + design.framework.pages.length + ' page markers');
console.log('Verified upstream baseline snapshot; design delta: ' + branch.design_delta.status);
console.log('Standalone SHA-256 ' + sha256(Buffer.from(actual)));
