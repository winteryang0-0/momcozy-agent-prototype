/* Local keyword routing: opens existing demo flows, never records or captures automatically. */
const CARE_ACTIONS={record:{label:'Log care',icon:'journal'},cry:{label:'Listen to baby’s cry',icon:'waveform'},poop:{label:'Check a diaper',icon:'diaper'}};
function detectCareIntents(text){
 const clauses=String(text).toLowerCase().split(/[，,。！!？?；;\n]|但是|不过|而是|\bbut\b|\binstead\b/).filter(c=>!/(不要|不用|不想|不需要|暂不|别|无需|取消|停止|\b(?:don't|do not|not now|no need to|skip|cancel|stop)\b)/.test(c));
 const patterns={record:/记一笔|记一下|记录|记下|记个|喂养|喂奶|奶量|吸奶|亲喂|换尿布|\b(log|record|feeding|breastfeed|breastfeeding|bottle|formula|pumping|pump|diaper change)\b/,cry:/哭闹|哭声|哭了|一直哭|哭不停|听哭|\b(cry|crying|cries|fussy|fussing)\b/,poop:/便便|大便|排便|便秘|腹泻|拉肚子|\b(poop|stool|bowel movement|dirty diaper|diaper photo)\b/};
 return Object.keys(CARE_ACTIONS).filter(k=>clauses.some(c=>patterns[k].test(c)));
}

/* Local prototype. Care cards use browser media devices; automated care analysis is not connected. */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const safe=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const currentLocalTime=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
function careDate(value){
 const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(value||''));
 return match?new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),Number(match[4]),Number(match[5])):null;
}
function careTime(value){const date=careDate(value);return date?new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(date):String(value||'').slice(11);}
function careDateTime(value){const date=careDate(value);return date?new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(date):String(value||'').replace('T',' ');}
function localDateKey(date){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
function calendarDayNumber(value){const [year,month,day]=String(value||'').split('-').map(Number);return Date.UTC(year,month-1,day)/86400000;}
const NOW=currentLocalTime(),DAY=NOW.slice(0,10),KEY='momcozy-home-1.0-en-US';
const TYPES={'亲喂':'breast','配方奶':'formula','瓶喂母乳':'bottle','换尿布':'diaper','吸奶':'pump'};
/* Presentation-only category keys for the CS-0.5 task color path. */
const RECORD_CATEGORY={'亲喂':'feed','配方奶':'feed','瓶喂母乳':'feed','换尿布':'diaper'};
const recordCategory=type=>RECORD_CATEGORY[type]||'neutral';
let saved;try{saved=JSON.parse(localStorage.getItem(KEY));}catch{}
let records=Array.isArray(saved?.records)?saved.records:[],profiles=saved?.profiles||{baby:'Baby',birth:'',momStage:'',focus:''},prefs={theme:'light',platform:'ios',reduced:false,transparency:false,contrast:false,sound:false,...saved?.prefs};
let page='assistant',owner='宝宝',journalFilter='all',positions={},drafts={},formContext=null,saveJob=null,saveTimer=null,task=null,taskHistory=[],messages=[],attachment='',chatBusy=false,chatTimer,toastTimer,taskTimer,speechTimer,scenario='normal',analysisOutcome='indeterminate',homeMode='normal',deviceConnected=false,syncBusy=false,syncTimer,pausedByBackground=false;
let mediaSession=null,capturedMedia=null,mediaOperation=0,captureClock=null;
let adviceIndex=0,adviceExpanded=false,adviceTouchStart=null;
const sheet=$('#sheet'),sheetPanel=sheet.querySelector('.sheet-panel'),reducedMotionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
const sidebarLayer=$('#sidebar-layer'),sidebarPanel=$('#care-sidebar'),sidebarToggle=$('.main-menu-button');
let sidebarOpener=null,sidebarCloseTimer=null,mineReturnPage='assistant';
let resetInProgress=false;const deletedRecordIds=new Set(saved?.deletedRecordIds||[]);const inlineSaveTimers=new Map();let taskTriggerRevision=0;

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
  const title=current?.customTitle||(messages.find(m=>m.role==='user')?.text||(task?CARE_ACTIONS[task.kind]?.label:'')||draft||'Media conversation').replace(/\s+/g,' ').slice(0,28);
 const record={id:activeConversationId,title,customTitle:current?.customTitle||'',updatedAt:new Date().toISOString(),payload};
 if(current)conversations[conversations.indexOf(current)]=record;else conversations.push(record);
 persistConversations();
}
function stopConversationWork(){
 stopSpeech();
 stopLiveCapture();clearCapturedMedia();
 conversationEpoch++;cancelChatFollow();clearTimeout(chatTimer);clearInlineSaveTimers(true);clearTimeout(taskTimer);clearTimeout(speechTimer);clearTimeout(chatSaveTimer);stopVoice();
 if(chatBusy)messages.push({role:'assistant',text:'本次回复已暂停。你可以继续发送消息。'});
 chatBusy=false;$('#chat-status').innerHTML='';
 if(task&&task.kind!=='record'&&['starting','listening','camera','cameraReady','finishing','processing','speaking'].includes(task.state)){
  task.beforePause='ready';task.state='interrupted';task.captureNotice='Capture paused. You’ll need to capture the media again to continue.';task.mediaMeta=null;
 }
}
function loadConversationState(record){
 stopLiveCapture();clearCapturedMedia();const data=structuredClone(record.payload);activeConversationId=record.id;
 messages=data.messages.filter(m=>m&&(['user','assistant'].includes(m.role)&&typeof m.text==='string'||m.role==='task'&&m.taskId)).map(m=>({...m,actions:(m.actions||[]).filter(id=>CARE_ACTIONS[id])}));
 task=data.task&&['cry','poop','record'].includes(data.task.kind)?data.task:null;
 taskHistory=Array.isArray(data.taskHistory)?data.taskHistory:[];
 migrateTaskTimeline();
 for(const item of [...taskHistory,...(task?[task]:[])]){
  if(item.kind==='record'){
   if(item.recordJob){
    item.recordJob.requestId ||= 'req-'+item.recordJob.id;
    if(item.recordJob.state==='saving')item.recordJob.state='unknown';
   }else if(item!==task&&!taskTerminal(item)){
    item.beforePause=item.beforePause||item.state;item.state='interrupted';
   }
  }else if(item===task){
   if(['permission','captured','starting','listening','camera','cameraReady','finishing','processing','offline','timeout'].includes(item.state)){
    item.state='ready';item.captureNotice='Please capture the media again.';item.mediaMeta=null;
   }else if(item.state==='speaking'){
    item.beforePause='result';item.state='interrupted';
   }
  }else if(!taskTerminal(item)){
   item.beforePause='ready';item.state='interrupted';item.captureNotice='Capture paused. You’ll need to capture the media again to continue.';item.mediaMeta=null;
  }
 }
 attachment=typeof data.attachment==='string'?data.attachment:'';$('#chat-message').value=typeof data.draft==='string'?data.draft:'';
 if(data.pendingReply)messages.push({role:'assistant',text:'上次回复已暂停。你可以继续发送消息。'});
 chatBusy=false;$('#chat-status').innerHTML='';
}
function newConversation(){
 stopConversationWork();checkpointConversation();if(sheet.open)closeSheet();
  activeConversationId=null;messages=[];task=null;taskHistory=[];attachment='';pausedByBackground=false;adviceExpanded=false;$('#chat-message').value='';
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
 $('#history-results').innerHTML=list.length?'<div class="chat-history-list">'+list.map(c=>{const p=c.payload,last=p.messages.at(-1),userPreview=last?.role==='user'||(!last?.text&&!!p.draft),preview=last?.text||p.draft||(p.task?'Care card · '+(window.MomcozyEnUS?.display(taskNames[p.task.state]||'Paused')||taskNames[p.task.state]||'Paused'):'Media draft');const date=new Date(c.updatedAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});return '<article class="chat-history-row"><button class="chat-history-item" data-open-conversation="'+safe(c.id)+'" aria-current="'+String(c.id===activeConversationId)+'">'+icon('journal')+'<span class="chat-history-copy"><b data-user-content>'+safe(c.title)+'</b><small>'+safe(date)+' · '+p.messages.length+' message'+(p.messages.length===1?'':'s')+(c.id===activeConversationId?' · Current conversation':'')+'</small><small class="chat-history-preview"'+(userPreview?' data-user-content':'')+'>'+safe(preview)+'</small></span>'+icon('chevron-right')+'</button><div class="history-row-actions"><button data-user-content data-rename-conversation="'+safe(c.id)+'" aria-label="Rename: '+safe(c.title)+'">'+icon('edit')+'Rename</button><button class="danger" data-user-content data-delete-conversation="'+safe(c.id)+'" aria-label="Delete: '+safe(c.title)+'">'+icon('trash')+'Delete</button></div></article>';}).join('')+'</div>':'<div class="empty">'+icon('journal')+'<h3>'+(historyQuery.trim()?'No matching conversations':'No past conversations yet')+'</h3><p>'+(historyQuery.trim()?'Try another search or clear it.':'Your conversations will appear here after you start chatting.')+'</p>'+(historyQuery.trim()?'<button class="text-button" data-action="clear-history-search">Clear search</button>':'')+'</div>';
}
function conversationHistory(){
 checkpointConversation();const description=chatStorageAvailable?'对话保存在当前浏览器，可搜索标题和消息内容。':'当前仅在本次会话保留；浏览器存储不可用，关闭页面后可能丢失。';
 if(page!=='assistant'){if(sheet.open)closeSheet();go('assistant');}
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
function careNumberLabel(value,unit){const names={'岁':['year','years'],'次':['birth','births'],'周':['week','weeks'],'个':['baby','babies']};const forms=names[unit];return String(value)+' '+(forms?forms[Number(value)===1?0:1]:unit);}
function onboardingNumber(label,name,value,min,max,initial=30,unit='岁'){
 const raw=value===''||value==null?'':String(value),blank=raw==='',supported=profileInteger(raw,min,max),legacy=!blank&&!supported,id='onboard-'+name,selected=blank?'':supported?String(Number(raw)):raw;
  const options=[...(legacy?[{value:raw,text:'Previous: '+raw,invalid:true}]:[]),{value:'',text:'Skip'},...Array.from({length:max-min+1},(_,i)=>({value:String(min+i),text:careNumberLabel(min+i,unit)}))];
  const warning=legacy?'<small class="wheel-warning" id="'+id+'-warning">Previous value '+safe(raw)+' is outside '+min+'–'+max+'. Choose another value or skip.</small>':'';
  return '<div class="wheel-field"><span class="wheel-label" id="'+id+'-label">'+label+'</span><div class="wheel-shell"><div class="wheel-focus" aria-hidden="true"></div><div class="number-wheel" id="'+id+'" role="spinbutton" tabindex="0" aria-labelledby="'+id+'-label" aria-valuemin="'+(min-1)+'" aria-valuemax="'+max+'" aria-valuenow="'+(blank||legacy?min-1:Number(selected))+'" aria-valuetext="'+(legacy?'Previous value '+safe(raw)+'; needs updating':blank?'Skip':careNumberLabel(selected,unit))+'"'+(legacy?' aria-invalid="true" aria-describedby="'+id+'-warning"':'')+' data-wheel-name="'+name+'" data-unit="'+unit+'">'+options.map(o=>'<div class="wheel-option'+(o.value===selected?' selected':'')+'" data-wheel-value="'+safe(o.value)+'"'+(o.invalid?' data-wheel-invalid="true"':'')+' aria-hidden="true">'+safe(o.text)+'</div>').join('')+'</div></div><input type="hidden" name="'+name+'" value="'+safe(selected)+'" data-wheel-input>'+warning+'</div>';
}
function mountOnboardingWheels(){
 $$('#onboarding-form .number-wheel').forEach(wheel=>{
  const input=wheel.closest('.wheel-field').querySelector('input'),items=[...wheel.children],row=26;
  let timer,drag=null;
  const index=()=>Math.min(items.length-1,Math.max(0,Math.round(wheel.scrollTop/row)));
   const commit=()=>{if(!wheel.isConnected)return;const item=items[index()],value=item.dataset.wheelValue,invalid=item.dataset.wheelInvalid==='true',warning=wheel.closest('.wheel-field').querySelector('.wheel-warning');items.forEach(el=>el.classList.toggle('selected',el===item));wheel.setAttribute('aria-valuetext',invalid?'Previous value '+value+'; needs updating':value===''?'Skip':careNumberLabel(value,wheel.dataset.unit));wheel.setAttribute('aria-valuenow',value===''||invalid?wheel.getAttribute('aria-valuemin'):value);wheel.setAttribute('aria-invalid',String(invalid));if(warning){warning.hidden=!invalid;if(invalid)wheel.setAttribute('aria-describedby',warning.id);else wheel.removeAttribute('aria-describedby');}if(input.value===value)return;input.value=value;const d=onboarding.draft;d.omitted??={};d.omitted[input.name]=value==='';if(value!==''){d.sliderValues??={};d.sliderValues[input.name]=Number(value);}readOnboardingFields();$('#onboarding-error').textContent='';};
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
 if(item==='mine'){mineReturnPage='assistant';closeSidebar({immediate:true,restoreFocus:false});go('mine');requestAnimationFrame(()=>$('#mine .page-heading h2').focus({preventScroll:true}));return;}
 if(item==='baby'){closeSidebar({immediate:true});profile('baby');return;}
 if(item==='record'){closeSidebar({immediate:true,restoreFocus:false});go('records');requestAnimationFrame(()=>$('#records .journal-heading h2').focus({preventScroll:true}));return;}
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

function persist(){try{localStorage.setItem(KEY,JSON.stringify({records,profiles,prefs,deletedRecordIds:[...deletedRecordIds]}));return true;}catch{return false;}}
function toast(t){clearTimeout(toastTimer);$('#toast').textContent=t;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3800);}
function hydrate(){hydrateIcons();Companion.refresh();}
function value(r){const en=window.MomcozyEnUS?.display||((x)=>x);return r.type==='亲喂'?`${en(r.side)} · ${r.duration} min`:r.type==='换尿布'?`${en(r.kind)} · Diaper rash: ${en(r.rash)}`:`${r.amount} mL`;}
function byTime(a,b){return b.time.localeCompare(a.time);}
function row(r){return `<button class="record-row" data-category="${recordCategory(r.type)}" data-record-id="${safe(r.id)}"><span class="icon-tile">${icon(TYPES[r.type])}</span><span class="row-copy"><b>${safe(window.MomcozyEnUS?.display(r.type)||r.type)}</b><small>${safe(value(r))}</small></span><span class="row-end">${safe(careTime(r.time))}<small>${safe(window.MomcozyEnUS?.display(r.sync==='待同步'?'待同步':r.owner)||r.owner)}</small></span></button>`;}
function journalRow(r){const who=r.owner==='宝宝'?'<span data-user-content>'+safe(profiles.baby||'Baby')+'</span>':'Mom',sync=r.sync==='待同步'?' · Pending sync':r.sync==='示例'?' · Sample':'';return `<button class="journal-row" data-category="${recordCategory(r.type)}" data-record-id="${safe(r.id)}"><time datetime="${safe(r.time)}">${safe(careTime(r.time))}</time><span class="icon-tile">${icon(TYPES[r.type])}</span><span class="journal-row-copy"><b>${safe(window.MomcozyEnUS?.display(r.type)||r.type)}</b><small>${who} · ${safe(value(r))}${sync}</small></span><span class="journal-row-chevron">${icon('chevron-right')}</span></button>`;}
function selectJournalRecord(r){$('#journal-date').value=r.time.slice(0,10);owner=r.owner;journalFilter='all';$$('[data-owner]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.owner===owner)));}
function note(text,tone='',name='info'){return `<div class="status-note ${tone}" role="status">${icon(name)}<span>${text}</span></div>`;}
function canvas(state,staticFrame=false,loop=false){return `<canvas width="640" height="420" data-companion="${state}" ${staticFrame?'data-static="true"':''} ${loop?'data-loop="true"':''} role="img" aria-label="Momcozy AI companion"></canvas>`;}
 function dailyAdvice(){
  const today=homeMode==='empty'||homeMode==='error'?[]:records.filter(r=>r.time.startsWith(currentLocalTime().slice(0,10)));
 const lastFeed=[...today].filter(r=>r.owner==='宝宝'&&r.type!=='换尿布').sort(byTime)[0];
 if(homeMode==='error')return {tone:'neutral',icon:'journal',title:'概况暂时不可用',reason:'今日记录没有加载出来，稍后可以重试。已有记录不会因此删除。',basis:'依据概况加载状态'};
 if(scenario==='offline')return {tone:'neutral',icon:'offline',title:'先照顾眼前，再处理同步',reason:'当前为离线演示。本机已保存的记录可以继续回看。',basis:'依据当前离线演示状态'};
 if(lastFeed)return {tone:'feed',icon:'baby',title:'回顾最近一次喂养',reason:`You’ve logged a feeding today. The latest was at ${careTime(lastFeed.time)}. You can review it in Care Journal.`,basis:'依据今天的喂养记录'};
 if(homeMode==='empty')return {tone:'neutral',icon:'journal',title:'从一件已发生的照护开始',reason:'当前预览没有记录。想起哪件事，就补一笔。',basis:'依据当前预览的记录状态'};
 const concerns=Array.isArray(profiles.concerns)?profiles.concerns:[];
 if(concerns.includes('宝宝为什么哭'))return {tone:'crying',icon:'waveform',title:'留意宝宝哭闹时的线索',reason:'你在资料中关注过哭闹。可以在 Momcozy AI 中描述刚才观察到的情况。',basis:'依据你填写的关注点'};
 if(concerns.some(c=>['我的身体恢复','情绪起伏与压力','睡不够疲惫'].includes(c)))return {tone:'neutral',icon:'heart',title:'给自己留一点关注',reason:'你在资料中关注过身体或情绪状态。需要时可以和 Momcozy AI 聊聊。',basis:'依据你填写的关注点'};
 return {tone:'neutral',icon:'journal',title:'从一件已发生的照护开始',reason:'今天还没有记录。想起哪件事，就补一笔。',basis:'依据今天的记录状态'};
}
function adviceCards(){
  const primary=dailyAdvice(),today=homeMode==='empty'||homeMode==='error'?[]:records.filter(r=>r.time.startsWith(currentLocalTime().slice(0,10)));
 const diapers=today.filter(r=>r.owner==='宝宝'&&r.type==='换尿布').sort(byTime),last=diapers[0];
 const diaper=homeMode==='error'?{tone:'neutral',icon:'diaper',title:'尿布记录暂不可用',reason:'记录摘要未加载，稍后再查看。',basis:'依据当前预览状态'}:scenario==='offline'?{tone:'diaper',icon:'diaper',title:'先回看本机尿布记录',reason:'当前为离线演示，已保存在本机的记录仍可回看。',basis:'依据当前离线演示状态'}:last?{tone:'diaper',icon:'diaper',title:'回看最近一次换尿布',reason:`${diapers.length} diaper change${diapers.length===1?'':'s'} logged today. Latest at ${careTime(last.time)}.`,basis:'依据今天的尿布记录'}:{tone:'diaper',icon:'diaper',title:'留意今天的尿布变化',reason:'今天还没有尿布记录，需要时可以补记。',basis:'依据今天的记录状态'};
 const concerns=Array.isArray(profiles.concerns)?profiles.concerns:[],self=concerns.some(c=>['我的身体恢复','情绪起伏与压力','睡不够疲惫'].includes(c))?{tone:'neutral',icon:'heart',title:'给自己留一点关注',reason:'你曾在资料中关注身体或情绪状态，想说时可以继续聊聊。',basis:'依据你填写的关注点'}:{tone:'neutral',icon:'heart',title:'也给妈妈留一份照护',reason:'如果今天想记录或聊聊自己的感受，可以从这里开始。',basis:'依据当前本地资料'};
 return [primary,diaper,self];
}
function adviceControls(cards){
  return `<div class="advice-controls"><div class="advice-dots" role="group" aria-label="Choose a tip">${cards.map((card,i)=>`<button type="button" class="advice-dot" data-advice-index="${i}" aria-label="Tip ${i+1}: ${safe(window.MomcozyEnUS?.display(card.title)||card.title)}" aria-current="${i===adviceIndex?'true':'false'}"></button>`).join('')}</div></div>`;
}
function adviceWidget(cards,floating=false){
 const d=cards[adviceIndex],total=cards.length,cardLabel=`Tip ${adviceIndex+1} of ${total}: ${safe(window.MomcozyEnUS?.display(d.title)||d.title)}`;
 const widgetLabel='Today’s tips. Swipe left or right, or use the arrow keys to cycle through tips.';
 if(floating)return `<div class="advice-widget advice-widget-floating" tabindex="0" aria-label="${widgetLabel}"><div class="advice-card" data-category="${d.tone}" role="group" aria-roledescription="slide" aria-label="${cardLabel}"><div class="advice-card-heading"><span class="advice-icon">${icon(d.icon)}</span><strong>${safe(d.title)}</strong></div><p class="advice-reason">${safe(d.reason)}</p>${adviceControls(cards)}</div></div>`;
 return `<div class="advice-widget" tabindex="0" aria-label="${widgetLabel}"><div class="advice-card" data-category="${d.tone}" role="group" aria-roledescription="slide" aria-label="${cardLabel}"><div class="advice-card-main"><span class="advice-icon">${icon(d.icon)}</span><span class="advice-copy"><small>Helpful tip</small><strong>${safe(d.title)}</strong><span>${safe(d.reason)}</span></span></div>${adviceControls(cards)}</div></div>`;
}
function renderDailyAdvice(){const cards=adviceCards();adviceIndex=Math.min(adviceIndex,cards.length-1);$('#daily-advice').innerHTML=adviceWidget(cards);$('#expanded-advice').innerHTML=adviceWidget(cards,true);$('#compact-advice').textContent=cards[adviceIndex].title;$('#conversation-home-head').dataset.expanded=String(adviceExpanded);$('#expanded-advice').hidden=!adviceExpanded;$('.compact-advice').setAttribute('aria-expanded',String(adviceExpanded));$('.compact-advice').setAttribute('aria-label',adviceExpanded?'收起今日智能提醒':'展开今日智能提醒');}
function changeAdvice(index){const cards=adviceCards(),next=((index%cards.length)+cards.length)%cards.length;if(next===adviceIndex)return;const focusedHostId=document.activeElement?.closest?.('.daily-advice')?.id,focusedDot=!!document.activeElement?.matches?.('.advice-dot');adviceIndex=next;renderDailyAdvice();$('#advice-announcement').textContent=`Tip ${next+1}: ${window.MomcozyEnUS?.display(cards[next].title)||cards[next].title}`;const focusedHost=focusedHostId&&document.getElementById(focusedHostId);if(focusedHost&&!focusedHost.closest('[hidden]'))(focusedDot?focusedHost.querySelector(`.advice-dot[data-advice-index="${next}"]`):focusedHost.querySelector('.advice-widget'))?.focus({preventScroll:true});}
let latestChatPending=false,chatPinned=true,chatFollowFrame=0,chatGesture=false;
function updateLatestButton(){const viewport=$('#assistant-scroll'),button=$('#latest-message'),last=$('#conversation').lastElementChild;if(!button)return;const view=viewport.getBoundingClientRect(),latest=last?.getBoundingClientRect(),latestVisible=!!latest&&latest.bottom>view.top+12&&latest.top<view.bottom-12;button.hidden=page!=='assistant'||!messages.length||latestChatPending||latestVisible||viewport.scrollHeight-viewport.clientHeight-viewport.scrollTop<24;}
function cancelChatFollow(){cancelAnimationFrame(chatFollowFrame);chatFollowFrame=0;latestChatPending=false;}
function scrollChatLatest(force=true){
 if(!force&&(!chatPinned||chatGesture)){latestChatPending=false;updateLatestButton();return;}
 cancelAnimationFrame(chatFollowFrame);latestChatPending=true;
 chatFollowFrame=requestAnimationFrame(()=>{chatFollowFrame=0;if(page!=='assistant')return;if(!force&&(!chatPinned||chatGesture)){latestChatPending=false;updateLatestButton();return;}const viewport=$('#assistant-scroll');viewport.scrollTop=viewport.scrollHeight;latestChatPending=false;chatPinned=true;updateLatestButton();});
}
function scrollChatTask(){if(task)scrollToTaskId(task.id);}
function scrollToTaskId(id){cancelChatFollow();chatPinned=false;requestAnimationFrame(()=>{if(page!=='assistant')return;const viewport=$('#assistant-scroll'),card=[...document.querySelectorAll('.task-card')].find(node=>node.dataset.taskId===String(id))?.closest('.task-message');if(!card)return;viewport.scrollTop+=card.getBoundingClientRect().top-viewport.getBoundingClientRect().top-8;updateLatestButton();});}
function go(next){if(!sidebarLayer.hidden)closeSidebar({immediate:true,restoreFocus:false});next=['home','assistant'].includes(next)?'assistant':next;if(!['assistant','records','mine','onboarding'].includes(next))next='assistant';if(onboarding.status==='draft'&&next!=='onboarding')next='onboarding';if(page==='assistant'&&next!=='assistant'){if(voiceActive||voiceHoldTimer)cancelVoice();stopSpeech();if(task&&['starting','listening','camera','cameraReady','finishing'].includes(task.state)){stopLiveCapture();task.captureNotice='采集已暂停，请重新开始。';task.state='ready';}}positions[page]=$('#scroll').scrollTop;page=next;$('#app').dataset.page=page;$('#scroll').dataset.page=page;$$('.page').forEach(p=>p.hidden=p.id!==page);$('#record-cta').hidden=page!=='records';$('#scroll').scrollTop=positions[page]||0;const route=page==='assistant'?'home':page;if(location.hash!=='#/'+route)history.replaceState(null,'','#/'+route);if(page==='onboarding'){renderOnboarding();return;}render();if(page==='assistant'&&latestChatPending)scrollChatLatest();}
function render(){
 renderDailyAdvice();
  const selected=$('#journal-date').value||currentLocalTime().slice(0,10),items=records.filter(r=>r.owner===owner&&r.time.startsWith(selected)).sort(byTime),feeds=items.filter(r=>r.type!=='换尿布'),latest=items[0],latestFeed=feeds[0];
 const dateLabel=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',weekday:'long'}).format(new Date(selected+'T12:00:00'));
  $('#journal-context').innerHTML=safe(dateLabel)+' · '+(owner==='宝宝'?'<span data-user-content>'+safe(profiles.baby||'Baby')+'</span>':'Mom');$('#journal-baby-label').textContent=profiles.baby||'Baby';$('#timeline-title').textContent=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(selected+'T12:00:00'))+' timeline';
 const count=owner==='宝宝'?feeds.length:items.length,unit=owner==='宝宝'?(count===1?'feeding':'feedings'):(count===1?'pumping session':'pumping sessions'),detail=owner==='宝宝'?(latestFeed?`Latest at ${careTime(latestFeed.time)} · ${value(latestFeed)}`:'No feedings logged yet'):(latest?`Latest at ${careTime(latest.time)} · ${items.reduce((n,r)=>n+Number(r.amount||0),0)} mL logged on this day`:'No pumping sessions logged yet');
 $('#record-summary').dataset.category=owner==='宝宝'?'feed':'neutral';$('#record-summary').innerHTML=`<small>${safe(dateLabel)} · ${owner==='宝宝'?'宝宝记录':'妈妈记录'}</small><div class="journal-summary-value"><b>${count}</b><span>${unit}</span></div><p>${safe(detail)}</p>`;
 const visible=items.filter(r=>journalFilter==='all'||(journalFilter==='feed'?r.type!=='换尿布':journalFilter==='diaper'?r.type==='换尿布':r.type==='吸奶'));
 $('#record-list').innerHTML=visible.map(journalRow).join('')||`<div class="empty">${icon('journal')}<h3>${journalFilter==='all'?'这一天，还没有记录':'当前筛选下没有记录'}</h3><p>${journalFilter==='all'?'可以补记已经发生的照护。':'试试切换筛选，或新建一条记录。'}</p></div>`;
 $('#record-links').innerHTML=(owner==='宝宝'?[['喂养与睡眠','clock'],['生长发育','growth']]:[['奶量趋势','trend'],['身体与状态','heart']]).map(([t,i])=>`<button data-detail="${t}">${icon(i)}${t}</button>`).join('');
 $('#sync-caption').textContent=records.some(r=>r.sync==='待同步')?`${records.filter(r=>r.sync==='待同步').length} 条记录待同步`:'查看应用记录同步状态';
  const days=profiles.birth?Math.max(0,calendarDayNumber(profileToday())-calendarDayNumber(profiles.birth)):null;
  $('#profile-summary').textContent=days===null?'Add care details when you’re ready':'Day '+days+' together';const roleLabel=({'妈妈':'Mom','爸爸':'Dad','爷爷/奶奶':'Grandparent','外公/外婆':'Grandparent','其他成员':'Caregiver'})[profiles.careRole]||'Family',babyName=profiles.baby&&profiles.baby!=='Baby'?profiles.baby:'';$('.profile-card h3').innerHTML=roleLabel+' and <span data-user-content>'+safe(babyName||'Baby')+'</span>';$('#assistant-context').innerHTML='A little more ease for you and '+(babyName?'<span data-user-content>'+safe(babyName)+'</span>':'your baby');
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
sheetPanel.addEventListener('animationend',e=>{if(e.animationName==='sheet-rise')sheet.dataset.motion='steady';});
sheet.addEventListener('animationend',e=>{if(e.animationName==='sheet-shade-in')sheet.dataset.backdropMotion='steady';});
reducedMotionQuery.addEventListener('change',()=>{if(sheet.open){sheet.dataset.motion='steady';sheet.dataset.backdropMotion='steady';}});
function openSheet(title,html,kind='detail'){
 const wasOpen=sheet.open,entering=!wasOpen||sheet.dataset.kind!==kind||sheet.dataset.sourceTitle!==title,animate=entering&&!prefs.reduced&&!reducedMotionQuery.matches;
 if(formContext&&kind!=='record-form')rememberDraft();
 formContext=kind==='record-form'?formContext:null;
 if(entering){sheet.dataset.motion='idle';sheet.dataset.backdropMotion=!wasOpen&&animate?'enter':'steady';}
 sheet.dataset.kind=kind;sheet.dataset.sourceTitle=title;$('#sheet-title').textContent=title;$('#sheet-title').tabIndex=-1;$('#sheet-body').innerHTML=html;
 syncSheetBounds();if(!wasOpen)sheet.showModal();
 $('#sheet-body').scrollTop=0;$('#sheet-title').focus({preventScroll:true});hydrate();
 if(entering){if(animate){void sheetPanel.offsetHeight;sheet.dataset.motion='enter';}else sheet.dataset.motion='steady';}
}
function closeSheet(){rememberDraft();if(sheet.dataset.kind==='save'&&saveJob?.state==='saving'){clearTimeout(saveTimer);saveJob.state='failed';toast('保存已取消，草稿保留');}sheet.close();if(sheet.dataset.kind==='voice')stopVoice();}
function rememberDraft(){const f=$('#record-form');if(formContext&&f)drafts[formContext.key]=Object.fromEntries(new FormData(f));}
function recordTypeMenu(attr='data-type'){return '<div class="record-type-menu">'+[['宝宝',['亲喂','瓶喂母乳','配方奶','换尿布']],['妈妈',['吸奶']]].map(([owner,types])=>'<section><h3>'+owner+'</h3>'+types.map(t=>'<button type="button" data-category="'+recordCategory(t)+'" '+attr+'="'+t+'"><span class="icon-tile">'+icon(TYPES[t])+'</span><span><b>'+t+'</b><small>'+({'亲喂':'侧别与喂养时长','瓶喂母乳':'记录宝宝喝下的母乳','配方奶':'记录宝宝喝下的奶量','换尿布':'尿布情况与皮肤观察','吸奶':'记录妈妈的吸出量'}[t])+'</small></span>'+icon('chevron-right')+'</button>').join('')+'</section>').join('')+'</div>';}
function recordPicker(){if(saveJob?.state==='unknown'){saveView();toast('先核对上一笔记录的保存结果。');return;}openSheet('记下刚刚的照护','<p class="sheet-description">选择记录类型，按妈妈与宝宝分别保存。</p>'+recordTypeMenu()+'<p class="caption">未保存内容会保留为当前页面草稿。</p>','record-picker');}
function field(label,name,type,val,extra=''){return `<label><span>${label}</span><input type="${type}" name="${name}" value="${safe(val)}" ${extra}></label>`;}
function selectField(label,name,options,val){return `<label><span>${label}</span><select name="${name}">${options.map(x=>`<option ${x===val?'selected':''}>${x}</option>`).join('')}</select></label>`;}
function choiceField(label,name,options,val){return '<fieldset class="record-choice"><legend>'+label+'</legend><div>'+options.map(x=>'<label><input type="radio" name="'+name+'" value="'+safe(x)+'" '+(x===val?'checked':'')+' required><span>'+safe(x)+'</span></label>').join('')+'</div></fieldset>';}
 function recordFields(type,d){const milk=['吸奶','配方奶','瓶喂母乳'].includes(type),latest=currentLocalTime();let body='<div class="record-form-heading" data-category="'+recordCategory(type)+'"><span class="icon-tile">'+icon(TYPES[type])+'</span><div><b>'+type+'</b><small>'+(type==='吸奶'?'Mom · Milk expressed':'<span data-user-content>'+safe(profiles.baby||'Baby')+'</span> · Care log')+'</small></div></div><section class="record-field-group">';if(type==='亲喂')body+=choiceField('Feeding side','side',['左侧','右侧','双侧'],d.side)+field('Feeding duration · min','duration','number',d.duration,'required min="1" max="240" step="1" inputmode="numeric"');else if(type==='换尿布')body+=choiceField('Diaper status','kind',['嘘嘘','便便','嘘嘘与便便','干爽'],d.kind)+choiceField('Diaper rash?','rash',['无','有','不确定'],d.rash);else body+=field(type==='吸奶'?'Milk expressed · mL':'Amount fed · mL','amount','number',d.amount,'required min="1" max="2000" step="1" inputmode="numeric"');body+='</section><section class="record-field-group"><h4>'+icon('clock')+'When it happened</h4>'+field(milk?'Start time':'Time','time','datetime-local',d.time,'required max="'+latest+'"')+(milk?field('End time · Optional','end','datetime-local',d.end||'','max="'+latest+'"'):'')+'</section><label><span>Notes <small>Optional</small></span><textarea name="note" maxlength="500" rows="2" placeholder="Anything else you want to remember?">'+safe(d.note||'')+'</textarea></label>';return body;}
function defaultRecord(){return {time:currentLocalTime(),amount:'',duration:'',side:'左侧',kind:'嘘嘘',rash:'',note:'',end:''};}
function recordError(d){const latest=currentLocalTime();return d.time>latest?'发生时间不能晚于当前时间。':d.end&&(d.end<d.time||d.end>latest)?'结束时间需在开始时间之后，且不晚于当前时间。':'';}
function editRecord(type,id){if(saveJob?.state==='unknown'){saveView();return;}rememberDraft();const r=records.find(x=>x.id===id);if(id&&!r){recordPicker();toast('这条记录已删除，请重新选择记录类型。');return;}const key=id||type,d=drafts[key]||r||defaultRecord();formContext={type,id,key};openSheet(type,'<form id="record-form" class="form-stack">'+recordFields(type,d)+'<p id="form-error" class="field-error" role="alert"></p><button type="submit" class="primary full">'+icon('check')+(id?'保存修改':'保存记录')+'</button><button type="button" class="text-button" data-action="back-types">返回记录类型</button></form>','record-form');}
function submitRecord(e){e.preventDefault();if(saveJob?.state==='unknown'){saveView();return;}if(saveJob?.state==='saving')return;const f=e.target,d=Object.fromEntries(new FormData(f)),ctx={...formContext},error=recordError(d);if(error){$('#form-error').textContent=error;return;}if(ctx.type==='换尿布'&&d.rash==='请选择'){$('#form-error').textContent='请选择是否红屁屁。';return;}rememberDraft();const id=ctx.id||'r-'+Date.now()+'-'+Math.random().toString(16).slice(2,6);saveJob={id,ctx,record:{...d,id,type:ctx.type,owner:ctx.type==='吸奶'?'妈妈':'宝宝',sync:'待同步'},state:'saving'};beginSave();}
function saveView(){const j=saveJob;if(!j)return;const map={saving:['saving','正在保存','正在处理这笔记录，请稍等。'],failed:['error','这次还没有保存','草稿仍在。可以重试，或返回检查内容。'],unknown:['indeterminate','保存结果待确认','请先核对这笔记录，避免重复新增。'],success:['success',j.local?'已保存到本机':'已保留在当前会话',j.local?'这笔记录已写入本机浏览器存储。同步状态单独显示。':'浏览器存储不可用。刷新或关闭页面后，这笔记录可能丢失。']};const [s,title,desc]=map[j.state];openSheet('保存记录',`<div class="save-state">${canvas(s)}<h3>${title}</h3><p>${desc}</p></div>${j.state==='success'?note('应用同步：'+(j.record.sync==='待同步'?'待同步（演示）':'已同步（模拟）'),'','cloud'):''}${j.state==='saving'?'<button class="secondary full" style="margin-top:24px" data-action="save-cancel">取消保存</button>':j.state==='unknown'?'<button class="primary full" style="margin-top:24px" data-action="save-check">核对本笔保存结果</button>':j.state==='failed'?'<div class="row-actions"><button class="secondary" data-action="save-edit">返回草稿</button><button class="primary" data-action="save-retry">重试保存</button></div>':'<button class="primary full" style="margin-top:24px" data-action="save-done">完成</button>'}<p class="caption center" style="margin-top:16px">响应为演示；${j.state==='unknown'?'核对沿用原请求编号':'不会写入真实账户'}。</p>`,'save');}
 function commitSave(){const j=saveJob;if(!j)return;if(deletedRecordIds.has(j.id)||(j.ctx.id&&!records.some(r=>r.id===j.id))){clearTimeout(saveTimer);saveJob=null;recordPicker();toast('原记录已删除，本次保存请求已作废。');return;}const idx=records.findIndex(r=>r.id===j.id);if(idx>=0)records[idx]=j.record;else records.push(j.record);selectJournalRecord(j.record);j.local=persist();j.state='success';delete drafts[j.ctx.key];homeMode='normal';render();saveView();}
function beginSave(force=false){clearTimeout(saveTimer);saveJob.state='saving';saveView();saveTimer=setTimeout(()=>{if(!saveJob||saveJob.state!=='saving')return;if(!force&&scenario==='failure'){saveJob.state='failed';saveView();}else if(!force&&scenario==='unknown'){saveJob.state='unknown';saveView();}else commitSave();},900);}
function recordDetail(id){const r=records.find(x=>x.id===id);if(!r)return;openSheet(r.type,`<p class="sheet-description">${r.owner} · ${safe(careDateTime(r.time))}</p><dl class="detail-list"><div><dt>记录内容</dt><dd>${safe(value(r))}</dd></div>${r.end?`<div><dt>结束时间</dt><dd>${safe(careDateTime(r.end))}</dd></div>`:''}<div><dt>备注</dt><dd${r.note?' data-user-content':''}>${safe(r.note||'未填写')}</dd></div><div><dt>来源</dt><dd>${r.id.startsWith('s')?'示例记录':'本机交互记录'}</dd></div><div><dt>同步状态</dt><dd>${safe(r.sync)}${r.sync==='已同步'?'（模拟）':''}</dd></div></dl><div class="row-actions"><button class="secondary" data-edit-id="${safe(id)}">${icon('edit')}编辑</button><button class="primary" data-action="close">完成</button></div><button class="text-button danger full" data-delete-id="${safe(id)}">${icon('trash')}删除这条记录</button>`);}
function clearInlineSaveTimers(markUnknown=false){
 for(const timer of inlineSaveTimers.values())clearTimeout(timer);
 inlineSaveTimers.clear();
 if(markUnknown)for(const item of [...taskHistory,...(task?[task]:[])])
  if(item.kind==='record'&&item.recordJob?.state==='saving')item.recordJob.state='unknown';
}
function taskById(id){
 return task&&String(task.id)===String(id)?task:taskHistory.find(item=>String(item.id)===String(id));
}
const taskNames={ready:'Ready to start',starting:'Opening microphone',camera:'Opening camera',cameraReady:'Camera ready',listening:'Recording',finishing:'Finishing recording',captured:'Review captured media',captureError:'Capture unavailable',processing:'Reviewing what you shared',indeterminate:'No clear result yet',result:'What we know so far',timeout:'Taking longer than expected',offline:'Unable to continue right now',cancelled:'Canceled',interrupted:'Paused',speaking:'Reading aloud',picker:'Choose an entry type',editing:'Enter care details',saving:'Saving',success:'Entry saved'};
function migrateTaskTimeline(){
 taskHistory=taskHistory.map((item,i)=>({...item,id:item.id||'legacy-'+i,kind:item.kind||(item.name==='听哭闹'?'cry':'poop')}));
 const cards=[...taskHistory,...(task?[task]:[])];
 for(const item of cards)if(!messages.some(m=>m.role==='task'&&String(m.taskId)===String(item.id)))messages.push({role:'task',taskId:item.id});
}
function taskTerminal(item){return ['cancelled','result','indeterminate','success'].includes(item?.state);}
function parkCurrentTask(){
 if(!task)return;
 rememberInlineRecord();
 clearTimeout(taskTimer);clearTimeout(speechTimer);stopSpeech();stopLiveCapture();clearCapturedMedia();
 if(task.kind==='record'){
  task.confirmCancel=false;
  if(!taskTerminal(task)&&!['saving','unknown','failed'].includes(task.recordJob?.state)){
   task.beforePause=task.state;task.state='interrupted';
  }
 }else{
  if(!taskTerminal(task)){
   task.beforePause='ready';task.state='interrupted';task.captureNotice='上次采集已暂停，继续时请重新采集素材。';
  }
  task.mediaMeta=null;
 }
 taskHistory.push(structuredClone(task));
 task=null;
}
function startTask(kind,options={}){
 if(!CARE_ACTIONS[kind])return null;
 rememberInlineRecord();
 const resumeId=options.resumeFrom||null,source=resumeId?taskById(resumeId):null;
 if(resumeId&&(!source||source.resumedBy||source.kind!==kind))return null;
 const sourceSnapshot=source?structuredClone(source):null;
 parkCurrentTask();
 const next={kind,state:kind==='record'?'picker':'ready',id:'task-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),drafts:{}};
 if(sourceSnapshot){
  next.resumes=sourceSnapshot.id;
  if(kind==='record'){
   next.drafts=structuredClone(sourceSnapshot.drafts||{});
   next.type=sourceSnapshot.type;
   next.state=next.type?'editing':'picker';
   if(sourceSnapshot.recordJob?.state==='failed'){
    next.recordJob=structuredClone(sourceSnapshot.recordJob);
    next.recordJob.state='draft';
   }
  }else next.captureNotice='请重新采集素材。';
  const previous=taskHistory.find(item=>String(item.id)===String(sourceSnapshot.id));
  if(previous)previous.resumedBy=next.id;
 }
 task=next;messages.push({role:'task',taskId:task.id});taskTriggerRevision++;
 go('assistant');scrollChatTask();
 return task;
}
function resumeTask(id){
 const source=taskById(id);
 if(!source)return;
 if(source.resumedBy){scrollToTaskId(source.resumedBy);return;}
 if(source.kind==='record'){
  const jobState=source.recordJob?.state;
  if(['saving','unknown','success','deleted'].includes(jobState)||source.state==='success'){
   toast('请先核对这笔保存结果。');return;
  }
  if(source===task&&source.state==='interrupted'){
   taskTriggerRevision++;
   source.state=source.type?'editing':'picker';renderTask();scrollChatTask();return;
  }
 }else if(source===task&&source.state==='interrupted'){
  taskTriggerRevision++;
  source.state='ready';source.captureNotice='请重新采集素材。';renderTask();scrollChatTask();return;
 }
 if(startTask(source.kind,{resumeFrom:id}))scrollChatTask();
}
function taskButton(label,step,primary=false){return `<button class="${primary?'primary':'secondary'}" data-step="${step}">${label}</button>`;}
function assistantAvatar(){return '<span class="message-avatar"><canvas width="640" height="420" data-companion="ready" data-static="true" role="img" aria-label="Momcozy AI companion"></canvas></span>';}
function renderMessage(m){
  if(m.role==='user')return '<div class="bubble user"><small>You</small>'+safe(m.text)+'</div>';
 return '<div class="assistant-message">'+assistantAvatar()+'<div class="bubble"><small>Momcozy AI</small><div>'+safe(m.text)+'</div></div></div>';
}
function updateComposer(){const field=$('#chat-message'),hasContent=!!(field.value.trim()||attachment);$('#quick-voice').hidden=hasContent;$('#send-message').hidden=!hasContent;$('#send-message').disabled=chatBusy;field.style.height='44px';field.style.height=Math.min(88,Math.max(44,field.scrollHeight))+'px';}
function chatMore(){openSheet('添加素材','<div class="chat-more-grid"><button class="secondary" data-action="camera">'+icon('camera')+'拍照</button><button class="secondary" data-action="upload">'+icon('paperclip')+'附件</button></div>','chat-more');}
function launchCare(id,focus=true){startTask(id);if(focus)scrollChatTask();}
function rememberInlineRecord(){const f=$('#inline-record-form');if(!f||!task||String(task.id)!==f.dataset.taskId)return;task.drafts??={};task.drafts[f.dataset.type]=Object.fromEntries(new FormData(f));}
function selectInlineRecord(type,id){
 if(!task||task.kind!=='record'||String(task.id)!==String(id)||!TYPES[type]||['saving','unknown'].includes(task.recordJob?.state))return;
 taskTriggerRevision++;
 rememberInlineRecord();task.type=type;task.state='editing';
 if(task.recordJob?.state!=='draft')task.recordJob=null;
 renderTask();scrollChatTask();
}
function inlineButton(label,action,primary=false){return '<button type="button" class="'+(primary?'primary':'text-button')+'" data-inline-action="'+action+'">'+label+'</button>';}
function taskCompanion(state,staticFrame=false){return '<div class="task-companion" aria-hidden="true">'+canvas(state,staticFrame,!staticFrame&&['confirm','error','indeterminate'].includes(state))+'</div>';}
function inlineRecordCard(t,live){
 const j=t.recordJob,jobState=j?.state;
 let body='';
 if(t.state==='success'){
  const r=j?.record,exists=records.some(item=>item.id===r?.id),savedRecord=records.find(item=>item.id===r?.id);
  body='<div class="record-receipt">'+taskCompanion(exists?'success':'ready',!live)+icon(exists?'check':'info')+'<h3>'+(exists?(j.local?'记录已保存':'已保留在当前会话'):'这条记录已删除')+'</h3><p>'+(r?safe(r.type)+' · '+safe(value(r)):'')+'</p><p class="caption">'+(exists?(j.local?'已加入照护记录 · ':'浏览器存储不可用 · ')+(savedRecord?.sync==='待同步'?'待同步':'可在记录页查看'):'原任务回执保留，不会重新创建记录。')+'</p></div>';
 }else if(t.resumedBy&&!live){
  body='<h3>已在后续卡片继续</h3><p>这张卡片的草稿已转移，避免重复提交。</p><button type="button" class="secondary full" data-jump-task="'+safe(t.resumedBy)+'">查看后续卡片</button>';
 }else if(j&&['saving','unknown','failed'].includes(jobState)){
  const title={saving:'正在保存这笔记录',unknown:'保存结果待确认',failed:'这次还没有保存'}[jobState];
  const pose={saving:'saving',unknown:'confirm',failed:'error'}[jobState];
  const summary=j.record?safe(j.record.type)+' · '+safe(value(j.record)):'记录内容已保留';
  const explanation=jobState==='unknown'?'请沿用本笔请求核对结果，避免重复新增。':jobState==='failed'?'草稿仍在，可以继续修改或按原请求重试。':'正在保存，请稍等。';
  const actions=jobState==='unknown'?inlineButton('核对本笔保存结果','check',true):jobState==='failed'?inlineButton('继续修改','edit')+inlineButton('重试保存','retry',true):inlineButton('停止等待并核对','stop');
  body='<div class="record-receipt">'+taskCompanion(pose,!live)+icon(jobState==='failed'?'alert':'journal')+'<h3>'+title+'</h3><p>'+summary+'</p><p class="caption">'+explanation+'</p></div><div class="row-actions">'+actions+'</div>';
 }else if(t.confirmCancel&&live){
  body='<h3>结束这次记录？</h3><p>已填写的草稿会随本次对话保留，不会写入日志。</p><div class="row-actions">'+inlineButton('继续填写','keep',true)+inlineButton('确认结束','discard')+'</div>';
 }else if(t.state==='interrupted'||t.state==='cancelled'||!live){
  const paused=t.state!=='cancelled',hasDraft=Object.keys(t.drafts||{}).length>0||!!t.type;
  body='<h3>'+(paused?'这次记录已暂停':'本次记录已结束')+'</h3><p>'+(hasDraft?'已填写的内容仍保留在这段对话中。':'可以随时重新开始记录。')+'</p>';
  if(live&&paused)body+=inlineButton('继续记录','resume',true);
  else if(!t.resumedBy&&(paused||hasDraft))body+='<button type="button" class="secondary full" data-resume-task="'+safe(t.id)+'">'+(hasDraft?'继续这份草稿':'继续记录')+'</button>';
 }else if(t.state==='picker'){
  body='<h3>想记下哪件事？</h3><p>完成后会保存到对应的妈妈或宝宝日志。</p>'+recordTypeMenu('data-inline-type')+inlineButton('结束本次记录','cancel');
 }else{
  body='<form id="inline-record-form" data-task-id="'+safe(t.id)+'" data-type="'+safe(t.type)+'" class="form-stack">'+recordFields(t.type,t.drafts?.[t.type]||defaultRecord())+'<p id="inline-record-error" class="field-error" role="alert"></p><button class="primary full" type="submit">'+icon('check')+'保存记录</button><div class="record-secondary">'+inlineButton('更换记录类型','types')+inlineButton('结束本次记录','cancel')+'</div></form>';
 }
 const inlineState=t.state==='success'?'success':jobState==='saving'?'saving':['unknown','failed'].includes(jobState)||t.state==='interrupted'||t.state==='cancelled'||t.resumedBy?'recoverable':t.state==='picker'?'picker':'editing';
 const status=t.state==='success'?'已完成':jobState==='saving'?'保存中':jobState==='unknown'?'待核对':t.resumedBy?'已转移':'';
 return '<section class="task-card inline-record-card" data-category="'+recordCategory(t.type)+'" data-task-id="'+safe(t.id)+'" data-state-id="STATE-chat-record-'+inlineState+'" aria-label="会话记一笔"><div class="task-top">'+icon('journal')+'<span>记一笔</span><small>'+status+'</small></div>'+body+'</section>';
}
function submitInlineRecord(e){
 e.preventDefault();
 if(!task||task.kind!=='record'||task.state!=='editing'||e.target.dataset.taskId!==String(task.id)||(task.recordJob&&task.recordJob.state!=='draft'))return;
 taskTriggerRevision++;
 const d=Object.fromEntries(new FormData(e.target)),error=recordError(d);
 if(error){$('#inline-record-error').textContent=error;return;}
 rememberInlineRecord();
 const prior=task.recordJob,id=prior?.id||'r-'+Date.now()+'-'+Math.random().toString(36).slice(2,6);
 task.recordJob={...prior,id,requestId:prior?.requestId||'req-'+id,state:'saving',record:{...d,id,type:task.type,owner:task.type==='吸奶'?'妈妈':'宝宝',sync:'待同步'}};
 task.state='saving';beginInlineSave(task);
}
function beginInlineSave(target=task,force=false){
 if(!target?.recordJob)return;
 const id=String(target.id),job=target.recordJob,requestId=job.requestId||'req-'+job.id,epoch=conversationEpoch,outcome=scenario;
 job.requestId=requestId;
 clearTimeout(inlineSaveTimers.get(id));inlineSaveTimers.delete(id);
 job.state='saving';target.state='saving';
 renderTask();if(target===task)scrollChatTask();
 const timer=setTimeout(()=>{
  inlineSaveTimers.delete(id);
  if(epoch!==conversationEpoch)return;
  const ownerTask=taskById(id);
  if(!ownerTask||ownerTask.recordJob?.requestId!==requestId||ownerTask.recordJob.state!=='saving')return;
  if(!force&&['failure','unknown'].includes(outcome)){
   ownerTask.recordJob.state=outcome==='failure'?'failed':'unknown';
   renderTask();if(ownerTask===task)scrollChatTask();
  }else commitInlineSave(ownerTask);
 },900);
 inlineSaveTimers.set(id,timer);
}
function commitInlineSave(target=task){
 const j=target?.recordJob;
 if(!j||j.state==='success'||j.state==='deleted')return;
 clearTimeout(inlineSaveTimers.get(String(target.id)));inlineSaveTimers.delete(String(target.id));
 if(deletedRecordIds.has(j.id)){
  target.state='cancelled';j.state='deleted';renderTask();return;
 }
 const existing=records.findIndex(item=>item.id===j.id);
 if(existing<0)records.push(j.record);else records[existing]=j.record;
 selectJournalRecord(j.record);j.local=persist();j.state='success';target.state='success';
 homeMode='normal';render();if(target===task)scrollChatTask();
}
function actInlineRecord(action,id){
 const target=taskById(id);
 if(!target||target.kind!=='record'||(target.resumedBy&&target!==task))return;
 if(!['cancel','discard'].includes(action))taskTriggerRevision++;
 const live=target===task,j=target.recordJob;
 if(action==='check'){if(j?.state==='unknown')commitInlineSave(target);return;}
 if(action==='retry'){if(j?.state==='failed')beginInlineSave(target,true);return;}
 if(action==='stop'){
  if(j?.state==='saving'){
   clearTimeout(inlineSaveTimers.get(String(id)));inlineSaveTimers.delete(String(id));
   j.state='unknown';renderTask();toast('请沿用本笔请求核对保存结果。');
  }
  return;
 }
 if(action==='edit'){
  if(j?.state!=='failed')return;
  if(!live){resumeTask(id);return;}
  j.state='draft';target.state='editing';renderTask();scrollChatTask();return;
 }
 if(!live)return;
 rememberInlineRecord();
 if(action==='types'){if(target.state!=='editing')return;target.state='picker';if(j?.state!=='draft')target.recordJob=null;}
 else if(action==='cancel'){target.confirmCancel=true;}
 else if(action==='keep'){target.confirmCancel=false;}
 else if(action==='discard'){target.confirmCancel=false;target.state='cancelled';if(j?.state==='draft')target.recordJob=null;}
 else if(action==='resume'){if(target.state!=='interrupted')return;target.state=target.type?'editing':'picker';}
 else return;
 renderTask();scrollChatTask();
}
 function careStateId(state){return {'cameraReady':'camera-ready','captureError':'capture-error','indeterminate':'recoverable','timeout':'recoverable','offline':'recoverable','interrupted':'recoverable','cancelled':'recoverable','speaking':'result'}[state]||state;}
 function renderCareCard(t,live=true){if(t.kind==='record')return inlineRecordCard(t,live);
 const cry=t.kind==='cry',s=t.state,hasMedia=live&&capturedMedia?.taskId===t.id;let desc='',buttons='',detail='';
 if(s==='ready'){desc=t.captureNotice|| (cry?'收集一段清晰的哭声，完成后再核对。':'拍一张清晰照片，完成后再核对。');buttons=taskButton(cry?'开始收音':'拍照','capture',true);}
 if(s==='starting'||s==='camera'){desc=cry?'正在打开麦克风…':'正在打开相机…';}
 if(s==='cameraReady'){desc='将画面保持清晰，准备好后拍下照片。';detail='<div class="task-detail camera-preview"><video id="care-camera-preview" autoplay muted playsinline aria-label="相机取景画面"></video></div>';buttons=taskButton('拍下照片','shutter',true)+taskButton('选择照片','choose-photo');}
 if(s==='listening'){desc='正在收音 · '+safe(t.elapsedLabel||'00:00');buttons=taskButton('结束收音','finish',true);}
 if(s==='finishing'){desc='正在整理刚才的录音…';}
 if(s==='captured'){
  desc=hasMedia?'请核对素材，再决定是否继续。':'素材预览已关闭，需要重新采集后才能继续。';
  buttons=taskButton(cry?'重新收音':'重新拍照','recapture')+(hasMedia?taskButton('继续整理','analyze',true):'');
  detail=hasMedia?cry?'<div class="task-detail media-preview">'+icon('waveform')+'<span>'+safe(t.mediaMeta?.duration||'00:00')+' 录音</span><audio controls preload="metadata" src="'+capturedMedia.url+'" aria-label="播放刚才的录音"></audio></div>':'<div class="task-detail media-preview"><img src="'+capturedMedia.url+'" alt="刚才拍摄的照片"><span data-user-content>'+safe(t.mediaMeta?.name||'Photo captured')+'</span></div>':'<div class="task-detail media-preview">'+icon(cry?'waveform':'image')+'<span>当前没有可用素材</span></div>';
 }
 if(s==='captureError'){desc=safe(t.captureNotice||'暂时无法采集，请检查设备后重试。');buttons=taskButton(cry?'重新收音':'重新拍照','recapture',true)+(cry?'':taskButton('选择照片','choose-photo'));}
 if(s==='processing'){desc='正在整理这次观察…';}
 if(s==='indeterminate'){desc='目前没有可靠的自动判断。你可以重新采集，或描述刚才观察到的情况。';buttons=taskButton(cry?'重新收音':'重新拍照','recapture',true)+taskButton('继续聊聊','chat');}
 if(s==='result'){desc='素材已收到。目前没有自动分析结果，请结合实际观察继续描述。';detail='<div class="task-detail"><b>已收到</b><p>'+safe(cry?'哭声音频':'照片')+'</p><b>还需要了解</b><p>持续时间、当时的照护情境和你的观察。</p></div>';buttons=prefs.sound?taskButton('播报内容','speak')+taskButton('继续聊聊','chat',true):taskButton('继续聊聊','chat',true);}
 if(s==='speaking'){desc='正在播报当前文字内容，可随时停止。';buttons=taskButton('停止播报','stop-speech',true);}
 if(s==='timeout'||s==='offline'){desc=s==='timeout'?'整理暂时没有返回，可以重试或结束。':'当前无法继续整理，可以稍后重试。';buttons=taskButton('重试整理','retry',true);}
 if(s==='interrupted'){desc=t.resumedBy&&!live?'已在后续卡片继续。':'这次操作已暂停，继续后需要重新采集素材。';buttons=live?taskButton('继续任务','resume',true):t.resumedBy?'<button class="secondary" data-jump-task="'+safe(t.resumedBy)+'">查看后续卡片</button>':'<button class="secondary" data-resume-task="'+safe(t.id)+'">继续任务</button>';}
 if(s==='cancelled'){desc='本次任务已取消。';buttons=taskButton('重新开始','restart',true);}
 if(!live&&s!=='interrupted')buttons='';
 const pose={starting:'processing',camera:'processing',cameraReady:'confirm',finishing:'processing',captured:'confirm',captureError:'error',timeout:'timeout'}[s]||(['ready','listening','processing','indeterminate','result','speaking','offline','interrupted','cancelled'].includes(s)?s:'ready');
  return `<section class="task-card care-task-card" data-category="${cry?'crying':'diaper'}" data-task-id="${safe(t.id)}" data-state-id="STATE-task-${careStateId(s)}" aria-labelledby="task-title-${safe(t.id)}"><div class="task-top">${icon(cry?'waveform':'diaper')}<span>${cry?'听哭闹':'看便便'}</span></div>${taskCompanion(pose,!live)}<h3 id="task-title-${safe(t.id)}">${taskNames[s]||'准备开始'}</h3><p class="task-desc">${desc}</p>${detail}${buttons?`<div class="row-actions">${buttons}</div>`:''}${live&&!['cancelled','result','indeterminate'].includes(s)?'<button class="text-button" data-step="cancel">取消本次任务</button>':''}</section>`;
}
function renderTask(){rememberInlineRecord();const keep=page==='assistant'&&!chatPinned,top=$('#assistant-scroll').scrollTop;migrateTaskTimeline();renderResumeOnly();const active=!!task||messages.length>0;$('#assistant').dataset.chat=active?'active':'welcome';$('#assistant-intro').hidden=active;$('#conversation-home-head').hidden=!active;$('#task-slot').innerHTML='';$('#conversation').innerHTML=messages.map(m=>{if(m.role!=='task')return renderMessage(m);const t=task&&String(task.id)===String(m.taskId)?task:taskHistory.find(t=>String(t.id)===String(m.taskId));return t?'<div class="assistant-message task-message">'+assistantAvatar()+'<div class="task-message-body"><small class="task-author">Momcozy AI</small>'+renderCareCard(t,t===task)+'</div></div>':'';}).join('');$('#attachments').innerHTML=attachment?'<div class="attachment">'+icon('file')+'<span data-user-content>'+safe(attachment)+'</span><button type="button" data-action="remove-attachment" aria-label="Remove attachment">'+icon('close')+'</button></div>':'';updateComposer();checkpointConversation();hydrate();if(task?.state==='cameraReady')mountCameraPreview();if(keep)$('#assistant-scroll').scrollTop=top;else if(page==='assistant'&&!chatGesture&&active)scrollChatLatest(false);updateLatestButton();}
function setTask(s){task.state=s;renderTask();renderResumeOnly();}
function renderResumeOnly(){/* The conversation is the home surface; active tasks remain visible in its timeline. */}
let activeSpeech=null;
function stopSpeech(){if('speechSynthesis'in window)try{window.speechSynthesis.cancel();}catch{}activeSpeech=null;}
function speakTaskResult(){
 if(!prefs.sound)return;
 if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window)){toast('当前浏览器不支持语音播报，文字内容仍可查看。');setTask('result');return;}
 stopSpeech();
 const speechTaskId=task?.id;
 try{const utterance=new SpeechSynthesisUtterance('Media received. It would help to know how long it lasted, what was happening, and what you noticed.');utterance.lang='en-US';utterance.rate=1;utterance.onend=()=>{if(activeSpeech===utterance&&task?.id===speechTaskId){activeSpeech=null;if(task.state==='speaking')setTask('result');}};utterance.onerror=()=>{if(activeSpeech===utterance&&task?.id===speechTaskId){activeSpeech=null;if(task.state==='speaking')setTask('result');toast('语音播报未完成，请阅读文字内容。');}};activeSpeech=utterance;window.speechSynthesis.speak(utterance);}catch{activeSpeech=null;setTask('result');toast('语音播报无法启动，请阅读文字内容。');}
}
function clearCapturedMedia(){if(capturedMedia?.url)URL.revokeObjectURL(capturedMedia.url);capturedMedia=null;}
function stopLiveCapture(){mediaOperation++;clearInterval(captureClock);captureClock=null;const session=mediaSession;mediaSession=null;if(!session)return;if(session.recorder&&session.recorder.state!=='inactive')try{session.recorder.stop();}catch{}session.stream?.getTracks().forEach(track=>track.stop());}
function mediaTime(ms){const n=Math.max(0,Math.floor(ms/1000));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
function captureFailure(error,kind){const name=error?.name||'';if(name==='NotAllowedError'||name==='PermissionDeniedError')return kind==='cry'?'麦克风未能启用，请在浏览器中允许使用后重试。':'相机未能启用，请检查浏览器的相机权限后重试。';if(name==='NotFoundError'||name==='DevicesNotFoundError')return kind==='cry'?'没有找到可用麦克风，请连接设备后重试。':'没有找到可用相机，请连接设备后重试。';if(name==='NotReadableError')return '设备暂时被其他应用占用，请关闭占用后重试。';if(name==='NotSupportedError'||name==='SecurityError')return kind==='cry'?'当前浏览器无法录音，请换用支持麦克风录制的浏览器。':'当前浏览器无法拍照，请换用支持相机取景的浏览器。';return kind==='cry'?'收音暂时无法启动，请检查麦克风后重试。':'拍照暂时无法启动，请检查相机后重试。';}
function failTaskCapture(error,kind,id,operation){if(operation!==mediaOperation||task?.id!==id)return;stopLiveCapture();clearCapturedMedia();task.captureNotice=captureFailure(error,kind);task.mediaMeta=null;setTask('captureError');}
async function startCryCapture(){if(!task||task.kind!=='cry')return;stopLiveCapture();clearCapturedMedia();task.captureNotice='';task.mediaMeta=null;const id=task.id,operation=mediaOperation;setTask('starting');
 try{if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw new DOMException('Recording unavailable','NotSupportedError');const stream=await navigator.mediaDevices.getUserMedia({audio:true});if(operation!==mediaOperation||task?.id!==id){stream.getTracks().forEach(track=>track.stop());return;}const recorder=new MediaRecorder(stream),chunks=[];const session={taskId:id,stream,recorder,startedAt:Date.now(),chunks,stopping:false};mediaSession=session;recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};recorder.onerror=e=>failTaskCapture(e.error||e,'cry',id,operation);recorder.onstop=()=>{stream.getTracks().forEach(track=>track.stop());if(mediaSession!==session||!session.stopping||operation!==mediaOperation||task?.id!==id)return;mediaSession=null;clearInterval(captureClock);captureClock=null;const blob=new Blob(chunks,{type:recorder.mimeType||chunks[0]?.type||'audio/webm'});if(!blob.size){task.captureNotice='这次没有录到声音，请重新收音。';setTask('captureError');return;}const duration=mediaTime(Date.now()-session.startedAt);capturedMedia={taskId:id,kind:'cry',blob,url:URL.createObjectURL(blob)};task.mediaMeta={kind:'audio',duration};setTask('captured');};
  stream.getAudioTracks().forEach(track=>{track.onended=()=>{if(mediaSession!==session||session.stopping)return;stopLiveCapture();if(task?.id===id){task.captureNotice='麦克风已中断，请重新收音。';setTask('captureError');}};});recorder.start();setTask('listening');captureClock=setInterval(()=>{if(mediaSession!==session||task?.state!=='listening')return;task.elapsedLabel=mediaTime(Date.now()-session.startedAt);const label=$('.care-task-card[data-task-id="'+id+'"] .task-desc');if(label)label.textContent='正在收音 · '+task.elapsedLabel;},500);
 }catch(error){failTaskCapture(error,'cry',id,operation);}}
function finishCryCapture(){const session=mediaSession;if(!session||session.taskId!==task?.id||session.recorder.state==='inactive')return;session.stopping=true;clearInterval(captureClock);captureClock=null;setTask('finishing');try{session.recorder.stop();}catch(error){failTaskCapture(error,'cry',task.id,mediaOperation);}}
function openPhotoPicker(){if(!task||task.kind!=='poop')return;stopLiveCapture();clearCapturedMedia();task.captureNotice='';task.mediaMeta=null;setTask('ready');const picker=$('#care-photo-picker');picker.value='';picker.dataset.taskId=task.id;picker.dataset.operation=String(mediaOperation);try{picker.click();}catch(error){failTaskCapture(error,'poop',task.id,mediaOperation);}}
function mountCameraPreview(){if(!mediaSession?.stream||mediaSession.taskId!==task?.id)return;const video=$('#care-camera-preview');if(!video)return;video.srcObject=mediaSession.stream;video.play().catch(()=>{});}
async function startPhotoCapture(){if(!task||task.kind!=='poop')return;stopLiveCapture();clearCapturedMedia();task.captureNotice='';task.mediaMeta=null;const id=task.id,operation=mediaOperation;setTask('camera');
 try{if(!navigator.mediaDevices?.getUserMedia)throw new DOMException('Camera unavailable','NotSupportedError');let stream;try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});}catch(error){if(error.name!=='OverconstrainedError'&&error.name!=='NotFoundError')throw error;stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});}if(operation!==mediaOperation||task?.id!==id){stream.getTracks().forEach(track=>track.stop());return;}const session={taskId:id,stream};mediaSession=session;stream.getVideoTracks().forEach(track=>{track.onended=()=>{if(mediaSession!==session)return;stopLiveCapture();if(task?.id===id){task.captureNotice='相机已中断，请重新拍照。';setTask('captureError');}};});setTask('cameraReady');mountCameraPreview();}
 catch(error){failTaskCapture(error,'poop',id,operation);}}
