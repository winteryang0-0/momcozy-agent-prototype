const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=pathToFileURL(path.resolve(__dirname,'../Momcozy-final.html')).href+'#/home';
const seed={records:[],profiles:{baby:'Avery',birth:'',careRole:'妈妈',momStage:'产后',momAge:'30',parity:'1',babyCount:1,babies:[{birth:'',weeks:'40'}],birthWeeks:'40'},prefs:{theme:'light',sound:false}};
const results=[],errors=[];let currentLabel='startup';
async function check(page,label){
 currentLabel=label;
 await page.waitForTimeout(50);
 const data=await page.evaluate(()=>{
  const visible=e=>e&&!e.closest('script,style,[hidden],.bubble.user,.chat-history-preview')&&e.getClientRects().length&&getComputedStyle(e).display!=='none';
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),chinese=[];
  while(w.nextNode())if(visible(w.currentNode.parentElement)&&/[\u3400-\u9fff]/u.test(w.currentNode.nodeValue))chinese.push(w.currentNode.nodeValue.trim().slice(0,180));
  const attrs=[];
  for(const el of document.querySelectorAll('[aria-label],[aria-valuetext],[title],[placeholder],[alt]')){
   if(!visible(el))continue;
   for(const a of ['aria-label','aria-valuetext','title','placeholder','alt']){
    const v=el.getAttribute(a);if(v&&/[\u3400-\u9fff]/u.test(v))attrs.push(a+': '+v);
   }
  }
  return {chinese,attrs,title:document.querySelector('#sheet-title').textContent,taskState:typeof task==='object'?task?.state:null};
 });
 results.push({label,...data});
 if(data.chinese.length||data.attrs.length)console.log(label,JSON.stringify({chinese:data.chinese,attrs:data.attrs}));
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const ctx=await browser.newContext({viewport:{width:390,height:844},locale:'en-US',timezoneId:'America/New_York'});
 await ctx.addInitScript(data=>localStorage.setItem('momcozy-home-1.0-en-US',JSON.stringify(data)),seed);
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(currentLabel+': '+(e.stack||e.message)));
 try{
  await page.goto(url,{waitUntil:'load'});
  for(const [mode,scenario] of [['normal','normal'],['empty','normal'],['error','normal'],['normal','offline']]){
   await page.evaluate(([m,s])=>{homeMode=m;scenario=s;render()},[mode,scenario]);
   await check(page,'home-'+mode+'-'+scenario);
   for(let i=0;i<3;i++){
    await page.evaluate(index=>changeAdvice(index),i);
    await check(page,'advice-'+mode+'-'+scenario+'-'+i);
   }
  }
  await page.evaluate(()=>{scenario='normal';homeMode='normal';render()});
  for(const kind of ['cry','poop']){
   await page.evaluate(k=>{task={kind:k,state:'ready',id:'matrix-'+k,drafts:{}};taskHistory=[];messages=[{role:'task',taskId:task.id}];renderTask()},kind);
   for(const state of ['ready','starting','camera','cameraReady','listening','finishing','captured','captureError','processing','indeterminate','result','timeout','offline','cancelled','interrupted','speaking']){
    try{
     await page.evaluate(s=>{task.state=s;task.captureNotice='';renderTask()},state);
     await check(page,kind+'-'+state);
    }catch(e){errors.push(kind+'-'+state+': '+e.stack)}
   }
  }
  await page.evaluate(()=>{task=null;taskHistory=[];messages=[];renderTask()});
  await page.evaluate(()=>{task={kind:'record',state:'picker',id:'matrix-record-task',drafts:{}};taskHistory=[];messages=[{role:'task',taskId:task.id}];renderTask()});
  await check(page,'inline-picker');
  await page.evaluate(()=>{task.type='亲喂';task.state='editing';renderTask()});
  await check(page,'inline-editing');
  for(const state of ['saving','unknown','failed','success']){
   await page.evaluate(s=>{
    task.state=s==='success'?'success':'editing';
    task.recordJob={state:s,id:'matrix-record',local:true,record:{id:'matrix-record',type:'亲喂',owner:'宝宝',side:'左侧',duration:12,time:currentLocalTime(),sync:'待同步'}};
    if(s==='success'&&!records.some(r=>r.id==='matrix-record'))records.push(task.recordJob.record);
    renderTask();
   },state);
   await check(page,'inline-'+state);
  }
  await page.evaluate(()=>{task.state='cancelled';task.recordJob=null;renderTask()});
  await check(page,'inline-cancelled');
  await page.evaluate(()=>{task=null;taskHistory=[];messages=[];renderTask()});
  await page.locator('.preview-strip [data-action="settings"]').click();
  await check(page,'settings');
  await page.locator('#sheet [data-action="reset-confirm"]').click();
  await check(page,'reset-confirm');
 }catch(e){errors.push(e.stack)}
 finally{if(results.some(s=>s.chinese.length||s.attrs.length))errors.push('Untranslated UI found');fs.writeFileSync(path.join(__dirname,'state-matrix-evidence.json'),JSON.stringify({results,errors},null,2));await ctx.close();await browser.close();console.log('states='+results.length+' errors='+errors.length);if(errors.length)process.exitCode=1}
})();
