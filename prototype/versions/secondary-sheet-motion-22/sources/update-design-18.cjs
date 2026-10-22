const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'design.json');
const d=JSON.parse(fs.readFileSync(file,'utf8'));
if(d.project.revision!=='smart-reminders-entry-sound-17')throw new Error('Unexpected source revision');
const source=path.join(root,'sources/first-visit-onboarding-18-requirements.json');
const req=JSON.parse(fs.readFileSync(source,'utf8'));
d.project.revision='first-visit-onboarding-18';
d.project.release_label='莓色留白 · 新用户首次资料录入候选；未冻结';
d.source.path='sources/first-visit-onboarding-18-requirements.json';
d.source.sha256=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
d.source.requirements=req.requirements;
d.source.previous_candidate={path:'sources/refinement-17-requirements.json',sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'sources/refinement-17-requirements.json'))).digest('hex'),requirements:req.requirements.filter(x=>x!=='R18-01')};
d.framework.revision='HOME-1.1-first-visit-onboarding-18-candidate';
d.system.revision='CS-0.5-berry-poise-first-visit-18-candidate';
d.framework.controls.push({id:'ONBOARD-first-entry',page_id:'PAGE-onboarding',component_id:'CMP-action',role:'本机新用户首次进入四步资料录入'});
d.framework.actions.push(
 {id:'ACT-first-visit-entry',control_id:'ONBOARD-first-entry',event:'initial-load',target_page_id:'PAGE-onboarding',from_state:'STATE-onboarding-first-visit',to_state:'STATE-onboarding-identity',requirement_ids:['R18-01']},
 {id:'ACT-onboarding-resume',control_id:'ONBOARD-first-entry',event:'reload',target_page_id:'PAGE-onboarding',from_state:'STATE-onboarding-paused',to_state:'STATE-onboarding-identity',requirement_ids:['R18-01']}
);
d.framework.states.push({id:'STATE-onboarding-first-visit',page_id:'PAGE-onboarding',kind:'other'},{id:'STATE-onboarding-paused',page_id:'PAGE-onboarding',kind:'other'});
d.framework.flows.push({id:'FLOW-first-visit-onboarding',description:'本机新用户首次打开后进入已有四步资料流程，完成返回首页',requirement_ids:['R18-01'],action_ids:['ACT-first-visit-entry','ACT-identity-next','ACT-details-next','ACT-concerns-next','ACT-onboarding-finish']},{id:'FLOW-onboarding-resume',description:'录入中刷新或稍后设置后重新进入已保存步骤；后续步骤由 FLOW-onboarding 覆盖',requirement_ids:['R18-01'],action_ids:['ACT-onboarding-resume']});
d.mapping.push({requirement_id:'R18-01',page_ids:['PAGE-onboarding','PAGE-home','PAGE-records'],flow_ids:['FLOW-first-visit-onboarding','FLOW-onboarding-resume'],state_ids:['STATE-onboarding-first-visit','STATE-onboarding-identity','STATE-onboarding-details','STATE-onboarding-concerns','STATE-onboarding-recommendations','STATE-onboarding-paused','STATE-home-normal'],test_ids:['T18-first-visit','T18-resume']});
d.tests.push({id:'T18-first-visit',flow_id:'FLOW-first-visit-onboarding',state_ids:['STATE-onboarding-first-visit','STATE-onboarding-identity','STATE-onboarding-details','STATE-onboarding-concerns','STATE-onboarding-recommendations','STATE-home-normal'],steps:['清空浏览器原型存储并打开 #/home；身份未选时尝试继续；完成四步；刷新；再以已有资料的新环境打开。'],expected:'全新用户进入身份步骤，身份必选，其余字段可空；完成后首页可见且刷新不重复引导，已有资料的用户保持首页。'},{id:'T18-resume',flow_id:'FLOW-onboarding-resume',state_ids:['STATE-onboarding-paused','STATE-onboarding-identity','STATE-onboarding-details','STATE-onboarding-concerns','STATE-onboarding-recommendations','STATE-home-normal'],steps:['在关注点步骤点击稍后设置；刷新；从记录右上个人菜单再次打开基础资料；检查步骤和已选内容；完成。'],expected:'跳过后首页可用，恢复时步骤和草稿保留；完成写入本机资料，不虚构记录。'});
d.pending_decisions.push({id:'PD-first-visit-18-freeze',question:'首次录入接入为用户授权候选，待用户查看具体页面与步骤后决定是否冻结。',blocks_design:false,status:'open'});
d.implementation.authorization='IMPLEMENTATION.txt';
d.implementation.change_scope='delivery-review/first-visit-onboarding-18/DELIVERY.md';
d.implementation.scope='R18：全新本机用户首次进入既有四步资料录入；可跳过、刷新恢复和从个人菜单续填；已有数据用户沿用首页。';
d.implementation.evidence_directory='delivery-review/first-visit-onboarding-18';
d.implementation.previous_snapshot='../versions/smart-reminders-entry-sound-17';
fs.writeFileSync(file,JSON.stringify(d,null,2)+'\n');
console.log('Updated design.json to candidate 18');
