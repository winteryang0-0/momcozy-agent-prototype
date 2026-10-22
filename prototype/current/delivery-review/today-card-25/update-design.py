import json
import hashlib
from copy import deepcopy
from pathlib import Path

root = Path(__file__).resolve().parents[2]
target = root / 'design.json'
data = json.loads(target.read_text(encoding='utf-8'))
assert data['project']['revision'] == 'left-sidebar-24'
source = data['source']
prior = {key: deepcopy(source[key]) for key in ('path', 'sha256', 'requirements')}
older = deepcopy(source['previous_candidate'])
if not any(item['path'] == older['path'] for item in source['candidate_history']):
    source['candidate_history'].append(older)
source['previous_candidate'] = prior
new_source = Path('sources/today-conversation-25-requirements.json')
source['path'] = new_source.as_posix()
source['sha256'] = hashlib.sha256((root / new_source).read_bytes()).hexdigest()
source['requirements'] = prior['requirements'] + ['R25-01', 'R25-02', 'R25-03']
source['superseded'] += [
    {'id': 'R23-03', 'scope': '仅替换进行中任务阻止再次触发的互斥规则；常驻入口、草稿、采集和取消继续保留。'},
    {'id': 'R24-03', 'scope': '仅替换侧栏智能体服务沿用任务互斥的规则；服务排序、入口和页面复用继续保留。'}
]

data['project']['revision'] = 'today-conversation-25'
data['project']['release_label'] = '莓色留白 · Today 与连续任务候选 25；未冻结'
framework = data['framework']
framework['revision'] = 'HOME-1.1-today-conversation-25-candidate'
data['system']['revision'] = 'CS-0.5-berry-poise-today-conversation-25-candidate'
for component in data['system']['components']:
    additions = {
        'CMP-task': ['paused', 'historical', 'transferred'],
        'CMP-record': ['paused', 'background-saving', 'unknown', 'transferred'],
        'CMP-advice': ['floating-reflow']
    }.get(component['id'], [])
    component['states'] = list(dict.fromkeys(component['states'] + additions))
framework['controls'].append({
    'id': 'HOME-today-expanded', 'page_id': 'PAGE-home',
    'component_id': 'CMP-advice',
    'role': '对话后展开的单层 Today 智能提醒，可切换提示并查看依据'
})

action_renames = {
    'ACT-shortcut-record-busy': 'ACT-shortcut-record-switch',
    'ACT-shortcut-task-busy': 'ACT-shortcut-task-repeat',
    'ACT-shortcut-error-busy': 'ACT-shortcut-error-switch',
    'ACT-sidebar-task-busy': 'ACT-sidebar-task-switch'
}
flow_renames = {
    'FLOW-shortcut-record-busy': 'FLOW-shortcut-record-switch',
    'FLOW-shortcut-task-busy': 'FLOW-shortcut-task-repeat',
    'FLOW-shortcut-error-busy': 'FLOW-shortcut-error-switch',
    'FLOW-sidebar-task-conflict': 'FLOW-sidebar-task-switch'
}
for action in framework['actions']:
    action['id'] = action_renames.get(action['id'], action['id'])
for flow in framework['flows']:
    flow['id'] = flow_renames.get(flow['id'], flow['id'])
    flow['action_ids'] = [action_renames.get(value, value) for value in flow['action_ids']]
for item in data['mapping']:
    item['flow_ids'] = [flow_renames.get(value, value) for value in item['flow_ids']]
for test in data['tests']:
    test['flow_id'] = flow_renames.get(test['flow_id'], test['flow_id'])

def action(id):
    return next(value for value in framework['actions'] if value['id'] == id)

