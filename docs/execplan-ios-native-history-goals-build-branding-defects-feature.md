# ExecPlan: iOS Native History, Goals, Build, And Branding Defects

## 1. Objective
Fix the reported native iPhone defects in History and Goals, keep the app buildable for the repo's simulator flow, and rename the app display from `MeditationNative` to `Meditation`.

## 2. Why
- Goals currently shows duplicate titling on iPhone, which adds noise to a screen that should feel calm.
- The History screen needs a clearer, working path for manual logging and for the requested meditation-type change flow.
- The bundle explicitly needs simulator build confidence preserved while touching native project settings.
- The shipped display name should present as `Meditation`, which better matches the product vocabulary used across the repo.

## 3. Scope
Included:
- remove the duplicate Goals title on iPhone
- make the History `Manual log` action easy to reach and confirm it still works
- add the narrowest trustworthy meditation-type change path on History
- keep the native simulator build working while changing the touched SwiftUI and Xcode project surfaces
- rename the app display to `Meditation` without widening into package or test-target renames
- add focused tests and durable docs for the affected behavior

Excluded:
- Home or Practice defects outside this bundle
- lock-screen audio or audio-mixing work
- web `manual log` changes
- broader native History redesign, bulk session editing, or backend contract changes
- renaming the module, test targets, Swift package product, or filesystem directories from `MeditationNative`

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/ios-native/README.md`
- `prompts/ios-native-history-goals-build-branding-defects-feature-bundle-with-branching/00-create-branch.md`
- `prompts/ios-native-history-goals-build-branding-defects-feature-bundle-with-branching/01-implement-ios-native-history-goals-build-branding-defects.md`

## 5. Affected files and modules
- `ios-native/MeditationNative/Features/History/HistoryView.swift`
- `ios-native/MeditationNative/Features/Goals/GoalsView.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/App/ShellViewModelPresentation.swift`
- `ios-native/MeditationNativeTests/ShellViewModelTests.swift`
- `ios-native/MeditationNativeTests/ShellViewModelPresentationTests.swift`
- `ios-native/MeditationNative.xcodeproj/project.pbxproj`
- `docs/ios-native/README.md`
- `docs/review-ios-native-history-goals-build-branding-defects-feature.md`
- `docs/test-ios-native-history-goals-build-branding-defects-feature.md`
- `requirements/session-handoff.md`
- `requirements/decisions.md` only if a durable native editing or branding decision changes

## 6. UX behavior
- Goals should present one clear screen title on iPhone, with the explanatory copy still visible.
- History should expose an obvious `Manual log` action without relying on a hidden path.
- The meditation-type change affordance should state what can be changed and should only appear for eligible `session log` records.
- Auto-created timer, `custom play`, and playlist history should remain trustworthy and not look casually editable.
- The app icon label and bundle display name should show `Meditation` while the internal project and target names remain stable unless required otherwise.

## 7. Data and state model
- Keep `session log` storage local-first and id-stable.
- Reuse the existing `session log` upsert path when a manual log is edited so summaries and sync queues stay derived from the same source of truth.
- Preserve manual-log timestamps, duration, status, and source when only meditation type changes.
- Keep app-snapshot and sync-state shapes otherwise unchanged.

## 8. Risks
- A too-broad History editing surface could undermine trust in auto-created session history.
- Display-name changes in Xcode can accidentally spread into target names, test hosts, or product references if edited too aggressively.
- Manual-log affordances can regress compact iPhone navigation if they compete with the filter UI or sheet presentation.
- The build issue may be intermittent or environment-specific even though the initial simulator preflight currently succeeds.

## 9. Milestones
1. Create the branch, reserve the required docs, and capture the bundle metadata in this plan.
2. Implement the Goals title cleanup and the History manual-log plus meditation-type-change flow.
3. Apply the narrow display-name change in Xcode project settings and confirm simulator buildability stays intact.
4. Add focused tests, update native docs, and refresh the current-state handoff.
5. Review, verify, and fix any remaining bundle-scoped issues before merging.

## 10. Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-history-goals-build-branding CODE_SIGNING_ALLOWED=NO build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-history-goals-build-branding-tests CODE_SIGNING_ALLOWED=NO build-for-testing`
- manual follow-up if available:
  - confirm Goals shows one title
  - confirm History opens the `Manual log` flow
  - confirm the meditation-type change flow works only for eligible logs
  - confirm the installed app label presents as `Meditation`

## 11. Decision log
- 2026-04-16: Parent branch for this bundle is `codex/defects-enhancements-16Apr`.
- 2026-04-16: Feature branch for this bundle is `codex/ios-native-history-goals-build-branding-defects-feature-bundle-with-branching`.
- 2026-04-16: Use the narrowest trustworthy History interpretation by allowing meditation-type changes only for manual logs, not for auto-created timer, playlist, or `custom play` records.
- 2026-04-16: Keep the rename scoped to the user-facing app display name and nearby copy, not to the internal Swift module or test-target names.

## 12. Progress log
- 2026-04-16: Reviewed the required repo docs, the bundle runner prompt, the full target bundle prompt sequence, and the likely touched native files.
- 2026-04-16: Created `codex/ios-native-history-goals-build-branding-defects-feature-bundle-with-branching` from `codex/defects-enhancements-16Apr`.
- 2026-04-16: Inspected `HistoryView`, `GoalsView`, `ShellViewModel`, `ShellViewModelPresentation`, the native tests, and the Xcode project seams tied to display name and build settings.
- 2026-04-16: Ran a simulator preflight build with `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-history-goals-build-branding-preflight CODE_SIGNING_ALLOWED=NO build`, which succeeded before code changes and indicates there is no current unrelated branch-wide simulator build failure.
- 2026-04-16: Implemented the Goals duplicate-title cleanup, a visible History `Manual log` action, a manual-log-only meditation-type change path, focused History editability tests, and the scoped app display-name update to `Meditation`.
- 2026-04-16: Updated native durable docs for the visible History path, manual-log-only correction rule, and the user-facing app label.
- 2026-04-16: Verified the final slice with `swift test --package-path ios-native`, simulator `xcodebuild ... build`, simulator `xcodebuild ... build-for-testing`, and an `Info.plist` check confirming `CFBundleDisplayName = Meditation` while internal bundle naming remains `MeditationNative`.
