// Static and mock-DOM checks. This does not render a browser or prove visual quality.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = __dirname;
const pages = ['index.html', 'bloom.html', 'orbit.html', 'garden.html', 'berry.html'];
const js = fs.readFileSync(path.join(root, 'assets/board.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/board.css'), 'utf8');
const requiredStates = ['normal', 'saving', 'saved', 'local', 'failed', 'unknown', 'analyzing', 'indeterminate'];
const overview = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.equal([...overview.matchAll(/<a class="board /g)].length, 4, 'overview must expose four boards');
assert.match(overview, /class="board berry" href="berry\.html"/);

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert.match(html, /<!doctype html>/i);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = match[1];
    if (/^(?:https?:|#)/.test(ref)) continue;
    assert.ok(fs.existsSync(path.resolve(root, ref)), `${page} missing ${ref}`);
  }
  if (page !== 'index.html') {
    assert.match(html, /assets\/board\.css/);
    assert.match(html, /assets\/board\.js/);
  }
}
assert.ok(!/@import\b|url\(\s*['"]?https?:/i.test(css), 'unexpected remote CSS dependency');
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|https?:\/\//.test(js), 'unexpected runtime network dependency');

function createNode(dataset = {}) {
  return {
    dataset,
    listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; },
    fire(type, value) { this.listeners[type]({ target: { value, checked: value } }); }
  };
}

for (const variant of ['bloom', 'orbit', 'garden', 'berry']) {
  let markup = '';
  let focused = '';
  let buttons = [];
  let picker, opaque, quiet;
  const board = {
    set innerHTML(value) {
      markup = value;
      buttons = [...value.matchAll(/<button\b[^>]*(?:data-page|data-screen)="([^"]+)"[^>]*>/g)]
        .map(match => createNode({ [match[0].includes('data-page') ? 'page' : 'screen']: match[1] }));
      picker = createNode(); opaque = createNode(); quiet = createNode();
    }
  };
  const document = {
    body: { dataset: { variant }, classList: { toggle() {} } },
    getElementById(id) { return { board, result: picker, opaque, quiet }[id]; },
    querySelectorAll() { return buttons; },
    querySelector(selector) { return { focus() { focused = selector; } }; }
  };
  vm.runInNewContext(js, { document }, { filename: 'board.js' });
  assert.match(markup, new RegExp(`STYLE BOARD ${variant === 'bloom' ? '01' : variant === 'orbit' ? '02' : variant === 'garden' ? '03' : '04'}`));
  assert.equal(buttons.length, 6, `${variant}: three outer and three phone navigation controls`);
  assert.match(markup, /LATEST BABY FEED/);

  for (const screen of ['home', 'records', 'assistant']) {
    const button = buttons.find(node => node.dataset.page === screen);
    assert.ok(button, `${variant}: missing ${screen} button`);
    button.fire('click');
    assert.equal(focused, `[data-page="${screen}"]`);
    assert.match(markup, screen === 'home' ? /LATEST BABY FEED/ : screen === 'records' ? /TODAY’S RECORDS/ : /A THOUGHT TO CONSIDER/);
    const choices = screen === 'assistant' ? ['normal', 'analyzing', 'indeterminate'] : requiredStates.slice(0, 6);
    for (const state of choices) {
      picker.fire('change', state);
      assert.equal(focused, '#result');
      assert.match(markup, new RegExp(`<option value="${state}" selected>`));
      if (state !== 'normal') assert.match(markup, /Suggested next step/);
    }
  }
  opaque.fire('change', true);
  assert.equal(focused, '#opaque');
  assert.match(markup, /id="opaque" checked/);
  quiet.fire('change', true);
  assert.equal(focused, '#quiet');
  assert.match(markup, /id="quiet" checked/);
  console.log(`${variant}: screens, states, toggles, focus passed`);
}
console.log('local resources and mock-DOM checks passed; browser rendering not tested');
