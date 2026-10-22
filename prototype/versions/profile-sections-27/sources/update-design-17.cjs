/* One-time migration from candidate 16 to the user-authorized candidate 17. */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'design.json');
const d=JSON.parse(fs.readFileSync(file,'utf8'));
if(d.project.revision!=='conversation-home-journal-16')throw new Error('Unexpected source revision');
const source=JSON.parse(fs.readFileSync(path.join(__dirname,'refinement-17-requirements.json'),'utf8'));
const previous=d.source;
source.requirements=[...previous.requirements,...source.changes.map(x=>x.id)];
fs.writeFileSync(path.join(__dirname,'refinement-17-requirements.json'),JSON.stringify(source,null,2)+'\n');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const reqIds=source.changes.map(x=>x.id);
d.project.revision=source.revision;
d.project.release_label='莓色留白 · 智能提醒与入口调整候选；未冻结';
d.source={...previous,path:'sources/refinement-17-requirements.json',sha256:sha(fs.readFileSync(path.join(__dirname,'refinement-17-requirements.json'))),requirements:source.requirements,previous_candidate:{path:previous.path,sha256:previous.sha256,requirements:previous.requirements}};
const fw=d.framework;
fw.revision='HOME-1.1-smart-reminders-17-candidate';
const one=(group,id)=>{const x=group.find(x=>x.id===id);if(!x)throw new Error('Missing '+id);return x;};
one(fw.pages,'PAGE-home').regions=['journal-and-sound-header','welcome-companion','today-smart-reminders','three-care-actions','compact-expandable-today','conversation-timeline','single-line-composer'];
one(fw.pages,'PAGE-records').regions=['return-and-profile-header','date-and-owner-filter','selected-day-summary','filtered-timeline','secondary-analysis','persistent-new-record'];
one(fw.pages,'PAGE-mine').parent_id='PAGE-records';
one(fw.controls,'HOME-main-menu').id='HOME-journal-entry';
one(fw.controls,'HOME-journal-entry').role='左上角直接进入当日照护记录';
one(fw.controls,'HOME-advice').role='依据本机记录与资料的今日智能提醒，可左右切换并查看依据';
one(fw.controls,'CHAT-history').page_id='PAGE-records';
one(fw.controls,'CHAT-history').role='由记录页右上个人菜单进入历史对话';
one(fw.controls,'CHAT-new').page_id='PAGE-records';
one(fw.controls,'CHAT-new').role='由记录页右上个人菜单或历史面板开始新对话';
fw.controls.push(
 {id:'RECORDS-profile-menu',page_id:'PAGE-records',component_id:'CMP-action',role:'右上角打开我的与二级功能分类'},
 {id:'HOME-sound',page_id:'PAGE-home',component_id:'CMP-action',role:'切换浏览器语音播报并保存声音偏好'},
 {id:'HOME-today-compact',page_id:'PAGE-home',component_id:'CMP-advice',role:'会话中收起与恢复完整 Today 智能提醒'}
);
one(fw.states,'STATE-home-menu').id='STATE-records-menu';
one(fw.states,'STATE-records-menu').page_id='PAGE-records';
fw.states.push(
 {id:'STATE-home-advice-expanded',page_id:'PAGE-home',kind:'other'},
 {id:'STATE-home-sound-on',page_id:'PAGE-home',kind:'other'},
 {id:'STATE-home-sound-off',page_id:'PAGE-home',kind:'other'}
);
for(const action of fw.actions)for(const k of ['from_state','to_state'])if(action[k]==='STATE-home-menu')action[k]='STATE-records-menu';
const a=fw.actions;
one(a,'ACT-menu-open-records').control_id='HOME-journal-entry';
one(a,'ACT-menu-open-records').from_state='STATE-home-normal';
one(a,'ACT-menu-open-records').requirement_ids=['R17-01'];
one(a,'ACT-profile-menu-open').control_id='RECORDS-profile-menu';
one(a,'ACT-profile-menu-open').from_state='STATE-records-normal';
one(a,'ACT-profile-menu-open').target_page_id='PAGE-records';
one(a,'ACT-profile-menu-open').requirement_ids=['R17-01'];
one(a,'ACT-profile-menu-mine').control_id='RECORDS-profile-menu';
one(a,'ACT-profile-menu-mine').requirement_ids=['R17-01'];
one(a,'ACT-history-open').requirement_ids=['R14-H04','R17-01'];
one(a,'ACT-new-chat').requirement_ids=['R14-H04','R17-01'];
one(a,'ACT-home-advice-review').requirement_ids=['R15-02','R17-03'];
a.push(
 {id:'ACT-sound-enable',control_id:'HOME-sound',event:'click',target_page_id:'PAGE-home',from_state:'STATE-home-sound-off',to_state:'STATE-home-sound-on',requirement_ids:['R17-02']},
 {id:'ACT-sound-disable',control_id:'HOME-sound',event:'click',target_page_id:'PAGE-home',from_state:'STATE-home-sound-on',to_state:'STATE-home-sound-off',requirement_ids:['R17-02']},
 {id:'ACT-advice-next',control_id:'HOME-advice',event:'click_or_swipe',target_page_id:'PAGE-home',from_state:'STATE-home-normal',to_state:'STATE-home-normal',requirement_ids:['R17-03']},
 {id:'ACT-advice-expand',control_id:'HOME-today-compact',event:'click',target_page_id:'PAGE-home',from_state:'STATE-assistant-chat',to_state:'STATE-home-advice-expanded',requirement_ids:['R17-04']},
 {id:'ACT-advice-collapse',control_id:'HOME-today-compact',event:'click',target_page_id:'PAGE-home',from_state:'STATE-home-advice-expanded',to_state:'STATE-assistant-chat',requirement_ids:['R17-04']}
);
const f=fw.flows;
one(f,'FLOW-history').description='记录页右上个人菜单进入历史并恢复对话';
one(f,'FLOW-records-profile-menu').description='记录页右上角打开我的与二级功能分类';
one(f,'FLOW-records-profile-mine').description='记录页右上角进入我的';
one(f,'FLOW-home-menu-records').description='首页左上直接进入记录并返回';
one(f,'FLOW-home-menu-records').action_ids=['ACT-menu-open-records','ACT-records-return-home'];
one(f,'FLOW-ai-header-layout').description='居中 Momcozy AI 标题、左上当日记录和右上声音开关';
one(f,'FLOW-home-layout').description='对话式首页、Today 智能提醒及收起态';
f.push(
 {id:'FLOW-sound-toggle',description:'开启与关闭声音偏好及浏览器语音',requirement_ids:['R17-02'],action_ids:['ACT-sound-enable','ACT-sound-disable']},
 {id:'FLOW-advice-switch',description:'在 Today 卡片中切换提醒并查看依据',requirement_ids:['R17-03'],action_ids:['ACT-advice-next']},
 {id:'FLOW-advice-restore',description:'会话中从收起态恢复完整 Today 卡并再次收起',requirement_ids:['R17-04'],action_ids:['ACT-advice-expand','ACT-advice-collapse']}
);
d.system.revision='CS-0.5-berry-poise-smart-reminders-17-candidate';
const adviceComp=one(d.system.components,'CMP-advice');adviceComp.states.push('compact','expanded','selected');
for(const row of d.mapping)for(const k of ['state_ids'])row[k]=row[k].map(x=>x==='STATE-home-menu'?'STATE-records-menu':x);
const map=id=>{const x=d.mapping.find(x=>x.requirement_id===id);if(!x)throw new Error('Missing mapping '+id);return x;};
map('R15-07').page_ids=['PAGE-records','PAGE-mine'];
map('R15-07').superseded_by='R17-01';
map('R16-01').state_ids=map('R16-01').state_ids.filter(x=>x!=='STATE-records-menu');
d.mapping.push(
 {requirement_id:'R17-01',page_ids:['PAGE-home','PAGE-records','PAGE-mine'],flow_ids:['FLOW-home-menu-records','FLOW-records-profile-menu','FLOW-records-profile-mine'],state_ids:['STATE-home-normal','STATE-records-normal','STATE-records-menu'],test_ids:['T17-navigation']},
 {requirement_id:'R17-02',page_ids:['PAGE-home'],flow_ids:['FLOW-sound-toggle'],state_ids:['STATE-home-sound-off','STATE-home-sound-on'],test_ids:['T17-sound']},
 {requirement_id:'R17-03',page_ids:['PAGE-home'],flow_ids:['FLOW-advice-switch'],state_ids:['STATE-home-normal'],test_ids:['T17-advice-switch']},
 {requirement_id:'R17-04',page_ids:['PAGE-home'],flow_ids:['FLOW-advice-restore'],state_ids:['STATE-assistant-chat','STATE-home-advice-expanded'],test_ids:['T17-advice-restore']}
);
for(const test of d.tests)test.state_ids=test.state_ids.map(x=>x==='STATE-home-menu'?'STATE-records-menu':x);
one(d.tests,'T15-profile-menu').steps=['从首页左上进入记录，点记录页右上个人入口，查看分类及原二级功能。'];
one(d.tests,'T15-profile-menu').expected='个人、资料、设备与同步、对话管理及偏好分类可达；记录分析与新建仍可用。';
one(d.tests,'T15-profile-mine').state_ids=['STATE-records-normal','STATE-records-menu','STATE-mine-normal'];
one(d.tests,'T15-profile-mine').steps=['由记录页右上个人入口进入我的，再返回记录。'];
one(d.tests,'T15-profile-mine').expected='进入既有我的页面，返回后记录内容与新建入口仍可使用。';
one(d.tests,'T16-home-navigation').state_ids=['STATE-home-normal','STATE-records-normal'];
one(d.tests,'T16-home-navigation').steps=['点击首页左上按钮直接进入记录；返回首页；检查无底部 Dock，旧 #/assistant 深链回到 #/home。'];
one(d.tests,'T16-home-navigation').expected='直接进入记录并返回，旧对话数据保留。';
one(d.tests,'T15-ai-header').expected='Momcozy AI 居中，左侧当日记录，右侧可切换的声音按钮。';
one(d.tests,'T15-home-layout').expected='旧概况和最近记录已退出；今日智能提醒可切换，会话收起态可恢复完整卡。';
d.tests.push(
 {id:'T17-navigation',flow_id:'FLOW-home-menu-records',state_ids:['STATE-home-normal','STATE-records-normal','STATE-records-menu','STATE-mine-normal','STATE-chat-history'],steps:['首页左上进入当日记录；右上打开分类，进入我的、历史、设备及新对话；返回记录；切换日期并新建。'],expected:'分类按个人、设备、对话及偏好组织；各旧功能可达，记录日期与新建不丢失。'},
 {id:'T17-sound',flow_id:'FLOW-sound-toggle',state_ids:['STATE-home-sound-off','STATE-home-sound-on'],steps:['点击右上声音键开启；刷新核对状态；在结果页主动点播；关闭声音。'],expected:'按钮与本机偏好状态一致；支持时使用浏览器语音，关闭时停止；不支持时保留文字反馈。'},
 {id:'T17-advice-switch',flow_id:'FLOW-advice-switch',state_ids:['STATE-home-normal'],steps:['在 Today 智能提醒卡用箭头、点位、触屏左右滑和键盘方向键切换。'],expected:'至少三种提醒可切换、来源可查看、边界无越界，空/离线/失败状态不误述本机记录。'},
 {id:'T17-advice-restore',flow_id:'FLOW-advice-restore',state_ids:['STATE-assistant-chat','STATE-home-advice-expanded'],steps:['发送消息使 Today 收起；点击摘要展开；切换提醒；再次点击摘要收起。'],expected:'展开后恢复完整卡并保留选中的提醒索引；收起和输入区保持可用。'}
);
d.pending_decisions.push({id:'PD-refinement-17-freeze',question:'本轮入口、声音与智能提醒为可交互候选；待用户查看后决定是否冻结。',blocks_design:false,status:'open'});
d.implementation.scope='R17：首页左上直达当日记录，记录页右上个人与二级分类；声音开关可交互；Today 智能提醒横向切换且会话收起态可恢复。';
d.implementation.evidence_directory='delivery-review/smart-reminders-entry-sound-17';
d.implementation.previous_snapshot='../versions/conversation-home-journal-16';
d.implementation.change_scope='delivery-review/smart-reminders-entry-sound-17/DELIVERY.md';
d.limitations=d.limitations.map(x=>x.includes('本轮实际结果')?'测试条目是可执行验收描述；R17 实际结果以 delivery-review/smart-reminders-entry-sound-17/DELIVERY.md 为准。':x);
fs.writeFileSync(file,JSON.stringify(d,null,2)+'\n');
console.log('Updated design candidate 17 with '+reqIds.join(', '));
