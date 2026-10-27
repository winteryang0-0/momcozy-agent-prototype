# Platform mapping

## Shared contract
Pin actual dependency versions; preserve the platform's input, focus, accessibility and navigation behavior. “Material 3 enabled” does not establish full Expressive support. Before choosing implementation APIs, inspect installed versions and current official docs. List missing components and adaptations in coverage.

## HTML / CSS / JavaScript / React
Use semantic elements, token CSS and shared primitives. Bundle required runtime assets if delivering a self-contained file; do not depend on unexplained CDN availability. Use the original `spring.mjs` adapter for numerical spatial/effects values when native physics are unavailable. Supply separate instances for geometry and opacity. Native `dialog.showModal()` can provide modal/inert semantics; verify focus restoration and cancellation. Use popovers/menus with correct keyboard navigation. Handle browser back and internal routing explicitly.

Read S11 status before selecting Material Web; do not assume it contains all new Expressive components. Third-party React kits are third-party, even when branded “Material”. Record version and departures. A fixed hand-authored palette cannot be advertised as dynamic color. CSS-only morphs and local-file storage limitations must be stated. Use real browser testing for layout, semantic focus and motion; static checks cannot certify them.

## Flutter
Read S16 and installed Flutter SDK source. Enable Material 3 appropriately, then inspect each required Expressive component/API. Do not claim all Expressive motion exists because `useMaterial3` is true. For missing physics use verified Flutter spring simulation with damping coefficient `c = 2*zeta*sqrt(k*m)` rather than passing damping ratio as coefficient. Respect the relevant platform accessibility animation setting. Use real navigation/back handling, semantics, text scaling, localizations and state restoration. Map roles through ColorScheme/TextTheme/ThemeExtension rather than duplicating page styles. Label custom morphs as adapters and test frame performance.

## Android Jetpack Compose
Prefer supported Material3 components and the installed version's expressive theme/motion APIs (S7). Check experimental annotations and signatures rather than copying a historic code snippet. Reuse MotionScheme spatial/effects specifications where available. Use adaptive layouts, proper semantics and native insets. Integrate predictive back and haptics through supported APIs only when required; native support does not mean your implementation has already enabled them. Use official dynamic colors where supported with a deliberate fixed fallback.

## Fidelity levels
- Official component: actual supported library component with verified version.
- Adapted: original implementation based on official behavior/tokens; requires tests.
- Pixel-reference: inspiration backed by target capture, not an SDK guarantee.
- Unsupported/mock: explicitly identified; never hidden in the success claim.
