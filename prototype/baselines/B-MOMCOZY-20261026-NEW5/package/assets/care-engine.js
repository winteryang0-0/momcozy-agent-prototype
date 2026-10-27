/* Project-designed rules. No clinical thresholds and no backend. */
const CareEngine=(()=>{
 const absent=v=>v===undefined||v===null||v==='';
 const fieldFor=t=>t==='换尿布'?'kind':t==='体重'?'weight':t==='亲喂'||t==='睡眠'?'duration':'amount';
 const numeric=v=>!absent(v)&&Number.isFinite(Number(v))&&Number(v)>=0;const builtins=['瓶喂母乳','配方奶','亲喂','换尿布','体重','睡眠','吸奶','喝水'];
 function complete(r){if(r.needsFeedingType)return false;if(builtins.includes(r.type)){const v=r[fieldFor(r.type)];return r.type==='换尿布'?!absent(v):numeric(v)&&(r.type!=='体重'||Number(v)>0);}return Array.isArray(r.fields)?r.fields.every(f=>f.required===false||!absent(f.value)):!absent(r.note)}
 function summary(records,babyId,date){const rows=records.filter(r=>r.babyId===babyId&&r.owner!=='妈妈'&&String(r.time||r.occurredAt||'').startsWith(date));const feeds=rows.filter(r=>['瓶喂母乳','配方奶','亲喂'].includes(r.type));const bottles=feeds.filter(r=>r.type!=='亲喂'&&numeric(r.amount));const sleeps=rows.filter(r=>r.type==='睡眠'&&numeric(r.duration));return {rows,complete:rows.filter(complete).length,partial:rows.filter(r=>!complete(r)).length,feedCount:feeds.length,milk:bottles.length?bottles.reduce((n,r)=>n+Number(r.amount),0):null,sleep:sleeps.length?sleeps.reduce((n,r)=>n+Number(r.duration),0):null,diapers:rows.filter(r=>r.type==='换尿布').length,sourceIds:rows.map(r=>r.id)}}
 function tasks(db,profile,draft,now=Date.now()){
  const list=[];const states=db.taskStates||{};const born=profile.kind==='born'||profile.kind==='unknown';
  if(draft)list.push({id:'draft:'+draft.id,kind:'draft',title:'这条记录还没保存',reason:'你已创建一条'+draft.type+'记录。',sufficiency:complete(draft)?'信息齐全，等待核对':'需要补充必填信息',priority:100,dueAt:0,expiresAt:null,sourceIds:[],action:'review',babyId:draft.babyId});
  for(const r of db.reminders||[])if(r.babyId===profile.id&&r.state==='active'&&r.dueAt<=now&&r.expiresAt>now)list.push({id:'reminder:'+r.id,kind:'reminder',title:r.title,reason:'你设定在 '+new Date(r.dueAt).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+' 提醒。',sufficiency:'用户明确设置；不依据健康推断',priority:90,dueAt:r.dueAt,expiresAt:r.expiresAt,action:r.type==='查看'?'done':'record',recordType:r.type,babyId:r.babyId,sourceIds:[]});
  if(!db.profiles.onboardingDone&&!draft)list.push({id:'setup:'+profile.id,kind:'setup',title:'先告诉我怎么称呼你们',reason:'资料尚未完成，可以先体验，也可以稍后再填。',sufficiency:'无需健康数据',priority:40,dueAt:0,expiresAt:null,action:'onboard',sourceIds:[],babyId:profile.id});
  if(born&&profile.birth&&(db.profiles.concerns||[]).some(x=>['宝宝成长','体重'].includes(x))){const age=Math.max(0,Math.floor((now-new Date(profile.birth).getTime())/2629800000));const stageId='growth:'+profile.id+':'+age;const existing=db.records.filter(r=>r.babyId===profile.id&&r.taskId===stageId&&r.type==='成长观察'&&complete(r));if(!existing.length)list.push({id:stageId,kind:'growth',title:'记下这个月的一个新变化',reason:'按已填生日约 '+age+' 个月；你选择了关注宝宝成长。',sufficiency:'仅用于记录观察，不评估发育',priority:20,dueAt:0,expiresAt:new Date(profile.birth).getTime()+(age+1)*2629800000,action:'growth',sourceIds:[],babyId:profile.id});}
  return list.filter(t=>{const s=states[t.id];return !s||!['closed','completed'].includes(s.status)&&!(s.snoozeUntil>now)}).sort((a,b)=>b.priority-a.priority||a.dueAt-b.dueAt);
 }
 return {absent,fieldFor,complete,summary,tasks};
})();
if(typeof module!=='undefined')module.exports=CareEngine;
