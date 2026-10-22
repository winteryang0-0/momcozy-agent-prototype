const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const source = read('index.html');
const style = read('assets/style.css') + '\n' + read('assets/berry.css') + '\n' + read('assets/layout-16.css');
const scripts = ['icons.js', 'motion-model.js', 'companion.js', 'app.js'];

let bundle = source.replace(
  '<link rel="stylesheet" href="assets/style.css"><link rel="stylesheet" href="assets/berry.css"><link rel="stylesheet" href="assets/layout-16.css">',
  `<style>${style}</style>`
);
if (bundle === source) throw new Error('Stylesheet links were not found');

for (const script of scripts) {
  const tag = `<script src="assets/${script}"></script>`;
  let body = read(`assets/${script}`);
  if (script === 'companion.js') {
    const sprite = fs.readFileSync(path.join(root, 'assets/soft-expressions.png')).toString('base64');
    if (!body.includes("img.src='assets/soft-expressions.png'")) throw new Error('Sprite reference changed');
    body = body.replace("img.src='assets/soft-expressions.png'", `img.src='data:image/png;base64,${sprite}'`);
  }
  if (!bundle.includes(tag)) throw new Error(`Script tag missing: ${script}`);
  bundle = bundle.replace(tag, () => `<script>${body}</script>`);
}
if (/\b(?:src|href)="(?:https?:|assets\/)/i.test(bundle)) throw new Error('Unexpected external runtime resource');
fs.writeFileSync(path.join(root, 'Momcozy-final.html'), bundle, 'utf8');
console.log('Wrote Momcozy-final.html');
