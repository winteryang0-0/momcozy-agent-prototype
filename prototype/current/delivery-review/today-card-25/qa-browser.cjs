const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..');
const standalone=path.join(root,'Momcozy-final.html');
const modular=path.join(root,'index.html');
const shots=path.join(__dirname,'screenshots');
fs.mkdirSync(shots,{recursive:true});
const output={material_sha256:crypto.createHash('sha256').update(fs.readFileSync(standalone)).digest('hex'),checks:[],screenshots:[],errors:[]};
const check=(name,details)=>output.checks.push({name,details});
async function open(browser,file,viewport,theme='light'){
 const context=await browser.newContext({viewport,deviceScaleFactor:2,timezoneId:'Asia/Shanghai'});
 const seed={records:[],profiles:{baby:'宝宝',careRole:'妈妈',momStage:'产后',concerns:[],babies:[{birth:'',weeks:'40'}]},prefs:{theme,sound:false}};
 await context.addInitScript(value=>{if(!localStorage.getItem('momcozy-home-1.0'))localStorage.setItem('momcozy-home-1.0',JSON.stringify(value));},seed);
 const page=await context.newPage();
 page.on('pageerror',e=>output.errors.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error')output.errors.push('console: '+m.text());});
 await page.goto(pathToFileURL(file).href+'#/home',{waitUntil:'load'});
 await page.locator('.care-shortcuts').waitFor();
 return {context,page};
}
async function shot(page,name,note){
 await page.waitForTimeout(350);
 const target=path.join(shots,name+'.png');
 await page.screenshot({path:target});
 const bytes=fs.readFileSync(target);
 output.screenshots.push({name,note,path:path.relative(root,target).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),url:page.url(),viewport:page.viewportSize(),image_pixels:{width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)},captured_at:new Date().toISOString(),fullPage:false});
}
async function start(page,kind){await page.locator('.care-shortcuts [data-care="'+kind+'"]').click();}
async function record(page,type='配方奶'){
 await start(page,'record');
 await page.locator('.inline-record-card [data-inline-type="'+type+'"]').click();
 if(type==='配方奶')await page.locator('#inline-record-form [name="amount"]').fill('90');
 if(type==='换尿布'){
  await page.locator('#inline-record-form [name="kind"][value="嘘嘘"]').check();
  await page.locator('#inline-record-form [name="rash"][value="无"]').check();
 }
}
async function state(page){
 return page.evaluate(()=>({task:task&&{id:task.id,kind:task.kind,state:task.state,job:task.recordJob&&{id:task.recordJob.id,requestId:task.recordJob.requestId,state:task.recordJob.state}},history:taskHistory.map(t=>({id:t.id,kind:t.kind,state:t.state,resumedBy:t.resumedBy,job:t.recordJob&&{id:t.recordJob.id,requestId:t.recordJob.requestId,state:t.recordJob.state}})),records:records.map(r=>r.id)}));
}
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 output.browser={name:'Google Chrome',version:browser.version(),mode:'headless',protocol:'file://',deviceScaleFactor:2};
 try{
  {
   const {context,page}=await open(browser,standalone,{width:390,height:844});
   await record(page,'换尿布');
   await start(page,'cry');
   await start(page,'cry');
   let s=await state(page);
   assert.equal(s.task.kind,'cry');assert.equal(s.history.length,2);
   assert.equal(s.history[0].state,'interrupted');assert.equal(s.history[1].state,'interrupted');
   assert.equal(await page.locator('.task-card').count(),3);
   check('same-kind and cross-kind triggers',s);
   await shot(page,'01-three-task-cards-390','未完成记录与同类哭闹任务连续触发');
   await page.evaluate(id=>scrollToTaskId(id),s.history[0].id);
   await page.waitForTimeout(90);
   await shot(page,'01a-paused-record-390','连续任务中的首张记录草稿卡');
   await page.evaluate(id=>scrollToTaskId(id),s.history[1].id);
   await page.waitForTimeout(90);
   await shot(page,'01b-paused-cry-390','连续任务中的第二张已暂停哭闹卡');
   await page.locator('.inline-record-card [data-resume-task]').first().click();
   s=await state(page);
   assert.equal(s.task.kind,'record');assert.equal(s.history.length,3);
   assert.equal(s.history[0].resumedBy,s.task.id);
   assert.equal(await page.locator('#inline-record-form [name="kind"]:checked').inputValue(),'嘘嘘');
   assert.equal(await page.locator('#inline-record-form [name="rash"]:checked').inputValue(),'无');
   assert.equal(await page.locator('.inline-record-card [data-resume-task]').count(),0);
   check('draft ownership transfer',s);
   await shot(page,'02-resumed-record-390','旧草稿转移到新卡片且保留字段');
   await page.locator('#inline-record-form button[type="submit"]').click();
   await page.waitForTimeout(1050);
   s=await state(page);assert.equal(s.records.length,1);assert.equal(s.task.state,'success');
   assert.equal(await page.locator('.inline-record-card [data-resume-task]').count(),0);
   check('resumed draft saves once',s);
   await context.close();
  }
  {
   const {context,page}=await open(browser,standalone,{width:390,height:844});
   await record(page);
   await page.locator('#inline-record-form button[type="submit"]').click();
   const pending=await state(page);assert.equal(pending.task.job.state,'saving');
   await start(page,'poop');
   let s=await state(page);assert.equal(s.history[0].job.state,'saving');assert.equal(s.task.kind,'poop');
   await page.waitForTimeout(1050);
   s=await state(page);
   assert.equal(s.history[0].job.state,'success');assert.equal(s.records.length,1);
   check('save completes in historical card',s);
   await shot(page,'03-background-save-390','前一张记录卡保存中切换到便便任务');
   await context.close();
  }
  {
   const {context,page}=await open(browser,standalone,{width:390,height:844});
   await page.evaluate(()=>{scenario='unknown';});
   await record(page);
   await page.locator('#inline-record-form button[type="submit"]').click();
   await start(page,'poop');
   await page.waitForTimeout(1050);
   let s=await state(page);assert.equal(s.history[0].job.state,'unknown');
   const requestId=s.history[0].job.requestId;
   await page.locator('.inline-record-card [data-inline-action="check"]').click();
   s=await state(page);assert.equal(s.records.length,1);assert.equal(s.history[0].job.requestId,requestId);
   await page.reload({waitUntil:'load'});
   s=await state(page);assert.equal(s.records.length,1);assert.equal(s.history[0].job.state,'success');
   check('unknown save checked with same request and refresh',s);
   await context.close();
  }
  {
   const {context,page}=await open(browser,standalone,{width:390,height:844});
   await record(page);
   await page.locator('#inline-record-form button[type="submit"]').click();
   await start(page,'poop');
   await page.reload({waitUntil:'load'});
   let s=await state(page);assert.equal(s.records.length,0);assert.equal(s.history[0].job.state,'unknown');
   await page.locator('.inline-record-card [data-inline-action="check"]').click();
   s=await state(page);assert.equal(s.records.length,1);
   check('refresh during save becomes recoverable',s);
   await context.close();
  }
  {
   const {context,page}=await open(browser,standalone,{width:390,height:844});
   await page.evaluate(()=>{scenario='failure';});
   await record(page);
   await page.locator('#inline-record-form button[type="submit"]').click();
   await page.waitForTimeout(1050);
   let s=await state(page);assert.equal(s.task.job.state,'failed');
   const requestId=s.task.job.requestId,recordId=s.task.job.id;
   await start(page,'cry');
   await page.locator('.inline-record-card [data-inline-action="edit"]').click();
   s=await state(page);
   assert.equal(s.task.kind,'record');assert.equal(s.task.job.requestId,requestId);
   await page.evaluate(()=>{scenario='normal';});
   await page.locator('#inline-record-form [name="amount"]').fill('110');
   await page.locator('#inline-record-form button[type="submit"]').click();
   await page.waitForTimeout(1050);
   s=await state(page);assert.deepEqual(s.records,[recordId]);assert.equal(s.task.job.requestId,requestId);
   check('failed historical save edits and retries same request',s);
   await context.close();
  }
  {
   const {context,page}=await open(browser,standalone,{width:390,height:844});
   await start(page,'cry');
   await page.evaluate(()=>{
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>new Promise(resolve=>{window.__resolveMedia=resolve;})}});
   });
   await page.locator('.care-task-card [data-step="capture"]').click();
   let s=await state(page);assert.equal(s.task.state,'starting');
   await start(page,'poop');
   await page.evaluate(()=>{window.__resolveMedia({getTracks:()=>[{stop:()=>{window.__mediaStopped=true;}}]});});
   await page.waitForTimeout(80);
   s=await state(page);assert.equal(s.task.kind,'poop');assert.equal(s.history[0].state,'interrupted');
   assert.equal(await page.evaluate(()=>window.__mediaStopped),true);
   check('pending microphone permission cannot overwrite new task',s);
   await context.close();
  }
  {
   const {context,page}=await open(browser,standalone,{width:390,height:844});
   await start(page,'poop');
   const tinyPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/X1kAAAAASUVORK5CYII=','base64');
   await page.evaluate(()=>openPhotoPicker());
   await page.locator('#care-photo-picker').setInputFiles({name:'care.png',mimeType:'image/png',buffer:tinyPng});
   let s=await state(page);assert.equal(s.task.state,'captured');
   await start(page,'cry');
   s=await state(page);assert.equal(s.history[0].state,'interrupted');
   assert.equal(await page.evaluate(()=>capturedMedia),null);
   await page.locator('.care-task-card [data-resume-task]').click();
   s=await state(page);assert.equal(s.task.kind,'poop');assert.equal(s.task.state,'ready');
   assert.equal(s.history[0].resumedBy,s.task.id);
   check('captured media discarded on task switch and resume',s);
   await context.close();
  }
  {
   const {context,page}=await open(browser,standalone,{width:390,height:844});
   await page.locator('#chat-message').fill('听哭闹');
   await page.locator('#chat-form').evaluate(form=>form.requestSubmit());
   await start(page,'poop');
   await page.waitForTimeout(820);
   const s=await state(page);assert.equal(s.task.kind,'poop');assert.equal(s.history.length,0);
   const reply=await page.locator('#conversation .assistant-message .bubble').last().innerText();
   assert.match(reply,/我会先保留你刚才的照护操作/);
   check('late message intent does not displace newer task',{state:s,reply});
   await context.close();
  }
  {
   const {context,page}=await open(browser,standalone,{width:390,height:844});
   await start(page,'cry');
   await page.evaluate(()=>{Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>new Promise(resolve=>{window.__resolveMedia=resolve;})}});});
   await page.locator('#chat-message').fill('看便便');
   await page.locator('#chat-form').evaluate(form=>form.requestSubmit());
   await page.locator('.care-task-card [data-step="capture"]').click();
   let s=await state(page);assert.equal(s.task.kind,'cry');assert.equal(s.task.state,'starting');
   await page.waitForTimeout(820);
   s=await state(page);assert.equal(s.task.kind,'cry');assert.equal(s.task.state,'starting');assert.equal(s.history.length,0);
   const reply=await page.locator('#conversation .assistant-message .bubble').last().innerText();
   assert.match(reply,/我会先保留你刚才的照护操作/);
   check('late message intent does not displace current card action',{state:s,reply});
   await context.close();
  }
  {
   const {context,page}=await open(browser,standalone,{width:390,height:844});
   await start(page,'cry');
   await page.locator('.compact-advice').click();
   const geometry=await page.evaluate(()=>({head:document.querySelector('#conversation-home-head').getBoundingClientRect().height,viewport:document.querySelector('#assistant-scroll').getBoundingClientRect().height,compact:getComputedStyle(document.querySelector('#compact-advice')).display,expandedTitle:document.querySelector('#expanded-advice .advice-card-heading strong').textContent}));
   assert.equal(geometry.compact,'none');assert.ok(geometry.head<190,JSON.stringify(geometry));
   await shot(page,'04-today-expanded-390','对话后展开的 Today 单层卡片');
   await page.locator('#expanded-advice [data-action="advice-next"]').click();
   assert.match(await page.locator('#advice-announcement').innerText(),/第 2 条提醒/);
   await shot(page,'06-today-next-390','展开卡切换到第二条提醒');
   await page.locator('#expanded-advice [data-action="advice-detail"]').click();
   assert.equal(await page.locator('#sheet').isVisible(),true);
   await page.locator('#sheet-close').click();
   await page.locator('.compact-advice').click();
   assert.equal(await page.locator('#expanded-advice').isVisible(),false);
   check('Today expand, switch, detail, collapse',geometry);
   await context.close();
  }
  {
   const {context,page}=await open(browser,standalone,{width:360,height:640},'dark');
   await start(page,'cry');
   await page.locator('.compact-advice').click();
   const geometry=await page.evaluate(()=>({head:document.querySelector('#conversation-home-head').getBoundingClientRect().height,viewport:document.querySelector('#assistant-scroll').getBoundingClientRect().height,overflow:document.querySelector('.app').scrollWidth-document.querySelector('.app').clientWidth}));
   assert.ok(geometry.viewport>145,JSON.stringify(geometry));assert.equal(geometry.overflow,0);
   assert.equal(await page.locator('#latest-message').isVisible(),false);
   await shot(page,'05-today-expanded-dark-360','夜间短屏的 Today 展开状态');
   await page.locator('.compact-advice').click();
   await shot(page,'07-today-collapsed-dark-360','夜间短屏的 Today 折叠状态');
   check('Today dark short screen',geometry);
   await context.close();
  }
  {
   const {context,page}=await open(browser,standalone,{width:390,height:844});
   await start(page,'cry');
   await page.locator('.main-menu-button').click();
   await page.locator('[data-sidebar="poop"]').click();
   const s=await state(page);
   assert.equal(s.task.kind,'poop');assert.equal(s.history[0].state,'interrupted');
   assert.equal(await page.locator('#sidebar-layer').isVisible(),false);
   check('sidebar service also allows unfinished task switch',s);
   await context.close();
  }
  {
   const {context,page}=await open(browser,modular,{width:390,height:844});
   await start(page,'record');
   await start(page,'cry');
   assert.equal((await state(page)).history.length,1);
   check('modular file entry works',{url:page.url()});
   await context.close();
  }
  assert.deepEqual(output.errors,[]);
  console.log('PASS '+output.checks.length+' targeted checks, '+output.screenshots.length+' screenshots');
 }finally{
  await browser.close();
  fs.writeFileSync(path.join(__dirname,'browser-evidence.json'),JSON.stringify(output,null,2),'utf8');
 }
}
main().catch(e=>{output.errors.push(String(e.stack||e));console.error(e);process.exitCode=1;});
