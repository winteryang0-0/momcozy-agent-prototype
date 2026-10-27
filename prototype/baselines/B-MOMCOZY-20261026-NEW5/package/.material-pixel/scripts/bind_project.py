#!/usr/bin/env python3
"""Bind a requested project, preserving files and offering a portable skill snapshot."""
import argparse, shutil
from pathlib import Path

def bind(root):
    root=Path(root).resolve()
    if not root.is_dir(): raise ValueError('Project root must exist')
    source=Path(__file__).resolve().parent.parent
    agents=root/'AGENTS.md'
    if agents.is_symlink(): raise ValueError('Refuse symlinked AGENTS.md')
    current=agents.read_text() if agents.exists() else ''
    start='<!-- material-pixel:start -->'; end='<!-- material-pixel:end -->'
    if start in current or end in current:
        if current.count(start)!=1 or current.count(end)!=1 or current.index(start)>current.index(end):
            raise ValueError('Malformed existing contract; reconcile manually')
        if 'google-material-pixel' not in current[current.index(start):current.index(end)]:
            raise ValueError('Contract content missing; reconcile manually')
    dest=root/'.material-pixel'
    if dest.is_symlink(): raise ValueError('Refuse symlinked .material-pixel')
    if dest.exists():
        required=['SKILL.md','coverage.json','scripts/audit_project.py','assets/tokens.json']
        if not all((dest/f).is_file() for f in required):
            raise ValueError('Existing incomplete binding: inspect and reconcile manually; no overwrite performed')
        print('Existing binding retained; compare versions manually before upgrading.')
    else:
        staging=root/'.material-pixel.staging'
        if staging.exists(): raise ValueError('Existing staging directory; inspect before retrying')
        try:
            staging.mkdir()
            for item in ['SKILL.md','references','assets','scripts']:
                src=source/item
                if src.is_dir(): shutil.copytree(src,staging/item,ignore=shutil.ignore_patterns('__pycache__'))
                else: shutil.copy2(src,staging/item)
            shutil.copy2(source/'assets/project/coverage.json',staging/'coverage.json')
            staging.rename(dest)
        except Exception:
            if staging.exists(): shutil.rmtree(staging)
            raise
    if start not in current:
        fragment=(source/'assets/project/AGENTS.fragment.md').read_text()
        agents.write_text(current.rstrip()+'\n\n'+fragment)
    print('Bound project:',root)
    print('Next: inventory coverage.json, implement, capture evidence, run audit_project.py. No UI migrated by this command.')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('project_root');args=parser.parse_args()
    try: bind(args.project_root)
    except (ValueError,OSError) as exc: parser.exit(2,str(exc)+'\n')
