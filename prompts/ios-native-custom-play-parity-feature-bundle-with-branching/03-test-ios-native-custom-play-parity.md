Read before testing:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-custom-play-parity-feature.md`

Goal:
- Verify the native iOS `custom play` parity slice thoroughly without widening scope.

Required automated verification:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Required focused checks:
1. Confirm native `custom play` creation and editing supports the newly added parity fields.
2. Confirm `Apply To Timer` updates timer setup correctly.
3. Confirm `custom play` runtime still starts, pauses, resumes, completes, and ends early correctly.
4. Confirm any new metadata appears accurately in the relevant UI.
5. Confirm placeholder-media guidance remains calm and explicit.

Artifact requirement:
- Create or update `docs/test-ios-native-custom-play-parity-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused check.
- Call out any residual device-only risk.
