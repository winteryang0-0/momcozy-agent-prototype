const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const root = path.resolve(__dirname, '../..');
  const browser = await chromium.launch({headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const result = {browser: browser.version(), captures: []};
  try {
    for (const [i, scale] of [2, 2, 1].entries()) {
      const context = await browser.newContext({viewport: {width: 360, height: 640}, deviceScaleFactor: scale, timezoneId: 'Asia/Shanghai'});
      await context.addInitScript(() => localStorage.setItem('momcozy-home-1.0', JSON.stringify({records: [], profiles: {baby: '宝宝', careRole: '妈妈', momStage: '产后', concerns: [], babies: [{birth: '', weeks: '40'}]}, prefs: {theme: 'dark', sound: false}})));
      const page = await context.newPage();
      await page.goto(pathToFileURL(path.join(root, 'Momcozy-final.html')).href + '#/home', {waitUntil: 'load'});
      await page.locator('.main-menu-button').click();
      await page.locator('.sidebar-layer.is-open').waitFor();
      await page.waitForTimeout(400);
      const name = `12-sidebar-dark-text-${i + 1}-${scale}x.png`;
      const target = path.join(__dirname, 'screenshots', name);
      await page.screenshot({path: target});
      const styles = await page.locator('[data-sidebar="baby"] .sidebar-copy b').evaluate(el => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {fontFamily: s.fontFamily, fontSize: s.fontSize, lineHeight: s.lineHeight, textDecoration: s.textDecoration, textShadow: s.textShadow, transform: s.transform, rect: {x: r.x, y: r.y, width: r.width, height: r.height}};
      });
      result.captures.push({name, scale, styles});
      await context.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(__dirname, 'sidebar-text-verification.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
})().catch(err => {console.error(err); process.exitCode = 1;});
