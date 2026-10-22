import hashlib
import json
from copy import deepcopy
from pathlib import Path

root = Path(__file__).resolve().parents[2]
target = root / 'design.json'
data = json.loads(target.read_text(encoding='utf-8'))
assert data['project']['revision'] == 'today-conversation-25'

source = data['source']
previous = {key: deepcopy(source[key]) for key in ('path', 'sha256', 'requirements')}
older = deepcopy(source['previous_candidate'])
if not any(item['path'] == older['path'] for item in source['candidate_history']):
    source['candidate_history'].append(older)
source['previous_candidate'] = previous
source_path = Path('sources/today-card-26-requirements.json')
source['path'] = source_path.as_posix()
source['sha256'] = hashlib.sha256((root / source_path).read_bytes()).hexdigest()
new_requirements = [f'R26-0{i}' for i in range(1, 5)]
source['requirements'] = previous['requirements'] + new_requirements
source['superseded'] += [
    {'id': 'R17-03', 'scope': '仅替换查看依据弹窗和左右箭头；三条提醒与切换职责保留，改为点选和循环滑动。'},
    {'id': 'R25-01', 'scope': '仅替换展开卡中的查看依据入口与左右箭头；单层标题、收起恢复和短屏布局保留。'},
]

data['project']['revision'] = 'today-card-26'
data['project']['release_label'] = '莓色留白 · Today 卡片微调候选 26；未冻结'
framework = data['framework']
framework['revision'] = 'HOME-1.1-today-card-26-candidate'
data['system']['revision'] = 'CS-0.5-berry-poise-today-card-26-candidate'
component = next(item for item in data['system']['components'] if item['id'] == 'CMP-advice')
component['states'] = list(dict.fromkeys(component['states'] + ['cyclic-pager']))
component['token_refs'] = list(dict.fromkeys(component['token_refs'] + ['--action']))

controls = {item['id']: item for item in framework['controls']}
controls['HOME-advice']['role'] = '欢迎态三条今日智能提醒，页码点底部居中，可点选或循环滑动；无依据弹窗及左右箭头'
controls['HOME-today-expanded']['role'] = '对话后展开的单层 Today 提醒，页码点底部居中，可点选或循环滑动；顶部可收起'

actions = {item['id']: item for item in framework['actions']}
actions['ACT-home-advice-review']['event'] = 'read-card-summary-without-modal'
actions['ACT-home-advice-review']['requirement_ids'] += ['R26-01']
actions['ACT-advice-next']['event'] = 'click-indicator-or-swipe-or-keyboard-wrap'
actions['ACT-advice-next']['requirement_ids'] += ['R26-02', 'R26-03', 'R26-04']
actions['ACT-advice-next-expanded']['event'] = 'click-indicator-or-swipe-or-keyboard-wrap'
actions['ACT-advice-next-expanded']['requirement_ids'] += ['R26-02', 'R26-03', 'R26-04']
for action_id in ('ACT-advice-expand', 'ACT-advice-collapse'):
    actions[action_id]['requirement_ids'] = list(dict.fromkeys(actions[action_id].get('requirement_ids', []) + ['R26-03']))
framework['actions'] = [item for item in framework['actions'] if item['id'] != 'ACT-advice-detail-expanded']

flows = {item['id']: item for item in framework['flows']}
flows['FLOW-advice-switch']['description'] = '欢迎态 Today 卡的底部页码点选与三条提醒双向循环切换，无依据弹窗和左右箭头'
flows['FLOW-advice-switch']['requirement_ids'] += new_requirements
flows['FLOW-today-expanded-reflow']['description'] = '对话后展开单层 Today，底部页码点选或循环滑动，随后收起并保留当前页'
flows['FLOW-today-expanded-reflow']['requirement_ids'] += new_requirements
flows['FLOW-today-expanded-reflow']['action_ids'] = [item for item in flows['FLOW-today-expanded-reflow']['action_ids'] if item != 'ACT-advice-detail-expanded']
flows['FLOW-advice-restore']['requirement_ids'] += ['R26-03', 'R26-04']

