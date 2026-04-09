Read before testing:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-custom-play-playlist-feature.md`

Goal:
- Verify the native iOS `custom play` and playlist milestone thoroughly without widening scope.

Required automated verification:
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Required focused checks:
1. Confirm a `custom play` can be created and started.
2. Confirm playback pause, resume, completion, and early stop behave correctly.
3. Confirm playlists preserve item order and computed total duration.
4. Confirm playlist runs log outcomes clearly and without duplication.
5. Confirm empty, missing-media, and invalid-reference states are calm and actionable.

Artifact requirement:
- Create or update `docs/test-ios-native-custom-play-playlist-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused check.
- Call out any residual device-only audio risk that still needs physical iPhone validation.
