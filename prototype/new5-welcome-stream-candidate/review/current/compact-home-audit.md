# Compact home and feeding refinement — 2026-10-27

Scope: latest 11 annotations and richer hold-to-talk visuals. Existing baseline retained.

Implemented: removed Today widget; compact horizontal shortcuts; solid upward send arrow; left Cozie drawer; feeding presets removed; record time always visible; fixed-center numeric rulers across nursing, bottled milk and formula; feeding tab icons; 144px photo thumbnail; baby-switch title and explanation removed. Voice overlay uses layered blue/mint/lavender/pink/gold motion with stronger perimeter waves and reduced-motion fallback.

Verification: Chrome headless at 390x844. compact-home.cjs passes all three feeding tabs, keyboard ruler changes, 120ml persistence, expanded time and runtime error checks. record-refinement.cjs passes six record sheets, 14-day trends and removed growth controls. Screenshots: review/current/drawer.png, ruler.png, voice.png. Drawer and voice inspected visually. Voice screenshot uses forced visual state; real microphone and live recognition were not verified. No deployment or Git push performed.
