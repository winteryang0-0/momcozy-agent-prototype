const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '../..');
const standalone = path.join(root, 'Momcozy-final.html');
const modular = path.join(root, 'index.html');
const screenshots = path.join(__dirname, 'screenshots');
fs.mkdirSync(screenshots, { recursive: true });
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const evidence = {
  revision: 'today-card-26',
  source_sha256: sha256(fs.readFileSync(path.join(root, 'sources/today-card-26-requirements.json'))),
  material_sha256: sha256(fs.readFileSync(standalone)),
  checks: [], screenshots: [], errors: [],
};
const check = (name, observed) => evidence.checks.push({ name, observed });

async function open(browser, file, viewport, theme = 'light') {
  const context = await browser.newContext({
    viewport, deviceScaleFactor: 2, timezoneId: 'Asia/Shanghai', hasTouch: true,
  });
  const seed = {
    records: [],
    profiles: { baby: '宝宝', careRole: '妈妈', momStage: '产后', concerns: [], babies: [{ birth: '', weeks: '40' }] },
    prefs: { theme, sound: false },
  };
  await context.addInitScript(value => {
    if (!localStorage.getItem('momcozy-home-1.0')) {
      localStorage.setItem('momcozy-home-1.0', JSON.stringify(value));
    }
  }, seed);
  const page = await context.newPage();
  page.on('pageerror', error => evidence.errors.push('pageerror: ' + error.message));
  page.on('console', message => {
    if (message.type() === 'error') evidence.errors.push('console: ' + message.text());
  });
  await page.goto(pathToFileURL(file).href + '#/home', { waitUntil: 'load' });
  await page.locator('.care-shortcuts').waitFor();
  return { context, page };
}

async function screenshot(page, name, note) {
  await page.waitForTimeout(260);
  const target = path.join(screenshots, name + '.png');
  await page.screenshot({ path: target });
  const bytes = fs.readFileSync(target);
  evidence.screenshots.push({
    name, note,
    path: path.relative(root, target).replaceAll('\\', '/'),
    sha256: sha256(bytes),
    url: page.url(), viewport: page.viewportSize(),
    image_pixels: { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) },
    fullPage: false, captured_at: new Date().toISOString(),
  });
}

