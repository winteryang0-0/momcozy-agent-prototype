const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=pathToFileURL(path.resolve(__dirname,'../Momcozy-final.html')).href+'#/home';
const checks=[], errors=[];
const seed={records:[],profiles:{baby:'Avery',birth:'',careRole:'妈妈',momStage:'产后',momAge:'30',parity:'1',babyCount:1,babies:[{birth:'',weeks:'40'}],birthWeeks:'40'},prefs:{theme:'light',sound:false}};
async function chinese(page){
 return page.evaluate(()=>{
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),a=[];
  while(w.nextNode()){
   const n=w.currentNode,s=n.nodeValue.trim(),e=n.parentElement;
   if(e && !e.closest('[hidden],.bubble.user,.chat-history-preview') && e.getClientRects().length && /[\u3400-\u9fff]/u.test(s))a.push(s.slice(0,180));
  }
  return a;
 });
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-US',timezoneId:'America/New_York'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url,{waitUntil:'load'});
  await page.locator('#onboarding-next').click();
  assert.match(await page.locator('#onboarding-error').innerText(),/role/i);
  checks.push({name:'role required',chinese:await chinese(page)});
  await page.locator('[data-onboarding-choice="role"][data-choice-index="0"]').click();
  await page.locator('#onboarding-next').click();
  const age=page.locator('#onboard-age');
  await age.focus();await age.press('ArrowDown');
  assert.equal(await age.getAttribute('aria-valuenow'),'18');
  checks.push({name:'age min 18',chinese:await chinese(page)});
  const parity=page.locator('#onboard-parity');
  await parity.focus();await parity.press('End');
  assert.equal(await parity.getAttribute('aria-valuenow'),'6');
  checks.push({name:'births max 6',chinese:await chinese(page)});
  const weeks=page.locator('#onboard-baby-0-weeks');
  await weeks.focus();await weeks.press('ArrowDown');
  assert.equal(await weeks.getAttribute('aria-valuenow'),'37');
  checks.push({name:'gestational age min 37 weeks',chinese:await chinese(page)});
  await page.locator('#onboarding-next').click();
  await page.locator('#onboarding-next').click();
  await page.locator('#onboarding-next').click();
  assert.equal(new URL(page.url()).hash,'#/home');
  await page.locator('#assistant .sound-button').click();
  assert.equal(await page.locator('#assistant .sound-button').getAttribute('aria-pressed'),'true');
  checks.push({name:'sound toggle',chinese:await chinese(page)});
  await page.locator('#assistant .main-menu-button').click();
  await page.locator('#care-sidebar [data-sidebar="record"]').click();
  await page.locator('#records .profile-menu-button').click();
  await page.locator('#sheet [data-action="mom-profile"]').click();
  const momAge=page.locator('#profile-form [name="momAge"]');
  await momAge.fill('51');
  await page.locator('#profile-form button[type="submit"]').click();
  assert.match(await page.locator('#profile-error').innerText(),/18–50/);
  checks.push({name:'profile age rejects 51',chinese:await chinese(page)});
  await momAge.fill('50');
  await page.locator('#profile-form button[type="submit"]').click();
  assert.equal(await page.locator('#sheet').evaluate(el=>el.open),false);
  checks.push({name:'profile age accepts 50',chinese:await chinese(page)});
  await page.locator('#records .profile-menu-button').click();
  await page.locator('#sheet [data-action="baby-profile"]').click();
  const birthWeeks=page.locator('#profile-form [name="birthWeeks"]');
  await birthWeeks.fill('51');
  await page.locator('#profile-form button[type="submit"]').click();
  assert.match(await page.locator('#profile-error').innerText(),/37–50/);
  checks.push({name:'gestational age rejects 51',chinese:await chinese(page)});
  await birthWeeks.fill('50');
  await page.locator('#profile-form button[type="submit"]').click();
  assert.equal(await page.locator('#sheet').evaluate(el=>el.open),false);
  checks.push({name:'gestational age accepts 50',chinese:await chinese(page)});
 }catch(e){errors.push(e.stack)}
 finally{
  if(checks.some(c=>c.chinese.length))errors.push('Untranslated UI found');
  fs.writeFileSync(path.join(__dirname,'limits-evidence.json'),JSON.stringify({checks,errors},null,2));
  await context.close();await browser.close();
  console.log(JSON.stringify({checks:checks.map(c=>({name:c.name,chinese:c.chinese})),errors},null,2));
  if(errors.length)process.exitCode=1;
 }
})();
