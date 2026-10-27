from pathlib import Path
p=Path('assets/conversation.js');s=p.read_text(encoding='utf-8');s=s.replace("title==='功能与记录'","title==='功能与记录'||title==='Cozie'");s=s.replace("openPanel('现在聊哪位宝宝？',`<p class=\"panel-copy\">切换只改变当前对话的记录归属，已有未保存记录不会自动换宝宝。</p>","openPanel('',`");p.write_text(s,encoding='utf-8')
p=Path('assets/cozie-refinements.js');s=p.read_text(encoding='utf-8').replace('M3 10h10V5l8 7-8 7v-5H3z','M12 3 3.5 11.5l2.1 2.1 4.9-4.9V21h3V8.7l4.9 4.9 2.1-2.1z');p.write_text(s,encoding='utf-8')
p=Path('assets/ui-controls.js');s=p.read_text(encoding='utf-8');s=s.replace("input.closest('details').open=true;",'');s=s.replace("details=document.createElement('details');details.className='feeding-time';details.innerHTML='<summary>记录时间</summary>';label.before(details,wrap);details.append(label)","details=document.createElement('section');details.className='feeding-time';details.innerHTML='<h3>记录时间</h3>';label.before(details);details.append(wrap,label)")
s=s.replace("box.append(stepper,range,scale,presets,hint);", "box.append(stepper,range,scale,presets,hint);if(feeding){presets.remove();scale.remove();hint.remove();installCenteredRuler(range);}")
s=s.replace('function enhance(){', '''function installCenteredRuler(range){
 const ruler=document.createElement('div');ruler.className='record-centered-ruler';ruler.tabIndex=0;ruler.setAttribute('role','slider');ruler.setAttribute('aria-label',range.getAttribute('aria-label'));range.hidden=true;range.after(ruler);
 const min=+range.min,max=+range.max,step=+range.step,spacing=24;
 function draw(){const value=+range.value;ruler.setAttribute('aria-valuemin',min);ruler.setAttribute('aria-valuemax',max);ruler.setAttribute('aria-valuenow',value);ruler.innerHTML='<div class="record-ruler-track">'+Array.from({length:Math.round((max-min)/step)+1},(_,i)=>{const n=Math.round((min+i*step)*10)/10;return `<span style="left:calc(50% + ${(n-value)/step*spacing}px)" class="${n===value?'active':''}"><i></i><small>${i%2===0||n===value?n:''}</small></span>`}).join('')+'</div><b class="record-ruler-focus"></b>';}
 function set(v){range.value=String(Math.max(min,Math.min(max,Math.round(v/step)*step)));range.dispatchEvent(new Event('input',{bubbles:true}));draw();}
 let start=null,origin=0;
 ruler.addEventListener('pointerdown',e=>{if(e.button!==0)return;start=e.clientX;origin=+range.value;ruler.setPointerCapture(e.pointerId);ruler.focus();});
 ruler.addEventListener('pointermove',e=>{if(start!==null)set(origin+(start-e.clientX)/spacing*step)});
 const end=()=>{start=null};ruler.addEventListener('pointerup',end);ruler.addEventListener('pointercancel',end);ruler.addEventListener('lostpointercapture',end);
 ruler.addEventListener('keydown',e=>{const next={ArrowRight:+range.value+step,ArrowLeft:+range.value-step,Home:min,End:max}[e.key];if(next!==undefined){e.preventDefault();set(next)}});
 range.addEventListener('input',draw);range.closest('.ruler-control').addEventListener('click',()=>requestAnimationFrame(draw));draw();
}
function enhance(){
 panel.querySelectorAll('.type-chips button').forEach(b=>{if(!b.querySelector('.icon')){const n=({'亲喂':'breast','瓶喂母乳':'bottle','配方奶':'formula'})[b.textContent.replace('✓','').trim()];if(n)b.insertAdjacentHTML('afterbegin',icon(n));}});
''');p.write_text(s,encoding='utf-8')