function takePhoto(){if(!task||task.kind!=='poop'||task.state!=='cameraReady'||!mediaSession)return;const video=$('#care-camera-preview');if(!video?.videoWidth){toast('相机画面尚未准备好，请稍等。');return;}const id=task.id,operation=mediaOperation,canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);canvas.toBlob(blob=>{if(task?.id!==id||operation!==mediaOperation)return;if(!blob){task.captureNotice='照片没有拍摄成功，请重试。';stopLiveCapture();setTask('captureError');return;}stopLiveCapture();clearCapturedMedia();capturedMedia={taskId:id,kind:'poop',blob,url:URL.createObjectURL(blob)};task.mediaMeta={kind:'image',name:'Photo captured'};setTask('captured');},'image/jpeg',.88);}
function receivePhoto(file){const id=$('#care-photo-picker').dataset.taskId,operation=Number($('#care-photo-picker').dataset.operation);if(operation!==mediaOperation||task?.id!==id||task.kind!=='poop')return;if(!file){if(task.state==='camera')setTask('ready');return;}if(!file.type.startsWith('image/')){task.captureNotice='请选择照片文件。';setTask('captureError');return;}stopLiveCapture();clearCapturedMedia();capturedMedia={taskId:id,kind:'poop',blob:file,url:URL.createObjectURL(file)};task.mediaMeta={kind:'image',name:file.name||'Photo captured'};setTask('captured');}
$('#care-photo-picker').addEventListener('change',e=>receivePhoto(e.target.files?.[0]));
function analyze(force=false){clearTimeout(taskTimer);if(!task||task.kind==='record')return;if(capturedMedia?.taskId!==task.id){task.captureNotice='素材需要重新采集。';setTask('ready');return;}if(scenario==='offline'&&!force){setTask('offline');return;}setTask('processing');const id=task.id;taskTimer=setTimeout(()=>{if(!task||task.id!==id||task.state!=='processing')return;setTask(analysisOutcome==='timeout'?'timeout':'indeterminate');},1800);}
function stepTask(step){if(!task)return;
  if(['capture','shutter','choose-photo','finish','recapture','analyze','retry','speak','resume'].includes(step))taskTriggerRevision++;
 if(step==='cancel'){clearTimeout(taskTimer);clearTimeout(speechTimer);stopSpeech();stopLiveCapture();clearCapturedMedia();setTask('cancelled');return;}
 if(step==='capture'){if(task.kind==='cry')startCryCapture();else if(task.kind==='poop')startPhotoCapture();return;}
 if(step==='shutter'){takePhoto();return;}
 if(step==='choose-photo'){openPhotoPicker();return;}
 if(step==='finish'){finishCryCapture();return;}
  if(step==='recapture'){if(task.kind==='cry')startCryCapture();else if(task.kind==='poop')startPhotoCapture();return;}
 if(step==='analyze'||step==='retry'){analyze(step==='retry');return;}
 if(step==='restart'){const kind=task.kind;startTask(kind);return;}
 if(step==='chat'){$('#chat-message').focus({preventScroll:true});scrollChatLatest();return;}
 if(step==='speak'){if(!prefs.sound){toast('请先开启声音。');return;}const speechTaskId=task.id;setTask('speaking');speakTaskResult();speechTimer=setTimeout(()=>{if(task?.id===speechTaskId&&task.state==='speaking'){stopSpeech();setTask('result');}},12000);return;}
 if(step==='stop-speech'){clearTimeout(speechTimer);stopSpeech();setTask('result');return;}
 if(step==='resume'){const prev=task.beforePause;pausedByBackground=false;if(prev==='processing')analyze(true);else if(prev==='speaking')setTask('result');else setTask('ready');}
}
function applyPrefs(){document.documentElement.dataset.theme=prefs.theme;document.body.dataset.theme=prefs.theme;document.body.dataset.platform=prefs.platform;document.body.dataset.reduced=prefs.reduced;document.body.dataset.transparency=prefs.transparency?'reduced':'normal';document.body.dataset.contrast=prefs.contrast;document.body.dataset.sound=prefs.sound?'on':'off';$$('button[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===prefs.theme)));$$('button[data-platform]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.platform===prefs.platform)));const sound=$('.sound-button');sound.setAttribute('aria-pressed',String(!!prefs.sound));sound.setAttribute('aria-label',prefs.sound?'Turn sound off':'Turn sound on');sound.title=prefs.sound?'Turn sound off':'Turn sound on';sound.innerHTML=icon(prefs.sound?'volume':'volume-off');if(!prefs.sound){stopSpeech();if(task?.state==='speaking'){clearTimeout(speechTimer);setTask('result');}}Companion.setReduced(prefs.reduced);persist();}
function settings(){openSheet('阅读与预览设置',`<p class="sheet-description">照护卡片直接调用浏览器麦克风与相机；AI 分析、语音转写、附件、设备与同步仍为原型示例。</p><section class="settings-group"><h3>显示环境</h3><div class="segments"><button data-theme="light" aria-pressed="${prefs.theme==='light'}">明亮</button><button data-theme="dark" aria-pressed="${prefs.theme==='dark'}">夜间</button></div><div class="segments"><button data-platform="ios" aria-pressed="${prefs.platform==='ios'}">iOS 表达</button><button data-platform="android" aria-pressed="${prefs.platform==='android'}">Android 表达</button></div>${[['reduced','减少动态效果'],['transparency','减少透明度'],['contrast','增强对比度']].map(([k,t])=>`<label class="check-row"><input type="checkbox" data-pref="${k}" ${prefs[k]?'checked':''}><span>${t}</span></label>`).join('')}<p class="caption">同时遵循系统减少动态效果。HTML 只近似材质，不等同于原生系统组件。</p></section><section class="settings-group"><h3>交互响应</h3><label>保存与网络<select id="scenario">${[['normal','正常保存'],['failure','保存失败'],['unknown','保存结果未知'],['offline','离线待同步']].map(([v,t])=>`<option value="${v}" ${scenario===v?'selected':''}>${t}</option>`).join('')}</select></label><label>卡片整理状态<select id="analysis-outcome">${[['indeterminate','无法判断'],['timeout','等待超时']].map(([v,t])=>`<option value="${v}" ${analysisOutcome===v?'selected':''}>${t}</option>`).join('')}</select></label><label>今日行动建议<select id="home-mode">${[['normal','依据本机记录'],['empty','空记录（仅预览）'],['error','建议加载失败']].map(([v,t])=>`<option value="${v}" ${homeMode===v?'selected':''}>${t}</option>`).join('')}</select></label></section><section class="settings-group"><h3>首次使用</h3><button class="secondary full" data-action="onboarding">${icon('user')}体验基础资料录入</button><p class="caption">不会清除已有记录；完成后更新基础资料。</p></section><button class="primary full" data-action="close">完成设置</button><button class="text-button danger full" data-action="reset-confirm">重置本版演示数据</button>`,'settings');}
function profileNumber(label,name,value,limits){
 const raw=value==null?'':String(value),legacy=!profileInteger(raw,limits.min,limits.max),hint='profile-'+name+'-hint';
 return '<label><span>'+label+' <small>选填</small></span><input type="text" name="'+name+'" inputmode="numeric" pattern="[0-9]*" value="'+safe(raw)+'" data-min="'+limits.min+'" data-max="'+limits.max+'" aria-describedby="'+hint+' profile-error"'+(legacy?' aria-invalid="true"':'')+'><small id="'+hint+'" class="range-hint'+(legacy?' invalid':'')+'">'+(legacy?'原值 '+safe(raw)+' 超出范围，请修改或清空。':limits.min+'–'+limits.max+limits.unit+'，可留空。')+'</small></label>';
}
function profile(kind){
 const baby=kind==='baby',multi=Array.isArray(profiles.babies)&&profiles.babies.length>1;
 const intro=multi&&baby?'当前编辑宝宝 1；其他宝宝可在「基础照护资料」修改。':'资料用于提供照护背景。保存后会更新本原型内的对应显示。';
 const firstWeeks=profiles.babies?.[0]?.weeks??profiles.birthWeeks??'';
 const babyFields=field('宝宝称呼','baby','text',profiles.baby,'required maxlength="12"')+profileNumber(multi?'宝宝 1 出生孕周':'出生孕周','birthWeeks',firstWeeks,PROFILE_LIMITS.birthWeeks)+field('出生日期 · 选填','birth','date',profiles.birth,'max="'+profileToday()+'"');
 const momFields='<label><span>当前阶段 · 选填</span><select name="momStage"><option value="" '+(!CARE_STAGES.includes(profiles.momStage)?'selected':'')+'>暂不填写</option>'+CARE_STAGES.map(stage=>'<option value="'+stage+'" '+(stage===profiles.momStage?'selected':'')+'>'+stage+'</option>').join('')+'</select></label><div class="profile-number-grid">'+profileNumber('妈妈年龄','momAge',profiles.momAge,PROFILE_LIMITS.age)+profileNumber('已分娩次数','parity',profiles.parity,PROFILE_LIMITS.parity)+'</div>'+field('当前关注','focus','text',profiles.focus,'maxlength="60"');
 openSheet(baby?'宝宝资料':'妈妈资料','<p class="sheet-description">'+intro+'</p><form id="profile-form" data-kind="'+kind+'" class="form-stack" novalidate>'+(baby?babyFields:momFields)+'<p id="profile-error" class="field-error" role="alert"></p><p class="caption">数据仅留在当前浏览器，未连接真实账户。</p><button class="primary full" type="submit">保存资料</button></form>','profile');
}
function profileReject(message,input){
  $('#profile-error').textContent=message;if(input){input.setAttribute('aria-invalid','true');const hint=$('#profile-'+input.name+'-hint'),limits=input.name==='momAge'?PROFILE_LIMITS.age:PROFILE_LIMITS[input.name];if(hint&&limits){hint.textContent=limits.min+'–'+limits.max+limits.unit+'，请输入范围内整数，或留空。';hint.classList.add('invalid');}input.focus();}
}
function submitProfile(e){
 e.preventDefault();const form=e.target,kind=form.dataset.kind,d=Object.fromEntries(new FormData(form));
 const numeric=kind==='baby'?[['birthWeeks',PROFILE_LIMITS.birthWeeks]]:[['momAge',PROFILE_LIMITS.age],['parity',PROFILE_LIMITS.parity]];
 for(const [name,limits] of numeric)if(!profileInteger(d[name],limits.min,limits.max))return profileReject(limits.label+'仅支持 '+limits.min+'–'+limits.max+limits.unit+'；请输入范围内整数，或留空。',form.elements[name]);
 const invalid=[...form.querySelectorAll('input,select')].find(el=>!el.checkValidity());
 if(invalid)return profileReject(invalid.name==='birth'?'请填写有效的出生日期，不能晚于今天。':invalid.name==='baby'?'请填写宝宝称呼。':'请检查填写内容。',invalid);
 if(kind==='baby'&&!String(d.baby||'').trim())return profileReject('请填写宝宝称呼。',form.elements.baby);
 if(kind==='baby'&&!validProfileBirth(d.birth))return profileReject('请填写有效的出生日期，不能晚于今天。',form.elements.birth);
 let draftChanged=false;
 if(kind==='baby'){
  const babies=structuredClone(profiles.babies?.length?profiles.babies:[{birth:'',weeks:''}]);
  babies[0]={...babies[0],birth:d.birth,weeks:d.birthWeeks};
  profiles={...profiles,baby:d.baby.trim(),birth:d.birth,birthWeeks:d.birthWeeks,babies,omittedNumbers:{...profiles.omittedNumbers,'baby-0-weeks':d.birthWeeks===''}};
  if(onboarding.status==='paused'&&onboarding.draft){onboarding.draft.babies??=[];onboarding.draft.babies[0]={...onboarding.draft.babies[0],birth:d.birth,weeks:d.birthWeeks};onboarding.draft.omitted??={};onboarding.draft.omitted['baby-0-weeks']=d.birthWeeks==='';draftChanged=true;}
 }else{
  profiles={...profiles,momStage:d.momStage,momAge:d.momAge,parity:d.parity,focus:d.focus,omittedNumbers:{...profiles.omittedNumbers,age:d.momAge==='',parity:d.parity===''}};
  if(onboarding.status==='paused'&&onboarding.draft){onboarding.draft.stage=d.momStage;onboarding.draft.age=d.momAge;onboarding.draft.parity=d.parity;onboarding.draft.omitted??={};onboarding.draft.omitted.age=d.momAge==='';onboarding.draft.omitted.parity=d.parity==='';draftChanged=true;}
 }
 const ok=persist(),draftOk=!draftChanged||storeOnboarding();closeSheet();render();toast(ok&&draftOk?'资料已保存到本机':'资料已更新，仅当前会话有效');
}
document.addEventListener('input',e=>{if(!e.target.closest('#profile-form'))return;$('#profile-error').textContent='';e.target.removeAttribute('aria-invalid');const limits=e.target.name==='momAge'?PROFILE_LIMITS.age:PROFILE_LIMITS[e.target.name],hint=$('#profile-'+e.target.name+'-hint');if(limits&&hint){hint.textContent=limits.min+'–'+limits.max+limits.unit+'，可留空。';hint.classList.remove('invalid');}});
function showSync(){const pending=records.filter(r=>r.sync==='待同步');openSheet('应用记录同步',`<p class="sheet-description">手工记录与设备连接分别管理。本机保存不等于已同步到账户。</p>${note(syncBusy?'正在演示同步…':pending.length?`${pending.length} 条记录待同步`:'没有待同步的本机记录','','cloud')}<div>${pending.map(r=>`<div class="record-row" data-category="${recordCategory(r.type)}"><span class="icon-tile">${icon(TYPES[r.type])}</span><span class="row-copy"><b>${safe(r.type)} · ${safe(value(r))}</b><small>${safe(careDateTime(r.time))}</small></span></div>`).join('')}</div><button class="primary full" style="margin-top:24px" data-action="sync-now" ${syncBusy||!pending.length?'disabled':''}>${syncBusy?'正在同步':'演示恢复并同步'}</button><p class="caption" style="margin-top:16px">不会上传到真实账户。演示成功后会明确标注为「已同步（模拟）」。</p>`,'sync');}
function devices(){openSheet('我的设备',`<p class="sheet-description">Momcozy 吸奶器 · 示例设备</p><div class="profile-card content-surface"><span class="profile-orbit">${icon('device')}</span><h3>${deviceConnected?'已连接（模拟）':'未连接'}</h3><p>最近设备同步：昨日 20:30（示例）</p></div>${note('设备连接与应用记录同步独立显示。连接设备不会把手工待同步记录标记为已同步。')}<button class="primary full" data-action="device-toggle">${deviceConnected?'演示断开连接':'演示连接设备'}</button><button class="text-button full" data-action="device-history">查看设备同步记录</button>`,'devices');}
 function detail(t){let html='';if(t==='奶量趋势'){const dates=Array.from({length:7},(_,i)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-(6-i));return localDateKey(d);}),daily=dates.map(date=>({date,items:records.filter(r=>r.type==='吸奶'&&r.time.startsWith(date))})),max=Math.max(1,...daily.map(d=>d.items.reduce((n,r)=>n+Number(r.amount),0))),today=daily[6];html='<p class="sheet-description">最近 7 天 · 按发生日期汇总妈妈的吸出量。</p><div class="metric-value"><b>'+today.items.reduce((n,r)=>n+Number(r.amount),0)+'</b><span>ml · 今日 '+today.items.length+' 次</span></div><div class="trend-bars">'+daily.map(d=>{const n=d.items.reduce((n,r)=>n+Number(r.amount),0);return '<div style="height:'+(d.items.length?Math.max(25,n/max*100):18)+'%">'+(d.items.length?n:'—')+'</div>';}).join('')+'</div><div class="trend-labels">'+dates.map(d=>'<span>'+new Intl.DateTimeFormat('en-US',{month:'numeric',day:'numeric'}).format(new Date(d+'T12:00:00'))+'</span>').join('')+'</div><p class="caption">「—」表示没有记录，不代表吸出量为零。只汇总妈妈吸奶，不与宝宝喂养量合并。</p>';}else if(t==='喂养与睡眠'){const feeds=records.filter(r=>r.owner==='宝宝'&&r.type!=='换尿布'&&r.time.startsWith(DAY));html='<p class="sheet-description">今天 · 喂养时间线</p>'+feeds.sort(byTime).map(row).join('')+'<div class="module"><h3>睡眠</h3><div class="empty">'+icon('moon')+'<h3>还没有睡眠记录</h3><p>有记录后，可以在这里回顾休息时间。</p></div></div>';}else if(t==='生长发育'){html='<p class="sheet-description"><span data-user-content>'+safe(profiles.baby||'Baby')+'</span> · 最近的身长与体重</p><div class="summary content-surface"><div class="metric"><div class="metric-label">身长</div><div class="metric-value"><b>—</b><span>cm</span></div></div><div class="metric"><div class="metric-label">体重</div><div class="metric-value"><b>—</b><span>kg</span></div></div></div><div class="empty">'+icon('growth')+'<h3>等待第一份成长记录</h3><p>身长与体重记录会按日期排列，<br>帮助你回顾宝宝的细微变化。</p></div>';}else{html='<p class="sheet-description">妈妈 · 最近的身体与状态记录</p><div class="empty">'+icon('heart')+'<h3>也给自己留一点关注</h3><p>目前没有可回看的状态记录。<br>想聊聊当下的感受，可以找Momcozy AI说说。</p></div><button class="primary full" data-action="mom-chat">和Momcozy AI聊聊</button>';}openSheet(t,html+'<button class="secondary full" style="margin-top:24px" data-action="close">返回记录</button>');}
