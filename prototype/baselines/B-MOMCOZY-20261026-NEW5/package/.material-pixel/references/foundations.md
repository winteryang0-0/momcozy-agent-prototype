# Visual foundations

## Profile B art direction — project policy
Prioritize expressive typography, tonal surface grouping, clear primary actions, purposeful rounded shapes and responsive motion. Use a pale cool/neutral canvas, darker readable text, and a controlled accent. Avoid glass on every card, exaggerated drop shadows, decorative gradients behind every section, uniform giant radii, and constant mascot movement. Pixel blur is a contextual system-depth reference, not a default app material.

## Color — S7, S12; starter implementation is project policy
Use semantic pairs: primary/on-primary, primary-container/on-primary-container; repeat for secondary, tertiary and error. Map surfaces using surface, surface-container-lowest/low/default/high/highest; use on-surface and on-surface-variant for content. Outline roles define boundaries, inverse roles support overlays. Keep success/warning as separately declared project roles rather than pretending they are canonical M3 roles. Never color a successful save before persistence succeeds.

Generate light/dark schemes from the same seed with pinned theme utilities. Keep component code independent of seed hex values. Dynamic color needs a real available theme input; a fixed palette is not wallpaper extraction. Verify every text/background pairing; for this skill, require 4.5:1 normal text and 3:1 large text/essential UI boundaries. These are project acceptance thresholds, not an assertion that every token pair is interchangeable.

## Typography — role model S7/S13; portable starter policy
Use display, headline, title, body and label roles, each large/medium/small. Declare emphasis as semantic variants rather than arbitrary bold spans. The supplied baseline scale is a practical M3-style fallback; exact current emphasized weights/variable axes require S13 or installed SDK inspection. Prefer licensed Roboto for Latin and an appropriate CJK fallback such as Noto Sans CJK; never assume unavailable Google Sans is bundled. Record fallback metrics as a visual deviation. Starter CSS exposes the scale and shape/spacing roles; apply them through primitives rather than raw numbers. State-layer opacity defaults are project baseline values and must be checked against each current component specification. Respect user scaling; do not lock viewport zoom or shrink text to fix overflow. Keep body text readable and use larger headings sparingly on dense screens.

## Shape and surfaces — project policy pending component-level spec
Assign corner roles by component, not globally. Starter corners 0/4/8/12/16/28/full are a baseline, not all Expressive shapes. Additional shape sets and morph targets require exact source geometry or a clearly labeled approximation. Morph only compatible paths or use an explicit crossfade. Do not animate arbitrary SVG paths with mismatched point correspondence. Use surface tone and grouping before elevation; keep shadows subtle and declared centrally.

## Layout — S8
Use available content width, not device marketing category: compact <600dp; medium 600–839; expanded 840–1199; large 1200–1599; extra-large >=1600. CSS px are the web adaptation, not physical pixels. Consider height before adding panes. Keep phone content a usable single column; widen into navigation rail/list-detail when content benefits. Do not stretch a phone layout to fill a desktop. Define content max-width, gutters, gap and spacing as project tokens (starter 4px rhythm).

Handle safe areas, browser viewport changes, software keyboard and scroll ownership. Avoid simultaneous nested scrolling unless necessary. Position sheets/popovers using anchors and available space. Never overlap fixed composer, bottom navigation or floating actions.

## Icons and input — S9 plus project policy
Use a consistent licensed Material Symbols style; include text alternatives for icon-only actions. Preserve visible focus and native keyboard behavior. Minimum target 48dp; web project equivalent 48 CSS px. The visual icon can be smaller. Keep expanded targets from overlapping. Provide text or shape cues as well as color. Test localized labels, long names, 200% text, dark theme, high contrast and reduced motion. Decorative icons are hidden from assistive technology; interactive controls retain semantic labels.
