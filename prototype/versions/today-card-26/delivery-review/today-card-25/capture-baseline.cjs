const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '../..');
const shots = path.join(__dirname, 'screenshots');
fs.mkdirSync(shots, { recursive: true });

async function capture(browser, width, height, theme) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, timezoneId: 'Asia/Shanghai' });
  await context.addInitScript(({ theme }) => {
    localStorage.setItem('momcozy-home-1.0', JSON.stringify({
      records: [],
      profiles: { baby: '小满', careRole: '妈妈', momStage: '产后', concerns: ['宝宝为什么哭'] },
      prefs: { theme, sound: false }
    }));
  }, { theme });
  const page = await context.newPage();
  await page.goto(pathToFileURL(path.join(root, 'Momcozy-final.html')).href + '#/home', { waitUntil: 'load' });
  await page.locator('#chat-message').fill('今天有些累，想整理一下心情。');
  await page.locator('#send-message').click();
  await page.waitForFunction(() => document.querySelector('#conversation-home-head')?.hidden === false && document.querySelector('#chat-status')?.textContent.trim() === '');
  const prefix = `before-${width}-${height}-${theme}`;
  await page.screenshot({ path: path.join(shots, `${prefix}-collapsed.png`), animations: 'disabled' });
  await page.locator('.compact-advice').click();
  await page.screenshot({ path: path.join(shots, `${prefix}-expanded.png`), animations: 'disabled' });
  const result = await page.evaluate(() => {
    const rect = id => {
      const r = document.querySelector(id).getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    return {
      compactText: document.querySelector('.compact-advice').innerText,
      cardText: document.querySelector('#expanded-advice').innerText,
      expanded: document.querySelector('.compact-advice').getAttribute('aria-expanded'),
      head: rect('#conversation-home-head'),
      chat: rect('#assistant-scroll'),
      composer: rect('.composer-area'),
      scrollHeight: document.querySelector('#assistant-scroll').scrollHeight,
      scrollTop: document.querySelector('#assistant-scroll').scrollTop
    };
  });
  await context.close();
  return { width, height, theme, ...result };
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    for (const [width, height, theme] of [[390, 844, 'light'], [360, 640, 'dark']]) {
      console.log(JSON.stringify(await capture(browser, width, height, theme), null, 2));
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
