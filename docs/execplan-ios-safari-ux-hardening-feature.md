# ExecPlan: iOS Safari UX Hardening

## 1. Objective
Harden the fixed-timer experience for iPhone Safari by adding explicit notification-permission UX, narrowing Safari-specific guidance to relevant contexts, explaining deferred completion after foreground catch-up, and coalescing foreground catch-up events.

## 2. Why
The current lock-screen mitigation improves timer correctness after Safari returns to the foreground, but it still leaves avoidable trust gaps:
- notification fallback is not discoverable
- Safari guidance is noisy on unrelated platforms
- users are not told when completion was deferred until foreground return
- overlapping foreground events can trigger duplicate catch-up work

## 3. Scope
Included:
- timer runtime/platform helper for targeted Safari guidance
- notification capability and permission helper with user-controlled request flow in Settings
- fixed-timer setup and active-flow guidance targeting
- deferred-completion outcome messaging
- foreground catch-up coalescing for `visibilitychange` and `pageshow`
- focused tests and required docs

Excluded:
- native runtime dependencies
- broader audio/runtime refactors
- non-timer feature changes

## 4. Source documents
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
- `docs/review-ios-safari-ux-issues.md`
- `prompts/run-milestone-bundle.md`
- `prompts/ios-safari-ux-hardening-feature-bundle-with-branching/*.md`

## 5. Affected files and modules
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerReducer.ts`
- `src/features/timer/TimerContext.test.tsx`
- `src/pages/PracticePage.tsx`
- `src/pages/ActiveTimerPage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/ActiveTimerPage.test.tsx`
- `src/pages/SettingsPage.test.tsx`
- new focused helpers/tests under `src/utils/` or `src/features/timer/`
- docs and verification artifacts under `docs/` and `requirements/`

## 6. UX behavior
- Settings shows current timer-notification capability and permission state.
- Settings provides an explicit, optional action to request notification permission when supported.
- Fixed-timer Safari guidance appears only for likely relevant iPhone Safari browser contexts.
- If a fixed timer finalizes through foreground catch-up, the completion UI explains that the scheduled end was reached while Safari was in the background.
- Foreground return handling stays calm and single-shot even if both `visibilitychange` and `pageshow` fire close together.

## 7. Data and state model
- Extend timer outcome metadata to note deferred completion after foreground catch-up.
- Keep timer settings persistence unchanged.
- Keep notification capability detection derived from runtime APIs rather than persisted state.
- Keep foreground coalescing ephemeral in-memory via a ref/helper window, not storage.

## 8. Risks
- User-agent heuristics can be imperfect, so guidance should be framed as likely iPhone Safari behavior rather than hard guarantees.
- Notification APIs differ across browser contexts, so helpers must degrade safely when APIs are absent.
- Timer completion changes must not regress existing end-sound or session-log behavior.

## 9. Milestones
1. Add runtime and notification helpers plus foreground coalescing helper.
2. Wire timer state to preserve deferred-completion metadata.
3. Update Practice, Active Timer, and Settings UX.
4. Add focused tests for helper logic and user-visible behavior.
5. Update docs, review, and verification artifacts.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- focused timer/page tests for:
  - notification capability and request states
  - Safari guidance targeting
  - deferred-completion status messaging
  - foreground coalescing behavior

## 11. Decision log
- Prefer web-only hardening over native expansion for this slice.
- Reuse lightweight runtime helpers instead of pushing platform logic into JSX.
- Model deferred completion as outcome metadata so UI messaging stays declarative.

## 12. Progress log
- 2026-04-03: Reviewed bundle prompts, repo docs, and current timer implementation. Branch `fix/ios-safari-ux-hardening` created from `main` at `9facebf`.
- 2026-04-03: Implemented timer runtime detection, Settings notification permission UX, deferred-completion outcome messaging, and foreground catch-up coalescing with focused tests.
- 2026-04-03: Review completed with no blocker, high, or medium findings. Verification completed with `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
