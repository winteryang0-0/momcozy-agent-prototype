const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const source = 'source/requirements.json';
const requirements = JSON.parse(fs.readFileSync(path.join(root, source), 'utf8')).requirements;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/styles.css'), 'utf8');
const pageNames = ['identity', 'details', 'concerns', 'recommendations', 'paused', 'complete'];
const pages = pageNames.map(name => ({
  id: 'PAGE-' + name,
  route: '#/' + name,
  parent_id: null,
  regions: name === 'paused' || name === 'complete'
    ? ['progress', 'result', 'actions']
    : ['progress', 'storage-feedback', 'heading', 'content', 'actions']
}));
const controls = [...new Set([...html.matchAll(/data-control-id="(CTRL-[^"]+)"/g)].map(match => match[1]))].map(id => ({
  id,
  page_id: /^CTRL-(?:later|retry-save|next|back)-/.test(id) ? 'PAGE-' + id.split('-').at(-1) :
    /^CTRL-(?:role|stage)/.test(id) ? 'PAGE-identity' :
    /^CTRL-(?:age|parity|fetus|pregnancy|baby|birth)/.test(id) ? 'PAGE-details' :
    /^CTRL-concern-/.test(id) ? 'PAGE-concerns' :
    /^CTRL-(?:resume|first-step)/.test(id) ? 'PAGE-paused' : 'PAGE-complete',
  component_id: /role|concern/.test(id) ? 'select-card' :
    /^(CTRL-age|CTRL-parity|CTRL-fetus|CTRL-pregnancy|CTRL-baby-count|CTRL-birth)/.test(id) ? 'form-field' :
    'action-button',
  role: id.slice(5).replaceAll('-', ' ')
}));
const states = pageNames.map(name => ({
  id: 'STATE-' + name,
  page_id: 'PAGE-' + name,
  kind: name === 'paused' || name === 'complete' ? 'other' : 'normal'
}));
states.push(
  { id: 'STATE-identity-error', page_id: 'PAGE-identity', kind: 'error' },
  { id: 'STATE-validation-error', page_id: 'PAGE-details', kind: 'error' },
  { id: 'STATE-finish-error', page_id: 'PAGE-recommendations', kind: 'error' },
  ...pageNames.slice(0, 4).map(name => ({ id: 'STATE-storage-error-' + name, page_id: 'PAGE-' + name, kind: 'error' }))
);
const actionSpecs = [
  ['select-role', 'role-mother', 'click', 'identity', 'identity', 'identity'],
  ['identity-next', 'next-identity', 'click', 'details', 'identity', 'details'],
  ['details-next', 'next-details', 'click', 'concerns', 'details', 'concerns'],
  ['concerns-next', 'next-concerns', 'click', 'recommendations', 'concerns', 'recommendations'],
  ['finish', 'next-recommendations', 'click', 'complete', 'recommendations', 'complete'],
  ['back-details', 'back-details', 'click', 'identity', 'details', 'identity'],
  ['back-concerns', 'back-concerns', 'click', 'details', 'concerns', 'details'],
  ['back-recommendations', 'back-recommendations', 'click', 'concerns', 'recommendations', 'concerns'],
  ...pageNames.slice(0, 4).map(name => ['pause-' + name, 'later-' + name, 'click', 'paused', name, 'paused']),
  ['resume', 'resume', 'click', 'recommendations', 'paused', 'recommendations'],
  ['review-first', 'first-step', 'click', 'identity', 'paused', 'identity'],
  ['edit', 'edit-profile', 'click', 'identity', 'complete', 'identity'],
  ...pageNames.slice(0, 4).map(name => ['retry-' + name, 'retry-save-' + name, 'click', name, 'storage-error-' + name, name])
];
const actions = actionSpecs.map(([name, control, event, page, from, to]) => ({
  id: 'ACTION-' + name,
  control_id: 'CTRL-' + control,
  event,
  target_page_id: 'PAGE-' + page,
  from_state: 'STATE-' + from,
  to_state: 'STATE-' + to
}));
const flows = [
  {
    id: 'FLOW-finish',
    requirement_ids: ['OB-01', 'OB-02', 'OB-03', 'OB-04', 'OB-05'],
    action_ids: ['select-role', 'identity-next', 'details-next', 'concerns-next', 'finish'].map(id => 'ACTION-' + id)
  },
  {
    id: 'FLOW-pause-resume',
    requirement_ids: ['OB-05'],
    action_ids: ['pause-recommendations', 'resume'].map(id => 'ACTION-' + id)
  },
  {
    id: 'FLOW-edit',
    requirement_ids: ['OB-05'],
    action_ids: ['edit', 'identity-next', 'details-next', 'concerns-next', 'finish'].map(id => 'ACTION-' + id)
  },
  {
    id: 'FLOW-correct',
    requirement_ids: ['OB-05'],
    action_ids: ['back-recommendations', 'back-concerns', 'back-details'].map(id => 'ACTION-' + id)
  },
  ...pageNames.slice(0, 4).map(name => ({
    id: 'FLOW-retry-' + name,
    requirement_ids: ['OB-07'],
    action_ids: ['retry-' + name].map(id => 'ACTION-' + id)
  }))
];
const tokenBody = css.match(/:root\s*\{([^}]+)\}/)?.[1] || '';
const tokens = Object.fromEntries([...tokenBody.matchAll(/(--[a-z][a-z0-9-]*)\s*:\s*([^;]+);/g)].map(match => [match[1], match[2].trim()]));
const design = {
  schema_version: '1.0',
  project: {
    id: 'MOMCOZY-ONBOARDING-REBUILD-01',
    mode: 'simulation',
    stage: 'draft',
    designer: '/root'
  },
  source: {
    path: source,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, source))).digest('hex'),
    requirements: requirements.map(requirement => requirement.id)
  },
  framework: {
    revision: 'ONBOARDING-REBUILD-CANDIDATE-01',
    pages, controls, actions, states, flows,
    viewports: [
      { id: 'mobile', width: 390, height: 844 },
      { id: 'small-mobile', width: 360, height: 640 },
      { id: 'desktop', width: 1440, height: 900 }
    ]
  },
  system: {
    revision: 'BERRY-POISE-ONBOARDING-CANDIDATE-01',
    tokens,
    components: [
      { id: 'select-card', states: ['default', 'selected', 'focus'], token_refs: ['--surface', '--neutral', '--action', '--focus'] },
      { id: 'form-field', states: ['empty', 'filled', 'invalid', 'focus'], token_refs: ['--surface-soft', '--line-strong', '--error', '--focus'] },
      { id: 'action-button', states: ['default', 'press', 'focus'], token_refs: ['--action', '--on-action', '--focus'] }
    ]
  },
  mapping: [
    { requirement_id: 'OB-01', page_ids: ['PAGE-identity', 'PAGE-details', 'PAGE-concerns', 'PAGE-recommendations'], flow_ids: ['FLOW-finish'], state_ids: ['STATE-identity', 'STATE-details', 'STATE-concerns', 'STATE-recommendations'] },
    { requirement_id: 'OB-02', page_ids: ['PAGE-identity'], flow_ids: ['FLOW-finish'], state_ids: ['STATE-identity'] },
    { requirement_id: 'OB-03', page_ids: ['PAGE-details'], flow_ids: ['FLOW-finish'], state_ids: ['STATE-details', 'STATE-validation-error'] },
    { requirement_id: 'OB-04', page_ids: ['PAGE-concerns', 'PAGE-recommendations'], flow_ids: ['FLOW-finish'], state_ids: ['STATE-concerns', 'STATE-recommendations'] },
    { requirement_id: 'OB-05', page_ids: pages.map(page => page.id), flow_ids: ['FLOW-finish', 'FLOW-pause-resume', 'FLOW-edit', 'FLOW-correct'], state_ids: states.map(state => state.id) },
    { requirement_id: 'OB-06', page_ids: pages.map(page => page.id), flow_ids: ['FLOW-finish'], state_ids: states.map(state => state.id) },
    { requirement_id: 'OB-07', page_ids: pages.slice(0, 4).map(page => page.id), flow_ids: ['FLOW-finish', ...pageNames.slice(0, 4).map(name => 'FLOW-retry-' + name)], state_ids: states.filter(state => state.id.startsWith('STATE-storage-error-') || state.id === 'STATE-finish-error').map(state => state.id) }
  ],
  pending_decisions: [
    { id: 'D-01', question: '是否确认此独立 onboarding 的页面框架、字段控件和莓色留白设计规范？', blocks_design: true, status: 'open' },
    { id: 'D-02', question: '完成后的正式承接页是否保留独立结果页，或未来再接回主原型？', blocks_design: false, status: 'open' }
  ],
  tests: [
    { id: 'T-01', flow_id: 'FLOW-finish', state_ids: ['STATE-identity', 'STATE-details', 'STATE-concerns', 'STATE-recommendations', 'STATE-complete'], steps: '选身份，填资料与关注，查看排序，完成保存', expected: '四步连贯且完成页显示持久化资料' },
    { id: 'T-02', flow_id: 'FLOW-pause-resume', state_ids: ['STATE-paused'], steps: '暂停、刷新、继续', expected: '返回原步骤及草稿' },
    { id: 'T-03', flow_id: 'FLOW-edit', state_ids: ['STATE-identity', 'STATE-details'], steps: '完成后修改资料', expected: '保留原值且可重新完成' },
    { id: 'T-04', flow_id: 'FLOW-finish', state_ids: ['STATE-validation-error'], steps: '注入超范围数值或未来出生日期', expected: '阻止推进并指出字段' },
    { id: 'T-05', flow_id: 'FLOW-finish', state_ids: ['STATE-finish-error', ...pageNames.slice(0, 4).map(name => 'STATE-storage-error-' + name)], steps: '模拟 localStorage 写入失败，在四步查看提示并尝试完成', expected: '显示失败，不显示完成' },
    { id: 'T-06', flow_id: 'FLOW-correct', state_ids: ['STATE-identity-error'], steps: '从推荐页逐步返回身份页；另在全新身份页无选择时点继续', expected: '正确回到前一步并提示必选身份' },
    ...pageNames.slice(0, 4).map(name => ({ id: 'T-retry-' + name, flow_id: 'FLOW-retry-' + name, state_ids: ['STATE-storage-error-' + name], steps: '在' + name + '页模拟存储失败并点击重试', expected: '存储恢复时重试成功；否则继续显示风险提示' }))
  ]
};
fs.writeFileSync(path.join(root, 'design.json'), JSON.stringify(design, null, 2) + '\n');
console.log('wrote design.json with ' + controls.length + ' controls and ' + Object.keys(tokens).length + ' tokens');
