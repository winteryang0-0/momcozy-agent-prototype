import json,hashlib,re
from pathlib import Path
from html.parser import HTMLParser
root=Path(__file__).parent
old=json.loads((root.parent/'FW-0.3-candidate/design.json').read_text(encoding='utf-8'))
class Markers(HTMLParser):
 def __init__(self):super().__init__();self.stack=[];self.pages=[];self.controls=[];self.states=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs);owner=a.get('data-page-id') or next((x[1] for x in reversed(self.stack) if x[1]),None)
  if 'data-page-id' in a:self.pages.append(dict(id=a['data-page-id'],route=a['data-route'],parent_id=None if a['data-page-id'].startswith('PAGE-identity') else 'PAGE-chat' if a['data-page-id'] in ['PAGE-mine','PAGE-baby','PAGE-devices'] else None,regions=[a['data-page-id']+'-body']))
  if 'data-control-id' in a:self.controls.append(dict(id=a['data-control-id'],page_id=owner,component_id='CMP-control',role=a.get('aria-label') or a.get('name') or a.get('data-action') or a['data-control-id']))
  if 'data-state-id' in a:
   sid=a['data-state-id'];prev=next((s for s in old['framework']['states'] if s['id']==sid),None)
   self.states.append(dict(id=sid,page_id=owner,kind=prev['kind'] if prev else 'loading' if 'busy' in sid else 'error' if any(x in sid for x in ['error','interrupted','fallback']) else 'normal'))
  if tag not in ['img','input','br','hr','meta','link','source','wbr']:self.stack.append((tag,owner))
 def handle_endtag(self,tag):
  for i in range(len(self.stack)-1,-1,-1):
   if self.stack[i][0]==tag:self.stack=self.stack[:i];break
m=Markers();m.feed((root/'bundle/index.html').read_text(encoding='utf-8'))
new=old
new['project'].update(id='momcozy-framework-fw04',stage='draft')
new['framework'].update(revision=4,pages=m.pages,controls=m.controls,states=m.states)
states={s['id']:s for s in m.states}
for a in new['framework']['actions']:a['target_page_id']=states[a['to_state']]['page_id']
for t in new['tests']:
 t['steps']=[s.replace('独立表单','同页记录任务卡').replace('记录类型面板','记录任务卡的类型选择') for s in t['steps']]
 if t['flow_id'] in ['FLOW-'+k for k in ['breast','formula','bottle','diaper','pump']]:t['expected']='当前聊天内完成记录、校验、保存与修改；保持recordId；本地记录更新今日概览。'
reqs=new['source']['requirements']+['IA-SERVICES','TASK-CONSISTENCY','AI-ASSETS']
new['source']=dict(path='sources/requirements-v04.json',requirements=reqs,sha256='')
actions=new['framework']['actions'];flows=new['framework']['flows'];tests=new['tests']
def flow(fid,rs,steps,ss,expected,edges):
 aids=[]
 for ident,control,before,after,event in edges:
  aid='ACT04-'+ident;actions.append(dict(id=aid,control_id=control,event=event,target_page_id=states[after]['page_id'],from_state=before,to_state=after));aids.append(aid)
 flows.append(dict(id='FLOW04-'+fid,requirement_ids=rs,action_ids=aids));tests.append(dict(id='TEST04-'+fid,flow_id='FLOW04-'+fid,state_ids=ss,steps=steps,expected=expected))
flow('services',['IA-SERVICES','C09','C10','C11'],['首页查看今日概览与三卡；聊天后从常用功能打开同一组三卡；关闭与Esc恢复入口'],['ST-chat','ST-services','ST-services-open'],'三卡只有一组DOM实例，移动到弹层后保持ID、任务状态与文本一致。',[('services','CHAT-services','ST-chat','ST-services-open','click'),('close-services','SERVICES-close','ST-services-open','ST-chat','click')])
flow('record-entry',['C09','TASK-CONSISTENCY'],['点击记录，当前聊天流出现记录任务卡'],['ST-chat','ST-record-picker'],'不切换路由，不新建第二个同类未完成任务。',[('record-open','C09','ST-chat','ST-record-picker','click')])
for k in ['breast','formula','bottle','diaper','pump']:
 flow('record-type-'+k,['C09','TASK-CONSISTENCY'],['选择'+k+'；填写后更换类型；再回原类型'],['ST-record-picker','ST-'+k+'-edit'],'不同类型草稿分别保存，继续任务优先回上次所选。',[('select-'+k,'REC-type-'+k,'ST-record-picker','ST-'+k+'-edit','click')])
