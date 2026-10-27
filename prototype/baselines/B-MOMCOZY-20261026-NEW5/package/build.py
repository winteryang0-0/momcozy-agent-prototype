from pathlib import Path
import re
root=Path(__file__).resolve().parent
html=(root/'index.html').read_text()
html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>\n'+(root/m[1]).read_text()+'\n</style>',html)
html=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>\n'+(root/m[1]).read_text().replace('</script','<\\/script')+'\n</script>',html)
output=root/'Momcozy-Soft-Companion.html';output.write_text(html)
print(output)
