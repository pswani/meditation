# Test: iOS Native Lock-Screen Audio Mixing

## Commands run

### Swift package tests
- Command:
  - `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- Final status:
  - Pass
- Notes:
  - shared native-core tests passed

### Native app build
- Command:
  - `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-lock-screen-audio-mixing CODE_SIGNING_ALLOWED=NO build`
- Final status:
  - Pass
- Notes:
  - the app target compiled successfully after the mixed playback-session policy and the near-end fixed-timer background bridge were added

### Native test build
- Command:
  - `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-lock-screen-audio-mixing-tests CODE_SIGNING_ALLOWED=NO build-for-testing`
- Final status:
  - Pass
- Notes:
  - the app, unit-test, and UI-test targets compiled successfully
  - this additional compile check covered the new app-target XCTest cases for the playback mixing policy plus the near-end timer background bridge

## Manual physical-iPhone checks
- Physical-device checks were not executed in this environment.
- Remaining manual steps:
  - start a fixed timer with an end sound, lock the screen during the last 20 to 25 seconds, and confirm whether the selected end bell fires before suspension or the system notification carries completion instead
  - repeat while another audio app is already playing and confirm that the other app continues while the timer cue is still audible
  - start a `custom play` while another audio app is already playing and confirm the recording mixes instead of interrupting the competing audio
  - lock the screen much earlier in a fixed timer and confirm the documented fallback remains truthful: local-notification sound or foreground catch-up, not guaranteed app-driven bell playback
