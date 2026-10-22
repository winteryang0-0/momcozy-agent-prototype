from pathlib import Path
import hashlib,json,struct,zipfile
from PIL import Image
root=Path(__file__).resolve().parent
files=[]
for name in ['bundle','assets']:
    files.extend(p for p in (root/name).rglob('*') if p.is_file())
files.extend(root/name for name in ['README.txt','state-spec.json','generation-prompts.json'])
for p in (root/'app').rglob('*'):
    if not p.is_file(): continue
    relative=p.relative_to(root/'app')
    if relative.parts[0] in ['node_modules','dist','public','.git']: continue
    files.append(p)
for p in (root/'reviews').glob('*'):
    if p.suffix in ['.md','.json','.jpg'] or p.name in ['desktop-preview.png','mobile-ready.png','source-and-implementation.png']:
        files.append(p)
records=[]
for p in sorted(set(files)):
    data=p.read_bytes()
    if p.suffix in ['.json','.md','.txt','.jsx','.mjs','.css','.html']:
        data.decode('utf-8')
    records.append({'path':p.relative_to(root).as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
captures=[]
for p in sorted((root/'reviews').glob('*.png')):
    data=p.read_bytes()
    with Image.open(p) as im:
        w,h=im.size
        captures.append({'path':p.relative_to(root).as_posix(),'width':w,'height':h,'actual_format':im.format,'sha256':hashlib.sha256(data).hexdigest()})
manifest={'version':'0.1','stage':'candidate-interactive-demo','files':records,'screenshot_metadata':captures,'validation':{'node_tests':13,'browser_state_captures':30,'complete_browser_flows':7,'independent_logic':'5 findings closed','independent_visual':'sampled screenshot review; no P1/P2','file_protocol':'not tested; standalone file tested over local HTTP'}}
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
archive=root/'soft-companion-motion-v0.1.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,strict_timestamps=False) as z:
    for p in sorted(set(files+[root/'manifest.json'])):
        z.write(p,p.relative_to(root).as_posix())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert '软石' in z.read('README.txt').decode('utf-8')
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'entries':len(files)+1,'screenshot_count':len(captures)},ensure_ascii=False))
