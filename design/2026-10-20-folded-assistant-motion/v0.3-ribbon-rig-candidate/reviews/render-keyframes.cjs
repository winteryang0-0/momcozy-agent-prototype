#!/usr/bin/env node
'use strict';

// Offline visual review of the existing app.js. The DOM and requestAnimationFrame
// below are small stand-ins; the animation drawing code is loaded unchanged.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createCanvas, Image: CanvasImage, Path2D } = require('@napi-rs/canvas');

const projectDir = path.resolve(__dirname, '..');

function options() {
  const result = { width: 800, height: 580, out: path.join(__dirname, 'frames') };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 2) {
    const option = args[i];
    const value = args[i + 1];
    if (!value) throw new Error(`Missing value for ${option}`);
    if (option === '--width') result.width = Number(value);
    else if (option === '--height') result.height = Number(value);
    else if (option === '--out') result.out = path.resolve(value);
    else throw new Error(`Unknown option: ${option}`);
  }
  if (!Number.isInteger(result.width) || result.width < 200 ||
      !Number.isInteger(result.height) || result.height < 200) {
    throw new Error('Width and height must be integers of at least 200 pixels.');
  }
  return result;
}

class FakeElement {
  constructor() {
    this.listeners = new Map();
    this.dataset = {};
    this.checked = false;
    this.value = '0';
    this.textContent = '';
    this.style = {};
  }

  addEventListener(type, listener) { this.listeners.set(type, listener); }
  setAttribute(name, value) { this[name] = value; }
  replaceChildren(...children) { this.children = children; }
  append(...children) { this.children = [...(this.children || []), ...children]; }
  dispatch(type) {
    const listener = this.listeners.get(type);
    if (!listener) throw new Error(`No ${type} listener registered.`);
    listener();
  }
}

