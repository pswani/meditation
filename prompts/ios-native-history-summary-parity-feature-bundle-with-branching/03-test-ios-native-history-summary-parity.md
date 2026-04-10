Read before testing:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-history-summary-parity-feature.md`

Goal:
- Verify the native iOS History and summary parity slice thoroughly without widening scope.

Required automated verification:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Required focused checks:
1. Confirm History filters support the newly added parity behavior.
2. Confirm playlist or `custom play` context appears accurately in History if implemented.
3. Confirm Goals summary supports all intended range presets, including custom range if added.
4. Confirm by-time-of-day summary rows are correct and readable.
5. Confirm invalid custom ranges fail calmly and explicitly.

Artifact requirement:
- Create or update `docs/test-ios-native-history-summary-parity-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused check.
- Call out any residual device-only risk.
