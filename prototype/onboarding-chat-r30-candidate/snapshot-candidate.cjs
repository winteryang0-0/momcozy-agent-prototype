const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const canonical = value => {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
};
const design = JSON.parse(fs.readFileSync(path.join(root, 'design-change.json'), 'utf8'));
const included = [];
function walk(dir = '') {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relative = path.posix.join(dir.replaceAll('\\', '/'), entry.name);
    if (entry.isDirectory()) {
      if (relative !== 'delivery-review') walk(relative);
    } else if (relative !== 'candidate-receipt.json') {
      included.push(relative);
    }
  }
}
walk();
included.sort();
const files = Object.fromEntries(included.map(relative => [relative, digest(fs.readFileSync(path.join(root, relative)))]));
const receipt = {
  status: 'reviewable-candidate-not-frozen',
  previous_baseline_id: design.extends_baseline.id,
  generated_at: new Date().toISOString(),
  source_sha256: digest(fs.readFileSync(path.join(root, design.source.path))),
  scope_sha256: digest(canonical([...design.source.requirements].sort())),
  framework_sha256: digest(canonical(design.framework)),
  system_sha256: digest(canonical(design.system)),
  material_sha256: digest(canonical(files)),
  files,
  approval: null
};
fs.writeFileSync(path.join(root, 'candidate-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log('Candidate material: ' + receipt.material_sha256 + ' (' + included.length + ' files)');
