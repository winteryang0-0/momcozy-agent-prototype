const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
 const browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context = await browser.newContext({viewport:{width:390,height:844},locale:'en-US'});
 await context.addInitScript(() => {
   localStorage.setItem('momcozy-home-1.0-en-US',JSON.stringify({records:[],profiles:{baby:'Avery',birth:'',careRole:'妈妈',momStage:'产后',babies:[{birth:'',weeks:'40'}],birthWeeks:'40'},prefs:{theme:'light'}}));
 });
 const page = await context.newPage();
 page.on('pageerror',e=>console.log('pageerror',e.message));
 page.on('console',m=>{if(m.type()==='error')console.log('console',m.text())});
 const url=pathToFileURL(path.resolve(__dirname,'../Momcozy-final.html')).href+'#/records';
 await page.goto(url,{waitUntil:'load'});
 console.log('loaded',await page.locator('#record-links').innerText());
 await page.locator('.record-more summary').click();
 console.log('click first');
 await page.locator('#record-links [data-detail="喂养与睡眠"]').click({timeout:5000});
 console.log('first sheet',await page.locator('#sheet-title').innerText());
 await page.locator('#sheet-close').click({timeout:5000});
 console.log('closed');
 await page.locator('.record-more').evaluate(el=>el.open=true);
 console.log('opened details');
 console.log('second click starting');
 await page.locator('.record-more summary').click();
 await page.locator('.record-more summary').click();
 page.on('console',m=>{if(m.type()==='log')console.log('browser-log',m.text())});
 await page.evaluate(()=>{
   document.addEventListener('click',e=>{if(e.target.closest('[data-detail]'))console.log('document-click',e.target.closest('[data-detail]').dataset.detail)},true);
   document.querySelector('#record-links [data-detail="生长发育"]').addEventListener('click',()=>console.log('target-click'));
 });
 const pending = page.locator('#record-links [data-detail="生长发育"]').click({timeout:5000});
 setTimeout(() => console.log('timer alive'), 1000);
 setTimeout(async () => { try { console.log('state-after-click',await page.evaluate(()=>({open:document.querySelector('#sheet').open,title:document.querySelector('#sheet-title').textContent,route:location.hash}))) } catch(e){console.log('state-error',e.message)} },1500);
 await pending;
 console.log('second sheet',await page.locator('#sheet-title').innerText());
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
