const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '../..');
const sources = [path.join(root, 'Momcozy-final.html'), path.join(root, 'index.html')];
const screenshotDir = path.join(__dirname, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const evidence = {
  revision: 'profile-sections-27',
  source_sha256: sha(fs.readFileSync(path.join(root, 'sources/profile-sections-27-requirements.json'))),
  material_sha256: sha(fs.readFileSync(sources[0])),
  browser: {}, checks: [], screenshots: [], errors: [],
};
const check = (name, observed) => evidence.checks.push({ name, observed });
async function open(browser, file, viewport, theme = 'light', route = 'home') {
  const context = await browser.newContext({
    viewport, deviceScaleFactor: 2, timezoneId: 'Asia/Shanghai', hasTouch: true,
  });
  await context.addInitScript(value => {
    if (!localStorage.getItem('momcozy-home-1.0'))
      localStorage.setItem('momcozy-home-1.0', JSON.stringify(value));
  }, {
    records: [],
    profiles: { baby: '宝宝', careRole: '妈妈', momStage: '产后', concerns: [],
      babies: [{ birth: '', weeks: '40' }] },
    prefs: { theme, sound: false },
  });
  const page = await context.newPage();
  page.on('pageerror', error => evidence.errors.push('pageerror: ' + error.message));
  page.on('console', message => { if (message.type() === 'error') evidence.errors.push('console: ' + message.text()); });
  await page.goto(pathToFileURL(file).href + '#/' + route, { waitUntil: 'load' });
  await page.locator('#app[data-page]').waitFor({ state: 'attached' });
  return { context, page };
}
async function shot(page, name, note) {
  await page.waitForTimeout(260);
  const target = path.join(screenshotDir, name + '.png');
  await page.screenshot({ path: target });
  const bytes = fs.readFileSync(target);
  evidence.screenshots.push({
    name, note, path: path.relative(root, target).replaceAll('\\', '/'),
    sha256: sha(bytes), url: page.url(), viewport: page.viewportSize(),
    image_pixels: { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) },
    fullPage: false, captured_at: new Date().toISOString(),
  });
}
async function sidebar(page) {
  await page.locator('.main-menu-button').click();
  await page.locator('#care-sidebar').waitFor({ state: 'visible' });
  const items = await page.locator('#care-sidebar [data-sidebar]').evaluateAll(rows => rows.map(row => ({
    id: row.dataset.sidebar, text: row.innerText.trim(),
  })));
  assert.deepEqual(items, [{ id: 'mine', text: '我的' }, { id: 'baby', text: '宝宝' }]);
  assert.equal(await page.locator('#care-sidebar [data-sidebar="record"]').count(), 0);
  return items;
}
async function compactGeometry(page) {
  const geometry = await page.evaluate(() => {
    const bar = document.querySelector('.compact-advice');
    const title = document.querySelector('#compact-advice');
    const chip = bar.querySelector('.today-chip');
    const arrow = bar.querySelector('.icon');
    const rect = node => {
      const r = node.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    return { bar: rect(bar), title: rect(title), chip: rect(chip), arrow: rect(arrow),
      text: title.textContent, expanded: document.querySelector('#conversation-home-head').dataset.expanded,
      overflow: document.querySelector('.app').scrollWidth - document.querySelector('.app').clientWidth };
  });
  const center = r => (r.left + r.right) / 2;
  assert.ok(Math.abs(center(geometry.title) - center(geometry.bar)) <= 2, JSON.stringify(geometry));
  assert.ok(geometry.title.left >= geometry.chip.right - 1, JSON.stringify(geometry));
  assert.ok(geometry.title.right <= geometry.arrow.left + 1, JSON.stringify(geometry));
  assert.equal(geometry.expanded, 'false');
  assert.equal(geometry.overflow, 0);
  return geometry;
}
async function makeChat(page) {
  await page.locator('.care-shortcuts [data-care="cry"]').click();
  assert.equal(await page.locator('#conversation-home-head').isVisible(), true);
  assert.equal(await page.locator('#expanded-advice').isVisible(), false);
}

async function main() {
  const browser = await chromium.launch({ headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  evidence.browser = { name: 'Google Chrome', version: browser.version(), mode: 'headless',
    protocol: 'file://', deviceScaleFactor: 2 };
  try {
    {
      const { context, page } = await open(browser, sources[0], { width: 390, height: 844 });
      check('sidebar labels', await sidebar(page));
      await shot(page, '01-sidebar-light-390', '明亮侧栏仅有我的和宝宝');
      await page.locator('.sidebar-scrim').click({ position: { x: 350, y: 430 }, force: true });
      await page.waitForTimeout(400);
      assert.equal(await page.locator('#sidebar-layer').isHidden(), true);
      assert.equal(await page.locator('.main-menu-button').evaluate(el => el === document.activeElement), true);
      check('sidebar scrim closes and restores focus', { hidden: true, focus: 'main-menu-button' });
      await sidebar(page);
      await page.locator('[data-sidebar="mine"]').click();
      assert.equal(new URL(page.url()).hash, '#/mine');
      assert.equal(await page.locator('#mine h2').innerText(), '我的');
      await shot(page, '02-mine-light-390', '我的独立页面及记录入口');
      await page.locator('#mine [data-record-owner="妈妈"]').click();
      assert.equal(new URL(page.url()).hash, '#/records');
      assert.equal(await page.locator('[data-owner="妈妈"]').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#record-cta').isVisible(), true);
      await shot(page, '03-mom-records-390', '从我的进入妈妈记录，保留新建');
      await page.locator('#records [data-action="records-back"]').click();
      assert.equal(new URL(page.url()).hash, '#/mine');
      await page.locator('#mine [data-action="mine-back"]').click();
      assert.equal(new URL(page.url()).hash, '#/home');
      check('mine to mom records and return', { hash: new URL(page.url()).hash });
      await context.close();
    }
    {
      const { context, page } = await open(browser, sources[0], { width: 390, height: 844 });
      await sidebar(page);
      await page.locator('[data-sidebar="baby"]').click();
      assert.equal(new URL(page.url()).hash, '#/baby');
      assert.equal(await page.locator('#baby h2').innerText(), '宝宝');
      assert.equal(await page.locator('#sheet').isVisible(), false);
      await shot(page, '04-baby-light-390', '宝宝与我的同层级页面');
      await page.locator('#baby [data-action="baby-profile"]').click();
      assert.equal(await page.locator('#profile-form').isVisible(), true);
      await page.locator('#profile-form [name="birthWeeks"]').fill('36');
      await page.locator('#profile-form button[type="submit"]').click();
      assert.match(await page.locator('#profile-error').innerText(), /37/);
      assert.equal(await page.locator('#sheet').isVisible(), true);
      await page.locator('#profile-form [name="birthWeeks"]').fill('40');
      await page.locator('#profile-form [name="baby"]').fill('小月');
      await page.locator('#profile-form button[type="submit"]').click();
      assert.equal(await page.locator('#sheet').isVisible(), false);
      assert.equal(await page.locator('#baby-profile-name').innerText(), '小月');
      await page.reload();
      assert.equal(new URL(page.url()).hash, '#/baby');
      assert.equal(await page.locator('#baby-profile-name').innerText(), '小月');
      check('baby edit validation save and refresh', { name: '小月', hash: new URL(page.url()).hash });
      await page.locator('#baby [data-record-owner="宝宝"]').click();
      assert.equal(new URL(page.url()).hash, '#/records');
      assert.equal(await page.locator('[data-owner="宝宝"]').getAttribute('aria-pressed'), 'true');
      await page.locator('#record-cta button').click();
      assert.equal(await page.locator('#sheet').isVisible(), true);
      await page.locator('#sheet-close').click();
      await shot(page, '05-baby-records-390', '宝宝当日记录保留新建');
      await page.locator('#records [data-action="profile-menu"]').click();
      assert.equal(await page.locator('#sheet-title').innerText(), '我的');
      await page.locator('#sheet [data-action="menu-baby"]').click();
      assert.equal(new URL(page.url()).hash, '#/baby');
      await page.locator('#baby [data-action="baby-back"]').click();
      assert.equal(new URL(page.url()).hash, '#/records');
      assert.equal(await page.locator('[data-owner="宝宝"]').getAttribute('aria-pressed'), 'true');
      await page.locator('#records [data-action="records-back"]').click();
      assert.equal(new URL(page.url()).hash, '#/baby');
      await page.locator('#baby [data-action="baby-back"]').click();
      assert.equal(new URL(page.url()).hash, '#/home');
      check('baby records create and return', { hash: new URL(page.url()).hash });
      await context.close();
    }
    {
      const { context, page } = await open(browser, sources[0], { width: 390, height: 844 });
      await page.locator('.care-shortcuts [data-care="record"]').click();
      await page.locator('#care-shortcuts').waitFor();
      const first = await compactGeometry(page);
      await shot(page, '06-compact-light-390', 'Today 缩略条标题在整体中间');
      await page.locator('.compact-advice').click();
      assert.equal(await page.locator('#expanded-advice').isVisible(), true);
      await page.locator('#expanded-advice [data-advice-index="2"]').click();
      await page.locator('.compact-advice').click();
      const third = await compactGeometry(page);
      assert.notEqual(third.text, first.text);
      await page.locator('.compact-advice').click();
      assert.equal(await page.locator('#expanded-advice .advice-dot[aria-current="true"]').getAttribute('data-advice-index'), '2');
      check('compact centered for changing title and restore', { first, third });
      await context.close();
    }
    {
      const { context, page } = await open(browser, sources[0], { width: 360, height: 640 }, 'dark');
      await sidebar(page);
      await shot(page, '07-sidebar-dark-360', '夜间短屏双入口侧栏');
      await page.locator('.sidebar-close').click();
      await page.waitForTimeout(400);
      await makeChat(page);
      check('dark short compact center', await compactGeometry(page));
      await shot(page, '08-compact-dark-360', '夜间短屏 Today 折叠标题居中');
      await page.locator('.compact-advice').click();
      assert.equal(await page.locator('#expanded-advice').isVisible(), true);
      await page.locator('.main-menu-button').click();
      await page.locator('[data-sidebar="baby"]').click();
      await shot(page, '09-baby-dark-360', '夜间短屏宝宝页');
      assert.equal(await page.locator('#scroll').evaluate(el => el.scrollWidth <= el.clientWidth), true);
      await context.close();
    }
    {
      const { context, page } = await open(browser, sources[0], { width: 1280, height: 720 });
      await sidebar(page);
      await shot(page, '10-sidebar-desktop', '桌面视口侧栏');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      assert.equal(await page.locator('#sidebar-layer').isHidden(), true);
      assert.equal(await page.locator('.main-menu-button').evaluate(el => el === document.activeElement), true);
      await page.locator('.care-shortcuts [data-care="cry"]').click();
      check('desktop compact center', await compactGeometry(page));
      await shot(page, '11-compact-desktop', '桌面 Today 缩略条居中');
      await context.close();
    }
    {
      const { context, page } = await open(browser, sources[1], { width: 390, height: 844 }, 'light', 'baby');
      assert.equal(new URL(page.url()).hash, '#/baby');
      assert.equal(await page.locator('#baby').isVisible(), true);
      await page.locator('#baby [data-action="baby-back"]').click();
      assert.equal(new URL(page.url()).hash, '#/home');
      await sidebar(page);
      check('modular file route and sidebar', { hash: new URL(page.url()).hash });
      await context.close();
    }
    assert.deepEqual(evidence.errors, []);
    evidence.passed = true;
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(__dirname, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  }
  console.log(JSON.stringify({ passed: evidence.passed, checks: evidence.checks.length,
    screenshots: evidence.screenshots.length, errors: evidence.errors }, null, 2));
}
main().catch(error => { evidence.errors.push('test: ' + error.stack); evidence.passed = false;
  fs.writeFileSync(path.join(__dirname, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  console.error(error); process.exitCode = 1; });
