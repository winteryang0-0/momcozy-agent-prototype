const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'design.json');
const design = JSON.parse(fs.readFileSync(file, 'utf8'));
if (design.project.revision !== 'conversation-care-cards-20') {
  throw new Error('Expected conversation-care-cards-20 candidate');
}

const actions = design.framework.actions;
const flows = design.framework.flows;
const action = id => {
  const result = actions.find(item => item.id === id);
  if (!result) throw new Error(`Missing action ${id}`);
  return result;
};
const flow = id => {
  const result = flows.find(item => item.id === id);
  if (!result) throw new Error(`Missing flow ${id}`);
  return result;
};
function addAction(id, event, from, to) {
  if (actions.some(item => item.id === id)) return;
  actions.push({
    id,
    control_id: 'CHAT-task',
    event,
    target_page_id: 'PAGE-home',
    from_state: from,
    to_state: to,
    requirement_ids: ['R20-04']
  });
}
function insertAfter(ids, after, added) {
  if (ids.includes(added)) return;
  const index = ids.indexOf(after);
  if (index < 0) throw new Error(`Missing flow action ${after}`);
  ids.splice(index + 1, 0, added);
}

action('ACT-task-capture').event = 'click-direct-browser-microphone';
action('ACT-task-finish-cry').to_state = 'STATE-task-finishing';
action('ACT-task-camera-start').from_state = 'STATE-task-camera';
action('ACT-task-capture-retry').to_state = 'STATE-task-starting';

addAction('ACT-task-audio-ready', 'browser-recorder-stopped', 'STATE-task-finishing', 'STATE-task-captured');
addAction('ACT-task-photo-capture', 'click-direct-browser-camera', 'STATE-task-ready', 'STATE-task-camera');
addAction('ACT-task-photo-error', 'browser-camera-error', 'STATE-task-camera', 'STATE-task-capture-error');
addAction('ACT-task-photo-retry', 'click-direct-browser-camera', 'STATE-task-capture-error', 'STATE-task-camera');

for (const id of ['FLOW-task', 'FLOW-task-recover']) {
  insertAfter(flow(id).action_ids, 'ACT-task-finish-cry', 'ACT-task-audio-ready');
}
const photo = flow('FLOW-photo-task');
photo.action_ids = photo.action_ids.map(id => id === 'ACT-task-capture' ? 'ACT-task-photo-capture' : id);
if (!flows.some(item => item.id === 'FLOW-photo-device-error')) {
  flows.push({
    id: 'FLOW-photo-device-error',
    description: '相机被拒绝或不可用后直接重试取景',
    requirement_ids: ['R20-04'],
    action_ids: ['ACT-task-photo-capture', 'ACT-task-photo-error', 'ACT-task-photo-retry']
  });
}

const captureMap = design.mapping.find(item => item.requirement_id === 'R20-04');
if (!captureMap.flow_ids.includes('FLOW-photo-device-error')) captureMap.flow_ids.push('FLOW-photo-device-error');
if (!captureMap.state_ids.includes('STATE-task-camera')) captureMap.state_ids.push('STATE-task-camera');
if (!captureMap.state_ids.includes('STATE-task-finishing')) captureMap.state_ids.push('STATE-task-finishing');

if (!design.tests.some(item => item.id === 'T20-photo-device-error')) {
  design.tests.push({
    id: 'T20-photo-device-error',
    flow_id: 'FLOW-photo-device-error',
    state_ids: ['STATE-task-camera', 'STATE-task-capture-error', 'STATE-task-camera-ready'],
    steps: ['打开看便便相机，拒绝浏览器设备请求，点击重新拍照；再次允许后检查取景和取消。'],
    expected: '拒绝后保留同一卡片，重试直接请求相机；取消后释放媒体流且不保存照片。',
    requirement_ids: ['R20-04'],
    status: 'acceptance-description-see-runtime-evidence'
  });
}
if (!captureMap.test_ids.includes('T20-photo-device-error')) captureMap.test_ids.push('T20-photo-device-error');

// New captures do not produce an automated interpretation. Keep the legacy
// result renderer in app.js for older saved conversations, but remove its
// unreachable current-flow action and state from the candidate ledger.
const oldResultAction = actions.findIndex(item => item.id === 'ACT-task-result');
if (oldResultAction >= 0) actions.splice(oldResultAction, 1);
const oldResultState = design.framework.states.findIndex(item => item.id === 'STATE-task-result');
if (oldResultState >= 0) design.framework.states.splice(oldResultState, 1);
for (const row of [...design.mapping, ...design.tests]) {
  if (!Array.isArray(row.state_ids)) continue;
  row.state_ids = [...new Set(row.state_ids.map(id => id === 'STATE-task-result' ? 'STATE-task-recoverable' : id))];
}
const supersededCare = design.source.superseded.find(item => item.id === 'R14-H06');
if (supersededCare) supersededCare.scope = 'R20-03/04 取代旧应用内权限确认、示例采集和未接入接口的自动分析结果；会话入口与时间线保留。';

design.limitations = design.limitations.map(text => text.includes('原型未接入真实模型、采集、上传')
  ? '原型已调用浏览器麦克风和相机采集当前会话素材；未接入真实 AI 识别、上传、账户或云同步。浏览器系统权限仍由浏览器和操作系统控制。'
  : text);

fs.writeFileSync(file, JSON.stringify(design, null, 2) + '\n', 'utf8');
console.log('Finalized R20 candidate state and flow map');
