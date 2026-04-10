# ExecPlan: Native iOS Summary And Sankalpa Feature

## 1. Objective
Implement the native iPhone milestone that completes the reflective side of the app with:
- local summary aggregation from native `session log` history
- calmer but more useful Home progress context
- full local-first `sankalpa` creation, editing, progress tracking, observance check-ins, and archive or restore flows

## 2. Why
The native iOS track already supports timer practice, History, `custom play`, and playlist flows. This milestone closes the loop so the iPhone app can show reflective progress and disciplined goal tracking without needing backend sync yet.

## 3. Scope
Included:
- derive native summary data from local `session log` history
- surface overall, by meditation type, and by source summary views on iPhone
- improve Home with today progress, active `sankalpa` context, and recent reflective signals without turning it into a dashboard
- implement `sankalpa` create and edit flows for:
  - duration-based goals
  - session-count goals
  - `observance-based` goals
- implement `sankalpa` progress derivation, status sections, observance day states, and archive or restore behavior
- keep snapshot persistence backward compatible with existing milestone-3 saved data where practical
- add focused core tests and targeted UI coverage

Excluded:
- backend sync
- iPad-specific redesign
- new media or playlist runtime work
- unrelated web or backend refactors

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
- `prompts/ios-native-app-phased-plan.md`
- `docs/ios-native/README.md`
- `prompts/ios-native-summary-sankalpa-feature-bundle-with-branching/00-create-branch.md`
- `prompts/ios-native-summary-sankalpa-feature-bundle-with-branching/01-implement-ios-native-summary-sankalpa.md`

## 5. Affected Files And Modules
- `ios-native/Sources/MeditationNativeCore/Domain/Models.swift`
- `ios-native/Sources/MeditationNativeCore/Domain/ReferenceData.swift`
- `ios-native/Sources/MeditationNativeCore/Domain/TimerFeature.swift`
- `ios-native/Sources/MeditationNativeCore/Data/AppSnapshot.swift`
- `ios-native/Sources/MeditationNativeCore/Data/SampleData.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/Features/Home/HomeView.swift`
- `ios-native/MeditationNative/Features/Goals/GoalsView.swift`
- `ios-native/Tests/MeditationNativeCoreTests/`
- `ios-native/MeditationNativeUITests/MeditationNativeUITests.swift`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX Behavior
- Home should keep quick-start visible first, then show concise progress context:
  - today summary
  - top active `sankalpa` snapshot
  - recent session signal
- summary surfaces should reflect real local history, not placeholder rows
- Goals should show calm sections for:
  - active
  - completed
  - expired
  - archived
- `sankalpa` editor should use one form that adapts by goal type
- observance goals must:
  - require an observance label
  - show explicit `Pending`, `Observed`, and `Missed` states
  - prevent future-date edits
- archive and restore should be explicit but non-dramatic
- empty states should help the next useful action

## 7. Data And State Model
- keep the native app local-first on top of the existing JSON snapshot repository
- derive summary data from persisted local `session log` history instead of trusting sample summary rows
- extend native `Sankalpa` to support:
  - stable creation date for goal windows
  - optional observance records
  - archived state
- keep edit behavior id-stable and preserve original goal windows
- keep observance progress derived from per-date records rather than storing a third persisted status
- expose derived summary and `sankalpa` progress through `ShellViewModel`

## 8. Risks
- changing native snapshot models could break decoding of existing saved milestone-3 data
- adding too much Home detail could make the iPhone surface feel noisy
- observance date logic can easily become untrustworthy around local-day boundaries
- archive or restore behavior must preserve calm UX while still making status changes obvious
- UI coverage in this environment may be limited by simulator availability

## 9. Milestones
1. Add native core models and helpers for summary derivation and `sankalpa` validation or progress.
2. Extend `ShellViewModel` with derived summary, today progress, and `sankalpa` mutations.
3. Replace Home and Goals placeholder views with real milestone-4 SwiftUI flows.
4. Add focused core tests and update UI smoke coverage for the riskiest paths.
5. Update durable docs, run review and verification, then fix any validated issues.

## 10. Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-summary-sankalpa CODE_SIGNING_ALLOWED=NO build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-summary-sankalpa CODE_SIGNING_ALLOWED=NO test`
- targeted inspection of:
  - Home calmness and progress density
  - summary totals and filters
  - duration, session-count, and observance validation
  - observance `Pending` / `Observed` / `Missed` state handling

## 11. Decision Log
- Derive native summary from local `session log` history now rather than persisting a second source of truth.
- Preserve milestone-3 snapshot compatibility by preferring additive model changes and decode defaults where needed.
- Keep `sankalpa` tracking inside Goals rather than widening Home into a second management surface.

## 12. Progress Log
- 2026-04-09: Read the required repo and bundle docs, confirmed `codex/ios` as the safe parent branch, and created `codex/ios-native-summary-sankalpa-feature-bundle-with-branching`.
- 2026-04-09: Inspected the existing native app shell, snapshot repository, current placeholder Home and Goals views, and the web summary plus `sankalpa` semantics to align the native implementation.
- 2026-04-09: Implemented native summary derivation, `sankalpa` validation and progress helpers, seeded milestone-4 sample data, and wired the new local-first state through `ShellViewModel`.
- 2026-04-09: Replaced the placeholder Home and Goals views with real milestone-4 SwiftUI flows, including summary ranges, `sankalpa` sections, sheet-based editing, and observance day handling.
- 2026-04-09: Added focused summary and `sankalpa` core tests, expanded UI smoke coverage, and verified the branch with `swift test`, `xcodebuild ... build`, and a documented `xcodebuild ... test` environment limitation on generic simulator destinations.
