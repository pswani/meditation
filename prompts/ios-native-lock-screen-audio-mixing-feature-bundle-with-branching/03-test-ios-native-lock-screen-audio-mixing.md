# 03 Test Native Lock-Screen Audio And Mixing Improvements

Run the native verification flow and write `docs/test-ios-native-lock-screen-audio-mixing-feature.md`.

Required automated checks:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-lock-screen-audio-mixing CODE_SIGNING_ALLOWED=NO build`

Required manual checks to document if a physical iPhone is available:
- start a fixed timer with an end sound, lock the screen, and observe completion behavior
- repeat while another audio app is already playing
- verify whether the chosen audio policy mixes, interrupts, or ducks the competing audio, and confirm that this matches the implementation decision
- verify `custom play` audio still behaves as expected under the same policy

If physical-device checks are not available:
- say so explicitly in the test doc
- capture the exact manual steps still required

Any failure or unresolved device risk should flow into `04-fix-ios-native-lock-screen-audio-mixing.md`.