function profileMenu(){
 const groups=[
   ['个人与照护资料',[['menu-mine','user','我的','资料与设备总览'],['onboarding','baby','基础照护资料','身份、阶段与妈妈宝宝信息'],['mom-profile','heart','妈妈资料','年龄、分娩次数与当前关注'],['baby-profile','baby','宝宝资料','称呼、出生日期与出生孕周']]],
  ['设备与同步',[['devices','device','我的设备','连接与同步演示'],['sync','cloud','记录同步','查看本机待同步记录']]],
  ['对话管理',[['chat-history','clock','历史对话','搜索、恢复与管理对话'],['new-chat','plus','开始新对话','保留当前会话后新建']]],
  ['偏好设置',[['settings','settings','阅读与预览设置','主题、动效与模拟状态']]]
 ];
 const html=groups.map(([title,items])=>`<section class="profile-menu-group"><h3>${title}</h3><div class="profile-menu">${items.map(([action,glyph,label,description])=>`<button class="menu-row" data-action="${action}"><span class="icon-tile">${icon(glyph)}</span><span><b>${label}</b><small>${description}</small></span>${icon('chevron-right')}</button>`).join('')}</div></section>`).join('');
 openSheet('我的',`<p class="sheet-description">从记录页管理资料、设备、对话及设置。</p>${html}`,'profile-menu');
}
function recordFilter(){const choices=owner==='宝宝'?[['all','全部记录'],['feed','喂养'],['diaper','尿布']]:[['all','全部记录'],['pump','吸奶']];openSheet('筛选时间线',`<p class="sheet-description">仅筛选当前日期与${owner}的时间线；上方摘要仍汇总全部已记录事件。</p><div class="filter-list">${choices.map(([id,label])=>`<button data-record-filter="${id}" aria-pressed="${journalFilter===id}">${icon(journalFilter===id?'check':'chevron-right')}<span>${label}</span></button>`).join('')}</div>`,'record-filter');}
 function inputPreview(kind){openSheet(kind==='camera'?'添加照片':'添加附件',`<p class="sheet-description">当前为素材输入演示，不调用真实相机，也不上传任何文件。</p><div class="empty">${icon(kind==='camera'?'camera':'paperclip')}<h3>${kind==='camera'?'选择一张示例照片':'选择一份示例附件'}</h3><p>添加后先在输入框确认，再发送。</p></div><button class="primary full" data-attach="${kind==='camera'?'Sample photo · Not uploaded':'Sample attachment · Not uploaded'}">添加示例素材</button>`,'attachment');}
