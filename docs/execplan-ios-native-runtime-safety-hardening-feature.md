# ExecPlan: Native iOS Runtime Safety Hardening Feature

## 1. Objective
Add explicit, calm confirmation steps for destructive and end-session actions in the native iPhone app:
- confirm-before-end for active timer, `custom play`, and playlist runtime
- confirm-before-delete for saved `custom play` entries and playlists
- confirm-before-delete for archived `sankalpa` items only

## 2. Why
The native milestone already supports the underlying practice, library, and goal flows. This slice raises trust and reduces accidental destructive actions by making the highest-risk actions deliberate without widening the app into unrelated parity work.

## 3. Scope
Included:
- add a small safety-confirmation state layer in the native app shell
- wire calm confirmation UI for:
  - ending a fixed-duration timer early
  - ending an open-ended timer session
  - ending an active `custom play`
  - ending an active playlist
  - deleting a saved `custom play`
  - deleting a saved playlist
  - deleting an archived `sankalpa`
- keep archived `sankalpa` delete restricted to the archived section
- add focused tests for confirmation-state handling and destructive-action guards
- update durable docs for the new native safety behavior

Excluded:
- backend sync
- Home parity
- `custom play` media-model expansion
- History or summary data-model changes
- unrelated refactors outside the safety boundary

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
- `prompts/ios-native-parity-gap-phased-plan.md`
- `docs/ios-native/README.md`
- `prompts/run-milestone-bundle.md`
- `prompts/ios-native-runtime-safety-hardening-feature-bundle-with-branching/00-create-branch.md`
- `prompts/ios-native-runtime-safety-hardening-feature-bundle-with-branching/01-implement-ios-native-runtime-safety-hardening.md`
- `prompts/ios-native-runtime-safety-hardening-feature-bundle-with-branching/02-review-ios-native-runtime-safety-hardening.md`
- `prompts/ios-native-runtime-safety-hardening-feature-bundle-with-branching/03-test-ios-native-runtime-safety-hardening.md`
- `prompts/ios-native-runtime-safety-hardening-feature-bundle-with-branching/04-fix-ios-native-runtime-safety-hardening.md`
- `prompts/ios-native-runtime-safety-hardening-feature-bundle-with-branching/99-merge-branch.md`

## 5. Affected Files And Modules
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/Features/Practice/PracticeView.swift`
- `ios-native/MeditationNative/Features/Goals/GoalsView.swift`
- `ios-native/MeditationNativeTests/ShellViewModelTests.swift`
- `ios-native/MeditationNative.xcodeproj/project.pbxproj`
- `docs/execplan-ios-native-runtime-safety-hardening-feature.md`
- `docs/review-ios-native-runtime-safety-hardening-feature.md`
- `docs/test-ios-native-runtime-safety-hardening-feature.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/ios-native/README.md`

## 6. UX Behavior
- End actions must ask for deliberate confirmation before the practice flow is stopped.
- Delete actions must show calm, specific copy that makes the scope of the action obvious.
- Archived `sankalpa` delete must only appear from the archived section and should remain clearly separate from restore.
- Confirmation UI should remain compact and serious, with no extra dashboard-style clutter.

## 7. Data And State Model
- keep the current local-first snapshot model intact
- represent pending safety actions in the app shell as a small, testable state value
- reuse existing finish and delete methods once confirmation is granted
- keep archived `sankalpa` delete as a direct removal from the local snapshot only

## 8. Risks
- confirmation state can become fragmented if each view implements its own prompt rules
- the native app target needs explicit XCTest coverage because the current package tests do not cover `ShellViewModel`
- Xcode simulator availability may limit final `xcodebuild test` execution in this environment

## 9. Milestones
1. Add a shared runtime-safety prompt state in `ShellViewModel`.
2. Wire confirmation UI into Practice and Goals views.
3. Add focused app tests for prompt requests, confirmations, and archived-only delete behavior.
4. Update durable docs and verify the branch with package, build, and test commands.
5. Review, fix any validated issues, then merge if the tree is clean.

## 10. Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`
- focused checks for:
  - confirmation dialogs on end actions
  - confirmation dialogs on delete actions
  - archived-only delete availability
  - calm iPhone-sized presentation

## 11. Decision Log
- Use one shared runtime-safety prompt state in the shell view model instead of scattering separate ad hoc booleans through each screen.
- Keep the confirmation UI local to the existing Practice and Goals views so the change stays bounded and calm.
- Restrict permanent `sankalpa` delete to archived items only, matching the UX spec and product rules.

## 12. Progress Log
- 2026-04-09: Read the required repo and bundle docs, confirmed `codex/ios` as the parent branch, and created `codex/ios-native-runtime-safety-hardening-feature-bundle-with-branching`.
- 2026-04-09: Inspected the native runtime and goal flows, confirmed the current direct end/delete behavior, and identified the app test target needed for `ShellViewModel` coverage.
- 2026-04-09: Wrote the safety hardening plan, bounded to confirmations and archived-only delete behavior.
- 2026-04-09: Implemented shared runtime-safety prompts in Practice and Goals, added focused XCTest coverage, verified `swift test` plus `xcodebuild build` and `build-for-testing`, and confirmed full `xcodebuild test` remains blocked by the unavailable concrete simulator in this environment.
