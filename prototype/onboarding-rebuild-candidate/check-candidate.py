"""Run static candidate checks without claiming a frozen baseline."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
GUARD = Path(r"C:\Users\user\.codex\skills\hw-design-workflow\scripts\design_guard.py")
spec = importlib.util.spec_from_file_location("hw_design_guard", GUARD)
if spec is None or spec.loader is None:
    raise SystemExit("Cannot load hw-design-workflow guard")
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)

design = json.loads((ROOT / "design.json").read_text(encoding="utf-8"))
errors = guard.validate_design(ROOT, design)
candidate_decisions = [item for item in errors if item["code"] == "pending_decision"]
structural_errors = [item for item in errors if item["code"] != "pending_decision"]

report = {
    "stage": "candidate",
    "structural_pass": not structural_errors,
    "source_sha256": design["source"]["sha256"],
    "framework_sha256": guard.digest(design["framework"]),
    "system_sha256": guard.digest(design["system"]),
    "scope_sha256": guard.digest(sorted(design["source"]["requirements"])),
    "errors": structural_errors,
    "pending_decisions": candidate_decisions,
    "baseline_check": "not run; no user-approved baseline",
    "delivery_check": "not run; candidate is awaiting framework and style confirmation",
}
print(json.dumps(report, ensure_ascii=False, indent=2))
if structural_errors:
    raise SystemExit(1)