let voiceActive=false,voiceHoldTimer=null,voicePointerId=null,voiceKey=null;
function voice(){if(task&&['starting','listening','camera','cameraReady','finishing'].includes(task.state)){stopLiveCapture();clearCapturedMedia();task.beforePause='ready';task.state='interrupted';task.captureNotice='Capture paused. You’ll need to capture the media again to continue.';task.mediaMeta=null;renderTask();}voiceActive=true;$('#voice-status').hidden=false;}
function stopVoice(){clearTimeout(voiceHoldTimer);voiceHoldTimer=null;voiceActive=false;voicePointerId=null;voiceKey=null;$('#voice-status').hidden=true;}
function cancelVoice(){if(!voiceActive&&!voiceHoldTimer)return;$('#voice-status').hidden=true;stopVoice();toast('语音输入演示已取消，草稿未更改');}
function finishVoice(){if(!voiceActive)return;const field=$('#chat-message');field.value=field.value.trim()?field.value.trim()+'\nI’d like to review today’s feedings.':'I’d like to review today’s feedings.';$('#voice-status').hidden=true;stopVoice();updateComposer();checkpointConversation();field.focus({preventScroll:true});toast('示例转写已放入输入框，可修改后发送');}
const voiceButton=$('#quick-voice');
voiceButton.addEventListener('click',e=>e.stopPropagation());
voiceButton.addEventListener('pointerdown',e=>{if(e.button!==0||voiceButton.hidden||voiceHoldTimer||voiceActive)return;voicePointerId=e.pointerId;voiceHoldTimer=setTimeout(()=>{voiceHoldTimer=null;voice();},300);e.preventDefault();});
voiceButton.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('pointermove',e=>{if(e.pointerId!==voicePointerId||(!voiceActive&&!voiceHoldTimer))return;const r=voiceButton.getBoundingClientRect(),margin=18;if(e.clientX<r.left-margin||e.clientX>r.right+margin||e.clientY<r.top-margin||e.clientY>r.bottom+margin)cancelVoice();},{passive:true});
 window.addEventListener('pointerup',e=>{if(e.pointerId!==voicePointerId)return;const r=voiceButton.getBoundingClientRect(),margin=18;if(e.clientX<r.left-margin||e.clientX>r.right+margin||e.clientY<r.top-margin||e.clientY>r.bottom+margin){cancelVoice();return;}if(voiceHoldTimer){stopVoice();toast('请长按语音键，再松开完成示例转写。');return;}finishVoice();});
