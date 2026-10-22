const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const html = path.join(root, 'Momcozy-final.html');
const url = pathToFileURL(html).href + '#/home';
const shots = path.join(__dirname, 'screenshots');
fs.mkdirSync(shots, { recursive: true });
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const evidence = { file: path.relative(root, html), sha256: sha(html), capturedAt: new Date().toISOString(), snapshots: [], errors: [] };
evidence.sourceSha256 = sha(path.resolve(root, '../current/assets/app.js'));
evidence.browser = '';
const seed = {
  records: [],
  profiles: {
    baby: 'Avery', birth: '', careRole: '妈妈', momStage: '产后',
    momAge: '30', parity: '1', babyCount: 1,
    babies: [{ birth: '', weeks: '40' }], birthWeeks: '40', focus: ''
  },
  prefs: { theme: 'light', sound: false, reduced: false }
};

async function inspect(page, label, screenshot = true) {
  await page.waitForTimeout(120);
  const result = await page.evaluate(() => {
    const visible = el => {
      if (!el || el.closest('script,style,[hidden],.bubble.user,[data-user-content]')) return false;
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0;
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const chinese = [];
    while (walker.nextNode()) {
      const node = walker.currentNode, s = node.nodeValue.trim();
      if (/[\u3400-\u9fff]/u.test(s) && visible(node.parentElement)) chinese.push({
        text: s.slice(0, 160), parent: node.parentElement.tagName.toLowerCase(),
        className: node.parentElement.className?.baseVal || node.parentElement.className || ''
      });
    }
    const attrs = [];
    for (const el of document.querySelectorAll('[aria-label],[placeholder],[title],[alt]')) {
      if (!visible(el)) continue;
      for (const a of ['aria-label','placeholder','title','alt']) {
        const v = el.getAttribute(a);
        if (v && /[\u3400-\u9fff]/u.test(v)) attrs.push({ attr: a, value: v, tag: el.tagName.toLowerCase() });
      }
    }
    const width = document.querySelector('.app').getBoundingClientRect().width;
    const overflows = [...document.querySelectorAll('button,p,h2,h3,small,span,input,textarea')].filter(el=>!el.matches('.sr-only')&&!el.closest('.sr-only')).filter(visible)
      .filter(el => el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX !== 'hidden')
      .slice(0, 20).map(el => ({ tag: el.tagName.toLowerCase(), className: el.className?.baseVal || el.className || '', text: el.textContent?.trim().slice(0, 70), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    return { route: location.hash, title: document.querySelector('#sheet-title')?.textContent || '', chinese, attrs, appWidth: width, overflows };
  });
  const name = String(evidence.snapshots.length + 1).padStart(2, '0') + '-' + label.replace(/[^a-z0-9-]/g, '-') + '.png';
  if (screenshot) await page.screenshot({ path: path.join(shots, name) });
  evidence.snapshots.push({ label, url: page.url(), viewport: page.viewportSize(), screenshot: screenshot ? path.relative(root, path.join(shots, name)).replaceAll('\\', '/') : null, screenshotSha256: screenshot ? sha(path.join(shots, name)) : null, capturedAt: new Date().toISOString(), ...result });
  console.log(label, 'route=' + result.route, 'chinese=' + result.chinese.length, 'attrs=' + result.attrs.length, 'overflows=' + result.overflows.length);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  evidence.browser = browser.version();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US', timezoneId: 'America/New_York', deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('pageerror', e => evidence.errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') evidence.errors.push('console: ' + m.text()); });
    await page.goto(url, { waitUntil: 'load' });
    await inspect(page, 'onboarding-role');
    await page.locator('[data-onboarding-choice="role"][data-choice-index="0"]').click();
    await page.locator('#onboarding-next').click();
    await inspect(page, 'onboarding-details');
    assert.equal(await page.locator('#onboard-parity [data-wheel-value="1"]').innerText(), '1 birth');
    assert.equal(await page.locator('#onboard-babyCount [data-wheel-value="1"]').innerText(), '1 baby');
    await page.locator('#onboard-parity').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.locator('#onboard-parity').getAttribute('aria-valuetext'), '1 birth');
    await page.locator('#onboarding-next').click();
    await inspect(page, 'onboarding-concerns');
    await page.locator('#onboarding-next').click();
    await inspect(page, 'onboarding-tools');
    await page.locator('#onboarding-next').click();
    await page.waitForFunction(() => document.querySelector('#toast')?.hidden);
    await inspect(page, 'home-first-visit');
    await page.locator('#assistant .main-menu-button').click();
  await page.locator('#care-sidebar [data-sidebar="record"]').click();
    await inspect(page, 'journal-empty');
    await page.locator('#records .profile-menu-button').click();
    await inspect(page, 'my-menu');
    await page.locator('#sheet [data-action="mom-profile"]').click();
    await inspect(page, 'mom-profile');
    await page.locator('#sheet-close').click();
    await page.locator('#record-cta [data-action="record"]').click();
    await inspect(page, 'record-picker');
    await page.locator('#sheet [data-type="亲喂"]').click();
    await inspect(page, 'breastfeeding-form');
    await page.locator('#sheet-close').click();
    await page.locator('#records .back-home').click();
    await page.locator('#care-shortcuts [data-care="cry"]').click();
    await inspect(page, 'cry-care-card');
    assert.equal(await page.locator('#conversation .task-author').last().innerText(), 'Momcozy AI');
    await page.locator('#chat-message').fill('I want to log a bottle feeding.');
    await page.locator('#chat-form').evaluate(form => form.requestSubmit());
    await page.waitForTimeout(850);
    await inspect(page, 'conversation');
    await page.locator('.preview-strip [data-action="settings"]').click();
    await inspect(page, 'settings');
    await page.locator('#sheet-close').click();
    await page.locator('#assistant .main-menu-button').click();
  await page.locator('#care-sidebar [data-sidebar="record"]').click();
    await page.locator('#records .profile-menu-button').click();
    await page.locator('#sheet [data-action="menu-mine"]').click();
    await inspect(page, 'my-care-space');
    await context.close();

    const seeded = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US', timezoneId: 'America/New_York', deviceScaleFactor: 1 });
    await seeded.addInitScript(data => localStorage.setItem('momcozy-home-1.0-en-US', JSON.stringify(data)), seed);
    const dark = await seeded.newPage();
    dark.on('pageerror', e => evidence.errors.push('pageerror: ' + e.message));
    await dark.goto(url, { waitUntil: 'load' });
    await dark.locator('.preview-strip [data-action="settings"]').click();
    await dark.locator('#sheet [data-theme="dark"]').click();
    await dark.locator('#sheet-close').click();
    await inspect(dark, 'home-dark');
    evidence.browser = browser.version();
    if (evidence.snapshots.some(s => s.chinese.length || s.attrs.length || s.overflows.length)) evidence.errors.push('Untranslated or overflowing UI found');
    await seeded.close();
  } catch (e) {
    evidence.errors.push('QA script: ' + e.stack);
  } finally {
    fs.writeFileSync(path.join(__dirname, 'browser-evidence.json'), JSON.stringify(evidence, null, 2));
    await browser.close();
    console.log('errors=', evidence.errors.length);
    if (evidence.errors.length) process.exitCode = 1;
  }
})();
