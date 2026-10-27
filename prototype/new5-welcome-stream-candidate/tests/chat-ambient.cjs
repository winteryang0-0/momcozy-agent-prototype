const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('url'),path=require('path'),fs=require('fs'),assert=require('assert');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});
 try {
 const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.resolve('Momcozy-Soft-Companion.html')).href);
 await p.evaluate(()=>{const k='momcozy-soft-companion-v3',d=JSON.parse(localStorage.getItem(k));d.profiles.onboardingDone=true;localStorage.setItem(k,JSON.stringify(d));localStorage.removeItem(k+'-onboarding')});await p.reload();await p.waitForTimeout(500);
 const read=()=>p.evaluate(()=>{const l=document.querySelector('.chat-ambient-background');return {paused:l.dataset.paused,static:l.dataset.static,hidden:l.hidden,transform:getComputedStyle(l,'::after').transform,opacity:+getComputedStyle(l,'::before').opacity}});
 assert.equal((await read()).paused,'false');const start=await read();await p.waitForTimeout(300);assert.notEqual((await read()).transform,start.transform);
 const timing=await p.evaluate(()=>{const l=document.querySelector('.chat-ambient-background');return l.getAnimations({subtree:true}).map(a=>({name:a.animationName,...a.effect.getTiming()}))});
 assert.equal(timing.find(a=>a.name==='chat-ambient-drift').duration,5000);
 assert.equal(timing.find(a=>a.name==='chat-ambient-drift').direction,'alternate');
 assert.equal(timing.find(a=>a.name==='chat-ambient-palette').delay,5000);
 const samples=[];
 for(const t of [0,5000,5750,6500,10000,10750,11500,15000]){await p.evaluate(t=>document.querySelector('.chat-ambient-background').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=t}),t);samples.push({t,...await read()});}
 assert.equal(samples[1].opacity,0);assert.equal(samples[3].opacity,1);assert.equal(samples[4].opacity,1);assert.equal(samples[6].opacity,0);assert.ok(samples[2].opacity>.4&&samples[2].opacity<.6);
 await p.reload();await p.waitForTimeout(300);await p.locator('.mobile-menu').click();await p.waitForTimeout(250);assert.equal((await read()).paused,'true');const paused=await read();await p.waitForTimeout(200);assert.equal((await read()).transform,paused.transform);await p.keyboard.press('Escape');await p.waitForTimeout(400);assert.equal((await read()).paused,'false');
 await p.evaluate(()=>document.querySelector('#app').dataset.route='records');assert.equal((await read()).hidden,true);await p.evaluate(()=>document.querySelector('#app').dataset.route='home');
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});assert.equal((await read()).paused,'true');await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
 for(const cls of ['reduced','reduced-motion']){await p.evaluate(c=>document.body.classList.add(c),cls);assert.equal((await read()).static,'true');assert.equal((await read()).transform,'none');await p.evaluate(c=>document.body.classList.remove(c),cls);}
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);assert.equal((await read()).static,'true');assert.equal((await read()).opacity,0);await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(100);
 const scroll=await p.evaluate(()=>{const layer=document.querySelector('.chat-ambient-background'),thread=document.querySelector('#thread'),rect=()=>JSON.stringify(layer.getBoundingClientRect().toJSON());const before=rect();const spacer=document.createElement('div');spacer.style.height='2000px';thread.append(spacer);thread.scrollTop=500;const after=rect(),top=thread.scrollTop;spacer.remove();thread.scrollTop=0;return {before,after,top,pointer:getComputedStyle(layer).pointerEvents,tab:layer.tabIndex}});assert.equal(scroll.before,scroll.after);assert.ok(scroll.top>0);assert.equal(scroll.pointer,'none');assert.equal(scroll.tab,-1);
 await p.locator('#chat-input').click();assert.equal(await p.evaluate(()=>document.activeElement.id),'chat-input');await p.locator('#chat-input').fill('背景验证草稿');assert.equal(await p.locator('#chat-input').inputValue(),'背景验证草稿');await p.locator('#chat-input').fill('');
 const comparison=await p.evaluate(()=>{
  const selectors=['.topbar','#thread','#welcome','.mascot-wrap','#mascot','.composer-area','#chat-input','.floating-tools'];
  const measure=()=>selectors.map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),c=getComputedStyle(e);return {s,x:r.x,y:r.y,w:r.width,h:r.height,font:c.font,padding:c.padding,margin:c.margin,animation:c.animation,background:c.background}});
  document.body.classList.add('reduced-motion');const after=measure();const style=[...document.querySelectorAll('style')].find(s=>s.textContent.includes('@keyframes chat-ambient-drift'));style.disabled=true;document.querySelector('.chat-ambient-background').hidden=true;const before=measure();style.disabled=false;document.querySelector('.chat-ambient-background').hidden=false;return {before,after};
 });
 for(let i=0;i<comparison.before.length;i++){const a={...comparison.before[i]},z={...comparison.after[i]};if(a.s==='#thread'){delete a.background;delete z.background}assert.deepEqual(z,a);}
 await p.evaluate(()=>document.body.classList.remove('reduced-motion'));await p.screenshot({path:'review/ambient/preview.png'});
 assert.deepEqual(errors,[]);fs.writeFileSync('review/ambient/results.json',JSON.stringify({timing,samples,comparison,errors,visibility:'document.hidden simulated; OS background not exercised'},null,2));console.log('PASS motion, palette samples, modal pause/resume, route, simulated visibility, both reduced classes, OS emulation, layout/style comparison');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