window.addEventListener('pointercancel',e=>{if(e.pointerId===voicePointerId)cancelVoice();});
voiceButton.addEventListener('keydown',e=>{if(![' ','Enter'].includes(e.key)||e.repeat||voiceKey)return;e.preventDefault();voiceKey=e.key;voiceHoldTimer=setTimeout(()=>{voiceHoldTimer=null;voice();},300);});
 window.addEventListener('keyup',e=>{if(e.key!==voiceKey)return;e.preventDefault();if(voiceHoldTimer){stopVoice();toast('请按住空格或回车，再松开完成示例转写。');return;}finishVoice();});
window.addEventListener('blur',cancelVoice);
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.sidebar){activateSidebar(b.dataset.sidebar);return;}
 if(b.dataset.adviceIndex!==undefined){changeAdvice(Number(b.dataset.adviceIndex));return;}
 if(b.dataset.onboardingBaby!==undefined){readOnboardingFields();onboarding.draft.activeBaby=Number(b.dataset.onboardingBaby);storeOnboarding();renderOnboarding();$('[data-onboarding-baby="'+b.dataset.onboardingBaby+'"]').focus({preventScroll:true});return;}
 if(b.dataset.onboardingChoice){readOnboardingFields();const key=b.dataset.onboardingChoice;onboarding.draft[key]=(key==='role'?CARE_ROLES:CARE_STAGES)[Number(b.dataset.choiceIndex)];storeOnboarding();renderOnboarding();$('[data-onboarding-choice="'+key+'"][data-choice-index="'+b.dataset.choiceIndex+'"]').focus({preventScroll:true});return;}
 if(b.dataset.onboardingConcern!==undefined){readOnboardingFields();const c=CARE_CONCERNS[Number(b.dataset.onboardingConcern)],list=onboarding.draft.concerns;onboarding.draft.concerns=list.includes(c)?list.filter(x=>x!==c):[...list,c];storeOnboarding();renderOnboarding();$('[data-onboarding-concern="'+b.dataset.onboardingConcern+'"]').focus({preventScroll:true});return;}
 if(b.dataset.renameConversation){renameConversation(b.dataset.renameConversation);return;}
 if(b.dataset.deleteConversation){confirmDeleteConversation(b.dataset.deleteConversation);return;}
 if(b.dataset.confirmChatDelete){deleteConversation(b.dataset.confirmChatDelete);return;}
 if(b.dataset.openConversation){openConversation(b.dataset.openConversation);return;}
 if(b.dataset.go){go(b.dataset.go);return;}
 if(b.dataset.resumeTask){resumeTask(b.dataset.resumeTask);return;}
 if(b.dataset.jumpTask){scrollToTaskId(b.dataset.jumpTask);return;}
 if(b.dataset.inlineType){selectInlineRecord(b.dataset.inlineType,b.closest('.inline-record-card')?.dataset.taskId);return;}
 if(b.dataset.inlineAction){actInlineRecord(b.dataset.inlineAction,b.closest('.inline-record-card')?.dataset.taskId);return;}
 if(b.dataset.theme){prefs.theme=b.dataset.theme;applyPrefs();return;}
 if(b.dataset.platform){prefs.platform=b.dataset.platform;applyPrefs();return;}
 if(b.dataset.owner){owner=b.dataset.owner;journalFilter='all';$$('[data-owner]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();return;}
 if(b.dataset.recordFilter){journalFilter=b.dataset.recordFilter;closeSheet();render();return;}
 if(b.dataset.type){editRecord(b.dataset.type);return;}
 if(b.dataset.recordId){recordDetail(b.dataset.recordId);return;}
 if(b.dataset.editId){const r=records.find(x=>x.id===b.dataset.editId);editRecord(r.type,r.id);return;}
 if(b.dataset.deleteId){const id=b.dataset.deleteId;openSheet('删除这条记录？',`<p class="sheet-description">删除后，今日概况和记录列表会一同更新。本地原型不提供撤销。</p><div class="row-actions"><button class="secondary" data-record-id="${safe(id)}">保留记录</button><button class="primary" data-delete-confirm="${safe(id)}">确认删除</button></div>`);return;}
 if(b.dataset.deleteConfirm){const id=b.dataset.deleteConfirm;deletedRecordIds.add(id);delete drafts[id];if(saveJob?.id===id||saveJob?.ctx.id===id){clearTimeout(saveTimer);saveJob=null;formContext=null;}records=records.filter(r=>r.id!==id);const ok=persist();closeSheet();render();toast(ok?'已删除本机记录':'已在当前会话删除；存储不可用');return;}
 if(b.dataset.care){closeSheet();launchCare(b.dataset.care);return;}
 if(b.dataset.task){startTask(b.dataset.task);scrollChatTask();return;}
 if(b.dataset.step){if(b.closest('.care-task-card')?.dataset.taskId!==task?.id){toast('请在最新的照护卡片中继续操作。');return;}stepTask(b.dataset.step);return;}
 if(b.dataset.detail){detail(b.dataset.detail);return;}
 if(b.dataset.attach){attachment=b.dataset.attach;closeSheet();renderTask();return;}
 const a=b.dataset.action;
 if(a==='onboarding-stage-later'){onboarding.draft.stage='';storeOnboarding();renderOnboarding();$('#onboarding-title').focus({preventScroll:true});return;}
 if(a==='onboarding'){startOnboarding();return;}
 if(a==='onboarding-next'){nextOnboarding();return;}
 if(a==='onboarding-back'){readOnboardingFields();onboarding.step=Math.max(0,onboarding.step-1);storeOnboarding();renderOnboarding(true);return;}
 if(a==='onboarding-later'){leaveOnboarding();return;}
 if(a==='new-chat'){newConversation();return;}
 if(a==='main-menu'){openSidebar();return;}
 if(a==='close-sidebar'){closeSidebar();return;}
 if(a==='mine-back'){go(mineReturnPage);return;}
 if(a==='profile-menu'){profileMenu();return;}
 if(a==='menu-records'){closeSheet();go('records');return;}
 if(a==='menu-mine'){mineReturnPage=page;closeSheet();go('mine');return;}
 if(a==='record-filter'){recordFilter();return;}
 if(a==='advice-expand'){adviceExpanded=!adviceExpanded;renderDailyAdvice();return;}
 if(a==='chat-history'){conversationHistory();return;}
 if(a==='clear-history-search'){historyQuery='';$('#history-search').value='';renderHistoryResults();$('#history-search').focus();return;}
 if(a==='chat-latest'){scrollChatLatest();return;}
 if(a==='resume-care'){go('assistant');scrollChatTask();}
 if(a==='record'){if(page==='assistant')launchCare('record');else recordPicker();}if(a==='back-types')recordPicker();
 if(a==='close')closeSheet();if(a==='settings')settings();
  if(a==='sound'){prefs.sound=!prefs.sound;applyPrefs();toast(prefs.sound?'声音已开启；结果页可点播文字内容':'声音已关闭');return;}
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
 if(a==='reset-confirm')openSheet('重置本版演示？','<p class="sheet-description">将清除本机新增记录、资料、阅读设置和历史对话。旧版原型不受影响，基础资料可从菜单重新录入。</p><div class="row-actions"><button class="secondary" data-action="settings">取消</button><button class="primary" data-action="reset">确认重置</button></div>');
 if(a==='reset'){resetInProgress=true;clearInlineSaveTimers();clearTimeout(saveTimer);clearTimeout(taskTimer);clearTimeout(chatTimer);clearTimeout(syncTimer);clearTimeout(speechTimer);try{localStorage.removeItem(KEY);localStorage.removeItem(CHAT_KEY);localStorage.removeItem(ONBOARDING_KEY);}catch{}location.reload();}
});
 document.addEventListener('input',e=>{if(e.target.closest('#inline-record-form')){taskTriggerRevision++;rememberInlineRecord();clearTimeout(chatSaveTimer);chatSaveTimer=setTimeout(checkpointConversation,180);}if(e.target.closest('#onboarding-form')){readOnboardingFields();$('#onboarding-error').textContent='';}if(e.target.id==='history-search'){historyQuery=e.target.value;renderHistoryResults();}if(e.target.id==='conversation-title'&&$('#rename-error'))$('#rename-error').textContent='';});
