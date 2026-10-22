let voiceActive=false,voiceHoldTimer=null,voicePointerId=null,voiceKey=null;
function voice(){if(task&&['starting','listening','camera','cameraReady','finishing'].includes(task.state)){stopLiveCapture();clearCapturedMedia();task.beforePause='ready';task.state='interrupted';task.captureNotice='采集已暂停，继续时请重新采集素材。';task.mediaMeta=null;renderTask();}voiceActive=true;$('#voice-status').hidden=false;}
function stopVoice(){clearTimeout(voiceHoldTimer);voiceHoldTimer=null;voiceActive=false;voicePointerId=null;voiceKey=null;$('#voice-status').hidden=true;}
function cancelVoice(){if(!voiceActive&&!voiceHoldTimer)return;$('#voice-status').hidden=true;stopVoice();toast('语音输入演示已取消，草稿未更改');}
function finishVoice(){if(!voiceActive)return;const field=$('#chat-message');field.value=field.value.trim()?field.value.trim()+'\n我想回顾一下今天的喂养记录。':'我想回顾一下今天的喂养记录。';$('#voice-status').hidden=true;stopVoice();updateComposer();checkpointConversation();field.focus({preventScroll:true});toast('示例转写已放入输入框，可修改后发送');}
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
 if(b.dataset.recordOwner){recordsReturnPage=page==='baby'?'baby':page==='mine'?'mine':'assistant';owner=b.dataset.recordOwner;journalFilter='all';$$('[data-owner]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.owner===owner)));positions.records=0;go('records');requestAnimationFrame(()=>$('#records .journal-heading h2').focus({preventScroll:true}));return;}
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
 if(a==='mine-back'){const target=mineReturnPage;go(target);if(target==='records'&&mineReturnAfterRecords){mineReturnPage=mineReturnAfterRecords;mineReturnAfterRecords=null;}return;}
 if(a==='baby-back'){const target=babyReturnPage;go(target);if(target==='records'&&babyReturnAfterRecords){babyReturnPage=babyReturnAfterRecords;babyReturnAfterRecords=null;}return;}
 if(a==='records-back'){go(recordsReturnPage);return;}
 if(a==='profile-menu'){profileMenu();return;}
 if(a==='menu-records'){recordsReturnPage=page;closeSheet();go('records');return;}
 if(a==='menu-mine'){if(page==='records'&&recordsReturnPage==='mine')mineReturnAfterRecords=mineReturnPage;mineReturnPage=page;closeSheet();go('mine');return;}
 if(a==='menu-baby'){if(page==='records'&&recordsReturnPage==='baby')babyReturnAfterRecords=babyReturnPage;babyReturnPage=page;closeSheet();go('baby');return;}
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
  else if(intents.length===1){const id=intents[0],newerTask=taskTriggerRevision!==triggerRevisionAtSend;text=newerTask?'我会先保留你刚才的照护操作。需要时仍可从下方入口打开「'+CARE_ACTIONS[id].label+'」。':id==='record'?'为你打开「记一笔」。选择记录类型，核对内容后再保存。':id==='cry'?'一起听听哭声。开始收音后，先核对素材，再决定是否继续。':'一起看看便便。拍照后，先核对照片，再决定是否继续。';actions=[id];}
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