for id, event, to_state in [
    ('ACT-shortcut-record-switch', 'click-new-task-while-record-open', 'STATE-task-ready'),
    ('ACT-shortcut-task-repeat', 'click-same-or-other-task-again', 'STATE-task-ready'),
    ('ACT-shortcut-error-switch', 'click-new-task-after-capture-error', 'STATE-task-ready'),
    ('ACT-sidebar-task-switch', 'click-new-service-while-task-active', 'STATE-task-ready')
]:
    item = action(id)
    item['event'] = event
    item['to_state'] = to_state
    item['requirement_ids'] = list(dict.fromkeys(item.get('requirement_ids', []) + ['R25-02']))

for id, description in [
    ('FLOW-shortcut-record-switch', '未完成记录卡暂停并保留草稿，新任务获得独立卡片'),
    ('FLOW-shortcut-task-repeat', '同类或跨类再次触发获得新任务 ID，上一卡片暂停'),
    ('FLOW-shortcut-error-switch', '采集失败卡片留在对话中，下一任务照常开始'),
    ('FLOW-sidebar-task-switch', '侧栏新服务在旧任务未结束时仍可开启独立任务卡')
]:
    item = next(value for value in framework['flows'] if value['id'] == id)
    item['description'] = description
    item['requirement_ids'] = list(dict.fromkeys(item.get('requirement_ids', []) + ['R25-02']))

def add_action(id, control, event, from_state, to_state, requirements):
    framework['actions'].append({
        'id': id, 'control_id': control, 'event': event,
        'target_page_id': 'PAGE-home', 'from_state': from_state,
        'to_state': to_state, 'requirement_ids': requirements
    })

add_action('ACT-advice-next-expanded', 'HOME-today-expanded', 'click-swipe-or-arrow',
           'STATE-home-advice-expanded', 'STATE-home-advice-expanded', ['R25-01'])
add_action('ACT-advice-detail-expanded', 'HOME-today-expanded', 'click-basis',
           'STATE-home-advice-expanded', 'STATE-home-advice-expanded', ['R25-01'])
add_action('ACT-task-switch-capturing', 'CHAT-care', 'click-new-while-capturing',
           'STATE-task-listening', 'STATE-task-ready', ['R25-02'])
add_action('ACT-record-save-then-new-task', 'CHAT-care', 'click-new-while-record-saving',
           'STATE-chat-record-saving', 'STATE-task-ready', ['R25-02', 'R25-03'])
add_action('ACT-record-background-finish', 'CHAT-record', 'resolve-original-save-on-historical-card',
           'STATE-task-ready', 'STATE-task-ready', ['R25-03'])
add_action('ACT-record-historical-check', 'CHAT-record', 'check-original-request-on-historical-card',
           'STATE-task-ready', 'STATE-task-ready', ['R25-03'])
add_action('ACT-record-resume-history', 'CHAT-record', 'click-resume-old-draft',
           'STATE-chat-record-recoverable', 'STATE-chat-record-editing', ['R25-02', 'R25-03'])
add_action('ACT-task-resume-history', 'CHAT-task', 'click-resume-old-media-task',
           'STATE-task-recoverable', 'STATE-task-ready', ['R25-02'])
add_action('ACT-chat-skip-stale-intent', 'CHAT-input', 'older-intent-after-newer-trigger',
           'STATE-assistant-chat', 'STATE-assistant-chat', ['R25-02'])

def add_flow(id, description, requirements, actions):
    framework['flows'].append({
        'id': id, 'description': description,
        'requirement_ids': requirements, 'action_ids': actions
    })

add_flow('FLOW-today-expanded-reflow', '对话后展开 Today，标题只出现一次，切换提醒并查看依据后收起',
         ['R25-01'], ['ACT-advice-expand', 'ACT-advice-next-expanded',
                       'ACT-advice-detail-expanded', 'ACT-advice-collapse'])
add_flow('FLOW-task-switch-capturing', '媒体采集中开启下一任务，旧采集停止并可重新承接',
         ['R25-02'], ['ACT-task-switch-capturing'])
add_flow('FLOW-record-background-save', '记录保存过程中开启其他任务，原请求仍向旧卡回执',
         ['R25-02', 'R25-03'], ['ACT-inline-submit', 'ACT-record-save-then-new-task',
                               'ACT-record-background-finish'])
