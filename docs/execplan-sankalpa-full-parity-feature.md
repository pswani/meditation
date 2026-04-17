# ExecPlan: Sankalpa Full Parity Feature

## Objective
Bring recurring weekly `sankalpa` cadence support to the native iPhone app so web, backend, and iOS all support the same meditation-derived goal model, sync contract, progress math, and calm UX.

## Why
The web app and backend already support recurring goals like "at least 15 minutes on 5 days each week for 4 weeks," but iPhone still behaves like `sankalpa` is cumulative-only. That parity gap makes sync incomplete and makes Home and Goals less trustworthy on native.

## Scope
- add recurring cadence fields and progress evidence to the native `sankalpa` model
- support recurring cadence in native draft editing, validation, and save flows
- derive recurring progress, completion, expiration, and archived behavior from the same weekly-threshold rules used on web and backend
- round-trip recurring fields through native sync fetch and mutation requests
- update native Goals and Home copy so recurring goals stay readable on iPhone
- add focused native core, sync, and UI coverage
- update durable docs and slice review/test artifacts

## Explicit Exclusions
- reminder or notification work
- unrelated History, audio, or navigation changes
- broad redesign beyond `sankalpa` parity

## Source Documents
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
- `docs/execplan-sankalpa-threshold-frequency-goals-feature.md`
- `docs/review-sankalpa-threshold-frequency-goals-feature.md`
- `docs/test-sankalpa-threshold-frequency-goals-feature.md`
- `prompts/sankalpa-full-parity-feature-bundle-with-branching/*`

## Parent Branch And Working Branch
- Parent branch: `codex/defects-enhancements-16Apr`
- Working branch: `codex/sankalpa-full-parity-feature-bundle-with-branching`
- Note: `codex/sankalpa-full-parity-feature` already existed as a merged stale branch tip, so this bundle run uses the bundle-default branch name to keep the work isolated.

## Affected Files And Modules
- `ios-native/Sources/MeditationNativeCore/Domain/Models.swift`
- `ios-native/Sources/MeditationNativeCore/Domain/TimerFeature.swift`
- `ios-native/Sources/MeditationNativeCore/Services/AppSyncService.swift`
- `ios-native/MeditationNative/Features/Goals/GoalsView.swift`
- `ios-native/MeditationNative/Features/Home/HomeView.swift`
- `ios-native/Tests/MeditationNativeCoreTests/DomainModelTests.swift`
- `ios-native/Tests/MeditationNativeCoreTests/AppSyncServiceTests.swift`
- `ios-native/MeditationNativeUITests/MeditationNativeUITests.swift`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-sankalpa-full-parity-feature.md`
- `docs/test-sankalpa-full-parity-feature.md`

## UX Behavior
- meditation-derived goals on iPhone can choose between cumulative totals and recurring weekly cadence
- recurring duration goals describe a daily qualifying threshold, required qualifying days per week, and number of weeks
- recurring session-count goals use the same weekly cadence flow with session logs as the threshold unit
- Goals cards show compact recurring progress such as weeks met plus week-by-week status pills
- Home shows a calm recurring snapshot without expanding into a habit dashboard
- existing cumulative and `observance-based` goals remain unchanged and compatible

## Data And State Model
- extend native `Sankalpa` with optional `qualifyingDaysPerWeek`
- extend native `SankalpaDraft` with:
  - `cadenceMode`
  - `weeks`
  - `qualifyingDaysPerWeek`
- extend native `SankalpaProgress` with:
  - `metRecurringWeekCount`
  - `targetRecurringWeekCount`
  - `recurringWeeks`
- add a native recurring-week progress shape matching the backend and web concepts:
  - week index
  - start and end local dates
  - qualifying-day count
  - required qualifying-day count
  - status (`met`, `active`, `missed`, `upcoming`)
- preserve `targetValue` and `days` semantics from the web model:
  - cumulative mode keeps current total-target behavior
  - recurring mode uses `targetValue` as the daily threshold and `days` as whole weeks times 7

## Risks
- local-date week bucketing must stay aligned with the web/backend model
- existing local snapshots must decode cleanly when recurring fields are absent
- native sync should not drop recurring fields when fetching or replaying `sankalpa` writes
- recurring copy needs to stay readable in narrow iPhone layouts

## Milestones
1. Add native recurring cadence fields and progress math in `MeditationNativeCore`.
2. Update native sync decoding and encoding for recurring goal fields and progress evidence.
3. Update Goals and Home iPhone surfaces for recurring editor and summary parity.
4. Add focused native tests for validation, progress math, sync round-trip, and UI affordances.
5. Run the required verification, capture results, and fix any remaining issues.

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- backend verification covering `sankalpa` persistence and progress behavior
- `swift test --package-path ios-native`
- relevant native Xcode build verification for updated Goals and Home flow

## Decision Log
- 2026-04-17: Keep native recurring cadence additive to the existing `sankalpa` model rather than inventing a new goal type, matching the existing web/backend design.
- 2026-04-17: Reuse the bundle-default branch name because the prompt’s shorter suggested branch already existed and had been merged into the current parent branch.

## Progress Log
- 2026-04-17: Read the required repo and product docs, the milestone bundle runner, and the full `sankalpa` parity bundle prompts.
- 2026-04-17: Audited current web, backend, and native `sankalpa` behavior and confirmed the parity gap is native-only: no recurring cadence fields, progress math, sync mapping, or iPhone UI support.
- 2026-04-17: Created `codex/sankalpa-full-parity-feature-bundle-with-branching` from `codex/defects-enhancements-16Apr`.
- 2026-04-17: Implemented native recurring-cadence parity across the iPhone `sankalpa` model, progress math, sync request and response mapping, and calm Goals and Home recurring-goal presentation.
- 2026-04-17: Added focused native regression coverage for recurring validation, active/completed/expired/archived weekly progress math, and sync payload mapping.
- 2026-04-17: Completed the review pass with no remaining findings and documented the residual manual iPhone and timezone QA risk in `docs/review-sankalpa-full-parity-feature.md`.
- 2026-04-17: Verified the slice with `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`, `swift test --package-path ios-native`, and `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' build`.