tests = {item['id']: item for item in data['tests']}
tests['T17-advice-switch']['steps'] = ['在欢迎态 Today 卡点击三枚页码点；从第三条向左滑、从第一条向右滑，并用键盘方向键切换。']
tests['T17-advice-switch']['expected'] = '三条提醒均可选；第三条左滑回第一条、第一条右滑到第三条；不显示左右箭头和查看依据入口。'
tests['T17-advice-switch']['requirement_ids'] = ['R17-03', 'R26-01', 'R26-02', 'R26-03', 'R26-04']
tests['T17-advice-restore']['steps'] = ['发送消息使 Today 收起；点开悬浮卡；切换提醒，收起并再次展开。']
tests['T17-advice-restore']['expected'] = '展开态标题只出现一次；页码点在卡片底部居中；再次展开保留已选提醒。'
tests['T17-advice-restore']['requirement_ids'] = ['R25-01', 'R26-02', 'R26-03', 'R26-04']
tests['T25-today-reflow']['steps'] = ['对话后展开 Today，点选并循环滑动三条提醒后收起；检查明亮与夜间短屏。']
tests['T25-today-reflow']['expected'] = '标题不重复，无依据弹窗和左右箭头；页码点底部居中，循环切换可用，短屏不遮住输入框。'
tests['T25-today-reflow']['requirement_ids'] = ['R25-01'] + new_requirements

data['tests'] += [
    {
        'id': 'T26-default-pager', 'flow_id': 'FLOW-advice-switch',
        'state_ids': ['STATE-home-normal'],
        'steps': ['打开欢迎态；确认卡内无依据入口及左右箭头、三枚点位于卡片底部居中；点选第三条、向左滑到第一条、向右滑回第三条；检查键盘与纵向触摸。'],
        'expected': '弹窗未打开，三条提醒的标题与当前点同步，双向边界循环，纵向触摸不切页。',
        'requirement_ids': new_requirements,
        'status': 'acceptance-description-see-runtime-evidence',
    },
    {
        'id': 'T26-expanded-pager', 'flow_id': 'FLOW-today-expanded-reflow',
        'state_ids': ['STATE-assistant-chat', 'STATE-home-advice-expanded'],
        'steps': ['触发对话后展开悬浮 Today；检查页码点、移除的入口、双向循环；收起再恢复。'],
        'expected': '标题仅显示一次，页码点在卡片底部居中，三个提醒循环切换，折叠恢复保留当前页。',
        'requirement_ids': new_requirements,
        'status': 'acceptance-description-see-runtime-evidence',
    },
    {
        'id': 'T26-dark-short', 'flow_id': 'FLOW-today-expanded-reflow',
        'state_ids': ['STATE-home-advice-expanded'],
        'steps': ['在 360×640 夜间视口展开 Today，点选第三条并滑动，随后纵向滚动会话。'],
        'expected': '页码点可见且居中；卡片、输入区无横向溢出或遮挡；纵向手势不触发切页。',
        'requirement_ids': ['R26-02', 'R26-04'],
        'status': 'acceptance-description-see-runtime-evidence',
    },
]

mapping = {item['requirement_id']: item for item in data['mapping']}
for item_id in ('R17-03', 'R25-01'):
    mapping[item_id]['test_ids'] = list(dict.fromkeys(mapping[item_id]['test_ids'] + ['T26-default-pager', 'T26-expanded-pager']))
for item_id in new_requirements:
    data['mapping'].append({
        'requirement_id': item_id,
        'page_ids': ['PAGE-home'],
        'flow_ids': ['FLOW-advice-switch', 'FLOW-today-expanded-reflow'] + (['FLOW-advice-restore'] if item_id in ('R26-03', 'R26-04') else []),
        'state_ids': ['STATE-home-normal', 'STATE-assistant-chat', 'STATE-home-advice-expanded'],
        'test_ids': ['T26-default-pager', 'T26-expanded-pager'] + (['T26-dark-short'] if item_id in ('R26-02', 'R26-04') else []),
    })

data['pending_decisions'].append({
    'id': 'PD-today-card-26-freeze',
    'question': '请查看 R26 Today 卡底部页码点、移除的依据弹窗与箭头，以及循环滑动后决定是否冻结。',
    'blocks_design': False, 'status': 'open',
})
implementation = data['implementation']
implementation['main_files'] = [item for item in implementation['main_files'] if item != 'assets/today-conversation-25.css']
implementation['main_files'].append('assets/today-card-26.css')
implementation['change_scope'] = 'delivery-review/today-card-26/DELIVERY.md'
implementation['evidence_directory'] = 'delivery-review/today-card-26'
implementation['previous_snapshot'] = '../versions/today-conversation-25'
implementation['scope'] = 'R26 Today 卡移除依据弹窗和左右箭头；三枚页码点在默认与展开卡底部居中，三条提醒可循环滑动。原路由与任务卡逻辑沿用 R25。'

target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Updated design.json to today-card-26')
