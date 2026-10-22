/* Four-step onboarding. Detailed fields are optional and saved locally only. */
const ONBOARDING_KEY=KEY+'-onboarding';
const CARE_ROLES=['妈妈','爸爸','爷爷/奶奶','外公/外婆','其他成员'];
const CARE_STAGES=['孕前','孕期','产后'];
const CARE_CONCERNS=['奶量够不够','宝宝吃饱了吗','宝宝为什么哭','宝宝便便情况','宝宝睡得好吗','宝宝生长发育','我的身体恢复','情绪起伏与压力','睡不够疲惫'];
const PROFILE_LIMITS={age:{min:18,max:50,unit:'岁',label:'妈妈年龄'},parity:{min:0,max:6,unit:'次',label:'已分娩次数'},birthWeeks:{min:37,max:50,unit:'周',label:'出生孕周'}};
function profileInteger(value,min,max){if(value===''||value==null)return true;const raw=String(value);return /^\d+$/.test(raw)&&Number(raw)>=min&&Number(raw)<=max;}
const profileToday=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
let onboardingStore;try{onboardingStore=JSON.parse(localStorage.getItem(ONBOARDING_KEY));}catch{}
let onboarding=onboardingStore&&typeof onboardingStore==='object'?onboardingStore:{status:'none',step:0,draft:null};
onboarding.step=Math.min(3,Math.max(0,Number(onboarding.step)||0));
const firstVisit=(!onboardingStore||onboardingStore.status==='none')&&!saved&&!storedConversations;
let onboardingReturn='home',onboardingStorageWarned=false;
function onboardingFromProfile(){return {role:profiles.careRole||'',stage:CARE_STAGES.includes(profiles.momStage)?profiles.momStage:'',age:profiles.momAge??'',parity:profiles.parity??'',pregnancyWeeks:profiles.pregnancyWeeks??'',babyCount:profiles.babyCount||'',babies:structuredClone(profiles.babies||[{birth:profiles.birth||'',weeks:profiles.birthWeeks||''}]),concerns:Array.isArray(profiles.concerns)?[...profiles.concerns]:[],omitted:{...profiles.omittedNumbers}};}
function storeOnboarding(){try{localStorage.setItem(ONBOARDING_KEY,JSON.stringify(onboarding));return true;}catch{if(!onboardingStorageWarned){onboardingStorageWarned=true;toast('资料草稿暂时仅保留在当前页面。');}return false;}}
function startOnboarding(){
 if(sheet.open)closeSheet();onboardingReturn=page==='onboarding'?'home':page;
 if(!['draft','paused'].includes(onboarding.status)||!onboarding.draft){onboarding.draft=onboardingFromProfile();onboarding.step=0;}
 onboarding.status='draft';storeOnboarding();go('onboarding');renderOnboarding(true);
}
function onboardingChoices(key,values){const d=onboarding.draft;return '<div class="onboarding-choices '+(key==='stage'?'stages':'')+'">'+values.map((v,i)=>'<button type="button" data-onboarding-choice="'+key+'" data-choice-index="'+i+'" aria-pressed="'+String(d[key]===v)+'">'+(key==='role'?icon(({妈妈:'mom',爸爸:'dad','爷爷/奶奶':'grandparents','外公/外婆':'grandparents','其他成员':'family'})[v]):'')+'<span>'+safe(v)+'</span>'+(d[key]===v?icon('check'):'')+'</button>').join('')+'</div>';}
function onboardingNumber(label,name,value,min,max,initial=30,unit='岁'){
 const raw=value===''||value==null?'':String(value),blank=raw==='',supported=profileInteger(raw,min,max),legacy=!blank&&!supported,id='onboard-'+name,selected=blank?'':supported?String(Number(raw)):raw;
  const options=[...(legacy?[{value:raw,text:'原值 '+raw,invalid:true}]:[]),{value:'',text:'暂不填'},...Array.from({length:max-min+1},(_,i)=>({value:String(min+i),text:(min+i)+' '+unit}))];
 const warning=legacy?'<small class="wheel-warning" id="'+id+'-warning">原值 '+safe(raw)+' 超出 '+min+'–'+max+unit+'，请重新选择或暂不填。</small>':'';
 return '<div class="wheel-field"><span class="wheel-label" id="'+id+'-label">'+label+'</span><div class="wheel-shell"><div class="wheel-focus" aria-hidden="true"></div><div class="number-wheel" id="'+id+'" role="spinbutton" tabindex="0" aria-labelledby="'+id+'-label" aria-valuemin="'+(min-1)+'" aria-valuemax="'+max+'" aria-valuenow="'+(blank||legacy?min-1:Number(selected))+'" aria-valuetext="'+(legacy?'原值 '+safe(raw)+'，需修改':blank?'暂不填':selected+unit)+'"'+(legacy?' aria-invalid="true" aria-describedby="'+id+'-warning"':'')+' data-wheel-name="'+name+'" data-unit="'+unit+'">'+options.map(o=>'<div class="wheel-option'+(o.value===selected?' selected':'')+'" data-wheel-value="'+safe(o.value)+'"'+(o.invalid?' data-wheel-invalid="true"':'')+' aria-hidden="true">'+safe(o.text)+'</div>').join('')+'</div></div><input type="hidden" name="'+name+'" value="'+safe(selected)+'" data-wheel-input>'+warning+'</div>';
}
function mountOnboardingWheels(){
 $$('#onboarding-form .number-wheel').forEach(wheel=>{
  const input=wheel.closest('.wheel-field').querySelector('input'),items=[...wheel.children],row=26;
  let timer,drag=null;
  const index=()=>Math.min(items.length-1,Math.max(0,Math.round(wheel.scrollTop/row)));
   const commit=()=>{if(!wheel.isConnected)return;const item=items[index()],value=item.dataset.wheelValue,invalid=item.dataset.wheelInvalid==='true',warning=wheel.closest('.wheel-field').querySelector('.wheel-warning');items.forEach(el=>el.classList.toggle('selected',el===item));wheel.setAttribute('aria-valuetext',invalid?'原值 '+value+'，需修改':value===''?'暂不填':value+wheel.dataset.unit);wheel.setAttribute('aria-valuenow',value===''||invalid?wheel.getAttribute('aria-valuemin'):value);wheel.setAttribute('aria-invalid',String(invalid));if(warning){warning.hidden=!invalid;if(invalid)wheel.setAttribute('aria-describedby',warning.id);else wheel.removeAttribute('aria-describedby');}if(input.value===value)return;input.value=value;const d=onboarding.draft;d.omitted??={};d.omitted[input.name]=value==='';if(value!==''){d.sliderValues??={};d.sliderValues[input.name]=Number(value);}readOnboardingFields();$('#onboarding-error').textContent='';};
  const settle=()=>{if(!wheel.isConnected||drag)return;wheel.scrollTop=index()*row;commit();if(input.name==='babyCount'&&Number(wheel.dataset.initialCount)!==(Number(input.value)||1)){renderOnboarding();$('#onboard-babyCount')?.focus({preventScroll:true});}};
  const choose=i=>{wheel.scrollTop=Math.min(items.length-1,Math.max(0,i))*row;commit();clearTimeout(timer);timer=setTimeout(settle,180);};
  wheel.scrollTop=Math.max(0,items.findIndex(el=>el.dataset.wheelValue===input.value))*row;wheel.dataset.initialCount=String(Number(input.value)||1);
  wheel.addEventListener('scroll',()=>{commit();clearTimeout(timer);timer=setTimeout(settle,180);},{passive:true});
  wheel.addEventListener('keydown',e=>{const moves={ArrowUp:-1,ArrowDown:1,PageUp:-5,PageDown:5};if(e.key in moves){e.preventDefault();choose(index()+moves[e.key]);}else if(e.key==='Home'||e.key==='End'){e.preventDefault();choose(e.key==='Home'?0:items.length-1);}});
  wheel.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;drag={id:e.pointerId,y:e.clientY,top:wheel.scrollTop,moved:false};wheel.setPointerCapture(e.pointerId);wheel.classList.add('dragging');wheel.focus({preventScroll:true});e.preventDefault();});
  wheel.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;if(Math.abs(e.clientY-drag.y)>3)drag.moved=true;wheel.scrollTop=drag.top+drag.y-e.clientY;commit();});
  wheel.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const moved=drag.moved;drag=null;wheel.releasePointerCapture(e.pointerId);wheel.classList.remove('dragging');if(!moved){const box=wheel.getBoundingClientRect();choose(index()+Math.floor((e.clientY-box.top)/row)-1);}else choose(index());});
  wheel.addEventListener('pointercancel',()=>{drag=null;wheel.classList.remove('dragging');settle();});
 });
}
function readOnboardingFields(){const f=$('#onboarding-form');if(!f)return;const d=onboarding.draft;for(const input of f.querySelectorAll('[name]')){if(input.hasAttribute('data-wheel-input')&&input.value!==''){d.sliderValues??={};d.sliderValues[input.name]=Number(input.value);}const inputValue=input.disabled?'':input.value;const m=input.name.match(/^baby-(\d+)-(birth|weeks)$/);if(m){d.babies[+m[1]]??={birth:'',weeks:''};d.babies[+m[1]][m[2]]=inputValue;}else d[input.name]=inputValue;}storeOnboarding();}
function onboardingRecommendations(concerns=onboarding.draft?.concerns||[]){const scores={record:0,cry:0,poop:0};(Array.isArray(concerns)?concerns:[]).forEach(c=>{if(c==='宝宝为什么哭')scores.cry+=2;else if(c==='宝宝便便情况')scores.poop+=2;else if(['奶量够不够','宝宝吃饱了吗'].includes(c))scores.record++;});return Object.keys(scores).sort((a,b)=>scores[b]-scores[a]).map(id=>({id,matched:scores[id]>0}));}
function sidebarReduced(){return prefs.reduced||reducedMotionQuery.matches;}
function openSidebar(){
 if(page!=='assistant'||onboarding.status==='draft')return;
 clearTimeout(sidebarCloseTimer);sidebarOpener=document.activeElement instanceof HTMLElement?document.activeElement:sidebarToggle;
 sidebarLayer.hidden=false;$('#scroll').inert=true;$('#record-cta').inert=true;sidebarToggle.setAttribute('aria-expanded','true');
 requestAnimationFrame(()=>{if(sidebarLayer.hidden)return;sidebarLayer.classList.add('is-open');sidebarPanel.focus({preventScroll:true});});
}
function closeSidebar({immediate=false,restoreFocus=true}={}){
 if(sidebarLayer.hidden)return;
 clearTimeout(sidebarCloseTimer);sidebarLayer.classList.remove('is-open');sidebarToggle.setAttribute('aria-expanded','false');
 const finish=()=>{sidebarLayer.hidden=true;$('#scroll').inert=false;$('#record-cta').inert=false;if(restoreFocus&&sidebarOpener?.isConnected&&!sidebarOpener.closest('[hidden]'))sidebarOpener.focus({preventScroll:true});sidebarOpener=null;};
 if(immediate||sidebarReduced())finish();else sidebarCloseTimer=setTimeout(finish,380);
}
function activateSidebar(item){
 if(item==='mine'){mineReturnPage='assistant';closeSidebar({immediate:true,restoreFocus:false});positions.mine=0;go('mine');requestAnimationFrame(()=>$('#mine .page-heading h2').focus({preventScroll:true}));return;}
 if(item==='baby'){babyReturnPage='assistant';closeSidebar({immediate:true,restoreFocus:false});positions.baby=0;go('baby');requestAnimationFrame(()=>$('#baby .page-heading h2').focus({preventScroll:true}));return;}
}
function renderOnboarding(reset=false){
 if(!onboarding.draft)onboarding.draft=onboardingFromProfile();const d=onboarding.draft,stage=onboarding.dateRepair&&onboarding.step===1?'':d.role==='妈妈'?d.stage:'',step=onboarding.step,body=$('#onboarding-body'),oldTop=body.scrollTop;
 const headings=['先认识你的照护角色','补充一点照护背景','把关心的事放在前面','为你准备的照护工具'];
 $('#onboarding-title').textContent=headings[step];$('#onboarding-step').textContent='第 '+(step+1)+' 步，共 4 步';
 $('#onboarding-progress').innerHTML=['身份','基础资料','关注点','功能推荐'].map((t,i)=>'<span class="'+(i<=step?'done':'')+'" '+(i===step?'aria-current="step"':'')+'><b>'+(i+1)+'</b>'+t+'</span>').join('');
 $('#onboarding-back').hidden=step===0;$('#onboarding-next').textContent=step===3?'完成，开始对话':step===2?'查看推荐':'继续';$('#onboarding-error').textContent='';
 let content='';
  if(step===0)content='<p class="onboarding-intro">先选择照护身份，其余资料可以稍后补充。</p><fieldset><legend>你是宝宝的 <small>必选</small></legend>'+onboardingChoices('role',CARE_ROLES)+'</fieldset>'+(d.role==='妈妈'?'<fieldset class="mother-stage"><legend>妈妈当前阶段 <small>选填</small></legend>'+onboardingChoices('stage',CARE_STAGES)+'<button type="button" class="text-button" data-action="onboarding-stage-later">稍后选择阶段</button></fieldset>':'');
 if(step===1){
  content=(onboarding.dateRepair?'<p class="status-note">先修正已有宝宝的出生日期，不会改变你选择的妈妈阶段。</p>':'')+'<p class="onboarding-intro wheel-hint">上下滑动选择 · 滚轮首项可暂不填</p><section class="onboarding-section profile-compact"><h3>'+icon('mom')+'妈妈信息</h3><div class="wheel-grid">'+onboardingNumber('年龄','age',d.age,PROFILE_LIMITS.age.min,PROFILE_LIMITS.age.max,30,'岁')+onboardingNumber('已分娩次数','parity',d.parity,PROFILE_LIMITS.parity.min,PROFILE_LIMITS.parity.max,stage==='产后'?1:0,'次')+'</div><p class="compact-note">双胞胎算 1 次；产后包含本次分娩。</p></section>';
 if(stage!=='孕前'){
  const count=Math.min(6,Math.max(1,Number(d.babyCount)||1)),active=Math.min(count-1,Math.max(0,Number(d.activeBaby)||0));d.activeBaby=active;
 content+='<section class="onboarding-section profile-compact"><div class="baby-section-heading"><h3>'+icon('baby')+(stage==='孕期'?'宝宝信息 · 孕期':'宝宝信息')+'</h3>'+(stage!=='孕期'&&count>1?'<div class="baby-tabs" role="group" aria-label="选择宝宝">'+Array.from({length:count},(_,i)=>'<button type="button" data-onboarding-baby="'+i+'" aria-pressed="'+(i===active)+'">宝宝 '+(i+1)+'</button>').join('')+'</div>':'')+'</div><div class="wheel-grid">'+onboardingNumber(stage==='孕期'?'胎儿数量':'宝宝数量','babyCount',d.babyCount,1,6,1,'个');
 if(stage==='孕期')content+=onboardingNumber('当前孕周','pregnancyWeeks',d.pregnancyWeeks,0,45,20,'周')+'</div>';
  else{const b=d.babies[active]||{birth:'',weeks:''};content+=onboardingNumber('出生孕周','baby-'+active+'-weeks',b.weeks,PROFILE_LIMITS.birthWeeks.min,PROFILE_LIMITS.birthWeeks.max,40,'周')+'</div><label class="compact-birthday"><span>出生日期 <small>选填</small></span><input aria-label="宝宝 '+(active+1)+' 出生日期" type="date" name="baby-'+active+'-birth" value="'+safe(b.birth)+'" max="'+profileToday()+'"></label>'+(count>1?'<p class="compact-note">当前填写宝宝 '+(active+1)+'；首页建议以宝宝 1 的资料为依据。</p>':'');}
 content+='</section>';}
 if(stage==='孕前')content+='<div class="status-note">'+icon('heart')+'<span>目前无需填写宝宝生日和孕周；进入孕期后可再补充。</span></div>';
 }
 if(step===2){content='<p class="onboarding-intro">可多选，也可以先不选。以后随时调整。</p><fieldset><legend>你最关心什么？</legend><div class="concern-choices">'+CARE_CONCERNS.map((c,i)=>'<button type="button" data-task="'+(['feed','feed','crying','diaper','sleep','growth','recovery','emotion','rest'][i])+'" data-onboarding-concern="'+i+'" aria-pressed="'+String(d.concerns.includes(c))+'">'+icon(['bottle','baby-satisfied','waveform','diaper','moon','growth','recovery','emotion','rest'][i])+'<span>'+c+'</span>'+(d.concerns.includes(c)?icon('check','choice-check'):'')+'</button>').join('')+'</div></fieldset>';}
 if(step===3){content='<p class="onboarding-intro">根据你的关注点，为你整理了这些照护工具。</p><section class="onboarding-section recommendation-page"><h3>'+icon('sparkles')+'为你推荐</h3><p class="caption">'+(d.concerns.length?'按关注点调整顺序，所有功能仍可使用。':'先从这些照护工具开始。')+'</p><div class="onboarding-recommendations">'+onboardingRecommendations().map((r,i)=>{const names={record:'持续记录与管理',cry:'哭声识别',poop:'便便识别'},descs={record:'记录喂养、尿布与吸奶，回顾已记录的变化。',cry:'从「听哭闹」开始，采集后由你确认是否分析。',poop:'从「看便便」开始，先确认照片，再进行观察。'};return '<article data-task="'+({record:'feed',cry:'crying',poop:'diaper'}[r.id])+'">'+icon(CARE_ACTIONS[r.id].icon)+'<div><b>'+names[r.id]+'</b><p>'+descs[r.id]+'</p></div>'+(r.matched?'<small>与你的关注相关</small>':'')+'</article>';}).join('')+'</div>'+(['孕前','孕期'].includes(stage)?'<p class="caption">哭声与便便功能可在宝宝出生后使用。</p>':'')+(d.concerns.some(c=>CARE_CONCERNS.indexOf(c)>=4)?'<p class="caption">身体、情绪、睡眠与发育等关注会保留为照护背景，也可以在 Momcozy AI 中继续聊聊。</p>':'')+'<p class="caption">本原型展示交互流程，识别功能为模拟。</p></section>';}
 $('#onboarding').classList.toggle('compact-details',step===1);body.innerHTML='<form id="onboarding-form" class="form-stack" novalidate>'+content+'</form>';body.scrollTop=reset?0:oldTop;hydrateIcons();mountOnboardingWheels();if(reset)$('#onboarding-title').focus({preventScroll:true});
}
function onboardingBabiesToSave(d){
 const stage=d.role==='妈妈'?d.stage:'',post=!['孕前','孕期'].includes(stage);
 if(post||onboarding.dateRepair)return Array.from({length:Number(d.babyCount)||1},(_,i)=>({...{birth:'',weeks:''},...d.babies[i]}));
 return structuredClone(profiles.babies?.length?profiles.babies:(profiles.birth?[{birth:profiles.birth,weeks:profiles.birthWeeks||''}]:[]));
}
function validProfileBirth(birth){
 if(!birth)return true;if(!/^\d{4}-\d{2}-\d{2}$/.test(birth)||birth>profileToday())return false;
 const parsed=new Date(birth+'T12:00:00Z');return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===birth;
}
function onboardingRangeError(d){
 const stage=d.role==='妈妈'?d.stage:'',post=!['孕前','孕期'].includes(stage)||!!onboarding.dateRepair;
 const fields=[{name:'age',value:d.age,...PROFILE_LIMITS.age},{name:'parity',value:d.parity,...PROFILE_LIMITS.parity}];
 if(stage==='孕期'&&!onboarding.dateRepair)fields.push({name:'pregnancyWeeks',value:d.pregnancyWeeks,min:0,max:45,unit:'周',label:'当前孕周'});
 if(stage!=='孕前'||onboarding.dateRepair)fields.push({name:'babyCount',value:d.babyCount,min:1,max:6,unit:'个',label:stage==='孕期'?'胎儿数量':'宝宝数量'});
 const invalid=fields.find(f=>!profileInteger(f.value,f.min,f.max));if(invalid)return invalid;
 if(post){const babies=onboardingBabiesToSave(d);for(let i=0;i<babies.length;i++)if(!profileInteger(babies[i]?.weeks,PROFILE_LIMITS.birthWeeks.min,PROFILE_LIMITS.birthWeeks.max))return {name:'baby-'+i+'-weeks',value:babies[i].weeks,babyIndex:i,...PROFILE_LIMITS.birthWeeks,label:'宝宝 '+(i+1)+' 出生孕周'};}
 return null;
}
function validateOnboarding(){
 readOnboardingFields();const d=onboarding.draft;
 if(onboarding.step===0&&!CARE_ROLES.includes(d.role)){$('#onboarding-error').textContent='请选择照护身份，也可选择稍后设置。';return false;}
  const invalid=[...$('#onboarding-form').querySelectorAll('input,select')].find(el=>!el.checkValidity());
 if(invalid){$('#onboarding-error').textContent=invalid.type==='date'?'请填写有效的出生日期，不能晚于今天。':'请填写范围内的整数；不确定时可留空。';invalid.focus();return false;}
  if(onboarding.step===1||onboarding.step===3){
   const badNumber=onboardingRangeError(d);
   if(badNumber){onboarding.step=1;if(badNumber.babyIndex!==undefined)d.activeBaby=badNumber.babyIndex;storeOnboarding();renderOnboarding(true);$('#onboarding-error').textContent=badNumber.label+'仅支持 '+badNumber.min+'–'+badNumber.max+badNumber.unit+'；请选择范围内整数，或暂不填。';const wheel=$('#onboard-'+badNumber.name);if(wheel){wheel.setAttribute('aria-invalid','true');wheel.setAttribute('aria-describedby','onboarding-error');wheel.focus();}return false;}
   const babies=onboardingBabiesToSave(d),bad=babies.findIndex(b=>!validProfileBirth(b.birth));
  if(bad>=0){
   if(['孕前','孕期'].includes(d.role==='妈妈'?d.stage:'')){onboarding.dateRepair=true;d.babies=babies;d.babyCount=babies.length;}
   onboarding.step=1;d.activeBaby=bad;storeOnboarding();renderOnboarding();
   $('#onboarding-error').textContent='请检查宝宝 '+(bad+1)+' 的出生日期，不能晚于今天；也可以暂不填写。';
   const input=$('[name="baby-'+bad+'-birth"]');if(input){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby','onboarding-error');input.focus();}return false;
  }
 }
 return true;
}
function finishOnboarding(){
 if(!validateOnboarding())return;
 const d=onboarding.draft,stage=d.role==='妈妈'?d.stage:'',post=!['孕前','孕期'].includes(stage),pregnant=stage==='孕期',count=Number(d.babyCount)||null;
 const babies=onboardingBabiesToSave(d);
 profiles={...profiles,careRole:d.role,momStage:d.role==='妈妈'?d.stage:(profiles.momStage||''),momAge:d.age,parity:d.parity,pregnancyWeeks:pregnant?d.pregnancyWeeks:'',babyCount:post?count:babies.length||count,babies,birth:babies[0]?.birth||'',birthWeeks:babies[0]?.weeks||'',concerns:[...d.concerns],omittedNumbers:{...d.omitted},focus:d.concerns.join('、')};
 const ok=persist();onboarding.status=ok?'completed':'paused';onboarding.step=ok?0:3;onboarding.draft=ok?null:d;if(ok)delete onboarding.dateRepair;const onboardingOk=storeOnboarding();go('home');toast(ok&&onboardingOk?'资料已保存，欢迎来到 Momcozy AI':'资料已更新，但未能完整保存到浏览器；请稍后重试');
}
function nextOnboarding(){if(!validateOnboarding())return;if(onboarding.step<3){onboarding.step++;storeOnboarding();renderOnboarding(true);}else finishOnboarding();}
function leaveOnboarding(){readOnboardingFields();onboarding.status='paused';storeOnboarding();go(onboardingReturn);toast('可以稍后在「我的 → 基础照护资料」继续补充。');}

