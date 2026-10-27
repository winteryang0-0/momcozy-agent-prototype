# Sources and version control

Checked 2026-10-25. This is an implementation guide with original project policies, not a mirror of Google's documentation. Read official sources when implementing exact component geometry. Links marked JS-only were located but not text-verifiable during authoring; do not treat those pages as extracted specifications.

| ID | Source | Authority / captured finding |
|---|---|---|
| S1 | https://m3.material.io/ | Official current design-system landing page: M3 Expressive |
| S2 | https://m3.material.io/get-started | Official foundations/styles/components structure and Expressive scope |
| S3 | https://m3.material.io/styles/motion/overview/how-it-works | Official motion explanation: physics, expressive/standard schemes; indexed text retrieved |
| S4 | https://m3.material.io/styles/motion/overview/specs | Official specifications route; JS-only retrieval; refresh before exact spec claims |
| S5 | https://android.googlesource.com/platform/frameworks/support/+/43a3dc60a427d3fffa9cbc3f83e5f9a1c5cec29a/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MotionScheme.kt | Official pinned AOSP implementation snapshot; source of bundled numeric spring presets, NOT a claim that this historical commit is the latest SDK |
| S6 | https://blog.google/products-and-platforms/platforms/android/material-3-expressive-android-wearos-launch/ | Official 2025-05-13 Pixel/Android/Wear launch illustration; notification neighbor response, spring motion, shade depth, quick-settings customization, Live Updates; not a comprehensive OS spec |
| S7 | https://developer.android.com/develop/ui/compose/designsystems/material3 | Official Android M3 theming and Expressive implementation guidance |
| S8 | https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes | Official width breakpoints 600/840/1200/1600dp and height constraints |
| S9 | https://developer.android.com/develop/ui/compose/accessibility/api-defaults | Official minimum interactive target 48dp, semantics and accessible control defaults |
| S10 | https://github.com/material-components/material-components-android/blob/master/docs/components/LoadingIndicator.md | Official implementation docs: Expressive loading indicator for short waits below five seconds |
| S11 | https://github.com/material-components/material-web | Official web repository; inspect maintenance status/component coverage before choosing it |
| S12 | https://github.com/material-components/material-components-android/blob/master/docs/theming/Color.md | Official color-role implementation reference; semantic paired roles |
| S13 | https://m3.material.io/styles/typography/type-scale-tokens | Official type specification route; JS-only here; verify emphasized weights/axes before claiming exact values |
| S14 | https://m3.material.io/components | Official component index; JS-only here; use per-component guidance and actual SDK docs during implementation |
| S15 | https://github.com/material-foundation/material-color-utilities | Official theme utility discovery route; version/license must be checked before importing |
| S16 | https://api.flutter.dev/flutter/material/ThemeData/useMaterial3.html | Official Flutter API discovery route; check installed SDK and current API before implementation |

## Evidence rules
Record source URL + retrieval date + package version/commit + classification alongside any imported numeric token or component variant. Treat S5 values as a reproducible adapter baseline. When latest released SDK tokens differ, capture the delta and migrate as a versioned change, not a quiet correction.

Do not copy whole official sites or source files into this skill. Retain required license notices when incorporating third-party code/assets. The bundled runtime is original code using physical equations and factual constants. Do not import Google logos, proprietary fonts or Pixel artwork without an appropriate license. Use appropriately licensed Roboto/Material Symbols when available and honest fallbacks otherwise.

## Completeness boundary
This skill covers the workflow and inventory for a coherent application/system-style experience. It is not the complete Google SDK, all official documentation, or Pixel SystemUI source. Some official routes were JS-only; component-specific exact sizes and newly released APIs must be verified during implementation. No full Android OS clone is implied.
