const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '../..');
const html = path.join(root, 'Momcozy-final.html');
const modular = path.join(root, 'index.html');
const url = pathToFileURL(html).href + '#/home';
const key = 'momcozy-home-1.0';
const shots = path.join(__dirname, 'screenshots');
fs.mkdirSync(shots, { recursive: true });
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const captures = [];
const checks = [];
const errors = [];

async function capture(page, name, note) {
  await page.waitForTimeout(180);
  const file = path.join(shots, name + '.png');
  await page.screenshot({ path: file });
  const data = fs.readFileSync(file);
  captures.push({
    name, note,
    path: path.relative(root, file).replaceAll('\\', '/'),
    sha256: sha(file),
    material_sha256: sha(html),
    viewport: page.viewportSize(),
    image_pixels: { width: data.readUInt32BE(16), height: data.readUInt32BE(20) },
    url: page.url(),
    captured_at: new Date().toISOString(),
    fullPage: false
  });
}

async function open(browser, viewport = { width: 390, height: 844 }, seed = null, onboarding = null, target = url) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, timezoneId: 'Asia/Shanghai' });
  if (seed || onboarding) {
    await context.addInitScript(data => {
      if (sessionStorage.getItem('__r21_seeded')) return;
      if (data.seed) localStorage.setItem('momcozy-home-1.0', JSON.stringify(data.seed));
      if (data.onboarding) localStorage.setItem('momcozy-home-1.0-onboarding', JSON.stringify(data.onboarding));
      sessionStorage.setItem('__r21_seeded', '1');
    }, { seed, onboarding });
  }
  const page = await context.newPage();
  page.on('pageerror', error => errors.push('pageerror: ' + error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + message.text()); });
  await page.goto(target, { waitUntil: 'load' });
  return { context, page };
}

async function selectWheel(page, name, value) {
  const wheel = page.locator('#onboard-' + name);
  assert.equal(await wheel.count(), 1, 'wheel missing: ' + name);
  await wheel.evaluate((node, selected) => {
    const options = [...node.querySelectorAll('.wheel-option')];
    const index = options.findIndex(item => item.dataset.wheelValue === selected && item.dataset.wheelInvalid !== 'true');
    if (index < 0) throw new Error('wheel option missing: ' + selected);
    node.scrollTop = index * 26;
    node.dispatchEvent(new Event('scroll', { bubbles: true }));
  }, String(value));
  await page.waitForFunction(({ name, value }) => document.querySelector('#onboarding-form [name="' + name + '"]')?.value === value, { name, value: String(value) });
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#onboarding-form [name="' + name + '"]').inputValue(), String(value));
}

async function menu(page, action) {
  if (new URL(page.url()).hash !== '#/records') await page.locator('#assistant .main-menu-button').click();
  await page.locator('#records .profile-menu-button').click();
  await page.locator('#sheet [data-action="' + action + '"]').click();
}

async function state(page) {
  return page.evaluate(keyName => JSON.parse(localStorage.getItem(keyName)), key);
}

