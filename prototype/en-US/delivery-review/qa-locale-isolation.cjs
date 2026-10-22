const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const html = path.resolve(__dirname, '../Momcozy-final.html');
const evidenceFile = path.join(__dirname, 'locale-isolation-evidence.json');
const evidence = {
  materialSha256: crypto.createHash('sha256').update(fs.readFileSync(html)).digest('hex'),
  capturedAt: new Date().toISOString(),
  locale: 'en-US',
  timezone: 'America/Los_Angeles',
  checks: [],
  errors: []
};

async function run() {
  const browser = await chromium.launch({headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context = await browser.newContext({viewport: {width: 390, height: 844}, locale: evidence.locale, timezoneId: evidence.timezone});
  await context.addInitScript(() => {
    if (sessionStorage.getItem('momcozy-locale-qa-seeded')) return;
    sessionStorage.setItem('momcozy-locale-qa-seeded', '1');
    const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const key = d => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
    const stamp = key(date) + 'T' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    window.__localeQa = {
      date: key(date),
      time: new Intl.DateTimeFormat('en-US', {hour: 'numeric', minute: '2-digit'}).format(date),
      dateTime: new Intl.DateTimeFormat('en-US', {month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'}).format(date),
      todayLabel: new Intl.DateTimeFormat('en-US', {month: 'numeric', day: 'numeric'}).format(new Date())
    };
    localStorage.setItem('momcozy-home-1.0', 'Chinese prototype marker');
    localStorage.setItem('momcozy-home-1.0-conversations', 'Chinese conversation marker');
    localStorage.setItem('momcozy-home-1.0-onboarding', 'Chinese onboarding marker');
    localStorage.setItem('momcozy-home-1.0-en-US', JSON.stringify({
      records: [
        {id: 'locale-bottle', type: '瓶喂母乳', owner: '宝宝', amount: 90, time: stamp, sync: '待同步', note: ''},
        {id: 'locale-pump', type: '吸奶', owner: '妈妈', amount: 120, time: stamp, sync: '待同步', note: ''}
      ],
      profiles: {baby: 'Avery', careRole: '爸爸', momStage: '产后', babies: [{birth: '', weeks: '40'}]},
      prefs: {theme: 'light', sound: false}
    }));
  });
  const page = await context.newPage();
  page.on('pageerror', e => evidence.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') evidence.errors.push(m.text()); });
  try {
    await page.goto(pathToFileURL(html).href + '#/home', {waitUntil: 'load'});
    const expected = await page.evaluate(() => window.__localeQa);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en-US');
    assert.match(await page.locator('#assistant-context').innerText(), /you and Avery/);
    evidence.checks.push('HTML language is en-US');

    await page.locator('#assistant .sound-button').click();
    assert.equal(await page.evaluate(() => localStorage.getItem('momcozy-home-1.0')), 'Chinese prototype marker');
    assert.equal(await page.evaluate(() => localStorage.getItem('momcozy-home-1.0-conversations')), 'Chinese conversation marker');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('momcozy-home-1.0-en-US')).prefs.sound), true);
    evidence.checks.push('English settings do not alter Chinese storage');

    await page.locator('#assistant .main-menu-button').click();
    await page.locator('#care-sidebar [data-sidebar="record"]').click();
    await page.locator('#journal-date').fill(expected.date);
    assert.equal(await page.locator('#record-list .journal-row time').innerText(), expected.time);
    assert.match(await page.locator('#record-summary').innerText(), new RegExp(expected.time.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    evidence.checks.push('Care Journal displays the local 12-hour time');

    await page.locator('#record-list .journal-row').click();
    assert.match(await page.locator('#sheet-body .sheet-description').innerText(), new RegExp(expected.dateTime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await page.locator('#sheet-close').click();
    evidence.checks.push('Entry details display a local English date and time');

    await page.locator('#records [data-owner="妈妈"]').click();
    await page.locator('.record-more').evaluate(el => { el.open = true; });
    await page.locator('#record-links [data-detail="奶量趋势"]').evaluate(el => el.click());
    assert.equal(await page.locator('#sheet-body .trend-labels span').last().innerText(), expected.todayLabel);
    assert.match(await page.locator('#sheet-body .trend-bars').innerText(), /120/);
    evidence.checks.push('Pumping trend uses browser-local calendar dates');
    assert.equal(await page.evaluate(() => calendarDayNumber('2026-03-09') - calendarDayNumber('2026-03-08')), 1);
    evidence.checks.push('Calendar day count stays correct across daylight saving time');
    await page.locator('#sheet-close').click();
    await page.locator('.preview-strip [data-action="settings"]').click();
    await page.locator('#sheet [data-action="reset-confirm"]').click();
    await page.locator('#sheet [data-action="reset"]').click();
    await page.waitForLoadState('load');
    assert.deepEqual(await page.evaluate(() => [
      localStorage.getItem('momcozy-home-1.0'),
      localStorage.getItem('momcozy-home-1.0-conversations'),
      localStorage.getItem('momcozy-home-1.0-onboarding')
    ]), ['Chinese prototype marker', 'Chinese conversation marker', 'Chinese onboarding marker']);
    const englishAfterReset = await page.evaluate(() => JSON.parse(localStorage.getItem('momcozy-home-1.0-en-US')));
    assert.deepEqual(englishAfterReset.records, []);
    assert.equal(englishAfterReset.profiles.baby, 'Baby');
    evidence.checks.push('Reset clears English entries and preserves all Chinese storage keys');
    assert.deepEqual(evidence.errors, []);
  } catch (error) {
    evidence.errors.push(error.stack || String(error));
  } finally {
    fs.writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));
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
