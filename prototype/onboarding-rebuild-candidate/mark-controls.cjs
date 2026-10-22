const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const htmlFile = path.join(root, 'index.html');
const design = JSON.parse(fs.readFileSync(path.join(root, 'design.json'), 'utf8'));
const controls = new Map(design.framework.controls.map(control => [control.id, control]));
let count = 0;
let html = fs.readFileSync(htmlFile, 'utf8');
html = html.replace(/data-control-id="([^"]+)"(?: data-component-id="[^"]+")?/g, (match, id) => {
  const control = controls.get(id);
  if (!control) throw new Error('Unknown control ' + id);
  count++;
  return 'data-control-id="' + id + '" data-component-id="' + control.component_id + '"';
});
if (count !== controls.size) throw new Error('Control count mismatch: HTML ' + count + ', design ' + controls.size);
fs.writeFileSync(htmlFile, html);
console.log('Marked ' + count + ' controls');
