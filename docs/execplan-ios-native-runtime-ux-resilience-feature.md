# ExecPlan: iOS Native Runtime UX Resilience

## 1. Objective
Improve native iOS trust and day-to-day usability by adding recoverable active runtime state, calmer numeric entry for duration-style controls, clearer local-only versus backend-unavailable messaging, and more intentional timer-default editing behavior.

## 2. Why
- The current iOS app can lose an active timer, `custom play`, or playlist on relaunch because runtime state is only in memory.
- Stepper-only controls make common duration entry slower and less comfortable on iPhone than the existing web flow.
- The current sync copy can make local-only mode sound broken instead of intentionally local-first.
- Timer defaults in Settings persist on every change, which makes accidental edits easier than the calmer web-style save or reset flow.

## 3. Scope
Included:
- canonical snapshot modeling for active timer, `custom play`, and playlist runtime state
- restoration rules for relaunch and foreground recovery where the saved session can still be reconstructed truthfully
- direct numeric entry for timer duration, interval minutes, and manual-log duration
- calm validation and sanitization behavior for duration-style fields
- a Settings draft workflow for timer defaults with explicit save and reset actions
- clearer presentation copy for local-only, configured-backend, and backend-unavailable states
- focused native tests for restoration, numeric entry, and presentation behavior
- durable iOS and repo docs required by these changes

Excluded:
- unrelated media parity work
- broader Home, History, or Summary redesign
- backend contract expansion beyond the existing native sync seam
- new deployment automation

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
- `docs/ios-native/parity-review-2026-04-10.md`
- `prompts/ios-native-runtime-ux-resilience-feature-bundle-with-branching/00-create-branch.md`
- `prompts/ios-native-runtime-ux-resilience-feature-bundle-with-branching/01-implement-ios-native-runtime-ux-resilience.md`

## 5. Affected files and modules
- `ios-native/Sources/MeditationNativeCore/Data/AppSnapshot.swift`
- `ios-native/Sources/MeditationNativeCore/Data/SampleData.swift`
- `ios-native/Sources/MeditationNativeCore/Domain/Models.swift`
- `ios-native/Sources/MeditationNativeCore/Domain/TimerFeature.swift`
- `ios-native/Sources/MeditationNativeCore/Services/AppSyncService.swift`
- `ios-native/MeditationNative/App/MeditationNativeApp.swift`
- `ios-native/MeditationNative/App/ShellSnapshotSupport.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/App/ShellViewModelPresentation.swift`
- `ios-native/MeditationNative/Components/TimerDraftForm.swift`
- `ios-native/MeditationNative/Features/History/HistoryView.swift`
- `ios-native/MeditationNative/Features/Practice/PracticeActiveSections.swift`
- `ios-native/MeditationNative/Features/Settings/SettingsView.swift`
- `ios-native/Tests/MeditationNativeCoreTests/*`
- `ios-native/MeditationNativeTests/*`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- If a timer, `custom play`, or playlist run was active when the app left memory, the app should reopen into that active practice when the saved runtime can still be reconstructed truthfully.
- Recovery should preserve pause state and wall-clock correctness instead of fabricating a fresh runtime.
- Finished or no-longer-valid active snapshots should clear quietly rather than reviving stale sessions.
- Timer duration, interval minutes, and manual-log duration should support direct numeric entry while remaining touch-friendly and calm on iPhone.
- Validation should stay human-readable and avoid noisy warnings while still rejecting zero or invalid interval values.
- Settings should let the user review timer-default changes and choose explicit `Save` or `Reset` actions instead of persisting every edit immediately.
- Local-only mode should read as an intentional profile choice.
- Backend-unavailable and offline states should remain clearly distinct from local-only mode.

## 7. Data and state model
- Extend the persisted app snapshot with an optional active-runtime snapshot that can encode:
  - active timer session
  - active `custom play` session
  - active playlist session
- Keep runtime snapshots canonical and directly reconstructable from the existing active-session models rather than inventing parallel timer math.
- Persist active runtime updates when sessions start, pause, resume, advance playlist phase, or finish.
- Clear the persisted runtime snapshot immediately when a session ends or becomes invalid.
- Keep Settings timer defaults split into:
  - persisted snapshot-backed defaults
  - a screen-local draft used for explicit save and reset actions
