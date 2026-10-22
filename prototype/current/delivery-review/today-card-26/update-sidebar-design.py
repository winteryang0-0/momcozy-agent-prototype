import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
target = root / 'design.json'
data = json.loads(target.read_text(encoding='utf-8'))
assert data['project']['revision'] == 'today-card-26'
source = data['source']
assert source['requirements'][-4:] == ['R26-01', 'R26-02', 'R26-03', 'R26-04']
source['requirements'] += ['R26-05', 'R26-06']
source['sha256'] = hashlib.sha256((root / source['path']).read_bytes()).hexdigest()
source['superseded'].append({
    'id': 'R24-03',
    'scope': '暂时移除侧栏智能体服务区、推荐排序及侧栏启动哭声／便便任务；我的、宝宝、当日记录入口和对话常驻照护入口保留。',
})

framework = data['framework']
pages = {item['id']: item for item in framework['pages']}
pages['PAGE-home']['regions'] = [
    'simple-sidebar-and-sound-header' if region == 'sidebar-and-sound-header' else
    'slide-out-primary-sidebar' if region == 'slide-out-care-sidebar' else region
    for region in pages['PAGE-home']['regions']
]
controls = {item['id']: item for item in framework['controls']}
controls['NAV-sidebar-open']['role'] = '首页左上打开仅含我的、宝宝、当日记录的侧边栏'
controls['NAV-sidebar-record']['role'] = '从侧栏进入当日记录并保留记录页新建入口'
remove_controls = {'NAV-sidebar-cry', 'NAV-sidebar-poop'}
framework['controls'] = [item for item in framework['controls'] if item['id'] not in remove_controls]

remove_actions = {'ACT-sidebar-cry', 'ACT-sidebar-poop', 'ACT-sidebar-open-task', 'ACT-sidebar-task-switch'}
framework['actions'] = [item for item in framework['actions'] if item['id'] not in remove_actions]
actions = {item['id']: item for item in framework['actions']}
actions['ACT-sidebar-open']['requirement_ids'] = ['R17-01', 'R24-01', 'R26-05', 'R26-06']
actions['ACT-sidebar-records']['requirement_ids'] = ['R24-03', 'R26-05', 'R26-06']
for action_id in ('ACT-sidebar-mine', 'ACT-sidebar-baby'):
    actions[action_id]['requirement_ids'].extend(['R26-05', 'R26-06'])

remove_flows = {'FLOW-sidebar-cry', 'FLOW-sidebar-poop', 'FLOW-sidebar-task-switch'}
framework['flows'] = [item for item in framework['flows'] if item['id'] not in remove_flows]
flows = {item['id']: item for item in framework['flows']}
flows['FLOW-sidebar-dismiss']['description'] = '精简侧栏仅显示三个基础入口，打开后可用关闭、遮罩或 Escape 退出并恢复入口焦点'
flows['FLOW-sidebar-dismiss']['requirement_ids'].extend(['R26-05', 'R26-06'])
flows['FLOW-sidebar-records']['description'] = '从精简侧栏进入当日记录并新建或返回'
flows['FLOW-sidebar-records']['requirement_ids'].extend(['R26-05', 'R26-06'])
for flow_id in ('FLOW-sidebar-mine', 'FLOW-sidebar-baby'):
    flows[flow_id]['requirement_ids'].extend(['R26-05', 'R26-06'])

mapping = {item['requirement_id']: item for item in data['mapping']}
mapping['R24-03']['flow_ids'] = ['FLOW-sidebar-records']
mapping['R24-03']['state_ids'] = ['STATE-home-sidebar-open', 'STATE-records-normal']
mapping['R24-03']['test_ids'] = ['T24-service-ranking', 'T24-visual-variants']
mapping['R25-02']['flow_ids'] = [id for id in mapping['R25-02']['flow_ids'] if id != 'FLOW-sidebar-task-switch']
mapping['R25-02']['test_ids'] = [id for id in mapping['R25-02']['test_ids'] if id != 'T24-service-task']

tests = {item['id']: item for item in data['tests']}
for id in ('T24-service-task', 'T24-cry-route', 'T24-poop-route'):
    data['tests'].remove(tests[id])
tests = {item['id']: item for item in data['tests']}
tests['T24-open-order-width']['steps'] = ['在 390×844 和桌面预览打开首页左上入口，核对我的、宝宝、当日记录三项、展开方向及边界。']
tests['T24-open-order-width']['expected'] = '侧栏仅含三个基础入口，位于应用容器内，宽度不超过 320px 和容器约 84%；背景不可操作且无横向溢出。'
tests['T24-open-order-width']['requirement_ids'] += ['R26-05', 'R26-06']
tests['T24-service-ranking']['steps'] = ['打开侧栏，确认智能体服务、推荐排序、说明文案均移除；点击当日记录并检查新建入口。']
tests['T24-service-ranking']['expected'] = '侧栏只有我的、宝宝、当日记录；不展示服务和推荐标签；当日记录可进入且新建入口保留。'
tests['T24-service-ranking']['requirement_ids'] += ['R26-05', 'R26-06']
tests['T24-visual-variants']['expected'] = '侧栏三个入口在明暗短屏与桌面视口完整可读，无旧服务区、冗余标题和横向溢出。'
tests['T24-visual-variants']['requirement_ids'] += ['R26-05', 'R26-06']
data['tests'] += [{
    'id': 'T26-simple-sidebar', 'flow_id': 'FLOW-sidebar-records',
    'state_ids': ['STATE-home-sidebar-open', 'STATE-records-normal'],
    'steps': ['打开侧栏，检查仅三项菜单且无冗余文案；分别进入我的、宝宝与当日记录，检查关闭、返回及新建记录。'],
    'expected': '侧栏保留三个基础入口及关闭操作；原智能体服务入口不存在，常驻对话照护功能仍能启动；记录页新建可用。',
    'requirement_ids': ['R26-05', 'R26-06'],
    'status': 'acceptance-description-see-runtime-evidence',
}]
data['mapping'] += [
    {'requirement_id': 'R26-05', 'page_ids': ['PAGE-home', 'PAGE-records', 'PAGE-mine'],
     'flow_ids': ['FLOW-sidebar-dismiss', 'FLOW-sidebar-mine', 'FLOW-sidebar-baby', 'FLOW-sidebar-records'],
     'state_ids': ['STATE-home-sidebar-open', 'STATE-records-normal', 'STATE-mine-normal', 'STATE-sidebar-baby-profile'],
     'test_ids': ['T26-simple-sidebar', 'T24-open-order-width', 'T24-visual-variants']},
    {'requirement_id': 'R26-06', 'page_ids': ['PAGE-home', 'PAGE-records', 'PAGE-mine'],
     'flow_ids': ['FLOW-sidebar-dismiss', 'FLOW-sidebar-mine', 'FLOW-sidebar-baby', 'FLOW-sidebar-records'],
     'state_ids': ['STATE-home-sidebar-open', 'STATE-records-normal', 'STATE-mine-normal', 'STATE-sidebar-baby-profile'],
     'test_ids': ['T26-simple-sidebar', 'T24-open-order-width', 'T24-visual-variants']},
]
data['pending_decisions'][-1]['question'] = '请查看 R26 Today 卡与精简侧栏的完整候选后决定是否冻结。'
implementation = data['implementation']
implementation['scope'] += ' 侧栏暂时移除推荐智能体服务区并精简为我的、宝宝、当日记录三个基础入口。'
target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Updated R26 design.json with simple sidebar')
