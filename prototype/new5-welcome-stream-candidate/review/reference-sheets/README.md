# Home reference sheets update

Scope: home composer voice toggle, quick-record picker, feeding editor, crying recording and photo observation panels. Onboarding remains unchanged.

- Voice toggle sits inside input on the right, send remains a separate button.
- Main record types use original soft SVG illustrations and pastel tiles; remaining types stay available.
- Feeding keeps native values, baby ownership, validation and save contract, with three feeding tabs, illustration, presets and optional note/time controls.
- Recording contour and yellow-to-mint color depend on elapsed time; stopped recording retains playback and send controls.
- Photos retain original file selection and add optional time/count/observation fields forwarded to the result card.

Verification: tests/reference-sheets.cjs checks microphone placement, record artwork and actual amount persistence. tests/home-media.cjs has 22 checks including progress contour, photo notes, cancellation, failure, playback and reduced motion. tests/gestation-flow.cjs has 21 onboarding checks. Microphone tests use an injected recorder; no physical microphone certification. Media interpretation remains a local simulation, with no connected AI service.

Reference illustrations are code-native interpretations of the user screenshots, not copied raster assets.

Frozen baseline integrity: scripts/verify-repository.cjs passed R27 (270 files plus 4 metadata) and New5 (112 files). Structural material audit passed with the pre-existing fixed-fullscreen warnings.
