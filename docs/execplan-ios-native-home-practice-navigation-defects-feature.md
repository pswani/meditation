# ExecPlan: Native Home And Practice Navigation Defects

## 1. Objective
Fix the native iPhone Home and Practice defects around duplicated titles, disabled or missing `custom play` start actions, and fragile back navigation from the Practice `custom play` library while preserving truthful local-first behavior online and offline.

## 2. Why
Home and Practice are core tab roots. Duplicate headings make the shell feel broken, disabled favorite shortcuts undermine fast start from Home, and unreliable Practice-to-library navigation interrupts the main local meditation flow the native app is meant to support.

## 3. Scope
Included:
- Home and Practice title presentation on iPhone
- Home favorite `custom play` and playlist shortcut startability presentation
- Practice featured `custom play` start affordances
- Practice navigation into and back from the full `custom play` library
- Focused tests for presentation and startability rules

Excluded:
- lock-screen audio or audio-mixing changes
- History, Goals, build, or branding fixes
- backend schema or web-app changes

## 4. Source Documents
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
- `prompts/run-milestone-bundle.md`
- `prompts/ios-native-home-practice-navigation-defects-feature-bundle-with-branching/00-create-branch.md`
- `prompts/ios-native-home-practice-navigation-defects-feature-bundle-with-branching/01-implement-ios-native-home-practice-navigation-defects.md`
- `prompts/ios-native-home-practice-navigation-defects-feature-bundle-with-branching/02-review-ios-native-home-practice-navigation-defects.md`
- `prompts/ios-native-home-practice-navigation-defects-feature-bundle-with-branching/03-test-ios-native-home-practice-navigation-defects.md`
- `prompts/ios-native-home-practice-navigation-defects-feature-bundle-with-branching/04-fix-ios-native-home-practice-navigation-defects.md`
- `prompts/ios-native-home-practice-navigation-defects-feature-bundle-with-branching/99-merge-branch.md`

## 5. Affected Files And Modules
- `ios-native/MeditationNative/App/ShellRootView.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/App/ShellViewModelPresentation.swift`
- `ios-native/MeditationNative/Features/Home/HomeView.swift`
- `ios-native/MeditationNative/Features/Practice/PracticeView.swift`
- `ios-native/MeditationNative/Features/Practice/PracticeOverviewSections.swift`
- `ios-native/MeditationNative/Features/Practice/CustomPlayLibraryView.swift`
- `ios-native/MeditationNativeTests/ShellViewModelTests.swift`
- `ios-native/MeditationNativeTests/ShellViewModelPresentationTests.swift`
- Reserved outputs:
  - `docs/review-ios-native-home-practice-navigation-defects-feature.md`
  - `docs/test-ios-native-home-practice-navigation-defects-feature.md`

## 6. UX Behavior
- Home and Practice should show one clear tab-root title on iPhone, including offline or local-only states.
- Home favorite shortcuts should stay startable whenever the underlying item is truly runnable on-device and no other practice is active.
- Practice should expose an obvious `Start` affordance for the featured `custom play` and in the full library, while still surfacing calm unavailable-media guidance when playback cannot be resolved.
- Navigation from Practice into `custom plays` must preserve a reliable path back to Practice even when the Practice root content changes during runtime state transitions.

## 7. Data And State Model
- Reuse the existing `AppSnapshot`, `CustomPlay`, `Playlist`, `ActiveCustomPlaySession`, and `LastUsedPracticeTarget` models.
- Keep playback truthfulness derived from `CustomPlayMedia.canResolvePlaybackURL(apiBaseURL:)`, but centralize UI-facing startability rules so Home and Practice surfaces stay aligned.
- Keep navigation state in the app target only; do not change persisted domain models for this bundle.

## 8. Risks
- Practice swaps between setup sections and active-session sections; if navigation state is coupled too tightly to those conditional trees, pushing the library can lose its back path.
- Hiding unavailable starts entirely can make the app feel broken; showing a disabled action with calm copy is likely safer.
- Over-correcting navigation by changing the entire shell structure would be scope creep and could regress other tab roots.

## 9. Milestones
1. Confirm the current title, startability, and navigation defects in the native shell and feature views.
2. Implement the smallest shell, Home, Practice, and library changes that restore single-title presentation and consistent `custom play` start affordances.
3. Add or update focused tests for presentation and startability logic.
4. Review the branch, run the required native verification, and reconcile any follow-up fixes.
5. Update handoff docs and merge back into the recorded parent branch if the worktree stays clean.

## 10. Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-home-practice-navigation-defects CODE_SIGNING_ALLOWED=NO build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-home-practice-navigation-defects-tests CODE_SIGNING_ALLOWED=NO build-for-testing`
- Manual checks when simulator or device access is practical:
  - Home shows one title
  - Practice shows one title
  - favorite `custom play` shortcuts can start from Home offline when media is locally resolvable
  - Practice featured and full-library `custom play` rows expose a working `Start` action
  - Practice -> `custom plays` -> back returns to Practice cleanly

## 11. Decision Log
- Keep the fix local to the native shell and Practice/Home presentation instead of reworking broader sync, audio, or tab architecture.
- Prefer one shared startability rule for `custom play` UI surfaces so Home and Practice do not drift.

## 12. Progress Log
- 2026-04-16: Reviewed the required repo and product docs plus the bundle prompt sequence.
- 2026-04-16: Inspected the likely touched native files on parent branch `codex/defects-enhancements-16Apr`.
- 2026-04-16: Created feature branch `codex/ios-native-home-practice-navigation-defects-feature-bundle-with-branching`.
- 2026-04-16: Initial findings:
  - `HomeView` and `PracticeView` each render a large in-content heading plus `.navigationTitle(...)`, which explains the duplicate titles on iPhone.
  - Home favorite shortcut enablement is decided inline per row instead of through a shared presentation rule, which makes startability harder to keep aligned with Practice surfaces.
  - Practice featured `custom play` UI only shows a `Start` button when media resolves, so unavailable states can read as a missing action instead of an unavailable action.
  - Practice opens the full `custom play` library through an inline `NavigationLink` inside content that swaps substantially when runtime state changes, which is the most likely source of the fragile back-navigation behavior reported in this bundle.
- 2026-04-16: Implemented the scoped native fix slice:
  - removed duplicate in-content `Home` and `Practice` headings so the navigation title is the single tab-root title
  - centralized `custom play` startability and missing-media guidance in `ShellViewModelPresentation` and `ShellViewModel`
  - updated Home favorites and Practice featured/library surfaces to share the same start-enablement rules
  - moved Practice `custom play` library presentation onto state-owned navigation and pop back to Practice after a successful library start
- 2026-04-16: Added focused native tests for offline-playable favorites and unavailable-media guidance.
- 2026-04-16: Automated verification passed:
  - `swift test --package-path ios-native`
  - `xcodebuild ... build`
  - `xcodebuild ... build-for-testing`
- 2026-04-16: Residual risk remains limited to live simulator or device confirmation of the pushed Practice-library back path and visible single-title presentation.
