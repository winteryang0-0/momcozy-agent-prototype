function taskById(id){
 return task&&String(task.id)===String(id)?task:taskHistory.find(item=>String(item.id)===String(id));
}
const taskNames={ready:'准备开始',starting:'正在打开麦克风',camera:'正在打开相机',cameraReady:'相机已打开',listening:'正在收音',finishing:'正在整理录音',captured:'确认这份素材',captureError:'暂时无法采集',processing:'正在整理线索',indeterminate:'这次还无法判断',result:'观察结果已整理',timeout:'这次等待有点久',offline:'暂时无法提交',cancelled:'已取消',interrupted:'已暂停',speaking:'正在播报',picker:'选择记录类型',editing:'填写记录',saving:'正在保存',success:'记录已保存'};
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
function assistantAvatar(){return '<span class="message-avatar"><canvas width="640" height="420" data-companion="ready" data-static="true" role="img" aria-label="momcozy ai 形象"></canvas></span>';}
function renderMessage(m){
 if(m.role==='user')return '<div class="bubble user"><small>你</small>'+safe(m.text)+'</div>';
 return '<div class="assistant-message">'+assistantAvatar()+'<div class="bubble"><small>momcozy ai</small><div>'+safe(m.text)+'</div></div></div>';
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
  detail=hasMedia?cry?'<div class="task-detail media-preview">'+icon('waveform')+'<span>'+safe(t.mediaMeta?.duration||'00:00')+' 录音</span><audio controls preload="metadata" src="'+capturedMedia.url+'" aria-label="播放刚才的录音"></audio></div>':'<div class="task-detail media-preview"><img src="'+capturedMedia.url+'" alt="刚才拍摄的照片"><span>'+safe(t.mediaMeta?.name||'照片已拍摄')+'</span></div>':'<div class="task-detail media-preview">'+icon(cry?'waveform':'image')+'<span>当前没有可用素材</span></div>';
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
function renderTask(){rememberInlineRecord();const keep=page==='assistant'&&!chatPinned,top=$('#assistant-scroll').scrollTop;migrateTaskTimeline();renderResumeOnly();const active=!!task||messages.length>0;$('#assistant').dataset.chat=active?'active':'welcome';$('#assistant-intro').hidden=active;$('#conversation-home-head').hidden=!active;$('#task-slot').innerHTML='';$('#conversation').innerHTML=messages.map(m=>{if(m.role!=='task')return renderMessage(m);const t=task&&String(task.id)===String(m.taskId)?task:taskHistory.find(t=>String(t.id)===String(m.taskId));return t?'<div class="assistant-message task-message">'+assistantAvatar()+'<div class="task-message-body"><small class="task-author">momcozy ai</small>'+renderCareCard(t,t===task)+'</div></div>':'';}).join('');$('#attachments').innerHTML=attachment?'<div class="attachment">'+icon('file')+'<span>'+safe(attachment)+'</span><button type="button" data-action="remove-attachment" aria-label="移除附件">'+icon('close')+'</button></div>':'';updateComposer();checkpointConversation();hydrate();if(task?.state==='cameraReady')mountCameraPreview();if(keep)$('#assistant-scroll').scrollTop=top;else if(page==='assistant'&&!chatGesture&&active)scrollChatLatest(false);updateLatestButton();}
function setTask(s){task.state=s;renderTask();renderResumeOnly();}
function renderResumeOnly(){/* The conversation is the home surface; active tasks remain visible in its timeline. */}
let activeSpeech=null;
function stopSpeech(){if('speechSynthesis'in window)try{window.speechSynthesis.cancel();}catch{}activeSpeech=null;}
function speakTaskResult(){
 if(!prefs.sound)return;
 if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window)){toast('当前浏览器不支持语音播报，文字内容仍可查看。');setTask('result');return;}
 stopSpeech();
 const speechTaskId=task?.id;
 try{
  const utterance=new SpeechSynthesisUtterance('素材已收到。还需要结合持续时间、照护情境和你的实际观察。');
  utterance.lang='zh-CN';utterance.rate=1;
  utterance.onend=()=>{if(activeSpeech===utterance&&task?.id===speechTaskId){activeSpeech=null;if(task.state==='speaking')setTask('result');}};
  utterance.onerror=()=>{if(activeSpeech===utterance&&task?.id===speechTaskId){activeSpeech=null;if(task.state==='speaking')setTask('result');toast('语音播报未完成，请阅读文字内容。');}};
  activeSpeech=utterance;window.speechSynthesis.speak(utterance);
 }catch{activeSpeech=null;setTask('result');toast('语音播报无法启动，请阅读文字内容。');}
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
function takePhoto(){if(!task||task.kind!=='poop'||task.state!=='cameraReady'||!mediaSession)return;const video=$('#care-camera-preview');if(!video?.videoWidth){toast('相机画面尚未准备好，请稍等。');return;}const id=task.id,operation=mediaOperation,canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);canvas.toBlob(blob=>{if(task?.id!==id||operation!==mediaOperation)return;if(!blob){task.captureNotice='照片没有拍摄成功，请重试。';stopLiveCapture();setTask('captureError');return;}stopLiveCapture();clearCapturedMedia();capturedMedia={taskId:id,kind:'poop',blob,url:URL.createObjectURL(blob)};task.mediaMeta={kind:'image',name:'照片已拍摄'};setTask('captured');},'image/jpeg',.88);}
function receivePhoto(file){const id=$('#care-photo-picker').dataset.taskId,operation=Number($('#care-photo-picker').dataset.operation);if(operation!==mediaOperation||task?.id!==id||task.kind!=='poop')return;if(!file){if(task.state==='camera')setTask('ready');return;}if(!file.type.startsWith('image/')){task.captureNotice='请选择照片文件。';setTask('captureError');return;}stopLiveCapture();clearCapturedMedia();capturedMedia={taskId:id,kind:'poop',blob:file,url:URL.createObjectURL(file)};task.mediaMeta={kind:'image',name:file.name||'照片已拍摄'};setTask('captured');}
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
