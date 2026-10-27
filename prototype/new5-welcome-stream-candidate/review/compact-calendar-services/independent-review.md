# Compact calendar and support choices — independent layout review

2026-10-26. This pass changed only `assets/onboarding.css`; JavaScript and business tests are owned by the main agent.

## Changes verified

- Birthday year and month are on one row. Redundant previous/next-month buttons are hidden by CSS; their DOM and JavaScript remain intact, and both menus remain usable.
- The date title stays on one line. Calendar header, prompt spacing and date-cell height are compact, with no truncation.
- Six themes and up to six related support choices share a two-column card layout. Long support labels use a smaller 14 px size only at widths of 360 px or less.
- The standalone gender preview and birthday edit icon are absent in the integrated JavaScript version. Blue styling and English text remain visible.

## Browser evidence

Isolated Chrome contexts, reduced motion, split-file entry. Tested 832×879 desktop viewport (430 px phone preview), 390×844 and 320×650.

- Birthday used March 2025, a six-row month. In all three sizes, `.ob-scroll.scrollHeight === clientHeight` and `scrollWidth === clientWidth`; the entire card and footer are visible without scrolling.
- Six real themes and six randomly selected service labels rendered without horizontal overflow at all three sizes.
- An additional 320×650 fixture used six of the longest service labels. After the final CSS adjustment, its scroll and client height both equal 513 px, width both equal 320 px. All six choices and the continue button are visible.
- Screenshots reviewed: `birthday-832.png`, `birthday-320.png`, `gender-390.png`, `topics-320.png`, `services-832.png`, `services-320.png`, `services-longest-320.png`. The longest-label screenshot reflects the final narrow-screen service styling.

No unresolved layout blocker found in this scope. Logic, randomization, persistence and final single-file rebuild are covered by the main agent. Very long personal names, browser font scaling and physical-device keyboards were not certified in this pass.
