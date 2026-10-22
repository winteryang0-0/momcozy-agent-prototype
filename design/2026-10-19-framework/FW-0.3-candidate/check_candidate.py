import importlib.util,json
from pathlib import Path
root=Path(__file__).parent
spec=importlib.util.spec_from_file_location('design_guard',r'C:/Users/user/.codex/skills/hw-design-workflow/scripts/design_guard.py')
guard=importlib.util.module_from_spec(spec);spec.loader.exec_module(guard)
d=json.loads((root/'design.json').read_text(encoding='utf-8'))
errors=guard.validate_design(root,d)+guard.inspect_bundle(root,d)
report={'candidate':'FW-0.3','passed':not errors,'checks':'design_guard.validate_design + inspect_bundle','baseline_checks_run':False,'delivery_checks_run':False,'errors':errors,'limits':'Candidate only; no user confirmation or frozen baseline; static pass is not runtime or visual approval.'}
(root/'reviews/static-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
