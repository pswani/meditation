# 03 Test Native History, Goals, Build, And Branding Defects

Run the native verification flow and capture results in `docs/test-ios-native-history-goals-build-branding-defects-feature.md`.

Required automated checks:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-history-goals-build-branding CODE_SIGNING_ALLOWED=NO build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-history-goals-build-branding-tests CODE_SIGNING_ALLOWED=NO build-for-testing`

Manual checks to document if possible:
- Goals shows one title.
- History can open the `Manual log` flow.
- The chosen meditation-type change path works on iPhone.
- The installed app label presents as `Meditation`.

If any check fails, capture it clearly and continue with `04-fix-ios-native-history-goals-build-branding-defects.md`.
