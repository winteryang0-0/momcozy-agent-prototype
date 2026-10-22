const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'design.json');
const design = JSON.parse(fs.readFileSync(file, 'utf8'));
if (design.project.revision !== 'conversation-shortcuts-23') throw new Error('Unexpected source revision');
const requirementPath = path.join(__dirname, 'left-sidebar-24-requirements.json');
const requirements = JSON.parse(fs.readFileSync(requirementPath, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ids = requirements.changes.map(change => change.id);
const addIds = (item, key, values) => { item[key] = [...new Set([...(item[key] || []), ...values])]; };
const get = (group, id) => {
  const item = design.framework[group].find(row => row.id === id);
  if (!item) throw new Error('Missing ' + group + ': ' + id);
  return item;
};

design.project.revision = 'left-sidebar-24';
design.project.release_label = '莓色留白 · 左侧照护空间候选；未冻结';
design.source.candidate_history = [...(design.source.candidate_history || []), design.source.previous_candidate];
design.source.previous_candidate = {
  path: design.source.path,
  sha256: design.source.sha256,
  requirements: design.source.requirements
};
design.source.path = 'sources/left-sidebar-24-requirements.json';
design.source.sha256 = sha(requirementPath);
addIds(design.source, 'requirements', ids);

design.framework.revision = 'HOME-1.1-left-sidebar-24-candidate';
design.system.revision = 'CS-0.5-berry-poise-left-sidebar-24-candidate';
get('pages', 'PAGE-home').regions = [
  'sidebar-and-sound-header', 'slide-out-care-sidebar', 'welcome-companion',
  'today-smart-reminders', 'compact-expandable-today', 'conversation-timeline',
  'persistent-care-shortcuts', 'single-line-composer'
];

const trigger = get('controls', 'HOME-journal-entry');
trigger.id = 'NAV-sidebar-open';
trigger.component_id = 'CMP-sidebar';
trigger.role = '首页左上打开应用内横向展开的照护空间侧边栏';
const control = (id, page_id, role) => design.framework.controls.push({ id, page_id, component_id: 'CMP-sidebar', role });
control('NAV-sidebar-close', 'PAGE-home', '关闭侧栏，包含关闭按钮、遮罩与 Escape');
control('NAV-sidebar-mine', 'PAGE-home', '从侧栏进入我的页面');
control('NAV-sidebar-baby', 'PAGE-home', '从侧栏打开宝宝资料面板');
control('NAV-sidebar-record', 'PAGE-home', '从侧栏进入当日记录并保留新建');
control('NAV-sidebar-cry', 'PAGE-home', '从侧栏进入已有听哭闹任务');
control('NAV-sidebar-poop', 'PAGE-home', '从侧栏进入已有看便便任务');
control('NAV-mine-back', 'PAGE-mine', '返回进入我的之前的页面');

const state = (id, page_id, kind = 'other') => design.framework.states.push({ id, page_id, kind });
state('STATE-home-sidebar-open', 'PAGE-home');
state('STATE-sidebar-baby-profile', 'PAGE-home');
const opening = get('actions', 'ACT-menu-open-records');
opening.id = 'ACT-sidebar-open';
opening.control_id = 'NAV-sidebar-open';
opening.event = 'click';
opening.target_page_id = 'PAGE-home';
opening.to_state = 'STATE-home-sidebar-open';
addIds(opening, 'requirement_ids', ['R24-01', 'R24-03']);
for (const flow of design.framework.flows) {
  flow.action_ids = flow.action_ids.map(id => id === 'ACT-menu-open-records' ? 'ACT-sidebar-open' : id);
}
for (const id of ['FLOW-home-menu-records', 'FLOW-journal-layout']) {
  const flow = get('flows', id);
  const position = flow.action_ids.indexOf('ACT-sidebar-open');
  flow.action_ids.splice(position + 1, 0, 'ACT-sidebar-records');
  addIds(flow, 'requirement_ids', ['R24-03']);
}
get('flows', 'FLOW-home-menu-records').description = '首页左上展开侧栏，经持续记录与管理进入当日记录并返回';
get('flows', 'FLOW-records-profile-mine').action_ids.push('ACT-mine-return-records');
addIds(get('flows', 'FLOW-records-profile-mine'), 'requirement_ids', ['R24-02']);

const action = (id, control_id, event, target_page_id, from_state, to_state, requirement_ids) =>
  design.framework.actions.push({ id, control_id, event, target_page_id, from_state, to_state, requirement_ids });
action('ACT-sidebar-close', 'NAV-sidebar-close', 'click-or-escape', 'PAGE-home', 'STATE-home-sidebar-open', 'STATE-home-normal', ['R24-01']);
action('ACT-sidebar-mine', 'NAV-sidebar-mine', 'click', 'PAGE-mine', 'STATE-home-sidebar-open', 'STATE-mine-normal', ['R24-02']);
action('ACT-sidebar-baby', 'NAV-sidebar-baby', 'click', 'PAGE-home', 'STATE-home-sidebar-open', 'STATE-sidebar-baby-profile', ['R24-02']);
action('ACT-sidebar-baby-close', 'NAV-sidebar-baby', 'close-or-save', 'PAGE-home', 'STATE-sidebar-baby-profile', 'STATE-home-normal', ['R24-02']);
action('ACT-sidebar-records', 'NAV-sidebar-record', 'click', 'PAGE-records', 'STATE-home-sidebar-open', 'STATE-records-normal', ['R24-03']);
action('ACT-sidebar-cry', 'NAV-sidebar-cry', 'click', 'PAGE-home', 'STATE-home-sidebar-open', 'STATE-task-ready', ['R24-03']);
action('ACT-sidebar-poop', 'NAV-sidebar-poop', 'click', 'PAGE-home', 'STATE-home-sidebar-open', 'STATE-task-ready', ['R24-03']);
action('ACT-sidebar-open-task', 'NAV-sidebar-open', 'click-with-task', 'PAGE-home', 'STATE-task-ready', 'STATE-home-sidebar-open', ['R24-03']);
action('ACT-sidebar-task-busy', 'NAV-sidebar-poop', 'click-other-while-task-active', 'PAGE-home', 'STATE-home-sidebar-open', 'STATE-task-ready', ['R24-03']);
action('ACT-mine-return-home', 'NAV-mine-back', 'click-after-home', 'PAGE-home', 'STATE-mine-normal', 'STATE-home-normal', ['R24-02']);
action('ACT-mine-return-records', 'NAV-mine-back', 'click-after-records', 'PAGE-records', 'STATE-mine-normal', 'STATE-records-normal', ['R24-02']);

const flow = (id, description, action_ids, requirement_ids) =>
  design.framework.flows.push({ id, description, action_ids, requirement_ids });
flow('FLOW-sidebar-dismiss', '打开后用关闭、遮罩或 Escape 退出并恢复入口焦点',
  ['ACT-sidebar-open', 'ACT-sidebar-close'], ['R24-01']);
flow('FLOW-sidebar-mine', '从侧栏进入我的并返回首页',
  ['ACT-sidebar-open', 'ACT-sidebar-mine', 'ACT-mine-return-home'], ['R24-02']);
flow('FLOW-sidebar-baby', '从侧栏打开现有宝宝资料并保存或关闭',
  ['ACT-sidebar-open', 'ACT-sidebar-baby', 'ACT-sidebar-baby-close'], ['R24-02']);
flow('FLOW-sidebar-records', '从侧栏进入当日记录并新建或返回',
  ['ACT-sidebar-open', 'ACT-sidebar-records', 'ACT-records-return-home'], ['R24-03']);
flow('FLOW-sidebar-cry', '从侧栏进入已有听哭闹任务',
  ['ACT-sidebar-open', 'ACT-sidebar-cry'], ['R24-03']);
flow('FLOW-sidebar-poop', '从侧栏进入已有看便便任务',
  ['ACT-sidebar-open', 'ACT-sidebar-poop'], ['R24-03']);
flow('FLOW-sidebar-task-conflict', '有未完成任务时另选服务保留当前任务',
  ['ACT-sidebar-open-task', 'ACT-sidebar-task-busy'], ['R24-03']);

design.system.tokens['--sidebar-veil'] = 'rgba(46, 29, 39, .28)';
design.system.tokens['--sidebar-shadow'] = 'rgba(66, 38, 52, .18)';
design.system.components.push({
  id: 'CMP-sidebar',
  states: ['closed', 'opening', 'open', 'closing', 'focus', 'dark', 'reduced-motion'],
  token_refs: ['--surface', '--canvas', '--text', '--secondary', '--action', '--divider',
    '--neutral', '--sidebar-veil', '--sidebar-shadow', '--task-feed-bg', '--task-feed-ink',
    '--task-crying-bg', '--task-crying-ink', '--task-diaper-bg', '--task-diaper-ink'],
  layout: { width: 'min(320px, 84% of app)', direction: 'left-to-right', order: ['mine', 'baby', 'recommended-services'] }
});

const test = (id, flow_id, state_ids, steps, expected, requirement_ids) => design.tests.push({
  id, flow_id, state_ids, steps, expected, requirement_ids,
  status: 'acceptance-description-see-runtime-evidence'
});
test('T24-open-order-width', 'FLOW-sidebar-dismiss', ['STATE-home-normal', 'STATE-home-sidebar-open'],
  ['在 390×844 和桌面预览打开首页左上入口，核对左侧展开方向、我的和宝宝的位置、服务排序及边界。'],
  '侧栏位于应用容器内，宽度不超过 320px 和容器约 84%；背景不可操作，布局无横向溢出。', ['R24-01']);
test('T24-close-focus', 'FLOW-sidebar-dismiss', ['STATE-home-sidebar-open', 'STATE-home-normal'],
  ['分别点击关闭、遮罩及 Escape；用键盘 Tab/Shift+Tab 检查焦点环绕与关闭后回归。'],
  '三种方式均可关闭，焦点停在侧栏内并回到原入口；减少动效直接切换。', ['R24-01']);
test('T24-my-baby', 'FLOW-sidebar-baby', ['STATE-home-sidebar-open', 'STATE-mine-normal', 'STATE-sidebar-baby-profile'],
  ['分别点击我的与宝宝，核对我的返回首页、宝宝资料面板保存与关闭；从记录页二级功能进入我的后返回记录。'],
  '原资料和记录功能可用，返回上下文正确。', ['R24-02']);
test('T24-mine-route', 'FLOW-sidebar-mine', ['STATE-home-sidebar-open', 'STATE-mine-normal', 'STATE-home-normal'],
  ['从首页侧栏进入我的，点击左上返回；从记录页二级功能进入我的，点击左上返回。'],
  '两条路径分别返回首页和记录页。', ['R24-02']);
test('T24-service-ranking', 'FLOW-sidebar-records', ['STATE-home-sidebar-open', 'STATE-records-normal'],
  ['已保存哭声与便便关注时检查推荐排序；无关注点时检查默认顺序；进入记录检查新建入口。'],
  '三项服务均展示，关注项靠前且有推荐标识，记录页新建入口保留。', ['R24-03']);
test('T24-service-task', 'FLOW-sidebar-task-conflict', ['STATE-home-sidebar-open', 'STATE-task-ready'],
  ['从侧栏分别进入哭声与便便任务；任务未结束时从侧栏切换其他服务。'],
  '复用现有卡片，任务冲突保留当前任务并给出提示。', ['R24-03']);
test('T24-cry-route', 'FLOW-sidebar-cry', ['STATE-home-sidebar-open', 'STATE-task-ready'],
  ['从侧栏选择哭声识别。'], '打开现有听哭闹任务卡，后续采集与取消操作可用。', ['R24-03']);
test('T24-poop-route', 'FLOW-sidebar-poop', ['STATE-home-sidebar-open', 'STATE-task-ready'],
  ['无活跃任务时从侧栏选择便便识别。'], '打开现有看便便任务卡，后续拍照与取消操作可用。', ['R24-03']);
test('T24-visual-variants', 'FLOW-sidebar-dismiss', ['STATE-home-sidebar-open'],
  ['检查 390×844 明亮、360×640 夜间与减少动效、1280×720 桌面，以及单文件与模块版 file://。'],
  '各视口下完整可读、不越界、不闪烁，资源闭合且无脚本错误。', ['R24-01', 'R24-03']);

design.mapping.push({
  requirement_id: 'R24-01', page_ids: ['PAGE-home'],
  flow_ids: ['FLOW-sidebar-dismiss'], state_ids: ['STATE-home-normal', 'STATE-home-sidebar-open'],
  test_ids: ['T24-open-order-width', 'T24-close-focus', 'T24-visual-variants']
});
design.mapping.push({
  requirement_id: 'R24-02', page_ids: ['PAGE-home', 'PAGE-mine', 'PAGE-records'],
  flow_ids: ['FLOW-sidebar-mine', 'FLOW-sidebar-baby', 'FLOW-records-profile-mine'],
  state_ids: ['STATE-home-sidebar-open', 'STATE-mine-normal', 'STATE-sidebar-baby-profile'],
  test_ids: ['T24-my-baby', 'T24-mine-route']
});
design.mapping.push({
  requirement_id: 'R24-03', page_ids: ['PAGE-home', 'PAGE-records'],
  flow_ids: ['FLOW-sidebar-records', 'FLOW-sidebar-cry', 'FLOW-sidebar-poop', 'FLOW-sidebar-task-conflict'],
  state_ids: ['STATE-home-sidebar-open', 'STATE-records-normal', 'STATE-task-ready'],
  test_ids: ['T24-service-ranking', 'T24-service-task', 'T24-cry-route', 'T24-poop-route', 'T24-visual-variants']
});

design.pending_decisions.push({
  id: 'PD-left-sidebar-24-freeze',
  question: '左侧照护空间与推荐服务导航已形成可审阅候选，待用户查看后决定是否冻结。',
  blocks_design: false, status: 'open'
});
design.implementation.change_scope = 'delivery-review/left-sidebar-24/DELIVERY.md';
design.implementation.evidence_directory = 'delivery-review/left-sidebar-24';
design.implementation.previous_snapshot = '../versions/conversation-shortcuts-23';
design.implementation.scope = 'R24 首页左上入口改为应用内横向侧栏；我的与宝宝置顶，三项首次录入推荐服务按保存的关注点排序并复用已有页面或任务。';
addIds(design.implementation, 'main_files', ['assets/sidebar-24.css']);

fs.writeFileSync(file, JSON.stringify(design, null, 2) + '\n', 'utf8');
console.log('Updated design.json to candidate 24');
