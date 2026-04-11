# Test: iOS Native Runtime Device Defects

Goal:
- verify that the reported native defects are actually fixed and that the scope stayed bounded

Minimum verification:
1. Run the relevant native build and test commands for the touched runtime and audio areas.
2. Confirm the timer duration quick-adjust control now steps by 1 minute.
3. Confirm the tapped-outside keyboard-dismiss behavior matches the changed numeric field flow.
4. Confirm backend configuration now reaches the correct native state:
   - configured and syncing, or
   - configured but unreachable, with truthful messaging
   It should no longer claim `base URL is configured` when configuration is actually present.
5. If possible, validate timer or meditation sound playback on a physical iPhone with the silent switch enabled.

Suggested commands when applicable:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`
- any concrete simulator or device run used to exercise keyboard, backend, or audio behavior

Record results in:
- `docs/test-ios-native-runtime-device-defects-feature.md`

The test doc should include:
- commands run
- pass or fail status
- whether each of the four reported defects was verified directly or only by code inspection
- exact physical-device limitations if silent-mode audio or backend reachability could not be fully exercised in this environment

When complete:
- summarize the most important verification result
- then continue to `04-fix-ios-native-runtime-device-defects.md`