add_flow('FLOW-record-check-history', '保存结果不明后沿原请求核对历史卡',
         ['R25-03'], ['ACT-inline-submit', 'ACT-record-save-then-new-task',
                      'ACT-record-historical-check'])
add_flow('FLOW-record-resume-history', '旧草稿恢复到承接卡并停止来源卡再次提交',
         ['R25-02', 'R25-03'], ['ACT-record-resume-history'])
add_flow('FLOW-task-resume-history', '旧媒体任务恢复到新卡并提示重新采集',
         ['R25-02'], ['ACT-task-resume-history'])
add_flow('FLOW-chat-stale-intent', '迟到的文本意图不覆盖较新的明确任务触发',
         ['R25-02'], ['ACT-chat-skip-stale-intent'])

test_updates = {
    'T17-advice-restore': (
        ['发送消息使 Today 收起；点开悬浮卡；切换提醒并查看依据；再次收起。'],
        '展开态只在内容区显示一次提醒标题；切换及依据可操作，收起后保持已选提醒。',
        ['R25-01']),
    'T23-record-busy': (
        ['在记一笔类型选择或编辑期间点击听哭闹。'],
        '新建哭闹任务卡，旧记录卡暂停且草稿保留；旧卡可恢复到承接卡。',
        ['R25-02']),
    'T23-task-busy': (
        ['在听哭闹待开始时再次点击听哭闹，再点击看便便。'],
        '每次触发产生不同任务 ID；前卡暂停并保留在原对话顺序中。',
        ['R25-02']),
    'T23-error-busy': (
        ['听哭闹采集失败后点击看便便，再从旧卡继续。'],
        '便便任务立即开启；旧卡可恢复，来源卡不重复提交。',
        ['R25-02']),
    'T24-service-task': (
        ['从侧栏进入哭声服务，未结束时再从侧栏进入便便服务。'],
        '新建便便任务卡；旧哭声卡暂停，可从原卡继续，侧栏不拦截。',
        ['R25-02'])
}
for id, (steps, expected, requirements) in test_updates.items():
    item = next(value for value in data['tests'] if value['id'] == id)
    item['steps'] = steps
    item['expected'] = expected
    item['requirement_ids'] = list(dict.fromkeys(item.get('requirement_ids', []) + requirements))

def add_test(id, flow, states, steps, expected, requirements):
    data['tests'].append({
        'id': id, 'flow_id': flow, 'state_ids': states,
        'steps': steps, 'expected': expected,
        'requirement_ids': requirements,
        'status': 'acceptance-description-see-runtime-evidence'
    })

add_test('T25-today-reflow', 'FLOW-today-expanded-reflow',
         ['STATE-assistant-chat', 'STATE-home-advice-expanded'],
         ['在对话后展开 Today、切换三条提醒、查看依据并收起；检查明亮与夜间短屏。'],
         '标题不重复，依据与切换可用，短屏不遮住输入框，无横向溢出。', ['R25-01'])
add_test('T25-task-repeat', 'FLOW-shortcut-task-repeat',
         ['STATE-task-ready', 'STATE-task-recoverable'],
         ['依次点击记一笔、听哭闹、听哭闹；观察对话卡片与任务 ID。'],
         '三张卡按时序保留；每次触发为新 ID，前卡暂停且不拦截下一任务。', ['R25-02'])
add_test('T25-media-switch', 'FLOW-task-switch-capturing',
         ['STATE-task-listening', 'STATE-task-ready', 'STATE-task-recoverable'],
         ['媒体授权等待、采集中或已拍照时开启另一任务，再恢复旧卡。'],
         '旧媒体释放，迟到回调不更改新卡；恢复旧任务需重新采集。', ['R25-02'])
add_test('T25-record-resume', 'FLOW-record-resume-history',
         ['STATE-chat-record-recoverable', 'STATE-chat-record-editing'],
         ['填写记录草稿后切卡，从旧卡恢复并保存，再返回来源卡。'],
         '草稿字段保留；来源卡指向承接卡，不能再次恢复或新增同一记录。',
         ['R25-02', 'R25-03'])
