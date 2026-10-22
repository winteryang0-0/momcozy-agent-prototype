const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '../..');
const standalone = path.join(root, 'Momcozy-final.html');
const modular = path.join(root, 'index.html');
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

async function open(browser, file = standalone, viewport = { width: 390, height: 844 }, prefs = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, timezoneId: 'Asia/Shanghai' });
  const initial = structuredClone(seed);
  Object.assign(initial.prefs, prefs);
  await context.addInitScript(data => {
    if (sessionStorage.getItem('__r23_seeded')) return;
    localStorage.setItem('momcozy-home-1.0', JSON.stringify(data));
    sessionStorage.setItem('__r23_seeded', '1');
  }, initial);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push('console: ' + message.text());
  });
  await page.goto(pathToFileURL(file).href + '#/home', { waitUntil: 'load' });
  await page.locator('#care-shortcuts button').first().waitFor();
  assert.equal(new URL(page.url()).hash, '#/home');
  return { context, page };
}

async function capture(page, name, note) {
  const file = path.join(shots, name + '.png');
  await page.screenshot({ path: file });
  const bytes = fs.readFileSync(file);
  const sourceFile = new URL(page.url()).pathname.endsWith('/index.html') ? modular : standalone;
  screenshots.push({
    name, note,
    path: path.relative(root, file).replaceAll('\\', '/'),
    sha256: sha(file),
    source_file: path.relative(root, sourceFile).replaceAll('\\', '/'),
    material_sha256: sha(sourceFile),
    url: page.url(),
    viewport: page.viewportSize(),
    page_scroll_y: await page.evaluate(() => scrollY),
    image_pixels: { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) },
    captured_at: new Date().toISOString(),
    fullPage: false
  });
}

async function measure(page) {
  return page.evaluate(() => {
    const box = selector => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    return {
      strip: box('#care-shortcuts'), composer: box('#chat-form'),
      buttons: [...document.querySelectorAll('#care-shortcuts button')].map(b => ({
        care: b.dataset.care, text: b.textContent.trim(), rect: (() => {
          const r = b.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height };
        })()
      })),
      viewportWidth: innerWidth, pageWidth: document.documentElement.scrollWidth,
      visible: !!document.querySelector('#care-shortcuts').getClientRects().length
    };
  });
}

function assertStrip(m) {
  assert.equal(m.buttons.length, 3);
  assert.deepEqual(m.buttons.map(b => b.care), ['record', 'cry', 'poop']);
  assert.deepEqual(m.buttons.map(b => b.text), ['记一笔', '听哭闹', '看便便']);
  assert.equal(m.visible, true);
  assert.equal(m.strip.height, 29);
  assert.equal(m.composer.height, 58);
  assert.equal(m.strip.bottom < m.composer.top, true);
  assert.equal(m.buttons.every(b => b.rect.top === m.buttons[0].rect.top && b.rect.height === 29), true);
  assert.equal(m.buttons[0].rect.right < m.buttons[1].rect.left, true);
  assert.equal(m.buttons[1].rect.right < m.buttons[2].rect.left, true);
  assert.equal(m.pageWidth <= m.viewportWidth, true);
}

