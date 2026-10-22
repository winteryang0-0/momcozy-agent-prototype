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
  'Momcozy-final.html',
  'build-standalone.cjs',
  'preview.cjs',
  'verify-day-rollover.cjs'
];
const shots = [
  ['onboarding-zero-320x568.jpg', '#/onboarding', 'zero data; step 1; light', 320, 568, 4198],
  ['onboarding-details-320x568.jpg', '#/onboarding', 'draft resumed; step 2; optional values blank; light', 320, 568, 4198],
  ['onboarding-concerns-320x568.jpg', '#/onboarding', 'step 3; light', 320, 568, 4198],
  ['onboarding-review-320x568.jpg', '#/onboarding', 'step 4; one selected concern; optional count blank; light', 320, 568, 4198],
  ['assistant-zero-light-320x568.jpg', '#/assistant', 'zero profile; first local-day visit; greeting and advice; light', 320, 568, 4199],
  ['assistant-filled-light-320x568.jpg', '#/assistant', 'profile completed; ongoing conversation; light', 320, 568, 4198],
  ['assistant-filled-dark-320x568.jpg', '#/assistant', 'profile completed; ongoing conversation; dark', 320, 568, 4198],
  ['assistant-filled-light-390x667.jpg', '#/assistant', 'profile completed; ongoing conversation; light', 390, 667, 4198],
  ['assistant-filled-dark-390x667.jpg', '#/assistant', 'profile completed; ongoing conversation; dark', 390, 667, 4198],
  ['today-light-320x568.jpg', '#/home', 'no Dock; back to AI; light', 320, 568, 4198],
  ['today-dark-320x568.jpg', '#/home', 'no Dock; back to AI; dark', 320, 568, 4198],
  ['today-light-390x667.jpg', '#/home', 'no Dock; back to AI; light', 390, 667, 4198],
  ['today-dark-390x667.jpg', '#/home', 'no Dock; back to AI; dark', 390, 667, 4198],
  ['records-light-320x568.jpg', '#/records', 'empty list; no Dock; top add; light', 320, 568, 4198],
  ['records-dark-320x568.jpg', '#/records', 'empty list; no Dock; top add; dark', 320, 568, 4198],
  ['records-light-390x667.jpg', '#/records', 'empty list; no Dock; top add and scrollable bottom add; light', 390, 667, 4198],
  ['records-dark-390x667.jpg', '#/records', 'empty list; no Dock; top add and scrollable bottom add; dark', 390, 667, 4198],
  ['motion-frame-a.jpg', '#/assistant', 'first-visit animated companion frame A; clip', 69, 50, 4198],
  ['motion-frame-b.jpg', '#/assistant', 'first-visit animated companion frame B; clip', 69, 50, 4198]
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
const latestSourceTime = Math.max(...sourceFiles.map(file => fs.statSync(path.join(root, file)).mtimeMs));
const screenshots = shots.map(([file, route, state, width, height, port]) => {
  const full = path.join(evidence, file);
  const bytes = fs.readFileSync(full);
  const actual = jpegSize(bytes);
  const saved = fs.statSync(full);
  if (actual.width !== width || actual.height !== height) throw new Error(`${file}: ${actual.width}x${actual.height}, expected ${width}x${height}`);
  if (saved.mtimeMs <= latestSourceTime) throw new Error(`${file}: predates final source material`);
  return {
    path: `evidence/${file}`,
    route,
    url: `http://127.0.0.1:${port}/${route}`,
    state,
    viewport: {width: file.startsWith('motion-frame') ? 320 : width, height: file.startsWith('motion-frame') ? 568 : height},
    actual_pixels: actual,
    format: 'image/jpeg',
    full_page: false,
    clip: file.startsWith('motion-frame') ? {x: 28, y: 150, width, height} : null,
    operator: 'primary agent using ChatGPT in-app browser via cua_repl',
    browser_version: 'unknown',
    captured_and_saved_at_utc: saved.mtime.toISOString(),
    sha256: sha(bytes)
  };
});
const unlisted = fs.readdirSync(evidence).filter(file => /\.jpe?g$/i.test(file) && !shots.some(([name]) => name === file));
if (unlisted.length) throw new Error(`Unlisted screenshots: ${unlisted.join(', ')}`);
const manifest = {
  candidate_id: 'AI-1.2',
  evidence_mode: 'actual-browser-screenshots',
  browser: 'ChatGPT in-app browser',
  protocol: 'local HTTP',
  source_material_sha256: sourceMaterialHash,
  source_files_sha256: sources,
  screenshots,
  motion_comparison: {
    frames: ['evidence/motion-frame-a.jpg', 'evidence/motion-frame-b.jpg'],
    observed_result: screenshots.at(-2).sha256 !== screenshots.at(-1).sha256 ? 'different pixel captures' : 'identical captures'
  },
  note: 'Desktop browser with mobile viewport overrides; physical phones, software keyboard and file:// opening were not tested.'
};
fs.writeFileSync(path.join(evidence, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote evidence/manifest.json with ${screenshots.length} screenshots; source ${sourceMaterialHash}`);
