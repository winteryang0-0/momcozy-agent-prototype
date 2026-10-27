# Onboarding topics and related support candidate

Updated the current English/blue candidate only. Removed standalone gender preview and birthday edit icon. Calendar year/month selectors share one row; six-row calendar checked at 832x879, 390x844 and 320x650.

Six parent topics follow the uploaded reference: My sleep (1), Baby's sleep (5), Feeding & growth (6), Milk supply & nursing (6), Postpartum recovery (2), Mood & stress (1). English wording is adapted without promises of medical diagnosis or treatment.

Flow: topics -> related support -> review -> save. Multiple topics form a deduplicated service pool. At most six options are randomly sampled without replacement; smaller pools show all. Suggestions persist with the draft and remain stable on return/reload. Changing topics recalculates suggestions and removes selections no longer displayed. Empty topic selection permits continuing without services. Saved services are preferences only, not connected live services.

Validation: 34 browser flow assertions passed, plus button hover/press/release color regression. Independent layout screenshots and review: ../compact-calendar-services/. Source changes: assets/conversation.js, assets/onboarding.css; standalone HTML rebuilt.

## Latest refinement
Topics now use single-column rows; year/month selectors have equal widths. Six topic and 21 service SVGs have distinct semantic drawings. Service page appears only for a combined related pool of at least four items (still capped at six); smaller pools skip directly to review without automatic selection. Standalone gender preview absent in generated HTML. 39 browser assertions passed, including exact-four threshold, fewer-than-four skip, icon differentiation and single-column layout. Screenshots: topics-single.png, services-icons.png.

Related support options now also use full-width single-column rows, with icon, label and check aligned horizontally. Rebuilt standalone and passed 39 existing flow checks; services-icons.png refreshed.

## Voice supplement
Service page has a secondary voice entry above Continue. A modal sheet uses browser SpeechRecognition (en-US, 30 seconds), editable transcript, local keyword suggestions and explicit Use this. Existing selections are merged, not replaced. Cancel and Escape abort recognition and preserve prior data. Unsupported/denied recognition offers typing. Review includes editable In your own words; confirmed note persists with profile. No external AI mapping or audio storage is implemented. tests/onboard-voice.cjs passed 44 assertions covering typed fallback, suggestions, apply, cancel and persistence; real microphone transcription depends on browser support and has not been device-tested.

## Hold-to-talk
Entry/retry use a 220 ms hold threshold; pointer or keyboard release stops recognition and opens transcript review. Tap does not record. Pointer cancellation/blur abort; recognition callbacks are session-guarded. A 2.5 second finalization fallback preserves interim text and aborts stalled recognition. 30 second cap retained. 47 browser checks passed with mocked speech events, including tap/hold/release, review/apply/cancel and saved note. Real microphone transcription remains browser/device dependent and unverified.

## Floating voice / direct transcription
Entry label: Tell me your thoughts. Recording overlay is centered, width <=320px, detached from bottom. Release automatically stores transcription and returns to the same page with editable inline text; no Use this or second confirmation. Empty results preserve prior note and selections. Errors close overlay and expose typing. Voice does not change selected service choices. Review note can be edited inline. 48 mock-recognition browser assertions passed. Real microphone remains unverified.
