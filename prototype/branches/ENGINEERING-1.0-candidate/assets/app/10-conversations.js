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
 stopSpeech();
 stopLiveCapture();clearCapturedMedia();
 conversationEpoch++;cancelChatFollow();clearTimeout(chatTimer);clearInlineSaveTimers(true);clearTimeout(taskTimer);clearTimeout(speechTimer);clearTimeout(chatSaveTimer);stopVoice();
 if(chatBusy)messages.push({role:'assistant',text:'本次回复已暂停。你可以继续发送消息。'});
 chatBusy=false;$('#chat-status').innerHTML='';
 if(task&&task.kind!=='record'&&['starting','listening','camera','cameraReady','finishing','processing','speaking'].includes(task.state)){
  task.beforePause='ready';task.state='interrupted';task.captureNotice='采集已暂停，继续时请重新采集素材。';task.mediaMeta=null;
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
    item.state='ready';item.captureNotice='素材需要重新采集。';item.mediaMeta=null;
   }else if(item.state==='speaking'){
    item.beforePause='result';item.state='interrupted';
   }
  }else if(!taskTerminal(item)){
   item.beforePause='ready';item.state='interrupted';item.captureNotice='采集已暂停，继续时请重新采集素材。';item.mediaMeta=null;
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
 $('#history-results').innerHTML=list.length?'<div class="chat-history-list">'+list.map(c=>{const p=c.payload,last=p.messages.at(-1),preview=last?.text||p.draft||(p.task?'照护卡片 · '+(taskNames[p.task.state]||'已暂停'):'素材草稿');const date=new Date(c.updatedAt).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});return '<article class="chat-history-row"><button class="chat-history-item" data-open-conversation="'+safe(c.id)+'" aria-current="'+String(c.id===activeConversationId)+'">'+icon('journal')+'<span class="chat-history-copy"><b>'+safe(c.title)+'</b><small>'+safe(date)+' · '+p.messages.length+' 条消息'+(c.id===activeConversationId?' · 当前对话':'')+'</small><small class="chat-history-preview">'+safe(preview)+'</small></span>'+icon('chevron-right')+'</button><div class="history-row-actions"><button data-rename-conversation="'+safe(c.id)+'" aria-label="重命名：'+safe(c.title)+'">'+icon('edit')+'重命名</button><button class="danger" data-delete-conversation="'+safe(c.id)+'" aria-label="删除：'+safe(c.title)+'">'+icon('trash')+'删除</button></div></article>';}).join('')+'</div>':'<div class="empty">'+icon('journal')+'<h3>'+(historyQuery.trim()?'没有匹配的对话':'还没有历史对话')+'</h3><p>'+(historyQuery.trim()?'试试其他关键词，或清除搜索。':'开始交流后，对话会自动保存在这里。')+'</p>'+(historyQuery.trim()?'<button class="text-button" data-action="clear-history-search">清除搜索</button>':'')+'</div>';
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


