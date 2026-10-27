# Process animations and state machines

The following state machines are project policies. S10 supports the choice of Expressive loading for short waits; it does not prescribe these business workflows.

## Common model
Represent operation state independently of animation state:
`idle → validating → pending → success | error | cancelled`.
Where relevant pending contains connecting, uploading, processing, streaming or saving. Define legal transitions and guards. Capture a request/generation ID and reject stale responses. Disable duplicate submission or implement explicit idempotency. Abort and cancel are different from success. Preserve recoverable data.

| Process | Required states | Honest UI/animation | Recovery |
|---|---|---|---|
| Short load | idle/loading/loaded/error | Expressive shape loop for expected short wait; stable label | Error + retry, no endless spinner |
| Long task | pending/progress/completed/failed/cancelled | Determinate only when actual work total is known; otherwise stages/status | Cancel or explain non-cancellable stage; background continuation policy |
| Save record/profile | editing/invalid/saving/saved/save-failed | Keep form dimensions; show saved only after storage acknowledgement | Preserve text; retry; reload verifies saved values |
| Upload/photo | chosen/validating/uploading/processing/ready/failed | Real transferred bytes for upload; processing separate | Remove/retry/cancel; reject stale completions |
| Microphone | permission-request/denied/ready/recording/stopped/processing/result/error | Waveform tied to real samples or marked demo; time tied to recording | Stop tracks, retry permission, delete recording |
| AI response | submitting/waiting/streaming/complete/error/cancelled | Partial content remains readable; indicator within active response | Stop generation, retain partial content, retry without duplicates |
| Bluetooth/device | unavailable/permission/scanning/found/connecting/connected/lost | Distinguish discovery from connection and data readiness | Retry/reconnect, explicit timeout and manual fallback |
| Pull refresh | idle/pulling/armed/refreshing/success/error | Gesture tracks input; one active request | Return to resting state, preserve existing content |
| Delete | confirm/deleting/deleted/failed/undo-pending | Remove after acknowledgment or explicit optimistic rollback | Undo only if real operation supports restoration |
| Empty/offline | first-use/empty/filter-empty/offline/stale | Static useful next action; retained data labelled stale | Retry/network recovery without wiping records |

## Required process rules
- Never advance a progress percentage by timer to simulate real work. Demo simulation must be labeled as such in the prototype and evidence.
- Never impose a fake minimum wait to show a beautiful animation. Fast successful operations can complete immediately.
- For slow work provide context and a next action; thresholds/timeouts are product-specific and recorded as project policy.
- Do not animate raw clinical values as though intermediate numbers were measured results.
- Use `aria-busy` on the updating region and restrained live announcements at stage boundaries. Do not announce every frame or percentage.
- Cancel pending UI updates when a view is disposed; decide separately whether the underlying operation should continue.
- Keep error information persistent near its source. A fleeting snackbar alone is insufficient for failed save or blocked permission.

## Existing mother/baby app application
Keep baby's and mother's name inputs editable and persistent; test long Chinese and Latin names. Keep the current AI character and its original colors as content unless explicitly asked to replace it. Let listening/thinking/speaking character states follow the process state, but keep text and control status independent. Preserve today's-card expand/collapse, composer visibility, recording, upload and local save behavior during migration. Test desktop-local-file storage separately from sandbox previews. Do not silently reset user records as part of theming.
