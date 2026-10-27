const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(pathToFileURL(path.resolve('Momcozy-Soft-Companion.html')).href);
await p.evaluate(()=>{const k='momcozy-soft-companion-v3',d=JSON.parse(localStorage.getItem(k));d.profiles.onboardingDone=true;localStorage.setItem(k,JSON.stringify(d));localStorage.removeItem(k+'-onboarding');localStorage.removeItem(k+'-dialogue-v2')});await p.reload();await p.waitForTimeout(600);
fs.mkdirSync('review/icon-board',{recursive:true});
await p.screenshot({path:'review/icon-board/home.png'});
for(const [action,name] of [['quick-record-menu','picker'],['cry','recording'],['stool','photo']]){
await p.locator('.floating-tools [data-action="'+action+'"]').click();await p.waitForTimeout(200);await p.screenshot({path:'review/icon-board/'+name+'.png'});
await p.locator('#panel .panel-head button').first().click();
}
console.log(JSON.stringify({errors,icons:await p.locator('.baseline-icon').count()}));if(errors.length)process.exitCode=1;
}finally{await b.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
