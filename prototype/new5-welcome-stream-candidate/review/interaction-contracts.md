# Interaction contracts — target adaptation

| ID | Before / trigger | Immediate feedback | Stable outcome | Cancel / failure |
|---|---|---|---|---|
| T-chat | Text submitted | User turn + thinking + stop | Local reply or missing-field task | Stop clears timer; no late reply |
| T-voice | Hold | Listening label + companion | Editable transcript, explicitly confirmed | Slide up cancels; denial/unsupported text fallback; session invalidation |
| T-record | Entry shortcut / parsed intent | Needs-detail capsule | Complete review | Cancel does not write |
| T-edit | Open/edit fields | Native field feedback | Updated draft requires confirmation | Close snapshots form values by draft ID |
| T-save | Confirm review | Disabled button + saving label | One saved record + written confirmation | Failed write keeps draft and retry; frozen submitted snapshot |
| T-proactive | Open page, actual profile/records | Basis visible beside question | Feeding task completed for saved baby only | Snooze 30 min / dismiss today / restore |
| T-baby | Choose baby | Header changes + toast | Correct future record scope | Existing draft retains original baby |
| T-delete | Delete record | List removes item + undo notice | Tombstone retained | Undo restores record, including while modal open |
| T-onboard | Step submit | Step indicator and new question | Profile saved only at final step | Back retains values; permission explanation last |
| T-audio | Start recording | Permission / recording / playback | Local replay | Tracks stop on close; no diagnostic analysis |
| T-photo | Choose image | Immediate local preview | Explicit no-analysis status | Close revokes object URL |
| T-panel | Menu/secondary flow | Modal with title and focus containment | Escape/back returns to context | Focus restored; asynchronous ownership invalidated |

Debug panel: Settings → interaction verification. Failure and delay injection are deliberate test controls; event logs contain IDs, time and state only. Clearing event logs does not erase user data.

Independent challenger reviewed source and exercised custom/pump flows. Findings fixed: custom completeness; maternal ownership/visibility; draft retention; saved-baby task scoping; immutable save; none/unborn stage handling; late voice ownership. Additional edge tests cover late voice with a stub, not real speech service.

Verification mapping: main results 1–4 cover T-proactive; 5–8 T-record/T-save; 9–12 T-edit/custom/maternal; 13–16 error/undo/cancel; 17–20 T-onboard/reduced; 21–24 legacy and cross-baby; 25–30 escaping/media/layout/runtime. Edge results 1–9 cover file, none stage, async voice, form ownership, Escape, scaling and reduced motion. All results are assertions, not a claim of exhaustive state-space coverage.
