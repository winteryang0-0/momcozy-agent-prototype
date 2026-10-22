const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const html=path.resolve(__dirname,'../Momcozy-final.html');
const url=pathToFileURL(html).href+'#/home';
const seed={records:[],profiles:{baby:'Avery',birth:'',careRole:'妈妈',momStage:'产后',momAge:'30',parity:'1',babyCount:1,babies:[{birth:'',weeks:'40'}],birthWeeks:'40'},prefs:{theme:'light',sound:false}};
const results=[],errors=[],shots=path.join(__dirname,'screenshots');
async function check(page,label){
 const r=await page.evaluate(()=>{
  const app=document.querySelector('.app'),p=document.querySelector('.page:not([hidden])'),sheet=document.querySelector('#sheet');
  const size=el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height}};
  const candidates=[...document.querySelectorAll('button,input,textarea,h2,h3,p,small')].filter(el=>el.getClientRects().length && !el.closest('[hidden],.sr-only'));
  const clipped=candidates.filter(el=>{
   const b=el.getBoundingClientRect(),a=app.getBoundingClientRect();
   return b.width>0&&(b.left<a.left-2||b.right>a.right+2)&&!el.closest('.studio');
  }).slice(0,12).map(el=>({tag:el.tagName,className:el.className,text:el.textContent.trim().slice(0,50),box:size(el)}));
  return {route:location.hash,app:size(app),page:size(p),sheetOpen:sheet.open,clipped,scrollWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};
 });
 const name='viewport-'+label+'.png';
 await page.screenshot({path:path.join(shots,name)});
 results.push({label,shot:name,...r});
 console.log(label,'clipped='+r.clipped.length,'horizontal='+Math.max(0,r.scrollWidth-r.viewportWidth));
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  for(const [width,height] of [[360,780],[390,844],[430,932],[1280,900]]){
   const ctx=await browser.newContext({viewport:{width,height},locale:'en-US',timezoneId:'America/New_York'});
   await ctx.addInitScript(data=>localStorage.setItem('momcozy-home-1.0-en-US',JSON.stringify(data)),seed);
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url,{waitUntil:'load'});
   await check(page,'home-'+width);
   await page.locator('#assistant .main-menu-button').click();
  await page.locator('#care-sidebar [data-sidebar="record"]').click();
   await check(page,'journal-'+width);
   await page.locator('#records .profile-menu-button').click();
   await check(page,'my-menu-'+width);
   await ctx.close();
  }
 }catch(e){errors.push(e.stack)}
 finally{
  fs.writeFileSync(path.join(__dirname,'viewport-evidence.json'),JSON.stringify({materialSha256:crypto.createHash('sha256').update(fs.readFileSync(html)).digest('hex'),results,errors},null,2));
  await browser.close();console.log('errors='+errors.length);if(errors.length||results.some(r=>r.clipped.length||r.scrollWidth>r.viewportWidth))process.exitCode=1;
 }
})();
