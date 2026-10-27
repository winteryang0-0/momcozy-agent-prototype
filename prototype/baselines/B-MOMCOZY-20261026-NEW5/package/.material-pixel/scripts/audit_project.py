#!/usr/bin/env python3
"""Evidence/manifest audit with heuristic warnings; does NOT certify runtime or visuals."""
import argparse,json,re
from pathlib import Path
IDS=set('buttons icon-buttons button-groups split-buttons fab fab-menu chips cards lists navigation tabs app-bars-toolbars menus sheets dialogs text-fields selection-controls sliders search pickers snackbar tooltip badges progress loading-indicator carousel dividers'.split())
PROCESS_IDS=set('short-load long-task save upload recording ai-response device-connection refresh delete empty-offline'.split())
OS_IDS=set('system-bars launcher lock-screen notification-shade quick-settings recents predictive-back settings permissions live-updates media-haptics adaptive-windows wear-os'.split())
TESTS=set('visual interaction motion process regression challenger'.split())
CLASS={'official','pixel-reference','project-policy','approximation'}

def audit(root):
    root=Path(root).resolve(); errors=[];warnings=[]
    def evidence(path):
        if not isinstance(path,str) or not path or Path(path).is_absolute(): return False
        f=(root/path).resolve()
        return f.is_relative_to(root) and f.is_file() and f.stat().st_size>0
    try:
        data=json.loads((root/'.material-pixel/coverage.json').read_text())
        if not isinstance(data,dict): raise ValueError('Manifest must be object')
    except (OSError,ValueError) as exc:return [str(exc)],[]
    if data.get('schema')!=1 or data.get('profile')!='B':errors.append('Require schema 1/profile B (change policy explicitly for other profiles)')
    if data.get('platform') not in ['web','flutter','compose']:errors.append('Set target platform web/flutter/compose')
    if not isinstance(data.get('dependencies'),dict) or not data['dependencies']:errors.append('Record actual dependencies/runtime versions')
    try: agents=(root/'AGENTS.md').read_text()
    except OSError: agents=''
    start='<!-- material-pixel:start -->';end='<!-- material-pixel:end -->'
    if agents.count(start)!=1 or agents.count(end)!=1 or agents.index(start)>agents.index(end):
        errors.append('Missing or malformed project contract')
    elif 'google-material-pixel' not in agents[agents.index(start):agents.index(end)]:
        errors.append('Project contract content missing')
    for category,expected in [('components',IDS),('processes',PROCESS_IDS),('os_surfaces',OS_IDS)]:
        rows=data.get(category,[])
        if not isinstance(rows,list):rows=[];errors.append(f'{category} must be array')
        ids=[r.get('id') for r in rows if isinstance(r,dict)]
        if set(ids)!=expected or len(ids)!=len(expected):errors.append(f'{category} inventory must contain every catalog ID exactly once')
        for row in rows:
            if not isinstance(row,dict):errors.append('Invalid component row');continue
            key=row.get('id','?');status=row.get('status')
            if status not in ['implemented','not-used','deferred','unsupported']:errors.append(f'{key}: invalid status')
            if row.get('classification') not in CLASS:errors.append(f'{key}: missing evidence classification')
            if status=='implemented':
                if not evidence(row.get('implementation')):errors.append(f'{key}: missing implementation file')
                if not evidence(row.get('evidence')):errors.append(f'{key}: missing evidence file')
                if not row.get('source'):errors.append(f'{key}: source/policy reference required')
            else:
                if not str(row.get('reason','')).strip():errors.append(f'{key}: reason required')
                if status in ['deferred','unsupported']:errors.append(f'{key}: unresolved coverage gap')
    rows=data.get('tests',[])
    if not isinstance(rows,list):rows=[];errors.append('tests must be array')
    ids=[r.get('id') for r in rows if isinstance(r,dict)]
    if set(ids)!=TESTS or len(ids)!=len(TESTS):errors.append('Test inventory must contain every gate exactly once')
    for row in rows:
        if not isinstance(row,dict):errors.append('Invalid test row');continue
        key=row.get('id','?')
        if row.get('status')!='pass' or not row.get('command') or not evidence(row.get('evidence')):errors.append(f'{key}: requires passed check, procedure and evidence')
    for path in root.rglob('*'):
        if any(part in {'node_modules','.git','.material-pixel','build','dist','.dart_tool'} for part in path.relative_to(root).parts):continue
        if path.suffix not in {'.html','.css','.js','.jsx','.ts','.tsx','.dart','.kt'} or not path.is_file() or path.is_symlink():continue
        if path.stat().st_size>2_000_000:continue
        text=path.read_text(errors='replace');rel=path.relative_to(root)
        for label,pattern in [('transition-all',r'transition\s*:\s*all\b'),('zoom-disabled',r'user-scalable\s*=\s*no'),('fixed-fullscreen',r'100vh')]:
            if re.search(pattern,text):warnings.append(f'{rel}: review {label}')
    return errors,warnings
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('project_root');args=parser.parse_args()
    try:errors,warnings=audit(args.project_root)
    except (OSError,TypeError,ValueError) as exc:errors=[str(exc)];warnings=[]
    print(json.dumps({'structural_gate':'fail' if errors else 'pass','errors':errors,'warnings':warnings,'note':'Passing confirms manifest/evidence presence only. Independently inspect UI, runtime and evidence.'},indent=2))
    raise SystemExit(1 if errors else 0)
