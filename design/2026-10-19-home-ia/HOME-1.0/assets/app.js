/* Local keyword routing: opens existing demo flows, never records or captures automatically. */
const CARE_ACTIONS={record:{label:'记一笔',icon:'journal'},cry:{label:'听哭闹',icon:'waveform'},poop:{label:'看便便',icon:'diaper'}};
function detectCareIntents(text){
 const clauses=String(text).toLowerCase().split(/[，,。！!？?；;\n]|但是|不过|而是/).filter(c=>!/(不要|不用|不想|不需要|暂不|别|无需|取消|停止)/.test(c));
 const patterns={record:/记一笔|记一下|记录|记下|记个|喂养|喂奶|奶量|吸奶|亲喂|换尿布|\b(log|record|feeding)\b/,cry:/哭闹|哭声|哭了|一直哭|哭不停|听哭|\b(cry|crying)\b/,poop:/便便|大便|排便|便秘|腹泻|拉肚子|\b(poop|stool)\b/};
 return Object.keys(CARE_ACTIONS).filter(k=>clauses.some(c=>patterns[k].test(c)));
}

/* Local interaction demonstration. No server, model, device, microphone or camera is connected. */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const safe=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NOW='2026-10-19T15:00',DAY=NOW.slice(0,10),KEY='momcozy-home-1.0';
const TYPES={'亲喂':'breast','配方奶':'formula','瓶喂母乳':'bottle','换尿布':'diaper','吸奶':'pump'};
const seed=[{id:'s1',type:'瓶喂母乳',owner:'宝宝',amount:120,time:DAY+'T14:20'},{id:'s2',type:'换尿布',owner:'宝宝',kind:'嘘嘘',rash:'无',time:DAY+'T13:50'},{id:'s3',type:'吸奶',owner:'妈妈',amount:120,time:DAY+'T13:00'},{id:'s4',type:'配方奶',owner:'宝宝',amount:80,time:DAY+'T11:40'},{id:'s5',type:'亲喂',owner:'宝宝',side:'左侧',duration:15,time:DAY+'T09:30'},{id:'s6',type:'吸奶',owner:'妈妈',amount:110,time:DAY+'T09:00'},{id:'s7',type:'瓶喂母乳',owner:'宝宝',amount:100,time:DAY+'T07:10'},{id:'s8',type:'吸奶',owner:'妈妈',amount:130,time:DAY+'T06:30'}].map(r=>({...r,sync:'示例',note:''}));
let saved;try{saved=JSON.parse(localStorage.getItem(KEY));}catch{}
let records=Array.isArray(saved?.records)?saved.records:[],profiles=saved?.profiles||{baby:'宝宝',birth:'',momStage:'',focus:''},prefs={theme:'light',platform:'ios',reduced:false,transparency:false,contrast:false,...saved?.prefs};
let page='home',owner='宝宝',positions={},drafts={},formContext=null,saveJob=null,saveTimer=null,task=null,taskHistory=[],messages=[],attachment='',chatBusy=false,chatTimer,toastTimer,taskTimer,speechTimer,scenario='normal',analysisOutcome='indeterminate',homeMode='normal',deviceConnected=false,syncBusy=false,syncTimer,pausedByBackground=false;
const sheet=$('#sheet');
let resetInProgress=false;const deletedRecordIds=new Set(saved?.deletedRecordIds||[]);let inlineSaveTimer=null;

const CHAT_KEY=KEY+'-conversations';
let storedConversations;try{storedConversations=JSON.parse(localStorage.getItem(CHAT_KEY));}catch{}
let conversations=Array.isArray(storedConversations?.items)?storedConversations.items.filter(c=>c&&typeof c.id==='string'&&c.payload&&Array.isArray(c.payload.messages)):[];
let activeConversationId=conversations.some(c=>c.id===storedConversations?.activeId)?storedConversations.activeId:null,conversationEpoch=0,chatSaveTimer,chatStorageAvailable=true,chatStorageWarned=false;
const initialConversation=conversations.find(c=>c.id===activeConversationId);
function persistConversations(){try{localStorage.setItem(CHAT_KEY,JSON.stringify({version:1,activeId:activeConversationId,items:conversations}));chatStorageAvailable=true;return true;}catch{chatStorageAvailable=false;if(!chatStorageWarned){chatStorageWarned=true;toast('对话暂时仅保留在本次会话中，浏览器存储不可用。');}return false;}}
function checkpointConversation(){
 clearTimeout(chatSaveTimer);const draft=$('#chat-message').value;
 if(resetInProgress)return;
 if(!messages.length&&!task&&!taskHistory.length&&!draft.trim()&&!attachment){if(activeConversationId){conversations=conversations.filter(c=>c.id!==activeConversationId);activeConversationId=null;persistConversations();}return;}
 if(!activeConversationId)activeConversationId='chat-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
 const payload=structuredClone({messages,task,taskHistory,draft,attachment,pendingReply:chatBusy});
 const current=conversations.find(c=>c.id===activeConversationId);
 if(current&&JSON.stringify(current.payload)===JSON.stringify(payload))return;
 const title=current?.customTitle||(messages.find(m=>m.role==='user')?.text||(task?CARE_ACTIONS[task.kind]?.label:'')||draft||'素材对话').replace(/\s+/g,' ').slice(0,28);
 const record={id:activeConversationId,title,customTitle:current?.customTitle||'',updatedAt:new Date().toISOString(),payload};
 if(current)conversations[conversations.indexOf(current)]=record;else conversations.push(record);
 persistConversations();
}
function stopConversationWork(){
 conversationEpoch++;cancelChatFollow();clearTimeout(chatTimer);clearTimeout(inlineSaveTimer);if(task?.kind==='record'&&task.recordJob?.state==='saving')task.recordJob.state='failed';clearTimeout(taskTimer);clearTimeout(speechTimer);clearTimeout(chatSaveTimer);stopVoice();
 if(chatBusy)messages.push({role:'assistant',text:'本次回复已暂停。你可以继续发送消息。'});
 chatBusy=false;$('#chat-status').innerHTML='';
 if(task&&['listening','processing','speaking'].includes(task.state)){task.beforePause=task.state==='speaking'?'result':task.state;task.state='interrupted';}
}
function loadConversationState(record){
 const data=structuredClone(record.payload);activeConversationId=record.id;
 messages=data.messages.filter(m=>m&&(['user','assistant'].includes(m.role)&&typeof m.text==='string'||m.role==='task'&&m.taskId)).map(m=>({...m,actions:(m.actions||[]).filter(id=>CARE_ACTIONS[id])}));
 task=data.task&&['cry','poop','record'].includes(data.task.kind)?data.task:null;taskHistory=Array.isArray(data.taskHistory)?data.taskHistory:[];migrateTaskTimeline();if(task?.recordJob?.state==='saving')task.recordJob.state='failed';
 attachment=typeof data.attachment==='string'?data.attachment:'';$('#chat-message').value=typeof data.draft==='string'?data.draft:'';
 if(data.pendingReply)messages.push({role:'assistant',text:'上次回复已暂停。你可以继续发送消息。'});
 if(task&&['listening','processing','speaking'].includes(task.state)){task.beforePause=task.state==='speaking'?'result':task.state;task.state='interrupted';}
 chatBusy=false;$('#chat-status').innerHTML='';
}
function newConversation(){
 stopConversationWork();checkpointConversation();if(sheet.open)closeSheet();
 activeConversationId=null;messages=[];task=null;taskHistory=[];attachment='';pausedByBackground=false;$('#chat-message').value='';
 persistConversations();latestChatPending=false;chatPinned=true;go('assistant');$('#assistant-scroll').scrollTop=0;
 $('#assistant h2').tabIndex=-1;$('#assistant h2').focus({preventScroll:true});
}
function openConversation(id){
 const record=conversations.find(c=>c.id===id);if(!record)return;
 if(id!==activeConversationId){stopConversationWork();checkpointConversation();loadConversationState(record);persistConversations();}
 closeSheet();go('assistant');if(messages.length||task)scrollChatLatest();else $('#assistant-scroll').scrollTop=0;
}

