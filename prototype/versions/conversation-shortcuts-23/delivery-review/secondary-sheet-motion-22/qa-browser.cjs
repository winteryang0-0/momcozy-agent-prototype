const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '../..');
const html = path.join(root, 'Momcozy-final.html');
const modular = path.join(root, 'index.html');
const oldHtml = path.resolve(root, '../versions/profile-field-ranges-21/Momcozy-final.html');
const url = pathToFileURL(html).href + '#/home';
const shots = path.join(__dirname, 'screenshots');
fs.mkdirSync(shots, { recursive: true });
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const screenshots = [];
const checks = [];
const errors = [];
const seed = {
  records: [],
  profiles: {
    baby: '小满', birth: '', careRole: '妈妈', momStage: '产后',
    momAge: '30', parity: '1', babyCount: 1,
    babies: [{ birth: '', weeks: '40' }], birthWeeks: '40', focus: ''
  },
  prefs: { theme: 'light', sound: false, reduced: false }
};

async function capture(page, name, note) {
  const file = path.join(shots, name + '.png');
  await page.screenshot({ path: file });
  const bytes = fs.readFileSync(file);
  screenshots.push({
    name, note,
    path: path.relative(root, file).replaceAll('\\', '/'),
    sha256: sha(file),
    material_sha256: sha(html),
    url: page.url(),
    viewport: page.viewportSize(),
    image_pixels: { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) },
    captured_at: new Date().toISOString(),
    fullPage: false
  });
}

async function open(browser, target = url, viewport = { width: 390, height: 844 }, overrides = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, timezoneId: 'Asia/Shanghai' });
  const initial = structuredClone(seed);
  Object.assign(initial.prefs, overrides);
  await context.addInitScript(data => {
    if (sessionStorage.getItem('__r22_seeded')) return;
    localStorage.setItem('momcozy-home-1.0', JSON.stringify(data));
    sessionStorage.setItem('__r22_seeded', '1');
  }, initial);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + message.text()); });
  await page.goto(target, { waitUntil: 'load' });
  assert.equal(new URL(page.url()).hash, '#/home');
  return { context, page };
}

