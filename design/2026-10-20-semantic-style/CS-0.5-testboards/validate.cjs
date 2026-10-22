// Static and mock-DOM checks. This does not render a browser or prove visual quality.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = __dirname;
const pages = ['index.html', 'bloom.html', 'orbit.html', 'garden.html', 'berry.html'];
const js = fs.readFileSync(path.join(root, 'assets/board.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/board.css'), 'utf8');
const design = JSON.parse(fs.readFileSync(path.join(root, 'design.json'), 'utf8'));
const requiredStates = ['normal', 'saving', 'saved', 'local', 'failed', 'unknown', 'analyzing', 'indeterminate'];
const tasks = ['feed', 'crying', 'diaper', 'sleep'];
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
assert.ok(design.source.requirements.includes('STYLE-TASK-COLOR-CONTINUITY'));
const semanticCSS = css.slice(css.indexOf('/* CS-0.5'));
assert.ok(semanticCSS.startsWith('/* CS-0.5'), 'missing semantic task-color rules');
const luminance = hex => {
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};
for (const [variant, colors] of Object.entries(design.system.task_color_tokens)) {
  const selector = variant === 'bloom' ? ':root{' : `body[data-variant=${variant}]{`;
  assert.ok(semanticCSS.includes(selector), `${variant}: missing task token block`);
  const block = semanticCSS.split(selector)[1].split('}')[0];
  for (const task of tasks) {
    const [background, ink] = colors[task];
    assert.ok(block.includes(`--task-${task}-bg:${background}`), `${variant}/${task}: background token mismatch`);
    assert.ok(block.includes(`--task-${task}-ink:${ink}`), `${variant}/${task}: ink token mismatch`);
    const ratio = (luminance(background) + 0.05) / (luminance(ink) + 0.05);
    assert.ok(ratio >= 4.5, `${variant}/${task}: task icon contrast ${ratio.toFixed(2)} is too low for this candidate`);
    assert.ok(semanticCSS.includes(`[data-task=${task}]{--task-bg:var(--task-${task}-bg);--task-ink:var(--task-${task}-ink)}`));
  }
}
for (const rule of [
  '.quick[data-task]{background:var(--task-bg)}',
  '.event[data-task] .event-icon,.timeline-item[data-task] .event-icon,.icon-sample[data-task] span{background:var(--task-bg);color:var(--task-ink)}',
  '.journal-summary[data-task=feed]{background:linear-gradient(135deg,var(--task-bg),var(--phone) 92%)'
]) assert.ok(semanticCSS.includes(rule), `missing shared semantic rule: ${rule}`);

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
  assert.match(markup, /class="today-hero" data-task="feed"/);
  for (const task of tasks) assert.match(markup, new RegExp(`class="icon-sample" data-task="${task}"`));
  for (const task of ['feed', 'crying', 'diaper']) assert.match(markup, new RegExp(`class="quick" data-task="${task}"`));
  for (const task of ['feed', 'diaper']) assert.match(markup, new RegExp(`class="event" data-task="${task}"`));

  for (const screen of ['home', 'records', 'assistant']) {
    const button = buttons.find(node => node.dataset.page === screen);
    assert.ok(button, `${variant}: missing ${screen} button`);
    button.fire('click');
    assert.equal(focused, `[data-page="${screen}"]`);
    assert.match(markup, screen === 'home' ? /LATEST BABY FEED/ : screen === 'records' ? /TODAY’S FEEDS/ : /A THOUGHT TO CONSIDER/);
    if (screen === 'records') {
      assert.match(markup, /class="journal-summary" data-task="feed"/);
      for (const task of ['feed', 'diaper', 'sleep']) assert.match(markup, new RegExp(`class="timeline-item" data-task="${task}"`));
    }
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