- Keep numeric-entry sanitization view-local where possible, while validation rules stay in the shared timer and manual-log helpers.

## 8. Risks
- Runtime restoration can create trust issues if pause timing or completion math drifts after relaunch.
- Persisting runtime snapshots too often or too loosely could race with existing snapshot saves and sync-state updates.
- Playlist restoration needs to preserve both phase and current item truthfully, especially across gap phases.
- Adding screen-local timer-default drafts must not break existing Home quick-start or Practice timer-start flows that rely on the persisted snapshot.
- App-target tests and Swift package tests both need to stay green after model-shape changes.

## 9. Milestones
1. Add persisted active-runtime snapshot modeling plus normalization and restoration helpers.
2. Wire `ShellViewModel` to save, restore, advance, and clear active runtime state safely for timer, `custom play`, and playlist.
3. Replace Stepper-only duration controls with direct numeric entry plus calm sanitization for timer and manual-log flows.
4. Add explicit Settings save or reset behavior for timer defaults and update sync or environment copy for local-only clarity.
5. Update focused tests and durable docs.

## 10. Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-runtime-ux-resilience CODE_SIGNING_ALLOWED=NO build`
- Run repo-wide frontend checks only if shared contracts or durable docs require broader validation:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Manual follow-up if possible:
  - relaunch recovery for timer, `custom play`, and playlist on simulator or device
  - numeric-entry ergonomics on iPhone-sized UI
  - local-only versus configured-backend versus backend-unavailable copy on device

## 11. Decision log
- 2026-04-10: Use one persisted active-runtime snapshot inside `AppSnapshot` rather than a second standalone runtime file.
- 2026-04-10: Keep active-session restoration truth-preserving; if required data is missing, clear the stale snapshot instead of guessing.
- 2026-04-10: Bring the calmer web-style timer-default contract to native through explicit save and reset actions rather than immediate persistence.
- 2026-04-10: Add direct numeric entry without removing helpful stepper affordances where they still support touch use.
- 2026-04-10: Restart restored audio-backed sessions from the saved elapsed offset when playback can be resumed truthfully after relaunch.
- 2026-04-10: Reject invalid timer-default saves in Settings instead of persisting malformed defaults just because direct numeric entry now allows `0` during editing.

## 12. Progress log
- 2026-04-10: Reviewed required repo docs, native iOS README, parity review, current branch state, and the full bundle prompt sequence.
- 2026-04-10: Confirmed parent branch `codex/ios` is safe and created feature branch `codex/ios-native-runtime-ux-resilience-feature-bundle-with-branching`.
- 2026-04-10: Inspected current native shell, runtime, snapshot, Practice, History, Settings, and presentation code to identify the bounded seams for recovery, numeric entry, and timer-default workflow changes.
- 2026-04-10: Added persisted active-runtime modeling plus snapshot normalization for timer, `custom play`, and playlist recovery.
- 2026-04-10: Updated the native shell to restore recoverable runtime state on launch, clear stale sessions, and keep audio-backed recovery aligned through saved playback offsets where possible.
- 2026-04-10: Replaced Stepper-only timer and manual-log duration entry with direct numeric entry plus quick-adjust controls.
- 2026-04-10: Switched Settings timer defaults to an explicit save or reset workflow and made local-only sync copy read as intentional device behavior.
- 2026-04-10: Review found one in-scope gap: invalid timer defaults could still be saved after adding direct numeric entry.
- 2026-04-10: Fixed that gap by validating timer defaults before save and surfacing calm Settings-specific validation copy.
- 2026-04-10: Verification passed with:
  - `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
  - `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-runtime-ux-resilience CODE_SIGNING_ALLOWED=NO build`
  - `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-runtime-ux-resilience-tests CODE_SIGNING_ALLOWED=NO build-for-testing`
- 2026-04-10: Remaining follow-up is concrete simulator or physical-iPhone validation for relaunch recovery, background completion, notifications, and audio-backed session recovery.
