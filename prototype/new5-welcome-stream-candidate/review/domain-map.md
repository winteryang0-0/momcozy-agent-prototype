# Bounded domain and change map

Observed source dependencies in the previous prototype:
- app.js: momcozy-soft-companion-v3 records/profiles/prefs/deletedRecordIds; legacy conversations with items[].payload.messages.
- care.js: baby-scoped record operations and quick entry.
- onboarding.js: grouped family profiles, baby kind born/unborn, explicit none status, activeBabyId.
- companion.js: original geometry, semantic animation states, reduced motion, local WebGL/2D fallback.

New active boundaries:
- index.html → conversation.css / conversation.js → icons.js / companion.js / bundled Three.js.
- conversation state → reply timer and voice session → draft → immutable submitted snapshot → storage → proactive task outcome.
- records retain unknown fields through edit, save and backup. Existing record key and ID identities remain unchanged.
- history reads the legacy key without modifying old conversations.
- media sessions revoke objects/stop tracks; late permission and recognition callbacks cannot own a newer panel.

Full understand-anything runtime/domain workflow was unavailable through the supplied skill resource and local path. This document is a manually inspected bounded map, not a generated knowledge graph or full repository coverage claim.
