// Render static QA frames from the exact inline SVG and path definitions used by index.html.
// This intentionally does not drive a browser or claim animation playback verification.
const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
const stageSvg = html.match(/<svg class="character-svg"[\s\S]*?<\/svg>/)?.[0];
if (!stageSvg) throw new Error('Inline character SVG not found');
const svgSource = stageSvg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
const output = path.join(__dirname, 'frames');
fs.mkdirSync(output, { recursive: true });

function pathFor(layer, phase) {
  const region = script.match(new RegExp(`${layer}: \\{([\\s\\S]*?)\\n    \\}`))?.[1];
  const escaped = region?.match(new RegExp(`${phase}: "([^"]+)"`))?.[1];
  if (!escaped) throw new Error(`Path missing for ${layer}/${phase}`);
  return escaped;
}
function sampleCubicPath(source, count = 112) {
  const numbers = (source.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const first = [numbers[0], numbers[1]];
  let current = first;
  const dense = [first];
  for (let i = 2; i + 5 < numbers.length; i += 6) {
    const p1 = [numbers[i], numbers[i + 1]], p2 = [numbers[i + 2], numbers[i + 3]], p3 = [numbers[i + 4], numbers[i + 5]];
    for (let k = 1; k <= 24; k++) {
      const t = k / 24, u = 1 - t;
      dense.push([0, 1].map(j => u ** 3 * current[j] + 3 * u ** 2 * t * p1[j] + 3 * u * t ** 2 * p2[j] + t ** 3 * p3[j]));
    }
    current = p3;
  }
  dense.push(first);
  const lengths = [0];
  for (let i = 1; i < dense.length; i++) lengths.push(lengths[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  return Array.from({length: count}, (_, i) => {
    const distance = lengths[lengths.length - 1] * i / count;
    let j = 1;
    while (j < lengths.length - 1 && lengths[j] < distance) j++;
    const t = (distance - lengths[j - 1]) / (lengths[j] - lengths[j - 1] || 1);
    return [0, 1].map(k => dense[j - 1][k] + (dense[j][k] - dense[j - 1][k]) * t);
  });
}
function blendPath(layer, from, to, progress) {
  const a = sampleCubicPath(pathFor(layer, from));
  const b = sampleCubicPath(pathFor(layer, to));
  return a.map((point, i) => `${i ? 'L' : 'M'}${(point[0] + (b[i][0] - point[0]) * progress).toFixed(1)} ${(point[1] + (b[i][1] - point[1]) * progress).toFixed(1)}`).join(' ') + ' Z';
}
function frame(name, { phase, blend, actor = true, actorTransform = '', leftTransform = '', rightTransform = '' } = {}) {
  let svg = svgSource;
  if (phase || blend) {
    const shape = (layer) => blend ? blendPath(layer, blend[0], blend[1], blend[2]) : pathFor(layer, phase);
    svg = svg.replace('id="morph-outer"', `id="morph-outer" d="${shape('outer')}"`)
      .replace('id="morph-inner"', `id="morph-inner" d="${shape('inner')}"`)
      .replace('id="actor"', 'id="actor" opacity="0"');
  } else svg = svg.replace('id="morph-layer"', 'id="morph-layer" opacity="0"');
  if (actor && actorTransform) svg = svg.replace('id="actor-motion"', `id="actor-motion" transform="${actorTransform}"`);
  if (actor && leftTransform) svg = svg.replace('id="left-arm"', `id="left-arm" transform="${leftTransform}"`);
  if (actor && rightTransform) svg = svg.replace('id="right-arm"', `id="right-arm" transform="${rightTransform}"`);
  if (name === '05-clap') {
    const shortenedFold = script.match(/const clapFold = "([^"]+)"/)?.[1];
    if (!shortenedFold) throw new Error('Clap fold missing');
    svg = svg.replace(/(id="fold-interior" d=")[^"]+/, `$1${shortenedFold}`);
  }
  return sharp(Buffer.from(svg)).resize(780, 690).png().toFile(path.join(output, name + '.png'));
}

const qaFrames = [
  frame('01-flat', { phase: 'flat' }),
  frame('01b-flat-curl', { blend: ['flat', 'curl', .5] }),
  frame('02-curl', { phase: 'curl' }),
  frame('02b-curl-formed', { blend: ['curl', 'formed', .5] }),
  frame('03-formed'),
  frame('04-jump', { actorTransform: 'translate(0 -14) translate(265 405) scale(1 1.012) translate(-265 -405)' }),
  frame('05-clap', { leftTransform: 'translate(211 239) rotate(-65) scale(.8) translate(-211 -239)', rightTransform: 'translate(289 239) rotate(60) scale(.55) translate(-289 -239)' }),
  frame('06-sway', { actorTransform: 'rotate(-4 265 405)' })
];
const qaNames = ['01-flat', '01b-flat-curl', '02-curl', '02b-curl-formed', '03-formed', '04-jump', '05-clap', '06-sway'];
Promise.all(qaFrames).then(async () => {
  const tiles = await Promise.all(qaNames.map(async (name, index) => ({
    input: await sharp(path.join(output, `${name}.png`)).resize(390, 345).png().toBuffer(),
    left: (index % 4) * 390,
    top: Math.floor(index / 4) * 345
  })));
  await sharp({ create: { width: 1560, height: 690, channels: 3, background: '#faf7f2' } })
    .composite(tiles).png().toFile(path.join(__dirname, 'motion-overview.png'));
  console.log('Rendered 8 static QA frames and motion overview');
}).catch((error) => { console.error(error); process.exitCode = 1; });
