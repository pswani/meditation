# Review: Media Surface And CI Hardening Feature

Date: 2026-04-16

## Findings

No blocker, high, or medium findings were identified in this review.

## Review Summary

- Backend media serving is materially tighter:
  - [`backend/src/main/java/com/meditation/backend/config/MediaStorageProperties.java`](/Users/prashantwani/wrk/meditation/backend/src/main/java/com/meditation/backend/config/MediaStorageProperties.java) now validates the configured media root, rejects unsafe child-directory configuration, and exposes explicit `custom-plays` plus `sounds` paths.
  - [`backend/src/main/java/com/meditation/backend/config/WebConfig.java`](/Users/prashantwani/wrk/meditation/backend/src/main/java/com/meditation/backend/config/WebConfig.java) now maps only `/media/custom-plays/**` and `/media/sounds/**` instead of exposing the whole configured root through one broad `/media/**` handler.
  - [`backend/src/test/java/com/meditation/backend/media/MediaAssetControllerTest.java`](/Users/prashantwani/wrk/meditation/backend/src/test/java/com/meditation/backend/media/MediaAssetControllerTest.java) now proves that served custom-play and sound paths still work while unrelated sibling directories under the media root stay unserved.
- Offline media behavior is safer and more explicit:
  - [`public/offline-sw.js`](/Users/prashantwani/wrk/meditation/public/offline-sw.js) no longer reconstructs partial responses by loading the full cached media file into memory.
  - The worker now caches only whole-file media responses within a bounded size limit, keeps only a bounded number of retained recording files, and returns an explicit offline failure for range requests it cannot truthfully satisfy.
- CI and hygiene enforcement now match the repo’s real workflow:
  - [`.github/workflows/ci.yml`](/Users/prashantwani/wrk/meditation/.github/workflows/ci.yml) calls `./scripts/pipeline.sh verify` for the web or backend gate, runs `swift test --package-path ios-native`, and builds the iOS app target with `xcodebuild`.
  - [`scripts/check-repo-hygiene.sh`](/Users/prashantwani/wrk/meditation/scripts/check-repo-hygiene.sh) blocks the generated and runtime artifact classes this repo already expects to stay out of diffs.
  - [`ios-native/MeditationNative.xcodeproj/project.pbxproj`](/Users/prashantwani/wrk/meditation/ios-native/MeditationNative.xcodeproj/project.pbxproj) now includes `GeneratedSyncContract.swift` in the app target, which closes the mismatch between passing SwiftPM tests and the previously failing Xcode app build.

## Residual Risk

- Offline playback now behaves more honestly, but some browser media stacks may still require a live network response for byte-range requests even after a whole-file recording was cached earlier.
- The new CI workflow builds the iOS app target and runs Swift package tests, but it still does not execute full simulator UI tests on GitHub-hosted runners.
