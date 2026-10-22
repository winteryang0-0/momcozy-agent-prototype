const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const html = path.join(root, 'Momcozy-final.html');
const url = pathToFileURL(html).href + '#/home';
const screenshots = path.join(__dirname, 'screenshots');
fs.mkdirSync(screenshots, { recursive: true });
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const evidence = {
  material: 'Momcozy-final.html',
  sha256: sha(html),
  capturedAt: new Date().toISOString(),
  viewport: { width: 390, height: 844 },
  browser: '',
  checks: [],
  screenshots: [],
  errors: []
};

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });
  evidence.browser = browser.version();
  const context = await browser.newContext({
    viewport: evidence.viewport,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    deviceScaleFactor: 1
  });
  await context.addInitScript(() => {
    if (sessionStorage.getItem('momcozy-en-qa-seeded')) return;
    sessionStorage.setItem('momcozy-en-qa-seeded', '1');
    const d = new Date();
    const day = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
    localStorage.setItem('momcozy-home-1.0-en-US', JSON.stringify({
      records: [{
        id: 'r-user-1', type: '瓶喂母乳', owner: '宝宝', amount: '90',
        time: day + 'T00:15', note: '晚上九点喂奶后观察', sync: '待同步'
      }],
      profiles: {
        baby: '小月', birth: '', careRole: '妈妈', momStage: '产后',
        momAge: '30', parity: '1', babyCount: 1,
        babies: [{ birth: '', weeks: '40' }], birthWeeks: '40', focus: ''
      },
      prefs: { theme: 'light', sound: false, reduced: false }
    }));
    localStorage.setItem('momcozy-home-1.0-en-US-conversations', JSON.stringify({
      version: 1,
      activeId: 'chat-user-1',
      items: [{
        id: 'chat-user-1', title: '今天宝宝情况', customTitle: '今天宝宝情况',
        updatedAt: new Date().toISOString(),
        payload: {
          messages: [{ role: 'user', text: '宝宝今天睡得好' }],
          task: null, taskHistory: [], draft: '', attachment: '', pendingReply: false
        }
      }]
    }));
  });

  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.on('pageerror', err => evidence.errors.push('pageerror: ' + err.message));
  page.on('console', msg => { if (msg.type() === 'error') evidence.errors.push('console: ' + msg.text()); });

  async function check(name, action) {
    await action();
    evidence.checks.push({ name, passed: true, route: await page.evaluate(() => location.hash) });
    console.log('pass', name);
  }
  async function screenshot(name) {
    const file = path.join(screenshots, `final-${name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    evidence.screenshots.push({
      name, path: path.relative(root, file).replaceAll('\\', '/'),
      sha256: sha(file), dimensions: evidence.viewport, fullPage: false
    });
  }
  async function assertEnglishUI() {
    const remaining = await page.evaluate(() => {
      const visible = el => {
        if (!el || el.closest('script,style,[hidden],[data-user-content],.bubble.user')) return false;
        const css = getComputedStyle(el);
        return css.display !== 'none' && css.visibility !== 'hidden' && !!el.getClientRects().length;
      };
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), found = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (visible(node.parentElement) && /[\u3400-\u9fff]/u.test(node.nodeValue)) found.push(node.nodeValue.trim());
      }
      return found;
    });
    assert.deepEqual(remaining, []);
  }

  try {
    await page.goto(url, { waitUntil: 'load' });
    await check('home keeps the baby name and user message', async () => {
      assert.match(await page.locator('#assistant-context').innerText(), /you and 小月/);
      assert.equal(await page.locator('.bubble.user').innerText(), 'You\n宝宝今天睡得好');
      await assertEnglishUI();
    });
    await screenshot('home-user-text');

    await check('Today tip expands, cycles with dots and keyboard, and collapses', async () => {
      const toggle = page.locator('#assistant .compact-advice');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      assert.equal(await page.locator('#expanded-advice .advice-widget-floating').isVisible(), true);
      await page.locator('#expanded-advice .advice-dot[data-advice-index="1"]').click();
      assert.equal(await page.locator('#expanded-advice .advice-dot[aria-current="true"]').count(), 1);
      assert.match(await page.locator('#advice-announcement').innerText(), /^Tip 2:/);
      assert.equal(await page.locator('#expanded-advice .advice-dot[data-advice-index="1"]').getAttribute('aria-current'), 'true');
      await page.locator('#expanded-advice .advice-widget').focus();
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.locator('#expanded-advice .advice-dot[data-advice-index="0"]').getAttribute('aria-current'), 'true');
      await assertEnglishUI();
      await screenshot('today-tip-expanded');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('#expanded-advice').isVisible(), false);
    });

    await check('side menu opens and Escape closes it', async () => {
      await page.locator('#assistant .main-menu-button').click();
      assert.equal(await page.locator('#care-sidebar').isVisible(), true);
      assert.deepEqual(await page.locator('#care-sidebar .sidebar-row').allTextContents(), ['My Care Space', 'Baby', 'Today’s Journal']);
      assert.equal(await page.locator('#care-sidebar [data-sidebar="cry"], #care-sidebar [data-sidebar="poop"]').count(), 0);
      await assertEnglishUI();
      await page.waitForFunction(() => document.querySelector('#care-sidebar').getBoundingClientRect().left >= -1);
      await screenshot('main-menu');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.querySelector('#sidebar-layer').hidden);
      assert.equal(await page.locator('#assistant .main-menu-button').getAttribute('aria-expanded'), 'false');
    });

    await check('side menu opens the baby profile', async () => {
      await page.locator('#assistant .main-menu-button').click();
      await page.locator('#care-sidebar [data-sidebar="baby"]').click();
      assert.equal(await page.locator('#sheet').getAttribute('open'), '');
      assert.equal(await page.locator('#sheet-title').innerText(), 'Baby’s profile');
      await assertEnglishUI();
      await page.locator('#sheet-close').click();
    });

    await check('side menu opens My Care Space and returns home', async () => {
      await page.locator('#assistant .main-menu-button').click();
      await page.locator('#care-sidebar [data-sidebar="mine"]').click();
      assert.equal(await page.evaluate(() => location.hash), '#/mine');
      await assertEnglishUI();
      await page.locator('#mine .back-home').click();
      assert.equal(await page.evaluate(() => location.hash), '#/home');
    });

    await check('side menu reaches the journal', async () => {
      await page.locator('#assistant .main-menu-button').click();
      await page.locator('#care-sidebar [data-sidebar="record"]').click();
      assert.equal(await page.evaluate(() => location.hash), '#/records');
      assert.equal(await page.locator('#journal-baby-label').innerText(), '小月');
      assert.match(await page.locator('#record-list .journal-row').innerText(), /小月/);
      assert.match(await page.locator('#record-list .journal-row').innerText(), /Bottle-fed breast milk/);
      await assertEnglishUI();
    });
    await screenshot('journal-user-name');

    await check('journal note remains verbatim', async () => {
      await page.locator('#record-list .journal-row').click();
      assert.equal(await page.locator('#sheet-body dd[data-user-content]').innerText(), '晚上九点喂奶后观察');
      await assertEnglishUI();
      await page.locator('#sheet-close').click();
    });

    await check('growth view keeps the baby name while translating the label', async () => {
      await page.locator('.record-more').evaluate(el => { el.open = true; });
      await page.locator('#record-links [data-detail="生长发育"]').evaluate(el => el.click());
      assert.match(await page.locator('#sheet-body .sheet-description').innerText(), /^小月 · Recent length and weight$/);
      await assertEnglishUI();
      await page.locator('#sheet-close').click();
    });

    await check('My Care Space returns to the journal', async () => {
      await page.locator('#records .profile-menu-button').click();
      await page.locator('#sheet [data-action="menu-mine"]').click();
      assert.equal(await page.evaluate(() => location.hash), '#/mine');
      assert.match(await page.locator('#mine .profile-card h3').innerText(), /Mom and 小月/);
      await assertEnglishUI();
      await page.locator('#mine [data-action="mine-back"]').click();
      assert.equal(await page.evaluate(() => location.hash), '#/records');
    });
    await screenshot('journal-after-mine');

    await check('history title and preview remain verbatim', async () => {
      await page.locator('#records .profile-menu-button').click();
      await page.locator('#sheet [data-action="chat-history"]').click();
      assert.equal(await page.locator('#history-results [data-user-content]').first().innerText(), '今天宝宝情况');
      assert.equal(await page.locator('#history-results .chat-history-preview').innerText(), '宝宝今天睡得好');
      assert.equal(await page.locator('#history-results [data-rename-conversation]').getAttribute('aria-label'), 'Rename: 今天宝宝情况');
      await assertEnglishUI();
      await page.locator('#history-results [data-rename-conversation]').click();
      assert.equal(await page.locator('#conversation-title').inputValue(), '今天宝宝情况');
      await page.locator('#sheet-close').click();
    });

    await check('voice sample inserts natural English', async () => {
      await page.locator('#chat-message').fill('');
      const box = await page.locator('#quick-voice').boundingBox();
      assert.ok(box);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(400);
      await page.mouse.up();
      assert.equal(await page.locator('#chat-message').inputValue(), 'I’d like to review today’s feedings.');
      await page.locator('#chat-message').fill('');
    });

    await check('user content survives a file reload', async () => {
      await page.reload({ waitUntil: 'load' });
      assert.match(await page.locator('#assistant-context').innerText(), /you and 小月/);
      assert.equal(await page.locator('.bubble.user').innerText(), 'You\n宝宝今天睡得好');
      await assertEnglishUI();
    });
    assert.deepEqual(evidence.errors, []);
  } catch (err) {
    evidence.errors.push(err.stack || String(err));
  } finally {
    fs.writeFileSync(path.join(__dirname, 'final-flow-evidence.json'), JSON.stringify(evidence, null, 2));
    await context.close();
    await browser.close();
    console.log('checks=' + evidence.checks.length, 'errors=' + evidence.errors.length);
    if (evidence.errors.length) {
      console.error(evidence.errors.join('\n'));
      process.exitCode = 1;
    }
  }
}

run();
