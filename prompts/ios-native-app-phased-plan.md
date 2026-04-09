# Native iOS App Phased Plan

This plan sequences the native iPhone app work into bounded prompt bundles that can be executed one milestone at a time without losing the product's calm, local-first character.

Read before running any bundle:
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
- `prompts/ios-native-app-step-by-step.md`
- `docs/ios-native/README.md`

## Native iOS Direction

- Build the iPhone app as a separate SwiftUI codebase under `ios-native/`.
- Keep the same product vocabulary and primary destinations:
  - Home
  - Practice
  - History
  - Goals
  - Settings
- Start local-first on device so the app is usable on an iPhone before backend sync is added.
- Prefer Apple-native frameworks first:
  - SwiftUI
  - SwiftData or another documented Apple-native persistence layer
  - AVFoundation
  - UserNotifications
- Add backend sync only after the core iPhone journeys are working reliably on device and simulator.

## Execution Order

### Milestone 1
- Bundle: `ios-native-foundation-feature-bundle-with-branching`
- Goal: create the native iOS workspace, app shell, domain foundations, local persistence boundary, and Xcode-friendly project structure.
- Primary outcomes:
  - `ios-native/` app target and tests exist
  - calm SwiftUI shell for iPhone is runnable in simulator and on device
  - shared domain models and sample data are established
  - local persistence strategy is in place
  - Xcode setup and run docs are updated

### Milestone 2
- Bundle: `ios-native-timer-history-feature-bundle-with-branching`
- Goal: deliver the first complete on-device meditation journey with timer setup, active timer, settings defaults, auto logging, manual logging, and History.
- Primary outcomes:
  - fixed-duration and open-ended timer flow
  - meditation type validation
  - optional start, end, and interval sounds
  - pause, resume, and early end behavior
  - local notifications where appropriate
  - session-log creation and History rendering

### Milestone 3
- Bundle: `ios-native-custom-play-playlist-feature-bundle-with-branching`
- Goal: add audio-backed `custom play` and playlist journeys on top of the timer and logging foundations.
- Primary outcomes:
  - `custom play` creation and playback
  - playlist editing and ordered playback
  - per-item or per-session logging behavior stays explicit
  - calm empty states and local media guidance for iPhone

### Milestone 4
- Bundle: `ios-native-summary-sankalpa-feature-bundle-with-branching`
- Goal: complete the reflective side of the app with summaries, Home progress context, and `sankalpa` management.
- Primary outcomes:
  - Home becomes meaningfully useful on iPhone
  - summary aggregation from local `session log` history
  - `sankalpa` creation, editing, progress, and observance tracking
  - clear goal-state sections and calm manual check-ins

### Milestone 5
- Bundle: `ios-native-sync-polish-feature-bundle-with-branching`
- Goal: connect the iPhone app to the existing backend where appropriate, then harden the native app for real-device use and release preparation.
- Primary outcomes:
  - configurable API base URL and environment handling
  - sync boundaries aligned with existing REST surfaces where practical
  - conflict and offline guidance stays explicit and calm
  - real-device QA, signing notes, and release-readiness docs improve

## Global Guardrails

1. Keep the native iOS app a separate client instead of replacing the existing web app.
2. Preserve the exact product terminology already used in this repo:
   - meditation type
   - custom play
   - playlist
   - session log
   - manual log
   - sankalpa
   - summary
3. Prioritize iPhone quality first, then widen to iPad only when a milestone explicitly benefits from it.
4. Keep the app useful without backend connectivity until the sync milestone intentionally expands scope.
5. Prefer vertical slices that end in a real user journey, not shell-only scaffolding.
6. Keep documentation current after each milestone:
   - `requirements/decisions.md`
   - `requirements/session-handoff.md`
   - `docs/ios-native/README.md`
   - milestone-specific ExecPlan, review, and test artifacts

## Expected Durable Artifacts

- `docs/execplan-ios-native-foundation-feature.md`
- `docs/review-ios-native-foundation-feature.md`
- `docs/test-ios-native-foundation-feature.md`
- `docs/execplan-ios-native-timer-history-feature.md`
- `docs/review-ios-native-timer-history-feature.md`
- `docs/test-ios-native-timer-history-feature.md`
- `docs/execplan-ios-native-custom-play-playlist-feature.md`
- `docs/review-ios-native-custom-play-playlist-feature.md`
- `docs/test-ios-native-custom-play-playlist-feature.md`
- `docs/execplan-ios-native-summary-sankalpa-feature.md`
- `docs/review-ios-native-summary-sankalpa-feature.md`
- `docs/test-ios-native-summary-sankalpa-feature.md`
- `docs/execplan-ios-native-sync-polish-feature.md`
- `docs/review-ios-native-sync-polish-feature.md`
- `docs/test-ios-native-sync-polish-feature.md`

## Suggested Runner Usage

Use the shared runner with one bundle at a time:

- `Read prompts/run-milestone-bundle.md and execute it for ios-native-foundation-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for ios-native-timer-history-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for ios-native-custom-play-playlist-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for ios-native-summary-sankalpa-feature-bundle-with-branching.`
- `Read prompts/run-milestone-bundle.md and execute it for ios-native-sync-polish-feature-bundle-with-branching.`
