# Test Report: Native iOS Summary And Sankalpa Feature

## Date
- 2026-04-09

## Automated Verification
- Pass: `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- Pass: `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-summary-sankalpa CODE_SIGNING_ALLOWED=NO build`
- Fail in this environment: `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-summary-sankalpa CODE_SIGNING_ALLOWED=NO test`
  - Xcode reported that `MeditationNativeTests` and `MeditationNativeUITests` must run on a concrete simulator device, and this environment did not have a usable CoreSimulator runtime.

## Focused Checks
- Pass: Home surfaces progress without clutter.
  - Verified by the compiled `HomeView` implementation plus the new single-surface layout for quick start, today totals, active `sankalpa`, and recent session context.
- Pass: summaries render meaningful totals and filters for milestone scope.
  - Verified by `summaryDerivationIncludesOverallTypeAndSourceCoverage()` and `summaryRangeFiltersKeepRecentLogsOnly()`, plus the compiled Goals summary range UI.
- Pass: duration, session-count, and `observance-based` `sankalpa` validation rules are enforced.
  - Verified by `sankalpaValidationRequiresTargetDaysAndObservanceLabel()` and `sankalpaProgressCountsDurationAndSessionGoalsWithFilters()`.
- Pass: observance tracking shows `Pending`, `Observed`, and `Missed` states correctly.
  - Verified by `observanceProgressDerivesPendingObservedMissedAndFutureStates()` and the compiled Goals observance menu flow.
- Pass with runtime follow-up recommended: empty states stay calm and actionable on iPhone-sized screens.
  - Verified by static review of the new Home and Goals empty-state copy and by successful app compilation.

## Residual Risk
- A concrete simulator or physical iPhone is still needed to run the XCTest and UI-test targets end to end.
- Real-device validation is still recommended for:
  - Goals sheet ergonomics on a small screen
  - observance day-menu interactions
  - Home density with dynamic real user data rather than the seeded snapshot
