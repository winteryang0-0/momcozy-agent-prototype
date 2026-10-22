# CS-0.6 · English style boards

Status: **candidate for testing, not approved or frozen**. This is an English (US) adaptation of the four [CS-0.6 boards](../CS-0.6-testboards/index.html), requested on October 21, 2026.

Open `index.html` locally, then choose Bloom Glass, Daily Orbit, After Rain, or Berry Poise. Each board has Today, Journal, and Momcozy AI preview tabs, a feedback scenario selector, and reduced transparency and motion toggles. The phone content is a sample; only the preview and test controls are interactive. No entry is actually saved or synced, and no AI analysis runs.

## Adaptation decisions

- All visible board copy, state labels, testing instructions, document titles, and accessible labels use US English. The four direction names match the names already present in CS-0.6.
- Task colors, SVG icon families, and frosted or liquid glass treatments are carried over from CS-0.6. A small English-only CSS layer allows longer labels to wrap.
- “Saved on this device” does not claim that syncing has completed. An unclear save status tells the reader to check the Journal before saving again. An inconclusive AI response does not identify a cause or make a diagnosis.
- The date and sample records are fixed for comparison. The HTML glass treatment approximates material effects; it is not an implementation of native operating-system Liquid Glass.

## Source and review boundary

Sources: the user's request for a native-sounding English HTML version (October 21, 2026); the local CS-0.6 candidate's `index.html`, four board pages, `assets/board.js`, visual assets, `design.json`, and `STYLE_SPEC.md`. The earlier Momcozy reference and design assumptions remain documented in the source candidate. This adaptation does not claim to reproduce official Momcozy product copy or components.

`node validate-en.cjs` checks local resources, English coverage, page and state switching, and test toggles using a mock DOM. Actual browser layout, visual comfort, native material behavior, and usability with English-speaking participants still need review.

`node build-en.cjs` regenerates the English HTML and shared visual assets from the adjacent CS-0.6 candidate. The generated pages do **not** need Node or the Chinese candidate folder to open.
