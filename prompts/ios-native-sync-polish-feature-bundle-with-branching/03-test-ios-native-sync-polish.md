Read before testing:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/session-handoff.md`
- `docs/ios-native/README.md`
- `docs/execplan-ios-native-sync-polish-feature.md`

Goal:
- Verify the native iOS sync and polish milestone thoroughly without widening scope.

Required automated verification:
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`
- run any relevant local backend checks required by the chosen sync scope

Required focused checks:
1. Confirm the app can run locally without sync and still stays usable.
2. Confirm configured backend sync paths use the expected base URL behavior for simulator and iPhone.
3. Confirm offline or backend-unavailable states stay calm and explicit.
4. Confirm sync does not silently overwrite trusted local state without a documented rule.
5. Confirm signing and Xcode run instructions are repeatable on a human workstation.

Artifact requirement:
- Create or update `docs/test-ios-native-sync-polish-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused check.
- Call out any residual real-device, signing, or backend-environment risk that still needs manual validation.
