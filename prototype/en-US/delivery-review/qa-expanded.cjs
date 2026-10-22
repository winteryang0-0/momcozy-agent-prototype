const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const url = pathToFileURL(path.join(root, 'Momcozy-final.html')).href + '#/home';
const seed = {
  records: [],
  profiles: {
    baby: 'Avery', birth: '', careRole: '妈妈', momStage: '产后',
    momAge: '30', parity: '1', babyCount: 1,
    babies: [{ birth: '', weeks: '40' }], birthWeeks: '40', focus: ''
  },
  prefs: { theme: 'light', sound: false, reduced: false }
};
const errors = [], states = [];
async function check(page, label) {
  await page.waitForTimeout(80);
  const state = await page.evaluate(() => {
    const visible = el => el && !el.closest('[hidden],.bubble.user,.chat-history-preview,.delete-chat-title') && getComputedStyle(el).display !== 'none' && el.getClientRects().length;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), chinese = [];
    while (walker.nextNode()) if (visible(walker.currentNode.parentElement) && /[\u3400-\u9fff]/u.test(walker.currentNode.nodeValue)) chinese.push(walker.currentNode.nodeValue.trim().slice(0,180));
    const attrs = [];
    for (const el of document.querySelectorAll('[aria-label],[aria-valuetext],[placeholder],[title],[alt]')) {
      if (!visible(el)) continue;
      for (const a of ['aria-label','aria-valuetext','placeholder','title','alt']) {
        const v = el.getAttribute(a);
        if (v && /[\u3400-\u9fff]/u.test(v)) attrs.push(a + ': ' + v);
      }
    }
    return {route:location.hash,title:document.querySelector('#sheet-title').textContent,chinese,attrs};
  });
  states.push({label,...state});
  console.log(label, 'chinese=' + state.chinese.length, 'attrs=' + state.attrs.length);
}

(async () => {
  const browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context = await browser.newContext({viewport:{width:390,height:844},locale:'en-US',timezoneId:'America/New_York'});
  await context.addInitScript(data => localStorage.setItem('momcozy-home-1.0-en-US', JSON.stringify(data)), seed);
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(url,{waitUntil:'load'});
    const open = async (selector,label) => {await page.locator(selector).click();await check(page,label);};
    const close = async () => page.locator('#sheet-close').click();
    await open('#assistant .main-menu-button','care-menu');
    await open('#care-sidebar [data-sidebar="record"]','journal');
    await open('#records .profile-menu-button','profile-menu');
    for (const [selector,label] of [
      ['[data-action="baby-profile"]','baby-profile'],
      ['[data-action="devices"]','devices'],
      ['[data-action="sync"]','sync'],
      ['[data-action="chat-history"]','history'],
      ['[data-action="settings"]','settings']
    ]) {
      await open('#sheet '+selector,label);
      if(label==='devices'){
        await open('#sheet [data-action="device-history"]','device-history');
      }
      if(label==='history'){
        await open('#sheet [data-action="new-chat"]','new-chat');
        await page.locator('#assistant .main-menu-button').click();
  await page.locator('#care-sidebar [data-sidebar="record"]').click();
        await page.locator('#records .profile-menu-button').click();
        continue;
      }
      await close();
      await page.locator('#records .profile-menu-button').click();
    }
    await close();
    await open('#records .journal-timeline-heading [data-action="record-filter"]','journal-filter');
    await close();
    await open('#record-cta [data-action="record"]','record-picker');
    for (const type of ['亲喂','瓶喂母乳','配方奶','换尿布','吸奶']) {
      await open('#sheet [data-type="'+type+'"]','record-form-'+type);
      await open('#sheet [data-action="back-types"]','record-picker-return');
    }
    await close();
    await page.locator('#records .back-home').click();
    await open('#assistant [data-action="chat-more"]','chat-more');
    await open('#sheet [data-action="camera"]','attachment-camera');
    await close();
    await open('#assistant [data-action="chat-more"]','chat-more-again');
    await open('#sheet [data-action="upload"]','attachment-upload');
    await close();
    await open('#daily-advice .advice-dot[data-advice-index="1"]','advice-second-tip');
    await open('#daily-advice .advice-dot[data-advice-index="2"]','advice-third-tip');
    await open('#daily-advice .advice-dot[data-advice-index="0"]','advice-first-tip');
    await open('#care-shortcuts [data-care="record"]','inline-record-picker');
    await open('#assistant [data-inline-type="亲喂"]','inline-record-form');
    await page.locator('#inline-record-form input[name="duration"]').fill('12');
    await page.locator('#inline-record-form button[type="submit"]').click();
    await page.waitForTimeout(1100);
    await check(page,'inline-record-saved');
    await page.locator('#assistant .main-menu-button').click();
  await page.locator('#care-sidebar [data-sidebar="record"]').click();
    await check(page,'journal-with-record');
    await open('#record-list .journal-row','record-detail');
    await close();
    await open('#records .record-more summary','insight-links');
    for (const type of ['喂养与睡眠','生长发育']) {
      await page.locator('#record-links [data-detail="'+type+'"]').evaluate(el => el.click());
      await check(page,'detail-'+type);
      await close();
      await page.locator('.record-more').evaluate(el => el.open = true);
    }
    await page.locator('[data-owner="妈妈"]').click();
    await check(page,'mom-journal');
    for (const type of ['奶量趋势','身体与状态']) {
      await page.locator('#record-links [data-detail="'+type+'"]').evaluate(el => el.click());
      await check(page,'detail-'+type);
      await close();
      await page.locator('.record-more').evaluate(el => el.open = true);
    }
  } catch (e) {errors.push(e.stack)}
  finally {
    if(states.some(s=>s.chinese.length||s.attrs.length))errors.push('Untranslated UI found');
    fs.writeFileSync(path.join(__dirname,'expanded-evidence.json'),JSON.stringify({states,errors},null,2));
    await context.close();await browser.close();
    console.log('errors='+errors.length);
    if(errors.length)process.exitCode=1;
  }
})();
