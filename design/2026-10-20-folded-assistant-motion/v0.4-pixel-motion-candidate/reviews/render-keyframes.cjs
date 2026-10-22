#!/usr/bin/env node
'use strict';

// Offline review of the two-clip app.js using a small stand-in DOM and clock.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createCanvas, Image: CanvasImage } = require('@napi-rs/canvas');

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

  const buttons = ['jump', 'sway'].map(clip => {
    const button = new FakeElement();
    button.dataset.clip = clip;
    return button;
  });
  let scheduled = null;
  let frameId = 0;
  const runtime = {
    Image: class { constructor() { return source; } },
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

  // The bitmap is decoded, but hold its load event to test late delivery.
  Object.defineProperty(source, 'src', { set() {} });
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
    buttons.find(button => button.dataset.clip === name).dispatch('click');
    // The first frame establishes requestAnimationFrame's previous timestamp.
    nextFrame(1000);
    for (const [fraction, label] of marks) {
      if (fraction > 0) nextFrame(1000 + fraction * duration);
      save(label);
    }
  }

  captureClip('jump', 1300, [
    [0, 'jump-00'], [0.47, 'jump-apex-47'],
    [0.82, 'jump-landing-82'], [1, 'jump-100']
  ]);
  captureClip('sway', 1800, [
    [0, 'sway-00'], [0.30, 'sway-apex-30'],
    [0.70, 'sway-opposite-70'], [1, 'sway-100']
  ]);

  const overviewTiles = [
    ['jump-00', 'JUMP / START'], ['jump-apex-47', 'JUMP / APEX'],
    ['jump-landing-82', 'JUMP / LAND'], ['jump-100', 'JUMP / REST'],
    ['sway-00', 'SWAY / START'], ['sway-apex-30', 'SWAY / SIDE'],
    ['sway-opposite-70', 'SWAY / OPPOSITE'], ['sway-100', 'SWAY / REST']
  ];
  const tileWidth = 240;
  const tileHeight = Math.min(400, Math.max(174, Math.round(tileWidth * config.height / config.width)));
  const rowSpan = tileHeight + 44;
  const overviewHeight = 48 + 2 * rowSpan;
  const overview = createCanvas(1060, overviewHeight);
  const overviewCtx = overview.getContext('2d');
  overviewCtx.fillStyle = '#faf7f2';
  overviewCtx.fillRect(0, 0, 1060, overviewHeight);
  overviewCtx.fillStyle = '#692a3a';
  overviewCtx.font = '600 20px Segoe UI, sans-serif';
  overviewCtx.fillText('02 FOLDED ASSISTANT  /  PIXEL MOTION CANDIDATE', 22, 31);
  for (let i = 0; i < overviewTiles.length; i++) {
    const [name, label] = overviewTiles[i];
    const frameImage = new CanvasImage();
    frameImage.src = fs.readFileSync(path.join(config.out, `${name}.png`));
    await frameImage.decode();
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 20 + col * 255;
    const y = 48 + row * rowSpan;
    const scale = Math.min(tileWidth / frameImage.width, tileHeight / frameImage.height);
    const fitWidth = frameImage.width * scale;
    const fitHeight = frameImage.height * scale;
    overviewCtx.drawImage(frameImage, x + (tileWidth - fitWidth) / 2,
      y + (tileHeight - fitHeight) / 2, fitWidth, fitHeight);
    overviewCtx.strokeStyle = '#e3d9d0';
    overviewCtx.strokeRect(x, y, tileWidth, tileHeight);
    overviewCtx.fillStyle = '#59434a';
    overviewCtx.font = '600 12px Segoe UI, sans-serif';
    overviewCtx.fillText(label, x + 4, y + tileHeight + 21);
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
  assert.equal(elements.seek.value, '0',
    'Disabling reduce motion should return to the start frame.');
  elements.loop.checked = true;
  for (const [name, duration, origin] of [['jump', 1300, 3000], ['sway', 1800, 20000]]) {
    buttons.find(button => button.dataset.clip === name).dispatch('click');
    nextFrame(origin);
    nextFrame(origin + duration + 100);
    assert(Number(elements.seek.value) > 0 && Number(elements.seek.value) < 1000,
      `${name} loop must wrap and continue playing.`);
    nextFrame(origin + 14000);
    assert(Number(elements.seek.value) >= 0 && Number(elements.seek.value) <= 1000,
      `${name} loop must stay in range after a long background delay.`);
    assert(Number(elements.timecode.textContent.split(' / ')[0]) >= 0 &&
      Number(elements.timecode.textContent.split(' / ')[0]) <= duration / 1000,
    `${name} timecode must stay in range after a long background delay.`);
    assert.equal(elements.play.disabled, true, `${name} loop must remain active.`);
  }
  source.onload();
  assert.equal(elements['clip-meta'].textContent, '轻摇 · 1.8 秒',
    'Late image loading must not overwrite a user-selected clip.');
  console.log('Player state checks passed: seek, reduce motion, both loops, long gap, late image load.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
