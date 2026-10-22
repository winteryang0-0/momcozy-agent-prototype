const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'design.json');
const design = JSON.parse(fs.readFileSync(file, 'utf8'));
if (design.project.revision !== 'today-card-26') throw new Error('Expected R26 candidate as input');
const requirementsPath = path.join(__dirname, 'profile-sections-27-requirements.json');
const requirements = JSON.parse(fs.readFileSync(requirementsPath, 'utf8'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const ids = requirements.changes.map(change => change.id);
const get = (group, id) => {
  const item = design.framework[group].find(row => row.id === id);
  if (!item) throw new Error(`Missing ${group}: ${id}`);
  return item;
};
const addIds = (item, key, values) => { item[key] = [...new Set([...(item[key] || []), ...values])]; };
const remove = (group, idsToRemove) => {
  design.framework[group] = design.framework[group].filter(item => !idsToRemove.includes(item.id));
};
const control = (id, page_id, component_id, role) =>
  design.framework.controls.push({ id, page_id, component_id, role });
const state = (id, page_id, kind = 'other') =>
  design.framework.states.push({ id, page_id, kind });
const action = (id, control_id, event, target_page_id, from_state, to_state, requirement_ids) =>
  design.framework.actions.push({ id, control_id, event, target_page_id, from_state, to_state, requirement_ids });
const flow = (id, description, action_ids, requirement_ids) =>
  design.framework.flows.push({ id, description, action_ids, requirement_ids });
const test = (id, flow_id, state_ids, steps, expected, requirement_ids) =>
  design.tests.push({ id, flow_id, state_ids, steps, expected, requirement_ids,
    status: 'acceptance-description-see-runtime-evidence' });

design.project.revision = 'profile-sections-27';
design.project.release_label = '莓色留白 · 双入口与宝宝页面候选 27；未冻结';
design.source.candidate_history = [...(design.source.candidate_history || []), design.source.previous_candidate];
design.source.previous_candidate = {
  path: design.source.path,
  sha256: design.source.sha256,
  requirements: design.source.requirements,
};
design.source.path = 'sources/profile-sections-27-requirements.json';
design.source.sha256 = sha(fs.readFileSync(requirementsPath));
addIds(design.source, 'requirements', ids);
design.source.superseded = [
  ...(design.source.superseded || []),
  { id: 'R24-02', scope: '宝宝侧栏入口的旧资料弹窗形式被独立宝宝页面替换；资料字段与保存规则保留。' },
  { id: 'R26-05', scope: '侧栏当日记录直达入口被移除；从我的或宝宝页面进入记录，记录页新建保留。' },
  { id: 'R26-06', scope: '侧栏由三个基础标签精简为我的和宝宝两个标签。' },
];

design.framework.revision = 'HOME-1.1-profile-sections-27-candidate';
design.system.revision = 'CS-0.5-berry-poise-profile-sections-27-candidate';
get('pages', 'PAGE-mine').parent_id = 'PAGE-home';
get('pages', 'PAGE-mine').regions = ['return-and-settings-header', 'profile-overview', 'mom-profile',
  'mom-records-and-analysis', 'devices-and-sync'];
design.framework.pages.push({ id: 'PAGE-baby', route: '#/baby', parent_id: 'PAGE-home',
  regions: ['return-and-settings-header', 'baby-overview', 'baby-profile', 'baby-records-and-analysis'] });
get('pages', 'PAGE-home').regions[1] = 'two-entry-primary-sidebar';

remove('controls', ['NAV-sidebar-record', 'PROFILE-baby-sheet-close', 'PROFILE-baby-sheet-save']);
get('controls', 'NAV-sidebar-open').role = '首页左上打开只含「我的」「宝宝」的侧边栏';
get('controls', 'NAV-sidebar-baby').role = '从侧栏进入与「我的」同层级的宝宝页面';
get('controls', 'NAV-mine-back').role = '从我的返回进入前页面';
get('controls', 'RECORDS-back').role = '从当日记录返回进入前页面';
get('controls', 'MINE-profile').role = '编辑妈妈资料或重新进入基础照护资料';
get('controls', 'HOME-today-compact').role = '折叠态提醒标题居中，整条可点击恢复完整 Today 智能提醒';
control('NAV-baby-back', 'PAGE-baby', 'CMP-sidebar', '从宝宝返回进入前页面');
control('BABY-profile', 'PAGE-baby', 'CMP-record', '从宝宝页编辑称呼、出生日期和孕周并保存');
control('NAV-mine-records', 'PAGE-mine', 'CMP-action', '打开妈妈的当日记录并保留新建入口');
control('NAV-baby-records', 'PAGE-baby', 'CMP-action', '打开宝宝的当日记录并保留新建入口');

remove('states', ['STATE-sidebar-baby-profile']);
state('STATE-baby-normal', 'PAGE-baby', 'normal');
state('STATE-baby-profile-edit', 'PAGE-baby');
state('STATE-baby-profile-error', 'PAGE-baby', 'error');

remove('actions', ['ACT-sidebar-baby-close', 'ACT-sidebar-baby-save', 'ACT-sidebar-records']);
get('actions', 'ACT-sidebar-baby').target_page_id = 'PAGE-baby';
get('actions', 'ACT-sidebar-baby').to_state = 'STATE-baby-normal';
addIds(get('actions', 'ACT-sidebar-baby'), 'requirement_ids', ['R27-02']);
addIds(get('actions', 'ACT-sidebar-open'), 'requirement_ids', ['R27-01']);
addIds(get('actions', 'ACT-advice-expand'), 'requirement_ids', ['R27-03']);
addIds(get('actions', 'ACT-advice-collapse'), 'requirement_ids', ['R27-03']);
action('ACT-baby-return-home', 'NAV-baby-back', 'click-after-home', 'PAGE-home',
  'STATE-baby-normal', 'STATE-home-normal', ['R27-02']);
action('ACT-baby-return-records', 'NAV-baby-back', 'click-after-records', 'PAGE-records',
  'STATE-baby-normal', 'STATE-records-normal', ['R27-02']);
action('ACT-baby-profile-open', 'BABY-profile', 'click', 'PAGE-baby',
  'STATE-baby-normal', 'STATE-baby-profile-edit', ['R27-02']);
action('ACT-baby-profile-save', 'BABY-profile', 'submit-valid', 'PAGE-baby',
  'STATE-baby-profile-edit', 'STATE-baby-normal', ['R27-02']);
action('ACT-baby-profile-reject', 'BABY-profile', 'submit-invalid', 'PAGE-baby',
  'STATE-baby-profile-edit', 'STATE-baby-profile-error', ['R27-02']);
action('ACT-mine-records', 'NAV-mine-records', 'click', 'PAGE-records',
  'STATE-mine-normal', 'STATE-records-normal', ['R27-01', 'R27-02']);
action('ACT-baby-records', 'NAV-baby-records', 'click', 'PAGE-records',
  'STATE-baby-normal', 'STATE-records-normal', ['R27-01', 'R27-02']);
action('ACT-records-return-mine', 'RECORDS-back', 'click-after-mine', 'PAGE-mine',
  'STATE-records-normal', 'STATE-mine-normal', ['R27-02']);
action('ACT-records-return-baby', 'RECORDS-back', 'click-after-baby', 'PAGE-baby',
  'STATE-records-normal', 'STATE-baby-normal', ['R27-02']);
action('ACT-profile-menu-baby', 'RECORDS-profile-menu', 'click', 'PAGE-baby',
  'STATE-records-menu', 'STATE-baby-normal', ['R27-02']);

get('flows', 'FLOW-home-menu-records').description = '首页侧栏进入我的，再打开妈妈当日记录并按来源返回';
get('flows', 'FLOW-home-menu-records').action_ids = ['ACT-sidebar-open', 'ACT-sidebar-mine',
  'ACT-mine-records', 'ACT-records-return-mine', 'ACT-mine-return-home'];
addIds(get('flows', 'FLOW-home-menu-records'), 'requirement_ids', ['R27-01', 'R27-02']);
get('flows', 'FLOW-journal-layout').action_ids = ['ACT-records-owner-switch',
  'ACT-records-date-change', 'ACT-records-filter-open', 'ACT-records-filter-apply'];
get('flows', 'FLOW-ai-header-layout').description = '居中 Momcozy AI 标题、左上双入口侧栏和右上声音开关';
get('flows', 'FLOW-sidebar-baby').description = '侧栏进入宝宝独立页面并返回首页';
get('flows', 'FLOW-sidebar-baby').action_ids = ['ACT-sidebar-open', 'ACT-sidebar-baby', 'ACT-baby-return-home'];
addIds(get('flows', 'FLOW-sidebar-baby'), 'requirement_ids', ['R27-02']);
get('flows', 'FLOW-sidebar-baby-save').description = '侧栏进入宝宝页，编辑资料并回到宝宝页';
get('flows', 'FLOW-sidebar-baby-save').action_ids = ['ACT-sidebar-open', 'ACT-sidebar-baby',
  'ACT-baby-profile-open', 'ACT-baby-profile-save'];
addIds(get('flows', 'FLOW-sidebar-baby-save'), 'requirement_ids', ['R27-02']);
const priorRecordFlow = get('flows', 'FLOW-sidebar-records');
priorRecordFlow.id = 'FLOW-baby-records';
priorRecordFlow.description = '侧栏进入宝宝页，再打开宝宝当日记录并按来源返回';
priorRecordFlow.action_ids = ['ACT-sidebar-open', 'ACT-sidebar-baby',
  'ACT-baby-records', 'ACT-records-return-baby'];
addIds(priorRecordFlow, 'requirement_ids', ['R27-01', 'R27-02']);
flow('FLOW-mine-records', '侧栏进入我的，再打开妈妈当日记录并按来源返回',
  ['ACT-sidebar-open', 'ACT-sidebar-mine', 'ACT-mine-records', 'ACT-records-return-mine'],
  ['R27-01', 'R27-02']);
flow('FLOW-baby-profile-invalid', '宝宝资料校验错误时留在表单并保持原值',
  ['ACT-baby-profile-open', 'ACT-baby-profile-reject'], ['R27-02']);
flow('FLOW-records-profile-baby', '记录页右上菜单进入宝宝页并返回记录',
  ['ACT-profile-menu-open', 'ACT-profile-menu-baby', 'ACT-baby-return-records'], ['R27-02']);
addIds(get('flows', 'FLOW-advice-restore'), 'requirement_ids', ['R27-03']);

for (const mapping of design.mapping) {
  mapping.flow_ids = (mapping.flow_ids || []).map(id => id === 'FLOW-sidebar-records' ? 'FLOW-baby-records' : id);
  mapping.state_ids = (mapping.state_ids || []).map(id => id === 'STATE-sidebar-baby-profile' ? 'STATE-baby-normal' : id);
  if (['R24-02', 'R26-05', 'R26-06'].includes(mapping.requirement_id)) {
    addIds(mapping, 'page_ids', ['PAGE-baby']);
    addIds(mapping, 'flow_ids', ['FLOW-mine-records', 'FLOW-baby-records']);
  }
  if (mapping.requirement_id === 'R16-01') addIds(mapping, 'page_ids', ['PAGE-baby']);
  if (mapping.requirement_id === 'R24-03') addIds(mapping, 'page_ids', ['PAGE-baby', 'PAGE-mine']);
}
design.mapping.push({ requirement_id: 'R27-01', page_ids: ['PAGE-home', 'PAGE-mine', 'PAGE-baby', 'PAGE-records'],
  flow_ids: ['FLOW-sidebar-mine', 'FLOW-sidebar-baby', 'FLOW-mine-records', 'FLOW-baby-records'],
  state_ids: ['STATE-home-sidebar-open', 'STATE-mine-normal', 'STATE-baby-normal', 'STATE-records-normal'],
  test_ids: ['T27-two-entry-sidebar', 'T27-records-path'] });
design.mapping.push({ requirement_id: 'R27-02', page_ids: ['PAGE-home', 'PAGE-mine', 'PAGE-baby', 'PAGE-records'],
  flow_ids: ['FLOW-sidebar-baby', 'FLOW-sidebar-baby-save', 'FLOW-baby-profile-invalid',
    'FLOW-mine-records', 'FLOW-baby-records', 'FLOW-records-profile-baby'],
  state_ids: ['STATE-baby-normal', 'STATE-baby-profile-edit', 'STATE-baby-profile-error',
    'STATE-records-normal', 'STATE-mine-normal'],
  test_ids: ['T27-baby-page', 'T27-baby-edit', 'T27-records-path'] });
design.mapping.push({ requirement_id: 'R27-03', page_ids: ['PAGE-home'],
  flow_ids: ['FLOW-advice-restore'], state_ids: ['STATE-assistant-chat', 'STATE-home-advice-expanded'],
  test_ids: ['T27-compact-center'] });

const updateTest = (id, flow_id, state_ids, steps, expected) => {
  const item = design.tests.find(row => row.id === id);
  if (!item) throw new Error('Missing test: ' + id);
  Object.assign(item, { flow_id, state_ids, steps, expected });
};
for (const item of design.tests) {
  if (item.flow_id === 'FLOW-sidebar-records') item.flow_id = 'FLOW-baby-records';
  item.state_ids = (item.state_ids || []).map(id => id === 'STATE-sidebar-baby-profile' ? 'STATE-baby-normal' : id);
}
updateTest('T15-ai-header', 'FLOW-ai-header-layout', ['STATE-assistant-welcome', 'STATE-assistant-chat'],
  ['在欢迎页与已有对话查看首页顶部。'], 'Momcozy AI 居中；左侧打开仅含我的、宝宝的侧栏，右侧声音按钮可切换。');
updateTest('T16-home-navigation', 'FLOW-home-menu-records',
  ['STATE-home-normal', 'STATE-mine-normal', 'STATE-records-normal'],
  ['首页左上打开侧栏，经我的进入当日记录，再逐级返回；检查无底部 Dock，旧 #/assistant 深链回到 #/home。'],
  '记录可通过我的进入和新建；返回依次回到我的和首页，旧对话数据保留。');
updateTest('T17-navigation', 'FLOW-home-menu-records',
  ['STATE-home-normal', 'STATE-mine-normal', 'STATE-records-normal', 'STATE-records-menu', 'STATE-chat-history'],
  ['首页侧栏进入我的，再进当日记录；右上打开分类，进入宝宝、历史、设备及新对话；核对返回来源、日期切换和新建。'],
  '我的与宝宝分层清晰，旧二级功能可达；记录日期和新建不丢失。');
updateTest('T24-open-order-width', 'FLOW-sidebar-dismiss',
  ['STATE-home-normal', 'STATE-home-sidebar-open'],
  ['在 390×844 和桌面预览打开首页左上入口，核对只有我的、宝宝两项、展开方向及边界。'],
  '侧栏仅含两个入口，宽度不超过 320px 和容器约 84%；背景不可操作且无横向溢出。');
updateTest('T24-baby-close', 'FLOW-sidebar-baby',
  ['STATE-home-sidebar-open', 'STATE-baby-normal', 'STATE-home-normal'],
  ['从首页侧栏进入宝宝页，点击左上返回；进入宝宝资料编辑后取消，再返回首页。'],
  '宝宝页返回首页；取消编辑不保存资料修改。');
updateTest('T24-baby-save', 'FLOW-sidebar-baby-save',
  ['STATE-home-sidebar-open', 'STATE-baby-normal', 'STATE-baby-profile-edit'],
  ['从侧栏进入宝宝页，编辑并保存称呼；再次打开编辑，检查值已更新。'],
  '保存后停留在宝宝页，概览和编辑表单显示新称呼；侧栏仍只有我的、宝宝。');
updateTest('T24-service-ranking', 'FLOW-baby-records',
  ['STATE-home-sidebar-open', 'STATE-baby-normal', 'STATE-records-normal'],
  ['打开侧栏，确认服务和记录直达入口均不存在；经宝宝页进入当日记录并检查新建。'],
  '侧栏仅有我的、宝宝；宝宝记录可进入，新建入口保留。');
updateTest('T24-visual-variants', 'FLOW-sidebar-dismiss', ['STATE-home-sidebar-open'],
  ['检查 390×844 明亮、360×640 夜间与减少动效、1280×720 桌面，以及单文件与模块版 file://。'],
  '侧栏两个入口在明暗短屏与桌面完整可读，无旧服务区及当日记录直达入口。');
updateTest('T26-simple-sidebar', 'FLOW-baby-records',
  ['STATE-home-sidebar-open', 'STATE-baby-normal', 'STATE-records-normal'],
  ['打开侧栏核对只有两项；分别进入我的和宝宝，再从宝宝进入记录并新建。'],
  '侧栏仅有我的、宝宝；两个页面均可返回；记录页新建可用。');
test('T27-two-entry-sidebar', 'FLOW-sidebar-dismiss',
  ['STATE-home-normal', 'STATE-home-sidebar-open'],
  ['打开侧栏，核对只显示我的和宝宝，点击遮罩、关闭按钮及 Escape；再检查窄屏与夜间。'],
  '第三个菜单入口不存在；焦点回到菜单按钮，布局不溢出。', ['R27-01']);
test('T27-baby-page', 'FLOW-sidebar-baby',
  ['STATE-home-sidebar-open', 'STATE-baby-normal', 'STATE-home-normal'],
  ['从侧栏进入宝宝，比较与我的页面层级、顶部返回和分组；返回并刷新 #/baby 深链。'],
  '宝宝为独立可刷新的页面，返回路径与我的一致，分组内容与宝宝相关。', ['R27-02']);
test('T27-baby-edit', 'FLOW-sidebar-baby-save',
  ['STATE-baby-normal', 'STATE-baby-profile-edit', 'STATE-baby-profile-error'],
  ['打开编辑资料，提交不合法出生孕周，再修正并保存宝宝称呼和孕周；刷新确认。'],
  '错误保留表单并提示；合法资料保存后更新宝宝页，刷新不丢失。', ['R27-02']);
test('T27-records-path', 'FLOW-baby-records',
  ['STATE-mine-normal', 'STATE-baby-normal', 'STATE-records-normal'],
  ['分别从我的和宝宝进入当日记录，核对对象、返回来源与新建；从记录页右上菜单进入宝宝并返回。'],
  '妈妈和宝宝记录按来源进入，返回各自页面，记录页新建保持可用。', ['R27-01', 'R27-02']);
test('T27-mine-records', 'FLOW-mine-records',
  ['STATE-home-sidebar-open', 'STATE-mine-normal', 'STATE-records-normal'],
  ['从侧栏进入我的，点当日记录并检查妈妈对象、新建按钮和返回。'],
  '记录默认为妈妈，返回我的且新建仍可用。', ['R27-01', 'R27-02']);
test('T27-baby-profile-invalid', 'FLOW-baby-profile-invalid',
  ['STATE-baby-normal', 'STATE-baby-profile-edit', 'STATE-baby-profile-error'],
  ['宝宝页打开资料表单，填入不支持的孕周并提交。'],
  '错误就地提示，表单保持打开且原保存资料不变。', ['R27-02']);
test('T27-records-profile-baby', 'FLOW-records-profile-baby',
  ['STATE-records-normal', 'STATE-records-menu', 'STATE-baby-normal'],
  ['记录页打开右上我的菜单，进入宝宝页面，再返回。'],
  '宝宝页可从记录菜单进入，返回记录页并保留此前选中的对象。', ['R27-02']);
test('T27-compact-center', 'FLOW-advice-restore',
  ['STATE-assistant-chat', 'STATE-home-advice-expanded'],
  ['发送对话使 Today 折叠；逐条切换提醒，检查文字相对缩略条居中，再展开与收起；复核夜间和短屏。'],
  '折叠条标题保持水平居中且不遮挡 Today 标记或展开图标，整条可点击恢复。', ['R27-03']);

const sidebar = design.system.components.find(item => item.id === 'CMP-sidebar');
if (!sidebar) throw new Error('Missing CMP-sidebar');
sidebar.layout.order = ['mine', 'baby'];
const advice = design.system.components.find(item => item.id === 'CMP-advice');
if (!advice) throw new Error('Missing CMP-advice');
addIds(advice, 'states', ['compact-centered']);
design.pending_decisions.push({ id: 'PD-profile-sections-27-freeze',
  question: '双入口侧栏、宝宝独立页面及 Today 折叠居中的候选待用户查看后决定是否冻结。',
  blocks_design: false, status: 'open' });
design.implementation.change_scope = 'delivery-review/profile-sections-27/DELIVERY.md';
design.implementation.evidence_directory = 'delivery-review/profile-sections-27';
design.implementation.previous_snapshot = '../versions/today-card-26';
design.implementation.scope = 'R27 侧栏只留我的和宝宝；宝宝改为与我的同层级独立页面，两个页面分别进入对应记录；Today 折叠标题居中。';
addIds(design.implementation, 'main_files', ['assets/profile-sections-27.css']);
addIds(design.implementation, 'routes', ['#/baby']);

for (const group of ['pages', 'controls', 'actions', 'states', 'flows']) {
  const names = design.framework[group].map(item => item.id);
  if (new Set(names).size !== names.length) throw new Error(`Duplicate ${group} ID`);
}
const controls = new Set(design.framework.controls.map(item => item.id));
const states = new Set(design.framework.states.map(item => item.id));
const actions = new Set(design.framework.actions.map(item => item.id));
const flows = new Set(design.framework.flows.map(item => item.id));
for (const item of design.framework.actions) {
  if (!controls.has(item.control_id) || !states.has(item.from_state) || !states.has(item.to_state))
    throw new Error('Dangling action: ' + item.id);
}
for (const item of design.framework.flows) {
  for (const id of item.action_ids) if (!actions.has(id)) throw new Error('Dangling flow: ' + item.id + ' -> ' + id);
}
for (const item of design.tests) {
  if (!flows.has(item.flow_id)) throw new Error('Dangling test flow: ' + item.id);
  for (const id of item.state_ids || []) if (!states.has(id)) throw new Error('Dangling test state: ' + item.id + ' -> ' + id);
}
for (const item of design.mapping) {
  for (const id of item.flow_ids || []) if (!flows.has(id)) throw new Error('Dangling mapping flow: ' + item.requirement_id + ' -> ' + id);
  for (const id of item.state_ids || []) if (!states.has(id)) throw new Error('Dangling mapping state: ' + item.requirement_id + ' -> ' + id);
}

fs.writeFileSync(file, JSON.stringify(design, null, 2) + '\n', 'utf8');
console.log('Updated design.json to candidate 27');
