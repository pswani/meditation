# Workspace Docs Toolchain Clarity Test Results

Date: 2026-04-11

## Commands run

- `npm ci`
  - PASS
  - installed the clean worktree dependencies so the documented frontend commands could run
- `npm run typecheck`
  - PASS
- `npm run lint`
  - PASS
- `npm run test`
  - PASS with 47 test files and 333 tests
- `npm run build`
  - PASS
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
  - PASS with the renamed shared package module `MeditationNativeCore`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-workspace-docs CODE_SIGNING_ALLOWED=NO build`
  - FAIL on the first run because the clean worktree did not yet contain `local-data/media/custom-plays/vipassana-sit-20.mp3`
- `./scripts/setup-media-root.sh`
  - PASS
  - recreated the documented local media directories in the clean worktree
- `cp /Users/prashantwani/wrk/meditation/local-data/media/custom-plays/vipassana-sit-20.mp3 /tmp/meditation-workspace-docs/local-data/media/custom-plays/vipassana-sit-20.mp3`
  - PASS
  - supplied the current sample recording that the Xcode project still packages from `local-data/`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-workspace-docs CODE_SIGNING_ALLOWED=NO build`
  - PASS after the documented sample-recording setup
- `test -f .nvmrc && test -f .editorconfig`
  - PASS
- `rg -n '\]\(/Users/' README.md`
  - PASS via no matches, confirming the root README no longer contains absolute local filesystem links

## Claims validated directly

- The root README now provides a portable workspace map and no longer depends on absolute local filesystem links.
- The repo now exposes a minimal machine-readable baseline through `.nvmrc` and `.editorconfig`.
- The shared native Swift package now builds and tests as `MeditationNativeCore`.
- The native docs now accurately state that:
  - Xcode is the canonical app-development entrypoint
  - `swift test --package-path ios-native` covers only the shared core package
  - app-target builds still require the current local sample recording at `local-data/media/custom-plays/vipassana-sit-20.mp3`

## Environment-specific notes

- The Xcode build succeeded with `CODE_SIGNING_ALLOWED=NO` against a generic iOS Simulator destination after the documented local sample-recording setup.
- The current iOS app project is not yet a completely clean-checkout build: it still expects the local sample recording under `local-data/media/custom-plays/`.
- `swift test --package-path ios-native` required explicit module-cache environment variables in this environment, which is now reflected in the native README command example.