for k,ready,req in [('record','ST-record-picker','C09'),('cry','ST-cry-ready','C10'),('poop','ST-poop-ready','C11')]:
 flow('collapse-'+k,[req,'TASK-CONSISTENCY'],['进入、收起、再次从同一入口继续；重复点击不增加任务'],[ready,'ST-'+k+'-collapsed'],'收起只改变显示，字段与素材保留；哭声录制中先要求结束录音。',[('collapse-'+k,k+'-collapse',ready,'ST-'+k+'-collapsed','click'),('expand-'+k,k+'-expand','ST-'+k+'-collapsed',ready,'click')])
 flow('cancel-'+k,[req,'TASK-CONSISTENCY'],['无内容直接取消；有内容先确认，确认后保留已取消摘要；再做一次显式新建'],[ready,'ST-'+k+'-cancelled'],'取消仅清当前任务未保存内容，不清其他类型草稿和已保存记录。',[('cancel-'+k,k+'-cancel',ready,'ST-'+k+'-cancelled','click')])
flow('cry-interrupt',['C10','TASK-CONSISTENCY'],['录制中尝试离开、语音输入和其他任务；切到后台或刷新再回来'],['ST-cry-capture','ST-cry-interrupted','ST-cry-ready'],'显式离开先要求结束；页面隐藏中断录音且不自动续录；重新录制。',[('interrupt','C10-start','ST-cry-capture','ST-cry-interrupted','visibility-hidden'),('rerecord','C10-interrupted-retry','ST-cry-interrupted','ST-cry-ready','click')])
flow('companion',['C05','AI-ASSETS'],['查看陪伴形象；发送时看状态；错误时看需处理；模拟资产缺失'],['ST-ai-idle','ST-ai-busy','ST-ai-attention','ST-ai-fallback'],'非交互展示；不抢焦点；固定框和文本降级；无真实人物语音。',[('companion-busy','C05','ST-ai-idle','ST-ai-busy','reply-pending'),('companion-attention','C05','ST-ai-busy','ST-ai-attention','reply-failed')])
for mid in new['mapping']:
 fs=[f for f in flows if mid['requirement_id'] in f['requirement_ids']];ts=[t for t in tests if t['flow_id'] in [f['id'] for f in fs]];ss=list(dict.fromkeys(s for t in ts for s in t['state_ids']));mid.update(page_ids=list(dict.fromkeys(states[s]['page_id'] for s in ss)),flow_ids=[f['id'] for f in fs],state_ids=ss)
for req in ['IA-SERVICES','TASK-CONSISTENCY','AI-ASSETS']:
 fs=[f for f in flows if req in f['requirement_ids']];ss=list(dict.fromkeys(s for t in tests if t['flow_id'] in [f['id'] for f in fs] for s in t['state_ids']));new['mapping'].append(dict(requirement_id=req,page_ids=['PAGE-chat'],flow_ids=[f['id'] for f in fs],state_ids=ss))
new['system']['revision']=2
new['system']['tokens']['--tiny']='12px'
new['system']['components'].append(dict(id='CMP-task',states=['ready','active','collapsed','cancelled','result','error'],token_refs=['--surface','--line','--radius-lg','--brand']))
new['framework']['viewports']=[dict(id='VP-desktop',width=1440,height=1000),dict(id='VP-mobile',width=390,height=844),dict(id='VP-narrow',width=360,height=780)]
new['pending_decisions']=[x for x in new['pending_decisions'] if x['id'] not in ['D-baseline','D-chat-revision']]+[dict(id='D-fw04',question='本轮用户授权入口布局重构和AI形象A；FW04为待查看候选，尚未冻结。',blocks_design=False,status='open')]
source=dict(previous='sources/requirements-v03.json',request='基于需求拆解重构入口布局；三个功能卡与今日概览同时展示，预留AI形象和图标并考虑交互边界。',answer='A；同时需要注意维持三个功能卡片交互逻辑的一致性',interpretation='AI陪伴展示与状态反馈；三功能同页展开，统一生命周期，保留类型专属编辑/采集；无新增真实能力。')
(root/'sources/requirements-v04.json').write_text(json.dumps(source,ensure_ascii=False,indent=2),encoding='utf-8');new['source']['sha256']=hashlib.sha256((root/'sources/requirements-v04.json').read_bytes()).hexdigest()
(root/'design.json').write_text(json.dumps(new,ensure_ascii=False,indent=2),encoding='utf-8')
canonical=lambda o:json.dumps(o,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
hashit=lambda o:hashlib.sha256(canonical(o)).hexdigest()
summary=dict(candidate='FW-0.4',status='awaiting-review-not-frozen',framework_sha256=hashit(new['framework']),system_sha256=hashit(new['system']),source_sha256=new['source']['sha256'],scope_sha256=hashit(sorted(reqs)),confirmation=None)
(root/'candidate-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(pages=len(m.pages),controls=len(m.controls),states=len(m.states),requirements=len(reqs),flows=len(flows)),ensure_ascii=False))
