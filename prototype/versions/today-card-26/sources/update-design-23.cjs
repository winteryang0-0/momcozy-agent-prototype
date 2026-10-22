const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'design.json');
const design = JSON.parse(fs.readFileSync(file, 'utf8'));
if (design.project.revision !== 'secondary-sheet-motion-22') throw new Error('Unexpected source revision');

const requirementPath = path.join(__dirname, 'conversation-shortcuts-23-requirements.json');
const requirements = JSON.parse(fs.readFileSync(requirementPath, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ids = requirements.changes.map(change => change.id);
const addIds = (item, key, values) => { item[key] = [...new Set([...(item[key] || []), ...values])]; };
const get = (group, id) => {
  const item = design.framework[group].find(row => row.id === id);
  if (!item) throw new Error('Missing ' + group + ': ' + id);
  return item;
};

design.project.revision = 'conversation-shortcuts-23';
design.project.release_label = '莓色留白 · 常驻照护入口候选；未冻结';
design.source.candidate_history = [...(design.source.candidate_history || []), design.source.previous_candidate];
design.source.previous_candidate = {
  path: design.source.path,
  sha256: design.source.sha256,
  requirements: design.source.requirements
};
design.source.path = 'sources/conversation-shortcuts-23-requirements.json';
design.source.sha256 = sha(requirementPath);
addIds(design.source, 'requirements', ids);

design.framework.revision = 'HOME-1.1-conversation-shortcuts-23-candidate';
design.system.revision = 'CS-0.5-berry-poise-conversation-shortcuts-23-candidate';
get('pages', 'PAGE-home').regions = [
  'journal-and-sound-header',
  'welcome-companion',
  'today-smart-reminders',
  'compact-expandable-today',
  'conversation-timeline',
  'persistent-care-shortcuts',
  'single-line-composer'
];
const care = get('controls', 'CHAT-care');
care.component_id = 'CMP-care-shortcuts';
care.role = '位于输入框上方且始终可见的三项会话照护入口；按原任务互斥与恢复规则启动';
design.system.components.push({
  id: 'CMP-care-shortcuts',
  states: ['default', 'focus', 'active-task', 'dark', 'reduced-motion'],
  token_refs: ['--surface', '--divider', '--action', '--task-crying-bg', '--task-crying-ink', '--task-diaper-bg', '--task-diaper-ink'],
  layout: { columns: 3, order: ['record', 'cry', 'poop'], row_height: '29px', default_composer_height: '58px' }
});

for (const id of ['ACT-task-start', 'ACT-inline-open']) {
  const action = get('actions', id);
  action.event = 'click-persistent-shortcut-or-keyword';
  addIds(action, 'requirement_ids', ['R23-03']);
}
for (const id of ['FLOW-task', 'FLOW-photo-task', 'FLOW-inline-record']) {
  addIds(get('flows', id), 'requirement_ids', ['R23-03']);
}

const action = (id, event, from_state, to_state) => design.framework.actions.push({
  id, control_id: 'CHAT-care', event, target_page_id: 'PAGE-home', from_state, to_state,
  requirement_ids: ['R23-03']
});
action('ACT-shortcut-record-welcome', 'click-record', 'STATE-assistant-welcome', 'STATE-chat-record-picker');
action('ACT-shortcut-task-welcome', 'click-cry-or-photo', 'STATE-assistant-welcome', 'STATE-task-ready');
action('ACT-shortcut-record-busy', 'click-other-while-record-open', 'STATE-chat-record-picker', 'STATE-chat-record-picker');
action('ACT-shortcut-task-busy', 'click-other-while-task-ready', 'STATE-task-ready', 'STATE-task-ready');
action('ACT-shortcut-error-busy', 'click-other-while-capture-error', 'STATE-task-capture-error', 'STATE-task-capture-error');

const flow = (id, description, action_ids) => design.framework.flows.push({
  id, description, requirement_ids: ['R23-03'], action_ids
});
flow('FLOW-shortcut-record-welcome', '常驻记一笔→类型→填写→保存→回执',
  ['ACT-shortcut-record-welcome', 'ACT-inline-type', 'ACT-inline-submit', 'ACT-inline-success']);
flow('FLOW-shortcut-cry-welcome', '常驻听哭闹→直接启动麦克风→设备拒绝反馈',
  ['ACT-shortcut-task-welcome', 'ACT-task-capture', 'ACT-task-capture-error']);
flow('FLOW-shortcut-photo-welcome', '常驻看便便→直接启动相机→设备拒绝反馈',
  ['ACT-shortcut-task-welcome', 'ACT-task-photo-capture', 'ACT-task-photo-error']);
flow('FLOW-shortcut-record-busy', '记录类型选择期间保留当前任务并提示', ['ACT-shortcut-record-busy']);
flow('FLOW-shortcut-task-busy', '照护任务准备期间保留当前任务并提示', ['ACT-shortcut-task-busy']);
flow('FLOW-shortcut-error-busy', '采集失败待恢复期间保留当前任务并提示', ['ACT-shortcut-error-busy']);

design.mapping.push({
  requirement_id: 'R23-01', page_ids: ['PAGE-home'],
  flow_ids: ['FLOW-task', 'FLOW-inline-record', 'FLOW-photo-task'],
  state_ids: ['STATE-assistant-welcome', 'STATE-assistant-chat', 'STATE-chat-record-success', 'STATE-task-capture-error'],
  test_ids: ['T23-no-repeat']
});
design.mapping.push({
  requirement_id: 'R23-02', page_ids: ['PAGE-home'],
  flow_ids: ['FLOW-shortcut-record-welcome'],
  state_ids: ['STATE-assistant-welcome', 'STATE-assistant-chat', 'STATE-chat-record-picker'],
  test_ids: ['T23-row']
});
design.mapping.push({
  requirement_id: 'R23-03', page_ids: ['PAGE-home'],
  flow_ids: ['FLOW-shortcut-record-welcome', 'FLOW-shortcut-cry-welcome', 'FLOW-shortcut-photo-welcome',
    'FLOW-shortcut-record-busy', 'FLOW-shortcut-task-busy', 'FLOW-shortcut-error-busy'],
  state_ids: ['STATE-assistant-welcome', 'STATE-chat-record-picker', 'STATE-chat-record-success',
    'STATE-task-ready', 'STATE-task-capture-error'],
  test_ids: ['T23-record', 'T23-cry', 'T23-photo', 'T23-record-busy', 'T23-task-busy', 'T23-error-busy']
});

const test = (id, flow_id, state_ids, steps, expected, requirement_ids) => design.tests.push({
  id, flow_id, state_ids, steps, expected, requirement_ids,
  status: 'acceptance-description-see-runtime-evidence'
});
test('T23-no-repeat', 'FLOW-task',
  ['STATE-assistant-welcome', 'STATE-assistant-chat', 'STATE-chat-record-success', 'STATE-task-capture-error'],
  ['连续发送三条消息，完成一笔会话记录，再打开听哭闹与看便便；检查欢迎区、AI 回复及任务卡片。'],
  '会话内不重复渲染三项功能入口；任务卡片仍有自身操作与状态反馈。', ['R23-01']);
test('T23-row', 'FLOW-shortcut-record-welcome',
  ['STATE-assistant-welcome', 'STATE-assistant-chat', 'STATE-chat-record-picker'],
  ['在 390×844 浅色、360×640 深色及减少动态效果中检查输入框上方常驻入口；键盘聚焦并切换；分别以单文件及模块版 file:// 打开。'],
  '三按钮同一横排且顺序固定；高 29px、默认输入框高 58px；可见焦点、无横向溢出，欢迎与任务状态保持可用。', ['R23-02']);
test('T23-record', 'FLOW-shortcut-record-welcome',
  ['STATE-assistant-welcome', 'STATE-chat-record-picker', 'STATE-chat-record-editing', 'STATE-chat-record-saving', 'STATE-chat-record-success'],
  ['从欢迎页点击常驻记一笔，选择亲喂，输入 12 分钟并保存；刷新后检查回执与照护记录。'],
  '保持原有独立会话草稿、保存与回执；只新增一条记录。', ['R23-03']);
test('T23-cry', 'FLOW-shortcut-cry-welcome',
  ['STATE-assistant-welcome', 'STATE-task-ready', 'STATE-task-starting', 'STATE-task-capture-error'],
  ['从欢迎页点击常驻听哭闹并启动收音；拒绝麦克风后查看反馈与重试入口。'],
  '继续直接请求浏览器麦克风，失败保留当前卡片及重试动作。', ['R23-03']);
test('T23-photo', 'FLOW-shortcut-photo-welcome',
  ['STATE-assistant-welcome', 'STATE-task-ready', 'STATE-task-camera', 'STATE-task-capture-error'],
  ['从欢迎页点击常驻看便便并启动拍照；拒绝相机后查看反馈、重试与选择照片。'],
  '继续直接请求浏览器相机，失败保留当前卡片及恢复动作。', ['R23-03']);
test('T23-record-busy', 'FLOW-shortcut-record-busy', ['STATE-chat-record-picker'],
  ['在记一笔类型选择期间点击听哭闹。'],
  '提示先完成或取消当前任务，记录卡片和未保存内容不丢失。', ['R23-03']);
test('T23-task-busy', 'FLOW-shortcut-task-busy', ['STATE-task-ready'],
  ['在听哭闹待开始时点击看便便。'],
  '提示先完成或取消当前任务，听哭闹卡片保持当前状态。', ['R23-03']);
test('T23-error-busy', 'FLOW-shortcut-error-busy', ['STATE-task-capture-error'],
  ['听哭闹采集失败后点击看便便，再取消听哭闹并重新点击看便便。'],
  '失败待恢复时不覆盖当前卡片；取消后可开始看便便。', ['R23-03']);

design.pending_decisions.push({
  id: 'PD-conversation-shortcuts-23-freeze',
  question: '常驻照护入口与会话卡片精简已形成可审阅候选，待用户查看后决定是否冻结。',
  blocks_design: false,
  status: 'open'
});
design.implementation.change_scope = 'delivery-review/conversation-shortcuts-23/DELIVERY.md';
design.implementation.evidence_directory = 'delivery-review/conversation-shortcuts-23';
design.implementation.previous_snapshot = '../versions/secondary-sheet-motion-22';
design.implementation.scope = 'R23 三项照护入口改为输入框上方 29px 常驻横排；移除消息与任务卡片内重复建议入口；保留原任务流程和页面路由。';
addIds(design.implementation, 'main_files', ['assets/care-shortcuts-23.css']);

fs.writeFileSync(file, JSON.stringify(design, null, 2) + '\n', 'utf8');
console.log('Updated design.json to candidate 23');
