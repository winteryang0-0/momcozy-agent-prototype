# Speaking visibility repair — 2026-10-20

Reported: the character intermittently disappears in the speaking preview.

Observed before repair: the selected browser tab was paused with a visible character; 12 ready/speaking switches did not reproduce disappearance. No console errors were captured. The exact reported incident therefore remains unconfirmed.

Confirmed code defect: synchronous painting seeded the clock with performance.now(), followed by requestAnimationFrame timestamps. A backward first delta can make elapsed time negative. poseAt('speaking', -1) returned an undefined frame. The renderer then cleared the canvas before accessing undefined crop bounds, which can leave the character blank.

Repair: synchronous painting no longer seeds the animation clock. Only consecutive animation timestamps advance time, negative deltas are clamped, pose sampling normalizes invalid/negative times, and crop selection falls back to the neutral frame.

Validation: 12 Node tests passed, including two added timing/frame regressions. The rebuilt standalone HTML was reloaded in the existing browser. Speaking mouth frames changed (0, 5, 4); screenshots show the character. Pause/resume and interrupt/restart worked. Browser warning/error log was empty after checks. Evidence: speaking-fixed.jpg and speaking-restarted-fixed.jpg. Earlier seven-flow and independent reviews remain historical checks, not a new full-suite browser rerun.
