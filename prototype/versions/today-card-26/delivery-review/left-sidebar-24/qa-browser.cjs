const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '../..');
const shots = path.join(__dirname, 'screenshots');
fs.mkdirSync(shots, { recursive: true });
const standalone = path.join(root, 'Momcozy-final.html');
const modular = path.join(root, 'index.html');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const screenshots = [], checks = [], errors = [];
const baseProfile = {
  baby: '小满', birth: '', careRole: '妈妈', momStage: '产后',
  momAge: '30', parity: '1', babyCount: 1,
  babies: [{ birth: '', weeks: '40' }], birthWeeks: '40',
  concerns: ['宝宝为什么哭', '宝宝便便情况'], focus: '宝宝为什么哭、宝宝便便情况'
};

async function open(browser, file, viewport, { theme = 'light', reduced = false, concerns = baseProfile.concerns } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, timezoneId: 'Asia/Shanghai' });
  const seed = { records: [], profiles: { ...baseProfile, concerns }, prefs: { theme, reduced, sound: false } };
  await context.addInitScript(data => {
    localStorage.setItem('momcozy-home-1.0', JSON.stringify(data));
  }, seed);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + message.text()); });
  await page.goto(pathToFileURL(file).href + '#/home', { waitUntil: 'load' });
  await page.locator('.main-menu-button').waitFor();
  assert.equal(new URL(page.url()).hash, '#/home');
  return { context, page };
}

async function capture(page, name, note, sourceFile) {
  const file = path.join(shots, name + '.png');
  await page.screenshot({ path: file, animations: 'disabled' });
  const bytes = fs.readFileSync(file);
  screenshots.push({
    name, note,
    path: path.relative(root, file).replaceAll('\\', '/'),
    sha256: hash(file),
    material_sha256: hash(sourceFile),
    url: page.url(), viewport: page.viewportSize(), fullPage: false,
    image_pixels: { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) },
    captured_at: new Date().toISOString()
  });
}

