/* Semantic motion, local theme preference and home voice feedback. */
(()=>{
 const root=document.documentElement,app=document.querySelector('#app');
 const palettes=['blue','sage','rose','lavender'];
 function theme(value){root.dataset.cozieTheme=palettes.includes(value)?value:'blue';document.querySelectorAll('[data-cozie-theme]').forEach(b=>{if(b.tagName==='BUTTON')b.setAttribute('aria-pressed',String(b.dataset.cozieTheme===root.dataset.cozieTheme));});}
 try{theme(localStorage.getItem('cozie-theme')||'blue')}catch{theme('blue')}
 document.addEventListener('click',e=>{const b=e.target.closest('button[data-cozie-theme]');if(b){theme(b.dataset.cozieTheme);try{localStorage.setItem('cozie-theme',b.dataset.cozieTheme)}catch{}}});
 let motion;
 window.CozieFeedback=(key='welcome')=>{
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('reduced-motion'))return;
  const el=document.querySelector('#onboard-character .mascot-wrap');if(!el)return;
  const hash=Array.from(key).reduce((a,c)=>a+c.charCodeAt(0),0)%4;
  const poses=[['translateY(-17px) rotate(8deg) scale(1.09,.94)','translateY(2px) rotate(-5deg) scale(.97,1.04)'],['translateX(-10px) rotate(-11deg)','translateX(10px) rotate(10deg)'],['translateY(-9px) scale(1.13,.91)','translateY(-15px) scale(.95,1.08)'],['rotate(-12deg) translateY(-5px)','rotate(12deg) translateY(-12px)']][hash];
  motion?.cancel();motion=el.animate([{transform:'none'},{transform:poses[0],offset:.32},{transform:poses[1],offset:.65},{transform:'none'}],{duration:720,easing:'cubic-bezier(.22,.8,.3,1)'});
 };
 document.addEventListener('change',e=>{if(e.target.closest('#onboard-form'))window.CozieFeedback(e.target.name+':'+e.target.value)});
 const panel=document.querySelector('#panel-body');new MutationObserver(ms=>{if(ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.id==='onboard-form'||n.querySelector?.('#onboard-form')))))requestAnimationFrame(()=>window.CozieFeedback('page-'+document.querySelector('#onboard-form')?.dataset.step));}).observe(panel,{childList:true});
 document.body.insertAdjacentHTML('beforeend','<svg width="0" height="0" aria-hidden="true"><defs><filter id="cozie-clear-paper" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -4 -4 -4 0 11.65"/></filter></defs></svg>');
 const menu=document.querySelector('.mobile-menu');if(menu)menu.innerHTML='<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h12M4 18h16"/></svg>';
 const send=document.querySelector('.send-button');if(send)send.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3 3.5 11.5l2.1 2.1 4.9-4.9V21h3V8.7l4.9 4.9 2.1-2.1z"/></svg>';
 function intent(text){const t=String(text);let next=/睡|sleep|nap|night/i.test(t)?'sleep':/奶|喂|feed|milk|pump|水|辅食/i.test(t)?'feeding':/哭|情绪|压力|感受|worry|stress|mood/i.test(t)?'feelings':/尿|便|photo|diaper|体重|weight/i.test(t)?'care':null;if(next)app.dataset.intent=next;}
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(b)intent((b.dataset.action||'')+' '+(b.dataset.type||'')+' '+b.textContent)});
 document.querySelector('#chat-form')?.addEventListener('submit',()=>intent(document.querySelector('#chat-input').value),true);
 const voice=document.querySelector('#voice-button'),hint=document.querySelector('#voice-hint');
 const orb=document.createElement('div');orb.className='cozie-voice-orbit';orb.hidden=true;orb.setAttribute('aria-hidden','true');orb.innerHTML='<div class="voice-bars">'+[10,20,32,22,40,28,44,24,36,20,12].map((h,i)=>`<i style="--h:${h}px;--delay:${i*-70}ms"></i>`).join('')+'</div><strong>正在听你说</strong>';app.append(orb);
 function voiceState(){const active=voice.classList.contains('recording');app.classList.toggle('is-voice-active',active);orb.hidden=!active;}
 new MutationObserver(voiceState).observe(voice,{attributes:true,attributeFilter:['class']});
 new MutationObserver(()=>{if(voice.classList.contains('recording'))intent(hint.textContent)}).observe(hint,{childList:true,characterData:true,subtree:true});
 voiceState();
})();
