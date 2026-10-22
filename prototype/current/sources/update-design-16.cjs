/* One-time candidate ledger migration. No frozen baseline or receipt is written. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.join(__dirname, '..');
const designPath = path.join(root, 'design.json');
const requirementPath = path.join(__dirname, 'framework-16-requirements.json');
const d = JSON.parse(fs.readFileSync(designPath, 'utf8'));
const requirements = JSON.parse(fs.readFileSync(requirementPath, 'utf8'));
const previous = {path:d.source.path,sha256:d.source.sha256,requirements:d.source.requirements};

d.project.stage = 'draft';
d.source.path = 'sources/framework-16-requirements.json';
d.source.sha256 = crypto.createHash('sha256').update(fs.readFileSync(requirementPath)).digest('hex');
d.source.requirements = [...new Set([...previous.requirements,...requirements.changes.map(c=>c.id)])];
d.source.previous_candidate = previous;
d.source.superseded = requirements.supersedes;

const home = d.framework.pages.find(p=>p.id==='PAGE-home');
home.regions = ['menu-and-sound-header','welcome-companion','today-advice','three-care-actions','compact-conversation-header','conversation-timeline','single-line-composer'];
d.framework.pages = d.framework.pages.filter(p=>p.id!=='PAGE-assistant');
const records = d.framework.pages.find(p=>p.id==='PAGE-records');
records.parent_id='PAGE-home';
records.regions=['return-and-date','owner-filter','selected-day-summary','filtered-timeline','secondary-analysis','persistent-new-record'];
d.framework.pages.find(p=>p.id==='PAGE-mine').parent_id='PAGE-home';
d.framework.revision='HOME-1.1-conversation-journal-16-candidate';

for(const c of d.framework.controls){
  if(c.page_id==='PAGE-assistant')c.page_id='PAGE-home';
  if(c.id==='RECORDS-profile-menu'){c.id='HOME-main-menu';c.page_id='PAGE-home';c.role='左上角导航和原有二级功能菜单';}
  if(c.id==='HOME-ai')c.role='对话式首页形象、今日建议及会话入口';
  if(c.id==='CHAT-history'||c.id==='CHAT-new')c.page_id='PAGE-home';
}
for(const c of [
  {id:'RECORDS-back',page_id:'PAGE-records',component_id:'CMP-action',role:'返回对话式首页'},
  {id:'RECORDS-date',page_id:'PAGE-records',component_id:'CMP-action',role:'选择回看日期'},
  {id:'RECORDS-owner',page_id:'PAGE-records',component_id:'CMP-choice',role:'切换宝宝和妈妈记录'},
  {id:'RECORDS-summary',page_id:'PAGE-records',component_id:'CMP-record',role:'所选日期和对象的记录摘要'},
  {id:'RECORDS-filter',page_id:'PAGE-records',component_id:'CMP-choice',role:'筛选时间线中的事件类型'},
  {id:'RECORDS-secondary',page_id:'PAGE-records',component_id:'CMP-action',role:'展开原有二级分析入口'}
])d.framework.controls.push(c);

for(const s of d.framework.states){
  if(s.page_id==='PAGE-assistant')s.page_id='PAGE-home';
  if(s.id==='STATE-records-profile-menu'){s.id='STATE-home-menu';s.page_id='PAGE-home';}
}
d.framework.states.push({id:'STATE-records-filter',page_id:'PAGE-records',kind:'other'});

for(const a of d.framework.actions){
  if(a.target_page_id==='PAGE-assistant')a.target_page_id='PAGE-home';
  if(a.control_id==='RECORDS-profile-menu')a.control_id='HOME-main-menu';
  if(a.from_state==='STATE-records-profile-menu')a.from_state='STATE-home-menu';
  if(a.to_state==='STATE-records-profile-menu')a.to_state='STATE-home-menu';
  if(a.id==='ACT-profile-menu-open'){a.target_page_id='PAGE-home';a.from_state='STATE-home-normal';}
  if(a.id==='ACT-ai-header-review')a.target_page_id='PAGE-home';
}
for(const a of [
  {id:'ACT-menu-open-records',control_id:'HOME-main-menu',event:'click',target_page_id:'PAGE-records',from_state:'STATE-home-menu',to_state:'STATE-records-normal',requirement_ids:['R16-01']},
  {id:'ACT-records-return-home',control_id:'RECORDS-back',event:'click',target_page_id:'PAGE-home',from_state:'STATE-records-normal',to_state:'STATE-home-normal',requirement_ids:['R16-01']},
  {id:'ACT-records-owner-switch',control_id:'RECORDS-owner',event:'click',target_page_id:'PAGE-records',from_state:'STATE-records-normal',to_state:'STATE-records-normal',requirement_ids:['R16-02']},
  {id:'ACT-records-date-change',control_id:'RECORDS-date',event:'change',target_page_id:'PAGE-records',from_state:'STATE-records-normal',to_state:'STATE-records-normal',requirement_ids:['R16-02']},
  {id:'ACT-records-filter-open',control_id:'RECORDS-filter',event:'click',target_page_id:'PAGE-records',from_state:'STATE-records-normal',to_state:'STATE-records-filter',requirement_ids:['R16-02']},
  {id:'ACT-records-filter-apply',control_id:'RECORDS-filter',event:'click',target_page_id:'PAGE-records',from_state:'STATE-records-filter',to_state:'STATE-records-normal',requirement_ids:['R16-02']}
])d.framework.actions.push(a);

for(const f of d.framework.flows){
  if(f.id==='FLOW-home-layout')f.description='对话式首页欢迎态、今日建议及会话态；旧 Today 概况布局已由 R16 覆盖';
  if(f.id==='FLOW-ai-header-layout')f.description='居中 Momcozy AI 标题、左上菜单和右上声音说明；R16 覆盖旧右上标题位置';
  if(f.id==='FLOW-records-profile-menu')f.description='首页左上角菜单承接记录、资料和历史等入口';
  if(f.id==='FLOW-records-profile-mine')f.description='从首页左上角菜单进入我的，再返回首页';
}
for(const f of [
  {id:'FLOW-home-menu-records',description:'左上菜单进入记录并返回首页',requirement_ids:['R16-01'],action_ids:['ACT-profile-menu-open','ACT-menu-open-records','ACT-records-return-home']},
  {id:'FLOW-journal-layout',description:'日期和对象选择、摘要、时间线及类型筛选',requirement_ids:['R16-02'],action_ids:['ACT-menu-open-records','ACT-records-owner-switch','ACT-records-date-change','ACT-records-filter-open','ACT-records-filter-apply']},
  {id:'FLOW-journal-create',description:'记录页固定新建入口进入原有记录闭环',requirement_ids:['R16-03'],action_ids:['ACT-record-open','ACT-record-type','ACT-record-submit','ACT-record-success']}
])d.framework.flows.push(f);

for(const m of d.mapping){
  m.page_ids=[...new Set(m.page_ids.map(x=>x==='PAGE-assistant'?'PAGE-home':x))];
  if(m.state_ids)m.state_ids=m.state_ids.map(x=>x==='STATE-records-profile-menu'?'STATE-home-menu':x);
  if(requirements.supersedes.some(x=>x.id===m.requirement_id))m.superseded_by='R16-01';
}
for(const m of [
  {requirement_id:'R16-01',page_ids:['PAGE-home','PAGE-records','PAGE-mine'],flow_ids:['FLOW-home-menu-records','FLOW-records-profile-mine'],state_ids:['STATE-home-normal','STATE-home-menu','STATE-assistant-welcome','STATE-assistant-chat'],test_ids:['T16-home-navigation']},
  {requirement_id:'R16-02',page_ids:['PAGE-records'],flow_ids:['FLOW-journal-layout'],state_ids:['STATE-records-normal','STATE-records-filter','STATE-record-detail'],test_ids:['T16-journal-layout']},
  {requirement_id:'R16-03',page_ids:['PAGE-records','PAGE-home'],flow_ids:['FLOW-journal-create','FLOW-inline-record'],state_ids:['STATE-global-picker','STATE-global-form','STATE-global-saved'],test_ids:['T16-journal-create']}
])d.mapping.push(m);

const byId=id=>d.tests.find(t=>t.id===id);
for(const t of d.tests)if(t.state_ids)t.state_ids=t.state_ids.map(x=>x==='STATE-records-profile-menu'?'STATE-home-menu':x);
Object.assign(byId('T14-navigation'),{steps:['从首页左上角菜单进入记录和我的，返回首页；确认无底部 Dock。'],expected:'记录、我的和历史仍可达；原三栏 Dock 不显示。'});
Object.assign(byId('T14-chat-layout'),{steps:['检查首页欢迎形象、今日建议和三个功能；进入会话、上滑历史并回到最新；检查底部输入栏。'],expected:'会话时间线独立滚动，输入栏固定在页面底部且无遮挡；AI 回复保留形象和署名。'});
Object.assign(byId('T15-home-layout'),{steps:['打开新的对话式首页欢迎态及已有会话，核对今日建议入口。'],expected:'旧 Today 概况和最近记录已退出；今日建议在首页欢迎态和紧凑会话头可查看。'});
Object.assign(byId('T15-ai-header'),{steps:['在欢迎页与已有对话查看首页顶部。'],expected:'Momcozy AI 居中，左侧菜单、右侧声音说明；没有顶部新对话与历史按钮。'});
Object.assign(byId('T15-profile-menu'),{steps:['从首页左上角打开菜单，进入记录与我的；在记录页展开二级分析并使用新建记录。'],expected:'菜单保留我的、资料、设备、同步、历史、新对话和设置；记录分析与新建继续可达。'});
Object.assign(byId('T15-composer-height'),{expected:'空态外框为单行高度；内容增长时才增高，页面没有 Dock。'});
for(const t of [
  {id:'T16-home-navigation',flow_id:'FLOW-home-menu-records',state_ids:['STATE-home-normal','STATE-home-menu','STATE-records-normal'],steps:['打开首页左上菜单；进入记录；返回首页；检查无底部 Dock，旧 #/assistant 深链回到 #/home。'],expected:'菜单入口与返回闭环存在，旧对话数据保留，四个新首页状态与会话入口可达。',requirement_ids:['R16-01'],status:'acceptance-description-see-runtime-evidence'},
  {id:'T16-journal-layout',flow_id:'FLOW-journal-layout',state_ids:['STATE-records-normal','STATE-records-filter','STATE-record-detail'],steps:['按日期和对象切换，比较摘要及时间线；筛选喂养/尿布/吸奶；打开一条记录详情；展开二级分析。'],expected:'排布顺序为对象、摘要、时间线；筛选仅改变列表，记录详情和原二级功能可达；空态清晰。',requirement_ids:['R16-02'],status:'acceptance-description-see-runtime-evidence'},
  {id:'T16-journal-create',flow_id:'FLOW-journal-create',state_ids:['STATE-records-normal','STATE-global-picker','STATE-global-form','STATE-global-saved'],steps:['在记录页点击固定新建入口，选择类型并保存；回到时间线确认；在首页使用记一笔确认独立会话卡片。'],expected:'原有全局与会话内两条记一笔路径均可完成，保存记录在记录页可回看。',requirement_ids:['R16-03'],status:'acceptance-description-see-runtime-evidence'}
])d.tests.push(t);

d.system.revision='CS-0.5-berry-poise-conversation-home-16-candidate';
d.system.components.push({id:'CMP-journal',states:['default','empty','filtered','focus','dark'],token_refs:['--surface','--action','--secondary','--divider']});
d.pending_decisions.push({id:'PD-framework-16-freeze',question:'图 1 的对话式首页和图 2 的记录排布已按用户澄清实现为候选；待查看本版实际页面后决定是否冻结。',blocks_design:false,status:'open'});
d.implementation.change_scope='delivery-review/conversation-home-journal-16/DELIVERY.md';
d.implementation.main_files=[...new Set([...d.implementation.main_files,'assets/layout-16.css'])];
d.implementation.routes=['#/home','#/records','#/mine','#/onboarding'];
d.implementation.route_aliases={'#/assistant':'#/home'};
d.implementation.dock=[];
d.implementation.scope='R16：对话式首页替换 Today，左上菜单承接导航；记录页采用对象、摘要、时间线排布并保留新建；维持莓色留白与既有交互数据。';
d.implementation.source_urls=['index.html#/home','Momcozy-final.html#/home'];
d.implementation.evidence_directory='delivery-review/conversation-home-journal-16';
d.implementation.previous_snapshot='../versions/berry-poise-relayout-15';

fs.writeFileSync(designPath,JSON.stringify(d,null,2)+'\n','utf8');
console.log('Updated design.json for R16 candidate');
