---
name: google-material-pixel
description: Build, migrate and audit UI with strict Google Material 3 Expressive rules and Pixel-inspired visual and motion behavior. Use when the user requests Material Design, M3 Expressive, Google/Pixel OS style, UI animations, loading/process animations, or a next version of a project already bound to this skill. Covers HTML/Web, Flutter and Android Compose with pinned tokens, component states, process state machines, source provenance and release gates. 中文触发：谷歌设计、Material、Pixel风格、整套OS设计、严格执行、交互动画、过程动画、下一版沿用。
---

# Google Material · Pixel

## Contract
- Default to profile **B: Google/Pixel fidelity**, not a brand-first remix. Use M3 Expressive for the application and separately identify Pixel system inspirations. Do not equate a themed app with an implemented operating system.
- Honor explicit user changes. Within this project's visual decisions, prefer this skill over generic frontend taste skills; retain their engineering/accessibility advice. Do not blend Liquid Glass, neumorphism or unrelated OS styling without a requested profile change.
- Treat existing business logic, data and authored AI characters as assets to preserve. Do not delete them to achieve visual fidelity. Integrate the character as content, not as a replacement for controls or progress status.
- Baseline reviewed **2026-10-25**, skill version **1.2.0**. “Latest” means checked official sources on that date, not an evergreen claim. Before a new major version, check sources and actual dependency versions; freeze changes within a release. Do not silently update a validated baseline.
- Distinguish `official`, `pixel-reference`, `project-policy`, and `approximation` evidence. Never label invented timings, inferred gestures, or CSS adaptations as Google specifications.

## Required workflow
1. Inspect project rules, package versions, entry points, persistence, existing tokens and component registry. Establish target platform. Do not assume the current project is Flutter because another project was.
2. Read [sources](references/sources.md), [foundations](references/foundations.md), [components](references/components.md), [motion](references/motion.md), [processes](references/processes.md), [OS scope](references/os-scope.md) and the relevant section in [platforms](references/platforms.md).
3. Bind a requested project with `python <skill>/scripts/bind_project.py <project-root>`. This preserves existing AGENTS.md and adds a scoped contract plus portable resources under `.material-pixel/`. Review existing rules before binding. Do not bind unrelated projects. If the user only requests installing the skill, finish installing without searching for or modifying their apps.
4. Inventory every screen/component/process in `.material-pixel/coverage.json`. Mark each catalog item implemented, not-used, deferred or unsupported, with a reason and evidence. Read [acceptance](references/acceptance.md). Never silently omit unimplemented items while claiming complete conformity.
5. Choose a stable, Google-like tonal theme; generate semantic color roles with a pinned official theme utility where available. Starter colors are a project sample, not Pixel's canonical palette. Use shared type, shape, surface, state and motion tokens. Build reusable primitives before page styling.
6. Implement states before animations. Connect effects to actual application events. Use paired spatial/effects tracks, interruption handling and reduced motion. Reuse `assets/web/spring.mjs` for web physics when appropriate; it is an original adapter, not an official SDK.
7. Test the behavior, not just the appearance. Include real persistence reload, failure/retry, rapid interaction, interruption, back/cancel, keyboard, narrow viewport, large text, dark mode and reduced motion.
8. Run `python <skill>/scripts/audit_project.py <project-root>` for manifest/evidence checks and heuristic warnings. This is not a screenshot or runtime verifier. Record genuine runtime/visual checks, unresolved limitations and deviations in `coverage.json` before release.
9. Perform a second challenger pass using [acceptance](references/acceptance.md). If independent agents are available, give an agent only the artifacts and user task, not your conclusions. Repair critical issues; do not permit a self-declared checklist to substitute for tests.
10. Report implemented scope, validation and remaining approximations. Say “strict target with documented gaps” when anything remains deferred/unsupported. Never promise automatic cross-conversation enforcement: project binding or explicit invocation is required.

## Motion and surface atlas
- For detailed transitions, microinteractions and background UI, read [the atlas](references/motion-surface-atlas.md). Its M01–M20 entries are design contracts, not claims of completed demo coverage.
- Use `assets/web/motion-lab.html` as a self-contained reference with explicit mock processing and actual local saving. It demonstrates only the subset listed in the atlas. Do not copy demo palette, mock data, navigation or storage into an existing app without integrating its real state.
- Keep provenance and focus/reduced-motion/interruption rules when adding an interaction. Record every unimplemented gesture or native integration.

## User screenshot flower-state profile
- When the user requests the screenshot-inspired unified flower controls, read [flower state controls](references/flower-state-controls.md) and use `assets/web/flower-state-ui.html` as an adapted reference. User-confirmed behavior: gray stationary off, blue rotating on across enable/disable features, stationary center glyph, separately explained unavailable/error states.
- Treat this as an opt-in project profile, not an official Material component or a universal override for unrelated projects. Do not apply on/off semantics to one-shot save actions.
- Keep real service callbacks as the source of state; do not copy mock 500ms delays into production. Scope petal styling to its own path, keep toggle names stable, stop stable off/error/disabled rotation, and stop loops with reduced motion or offscreen visibility.

## Read on demand
- [Sources and update policy](references/sources.md): authority, retrieval limitations and provenance.
- [Foundations](references/foundations.md): color, type, shape, density, layout, icons, accessibility.
- [Component contract](references/components.md): complete family inventory and required state coverage.
- [Motion contract](references/motion.md): spring roles, interruption, transitions, gesture behavior.
- [Process contract](references/processes.md): loading, upload, recording, AI, saving, connection flows.
- [OS scope](references/os-scope.md): app-level patterns vs actual system-owned surfaces.
- [Platform mapping](references/platforms.md): web, Flutter, Compose capability differences.
- [Acceptance gates](references/acceptance.md): tests and second-challenger questions.

## Assets and commands
- `assets/tokens.json`: versioned, attributed semantic starter tokens and spring constants.
- `assets/web/theme.css`: light/dark starter role aliases and accessibility scaffold; not a complete component library.
- `assets/web/spring.mjs`: interruptible analytic spring adapter, including reduced-motion changes.
- `assets/project/AGENTS.fragment.md`: scoped enforcement text.
- `assets/project/coverage.json`: strict evidence contract, initially incomplete.
- `scripts/bind_project.py`: install portable project rules without overwriting existing resources.
- `scripts/audit_project.py`: validate coverage and evidence paths; warn on risky style shortcuts.

Do not invent unsupported features, fabricate evidence paths, classify every component not-used without comparing actual UI, use progress animations to pretend data was saved, or promise pixel-perfect Pixel reproduction without a pinned device/build reference and comparative capture.
