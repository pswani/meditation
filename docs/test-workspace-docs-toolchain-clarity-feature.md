# Workspace Docs Toolchain Clarity Test Results

Date: 2026-04-11

## Commands run

- `npm run typecheck`
  - PASS
- `npm run lint`
  - PASS
- `npm run test`
  - PASS with 47 test files and 333 tests
- `npm run build`
  - PASS
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
  - PASS
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`
  - PASS
- `test -f local-data/media/custom-plays/vipassana-sit-20.mp3`
  - PASS
- `rg -n '/Users/' README.md`
  - PASS via no matches

## Claims validated directly

- The root README still acts as a portable workspace map and no longer depends on absolute local filesystem links.
- The contributor workflow and the macOS production install or release workflow are now separated more explicitly in `README.md`.
- The repo's machine-readable toolchain baseline now includes:
  - `.nvmrc` for Node 20.x
  - `package.json` `engines` for Node 20.x and npm 10+
  - `.editorconfig` for shared formatting defaults
- The native docs still point app development to `ios-native/MeditationNative.xcodeproj` and shared-core verification to `swift test --package-path ios-native`.
- The native package metadata still requires an explicit macOS deployment target for host-side SwiftPM compatibility, so the docs now explain that this is a test-host floor rather than a second app target.

## Environment-specific notes

- The Xcode build succeeded with `CODE_SIGNING_ALLOWED=NO` against a generic iOS Simulator destination in this macOS environment.
- The current Xcode project still expects the local sample recording at `local-data/media/custom-plays/vipassana-sit-20.mp3`; that file was already present in this workspace during verification.
- `swift test --package-path ios-native` succeeded with explicit module-cache environment variables in this environment.