async function traceClick(page, selector) {
  return page.evaluate(async target => {
    const button = document.querySelector(target);
    if (!button) throw new Error('Missing trigger: ' + target);
    button.click();
    const sheet = document.querySelector('#sheet');
    const panel = sheet.querySelector('.sheet-panel');
    const frames = [];
    await new Promise(resolve => {
      let start;
      const frame = now => {
        if (start === undefined) start = now;
        const rect = panel.getBoundingClientRect();
        frames.push({
          ms: Math.round(now - start),
          top: Math.round(rect.top * 10) / 10,
          bottom: Math.round(rect.bottom * 10) / 10,
          opacity: Number(getComputedStyle(panel).opacity),
          animation: getComputedStyle(panel).animationName,
          shade: Number(getComputedStyle(sheet, '::before').opacity),
          motion: sheet.dataset.motion || '',
          backdrop_motion: sheet.dataset.backdropMotion || ''
        });
        if (now - start < 465) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
    return { title: sheet.querySelector('#sheet-title').textContent, kind: sheet.dataset.kind, open: sheet.open, frames };
  }, selector);
}

function checkRise(trace, label, expectShadeFade) {
  assert.equal(trace.open, true, label + ': sheet did not open');
  const frames = trace.frames;
  assert.ok(frames.length >= 12, label + ': insufficient frames');
  assert.equal(frames[0].animation, 'sheet-rise', label + ': no upward entrance animation');
  assert.ok(frames[0].top > frames.at(-1).top + 55, label + ': panel did not travel upward');
  assert.ok(frames.every(frame => frame.opacity > .99), label + ': panel opacity flash');
  for (let i = 1; i < frames.length; i++) {
    assert.ok(frames[i].top <= frames[i - 1].top + 1.5, label + ': non-monotonic vertical motion');
  }
  if (expectShadeFade) {
    assert.ok(frames[0].shade < .95 && frames.at(-1).shade > .99, label + ': shade did not fade in');
  } else {
    assert.ok(frames.every(frame => frame.shade > .95), label + ': existing shade flashed');
  }
  assert.equal(frames.at(-1).motion, 'steady', label + ': motion state did not settle');
}

async function clickRise(page, selector, title) {
  await page.locator(selector).click();
  assert.equal(await page.locator('#sheet-title').textContent(), title);
  assert.equal(await page.locator('#sheet').getAttribute('data-motion'), 'enter');
  assert.equal(await page.locator('.sheet-panel').evaluate(node => getComputedStyle(node).animationName), 'sheet-rise');
  await page.waitForTimeout(430);
  assert.equal(await page.locator('#sheet').getAttribute('data-motion'), 'steady');
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const old = await open(browser, pathToFileURL(oldHtml).href + '#/home');
    await old.page.locator('#assistant .main-menu-button').click();
    const oldOpen = await traceClick(old.page, '#records .profile-menu-button');
    const oldSubmenu = await traceClick(old.page, '#sheet [data-action="mom-profile"]');
    await old.context.close();

    const main = await open(browser);
    const page = main.page;
    await page.locator('#assistant .main-menu-button').click();
    const menuTrace = await traceClick(page, '#records .profile-menu-button');
    assert.equal(menuTrace.title, '我的');
    checkRise(menuTrace, 'profile menu', true);
    await capture(page, '01-my-menu-390', 'My title and settled bottom sheet');
    const profileTrace = await traceClick(page, '#sheet [data-action="mom-profile"]');
    assert.equal(profileTrace.title, '妈妈资料');
    checkRise(profileTrace, 'profile submenu', false);
    await capture(page, '02-mom-profile-390', 'In-place submenu rises while shade stays steady');
    checks.push('My title; first sheet and in-place submenu move upward with opaque panel and stable shade');

    await page.locator('#sheet-close').click();
    assert.equal(await page.locator('#sheet').evaluate(node => node.open), false);
    await clickRise(page, '#record-cta [data-action="record"]', '记下刚刚的照护');
    await capture(page, '03-record-picker-390', 'Record picker uses the shared bottom entrance');
    await clickRise(page, '#sheet [data-type="亲喂"]', '亲喂');
    await capture(page, '04-record-form-390', 'Record form opens upward from picker');
    await page.locator('#sheet-close').click();
    checks.push('record picker and nested record form share the same entrance; close still works');

    await page.locator('#records .back-home').click();
    await clickRise(page, '#chat-form [data-action="chat-more"]', '添加素材');
    await capture(page, '05-chat-more-390', 'Chat attachment menu rises from bottom');
    await clickRise(page, '#sheet [data-action="camera"]', '添加照片');
    await capture(page, '06-photo-attachment-390', 'Nested photo panel rises from bottom');
    await page.locator('#sheet-close').click();
    await clickRise(page, '.preview-strip [data-action="settings"]', '阅读与预览设置');
    await page.locator('#sheet-close').click();
    checks.push('chat plus, nested photo panel, and preview settings use the shared entrance');
    await main.context.close();

    const dark = await open(browser, url, { width: 360, height: 640 }, { theme: 'dark' });
    await dark.page.locator('#assistant .main-menu-button').click();
    await dark.page.locator('#records .profile-menu-button').click();
    await dark.page.waitForTimeout(100);
    await capture(dark.page, '07-dark-enter-360', 'Dark short screen during upward motion');
    await dark.page.waitForTimeout(340);
    await capture(dark.page, '08-dark-settled-360', 'Dark short screen after upward motion');
    assert.equal(await dark.page.locator('#sheet-title').textContent(), '我的');
    assert.equal(await dark.page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    checks.push('dark 360×640 entrance is directional and has no horizontal overflow');
    await dark.context.close();

    const reduced = await open(browser, url, { width: 390, height: 844 }, { reduced: true });
    await reduced.page.locator('#assistant .main-menu-button').click();
    await reduced.page.locator('#records .profile-menu-button').click();
    assert.equal(await reduced.page.locator('#sheet').getAttribute('data-motion'), 'steady');
    assert.equal(await reduced.page.locator('.sheet-panel').evaluate(node => getComputedStyle(node).animationName), 'none');
    assert.equal(await reduced.page.locator('#sheet').evaluate(node => node.open), true);
    await capture(reduced.page, '09-reduced-motion-390', 'User reduced motion shows the complete sheet immediately');
    checks.push('user reduced motion disables entrance without hiding controls');
    await reduced.context.close();

    const systemReduced = await open(browser);
    await systemReduced.page.emulateMedia({ reducedMotion: 'reduce' });
    await systemReduced.page.locator('#assistant .main-menu-button').click();
    await systemReduced.page.locator('#records .profile-menu-button').click();
    assert.equal(await systemReduced.page.locator('#sheet').getAttribute('data-motion'), 'steady');
    assert.equal(await systemReduced.page.locator('.sheet-panel').evaluate(node => getComputedStyle(node).animationName), 'none');
    checks.push('OS reduced motion disables entrance');
    await systemReduced.context.close();

    const desktop = await open(browser, url, { width: 1280, height: 900 });
    await desktop.page.locator('#assistant .main-menu-button').click();
    await clickRise(desktop.page, '#records .profile-menu-button', '我的');
    const bounds = await desktop.page.evaluate(() => {
      const frame = document.querySelector('.app').getBoundingClientRect();
      const sheet = document.querySelector('#sheet').getBoundingClientRect();
      return { frame: { left: frame.left, right: frame.right, top: frame.top, bottom: frame.bottom },
        sheet: { left: sheet.left, right: sheet.right, top: sheet.top, bottom: sheet.bottom } };
    });
    assert.ok(bounds.sheet.left >= bounds.frame.left && bounds.sheet.right <= bounds.frame.right &&
      bounds.sheet.top >= bounds.frame.top && bounds.sheet.bottom <= bounds.frame.bottom, JSON.stringify(bounds));
    await capture(desktop.page, '10-my-menu-desktop-1280', 'Desktop sheet remains inside app viewport');
    checks.push('desktop bottom sheet stays within the app viewport');
    await desktop.context.close();

    const modularView = await open(browser, pathToFileURL(modular).href + '#/home');
    await modularView.page.locator('#assistant .main-menu-button').click();
    await clickRise(modularView.page, '#records .profile-menu-button', '我的');
    checks.push('modular index.html uses the same file:// sheet motion');
    await modularView.context.close();

    assert.deepEqual(errors, []);
    const evidence = {
      revision: 'secondary-sheet-motion-22',
      material_sha256: sha(html),
      modular_sha256: sha(modular),
      previous_material_sha256: sha(oldHtml),
      browser: 'Chrome ' + browser.version(),
      protocol: 'file://',
      operator: 'Playwright Chrome headless',
      captured_at: new Date().toISOString(),
      checks,
      comparison: { previous_open: oldOpen, previous_submenu: oldSubmenu },
      motion: { profile_menu: menuTrace, profile_submenu: profileTrace },
      screenshots,
      errors
    };
    fs.writeFileSync(path.join(__dirname, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
    console.log(JSON.stringify({ material_sha256: evidence.material_sha256, checks: checks.length,
      screenshots: screenshots.length, errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
