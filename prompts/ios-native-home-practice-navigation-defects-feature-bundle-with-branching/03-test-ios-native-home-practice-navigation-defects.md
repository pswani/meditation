# 03 Test Native Home And Practice Navigation Defects

Run the native verification flow and record results in `docs/test-ios-native-home-practice-navigation-defects-feature.md`.

Required automated checks:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-home-practice-navigation-defects CODE_SIGNING_ALLOWED=NO build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-home-practice-navigation-defects-tests CODE_SIGNING_ALLOWED=NO build-for-testing`

Manual checks to document if a simulator or device is available:
- Home shows one title.
- Practice shows one title.
- Favorite `custom play` shortcuts can start from Home while offline when bundled or cached media is available.
- Practice featured and full-library `custom play` flows expose a working `Start` action.
- Practice -> `custom plays` -> back returns cleanly to Practice.

If any check fails:
- capture the failure clearly in the test doc
- stop before merge
- continue with `04-fix-ios-native-home-practice-navigation-defects.md`

If all checks pass, still continue with `04-fix-ios-native-home-practice-navigation-defects.md` to reconcile any review findings.
