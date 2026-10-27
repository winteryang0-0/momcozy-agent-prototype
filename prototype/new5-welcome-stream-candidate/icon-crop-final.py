from pathlib import Path
import re
p=Path('assets/icons.js');s=p.read_text(encoding='utf-8')
heights={158:82,280:90,439:88,554:86,713:80,829:70,931:78,1075:80,1180:80,1310:86,1420:75}
s=re.sub(r'\[(52|215|378|541|704|867),\s*(\d+),\s*110,\s*(\d+)\]',lambda m:f'[{m[1]}, {m[2]}, 110, {heights.get(int(m[2]),int(m[3]))}]',s)
s=s.replace('preserveAspectRatio="none" style="overflow:hidden"','preserveAspectRatio="xMidYMid meet" style="overflow:hidden"')
p.write_text(s,encoding='utf-8')
