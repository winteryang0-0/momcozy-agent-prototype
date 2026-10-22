const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {pathToFileURL} = require('node:url');
const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '../..');
const html = path.join(root, 'Momcozy-final.html');
const image = path.join(__dirname, 'screenshots', '11-first-identity-dark-390.png');
const result = path.join(__dirname, 'dark-browser-evidence.json');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

(async () => {
  const browser = await chromium.launch({headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    const context = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
    await page.goto(pathToFileURL(html).href + '#/home', {waitUntil: 'load'});
    await page.locator('.preview-strip [data-action="settings"]').click();
    await page.locator('#sheet [data-theme="dark"]').click();
    await page.locator('#sheet [data-action="close"]').click();
    await page.waitForTimeout(160);
    if (await page.locator('body').getAttribute('data-theme') !== 'dark') throw new Error('Dark theme did not apply');
    await page.screenshot({path: image});
    const evidence = {
      revision: 'onboarding-berry-ui-19',
      material_sha256: sha(html),
      operator: 'Playwright local Chrome headless',
      browser: 'Chrome ' + browser.version(),
      protocol: 'file://',
      url: page.url(),
      captured_at: new Date().toISOString(),
      viewport: {width: 390, height: 844},
      fullPage: false,
      image: 'delivery-review/onboarding-berry-ui-19/screenshots/11-first-identity-dark-390.png',
      image_sha256: sha(image),
      errors
    };
    fs.writeFileSync(result, JSON.stringify(evidence, null, 2) + '\n');
    console.log(JSON.stringify(evidence));
    if (errors.length) process.exitCode = 1;
  } finally {await browser.close();}
})().catch(error => {console.error(error.stack || error); process.exitCode = 1;});