document.addEventListener('submit',e=>{if(e.target.id==='onboarding-form'){e.preventDefault();nextOnboarding();return;}if(e.target.id==='rename-conversation'){submitConversationName(e);return;}if(e.target.id==='inline-record-form'){submitInlineRecord(e);return;}if(e.target.id==='record-form')submitRecord(e);if(e.target.id==='profile-form')submitProfile(e);});
$('#chat-message').addEventListener('input',()=>{updateComposer();clearTimeout(chatSaveTimer);chatSaveTimer=setTimeout(checkpointConversation,180);});
$('#chat-message').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('#chat-form').requestSubmit();}});
$('#chat-form').addEventListener('submit',e=>{
 e.preventDefault();if(chatBusy)return;const t=$('#chat-message').value.trim();if(!t&&!attachment){toast('先写下一句话，或添加一份素材。');return;}
 const intents=detectCareIntents(t);messages.push({role:'user',text:t+(attachment?'\n['+attachment+']':'')});$('#chat-message').value='';attachment='';chatBusy=true;
 $('#chat-status').innerHTML=renderMessage({role:'assistant',text:'正在整理回复…'});renderTask();scrollChatLatest();
 const responseEpoch=conversationEpoch,triggerRevisionAtSend=taskTriggerRevision;
 chatTimer=setTimeout(()=>{
  if(responseEpoch!==conversationEpoch)return;
  let text,actions=[];
  if(scenario==='offline'){text='当前无法继续整理。消息已保留，你可以先使用记录功能，稍后再继续。';actions=intents;}
  else if(intents.length===1){const id=intents[0],newerTask=taskTriggerRevision!==triggerRevisionAtSend;text=newerTask?'You’ve opened another care tool. You can still start “'+CARE_ACTIONS[id].label+'” from the shortcuts below.':id==='record'?'I’ve opened Log care. Choose an entry type, review the details, and save when you’re ready.':id==='cry'?'Let’s listen to your baby’s cry. Record it, then review the audio before continuing.':'Let’s take a look at the diaper. Take a photo and review it before continuing.';actions=[id];}
  else if(intents.length>1){text='你提到了几件事，想先从哪一件开始？';actions=intents;}
  else{text='我看到了你的消息。你可以继续补充，也可以说「记一笔」「听哭闹」或「看便便」来打开对应功能。';}
  messages.push({role:'assistant',text,actions});chatBusy=false;$('#chat-status').innerHTML='';renderTask();
  if(intents.length===1&&scenario!=='offline'&&taskTriggerRevision===triggerRevisionAtSend)launchCare(intents[0],false);
  scrollChatLatest(false);
 },700);
});
document.addEventListener('change',e=>{if(e.target.closest('#onboarding-form')){readOnboardingFields();if(e.target.name==='babyCount'){renderOnboarding();$('#onboard-babyCount').focus({preventScroll:true});}}if(e.target.closest('#record-form')&&$('#form-error'))$('#form-error').textContent='';if(e.target.dataset.pref){prefs[e.target.dataset.pref]=e.target.checked;applyPrefs();}if(e.target.id==='scenario'){scenario=e.target.value;render();}if(e.target.id==='analysis-outcome')analysisOutcome=e.target.value;if(e.target.id==='home-mode'){homeMode=e.target.value;render();}if(e.target.id==='journal-date')render();});
$('#sheet-close').addEventListener('click',closeSheet);sheet.addEventListener('cancel',e=>{e.preventDefault();closeSheet();});
document.addEventListener('keydown',e=>{if(sidebarLayer.hidden)return;if(e.key==='Escape'){e.preventDefault();closeSidebar();return;}if(e.key!=='Tab')return;const focusable=[...sidebarPanel.querySelectorAll('button:not([disabled])')];if(!focusable.length){e.preventDefault();sidebarPanel.focus();return;}const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===sidebarPanel)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&task&&['starting','listening','camera','cameraReady','finishing','processing','speaking'].includes(task.state)){const previous=task.state;clearTimeout(taskTimer);clearTimeout(speechTimer);stopSpeech();if(['starting','listening','camera','cameraReady','finishing'].includes(previous))stopLiveCapture();task.beforePause=previous==='processing'?'processing':'ready';pausedByBackground=true;setTask('interrupted');}if(document.hidden&&(voiceActive||voiceHoldTimer))cancelVoice();});
window.addEventListener('hashchange',()=>go(location.hash.slice(2)));
const chatViewport=$('#assistant-scroll');
document.addEventListener('keydown',e=>{if(!e.target.closest('.advice-widget')||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();changeAdvice(adviceIndex+(e.key==='ArrowRight'?1:-1));});
document.addEventListener('touchstart',e=>{if(!e.target.closest('.advice-widget'))return;const touch=e.touches[0];adviceTouchStart=touch?{x:touch.clientX,y:touch.clientY}:null;},{passive:true});
document.addEventListener('touchend',e=>{const start=adviceTouchStart;adviceTouchStart=null;if(!start||!e.target.closest('.advice-widget'))return;const touch=e.changedTouches[0];if(!touch)return;const dx=touch.clientX-start.x,dy=touch.clientY-start.y;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.25)changeAdvice(adviceIndex+(dx<0?1:-1));},{passive:true});
document.addEventListener('touchcancel',()=>{adviceTouchStart=null;},{passive:true});
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
$('#journal-date').value=records.length?[...records].sort(byTime)[0].time.slice(0,10):currentLocalTime().slice(0,10);
 hydrateIcons();applyPrefs();const requestedRoute=location.hash.slice(2);if(firstVisit){onboarding={status:'draft',step:0,draft:onboardingFromProfile()};storeOnboarding();go('onboarding');renderOnboarding(true);}else if(onboarding.status==='draft'){onboarding.draft??=onboardingFromProfile();storeOnboarding();go('onboarding');}else if(requestedRoute==='onboarding')startOnboarding();else go(requestedRoute||'home');
if(page==='assistant'&&(messages.length||task))scrollChatLatest();
