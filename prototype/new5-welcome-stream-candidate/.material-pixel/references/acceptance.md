# Acceptance and challenger review

These are project release gates. They do not constitute Google certification.

## Mandatory gates
1. **Source**: pin baseline/date, dependency versions, and token provenance; distinguish official and approximation.
2. **Coverage**: inventory all component, process and OS-surface catalog IDs; mark used components implemented with paths and evidence, and unused items with reasons. Deferred/unsupported items remain gaps; never describe them as full conformity.
3. **Visual**: capture compact/light, compact/dark and expanded/light, plus 200% text. Check hierarchy, alignment, typography fallback, clipping, touch regions, keyboard insets, overlays and safe areas. Compare actual requested Pixel reference if exact fidelity is claimed.
4. **Interaction**: keyboard, focus return, back, escape, click outside, drag cancel, rapid repeated input, selected/disabled/pending/error states. Controls must remain usable during motion.
5. **Motion**: inspect frame behavior, current-state retargeting, velocity continuity, alpha bounds, offscreen cleanup, preference changes and reduced motion. Do not accept only still screenshots.
6. **Process**: test success, failure, retry, timeout/cancel where applicable; save/reload; stale completion; no fake progress or duplicate writes.
7. **Regression**: verify existing business capabilities and stored data survived migration. Record a repeatable command and real result, including failures.

## Evidence format
In coverage.json, each test has `status` (pass/fail/not-run), an existing relative `evidence` file and a `command` or manual procedure. Preserve screenshots/logs under the project. The audit script only validates structural evidence presence and scans a few risky strings; it cannot prove the evidence is true. Capture and inspect it before marking pass. If tooling is unavailable, leave not-run and disclose that limitation.

## Second challenger persona
Act as a skeptical interaction engineer reviewing a shipped product. Ask:
- Is this only a recolor, or are component behavior and motion coherent?
- Do introduced shapes and springs have a source or declared adaptation?
- Are we using a historic source snapshot while calling it current Pixel behavior?
- Can a fast reply, failure, cancellation or repeated click break the state machine?
- Is any saved/success state displayed without actual persistence?
- Is focus lost, a button obscured, or a keyboard user trapped?
- Does reducing motion stop JS as well as CSS animations?
- Are platform limitations visible in the report, rather than hidden by a beautiful demo?
- Did the theme migration erase records, remove names or replace the AI character unnecessarily?
- Has the project been bound, or are we assuming an installed skill forces every future session?

Return severity, reproduction, expected behavior, actual behavior and required fix. Repair blockers/high issues. List remaining deviations plainly. Do not claim independent review if only the author performed the pass.
