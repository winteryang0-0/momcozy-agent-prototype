const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '../..');
const output = path.join(__dirname, 'consistency-browser-evidence.json');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const captures = [];

async function run(browser, name, html, concerns) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Shanghai' });
  await context.addInitScript(concerns => localStorage.setItem('momcozy-home-1.0', JSON.stringify({
    records: [], profiles: { baby: '小满', birthWeeks: '40', careRole: '妈妈', momStage: '产后', concerns },
    prefs: { theme: 'light', sound: false }
  })), concerns);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const url = pathToFileURL(path.join(root, html)).href + '#/home';
  await page.goto(url, { waitUntil: 'load' });
  await page.locator('.main-menu-button').click();
  await page.waitForTimeout(430);
  const open = await page.evaluate(() => {
    const panel = document.querySelector('.sidebar-panel').getBoundingClientRect();
    const app = document.querySelector('.app').getBoundingClientRect();
    return {
      order: [...document.querySelectorAll('.sidebar-row')].map(b => b.dataset.sidebar),
      badges: [...document.querySelectorAll('.sidebar-services .sidebar-row')].filter(b => !b.querySelector('.sidebar-badge').hidden).map(b => b.dataset.sidebar),
      panelLeft: panel.left, panelWidth: panel.width, appLeft: app.left, appWidth: app.width,
      backgroundInert: document.querySelector('#scroll').inert,
      focus: document.activeElement.id || document.activeElement.className
    };
  });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(430);
  const dismiss = await page.evaluate(() => ({ hidden: document.querySelector('#sidebar-layer').hidden, focus: document.activeElement.className, backgroundInert: document.querySelector('#scroll').inert }));
  await page.locator('.main-menu-button').click();
  await page.waitForTimeout(430);
  await page.locator('[data-sidebar="mine"]').click();
  await page.waitForTimeout(60);
  const mine = await page.evaluate(() => ({ route: location.hash, focus: document.activeElement?.outerHTML?.slice(0, 180) || null }));
  await page.locator('[data-action="mine-back"]').click();
  await page.locator('.main-menu-button').click();
  await page.waitForTimeout(430);
  await page.locator('[data-sidebar="record"]').click();
  const records = await page.evaluate(() => ({ route: location.hash, ctaVisible: !document.querySelector('#record-cta').hidden, focus: document.activeElement?.outerHTML?.slice(0, 180) || null }));
  await page.locator('#record-cta [data-action="record"]').click();
  const create = await page.locator('#sheet-title').textContent();
  await page.locator('#sheet-close').click();
  await page.locator('.profile-menu-button').click();
  await page.locator('[data-action="menu-mine"]').click();
  const fromRecordsMine = { route: new URL(page.url()).hash };
  await page.locator('[data-action="mine-back"]').click();
  fromRecordsMine.back = new URL(page.url()).hash;
  await page.locator('.journal-topbar .back-home').click();
  await page.locator('.main-menu-button').click();
  await page.waitForTimeout(430);
  await page.locator('[data-sidebar="baby"]').click();
  const baby = await page.evaluate(() => ({ sheet: document.querySelector('#sheet-title').textContent, focus: document.activeElement?.id, route: location.hash }));
  await page.locator('#profile-form [name="baby"]').fill('未提交的宝宝名');
  await page.keyboard.press('Escape');
  baby.escapeClosed = !(await page.locator('#sheet').evaluate(el => el.open));
  await page.locator('.main-menu-button').click();
  await page.waitForTimeout(430);
  await page.locator('[data-sidebar="baby"]').click();
  baby.nameAfterEscape = await page.locator('#profile-form [name="baby"]').inputValue();
  await page.locator('#sheet-close').click();
  await page.locator('.main-menu-button').click();
  await page.waitForTimeout(430);
  await page.locator('[data-sidebar="cry"]').click();
  await page.waitForTimeout(100);
  const cry = await page.evaluate(() => ({ route: location.hash, task: document.querySelector('.task-message .task-card')?.textContent?.slice(0, 80), focus: document.activeElement?.outerHTML?.slice(0, 180) || null }));
  await page.locator('.main-menu-button').click();
  await page.waitForTimeout(430);
  await page.locator('[data-sidebar="poop"]').click();
  const conflict = await page.evaluate(() => ({ task: document.querySelector('.task-message .task-card')?.textContent?.slice(0, 80), toast: document.querySelector('#toast').textContent }));
  const result = { name, html, sha256: hash(path.join(root, html)), url, open, dismiss, mine, records, create, fromRecordsMine, baby, cry, conflict, errors };
  await context.close();
  return result;
}

async function runFreshPoop(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => localStorage.setItem('momcozy-home-1.0', JSON.stringify({ records: [], profiles: { baby: '小满', concerns: [] }, prefs: { theme: 'light' } })));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root, 'Momcozy-final.html')).href + '#/home');
  await page.locator('.main-menu-button').click();
  await page.waitForTimeout(430);
  await page.locator('[data-sidebar="poop"]').click();
  await page.waitForTimeout(60);
  const result = await page.evaluate(() => ({ route: location.hash, kind: document.querySelector('#conversation .care-task-card')?.getAttribute('data-category'), state: document.querySelector('#conversation .care-task-card')?.getAttribute('data-state-id'), focus: document.activeElement?.className, canStart: [...document.querySelectorAll('#conversation .care-task-card button')].some(button => button.textContent.includes('拍照')), canCancel: [...document.querySelectorAll('#conversation .care-task-card button')].some(button => button.textContent.includes('取消')) }));
  result.errors = errors;
  await context.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    captures.push(await run(browser, 'standalone-concerns', 'Momcozy-final.html', ['宝宝为什么哭', '宝宝便便情况']));
    captures.push(await run(browser, 'modular-no-concerns', 'index.html', []));
    const freshPoop = await runFreshPoop(browser);
    fs.writeFileSync(output, JSON.stringify({ revision: 'left-sidebar-24', reviewer: 'independent-consistency', capturedAt: new Date().toISOString(), captures, freshPoop }, null, 2));
    process.stdout.write(JSON.stringify({ output, captures, freshPoop }, null, 2));
  } finally { await browser.close(); }
}
main().catch(e => { process.stderr.write(e.stack + '\n'); process.exitCode = 1; });
