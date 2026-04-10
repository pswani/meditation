# Test: iOS Native Media And Sound Parity

## Commands run

### Native package tests
- Command:
  - `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- Final status:
  - Pass
- Notes:
  - focused native package tests passed, including the updated timer-sound normalization and sync media mapping coverage

### Native app build
- Command:
  - `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-media-sound-parity CODE_SIGNING_ALLOWED=NO build`
- Final status:
  - Pass
- Notes:
  - the first rerun surfaced an in-scope compile miss in `PlaylistItemEditorView` after the environment-aware playback validation change
  - after passing the playback-resolution closure into the editor view, the build succeeded
  - the build still emits the pre-existing malformed `Resources` group warning

## Repo-wide commands
- Not run.
- Reason:
  - this bundle changed only native iOS code, native docs, and native packaging metadata; it did not change frontend runtime assets or shared web contracts that require repo-wide Node verification

## Environment limitations
- No connected physical iPhone validation was performed in this session.
- No live backend-hosted remote recording playback check was performed from a native device or simulator configured with `MEDITATION_IOS_API_BASE_URL`.

## Remaining manual checks
- Verify `Temple Bell` and `Gong` cues on a real iPhone.
- Verify bundled `Vipassana Sit (20 min)` sample playback for `custom play` and playlist-linked items on a real iPhone.
- Verify backend-linked recording playback and unavailable-media messaging with a configured reachable backend base URL.
- Verify pause, resume, and interruption behavior during active recording playback.
