const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=pathToFileURL(path.resolve(__dirname,'../Momcozy-final.html')).href+'#/home';
const seed={records:[],profiles:{baby:'Avery',birth:'',careRole:'妈妈',momStage:'产后',momAge:'30',parity:'1',babyCount:1,babies:[{birth:'',weeks:'40'}],birthWeeks:'40'},prefs:{theme:'light',sound:false}};
const checks=[],errors=[];
async function check(page,label){
 const r=await page.evaluate(()=>{
  const app=document.querySelector('.app').getBoundingClientRect(),sheet=document.querySelector('#sheet');
  const root=sheet.open?sheet:document.querySelector('.page:not([hidden])');
  const els=[...root.querySelectorAll('button,label,span,small,p,h1,h2,h3,h4,input,textarea')].filter(el=>el.getClientRects().length&&!el.closest('.sr-only'));
  const clipped=els.filter(el=>{const b=el.getBoundingClientRect(),cs=getComputedStyle(el);return b.width>0&&el.scrollWidth>el.clientWidth+3&&cs.overflowX!=='hidden'&&cs.textOverflow!=='ellipsis'}).slice(0,20).map(el=>({tag:el.tagName,className:el.className,text:el.textContent.trim().slice(0,80),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}));
  const outside=els.filter(el=>{const b=el.getBoundingClientRect();return b.left<app.left-2||b.right>app.right+2}).slice(0,20).map(el=>({tag:el.tagName,text:el.textContent.trim().slice(0,80)}));
  return {clipped,outside};
 });
 checks.push({label,...r});console.log(label,'clipped='+r.clipped.length,'outside='+r.outside.length);
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  for(const width of [360,390]){
   const ctx=await browser.newContext({viewport:{width,height:844},locale:'en-US',timezoneId:'America/New_York'});
   await ctx.addInitScript(data=>localStorage.setItem('momcozy-home-1.0-en-US',JSON.stringify(data)),seed);
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url,{waitUntil:'load'});
   await check(page,'home-'+width);
   await page.locator('#assistant .main-menu-button').click();
  await page.locator('#care-sidebar [data-sidebar="record"]').click();
   await check(page,'journal-'+width);
   await page.locator('#records .profile-menu-button').click();
   await check(page,'profile-menu-'+width);
   await page.locator('#sheet [data-action="mom-profile"]').click();
   await check(page,'mom-profile-'+width);
   await page.locator('#sheet-close').click();
   await page.locator('#record-cta [data-action="record"]').click();
   await check(page,'record-picker-'+width);
   for(const type of ['亲喂','瓶喂母乳','配方奶','换尿布','吸奶']){
    await page.locator('#sheet [data-type="'+type+'"]').click();
    await check(page,'record-'+type+'-'+width);
    await page.locator('#sheet [data-action="back-types"]').click();
   }
   await ctx.close();
  }
 }catch(e){errors.push(e.stack)}
 finally{if(checks.some(c=>c.clipped.length||c.outside.length))errors.push('Clipped or outside UI found');fs.writeFileSync(path.join(__dirname,'overflow-evidence.json'),JSON.stringify({checks,errors},null,2));await browser.close();console.log('errors='+errors.length);if(errors.length)process.exitCode=1}
})();
