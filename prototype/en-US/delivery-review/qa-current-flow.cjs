const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const html = path.join(root, 'Momcozy-final.html');
const shots = path.join(__dirname, 'screenshots');
fs.mkdirSync(shots, { recursive: true });
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const evidence = {
  material: 'Momcozy-final.html',
  sha256: sha(html),
  sourceSha256: sha(path.resolve(__dirname, '../../current/assets/app.js')),
  capturedAt: new Date().toISOString(),
  browser: null,
  checks: [], screenshots: [], errors: []
};

function englishText(page) {
  return page.evaluate(() => {
    const visible = el => {
      if (!el || el.closest('script,style,[hidden],[data-user-content],.bubble.user')) return false;
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && !!el.getClientRects().length;
    };
    const chinese = [], walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement;
      if (visible(el) && /[\u3400-\u9fff]/u.test(walker.currentNode.nodeValue)) chinese.push(walker.currentNode.nodeValue.trim());
    }
    for (const el of document.querySelectorAll('[aria-label],[title],[placeholder],[alt]')) {
      if (!visible(el)) continue;
      for (const name of ['aria-label', 'title', 'placeholder', 'alt']) {
        const value = el.getAttribute(name);
        if (value && /[\u3400-\u9fff]/u.test(value)) chinese.push(`${name}: ${value}`);
      }
    }
    return chinese;
  });
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });
  evidence.browser = browser.version();
  let context;
  try {
    async function open(width = 390, height = 844, theme = 'light') {
      context = await browser.newContext({
        viewport: { width, height }, locale: 'en-US', timezoneId: 'America/New_York',
        deviceScaleFactor: 1
      });
      await context.addInitScript(theme => {
        if (localStorage.getItem('momcozy-home-1.0-en-US')) return;
        localStorage.setItem('momcozy-home-1.0-en-US', JSON.stringify({
          records: [],
          profiles: { baby: 'Avery', careRole: '妈妈', momStage: '产后', babies: [{ birth: '', weeks: '40' }] },
          prefs: { theme, sound: false, reduced: true }
        }));
      }, theme);
      const page = await context.newPage();
      page.setDefaultTimeout(8000);
      page.on('pageerror', error => evidence.errors.push(`pageerror: ${error.message}`));
      page.on('console', message => {
        if (message.type() === 'error') evidence.errors.push(`console: ${message.text()}`);
      });
      await page.goto(pathToFileURL(html).href + '#/home', { waitUntil: 'load' });
      await page.locator('.care-shortcuts').waitFor();
      return page;
    }
    async function close() { await context.close(); context = null; }
    async function state(page) {
      return page.evaluate(() => ({
        task: task && { id: task.id, kind: task.kind, state: task.state, job: task.recordJob && { id: task.recordJob.id, requestId: task.recordJob.requestId, state: task.recordJob.state } },
        history: taskHistory.map(item => ({ id: item.id, kind: item.kind, state: item.state, resumedBy: item.resumedBy, job: item.recordJob && { id: item.recordJob.id, requestId: item.recordJob.requestId, state: item.recordJob.state } })),
        records: records.map(record => record.id)
      }));
    }
    async function start(page, kind) { await page.locator(`.care-shortcuts [data-care="${kind}"]`).click(); }
    async function record(page, type = '配方奶') {
      await start(page, 'record');
      await page.locator(`.inline-record-card [data-inline-type="${type}"]`).click();
      if (type === '配方奶') await page.locator('#inline-record-form [name="amount"]').fill('90');
      if (type === '换尿布') {
        await page.locator('#inline-record-form [name="kind"][value="嘘嘘"]').check();
        await page.locator('#inline-record-form [name="rash"][value="无"]').check();
      }
    }
    async function check(page, name) {
      const chinese = await englishText(page);
      assert.deepEqual(chinese, [], `${name}: untranslated UI`);
      const geometry = await page.evaluate(() => ({
        width: document.querySelector('.app').clientWidth,
        overflow: document.querySelector('.app').scrollWidth - document.querySelector('.app').clientWidth
      }));
      assert.equal(geometry.overflow, 0, `${name}: horizontal overflow`);
      evidence.checks.push({ name, route: await page.evaluate(() => location.hash), geometry });
      console.log('pass', name);
    }
    async function screenshot(page, name) {
      await page.waitForTimeout(100);
      const file = path.join(shots, `current-${name}.png`);
      await page.screenshot({ path: file, animations: 'disabled' });
      const bytes = fs.readFileSync(file);
      evidence.screenshots.push({ name, path: path.relative(root, file).replaceAll('\\', '/'), sha256: sha(file), viewport: page.viewportSize(), pixels: { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }, url: page.url(), capturedAt: new Date().toISOString(), fullPage: false });
    }

    {
      const page = await open();
      await record(page, '换尿布');
      await start(page, 'cry');
      await start(page, 'cry');
      let s = await state(page);
      assert.equal(s.task.kind, 'cry');
      assert.equal(s.history.length, 2);
      assert.equal(s.history[0].state, 'interrupted');
      assert.equal(await page.locator('.task-card').count(), 3);
      await check(page, 'consecutive care cards');
      await screenshot(page, 'three-cards-390');
      await page.locator('.inline-record-card [data-resume-task]').first().click();
      s = await state(page);
      assert.equal(s.task.kind, 'record');
      assert.equal(s.history[0].resumedBy, s.task.id);
      assert.equal(await page.locator('#inline-record-form [name="kind"]:checked').inputValue(), '嘘嘘');
      assert.equal(await page.locator('.inline-record-card [data-resume-task]').count(), 0);
      await check(page, 'draft transfer');
      await screenshot(page, 'resumed-draft-390');
      await page.locator('#inline-record-form button[type="submit"]').click();
      await page.waitForTimeout(1050);
      s = await state(page);
      assert.equal(s.records.length, 1);
      assert.equal(s.task.state, 'success');
      await check(page, 'resumed draft saved once');
      await screenshot(page, 'saved-draft-390');
      await close();
    }
    {
      const page = await open();
      await record(page);
      await page.locator('#inline-record-form button[type="submit"]').click();
      assert.equal((await state(page)).task.job.state, 'saving');
      await start(page, 'poop');
      await page.waitForTimeout(1050);
      const s = await state(page);
      assert.equal(s.history[0].job.state, 'success');
      assert.equal(s.records.length, 1);
      await check(page, 'background save completes');
      await screenshot(page, 'background-save-390');
      await close();
    }
    {
      const page = await open();
      await page.evaluate(() => { scenario = 'unknown'; });
      await record(page);
      await page.locator('#inline-record-form button[type="submit"]').click();
      await start(page, 'poop');
      await page.waitForTimeout(1050);
      let s = await state(page);
      assert.equal(s.history[0].job.state, 'unknown');
      const requestId = s.history[0].job.requestId;
      await check(page, 'unknown save in historical card');
      await screenshot(page, 'unknown-save-390');
      await page.locator('.inline-record-card [data-inline-action="check"]').click();
      s = await state(page);
      assert.equal(s.records.length, 1);
      assert.equal(s.history[0].job.requestId, requestId);
      await page.reload({ waitUntil: 'load' });
      s = await state(page);
      assert.equal(s.records.length, 1);
      assert.equal(s.history[0].job.state, 'success');
      await check(page, 'same request checked and restored');
      await close();
    }
    {
      const page = await open();
      await record(page);
      await page.locator('#inline-record-form button[type="submit"]').click();
      await start(page, 'poop');
      await page.reload({ waitUntil: 'load' });
      let s = await state(page);
      assert.equal(s.records.length, 0);
      assert.equal(s.history[0].job.state, 'unknown');
      await page.locator('.inline-record-card [data-inline-action="check"]').click();
      s = await state(page);
      assert.equal(s.records.length, 1);
      await check(page, 'refresh during save is recoverable');
      await close();
    }
    {
      const page = await open();
      await page.locator('#chat-message').fill('Listen to crying');
      await page.locator('#chat-form').evaluate(form => form.requestSubmit());
      await start(page, 'poop');
      await page.waitForTimeout(820);
      const s = await state(page);
      assert.equal(s.task.kind, 'poop');
      assert.equal(s.history.length, 0);
      assert.match(await page.locator('#conversation .assistant-message .bubble').last().innerText(), /You’ve opened another care tool/);
      await check(page, 'late intent leaves newer task in place');
      await close();
    }
    {
      const page = await open(360, 640, 'dark');
      await start(page, 'cry');
      await page.locator('.compact-advice').click();
      await check(page, 'dark short screen');
      await screenshot(page, 'dark-360');
      await close();
    }
    assert.deepEqual(evidence.errors, []);
  } catch (error) {
    evidence.errors.push(error.stack || String(error));
  } finally {
    fs.writeFileSync(path.join(__dirname, 'current-flow-evidence.json'), JSON.stringify(evidence, null, 2));
    if (context) await context.close();
    await browser.close();
    console.log(`checks=${evidence.checks.length} screenshots=${evidence.screenshots.length} errors=${evidence.errors.length}`);
    if (evidence.errors.length) {
      console.error(evidence.errors.join('\n'));
      process.exitCode = 1;
    }
  }
}

run();
