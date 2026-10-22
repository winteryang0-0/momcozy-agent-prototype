const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, 'assets', 'styles.css');
let css = fs.readFileSync(file, 'utf8');
const root = css.match(/:root\s*\{([^}]+)\}/);
if (!root) throw new Error('Missing root token block');
const known = new Set([...root[1].matchAll(/(--[a-z][a-z0-9-]*)\s*:/g)].map(match => match[1]));
const declarations = [];
const suffixes = { 'font-family': 'font-family', 'font-size': 'font-size', 'border-radius': 'radius', 'box-shadow': 'shadow', color: 'color' };
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
let counter = 0;
let body = css.slice(root.index + root[0].length);
body = body.replace(/([;{]\s*)(font-family|font-size|border-radius|box-shadow|color)\s*:\s*([^;{}]+)(?=[;}])/g, (whole, prefix, prop, raw) => {
  const value = raw.trim();
  if (value.includes('var(') || ['0', 'none', 'inherit', 'transparent', 'currentColor'].includes(value)) return whole;
  let key = '--' + suffixes[prop] + '-' + slug(value);
  if (!key || key.endsWith('-')) key += String(++counter);
  if (!known.has(key)) {
    known.add(key);
    declarations.push('  ' + key + ': ' + value + ';');
  }
  return prefix + prop + ': var(' + key + ')';
});
css = css.slice(0, root.index + root[0].length - 1) + '\n' + declarations.join('\n') + '\n}' + body;
fs.writeFileSync(file, css);
console.log('Tokenized ' + declarations.length + ' unique declarations');
