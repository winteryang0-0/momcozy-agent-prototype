// Candidate QA: local resources, copy, and preview state controls. No browser render.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = __dirname;
const sourceRoot = path.resolve(root, '..', 'CS-0.6-testboards');
const pages = ['index', 'bloom', 'orbit', 'garden', 'berry'];
const variants = pages.slice(1);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const script = read('assets/board.js');
const overview = read('index.html');
const sourceScript = fs.readFileSync(path.join(sourceRoot, 'assets/board.js'), 'utf8');
const iconBlock = value => value.slice(value.indexOf('const symbols ='), value.indexOf('const state ='));
assert.equal(iconBlock(script), iconBlock(sourceScript), 'English and Chinese SVG icon families differ');
for (const asset of ['board.css', 'material.css', 'overview.css']) {
  assert.equal(read(`assets/${asset}`), fs.readFileSync(path.join(sourceRoot, 'assets', asset), 'utf8'), `${asset}: source visual treatment differs`);
}

for (const name of pages) {
  const html = read(`${name}.html`);
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="en-US">/);
  assert.ok(!/[\u3400-\u9fff]/u.test(html), `${name}: untranslated text`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = match[1];
    if (/^(?:https?:|#)/i.test(ref)) continue;
    assert.ok(fs.existsSync(path.resolve(root, ref)), `${name}: missing ${ref}`);
  }
}
for (const file of ['assets/board.js', 'assets/board.css', 'assets/material.css', 'assets/english.css', 'assets/overview.css']) {
  const source = read(file);
  assert.ok(!/[\u3400-\u9fff]/u.test(source), `${file}: untranslated text`);
  assert.ok(!/@import\b|url\(\s*['"]?https?:/i.test(source), `${file}: remote resource`);
}
assert.ok(!/\bfetch\s*\(|XMLHttpRequest/.test(script), 'unexpected runtime network request');
assert.equal([...overview.matchAll(/class="board (?:bloom|orbit|garden|berry)"/g)].length, 4);
assert.equal([...overview.matchAll(/class="compare-card (?:bloom|orbit|garden|berry)"/g)].length, 4);
assert.equal([...overview.matchAll(/class="compare-icon"/g)].length, 16);
for (const label of ['Bloom Glass', 'Daily Orbit', 'After Rain', 'Berry Poise', 'Feed', 'Crying', 'Diaper', 'Sleep']) {
  assert.ok(overview.includes(label), `overview missing ${label}`);
}

const states = {
  home: ['normal', 'saving', 'saved', 'local', 'failed', 'unknown'],
  records: ['normal', 'saving', 'saved', 'local', 'failed', 'unknown'],
  assistant: ['normal', 'analyzing', 'indeterminate']
};
for (const variant of variants) {
  assert.match(read(`${variant}.html`), new RegExp(`<body data-variant="${variant}">`));
  let markup = '';
  let controls = [];
  let selector, transparency, motion;
  const node = (dataset = {}) => ({
    dataset, listeners: {},
    addEventListener(type, callback) { this.listeners[type] = callback; },
    fire(type, value) { this.listeners[type]({ target: { value, checked: value } }); }
  });
  const board = {
    set innerHTML(value) {
      markup = value;
      controls = [...value.matchAll(/<button\b[^>]*(?:data-page|data-screen)="([^"]+)"[^>]*>/g)]
        .map(match => node({ [match[0].includes('data-page') ? 'page' : 'screen']: match[1] }));
      selector = node(); transparency = node(); motion = node();
    }
  };
  const document = {
    body: { dataset: { variant }, classList: { toggle() {} } },
    getElementById(id) { return { board, result: selector, opaque: transparency, quiet: motion }[id]; },
    querySelectorAll() { return controls; },
    querySelector() { return { focus() {} }; }
  };
  vm.runInNewContext(script, { document }, { filename: 'board.js' });
  assert.equal(controls.length, 6, `${variant}: three preview tabs plus three phone tabs`);
  assert.match(markup, /Feedback scenario/);
  assert.match(markup, /Reduce transparency/);
  assert.match(markup, /Reduce motion/);
  assert.match(markup, /STYLE BOARD/);
  assert.ok(!/[\u3400-\u9fff]/u.test(markup), `${variant}: untranslated initial view`);
  for (const [screen, choices] of Object.entries(states)) {
    const control = controls.find(item => item.dataset.page === screen);
    assert.ok(control, `${variant}: missing ${screen}`);
    control.fire('click');
    assert.ok(!/[\u3400-\u9fff]/u.test(markup), `${variant}/${screen}: untranslated view`);
    for (const choice of choices) {
      selector.fire('change', choice);
      assert.match(markup, new RegExp(`<option value="${choice}" selected>`));
      assert.ok(!/[\u3400-\u9fff]/u.test(markup), `${variant}/${screen}/${choice}: untranslated state`);
      if (choice !== 'normal') assert.match(markup, /Suggested next step:/);
    }
  }
  transparency.fire('change', true);
  motion.fire('change', true);
  assert.match(markup, /id="opaque" checked/);
  assert.match(markup, /id="quiet" checked/);
  console.log(`${variant}: English copy, page switching, feedback states, and display toggles passed`);
}
console.log('English candidate static and mock-DOM checks passed; browser visual QA not included');
