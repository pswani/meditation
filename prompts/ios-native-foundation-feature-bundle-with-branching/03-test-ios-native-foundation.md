Read before testing:
- `AGENTS.md`
- `README.md`
- `requirements/session-handoff.md`
- `docs/ios-native/README.md`
- `docs/execplan-ios-native-foundation-feature.md`

Goal:
- Verify the native iOS foundation milestone thoroughly without widening scope.

Required automated verification:
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`
- run existing repo frontend or backend verification only if shared web or backend code changed

Required focused checks:
1. Confirm the app launches to a calm shell in simulator.
2. Confirm the primary destinations exist and are reachable.
3. Confirm sample content and previews do not imply real synced data yet.
4. Confirm the persistence layer initializes cleanly on first launch.
5. Confirm docs match the actual Xcode project name, scheme, and folder layout.

Artifact requirement:
- Create or update `docs/test-ios-native-foundation-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused check.
- Call out any residual risk that still needs manual validation on a physical device.
