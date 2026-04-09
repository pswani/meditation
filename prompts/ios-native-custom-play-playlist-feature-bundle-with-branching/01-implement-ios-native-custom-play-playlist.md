Read before implementation:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/ios-native-app-phased-plan.md`
- `docs/ios-native/README.md`

Implementation objective:
- Add native iPhone support for prerecorded `custom play` sessions and ordered playlist practice.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-ios-native-custom-play-playlist-feature.md` before making substantial code changes.

Required behavior:
1. Implement `custom play` creation, editing, deletion, and favorite handling in a native iPhone flow.
2. Support a realistic local media strategy for milestone scope, such as:
   - bundled sample audio
   - app-sandbox file references
   - documented placeholders where import is intentionally deferred
3. Implement `custom play` playback with calm controls and trustworthy runtime state.
4. Implement playlist creation, editing, reordering, and optional small gaps between items.
5. Support playlist runtime with clear current-item state and explicit logging behavior.
6. Reuse existing timer and `session log` concepts where that keeps the app coherent.
7. Keep the iPhone UI calm and touch-friendly instead of turning playlist management into a dense desktop-style editor.

Expected affected areas:
- `ios-native/`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Required tests:
- Add or update focused Swift tests for playback state, playlist ordering, derived durations, and logging behavior.
- Add UI or integration-level tests for the most failure-prone playback or playlist flows if practical.

Documentation updates:
- Update `requirements/decisions.md` for long-lived native audio or playlist decisions.
- Update `requirements/session-handoff.md` for the new repo state and recommended next bundle.
- Update `docs/ios-native/README.md` if simulator, file-import, or media setup instructions changed.

Verification after implementation:
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Suggested durable artifacts:
- `docs/execplan-ios-native-custom-play-playlist-feature.md`
- `docs/review-ios-native-custom-play-playlist-feature.md`
- `docs/test-ios-native-custom-play-playlist-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `feat(ios): add custom play and playlist journeys`
