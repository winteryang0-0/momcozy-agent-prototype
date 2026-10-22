const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'design.json');
const design=JSON.parse(fs.readFileSync(file,'utf8'));
if(design.project.revision!=='conversation-care-cards-20')throw new Error('Unexpected source revision');
const source=path.join(__dirname,'profile-field-ranges-21-requirements.json');
const requirements=JSON.parse(fs.readFileSync(source,'utf8'));
const sha=filePath=>crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
const ids=requirements.changes.map(change=>change.id);
design.project.revision='profile-field-ranges-21';
design.project.release_label='莓色留白 · 资料字段范围候选；未冻结';
design.source.candidate_history=[...(design.source.candidate_history||[]),design.source.previous_candidate];
design.source.previous_candidate={path:design.source.path,sha256:design.source.sha256,requirements:design.source.requirements};
design.source.path='sources/profile-field-ranges-21-requirements.json';
design.source.sha256=sha(source);
design.source.requirements=[...new Set([...design.source.requirements,...ids])];
design.framework.revision='HOME-1.1-profile-field-ranges-21-candidate';
design.system.revision='CS-0.5-berry-poise-profile-ranges-21-candidate';
const addIds=(item,key,values)=>{item[key]=[...new Set([...(item[key]||[]),...values])];};
for(const control of design.framework.controls){
 if(control.id==='ONBOARD-details')control.role='同页妈妈与宝宝资料及多宝宝标签；年龄 18–50、分娩 0–6、宝宝出生孕周 37–50';
 if(control.id==='MINE-profile')control.role='编辑妈妈年龄和分娩次数、宝宝出生孕周及原有资料，或重新进入完整基础资料';
}
for(const flow of design.framework.flows){
 if(['FLOW-onboarding','FLOW-onboarding-invalid','FLOW-profile','FLOW-profile-invalid'].includes(flow.id))addIds(flow,'requirement_ids',ids);
 if(flow.id==='FLOW-onboarding-invalid')flow.description='日期或数字范围无效时留在资料步骤并定位字段';
 if(flow.id==='FLOW-profile-invalid')flow.description='资料快捷编辑中日期或数字范围无效时阻止保存';
}
for(const action of design.framework.actions){
 if(['ACT-details-next','ACT-onboarding-finish','ACT-onboarding-reject','ACT-profile-save','ACT-profile-reject'].includes(action.id))addIds(action,'requirement_ids',ids);
}
for(const change of requirements.changes){
 design.mapping.push({
  requirement_id:change.id,
  page_ids:['PAGE-onboarding','PAGE-mine'],
  flow_ids:['FLOW-onboarding','FLOW-onboarding-invalid','FLOW-profile','FLOW-profile-invalid'],
  state_ids:['STATE-onboarding-details','STATE-onboarding-invalid','STATE-profile-edit','STATE-profile-error'],
  test_ids:['T21-'+change.id.slice(-2)+'-onboarding','T21-'+change.id.slice(-2)+'-profile','T21-legacy-onboarding','T21-legacy-profile']
 });
}
const addTest=(id,flow_id,state_ids,steps,expected,requirements)=>design.tests.push({
 id,flow_id,state_ids,
 steps,expected,requirement_ids:requirements,status:'acceptance-description-see-runtime-evidence'
});
addTest('T21-01-onboarding','FLOW-onboarding-invalid',['STATE-onboarding-details','STATE-onboarding-invalid'],['首次录入滚轮检查年龄 18、50、空值；以旧值 17、51 和小数草稿测试拦截。'],'仅 18–50 整数或空值可继续，旧值需要用户修正或清空。',['R21-01']);
addTest('T21-01-profile','FLOW-profile-invalid',['STATE-profile-edit','STATE-profile-error'],['妈妈资料编辑依次测试年龄 17、18、50、51、空值和小数；保存后重开。'],'仅 18–50 整数或空值可保存，边界值持久化。',['R21-01']);
addTest('T21-02-onboarding','FLOW-onboarding-invalid',['STATE-onboarding-details','STATE-onboarding-invalid'],['首次录入滚轮检查分娩次数 0、6、空值；以旧值 -1、7 和小数草稿测试拦截。'],'仅 0–6 整数或空值可继续，0 不视为未填写。',['R21-02']);
addTest('T21-02-profile','FLOW-profile-invalid',['STATE-profile-edit','STATE-profile-error'],['妈妈资料编辑依次测试分娩次数 -1、0、6、7、空值和小数；保存后重开。'],'仅 0–6 整数或空值可保存。',['R21-02']);
addTest('T21-03-onboarding','FLOW-onboarding-invalid',['STATE-onboarding-details','STATE-onboarding-invalid'],['首次录入滚轮检查出生孕周 37、50、空值；以多宝宝旧值 36、51 测试定位和拦截。'],'仅 37–50 整数或空值可继续，多宝宝分别校验。',['R21-03']);
addTest('T21-03-profile','FLOW-profile-invalid',['STATE-profile-edit','STATE-profile-error'],['宝宝资料编辑依次测试出生孕周 36、37、50、51、空值；保存后重开。'],'仅 37–50 整数或空值可保存，快捷编辑更新宝宝 1。',['R21-03']);
addTest('T21-legacy-onboarding','FLOW-onboarding-invalid',['STATE-onboarding-details','STATE-onboarding-invalid'],['载入上一候选的超范围已保存资料与暂停草稿，进入完整资料检查原值、提示、修正和取消。'],'旧值显示并阻止直接覆盖；取消时原资料不变。',ids);
addTest('T21-legacy-profile','FLOW-profile-invalid',['STATE-profile-edit','STATE-profile-error'],['载入上一候选的超范围已保存资料，进入妈妈与宝宝快捷编辑检查原值、提示和修正。'],'旧值显示并阻止直接覆盖；修正或清空后可保存。',ids);
design.pending_decisions.push({id:'PD-profile-ranges-21-freeze',question:'妈妈年龄、已分娩次数与宝宝出生孕周的新范围和快捷编辑页面为本轮可审阅候选，待用户查看后决定是否冻结。',blocks_design:false,status:'open'});
design.implementation.change_scope='delivery-review/profile-field-ranges-21/DELIVERY.md';
design.implementation.evidence_directory='delivery-review/profile-field-ranges-21';
design.implementation.previous_snapshot='../versions/conversation-care-cards-20';
addIds(design.implementation,'main_files',['assets/profile-ranges-21.css']);
design.implementation.scope='R21 妈妈年龄 18–50、分娩 0–6、宝宝出生孕周 37–50；首次录入与资料快捷编辑一致，既有页面架构不变。';
fs.writeFileSync(file,JSON.stringify(design,null,2)+'\n');
console.log('Updated design.json to candidate 21');
