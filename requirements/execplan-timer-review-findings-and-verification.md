# ExecPlan: Timer Review Findings And Verification

## Objective
Fix the critical and important issues from the timer defaults/runtime review, then verify the full defect-remediation bundle end to end.

## Why
The timer remediation work is largely solid, but the review found two important remaining risks in the timer-settings sync path:
- online hydration can let stale local timer settings outvote the backend without proof of unsynced local intent
- timer-settings queue reconciliation can refresh mutation timestamps and bypass the new normalization rules for queued payloads

Those issues are small in surface area but high leverage because they affect backend trust, offline replay, and migration safety.

## Scope
Included:
- timer-settings hydration and queue reconciliation fixes from the review
- focused timer-settings normalization cleanup needed to keep queued payloads safe
- regression tests for:
  - Settings default timer persistence
  - Practice draft behavior coverage already protected by the bundle
  - Home quick start and queued timer-settings sync behavior
  - active timer/runtime compatibility already covered by the bundle
  - validation and `session log` correctness regressions as needed
- doc updates for decisions and handoff

Excluded:
- unrelated product expansion
- broad refactors without a direct review-driven payoff
- nice-to-have-only review items unless they become necessary to land the important fixes safely

## Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `docs/review-timer-defaults-and-runtime-defects.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/timer-defaults-and-runtime-defects-with-branching/05-fix-review-findings-and-verify.md`

## Affected files and modules
- `src/features/timer/TimerContext.tsx`
- `src/utils/timerSettingsNormalization.ts`
- `src/utils/timerSettingsApi.ts`
- `src/utils/storage.ts`
- focused regression tests in `src/App.test.tsx` and any timer-settings helper tests that need updating

## Behavior and validation
- Backend timer settings should remain authoritative online unless the browser has an actual queued timer-settings mutation to replay.
- Existing queued timer-settings mutations must preserve their original `queuedAt` ordering metadata when the queued meaning has not changed.
- Queued timer-settings payloads must normalize through the same rules as storage/API timer settings before they re-enter runtime state or sync back to the backend.
- Existing timer validation and `session log` guardrails from prompt 03 must remain intact.

## Data and sync model
- Treat the sync queue as the only proof that the browser has unsynced timer-settings intent worth promoting over the backend.
- Preserve the original `queuedAt` timestamp for the same unsynced timer-settings change, because backend stale-write protection depends on it.
- Normalize timer settings consistently across storage, API, and queue-backed hydration paths.

## Risks
- Queue reconciliation changes must not starve legitimate later timer-settings edits from being enqueued.
- Hydration changes must not regress offline-first behavior when a real queued timer-settings change exists.
- Regression coverage needs to exercise queue-backed and backend-backed timer settings clearly enough to catch ordering mistakes.

## Milestones
1. Add the plan and inspect the reviewed timer-settings sync path.
2. Fix online hydration so remote settings win unless a real queued timer-settings mutation exists.
3. Preserve queued timer-settings metadata while normalizing queued payloads safely.
4. Add focused regression tests for stale-local override prevention and queued timer-settings replay.
5. Run verification, update docs, and commit.

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- backend verification only if the reviewed fixes change backend contracts

## Decision log
- Use the sync queue itself, not the coincidence of “remote equals defaults,” as the signal that local timer settings should be replayed over backend state.
- Normalize queued timer-settings payloads and preserve their original queue timestamp so migration safety and stale-write protection stay aligned.

## Progress log
- 2026-03-31: Reviewed the prompt-04 findings, identified the timer-settings hydration/queue code paths involved, and scoped the fix to the two important sync-safety issues plus regression coverage.
