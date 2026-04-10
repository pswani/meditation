# Implement: iOS Native Runtime UX And Resilience

Objective:
- improve trust, recovery, and day-to-day usability in the native meditation flows

Primary outcomes:
1. Persist and restore active timer, `custom play`, and playlist runtime state across relaunch where practical.
2. Add direct numeric entry for timer duration, interval minutes, and manual-log duration while keeping validation calm and clear.
3. Make the backend-status message clearer so local-only mode does not look broken.
4. Replace immediate timer-default persistence with a more intentional save or reset workflow if that remains the best parity direction after code inspection.

Read before implementation:
- `docs/ios-native/parity-review-2026-04-10.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `docs/architecture.md`

In scope:
- active runtime snapshot modeling and restoration behavior
- timer, `custom play`, and playlist session recovery rules
- duration-entry controls and validation messaging
- settings draft state for timer defaults if introduced
- shell and settings presentation copy for local-only, configured-backend, and unavailable-backend states
- focused tests for recovery, validation, and presentation logic
- durable docs needed for the new behavior

Explicitly out of scope:
- unrelated media parity work
- broad redesign of Home, History, or Summary
- backend expansion beyond current sync configuration seams

Implementation guidance:
1. Treat trust and clarity as the primary product goals.
2. Preserve timer correctness across pause, resume, backgrounding, and early-end paths.
3. Do not add noisy confirmation or warning copy where a calmer explanation will do.
4. Prefer direct numeric entry that still remains touch-friendly on iPhone.
5. If full save or reset parity with the web app is too disruptive for this slice, choose the smallest calmer native pattern that prevents accidental changes and document the tradeoff.

Code quality expectations:
- keep recovery math and restoration logic in testable helpers
- avoid growing large view models without extracting focused state or domain helpers
- keep user-facing copy explicit and non-alarming

Verification expectations:
- add or update focused native tests for restoration, validation, and settings behavior
- run relevant native build and test commands
- run extra repo-wide verification if shared docs, shared contracts, or backend seams changed

Documentation updates required:
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-runtime-ux-resilience-feature.md`

Before handing off to review:
- summarize what changed in runtime state, settings behavior, and UX copy
- identify any recovery behavior intentionally deferred
- then continue to `02-review-ios-native-runtime-ux-resilience.md`
