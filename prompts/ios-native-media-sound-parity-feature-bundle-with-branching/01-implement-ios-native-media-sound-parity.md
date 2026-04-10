# Implement: iOS Native Media And Sound Parity

Objective:
- close the highest-trust media parity gaps between the web app and the native iOS app

Primary outcomes:
1. Align the native timer sound catalog with the web app contract.
2. Normalize legacy sound values cleanly.
3. Make native `custom play` and linked playlist recording behavior materially match the web app instead of placeholder playback.
4. Remove or replace user-facing copy that advertises placeholder behavior once parity is improved.

Read before implementation:
- `docs/ios-native/parity-review-2026-04-10.md`
- `docs/ios-native/README.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- any existing native media runtime or sync docs you touch

In scope:
- timer sound reference data, normalization, persistence, and playback behavior
- native audio asset selection and mapping strategy
- `custom play` domain and runtime behavior when linked to managed media
- playlist item runtime behavior for linked recording entries
- sync or snapshot model changes required to carry real media metadata safely
- focused unit, integration, or UI coverage for the changed behavior
- durable docs needed to explain the new media contract

Explicitly out of scope:
- unrelated navigation redesign
- backend feature expansion unrelated to existing media metadata
- broad refactors outside the touched media and runtime surfaces

Implementation guidance:
1. Treat the web app as the behavior source of truth for sound names, normalization, and user-facing semantics.
2. Remove `Wood Block` as a current native choice unless durable docs prove it should remain.
3. Prefer a shared asset or catalog contract over platform-specific hard-coded sound IDs.
4. Preserve local-first behavior if backend-linked media is absent, but do not silently fall back to misleading placeholder playback.
5. If full recording playback parity is impossible with the current repo assets, document the concrete blocker in the ExecPlan and stop short of faking parity.

Code quality expectations:
- keep media mapping logic out of large view bodies
- prefer explicit domain helpers and testable seams
- avoid leaking temporary implementation details into user-facing copy

Verification expectations:
- add or update focused tests for sound normalization and media mapping
- run the most relevant native test and build commands
- run repo-wide commands too if shared assets, shared contracts, or web-facing files change

Documentation updates required:
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-media-sound-parity-feature.md`

Before handing off to review:
- summarize the changed files
- note any unresolved parity risks
- then continue to `02-review-ios-native-media-sound-parity.md`
