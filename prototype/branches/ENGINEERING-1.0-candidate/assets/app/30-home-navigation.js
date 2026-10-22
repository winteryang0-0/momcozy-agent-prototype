function persist(){try{localStorage.setItem(KEY,JSON.stringify({records,profiles,prefs,deletedRecordIds:[...deletedRecordIds]}));return true;}catch{return false;}}
function toast(t){clearTimeout(toastTimer);$('#toast').textContent=t;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3800);}
function hydrate(){hydrateIcons();Companion.refresh();}
function value(r){return r.type==='亲喂'?`${r.side} · ${r.duration} 分钟`:r.type==='换尿布'?`${r.kind} · 红屁屁：${r.rash}`:`${r.amount} ml`;}
function byTime(a,b){return b.time.localeCompare(a.time);}
function row(r){return `<button class="record-row" data-category="${recordCategory(r.type)}" data-record-id="${safe(r.id)}"><span class="icon-tile">${icon(TYPES[r.type])}</span><span class="row-copy"><b>${safe(r.type)}</b><small>${safe(value(r))}</small></span><span class="row-end">${safe(r.time.slice(11))}<small>${safe(r.sync==='待同步'?'待同步':r.owner)}</small></span></button>`;}
function journalRow(r){const who=r.owner==='宝宝'?(profiles.baby||'宝宝'):'妈妈',sync=r.sync==='待同步'?' · 待同步':r.sync==='示例'?' · 示例':'';return `<button class="journal-row" data-category="${recordCategory(r.type)}" data-record-id="${safe(r.id)}"><time datetime="${safe(r.time)}">${safe(r.time.slice(11))}</time><span class="icon-tile">${icon(TYPES[r.type])}</span><span class="journal-row-copy"><b>${safe(r.type)}</b><small>${safe(who)} · ${safe(value(r))}${sync}</small></span><span class="journal-row-chevron">${icon('chevron-right')}</span></button>`;}
function selectJournalRecord(r){$('#journal-date').value=r.time.slice(0,10);owner=r.owner;journalFilter='all';$$('[data-owner]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.owner===owner)));}
function note(text,tone='',name='info'){return `<div class="status-note ${tone}" role="status">${icon(name)}<span>${text}</span></div>`;}
function canvas(state,staticFrame=false,loop=false){return `<canvas width="640" height="420" data-companion="${state}" ${staticFrame?'data-static="true"':''} ${loop?'data-loop="true"':''} role="img" aria-label="Momcozy AI状态"></canvas>`;}
 function dailyAdvice(){
  const today=homeMode==='empty'||homeMode==='error'?[]:records.filter(r=>r.time.startsWith(currentLocalTime().slice(0,10)));
 const lastFeed=[...today].filter(r=>r.owner==='宝宝'&&r.type!=='换尿布').sort(byTime)[0];
 if(homeMode==='error')return {tone:'neutral',icon:'journal',title:'概况暂时不可用',reason:'今日记录没有加载出来，稍后可以重试。已有记录不会因此删除。',basis:'依据概况加载状态'};
 if(scenario==='offline')return {tone:'neutral',icon:'offline',title:'先照顾眼前，再处理同步',reason:'当前为离线演示。本机已保存的记录可以继续回看。',basis:'依据当前离线演示状态'};
 if(lastFeed)return {tone:'feed',icon:'baby',title:'回顾最近一次喂养',reason:`今天已记录喂养，最近一笔在 ${lastFeed.time.slice(11)}。需要时可到记录页核对。`,basis:'依据今天的喂养记录'};
 if(homeMode==='empty')return {tone:'neutral',icon:'journal',title:'从一件已发生的照护开始',reason:'当前预览没有记录。想起哪件事，就补一笔。',basis:'依据当前预览的记录状态'};
 const concerns=Array.isArray(profiles.concerns)?profiles.concerns:[];
 if(concerns.includes('宝宝为什么哭'))return {tone:'crying',icon:'waveform',title:'留意宝宝哭闹时的线索',reason:'你在资料中关注过哭闹。可以在 Momcozy AI 中描述刚才观察到的情况。',basis:'依据你填写的关注点'};
 if(concerns.some(c=>['我的身体恢复','情绪起伏与压力','睡不够疲惫'].includes(c)))return {tone:'neutral',icon:'heart',title:'给自己留一点关注',reason:'你在资料中关注过身体或情绪状态。需要时可以和 Momcozy AI 聊聊。',basis:'依据你填写的关注点'};
 return {tone:'neutral',icon:'journal',title:'从一件已发生的照护开始',reason:'今天还没有记录。想起哪件事，就补一笔。',basis:'依据今天的记录状态'};
}
function adviceCards(){
  const primary=dailyAdvice(),today=homeMode==='empty'||homeMode==='error'?[]:records.filter(r=>r.time.startsWith(currentLocalTime().slice(0,10)));
 const diapers=today.filter(r=>r.owner==='宝宝'&&r.type==='换尿布').sort(byTime),last=diapers[0];
 const diaper=homeMode==='error'?{tone:'neutral',icon:'diaper',title:'尿布记录暂不可用',reason:'记录摘要未加载，稍后再查看。',basis:'依据当前预览状态'}:scenario==='offline'?{tone:'diaper',icon:'diaper',title:'先回看本机尿布记录',reason:'当前为离线演示，已保存在本机的记录仍可回看。',basis:'依据当前离线演示状态'}:last?{tone:'diaper',icon:'diaper',title:'回看最近一次换尿布',reason:`今天有 ${diapers.length} 条尿布记录，最近一笔在 ${last.time.slice(11)}。`,basis:'依据今天的尿布记录'}:{tone:'diaper',icon:'diaper',title:'留意今天的尿布变化',reason:'今天还没有尿布记录，需要时可以补记。',basis:'依据今天的记录状态'};
 const concerns=Array.isArray(profiles.concerns)?profiles.concerns:[],self=concerns.some(c=>['我的身体恢复','情绪起伏与压力','睡不够疲惫'].includes(c))?{tone:'neutral',icon:'heart',title:'给自己留一点关注',reason:'你曾在资料中关注身体或情绪状态，想说时可以继续聊聊。',basis:'依据你填写的关注点'}:{tone:'neutral',icon:'heart',title:'也给妈妈留一份照护',reason:'如果今天想记录或聊聊自己的感受，可以从这里开始。',basis:'依据当前本地资料'};
 return [primary,diaper,self];
}
function adviceControls(cards){
  return `<div class="advice-controls"><div class="advice-dots" role="group" aria-label="切换今日提醒">${cards.map((card,i)=>`<button type="button" class="advice-dot" data-advice-index="${i}" aria-label="第 ${i+1} 条：${safe(card.title)}" aria-current="${i===adviceIndex?'true':'false'}"></button>`).join('')}</div></div>`;
}
function adviceWidget(cards,floating=false){
 const d=cards[adviceIndex],total=cards.length,cardLabel=`第 ${adviceIndex+1} 项，共 ${total} 项：${safe(d.title)}`;
  if(floating)return `<div class="advice-widget advice-widget-floating" tabindex="0" aria-label="今日智能提醒，左右滑动或方向键可循环切换"><div class="advice-card" data-category="${d.tone}" role="group" aria-roledescription="轮播卡片" aria-label="${cardLabel}"><div class="advice-card-heading"><span class="advice-icon">${icon(d.icon)}</span><strong>${safe(d.title)}</strong></div><p class="advice-reason">${safe(d.reason)}</p>${adviceControls(cards)}</div></div>`;
  return `<div class="advice-widget" tabindex="0" aria-label="今日智能提醒，左右滑动或方向键可循环切换"><div class="advice-card" data-category="${d.tone}" role="group" aria-roledescription="轮播卡片" aria-label="${cardLabel}"><div class="advice-card-main"><span class="advice-icon">${icon(d.icon)}</span><span class="advice-copy"><small>智能提示</small><strong>${safe(d.title)}</strong><span>${safe(d.reason)}</span></span></div>${adviceControls(cards)}</div></div>`;
}
function renderDailyAdvice(){const cards=adviceCards();adviceIndex=Math.min(adviceIndex,cards.length-1);$('#daily-advice').innerHTML=adviceWidget(cards);$('#expanded-advice').innerHTML=adviceWidget(cards,true);$('#compact-advice').textContent=cards[adviceIndex].title;$('#conversation-home-head').dataset.expanded=String(adviceExpanded);$('#expanded-advice').hidden=!adviceExpanded;$('.compact-advice').setAttribute('aria-expanded',String(adviceExpanded));$('.compact-advice').setAttribute('aria-label',adviceExpanded?'收起今日智能提醒':'展开今日智能提醒');}
function changeAdvice(index){const cards=adviceCards(),next=((index%cards.length)+cards.length)%cards.length;if(next===adviceIndex)return;const focusedHostId=document.activeElement?.closest?.('.daily-advice')?.id,focusedDot=!!document.activeElement?.matches?.('.advice-dot');adviceIndex=next;renderDailyAdvice();$('#advice-announcement').textContent=`第 ${next+1} 条提醒：${cards[next].title}`;const focusedHost=focusedHostId&&document.getElementById(focusedHostId);if(focusedHost&&!focusedHost.closest('[hidden]'))(focusedDot?focusedHost.querySelector(`.advice-dot[data-advice-index="${next}"]`):focusedHost.querySelector('.advice-widget'))?.focus({preventScroll:true});}
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
function go(next){if(!sidebarLayer.hidden)closeSidebar({immediate:true,restoreFocus:false});next=['home','assistant'].includes(next)?'assistant':next;if(!['assistant','records','mine','baby','onboarding'].includes(next))next='assistant';if(onboarding.status==='draft'&&next!=='onboarding')next='onboarding';if(page==='assistant'&&next!=='assistant'){if(voiceActive||voiceHoldTimer)cancelVoice();stopSpeech();if(task&&['starting','listening','camera','cameraReady','finishing'].includes(task.state)){stopLiveCapture();task.captureNotice='采集已暂停，请重新开始。';task.state='ready';}}positions[page]=$('#scroll').scrollTop;page=next;$('#app').dataset.page=page;$('#scroll').dataset.page=page;$$('.page').forEach(p=>p.hidden=p.id!==page);$('#record-cta').hidden=page!=='records';$('#scroll').scrollTop=positions[page]||0;const route=page==='assistant'?'home':page;if(location.hash!=='#/'+route)history.replaceState(null,'','#/'+route);if(page==='onboarding'){renderOnboarding();return;}render();if(page==='assistant'&&latestChatPending)scrollChatLatest();}
function render(){
 renderDailyAdvice();
  const selected=$('#journal-date').value||currentLocalTime().slice(0,10),items=records.filter(r=>r.owner===owner&&r.time.startsWith(selected)).sort(byTime),feeds=items.filter(r=>r.type!=='换尿布'),latest=items[0],latestFeed=feeds[0],date=new Date(selected+'T12:00:00+08:00');
 const dateLabel=new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long',timeZone:'Asia/Shanghai'}).format(date);
 $('#journal-context').textContent=dateLabel+' · '+(owner==='宝宝'?(profiles.baby||'宝宝'):'妈妈');$('#journal-baby-label').textContent=profiles.baby||'宝宝';$('#timeline-title').textContent=dateLabel+'的时间线';
 const count=owner==='宝宝'?feeds.length:items.length,unit=owner==='宝宝'?'次喂养':'次吸奶',detail=owner==='宝宝'?(latestFeed?`最近 ${latestFeed.time.slice(11)} · ${value(latestFeed)}`:'还没有喂养记录'):(latest?`最近 ${latest.time.slice(11)} · 今日已记录 ${items.reduce((n,r)=>n+Number(r.amount||0),0)} ml`:'还没有吸奶记录');
 $('#record-summary').dataset.category=owner==='宝宝'?'feed':'neutral';$('#record-summary').innerHTML=`<small>${safe(dateLabel)} · ${owner==='宝宝'?'宝宝记录':'妈妈记录'}</small><div class="journal-summary-value"><b>${count}</b><span>${unit}</span></div><p>${safe(detail)}</p>`;
 const visible=items.filter(r=>journalFilter==='all'||(journalFilter==='feed'?r.type!=='换尿布':journalFilter==='diaper'?r.type==='换尿布':r.type==='吸奶'));
 $('#record-list').innerHTML=visible.map(journalRow).join('')||`<div class="empty">${icon('journal')}<h3>${journalFilter==='all'?'这一天，还没有记录':'当前筛选下没有记录'}</h3><p>${journalFilter==='all'?'可以补记已经发生的照护。':'试试切换筛选，或新建一条记录。'}</p></div>`;
 $('#record-links').innerHTML=(owner==='宝宝'?[['喂养与睡眠','clock'],['生长发育','growth']]:[['奶量趋势','trend'],['身体与状态','heart']]).map(([t,i])=>`<button data-detail="${t}">${icon(i)}${t}</button>`).join('');
 $('#sync-caption').textContent=records.some(r=>r.sync==='待同步')?`${records.filter(r=>r.sync==='待同步').length} 条记录待同步`:'查看应用记录同步状态';
 const days=profiles.birth?Math.max(0,Math.floor((Date.parse(profileToday()+'T12:00:00')-Date.parse(profiles.birth+'T12:00:00'))/86400000)):null;
 $('#profile-summary').textContent=days===null?'按你的节奏补充照护背景':'一起度过的第 '+days+' 天';$('.profile-card h3').textContent=(profiles.careRole||'家人')+'与'+profiles.baby;$('#assistant-context').textContent='为妈妈和'+profiles.baby+'，留一份从容';
 $('#baby-profile-name').textContent=profiles.baby||'宝宝';$('#baby-profile-summary').textContent=profiles.birth?(days===null?'已填写出生日期':'一起度过的第 '+days+' 天'):'可补充出生日期与出生孕周';
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
