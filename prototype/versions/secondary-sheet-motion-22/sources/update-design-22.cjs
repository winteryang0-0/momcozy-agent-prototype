const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'design.json');
const design = JSON.parse(fs.readFileSync(file, 'utf8'));
if (design.project.revision !== 'profile-field-ranges-21') throw new Error('Unexpected source revision');

const requirementPath = path.join(__dirname, 'secondary-sheet-motion-22-requirements.json');
const requirements = JSON.parse(fs.readFileSync(requirementPath, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ids = requirements.changes.map(change => change.id);
const addIds = (item, key, values) => { item[key] = [...new Set([...(item[key] || []), ...values])]; };

design.project.revision = 'secondary-sheet-motion-22';
design.project.release_label = '莓色留白 · 二级弹窗动效候选；未冻结';
design.source.candidate_history = [...(design.source.candidate_history || []), design.source.previous_candidate];
design.source.previous_candidate = {
  path: design.source.path,
  sha256: design.source.sha256,
  requirements: design.source.requirements
};
design.source.path = 'sources/secondary-sheet-motion-22-requirements.json';
design.source.sha256 = sha(requirementPath);
addIds(design.source, 'requirements', ids);

design.framework.revision = 'HOME-1.1-secondary-sheet-motion-22-candidate';
design.system.revision = 'CS-0.5-berry-poise-sheet-motion-22-candidate';
design.system.motion = {
  secondary_sheet: {
    direction: 'bottom-to-top',
    duration: '400ms',
    easing: 'cubic-bezier(.18,.82,.24,1)',
    panel_opacity: 'opaque throughout entrance',
    shade: 'fade in on first open only',
    content_switch: 'replay panel rise only for a different sheet kind or title',
    reduced_motion: 'show immediately for user or system preference'
  }
};

const control = design.framework.controls.find(row => row.id === 'RECORDS-profile-menu');
control.role = '右上角打开标题为「我的」的既有二级功能分类';
const profileMenuFlow = design.framework.flows.find(row => row.id === 'FLOW-records-profile-menu');
profileMenuFlow.description = '记录页右上角打开标题为「我的」的二级功能分类';

for (const flow of design.framework.flows) {
  if (flow.id === 'FLOW-records-profile-menu') addIds(flow, 'requirement_ids', ids);
  if (['FLOW-records-profile-mine', 'FLOW-profile', 'FLOW-journal-create', 'FLOW-chat-material-menu', 'FLOW-chat-material-menu-active'].includes(flow.id)) {
    addIds(flow, 'requirement_ids', ['R22-02']);
  }
}
for (const action of design.framework.actions) {
  if (action.id === 'ACT-profile-menu-open') addIds(action, 'requirement_ids', ids);
  if (['ACT-profile-open', 'ACT-record-open', 'ACT-record-type', 'ACT-material-menu-open', 'ACT-material-menu-from-chat'].includes(action.id)) {
    addIds(action, 'requirement_ids', ['R22-02']);
  }
}

design.mapping.push({
  requirement_id: 'R22-01',
  page_ids: ['PAGE-records'],
  flow_ids: ['FLOW-records-profile-menu'],
  state_ids: ['STATE-records-menu'],
  test_ids: ['T22-01-my-title']
});
design.mapping.push({
  requirement_id: 'R22-02',
  page_ids: ['PAGE-records', 'PAGE-mine', 'PAGE-home'],
  flow_ids: ['FLOW-records-profile-menu', 'FLOW-records-profile-mine', 'FLOW-profile', 'FLOW-journal-create', 'FLOW-chat-material-menu', 'FLOW-chat-material-menu-active'],
  state_ids: ['STATE-records-menu', 'STATE-profile-edit', 'STATE-global-picker', 'STATE-global-form', 'STATE-chat-material-menu'],
  test_ids: ['T22-02-my-rise', 'T22-02-nested-rise', 'T22-02-record-and-chat', 'T22-02-reduced-and-desktop']
});

const addTest = (id, flow_id, state_ids, steps, expected, requirement_ids) => design.tests.push({
  id, flow_id, state_ids, steps, expected, requirement_ids,
  status: 'acceptance-description-see-runtime-evidence'
});
addTest('T22-01-my-title', 'FLOW-records-profile-menu', ['STATE-records-menu'],
  ['从首页进入当日记录，点击右上个人入口，读取弹窗标题并关闭。'],
  '标题精确显示「我的」；原有分组、二级入口和关闭操作仍可用。', ['R22-01']);
addTest('T22-02-my-rise', 'FLOW-records-profile-menu', ['STATE-records-normal', 'STATE-records-menu'],
  ['在 390×844 与夜间 360×640 打开「我的」；逐帧记录面板位置、透明度与遮罩。'],
  '面板从底部连续上移且全程不透明；遮罩仅首次打开时渐入，无水平溢出或闪白。', ['R22-02']);
addTest('T22-02-nested-rise', 'FLOW-profile', ['STATE-records-menu', 'STATE-profile-edit'],
  ['在「我的」中进入妈妈资料，观察二级内容切换；修改同一面板内状态再观察。'],
  '切换到新二级内容时面板重新从底部上移、遮罩保持稳定；同类状态更新不重复入场。', ['R22-02']);
addTest('T22-02-record-and-chat', 'FLOW-journal-create', ['STATE-global-picker', 'STATE-global-form', 'STATE-chat-material-menu'],
  ['从记录页打开新建记录与记录表单；从对话输入加号进入拍照或附件；检查共用弹窗入场和关闭。'],
  '各面板共用向上入场方式，内容与操作无闪烁或丢失，关闭后可继续原流程。', ['R22-02']);
addTest('T22-02-reduced-and-desktop', 'FLOW-records-profile-menu', ['STATE-records-menu'],
  ['分别启用用户减少动态效果、系统减少动态效果；再在桌面视口打开「我的」。'],
  '两类减少动效设置下直接显示面板；桌面视口面板限制在应用预览区域内且可读。', ['R22-02']);

design.pending_decisions.push({
  id: 'PD-secondary-sheet-motion-22-freeze',
  question: '「我的」标题与二级面板动效已形成可审阅候选，待用户查看后决定是否冻结。',
  blocks_design: false,
  status: 'open'
});
design.implementation.change_scope = 'delivery-review/secondary-sheet-motion-22/DELIVERY.md';
design.implementation.evidence_directory = 'delivery-review/secondary-sheet-motion-22';
design.implementation.previous_snapshot = '../versions/profile-field-ranges-21';
design.implementation.scope = 'R22「我的」标题与共用二级弹窗从底部柔和上移；页面、导航、资料字段及既有任务流程不变。';

fs.writeFileSync(file, JSON.stringify(design, null, 2) + '\n', 'utf8');
console.log('Updated design.json to candidate 22');
