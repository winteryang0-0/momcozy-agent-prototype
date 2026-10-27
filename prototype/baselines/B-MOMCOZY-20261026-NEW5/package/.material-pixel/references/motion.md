# Motion contract

## Official foundations and pinned constants
S3 defines expressive and standard physics schemes. S5 distinguishes spatial changes from effects. Use spatial for position/size/shape, effects for alpha/color. These numeric presets are verified against the pinned S5 implementation, not asserted to be the latest SDK values:

| Scheme | Role | Damping ratio | Stiffness (unit mass) |
|---|---|---:|---:|
| expressive | fast spatial | 0.6 | 800 |
| expressive | default spatial | 0.8 | 380 |
| expressive | slow spatial | 0.8 | 200 |
| standard | fast spatial | 0.9 | 1400 |
| standard | default spatial | 0.9 | 700 |
| standard | slow spatial | 0.9 | 300 |
| either | fast effects | 1 | 3800 |
| either | default effects | 1 | 1600 |
| either | slow effects | 1 | 800 |

Choose expressive by default for this B profile. Use official component motion if available. Speed-role mapping below is project policy and yields to a verified component spec. Never mix damping from one preset with stiffness from another and call it official.

## Event → motion mapping (project policy)
| Event | Spatial | Effects | End condition |
|---|---|---|---|
| Press/release, toggle, chip selection | fast | fast | Input state reflected, focus visible |
| Menu, card expansion, local content replacement | default | fast/default | Stable bounds and correct semantic state |
| Sheet, prominent shared container, large-pane transition | default/slow | default | Modal/route fully usable |
| Screen change | default; shared geometry only with identity | default | New heading focused/announced, back stack preserved |
| Dismiss item | direct drag, then spring settle/remove | fast | Removal committed or reversible |
| Progress and loading | component-specific loop | legible stable status | Real completion/failure/cancel event |

Animate incoming/outgoing content to explain structure. Fade unrelated scenes rather than inventing a shared element. Prevent text distortion during container resizing: separate content and bounds layers. Avoid `transition: all`, a single duration for every state, unrestricted spring opacity, or an easing-only CSS transition described as physics.

## Interruption, gestures and lifecycle (project policy)
Retarget from current position AND velocity. Keep one owner per property. During drag follow actual pointer position; apply release velocity only at release. Handle pointercancel, scroll takeover, direction reversal, rapid repeats and back during transition. Do not commit destructive action based only on animation completion. Dispose animation frames on unmount and stop decorative loops offscreen/background. Preserve process state while the app is hidden.

Reduced motion must disable spatial overshoot/large movement and replace looping shapes with a static status or restrained effect. Respond to preference changes while animation is running. Focus and successful operation must never depend on waiting for animation. For web use the supplied analytic adapter or a validated spring library; do not equate CSS duration with stiffness. Clamp alpha and bounded values.

## Pixel references (S6)
Notification dismissal can influence neighboring items; shade depth can use contextual blur; a slider or expanded control can respond fluidly. Treat these as observed system inspiration. Actual haptic patterns, gesture thresholds, timings, blur radii and SystemUI geometry are not specified here. Web vibration support is not Pixel haptic fidelity. Do not promise native predictive back in a standalone HTML preview.

## Motion specification per interaction
Record: trigger; source/destination state; animated property; coordinate origin; scheme/role; velocity; interrupt/cancel rule; semantic/focus change; reduced-motion alternative; completion event; test evidence. For actual Pixel matching, attach target device/build, recording and side-by-side validation before claiming fidelity.
