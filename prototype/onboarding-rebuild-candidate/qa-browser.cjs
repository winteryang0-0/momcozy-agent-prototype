const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = __dirname;
const candidateBundle = path.join(root, 'bundle');
const url = pathToFileURL(path.join(candidateBundle, 'index.html')).href;
const screenshots = path.join(root, 'reviews', 'screenshots');
fs.mkdirSync(screenshots, { recursive: true });
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const localDate = new Date();
const pastBirthDate = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate() - 30);
const birthDate = [pastBirthDate.getFullYear(), String(pastBirthDate.getMonth() + 1).padStart(2, '0'), String(pastBirthDate.getDate()).padStart(2, '0')].join('-');
const futureBirthDate = new Date(localDate.getFullYear() + 1, localDate.getMonth(), localDate.getDate());
const futureDate = [futureBirthDate.getFullYear(), String(futureBirthDate.getMonth() + 1).padStart(2, '0'), String(futureBirthDate.getDate()).padStart(2, '0')].join('-');
const checks = [];
const captures = [];
const errors = [];
let browserVersion = 'unknown';
let designSha256 = 'unknown';

async function shot(page, name, note, fullPage = false) {
  await page.waitForTimeout(420);
  const file = path.join(screenshots, name + '.png');
  await page.screenshot({ path: file, fullPage });
  const png = fs.readFileSync(file);
  const image = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  const dimensions = await page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    contentWidth: document.documentElement.scrollWidth,
    contentHeight: document.documentElement.scrollHeight
  }));
  captures.push({
    name, note, path: path.relative(root, file).replaceAll('\\', '/'),
    sha256: sha(file), pixels: dimensions, image, url: page.url(),
    capturedAt: new Date().toISOString(), fullPage, browserVersion, designSha256
  });
}
async function cleanPage(browser, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 390, height: 844 },
    deviceScaleFactor: 1, colorScheme: options.colorScheme || 'light'
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push('console: ' + message.text());
  });
  return { context, page };
}
async function select(page, id, value) {
  await page.locator(id).selectOption(value);
}
async function next(page) { await page.locator('.step-panel:not([hidden]) [data-step-next]').click(); }
async function pause(page) { await page.locator('.step-panel:not([hidden]) [data-step-later]').click(); }
async function errorText(page) { return page.locator('.step-panel:not([hidden]) [data-step-error]').textContent(); }
async function storageAlert(page) { return page.locator('.step-panel:not([hidden]) [data-storage-alert]'); }
async function role(page, name) { await page.locator('[data-role="' + name + '"]').click(); }
async function stage(page, name) { await page.locator('[data-stage="' + name + '"]').click(); }

