from pathlib import Path
p=Path('assets/cozie-refinements.js');s=p.read_text(encoding='utf-8').replace('id="cozie-clear-paper" color-', 'id="cozie-clear-paper" x="0" y="0" width="100%" height="100%" color-');p.write_text(s,encoding='utf-8')
p=Path('assets/cozie-refinements.css');s=p.read_text();s+='\n#app[data-route=home] #thread{background:linear-gradient(145deg,var(--intent-a),var(--intent-b))}\n';p.write_text(s)
