const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const manifestName = 'file-manifest.json';
const revision = 'onboarding-berry-ui-19';

function collect(directory = root) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${absolute}`);
    if (entry.isDirectory()) {
      files.push(...collect(absolute));
      continue;
    }
    if (!entry.isFile()) continue;
    const relative = path.relative(root, absolute).replaceAll('\\', '/');
    if (relative === manifestName) continue;
    const bytes = fs.readFileSync(absolute);
    files.push({
      path: relative,
      size: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex')
    });
  }
  return files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
}

const files = collect();
const manifestPath = path.join(root, manifestName);

if (process.argv.includes('--check')) {
  const saved = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (saved.revision !== revision || JSON.stringify(saved.files) !== JSON.stringify(files)) {
    throw new Error('Manifest differs from current files');
  }
  console.log(`Manifest verified: ${files.length} files`);
} else {
  const manifest = {
    schema_version: '1.0',
    revision,
    generated_at: new Date().toISOString(),
    purpose: 'static file integrity; not a browser or design approval',
    historical_manifest: 'sources/revision-14-file-manifest.json',
    previous_manifest: '../versions/first-visit-onboarding-18/file-manifest.json',
    files
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${manifestName}: ${files.length} files`);
}
