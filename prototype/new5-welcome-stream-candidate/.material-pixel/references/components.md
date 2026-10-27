# Component/state catalog

Use S14 and the installed official SDK to verify exact variants, dimensions and API support. The table is this skill's required implementation inventory, not a claim that every listed pattern has a shipped Expressive component on every platform. Grouping rules below are project policy. For each family record used/not-used/deferred/unsupported plus source, implementation, evidence, and any approximation.

All actionable components: enabled, hovered where relevant, focus-visible, pressed, disabled, selected if applicable; pending/error where an operation is involved. State layers must use the component's foreground role and never conceal labels. Keyboard equivalents are mandatory.

| ID / family | Selection and behavior contract | Motion/state requirements |
|---|---|---|
| buttons | Filled primary, tonal supporting, outlined/text low emphasis; keep clear action hierarchy | Press/release, focus, disabled, pending; do not shrink label layout while saving |
| icon-buttons | Label every action; distinguish action from toggle | Selected/unselected semantics; avoid relying on icon color alone |
| button-groups | Related actions; connected emphasis only when function supports grouping | Neighbor width/shape change may be approximated; preserve touch targets |
| split-buttons | Main action plus distinct menu affordance | Independent hit targets, menu expanded state and focus restoration |
| fab | Dominant contextual action; extended variant when label helps | Collapse/expand with context; don't obscure content |
| fab-menu | Action family from a single entry point | Anchor continuity, scrim only if modal, dismiss/back and focus management |
| chips | Filters, choices, suggestions or assistance; declare semantic role | Selection, removal, disabled and selected state; no fake navigation semantics |
| cards | Group coherent content and actions | Card-to-detail continuity only for actual identity; no nested competing click targets |
| lists | Stable readable row anatomy and separators/grouping | Insert/remove/reorder without jumping reading position; persistent row identity |
| navigation | Bar/rail/drawer based on available layout and destinations | Active indicator, labels, back stack and destination state preservation |
| tabs | Peer content under one navigation destination | Selected indicator tracks destination; proper keyboard/tab-panel semantics |
| app-bars-toolbars | Screen title/navigation plus scoped actions | Scroll response respects reading; do not hide essential controls permanently |
| menus | Anchored contextual actions | Open placement, escape/back, keyboard movement and return focus |
| sheets | Supporting flow; modal or persistent explicitly | Drag only when supported, scroll/drag arbitration, dismiss/cancel/back and keyboard insets |
| dialogs | Blocking decision or focused task only | Trap focus, inert background, explicit title, close policy and focus restore |
| text-fields | Persistent label, helper/error text, appropriate input mode | Focus/filled/error/disabled; preserve entered data on failure |
| selection-controls | Checkbox multiple, radio exclusive, switch immediate setting | Accessible state, no ambiguous immediate vs saved setting behavior |
| sliders | Bounded numeric adjustment with keyboard/alternative input | Drag follows pointer, value feedback; avoid making physics distort actual value |
| search | Query entry, results, suggestions and clear action | Empty/query/loading/results/no-results/error; cancel restores context |
| pickers | Date/time/value selection appropriate to task | Selected, invalid, unavailable, keyboard and locale behavior |
| snackbar | Brief outcome or reversible action | Does not replace durable errors; accessible announcement; sufficient action time |
| tooltip | Supplemental label/help | Keyboard accessible, hover is not the only route; never sole essential instruction |
| badges | Compact count/status | Accessible text and capped overflow; no distracting perpetual pulse |
| progress | Measured or indeterminate ongoing task | Actual progress only; label, cancel/retry as applicable |
| loading-indicator | Short indeterminate waits; see S10 | Shape-morph implementation or declared fallback; not a percentage display |
| carousel | Browsable ordered collection | Selected position, swipe + controls, no unsolicited auto-advance |
| dividers | Structural grouping | No redundant decoration; stable visual hierarchy |

## Binding component tokens
For each used component record its color-role assignments, type role, shape, spacing, hit target, state layer, elevation, focus treatment and motion role. Resolve these through a shared primitive/registry. Do not generate per-page variants that only look approximately related. Include a source/SDK version on the registry entry.

## Incomplete platform support
Use the closest supported official component where behavior is correct. If a missing Expressive component is essential, implement a tested adapter and label it approximation. Do not silently substitute a different design system or invent a fully official-looking class name. Record missing fidelity in coverage and release notes.
