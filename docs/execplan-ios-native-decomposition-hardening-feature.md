# ExecPlan: Native iOS Decomposition Hardening

## Objective
Reduce maintenance risk in the native iOS app by decomposing oversized runtime and Practice feature files into smaller, clearer boundaries while strengthening automated coverage around the highest-risk native flows.

## Why
The native iOS parity work is now broad enough that large catch-all files create review risk and make regressions harder to isolate. Smaller native modules and stronger tests should improve change safety without widening the product surface.

## Scope
- Decompose `ios-native/MeditationNative/App/ShellViewModel.swift` into smaller extensions and helpers where responsibilities are already distinct.
- Decompose `ios-native/MeditationNative/Features/Practice/PracticeView.swift` into smaller feature-local views and editors.
- Improve unit coverage for extracted native logic and strengthen UI coverage beyond launch-only smoke checks.
- Update durable native docs for any lasting organization decisions and new verification state.

Explicitly excluded:
- new user-facing parity features unless a narrow fix is required to safely extract code
- backend redesign unrelated to testability or decomposition
- unrelated web-app refactors

## Source Documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/ios-native-parity-gap-phased-plan.md`
- `docs/ios-native/README.md`
- `prompts/ios-native-decomposition-hardening-feature-bundle-with-branching/*.md`

## Affected Files And Modules
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- new helper files under `ios-native/MeditationNative/App/`
- `ios-native/MeditationNative/Features/Practice/PracticeView.swift`
- new helper files under `ios-native/MeditationNative/Features/Practice/`
- `ios-native/MeditationNativeUITests/MeditationNativeUITests.swift`
- `ios-native/MeditationNativeTests/ShellViewModelTests.swift`
- `ios-native/MeditationNative.xcodeproj/project.pbxproj`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- optional `docs/ios-native/README.md` if verification workflow changes

## UX Behavior
- Practice should keep the same user-visible timer, `custom play`, playlist, library, and confirmation behavior.
- Runtime safety prompts should remain calm and unchanged in wording unless a bug fix is needed.
- No new native destinations or workflow widening should be introduced by the extraction.

## Data And State Model
- Preserve the existing local-first `AppSnapshot`, `AppSyncState`, and runtime session models.
- Keep extracted helpers as organization boundaries around existing behavior, not new persistence models.
- Prefer pure helper methods for derived text, last-used practice derivation, sync messaging, and prompt metadata where possible.

## Risks
- Moving app-target Swift code across files requires keeping the Xcode project file in sync.
- Large-file extraction can accidentally change access control or `@MainActor` assumptions.
- Practice UI splits could subtly change bindings, sheet wiring, or destructive-action prompts if not kept feature-local.
- UI coverage still depends on simulator availability in this environment.

## Milestones
1. Create the bundle branch and confirm native parity prerequisites are already merged on `codex/ios`.
2. Split `ShellViewModel` into smaller app-target files around runtime prompts, sync/persistence helpers, and derived presentation helpers.
3. Split Practice route and library/editor subviews into feature-local files without changing visible behavior.
4. Add or expand unit and UI tests around extracted logic and higher-risk native journeys.
5. Run required verification, write review and test artifacts, fix validated issues only, then merge if clean.

## Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'platform=iOS Simulator,name=<installed iPhone simulator>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'platform=iOS Simulator,name=<installed iPhone simulator>' test`
- Focused checks:
  - timer, `custom play`, and playlist runtime smoke journeys remain stable
  - History, Goals, and Settings still expose their key controls
  - extracted helpers have direct test coverage where practical

## Decision Log
- 2026-04-10: Keep this slice bounded to decomposition plus test hardening rather than widening parity scope.
- 2026-04-10: Prefer app-target extension files for `ShellViewModel` organization so existing route views can keep the same observable-object boundary.
- 2026-04-10: Prefer feature-local Practice files for libraries and editors instead of regrowing nested private views inside one route file.
- 2026-04-10: Prefer explicit `SessionLog` context over notes parsing when reconstructing native `last used` targets, while keeping the notes fallback for older local snapshots.

## Progress Log
- 2026-04-10: Reviewed repo guidance, native phased plan, bundle prompts, and native README.
- 2026-04-10: Confirmed parent branch `codex/ios` already contains the prior native parity bundles and created `codex/ios-native-decomposition-hardening-feature-bundle-with-branching`.
- 2026-04-10: Confirmed current hotspots are `ShellViewModel.swift` at 1428 lines and `PracticeView.swift` at 881 lines; current UI coverage is broader than launch-only but still concentrated in one smoke-heavy file.
- 2026-04-10: Extracted runtime safety prompt copy, snapshot normalization and `last used` derivation, sync-pass orchestration, and derived shell presentation into focused app-target helpers while keeping `ShellViewModel` as the observable-object boundary.
- 2026-04-10: Split Practice into a thin route composition file plus feature-local active-session sections, featured-library sections, and dedicated `custom play` and playlist library/editor files; `PracticeView.swift` now stays route-focused.
- 2026-04-10: Added focused native coverage for shell presentation helpers plus UI confirmation flows around canceling timer end and deleting library items.
- 2026-04-10: Verification passed for `swift test`, `xcodebuild ... build`, and `xcodebuild ... build-for-testing`; `xcodebuild ... test` remains blocked here because CoreSimulator is unavailable and Xcode requires a concrete simulator device.