let historyQuery='';
function historyMatches(c,query){const terms=query.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);const haystack=[c.title,...c.payload.messages.map(m=>m.text),c.payload.draft||''].join(' ').normalize('NFKC').toLocaleLowerCase();return terms.every(term=>haystack.includes(term));}
function renderHistoryResults(){
 const list=[...conversations].filter(c=>historyMatches(c,historyQuery)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 $('#history-count').textContent=historyQuery.trim()?'找到 '+list.length+' 段对话':'共 '+list.length+' 段对话';
 $('#history-results').innerHTML=list.length?'<div class="chat-history-list">'+list.map(c=>{const p=c.payload,last=p.messages.at(-1),preview=last?.text||p.draft||(p.task?'专项任务 · '+(taskNames[p.task.state]||'已暂停'):'素材草稿');const date=new Date(c.updatedAt).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});return '<article class="chat-history-row"><button class="chat-history-item" data-open-conversation="'+safe(c.id)+'" aria-current="'+String(c.id===activeConversationId)+'">'+icon('journal')+'<span class="chat-history-copy"><b>'+safe(c.title)+'</b><small>'+safe(date)+' · '+p.messages.length+' 条消息'+(c.id===activeConversationId?' · 当前对话':'')+'</small><small class="chat-history-preview">'+safe(preview)+'</small></span>'+icon('chevron-right')+'</button><div class="history-row-actions"><button data-rename-conversation="'+safe(c.id)+'" aria-label="重命名：'+safe(c.title)+'">'+icon('edit')+'重命名</button><button class="danger" data-delete-conversation="'+safe(c.id)+'" aria-label="删除：'+safe(c.title)+'">'+icon('trash')+'删除</button></div></article>';}).join('')+'</div>':'<div class="empty">'+icon('journal')+'<h3>'+(historyQuery.trim()?'没有匹配的对话':'还没有历史对话')+'</h3><p>'+(historyQuery.trim()?'试试其他关键词，或清除搜索。':'开始交流后，对话会自动保存在这里。')+'</p>'+(historyQuery.trim()?'<button class="text-button" data-action="clear-history-search">清除搜索</button>':'')+'</div>';
}
function conversationHistory(){
 checkpointConversation();const description=chatStorageAvailable?'对话保存在当前浏览器，可搜索标题和消息内容。':'当前仅在本次会话保留；浏览器存储不可用，关闭页面后可能丢失。';
 openSheet('历史对话','<p class="sheet-description">'+description+'</p><label class="history-search"><span class="sr-only">搜索历史对话</span><input id="history-search" type="search" placeholder="搜索标题或聊天内容" value="'+safe(historyQuery)+'" maxlength="120" autocomplete="off"></label><div class="history-toolbar"><span id="history-count" class="caption" role="status"></span><button class="text-button" data-action="new-chat">'+icon('plus')+'新对话</button></div><div id="history-results"></div>','chat-history');renderHistoryResults();
}
function renameConversation(id){
 const c=conversations.find(c=>c.id===id);if(!c)return;
 openSheet('重命名对话','<form id="rename-conversation" data-id="'+safe(id)+'" class="form-stack"><label><span>对话名称</span><input name="title" id="conversation-title" value="'+safe(c.title)+'" maxlength="60" required autocomplete="off" aria-describedby="rename-error"></label><p class="caption">最多 60 个字符。重命名不会修改聊天内容。</p><p id="rename-error" class="field-error" role="alert"></p><div class="row-actions"><button type="button" class="secondary" data-action="chat-history">取消</button><button class="primary" type="submit">保存名称</button></div></form>','rename-conversation');
}
function submitConversationName(e){
 e.preventDefault();const title=String(new FormData(e.target).get('title')||'').trim().replace(/\s+/g,' ');if(!title){$('#rename-error').textContent='请输入对话名称，不能只包含空格。';return;}
 const c=conversations.find(c=>c.id===e.target.dataset.id);if(!c){conversationHistory();return;}c.title=title;c.customTitle=title;const ok=persistConversations();conversationHistory();toast(ok?'对话已重命名':'名称已更新，仅当前会话有效');
}
function confirmDeleteConversation(id){
 const c=conversations.find(c=>c.id===id);if(!c)return;
 openSheet('删除这段对话？','<p class="delete-chat-title">'+safe(c.title)+'</p><p class="sheet-description">这段对话中的消息、输入草稿和任务进度将一并删除，删除后无法恢复。'+(id===activeConversationId?'删除当前对话后，将回到默认欢迎页。':'')+'其他对话保持不变。</p><div class="row-actions"><button class="secondary" data-action="chat-history">取消</button><button class="primary" data-confirm-chat-delete="'+safe(id)+'">确认删除</button></div>','delete-conversation');
}
function deleteConversation(id){
 if(!conversations.some(c=>c.id===id))return;const current=id===activeConversationId;
 if(current){stopConversationWork();activeConversationId=null;messages=[];task=null;taskHistory=[];attachment='';pausedByBackground=false;$('#chat-message').value='';cancelChatFollow();chatPinned=true;}
 conversations=conversations.filter(c=>c.id!==id);const ok=persistConversations();
 if(current){closeSheet();go('assistant');$('#assistant-scroll').scrollTop=0;$('#assistant h2').tabIndex=-1;$('#assistant h2').focus({preventScroll:true});}else conversationHistory();
 toast(ok?'对话已删除': '已从当前会话删除，浏览器未能保存此变更');
}


