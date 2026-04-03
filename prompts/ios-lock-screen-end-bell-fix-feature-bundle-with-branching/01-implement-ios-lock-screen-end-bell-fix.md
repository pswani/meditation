# 01-implement-ios-lock-screen-end-bell-fix.md

## Objective
Fix the iOS Safari lock-screen end-bell defect with a practical, user-trustworthy approach.

## Problem statement
Observed behavior on iPhone Safari:
- Timer completes while phone is locked.
- End bell does not play at completion time.
- End bell plays immediately when Safari is foregrounded.

## Constraints and reality check
- Browser JS timers are throttled/suspended in background lock states on iOS Safari.
- Start/interval/end sound priming helps autoplay policy but does not guarantee lock-screen scheduling.
- A web-only fix cannot guarantee reliable lock-screen end-bell playback in all iOS states.

## Branching strategy
Pick one track and implement fully.

### Track A (Recommended): web-first trust fix
Deliver a robust web mitigation without introducing native runtime requirements.

Required scope:
1. Add explicit foreground catch-up behavior:
   - On `visibilitychange` and `pageshow`, force timer sync evaluation immediately.
   - Ensure session completion and logging happen deterministically as soon as app is foregrounded.
2. Add user-facing guidance:
   - Calm inline copy in timer setup or active timer describing iOS lock limitation.
   - Keep wording concise and non-alarmist.
3. Add optional completion fallback:
   - If browser Notification API permission is granted and app supports it, issue completion notification when possible.
   - Degrade silently when unavailable.
4. Keep architecture clean:
   - Do not bury platform checks inside large JSX trees.
   - Prefer small utility/helper for runtime capability detection.

### Track B: native reliability path (Capacitor)
Only if explicitly requested for this slice.

Required scope:
1. Introduce native shell capability for local notifications/background-safe completion alerts.
2. Keep timer domain logic reusable; isolate runtime adapter layer.
3. Preserve current web behavior while adding native capability checks.
4. Document native setup/dev workflow.

## Validation requirements
- Timer duration > 0 and meditation type required behavior remains unchanged.
- Completion log correctness remains unchanged.
- Pause/resume correctness remains unchanged.

## Required tests/checks
- Add/update focused tests for:
  - foreground catch-up completion behavior
  - no duplicate end bell or duplicate completion log on resume/foreground events
  - messaging visibility for iOS limitation (if implemented in UI)
- Run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`

## Documentation updates
If Track A:
- Update docs/ux-spec.md with user-facing expectation around iOS lock behavior.
- Update requirements/decisions.md with chosen mitigation decision.

If Track B:
- Update docs/architecture.md and README.md for native integration boundaries.
- Update requirements/decisions.md with runtime-platform decision.

In all cases:
- Update requirements/session-handoff.md with what was implemented and remaining gaps.

## Commit guidance
Use a clear commit message, e.g.:
- `fix(timer): mitigate ios lock-screen end bell deferral`
- `feat(runtime): add native completion notifications for timer`
