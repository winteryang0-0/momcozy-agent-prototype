from pathlib import Path
import re
p=Path('assets/icons.js');s=p.read_text(encoding='utf-8')
s=re.sub(r'\[(52|215|378|541|704|867),(\d+),110,70\]',lambda m:f'[{m[1]},{int(m[2])-6},110,{78 if int(m[2])>1400 else 90}]',s)
s=s.replace('x="0" y="20" width="110" height="70"','x="0" y="10" width="110" height="90"')
p.write_text(s,encoding='utf-8')
p=Path('assets/record-refinement.css');s=p.read_text(encoding='utf-8')
s+='\n#panel[data-record-type="睡眠"] .ruler-control{display:none}\n.baseline-icon{mix-blend-mode:multiply}.trend-date-strip{display:flex;gap:5px;overflow:auto;margin:12px 0}.trend-date-strip button{flex:1;min-width:39px;padding:8px 3px;border:0;border-radius:14px;background:transparent;font-size:12px}.trend-date-strip button:last-child{background:#dcecff;color:#3155cf}.trend-date-strip small{display:block;margin-top:6px}.trend-kpis>span{display:flex;flex-direction:column;align-items:center;font-size:12px}.pattern-hours{order:-1}.pattern-column{display:flex;flex-direction:column}.pattern-date{order:-1;margin-bottom:12px}\n'
p.write_text(s,encoding='utf-8')
p=Path('assets/conversation.js');s=p.read_text(encoding='utf-8')
needle="${RecordViews.pattern(shown,rows,{tone:recordTone,typeIcon,summary:recordSummary,expanded:patternExpanded})}"
replacement="""<div class="trend-date-strip">${shown.map(day=>`<button data-action="chart-day" data-day="${day}" data-filter="全部">${day.slice(5).replace('-','/')}<small>${new Date(day+'T12:00:00').toLocaleDateString('zh-CN',{weekday:'short'})}</small></button>`).join('')}</div><div class="trend-kpis">${[['bottle','奶量',shown.reduce((n,d)=>n+(CareEngine.summary(db.records,baby().id,d).milk||0),0),'mL'],['rest','睡眠',Math.round(shown.reduce((n,d)=>n+(CareEngine.summary(db.records,baby().id,d).sleep||0),0)/60*10)/10,'h'],['diaper','尿布',shown.reduce((n,d)=>n+(CareEngine.summary(db.records,baby().id,d).diapers||0),0),'次']].map(([i,l,v,u])=>`<span>${icon(i)}${l}<strong>${v} ${u}</strong></span>`).join('')}</div>"""+needle
assert needle in s;s=s.replace(needle,replacement)
p.write_text(s,encoding='utf-8')
