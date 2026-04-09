# ExecPlan: Native iOS Timer And History

## 1. Objective
Build the first complete native iPhone meditation journey under `ios-native/`: configure a meditation, run a fixed-duration or open-ended session, create truthful local `session log` records, add manual logs, review them in History, and expose timer-default plus notification guidance in Settings.

## 2. Why
The native foundation milestone established shell structure and local persistence, but the app still behaves like a sample-data preview. This milestone turns the native track into a usable on-device prototype for the app's core practice loop while keeping the work local-first and iPhone-focused.

## 3. Scope
Included:
- fixed-duration and open-ended timer setup
- meditation type selection
- optional start, end, and interval sounds
- validation for timer setup and manual logs
- active timer runtime with pause, resume, and end flows
- automatic `session log` creation from timer outcomes
- manual log creation
- History rendering with recent logs, source badges, and basic filters
- Settings controls for timer defaults plus notification capability and permission messaging
- local notification scheduling where practical for fixed-duration completion

Excluded:
- `custom play`
- playlist
- summary
- `sankalpa`
- backend sync
- iPad-specific layout work beyond keeping the iPhone-first implementation clean

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
- `prompts/ios-native-timer-history-feature-bundle-with-branching/*.md`

## 5. Affected Files And Modules
Expected additions or changes:
- `ios-native/Sources/MeditationNativeCore/Domain/`
- `ios-native/Sources/MeditationNativeCore/Data/`
- `ios-native/Sources/MeditationNativeCore/Services/`
- `ios-native/MeditationNative/App/`
- `ios-native/MeditationNative/Features/Practice/`
- `ios-native/MeditationNative/Features/History/`
- `ios-native/MeditationNative/Features/Settings/`
- `ios-native/MeditationNative/Features/Home/`
- `ios-native/Tests/MeditationNativeCoreTests/`
- `ios-native/MeditationNativeUITests/`
- `ios-native/MeditationNative.xcodeproj/project.pbxproj`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-ios-native-timer-history-feature.md`
- `docs/test-ios-native-timer-history-feature.md`

## 6. UX Behavior
- Practice becomes the primary timer setup surface for this milestone.
- Fixed-duration stays the default mode; open-ended remains available with clear copy.
- Meditation type is required.
- Advanced sounds stay grouped and optional.
- Invalid timer setups and manual logs show clear, calm inline validation.
- Active timer clearly distinguishes countdown from elapsed-time display.
- Pause, resume, and end actions remain prominent and uncluttered.
- Manual log entry lives near History so users can add off-app practice without leaving the milestone's core flow.
- History emphasizes recent entries, source badges, duration, status, and key filters without becoming dense.
- Settings exposes only the timer-default and notification surfaces needed now.
- Notification copy explains capability and permission state explicitly without overstating background guarantees.

## 7. Data And State Model
- Keep `AppSnapshot` as the durable local-first persistence boundary.
- Extend shared native models to support:
  - timer validation output
  - timer sound options
  - active session snapshots or runtime inputs
  - manual log input normalization
  - `session log` details such as planned duration when useful for truthful History display
- Keep active timer state in app memory, derived from start times plus pause bookkeeping rather than trusting ticking counters.
- Persist timer defaults and created `session log` entries back through the existing JSON snapshot repository.
- Keep notification permission state runtime-derived from `UNUserNotificationCenter`, not stored in the snapshot.

## 8. Risks
- Local notifications on simulator and in-app foreground states can be inconsistent; the UX should treat them as best-effort support rather than the source of truth.
- Timer correctness can drift if the runtime uses incremental counters instead of wall-clock timestamps.
- Manual-log validation can easily diverge from product language if it becomes form-library driven instead of domain-helper driven.
- Xcode project changes are easy to break when adding many new files; prefer a bounded set of additions.
- History clarity can regress on iPhone if filtering or badges crowd the list rows.

## 9. Milestones
1. Define shared native timer, sound, and `session log` domain helpers plus persistence operations.
2. Build app-level native state management for editing timer defaults, running sessions, saving logs, and reading notification capability.
3. Implement Practice timer setup and active runtime UI.
4. Implement History list, filters, and manual log entry UI.
5. Implement Settings timer-default and notification messaging UI.
6. Add focused unit tests and lightweight UI coverage.
7. Run build and test verification, then update review, test, and durable docs.

## 10. Verification
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`
- `swift test --package-path ios-native`
- review the timer journey in simulator if build and tests pass

## 11. Decision Log
- Use the existing JSON snapshot repository as the persistence seam for milestone 2 instead of introducing SwiftData midstream.
- Prefer wall-clock timer calculations plus local notifications for trustworthy fixed-session timing over timer-tick-only countdown math.
- Keep sound choices fixed and label-based for now so the native flow matches product terminology without opening media-management scope early.

## 12. Progress Log
- 2026-04-09: Reviewed repo guidance, native phased plan, current foundation code, and milestone bundle prompts.
- 2026-04-09: Confirmed `codex/ios` as the safe parent branch and created `codex/ios-native-timer-history-feature-bundle-with-branching`.
- 2026-04-09: Drafted this ExecPlan before beginning substantial native code changes.
