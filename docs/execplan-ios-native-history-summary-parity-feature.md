# ExecPlan: iOS Native History and Summary Parity Feature

## 1. Objective
Bring the native iPhone History and Goals summary experience closer to the web app by enriching `session log` context, adding status-aware History filtering, and expanding Goals summary range and time-of-day coverage.

## 2. Why
The native app already has the core meditation flows, but the reflective surfaces still lose some of the context that makes the web app trustworthy. Closing that gap improves reviewability of past sessions, makes summary views more useful, and keeps the app aligned with the product vocabulary and calm UX rules.

## 3. Scope
Included:
- extend native `session log` data with optional context for playlist runs and `custom play` entries
- add History status filtering and clearer start-to-end session time display
- surface playlist-run and `custom play` context in History where practical
- add custom date range support to Goals summary
- add by-time-of-day summary aggregation to Goals
- keep invalid custom ranges calm and explicit
- update focused Swift tests and a small amount of UI coverage
- refresh durable docs after implementation

Excluded:
- backend sync
- Home parity changes
- destructive-action hardening beyond what this slice needs
- unrelated UI refactors or broad shell cleanup

## 4. Source Documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/ios-native/README.md`
- `prompts/ios-native-parity-gap-phased-plan.md`
- `prompts/run-milestone-bundle.md`
- `prompts/ios-native-history-summary-parity-feature-bundle-with-branching/00-create-branch.md`
- `prompts/ios-native-history-summary-parity-feature-bundle-with-branching/01-implement-ios-native-history-summary-parity.md`

## 5. Affected Files And Modules
- `ios-native/Sources/MeditationNativeCore/Domain/Models.swift`
- `ios-native/Sources/MeditationNativeCore/Domain/TimerFeature.swift`
- `ios-native/Sources/MeditationNativeCore/Data/SampleData.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/Features/History/HistoryView.swift`
- `ios-native/MeditationNative/Features/Goals/GoalsView.swift`
- `ios-native/Tests/MeditationNativeCoreTests/DomainModelTests.swift`
- `ios-native/MeditationNativeUITests/MeditationNativeUITests.swift`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX Behavior
- History should show source, status, and meaningful session time ranges without turning into a dense dashboard.
- Playlist entries should expose their run context clearly enough to follow a run without requiring note parsing.
- `custom play` entries should show their identity and recording-label context when available.
- Goals summary should support the common presets plus a calm custom date range.
- When a custom range is invalid or empty, the screen should say so explicitly instead of implying broken data.
- Goals should include a by-time-of-day breakdown that stays readable on iPhone.

## 7. Data And State Model
- Add an optional `SessionLogContext` to native `SessionLog` so playlist-run and `custom play` context can be stored explicitly.
- Keep the new context fields optional so older snapshots continue to decode safely.
- Add a native summary range selection shape that can represent a custom date range alongside the existing presets.
- Add a by-time-of-day summary aggregation to the derived local summary snapshot and the stored summary snapshot.
- Keep the existing JSON snapshot store as the source of truth and preserve compatible decoding for existing files.

## 8. Risks
- Adding log-context fields can introduce migration bugs if older snapshots are not handled as optional values.
- Custom date ranges can become confusing if the UI does not separate empty results from invalid ranges.
- Time-of-day aggregation can become noisy if the summary cards are not restrained on small screens.
- The History screen can become visually busy if context labels are shown too aggressively.

## 9. Milestones
1. Extend the shared native model and summary helpers with optional log context, custom date range support, and time-of-day aggregation.
2. Update SampleData, ShellViewModel, History, and Goals screens to use the richer derived data.
3. Add focused unit tests and a small UI smoke update for the new parity behavior.
4. Refresh durable docs and verify the native package and Xcode build/test commands.

## 10. Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

## 11. Decision Log
- Use optional context fields on `SessionLog` instead of replacing the record with a more invasive new history model.
- Keep custom date range handling local to the summary helper and Goals screen rather than introducing a separate screen flow.
- Derive time-of-day summary buckets from the session end time to match the current product rules and avoid additional stored state.

## 12. Progress Log
- 2026-04-09: Reviewed the bundle prompt files, the native History/Goals implementation, and the durable repo guidance.
- 2026-04-09: Chosen direction: add optional session-log context, custom summary range selection, and by-time-of-day summary aggregation while keeping the slice calm and local-first.
