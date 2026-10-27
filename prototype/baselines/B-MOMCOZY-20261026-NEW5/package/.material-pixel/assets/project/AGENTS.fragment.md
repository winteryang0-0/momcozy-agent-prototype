<!-- material-pixel:start -->
## Google Material · Pixel — project UI contract
Apply the `google-material-pixel` skill to UI changes and next versions in this project. If the skill is unavailable, read `.material-pixel/SKILL.md` and its references as the portable fallback.
Use profile B (Google/Pixel fidelity), version 1.0.0 baseline. Keep Material official rules, Pixel references and project adaptations distinct. Use shared tokens and primitives; do not blend other OS styling without an explicit user request. Preserve business logic, saved data and existing authored AI characters.
Read `.material-pixel/references/acceptance.md`; update `.material-pixel/coverage.json` and run `python .material-pixel/scripts/audit_project.py .` before claiming conformance. Record real evidence for interaction, motion, process and regression checks. Missing runtime/visual evidence means not verified.
Do not silently upgrade tokens or dependencies during a release. Explicit user changes supersede this baseline; record the change and affected checks.
<!-- material-pixel:end -->