/* Four-step onboarding. Detailed fields are optional and saved locally only. */
const ONBOARDING_KEY=KEY+'-onboarding';
const CARE_ROLES=['妈妈','爸爸','爷爷/奶奶','外公/外婆','其他成员'];
const CARE_STAGES=['孕前','孕期','产后'];
const CARE_CONCERNS=['奶量够不够','宝宝吃饱了吗','宝宝为什么哭','宝宝便便情况','宝宝睡得好吗','宝宝生长发育','我的身体恢复','情绪起伏与压力','睡不够疲惫'];
const profileToday=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
let onboardingStore;try{onboardingStore=JSON.parse(localStorage.getItem(ONBOARDING_KEY));}catch{}
let onboarding=onboardingStore&&typeof onboardingStore==='object'?onboardingStore:{status:'none',step:0,draft:null};
onboarding.step=Math.min(3,Math.max(0,Number(onboarding.step)||0));
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
 const omitted=!!onboarding.draft.omitted?.[name],n=value===''||value==null?(onboarding.draft.sliderValues?.[name]??initial):Math.min(max,Math.max(min,Number(value))),id='onboard-'+name;
 const options=[{value:'',text:'暂不填'},...Array.from({length:max-min+1},(_,i)=>({value:String(min+i),text:(min+i)+' '+unit}))],selected=omitted?'':String(n);
 return '<div class="wheel-field"><span class="wheel-label" id="'+id+'-label">'+label+'</span><div class="wheel-shell"><div class="wheel-focus" aria-hidden="true"></div><div class="number-wheel" id="'+id+'" role="spinbutton" tabindex="0" aria-labelledby="'+id+'-label" aria-valuemin="'+(min-1)+'" aria-valuemax="'+max+'" aria-valuenow="'+(omitted?min-1:n)+'" aria-valuetext="'+(omitted?'暂不填':n+unit)+'" data-wheel-name="'+name+'" data-unit="'+unit+'">'+options.map(o=>'<div class="wheel-option'+(o.value===selected?' selected':'')+'" data-wheel-value="'+o.value+'" aria-hidden="true">'+o.text+'</div>').join('')+'</div></div><input type="hidden" name="'+name+'" value="'+selected+'" data-wheel-input></div>';
}
function mountOnboardingWheels(){
 $$('#onboarding-form .number-wheel').forEach(wheel=>{
  const input=wheel.closest('.wheel-field').querySelector('input'),items=[...wheel.children],row=26;
  let timer,drag=null;
  const index=()=>Math.min(items.length-1,Math.max(0,Math.round(wheel.scrollTop/row)));
  const commit=()=>{if(!wheel.isConnected)return;const item=items[index()],value=item.dataset.wheelValue;items.forEach(el=>el.classList.toggle('selected',el===item));wheel.setAttribute('aria-valuetext',item.textContent);wheel.setAttribute('aria-valuenow',value===''?wheel.getAttribute('aria-valuemin'):value);if(input.value===value)return;input.value=value;const d=onboarding.draft;d.omitted??={};d.omitted[input.name]=value==='';if(value!==''){d.sliderValues??={};d.sliderValues[input.name]=Number(value);}readOnboardingFields();};
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
function onboardingRecommendations(){const concerns=onboarding.draft.concerns||[];const scores={record:0,cry:0,poop:0};concerns.forEach(c=>{if(c==='宝宝为什么哭')scores.cry+=2;else if(c==='宝宝便便情况')scores.poop+=2;else if(['奶量够不够','宝宝吃饱了吗'].includes(c))scores.record++;});return Object.keys(scores).sort((a,b)=>scores[b]-scores[a]).map(id=>({id,matched:scores[id]>0}));}
function renderOnboarding(reset=false){
 if(!onboarding.draft)onboarding.draft=onboardingFromProfile();const d=onboarding.draft,stage=onboarding.dateRepair&&onboarding.step===1?'':d.role==='妈妈'?d.stage:'',step=onboarding.step,body=$('#onboarding-body'),oldTop=body.scrollTop;
 const headings=['先认识你的照护角色','补充一点照护背景','把关心的事放在前面','为你准备的照护工具'];
 $('#onboarding-title').textContent=headings[step];$('#onboarding-step').textContent='第 '+(step+1)+' 步，共 4 步';
 $('#onboarding-progress').innerHTML=['身份','基础资料','关注点','功能推荐'].map((t,i)=>'<span class="'+(i<=step?'done':'')+'" '+(i===step?'aria-current="step"':'')+'><b>'+(i+1)+'</b>'+t+'</span>').join('');
 $('#onboarding-back').hidden=step===0;$('#onboarding-next').textContent=step===3?'完成，进入 Today':step===2?'查看推荐':'继续';$('#onboarding-error').textContent='';
 let content='';
 if(step===0)content='<p class="onboarding-intro">不同的角色，一起照顾妈妈和宝宝。</p><fieldset><legend>你是宝宝的 <small>必选</small></legend>'+onboardingChoices('role',CARE_ROLES)+'</fieldset>'+(d.role==='妈妈'?'<fieldset class="mother-stage"><legend>妈妈当前阶段 <small>选填</small></legend>'+onboardingChoices('stage',CARE_STAGES)+'<button type="button" class="text-button" data-action="onboarding-stage-later">稍后选择阶段</button></fieldset>':'');
 if(step===1){
 content=(onboarding.dateRepair?'<p class="status-note">先修正已有宝宝的出生日期，不会改变你选择的妈妈阶段。</p>':'')+'<p class="onboarding-intro wheel-hint">上下滑动选择 · 滚轮首项可暂不填</p><section class="onboarding-section profile-compact"><h3>'+icon('mom')+'妈妈信息</h3><div class="wheel-grid">'+onboardingNumber('年龄','age',d.age,1,120,30,'岁')+onboardingNumber('已分娩次数','parity',d.parity,0,20,stage==='产后'?1:0,'次')+'</div><p class="compact-note">双胞胎算 1 次；产后包含本次分娩。</p></section>';
 if(stage!=='孕前'){
 const count=Number(d.babyCount)||1,active=Math.min(count-1,Math.max(0,Number(d.activeBaby)||0));d.activeBaby=active;
 content+='<section class="onboarding-section profile-compact"><div class="baby-section-heading"><h3>'+icon('baby')+(stage==='孕期'?'宝宝信息 · 孕期':'宝宝信息')+'</h3>'+(stage!=='孕期'&&count>1?'<div class="baby-tabs" role="group" aria-label="选择宝宝">'+Array.from({length:count},(_,i)=>'<button type="button" data-onboarding-baby="'+i+'" aria-pressed="'+(i===active)+'">宝宝 '+(i+1)+'</button>').join('')+'</div>':'')+'</div><div class="wheel-grid">'+onboardingNumber(stage==='孕期'?'胎儿数量':'宝宝数量','babyCount',d.babyCount,1,6,1,'个');
 if(stage==='孕期')content+=onboardingNumber('当前孕周','pregnancyWeeks',d.pregnancyWeeks,0,45,20,'周')+'</div>';
 else{const b=d.babies[active]||{birth:'',weeks:''};content+=onboardingNumber('出生孕周','baby-'+active+'-weeks',b.weeks,1,45,40,'周')+'</div><label class="compact-birthday"><span>出生日期 <small>选填</small></span><input aria-label="宝宝 '+(active+1)+' 出生日期" type="date" name="baby-'+active+'-birth" value="'+safe(b.birth)+'" max="'+profileToday()+'"></label>'+(count>1?'<p class="compact-note">当前填写宝宝 '+(active+1)+'；Today 以宝宝 1 显示天数。</p>':'');}
 content+='</section>';}
 if(stage==='孕前')content+='<div class="status-note">'+icon('heart')+'<span>目前无需填写宝宝生日和孕周；进入孕期后可再补充。</span></div>';
 }
 if(step===2){content='<p class="onboarding-intro">可多选，也可以先不选。以后随时调整。</p><fieldset><legend>你最关心什么？</legend><div class="concern-choices">'+CARE_CONCERNS.map((c,i)=>'<button type="button" data-onboarding-concern="'+i+'" aria-pressed="'+String(d.concerns.includes(c))+'">'+icon(['bottle','baby-satisfied','waveform','diaper','moon','growth','recovery','emotion','rest'][i])+'<span>'+c+'</span>'+(d.concerns.includes(c)?icon('check','choice-check'):'')+'</button>').join('')+'</div></fieldset>';}
 if(step===3){content='<p class="onboarding-intro">根据你的关注点，为你整理了这些照护工具。</p><section class="onboarding-section recommendation-page"><h3>'+icon('sparkles')+'为你推荐</h3><p class="caption">'+(d.concerns.length?'按关注点调整顺序，所有功能仍可使用。':'先从这些照护工具开始。')+'</p><div class="onboarding-recommendations">'+onboardingRecommendations().map((r,i)=>{const names={record:'持续记录与管理',cry:'哭声识别',poop:'便便识别'},descs={record:'记录喂养、尿布与吸奶，回顾已记录的变化。',cry:'从「听哭闹」开始，采集后由你确认是否分析。',poop:'从「看便便」开始，先确认照片，再进行观察。'};return '<article>'+icon(CARE_ACTIONS[r.id].icon)+'<div><b>'+names[r.id]+'</b><p>'+descs[r.id]+'</p></div>'+(r.matched?'<small>与你的关注相关</small>':'')+'</article>';}).join('')+'</div>'+(['孕前','孕期'].includes(stage)?'<p class="caption">哭声与便便功能可在宝宝出生后使用。</p>':'')+(d.concerns.some(c=>CARE_CONCERNS.indexOf(c)>=4)?'<p class="caption">身体、情绪、睡眠与发育等关注会保留为照护背景，也可以在 Momcozy AI 中继续聊聊。</p>':'')+'<p class="caption">本原型展示交互流程，识别功能为模拟。</p></section>';}
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
function validateOnboarding(){
 readOnboardingFields();const d=onboarding.draft;
 if(onboarding.step===0&&!CARE_ROLES.includes(d.role)){$('#onboarding-error').textContent='请选择照护身份，也可选择稍后设置。';return false;}
 const invalid=[...$('#onboarding-form').querySelectorAll('input,select')].find(el=>!el.checkValidity());
 if(invalid){$('#onboarding-error').textContent=invalid.type==='date'?'请填写有效的出生日期，不能晚于今天。':'请填写范围内的整数；不确定时可留空。';invalid.focus();return false;}
 if(onboarding.step===1||onboarding.step===3){
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
 const ok=persist();onboarding.status=ok?'completed':'paused';onboarding.step=ok?0:3;onboarding.draft=ok?null:d;if(ok)delete onboarding.dateRepair;const onboardingOk=storeOnboarding();go('home');toast(ok&&onboardingOk?'资料已保存，欢迎来到 Today':'资料已更新，但未能完整保存到浏览器；请稍后重试');
}
function nextOnboarding(){if(!validateOnboarding())return;if(onboarding.step<3){onboarding.step++;storeOnboarding();renderOnboarding(true);}else finishOnboarding();}
function leaveOnboarding(){readOnboardingFields();onboarding.status='paused';storeOnboarding();go(onboardingReturn);toast('可以稍后在「我的 → 基础照护资料」继续补充。');}

function persist(){try{localStorage.setItem(KEY,JSON.stringify({records,profiles,prefs,deletedRecordIds:[...deletedRecordIds]}));return true;}catch{return false;}}
function toast(t){clearTimeout(toastTimer);$('#toast').textContent=t;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3800);}
function hydrate(){hydrateIcons();Companion.refresh();}
function value(r){return r.type==='亲喂'?`${r.side} · ${r.duration} 分钟`:r.type==='换尿布'?`${r.kind} · 红屁屁：${r.rash}`:`${r.amount} ml`;}
function byTime(a,b){return b.time.localeCompare(a.time);}
function row(r){return `<button class="record-row" data-record-id="${safe(r.id)}"><span class="icon-tile">${icon(TYPES[r.type])}</span><span class="row-copy"><b>${safe(r.type)}</b><small>${safe(value(r))}</small></span><span class="row-end">${safe(r.time.slice(11))}<small>${safe(r.sync==='待同步'?'待同步':r.owner)}</small></span></button>`;}
function note(text,tone='',name='info'){return `<div class="status-note ${tone}" role="status">${icon(name)}<span>${text}</span></div>`;}
function canvas(state){return `<canvas width="640" height="420" data-companion="${state}" role="img" aria-label="Momcozy AI状态"></canvas>`;}
let latestChatPending=false,chatPinned=true,chatFollowFrame=0,chatGesture=false;
function updateLatestButton(){const viewport=$('#assistant-scroll'),button=$('#latest-message');if(button)button.hidden=page!=='assistant'||!messages.length||latestChatPending||viewport.scrollHeight-viewport.clientHeight-viewport.scrollTop<24;}
function cancelChatFollow(){cancelAnimationFrame(chatFollowFrame);chatFollowFrame=0;latestChatPending=false;}
function scrollChatLatest(force=true){
 if(!force&&(!chatPinned||chatGesture)){latestChatPending=false;updateLatestButton();return;}
 cancelAnimationFrame(chatFollowFrame);latestChatPending=true;
 chatFollowFrame=requestAnimationFrame(()=>{chatFollowFrame=0;if(page!=='assistant')return;if(!force&&(!chatPinned||chatGesture)){latestChatPending=false;updateLatestButton();return;}const viewport=$('#assistant-scroll');viewport.scrollTop=viewport.scrollHeight;latestChatPending=false;chatPinned=true;updateLatestButton();});
}
function scrollChatTask(){cancelChatFollow();chatPinned=false;requestAnimationFrame(()=>{if(page!=='assistant'||!task)return;const viewport=$('#assistant-scroll'),card=$('[data-task-id="'+task.id+'"]')?.closest('.task-message');if(!card)return;viewport.scrollTop+=card.getBoundingClientRect().top-viewport.getBoundingClientRect().top-8;updateLatestButton();});}
function go(next){if(!['home','records','assistant','mine','onboarding'].includes(next))next='home';positions[page]=$('#scroll').scrollTop;page=next;$('#app').dataset.page=page;$('.dock').hidden=page==='onboarding';$('#scroll').dataset.page=page;$$('.page').forEach(p=>p.hidden=p.id!==page);$$('.dock button').forEach(b=>{b.removeAttribute('aria-current');if(b.dataset.go===page)b.setAttribute('aria-current','page');});$('#scroll').scrollTop=positions[page]||0;if(location.hash!=='#/'+page)history.replaceState(null,'','#/'+page);if(page==='onboarding'){renderOnboarding();return;}render();if(page==='assistant'&&latestChatPending)scrollChatLatest();}
function render(){
 const today=homeMode==='empty'?[]:records.filter(r=>r.time.startsWith(DAY)),feed=today.filter(r=>r.owner==='宝宝'&&r.type!=='换尿布'),pump=today.filter(r=>r.type==='吸奶'),latest=[...feed].sort(byTime)[0];
 $('#home').dataset.stateId='STATE-home-'+homeMode;
 $('#summary').innerHTML=homeMode==='error'?`<div class="empty" style="grid-column:span 2"><h3>概况暂时没有加载出来</h3><p>已有记录保留，可以继续记一笔。</p><button class="text-button" data-action="reload-summary">重新加载 ${icon('refresh')}</button></div>`:today.length?`<div class="metric"><div class="metric-label">${icon('baby')}宝宝 · 喂养</div><div class="metric-value"><b>${feed.length}</b><span>次</span></div><p class="caption">最近 ${latest?latest.time.slice(11):'暂无'}<br>${latest?safe(value(latest)):'等待第一笔记录'}</p></div><div class="metric"><div class="metric-label">${icon('pump')}妈妈 · 吸奶</div><div class="metric-value"><b>${pump.reduce((n,r)=>n+Number(r.amount),0)}</b><span>ml</span></div><p class="caption">已记录 ${pump.length} 次<br>今日吸出量</p></div>`:`<div class="empty" style="grid-column:span 2">${icon('journal')}<h3>今天，从第一笔开始</h3><p>记下喂养、尿布或吸奶，概况会在这里出现。</p></div>`;
 $('#home-notice').hidden=scenario!=='offline';$('#home-notice').innerHTML=note(`当前为离线演示。已保存的记录可回看。<br><button class="text-button" data-action="sync">查看待同步记录 ${icon('chevron-right')}</button>`,'','offline');
 $('#recent').innerHTML=homeMode!=='empty'&&records.length?[...records].sort(byTime).slice(0,3).map(row).join(''):'<div class="empty"><p>这里会留下最近的照护记录。</p></div>';
 $('#record-list').innerHTML=records.filter(r=>r.owner===owner&&r.time.startsWith($('#journal-date').value)).sort(byTime).map(row).join('')||`<div class="empty">${icon('journal')}<h3>这一天，还没有记录</h3><p>可以补记已经发生的照护。</p></div>`;
 $('#record-links').innerHTML=(owner==='宝宝'?[['喂养与睡眠','clock'],['生长发育','growth']]:[['奶量趋势','trend'],['身体与状态','heart']]).map(([t,i])=>`<button data-detail="${t}">${icon(i)}${t}</button>`).join('');
 $('#sync-caption').textContent=records.some(r=>r.sync==='待同步')?`${records.filter(r=>r.sync==='待同步').length} 条记录待同步`:'查看应用记录同步状态';
 const days=profiles.birth?Math.max(0,Math.floor((Date.parse(profileToday()+'T12:00:00')-Date.parse(profiles.birth+'T12:00:00'))/86400000)):null;
 $('#baby-context').textContent=profiles.momStage==='孕前'?'为未来的照护做准备':profiles.momStage==='孕期'?'孕期'+(profiles.pregnancyWeeks?' · '+profiles.pregnancyWeeks+' 周':' · 孕周待补充'):profiles.baby+' · '+(days===null?'生日待补充':'出生 '+days+' 天')+(profiles.babyCount>1?' · 共 '+profiles.babyCount+' 个宝宝':'');
 $('#mom-context').textContent=(profiles.careRole||'家人')+' · '+(profiles.momStage||'阶段待补充');$('#profile-summary').textContent=days===null?'按你的节奏补充照护背景':'一起度过的第 '+days+' 天';$('.profile-card h3').textContent=(profiles.careRole||'家人')+'与'+profiles.baby;$('#assistant-context').textContent='为妈妈和'+profiles.baby+'，留一份从容';
 renderTask();hydrate();
}
function syncSheetBounds(){
 const frame=$('.app'),r=frame.getBoundingClientRect(),v=window.visualViewport;
 const viewLeft=v?.offsetLeft||0,viewTop=v?.offsetTop||0;
 const left=Math.max(r.left+frame.clientLeft,viewLeft),top=Math.max(r.top+frame.clientTop,viewTop);
 const right=Math.min(r.right-frame.clientLeft,viewLeft+(v?.width||innerWidth));
 const bottom=Math.min(r.bottom-frame.clientTop,viewTop+(v?.height||innerHeight));
 Object.assign(sheet.style,{left:left+'px',top:top+'px',width:Math.max(0,right-left)+'px',height:Math.max(0,bottom-top)+'px',borderRadius:getComputedStyle(frame).borderRadius});
}
new ResizeObserver(()=>{if(sheet.open)syncSheetBounds();}).observe($('.app'));
window.addEventListener('resize',()=>{if(sheet.open)syncSheetBounds();});
window.addEventListener('scroll',()=>{if(sheet.open)syncSheetBounds();},{passive:true});
window.visualViewport?.addEventListener('resize',()=>{if(sheet.open)syncSheetBounds();});
window.visualViewport?.addEventListener('scroll',()=>{if(sheet.open)syncSheetBounds();});
function openSheet(title,html,kind='detail'){if(formContext&&kind!=='record-form')rememberDraft();formContext=kind==='record-form'?formContext:null;sheet.dataset.kind=kind;$('#sheet-title').textContent=title;$('#sheet-title').tabIndex=-1;$('#sheet-body').innerHTML=html;syncSheetBounds();if(!sheet.open)sheet.showModal();$('#sheet-body').scrollTop=0;$('#sheet-title').focus({preventScroll:true});hydrate();}
function closeSheet(){rememberDraft();if(sheet.dataset.kind==='save'&&saveJob?.state==='saving'){clearTimeout(saveTimer);saveJob.state='failed';toast('保存已取消，草稿保留');}sheet.close();if(sheet.dataset.kind==='voice')stopVoice();}
function rememberDraft(){const f=$('#record-form');if(formContext&&f)drafts[formContext.key]=Object.fromEntries(new FormData(f));}
function recordTypeMenu(attr='data-type'){return '<div class="record-type-menu">'+[['宝宝',['亲喂','瓶喂母乳','配方奶','换尿布']],['妈妈',['吸奶']]].map(([owner,types])=>'<section><h3>'+owner+'</h3>'+types.map(t=>'<button type="button" '+attr+'="'+t+'"><span class="icon-tile">'+icon(TYPES[t])+'</span><span><b>'+t+'</b><small>'+({'亲喂':'侧别与喂养时长','瓶喂母乳':'记录宝宝喝下的母乳','配方奶':'记录宝宝喝下的奶量','换尿布':'尿布情况与皮肤观察','吸奶':'记录妈妈的吸出量'}[t])+'</small></span>'+icon('chevron-right')+'</button>').join('')+'</section>').join('')+'</div>';}
function recordPicker(){if(saveJob?.state==='unknown'){saveView();toast('先核对上一笔记录的保存结果。');return;}openSheet('记下刚刚的照护','<p class="sheet-description">选择记录类型，按妈妈与宝宝分别保存。</p>'+recordTypeMenu()+'<p class="caption">未保存内容会保留为当前页面草稿。</p>','record-picker');}
function field(label,name,type,val,extra=''){return `<label><span>${label}</span><input type="${type}" name="${name}" value="${safe(val)}" ${extra}></label>`;}
function selectField(label,name,options,val){return `<label><span>${label}</span><select name="${name}">${options.map(x=>`<option ${x===val?'selected':''}>${x}</option>`).join('')}</select></label>`;}
function choiceField(label,name,options,val){return '<fieldset class="record-choice"><legend>'+label+'</legend><div>'+options.map(x=>'<label><input type="radio" name="'+name+'" value="'+safe(x)+'" '+(x===val?'checked':'')+' required><span>'+safe(x)+'</span></label>').join('')+'</div></fieldset>';}
function recordFields(type,d){const milk=['吸奶','配方奶','瓶喂母乳'].includes(type);let body='<div class="record-form-heading"><span class="icon-tile">'+icon(TYPES[type])+'</span><div><b>'+type+'</b><small>'+(type==='吸奶'?'妈妈 · 吸出量':safe(profiles.baby)+' · 宝宝记录')+'</small></div></div><section class="record-field-group">';if(type==='亲喂')body+=choiceField('喂养侧别','side',['左侧','右侧','双侧'],d.side)+field('喂养时长 · 分钟','duration','number',d.duration,'required min="1" max="240" step="1" inputmode="numeric"');else if(type==='换尿布')body+=choiceField('尿布情况','kind',['嘘嘘','便便','嘘嘘与便便','干爽'],d.kind)+choiceField('是否红屁屁','rash',['无','有','不确定'],d.rash);else body+=field(type==='吸奶'?'吸出量 · ml':'喂养量 · ml','amount','number',d.amount,'required min="1" max="2000" step="1" inputmode="numeric"');body+='</section><section class="record-field-group"><h4>'+icon('clock')+'发生时间</h4>'+field(milk?'开始时间':'记录时间','time','datetime-local',d.time,'required max="'+NOW+'"')+(milk?field('结束时间 · 选填','end','datetime-local',d.end||'','max="'+NOW+'"'):'')+'</section><label><span>备注 <small>选填</small></span><textarea name="note" maxlength="500" rows="2" placeholder="还有什么想记住的？">'+safe(d.note||'')+'</textarea></label><p class="caption">演示时间 2026-10-19 15:00 · UTC+08:00</p>';return body;}
function defaultRecord(){return {time:NOW,amount:'',duration:'',side:'左侧',kind:'嘘嘘',rash:'',note:'',end:''};}
function recordError(d){return d.time>NOW?'发生时间不能晚于演示当前时间。':d.end&&(d.end<d.time||d.end>NOW)?'结束时间需在开始时间之后，且不晚于演示当前时间。':'';}
function editRecord(type,id){if(saveJob?.state==='unknown'){saveView();return;}rememberDraft();const r=records.find(x=>x.id===id);if(id&&!r){recordPicker();toast('这条记录已删除，请重新选择记录类型。');return;}const key=id||type,d=drafts[key]||r||defaultRecord();formContext={type,id,key};openSheet(type,'<form id="record-form" class="form-stack">'+recordFields(type,d)+'<p id="form-error" class="field-error" role="alert"></p><button type="submit" class="primary full">'+icon('check')+(id?'保存修改':'保存记录')+'</button><button type="button" class="text-button" data-action="back-types">返回记录类型</button></form>','record-form');}
function submitRecord(e){e.preventDefault();if(saveJob?.state==='unknown'){saveView();return;}if(saveJob?.state==='saving')return;const f=e.target,d=Object.fromEntries(new FormData(f)),ctx={...formContext};if(d.time>NOW){$('#form-error').textContent='发生时间不能晚于演示当前时间。';return;}if(d.end&&(d.end<d.time||d.end>NOW)){$('#form-error').textContent='结束时间需在开始时间之后，且不晚于演示当前时间。';return;}if(ctx.type==='换尿布'&&d.rash==='请选择'){$('#form-error').textContent='请选择是否红屁屁。';return;}rememberDraft();const id=ctx.id||'r-'+Date.now()+'-'+Math.random().toString(16).slice(2,6);saveJob={id,ctx,record:{...d,id,type:ctx.type,owner:ctx.type==='吸奶'?'妈妈':'宝宝',sync:'待同步'},state:'saving'};beginSave();}
function saveView(){const j=saveJob;if(!j)return;const map={saving:['saving','正在保存','正在处理这笔记录，请稍等。'],failed:['error','这次还没有保存','草稿仍在。可以重试，或返回检查内容。'],unknown:['indeterminate','保存结果待确认','请先核对这笔记录，避免重复新增。'],success:['success',j.local?'已保存到本机':'已保留在当前会话',j.local?'这笔记录已写入本机浏览器存储。同步状态单独显示。':'浏览器存储不可用。刷新或关闭页面后，这笔记录可能丢失。']};const [s,title,desc]=map[j.state];openSheet('保存记录',`<div class="save-state">${canvas(s)}<h3>${title}</h3><p>${desc}</p></div>${j.state==='success'?note('应用同步：'+(j.record.sync==='待同步'?'待同步（演示）':'已同步（模拟）'),'','cloud'):''}${j.state==='saving'?'<button class="secondary full" style="margin-top:24px" data-action="save-cancel">取消保存</button>':j.state==='unknown'?'<button class="primary full" style="margin-top:24px" data-action="save-check">核对本笔保存结果</button>':j.state==='failed'?'<div class="row-actions"><button class="secondary" data-action="save-edit">返回草稿</button><button class="primary" data-action="save-retry">重试保存</button></div>':'<button class="primary full" style="margin-top:24px" data-action="save-done">完成</button>'}<p class="caption center" style="margin-top:16px">响应为演示；${j.state==='unknown'?'核对沿用原请求编号':'不会写入真实账户'}。</p>`,'save');}
function commitSave(){const j=saveJob;if(!j)return;if(deletedRecordIds.has(j.id)||(j.ctx.id&&!records.some(r=>r.id===j.id))){clearTimeout(saveTimer);saveJob=null;recordPicker();toast('原记录已删除，本次保存请求已作废。');return;}const idx=records.findIndex(r=>r.id===j.id);if(idx>=0)records[idx]=j.record;else records.push(j.record);j.local=persist();j.state='success';delete drafts[j.ctx.key];homeMode='normal';render();saveView();}
function beginSave(force=false){clearTimeout(saveTimer);saveJob.state='saving';saveView();saveTimer=setTimeout(()=>{if(!saveJob||saveJob.state!=='saving')return;if(!force&&scenario==='failure'){saveJob.state='failed';saveView();}else if(!force&&scenario==='unknown'){saveJob.state='unknown';saveView();}else commitSave();},900);}
function recordDetail(id){const r=records.find(x=>x.id===id);if(!r)return;openSheet(r.type,`<p class="sheet-description">${r.owner} · ${safe(r.time.replace('T',' '))} · UTC+08:00</p><dl class="detail-list"><div><dt>记录内容</dt><dd>${safe(value(r))}</dd></div>${r.end?`<div><dt>结束时间</dt><dd>${safe(r.end.replace('T',' '))}</dd></div>`:''}<div><dt>备注</dt><dd>${safe(r.note||'未填写')}</dd></div><div><dt>来源</dt><dd>${r.id.startsWith('s')?'示例记录':'本机交互记录'}</dd></div><div><dt>同步状态</dt><dd>${safe(r.sync)}${r.sync==='已同步'?'（模拟）':''}</dd></div></dl><div class="row-actions"><button class="secondary" data-edit-id="${safe(id)}">${icon('edit')}编辑</button><button class="primary" data-action="close">完成</button></div><button class="text-button danger full" data-delete-id="${safe(id)}">${icon('trash')}删除这条记录</button>`);}
function archiveTask(){if(task)taskHistory.push(structuredClone(task));}
const taskNames={ready:'准备开始',permission:'需要使用权限',listening:'正在收音',captured:'确认这份素材',processing:'正在整理线索',indeterminate:'这次还无法判断',result:'观察结果已整理',timeout:'这次等待有点久',offline:'暂时无法提交',cancelled:'已取消',interrupted:'已暂停',speaking:'正在演示播报',picker:'选择记录类型',editing:'填写记录',saving:'正在保存',success:'记录已保存'};
function migrateTaskTimeline(){taskHistory=taskHistory.map((t,i)=>({...t,id:t.id||'legacy-'+i,kind:t.kind||(t.name==='听哭闹'?'cry':'poop')}));const cards=[...taskHistory,...(task?[task]:[])];for(const t of cards)if(!messages.some(m=>m.role==='task'&&String(m.taskId)===String(t.id)))messages.push({role:'task',taskId:t.id});}
function taskTerminal(t){return ['cancelled','result','indeterminate','success'].includes(t?.state);}
function startTask(kind){if(task&&!taskTerminal(task)){go('assistant');if(task.kind!==kind)toast('先完成或取消当前任务，填写内容会保留。');scrollChatTask();return;}archiveTask();clearTimeout(taskTimer);task={kind,state:kind==='record'?'picker':'ready',id:'task-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),drafts:{}};messages.push({role:'task',taskId:task.id});go('assistant');scrollChatTask();}
function taskButton(label,step,primary=false){return `<button class="${primary?'primary':'secondary'}" data-step="${step}">${label}</button>`;}
function assistantAvatar(){return '<span class="message-avatar"><canvas width="640" height="420" data-companion="ready" data-static="true" role="img" aria-label="momcozy ai 形象"></canvas></span>';}
function careButtons(ids){return ids.map(id=>'<button type="button" class="secondary" data-care="'+id+'">'+icon(CARE_ACTIONS[id].icon)+CARE_ACTIONS[id].label+'</button>').join('');}
function followupServices(){return '<section class="followup-services" aria-label="追加服务"><p>接下来，你还可以</p><div class="followup-actions">'+careButtons(['record','cry','poop'])+'</div></section>';}
function renderMessage(m,pending=false){
 if(m.role==='user')return '<div class="bubble user"><small>你</small>'+safe(m.text)+'</div>';
 return '<div class="assistant-message">'+assistantAvatar()+'<div class="bubble"><small>momcozy ai</small><div>'+safe(m.text)+'</div>'+(pending?'':followupServices())+'</div></div>';
}
function updateComposer(){const hasContent=!!($('#chat-message').value.trim()||attachment);$('#quick-voice').hidden=hasContent;$('#send-message').hidden=!hasContent;$('#send-message').disabled=chatBusy;}
function chatMore(){openSheet('添加与快捷功能','<p class="sheet-description">选择输入方式，或开始一项照护任务。</p><div class="chat-more-grid"><button class="secondary" data-action="camera">'+icon('camera')+'拍照</button><button class="secondary" data-action="upload">'+icon('paperclip')+'添加附件</button>'+careButtons(['record','cry','poop'])+'<button class="secondary" data-action="sound">'+icon('volume')+'声音设置</button></div>','chat-more');}
function launchCare(id,focus=true){startTask(id);if(focus)scrollChatTask();}
function rememberInlineRecord(){const f=$('#inline-record-form');if(!f||!task||String(task.id)!==f.dataset.taskId)return;task.drafts??={};task.drafts[f.dataset.type]=Object.fromEntries(new FormData(f));}
function selectInlineRecord(type){if(!task||task.kind!=='record'||task.recordJob?.state==='unknown'||task.recordJob?.state==='saving')return;rememberInlineRecord();task.type=type;task.state='editing';task.recordJob=null;renderTask();scrollChatTask();}
function inlineButton(label,action,primary=false){return '<button type="button" class="'+(primary?'primary':'text-button')+'" data-inline-action="'+action+'">'+label+'</button>';}
function inlineRecordCard(t,live){const j=t.recordJob;let body='';if(t.confirmCancel&&live)body='<h3>结束这次记录？</h3><p>已填写的草稿会随本次对话保留，不会写入日志。</p><div class="row-actions">'+inlineButton('继续填写','keep',true)+inlineButton('确认结束','discard')+'</div>';
else if(t.state==='success'){const r=j?.record,exists=records.some(x=>x.id===r?.id);body='<div class="record-receipt">'+icon(exists?'check':'info')+'<h3>'+(exists?(j.local?'已保存到本机':'仅保留在当前页面'):'这条记录已删除')+'</h3><p>'+(r?safe(r.type)+' · '+safe(value(r)):'')+'</p><p class="caption">'+(exists?'应用同步：'+safe(records.find(x=>x.id===r.id).sync)+'（演示）':'原任务回执保留，不会重新创建记录。')+'</p></div>'+followupServices();}
else if(t.state==='cancelled'||!live)body='<h3>本次记录已结束</h3><p>未保存的内容保留在这次会话中。</p>'+(t.recordJob?.state!=='deleted'&&Object.keys(t.drafts||{}).length?'<button type="button" class="secondary full" data-resume-record="'+t.id+'">继续这份草稿</button>':'')+followupServices();
else if(j&&['saving','unknown','failed'].includes(j.state)){const title={saving:'正在保存这笔记录',unknown:'保存结果待确认',failed:'这次还没有保存'}[j.state];body='<div class="record-receipt">'+icon(j.state==='failed'?'alert':'journal')+'<h3>'+title+'</h3><p>'+safe(j.record.type)+' · '+safe(value(j.record))+'</p><p class="caption">'+(j.state==='unknown'?'请核对本笔结果，避免重复新增。':j.state==='failed'?'草稿仍在，可以返回修改或重试。':'正在保存到本机，请稍等。')+'</p></div><div class="row-actions">'+(j.state==='unknown'?inlineButton('核对本笔保存结果','check',true):j.state==='failed'?inlineButton('返回草稿','edit')+inlineButton('重试保存','retry',true):inlineButton('取消保存','stop'))+'</div>';}
else if(t.state==='picker')body='<h3>想记下哪件事？</h3><p>完成后会保存到对应的妈妈或宝宝日志。</p>'+recordTypeMenu('data-inline-type')+inlineButton('结束本次记录','cancel');
else body='<form id="inline-record-form" data-task-id="'+t.id+'" data-type="'+t.type+'" class="form-stack">'+recordFields(t.type,t.drafts?.[t.type]||defaultRecord())+'<p id="inline-record-error" class="field-error" role="alert"></p><button class="primary full" type="submit">'+icon('check')+'保存记录</button><div class="record-secondary">'+inlineButton('更换记录类型','types')+inlineButton('结束本次记录','cancel')+'</div></form>';
return '<section class="task-card inline-record-card" data-task-id="'+t.id+'" data-state-id="STATE-chat-record-'+(j?.state||t.state)+'" aria-label="会话记一笔"><div class="task-top">'+icon('journal')+'<span>记一笔</span><small>'+(t.state==='success'?'已完成':'会话记录')+'</small></div>'+body+'</section>';}
function submitInlineRecord(e){e.preventDefault();if(!task||task.kind!=='record'||task.recordJob)return;const d=Object.fromEntries(new FormData(e.target)),error=recordError(d);if(error){$('#inline-record-error').textContent=error;return;}rememberInlineRecord();const id='r-'+Date.now()+'-'+Math.random().toString(36).slice(2,6);task.recordJob={id,state:'saving',record:{...d,id,type:task.type,owner:task.type==='吸奶'?'妈妈':'宝宝',sync:'待同步'}};beginInlineSave();}
function beginInlineSave(force=false){if(!task?.recordJob)return;clearTimeout(inlineSaveTimer);const id=task.id,epoch=conversationEpoch;task.recordJob.state='saving';renderTask();scrollChatTask();inlineSaveTimer=setTimeout(()=>{if(epoch!==conversationEpoch||task?.id!==id||task.recordJob?.state!=='saving')return;if(!force&&['failure','unknown'].includes(scenario)){task.recordJob.state=scenario==='failure'?'failed':'unknown';renderTask();scrollChatTask();}else commitInlineSave();},900);}
function commitInlineSave(){const j=task?.recordJob;if(!j)return;if(deletedRecordIds.has(j.id)){task.state='cancelled';j.state='deleted';renderTask();return;}const existing=records.findIndex(r=>r.id===j.id);if(existing<0)records.push(j.record);else records[existing]=j.record;j.local=persist();j.state='success';task.state='success';homeMode='normal';render();scrollChatTask();}
function actInlineRecord(action){if(!task||task.kind!=='record')return;rememberInlineRecord();if(action==='types'){task.state='picker';task.recordJob=null;}if(action==='cancel')task.confirmCancel=true;if(action==='keep')task.confirmCancel=false;if(action==='discard'){clearTimeout(inlineSaveTimer);task.confirmCancel=false;task.state='cancelled';}if(action==='stop'){clearTimeout(inlineSaveTimer);task.recordJob.state='failed';}if(action==='edit')task.recordJob=null;if(action==='retry'){beginInlineSave(true);return;}if(action==='check'){commitInlineSave();return;}renderTask();scrollChatTask();}
function renderCareCard(t,live=true){if(t.kind==='record')return inlineRecordCard(t,live);
 const cry=t.kind==='cry',s=t.state;let desc='',buttons='',detail='';
 if(s==='ready'){desc=cry?'准备一段清晰的哭声，让我们一起了解。':'添加一张清晰照片，再确认是否用于这次观察。';buttons=taskButton(cry?'开始收音演示':'添加照片演示','capture',true);}
 if(s==='permission'){desc=cry?'麦克风权限未开启（模拟）。本次尚未采集任何声音。':'相机权限未开启（模拟）。也可以选择已有照片。';buttons=taskButton('演示允许权限','allow',true)+(cry?'':taskButton('选择示例照片','photo'));}
 if(s==='listening'){desc='正在演示收音。没有调用真实麦克风。';buttons=taskButton('结束并检查素材','finish',true);}
 if(s==='captured'){desc=cry?'8 秒示例音频已准备。确认后再提交。':'示例照片已准备。确认后再提交。';buttons=taskButton('重新采集','recapture')+taskButton('确认并分析','analyze',true);detail=`<div class="task-detail">${icon(cry?'waveform':'image')} ${cry?'cry-sample · 00:08':'photo-sample · 已选择'}<p class="caption">只展示素材确认流程，不上传任何文件。</p></div>`;}
 if(s==='processing'){desc='正在演示分析。你可以暂时查看其他页面，进度保留。';}
 if(s==='indeterminate'){desc='这份示例素材不足以给出明确结论。可以重新采集，或继续描述你观察到的情况。';buttons=taskButton('重新采集','recapture',true)+taskButton('继续聊聊','chat');}
 if(s==='result'){desc='示例分析已结束。以下用于展示结果层级，不代表健康判断。';detail='<div class="task-detail"><b>已识别的输入</b><p>素材类型和任务已确认。</p><br><b>仍需要了解</b><p>照护背景、持续时间，以及妈妈实际观察到的变化。</p></div>';buttons=taskButton('播报演示','speak')+taskButton('继续聊聊','chat',true);}
 if(s==='speaking'){desc='Momcozy AI正在演示播报口型。本地原型不自动播放声音。';buttons=taskButton('停止播报','stop-speech',true);}
 if(s==='timeout'||s==='offline'){desc=s==='timeout'?'分析暂时没有返回。素材保留，可以重试或取消。':'当前为离线演示。素材已保留，可以恢复网络后重试。';buttons=taskButton('重试分析','retry',true);}
 if(s==='interrupted'){desc='任务已暂停。确认继续时，才恢复采集或分析。';buttons=taskButton('继续任务','resume',true);}
 if(s==='cancelled'){desc='本次任务已取消，不会继续分析。历史状态仍保留在对话中。';buttons=taskButton('重新开始','restart',true);}
 if(!live)buttons='';
 const pose=['captured','ready'].includes(s)?'ready':s==='result'?'result':s;
 return `<section class="task-card" data-task-id="${t.id}" data-state-id="STATE-task-${s}" aria-labelledby="task-title-${t.id}"><div class="task-top">${icon(cry?'waveform':'diaper')}<span>${cry?'听哭闹':'看便便'}</span></div>${canvas(pose)}<h3 id="task-title-${t.id}">${taskNames[s]}</h3><p>${desc}</p>${detail}${buttons?`<div class="row-actions">${buttons}</div>`:''}${live&&!['cancelled','result','indeterminate'].includes(s)?'<button class="text-button" data-step="cancel">取消本次任务</button>':''}<p class="caption">专项任务为模拟，不提供医疗结论。</p>${['cancelled','result','indeterminate'].includes(s)?followupServices():''}</section>`;
}
function renderTask(){rememberInlineRecord();const keep=page==='assistant'&&!chatPinned,top=$('#assistant-scroll').scrollTop;migrateTaskTimeline();renderResumeOnly();const active=!!task||messages.length>0;$('#assistant').dataset.chat=active?'active':'welcome';$('#assistant-intro').hidden=active;$('#assistant .assistant-tools').hidden=active;$('#task-slot').innerHTML='';$('#conversation').innerHTML=messages.map(m=>{if(m.role!=='task')return renderMessage(m);const t=task&&String(task.id)===String(m.taskId)?task:taskHistory.find(t=>String(t.id)===String(m.taskId));return t?'<div class="assistant-message task-message">'+assistantAvatar()+'<div class="task-message-body"><small class="task-author">momcozy ai</small>'+renderCareCard(t,t===task)+'</div></div>':'';}).join('');$('#attachments').innerHTML=attachment?'<div class="attachment">'+icon('file')+'<span>'+safe(attachment)+'</span><button type="button" data-action="remove-attachment" aria-label="移除附件">'+icon('close')+'</button></div>':'';updateComposer();checkpointConversation();hydrate();if(keep)$('#assistant-scroll').scrollTop=top;else if(page==='assistant'&&!chatGesture&&active)scrollChatLatest(false);updateLatestButton();}
function setTask(s){task.state=s;renderTask();renderResumeOnly();}
function renderResumeOnly(){const active=task&&!taskTerminal(task);$('#resume-slot').innerHTML=active?'<section class="resume"><div class="resume-heading">'+icon(CARE_ACTIONS[task.kind].icon)+'<b>'+CARE_ACTIONS[task.kind].label+' · '+taskNames[task.state]+'</b></div><p>回到 Momcozy AI，继续当前任务。</p><button class="text-button" data-action="resume-care">继续 '+icon('arrow-right')+'</button></section>':'';}
function analyze(force=false){clearTimeout(taskTimer);if(scenario==='offline'&&!force){setTask('offline');return;}setTask('processing');const id=task.id;taskTimer=setTimeout(()=>{if(!task||task.id!==id||task.state!=='processing')return;setTask(analysisOutcome);},1800);}
function stepTask(step){if(!task)return;
 if(step==='cancel'){clearTimeout(taskTimer);clearTimeout(speechTimer);setTask('cancelled');}
 if(step==='capture')setTask('permission');
 if(step==='allow')setTask(task.kind==='cry'?'listening':'captured');
 if(['photo','finish'].includes(step))setTask('captured');
 if(step==='recapture')setTask('ready');
 if(step==='analyze')analyze();
 if(step==='retry')analyze();
 if(step==='restart'){const kind=task.kind;startTask(kind);}
 if(step==='chat'){$('#chat-message').focus({preventScroll:true});scrollChatLatest();}
 if(step==='speak'){setTask('speaking');speechTimer=setTimeout(()=>{if(task?.state==='speaking')setTask('result');},4500);}
 if(step==='stop-speech'){clearTimeout(speechTimer);setTask('result');}
 if(step==='resume'){const prev=task.beforePause;pausedByBackground=false;if(prev==='processing')analyze();else if(prev==='speaking')setTask('result');else setTask(prev||'ready');}
}
function applyPrefs(){document.body.dataset.theme=prefs.theme;document.body.dataset.platform=prefs.platform;document.body.dataset.reduced=prefs.reduced;document.body.dataset.transparency=prefs.transparency?'reduced':'normal';document.body.dataset.contrast=prefs.contrast;$$('button[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===prefs.theme)));$$('button[data-platform]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.platform===prefs.platform)));Companion.setReduced(prefs.reduced);persist();}
function settings(){openSheet('阅读与演示设置',`<p class="sheet-description">这些是原型预览设置。所有分析、权限、设备与同步响应均为模拟。</p><section class="settings-group"><h3>显示环境</h3><div class="segments"><button data-theme="light" aria-pressed="${prefs.theme==='light'}">明亮</button><button data-theme="dark" aria-pressed="${prefs.theme==='dark'}">夜间</button></div><div class="segments"><button data-platform="ios" aria-pressed="${prefs.platform==='ios'}">iOS 表达</button><button data-platform="android" aria-pressed="${prefs.platform==='android'}">Android 表达</button></div>${[['reduced','减少动态效果'],['transparency','减少透明度'],['contrast','增强对比度']].map(([k,t])=>`<label class="check-row"><input type="checkbox" data-pref="${k}" ${prefs[k]?'checked':''}><span>${t}</span></label>`).join('')}<p class="caption">同时遵循系统减少动态效果。HTML 只近似材质，不等同于原生系统组件。</p></section><section class="settings-group"><h3>交互响应</h3><label>保存与网络<select id="scenario">${[['normal','正常保存'],['failure','保存失败'],['unknown','保存结果未知'],['offline','离线待同步']].map(([v,t])=>`<option value="${v}" ${scenario===v?'selected':''}>${t}</option>`).join('')}</select></label><label>专项分析结果<select id="analysis-outcome">${[['indeterminate','无法判断'],['result','结果层级演示'],['timeout','等待超时']].map(([v,t])=>`<option value="${v}" ${analysisOutcome===v?'selected':''}>${t}</option>`).join('')}</select></label><label>首页概况<select id="home-mode">${[['normal','已有记录'],['empty','空状态（仅预览）'],['error','加载失败']].map(([v,t])=>`<option value="${v}" ${homeMode===v?'selected':''}>${t}</option>`).join('')}</select></label></section><section class="settings-group"><h3>首次使用</h3><button class="secondary full" data-action="onboarding">${icon('user')}体验基础资料录入</button><p class="caption">不会清除已有记录；完成后更新基础资料。</p></section><button class="primary full" data-action="close">完成设置</button><button class="text-button danger full" data-action="reset-confirm">重置本版演示数据</button>`,'settings');}
function profile(kind){const baby=kind==='baby';openSheet(baby?'宝宝资料':'妈妈资料',`<p class="sheet-description">资料用于提供照护背景。保存后会更新本原型内的对应显示。</p><form id="profile-form" data-kind="${kind}" class="form-stack">${baby?field('宝宝称呼','baby','text',profiles.baby,'required maxlength="12"')+field('出生日期 · 选填','birth','date',profiles.birth,'max="'+profileToday()+'"'):'<label><span>当前阶段 · 选填</span><select name="momStage"><option value="" '+(!CARE_STAGES.includes(profiles.momStage)?'selected':'')+'>暂不填写</option>'+CARE_STAGES.map(stage=>'<option value="'+stage+'" '+(stage===profiles.momStage?'selected':'')+'>'+stage+'</option>').join('')+'</select></label>'+field('当前关注','focus','text',profiles.focus,'maxlength="60"')}<p class="caption">数据仅留在当前浏览器，未连接真实账户。</p><button class="primary full">保存资料</button></form>`,'profile');}
function showSync(){const pending=records.filter(r=>r.sync==='待同步');openSheet('应用记录同步',`<p class="sheet-description">手工记录与设备连接分别管理。本机保存不等于已同步到账户。</p>${note(syncBusy?'正在演示同步…':pending.length?`${pending.length} 条记录待同步`:'没有待同步的本机记录','','cloud')}<div>${pending.map(r=>`<div class="record-row"><span class="icon-tile">${icon(TYPES[r.type])}</span><span class="row-copy"><b>${safe(r.type)} · ${safe(value(r))}</b><small>${safe(r.time.replace('T',' '))}</small></span></div>`).join('')}</div><button class="primary full" style="margin-top:24px" data-action="sync-now" ${syncBusy||!pending.length?'disabled':''}>${syncBusy?'正在同步':'演示恢复并同步'}</button><p class="caption" style="margin-top:16px">不会上传到真实账户。演示成功后会明确标注为「已同步（模拟）」。</p>`,'sync');}
function devices(){openSheet('我的设备',`<p class="sheet-description">Momcozy 吸奶器 · 示例设备</p><div class="profile-card content-surface"><span class="profile-orbit">${icon('device')}</span><h3>${deviceConnected?'已连接（模拟）':'未连接'}</h3><p>最近设备同步：昨日 20:30（示例）</p></div>${note('设备连接与应用记录同步独立显示。连接设备不会把手工待同步记录标记为已同步。')}<button class="primary full" data-action="device-toggle">${deviceConnected?'演示断开连接':'演示连接设备'}</button><button class="text-button full" data-action="device-history">查看设备同步记录</button>`,'devices');}
function detail(t){let html='';if(t==='奶量趋势'){const dates=Array.from({length:7},(_,i)=>{const d=new Date(DAY+'T12:00:00+08:00');d.setDate(d.getDate()-(6-i));return d.toISOString().slice(0,10);}),daily=dates.map(date=>({date,items:records.filter(r=>r.type==='吸奶'&&r.time.startsWith(date))})),max=Math.max(1,...daily.map(d=>d.items.reduce((n,r)=>n+Number(r.amount),0))),today=daily[6];html='<p class="sheet-description">最近 7 天 · 按发生日期汇总妈妈的吸出量。</p><div class="metric-value"><b>'+today.items.reduce((n,r)=>n+Number(r.amount),0)+'</b><span>ml · 今日 '+today.items.length+' 次</span></div><div class="trend-bars">'+daily.map(d=>{const n=d.items.reduce((n,r)=>n+Number(r.amount),0);return '<div style="height:'+(d.items.length?Math.max(25,n/max*100):18)+'%">'+(d.items.length?n:'—')+'</div>';}).join('')+'</div><div class="trend-labels">'+dates.map(d=>'<span>'+d.slice(5).replace('-','/')+'</span>').join('')+'</div><p class="caption">「—」表示没有记录，不代表吸出量为零。只汇总妈妈吸奶，不与宝宝喂养量合并。</p>';}else if(t==='喂养与睡眠'){const feeds=records.filter(r=>r.owner==='宝宝'&&r.type!=='换尿布'&&r.time.startsWith(DAY));html='<p class="sheet-description">今天 · 喂养时间线</p>'+feeds.sort(byTime).map(row).join('')+'<div class="module"><h3>睡眠</h3><div class="empty">'+icon('moon')+'<h3>还没有睡眠记录</h3><p>有记录后，可以在这里回顾休息时间。</p></div></div>';}else if(t==='生长发育'){html='<p class="sheet-description">'+safe(profiles.baby)+' · 最近的身长与体重</p><div class="summary content-surface"><div class="metric"><div class="metric-label">身长</div><div class="metric-value"><b>—</b><span>cm</span></div></div><div class="metric"><div class="metric-label">体重</div><div class="metric-value"><b>—</b><span>kg</span></div></div></div><div class="empty">'+icon('growth')+'<h3>等待第一份成长记录</h3><p>身长与体重记录会按日期排列，<br>帮助你回顾宝宝的细微变化。</p></div>';}else{html='<p class="sheet-description">妈妈 · 最近的身体与状态记录</p><div class="empty">'+icon('heart')+'<h3>也给自己留一点关注</h3><p>目前没有可回看的状态记录。<br>想聊聊当下的感受，可以找Momcozy AI说说。</p></div><button class="primary full" data-action="mom-chat">和Momcozy AI聊聊</button>';}openSheet(t,html+'<button class="secondary full" style="margin-top:24px" data-action="close">返回记录</button>');}
function inputPreview(kind){openSheet(kind==='camera'?'添加照片':'添加附件',`<p class="sheet-description">当前为素材输入演示，不调用真实相机，也不上传任何文件。</p><div class="empty">${icon(kind==='camera'?'camera':'paperclip')}<h3>${kind==='camera'?'选择一张示例照片':'选择一份示例附件'}</h3><p>添加后先在输入框确认，再发送。</p></div><button class="primary full" data-attach="${kind==='camera'?'示例照片 · 未上传':'示例附件 · 未上传'}">添加示例素材</button>`,'attachment');}
let voiceActive=false;
function voice(){if(task?.state==='listening'){toast('请先结束哭声采集，再进行语音输入。');return;}voiceActive=true;openSheet('语音输入演示',`<div class="save-state">${canvas('listening')}<h3>正在演示语音输入</h3><p>没有开启真实麦克风。结束后可编辑示例转写文字。</p></div><button class="primary full" style="margin-top:24px" data-action="voice-finish">结束并确认文字</button><button class="text-button full" data-action="close">取消</button>`,'voice');}
function stopVoice(){voiceActive=false;}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.onboardingBaby!==undefined){readOnboardingFields();onboarding.draft.activeBaby=Number(b.dataset.onboardingBaby);storeOnboarding();renderOnboarding();$('[data-onboarding-baby="'+b.dataset.onboardingBaby+'"]').focus({preventScroll:true});return;}
 if(b.dataset.onboardingChoice){readOnboardingFields();const key=b.dataset.onboardingChoice;onboarding.draft[key]=(key==='role'?CARE_ROLES:CARE_STAGES)[Number(b.dataset.choiceIndex)];storeOnboarding();renderOnboarding();$('[data-onboarding-choice="'+key+'"][data-choice-index="'+b.dataset.choiceIndex+'"]').focus({preventScroll:true});return;}
 if(b.dataset.onboardingConcern!==undefined){readOnboardingFields();const c=CARE_CONCERNS[Number(b.dataset.onboardingConcern)],list=onboarding.draft.concerns;onboarding.draft.concerns=list.includes(c)?list.filter(x=>x!==c):[...list,c];storeOnboarding();renderOnboarding();$('[data-onboarding-concern="'+b.dataset.onboardingConcern+'"]').focus({preventScroll:true});return;}
 if(b.dataset.renameConversation){renameConversation(b.dataset.renameConversation);return;}
 if(b.dataset.deleteConversation){confirmDeleteConversation(b.dataset.deleteConversation);return;}
 if(b.dataset.confirmChatDelete){deleteConversation(b.dataset.confirmChatDelete);return;}
 if(b.dataset.openConversation){openConversation(b.dataset.openConversation);return;}
 if(b.dataset.go){go(b.dataset.go);return;}
 if(b.dataset.resumeRecord){const source=task?.id===b.dataset.resumeRecord?task:taskHistory.find(t=>t.id===b.dataset.resumeRecord);if(!source)return;if(task&&!taskTerminal(task)){toast('先完成或结束当前任务，再继续这份草稿。');scrollChatTask();return;}const copy=structuredClone(source);if(source!==task)startTask('record');task.drafts=copy.drafts;task.type=copy.type;task.recordJob=null;task.confirmCancel=false;task.state=copy.type?'editing':'picker';renderTask();scrollChatTask();return;}
 if(b.dataset.inlineType){selectInlineRecord(b.dataset.inlineType);return;}
 if(b.dataset.inlineAction){actInlineRecord(b.dataset.inlineAction);return;}
 if(b.dataset.theme){prefs.theme=b.dataset.theme;applyPrefs();return;}
 if(b.dataset.platform){prefs.platform=b.dataset.platform;applyPrefs();return;}
 if(b.dataset.owner){owner=b.dataset.owner;$$('[data-owner]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();return;}
 if(b.dataset.type){editRecord(b.dataset.type);return;}
 if(b.dataset.recordId){recordDetail(b.dataset.recordId);return;}
 if(b.dataset.editId){const r=records.find(x=>x.id===b.dataset.editId);editRecord(r.type,r.id);return;}
 if(b.dataset.deleteId){const id=b.dataset.deleteId;openSheet('删除这条记录？',`<p class="sheet-description">删除后，今日概况和记录列表会一同更新。本地原型不提供撤销。</p><div class="row-actions"><button class="secondary" data-record-id="${safe(id)}">保留记录</button><button class="primary" data-delete-confirm="${safe(id)}">确认删除</button></div>`);return;}
 if(b.dataset.deleteConfirm){const id=b.dataset.deleteConfirm;deletedRecordIds.add(id);delete drafts[id];if(saveJob?.id===id||saveJob?.ctx.id===id){clearTimeout(saveTimer);saveJob=null;formContext=null;}records=records.filter(r=>r.id!==id);const ok=persist();closeSheet();render();toast(ok?'已删除本机记录':'已在当前会话删除；存储不可用');return;}
 if(b.dataset.care){closeSheet();launchCare(b.dataset.care);return;}
 if(b.dataset.task){startTask(b.dataset.task);scrollChatTask();return;}
 if(b.dataset.step){stepTask(b.dataset.step);return;}
 if(b.dataset.detail){detail(b.dataset.detail);return;}
 if(b.dataset.attach){attachment=b.dataset.attach;closeSheet();renderTask();return;}
 const a=b.dataset.action;
 if(a==='onboarding-stage-later'){onboarding.draft.stage='';storeOnboarding();renderOnboarding();$('#onboarding-title').focus({preventScroll:true});return;}
 if(a==='onboarding'){startOnboarding();return;}
 if(a==='onboarding-next'){nextOnboarding();return;}
 if(a==='onboarding-back'){readOnboardingFields();onboarding.step=Math.max(0,onboarding.step-1);storeOnboarding();renderOnboarding(true);return;}
 if(a==='onboarding-later'){leaveOnboarding();return;}
 if(a==='new-chat'){newConversation();return;}
 if(a==='chat-history'){conversationHistory();return;}
 if(a==='clear-history-search'){historyQuery='';$('#history-search').value='';renderHistoryResults();$('#history-search').focus();return;}
 if(a==='chat-latest'){scrollChatLatest();return;}
 if(a==='resume-care'){go('assistant');scrollChatTask();}
 if(a==='record'){if(page==='assistant')launchCare('record');else recordPicker();}if(a==='back-types')recordPicker();
 if(a==='close')closeSheet();if(a==='settings')settings();
 if(a==='sound')openSheet('声音与播报','<p class="sheet-description">Momcozy AI默认安静。只有主动点击结果中的「播报演示」，才会开始口型动画。</p>'+note('当前原型未接入语音播放，不会发出声音。可随时停止播报动画。')+'<button class="primary full" data-action="close">知道了</button>');
 if(a==='baby-profile')profile('baby');if(a==='mom-profile')profile('mom');
 if(a==='mom-chat'){closeSheet();go('assistant');$('#chat-message').value='我想聊聊最近的身体状态。';updateComposer();$('#chat-message').focus();}if(a==='devices')devices();if(a==='device-toggle'){deviceConnected=!deviceConnected;devices();}
 if(a==='device-history')openSheet('设备同步记录','<p class="sheet-description">设备泵奶记录与最近同步信息。</p><div class="empty"><h3>尚无设备导入的泵奶记录</h3><p>手工吸奶记录可在「记录 → 妈妈」回看。</p></div><h3>同步历史样例</h3><dl class="detail-list"><div><dt>昨日 20:30</dt><dd>同步完成 · 2 条（示例）</dd></div><div><dt>昨日 18:10</dt><dd>连接中断 · 未完成（示例）</dd></div></dl><button class="secondary full" style="margin-top:24px" data-action="devices">返回设备</button>');
 if(a==='sync')showSync();if(a==='sync-now'&&!syncBusy){syncBusy=true;showSync();syncTimer=setTimeout(()=>{records.forEach(r=>{if(r.sync==='待同步')r.sync='已同步';});syncBusy=false;scenario='normal';persist();render();if(sheet.open&&sheet.dataset.kind==='sync')showSync();toast('应用记录已同步（模拟）');},1000);}
 if(a==='reload-summary'){homeMode='normal';render();toast('已重新加载本机示例记录');}
 if(a==='save-retry')beginSave(true);
 if(a==='save-check'){commitSave();toast('已核对同一请求，没有重复新增');}
 if(a==='save-edit'){const c=saveJob.ctx;saveJob=null;editRecord(c.type,c.id);}
 if(a==='save-cancel'){clearTimeout(saveTimer);saveJob.state='failed';saveView();toast('保存已取消，草稿保留');}
 if(a==='save-done'){closeSheet();saveJob=null;render();}
 if(a==='chat-more')chatMore();
 if(a==='camera'||a==='upload')inputPreview(a);
 if(a==='remove-attachment'){attachment='';renderTask();}
 if(a==='voice')voice();if(a==='voice-finish'){stopVoice();openSheet('确认转写文字',`<form id="voice-confirm" class="form-stack"><label><span>示例转写 · 可编辑</span><textarea name="transcript" required>我想回顾一下今天的喂养记录。</textarea></label><button class="primary full">放入输入框</button><button type="button" class="text-button" data-action="close">取消</button></form>`,'voice-confirm');}
 if(a==='reset-confirm')openSheet('重置本版演示？','<p class="sheet-description">将清除 HOME-1.0 本机新增记录、资料、阅读设置和历史对话，重新进入新用户资料引导。旧版原型不受影响。</p><div class="row-actions"><button class="secondary" data-action="settings">取消</button><button class="primary" data-action="reset">确认重置</button></div>');
 if(a==='reset'){resetInProgress=true;clearTimeout(inlineSaveTimer);clearTimeout(saveTimer);clearTimeout(taskTimer);clearTimeout(chatTimer);clearTimeout(syncTimer);clearTimeout(speechTimer);try{localStorage.removeItem(KEY);localStorage.removeItem(CHAT_KEY);localStorage.removeItem(ONBOARDING_KEY);}catch{}location.reload();}
});
document.addEventListener('input',e=>{if(e.target.closest('#inline-record-form')){rememberInlineRecord();clearTimeout(chatSaveTimer);chatSaveTimer=setTimeout(checkpointConversation,180);}if(e.target.closest('#onboarding-form')){readOnboardingFields();$('#onboarding-error').textContent='';}if(e.target.id==='history-search'){historyQuery=e.target.value;renderHistoryResults();}if(e.target.id==='conversation-title'&&$('#rename-error'))$('#rename-error').textContent='';});
document.addEventListener('submit',e=>{if(e.target.id==='onboarding-form'){e.preventDefault();nextOnboarding();return;}if(e.target.id==='rename-conversation'){submitConversationName(e);return;}if(e.target.id==='inline-record-form'){submitInlineRecord(e);return;}if(e.target.id==='record-form')submitRecord(e);if(e.target.id==='profile-form'){e.preventDefault();const d=Object.fromEntries(new FormData(e.target));if(d.baby)d.baby=d.baby.trim()||'宝宝';profiles={...profiles,...d};if(Object.prototype.hasOwnProperty.call(d,'birth')){profiles.babies=structuredClone(profiles.babies?.length?profiles.babies:[{birth:'',weeks:profiles.birthWeeks||''}]);profiles.babies[0].birth=d.birth;}const ok=persist();closeSheet();render();toast(ok?'资料已保存到本机':'资料已更新，仅当前会话有效');}if(e.target.id==='voice-confirm'){e.preventDefault();$('#chat-message').value=new FormData(e.target).get('transcript');updateComposer();closeSheet();$('#chat-message').focus();}});
$('#chat-message').addEventListener('input',()=>{updateComposer();clearTimeout(chatSaveTimer);chatSaveTimer=setTimeout(checkpointConversation,180);});
$('#chat-message').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('#chat-form').requestSubmit();}});
$('#chat-form').addEventListener('submit',e=>{
 e.preventDefault();if(chatBusy)return;const t=$('#chat-message').value.trim();if(!t&&!attachment){toast('先写下一句话，或添加一份素材。');return;}
 const intents=detectCareIntents(t);messages.push({role:'user',text:t+(attachment?'\n['+attachment+']':'')});$('#chat-message').value='';attachment='';chatBusy=true;
 $('#chat-status').innerHTML=renderMessage({role:'assistant',text:'正在准备示例回应…'},true);renderTask();scrollChatLatest();
 const responseEpoch=conversationEpoch;
 chatTimer=setTimeout(()=>{
  if(responseEpoch!==conversationEpoch)return;
  let text,actions=[];
  if(scenario==='offline'){text='当前为离线演示。消息已保留在本次对话中，可以先打开本地功能，分析需恢复网络后继续。';actions=intents;}
  else if(intents.length===1){const id=intents[0];const blocked=task&&task.kind!==id&&!taskTerminal(task);text=blocked?'当前还有一项任务未结束。先完成或取消它，再开始'+CARE_ACTIONS[id].label+'。':id==='record'?'为你打开「记一笔」。选择记录类型，核对内容后再保存。':id==='cry'?'一起听听哭声。先确认权限并采集素材，再由你确认是否分析。':'一起看看便便。添加照片后，先核对素材，再确认是否分析。';actions=[id];}
  else if(intents.length>1){text='你提到了几件事，想先从哪一件开始？';actions=intents;}
  else{text='我看到了你的消息。这是本地示例回应。你可以继续补充，也可以说「记一笔」「听哭闹」或「看便便」来打开对应功能。';}
  messages.push({role:'assistant',text,actions});chatBusy=false;$('#chat-status').innerHTML='';renderTask();
  if(intents.length===1&&scenario!=='offline')launchCare(intents[0],false);
  scrollChatLatest(false);
 },700);
});
document.addEventListener('change',e=>{if(e.target.closest('#onboarding-form')){readOnboardingFields();if(e.target.name==='babyCount'){renderOnboarding();$('#onboard-babyCount').focus({preventScroll:true});}}if(e.target.closest('#record-form')&&$('#form-error'))$('#form-error').textContent='';if(e.target.dataset.pref){prefs[e.target.dataset.pref]=e.target.checked;applyPrefs();}if(e.target.id==='scenario'){scenario=e.target.value;render();}if(e.target.id==='analysis-outcome')analysisOutcome=e.target.value;if(e.target.id==='home-mode'){homeMode=e.target.value;render();}if(e.target.id==='journal-date')render();});
$('#sheet-close').addEventListener('click',closeSheet);sheet.addEventListener('cancel',e=>{e.preventDefault();closeSheet();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&task&&['listening','processing','speaking'].includes(task.state)){clearTimeout(taskTimer);clearTimeout(speechTimer);task.beforePause=task.state;pausedByBackground=true;setTask('interrupted');}if(document.hidden&&voiceActive){stopVoice();if(sheet.open&&sheet.dataset.kind==='voice')openSheet('语音输入已暂停','<p class="sheet-description">离开页面后已停止演示收音。重新开始时不会沿用未确认文字。</p><button class="primary full" data-action="voice">重新开始</button>','voice-paused');}});
window.addEventListener('hashchange',()=>go(location.hash.slice(2)));
const chatViewport=$('#assistant-scroll');
function pauseChatFollow(){cancelChatFollow();chatPinned=false;}
chatViewport.addEventListener('wheel',e=>{if(e.deltaY<0)pauseChatFollow();},{passive:true});
chatViewport.addEventListener('pointerdown',()=>{chatGesture=true;pauseChatFollow();},{passive:true});
function endChatGesture(){chatGesture=false;if(page==='assistant'){chatPinned=chatViewport.scrollHeight-chatViewport.clientHeight-chatViewport.scrollTop<24;updateLatestButton();}}
window.addEventListener('pointerup',endChatGesture,{passive:true});window.addEventListener('pointercancel',endChatGesture,{passive:true});
chatViewport.addEventListener('touchstart',()=>{chatGesture=true;pauseChatFollow();},{passive:true});chatViewport.addEventListener('touchend',endChatGesture,{passive:true});chatViewport.addEventListener('touchcancel',endChatGesture,{passive:true});
chatViewport.addEventListener('keydown',e=>{if(['ArrowUp','PageUp','Home'].includes(e.key))pauseChatFollow();});
chatViewport.addEventListener('scroll',()=>{if(page!=='assistant'||latestChatPending)return;chatPinned=chatViewport.scrollHeight-chatViewport.clientHeight-chatViewport.scrollTop<24;updateLatestButton();},{passive:true});
new ResizeObserver(()=>{if(page==='assistant'&&chatPinned&&!chatGesture&&(messages.length||task))scrollChatLatest(false);}).observe(chatViewport);
window.addEventListener('pagehide',()=>{if(resetInProgress)return;rememberInlineRecord();stopConversationWork();checkpointConversation();});
if(initialConversation)loadConversationState(initialConversation);
hydrateIcons();applyPrefs();if(onboarding.status==='draft'||(!saved&&onboarding.status==='none')){onboarding.status='draft';onboarding.draft??=onboardingFromProfile();storeOnboarding();go('onboarding');}else go(location.hash.slice(2)||'home');
if(page==='assistant'&&(messages.length||task))scrollChatLatest();
