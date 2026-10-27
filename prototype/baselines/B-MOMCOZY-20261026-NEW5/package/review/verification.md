# Current revision: mobile APP shell

17 Chromium checks passed in tests/native-app.cjs. Evidence: native-app-results.json. Checked mobile fit, three bottom tabs, absence of desktop sidebar, primary record/profile pages, draft retention across navigation, save/list, detail sheet, delete/undo, profile refresh, Escape, 430px desktop phone, aligned bottom sheet, 320px layout, composer/nav separation and no JS errors. Mobile home, profile, records and desktop sheet visually inspected. The final toast animation was changed to preserve its anchored position above navigation during entrance.

Desktop is a bounded phone preview. Browser visualViewport resizing is implemented; a real mobile keyboard and successful microphone capture still require device testing. Original companion and local storage keys are preserved.

## Historical pre-shell verification (not rerun for this revision)

# Verification — 2026-10-25

## Passed

- 30 Chromium/Playwright main-flow checks: responsive widths 320/390/768/1440; composer visible; proactive snooze/dismiss/restore; ambiguous feeding type; review/save/double click; refresh retention; unfinished edit retention; weight/custom/pump records; storage failure/retry; delete/undo; cancel; grouped profile and final permission explanation; reduced motion persistence; legacy maternal visibility; cross-baby draft/task ownership; unknown-field preservation; HTML escaping; denied microphone feedback; no uncaught JS errors.
- 9 file/edge checks: standalone file opens; explicit no-baby stage avoids feeding prompt and baby recording; late speech callback cannot replace newer panel; new draft cannot inherit stale form; Escape; 200% CSS zoom no document overflow; system reduced-motion CSS; no uncaught JS errors.
- Source syntax check and build successful. Taste lint: 0 fail / 0 warn.
- Visual inspection of mobile and desktop rendered screenshots. Screenshots remain internal and are not distributed.

## Test evidence and limitations

`conversation-test-results.json` and `conversation-edge-results.json` contain exact named assertions. Chromium uses the available serverless binary with Playwright. Late speech callback uses a controllable stub, not real successful recognition. Microphone denial recovery is tested; real microphone capture quality, recognition success, mobile software keyboard and screen-reader narration need device validation. No production AI, clinical logic, backend sync or background notification is claimed.

Independent challenger reviewed code and exercised custom and pump flows, finding issues that were fixed and covered by subsequent main/edge checks. This is a target-adaptation prototype, not a source-app fidelity assessment.

Final rendered taste inspection at 1440/768/390: 0 failures, 2 warnings. Caption floor raised to 11px. Retained warnings: the brand wordmark and its separate Chinese subline use different faces (not emphasis within a heading); metadata/action captions dominate the empty conversation's word count. Main conversation text is 15px and greeting 21–25px. These are deliberate hierarchy choices, not untested automated passes.

Visual critique: the first action is visible on mobile; the companion and specific feeding question identify the product; the composer remains anchored while conversation scrolls. Desktop reserves open space for a growing dialogue, with a readable column rather than expanding line length. No chart/photographic hero was added because the task is a working conversational app. No clipping or overlap was observed in the inspected states. Real-device typography and keyboard fit remain a follow-up validation item.