function oldProfile() {
  return {
    records: [],
    profiles: {
      baby: '小满', birth: '', careRole: '妈妈', momStage: '产后', momAge: 17, parity: 7,
      babyCount: 2, babies: [{ birth: '', weeks: 36 }, { birth: '', weeks: 51 }],
      birthWeeks: 36, focus: ''
    },
    prefs: { theme: 'light', sound: false }
  };
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });
  try {
    const first = await open(browser);
    const page = first.page;
    assert.equal(new URL(page.url()).hash, '#/onboarding');
    await page.locator('[data-onboarding-choice=role][data-choice-index="0"]').click();
    await page.locator('[data-onboarding-choice=stage][data-choice-index="2"]').click();
    await page.locator('#onboarding-next').click();
    assert.equal(await page.locator('#onboarding-title').textContent(), '补充一点照护背景');
    const options = name => page.locator('#onboard-' + name + ' .wheel-option').evaluateAll(nodes => nodes.map(node => node.dataset.wheelValue));
    assert.deepEqual(await options('age'), ['', ...Array.from({ length: 33 }, (_, i) => String(i + 18))]);
    assert.deepEqual(await options('parity'), ['', ...Array.from({ length: 7 }, (_, i) => String(i))]);
    assert.deepEqual(await options('baby-0-weeks'), ['', ...Array.from({ length: 14 }, (_, i) => String(i + 37))]);
    await capture(page, '01-onboarding-empty-390', 'Optional wheels and berry white space');
    checks.push('first entry uses exact 18–50, 0–6, and 37–50 options, with an empty option');

    await selectWheel(page, 'age', '18');
    await selectWheel(page, 'parity', '0');
    await selectWheel(page, 'baby-0-weeks', '37');
    await capture(page, '02-onboarding-lower-bounds-390', 'All three lower bounds selected');
    await page.locator('#onboarding-next').click();
    assert.equal(await page.locator('#onboarding-title').textContent(), '把关心的事放在前面');
    await page.locator('#onboarding-back').click();
    assert.equal(await page.locator('#onboard-parity').getAttribute('aria-valuetext'), '0次');
    checks.push('lower bounds accepted and parity zero persists when moving back');

    await selectWheel(page, 'age', '');
    await selectWheel(page, 'parity', '');
    await selectWheel(page, 'baby-0-weeks', '');
    await page.locator('#onboarding-next').click();
    assert.equal(await page.locator('#onboarding-title').textContent(), '把关心的事放在前面');
    await page.locator('#onboarding-back').click();
    checks.push('all three fields can remain empty during onboarding');

    await selectWheel(page, 'age', '50');
    await selectWheel(page, 'parity', '6');
    await selectWheel(page, 'babyCount', '2');
    await page.locator('[data-onboarding-baby="0"]').click();
    await selectWheel(page, 'baby-0-weeks', '37');
    await page.locator('[data-onboarding-baby="1"]').click();
    await selectWheel(page, 'baby-1-weeks', '50');
    await capture(page, '03-onboarding-upper-multi-390', 'Upper bounds and second baby');
    await page.locator('#onboarding-next').click();
    assert.equal(await page.locator('#onboarding-title').textContent(), '把关心的事放在前面');
    await page.locator('#onboarding-next').click();
    await page.locator('#onboarding-next').click();
    assert.equal(new URL(page.url()).hash, '#/home');
    let saved = await state(page);
    assert.equal(saved.profiles.momAge, '50');
    assert.equal(saved.profiles.parity, '6');
    assert.deepEqual(saved.profiles.babies.map(baby => baby.weeks), ['37', '50']);
    await page.reload({ waitUntil: 'load' });
    assert.equal(new URL(page.url()).hash, '#/home');
    checks.push('upper bounds, two baby values, completion, and refresh persistence');

    await menu(page, 'mom-profile');
    assert.equal(await page.locator('#profile-form [name=momAge]').inputValue(), '50');
    assert.equal(await page.locator('#profile-form [name=parity]').inputValue(), '6');
    await capture(page, '04-mom-profile-390', 'Mother quick edit shows both bounded fields');
    await page.locator('#profile-form [name=momAge]').fill('17');
    await page.locator('#profile-form button[type=submit]').click();
    assert.match(await page.locator('#profile-error').textContent(), /18–50/);
    assert.equal(await page.locator('#profile-form [name=momAge]').getAttribute('aria-invalid'), 'true');
    await capture(page, '05-mom-invalid-390', 'Out of range age gives inline and form error');
    assert.equal((await state(page)).profiles.momAge, '50');
    await page.locator('#profile-form [name=momAge]').fill('18.5');
    await page.locator('#profile-form button[type=submit]').click();
    assert.match(await page.locator('#profile-error').textContent(), /18–50/);
    await page.locator('#profile-form [name=momAge]').fill('18');
    await page.locator('#profile-form [name=parity]').fill('7');
    await page.locator('#profile-form button[type=submit]').click();
    assert.match(await page.locator('#profile-error').textContent(), /0–6/);
    await page.locator('#profile-form [name=parity]').fill('0');
    await page.locator('#profile-form button[type=submit]').click();
    saved = await state(page);
    assert.equal(saved.profiles.momAge, '18');
    assert.equal(saved.profiles.parity, '0');
    checks.push('mother quick edit rejects 17, 18.5, and 7; saves 18 and 0');

    await menu(page, 'baby-profile');
    assert.equal(await page.locator('#profile-form [name=birthWeeks]').inputValue(), '37');
    await capture(page, '06-baby-profile-390', 'Baby quick edit includes birth gestation');
    await page.locator('#profile-form [name=birthWeeks]').fill('36');
    await page.locator('#profile-form button[type=submit]').click();
    assert.match(await page.locator('#profile-error').textContent(), /37–50/);
    assert.equal((await state(page)).profiles.babies[0].weeks, '37');
    await capture(page, '07-baby-invalid-390', 'Out of range birth gestation blocked');
    await page.locator('#profile-form [name=birthWeeks]').fill('51');
    await page.locator('#profile-form button[type=submit]').click();
    assert.match(await page.locator('#profile-error').textContent(), /37–50/);
    await page.locator('#profile-form [name=birthWeeks]').fill('50');
    await page.locator('#profile-form button[type=submit]').click();
    saved = await state(page);
    assert.deepEqual(saved.profiles.babies.map(baby => baby.weeks), ['50', '50']);
    await menu(page, 'baby-profile');
    await page.locator('#profile-form [name=birthWeeks]').fill('');
    await page.locator('#profile-form button[type=submit]').click();
    saved = await state(page);
    assert.deepEqual(saved.profiles.babies.map(baby => baby.weeks), ['', '50']);
    checks.push('baby quick edit rejects 36 and 51; saves 50 or blank without changing baby 2');

    await menu(page, 'mom-profile');
    await page.locator('#profile-form [name=momAge]').fill('');
    await page.locator('#profile-form [name=parity]').fill('');
    await page.locator('#profile-form button[type=submit]').click();
    saved = await state(page);
    assert.equal(saved.profiles.momAge, '');
    assert.equal(saved.profiles.parity, '');
    await page.reload({ waitUntil: 'load' });
    assert.equal((await state(page)).profiles.parity, '');
    checks.push('mother quick edit accepts blank and refresh keeps the cleared values');
    await first.context.close();

    const old = await open(browser, { width: 390, height: 844 }, oldProfile());
    await menu(old.page, 'onboarding');
    await old.page.locator('#onboarding-next').click();
    assert.match(await old.page.locator('#onboard-age-warning').textContent(), /原值 17/);
    assert.match(await old.page.locator('#onboard-parity-warning').textContent(), /原值 7/);
    assert.match(await old.page.locator('#onboard-baby-0-weeks-warning').textContent(), /原值 36/);
    await capture(old.page, '08-legacy-onboarding-390', 'Existing out of range values remain visible');
    await old.page.locator('#onboarding-next').click();
    assert.match(await old.page.locator('#onboarding-error').textContent(), /妈妈年龄仅支持 18–50/);
    assert.equal((await state(old.page)).profiles.momAge, 17);
    await selectWheel(old.page, 'age', '18');
    await old.page.locator('#onboarding-next').click();
    assert.match(await old.page.locator('#onboarding-error').textContent(), /已分娩次数仅支持 0–6/);
    await selectWheel(old.page, 'parity', '6');
    await old.page.locator('#onboarding-next').click();
    assert.match(await old.page.locator('#onboarding-error').textContent(), /宝宝 1 出生孕周仅支持 37–50/);
    await selectWheel(old.page, 'baby-0-weeks', '37');
    await old.page.locator('#onboarding-next').click();
    assert.match(await old.page.locator('#onboarding-error').textContent(), /宝宝 2 出生孕周仅支持 37–50/);
    assert.equal(await old.page.locator('[data-onboarding-baby="1"]').getAttribute('aria-pressed'), 'true');
    await capture(old.page, '09-legacy-baby-2-390', 'Second baby is identified when invalid');
    await selectWheel(old.page, 'baby-1-weeks', '50');
    await old.page.locator('#onboarding-next').click();
    assert.equal(await old.page.locator('#onboarding-title').textContent(), '把关心的事放在前面');
    await old.page.locator('[data-action=onboarding-later]').click();
    assert.equal((await state(old.page)).profiles.momAge, 17);
    checks.push('legacy onboarding retains old values, blocks each invalid field, finds baby 2, and cancel does not overwrite profile');
    await old.context.close();

    const oldQuick = await open(browser, { width: 390, height: 844 }, oldProfile());
    await menu(oldQuick.page, 'mom-profile');
    assert.match(await oldQuick.page.locator('#profile-momAge-hint').textContent(), /原值 17/);
    assert.match(await oldQuick.page.locator('#profile-parity-hint').textContent(), /原值 7/);
    await oldQuick.page.locator('#profile-form button[type=submit]').click();
    assert.match(await oldQuick.page.locator('#profile-error').textContent(), /18–50/);
    await capture(oldQuick.page, '10-legacy-mom-profile-390', 'Quick edit keeps old values and requires correction');
    await oldQuick.page.locator('#profile-form [name=momAge]').fill('50');
    await oldQuick.page.locator('#profile-form [name=parity]').fill('6');
    await oldQuick.page.locator('#profile-form button[type=submit]').click();
    await menu(oldQuick.page, 'baby-profile');
    assert.match(await oldQuick.page.locator('#profile-birthWeeks-hint').textContent(), /原值 36/);
    await oldQuick.page.locator('#profile-form button[type=submit]').click();
    assert.match(await oldQuick.page.locator('#profile-error').textContent(), /37–50/);
    await oldQuick.page.locator('#profile-form [name=birthWeeks]').fill('37');
    await oldQuick.page.locator('#profile-form button[type=submit]').click();
    saved = await state(oldQuick.page);
    assert.equal(saved.profiles.babies[0].weeks, '37');
    assert.equal(saved.profiles.babies[1].weeks, 51);
    checks.push('legacy quick edit warns and rejects old values, then updates only the edited fields');
    await oldQuick.context.close();

    const pausedProfile = {
      records: [], profiles: {
        baby: '小满', birth: '', careRole: '妈妈', momStage: '产后',
        momAge: '30', parity: '1', babyCount: 1,
        babies: [{ birth: '', weeks: '40' }], birthWeeks: '40', focus: ''
      }, prefs: { theme: 'light', sound: false }
    };
    const paused = { status: 'paused', step: 1, draft: {
      role: '妈妈', stage: '产后', age: '30', parity: '1', pregnancyWeeks: '',
      babyCount: '1', babies: [{ birth: '', weeks: '40' }], concerns: [], omitted: {}
    }};
    const sync = await open(browser, { width: 390, height: 844 }, pausedProfile, paused);
    await menu(sync.page, 'mom-profile');
    await sync.page.locator('#profile-form [name=momAge]').fill('50');
    await sync.page.locator('#profile-form [name=parity]').fill('0');
    await sync.page.locator('#profile-form button[type=submit]').click();
    await menu(sync.page, 'baby-profile');
    await sync.page.locator('#profile-form [name=birthWeeks]').fill('37');
    await sync.page.locator('#profile-form button[type=submit]').click();
    const resumed = await sync.page.evaluate(() => JSON.parse(localStorage.getItem('momcozy-home-1.0-onboarding')));
    assert.equal(resumed.draft.age, '50');
    assert.equal(resumed.draft.parity, '0');
    assert.equal(resumed.draft.babies[0].weeks, '37');
    await sync.page.reload({ waitUntil: 'load' });
    await menu(sync.page, 'onboarding');
    assert.equal(await sync.page.locator('#onboarding-form [name=age]').inputValue(), '50');
    assert.equal(await sync.page.locator('#onboarding-form [name=parity]').inputValue(), '0');
    assert.equal(await sync.page.locator('#onboarding-form [name="baby-0-weeks"]').inputValue(), '37');
    checks.push('quick edit synchronizes a paused full-profile draft and survives refresh');
    await sync.context.close();

    const short = await open(browser, { width: 360, height: 640 }, {
      records: [], profiles: {
        baby: '小满', birth: '', careRole: '妈妈', momStage: '产后',
        momAge: '50', parity: '6', babyCount: 1,
        babies: [{ birth: '', weeks: '50' }], birthWeeks: '50', focus: ''
      }, prefs: { theme: 'dark', sound: false }
    });
    await menu(short.page, 'mom-profile');
    await capture(short.page, '11-mom-profile-dark-360', 'Short dark quick edit');
    assert.equal(await short.page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const shortSave = short.page.locator('#profile-form button[type=submit]');
    await shortSave.scrollIntoViewIfNeeded();
    const reach = await short.page.evaluate(() => {
      const button = document.querySelector('#profile-form button[type=submit]').getBoundingClientRect();
      const body = document.querySelector('#sheet-body').getBoundingClientRect();
      return { top: button.top, bottom: button.bottom, bodyTop: body.top, bodyBottom: body.bottom };
    });
    assert.ok(reach.top >= reach.bodyTop && reach.bottom <= reach.bodyBottom, JSON.stringify(reach));
    await capture(short.page, '11b-mom-save-visible-dark-360', 'Save remains reachable after sheet scroll');
    await short.page.locator('#sheet-close').click();
    await menu(short.page, 'onboarding');
    await short.page.locator('#onboarding-next').click();
    await capture(short.page, '12-onboarding-dark-360', 'Short dark entry with upper bounds');
    assert.equal(await short.page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    checks.push('360×640 dark entry and edit keep fields and save action reachable without horizontal overflow');
    await short.context.close();

    const pregnancy = await open(browser);
    await pregnancy.page.locator('[data-onboarding-choice=role][data-choice-index="0"]').click();
    await pregnancy.page.locator('[data-onboarding-choice=stage][data-choice-index="1"]').click();
    await pregnancy.page.locator('#onboarding-next').click();
    assert.deepEqual(await pregnancy.page.locator('#onboard-pregnancyWeeks .wheel-option').evaluateAll(nodes => nodes.map(node => node.dataset.wheelValue)), ['', ...Array.from({ length: 46 }, (_, i) => String(i))]);
    assert.equal(await pregnancy.page.locator('#onboard-baby-0-weeks').count(), 0);
    checks.push('pregnancy current-week field retains its existing 0–45 range');
    await pregnancy.context.close();

    const modularView = await open(browser, { width: 390, height: 844 }, null, null, pathToFileURL(modular).href + '#/home');
    await modularView.page.locator('[data-onboarding-choice=role][data-choice-index="0"]').click();
    await modularView.page.locator('[data-onboarding-choice=stage][data-choice-index="2"]').click();
    await modularView.page.locator('#onboarding-next').click();
    assert.equal(await modularView.page.locator('#onboard-age .wheel-option[data-wheel-value="50"]').count(), 1);
    checks.push('modular index.html also works from file:// with the updated ranges');
    await modularView.context.close();

    assert.deepEqual(errors, []);
    const evidence = {
      revision: 'profile-field-ranges-21',
      material_sha256: sha(html),
      modular_sha256: sha(modular),
      browser: 'Chrome ' + browser.version(),
      protocol: 'file://',
      operator: 'Playwright Chrome headless',
      captured_at: new Date().toISOString(),
      checks, screenshots: captures, errors
    };
    fs.writeFileSync(path.join(__dirname, 'browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
    console.log(JSON.stringify({ material_sha256: evidence.material_sha256, checks: checks.length, screenshots: captures.length, errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
