/* Real Chrome file:// smoke and visual capture for the R16 candidate. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname,'../..');
const screenshotDir = path.join(__dirname,'screenshots');
fs.mkdirSync(screenshotDir,{recursive:true});
const target = pathToFileURL(path.join(root,'Momcozy-final.html')).href;
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const captures=[];
const errors=[];

async function capture(page,name,note){
  await page.waitForTimeout(250);
  const file=path.join(screenshotDir,name+'.png');
  await page.screenshot({path:file});
  captures.push({name,note,path:path.relative(root,file).replaceAll('\\','/'),sha256:hash(file),pixels:page.viewportSize()});
}

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push('pageerror: '+e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
    await page.goto(target+'#/home',{waitUntil:'load'});
    await page.locator('#assistant:not([hidden])').waitFor();
    assert.equal(new URL(page.url()).hash,'#/home');
    assert.equal(await page.locator('.dock').count(),0);
    assert.equal(await page.locator('#assistant-intro:visible').count(),1);
    await capture(page,'01-home-welcome-390','new conversation home, empty local records');

    await page.locator('#assistant [data-go="records"]').click();
    await page.locator('#records:not([hidden])').waitFor();
    assert.equal(new URL(page.url()).hash,'#/records');
    assert.equal(await page.locator('#record-cta:visible').count(),1);
    await capture(page,'02-journal-empty-390','journal empty state and persistent new-record action');
    await page.locator('[data-owner="妈妈"]').click();
    await page.locator('#journal-date').fill('2026-10-19');
    await page.locator('#journal-date').dispatchEvent('change');
    await page.locator('#record-cta [data-action="record"]').click();
    assert.equal(await page.locator('#sheet[open]').count(),1);
    await page.locator('#sheet [data-type="配方奶"]').click();
    await page.locator('#record-form [name="amount"]').fill('100');
    await page.locator('#record-form button[type="submit"]').click();
    await page.locator('#sheet [data-action="save-done"]').waitFor({timeout:3000});
    await page.locator('#sheet [data-action="save-done"]').click();
    assert.equal(await page.locator('#journal-date').inputValue(),'2026-10-20');
    assert.equal(await page.locator('[data-owner="宝宝"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#record-list .journal-row').count(),1);

    await page.evaluate(()=>{
      const key='momcozy-home-1.0',old=JSON.parse(localStorage.getItem(key)||'{}');
      old.profiles={...old.profiles,baby:'Iris',birth:'2026-10-08',careRole:'妈妈',momStage:'产后'};
      old.records=[
        {id:'svisual-r1',type:'瓶喂母乳',owner:'宝宝',amount:120,time:'2026-10-20T14:40',sync:'示例',note:''},
        {id:'svisual-r2',type:'换尿布',owner:'宝宝',kind:'嘘嘘',rash:'无',time:'2026-10-20T13:50',sync:'示例',note:''},
        {id:'svisual-r3',type:'配方奶',owner:'宝宝',amount:90,time:'2026-10-20T11:40',sync:'示例',note:''},
        {id:'svisual-r4',type:'亲喂',owner:'宝宝',side:'左侧',duration:15,time:'2026-10-20T09:30',sync:'示例',note:''},
        {id:'svisual-r5',type:'吸奶',owner:'妈妈',amount:110,time:'2026-10-20T13:00',sync:'示例',note:''}
      ];
      localStorage.setItem(key,JSON.stringify(old));
    });
    await page.reload({waitUntil:'load'});
    await page.locator('#records:not([hidden])').waitFor();
    assert.equal(await page.locator('#record-list .journal-row').count(),4);
    await capture(page,'03-journal-populated-390','isolated visual fixture with four baby events');
    await page.locator('#scroll').evaluate(el=>el.scrollTop=220);
    await capture(page,'03b-journal-scrolled-390','same fixture after scrolling; new-record action remains visible');
    await page.locator('#record-list .journal-row').first().click();
    assert.equal(await page.locator('#sheet[open]').count(),1);
    await page.locator('#sheet-close').click();
    await page.locator('[data-action="record-filter"]').click();
    await page.locator('[data-record-filter="diaper"]').click();
    assert.equal(await page.locator('#record-list .journal-row').count(),1);
    await page.locator('[data-owner="妈妈"]').click();
    assert.equal(await page.locator('#record-list .journal-row').count(),1);
    await capture(page,'04-journal-mom-390','owner switch retains journal composition');
    await page.locator('#records [data-go="home"]').click();
    assert.equal(new URL(page.url()).hash,'#/home');
    await page.locator('#chat-message').fill('今天有点累');
    await page.locator('#send-message').click();
    await page.locator('#conversation .assistant-message').first().waitFor();
    await page.waitForTimeout(820);
    assert.equal(await page.locator('#conversation .assistant-message').count()>=1,true);
    assert.equal(await page.locator('#conversation .bubble.user').count()>=1,true);
    await capture(page,'05-home-conversation-390','home conversation state after a local demo reply');
    await page.goto(target+'#/assistant',{waitUntil:'load'});
    await page.waitForFunction(()=>location.hash==='#/home');
    assert.equal(new URL(page.url()).hash,'#/home');
    await page.locator('#assistant [data-go="records"]').click();
    await page.locator('#records:not([hidden])').waitFor();
    await page.locator('#records [data-action="profile-menu"]').click();
    await page.locator('#sheet .menu-row[data-action="settings"]').click();
    await page.locator('#sheet [data-theme="dark"]').click();
    await page.locator('#sheet-close').click();
    await page.locator('#records [data-go="home"]').click();
    assert.equal(await page.locator('body[data-theme="dark"]').count(),1);
    await capture(page,'06-home-dark-390','dark mode on canonical home route');
    await page.setViewportSize({width:360,height:640});
    await page.locator('#assistant [data-go="records"]').click();
    await page.locator('#records [data-action="profile-menu"]').click();
    await page.locator('#sheet .menu-row[data-action="new-chat"]').click();
    await capture(page,'07-home-welcome-360','narrow and short viewport, new conversation');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    assert.equal(overflow,false,'horizontal document overflow at 360px');

    const narrowContext=await browser.newContext({viewport:{width:360,height:640},deviceScaleFactor:1});
    const narrowPage=await narrowContext.newPage();
    narrowPage.on('pageerror',e=>errors.push('pageerror (360): '+e.message));
    narrowPage.on('console',m=>{if(m.type()==='error')errors.push('console (360): '+m.text());});
    await narrowPage.goto(target+'#/home',{waitUntil:'load'});
    await narrowPage.locator('#assistant [data-go="records"]').click();
    await narrowPage.locator('#records:not([hidden])').waitFor();
    await capture(narrowPage,'08-journal-empty-360','narrow and short viewport, light journal empty state');
    assert.equal(await narrowPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'journal overflow at 360px');
    const narrowScroll=await narrowPage.locator('#scroll').evaluate(el=>{el.scrollTop=el.scrollHeight;return el.scrollTop;});
    assert.equal(narrowScroll>0,true,'journal cannot scroll past the fixed new-record action at 360px');
    await capture(narrowPage,'08b-journal-empty-360-scrolled','short viewport after scrolling; empty-state text remains available above new-record action');
    await narrowContext.close();

    const desktopContext=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
    const desktopPage=await desktopContext.newPage();
    desktopPage.on('pageerror',e=>errors.push('pageerror (desktop): '+e.message));
    desktopPage.on('console',m=>{if(m.type()==='error')errors.push('console (desktop): '+m.text());});
    await desktopPage.goto(target+'#/home',{waitUntil:'load'});
    await desktopPage.locator('#assistant:not([hidden])').waitFor();
    await capture(desktopPage,'09-home-welcome-desktop','desktop viewport, light home welcome state');
    await desktopPage.locator('#assistant [data-go="records"]').click();
    await desktopPage.locator('#records:not([hidden])').waitFor();
    await capture(desktopPage,'10-journal-empty-desktop','desktop viewport, light journal empty state');
    assert.equal(await desktopPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'journal overflow at desktop width');
    await desktopContext.close();
    assert.deepEqual(errors,[],'browser errors');

    const evidence={revision:'conversation-home-journal-16',material_sha256:hash(path.join(root,'Momcozy-final.html')),browser:'Chrome '+browser.version(),protocol:'file://',captured_at:new Date().toISOString(),operator:'Playwright local Chrome headless',checks:['canonical home route and legacy alias','no Dock','home record icon → journal','journal profile menu → settings and new chat','persistent new record save and selected-date recovery','journal fixture, detail, filter and owner switch','home chat reply','dark mode','360 px and 1280 px horizontal overflow','no page or console errors'],screenshots:captures,errors};
    fs.writeFileSync(path.join(__dirname,'browser-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
    console.log(JSON.stringify({browser:evidence.browser,checks:evidence.checks.length,screenshots:captures.length,errors,material_sha256:evidence.material_sha256},null,2));
    await context.close();
  }finally{await browser.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