async function openMenu(page) {
  await page.locator('.main-menu-button').click();
  await page.waitForTimeout(420);
  assert.equal(await page.locator('#sidebar-layer').isVisible(), true);
  assert.equal(await page.locator('.main-menu-button').getAttribute('aria-expanded'), 'true');
}
async function closeMenu(page, method = 'escape') {
  if (method === 'escape') await page.keyboard.press('Escape');
  else if (method === 'scrim') await page.locator('.sidebar-scrim').click({ position: { x: 350, y: 300 } });
  else await page.locator('.sidebar-close').click();
  await page.waitForTimeout(430);
  assert.equal(await page.locator('#sidebar-layer').isVisible(), false);
  assert.equal(await page.locator('.main-menu-button').getAttribute('aria-expanded'), 'false');
}

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const { context, page } = await open(browser, standalone, { width: 390, height: 844 });
    await capture(page, '01-home-light-390', '首页关闭状态', standalone);
    await openMenu(page);
    const order = await page.locator('.sidebar-row').evaluateAll(rows => rows.map(row => row.dataset.sidebar));
    assert.deepEqual(order, ['mine', 'baby', 'cry', 'poop', 'record']);
    const geometry = await page.evaluate(() => {
      const app = document.querySelector('.app').getBoundingClientRect();
      const panel = document.querySelector('.sidebar-panel').getBoundingClientRect();
      return { app: { left: app.left, right: app.right, width: app.width }, panel: { left: panel.left, right: panel.right, width: panel.width }, overflow: document.querySelector('.app').scrollWidth - document.querySelector('.app').clientWidth };
    });
    assert.ok(Math.abs(geometry.panel.left - geometry.app.left) <= 2, JSON.stringify(geometry));
    assert.ok(geometry.panel.width <= 320.1 && geometry.panel.width <= geometry.app.width * .84 + 2, JSON.stringify(geometry));
    assert.ok(geometry.panel.right < geometry.app.right && geometry.overflow <= 2, JSON.stringify(geometry));
    checks.push({ id: 'open-order-width', status: 'pass', order, geometry });
    await capture(page, '02-menu-light-390', '关注哭声与便便时的侧边栏排序', standalone);

    await page.locator('[data-sidebar="record"]').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('sidebar-close')), true);
    checks.push({ id: 'focus-wrap', status: 'pass' });
    await closeMenu(page);
    assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('main-menu-button')), true);
    await openMenu(page);
    await closeMenu(page, 'scrim');
    checks.push({ id: 'escape-scrim-focus-return', status: 'pass' });

    await openMenu(page);
    await page.locator('[data-sidebar="mine"]').click();
    assert.equal(new URL(page.url()).hash, '#/mine');
    assert.equal(await page.locator('#mine .page-heading h2').textContent(), '我的');
    await page.locator('[data-action="mine-back"]').click();
    assert.equal(new URL(page.url()).hash, '#/home');
    checks.push({ id: 'mine-and-return', status: 'pass' });

    await openMenu(page);
    await page.locator('[data-sidebar="baby"]').click();
    assert.equal(await page.locator('#sheet-title').textContent(), '宝宝资料');
    assert.equal(await page.locator('#profile-form [name="baby"]').inputValue(), '小满');
    await capture(page, '03-baby-profile-390', '宝宝入口复用资料面板', standalone);
    await page.locator('#profile-form [name="baby"]').fill('小满新');
    await page.locator('#profile-form [type="submit"]').click();
    assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('main-menu-button')), true);
    await openMenu(page);
    assert.match(await page.locator('#sidebar-baby-summary').textContent(), /小满新/);
    await closeMenu(page, 'button');
    checks.push({ id: 'baby-profile-save', status: 'pass' });

    await openMenu(page);
    await page.locator('[data-sidebar="record"]').click();
    assert.equal(new URL(page.url()).hash, '#/records');
    assert.equal(await page.locator('#record-cta').isVisible(), true);
    await page.waitForFunction(() => document.activeElement?.matches('#records .journal-heading h2'));
    await capture(page, '04-records-390', '记录入口与新建入口', standalone);
    await page.locator('.profile-menu-button').click();
    await page.locator('[data-action="menu-mine"]').click();
    assert.equal(new URL(page.url()).hash, '#/mine');
    await page.locator('[data-action="mine-back"]').click();
    assert.equal(new URL(page.url()).hash, '#/records');
    await page.locator('.journal-topbar .back-home').click();
    assert.equal(new URL(page.url()).hash, '#/home');
    checks.push({ id: 'records-new-and-mine-return', status: 'pass' });

    await openMenu(page);
    await page.locator('[data-sidebar="cry"]').click();
    assert.equal(new URL(page.url()).hash, '#/home');
    assert.equal(await page.locator('.task-card').count() > 0, true);
    await page.waitForFunction(() => document.activeElement?.matches('#conversation .task-card[data-task-id]'));
    await capture(page, '05-cry-task-390', '哭声服务复用对话任务卡', standalone);
    await openMenu(page);
    await page.locator('[data-sidebar="poop"]').click();
    assert.match(await page.locator('#toast').textContent(), /先完成或取消当前任务/);
    checks.push({ id: 'task-conflict', status: 'pass' });
    await context.close();

    const dark = await open(browser, standalone, { width: 360, height: 640 }, { theme: 'dark', reduced: true, concerns: [] });
    await openMenu(dark.page);
    const darkOrder = await dark.page.locator('.sidebar-row').evaluateAll(rows => rows.map(row => row.dataset.sidebar));
    assert.deepEqual(darkOrder, ['mine', 'baby', 'record', 'cry', 'poop']);
    const darkBounds = await dark.page.locator('.sidebar-panel').boundingBox();
    assert.ok(darkBounds.width <= 303 && darkBounds.height <= 608, JSON.stringify(darkBounds));
    await capture(dark.page, '06-menu-dark-short-360', '夜间、短屏、减少动效与无关注点排序', standalone);
    await dark.page.keyboard.press('Escape');
    assert.equal(await dark.page.locator('#sidebar-layer').isVisible(), false);
    checks.push({ id: 'dark-short-reduced', status: 'pass', order: darkOrder, bounds: darkBounds });
    await dark.context.close();

    const desktop = await open(browser, standalone, { width: 1280, height: 720 });
    await openMenu(desktop.page);
    const desktopBounds = await desktop.page.locator('.sidebar-panel').boundingBox();
    assert.ok(desktopBounds.width <= 320.1 && desktopBounds.x > 400, JSON.stringify(desktopBounds));
    await capture(desktop.page, '07-menu-desktop-1280', '桌面预览中抽屉限定在应用内', standalone);
    checks.push({ id: 'desktop-bounds', status: 'pass', bounds: desktopBounds });
    await desktop.context.close();

    const moduleView = await open(browser, modular, { width: 390, height: 844 });
    await openMenu(moduleView.page);
    assert.equal(await moduleView.page.locator('#sidebar-services button').count(), 3);
    await capture(moduleView.page, '08-menu-modular-390', '模块版 file:// 侧边栏', modular);
    checks.push({ id: 'modular-file', status: 'pass' });
    await moduleView.context.close();

    assert.deepEqual(errors, []);
    const evidence = {
      revision: 'left-sidebar-24', captured_by: 'root/Playwright',
      browser: 'Google Chrome', browser_version: browser.version(),
      protocol: 'file://', source_sha256: { standalone: hash(standalone), modular: hash(modular) },
      screenshots, checks, errors
    };
    fs.writeFileSync(path.join(__dirname, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
    console.log(JSON.stringify({ browser: evidence.browser_version, checks: checks.map(x => x.id), screenshots: screenshots.length, errors }, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
