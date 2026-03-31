# ExecPlan: Timer Validation And Log Guards

## Objective
Fix the remaining timer correctness defects around fixed-duration validation, session-log duration guards, and legacy/default timer-settings normalization.

## Why
The current timer flow still has a few trust gaps:
- fixed-mode validation can accept incomplete legacy-shaped settings too easily
- timer-settings normalization does not consistently recover a safe fixed duration from older or partial payloads
- timer-settings equality compares raw shapes instead of normalized meaning
- auto-log duration clamping does not fully guard against malformed derived values

These are small defects, but they affect whether timer state, logs, and backend sync stay truthful.

## Scope
Included:
- timer settings validation helpers
- timer settings API/storage normalization and equality behavior
- session-log duration clamp guards for timer-generated logs
- focused timer-mode-safe cleanup in immediate support code
- regression tests for the corrected behavior

Excluded:
- broader timer UX redesign
- new timer features
- unrelated history, summary, playlist, or backend refactors

## Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/timer-defaults-and-runtime-defects-with-branching/03-fix-timer-validation-and-log-guards.md`

## Affected files and modules
- `src/utils/timerValidation.ts`
- `src/utils/sessionLog.ts`
- `src/utils/timerSettingsApi.ts`
- `src/utils/storage.ts`
- immediate timer runtime support in `src/features/timer/timerReducer.ts`
- focused tests in:
  - `src/utils/timerValidation.test.ts`
  - `src/utils/sessionLog.test.ts`
  - `src/utils/timerSettingsApi.test.ts`
  - `src/utils/storage.test.ts`

## UX behavior
- Fixed-duration timer settings surface a duration error whenever the current fixed duration is missing, zero, negative, or otherwise invalid.
- Interval validation remains tied to the current fixed duration for fixed sessions.
- Auto-generated `session log` entries never record more completed time than the intended fixed duration.
- Older or partial timer-settings payloads normalize into safe defaults before they drive UI, sync, or equality checks.

## Data and state model
- Treat `durationMinutes` as the current fixed-duration value that must be valid when `timerMode = "fixed"`.
- Treat `lastFixedDurationMinutes` as a recovery fallback for legacy/default normalization and for switching back from open-ended mode.
- Normalize timer settings at API and local-storage boundaries before equality checks or reducer/runtime use.
- Keep the session-log model unchanged while hardening duration derivation.

## Risks
- Compatibility fixes must not weaken current fixed-duration validation in Practice or Settings.
- Equality normalization must reduce noisy updates without masking real timer-settings changes.
- Storage/API compatibility logic must stay bounded and not invent broader migration behavior.

## Milestones
1. Add the plan and inspect validation, storage, API, and session-log helpers.
2. Centralize fixed-duration normalization rules for legacy/default timer payloads.
3. Tighten fixed-mode validation and session-log duration guarding.
4. Add focused regression tests for normalization, equality, validation, and log clamps.
5. Run verification, update docs, and commit.

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- no backend verification unless timer-settings contracts change

## Decision log
- Keep compatibility recovery at storage/API boundaries instead of weakening the runtime validation helper, so legacy payloads normalize safely while current fixed-mode edits still fail fast when invalid.
- Compare timer settings by normalized meaning, not raw payload shape, because omitted legacy fields should not trigger needless sync churn.

## Progress log
- 2026-03-31: Reviewed the prompt, current timer validation, session-log building, timer-settings API normalization, storage compatibility logic, and backend timer-settings validation before implementation.
