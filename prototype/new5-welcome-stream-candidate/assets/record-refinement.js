/* Keep native form fields as the persistence contract. */
(()=>{'use strict';
const panel=document.querySelector('#panel'),body=document.querySelector('#panel-body');
const local=d=>new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
const emit=e=>e.dispatchEvent(new Event('input',{bubbles:true}));
function clock(value){const d=new Date(value),m=d.getMinutes(),h=d.getHours()%12;return `<svg class="sleep-clock" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="white" stroke="#e3ecf8" stroke-width="10"/>${Array.from({length:12},(_,i)=>`<path d="M60 12v4" transform="rotate(${i*30} 60 60)" stroke="#a4b6d2"/>`).join('')}<path d="M60 60V29" transform="rotate(${h*30+m/2} 60 60)" stroke="#5668d9" stroke-width="4" stroke-linecap="round"/><path d="M60 60V20" transform="rotate(${m*6} 60 60)" stroke="#789aef" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="60" r="5" fill="#5668d9"/></svg>`}
function enhance(){const form=body.querySelector('#record-form'),fields=body.querySelector('#dynamic-fields');if(!form||!fields||fields.dataset.refined)return;fields.dataset.refined='1';
 const type=panel.dataset.recordType;
 if(type==='换尿布')fields.insertAdjacentHTML('afterbegin','<div class="record-feature-art">'+icon('diaper')+'</div>');
 if(type!=='睡眠')return;
 const duration=fields.querySelector('[name=duration]'),time=form.querySelector('[name=time]');if(!duration||!time)return;
 const end=time.value||local(new Date()),start=local(new Date(new Date(end)-Number(duration.value||60)*60000));
 fields.insertAdjacentHTML('afterbegin',`<section class="sleep-editor"><div class="record-feature-art">${icon('rest')}</div><div class="sleep-mode"><button type="button" data-sleep-mode="live" aria-pressed="false">正在睡</button><button type="button" data-sleep-mode="backfill" aria-pressed="true">补记</button></div><div class="sleep-times"><label>开始时间<input type="datetime-local" data-ui="ready" name="sleepStart" value="${start}"><span data-clock="start"></span></label><label>结束时间<input type="datetime-local" data-ui="ready" name="sleepEnd" value="${end}"><span data-clock="end"></span></label></div><div class="sleep-duration" role="status"></div><label class="sleep-next-day">跨天<input type="checkbox" aria-label="结束时间跨天"></label><div class="preset-values">${[30,60,90,120].map(n=>`<button type="button" data-sleep-minutes="${n}">${n<60?n+'分钟':n/60+'小时'}</button>`).join('')}</div><div class="sleep-active" hidden></div><button type="button" class="primary full" data-sleep-toggle hidden>开始睡眠计时</button></section>`);
 const ed=fields.querySelector('.sleep-editor'),a=ed.querySelector('[name=sleepStart]'),z=ed.querySelector('[name=sleepEnd]'),cross=ed.querySelector('[type=checkbox]'),out=ed.querySelector('.sleep-duration'),live=ed.querySelector('.sleep-active'),toggle=ed.querySelector('[data-sleep-toggle]');
 duration.closest('.field').hidden=true;time.closest('.field').hidden=true;duration.dataset.ui='ready';time.dataset.ui='ready';
 const key='cozie-active-sleep-'+form.querySelector('[name=babyId]').value;
 let active=localStorage.getItem(key),mode='backfill';
 function sync(){const ms=new Date(z.value)-new Date(a.value),mins=Math.round(ms/60000);duration.value=mins>0?String(mins):'';time.value=z.value;out.textContent=mins>0?mins+'分钟':'请选择结束晚于开始的时间';cross.checked=a.value.slice(0,10)!==z.value.slice(0,10);ed.querySelector('[data-clock=start]').innerHTML=clock(a.value);ed.querySelector('[data-clock=end]').innerHTML=clock(z.value);emit(duration);emit(time)}
 a.addEventListener('input',sync);z.addEventListener('input',sync);cross.addEventListener('change',()=>{const d=new Date(z.value),s=new Date(a.value);d.setFullYear(s.getFullYear(),s.getMonth(),s.getDate()+(cross.checked?1:0));z.value=local(d);sync()});
 ed.querySelectorAll('[data-sleep-minutes]').forEach(b=>b.onclick=()=>{a.value=local(new Date(new Date(z.value)-Number(b.dataset.sleepMinutes)*60000));sync()});
 function setMode(next){mode=next;ed.querySelectorAll('[data-sleep-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sleepMode===mode)));ed.querySelector('.sleep-times').hidden=mode==='live';out.hidden=mode==='live';cross.parentElement.hidden=mode==='live';ed.querySelector('.preset-values').hidden=mode==='live';live.hidden=mode!=='live';toggle.hidden=mode!=='live';form.querySelector('button[type=submit]').hidden=mode==='live';toggle.textContent=active?'结束睡眠计时':'开始睡眠计时';live.textContent=active?'正在睡 · '+Math.max(0,Math.floor((Date.now()-new Date(active))/60000))+'分钟':'准备好后开始计时';}
 ed.querySelectorAll('[data-sleep-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.sleepMode));
 toggle.onclick=()=>{if(!active){active=local(new Date());localStorage.setItem(key,active);setMode('live')}else{a.value=active;z.value=local(new Date());active=null;localStorage.removeItem(key);sync();setMode('backfill')}};
 sync();if(active)setMode('live');
}
new MutationObserver(enhance).observe(body,{childList:true,subtree:true});enhance();
})();
