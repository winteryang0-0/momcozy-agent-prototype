const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const evidence = path.join(root, 'evidence');
const sourceFiles = [
  'index.html',
  'assets/style.css',
  'assets/berry.css',
  'assets/ai-first.css',
  'assets/icons.js',
  'assets/motion-model.js',
  'assets/companion.js',
  'assets/app.js',
  'assets/soft-expressions.png',
  'Momcozy-final.html'
];
const shots = [
  ['assistant-light-320x568.jpg', '#/assistant', 'light; one-line composer; recorded example', 320, 568],
  ['assistant-light-390x667.jpg', '#/assistant', 'light; one-line composer; recorded example', 390, 667],
  ['assistant-dark-320x568.jpg', '#/assistant', 'dark; normal transparency; recorded example', 320, 568],
  ['assistant-dark-390x667.jpg', '#/assistant', 'dark; normal transparency; recorded example', 390, 667],
  ['assistant-dark-reduced-320x568.jpg', '#/assistant', 'dark; reduced transparency; recorded example', 320, 568],
  ['assistant-multiline-320x568.jpg', '#/assistant', 'light; three-line composer; recorded example', 320, 568],
  ['assistant-multiline-390x667.jpg', '#/assistant', 'light; three-line composer; recorded example', 390, 667],
  ['today-light-320x568.jpg', '#/home', 'light; one recorded bottle feed', 320, 568],
  ['today-light-390x667.jpg', '#/home', 'light; one recorded bottle feed', 390, 667],
  ['today-dark-320x568.jpg', '#/home', 'dark; one recorded bottle feed', 320, 568],
  ['today-dark-390x667.jpg', '#/home', 'dark; one recorded bottle feed', 390, 667],
  ['records-light-320x568.jpg', '#/records', 'light; one recorded bottle feed; top record button only', 320, 568],
  ['records-light-390x667.jpg', '#/records', 'light; one recorded bottle feed', 390, 667],
  ['records-dark-320x568.jpg', '#/records', 'dark; one recorded bottle feed; top record button only', 320, 568],
  ['records-dark-390x667.jpg', '#/records', 'dark; one recorded bottle feed', 390, 667]
];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function jpegSize(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Not JPEG');
  let i = 2;
  while (i < bytes.length - 9) {
    if (bytes[i++] !== 0xff) continue;
    let marker = bytes[i++];
    while (marker === 0xff) marker = bytes[i++];
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x00) continue;
    const length = bytes.readUInt16BE(i);
    if (length < 2 || i + length > bytes.length) throw new Error('Invalid JPEG marker');
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {width: bytes.readUInt16BE(i + 5), height: bytes.readUInt16BE(i + 3)};
    }
    i += length;
  }
  throw new Error('JPEG dimensions not found');
}
const sources = Object.fromEntries(sourceFiles.map(file => [file, sha(fs.readFileSync(path.join(root, file)))]));
const sourceMaterialHash = sha(Buffer.from(Object.entries(sources).map(([file, hash]) => `${file}:${hash}`).join('\n')));
const mismatches = [];
const screenshots = shots.map(([file, route, state, width, height]) => {
  const full = path.join(evidence, file);
  const bytes = fs.readFileSync(full);
  const pixels = jpegSize(bytes);
  if (pixels.width !== width || pixels.height !== height) mismatches.push(`${file}: unexpected ${pixels.width}x${pixels.height}`);
  return {
    path: `evidence/${file}`,
    route,
    url: `http://127.0.0.1:4194/${route}`,
    state,
    viewport: {width, height},
    actual_pixels: pixels,
    format: 'image/jpeg',
    full_page: false,
    operator: 'primary agent using ChatGPT in-app browser via cua_repl',
    browser_version: 'unknown',
    captured_and_saved_at_utc: fs.statSync(full).mtime.toISOString(),
    sha256: sha(bytes)
  };
});
if (mismatches.length) throw new Error(mismatches.join('\n'));
const manifest = {
  candidate_id: 'AI-1.1',
  evidence_mode: 'actual-browser-screenshots',
  browser: 'ChatGPT in-app browser',
  protocol: 'local HTTP',
  source_material_sha256: sourceMaterialHash,
  source_files_sha256: sources,
  screenshots,
  note: 'Screenshots were captured through a desktop browser with mobile viewport overrides; physical mobile devices and software keyboard were not tested.'
};
fs.writeFileSync(path.join(evidence, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote evidence/manifest.json with ${screenshots.length} screenshots`);