async function latestCard(page) {
  return page.locator('#conversation .task-card[data-task-id]').last();
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const light = await open(browser);
    const page = light.page;
    assertStrip(await measure(page));
    assert.equal(await page.locator('#assistant-intro [data-care], #conversation [data-care]').count(), 0);
    await capture(page, '01-welcome-light-390', 'Welcome screen with one persistent three-button care row');
    checks.push('welcome: one horizontal row above the 58px composer, height 29px');

    for (const message of ['今天有点累', '谢谢你', '我想再聊一会儿']) {
      await page.locator('#chat-message').fill(message);
      await page.locator('#chat-form').evaluate(form => form.requestSubmit());
      await page.waitForFunction(() => !document.querySelector('#chat-status').textContent.trim(), null, { timeout: 3000 });
    }
    assert.equal(await page.locator('#conversation .bubble.user').count(), 3);
    assert.equal(await page.locator('#conversation [data-care]').count(), 0);
    assertStrip(await measure(page));
    await page.locator('#chat-message').evaluate(field => field.blur());
    await capture(page, '02-conversation-light-390', 'Repeated replies have no care shortcuts and the persistent row remains visible');
    checks.push('three replies: no repeated care entry in the conversation and persistent row remains visible');

    await page.locator('#care-shortcuts [data-care=record]').focus();
    assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'solid');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.care), 'cry');
    checks.push('keyboard: visible focus and left-to-right tab order');

    await page.locator('#care-shortcuts [data-care=record]').click();
    assert.equal(await (await latestCard(page)).getAttribute('data-state-id'), 'STATE-chat-record-picker');
    assertStrip(await measure(page));
    await capture(page, '03-record-picker-light-390', 'Persistent row with the original record type picker');
    await page.locator('#care-shortcuts [data-care=cry]').click();
    assert.equal(await (await latestCard(page)).getAttribute('data-state-id'), 'STATE-chat-record-picker');
    assert.match(await page.locator('#toast').textContent(), /先完成或取消当前任务/);
    checks.push('active record task blocks another task without losing the record picker');

    await page.locator('[data-inline-type="亲喂"]').click();
    await page.locator('#inline-record-form [name=duration]').fill('12');
    await page.locator('#inline-record-form button[type=submit]').click();
    await page.locator('[data-state-id="STATE-chat-record-success"]').waitFor({ timeout: 4000 });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('momcozy-home-1.0')).records);
    assert.equal(saved.length, 1);
    assert.equal(await page.locator('#conversation [data-care]').count(), 0);
    assertStrip(await measure(page));
    await page.locator('#toast').waitFor({ state: 'hidden', timeout: 5000 });
    await capture(page, '04-record-saved-light-390', 'Saved record receipt keeps the character and has no repeated function row');
    checks.push('record: type selection, form, save and local receipt still work');

    await page.locator('#care-shortcuts [data-care=cry]').click();
    assert.equal(await (await latestCard(page)).getAttribute('data-category'), 'crying');
    await page.locator('#care-shortcuts [data-care=poop]').click();
    assert.equal(await (await latestCard(page)).getAttribute('data-category'), 'crying');
    assert.equal(await (await latestCard(page)).getAttribute('data-state-id'), 'STATE-task-ready');
    checks.push('active cry task blocks photo without replacing the current card');
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia: async () => { throw new DOMException('Denied', 'NotAllowedError'); } }
      });
    });
    await (await latestCard(page)).locator('[data-step=capture]').click();
    await page.locator('[data-state-id="STATE-task-capture-error"]').waitFor();
    assert.match(await (await latestCard(page)).textContent(), /麦克风/);
    await page.locator('#care-shortcuts [data-care=poop]').click();
    assert.equal(await (await latestCard(page)).getAttribute('data-category'), 'crying');
    assert.equal(await (await latestCard(page)).getAttribute('data-state-id'), 'STATE-task-capture-error');
    assertStrip(await measure(page));
    await page.locator('#toast').waitFor({ state: 'hidden', timeout: 5000 });
    await page.evaluate(() => scrollTo(0, 0));
    await capture(page, '05-cry-permission-error-light-390', 'Cry card retains device error recovery while shortcuts stay above composer');
    await (await latestCard(page)).locator('[data-step=cancel]').click();
    checks.push('cry: existing capture and device-error recovery remain reachable; an error state blocks another task until cancelled');

    await page.locator('#care-shortcuts [data-care=poop]').click();
    assert.equal(await (await latestCard(page)).getAttribute('data-category'), 'diaper');
    await (await latestCard(page)).locator('[data-step=capture]').click();
    await page.locator('[data-state-id="STATE-task-capture-error"]').waitFor();
    assert.match(await (await latestCard(page)).textContent(), /相机/);
    assert.equal(await page.locator('#conversation [data-care]').count(), 0);
    assertStrip(await measure(page));
    await page.evaluate(() => scrollTo(0, 0));
    await capture(page, '06-poop-permission-error-light-390', 'Photo card retains retry and file choice while shortcuts stay above composer');
    checks.push('photo: existing camera error, retry and file choice remain reachable');

    await page.reload({ waitUntil: 'load' });
    assertStrip(await measure(page));
    assert.equal(await page.locator('#conversation [data-care]').count(), 0);
    checks.push('refresh: persistent row survives and old replies do not regain repeated entries');
    await light.context.close();

    const dark = await open(browser, standalone, { width: 360, height: 640 }, { theme: 'dark' });
    assertStrip(await measure(dark.page));
    await dark.page.locator('#care-shortcuts [data-care=record]').click();
    assert.equal(await (await latestCard(dark.page)).getAttribute('data-state-id'), 'STATE-chat-record-picker');
    assertStrip(await measure(dark.page));
    await dark.page.evaluate(() => scrollTo(0, 0));
    await capture(dark.page, '07-dark-short-360', 'Dark 360x640 task view with all three persistent controls');
    checks.push('dark 360x640: row stays visible, horizontal and free of page overflow');
    await dark.context.close();

    const reduced = await open(browser, standalone, { width: 390, height: 844 }, { reduced: true });
    await reduced.page.emulateMedia({ reducedMotion: 'reduce' });
    assertStrip(await measure(reduced.page));
    assert.equal(await reduced.page.locator('#care-shortcuts button').first().evaluate(node => getComputedStyle(node).transitionDuration), '0s');
    checks.push('reduced motion: entries remain visible and transitions are disabled');
    await reduced.context.close();

    const moduleView = await open(browser, modular);
    assertStrip(await measure(moduleView.page));
    await moduleView.page.locator('#care-shortcuts [data-care=record]').click();
    assert.equal(await (await latestCard(moduleView.page)).getAttribute('data-state-id'), 'STATE-chat-record-picker');
    await moduleView.page.evaluate(() => scrollTo(0, 0));
    await capture(moduleView.page, '08-modular-record-390', 'Modular file opens the same persistent entry and record picker');
    checks.push('module index.html under file:// has the same shortcut and task behavior');
    await moduleView.context.close();

    assert.deepEqual(errors, []);
    const evidence = {
      revision: 'conversation-shortcuts-23',
      material_sha256: sha(standalone),
      modular_sha256: sha(modular),
      shortcut_css_sha256: sha(path.join(root, 'assets/care-shortcuts-23.css')),
      browser: 'Chrome ' + browser.version(),
      protocol: 'file://',
      operator: 'Playwright Chrome headless',
      captured_at: new Date().toISOString(),
      checks,
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
