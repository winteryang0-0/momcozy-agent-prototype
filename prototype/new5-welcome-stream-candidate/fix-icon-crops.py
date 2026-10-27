from pathlib import Path
import re
p=Path('assets/icons.js');s=p.read_text(encoding='utf-8')
s=re.sub(r'\[(52|215|378|541|704|867),\s*(\d+),\s*110,\s*70\]',lambda m:f'[{m[1]}, {int(m[2])-6}, 110, {78 if int(m[2])>1400 else 90}]',s)
p.write_text(s,encoding='utf-8')
