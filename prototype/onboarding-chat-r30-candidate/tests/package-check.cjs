const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const current = path.resolve(root, '../current');
const read = name => fs.readFileSync(path.join(root, name));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const index = read('index.html').toString('utf8');
const standalone = read('Momcozy-final.html').toString('utf8');
const change = JSON.parse(read('design-change.json').toString('utf8'));
const source = JSON.parse(read('sources/onboarding-chat-r30-requirements.json').toString('utf8'));

assert.equal(hash(read(change.source.path)), change.source.sha256, 'R30 source digest');
assert.equal(hash(fs.readFileSync(path.join(root, change.extends_baseline.design_path))), change.extends_baseline.design_sha256, 'R27 baseline digest');
assert.equal(hash(fs.readFileSync(path.join(current, 'baselines/B-MOMCOZY-20261022-R27/receipt.json'))), change.extends_baseline.receipt_sha256, 'R27 receipt digest');
assert.deepEqual(change.source.requirements, source.requirements.map(item => item.id), 'R30 scope IDs');
for (const id of change.source.requirements) {
  assert.ok(change.mapping.some(item => item.requirement_id === id), id + ' has a page/flow/state mapping');
}

const refs = [...index.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(match => match[1])
  .filter(ref => !ref.startsWith('#'));
for (const ref of refs) {
  assert.ok(!/^(?:https?:|data:|\/\/)/i.test(ref), 'no remote runtime reference: ' + ref);
  assert.ok(fs.existsSync(path.join(root, ref)), 'resource exists: ' + ref);
}
assert.ok(!/<script\s+src=|<link\s+rel="stylesheet"/i.test(standalone), 'single file has no runtime script or stylesheet links');
assert.ok(!/\b(?:src|href)="(?:https?:|assets\/)/i.test(standalone), 'single file has no remote or asset runtime references');
assert.ok(standalone.includes('data-control-id="ONBOARD-finish"'), 'single file contains the latest completion control');
assert.ok(standalone.includes('ob-baby-summary'), 'single file contains the latest multi-baby summary');

const scripts = [...standalone.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
assert.equal(scripts.length, 5, 'all five scripts are inline');
scripts.forEach((script, index) => new vm.Script(script, { filename: 'inline-' + index + '.js' }));

const preservedAssets = fs.readdirSync(path.join(root, 'assets')).filter(name => !['app.js', 'onboarding-chat-r30.css', 'onboarding-chat-r30.js'].includes(name));
for (const name of preservedAssets) {
  assert.equal(hash(read('assets/' + name)), hash(fs.readFileSync(path.join(current, 'assets', name))), name + ' matches R27');
}

console.log('Package checks passed: ' + refs.length + ' local resources, ' + scripts.length + ' inline scripts, ' + preservedAssets.length + ' preserved R27 assets');
