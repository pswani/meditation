# ExecPlan: Native Bell Reliability

## Objective
Make the native iPhone app deliver start, interval, and end bells more reliably during timer and bells-only `custom play` sessions, including under the silent switch, while locked, and while other audio is already playing, and remove the current XCTest flake that leaves the iOS suite failing with an unexpected process exit.

## Why
The current iPhone implementation is not trustworthy enough for real meditation use. Interval bells can be lost when iOS backgrounds or locks the app because cue delivery depends on the app staying runnable, and the current simulator test workflow is unstable because an unexpected native process exit still marks the suite failed even when the visible tests later pass.

## Scope
Included:
- native playback-session policy updates for bell audibility alongside other audio
- a native background-audio keepalive for timer and bells-only `custom play` sessions that need delayed cue delivery
- wiring that keepalive into timer and `custom play` start, pause, resume, restore, and finish paths
- focused native tests for keepalive lifecycle behavior
- fixing the current native XCTest flake surfaced by the latest `.xcresult`

Excluded:
- backend contract changes
- web app audio changes
- broad playlist-audio redesign beyond what this slice needs
- a full native audio-engine rewrite for all recording playback paths

## Source Documents
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `PLANS.md`
- `docs/ios-native/README.md`

## Affected Files And Modules
- `ios-native/MeditationNative/App/SystemSupport.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNativeTests/ShellViewModelTests.swift`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## UX Behavior
- Fixed-duration timer sessions with selected interval and end bells should keep cue delivery active while the phone is locked.
- Selected bells should still play when the phone silent switch is on.
- Timer and bells-only `custom play` sessions should not lose delayed bells just because another audio app is already playing.
- Pause should stop delayed cue delivery; resume should restore it from the remaining session state.
- Early end should stop keepalive audio immediately and avoid stray delayed bells.

## Data And State Model
- No persisted product-model changes are planned.
- The new background-audio keepalive is runtime-only and should derive its behavior from existing active session state.
- The test stabilization change should keep the same test coverage while removing the current sendability-related flake.

## Risks
- Background-audio keepalive logic can accidentally leave the audio session active after a session ends.
- More aggressive playback-session options can affect how other audio apps duck or recover.
- Runtime keepalive wiring can duplicate bells if the existing completion paths are not coordinated carefully.
- Test-stability fixes must remove the flake without hiding a real native crash.

## Milestones
1. Add runtime support for reliable playback-session activation and silent keepalive audio.
2. Wire keepalive lifecycle into timer and bells-only `custom play` flows.
3. Add regression tests for keepalive activation and teardown.
4. Fix the current iOS XCTest flake identified from the xcresult.
5. Re-run native verification and update durable docs.

## Verification
- `./scripts/test-iPhone-simulator.sh`
- `swift test --package-path ios-native`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Decision Log
- 2026-04-24: Prefer a focused background-audio keepalive over a full cue-scheduling rewrite so the fix stays bounded to the reliability gap we reproduced.
- 2026-04-24: Keep the existing notification and bridge fallback paths as layered safety nets instead of replacing them in this slice.

## Progress Log
- 2026-04-24: Read required product, architecture, UX, roadmap, decision, handoff, and native iOS docs.
- 2026-04-24: Reproduced the current iOS test workflow and confirmed the suite returns code `65` because XCTest records an unexpected process exit even though the visible tests later pass.
- 2026-04-24: Identified the current bell-delivery gap: delayed cue playback depends on the app staying runnable, while the native audio session is only configured for mixed playback and does not keep timer-only sessions alive under lock.
