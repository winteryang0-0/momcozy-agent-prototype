# OS-style coverage and boundaries

Profile B means a coherent Google/Pixel-like experience across relevant surfaces. It does not authorize inventing native OS integration. S6 is a reference for the 2025 launch, not proof of the latest device behavior; update it against the target build if exact system fidelity is requested.

| Surface | App or prototype scope | Native boundary / evidence needed |
|---|---|---|
| System bars, edge-to-edge, safe areas | Match inset behavior; mock chrome only if useful and clearly a preview | Actual status/navigation bar control needs platform API |
| Launcher/home/widgets | Optional OS-concept demo, not required inside a normal app | Real launcher/widgets need Android components and widget lifecycle |
| Lock screen / ambient screen | Concept visualization only when requested | OS privileges and platform APIs; no imitation security guarantees |
| Notification shade / grouping | Reference grouping, dismissal continuity and depth | App cannot replace real system shade; deliver notifications via supported API |
| Quick Settings | Concept tiles and state feedback if building OS demo | Real tiles use system integration; web toggles cannot change device settings |
| Recents / app transitions | App route transitions can reference continuity | Real multitasking and cross-app animations are system-owned |
| Predictive back | In-app back navigation and interruptible reverse animation | Native platform gesture integration must be verified, web back is not equivalent |
| Settings / search | Reusable grouped rows, toggles, subpages, search states | Settings persist to real app state; sensitive OS settings require APIs |
| Permission dialogs / sharing / keyboard | Invoke native/browser APIs where available | Never draw a fake system permission sheet and claim permission was granted |
| Notifications / Live Updates | Honest in-app ongoing-task cards | Platform-specific notification/progress integration must be separately implemented |
| Volume/media/haptics | Usable app media controls and visual feedback | Device-wide volume and Pixel haptic behavior are not guaranteed on web |
| Foldables/tablets/desktop | Adaptive panes and navigation using available size | Test actual window changes; do not infer solely from user-agent |
| Wear OS | Separate round-display profile only if requested | Do not apply round-watch layouts to the phone app |

For a normal application, mark irrelevant OS surfaces not-used with the rationale “system-owned, application target”. For an explicitly requested whole-OS concept, include the visual surfaces and states but label integrations mock/unsupported. Never embed a full fake OS inside an ordinary app merely to satisfy the word “complete”.
