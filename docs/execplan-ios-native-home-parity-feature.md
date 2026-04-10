# ExecPlan: Native iOS Home Parity Feature

## 1. Objective
Bring the native iPhone Home screen closer to the web Home surface by adding:
- an actionable quick start for the current timer defaults
- a last-used meditation shortcut that can resume timer, `custom play`, or playlist flow
- favorite `custom play` and favorite playlist shortcuts
- richer recent-session context while keeping the screen calm

## 2. Why
Home is the fastest return-to-practice surface. This slice should make the native app feel immediately usable on iPhone without widening into backend sync or broader data-model work.

## 3. Scope
Included:
- add Home quick-start actions for timer defaults and the last-used meditation
- persist a small last-used practice target in the native snapshot so Home can reopen the intended flow
- surface favorite `custom play` and playlist shortcuts on Home
- expand recent-session context on Home from a single row to a concise multi-row view
- keep the surface calm, readable, and iPhone-first
- add focused tests for last-used and favorite shortcut behavior
- update durable docs for the new Home state

Excluded:
- backend sync
- `custom play` media-model expansion
- History or summary data-model work beyond what Home needs to render shortcuts
- unrelated route, navigation, or architecture refactors

## 4. Source Documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/ios-native-parity-gap-phased-plan.md`
- `docs/ios-native/README.md`
- `prompts/run-milestone-bundle.md`
- `prompts/ios-native-home-parity-feature-bundle-with-branching/00-create-branch.md`
- `prompts/ios-native-home-parity-feature-bundle-with-branching/01-implement-ios-native-home-parity.md`
- `prompts/ios-native-home-parity-feature-bundle-with-branching/02-review-ios-native-home-parity.md`
- `prompts/ios-native-home-parity-feature-bundle-with-branching/03-test-ios-native-home-parity.md`
- `prompts/ios-native-home-parity-feature-bundle-with-branching/04-fix-ios-native-home-parity.md`
- `prompts/ios-native-home-parity-feature-bundle-with-branching/99-merge-branch.md`

## 5. Affected Files And Modules
- `ios-native/Sources/MeditationNativeCore/Domain/Models.swift`
- `ios-native/Sources/MeditationNativeCore/Data/AppSnapshot.swift`
- `ios-native/Sources/MeditationNativeCore/Data/SampleData.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/Features/Home/HomeView.swift`
- `ios-native/MeditationNativeTests/ShellViewModelTests.swift`
- `ios-native/MeditationNativeUITests/MeditationNativeUITests.swift`
- `docs/execplan-ios-native-home-parity-feature.md`
- `docs/review-ios-native-home-parity-feature.md`
- `docs/test-ios-native-home-parity-feature.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/ios-native/README.md`

## 6. UX Behavior
- Home should present a calm quick-start block first.
- The timer quick start should use the current timer defaults.
- The last-used shortcut should start the most recently used meditation path, whether that was timer, `custom play`, or playlist.
- Favorite `custom play` and playlist shortcuts should be visible and startable from Home.
- Recent-session context should show a small, readable list instead of a single line.
- Empty states should stay reassuring and guide the user to the next useful action.

## 7. Data And State Model
- keep the local-first snapshot model intact
- add a small optional last-used practice target to `AppSnapshot`
- persist that target whenever a practice flow starts successfully
- derive Home shortcut views from existing favorite flags and recent session logs
- keep the timer, `custom play`, and playlist runtime flows unchanged once a shortcut launches them

## 8. Risks
- storing a last-used practice target adds another snapshot field that must decode safely from older data
- Home can become too busy if the shortcut groups are not kept concise
- timer quick start and last-used quick start must not collide with the single-active-runtime rule
- device-only verification may still be limited by simulator availability

## 9. Milestones
1. Add the persisted last-used practice target and normalize old snapshots.
2. Wire Home shortcut actions and concise shortcut sections into the shell and Home view.
3. Add focused tests for last-used selection and Home shortcut rendering or launch behavior.
4. Update durable docs and verify the branch with package, build, and test commands.
5. Review, fix any validated issues, then merge if the tree is clean.

## 10. Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`
- focused checks for:
  - timer quick start from Home
  - last-used shortcut launches timer, `custom play`, and playlist paths
  - favorite shortcuts remain readable and startable
  - recent-session context stays calm on an iPhone-sized screen

## 11. Decision Log
- Persist a small last-used practice target in the native snapshot so Home can reopen the intended flow without duplicating runtime logic.
- Keep Home shortcut rendering thin and route the actual launching through `ShellViewModel`.
- Favor concise shortcut groups over a dense dashboard.

## 12. Progress Log
- 2026-04-09: Read the required repo and bundle docs, confirmed `codex/ios` as the parent branch, and created `codex/ios-native-home-parity-feature-bundle-with-branching`.