add_test('T25-save-background', 'FLOW-record-background-save',
         ['STATE-chat-record-saving', 'STATE-chat-record-success', 'STATE-task-ready'],
         ['保存中开启新任务并等待原请求回执。'],
         '旧卡显示保存过程和最终回执；当前新卡状态不变，记录只新增一次。',
         ['R25-03'])
add_test('T25-save-refresh-check', 'FLOW-record-check-history',
         ['STATE-chat-record-saving', 'STATE-chat-record-recoverable', 'STATE-chat-record-success'],
         ['保存中切卡后刷新；在历史卡核对并再次刷新。'],
         '结果未明时保留原请求与记录 ID，核对后只有一笔记录且回执可恢复。',
         ['R25-03'])
add_test('T25-late-intent', 'FLOW-chat-stale-intent',
         ['STATE-assistant-chat', 'STATE-task-ready'],
         ['输入听哭闹，在回复到达前手动开启看便便。'],
         '迟到回复不自动开启哭闹卡，最后明确触发的便便卡保持当前。',
         ['R25-02'])

data['mapping'] += [
    {'requirement_id': 'R25-01', 'page_ids': ['PAGE-home'],
     'flow_ids': ['FLOW-today-expanded-reflow'],
     'state_ids': ['STATE-assistant-chat', 'STATE-home-advice-expanded'],
     'test_ids': ['T17-advice-restore', 'T25-today-reflow']},
    {'requirement_id': 'R25-02', 'page_ids': ['PAGE-home'],
     'flow_ids': ['FLOW-shortcut-record-switch', 'FLOW-shortcut-task-repeat',
                  'FLOW-task-switch-capturing', 'FLOW-record-resume-history',
                  'FLOW-task-resume-history', 'FLOW-chat-stale-intent',
                  'FLOW-sidebar-task-switch'],
     'state_ids': ['STATE-chat-record-recoverable', 'STATE-task-ready',
                   'STATE-task-recoverable', 'STATE-task-listening'],
     'test_ids': ['T23-record-busy', 'T23-task-busy', 'T23-error-busy',
                  'T24-service-task', 'T25-task-repeat', 'T25-media-switch',
                  'T25-record-resume', 'T25-late-intent']},
    {'requirement_id': 'R25-03', 'page_ids': ['PAGE-home', 'PAGE-records'],
     'flow_ids': ['FLOW-record-background-save', 'FLOW-record-check-history',
                  'FLOW-record-resume-history'],
     'state_ids': ['STATE-chat-record-saving', 'STATE-chat-record-recoverable',
                   'STATE-chat-record-success'],
     'test_ids': ['T25-record-resume', 'T25-save-background',
                  'T25-save-refresh-check']}
]

data['pending_decisions'].append({
    'id': 'PD-today-conversation-25-freeze',
    'question': '请查看 R25 Today 展开卡和连续任务恢复行为后决定是否冻结。',
    'blocks_design': False, 'status': 'open'
})
implementation = data['implementation']
implementation['main_files'] = list(dict.fromkeys(
    implementation['main_files'] + ['assets/today-conversation-25.css']))
implementation['change_scope'] = 'delivery-review/today-card-25/DELIVERY.md'
implementation['evidence_directory'] = 'delivery-review/today-card-25'
implementation['previous_snapshot'] = '../versions/left-sidebar-24'
implementation['scope'] = 'R25 对话后 Today 提醒去重与紧凑重排；允许未结束任务的同类和跨类再次触发，并使草稿、媒体与保存请求按原任务归属恢复。'
data['limitations'].append(
    '保存核对在本地 HTML 中沿固定请求编号模拟；真实服务端幂等、跨设备结果查询和后台继续执行仍需接口定义。'
)

target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n',
                  encoding='utf-8')
print('Updated design.json to today-conversation-25')
