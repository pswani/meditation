# ExecPlan: iOS Native Custom Play Parity Feature

## 1. Objective
Expand the native iPhone `custom play` slice so it matches the higher-value web concepts: optional start and end sounds, a richer recording note field, a link-aware media identifier seam for later sync, and an `Apply To Timer` action.

## 2. Why
The current native `custom play` flow is functional but still feels narrower than the web product. Closing the parity gap improves feature trust, makes the Practice screen more useful, and prepares the native model for later sync without widening into backend work yet.

## 3. Scope
Included:
- extend the native `custom play` model and draft to carry start sound, end sound, recording label or session note, and a link-aware media identifier
- add an `Apply To Timer` action that copies the saved `custom play` setup into timer defaults
- surface the richer metadata in the Practice library and editor
- keep bundled placeholder playback workable for the current local-first milestone
- update focused Swift tests and iOS UI smoke coverage
- update durable docs for the final native state

Excluded:
- backend sync
- browser/web changes
- playlist runtime redesign beyond keeping linked custom plays compatible
- summary or history broadening outside the minimum needed for the `custom play` slice

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
- `prompts/ios-native-custom-play-parity-feature-bundle-with-branching/00-create-branch.md`
- `prompts/ios-native-custom-play-parity-feature-bundle-with-branching/01-implement-ios-native-custom-play-parity.md`

## 5. Affected Files And Modules
- `ios-native/Sources/MeditationNativeCore/Domain/Models.swift`
- `ios-native/Sources/MeditationNativeCore/Domain/TimerFeature.swift`
- `ios-native/Sources/MeditationNativeCore/Data/SampleData.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/Features/Practice/PracticeView.swift`
- `ios-native/MeditationNativeTests/ShellViewModelTests.swift`
- `ios-native/Tests/MeditationNativeCoreTests/DomainModelTests.swift`
- `ios-native/MeditationNativeUITests/MeditationNativeUITests.swift`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX Behavior
- `custom play` rows should show the extra metadata without becoming noisy.
- The editor should keep the local placeholder-media guidance explicit so users do not mistake this milestone for full media sync.
- `Apply To Timer` should copy the saved `custom play`'s timer-relevant settings into the current timer draft and leave the user in control of whether to start immediately.
- Linked playlist items should continue to resolve against the saved `custom play` data and fail calmly if the linked entry is unavailable.

## 7. Data And State Model
- Extend `CustomPlay` with optional start sound, end sound, recording label, and a link-aware media identifier while preserving the current placeholder media runtime.
- Extend `CustomPlayDraft` so editing can round-trip the richer fields cleanly.
- Keep `CustomPlayFeature` responsible for validation, draft conversion, and timer application helpers.
- Treat the existing local JSON snapshot store as the source of truth for this milestone.
- Preserve compatibility with older snapshots by keeping new fields optional and defaulted.

## 8. Risks
- Adding fields to the native custom-play model can break old snapshots if defaults are not handled carefully.
- The new `Apply To Timer` action could accidentally overwrite timer defaults too aggressively if it does not mirror the current web behavior closely enough.
- UI density can grow quickly if the richer metadata is shown everywhere at full length.
- Placeholder audio must remain clearly labeled as local-only until sync arrives.

## 9. Milestones
1. Extend the native core model, validation, and helper functions for the richer `custom play` shape.
2. Update `ShellViewModel` and Practice UI to support the new editor fields and `Apply To Timer`.
3. Add focused unit tests and UI smoke coverage for the new behavior.
4. Update durable docs and run the required verification commands.

## 10. Verification
- `swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`
- Focused manual review of the changed native files for scope and calm UX

## 11. Decision Log
- Use optional native fields for the web-parity metadata so older snapshot files remain readable.
- Keep bundled placeholder audio as the runtime playback path for this milestone instead of widening into file import or backend media sync.
- Implement `Apply To Timer` as a direct timer-draft copy action from the saved custom play so the behavior stays explicit and predictable.

## 12. Progress Log
- 2026-04-09: Reviewed the bundle prompt files and the current native custom-play implementation.
- 2026-04-09: Chosen direction: add optional parity metadata, keep placeholder audio local-first, and expose an explicit `Apply To Timer` action.
- 2026-04-09: Implemented the richer native custom-play model, timer application helper, Practice UI updates, and focused unit/UI coverage.
- 2026-04-09: Verified `swift test --package-path ios-native` and `xcodebuild ... build`; the simulator-backed `xcodebuild ... test` action remains blocked by the missing concrete iOS simulator runtime in this environment.
