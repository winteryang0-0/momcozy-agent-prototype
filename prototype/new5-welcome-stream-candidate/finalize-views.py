from pathlib import Path
p=Path('assets/record-views.js');s=p.read_text(encoding='utf-8')
s=s.replace('<div class="pattern-days">','<div class="pattern-days" style="grid-template-columns:repeat(${days.length},minmax(36px,1fr))">')
p.write_text(s,encoding='utf-8')
p=Path('assets/record-refinement.css');s=p.read_text(encoding='utf-8')
s+='\n.pattern-card .pattern-grid{padding-left:27px;padding-right:0}.pattern-card .pattern-hours{left:0;right:auto;top:44px}.pattern-card .pattern-date{height:32px}.pattern-card .pattern-column:nth-child(even) .pattern-lane{background-color:transparent}.pattern-card .pattern-days{min-width:252px}.trend-kpis{margin-bottom:18px}.trend-kpis>span{box-shadow:0 5px 20px #29496b08}\n'
p.write_text(s,encoding='utf-8')
