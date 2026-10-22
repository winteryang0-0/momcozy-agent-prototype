const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=pathToFileURL(path.resolve(__dirname,'../Momcozy-final.html')).href+'#/home';
const seed={records:[],profiles:{baby:'Avery',birth:'',careRole:'妈妈',momStage:'产后',momAge:'30',parity:'1',babyCount:1,babies:[{birth:'',weeks:'40'}],birthWeeks:'40'},prefs:{theme:'light',sound:false}};
const states=[],errors=[];
async function inspect(page,label){
 await page.waitForTimeout(70);
 const s=await page.evaluate(()=>{
  const visible=e=>e&&!e.closest('[hidden],.bubble.user,.chat-history-preview')&&e.getClientRects().length;
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),chinese=[];
  while(w.nextNode())if(visible(w.currentNode.parentElement)&&/[\u3400-\u9fff]/u.test(w.currentNode.nodeValue))chinese.push(w.currentNode.nodeValue.trim());
  return {route:location.hash,title:document.querySelector('#sheet-title').textContent,chinese,toast:document.querySelector('#toast').hidden?'':document.querySelector('#toast').textContent};
 });
 states.push({label,...s});console.log(label,JSON.stringify(s));
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const ctx=await browser.newContext({viewport:{width:390,height:844},locale:'en-US',timezoneId:'America/New_York'});
 await ctx.addInitScript(data=>localStorage.setItem('momcozy-home-1.0-en-US',JSON.stringify(data)),seed);
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url,{waitUntil:'load'});
  await page.locator('.preview-strip [data-action="settings"]').click();
  await page.locator('#scenario').selectOption('failure');
  await page.locator('#sheet-close').click();
  await page.locator('#assistant .main-menu-button').click();
  await page.locator('#care-sidebar [data-sidebar="record"]').click();
  await page.locator('#record-cta [data-action="record"]').click();
  await page.locator('#sheet [data-type="吸奶"]').click();
  await page.locator('#record-form [name="amount"]').fill('120');
  await page.locator('#record-form button[type="submit"]').click();
  await page.waitForTimeout(1050);
  await inspect(page,'save-failed');
  await page.locator('#sheet [data-action="save-retry"]').click();
  await page.waitForTimeout(1050);
  await inspect(page,'save-recovered');
  await page.locator('#sheet [data-action="save-done"]').click();
  await page.locator('#record-list .journal-row').click();
  await inspect(page,'saved-pumping-detail');
  await page.locator('#sheet-close').click();
  await page.locator('.preview-strip [data-action="settings"]').click();
  await page.locator('#scenario').selectOption('unknown');
  await page.locator('#sheet-close').click();
  await page.locator('#record-cta [data-action="record"]').click();
  await page.locator('#sheet [data-type="换尿布"]').click();
  await page.locator('#record-form [name="rash"][value="无"]').check();
  await page.locator('#record-form button[type="submit"]').click();
  await page.waitForTimeout(1050);
  await inspect(page,'save-unknown');
  await page.locator('#sheet [data-action="save-check"]').click();
  await inspect(page,'save-checked');
  await page.locator('#sheet-close').click();
  await page.locator('#records .back-home').click();
  await page.locator('.preview-strip [data-action="settings"]').click();
  await page.locator('#scenario').selectOption('offline');
  await page.locator('#sheet-close').click();
  await inspect(page,'home-offline');
  await page.locator('#care-shortcuts [data-care="poop"]').click();
  await inspect(page,'poop-ready');
  await page.locator('.care-task-card [data-step="capture"]').click();
  await page.waitForTimeout(400);
  await inspect(page,'poop-capture-error');
  await page.locator('.preview-strip [data-action="settings"]').click();
  await page.locator('#sheet [data-pref="reduced"]').check();
  await inspect(page,'reduced-motion-setting');
  await page.locator('#sheet-close').click();
  await page.locator('#assistant .main-menu-button').click();
  await page.locator('#care-sidebar [data-sidebar="record"]').click();
  await page.locator('#records .profile-menu-button').click();
  await inspect(page,'reduced-motion-profile-menu');
 }catch(e){errors.push(e.stack)}
 finally{if(states.some(s=>s.chinese.length))errors.push('Untranslated UI found');fs.writeFileSync(path.join(__dirname,'scenario-evidence.json'),JSON.stringify({states,errors},null,2));await ctx.close();await browser.close();console.log('errors',errors.length);if(errors.length)process.exitCode=1}
})();
