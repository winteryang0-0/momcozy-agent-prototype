from pathlib import Path
for name in ['assets/conversation.js','index.html']:
 p=Path(name);s=p.read_text(encoding='utf-8')
 s=s.replace("'体重':'heart'","'体重':'weight'").replace("'体重','heart'","'体重','weight'").replace("'体重','growth','heart'","'体重','growth','weight'")
 s=s.replace('data-type="体重"><span data-icon="heart"','data-type="体重"><span data-icon="weight"')
 p.write_text(s,encoding='utf-8')