async function card(page, host) {
  return page.locator(host + ' .advice-card');
}
async function selected(page, host) {
  return Number(await page.locator(host + ' .advice-dot[aria-current="true"]').getAttribute('data-advice-index'));
}
async function geometry(page, host) {
  return page.evaluate(selector => {
    const host = document.querySelector(selector);
    const card = host.querySelector('.advice-card');
    const controls = host.querySelector('.advice-controls');
    const dots = host.querySelector('.advice-dots');
    const rect = element => {
      const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
      return { left, right, top, bottom, width, height };
    };
    return {
      host: rect(host), card: rect(card), controls: rect(controls), dots: rect(dots),
      cardChildren: [...card.children].map(node => ({ className: node.className, ...rect(node) })),
      visibleDots: [...dots.querySelectorAll('button')].filter(button => button.getBoundingClientRect().width > 0).length,
      horizontalOverflow: document.querySelector('.app').scrollWidth - document.querySelector('.app').clientWidth,
    };
  }, host);
}
function centeredAtBottom(g) {
  assert.equal(g.visibleDots, 3);
  assert.ok(Math.abs((g.dots.left + g.dots.right) / 2 - (g.card.left + g.card.right) / 2) <= 2, JSON.stringify(g));
  assert.ok(g.dots.top > g.cardChildren[0].bottom - 1, JSON.stringify(g));
  assert.ok(g.dots.bottom <= g.card.bottom + 1, JSON.stringify(g));
  assert.equal(g.horizontalOverflow, 0, JSON.stringify(g));
}
async function noRemovedControls(page, host) {
  const buttons = await page.locator(host + ' .advice-card button').count();
  assert.equal(buttons, 3);
  assert.equal(await page.locator(host + ' [data-action="advice-detail"]').count(), 0);
  assert.equal(await page.locator(host + ' [data-action="advice-next"]').count(), 0);
  assert.equal(await page.locator(host + ' [data-action="advice-prev"]').count(), 0);
  assert.equal((await page.locator(host + ' .advice-card').innerText()).includes('查看依据'), false);
  await (await card(page, host)).click({ position: { x: 75, y: 37 } });
  assert.equal(await page.locator('#sheet').isVisible(), false);
}
async function swipe(page, host, dx, dy) {
  const box = await page.locator(host + ' .advice-widget').boundingBox();
  assert.ok(box);
  const x = box.x + box.width / 2;
  const y = box.y + Math.min(38, box.height / 3);
  const client = await page.context().newCDPSession(page);
  try {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    for (let i = 1; i <= 5; i++) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 5, y: y + dy * i / 5, id: 1 }] });
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await client.detach();
  }
  await page.waitForTimeout(90);
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  evidence.browser = { name: 'Google Chrome', version: browser.version(), mode: 'headless', protocol: 'file://', deviceScaleFactor: 2 };
  try {
    {
      const { context, page } = await open(browser, standalone, { width: 390, height: 844 });
      const host = '#daily-advice';
      await noRemovedControls(page, host);
      const g = await geometry(page, host);
      centeredAtBottom(g);
      check('welcome card pager and removed controls', g);
      await screenshot(page, '01-welcome-390', '欢迎态卡片，三枚页码点在底部居中');

      await page.locator(host + ' [data-advice-index="2"]').click();
      assert.equal(await selected(page, host), 2);
      assert.match(await page.locator('#advice-announcement').innerText(), /第 3 条提醒/);
      await screenshot(page, '02-welcome-third-390', '点选第三条提醒');
      await swipe(page, host, -90, 2);
      assert.equal(await selected(page, host), 0);
      await swipe(page, host, 90, 2);
      assert.equal(await selected(page, host), 2);
      await swipe(page, host, 4, 70);
      assert.equal(await selected(page, host), 2);
      check('welcome native touch wraps both directions and ignores vertical gesture', { selected: await selected(page, host) });

      await page.locator(host + ' .advice-widget').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await selected(page, host), 0);
      assert.equal(await page.locator(host + ' .advice-widget').evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('ArrowLeft');
      assert.equal(await selected(page, host), 2);
      await page.locator(host + ' [data-advice-index="1"]').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await selected(page, host), 0);
      assert.equal(await page.locator(host + ' [data-advice-index="0"]').evaluate(el => el === document.activeElement), true);
      check('keyboard wraps and focus follows selected indicator', { selected: await selected(page, host) });
      await context.close();
    }
    {
      const { context, page } = await open(browser, standalone, { width: 390, height: 844 });
      await page.locator('.main-menu-button').click();
      await page.locator('#care-sidebar').waitFor({ state: 'visible' });
      assert.deepEqual(await page.locator('#care-sidebar [data-sidebar]').evaluateAll(rows => rows.map(row => row.dataset.sidebar)), ['mine', 'baby', 'record']);
      assert.equal(await page.locator('#care-sidebar').innerText(), '我的\n宝宝\n当日记录');
      assert.equal(await page.locator('#sidebar-services, #sidebar-context, #sidebar-services-title, #sidebar-title').count(), 0);
      await screenshot(page, '09-sidebar-390', '侧栏仅保留我的、宝宝和当日记录');
      await page.locator('[data-sidebar="record"]').click();
      assert.equal(new URL(page.url()).hash, '#/records');
      assert.equal(await page.locator('#record-cta').isVisible(), true);
      await page.locator('#record-cta button').click();
      assert.equal(await page.locator('#sheet').isVisible(), true);
      check('simple sidebar and record creation', { labels: ['我的', '宝宝', '当日记录'], newRecordOpen: true });
      await context.close();
    }
    {
      const { context, page } = await open(browser, standalone, { width: 390, height: 844 });
      await page.locator('.main-menu-button').click();
      await page.locator('[data-sidebar="mine"]').click();
      assert.equal(new URL(page.url()).hash, '#/mine');
      await page.locator('[data-action="mine-back"]').click();
      await page.locator('.main-menu-button').click();
      await page.locator('[data-sidebar="baby"]').click();
      assert.equal(await page.locator('#sheet').isVisible(), true);
      assert.match(await page.locator('#sheet-title').innerText(), /宝宝/);
      await page.locator('#sheet-close').click();
      check('mine and baby sidebar entries', { route: new URL(page.url()).hash, babySheetClosed: true });
      await context.close();
    }
    {
      const { context, page } = await open(browser, standalone, { width: 390, height: 844 });
      await page.locator('.main-menu-button').click();
      await page.locator('[data-sidebar="baby"]').click();
      await page.locator('#profile-form [name="baby"]').fill('小月');
      await page.locator('#profile-form button[type="submit"]').click();
      assert.equal(await page.locator('#sheet').isVisible(), false);
      await page.locator('.main-menu-button').click();
      assert.equal(await page.locator('#care-sidebar').innerText(), '我的\n宝宝\n当日记录');
      await page.locator('[data-sidebar="baby"]').click();
      assert.equal(await page.locator('#profile-form [name="baby"]').inputValue(), '小月');
      check('baby profile save reopens with current value and sidebar stays simple', { baby: '小月', sidebarLabels: ['我的', '宝宝', '当日记录'] });
      await context.close();
    }
    {
      const { context, page } = await open(browser, standalone, { width: 390, height: 844 });
      await page.locator('.care-shortcuts [data-care="cry"]').click();
      assert.equal(await page.locator('.task-card').count(), 1);
      assert.equal(await page.locator('#expanded-advice').isVisible(), false);
      await page.locator('.compact-advice').click();
      const host = '#expanded-advice';
      assert.equal(await page.locator(host).isVisible(), true);
      await noRemovedControls(page, host);
      const g = await geometry(page, host);
      centeredAtBottom(g);
      const title = await page.locator(host + ' .advice-card-heading strong').innerText();
      assert.equal((await page.locator('#conversation-home-head').innerText()).split(title).length - 1, 1);
      await screenshot(page, '03-expanded-390', '对话后展开的 Today 单层卡片');
      await page.locator(host + ' [data-advice-index="2"]').click();
      await swipe(page, host, -85, 1);
      assert.equal(await selected(page, host), 0);
      await swipe(page, host, 85, 1);
      assert.equal(await selected(page, host), 2);
      await screenshot(page, '04-expanded-third-390', '悬浮卡双向循环后的第三条提醒');
      await page.locator('.compact-advice').click();
      assert.equal(await page.locator(host).isVisible(), false);
      await page.locator('.compact-advice').click();
      assert.equal(await selected(page, host), 2);
      assert.equal(await page.locator('#compact-advice').isVisible(), false);
      check('expanded card layout, cycle, collapse and restore', { geometry: g, restored: await selected(page, host) });
      await context.close();
    }
    {
      const { context, page } = await open(browser, standalone, { width: 360, height: 640 }, 'dark');
      let g = await geometry(page, '#daily-advice');
      centeredAtBottom(g);
      await screenshot(page, '05-welcome-dark-360', '夜间短屏欢迎态 Today 卡片');
      await page.locator('.main-menu-button').click();
      assert.equal(await page.locator('#care-sidebar [data-sidebar]').count(), 3);
      await page.waitForTimeout(440);
      await screenshot(page, '10-sidebar-dark-360', '夜间短屏精简侧栏');
      await page.locator('.sidebar-close').click();
      await page.waitForTimeout(400);
      await page.locator('.care-shortcuts [data-care="cry"]').click();
      await page.locator('.compact-advice').click();
      g = await geometry(page, '#expanded-advice');
      centeredAtBottom(g);
      const layout = await page.evaluate(() => ({
        headHeight: document.querySelector('#conversation-home-head').getBoundingClientRect().height,
        chatHeight: document.querySelector('#assistant-scroll').getBoundingClientRect().height,
        composerVisible: document.querySelector('#chat-message').getBoundingClientRect().bottom <= document.querySelector('.app').getBoundingClientRect().bottom,
      }));
      assert.ok(layout.chatHeight > 145, JSON.stringify(layout));
      assert.equal(layout.composerVisible, true);
      await screenshot(page, '06-expanded-dark-360', '夜间短屏悬浮 Today 展开卡片');
      await page.locator('#expanded-advice [data-advice-index="2"]').click();
      await swipe(page, '#expanded-advice', -80, 1);
      assert.equal(await selected(page, '#expanded-advice'), 0);
      await swipe(page, '#expanded-advice', 3, 60);
      assert.equal(await selected(page, '#expanded-advice'), 0);
      check('dark short screen and vertical gesture', { layout, geometry: g });
      await context.close();
    }
    {
      const { context, page } = await open(browser, standalone, { width: 1280, height: 720 });
      centeredAtBottom(await geometry(page, '#daily-advice'));
      await screenshot(page, '07-welcome-desktop', '桌面布局中的 Today 欢迎态卡片');
      await page.locator('.main-menu-button').click();
      await page.waitForTimeout(440);
      const sidebarLayout = await page.evaluate(() => {
        const app = document.querySelector('.app');
        const panel = document.querySelector('#care-sidebar');
        const rect = panel.getBoundingClientRect();
        return {
          width: rect.width,
          left: rect.left - app.getBoundingClientRect().left,
          visibleLabels: panel.innerText,
          horizontalOverflow: app.scrollWidth - app.clientWidth,
        };
      });
      assert.ok(sidebarLayout.width <= 320 && Math.abs(sidebarLayout.left) <= 2, JSON.stringify(sidebarLayout));
      assert.equal(sidebarLayout.visibleLabels, '我的\n宝宝\n当日记录');
      assert.equal(sidebarLayout.horizontalOverflow, 0);
      await screenshot(page, '11-sidebar-desktop', '桌面视口精简侧栏');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(440);
      assert.equal(await page.locator('#sidebar-layer').isHidden(), true);
      assert.equal(await page.locator('.main-menu-button').evaluate(el => el === document.activeElement), true);
      check('desktop sidebar and Escape focus return', sidebarLayout);
      await page.locator('.care-shortcuts [data-care="record"]').click();
      await page.locator('.compact-advice').click();
      centeredAtBottom(await geometry(page, '#expanded-advice'));
      assert.equal(await page.locator('.task-card').count(), 1);
      await screenshot(page, '08-expanded-desktop', '桌面布局中的悬浮 Today 卡片及记录任务');
      check('desktop and record task regression', { taskCards: await page.locator('.task-card').count() });
      await context.close();
    }
    {
      const { context, page } = await open(browser, standalone, { width: 390, height: 844 });
      const toggle = page.locator('.main-menu-button');
      await toggle.focus();
      await toggle.click();
      assert.equal(await page.locator('#care-sidebar').evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.locator('[data-sidebar="record"]').evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.sidebar-close').evaluate(el => el === document.activeElement), true);
      await page.locator('.sidebar-close').click();
      await page.waitForTimeout(440);
      assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
      await toggle.click();
      await page.locator('.sidebar-scrim').click({ position: { x: 370, y: 420 } });
      await page.waitForTimeout(440);
      assert.equal(await page.locator('#sidebar-layer').isHidden(), true);
      assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
      check('sidebar focus trap, close button and scrim focus return', { closed: true, focus: 'main-menu-button' });
      await context.close();
    }
    {
      const { context, page } = await open(browser, modular, { width: 390, height: 844 });
      centeredAtBottom(await geometry(page, '#daily-advice'));
      await page.locator('#daily-advice [data-advice-index="2"]').click();
      await swipe(page, '#daily-advice', -90, 1);
      assert.equal(await selected(page, '#daily-advice'), 0);
      await page.locator('.care-shortcuts [data-care="cry"]').click();
      await page.locator('.compact-advice').click();
      centeredAtBottom(await geometry(page, '#expanded-advice'));
      check('modular file entry', { url: page.url() });
      await context.close();
    }
    assert.deepEqual(evidence.errors, []);
    console.log(`PASS ${evidence.checks.length} targeted groups, ${evidence.screenshots.length} screenshots`);
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(__dirname, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  }
}
main().catch(error => {
  evidence.errors.push(String(error.stack || error));
  console.error(error);
  process.exitCode = 1;
});
