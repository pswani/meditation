# ExecPlan: iOS Native Foundation Feature

## 1. Objective
Create the first native iPhone foundation under `ios-native/` as a separate SwiftUI codebase with a calm shell, shared product vocabulary, sample-backed local data, and a documented environment seam for future backend sync.

## 2. Why
The repository already has a complete web product and backend foundation, but the planned native iOS track needs its own runnable structure so later milestones can deliver real on-device journeys without mixing native work into the existing web app.

## 3. Scope
Included:
- create `ios-native/` foundation files
- create a SwiftUI app shell with Home, Practice, History, Goals, and Settings
- add shared native domain models and reference values
- add sample data and a local persistence boundary
- add a documented environment configuration seam for future API work
- add focused Swift tests for domain models, sample data, and persistence helpers
- update native iOS docs and durable repo state docs

Excluded:
- timer runtime behavior
- audio playback
- session logging flows beyond seed models
- `custom play` runtime
- playlist runtime
- summary calculations beyond seed models
- `sankalpa` editing behavior
- backend sync
- changes to existing web or backend behavior

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
- `prompts/ios-native-app-step-by-step.md`
- `docs/ios-native/README.md`
- `prompts/ios-native-foundation-feature-bundle-with-branching/00-create-branch.md`
- `prompts/ios-native-foundation-feature-bundle-with-branching/01-implement-ios-native-foundation.md`

## 5. Affected Files And Modules
- `ios-native/Package.swift`
- `ios-native/MeditationNative.xcodeproj`
- `ios-native/Sources/MeditationNativeCore/...`
- `ios-native/MeditationNative/...`
- `ios-native/Tests/MeditationNativeCoreTests/...`
- `ios-native/MeditationNativeUITests/...`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-ios-native-foundation-feature.md`
- `docs/test-ios-native-foundation-feature.md`

## 6. UX Behavior
- The native app opens into a calm iPhone-first tab shell.
- Primary destinations use the same terminology as the web product: Home, Practice, History, Goals, Settings.
- Each destination shows clearly labeled sample-backed sections so the shell is navigable without implying full feature completion or live sync.
- Settings shows the current environment profile and whether an API base URL is configured, but the app does not require backend connectivity to launch.

## 7. Data And State Model
- Shared domain models cover meditation type, timer settings draft, session log, custom play, playlist, sankalpa, and summary.
- `AppSnapshot` provides one seeded local-first payload for shell rendering.
- `AppEnvironment` represents the future API seam with an optional base URL.
- `JSONFileStore` and `LocalAppSnapshotRepository` provide Apple-native Foundation file persistence for the foundation milestone.
- The SwiftUI shell reads one repository-backed snapshot and keeps mutations out of scope for later milestones.

## 8. Risks
- This environment lacks a full Xcode installation, so `xcodebuild` verification cannot complete here.
- A hand-authored `.xcodeproj` has more runability risk than a project generated directly by Xcode.
- SwiftUI shell code cannot be compiled in this environment without Xcode, so command-line verification must focus on the shared core module.
- Later milestones may still refine the project layout once real timer and media behavior exist.

## 9. Milestones
1. Scaffold `ios-native/` package, app folders, and ExecPlan.
2. Add shared core models, sample data, environment seam, and persistence helpers.
3. Add calm SwiftUI shell and placeholder destination screens.
4. Add focused tests plus a light UI smoke test file.
5. Update native docs and durable repo docs.
6. Review, verify, fix, and merge.

## 10. Verification
- `swift test` in `ios-native/` for shared foundation coverage
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -showdestinations` when Xcode is installed
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`
- manual Xcode simulator smoke:
  - app launches
  - all primary destinations are reachable
  - sample content is visibly marked as local foundation data

## 11. Decision Log
- Use a separate `ios-native/` workspace and avoid any web view wrapper.
- Use Foundation file persistence for the foundation milestone so local-first behavior is testable without forcing SwiftData before feature flows exist.
- Keep the shared native core source separate from SwiftUI shell files so command-line Swift tests remain possible even when Xcode is unavailable.

## 12. Progress Log
- 2026-04-09: Reviewed required docs, confirmed current parent branch `codex/ios` was clean, and created `codex/ios-native-foundation-feature-bundle-with-branching`.
- 2026-04-09: Confirmed the machine has Swift command-line tools but not a full Xcode installation, so the plan includes command-line Swift verification plus documented Xcode verification steps for a machine with Xcode installed.
- 2026-04-09: Added the `ios-native/` foundation with a hand-authored `MeditationNative.xcodeproj`, a SwiftUI tab shell, shared native domain models, sample data, a local JSON snapshot repository, and focused Swift test files.
- 2026-04-09: Verified the `.xcodeproj` file structure with `plutil -lint`, then documented environment-blocked `swift test` and `xcodebuild` verification in the milestone test artifact for follow-up on a machine with full Xcode support.
