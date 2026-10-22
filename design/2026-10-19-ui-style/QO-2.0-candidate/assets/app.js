'use strict';
const $=id=>document.getElementById(id),stage=$('stage'),systemReduce=matchMedia('(prefers-reduced-motion: reduce)');
let state='review',amount='3',timer=null,run=0,animationFrame=null,tileAnimation=null;
const states={
review:['○','Not saved yet','Review the details before saving.','Save entry','neutral'],
saving:['◌','Saving entry…','Your request is being processed.','Saving…','neutral'],
synced:['✓','Saved and synced','Your entry is up to date.','Saved','success'],
local:['↥','Saved on this device','Sync pending. Finish syncing to edit.','Simulate sync','neutral'],
failed:['!','Couldn’t save','Your entry is still here. Please try again.','Try again','error'],
unknown:['?','Save status unknown','Check the status before editing or submitting again.','Check status','neutral'],
syncFailed:['↥','Saved here. Sync failed.','Your local entry is safe. Retry sync to edit.','Retry sync','error'],
syncing:['↥','Syncing entry…','Saved here. Editing resumes after sync.','Syncing…','neutral'],
checking:['?','Checking save status…','Checking the original request before you can edit.','Checking…','neutral']};
function stopPending(){clearTimeout(timer);run++;timer=null;}
function isReduced(){return $('reduceMotion').checked||systemReduce.matches;}
function showState(next){
state=next;const s=states[next];$('statusSymbol').textContent=s[0];$('statusTitle').textContent=s[1];$('statusHelp').textContent=s[2];$('saveButton').textContent=s[3];$('feedback').dataset.tone=s[4];$('feedback').dataset.state=next;
$('saveButton').disabled=['saving','syncing','checking','synced'].includes(next);$('editButton').disabled=['saving','syncing','checking','syncFailed','unknown','local'].includes(next);$('feedback').setAttribute('aria-busy',['saving','syncing','checking'].includes(next)?'true':'false');
document.querySelectorAll('#stateGrid button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.state===next)));$('statusSymbol').getAnimations().forEach(a=>a.cancel());if(!isReduced())$('statusSymbol').animate([{opacity:.55},{opacity:1}],{duration:160,easing:'cubic-bezier(.2,0,0,1)'});
}
function applyReduced(){document.body.classList.toggle('reduced',isReduced());if(isReduced()){cancelAnimationFrame(animationFrame);tileAnimation?.cancel();document.getAnimations().forEach(a=>a.cancel());$('motionTile').style.opacity='1';$('motionTile').style.transform='none';$('curveDot').setAttribute('cx','320');$('curveDot').setAttribute('cy','20');$('motionHint').textContent='已减少动态效果：即时更新状态，取消缩放与位移。';}}
$('reduceMotion').checked=systemReduce.matches;systemReduce.addEventListener('change',applyReduced);$('reduceMotion').addEventListener('change',applyReduced);applyReduced();
function setPlatform(p){stage.dataset.platform=p;for(const id of ['ios','android'])$(id+'Button').setAttribute('aria-pressed',String(p===id));$('platformLabel').textContent=p==='ios'?'iOS · 操作层轻透':'Android · 柔和实体层';$('platformNote').textContent=p==='ios'?'原生交付：系统 regular 玻璃承载操作；内容使用稳定实体表面。':'原生交付：Material 3 色调表面与系统按压反馈；本样张展示结构与状态。';}
$('iosButton').onclick=()=>setPlatform('ios');$('androidButton').onclick=()=>setPlatform('android');
function setTheme(t){stage.dataset.theme=t;$('editDialog').dataset.theme=t;for(const v of ['light','dark'])$(v+'Button').setAttribute('aria-pressed',String(t===v));}
$('lightButton').onclick=()=>setTheme('light');$('darkButton').onclick=()=>setTheme('dark');$('opaque').onchange=e=>stage.classList.toggle('opaque',e.target.checked);$('highContrast').onchange=e=>stage.classList.toggle('high-contrast',e.target.checked);
$('saveButton').onclick=()=>{if(['saving','syncing','checking','synced'].includes(state))return;const outcome=['unknown','local','syncFailed'].includes(state)?'synced':$('result').value;const checking=state==='unknown',syncing=['local','syncFailed'].includes(state);stopPending();const token=run;showState(checking?'checking':syncing?'syncing':'saving');timer=setTimeout(()=>{if(token===run)showState(outcome);},900);};
$('resetButton').onclick=()=>{stopPending();amount='3';$('amountView').textContent=amount;$('result').value='synced';showState('review');};
document.querySelectorAll('#stateGrid button').forEach(b=>b.onclick=()=>{stopPending();showState(b.dataset.state);stage.scrollIntoView({block:'center',behavior:'instant'});});
$('editButton').onclick=()=>{if($('editButton').disabled)return;$('amountInput').value=amount;$('editDialog').showModal();$('amountInput').focus();};$('cancelEdit').onclick=()=>$('editDialog').close();$('editForm').onsubmit=e=>{e.preventDefault();if(!$('editForm').reportValidity())return;stopPending();amount=$('amountInput').value;$('amountView').textContent=amount;showState('review');$('editDialog').close();};
document.querySelectorAll('.phone button').forEach(b=>b.addEventListener('pointerdown',()=>{if(stage.dataset.platform!=='android'||b.disabled||isReduced())return;const ripple=document.createElement('span');ripple.className='ripple';ripple.setAttribute('aria-hidden','true');b.append(ripple);setTimeout(()=>ripple.remove(),350);}));
const curves={
press:{name:'按压',ms:80,p:[.2,0,0,1],use:'按压：缩放 1 → .98；放开或取消后连续恢复。',frames:[{transform:'scale(1)'},{transform:'scale(.98)'}]},
release:{name:'释放',ms:180,p:[.2,.8,.2,1],use:'释放：缩放 .98 → 1；无超调，不延迟提交。',frames:[{transform:'scale(.98)'},{transform:'scale(1)'}]},
enter:{name:'展开',ms:280,p:[.16,1,.3,1],use:'内容入场：Y 12 → 0，透明度 0 → 1；无回弹。',frames:[{transform:'translateY(12px)',opacity:0},{transform:'translateY(0)',opacity:1}]},
exit:{name:'收起',ms:180,p:[.4,0,1,1],use:'内容离场：Y 0 → 8，透明度 1 → 0；焦点返回触发控件。',frames:[{transform:'translateY(0)',opacity:1},{transform:'translateY(8px)',opacity:0}]},
state:{name:'状态交接',ms:160,p:[.2,0,0,1],use:'图标淡入，关键状态文字立即更新；下方仅图标变化。',frames:[{opacity:.55},{opacity:1}]}};
function selectCurve(){cancelAnimationFrame(animationFrame);tileAnimation?.cancel();$('motionTile').style.opacity='1';$('motionTile').style.transform='none';const c=curves[$('curve').value],p=c.p;$('curveValue').textContent=`cubic-bezier(${p.join(', ')}) · ${c.ms}ms`;$('curveUse').textContent=c.use;$('curvePath').setAttribute('d',`M40 200 C${40+p[0]*280} ${200-p[1]*180},${40+p[2]*280} ${200-p[3]*180},320 20`);$('curveSvg').setAttribute('aria-label',`${c.name}缓动曲线：横轴时间，纵轴完成比例`);$('curveDot').setAttribute('cx','40');$('curveDot').setAttribute('cy','200');$('motionHint').textContent=isReduced()?'减少动态效果已启用：只保留即时状态。':'终点保持稳定；不会循环播放。';}
function coord(t,a,b){return 3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;}
function easingAt(x,p){let lo=0,hi=1;for(let i=0;i<16;i++){const t=(lo+hi)/2;if(coord(t,p[0],p[2])<x)lo=t;else hi=t;}return coord((lo+hi)/2,p[1],p[3]);}
$('curve').onchange=selectCurve;$('playCurve').onclick=()=>{cancelAnimationFrame(animationFrame);tileAnimation?.cancel();if(isReduced()){$('motionTile').style.opacity=$('curve').value==='exit'?'0':'1';$('motionTile').style.transform='none';$('curveDot').setAttribute('cx','320');$('curveDot').setAttribute('cy','20');$('motionHint').textContent='已即时切换终态；不播放位移、缩放或循环。';return;}const key=$('curve').value,c=curves[key],ms=c.ms*($('slow').checked?4:1),target=key==='state'?$('motionTile').querySelector('span'):$('motionTile');tileAnimation=target.animate(c.frames,{duration:ms,easing:`cubic-bezier(${c.p.join(',')})`,fill:'forwards'});$('motionHint').textContent=`${c.name} · ${ms}ms${$('slow').checked?'（评审慢放）':''}`;const start=performance.now();const draw=now=>{const x=Math.min(1,(now-start)/ms),y=easingAt(x,c.p);$('curveDot').setAttribute('cx',String(40+280*x));$('curveDot').setAttribute('cy',String(200-180*y));if(x<1)animationFrame=requestAnimationFrame(draw);};animationFrame=requestAnimationFrame(draw);};selectCurve();