(async () => {
  const browser = await chromium.launch({
    headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });
  browserVersion = browser.version();
  designSha256 = sha(path.join(root, 'design.json'));
  try {
    const { context, page } = await cleanPage(browser);
    await page.goto(url, { waitUntil: 'load' });
    assert.equal(new URL(page.url()).hash, '#/identity');
    assert.equal(await page.locator('[data-role]').count(), 5);
    assert.equal(await page.locator('.progress li.current').count(), 1);
    await shot(page, '01-identity-390', 'Fresh identity page');
    await next(page);
    assert.match(await errorText(page), /选择照护身份/);
    await shot(page, '01b-identity-required-error-390', 'Identity is required');
    checks.push('identity required');

    await page.evaluate(() => localStorage.setItem('momcozy-home-1.0', 'old-project-sentinel'));
    await role(page, '妈妈');
    await stage(page, '产后');
    await next(page);
    assert.equal(new URL(page.url()).hash, '#/details');
    assert.equal(await page.locator('#age').inputValue(), '');
    assert.equal(await page.locator('#parity').inputValue(), '');
    assert.equal(await page.locator('#baby-count').inputValue(), '');
    assert.deepEqual(await page.locator('#age option').evaluateAll(options => options.map(option => option.value).filter(Boolean).map(Number).filter(value => value < 18 || value > 50)), []);
    assert.deepEqual(await page.locator('#parity option').evaluateAll(options => options.map(option => option.value).filter(Boolean).map(Number).filter(value => value < 0 || value > 6)), []);
    await shot(page, '02-details-empty-390', 'Optional fields initially empty', true);

    await select(page, '#age', '18');
    await select(page, '#parity', '0');
    await select(page, '#baby-count', '2');
    await select(page, '#birth-weeks', '37');
    await page.locator('#birth-date').fill(birthDate);
    await page.locator('[data-baby-index="1"]').click();
    await select(page, '#birth-weeks', '50');
    await page.locator('#birth-date').fill(birthDate);
    await page.locator('#birth-date').fill(futureDate);
    await page.locator('[data-baby-index="0"]').click();
    assert.equal(await page.locator('[data-baby-index="1"]').getAttribute('aria-pressed'), 'true');
    assert.match(await errorText(page), /出生日期/);
    await shot(page, '03a-birth-date-error-390', 'Future birth date blocked');
    await page.locator('#birth-date').fill(birthDate);
    await page.reload({ waitUntil: 'load' });
    assert.equal(new URL(page.url()).hash, '#/details');
    assert.equal(await page.locator('#age').inputValue(), '18');
    assert.equal(await page.locator('#parity').inputValue(), '0');
    assert.equal(await page.locator('[data-baby-index="1"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#birth-weeks').inputValue(), '50');
    await page.locator('[data-baby-index="0"]').click();
    assert.equal(await page.locator('#birth-weeks').inputValue(), '37');
    await page.locator('[data-baby-index="1"]').click();
    await shot(page, '03-details-twins-390', 'Second baby and numeric boundaries', true);
    checks.push('optional defaults; inclusive ranges; multi-baby distinct drafts; refresh recovery');

    await page.locator('#age').evaluate(element => {
      element.add(new Option('51 岁', '51'));
      element.value = '51';
      element.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await next(page);
    assert.equal(new URL(page.url()).hash, '#/details');
    assert.match(await errorText(page), /18–50/);
    await shot(page, '03b-details-range-error-390', 'Out of range age blocked');
    await select(page, '#age', '50');
    await next(page);
    assert.equal(new URL(page.url()).hash, '#/concerns');
    await page.locator('[data-concern="宝宝为什么哭"]').click();
    await page.locator('[data-concern="情绪起伏与压力"]').click();
    await shot(page, '04-concerns-390', 'Two selected concerns');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await shot(page, '04b-concerns-bottom-390', 'Concern list bottom and footer');
    await next(page);
    assert.equal(new URL(page.url()).hash, '#/recommendations');
    assert.equal(await page.locator('.recommendation-card h3').first().textContent(), '哭声识别');
    await shot(page, '05-recommendations-390', 'Concern-driven recommendation order');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await shot(page, '05b-recommendations-bottom-390', 'Recommendation list bottom and footer');
    checks.push('invalid range rejected; concern multi-select; recommendation ordering');

    await pause(page);
    assert.equal(new URL(page.url()).hash, '#/paused');
    assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('momcozy-onboarding-rebuild-v1'))).status, 'paused');
    await page.reload({ waitUntil: 'load' });
    assert.equal(new URL(page.url()).hash, '#/paused');
    await shot(page, '06-paused-390', 'Paused flow after refresh');
    await page.locator('#resume').click();
    assert.equal(new URL(page.url()).hash, '#/recommendations');
    await next(page);
    assert.equal(new URL(page.url()).hash, '#/complete');
    const persisted = JSON.parse(await page.evaluate(() => localStorage.getItem('momcozy-onboarding-rebuild-v1')));
    assert.equal(persisted.profile.momAge, '50');
    assert.equal(persisted.profile.parity, '0');
    assert.equal(persisted.profile.babyCount, '2');
    assert.equal(persisted.profile.babies[0].weeks, '37');
    assert.equal(persisted.profile.babies[1].weeks, '50');
    assert.equal(await page.evaluate(() => localStorage.getItem('momcozy-home-1.0')), 'old-project-sentinel');
    await shot(page, '07-complete-390', 'Saved profile summary');
    await page.locator('#edit-profile').click();
    assert.equal(new URL(page.url()).hash, '#/identity');
    assert.equal(await page.locator('[data-role="妈妈"]').getAttribute('aria-pressed'), 'true');
    await next(page);
    assert.equal(new URL(page.url()).hash, '#/details');
    await page.goBack({ waitUntil: 'load' });
    assert.equal(new URL(page.url()).hash, '#/identity');
    checks.push('pause; resume; refresh; completion; edit; old-project key isolated');
    await context.close();

    const narrow = await cleanPage(browser, { viewport: { width: 360, height: 640 } });
    await narrow.page.goto(url, { waitUntil: 'load' });
    await shot(narrow.page, '08-identity-360x640', 'Narrow mobile identity');
    await role(narrow.page, '其他成员');
    assert.equal(await narrow.page.locator('[data-role="其他成员"]').getAttribute('aria-pressed'), 'true');
    await role(narrow.page, '妈妈');
    await stage(narrow.page, '孕期');
    await next(narrow.page);
    assert.equal(await narrow.page.locator('#pregnancy-fields').isVisible(), true);
    assert.equal(await narrow.page.locator('#born-fields').isVisible(), false);
    await select(narrow.page, '#fetus-count', '6');
    await select(narrow.page, '#pregnancy-weeks', '45');
    await shot(narrow.page, '09-pregnancy-360x640', 'Pregnancy branch on narrow viewport', true);
    await narrow.page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await narrow.page.waitForTimeout(100);
    const bottomGeometry = await narrow.page.evaluate(() => ({
      fieldBottom: document.querySelector('#pregnancy-weeks').getBoundingClientRect().bottom,
      footerTop: document.querySelector('.step-panel:not([hidden]) .flow-footer').getBoundingClientRect().top
    }));
    assert(bottomGeometry.fieldBottom < bottomGeometry.footerTop, 'short-screen field hidden by footer');
    await shot(narrow.page, '09b-pregnancy-bottom-360x640', 'Short screen bottom scroll and sticky footer');
    await next(narrow.page);
    assert.equal(new URL(narrow.page.url()).hash, '#/concerns');
    checks.push('pregnancy branch and 0–45 current weeks; short screen scrolling');
    await narrow.context.close();

    const before = await cleanPage(browser);
    await before.page.goto(url, { waitUntil: 'load' });
    await role(before.page, '妈妈');
    await stage(before.page, '孕前');
    await next(before.page);
    assert.equal(await before.page.locator('#baby-section').isVisible(), false);
    assert.equal(await before.page.locator('#preconception-note').isVisible(), true);
    checks.push('preconception branch hides baby fields');
    await before.context.close();

    const desktop = await cleanPage(browser, { viewport: { width: 1440, height: 900 } });
    await desktop.page.goto(url, { waitUntil: 'load' });
    await shot(desktop.page, '10-identity-desktop-1440', 'Desktop two-column composition');
    await desktop.context.close();

    const dark = await cleanPage(browser, { colorScheme: 'dark' });
    await dark.page.goto(url, { waitUntil: 'load' });
    await shot(dark.page, '11-identity-dark-390', 'System dark mode');
    await role(dark.page, '爸爸');
    await next(dark.page);
    await shot(dark.page, '12-details-dark-390', 'Dark form states', true);
    await dark.context.close();

    const reduced = await cleanPage(browser);
    await reduced.page.emulateMedia({ reducedMotion: 'reduce' });
    await reduced.page.goto(url, { waitUntil: 'load' });
    const animationDuration = await reduced.page.locator('#step-identity').evaluate(element => getComputedStyle(element).animationDuration);
    assert.match(animationDuration, /1e-05s|0\.00001s|0s/);
    checks.push('system reduced-motion preference suppresses entrance animation');
    await reduced.context.close();

    const failure = await cleanPage(browser);
    await failure.page.addInitScript(() => {
      Storage.prototype.setItem = function () { throw new Error('QuotaExceededError'); };
    });
    await failure.page.goto(url, { waitUntil: 'load' });
    assert.equal(await (await storageAlert(failure.page)).isVisible(), false);
    await role(failure.page, '爸爸');
    assert.equal(await (await storageAlert(failure.page)).isVisible(), true);
    await shot(failure.page, '13-storage-write-error-390', 'Draft storage failure warning');
    await (await storageAlert(failure.page)).locator('[data-retry-save]').click();
    assert.equal(await (await storageAlert(failure.page)).isVisible(), true);
    await next(failure.page);
    await next(failure.page);
    await next(failure.page);
    await next(failure.page);
    assert.equal(new URL(failure.page.url()).hash, '#/recommendations');
    assert.match(await errorText(failure.page), /未能保存资料/);
    await shot(failure.page, '14-finish-error-390', 'Completion blocked by storage failure');
    await pause(failure.page);
    assert.equal(new URL(failure.page.url()).hash, '#/recommendations');
    assert.match(await errorText(failure.page), /尚未保存/);
    checks.push('storage failure does not show false completion');
    await failure.context.close();

    const readFailure = await cleanPage(browser);
    await readFailure.page.addInitScript(() => {
      Storage.prototype.getItem = function () { throw new Error('SecurityError'); };
    });
    await readFailure.page.goto(url, { waitUntil: 'load' });
    assert.equal(await (await storageAlert(readFailure.page)).isVisible(), true);
    assert.match(await (await storageAlert(readFailure.page)).locator('[data-storage-message]').textContent(), /无法读取/);
    await shot(readFailure.page, '15-storage-read-error-390', 'Read failure prevents overwrite');
    await (await storageAlert(readFailure.page)).locator('[data-retry-save]').click();
    assert.equal(await (await storageAlert(readFailure.page)).isVisible(), true);
    await role(readFailure.page, '爸爸');
    await next(readFailure.page);
    await next(readFailure.page);
    await next(readFailure.page);
    await next(readFailure.page);
    assert.equal(new URL(readFailure.page.url()).hash, '#/recommendations');
    assert.match(await errorText(readFailure.page), /未能保存资料/);
    checks.push('storage read failure warns before overwrite');
    await readFailure.context.close();

    for (const capture of captures) {
      assert(capture.pixels.contentWidth <= capture.pixels.viewport.width + 1,
        'horizontal overflow in ' + capture.name);
    }
    assert.deepEqual(errors, []);
    const report = {
      status: 'pass',
      operator: 'Codex / Playwright',
      browser: 'Google Chrome',
      browserVersion,
      protocol: 'file://',
      testedAt: new Date().toISOString(),
      source: {
        designSha256,
        htmlSha256: sha(path.join(candidateBundle, 'index.html')),
        cssSha256: sha(path.join(candidateBundle, 'assets', 'styles.css')),
        jsSha256: sha(path.join(candidateBundle, 'assets', 'app.js'))
      },
      checks, captures, errors
    };
    fs.writeFileSync(path.join(root, 'reviews', 'browser-evidence.json'), JSON.stringify(report, null, 2));
    process.stdout.write(JSON.stringify({ status: report.status, checks: checks.length, captures: captures.length, errors }, null, 2) + '\n');
  } finally {
    await browser.close();
  }
})().catch(error => {
  process.stderr.write(error.stack + '\n');
  process.exitCode = 1;
});