async function main() {
  const config = options();
  const source = new CanvasImage();
  source.src = fs.readFileSync(path.join(projectDir, 'assets', 'folded-hero-original-pixels.png'));
  await source.decode(); // @napi-rs/canvas dimensions can be ready before pixels are.
  if (source.naturalWidth !== 710 || source.naturalHeight !== 830) {
    throw new Error(`Unexpected character image: ${source.naturalWidth}×${source.naturalHeight}`);
  }
  const frontSource = new CanvasImage();
  frontSource.src = fs.readFileSync(path.join(projectDir, 'assets', 'folded-front-original-pixels.png'));
  await frontSource.decode();
  if (frontSource.naturalWidth !== 330 || frontSource.naturalHeight !== 385) {
    throw new Error(`Unexpected front image: ${frontSource.naturalWidth}×${frontSource.naturalHeight}`);
  }
  const headShellSource = new CanvasImage();
  headShellSource.src = fs.readFileSync(path.join(projectDir, 'assets', 'folded-head-shell.png'));
  await headShellSource.decode();
  if (headShellSource.naturalWidth !== 710 || headShellSource.naturalHeight !== 830) {
    throw new Error(`Unexpected head shell image: ${headShellSource.naturalWidth}×${headShellSource.naturalHeight}`);
  }

  const ids = ['stage', 'motion-canvas', 'seek', 'play', 'pause', 'loop', 'slow',
    'reduce', 'timecode', 'status', 'clip-meta', 'stage-state', 'clip-steps', 'clip-boundary'];
  const elements = Object.fromEntries(ids.map(id => [id, new FakeElement()]));
  const actorCanvas = createCanvas(config.width, config.height);
  elements.stage.getBoundingClientRect = () => ({ width: config.width, height: config.height });
  elements['motion-canvas'].getContext = type => actorCanvas.getContext(type);
  Object.defineProperties(elements['motion-canvas'], {
    width: { get: () => actorCanvas.width, set: value => { actorCanvas.width = value; } },
    height: { get: () => actorCanvas.height, set: value => { actorCanvas.height = value; } }
  });

  const buttons = ['form', 'jump', 'clap', 'sway'].map(clip => {
    const button = new FakeElement();
    button.dataset.clip = clip;
    return button;
  });
  let scheduled = null;
  let frameId = 0;
  const imageInstances = [source, frontSource, headShellSource];
  const runtime = {
    Image: class { constructor() { return imageInstances.shift(); } },
    Path2D,
    document: {
      getElementById: id => elements[id],
      querySelectorAll: selector => selector === '.clip-button' ? buttons : [],
      createElement: tag => tag === 'canvas' ? createCanvas(1, 1) : new FakeElement()
    },
    window: {
      devicePixelRatio: 1,
      matchMedia: () => ({ matches: false, addEventListener() {} }),
      addEventListener() {}
    },
    requestAnimationFrame: callback => { scheduled = callback; return ++frameId; },
    cancelAnimationFrame: () => { scheduled = null; },
    console
  };

  // The source image is already decoded. Trigger app.js's image-load handler
  // when it assigns the relative URL, without asking the stand-in to fetch it.
  Object.defineProperty(source, 'src', { set() { if (this.onload) this.onload(); } });
  Object.defineProperty(frontSource, 'src', { set() { if (this.onload) this.onload(); } });
  Object.defineProperty(headShellSource, 'src', { set() { if (this.onload) this.onload(); } });
  vm.runInNewContext(fs.readFileSync(path.join(projectDir, 'assets', 'app.js'), 'utf8'), runtime,
    { filename: 'assets/app.js' });

  function nextFrame(timeMs) {
    if (!scheduled) throw new Error(`Animation stopped before ${timeMs} ms.`);
    const callback = scheduled;
    scheduled = null;
    callback(timeMs);
  }

  function save(name) {
    const composite = createCanvas(config.width, config.height);
    const context = composite.getContext('2d');
    context.fillStyle = '#faf7f2';
    context.fillRect(0, 0, config.width, config.height);
    context.drawImage(actorCanvas, 0, 0);
    fs.mkdirSync(config.out, { recursive: true });
    const target = path.join(config.out, `${name}.png`);
    fs.writeFileSync(target, composite.toBuffer('image/png'));
    console.log(target);
  }

  function captureClip(name, duration, marks) {
    if (name !== 'form') buttons.find(button => button.dataset.clip === name).dispatch('click');
    // The first frame establishes requestAnimationFrame's previous timestamp.
    nextFrame(1000);
    for (const [fraction, label] of marks) {
      if (fraction > 0) nextFrame(1000 + fraction * duration);
      save(label);
    }
  }

  captureClip('form', 2400, [
    [0, 'form-00'], [0.20, 'form-20'], [0.30, 'form-30'],
    [0.40, 'form-40'], [0.50, 'form-50'], [0.55, 'form-55'],
    [0.60, 'form-60'], [0.65, 'form-65'], [0.70, 'form-70'],
    [0.80, 'form-80'], [0.94, 'form-94'], [0.98, 'form-98'],
    [1, 'form-100']
  ]);
  captureClip('clap', 1700, [
    [0, 'clap-00'], [0.15, 'clap-15'], [0.25, 'clap-25'],
    [0.38, 'clap-contact-candidate-38'], [0.50, 'clap-50'],
    [0.65, 'clap-contact-candidate-65'], [0.80, 'clap-80'], [1, 'clap-100']
  ]);
  captureClip('jump', 1300, [[0.47, 'jump-apex-47']]);
  captureClip('sway', 1800, [[0.304, 'sway-apex-30']]);

  const frontFrame = createCanvas(config.width, config.height);
  const frontCtx = frontFrame.getContext('2d');
  frontCtx.fillStyle = '#faf7f2';
  frontCtx.fillRect(0, 0, config.width, config.height);
  const frontScale = Math.min((config.width - 120) / frontSource.width, (config.height - 86) / frontSource.height, 1.22);
  frontCtx.drawImage(frontSource, (config.width - frontSource.width * frontScale) / 2,
    config.height - 39 - frontSource.height * frontScale,
    frontSource.width * frontScale, frontSource.height * frontScale);
  const frontTarget = path.join(config.out, 'source-front.png');
  fs.writeFileSync(frontTarget, frontFrame.toBuffer('image/png'));
  console.log(frontTarget);

  const detail = createCanvas(800, 200);
  const detailCtx = detail.getContext('2d');
  detailCtx.fillStyle = '#faf7f2';
  detailCtx.fillRect(0, 0, 800, 200);
  detailCtx.drawImage(source, 320, 115, 195, 90, 0, 0, 400, 185);
  detailCtx.drawImage(headShellSource, 320, 115, 195, 90, 400, 0, 400, 185);
  const detailTarget = path.join(config.out, 'head-shell-detail.png');
  fs.writeFileSync(detailTarget, detail.toBuffer('image/png'));
  console.log(detailTarget);

  const overviewTiles = [
    ['form-00', 'FORM / 00'], ['form-30', 'FORM / 30'],
    ['form-55', 'FORM / 55'], ['form-65', 'FORM / 65'],
    ['form-100', 'FORM / 100'], ['clap-00', 'FRONT / ORIGINAL'],
    ['clap-contact-candidate-38', 'WINGS / IN'],
    ['jump-apex-47', 'JUMP / APEX'],
    ['sway-apex-30', 'SWAY / SIDE'],
    ['clap-100', 'FRONT / RETURN']
  ];
  const overview = createCanvas(1300, 520);
  const overviewCtx = overview.getContext('2d');
  overviewCtx.fillStyle = '#faf7f2';
  overviewCtx.fillRect(0, 0, 1300, 520);
  overviewCtx.fillStyle = '#692a3a';
  overviewCtx.font = '600 20px Segoe UI, sans-serif';
  overviewCtx.fillText('02 FOLDED ASSISTANT  /  MOTION CANDIDATE V0.3', 22, 31);
  for (let i = 0; i < overviewTiles.length; i++) {
    const [name, label] = overviewTiles[i];
    const frameImage = new CanvasImage();
    frameImage.src = fs.readFileSync(path.join(config.out, `${name}.png`));
    await frameImage.decode();
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = 20 + col * 255;
    const y = 48 + row * 232;
    overviewCtx.drawImage(frameImage, x, y, 240, 174);
    overviewCtx.strokeStyle = '#e3d9d0';
    overviewCtx.strokeRect(x, y, 240, 174);
    overviewCtx.fillStyle = '#59434a';
    overviewCtx.font = '600 12px Segoe UI, sans-serif';
    overviewCtx.fillText(label, x + 4, y + 195);
  }
  const overviewTarget = path.join(config.out, 'motion-overview.png');
  fs.writeFileSync(overviewTarget, overview.toBuffer('image/png'));
  console.log(overviewTarget);

  elements.seek.value = '500';
  elements.seek.dispatch('input');
  assert.equal(elements.seek.value, '500', 'Manual seek should remain at the requested frame.');
  assert.equal(elements.timecode.textContent, '0.90 / 1.80 秒');
  elements.reduce.checked = true;
  elements.reduce.dispatch('change');
  assert.equal(elements.seek.value, '1000', 'Reduce motion should present the end frame.');
  elements.reduce.checked = false;
  elements.reduce.dispatch('change');
  elements.loop.checked = true;
  buttons.find(button => button.dataset.clip === 'form').dispatch('click');
  nextFrame(3000);
  nextFrame(5400);
  nextFrame(5600);
  assert(Number(elements.seek.value) < 1000,
    'Formation loop should reverse rather than jump from the last frame to the first.');
  console.log('Player state checks passed: seek, reduce motion, formation reverse loop.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
